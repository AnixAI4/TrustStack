"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Check, CreditCard, Shield, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { AuthShell } from "@/components/auth/AuthShell";
import {
  clearPilotCheckoutPending,
  markPilotCheckoutPending,
} from "@/lib/pilot-checkout";
import { safeInternalPath } from "@/lib/pilot-paths";
import Script from "next/script";

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  order_id: string;
  name: string;
  description: string;
  prefill: { email?: string };
  theme: { color: string };
  handler: (response: RazorpayResponse) => void;
  modal: { ondismiss: () => void };
}

interface RazorpayInstance {
  open: () => void;
}

interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export default function SubscribePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-bg">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </div>
      }
    >
      <SubscribePageInner />
    </Suspense>
  );
}

function SubscribePageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = safeInternalPath(searchParams.get("next"), "/");
  const { user, loading: authLoading } = useAuth();
  const { tier, loading: subLoading, refreshSubscription } = useSubscription();

  const [step, setStep] = useState<"loading" | "checkout" | "processing" | "success" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [scriptError, setScriptError] = useState(false);

  useEffect(() => {
    markPilotCheckoutPending();
  }, []);

  // Razorpay may already be on window (cached) before Script onLoad fires.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.Razorpay) {
      setRazorpayLoaded(true);
      return;
    }
    const id = window.setInterval(() => {
      if (window.Razorpay) {
        setRazorpayLoaded(true);
        window.clearInterval(id);
      }
    }, 200);
    const timeout = window.setTimeout(() => {
      window.clearInterval(id);
      if (!window.Razorpay) setScriptError(true);
    }, 12000);
    return () => {
      window.clearInterval(id);
      window.clearTimeout(timeout);
    };
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      const q = new URLSearchParams({ plan: "pilot" });
      if (nextPath !== "/") q.set("next", nextPath);
      router.replace(`/auth/sign-up?${q.toString()}`);
      return;
    }

    if (!authLoading && !subLoading) {
      if (tier === "pilot") {
        clearPilotCheckoutPending();
        router.replace(nextPath);
        return;
      }
      setStep("checkout");
    }
  }, [authLoading, subLoading, user, tier, router, nextPath]);

  async function waitForRazorpay(ms = 8000): Promise<boolean> {
    if (typeof window !== "undefined" && window.Razorpay) return true;
    const start = Date.now();
    while (Date.now() - start < ms) {
      await new Promise((r) => setTimeout(r, 150));
      if (typeof window !== "undefined" && window.Razorpay) {
        setRazorpayLoaded(true);
        return true;
      }
    }
    return false;
  }

  async function initiatePayment() {
    setError(null);
    setStep("processing");

    const ready = razorpayLoaded || (await waitForRazorpay());
    if (!ready) {
      setError(
        "Payment gateway could not load. Check your network or disable ad blockers, then try again."
      );
      setStep("error");
      return;
    }

    try {
      const response = await fetch("/api/subscription/checkout", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create order");
      }

      const { orderId, amount, currency, keyId, prefill } = await response.json();

      const razorpay = new window.Razorpay({
        key: keyId,
        amount,
        currency,
        order_id: orderId,
        name: "TrustStack",
        description: "Pilot Subscription - Monthly",
        prefill,
        theme: { color: "#e2620a" },
        handler: async (response: RazorpayResponse) => {
          await confirmPayment(response);
        },
        modal: {
          ondismiss: () => {
            setStep("checkout");
          },
        },
      });

      razorpay.open();
      // Modal open - keep checkout UI available if they dismiss
      setStep("checkout");
    } catch (err) {
      console.error("Payment initiation error:", err);
      setError(err instanceof Error ? err.message : "Payment failed");
      setStep("error");
    }
  }

  async function confirmPayment(response: RazorpayResponse) {
    try {
      const confirmResponse = await fetch("/api/subscription/confirm", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(response),
      });

      if (!confirmResponse.ok) {
        const data = await confirmResponse.json();
        throw new Error(data.error || "Payment verification failed");
      }

      await refreshSubscription();
      clearPilotCheckoutPending();
      setStep("success");

      setTimeout(() => {
        router.replace(nextPath);
      }, 2000);
    } catch (err) {
      console.error("Payment confirmation error:", err);
      setError(err instanceof Error ? err.message : "Payment verification failed");
      setStep("error");
    }
  }

  if (step === "loading" || authLoading || subLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
        onLoad={() => setRazorpayLoaded(true)}
        onError={() => setScriptError(true)}
      />

      <AuthShell
        title={
          step === "success"
            ? "Welcome to Pilot!"
            : step === "error"
              ? "Payment failed"
              : "Upgrade to Pilot"
        }
        subtitle={
          step === "success"
            ? nextPath.startsWith("/trustdeck")
              ? "Opening your compliance workspace..."
              : "Your subscription is active. Opening TrustStack..."
            : step === "error"
              ? error || "Something went wrong"
              : "Unlock Platform and all TrustStack features"
        }
      >
        {step === "success" ? (
          <div className="text-center">
            <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-accent/15">
              <Check className="h-8 w-8 text-accent" />
            </div>
            <p className="text-sm text-text-muted">
              {nextPath.startsWith("/trustdeck")
                ? "Continuing to dashboard setup..."
                : "Redirecting to the platform..."}
            </p>
          </div>
        ) : step === "error" ? (
          <div className="text-center">
            <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-red-500/15">
              <Shield className="h-8 w-8 text-red-500" />
            </div>
            {error && (
              <p className="mb-3 text-sm text-text-muted">{error}</p>
            )}
            <button onClick={() => setStep("checkout")} className="btn btn-ghost mt-2">
              Try again
            </button>
          </div>
        ) : (
          <>
            <div className="mb-6 flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-xl border border-line bg-glass text-accent">
                <Sparkles className="h-5 w-5" />
              </span>
              <div>
                <div className="font-display font-semibold text-text">Pilot Plan</div>
                <div className="text-sm text-text-muted">
                  Professional access · secure checkout
                </div>
              </div>
            </div>

            <ul className="mb-6 space-y-2 text-sm text-text-muted">
              {[
                "TrustDeck compliance workspace",
                "Template catalog (individual unlocks)",
                "8 certification modules",
                "1 compliance scan per day",
                "All tools & utilities",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-accent" />
                  {item}
                </li>
              ))}
            </ul>

            {nextPath.startsWith("/trustdeck") && (
              <p className="mb-4 rounded-lg border border-line bg-glass px-3 py-2 text-xs text-text-muted">
                After payment you&apos;ll continue setting up your Platform workspace.
              </p>
            )}

            {scriptError && !razorpayLoaded && (
              <p className="mb-3 rounded-lg border border-red/30 bg-red-soft/40 px-3 py-2 text-xs text-red">
                Razorpay script blocked or failed to load. Disable ad blockers for this site, then refresh.
              </p>
            )}

            <button
              type="button"
              onClick={() => void initiatePayment()}
              disabled={step === "processing"}
              className="btn btn-accent relative z-10 w-full justify-center disabled:cursor-wait disabled:opacity-80"
            >
              {step === "processing" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CreditCard className="h-4 w-4" />
              )}
              {step === "processing"
                ? razorpayLoaded
                  ? "Opening checkout..."
                  : "Loading payment..."
                : "Continue to secure checkout"}
            </button>

            <button
              type="button"
              onClick={() => {
                clearPilotCheckoutPending();
                router.replace("/");
              }}
              className="btn btn-ghost mt-3 w-full justify-center text-sm"
            >
              Continue with Free instead
            </button>

            <p className="mt-4 text-center text-xs text-text-faint">
              Secure payment powered by Razorpay
            </p>
          </>
        )}
      </AuthShell>
    </>
  );
}
