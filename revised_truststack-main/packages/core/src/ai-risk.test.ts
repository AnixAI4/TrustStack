import { describe, expect, it } from "vitest";
import {
  aiChildProblem,
  aiChildTrackingUnexempt,
  AI_CHILD_TRACKING_QUESTION,
  aiReviewDueOn,
  aiSystemUnreviewed,
  AiRiskInputError,
  AI_REGISTER_USAGE_TYPES,
  AI_REVIEW_MONTHS,
  AI_RISK_NOTE,
  AI_SYSTEM_STATUSES,
  countAiSystems,
} from "./ai-risk.js";

const TODAY = "2026-10-14";

describe("the AI risk register's vocabularies", () => {
  it("in use or retired; the scope's AI uses, never 'none'", () => {
    expect([...AI_SYSTEM_STATUSES]).toEqual(["in_use", "retired"]);
    expect([...AI_REGISTER_USAGE_TYPES]).toEqual(["proctoring", "chatbot", "analytics", "scoring", "recommendation"]);
  });
  it("says the duty is a Significant Data Fiduciary's, and the interval is TrustStack's (pitfall 1)", () => {
    expect(AI_RISK_NOTE).toContain("Rule 13(3)");
    expect(AI_RISK_NOTE).toContain("never sets an exposure status");
    expect(AI_RISK_NOTE).toContain("TrustStack default");
    expect(AI_REVIEW_MONTHS).toBe(12);
  });
});

describe("aiSystemUnreviewed — model 1.5.0's reason on head 4", () => {
  it("never reviewed, in use: unreviewed", () => {
    expect(aiSystemUnreviewed({ status: "in_use", lastReviewedOn: null }, TODAY)).toBe(true);
  });
  it("due twelve months after the last review; on the due date still current, the day after not", () => {
    expect(aiReviewDueOn("2025-10-14")).toBe("2026-10-14");
    expect(aiSystemUnreviewed({ status: "in_use", lastReviewedOn: "2025-10-14" }, TODAY)).toBe(false);
    expect(aiSystemUnreviewed({ status: "in_use", lastReviewedOn: "2025-10-13" }, TODAY)).toBe(true);
  });
  it("a retired system is never unreviewed", () => {
    expect(aiSystemUnreviewed({ status: "retired", lastReviewedOn: null }, TODAY)).toBe(false);
  });
  it("refuses a date that is not a calendar date", () => {
    expect(() => aiReviewDueOn("2026-13-01")).toThrow(AiRiskInputError);
  });
});

describe("children — s.9(3) and the Fourth Schedule (D-096, R5)", () => {
  it("asks the Act's own question", () => {
    expect(AI_CHILD_TRACKING_QUESTION).toBe("Does it track, behaviourally monitor or target advertising at children?");
  });
  it("an exemption only on yes, and only one of the eleven", () => {
    expect(aiChildProblem("yes", null)).toBeNull();
    expect(aiChildProblem("yes", "education")).toBeNull();
    expect(aiChildProblem("no", "education")).toMatch(/only when the system tracks/);
    expect(aiChildProblem("unknown", "education")).toMatch(/only when the system tracks/);
    expect(aiChildProblem("yes", "proctoring")).toMatch(/not one of the Fourth Schedule/);
  });
  it("the warning: in use, yes, no exemption — never a retired system", () => {
    expect(aiChildTrackingUnexempt({ status: "in_use", childTracking: "yes", childExemption: null })).toBe(true);
    expect(aiChildTrackingUnexempt({ status: "in_use", childTracking: "yes", childExemption: "education" })).toBe(false);
    expect(aiChildTrackingUnexempt({ status: "in_use", childTracking: "unknown", childExemption: null })).toBe(false);
    expect(aiChildTrackingUnexempt({ status: "retired", childTracking: "yes", childExemption: null })).toBe(false);
  });
});

describe("countAiSystems", () => {
  it("an empty register is all zeros", () => {
    expect(countAiSystems([], TODAY)).toEqual({
      total: 0,
      inUse: 0,
      unreviewed: 0,
      childTracking: 0,
      childTrackingUnexempt: 0,
      childTrackingUnknown: 0,
    });
  });
  it("children: tracking, unexempt and unknown — in use only", () => {
    expect(
      countAiSystems(
        [
          { status: "in_use", lastReviewedOn: null, childTracking: "yes", childExemption: null },
          { status: "in_use", lastReviewedOn: "2026-09-01", childTracking: "yes", childExemption: "education" },
          { status: "in_use", lastReviewedOn: "2026-09-01", childTracking: "unknown", childExemption: null },
          { status: "in_use", lastReviewedOn: "2026-09-01", childTracking: "no", childExemption: null },
          { status: "retired", lastReviewedOn: null, childTracking: "yes", childExemption: null },
        ],
        TODAY,
      ),
    ).toEqual({ total: 5, inUse: 4, unreviewed: 1, childTracking: 2, childTrackingUnexempt: 1, childTrackingUnknown: 1 });
  });
});
