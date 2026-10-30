import { describe, expect, it } from "vitest";
import {
  calendarDaysBetween,
  canRightsTransition,
  countRights,
  needsIdentity,
  respondBy,
  rightsCeilingOverdue,
  rightsClock,
  rightsFamily,
  rightsPastTarget,
  RightsInputError,
  RIGHTS_CEILING_DAYS,
  RIGHTS_CLOCK_NOTE,
  RIGHTS_CODE_PREFIX,
  RIGHTS_KINDS,
  RIGHTS_KIND_LABEL,
  RIGHTS_KIND_PROVISION,
  RIGHTS_OUTCOME_LABEL,
  RIGHTS_STATUSES,
  RIGHTS_TARGET_DAYS,
  RIGHTS_TRANSITIONS,
  targetBy,
  type RightsClockFacts,
} from "./rights.js";

const TODAY = "2026-10-11";
const r = (over: Partial<RightsClockFacts> = {}): RightsClockFacts => ({
  kind: "access",
  status: "open",
  receivedOn: "2026-10-01",
  respondedOn: null,
  ...over,
});

describe("vocabularies — the Act's own list (s.11–14)", () => {
  it("seven kinds, each with its provision; no GDPR right the Act does not grant", () => {
    expect([...RIGHTS_KINDS]).toEqual(["access", "correction", "completion", "updating", "erasure", "nomination", "grievance"]);
    for (const k of RIGHTS_KINDS) {
      expect(RIGHTS_KIND_LABEL[k]).toBeTruthy();
      expect(RIGHTS_KIND_PROVISION[k]).toMatch(/^s\.1[1-4]/);
    }
    // The old app carried "restrict" and "portability"-style rights: DPDP grants neither.
    expect(RIGHTS_KINDS).not.toContain("restrict");
  });

  it("two families, two codes: a grievance is GRV, every other request DPR", () => {
    expect(rightsFamily("grievance")).toBe("grievance");
    for (const k of RIGHTS_KINDS.filter((x) => x !== "grievance")) expect(rightsFamily(k)).toBe("request");
    expect(RIGHTS_CODE_PREFIX).toEqual({ request: "DPR", grievance: "GRV" });
  });

  it("one outcome vocabulary, in each family's words", () => {
    expect(RIGHTS_OUTCOME_LABEL.request.declined).toBe("Declined");
    expect(RIGHTS_OUTCOME_LABEL.grievance.fulfilled).toBe("Resolved");
    expect(RIGHTS_OUTCOME_LABEL.grievance.declined).toBe("Not upheld");
  });

  it("the lifecycle: open answers, is withdrawn or voided; every closed state reopens to open only", () => {
    expect([...RIGHTS_STATUSES]).toEqual(["open", "responded", "withdrawn", "void"]);
    expect(RIGHTS_TRANSITIONS.open).toEqual(["responded", "withdrawn", "void"]);
    for (const s of ["responded", "withdrawn", "void"] as const) {
      expect(RIGHTS_TRANSITIONS[s]).toEqual(["open"]);
      expect(canRightsTransition(s, "responded")).toBe(false);
    }
    expect(canRightsTransition("open", "open")).toBe(false);
  });

  it("fulfilling a request needs the person identified; a grievance or a refusal does not", () => {
    expect(needsIdentity("erasure", "fulfilled")).toBe(true);
    expect(needsIdentity("access", "partly_fulfilled")).toBe(true);
    expect(needsIdentity("access", "declined")).toBe(false);
    expect(needsIdentity("grievance", "fulfilled")).toBe(false);
  });
});

