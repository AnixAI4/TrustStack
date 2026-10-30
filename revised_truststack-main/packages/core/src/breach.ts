/**
 * The breach register (Slice 10, Stage 1) — the rules a personal data breach
 * runs on, as data and pure functions. No I/O and no clock: `now` is always
 * passed in.
 *
 * DPDP anchoring (checked against the Gazette text, G.S.R. 846(E)):
 *
 *   * Rule 7(1) — on becoming aware of a breach, intimate EACH affected Data
 *     Principal, concisely and without delay.
 *   * Rule 7(2)(a) — intimate the Board without delay: what happened, where,
 *     when, and the likely impact.
 *   * Rule 7(2)(b) — within SEVENTY-TWO HOURS of becoming aware, or within
 *     such longer period as the Board may allow on a request made in writing,
 *     the detailed report.
 *   * s.8(6) is the duty; failing it is head 2 of the Schedule (₹200 crore).
 *
 * Seventy-two hours is the Rules'. The 48-hour and 12-hour alerts are
 * TrustStack's own targets and are always labelled so (SLICE_10 pitfall 1).
 *
 * A breach clock is a TIMESTAMP, in UTC, shown in India's time — never a date
 * (pitfall 2). Mirrored in SQL by migration `20261011000000_breach_register`:
 * the database derives the due time, and `tests/unit/breach-register.test.ts`
 * fails if the two ever differ.
 */

import { GAP_OPENING_SEVERITIES } from "./gaps.js";

export class BreachInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BreachInputError";
  }
}

// ---------------------------------------------------------------------------
// Vocabularies
// ---------------------------------------------------------------------------

export const BREACH_NATURES = [
  "unauthorised_access",
  "accidental_disclosure",
  "ransomware",
  "loss_or_destruction",
  "insider_misuse",
  "other",
] as const;
export type BreachNature = (typeof BREACH_NATURES)[number];

export const BREACH_NATURE_LABEL: Readonly<Record<BreachNature, string>> = Object.freeze({
  unauthorised_access: "Unauthorised access",
  accidental_disclosure: "Accidental disclosure",
  ransomware: "Ransomware or malware",
  loss_or_destruction: "Loss or destruction of data",
  insider_misuse: "Misuse by an insider",
  other: "Other",
});

/**
 * `dismissed` = assessed as NOT a personal data breach, with the reason. It
 * stays in the register (nothing is deleted) but no clock runs on it and the
 * exposure model does not count it.
 */
export const BREACH_STATUSES = ["open", "contained", "closed", "dismissed"] as const;
export type BreachStatus = (typeof BREACH_STATUSES)[number];

export const BREACH_STATUS_LABEL: Readonly<Record<BreachStatus, string>> = Object.freeze({
  open: "Open",
  contained: "Contained",
  closed: "Closed",
  dismissed: "Dismissed — not a personal data breach",
});

/**
 * The lifecycle. Closing needs both intimations recorded (a CHECK in SQL);
 * a closed or dismissed breach is reopened before it is changed.
 * Mirrored by `app.breach_transition_allowed()`.
 */
export const BREACH_TRANSITIONS: Readonly<Record<BreachStatus, readonly BreachStatus[]>> = Object.freeze({
  open: ["contained", "closed", "dismissed"],
  contained: ["open", "closed", "dismissed"],
  closed: ["open"],
  dismissed: ["open"],
});

export function canBreachTransition(from: BreachStatus, to: BreachStatus): boolean {
  return BREACH_TRANSITIONS[from]?.includes(to) ?? false;
}

/** The staff's own assessment of the incident; its actions carry it (one actions view, D-067). */
export const BREACH_SEVERITIES = GAP_OPENING_SEVERITIES;
export type BreachSeverity = (typeof BREACH_SEVERITIES)[number];

export const BREACH_TEXT_LIMIT = 4000;
export const BREACH_TITLE_LIMIT = 200;
export const BREACH_REF_LIMIT = 200;

/** The Act received assent on 11 Aug 2023: nothing the organisation became aware of before then is a DPDP breach. */
export const BREACH_EARLIEST_AWARE_AT = "2023-08-10T18:30:00.000Z"; // 11 Aug 2023, 00:00 IST

