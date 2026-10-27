"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertCircle,
  ArrowUpRight,
  Cookie,
  FileText,
  Globe,
  Link2,
  Loader2,
  Radar,
  ScanLine,
  ShieldCheck,
  Upload,
} from "lucide-react";
import { ScannerQuotaBanner } from "@/components/scanner/ScannerQuotaBanner";
import { ScannerHistoryPanel } from "@/components/scanner/ScannerHistoryPanel";
import { PilotDailyResetChip } from "@/components/scanner/PilotDailyResetChip";
import type { ScannerQuotaResponse } from "@/app/api/scanner/quota/route";
import type { ScanHistoryItem } from "@/app/api/scanner/history/route";
import { SCANNER_COPY, type ScanError, type ScanReport } from "@/content/scanner";
import { cacheScanReport } from "@/lib/scanner/report-cache";
import { cn } from "@/lib/cn";

declare global {
  interface Window {
    Razorpay: new (options: {
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
    }) => { open: () => void };
  }
}

type Mode = "url" | "pdf";
type State =
  | { phase: "idle" }
  | { phase: "loading"; progress: number; message: string }
  | { phase: "error"; error: ScanError }
  | { phase: "opening"; message: string };

const FEATURES = [
  "AI + Rules engine",
  "Indicator-level scoring",
  "Consent · cookies · policies",
];

const CHECKS = [
  { icon: ShieldCheck, label: "Consent banner detection" },
  { icon: FileText, label: "Privacy & cookie policy signals" },
  { icon: Cookie, label: "Cookie inventory on load" },
  { icon: Radar, label: "Third-party tracker surface" },
];

const MODES: {
  value: Mode;
  icon: typeof Globe;
  title: string;
  subtitle: string;
  enabled: boolean;
}[] = [
  {
    value: "url",
    icon: Globe,
    title: "Website URL",
    subtitle: "Discover or link to policies online",
    enabled: true,
  },
  {
    value: "pdf",
    icon: Upload,
    title: "Upload PDFs",
    subtitle: "Submit privacy, terms & cookie documents",
    enabled: true,
  },
];

function normalizeUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const withProto = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const u = new URL(withProto);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    return u.toString();
  } catch {
    return null;
  }
}

