"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  Download,
  FileText,
  Info,
  Lightbulb,
  Loader2,
  ShieldCheck,
  ShieldX,
  Sparkles,
} from "lucide-react";
import type { DpdpReportContext } from "@/lib/scanner/dpdp-types";
import { RemediationPlan } from "@/components/scanner/RemediationPlan";
import type { AssessmentIndicator } from "@/lib/scanner/assessment-map";

type Band = "high" | "mid" | "low";

/** Prefer verdict (authoritative); score_class alone mis-labels Partial scores >60 as green. */
function bandFor(
  scoreClass: string,
  verdictClass: string,
  score?: number,
  verdict?: string
): Band {
  if (verdictClass === "verdict-compliant" || verdict === "Likely Compliant") {
    return "high";
  }
  if (verdictClass === "verdict-partial" || verdict === "Partially Compliant") {
    return "mid";
  }
  if (
    verdictClass === "verdict-noncompliant" ||
    verdict === "Likely Non-Compliant"
  ) {
    return "low";
  }
  if (typeof score === "number") {
    if (score >= 80) return "high";
    if (score >= 50) return "mid";
    return "low";
  }
  if (scoreClass === "score-high") return "high";
  if (scoreClass === "score-mid") return "mid";
  return "low";
}

function scoreColor(band: Band): string {
  if (band === "high") return "var(--green)";
  if (band === "mid") return "var(--amber)";
  return "var(--red)";
}

const STATUS_CLS: Record<string, string> = {
  Found: "border-green/40 bg-green/12 text-green",
  Partial: "border-amber/40 bg-amber/12 text-amber",
  Missing: "border-red/40 bg-red/12 text-red",
};

function ScoreRing({ score, band }: { score: number; band: Band }) {
  const r = 52;
  const circ = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, score));
  const dash = (pct / 100) * circ;
  const color = scoreColor(band);
  return (
    <div className="relative grid h-36 w-36 shrink-0 place-items-center sm:h-44 sm:w-44">
      <svg viewBox="0 0 144 144" className="h-full w-full -rotate-90">
        <circle cx="72" cy="72" r={r} fill="none" stroke="var(--line)" strokeWidth="11" />
        <circle
          cx="72"
          cy="72"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="11"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
        />
      </svg>
      <div className="absolute text-center">
        <div className="font-display text-4xl font-semibold leading-none text-text">{score}</div>
        <div className="mt-1 font-mono text-[10px] uppercase tracking-wider text-text-faint">
          / 100
        </div>
      </div>
    </div>
  );
}

function parseScoreBreakdownLabel(item: string): { title: string; confidence: string | null } {
  const confMatch = item.match(/,?\s*conf:\s*(\d+%)/i);
  const confidence = confMatch?.[1] ?? null;
  if (!confidence) return { title: item, confidence: null };
  let title = item.replace(/,?\s*conf:\s*\d+%/i, "");
  title = title
    .replace(/\(\s*\)/g, "")
    .replace(/\(\s+/g, "(")
    .replace(/\s+\)/g, ")")
    .replace(/\s{2,}/g, " ")
    .trim();
  return { title, confidence };
}

function toRemediationFindings(data: DpdpReportContext): AssessmentIndicator[] {
  return (data.findings || []).map((f) => ({
    key: f.key,
    indicator: f.indicator,
    status: (["Found", "Partial", "Missing"].includes(f.status)
      ? f.status
      : "Missing") as AssessmentIndicator["status"],
    confidence: f.confidence,
    rule: f.rule,
    points: f.points,
    max_points: f.max_points,
    analysis: f.analysis,
    recommendation: f.recommendation,
    excerpt: f.excerpt,
    category: f.key,
  }));
}

