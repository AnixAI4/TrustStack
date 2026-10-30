/**
 * Public intake (Slice 10, Stage 3a) — the rules a public rights or grievance
 * form runs on, as data and pure functions. No I/O and no clock.
 *
 * DPDP anchoring (the Gazette text, G.S.R. 846(E)):
 *
 *   * Rule 14(1)–(2): the fiduciary publishes the means by which a Data
 *     Principal makes a request, and the identifiers it needs.
 *   * Rule 14(3) / s.13(2): ninety days "from the date of its receipt". An
 *     online request is received the day it is SUBMITTED, in India — not the
 *     day its email code is entered (Aniket, 2026-10-13, D-084).
 *   * s.8(9), Rule 9: the DPO's or a contact person's business contact
 *     information is published and named in every response.
 *
 * A code proves control of an email address — it is NOT the identity check of
 * Rule 14: staff still record that before a request is fulfilled (D-083.6).
 *
 * Mirrored in SQL by migration `20261013000000_public_intake`
 * (`app.intake_limits()`, the slug CHECK), held together by
 * tests/rls/intake.test.ts.
 */

import { RIGHTS_KINDS, type RightsKind } from "./rights.js";

// ---------------------------------------------------------------------------
// The public address
// ---------------------------------------------------------------------------

/** 3–63 characters: lower-case letters, digits and inner hyphens. The SQL CHECK is the same pattern. */
export const PUBLIC_SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{1,61}[a-z0-9])$/;

export function isPublicSlug(value: string): boolean {
  return PUBLIC_SLUG_PATTERN.test(value);
}

/** A suggested address from an organisation's name: "Mumbai University" → "mumbai-university". */
export function suggestPublicSlug(name: string): string {
  const slug = name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 63)
    .replace(/-+$/g, "");
  return isPublicSlug(slug) ? slug : "";
}

/** The paths a slug opens. One place, so the pages, the emails and the settings agree. */
export const publicPaths = (slug: string) => ({
  home: `/p/${slug}`,
  rights: `/p/${slug}/rights`,
  grievance: `/p/${slug}/grievance`,
  /** Slice 10 Stage 3b: the latest published privacy notice (s.5, Rule 3). */
  notice: `/p/${slug}/notice`,
});

// ---------------------------------------------------------------------------
// The forms
// ---------------------------------------------------------------------------

export const INTAKE_SURFACES = ["rights", "grievance"] as const;
export type IntakeSurface = (typeof INTAKE_SURFACES)[number];

/** The rights form takes the six rights (s.11, s.12, s.14); the grievance form a grievance (s.13). */
export const PUBLIC_RIGHTS_KINDS: readonly Exclude<RightsKind, "grievance">[] = RIGHTS_KINDS.filter(
  (k): k is Exclude<RightsKind, "grievance"> => k !== "grievance",
);

export function surfaceOf(kind: RightsKind): IntakeSurface {
  return kind === "grievance" ? "grievance" : "rights";
}

/** What each right is, in a Data Principal's words — for the public form. */
export const PUBLIC_RIGHTS_KIND_HELP: Readonly<Record<Exclude<RightsKind, "grievance">, string>> = Object.freeze({
  access: "A summary of your personal data being processed, the processing, and who it has been shared with (s.11).",
  correction: "Correct personal data that is inaccurate or misleading (s.12(2)(a)).",
  completion: "Complete personal data that is incomplete (s.12(2)(b)).",
  updating: "Update your personal data (s.12(2)(c)).",
  erasure: "Erase personal data that is no longer needed, or that you withdrew consent for (s.12(3)).",
  nomination: "Nominate someone to exercise your rights if you die or become incapable (s.14, Rule 14(4)).",
});

// ---------------------------------------------------------------------------
// The limits (mirror app.intake_limits())
// ---------------------------------------------------------------------------

