/**
 * Slice 2 — GATE 5 (RLS) for the scope tables, plus the database-side rules:
 * composite tenant FKs, scope.write write policies, the organizations
 * column-group guard, and audit-by-trigger (D-026).
 */
import { SEED_COUNTS, SEED_ORGS, SEED_SCOPE, SEED_USERS } from "@truststack/db/seed-data";
import type pg from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { authSubjects, connect, inTransaction } from "./db";

const ORG_A = SEED_ORGS.mumbaiUniversity.id;
const ORG_B = SEED_ORGS.bharatManufacturing.id;
const A = SEED_SCOPE.mumbaiUniversity;
const B = SEED_SCOPE.bharatManufacturing;

let client: pg.Client;
let who: Map<string, { sub: string; email: string }>;
const u = (id: string) => who.get(id)!;

beforeAll(async () => {
  client = await connect();
  who = await authSubjects(client, Object.values(SEED_USERS).map((x) => x.id));
});
afterAll(async () => {
  await client?.end();
});

const TENANT_TABLES = ["departments", "systems", "vendors", "vendor_systems", "data_principal_types", "organization_scopes"] as const;

describe("GATE 5 — Org A's JWT reads nothing of Org B in any scope table", () => {
  for (const table of TENANT_TABLES) {
    it(`${table}: only Org A rows`, async () => {
      await inTransaction(client, async (tx) => {
        const { rows } = await tx.as<{ organization_id: string }>(
          u(SEED_USERS.muAdmin.id),
          `SELECT organization_id FROM public.${table}`,
        );
        expect(rows.length).toBeGreaterThan(0);
        expect(rows.every((r) => r.organization_id === ORG_A)).toBe(true);
      });
    });
  }

  it("the consultant (member of both) sees both — isolation is membership, not role", async () => {
    await inTransaction(client, async (tx) => {
      const { rows } = await tx.as<{ n: string }>(u(SEED_USERS.consultant.id), "SELECT count(*) AS n FROM public.departments");
      expect(Number(rows[0]!.n)).toBe(SEED_COUNTS.departments);
    });
  });
});

describe("GATE 5 — Org A's JWT cannot write into Org B", () => {
  const admin = () => u(SEED_USERS.muAdmin.id);

  it("INSERT into Org B → RLS violation", async () => {
    await inTransaction(client, async (tx) => {
      await expect(
        tx.as(admin(), "INSERT INTO public.departments (organization_id, name) VALUES ($1, 'Forged')", [ORG_B]),
      ).rejects.toThrow(/row-level security/);
      await expect(
        tx.as(admin(), "INSERT INTO public.organization_scopes (organization_id, risk_tags) VALUES ($1, '{}')", [ORG_B]),
      ).rejects.toThrow(/row-level security|duplicate key/);
    });
  });

  it("UPDATE / DELETE of Org B rows affect 0 rows", async () => {
    await inTransaction(client, async (tx) => {
      const up = await tx.as(admin(), "UPDATE public.systems SET name = 'Forged' WHERE id = $1", [B.systems.hrms.id]);
      const del = await tx.as(admin(), "DELETE FROM public.vendors WHERE id = $1", [B.vendors.payrollBureau.id]);
      const org = await tx.as(admin(), "UPDATE public.organizations SET name = 'Forged' WHERE id = $1", [ORG_B]);
      expect([up.rowCount, del.rowCount, org.rowCount]).toEqual([0, 0, 0]);
      const still = await tx.asAdmin<{ name: string }>("SELECT name FROM public.systems WHERE id = $1", [B.systems.hrms.id]);
      expect(still.rows[0]!.name).toBe("HRMS");
    });
  });

  it("moving a row to Org B by rewriting organization_id is refused", async () => {
    await inTransaction(client, async (tx) => {
      await expect(
        tx.as(admin(), "UPDATE public.departments SET organization_id = $1 WHERE id = $2", [ORG_B, A.departments.library.id]),
      ).rejects.toThrow(/row-level security|foreign key/);
    });
  });
});

