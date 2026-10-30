/**
 * Slice 10, Stage 2 — GATE 5 (RLS) and the database's rules for the rights
 * and grievance register (migration 20261012000000_rights_register).
 *
 *   1. Org A cannot see or touch Org B's requests or their actions; anon
 *      holds nothing at all (public intake is Stage 3, by RPC); reading needs
 *      rights.read, writing rights.write.
 *   2. The facts are DERIVED, never forged: the code and the respond-by date
 *      (receipt + 90 days) are the database's; no user holds a grant on them,
 *      nor on `received_on` once the row exists; tooling that forges a
 *      respond-by date is refused by a CHECK.
 *   3. The identity check and the response are stamped with who recorded
 *      them; identity is corrected, never removed; nothing is dated in the
 *      future; fulfilling needs the person identified; less than fulfilled
 *      says why.
 *   4. The lifecycle: a closed request is reopened before it changes; a
 *      reopening withdraws the response; withdrawn and void carry a reason;
 *      a grievance stays a grievance; nothing is ever deleted.
 *   5. Its remediation lives in the ONE action table, created through one
 *      RPC, under D-056's closing rule, with exactly one of four parents.
 *   6. Audit by trigger, never personal data or free text; the 1.2.0
 *      snapshot reads the register.
 *
 * Every test runs inside a transaction that is rolled back.
 */
import { SEED_ORGS, SEED_RIGHTS_REQUESTS, SEED_USERS } from "@truststack/db/seed-data";
import type pg from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { authSubjects, connect, inTransaction, type Tx } from "./db";

const ORG_A = SEED_ORGS.mumbaiUniversity.id;
const ORG_B = SEED_ORGS.bharatManufacturing.id;
const ACCESS = SEED_RIGHTS_REQUESTS.marksAccess;
const GRIEVANCE = SEED_RIGHTS_REQUESTS.surnameGrievance;

let client: pg.Client;
let who: Map<string, { sub: string; email: string }>;
const u = (id: string) => who.get(id)!;
const legal = () => u(SEED_USERS.muLegal.id); // contributor: rights.write + gap.write, NO evidence.review
const registrar = () => u(SEED_USERS.mumbaiUniversity.id); // dpdp_owner: rights.write + evidence.review
const dean = () => u(SEED_USERS.muDean.id); // executive sponsor: rights.read only
const bmlOwner = () => u(SEED_USERS.bharatManufacturing.id);
type Actor = { sub: string; email: string };

beforeAll(async () => {
  client = await connect();
  who = await authSubjects(client, Object.values(SEED_USERS).map((x) => x.id));
});
afterAll(async () => {
  await client?.end();
});

/** India's calendar, `days` days ago — the database's own "today" (Asia/Kolkata). */
async function daysAgo(tx: Tx, days: number): Promise<string> {
  const { rows } = await tx.asAdmin<{ d: string }>("SELECT to_char((now() AT TIME ZONE 'Asia/Kolkata')::date - $1::integer, 'YYYY-MM-DD') AS d", [days]);
  return rows[0]!.d;
}

/** A request received `ago` days ago, recorded by `actor`. */
async function record(tx: Tx, actor: Actor, org: string, ago = 1, over: Record<string, unknown> = {}) {
  const fields = {
    kind: "access",
    channel: "email",
    requester_name: "RLS Person",
    summary: "RLS request",
    received_on: await daysAgo(tx, ago),
    ...over,
  };
  const cols = Object.keys(fields);
  const { rows } = await tx.as<{ id: string; request_code: string; respond_by: string; received_on: string; status: string; created_by: string }>(
    actor,
    `INSERT INTO public.rights_requests (organization_id, ${cols.join(", ")}) VALUES ($1, ${cols.map((_, i) => `$${i + 2}`).join(", ")})
     RETURNING id, request_code, to_char(respond_by, 'YYYY-MM-DD') AS respond_by, to_char(received_on, 'YYYY-MM-DD') AS received_on, status, created_by`,
    [org, ...Object.values(fields)],
  );
  return rows[0]!;
}

const row = async (tx: Tx, id: string) =>
  (await tx.asAdmin<Record<string, unknown>>("SELECT * FROM public.rights_requests WHERE id = $1", [id])).rows[0]!;

