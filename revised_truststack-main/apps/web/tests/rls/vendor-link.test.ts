/**
 * Slice 10, Stage 4b — GATE 5 (RLS) and the database's rules for the
 * vendor-facing questionnaire link (migration 20261016000000_vendor_link).
 *
 *   1. Grants: the seven public functions are the server's (`service_role`)
 *      only; send and revoke check the caller; members read who a link went to
 *      and never a hash; Org B reads none of Org A's; nobody writes a table.
 *   2. Sending and revoking: vendor.assess, a draft or returned assessment,
 *      one open link at a time, the source follows the link; one writer — staff
 *      may not save or submit while the vendor's link is open.
 *   3. The respondent's steps: the same "not found" for every dead link; the
 *      code (limits, wrong codes, the lock); the session; answers attributed to
 *      nobody in the organisation; a document on file kept; only their own
 *      documents cited.
 *   4. Their documents: registered by the database, pending review, at most ten,
 *      attached only once stored; the evidence rule reads them.
 *   5. Submission: complete, declared, stamped; the link is used up.
 *   6. The second person (D-092): whoever sent the link may not review — even
 *      having answered nothing; nor may the creator; a third person may.
 *   7. Audit: the respondent's steps are `user_id NULL`, "by the vendor's
 *      respondent", never their name or email.
 *   8. Tenancy of the link itself: a token and a session open one link only.
 *
 * Every test runs inside a transaction that is rolled back.
 */
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { SCORED_VENDOR_QUESTIONS, VENDOR_QUESTIONS } from "@truststack/core";
import { SEED_ORGS, SEED_USERS } from "@truststack/db/seed-data";
import type pg from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { authSubjects, connect, inTransaction, type Tx } from "./db";

const ORG_A: string = SEED_ORGS.mumbaiUniversity.id;
const ORG_B: string = SEED_ORGS.bharatManufacturing.id;

let client: pg.Client;
let who: Map<string, { sub: string; email: string }>;
const u = (id: string) => who.get(id)!;
const ciso = () => u(SEED_USERS.muItSecurity.id); // vendor.assess, NOT vendor.review
const legal = () => u(SEED_USERS.muLegal.id); // vendor.assess + vendor.review
const registrar = () => u(SEED_USERS.mumbaiUniversity.id); // dpdp_owner: both
const admin = () => u(SEED_USERS.muAdmin.id); // organization_admin: both
const dean = () => u(SEED_USERS.muDean.id); // reads only
const bmlOwner = () => u(SEED_USERS.bharatManufacturing.id);
type Actor = { sub: string; email: string };
type Json = Record<string, unknown>;

beforeAll(async () => {
  client = await connect();
  who = await authSubjects(client, Object.values(SEED_USERS).map((x) => x.id));
});
afterAll(async () => {
  await client?.end();
});

const hex = () => randomBytes(32).toString("hex");
const sha = (v: string) => createHash("sha256").update(v).digest("hex");
const RESPONDENT = "respondent.rls@vendor.example.com";

let VENDOR = "";
let VENDOR_B = "";

/** A rolled-back transaction with a fresh MU vendor and a fresh BML vendor. */
const run = (fn: (tx: Tx) => Promise<void>) =>
  inTransaction(client, async (tx) => {
    const a = await tx.asAdmin<{ id: string }>(
      `INSERT INTO public.vendors (organization_id, name, vendor_role, contract_exists, dpdp_clauses, cross_border, sub_processors_known)
       VALUES ($1, 'RLS link vendor', 'data_processor', 'yes', 'yes', 'no', 'yes') RETURNING id`,
      [ORG_A],
    );
    const b = await tx.asAdmin<{ id: string }>(
      `INSERT INTO public.vendors (organization_id, name, vendor_role, contract_exists, dpdp_clauses, cross_border, sub_processors_known)
       VALUES ($1, 'RLS link vendor B', 'data_processor', 'yes', 'yes', 'no', 'yes') RETURNING id`,
      [ORG_B],
    );
    VENDOR = a.rows[0]!.id;
    VENDOR_B = b.rows[0]!.id;
    await fn(tx);
  });

async function start(tx: Tx, actor: Actor, org = ORG_A, vendor = VENDOR) {
  const { rows } = await tx.as<{ r: { id: string } }>(actor, "SELECT public.start_vendor_assessment($1, $2) AS r", [org, vendor]);
  return rows[0]!.r.id;
}

