/**
 * The ROPA / Processing Activity Register (Slice 7). Pure functions, no I/O,
 * no clock — a date is always passed in.
 *
 * DPDP anchoring: the Act never says "ROPA". What it requires — a notice that
 * itemises the personal data and its purpose (s.5, Rule 3), processing limited
 * to that purpose, erasure when the purpose is served (s.8(7), Rule 8),
 * reasonable security safeguards (Rule 6) and accountability for every Data
 * Processor (s.8(2)) — cannot be shown without knowing what is processed,
 * where, and by whom. The register is how an organisation knows.
 *
 * Positioning, from the spec (Step I): a practical DPDP READINESS artefact,
 * never "a statutory GDPR-style ROPA". Nothing here says "compliant": a record
 * is Strong on COMPLETENESS, which is a statement about the register, not
 * about the processing (D-011).
 *
 * Five things here are deliberate and easy to get wrong:
 *
 * 1. **There is no oracle.** The workbook's `ROPA_Register` holds ten records
 *    as typed text — no completeness score, and a Risk Rating entered by
 *    hand. Every rule below carries its own tests; nothing here "matches the
 *    workbook".
 * 2. **Completeness is an integer.** Thirteen whole-number weights, an exact
 *    sum, integer band boundaries — in TypeScript and in SQL alike. Slice 5
 *    once banded 20.000000000000004 one level up; this model cannot.
 * 3. **"Unknown" and "To be legally reviewed" are honest, and NOT complete.**
 *    They are exactly the gap (D-026: unknown behaves as risk, never as an
 *    answer).
 * 4. **Risk is a derived FLOOR.** An assessor may raise it, never lower it —
 *    the same direction as the evidence cap (D-039).
 * 5. **The register never moves the readiness score.** The `ROPA` domain is
 *    scored from answered, evidenced QUESTIONS (D-035). A ROPA export is good
 *    EVIDENCE for those questions; that is the route, through a reviewer.
 *
 * Mirrored in SQL by `…_ropa/migration.sql`, which derives and CHECKs every
 * stored number; `apps/web/tests/unit/ropa-register.test.ts` parses that
 * migration and fails if the two ever differ (D-053).
 */

import { questionPriority, type GapPriority, type GapSeverity } from "./engine.js";
import { isCalendarDate } from "./gaps.js";
import { DEFAULT_RISK_TRIGGER_CONFIG, TRI_STATES, type TriState } from "./scope.js";

export class RopaInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RopaInputError";
  }
}

// ---------------------------------------------------------------------------
// The record
// ---------------------------------------------------------------------------

/**
 * What a rule needs to know about one record. The workbook's 24 columns, plus
 * the links (counted — the database keeps the counts) and the few fields a
 * completeness area or a risk factor needs (D-061).
 */
export interface RopaRecordFacts {
  name: string | null;
  departmentId: string | null;
  departmentText: string | null;
  ownerUserId: string | null;
  dataPrincipalTypes: string | null;
  dataCategories: string | null;
  estimatedDataPrincipals: number | null;
  purpose: string | null;
  legalBasisNote: string | null;
  collectionSource: string | null;
  systemsText: string | null;
  systemLinkCount: number;
  vendorsText: string | null;
  vendorLinkCount: number;
  noticeLinked: string | null;
  consentLinked: string | null;
  retentionRule: string | null;
  securitySafeguards: string | null;
  childrenData: TriState;
  crossBorder: TriState;
  aiProcessing: TriState;
  highRiskDocuments: TriState;
  /** Stored artefacts linked to the record (`evidence_links`, type `ropa_record`). */
  evidenceCount: number;
  /** `YYYY-MM-DD`, or null. */
  nextReviewAt: string | null;
  // --- D-065: the DPDP structure ---
  /** The ground the activity relies on (s.4, s.6, s.7, s.17), or null while undecided. */
  lawfulBasis: RopaLawfulBasis | null;
  /** Verifiable parental consent obtained (Rule 10)? */
  childParentalConsent: TriState;
  /** A Fourth Schedule exemption claimed (Rule 12), or null. */
  childExemption: RopaChildExemption | null;
  /** Tracking, behavioural monitoring or targeted advertising of children (s.9(3))? */
  childTracking: TriState;
  /** What ends the retention (s.8(7), Rule 8), or null while undecided. */
  retentionTrigger: RopaRetentionTrigger | null;
  /** The law that requires keeping the data, when that is the trigger. */
  retentionLaw: string | null;
  /** The Rule 6(1) safeguards confirmed in place. */
  safeguards: readonly RopaSafeguard[];
  /** Linked Data Processors without a contract or without DPDP clauses (s.8(2), Rule 6(1)(f)) — counted by the database. */
  vendorContractGaps: number;
}

// ---------------------------------------------------------------------------
// The DPDP structure of a record (D-065) — vocabularies as data
// ---------------------------------------------------------------------------

/**
 * The ground an activity relies on. DPDP has two (s.4): consent, or one of
 * nine "legitimate uses" (s.7); s.17 exempts some processing outright. The
 * register records the organisation's position for counsel to confirm — it
 * is a note for legal review, never a legal opinion (D-011).
 */
export const ROPA_LAWFUL_BASES = Object.freeze([
  { code: "consent", section: "s.6", label: "Consent of the person" },
  // Slice 10.5 B3 (F3.5, D-117): the Act's own test — a specified purpose, data given voluntarily, and no word that she does not consent.
  { code: "voluntary", section: "s.7(a)", label: "A specified purpose the person voluntarily gave the data for, and has not said they do not consent to its use" },
  { code: "state_benefit", section: "s.7(b)", label: "A government subsidy, benefit, service, certificate or licence" },
  { code: "state_function", section: "s.7(c)", label: "A government function under law" },
  { code: "legal_obligation", section: "s.7(d)", label: "A legal duty to disclose information to the government" },
  { code: "court_order", section: "s.7(e)", label: "Complying with a court judgment, decree or order" },
  { code: "medical_emergency", section: "s.7(f)", label: "A medical emergency" },
  { code: "public_health", section: "s.7(g)", label: "Health services during an epidemic or public-health threat" },
  { code: "disaster", section: "s.7(h)", label: "Safety or help during a disaster or a breakdown of public order" },
  { code: "employment", section: "s.7(i)", label: "Employment purposes" },
  { code: "exempt", section: "s.17", label: "Exempt under s.17 (e.g. legal claims, offences)" },
] as const);
export type RopaLawfulBasis = (typeof ROPA_LAWFUL_BASES)[number]["code"];
export const ROPA_LAWFUL_BASIS_CODES = ROPA_LAWFUL_BASES.map((b) => b.code) as readonly RopaLawfulBasis[];

/**
 * A notice (s.5, Rule 3) accompanies a request for CONSENT; a s.7(b) benefit
 * needs the Second Schedule's intimation. Undecided counts as required —
 * unknown behaves as risk (D-026). Other legitimate uses need neither.
 */
export const ROPA_NOTICE_REQUIRED_BASES = ["consent", "state_benefit"] as const satisfies readonly RopaLawfulBasis[];
export const ROPA_CONSENT_REQUIRED_BASES = ["consent"] as const satisfies readonly RopaLawfulBasis[];

export function noticeRequired(basis: RopaLawfulBasis | null): boolean {
  return basis === null || (ROPA_NOTICE_REQUIRED_BASES as readonly string[]).includes(basis);
}
export function consentRequired(basis: RopaLawfulBasis | null): boolean {
  return basis === null || (ROPA_CONSENT_REQUIRED_BASES as readonly string[]).includes(basis);
}

