/**
 * The retention register (Slice 10, Stage 5) — how long a processing
 * activity's personal data is kept, when it must be erased, and the record
 * that it was. Data and pure functions: no I/O and no clock — `today` (the
 * date in India, D-055) is always passed in.
 *
 * DPDP anchoring (checked against the Act and the Gazette text, G.S.R. 846(E)):
 *
 *   * s.8(7) — unless a law needs it kept, erase personal data when consent is
 *     withdrawn or as soon as it is reasonable to assume the specified purpose
 *     is no longer served, whichever is earlier; and (b) cause the Data
 *     Processor to erase what was made available to it.
 *   * Rule 8(3) — EVERY fiduciary keeps the personal data, the associated
 *     traffic data and the other logs of the processing for at least ONE YEAR
 *     from the processing, then has them erased unless another law needs
 *     longer. A floor for every client: no schedule is shorter.
 *   * Rule 8(1)–(2) and the Third Schedule — ONLY an e-commerce entity with
 *     ≥ 2 crore registered users, an online gaming intermediary with ≥ 50 lakh
 *     or a social media intermediary with ≥ 2 crore: the purpose is deemed no
 *     longer served after three years without the person approaching it, and
 *     the person is told at least forty-eight hours before the erasure. The
 *     class is RECORDED by a person, never inferred from size or sector
 *     (pitfall 1; D-028's rule, by analogy).
 *
 * An erasure COUNTS — clears the overdue state and closes an action — only
 * when it is complete under s.8(7)(b) (every processor that held the data was
 * told to erase it, or none held it) and has not been marked as recorded in
 * error by someone other than its recorder (D-096, R2 and R4).
 *
 * A schedule's END DATE is the database's (migration
 * `20261017000000_retention_ai_risk`): the day its clock starts plus its
 * period, in whole calendar months as Postgres counts them. No end recorded
 * (the clock has not started) is a reason on head 7, never a status (D-094.1);
 * past the end with no erasure recorded for the current cycle sets head 7
 * Exposed (model 1.5.0).
 */

import { addMonths } from "./breach.js";
import { addDays } from "./forecast.js";
import { isCalendarDate } from "./gaps.js";

export class RetentionInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RetentionInputError";
  }
}

// ---------------------------------------------------------------------------
// Vocabularies
// ---------------------------------------------------------------------------

/** What ends the retention — the Act's two events, a period, a law; and Rule 8(1) for a Third-Schedule class only. */
export const RETENTION_BASES = ["purpose_served", "consent_withdrawn", "fixed_period", "legal_requirement", "deemed_inactivity"] as const;
export type RetentionBasis = (typeof RETENTION_BASES)[number];

export const RETENTION_BASIS_LABEL: Readonly<Record<RetentionBasis, string>> = Object.freeze({
  purpose_served: "When the purpose is served",
  consent_withdrawn: "When consent is withdrawn",
  fixed_period: "A fixed period",
  legal_requirement: "A law requires keeping it",
  deemed_inactivity: "Three years without contact (Third Schedule)",
});

export const RETENTION_BASIS_PROVISION: Readonly<Record<RetentionBasis, string>> = Object.freeze({
  purpose_served: "s.8(7)(a)",
  consent_withdrawn: "s.8(7)(a)",
  fixed_period: "s.8(7), Rule 8(3)",
  legal_requirement: "s.8(7), Rule 8(3)",
  deemed_inactivity: "Rule 8(1), Third Schedule",
});

/**
 * What the schedule's start date means, for each basis — the day its clock
 * starts. Rule 8(3) counts its year "from the date of such processing", so for
 * every basis but the Third Schedule's it is the LAST DAY THE DATA WAS
 * PROCESSED (D-096, R1); the Third Schedule counts from the last approach.
 */
export const RETENTION_START_LABEL: Readonly<Record<RetentionBasis, string>> = Object.freeze({
  purpose_served: "The last day this data was processed (the purpose served)",
  consent_withdrawn: "The last day this data was processed (consent withdrawn)",
  fixed_period: "The last day this data was processed (the period starts)",
  legal_requirement: "The last day this data was processed (the law's period starts)",
  deemed_inactivity: "The day the Data Principals last approached the organisation",
});

/** Rule 8(3): at least one year from the processing, for every fiduciary. */
export const RETENTION_MIN_MONTHS = 12;
/** A sanity ceiling, not a rule: a century. */
export const RETENTION_MAX_MONTHS = 1200;
/** Rule 8(1), Third Schedule: three years without the person approaching the fiduciary. */
export const RETENTION_DEEMED_MONTHS = 36;
/**
 * Rule 8(2): forty-eight hours before the period completes. The register keeps
 * dates, so the person is to be told two calendar days before the end date.
 */
