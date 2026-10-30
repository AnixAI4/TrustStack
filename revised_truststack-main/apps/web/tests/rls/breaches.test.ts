/**
 * Slice 10, Stage 1 — GATE 5 (RLS) and the database's rules for the breach
 * register (migration 20261011000000_breach_register).
 *
 *   1. Org A cannot see or touch Org B's breaches or their actions; anon sees
 *      nothing; reading needs breach.read, writing breach.write.
 *   2. The facts are DERIVED, never forged: the code and the Board report's
 *      due time (aware + 72 hours, or the Board's extension) are the
 *      database's; no user holds a grant on them, nor on `aware_at` once the
 *      row exists; tooling that forges a due time is refused by a CHECK.
 *   3. Each intimation is stamped with who recorded it and when; a recorded
 *      fact may be corrected, never removed; nothing is in the future.
 *   4. The lifecycle: closing needs both intimations; a closed or dismissed
 *      breach is reopened before it changes; a dismissal has its reason;
 *      nothing is ever deleted.
 *   5. Its remediation lives in the ONE action table, created through one
 *      RPC, under D-056's closing rule, with exactly one of three parents.
 *   6. Audit by trigger, never free text; the 1.1.0 snapshot reads the register.
 *
 * Every test runs inside a transaction that is rolled back.
 */
import { SEED_BREACHES, SEED_ORGS, SEED_USERS } from "@truststack/db/seed-data";
import type pg from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { authSubjects, connect, inTransaction, type Tx } from "./db";

const ORG_A = SEED_ORGS.mumbaiUniversity.id;
const ORG_B = SEED_ORGS.bharatManufacturing.id;
const SEEDED = SEED_BREACHES.examMarksLink;

let client: pg.Client;
let who: Map<string, { sub: string; email: string }>;
const u = (id: string) => who.get(id)!;
const ciso = () => u(SEED_USERS.muItSecurity.id); // contributor: breach.write + gap.write, NO evidence.review
const registrar = () => u(SEED_USERS.mumbaiUniversity.id); // dpdp_owner: breach.write + evidence.review
const dean = () => u(SEED_USERS.muDean.id); // executive sponsor: breach.read only
const bmlOwner = () => u(SEED_USERS.bharatManufacturing.id);
type Actor = { sub: string; email: string };

beforeAll(async () => {
  client = await connect();
  who = await authSubjects(client, Object.values(SEED_USERS).map((x) => x.id));
});
afterAll(async () => {
  await client?.end();
});

const HOUR = 3_600_000;
/** A breach the organisation became aware of `hoursAgo` hours ago, recorded by `actor`. */
async function record(tx: Tx, actor: Actor, org: string, hoursAgo = 1, over: Record<string, unknown> = {}) {
  const fields = { title: "RLS breach", nature: "unauthorised_access", severity: "high", aware_at: new Date(Date.now() - hoursAgo * HOUR).toISOString(), ...over };
  const cols = Object.keys(fields);
  const { rows } = await tx.as<{ id: string; incident_code: string; board_report_due_at: Date; aware_at: Date; status: string; created_by: string }>(
    actor,
    `INSERT INTO public.breach_incidents (organization_id, ${cols.join(", ")}) VALUES ($1, ${cols.map((_, i) => `$${i + 2}`).join(", ")})
     RETURNING id, incident_code, board_report_due_at, aware_at, status, created_by`,
    [org, ...Object.values(fields)],
  );
  return rows[0]!;
}

const row = async (tx: Tx, id: string) =>
  (await tx.asAdmin<Record<string, unknown>>("SELECT * FROM public.breach_incidents WHERE id = $1", [id])).rows[0]!;