const identify = (tx: Tx, actor: Actor, id: string) =>
  tx.as(actor, "UPDATE public.rights_requests SET identity_verified_on = received_on, identity_method = 'Matched the registered email' WHERE id = $1", [id]);

const respond = (tx: Tx, actor: Actor, id: string, outcome = "fulfilled", summary: string | null = null) =>
  tx.as(actor, "UPDATE public.rights_requests SET status = 'responded', outcome = $2, responded_on = received_on, response_summary = $3 WHERE id = $1", [
    id,
    outcome,
    summary,
  ]);

describe("1. tenancy (gate 5) and permissions", () => {
  it("a member reads their own register; Org B's owner sees none of it; anon is refused outright", async () => {
    await inTransaction(client, async (tx) => {
      const mine = await tx.as(dean(), "SELECT id FROM public.rights_requests WHERE organization_id = $1", [ORG_A]);
      expect(mine.rows.map((r) => r.id)).toEqual(expect.arrayContaining([ACCESS.id, GRIEVANCE.id]));
      const theirs = await tx.as(bmlOwner(), "SELECT id FROM public.rights_requests WHERE organization_id = $1", [ORG_A]);
      expect(theirs.rowCount).toBe(0);
      await expect(tx.as(null, "SELECT id FROM public.rights_requests")).rejects.toMatchObject({ code: "42501" });
      await expect(
        tx.as(null, "INSERT INTO public.rights_requests (organization_id, kind, channel, requester_name, summary, received_on) VALUES ($1, 'access', 'web_form', 'x', 'x', current_date)", [ORG_A]),
      ).rejects.toMatchObject({ code: "42501" });
    });
  });

  it("anon holds no privilege on the table, and cannot call the action door", async () => {
    await inTransaction(client, async (tx) => {
      const grants = await tx.asAdmin(
        "SELECT privilege_type FROM information_schema.role_table_grants WHERE table_schema = 'public' AND table_name = 'rights_requests' AND grantee = 'anon'",
      );
      expect(grants.rowCount).toBe(0);
      await expect(tx.as(null, "SELECT public.add_rights_action($1, $2, 'x', NULL, NULL)", [ORG_A, ACCESS.id])).rejects.toMatchObject({ code: "42501" });
    });
  });

  it("Org A cannot record into Org B, update Org B's request, or reach Org B's actions", async () => {
    await inTransaction(client, async (tx) => {
      const b = await record(tx, bmlOwner(), ORG_B);
      // The trigger's second lock answers before RLS's WITH CHECK, with a message.
      await expect(record(tx, legal(), ORG_B)).rejects.toMatchObject({ code: "TS403" });
      const hijack = await tx.as(legal(), "UPDATE public.rights_requests SET summary = 'Hijacked' WHERE id = $1", [b.id]);
      expect(hijack.rowCount).toBe(0);
      await expect(tx.as(legal(), "SELECT public.add_rights_action($1, $2, 'Hijack', NULL, NULL)", [ORG_B, b.id])).rejects.toMatchObject({ code: "TS403" });
      // …and an Org A path with Org B's request id is simply not found.
      await expect(tx.as(legal(), "SELECT public.add_rights_action($1, $2, 'Hijack', NULL, NULL)", [ORG_A, b.id])).rejects.toMatchObject({ code: "TS404" });
      expect((await row(tx, b.id)).summary).toBe("RLS request");
    });
  });

  it("composite FKs: no action, and no grievance, can point at another tenant's request — even from tooling", async () => {
    await inTransaction(client, async (tx) => {
      const b = await record(tx, bmlOwner(), ORG_B);
      await expect(
        tx.asAdmin("INSERT INTO public.gap_actions (organization_id, rights_request_id, title) VALUES ($1, $2, 'x')", [ORG_A, b.id]),
      ).rejects.toMatchObject({ code: "23503" });
      await expect(record(tx, legal(), ORG_A, 1, { kind: "grievance", related_request_id: b.id })).rejects.toMatchObject({ code: "23503" });
    });
  });

  it("reading needs rights.read; writing needs rights.write (the executive sponsor reads only)", async () => {
    await inTransaction(client, async (tx) => {
      await expect(record(tx, dean(), ORG_A)).rejects.toMatchObject({ code: "TS403" });
      const upd = await tx.as(dean(), "UPDATE public.rights_requests SET summary = 'x' WHERE id = $1", [ACCESS.id]);
      expect(upd.rowCount).toBe(0);
      const revoked = await tx.asAdmin(
        `DELETE FROM public.role_permissions rp USING public.roles r, public.permissions p
         WHERE rp.role_id = r.id AND rp.permission_id = p.id AND r.code = 'executive_sponsor' AND p.code = 'rights.read'`,
      );
      expect(revoked.rowCount).toBe(1);
      expect((await tx.as(dean(), "SELECT id FROM public.rights_requests")).rowCount).toBe(0);
    });
  });
});

