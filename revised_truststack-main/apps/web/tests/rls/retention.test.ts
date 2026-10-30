/**
 * Slice 10, Stage 5 — GATE 5 (RLS) and the database's rules for the retention
 * register and the AI risk register (migration 20261017000000_retention_ai_risk).
 *
 *   1. Org A cannot see or touch Org B's schedules, erasures, actions or AI
 *      rows; anon holds nothing; reading needs retention.read, writing
 *      retention.write — the AI register is read by members and written with
 *      ropa.write (D-094.2).
 *   2. The end date is DERIVED: start + period in calendar months, never sent;
 *      Rule 8(3)'s year is a floor for every basis; Rule 8(1)–(2) only with a
 *      recorded Third-Schedule class, and the class cannot be cleared under it.
 *   3. An erasure is recorded once and never changed — not even by tooling —
 *      and stamped with who recorded it; Rule 8(2)'s notice only under the
 *      deemed basis.
 *   4. Overdue erasure is work on the ONE action table, through one RPC; its
 *      action closes on an erasure recorded for this cycle by someone other
 *      than its owner (D-095), or as any action does.
 *   5. The AI register: a review stamped, corrected never removed; a system
 *      removed from the scope leaves the row standing.
 *   6. Evidence links of the two new types, by the registers' permissions.
 *   7. Audit by trigger, never free text; model 1.5.0 in a stored snapshot.
 *   8. D-096 (R2, R4, R5): an erasure counts only when complete under
 *      s.8(7)(b) and not marked as recorded in error — once, with a reason, by
 *      someone other than its recorder, never changed; the AI register asks
 *      s.9(3)'s question, with the Fourth Schedule exemption only on "yes",
 *      and is read with ropa.read.
 *
 * Every test runs inside a transaction that is rolled back.
 */
import { randomUUID } from "node:crypto";
import { SEED_AI_SYSTEMS, SEED_ORGS, SEED_RETENTION, SEED_ROPA, SEED_SCOPE, SEED_USERS } from "@truststack/db/seed-data";
import type pg from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { authSubjects, connect, inTransaction, type Tx } from "./db";

const ORG_A = SEED_ORGS.mumbaiUniversity.id;
const ORG_B = SEED_ORGS.bharatManufacturing.id;
const OVERDUE = SEED_RETENTION.schedules["ROPA-009"]; // past its end, no erasure
const ERASED = SEED_RETENTION.schedules["ROPA-008"]; // erased on 10 Jul 2026 by the CISO
const NO_END = SEED_RETENTION.schedules["ROPA-003"]; // purpose still served
const PROCTORING = SEED_AI_SYSTEMS.proctoring;

let client: pg.Client;
let who: Map<string, { sub: string; email: string }>;
const u = (id: string) => who.get(id)!;
const legal = () => u(SEED_USERS.muLegal.id); // contributor: retention.write, ropa.write, gap.write — NO evidence.review
const ciso = () => u(SEED_USERS.muItSecurity.id); // contributor, as Legal
const registrar = () => u(SEED_USERS.mumbaiUniversity.id); // dpdp_owner: retention.write + evidence.review
const dean = () => u(SEED_USERS.muDean.id); // executive sponsor: reads only
const bmlOwner = () => u(SEED_USERS.bharatManufacturing.id);
type Actor = { sub: string; email: string };

beforeAll(async () => {
  client = await connect();
  who = await authSubjects(client, Object.values(SEED_USERS).map((x) => x.id));
});
afterAll(async () => {
  await client?.end();
});

/** India's calendar, `days` days ago — the database's own "today". */
async function daysAgo(tx: Tx, days: number): Promise<string> {
  const { rows } = await tx.asAdmin<{ d: string }>("SELECT to_char((now() AT TIME ZONE 'Asia/Kolkata')::date - $1::integer, 'YYYY-MM-DD') AS d", [days]);
  return rows[0]!.d;
}

/** A fresh processing record (tooling): BML has none of its own, and MU's ten already have schedules. */
async function newRecord(tx: Tx, org: string = ORG_A): Promise<string> {
  const { rows } = await tx.asAdmin<{ id: string }>("INSERT INTO public.ropa_records (organization_id, name) VALUES ($1, $2) RETURNING id", [
    org,
    `RLS retention ${randomUUID()}`,
  ]);
  return rows[0]!.id;
}

interface Sched {
  id: string;
  ends_on: string | null;
  inform_by: string | null;
  created_by: string | null;
}

/** A schedule recorded by `actor` for a new record of `org`. */
async function schedule(tx: Tx, actor: Actor, org: string = ORG_A, over: Record<string, unknown> = {}): Promise<Sched> {
  const { ropa_record_id: given, ...rest } = over;
  const fields: Record<string, unknown> = { basis: "fixed_period", period_months: 12, starts_on: await daysAgo(tx, 400), ...rest };
  const recordId = (given as string | undefined) ?? (await newRecord(tx, org));
  const keys = Object.keys(fields);
  const { rows } = await tx.as<Sched>(
    actor,
    `INSERT INTO public.retention_schedules (organization_id, ropa_record_id, ${keys.join(", ")})
     VALUES ($1, $2, ${keys.map((_, i) => `$${i + 3}`).join(", ")})
     RETURNING id, to_char(ends_on, 'YYYY-MM-DD') AS ends_on, to_char(inform_by, 'YYYY-MM-DD') AS inform_by, created_by`,
    [org, recordId, ...keys.map((k) => fields[k])],
  );
  return rows[0]!;
}