describe("1. tenancy (gate 5) and permissions", () => {
  it("a member reads their own register; Org B's owner sees none of it; anon sees nothing", async () => {
    await inTransaction(client, async (tx) => {
      const mine = await tx.as(dean(), "SELECT id FROM public.breach_incidents WHERE organization_id = $1", [ORG_A]);
      expect(mine.rows.map((r) => r.id)).toContain(SEEDED.id);
      const theirs = await tx.as(bmlOwner(), "SELECT id FROM public.breach_incidents WHERE organization_id = $1", [ORG_A]);
      expect(theirs.rowCount).toBe(0);
      await expect(tx.as(null, "SELECT id FROM public.breach_incidents")).rejects.toMatchObject({ code: "42501" });
    });
  });

  it("Org A cannot record into Org B, update Org B's breach, or reach Org B's actions", async () => {
    await inTransaction(client, async (tx) => {
      const b = await record(tx, bmlOwner(), ORG_B);
      // The trigger's second lock answers before RLS's WITH CHECK, with a message.
      await expect(record(tx, ciso(), ORG_B)).rejects.toMatchObject({ code: "TS403" });
      const hijack = await tx.as(ciso(), "UPDATE public.breach_incidents SET title = 'Hijacked' WHERE id = $1", [b.id]);
      expect(hijack.rowCount).toBe(0);
      // The action door checks the caller's permission in THAT organisation.
      await expect(
        tx.as(ciso(), "SELECT public.add_breach_action($1, $2, 'Hijack', NULL, NULL)", [ORG_B, b.id]),
      ).rejects.toMatchObject({ code: "TS403" });
      // …and an Org A path with Org B's breach id is simply not found.
      await expect(
        tx.as(ciso(), "SELECT public.add_breach_action($1, $2, 'Hijack', NULL, NULL)", [ORG_A, b.id]),
      ).rejects.toMatchObject({ code: "TS404" });
      expect((await row(tx, b.id)).title).toBe("RLS breach");
    });
  });

  it("a composite FK refuses an action pointing at another tenant's breach, even from tooling", async () => {
    await inTransaction(client, async (tx) => {
      const b = await record(tx, bmlOwner(), ORG_B);
      await expect(
        tx.asAdmin("INSERT INTO public.gap_actions (organization_id, breach_incident_id, title) VALUES ($1, $2, 'x')", [ORG_A, b.id]),
      ).rejects.toMatchObject({ code: "23503" });
    });
  });

  it("reading needs breach.read; writing needs breach.write (the executive sponsor reads only)", async () => {
    await inTransaction(client, async (tx) => {
      await expect(record(tx, dean(), ORG_A)).rejects.toMatchObject({ code: "TS403" });
      const upd = await tx.as(dean(), "UPDATE public.breach_incidents SET title = 'x' WHERE id = $1", [SEEDED.id]);
      expect(upd.rowCount).toBe(0);
      const revoked = await tx.asAdmin(
        `DELETE FROM public.role_permissions rp USING public.roles r, public.permissions p
         WHERE rp.role_id = r.id AND rp.permission_id = p.id AND r.code = 'executive_sponsor' AND p.code = 'breach.read'`,
      );
      expect(revoked.rowCount).toBe(1);
      expect((await tx.as(dean(), "SELECT id FROM public.breach_incidents")).rowCount).toBe(0);
    });
  });
});

