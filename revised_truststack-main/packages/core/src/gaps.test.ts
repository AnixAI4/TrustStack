import { describe, expect, it } from "vitest";
import { domainWeight, type DomainCode } from "./domains.js";
import {
  GAP_PRIORITIES,
  GAP_SEVERITIES,
  questionPriority,
  questionSeverity,
  RED_FLAG_MAX_ADJUSTED,
  scoreAssessment,
  scoreDomain,
  SEVERITY_PRIORITY,
  type EngineDomainInput,
  type EngineResponse,
  type GapSeverity,
} from "./engine.js";
import {
  canTransition,
  CLOSURE_BASES,
  closureDecision,
  compareGaps,
  dueDate,
  GAP_ACTION_STATUSES,
  GAP_ACTION_TRANSITIONS,
  GAP_DUE_DAYS,
  GAP_MAX_ADJUSTED,
  GAP_OPENING_SEVERITIES,
  generateGaps,
  isOverdue,
  opensGap,
  roadmapWindow,
  ROADMAP_WINDOWS,
  type ClosureAttempt,
} from "./gaps.js";
import { adjustedScore, ScoringInputError } from "./scoring.js";

const answer = (questionCode: string, claimed: number, level: number | null): EngineResponse => ({
  questionCode,
  applicabilityDecision: "applicable",
  claimedMaturity: claimed,
  evidenceLevel: level,
});

const notApplicable = (questionCode: string): EngineResponse => ({
  questionCode,
  applicabilityDecision: "not_applicable",
  claimedMaturity: null,
  evidenceLevel: null,
});

const domain = (code: DomainCode, responses: EngineResponse[], questionCount = responses.length): EngineDomainInput => ({
  code,
  weight: domainWeight(code),
  questionCount,
  responses,
});

// ---------------------------------------------------------------------------
// The threshold
// ---------------------------------------------------------------------------

