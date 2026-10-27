"use client";

import { useCallback, useEffect, useState } from "react";
import Script from "next/script";
import { Eye, Loader2, Lock, Download } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase/client";
import { TemplateDocument } from "@/components/resources/TemplateDocument";
import { TemplateDownloads } from "@/components/resources/TemplateDownloads";
import type { DocSection } from "@/content/template-documents";
import {
  templatePriceDisplay,
} from "@/lib/template-pricing";

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => { open: () => void };
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
  handler: (response: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => void;
  modal: { ondismiss: () => void };
}

type LoadState =
  | { status: "loading" }
  | { status: "locked"; price: number }
  | { status: "ready"; title: string; sections: DocSection[] }
  | { status: "error"; message: string };

/**
 * Fetches purchased template body into memory only (no-store API).
 * Locked: paywall. Unlocked: on-screen reader + Word/PDF downloads.
 */
export function ProtectedTemplateReader({
  slug,
  title,
}: {
  slug: string;
  title: string;
}) {
  const { user, loading: authLoading } = useAuth();
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [busy, setBusy] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [razorpayReady, setRazorpayReady] = useState(false);
  const price = templatePriceDisplay(slug);

  const loadContent = useCallback(async () => {
    setState({ status: "loading" });
    setPayError(null);
    try {
      const res = await fetch(`/api/templates/${encodeURIComponent(slug)}/content`, {
        credentials: "include",
        cache: "no-store",
        headers: { "Cache-Control": "no-store" },
      });
      if (res.status === 402) {
        const data = (await res.json()) as { priceDisplay?: number };
        setState({
          status: "locked",
          price: data.priceDisplay ?? price,
        });
        return;
      }
      if (res.status === 401) {
        setState({
          status: "error",
          message: "Sign in to unlock this template.",
        });
        return;
      }
      if (!res.ok) {
        setState({ status: "error", message: "Could not load this template." });
        return;
      }
      const data = (await res.json()) as {
        title: string;
        sections: DocSection[];
      };
      setState({
        status: "ready",
        title: data.title,
        sections: data.sections,
      });
    } catch {
      setState({ status: "error", message: "Network error loading template." });
    }
  }, [slug, price]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setState({
        status: "error",
        message: "Sign in to unlock this template.",
      });
      return;
    }
    void loadContent();
  }, [authLoading, user, loadContent]);

  async function waitForRazorpay(ms = 8000): Promise<boolean> {
    if (typeof window !== "undefined" && window.Razorpay) return true;
    const start = Date.now();
    while (Date.now() - start < ms) {
      await new Promise((r) => setTimeout(r, 150));
      if (typeof window !== "undefined" && window.Razorpay) return true;
    }
    return false;
  }

  async function refreshAuthClaims() {
    try {
      const supabase = createClient();
      await supabase.auth.refreshSession();
    } catch {
      // Content API uses getUser() server-side; refresh helps client JWT stay in sync.
    }
  }

  async function unlockDev() {
    setBusy(true);
    setPayError(null);
    try {
      const res = await fetch("/api/templates/dev-unlock", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unlock failed");
      await refreshAuthClaims();
      await loadContent();
    } catch (err) {
      setPayError(err instanceof Error ? err.message : "Unlock failed");
    } finally {
      setBusy(false);
    }
  }

  async function buy() {
    setBusy(true);
    setPayError(null);
    try {
      const checkoutRes = await fetch("/api/templates/checkout", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      const checkout = await checkoutRes.json();

      if (checkoutRes.status === 503 && checkout.canDevUnlock) {
        await unlockDev();
        return;
      }

      if (!checkoutRes.ok) {
        throw new Error(checkout.error || "Could not start checkout");
      }

      const ready = razorpayReady || (await waitForRazorpay());
      if (!ready) {
        throw new Error(
          "Payment gateway could not load. Check your network or disable ad blockers."
        );
      }

      const razorpay = new window.Razorpay({
        key: checkout.keyId,
        amount: checkout.amount,
        currency: checkout.currency,
        order_id: checkout.orderId,
        name: "TrustStack",
        description: `Template - ${checkout.title || title}`,
        prefill: checkout.prefill || {},
        theme: { color: "#e2620a" },
        handler: async (response) => {
          try {
            const confirmRes = await fetch("/api/templates/confirm", {
              method: "POST",
              credentials: "include",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ...response, slug }),
            });
            const confirmData = await confirmRes.json();
            if (!confirmRes.ok) {
              throw new Error(confirmData.error || "Payment verification failed");
            }
            await refreshAuthClaims();
            await loadContent();
          } catch (err) {
            setPayError(err instanceof Error ? err.message : "Payment failed");
          } finally {
            setBusy(false);
          }
        },
        modal: {
          ondismiss: () => setBusy(false),
        },
      });
      razorpay.open();
    } catch (err) {
      setPayError(err instanceof Error ? err.message : "Payment failed");
      setBusy(false);
    }
  }

  if (state.status === "loading" || authLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center gap-2 text-sm text-text-muted">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading secure preview…
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="rounded-xl border border-line bg-surface-2/40 p-8 text-center">
        <Lock className="mx-auto h-8 w-8 text-text-faint" />
        <p className="mt-3 text-sm text-text-muted">{state.message}</p>
      </div>
    );
  }

  if (state.status === "locked") {
    return (
      <>
        <Script
          src="https://checkout.razorpay.com/v1/checkout.js"
          strategy="afterInteractive"
          onLoad={() => setRazorpayReady(true)}
        />
        <div className="relative overflow-hidden rounded-xl border border-line bg-surface-2/30">
          <div
            className="pointer-events-none absolute inset-0 select-none p-8 blur-[2px] opacity-40"
            aria-hidden
          >
            <div className="space-y-3">
              <div className="h-4 w-2/3 rounded bg-line" />
              <div className="h-3 w-full rounded bg-line" />
              <div className="h-3 w-5/6 rounded bg-line" />
              <div className="h-3 w-full rounded bg-line" />
              <div className="h-3 w-3/4 rounded bg-line" />
              <div className="h-3 w-full rounded bg-line" />
              <div className="h-3 w-4/5 rounded bg-line" />
            </div>
          </div>
          <div className="relative z-10 flex flex-col items-center justify-center bg-bg/80 px-8 py-10 text-center backdrop-blur-[1px]">
            <Lock className="h-8 w-8 shrink-0 text-accent" />
            <h3 className="mt-3 font-display text-xl font-semibold text-text">
              Unlock this template
            </h3>
            <p className="mt-2 max-w-md text-sm text-text-muted">
              Pay once to read on-screen and download Word + PDF. Until you
              unlock, the file stays off your device.
            </p>
            <button
              type="button"
              disabled={busy}
              onClick={() => void buy()}
              className="btn btn-accent mt-6"
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Lock className="h-4 w-4" />
              )}
              {busy ? "Processing…" : "Unlock template"}
            </button>
            {payError && (
              <p className="mt-3 max-w-sm text-xs text-red-500">{payError}</p>
            )}
            <p className="mt-4 inline-flex items-center gap-1.5 text-xs leading-normal text-text-faint">
              <Download className="h-3.5 w-3.5 shrink-0" /> Includes .docx + PDF
              after unlock
            </p>
          </div>
        </div>
      </>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <TemplateDownloads slug={slug} />
        <p className="mt-3 text-xs text-text-faint">
          Editable Word document and print-ready PDF. Free to use - tailor to
          your organisation before publishing.
        </p>
      </div>

      <div className="mb-4 flex items-center gap-2 font-mono text-label uppercase tracking-wider text-text-faint">
        <Eye className="h-3.5 w-3.5 text-accent" />
        View the document - PDF, Word or reader
      </div>

      <div
        data-template-body={slug}
        className="rounded-xl border border-line bg-surface-2/25 p-6 shadow-sm sm:p-8 lg:p-10"
      >
        <div className="mb-8 border-b border-line pb-6">
          <h2 className="font-display text-2xl font-semibold tracking-tight text-text">
            {state.title}
          </h2>
          <p className="mt-2 text-sm text-text-faint">
            Clean, responsive reading view of the same content.
          </p>
        </div>
        <TemplateDocument sections={state.sections} />
      </div>
    </div>
  );
}
