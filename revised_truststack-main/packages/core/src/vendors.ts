/**
 * The processor register and its questionnaire (Slice 10, Stage 4a) — the
 * rules a processor's assessment runs on, as data and pure functions. No I/O
 * and no clock: `today` (the date in India, D-055) is always passed in.
 *
 * DPDP anchoring (checked against the Act and the Gazette text, G.S.R. 846(E)):
 *
 *   * s.8(2) — a Data Fiduciary may engage a Data Processor to process
 *     personal data on its behalf "only under a valid contract".
 *   * s.8(5), Rule 6(1)(f) — reasonable security safeguards include
 *     "appropriate provision in the contract entered into between such Data
 *     Fiduciary and such a Data Processor for taking reasonable security
 *     safeguards".
 *
 * The questionnaire is the old app's (`src/lib/vendors/questionnaire.ts`,
 * sections A–G), ported as DATA; its risk score (`risk.ts`) is TrustStack's
 * indicator — higher is riskier — never statute and never a status
 * (SLICE_10 pitfall 1). Mirrored in SQL by migration
 * `20261015000000_processor_register`: the database refuses an incomplete
 * submission, derives the score, and stamps who entered, submitted and
 * reviewed every assessment (SLICE_10 §7b, 4a.4; D-089).
 *
 * No software proves a vendor is truthful. What this does is make every
 * answer complete, tied to evidence, checked against the register, reviewed
 * by a second person, attributed, frozen once accepted, and current.
 */

import { addMonths } from "./breach.js";
import { isCalendarDate } from "./gaps.js";
import type { TriState, VendorRole } from "./scope.js";

// ---------------------------------------------------------------------------
// The questionnaire — the old bank, as data
// ---------------------------------------------------------------------------

export const VENDOR_QUESTION_SECTIONS = ["company", "data_handling", "security", "subprocessors", "residency", "incident", "dpdp"] as const;
export type VendorQuestionSection = (typeof VENDOR_QUESTION_SECTIONS)[number];

export const VENDOR_SECTION_LABEL: Readonly<Record<VendorQuestionSection, { label: string; description: string }>> = Object.freeze({
  company: { label: "A. Company and certifications", description: "Who the vendor is and what independent assurance they hold." },
  data_handling: { label: "B. Data handling", description: "What personal data they process for you, and how." },
  security: { label: "C. Security controls", description: "Technical and organisational safeguards." },
  subprocessors: { label: "D. Sub-processors", description: "Onward processing by the vendor's own suppliers." },
  residency: { label: "E. Data residency and transfers", description: "Where data is stored and how transfers are governed." },
  incident: { label: "F. Incident response", description: "Breach preparedness and notification." },
  dpdp: { label: "G. DPDP obligations", description: "A processor's duties under the DPDP Act 2023." },
});

export const VENDOR_QUESTION_TYPES = ["yes_no", "yes_no_partial", "select", "text"] as const;
export type VendorQuestionType = (typeof VENDOR_QUESTION_TYPES)[number];

export interface VendorQuestionOption {
  value: string;
  label: string;
  /** This option's risk, in TENTHS (0 = none … 10 = full) — whole numbers, so core and SQL agree to the last digit. */
  riskTenths: number;
}

export interface VendorQuestion {
  code: string;
  section: VendorQuestionSection;
  text: string;
  type: VendorQuestionType;
  /** Its share of the risk denominator; 0 = informational, not scored and not required. */
  weight: number;
  /**
   * yes_no / yes_no_partial: the FULL-risk answer. `no` — a missing control
   * (no = full, partial = half, yes = none); `yes` — a risky practice present.
   */
  riskyAnswer?: "yes" | "no";
  options?: readonly VendorQuestionOption[];
  hint?: string;
  /**
   * The document that backs a "yes" (4a.4.2). Until one of the vendor's
   * documents is cited on the answer, a "yes" or "partial" scores as the risky
   * answer — claimed, no evidence — as the Compass caps an unevidenced claim.
   */
  document?: string;
}

const yn = (code: string, section: VendorQuestionSection, text: string, weight: number, riskyAnswer: "yes" | "no", extra: Partial<VendorQuestion> = {}): VendorQuestion => ({
  code,
  section,
  text,
  type: "yes_no",
  weight,
  riskyAnswer,
  ...extra,
});
const ynp = (code: string, section: VendorQuestionSection, text: string, weight: number, extra: Partial<VendorQuestion> = {}): VendorQuestion => ({
  code,
  section,
  text,
  type: "yes_no_partial",
  weight,
  riskyAnswer: "no",
  ...extra,
});