// ---------------------------------------------------------------------------
// The clock — the Rules' period, and TrustStack's alerts
// ---------------------------------------------------------------------------

/** Rule 7(2)(b): the detailed report is due within seventy-two hours of becoming aware. Statute. */
export const BOARD_REPORT_HOURS = 72;

/** TrustStack's alert points, in hours remaining — a TARGET, never statute (pitfall 1). */
export const BREACH_ALERT_HOURS = Object.freeze({ warning: 48, critical: 12 });

export const BREACH_CLOCK_NOTE =
  "The Rules set one period: the detailed report to the Board within seventy-two hours of becoming aware, or within the longer period the Board allows on a written request (Rule 7(2)(b)). The 48-hour and 12-hour alerts are TrustStack targets, not statutory periods.";

const HOUR_MS = 3_600_000;
const MINUTE_MS = 60_000;
const ISO_INSTANT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,6})?)?(Z|[+-]\d{2}:\d{2})$/;

/** An ISO-8601 instant with an explicit offset — what a timestamp column round-trips as. */
export function isInstant(value: string): boolean {
  return ISO_INSTANT.test(value) && !Number.isNaN(Date.parse(value));
}

function ms(value: string, field: string): number {
  if (!isInstant(value)) throw new BreachInputError(`${field} must be an ISO-8601 instant with an offset (got ${value})`);
  return Date.parse(value);
}

/** Normalised to `…Z`, millisecond precision — the form both copies of the model compare. */
export function toInstant(value: string): string {
  return new Date(ms(value, "instant")).toISOString();
}

/**
 * When the detailed report is due: aware + 72 h, or the time the Board
 * allowed. Derived by the database on every write; never sent by a client.
 */
export function boardReportDueAt(awareAt: string, extensionUntil: string | null): string {
  if (extensionUntil !== null) return toInstant(extensionUntil);
  return new Date(ms(awareAt, "awareAt") + BOARD_REPORT_HOURS * HOUR_MS).toISOString();
}

