/**
 * Notice and consent (Slice 10, Stage 3b) — the rules a published privacy
 * notice, the consent widget and the consent register run on, as data and
 * pure functions. No I/O and no clock.
 *
 * DPDP anchoring (the Act and the Gazette text, G.S.R. 846(E)):
 *
 *   * s.5, Rule 3 — the notice is understandable on its own, in clear and
 *     plain language, and itemises (b)(i) the personal data and (b)(ii) each
 *     specified purpose with the goods or services provided or uses enabled;
 *     (c) it gives the link and the other means to withdraw consent (as easily
 *     as it was given), exercise the rights and complain to the Board.
 *   * s.6 — consent is free, specific, informed, unconditional and
 *     unambiguous, by a clear affirmative action, for the specified purpose
 *     only; withdrawal is as easy as giving (s.6(4)). So no purpose is ever
 *     ticked in advance and there is no "required" purpose: processing that
 *     needs no consent is a legitimate use (s.7), not a pre-ticked box.
 *   * s.9(1), Rule 10 — a child's personal data needs the verifiable consent
 *     of a parent, checked by reference to (1)(a) reliable identity and age
 *     details already held, or details given (1)(b)(i) by the individual or
 *     (1)(b)(ii) through a virtual token issued by an authorised entity (a
 *     DigiLocker token is one). Rule 12 and the Fourth Schedule exempt
 *     certain classes and purposes (a clinical establishment, an educational
 *     institution, …) under their conditions.
 *   * s.9(1), Rule 11 — a person with disability who has a lawful guardian:
 *     due diligence that the guardian was appointed by a court, a designated
 *     authority or a local level committee.
 *
 * A consent record is pseudonymous (a keyed hash of the identifier the
 * fiduciary supplies, never the identifier) and append-only: withdrawal is a
 * NEW record. A principal's position is their LATEST record.
 *
 * Mirrored in SQL by migration `20261014000000_notice_consent`, held
 * together by tests/rls/consent.test.ts.
 */

// ---------------------------------------------------------------------------
// Languages — the Eighth Schedule's twenty-two, and English
// ---------------------------------------------------------------------------

/**
 * The languages a notice may be written in and the widget may offer. The
 * widget's own words exist in English, Hindi and Marathi only; every other
 * language is "translation pending" and the widget falls back to English —
 * never machine-translated (SLICE_10 decision 6; translation is Slice 11).
 */
export const CONSENT_LANGUAGES = [
  "en", "hi", "mr", "as", "bn", "brx", "doi", "gu", "kn", "ks", "kok", "mai",
  "ml", "mni", "ne", "or", "pa", "sa", "sat", "sd", "ta", "te", "ur",
] as const;
export type ConsentLanguage = (typeof CONSENT_LANGUAGES)[number];

export const CONSENT_LANGUAGE_LABEL: Readonly<Record<ConsentLanguage, string>> = Object.freeze({
  en: "English",
  hi: "Hindi",
  mr: "Marathi",
  as: "Assamese",
  bn: "Bengali",
  brx: "Bodo",
  doi: "Dogri",
  gu: "Gujarati",
  kn: "Kannada",
  ks: "Kashmiri",
  kok: "Konkani",
  mai: "Maithili",
  ml: "Malayalam",
  mni: "Manipuri",
  ne: "Nepali",
  or: "Odia",
  pa: "Punjabi",
  sa: "Sanskrit",
  sat: "Santali",
  sd: "Sindhi",
  ta: "Tamil",
  te: "Telugu",
  ur: "Urdu",
});

/** The widget's own words exist in these; every other language falls back to English, marked "translation pending". */
export const WIDGET_TRANSLATED_LANGUAGES: readonly ConsentLanguage[] = Object.freeze(["en", "hi", "mr"]);

export function isConsentLanguage(value: string): value is ConsentLanguage {
  return (CONSENT_LANGUAGES as readonly string[]).includes(value);
}

export function widgetTranslationPending(language: ConsentLanguage): boolean {
  return !WIDGET_TRANSLATED_LANGUAGES.includes(language);
}

