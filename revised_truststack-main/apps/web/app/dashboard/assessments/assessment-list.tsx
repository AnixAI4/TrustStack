"use client";

import { answeredProgress, assessmentStatusLabel } from "@truststack/core";
import Link from "next/link";
import { useEffect, useState } from "react";
import { DataTable } from "@/components/data/data-table";
import { Notice } from "@/components/feedback/notice";
import { apiFetch } from "@/lib/client/api";
import { formatDay } from "@/lib/client/dashboard";
import { usePermissions } from "@/lib/client/permissions";
import type { AssessmentScorePayload, AssessmentSummary } from "@/lib/client/assessments";

const TYPE_LABEL: Record<string, string> = { baseline: "Baseline", reassessment: "Re-assessment" };

/**
 * Every assessment the organisation has run (Slice 10.5 B2: F2.6, N5) — one a
 * cycle, so the list grows with each re-assessment (Slice 12) and is paged.
 *
 * "Answered x of y" is each assessment's own score reader (`/score`, the
 * numbers the overview shows), counted by core `answeredProgress` — the list
 * adds no arithmetic of its own (D-069). One read a row; a server-side count
 * is the step when the list grows long.
 */
export function AssessmentList() {
  const permissions = usePermissions();
  const [assessments, setAssessments] = useState<AssessmentSummary[] | null>(null);
  const [progress, setProgress] = useState<Map<string, { answered: number; total: number }>>(new Map());
  const [error, setError] = useState<string | null>(null);

  const organizationId = permissions.kind === "ready" ? permissions.value.organizationId : null;
  const canReadScore = permissions.kind === "ready" && permissions.value.permissions.includes("score.read");

  useEffect(() => {
    if (!organizationId) return;
    apiFetch<{ assessments: AssessmentSummary[] }>(`/api/v1/organizations/${organizationId}/assessments`).then((r) => {
      if (r.success) setAssessments(r.data.assessments);
      else setError(r.error.message);
    });
  }, [organizationId]);

  useEffect(() => {
    if (!organizationId || !canReadScore || !assessments) return;
    let cancelled = false;
    for (const a of assessments) {
      if (!a.generatedAt) continue;
      apiFetch<AssessmentScorePayload>(`/api/v1/organizations/${organizationId}/assessments/${a.id}/score`).then((r) => {
        if (cancelled || !r.success) return;
        setProgress((m) => new Map(m).set(a.id, answeredProgress(r.data.domains)));
      });
    }
    return () => {
      cancelled = true;
    };
  }, [organizationId, canReadScore, assessments]);

  if (permissions.kind === "loading") return <p className="text-sm text-slate-500">Loading…</p>;
  if (error) {
    return (
      <Notice tone="error" testId="assessments-error">
        {error}
      </Notice>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        Each assessment is a snapshot of the questions at the moment it was generated — editing the question bank later
        never changes one that already exists. Open one to answer it, attach evidence and see its score.
      </p>

      {assessments === null ? (
        <p className="text-sm text-slate-500">Loading assessments…</p>
      ) : (
        <DataTable
          testId="assessment-list"
          caption="Assessments"
          noun="assessments"
          rows={assessments}
          rowKey={(a) => a.id}
          rowTestId={(a) => `assessment-row-${a.id}`}
          search={{ label: "Search assessments", placeholder: "Search by name", text: (a) => `${a.name} ${assessmentStatusLabel(a.status)}` }}
          empty={
            <div data-testid="assessments-empty" className="rounded-lg border border-dashed border-slate-300 p-6 text-sm text-slate-600">
              <p className="font-medium">No assessments yet.</p>
              <p className="mt-1">
                Complete the{" "}
                <Link href="/dashboard/scope" className="text-indigo-700 hover:underline">
                  scope wizard
                </Link>{" "}
                and generate one from its last step.
              </p>
            </div>
          }
          columns={[
            {
              key: "name",
              header: "Assessment",
              sortValue: (a) => a.name,
              cell: (a) => (
                <>
                  <Link href={`/dashboard/assessments/${a.id}`} data-testid={`assessment-${a.id}`} className="font-semibold text-indigo-700 hover:underline">
                    {a.name}
                  </Link>
                  <span className="block text-xs text-slate-500">{TYPE_LABEL[a.assessmentType] ?? a.assessmentType}</span>
                </>
              ),
            },
            {
              key: "status",
              header: "Status",
              sortValue: (a) => assessmentStatusLabel(a.status),
              cell: (a) => (
                <span data-testid={`assessment-status-${a.id}`} className="whitespace-nowrap rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
                  {assessmentStatusLabel(a.status)}
                </span>
              ),
            },
            {
              key: "progress",
              header: "Progress",
              sortValue: (a) => {
                const p = progress.get(a.id);
                return p && p.total > 0 ? p.answered / p.total : null;
              },
              cell: (a) => {
                const p = progress.get(a.id);
                return (
                  <span data-testid={`assessment-progress-${a.id}`} className="whitespace-nowrap text-xs text-slate-700">
                    {!a.generatedAt ? "No questions yet" : p ? `answered ${p.answered} of ${p.total}` : `${a.questionCount ?? 0} questions`}
                  </span>
                );
              },
            },
            {
              key: "generated",
              header: "Generated",
              sortValue: (a) => a.generatedAt,
              cell: (a) => (
                <span data-testid={`assessment-generated-${a.id}`} className="whitespace-nowrap text-xs text-slate-700">
                  {a.generatedAt ? formatDay(a.generatedAt) : "Not generated"}
                </span>
              ),
            },
            {
              key: "open",
              header: <span className="sr-only">Open</span>,
              className: "text-right",
              cell: (a) => (
                <Link
                  href={`/dashboard/assessments/${a.id}`}
                  data-testid={`open-assessment-${a.id}`}
                  aria-label={`Open ${a.name}`}
                  className="inline-block rounded-md border border-indigo-700 px-3 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-50"
                >
                  Open
                </Link>
              ),
            },
          ]}
        />
      )}
    </div>
  );
}
