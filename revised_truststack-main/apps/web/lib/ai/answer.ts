import {
  AI_COUNSEL_NOTE,
  AI_REVIEW_NOTE,
  AI_TASK_SPECS,
  checkCitation,
  checkWording,
  DPDP_REPORT_CAVEAT,
  namesAnotherOrganisation,
  namesTrustStackTarget,
  type AiRejection,
  type AiTask,
  type ProvisionIndex,
  type WordingViolation,
} from "@truststack/core";
import { z } from "zod";

/**
 * The answer's one shape (SLICE_11 §4.3, §4.13, spec Step J's schema): the
 * answer in one sentence; why it matters to this organisation; one next step;
 * the law, folded away by default; "Tell me more" for the rest. The model fills
 * these fields; the SERVER sets every review flag, the caveat and the canonical
 * citations — never the model.
 *
 * Pure: no database, no provider. The guardrail suite drives `evaluateAnswer`
 * with hostile outputs (tests/unit/ai-guardrails.test.ts).
 */

export const NEXT_STEP_PAGES = ["answer_question", "add_evidence", "view_gaps", "none"] as const;
export type NextStepPage = (typeof NEXT_STEP_PAGES)[number];

/** What the model must return — validated again after structured output, with lengths. */
export const modelAnswerSchema = z
  .object({
    answer: z.string().trim().min(1).max(500),
    whyItMatters: z.string().trim().min(1).max(1000),
    nextStep: z.object({ label: z.string().trim().min(1).max(120), page: z.enum(NEXT_STEP_PAGES) }).strict(),
    moreDetail: z.string().trim().max(4000),
    law: z
      .array(
        z
          .object({
            citation: z.string().trim().min(1).max(80),
            point: z.string().trim().min(1).max(600),
            source: z.enum(["statute", "truststack_default"]),
          })
          .strict(),
      )
      .min(1)
      .max(8),
    suggestedEvidence: z.array(z.string().trim().min(1).max(300)).max(8),
    missingInformation: z.array(z.string().trim().min(1).max(300)).max(8),
    counselToConfirm: z.boolean(),
    confidence: z.enum(["high", "medium", "low"]),
  })
  .strict();
export type ModelAnswer = z.infer<typeof modelAnswerSchema>;

/**
 * The same shape as a JSON schema for `output_config.format`. Written by hand:
 * structured output accepts a subset of JSON Schema (no length bounds), so the
 * bounds live in the Zod check above.
 */
export const MODEL_ANSWER_JSON_SCHEMA: Record<string, unknown> = {
  type: "object",
  additionalProperties: false,
  required: ["answer", "whyItMatters", "nextStep", "moreDetail", "law", "suggestedEvidence", "missingInformation", "counselToConfirm", "confidence"],
  properties: {
    answer: { type: "string", description: "The answer in one plain sentence." },
    whyItMatters: { type: "string", description: "Why this matters to THIS organisation, from its own context. Two or three short sentences." },
    nextStep: {
      type: "object",
      additionalProperties: false,
      required: ["label", "page"],
      properties: {
        label: { type: "string", description: "One next step, as a short button label." },
        page: { type: "string", enum: [...NEXT_STEP_PAGES] },
      },
    },
    moreDetail: { type: "string", description: "The longer explanation shown under 'Tell me more'. Plain words; legal terms glossed on first use." },
    law: {
      type: "array",
      description: "The provisions relied on. At least one.",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["citation", "point", "source"],
        properties: {
          citation: { type: "string", description: "Exactly one provision, e.g. 's.8(5)', 'Rule 7(2)', 'Third Schedule'." },
          point: { type: "string", description: "What that provision says that matters here, in plain words." },
          source: { type: "string", enum: ["statute", "truststack_default"] },
        },
      },
    },
    suggestedEvidence: { type: "array", items: { type: "string" } },
    missingInformation: { type: "array", items: { type: "string" } },
    counselToConfirm: { type: "boolean", description: "True where the law is unclear and counsel must confirm." },
    confidence: { type: "string", enum: ["high", "medium", "low"] },
  },
};