describe("2. derived, never forged", () => {
  it("the database assigns the code (DPR for a right, GRV for a grievance, per organisation) and respond-by = receipt + 90 days", async () => {
    await inTransaction(client, async (tx) => {
      const a = await record(tx, legal(), ORG_A, 1, { received_on: "2026-10-01" });
      expect(a.request_code).toMatch(/^DPR-2026-\d{3}$/);
      expect(a.respond_by).toBe("2026-12-30");
      expect(a.status).toBe("open");
      expect(a.created_by).toBe(SEED_USERS.muLegal.id);
      const next = await record(tx, legal(), ORG_A, 1, { received_on: "2026-10-02" });
      expect(Number(next.request_code.slice(-3))).toBe(Number(a.request_code.slice(-3)) + 1);
      // A grievance has its own sequence: MU's seeded one is GRV-2026-001.
      expect((await record(tx, legal(), ORG_A, 1, { kind: "grievance", received_on: "2026-10-01" })).request_code).toBe("GRV-2026-002");
      // Per organisation: Org B's first request of the year is 001 whatever Org A has.
      expect((await record(tx, bmlOwner(), ORG_B, 1, { received_on: "2026-10-01" })).request_code).toBe("DPR-2026-001");
    });
  });

  it("no user may write the code, the respond-by date, the status on insert, or any stamp", async () => {
    await inTransaction(client, async (tx) => {
      for (const forged of [
        { request_code: "DPR-2026-999" },
        { respond_by: "2030-01-01" },
        { status: "responded" },
        { identity_recorded_by: SEED_USERS.muDean.id },
        { response_recorded_at: "2026-10-01T00:00:00Z" },
        { created_by: SEED_USERS.muDean.id },
        { closed_at: "2026-10-01T00:00:00Z" },
      ]) {
        await expect(record(tx, legal(), ORG_A, 1, forged), JSON.stringify(forged)).rejects.toMatchObject({ code: "42501" });
      }
    });
  });

  it("when it was received cannot be edited — the clock does not move", async () => {
    await inTransaction(client, async (tx) => {
      const r = await record(tx, legal(), ORG_A, 100);
      await expect(tx.as(legal(), "UPDATE public.rights_requests SET received_on = current_date WHERE id = $1", [r.id])).rejects.toMatchObject({ code: "42501" });
      await expect(
        tx.as(legal(), "UPDATE public.rights_requests SET respond_by = current_date + 365 WHERE id = $1", [r.id]),
      ).rejects.toMatchObject({ code: "42501" });
    });
  });

  it("tooling that forges a respond-by date is refused by the CHECK; the trigger re-derives it anyway", async () => {
    await inTransaction(client, async (tx) => {
      const r = await record(tx, legal(), ORG_A, 1);
      await tx.asAdmin("UPDATE public.rights_requests SET respond_by = respond_by + 365 WHERE id = $1", [r.id]);
      expect((await tx.asAdmin<{ d: string }>("SELECT to_char(respond_by, 'YYYY-MM-DD') AS d FROM public.rights_requests WHERE id = $1", [r.id])).rows[0]!.d).toBe(
        r.respond_by,
      );
      await tx.asAdmin("ALTER TABLE public.rights_requests DISABLE TRIGGER rights_requests_before_write");
      await expect(tx.asAdmin("UPDATE public.rights_requests SET respond_by = respond_by + 365 WHERE id = $1", [r.id])).rejects.toMatchObject({
        code: "23514",
      });
    });
  });

  it("nothing received before the Act, or in the future; a nomination names its nominee and nothing else does", async () => {
    await inTransaction(client, async (tx) => {
      await expect(record(tx, legal(), ORG_A, 1, { received_on: "2023-08-10" })).rejects.toMatchObject({ code: "23514" });
      await expect(record(tx, legal(), ORG_A, -2)).rejects.toMatchObject({ code: "TS422" });
      await expect(record(tx, legal(), ORG_A, 1, { kind: "nomination" })).rejects.toMatchObject({ code: "23514" });
      await expect(record(tx, legal(), ORG_A, 1, { nominee_name: "Someone" })).rejects.toMatchObject({ code: "23514" });
      const n = await record(tx, legal(), ORG_A, 1, { kind: "nomination", nominee_name: "A Nominee", nominee_relationship: "Sister" });
      expect(n.request_code).toMatch(/^DPR-/);
    });
  });

  it("the owner is an active member of this organisation", async () => {
    await inTransaction(client, async (tx) => {
      await expect(record(tx, legal(), ORG_A, 1, { owner_user_id: SEED_USERS.bmlAdmin.id })).rejects.toMatchObject({ code: "TS422" });
      const r = await record(tx, legal(), ORG_A, 1, { owner_user_id: SEED_USERS.muLegal.id });
      await expect(
        tx.as(legal(), "UPDATE public.rights_requests SET owner_user_id = $2 WHERE id = $1", [r.id, SEED_USERS.bmlAdmin.id]),
      ).rejects.toMatchObject({ code: "TS422" });
    });
  });
});