export const RETENTION_NOTICE_DAYS = 2;
/**
 * The Third Schedule counts its three years from the person's last approach
 * "or the commencement of the Digital Personal Data Protection Rules, 2025,
 * whichever is latest". Read here as the Rules' publication, 13 November 2025
 * — FOR COUNSEL TO CONFIRM (Rule 8 itself commences on 13 May 2027).
 */
export const RETENTION_RULES_COMMENCED_ON = "2025-11-13";
/** No retention under the Act starts before it received assent (11 Aug 2023). */
export const RETENTION_EARLIEST_ON = "2023-08-11";
export const RETENTION_TEXT_LIMIT = 2000;
export const RETENTION_NAME_LIMIT = 200;

/** The Third Schedule's three classes (Rule 8(1)). Recorded by a person; null = none, the default. */
export const THIRD_SCHEDULE_CLASSES = ["ecommerce", "online_gaming", "social_media"] as const;
export type ThirdScheduleClass = (typeof THIRD_SCHEDULE_CLASSES)[number];

export const THIRD_SCHEDULE_CLASS_LABEL: Readonly<Record<ThirdScheduleClass, string>> = Object.freeze({
  ecommerce: "E-commerce entity with at least two crore registered users in India",
  online_gaming: "Online gaming intermediary with at least fifty lakh registered users in India",
  social_media: "Social media intermediary with at least two crore registered users in India",
});

/** How the data was erased. */
export const ERASURE_METHODS = ["deleted", "anonymised", "destroyed", "other"] as const;
export type ErasureMethod = (typeof ERASURE_METHODS)[number];

export const ERASURE_METHOD_LABEL: Readonly<Record<ErasureMethod, string>> = Object.freeze({
  deleted: "Deleted from the systems that held it",
  anonymised: "Anonymised irreversibly",
  destroyed: "Physical records destroyed",
  other: "Another way (described)",
});

/** "Recorded in error": the reason, in words — never the erased personal data (D-096, R4). */
export const ERASURE_VOID_REASON_LIMIT = 500;

/** s.8(7)(b): was each processor that held it told to erase it? */
export const PROCESSOR_ERASURE_ANSWERS = ["yes", "no", "not_applicable"] as const;
export type ProcessorErasureAnswer = (typeof PROCESSOR_ERASURE_ANSWERS)[number];

export const PROCESSOR_ERASURE_LABEL: Readonly<Record<ProcessorErasureAnswer, string>> = Object.freeze({
  yes: "Yes — every processor that held it was told to erase it",
  no: "No — not yet",
  not_applicable: "No processor held it",
});

export const RETENTION_NOTE =
  "Every organisation keeps personal data, traffic data and processing logs for at least one year from the last day the data was processed (Rule 8(3)), then erases them unless another law needs them kept longer, and has its processors erase them too (s.8(7)). During the year Rule 8(3) requires, the data is held only for the purposes in the Seventh Schedule — not used for the original purpose. The three-year period and the 48-hour notice of Rule 8(1)–(2) apply only to the classes in the Third Schedule.";

/**
 * The Third Schedule's own words on its three years (D-096, R3): two purposes
 * are outside it, and its start is read as 13 November 2025 — the earlier,
 * conservative date; Rule 1 commences Rule 8 itself on 13 May 2027.
 */
export const RETENTION_DEEMED_NOTE =
  "Third Schedule: three years from the day the person last approached the organisation or exercised their rights, or from the Rules' commencement — read here as 13 November 2025, the earlier date (counsel to confirm). Not counted against this period: data kept so the person can access their user account, or a virtual token issued by or for the organisation, stored on its platform, that can be used to get money, goods or services.";

// ---------------------------------------------------------------------------
// The end date — the database derives it; this is the same rule, for checks
// ---------------------------------------------------------------------------

function day(value: string, field: string): string {
  if (!isCalendarDate(value)) throw new RetentionInputError(`${field} must be a calendar date, YYYY-MM-DD (got ${value})`);
  return value;
}

/** The period a basis runs for: Rule 8(1)'s three years for the deemed basis, else the schedule's own. */
export function retentionPeriodMonths(basis: RetentionBasis, periodMonths: number): number {
  return basis === "deemed_inactivity" ? RETENTION_DEEMED_MONTHS : periodMonths;
}

