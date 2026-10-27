"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ScanLine,
  ShieldCheck,
  ShieldAlert,
  Cookie,
  Radar,
  FileText,
  Lock,
  Unlock,
  ArrowRight,
  Loader2,
  CircleAlert,
} from "lucide-react";
import {
  SEVERITY_META,
  SCANNER_COPY,
  type ScanReport,
  type ScanError,
  type Severity,
  type CategoryScore,
  type Finding,
} from "@/content/scanner";

type State =
  | { phase: "idle" }
  | { phase: "loading" }
  | { phase: "error"; error: ScanError }
  | { phase: "done"; report: ScanReport };

function scoreColor(score: number): string {
  if (score >= 80) return "var(--green)";
  if (score >= 60) return "var(--gold)";
  if (score >= 40) return "var(--amber)";
  return "var(--red)";
}

function ScoreGauge({ score, grade }: { score: number; grade: string }) {
  const r = 54;
  const circ = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, score));
  const dash = (pct / 100) * circ;
  return (
    <div className="relative grid shrink-0 place-items-center">
      <svg width="148" height="148" viewBox="0 0 148 148" className="-rotate-90">
        <circle cx="74" cy="74" r={r} fill="none" stroke="var(--line)" strokeWidth="12" />
        <circle
          cx="74"
          cy="74"
          r={r}
          fill="none"
          stroke={scoreColor(score)}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
        />
      </svg>
      <div className="absolute text-center">
        <div className="font-display text-4xl font-semibold text-text">{score}</div>
        <div className="font-mono text-label uppercase tracking-wider text-text-faint">
          / 100 &middot; {grade}
        </div>
      </div>
    </div>
  );
}

function CategoryBar({ c }: { c: CategoryScore }) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-text-muted">{c.label}</span>
        <span className="font-mono text-text">{c.score}</span>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-pill" style={{ background: "var(--line)" }}>
        <div
          className="h-2 rounded-pill transition-all"
          style={{ width: `${c.score}%`, background: scoreColor(c.score) }}
        />
      </div>
    </div>
  );
}

function SeverityBadge({ s }: { s: Severity }) {
  const meta = SEVERITY_META[s];
  return <span className={`badge ${meta.badge}`}>{meta.label}</span>;
}

function Signal({
  ok,
  okLabel,
  badLabel,
  IconOk,
  IconBad,
}: {
  ok: boolean;
  okLabel: string;
  badLabel: string;
  IconOk: typeof Lock;
  IconBad: typeof Unlock;
}) {
  const Icon = ok ? IconOk : IconBad;
  return (
    <div className="flex items-center gap-2.5 rounded-lg border border-line bg-surface-2/40 px-3.5 py-3">
      <span
        className="grid h-8 w-8 shrink-0 place-items-center rounded-lg"
        style={{
          color: ok ? "var(--green)" : "var(--red)",
          background: ok
            ? "color-mix(in srgb, var(--green) 12%, transparent)"
            : "color-mix(in srgb, var(--red) 12%, transparent)",
        }}
      >
        <Icon className="h-4 w-4" />
      </span>
      <span className="text-sm text-text">{ok ? okLabel : badLabel}</span>
    </div>
  );
}

function FindingRow({ f, catLabel }: { f: Finding; catLabel: Record<string, string> }) {
  return (
    <div className="rounded-lg border border-line bg-surface-2/40 p-4">
      <div className="flex flex-wrap items-center gap-2.5">
        <SeverityBadge s={f.severity} />
        <span className="font-medium text-text">{f.title}</span>
        <span className="font-mono text-label uppercase tracking-wider text-text-faint">
          {catLabel[f.category] ?? f.category}
        </span>
        {f.source === "agent" && (
          <span className="badge badge-blue">AI</span>
        )}
      </div>
      {f.evidence && <p className="mt-2 text-sm leading-relaxed text-text-muted">{f.evidence}</p>}
      {f.recommendation && (
        <p className="mt-2 flex items-start gap-2 text-sm leading-relaxed text-text">
          <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
          <span>{f.recommendation}</span>
        </p>
      )}
      {f.dpdp_reference && (
        <p className="mt-2 font-mono text-label uppercase tracking-wider text-text-faint">
          {f.dpdp_reference}
        </p>
      )}
    </div>
  );
}

