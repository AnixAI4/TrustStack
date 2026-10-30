/**
 * Slice 11 — the AI assistant's task catalogue, its switch rules and its
 * limits (SLICE_11 §4.1, §4.7–§4.9; D-124). Framework-free: the gateway in
 * apps/web/lib/ai reads these; the migration 20261020000000_ai_gateway
 * mirrors the vocabularies (`app.ai_tasks()`, `app.ai_task_read_permission()`,
 * `app.ai_held_industries()`), held together by tests/rls/ai.test.ts.
 */
import type { PermissionCode } from "./rbac.js";

/**
 * Stage 1b: the four explain helpers (§2.2). Stage 2a: three drafting tasks for the
 * registers (§2.3) — a draft a person edits and accepts or discards. Stage 2b: a privacy
 * notice from the processing register, its translation, and a report's narrative.
 */
export const AI_TASKS = [
  "question_helper",
  "evidence_helper",
  "gap_helper",
  "score_helper",
  "ropa_draft",
  "breach_intimation_draft",
  "rights_response_draft",
  "notice_draft",
  "notice_translation_draft",
  "report_narrative_draft",
] as const;
export type AiTask = (typeof AI_TASKS)[number];

export function isAiTask(value: string): value is AiTask {
  return (AI_TASKS as readonly string[]).includes(value);
}

/** Effort is the only depth control on the default model (§4.1): low to explain, medium to draft. */
export type AiEffort = "low" | "medium";

/**
 * What a draft is about: a question, an answer's evidence, a gap (and one of its
 * actions), a domain's score; a processing record not yet made (`ropa_new`, no
 * target id), a breach incident, a rights request; a notice not yet made
 * (`notice_new`, no id), the published notice a translation is made from, the
 * report version a narrative is about (Stage 2b).
 */
export const AI_TARGET_TYPES = [
  "assessment_question",
  "assessment_response",
  "assessment_gap",
  "assessment_domain",
  "ropa_new",
  "breach_incident",
  "rights_request",
  "notice_new",
  "privacy_notice",
  "report",
] as const;
export type AiTargetType = (typeof AI_TARGET_TYPES)[number];

export interface AiTaskSpec {
  /** Beside `ai.use`: the read permission of what the task explains (§4.7). */
  readPermission: PermissionCode;
  /** The write permission a drafting task's register needs — none for an explain task. */
  writePermission: PermissionCode | null;
  kind: "explain" | "draft";
  effort: AiEffort;
  /** The per-call output ceiling, thinking included (§4.12). */
  maxTokens: number;
  /** A legal draft carries `legalReviewRequired: true` (§4.3) — set by the server, never the model. */
  legal: boolean;
  /** What the draft row points at — mirrors `ai_drafts_target_type_check`. */
  targetType: AiTargetType;
  /** Plain words for the audit and the panel. */
  label: string;
}

export const AI_TASK_SPECS: Readonly<Record<AiTask, AiTaskSpec>> = Object.freeze({
  question_helper: {
    readPermission: "assessment.read",
    writePermission: null,
    kind: "explain",
    effort: "low",
    maxTokens: 8000,
    legal: false,
    targetType: "assessment_question",
    label: "Explain this question",
  },
  evidence_helper: {
    readPermission: "evidence.read",
    writePermission: null,
    kind: "explain",
    effort: "low",
    maxTokens: 8000,
    legal: false,
    targetType: "assessment_response",
    label: "Is this evidence enough?",
  },
  gap_helper: {
    readPermission: "gap.read",
    writePermission: null,
    kind: "explain",
    effort: "low",
    maxTokens: 8000,
    legal: false,
    targetType: "assessment_gap",
    label: "Explain this gap",
  },
  score_helper: {
    readPermission: "score.read",
    writePermission: null,
    kind: "explain",
    effort: "low",
    maxTokens: 8000,
    legal: false,
    targetType: "assessment_domain",
    label: "Why is this domain's score what it is?",
  },
  // Stage 2a — drafts for the registers. Accepted or discarded by a holder of the
  // register's write permission (D-129.3); accepting only pre-fills, the person saves.
  ropa_draft: {
    readPermission: "ropa.read",
    writePermission: "ropa.write",
    kind: "draft",
    effort: "medium",
    maxTokens: 16000,
    // A register entry, not a legal draft: its lawful basis is a note for counsel (D-065).
    legal: false,
    targetType: "ropa_new",
    label: "Draft a record from a description",
  },
  breach_intimation_draft: {
    readPermission: "breach.read",
    writePermission: "breach.write",
    kind: "draft",
    effort: "medium",
    maxTokens: 16000,
    legal: true,
    targetType: "breach_incident",
    label: "Draft the Board intimation (Rule 7(2))",
  },
  rights_response_draft: {
    readPermission: "rights.read",
    writePermission: "rights.write",
    kind: "draft",
    effort: "medium",
    maxTokens: 16000,
    legal: true,
    targetType: "rights_request",
    label: "Draft a response",
  },
  // Stage 2b — legal drafts all three (§4.3, §7c.2): a notice and its translation for counsel
  // (s.5, Rule 3); a narrative for the Board, printed only in a new version once accepted (D-133.1).
  notice_draft: {
    readPermission: "consent.read",
    writePermission: "consent.write",
    kind: "draft",
    effort: "medium",
    maxTokens: 16000,
    legal: true,
    targetType: "notice_new",
    label: "Draft a notice from the processing register",
  },
  notice_translation_draft: {
    readPermission: "consent.read",
    writePermission: "consent.write",
    kind: "draft",
    effort: "medium",
    maxTokens: 16000,
    legal: true,
    targetType: "privacy_notice",
    label: "Translate this notice",
  },
  report_narrative_draft: {
    readPermission: "report.read",
    writePermission: "report.generate",
    kind: "draft",
    effort: "medium",
    maxTokens: 16000,
    legal: true,
    targetType: "report",
    label: "Draft a narrative",
  },
});

