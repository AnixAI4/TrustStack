import { describe, expect, it } from "vitest";
import {
  ACTION_SOURCE_LABEL,
  ACTION_SOURCES,
  bucketActionsByWindow,
  countRopaRegister,
  groupActionsByOwner,
  isOutstanding,
  summariseActions,
  type DashboardActionFacts,
  type RopaCountFacts,
} from "./dashboard.js";
import { ROADMAP_WINDOWS } from "./gaps.js";
import { ROPA_BANDS } from "./ropa.js";

const TODAY = "2026-10-04";

let seq = 0;
function action(over: Partial<DashboardActionFacts> & { id?: string } = {}): DashboardActionFacts & { id: string } {
  seq += 1;
  return {
    id: over.id ?? `a-${seq}`,
    source: "assessment",
    ownerUserId: null,
    status: "open",
    dueDate: "2026-10-20",
    severity: "high",
    gapState: "open",
    ...over,
  };
}

describe("isOutstanding — the roadmap's own rule", () => {
  it("an open action on an open gap is owed", () => {
    expect(isOutstanding({ status: "open", gapState: "open" })).toBe(true);
    expect(isOutstanding({ status: "in_progress", gapState: "open" })).toBe(true);
    expect(isOutstanding({ status: "blocked", gapState: "open" })).toBe(true);
  });
  it("a closed action is done, and a superseded gap is no longer remediation work", () => {
    expect(isOutstanding({ status: "closed", gapState: "open" })).toBe(false);
    expect(isOutstanding({ status: "open", gapState: "superseded" })).toBe(false);
  });
});

describe("summariseActions — counts across both parents", () => {
  it("an empty register is all zeros, never undefined", () => {
    const s = summariseActions([], TODAY);
    expect(s).toMatchObject({ total: 0, outstanding: 0, overdue: 0, unassigned: 0, closed: 0 });
    expect(Object.keys(s.byWindow)).toEqual([...ROADMAP_WINDOWS]);
    expect(Object.values(s.byWindow).every((n) => n === 0)).toBe(true);
    expect(s.bySeverity).toEqual({ critical: 0, high: 0, medium: 0, low: 0 });
    expect(s.bySource).toEqual({ assessment: { outstanding: 0, overdue: 0 }, ropa: { outstanding: 0, overdue: 0 }, breach: { outstanding: 0, overdue: 0 }, rights: { outstanding: 0, overdue: 0 }, retention: { outstanding: 0, overdue: 0 } });
  });

  it("counts an overdue ROPA action and an overdue assessment action, each under its own source", () => {
    const s = summariseActions(
      [
        action({ source: "assessment", dueDate: "2026-10-03" }),
        action({ source: "ropa", dueDate: "2026-09-01", severity: "critical" }),
        action({ source: "ropa", dueDate: "2026-11-01", severity: "medium" }),
      ],
      TODAY,
    );
    expect(s.outstanding).toBe(3);
    expect(s.overdue).toBe(2);
    expect(s.bySource.assessment).toEqual({ outstanding: 1, overdue: 1 });
    expect(s.bySource.ropa).toEqual({ outstanding: 2, overdue: 1 });
    expect(s.bySeverity).toEqual({ critical: 1, high: 1, medium: 1, low: 0 });
  });

  it("a due date of today is not overdue; yesterday is (D-055)", () => {
    expect(summariseActions([action({ dueDate: TODAY })], TODAY).overdue).toBe(0);
    expect(summariseActions([action({ dueDate: "2026-10-03" })], TODAY).overdue).toBe(1);
  });

  it("a closed action past its date is closed, not overdue", () => {
    const s = summariseActions([action({ status: "closed", dueDate: "2026-01-01" })], TODAY);
    expect(s).toMatchObject({ total: 1, closed: 1, outstanding: 0, overdue: 0 });
  });

  it("an action on a superseded gap is neither outstanding nor overdue", () => {
    const s = summariseActions([action({ gapState: "superseded", dueDate: "2026-01-01" })], TODAY);
    expect(s).toMatchObject({ total: 1, outstanding: 0, overdue: 0, unassigned: 0 });
  });

  it("unassigned means no PERSON — whatever role the question suggested", () => {
    const s = summariseActions([action({ ownerUserId: null }), action({ ownerUserId: "u-1" })], TODAY);
    expect(s.unassigned).toBe(1);
  });

  it("places each outstanding action in exactly one window; no date = next cycle", () => {
    const s = summariseActions(
      [
        action({ dueDate: "2026-10-01" }),
        action({ dueDate: "2026-11-03" }),
        action({ dueDate: "2026-11-04" }),
        action({ dueDate: "2026-12-03" }),
        action({ dueDate: "2027-01-02" }),
        action({ dueDate: "2027-01-03" }),
        action({ dueDate: null, severity: "low" }),
      ],
      TODAY,
    );
    expect(s.byWindow).toEqual({ overdue: 1, days_30: 1, days_60: 2, days_90: 1, later: 1, next_cycle: 1 });
    expect(Object.values(s.byWindow).reduce((a, b) => a + b, 0)).toBe(s.outstanding);
  });
});

