"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  Cookie,
  Download,
  FileText,
  Lightbulb,
  Loader2,
  Radar,
  ShieldCheck,
  ShieldX,
  Sparkles,
} from "lucide-react";
import { SCANNER_COPY, type ScanReport } from "@/content/scanner";
import { downloadScannerReportPdf } from "@/lib/scanner/report-pdf";
import {
  mapScanReportToIndicators,
  scoreBreakdownFromReport,
  verdictFromReport,
} from "@/lib/scanner/assessment-map";
import { RemediationPlan } from "@/components/scanner/RemediationPlan";

function scoreColor(score: number): string {
  if (score >= 80) return "var(--green)";
  if (score >= 60) return "var(--gold)";
  if (score >= 40) return "var(--amber)";
  return "var(--red)";
}

const STATUS_CLS: Record<string, string> = {
  Found: "border-green/40 bg-green/12 text-green",
  Partial: "border-amber/40 bg-amber/12 text-amber",
  Missing: "border-red/40 bg-red/12 text-red",
};

function ScoreRing({ score }: { score: number }) {
  const r = 52;
  const circ = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, score));
  const dash = (pct / 100) * circ;
  return (
    <div className="relative grid h-36 w-36 shrink-0 place-items-center">
      <svg width="144" height="144" viewBox="0 0 144 144" className="-rotate-90">
        <circle cx="72" cy="72" r={r} fill="none" stroke="var(--line)" strokeWidth="11" />
        <circle
          cx="72"
          cy="72"
          r={r}
          fill="none"
          stroke={scoreColor(score)}
          strokeWidth="11"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center text-center">
        <div className="font-display text-4xl font-semibold leading-none text-text">{score}</div>
        <div className="mt-1 font-mono text-[10px] uppercase tracking-wider text-text-faint">
          / 100
        </div>
      </div>
    </div>
  );
}

export type AssessmentMeta = {
  reportId: string;
  url: string;
  score: number;
  verdict: string;
  scannedAt: string;
  limited?: boolean;
};