/**
 * Forty-five questions, seven sections — the old app's bank, its weights and
 * options unchanged. Its wording is kept except: G1 asks whether the contract
 * IS signed (the old "will the vendor sign" could be answered yes with nothing
 * in place); F3 names Rule 7's intimations and F2's hint Rule 7(2)(b) (the old
 * "72-hour breach-reporting obligation" was another law's shape); E4 drops
 * "SCC-equivalent"; and house style (D-091.4). Five answers need a document:
 * A3, A4, C4, D2 and G1.
 */
export const VENDOR_QUESTIONS: readonly VendorQuestion[] = Object.freeze([
  // A. Company and certifications
  { code: "A1", section: "company", text: "Legal entity name of the vendor", type: "text", weight: 0, hint: "Full registered name of the processor." },
  {
    code: "A2",
    section: "company",
    text: "How long has the vendor been operating?",
    type: "select",
    weight: 1,
    options: [
      { value: "lt2", label: "Less than 2 years", riskTenths: 10 },
      { value: "2to5", label: "2–5 years", riskTenths: 5 },
      { value: "gt5", label: "More than 5 years", riskTenths: 0 },
    ],
  },
  yn("A3", "company", "Is the vendor ISO/IEC 27001 certified?", 3, "no", { document: "The ISO/IEC 27001 certificate" }),
  ynp("A4", "company", "Can the vendor provide a current SOC 2 Type II report?", 2, { document: "The SOC 2 Type II report" }),
  yn("A5", "company", "Does the vendor carry cyber-liability / data-breach insurance?", 2, "no"),
  yn("A6", "company", "Has the vendor appointed a Data Protection Officer or privacy lead?", 2, "no"),
  // B. Data handling
  {
    code: "B1",
    section: "data_handling",
    text: "Approximate volume of our personal-data records they process",
    type: "select",
    weight: 2,
    options: [
      { value: "lt1k", label: "Fewer than 1,000", riskTenths: 0 },
      { value: "1kto100k", label: "1,000 – 1 lakh", riskTenths: 4 },
      { value: "100kto1m", label: "1 lakh – 10 lakh", riskTenths: 7 },
      { value: "gt1m", label: "More than 10 lakh", riskTenths: 10 },
    ],
  },
  yn("B2", "data_handling", "Do they process sensitive personal data (financial, health, biometric, or children's data)?", 3, "yes"),
  yn("B3", "data_handling", "Is access to our data limited to a need-to-know basis (role-based access)?", 2, "no"),
  ynp("B4", "data_handling", "Do they maintain a record of processing activities (ROPA)?", 2),
  yn("B5", "data_handling", "Do they use our data for their own purposes (e.g. product analytics or model training)?", 3, "yes"),
  ynp("B6", "data_handling", "Is personal data pseudonymised or anonymised wherever feasible?", 1),
  yn("B7", "data_handling", "Do they operate a documented data retention and deletion schedule?", 2, "no"),
  // C. Security controls
  yn("C1", "security", "Is personal data encrypted in transit (TLS 1.2 or higher)?", 3, "no"),
  yn("C2", "security", "Is personal data encrypted at rest (AES-256 or equivalent)?", 3, "no"),
  yn("C3", "security", "Is multi-factor authentication enforced for all privileged / admin access?", 2, "no"),
  ynp("C4", "security", "Do they commission independent penetration testing at least annually?", 2, { document: "A penetration-test summary" }),
  ynp("C5", "security", "Do they have centralised logging and security monitoring (SIEM)?", 2),
  yn("C6", "security", "Do they run a documented vulnerability and patch-management process?", 2, "no"),
  yn("C7", "security", "Are encrypted backups taken with periodically tested restoration?", 2, "no"),
  ynp("C8", "security", "Is security-awareness training given to staff handling personal data?", 1),
  // D. Sub-processors
  yn("D1", "subprocessors", "Do they engage sub-processors to handle our data?", 2, "yes"),
  ynp("D2", "subprocessors", "Is there a current, published list of their sub-processors?", 2, { document: "The sub-processor list" }),
  yn("D3", "subprocessors", "Are equivalent data-protection (flow-down) terms imposed on every sub-processor?", 3, "no"),
  yn("D4", "subprocessors", "Will they notify you before adding or changing a sub-processor?", 2, "no"),
  ynp("D5", "subprocessors", "Do they periodically audit or assess their sub-processors?", 1),
  yn("D6", "subprocessors", "Do any sub-processors store our data outside India?", 2, "yes"),
  // E. Data residency and transfers
  yn("E1", "residency", "Is our personal data stored within India?", 3, "no"),
  {
    code: "E2",
    section: "residency",
    text: "Primary storage location for our data",
    type: "select",
    weight: 2,
    options: [
      { value: "india", label: "India", riskTenths: 0 },
      { value: "apac", label: "Asia-Pacific (excluding India)", riskTenths: 5 },
      { value: "eu", label: "EU / UK", riskTenths: 6 },
      { value: "us", label: "United States", riskTenths: 8 },
      { value: "global", label: "Multiple / global regions", riskTenths: 10 },
    ],
  },
  yn("E3", "residency", "Is data transferred to any country the Central Government may restrict?", 2, "yes"),
  ynp("E4", "residency", "Are cross-border transfers governed by contractual safeguards?", 2),
  yn("E5", "residency", "Can they provide an India-region deployment if required?", 1, "no"),
  ynp("E6", "residency", "Do they support data localisation for regulated workloads (e.g. RBI or sectoral rules)?", 1),
  // F. Incident response
  yn("F1", "incident", "Do they have a documented incident-response plan?", 3, "no"),
  {
    code: "F2",
    section: "incident",
    text: "Breach notification time to you",
    type: "select",
    weight: 3,
    options: [
      { value: "le24", label: "Within 24 hours", riskTenths: 0 },
      { value: "le48", label: "Within 48 hours", riskTenths: 2 },
      { value: "le72", label: "Within 72 hours", riskTenths: 4 },
      { value: "gt72", label: "Over 72 hours / not defined", riskTenths: 10 },
    ],
    hint: "The Rules give you 72 hours for the detailed report to the Board (Rule 7(2)(b)); a vendor that tells you sooner protects that window.",
  },
  yn("F3", "incident", "Will they assist with your breach intimations to the Board and to Data Principals (Rule 7)?", 2, "no"),
  yn("F4", "incident", "Have they had a reported data breach in the last 24 months?", 3, "yes"),
  ynp("F5", "incident", "Do they perform post-incident reviews and share a root-cause analysis?", 2),
  ynp("F6", "incident", "Do they run periodic breach / tabletop simulations?", 1),
  // G. DPDP obligations
  yn("G1", "dpdp", "Is a signed contract (Data Processing Agreement) with DPDP clauses in place with the vendor?", 3, "no", {
    document: "The signed contract with its DPDP clauses",
    hint: "s.8(2): a processor is engaged only under a valid contract; Rule 6(1)(f): the contract provides for reasonable security safeguards.",
  }),
  yn("G2", "dpdp", "Will they assist in fulfilling Data Principals' rights (access, correction, erasure) in time?", 3, "no"),
  yn("G3", "dpdp", "Will they delete or return all personal data on contract termination?", 3, "no"),
  yn("G4", "dpdp", "Do they process data only on your documented instructions (no independent use)?", 2, "no"),
  ynp("G5", "dpdp", "Will they permit audits or provide compliance evidence on request?", 2),
  yn("G6", "dpdp", "Do they provide a grievance / privacy contact for escalations?", 2, "no"),
] satisfies readonly VendorQuestion[]);