export function DpdpScanner() {
  const [url, setUrl] = useState("");
  const [state, setState] = useState<State>({ phase: "idle" });

  async function runScan(e: React.FormEvent) {
    e.preventDefault();
    const target = url.trim();
    if (!target) return;
    setState({ phase: "loading" });
    try {
      const res = await fetch("/api/scanner", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: target }),
      });
      const data = await res.json();
      if (!res.ok) {
        setState({ phase: "error", error: data as ScanError });
        return;
      }
      setState({ phase: "done", report: data as ScanReport });
    } catch {
      setState({
        phase: "error",
        error: { error: "network", detail: "Could not run the scan. Please try again." },
      });
    }
  }

  const loading = state.phase === "loading";

  return (
    <div className="mx-auto max-w-4xl">
      {/* Input */}
      <form onSubmit={runScan} className="card">
        <label htmlFor="scan-url" className="text-sm font-medium text-text">
          Website address
        </label>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row">
          <div className="flex flex-1 items-center gap-2 rounded-pill border border-line bg-bg px-4 py-2.5 focus-within:border-accent/60">
            <ScanLine className="h-4 w-4 shrink-0 text-text-faint" />
            <input
              id="scan-url"
              type="text"
              inputMode="url"
              autoComplete="url"
              value={url}
              onChange={(ev) => setUrl(ev.target.value)}
              placeholder={SCANNER_COPY.placeholder}
              disabled={loading}
              className="w-full bg-transparent text-text outline-none placeholder:text-text-faint"
            />
          </div>
          <button type="submit" disabled={loading} className="btn btn-accent btn-lg shrink-0">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Scanning&hellip;
              </>
            ) : (
              <>
                Run the scan <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-text-faint">{SCANNER_COPY.disclaimer}</p>
      </form>

      {/* Loading */}
      {loading && (
        <div className="card mt-6 flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-accent" />
          <p className="text-sm text-text-muted">
            Loading the site in a real browser, capturing cookies &amp; trackers, and reading the
            privacy &amp; cookie policies&hellip; this can take up to a minute.
          </p>
        </div>
      )}

      {/* Error */}
      {state.phase === "error" && (
        <div className="card mt-6 border-red/40">
          <div className="flex items-center gap-2.5">
            <CircleAlert className="h-5 w-5 text-red" />
            <span className="font-medium text-text">Scan could not complete</span>
          </div>
          <p className="mt-2 text-sm text-text-muted">
            {state.error.detail ?? state.error.error}
          </p>
        </div>
      )}

      {/* Report */}
      {state.phase === "done" && <ScannerReportView report={state.report} />}
    </div>
  );
}

