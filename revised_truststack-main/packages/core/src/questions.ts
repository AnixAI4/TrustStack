/**
 * The question bank's canonical record, and the parser that produces it from
 * the authored Markdown (D-013: the Markdown is the source of truth; nobody
 * re-keys it into CSV).
 *
 * Ten files use seven different column layouts, so mapping is by HEADER NAME,
 * never by position (`docs/QUESTION_FORMAT.md` §Column aliases). This is a
 * TypeScript port of `tools/question_inventory.py`, which stays in the docs
 * workflow as an independent cross-check of the same invariants.
 *
 * Nothing here invents content: a missing priority stays `null`, and the core
 * pack's placeholder legal basis becomes `null` rather than a fake citation.
 */

import { DOMAIN_CODES, type DomainCode, isDomainCode } from "./domains.js";
import type { TriggerCondition } from "./triggers.js";

// ---------------------------------------------------------------------------
// Canonical record
// ---------------------------------------------------------------------------

/** Mandatory always applies; conditional needs a trigger; potentially applicable is shown and answered or marked N/A (D-029.3). */
export const APPLICABILITIES = ["mandatory", "conditional", "potentially_applicable"] as const;
export type Applicability = (typeof APPLICABILITIES)[number];

/**
 * Canonical risk tags. The authored `Type` cells carry a long tail of one-off
 * labels ("Omnichannel", "Logistics", "Video-linked"); those are preserved
 * verbatim in `typeText` instead of diluting this vocabulary.
 */
export const QUESTION_RISK_TAGS = [
  "advanced",
  "ai_linked",
  "children_linked",
  "evidence_heavy",
  "high_risk",
  "marketing_linked",
  "payment_linked",
  "reassessment_trigger",
  "vendor_linked",
] as const;
export type QuestionRiskTag = (typeof QUESTION_RISK_TAGS)[number];

export const PRIORITIES = ["P0", "P1", "P2", "P3"] as const;
export type Priority = (typeof PRIORITIES)[number];

/** `Criticality` exists only in the Excel core pack. */
export const CRITICALITIES = ["Critical", "High", "Medium", "Low"] as const;
export type Criticality = (typeof CRITICALITIES)[number];

export const SOURCE_TAGS = [
  "core", "university", "edtech", "bfsi", "healthcare", "saas",
  "manufacturing", "retail_ecommerce", "professional_services", "public_sector", "general",
] as const;
export type SourceTag = (typeof SOURCE_TAGS)[number];

export interface QuestionRecord {
  /** Stable forever. A meaning change is a new code or a new version, never an edit. */
  questionCode: string;
  questionText: string;
  packCode: string;
  sourceTag: SourceTag;
  /** The ONLY scoring domain — the first code in a multi-domain cell (D-029.2). */
  domainCode: DomainCode;
  /** Kept for cross-reference, dashboards and gap linkage. Never scores (D-029.2). */
  secondaryDomainCodes: DomainCode[];
  applicability: Applicability;
  /** The authored `Type` / `Trigger` cell, verbatim. Null when the layout has no such column. */
  typeText: string | null;
  /** The human-readable condition, as authored ("LMS used"). Null when unconditional. */
  triggerText: string | null;
  /**
   * The machine-evaluable form of `triggerText`, or null when no reviewed
   * mapping exists. The PARSER always leaves this null — it is filled when the
   * bank is loaded, which is also where `applicability` is resolved from
   * `conditional` to `potentially_applicable` (D-029.3).
   */
  triggerCondition: TriggerCondition | null;
  riskTags: QuestionRiskTag[];
  evidenceGuidance: string | null;
  riskIfWeak: string | null;
  suggestedOwner: string | null;
  /** `null` when the file has no Priority column — never guessed (SaaS 156, process rows 78). */
  priority: Priority | null;
  criticality: Criticality | null;
  /** Absent from every authored file; required before GA (D-013). Never the placeholder. */
  legalControlBasis: string | null;
  recommendedFix: string | null;
  /** The workbook's `TrustStack Module` — the register a question's evidence lands in (Slice 10). Core pack only. */
  truststackModule: string | null;
  /** When N/A is allowed and what reason the assessor must give (D-029.3). */
  naRule: string;
  version: string;
  status: "draft" | "approved" | "retired";
  /** `<file>:<line>` — for error messages and content review. */
  sourceRef: string | null;
}