describe("composite tenant foreign keys — enforced even for the privileged role", () => {
  it("a system in Org A cannot be owned by Org B's department", async () => {
    await inTransaction(client, async (tx) => {
      await expect(
        tx.asAdmin(
          "INSERT INTO public.systems (organization_id, name, system_type, owner_department_id) VALUES ($1, 'Cross', 'erp', $2)",
          [ORG_A, B.departments.hr.id],
        ),
      ).rejects.toMatchObject({ code: "23503" });
    });
  });

  it("an Org A vendor cannot be linked to an Org B system", async () => {
    await inTransaction(client, async (tx) => {
      await expect(
        tx.asAdmin("INSERT INTO public.vendor_systems (organization_id, vendor_id, system_id) VALUES ($1, $2, $3)", [
          ORG_A,
          A.vendors.lmsProvider.id,
          B.systems.erp.id,
        ]),
      ).rejects.toMatchObject({ code: "23503" });
    });
  });

  it("a member cannot be put in another organisation's department", async () => {
    await inTransaction(client, async (tx) => {
      await expect(
        tx.asAdmin("UPDATE public.organization_users SET department_id = $1 WHERE id = $2", [
          B.departments.hr.id,
          SEED_USERS.muDepartmentOwner.memberships[0].id,
        ]),
      ).rejects.toMatchObject({ code: "23503" });
    });
  });

  it("a department still referenced by a system cannot be deleted", async () => {
    await inTransaction(client, async (tx) => {
      await expect(
        tx.as(u(SEED_USERS.muAdmin.id), "DELETE FROM public.departments WHERE id = $1", [A.departments.examinations.id]),
      ).rejects.toMatchObject({ code: "23503" });
    });
  });
});

describe("scope.write — who may edit the scope (D-026)", () => {
  it("the DPDP Programme Owner CAN write registers and scope answers", async () => {
    await inTransaction(client, async (tx) => {
      const owner = u(SEED_USERS.mumbaiUniversity.id);
      const ins = await tx.as(owner, "INSERT INTO public.departments (organization_id, name) VALUES ($1, 'Research')", [ORG_A]);
      const up = await tx.as(owner, "UPDATE public.organization_scopes SET marketing_tracking = 'yes' WHERE organization_id = $1", [ORG_A]);
      const ind = await tx.as(owner, "UPDATE public.organizations SET data_principal_count_estimate = 1 WHERE id = $1", [ORG_A]);
      expect([ins.rowCount, up.rowCount, ind.rowCount]).toEqual([1, 1, 1]);
    });
  });

  it("…but NOT the organisation profile (that is organization.update)", async () => {
    await inTransaction(client, async (tx) => {
      await expect(
        tx.as(u(SEED_USERS.mumbaiUniversity.id), "UPDATE public.organizations SET name = 'Renamed' WHERE id = $1", [ORG_A]),
      ).rejects.toMatchObject({ code: "TS403" });
    });
  });

  it("the Org Admin can edit the profile", async () => {
    await inTransaction(client, async (tx) => {
      const r = await tx.as(u(SEED_USERS.muAdmin.id), "UPDATE public.organizations SET website = 'https://x.example.com' WHERE id = $1", [ORG_A]);
      expect(r.rowCount).toBe(1);
    });
  });

  it("Department Owner, Dean and Legal cannot write scope tables (RLS)", async () => {
    await inTransaction(client, async (tx) => {
      for (const userId of [SEED_USERS.muDepartmentOwner.id, SEED_USERS.muDean.id, SEED_USERS.muLegal.id]) {
        await expect(
          tx.as(u(userId), "INSERT INTO public.systems (organization_id, name, system_type) VALUES ($1, 'Nope', 'crm')", [ORG_A]),
        ).rejects.toThrow(/row-level security/);
        const up = await tx.as(u(userId), "UPDATE public.vendors SET name = 'Nope' WHERE organization_id = $1", [ORG_A]);
        const org = await tx.as(u(userId), "UPDATE public.organizations SET industry_code = 'general' WHERE id = $1", [ORG_A]);
        expect([up.rowCount, org.rowCount]).toEqual([0, 0]);
      }
    });
  });

  it("organizations: only the editable columns are granted", async () => {
    await inTransaction(client, async (tx) => {
      await expect(
        tx.as(u(SEED_USERS.muAdmin.id), "UPDATE public.organizations SET deleted_at = now() WHERE id = $1", [ORG_A]),
      ).rejects.toThrow(/permission denied/);
    });
  });
});