/** The Fourth Schedule's exemptions from s.9(1) and s.9(3) (Rule 12) — each only within its own conditions. */
export const ROPA_CHILD_EXEMPTIONS = Object.freeze([
  { code: "clinical", part: "A1", label: "Health services by a clinical establishment or healthcare professional" },
  { code: "allied_health", part: "A2", label: "An allied healthcare professional supporting a treatment plan" },
  { code: "education", part: "A3", label: "An educational institution — tracking for its educational activities or children's safety" },
  { code: "creche", part: "A4", label: "A crèche or day-care centre — tracking for children's safety" },
  { code: "school_transport", part: "A5", label: "School or crèche transport — location tracking during travel" },
  { code: "child_law_function", part: "B1", label: "A function under law in the child's interests" },
  { code: "child_state_benefit", part: "B2", label: "A subsidy, benefit or service for the child under law, policy or public funds" },
  { code: "email_account", part: "B3", label: "Creating an email account, used only for email" },
  { code: "location_safety", part: "B4", label: "Real-time location for the child's safety" },
  { code: "harmful_content", part: "B5", label: "Keeping harmful information, services or adverts away from the child" },
  { code: "age_check", part: "B6", label: "Confirming the person is not a child" },
] as const);
export type RopaChildExemption = (typeof ROPA_CHILD_EXEMPTIONS)[number]["code"];
export const ROPA_CHILD_EXEMPTION_CODES = ROPA_CHILD_EXEMPTIONS.map((e) => e.code) as readonly RopaChildExemption[];

/** What ends the retention (s.8(7), s.8(8), Rule 8). */
export const ROPA_RETENTION_TRIGGERS = Object.freeze([
  { code: "purpose_served", label: "Erased once the purpose is served" },
  { code: "consent_withdrawn", label: "Erased when consent is withdrawn (or the purpose is served, if sooner)" },
  { code: "law_requires", label: "Kept as long as a named law requires, then erased" },
  { code: "third_schedule", label: "Three years after the person's last contact (Third Schedule platforms; 48 hours' notice before erasure)" },
] as const);
export type RopaRetentionTrigger = (typeof ROPA_RETENTION_TRIGGERS)[number]["code"];
export const ROPA_RETENTION_TRIGGER_CODES = ROPA_RETENTION_TRIGGERS.map((t) => t.code) as readonly RopaRetentionTrigger[];

/** Rule 6(1)'s minimum safeguards. (f), the processor contract clause, is read from the linked vendors instead. */
export const ROPA_SAFEGUARDS = Object.freeze([
  { code: "encryption", clause: "6(1)(a)", label: "Encryption, masking, obfuscation or tokenisation" },
  { code: "access_control", clause: "6(1)(b)", label: "Access control on the systems used" },
  { code: "logging", clause: "6(1)(c)", label: "Access logs, monitoring and review" },
  { code: "backups", clause: "6(1)(d)", label: "Backups and continuity if data is lost or compromised" },
  { code: "log_retention", clause: "6(1)(e), 8(3)", label: "Logs and processing records kept for at least one year" },
  { code: "organisational", clause: "6(1)(g)", label: "Organisational measures (policies, training, responsibilities)" },
] as const);
export type RopaSafeguard = (typeof ROPA_SAFEGUARDS)[number]["code"];
export const ROPA_SAFEGUARD_CODES = ROPA_SAFEGUARDS.map((x) => x.code) as readonly RopaSafeguard[];

// ---------------------------------------------------------------------------
// When is a text field "complete"?
// ---------------------------------------------------------------------------

/**
 * Phrases that mark a value as unresolved. A field containing any of them is
 * an honest "we do not know yet" — and so incomplete, and a gap (D-026).
 *
 * A reviewed LIST, matched as substrings of the lower-cased value — never NLP
 * (the D-033 rule for trigger phrases, applied here). Mirrored in SQL by
 * `app.ropa_unresolved_phrases()`.
 */
export const ROPA_UNRESOLVED_PHRASES = [
  "unknown",
  "to be reviewed",
  "to be legally reviewed",
  "review needed",
  "needs review",
  "to be confirmed",
  "to be defined",
  "not defined",
  "not known",
  "tbc",
  "tbd",
] as const;

/** Whole values that say nothing at all. */
export const ROPA_PLACEHOLDER_VALUES = ["-", "—", "?"] as const;

/** A value that is a to-do rather than a rule: "Define retention for chat logs". */
export const ROPA_TODO_PREFIX = "define ";

