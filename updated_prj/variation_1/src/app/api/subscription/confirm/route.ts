import { NextResponse, NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { withPaymentSecurity, type ApiContext } from "@/lib/security/api-guard";
import {
  validateRequestBody,
  validatePaymentSignature,
  sanitizeString,
} from "@/lib/security/validation";
import {
  claimPaymentReceipt,
  finalizePaymentReceipt,
  verifyRazorpayPayment,
} from "@/lib/payments/razorpay";
import { notifyLeadPayment } from "@/lib/payments/razorpay-config";

const PILOT_PRICE_PAISE = parseInt(process.env.PILOT_PRICE_PAISE || "99900", 10);

async function handleConfirm(
  request: NextRequest,
  { user }: ApiContext
): Promise<NextResponse> {
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json(
      { error: "Server missing SUPABASE_SERVICE_KEY" },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    
    // Validate request body structure
    const bodyValidation = validateRequestBody<{
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
    }>(body, ["razorpay_order_id", "razorpay_payment_id", "razorpay_signature"]);
    
    if (!bodyValidation.valid) {
      return NextResponse.json(
        { error: bodyValidation.error || "Missing payment details" },
        { status: 400 }
      );
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = bodyValidation.data!;

    // Sanitize inputs
    const orderId = sanitizeString(razorpay_order_id, 100);
    const paymentId = sanitizeString(razorpay_payment_id, 100);
    
    // Validate signature format
    const sigValidation = validatePaymentSignature(razorpay_signature);
    if (!sigValidation.valid) {
      return NextResponse.json(
        { error: "Invalid signature format" },
        { status: 400 }
      );
    }

    const verification = await verifyRazorpayPayment({
      orderId,
      paymentId,
      signature: sigValidation.sanitized!,
      userId: user.id,
      purpose: "pilot_subscription",
      amountPaise: PILOT_PRICE_PAISE,
    });
    if (!verification.ok) {
      return NextResponse.json(
        { error: verification.error },
        { status: verification.status }
      );
    }

    const claim = await claimPaymentReceipt(admin, {
      orderId,
      paymentId,
      userId: user.id,
      purpose: "pilot_subscription",
      amountPaise: PILOT_PRICE_PAISE,
    });
    if (!claim.ok) {
      return NextResponse.json({ error: claim.error }, { status: claim.status });
    }

    if (claim.alreadyFulfilled) {
      return NextResponse.json({
        success: true,
        idempotent: true,
        message: "Pilot subscription is already active.",
        tier: "pilot",
      });
    }

    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    const payload = {
      user_id: user.id,
      org_id: null as null,
      tier: "pilot" as const,
      status: "active" as const,
      razorpay_order_id,
      price_paise: PILOT_PRICE_PAISE,
      current_period_start: now.toISOString(),
      current_period_end: periodEnd.toISOString(),
      updated_at: now.toISOString(),
    };

    // Prefer update existing personal sub; else insert.
    // (No unique(user_id) constraint in base schema - avoid ON CONFLICT.)
    const { data: existing, error: lookupError } = await admin
      .from("truststack_subscriptions")
      .select("id")
      .eq("user_id", user.id)
      .is("org_id", null)
      .limit(1)
      .maybeSingle();

    if (lookupError) {
      console.error("Subscription lookup failed:", lookupError);
      await finalizePaymentReceipt(admin, claim.id, false, lookupError.message);
      return NextResponse.json(
        { error: "Failed to activate subscription" },
        { status: 500 }
      );
    }

    let writeError = null;
    if (existing?.id) {
      const { error } = await admin
        .from("truststack_subscriptions")
        .update(payload)
        .eq("id", existing.id);
      writeError = error;
    } else {
      const { error } = await admin
        .from("truststack_subscriptions")
        .insert(payload);
      writeError = error;
    }

    if (writeError) {
      console.error("Failed to create subscription:", writeError);
      await finalizePaymentReceipt(admin, claim.id, false, writeError.message);
      return NextResponse.json(
        { error: "Failed to activate subscription", detail: writeError.message },
        { status: 500 }
      );
    }

    await finalizePaymentReceipt(admin, claim.id, true);

    void notifyLeadPayment({
      product: "pilot_subscription",
      email: user.email,
      userId: user.id,
      amountPaise: PILOT_PRICE_PAISE,
      paymentId,
    });

    return NextResponse.json({
      success: true,
      message: "Pilot subscription activated!",
      tier: "pilot",
      validUntil: periodEnd.toISOString(),
    });
  } catch (error) {
    console.error("Confirm subscription error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export const POST = withPaymentSecurity(handleConfirm);
