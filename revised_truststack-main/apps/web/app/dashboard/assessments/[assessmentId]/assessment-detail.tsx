"use client";

import {
  answeredProgress,
  assessmentStatusLabel,
  domainShortName,
  isQuestionForRole,
  ROLE_FILTER_DEFAULT_ROLES,
  roleHasOwnQuestions,
  type RoleCode,
} from "@truststack/core";
import { ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Notice } from "@/components/feedback/notice";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Tabs } from "@/components/ui/tabs";
import { apiFetch } from "@/lib/client/api";
import { usePermissions } from "@/lib/client/permissions";
import {
  APPLICABILITY_LABEL,
  includedReasonLabel,
  type AssessmentQuestion,
  type AssessmentResponse,
  type AssessmentSummary,
  type DomainSummary,
} from "@/lib/client/assessments";
import { ExplainButton } from "@/components/ai/assistant-panel";
import { questionNextSteps } from "./ai-next-steps";
import { AnswerPanel } from "./answer-panel";
import { DomainScoreTile } from "./domain-score-tile";
import { ScorePanel } from "./score-panel";

interface Payload {
  assessment: AssessmentSummary;
  questions: AssessmentQuestion[];
  domains: DomainSummary[];
}

interface Domain {
  code: string;
  name: string;
  weight: number;
  sortOrder: number;
}

