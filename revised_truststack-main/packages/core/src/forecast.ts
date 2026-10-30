/**
 * The deadline forecast (Slice 9, SLICE_09 §4.6). Pure: no I/O, no clock —
 * `today` is passed in — and no hidden randomness.
 *
 * Transparent by design (decision 4): it reads nothing but how many actions
 * the organisation has CLOSED in each of the last eight weeks (stored
 * `gap_actions.closed_at`, as the date in India) and how much work is still
 * outstanding. It projects when that work would be finished at the same pace,
 * as a range:
 *
 * - **P50 / P85** — resampling the eight weekly counts, week after week, until
 *   the work is done; 1,000 runs; the 50th and 85th percentile of the number
 *   of weeks. The "random" draws come from a fixed-seed Park–Miller generator
 *   (integer arithmetic only), so the same data always gives the same answer
 *   — and the SQL mirror (`app.exposure_forecast`) gives the same answer too,
 *   draw for draw. A unit test holds the two together.
 * - **Not enough history** when fewer than two of the eight weeks closed
 *   anything: a pace measured on one week is an anecdote.
 * - **The required rate**: the actions a week needed to finish by the deadline.
 *
 * It is a projection of the organisation's own pace, never a prediction of a
 * regulator's decision (D-011).
 */

import { isCalendarDate } from "./gaps.js";

export class ForecastInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ForecastInputError";
  }
}

/** Model data — mirrored by `app.exposure_forecast_config()`; bump `EXPOSURE_MODEL_VERSION` with any change. */
export const FORECAST_CONFIG = Object.freeze({
  /** Weeks of closure history read, the most recent first. */
  trailingWeeks: 8,
  /** Weeks (of the eight) that must have closed at least one action. */
  minActiveWeeks: 2,
  simulations: 1000,
  /** Fixed, so the same data always gives the same range. 13 May 2027. */
  seed: 20270513,
  /** A run that has not finished after five years is "beyond the horizon". */
  horizonWeeks: 260,
  p50: 0.5,
  p85: 0.85,
});

/** Park–Miller "minimal standard" generator (MINSTD, multiplier 48271): exact in a double and in a bigint. */
export const FORECAST_PRNG = Object.freeze({ multiplier: 48271, modulus: 2147483647 });

const DAY_MS = 86_400_000;
const utc = (d: string) => Date.UTC(Number(d.slice(0, 4)), Number(d.slice(5, 7)) - 1, Number(d.slice(8, 10)));
const iso = (ms: number) => new Date(ms).toISOString().slice(0, 10);

/** `YYYY-MM-DD` plus whole days. */
export function addDays(day: string, days: number): string {
  if (!isCalendarDate(day)) throw new ForecastInputError(`day must be YYYY-MM-DD (got ${day})`);
  return iso(utc(day) + days * DAY_MS);
}

function daysFrom(today: string, day: string): number {
  return Math.round((utc(day) - utc(today)) / DAY_MS);
}

/**
 * Closures per week, the most recent week first: week 0 is the seven days
 * ending today (today − 6 … today), week 1 the seven before it, and so on.
 * A closure in the future, or older than the window, is not counted.
 */
export function weeklyClosures(closedOn: readonly string[], today: string, weeks: number = FORECAST_CONFIG.trailingWeeks): number[] {
  if (!isCalendarDate(today)) throw new ForecastInputError(`today must be YYYY-MM-DD (got ${today})`);
  const counts = Array.from({ length: weeks }, () => 0);
  for (const day of closedOn) {
    if (!isCalendarDate(day)) throw new ForecastInputError(`a closure date must be YYYY-MM-DD (got ${day})`);
    const ago = -daysFrom(today, day);
    if (ago < 0) continue;
    const week = Math.floor(ago / 7);
    if (week < weeks) counts[week]! += 1;
  }
  return counts;
}

/** The outstanding work a forecast projects: critical and high first, and everything. */
export interface ForecastWork {
  criticalHigh: number;
  all: number;
}

export interface ForecastInput {
  /** The date in India each action was closed (`YYYY-MM-DD`), any number, any age. */
  closedOn: readonly string[];
  work: ForecastWork;
  /** `YYYY-MM-DD`, the date in India (D-055). */
  today: string;
  /** `YYYY-MM-DD`. 13 May 2027 for every head until counsel confirms otherwise. */
  deadline: string;
}

export interface Projection {
  outstanding: number;
  /** Actions a week needed to finish by the deadline (one decimal, rounded UP); null once it has passed. */
  requiredPerWeek: number | null;
  /** Null with `notEnoughHistory`, or when the run passed the horizon. */
  p50Weeks: number | null;
  p85Weeks: number | null;
  p50Date: string | null;
  p85Date: string | null;
  /** True when the run did not finish within the horizon at this pace. */
  beyondHorizon: { p50: boolean; p85: boolean };
  /** P50 / P85 on or before the deadline. Null without a forecast. */
  meetsDeadline: { p50: boolean | null; p85: boolean | null };
}

export interface ForecastResult {
  today: string;
  deadline: string;
  daysToDeadline: number;
  /** The eight weekly counts, most recent first. */
  weeklyClosures: number[];
  /** Weeks of the eight that closed at least one action. */
  activeWeeks: number;
  /** Mean closures a week over the eight, one decimal. */
  averagePerWeek: number;
  notEnoughHistory: boolean;
  /** Critical and high work, done first. */
  criticalHigh: Projection;
  all: Projection;
  method: string;
}

