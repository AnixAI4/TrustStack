/**
 * Slice 10, Stage 6 — GATE 5 (RLS) and the database's rules for the evidence
 * index's last two link types and the three stakeholder report kinds
 * (migration 20261018000000_slice10_reports).
 *
 *   1. `breach_incident`: attaching is work on the breach register
 *      (breach.write); never to another tenant's breach; refused on a breach
 *      dismissed as not a breach; detaching refused while the breach is closed
 *      or dismissed — the register's own rule, "reopen it".
 *   2. `rights_request`: the same with rights.write; refused on a void request;
 *      detaching refused once responded, withdrawn or void.
 *   3. Both are audited by the evidence trigger, and an organisation's own
 *      deletion still takes every link with it.
 *   4. The three report kinds are PDFs that record a fresh exposure snapshot,
 *      through the Slice 9 store unchanged.
 *
 * Every test runs inside a transaction that is rolled back.
 */
import { randomUUID } from "node:crypto";
import { SEED_BREACHES, SEED_ORGS, SEED_RIGHTS_REQUESTS, SEED_USERS } from "@truststack/db/seed-data";
import type pg from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { authSubjects, connect, inTransaction, type Tx } from "./db";

const ORG_A = SEED_ORGS.mumbaiUniversity.id;
const ORG_B = SEED_ORGS.bharatManufacturing.id;
const CLOSED_BREACH = SEED_BREACHES.examMarksLink; // closed in the seed
const RESPONDED = SEED_RIGHTS_REQUESTS.marksAccess; // responded in the seed

let client: pg.Client;
let who: Map<string, { sub: string; email: string }>;
const u = (id: string) => who.get(id)!;
const ciso = () => u(SEED_USERS.muItSecurity.id); // contributor: breach.write, evidence.write
const legal = () => u(SEED_USERS.muLegal.id); // contributor: rights.write, evidence.write
const dean = () => u(SEED_USERS.muDean.id); // executive sponsor: reads only
const registrar = () => u(SEED_USERS.mumbaiUniversity.id); // dpdp_owner: every write, report.generate, score.calculate
const bmlOwner = () => u(SEED_USERS.bharatManufacturing.id);
type Actor = { sub: string; email: string };

beforeAll(async () => {
  client = await connect();
  who = await authSubjects(client, Object.values(SEED_USERS).map((x) => x.id));
});
afterAll(async () => {
  await client?.end();
});

