/**
 * The DPDP exposure model (Slice 9, SLICE_09 §6). Pure data and pure
 * functions — no I/O and no clock: `today` is always passed in.
 *
 * What it answers, per penalty head of the Schedule to the DPDP Act 2023:
 * does the head apply to this organisation, how well is the obligation behind
 * it evidenced (its STATUS), and — where it is not mitigated — an INDICATIVE
 * position within the statutory ceiling, with the reasons in plain words.
 *
 * Three layers, and only the first two are DPDP's (§6.2):
 * 1. The heads and their ceilings are the Schedule, verbatim (`EXPOSURE_HEADS`).
 * 2. Which obligations fall under each head is the Act's own text: the
 *    Schedule names s.8(5), s.8(6), s.9 and s.10, and everything else is H7.
 * 3. Which Compass domains and register gap rules EVIDENCE those obligations,
 *    every threshold and every point is TrustStack's model
 *    (`EXPOSURE_MAPPING`, `EXPOSURE_THRESHOLDS`, `POSITION_FACTORS`). DPDP says
 *    nothing about it, which is why counsel signs it off before launch.
 *
 * Four things here are deliberate and easy to get wrong:
 *
 * 1. **A position is never a fine.** The Board imposes a penalty only after an
 *    inquiry (s.28) finds a breach significant, weighing s.33(2). A band is a
 *    third of a CEILING, shown with its reasons; bands are never summed. The
 *    headline sums CEILINGS, labelled as ceilings.
 * 2. **Only DIRECT evidence sets a status.** Governance, inventory, the
 *    register and cross-border are good practice and root causes, but no DPDP
 *    provision imposes them as such; they appear as "why", never as "what".
 * 3. **"Not yet assessed" counts as exposed in the headline** (decision 3:
 *    silence is not mitigation) but is never LABELLED "Exposed".
 * 4. **SDF status is entered, never inferred** (D-028). Head 4 applies only
 *    once a human has recorded a notification; no scope trigger can set it.
 *
 * Exposure is a third view built on the readiness score and the register
 * (D-061). It never feeds back into either.
 */

import { domainByCode, DOMAIN_CODES, type DomainCode } from "./domains.js";
import { exactProportion, type GapSeverity } from "./engine.js";
import { isCalendarDate, type GapActionStatus, type GapState } from "./gaps.js";
import { DPDP_REPORT_CAVEAT } from "./caveat.js";
import {
  addMonths,
  boardReportOverdue,
  BREACH_STATUSES,
  dateInIndia,
  isInstant,
  principalsPending,
  type BreachStatus,
} from "./breach.js";
import { ROPA_GAP_CODES, ropaGapRule, type RopaGapCode } from "./ropa.js";
import {
  rightsCeilingOverdue,
  rightsPastTarget,
  RIGHTS_KINDS,
  RIGHTS_STATUSES,
  type RightsKind,
  type RightsStatus,
} from "./rights.js";
import { TRI_STATES, VENDOR_ROLES, type TriState, type VendorRole } from "./scope.js";
import {
  childConsentUnverified,
  CONSENT_ACTIONS,
  PRINCIPAL_KINDS,
  VERIFICATION_METHODS,
  type ConsentFacts,
} from "./consent.js";
import { assessmentOutOfDate, vendorContractGap } from "./vendors.js";
import { retentionEndUnrecorded, retentionOverdue, type RetentionFacts } from "./retention.js";
import { aiSystemUnreviewed, AI_SYSTEM_STATUSES, type AiSystemFacts } from "./ai-risk.js";

/**
 * Stamped on every exposure output and, from Stage 2, every stored snapshot.
 * Bump it whenever a change here could give a different status, position or
 * headline for the same facts — and change the SQL mirror in the same PR.
 *
 * 1.1.0 (Slice 10, Stage 1): the breach register feeds head 2 — an overdue
 * Board report sets Exposed, unintimated Data Principals bar Mitigated, and
 * s.33(2)(c) repetition is scored (SLICE_10 §6, D-079.6, D-080). Each later
 * Slice 10 stage that adds rows bumps the minor version again, in its own
 * migration: an applied rule never changes under the same version.
 *
 * 1.2.0 (Slice 10, Stage 2): the rights and grievance register feeds head 7 —
 * a request or grievance open past the Rules' ninety days sets Exposed; one
 * past TrustStack's 30-day target is a reason, never a status (SLICE_10 §6).
 *
 * 1.3.0 (Slice 10, Stage 3b): the consent register feeds head 3 — a child's
 * or a lawful guardian's consent, still given, with no verification of the
 * parent or guardian (and no Rule 12 exemption) recorded sets Exposed; and a
 * consent still given on behalf of a child or a ward means the head applies
 * (SLICE_10 §6, §7a).
 *
 * 1.4.0 (Slice 10, Stage 4a): the processor register feeds heads 1 and 7 — a
 * processor (anyone not recorded as an independent fiduciary) with no
 * contract, or no DPDP clauses, recorded bars Mitigated on both and never
 * sets Exposed on its own (D-089 addendum); an accepted processor assessment
 * past its review-by date is a reason, never a status (SLICE_10 §6, §7b).
 *
 * 1.5.0 (Slice 10, Stage 5): the retention register feeds head 7 — a schedule
 * past its end date with no erasure recorded for its current cycle sets
 * Exposed; one with no end recorded is a reason, never a status (D-094.1).
 * The AI risk register adds one reason on head 4 — an AI system in use with
 * no review in twelve months (Rule 13(3)) — read only when head 4 applies (an
 * SDF notification recorded), never Exposed on its own (SLICE_10 §6, §7c).
 *
 * 1.6.0 (Slice 10, Stage 6 — Aniket's change, D-098): a personal data breach
 * recorded and not dismissed makes head 2 ASSESSED — it is no longer "Not yet
 * assessed" for want of answered questions. It sets no status of its own: a
 * handled breach with nothing else known is Partially mitigated, and the
 * breach rows of 1.1.0 still decide Exposed and bar Mitigated.
 *
 * 1.7.0 (Slice 10.5, Batch B4 — Q1, D-104.1): the open actions on a breach, a
 * request or grievance, and a retention schedule (`registerActions` — they hang
 * on no gap row) count in the outstanding work the forecast projects, as the
 * Actions page counts them. They set no head's status and weigh nothing in
 * leverage: the penalty-head rules are unchanged.
 */
export const EXPOSURE_MODEL_VERSION = "1.7.0";

export class ExposureInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ExposureInputError";
  }
}

// ---------------------------------------------------------------------------
// The clock (STATE, "The clock")
// ---------------------------------------------------------------------------

/**
 * DPDP Rules 2025 (G.S.R. 846(E), 13 Nov 2025) commence in stages. Which Act
 * sections each head's obligations take effect from is for counsel to
 * confirm; until then heads 1–4 and 7 use the later date, and say so.
 */
export const COMMENCEMENT = Object.freeze({
  /** Rule 4 (Consent Managers). */
  rule4: "2026-11-13",
  /** Rules 3, 5–16, 22, 23 — notice, security, breach, retention, contact, children, SDF, rights, cross-border. */
  substantive: "2027-05-13",
  /** Shown beside every deadline until counsel confirms the mapping. */
  note: "Counsel to confirm which provisions take effect on which date; until then TrustStack uses 13 May 2027 for every head.",
});

// ---------------------------------------------------------------------------
// 6.1 The heads — statutory facts, from the Schedule (s.33(1))
// ---------------------------------------------------------------------------

export const EXPOSURE_HEAD_CODES = ["H1", "H2", "H3", "H4", "H5", "H6", "H7"] as const;
export type ExposureHeadCode = (typeof EXPOSURE_HEAD_CODES)[number];

/** The heads the model evaluates. H5 and H6 are listed, never evaluated. */
export const MODELLED_HEAD_CODES = ["H1", "H2", "H3", "H4", "H7"] as const;
export type ModelledHeadCode = (typeof MODELLED_HEAD_CODES)[number];

export interface ExposureHead {
  code: ExposureHeadCode;
  /** The Schedule's serial number. */
  serial: number;
  /** Plain words, for a client screen. */
  title: string;
  /** The provision the Schedule names. */
  provision: string;
  /** The Schedule's ceiling ("may extend to"), in rupees; null when it has none of its own (H6). */
  ceilingRupees: number | null;
  /** The ceiling as the Schedule words it. */
  ceilingLabel: string;
  /** False for H5 and H6: why is in `notModelledReason`. */
  modelled: boolean;
  notModelledReason: string | null;
}

const CRORE = 10_000_000;