describe("2. derived, never forged", () => {
  it("the database assigns the code and the due time: aware + 72 hours, to the microsecond", async () => {
    await inTransaction(client, async (tx) => {
      const b = await record(tx, ciso(), ORG_A, 1, { aware_at: "2026-10-10T10:00:00+05:30" });
      expect(b.incident_code).toMatch(/^BRH-2026-\d{3}$/);
      expect(b.board_report_due_at.toISOString()).toBe("2026-10-13T04:30:00.000Z");
      expect(b.status).toBe("open");
      expect(b.created_by).toBe(SEED_USERS.muItSecurity.id);
      const next = await record(tx, ciso(), ORG_A, 1, { aware_at: "2026-10-10T11:00:00+05:30" });
      expect(Number(next.incident_code.slice(-3))).toBe(Number(b.incident_code.slice(-3)) + 1);
      // Per organisation: Org B's first breach of the year is 001 whatever Org A has.
      expect((await record(tx, bmlOwner(), ORG_B, 1, { aware_at: "2026-10-10T10:00:00+05:30" })).incident_code).toBe("BRH-2026-001");
    });
  });

  it("no user may write the code, the due time, the status on insert, or any stamp", async () => {
    await inTransaction(client, async (tx) => {
      for (const forged of [
        { incident_code: "BRH-2026-999" },
        { board_report_due_at: "2030-01-01T00:00:00Z" },
        { status: "closed" },
        { board_report_recorded_by: SEED_USERS.muDean.id },
        { created_by: SEED_USERS.muDean.id },
      ]) {
        await expect(record(tx, ciso(), ORG_A, 1, forged), JSON.stringify(forged)).rejects.toMatchObject({ code: "42501" });
      }
    });
  });

  it("when the organisation became aware cannot be edited — the clock does not move", async () => {
    await inTransaction(client, async (tx) => {
      const b = await record(tx, ciso(), ORG_A, 100);
      await expect(
        tx.as(ciso(), "UPDATE public.breach_incidents SET aware_at = now() WHERE id = $1", [b.id]),
      ).rejects.toMatchObject({ code: "42501" });
      await expect(
        tx.as(ciso(), "UPDATE public.breach_incidents SET board_report_due_at = now() + interval '1 year' WHERE id = $1", [b.id]),
      ).rejects.toMatchObject({ code: "42501" });
    });
  });

  it("tooling that forges a due time is refused by the CHECK; the trigger re-derives it anyway", async () => {
    await inTransaction(client, async (tx) => {
      const b = await record(tx, ciso(), ORG_A, 1);
      await tx.asAdmin("UPDATE public.breach_incidents SET board_report_due_at = now() + interval '1 year' WHERE id = $1", [b.id]);
      expect((await row(tx, b.id)).board_report_due_at).toEqual(b.board_report_due_at);
      await tx.asAdmin("ALTER TABLE public.breach_incidents DISABLE TRIGGER breach_incidents_before_write");
      await expect(
        tx.asAdmin("UPDATE public.breach_incidents SET board_report_due_at = now() + interval '1 year' WHERE id = $1", [b.id]),
      ).rejects.toMatchObject({ code: "23514" });
    });
  });

  it("the Board's extension moves the due time — it must run beyond 72 hours and carry the Board's reference", async () => {
    await inTransaction(client, async (tx) => {
      const b = await record(tx, ciso(), ORG_A, 10, { aware_at: "2026-10-10T10:00:00+05:30" });
      await expect(
        tx.as(ciso(), "UPDATE public.breach_incidents SET board_extension_until = '2026-10-12T10:00:00+05:30', board_extension_ref = 'DPB/1' WHERE id = $1", [b.id]),
      ).rejects.toMatchObject({ code: "23514" });
      await expect(
        tx.as(ciso(), "UPDATE public.breach_incidents SET board_extension_until = '2026-10-20T10:00:00+05:30' WHERE id = $1", [b.id]),
      ).rejects.toMatchObject({ code: "23514" });
      await tx.as(ciso(), "UPDATE public.breach_incidents SET board_extension_until = '2026-10-20T10:00:00+05:30', board_extension_ref = 'DPB/1' WHERE id = $1", [b.id]);
      const r = await row(tx, b.id);
      expect((r.board_report_due_at as Date).toISOString()).toBe("2026-10-20T04:30:00.000Z");
      expect(r.board_extension_recorded_by).toBe(SEED_USERS.muItSecurity.id);
      expect(r.board_extension_recorded_at).not.toBeNull();
    });
  });

  it("nothing before the Act; nothing occurring after the organisation became aware", async () => {
    await inTransaction(client, async (tx) => {
      await expect(record(tx, ciso(), ORG_A, 1, { aware_at: "2023-08-10T12:00:00+05:30" })).rejects.toMatchObject({ code: "23514" });
      await expect(record(tx, ciso(), ORG_A, 5, { occurred_at: new Date().toISOString() })).rejects.toMatchObject({ code: "23514" });
    });
  });
});