export function AssessmentDetail({ assessmentId }: { assessmentId: string }) {
  const permissions = usePermissions();
  const [payload, setPayload] = useState<Payload | null>(null);
  const [domains, setDomains] = useState<Map<string, Domain>>(new Map());
  const [error, setError] = useState<string | null>(null);
  const [responses, setResponses] = useState<Map<string, AssessmentResponse>>(new Map());
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [scoreVersion, setScoreVersion] = useState(0);
  // One domain at a time (Slice 10.5 N2): the chosen domain, kept in the hash
  // by <Tabs>. Null until someone chooses — <Tabs> then shows the first.
  const [domain, setDomain] = useState<string | null>(null);
  // F2.4: "mine" or "all"; null = the role's default (a Department Owner starts on "mine").
  const [scope, setScope] = useState<"mine" | "all" | null>(null);
  const [unansweredOnly, setUnansweredOnly] = useState(false);
  const stepsTop = useRef<HTMLDivElement>(null);

  const organizationId = permissions.kind === "ready" ? permissions.value.organizationId : null;
  const role = permissions.kind === "ready" ? permissions.value.role : "";
  const roleName = permissions.kind === "ready" ? permissions.value.roleName : "";
  const canReadResponses = permissions.kind === "ready" && permissions.value.permissions.includes("response.read");
  const canReadScore = permissions.kind === "ready" && permissions.value.permissions.includes("score.read");

  const loadQuestions = useCallback(() => {
    if (!organizationId) return;
    apiFetch<Payload>(`/api/v1/organizations/${organizationId}/assessments/${assessmentId}/questions`).then((r) => {
      if (r.success) setPayload(r.data);
      else setError(r.error.message);
    });
  }, [organizationId, assessmentId]);

  const loadResponses = useCallback(() => {
    if (!organizationId || !canReadResponses) return;
    apiFetch<{ responses: AssessmentResponse[] }>(
      `/api/v1/organizations/${organizationId}/assessments/${assessmentId}/responses`,
    ).then((r) => {
      if (r.success) setResponses(new Map(r.data.responses.map((x) => [x.questionCode, x])));
    });
  }, [organizationId, assessmentId, canReadResponses]);

  useEffect(() => {
    loadQuestions();
    loadResponses();
    apiFetch<{ domains: Domain[] }>("/api/v1/dpdp-domains").then((r) => {
      if (r.success) setDomains(new Map(r.data.domains.map((d) => [d.code, d])));
    });
    apiFetch<{ user: { id: string } }>("/api/v1/auth/me").then((r) => {
      if (r.success) setCurrentUserId(r.data.user.id);
    });
  }, [loadQuestions, loadResponses]);

  // After any answer, upload or review: re-read the answers, the status (the
  // first answer moves a draft to in_progress) and the tile.
  const refresh = useCallback(() => {
    loadResponses();
    loadQuestions();
    setScoreVersion((v) => v + 1);
  }, [loadResponses, loadQuestions]);

  if (permissions.kind === "loading") return <p className="text-sm text-slate-500">Loading…</p>;
  if (error) {
    return (
      <div className="space-y-3">
        <Notice tone="error" testId="assessment-error">
          {error}
        </Notice>
        <Link href="/dashboard/assessments" className="text-sm text-indigo-700 hover:underline">
          Back to assessments
        </Link>
      </div>
    );
  }
  if (!payload) return <p className="text-sm text-slate-500">Loading the question set…</p>;

  const { assessment, questions, domains: summary } = payload;
  const locked = assessment.status === "submitted" || assessment.status === "finalised";
  const answered = (q: AssessmentQuestion) => responses.has(q.questionCode);
  const nameOf = (code: string) => domains.get(code)?.name ?? code;

  // F2.1 — progress counts a Not Applicable answer as answered (core answeredProgress, D-110.6).
  const byDomain = summary.map((d) => {
    const inDomain = questions.filter((q) => q.domainCode === d.domainCode);
    const done = inDomain.filter(answered).length;
    return { ...d, inDomain, done, questionCount: inDomain.length, outstandingCount: inDomain.length - done };
  });
  const progress = answeredProgress(byDomain);
  // "May not apply" counts the Potentially Applicable questions nobody has confirmed or answered yet.
  const mayNotApply = questions.filter((q) => q.applicability === "potentially_applicable" && !(canReadResponses && answered(q))).length;

  // F2.4 — a guide, not a limit: the API and RLS decide what a role may answer.
  const mine = questions.filter((q) => isQuestionForRole(q.suggestedOwner, role));
  const offerMine = roleHasOwnQuestions(role) && mine.length > 0;
  const effectiveScope = !offerMine ? "all" : (scope ?? (ROLE_FILTER_DEFAULT_ROLES.includes(role as RoleCode) ? "mine" : "all"));
  const inScope = (q: AssessmentQuestion) => effectiveScope === "all" || isQuestionForRole(q.suggestedOwner, role);

  const steps = byDomain.map((d) => {
    const scoped = d.inDomain.filter(inScope);
    const scopedDone = scoped.filter(answered).length;
    return { ...d, scoped, scopedDone, shown: unansweredOnly ? scoped.filter((q) => !answered(q)) : scoped };
  });
  const visibleSteps = steps.filter((s) => s.scoped.length > 0);
  const current = visibleSteps.some((s) => s.domainCode === domain) ? domain! : (visibleSteps[0]?.domainCode ?? "");

  function go(code: string) {
    setDomain(code);
    window.history.replaceState(null, "", `#${code}`);
    stepsTop.current?.scrollIntoView({ block: "start", behavior: "smooth" });
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard/assessments" className="text-xs text-indigo-700 hover:underline">
          ← Assessments
        </Link>
        <h2 className="mt-1 text-lg font-semibold">{assessment.name}</h2>
        <p data-testid="assessment-summary" className="text-sm text-slate-600">
          <span data-testid="assessment-status">{assessmentStatusLabel(assessment.status)}</span> ·{" "}
          {canReadResponses ? (
            <>
              <span data-testid="assessment-answered">{progress.answered}</span> of{" "}
              <strong data-testid="question-count">{progress.total}</strong> answered
            </>
          ) : (
            <>
              <strong data-testid="question-count">{questions.length}</strong> questions
            </>
          )}
          {mayNotApply > 0 && (
            <>
              {" "}
              · <span data-testid="assessment-may-not-apply">{mayNotApply} may not apply — confirm or answer them</span>
            </>
          )}
        </p>
        {canReadResponses && (
          <ProgressBar value={progress.answered} max={progress.total} label="Questions answered" testId="assessment-progress" className="mt-2 max-w-md" />
        )}
        {assessment.packCodes && (
          <p data-testid="assessment-packs" className="mt-1 text-xs text-slate-500">
            Packs: {assessment.packCodes.join(", ") || "—"}
          </p>
        )}
      </div>

      <Tabs
        label="Assessment"
        tabs={[
          {
            id: "questions",
            label: "Questions",
            badge: questions.length,
            content: (
              <>
                <section>
                  <h3 className="font-medium">By domain</h3>
                  <ul data-testid="domain-summary" className="mt-2 grid gap-2 sm:grid-cols-2">
                    {byDomain.map((d) => (
                      <li
                        key={d.domainCode}
                        className={`rounded-lg border px-3 py-2 text-sm ${d.domainCode === current ? "border-brand-navy" : "border-slate-200"}`}
                      >
                        <div className="flex items-baseline justify-between gap-2">
                          <button
                            type="button"
                            data-testid={`domain-toggle-${d.domainCode}`}
                            aria-current={d.domainCode === current ? "true" : undefined}
                            onClick={() => {
                              // A domain outside "my role" opens with every question shown.
                              if (!steps.find((s) => s.domainCode === d.domainCode)?.scoped.length) setScope("all");
                              go(d.domainCode);
                            }}
                            className="text-left text-indigo-700 hover:underline"
                          >
                            {nameOf(d.domainCode)}
                          </button>
                          <span className="shrink-0 font-semibold">weight {d.weight}</span>
                        </div>
                        <p data-testid={`domain-progress-${d.domainCode}`} className="text-xs text-slate-600">
                          {canReadResponses ? `answered ${d.done} of ${d.questionCount}` : `${d.questionCount} questions`}
                          {d.potentiallyApplicableCount > 0 && ` · ${d.potentiallyApplicableCount} may not apply`}
                        </p>
                        {canReadResponses && (
                          <ProgressBar value={d.done} max={d.questionCount} label={`${nameOf(d.domainCode)} answered`} className="mt-1.5" />
                        )}
                      </li>
                    ))}
                  </ul>
                </section>

                <section className="space-y-3" aria-label="Questions">
                  <div ref={stepsTop} className="flex scroll-mt-4 flex-wrap items-center justify-between gap-3">
                    <h3 className="font-medium">Questions, one domain at a time</h3>
                    <div data-testid="question-filters" className="flex flex-wrap items-center gap-3 text-sm">
                      {offerMine && (
                        <div role="group" aria-label="Which questions" className="inline-flex overflow-hidden rounded-md border border-line-strong">
                          {(
                            [
                              ["mine", `Questions for my role (${mine.length})`],
                              ["all", `All questions (${questions.length})`],
                            ] as const
                          ).map(([value, text]) => (
                            <button
                              key={value}
                              type="button"
                              data-testid={`questions-${value}`}
                              aria-pressed={effectiveScope === value}
                              onClick={() => setScope(value)}
                              className={`px-3 py-1.5 ${effectiveScope === value ? "bg-brand-navy text-white" : "bg-surface text-ink-soft hover:bg-surface-muted"}`}
                            >
                              {text}
                            </button>
                          ))}
                        </div>
                      )}
                      {canReadResponses && (
                        <label className="flex items-center gap-1.5 text-ink-soft">
                          <input
                            type="checkbox"
                            data-testid="questions-unanswered-only"
                            checked={unansweredOnly}
                            onChange={(e) => setUnansweredOnly(e.target.checked)}
                          />
                          Unanswered only
                        </label>
                      )}
                    </div>
                  </div>
                  {effectiveScope === "mine" && (
                    <p data-testid="questions-mine-note" className="text-xs text-slate-600">
                      Showing the questions suggested for your role ({roleName}). A guide, not a limit — choose All questions
                      to see every one.
                    </p>
                  )}

                  <Tabs
                    label="Domains"
                    variant="steps"
                    testId="domain-steps"
                    value={current}
                    onValueChange={setDomain}
                    tabs={steps.map((s, i) => {
                      const prev = visibleSteps[visibleSteps.indexOf(s) - 1];
                      const next = visibleSteps[visibleSteps.indexOf(s) + 1];
                      const complete = canReadResponses && s.scopedDone === s.scoped.length;
                      return {
                        id: s.domainCode,
                        label: <span title={nameOf(s.domainCode)}>{`${i + 1}. ${domainShortName(nameOf(s.domainCode))}`}</span>,
                        badge: canReadResponses ? `${s.scopedDone}/${s.scoped.length}` : s.scoped.length,
                        done: complete,
                        hidden: s.scoped.length === 0,
                        content: (
                          <div data-testid={`domain-group-${s.domainCode}`} className="space-y-3 rounded-xl border border-slate-200 p-3">
                            <div className="flex flex-wrap items-baseline justify-between gap-2">
                              <h4 className="font-semibold">{nameOf(s.domainCode)}</h4>
                              <span className="text-xs text-slate-600">
                                weight {s.weight}
                                {canReadResponses ? ` · answered ${s.scopedDone} of ${s.scoped.length}` : ` · ${s.scoped.length} questions`}
                              </span>
                            </div>
                            {s.shown.length === 0 ? (
                              <p data-testid={`domain-all-answered-${s.domainCode}`} className="text-sm text-slate-600">
                                Every question here{effectiveScope === "mine" ? " for your role" : ""} is answered.
                                {next ? " Go on to the next domain." : ""}
                              </p>
                            ) : (
                              <ul className="divide-y divide-slate-100 border-t border-slate-100">
                                {s.shown.map((q) => (
                                  <li key={q.questionCode} data-testid={`aq-${q.questionCode}`} className="py-2 text-sm">
                                    <p>
                                      <span className="font-mono text-xs text-slate-500">{q.questionCode}</span> {q.questionText}
                                    </p>
                                    <p className="mt-1 flex flex-wrap gap-x-3 text-xs text-slate-600">
                                      <span className={q.applicability === "potentially_applicable" ? "font-medium text-amber-800" : undefined}>
                                        {APPLICABILITY_LABEL[q.applicability] ?? q.applicability}
                                      </span>
                                      <span>Priority {q.priority ?? "—"}</span>
                                      <span>Suggested owner {q.suggestedOwner ?? "—"}</span>
                                      {q.packCode && <span className="font-mono">{q.packCode} v{q.questionVersion}</span>}
                                      {organizationId && (
                                        <ExplainButton
                                          organizationId={organizationId}
                                          task="question_helper"
                                          body={{ assessmentId: assessment.id, questionCode: q.questionCode }}
                                          subject={q.questionText}
                                          label="Explain"
                                          testId={`ai-explain-question-${q.questionCode}`}
                                          nextSteps={questionNextSteps(assessment.id, q.questionCode)}
                                        />
                                      )}
                                    </p>
                                    {/* Why a question is in the set is provenance: only Anix staff receive it (D-071). */}
                                    {q.includedReason && <p className="mt-1 text-xs text-slate-500">{includedReasonLabel(q.includedReason)}</p>}
                                    {q.applicability === "potentially_applicable" && (
                                      <p className="mt-1 text-xs text-amber-800">
                                        Answer it, or mark it Not Applicable with a reason — Not Applicable questions are excluded
                                        from the score.
                                      </p>
                                    )}
                                    {organizationId && canReadResponses && (
                                      <AnswerPanel
                                        organizationId={organizationId}
                                        assessmentId={assessment.id}
                                        question={q}
                                        response={responses.get(q.questionCode)}
                                        currentUserId={currentUserId}
                                        locked={locked}
                                        onChanged={refresh}
                                      />
                                    )}
                                  </li>
                                ))}
                              </ul>
                            )}
                            {(prev || next) && (
                              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
                                {prev ? (
                                  <button
                                    type="button"
                                    data-testid={`domain-previous-${s.domainCode}`}
                                    onClick={() => go(prev.domainCode)}
                                    className="inline-flex items-center gap-1.5 rounded-md border border-line-strong bg-surface px-3 py-1.5 text-sm font-medium text-ink hover:bg-surface-muted"
                                  >
                                    <ArrowLeft aria-hidden="true" className="h-4 w-4" />
                                    {domainShortName(nameOf(prev.domainCode))}
                                  </button>
                                ) : (
                                  <span />
                                )}
                                {next && (
                                  <button
                                    type="button"
                                    data-testid={`domain-next-${s.domainCode}`}
                                    onClick={() => go(next.domainCode)}
                                    className="inline-flex items-center gap-1.5 rounded-md bg-brand-navy px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-navy-dark"
                                  >
                                    Next domain: {domainShortName(nameOf(next.domainCode))}
                                    <ArrowRight aria-hidden="true" className="h-4 w-4" />
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        ),
                      };
                    })}
                  />
                </section>
              </>
            ),
          },
          {
            id: "score",
            label: "Score",
            hidden: !(organizationId && canReadScore),
            content: (
              <>
                <ScorePanel organizationId={organizationId!} assessmentId={assessment.id} refreshKey={scoreVersion} onFinalised={refresh} />
                {/* One domain in detail, with the cap named: the scorecard gives the
                    sixteen at a glance, this gives the arithmetic behind one of them. */}
                <DomainScoreTile organizationId={organizationId!} assessmentId={assessment.id} domain="GOV" refreshKey={scoreVersion} />
              </>
            ),
          },
        ]}
      />
    </div>
  );
}