describe("3. the identity check and the response — stamped, and in order", () => {
  it("records who verified identity and who recorded the response, and when", async () => {
    await inTransaction(client, async (tx) => {
      const r = await record(tx, legal(), ORG_A, 10);
      await identify(tx, legal(), r.id);
      await respond(tx, registrar(), r.id);
      const after = await row(tx, r.id);
      expect(after.identity_recorded_by).toBe(SEED_USERS.muLegal.id);
      expect(after.response_recorded_by).toBe(SEED_USERS.mumbaiUniversity.id);
      expect(after.closed_by).toBe(SEED_USERS.mumbaiUniversity.id);
      expect(after.status).toBe("responded");
      expect(after.updated_by).toBe(SEED_USERS.mumbaiUniversity.id);
    });
  });

  it("a recorded identity check can be corrected but never removed", async () => {
    await inTransaction(client, async (tx) => {
      const r = await record(tx, legal(), ORG_A, 10);
      await identify(tx, legal(), r.id);
      await tx.as(legal(), "UPDATE public.rights_requests SET identity_method = 'Matched the enrolment number' WHERE id = $1", [r.id]);
      await expect(
        tx.as(legal(), "UPDATE public.rights_requests SET identity_verified_on = NULL, identity_method = NULL WHERE id = $1", [r.id]),
      ).rejects.toMatchObject({ code: "TS409" });
    });
  });

  it("fulfilling a request needs the person identified; declining it, or resolving a grievance, does not", async () => {
    await inTransaction(client, async (tx) => {
      const r = await record(tx, legal(), ORG_A, 10, { kind: "erasure" });
      await expect(respond(tx, legal(), r.id)).rejects.toMatchObject({ code: "TS409" });
      await expect(respond(tx, legal(), r.id, "partly_fulfilled", "Erased from two of three systems")).rejects.toMatchObject({ code: "TS409" });
      await respond(tx, legal(), r.id, "declined", "Could not verify identity after two attempts");
      const g = await record(tx, legal(), ORG_A, 10, { kind: "grievance" });
      await respond(tx, legal(), g.id);
      expect((await row(tx, g.id)).outcome).toBe("fulfilled");
    });
  });

  it("anything short of fulfilled says why; a response needs its outcome and day; nothing dated before receipt or in the future", async () => {
    await inTransaction(client, async (tx) => {
      const r = await record(tx, legal(), ORG_A, 10);
      await identify(tx, legal(), r.id);
      await expect(respond(tx, legal(), r.id, "declined", null)).rejects.toMatchObject({ code: "23514" });
      await expect(tx.as(legal(), "UPDATE public.rights_requests SET status = 'responded' WHERE id = $1", [r.id])).rejects.toMatchObject({ code: "TS422" });
      await expect(
        tx.as(legal(), "UPDATE public.rights_requests SET status = 'responded', outcome = 'fulfilled', responded_on = received_on - 1 WHERE id = $1", [r.id]),
      ).rejects.toMatchObject({ code: "23514" });
      await expect(
        tx.as(legal(), "UPDATE public.rights_requests SET status = 'responded', outcome = 'fulfilled', responded_on = current_date + 3 WHERE id = $1", [r.id]),
      ).rejects.toMatchObject({ code: "TS422" });
      await expect(
        tx.as(legal(), "UPDATE public.rights_requests SET identity_verified_on = received_on - 1 WHERE id = $1", [r.id]),
      ).rejects.toMatchObject({ code: "23514" });
    });
  });
});

