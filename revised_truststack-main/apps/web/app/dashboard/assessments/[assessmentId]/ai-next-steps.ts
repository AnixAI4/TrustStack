import type { NextSteps } from "@/components/ai/assistant-panel";

/**
 * Where an answer's next step leads from a question (Slice 11 Stage 1b): to the
 * question's own answer form or its evidence, on this page, or to the gap register.
 */
export function questionNextSteps(assessmentId: string, questionCode: string): NextSteps {
  const focus = (testId: string, fallback: string) => () => {
    const el = document.querySelector<HTMLElement>(`[data-testid="${testId}"]`) ?? document.querySelector<HTMLElement>(`[data-testid="${fallback}"]`);
    el?.scrollIntoView({ block: "center", behavior: "smooth" });
    el?.focus();
  };
  return {
    answer_question: { onSelect: focus(`claim-${questionCode}`, `aq-${questionCode}`) },
    add_evidence: { onSelect: focus(`evidence-file-${questionCode}`, `aq-${questionCode}`) },
    view_gaps: { href: `/dashboard/assessments/${assessmentId}/gaps` },
  };
}

/**
 * Where a score answer's next step leads (Slice 11 Stage 1b): the domain's
 * questions on this page (the Questions tab, that domain), or the gap register.
 */
export function domainNextSteps(assessmentId: string, domainCode: string): NextSteps {
  const openDomain = () => {
    document.querySelector<HTMLElement>('[data-testid="tab-questions"]')?.click();
    document.querySelector<HTMLElement>(`[data-testid="domain-toggle-${domainCode}"]`)?.click();
  };
  return {
    answer_question: { onSelect: openDomain },
    add_evidence: { onSelect: openDomain },
    view_gaps: { href: `/dashboard/assessments/${assessmentId}/gaps` },
  };
}
