"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Lock,
  ArrowRight,
  Loader2,
  CircleAlert,
  PlugZap,
} from "lucide-react";
import {
  STATUS_META,
  SECURITY_COPY,
  type SecurityReport,
  type SecurityScanError,
  type CapabilityResult,
  type SubCheckResult,
} from "@/content/security-scanner";
import type { ManagerAnalysis } from "@/lib/security-compliance-contract";
import { AiComplianceManager } from "@/components/tools/AiComplianceManager";
import { ComplianceExplanation } from "@/components/tools/ComplianceExplanation";

type State =
  | { phase: "idle" }
  | { phase: "loading" }
  | { phase: "error"; error: SecurityScanError }
  | { phase: "done"; report: SecurityReport };

function scoreColor(score: number): string {
  if (score >= 80) return "var(--green)";
  if (score >= 60) return "var(--gold)";
  if (score >= 40) return "var(--amber)";
  return "var(--red)";
}

function ScoreGauge({ score, grade }: { score: number; grade: string }) {
  const r = 54;
  const circ = 2 * Math.PI * r;
  const dash = (Math.max(0, Math.min(100, score)) / 100) * circ;
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

function StatusBadge({ status }: { status: SubCheckResult["status"] }) {
  const meta = STATUS_META[status];
  return <span className={`badge ${meta.badge}`}>{meta.label}</span>;
}

function CapabilityCard({ cap }: { cap: CapabilityResult }) {
  return (
    <div className="card">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="text-xl" aria-hidden>
            {cap.icon}
          </span>
          <h3 className="font-display text-base font-semibold text-text">{cap.label}</h3>
        </div>
        <span className="font-mono text-lg font-semibold" style={{ color: scoreColor(cap.score) }}>
          {cap.score}
        </span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-pill" style={{ background: "var(--line)" }}>
        <div
          className="h-2 rounded-pill"
          style={{ width: `${cap.score}%`, background: scoreColor(cap.score) }}
        />
      </div>
      <ul className="mt-4 space-y-2.5">
        {cap.checks.map((c) => (
          <li key={c.id} className="flex items-start gap-2.5">
            <span className="mt-0.5 shrink-0">
              <StatusBadge status={c.status} />
            </span>
            <div className="min-w-0">
              <div className="text-sm text-text">{c.label}</div>
              {c.evidence && <div className="text-xs text-text-muted">{c.evidence}</div>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function DpdpSecurityScanner() {
  const [url, setUrl] = useState("");
  const [state, setState] = useState<State>({ phase: "idle" });

  async function runScan(e: React.FormEvent) {
    e.preventDefault();
    const target = url.trim();
    if (!target) return;
    setState({ phase: "loading" });
    try {
      const res = await fetch("/api/security-scanner", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: target }),
      });
      const data = await res.json();
      if (!res.ok) {
        setState({ phase: "error", error: data as SecurityScanError });
        return;
      }
      setState({ phase: "done", report: data as SecurityReport });
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
      <form onSubmit={runScan} className="card">
        <label htmlFor="sec-url" className="text-sm font-medium text-text">
          Website address
        </label>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row">
          <div className="flex flex-1 items-center gap-2 rounded-pill border border-line bg-bg px-4 py-2.5 focus-within:border-accent/60">
            <Lock className="h-4 w-4 shrink-0 text-text-faint" />
            <input
              id="sec-url"
              type="text"
              inputMode="url"
              autoComplete="url"
              value={url}
              onChange={(ev) => setUrl(ev.target.value)}
              placeholder={SECURITY_COPY.placeholder}
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
                Run security scan <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-text-faint">{SECURITY_COPY.disclaimer}</p>
      </form>

      {loading && (
        <div className="card mt-6 flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-accent" />
          <p className="text-sm text-text-muted">
            Loading the site, inspecting TLS, security headers, cookies, exposure and third-party
            surface&hellip;
          </p>
        </div>
      )}

      {state.phase === "error" && (
        <div className="card mt-6 border-red/40">
          <div className="flex items-center gap-2.5">
            <CircleAlert className="h-5 w-5 text-red" />
            <span className="font-medium text-text">Scan could not complete</span>
          </div>
          <p className="mt-2 text-sm text-text-muted">{state.error.detail ?? state.error.error}</p>
        </div>
      )}

      {state.phase === "done" && (
        <Report key={`${state.report.url}:${state.report.scanned_at}`} report={state.report} />
      )}
    </div>
  );
}

function Report({ report }: { report: SecurityReport }) {
  const [managerAnalysis, setManagerAnalysis] = useState<ManagerAnalysis | null>(null);
  const fixes = report.remediation;
  const explanations = new Map(
    managerAnalysis?.explanations.map((explanation) => [explanation.findingId, explanation]) ?? []
  );
  const firstExplainedFixId = fixes.find((fix) => explanations.has(fix.id))?.id;
  return (
    <div className="mt-6 space-y-6">
      {/* Score + summary */}
      <div className="card">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
          <ScoreGauge score={report.overall_score} grade={report.grade} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="badge">DPDP Security Score</span>
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
              {report.meta.tls_version ? ` · ${report.meta.tls_version}` : ""}
              {report.meta.tls_days_to_expiry != null
                ? ` · cert ${report.meta.tls_days_to_expiry}d to expiry`
                : ""}
            </p>
          </div>
        </div>
      </div>

      <AiComplianceManager report={report} onAnalysisChange={setManagerAnalysis} />

      {/* Capability cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {report.capabilities.map((cap) => (
          <CapabilityCard key={cap.key} cap={cap} />
        ))}
      </div>

      {/* Remediation */}
      {fixes.length > 0 && (
        <div>
          <h3 className="font-display text-lg font-semibold text-text">
            Prioritised fixes ({fixes.length})
          </h3>
          <div className="mt-3 space-y-3">
            {fixes.map((f) => (
              <div key={f.id} className="rounded-lg border border-line bg-surface-2/40 p-4">
                <div className="flex flex-wrap items-center gap-2.5">
                  <StatusBadge status={f.status} />
                  <span className="font-medium text-text">{f.label}</span>
                  {f.dpdp_reference && (
                    <span className="font-mono text-label uppercase tracking-wider text-text-faint">
                      {f.dpdp_reference}
                    </span>
                  )}
                </div>
                {f.evidence && (
                  <p className="mt-2 text-sm leading-relaxed text-text-muted">{f.evidence}</p>
                )}
                {f.remediation && (
                  <p className="mt-2 flex items-start gap-2 text-sm leading-relaxed text-text">
                    <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                    <span>{f.remediation}</span>
                  </p>
                )}
                {explanations.has(f.id) && (
                  <ComplianceExplanation
                    explanation={explanations.get(f.id)!}
                    defaultOpen={f.id === firstExplainedFixId}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Deeper assessment (honest: needs connected systems) */}
      {report.deeper_assessment.length > 0 && (
        <div className="card">
          <div className="flex items-center gap-2.5">
            <PlugZap className="h-5 w-5 text-accent" />
            <h3 className="font-display text-lg font-semibold text-text">
              Go deeper - verify the controls a public scan can&apos;t see
            </h3>
          </div>
          <p className="mt-1 text-sm text-text-muted">
            These need read-only access to your own systems. We show them honestly rather than
            guessing.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {report.deeper_assessment.map((d) => (
              <div key={d.key} className="rounded-lg border border-line bg-surface-2/40 p-4">
                <div className="text-xl" aria-hidden>
                  {d.icon}
                </div>
                <div className="mt-1.5 text-sm font-medium text-text">{d.label}</div>
                <p className="mt-1 text-xs leading-relaxed text-text-muted">{d.why}</p>
                <p className="mt-2 text-xs font-medium text-accent">{d.needs}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="card card-hover flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
          <div>
            <h3 className="font-display text-lg font-semibold text-text">
              Turn this into a board-ready security posture
            </h3>
            <p className="mt-1 text-sm text-text-muted">
              DPDP Compass&trade; combines this scan with your internal controls into an
              evidence-based score and a 90-day roadmap.
            </p>
          </div>
        </div>
        <Link href="/#risk-check" className="btn btn-accent shrink-0">
          Book DPDP Compass&trade; <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
