/**
 * Razorpay live payment config for TrustStack.
 * Live KYC-verified keys use the `rzp_live_` prefix. Test/sandbox (`rzp_test_`)
 * is rejected unless RAZORPAY_ALLOW_TEST=1 is set explicitly for local debugging.
 */

export type RazorpayConfig =
  | {
      ok: true;
      keyId: string;
      keySecret: string;
      mode: "live" | "test";
      gateway: string;
      webhookSecret: string;
      planGrowthId: string;
      leadNotificationEmail: string;
    }
  | {
      ok: false;
      error: string;
      code: "RAZORPAY_NOT_CONFIGURED" | "RAZORPAY_TEST_KEYS_BLOCKED" | "PAYMENT_GATEWAY_DISABLED";
    };

function trim(value: string | undefined): string {
  return value?.trim() || "";
}

export function getRazorpayConfig(): RazorpayConfig {
  const gateway = trim(process.env.PAYMENT_GATEWAY).toLowerCase() || "razorpay";
  if (gateway !== "razorpay") {
    return {
      ok: false,
      error: `Payment gateway "${gateway}" is not supported`,
      code: "PAYMENT_GATEWAY_DISABLED",
    };
  }

  const keyId = trim(process.env.RAZORPAY_KEY_ID);
  const keySecret = trim(process.env.RAZORPAY_KEY_SECRET);
  const allowTest = process.env.RAZORPAY_ALLOW_TEST === "1";

  if (
    !keyId ||
    !keySecret ||
    keyId.includes("...") ||
    keySecret.includes("...") ||
    keyId.includes("your_") ||
    keySecret.includes("your_")
  ) {
    return {
      ok: false,
      error: "Payment gateway not configured",
      code: "RAZORPAY_NOT_CONFIGURED",
    };
  }

  const isLive = keyId.startsWith("rzp_live_");
  const isTest = keyId.startsWith("rzp_test_");

  if (isTest && !allowTest) {
    return {
      ok: false,
      error:
        "Razorpay test/sandbox keys are blocked. Use KYC-verified live keys (rzp_live_…) for pilot and scan payments.",
      code: "RAZORPAY_TEST_KEYS_BLOCKED",
    };
  }

  if (!isLive && !isTest) {
    return {
      ok: false,
      error: "Invalid Razorpay key id. Expected rzp_live_… (or rzp_test_… with RAZORPAY_ALLOW_TEST=1).",
      code: "RAZORPAY_NOT_CONFIGURED",
    };
  }

  return {
    ok: true,
    keyId,
    keySecret,
    mode: isLive ? "live" : "test",
    gateway,
    webhookSecret: trim(process.env.RAZORPAY_WEBHOOK_SECRET),
    planGrowthId: trim(process.env.RAZORPAY_PLAN_GROWTH),
    leadNotificationEmail: trim(process.env.LEAD_NOTIFICATION_EMAIL),
  };
}

export function razorpayBasicAuth(keyId: string, keySecret: string): string {
  return Buffer.from(`${keyId}:${keySecret}`).toString("base64");
}

/** Fire-and-forget ops email when a payment succeeds (Resend optional). */
export async function notifyLeadPayment(input: {
  product: string;
  email?: string | null;
  userId: string;
  amountPaise: number;
  paymentId: string;
}): Promise<void> {
  const to = trim(process.env.LEAD_NOTIFICATION_EMAIL);
  const resendKey = trim(process.env.RESEND_API_KEY);
  if (!to || !resendKey) return;

  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL?.trim() || "TrustStack <onboarding@resend.dev>",
        to: [to],
        subject: `TrustStack payment · ${input.product}`,
        text: [
          `Product: ${input.product}`,
          `User: ${input.email || "(no email)"}`,
          `User ID: ${input.userId}`,
          `Amount: ₹${(input.amountPaise / 100).toFixed(2)}`,
          `Payment ID: ${input.paymentId}`,
        ].join("\n"),
      }),
    });
  } catch (error) {
    console.error("Lead payment notification failed:", error);
  }
}
