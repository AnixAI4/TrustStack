/**
 * The rights and grievance register (Slice 10, Stage 2) — the rules a Data
 * Principal's request runs on, as data and pure functions. No I/O and no
 * clock: `today` (the date in India, D-055) is always passed in.
 *
 * DPDP anchoring (checked against the Gazette text, G.S.R. 846(E), and the Act):
 *
 *   * s.11 access to information · s.12 correction, completion, updating and
 *     erasure · s.13 grievance redressal · s.14 nomination. Each is made "in
 *     such manner as may be prescribed": Rule 14(1)–(2) — the means and the
 *     identifiers the fiduciary publishes; Rule 14(4) — nominating one or
 *     more individuals.
 *   * Rule 14(3) — respond to grievances "within a reasonable period not
 *     exceeding ninety days" under the published grievance redressal system;
 *     s.13(2) counts it "from the date of its receipt". The Rules set no
 *     separate period for the other rights: those requests run through the
 *     same system, so the same ceiling is applied to every request.
 *
 * Ninety days is the Rules'. The 30-day response target is TrustStack's own,
 * from the old app's DSR SLA, and is always labelled so (SLICE_10 pitfall 1).
 *
 * A request's clock is DAYS, counted on India's calendar from the date it was
 * received — `todayInIndia()` is the right clock here (pitfall 2 is about
 * hours). Mirrored in SQL by migration `20261012000000_rights_register`:
 * the database derives the code and the respond-by date.
 */

import { addDays } from "./forecast.js";
import { isCalendarDate } from "./gaps.js";

export class RightsInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RightsInputError";
  }
}

// ---------------------------------------------------------------------------
// Vocabularies
// ---------------------------------------------------------------------------

/** What the Data Principal asked for — the Act's own list (s.11–14). */
export const RIGHTS_KINDS = ["access", "correction", "completion", "updating", "erasure", "nomination", "grievance"] as const;
export type RightsKind = (typeof RIGHTS_KINDS)[number];

export const RIGHTS_KIND_LABEL: Readonly<Record<RightsKind, string>> = Object.freeze({
  access: "Access to information",
  correction: "Correction",
  completion: "Completion",
  updating: "Updating",
  erasure: "Erasure",
  nomination: "Nomination",
  grievance: "Grievance",
});

/** The provision each kind exercises, for the register and the reports. */
export const RIGHTS_KIND_PROVISION: Readonly<Record<RightsKind, string>> = Object.freeze({
  access: "s.11",
  correction: "s.12(2)(a)",
  completion: "s.12(2)(b)",
  updating: "s.12(2)(c)",
  erasure: "s.12(3)",
  nomination: "s.14, Rule 14(4)",
  grievance: "s.13, Rule 14(3)",
});

/**
 * Two families, two codes: a grievance (s.13) is `GRV-…`; a request to
 * exercise any other right is `DPR-…` (Data Principal request). A request
 * may change kind within its family, never across it — the code names it.
 */
export type RightsFamily = "request" | "grievance";

export function rightsFamily(kind: RightsKind): RightsFamily {
  return kind === "grievance" ? "grievance" : "request";
}

export const RIGHTS_CODE_PREFIX: Readonly<Record<RightsFamily, string>> = Object.freeze({ request: "DPR", grievance: "GRV" });

/**
 * `responded` = the organisation answered, with its outcome. `withdrawn` = the
 * person withdrew it. `void` = entered in error, with the reason. Nothing is
 * deleted; a withdrawn or void request runs no clock and counts nowhere in
 * the model.
 */
export const RIGHTS_STATUSES = ["open", "responded", "withdrawn", "void"] as const;
export type RightsStatus = (typeof RIGHTS_STATUSES)[number];

export const RIGHTS_STATUS_LABEL: Readonly<Record<RightsStatus, string>> = Object.freeze({
  open: "Open",
  responded: "Responded",
  withdrawn: "Withdrawn by the person",
  void: "Void — entered in error",
});

/**
 * The lifecycle. A responded, withdrawn or void request is a record: reopen
 * it to change it. Mirrored by `app.rights_transition_allowed()`.
 */
export const RIGHTS_TRANSITIONS: Readonly<Record<RightsStatus, readonly RightsStatus[]>> = Object.freeze({
  open: ["responded", "withdrawn", "void"],
  responded: ["open"],
  withdrawn: ["open"],
  void: ["open"],
});

export function canRightsTransition(from: RightsStatus, to: RightsStatus): boolean {
  return RIGHTS_TRANSITIONS[from]?.includes(to) ?? false;
}

/** How the organisation answered. Partly fulfilled or declined needs the reason in the response. */
export const RIGHTS_OUTCOMES = ["fulfilled", "partly_fulfilled", "declined"] as const;
export type RightsOutcome = (typeof RIGHTS_OUTCOMES)[number];

