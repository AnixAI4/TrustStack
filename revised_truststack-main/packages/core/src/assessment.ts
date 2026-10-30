/**
 * Dynamic assessment generation (Slice 3). Pure functions, no I/O.
 *
 * The output is a SNAPSHOT: text, domain, weight and version are copied, never
 * referenced. Editing the bank afterwards must not change an assessment that
 * already exists — that is what makes a finalised score defensible evidence of
 * what was assessed, and when.
 */

import { type DomainCode, domainSortOrder, domainWeight } from "./domains.js";
import {
  type Applicability, type Priority, type QuestionRecord, resolveApplicability,
} from "./questions.js";
import { describeTrigger, evaluateTrigger, mapTriggerText, type ScopeFacts, type TriggerCondition } from "./triggers.js";

export const ASSESSMENT_TYPES = ["baseline", "reassessment"] as const;
export type AssessmentType = (typeof ASSESSMENT_TYPES)[number];

export const ASSESSMENT_STATUSES = ["draft", "in_progress", "submitted", "finalised"] as const;
export type AssessmentStatus = (typeof ASSESSMENT_STATUSES)[number];

/** Only a draft may be regenerated; anything further has answers attached. */
export const REGENERABLE_STATUSES: readonly AssessmentStatus[] = ["draft"];

export const PACK_TIERS = ["core", "overlay", "conditional", "reference"] as const;
export type PackTier = (typeof PACK_TIERS)[number];

export const PACK_STATUSES = ["draft", "approved", "retired"] as const;
export type PackStatus = (typeof PACK_STATUSES)[number];

export interface QuestionPack {
  code: string;
  tier: PackTier;
  industryCode: string | null;
  name: string;
  version: string;
  status: PackStatus;
  sourceFile: string | null;
}

/** The bank as the generator sees it: approved packs and the questions in them. */
export interface QuestionBank {
  packs: readonly QuestionPack[];
  questions: readonly QuestionRecord[];
}

export const INCLUDED_REASONS = ["core", "overlay", "trigger", "potentially_applicable"] as const;

export interface GeneratedQuestion {
  questionCode: string;
  questionVersion: string;
  /** Copied, not joined — see the file header. */
  questionText: string;
  domainCode: DomainCode;
  domainWeight: number;
  applicability: Applicability;
  priority: Priority | null;
  evidenceGuidance: string | null;
  suggestedOwner: string | null;
  packCode: string;
  sortOrder: number;
  /** `core` · `overlay` · `trigger:<expression>` · `potentially_applicable`. */
  includedReason: string;
}

export interface TriggerCoverage {
  /** Conditional questions whose authored condition is machine-evaluable. */
  mapped: number;
  /**
   * Questions shown as Potentially Applicable: the condition is authored but
   * has no reviewed mapping, or the file said only "Conditional" with no
   * condition at all.
   */
  unresolved: number;
  /** Distinct unmapped phrases, sorted. The wizard-field backlog, measured (D-029). */
  unresolvedPhrases: string[];
  /** Potentially Applicable questions whose file named no condition to map. */
  unstatedConditions: number;
}

export interface GenerationResult {
  questions: GeneratedQuestion[];
  /** Selected pack codes that generated at least one question. */
  packCodes: string[];
  /** Selected but skipped: unknown, not approved, reference-only, or empty. */
  skippedPacks: { code: string; reason: "not_approved" | "no_questions" | "unknown_pack" | "reference_pack" }[];
  /** Conditional questions whose trigger evaluated false — excluded on purpose. */
  excludedByTrigger: { questionCode: string; triggerText: string; expression: string }[];
  coverage: TriggerCoverage;
}

/**
 * Builds the question set for an assessment from the selected packs.
 *
 * Inclusion, per question:
 *   - mandatory                       → always, reason `core` or `overlay`
 *   - conditional + trigger true      → reason `trigger:<expression>`
 *   - conditional + trigger false     → excluded, and reported
 *   - conditional, trigger unmappable → reason `potentially_applicable` (D-029.3)
 *
 * Deterministic: domain sort order, then question code. Packs are visited in the
 * order given, and the first pack to carry a code wins — so a core question is
 * never duplicated by an overlay that repeats it.
 */
