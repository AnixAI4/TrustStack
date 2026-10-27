import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { withPaymentSecurity, type ApiContext } from "@/lib/security/api-guard";
import {
  sanitizeString,
  validatePaymentSignature,
  validateRequestBody,
} from "@/lib/security/validation";
import {
  EXTRA_SCAN_PRICE_PAISE,
  grantScanCredit,
} from "@/lib/scanner/entitlements";
import {
  claimPaymentReceipt,
  finalizePaymentReceipt,
  verifyRazorpayPayment,
} from "@/lib/payments/razorpay";
import { notifyLeadPayment } from "@/lib/payments/razorpay-config";

async function handleConfirm(
  request: NextRequest,
  { user }: ApiContext
): Promise<NextResponse> {
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const bodyValidation = validateRequestBody<{
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }>(body, ["razorpay_order_id", "razorpay_payment_id", "razorpay_signature"]);

  if (!bodyValidation.valid || !bodyValidation.data) {
    return NextResponse.json(
      { error: bodyValidation.error || "Missing payment details" },
      { status: 400 }
    );
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
    bodyValidation.data;

  const sigValidation = validatePaymentSignature(razorpay_signature);
  if (!sigValidation.valid || !sigValidation.sanitized) {
    return NextResponse.json({ error: "Invalid signature format" }, { status: 400 });
  }

  const orderId = sanitizeString(razorpay_order_id, 100);
  const paymentId = sanitizeString(razorpay_payment_id, 100);
  const verification = await verifyRazorpayPayment({
    orderId,
    paymentId,
    signature: sigValidation.sanitized,
    userId: user.id,
    purpose: "extra_scan",
    amountPaise: EXTRA_SCAN_PRICE_PAISE,
  });
  if (!verification.ok) {
    return NextResponse.json(
      { error: verification.error },
      { status: verification.status }
    );
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Server auth is unavailable" }, { status: 503 });
  }
  const claim = await claimPaymentReceipt(admin, {
    orderId,
    paymentId,
    userId: user.id,
    purpose: "extra_scan",
    amountPaise: EXTRA_SCAN_PRICE_PAISE,
  });
  if (!claim.ok) {
    return NextResponse.json({ error: claim.error }, { status: claim.status });
  }

  if (claim.alreadyFulfilled) {
    const { data } = await admin
      .from("user_entitlements")
      .select("scan_credits")
      .eq("user_id", user.id)
      .maybeSingle();
    return NextResponse.json({
      success: true,
      idempotent: true,
      scan_credits: data?.scan_credits ?? 0,
      price_paise: EXTRA_SCAN_PRICE_PAISE,
    });
  }

  const credits = await grantScanCredit(user.id);
  if (credits == null) {
    await finalizePaymentReceipt(admin, claim.id, false, "credit_grant_failed");
    return NextResponse.json(
      { error: "Payment verified but credit grant failed. Contact support." },
      { status: 500 }
    );
  }

  await finalizePaymentReceipt(admin, claim.id, true);

  void notifyLeadPayment({
    product: "extra_scan",
    email: user.email,
    userId: user.id,
    amountPaise: EXTRA_SCAN_PRICE_PAISE,
    paymentId,
  });

  return NextResponse.json({
    success: true,
    scan_credits: credits,
    price_paise: EXTRA_SCAN_PRICE_PAISE,
    message: "1 full-scan credit added to your account.",
  });
}

export const POST = withPaymentSecurity(handleConfirm);