describe("the clock — ninety days is the Rules', thirty is TrustStack's", () => {
  it("the periods, and a note that labels the target as a target", () => {
    expect(RIGHTS_CEILING_DAYS).toBe(90);
    expect(RIGHTS_TARGET_DAYS).toBe(30);
    expect(RIGHTS_CLOCK_NOTE).toContain("not exceeding ninety days");
    expect(RIGHTS_CLOCK_NOTE).toContain("Rule 14(3)");
    expect(RIGHTS_CLOCK_NOTE).toContain("TrustStack's, not a statutory period");
  });

  it("respond-by is receipt + 90 days, on the calendar (across a leap day)", () => {
    expect(respondBy("2026-10-01")).toBe("2026-12-30");
    expect(targetBy("2026-10-01")).toBe("2026-10-31");
    expect(respondBy("2027-12-31")).toBe("2028-03-30");
    expect(calendarDaysBetween("2028-02-28", "2028-03-01")).toBe(2);
  });

  it("day 0 on receipt; day 30 on target; day 31 past it; day 90 in time; day 91 overdue", () => {
    const at = (receivedOn: string) => rightsClock(r({ receivedOn }), TODAY);
    expect(at("2026-10-11")).toMatchObject({ state: "within_target", daysOpen: 0, label: "Day 0 of 90" });
    expect(at("2026-09-11")).toMatchObject({ state: "within_target", daysOpen: 30 });
    expect(at("2026-09-10")).toMatchObject({ state: "past_target", daysOpen: 31, label: "Day 31 of 90 — past TrustStack's 30-day target" });
    expect(at("2026-07-13")).toMatchObject({ state: "past_target", daysOpen: 90 });
    expect(at("2026-07-12")).toMatchObject({ state: "overdue", daysOpen: 91, label: "Overdue — day 91, past the 90-day ceiling" });
  });

  it("a response is judged on the day it was made: day 90 in time, day 91 late", () => {
    expect(rightsClock(r({ status: "responded", receivedOn: "2026-07-13", respondedOn: "2026-10-11" }), TODAY)).toMatchObject({
      state: "responded",
      daysOpen: 90,
      label: "Responded on day 90",
    });
    expect(rightsClock(r({ status: "responded", receivedOn: "2026-07-12", respondedOn: "2026-10-11" }), TODAY)).toMatchObject({
      state: "responded_late",
      label: "Responded on day 91 — after the 90-day ceiling",
    });
  });

  it("withdrawn and void requests run no clock", () => {
    for (const status of ["withdrawn", "void"] as const) {
      const c = rightsClock(r({ status, receivedOn: "2026-01-01" }), TODAY);
      expect(c.state).toBe("not_applicable");
      expect(c.daysOpen).toBeNull();
    }
  });

  it("the model's two facts agree with the clock, and each request is one or the other", () => {
    for (const receivedOn of ["2026-10-11", "2026-09-11", "2026-09-10", "2026-07-13", "2026-07-12", "2026-01-01"]) {
      const facts = r({ receivedOn });
      const clock = rightsClock(facts, TODAY);
      expect(rightsCeilingOverdue(facts, TODAY)).toBe(clock.state === "overdue");
      expect(rightsPastTarget(facts, TODAY)).toBe(clock.state === "past_target");
    }
    expect(rightsCeilingOverdue(r({ status: "responded", receivedOn: "2026-01-01" }), TODAY)).toBe(false);
  });

  it("refuses anything that is not a calendar date", () => {
    expect(() => respondBy("2026-02-30")).toThrow(RightsInputError);
    expect(() => rightsClock(r({ receivedOn: "1 Oct 2026" }), TODAY)).toThrow(RightsInputError);
    expect(() => rightsClock(r(), "2026-10-11T10:00:00Z")).toThrow(RightsInputError);
  });
});

describe("the overview's counts — rows, counted", () => {
  it("open requests and grievances apart; past the target; overdue; responded late; closed otherwise", () => {
    const counts = countRights(
      [
        r({ receivedOn: "2026-10-10" }), // open request, on target
        r({ kind: "grievance", receivedOn: "2026-09-01" }), // open grievance, past target
        r({ kind: "erasure", receivedOn: "2026-06-01" }), // open request, overdue
        r({ kind: "grievance", receivedOn: "2026-05-01" }), // open grievance, overdue
        r({ status: "responded", receivedOn: "2026-08-01", respondedOn: "2026-08-20" }),
        r({ status: "responded", receivedOn: "2026-05-01", respondedOn: "2026-09-01" }), // late
        r({ status: "withdrawn" }),
        r({ status: "void", receivedOn: "2026-01-01" }),
      ],
      TODAY,
    );
    expect(counts).toEqual({
      total: 8,
      openRequests: 2,
      openGrievances: 2,
      pastTarget: 1,
      overdue: 2,
      overdueGrievances: 1,
      responded: 2,
      respondedLate: 1,
      closedOtherwise: 2,
    });
  });

  it("an empty register counts nothing", () => {
    expect(countRights([], TODAY)).toMatchObject({ total: 0, openRequests: 0, overdue: 0 });
  });
});