/** The date in India (UTC+05:30, no daylight saving) of an instant — for windows counted in days. */
export function dateInIndia(instant: string): string {
  return new Date(ms(instant, "instant") + 330 * MINUTE_MS).toISOString().slice(0, 10);
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** `2026-10-12T08:35:00Z` → `12 Oct 2026, 14:05 IST`. Stored in UTC, always shown in India's time. */
export function formatInIndia(instant: string): string {
  const d = new Date(ms(instant, "instant") + 330 * MINUTE_MS);
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}, ${hh}:${mm} IST`;
}

/** `2834` minutes → `47h 14m`; under an hour → `14m`. */
export function formatDuration(minutes: number): string {
  const abs = Math.abs(Math.trunc(minutes));
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

/** The facts of one breach the clock and the counts read — the API's item carries more. */
export interface BreachClockFacts {
  status: BreachStatus;
  awareAt: string;
  /** Derived by the database: aware + 72 h, or the Board's extension. */
  boardReportDueAt: string;
  /** When the detailed report (Rule 7(2)(b)) was made; null until recorded. */
  boardReportAt: string | null;
  /** When the affected Data Principals were intimated (Rule 7(1)); null until recorded. */
  principalsIntimatedAt: string | null;
}

export type BoardClockState = "made" | "running" | "overdue" | "not_applicable";
export type BoardClockUrgency = "normal" | "warning" | "critical" | "overdue";

export interface BoardClock {
  state: BoardClockState;
  dueAt: string;
  /** Whole minutes to the due time; negative once it has passed. Null once made, or when dismissed. */
  minutesRemaining: number | null;
  /** TrustStack's alert band (48 h / 12 h targets) — never statutory. Null once made, or when dismissed. */
  urgency: BoardClockUrgency | null;
  /** Plain words: "47h 14m remaining", "Overdue by 3h 5m", "Made 12 Oct 2026, 14:05 IST". */
  label: string;
}

/**
 * Where the Board report stands at `now`. The due time itself is the Rules'
 * 72 hours, so "exactly 72 hours" is still in time: overdue is strictly
 * after the due instant.
 */
export function boardClock(b: BreachClockFacts, now: string): BoardClock {
  const due = toInstant(b.boardReportDueAt);
  if (b.status === "dismissed") {
    return { state: "not_applicable", dueAt: due, minutesRemaining: null, urgency: null, label: "No clock — dismissed as not a personal data breach" };
  }
  if (b.boardReportAt !== null) {
    const late = ms(b.boardReportAt, "boardReportAt") > Date.parse(due);
    return {
      state: "made",
      dueAt: due,
      minutesRemaining: null,
      urgency: null,
      label: `Made ${formatInIndia(b.boardReportAt)}${late ? " — after the due time" : ""}`,
    };
  }
  const remainingMs = Date.parse(due) - ms(now, "now");
  const minutes = Math.floor(remainingMs / MINUTE_MS);
  if (remainingMs < 0) {
    return { state: "overdue", dueAt: due, minutesRemaining: minutes, urgency: "overdue", label: `Overdue by ${formatDuration(-minutes)}` };
  }
  const hours = remainingMs / HOUR_MS;
  const urgency: BoardClockUrgency =
    hours <= BREACH_ALERT_HOURS.critical ? "critical" : hours <= BREACH_ALERT_HOURS.warning ? "warning" : "normal";
  return { state: "running", dueAt: due, minutesRemaining: minutes, urgency, label: `${formatDuration(minutes)} remaining` };
}

/** Past its due time with no report recorded — the fact head 2's "Exposed" row reads (model 1.1.0). */
export function boardReportOverdue(b: BreachClockFacts, now: string): boolean {
  return b.status !== "dismissed" && b.boardReportAt === null && ms(now, "now") > ms(b.boardReportDueAt, "boardReportDueAt");
}

/** Affected Data Principals not yet recorded as intimated (Rule 7(1)). */
export function principalsPending(b: Pick<BreachClockFacts, "status" | "principalsIntimatedAt">): boolean {
  return b.status !== "dismissed" && b.principalsIntimatedAt === null;
}

// ---------------------------------------------------------------------------
// The overview's counts — counting rows the API returned, nothing more (D-069)
// ---------------------------------------------------------------------------

export interface BreachCounts {
  /** Every incident recorded, dismissed ones included. */
  total: number;
  /** Open or contained. */
  active: number;
  /** The Board report not yet made and still inside its due time (72 h, or the extension). */
  insideWindow: number;
  /** The Board report not yet made and past its due time. */
  overdue: number;
  /** Affected Data Principals not yet recorded as intimated. */
  principalsPending: number;
  closed: number;
  dismissed: number;
}

export function countBreaches(incidents: readonly BreachClockFacts[], now: string): BreachCounts {
  const counts: BreachCounts = { total: incidents.length, active: 0, insideWindow: 0, overdue: 0, principalsPending: 0, closed: 0, dismissed: 0 };
  for (const b of incidents) {
    if (b.status === "dismissed") {
      counts.dismissed += 1;
      continue;
    }
    if (b.status === "closed") counts.closed += 1;
    else counts.active += 1;
    const clock = boardClock(b, now);
    if (clock.state === "running") counts.insideWindow += 1;
    if (clock.state === "overdue") counts.overdue += 1;
    if (principalsPending(b)) counts.principalsPending += 1;
  }
  return counts;
}

// ---------------------------------------------------------------------------
// Calendar months, as Postgres counts them
// ---------------------------------------------------------------------------

/**
 * `day` moved by whole months, clamped to the month's last day — exactly
 * Postgres's `date ± interval 'n months'` (2028-02-29 − 24 months = 2026-02-28).
 */
export function addMonths(day: string, months: number): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !Number.isInteger(months)) throw new BreachInputError(`addMonths(${day}, ${months})`);
  const y = Number(day.slice(0, 4));
  const m = Number(day.slice(5, 7)) - 1 + months;
  const year = y + Math.floor(m / 12);
  const month = ((m % 12) + 12) % 12;
  const last = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const d = Math.min(Number(day.slice(8, 10)), last);
  return `${String(year).padStart(4, "0")}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}