const send = (tx: Tx, actor: Actor, id: string, tokenHash: string, org = ORG_A, email = RESPONDENT) =>
  tx.as<{ r: Json }>(actor, "SELECT public.send_vendor_link($1, $2, $3, $4, $5) AS r", [org, id, "Priya Respondent", email, tokenHash]);
const revoke = (tx: Tx, actor: Actor, id: string, org = ORG_A) => tx.as<{ r: Json }>(actor, "SELECT public.revoke_vendor_link($1, $2) AS r", [org, id]);

type Entry = { code: string; answer?: string | null; notApplicable?: boolean; naReason?: string | null; evidenceId?: string | null };
const staffSave = (tx: Tx, actor: Actor, id: string, answers: Entry[], note: string | null = "The vendor's email of 3 Oct 2026") =>
  tx.as<{ r: Json }>(actor, "SELECT public.save_vendor_assessment($1, $2, $3, $4::jsonb) AS r", [ORG_A, id, note, JSON.stringify(answers)]);
const staffSubmit = (tx: Tx, actor: Actor, id: string) => tx.as<{ r: Json }>(actor, "SELECT public.submit_vendor_assessment($1, $2) AS r", [ORG_A, id]);
const review = (tx: Tx, actor: Actor, id: string, decision: "accept" | "return", reason: string | null = null) =>
  tx.as<{ r: Json }>(actor, "SELECT public.review_vendor_assessment($1, $2, $3, $4, NULL) AS r", [ORG_A, id, decision, reason]);

// The server's calls (service_role), returning the jsonb.
const server = async (tx: Tx, sql: string, params: unknown[]) => (await tx.asServer<{ r: Json }>(`SELECT ${sql} AS r`, params)).rows[0]!.r;
const view = (tx: Tx, token: string, session: string | null = null) => server(tx, "public.vendor_link_view($1, $2)", [token, session]);
const sendCode = (tx: Tx, token: string, code: string) => server(tx, "public.vendor_link_send_code($1, $2, $3)", [token, hex(), code]);
const confirm = (tx: Tx, token: string, code: string, session: string) => server(tx, "public.vendor_link_confirm($1, $2, $3)", [token, code, session]);
const vSave = (tx: Tx, token: string, session: string | null, answers: Entry[]) =>
  server(tx, "public.vendor_link_save($1, $2, $3::jsonb)", [token, session, JSON.stringify(answers)]);
const addDoc = (tx: Tx, token: string, session: string | null, id = randomUUID(), name = "iso-certificate.pdf") =>
  server(tx, "public.vendor_link_add_document($1, $2, $3, $4, 'application/pdf', 2048)", [token, session, id, name]);
const attach = (tx: Tx, token: string, session: string | null, id: string) => server(tx, "public.vendor_link_attach_document($1, $2, $3)", [token, session, id]);
const vSubmit = (tx: Tx, token: string, session: string | null, name: string | null = "Priya Respondent", role: string | null = "Information Security Manager") =>
  server(tx, "public.vendor_link_submit($1, $2, $3, $4)", [token, session, name, role]);

const assessment = async (tx: Tx, id: string) => (await tx.asAdmin<Json>("SELECT * FROM public.vendor_assessments WHERE id = $1", [id])).rows[0]!;
const link = async (tx: Tx, tokenHash: string) =>
  (await tx.asAdmin<Json>("SELECT * FROM public.vendor_assessment_links WHERE token_hash = $1", [tokenHash])).rows[0]!;

/** Started by the CISO and sent by Legal: a link the respondent has confirmed. */
async function opened(tx: Tx, sender: Actor = legal()) {
  const id = await start(tx, ciso());
  const token = hex();
  await send(tx, sender, id, token);
  const code = hex();
  expect(await sendCode(tx, token, code)).toMatchObject({ status: "sent" });
  const session = hex();
  expect(await confirm(tx, token, code, session)).toMatchObject({ status: "confirmed" });
  return { id, token, session };
}

/** Every scored question answered with no risk, as the respondent; documents cited where `docs` names them. */
function complete(docs: Record<string, string> = {}): Entry[] {
  return SCORED_VENDOR_QUESTIONS.map((q) => {
    if (q.type === "select") return { code: q.code, answer: q.options!.find((o) => o.riskTenths === 0)!.value };
    return { code: q.code, answer: q.riskyAnswer === "no" ? "yes" : "no", ...(docs[q.code] ? { evidenceId: docs[q.code] } : {}) };
  });
}

