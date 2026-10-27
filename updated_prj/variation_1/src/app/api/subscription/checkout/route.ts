import { NextResponse, type NextRequest } from "next/server";
import { withPaymentSecurity, type ApiContext } from "@/lib/security/api-guard";
import {
  getRazorpayConfig,
  razorpayBasicAuth,
} from "@/lib/payments/razorpay-config";

const PILOT_PRICE_PAISE = parseInt(process.env.PILOT_PRICE_PAISE || "99900", 10);

async function handleCheckout(
  _request: NextRequest,
  { user }: ApiContext
): Promise<NextResponse> {
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const razorpay = getRazorpayConfig();
  if (!razorpay.ok) {
    return NextResponse.json(
      { error: razorpay.error, code: razorpay.code },
      { status: 503 }
    );
  }

  try {
    const auth = razorpayBasicAuth(razorpay.keyId, razorpay.keySecret);
    const notes: Record<string, string> = {
      user_id: user.id,
      email: user.email || "",
      product: "pilot_subscription",
      tier: "pilot",
      payment_mode: razorpay.mode,
    };
    if (razorpay.planGrowthId) {
      notes.plan_id = razorpay.planGrowthId;
    }

    const orderResponse = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: PILOT_PRICE_PAISE,
        currency: "INR",
        receipt: `pilot_${user.id.replace(/-/g, "").slice(0, 12)}_${Date.now().toString(36)}`.slice(0, 40),
        notes,
      }),
    });

    if (!orderResponse.ok) {
      const errorData = await orderResponse.text();
      console.error("Razorpay order creation failed:", errorData);
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
      prefill: {
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export const POST = withPaymentSecurity(handleCheckout);

export async function GET() {
  return NextResponse.redirect(new URL("/subscribe", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"));
}