/**
 * The day the retention ends: the start plus the period in calendar months
 * (Postgres's `date + interval`). Null when no start is recorded — the clock
 * has not started, so no end is recorded. The deemed basis counts from the
 * later of the last approach and the Rules' commencement (Third Schedule).
 */
export function retentionEndsOn(basis: RetentionBasis, startsOn: string | null, periodMonths: number): string | null {
  if (startsOn === null) return null;
  const from = basis === "deemed_inactivity" && day(startsOn, "startsOn") < RETENTION_RULES_COMMENCED_ON ? RETENTION_RULES_COMMENCED_ON : day(startsOn, "startsOn");
  return addMonths(from, retentionPeriodMonths(basis, periodMonths));
}

/** Rule 8(2): the day by which the Data Principal is told — Third-Schedule (deemed) schedules only. */
export function retentionInformBy(basis: RetentionBasis, endsOn: string | null): string | null {
  return basis === "deemed_inactivity" && endsOn !== null ? addDays(endsOn, -RETENTION_NOTICE_DAYS) : null;
}

/** Why a schedule is refused, in words — the CHECKs' rules, earlier. Null when it is fine. */
export function retentionScheduleProblem(s: {
  basis: RetentionBasis;
  periodMonths: number;
  lawName: string | null;
  thirdScheduleClass: ThirdScheduleClass | null;
}): { field: string; message: string } | null {
  if (s.basis === "deemed_inactivity") {
    if (s.thirdScheduleClass === null) {
      return {
        field: "basis",
        message: "The three-year period of Rule 8(1) applies only to an organisation in a Third-Schedule class — record the class first.",
      };
    }
    if (s.periodMonths !== RETENTION_DEEMED_MONTHS) {
      return { field: "periodMonths", message: "The Third Schedule sets the period: three years (36 months)." };
    }
  }
  if (!Number.isInteger(s.periodMonths) || s.periodMonths < RETENTION_MIN_MONTHS) {
    return {
      field: "periodMonths",
      message: "Personal data, traffic data and logs are kept for at least one year from the processing (Rule 8(3)) — the period is at least 12 months.",
    };
  }
  if (s.periodMonths > RETENTION_MAX_MONTHS) return { field: "periodMonths", message: "The period is at most 1,200 months." };
  if ((s.basis === "legal_requirement") !== (s.lawName !== null && s.lawName.trim() !== "")) {
    return {
      field: "lawName",
      message: s.basis === "legal_requirement" ? "Name the law that requires the data to be kept." : "A law is named only when a law requires keeping the data.",
    };
  }
  return null;
}

// ---------------------------------------------------------------------------
// Where a schedule stands
// ---------------------------------------------------------------------------

/** The facts the model and the register read of one schedule. */
export interface RetentionFacts {
  /** The day the clock started, or null when it has not (no end recorded). */
  startsOn: string | null;
  /** Derived by the database; null exactly when `startsOn` is. */
  endsOn: string | null;
  /** The latest erasure on the schedule that COUNTS (`erasureCounts`), or null (D-096). */
  lastErasedOn: string | null;
}

// ---------------------------------------------------------------------------
// When an erasure counts (D-096, R2 and R4)
// ---------------------------------------------------------------------------

/** One erasure, as the register and the model read it. */
export interface ErasureFacts {
  erasedOn: string;
  /** s.8(7)(b). */
  processorsTold: ProcessorErasureAnswer;
  /** Marked as recorded in error. */
  voided: boolean;
}

export const ERASURE_STANDINGS = ["counts", "incomplete", "voided"] as const;
export type ErasureStanding = (typeof ERASURE_STANDINGS)[number];

export const ERASURE_STANDING_LABEL: Readonly<Record<ErasureStanding, string>> = Object.freeze({
  counts: "Erasure recorded",
  incomplete: "Erasure incomplete — processors not told",
  voided: "Recorded in error",
});

/**
 * Where one erasure stands: voided first (it no longer counts at all), then
 * incomplete — the processors not yet told to erase it (s.8(7)(b)) — else it
 * counts.
 */
export function erasureStanding(e: Pick<ErasureFacts, "processorsTold" | "voided">): ErasureStanding {
  if (e.voided) return "voided";
  return e.processorsTold === "no" ? "incomplete" : "counts";
}

export const erasureCounts = (e: Pick<ErasureFacts, "processorsTold" | "voided">): boolean => erasureStanding(e) === "counts";

/** The day of the latest erasure that counts, or null — `RetentionFacts.lastErasedOn`. */
export function lastCountingErasureOn(erasures: readonly ErasureFacts[]): string | null {
  let last: string | null = null;
  for (const e of erasures) {
    day(e.erasedOn, "erasedOn");
    if (erasureCounts(e) && (last === null || e.erasedOn > last)) last = e.erasedOn;
  }
  return last;
}