function normalise(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Is this text field complete? Non-blank, not a placeholder, not a to-do, and
 * not marked unresolved. "Unknown" and "To be legally reviewed" are NOT
 * complete — they are honest, and they are exactly the gap.
 */
export function isResolvedText(value: string | null | undefined): boolean {
  if (value === null || value === undefined) return false;
  const v = normalise(value);
  if (v === "") return false;
  if ((ROPA_PLACEHOLDER_VALUES as readonly string[]).includes(v)) return false;
  if (v.startsWith(ROPA_TODO_PREFIX)) return false;
  return !ROPA_UNRESOLVED_PHRASES.some((phrase) => v.includes(phrase));
}

/** "None", "No", "N/A" … — a complete answer that says no Data Processor is involved. */
export const ROPA_NO_VENDOR_VALUES = [
  "none",
  "no",
  "nil",
  "n/a",
  "na",
  "not applicable",
  "no vendor",
  "no vendors",
  "no processor",
  "no processors",
] as const;

/** How many items a free-text list names: split on commas, semicolons and new lines. */
export function listItemCount(value: string | null | undefined): number {
  if (!value) return 0;
  return value.split(/[,;\n]/).filter((item) => item.trim() !== "").length;
}

/** Does the record involve a Data Processor at all — by link, or by naming one? */
export function vendorInvolved(facts: Pick<RopaRecordFacts, "vendorsText" | "vendorLinkCount">): boolean {
  if (facts.vendorLinkCount > 0) return true;
  return isResolvedText(facts.vendorsText) && !(ROPA_NO_VENDOR_VALUES as readonly string[]).includes(normalise(facts.vendorsText!));
}

/** How many Data Processors: the linked ones, or the ones the text names, whichever is more. */
export function vendorCount(facts: Pick<RopaRecordFacts, "vendorsText" | "vendorLinkCount">): number {
  const named =
    isResolvedText(facts.vendorsText) && !(ROPA_NO_VENDOR_VALUES as readonly string[]).includes(normalise(facts.vendorsText!))
      ? listItemCount(facts.vendorsText)
      : 0;
  return Math.max(facts.vendorLinkCount, named);
}

// ---------------------------------------------------------------------------
// Completeness /100 — the spec's thirteen areas (Step I)
// ---------------------------------------------------------------------------

export const ROPA_AREA_CODES = [
  "identity",
  "department_owner",
  "data_principals",
  "data_categories",
  "purpose_basis",
  "collection_source",
  "systems",
  "vendors",
  "notice_consent",
  "retention",
  "security",
  "risk_review",
  "evidence",
] as const;
export type RopaAreaCode = (typeof ROPA_AREA_CODES)[number];

export interface RopaArea {
  code: RopaAreaCode;
  label: string;
  weight: number;
  /** What makes the area complete, in words the record form shows. */
  rule: string;
  complete: (facts: RopaRecordFacts) => boolean;
}

/**
 * The spec's thirteen areas and weights — the ONLY source; the workbook has
 * no completeness score. Integer weights, total exactly 100 (asserted below,
 * in a test, and in SQL at apply time).
 *
 * A text-only link to a system or vendor counts as complete: the score is a
 * sum of whole weights with no partial credit, and linking is what the
 * vendor-mapping GAP asks for instead (D-061).
 */
export const ROPA_COMPLETENESS_AREAS: readonly RopaArea[] = Object.freeze([
  {
    code: "identity",
    label: "Processing activity identity",
    weight: 8,
    rule: "The activity is named.",
    complete: (f) => isResolvedText(f.name),
  },
  {
    code: "department_owner",
    label: "Department and owner",
    weight: 8,
    rule: "A department is recorded and a named person owns the activity.",
    complete: (f) => (f.departmentId !== null || isResolvedText(f.departmentText)) && f.ownerUserId !== null,
  },
  {
    code: "data_principals",
    label: "Data Principal type",
    weight: 8,
    rule: "Whose personal data it is.",
    complete: (f) => isResolvedText(f.dataPrincipalTypes),
  },
  {
    code: "data_categories",
    label: "Personal data categories",
    weight: 10,
    rule: "Which personal data is processed.",
    complete: (f) => isResolvedText(f.dataCategories),
  },
  {
    code: "purpose_basis",
    label: "Purpose and lawful ground",
    weight: 10,
    rule: "The purpose, and the ground it relies on — consent or a legitimate use.",
    complete: (f) => isResolvedText(f.purpose) && f.lawfulBasis !== null,
  },
  {
    code: "collection_source",
    label: "Collection source",
    weight: 6,
    rule: "Where the data comes from.",
    complete: (f) => isResolvedText(f.collectionSource),
  },
  {
    code: "systems",
    label: "Systems involved",
    weight: 8,
    rule: "The systems that store or use it — named, or linked to the system register.",
    complete: (f) => f.systemLinkCount > 0 || isResolvedText(f.systemsText),
  },
  {
    code: "vendors",
    label: "Vendors/processors involved",
    weight: 8,
    rule: "The Data Processors involved — or an explicit \"None\".",
    complete: (f) => f.vendorLinkCount > 0 || isResolvedText(f.vendorsText),
  },
  {
    code: "notice_consent",
    label: "Notice/consent linkage",
    weight: 8,
    rule: "The notice that covers it and how consent is captured — where the ground needs them.",
    complete: (f) =>
      (!noticeRequired(f.lawfulBasis) || isResolvedText(f.noticeLinked)) &&
      (!consentRequired(f.lawfulBasis) || isResolvedText(f.consentLinked)),
  },
  {
    code: "retention",
    label: "Retention and erasure",
    weight: 8,
    rule: "A retention rule, what ends it — and the law, when a law requires keeping the data.",
    complete: (f) =>
      isResolvedText(f.retentionRule) &&
      f.retentionTrigger !== null &&
      (f.retentionTrigger !== "law_requires" || isResolvedText(f.retentionLaw)),
  },
  {
    code: "security",
    label: "Security safeguards",
    weight: 8,
    rule: "The safeguards in place — ticked against Rule 6, or described.",
    complete: (f) => f.safeguards.length > 0 || isResolvedText(f.securitySafeguards),
  },
  {
    code: "risk_review",
    label: "Risk rating and review date",
    weight: 6,
    rule: "A next review date. The risk rating is always derived.",
    complete: (f) => f.nextReviewAt !== null,
  },
  {
    code: "evidence",
    label: "Evidence linkage",
    weight: 4,
    rule: "At least one stored artefact is attached.",
    complete: (f) => f.evidenceCount > 0,
  },
]);

export const ROPA_COMPLETENESS_TOTAL = 100;

/** Throws unless the thirteen weights are whole numbers totalling exactly 100. */
export function assertRopaWeightsTotal(areas: readonly Pick<RopaArea, "weight">[] = ROPA_COMPLETENESS_AREAS): void {
  if (areas.some((a) => !Number.isInteger(a.weight) || a.weight <= 0)) {
    throw new RopaInputError("ROPA completeness weights must be positive whole numbers");
  }
  const total = areas.reduce((n, a) => n + a.weight, 0);
  if (total !== ROPA_COMPLETENESS_TOTAL) {
    throw new RopaInputError(`ROPA_COMPLETENESS_TOTAL_INVALID: the areas total ${total}, expected 100`);
  }
}
assertRopaWeightsTotal();

/**
 * The spec's four bands. Each boundary belongs to the LOWER band, as
 * `maturityBand` does: 30 is Incomplete, 31 is Basic.
 */
export const ROPA_BANDS = Object.freeze([
  { band: "incomplete", label: "Incomplete", maxScore: 30, meaning: "Not usable for readiness." },
  { band: "basic", label: "Basic", maxScore: 60, meaning: "Initial visibility only." },
  { band: "usable", label: "Usable", maxScore: 80, meaning: "Good for assessment and review." },
  { band: "strong", label: "Strong", maxScore: 100, meaning: "Evidence-backed, review-ready." },
] as const);
export type RopaBand = (typeof ROPA_BANDS)[number]["band"];
export const ROPA_BAND_CODES = ROPA_BANDS.map((b) => b.band) as readonly RopaBand[];

export function ropaBand(score: number): RopaBand {
  if (!Number.isInteger(score) || score < 0 || score > 100) {
    throw new RopaInputError(`completeness must be an integer 0–100 (got ${score})`);
  }
  return ROPA_BANDS.find((b) => score <= b.maxScore)!.band;
}

export interface RopaCompleteness {
  score: number;
  band: RopaBand;
  /** The areas still missing, in the model's order — the UI and the gap generator read the same list. */
  missing: RopaAreaCode[];
}

export function ropaCompleteness(facts: RopaRecordFacts): RopaCompleteness {
  const missing = ROPA_COMPLETENESS_AREAS.filter((a) => !a.complete(facts)).map((a) => a.code);
  const score = ROPA_COMPLETENESS_AREAS.filter((a) => !missing.includes(a.code)).reduce((n, a) => n + a.weight, 0);
  return { score, band: ropaBand(score), missing };
}

/** "Usable" is the floor for approval: an Incomplete or Basic record is not review-ready. */
export const ROPA_APPROVAL_MIN_SCORE = 61;

// ---------------------------------------------------------------------------
// Risk — a derived floor an assessor may raise and never lower (D-061)
// ---------------------------------------------------------------------------

export const ROPA_RISK_RATINGS = ["low", "medium", "high", "critical"] as const;
export type RopaRiskRating = (typeof ROPA_RISK_RATINGS)[number];

export const ROPA_RISK_LABEL: Readonly<Record<RopaRiskRating, string>> = Object.freeze({
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
});

/**
 * The spec's ten risk factors, as points. A tri-state factor scores more for
 * YES than for UNKNOWN — and unknown still scores, because unknown behaves as
 * risk, never as "no" (D-026). Cross-border fires on UNKNOWN only: a known
 * transfer is assessed by questions, not flagged as unknown (D-026's rule for
 * the scope tag).
 */
export const ROPA_RISK_FACTORS = Object.freeze([
  { code: "children_data", points: 3, label: "Children's data involved" },
  { code: "children_data_unknown", points: 1, label: "Not known whether children's data is involved" },
  { code: "large_scale", points: 2, label: "A large number of Data Principals" },
  { code: "high_risk_documents", points: 2, label: "High-risk documents" },
  { code: "high_risk_documents_unknown", points: 1, label: "Not known whether high-risk documents are involved" },
  { code: "multiple_vendors", points: 1, label: "More than one Data Processor" },
  { code: "cross_border_unknown", points: 1, label: "Where the data is held or sent is not known" },
  { code: "ai_processing", points: 2, label: "AI or automated processing" },
  { code: "ai_processing_unknown", points: 1, label: "Not known whether AI or automated processing is involved" },
  { code: "no_notice", points: 1, label: "No notice linked" },
  { code: "no_retention", points: 1, label: "No retention rule" },
  { code: "no_security_evidence", points: 1, label: "No evidence attached" },
  { code: "no_owner_or_review", points: 1, label: "No owner or no review date" },
] as const);
export type RopaRiskFactor = (typeof ROPA_RISK_FACTORS)[number]["code"];
export const ROPA_RISK_FACTOR_CODES = ROPA_RISK_FACTORS.map((f) => f.code) as readonly RopaRiskFactor[];

/**
 * The large-scale trigger is the scope wizard's (D-028), so a record and its
 * organisation never disagree about what "large" means. Internal, never
 * statutory.
 */
export const ROPA_LARGE_SCALE_THRESHOLD = DEFAULT_RISK_TRIGGER_CONFIG.largeScaleProcessingThreshold;

/**
 * The version of the risk rules (D-067). Every stored rating is stamped with
 * it. Bump it — and re-derive every row in the same migration — whenever a
 * factor, a point value or a threshold changes, so a rating a client has
 * reported can always be traced to the rules that produced it.
 */
export const ROPA_RISK_MODEL_VERSION = "1.0.0";

/** Points → rating. Each boundary belongs to the LOWER rating: 2 is Low, 3 is Medium. */
export const ROPA_RISK_BANDS = Object.freeze([
  { rating: "low", maxPoints: 2 },
  { rating: "medium", maxPoints: 5 },
  { rating: "high", maxPoints: 8 },
  { rating: "critical", maxPoints: Number.POSITIVE_INFINITY },
] as const satisfies readonly { rating: RopaRiskRating; maxPoints: number }[]);

export function ropaRiskFactors(facts: RopaRecordFacts): RopaRiskFactor[] {
  const out: RopaRiskFactor[] = [];
  if (facts.childrenData === "yes") out.push("children_data");
  if (facts.childrenData === "unknown") out.push("children_data_unknown");
  if (facts.estimatedDataPrincipals !== null && facts.estimatedDataPrincipals >= ROPA_LARGE_SCALE_THRESHOLD) {
    out.push("large_scale");
  }
  if (facts.highRiskDocuments === "yes") out.push("high_risk_documents");
  if (facts.highRiskDocuments === "unknown") out.push("high_risk_documents_unknown");
  if (vendorCount(facts) >= 2) out.push("multiple_vendors");
  if (facts.crossBorder === "unknown") out.push("cross_border_unknown");
  if (facts.aiProcessing === "yes") out.push("ai_processing");
  if (facts.aiProcessing === "unknown") out.push("ai_processing_unknown");
  if (noticeRequired(facts.lawfulBasis) && !isResolvedText(facts.noticeLinked)) out.push("no_notice");
  if (!isResolvedText(facts.retentionRule)) out.push("no_retention");
  if (facts.evidenceCount === 0) out.push("no_security_evidence");
  if (facts.ownerUserId === null || facts.nextReviewAt === null) out.push("no_owner_or_review");
  return out;
}

export function ropaRiskPoints(factors: readonly RopaRiskFactor[]): number {
  return factors.reduce((n, code) => {
    const factor = ROPA_RISK_FACTORS.find((f) => f.code === code);
    if (!factor) throw new RopaInputError(`unknown ROPA risk factor ${String(code)}`);
    return n + factor.points;
  }, 0);
}

export function ropaRiskRating(points: number): RopaRiskRating {
  if (!Number.isInteger(points) || points < 0) throw new RopaInputError(`risk points must be a whole number ≥ 0 (got ${points})`);
  return ROPA_RISK_BANDS.find((b) => points <= b.maxPoints)!.rating;
}

export const ropaRiskRank = (rating: RopaRiskRating): number => ROPA_RISK_RATINGS.indexOf(rating);

export function isRopaRiskRating(value: string): value is RopaRiskRating {
  return (ROPA_RISK_RATINGS as readonly string[]).includes(value);
}

/** May an assessor set this rating? Only at or above the derived floor. */
export function assessorMayRate(derived: RopaRiskRating, assessor: RopaRiskRating): boolean {
  return ropaRiskRank(assessor) >= ropaRiskRank(derived);
}

export interface RopaRisk {
  factors: RopaRiskFactor[];
  points: number;
  derived: RopaRiskRating;
  /** The assessor's rating, kept only when it RAISES the derived one. */
  assessor: RopaRiskRating | null;
  /** What every screen, export and report shows: the higher of the two. */
  rating: RopaRiskRating;
}

export function ropaRisk(facts: RopaRecordFacts, assessor: RopaRiskRating | null = null): RopaRisk {
  const factors = ropaRiskFactors(facts);
  const points = ropaRiskPoints(factors);
  const derived = ropaRiskRating(points);
  const raises = assessor !== null && ropaRiskRank(assessor) > ropaRiskRank(derived);
  return { factors, points, derived, assessor: raises ? assessor : null, rating: raises ? assessor! : derived };
}

// ---------------------------------------------------------------------------
// The lifecycle
// ---------------------------------------------------------------------------

/**
 * The spec lists nine statuses; the pilot needs four (D-061). "Needs
 * clarification" is a return to Draft; "Reopened" is Approved → Draft, which
 * starts a new version.
 */
export const ROPA_STATUSES = ["draft", "in_review", "approved", "archived"] as const;
export type RopaStatus = (typeof ROPA_STATUSES)[number];

export const ROPA_STATUS_LABEL: Readonly<Record<RopaStatus, string>> = Object.freeze({
  draft: "Draft",
  in_review: "In review",
  approved: "Approved",
  archived: "Archived",
});

/**
 * The legal moves, as data — the API and the database enforce the same graph.
 * Approval happens only from review. An approved record is read-only until it
 * is reopened to Draft; an archived one until it is restored to Draft.
 */
export const ROPA_TRANSITIONS: Readonly<Record<RopaStatus, readonly RopaStatus[]>> = Object.freeze({
  draft: ["in_review", "archived"],
  in_review: ["draft", "approved", "archived"],
  approved: ["draft", "archived"],
  archived: ["draft"],
});

export function canRopaTransition(from: RopaStatus, to: RopaStatus): boolean {
  return ROPA_TRANSITIONS[from]?.includes(to) ?? false;
}

/** Content may change only while the record is being worked on. */
export const ROPA_EDITABLE_STATUSES = ["draft", "in_review"] as const satisfies readonly RopaStatus[];

export interface ApprovalAttempt {
  ownerUserId: string | null;
  approverUserId: string;
  /** Does the approver hold `evidence.review`? The people already trusted to grade evidence (D-056). */
  approverCanReview: boolean;
  completenessScore: number;
}

export type ApprovalRefusal = "no_owner" | "self_approval" | "not_a_reviewer" | "incomplete";
export type ApprovalDecision = { allowed: true } | { allowed: false; reason: ApprovalRefusal };

/**
 * May this record be approved? Two people, always (D-043, D-056): the
 * approver is a reviewer and is not the record's owner; the record has an
 * owner; and it is at least Usable.
 */
export function approvalDecision(attempt: ApprovalAttempt): ApprovalDecision {
  if (attempt.ownerUserId === null) return { allowed: false, reason: "no_owner" };
  if (!attempt.approverCanReview) return { allowed: false, reason: "not_a_reviewer" };
  if (attempt.approverUserId === attempt.ownerUserId) return { allowed: false, reason: "self_approval" };
  if (attempt.completenessScore < ROPA_APPROVAL_MIN_SCORE) return { allowed: false, reason: "incomplete" };
  return { allowed: true };
}

export const APPROVAL_REFUSAL_MESSAGE: Readonly<Record<ApprovalRefusal, string>> = Object.freeze({
  no_owner: "Assign an owner before approving this record.",
  not_a_reviewer: "Only a reviewer can approve a processing record.",
  self_approval: "The record's owner cannot approve it — another reviewer must.",
  incomplete: "A record must be at least Usable (61/100) before it can be approved.",
});

// ---------------------------------------------------------------------------
// ROPA-driven gaps — the spec's table of twelve, as data
// ---------------------------------------------------------------------------

/**
 * Severities are this module's own ladder (D-060): a ROPA gap has no adjusted
 * score, so it is NEVER `questionSeverity()`. Priority and due dates then
 * follow the shared tables, so ROPA actions sit on the same 30/60/90 roadmap.
 */
export const ROPA_GAP_RULES = Object.freeze([
  { code: "no_records", severity: "critical", label: "No processing records", fix: "Record the organisation's main processing activities in the register." },
  { code: "no_owner", severity: "high", label: "No owner", fix: "Assign a named owner who is accountable for this processing activity." },
  { code: "categories_missing", severity: "high", label: "Personal data categories missing", fix: "List the personal data this activity processes." },
  { code: "purpose_missing", severity: "high", label: "Purpose or lawful ground undecided", fix: "State the purpose, and choose the ground it relies on — consent or a legitimate use — for counsel to confirm." },
  { code: "vendor_unmapped", severity: "medium", label: "Vendor not mapped", fix: "Link the Data Processors involved to the vendor register." },
  { code: "processor_contract_missing", severity: "high", label: "Processor without a valid contract", fix: "Put a contract with DPDP and security clauses in place with each linked Data Processor (s.8(2), Rule 6(1)(f))." },
  { code: "notice_missing", severity: "high", label: "No notice linked", fix: "Link the notice that itemises this data and its purpose (s.5, Rule 3)." },
  { code: "consent_missing", severity: "medium", label: "Consent capture not recorded", fix: "Record how consent is captured and how it can be withdrawn as easily as it was given." },
  { code: "retention_missing", severity: "high", label: "Retention or erasure undecided", fix: "Record how long the data is kept, what ends it, and the law if one requires keeping it (s.8(7), Rule 8)." },
  { code: "safeguards_missing", severity: "high", label: "No safeguards recorded", fix: "Record the security safeguards that protect this data." },
  { code: "rule6_unconfirmed", severity: "medium", label: "Rule 6 minimum safeguards not confirmed", fix: "Confirm each Rule 6 minimum safeguard is in place — encryption, access control, logs, backups, one-year log retention, organisational measures." },
  { code: "child_consent_missing", severity: "critical", label: "No verifiable parental consent", fix: "Obtain verifiable consent of a parent before processing a child's data (s.9(1), Rule 10), or record the Fourth Schedule exemption that applies." },
  { code: "child_tracking", severity: "critical", label: "Children may be tracked or targeted", fix: "Stop tracking, behavioural monitoring and targeted advertising of children (s.9(3)), or record the Fourth Schedule exemption that applies." },
  { code: "ai_unreviewed", severity: "high", label: "AI processing not reviewed", fix: "Review the AI or automated processing and approve the record." },
  { code: "review_overdue", severity: "medium", label: "Review overdue", fix: "Review the record and set its next review date." },
] as const satisfies readonly { code: string; severity: GapSeverity; label: string; fix: string }[]);
export type RopaGapCode = (typeof ROPA_GAP_RULES)[number]["code"];
export const ROPA_GAP_CODES = ROPA_GAP_RULES.map((r) => r.code) as readonly RopaGapCode[];

export function ropaGapRule(code: RopaGapCode) {
  const rule = ROPA_GAP_RULES.find((r) => r.code === code);
  if (!rule) throw new RopaInputError(`unknown ROPA gap ${String(code)}`);
  return rule;
}

export interface RopaRecordForGaps extends RopaRecordFacts {
  id: string;
  status: RopaStatus;
}

export interface DerivedRopaGap {
  /** null only for `no_records`, which is about the organisation. */
  recordId: string | null;
  code: RopaGapCode;
  severity: GapSeverity;
  priority: GapPriority;
}

/** The gaps one record opens today (`YYYY-MM-DD`, the date in India — D-055). */
export function ropaRecordGaps(record: RopaRecordForGaps, today: string): RopaGapCode[] {
  if (!isCalendarDate(today)) throw new RopaInputError(`today must be YYYY-MM-DD (got ${today})`);
  if (record.status === "archived") return [];
  const { missing } = ropaCompleteness(record);
  const codes: RopaGapCode[] = [];
  if (record.ownerUserId === null) codes.push("no_owner");
  if (missing.includes("data_categories")) codes.push("categories_missing");
  if (missing.includes("purpose_basis")) codes.push("purpose_missing");
  if (vendorInvolved(record) && record.vendorLinkCount === 0) codes.push("vendor_unmapped");
  if (record.vendorContractGaps > 0) codes.push("processor_contract_missing");
  if (noticeRequired(record.lawfulBasis) && !isResolvedText(record.noticeLinked)) codes.push("notice_missing");
  if (consentRequired(record.lawfulBasis) && !isResolvedText(record.consentLinked)) codes.push("consent_missing");
  if (missing.includes("retention")) codes.push("retention_missing");
  if (missing.includes("security")) codes.push("safeguards_missing");
  else if (!ROPA_SAFEGUARD_CODES.every((c) => record.safeguards.includes(c))) codes.push("rule6_unconfirmed");
  // Children (s.9, Rules 10–12): an exemption lifts both duties, within its own conditions.
  const children = record.childrenData !== "no" && record.childExemption === null;
  if (children && record.childParentalConsent !== "yes") codes.push("child_consent_missing");
  if (children && record.childTracking !== "no") codes.push("child_tracking");
  if (record.aiProcessing !== "no" && record.status !== "approved") codes.push("ai_unreviewed");
  // A due date of today is not overdue (the roadmap's rule).
  if (record.nextReviewAt === null || record.nextReviewAt < today) codes.push("review_overdue");
  return codes;
}

/** Every gap the register opens: per record, plus `no_records` for an empty (or all-archived) register. */
export function deriveRopaGaps(records: readonly RopaRecordForGaps[], today: string): DerivedRopaGap[] {
  const live = records.filter((r) => r.status !== "archived");
  const pairs: { recordId: string | null; code: RopaGapCode }[] =
    live.length === 0
      ? [{ recordId: null, code: "no_records" }]
      : live.flatMap((r) => ropaRecordGaps(r, today).map((code) => ({ recordId: r.id, code })));
  return pairs.map(({ recordId, code }) => {
    const severity = ropaGapRule(code).severity as GapSeverity;
    return { recordId, code, severity, priority: questionPriority(severity) };
  });
}

// ---------------------------------------------------------------------------
// Import — column mapping and row validation (the parser itself is outside core)
// ---------------------------------------------------------------------------

export const ROPA_IMPORT_FIELDS = [
  "recordCode",
  "name",
  "description",
  "departmentText",
  "dataPrincipalTypes",
  "dataCategories",
  "estimatedDataPrincipals",
  "purpose",
  "legalBasisNote",
  "collectionSource",
  "systemsText",
  "vendorsText",
  "sharing",
  "retentionRule",
  "securitySafeguards",
  "noticeLinked",
  "consentLinked",
  "rightsWorkflow",
  "grievanceLinked",
  "childrenData",
  "crossBorder",
  "aiProcessing",
  "highRiskDocuments",
  "evidenceNote",
  "riskRating",
  "lastReviewedAt",
  "nextReviewAt",
  // D-065 — optional; most spreadsheets will not have them yet.
  "lawfulBasis",
  "retentionTrigger",
  "retentionLaw",
] as const;
export type RopaImportField = (typeof ROPA_IMPORT_FIELDS)[number];

/**
 * Header NAMES and their aliases — the `questions.ts` HEADERS pattern. The
 * first alias of each is the workbook's own column (`ROPA_Register`, all 24).
 * Matching ignores case, spaces and punctuation, and is exact otherwise.
 */
export const ROPA_IMPORT_HEADERS: Readonly<Record<RopaImportField, readonly string[]>> = Object.freeze({
  recordCode: ["ROPA ID", "Record ID", "Record Code", "ID"],
  name: ["Processing Activity", "Processing Activity Name", "Activity", "Name"],
  description: ["Description"],
  departmentText: ["Department / Owner", "Department", "Process Owner"],
  dataPrincipalTypes: ["Data Principal Type", "Data Principal Types", "Data Principals"],
  dataCategories: ["Personal Data Categories", "Data Categories", "Personal Data"],
  estimatedDataPrincipals: ["Estimated Data Principals", "Estimated Data Volume", "Volume"],
  purpose: ["Purpose", "Purpose of Processing"],
  legalBasisNote: ["DPDP Basis / Legal Review", "DPDP Basis", "Legal Basis", "Basis"],
  collectionSource: ["Collection Source", "Source"],
  systemsText: ["System(s)", "Systems", "System"],
  vendorsText: ["Processor / Vendor", "Processors", "Vendors", "Vendor", "Processor"],
  sharing: ["Sharing / Disclosure", "Sharing", "Disclosure"],
  retentionRule: ["Retention Rule", "Retention"],
  securitySafeguards: ["Security Safeguards", "Safeguards"],
  noticeLinked: ["Notice Linked", "Notice"],
  consentLinked: ["Consent Linked", "Consent"],
  rightsWorkflow: ["Rights Workflow", "Rights"],
  grievanceLinked: ["Grievance Linked", "Grievance"],
  childrenData: ["Children Data?", "Children Data", "Children's Data"],
  crossBorder: ["Cross-Border?", "Cross-Border", "Cross Border"],
  aiProcessing: ["AI / Automated?", "AI / Automated", "AI"],
  highRiskDocuments: ["High-risk Documents?", "High-risk Documents"],
  evidenceNote: ["Evidence"],
  riskRating: ["Risk Rating", "Risk"],
  lastReviewedAt: ["Last Reviewed", "Last Review"],
  nextReviewAt: ["Next Review", "Next Review Date"],
  lawfulBasis: ["Lawful Basis", "Lawful Ground", "DPDP Ground"],
  retentionTrigger: ["Retention Trigger", "Erasure Trigger"],
  retentionLaw: ["Retention Law", "Law Requiring Retention"],
});

export const ROPA_REQUIRED_IMPORT_FIELDS = ["name"] as const satisfies readonly RopaImportField[];

const headerKey = (header: string) => header.toLowerCase().replace(/[^a-z0-9]/g, "");

export interface ColumnMapping {
  /** Field → the index of the column it is read from. */
  fields: Partial<Record<RopaImportField, number>>;
  /** Headers no field claims — shown, never silently dropped. */
  unmapped: string[];
  /** Required fields no column supplies. An import cannot run until they are mapped. */
  missingRequired: RopaImportField[];
}

/**
 * Propose a mapping from the file's own headers. A header maps to at most one
 * field and a field to at most one header (the first wins); the user confirms
 * or corrects it before anything is imported.
 */
export function mapColumns(headers: readonly string[]): ColumnMapping {
  const fields: Partial<Record<RopaImportField, number>> = {};
  const unmapped: string[] = [];
  headers.forEach((header, index) => {
    const key = headerKey(header);
    const field = key
      ? ROPA_IMPORT_FIELDS.find((f) => fields[f] === undefined && ROPA_IMPORT_HEADERS[f].some((a) => headerKey(a) === key))
      : undefined;
    if (field) fields[field] = index;
    else if (header.trim() !== "") unmapped.push(header);
  });
  return { fields, unmapped, missingRequired: ROPA_REQUIRED_IMPORT_FIELDS.filter((f) => fields[f] === undefined) };
}

/** A mapping the user confirmed: header text → field, or null to ignore the column. */
export function applyMapping(
  headers: readonly string[],
  chosen: Readonly<Record<string, RopaImportField | null>>,
): ColumnMapping {
  const fields: Partial<Record<RopaImportField, number>> = {};
  const unmapped: string[] = [];
  headers.forEach((header, index) => {
    const field = chosen[header];
    if (field === undefined || field === null) {
      if (header.trim() !== "") unmapped.push(header);
      return;
    }
    if (!(ROPA_IMPORT_FIELDS as readonly string[]).includes(field)) {
      throw new RopaInputError(`unknown import field ${String(field)}`);
    }
    if (fields[field] !== undefined) throw new RopaInputError(`two columns are mapped to ${field}`);
    fields[field] = index;
  });
  return { fields, unmapped, missingRequired: ROPA_REQUIRED_IMPORT_FIELDS.filter((f) => fields[f] === undefined) };
}

/**
 * A workbook yes/no column, which is rarely yes/no: "Yes / Needs review",
 * "Possible under-18", "Likely / Unknown", "Possible analytics". Starts with
 * yes → yes; is plainly no → no; ANYTHING else → unknown. Never an error, and
 * never a guess towards "no" (D-026).
 */
export function parseTriState(value: string | null | undefined): TriState {
  const v = normalise(value ?? "");
  if (/^(yes|y|true)\b/.test(v)) return "yes";
  if (/^(no|n|false|none)$/.test(v)) return "no";
  return "unknown";
}

export function isTriState(value: string): value is TriState {
  return (TRI_STATES as readonly string[]).includes(value);
}

/**
 * A review date as a calendar date. Accepts `YYYY-MM-DD` (with or without a
 * time, as a spreadsheet writes a date cell) and the Indian day-first
 * `DD/MM/YYYY` or `DD-MM-YYYY`. Returns null for an unparseable date.
 */
export function parseImportDate(value: string): string | null {
  const v = value.trim();
  let iso: string | null = null;
  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})(?:[ T]\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?Z?)?$/.exec(v);
  if (isoMatch) iso = `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
  const dmy = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/.exec(v);
  if (dmy) iso = `${dmy[3]}-${dmy[2]!.padStart(2, "0")}-${dmy[1]!.padStart(2, "0")}`;
  return iso && isCalendarDate(iso) ? iso : null;
}

export const ROPA_TEXT_LIMIT = 2000;
export const ROPA_NAME_LIMIT = 300;
export const ROPA_RECORD_CODE_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._/-]{0,49}$/;

/** The text columns a record stores as typed — including any `=FORMULA(...)`, which is never evaluated. */
export const ROPA_TEXT_FIELDS = [
  "description",
  "departmentText",
  "dataPrincipalTypes",
  "dataCategories",
  "purpose",
  "legalBasisNote",
  "collectionSource",
  "systemsText",
  "vendorsText",
  "sharing",
  "retentionRule",
  "securitySafeguards",
  "noticeLinked",
  "consentLinked",
  "rightsWorkflow",
  "grievanceLinked",
  "evidenceNote",
  "retentionLaw",
] as const satisfies readonly RopaImportField[];
export type RopaTextField = (typeof ROPA_TEXT_FIELDS)[number];

export interface RopaImportRecord {
  recordCode: string | null;
  name: string;
  text: Partial<Record<RopaTextField, string>>;
  estimatedDataPrincipals: number | null;
  childrenData: TriState;
  crossBorder: TriState;
  aiProcessing: TriState;
  highRiskDocuments: TriState;
  /** The rating the file claims, if any. Kept only when it raises the derived one. */
  riskRating: RopaRiskRating | null;
  lastReviewedAt: string | null;
  nextReviewAt: string | null;
  lawfulBasis: RopaLawfulBasis | null;
  retentionTrigger: RopaRetentionTrigger | null;
}

const vocabKey = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");

/** Labels a ground carried before, so a CSV exported then still imports (B3 reworded s.7(a)). */
const LEGACY_LAWFUL_BASIS_LABELS: readonly { code: RopaLawfulBasis; label: string }[] = [
  { code: "voluntary", label: "Data the person gave for a purpose they asked for" },
];

/**
 * A lawful ground as a spreadsheet may write it: the code ("employment"), the
 * section ("s.7(i)", "7(i)") or the label. Exact after normalising — never a
 * guess. Null for anything else.
 */
export function parseLawfulBasis(value: string): RopaLawfulBasis | null {
  const key = vocabKey(value);
  const legacy = LEGACY_LAWFUL_BASIS_LABELS.find((l) => vocabKey(l.label) === key);
  if (legacy) return legacy.code;
  const hit = ROPA_LAWFUL_BASES.find(
    (b) => vocabKey(b.code) === key || vocabKey(b.label) === key || vocabKey(b.section) === key || vocabKey(b.section.replace(/^s\./, "")) === key,
  );
  return hit?.code ?? null;
}

export function parseRetentionTrigger(value: string): RopaRetentionTrigger | null {
  const key = vocabKey(value);
  return ROPA_RETENTION_TRIGGERS.find((t) => vocabKey(t.code) === key || vocabKey(t.label) === key)?.code ?? null;
}

export interface RowIssue {
  field: RopaImportField;
  issue: string;
}

export type RopaRowResult =
  | { ok: true; record: RopaImportRecord; warnings: RowIssue[] }
  | { ok: false; errors: RowIssue[] };

/**
 * One row, already parsed into cells and mapped to fields. Returns every
 * problem at once, so the user can fix a row in one pass. A bad row is
 * REJECTED, never the file.
 */
export function validateRopaRow(cells: Readonly<Partial<Record<RopaImportField, string>>>): RopaRowResult {
  const errors: RowIssue[] = [];
  const warnings: RowIssue[] = [];
  const cell = (f: RopaImportField) => {
    const v = cells[f];
    return v === undefined || v.trim() === "" ? null : v.trim();
  };

  const name = cell("name");
  if (name === null) errors.push({ field: "name", issue: "The processing activity needs a name." });
  else if (name.length > ROPA_NAME_LIMIT) errors.push({ field: "name", issue: `Keep the name under ${ROPA_NAME_LIMIT} characters.` });

  const recordCode = cell("recordCode");
  if (recordCode !== null && !ROPA_RECORD_CODE_PATTERN.test(recordCode)) {
    errors.push({ field: "recordCode", issue: "A record ID is up to 50 letters, digits, dots, dashes or slashes." });
  }

  const text: Partial<Record<RopaTextField, string>> = {};
  for (const f of ROPA_TEXT_FIELDS) {
    const v = cell(f);
    if (v === null) continue;
    if (v.length > ROPA_TEXT_LIMIT) errors.push({ field: f, issue: `Keep this under ${ROPA_TEXT_LIMIT} characters.` });
    else text[f] = v;
  }

  let estimatedDataPrincipals: number | null = null;
  const volume = cell("estimatedDataPrincipals");
  if (volume !== null) {
    const digits = volume.replace(/[,\s]/g, "");
    if (/^\d{1,10}$/.test(digits) && Number(digits) <= 2_147_483_647) estimatedDataPrincipals = Number(digits);
    else errors.push({ field: "estimatedDataPrincipals", issue: "Give the number of Data Principals as a whole number." });
  }

  let riskRating: RopaRiskRating | null = null;
  const risk = cell("riskRating");
  if (risk !== null) {
    const r = risk.toLowerCase();
    if (isRopaRiskRating(r)) riskRating = r;
    else errors.push({ field: "riskRating", issue: "A risk rating is Low, Medium, High or Critical." });
  }

  const dates: Record<"lastReviewedAt" | "nextReviewAt", string | null> = { lastReviewedAt: null, nextReviewAt: null };
  for (const f of ["lastReviewedAt", "nextReviewAt"] as const) {
    const v = cell(f);
    if (v === null) continue;
    const parsed = parseImportDate(v);
    if (parsed === null) errors.push({ field: f, issue: "Use a date like 2026-12-31 or 31/12/2026." });
    else dates[f] = parsed;
  }

  let lawfulBasis: RopaLawfulBasis | null = null;
  const basis = cell("lawfulBasis");
  if (basis !== null) {
    lawfulBasis = parseLawfulBasis(basis);
    if (lawfulBasis === null) errors.push({ field: "lawfulBasis", issue: "Use a ground the register knows — e.g. consent, employment, or s.7(a)–(i)." });
  }
  let retentionTrigger: RopaRetentionTrigger | null = null;
  const trigger = cell("retentionTrigger");
  if (trigger !== null) {
    retentionTrigger = parseRetentionTrigger(trigger);
    if (retentionTrigger === null) {
      errors.push({ field: "retentionTrigger", issue: "Use purpose_served, consent_withdrawn, law_requires or third_schedule." });
    }
  }

  if (errors.length > 0) return { ok: false, errors };
  return {
    ok: true,
    warnings,
    record: {
      recordCode,
      name: name!,
      text,
      estimatedDataPrincipals,
      childrenData: parseTriState(cell("childrenData")),
      crossBorder: parseTriState(cell("crossBorder")),
      aiProcessing: parseTriState(cell("aiProcessing")),
      highRiskDocuments: parseTriState(cell("highRiskDocuments")),
      riskRating,
      lastReviewedAt: dates.lastReviewedAt,
      nextReviewAt: dates.nextReviewAt,
      lawfulBasis,
      retentionTrigger,
    },
  };
}

/** The facts a freshly imported record has: no owner, no links, no evidence yet. */
export function importedRecordFacts(record: RopaImportRecord): RopaRecordFacts {
  return {
    name: record.name,
    departmentId: null,
    departmentText: record.text.departmentText ?? null,
    ownerUserId: null,
    dataPrincipalTypes: record.text.dataPrincipalTypes ?? null,
    dataCategories: record.text.dataCategories ?? null,
    estimatedDataPrincipals: record.estimatedDataPrincipals,
    purpose: record.text.purpose ?? null,
    legalBasisNote: record.text.legalBasisNote ?? null,
    collectionSource: record.text.collectionSource ?? null,
    systemsText: record.text.systemsText ?? null,
    systemLinkCount: 0,
    vendorsText: record.text.vendorsText ?? null,
    vendorLinkCount: 0,
    noticeLinked: record.text.noticeLinked ?? null,
    consentLinked: record.text.consentLinked ?? null,
    retentionRule: record.text.retentionRule ?? null,
    securitySafeguards: record.text.securitySafeguards ?? null,
    childrenData: record.childrenData,
    crossBorder: record.crossBorder,
    aiProcessing: record.aiProcessing,
    highRiskDocuments: record.highRiskDocuments,
    evidenceCount: 0,
    nextReviewAt: record.nextReviewAt,
    lawfulBasis: record.lawfulBasis,
    childParentalConsent: "unknown",
    childExemption: null,
    childTracking: "unknown",
    retentionTrigger: record.retentionTrigger,
    retentionLaw: record.text.retentionLaw ?? null,
    safeguards: [],
    vendorContractGaps: 0,
  };
}

/**
 * The cell a CSV export writes. A value a spreadsheet would read as a formula
 * (`=`, `+`, `-`, `@`, tab, carriage return) is prefixed with an apostrophe,
 * so a register that LEAVES the system can never execute in someone's Excel
 * (CSV injection). Quoted when it holds a comma, quote or new line.
 */
export function csvCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  const s = defuseFormula(String(value));
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/**
 * Text a spreadsheet could read as a formula, made inert — `csvCell`'s rule,
 * shared by every XLSX export (Slice 9, pitfall 9) so a CSV and a workbook
 * can never disagree about what is defused.
 */
export function defuseFormula(text: string): string {
  return /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
}

/**
 * The inverse of `csvCell`'s guard, for a register that comes BACK in: one
 * leading apostrophe before a formula character is the guard, not data. The
 * value that remains is stored as text and never evaluated.
 */
export function fromCsvCell(value: string): string {
  return /^'[=+\-@\t\r]/.test(value) ? value.slice(1) : value;
}

// ---------------------------------------------------------------------------
// Starter templates (D-066) — a register should not start from a blank page
// ---------------------------------------------------------------------------

/**
 * The spec's suggested activities per industry (Step I, "Industry-Specific
 * ROPA Templates"), plus the activities nearly every organisation has. A
 * template fills the name, whose data it is and the purpose — a STARTING
 * POINT the owner edits. It never fills a lawful ground, a retention rule or
 * a safeguard: those are the organisation's decisions, not ours.
 */
export interface RopaTemplate {
  name: string;
  dataPrincipalTypes: string;
  purpose: string;
}

export const ROPA_COMMON_TEMPLATES: readonly RopaTemplate[] = Object.freeze([
  { name: "Employee HR and payroll", dataPrincipalTypes: "Employees", purpose: "Employment administration, salary and statutory filings" },
  { name: "Recruitment and candidate records", dataPrincipalTypes: "Job applicants", purpose: "Assessing candidates for vacancies" },
  { name: "Customer or enquiry support", dataPrincipalTypes: "Customers, enquirers", purpose: "Answering questions and resolving complaints" },
  { name: "Marketing communications", dataPrincipalTypes: "Customers, prospects", purpose: "Sending news, offers and event invitations" },
  { name: "Website analytics and cookies", dataPrincipalTypes: "Website visitors", purpose: "Measuring and improving the website" },
  { name: "Visitor and CCTV records", dataPrincipalTypes: "Visitors, staff", purpose: "Premises security and visitor management" },
]);

export const ROPA_INDUSTRY_TEMPLATES: Readonly<Record<string, readonly RopaTemplate[]>> = Object.freeze({
  university: [
    { name: "Online admission application", dataPrincipalTypes: "Applicants, parents/guardians", purpose: "Admission eligibility, verification and communication" },
    { name: "Student ERP record management", dataPrincipalTypes: "Students", purpose: "Student lifecycle administration" },
    { name: "Examination registration and result processing", dataPrincipalTypes: "Students", purpose: "Conducting examinations and publishing results" },
    { name: "LMS user accounts and learning analytics", dataPrincipalTypes: "Students, faculty", purpose: "Online learning delivery and academic tracking" },
    { name: "Scholarship and category document processing", dataPrincipalTypes: "Students, parents/guardians", purpose: "Scholarship eligibility and disbursement" },
    { name: "Faculty HRMS and payroll", dataPrincipalTypes: "Faculty, staff", purpose: "Employment administration and payroll" },
    { name: "Student grievance handling", dataPrincipalTypes: "Students", purpose: "Receiving and resolving student grievances" },
    { name: "AI proctoring, chatbot or analytics", dataPrincipalTypes: "Students, applicants", purpose: "Exam integrity, query handling or analytics" },
  ],
  edtech: [
    { name: "Student registration", dataPrincipalTypes: "Learners", purpose: "Creating and managing learner accounts" },
    { name: "Parent or guardian onboarding", dataPrincipalTypes: "Parents/guardians", purpose: "Verifiable parental consent and account management" },
    { name: "Learning analytics and progress tracking", dataPrincipalTypes: "Learners", purpose: "Measuring learning progress" },
    { name: "AI tutor or recommendation engine", dataPrincipalTypes: "Learners", purpose: "Personalised learning recommendations" },
    { name: "Payment and subscription processing", dataPrincipalTypes: "Parents/guardians, learners", purpose: "Taking payments and managing subscriptions" },
    { name: "App analytics and SDK tracking", dataPrincipalTypes: "App users", purpose: "Measuring app usage and performance" },
  ],
  bfsi: [
    { name: "Customer onboarding and KYC", dataPrincipalTypes: "Customers", purpose: "Account opening and know-your-customer checks" },
    { name: "Transaction monitoring", dataPrincipalTypes: "Customers", purpose: "Fraud and anti-money-laundering monitoring" },
    { name: "CRM and customer support", dataPrincipalTypes: "Customers", purpose: "Servicing customer accounts and requests" },
    { name: "Outsourced processing by vendors", dataPrincipalTypes: "Customers", purpose: "Operations carried out by service providers" },
    { name: "Fraud analytics and AI models", dataPrincipalTypes: "Customers", purpose: "Detecting fraud and scoring risk" },
  ],
  healthcare: [
    { name: "Patient registration", dataPrincipalTypes: "Patients", purpose: "Registering patients for care" },
    { name: "Diagnostic and lab reports", dataPrincipalTypes: "Patients", purpose: "Processing and sharing test results" },
    { name: "Doctor consultation records", dataPrincipalTypes: "Patients", purpose: "Recording diagnosis and treatment" },
    { name: "Billing and insurance processing", dataPrincipalTypes: "Patients, insurers' customers", purpose: "Billing and insurance claims" },
    { name: "Telemedicine consultations", dataPrincipalTypes: "Patients", purpose: "Remote consultations" },
    { name: "AI triage or diagnostic support", dataPrincipalTypes: "Patients", purpose: "Supporting clinical decisions" },
  ],
  saas: [
    { name: "User registration", dataPrincipalTypes: "Customer users", purpose: "Creating and managing user accounts" },
    { name: "Customer workspace data", dataPrincipalTypes: "Customer users, their end users", purpose: "Providing the service to customers" },
    { name: "Application logs and telemetry", dataPrincipalTypes: "Users", purpose: "Operating, securing and improving the service" },
    { name: "Customer support access", dataPrincipalTypes: "Customer users", purpose: "Resolving support tickets" },
    { name: "Sub-processor and cloud processing", dataPrincipalTypes: "Customer users", purpose: "Hosting and operating the service" },
    { name: "AI feature processing", dataPrincipalTypes: "Customer users", purpose: "Providing AI-assisted features" },
  ],
});

/** The industry's own starter activities first, then the ones nearly everyone has. */
export function ropaTemplatesFor(industryCode: string | null): RopaTemplate[] {
  const own = (industryCode && ROPA_INDUSTRY_TEMPLATES[industryCode]) || [];
  const names = new Set(own.map((t) => t.name.toLowerCase()));
  return [...own, ...ROPA_COMMON_TEMPLATES.filter((t) => !names.has(t.name.toLowerCase()))];
}

/** Approving a record schedules its next review a year out, unless a sooner date is already set (D-066). */
export const ROPA_REVIEW_CYCLE_MONTHS = 12;