/**
 * The same questions in the vendor's own voice, for the vendor-facing link
 * page only (Slice 10.5 B5, F5.5): there "they" and "the vendor" are the
 * reader, and "our" is the organisation's. The staff wording above is
 * unchanged — scoring, options and documents come from `VENDOR_QUESTIONS`.
 * `{org}` is replaced with the asking organisation's name.
 */
export const VENDOR_VOICE: Readonly<Record<string, { text: string; hint?: string }>> = Object.freeze({
  A1: { text: "Your company's legal entity name", hint: "Its full registered name." },
  A2: { text: "How long has your company been operating?" },
  A3: { text: "Is your company ISO/IEC 27001 certified?" },
  A4: { text: "Can you provide a current SOC 2 Type II report?" },
  A5: { text: "Does your company carry cyber-liability / data-breach insurance?" },
  A6: { text: "Has your company appointed a Data Protection Officer or privacy lead?" },
  B1: { text: "Approximately how many of {org}'s personal-data records do you process?" },
  B2: { text: "Do you process sensitive personal data for {org} (financial, health, biometric, or children's data)?" },
  B3: { text: "Is access to {org}'s data limited to a need-to-know basis (role-based access)?" },
  B4: { text: "Do you maintain a record of processing activities (ROPA)?" },
  B5: { text: "Do you use {org}'s data for your own purposes (e.g. product analytics or model training)?" },
  B6: { text: "Is personal data pseudonymised or anonymised wherever feasible?" },
  B7: { text: "Do you operate a documented data retention and deletion schedule?" },
  C1: { text: "Is personal data encrypted in transit (TLS 1.2 or higher)?" },
  C2: { text: "Is personal data encrypted at rest (AES-256 or equivalent)?" },
  C3: { text: "Is multi-factor authentication enforced for all privileged / admin access?" },
  C4: { text: "Do you commission independent penetration testing at least annually?" },
  C5: { text: "Do you have centralised logging and security monitoring (SIEM)?" },
  C6: { text: "Do you run a documented vulnerability and patch-management process?" },
  C7: { text: "Are encrypted backups taken with periodically tested restoration?" },
  C8: { text: "Is security-awareness training given to staff handling personal data?" },
  D1: { text: "Do you engage sub-processors to handle {org}'s data?" },
  D2: { text: "Is there a current, published list of your sub-processors?" },
  D3: { text: "Are equivalent data-protection (flow-down) terms imposed on every sub-processor?" },
  D4: { text: "Will you notify {org} before adding or changing a sub-processor?" },
  D5: { text: "Do you periodically audit or assess your sub-processors?" },
  D6: { text: "Do any of your sub-processors store {org}'s data outside India?" },
  E1: { text: "Is {org}'s personal data stored within India?" },
  E2: { text: "Primary storage location for {org}'s data" },
  E3: { text: "Is data transferred to any country the Central Government may restrict?" },
  E4: { text: "Are cross-border transfers governed by contractual safeguards?" },
  E5: { text: "Can you provide an India-region deployment if required?" },
  E6: { text: "Do you support data localisation for regulated workloads (e.g. RBI or sectoral rules)?" },
  F1: { text: "Do you have a documented incident-response plan?" },
  F2: {
    text: "How soon you tell {org} of a personal data breach",
    hint: "The Rules give {org} 72 hours for the detailed report to the Board (Rule 7(2)(b)); telling it sooner protects that window.",
  },
  F3: { text: "Will you assist with {org}'s breach intimations to the Board and to Data Principals (Rule 7)?" },
  F4: { text: "Have you had a reported data breach in the last 24 months?" },
  F5: { text: "Do you perform post-incident reviews and share a root-cause analysis?" },
  F6: { text: "Do you run periodic breach / tabletop simulations?" },
  G1: { text: "Is a signed contract (Data Processing Agreement) with DPDP clauses in place between you and {org}?" },
  G2: { text: "Will you assist {org} in fulfilling Data Principals' rights (access, correction, erasure) in time?" },
  G3: { text: "Will you delete or return all of {org}'s personal data on contract termination?" },
  G4: { text: "Do you process {org}'s data only on its documented instructions (no independent use)?" },
  G5: { text: "Will you permit audits or provide compliance evidence on request?" },
  G6: { text: "Do you provide a grievance / privacy contact for escalations?" },
});