export const EXPOSURE_HEADS: readonly ExposureHead[] = Object.freeze([
  {
    code: "H1",
    serial: 1,
    title: "Reasonable security safeguards to prevent a personal data breach",
    provision: "s.8(5)",
    ceilingRupees: 250 * CRORE,
    ceilingLabel: "₹250 crore",
    modelled: true,
    notModelledReason: null,
  },
  {
    code: "H2",
    serial: 2,
    title: "Notice of a personal data breach to the Board and to affected Data Principals",
    provision: "s.8(6)",
    ceilingRupees: 200 * CRORE,
    ceilingLabel: "₹200 crore",
    modelled: true,
    notModelledReason: null,
  },
  {
    code: "H3",
    serial: 3,
    title: "Additional obligations for children's data (and persons with disability who have a lawful guardian)",
    provision: "s.9",
    ceilingRupees: 200 * CRORE,
    ceilingLabel: "₹200 crore",
    modelled: true,
    notModelledReason: null,
  },
  {
    code: "H4",
    serial: 4,
    title: "Additional obligations of a Significant Data Fiduciary",
    provision: "s.10",
    ceilingRupees: 150 * CRORE,
    ceilingLabel: "₹150 crore",
    modelled: true,
    notModelledReason: null,
  },
  {
    code: "H5",
    serial: 5,
    title: "Duties of a Data Principal",
    provision: "s.15",
    ceilingRupees: 10_000,
    ceilingLabel: "₹10,000",
    modelled: false,
    notModelledReason: "A duty of the individual Data Principal, not of the organisation — never shown as the organisation's exposure.",
  },
  {
    code: "H6",
    serial: 6,
    title: "Breach of a voluntary undertaking accepted by the Board",
    provision: "s.32",
    ceilingRupees: null,
    ceilingLabel: "Up to the penalty for the breach the undertaking was about",
    modelled: false,
    notModelledReason: "Applies only once the Board has accepted an undertaking from the organisation; none is recorded in TrustStack.",
  },
  {
    code: "H7",
    serial: 7,
    title: "Any other provision of the Act or the Rules",
    provision: "Any other provision",
    ceilingRupees: 50 * CRORE,
    ceilingLabel: "₹50 crore",
    modelled: true,
    notModelledReason: null,
  },
] satisfies readonly ExposureHead[]);

export function exposureHead(code: ExposureHeadCode): ExposureHead {
  const head = EXPOSURE_HEADS.find((h) => h.code === code);
  if (!head) throw new ExposureInputError(`unknown exposure head ${String(code)}`);
  return head;
}

// ---------------------------------------------------------------------------
// 6.2 What evidences each head — TrustStack's model, for counsel
// ---------------------------------------------------------------------------

/** One obligation a domain or register rule evidences, under one head. */
export interface HeadLink {
  head: ModelledHeadCode;
  /** The Act section or Rule the obligation comes from. */
  provision: string;
}

/**
 * DIRECT: an obligation the Act or Rules actually impose. Only these set a
 * head's status. ENABLING: good practice and a root cause, which DPDP does
 * not impose as such — shown as "why", for the heads in `supports`, and never
 * able to change a status.
 */
export type EvidenceClass =
  | { kind: "direct"; links: readonly HeadLink[] }
  | { kind: "enabling"; supports: readonly ModelledHeadCode[]; reason: string };

export interface ExposureMapping {
  domains: Readonly<Record<DomainCode, EvidenceClass>>;
  registerRules: Readonly<Record<RopaGapCode, EvidenceClass>>;
}

export const EXPOSURE_MAPPING: ExposureMapping = Object.freeze({
  domains: Object.freeze({
    GOV: {
      kind: "enabling",
      supports: ["H1", "H2", "H3", "H4", "H7"],
      reason:
        "A DPO is required only of a Significant Data Fiduciary (s.10(2)(a), already head 4), and the published contact is s.8(9), evidenced under grievance. Whether s.8(4) reaches governance is for counsel.",
    },
    INV: {
      kind: "enabling",
      supports: ["H1", "H2", "H7"],
      reason: "DPDP imposes no data-inventory duty; an organisation cannot secure, notify or erase data it has not found.",
    },
    ROPA: {
      kind: "enabling",
      supports: ["H1", "H7"],
      reason: "DPDP has no record-of-processing duty (unlike GDPR art. 30); the register is how the other duties are evidenced.",
    },
    PURPOSE: { kind: "direct", links: [{ head: "H7", provision: "s.4, s.7" }] },
    NOTICE: { kind: "direct", links: [{ head: "H7", provision: "s.5, Rule 3" }] },
    CONSENT: { kind: "direct", links: [{ head: "H7", provision: "s.6" }] },
    RIGHTS: { kind: "direct", links: [{ head: "H7", provision: "s.11–14, Rule 14" }] },
    GRIEVANCE: { kind: "direct", links: [{ head: "H7", provision: "s.8(9)–(10), Rules 9 and 14(3)" }] },
    RETENTION: { kind: "direct", links: [{ head: "H7", provision: "s.8(7)–(8), Rule 8" }] },
    ACCURACY: { kind: "direct", links: [{ head: "H7", provision: "s.8(3)" }] },
    SECURITY: { kind: "direct", links: [{ head: "H1", provision: "s.8(5), Rule 6(1)" }] },
    // Known coarseness (§6.2): the mapping is per DOMAIN, so a breach question
    // about detection logs counts here although it is Rule 6(1)(c) (H1).
    BREACH: { kind: "direct", links: [{ head: "H2", provision: "s.8(6), Rule 7" }] },
    VENDOR: {
      kind: "direct",
      links: [
        { head: "H1", provision: "s.8(5), Rule 6(1)(f)" },
        { head: "H7", provision: "s.8(2)" },
      ],
    },
    CHILD: { kind: "direct", links: [{ head: "H3", provision: "s.9, Rules 10–11" }] },
    CROSSBORDER: {
      kind: "enabling",
      supports: ["H1", "H7"],
      reason:
        "Transfers are allowed unless the Government restricts a country (s.16(1)) or orders otherwise (Rule 15); localisation binds an SDF only (Rule 13(4)). A watch item until a restriction applies.",
    },
    SDF_AI: { kind: "direct", links: [{ head: "H4", provision: "s.10(2), Rule 13" }] },
  } satisfies Record<DomainCode, EvidenceClass>),
  registerRules: Object.freeze({
    no_records: { kind: "enabling", supports: ["H1", "H2", "H7"], reason: "Register housekeeping, not a statutory duty." },
    no_owner: { kind: "enabling", supports: ["H1", "H7"], reason: "Register housekeeping, not a statutory duty." },
    categories_missing: { kind: "enabling", supports: ["H1", "H7"], reason: "Register housekeeping, not a statutory duty." },
    purpose_missing: { kind: "direct", links: [{ head: "H7", provision: "s.4, s.7" }] },
    vendor_unmapped: { kind: "enabling", supports: ["H1", "H7"], reason: "Register housekeeping, not a statutory duty." },
    processor_contract_missing: {
      kind: "direct",
      links: [
        { head: "H1", provision: "Rule 6(1)(f)" },
        { head: "H7", provision: "s.8(2)" },
      ],
    },
    notice_missing: { kind: "direct", links: [{ head: "H7", provision: "s.5, Rule 3" }] },
    consent_missing: { kind: "direct", links: [{ head: "H7", provision: "s.6" }] },
    retention_missing: { kind: "direct", links: [{ head: "H7", provision: "s.8(7), Rule 8" }] },
    safeguards_missing: { kind: "direct", links: [{ head: "H1", provision: "s.8(5)" }] },
    rule6_unconfirmed: { kind: "direct", links: [{ head: "H1", provision: "Rule 6(1)" }] },
    child_consent_missing: { kind: "direct", links: [{ head: "H3", provision: "s.9(1), Rule 10" }] },
    child_tracking: { kind: "direct", links: [{ head: "H3", provision: "s.9(3)" }] },
    // Rule 13(3) binds a Significant Data Fiduciary only. For anyone else there
    // is no general AI duty in DPDP, so outside head 4 this rule evidences nothing.
    ai_unreviewed: { kind: "direct", links: [{ head: "H4", provision: "Rule 13(3)" }] },
    review_overdue: { kind: "enabling", supports: ["H7"], reason: "Register housekeeping, not a statutory duty." },
  } satisfies Record<RopaGapCode, EvidenceClass>),
});

/** The domains whose evidence sets this head's status. */
export function directDomains(head: ModelledHeadCode): DomainCode[] {
  return DOMAIN_CODES.filter((code) => {
    const c = EXPOSURE_MAPPING.domains[code];
    return c.kind === "direct" && c.links.some((l) => l.head === head);
  });
}

/** The register gap rules whose open gaps count against this head. */
export function directRegisterRules(head: ModelledHeadCode): RopaGapCode[] {
  return ROPA_GAP_CODES.filter((code) => {
    const c = EXPOSURE_MAPPING.registerRules[code];
    return c.kind === "direct" && c.links.some((l) => l.head === head);
  });
}