/** Placeholder text in the Excel `Legal / Control Basis` column — stored as null (§13.2). */
export const LEGAL_BASIS_PLACEHOLDER =
  "Mapped to DPDP Act 2023 / DPDP Rules 2025 operational readiness requirement.";

export function normaliseLegalBasis(raw: string | null | undefined): string | null {
  const value = (raw ?? "").trim();
  if (!value) return null;
  return value === LEGAL_BASIS_PLACEHOLDER ? null : value;
}

export const DEFAULT_NA_RULE =
  "May be marked Not Applicable with a written reason; excluded from the scoring denominator.";
export const MANDATORY_NA_RULE =
  "Mandatory for every organisation. Not Applicable requires a written reason and reviewer approval.";

// ---------------------------------------------------------------------------
// `Type` / `Trigger` cell — two different things in one column
// ---------------------------------------------------------------------------

const TAG_ALIASES: Readonly<Record<string, QuestionRiskTag>> = Object.freeze({
  "high-risk": "high_risk",
  "high risk": "high_risk",
  "evidence-heavy": "evidence_heavy",
  "children-linked": "children_linked",
  "ai-linked": "ai_linked",
  "marketing-linked": "marketing_linked",
  "payment-linked": "payment_linked",
  "vendor-linked": "vendor_linked",
  "reassessment trigger": "reassessment_trigger",
  reassessment: "reassessment_trigger",
  "reassessment-linked": "reassessment_trigger",
  advanced: "advanced",
  improvement: "advanced",
});

export interface TypeCell {
  applicability: Applicability;
  triggerText: string | null;
  riskTags: QuestionRiskTag[];
}

/**
 * Splits an authored `Type` / `Type / trigger` / `Trigger` cell into
 * applicability, a human-readable trigger and risk tags.
 *
 * `Mandatory if X` / `Mandatory where X` resolve to **conditional**: a question
 * that only applies when X holds is not mandatory for everyone. Core's
 * "Mandatory where vendors exist" is the same shape, and D13's own default
 * applicability agrees.
 *
 * A cell with no applicability word defaults to mandatory
 * (`docs/QUESTION_FORMAT.md`). A conditional cell whose trigger cannot be
 * mapped becomes `potentially_applicable` later, in `resolveApplicability()` —
 * this function reports only what the text says.
 */
