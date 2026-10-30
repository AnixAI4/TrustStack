"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { answeredProgress, GAP_OPENING_SEVERITIES, GAP_SEVERITY_LABEL, ROPA_BANDS } from "@truststack/core";
import { Notice } from "@/components/feedback/notice";
import { apiFetch } from "@/lib/client/api";
import { formatScore } from "@/lib/client/assessments";
import { formatDay, type DashboardPayload, type DashboardReadiness } from "@/lib/client/dashboard";
import { SEVERITY_STYLE } from "@/lib/client/gaps";
import { usePermissions } from "@/lib/client/permissions";
import { BAND_STYLE } from "@/lib/client/ropa";
import { Scorecard } from "./assessments/[assessmentId]/score-panel";
import { ExposureStrip } from "./exposure-strip";
import { NextSteps } from "./next-steps";

/**
 * The executive overview (Slice 8): where the organisation stands, what is
 * being done about it, and how complete its processing register is — from ONE
 * request, `GET …/dashboard`.
 *
 * Every number on this page was produced by the engine or the database. The
 * browser formats them and nothing else: no score is computed, no count is
 * re-derived, and the readiness score and the register's completeness are
 * never on one tile, never added, never charted together (D-061).
 *
 * It is a READINESS view (D-011). It reads; it changes nothing — there is no
 * control on it that writes, whoever is looking.
 */