/** A document uploaded through the link: registered, stored (as Storage would), attached. */
async function upload(tx: Tx, token: string, session: string) {
  const id = randomUUID();
  const r = await addDoc(tx, token, session, id);
  expect(r).toMatchObject({ status: "registered" });
  await tx.asAdmin("INSERT INTO storage.objects (bucket_id, name) VALUES ('evidence', $1)", [r.storagePath]);
  expect(await attach(tx, token, session, id)).toEqual({ status: "attached" });
  return id;
}

describe("1. grants: the server's functions, the members' reads, nobody's writes", () => {
  it("the seven public functions are service_role only; send and revoke are signed-in (they check the permission)", async () => {
    await inTransaction(client, async (tx) => {
      const { rows } = await tx.asAdmin<{ p: string; anon: boolean; authed: boolean; server: boolean }>(
        `SELECT p.oid::regprocedure::text AS p,
                has_function_privilege('anon', p.oid, 'EXECUTE') AS anon,
                has_function_privilege('authenticated', p.oid, 'EXECUTE') AS authed,
                has_function_privilege('service_role', p.oid, 'EXECUTE') AS server
         FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
         WHERE n.nspname = 'public' AND (p.proname LIKE 'vendor\\_link\\_%' OR p.proname IN ('send_vendor_link', 'revoke_vendor_link'))
         ORDER BY 1`,
      );
      const byName = Object.fromEntries(rows.map((r) => [r.p.split("(")[0], [r.anon, r.authed, r.server]]));
      expect(Object.keys(byName).sort()).toEqual([
        "revoke_vendor_link",
        "send_vendor_link",
        "vendor_link_add_document",
        "vendor_link_attach_document",
        "vendor_link_confirm",
        "vendor_link_save",
        "vendor_link_send_code",
        "vendor_link_submit",
        "vendor_link_view",
      ]);
      for (const [name, grants] of Object.entries(byName)) {
        expect(grants, name).toEqual(name.startsWith("vendor_link_") ? [false, false, true] : [false, true, true]);
      }
      // A signed-in user calling a public function directly is refused by the grant.
      await expect(tx.as(registrar(), "SELECT public.vendor_link_view($1, NULL)", [hex()])).rejects.toMatchObject({ code: "42501" });
      await expect(tx.as(null, "SELECT public.vendor_link_view($1, NULL)", [hex()])).rejects.toMatchObject({ code: "42501" });
    });
  });

  it("members read who a link went to and never a hash; Org B reads none; nobody writes a link table", async () => {
    await run(async (tx) => {
      const { id, token } = await opened(tx);
      const mine = await tx.as<Json>(dean(), "SELECT respondent_email, created_by FROM public.vendor_assessment_links WHERE assessment_id = $1", [id]);
      expect(mine.rows).toEqual([{ respondent_email: RESPONDENT, created_by: SEED_USERS.muLegal.id }]);
      for (const column of ["token_hash", "code_hash", "session_hash"]) {
        await expect(tx.as(registrar(), `SELECT ${column} FROM public.vendor_assessment_links`)).rejects.toMatchObject({ code: "42501" });
      }
      await expect(tx.as(registrar(), "SELECT * FROM public.vendor_assessment_links")).rejects.toMatchObject({ code: "42501" });
      expect((await tx.as(bmlOwner(), "SELECT id FROM public.vendor_assessment_links")).rowCount).toBe(0);
      expect((await tx.as(bmlOwner(), "SELECT evidence_id FROM public.vendor_link_documents")).rowCount).toBe(0);
      await expect(tx.as(null, "SELECT id FROM public.vendor_assessment_links")).rejects.toMatchObject({ code: "42501" });
      await expect(tx.as(registrar(), "UPDATE public.vendor_assessment_links SET revoked_at = now() WHERE token_hash = $1", [token])).rejects.toMatchObject({
        code: "42501",
      });
      await expect(tx.as(registrar(), "DELETE FROM public.vendor_link_documents")).rejects.toMatchObject({ code: "42501" });
      await expect(
        tx.as(registrar(), "INSERT INTO public.vendor_assessment_links (organization_id, assessment_id, token_hash, respondent_name, respondent_email, expires_at) VALUES ($1, $2, $3, 'x', 'x@y.zz', now())", [
          ORG_A,
          id,
          hex(),
        ]),
      ).rejects.toMatchObject({ code: "42501" });
    });
  });
});