const erase = (tx: Tx, actor: Actor, scheduleId: string, erasedOn: string, over: Record<string, unknown> = {}) => {
  const fields = { erased_on: erasedOn, method: "deleted", processors_told: "not_applicable", ...over };
  const keys = Object.keys(fields);
  return tx.as<{ id: string; recorded_by: string }>(
    actor,
    `INSERT INTO public.retention_erasures (organization_id, retention_schedule_id, ${keys.join(", ")})
     VALUES ($1, $2, ${keys.map((_, i) => `$${i + 3}`).join(", ")}) RETURNING id, recorded_by`,
    [ORG_A, scheduleId, ...Object.values(fields)],
  );
};

const addAction = async (tx: Tx, actor: Actor, scheduleId: string, owner: string | null, org: string = ORG_A) =>
  (await tx.as<{ id: string }>(actor, "SELECT public.add_retention_action($1, $2, 'Erase it', $3, NULL) AS id", [org, scheduleId, owner])).rows[0]!.id;

describe("1. tenancy (gate 5) and permissions", () => {
  it("a member reads their own register; Org B's owner sees none of it; anon is refused outright", async () => {
    await inTransaction(client, async (tx) => {
      const mine = await tx.as(dean(), "SELECT id FROM public.retention_schedules WHERE organization_id = $1", [ORG_A]);
      expect(mine.rows.map((r) => r.id)).toEqual(expect.arrayContaining([OVERDUE.id, ERASED.id, NO_END.id]));
      expect((await tx.as(dean(), "SELECT id FROM public.retention_erasures WHERE organization_id = $1", [ORG_A])).rowCount).toBeGreaterThan(0);
      expect((await tx.as(dean(), "SELECT id FROM public.ai_systems WHERE organization_id = $1", [ORG_A])).rowCount).toBeGreaterThan(0);
      for (const t of ["retention_schedules", "retention_erasures", "retention_erasure_voids", "ai_systems"]) {
        expect((await tx.as(bmlOwner(), `SELECT id FROM public.${t} WHERE organization_id = $1`, [ORG_A])).rowCount).toBe(0);
        await expect(tx.as(null, `SELECT id FROM public.${t}`)).rejects.toMatchObject({ code: "42501" });
      }
      await expect(tx.as(null, "SELECT public.add_retention_action($1, $2, 'x', NULL, NULL)", [ORG_A, OVERDUE.id])).rejects.toMatchObject({ code: "42501" });
    });
  });

  it("reading needs retention.read, writing retention.write: the executive sponsor reads only", async () => {
    await inTransaction(client, async (tx) => {
      await expect(schedule(tx, dean())).rejects.toMatchObject({ code: "TS403" });
      expect((await tx.as(dean(), "UPDATE public.retention_schedules SET notes = 'x' WHERE id = $1", [OVERDUE.id])).rowCount).toBe(0);
      await expect(erase(tx, dean(), OVERDUE.id, await daysAgo(tx, 1))).rejects.toMatchObject({ code: "TS403" });
      await expect(tx.as(dean(), "SELECT public.add_retention_action($1, $2, 'x', NULL, NULL)", [ORG_A, OVERDUE.id])).rejects.toMatchObject({ code: "TS403" });
    });
  });

  it("Org A cannot record into Org B, update Org B's schedule, erase it, or reach its actions", async () => {
    await inTransaction(client, async (tx) => {
      const b = await schedule(tx, bmlOwner(), ORG_B);
      await expect(schedule(tx, legal(), ORG_B)).rejects.toMatchObject({ code: "TS403" });
      expect((await tx.as(legal(), "UPDATE public.retention_schedules SET notes = 'Hijacked' WHERE id = $1", [b.id])).rowCount).toBe(0);
      await expect(
        tx.as(legal(), "INSERT INTO public.retention_erasures (organization_id, retention_schedule_id, erased_on, method, processors_told) VALUES ($1, $2, current_date - 1, 'deleted', 'no')", [ORG_B, b.id]),
      ).rejects.toMatchObject({ code: "TS403" });
      await expect(tx.as(legal(), "SELECT public.add_retention_action($1, $2, 'Hijack', NULL, NULL)", [ORG_B, b.id])).rejects.toMatchObject({ code: "TS403" });
      await expect(tx.as(legal(), "SELECT public.add_retention_action($1, $2, 'Hijack', NULL, NULL)", [ORG_A, b.id])).rejects.toMatchObject({ code: "TS404" });
      const notes = (await tx.asAdmin<{ notes: string | null }>("SELECT notes FROM public.retention_schedules WHERE id = $1", [b.id])).rows[0]!.notes;
      expect(notes).toBeNull();
    });
  });

  it("composite FKs: no schedule for another tenant's record, no erasure or action on another tenant's schedule — even from tooling", async () => {
    await inTransaction(client, async (tx) => {
      const bRecord = await newRecord(tx, ORG_B);
      const b = await schedule(tx, bmlOwner(), ORG_B);
      await expect(schedule(tx, legal(), ORG_A, { ropa_record_id: bRecord })).rejects.toMatchObject({ code: "23503" });
      await expect(
        tx.asAdmin("INSERT INTO public.retention_erasures (organization_id, retention_schedule_id, erased_on, method, processors_told) VALUES ($1, $2, current_date - 1, 'deleted', 'no')", [ORG_A, b.id]),
      ).rejects.toMatchObject({ code: "23503" });
      await expect(
        tx.asAdmin("INSERT INTO public.gap_actions (organization_id, retention_schedule_id, title) VALUES ($1, $2, 'x')", [ORG_A, b.id]),
      ).rejects.toMatchObject({ code: "23503" });
      const bSystem = Object.values(SEED_SCOPE.bharatManufacturing.systems)[0]!.id;
      await expect(
        tx.as(legal(), "INSERT INTO public.ai_systems (organization_id, system_id, name, purpose, personal_data) VALUES ($1, $2, 'x', 'x', 'x')", [ORG_A, bSystem]),
      ).rejects.toMatchObject({ code: "23503" });
    });
  });

  it("one schedule per processing activity", async () => {
    await inTransaction(client, async (tx) => {
      await expect(schedule(tx, legal(), ORG_A, { ropa_record_id: SEED_ROPA.records["ROPA-001"].id })).rejects.toMatchObject({ code: "23505" });
    });
  });
});