export const FORECAST_METHOD =
  "Resamples the last eight weeks' closures 1,000 times with a fixed seed; P50 and P85 are the 50th and 85th percentile of the weeks needed. Critical and high work is assumed to be done first.";

/** Rounded UP to one decimal, in integer arithmetic so the SQL mirror agrees. */
export function requiredPerWeek(outstanding: number, daysToDeadline: number): number | null {
  if (daysToDeadline <= 0) return null;
  if (outstanding === 0) return 0;
  return Math.ceil((outstanding * 70) / daysToDeadline) / 10;
}

/**
 * The weeks each run needed, for both targets on the SAME draws — so critical
 * and high work can never be projected to finish after all of the work.
 * Infinity = not finished within the horizon.
 */
export function simulateWeeks(weekly: readonly number[], work: ForecastWork, config = FORECAST_CONFIG): { criticalHigh: number[]; all: number[] } {
  const { multiplier, modulus } = FORECAST_PRNG;
  const n = weekly.length;
  let state = config.seed;
  const criticalHigh: number[] = [];
  const all: number[] = [];
  for (let run = 0; run < config.simulations; run += 1) {
    let done = 0;
    let week = 0;
    let doneCritical: number | null = work.criticalHigh === 0 ? 0 : null;
    let doneAll: number | null = work.all === 0 ? 0 : null;
    while (doneAll === null && week < config.horizonWeeks) {
      state = (state * multiplier) % modulus;
      done += weekly[state % n]!;
      week += 1;
      if (doneCritical === null && done >= work.criticalHigh) doneCritical = week;
      if (done >= work.all) doneAll = week;
    }
    criticalHigh.push(doneCritical ?? Infinity);
    all.push(doneAll ?? Infinity);
  }
  return { criticalHigh, all };
}

/** Nearest-rank percentile of an ascending list: the ⌈p·n⌉-th value. */
export function nearestRank(sorted: readonly number[], p: number): number {
  if (sorted.length === 0) throw new ForecastInputError("no values");
  const rank = Math.ceil(p * sorted.length);
  return sorted[Math.min(Math.max(rank, 1), sorted.length) - 1]!;
}

function project(outstanding: number, weeks: number[] | null, today: string, deadline: string, daysToDeadline: number): Projection {
  const base = { outstanding, requiredPerWeek: requiredPerWeek(outstanding, daysToDeadline) };
  if (weeks === null) {
    return {
      ...base,
      p50Weeks: null,
      p85Weeks: null,
      p50Date: null,
      p85Date: null,
      beyondHorizon: { p50: false, p85: false },
      meetsDeadline: { p50: null, p85: null },
    };
  }
  const sorted = [...weeks].sort((a, b) => a - b);
  const p50 = nearestRank(sorted, FORECAST_CONFIG.p50);
  const p85 = nearestRank(sorted, FORECAST_CONFIG.p85);
  const date = (w: number) => (Number.isFinite(w) ? addDays(today, w * 7) : null);
  const p50Date = date(p50);
  const p85Date = date(p85);
  return {
    ...base,
    p50Weeks: Number.isFinite(p50) ? p50 : null,
    p85Weeks: Number.isFinite(p85) ? p85 : null,
    p50Date,
    p85Date,
    beyondHorizon: { p50: !Number.isFinite(p50), p85: !Number.isFinite(p85) },
    meetsDeadline: { p50: p50Date !== null && p50Date <= deadline, p85: p85Date !== null && p85Date <= deadline },
  };
}

export function forecast(input: ForecastInput): ForecastResult {
  const { today, deadline, work } = input;
  if (!isCalendarDate(today) || !isCalendarDate(deadline)) {
    throw new ForecastInputError(`dates must be YYYY-MM-DD (got ${today}, ${deadline})`);
  }
  for (const n of [work.criticalHigh, work.all]) {
    if (!Number.isInteger(n) || n < 0) throw new ForecastInputError(`work must be a whole number ≥ 0 (got ${n})`);
  }
  if (work.criticalHigh > work.all) throw new ForecastInputError("critical and high work is part of all the work");

  const weekly = weeklyClosures(input.closedOn, today);
  const activeWeeks = weekly.filter((n) => n > 0).length;
  const total = weekly.reduce((sum, n) => sum + n, 0);
  const notEnoughHistory = activeWeeks < FORECAST_CONFIG.minActiveWeeks;
  const daysToDeadline = daysFrom(today, deadline);

  // Nothing outstanding needs no history: it is done today.
  const runs = notEnoughHistory && work.all > 0 ? null : simulateWeeks(weekly, work);

  return {
    today,
    deadline,
    daysToDeadline,
    weeklyClosures: weekly,
    activeWeeks,
    averagePerWeek: Math.round((total * 10) / weekly.length) / 10,
    notEnoughHistory,
    criticalHigh: project(work.criticalHigh, runs?.criticalHigh ?? null, today, deadline, daysToDeadline),
    all: project(work.all, runs?.all ?? null, today, deadline, daysToDeadline),
    method: FORECAST_METHOD,
  };
}