describe("2. sending and revoking; one writer at a time", () => {
  it("needs vendor.assess in the assessment's organisation; Org B reaches nothing", async () => {
    await run(async (tx) => {
      const id = await start(tx, ciso());
      await expect(send(tx, dean(), id, hex())).rejects.toMatchObject({ code: "TS403" });
      await expect(send(tx, bmlOwner(), id, hex())).rejects.toMatchObject({ code: "TS403" });
      await expect(send(tx, bmlOwner(), id, hex(), ORG_B)).rejects.toThrow(/Assessment not found/);
      await expect(revoke(tx, bmlOwner(), id, ORG_B)).rejects.toThrow(/Assessment not found/);
      await expect(send(tx, ciso(), id, "not-a-hash")).rejects.toMatchObject({ code: "TS422" });
      await expect(send(tx, ciso(), id, hex(), ORG_A, "not an email")).rejects.toMatchObject({ code: "TS422" });
    });
  });

  it("sets the source to vendor while open; sending again revokes the last link; revoking makes it the staff's again", async () => {
    await run(async (tx) => {
      const id = await start(tx, ciso());
      const first = hex();
      const sent = (await send(tx, ciso(), id, first)).rows[0]!.r;
      expect(sent).toMatchObject({ replaced: 0, vendor: { name: "RLS link vendor" }, respondentEmail: RESPONDENT });
      expect(await assessment(tx, id)).toMatchObject({ source: "vendor" });
      const second = hex();
      expect((await send(tx, legal(), id, second)).rows[0]!.r).toMatchObject({ replaced: 1 });
      expect(await link(tx, first)).toMatchObject({ revoked_by: SEED_USERS.muLegal.id });
      expect(await view(tx, first)).toEqual({ status: "not_found" });
      expect(await view(tx, second)).toMatchObject({ status: "unconfirmed", respondentName: "Priya Respondent" });
      await revoke(tx, ciso(), id);
      expect(await assessment(tx, id)).toMatchObject({ source: "staff" });
      expect(await view(tx, second)).toEqual({ status: "not_found" });
      await expect(revoke(tx, ciso(), id)).rejects.toMatchObject({ code: "TS404" });
    });
  });

  it("only a draft or a returned assessment is sent; staff may not save or submit while the link is open", async () => {
    await run(async (tx) => {
      const id = await start(tx, ciso());
      await send(tx, ciso(), id, hex());
      await expect(staffSave(tx, ciso(), id, [{ code: "C1", answer: "yes" }])).rejects.toMatchObject({ code: "TS409" });
      await expect(staffSubmit(tx, ciso(), id)).rejects.toMatchObject({ code: "TS409" });
      await revoke(tx, ciso(), id);
      await staffSave(tx, ciso(), id, complete());
      await staffSubmit(tx, ciso(), id);
      await expect(send(tx, ciso(), id, hex())).rejects.toMatchObject({ code: "TS409" });
      expect(await assessment(tx, id)).toMatchObject({ status: "submitted", source: "staff", declared_at: null });
    });
  });

  it("an expired link is no longer open: the respondent gets 'not found' and staff may answer again", async () => {
    await run(async (tx) => {
      const { id, token, session } = await opened(tx);
      await tx.asAdmin("UPDATE public.vendor_assessment_links SET expires_at = now() - interval '1 second' WHERE token_hash = $1", [token]);
      expect(await view(tx, token, session)).toEqual({ status: "not_found" });
      expect(await vSave(tx, token, session, [{ code: "C1", answer: "yes" }])).toEqual({ status: "not_found" });
      await staffSave(tx, ciso(), id, [{ code: "C1", answer: "yes" }]);
    });
  });

  it("a discarded draft takes its link with it", async () => {
    await run(async (tx) => {
      const { id, token } = await opened(tx);
      await tx.as(ciso(), "SELECT public.discard_vendor_assessment($1, $2)", [ORG_A, id]);
      expect(await view(tx, token)).toEqual({ status: "not_found" });
      expect((await tx.asAdmin("SELECT 1 FROM public.vendor_assessment_links WHERE token_hash = $1", [token])).rowCount).toBe(0);
    });
  });
});