// ---------------------------------------------------------------------------
// The notice (s.5, Rule 3)
// ---------------------------------------------------------------------------

export const NOTICE_STATUSES = ["draft", "published"] as const;
export type NoticeStatus = (typeof NOTICE_STATUSES)[number];

export const NOTICE_STATUS_LABEL: Readonly<Record<NoticeStatus, string>> = Object.freeze({
  draft: "Draft",
  published: "Published",
});

/** A purpose's key: what a consent record and a widget version name it by. */
export const PURPOSE_KEY_PATTERN = /^[a-z][a-z0-9_]{1,39}$/;

export const NOTICE_LIMITS = Object.freeze({
  title: 200,
  summary: 4000,
  means: 2000,
  purposes: 20,
  purposeTitle: 200,
  purposeUses: 2000,
  dataItems: 30,
  dataItem: 200,
});

/**
 * One specified purpose (Rule 3(b)): what it is, the goods or services it
 * provides or the uses it enables, and the personal data it needs, itemised.
 */
export interface NoticePurpose {
  key: string;
  title: string;
  uses: string;
  dataItems: string[];
}

/** Rule 3(b)–(c), in the order a reader needs it. Nothing here is legal advice; counsel reviews the text. */
export const NOTICE_SECTIONS = Object.freeze({
  data: "The personal data we process (Rule 3(b)(i))",
  purposes: "Why we process it, and what it enables (Rule 3(b)(ii))",
  withdraw: "How to withdraw your consent (Rule 3(c)(i))",
  rights: "How to exercise your rights (Rule 3(c)(ii))",
  board: "How to complain to the Data Protection Board (Rule 3(c)(iii))",
});

/** What every published notice says about the Board, whatever the organisation adds (s.13(3), Rule 3(c)(iii)). */
export const BOARD_COMPLAINT_TEXT =
  "If you are not satisfied with how we respond to a grievance, you may complain to the Data Protection Board of India, after first using our grievance redressal (section 13(3) of the Act).";

/** What every published notice says about withdrawal (s.6(4)). */
export const WITHDRAW_TEXT =
  "You may withdraw your consent at any time, as easily as you gave it: open “Privacy choices” on our website and choose “Withdraw consent”. Withdrawal does not affect processing done before it.";

/** The problems with a notice's purposes, in words; empty when it may be published. */
export function noticePurposeProblems(purposes: readonly NoticePurpose[]): string[] {
  const problems: string[] = [];
  if (purposes.length === 0) problems.push("A notice names at least one purpose.");
  if (purposes.length > NOTICE_LIMITS.purposes) problems.push(`A notice names at most ${NOTICE_LIMITS.purposes} purposes.`);
  const keys = new Set<string>();
  for (const p of purposes) {
    if (!PURPOSE_KEY_PATTERN.test(p.key)) problems.push(`"${p.key}" is not a purpose key: lower-case letters, digits and underscores, starting with a letter.`);
    if (keys.has(p.key)) problems.push(`The purpose key "${p.key}" is used twice.`);
    keys.add(p.key);
    if (p.title.trim() === "") problems.push("Every purpose has a title.");
    if (p.uses.trim() === "") problems.push(`Say what "${p.title || p.key}" provides or enables (Rule 3(b)(ii)).`);
    if (p.dataItems.length === 0 || p.dataItems.some((d) => d.trim() === "")) {
      problems.push(`Itemise the personal data "${p.title || p.key}" needs (Rule 3(b)(i)).`);
    }
    if (p.dataItems.length > NOTICE_LIMITS.dataItems) problems.push(`A purpose itemises at most ${NOTICE_LIMITS.dataItems} kinds of personal data.`);
  }
  return problems;
}

/** Rule 3(b)(i): the itemised personal data across every purpose, each named once, in the order first named. */
export function noticeDataItems(purposes: readonly NoticePurpose[]): string[] {
  const seen = new Map<string, string>();
  for (const p of purposes) for (const d of p.dataItems) if (!seen.has(d.trim().toLowerCase())) seen.set(d.trim().toLowerCase(), d.trim());
  return [...seen.values()];
}