describe("4. the lifecycle", () => {
  it("a responded request is locked until reopened; reopening withdraws the response but keeps the identity check", async () => {
    await inTransaction(client, async (tx) => {
      const r = await record(tx, legal(), ORG_A, 10);
      await identify(tx, legal(), r.id);
      await respond(tx, legal(), r.id);
      await expect(tx.as(legal(), "UPDATE public.rights_requests SET summary = 'Edited' WHERE id = $1", [r.id])).rejects.toMatchObject({ code: "TS409" });
      await expect(
        tx.as(legal(), "UPDATE public.rights_requests SET status = 'void', closure_reason = 'x' WHERE id = $1", [r.id]),
      ).rejects.toMatchObject({ code: "TS409" });
      await tx.as(legal(), "UPDATE public.rights_requests SET status = 'open' WHERE id = $1", [r.id]);
      const reopened = await row(tx, r.id);
      expect(reopened).toMatchObject({ status: "open", outcome: null, responded_on: null, response_recorded_at: null, closed_at: null });
      expect(reopened.identity_verified_on).not.toBeNull();
    });
  });

  it("withdrawn and void carry their reason; reopening clears it", async () => {
    await inTransaction(client, async (tx) => {
      const r = await record(tx, legal(), ORG_A, 10);
      await expect(tx.as(legal(), "UPDATE public.rights_requests SET status = 'withdrawn' WHERE id = $1", [r.id])).rejects.toMatchObject({ code: "23514" });
      await tx.as(legal(), "UPDATE public.rights_requests SET status = 'void', closure_reason = 'Duplicate of an email already recorded' WHERE id = $1", [r.id]);
      await expect(tx.as(legal(), "UPDATE public.rights_requests SET summary = 'x' WHERE id = $1", [r.id])).rejects.toMatchObject({ code: "TS409" });
      await tx.as(legal(), "UPDATE public.rights_requests SET status = 'open' WHERE id = $1", [r.id]);
      expect((await row(tx, r.id)).closure_reason).toBeNull();
    });
  });

  it("a request changes kind within its family, never across it — the code names it", async () => {
    await inTransaction(client, async (tx) => {
      const r = await record(tx, legal(), ORG_A, 10, { kind: "correction" });
      await tx.as(legal(), "UPDATE public.rights_requests SET kind = 'updating' WHERE id = $1", [r.id]);
      await expect(tx.as(legal(), "UPDATE public.rights_requests SET kind = 'grievance' WHERE id = $1", [r.id])).rejects.toMatchObject({ code: "TS422" });
    });
  });

  it("nothing is ever deleted — there is no DELETE grant", async () => {
    await inTransaction(client, async (tx) => {
      await expect(tx.as(registrar(), "DELETE FROM public.rights_requests WHERE id = $1", [ACCESS.id])).rejects.toMatchObject({ code: "42501" });
    });
  });
});