/** A grievance is resolved or not upheld; a request is fulfilled or declined. Same codes, the family's words. */
export const RIGHTS_OUTCOME_LABEL: Readonly<Record<RightsFamily, Readonly<Record<RightsOutcome, string>>>> = Object.freeze({
  request: Object.freeze({ fulfilled: "Fulfilled", partly_fulfilled: "Partly fulfilled", declined: "Declined" }),
  grievance: Object.freeze({ fulfilled: "Resolved", partly_fulfilled: "Partly resolved", declined: "Not upheld" }),
});

/** How it reached the organisation — Rule 14(1)(a) asks the fiduciary to publish the means. */
export const RIGHTS_CHANNELS = ["email", "web_form", "phone", "letter", "in_person", "other"] as const;
export type RightsChannel = (typeof RIGHTS_CHANNELS)[number];

export const RIGHTS_CHANNEL_LABEL: Readonly<Record<RightsChannel, string>> = Object.freeze({
  email: "Email",
  web_form: "Web form",
  phone: "Phone",
  letter: "Letter",
  in_person: "In person",
  other: "Other",
});

/**
 * Who made it. A nominee acts on the person's death or incapacity (s.14); a
 * parent or lawful guardian is the Data Principal for a child or a person
 * with disability (s.2(j)).
 */
export const RIGHTS_CAPACITIES = ["self", "nominee", "guardian"] as const;
export type RightsCapacity = (typeof RIGHTS_CAPACITIES)[number];

export const RIGHTS_CAPACITY_LABEL: Readonly<Record<RightsCapacity, string>> = Object.freeze({
  self: "The Data Principal",
  nominee: "A nominee (s.14)",
  guardian: "A parent or lawful guardian",
});

export const RIGHTS_TEXT_LIMIT = 4000;
export const RIGHTS_NAME_LIMIT = 200;
export const RIGHTS_SHORT_LIMIT = 500;

/** The Act received assent on 11 Aug 2023: no request under it was received before. */
export const RIGHTS_EARLIEST_RECEIVED_ON = "2023-08-11";

/**
 * Fulfilling a request discloses or changes someone's personal data, so it
 * needs the person identified first (Rule 14(1)(b), (2), (5)). A grievance,
 * or a request declined, does not.
 */
export function needsIdentity(kind: RightsKind, outcome: RightsOutcome): boolean {
  return kind !== "grievance" && outcome !== "declined";
}

// ---------------------------------------------------------------------------
// The clock — the Rules' ceiling, and TrustStack's target
// ---------------------------------------------------------------------------

/** Rule 14(3): a response within a reasonable period not exceeding ninety days of receipt. Statute. */
export const RIGHTS_CEILING_DAYS = 90;

/** TrustStack's response target — a TARGET, never statute (pitfall 1). */
export const RIGHTS_TARGET_DAYS = 30;

export const RIGHTS_CLOCK_NOTE =
  "The Rules set one period: a response within a reasonable period not exceeding ninety days of receipt, under the grievance redressal system the organisation publishes (Rule 14(3)); requests to exercise the other rights run through the same system. The 30-day response target is TrustStack's, not a statutory period.";

const DAY_MS = 86_400_000;
const utc = (d: string) => Date.UTC(Number(d.slice(0, 4)), Number(d.slice(5, 7)) - 1, Number(d.slice(8, 10)));

function day(value: string, field: string): string {
  if (!isCalendarDate(value)) throw new RightsInputError(`${field} must be a calendar date, YYYY-MM-DD (got ${value})`);
  return value;
}

/** Whole days from `from` to `to` (negative if `to` is earlier). */
export function calendarDaysBetween(from: string, to: string): number {
  return Math.round((utc(day(to, "to")) - utc(day(from, "from"))) / DAY_MS);
}

/** The last day a response is in time: receipt + 90 days. Derived by the database; never sent by a client. */
export function respondBy(receivedOn: string): string {
  return addDays(day(receivedOn, "receivedOn"), RIGHTS_CEILING_DAYS);
}

/** TrustStack's target: receipt + 30 days. */
export function targetBy(receivedOn: string): string {
  return addDays(day(receivedOn, "receivedOn"), RIGHTS_TARGET_DAYS);
}

/** The facts of one request the clock and the counts read — the API's item carries more. */
export interface RightsClockFacts {
  kind: RightsKind;
  status: RightsStatus;
  /** `YYYY-MM-DD`, the date in India it reached the organisation. */
  receivedOn: string;
  /** `YYYY-MM-DD`; null until responded. */
  respondedOn: string | null;
}

export type RightsClockState = "within_target" | "past_target" | "overdue" | "responded" | "responded_late" | "not_applicable";