/** Section descriptions in the vendor's voice (F5.5); the labels are the staff ones. */
export const VENDOR_SECTION_VOICE: Readonly<Record<VendorQuestionSection, string>> = Object.freeze({
  company: "Who your company is and what independent assurance it holds.",
  data_handling: "What personal data you process for {org}, and how.",
  security: "Technical and organisational safeguards.",
  subprocessors: "Onward processing by your own suppliers.",
  residency: "Where data is stored and how transfers are governed.",
  incident: "Breach preparedness and notification.",
  dpdp: "A processor's duties under the DPDP Act 2023.",
});

const withOrg = (s: string, organizationName: string) => s.replaceAll("{org}", organizationName);

/** A question as the vendor reads it on the link page: its text and hint in the vendor's voice. */
export function vendorVoice(q: VendorQuestion, organizationName: string): { text: string; hint: string | undefined } {
  const v = VENDOR_VOICE[q.code];
  const hint = v?.hint ?? q.hint;
  return { text: withOrg(v?.text ?? q.text, organizationName), hint: hint === undefined ? undefined : withOrg(hint, organizationName) };
}

/** A section's description in the vendor's voice. */
export function vendorSectionVoice(section: VendorQuestionSection, organizationName: string): string {
  return withOrg(VENDOR_SECTION_VOICE[section], organizationName);
}

