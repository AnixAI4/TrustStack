import { describe, expect, it } from "vitest";
import {
  addMonths,
  BOARD_REPORT_HOURS,
  BREACH_ALERT_HOURS,
  BREACH_CLOCK_NOTE,
  BREACH_NATURE_LABEL,
  BREACH_NATURES,
  BREACH_SEVERITIES,
  BREACH_STATUS_LABEL,
  BREACH_STATUSES,
  BREACH_TRANSITIONS,
  BreachInputError,
  boardClock,
  boardReportDueAt,
  boardReportOverdue,
  canBreachTransition,
  countBreaches,
  dateInIndia,
  formatDuration,
  formatInIndia,
  isInstant,
  principalsPending,
  toInstant,
  type BreachClockFacts,
} from "./breach.js";

const AWARE = "2026-10-10T04:30:00.000Z"; // 10 Oct 2026, 10:00 IST
const DUE = "2026-10-13T04:30:00.000Z"; // exactly 72 hours later

function breach(over: Partial<BreachClockFacts> = {}): BreachClockFacts {
  return { status: "open", awareAt: AWARE, boardReportDueAt: DUE, boardReportAt: null, principalsIntimatedAt: null, ...over };
}

describe("the Rules' clock (Rule 7(2)(b))", () => {
  it("is seventy-two hours from becoming aware — statute, not a target", () => {
    expect(BOARD_REPORT_HOURS).toBe(72);
    expect(boardReportDueAt(AWARE, null)).toBe(DUE);
    // Any offset in, UTC out.
    expect(boardReportDueAt("2026-10-10T10:00:00+05:30", null)).toBe(DUE);
  });

  it("moves to the time the Board allowed on a written request", () => {
    expect(boardReportDueAt(AWARE, "2026-10-20T12:30:00+05:30")).toBe("2026-10-20T07:00:00.000Z");
  });

  it("exactly 72 hours is still in time; one millisecond later is overdue", () => {
    expect(boardReportOverdue(breach(), DUE)).toBe(false);
    expect(boardClock(breach(), DUE)).toMatchObject({ state: "running", minutesRemaining: 0 });
    expect(boardReportOverdue(breach(), "2026-10-13T04:30:00.001Z")).toBe(true);
    expect(boardClock(breach(), "2026-10-13T04:30:00.001Z")).toMatchObject({ state: "overdue", urgency: "overdue" });
  });

  it("stops when the report is recorded — and says if it was made late", () => {
    expect(boardReportOverdue(breach({ boardReportAt: "2026-10-12T04:30:00Z" }), "2026-12-01T00:00:00Z")).toBe(false);
    expect(boardClock(breach({ boardReportAt: "2026-10-12T04:30:00Z" }), "2026-12-01T00:00:00Z")).toMatchObject({
      state: "made",
      urgency: null,
      label: "Made 12 Oct 2026, 10:00 IST",
    });
    expect(boardClock(breach({ boardReportAt: "2026-10-14T04:30:00Z" }), "2026-12-01T00:00:00Z").label).toBe(
      "Made 14 Oct 2026, 10:00 IST — after the due time",
    );
  });

  it("does not run on a breach dismissed as not a personal data breach", () => {
    const dismissed = breach({ status: "dismissed" });
    expect(boardReportOverdue(dismissed, "2027-01-01T00:00:00Z")).toBe(false);
    expect(principalsPending(dismissed)).toBe(false);
    expect(boardClock(dismissed, "2027-01-01T00:00:00Z")).toMatchObject({ state: "not_applicable", minutesRemaining: null });
  });

  it("alerts at 48 and 12 hours remaining — labelled TrustStack targets, never statute", () => {
    expect(BREACH_ALERT_HOURS).toEqual({ warning: 48, critical: 12 });
    expect(BREACH_CLOCK_NOTE).toContain("TrustStack targets, not statutory periods");
    expect(BREACH_CLOCK_NOTE).toContain("seventy-two hours");
    const at = (hoursLeft: number) => new Date(Date.parse(DUE) - hoursLeft * 3_600_000).toISOString();
    expect(boardClock(breach(), at(49)).urgency).toBe("normal");
    expect(boardClock(breach(), at(48)).urgency).toBe("warning");
    expect(boardClock(breach(), at(13)).urgency).toBe("warning");
    expect(boardClock(breach(), at(12)).urgency).toBe("critical");
    expect(boardClock(breach(), at(0.5)).label).toBe("30m remaining");
    expect(boardClock(breach(), at(47.25)).label).toBe("47h 15m remaining");
    expect(boardClock(breach(), at(-3.5)).label).toBe("Overdue by 3h 30m");
  });
});