describe("the gap threshold (D-054)", () => {
  it("is 3 — the workbook's Gap_Action_Tracker!D, not the red-flag threshold", () => {
    expect(GAP_MAX_ADJUSTED).toBe(3);
    expect(GAP_MAX_ADJUSTED).not.toBe(RED_FLAG_MAX_ADJUSTED);
  });

  // The workbook sample cannot police this: every one of its 98 answers is
  // adjusted 2 or below, so `<= 3` and `<= 2` open the same 98 gaps there.
  it("adjusted 3 opens a gap; adjusted 4 does not", () => {
    expect(opensGap(3)).toBe(true);
    expect(opensGap(4)).toBe(false);
  });

  it("covers the whole range", () => {
    expect([0, 1, 2, 3, 4, 5].map(opensGap)).toEqual([true, true, true, true, false, false]);
  });

  it("refuses anything that is not an adjusted score", () => {
    for (const bad of [-1, 6, 2.5, Number.NaN]) expect(() => opensGap(bad)).toThrow(ScoringInputError);
  });

  it("opens a gap for exactly the severities critical, high, medium and low", () => {
    const opening = [0, 1, 2, 3, 4, 5].filter(opensGap).map(questionSeverity);
    expect(new Set(opening)).toEqual(new Set(GAP_OPENING_SEVERITIES));
  });

  it("a claim of 3 with E3 evidence is a gap but NOT a red flag — the two thresholds differ", () => {
    const adjusted = adjustedScore(3, 3);
    expect(opensGap(adjusted)).toBe(true);
    expect(adjusted <= RED_FLAG_MAX_ADJUSTED).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Severity → priority
// ---------------------------------------------------------------------------

describe("questionPriority — the workbook's Responses!L", () => {
  it("is the full six-row table", () => {
    expect(GAP_SEVERITIES.map((s) => [s, questionPriority(s)])).toEqual([
      ["no_gap", "Monitor"],
      ["improvement", "P3"],
      ["low", "P3"],
      ["medium", "P2"],
      ["high", "P1"],
      ["critical", "P0"],
    ]);
  });

  it("is Monitor for no_gap, never a P-level", () => {
    expect(questionPriority("no_gap")).toBe("Monitor");
  });

  it("covers every severity and only known priorities", () => {
    expect(Object.keys(SEVERITY_PRIORITY).sort()).toEqual([...GAP_SEVERITIES].sort());
    for (const p of Object.values(SEVERITY_PRIORITY)) expect(GAP_PRIORITIES).toContain(p);
  });

  it("refuses a severity it does not know", () => {
    expect(() => questionPriority("catastrophic" as GapSeverity)).toThrow(ScoringInputError);
  });

  // Under the spec's cap an adjusted 0 needs a claim of 0 (D-045).
  it("an unevidenced claim of 5 is adjusted 1 → high → P1, NOT critical / P0", () => {
    const adjusted = adjustedScore(5, null);
    expect(adjusted).toBe(1);
    expect(questionSeverity(adjusted)).toBe("high");
    expect(questionPriority(questionSeverity(adjusted))).toBe("P1");
  });

  it("only a claim of 0 is critical / P0", () => {
    expect(questionPriority(questionSeverity(adjustedScore(0, 5)))).toBe("P0");
  });
});

// ---------------------------------------------------------------------------
// Due dates
// ---------------------------------------------------------------------------

describe("dueDate (D-055)", () => {
  it("is 30 / 60 / 90 days for P0 / P1 / P2", () => {
    expect(dueDate("P0", "2026-10-02")).toBe("2026-11-01");
    expect(dueDate("P1", "2026-10-02")).toBe("2026-12-01");
    expect(dueDate("P2", "2026-10-02")).toBe("2026-12-31");
  });

  it("is null — next cycle — for P3 and Monitor, never an invented date", () => {
    expect(dueDate("P3", "2026-10-02")).toBeNull();
    expect(dueDate("Monitor", "2026-10-02")).toBeNull();
    expect(GAP_DUE_DAYS).toEqual({ P0: 30, P1: 60, P2: 90, P3: null, Monitor: null });
  });

  it("crosses a year end and a leap day by the calendar", () => {
    expect(dueDate("P0", "2026-12-15")).toBe("2027-01-14");
    expect(dueDate("P0", "2028-02-01")).toBe("2028-03-02");
  });

  it("takes the clock as an argument — the same inputs always give the same date", () => {
    expect(dueDate("P1", "2026-10-02")).toBe(dueDate("P1", "2026-10-02"));
  });

  it("refuses a date that is not a calendar date", () => {
    for (const bad of ["2026-02-31", "02/10/2026", "2026-10-02T00:00:00Z", ""]) {
      expect(() => dueDate("P0", bad)).toThrow(ScoringInputError);
    }
  });
});

// ---------------------------------------------------------------------------
// Generation
// ---------------------------------------------------------------------------

describe("generateGaps", () => {
  it("is a pure function over the engine's own output", () => {
    const result = scoreDomain(domain("GOV", [answer("G1.1", 2, 2), answer("G1.2", 5, 5), answer("G1.3", 3, 3)]));
    expect(generateGaps([result])).toEqual([
      { questionCode: "G1.1", domainCode: "GOV", adjusted: 2, severity: "medium", priority: "P2" },
      { questionCode: "G1.3", domainCode: "GOV", adjusted: 3, severity: "low", priority: "P3" },
    ]);
  });

  it("reads the ADJUSTED score — a claim of 5 with no reviewed evidence is a High gap", () => {
    const result = scoreDomain(domain("GOV", [answer("G1.2", 5, null)]));
    expect(generateGaps([result])).toEqual([
      { questionCode: "G1.2", domainCode: "GOV", adjusted: 1, severity: "high", priority: "P1" },
    ]);
  });

  it("opens nothing at adjusted 4 or 5", () => {
    const result = scoreDomain(domain("GOV", [answer("G1.1", 4, 4), answer("G1.2", 5, 5)]));
    expect(generateGaps([result])).toEqual([]);
  });

  it("a Scoped Out domain produces NO gaps — its questions were never asked (D-038)", () => {
    const score = scoreAssessment([domain("GOV", [answer("G1.1", 1, 1)]), domain("VENDOR", [], 0)]);
    expect(score.domains.find((d) => d.code === "VENDOR")!.state).toBe("scoped_out");
    expect(generateGaps(score.domains).map((g) => g.domainCode)).toEqual(["GOV"]);
  });

  it("a Not Applicable answer produces no gap, and neither does an unanswered question", () => {
    const result = scoreDomain(domain("CHILD", [notApplicable("CH1.1"), answer("CH1.2", 0, 0)], 4));
    expect(result.outstandingCount).toBe(2);
    expect(generateGaps([result]).map((g) => g.questionCode)).toEqual(["CH1.2"]);
  });

  it("an all-Not-Applicable domain produces none either — and it is not the same fact as scoped out", () => {
    const result = scoreDomain(domain("CHILD", [notApplicable("CH1.1"), notApplicable("CH1.2")]));
    expect(result.state).toBe("all_not_applicable");
    expect(generateGaps([result])).toEqual([]);
  });

  it("sorts most severe first, then by the model's domain order, then by question", () => {
    const score = scoreAssessment([
      domain("SECURITY", [answer("S1.2", 0, 0), answer("S1.10", 0, 0)]),
      domain("GOV", [answer("G1.1", 3, 3), answer("G1.2", 0, 0)]),
    ]);
    expect(generateGaps(score.domains).map((g) => g.questionCode)).toEqual(["G1.2", "S1.2", "S1.10", "G1.1"]);
  });

  // 234 bank questions carry no authored priority. The gap's priority comes
  // from severity, so a null question priority can neither crash the
  // generator nor sort to the top as if it were P0.
  it("never reads the question's authored priority: the gap's priority is the severity's", () => {
    const gaps = generateGaps([scoreDomain(domain("GOV", [answer("UNI-GOV-009", 3, 3)]))]);
    expect(gaps[0]!.priority).toBe("P3");
    expect(Object.keys(gaps[0]!)).not.toContain("questionPriority");
  });

  it("compareGaps orders by severity alone when nothing else differs", () => {
    const low = { severity: "low" as const, domainCode: "GOV" as const, questionCode: "G1.1" };
    const critical = { severity: "critical" as const, domainCode: "GOV" as const, questionCode: "G1.1" };
    expect(compareGaps(critical, low)).toBeLessThan(0);
    expect(compareGaps(low, critical)).toBeGreaterThan(0);
    expect(compareGaps(low, low)).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// The workflow
// ---------------------------------------------------------------------------

describe("the action workflow", () => {
  it("has four statuses", () => {
    expect(GAP_ACTION_STATUSES).toEqual(["open", "in_progress", "blocked", "closed"]);
    expect(Object.keys(GAP_ACTION_TRANSITIONS).sort()).toEqual([...GAP_ACTION_STATUSES].sort());
  });

  it("is exactly this graph", () => {
    const legal = GAP_ACTION_STATUSES.flatMap((from) =>
      GAP_ACTION_STATUSES.filter((to) => canTransition(from, to)).map((to) => `${from}→${to}`),
    );
    expect(legal).toEqual([
      "open→in_progress",
      "open→blocked",
      "open→closed",
      "in_progress→open",
      "in_progress→blocked",
      "in_progress→closed",
      "blocked→open",
      "blocked→in_progress",
      "closed→in_progress",
    ]);
  });

  it("a Blocked action cannot be closed directly", () => {
    expect(canTransition("blocked", "closed")).toBe(false);
  });

  it("a Closed action reopens to In Progress, and only there", () => {
    expect(GAP_ACTION_TRANSITIONS.closed).toEqual(["in_progress"]);
  });

  it("staying put is not a transition", () => {
    for (const s of GAP_ACTION_STATUSES) expect(canTransition(s, s)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Closing
// ---------------------------------------------------------------------------

describe("closureDecision — a gap is never closed on a promise (D-056)", () => {
  const base: ClosureAttempt = {
    ownerUserId: "owner",
    closedByUserId: "owner",
    closerCanReview: false,
    hasAcceptedEvidence: false,
  };

  it("refuses the owner closing their own action with nothing attached", () => {
    expect(closureDecision(base)).toEqual({ allowed: false, reason: "no_evidence_or_reviewer" });
  });

  it("refuses the owner even when the owner is a reviewer — nobody approves their own work", () => {
    expect(closureDecision({ ...base, closerCanReview: true })).toEqual({
      allowed: false,
      reason: "no_evidence_or_reviewer",
    });
  });

  it("refuses a colleague who is not a reviewer", () => {
    expect(closureDecision({ ...base, closedByUserId: "colleague" })).toEqual({
      allowed: false,
      reason: "no_evidence_or_reviewer",
    });
  });

  it("allows a reviewer who is not the owner", () => {
    expect(closureDecision({ ...base, closedByUserId: "reviewer", closerCanReview: true })).toEqual({
      allowed: true,
      basis: "reviewer_approval",
    });
  });

  it("allows the owner once accepted evidence is attached", () => {
    expect(closureDecision({ ...base, hasAcceptedEvidence: true })).toEqual({ allowed: true, basis: "evidence" });
  });

  it("prefers evidence as the basis when both hold", () => {
    expect(
      closureDecision({ ...base, closedByUserId: "reviewer", closerCanReview: true, hasAcceptedEvidence: true }),
    ).toEqual({ allowed: true, basis: "evidence" });
  });

  it("refuses an unowned action whatever else is true", () => {
    expect(
      closureDecision({ ownerUserId: null, closedByUserId: "reviewer", closerCanReview: true, hasAcceptedEvidence: true }),
    ).toEqual({ allowed: false, reason: "no_owner" });
  });

  it("allows the owner once someone else has recorded the erasure on a retention schedule (Stage 5)", () => {
    expect(closureDecision({ ...base, hasErasureByAnother: true })).toEqual({ allowed: true, basis: "erasure_recorded" });
  });

  it("prefers evidence, then the erasure, then the reviewer", () => {
    const all = { ...base, closedByUserId: "reviewer", closerCanReview: true, hasErasureByAnother: true };
    expect(closureDecision({ ...all, hasAcceptedEvidence: true })).toEqual({ allowed: true, basis: "evidence" });
    expect(closureDecision(all)).toEqual({ allowed: true, basis: "erasure_recorded" });
  });

  it("knows three bases and no others — there is no 'self-attested'", () => {
    expect(CLOSURE_BASES).toEqual(["evidence", "reviewer_approval", "erasure_recorded"]);
  });
});

// ---------------------------------------------------------------------------
// The roadmap
// ---------------------------------------------------------------------------

describe("roadmapWindow", () => {
  const today = "2026-10-02";

  it("buckets by days from today, boundaries inclusive", () => {
    expect(roadmapWindow("2026-10-01", today)).toBe("overdue");
    expect(roadmapWindow("2026-10-02", today)).toBe("days_30");
    expect(roadmapWindow("2026-11-01", today)).toBe("days_30");
    expect(roadmapWindow("2026-11-02", today)).toBe("days_60");
    expect(roadmapWindow("2026-12-01", today)).toBe("days_60");
    expect(roadmapWindow("2026-12-02", today)).toBe("days_90");
    expect(roadmapWindow("2026-12-31", today)).toBe("days_90");
    expect(roadmapWindow("2027-01-01", today)).toBe("later");
  });

  it("puts an undated action in the next cycle, not in the sprint", () => {
    expect(roadmapWindow(null, today)).toBe("next_cycle");
  });

  it("places each default due date in its own column on the day the gap opens", () => {
    expect(roadmapWindow(dueDate("P0", today), today)).toBe("days_30");
    expect(roadmapWindow(dueDate("P1", today), today)).toBe("days_60");
    expect(roadmapWindow(dueDate("P2", today), today)).toBe("days_90");
    expect(roadmapWindow(dueDate("P3", today), today)).toBe("next_cycle");
  });

  it("has six windows", () => {
    expect(ROADMAP_WINDOWS).toHaveLength(6);
  });

  it("a closed action is never overdue", () => {
    expect(isOverdue("open", "2026-09-01", today)).toBe(true);
    expect(isOverdue("blocked", "2026-09-01", today)).toBe(true);
    expect(isOverdue("closed", "2026-09-01", today)).toBe(false);
    expect(isOverdue("open", null, today)).toBe(false);
  });
});