describe("2. the end date is the database's; Rule 8(3)'s floor; Rule 8(1)–(2) only for a recorded class", () => {
  it("start + period in calendar months, on insert and on every change", async () => {
    await inTransaction(client, async (tx) => {
      const s = await schedule(tx, legal(), ORG_A, { starts_on: "2024-02-29", period_months: 12 });
      expect(s.ends_on).toBe("2025-02-28");
      expect(s.inform_by).toBeNull();
      expect(s.created_by).toBe(SEED_USERS.muLegal.id);
      const moved = await tx.as<{ ends_on: string }>(legal(), "UPDATE public.retention_schedules SET period_months = 25 WHERE id = $1 RETURNING to_char(ends_on, 'YYYY-MM-DD') AS ends_on", [s.id]);
      expect(moved.rows[0]!.ends_on).toBe("2026-03-29");
      const cleared = await tx.as<{ ends_on: string | null }>(legal(), "UPDATE public.retention_schedules SET starts_on = NULL WHERE id = $1 RETURNING ends_on", [s.id]);
      expect(cleared.rows[0]!.ends_on).toBeNull();
    });
  });

  it("no user holds a grant on the end or inform-by date; tooling that forges one is refused by a CHECK", async () => {
    await inTransaction(client, async (tx) => {
      await expect(tx.as(legal(), "UPDATE public.retention_schedules SET ends_on = '2099-01-01' WHERE id = $1", [OVERDUE.id])).rejects.toMatchObject({ code: "42501" });
      await expect(tx.as(legal(), "UPDATE public.retention_schedules SET inform_by = '2099-01-01' WHERE id = $1", [OVERDUE.id])).rejects.toMatchObject({ code: "42501" });
      // The trigger rewrites it for tooling too; with triggers off, the CHECK holds.
      await tx.asAdmin("SET LOCAL session_replication_role = replica");
      await expect(tx.asAdmin("UPDATE public.retention_schedules SET ends_on = '2099-01-01' WHERE id = $1", [OVERDUE.id])).rejects.toMatchObject({ code: "23514" });
    });
  });

  it("Rule 8(3): no period under twelve months, for any basis — a CHECK", async () => {
    await inTransaction(client, async (tx) => {
      for (const basis of ["fixed_period", "purpose_served", "consent_withdrawn"]) {
        await expect(schedule(tx, legal(), ORG_A, { basis, period_months: 11 })).rejects.toMatchObject({ code: "23514" });
      }
      await expect(schedule(tx, legal(), ORG_A, { basis: "legal_requirement", period_months: 6, law_name: "Some Act" })).rejects.toMatchObject({ code: "23514" });
    });
  });

  it("a law requirement names its law, and only it does; the clock never starts in the future", async () => {
    await inTransaction(client, async (tx) => {
      await expect(schedule(tx, legal(), ORG_A, { basis: "legal_requirement", period_months: 96 })).rejects.toMatchObject({ code: "23514" });
      await expect(schedule(tx, legal(), ORG_A, { law_name: "Some Act" })).rejects.toMatchObject({ code: "23514" });
      expect((await schedule(tx, legal(), ORG_A, { basis: "legal_requirement", period_months: 96, law_name: "Income-tax Act, 1961" })).ends_on).not.toBeNull();
      await expect(schedule(tx, legal(), ORG_A, { starts_on: await daysAgo(tx, -1) })).rejects.toMatchObject({ code: "TS422" });
    });
  });

  it("the deemed basis only with a recorded Third-Schedule class: 36 months, the inform-by date two days before the end", async () => {
    await inTransaction(client, async (tx) => {
      await expect(schedule(tx, legal(), ORG_A, { basis: "deemed_inactivity", period_months: 36 })).rejects.toMatchObject({ code: "TS422" });
      // Only organization.update records the class: RLS hides the row from Legal; the guard refuses the
      // DPDP Programme Owner, who may edit the scope (D-026) but not declare a Third-Schedule class.
      expect((await tx.as(legal(), "UPDATE public.organizations SET third_schedule_class = 'ecommerce' WHERE id = $1", [ORG_A])).rowCount).toBe(0);
      await expect(tx.as(registrar(), "UPDATE public.organizations SET third_schedule_class = 'ecommerce' WHERE id = $1", [ORG_A])).rejects.toMatchObject({ code: "TS403" });
      await tx.as(u(SEED_USERS.muAdmin.id), "UPDATE public.organizations SET third_schedule_class = 'ecommerce' WHERE id = $1", [ORG_A]);
      await expect(schedule(tx, legal(), ORG_A, { basis: "deemed_inactivity", period_months: 24 })).rejects.toMatchObject({ code: "23514" });
      const d = await schedule(tx, legal(), ORG_A, { basis: "deemed_inactivity", period_months: 36, starts_on: "2024-05-01" });
      expect(d.ends_on).toBe("2028-11-13"); // from the Rules' commencement, the later date
      expect(d.inform_by).toBe("2028-11-11");
      // The class cannot be cleared while a schedule runs on it — for tooling too.
      await expect(tx.asAdmin("UPDATE public.organizations SET third_schedule_class = NULL WHERE id = $1", [ORG_A])).rejects.toMatchObject({ code: "TS409" });
      await expect(tx.asAdmin("UPDATE public.organizations SET third_schedule_class = 'retail' WHERE id = $1", [ORG_A])).rejects.toMatchObject({ code: "23514" });
    });
  });
});