describe("3. the respondent's steps", () => {
  it("an unknown or malformed token is the same not-found at every step", async () => {
    await inTransaction(client, async (tx) => {
      for (const token of [hex(), "not-a-hash", null]) {
        expect(await view(tx, token as string)).toEqual({ status: "not_found" });
        expect(await sendCode(tx, token as string, hex())).toEqual({ status: "not_found" });
        expect(await confirm(tx, token as string, hex(), hex())).toEqual({ status: "not_found" });
        expect(await vSave(tx, token as string, hex(), [])).toEqual({ status: "not_found" });
        expect(await addDoc(tx, token as string, hex())).toEqual({ status: "not_found" });
        expect(await attach(tx, token as string, hex(), randomUUID())).toEqual({ status: "not_found" });
        expect(await vSubmit(tx, token as string, hex())).toEqual({ status: "not_found" });
      }
    });
  });

  it("without the code entered in this browser, only the header: nothing is read or written", async () => {
    await run(async (tx) => {
      const id = await start(tx, ciso());
      await staffSave(tx, ciso(), id, [{ code: "C1", answer: "yes" }]);
      const token = hex();
      await send(tx, legal(), id, token);
      const header = await view(tx, token);
      expect(header).toMatchObject({ status: "unconfirmed", organization: { name: SEED_ORGS.mumbaiUniversity.name }, version: 1 });
      expect(header).not.toHaveProperty("answers");
      expect(await view(tx, token, hex())).toMatchObject({ status: "unconfirmed" });
      expect(await vSave(tx, token, hex(), [{ code: "C1", answer: "no" }])).toEqual({ status: "unconfirmed" });
      expect(await addDoc(tx, token, null)).toEqual({ status: "unconfirmed" });
      expect(await vSubmit(tx, token, null)).toEqual({ status: "unconfirmed" });
    });
  });

  it("codes: counted against the email limits; wrong codes counted, the fifth locks the link; a new browser's code ends the old session", async () => {
    await run(async (tx) => {
      const id = await start(tx, ciso());
      const token = hex();
      await send(tx, legal(), id, token);
      expect(await confirm(tx, token, hex(), hex())).toEqual({ status: "code_expired" }); // no code sent yet
      const code = hex();
      for (let i = 0; i < 3; i++) expect(await sendCode(tx, token, code)).toMatchObject({ status: "sent" });
      expect(await sendCode(tx, token, code)).toEqual({ status: "rate_limited", limit: "email" });
      expect((await tx.asAdmin("SELECT surface, event FROM public.intake_attempts WHERE email_hash = $1", [sha(RESPONDENT)])).rows).toEqual(
        Array(3).fill({ surface: "vendor_link", event: "code_sent" }),
      );
      expect(await confirm(tx, token, hex(), hex())).toEqual({ status: "wrong_code", attemptsLeft: 4 });
      const first = hex();
      expect(await confirm(tx, token, code, first)).toMatchObject({ status: "confirmed" });
      expect(await view(tx, token, first)).toMatchObject({ status: "open" });
      // The code is single use: it was cleared on confirmation.
      expect(await confirm(tx, token, code, hex())).toEqual({ status: "code_expired" });
      // Another browser asks again — the earlier session ends.
      await tx.asAdmin("DELETE FROM public.intake_attempts WHERE email_hash = $1", [sha(RESPONDENT)]);
      const again = hex();
      await sendCode(tx, token, again);
      const second = hex();
      await confirm(tx, token, again, second);
      expect(await view(tx, token, first)).toMatchObject({ status: "unconfirmed" });
      expect(await view(tx, token, second)).toMatchObject({ status: "open" });
      // Wrong entries count only against a live code.
      await sendCode(tx, token, hex());
      for (let i = 0; i < 3; i++) expect(await confirm(tx, token, hex(), hex())).toMatchObject({ status: "wrong_code" });
      expect(await confirm(tx, token, hex(), hex())).toEqual({ status: "locked" }); // the fifth wrong code
      expect(await view(tx, token, second)).toEqual({ status: "not_found" });
    });
  });

  it("answers are the respondent's (answered_by NULL); an unchanged answer keeps its author; a document on file stays cited", async () => {
    await run(async (tx) => {
      const id = await start(tx, ciso());
      // The CISO had cited the organisation's own copy of the contract on G1.
      const path = `organizations/${ORG_A}/evidence/${randomUUID()}/dpa.pdf`;
      const doc = path.split("/")[3]!;
      await tx.asAdmin("INSERT INTO storage.objects (bucket_id, name) VALUES ('evidence', $1)", [path]);
      await tx.asAdmin(
        "INSERT INTO public.evidence (id, organization_id, storage_path, file_name, content_type, byte_size, uploaded_by) VALUES ($1, $2, $3, 'dpa.pdf', 'application/pdf', 10, $4)",
        [doc, ORG_A, path, SEED_USERS.muItSecurity.id],
      );
      await tx.as(ciso(), "INSERT INTO public.evidence_links (organization_id, evidence_id, linked_entity_type, linked_entity_id) VALUES ($1, $2, 'vendor', $3)", [ORG_A, doc, VENDOR]);
      await staffSave(tx, ciso(), id, [
        { code: "G1", answer: "yes", evidenceId: doc },
        { code: "C1", answer: "yes" },
      ]);
      const token = hex();
      await send(tx, legal(), id, token);
      const code = hex();
      await sendCode(tx, token, code);
      const session = hex();
      await confirm(tx, token, code, session);

      const open = await view(tx, token, session);
      const g1 = (open.answers as Json[]).find((a) => a.code === "G1");
      expect(g1).toMatchObject({ answer: "yes", evidenceId: null, documentOnFile: true }); // never named to the vendor
      const saved = await vSave(tx, token, session, [
        { code: "G1", answer: "yes" }, // no evidenceId key: keep the document on file
        { code: "C1", answer: "yes" }, // unchanged
        { code: "C2", answer: "no" },
      ]);
      expect(saved).toMatchObject({ status: "saved", answersChanged: 1 });
      const { rows } = await tx.asAdmin<Json>(
        "SELECT question_code, answered_by, evidence_id FROM public.vendor_assessment_answers WHERE assessment_id = $1 ORDER BY question_code",
        [id],
      );
      expect(rows).toEqual([
        { question_code: "C1", answered_by: SEED_USERS.muItSecurity.id, evidence_id: null },
        { question_code: "C2", answered_by: null, evidence_id: null },
        { question_code: "G1", answered_by: SEED_USERS.muItSecurity.id, evidence_id: doc },
      ]);
      // Citing a document they did not upload is refused — even the one on file, by id.
      await expect(vSave(tx, token, session, [{ code: "A3", answer: "yes", evidenceId: doc }])).rejects.toMatchObject({ code: "TS422" });
      // The same checks as staff: only the bank's questions, only their answers.
      await expect(vSave(tx, token, session, [{ code: "Z9", answer: "yes" }])).rejects.toMatchObject({ code: "TS422" });
      await expect(vSave(tx, token, session, [{ code: "A3", answer: "partial" }])).rejects.toMatchObject({ code: "TS422" });
    });
  });
});