// ---------------------------------------------------------------------------
// 6.2b Facts from the workflow modules (Slice 10) — direct evidence, by row
// ---------------------------------------------------------------------------

/**
 * A fact a Slice 10 register records that bears on a head DIRECTLY. Each row
 * cites its provision and says what it can do to the head's status:
 *   * `exposed` — when it holds, the head is Exposed (it also counts as
 *     evidence, so the head is no longer "Not yet assessed");
 *   * `not_mitigated` — when it holds, the head cannot be Mitigated: at best
 *     Partially mitigated. A cap on the status, not a status of its own.
 *   * `reason` (1.2.0) — when it holds, the head says so among its reasons
 *     and nothing else: a TrustStack target, never statute, never a status;
 *   * `assessed` (1.6.0) — when it holds, the head is assessed (no longer
 *     "Not yet assessed") and says so among its reasons; nothing else.
 * Counsel reviews these rows with the rest of the mapping.
 */
export const MODULE_INPUT_CODES = [
  "breach_board_overdue",
  "breach_principals_pending",
  "rights_ceiling_overdue",
  "rights_target_overdue",
  "child_consent_unverified",
  "vendor_contract_missing",
  "vendor_assessment_out_of_date",
  "retention_overdue",
  "retention_end_unrecorded",
  "ai_system_unreviewed",
  "breach_recorded",
] as const;
export type ModuleInputCode = (typeof MODULE_INPUT_CODES)[number];

export interface ModuleInput {
  code: ModuleInputCode;
  head: ModelledHeadCode;
  provision: string;
  effect: "exposed" | "not_mitigated" | "reason" | "assessed";
  /** The register it comes from, in plain words. */
  register: string;
  /** What the row reads, in plain words. */
  label: string;
  /** The reason a head gives when the fact holds once, and `{n}` times. */
  reasonOne: string;
  reasonMany: string;
}

export const MODULE_INPUTS: readonly ModuleInput[] = Object.freeze([
  {
    code: "breach_board_overdue",
    head: "H2",
    provision: "s.8(6), Rule 7(2)(b)",
    effect: "exposed",
    register: "Breach register",
    label: "Detailed report to the Board past its due time (72 hours, or the time the Board allowed) and not recorded as made",
    reasonOne: "1 personal data breach: the detailed report to the Board is past its due time and not recorded as made (Rule 7(2)(b)).",
    reasonMany: "{n} personal data breaches: the detailed report to the Board is past its due time and not recorded as made (Rule 7(2)(b)).",
  },
  {
    code: "breach_principals_pending",
    head: "H2",
    provision: "s.8(6), Rule 7(1)",
    effect: "not_mitigated",
    register: "Breach register",
    label: "Affected Data Principals not yet recorded as intimated",
    reasonOne: "1 personal data breach: affected Data Principals are not recorded as intimated (Rule 7(1)).",
    reasonMany: "{n} personal data breaches: affected Data Principals are not recorded as intimated (Rule 7(1)).",
  },
  // 1.2.0 (Slice 10, Stage 2): the rights and grievance register.
  {
    code: "rights_ceiling_overdue",
    head: "H7",
    provision: "s.11–14, Rule 14(3)",
    effect: "exposed",
    register: "Rights and grievance register",
    label: "A rights request or grievance open past the ninety days the Rules allow for a response",
    reasonOne: "1 rights request or grievance has been open for more than ninety days since it was received (Rule 14(3)).",
    reasonMany: "{n} rights requests or grievances have been open for more than ninety days since they were received (Rule 14(3)).",
  },
  {
    code: "rights_target_overdue",
    head: "H7",
    provision: "Rule 14(3) sets ninety days; thirty is a TrustStack target",
    effect: "reason",
    register: "Rights and grievance register",
    label: "Open past TrustStack's 30-day response target, still inside the ninety days",
    reasonOne: "1 rights request or grievance is open past TrustStack's 30-day response target (a target, not a statutory period).",
    reasonMany: "{n} rights requests or grievances are open past TrustStack's 30-day response target (a target, not a statutory period).",
  },
  // 1.3.0 (Slice 10, Stage 3b): the consent register.
  {
    code: "child_consent_unverified",
    head: "H3",
    provision: "s.9(1), Rules 10–11",
    effect: "exposed",
    register: "Consent register",
    label: "A child's or a lawful guardian's consent, still given, with no verification of the parent or guardian recorded",
    reasonOne: "1 consent given on behalf of a child or a person with disability has no verification of the parent or lawful guardian recorded (s.9(1), Rules 10–11).",
    reasonMany: "{n} consents given on behalf of a child or a person with disability have no verification of the parent or lawful guardian recorded (s.9(1), Rules 10–11).",
  },
  // 1.4.0 (Slice 10, Stage 4a): the processor register — one fact, read on
  // both heads it bears on, each row with its own provision.
  {
    code: "vendor_contract_missing",
    head: "H1",
    provision: "s.8(5), Rule 6(1)(f)",
    effect: "not_mitigated",
    register: "Processor register",
    label: "A processor with no contract, or no DPDP clauses, recorded",
    reasonOne: "1 processor has no contract with DPDP clauses recorded — the contract is where reasonable security safeguards are provided for (Rule 6(1)(f)).",
    reasonMany: "{n} processors have no contract with DPDP clauses recorded — the contract is where reasonable security safeguards are provided for (Rule 6(1)(f)).",
  },
  {
    code: "vendor_contract_missing",
    head: "H7",
    provision: "s.8(2)",
    effect: "not_mitigated",
    register: "Processor register",
    label: "A processor with no contract, or no DPDP clauses, recorded",
    reasonOne: "1 processor has no contract with DPDP clauses recorded — a processor is engaged only under a valid contract (s.8(2)).",
    reasonMany: "{n} processors have no contract with DPDP clauses recorded — a processor is engaged only under a valid contract (s.8(2)).",
  },
  {
    code: "vendor_assessment_out_of_date",
    head: "H1",
    provision: "Twelve months is a TrustStack default; the Act sets no interval",
    effect: "reason",
    register: "Processor register",
    label: "A processor's accepted assessment past its review-by date",
    reasonOne: "1 processor's accepted assessment is past its review-by date (a TrustStack default, not a statutory period).",
    reasonMany: "{n} processors' accepted assessments are past their review-by dates (a TrustStack default, not a statutory period).",
  },
  {
    code: "vendor_assessment_out_of_date",
    head: "H7",
    provision: "Twelve months is a TrustStack default; the Act sets no interval",
    effect: "reason",
    register: "Processor register",
    label: "A processor's accepted assessment past its review-by date",
    reasonOne: "1 processor's accepted assessment is past its review-by date (a TrustStack default, not a statutory period).",
    reasonMany: "{n} processors' accepted assessments are past their review-by dates (a TrustStack default, not a statutory period).",
  },
  // 1.5.0 (Slice 10, Stage 5): the retention register, and the AI risk register's one reason.
  {
    code: "retention_overdue",
    head: "H7",
    provision: "s.8(7), Rule 8(3)",
    effect: "exposed",
    register: "Retention register",
    label: "A retention schedule past its end date with no erasure recorded",
    reasonOne: "1 retention schedule is past its end date with no erasure recorded (s.8(7)).",
    reasonMany: "{n} retention schedules are past their end dates with no erasure recorded (s.8(7)).",
  },
  {
    code: "retention_end_unrecorded",
    head: "H7",
    provision: "s.8(7)",
    effect: "reason",
    register: "Retention register",
    label: "A retention schedule with no end date recorded",
    reasonOne: "1 retention schedule has no end date recorded, so its erasure cannot be shown to follow (s.8(7)).",
    reasonMany: "{n} retention schedules have no end date recorded, so their erasure cannot be shown to follow (s.8(7)).",
  },
  {
    code: "ai_system_unreviewed",
    head: "H4",
    provision: "Rule 13(3); twelve months is a TrustStack default",
    effect: "reason",
    register: "AI risk register",
    label: "An AI system in use with no review recorded in the last twelve months",
    reasonOne: "1 AI system in use has no review recorded in the last twelve months (Rule 13(3) due diligence; the interval is a TrustStack default).",
    reasonMany: "{n} AI systems in use have no review recorded in the last twelve months (Rule 13(3) due diligence; the interval is a TrustStack default).",
  },
  // 1.6.0 (Slice 10, Stage 6, D-098): a recorded breach is evidence about head 2 either way.
  {
    code: "breach_recorded",
    head: "H2",
    provision: "s.8(6), Rule 7",
    effect: "assessed",
    register: "Breach register",
    label: "A personal data breach recorded and not dismissed",
    reasonOne: "1 personal data breach is recorded in the breach register (s.8(6), Rule 7), so this head is assessed from it.",
    reasonMany: "{n} personal data breaches are recorded in the breach register (s.8(6), Rule 7), so this head is assessed from them.",
  },
] satisfies readonly ModuleInput[]);

