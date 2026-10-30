import { CLOSING_REVIEW_STATUSES, DPDP_DOMAINS, detectInjection, pickAllowed, scrubPersonalData, stripBankInternals, type ScrubKind } from "@truststack/core";
import { z } from "zod";
import type { ShapedContext } from "./shared";

/**
 * The Question Helper (SLICE_11 §2.2, Stage 1a: through the API only) —
 * "Explain this question". Its context is built in two halves:
 *
 *   * READ (`../gateway.ts` buildContext) — through the routes' own readers (D-069): the
 *     organisation, the question as a client role reads it, the answer and its
 *     evidence.
 *   * SHAPE (here, pure) — the allow-list (§4.6), the black box (§4.5), the
 *     scrub (A3) and the injection flag (§8). The black-box and personal-data
 *     tests plant fields in the raw input and prove none reaches the prompt.
 *
 * What it sends: the question's text and evidence guidance, its domain's NAME,
 * the suggested owner (a role), whether it is mandatory; the organisation's
 * name, type and industry; the answer's applicability and claimed level, how
 * many evidence items are attached and reviewed; the answer's notes and the
 * evidence file NAMES as untrusted data; the person's own question.
 * Never: a question code, pack, weight, priority, trigger, evidence level,
 * adjusted score or cap; anyone's name, email or id; a file's contents.
 */

export const questionHelperBody = z
  .object({
    assessmentId: z.uuid(),
    questionCode: z.string().min(1).max(64).regex(/^[A-Za-z0-9._-]+$/),
    /** The person's own question, optional: "what counts as evidence here?" */
    ask: z.string().trim().max(500).optional(),
  })
  .strict();
export type QuestionHelperBody = z.infer<typeof questionHelperBody>;

/** What the readers return — wider than what is sent, on purpose. */
export interface QuestionHelperRaw {
  organisation: Record<string, unknown> & { name: string; organizationType: string; industryName: string | null };
  question: Record<string, unknown> & { questionText: string };
  response: (Record<string, unknown> & { evidence?: Record<string, unknown>[] }) | null;
  ask: string | null;
}

const QUESTION_FIELDS = ["questionText", "evidenceGuidance", "domainCode", "applicability", "suggestedOwner"] as const;
const ORGANISATION_FIELDS = ["name", "organizationType", "industryName"] as const;
const RESPONSE_FIELDS = ["applicabilityDecision", "claimedMaturity", "notes", "naReason"] as const;
const EVIDENCE_FIELDS = ["fileName", "reviewStatus"] as const;

export type { ShapedContext };

export function shapeQuestionHelperContext(
  raw: QuestionHelperRaw,
  target: { assessmentId: string; questionCode: string },
  untrustedJson: (value: unknown) => string,
): ShapedContext {
  const scrubbed: Partial<Record<ScrubKind, number>> = {};
  let injectionFlagged = false;
  /** Every free text: bank codes out, personal data masked, instruction-like text flagged. */
  const clean = (value: unknown, untrusted: boolean): string | null => {
    if (typeof value !== "string" || value.trim() === "") return null;
    const { text, masked } = scrubPersonalData(stripBankInternals(value));
    for (const [k, n] of Object.entries(masked)) scrubbed[k as ScrubKind] = (scrubbed[k as ScrubKind] ?? 0) + (n ?? 0);
    if (untrusted && detectInjection(text)) injectionFlagged = true;
    return text;
  };

  const org = pickAllowed(raw.organisation, ORGANISATION_FIELDS);
  const q = pickAllowed(raw.question, QUESTION_FIELDS);
  const domain = DPDP_DOMAINS.find((d) => d.code === q.domainCode);
  const r = raw.response ? pickAllowed(raw.response, RESPONSE_FIELDS) : null;
  const evidence = (raw.response?.evidence ?? []).map((e) => pickAllowed(e, EVIDENCE_FIELDS));

  const organisation = {
    name: clean(org.name, false),
    type: org.organizationType,
    industry: org.industryName ?? null,
  };
  const question = {
    text: clean(q.questionText, false),
    evidenceGuidance: clean(q.evidenceGuidance, false),
    area: domain?.name ?? null,
    suggestedOwner: clean(q.suggestedOwner, false),
    mandatory: q.applicability === "mandatory",
  };
  const currentAnswer = r
    ? {
        answered: true,
        applies: r.applicabilityDecision === "applicable",
        // 0–5, as the person chose it — never the evidence level or the adjusted score (§4.5).
        claimedMaturity: typeof r.claimedMaturity === "number" ? r.claimedMaturity : null,
        evidenceAttached: evidence.length,
        // Reviewed as Adequate or Strong — core's own "accepted evidence" (D-056); 1a counted a status that does not exist.
        evidenceAccepted: evidence.filter((e) => (CLOSING_REVIEW_STATUSES as readonly unknown[]).includes(e.reviewStatus)).length,
      }
    : { answered: false };
  const untrusted = {
    answerNotes: r ? clean(r.notes, true) : null,
    notApplicableReason: r ? clean(r.naReason, true) : null,
    evidenceFileNames: evidence.map((e) => clean(e.fileName, true)).filter((n): n is string => n !== null).slice(0, 10),
  };
  const ask = clean(raw.ask, true);

  const context = { task: "question_helper", organisation, question, currentAnswer, untrusted, ask };
  const user = [
    "TASK: Explain this assessment question to the person answering it for their organisation — what it asks, why it matters to this organisation, what evidence would show it, and one next step (nextStep.page: \"answer_question\" if it is unanswered, \"add_evidence\" if evidence is missing or unreviewed, otherwise the most useful page).",
    "",
    "<organisation>",
    JSON.stringify(organisation, null, 2),
    "</organisation>",
    "",
    "<question>",
    JSON.stringify(question, null, 2),
    "</question>",
    "",
    "<current_answer>",
    JSON.stringify(currentAnswer, null, 2),
    "</current_answer>",
    "",
    "<untrusted_data>",
    untrustedJson(untrusted),
    "</untrusted_data>",
    "",
    "<person_question>",
    ask ? untrustedJson(ask) : "(none — explain the question)",
    "</person_question>",
  ].join("\n");

  return {
    context,
    user,
    injectionFlagged,
    scrubbed,
    target: { type: "assessment_question", id: target.assessmentId, key: target.questionCode },
  };
}