export function ScannerAssessmentReport({
  report,
  meta,
}: {
  report: ScanReport | null;
  meta: AssessmentMeta;
}) {
  const [pdfBusy, setPdfBusy] = useState(false);
  const limited = meta.limited || !report;
  const display = report;
  const score = display?.overall_score ?? meta.score;
  const verdict = display ? verdictFromReport(display) : meta.verdict || "Saved assessment";

  const indicators = useMemo(
    () => (display ? mapScanReportToIndicators(display) : []),
    [display]
  );
  const breakdown = useMemo(
    () => (display ? scoreBreakdownFromReport(display) : []),
    [display]
  );

  const privacy = display?.policies.find((p) => p.kind === "privacy");
  const cookiePolicy = display?.policies.find((p) => p.kind === "cookie");
  const grievanceFinding = indicators.find((i) =>
    /grievance|dpo/i.test(i.indicator + i.key)
  );
  const grievanceOk = grievanceFinding?.status === "Found";
  const grievanceValue =
    grievanceOk
      ? "Identified in notice signals"
      : grievanceFinding?.status === "Partial"
        ? "Partially identified"
        : "Not Identified";

  async function onDownloadPdf() {
    if (!display || limited) return;
    setPdfBusy(true);
    try {
      await downloadScannerReportPdf(display, meta.reportId);
    } finally {
      setPdfBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5 pb-20 pt-6 md:space-y-6 md:pt-8">
      <nav className="text-sm text-text-muted">
        <Link
          href="/scanner"
          className="inline-flex items-center gap-1 transition-colors hover:text-text"
        >
          <ArrowLeft className="h-4 w-4" />
          Assessments
        </Link>
        <span className="mx-2 text-text-faint">/</span>
        <span className="text-text-faint">Report</span>
      </nav>

      {/* Hero */}
      <header className="card relative overflow-hidden !p-0">
        <div
          className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full blur-3xl"
          style={{
            background: `color-mix(in srgb, ${scoreColor(score)} 18%, transparent)`,
          }}
          aria-hidden
        />
        <div className="relative grid gap-5 p-5 sm:grid-cols-[auto_1fr] sm:items-center sm:gap-8 md:p-9">
          <ScoreRing score={score} />
          <div className="min-w-0">
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-text-faint">
              Compliance verdict
            </p>
            <h1
              className="mt-1 font-display text-2xl font-bold leading-tight tracking-tight md:text-4xl"
              style={{ color: scoreColor(score) }}
            >
              {verdict}
            </h1>
            <p className="mt-2 hidden max-w-xl text-sm text-text-muted md:block">
              Indicative assessment against the DPDP Act, 2023 and related Rules, scored across
              weighted compliance indicators from public website signals.
            </p>
            <dl className="mt-5 grid gap-3 border-t border-line pt-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-text-faint">
                  Website
                </dt>
                <dd className="mt-0.5 break-all font-medium text-text">
                  {display?.meta.final_url ?? display?.url ?? meta.url}
                </dd>
              </div>
              <div>
                <dt className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-text-faint">
                  Assessment date
                </dt>
                <dd className="mt-0.5 text-text">
                  {new Date(display?.scanned_at ?? meta.scannedAt).toLocaleString("en-IN")}
                </dd>
              </div>
              {display && (
                <>
                  <div>
                    <dt className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-text-faint">
                      Collection method
                    </dt>
                    <dd className="mt-0.5 capitalize text-text">
                      {display.meta.model_mode === "pdf" ? "PDF upload" : "Website crawl"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-text-faint">
                      Analysis engine
                    </dt>
                    <dd className="mt-0.5 text-text">
                      {display.meta.engine || "truststack-url"}
                      {display.meta.model_mode ? ` · ${display.meta.model_mode}` : ""}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-text-faint">
                      Risk level
                    </dt>
                    <dd className="mt-0.5 capitalize text-text">{display.risk_level}</dd>
                  </div>
                  <div>
                    <dt className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-text-faint">
                      Grade
                    </dt>
                    <dd className="mt-0.5 text-text">{display.grade}</dd>
                  </div>
                </>
              )}
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
                  Your website may have gaps in DPDP compliance. Use the remediation plan below, or
                  talk to Anix for help closing every gap - from notices to consent mechanisms.
                </p>
              </div>
            </div>
            <a
              href="mailto:consult@anixai.io?subject=DPDP%20Compliance%20Help"
              className="btn btn-accent shrink-0 gap-2 whitespace-nowrap"
            >
              Talk to Anix AI
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </header>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => void onDownloadPdf()}
          disabled={limited || pdfBusy || !display}
          className="btn btn-accent gap-2"
          title={limited ? "Full report required for PDF download" : "Download PDF"}
        >
          {pdfBusy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          Download PDF
        </button>
        <Link href="/scanner" className="btn btn-ghost gap-2">
          New assessment
        </Link>
      </div>

      {limited && (
        <div className="rounded-xl border border-amber/35 bg-amber/[0.08] px-4 py-4 text-sm text-text">
          <p className="font-semibold text-amber">Limited history record</p>
          <p className="mt-1 text-text-muted">
            Full finding details were not stored for this older scan (score{" "}
            <span className="font-mono text-text">{meta.score}</span>
            {meta.verdict ? ` · ${meta.verdict}` : ""}). Run a new assessment to generate the full
            remediation plan, detailed analysis, and PDF.
          </p>
          <Link href="/scanner" className="btn btn-accent mt-3 inline-flex">
            Run new assessment <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}

      {display && !limited && (
        <>
          {display.summary && (
            <section className="card">
              <h2 className="font-display text-lg font-semibold text-text">Executive summary</h2>
              <p className="mt-2 text-sm leading-relaxed text-text-muted">{display.summary}</p>
            </section>
          )}

          {/* Remediation Plan - original scanner feature */}
          <RemediationPlan
            findings={indicators}
            reportId={meta.reportId}
            score={score}
          />

          {/* Compliance Summary table */}
          <section className="card overflow-hidden !p-0">
            <header className="border-b border-line px-5 py-5 md:px-7">
              <h2 className="font-display text-lg font-bold tracking-tight text-text">
                Compliance Summary
              </h2>
              <p className="mt-1 text-sm text-text-muted">
                Indicator-level assessment against DPDP-relevant public obligations.
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
                  {indicators.map((row) => (
                    <tr
                      key={row.key}
                      className="border-b border-line/70 transition-colors hover:bg-surface-2/40"
                    >
                      <td className="px-4 py-3 font-medium text-text">{row.indicator}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-pill border px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider ${
                            STATUS_CLS[row.status]
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

          {/* Score Breakdown */}
          {breakdown.length > 0 && (
            <section className="card overflow-hidden !p-0">
              <header className="border-b border-line px-5 py-5 md:px-7">
                <h2 className="font-display text-lg font-bold tracking-tight text-text">
                  Score Breakdown
                </h2>
                <p className="mt-1 text-sm text-text-muted">
                  Weighted contribution of each category to the overall score.
                </p>
              </header>
              <ul className="divide-y divide-line px-5 pb-2 md:px-7">
                {breakdown.map((item) => (
                  <li
                    key={item.label}
                    className="flex flex-wrap items-center gap-x-3 gap-y-1.5 py-3 text-sm"
                  >
                    <span className="min-w-0 flex-1 font-medium text-text">{item.label}</span>
                    <span className="inline-flex items-center rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 text-xs font-bold tabular-nums text-accent">
                      +{item.points} pts
                    </span>
                    <span className="font-mono text-xs text-text-faint">{item.citation}</span>
                  </li>
                ))}
                {display.categories.map((c) => (
                  <li key={`bar-${c.key}`} className="py-3">
                    <div className="mb-1.5 flex items-center justify-between text-sm">
                      <span className="text-text-muted">{c.label} readiness</span>
                      <span className="font-mono text-text">{c.score}/100</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-pill bg-line">
                      <div
                        className="h-2 rounded-pill"
                        style={{
                          width: `${c.score}%`,
                          background: scoreColor(c.score),
                        }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Key Findings cards */}
          <section className="card">
            <h2 className="font-display text-lg font-bold tracking-tight text-text">Key Findings</h2>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                {
                  label: "Privacy Policy",
                  value: privacy?.found ? "Present" : "Not Found",
                  ok: !!privacy?.found,
                },
                {
                  label: "Cookie Banner",
                  value: display.meta.consent_banner_detected ? "Detected" : "Not Detected",
                  ok: display.meta.consent_banner_detected,
                },
                {
                  label: "Grievance Contact",
                  value: grievanceValue,
                  ok: grievanceOk,
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-line bg-surface-2/40 p-4 transition-all hover:border-line"
                >
                  <span className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-text-faint">
                    {stat.label}
                  </span>
                  <p
                    className={`mt-2 flex items-center gap-2 text-sm font-semibold ${
                      stat.ok ? "text-green" : "text-red"
                    }`}
                  >
                    <span
                      className={`grid h-7 w-7 place-items-center rounded-lg ${
                        stat.ok ? "bg-green/15" : "bg-red/15"
                      }`}
                    >
                      {stat.ok ? (
                        <ShieldCheck className="h-4 w-4" />
                      ) : (
                        <ShieldX className="h-4 w-4" />
                      )}
                    </span>
                    <span className="break-words">{stat.value}</span>
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <div className="flex items-center gap-2.5 rounded-xl border border-line bg-surface-2/30 px-3.5 py-3 text-sm">
                <Cookie className="h-4 w-4 text-accent" />
                {display.meta.cookies_total} cookies on load
              </div>
              <div className="flex items-center gap-2.5 rounded-xl border border-line bg-surface-2/30 px-3.5 py-3 text-sm">
                <Radar className="h-4 w-4 text-accent" />
                {display.meta.third_party_trackers} third-party trackers
              </div>
              <div className="flex items-center gap-2.5 rounded-xl border border-line bg-surface-2/30 px-3.5 py-3 text-sm">
                <FileText className="h-4 w-4 text-accent" />
                {cookiePolicy?.found ? "Cookie policy found" : "No cookie policy found"}
              </div>
            </div>
          </section>

          {/* Detailed Analysis */}
          {indicators.length > 0 && (
            <section className="card overflow-hidden !p-0">
              <header className="border-b border-line px-5 py-5 md:px-7">
                <h2 className="font-display text-lg font-bold tracking-tight text-text">
                  Detailed Analysis
                </h2>
                <p className="mt-1 text-sm text-text-muted">
                  Expert assessment by indicator with evidence, excerpts and recommendations.
                </p>
              </header>
              <div className="space-y-4 px-5 py-5 md:px-7">
                {indicators.map((item) => (
                  <article
                    key={item.key}
                    className={`relative overflow-hidden rounded-2xl border border-line bg-surface-2/30 p-5 before:absolute before:inset-y-0 before:left-0 before:w-[3px] before:content-[''] ${
                      item.status === "Found"
                        ? "before:bg-green"
                        : item.status === "Partial"
                          ? "before:bg-amber"
                          : "before:bg-red"
                    }`}
                  >
                    <header className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <h3 className="font-display font-bold text-text">{item.indicator}</h3>
                      <span
                        className={`rounded-pill border px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider ${
                          STATUS_CLS[item.status]
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
                      item.excerpt.length > 12 &&
                      item.excerpt !== item.analysis && (
                        <blockquote className="mt-3 rounded-r-lg border-l-[3px] border-line bg-bg/50 px-3 py-2 text-sm italic text-text-muted">
                          {item.excerpt}
                        </blockquote>
                      )}
                    {item.recommendation &&
                      (item.status === "Missing" || item.status === "Partial") && (
                        <div className="mt-3 flex gap-2 rounded-xl border border-accent/25 bg-accent/[0.07] px-3 py-2.5 text-sm text-text">
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

          {/* Discovered policy pages */}
          {display.policies.length > 0 && (
            <section className="card">
              <h2 className="font-display text-lg font-semibold text-text">
                Discovered Policy Pages
              </h2>
              <dl className="mt-4 grid gap-3 sm:grid-cols-[auto_1fr] sm:gap-x-6">
                {display.policies.map((p) => (
                  <div key={p.kind} className="contents">
                    <dt className="font-medium capitalize text-text">{p.kind}</dt>
                    <dd className="break-all text-sm text-text-muted">
                      {p.found && p.url ? (
                        <a
                          href={p.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-accent hover:underline"
                        >
                          {p.url}
                        </a>
                      ) : p.found ? (
                        "Found"
                      ) : (
                        "Not found"
                      )}
                      {p.word_count > 0 && (
                        <span className="ml-2 font-mono text-label text-text-faint">
                          {p.word_count} words
                        </span>
                      )}
                      {p.excerpt && p.found && (
                        <p className="mt-1 line-clamp-3 text-xs italic text-text-faint">
                          {p.excerpt}
                        </p>
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          {/* Trackers */}
          {display.trackers.length > 0 && (
            <section className="card">
              <h2 className="font-display text-lg font-semibold text-text">
                Third-party domains ({display.trackers.length})
              </h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {display.trackers.map((t) => (
                  <span key={t.domain} className="chip" title={`${t.requests} request(s)`}>
                    {t.domain}
                    <span className="font-mono text-label uppercase tracking-wider text-text-faint">
                      {t.category}
                    </span>
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Cookies full table */}
          {display.cookies.length > 0 && (
            <section className="card">
              <h2 className="font-display text-lg font-semibold text-text">
                Cookies set on load ({display.cookies.length})
              </h2>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-[560px] text-left text-sm">
                  <thead>
                    <tr className="text-text-faint">
                      <th className="pb-2 pr-4 font-medium">Name</th>
                      <th className="pb-2 pr-4 font-medium">Domain</th>
                      <th className="pb-2 pr-4 font-medium">Type</th>
                      <th className="pb-2 font-medium">Flags</th>
                    </tr>
                  </thead>
                  <tbody className="text-text-muted">
                    {display.cookies.map((ck, i) => (
                      <tr key={`${ck.name}-${i}`} className="border-t border-line/60">
                        <td className="py-2 pr-4 font-mono text-xs text-text">{ck.name}</td>
                        <td className="py-2 pr-4 font-mono text-xs">{ck.domain}</td>
                        <td className="py-2 pr-4">
                          {ck.session ? "session" : "persistent"}
                        </td>
                        <td className="py-2">
                          <span className="flex flex-wrap gap-1.5">
                            {ck.third_party && <span className="chip">3rd-party</span>}
                            {ck.secure && <span className="chip">secure</span>}
                            {ck.http_only && <span className="chip">httpOnly</span>}
                            {ck.same_site && (
                              <span className="chip">SameSite={ck.same_site}</span>
                            )}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Errors & warnings from notes */}
          {display.meta.notes?.length > 0 && (
            <section className="card relative overflow-hidden">
              <span className="absolute inset-y-0 left-0 w-[3px] bg-amber" aria-hidden />
              <h2 className="font-display text-lg font-bold tracking-tight text-text">
                Notes &amp; Warnings
              </h2>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-text-muted marker:text-amber">
                {display.meta.notes.map((err) => (
                  <li key={err}>{err}</li>
                ))}
              </ul>
            </section>
          )}

          {/* Technical Details */}
          <details className="card group !p-0">
            <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 font-display font-semibold text-text marker:content-none md:px-7">
              <span className="inline-flex items-center gap-2">
                <FileText className="h-4 w-4 text-accent" />
                Technical Details
              </span>
              <ChevronDown className="h-4 w-4 text-text-faint transition-transform duration-300 group-open:rotate-180" />
            </summary>
            <div className="border-t border-line px-5 pb-6 pt-4 text-sm text-text-muted md:px-7">
              <h3 className="mb-2 font-semibold text-text">Scan execution</h3>
              <ol className="mb-6 list-decimal space-y-1 pl-5 marker:text-text-faint">
                <li>Resolved target URL and fetched homepage HTML over HTTPS/HTTP</li>
                <li>Detected consent/cookie banner patterns in page markup</li>
                <li>Followed privacy / terms / cookie policy link candidates</li>
                <li>Inventoried Set-Cookie headers and common third-party tracker domains</li>
                <li>Scored weighted DPDP-relevant public signals into the report</li>
              </ol>

              <h3 className="mb-2 font-semibold text-text">Response meta</h3>
              <p className="mb-1">
                Final URL:{" "}
                <span className="break-all font-mono text-xs text-text">
                  {display.meta.final_url ?? display.url}
                </span>
              </p>
              <p className="mb-1">HTTP status: {display.meta.status}</p>
              <p className="mb-6">
                Engine: {display.meta.engine} · mode: {display.meta.model_mode}
              </p>

              {Object.keys(display.meta.security_headers || {}).length > 0 && (
                <>
                  <h3 className="mb-2 font-semibold text-text">Security headers</h3>
                  <dl className="mb-6 grid gap-2 sm:grid-cols-2">
                    {Object.entries(display.meta.security_headers).map(([k, v]) => (
                      <div
                        key={k}
                        className="flex justify-between gap-3 rounded-lg border border-line px-3 py-2"
                      >
                        <dt className="font-mono text-xs text-text">{k}</dt>
                        <dd className={v ? "text-green" : "text-red"}>
                          {v ? "present" : "missing"}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </>
              )}

              <h3 className="mb-2 font-semibold text-text">Text analysis</h3>
              <p>
                Privacy notice words:{" "}
                {(privacy?.word_count ?? 0).toLocaleString("en-IN")}
              </p>
              <p>Indicators assessed: {indicators.length}</p>
              <p>Report ID: <span className="font-mono text-xs">{meta.reportId}</span></p>
            </div>
          </details>

          <p className="text-xs leading-relaxed text-text-faint">{SCANNER_COPY.disclaimer}</p>

          <div className="card flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h3 className="font-display text-lg font-semibold text-text">
                Want a defensible, board-ready assessment?
              </h3>
              <p className="mt-1 text-sm text-text-muted">
                This scan checks public signals only. DPDP Compass&trade; gives you an
                evidence-based score and a 90-day action roadmap.
              </p>
            </div>
            <Link href="/#risk-check" className="btn btn-accent shrink-0">
              Book DPDP Compass&trade; <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