/** The module facts that bear on this head, in the model's order. */
export function moduleInputsFor(head: ModelledHeadCode): ModuleInput[] {
  return MODULE_INPUTS.filter((m) => m.head === head);
}

export function moduleReason(m: Pick<ModuleInput, "reasonOne" | "reasonMany">, n: number): string {
  return n === 1 ? m.reasonOne : m.reasonMany.replace("{n}", String(n));
}

/** s.33(2)(c): breaches the organisation became aware of within this many months, today included. */
export const REPETITION_WINDOW_MONTHS = 24;

/**
 * How many times each module fact holds, at `now` and on `today` (breaches
 * dismissed as not personal data breaches never count; nor do requests that
 * were withdrawn or void, or have been answered).
 */
export function moduleInputCounts(
  input: Pick<ExposureInput, "now" | "today" | "breaches" | "rights" | "consents" | "vendors" | "retention" | "aiSystems">,
): Record<ModuleInputCode, number> {
  return {
    breach_board_overdue: input.breaches.filter((b) => boardReportOverdue(b, input.now)).length,
    breach_principals_pending: input.breaches.filter((b) => principalsPending(b)).length,
    rights_ceiling_overdue: input.rights.filter((r) => rightsCeilingOverdue(r, input.today)).length,
    rights_target_overdue: input.rights.filter((r) => rightsPastTarget(r, input.today)).length,
    child_consent_unverified: input.consents.filter(childConsentUnverified).length,
    vendor_contract_missing: input.vendors.filter(vendorContractGap).length,
    vendor_assessment_out_of_date: input.vendors.filter(
      (v) => v.role !== "independent" && assessmentOutOfDate(v.assessmentReviewBy, input.today),
    ).length,
    retention_overdue: input.retention.filter((r) => retentionOverdue(r, input.today)).length,
    retention_end_unrecorded: input.retention.filter(retentionEndUnrecorded).length,
    ai_system_unreviewed: input.aiSystems.filter((a) => aiSystemUnreviewed(a, input.today)).length,
    breach_recorded: input.breaches.filter((b) => b.status !== "dismissed").length,
  };
}

/**
 * Who head 3 is about (1.3.0): the scope and the register's answers, and —
 * from the consent register — a consent still given on behalf of a child
 * means children's data IS processed, and one given by a lawful guardian
 * means a ward's data is. Read by the head's applicability and by the
 * children's-data position factor alike.
 */
export function childrenAndGuardianFacts(
  input: Pick<ExposureInput, "scope" | "register" | "consents">,
): { children: TriState; guardian: TriState } {
  const given = input.consents.filter((c) => c.action === "given");
  const consentChild: TriState[] = given.some((c) => c.principalKind === "child") ? ["yes"] : [];
  const consentWard: TriState[] = given.some((c) => c.principalKind === "guardian_ward") ? ["yes"] : [];
  return {
    children: strongestTriState([input.scope.childrenData, ...input.register.childrenData, ...consentChild]),
    guardian: strongestTriState([input.scope.guardianData, ...consentWard]),
  };
}

/** Breaches (not dismissed) the organisation became aware of in the s.33(2)(c) window ending `today`. */
export function recentBreachCount(input: Pick<ExposureInput, "today" | "breaches">): number {
  const from = addMonths(input.today, -REPETITION_WINDOW_MONTHS);
  return input.breaches.filter((b) => {
    if (b.status === "dismissed") return false;
    const on = dateInIndia(b.awareAt);
    return on >= from && on <= input.today;
  }).length;
}

function enablingDomains(head: ModelledHeadCode): DomainCode[] {
  return DOMAIN_CODES.filter((code) => {
    const c = EXPOSURE_MAPPING.domains[code];
    return c.kind === "enabling" && c.supports.includes(head);
  });
}

function enablingRegisterRules(head: ModelledHeadCode): RopaGapCode[] {
  return ROPA_GAP_CODES.filter((code) => {
    const c = EXPOSURE_MAPPING.registerRules[code];
    return c.kind === "enabling" && c.supports.includes(head);
  });
}

// ---------------------------------------------------------------------------
// 6.3 Status — thresholds are model data, counsel-reviewable
// ---------------------------------------------------------------------------

export const EXPOSURE_THRESHOLDS = Object.freeze({
  /** A direct scored domain below this proportion of its weight → Exposed. */
  exposedBelowPercent: 0.4,
  /** Every direct domain at or above this proportion of its weight… */
  mitigatedMinPercent: 0.6,
  /** …with evidence confidence (0–100) at or above this → may be Mitigated. */
  mitigatedMinConfidence: 60,
});

export const EXPOSURE_STATUSES = [
  "not_applicable",
  "not_yet_assessed",
  "exposed",
  "partially_mitigated",
  "mitigated",
] as const;
export type ExposureStatus = (typeof EXPOSURE_STATUSES)[number];

/** Plain language. Never "compliant" (D-011). "Not yet assessed" is never labelled "Exposed". */
export const EXPOSURE_STATUS_LABEL: Readonly<Record<ExposureStatus, string>> = Object.freeze({
  not_applicable: "Not applicable",
  not_yet_assessed: "Not yet assessed",
  exposed: "Exposed",
  partially_mitigated: "Partially mitigated",
  mitigated: "Mitigated",
});

/** The statuses whose ceiling counts in the headline and which get a position (§6.4, §6.5). */
export const AT_STAKE_STATUSES: readonly ExposureStatus[] = Object.freeze([
  "exposed",
  "partially_mitigated",
  "not_yet_assessed",
]);

export const isAtStake = (status: ExposureStatus): boolean => AT_STAKE_STATUSES.includes(status);

// ---------------------------------------------------------------------------
// 6.4 Position within the ceiling — TrustStack's reading of s.33(2)
// ---------------------------------------------------------------------------

export const POSITION_FACTOR_CODES = [
  "children_data",
  "sensitive_documents",
  "large_scale",
  "location_unknown",
  "status_exposed",
  "remediation_planned",
  "evidence_confident",
  "repetition",
] as const;
export type PositionFactorCode = (typeof POSITION_FACTOR_CODES)[number];

export interface PositionFactor {
  code: PositionFactorCode;
  /** The s.33(2) clause it reads. */
  clause: "(a)" | "(b)" | "(c)" | "(e)";
  /** What the clause is about, in the Act's words. */
  clauseLabel: string;
  /** Points when the factor holds — or, for children's data, when it is `yes`. */
  points: number;
  /** Children's data only: points when it is `unknown`. */
  unknownPoints?: number;
  /** Children's data only: head 3's own points (yes / unknown). */
  h3Points?: number;
  h3UnknownPoints?: number;
  /** Repetition only: points when it holds twice or more (`points` is once). */
  repeatedPoints?: number;
  /** Set when only these heads read the factor. */
  onlyHeads?: readonly ModelledHeadCode[];
}

/**
 * These points are TrustStack's judgement of how the s.33(2) factors are
 * likely to weigh. The Act names the factors but gives them no weights.
 * Repetition (c) reads the breach register from 1.1.0 (Slice 10): one breach
 * in the last 24 months +1, two or more +2, on head 2 only.
 */
export const POSITION_FACTORS: readonly PositionFactor[] = Object.freeze([
  { code: "children_data", clause: "(b)", clauseLabel: "type and nature of the personal data", points: 2, unknownPoints: 1, h3Points: 3, h3UnknownPoints: 2 },
  { code: "sensitive_documents", clause: "(b)", clauseLabel: "type and nature of the personal data", points: 1 },
  { code: "large_scale", clause: "(a)", clauseLabel: "nature, gravity and duration of the breach", points: 1 },
  { code: "location_unknown", clause: "(a)", clauseLabel: "nature, gravity and duration of the breach", points: 1, onlyHeads: ["H1"] },
  { code: "status_exposed", clause: "(a)", clauseLabel: "nature, gravity and duration of the breach", points: 1 },
  { code: "remediation_planned", clause: "(e)", clauseLabel: "action taken to mitigate its effects, and its timeliness", points: -1 },
  { code: "evidence_confident", clause: "(e)", clauseLabel: "action taken to mitigate its effects, and its timeliness", points: -1 },
  { code: "repetition", clause: "(c)", clauseLabel: "repetitive nature of the breach", points: 1, repeatedPoints: 2, onlyHeads: ["H2"] },
] satisfies readonly PositionFactor[]);

export function positionFactor(code: PositionFactorCode): PositionFactor {
  const f = POSITION_FACTORS.find((x) => x.code === code);
  if (!f) throw new ExposureInputError(`unknown position factor ${String(code)}`);
  return f;
}

/** Total points → third of the ceiling: ≤ 1 lower · 2–3 middle · ≥ 4 upper. */
export const POSITION_BANDS = Object.freeze([
  { band: "lower", label: "Lower third", maxPoints: 1 },
  { band: "middle", label: "Middle third", maxPoints: 3 },
  { band: "upper", label: "Upper third", maxPoints: Infinity },
] as const);
export type PositionBand = (typeof POSITION_BANDS)[number]["band"];