describe("4. the respondent's documents", () => {
  it("registered by the database (uploaded by nobody, pending), attached once stored, at most ten, and they back an answer", async () => {
    await run(async (tx) => {
      const { id, token, session } = await opened(tx);
      const early = randomUUID();
      const r = await addDoc(tx, token, session, early, "soc2.pdf");
      expect(r).toEqual({ status: "registered", storagePath: `organizations/${ORG_A}/evidence/${early}/soc2.pdf` });
      expect((await tx.asAdmin<Json>("SELECT uploaded_by, review_status FROM public.evidence WHERE id = $1", [early])).rows[0]).toEqual({
        uploaded_by: null,
        review_status: "pending",
      });
      // Not stored yet: it cannot be attached.
      await expect(attach(tx, token, session, early)).rejects.toMatchObject({ code: "TS409" });
      // A path the database did not build is refused by the evidence table's own CHECK.
      await expect(addDoc(tx, token, session, randomUUID(), "../other.pdf")).rejects.toMatchObject({ code: "23514" });

      const doc = await upload(tx, token, session);
      expect(await attach(tx, token, session, doc)).toEqual({ status: "attached" }); // idempotent
      const { rows: links } = await tx.asAdmin<Json>("SELECT linked_entity_type, linked_entity_id, linked_by FROM public.evidence_links WHERE evidence_id = $1", [doc]);
      expect(links).toEqual([{ linked_entity_type: "vendor", linked_entity_id: VENDOR, linked_by: null }]);
      const docs = Object.fromEntries(VENDOR_QUESTIONS.filter((q) => q.document).map((q) => [q.code, doc]));
      await vSave(tx, token, session, complete(docs));
      const risk = (await tx.asAdmin<{ r: Json }>("SELECT app.vendor_assessment_risk($1, $2) AS r", [ORG_A, id])).rows[0]!.r;
      expect(risk).toMatchObject({ score: 0, unevidenced: [] });
      const open = await view(tx, token, session);
      expect((open.documents as Json[]).map((d) => [d.fileName, d.attached]).sort()).toEqual([
        ["iso-certificate.pdf", true],
        ["soc2.pdf", false],
      ]);

      for (let i = 2; i < 10; i++) expect(await addDoc(tx, token, session)).toMatchObject({ status: "registered" });
      expect(await addDoc(tx, token, session)).toEqual({ status: "too_many_documents" });
      // Another link's document is not theirs to attach.
      expect(await attach(tx, token, session, randomUUID())).toEqual({ status: "not_found" });
    });
  });
});

