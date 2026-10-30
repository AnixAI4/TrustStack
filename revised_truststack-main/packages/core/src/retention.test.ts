import { describe, expect, it } from "vitest";
import {
  countRetention,
  erasedThisCycle,
  erasureCounts,
  erasureIncomplete,
  erasureStanding,
  ERASURE_STANDING_LABEL,
  lastCountingErasureOn,
  retentionClock,
  retentionEndsOn,
  retentionEndUnrecorded,
  retentionInformBy,
  retentionOverdue,
  retentionScheduleProblem,
  RetentionInputError,
  RETENTION_BASES,
  RETENTION_BASIS_LABEL,
  RETENTION_DEEMED_MONTHS,
  RETENTION_DEEMED_NOTE,
  RETENTION_MIN_MONTHS,
  RETENTION_NOTE,
  RETENTION_RULES_COMMENCED_ON,
  RETENTION_START_LABEL,
  THIRD_SCHEDULE_CLASSES,
  type ErasureFacts,
  type RetentionFacts,
} from "./retention.js";

const TODAY = "2026-10-14";
const facts = (over: Partial<RetentionFacts> = {}): RetentionFacts => ({
  startsOn: "2025-06-30",
  endsOn: "2026-06-30",
  lastErasedOn: null,
  ...over,
});

describe("the vocabularies are the Act's and the Rules'", () => {
  it("five bases — the Act's two events, a period, a law, and Rule 8(1)'s for the Third Schedule", () => {
    expect([...RETENTION_BASES]).toEqual(["purpose_served", "consent_withdrawn", "fixed_period", "legal_requirement", "deemed_inactivity"]);
    expect(RETENTION_BASIS_LABEL.deemed_inactivity).toMatch(/Third Schedule/);
  });
  it("Rule 8(3)'s floor is one year; Rule 8(1)'s period is three years", () => {
    expect(RETENTION_MIN_MONTHS).toBe(12);
    expect(RETENTION_DEEMED_MONTHS).toBe(36);
  });
  it("three Third-Schedule classes, and the note says they alone get Rule 8(1)–(2)", () => {
    expect([...THIRD_SCHEDULE_CLASSES]).toEqual(["ecommerce", "online_gaming", "social_media"]);
    expect(RETENTION_NOTE).toContain("at least one year");
    expect(RETENTION_NOTE).toContain("apply only to the classes in the Third Schedule");
  });
  it("Rule 8(3) runs from the processing: every start but the Third Schedule's is the last day processed (D-096, R1)", () => {
    for (const b of RETENTION_BASES) {
      if (b === "deemed_inactivity") expect(RETENTION_START_LABEL[b]).toMatch(/last approached/);
      else expect(RETENTION_START_LABEL[b]).toMatch(/^The last day this data was processed/);
    }
    expect(RETENTION_NOTE).toContain("from the last day the data was processed");
    expect(RETENTION_NOTE).toContain(
      "During the year Rule 8(3) requires, the data is held only for the purposes in the Seventh Schedule — not used for the original purpose.",
    );
  });
  it("the Third Schedule's note: 13 November 2025 for counsel, and its two exceptions (D-096, R3)", () => {
    expect(RETENTION_DEEMED_NOTE).toContain("13 November 2025");
    expect(RETENTION_DEEMED_NOTE).toContain("counsel to confirm");
    expect(RETENTION_DEEMED_NOTE).toContain("access their user account");
    expect(RETENTION_DEEMED_NOTE).toContain("virtual token");
    expect(RETENTION_RULES_COMMENCED_ON).toBe("2025-11-13");
  });
});

