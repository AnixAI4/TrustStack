/**
 * Slice 10.5 Batch B1 — first-run and the overview: the small rules the
 * screens show. None of them changes a score, a permission or a model rule;
 * each only decides what a page SAYS or which choice it OFFERS.
 */
import { describe, expect, it } from "vitest";
import { isProgrammeRole, mostUrgentRegisterItem, ownOpenActions, PROGRAMME_ROLE_CODES, type DashboardActionFacts } from "./dashboard.js";
import { answeredProgress, DOMAIN_NOT_STARTED_LABEL, DOMAIN_STATUS_LABEL, domainStatusLabel } from "./engine.js";
import { assertCanAssignRole, assignableRoles, ROLE_CODES, ROLE_PERMISSIONS, ROLES, roleCapabilities, type RoleCode } from "./rbac.js";

// ---------------------------------------------------------------------------
// Q3 — "Not started" is a display rule only (D-104.3)
// ---------------------------------------------------------------------------

describe("domainStatusLabel (Q3)", () => {
  const scored = { state: "scored" as const, status: "needs_work" as const, questionCount: 8 };

  it("a scored domain with no answered question says Not started", () => {
    expect(domainStatusLabel({ ...scored, outstandingCount: 8 })).toBe(DOMAIN_NOT_STARTED_LABEL);
    expect(DOMAIN_NOT_STARTED_LABEL).toBe("Not started");
  });

  it("one answered question is enough to show the engine's own status", () => {
    expect(domainStatusLabel({ ...scored, outstandingCount: 7 })).toBe("Needs Work");
    expect(domainStatusLabel({ ...scored, status: "critical", outstandingCount: 7 })).toBe("Critical");
    expect(domainStatusLabel({ ...scored, status: "on_track", outstandingCount: 0 })).toBe("On Track");
  });

  it("never relabels a stored status other than by the answered count — the label table itself is unchanged", () => {
    expect(DOMAIN_STATUS_LABEL).toEqual({ critical: "Critical", high_risk: "High Risk", needs_work: "Needs Work", on_track: "On Track" });
  });

  it("leaves Scoped Out and All Not Applicable to their own labels (D-038)", () => {
    expect(domainStatusLabel({ state: "scoped_out", status: "needs_work", questionCount: 0, outstandingCount: 0 })).toBe("Needs Work");
    expect(domainStatusLabel({ state: "all_not_applicable", status: "needs_work", questionCount: 3, outstandingCount: 0 })).toBe("Needs Work");
  });
});

describe("answeredProgress (F1.4)", () => {
  it("counts answered questions — Not Applicable included — of every question generated", () => {
    expect(
      answeredProgress([
        { questionCount: 10, outstandingCount: 9 },
        { questionCount: 0, outstandingCount: 0 },
        { questionCount: 4, outstandingCount: 4 },
      ]),
    ).toEqual({ answered: 1, total: 14 });
  });

  it("is zero of zero for an empty assessment", () => {
    expect(answeredProgress([])).toEqual({ answered: 0, total: 0 });
  });
});

// ---------------------------------------------------------------------------
// F1.1 — "Your next steps"
// ---------------------------------------------------------------------------

const ME = "user-me";
const OTHER = "user-other";

let seq = 0;
function action(over: Partial<DashboardActionFacts> & { id?: string } = {}): DashboardActionFacts & { id: string } {
  seq += 1;
  return {
    id: over.id ?? `a-${String(seq).padStart(3, "0")}`,
    source: "assessment",
    ownerUserId: ME,
    status: "open",
    dueDate: "2026-10-20",
    severity: "high",
    gapState: "open",
    ...over,
  };
}

describe("ownOpenActions (F1.1)", () => {
  it("lists only the person's own outstanding actions — never another owner's, a closed one or a superseded gap's", () => {
    const mine = action({ id: "mine" });
    const result = ownOpenActions(
      [
        mine,
        action({ ownerUserId: OTHER }),
        action({ ownerUserId: null }),
        action({ status: "closed" }),
        action({ gapState: "superseded" }),
      ],
      ME,
    );
    expect(result.map((a) => a.id)).toEqual(["mine"]);
  });

  it("puts the overdue first, then the soonest due, and no-date (next cycle) last", () => {
    const result = ownOpenActions(
      [
        action({ id: "later", dueDate: "2026-12-01" }),
        action({ id: "next-cycle", dueDate: null }),
        action({ id: "overdue", dueDate: "2026-09-01", source: "retention" }),
        action({ id: "soon", dueDate: "2026-10-10", source: "breach" }),
      ],
      ME,
    );
    expect(result.map((a) => a.id)).toEqual(["overdue", "soon", "later", "next-cycle"]);
  });

  it("orders ties by id, so the list is stable", () => {
    const result = ownOpenActions([action({ id: "b" }), action({ id: "a" })], ME);
    expect(result.map((a) => a.id)).toEqual(["a", "b"]);
  });
});

