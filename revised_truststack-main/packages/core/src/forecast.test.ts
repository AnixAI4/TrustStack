import { describe, expect, it } from "vitest";
import {
  addDays,
  FORECAST_CONFIG,
  FORECAST_PRNG,
  forecast,
  ForecastInputError,
  nearestRank,
  requiredPerWeek,
  simulateWeeks,
  weeklyClosures,
  type ForecastInput,
} from "./forecast.js";

const TODAY = "2026-10-06";
const DEADLINE = "2027-05-13";

/** n closures on the given day offsets (days ago). */
const closures = (...daysAgo: number[]) => daysAgo.map((d) => addDays(TODAY, -d));

function input(over: Partial<ForecastInput> = {}): ForecastInput {
  return { closedOn: closures(0, 1, 8, 9, 15, 30), work: { criticalHigh: 4, all: 12 }, today: TODAY, deadline: DEADLINE, ...over };
}

describe("weekly closures — the last eight weeks, most recent first", () => {
  it("week 0 is the seven days ending today; week 1 the seven before", () => {
    expect(weeklyClosures(closures(0, 6, 7, 13, 14), TODAY)).toEqual([2, 2, 1, 0, 0, 0, 0, 0]);
  });
  it("ignores a closure in the future, or older than eight weeks", () => {
    expect(weeklyClosures([addDays(TODAY, 1), ...closures(55, 56, 300)], TODAY)).toEqual([0, 0, 0, 0, 0, 0, 0, 1]);
  });
  it("refuses a malformed date", () => {
    expect(() => weeklyClosures(["2026-13-01"], TODAY)).toThrow(ForecastInputError);
  });
});

describe("deterministic — the same data always gives the same answer (decision 4)", () => {
  it("two runs agree exactly", () => {
    expect(forecast(input())).toEqual(forecast(input()));
  });
  it("the generator is Park–Miller MINSTD with a fixed seed, exact in a double", () => {
    expect(FORECAST_PRNG).toEqual({ multiplier: 48271, modulus: 2147483647 });
    expect(FORECAST_CONFIG.seed).toBe(20270513);
    // The largest intermediate product stays below 2^53, so a double is exact.
    expect((FORECAST_PRNG.modulus - 1) * FORECAST_PRNG.multiplier).toBeLessThan(2 ** 53);
  });
  it("a different history gives a different range", () => {
    const slow = forecast(input({ closedOn: closures(0, 30) }));
    const fast = forecast(input({ closedOn: closures(0, 0, 0, 7, 7, 7, 14, 14, 21, 21, 28, 35) }));
    expect(fast.all.p50Weeks!).toBeLessThan(slow.all.p50Weeks!);
  });
});

describe("not enough history", () => {
  it("fewer than two active weeks of the eight: no projection, but the required rate stands", () => {
    const f = forecast(input({ closedOn: closures(0, 1, 2) }));
    expect(f.activeWeeks).toBe(1);
    expect(f.notEnoughHistory).toBe(true);
    expect(f.all.p50Weeks).toBeNull();
    expect(f.all.p85Date).toBeNull();
    expect(f.all.meetsDeadline).toEqual({ p50: null, p85: null });
    expect(f.all.requiredPerWeek).not.toBeNull();
  });
  it("exactly two active weeks is enough", () => {
    expect(forecast(input({ closedOn: closures(0, 7) })).notEnoughHistory).toBe(false);
  });
  it("nothing outstanding is done today, history or not", () => {
    const f = forecast(input({ closedOn: [], work: { criticalHigh: 0, all: 0 } }));
    expect(f.all).toMatchObject({ p50Weeks: 0, p85Weeks: 0, p50Date: TODAY, meetsDeadline: { p50: true, p85: true } });
  });
});

describe("the range", () => {
  it("P50 ≤ P85, for critical/high and for all work", () => {
    for (const closedOn of [closures(0, 7), closures(0, 1, 8, 9, 15, 30, 31, 40), closures(0, 7, 14, 21, 28, 35, 42, 49)]) {
      const f = forecast(input({ closedOn }));
      expect(f.all.p50Weeks!).toBeLessThanOrEqual(f.all.p85Weeks!);
      expect(f.criticalHigh.p50Weeks!).toBeLessThanOrEqual(f.criticalHigh.p85Weeks!);
    }
  });
  it("critical and high work never finishes after all of the work (same draws)", () => {
    const runs = simulateWeeks([1, 0, 3, 0, 2, 0, 0, 1], { criticalHigh: 5, all: 20 });
    runs.criticalHigh.forEach((w, i) => expect(w).toBeLessThanOrEqual(runs.all[i]!));
  });
  it("a steady pace of one a week projects close to the outstanding count", () => {
    const f = forecast(input({ closedOn: closures(0, 7, 14, 21, 28, 35, 42, 49), work: { criticalHigh: 10, all: 10 } }));
    expect(f.averagePerWeek).toBe(1);
    expect(f.all.p50Weeks).toBe(10);
    expect(f.all.p85Weeks).toBe(10);
    expect(f.all.p50Date).toBe(addDays(TODAY, 70));
  });
  it("dates are today + weeks × 7, and meet the deadline when on or before it", () => {
    const f = forecast(input());
    expect(f.all.p50Date).toBe(addDays(TODAY, f.all.p50Weeks! * 7));
    expect(f.all.meetsDeadline.p50).toBe(f.all.p50Date! <= DEADLINE);
  });
  it("beyond the five-year horizon is said, not hidden", () => {
    const f = forecast(input({ closedOn: closures(0, 7), work: { criticalHigh: 0, all: 100_000 } }));
    expect(f.all.p50Weeks).toBeNull();
    expect(f.all.beyondHorizon).toEqual({ p50: true, p85: true });
    expect(f.all.meetsDeadline).toEqual({ p50: false, p85: false });
  });
  it("nearest rank is the ⌈p·n⌉-th value", () => {
    expect(nearestRank([1, 2, 3, 4], 0.5)).toBe(2);
    expect(nearestRank([1, 2, 3, 4], 0.85)).toBe(4);
    expect(nearestRank([7], 0.5)).toBe(7);
  });
});

describe("the required rate to finish by 13 May 2027", () => {
  it("rounds UP to one decimal", () => {
    expect(requiredPerWeek(10, 70)).toBe(1);
    expect(requiredPerWeek(11, 70)).toBe(1.1);
    expect(requiredPerWeek(1, 219)).toBe(0.1);
    expect(requiredPerWeek(0, 219)).toBe(0);
  });
  it("is null once the deadline has passed", () => {
    expect(requiredPerWeek(10, 0)).toBeNull();
    expect(forecast(input({ today: "2027-06-01" })).all.requiredPerWeek).toBeNull();
  });
  it("feeds the projection", () => {
    expect(forecast(input()).all.requiredPerWeek).toBe(requiredPerWeek(12, 219));
  });
});

describe("refuses nonsense", () => {
  it("negative or fractional work, and critical work larger than all work", () => {
    expect(() => forecast(input({ work: { criticalHigh: -1, all: 3 } }))).toThrow(ForecastInputError);
    expect(() => forecast(input({ work: { criticalHigh: 1.5, all: 3 } }))).toThrow(ForecastInputError);
    expect(() => forecast(input({ work: { criticalHigh: 4, all: 3 } }))).toThrow(ForecastInputError);
  });
});
