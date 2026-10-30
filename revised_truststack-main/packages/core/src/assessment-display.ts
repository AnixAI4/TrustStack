/**
 * How an assessment speaks to a non-lawyer (Slice 10.5, Batch B2) — display
 * only. Nothing here scores, caps or decides anything: the adjusted score,
 * the evidence level and the cap still come from the database (D-044), and
 * the cap table is `EVIDENCE_CAP`, read here, never restated.
 */
import type { AssessmentStatus } from "./assessment.js";
import type { RoleCode } from "./rbac.js";
import { EVIDENCE_CAP, isMaturityLevel } from "./scoring.js";

// ---------------------------------------------------------------------------
// Status (F2.1, F2.6)
// ---------------------------------------------------------------------------

export const ASSESSMENT_STATUS_LABEL: Readonly<Record<AssessmentStatus, string>> = Object.freeze({
  draft: "Draft",
  in_progress: "In progress",
  submitted: "Submitted",
  finalised: "Finalised",
});

/** "In progress", never `in_progress`; an unknown status is shown as it came. */
export function assessmentStatusLabel(status: string): string {
  return ASSESSMENT_STATUS_LABEL[status as AssessmentStatus] ?? status;
}

// ---------------------------------------------------------------------------
// The claimed level of ONE answer (F2.2)
// ---------------------------------------------------------------------------

/**
 * What a claimed maturity of 0–5 means for one answer — the spec's own
 * "Maturity Scoring" table (Step G, `docs/spec/03_Assessment_Templates_ROPA_Steps_G-I.md`).
 *
 * Deliberately NOT `MATURITY_BANDS`: those name a score PERCENTAGE (a domain's
 * or the overall score — "Level 2 - Defined" is 41–60 %), and on the answer
 * scale "Defined" is 3, not 2. Borrowing the band names would tell an
 * assessor that 2 means an approved policy exists when the spec says it means
 * a draft (D-114).
 */
export const CLAIM_LEVELS = Object.freeze([
  { level: 0, name: "Not started", meaning: "No awareness, process, owner or evidence." },
  { level: 1, name: "Aware", meaning: "Informal awareness, no structured process." },
  { level: 2, name: "Draft or partial", meaning: "A draft policy, a partial process or inconsistent practice." },
  { level: 3, name: "Defined", meaning: "An approved policy or process exists." },
  { level: 4, name: "Implemented", meaning: "The process or control is in place, with evidence." },
  { level: 5, name: "Operational and monitored", meaning: "In place, evidenced, reviewed periodically and improved." },
] as const);

/** "3 — Defined" — the picker's option, and how a saved claim is named. */
export function claimLevelLabel(level: number): string {
  const found = CLAIM_LEVELS.find((l) => l.level === level);
  return found ? `${level} — ${found.name}` : String(level);
}

// ---------------------------------------------------------------------------
// Evidence in words (F2.3)
// ---------------------------------------------------------------------------

/** What each evidence level means — the spec's "Evidence Level Logic" table (Step G). */
export const EVIDENCE_LEVEL_MEANING: Readonly<Record<number, string>> = Object.freeze({
  0: "No evidence",
  1: "Informal evidence",
  2: "Draft evidence",
  3: "Approved document or process",
  4: "Evidence it is implemented",
  5: "Evidence it is monitored and reviewed",
});

/** The code kept for the tooltip: "E3". */
export function evidenceCode(level: number | null): string {
  return `E${level ?? 0}`;
}

function capFor(level: number | null): number {
  const l = level ?? 0;
  if (!isMaturityLevel(l)) throw new RangeError(`evidence level must be an integer 0–5 (got ${level})`);
  return EVIDENCE_CAP[l];
}

/**
 * One reviewed file, in words: "Reviewed: Partial (evidence level 3 of 5) —
 * supports at most 3". Per FILE it says "supports": an answer counts at the
 * strongest reviewed file it has, so one file alone does not set it.
 * A file awaiting review supports nothing yet.
 */
export function evidenceFileSentence(reviewLabel: string, reviewed: boolean, level: number | null): string {
  if (!reviewed || level === null) return `${reviewLabel} — supports nothing until it is reviewed`;
  return `Reviewed: ${reviewLabel} (evidence level ${level} of 5) — supports at most ${capFor(level)}`;
}

