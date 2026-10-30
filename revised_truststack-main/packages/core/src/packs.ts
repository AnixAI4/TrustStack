/**
 * Question-pack definitions and the University question→pack assignment.
 *
 * This file is where D-029.1's outcome is recorded in code: the baseline is
 * 98 core + 10 University overlay questions, never ~205. The other 98
 * University questions are not deleted — they are assigned to a conditional
 * pack (fire on a trigger, or show as Potentially Applicable) or a reference
 * pack (in the bank and browsable, never generated).
 *
 * The full classification of all 108, with reasons, is
 * `docs/question_packs/OVERLAP_UNIVERSITY_CORE.md`.
 *
 * Reference data (D-020): the migration inserts these rows and a unit test
 * asserts the database matches this file.
 */

import type { PackStatus, PackTier, QuestionPack } from "./assessment.js";
import { CORE_PACK_CODE, INDUSTRIES } from "./scope.js";
import type { SourceTag } from "./questions.js";

export const UNIVERSITY_OVERLAY_PACK = "UNIVERSITY_HIGHER_ED_V1";
export const UNIVERSITY_PROCTORING_PACK = "UNIVERSITY_AI_PROCTORING_V1";
export const UNIVERSITY_CONDITIONAL_PACK = "UNIVERSITY_CONDITIONAL_V1";
export const UNIVERSITY_REFERENCE_PACK = "UNIVERSITY_REFERENCE_V1";

/**
 * The ten University overlay questions, confirmed by Aniket on 2026-09-18
 * against `docs/question_packs/OVERLAP_UNIVERSITY_CORE.md` §4 — one per domain,
 * seven `unique` and three `conditional`. Changing this list changes the
 * baseline, so it changes only with a decision entry.
 */
export const UNIVERSITY_BASELINE_QUESTIONS: readonly string[] = Object.freeze([
  "UNI-INV-004",   // Reservation, scholarship, disability and income documents as a high-risk class
  "UNI-ROPA-004",  // Exam processing documented registration → award publication
  "UNI-NOT-007",   // Separate notice where proctoring, CCTV or biometrics are used  [conditional]
  "UNI-RGT-003",   // Academic-record corrections routed to the exam authority
  "UNI-RET-002",   // Academic records, marksheets, transcripts and degrees: retention and archival
  "UNI-ACC-001",   // Marks, credits, grades and awards verified before publication
  "UNI-SEC-002",   // Exam and result systems: maker-checker, restricted access, audit logs
  "UNI-VEN-007",   // Affiliated colleges and partners classified independent / joint / processor
  "UNI-CHILD-003", // Minors across LMS, hostel, transport, counselling and welfare  [conditional]
  "UNI-AI-003",    // AI proctoring: proportionality, notice, retention, bias, vendor controls  [conditional]
]);

/** Selected only when the scope reports proctoring (the Slice 2 rule). */
export const UNIVERSITY_PROCTORING_QUESTIONS: readonly string[] = Object.freeze([
  "UNI-RET-003", // LMS activity logs, class recordings and proctoring recordings retention
]);

/**
 * Conditional pool. Selected for every University assessment; each question's
 * own trigger then decides whether it is included, and an unmappable trigger
 * shows it as Potentially Applicable rather than hiding it (D-029.3).
 *
 * `UNI-GOV-009` is the new question authored for Excel `MU_Overlay` U3
 * (templates for affiliated colleges), which had no equivalent among the 107.
 */
export const UNIVERSITY_CONDITIONAL_QUESTIONS: readonly string[] = Object.freeze([
  "UNI-GOV-009", "UNI-ROPA-003", "UNI-ROPA-005", "UNI-ROPA-006", "UNI-ROPA-007",
  "UNI-PUR-005", "UNI-PUR-006", "UNI-PUR-007", "UNI-PUR-008", "UNI-NOT-006",
  "UNI-CON-005", "UNI-CON-006", "UNI-RET-004", "UNI-RET-005", "UNI-ACC-004",
  "UNI-SEC-007", "UNI-CB-005", "UNI-AI-002",
  // Authored "Mandatory if GenAI use possible" — unique against core and
  // current, so it belongs in the pool rather than the never-generated
  // reference pack. The condition is not capturable, so it shows as
  // Potentially Applicable.
  "UNI-AI-004",
]);

/** Everything else in the University file: exact/partial overlaps and backlog. */
export function universityPackFor(questionCode: string): string {
  if (UNIVERSITY_BASELINE_QUESTIONS.includes(questionCode)) return UNIVERSITY_OVERLAY_PACK;
  if (UNIVERSITY_PROCTORING_QUESTIONS.includes(questionCode)) return UNIVERSITY_PROCTORING_PACK;
  if (UNIVERSITY_CONDITIONAL_QUESTIONS.includes(questionCode)) return UNIVERSITY_CONDITIONAL_PACK;
  return UNIVERSITY_REFERENCE_PACK;
}

/** The pack a parsed question belongs to, by source file and code. */
export function packForQuestion(sourceTag: SourceTag, questionCode: string): string {
  if (sourceTag === "core") return CORE_PACK_CODE;
  if (sourceTag === "university") return universityPackFor(questionCode);
  return INDUSTRIES.find((i) => i.code === sourceTag)!.overlayPackCode;
}

interface PackSeed {
  code: string;
  tier: PackTier;
  industryCode: string | null;
  name: string;
  status: PackStatus;
  sourceFile: string | null;
}

