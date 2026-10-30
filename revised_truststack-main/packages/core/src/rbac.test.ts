import { describe, expect, it } from "vitest";
import {
  assertCanAssignRole,
  assertNotSelfDemotion,
  can,
  ForbiddenError,
  isMemberOf,
  LastOrganizationAdminError,
  PERMISSION_CODES,
  resolveEffectivePermissions,
  ROLE_CODES,
  ROLE_PERMISSIONS,
  ROLES,
  type PermissionCode,
  type RoleCode,
} from "./index.js";

/**
 * The expected truth table, written out independently of ROLE_PERMISSIONS so a
 * careless edit to the matrix fails here. Columns follow PERMISSION_CODES.
 * S=super C=consultant A=org admin E=executive O=dpdp owner D=dept owner
 * L=legal I=IT/security P=procurement R=auditor/reviewer
 */
const EXPECTED: Record<PermissionCode, string> = {
  //                          S C A E O D L I P R
  "organization.read":        "1 1 1 1 1 1 1 1 1 1",
  "organization.update":      "1 1 1 0 0 0 0 0 0 0",
  "organization.users.read":  "1 1 1 0 1 0 0 0 0 0",
  "organization.users.invite":"1 1 1 0 0 0 0 0 0 0",
  "organization.users.update":"1 0 1 0 0 0 0 0 0 0",
  "scope.write":              "1 1 1 0 1 0 0 0 0 0",
  "question.read":            "1 1 1 1 1 1 1 1 1 1",
  "question.read_bank":       "1 1 0 0 0 0 0 0 0 0",
  "admin.question.update":    "1 0 0 0 0 0 0 0 0 0",
  "assessment.read":          "1 1 1 1 1 1 1 1 1 1",
  "assessment.write":         "1 1 1 0 1 0 0 0 0 0",
  "assessment.finalise":      "1 1 1 0 1 0 0 0 0 0",
  "response.read":            "1 1 1 1 1 1 1 1 1 1",
  "response.write":           "1 1 1 0 1 1 1 1 1 0",
  "evidence.read":            "1 1 1 1 1 1 1 1 1 1",
  "evidence.write":           "1 1 1 0 1 1 1 1 1 0",
  "evidence.review":          "1 1 1 0 1 0 0 0 0 0",
  "ropa.read":                "1 1 1 1 1 1 1 1 1 1",
  "ropa.write":               "1 1 1 0 1 1 1 1 1 0",
  // Slice 10: reading the breach register is everyone's; writing, the register writers'.
  "breach.read":              "1 1 1 1 1 1 1 1 1 1",
  "breach.write":             "1 1 1 0 1 1 1 1 1 0",
  // Slice 10, Stage 2: the rights and grievance register, as the breach register.
  "rights.read":              "1 1 1 1 1 1 1 1 1 1",
  "rights.write":             "1 1 1 0 1 1 1 1 1 0",
  // Slice 10, Stage 3b: notice and consent. Publishing is the leads' and the lawyers'.
  "consent.read":             "1 1 1 1 1 1 1 1 1 1",
  "consent.write":            "1 1 1 0 1 1 1 1 1 0",
  "consent.publish":          "1 1 1 0 1 0 1 0 0 0",
  // Slice 10, Stage 4a: processor assessments. Entering is the register writers';
  // accepting or returning one is the leads', Legal's and Procurement's.
  "vendor.assess":            "1 1 1 0 1 1 1 1 1 0",
  "vendor.review":            "1 1 1 0 1 0 1 0 1 0",
  // Slice 10, Stage 5: the retention register, as the rights register.
  "retention.read":           "1 1 1 1 1 1 1 1 1 1",
  "retention.write":          "1 1 1 0 1 1 1 1 1 0",
  "score.read":               "1 1 1 1 1 1 1 1 1 1",
  "score.calculate":          "1 1 1 0 1 0 0 0 0 0",
  "gap.read":                 "1 1 1 1 1 1 1 1 1 1",
  "gap.write":                "1 1 1 0 1 1 1 1 1 0",
  "report.read":              "1 1 1 1 1 1 1 1 1 1",
  "report.generate":          "1 1 1 0 1 0 0 0 0 0",
  "report.download":          "1 1 1 1 1 0 0 0 0 1",
  "ai.use":                   "1 1 1 1 1 1 1 1 1 1",
  "audit.read":               "1 1 1 0 1 0 0 0 0 1",
  "audit.read_summary":       "1 1 1 1 1 0 0 0 0 0",
  "audit.read_own":           "1 1 1 0 1 1 1 1 1 0",
};

const COLUMN_ORDER: RoleCode[] = [
  "super_admin",
  "consultant",
  "organization_admin",
  "executive_sponsor",
  "dpdp_owner",
  "department_owner",
  "legal_user",
  "it_security_user",
  "procurement_user",
  "auditor_reviewer",
];

describe("role and permission catalogue", () => {
  it("has the ten spec roles and a definition for each", () => {
    expect(ROLE_CODES).toHaveLength(10);
    expect([...ROLE_CODES].sort()).toEqual([...COLUMN_ORDER].sort());
    for (const code of ROLE_CODES) expect(ROLES[code].code).toBe(code);
  });

  it("only super_admin is a platform role", () => {
    expect(ROLE_CODES.filter((r) => ROLES[r].isPlatformRole)).toEqual(["super_admin"]);
  });

  it("every matrix entry is a known permission, with no duplicates", () => {
    for (const role of ROLE_CODES) {
      const perms = ROLE_PERMISSIONS[role];
      expect(new Set(perms).size).toBe(perms.length);
      for (const p of perms) expect(PERMISSION_CODES).toContain(p);
    }
  });

  it("the expected table covers every permission", () => {
    expect(Object.keys(EXPECTED).sort()).toEqual([...PERMISSION_CODES].sort());
  });
});