describe("3. an erasure is recorded once, stamped, and never changed", () => {
  it("stamped with who recorded it; never updated (even by tooling) nor deleted by a user", async () => {
    await inTransaction(client, async (tx) => {
      const e = (await erase(tx, ciso(), OVERDUE.id, await daysAgo(tx, 1))).rows[0]!;
      expect(e.recorded_by).toBe(SEED_USERS.muItSecurity.id);
      await expect(tx.as(ciso(), "UPDATE public.retention_erasures SET erased_on = erased_on - 1 WHERE id = $1", [e.id])).rejects.toMatchObject({ code: "42501" });
      await expect(tx.as(ciso(), "DELETE FROM public.retention_erasures WHERE id = $1", [e.id])).rejects.toMatchObject({ code: "42501" });
      await expect(tx.asAdmin("UPDATE public.retention_erasures SET method = 'anonymised' WHERE id = $1", [e.id])).rejects.toMatchObject({ code: "TS409" });
      await expect(tx.as(ciso(), "DELETE FROM public.retention_schedules WHERE id = $1", [OVERDUE.id])).rejects.toMatchObject({ code: "42501" });
    });
  });

  it("no erasure in the future; another way says which; Rule 8(2)'s notice only under the deemed basis", async () => {
    await inTransaction(client, async (tx) => {
      await expect(erase(tx, ciso(), OVERDUE.id, await daysAgo(tx, -1))).rejects.toMatchObject({ code: "TS422" });
      await expect(erase(tx, ciso(), OVERDUE.id, await daysAgo(tx, 1), { method: "other" })).rejects.toMatchObject({ code: "23514" });
      await expect(erase(tx, ciso(), OVERDUE.id, await daysAgo(tx, 1), { principals_informed_on: await daysAgo(tx, 5) })).rejects.toMatchObject({ code: "TS422" });
      await tx.asAdmin("UPDATE public.organizations SET third_schedule_class = 'social_media' WHERE id = $1", [ORG_A]);
      const d = await schedule(tx, legal(), ORG_A, { basis: "deemed_inactivity", period_months: 36, starts_on: "2023-09-01" });
      await expect(erase(tx, ciso(), d.id, await daysAgo(tx, 1))).rejects.toMatchObject({ code: "TS422" });
      await expect(erase(tx, ciso(), d.id, await daysAgo(tx, 3), { principals_informed_on: await daysAgo(tx, 1) })).rejects.toMatchObject({ code: "23514" });
      expect((await erase(tx, ciso(), d.id, await daysAgo(tx, 1), { principals_informed_on: await daysAgo(tx, 4) })).rowCount).toBe(1);
    });
  });
});

