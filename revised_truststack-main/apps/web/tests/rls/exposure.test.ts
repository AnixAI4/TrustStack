/**
 * Slice 9, Stage 1 — the database side of the exposure model's new facts
 * (migration 20261008000000_exposure_sdf).
 *
 * The Significant Data Fiduciary notification decides whether penalty head 4
 * (s.10, up to ₹150 crore) applies. It is ENTERED by a person holding
 * `organization.update`, never inferred (D-028): these tests hold the
 * database to that — the DPDP Programme Owner, who may edit the scope, may
 * not declare the organisation an SDF, and nothing a scope save does can set
 * it. Plus GATE 5 for the new columns, and the guardian-data question (s.9(1)).
 */
import { SEED_ORGS, SEED_USERS } from "@truststack/db/seed-data";
import type pg from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { authSubjects, connect, inTransaction } from "./db";

const ORG_A = SEED_ORGS.mumbaiUniversity.id;
const ORG_B = SEED_ORGS.bharatManufacturing.id;

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

const SET_SDF = "UPDATE public.organizations SET sdf_notified_on = $2, sdf_notification_ref = $3 WHERE id = $1";

describe("the SDF notification is entered by organization.update only (D-028)", () => {
  it("the seed records none: head 4 does not apply to anyone yet", async () => {
    await inTransaction(client, async (tx) => {
      const { rows } = await tx.asAdmin<{ n: string }>(
        "SELECT count(*) AS n FROM public.organizations WHERE sdf_notified_on IS NOT NULL OR sdf_notification_ref IS NOT NULL",
      );
      expect(Number(rows[0]!.n)).toBe(0);
    });
  });

  it("the Organisation Admin and the consultant can record it", async () => {
    for (const userId of [SEED_USERS.muAdmin.id, SEED_USERS.consultant.id]) {
      await inTransaction(client, async (tx) => {
        const r = await tx.as(u(userId), SET_SDF, [ORG_A, "2026-09-01", "G.S.R. 999(E)"]);
        expect(r.rowCount, userId).toBe(1);
      });
    }
  });

  it("the DPDP Programme Owner cannot — scope.write is not organization.update (TS403)", async () => {
    await inTransaction(client, async (tx) => {
      await expect(tx.as(u(SEED_USERS.mumbaiUniversity.id), SET_SDF, [ORG_A, "2026-09-01", "G.S.R. 999(E)"])).rejects.toMatchObject({
        code: "TS403",
      });
    });
  });

  it("nor can it clear one an admin recorded", async () => {
    await inTransaction(client, async (tx) => {
      await tx.asAdmin(SET_SDF, [ORG_A, "2026-09-01", "G.S.R. 999(E)"]);
      await expect(tx.as(u(SEED_USERS.mumbaiUniversity.id), SET_SDF, [ORG_A, null, null])).rejects.toMatchObject({ code: "TS403" });
    });
  });

  it("roles with neither permission update nothing (RLS)", async () => {
    await inTransaction(client, async (tx) => {
      for (const userId of [SEED_USERS.muDean.id, SEED_USERS.muLegal.id, SEED_USERS.muDepartmentOwner.id]) {
        const r = await tx.as(u(userId), SET_SDF, [ORG_A, "2026-09-01", "G.S.R. 999(E)"]);
        expect(r.rowCount, userId).toBe(0);
      }
      const { rows } = await tx.asAdmin<{ sdf_notified_on: string | null }>("SELECT sdf_notified_on FROM public.organizations WHERE id = $1", [ORG_A]);
      expect(rows[0]!.sdf_notified_on).toBeNull();
    });
  });

  it("a scope save never sets it — however large the organisation (D-028)", async () => {
    await inTransaction(client, async (tx) => {
      const owner = u(SEED_USERS.mumbaiUniversity.id);
      await tx.as(owner, "UPDATE public.organizations SET data_principal_count_estimate = 50000000 WHERE id = $1", [ORG_A]);
      await tx.as(owner, "UPDATE public.organization_scopes SET sensitive_documents = 'yes', children_data = 'yes' WHERE organization_id = $1", [ORG_A]);
      const { rows } = await tx.asAdmin<{ sdf_notified_on: string | null; sdf_notification_ref: string | null }>(
        "SELECT sdf_notified_on, sdf_notification_ref FROM public.organizations WHERE id = $1",
        [ORG_A],
      );
      expect(rows[0]).toEqual({ sdf_notified_on: null, sdf_notification_ref: null });
    });
  });

  it("is audited as the person, with the changed column NAMES — never the reference's text", async () => {
    await inTransaction(client, async (tx) => {
      await tx.as(u(SEED_USERS.muAdmin.id), SET_SDF, [ORG_A, "2026-09-01", "G.S.R. 999(E)"]);
      const { rows } = await tx.asAdmin<{ user_id: string; metadata: { changed: string[] } }>(
        "SELECT user_id, metadata FROM public.audit_logs WHERE event_type = 'scope.organizations.update' AND entity_id = $1 ORDER BY created_at DESC LIMIT 1",
        [ORG_A],
      );
      expect(rows[0]!.user_id).toBe(SEED_USERS.muAdmin.id);
      // Slice 11 (A4, D-125): MU's AI assistant is on in the seed, and recording an SDF
      // notification turns it off in the same update — so the switch is listed too.
      expect(rows[0]!.metadata.changed).toEqual(["ai_enabled", "sdf_notification_ref", "sdf_notified_on"]);
      expect(JSON.stringify(rows[0]!.metadata)).not.toContain("999");
    });
  });
});