export interface RightsClock {
  state: RightsClockState;
  /** The Rules' ceiling: receipt + 90 days. */
  respondBy: string;
  /** TrustStack's target: receipt + 30 days. */
  targetBy: string;
  /** Days since receipt: on the day received, 0. At the response, when responded. Null when withdrawn or void. */
  daysOpen: number | null;
  /** Plain words: "Day 12 of 90", "Overdue — day 95, past the 90-day ceiling", "Responded on day 21". */
  label: string;
}

/**
 * Where a request stands on `today` (India). The ceiling is the Rules'
 * ninety days, so day 90 is still in time: overdue is strictly after
 * receipt + 90. Past the target is strictly after receipt + 30.
 */
export function rightsClock(r: RightsClockFacts, today: string): RightsClock {
  const by = respondBy(r.receivedOn);
  const target = targetBy(r.receivedOn);
  if (r.status === "withdrawn" || r.status === "void") {
    return { state: "not_applicable", respondBy: by, targetBy: target, daysOpen: null, label: `No clock — ${RIGHTS_STATUS_LABEL[r.status].toLowerCase()}` };
  }
  if (r.status === "responded") {
    const on = r.respondedOn === null ? null : calendarDaysBetween(r.receivedOn, r.respondedOn);
    const late = on !== null && on > RIGHTS_CEILING_DAYS;
    return {
      state: late ? "responded_late" : "responded",
      respondBy: by,
      targetBy: target,
      daysOpen: on,
      label: on === null ? "Responded" : late ? `Responded on day ${on} — after the 90-day ceiling` : `Responded on day ${on}`,
    };
  }
  const open = calendarDaysBetween(r.receivedOn, day(today, "today"));
  if (open > RIGHTS_CEILING_DAYS) {
    return { state: "overdue", respondBy: by, targetBy: target, daysOpen: open, label: `Overdue — day ${open}, past the 90-day ceiling` };
  }
  if (open > RIGHTS_TARGET_DAYS) {
    return {
      state: "past_target",
      respondBy: by,
      targetBy: target,
      daysOpen: open,
      label: `Day ${open} of 90 — past TrustStack's 30-day target`,
    };
  }
  return { state: "within_target", respondBy: by, targetBy: target, daysOpen: open, label: `Day ${Math.max(open, 0)} of 90` };
}

/** Open past the Rules' ninety days — the fact head 7's "Exposed" row reads (model 1.2.0). */
export function rightsCeilingOverdue(r: Pick<RightsClockFacts, "status" | "receivedOn">, today: string): boolean {
  return r.status === "open" && calendarDaysBetween(r.receivedOn, today) > RIGHTS_CEILING_DAYS;
}

/** Open past TrustStack's 30-day target but still inside the ninety days — a reason, never a status (1.2.0). */
export function rightsPastTarget(r: Pick<RightsClockFacts, "status" | "receivedOn">, today: string): boolean {
  if (r.status !== "open") return false;
  const open = calendarDaysBetween(r.receivedOn, today);
  return open > RIGHTS_TARGET_DAYS && open <= RIGHTS_CEILING_DAYS;
}

// ---------------------------------------------------------------------------
// The overview's counts — counting rows the API returned, nothing more (D-069)
// ---------------------------------------------------------------------------

export interface RightsCounts {
  /** Every request and grievance recorded, withdrawn and void included. */
  total: number;
  /** Open requests to exercise a right (not grievances). */
  openRequests: number;
  /** Open grievances. */
  openGrievances: number;
  /** Open, past TrustStack's 30-day target, inside the ninety days. */
  pastTarget: number;
  /** Open past the Rules' ninety days. */
  overdue: number;
  /** Overdue grievances alone — the overview's own line. */
  overdueGrievances: number;
  responded: number;
  /** Responded, but after the ninety days. */
  respondedLate: number;
  /** Withdrawn by the person, or void. */
  closedOtherwise: number;
}

export function countRights(requests: readonly RightsClockFacts[], today: string): RightsCounts {
  const counts: RightsCounts = {
    total: requests.length,
    openRequests: 0,
    openGrievances: 0,
    pastTarget: 0,
    overdue: 0,
    overdueGrievances: 0,
    responded: 0,
    respondedLate: 0,
    closedOtherwise: 0,
  };
  for (const r of requests) {
    const clock = rightsClock(r, today);
    if (clock.state === "not_applicable") {
      counts.closedOtherwise += 1;
      continue;
    }
    if (r.status === "responded") {
      counts.responded += 1;
      if (clock.state === "responded_late") counts.respondedLate += 1;
      continue;
    }
    if (r.kind === "grievance") counts.openGrievances += 1;
    else counts.openRequests += 1;
    if (clock.state === "past_target") counts.pastTarget += 1;
    if (clock.state === "overdue") {
      counts.overdue += 1;
      if (r.kind === "grievance") counts.overdueGrievances += 1;
    }
  }
  return counts;
}