/** What the API returns and the draft row stores. */
export interface AiAnswer extends ModelAnswer {
  task: AiTask;
  law: (ModelAnswer["law"][number] & { citation: string })[];
  /** Canonical citations, as spec Step J's `sourceReferences`. */
  sourceReferences: string[];
  /** Server-forced, always true (§4.3). */
  requiresHumanReview: true;
  /** Server-forced: true for every legal draft (§4.3) — never the model's to unset. */
  legalReviewRequired: boolean;
  /** D-011, verbatim. */
  caveat: string;
  reviewNote: string;
  counselNote: string | null;
}

export type Evaluation =
  | { ok: true; answer: AiAnswer; citationFlags: { citation: string; reason: string }[]; relabelled: number }
  | { ok: false; rejection: AiRejection; detail: string; citationFlags: { citation: string; reason: string }[] };

/** Every string the model wrote, for the wording and tenancy checks. */
function modelText(a: ModelAnswer): string {
  return [
    a.answer,
    a.whyItMatters,
    a.nextStep.label,
    a.moreDetail,
    ...a.law.flatMap((l) => [l.point]),
    ...a.suggestedEvidence,
    ...a.missingInformation,
  ].join("\n");
}

export function evaluateAnswer(
  task: AiTask,
  raw: string,
  options: { index: ProvisionIndex; otherOrganisationNames: readonly string[] },
): Evaluation {
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return { ok: false, rejection: "invalid_output", detail: "not JSON", citationFlags: [] };
  }
  const parsed = modelAnswerSchema.safeParse(json);
  if (!parsed.success) {
    return { ok: false, rejection: "invalid_output", detail: parsed.error.issues.map((i) => i.path.join(".")).join(", "), citationFlags: [] };
  }
  const answer = parsed.data;
  const text = modelText(answer);

  const wording: WordingViolation[] = checkWording(text);
  if (wording.length > 0) return { ok: false, rejection: "wording", detail: wording.join(", "), citationFlags: [] };

  if (namesAnotherOrganisation(text, options.otherOrganisationNames)) {
    return { ok: false, rejection: "other_tenant", detail: "names another organisation", citationFlags: [] };
  }

  // §4.2(a): drop and flag a citation the corpus lacks; none left is a rejection.
  const citationFlags: { citation: string; reason: string }[] = [];
  const law: AiAnswer["law"] = [];
  let relabelled = 0;
  for (const item of answer.law) {
    const check = checkCitation(item.citation, options.index);
    if (!check.valid || !check.canonical) {
      citationFlags.push({ citation: item.citation, reason: check.reason ?? "not_in_corpus" });
      continue;
    }
    // D-126.3: every provision in the corpus is the Act or the Rules. Labelled a
    // TrustStack default, it stays one only if its point names a TrustStack target;
    // otherwise it is the law (the live smoke called s.8(10) a TrustStack default).
    const source = item.source === "truststack_default" && !namesTrustStackTarget(item.point) ? "statute" : item.source;
    if (source !== item.source) relabelled += 1;
    law.push({ ...item, citation: check.canonical, source });
  }
  if (law.length === 0) return { ok: false, rejection: "citation", detail: "no provision found in the corpus", citationFlags };

  const spec = AI_TASK_SPECS[task];
  return {
    ok: true,
    citationFlags,
    relabelled,
    answer: {
      ...answer,
      task,
      law,
      sourceReferences: [...new Set(law.map((l) => l.citation))],
      requiresHumanReview: true,
      legalReviewRequired: spec.legal,
      caveat: DPDP_REPORT_CAVEAT,
      reviewNote: AI_REVIEW_NOTE,
      counselNote: spec.legal || answer.counselToConfirm ? AI_COUNSEL_NOTE : null,
    },
  };
}
