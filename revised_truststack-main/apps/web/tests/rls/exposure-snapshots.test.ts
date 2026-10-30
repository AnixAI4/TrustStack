/**
 * Slice 9, Stage 2 — exposure history at the database layer
 * (migration 20261009000000_exposure_snapshots).
 *
 * A stored exposure snapshot is evidence of where an organisation stood on a
 * date, so — like a finalised score (D-052) — nobody may write one but
 * `public.record_exposure_snapshot(org)`, which derives every value in SQL:
 * no user INSERT, UPDATE or DELETE; the RPC refuses another tenant and any
 * role without `score.calculate`; nothing may edit a stored row; and GATE 5
 * for reading it. Plus: it carries no question code, pack or trigger (D-071),
 * its numbers are the model's, and it is audited as the person.
 */
import { SEED_ORGS, SEED_USERS } from "@truststack/db/seed-data";
import type pg from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { authSubjects, connect, inTransaction, type Tx } from "./db";

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

const RECORD = "SELECT public.record_exposure_snapshot($1) AS id";

async function record(tx: Tx, userId: string, org: string): Promise<string> {
  const { rows } = await tx.as<{ id: string }>(u(userId), RECORD, [org]);
  return rows[0]!.id;
}

describe("only the RPC writes a snapshot", () => {
  it("no user role may INSERT, UPDATE or DELETE — not even the Organisation Admin", async () => {
    await inTransaction(client, async (tx) => {
      const id = await record(tx, SEED_USERS.muAdmin.id, ORG_A);
      const admin = u(SEED_USERS.muAdmin.id);
      await expect(
        tx.as(admin, "INSERT INTO public.exposure_snapshots (organization_id, as_of, model_version, basis, heads, ceilings_at_stake, exposed_heads, applicable_heads, forecast) VALUES ($1, current_date, '1.0.0', 'none', '[]', 0, 0, 0, '{}')", [ORG_A]),
      ).rejects.toMatchObject({ code: "42501" });
      await expect(tx.as(admin, "UPDATE public.exposure_snapshots SET ceilings_at_stake = 0 WHERE id = $1", [id])).rejects.toMatchObject({ code: "42501" });
      await expect(tx.as(admin, "DELETE FROM public.exposure_snapshots WHERE id = $1", [id])).rejects.toMatchObject({ code: "42501" });
    });
  });

  it("nothing may edit or delete a stored snapshot — tooling included (TS409)", async () => {
    await inTransaction(client, async (tx) => {
      const id = await record(tx, SEED_USERS.mumbaiUniversity.id, ORG_A);
      await expect(tx.asAdmin("UPDATE public.exposure_snapshots SET exposed_heads = 0 WHERE id = $1", [id])).rejects.toMatchObject({ code: "TS409" });
      await expect(tx.asAdmin("DELETE FROM public.exposure_snapshots WHERE id = $1", [id])).rejects.toMatchObject({ code: "TS409" });
    });
  });

  it("it goes only with what it was about — its assessment's cascade (as D-052)", async () => {
    await inTransaction(client, async (tx) => {
      const id = await record(tx, SEED_USERS.muAdmin.id, ORG_A);
      const { rows: before } = await tx.asAdmin<{ assessment_id: string }>("SELECT assessment_id FROM public.exposure_snapshots WHERE id = $1", [id]);
      await tx.asAdmin("DELETE FROM public.assessments WHERE id = $1", [before[0]!.assessment_id]);
      const { rows } = await tx.asAdmin("SELECT 1 FROM public.exposure_snapshots WHERE id = $1", [id]);
      expect(rows).toHaveLength(0);
    });
  });

  it("anon may not call the RPC at all", async () => {
    await inTransaction(client, async (tx) => {
      await expect(tx.as(null, RECORD, [ORG_A])).rejects.toMatchObject({ code: "42501" });
    });
  });
});

describe("recording needs score.calculate in THAT organisation (decision 9)", () => {
  it("programme roles may: the Organisation Admin, the DPDP Programme Owner, the consultant", async () => {
    for (const userId of [SEED_USERS.muAdmin.id, SEED_USERS.mumbaiUniversity.id, SEED_USERS.consultant.id]) {
      await inTransaction(client, async (tx) => {
        expect(await record(tx, userId, ORG_A), userId).toMatch(/^[0-9a-f-]{36}$/);
      });
    }
  });

  it("read-only roles may not (TS403): the Dean, the CISO, Legal, a department owner", async () => {
    for (const userId of [SEED_USERS.muDean.id, SEED_USERS.muItSecurity.id, SEED_USERS.muLegal.id, SEED_USERS.muDepartmentOwner.id]) {
      await inTransaction(client, async (tx) => {
        await expect(tx.as(u(userId), RECORD, [ORG_A]), userId).rejects.toMatchObject({ code: "TS403" });
      });
    }
  });

  it("GATE 5: Org B's admin cannot record a snapshot of Org A, nor Org A's of Org B", async () => {
    await inTransaction(client, async (tx) => {
      await expect(tx.as(u(SEED_USERS.bmlAdmin.id), RECORD, [ORG_A])).rejects.toMatchObject({ code: "TS403" });
      await expect(tx.as(u(SEED_USERS.muAdmin.id), RECORD, [ORG_B])).rejects.toMatchObject({ code: "TS403" });
    });
  });
});

