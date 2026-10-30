"use client";

import { useEffect, useState } from "react";
import { ExplainButton } from "@/components/ai/assistant-panel";
import { Notice } from "@/components/feedback/notice";
import { apiFetch } from "@/lib/client/api";
import { formatScore, type DomainScore } from "@/lib/client/assessments";
import { domainNextSteps } from "./ai-next-steps";

/**
 * One domain's evidence-capped score out of its weight, plus evidence
 * confidence. Recomputed by the API from the stored adjusted scores every time
 * `refreshKey` changes — nothing here does arithmetic on the cap.
 */
export function DomainScoreTile({
  organizationId,
  assessmentId,
  domain,
  refreshKey = 0,
}: {
  organizationId: string;
  assessmentId: string;
  domain: string;
  refreshKey?: number;
}) {
  const [score, setScore] = useState<DomainScore | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiFetch<{ domain: DomainScore }>(
      `/api/v1/organizations/${organizationId}/assessments/${assessmentId}/score?domain=${domain}`,
    ).then((r) => {
      if (cancelled) return;
      if (r.success) {
        setScore(r.data.domain);
        setError(null);
      } else setError(r.error.message);
    });
    return () => {
      cancelled = true;
    };
  }, [organizationId, assessmentId, domain, refreshKey]);

  if (error) {
    return (
      <Notice tone="error" testId={`score-tile-${domain}-error`}>
        {error}
      </Notice>
    );
  }
  if (!score) return <p className="text-sm text-slate-500">Loading the score…</p>;

  const answered = score.applicableCount + score.notApplicableCount;
  return (
    <section
      data-testid={`score-tile-${domain}`}
      className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-4"
      aria-label={`${score.name} score`}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
        {score.domainId} · {score.name}
      </p>
      {score.scopedOut ? (
        <p className="mt-2 text-sm text-slate-700">Scoped out — no questions in this domain apply to this organisation.</p>
      ) : (
        <>
          <p className="mt-2 text-3xl font-semibold">
            <span data-testid={`score-tile-${domain}-value`}>{score.score === null ? "—" : formatScore(score.score)}</span>
            <span className="text-base font-normal text-slate-500"> / {score.weight}</span>
          </p>
          <p className="mt-1 text-sm text-slate-700">
            Evidence confidence{" "}
            <strong data-testid={`score-tile-${domain}-confidence`}>
              {score.evidenceConfidence === null ? "—" : `${Math.round(score.evidenceConfidence)}%`}
            </strong>
          </p>
          <p className="mt-1 text-xs text-slate-600">
            {score.score === null
              ? "Not scored yet — no applicable answer in this domain."
              : `${answered} of ${score.questionCount} answered${
                  score.notApplicableCount ? ` (${score.notApplicableCount} Not Applicable)` : ""
                }.`}
            {score.provisional && score.score !== null && " Provisional until every question is answered."}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Each answer counts only as far as its reviewed evidence supports it.
          </p>
          <ExplainButton
            organizationId={organizationId}
            task="score_helper"
            body={{ assessmentId, domainCode: domain }}
            subject={score.name}
            label="Why is this domain's score what it is?"
            testId={`ai-explain-tile-${domain}`}
            className="mt-2"
            nextSteps={domainNextSteps(assessmentId, domain)}
          />
        </>
      )}
    </section>
  );
}
