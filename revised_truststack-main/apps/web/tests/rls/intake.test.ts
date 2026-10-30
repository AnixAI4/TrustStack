/**
 * Slice 10, Stage 3a — GATE 5 for the public surfaces, and the database's
 * rules for public intake (migration 20261013000000_public_intake).
 *
 *   1. Who may call: the four intake functions are the server's alone
 *      (`service_role`); `anon` and every signed-in user are refused; nobody
 *      reads a pending submission or an attempt.
 *   2. The public address: set by `organization.update` only, unique,
 *      lower-case, and never without the Rule 9 contact. An unknown slug, a
 *      malformed one and a tenant without public pages answer the SAME
 *      "not found" (D-084).
 *   3. Tenancy: a submission belongs to the slug it was made on — another
 *      tenant's slug never reaches it, even with the right code.
 *   4. The flow: nothing enters the register until the code is entered; then
 *      ONE `web_form` request, received the day it was SUBMITTED (D-084), its
 *      code and clock derived as for a staff entry, audited once without
 *      personal data. A code makes one request, never two.
 *   5. Codes: only the hash is stored; ten minutes; five wrong entries lock
 *      the submission; a new code retires the old one.
 *   6. The limits, in the database: per client address per tenant per form;
 *      per email address an hour and a day.
 *   7. Sizes and shapes are CHECKed; a grievance names an earlier request
 *      only if it is the person's own.
 *
 * Every test runs inside a transaction that is rolled back.
 */
