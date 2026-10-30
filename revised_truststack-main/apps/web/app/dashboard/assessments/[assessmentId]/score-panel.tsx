"use client";

import Link from "next/link";
import { domainStatusLabel } from "@truststack/core";
import { useCallback, useEffect, useState } from "react";
import { ExplainButton } from "@/components/ai/assistant-panel";
import { Notice } from "@/components/feedback/notice";
import { apiFetch } from "@/lib/client/api";
import { Can } from "@/lib/client/permissions";
import {
  DOMAIN_STATE_LABEL,
  DOMAIN_STATUS_LABEL,
  formatScore,
  type AssessmentScorePayload,
  type DomainScore,
} from "@/lib/client/assessments";
import type { GapRegisterPayload } from "@/lib/client/gaps";
import { domainNextSteps } from "./ai-next-steps";

/**
 * The whole assessment's score: the overall panel, the sixteen-row scorecard,
 * and Finalise.
 *
 * Every number here comes back from the API, which read it from the database.
 * The browser does no arithmetic on a score — not the cap, not the average,
 * not the band.
 */
export function ScorePanel({
  organizationId,
  assessmentId,
  refreshKey = 0,
  onFinalised,
}: {
  organizationId: string;
  assessmentId: string;
  refreshKey?: number;
  onFinalised?: () => void;
}) {
  const [payload, setPayload] = useState<AssessmentScorePayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    return apiFetch<AssessmentScorePayload>(
      `/api/v1/organizations/${organizationId}/assessments/${assessmentId}/score`,
    ).then((r) => {
      if (r.success) {
        setPayload(r.data);
        setError(null);
      } else setError(r.error.message);
    });
  }, [organizationId, assessmentId]);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  if (error) {
    return (
      <Notice tone="error" testId="score-panel-error">
        {error}
      </Notice>
    );
  }
  if (!payload) return <p className="text-sm text-slate-500">Loading the score…</p>;

  const { overall, domains, finalised } = payload;

  return (
    <div className="space-y-4">
      <section
        data-testid="overall-score"
        className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-4"
        aria-label="DPDP Compass Readiness Score"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
            DPDP Compass Readiness Score
          </p>
          {finalised ? (
            <span data-testid="score-finalised" className="rounded-full bg-indigo-700 px-2 py-0.5 text-xs font-medium text-white">
              Finalised{payload.snapshot ? ` ${new Date(payload.snapshot.calculatedAt).toLocaleDateString("en-IN")}` : ""}
            </span>
          ) : (
            overall.provisional && (
              <span data-testid="score-provisional" className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900">
                Provisional
              </span>
            )
          )}
        </div>

        <p className="mt-2 text-4xl font-semibold">
          <span data-testid="overall-score-value">{formatScore(overall.finalScore)}</span>
          <span className="text-base font-normal text-slate-500">
            {" "}
            / <span data-testid="applicable-weight">{formatScore(overall.applicableWeight)}</span> applicable weighted points
          </span>
        </p>
        <p data-testid="overall-band" className="mt-1 text-sm font-medium text-slate-800">
          {overall.maturityLevel}
        </p>

        {/* D-038's wording. The coverage line is what keeps the denominator honest. */}
        <p data-testid="coverage-line" className="mt-2 text-xs text-slate-600">
          Assessed Weight Coverage: {formatScore(overall.applicableWeight)} / 100
        </p>

        <dl className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-xs text-slate-600">Evidence confidence</dt>
            <dd data-testid="overall-confidence" className="font-semibold">
              {overall.evidenceConfidence === null ? "—" : `${Math.round(overall.evidenceConfidence)}%`}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-slate-600">Critical gaps</dt>
            <dd data-testid="overall-critical" className="font-semibold">{overall.criticalCount}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-600">High gaps</dt>
            <dd data-testid="overall-high" className="font-semibold">{overall.highCount}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-600">Unanswered</dt>
            <dd data-testid="overall-outstanding" className="font-semibold">{overall.outstandingCount}</dd>
          </div>
        </dl>

        {overall.redFlags.length > 0 && (
          <div data-testid="red-flags" className="mt-3 rounded-lg border border-amber-300 bg-amber-50 p-3">
            <p className="text-xs font-semibold text-amber-900">
              The score is capped at {formatScore(overall.scoreCap)} of 100
              {overall.redFlags.length > 1 && " — the lowest cap applies"}
            </p>
            <ul className="mt-1 list-disc space-y-0.5 pl-4 text-xs text-amber-900">
              {overall.redFlags.map((flag) => (
                <li key={flag.code} data-testid={`red-flag-${flag.code}`}>
                  {flag.label} — caps the score at {formatScore(flag.cap)}
                </li>
              ))}
            </ul>
            <p className="mt-1 text-xs text-amber-800">
              Raw score before the cap: {formatScore(overall.rawScore)}.
            </p>
          </div>
        )}

        {/* Gaps are WORK TO DO; the red flags above are a CAP on the score.
            Related, never merged: one opens at 3 or below, the other fires at
            2 or below in the areas that matter most. */}
        <Can permission="gap.read">
          <GapRegisterLink organizationId={organizationId} assessmentId={assessmentId} refreshKey={refreshKey} />
        </Can>

        {overall.provisional && !finalised && (
          <p className="mt-2 text-xs text-slate-600">
            Provisional — {overall.outstandingCount} question{overall.outstandingCount === 1 ? "" : "s"} still
            unanswered. Unanswered questions are neither scored nor excluded.
          </p>
        )}
        {finalised && (
          <p className="mt-2 text-xs text-slate-600">
            This score is frozen. It records what was assessed and when, and cannot change.
          </p>
        )}
      </section>

      {/* Q3 (D-104.3): an untouched domain reads "Not started" — a display rule; the stored status is unchanged. */}
      <Scorecard domains={domains} notStarted explain={{ organizationId, assessmentId }} />

      {!finalised && (
        <Can permission="assessment.finalise">
          <FinaliseButton
            organizationId={organizationId}
            assessmentId={assessmentId}
            outstandingCount={overall.outstandingCount}
            status={payload.status}
            onFinalised={async () => {
              await load();
              onFinalised?.();
            }}
          />
        </Can>
      )}
    </div>
  );
}