/** The s.33(2) factors the platform cannot observe — stated, never scored. */
export const UNSCORED_FACTORS = Object.freeze([
  { clause: "(d)", label: "Whether the breach brought a gain or avoided a loss — the Board's own judgement." },
  { clause: "(f)", label: "Whether the penalty is proportionate and effective — the Board's own judgement." },
  { clause: "(g)", label: "The likely impact of the penalty on the organisation — the Board's own judgement." },
]);

export function positionBand(points: number): (typeof POSITION_BANDS)[number] {
  if (!Number.isInteger(points)) throw new ExposureInputError(`points must be an integer (got ${points})`);
  return POSITION_BANDS.find((b) => points <= b.maxPoints)!;
}

/**
 * The rupee range of one third of a ceiling, in WHOLE crore (decision 5):
 * head 1's upper third is ₹167–250 crore. Never summed into a fine.
 */
export function bandRangeCrore(ceilingRupees: number, band: PositionBand): { fromCrore: number; toCrore: number } {
  const ceilingCrore = ceilingRupees / CRORE;
  const index = POSITION_BANDS.findIndex((b) => b.band === band);
  if (index < 0) throw new ExposureInputError(`unknown band ${String(band)}`);
  return {
    fromCrore: Math.round((ceilingCrore * index) / 3),
    toCrore: Math.round((ceilingCrore * (index + 1)) / 3),
  };
}

export function bandRangeLabel(range: { fromCrore: number; toCrore: number }): string {
  return range.fromCrore === 0 ? `up to ₹${range.toCrore} crore` : `₹${range.fromCrore}–${range.toCrore} crore`;
}

// ---------------------------------------------------------------------------
// 6.5 / 6.6 Wording
// ---------------------------------------------------------------------------

/** Verbatim (§6.6), on every exposure output beside D-011's caveat. */
export function exposureCaveat(version: string = EXPOSURE_MODEL_VERSION): string {
  return (
    "Exposure figures are indicative positions within statutory ceilings in the Schedule to the DPDP Act 2023, " +
    "derived from your own assessment, register and remediation data under TrustStack exposure model " +
    `${version}. They are not a prediction of any decision of the Data Protection Board, which imposes a ` +
    "penalty only after an inquiry finds a breach significant and weighs the factors in section 33(2). " +
    "They are not legal advice."
  );
}

export const EXPOSURE_CAVEAT = exposureCaveat();

export const CEILINGS_LABEL = "Statutory ceilings, not a predicted fine; penalties are per breach.";

/**
 * The headline figure's name, everywhere it is shown — the overview's strip,
 * the Exposure page and every report (Slice 10.5 B4, Q2, D-104.2). It sums the
 * ceilings of the heads AT STAKE (exposed, partially mitigated or not yet
 * assessed), so "where you are exposed" overstated it.
 */
export const CEILINGS_AT_STAKE_HEADING = "Statutory ceilings at stake";

export const S37_NOTICE =
  "Two penalties can lead to blocking of public access to your service: after penalties in two or more instances, the Board may advise the Central Government to direct blocking (s.37).";

export const SDF_NOTICE =
  "Only if the Central Government has notified you as a Significant Data Fiduciary. TrustStack never infers this.";

// ---------------------------------------------------------------------------
// Inputs — the reader shapes, reduced to what the model reads
// ---------------------------------------------------------------------------

/** Which assessment fed the model (decision 2, the `pickAssessments` rule). */
export const EXPOSURE_BASES = ["finalised", "provisional", "none"] as const;
export type ExposureBasis = (typeof EXPOSURE_BASES)[number];

/** One domain as `readAssessmentScore` returns it. */
export interface ExposureDomainInput {
  code: DomainCode;
  /** `scored` · `scoped_out` · `all_not_applicable` (D-038). */
  state: string;
  weight: number;
  questionCount: number;
  outstandingCount: number;
  /** score / weight, 0–1, or null when nothing applicable is answered. */
  percent: number | null;
  /** 0–100, or null. */
  evidenceConfidence: number | null;
}

export interface ExposureRedFlagInput {
  code: string;
  domainCode: string;
  label: string;
}

export interface ExposureActionInput {
  /** The action's id — what leverage ranks and a what-if closes (Stage 2). Never read by the model. */
  id?: string;
  ownerUserId: string | null;
  dueDate: string | null;
  status: GapActionStatus;
}

/** One gap, from either parent. Both carry stored severity and state. */
export type ExposureGapInput =
  | {
      source: "assessment";
      domainCode: DomainCode;
      severity: GapSeverity;
      state: GapState;
      actions: readonly ExposureActionInput[];
    }
  | {
      source: "ropa";
      gapCode: RopaGapCode;
      severity: GapSeverity;
      state: GapState;
      actions: readonly ExposureActionInput[];
    };

/**
 * One remedial action on a breach, a request or grievance, or a retention
 * schedule (1.7.0). It has no gap row (D-067: it hangs on its register's
 * record), so it carries the severity and state the Actions page gives it.
 * Counted in the outstanding work only — never in a head's status or leverage.
 */
export interface ExposureRegisterActionInput extends ExposureActionInput {
  source: "breach" | "rights" | "retention";
  severity: GapSeverity;
  /** `superseded` once its breach is dismissed or its request void — then it is not work owed. */
  state: GapState;
}

/** One incident from the breach register — raw facts; the model decides what they mean. */
export interface ExposureBreachInput {
  status: BreachStatus;
  /** When the organisation became aware — an instant (the clock runs in hours). */
  awareAt: string;
  /** Derived by the database: aware + 72 hours, or the time the Board allowed. */
  boardReportDueAt: string;
  boardReportAt: string | null;
  principalsIntimatedAt: string | null;
}

/**
 * One Data Principal's LATEST consent record, for a principal whose consent
 * is given by a parent or a lawful guardian — raw facts; the model decides
 * what they mean (1.3.0). A Data Principal's own consent bears on no rule,
 * so the readers pass only these.
 */
export type ExposureConsentInput = ConsentFacts;

/**
 * One vendor from the vendor register — raw facts; the model decides what they
 * mean (1.4.0). `assessmentReviewBy` is the review-by date of its latest
 * ACCEPTED assessment, or null when none has been accepted.
 */
export interface ExposureVendorInput {
  role: VendorRole;
  contractExists: TriState;
  dpdpClauses: TriState;
  assessmentReviewBy: string | null;
}

/**
 * One schedule from the retention register — raw facts; the model decides what
 * they mean (1.5.0). `endsOn` was derived by the database; `lastErasedOn` is the
 * latest erasure recorded on it, or null.
 */
export type ExposureRetentionInput = RetentionFacts;

/** One row of the AI risk register — its status and last review (1.5.0). */
export type ExposureAiSystemInput = AiSystemFacts;

/** One request or grievance from the rights register — raw facts; the model decides what they mean (1.2.0). */
export interface ExposureRightsInput {
  kind: RightsKind;
  status: RightsStatus;
  /** `YYYY-MM-DD`, the date in India it was received — the ninety days count from here. */
  receivedOn: string;
}

export interface ExposureInput {
  /** `YYYY-MM-DD`, the date in India (D-055). */
  today: string;
  /** The instant the model is evaluated at — a breach clock is hours, not days (1.1.0). */
  now: string;
  basis: ExposureBasis;
  /** Null when basis is `none`. */
  assessment: {
    domains: readonly ExposureDomainInput[];
    redFlags: readonly ExposureRedFlagInput[];
  } | null;
  /** Gaps from the chosen assessment AND the register. */
  gaps: readonly ExposureGapInput[];
  /** Every action on a breach, a request or a retention schedule, closed ones included — 1.7.0, outstanding work only. */
  registerActions: readonly ExposureRegisterActionInput[];
  scope: {
    /** The scope answer, combined with every system and Data Principal type that may hold children's data. */
    childrenData: TriState;
    /** Persons with disability who have a lawful guardian (s.9(1)). */
    guardianData: TriState;
    sensitiveDocuments: TriState;
    /** The scope's `large_scale_processing` trigger fired — internal, never statutory (D-028). */
    largeScale: boolean;
    /** The scope's `cross_border_unknown` trigger fired. */
    locationUnknown: boolean;
  };
  /** Live register records (archived excluded) — the facts H3 and H1 also read. */
  register: {
    childrenData: readonly TriState[];
    crossBorder: readonly TriState[];
  };
  /** Entered by a human; null = head 4 does not apply. */
  sdf: { notifiedOn: string | null };
  /** Every incident in the breach register, dismissed ones included (the model skips them). */
  breaches: readonly ExposureBreachInput[];
  /** Every request and grievance in the rights register, withdrawn and void ones included (the model skips them) — 1.2.0. */
  rights: readonly ExposureRightsInput[];
  /** Each principal's latest consent record where the principal is a child or a ward, whatever its action — 1.3.0. */
  consents: readonly ExposureConsentInput[];
  /** Every vendor in the vendor register, independent ones included (the model skips them) — 1.4.0. */
  vendors: readonly ExposureVendorInput[];
  /** Every schedule in the retention register — 1.5.0. */
  retention: readonly ExposureRetentionInput[];
  /** Every row of the AI risk register, retired ones included (the model skips them) — 1.5.0. */
  aiSystems: readonly ExposureAiSystemInput[];
}