export const VENDOR_QUESTION_CODES = VENDOR_QUESTIONS.map((q) => q.code);

/** Scored questions — every one must be answered, or marked not applicable with a reason, before submission. */
export const SCORED_VENDOR_QUESTIONS = VENDOR_QUESTIONS.filter((q) => q.weight > 0);

export function vendorQuestion(code: string): VendorQuestion | undefined {
  return VENDOR_QUESTIONS.find((q) => q.code === code);
}

/** The answers a question accepts. */
export function allowedAnswers(q: VendorQuestion): readonly string[] | null {
  switch (q.type) {
    case "yes_no":
      return ["yes", "no"];
    case "yes_no_partial":
      return ["yes", "no", "partial"];
    case "select":
      return (q.options ?? []).map((o) => o.value);
    case "text":
      return null;
  }
}

export const VENDOR_LIMITS = Object.freeze({
  /** A text answer (A1). */
  textAnswer: 500,
  /** Why a question does not apply. */
  naReason: 500,
  /** Where the answers came from — "the vendor's email of 3 Oct 2026". */
  sourceNote: 300,
  /** Why a reviewer returned an assessment. */
  returnReason: 1000,
});

// ---------------------------------------------------------------------------
// Assessments — statuses, sources, review
// ---------------------------------------------------------------------------

/**
 * draft → submitted → accepted, or → returned (with a reason) → submitted
 * again. Only an ACCEPTED assessment counts; once accepted it never changes —
 * a correction or a re-assessment is a new version.
 */
export const VENDOR_ASSESSMENT_STATUSES = ["draft", "submitted", "returned", "accepted"] as const;
export type VendorAssessmentStatus = (typeof VENDOR_ASSESSMENT_STATUSES)[number];

export const VENDOR_ASSESSMENT_STATUS_LABEL: Readonly<Record<VendorAssessmentStatus, string>> = Object.freeze({
  draft: "Draft",
  submitted: "Awaiting review",
  returned: "Returned for changes",
  accepted: "Accepted",
});

/**
 * Who is answering. `vendor` (Stage 4b) — a link to the vendor is open, or the
 * vendor's respondent submitted it with a signed declaration; a source, not a
 * second table: the same rows, controls and review.
 */
export const VENDOR_ASSESSMENT_SOURCES = ["staff", "vendor"] as const;
export type VendorAssessmentSource = (typeof VENDOR_ASSESSMENT_SOURCES)[number];

export const VENDOR_ASSESSMENT_SOURCE_LABEL: Readonly<Record<VendorAssessmentSource, string>> = Object.freeze({
  staff: "Entered by staff",
  vendor: "Answered by the vendor",
});

/** How long an accepted assessment stays current — a TrustStack default, never statute. */
export const VENDOR_REVIEW_MONTHS = 12;
/** The latest a reviewer may set the review-by date. */
export const VENDOR_REVIEW_MAX_MONTHS = 36;

export const VENDOR_REVIEW_NOTE =
  "Review by twelve months after acceptance is a TrustStack default, not a statutory period. The DPDP Act asks for a valid contract (s.8(2)) with reasonable security safeguards (Rule 6(1)(f)); it sets no re-assessment interval.";

export function defaultReviewBy(today: string): string {
  return addMonths(today, VENDOR_REVIEW_MONTHS);
}

/** Null when `reviewBy` is a date after today and within the longest allowed. */
export function reviewByProblem(reviewBy: string, today: string): string | null {
  if (!isCalendarDate(reviewBy)) return "Give the review-by date as a calendar date.";
  if (reviewBy <= today) return "The review-by date is after today.";
  if (reviewBy > addMonths(today, VENDOR_REVIEW_MAX_MONTHS)) return `The review-by date is at most ${VENDOR_REVIEW_MAX_MONTHS} months away.`;
  return null;
}

/** An accepted assessment past its review-by date: a reason on the vendor, never a status. */
export function assessmentOutOfDate(reviewBy: string | null, today: string): boolean {
  return reviewBy !== null && today > reviewBy;
}

// ---------------------------------------------------------------------------
// Answers — validity, completeness, risk
// ---------------------------------------------------------------------------

export interface VendorAnswer {
  code: string;
  /** Null when the question is marked not applicable. */
  answer: string | null;
  notApplicable: boolean;
  naReason: string | null;
  /** One of the vendor's documents, cited for this answer. */
  evidenceId: string | null;
}