describe("reading a snapshot (GATE 5)", () => {
  it("every Org A role with score.read sees Org A's; Org B's admin sees none of it", async () => {
    await inTransaction(client, async (tx) => {
      const id = await record(tx, SEED_USERS.muAdmin.id, ORG_A);
      for (const userId of [SEED_USERS.muDean.id, SEED_USERS.muLegal.id, SEED_USERS.muDepartmentOwner.id]) {
        const { rows } = await tx.as(u(userId), "SELECT id FROM public.exposure_snapshots WHERE id = $1", [id]);
        expect(rows, userId).toHaveLength(1);
      }
      const leak = await tx.as(u(SEED_USERS.bmlAdmin.id), "SELECT id FROM public.exposure_snapshots WHERE organization_id = $1", [ORG_A]);
      expect(leak.rows).toHaveLength(0);
    });
  });
});

describe("what a snapshot stores", () => {
  it("the model's own output at that moment, as the date in India, under model 1.7.0", async () => {
    await inTransaction(client, async (tx) => {
      const id = await record(tx, SEED_USERS.muAdmin.id, ORG_A);
      const { rows } = await tx.asAdmin<{
        heads: unknown;
        expected: { heads: unknown; ceilingsAtStakeCrore: string; exposedHeads: number };
        ceilings_at_stake: string;
        exposed_heads: number;
        model_version: string;
        as_of_ok: boolean;
        basis: string;
        assessment_id: string | null;
      }>(
        `SELECT s.heads, s.ceilings_at_stake, s.exposed_heads, s.model_version, s.basis, s.assessment_id,
                s.as_of = (now() AT TIME ZONE 'Asia/Kolkata')::date AS as_of_ok,
                app.exposure_evaluate((app.exposure_input(s.organization_id, s.as_of)) -> 'input') AS expected
         FROM public.exposure_snapshots s WHERE s.id = $1`,
        [id],
      );
      const row = rows[0]!;
      expect(row.heads).toEqual(row.expected.heads);
      expect(Number(row.ceilings_at_stake)).toBe(Number(row.expected.ceilingsAtStakeCrore));
      expect(row.exposed_heads).toBe(Number(row.expected.exposedHeads));
      expect(row.model_version).toBe("1.7.0");
      expect(row.as_of_ok).toBe(true);
      expect(["finalised", "provisional"]).toContain(row.basis);
      expect(row.assessment_id).not.toBeNull();
    });
  });

  it("Bharat Manufacturing, with no assessment: basis none, every head not yet assessed or not applicable", async () => {
    await inTransaction(client, async (tx) => {
      const id = await record(tx, SEED_USERS.bmlAdmin.id, ORG_B);
      const { rows } = await tx.asAdmin<{ basis: string; statuses: string[] }>(
        "SELECT basis, ARRAY(SELECT h ->> 'status' FROM jsonb_array_elements(heads) h) AS statuses FROM public.exposure_snapshots WHERE id = $1",
        [id],
      );
      expect(rows[0]!.basis).toBe("none");
      for (const s of rows[0]!.statuses) expect(["not_yet_assessed", "not_applicable"]).toContain(s);
    });
  });

  it("carries no question code, pack code or trigger (D-071)", async () => {
    await inTransaction(client, async (tx) => {
      const id = await record(tx, SEED_USERS.muAdmin.id, ORG_A);
      const { rows } = await tx.asAdmin<{ body: string }>("SELECT (heads::text || forecast::text) AS body FROM public.exposure_snapshots WHERE id = $1", [id]);
      expect(rows[0]!.body).not.toMatch(/\b[A-Z]{1,4}\d+\.\d+\b/); // a question code, e.g. G1.2
      expect(rows[0]!.body).not.toMatch(/_V1\b|trigger:|questionCodes/);
    });
  });

  it("is audited once, as the person, with the headline recorded", async () => {
    await inTransaction(client, async (tx) => {
      const id = await record(tx, SEED_USERS.mumbaiUniversity.id, ORG_A);
      const { rows } = await tx.asAdmin<{ user_id: string; event_type: string; metadata: { modelVersion: string } }>(
        "SELECT user_id, event_type, metadata FROM public.audit_logs WHERE entity_id = $1",
        [id],
      );
      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({ user_id: SEED_USERS.mumbaiUniversity.id, event_type: "exposure.snapshot.recorded" });
      expect(rows[0]!.metadata.modelVersion).toBe("1.7.0");
    });
  });
});