describe("5. submission: complete, declared, stamped; the link is used up", () => {
  it("refuses an incomplete or unsigned submission; then stamps the vendor's submission and ends the link", async () => {
    await run(async (tx) => {
      const { id, token, session } = await opened(tx);
      await vSave(tx, token, session, [{ code: "C1", answer: "yes" }]);
      await expect(vSubmit(tx, token, session)).rejects.toThrow(/43 questions are not answered/);
      await vSave(tx, token, session, complete());
      await expect(vSubmit(tx, token, session, " ", "CISO")).rejects.toMatchObject({ code: "TS422" });
      await expect(vSubmit(tx, token, session, "Priya", null)).rejects.toMatchObject({ code: "TS422" });
      expect(await vSubmit(tx, token, session)).toMatchObject({ status: "submitted" });

      const a = await assessment(tx, id);
      expect(a).toMatchObject({
        status: "submitted",
        source: "vendor",
        submitted_by: null,
        declared_name: "Priya Respondent",
        declared_role: "Information Security Manager",
        created_by: SEED_USERS.muItSecurity.id,
      });
      expect(a.submitted_at).not.toBeNull();
      expect(a.declared_at).not.toBeNull();
      expect(a.source_note).toMatch(/^Answered by the vendor through the questionnaire link sent on \d{1,2} [A-Z][a-z]{2} \d{4}$/);
      expect(a.risk_score).toBe(Number((await tx.asAdmin<{ r: Json }>("SELECT app.vendor_assessment_risk($1, $2) AS r", [ORG_A, id])).rows[0]!.r.score));
      expect((await link(tx, token)).submitted_at).not.toBeNull();
      expect(await view(tx, token, session)).toEqual({ status: "not_found" });
      expect(await vSave(tx, token, session, [{ code: "C1", answer: "no" }])).toEqual({ status: "not_found" });
      // The CHECK: a vendor submission carries its declaration, and no staff submitter.
      await expect(tx.asAdmin("UPDATE public.vendor_assessments SET declared_at = NULL, declared_name = NULL, declared_role = NULL WHERE id = $1", [id])).rejects.toMatchObject({
        code: "23514",
      });
      await expect(tx.asAdmin("UPDATE public.vendor_assessments SET submitted_by = $2 WHERE id = $1", [id, SEED_USERS.muItSecurity.id])).rejects.toMatchObject({
        code: "23514",
      });
    });
  });
});

describe("6. the second person (D-092): the link's sender may not review", () => {
  it("the sender — who answered nothing — and the creator are refused; a third person accepts; returned, a new link may be sent", async () => {
    await run(async (tx) => {
      const { id, token, session } = await opened(tx, legal());
      await vSave(tx, token, session, complete());
      await vSubmit(tx, token, session);
      await expect(review(tx, legal(), id, "accept")).rejects.toThrow(/You sent this assessment to the vendor/);
      await expect(review(tx, ciso(), id, "accept")).rejects.toMatchObject({ code: "TS403" }); // no vendor.review
      await review(tx, registrar(), id, "return", "Attach the SOC 2 report");
      expect(await assessment(tx, id)).toMatchObject({ status: "returned", source: "vendor" });
      // Returned: the organisation may ask again — the registrar sends this one, and now may not review either.
      const again = hex();
      await send(tx, registrar(), id, again);
      const code = hex();
      await sendCode(tx, again, code);
      const s2 = hex();
      await confirm(tx, again, code, s2);
      await vSubmit(tx, again, s2);
      await expect(review(tx, registrar(), id, "accept")).rejects.toThrow(/You sent this assessment to the vendor/);
      await expect(review(tx, legal(), id, "accept")).rejects.toThrow(/You sent this assessment to the vendor/);
      await review(tx, admin(), id, "accept");
      expect(await assessment(tx, id)).toMatchObject({ status: "accepted", source: "vendor", reviewed_by: SEED_USERS.muAdmin.id });
    });
  });

  it("a returned vendor submission completed by staff becomes the staff's: the declaration is cleared", async () => {
    await run(async (tx) => {
      const { id, token, session } = await opened(tx, legal());
      await vSave(tx, token, session, complete());
      await vSubmit(tx, token, session);
      await review(tx, registrar(), id, "return", "We will finish it ourselves");
      await staffSave(tx, ciso(), id, [{ code: "C1", answer: "no" }], "The vendor's link, then a call on 14 Oct 2026");
      await staffSubmit(tx, ciso(), id);
      expect(await assessment(tx, id)).toMatchObject({ status: "submitted", source: "staff", submitted_by: SEED_USERS.muItSecurity.id, declared_at: null });
      // Legal sent the original link: still may not review.
      await expect(review(tx, legal(), id, "accept")).rejects.toThrow(/You sent this assessment to the vendor/);
    });
  });
});