/** What is wrong with one answer, or null. */
export function answerProblem(a: Pick<VendorAnswer, "code" | "answer" | "notApplicable" | "naReason">): string | null {
  const q = vendorQuestion(a.code);
  if (!q) return `${a.code} is not a question in the questionnaire.`;
  if (a.notApplicable) {
    if (q.weight === 0) return `${q.code} is not scored — leave it blank instead.`;
    if (a.answer !== null) return `${q.code}: an answer marked not applicable carries no answer.`;
    if (!a.naReason || a.naReason.trim() === "") return `${q.code}: say why it does not apply.`;
    return null;
  }
  if (a.answer === null || a.answer.trim() === "") return `${q.code}: give an answer, or mark it not applicable.`;
  const allowed = allowedAnswers(q);
  if (allowed && !allowed.includes(a.answer)) return `${q.code}: "${a.answer}" is not one of its answers.`;
  if (q.type === "text" && a.answer.length > VENDOR_LIMITS.textAnswer) return `${q.code}: at most ${VENDOR_LIMITS.textAnswer} characters.`;
  return null;
}

/** Scored questions with neither an answer nor a "not applicable" — what stops a submission (4a.4.1). */
export function missingAnswers(answers: readonly Pick<VendorAnswer, "code" | "answer" | "notApplicable">[]): string[] {
  const done = new Set(answers.filter((a) => a.notApplicable || (a.answer !== null && a.answer !== "")).map((a) => a.code));
  return SCORED_VENDOR_QUESTIONS.filter((q) => !done.has(q.code)).map((q) => q.code);
}

export const VENDOR_RISK_TIERS = ["low", "medium", "high", "critical"] as const;
export type VendorRiskTier = (typeof VENDOR_RISK_TIERS)[number];

export const VENDOR_RISK_TIER_LABEL: Readonly<Record<VendorRiskTier, string>> = Object.freeze({
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
});

/** 0–25 low · 26–50 medium · 51–75 high · 76–100 critical (the old app's tiers). */
export function vendorRiskTier(score: number): VendorRiskTier {
  if (score <= 25) return "low";
  if (score <= 50) return "medium";
  if (score <= 75) return "high";
  return "critical";
}

export const VENDOR_RISK_NOTE =
  "The risk score is TrustStack's indicator, 0–100, higher is riskier — not a statutory measure and not a compliance status.";

/** One answer as the score reads it: does a document back it? */
export interface ScoredVendorAnswer extends Pick<VendorAnswer, "code" | "answer" | "notApplicable"> {
  /** A document of the vendor is cited, still stored, and not rejected or outdated in review. */
  documented: boolean;
}

export interface VendorRisk {
  /** 0 (no residual risk) … 100 (most). Null until a scored question is answered. */
  score: number | null;
  tier: VendorRiskTier | null;
  /** Scored questions answered (not "not applicable"). */
  answered: number;
  notApplicable: number;
  scorable: number;
  /** Answers that claim a control a document must back, with none cited — scored as the risky answer. */
  unevidenced: string[];
}

/** An answer's risk in tenths, or null when it is not scored. "Claimed, no evidence" scores as the risky answer. */
export function answerRiskTenths(q: VendorQuestion, a: ScoredVendorAnswer): { tenths: number; unevidenced: boolean } | null {
  if (q.weight <= 0 || a.notApplicable || a.answer === null) return null;
  if (q.type === "select") {
    const o = (q.options ?? []).find((x) => x.value === a.answer);
    return o ? { tenths: o.riskTenths, unevidenced: false } : null;
  }
  if (q.type === "text") return null;
  const safe = q.riskyAnswer === "no" ? "yes" : "no";
  const risky = q.riskyAnswer ?? "no";
  // A document backs a claim that the control exists — "yes", or "partial".
  if (q.document && risky === "no" && (a.answer === "yes" || a.answer === "partial") && !a.documented) {
    return { tenths: 10, unevidenced: true };
  }
  if (a.answer === "partial") return { tenths: 5, unevidenced: false };
  if (a.answer === risky) return { tenths: 10, unevidenced: false };
  if (a.answer === safe) return { tenths: 0, unevidenced: false };
  return null;
}

/**
 * The risk score: weighted risk over the scored questions ANSWERED, as a
 * whole percentage, rounded half up — in whole numbers throughout, so the
 * database's copy agrees to the last digit. Questions marked not applicable
 * leave the denominator.
 */