describe("isProgrammeRole (F1.1)", () => {
  it("is the four programme roles the brief names, and no contributor or reviewer", () => {
    expect([...PROGRAMME_ROLE_CODES].sort()).toEqual(["consultant", "dpdp_owner", "executive_sponsor", "organization_admin"]);
    for (const role of ["department_owner", "legal_user", "it_security_user", "procurement_user", "auditor_reviewer"]) {
      expect(isProgrammeRole(role)).toBe(false);
    }
    expect(isProgrammeRole("dpdp_owner")).toBe(true);
  });
});

describe("mostUrgentRegisterItem (F1.1)", () => {
  const none = { breachClocks: [], rightsAttention: [], retentionOverdue: [] };

  it("is null when nothing in the registers needs someone, or the caller may read no register", () => {
    expect(mostUrgentRegisterItem(none)).toBeNull();
    expect(mostUrgentRegisterItem({ breachClocks: null, rightsAttention: null, retentionOverdue: null })).toBeNull();
  });

  it("ranks an overdue Board report, then one inside its 72 hours, then a request past ninety days, then an overdue erasure, then a request past the 30-day target", () => {
    const all = {
      breachClocks: [
        { id: "b-running", clock: { state: "running" as const } },
        { id: "b-overdue", clock: { state: "overdue" as const } },
      ],
      rightsAttention: [
        { id: "r-target", clock: { state: "past_target" as const } },
        { id: "r-overdue", clock: { state: "overdue" as const } },
      ],
      retentionOverdue: [{ id: "e-1" }, { id: "e-2" }],
    };
    expect(mostUrgentRegisterItem(all)).toEqual({ kind: "board_report_overdue", id: "b-overdue" });
    expect(mostUrgentRegisterItem({ ...all, breachClocks: [all.breachClocks[0]!] })).toEqual({ kind: "board_report_due", id: "b-running" });
    expect(mostUrgentRegisterItem({ ...all, breachClocks: [] })).toEqual({ kind: "rights_overdue", id: "r-overdue" });
    expect(mostUrgentRegisterItem({ ...all, breachClocks: [], rightsAttention: [all.rightsAttention[0]!] })).toEqual({ kind: "erasure_overdue", id: "e-1" });
    expect(mostUrgentRegisterItem({ ...none, rightsAttention: [all.rightsAttention[0]!] })).toEqual({ kind: "rights_past_target", id: "r-target" });
  });

  it("reads only the sections it is given — a register the caller may not read adds nothing", () => {
    expect(
      mostUrgentRegisterItem({ breachClocks: null, rightsAttention: null, retentionOverdue: [{ id: "e-1" }] }),
    ).toEqual({ kind: "erasure_overdue", id: "e-1" });
  });
});

// ---------------------------------------------------------------------------
// F1.8 — the role list offers only what the server will accept
// ---------------------------------------------------------------------------

const permissionsOf = (role: RoleCode) => new Set<string>(ROLE_PERMISSIONS[role]);

describe("assignableRoles (F1.8, D-068)", () => {
  it("an Organisation Admin is never offered Anix AI Consultant or Super Admin", () => {
    const roles = assignableRoles(permissionsOf("organization_admin"));
    expect(roles).not.toContain("consultant");
    expect(roles).not.toContain("super_admin");
    expect(roles).toEqual(
      expect.arrayContaining(["organization_admin", "dpdp_owner", "department_owner", "legal_user", "auditor_reviewer"]),
    );
  });

  it("is exactly the set assertCanAssignRole accepts, for every role as the actor", () => {
    for (const actor of ROLE_CODES) {
      const perms = permissionsOf(actor);
      const accepted = ROLE_CODES.filter((r) => {
        try {
          assertCanAssignRole(perms, r);
          return true;
        } catch {
          return false;
        }
      });
      expect(assignableRoles(perms)).toEqual(accepted);
    }
  });

  it("never offers a platform role, whoever is asking", () => {
    for (const actor of ROLE_CODES) {
      expect(assignableRoles(permissionsOf(actor)).some((r) => ROLES[r].isPlatformRole)).toBe(false);
    }
  });
});

describe("roleCapabilities (F1.8)", () => {
  it("says only what the role's permissions allow", () => {
    expect(roleCapabilities("executive_sponsor")).toEqual([
      "See the readiness score, gaps, registers and reports",
      "Download reports",
    ]);
    expect(roleCapabilities("auditor_reviewer")).toContain("Read the audit log");
    expect(roleCapabilities("auditor_reviewer")).not.toContain("Answer assessment questions and upload evidence");
    expect(roleCapabilities("department_owner")).toContain("Answer assessment questions and upload evidence");
    expect(roleCapabilities("department_owner")).not.toContain("Review other people's evidence");
    expect(roleCapabilities("organization_admin")).toContain("Change people's roles");
    expect(roleCapabilities("dpdp_owner")).not.toContain("Change people's roles");
  });

  it("gives every role at least one line", () => {
    for (const role of ROLE_CODES) expect(roleCapabilities(role).length).toBeGreaterThan(0);
  });
});
