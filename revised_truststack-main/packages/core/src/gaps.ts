/**
 * The gap register and its remediation actions (Slice 6). Pure functions, no
 * I/O, no clock — a date is always passed in.
 *
 * DPDP anchoring: a score tells a Data Fiduciary where it stands; a gap
 * register tells it what to do, who does it and by when. That documented,
 * owned, dated remediation plan is what the accountability duty and Rule 6's
 * "reasonable security safeguards" demand in practice.
 *
 * Four things here are deliberate and easy to get wrong:
 *
 * 1. **A gap opens at adjusted ≤ 3, a red flag fires at adjusted ≤ 2.** They
 *    are different thresholds for different things — one is work to do, the
 *    other caps the score — and merging them silently drops every "Low" gap
 *    (D-054, D-046).
 * 2. **Severity is read off the ADJUSTED score, never recomputed from the
 *    claim.** The generator consumes the engine's own `ScoredQuestion`s.
 * 3. **A gap's priority comes from its severity**, which is always present —
 *    not from the question's authored priority, which is null on 234 bank
 *    questions and is never guessed.
 * 4. **Closing takes more than a promise** (D-056): accepted evidence on the
 *    action, or a reviewer who is not the action's owner.
 *
 * Mirrored in SQL by `…_gaps_actions/migration.sql`, which is what actually
 * generates a register; `apps/web/tests/unit/gap-register.test.ts` parses that
 * migration and fails if the two ever differ (D-053).
 */

import { DOMAIN_CODES, type DomainCode } from "./domains.js";
import {
  GAP_SEVERITIES,
  questionPriority,
  type DomainResult,
  type GapPriority,
  type GapSeverity,
} from "./engine.js";
import { ScoringInputError } from "./scoring.js";

// ---------------------------------------------------------------------------
// The threshold
// ---------------------------------------------------------------------------

/**
 * An applicable answer whose adjusted score is **3 or below** opens a gap —
 * the workbook's `Gap_Action_Tracker!D` (`IF(Responses!$J2<=3, "Yes", "No")`).
 *
 * 3 of 5 is "Implementing", not done; a register that stayed silent about it
 * would make the 90-day plan look shorter than it is (D-054).
 */
export const GAP_MAX_ADJUSTED = 3;

export function opensGap(adjusted: number): boolean {
  if (!Number.isInteger(adjusted) || adjusted < 0 || adjusted > 5) {
    throw new ScoringInputError(`adjusted score must be an integer 0–5 (got ${adjusted})`);
  }
  return adjusted <= GAP_MAX_ADJUSTED;
}

// ---------------------------------------------------------------------------
// Due dates — the 30/60/90 roadmap
// ---------------------------------------------------------------------------

/**
 * Days from the day a gap is first opened to its default due date (D-055).
 * `null` means "next assessment cycle": a Low gap is real work, but it is not
 * part of the 90-day sprint and gets no invented date.
 */
export const GAP_DUE_DAYS: Readonly<Record<GapPriority, number | null>> = Object.freeze({
  P0: 30,
  P1: 60,
  P2: 90,
  P3: null,
  Monitor: null,
});

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

function parseIsoDate(value: string): number {
  const m = ISO_DATE.exec(value);
  const ms = m ? Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : NaN;
  // Round-trip, so 2026-02-31 is refused rather than rolled into March.
  if (!m || new Date(ms).toISOString().slice(0, 10) !== value) {
    throw new ScoringInputError(`expected a calendar date as YYYY-MM-DD (got ${value})`);
  }
  return ms;
}

/** True for a real calendar date written `YYYY-MM-DD` — what a due date must be. */
export function isCalendarDate(value: string): boolean {
  try {
    parseIsoDate(value);
    return true;
  } catch {
    return false;
  }
}

const DAY_MS = 86_400_000;

/**
 * The default due date for a gap of this priority opened on `from`
 * (`YYYY-MM-DD`), or null for "next cycle". Calendar-date arithmetic only: no
 * clock and no time zone in here — the caller says what "today" is.
 */