describe("5. remediation on the ONE action table", () => {
  it("add_rights_action creates an action with exactly one parent, audited, without a user INSERT grant", async () => {
    await inTransaction(client, async (tx) => {
      const r = await record(tx, legal(), ORG_A, 10, { kind: "erasure" });
      await expect(
        tx.as(legal(), "INSERT INTO public.gap_actions (organization_id, rights_request_id, title) VALUES ($1, $2, 'x')", [ORG_A, r.id]),
      ).rejects.toMatchObject({ code: "42501" });
      const { rows } = await tx.as<{ id: string }>(legal(), "SELECT public.add_rights_action($1, $2, '  Erase from the alumni mailer  ', $3, '2026-12-01') AS id", [
        ORG_A,
        r.id,
        SEED_USERS.muLegal.id,
      ]);
      const action = (await tx.asAdmin("SELECT * FROM public.gap_actions WHERE id = $1", [rows[0]!.id])).rows[0]!;
      expect(action).toMatchObject({ title: "Erase from the alumni mailer", status: "open", gap_id: null, ropa_gap_id: null, breach_incident_id: null, rights_request_id: r.id });
      const audit = await tx.asAdmin("SELECT metadata FROM public.audit_logs WHERE event_type = 'rights.action.created' AND entity_id = $1", [rows[0]!.id]);
      expect(audit.rows).toHaveLength(1);
      expect(JSON.stringify(audit.rows[0]!.metadata)).not.toContain("alumni");
      await expect(
        tx.asAdmin("UPDATE public.gap_actions SET breach_incident_id = gen_random_uuid() WHERE id = $1", [rows[0]!.id]),
      ).rejects.toMatchObject({ code: "TS422" });
    });
  });

  it("the one-parent CHECK now counts four parents", async () => {
    await inTransaction(client, async (tx) => {
      const r = await record(tx, legal(), ORG_A, 10);
      const gap = (await tx.asAdmin<{ id: string }>("SELECT id FROM public.assessment_gaps WHERE organization_id = $1 LIMIT 1", [ORG_A])).rows[0]!;
      await expect(
        tx.asAdmin("INSERT INTO public.gap_actions (organization_id, gap_id, rights_request_id, title) VALUES ($1, $2, $3, 'x')", [ORG_A, gap.id, r.id]),
      ).rejects.toMatchObject({ code: "23514" });
    });
  });

  it("needs rights.write AND gap.write; refuses a void request, a non-member owner and a blank title", async () => {
    await inTransaction(client, async (tx) => {
      const r = await record(tx, legal(), ORG_A, 10);
      await expect(tx.as(dean(), "SELECT public.add_rights_action($1, $2, 'x', NULL, NULL)", [ORG_A, r.id])).rejects.toMatchObject({ code: "TS403" });
      await expect(tx.as(legal(), "SELECT public.add_rights_action($1, $2, '   ', NULL, NULL)", [ORG_A, r.id])).rejects.toMatchObject({ code: "TS422" });
      await expect(
        tx.as(legal(), "SELECT public.add_rights_action($1, $2, 'x', $3, NULL)", [ORG_A, r.id, SEED_USERS.bmlAdmin.id]),
      ).rejects.toMatchObject({ code: "TS422" });
      await tx.as(legal(), "UPDATE public.rights_requests SET status = 'void', closure_reason = 'Entered twice' WHERE id = $1", [r.id]);
      await expect(tx.as(legal(), "SELECT public.add_rights_action($1, $2, 'x', NULL, NULL)", [ORG_A, r.id])).rejects.toMatchObject({ code: "TS409" });
    });
  });

  it("a request's action closes under D-056: the owner cannot approve their own; a reviewer who is not the owner can", async () => {
    await inTransaction(client, async (tx) => {
      const action = GRIEVANCE.action.id; // owned by the examinations department owner
      const owner = u(SEED_USERS.muDepartmentOwner.id);
      await expect(tx.as(owner, "UPDATE public.gap_actions SET status = 'closed' WHERE id = $1", [action])).rejects.toMatchObject({ code: "TS409" });
      await tx.as(registrar(), "UPDATE public.gap_actions SET status = 'closed' WHERE id = $1", [action]);
      const closed = (await tx.asAdmin("SELECT closure_basis, closed_by FROM public.gap_actions WHERE id = $1", [action])).rows[0]!;
      expect(closed).toEqual({ closure_basis: "reviewer_approval", closed_by: SEED_USERS.mumbaiUniversity.id });
    });
  });
});