describe("4. overdue erasure is work on the one action table, and closes on the erasure (D-095)", () => {
  it("one door, one parent; the owner alone cannot close it without the erasure", async () => {
    await inTransaction(client, async (tx) => {
      const id = await addAction(tx, legal(), OVERDUE.id, SEED_USERS.muLegal.id);
      const parents = await tx.asAdmin<{ n: number }>(
        "SELECT num_nonnulls(gap_id, ropa_gap_id, breach_incident_id, rights_request_id, retention_schedule_id) AS n FROM public.gap_actions WHERE id = $1",
        [id],
      );
      expect(parents.rows[0]!.n).toBe(1);
      await expect(tx.as(legal(), "UPDATE public.gap_actions SET status = 'closed' WHERE id = $1", [id])).rejects.toMatchObject({
        code: "TS409",
        message: expect.stringContaining("the erasure recorded on its schedule by someone other than its owner"),
      });
      // The owner's own erasure is not the second person.
      await erase(tx, legal(), OVERDUE.id, await daysAgo(tx, 1));
      await expect(tx.as(legal(), "UPDATE public.gap_actions SET status = 'closed' WHERE id = $1", [id])).rejects.toMatchObject({ code: "TS409" });
      // Someone else's erasure for this cycle closes it.
      await erase(tx, ciso(), OVERDUE.id, await daysAgo(tx, 1));
      const closed = await tx.as<{ closure_basis: string; closed_by: string }>(legal(), "UPDATE public.gap_actions SET status = 'closed' WHERE id = $1 RETURNING closure_basis, closed_by", [id]);
      expect(closed.rows[0]).toMatchObject({ closure_basis: "erasure_recorded", closed_by: SEED_USERS.muLegal.id });
    });
  });

  it("an erasure from before the cycle started does not count; a reviewer who is not the owner still may close", async () => {
    await inTransaction(client, async (tx) => {
      const s = await schedule(tx, legal(), ORG_A, { starts_on: await daysAgo(tx, 400) });
      await erase(tx, ciso(), s.id, await daysAgo(tx, 401));
      const id = await addAction(tx, legal(), s.id, SEED_USERS.muLegal.id);
      await expect(tx.as(legal(), "UPDATE public.gap_actions SET status = 'closed' WHERE id = $1", [id])).rejects.toMatchObject({ code: "TS409" });
      const closed = await tx.as<{ closure_basis: string }>(registrar(), "UPDATE public.gap_actions SET status = 'closed' WHERE id = $1 RETURNING closure_basis", [id]);
      expect(closed.rows[0]!.closure_basis).toBe("reviewer_approval");
    });
  });

  it("the erasure basis belongs to a retention schedule's action only — a CHECK", async () => {
    await inTransaction(client, async (tx) => {
      await tx.asAdmin("SET LOCAL session_replication_role = replica");
      const { rows } = await tx.asAdmin<{ id: string }>("SELECT id FROM public.gap_actions WHERE organization_id = $1 AND rights_request_id IS NOT NULL LIMIT 1", [ORG_A]);
      await expect(
        tx.asAdmin("UPDATE public.gap_actions SET status = 'closed', closure_basis = 'erasure_recorded', closed_at = now() WHERE id = $1", [rows[0]!.id]),
      ).rejects.toMatchObject({ code: "23514" });
    });
  });
});

describe("5. the AI risk register", () => {
  it("read by every member; written with ropa.write — the executive sponsor may not", async () => {
    await inTransaction(client, async (tx) => {
      await expect(
        tx.as(dean(), "INSERT INTO public.ai_systems (organization_id, name, purpose, personal_data) VALUES ($1, 'x', 'x', 'x')", [ORG_A]),
      ).rejects.toMatchObject({ code: "TS403" });
      expect((await tx.as(dean(), "UPDATE public.ai_systems SET name = 'x' WHERE id = $1", [PROCTORING.id])).rowCount).toBe(0);
      const ok = await tx.as<{ created_by: string }>(
        legal(),
        "INSERT INTO public.ai_systems (organization_id, usage_type, name, purpose, personal_data) VALUES ($1, 'chatbot', 'Student chatbot', 'Answers queries', 'Chat logs') RETURNING created_by",
        [ORG_A],
      );
      expect(ok.rows[0]!.created_by).toBe(SEED_USERS.muLegal.id);
      await expect(
        tx.as(legal(), "INSERT INTO public.ai_systems (organization_id, usage_type, name, purpose, personal_data) VALUES ($1, 'none', 'x', 'x', 'x')", [ORG_A]),
      ).rejects.toMatchObject({ code: "23514" });
      // A system is in the register once.
      await expect(
        tx.as(legal(), "INSERT INTO public.ai_systems (organization_id, system_id, name, purpose, personal_data) VALUES ($1, $2, 'x', 'x', 'x')", [
          ORG_A,
          SEED_SCOPE.mumbaiUniversity.systems.proctoring.id,
        ]),
      ).rejects.toMatchObject({ code: "23505" });
    });
  });

  it("a review is stamped, never in the future, corrected but never removed; the stamps are no user's to write", async () => {
    await inTransaction(client, async (tx) => {
      await expect(tx.as(legal(), "UPDATE public.ai_systems SET last_reviewed_on = current_date + 30 WHERE id = $1", [PROCTORING.id])).rejects.toMatchObject({ code: "TS422" });
      const r = await tx.as<{ review_recorded_by: string; review_recorded_at: string }>(
        legal(),
        "UPDATE public.ai_systems SET last_reviewed_on = (now() AT TIME ZONE 'Asia/Kolkata')::date - 2 WHERE id = $1 RETURNING review_recorded_by, review_recorded_at",
        [PROCTORING.id],
      );
      expect(r.rows[0]!.review_recorded_by).toBe(SEED_USERS.muLegal.id);
      expect(r.rows[0]!.review_recorded_at).not.toBeNull();
      // Another edit keeps the review's stamp.
      const kept = await tx.as<{ review_recorded_by: string }>(ciso(), "UPDATE public.ai_systems SET human_review = 'Two examiners' WHERE id = $1 RETURNING review_recorded_by", [PROCTORING.id]);
      expect(kept.rows[0]!.review_recorded_by).toBe(SEED_USERS.muLegal.id);
      await expect(tx.as(legal(), "UPDATE public.ai_systems SET last_reviewed_on = NULL WHERE id = $1", [PROCTORING.id])).rejects.toMatchObject({ code: "TS409" });
      await expect(tx.as(legal(), "UPDATE public.ai_systems SET review_recorded_by = $2 WHERE id = $1", [PROCTORING.id, SEED_USERS.muDean.id])).rejects.toMatchObject({ code: "42501" });
      await expect(tx.as(legal(), "DELETE FROM public.ai_systems WHERE id = $1", [PROCTORING.id])).rejects.toMatchObject({ code: "42501" });
    });
  });

  it("a system removed from the scope leaves its row standing, unlinked", async () => {
    await inTransaction(client, async (tx) => {
      const { rows } = await tx.asAdmin<{ id: string }>(
        "INSERT INTO public.systems (organization_id, name, system_type) VALUES ($1, 'RLS AI tool', 'ai') RETURNING id",
        [ORG_A],
      );
      const ai = await tx.as<{ id: string }>(legal(), "INSERT INTO public.ai_systems (organization_id, system_id, name, purpose, personal_data) VALUES ($1, $2, 'RLS AI tool', 'x', 'x') RETURNING id", [
        ORG_A,
        rows[0]!.id,
      ]);
      await tx.asAdmin("DELETE FROM public.systems WHERE id = $1", [rows[0]!.id]);
      const left = await tx.asAdmin<{ organization_id: string; system_id: string | null }>("SELECT organization_id, system_id FROM public.ai_systems WHERE id = $1", [ai.rows[0]!.id]);
      expect(left.rows[0]).toEqual({ organization_id: ORG_A, system_id: null });
    });
  });
});