export function vendorRisk(answers: readonly ScoredVendorAnswer[]): VendorRisk {
  const byCode = new Map(answers.map((a) => [a.code, a]));
  let earned = 0;
  let max = 0;
  let answered = 0;
  let notApplicable = 0;
  const unevidenced: string[] = [];
  for (const q of SCORED_VENDOR_QUESTIONS) {
    const a = byCode.get(q.code);
    if (!a) continue;
    if (a.notApplicable) {
      notApplicable += 1;
      continue;
    }
    const r = answerRiskTenths(q, a);
    if (!r) continue;
    earned += q.weight * r.tenths;
    max += q.weight * 10;
    answered += 1;
    if (r.unevidenced) unevidenced.push(q.code);
  }
  const score = max > 0 ? Math.floor((200 * earned + max) / (2 * max)) : null;
  return { score, tier: score === null ? null : vendorRiskTier(score), answered, notApplicable, scorable: SCORED_VENDOR_QUESTIONS.length, unevidenced };
}

// ---------------------------------------------------------------------------
// Consistency checks against the vendor register (4a.4.3)
// ---------------------------------------------------------------------------

/** What the vendor register records about the vendor. */
export interface VendorRegisterFacts {
  role: VendorRole;
  contractExists: TriState;
  dpdpClauses: TriState;
  crossBorder: TriState;
  subProcessorsKnown: TriState;
}

export interface ConsistencyRule {
  code: string;
  /** The questions it reads. */
  questions: readonly string[];
  /** What the reviewer is told when it holds. */
  message: string;
  holds: (answer: (code: string) => string | null, vendor: VendorRegisterFacts) => boolean;
}

/**
 * Contradictions between the answers and the register — or within the
 * answers — FLAGGED for the reviewer, never resolved here: the reviewer
 * decides which is right, and corrects the register or returns the assessment.
 */
export const VENDOR_CONSISTENCY_RULES: readonly ConsistencyRule[] = Object.freeze([
  {
    code: "stored_in_india_vs_register",
    questions: ["E1"],
    message: "The answers say our data is stored in India, but the vendor register records that the vendor sends it outside India.",
    holds: (a, v) => a("E1") === "yes" && v.crossBorder === "yes",
  },
  {
    code: "outside_india_vs_register",
    questions: ["E1", "E2", "D6"],
    message: "The answers say our data is stored or sent outside India, but the vendor register records that it does not leave India.",
    holds: (a, v) => v.crossBorder === "no" && (a("E1") === "no" || (a("E2") !== null && a("E2") !== "india") || a("D6") === "yes"),
  },
  {
    code: "storage_answers_disagree",
    questions: ["E1", "E2"],
    message: "The answers disagree with each other: E1 says our data is stored in India, but E2 gives a primary storage location outside India.",
    holds: (a) => a("E1") === "yes" && a("E2") !== null && a("E2") !== "india",
  },
  {
    code: "no_subprocessors_vs_register",
    questions: ["D1"],
    message: "The answers say the vendor engages no sub-processors, but the vendor register records its sub-processors as not known.",
    holds: (a, v) => a("D1") === "no" && v.subProcessorsKnown === "no",
  },
  {
    code: "contract_vs_register",
    questions: ["G1"],
    message: "The answers say a signed contract with DPDP clauses is in place, but the vendor register records the contract or its DPDP clauses as missing or not known.",
    holds: (a, v) => a("G1") === "yes" && (v.contractExists !== "yes" || v.dpdpClauses !== "yes"),
  },
  {
    code: "no_contract_vs_register",
    questions: ["G1"],
    message: "The answers say no signed contract with DPDP clauses is in place, but the vendor register records one.",
    holds: (a, v) => a("G1") === "no" && v.contractExists === "yes" && v.dpdpClauses === "yes",
  },
  {
    code: "independent_not_processor",
    questions: [],
    message: "The vendor register records this vendor as an independent fiduciary, not a processor — check that a processor assessment is the right record.",
    holds: (_a, v) => v.role === "independent",
  },
] satisfies readonly ConsistencyRule[]);

export function consistencyFlags(
  answers: readonly Pick<VendorAnswer, "code" | "answer" | "notApplicable">[],
  vendor: VendorRegisterFacts,
): { code: string; questions: readonly string[]; message: string }[] {
  const byCode = new Map(answers.map((a) => [a.code, a.notApplicable ? null : a.answer]));
  const answer = (code: string) => byCode.get(code) ?? null;
  return VENDOR_CONSISTENCY_RULES.filter((r) => r.holds(answer, vendor)).map(({ code, questions, message }) => ({ code, questions, message }));
}