describe("times are UTC instants, shown in India's time", () => {
  it("accepts an instant with an offset only", () => {
    expect(isInstant("2026-10-10T04:30:00Z")).toBe(true);
    expect(isInstant("2026-10-10T04:30:00.123456+00:00")).toBe(true);
    expect(isInstant("2026-10-10")).toBe(false);
    expect(isInstant("2026-10-10T04:30:00")).toBe(false);
    expect(() => toInstant("yesterday")).toThrow(BreachInputError);
  });

  it("dates an instant in India — 23:59 UTC is the next day there", () => {
    expect(dateInIndia("2026-10-10T18:29:59Z")).toBe("2026-10-10");
    expect(dateInIndia("2026-10-10T18:30:00Z")).toBe("2026-10-11");
  });

  it("formats in IST", () => {
    expect(formatInIndia("2026-10-12T08:35:00Z")).toBe("12 Oct 2026, 14:05 IST");
    expect(formatInIndia("2026-12-31T20:00:00Z")).toBe("1 Jan 2027, 01:30 IST");
    expect(formatDuration(2834)).toBe("47h 14m");
    expect(formatDuration(-14)).toBe("14m");
  });
});

describe("the lifecycle", () => {
  it("open → contained → closed; dismissed or closed reopen to open only", () => {
    expect(BREACH_STATUSES).toEqual(["open", "contained", "closed", "dismissed"]);
    expect(canBreachTransition("open", "closed")).toBe(true);
    expect(canBreachTransition("contained", "open")).toBe(true);
    expect(canBreachTransition("closed", "contained")).toBe(false);
    expect(canBreachTransition("closed", "open")).toBe(true);
    expect(canBreachTransition("dismissed", "closed")).toBe(false);
    for (const s of BREACH_STATUSES) expect(BREACH_TRANSITIONS[s]).not.toContain(s);
  });

  it("every vocabulary has a plain label; severities are the gap ladder's four", () => {
    for (const n of BREACH_NATURES) expect(BREACH_NATURE_LABEL[n]).toBeTruthy();
    for (const s of BREACH_STATUSES) expect(BREACH_STATUS_LABEL[s]).toBeTruthy();
    expect([...BREACH_SEVERITIES]).toEqual(["critical", "high", "medium", "low"]);
    expect(BREACH_NATURE_LABEL.unauthorised_access).toBe("Unauthorised access");
  });
});

describe("the overview's counts", () => {
  it("counts rows, nothing more", () => {
    const now = "2026-10-12T04:30:00Z";
    const counts = countBreaches(
      [
        breach(), // inside the window, people not told
        breach({ status: "contained", boardReportDueAt: "2026-10-11T00:00:00Z" }), // overdue
        breach({ status: "closed", boardReportAt: "2026-10-11T00:00:00Z", principalsIntimatedAt: "2026-10-10T08:00:00Z" }),
        breach({ status: "dismissed" }),
      ],
      now,
    );
    expect(counts).toEqual({ total: 4, active: 2, insideWindow: 1, overdue: 1, principalsPending: 2, closed: 1, dismissed: 1 });
    expect(countBreaches([], now)).toEqual({ total: 0, active: 0, insideWindow: 0, overdue: 0, principalsPending: 0, closed: 0, dismissed: 0 });
  });
});

describe("addMonths counts calendar months exactly as Postgres does", () => {
  it("clamps to the month's last day", () => {
    expect(addMonths("2026-10-11", -24)).toBe("2024-10-11");
    expect(addMonths("2028-02-29", -24)).toBe("2026-02-28");
    expect(addMonths("2026-03-31", -1)).toBe("2026-02-28");
    expect(addMonths("2024-03-31", -1)).toBe("2024-02-29");
    expect(addMonths("2026-01-15", -13)).toBe("2024-12-15");
    expect(addMonths("2026-11-30", 3)).toBe("2027-02-28");
  });
});