describe("7. audit: the respondent's steps are nobody's, and name no one", () => {
  it("staff steps as the person; the respondent's with user_id NULL, 'by the vendor's respondent', no name or email", async () => {
    await run(async (tx) => {
      const { id, token, session } = await opened(tx, legal());
      const doc = await upload(tx, token, session);
      await vSave(tx, token, session, complete({ A3: doc }));
      await vSubmit(tx, token, session);
      const { rows } = await tx.asAdmin<{ event_type: string; user_id: string | null; description: string; metadata: Json }>(
        `SELECT event_type, user_id, description, metadata FROM public.audit_logs
         WHERE organization_id = $1 AND (entity_id = $2 OR entity_id = $3) ORDER BY created_at, event_type`,
        [ORG_A, id, doc],
      );
      const events = rows.map((r) => [r.event_type, r.user_id]);
      expect(events).toEqual(
        expect.arrayContaining([
          ["vendor.vendor_assessment_links.sent", SEED_USERS.muLegal.id],
          ["vendor_link.vendor_assessment_links.confirmed", null],
          ["vendor_link.evidence.upload_url.issued", null],
          ["vendor_link.evidence_links.insert", null],
          ["vendor_link.vendor_assessments.answers_saved", null],
          ["vendor_link.vendor_assessments.submitted", null],
        ]),
      );
      for (const r of rows.filter((x) => x.event_type.startsWith("vendor_link."))) {
        expect(r.description).toMatch(/the vendor's respondent/);
        const text = JSON.stringify(r);
        expect(text).not.toContain(RESPONDENT);
        expect(text).not.toContain("Priya");
      }
      expect(JSON.stringify(rows)).not.toContain(token);
    });
  });
});

describe("8. a token and a session open one link only (gate 5 for the public surface)", () => {
  it("Org A's session never opens Org B's link, and Org B's link writes only Org B's assessment", async () => {
    await run(async (tx) => {
      const a = await opened(tx);
      const bId = await start(tx, bmlOwner(), ORG_B, VENDOR_B);
      const bToken = hex();
      await send(tx, bmlOwner(), bId, bToken, ORG_B);
      expect(await view(tx, bToken, a.session)).toMatchObject({ status: "unconfirmed", organization: { name: SEED_ORGS.bharatManufacturing.name } });
      expect(await vSave(tx, bToken, a.session, [{ code: "C1", answer: "no" }])).toEqual({ status: "unconfirmed" });
      // A's document id through B's link: not B's to attach or cite.
      const doc = await upload(tx, a.token, a.session);
      const bCode = hex();
      await sendCode(tx, bToken, bCode);
      const bSession = hex();
      await confirm(tx, bToken, bCode, bSession);
      expect(await attach(tx, bToken, bSession, doc)).toEqual({ status: "not_found" });
      await expect(vSave(tx, bToken, bSession, [{ code: "A3", answer: "yes", evidenceId: doc }])).rejects.toMatchObject({ code: "TS422" });
      await vSave(tx, bToken, bSession, [{ code: "C1", answer: "no" }]);
      const { rows } = await tx.asAdmin<Json>(
        "SELECT organization_id, assessment_id FROM public.vendor_assessment_answers WHERE answered_by IS NULL AND question_code = 'C1' AND assessment_id = ANY($1::uuid[])",
        [[a.id, bId]],
      );
      expect(rows).toEqual([{ organization_id: ORG_B, assessment_id: bId }]);
    });
  });

  it("an organisation's deletion takes its links and their documents (tooling)", async () => {
    await run(async (tx) => {
      const { token, session } = await opened(tx);
      await upload(tx, token, session);
      await tx.asAdmin("DELETE FROM public.audit_logs WHERE organization_id = $1", [ORG_A]);
      await tx.asAdmin("DELETE FROM public.organizations WHERE id = $1", [ORG_A]);
      await tx.asAdmin("SET CONSTRAINTS ALL IMMEDIATE");
      expect((await tx.asAdmin("SELECT 1 FROM public.vendor_assessment_links WHERE organization_id = $1", [ORG_A])).rowCount).toBe(0);
      expect((await tx.asAdmin("SELECT 1 FROM public.vendor_link_documents WHERE organization_id = $1", [ORG_A])).rowCount).toBe(0);
    });
  });
});