describe("3. each fact stamped, corrected never removed, never in the future", () => {
  it("records who recorded each intimation, and when; only that fact's stamp moves", async () => {
    await inTransaction(client, async (tx) => {
      const b = await record(tx, ciso(), ORG_A, 10);
      const at = new Date(Date.now() - 5 * HOUR).toISOString();
      await tx.as(ciso(), "UPDATE public.breach_incidents SET board_initial_at = $2 WHERE id = $1", [b.id, at]);
      await tx.as(registrar(), "UPDATE public.breach_incidents SET principals_intimated_at = $2, principals_intimation_method = 'Email' WHERE id = $1", [b.id, at]);
      const r = await row(tx, b.id);
      expect(r.board_initial_recorded_by).toBe(SEED_USERS.muItSecurity.id);
      expect(r.principals_recorded_by).toBe(SEED_USERS.mumbaiUniversity.id);
      expect(r.board_report_recorded_by).toBeNull();
      expect(r.updated_by).toBe(SEED_USERS.mumbaiUniversity.id);
    });
  });

  it("a recorded intimation can be corrected but never removed", async () => {
    await inTransaction(client, async (tx) => {
      const b = await record(tx, ciso(), ORG_A, 10);
      await tx.as(ciso(), "UPDATE public.breach_incidents SET board_report_at = now() - interval '2 hours' WHERE id = $1", [b.id]);
      await tx.as(ciso(), "UPDATE public.breach_incidents SET board_report_at = now() - interval '3 hours', board_report_ref = 'R-2' WHERE id = $1", [b.id]);
      await expect(
        tx.as(ciso(), "UPDATE public.breach_incidents SET board_report_at = NULL, board_report_ref = NULL WHERE id = $1", [b.id]),
      ).rejects.toMatchObject({ code: "TS409" });
    });
  });

  it("an intimation cannot be in the future, nor before the organisation knew; a method goes with the people's", async () => {
    await inTransaction(client, async (tx) => {
      const b = await record(tx, ciso(), ORG_A, 10);
      await expect(
        tx.as(ciso(), "UPDATE public.breach_incidents SET board_report_at = now() + interval '1 day' WHERE id = $1", [b.id]),
      ).rejects.toMatchObject({ code: "TS422" });
      await expect(
        tx.as(ciso(), "UPDATE public.breach_incidents SET board_initial_at = aware_at - interval '1 hour' WHERE id = $1", [b.id]),
      ).rejects.toMatchObject({ code: "23514" });
      await expect(
        tx.as(ciso(), "UPDATE public.breach_incidents SET principals_intimated_at = now() WHERE id = $1", [b.id]),
      ).rejects.toMatchObject({ code: "23514" });
      await expect(record(tx, ciso(), ORG_A, -48)).rejects.toMatchObject({ code: "TS422" });
    });
  });
});

describe("4. the lifecycle", () => {
  it("closing needs both intimations recorded; then it is stamped and locked until reopened", async () => {
    await inTransaction(client, async (tx) => {
      const b = await record(tx, ciso(), ORG_A, 10);
      await expect(tx.as(ciso(), "UPDATE public.breach_incidents SET status = 'closed' WHERE id = $1", [b.id])).rejects.toMatchObject({ code: "TS409" });
      await tx.as(ciso(), "UPDATE public.breach_incidents SET board_report_at = now() - interval '1 hour' WHERE id = $1", [b.id]);
      await expect(tx.as(ciso(), "UPDATE public.breach_incidents SET status = 'closed' WHERE id = $1", [b.id])).rejects.toMatchObject({ code: "TS409" });
      await tx.as(ciso(), "UPDATE public.breach_incidents SET principals_intimated_at = now() - interval '1 hour', principals_intimation_method = 'SMS' WHERE id = $1", [b.id]);
      await tx.as(ciso(), "UPDATE public.breach_incidents SET status = 'closed' WHERE id = $1", [b.id]);
      const closed = await row(tx, b.id);
      expect(closed.closed_by).toBe(SEED_USERS.muItSecurity.id);
      expect(closed.closed_at).not.toBeNull();
      await expect(tx.as(ciso(), "UPDATE public.breach_incidents SET title = 'Edited' WHERE id = $1", [b.id])).rejects.toMatchObject({ code: "TS409" });
      await expect(tx.as(ciso(), "UPDATE public.breach_incidents SET status = 'contained' WHERE id = $1", [b.id])).rejects.toMatchObject({ code: "TS409" });
      await tx.as(ciso(), "UPDATE public.breach_incidents SET status = 'open' WHERE id = $1", [b.id]);
      expect((await row(tx, b.id)).closed_at).toBeNull();
    });
  });

  it("a dismissal needs its reason; reopening withdraws it", async () => {
    await inTransaction(client, async (tx) => {
      const b = await record(tx, ciso(), ORG_A, 10);
      await expect(tx.as(ciso(), "UPDATE public.breach_incidents SET status = 'dismissed' WHERE id = $1", [b.id])).rejects.toMatchObject({ code: "23514" });
      await tx.as(ciso(), "UPDATE public.breach_incidents SET status = 'dismissed', dismissal_reason = 'Test data only' WHERE id = $1", [b.id]);
      await expect(tx.as(ciso(), "UPDATE public.breach_incidents SET title = 'x' WHERE id = $1", [b.id])).rejects.toMatchObject({ code: "TS409" });
      await tx.as(ciso(), "UPDATE public.breach_incidents SET status = 'open' WHERE id = $1", [b.id]);
      expect((await row(tx, b.id)).dismissal_reason).toBeNull();
    });
  });

  it("nothing is ever deleted — there is no DELETE grant", async () => {
    await inTransaction(client, async (tx) => {
      await expect(tx.as(registrar(), "DELETE FROM public.breach_incidents WHERE id = $1", [SEEDED.id])).rejects.toMatchObject({ code: "42501" });
    });
  });
});

