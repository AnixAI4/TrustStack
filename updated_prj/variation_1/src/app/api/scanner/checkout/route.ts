import { NextResponse, type NextRequest } from "next/server";
import { withPaymentSecurity, type ApiContext } from "@/lib/security/api-guard";
import {
  EXTRA_SCAN_PRICE_DISPLAY,
  EXTRA_SCAN_PRICE_PAISE,
  resolveScanAccess,
} from "@/lib/scanner/entitlements";
import {
  getRazorpayConfig,
  razorpayBasicAuth,
} from "@/lib/payments/razorpay-config";

async function handleCheckout(
  _request: NextRequest,
  { user }: ApiContext
): Promise<NextResponse> {
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const access = await resolveScanAccess(user.id);
  if (access.can_scan) {
    return NextResponse.json({
      already_has_quota: true,
      scan_type: access.scan_type,
      scans_remaining: access.scans_remaining,
      message: access.message,
    });
  }

  const razorpay = getRazorpayConfig();
  if (!razorpay.ok) {
    return NextResponse.json(
      {
        error: razorpay.error,
        code: razorpay.code,
      },
      { status: 503 }
    );
  }

  try {
    const auth = razorpayBasicAuth(razorpay.keyId, razorpay.keySecret);

    const orderResponse = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: EXTRA_SCAN_PRICE_PAISE,
        currency: "INR",
        receipt: `scan_${user.id.replace(/-/g, "").slice(0, 12)}_${Date.now().toString(36)}`.slice(
          0,
          40
        ),
        notes: {
          user_id: user.id,
          email: user.email || "",
          product: "extra_scan",
          credits: "1",
          payment_mode: razorpay.mode,
        },
      }),
    });

    if (!orderResponse.ok) {
      const errorData = await orderResponse.text();
      console.error("Razorpay scan order failed:", errorData);
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
      priceDisplay: EXTRA_SCAN_PRICE_DISPLAY,
      title: "Extra full scan",
      description: `1 full TrustStack scan credit`,
      prefill: { email: user.email },
    });
  } catch (error) {
    console.error("Scan checkout error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export const POST = withPaymentSecurity(handleCheckout);