describe("6. evidence links of the two new types", () => {
  async function stored(tx: Tx, org: string = ORG_A): Promise<string> {
    const id = randomUUID();
    const path = `organizations/${org}/evidence/${id}/certificate.pdf`;
    await tx.asAdmin("INSERT INTO storage.objects (bucket_id, name) VALUES ('evidence', $1)", [path]);
    await tx.asAdmin(
      "INSERT INTO public.evidence (id, organization_id, storage_path, file_name, content_type, byte_size, uploaded_by) VALUES ($1, $2, $3, 'certificate.pdf', 'application/pdf', 1024, $4)",
      [id, org, path, org === ORG_A ? SEED_USERS.muItSecurity.id : SEED_USERS.bharatManufacturing.id],
    );
    return id;
  }
  const link = (tx: Tx, actor: Actor, evidenceId: string, type: string, target: string, org: string = ORG_A) =>
    tx.as(actor, "INSERT INTO public.evidence_links (organization_id, evidence_id, linked_entity_type, linked_entity_id) VALUES ($1, $2, $3, $4)", [
      org,
      evidenceId,
      type,
      target,
    ]);

  it("an erasure certificate on a schedule needs retention.write; a review on an AI system needs ropa.write", async () => {
    await inTransaction(client, async (tx) => {
      const e = await stored(tx);
      expect((await link(tx, ciso(), e, "retention_schedule", ERASED.id)).rowCount).toBe(1);
      expect((await link(tx, ciso(), e, "ai_system", PROCTORING.id)).rowCount).toBe(1);
      // The executive sponsor holds neither (and no evidence.write: RLS refuses first).
      await expect(link(tx, dean(), await stored(tx), "retention_schedule", ERASED.id)).rejects.toBeTruthy();
      // Detaching: no approval stands on them.
      expect((await tx.as(ciso(), "DELETE FROM public.evidence_links WHERE evidence_id = $1 AND linked_entity_type = 'retention_schedule'", [e])).rowCount).toBe(1);
    });
  });

  it("never to another tenant's schedule or AI row", async () => {
    await inTransaction(client, async (tx) => {
      const b = await schedule(tx, bmlOwner(), ORG_B);
      const e = await stored(tx);
      await expect(link(tx, ciso(), e, "retention_schedule", b.id)).rejects.toMatchObject({ code: "TS404" });
      const bAi = await tx.as<{ id: string }>(bmlOwner(), "INSERT INTO public.ai_systems (organization_id, name, purpose, personal_data) VALUES ($1, 'x', 'x', 'x') RETURNING id", [ORG_B]);
      await expect(link(tx, ciso(), e, "ai_system", bAi.rows[0]!.id)).rejects.toMatchObject({ code: "TS404" });
    });
  });
});