describe("when an erasure counts — s.8(7)(b) and 'recorded in error' (D-096, R2 and R4)", () => {
  const e = (over: Partial<ErasureFacts> = {}): ErasureFacts => ({ erasedOn: "2026-07-10", processorsTold: "yes", voided: false, ...over });
  it("processors told, or none held it: counts; not yet told: incomplete; voided: never counts", () => {
    expect(erasureStanding(e())).toBe("counts");
    expect(erasureStanding(e({ processorsTold: "not_applicable" }))).toBe("counts");
    expect(erasureStanding(e({ processorsTold: "no" }))).toBe("incomplete");
    expect(erasureStanding(e({ voided: true }))).toBe("voided");
    expect(erasureStanding(e({ processorsTold: "no", voided: true }))).toBe("voided");
    expect(erasureCounts(e({ processorsTold: "no" }))).toBe(false);
    expect(ERASURE_STANDING_LABEL.incomplete).toBe("Erasure incomplete — processors not told");
  });
  it("the latest counting erasure is the model's lastErasedOn", () => {
    expect(lastCountingErasureOn([])).toBeNull();
    expect(lastCountingErasureOn([e({ processorsTold: "no" })])).toBeNull();
    expect(lastCountingErasureOn([e({ erasedOn: "2026-07-01" }), e({ erasedOn: "2026-08-01", voided: true })])).toBe("2026-07-01");
    expect(lastCountingErasureOn([e({ erasedOn: "2026-07-01" }), e({ erasedOn: "2026-08-01", processorsTold: "not_applicable" })])).toBe("2026-08-01");
    expect(() => lastCountingErasureOn([e({ erasedOn: "2026-02-30" })])).toThrow(RetentionInputError);
  });
  it("an incomplete erasure leaves an overdue schedule overdue", () => {
    const erasures = [e({ processorsTold: "no" })];
    const f = facts({ lastErasedOn: lastCountingErasureOn(erasures) });
    expect(retentionClock(f, TODAY).state).toBe("overdue");
    expect(retentionOverdue(f, TODAY)).toBe(true);
    expect(erasureIncomplete(f.startsOn, erasures)).toBe(true);
  });
  it("incomplete only for this cycle, and only while nothing counts", () => {
    expect(erasureIncomplete("2025-06-30", [e({ processorsTold: "no" }), e({ erasedOn: "2026-07-11" })])).toBe(false);
    expect(erasureIncomplete("2026-08-01", [e({ processorsTold: "no" })])).toBe(false);
    expect(erasureIncomplete(null, [e({ processorsTold: "no" })])).toBe(true);
    expect(erasureIncomplete("2025-06-30", [e({ processorsTold: "no", voided: true })])).toBe(false);
  });
  it("a voided erasure no longer clears the overdue state", () => {
    const f = facts({ lastErasedOn: lastCountingErasureOn([e({ voided: true })]) });
    expect(retentionClock(f, TODAY).state).toBe("overdue");
  });
});

describe("retentionEndsOn — the database's rule, in calendar months", () => {
  it("start + period, as Postgres adds months (clamped to the month's end)", () => {
    expect(retentionEndsOn("fixed_period", "2025-06-30", 12)).toBe("2026-06-30");
    expect(retentionEndsOn("legal_requirement", "2024-02-29", 12)).toBe("2025-02-28");
    expect(retentionEndsOn("purpose_served", "2026-01-31", 13)).toBe("2027-02-28");
  });
  it("no start, no end — the clock has not started", () => {
    expect(retentionEndsOn("purpose_served", null, 24)).toBeNull();
  });
  it("the deemed basis runs three years from the later of the last approach and the Rules' commencement", () => {
    expect(retentionEndsOn("deemed_inactivity", "2024-05-01", 36)).toBe("2028-11-13");
    expect(retentionEndsOn("deemed_inactivity", RETENTION_RULES_COMMENCED_ON, 36)).toBe("2028-11-13");
    expect(retentionEndsOn("deemed_inactivity", "2026-03-10", 36)).toBe("2029-03-10");
  });
  it("refuses a date that is not a calendar date", () => {
    expect(() => retentionEndsOn("fixed_period", "2026-02-30", 12)).toThrow(RetentionInputError);
  });
});

describe("retentionInformBy — Rule 8(2), Third-Schedule schedules only", () => {
  it("two days before the end for the deemed basis", () => {
    expect(retentionInformBy("deemed_inactivity", "2029-03-10")).toBe("2029-03-08");
  });
  it("nothing for any other basis, or with no end", () => {
    for (const b of RETENTION_BASES.filter((x) => x !== "deemed_inactivity")) expect(retentionInformBy(b, "2029-03-10")).toBeNull();
    expect(retentionInformBy("deemed_inactivity", null)).toBeNull();
  });
});

describe("retentionScheduleProblem — the CHECKs, in words", () => {
  const ok = { basis: "fixed_period" as const, periodMonths: 24, lawName: null, thirdScheduleClass: null };
  it("a schedule of a year or more, with no law named, is fine", () => {
    expect(retentionScheduleProblem(ok)).toBeNull();
    expect(retentionScheduleProblem({ ...ok, periodMonths: 12 })).toBeNull();
  });
  it("refuses anything shorter than Rule 8(3)'s year", () => {
    expect(retentionScheduleProblem({ ...ok, periodMonths: 11 })).toMatchObject({ field: "periodMonths", message: expect.stringContaining("Rule 8(3)") });
    expect(retentionScheduleProblem({ ...ok, periodMonths: 12.5 })).toMatchObject({ field: "periodMonths" });
  });
  it("a law requirement names its law; nothing else does", () => {
    expect(retentionScheduleProblem({ ...ok, basis: "legal_requirement" })).toMatchObject({ field: "lawName" });
    expect(retentionScheduleProblem({ ...ok, basis: "legal_requirement", lawName: "Income-tax Act, 1961" })).toBeNull();
    expect(retentionScheduleProblem({ ...ok, lawName: "Some Act" })).toMatchObject({ field: "lawName" });
  });
  it("the deemed basis only for a recorded Third-Schedule class, and only for 36 months — never inferred", () => {
    expect(retentionScheduleProblem({ ...ok, basis: "deemed_inactivity", periodMonths: 36 })).toMatchObject({ field: "basis" });
    expect(retentionScheduleProblem({ ...ok, basis: "deemed_inactivity", periodMonths: 24, thirdScheduleClass: "ecommerce" })).toMatchObject({
      field: "periodMonths",
    });
    expect(retentionScheduleProblem({ ...ok, basis: "deemed_inactivity", periodMonths: 36, thirdScheduleClass: "social_media" })).toBeNull();
  });
});