/** The drafting tasks — a person accepts or discards their drafts. */
export const AI_DRAFT_TASKS = AI_TASKS.filter((t) => AI_TASK_SPECS[t].kind === "draft");

/**
 * Rule 7(2)(b)(iv) — "any findings regarding the person who caused the breach" —
 * is never drafted: the server writes this placeholder, whatever the model says
 * (D-129, §7b.3). The organisation completes it; no individual is named to a model.
 */
export const AI_INTIMATION_PERSON_PLACEHOLDER =
  "[To be completed by the organisation — do not name individuals in this draft.]";

/** Rule 7(2)(b)(vi) when no intimation to the affected people is recorded yet. */
export const AI_INTIMATION_NO_PRINCIPALS_YET =
  "[No intimation to the affected Data Principals is recorded yet. Record it under Rule 7(1) and complete this before sending.]";

/**
 * Rule 9 (D-137, F3): every response to a request to exercise a right gives the business contact of
 * the DPO, if any, or of a person who can answer questions about the processing. The person fills it in.
 */
export const AI_RIGHTS_CONTACT_PLACEHOLDER = "[Contact for questions about your personal data — Rule 9]";

/**
 * s.11(1), s.12(1) (D-137, F2): access, correction, completion, updating and erasure are rights only
 * for personal data the person gave consent for (including under s.7(a)). The draft never knows the
 * basis, so it never says the right applies: this placeholder is for the person and counsel.
 */
export const AI_RIGHTS_APPLIES_PLACEHOLDER = "[Whether this right applies to the personal data concerned — to be confirmed]";

/** The rights letter's placeholders: the person's identity never reaches the model (§4.6, D-129.2); Rule 9's contact (D-137). */
export const AI_RIGHTS_PLACEHOLDERS = ["[Name]", "[reference]", "[date]", AI_RIGHTS_CONTACT_PLACEHOLDER] as const;

/** s.16(2): sector rules may be stricter — held until counsel's sign-off is recorded (A4). */
export const AI_HELD_INDUSTRIES = ["bfsi", "healthcare"] as const;

export type AiHoldReason = "sdf" | "sector";

/** Mirrors `app.ai_hold_reason()`: an SDF first (Rule 13(4)), then a held industry with no sign-off. */
export function aiHoldReason(
  industryCode: string | null,
  sdfNotifiedOn: string | null,
  signedOffIndustries: readonly string[],
): AiHoldReason | null {
  if (sdfNotifiedOn !== null) return "sdf";
  if (industryCode !== null && (AI_HELD_INDUSTRIES as readonly string[]).includes(industryCode) && !signedOffIndustries.includes(industryCode)) {
    return "sector";
  }
  return null;
}

/** Why the assistant is off, in plain words — the API's 403 and the panel's empty state. */
export type AiOffReason = "platform" | "organisation" | AiHoldReason;

export const AI_OFF_MESSAGE: Readonly<Record<AiOffReason, string>> = Object.freeze({
  platform: "The AI assistant is not available on this installation yet.",
  organisation:
    "The AI assistant is off for this organisation. An administrator can turn it on once your contract with TrustStack names the AI provider.",
  sector:
    "The AI assistant stays off for this industry until counsel has signed off its sector rules (DPDP Act s.16(2)).",
  sdf: "The AI assistant stays off for a Significant Data Fiduciary until the Government says which data may not leave India (DPDP Rules, rule 13(4)).",
});