describe("7. audit and model 1.5.0", () => {
  it("every write is audited by trigger, with no note, law, purpose or personal-data text", async () => {
    await inTransaction(client, async (tx) => {
      const s = await schedule(tx, legal(), ORG_A, { notes: "SECRET-NOTE", basis: "legal_requirement", period_months: 60, law_name: "SECRET-LAW" });
      await erase(tx, ciso(), s.id, await daysAgo(tx, 1), { method: "other", method_note: "SECRET-METHOD" });
      await tx.as(legal(), "INSERT INTO public.ai_systems (organization_id, name, purpose, personal_data, human_review) VALUES ($1, 'Audit AI', 'SECRET-PURPOSE', 'SECRET-DATA', 'SECRET-REVIEW')", [ORG_A]);
      const { rows } = await tx.asAdmin<{ event_type: string; user_id: string; metadata: unknown }>(
        "SELECT event_type, user_id, metadata FROM public.audit_logs WHERE organization_id = $1 AND event_type IN ('retention.retention_schedules.insert', 'retention.retention_erasures.insert', 'ai_risk.ai_systems.insert') AND created_at >= now() - interval '1 minute'",
        [ORG_A],
      );
      expect(rows.map((r) => r.event_type).sort()).toEqual(["ai_risk.ai_systems.insert", "retention.retention_erasures.insert", "retention.retention_schedules.insert"]);
      const text = JSON.stringify(rows.map((r) => r.metadata));
      expect(text).not.toContain("SECRET");
      expect(text).toContain('"retentionBasis":"legal_requirement"');
      expect(text).toContain('"erasureMethod":"other"');
    });
  });

  it("MU's overdue erasure sets head 7 Exposed in a stored snapshot; recording it clears the reason; head 4 stays not applicable", async () => {
    await inTransaction(client, async (tx) => {
      const snapshot = async () => {
        const { rows } = await tx.as<{ id: string }>(registrar(), "SELECT public.record_exposure_snapshot($1) AS id", [ORG_A]);
        return (await tx.asAdmin<{ model_version: string; heads: { code: string; status: string; reasons: { text: string }[] }[] }>(
          "SELECT model_version, heads FROM public.exposure_snapshots WHERE id = $1",
          [rows[0]!.id],
        )).rows[0]!;
      };
      const first = await snapshot();
      expect(first.model_version).toBe("1.7.0");
      const h7 = first.heads.find((h) => h.code === "H7")!;
      expect(h7.status).toBe("exposed");
      const texts = h7.reasons.map((r) => r.text);
      expect(texts).toContain("1 retention schedule is past its end date with no erasure recorded (s.8(7)).");
      expect(texts).toContain("1 retention schedule has no end date recorded, so its erasure cannot be shown to follow (s.8(7)).");
      expect(first.heads.find((h) => h.code === "H4")!.status).toBe("not_applicable");

      await erase(tx, ciso(), OVERDUE.id, await daysAgo(tx, 1));
      const after = (await snapshot()).heads.find((h) => h.code === "H7")!.reasons.map((r) => r.text);
      expect(after.join(" ")).not.toContain("past its end date with no erasure");
    });
  });
});

