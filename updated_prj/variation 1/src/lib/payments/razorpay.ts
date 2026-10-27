import crypto from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getRazorpayConfig } from "@/lib/payments/razorpay-config";

export type PaymentPurpose = "pilot_subscription" | "extra_scan" | "template";

type RazorpayOrder = {
  id: string;
  amount: number;
  amount_paid: number;
  currency: string;
  status: string;
  notes?: Record<string, string>;
};

type RazorpayPayment = {
  id: string;
  order_id: string;
  amount: number;
  currency: string;
  status: string;
  captured: boolean;
};

type VerificationInput = {
  orderId: string;
  paymentId: string;
  signature: string;
  userId: string;
  purpose: PaymentPurpose;
  amountPaise: number;
  metadata?: Record<string, string>;
};

type VerificationResult =
  | { ok: true; order: RazorpayOrder; payment: RazorpayPayment }
  | { ok: false; status: number; error: string };

function credentials(): { keyId: string; keySecret: string } | null {
  const config = getRazorpayConfig();
  if (!config.ok) return null;
  return { keyId: config.keyId, keySecret: config.keySecret };
}

function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return (
    leftBuffer.length === rightBuffer.length &&
    crypto.timingSafeEqual(leftBuffer, rightBuffer)
  );
}

async function razorpayGet<T>(path: string): Promise<T | null> {
  const creds = credentials();
  if (!creds) return null;
  const auth = Buffer.from(`${creds.keyId}:${creds.keySecret}`).toString("base64");
  const response = await fetch(`https://api.razorpay.com/v1/${path}`, {
    headers: { Authorization: `Basic ${auth}` },
    cache: "no-store",
  });
  if (!response.ok) return null;
  return (await response.json()) as T;
}

export async function verifyRazorpayPayment(
  input: VerificationInput
): Promise<VerificationResult> {
  const creds = credentials();
  if (!creds) {
    const config = getRazorpayConfig();
    return {
      ok: false,
      status: 503,
      error: config.ok ? "Payment gateway not configured" : config.error,
    };
  }

  const expectedSignature = crypto
    .createHmac("sha256", creds.keySecret)
    .update(`${input.orderId}|${input.paymentId}`)
    .digest("hex");

  if (!safeEqual(input.signature, expectedSignature)) {
    return { ok: false, status: 400, error: "Payment verification failed" };
  }

  const [order, payment] = await Promise.all([
    razorpayGet<RazorpayOrder>(`orders/${encodeURIComponent(input.orderId)}`),
    razorpayGet<RazorpayPayment>(`payments/${encodeURIComponent(input.paymentId)}`),
  ]);

  if (!order || !payment) {
    return { ok: false, status: 502, error: "Could not verify payment with Razorpay" };
  }

  const notes = order.notes ?? {};
  const metadataMatches = Object.entries(input.metadata ?? {}).every(
    ([key, value]) => notes[key] === value
  );
  const valid =
    order.id === input.orderId &&
    payment.id === input.paymentId &&
    payment.order_id === input.orderId &&
    order.amount === input.amountPaise &&
    payment.amount === input.amountPaise &&
    order.amount_paid >= input.amountPaise &&
    order.currency === "INR" &&
    payment.currency === "INR" &&
    order.status === "paid" &&
    payment.status === "captured" &&
    payment.captured === true &&
    notes.user_id === input.userId &&
    notes.product === input.purpose &&
    metadataMatches;

  if (!valid) {
    return { ok: false, status: 400, error: "Payment details do not match this purchase" };
  }

  return { ok: true, order, payment };
}

type ClaimInput = {
  paymentId: string;
  orderId: string;
  userId: string;
  purpose: PaymentPurpose;
  amountPaise: number;
  metadata?: Record<string, string>;
};

export async function claimPaymentReceipt(
  admin: SupabaseClient,
  input: ClaimInput
): Promise<
  | { ok: true; id: string; alreadyFulfilled: boolean }
  | { ok: false; status: number; error: string }
> {
  const { data, error } = await admin
    .from("payment_receipts")
    .insert({
      razorpay_payment_id: input.paymentId,
      razorpay_order_id: input.orderId,
      user_id: input.userId,
      purpose: input.purpose,
      amount_paise: input.amountPaise,
      currency: "INR",
      metadata: input.metadata ?? {},
      status: "processing",
    })
    .select("id")
    .single();

  if (!error && data?.id) {
    return { ok: true, id: data.id, alreadyFulfilled: false };
  }

  if (error?.code !== "23505") {
    return {
      ok: false,
      status: 503,
      error: "Payment receipt ledger is unavailable",
    };
  }

  const { data: existing } = await admin
    .from("payment_receipts")
    .select("id, user_id, purpose, status")
    .eq("razorpay_payment_id", input.paymentId)
    .maybeSingle();

  if (
    existing &&
    existing.user_id === input.userId &&
    existing.purpose === input.purpose &&
    existing.status === "fulfilled"
  ) {
    return { ok: true, id: existing.id, alreadyFulfilled: true };
  }

  return { ok: false, status: 409, error: "Payment has already been used" };
}

export async function finalizePaymentReceipt(
  admin: SupabaseClient,
  receiptId: string,
  fulfilled: boolean,
  failureReason?: string
): Promise<void> {
  await admin
    .from("payment_receipts")
    .update({
      status: fulfilled ? "fulfilled" : "failed",
      fulfilled_at: fulfilled ? new Date().toISOString() : null,
      failure_reason: fulfilled ? null : failureReason?.slice(0, 500) ?? "fulfillment_failed",
    })
    .eq("id", receiptId);
}