export function ExecutiveOverview() {
  const permissions = usePermissions();
  const [payload, setPayload] = useState<DashboardPayload | null>(null);
  const [me, setMe] = useState<{ id: string; email: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const organizationId = permissions.kind === "ready" ? permissions.value.organizationId : null;

  useEffect(() => {
    if (!organizationId) return;
    let cancelled = false;
    apiFetch<DashboardPayload>(`/api/v1/organizations/${organizationId}/dashboard`).then((r) => {
      if (cancelled) return;
      if (r.success) setPayload(r.data);
      else setError(r.error.message);
    });
    // Who "your" is in Your next steps (F1.1): the signed-in user's id, from the existing read.
    apiFetch<{ user: { id: string; email: string } | null }>("/api/v1/auth/me").then((r) => {
      if (!cancelled && r.success && r.data.user) setMe(r.data.user);
    });
    return () => {
      cancelled = true;
    };
  }, [organizationId]);

  if (error) {
    return (
      <Notice tone="error" testId="overview-error">
        {error}
      </Notice>
    );
  }
  if (!payload) return <p className="text-sm text-slate-500">Loading the overview…</p>;

  const { readiness, actions, ropa, breaches, rights, retention } = payload;
  const headline = readiness?.finalised ?? readiness?.inProgress ?? null;

  return (
    <div data-testid="executive-overview" className="space-y-8">
      {/* Slice 10.5 B1 (F1.1): what this person does next comes first. */}
      {me && permissions.kind === "ready" && (
        <NextSteps payload={payload} user={me} roleCode={permissions.value.role} roleName={permissions.value.roleName} />
      )}
      {/* Slice 9: exposure next, linking to the Command Centre; the readiness tiles stay below. */}
      {organizationId && <ExposureStrip organizationId={organizationId} />}
      {readiness && <ReadinessSection finalised={readiness.finalised} inProgress={readiness.inProgress} />}
      {actions && <ActionsSection actions={actions} ropaGaps={ropa?.gaps ?? null} />}
      {headline && (
        <section data-testid="overview-scorecard" className="space-y-1">
          <p className="text-xs text-slate-600">
            The sixteen domains of {headline.assessment.name}
            {headline.score.finalised ? " — frozen with its score" : " — live, provisional"}.
          </p>
          {/* Q3 (D-104.3): an unanswered domain reads "Not started" — a display rule only. */}
          <Scorecard domains={headline.score.domains} notStarted />
        </section>
      )}
      {ropa && <RopaSection ropa={ropa} />}
      {breaches && <BreachSection breaches={breaches} />}
      {rights && <RightsSection rights={rights} />}
      {retention && <RetentionSection retention={retention} />}
      <p className="text-xs text-slate-500">
        A DPDP readiness view: it shows how prepared the organisation is and what is outstanding. It is not a legal
        opinion or a certification.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Readiness — the score, its red flags and its gaps, each on its own tile
// ---------------------------------------------------------------------------

function ReadinessSection({
  finalised,
  inProgress,
}: {
  finalised: DashboardReadiness | null;
  inProgress: DashboardReadiness | null;
}) {
  if (!finalised && !inProgress) {
    return (
      <section data-testid="overview-no-assessment" className="rounded-xl border border-dashed border-slate-300 p-4">
        <h2 className="text-sm font-semibold">DPDP Compass Readiness Score</h2>
        <p className="mt-1 text-sm text-slate-600">
          No assessment yet. The score appears here once an assessment has been generated and answered.
        </p>
      </section>
    );
  }
  return (
    <section data-testid="overview-score" className="space-y-3">
      <h2 className="text-lg font-semibold">DPDP Compass Readiness Score</h2>
      {/* Two assessments, two rows — a frozen number and a live one are never blended (D-068). */}
      {finalised && <ReadinessRow kind="finalised" view={finalised} primary />}
      {inProgress && <ReadinessRow kind="provisional" view={inProgress} primary={!finalised} />}
    </section>
  );
}

function ReadinessRow({
  kind,
  view,
  primary,
}: {
  kind: "finalised" | "provisional";
  view: DashboardReadiness;
  primary: boolean;
}) {
  const { score, assessment, gaps } = view;
  const { overall } = score;
  const progress = answeredProgress(score.domains);
  return (
    <div data-testid={`overview-row-${kind}`} className="grid gap-3 md:grid-cols-3">
      <div
        data-testid={`overview-score-${kind}`}
        className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-4 md:col-span-1"
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
          {kind === "finalised" ? "Finalised" : "In progress"}
        </p>
        {/* F1.4: progress first, then the score — "4.20" alone reads as a verdict on a barely started assessment. */}
        <p data-testid={`overview-progress-${kind}`} className="mt-1 text-sm font-medium text-slate-800">
          {progress.answered.toLocaleString("en-IN")} of {progress.total.toLocaleString("en-IN")} questions answered
        </p>
        <p className="mt-1 text-4xl font-semibold">
          <span data-testid={primary ? "overview-score-value" : `overview-score-value-${kind}`}>
            {formatScore(overall.finalScore)}
          </span>
          <span className="text-base font-normal text-slate-500"> / {formatScore(overall.applicableWeight)}</span>
        </p>
        <p className="mt-0.5 text-sm font-medium text-slate-800">{overall.maturityLevel}</p>
        <p className="mt-1 text-xs text-slate-600">
          Assessed Weight Coverage: {formatScore(overall.applicableWeight)} / 100 — the weight of the domains that apply
        </p>
        <p className="mt-1 text-sm">
          Evidence confidence{" "}
          <strong data-testid={`overview-confidence-${kind}`}>
            {overall.evidenceConfidence === null ? "—" : `${Math.round(overall.evidenceConfidence)}%`}
          </strong>
        </p>
        <p data-testid={`overview-source-${kind}`} className="mt-2 text-xs text-slate-600">
          From{" "}
          <Link href={`/dashboard/assessments/${assessment.id}`} className="text-indigo-700 hover:underline">
            {assessment.name}
          </Link>
          {score.finalised && score.snapshot
            ? ` · frozen ${formatDay(score.snapshot.calculatedAt)} — this number cannot change`
            : " · live and provisional"}
        </p>
      </div>

      {/* A red flag CAPS the score (adjusted ≤ 2, D-046). A gap is work to do (≤ 3, D-054). Different tiles. */}
      <div data-testid={`overview-red-flags-${kind}`} className="rounded-xl border border-slate-200 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Red flags</p>
        {overall.redFlags.length === 0 ? (
          <p className="mt-2 text-sm text-slate-700">None — nothing caps this score.</p>
        ) : (
          <>
            <p className="mt-1 text-2xl font-semibold">{overall.redFlags.length}</p>
            <p className="text-xs text-slate-600">
              The score is capped at {formatScore(overall.scoreCap)} of 100{overall.redFlags.length > 1 && " — the lowest cap applies"}.
            </p>
            <ul className="mt-2 list-disc space-y-0.5 pl-4 text-xs text-slate-800">
              {overall.redFlags.map((flag) => (
                <li key={flag.code}>
                  {flag.label} — caps at {formatScore(flag.cap)}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      <div data-testid={`overview-gaps-${kind}`} className="rounded-xl border border-slate-200 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Open gaps</p>
        {gaps === null ? (
          <p className="mt-2 text-sm text-slate-600">Not available to your role.</p>
        ) : !gaps.generated ? (
          <p className="mt-2 text-sm text-slate-700">The gap register has not been generated yet.</p>
        ) : (
          <>
            <p className="mt-1 text-2xl font-semibold" data-testid={`overview-gap-count-${kind}`}>
              {gaps.counts.gapCount}
            </p>
            <SeverityChips counts={gaps.counts} testid={`overview-gap-severity-${kind}`} />
            <p className="mt-2 text-xs text-slate-600">
              {gaps.frozen ? "Frozen with the finalised score; its actions live on." : gaps.stale ? "Out of date — the answers have changed since it was generated." : "Current."}{" "}
              <Link href={`/dashboard/assessments/${assessment.id}/gaps`} className="text-indigo-700 hover:underline">
                Open the register
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function SeverityChips({
  counts,
  testid,
}: {
  counts: { critical: number; high: number; medium: number; low: number };
  testid: string;
}) {
  return (
    <p data-testid={testid} className="mt-1 flex flex-wrap gap-1 text-xs">
      {GAP_OPENING_SEVERITIES.map((s) => (
        <span key={s} className={`rounded-full px-2 py-0.5 ${SEVERITY_STYLE[s] ?? ""}`}>
          {counts[s]} {GAP_SEVERITY_LABEL[s]}
        </span>
      ))}
    </p>
  );
}

// ---------------------------------------------------------------------------
// What is being done — actions from all five sources
// ---------------------------------------------------------------------------

function ActionsSection({
  actions,
  ropaGaps,
}: {
  actions: NonNullable<DashboardPayload["actions"]>;
  ropaGaps: { counts: { gapCount: number }; stale: boolean; generated: boolean } | null;
}) {
  const { summary } = actions;
  return (
    <section data-testid="overview-actions" className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold">What is being done</h2>
        <Link href="/dashboard/actions" data-testid="overview-actions-link" className="text-sm text-indigo-700 hover:underline">
          Every action, by owner and due date →
        </Link>
      </div>
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Open actions" value={summary.outstanding} testid="overview-actions-open" />
        <Stat label="Overdue" value={summary.overdue} testid="overview-actions-overdue" alert={summary.overdue > 0} />
        <Stat label="With no owner" value={summary.unassigned} testid="overview-actions-unassigned" />
        <Stat label="Closed" value={summary.closed} testid="overview-actions-closed" />
      </dl>
      <p className="text-xs text-slate-600">
        From the assessment: {summary.bySource.assessment.outstanding} open, {summary.bySource.assessment.overdue} overdue
        {actions.sources.includes("ropa") && (
          <>
            {" "}· from the processing register: {summary.bySource.ropa.outstanding} open, {summary.bySource.ropa.overdue} overdue
            {ropaGaps && !ropaGaps.generated && " (its gaps have not been generated yet)"}
            {ropaGaps?.generated && ropaGaps.stale && " (its gaps are out of date)"}
          </>
        )}
        {actions.sources.includes("breach") && (
          <>
            {" "}· from the breach register: {summary.bySource.breach.outstanding} open, {summary.bySource.breach.overdue} overdue
          </>
        )}
        {actions.sources.includes("rights") && (
          <>
            {" "}· from the rights register: {summary.bySource.rights.outstanding} open, {summary.bySource.rights.overdue} overdue
          </>
        )}
        {actions.sources.includes("retention") && (
          <>
            {" "}· from the retention register: {summary.bySource.retention.outstanding} open, {summary.bySource.retention.overdue} overdue
          </>
        )}
        .
      </p>
    </section>
  );
}

function Stat({ label, value, testid, alert = false }: { label: string; value: number; testid: string; alert?: boolean }) {
  return (
    <div className={`rounded-xl border p-3 ${alert ? "border-red-300 bg-red-50" : "border-slate-200"}`}>
      <dt className="text-xs text-slate-600">{label}</dt>
      <dd data-testid={testid} className={`text-2xl font-semibold ${alert ? "text-red-900" : ""}`}>
        {value.toLocaleString("en-IN")}
      </dd>
    </div>
  );
}

// ---------------------------------------------------------------------------
// The processing register — its own model, its own tile (D-061)
// ---------------------------------------------------------------------------

/**
 * Slice 10: the breach register's headline — its own section, never on the
 * readiness tile (D-069). The counts are core's, over the register's rows;
 * the running clocks are listed so the one that needs someone now is seen.
 */
function BreachSection({ breaches }: { breaches: NonNullable<DashboardPayload["breaches"]> }) {
  const { counts, clocks } = breaches;
  return (
    <section data-testid="overview-breaches" className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold">Personal data breaches</h2>
        <Link href="/dashboard/breaches" className="text-sm text-indigo-700 hover:underline">
          Open the breach register →
        </Link>
      </div>
      {counts.total === 0 ? (
        <p data-testid="overview-breaches-empty" className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-600">
          No breach is recorded.
        </p>
      ) : (
        <>
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Open or contained" value={counts.active} testid="breach-metric-active" />
            <Stat label="Board report due — inside the window" value={counts.insideWindow} testid="breach-metric-inside-window" alert={counts.insideWindow > 0} />
            <Stat label="Board report overdue" value={counts.overdue} testid="breach-metric-overdue" alert={counts.overdue > 0} />
            <Stat label="People not yet told" value={counts.principalsPending} testid="breach-metric-principals" alert={counts.principalsPending > 0} />
          </dl>
          {clocks.length > 0 && (
            <ul data-testid="overview-breach-clocks" className="space-y-1 text-sm">
              {clocks.map((c) => (
                <li key={c.id}>
                  <Link href={`/dashboard/breaches/${c.id}`} className="text-indigo-700 hover:underline">
                    {c.incidentCode}
                  </Link>{" "}
                  — {c.title}: <span className={c.clock.state === "overdue" ? "font-semibold text-red-800" : "font-medium"}>{c.clock.label}</span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
      <p className="text-xs text-slate-500">{breaches.clockNote}</p>
    </section>
  );
}

/**
 * Slice 10 Stage 2: the rights and grievance register's headline — its own
 * section, never on the readiness tile (D-069). The counts are core's, over
 * the register's rows; the requests past TrustStack's target or the Rules'
 * ninety days are listed, oldest first.
 */
function RightsSection({ rights }: { rights: NonNullable<DashboardPayload["rights"]> }) {
  const { counts, attention } = rights;
  return (
    <section data-testid="overview-rights" className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold">Rights requests and grievances</h2>
        <Link href="/dashboard/rights" className="text-sm text-indigo-700 hover:underline">
          Open the rights register →
        </Link>
      </div>
      {counts.total === 0 ? (
        <p data-testid="overview-rights-empty" className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-600">
          No request or grievance is recorded.
        </p>
      ) : (
        <>
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Open requests" value={counts.openRequests} testid="rights-metric-open-requests" />
            <Stat label="Open grievances" value={counts.openGrievances} testid="rights-metric-open-grievances" />
            <Stat label="Past TrustStack's 30-day target" value={counts.pastTarget} testid="rights-metric-past-target" alert={counts.pastTarget > 0} />
            <Stat label="Grievances open past the 90 days" value={counts.overdueGrievances} testid="rights-metric-overdue-grievances" alert={counts.overdueGrievances > 0} />
          </dl>
          {counts.overdue > counts.overdueGrievances && (
            <p data-testid="rights-metric-overdue-requests" className="text-sm font-medium text-red-800">
              {counts.overdue - counts.overdueGrievances} request{counts.overdue - counts.overdueGrievances === 1 ? "" : "s"} to exercise a right open past the 90 days.
            </p>
          )}
          {attention.length > 0 && (
            <ul data-testid="overview-rights-attention" className="space-y-1 text-sm">
              {attention.map((a) => (
                <li key={a.id}>
                  <Link href={`/dashboard/rights/${a.id}`} className="text-indigo-700 hover:underline">
                    {a.requestCode}
                  </Link>{" "}
                  — {a.kindLabel}: <span className={a.clock.state === "overdue" ? "font-semibold text-red-800" : "font-medium"}>{a.clock.label}</span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
      <p className="text-xs text-slate-500">{rights.clockNote}</p>
    </section>
  );
}

/**
 * Slice 10 Stage 5 (D-096, R6): the retention register's headline — its own
 * section, never on the readiness tile (D-069). Rule 8's duties commence on
 * 13 May 2027 (Rule 1); the counts are core's, over the register's rows.
 */
function RetentionSection({ retention }: { retention: NonNullable<DashboardPayload["retention"]> }) {
  const { counts, overdue } = retention;
  return (
    <section data-testid="overview-retention" className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold">Retention and erasure</h2>
        <Link href="/dashboard/retention" className="text-sm text-indigo-700 hover:underline">
          Open the retention register →
        </Link>
      </div>
      {counts.total === 0 ? (
        <p data-testid="overview-retention-empty" className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-600">
          No retention schedule is recorded.
        </p>
      ) : (
        <>
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Stat label="Erasures overdue" value={counts.overdue} testid="retention-metric-overdue" alert={counts.overdue > 0} />
            <Stat label="Ending in 30 days" value={counts.endingSoon} testid="retention-metric-ending-soon" />
            <Stat label="No end recorded" value={counts.noEnd} testid="retention-metric-no-end" />
          </dl>
          {overdue.length > 0 && (
            <ul data-testid="overview-retention-overdue" className="space-y-1 text-sm">
              {overdue.map((s) => (
                <li key={s.id}>
                  <Link href={`/dashboard/retention/${s.id}`} className="text-indigo-700 hover:underline">
                    {s.recordCode ?? "A retention schedule"}
                  </Link>{" "}
                  — <span className="font-semibold text-red-800">erasure overdue</span>
                  {s.endsOn && <> since {formatDay(s.endsOn)}</>}
                  {s.erasureIncomplete && <span className="text-red-800"> (erasure incomplete — processors not told)</span>}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
      <p className="text-xs text-slate-500">{retention.note}</p>
    </section>
  );
}

function RopaSection({ ropa }: { ropa: NonNullable<DashboardPayload["ropa"]> }) {
  const { counts } = ropa;
  return (
    <section data-testid="overview-ropa" className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold">How complete the processing register is</h2>
        <Link href="/dashboard/ropa" className="text-sm text-indigo-700 hover:underline">
          Open the register →
        </Link>
      </div>
      <p className="text-xs text-slate-600">
        Completeness describes the register of processing activities. It is a separate measure from the readiness score
        and never moves it. {ropa.positioning}
      </p>
      {counts.total === 0 ? (
        <p data-testid="overview-ropa-empty" className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-600">
          No processing activities recorded yet.
        </p>
      ) : (
        <>
          <p data-testid="overview-ropa-bands" className="flex flex-wrap gap-1 text-xs">
            {ROPA_BANDS.map((b) => (
              <span key={b.band} className={`rounded-full px-2 py-0.5 ${BAND_STYLE[b.band]}`}>
                {counts.byBand[b.band]} {b.label}
              </span>
            ))}
          </p>
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            <Stat label="Records" value={counts.total} testid="ropa-metric-total" />
            <Stat label="Approved" value={counts.approved} testid="ropa-metric-approved" />
            <Stat label="Draft or in review" value={counts.notApproved} testid="ropa-metric-not-approved" />
            <Stat label="High or critical risk" value={counts.highRisk} testid="ropa-metric-high-risk" />
            <Stat label="Children's data (yes or not known)" value={counts.children} testid="ropa-metric-children" />
            <Stat label="Linked to a Data Processor" value={counts.vendorLinked} testid="ropa-metric-vendor" />
            <Stat label="AI or automated (yes or not known)" value={counts.ai} testid="ropa-metric-ai" />
            <Stat label="Data location not known" value={counts.unknownLocation} testid="ropa-metric-location" />
            <Stat label="Retention incomplete" value={counts.missingRetention} testid="ropa-metric-retention" />
            <Stat label="Review overdue" value={counts.reviewOverdue} testid="ropa-metric-review" alert={counts.reviewOverdue > 0} />
          </dl>
        </>
      )}
      {ropa.gaps && (
        <p data-testid="overview-ropa-gaps" className="text-xs text-slate-600">
          {ropa.gaps.generated ? (
            <>
              {ropa.gaps.counts.gapCount} open register gap{ropa.gaps.counts.gapCount === 1 ? "" : "s"}
              {ropa.gaps.stale && " — out of date, the register has changed since they were generated"}.{" "}
            </>
          ) : (
            "The register's gaps have not been generated yet. "
          )}
          <Link href="/dashboard/ropa/gaps" className="text-indigo-700 hover:underline">
            Register gaps and actions
          </Link>
        </p>
      )}
    </section>
  );
}