export interface IntakeLimits {
  /** Submissions an hour per client address, per organisation and form. */
  submissionsPerHour: number;
  /** Codes sent an hour per email address. */
  codesPerHour: number;
  /** Codes sent a day per email address. */
  codesPerDay: number;
  /** Wrong code entries per submission; then it is locked. */
  wrongCodes: number;
  /** How long a code works. */
  codeMinutes: number;
  /** How long an unconfirmed submission is held. */
  submissionHours: number;
}

export const INTAKE_LIMITS: Readonly<IntakeLimits> = Object.freeze({
  submissionsPerHour: 5,
  codesPerHour: 3,
  codesPerDay: 10,
  wrongCodes: 5,
  codeMinutes: 10,
  submissionHours: 24,
});

// ---------------------------------------------------------------------------
// Codes
// ---------------------------------------------------------------------------

export const INTAKE_CODE_LENGTH = 6;
export const INTAKE_CODE_PATTERN = /^[0-9]{6}$/;

export function isIntakeCode(value: string): boolean {
  return INTAKE_CODE_PATTERN.test(value);
}

/** "asha.rao@example.com" → "as******@example.com" — what a page may echo back. */
export function maskEmail(email: string): string {
  const at = email.lastIndexOf("@");
  if (at <= 0) return "***";
  const local = email.slice(0, at);
  const shown = local.slice(0, Math.min(2, local.length - 1));
  return `${shown}${"*".repeat(Math.max(1, local.length - shown.length))}${email.slice(at)}`;
}

// ---------------------------------------------------------------------------
// What the intake functions answer, and what a person is told
// ---------------------------------------------------------------------------

export const INTAKE_OUTCOMES = [
  "pending",
  "sent",
  "confirmed",
  "not_found",
  "rate_limited",
  "wrong_code",
  "code_expired",
  "locked",
  "expired",
  "already_confirmed",
] as const;
export type IntakeOutcome = (typeof INTAKE_OUTCOMES)[number];

/** Plain words for every refusal. None says whether an organisation, a submission or a code exists. */
export const INTAKE_REFUSAL: Readonly<Record<Exclude<IntakeOutcome, "pending" | "sent" | "confirmed">, string>> =
  Object.freeze({
    not_found: "This page is not available.",
    rate_limited: "Too many attempts. Please wait an hour and try again.",
    wrong_code: "That code is not right. Check the email and try again.",
    code_expired: "That code has expired. Ask for a new one.",
    locked: "Too many wrong codes. Please start again.",
    expired: "This submission has expired. Please start again.",
    already_confirmed: "This submission has already been confirmed.",
  });

/** The HTTP status each refusal travels with. */
export const INTAKE_REFUSAL_STATUS: Readonly<Record<keyof typeof INTAKE_REFUSAL, number>> = Object.freeze({
  not_found: 404,
  rate_limited: 429,
  wrong_code: 422,
  code_expired: 410,
  locked: 410,
  expired: 410,
  already_confirmed: 409,
});

/**
 * Rule 9 in one line: who answers, and how to reach them. Used on every
 * public page and in every email a Data Principal receives.
 */
export interface PublicContact {
  name: string;
  email: string;
  phone: string | null;
  isDpo: boolean;
}

export function contactLine(c: PublicContact): string {
  const who = c.isDpo ? `${c.name}, Data Protection Officer` : c.name;
  return [who, c.email, c.phone].filter(Boolean).join(" · ");
}

/**
 * The organisation as a public page names it (Slice 10.5 B5, F5.2): its
 * display name everywhere, and its legal name once, in brackets, where the two
 * differ — "Mumbai University (University of Mumbai)". Never two names for one
 * Data Fiduciary without saying they are the same.
 */
export function fiduciaryName(name: string, legalName: string | null): string {
  const legal = legalName?.trim();
  return legal && legal.toLowerCase() !== name.trim().toLowerCase() ? `${name} (${legal})` : name;
}