// ---------------------------------------------------------------------------
// Outputs
// ---------------------------------------------------------------------------

export type ReasonKind = "status" | "root_cause" | "applies";

export interface ExposureReason {
  kind: ReasonKind;
  text: string;
}

export interface FiredFactor {
  code: PositionFactorCode;
  clause: string;
  points: number;
  text: string;
}

export interface ExposurePosition {
  points: number;
  band: PositionBand;
  bandLabel: string;
  fromCrore: number;
  toCrore: number;
  rangeLabel: string;
  factors: readonly FiredFactor[];
}

export interface HeadExposure {
  code: ModelledHeadCode;
  serial: number;
  title: string;
  provision: string;
  ceilingRupees: number;
  ceilingCrore: number;
  ceilingLabel: string;
  applies: boolean;
  status: ExposureStatus;
  statusLabel: string;
  /** Counts in the headline ceilings (Exposed, Partially mitigated or Not yet assessed). */
  atStake: boolean;
  /** Null unless at stake (§6.4). */
  position: ExposurePosition | null;
  /** Why this status — direct evidence first, then root causes. Plain words, no codes. */
  reasons: readonly ExposureReason[];
  /** The direct domains and register rules, with the provisions they evidence. */
  evidencedBy: {
    domains: readonly { code: DomainCode; name: string; provision: string }[];
    registerRules: readonly { code: RopaGapCode; label: string; provision: string }[];
    /** Facts from the Slice 10 registers (1.1.0). */
    moduleInputs: readonly { code: ModuleInputCode; register: string; label: string; provision: string }[];
  };
  deadline: string;
  daysToDeadline: number;
}

export interface ExposureResult {
  modelVersion: string;
  basis: ExposureBasis;
  today: string;
  heads: readonly HeadExposure[];
  /** H5 and H6, with why they are not evaluated. */
  notModelled: readonly { code: ExposureHeadCode; title: string; provision: string; ceilingLabel: string; reason: string }[];
  headline: {
    /** Σ ceilings of the heads at stake, in crore. A ceiling, never a fine. */
    ceilingsAtStakeCrore: number;
    ceilingsLabel: string;
    /** Heads at stake (Exposed + Partially mitigated + Not yet assessed). */
    exposedHeads: number;
    applicableHeads: number;
    byStatus: Readonly<Record<ExposureStatus, number>>;
    deadline: string;
    daysToDeadline: number;
  };
  s37: { shown: boolean; text: string };
  unscoredFactors: typeof UNSCORED_FACTORS;
  commencementNote: string;
  /** Both, verbatim, on every exposure output: D-011's, then the exposure model's (§6.6). */
  caveats: { readiness: string; exposure: string };
}

// ---------------------------------------------------------------------------
// The engine
// ---------------------------------------------------------------------------

const DAY_MS = 86_400_000;
const utc = (d: string) => Date.UTC(Number(d.slice(0, 4)), Number(d.slice(5, 7)) - 1, Number(d.slice(8, 10)));

/** Whole days from `today` to `deadline`; negative once it has passed. */
export function daysBetween(today: string, deadline: string): number {
  if (!isCalendarDate(today) || !isCalendarDate(deadline)) {
    throw new ExposureInputError(`dates must be YYYY-MM-DD (got ${today}, ${deadline})`);
  }
  return Math.round((utc(deadline) - utc(today)) / DAY_MS);
}

/** Strongest of several tri-state facts: any `yes` → yes; else any `unknown` → unknown; else no. */
export function strongestTriState(values: readonly TriState[]): TriState {
  if (values.includes("yes")) return "yes";
  if (values.includes("unknown")) return "unknown";
  return "no";
}

/**
 * Still owed: an open gap with no action, or with at least one action not yet
 * closed. A gap whose every action is closed has been remediated — its
 * register has not been regenerated yet, or it belongs to a finalised
 * assessment whose gaps are frozen while its actions live on (D-058).
 */
export function gapIsOutstanding(gap: Pick<ExposureGapInput, "state" | "actions">): boolean {
  return gap.state === "open" && (gap.actions.length === 0 || gap.actions.some((a) => a.status !== "closed"));
}

/** The heads a gap counts against, DIRECTLY. */
export function gapDirectHeads(gap: ExposureGapInput): ModelledHeadCode[] {
  return directHeadsOf(gap);
}

/**
 * Where a gap (or the evidence on it) comes from: a Compass domain, a register
 * gap rule, or (Slice 10) a breach in the breach register or a request or
 * grievance in the rights register.
 */
export type MappingKey =
  | { source: "assessment"; domainCode: DomainCode }
  | { source: "ropa"; gapCode: RopaGapCode }
  | { source: "breach" }
  | { source: "rights" }
  | { source: "retention" };

/** The heads a domain, register rule or module evidences DIRECTLY — the model's mapping, read, never re-typed. */
export function directHeadsOf(key: MappingKey): ModelledHeadCode[] {
  // A breach's remediation counts against the heads the breach register's own rows read (head 2).
  if (key.source === "breach") return [...new Set(MODULE_INPUTS.filter((m) => m.register === "Breach register").map((m) => m.head))];
  // Likewise a request's or grievance's remediation counts against head 7, the register's own (1.2.0).
  if (key.source === "rights") {
    return [...new Set(MODULE_INPUTS.filter((m) => m.register === "Rights and grievance register").map((m) => m.head))];
  }
  // And a retention schedule's erasure work counts against head 7, the retention register's own (1.5.0).
  if (key.source === "retention") return [...new Set(MODULE_INPUTS.filter((m) => m.register === "Retention register").map((m) => m.head))];
  const c = key.source === "assessment" ? EXPOSURE_MAPPING.domains[key.domainCode] : EXPOSURE_MAPPING.registerRules[key.gapCode];
  if (!c) throw new ExposureInputError(`unmapped gap ${key.source === "assessment" ? key.domainCode : key.gapCode}`);
  return c.kind === "direct" ? [...new Set(c.links.map((l) => l.head))] : [];
}