describe("groupActionsByOwner — a person, with Unassigned as a real bucket", () => {
  it("Unassigned comes first, then owners by how much they hold", () => {
    const groups = groupActionsByOwner(
      [
        action({ ownerUserId: "u-b" }),
        action({ ownerUserId: "u-a" }),
        action({ ownerUserId: "u-a", source: "ropa" }),
        action({ ownerUserId: null }),
      ],
      TODAY,
    );
    expect(groups.map((g) => g.ownerUserId)).toEqual([null, "u-a", "u-b"]);
    expect(groups[1]!.items.map((i) => i.source)).toEqual(["assessment", "ropa"]);
  });

  it("mixes both parents under one owner and counts their overdue items", () => {
    const [group] = groupActionsByOwner(
      [
        action({ ownerUserId: "u-1", source: "assessment", dueDate: "2026-10-01" }),
        action({ ownerUserId: "u-1", source: "ropa", dueDate: "2026-09-01" }),
        action({ ownerUserId: "u-1", source: "ropa", dueDate: "2026-12-01" }),
      ],
      TODAY,
    );
    expect(group).toMatchObject({ ownerUserId: "u-1", overdue: 2 });
    expect(group!.items).toHaveLength(3);
  });

  it("leaves closed actions and superseded gaps out", () => {
    const groups = groupActionsByOwner(
      [action({ ownerUserId: "u-1", status: "closed" }), action({ ownerUserId: "u-2", gapState: "superseded" })],
      TODAY,
    );
    expect(groups).toEqual([]);
  });

  it("ties are ordered by id so the page does not reshuffle", () => {
    const a = groupActionsByOwner([action({ ownerUserId: "u-z" }), action({ ownerUserId: "u-m" })], TODAY);
    const b = groupActionsByOwner([action({ ownerUserId: "u-m" }), action({ ownerUserId: "u-z" })], TODAY);
    expect(a.map((g) => g.ownerUserId)).toEqual(["u-m", "u-z"]);
    expect(b.map((g) => g.ownerUserId)).toEqual(["u-m", "u-z"]);
  });
});

describe("bucketActionsByWindow", () => {
  it("returns every window, outstanding actions only, keeping the caller's items", () => {
    const overdue = action({ id: "late", dueDate: "2026-09-30" });
    const done = action({ id: "done", status: "closed", dueDate: "2026-09-30" });
    const out = bucketActionsByWindow([overdue, done], TODAY);
    expect(Object.keys(out)).toEqual([...ROADMAP_WINDOWS]);
    expect(out.overdue).toEqual([overdue]);
    expect(Object.values(out).flat()).toHaveLength(1);
  });
});

describe("action sources", () => {
  it("names both parents in plain language", () => {
    expect([...ACTION_SOURCES]).toEqual(["assessment", "ropa", "breach", "rights", "retention"]);
    expect(ACTION_SOURCE_LABEL).toEqual({
      assessment: "Assessment",
      ropa: "Processing register",
      breach: "Breach register",
      rights: "Rights and grievance register",
      retention: "Retention register",
    });
  });
});