export function DpdpEngineReport({ data }: { data: DpdpReportContext }) {
  const [pdfBusy, setPdfBusy] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const report = data.report || {};
  const band = bandFor(
    data.score_class || "",
    data.verdict_class || "",
    data.score,
    data.verdict
  );
  const scanSteps = (data.analysis_details?.scan_steps as string[]) ?? [];
  const policyUrls =
    data.discovered_policy_pages ??
    ((data.analysis_details?.policy_urls as Record<string, string>) ?? {});

  async function onDownloadPdf() {
    setPdfBusy(true);
    setPdfError(null);
    try {
      const res = await fetch(
        `/api/scanner/report/${encodeURIComponent(data.report_id)}/pdf`
      );
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as {
          detail?: string;
          error?: string;
        } | null;
        throw new Error(
          body?.detail || body?.error || `PDF download failed (HTTP ${res.status}).`
        );
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `DPDP-Report-${data.report_id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setPdfError(err instanceof Error ? err.message : "PDF download failed.");
    } finally {
      setPdfBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5 pb-20 pt-6 md:space-y-6 md:pt-8">
      <nav className="text-sm text-text-muted">
        <Link href="/scanner" className="inline-flex items-center gap-1 hover:text-text">
          <ArrowLeft className="h-4 w-4" />
          Assessments
        </Link>
        <span className="mx-2 text-text-faint">/</span>
        <span className="text-text-faint">Report</span>
      </nav>

      <header className="card relative overflow-hidden !p-0">
        <div
          className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full blur-3xl"
          style={{ background: `color-mix(in srgb, ${scoreColor(band)} 18%, transparent)` }}
          aria-hidden
        />
        <div className="relative grid gap-5 p-5 sm:grid-cols-[auto_1fr] sm:items-center md:gap-8 md:p-9">
          <ScoreRing score={data.score} band={band} />
          <div className="min-w-0">
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-text-faint">
              Compliance verdict
            </p>
            <h1
              className="mt-1 font-display text-2xl font-bold leading-tight tracking-tight md:text-4xl"
              style={{ color: scoreColor(band) }}
            >
              {data.verdict}
            </h1>
            <p className="mt-2 hidden max-w-xl text-sm text-text-muted md:block">
              Indicative assessment against the DPDP Act, 2025 and DPDP Rules, 2025, scored across
              weighted compliance indicators.
            </p>
            <dl className="mt-5 grid gap-3 border-t border-line pt-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-text-faint">
                  Website
                </dt>
                <dd className="mt-0.5 break-all font-medium text-text">{report.url || " - "}</dd>
              </div>
              <div>
                <dt className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-text-faint">
                  Assessment date
                </dt>
                <dd className="mt-0.5 text-text">
                  {report.timestamp?.slice(0, 19).replace("T", " ") ?? " - "}
                </dd>
              </div>
              <div>
                <dt className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-text-faint">
                  Collection method
                </dt>
                <dd className="mt-0.5 capitalize text-text">
                  {report.scraping_method === "pdf_upload"
                    ? "PDF upload"
                    : report.scraping_method ?? " - "}
                </dd>
              </div>
              <div>
                <dt className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-text-faint">
                  Analysis engine
                </dt>
                <dd className="mt-0.5 text-text">{data.ai_engine || "DeepSeek"}</dd>
              </div>
              <div>
                <dt className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-text-faint">
                  Scanner version
                </dt>
                <dd className="mt-0.5 text-text">{data.scanner_version || " - "}</dd>
              </div>
              <div>
                <dt className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-text-faint">
                  Ruleset
                </dt>
                <dd className="mt-0.5 text-text">{data.rules_version || " - "}</dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="relative border-t border-line px-5 py-5 md:px-9">
          <div className="flex flex-col gap-4 rounded-2xl border border-accent/25 bg-accent/[0.06] p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent/15 text-accent">
                <Sparkles className="h-5 w-5" />
              </span>
              <div>
                <p className="font-display text-base font-bold text-text">
                  Not sure what to do next?
                </p>
                <p className="mt-1 max-w-2xl text-sm leading-relaxed text-text-muted">
                  Your website has gaps in DPDP compliance, and fixing them properly requires legal
                  precision. TrustStack can help you close every gap - from drafting compliant policies
                  to setting up consent mechanisms.
                </p>
              </div>
            </div>
            <a
              href="mailto:info@truststack.co.in?subject=DPDP%20Compliance%20Help"
              className="btn btn-accent shrink-0 gap-2"
            >
              Talk to TrustStack <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </header>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => void onDownloadPdf()}
          disabled={pdfBusy}
          className="btn btn-accent gap-2"
        >
          {pdfBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          Download PDF
        </button>
        <Link href="/trustdeck/scanner" className="btn btn-ghost">
          New assessment
        </Link>
      </div>
      {pdfError && (
        <p className="text-sm text-red">{pdfError}</p>
      )}

      {data.policy_extraction_warning && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber/30 bg-amber/[0.07] px-4 py-3.5 text-sm">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber" />
          <p>
            We couldn&apos;t extract the privacy policy automatically. Paste the direct privacy
            policy URL under Direct Policy Links and scan again.
          </p>
        </div>
      )}

      {data.prompt_injection_detected && data.prompt_injection_detected.length > 0 && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber/30 bg-amber/[0.07] px-4 py-3.5 text-sm">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber" />
          <div>
            <p className="font-semibold text-amber">Security notice</p>
            <p className="mt-1 text-text-muted">
              The scraped policy text contained {data.prompt_injection_detected.length}{" "}
              instruction-like phrase
              {data.prompt_injection_detected.length === 1 ? "" : "s"} sometimes used in
              prompt-injection attempts. These were treated strictly as document data during
              analysis.
            </p>
          </div>
        </div>
      )}

      <RemediationPlan
        findings={toRemediationFindings(data)}
        reportId={data.report_id}
        score={data.score}
      />

      <section className="card overflow-hidden !p-0">
        <header className="border-b border-line px-5 py-5 md:px-7">
          <h2 className="font-display text-lg font-bold text-text">Compliance Summary</h2>
          <p className="mt-1 text-sm text-text-muted">
            Indicator-level assessment against DPDP Rules, 2025.
          </p>
        </header>
        <div className="overflow-x-auto px-2 pb-4">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-[0.7rem] uppercase tracking-[0.14em] text-text-faint">
                <th className="px-4 py-3 font-semibold">Indicator</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Confidence</th>
                <th className="px-4 py-3 font-semibold">Rule Reference</th>
                <th className="px-4 py-3 font-semibold">Points</th>
              </tr>
            </thead>
            <tbody>
              {(data.rows || []).map((row) => (
                <tr key={row.key} className="border-b border-line/70 hover:bg-surface-2/40">
                  <td className="px-4 py-3 font-medium text-text">{row.indicator}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-pill border px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider ${STATUS_CLS[row.status] || STATUS_CLS.Missing
                        }`}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-text-muted">
                    {row.confidence}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-text-muted">{row.rule}</td>
                  <td className="px-4 py-3 font-mono tabular-nums text-text">
                    {row.points} / {row.max_points}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {Object.keys(data.score_breakdown || {}).length > 0 && (
        <section className="card overflow-hidden !p-0">
          <header className="border-b border-line px-5 py-5 md:px-7">
            <h2 className="font-display text-lg font-bold text-text">Score Breakdown</h2>
          </header>
          <ul className="divide-y divide-line px-5 pb-2 md:px-7">
            {Object.entries(data.score_breakdown).map(([item, points]) => {
              const { title, confidence } = parseScoreBreakdownLabel(item);
              return (
                <li key={item} className="flex flex-wrap items-center gap-x-3 gap-y-1.5 py-3 text-sm">
                  <span className="min-w-0 flex-1 font-medium text-text">{title}</span>
                  <span className="inline-flex items-center rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 text-xs font-bold tabular-nums text-accent">
                    +{points} pts
                  </span>
                  {data.rule_citations?.[item] && (
                    <span className="font-mono text-xs text-text-faint">
                      {data.rule_citations[item]}
                    </span>
                  )}
                  {confidence && (
                    <span className="group/conf relative ml-auto inline-flex">
                      <button
                        type="button"
                        className="grid h-7 w-7 place-items-center rounded-full border border-line text-text-faint hover:border-accent/40 hover:text-accent"
                        aria-label={`Confidence ${confidence}`}
                      >
                        <Info className="h-3.5 w-3.5" />
                      </button>
                      <span className="pointer-events-none absolute bottom-full right-0 z-30 mb-2 hidden w-[15.5rem] rounded-xl border border-line bg-surface px-3.5 py-3 text-left shadow-lg group-hover/conf:block group-focus-within/conf:block">
                        <span className="block text-[0.75rem] font-semibold text-text">
                          Confidence: {confidence}
                        </span>
                        <span className="mt-1.5 block text-[0.7rem] text-text-muted">
                          How sure the scanner is about this finding from the policy text.
                        </span>
                      </span>
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section className="card">
        <h2 className="font-display text-lg font-bold text-text">Key Findings</h2>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            {
              label: "Privacy Policy",
              value: report.privacy_policy_found ? "Present" : "Not Found",
              ok: Boolean(report.privacy_policy_found),
            },
            {
              label: "Cookie Banner",
              value: report.cookie_banner_found ? "Detected" : "Not Detected",
              ok: Boolean(report.cookie_banner_found),
            },
            {
              label: "Grievance Contact",
              value: report.grievance_officer_contact || "Not Identified",
              ok: Boolean(report.grievance_officer_contact),
            },
          ].map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-line bg-surface-2/40 p-4">
              <span className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-text-faint">
                {stat.label}
              </span>
              <p
                className={`mt-2 flex items-center gap-2 text-sm font-semibold ${stat.ok ? "text-green" : "text-red"
                  }`}
              >
                <span
                  className={`grid h-7 w-7 place-items-center rounded-lg ${stat.ok ? "bg-green/15" : "bg-red/15"
                    }`}
                >
                  {stat.ok ? <ShieldCheck className="h-4 w-4" /> : <ShieldX className="h-4 w-4" />}
                </span>
                <span className="break-words">{stat.value}</span>
              </p>
            </div>
          ))}
        </div>
      </section>

      {(data.findings || []).length > 0 && (
        <section className="card overflow-hidden !p-0">
          <header className="border-b border-line px-5 py-5 md:px-7">
            <h2 className="font-display text-lg font-bold text-text">Detailed Analysis</h2>
            <p className="mt-1 text-sm text-text-muted">
              Expert assessment by indicator with policy excerpts and recommendations.
            </p>
          </header>
          <div className="space-y-4 px-5 py-5 md:px-7">
            {data.findings.map((item) => (
              <article
                key={item.key}
                className={`relative overflow-hidden rounded-2xl border border-line bg-surface-2/30 p-5 before:absolute before:inset-y-0 before:left-0 before:w-[3px] before:content-[''] ${item.status === "Found"
                  ? "before:bg-green"
                  : item.status === "Partial"
                    ? "before:bg-amber"
                    : "before:bg-red"
                  }`}
              >
                <header className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-display font-bold text-text">{item.indicator}</h3>
                  <span
                    className={`rounded-pill border px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider ${STATUS_CLS[item.status] || STATUS_CLS.Missing
                      }`}
                  >
                    {item.status}
                  </span>
                </header>
                <p className="mb-3 font-mono text-xs text-text-faint">{item.rule}</p>
                {item.analysis && (
                  <p className="text-sm leading-relaxed text-text">{item.analysis}</p>
                )}
                {item.excerpt &&
                  item.excerpt !== "[Excerpt not verifiable in original text]" &&
                  item.excerpt !== "Relevant text not located automatically" && (
                    <blockquote className="mt-3 rounded-r-lg border-l-[3px] border-line bg-bg/50 px-3 py-2 text-sm italic text-text-muted">
                      {item.excerpt}
                    </blockquote>
                  )}
                {item.recommendation &&
                  (item.status === "Missing" || item.status === "Partial") && (
                    <div className="mt-3 flex gap-2 rounded-xl border border-accent/25 bg-accent/[0.07] px-3 py-2.5 text-sm">
                      <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                      <span>
                        <strong className="font-semibold text-accent">Recommended action:</strong>{" "}
                        {item.recommendation}
                      </span>
                    </div>
                  )}
              </article>
            ))}
          </div>
        </section>
      )}

      {report.errors && report.errors.length > 0 && (
        <section className="card relative overflow-hidden">
          <span className="absolute inset-y-0 left-0 w-[3px] bg-amber" aria-hidden />
          <h2 className="font-display text-lg font-bold text-text">Errors &amp; Warnings</h2>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-text-muted marker:text-amber">
            {report.errors.map((err) => (
              <li key={err}>{err}</li>
            ))}
          </ul>
        </section>
      )}

      <details className="card group !p-0">
        <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 font-display font-semibold text-text marker:content-none md:px-7">
          <span className="inline-flex items-center gap-2">
            <FileText className="h-4 w-4 text-accent" />
            Technical Details
          </span>
          <ChevronDown className="h-4 w-4 text-text-faint transition-transform group-open:rotate-180" />
        </summary>
        <div className="border-t border-line px-5 pb-6 pt-4 text-sm text-text-muted md:px-7">
          <h3 className="mb-2 font-semibold text-text">Scan Execution Steps</h3>
          <ol className="mb-6 list-decimal space-y-1 pl-5">
            {scanSteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          {Object.keys(policyUrls).length > 0 && (
            <>
              <h3 className="mb-2 font-semibold text-text">Discovered Policy URLs</h3>
              <dl className="mb-6 grid gap-2 sm:grid-cols-[auto_1fr]">
                {Object.entries(policyUrls).map(([ptype, purl]) => (
                  <div key={ptype} className="contents">
                    <dt className="font-medium capitalize text-text">{ptype}</dt>
                    <dd className="break-all">
                      {purl ? (
                        <a
                          href={purl.startsWith("http") ? purl : undefined}
                          className="text-accent hover:underline"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {purl}
                        </a>
                      ) : (
                        "Not found"
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
            </>
          )}
          <h3 className="mb-2 font-semibold text-text">Text Analysis</h3>
          <p>
            Policy text length:{" "}
            {Number(data.analysis_details?.policy_text_length ?? 0).toLocaleString()} characters
          </p>
          <p>Chunks analyzed: {String(data.analysis_details?.chunks_analyzed ?? 0)}</p>
        </div>
      </details>
    </div>
  );
}
