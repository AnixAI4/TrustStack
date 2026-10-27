import { NextResponse, type NextRequest } from "next/server";
import { withPaymentSecurity, type ApiContext } from "@/lib/security/api-guard";
import { getTemplate } from "@/content/templates";
import { templatePricePaise } from "@/lib/template-pricing";
import {
  getRazorpayConfig,
  razorpayBasicAuth,
} from "@/lib/payments/razorpay-config";

async function handleCheckout(
  request: NextRequest,
  { user }: ApiContext
): Promise<NextResponse> {
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let body: { slug?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const slug = typeof body.slug === "string" ? body.slug.trim() : "";
  const template = getTemplate(slug);
  if (!template) {
    return NextResponse.json({ error: "Unknown template" }, { status: 404 });
  }

  const razorpay = getRazorpayConfig();
  if (!razorpay.ok) {
    return NextResponse.json(
      {
        error: razorpay.error,
        code: razorpay.code,
        canDevUnlock: process.env.NODE_ENV === "development",
      },
      { status: 503 }
    );
  }

  const amount = templatePricePaise(slug);
  const auth = razorpayBasicAuth(razorpay.keyId, razorpay.keySecret);

  try {
    const orderResponse = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount,
        currency: "INR",
        receipt: `tpl_${slug.slice(0, 12)}_${Date.now().toString(36)}`.slice(0, 40),
        notes: {
          user_id: user.id,
          email: user.email || "",
          product: "template",
          template_slug: slug,
          payment_mode: razorpay.mode,
        },
      }),
    });

    if (!orderResponse.ok) {
      const errorData = await orderResponse.text();
      console.error("Razorpay template order failed:", errorData);
      return NextResponse.json(
        { error: "Failed to create payment order" },
        { status: 500 }
      );
    }

    const order = await orderResponse.json();
    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: razorpay.keyId,
      mode: razorpay.mode,
      slug,
      title: template.title,
      prefill: { email: user.email },
    });
  } catch (error) {
    console.error("Template checkout error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export const POST = withPaymentSecurity(handleCheckout);