/** "N gaps, M critical" — the way into the register and the roadmap (Slice 6). */
function GapRegisterLink({
  organizationId,
  assessmentId,
  refreshKey,
}: {
  organizationId: string;
  assessmentId: string;
  refreshKey: number;
}) {
  const [register, setRegister] = useState<GapRegisterPayload | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiFetch<GapRegisterPayload>(`/api/v1/organizations/${organizationId}/assessments/${assessmentId}/gaps`).then((r) => {
      if (!cancelled && r.success) setRegister(r.data);
    });
    return () => {
      cancelled = true;
    };
  }, [organizationId, assessmentId, refreshKey]);

  if (!register) return null;
  const { counts, gaps, stale, frozen } = register;
  const generated = gaps.length > 0 || !stale;

  return (
    <p data-testid="gap-register-link" className="mt-3 text-sm">
      <Link
        href={`/dashboard/assessments/${assessmentId}/gaps`}
        className="font-medium text-indigo-700 hover:underline"
      >
        {generated ? (
          <>
            <span data-testid="gap-link-count">{counts.gapCount}</span> gap{counts.gapCount === 1 ? "" : "s"},{" "}
            <span data-testid="gap-link-critical">{counts.critical}</span> critical — open the gap register and roadmap
          </>
        ) : (
          "Open the gap register and roadmap"
        )}
      </Link>
      {!frozen && stale && (
        <span className="ml-2 text-xs text-amber-800">
          {generated ? "out of date — regenerate it" : "not generated yet"}
        </span>
      )}
    </p>
  );
}

/** The sixteen rows, including the empty ones — that is the point of the coverage line. */
/**
 * `notStarted` (Slice 10.5, Q3 — D-104.3): a domain with no answered question
 * reads "Not started" instead of its stored "Needs Work". Display only. On the
 * overview from B1; the assessment page turns it on in B2.
 */