function headApplies(head: ModelledHeadCode, input: ExposureInput): { applies: boolean; why: string | null } {
  switch (head) {
    case "H1":
    case "H2":
    case "H7":
      return { applies: true, why: null };
    case "H3": {
      const { children, guardian } = childrenAndGuardianFacts(input);
      if (children === "no" && guardian === "no") return { applies: false, why: null };
      const parts: string[] = [];
      if (children === "yes") parts.push("children's data is processed");
      else if (children === "unknown") parts.push("whether children's data is processed is not yet known");
      if (guardian === "yes") parts.push("data of persons with disability who have a lawful guardian is processed");
      else if (guardian === "unknown") parts.push("whether data of persons with disability who have a lawful guardian is processed is not yet known");
      return { applies: true, why: `Applies because ${parts.join(", and ")}.` };
    }
    case "H4":
      return input.sdf.notifiedOn === null
        ? { applies: false, why: null }
        : { applies: true, why: `Applies because a Significant Data Fiduciary notification dated ${input.sdf.notifiedOn} is recorded.` };
  }
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
// De-noised before rounding, so 0.145 is "15%" here exactly as it is in SQL.
const pct = (p: number) => `${Math.round(exactProportion(p * 100))}%`;
const wholePercent = (c: number) => Math.round(exactProportion(c));

/**
 * A domain's proportion and confidence with floating-point noise removed
 * (`exactProportion`, the engine's own rule), so a boundary such as 60% is
 * compared exactly as the SQL mirror compares it in exact numerics (Stage 2).
 */
function denoised(d: ExposureDomainInput): ExposureDomainInput {
  return {
    ...d,
    percent: d.percent === null ? null : exactProportion(d.percent),
    evidenceConfidence: d.evidenceConfidence === null ? null : exactProportion(d.evidenceConfidence),
  };
}
const domainName = (code: DomainCode) => domainByCode(code)?.name ?? code;

/** Counts outstanding gaps by severity — the words a reason uses. */
function severityPhrase(gaps: readonly ExposureGapInput[]): string {
  const order: GapSeverity[] = ["critical", "high", "medium", "low"];
  return order
    .map((s) => [s, gaps.filter((g) => g.severity === s).length] as const)
    .filter(([, n]) => n > 0)
    .map(([s, n]) => `${n} ${s}`)
    .join(", ");
}

function evaluateHead(head: ModelledHeadCode, input: ExposureInput): HeadExposure {
  const meta = exposureHead(head);
  const ceilingRupees = meta.ceilingRupees!;
  const deadline = COMMENCEMENT.substantive;
  const base = {
    code: head,
    serial: meta.serial,
    title: meta.title,
    provision: meta.provision,
    ceilingRupees,
    ceilingCrore: ceilingRupees / CRORE,
    ceilingLabel: meta.ceilingLabel,
    deadline,
    daysToDeadline: daysBetween(input.today, deadline),
    evidencedBy: {
      domains: directDomains(head).map((code) => {
        const c = EXPOSURE_MAPPING.domains[code];
        return {
          code,
          name: domainName(code),
          provision: c.kind === "direct" ? c.links.find((l) => l.head === head)!.provision : "",
        };
      }),
      registerRules: directRegisterRules(head).map((code) => {
        const c = EXPOSURE_MAPPING.registerRules[code];
        return {
          code,
          label: ropaGapRule(code).label,
          provision: c.kind === "direct" ? c.links.find((l) => l.head === head)!.provision : "",
        };
      }),
      moduleInputs: moduleInputsFor(head).map((m) => ({ code: m.code, register: m.register, label: m.label, provision: m.provision })),
    },
  };

  const { applies, why } = headApplies(head, input);
  if (!applies) {
    return {
      ...base,
      applies: false,
      status: "not_applicable",
      statusLabel: EXPOSURE_STATUS_LABEL.not_applicable,
      atStake: false,
      position: null,
      reasons: [
        {
          kind: "applies",
          text:
            head === "H4"
              ? "No Significant Data Fiduciary notification is recorded. TrustStack never infers this."
              : "Neither children's data nor data of persons with disability who have a lawful guardian is processed, as recorded in the scope and the register.",
        },
      ],
    };
  }

  // --- The direct evidence -------------------------------------------------
  const direct = new Set(directDomains(head));
  const domains = (input.assessment?.domains ?? []).filter((d) => direct.has(d.code)).map(denoised);
  // A domain scoped out, or excluded in full, evidences nothing (D-038).
  const withQuestions = domains.filter((d) => d.state !== "scoped_out" && d.questionCount > 0);
  const evidencing = withQuestions.filter((d) => d.state !== "all_not_applicable");
  const answered = evidencing.filter((d) => d.percent !== null);
  const outstanding = input.gaps.filter(gapIsOutstanding);
  const directGaps = outstanding.filter((g) => gapDirectHeads(g).includes(head));
  const directRegisterGaps = directGaps.filter((g) => g.source === "ropa");
  const redFlags = (input.assessment?.redFlags ?? []).filter((f) => direct.has(f.domainCode as DomainCode));

  const reasons: ExposureReason[] = [];
  if (why) reasons.push({ kind: "applies", text: why });

  // The workflow modules' facts (1.1.0): how many times each row holds.
  const counts = moduleInputCounts(input);
  const firing = moduleInputsFor(head).filter((m) => counts[m.code] > 0);
  const moduleExposes = firing.some((m) => m.effect === "exposed");
  const moduleBarsMitigated = firing.some((m) => m.effect === "not_mitigated");
  // 1.6.0: a recorded breach assesses head 2 — Exposed is assessed too.
  const moduleAssesses = moduleExposes || firing.some((m) => m.effect === "assessed");

  const unanswered = input.assessment === null || withQuestions.every((d) => d.outstandingCount === d.questionCount);
  const t = EXPOSURE_THRESHOLDS;
  const below = answered.filter((d) => d.percent! < t.exposedBelowPercent);
  const criticalGaps = directGaps.filter((g) => g.severity === "critical");
  const seriousGaps = directGaps.filter((g) => g.severity === "critical" || g.severity === "high");

  let status: ExposureStatus;
  if (unanswered && directRegisterGaps.length === 0 && !moduleAssesses) {
    status = "not_yet_assessed";
    reasons.push({
      kind: "status",
      text:
        input.assessment === null
          ? "No assessment has been started, and no register gap is open for this head."
          : "No question that evidences this head has been answered yet, and no register gap is open for it.",
    });
  } else if (redFlags.length > 0 || criticalGaps.length > 0 || below.length > 0 || moduleExposes) {
    status = "exposed";
  } else if (
    answered.length > 0 &&
    answered.length === evidencing.length &&
    answered.every(
      (d) => d.percent! >= t.mitigatedMinPercent && d.evidenceConfidence !== null && d.evidenceConfidence >= t.mitigatedMinConfidence,
    ) &&
    seriousGaps.length === 0 &&
    !moduleBarsMitigated
  ) {
    status = "mitigated";
  } else {
    status = "partially_mitigated";
  }

  // --- Why: direct evidence ------------------------------------------------
  if (status !== "not_yet_assessed") {
    // A Mitigated head says why first; the gaps still open on it (medium or
    // low — never critical or high) follow, as work that remains.
    if (status === "mitigated") {
      reasons.push({
        kind: "status",
        text: `Every area that evidences this head scored at least ${pct(t.mitigatedMinPercent)} with evidence confidence of at least ${t.mitigatedMinConfidence}%, and no critical or high gap is open.`,
      });
    }
    for (const f of redFlags) reasons.push({ kind: "status", text: `Red flag: ${f.label}.` });
    for (const d of below) {
      reasons.push({ kind: "status", text: `${domainName(d.code)} scored ${pct(d.percent!)} of its weight (below ${pct(t.exposedBelowPercent)}).` });
    }
    const assessmentGaps = directGaps.filter((g) => g.source === "assessment");
    for (const code of direct) {
      const inDomain = assessmentGaps.filter((g) => g.source === "assessment" && g.domainCode === code);
      if (inDomain.length > 0) {
        reasons.push({ kind: "status", text: `${domainName(code)}: ${plural(inDomain.length, "open gap", "open gaps")} (${severityPhrase(inDomain)}).` });
      }
    }
    for (const code of directRegisterRules(head)) {
      const ofRule = directRegisterGaps.filter((g) => g.source === "ropa" && g.gapCode === code);
      if (ofRule.length > 0) {
        reasons.push({ kind: "status", text: `Processing register: ${ropaGapRule(code).label} (${plural(ofRule.length, "open gap", "open gaps")}).` });
      }
    }
    for (const m of firing) reasons.push({ kind: "status", text: moduleReason(m, counts[m.code]) });
    const unansweredDomains = evidencing.filter((d) => d.percent === null);
    for (const d of unansweredDomains) {
      reasons.push({ kind: "status", text: `${domainName(d.code)} has not been answered yet.` });
    }
    if (status === "partially_mitigated") {
      const weak = answered.filter((d) => d.percent! >= t.exposedBelowPercent && d.percent! < t.mitigatedMinPercent);
      for (const d of weak) {
        reasons.push({ kind: "status", text: `${domainName(d.code)} scored ${pct(d.percent!)} of its weight (below ${pct(t.mitigatedMinPercent)}).` });
      }
      const unconfident = answered.filter((d) => d.evidenceConfidence === null || d.evidenceConfidence < t.mitigatedMinConfidence);
      for (const d of unconfident) {
        reasons.push({
          kind: "status",
          text: `${domainName(d.code)}: evidence confidence ${wholePercent(d.evidenceConfidence ?? 0)}% (below ${t.mitigatedMinConfidence}%).`,
        });
      }
    }
  }

  // --- Why: root causes (enabling controls — never a status) ---------------
  if (status !== "mitigated") {
    const enabling = new Set(enablingDomains(head));
    for (const f of input.assessment?.redFlags ?? []) {
      if (enabling.has(f.domainCode as DomainCode)) reasons.push({ kind: "root_cause", text: `Root cause: ${f.label}.` });
    }
    for (const code of enablingRegisterRules(head)) {
      const n = outstanding.filter((g) => g.source === "ropa" && g.gapCode === code).length;
      if (n > 0) reasons.push({ kind: "root_cause", text: `Root cause: processing register — ${ropaGapRule(code).label} (${plural(n, "open gap", "open gaps")}).` });
    }
  }

  // --- Position ------------------------------------------------------------
  const atStake = isAtStake(status);
  const position = atStake ? positionFor(head, status, input, directGaps, answered) : null;

  return {
    ...base,
    applies: true,
    status,
    statusLabel: EXPOSURE_STATUS_LABEL[status],
    atStake,
    position,
    reasons,
  };
}

function positionFor(
  head: ModelledHeadCode,
  status: ExposureStatus,
  input: ExposureInput,
  directGaps: readonly ExposureGapInput[],
  answered: readonly ExposureDomainInput[],
): ExposurePosition {
  const fired: FiredFactor[] = [];
  const add = (code: PositionFactorCode, points: number, text: string) => {
    const f = positionFactor(code);
    if (f.onlyHeads && !f.onlyHeads.includes(head)) return;
    fired.push({ code, clause: f.clause, points, text });
  };

  const { children } = childrenAndGuardianFacts(input);
  const cf = positionFactor("children_data");
  if (children === "yes") add("children_data", head === "H3" ? cf.h3Points! : cf.points, "Children's data is processed.");
  if (children === "unknown") add("children_data", head === "H3" ? cf.h3UnknownPoints! : cf.unknownPoints!, "Children's data may be processed (not yet known).");

  const sensitive = input.scope.sensitiveDocuments;
  const sf = positionFactor("sensitive_documents");
  // "Unknown" counts as risk, as it does for the scope's own tag (D-026).
  if (sensitive === "yes") add("sensitive_documents", sf.points, "Identity, financial or health documents are collected.");
  if (sensitive === "unknown") add("sensitive_documents", sf.points, "Identity, financial or health documents may be collected (not yet known).");

  if (input.scope.largeScale) {
    add("large_scale", positionFactor("large_scale").points, "A large number of Data Principals (a TrustStack trigger, not a statutory classification).");
  }

  const locationUnknown = input.scope.locationUnknown || input.register.crossBorder.includes("unknown");
  if (locationUnknown) add("location_unknown", positionFactor("location_unknown").points, "Where personal data is held or sent is not known.");

  if (status === "exposed") add("status_exposed", positionFactor("status_exposed").points, "Exposed rather than partly mitigated.");

  // (e) mitigation: an owned, dated plan for every open gap on this head. A
  // Low gap carries no due date by design (D-055), so it needs an owner only.
  const planned =
    directGaps.length > 0 &&
    directGaps.every((g) =>
      g.actions.filter((a) => a.status !== "closed").every((a) => a.ownerUserId !== null && (a.dueDate !== null || g.severity === "low")) &&
      g.actions.length > 0,
    );
  if (planned) add("remediation_planned", positionFactor("remediation_planned").points, "Every open gap on this head has an owner and a due date.");

  const confident =
    answered.length > 0 && answered.every((d) => d.evidenceConfidence !== null && d.evidenceConfidence >= EXPOSURE_THRESHOLDS.mitigatedMinConfidence);
  if (confident) add("evidence_confident", positionFactor("evidence_confident").points, `Evidence confidence is at least ${EXPOSURE_THRESHOLDS.mitigatedMinConfidence}% in every area that evidences this head.`);

  // (c) repetition (1.1.0): breaches the organisation became aware of in the
  // last 24 months, from the breach register. Head 2 only (`onlyHeads`).
  const recent = recentBreachCount(input);
  const rf = positionFactor("repetition");
  if (recent > 0) {
    add(
      "repetition",
      recent === 1 ? rf.points : rf.repeatedPoints!,
      `${plural(recent, "personal data breach", "personal data breaches")} recorded in the last ${REPETITION_WINDOW_MONTHS} months.`,
    );
  }

  const points = fired.reduce((sum, f) => sum + f.points, 0);
  const band = positionBand(points);
  const range = bandRangeCrore(exposureHead(head).ceilingRupees!, band.band);
  return {
    points,
    band: band.band,
    bandLabel: band.label,
    ...range,
    rangeLabel: bandRangeLabel(range),
    factors: fired,
  };
}

/**
 * The whole model for one organisation. Pure: the same input always gives the
 * same output, and nothing here reads a clock.
 */
export function exposureFor(input: ExposureInput): ExposureResult {
  if (!isCalendarDate(input.today)) throw new ExposureInputError(`today must be YYYY-MM-DD (got ${input.today})`);
  if (!EXPOSURE_BASES.includes(input.basis)) throw new ExposureInputError(`unknown basis ${String(input.basis)}`);
  if ((input.basis === "none") !== (input.assessment === null)) {
    throw new ExposureInputError("basis `none` exactly when there is no assessment");
  }
  if (input.sdf.notifiedOn !== null && !isCalendarDate(input.sdf.notifiedOn)) {
    throw new ExposureInputError(`sdf.notifiedOn must be YYYY-MM-DD (got ${input.sdf.notifiedOn})`);
  }
  if (!isInstant(input.now)) throw new ExposureInputError(`now must be an ISO-8601 instant (got ${input.now})`);
  for (const b of input.breaches) {
    if (!BREACH_STATUSES.includes(b.status)) throw new ExposureInputError(`unknown breach status ${String(b.status)}`);
    for (const t of [b.awareAt, b.boardReportDueAt, b.boardReportAt, b.principalsIntimatedAt]) {
      if (t !== null && !isInstant(t)) throw new ExposureInputError(`a breach time must be an ISO-8601 instant (got ${t})`);
    }
  }
  for (const r of input.rights) {
    if (!RIGHTS_KINDS.includes(r.kind)) throw new ExposureInputError(`unknown rights request kind ${String(r.kind)}`);
    if (!RIGHTS_STATUSES.includes(r.status)) throw new ExposureInputError(`unknown rights request status ${String(r.status)}`);
    if (!isCalendarDate(r.receivedOn)) throw new ExposureInputError(`receivedOn must be YYYY-MM-DD (got ${r.receivedOn})`);
  }
  for (const c of input.consents) {
    if (!PRINCIPAL_KINDS.includes(c.principalKind)) throw new ExposureInputError(`unknown principal kind ${String(c.principalKind)}`);
    if (!CONSENT_ACTIONS.includes(c.action)) throw new ExposureInputError(`unknown consent action ${String(c.action)}`);
    if (c.verificationMethod !== null && !VERIFICATION_METHODS.includes(c.verificationMethod)) {
      throw new ExposureInputError(`unknown verification method ${String(c.verificationMethod)}`);
    }
  }
  for (const v of input.vendors) {
    if (!VENDOR_ROLES.includes(v.role)) throw new ExposureInputError(`unknown vendor role ${String(v.role)}`);
    if (!TRI_STATES.includes(v.contractExists) || !TRI_STATES.includes(v.dpdpClauses)) {
      throw new ExposureInputError(`a vendor's contract facts are yes, no or unknown (got ${String(v.contractExists)}, ${String(v.dpdpClauses)})`);
    }
    if (v.assessmentReviewBy !== null && !isCalendarDate(v.assessmentReviewBy)) {
      throw new ExposureInputError(`assessmentReviewBy must be YYYY-MM-DD (got ${v.assessmentReviewBy})`);
    }
  }
  for (const r of input.retention) {
    for (const d of [r.startsOn, r.endsOn, r.lastErasedOn]) {
      if (d !== null && !isCalendarDate(d)) throw new ExposureInputError(`a retention date must be YYYY-MM-DD (got ${d})`);
    }
    if ((r.startsOn === null) !== (r.endsOn === null)) throw new ExposureInputError("a retention schedule has an end date exactly when it has a start date");
  }
  for (const a of input.aiSystems) {
    if (!AI_SYSTEM_STATUSES.includes(a.status)) throw new ExposureInputError(`unknown AI system status ${String(a.status)}`);
    if (a.lastReviewedOn !== null && !isCalendarDate(a.lastReviewedOn)) {
      throw new ExposureInputError(`lastReviewedOn must be YYYY-MM-DD (got ${a.lastReviewedOn})`);
    }
  }
  for (const g of input.gaps) gapDirectHeads(g); // refuses an unmapped gap

  const heads = MODELLED_HEAD_CODES.map((h) => evaluateHead(h, input));
  const byStatus = Object.fromEntries(EXPOSURE_STATUSES.map((s) => [s, heads.filter((h) => h.status === s).length])) as Record<
    ExposureStatus,
    number
  >;
  const atStake = heads.filter((h) => h.atStake);
  const deadline = COMMENCEMENT.substantive;

  return {
    modelVersion: EXPOSURE_MODEL_VERSION,
    basis: input.basis,
    today: input.today,
    heads,
    notModelled: EXPOSURE_HEADS.filter((h) => !h.modelled).map((h) => ({
      code: h.code,
      title: h.title,
      provision: h.provision,
      ceilingLabel: h.ceilingLabel,
      reason: h.notModelledReason!,
    })),
    headline: {
      ceilingsAtStakeCrore: atStake.reduce((sum, h) => sum + h.ceilingCrore, 0),
      ceilingsLabel: CEILINGS_LABEL,
      exposedHeads: atStake.length,
      applicableHeads: heads.filter((h) => h.applies).length,
      byStatus,
      deadline,
      daysToDeadline: daysBetween(input.today, deadline),
    },
    s37: { shown: atStake.length > 0, text: S37_NOTICE },
    unscoredFactors: UNSCORED_FACTORS,
    commencementNote: COMMENCEMENT.note,
    caveats: { readiness: DPDP_REPORT_CAVEAT, exposure: exposureCaveat(EXPOSURE_MODEL_VERSION) },
  };
}