/**
 * Why a call may not run — checked before any context is read or any provider
 * called (§8 "off by default"). The kill switch first (it wins over all, §4.8),
 * then a hold (it explains why the switch cannot be turned on), then the switch.
 */
export function aiOffReason(input: {
  platformEnabled: boolean;
  organisationEnabled: boolean;
  industryCode: string | null;
  sdfNotifiedOn: string | null;
  signedOffIndustries: readonly string[];
}): AiOffReason | null {
  if (!input.platformEnabled) return "platform";
  const hold = aiHoldReason(input.industryCode, input.sdfNotifiedOn, input.signedOffIndustries);
  if (hold) return hold;
  if (!input.organisationEnabled) return "organisation";
  return null;
}

/**
 * §4.9: per person and per organisation, per rolling hour, and a monthly
 * token ceiling per organisation (every token — input, output, cache read and
 * write — counted alike). A config value until Slice 14's licensing.
 */
export const AI_LIMITS = Object.freeze({
  personCallsPerHour: 30,
  organizationCallsPerHour: 200,
  organizationTokensPerMonth: 20_000_000,
});

export interface AiUsage {
  personCallsLastHour: number;
  organizationCallsLastHour: number;
  organizationTokensThisMonth: number;
}

export type AiLimitHit = "person" | "organization" | "monthly_tokens";

export function aiLimitHit(usage: AiUsage, limits: typeof AI_LIMITS = AI_LIMITS): AiLimitHit | null {
  if (usage.organizationTokensThisMonth >= limits.organizationTokensPerMonth) return "monthly_tokens";
  if (usage.organizationCallsLastHour >= limits.organizationCallsPerHour) return "organization";
  if (usage.personCallsLastHour >= limits.personCallsPerHour) return "person";
  return null;
}

export const AI_LIMIT_MESSAGE: Readonly<Record<AiLimitHit, string>> = Object.freeze({
  person: "You have asked the AI assistant a lot in the last hour. Try again later.",
  organization: "Your organisation has asked the AI assistant a lot in the last hour. Try again later.",
  monthly_tokens: "Your organisation has used this month's AI assistant allowance. It resets on the 1st.",
});

/** Why a call's answer was not kept — stored on the rejected row and audited as `ai.refused`. */
export const AI_REJECTIONS = ["refusal", "truncated", "invalid_output", "wording", "citation", "other_tenant"] as const;
export type AiRejection = (typeof AI_REJECTIONS)[number];

export const AI_REJECTION_MESSAGE: Readonly<Record<AiRejection, string>> = Object.freeze({
  refusal: "The AI assistant declined to answer this. Nothing was changed.",
  truncated: "The AI assistant's answer was cut short, so it was not kept. Try again.",
  invalid_output: "The AI assistant's answer was not in the expected form, so it was not kept. Try again.",
  wording: "The AI assistant's answer said something TrustStack never says (such as calling an organisation compliant), so it was not kept.",
  citation: "The AI assistant's answer did not point to the Act or the Rules, so it was not kept.",
  other_tenant: "The AI assistant's answer mentioned another organisation, so it was not kept.",
});

/** A rights draft that decided the outcome (D-129.2) — refused as `wording`, said in its own words. */
export const AI_STATES_OUTCOME_MESSAGE =
  "The AI assistant's draft decided the outcome of the request, which is a person's decision, so it was not kept. Try again.";

/** A narrative that states a number its report does not (D-133.1) — refused as `invalid_output`, in its own words. */
export const AI_NARRATIVE_NUMBERS_MESSAGE =
  "The AI assistant's narrative stated a figure that is not in the report, so it was not kept. Try again.";

/** A translation that changed, dropped or added a purpose (D-133.2) — refused as `invalid_output`, in its own words. */
export const AI_TRANSLATION_KEYS_MESSAGE =
  "The AI assistant's translation did not keep the notice's purposes exactly, so it was not kept. Try again.";

/** Thumbs up / down (§4.13): given once, by the person who asked; the comment is scrubbed (A3) and never audited. */
export const AI_FEEDBACK = ["up", "down"] as const;
export type AiFeedback = (typeof AI_FEEDBACK)[number];
export const AI_FEEDBACK_COMMENT_MAX = 500;

/** Printed under every answer (§4.13): the AI drafts; a person decides. */
export const AI_REVIEW_NOTE = "Suggested by the AI assistant — a person must review it before relying on it.";
export const AI_COUNSEL_NOTE = "For review by counsel before use.";