describe("8. D-096 — when an erasure counts; recorded in error; children in the AI register", () => {
  const void_ = (tx: Tx, actor: Actor, erasureId: string, reason = "Wrong schedule", org: string = ORG_A) =>
    tx.as<{ id: string; voided_by: string }>(
      actor,
      "INSERT INTO public.retention_erasure_voids (organization_id, retention_erasure_id, reason) VALUES ($1, $2, $3) RETURNING id, voided_by",
      [org, erasureId, reason],
    );
  const h7 = async (tx: Tx) => {
    const { rows } = await tx.as<{ id: string }>(registrar(), "SELECT public.record_exposure_snapshot($1) AS id", [ORG_A]);
    const snap = await tx.asAdmin<{ heads: { code: string; status: string; reasons: { text: string }[] }[] }>(
      "SELECT heads FROM public.exposure_snapshots WHERE id = $1",
      [rows[0]!.id],
    );
    return snap.rows[0]!.heads.find((h) => h.code === "H7")!.reasons.map((r) => r.text).join(" ");
  };

  it("R2: an erasure with the processors not told neither clears the overdue state nor closes the action", async () => {
    await inTransaction(client, async (tx) => {
      const id = await addAction(tx, legal(), OVERDUE.id, SEED_USERS.muLegal.id);
      await erase(tx, ciso(), OVERDUE.id, await daysAgo(tx, 1), { processors_told: "no" });
      await expect(tx.as(legal(), "UPDATE public.gap_actions SET status = 'closed' WHERE id = $1", [id])).rejects.toMatchObject({ code: "TS409" });
      expect(await h7(tx)).toContain("past its end date with no erasure recorded");
      // Recorded again with the processors told: now it counts.
      await erase(tx, ciso(), OVERDUE.id, await daysAgo(tx, 1), { processors_told: "yes" });
      const closed = await tx.as<{ closure_basis: string }>(legal(), "UPDATE public.gap_actions SET status = 'closed' WHERE id = $1 RETURNING closure_basis", [id]);
      expect(closed.rows[0]!.closure_basis).toBe("erasure_recorded");
      expect(await h7(tx)).not.toContain("past its end date with no erasure recorded");
    });
  });

  it("R4: marked in error once, with a reason, by someone other than its recorder — stamped, never changed or removed", async () => {
    await inTransaction(client, async (tx) => {
      const e = (await erase(tx, ciso(), OVERDUE.id, await daysAgo(tx, 1))).rows[0]!;
      // The recorder may not mark their own erasure.
      await expect(void_(tx, ciso(), e.id)).rejects.toMatchObject({ code: "TS409" });
      // Nor may someone without retention.write, or another tenant.
      await expect(void_(tx, dean(), e.id)).rejects.toMatchObject({ code: "TS403" });
      await expect(void_(tx, bmlOwner(), e.id)).rejects.toBeTruthy();
      // A reason, in words.
      await expect(void_(tx, legal(), e.id, "   ")).rejects.toMatchObject({ code: "23514" });
      // Who marked it is stamped, never sent.
      await expect(
        tx.as(legal(), "INSERT INTO public.retention_erasure_voids (organization_id, retention_erasure_id, reason, voided_by) VALUES ($1, $2, 'x', $3)", [
          ORG_A,
          e.id,
          SEED_USERS.muDean.id,
        ]),
      ).rejects.toMatchObject({ code: "42501" });
      const v = (await void_(tx, legal(), e.id)).rows[0]!;
      expect(v.voided_by).toBe(SEED_USERS.muLegal.id);
      // Once only; never updated (even by tooling) nor deleted.
      await expect(void_(tx, registrar(), e.id)).rejects.toMatchObject({ code: "23505" });
      await expect(tx.as(legal(), "UPDATE public.retention_erasure_voids SET reason = 'x' WHERE id = $1", [v.id])).rejects.toMatchObject({ code: "42501" });
      await expect(tx.as(legal(), "DELETE FROM public.retention_erasure_voids WHERE id = $1", [v.id])).rejects.toMatchObject({ code: "42501" });
      await expect(tx.asAdmin("UPDATE public.retention_erasure_voids SET reason = 'x' WHERE id = $1", [v.id])).rejects.toMatchObject({ code: "TS409" });
      // The erasure itself stays, and every reader of the register sees the void.
      expect((await tx.as(dean(), "SELECT id FROM public.retention_erasures WHERE id = $1", [e.id])).rowCount).toBe(1);
      expect((await tx.as(dean(), "SELECT id FROM public.retention_erasure_voids WHERE id = $1", [v.id])).rowCount).toBe(1);
      expect((await tx.as(bmlOwner(), "SELECT id FROM public.retention_erasure_voids WHERE id = $1", [v.id])).rowCount).toBe(0);
    });
  });

  it("R4: a voided erasure no longer counts — the schedule is overdue again and the action does not close on it", async () => {
    await inTransaction(client, async (tx) => {
      const id = await addAction(tx, legal(), OVERDUE.id, SEED_USERS.muLegal.id);
      const e = (await erase(tx, ciso(), OVERDUE.id, await daysAgo(tx, 1))).rows[0]!;
      expect(await h7(tx)).not.toContain("past its end date with no erasure recorded");
      await void_(tx, registrar(), e.id);
      expect(await h7(tx)).toContain("past its end date with no erasure recorded");
      await expect(tx.as(legal(), "UPDATE public.gap_actions SET status = 'closed' WHERE id = $1", [id])).rejects.toMatchObject({ code: "TS409" });
    });
  });

  it("R4: a void is audited by trigger, never with its reason", async () => {
    await inTransaction(client, async (tx) => {
      const e = (await erase(tx, ciso(), OVERDUE.id, await daysAgo(tx, 1))).rows[0]!;
      await void_(tx, legal(), e.id, "SECRET-REASON");
      const { rows } = await tx.asAdmin<{ user_id: string; metadata: unknown }>(
        "SELECT user_id, metadata FROM public.audit_logs WHERE organization_id = $1 AND event_type = 'retention.retention_erasure_voids.insert' AND created_at >= now() - interval '1 minute'",
        [ORG_A],
      );
      expect(rows).toHaveLength(1);
      expect(rows[0]!.user_id).toBe(SEED_USERS.muLegal.id);
      expect(JSON.stringify(rows[0]!.metadata)).not.toContain("SECRET");
      expect(JSON.stringify(rows[0]!.metadata)).toContain(e.id);
    });
  });

  it("R5: s.9(3)'s question, and a Fourth Schedule exemption only on yes — MU's proctoring relies on A3", async () => {
    await inTransaction(client, async (tx) => {
      const seeded = await tx.as<{ child_tracking: string; child_exemption: string | null }>(
        dean(),
        "SELECT child_tracking, child_exemption FROM public.ai_systems WHERE id = $1",
        [PROCTORING.id],
      );
      expect(seeded.rows[0]).toEqual({ child_tracking: "yes", child_exemption: "education" });
      const insert = (tracking: string, exemption: string | null) =>
        tx.as(legal(), "INSERT INTO public.ai_systems (organization_id, name, purpose, personal_data, child_tracking, child_exemption) VALUES ($1, $2, 'x', 'x', $3, $4)", [
          ORG_A,
          `RLS AI ${randomUUID()}`,
          tracking,
          exemption,
        ]);
      await expect(insert("no", "education")).rejects.toMatchObject({ code: "23514" });
      await expect(insert("unknown", "education")).rejects.toMatchObject({ code: "23514" });
      await expect(insert("yes", "proctoring")).rejects.toMatchObject({ code: "23514" });
      await expect(insert("maybe", null)).rejects.toMatchObject({ code: "23514" });
      expect((await insert("yes", null)).rowCount).toBe(1);
      expect((await insert("yes", "location_safety")).rowCount).toBe(1);
      // Answering "no" with the exemption still set is refused: the two move together.
      await expect(tx.as(legal(), "UPDATE public.ai_systems SET child_tracking = 'no' WHERE id = $1", [PROCTORING.id])).rejects.toMatchObject({ code: "23514" });
    });
  });

  it("R5: the AI register is read with ropa.read", async () => {
    await inTransaction(client, async (tx) => {
      const { rows } = await tx.asAdmin<{ qual: string }>(
        "SELECT qual FROM pg_policies WHERE schemaname = 'public' AND tablename = 'ai_systems' AND policyname = 'ai_systems_select_member'",
      );
      expect(rows[0]!.qual).toContain("ropa.read");
      // Every seeded member holds it, so each still reads MU's row.
      for (const actor of [dean(), legal(), ciso(), registrar()]) {
        expect((await tx.as(actor, "SELECT id FROM public.ai_systems WHERE id = $1", [PROCTORING.id])).rowCount).toBe(1);
      }
    });
  });
});