// ---------------------------------------------------------------------------

function record(over: Partial<RopaCountFacts> = {}): RopaCountFacts {
  return {
    status: "draft",
    completenessScore: 70,
    completenessBand: "usable",
    completenessMissing: [],
    riskRating: "medium",
    childrenData: "no",
    aiProcessing: "no",
    crossBorder: "no",
    vendorLinkCount: 0,
    nextReviewAt: "2027-01-01",
    ...over,
  };
}

describe("countRopaRegister — the spec's ten ROPA metrics, counted from stored fields", () => {
  it("an empty register is all zeros, every band present", () => {
    const c = countRopaRegister([], TODAY);
    expect(c).toMatchObject({
      total: 0, archived: 0, approved: 0, notApproved: 0, belowUsable: 0, highRisk: 0, children: 0,
      vendorLinked: 0, ai: 0, unknownLocation: 0, missingRetention: 0, reviewOverdue: 0,
    });
    expect(Object.keys(c.byBand)).toEqual(ROPA_BANDS.map((b) => b.band));
  });

  it("archived records are history: counted as archived and nowhere else", () => {
    const c = countRopaRegister(
      [record({ status: "archived", riskRating: "critical", childrenData: "yes", nextReviewAt: null })],
      TODAY,
    );
    expect(c).toMatchObject({ total: 0, archived: 1, highRisk: 0, children: 0, reviewOverdue: 0 });
  });

  it("approved vs not yet approved (draft and in review)", () => {
    const c = countRopaRegister(
      [record({ status: "approved" }), record({ status: "draft" }), record({ status: "in_review" })],
      TODAY,
    );
    expect(c).toMatchObject({ total: 3, approved: 1, notApproved: 2 });
  });

  it("below Usable is the band table's own boundary: 60 is below, 61 is not", () => {
    const c = countRopaRegister(
      [record({ completenessScore: 60, completenessBand: "basic" }), record({ completenessScore: 61, completenessBand: "usable" })],
      TODAY,
    );
    expect(c.belowUsable).toBe(1);
    expect(c.byBand).toEqual({ incomplete: 0, basic: 1, usable: 1, strong: 0 });
  });

  it("high risk is High or Critical, as the database rated it", () => {
    const c = countRopaRegister(
      ["low", "medium", "high", "critical"].map((r) => record({ riskRating: r as RopaCountFacts["riskRating"] })),
      TODAY,
    );
    expect(c.highRisk).toBe(2);
  });

  it("children's data and AI count 'not yet known' — both still need the review", () => {
    const c = countRopaRegister(
      [
        record({ childrenData: "yes", aiProcessing: "unknown" }),
        record({ childrenData: "unknown", aiProcessing: "yes" }),
        record({ childrenData: "no", aiProcessing: "no" }),
      ],
      TODAY,
    );
    expect(c).toMatchObject({ children: 2, ai: 2 });
  });

  it("vendor-linked reads the stored link count; unknown location reads 'unknown' only", () => {
    const c = countRopaRegister(
      [record({ vendorLinkCount: 2, crossBorder: "unknown" }), record({ vendorLinkCount: 0, crossBorder: "yes" })],
      TODAY,
    );
    expect(c).toMatchObject({ vendorLinked: 1, unknownLocation: 1 });
  });

  it("missing retention is whatever the database found missing — never re-derived", () => {
    const c = countRopaRegister(
      [record({ completenessMissing: ["retention", "security"] }), record({ completenessMissing: ["security"] })],
      TODAY,
    );
    expect(c.missingRetention).toBe(1);
  });

  it("review overdue: no date, or a date before today in India; today is not overdue", () => {
    const c = countRopaRegister(
      [record({ nextReviewAt: null }), record({ nextReviewAt: "2026-10-03" }), record({ nextReviewAt: TODAY })],
      TODAY,
    );
    expect(c.reviewOverdue).toBe(2);
  });
});