describe("6. audit and the 1.2.0 snapshot", () => {
  it("every user write is audited by trigger — code, kind, status and dates; never the person, the request or the response", async () => {
    await inTransaction(client, async (tx) => {
      const r = await record(tx, legal(), ORG_A, 10, {
        requester_name: "Secret Person",
        requester_email: "secret.person@example.com",
        principal_identifier: "SECRET-ID-1",
        summary: "Secret request",
      });
      await identify(tx, legal(), r.id);
      await respond(tx, legal(), r.id, "partly_fulfilled", "Secret response");
      const { rows } = await tx.asAdmin<{ event_type: string; metadata: Record<string, unknown> }>(
        "SELECT event_type, metadata FROM public.audit_logs WHERE entity_id = $1 ORDER BY created_at, event_type",
        [r.id],
      );
      expect(rows.map((x) => x.event_type)).toEqual(["rights.rights_requests.insert", "rights.rights_requests.update", "rights.rights_requests.update"]);
      expect(rows[0]!.metadata).toMatchObject({ requestCode: r.request_code, rightsKind: "access", rightsStatus: "open", receivedOn: r.received_on });
      expect(rows[1]!.metadata.changed).toEqual(["identity_method", "identity_verified_on"]);
      expect(rows[2]!.metadata).toMatchObject({ rightsStatus: "responded", outcome: "partly_fulfilled" });
      // The stamps are never reported as edits.
      expect(rows[2]!.metadata.changed).toEqual(["closed_at", "outcome", "responded_on", "response_summary", "status"]);
      const text = JSON.stringify(rows);
      for (const secret of ["Secret Person", "secret.person", "SECRET-ID-1", "Secret request", "Secret response"]) expect(text).not.toContain(secret);
    });
  });

  it("a snapshot is recorded under the current model (1.2.0 brought the rights rows) and reads the register: a request open past ninety days sets head 7 Exposed", async () => {
    await inTransaction(client, async (tx) => {
      const input = (await tx.asAdmin<{ input: { rights: { kind: string; status: string; receivedOn: string }[] } }>(
        "SELECT (app.exposure_input($1, current_date)) -> 'input' AS input",
        [ORG_A],
      )).rows[0]!.input;
      // The seeded requests are read as raw facts — no personal data reaches the model.
      expect(input.rights).toContainEqual({ kind: "access", status: "responded", receivedOn: ACCESS.receivedOn });
      expect(JSON.stringify(input.rights)).not.toContain("seed");

      await record(tx, legal(), ORG_A, 91, { kind: "grievance" });
      const { rows } = await tx.as<{ id: string }>(registrar(), "SELECT public.record_exposure_snapshot($1) AS id", [ORG_A]);
      const snap = (await tx.asAdmin<{ model_version: string; heads: { code: string; status: string; reasons: { text: string }[] }[] }>(
        "SELECT model_version, heads FROM public.exposure_snapshots WHERE id = $1",
        [rows[0]!.id],
      )).rows[0]!;
      expect(snap.model_version).toBe("1.7.0");
      const h7 = snap.heads.find((h) => h.code === "H7")!;
      expect(h7.status).toBe("exposed");
      expect(h7.reasons.map((x) => x.text).join(" ")).toMatch(/open for more than ninety days since (it was|they were) received \(Rule 14\(3\)\)/);
    });
  });

  it("day 90 is in time; a request past only TrustStack's target never sets a status", async () => {
    await inTransaction(client, async (tx) => {
      // Org B is a clean slate: its H7 before and after a request on day 90 and one on day 31.
      const before = await tx.asAdmin<{ h: { status: string } }>(
        "SELECT h AS h FROM jsonb_array_elements((SELECT app.exposure_evaluate((app.exposure_input($1, (now() AT TIME ZONE 'Asia/Kolkata')::date)) -> 'input')) -> 'heads') h WHERE h ->> 'code' = 'H7'",
        [ORG_B],
      );
      await record(tx, bmlOwner(), ORG_B, 90);
      await record(tx, bmlOwner(), ORG_B, 31, { kind: "grievance" });
      const after = await tx.asAdmin<{ h: { status: string; reasons: { text: string }[] } }>(
        "SELECT h AS h FROM jsonb_array_elements((SELECT app.exposure_evaluate((app.exposure_input($1, (now() AT TIME ZONE 'Asia/Kolkata')::date)) -> 'input')) -> 'heads') h WHERE h ->> 'code' = 'H7'",
        [ORG_B],
      );
      expect(after.rows[0]!.h.status).toBe(before.rows[0]!.h.status);
      expect(after.rows[0]!.h.status).not.toBe("exposed");
    });
  });

  it("Org B's input carries none of Org A's requests", async () => {
    await inTransaction(client, async (tx) => {
      const input = (await tx.asAdmin<{ input: { rights: unknown[] } }>("SELECT (app.exposure_input($1, current_date)) -> 'input' AS input", [ORG_B])).rows[0]!.input;
      expect(input.rights).toEqual([]);
    });
  });
});