describe("5. remediation on the ONE action table", () => {
  it("add_breach_action creates an action with exactly one parent, audited, without a user INSERT grant", async () => {
    await inTransaction(client, async (tx) => {
      const b = await record(tx, ciso(), ORG_A, 10);
      await expect(
        tx.as(ciso(), "INSERT INTO public.gap_actions (organization_id, breach_incident_id, title) VALUES ($1, $2, 'x')", [ORG_A, b.id]),
      ).rejects.toMatchObject({ code: "42501" });
      const { rows } = await tx.as<{ id: string }>(ciso(), "SELECT public.add_breach_action($1, $2, '  Rotate the shared link  ', $3, '2026-12-01') AS id", [
        ORG_A,
        b.id,
        SEED_USERS.muItSecurity.id,
      ]);
      const action = (await tx.asAdmin("SELECT * FROM public.gap_actions WHERE id = $1", [rows[0]!.id])).rows[0]!;
      expect(action).toMatchObject({ title: "Rotate the shared link", status: "open", gap_id: null, ropa_gap_id: null, breach_incident_id: b.id });
      const audit = await tx.asAdmin("SELECT metadata FROM public.audit_logs WHERE event_type = 'breach.action.created' AND entity_id = $1", [rows[0]!.id]);
      expect(audit.rows).toHaveLength(1);
      expect(JSON.stringify(audit.rows[0]!.metadata)).not.toContain("Rotate");
      await expect(
        tx.asAdmin("UPDATE public.gap_actions SET ropa_gap_id = gen_random_uuid() WHERE id = $1", [rows[0]!.id]),
      ).rejects.toMatchObject({ code: "TS422" });
    });
  });

  it("the one-parent CHECK now counts three parents", async () => {
    await inTransaction(client, async (tx) => {
      const b = await record(tx, ciso(), ORG_A, 10);
      const gap = (await tx.asAdmin<{ id: string }>("SELECT id FROM public.assessment_gaps WHERE organization_id = $1 LIMIT 1", [ORG_A])).rows[0]!;
      await expect(
        tx.asAdmin("INSERT INTO public.gap_actions (organization_id, gap_id, breach_incident_id, title) VALUES ($1, $2, $3, 'x')", [ORG_A, gap.id, b.id]),
      ).rejects.toMatchObject({ code: "23514" });
      await expect(tx.asAdmin("INSERT INTO public.gap_actions (organization_id, title) VALUES ($1, 'x')", [ORG_A])).rejects.toMatchObject({ code: "23514" });
    });
  });

  it("needs breach.write AND gap.write; refuses a dismissed breach, a non-member owner and a blank title", async () => {
    await inTransaction(client, async (tx) => {
      const b = await record(tx, ciso(), ORG_A, 10);
      await expect(tx.as(dean(), "SELECT public.add_breach_action($1, $2, 'x', NULL, NULL)", [ORG_A, b.id])).rejects.toMatchObject({ code: "TS403" });
      await expect(tx.as(ciso(), "SELECT public.add_breach_action($1, $2, '   ', NULL, NULL)", [ORG_A, b.id])).rejects.toMatchObject({ code: "TS422" });
      await expect(
        tx.as(ciso(), "SELECT public.add_breach_action($1, $2, 'x', $3, NULL)", [ORG_A, b.id, SEED_USERS.bmlAdmin.id]),
      ).rejects.toMatchObject({ code: "TS422" });
      await tx.as(ciso(), "UPDATE public.breach_incidents SET status = 'dismissed', dismissal_reason = 'Not personal data' WHERE id = $1", [b.id]);
      await expect(tx.as(ciso(), "SELECT public.add_breach_action($1, $2, 'x', NULL, NULL)", [ORG_A, b.id])).rejects.toMatchObject({ code: "TS409" });
      await expect(tx.as(null, "SELECT public.add_breach_action($1, $2, 'x', NULL, NULL)", [ORG_A, b.id])).rejects.toMatchObject({ code: "42501" });
    });
  });

  it("a breach action closes under D-056: the owner cannot approve their own; a reviewer who is not the owner can", async () => {
    await inTransaction(client, async (tx) => {
      const action = SEEDED.action.id; // owned by the IT/Security lead
      await expect(tx.as(ciso(), "UPDATE public.gap_actions SET status = 'closed' WHERE id = $1", [action])).rejects.toMatchObject({ code: "TS409" });
      await tx.as(registrar(), "UPDATE public.gap_actions SET status = 'closed' WHERE id = $1", [action]);
      const closed = (await tx.asAdmin("SELECT closure_basis, closed_by FROM public.gap_actions WHERE id = $1", [action])).rows[0]!;
      expect(closed).toEqual({ closure_basis: "reviewer_approval", closed_by: SEED_USERS.mumbaiUniversity.id });
    });
  });
});