// ---------------------------------------------------------------------------
// The widget version (a "config version")
// ---------------------------------------------------------------------------

export const WIDGET_POSITIONS = ["bottom_bar", "centre_modal", "corner"] as const;
export type WidgetPosition = (typeof WIDGET_POSITIONS)[number];

export const WIDGET_POSITION_LABEL: Readonly<Record<WidgetPosition, string>> = Object.freeze({
  bottom_bar: "A bar along the bottom of the page",
  centre_modal: "A box in the middle of the page",
  corner: "A box in the bottom corner",
});

export const WIDGET_COLOUR_PATTERN = /^#[0-9a-f]{6}$/;

/** The widget's file. A new major version is a new file; a page that embeds v1 keeps working. */
export const WIDGET_SCRIPT_PATH = "/widget/consent-v1.js";

/** What a website pastes: the slug, and (optionally) its own identifier for the person and whether they are a child. */
export function widgetSnippet(origin: string, slug: string): string {
  return `<script src="${origin}${WIDGET_SCRIPT_PATH}" data-org="${slug}" async></script>`;
}

// ---------------------------------------------------------------------------
// Consent records
// ---------------------------------------------------------------------------

/**
 * `given` — consent to the purposes named (at least one). `refused` — the
 * person was asked and consented to none. `withdrawn` — a consent given
 * before is withdrawn, every purpose (s.6(4)). Partly withdrawing is a new
 * `given` with fewer purposes.
 */
export const CONSENT_ACTIONS = ["given", "refused", "withdrawn"] as const;
export type ConsentAction = (typeof CONSENT_ACTIONS)[number];

export const CONSENT_ACTION_LABEL: Readonly<Record<ConsentAction, string>> = Object.freeze({
  given: "Consent given",
  refused: "Consent refused",
  withdrawn: "Consent withdrawn",
});

/** Whose consent it is. A child's is a parent's; a person with disability's is a lawful guardian's (s.9(1), s.2(j)). */
export const PRINCIPAL_KINDS = ["self", "child", "guardian_ward"] as const;
export type PrincipalKind = (typeof PRINCIPAL_KINDS)[number];

export const PRINCIPAL_KIND_LABEL: Readonly<Record<PrincipalKind, string>> = Object.freeze({
  self: "The Data Principal",
  child: "A child — the consent of a parent",
  guardian_ward: "A person with disability — the consent of a lawful guardian",
});

/**
 * How the parent or guardian was verified — or, for a child, the exemption
 * that applies. Never inferred, never sent by the public widget: a person in
 * the organisation records it.
 */
export const VERIFICATION_METHODS = [
  "rule_10_1_a",
  "rule_10_1_b_i",
  "rule_10_1_b_ii",
  "rule_12_exempt",
  "rule_11_court",
  "rule_11_designated_authority",
  "rule_11_local_committee",
] as const;
export type VerificationMethod = (typeof VERIFICATION_METHODS)[number];

export const VERIFICATION_METHOD_LABEL: Readonly<Record<VerificationMethod, string>> = Object.freeze({
  rule_10_1_a: "Reliable identity and age details of the parent already held (Rule 10(1)(a))",
  rule_10_1_b_i: "Identity and age details given by the parent (Rule 10(1)(b)(i))",
  rule_10_1_b_ii: "A virtual token mapped to identity and age, e.g. DigiLocker (Rule 10(1)(b)(ii))",
  rule_12_exempt: "Exempt — a Fourth Schedule class or purpose, within its conditions (Rule 12)",
  rule_11_court: "Guardian appointed by a court of law (Rule 11(1))",
  rule_11_designated_authority: "Guardian appointed by a designated authority (Rule 11(1))",
  rule_11_local_committee: "Guardian appointed by a local level committee (Rule 11(1))",
});