export function generateAssessmentQuestions(
  bank: QuestionBank,
  packCodes: readonly string[],
  facts: ScopeFacts,
): GenerationResult {
  const packsByCode = new Map(bank.packs.map((p) => [p.code, p]));
  const questionsByPack = new Map<string, QuestionRecord[]>();
  for (const question of bank.questions) {
    const list = questionsByPack.get(question.packCode);
    if (list) list.push(question);
    else questionsByPack.set(question.packCode, [question]);
  }

  const skippedPacks: GenerationResult["skippedPacks"] = [];
  const excludedByTrigger: GenerationResult["excludedByTrigger"] = [];
  const seen = new Set<string>();
  const usedPacks: string[] = [];
  const picked: { record: QuestionRecord; applicability: Applicability; includedReason: string }[] = [];

  let mapped = 0;
  let unresolved = 0;
  let unstatedConditions = 0;
  const unresolvedPhrases = new Set<string>();

  for (const code of packCodes) {
    const pack = packsByCode.get(code);
    if (!pack) { skippedPacks.push({ code, reason: "unknown_pack" }); continue; }
    if (pack.status !== "approved") { skippedPacks.push({ code, reason: "not_approved" }); continue; }
    // A reference pack is browsable but never generated (D-029.1).
    if (pack.tier === "reference") { skippedPacks.push({ code, reason: "reference_pack" }); continue; }
    const questions = questionsByPack.get(code) ?? [];
    if (questions.length === 0) { skippedPacks.push({ code, reason: "no_questions" }); continue; }

    let usedThisPack = false;
    for (const record of questions) {
      if (record.status === "retired" || seen.has(record.questionCode)) continue;

      // The loader resolves this once per question; re-derive only if a caller
      // hands over raw parser output.
      const condition = record.triggerCondition ?? mapTriggerText(record.triggerText);
      const applicability = resolveApplicability(
        { applicability: record.applicability, triggerText: record.triggerText, riskTags: record.riskTags },
        condition !== null,
      );

      if (applicability === "conditional") {
        mapped += 1;
      } else if (applicability === "potentially_applicable") {
        unresolved += 1;
        if (record.triggerText) unresolvedPhrases.add(record.triggerText);
        else unstatedConditions += 1;
      }

      let includedReason: string;
      if (applicability === "conditional") {
        // `condition` is non-null whenever resolveApplicability keeps `conditional`.
        if (!evaluateTrigger(condition as TriggerCondition, facts)) {
          excludedByTrigger.push({
            questionCode: record.questionCode,
            triggerText: record.triggerText ?? "",
            expression: describeTrigger(condition as TriggerCondition),
          });
          continue;
        }
        includedReason = `trigger:${describeTrigger(condition as TriggerCondition)}`;
      } else if (applicability === "potentially_applicable") {
        includedReason = "potentially_applicable";
      } else {
        includedReason = pack.tier === "core" ? "core" : "overlay";
      }

      seen.add(record.questionCode);
      picked.push({ record, applicability, includedReason });
      usedThisPack = true;
    }
    if (usedThisPack) usedPacks.push(code);
    else skippedPacks.push({ code, reason: "no_questions" });
  }

  picked.sort((a, b) => {
    const byDomain = domainSortOrder(a.record.domainCode) - domainSortOrder(b.record.domainCode);
    return byDomain !== 0 ? byDomain : a.record.questionCode.localeCompare(b.record.questionCode, "en");
  });

  const questions = picked.map(({ record, applicability, includedReason }, index) => ({
    questionCode: record.questionCode,
    questionVersion: record.version,
    questionText: record.questionText,
    domainCode: record.domainCode,
    domainWeight: domainWeight(record.domainCode),
    applicability,
    priority: record.priority,
    evidenceGuidance: record.evidenceGuidance,
    suggestedOwner: record.suggestedOwner,
    packCode: record.packCode,
    sortOrder: index + 1,
    includedReason,
  }));

  return {
    questions,
    packCodes: usedPacks,
    skippedPacks,
    excludedByTrigger,
    coverage: { mapped, unresolved, unresolvedPhrases: [...unresolvedPhrases].sort(), unstatedConditions },
  };
}

export interface DomainSummary {
  domainCode: DomainCode;
  weight: number;
  questionCount: number;
  potentiallyApplicableCount: number;
}

/** Per-domain counts for the assessment view. All 16 domains, in report order. */
export function summariseByDomain(questions: readonly GeneratedQuestion[]): DomainSummary[] {
  const byDomain = new Map<DomainCode, GeneratedQuestion[]>();
  for (const question of questions) {
    const list = byDomain.get(question.domainCode);
    if (list) list.push(question);
    else byDomain.set(question.domainCode, [question]);
  }
  return [...byDomain.entries()]
    .sort((a, b) => domainSortOrder(a[0]) - domainSortOrder(b[0]))
    .map(([domainCode, list]) => ({
      domainCode,
      weight: domainWeight(domainCode),
      questionCount: list.length,
      potentiallyApplicableCount: list.filter((q) => q.applicability === "potentially_applicable").length,
    }));
}