import { createHash, randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { SEED_ORGS, SEED_RIGHTS_REQUESTS, SEED_USERS } from "@truststack/db/seed-data";
import type pg from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { authSubjects, connect, inTransaction, type Tx } from "./db";

const ORG_A = SEED_ORGS.mumbaiUniversity;
const ORG_B = SEED_ORGS.bharatManufacturing;
const SLUG_A = "rls-mu";
const SLUG_B = "rls-bml";

let client: pg.Client;
let who: Map<string, { sub: string; email: string }>;
const u = (id: string) => who.get(id)!;
const muAdmin = () => u(SEED_USERS.muAdmin.id); // organization_admin: organization.update
const registrar = () => u(SEED_USERS.mumbaiUniversity.id); // dpdp_owner: scope.write, NOT organization.update
const bmlAdmin = () => u(SEED_USERS.bmlAdmin.id);

beforeAll(async () => {
  client = await connect();
  who = await authSubjects(client, Object.values(SEED_USERS).map((x) => x.id));
});
afterAll(async () => {
  await client?.end();
});

const hash = (submissionId: string, code: string) => createHash("sha256").update(`${submissionId}:${code}`).digest("hex");
const clientKey = (label: string) => createHash("sha256").update(`rls-client:${label}`).digest("hex");

/** Opens an organisation's public pages, as tooling (setup). */
async function open(tx: Tx, orgId: string, slug: string) {
  await tx.asAdmin(
    "UPDATE public.organizations SET public_slug = $2, public_contact_name = 'RLS Grievance Officer', public_contact_email = 'grievance@rls.example.com', public_contact_is_dpo = false WHERE id = $1",
    [orgId, slug],
  );
}

type Json = Record<string, unknown>;

interface BeginOver {
  slug?: string;
  surface?: string;
  client?: string;
  kind?: string;
  email?: string;
  name?: string;
  summary?: string;
  related?: string | null;
  nominee?: string | null;
  code?: string;
}

/** intake_begin as the server. Returns the function's answer and the id/code it was given. */
async function begin(tx: Tx, o: BeginOver = {}) {
  const id = randomUUID();
  const code = o.code ?? "246810";
  const { rows } = await tx.asServer<{ r: Json }>(
    `SELECT public.intake_begin($1, $2, $3, $4, $5, $6, $7, $8, NULL, 'self', NULL, $9, $10, $11, NULL, NULL) AS r`,
    [
      o.slug ?? SLUG_A,
      o.surface ?? (o.kind === "grievance" ? "grievance" : "rights"),
      id,
      o.client ?? clientKey("default"),
      hash(id, code),
      o.kind ?? "access",
      o.name ?? "Asha Rao",
      o.email ?? "asha.rls@example.com",
      o.summary ?? "Please send me a copy of my marks record.",
      o.related ?? null,
      o.nominee ?? null,
    ],
  );
  return { id, code, r: rows[0]!.r };
}

async function confirm(tx: Tx, slug: string, id: string, code: string): Promise<Json> {
  const { rows } = await tx.asServer<{ r: Json }>("SELECT public.intake_confirm($1, $2, $3) AS r", [slug, id, hash(id, code)]);
  return rows[0]!.r;
}

async function resend(tx: Tx, slug: string, id: string, code: string, client = clientKey("default")): Promise<Json> {
  const { rows } = await tx.asServer<{ r: Json }>("SELECT public.intake_resend($1, $2, $3, $4) AS r", [slug, id, client, hash(id, code)]);
  return rows[0]!.r;
}

const FUNCTIONS = [
  "SELECT public.intake_profile('rls-mu')",
  `SELECT public.intake_begin('rls-mu', 'rights', gen_random_uuid(), repeat('a', 64), repeat('b', 64), 'access', 'x', 'x@example.com', NULL, 'self', NULL, 'x', NULL, NULL, NULL, NULL)`,
  "SELECT public.intake_resend('rls-mu', gen_random_uuid(), repeat('a', 64), repeat('b', 64))",
  "SELECT public.intake_confirm('rls-mu', gen_random_uuid(), repeat('b', 64))",
];

describe("1. who may call (the public writer is the server's alone)", () => {
  it("anon and every signed-in user are refused all four functions; the server may call them", async () => {
    await inTransaction(client, async (tx) => {
      await open(tx, ORG_A.id, SLUG_A);
      for (const sql of FUNCTIONS) {
        await expect(tx.as(null, sql), sql).rejects.toMatchObject({ code: "42501" });
        await expect(tx.as(muAdmin(), sql), sql).rejects.toMatchObject({ code: "42501" });
        await expect(tx.asServer(sql), sql).resolves.toBeDefined();
      }
    });
  });

  it("nobody — not anon, not a member, not its own Organisation Admin — reads a pending submission or an attempt", async () => {
    await inTransaction(client, async (tx) => {
      await open(tx, ORG_A.id, SLUG_A);
      await begin(tx);
      for (const table of ["intake_submissions", "intake_attempts"]) {
        await expect(tx.as(null, `SELECT * FROM public.${table}`)).rejects.toMatchObject({ code: "42501" });
        await expect(tx.as(muAdmin(), `SELECT * FROM public.${table}`)).rejects.toMatchObject({ code: "42501" });
        await expect(tx.as(muAdmin(), `DELETE FROM public.${table}`)).rejects.toMatchObject({ code: "42501" });
      }
      const grants = await tx.asAdmin(
        `SELECT table_name, grantee, privilege_type FROM information_schema.role_table_grants
         WHERE table_schema = 'public' AND table_name IN ('intake_submissions', 'intake_attempts')
           AND grantee IN ('anon', 'authenticated', 'service_role')`,
      );
      expect(grants.rows).toEqual([]);
    });
  });

  it("the server holds EXECUTE on the four functions and on nothing it could misuse to read the register", async () => {
    await inTransaction(client, async (tx) => {
      const { rows } = await tx.asAdmin<{ p: string; anon: boolean; authed: boolean; server: boolean }>(
        `SELECT p.oid::regprocedure::text AS p,
                has_function_privilege('anon', p.oid, 'EXECUTE') AS anon,
                has_function_privilege('authenticated', p.oid, 'EXECUTE') AS authed,
                has_function_privilege('service_role', p.oid, 'EXECUTE') AS server
         FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
         WHERE n.nspname = 'public' AND p.proname LIKE 'intake\\_%' ORDER BY 1`,
      );
      expect(rows.map((r) => r.p.split("(")[0])).toEqual([
        "intake_begin",
        "intake_confirm",
        "intake_profile",
        "intake_resend",
      ]);
      for (const r of rows) expect([r.anon, r.authed, r.server], r.p).toEqual([false, false, true]);
    });
  });
});

describe("2. the public address", () => {
  it("an Organisation Admin opens the pages; a DPDP Programme Owner may not; another tenant's admin reaches nothing", async () => {
    await inTransaction(client, async (tx) => {
      const set = "UPDATE public.organizations SET public_slug = $2, public_contact_name = 'DPO', public_contact_email = 'grievance.rls@mu.example.com' WHERE id = $1";
      await expect(tx.as(registrar(), set, [ORG_A.id, SLUG_A])).rejects.toMatchObject({ code: "TS403" });
      const foreign = await tx.as(bmlAdmin(), set, [ORG_A.id, SLUG_A]);
      expect(foreign.rowCount).toBe(0);
      const done = await tx.as(muAdmin(), set, [ORG_A.id, SLUG_A]);
      expect(done.rowCount).toBe(1);
      const audit = await tx.asAdmin<{ metadata: Json }>(
        "SELECT metadata FROM public.audit_logs WHERE organization_id = $1 AND event_type = 'scope.organizations.update' ORDER BY created_at DESC LIMIT 1",
        [ORG_A.id],
      );
      expect(audit.rows[0]!.metadata.changed).toEqual(
        expect.arrayContaining(["public_slug", "public_contact_name", "public_contact_email"]),
      );
      // The contact's name and email are never logged; only that the columns changed.
      expect(JSON.stringify(audit.rows[0]!.metadata)).not.toContain("grievance.rls@mu.example.com");
    });
  });

  it("a slug is lower-case, unique, and never without the Rule 9 contact", async () => {
    await inTransaction(client, async (tx) => {
      const set = (slug: string | null, name: string | null, email: string | null) =>
        tx.as(muAdmin(), "UPDATE public.organizations SET public_slug = $2, public_contact_name = $3, public_contact_email = $4 WHERE id = $1", [
          ORG_A.id,
          slug,
          name,
          email,
        ]);
      await expect(set("Mumbai-Uni", "DPO", "dpo@mu.example.com")).rejects.toMatchObject({ code: "23514" });
      await expect(set("-mu", "DPO", "dpo@mu.example.com")).rejects.toMatchObject({ code: "23514" });
      await expect(set(SLUG_A, null, null)).rejects.toMatchObject({ code: "23514" });
      await expect(set(SLUG_A, "DPO", null)).rejects.toMatchObject({ code: "23514" });
      await expect(set(SLUG_A, "DPO", "not-an-email")).rejects.toMatchObject({ code: "23514" });
      await open(tx, ORG_B.id, SLUG_B);
      await expect(set(SLUG_B, "DPO", "dpo@mu.example.com")).rejects.toMatchObject({ code: "23505" });
      // Closing keeps the contact; the pages answer "not found" again.
      await set(SLUG_A, "DPO", "dpo@mu.example.com");
      await set(null, "DPO", "dpo@mu.example.com");
      const { rows } = await tx.asServer<{ p: Json | null }>("SELECT public.intake_profile($1) AS p", [SLUG_A]);
      expect(rows[0]!.p).toBeNull();
    });
  });

  it("an unknown slug, a malformed one, a tenant without pages and a deleted tenant all answer the same 'not found'", async () => {
    await inTransaction(client, async (tx) => {
      await open(tx, ORG_A.id, SLUG_A);
      await open(tx, ORG_B.id, SLUG_B);
      await tx.asAdmin("UPDATE public.organizations SET deleted_at = now() WHERE id = $1", [ORG_B.id]);
      // BML is deleted; "no-such-org" does not exist; "Bad Slug" is malformed; MU has pages.
      for (const slug of ["no-such-org", "Bad Slug", SLUG_B, ""]) {
        const p = await tx.asServer<{ p: Json | null }>("SELECT public.intake_profile($1) AS p", [slug]);
        expect(p.rows[0]!.p, slug).toBeNull();
        const b = await begin(tx, { slug });
        expect(b.r, slug).toEqual({ status: "not_found" });
        expect(await confirm(tx, slug, b.id, b.code)).toEqual({ status: "not_found" });
        expect(await resend(tx, slug, b.id, b.code)).toEqual({ status: "not_found" });
      }
      const p = await tx.asServer<{ p: Json }>("SELECT public.intake_profile($1) AS p", [SLUG_A]);
      expect(p.rows[0]!.p).toEqual({
        name: ORG_A.name,
        legalName: ORG_A.legalName,
        slug: SLUG_A,
        contact: { name: "RLS Grievance Officer", email: "grievance@rls.example.com", phone: null, isDpo: false },
      });
    });
  });
});

describe("3. tenancy (gate 5) — a submission belongs to its slug", () => {
  it("another tenant's slug never reaches a submission, even with the right code; the profile never names another tenant", async () => {
    await inTransaction(client, async (tx) => {
      await open(tx, ORG_A.id, SLUG_A);
      await open(tx, ORG_B.id, SLUG_B);
      const a = await begin(tx, { slug: SLUG_A });
      expect(a.r.status).toBe("pending");
      expect(await resend(tx, SLUG_B, a.id, "135791")).toEqual({ status: "not_found" });
      expect(await confirm(tx, SLUG_B, a.id, a.code)).toEqual({ status: "not_found" });
      // Nothing was counted against it through the wrong slug, and nothing reached either register.
      const s = await tx.asAdmin<{ wrong_codes: number; codes_sent: number; confirmed_at: string | null }>(
        "SELECT wrong_codes, codes_sent, confirmed_at FROM public.intake_submissions WHERE id = $1",
        [a.id],
      );
      expect(s.rows[0]).toEqual({ wrong_codes: 0, codes_sent: 1, confirmed_at: null });
      const answer = JSON.stringify(a.r);
      for (const marker of [ORG_B.id, ORG_B.name, ORG_A.id]) expect(answer).not.toContain(marker);
      // Through its own slug it confirms into its own organisation's register.
      const done = await confirm(tx, SLUG_A, a.id, a.code);
      expect(done.status).toBe("confirmed");
      const r = await tx.asAdmin<{ organization_id: string }>("SELECT organization_id FROM public.rights_requests WHERE request_code = $1 AND organization_id = $2", [
        done.requestCode,
        ORG_A.id,
      ]);
      expect(r.rowCount).toBe(1);
    });
  });
});

describe("4. the flow — nothing in the register until the code is entered", () => {
  it("a submission is held apart; the right code makes ONE web-form request, received the day it was submitted", async () => {
    await inTransaction(client, async (tx) => {
      await open(tx, ORG_A.id, SLUG_A);
      const before = await tx.asAdmin<{ n: string }>("SELECT count(*) AS n FROM public.rights_requests WHERE organization_id = $1", [ORG_A.id]);
      const b = await begin(tx);
      expect(b.r).toMatchObject({ status: "pending", submissionId: b.id });
      const held = await tx.asAdmin<{ n: string }>("SELECT count(*) AS n FROM public.rights_requests WHERE organization_id = $1", [ORG_A.id]);
      expect(held.rows[0]!.n).toBe(before.rows[0]!.n);
      // Only the hash is stored — never the code.
      const s = await tx.asAdmin<{ code_hash: string; row: string }>("SELECT code_hash, row_to_json(s)::text AS row FROM public.intake_submissions s WHERE id = $1", [b.id]);
      expect(s.rows[0]!.code_hash).toBe(hash(b.id, b.code));
      expect(s.rows[0]!.row).not.toContain(b.code);

      // Submitted three days ago (India), confirmed today: receipt is the day it was SUBMITTED (D-084).
      await tx.asAdmin(
        "UPDATE public.intake_submissions SET submitted_on = (now() AT TIME ZONE 'Asia/Kolkata')::date - 3 WHERE id = $1",
        [b.id],
      );
      const done = await confirm(tx, SLUG_A, b.id, b.code);
      expect(done).toMatchObject({ status: "confirmed", kind: "access", email: "asha.rls@example.com" });
      const r = await tx.asAdmin<Record<string, unknown>>(
        `SELECT request_code, channel, status, created_by, requester_email,
                to_char(received_on, 'YYYY-MM-DD') AS received_on, (respond_by - received_on) AS days,
                received_on = (now() AT TIME ZONE 'Asia/Kolkata')::date - 3 AS submitted_day
         FROM public.rights_requests WHERE organization_id = $1 AND request_code = $2`,
        [ORG_A.id, done.requestCode],
      );
      expect(r.rows[0]).toMatchObject({
        channel: "web_form",
        status: "open",
        created_by: null,
        requester_email: "asha.rls@example.com",
        days: 90,
        submitted_day: true,
      });
      expect(done.receivedOn).toBe(r.rows[0]!.received_on);
      expect(String(done.requestCode)).toMatch(/^DPR-\d{4}-\d{3,}$/);
    });
  });

  it("the intake is audited once, as the public intake, with no personal data or free text", async () => {
    await inTransaction(client, async (tx) => {
      await open(tx, ORG_A.id, SLUG_A);
      const b = await begin(tx, { name: "Zarine Personal", email: "zarine.rls@example.com", summary: "Free text never logged" });
      const done = await confirm(tx, SLUG_A, b.id, b.code);
      const { rows } = await tx.asAdmin<{ event_type: string; user_id: string | null; metadata: Json }>(
        "SELECT event_type, user_id, metadata FROM public.audit_logs WHERE organization_id = $1 AND metadata ->> 'requestCode' = $2",
        [ORG_A.id, done.requestCode],
      );
      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({
        event_type: "intake.rights_requests.insert",
        user_id: null,
        metadata: { channel: "web_form", rightsKind: "access", rightsStatus: "open" },
      });
      const logged = JSON.stringify(rows[0]!.metadata);
      for (const secret of ["Zarine", "zarine.rls@example.com", "Free text"]) expect(logged).not.toContain(secret);
    });
  });

  it("a code makes one request, never two: a replay is refused", async () => {
    await inTransaction(client, async (tx) => {
      await open(tx, ORG_A.id, SLUG_A);
      const b = await begin(tx);
      expect((await confirm(tx, SLUG_A, b.id, b.code)).status).toBe("confirmed");
      expect(await confirm(tx, SLUG_A, b.id, b.code)).toEqual({ status: "already_confirmed" });
      expect(await resend(tx, SLUG_A, b.id, "111111")).toEqual({ status: "already_confirmed" });
      const n = await tx.asAdmin<{ n: string }>("SELECT count(*) AS n FROM public.intake_submissions WHERE id = $1 AND rights_request_id IS NOT NULL", [b.id]);
      expect(n.rows[0]!.n).toBe("1");
    });
  });

  it("a nomination carries its nominee into the register; a grievance gets a GRV code", async () => {
    await inTransaction(client, async (tx) => {
      await open(tx, ORG_A.id, SLUG_A);
      const nom = await begin(tx, { kind: "nomination", nominee: "Ravi Rao", summary: "I nominate my brother." });
      const nomDone = await confirm(tx, SLUG_A, nom.id, nom.code);
      const g = await begin(tx, { kind: "grievance", summary: "My correction was never made." });
      const gDone = await confirm(tx, SLUG_A, g.id, g.code);
      expect(String(gDone.requestCode)).toMatch(/^GRV-/);
      const { rows } = await tx.asAdmin<{ kind: string; nominee_name: string | null }>(
        "SELECT kind, nominee_name FROM public.rights_requests WHERE organization_id = $1 AND request_code = ANY($2) ORDER BY kind",
        [ORG_A.id, [nomDone.requestCode, gDone.requestCode]],
      );
      expect(rows).toEqual([
        { kind: "grievance", nominee_name: null },
        { kind: "nomination", nominee_name: "Ravi Rao" },
      ]);
    });
  });
});

describe("5. codes — ten minutes, single use, five wrong entries", () => {
  it("a wrong code is counted and answered; the fifth locks the submission, even against the right code", async () => {
    await inTransaction(client, async (tx) => {
      await open(tx, ORG_A.id, SLUG_A);
      const b = await begin(tx);
      for (const left of [4, 3, 2, 1]) expect(await confirm(tx, SLUG_A, b.id, "000000")).toEqual({ status: "wrong_code", attemptsLeft: left });
      expect(await confirm(tx, SLUG_A, b.id, "000000")).toEqual({ status: "locked" });
      expect(await confirm(tx, SLUG_A, b.id, b.code)).toEqual({ status: "locked" });
      expect(await resend(tx, SLUG_A, b.id, "135791")).toEqual({ status: "locked" });
    });
  });

  it("an expired code is refused and a new one works; the old one stops working; wrong entries are not forgiven", async () => {
    await inTransaction(client, async (tx) => {
      await open(tx, ORG_A.id, SLUG_A);
      const b = await begin(tx);
      expect(await confirm(tx, SLUG_A, b.id, "000000")).toMatchObject({ status: "wrong_code" });
      await tx.asAdmin("UPDATE public.intake_submissions SET code_expires_at = now() - interval '1 second' WHERE id = $1", [b.id]);
      expect(await confirm(tx, SLUG_A, b.id, b.code)).toEqual({ status: "code_expired" });
      const r = await resend(tx, SLUG_A, b.id, "135791");
      expect(r).toMatchObject({ status: "sent", email: "asha.rls@example.com", kind: "access" });
      expect(await confirm(tx, SLUG_A, b.id, b.code)).toEqual({ status: "wrong_code", attemptsLeft: 3 });
      expect((await confirm(tx, SLUG_A, b.id, "135791")).status).toBe("confirmed");
    });
  });

  it("a submission not confirmed within 24 hours is spent", async () => {
    await inTransaction(client, async (tx) => {
      await open(tx, ORG_A.id, SLUG_A);
      const b = await begin(tx);
      await tx.asAdmin("UPDATE public.intake_submissions SET expires_at = now() - interval '1 second' WHERE id = $1", [b.id]);
      expect(await confirm(tx, SLUG_A, b.id, b.code)).toEqual({ status: "expired" });
      expect(await resend(tx, SLUG_A, b.id, "135791")).toEqual({ status: "expired" });
    });
  });
});

describe("6. the limits, in the database", () => {
  it("five submissions an hour per client address per tenant per form; the sixth is refused, other forms and older attempts are not counted", async () => {
    await inTransaction(client, async (tx) => {
      await open(tx, ORG_A.id, SLUG_A);
      await open(tx, ORG_B.id, SLUG_B);
      const me = clientKey("busy");
      for (let i = 0; i < 5; i++) expect((await begin(tx, { client: me, email: `rate${i}.rls@example.com` })).r.status).toBe("pending");
      expect((await begin(tx, { client: me, email: "rate5.rls@example.com" })).r).toEqual({ status: "rate_limited", limit: "client" });
      // Another form, another tenant, another address: each is its own count.
      expect((await begin(tx, { client: me, kind: "grievance", email: "rate6.rls@example.com" })).r.status).toBe("pending");
      expect((await begin(tx, { slug: SLUG_B, client: me, email: "rate7.rls@example.com" })).r.status).toBe("pending");
      expect((await begin(tx, { client: clientKey("calm"), email: "rate8.rls@example.com" })).r.status).toBe("pending");
      // An hour later the window has moved.
      await tx.asAdmin("UPDATE public.intake_attempts SET created_at = created_at - interval '61 minutes' WHERE client_hash = $1", [me]);
      expect((await begin(tx, { client: me, email: "rate9.rls@example.com" })).r.status).toBe("pending");
    });
  });

  it("three codes an hour and ten a day per email address — across forms, tenants and clients — and a new code counts", async () => {
    await inTransaction(client, async (tx) => {
      await open(tx, ORG_A.id, SLUG_A);
      await open(tx, ORG_B.id, SLUG_B);
      const email = "flood.rls@example.com";
      const first = await begin(tx, { email, client: clientKey("c1") });
      await begin(tx, { email, client: clientKey("c2"), slug: SLUG_B });
      expect((await resend(tx, SLUG_A, first.id, "135791", clientKey("c3"))).status).toBe("sent");
      expect((await begin(tx, { email: "FLOOD.rls@example.com ", client: clientKey("c4") })).r).toEqual({ status: "rate_limited", limit: "email" });
      expect(await resend(tx, SLUG_A, first.id, "975319", clientKey("c5"))).toEqual({ status: "rate_limited", limit: "email" });
      // Past the hour, under the day: allowed again until ten in 24 hours.
      const emailHash = createHash("sha256").update(email).digest("hex");
      await tx.asAdmin("UPDATE public.intake_attempts SET created_at = created_at - interval '2 hours' WHERE email_hash = $1", [emailHash]);
      await tx.asAdmin(
        `INSERT INTO public.intake_attempts (organization_id, surface, event, client_hash, email_hash, created_at)
         SELECT $1, 'rights', 'code_sent', $2, $3, now() - interval '3 hours' FROM generate_series(1, 7)`,
        [ORG_A.id, clientKey("old"), emailHash],
      );
      expect((await begin(tx, { email, client: clientKey("c6") })).r).toEqual({ status: "rate_limited", limit: "email" });
    });
  });

  it("the attempts table holds hashes, never the address or the email", async () => {
    await inTransaction(client, async (tx) => {
      await open(tx, ORG_A.id, SLUG_A);
      await begin(tx, { email: "hashme.rls@example.com" });
      const { rows } = await tx.asAdmin<{ row: string }>("SELECT row_to_json(a)::text AS row FROM public.intake_attempts a WHERE organization_id = $1", [ORG_A.id]);
      expect(rows.length).toBeGreaterThan(0);
      for (const r of rows) expect(r.row).not.toContain("hashme");
    });
  });
});

describe("7. sizes, shapes, and the earlier request a grievance names", () => {
  it("the forms take only their own kinds; sizes and shapes are CHECKed", async () => {
    await inTransaction(client, async (tx) => {
      await open(tx, ORG_A.id, SLUG_A);
      await expect(begin(tx, { surface: "rights", kind: "grievance" })).rejects.toMatchObject({ code: "TS422" });
      await expect(begin(tx, { surface: "grievance", kind: "access" })).rejects.toMatchObject({ code: "TS422" });
      await expect(begin(tx, { surface: "notice" })).rejects.toMatchObject({ code: "TS422" });
      await expect(begin(tx, { client: "not-a-hash" })).rejects.toMatchObject({ code: "TS422" });
      await expect(begin(tx, { email: "nobody" })).rejects.toMatchObject({ code: "TS422" });
      await expect(begin(tx, { kind: "nomination" })).rejects.toMatchObject({ code: "23514" });
      await expect(begin(tx, { nominee: "Someone" })).rejects.toMatchObject({ code: "23514" });
      await expect(begin(tx, { summary: "x".repeat(4001) })).rejects.toMatchObject({ code: "23514" });
      await expect(begin(tx, { name: "   " })).rejects.toMatchObject({ code: "23514" });
      await expect(begin(tx, { related: "DPR-2026-001" })).rejects.toMatchObject({ code: "23514" });
      // A refused submission is not counted.
      const n = await tx.asAdmin<{ n: string }>("SELECT count(*) AS n FROM public.intake_attempts WHERE organization_id = $1", [ORG_A.id]);
      expect(n.rows[0]!.n).toBe("0");
    });
  });

  it("a grievance is linked to an earlier request only if it is this tenant's and the person's own; the answer is the same either way", async () => {
    await inTransaction(client, async (tx) => {
      await open(tx, ORG_A.id, SLUG_A);
      const seeded = SEED_RIGHTS_REQUESTS.marksAccess;
      const own = await begin(tx, { kind: "grievance", email: seeded.requesterEmail, related: seeded.requestCode.toLowerCase() });
      const ownDone = await confirm(tx, SLUG_A, own.id, own.code);
      const other = await begin(tx, { kind: "grievance", email: "stranger.rls@example.com", related: seeded.requestCode });
      const otherDone = await confirm(tx, SLUG_A, other.id, other.code);
      expect(Object.keys(ownDone).sort()).toEqual(Object.keys(otherDone).sort());
      const { rows } = await tx.asAdmin<{ request_code: string; related_request_id: string | null; summary: string }>(
        "SELECT request_code, related_request_id, summary FROM public.rights_requests WHERE organization_id = $1 AND request_code = ANY($2) ORDER BY request_code",
        [ORG_A.id, [ownDone.requestCode, otherDone.requestCode]],
      );
      const byCode = new Map(rows.map((r) => [r.request_code, r]));
      expect(byCode.get(String(ownDone.requestCode))!.related_request_id).toBe(seeded.id);
      expect(byCode.get(String(otherDone.requestCode))!.related_request_id).toBeNull();
      expect(byCode.get(String(otherDone.requestCode))!.summary).toContain(`not matched): ${seeded.requestCode}`);
    });
  });

  it("Stage 3a changes no model rule: its migration asserts 1.2.0 and defines no model function", () => {
    // The database now runs a later version (Stages 3b and 4a's migrations); 3a's own stays as applied.
    const sql = readFileSync(path.resolve(import.meta.dirname, "../../../../packages/db/prisma/migrations/20261013000000_public_intake/migration.sql"), "utf8");
    expect(sql).toContain("ASSERT app.exposure_model_version() = '1.2.0', 'Stage 3a changes no model rule';");
    expect(sql).not.toContain("CREATE OR REPLACE FUNCTION app.exposure_");
  });
});