describe("6. audit and the 1.1.0 snapshot", () => {
  it("every user write is audited by trigger — the code and status, never the title or the narrative", async () => {
    await inTransaction(client, async (tx) => {
      const b = await record(tx, ciso(), ORG_A, 10, { title: "Secret title", description: "Secret narrative" });
      await tx.as(ciso(), "UPDATE public.breach_incidents SET board_report_at = now() - interval '1 hour', board_report_ref = 'SECRET-REF' WHERE id = $1", [b.id]);
      const { rows } = await tx.asAdmin<{ event_type: string; metadata: Record<string, unknown> }>(
        // One transaction: both rows carry the same now(), so order by what they are.
        "SELECT event_type, metadata FROM public.audit_logs WHERE entity_id = $1 ORDER BY event_type",
        [b.id],
      );
      expect(rows.map((r) => r.event_type)).toEqual(["breach.breach_incidents.insert", "breach.breach_incidents.update"]);
      expect(rows[0]!.metadata).toMatchObject({ incidentCode: b.incident_code, breachStatus: "open", severity: "high" });
      expect(rows[1]!.metadata.changed).toEqual(["board_report_at", "board_report_ref"]);
      const text = JSON.stringify(rows);
      for (const secret of ["Secret title", "Secret narrative", "SECRET-REF"]) expect(text).not.toContain(secret);
    });
  });

  it("a snapshot is recorded under the current model (1.1.0 brought the breach rows), and reads the register: MU's breaches are s.33(2)(c) repetition on head 2", async () => {
    await inTransaction(client, async (tx) => {
      const input = (await tx.asAdmin<{ input: { breaches: { status: string; awareAt: string }[]; now: string } }>(
        "SELECT (app.exposure_input($1, current_date)) -> 'input' AS input",
        [ORG_A],
      )).rows[0]!.input;
      // The seeded breach is read as raw facts, its due time the database's (aware + 72 h).
      expect(input.breaches).toContainEqual({
        status: "closed",
        awareAt: SEEDED.awareAt,
        boardReportDueAt: "2026-03-17T04:50:00.000Z",
        boardReportAt: SEEDED.boardReportAt,
        principalsIntimatedAt: SEEDED.principalsIntimatedAt,
      });
      expect(input.now).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);

      const { rows } = await tx.as<{ id: string }>(registrar(), "SELECT public.record_exposure_snapshot($1) AS id", [ORG_A]);
      const snap = (await tx.asAdmin<{ model_version: string; heads: { code: string; position: { factors: { code: string; points: number }[] } | null }[] }>(
        "SELECT model_version, heads FROM public.exposure_snapshots WHERE id = $1",
        [rows[0]!.id],
      )).rows[0]!;
      expect(snap.model_version).toBe("1.7.0");
      // A local stack may hold more than the seeded one (a manual test adds some): +1 for one, +2 for more.
      const recent = input.breaches.filter((b) => b.status !== "dismissed" && Date.parse(b.awareAt) > Date.now() - 730 * 24 * 3_600_000).length;
      const h2 = snap.heads.find((h) => h.code === "H2")!;
      expect(h2.position?.factors.find((f) => f.code === "repetition")).toMatchObject({ points: recent === 1 ? 1 : 2 });
    });
  });

  it("Org B's input carries none of Org A's breaches", async () => {
    await inTransaction(client, async (tx) => {
      const input = (await tx.asAdmin<{ input: { breaches: unknown[] } }>("SELECT (app.exposure_input($1, current_date)) -> 'input' AS input", [ORG_B])).rows[0]!.input;
      expect(input.breaches).toEqual([]);
    });
  });
});