export function ScannerWorkspace({ basePath = '/scanner' }: { basePath?: string } = {}) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("url");
  const [url, setUrl] = useState("");
  const [privacyUrl, setPrivacyUrl] = useState("");
  const [termsUrl, setTermsUrl] = useState("");
  const [cookieUrl, setCookieUrl] = useState("");
  const [reference, setReference] = useState("");
  const [privacyPdf, setPrivacyPdf] = useState<File | null>(null);
  const [termsPdf, setTermsPdf] = useState<File | null>(null);
  const [cookiePdf, setCookiePdf] = useState<File | null>(null);
  const [state, setState] = useState<State>({ phase: "idle" });
  const [quota, setQuota] = useState<ScannerQuotaResponse | null>(null);
  const [quotaLoading, setQuotaLoading] = useState(true);
  const [history, setHistory] = useState<ScanHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [activeReportId, setActiveReportId] = useState<string | null>(null);
  const [buyingExtra, setBuyingExtra] = useState(false);
  const [razorpayReady, setRazorpayReady] = useState(false);

  const loading = state.phase === "loading" || state.phase === "opening";
  const quotaLocked = Boolean(quota?.signed_in && !quota.can_scan);
  const showPilotReset =
    Boolean(quota?.has_pilot) &&
    (quota?.pilot_scans_remaining ?? 0) <= 0 &&
    Boolean(quota?.next_pilot_scan_at);
  const canSubmit =
    !quotaLocked &&
    (mode === "url"
      ? Boolean(url.trim())
      : Boolean(reference.trim() && privacyPdf));

  const refreshMeta = useCallback(async () => {
    setQuotaLoading(true);
    setHistoryLoading(true);
    try {
      const [qRes, hRes] = await Promise.all([
        fetch("/api/scanner/quota", { cache: "no-store" }),
        fetch("/api/scanner/history", { cache: "no-store" }),
      ]);
      if (qRes.ok) {
        setQuota((await qRes.json()) as ScannerQuotaResponse);
      }
      if (hRes.ok) {
        const data = (await hRes.json()) as { items?: ScanHistoryItem[] };
        setHistory(data.items ?? []);
      } else {
        setHistory([]);
      }
    } catch {
      /* keep prior */
    } finally {
      setQuotaLoading(false);
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshMeta();
  }, [refreshMeta]);

  useEffect(() => {
    if (typeof window !== "undefined" && window.Razorpay) {
      setRazorpayReady(true);
    }
  }, []);

  async function waitForRazorpay(ms = 8000): Promise<boolean> {
    if (typeof window !== "undefined" && window.Razorpay) return true;
    const start = Date.now();
    while (Date.now() - start < ms) {
      await new Promise((r) => setTimeout(r, 150));
      if (typeof window !== "undefined" && window.Razorpay) return true;
    }
    return typeof window !== "undefined" && Boolean(window.Razorpay);
  }

  async function buyExtraScan() {
    if (buyingExtra) return;
    setBuyingExtra(true);
    try {
      const checkoutRes = await fetch("/api/scanner/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      const checkout = await checkoutRes.json();
      if (checkoutRes.status === 401) {
        window.location.href = "/auth/sign-in?next=/scanner";
        return;
      }
      if (checkout.already_has_quota) {
        await refreshMeta();
        return;
      }
      if (!checkoutRes.ok) {
        throw new Error(checkout.error || "Could not start checkout.");
      }

      const ready = razorpayReady || (await waitForRazorpay());
      if (!ready || !window.Razorpay) {
        throw new Error("Payment widget failed to load. Refresh and try again.");
      }

      await new Promise<void>((resolve, reject) => {
        const razorpay = new window.Razorpay({
          key: checkout.keyId,
          amount: checkout.amount,
          currency: checkout.currency,
          order_id: checkout.orderId,
          name: "TrustStack",
          description: checkout.description || "Extra full scan",
          prefill: checkout.prefill || {},
          theme: { color: "#0f766e" },
          handler: (response) => {
            void (async () => {
              try {
                const confirmRes = await fetch("/api/scanner/confirm", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(response),
                });
                const confirm = await confirmRes.json();
                if (!confirmRes.ok) {
                  throw new Error(confirm.error || "Payment verification failed.");
                }
                await refreshMeta();
                resolve();
              } catch (err) {
                reject(err instanceof Error ? err : new Error("Payment failed."));
              }
            })();
          },
          modal: {
            ondismiss: () => resolve(),
          },
        });
        razorpay.open();
      });
    } catch (err) {
      setState({
        phase: "error",
        error: {
          error: "payment_failed",
          detail: err instanceof Error ? err.message : "Payment failed.",
        },
      });
    } finally {
      setBuyingExtra(false);
    }
  }

  function openHistoryItem(item: ScanHistoryItem) {
    setActiveReportId(item.report_id);
    setState({ phase: "opening", message: "Opening assessment report…" });
    router.push(`${basePath}/report/${encodeURIComponent(item.report_id)}`);
  }

  function onScanSuccess(
    report: ScanReport & {
      report_id?: string;
      context?: unknown;
      engine?: string;
      verdict?: string;
    }
  ) {
    void refreshMeta();
    if (!report.report_id) {
      setState({
        phase: "error",
        error: {
          error: "missing_report_id",
          detail: "Scan finished but no report id was returned. Please try again.",
        },
      });
      return;
    }
    setActiveReportId(report.report_id);
    // Prefer full original ReportContext when the DeepSeek engine ran.
    cacheScanReport(report.report_id, report.context ?? report);
    setState({
      phase: "opening",
      message:
        report.engine === "dpdp_comp"
          ? "Opening full DPDP assessment report…"
          : "Opening full assessment report…",
    });
    // Belt-and-suspenders: ensure history row exists even if server-side save missed.
    void fetch("/api/scanner/history", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        report_id: report.report_id,
        url: report.url,
        score: report.overall_score,
        verdict: report.verdict || report.grade || report.risk_level || "",
        report: report.context ?? report,
      }),
    }).catch(() => undefined);
    router.push(`${basePath}/report/${encodeURIComponent(report.report_id)}`);
  }

  async function runScan(e: FormEvent) {
    e.preventDefault();
    if (loading) return;

    if (quota && quota.signed_in && !quota.can_scan) {
      setState({
        phase: "error",
        error: {
          error: "quota_exceeded",
          detail: quota.message || "No scans remaining.",
        },
      });
      return;
    }

    if (mode === "pdf") {
      if (!reference.trim() || !privacyPdf) {
        setState({
          phase: "error",
          error: {
            error: "invalid_request",
            detail: "Organisation reference and Privacy Policy PDF are required.",
          },
        });
        return;
      }

      setState({
        phase: "loading",
        progress: 18,
        message: "Extracting text from uploaded PDFs…",
      });

      const ticks = [40, 62, 80];
      let i = 0;
      const timer = window.setInterval(() => {
        if (i >= ticks.length) return;
        setState((prev) =>
          prev.phase === "loading"
            ? {
                phase: "loading",
                progress: ticks[i],
                message: "Scoring policy disclosures against DPDP signals…",
              }
            : prev
        );
        i += 1;
      }, 900);

      try {
        const form = new FormData();
        form.append("reference", reference.trim());
        form.append("privacy_pdf", privacyPdf);
        if (termsPdf) form.append("terms_pdf", termsPdf);
        if (cookiePdf) form.append("cookie_pdf", cookiePdf);

        const res = await fetch("/api/scanner", {
          method: "POST",
          body: form,
        });
        const data = await res.json();
        if (!res.ok) {
          setState({ phase: "error", error: data as ScanError });
          return;
        }
        onScanSuccess(data as ScanReport & { report_id?: string });
      } catch {
        setState({
          phase: "error",
          error: {
            error: "network",
            detail: "Could not upload PDFs. Check your connection and try again.",
          },
        });
      } finally {
        window.clearInterval(timer);
      }
      return;
    }

    const target = normalizeUrl(url);
    if (!target) {
      setState({
        phase: "error",
        error: { error: "invalid_request", detail: "Enter a valid website URL." },
      });
      return;
    }

    setState({
      phase: "loading",
      progress: 8,
      message: "Starting DPDP Rules assessment…",
    });

    // Original DeepSeek engine often takes 1-4 minutes (scrape + LLM).
    const ticks = [18, 32, 48, 62, 74, 84, 90];
    const messages = [
      "Scraping privacy policy & related pages…",
      "Preparing condensed DPDP Rules checklist…",
      "DeepSeek is scoring each indicator…",
      "Verifying policy excerpts against source text…",
      "Building remediation plan & score breakdown…",
      "Almost done - finalising the report…",
      "Packaging full assessment…",
    ];
    let i = 0;
    const timer = window.setInterval(() => {
      if (i >= ticks.length) return;
      setState((prev) =>
        prev.phase === "loading"
          ? {
              phase: "loading",
              progress: ticks[i],
              message: messages[i] || "Assessing…",
            }
          : prev
      );
      i += 1;
    }, 8000);

    try {
      const res = await fetch("/api/scanner", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          url: target,
          privacy_url: normalizeUrl(privacyUrl) ?? undefined,
          terms_url: normalizeUrl(termsUrl) ?? undefined,
          cookie_url: normalizeUrl(cookieUrl) ?? undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setState({ phase: "error", error: data as ScanError });
        return;
      }
      onScanSuccess(data as ScanReport & { report_id?: string });
    } catch {
      setState({
        phase: "error",
        error: {
          error: "network",
          detail: "Could not reach the scanner. Check your connection and try again.",
        },
      });
    } finally {
      window.clearInterval(timer);
    }
  }

  const progressPct =
    state.phase === "loading" ? state.progress : state.phase === "opening" ? 100 : 0;
  const statusMessage =
    state.phase === "loading" || state.phase === "opening" ? state.message : "";

  const fieldClass = useMemo(
    () =>
      "w-full rounded-xl border border-line bg-bg px-3.5 py-2.5 text-sm text-text outline-none transition-colors placeholder:text-text-faint focus:border-accent/50",
    []
  );

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
        onLoad={() => setRazorpayReady(true)}
      />
      <div className="mx-auto max-w-6xl px-3 pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] pt-6 sm:px-6 sm:pb-16 sm:pt-10 lg:px-8">
      {/* Hero - mirrors dpdp scanner home */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="mb-6 text-center sm:mb-9"
      >
        <span className="inline-flex items-center gap-2 rounded-full border border-line bg-glass px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-accent sm:px-3.5 sm:py-1.5 sm:text-[0.7rem] sm:tracking-[0.2em]">
          DPDP Act 2023 · Rules 2025
        </span>
        <h1 className="mx-auto mt-4 max-w-3xl font-display text-3xl font-bold leading-[1.1] tracking-tight sm:mt-6 sm:text-4xl lg:text-[3.25rem] lg:leading-[1.08]">
          <span className="gradient-text">Privacy compliance,</span>
          <br />
          <span className="text-text">quantified in seconds.</span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-text-muted sm:mt-5 sm:text-base">
          Evaluate public-facing privacy signals against India&apos;s Digital Personal Data
          Protection Act - consent, cookies, policies and trackers - with an indicator-level
          verdict inside TrustStack.
        </p>
        <ul className="mx-auto mt-5 flex flex-wrap items-center justify-center gap-2 sm:mt-7 sm:gap-2.5">
          {FEATURES.map((label) => (
            <li
              key={label}
              className="inline-flex items-center gap-2 rounded-full border border-line bg-surface-2/50 px-3 py-1.5 text-[11px] font-medium text-text-muted sm:px-3.5 sm:text-xs"
            >
              {label}
            </li>
          ))}
        </ul>
      </motion.section>

      <div className="grid min-w-0 grid-cols-1 items-start gap-4 md:gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* Configure panel */}
        <section className="min-w-0 overflow-hidden rounded-2xl border border-line bg-bg-2 shadow-sm">
          <header className="hidden border-b border-line px-7 py-5 md:block">
            <h2 className="font-display text-xl font-bold tracking-tight text-text">
              Configure assessment
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-text-muted">
              Provide a website URL (and optional policy links) to begin a DPDP compliance scan.
            </p>
          </header>

          <div className="border-b border-line px-4 py-3 md:px-7">
            <ScannerQuotaBanner
              quota={quota}
              loading={quotaLoading}
              buying={buyingExtra}
              onBuyExtraScan={() => void buyExtraScan()}
            />
          </div>

          <form id="scan-assessment-form" onSubmit={runScan} className="px-4 py-5 md:px-7 md:pb-7" noValidate>
            <h3 className="mb-3 text-[0.7rem] font-bold uppercase tracking-[0.18em] text-text-faint">
              Document source
            </h3>
            <div
              className="relative grid grid-cols-2 gap-1.5 rounded-2xl border border-line bg-surface-2 p-1.5"
              role="radiogroup"
              aria-label="Document source"
            >
              {MODES.map((m) => {
                const Icon = m.icon;
                const active = mode === m.value;
                return (
                  <button
                    key={m.value}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    disabled={!m.enabled || loading}
                    onClick={() => m.enabled && setMode(m.value)}
                    className={cn(
                      "relative flex min-h-[3.25rem] flex-col justify-center gap-0.5 rounded-xl px-3 py-3.5 text-left transition-colors md:min-h-0 md:px-4 md:py-3",
                      !m.enabled && "cursor-not-allowed opacity-55"
                    )}
                  >
                    {active && (
                      <motion.span
                        layoutId="scanner-mode-pill"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                        className="absolute inset-0 rounded-xl border border-accent/30 bg-accent/10"
                      />
                    )}
                    <span
                      className={cn(
                        "relative z-10 inline-flex items-center gap-2 text-sm font-semibold",
                        active ? "text-text" : "text-text-muted"
                      )}
                    >
                      <Icon className={cn("h-4 w-4 shrink-0", active && "text-accent")} />
                      {m.title}
                    </span>
                    <span className="relative z-10 hidden text-[0.8125rem] text-text-faint md:block">
                      {m.subtitle}
                    </span>
                  </button>
                );
              })}
            </div>

            <AnimatePresence mode="wait">
              {mode === "url" ? (
                <motion.div
                  key="url-fields"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="mt-6 space-y-4"
                >
                  <div>
                    <label htmlFor="scan-url" className="mb-1.5 block text-sm font-medium text-text">
                      Website URL
                    </label>
                    <div className="flex items-center gap-2 rounded-xl border border-line bg-bg px-3.5 py-2.5 focus-within:border-accent/50">
                      <ScanLine className="h-4 w-4 shrink-0 text-text-faint" />
                      <input
                        id="scan-url"
                        name="url"
                        type="text"
                        inputMode="url"
                        autoComplete="url"
                        value={url}
                        onChange={(ev) => setUrl(ev.target.value)}
                        placeholder={SCANNER_COPY.placeholder}
                        disabled={loading}
                        className="w-full bg-transparent text-sm text-text outline-none placeholder:text-text-faint"
                      />
                    </div>
                  </div>

                  <div className="rounded-xl border border-dashed border-line bg-surface-2/40 p-4">
                    <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-text-faint">
                      <Link2 className="h-3.5 w-3.5" />
                      Optional policy links
                    </p>
                    <div className="space-y-3">
                      <div>
                        <label htmlFor="privacy-url" className="mb-1 block text-xs text-text-muted">
                          Privacy policy URL
                        </label>
                        <input
                          id="privacy-url"
                          value={privacyUrl}
                          onChange={(ev) => setPrivacyUrl(ev.target.value)}
                          disabled={loading}
                          placeholder="https://…/privacy"
                          className={fieldClass}
                        />
                      </div>
                      <div>
                        <label htmlFor="terms-url" className="mb-1 block text-xs text-text-muted">
                          Terms of service URL
                        </label>
                        <input
                          id="terms-url"
                          value={termsUrl}
                          onChange={(ev) => setTermsUrl(ev.target.value)}
                          disabled={loading}
                          placeholder="https://…/terms"
                          className={fieldClass}
                        />
                      </div>
                      <div>
                        <label htmlFor="cookie-url" className="mb-1 block text-xs text-text-muted">
                          Cookie policy URL
                        </label>
                        <input
                          id="cookie-url"
                          value={cookieUrl}
                          onChange={(ev) => setCookieUrl(ev.target.value)}
                          disabled={loading}
                          placeholder="https://…/cookies"
                          className={fieldClass}
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="pdf-fields"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="mt-6 space-y-4"
                >
                  <div>
                    <label htmlFor="pdf-reference" className="mb-1.5 block text-sm font-medium text-text">
                      Organisation / reference
                    </label>
                    <input
                      id="pdf-reference"
                      value={reference}
                      onChange={(ev) => setReference(ev.target.value)}
                      disabled={loading}
                      placeholder="Acme Corp or https://www.example.com"
                      className={fieldClass}
                    />
                    <p className="mt-1.5 text-xs text-text-faint">
                      Shown on the report as the subject of assessment.
                    </p>
                  </div>

                  {(
                    [
                      ["privacy", "Privacy Policy PDF", true, privacyPdf, setPrivacyPdf],
                      ["terms", "Terms of Service PDF", false, termsPdf, setTermsPdf],
                      ["cookie", "Cookie Policy PDF", false, cookiePdf, setCookiePdf],
                    ] as const
                  ).map(([id, label, required, file, setFile]) => (
                    <div key={id}>
                      <label
                        htmlFor={`pdf-${id}`}
                        className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-text"
                      >
                        <FileText className="h-3.5 w-3.5 text-text-faint" />
                        {label}
                        {required && <span className="text-red">*</span>}
                      </label>
                      <input
                        id={`pdf-${id}`}
                        type="file"
                        accept="application/pdf,.pdf"
                        disabled={loading}
                        onChange={(ev) => setFile(ev.target.files?.[0] ?? null)}
                        className={`${fieldClass} cursor-pointer file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-accent/15 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-accent`}
                      />
                      {file && (
                        <p className="mt-1 truncate text-xs text-text-muted">{file.name}</p>
                      )}
                    </div>
                  ))}
                  <p className="text-xs text-text-faint">
                    Privacy Policy is required. Terms and Cookie policies are optional. Max 15 MB per
                    file. Text-based PDFs work best.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {loading && (
              <div className="mt-5 rounded-xl border border-accent/25 bg-accent/8 px-4 py-3">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="inline-flex items-center gap-2 font-medium text-accent">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {state.phase === "opening" ? "Opening report…" : "Scanning…"}
                  </span>
                  <span className="font-mono text-xs text-text-faint">{progressPct}%</span>
                </div>
                <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-line">
                  <div
                    className="h-full rounded-full bg-accent transition-all duration-500"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-text-muted">{statusMessage}</p>
              </div>
            )}

            {state.phase === "error" && (
              <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-red/35 bg-red/8 px-4 py-3 text-sm text-text">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red" />
                <span>{state.error.detail ?? state.error.error}</span>
              </div>
            )}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="max-w-md text-[11px] leading-relaxed text-text-faint">
                {SCANNER_COPY.disclaimer}
              </p>
              <button
                type="submit"
                disabled={loading || !canSubmit}
                className="btn btn-accent btn-lg hidden min-h-11 shrink-0 disabled:opacity-50 sm:inline-flex"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Running…
                  </>
                ) : quotaLocked ? (
                  <>
                    <Radar className="h-4 w-4" /> No scans left
                  </>
                ) : (
                  <>
                    <Radar className="h-4 w-4" /> Start assessment
                  </>
                )}
              </button>
            </div>
          </form>
        </section>

        {/* Mobile: history + quick links */}
        <div className="space-y-3 lg:hidden">
          {showPilotReset && quota?.next_pilot_scan_at ? (
            <PilotDailyResetChip
              targetISO={quota.next_pilot_scan_at}
              onExpire={() => void refreshMeta()}
            />
          ) : null}
          <ScannerHistoryPanel
            items={history}
            loading={historyLoading}
            activeId={activeReportId}
            onSelect={(item) => void openHistoryItem(item)}
          />
          <div className="flex flex-wrap gap-2 text-sm">
            <Link
              href="/trustdeck/assessment"
              className="inline-flex min-h-11 items-center gap-1 rounded-pill border border-accent/25 bg-accent/8 px-3.5 py-2 font-medium text-accent"
            >
              Platform assessment <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              href="/security"
              className="inline-flex min-h-11 items-center gap-1 rounded-pill border border-line bg-glass px-3.5 py-2 font-medium text-text-muted"
            >
              Security scan <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Desktop side rail */}
        <aside className="hidden space-y-4 lg:block">
          {showPilotReset && quota?.next_pilot_scan_at ? (
            <PilotDailyResetChip
              targetISO={quota.next_pilot_scan_at}
              onExpire={() => void refreshMeta()}
            />
          ) : null}
          <ScannerHistoryPanel
            items={history}
            loading={historyLoading}
            activeId={activeReportId}
            onSelect={(item) => void openHistoryItem(item)}
          />
          <div className="rounded-2xl border border-line bg-bg-2 p-5 shadow-sm">
            <h2 className="font-display text-sm font-bold text-text">What we check</h2>
            <ul className="mt-3 space-y-2.5">
              {CHECKS.map(({ icon: Icon, label }) => (
                <li key={label} className="flex items-start gap-2.5 text-xs text-text-muted">
                  <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-line bg-glass text-accent">
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  {label}
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>

      {state.phase === "opening" && (
        <div className="mt-8 flex items-center justify-center gap-3 rounded-2xl border border-line bg-bg-2 px-5 py-8 text-sm text-text-muted">
          <Loader2 className="h-5 w-5 animate-spin text-accent" />
          {state.message}
        </div>
      )}

      {/* Sticky mobile submit */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bg-2/95 p-3 backdrop-blur sm:hidden pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <button
          type="submit"
          form="scan-assessment-form"
          disabled={loading || !canSubmit}
          onClick={(e) => {
            e.preventDefault();
            const form = document.getElementById("scan-assessment-form") as HTMLFormElement | null;
            form?.requestSubmit();
          }}
          className="btn btn-accent btn-lg w-full min-h-12 disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Running…
            </>
          ) : quotaLocked ? (
            <>
              <Radar className="h-4 w-4" /> No scans left
            </>
          ) : (
            <>
              <Radar className="h-4 w-4" /> Start assessment
            </>
          )}
        </button>
      </div>
    </div>
    </>
  );
}