/**
 * Only `CORE_DPDP_V1` and the four University packs are `approved`, because
 * only they have been through the overlap exercise D-029.1 required. The nine
 * other industry overlays stay `draft` — they are in the bank and browsable,
 * and the generator refuses to include a pack that is not approved, so no
 * client is handed a 260-question assessment before its overlap map exists.
 *
 * The six cross-industry conditional packs have no authored questions at all
 * yet; they exist so `selectQuestionPacks()` resolves and the gap is visible.
 */
const PACK_SEEDS: readonly PackSeed[] = Object.freeze([
  { code: CORE_PACK_CODE, tier: "core", industryCode: null, name: "DPDP Compass core assessment", status: "approved", sourceFile: "docs/source/TrustStack_DPDP_Compass_Excel_MVP_Validated_Step12.xlsx#Question_Bank" },

  { code: UNIVERSITY_OVERLAY_PACK, tier: "overlay", industryCode: "university", name: "University / Higher Education overlay", status: "approved", sourceFile: "docs/question_packs/industry/01_University_Higher_Education_DPDP_Questions.md" },
  { code: UNIVERSITY_PROCTORING_PACK, tier: "conditional", industryCode: "university", name: "University AI proctoring pack", status: "approved", sourceFile: "docs/question_packs/industry/01_University_Higher_Education_DPDP_Questions.md" },
  { code: UNIVERSITY_CONDITIONAL_PACK, tier: "conditional", industryCode: "university", name: "University conditional pool", status: "approved", sourceFile: "docs/question_packs/industry/01_University_Higher_Education_DPDP_Questions.md" },
  { code: UNIVERSITY_REFERENCE_PACK, tier: "reference", industryCode: "university", name: "University reference pool", status: "approved", sourceFile: "docs/question_packs/industry/01_University_Higher_Education_DPDP_Questions.md" },

  { code: "EDTECH_OVERLAY_V1", tier: "overlay", industryCode: "edtech", name: "EdTech / Online Learning overlay", status: "draft", sourceFile: "docs/question_packs/industry/02_EdTech_Online_Learning_DPDP_Questions.md" },
  { code: "BFSI_OVERLAY_V1", tier: "overlay", industryCode: "bfsi", name: "BFSI overlay", status: "draft", sourceFile: "docs/question_packs/industry/03_BFSI_DPDP_Questions.md" },
  { code: "HEALTHCARE_OVERLAY_V1", tier: "overlay", industryCode: "healthcare", name: "Healthcare overlay", status: "draft", sourceFile: "docs/question_packs/industry/04_Healthcare_DPDP_Questions.md" },
  { code: "SAAS_TECH_OVERLAY_V1", tier: "overlay", industryCode: "saas", name: "SaaS / Technology overlay", status: "draft", sourceFile: "docs/question_packs/industry/05_SaaS_Technology_DPDP_Questions.md" },
  { code: "MANUFACTURING_OVERLAY_V1", tier: "overlay", industryCode: "manufacturing", name: "Manufacturing overlay", status: "draft", sourceFile: "docs/question_packs/industry/06_Manufacturing_DPDP_Questions.md" },
  { code: "RETAIL_ECOMMERCE_OVERLAY_V1", tier: "overlay", industryCode: "retail_ecommerce", name: "Retail / E-commerce overlay", status: "draft", sourceFile: "docs/question_packs/industry/07_Retail_Ecommerce_DPDP_Questions.md" },
  { code: "PROFESSIONAL_SERVICES_OVERLAY_V1", tier: "overlay", industryCode: "professional_services", name: "Professional Services overlay", status: "draft", sourceFile: "docs/question_packs/industry/08_Professional_Services_DPDP_Questions.md" },
  { code: "PUBLIC_SECTOR_OVERLAY_V1", tier: "overlay", industryCode: "public_sector", name: "Public Sector overlay", status: "draft", sourceFile: "docs/question_packs/industry/09_Public_Sector_DPDP_Questions.md" },
  { code: "GENERAL_ORGANISATION_V1", tier: "overlay", industryCode: "general", name: "General Organisation overlay", status: "draft", sourceFile: "docs/question_packs/industry/10_General_Organisation_DPDP_Questions.md" },

  { code: "CHILDREN_DATA_V1", tier: "conditional", industryCode: null, name: "Children's data pack", status: "draft", sourceFile: null },
  { code: "VENDOR_PROCESSOR_V1", tier: "conditional", industryCode: null, name: "Vendor / Data Processor pack", status: "draft", sourceFile: null },
  { code: "CLOUD_CROSSBORDER_V1", tier: "conditional", industryCode: null, name: "Cloud and cross-border pack", status: "draft", sourceFile: null },
  { code: "AI_RISK_V1", tier: "conditional", industryCode: null, name: "AI risk pack", status: "draft", sourceFile: null },
  { code: "MARKETING_TRACKING_V1", tier: "conditional", industryCode: null, name: "Marketing and tracking pack", status: "draft", sourceFile: null },
  // Internal readiness pack. The platform never infers SDF status (D-028).
  { code: "SDF_READINESS_V1", tier: "conditional", industryCode: null, name: "SDF readiness pack (internal trigger, not a classification)", status: "draft", sourceFile: null },
]);

export const QUESTION_PACK_VERSION = "1.0";

export const QUESTION_PACKS: readonly QuestionPack[] = Object.freeze(
  PACK_SEEDS.map((p) => Object.freeze({ ...p, version: QUESTION_PACK_VERSION })),
);

export const QUESTION_PACK_CODES: readonly string[] = QUESTION_PACKS.map((p) => p.code);

export function questionPack(code: string): QuestionPack | undefined {
  return QUESTION_PACKS.find((p) => p.code === code);
}

/** Packs the generator may draw from. A `reference` pack is never generated. */
export function isGeneratablePack(pack: QuestionPack): boolean {
  return pack.status === "approved" && pack.tier !== "reference";
}