export function Scorecard({
  domains,
  notStarted = false,
  explain,
}: {
  domains: DomainScore[];
  notStarted?: boolean;
  /** Slice 11 Stage 1b: "Why this score?" on each scored row (the Score Helper) — the assessment page only. */
  explain?: { organizationId: string; assessmentId: string };
}) {
  return (
    <section>
      <h3 className="font-medium">Scorecard</h3>
      <div className="mt-2 overflow-x-auto">
        <table data-testid="scorecard" className="w-full min-w-[40rem] text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-slate-600">
            <tr className="border-b border-slate-200">
              <th scope="col" className="py-1 pr-2 font-medium">Domain</th>
              <th scope="col" className="py-1 pr-2 text-right font-medium">Weight</th>
              <th scope="col" className="py-1 pr-2 text-right font-medium">Score</th>
              <th scope="col" className="py-1 pr-2 font-medium">Maturity</th>
              <th scope="col" className="py-1 pr-2 text-right font-medium">Confidence</th>
              <th scope="col" className="py-1 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {domains.map((d) => (
              <tr key={d.code} data-testid={`scorecard-row-${d.code}`}>
                <td className="py-1.5 pr-2">
                  {d.name}
                  {explain && d.state === "scored" && (
                    <ExplainButton
                      organizationId={explain.organizationId}
                      task="score_helper"
                      body={{ assessmentId: explain.assessmentId, domainCode: d.code }}
                      subject={d.name}
                      label="Why this score?"
                      testId={`ai-explain-score-${d.code}`}
                      className="ml-2"
                      nextSteps={domainNextSteps(explain.assessmentId, d.code)}
                    />
                  )}
                </td>
                <td className="py-1.5 pr-2 text-right tabular-nums">{formatScore(d.weight)}</td>
                <td data-testid={`scorecard-score-${d.code}`} className="py-1.5 pr-2 text-right tabular-nums">
                  {d.score === null ? "—" : formatScore(d.score)}
                </td>
                <td className="py-1.5 pr-2 text-xs">{d.maturityLevel ?? "—"}</td>
                <td className="py-1.5 pr-2 text-right tabular-nums">
                  {d.evidenceConfidence === null ? "—" : `${Math.round(d.evidenceConfidence)}%`}
                </td>
                <td data-testid={`scorecard-state-${d.code}`} className="py-1.5 text-xs">
                  {d.state === "scored" ? (
                    notStarted ? domainStatusLabel(d) : DOMAIN_STATUS_LABEL[d.status]
                  ) : (
                    // Scoped Out and all-Not-Applicable are different facts and
                    // must never be merged (D-038). Neither scores zero; both
                    // leave the weighted denominator.
                    <span className="text-slate-600">
                      {DOMAIN_STATE_LABEL[d.state]}
                      <span className="block text-slate-500">
                        {d.state === "scoped_out"
                          ? "no questions in this domain apply"
                          : "every question was excluded, with a reason"}
                      </span>
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-1 text-xs text-slate-500">
        A domain that does not apply leaves the denominator. It is never scored zero, and the remaining weights are
        never rebalanced to hide it.
      </p>
    </section>
  );
}

function FinaliseButton({
  organizationId,
  assessmentId,
  outstandingCount,
  status,
  onFinalised,
}: {
  organizationId: string;
  assessmentId: string;
  outstandingCount: number;
  status: string;
  onFinalised: () => void | Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Answering only the strong questions and freezing the flattering half is
  // exactly what this refuses (D-041). The database refuses it too.
  const blocked = outstandingCount > 0 || status !== "in_progress";

  async function finalise() {
    setError(null);
    setBusy(true);
    const r = await apiFetch(`/api/v1/organizations/${organizationId}/assessments/${assessmentId}/finalise`, {
      method: "POST",
    });
    setBusy(false);
    if (!r.success) return setError(r.error.message);
    await onFinalised();
  }

  return (
    <section className="rounded-lg border border-slate-200 p-3">
      <button
        type="button"
        data-testid="finalise-assessment"
        onClick={finalise}
        disabled={busy || blocked}
        className="rounded-md bg-indigo-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-800 disabled:opacity-50"
      >
        {busy ? "Finalising…" : "Finalise the score"}
      </button>
      <p data-testid="finalise-hint" className="mt-1 text-xs text-slate-600">
        {outstandingCount > 0
          ? `Answer every question first — ${outstandingCount} still outstanding.`
          : status !== "in_progress"
            ? `An assessment that is ${status} cannot be finalised.`
            : "Finalising freezes this score permanently. Answers and evidence are locked."}
      </p>
      {error && (
        <Notice tone="error" compact testId="finalise-error" className="mt-1">
          {error}
        </Notice>
      )}
    </section>
  );
}