/** A stored artefact (tooling): the row and its object, as an upload leaves them. */
async function stored(tx: Tx, org: string = ORG_A): Promise<string> {
  const id = randomUUID();
  const path = `organizations/${org}/evidence/${id}/intimation.pdf`;
  await tx.asAdmin("INSERT INTO storage.objects (bucket_id, name) VALUES ('evidence', $1)", [path]);
  await tx.asAdmin(
    "INSERT INTO public.evidence (id, organization_id, storage_path, file_name, content_type, byte_size, uploaded_by) VALUES ($1, $2, $3, 'intimation.pdf', 'application/pdf', 1024, $4)",
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

const unlink = (tx: Tx, actor: Actor, evidenceId: string, type: string) =>
  tx.as(actor, "DELETE FROM public.evidence_links WHERE evidence_id = $1 AND linked_entity_type = $2", [evidenceId, type]);

/** An open breach recorded `hoursAgo` hours ago. */
async function breach(tx: Tx, actor: Actor, org: string = ORG_A, hoursAgo = 2): Promise<string> {
  const { rows } = await tx.as<{ id: string }>(
    actor,
    "INSERT INTO public.breach_incidents (organization_id, title, nature, severity, aware_at) VALUES ($1, 'RLS breach', 'unauthorised_access', 'high', $2) RETURNING id",
    [org, new Date(Date.now() - hoursAgo * 3_600_000).toISOString()],
  );
  return rows[0]!.id;
}

/** An open request received yesterday. */
async function request(tx: Tx, actor: Actor, org: string = ORG_A): Promise<string> {
  const { rows } = await tx.as<{ id: string }>(
    actor,
    `INSERT INTO public.rights_requests (organization_id, kind, channel, requester_name, summary, received_on)
     VALUES ($1, 'access', 'email', 'RLS Person', 'RLS request', ((now() AT TIME ZONE 'Asia/Kolkata')::date - 1)) RETURNING id`,
    [org],
  );
  return rows[0]!.id;
}

describe("1. a document on a breach (`breach_incident`)", () => {
  it("is work on the register: the CISO may attach; the executive sponsor (no write of any kind) may not", async () => {
    await inTransaction(client, async (tx) => {
      const b = await breach(tx, ciso());
      expect((await link(tx, ciso(), await stored(tx), "breach_incident", b)).rowCount).toBe(1);
      await expect(link(tx, dean(), await stored(tx), "breach_incident", b)).rejects.toBeTruthy();
    });
  });

  it("never to another tenant's breach, and Org B never sees Org A's link", async () => {
    await inTransaction(client, async (tx) => {
      const foreign = await breach(tx, bmlOwner(), ORG_B);
      await expect(link(tx, ciso(), await stored(tx), "breach_incident", foreign)).rejects.toMatchObject({ code: "TS404" });
      const e = await stored(tx);
      await link(tx, ciso(), e, "breach_incident", await breach(tx, ciso()));
      const seen = await tx.as(bmlOwner(), "SELECT 1 FROM public.evidence_links WHERE evidence_id = $1", [e]);
      expect(seen.rowCount).toBe(0);
    });
  });

  it("refused on a breach dismissed as not a breach; detaching refused while closed or dismissed", async () => {
    await inTransaction(client, async (tx) => {
      const b = await breach(tx, ciso());
      const e = await stored(tx);
      await link(tx, ciso(), e, "breach_incident", b);
      await tx.as(ciso(), "UPDATE public.breach_incidents SET status = 'dismissed', dismissal_reason = 'A test record' WHERE id = $1", [b]);
      await expect(link(tx, ciso(), await stored(tx), "breach_incident", b)).rejects.toMatchObject({ code: "TS409" });
      await expect(unlink(tx, ciso(), e, "breach_incident")).rejects.toMatchObject({ code: "TS409" });

      // The seeded breach is closed: a late document may be attached, never detached.
      const late = await stored(tx);
      expect((await link(tx, ciso(), late, "breach_incident", CLOSED_BREACH.id)).rowCount).toBe(1);
      await expect(unlink(tx, ciso(), late, "breach_incident")).rejects.toMatchObject({ code: "TS409" });
    });
  });

  it("an open breach's document may be detached; the artefact stays", async () => {
    await inTransaction(client, async (tx) => {
      const e = await stored(tx);
      await link(tx, ciso(), e, "breach_incident", await breach(tx, ciso()));
      expect((await unlink(tx, ciso(), e, "breach_incident")).rowCount).toBe(1);
      expect((await tx.asAdmin("SELECT 1 FROM public.evidence WHERE id = $1", [e])).rowCount).toBe(1);
    });
  });
});

describe("2. a document on a request (`rights_request`)", () => {
  it("is work on the register: Legal may attach; the executive sponsor may not", async () => {
    await inTransaction(client, async (tx) => {
      const r = await request(tx, legal());
      expect((await link(tx, legal(), await stored(tx), "rights_request", r)).rowCount).toBe(1);
      await expect(link(tx, dean(), await stored(tx), "rights_request", r)).rejects.toBeTruthy();
    });
  });

  it("never to another tenant's request", async () => {
    await inTransaction(client, async (tx) => {
      const foreign = await request(tx, bmlOwner(), ORG_B);
      await expect(link(tx, legal(), await stored(tx), "rights_request", foreign)).rejects.toMatchObject({ code: "TS404" });
    });
  });

  it("refused on a void request; the response sent may be attached once responded, and then stays", async () => {
    await inTransaction(client, async (tx) => {
      const r = await request(tx, legal());
      const e = await stored(tx);
      await link(tx, legal(), e, "rights_request", r);
      expect((await unlink(tx, legal(), e, "rights_request")).rowCount).toBe(1);
      await tx.as(legal(), "UPDATE public.rights_requests SET status = 'void', closure_reason = 'Entered in error' WHERE id = $1", [r]);
      await expect(link(tx, legal(), await stored(tx), "rights_request", r)).rejects.toMatchObject({ code: "TS409" });

      const sent = await stored(tx);
      expect((await link(tx, legal(), sent, "rights_request", RESPONDED.id)).rowCount).toBe(1);
      await expect(unlink(tx, legal(), sent, "rights_request")).rejects.toMatchObject({ code: "TS409" });
    });
  });
});

describe("3. audit, and an organisation's deletion", () => {
  it("each link is audited by the evidence trigger, as the person", async () => {
    await inTransaction(client, async (tx) => {
      const e = await stored(tx);
      const linked = await tx.as<{ id: string }>(
        ciso(),
        "INSERT INTO public.evidence_links (organization_id, evidence_id, linked_entity_type, linked_entity_id) VALUES ($1, $2, 'breach_incident', $3) RETURNING id",
        [ORG_A, e, await breach(tx, ciso())],
      );
      const { rows } = await tx.asAdmin<{ event_type: string; user_id: string }>("SELECT event_type, user_id FROM public.audit_logs WHERE entity_id = $1", [
        linked.rows[0]!.id,
      ]);
      expect(rows).toEqual([{ event_type: "evidence.evidence_links.insert", user_id: SEED_USERS.muItSecurity.id }]);
    });
  });

  it("a dismissed breach's document (which no user may detach) does not block its organisation's deletion", async () => {
    await inTransaction(client, async (tx) => {
      const org = randomUUID();
      await tx.asAdmin("INSERT INTO public.organizations (id, name, organization_type, industry_code) VALUES ($1, 'RLS disposable', 'company', 'general')", [org]);
      const { rows } = await tx.asAdmin<{ id: string }>(
        "INSERT INTO public.breach_incidents (organization_id, title, nature, severity, aware_at) VALUES ($1, 'x', 'other', 'low', now() - interval '3 hours') RETURNING id",
        [org],
      );
      const e = await stored(tx, org);
      await tx.asAdmin("INSERT INTO public.evidence_links (organization_id, evidence_id, linked_entity_type, linked_entity_id) VALUES ($1, $2, 'breach_incident', $3)", [
        org,
        e,
        rows[0]!.id,
      ]);
      await tx.asAdmin("UPDATE public.breach_incidents SET status = 'dismissed', dismissal_reason = 'Not personal data' WHERE id = $1", [rows[0]!.id]);
      await tx.asAdmin("DELETE FROM public.organizations WHERE id = $1", [org]);
      expect((await tx.asAdmin("SELECT 1 FROM public.evidence_links WHERE organization_id = $1", [org])).rowCount).toBe(0);
    });
  });
});

describe("4. the three stakeholder report kinds", () => {
  it("each begins as a PDF that records a fresh exposure snapshot; no other format is admitted", async () => {
    await inTransaction(client, async (tx) => {
      for (const [kind, slug] of [
        ["security_breach", "Security_and_Breach_Report"],
        ["legal_position", "Legal_Position_Report"],
        ["processor_exposure", "Processor_Exposure_Report"],
      ] as const) {
        const { rows } = await tx.as<{ r: { fileName: string; exposureSnapshotId: string | null } }>(
          registrar(),
          "SELECT public.begin_report($1, $2, 'pdf') AS r",
          [ORG_A, kind],
        );
        expect(rows[0]!.r.fileName).toMatch(new RegExp(`^TrustStack_${slug}_v\\d+_\\d{4}-\\d{2}-\\d{2}\\.pdf$`));
        expect(rows[0]!.r.exposureSnapshotId).not.toBeNull();
        await expect(tx.as(registrar(), "SELECT public.begin_report($1, $2, 'xlsx')", [ORG_A, kind])).rejects.toMatchObject({ code: "TS422" });
      }
    });
  });

  it("generating one needs report.generate: the executive sponsor may not", async () => {
    await inTransaction(client, async (tx) => {
      await expect(tx.as(dean(), "SELECT public.begin_report($1, 'legal_position', 'pdf')", [ORG_A])).rejects.toMatchObject({ code: "TS403" });
      await expect(tx.as(bmlOwner(), "SELECT public.begin_report($1, 'security_breach', 'pdf')", [ORG_A])).rejects.toMatchObject({ code: "TS403" });
    });
  });
});