describe("can() — full truth table across all ten roles", () => {
  for (const permission of PERMISSION_CODES) {
    const row = EXPECTED[permission].split(" ");
    COLUMN_ORDER.forEach((role, i) => {
      const expected = row[i] === "1";
      it(`${role} ${expected ? "can" : "cannot"} ${permission}`, () => {
        expect(can(resolveEffectivePermissions(role), permission)).toBe(expected);
      });
    });
  }

  it("an empty set grants nothing; unknown strings grant nothing", () => {
    expect(can(new Set(), "organization.read")).toBe(false);
    expect(can(new Set(["organization.*", "ORGANIZATION.READ"]), "organization.read")).toBe(false);
  });
});

describe("resolveEffectivePermissions", () => {
  it("applies grants, then revokes — revoke wins", () => {
    const p = resolveEffectivePermissions("executive_sponsor", {
      grant: ["assessment.write", "report.generate"],
      revoke: ["report.generate", "report.download"],
    });
    expect(p.has("assessment.write")).toBe(true);
    expect(p.has("report.generate")).toBe(false);
    expect(p.has("report.download")).toBe(false);
  });

  it("returns a fresh set — mutating it does not change the matrix", () => {
    resolveEffectivePermissions("department_owner").add("admin.question.update");
    expect(resolveEffectivePermissions("department_owner").has("admin.question.update")).toBe(false);
  });
});

describe("assertCanAssignRole — no privilege escalation", () => {
  const admin = resolveEffectivePermissions("organization_admin");
  const consultant = resolveEffectivePermissions("consultant");

  it("an org admin may grant any client role", () => {
    for (const role of ROLE_CODES.filter((r) => r !== "super_admin" && r !== "consultant")) {
      expect(() => assertCanAssignRole(admin, role)).not.toThrow();
    }
  });

  it("an org admin cannot mint a consultant: the whole bank is Anix's view, not the client's (D-068)", () => {
    expect(admin.has("question.read_bank")).toBe(false);
    expect(() => assertCanAssignRole(admin, "consultant")).toThrow(/permissions you do not hold/);
  });

  it("nobody grants super_admin from inside an organisation", () => {
    expect(() => assertCanAssignRole(resolveEffectivePermissions("super_admin"), "super_admin")).toThrow(
      ForbiddenError,
    );
  });

  it("a consultant may invite contributors but cannot mint an org admin", () => {
    expect(() => assertCanAssignRole(consultant, "department_owner")).not.toThrow();
    expect(() => assertCanAssignRole(consultant, "dpdp_owner")).not.toThrow();
    expect(() => assertCanAssignRole(consultant, "organization_admin")).toThrow(ForbiddenError);
  });

  it("a department owner cannot grant a dpdp owner", () => {
    expect(() => assertCanAssignRole(resolveEffectivePermissions("department_owner"), "dpdp_owner")).toThrow(
      /permissions you do not hold/,
    );
  });
});

describe("assertNotSelfDemotion — the last organization_admin", () => {
  const me = { userId: "u-1" };
  const meAsAdmin = { userId: "u-1", roleCode: "organization_admin" as const, status: "active" as const };

  it("the last admin cannot demote themselves", () => {
    try {
      assertNotSelfDemotion(me, meAsAdmin, { roleCode: "dpdp_owner" }, 1);
      expect.unreachable();
    } catch (e) {
      expect(e).toBeInstanceOf(LastOrganizationAdminError);
      expect((e as LastOrganizationAdminError).self).toBe(true);
    }
  });

  it("the last admin cannot suspend (remove) themselves", () => {
    expect(() => assertNotSelfDemotion(me, meAsAdmin, { status: "suspended" }, 1)).toThrow(
      LastOrganizationAdminError,
    );
  });

  it("nobody else can remove the last admin either", () => {
    expect(() => assertNotSelfDemotion({ userId: "u-2" }, meAsAdmin, { roleCode: "consultant" }, 1)).toThrow(
      LastOrganizationAdminError,
    );
  });

  it("an admin may step down when another active admin remains", () => {
    expect(() => assertNotSelfDemotion(me, meAsAdmin, { roleCode: "dpdp_owner" }, 2)).not.toThrow();
  });

  it("re-affirming admin, or changing a non-admin, is always allowed", () => {
    expect(() => assertNotSelfDemotion(me, meAsAdmin, { roleCode: "organization_admin", status: "active" }, 1)).not.toThrow();
    expect(() =>
      assertNotSelfDemotion(me, { userId: "u-3", roleCode: "legal_user", status: "active" }, { status: "suspended" }, 1),
    ).not.toThrow();
  });
});

describe("isMemberOf", () => {
  const rows = [
    { organizationId: "org-a", userId: "u-1", status: "active" as const },
    { organizationId: "org-b", userId: "u-1", status: "suspended" as const },
  ];
  it("true only for an active membership", () => {
    expect(isMemberOf(rows, "u-1", "org-a")).toBe(true);
    expect(isMemberOf(rows, "u-1", "org-b")).toBe(false);
    expect(isMemberOf(rows, "u-2", "org-a")).toBe(false);
  });
});