export function parseTypeCell(raw: string | null | undefined): TypeCell {
  const cell = (raw ?? "").replace(/`/g, "").trim();
  if (!cell) return { applicability: "mandatory", triggerText: null, riskTags: [] };

  // A trigger phrase may itself contain "/" ("Conditional: multi-campus/affiliated
  // structure"), so the condition is taken whole and never split.
  const conditioned = /^(mandatory|conditional)\s*(?::|\bif\b|\bwhere\b|\bfor\b)\s*(.+)$/i.exec(cell);
  if (conditioned) {
    return { applicability: "conditional", triggerText: tidy(conditioned[2] ?? ""), riskTags: [] };
  }
  const triggerOnly = /^trigger\s*:\s*(.+)$/i.exec(cell);
  if (triggerOnly) {
    return { applicability: "conditional", triggerText: tidy(triggerOnly[1] ?? ""), riskTags: [] };
  }

  let applicability: Applicability | null = null;
  const tags = new Set<QuestionRiskTag>();
  for (const token of cell.split("/").map((t) => t.trim()).filter(Boolean)) {
    const low = token.toLowerCase();
    if (low === "mandatory") { applicability ??= "mandatory"; continue; }
    if (low === "conditional") { applicability = "conditional"; continue; }
    const tag = TAG_ALIASES[low] ?? TAG_ALIASES[low.replace(/\s+/g, " ")];
    if (tag) tags.add(tag);
  }
  return {
    applicability: applicability ?? "mandatory",
    triggerText: null,
    riskTags: QUESTION_RISK_TAGS.filter((t) => tags.has(t)),
  };
}

const tidy = (s: string) => s.replace(/\s+/g, " ").trim().replace(/[.;]$/, "");

/**
 * Final applicability. A conditional question whose condition the scope cannot
 * capture is shown as Potentially Applicable, never hidden (D-026, D-029.3).
 */
export function resolveApplicability(cell: TypeCell, triggerMapped: boolean): Applicability {
  if (cell.applicability !== "conditional") return cell.applicability;
  return triggerMapped ? "conditional" : "potentially_applicable";
}

// ---------------------------------------------------------------------------
// Markdown parsing
// ---------------------------------------------------------------------------

/** Header aliases per authored layout. First match wins. */
const HEADERS = {
  code: ["Code", "ID", "Question ID"],
  text: ["Question / Check", "Assessment question", "Question"],
  type: ["Type / trigger", "Type", "Trigger"],
  evidence: ["Evidence to verify", "Evidence to check", "Evidence Required", "Evidence"],
  riskIfWeak: ["Risk if weak", "Why / risk if weak", "Why it matters"],
  owner: ["Suggested owner", "Owner", "Primary Owner", "Default Owner"],
  priority: ["Priority"],
  domain: ["Domain"],
} as const;

const CODE_PATTERN = /^[A-Z]{2,}[A-Z0-9]*(-[A-Z0-9]+)+$/;
const HEADER_FIRST_CELLS = new Set(HEADERS.code as readonly string[]);

/** Headings that name a domain in words rather than by code (Public Sector). */
const DOMAIN_NAME_HINTS: readonly (readonly [string, DomainCode])[] = [
  ["governance", "GOV"], ["discovery", "INV"], ["inventory", "INV"],
  ["processing activit", "ROPA"], ["ropa", "ROPA"], ["purpose", "PURPOSE"],
  ["notice", "NOTICE"], ["consent and", "CONSENT"], ["consent &", "CONSENT"],
  ["data principal rights", "RIGHTS"], ["grievance", "GRIEVANCE"],
  ["retention", "RETENTION"], ["accuracy", "ACCURACY"],
  ["security safeguard", "SECURITY"], ["breach", "BREACH"], ["vendor", "VENDOR"],
  ["children", "CHILD"], ["cross-border", "CROSSBORDER"], ["sdf", "SDF_AI"],
];

/** The domain a section heading names, by code first and then by wording. */
export function domainFromHeading(line: string): DomainCode | null {
  const byCode = DOMAIN_CODES.filter((d) => new RegExp("(`|—\\s*|\\b)" + d + "(`|\\b)").test(line));
  const lastCode = byCode.at(-1);
  if (lastCode) return lastCode;
  const low = line.toLowerCase();
  const lastName = DOMAIN_NAME_HINTS.filter(([key]) => low.includes(key)).at(-1);
  return lastName ? lastName[1] : null;
}

export interface ParseOptions {
  packCode: string;
  sourceTag: SourceTag;
  /** Used in `sourceRef` and error messages. */
  fileName: string;
  version?: string;
  status?: QuestionRecord["status"];
}

export class QuestionParseError extends Error {
  constructor(public readonly sourceRef: string, message: string) {
    super(`${sourceRef}: ${message}`);
    this.name = "QuestionParseError";
  }
}

/**
 * Parses one authored Markdown file into canonical records.
 *
 * Rows are recognised by a question-code cell inside a Markdown table whose
 * header row has been seen; a `Domain` column overrides the section heading,
 * and `A / B` in that column means A is primary and B secondary (D-029.2).
 */
export function parseQuestionMarkdown(markdown: string, options: ParseOptions): QuestionRecord[] {
  const { packCode, sourceTag, fileName } = options;
  const version = options.version ?? "1.0";
  const status = options.status ?? "draft";

  const records: QuestionRecord[] = [];
  let sectionDomain: DomainCode | null = null;
  let header: string[] | null = null;

  const lines = markdown.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? "";
    const sourceRef = `${fileName}:${i + 1}`;

    if (line.startsWith("#")) {
      sectionDomain = domainFromHeading(line);
      header = null;
      continue;
    }
    if (!line.startsWith("|")) continue;

    const cells = line.replace(/^\|/, "").replace(/\|\s*$/, "").split("|")
      .map((c) => c.trim().replace(/^`|`$/g, "").trim());

    const first = cells[0] ?? "";
    if (HEADER_FIRST_CELLS.has(first)) { header = cells; continue; }
    if (!header || cells.length < 3 || !CODE_PATTERN.test(first)) continue;

    const row = new Map<string, string>();
    header.forEach((name, idx) => row.set(name, cells[idx] ?? ""));
    const pick = (aliases: readonly string[]): string | null => {
      for (const alias of aliases) {
        const value = row.get(alias);
        if (value !== undefined && value !== "" && value !== "—" && value !== "-") return value;
      }
      return null;
    };

    const [primaryDomain, ...secondaryDomains] = rowDomains(row.get(HEADERS.domain[0]) ?? "", sectionDomain);
    if (!primaryDomain) throw new QuestionParseError(sourceRef, `question ${first} resolves to no domain`);
    const questionText = pick(HEADERS.text);
    if (!questionText) throw new QuestionParseError(sourceRef, `question ${first} has no question text`);

    const typeText = pick(HEADERS.type);
    const typeCell = parseTypeCell(typeText);

    records.push({
      questionCode: first,
      questionText,
      packCode,
      sourceTag,
      domainCode: primaryDomain,
      secondaryDomainCodes: secondaryDomains,
      applicability: typeCell.applicability,
      typeText,
      triggerText: typeCell.triggerText,
      triggerCondition: null,
      riskTags: typeCell.riskTags,
      evidenceGuidance: pick(HEADERS.evidence),
      riskIfWeak: pick(HEADERS.riskIfWeak),
      suggestedOwner: pick(HEADERS.owner),
      priority: parsePriority(pick(HEADERS.priority)),
      criticality: null,
      legalControlBasis: null,
      recommendedFix: null,
      truststackModule: null,
      naRule: typeCell.applicability === "mandatory" ? MANDATORY_NA_RULE : DEFAULT_NA_RULE,
      version,
      status,
      sourceRef,
    });
  }
  return records;
}

/** `PURPOSE / INV` → primary PURPOSE, secondary INV. Falls back to the section. */
function rowDomains(cell: string, sectionDomain: DomainCode | null): DomainCode[] {
  const explicit = cell.split("/").map((c) => c.trim()).filter(isDomainCode);
  if (explicit.length > 0) return [...new Set(explicit)];
  return sectionDomain ? [sectionDomain] : [];
}

export function parsePriority(raw: string | null | undefined): Priority | null {
  const value = (raw ?? "").trim().toUpperCase();
  return (PRIORITIES as readonly string[]).includes(value) ? (value as Priority) : null;
}

// ---------------------------------------------------------------------------
// Bank-wide invariants
// ---------------------------------------------------------------------------

export class DuplicateQuestionCodeError extends Error {
  constructor(public readonly questionCode: string, public readonly refs: string[]) {
    super(`duplicate question code ${questionCode} at ${refs.join(" and ")}`);
    this.name = "DuplicateQuestionCodeError";
  }
}

/** Codes are unique across every pack, forever (`docs/QUESTION_FORMAT.md` §Adding or changing). */
export function assertUniqueQuestionCodes(records: readonly QuestionRecord[]): void {
  const seen = new Map<string, string>();
  for (const record of records) {
    const ref = record.sourceRef ?? record.packCode;
    const first = seen.get(record.questionCode);
    if (first) throw new DuplicateQuestionCodeError(record.questionCode, [first, ref]);
    seen.set(record.questionCode, ref);
  }
}

/** Every industry file must keep covering all 16 domains. */
export function missingDomains(records: readonly QuestionRecord[]): DomainCode[] {
  const covered = new Set(records.flatMap((r) => [r.domainCode, ...r.secondaryDomainCodes]));
  return DOMAIN_CODES.filter((d) => !covered.has(d));
}