/**
 * The ANSWER's cap, in words (F2.3): "Reviewed: Partial (evidence level 3 of
 * 5) — this answer counts at most 3", or, with nothing reviewed, "No reviewed
 * evidence yet (evidence level 0 of 5) — this answer counts at most 1".
 * `reviewLabel` names the review of the file that set the level, if known.
 */
export function evidenceCapSentence(level: number | null, reviewLabel?: string | null): string {
  if (level === null) return `No reviewed evidence yet (evidence level 0 of 5) — this answer counts at most ${capFor(null)}`;
  const lead = reviewLabel ? `Reviewed: ${reviewLabel}` : "Reviewed evidence";
  return `${lead} (evidence level ${level} of 5) — this answer counts at most ${capFor(level)}`;
}

// ---------------------------------------------------------------------------
// Questions for my role (F2.4)
// ---------------------------------------------------------------------------

/**
 * The bank's "suggested owner" is free text written by the pack's author
 * ("Legal + IT + Process Owners", "Registrar / Exam Cell"), not a role code,
 * so a question is matched to a role by the functions it names.
 *
 * DISPLAY ONLY: a filter the person can switch off. What a role may read or
 * answer is decided by the API and RLS, never by this.
 */
const ROLE_OWNER_TERMS: Readonly<Partial<Record<RoleCode, RegExp>>> = Object.freeze({
  dpdp_owner: /\bDPDP Owner\b|\bCompliance\b/i,
  executive_sponsor: /\bExecutive Sponsor\b/i,
  legal_user: /\bLegal\b/i,
  it_security_user: /\bIT\b|\bSecurity\b|\bCISO\b|\bEngineering\b/i,
  procurement_user: /\bProcurement\b/i,
});

/** The organisation-wide functions; a named owner that is none of these is a department or a process owner. */
const CENTRAL_FUNCTION = /\bDPDP Owner\b|\bCompliance\b|\bExecutive Sponsor\b|\bLegal\b|\bIT\b|\bSecurity\b|\bCISO\b|\bEngineering\b|\bProcurement\b|\bAI Governance\b/i;

/** "Legal + IT + Process Owners" → ["Legal", "IT", "Process Owners"]. */
export function suggestedOwnerParts(suggestedOwner: string | null | undefined): string[] {
  if (!suggestedOwner) return [];
  return suggestedOwner
    .split(/\s*(?:\+|\/|,|&|\band\b)\s*/i)
    .map((p) => p.trim())
    .filter(Boolean);
}

/** Whether a role has questions it can be matched to at all — the filter is offered only then. */
export function roleHasOwnQuestions(role: string): boolean {
  return role === "department_owner" || role in ROLE_OWNER_TERMS;
}

/**
 * Whether a question's suggested owner names the role: a Department Owner
 * matches any department or process owner ("Process Owners", "Registrar /
 * Exam Cell", "Placement Head"); the others match their own function.
 */
export function isQuestionForRole(suggestedOwner: string | null | undefined, role: string): boolean {
  const parts = suggestedOwnerParts(suggestedOwner);
  if (parts.length === 0) return false;
  if (role === "department_owner") return parts.some((p) => !CENTRAL_FUNCTION.test(p));
  const terms = ROLE_OWNER_TERMS[role as RoleCode];
  return terms !== undefined && parts.some((p) => terms.test(p));
}

/** The role whose page opens on "Questions for my role" (F2.4); everyone else opens on all. */
export const ROLE_FILTER_DEFAULT_ROLES: readonly RoleCode[] = Object.freeze(["department_owner"]);

// ---------------------------------------------------------------------------
// Domain pills (N2)
// ---------------------------------------------------------------------------

/**
 * A short name for a domain's pill — the part before the first comma, " / " or
 * " and ": "Retention, erasure and archival" → "Retention". The full name is
 * the panel's heading and the pill's tooltip.
 */
export function domainShortName(name: string): string {
  const short = name.split(/,| \/ | and /)[0]!.trim();
  return short.length > 0 ? short : name;
}