/** The bases that fit each kind of principal. A Data Principal's own consent has none. */
export const VERIFICATION_METHODS_FOR: Readonly<Record<PrincipalKind, readonly VerificationMethod[]>> = Object.freeze({
  self: [],
  child: ["rule_10_1_a", "rule_10_1_b_i", "rule_10_1_b_ii", "rule_12_exempt"],
  guardian_ward: ["rule_11_court", "rule_11_designated_authority", "rule_11_local_committee"],
});

export function verificationFits(kind: PrincipalKind, method: VerificationMethod | null): boolean {
  return method === null || VERIFICATION_METHODS_FOR[kind].includes(method);
}

export const CONSENT_SOURCES = ["widget", "staff"] as const;
export type ConsentSource = (typeof CONSENT_SOURCES)[number];

export const CONSENT_SOURCE_LABEL: Readonly<Record<ConsentSource, string>> = Object.freeze({
  widget: "The consent widget",
  staff: "Recorded by staff",
});

export const CONSENT_IDENTIFIER_LIMIT = 320;
export const CONSENT_REFERENCE_LIMIT = 200;

/** The problems with a record before it is written, in words; empty when it may be written. */
export function consentRecordProblems(r: {
  action: ConsentAction;
  purposes: readonly string[];
  principalKind: PrincipalKind;
  verificationMethod: VerificationMethod | null;
  offered: readonly string[];
}): string[] {
  const problems: string[] = [];
  if (r.action === "given" && r.purposes.length === 0) problems.push("Name at least one purpose the consent is given for.");
  if (r.action !== "given" && r.purposes.length > 0) problems.push("A refusal or a withdrawal names no purpose.");
  if (new Set(r.purposes).size !== r.purposes.length) problems.push("A purpose is named twice.");
  const unknown = r.purposes.filter((p) => !r.offered.includes(p));
  if (unknown.length > 0) problems.push(`Not a purpose of this widget version: ${unknown.join(", ")}.`);
  if (!verificationFits(r.principalKind, r.verificationMethod)) {
    problems.push(
      r.principalKind === "self"
        ? "A Data Principal's own consent has no parent or guardian to verify."
        : "That basis does not fit this kind of consent.",
    );
  }
  return problems;
}

// ---------------------------------------------------------------------------
// The latest position, and what the model reads (1.3.0)
// ---------------------------------------------------------------------------

/** A principal's LATEST record — the facts the register's counts and the model read. */
export interface ConsentFacts {
  principalKind: PrincipalKind;
  action: ConsentAction;
  verificationMethod: VerificationMethod | null;
}

/** Still given, on behalf of a child or a person with disability, with no verification or exemption recorded (s.9(1), Rules 10–11). */
export function childConsentUnverified(c: ConsentFacts): boolean {
  return c.action === "given" && c.principalKind !== "self" && c.verificationMethod === null;
}

export interface ConsentCounts {
  /** Principals with any record. */
  principals: number;
  given: number;
  refused: number;
  withdrawn: number;
  /** Given for a child, or by a lawful guardian. */
  onBehalf: number;
  /** …of which nothing verifies the parent or guardian. */
  unverified: number;
}

/** Counted over every principal's latest record — nothing more (D-069). */
export function countConsents(latest: readonly ConsentFacts[]): ConsentCounts {
  const counts: ConsentCounts = { principals: latest.length, given: 0, refused: 0, withdrawn: 0, onBehalf: 0, unverified: 0 };
  for (const c of latest) {
    counts[c.action] += 1;
    if (c.action === "given" && c.principalKind !== "self") counts.onBehalf += 1;
    if (childConsentUnverified(c)) counts.unverified += 1;
  }
  return counts;
}

// ---------------------------------------------------------------------------
// The public widget's limits (mirror app.consent_limits())
// ---------------------------------------------------------------------------

export interface ConsentLimits {
  /** Records an hour per client address, per organisation. High: a campus or office shares one address. */
  recordsPerClientHour: number;
  /** Records an hour per principal. */
  recordsPerPrincipalHour: number;
}

export const CONSENT_LIMITS: Readonly<ConsentLimits> = Object.freeze({
  recordsPerClientHour: 120,
  recordsPerPrincipalHour: 10,
});