export function dueDate(priority: GapPriority, from: string): string | null {
  const days = GAP_DUE_DAYS[priority];
  if (days === undefined) throw new ScoringInputError(`unknown gap priority ${String(priority)}`);
  const start = parseIsoDate(from);
  return days === null ? null : new Date(start + days * DAY_MS).toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// Generating gaps from the engine's own output
// ---------------------------------------------------------------------------

export interface GeneratedGap {
  questionCode: string;
  domainCode: DomainCode;
  /** The adjusted score the gap was opened for. */
  adjusted: number;
  severity: GapSeverity;
  priority: GapPriority;
}

/**
 * One gap per applicable answer at or below the threshold.
 *
 * Three kinds of question produce NO gap, and they are different facts:
 * a **Scoped Out** domain has no questions at all (D-038); a **Not
 * Applicable** answer was excluded with a reason; an **unanswered** question
 * is outstanding — not yet assessed, which is not the same as assessed and
 * found weak. `DomainResult.questions` already holds only applicable answers.
 */
export function generateGaps(domains: readonly DomainResult[]): GeneratedGap[] {
  const gaps: GeneratedGap[] = [];
  for (const domain of domains) {
    for (const q of domain.questions) {
      if (!opensGap(q.adjusted)) continue;
      gaps.push({
        questionCode: q.questionCode,
        domainCode: domain.code,
        adjusted: q.adjusted,
        severity: q.severity,
        priority: questionPriority(q.severity),
      });
    }
  }
  return gaps.sort(compareGaps);
}

/** Most severe first, then the model's domain order, then the question code. */
export function compareGaps(
  a: Pick<GeneratedGap, "severity" | "domainCode" | "questionCode">,
  b: Pick<GeneratedGap, "severity" | "domainCode" | "questionCode">,
): number {
  return (
    GAP_SEVERITIES.indexOf(b.severity) - GAP_SEVERITIES.indexOf(a.severity) ||
    DOMAIN_CODES.indexOf(a.domainCode) - DOMAIN_CODES.indexOf(b.domainCode) ||
    a.questionCode.localeCompare(b.questionCode, "en", { numeric: true })
  );
}

/** The severities a gap can carry: everything at or below the threshold. */
export const GAP_OPENING_SEVERITIES = ["critical", "high", "medium", "low"] as const satisfies readonly GapSeverity[];

// ---------------------------------------------------------------------------
// A gap's state across regeneration
// ---------------------------------------------------------------------------

/**
 * `open` — the current answers still open this gap.
 * `superseded` — they no longer do (the answer now scores above the
 * threshold, or was marked Not Applicable), but somebody had already worked
 * on its action, so the row is kept rather than silently discarded (D-057).
 */
export const GAP_STATES = ["open", "superseded"] as const;
export type GapState = (typeof GAP_STATES)[number];

// ---------------------------------------------------------------------------
// The action workflow
// ---------------------------------------------------------------------------

export const GAP_ACTION_STATUSES = ["open", "in_progress", "blocked", "closed"] as const;
export type GapActionStatus = (typeof GAP_ACTION_STATUSES)[number];

export const GAP_ACTION_STATUS_LABEL: Readonly<Record<GapActionStatus, string>> = Object.freeze({
  open: "Open",
  in_progress: "In Progress",
  blocked: "Blocked",
  closed: "Closed",
});

/**
 * The legal moves, as data — the API and the database enforce the same graph.
 *
 * A Blocked action cannot be closed directly: whatever blocked it has to be
 * cleared first. A Closed action can be reopened, to In Progress only — a
 * closure found to be wrong must be reversible, and the audit log keeps both
 * events (D-056).
 */
export const GAP_ACTION_TRANSITIONS: Readonly<Record<GapActionStatus, readonly GapActionStatus[]>> = Object.freeze({
  open: ["in_progress", "blocked", "closed"],
  in_progress: ["open", "blocked", "closed"],
  blocked: ["open", "in_progress"],
  closed: ["in_progress"],
});

export function canTransition(from: GapActionStatus, to: GapActionStatus): boolean {
  return GAP_ACTION_TRANSITIONS[from]?.includes(to) ?? false;
}

// ---------------------------------------------------------------------------
// Closing
// ---------------------------------------------------------------------------

/**
 * How a closed action was justified. Stored, so a report can say which.
 * `erasure_recorded` (Slice 10, Stage 5) is for a retention schedule's action
 * only: the erasure is recorded on the schedule for its current cycle, by
 * someone who is not the action's owner — two people, as ever (D-056).
 */
export const CLOSURE_BASES = ["evidence", "reviewer_approval", "erasure_recorded"] as const;
export type ClosureBasis = (typeof CLOSURE_BASES)[number];

/**
 * The review verdicts that count as accepted evidence for closing. Pending is
 * not a verdict; Partial, Rejected and Outdated do not show the work is done.
 */
export const CLOSING_REVIEW_STATUSES = ["adequate", "strong"] as const;

export interface ClosureAttempt {
  /** The action's owner, or null when nobody has been assigned. */
  ownerUserId: string | null;
  closedByUserId: string;
  /** Does the person closing hold `evidence.review`? */
  closerCanReview: boolean;
  /** Is a stored artefact, reviewed as Adequate or Strong, attached to the action? */
  hasAcceptedEvidence: boolean;
  /**
   * A retention schedule's action only (Stage 5): is an erasure recorded on
   * the schedule for its current cycle by someone who is not the owner?
   */
  hasErasureByAnother?: boolean;
}

export type ClosureDecision =
  | { allowed: true; basis: ClosureBasis }
  | { allowed: false; reason: "no_owner" | "no_evidence_or_reviewer" };

/**
 * May this action be closed, and on what basis? (D-056)
 *
 * An action is never closable on a promise:
 * - it must have an owner — an unowned action has nobody who did the work;
 * - and EITHER accepted evidence is attached (which already took a second
 *   person: nobody reviews their own upload, D-043),
 * - OR the person closing is a reviewer and is not the owner.
 *
 * - OR (a retention schedule's action) the erasure is recorded on its
 *   schedule by someone who is not its owner.
 *
 * Either way two people are involved. When several hold, evidence comes
 * first, then the erasure, then the reviewer.
 */
export function closureDecision(attempt: ClosureAttempt): ClosureDecision {
  if (attempt.ownerUserId === null) return { allowed: false, reason: "no_owner" };
  if (attempt.hasAcceptedEvidence) return { allowed: true, basis: "evidence" };
  if (attempt.hasErasureByAnother) return { allowed: true, basis: "erasure_recorded" };
  if (attempt.closerCanReview && attempt.closedByUserId !== attempt.ownerUserId) {
    return { allowed: true, basis: "reviewer_approval" };
  }
  return { allowed: false, reason: "no_evidence_or_reviewer" };
}

export const CLOSURE_REFUSAL_MESSAGE: Readonly<Record<"no_owner" | "no_evidence_or_reviewer", string>> = Object.freeze({
  no_owner: "Assign an owner before closing this action.",
  no_evidence_or_reviewer:
    "Closing needs reviewed evidence attached to this action, or approval by a reviewer who is not its owner.",
});

/** The same refusal for a retention schedule's action, which may also close on the recorded erasure (Stage 5). */
export const RETENTION_CLOSURE_REFUSAL_MESSAGE =
  "Closing needs reviewed evidence attached to this action, the erasure recorded on its schedule by someone other than its owner, or approval by a reviewer who is not its owner.";

// ---------------------------------------------------------------------------
// The roadmap
// ---------------------------------------------------------------------------

/**
 * Where an action sits on the 30/60/90 roadmap, relative to `today`.
 * `later` is beyond 90 days; `next_cycle` has no due date at all.
 */
export const ROADMAP_WINDOWS = ["overdue", "days_30", "days_60", "days_90", "later", "next_cycle"] as const;
export type RoadmapWindow = (typeof ROADMAP_WINDOWS)[number];

export const ROADMAP_WINDOW_LABEL: Readonly<Record<RoadmapWindow, string>> = Object.freeze({
  overdue: "Overdue",
  days_30: "Next 30 days",
  days_60: "31–60 days",
  days_90: "61–90 days",
  later: "After 90 days",
  next_cycle: "Next assessment cycle",
});

/** Both dates as `YYYY-MM-DD`. A due date of today is not overdue. */
export function roadmapWindow(due: string | null, today: string): RoadmapWindow {
  const now = parseIsoDate(today);
  if (due === null) return "next_cycle";
  const days = Math.round((parseIsoDate(due) - now) / DAY_MS);
  if (days < 0) return "overdue";
  if (days <= 30) return "days_30";
  if (days <= 60) return "days_60";
  if (days <= 90) return "days_90";
  return "later";
}

/** A closed action is done; it is never overdue, whatever its date says. */
export function isOverdue(status: GapActionStatus, due: string | null, today: string): boolean {
  return status !== "closed" && roadmapWindow(due, today) === "overdue";
}