describe("the SDF notification's row invariants", () => {
  const admin = () => u(SEED_USERS.muAdmin.id);
  const refused = async (args: unknown[]) =>
    inTransaction(client, async (tx) => {
      await expect(tx.as(admin(), SET_SDF, [ORG_A, ...args])).rejects.toMatchObject({ code: "23514" });
    });

  it("both or neither", async () => {
    await refused(["2026-09-01", null]);
    await refused([null, "G.S.R. 999(E)"]);
  });

  it("a reference that is blank, padded or over 200 characters is refused", async () => {
    await refused(["2026-09-01", ""]);
    await refused(["2026-09-01", " G.S.R. 999(E)"]);
    await refused(["2026-09-01", "x".repeat(201)]);
  });

  it("no notification predates the Act (11 August 2023)", async () => {
    await refused(["2023-08-10", "G.S.R. 999(E)"]);
    await inTransaction(client, async (tx) => {
      expect((await tx.as(admin(), SET_SDF, [ORG_A, "2023-08-11", "G.S.R. 999(E)"])).rowCount).toBe(1);
    });
  });
});

describe("GATE 5 — the SDF notification across tenants", () => {
  it("Org A's admin cannot record one for Org B, and Org B's admin cannot for Org A", async () => {
    await inTransaction(client, async (tx) => {
      const intoB = await tx.as(u(SEED_USERS.muAdmin.id), SET_SDF, [ORG_B, "2026-09-01", "Forged"]);
      const intoA = await tx.as(u(SEED_USERS.bmlAdmin.id), SET_SDF, [ORG_A, "2026-09-01", "Forged"]);
      expect([intoB.rowCount, intoA.rowCount]).toEqual([0, 0]);
      const { rows } = await tx.asAdmin<{ n: string }>(
        "SELECT count(*) AS n FROM public.organizations WHERE sdf_notification_ref = 'Forged'",
      );
      expect(Number(rows[0]!.n)).toBe(0);
    });
  });

  it("Org A's members cannot read Org B's notification", async () => {
    await inTransaction(client, async (tx) => {
      await tx.asAdmin(SET_SDF, [ORG_B, "2026-09-01", "BML notification"]);
      const { rows } = await tx.as<{ id: string }>(
        u(SEED_USERS.muAdmin.id),
        "SELECT id FROM public.organizations WHERE sdf_notification_ref IS NOT NULL",
      );
      expect(rows).toEqual([]);
    });
  });
});

describe("persons with disability who have a lawful guardian (s.9(1))", () => {
  it("defaults to unknown, never to no — and is seeded per tenant", async () => {
    await inTransaction(client, async (tx) => {
      const { rows } = await tx.asAdmin<{ organization_id: string; guardian_data: string }>(
        "SELECT organization_id, guardian_data FROM public.organization_scopes ORDER BY organization_id",
      );
      expect(Object.fromEntries(rows.map((r) => [r.organization_id, r.guardian_data]))).toEqual({ [ORG_A]: "unknown", [ORG_B]: "no" });
      const def = await tx.asAdmin<{ d: string }>(
        "SELECT column_default AS d FROM information_schema.columns WHERE table_name = 'organization_scopes' AND column_name = 'guardian_data'",
      );
      expect(def.rows[0]!.d).toContain("unknown");
    });
  });

  it("is a tri-state, written by scope.write holders only", async () => {
    await inTransaction(client, async (tx) => {
      const owner = u(SEED_USERS.mumbaiUniversity.id);
      expect((await tx.as(owner, "UPDATE public.organization_scopes SET guardian_data = 'yes' WHERE organization_id = $1", [ORG_A])).rowCount).toBe(1);
      const dean = await tx.as(u(SEED_USERS.muDean.id), "UPDATE public.organization_scopes SET guardian_data = 'no' WHERE organization_id = $1", [ORG_A]);
      expect(dean.rowCount).toBe(0);
      await expect(
        tx.as(owner, "UPDATE public.organization_scopes SET guardian_data = 'maybe' WHERE organization_id = $1", [ORG_A]),
      ).rejects.toMatchObject({ code: "23514" });
    });
  });
});