describe("retentionClock — where a schedule stands on today", () => {
  it("running until the end date, inclusive; overdue strictly after", () => {
    expect(retentionClock(facts({ endsOn: TODAY }), TODAY)).toMatchObject({ state: "running", daysToEnd: 0, endingSoon: true });
    expect(retentionClock(facts({ endsOn: "2026-10-13" }), TODAY)).toMatchObject({ state: "overdue", daysToEnd: -1, endingSoon: false });
    expect(retentionClock(facts({ endsOn: "2027-10-14" }), TODAY)).toMatchObject({ state: "running", endingSoon: false });
  });
  it("ending soon inside thirty days — a display window", () => {
    expect(retentionClock(facts({ endsOn: "2026-11-13" }), TODAY).endingSoon).toBe(true);
    expect(retentionClock(facts({ endsOn: "2026-11-14" }), TODAY).endingSoon).toBe(false);
  });
  it("no start, no end recorded", () => {
    expect(retentionClock(facts({ startsOn: null, endsOn: null }), TODAY)).toEqual({ state: "no_end", endsOn: null, daysToEnd: null, endingSoon: false });
  });
  it("erased when an erasure is recorded on or after the clock started", () => {
    expect(retentionClock(facts({ lastErasedOn: "2026-07-10" }), TODAY).state).toBe("erased");
    expect(retentionClock(facts({ lastErasedOn: "2025-06-30" }), TODAY).state).toBe("erased");
    // An erasure before this cycle started is history: the cycle is overdue.
    expect(retentionClock(facts({ lastErasedOn: "2025-06-29" }), TODAY).state).toBe("overdue");
    expect(retentionClock(facts({ startsOn: null, endsOn: null, lastErasedOn: "2025-01-01" }), TODAY).state).toBe("erased");
  });
  it("refuses an end date without a start, and the other way round", () => {
    expect(() => retentionClock(facts({ startsOn: null }), TODAY)).toThrow(RetentionInputError);
    expect(() => retentionClock(facts({ endsOn: null }), TODAY)).toThrow(RetentionInputError);
  });
});

describe("the model's two facts (1.5.0)", () => {
  it("overdue: past the end, nothing erased this cycle", () => {
    expect(retentionOverdue(facts(), TODAY)).toBe(true);
    expect(retentionOverdue(facts({ endsOn: TODAY }), TODAY)).toBe(false);
    expect(retentionOverdue(facts({ lastErasedOn: "2026-07-01" }), TODAY)).toBe(false);
    expect(retentionOverdue(facts({ startsOn: null, endsOn: null }), TODAY)).toBe(false);
  });
  it("no end recorded: no end, nothing erased", () => {
    expect(retentionEndUnrecorded(facts({ startsOn: null, endsOn: null }))).toBe(true);
    expect(retentionEndUnrecorded(facts({ startsOn: null, endsOn: null, lastErasedOn: "2026-01-01" }))).toBe(false);
    expect(retentionEndUnrecorded(facts())).toBe(false);
  });
  it("erasedThisCycle reads the latest erasure against the start", () => {
    expect(erasedThisCycle({ startsOn: "2026-01-01", lastErasedOn: null })).toBe(false);
    expect(erasedThisCycle({ startsOn: "2026-01-01", lastErasedOn: "2026-01-01" })).toBe(true);
  });
});

describe("countRetention — the register's headline", () => {
  it("an empty register is all zeros", () => {
    expect(countRetention([], TODAY)).toEqual({ total: 0, noEnd: 0, running: 0, endingSoon: 0, overdue: 0, erased: 0 });
  });
  it("counts each state once; ending soon is also running", () => {
    expect(
      countRetention(
        [
          facts(),
          facts({ lastErasedOn: "2026-07-10" }),
          facts({ startsOn: null, endsOn: null }),
          facts({ endsOn: "2026-11-01" }),
          facts({ endsOn: "2030-01-01" }),
        ],
        TODAY,
      ),
    ).toEqual({ total: 5, noEnd: 1, running: 2, endingSoon: 1, overdue: 1, erased: 1 });
  });
});