/**
 * The current cycle has an erasure whose processors were not told — and none
 * that counts: the register says "Erasure incomplete — processors not told"
 * beside the schedule's state, which stays as it was (overdue, if past the end).
 */
export function erasureIncomplete(startsOn: string | null, erasures: readonly ErasureFacts[]): boolean {
  if (erasedThisCycle({ startsOn, lastErasedOn: lastCountingErasureOn(erasures) })) return false;
  return erasures.some((e) => erasureStanding(e) === "incomplete" && (startsOn === null || e.erasedOn >= startsOn));
}

/**
 * Erased for the CURRENT cycle: an erasure recorded on or after the day the
 * clock started (or any erasure, when no clock has started). Moving the start
 * date to a later cycle makes an earlier erasure history, not this cycle's.
 */
export function erasedThisCycle(f: Pick<RetentionFacts, "startsOn" | "lastErasedOn">): boolean {
  if (f.lastErasedOn === null) return false;
  return f.startsOn === null || f.lastErasedOn >= f.startsOn;
}

export const RETENTION_STATES = ["no_end", "running", "overdue", "erased"] as const;
export type RetentionState = (typeof RETENTION_STATES)[number];

export const RETENTION_STATE_LABEL: Readonly<Record<RetentionState, string>> = Object.freeze({
  no_end: "No end recorded",
  running: "Retained",
  overdue: "Erasure overdue",
  erased: "Erased",
});

/** Days before the end that a schedule is "ending soon" on the register — a display window, not a rule. */
export const RETENTION_ENDING_SOON_DAYS = 30;

export interface RetentionClock {
  state: RetentionState;
  endsOn: string | null;
  /** Whole days from today to the end date (negative once past); null with no end. */
  daysToEnd: number | null;
  endingSoon: boolean;
}

const DAY_MS = 86_400_000;
const utc = (d: string) => Date.UTC(Number(d.slice(0, 4)), Number(d.slice(5, 7)) - 1, Number(d.slice(8, 10)));

/**
 * Where one schedule stands on `today`. Overdue is strictly AFTER the end
 * date: on the end date itself the data may still be held.
 */
export function retentionClock(f: RetentionFacts, today: string): RetentionClock {
  day(today, "today");
  if (f.startsOn !== null) day(f.startsOn, "startsOn");
  if (f.lastErasedOn !== null) day(f.lastErasedOn, "lastErasedOn");
  if ((f.startsOn === null) !== (f.endsOn === null)) throw new RetentionInputError("an end date is recorded exactly when a start date is");
  const daysToEnd = f.endsOn === null ? null : Math.round((utc(day(f.endsOn, "endsOn")) - utc(today)) / DAY_MS);
  let state: RetentionState;
  if (erasedThisCycle(f)) state = "erased";
  else if (f.endsOn === null) state = "no_end";
  else if (today > f.endsOn) state = "overdue";
  else state = "running";
  return {
    state,
    endsOn: f.endsOn,
    daysToEnd,
    endingSoon: state === "running" && daysToEnd !== null && daysToEnd <= RETENTION_ENDING_SOON_DAYS,
  };
}

/** Model 1.5.0's `retention_overdue`: past the end, no erasure recorded for this cycle. */
export function retentionOverdue(f: RetentionFacts, today: string): boolean {
  return f.endsOn !== null && today > f.endsOn && !erasedThisCycle(f);
}

/** Model 1.5.0's `retention_end_unrecorded`: no end recorded, nothing erased. */
export function retentionEndUnrecorded(f: RetentionFacts): boolean {
  return f.endsOn === null && !erasedThisCycle(f);
}

export interface RetentionCounts {
  total: number;
  noEnd: number;
  running: number;
  endingSoon: number;
  overdue: number;
  erased: number;
}

/** The register's headline, counted over rows a reader returned (D-069). */
export function countRetention(schedules: readonly RetentionFacts[], today: string): RetentionCounts {
  const counts: RetentionCounts = { total: schedules.length, noEnd: 0, running: 0, endingSoon: 0, overdue: 0, erased: 0 };
  for (const s of schedules) {
    const c = retentionClock(s, today);
    if (c.state === "no_end") counts.noEnd += 1;
    if (c.state === "running") counts.running += 1;
    if (c.endingSoon) counts.endingSoon += 1;
    if (c.state === "overdue") counts.overdue += 1;
    if (c.state === "erased") counts.erased += 1;
  }
  return counts;
}