// ---------------------------------------------------------------------------
// The register's facts the model reads (1.4.0)
// ---------------------------------------------------------------------------

/**
 * A processor's contract gap: not recorded as an independent fiduciary
 * (unknown counts, D-026), with no contract or no DPDP clauses recorded —
 * exactly `app.ropa_vendor_contract_gaps()`'s test, over the whole register.
 */
export function vendorContractGap(v: Pick<VendorRegisterFacts, "role" | "contractExists" | "dpdpClauses">): boolean {
  return v.role !== "independent" && (v.contractExists !== "yes" || v.dpdpClauses !== "yes");
}

/**
 * Who may review: anyone with the permission who neither entered, answered nor
 * submitted it (D-043's rule) — nor, from Stage 4b, sent the vendor a link to
 * it: whoever asked the vendor for the answers does not accept them (D-092).
 */
export function canReviewAssessment(userId: string, involved: readonly (string | null)[]): boolean {
  return !involved.includes(userId);
}

// ---------------------------------------------------------------------------
// The vendor-facing link (Stage 4b) — mirror app.vendor_link_limits()
// ---------------------------------------------------------------------------

/**
 * A link lives fourteen days and takes at most ten documents. The emailed
 * code's limits are the public intake's (INTAKE_LIMITS): ten minutes, three an
 * hour and ten a day per address, five wrong entries — the fifth locks the
 * link and the organisation sends a new one.
 */
export const VENDOR_LINK_LIMITS = Object.freeze({
  linkDays: 14,
  documentsPerLink: 10,
  /** The respondent's name, and the declaration's name and role. */
  name: 200,
});

/** 32 random bytes, base64url — 43 characters. Only its SHA-256 is stored. */
export const VENDOR_LINK_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

export function isVendorLinkToken(value: string): boolean {
  return VENDOR_LINK_TOKEN_PATTERN.test(value);
}

/** The respondent's page. Signed-out, never indexed. */
export const vendorLinkPath = (token: string) => `/v/${token}`;

/** How a respondent is named wherever their work is shown or audited — never by their name or email. */
export const VENDOR_RESPONDENT = "the vendor's respondent";

/** What the respondent signs before submitting (§7b 4b.3). */
export const VENDOR_DECLARATION = "These answers are accurate and complete.";

/** The open link's state, as staff see it. */
export type VendorLinkState = "open" | "expired" | "locked" | "revoked" | "submitted";

export function vendorLinkState(
  link: { revokedAt: string | null; submittedAt: string | null; expiresAt: string; wrongCodes: number },
  now: Date,
  wrongCodeLimit: number,
): VendorLinkState {
  if (link.submittedAt !== null) return "submitted";
  if (link.revokedAt !== null) return "revoked";
  if (link.wrongCodes >= wrongCodeLimit) return "locked";
  if (new Date(link.expiresAt).getTime() <= now.getTime()) return "expired";
  return "open";
}

export const VENDOR_LINK_STATE_LABEL: Readonly<Record<VendorLinkState, string>> = Object.freeze({
  open: "Open — waiting for the vendor",
  expired: "Expired",
  locked: "Locked after too many wrong codes",
  revoked: "Revoked",
  submitted: "Used — the vendor submitted",
});

/** Plain words for every refusal on the link. None says whether a link, an organisation or a vendor exists. */
export const VENDOR_LINK_REFUSAL = Object.freeze({
  not_found: "This link is not available. Ask the organisation that sent it for a new one.",
  unconfirmed: "Enter the code we emailed you to continue.",
  rate_limited: "Too many codes. Please wait an hour and try again.",
  wrong_code: "That code is not right. Check the email and try again.",
  code_expired: "That code has expired. Ask for a new one.",
  locked: "Too many wrong codes. This link no longer works — ask the organisation that sent it for a new one.",
  too_many_documents: `A link takes at most ${VENDOR_LINK_LIMITS.documentsPerLink} documents.`,
});
export type VendorLinkRefusal = keyof typeof VENDOR_LINK_REFUSAL;

/** The HTTP status each refusal travels with. */
export const VENDOR_LINK_REFUSAL_STATUS: Readonly<Record<VendorLinkRefusal, number>> = Object.freeze({
  not_found: 404,
  unconfirmed: 401,
  rate_limited: 429,
  wrong_code: 422,
  code_expired: 410,
  locked: 410,
  too_many_documents: 409,
});