describe("audit by trigger (D-026)", () => {
  it("a user write is audited as that user, in the same transaction, with changed columns", async () => {
    await inTransaction(client, async (tx) => {
      const owner = u(SEED_USERS.mumbaiUniversity.id);
      await tx.as(owner, "UPDATE public.systems SET hosting_model = 'cloud' WHERE id = $1", [A.systems.sis.id]);
      const { rows } = await tx.asAdmin<{ user_id: string; organization_id: string; metadata: { changed: string[]; name: string } }>(
        "SELECT user_id, organization_id, metadata FROM public.audit_logs WHERE event_type = 'scope.systems.update' AND entity_id = $1 ORDER BY created_at DESC LIMIT 1",
        [A.systems.sis.id],
      );
      expect(rows[0]).toMatchObject({
        user_id: SEED_USERS.mumbaiUniversity.id,
        organization_id: ORG_A,
        metadata: { changed: ["hosting_model"], name: "Student ERP / SIS" },
      });
    });
  });

  it("a no-op update is not an event; a tooling write (no JWT) is not audited", async () => {
    await inTransaction(client, async (tx) => {
      const before = await tx.asAdmin<{ n: string }>("SELECT count(*) AS n FROM public.audit_logs WHERE entity_id = $1", [A.departments.it.id]);
      await tx.as(u(SEED_USERS.muAdmin.id), "UPDATE public.departments SET name = name WHERE id = $1", [A.departments.it.id]);
      await tx.asAdmin("UPDATE public.departments SET name = 'IT Services' WHERE id = $1", [A.departments.it.id]);
      const after = await tx.asAdmin<{ n: string }>("SELECT count(*) AS n FROM public.audit_logs WHERE entity_id = $1", [A.departments.it.id]);
      expect(after.rows[0]!.n).toBe(before.rows[0]!.n);
    });
  });

  it("insert and delete are audited", async () => {
    await inTransaction(client, async (tx) => {
      const admin = u(SEED_USERS.muAdmin.id);
      const { rows } = await tx.as<{ id: string }>(admin, "INSERT INTO public.departments (organization_id, name) VALUES ($1, 'Temp') RETURNING id", [ORG_A]);
      await tx.as(admin, "DELETE FROM public.departments WHERE id = $1", [rows[0]!.id]);
      const events = await tx.asAdmin<{ event_type: string }>(
        "SELECT event_type FROM public.audit_logs WHERE entity_id = $1 ORDER BY created_at, event_type",
        [rows[0]!.id],
      );
      expect(events.rows.map((e) => e.event_type).sort()).toEqual(["scope.departments.delete", "scope.departments.insert"]);
    });
  });
});

describe("schema rules", () => {
  it("names are unique per organisation, case-insensitively — but not across organisations", async () => {
    await inTransaction(client, async (tx) => {
      await expect(
        tx.asAdmin("INSERT INTO public.departments (organization_id, name) VALUES ($1, 'ADMISSIONS')", [ORG_A]),
      ).rejects.toMatchObject({ code: "23505" });
      const other = await tx.asAdmin("INSERT INTO public.departments (organization_id, name) VALUES ($1, 'Admissions')", [ORG_B]);
      expect(other.rowCount).toBe(1);
    });
  });

  it("tri-state and risk-tag vocabularies are enforced", async () => {
    await inTransaction(client, async (tx) => {
      await expect(
        tx.asAdmin("UPDATE public.systems SET processes_children_data = 'maybe' WHERE id = $1", [A.systems.sis.id]),
      ).rejects.toMatchObject({ code: "23514" });
      await expect(
        tx.asAdmin("UPDATE public.organization_scopes SET risk_tags = '{totally_safe}' WHERE organization_id = $1", [ORG_A]),
      ).rejects.toMatchObject({ code: "23514" });
    });
  });

  it("industries: readable by authenticated, not by anon; organisations use the pack codes", async () => {
    await inTransaction(client, async (tx) => {
      const r = await tx.as(u(SEED_USERS.muDean.id), "SELECT code FROM public.industries");
      expect(r.rowCount).toBe(10);
      await expect(tx.as(null, "SELECT code FROM public.industries")).rejects.toThrow(/permission denied/);
      const orgs = await tx.asAdmin<{ industry_code: string }>("SELECT industry_code FROM public.organizations WHERE id = $1", [ORG_A]);
      expect(orgs.rows[0]!.industry_code).toBe("university");
    });
  });
});