export function ScannerReportView({ report }: { report: ScanReport }) {
  const catLabel = Object.fromEntries(report.categories.map((c) => [c.key, c.label]));
  const issues = report.findings.filter((f) => f.severity !== "pass" && f.severity !== "info");
  const passed = report.findings.filter((f) => f.severity === "pass" || f.severity === "info");
  const privacy = report.policies.find((p) => p.kind === "privacy");
  const cookiePolicy = report.policies.find((p) => p.kind === "cookie");

  return (
    <div className="mt-6 space-y-6">
      {/* Score + summary */}
      <div className="card">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
          <ScoreGauge score={report.overall_score} grade={report.grade} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="badge">DPDP readiness</span>
              <span
                className="badge"
                style={{
                  borderColor: `color-mix(in srgb, ${scoreColor(report.overall_score)} 40%, transparent)`,
                  background: `color-mix(in srgb, ${scoreColor(report.overall_score)} 12%, transparent)`,
                  color: scoreColor(report.overall_score),
                }}
              >
                {report.risk_level} risk
              </span>
            </div>
            <p className="mt-3 break-words text-sm leading-relaxed text-text">{report.summary}</p>
            <p className="mt-2 break-all font-mono text-label text-text-faint">
              {report.meta.final_url ?? report.url}
            </p>
          </div>
        </div>

        {/* Category bars */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {report.categories.map((c) => (
            <CategoryBar key={c.key} c={c} />
          ))}
        </div>
      </div>

      {/* Signals */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Signal
          ok={report.meta.https}
          okLabel="Served over HTTPS"
          badLabel="Not served over HTTPS"
          IconOk={Lock}
          IconBad={Unlock}
        />
        <Signal
          ok={report.meta.consent_banner_detected}
          okLabel="Consent banner detected"
          badLabel="No consent banner detected"
          IconOk={ShieldCheck}
          IconBad={ShieldAlert}
        />
        <Signal
          ok={!!privacy?.found}
          okLabel="Privacy policy found"
          badLabel="No privacy policy found"
          IconOk={FileText}
          IconBad={FileText}
        />
        <Signal
          ok={!!cookiePolicy?.found}
          okLabel="Cookie policy found"
          badLabel="No cookie policy found"
          IconOk={FileText}
          IconBad={FileText}
        />
        <div className="flex items-center gap-2.5 rounded-lg border border-line bg-surface-2/40 px-3.5 py-3">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-accent/10 text-accent">
            <Cookie className="h-4 w-4" />
          </span>
          <span className="text-sm text-text">
            {report.meta.cookies_total} cookie{report.meta.cookies_total === 1 ? "" : "s"} on load
          </span>
        </div>
        <div className="flex items-center gap-2.5 rounded-lg border border-line bg-surface-2/40 px-3.5 py-3">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-accent/10 text-accent">
            <Radar className="h-4 w-4" />
          </span>
          <span className="text-sm text-text">
            {report.meta.third_party_trackers} third-party tracker
            {report.meta.third_party_trackers === 1 ? "" : "s"}
          </span>
        </div>
      </div>

      {/* Issues */}
      {issues.length > 0 && (
        <div>
          <h3 className="font-display text-lg font-semibold text-text">
            Prioritised fixes ({issues.length})
          </h3>
          <div className="mt-3 space-y-3">
            {issues.map((f) => (
              <FindingRow key={f.id} f={f} catLabel={catLabel} />
            ))}
          </div>
        </div>
      )}

      {/* Passed / info */}
      {passed.length > 0 && (
        <details className="card">
          <summary className="cursor-pointer text-sm font-medium text-text">
            Passed &amp; informational checks ({passed.length})
          </summary>
          <div className="mt-3 space-y-3">
            {passed.map((f) => (
              <FindingRow key={f.id} f={f} catLabel={catLabel} />
            ))}
          </div>
        </details>
      )}

      {/* Trackers */}
      {report.trackers.length > 0 && (
        <div className="card">
          <h3 className="font-display text-lg font-semibold text-text">Third-party domains</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {report.trackers.map((t) => (
              <span key={t.domain} className="chip" title={`${t.requests} request(s)`}>
                {t.domain}
                <span className="font-mono text-label uppercase tracking-wider text-text-faint">
                  {t.category}
                </span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Cookies */}
      {report.cookies.length > 0 && (
        <div className="card">
          <h3 className="font-display text-lg font-semibold text-text">
            Cookies set on load ({report.cookies.length})
          </h3>
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
                {report.cookies.slice(0, 20).map((ck, i) => (
                  <tr key={`${ck.name}-${i}`} className="border-t border-line/60">
                    <td className="py-2 pr-4 font-mono text-xs text-text">{ck.name}</td>
                    <td className="py-2 pr-4 font-mono text-xs">{ck.domain}</td>
                    <td className="py-2 pr-4">{ck.session ? "session" : "persistent"}</td>
                    <td className="py-2">
                      <span className="flex flex-wrap gap-1.5">
                        {ck.third_party && <span className="chip">3rd-party</span>}
                        {ck.secure && <span className="chip">secure</span>}
                        {ck.http_only && <span className="chip">httpOnly</span>}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="card card-hover flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h3 className="font-display text-lg font-semibold text-text">
            Want a defensible, board-ready assessment?
          </h3>
          <p className="mt-1 text-sm text-text-muted">
            This scan checks public signals only. DPDP Compass&trade; gives you an evidence-based
            score and a 90-day action roadmap.
          </p>
        </div>
        <Link href="/#risk-check" className="btn btn-accent shrink-0">
          Book DPDP Compass&trade; <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
