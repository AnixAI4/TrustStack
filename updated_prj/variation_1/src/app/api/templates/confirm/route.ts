import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { withPaymentSecurity, type ApiContext } from "@/lib/security/api-guard";
import {
  validatePaymentSignature,
  validateRequestBody,
  sanitizeString,
} from "@/lib/security/validation";
import { getTemplate } from "@/content/templates";
import { grantTemplatePurchase } from "@/lib/template-purchases";
import { templatePricePaise } from "@/lib/template-pricing";
import {
  claimPaymentReceipt,
  finalizePaymentReceipt,
  verifyRazorpayPayment,
} from "@/lib/payments/razorpay";

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
    slug: string;
  }>(body, [
    "razorpay_order_id",
    "razorpay_payment_id",
    "razorpay_signature",
    "slug",
  ]);

  if (!bodyValidation.valid || !bodyValidation.data) {
    return NextResponse.json(
      { error: bodyValidation.error || "Missing payment details" },
      { status: 400 }
    );
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, slug: rawSlug } =
    bodyValidation.data;
  const slug = sanitizeString(rawSlug, 120);
  if (!getTemplate(slug)) {
    return NextResponse.json({ error: "Unknown template" }, { status: 404 });
  }

  const sigValidation = validatePaymentSignature(razorpay_signature);
  if (!sigValidation.valid || !sigValidation.sanitized) {
    return NextResponse.json({ error: "Invalid signature format" }, { status: 400 });
  }

  const orderId = sanitizeString(razorpay_order_id, 100);
  const paymentId = sanitizeString(razorpay_payment_id, 100);
  const amountPaise = templatePricePaise(slug);
  const verification = await verifyRazorpayPayment({
    orderId,
    paymentId,
    signature: sigValidation.sanitized,
    userId: user.id,
    purpose: "template",
    amountPaise,
    metadata: { template_slug: slug },
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
    purpose: "template",
    amountPaise,
    metadata: { template_slug: slug },
  });
  if (!claim.ok) {
    return NextResponse.json({ error: claim.error }, { status: claim.status });
  }

  const grant = await grantTemplatePurchase(user.id, slug);
  if (!grant.ok) {
    if (!claim.alreadyFulfilled) {
      await finalizePaymentReceipt(admin, claim.id, false, grant.error);
    }
    return NextResponse.json({ error: grant.error }, { status: 500 });
  }

  if (!claim.alreadyFulfilled) {
    await finalizePaymentReceipt(admin, claim.id, true);
  }

  return NextResponse.json({
    success: true,
    idempotent: claim.alreadyFulfilled,
    slug,
    purchased: grant.slugs,
  });
}

export const POST = withPaymentSecurity(handleConfirm);
