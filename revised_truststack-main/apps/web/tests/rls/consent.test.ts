/**
 * Slice 10, Stage 3b — GATE 5 (RLS) and the database's rules for the privacy
 * notice, the consent widget and the consent register (migration
 * 20261014000000_notice_consent).
 *
 *   1. Org A cannot see or touch Org B's notices, widget versions or
 *      consents; anon holds nothing; reading needs consent.read, writing
 *      consent.write, publishing consent.publish. Nobody reads a salt.
 *   2. Notices: versions numbered by the database; one draft per language; a
 *      published notice is complete (Rule 3(b)), stamped, and never changes
 *      or goes.
 *   3. Widget versions cite a notice of their own organisation, offer only its
 *      purposes, and are published only on a published notice.
 *   4. Consent records: written by functions only, never changed or deleted;
 *      pseudonymous; a verification fits its kind; history by identifier.
 *   5. The public functions are the server's: the widget and the notice page
 *      answer for their own tenant only, the widget never verifies, and the
 *      limits hold.
 *   6. Audit: notices and widget versions by trigger (never their text),
 *      staff records once (never the identifier); widget records not at all.
 *   7. Model 1.3.0: an unverified child's consent sets head 3 Exposed in a
 *      stored snapshot; a verification restated as a new record clears it.
 *
 * Every test runs inside a transaction that is rolled back.
 */
import { createHash } from "node:crypto";
import { SEED_CONSENT_CONFIG, SEED_CONSENT_RECORDS, SEED_NOTICE, SEED_ORGS, SEED_USERS } from "@truststack/db/seed-data";
import type pg from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { authSubjects, connect, inTransaction, type Tx } from "./db";

const ORG_A = SEED_ORGS.mumbaiUniversity.id;
const ORG_B = SEED_ORGS.bharatManufacturing.id;
const NOTICE = SEED_NOTICE.id;
const CONFIG = SEED_CONSENT_CONFIG.id;

let client: pg.Client;
let who: Map<string, { sub: string; email: string }>;
const u = (id: string) => who.get(id)!;
const legal = () => u(SEED_USERS.muLegal.id); // consent.write + consent.publish
const deptOwner = () => u(SEED_USERS.muDepartmentOwner.id); // consent.write, NOT consent.publish
const registrar = () => u(SEED_USERS.mumbaiUniversity.id); // dpdp_owner: publish
const dean = () => u(SEED_USERS.muDean.id); // consent.read only
const muAdmin = () => u(SEED_USERS.muAdmin.id);
const bmlOwner = () => u(SEED_USERS.bharatManufacturing.id);
type Actor = { sub: string; email: string };
type Json = Record<string, unknown>;

const CLIENT = createHash("sha256").update("rls-consent-client").digest("hex");
const PURPOSES = JSON.stringify([{ key: "newsletter", title: "Newsletter", uses: "A monthly newsletter.", dataItems: ["Email address"] }]);

beforeAll(async () => {
  client = await connect();
  who = await authSubjects(client, Object.values(SEED_USERS).map((x) => x.id));
});
afterAll(async () => {
  await client?.end();
});

async function draftNotice(tx: Tx, actor: Actor, org: string, language = "en", purposes = PURPOSES) {
  const { rows } = await tx.as<{ id: string; version: number; status: string; created_by: string }>(
    actor,
    "INSERT INTO public.privacy_notices (organization_id, language, title, purposes) VALUES ($1, $2, 'RLS notice', $3::jsonb) RETURNING id, version, status, created_by",
    [org, language, purposes],
  );
  return rows[0]!;
}

const publishNotice = (tx: Tx, actor: Actor, id: string) =>
  tx.as<{ published_at: string; published_by: string }>(actor, "UPDATE public.privacy_notices SET status = 'published' WHERE id = $1 RETURNING published_at, published_by", [id]);

async function draftConfig(tx: Tx, actor: Actor, org: string, noticeId: string, purposes: string[]) {
  const { rows } = await tx.as<{ id: string; version: number }>(
    actor,
    "INSERT INTO public.consent_configs (organization_id, notice_id, purposes) VALUES ($1, $2, $3::text[]) RETURNING id, version",
    [org, noticeId, purposes],
  );
  return rows[0]!;
}

const recordConsent = (
  tx: Tx,
  actor: Actor,
  org: string,
  over: { config?: string; identifier?: string; action?: string; purposes?: string[]; kind?: string; method?: string | null; reference?: string | null } = {},
) =>
  tx.as<{ r: Json }>(actor, "SELECT public.record_consent($1, $2, $3, $4, $5::text[], $6, $7, 'en', $8) AS r", [
    org,
    over.config ?? CONFIG,
    over.identifier ?? "rls-person@example.com",
    over.action ?? "given",
    over.purposes ?? ["alumni_updates"],
    over.kind ?? "self",
    over.method ?? null,
    over.reference ?? null,
  ]);

async function openPublicPages(tx: Tx, org: string, slug: string) {
  await tx.asAdmin(
    "UPDATE public.organizations SET public_slug = $2, public_contact_name = 'RLS DPO', public_contact_email = 'dpo@rls.example.com' WHERE id = $1",
    [org, slug],
  );
}

const widgetRecord = (tx: Tx, slug: string, over: { config?: string; identifier?: string; action?: string; purposes?: string[]; kind?: string; client?: string } = {}) =>
  tx.asServer<{ r: Json }>("SELECT public.consent_record_public($1, $2, $3, $4, $5, $6::text[], $7, 'en') AS r", [
    slug,
    over.client ?? CLIENT,
    over.config ?? CONFIG,
    over.identifier ?? "browser-rls-1",
    over.action ?? "given",
    over.purposes ?? ["event_photos"],
    over.kind ?? "self",
  ]);

describe("1. tenancy (gate 5) and permissions", () => {
  it("a member reads their own notices, widget versions and consents; Org B's owner sees none; anon is refused outright", async () => {
    await inTransaction(client, async (tx) => {
      for (const table of ["privacy_notices", "consent_configs", "consent_records", "consent_principals"]) {
        const mine = await tx.as(dean(), `SELECT 1 FROM public.${table} WHERE organization_id = $1`, [ORG_A]);
        expect(mine.rowCount, table).toBeGreaterThan(0);
        const theirs = await tx.as(bmlOwner(), `SELECT 1 FROM public.${table} WHERE organization_id = $1`, [ORG_A]);
        expect(theirs.rowCount, table).toBe(0);
        await expect(tx.as(null, `SELECT 1 FROM public.${table}`), table).rejects.toMatchObject({ code: "42501" });
      }
    });
  });

  it("anon holds no privilege on any consent table; nobody reads a salt, not even the organisation's admin", async () => {
    await inTransaction(client, async (tx) => {
      const grants = await tx.asAdmin(
        "SELECT table_name, privilege_type FROM information_schema.role_table_grants WHERE table_schema = 'public' AND grantee = 'anon' AND table_name IN ('privacy_notices', 'consent_configs', 'consent_records', 'consent_salts', 'consent_principals')",
      );
      expect(grants.rowCount).toBe(0);
      await expect(tx.as(muAdmin(), "SELECT salt FROM public.consent_salts")).rejects.toMatchObject({ code: "42501" });
      await expect(tx.asServer("SELECT salt FROM public.consent_salts")).rejects.toMatchObject({ code: "42501" });
    });
  });

  it("anon and signed-in users cannot call the public functions; anon cannot call the staff ones", async () => {
    await inTransaction(client, async (tx) => {
      for (const sql of [
        "SELECT public.consent_widget('x')",
        "SELECT public.consent_notice('x', 'en')",
        `SELECT public.consent_record_public('x', '${CLIENT}', '${CONFIG}', 'y', 'given', ARRAY['alumni_updates'], 'self', 'en')`,
      ]) {
        await expect(tx.as(null, sql), sql).rejects.toMatchObject({ code: "42501" });
        await expect(tx.as(legal(), sql), sql).rejects.toMatchObject({ code: "42501" });
      }
      await expect(recordConsent(tx, null as unknown as Actor, ORG_A)).rejects.toMatchObject({ code: "42501" });
      await expect(tx.as(null, "SELECT public.consent_history($1, 'x')", [ORG_A])).rejects.toMatchObject({ code: "42501" });
      await expect(tx.as(null, "SELECT public.consent_register_facts($1)", [ORG_A])).rejects.toMatchObject({ code: "42501" });
    });
  });

  it("Org B cannot draft into Org A, change Org A's draft, record a consent for Org A, or read a history there", async () => {
    await inTransaction(client, async (tx) => {
      await expect(draftNotice(tx, bmlOwner(), ORG_A)).rejects.toMatchObject({ code: "TS403" });
      const draft = await draftNotice(tx, legal(), ORG_A);
      const upd = await tx.as(bmlOwner(), "UPDATE public.privacy_notices SET title = 'stolen' WHERE id = $1", [draft.id]);
      expect(upd.rowCount).toBe(0);
      const del = await tx.as(bmlOwner(), "DELETE FROM public.privacy_notices WHERE id = $1", [draft.id]);
      expect(del.rowCount).toBe(0);
      await expect(recordConsent(tx, bmlOwner(), ORG_A)).rejects.toMatchObject({ code: "TS403" });
      await expect(tx.as(bmlOwner(), "SELECT public.consent_history($1, 'x')", [ORG_A])).rejects.toMatchObject({ code: "TS403" });
      // And the counts read as Org B's owner are Org A's nothing.
      const facts = await tx.as<{ f: { counts: { principals: number } } }>(bmlOwner(), "SELECT public.consent_register_facts($1) AS f", [ORG_A]);
      expect(Number(facts.rows[0]!.f.counts.principals)).toBe(0);
    });
  });

  it("reading is consent.read; drafting consent.write; publishing consent.publish", async () => {
    await inTransaction(client, async (tx) => {
      await expect(draftNotice(tx, dean(), ORG_A)).rejects.toMatchObject({ code: "TS403" });
      const draft = await draftNotice(tx, deptOwner(), ORG_A);
      await expect(publishNotice(tx, deptOwner(), draft.id)).rejects.toMatchObject({ code: "TS403" });
      await expect(recordConsent(tx, dean(), ORG_A)).rejects.toMatchObject({ code: "TS403" });
      const published = await publishNotice(tx, registrar(), draft.id);
      expect(published.rows[0]!.published_by).toBe(SEED_USERS.mumbaiUniversity.id);
    });
  });
});

describe("2. notices (s.5, Rule 3)", () => {
  it("the database numbers versions per language; one draft at a time per language", async () => {
    await inTransaction(client, async (tx) => {
      const en = await draftNotice(tx, legal(), ORG_A, "en");
      expect(en.version).toBe(SEED_NOTICE.version + 1);
      expect(en.status).toBe("draft");
      expect(en.created_by).toBe(SEED_USERS.muLegal.id);
      const hi = await draftNotice(tx, legal(), ORG_A, "hi");
      expect(hi.version).toBe(1);
      await expect(draftNotice(tx, legal(), ORG_A, "en")).rejects.toMatchObject({ code: "23505" });
      await expect(
        tx.as(legal(), "INSERT INTO public.privacy_notices (organization_id, title, version) VALUES ($1, 'x', 99)", [ORG_A]),
      ).rejects.toMatchObject({ code: "42501" });
      await expect(
        tx.as(legal(), "INSERT INTO public.privacy_notices (organization_id, title, status) VALUES ($1, 'x', 'published')", [ORG_A]),
      ).rejects.toMatchObject({ code: "42501" });
    });
  });

  it("a notice is published complete — each purpose states what it enables and itemises its data (Rule 3(b)) — and stamped", async () => {
    await inTransaction(client, async (tx) => {
      const thin = await draftNotice(tx, legal(), ORG_A, "mr", JSON.stringify([{ key: "newsletter", title: "Newsletter", uses: "", dataItems: [] }]));
      await expect(publishNotice(tx, legal(), thin.id)).rejects.toMatchObject({ code: "23514" });
      const empty = await draftNotice(tx, legal(), ORG_A, "hi", "[]");
      await expect(publishNotice(tx, legal(), empty.id)).rejects.toMatchObject({ code: "23514" });
      await expect(draftNotice(tx, legal(), ORG_A, "ta", JSON.stringify([{ key: "Bad Key", title: "", uses: "", dataItems: [] }]))).rejects.toMatchObject({
        code: "23514",
      });
      const good = await draftNotice(tx, legal(), ORG_A, "en");
      const { rows } = await publishNotice(tx, legal(), good.id);
      expect(rows[0]!.published_at).not.toBeNull();
      expect(rows[0]!.published_by).toBe(SEED_USERS.muLegal.id);
    });
  });

  it("a published notice never changes and is never deleted — by a person; tooling likewise cannot change it", async () => {
    await inTransaction(client, async (tx) => {
      await expect(tx.as(legal(), "UPDATE public.privacy_notices SET title = 'changed' WHERE id = $1", [NOTICE])).rejects.toMatchObject({ code: "TS409" });
      await expect(tx.as(legal(), "UPDATE public.privacy_notices SET status = 'draft' WHERE id = $1", [NOTICE])).rejects.toMatchObject({
        code: "TS409",
      });
      const del = await tx.as(legal(), "DELETE FROM public.privacy_notices WHERE id = $1", [NOTICE]);
      expect(del.rowCount).toBe(0); // the policy: drafts only
      await expect(tx.asAdmin("UPDATE public.privacy_notices SET title = 'changed' WHERE id = $1", [NOTICE])).rejects.toMatchObject({ code: "TS409" });
      // An identical save is no change (the seed re-runs).
      await expect(tx.asAdmin("UPDATE public.privacy_notices SET title = title WHERE id = $1", [NOTICE])).resolves.toBeDefined();
    });
  });

  it("a draft may be discarded; one a widget version cites may not", async () => {
    await inTransaction(client, async (tx) => {
      const draft = await draftNotice(tx, legal(), ORG_A, "hi");
      await draftConfig(tx, legal(), ORG_A, draft.id, []);
      await expect(tx.as(legal(), "DELETE FROM public.privacy_notices WHERE id = $1", [draft.id])).rejects.toMatchObject({ code: "TS409" });
      const other = await draftNotice(tx, legal(), ORG_A, "mr");
      const del = await tx.as(legal(), "DELETE FROM public.privacy_notices WHERE id = $1", [other.id]);
      expect(del.rowCount).toBe(1);
    });
  });
});

describe("3. widget versions", () => {
  it("cite a notice of their own organisation, offering only its purposes, in its language", async () => {
    await inTransaction(client, async (tx) => {
      const draft = await draftConfig(tx, legal(), ORG_A, NOTICE, ["alumni_updates"]);
      expect(draft.version).toBe(SEED_CONSENT_CONFIG.version + 1);
      await expect(tx.as(legal(), "UPDATE public.consent_configs SET purposes = ARRAY['marketing'] WHERE id = $1", [draft.id])).rejects.toMatchObject({
        code: "TS422",
      });
      // The notice is in English: a version that does not offer English is refused (by the trigger, before the CHECK).
      await expect(tx.as(legal(), "UPDATE public.consent_configs SET languages = ARRAY['hi'] WHERE id = $1", [draft.id])).rejects.toMatchObject({
        code: "TS422",
      });
      // Org B's notice, from Org A: the trigger finds no such notice of Org A's.
      const bNotice = await draftNotice(tx, bmlOwner(), ORG_B);
      await expect(tx.as(legal(), "UPDATE public.consent_configs SET notice_id = $2 WHERE id = $1", [draft.id, bNotice.id])).rejects.toMatchObject({
        code: "TS422",
      });
    });
  });

  it("are published only on a published notice, then never change", async () => {
    await inTransaction(client, async (tx) => {
      const notice = await draftNotice(tx, legal(), ORG_A, "hi");
      const config = await draftConfig(tx, legal(), ORG_A, notice.id, ["newsletter"]);
      await tx.as(legal(), "UPDATE public.consent_configs SET languages = ARRAY['en', 'hi'] WHERE id = $1", [config.id]);
      await expect(tx.as(legal(), "UPDATE public.consent_configs SET status = 'published' WHERE id = $1", [config.id])).rejects.toMatchObject({
        code: "TS409",
      });
      await publishNotice(tx, legal(), notice.id);
      await expect(tx.as(deptOwner(), "UPDATE public.consent_configs SET status = 'published' WHERE id = $1", [config.id])).rejects.toMatchObject({
        code: "TS403",
      });
      await tx.as(legal(), "UPDATE public.consent_configs SET status = 'published' WHERE id = $1", [config.id]);
      await expect(tx.as(legal(), "UPDATE public.consent_configs SET position = 'corner' WHERE id = $1", [config.id])).rejects.toMatchObject({
        code: "TS409",
      });
      const del = await tx.as(legal(), "DELETE FROM public.consent_configs WHERE id = $1", [config.id]);
      expect(del.rowCount).toBe(0);
    });
  });
});

describe("4. consent records", () => {
  it("no user writes the table; a record never changes and is never deleted, by anyone", async () => {
    await inTransaction(client, async (tx) => {
      const rec = SEED_CONSENT_RECORDS.studentGiven.id;
      await expect(
        tx.as(legal(), "INSERT INTO public.consent_records (organization_id, config_id, principal_key, action, source) VALUES ($1, $2, repeat('a', 64), 'refused', 'staff')", [
          ORG_A,
          CONFIG,
        ]),
      ).rejects.toMatchObject({ code: "42501" });
      await expect(tx.as(muAdmin(), "UPDATE public.consent_records SET action = 'withdrawn' WHERE id = $1", [rec])).rejects.toMatchObject({ code: "42501" });
      await expect(tx.as(muAdmin(), "DELETE FROM public.consent_records WHERE id = $1", [rec])).rejects.toMatchObject({ code: "42501" });
      await expect(tx.asAdmin("UPDATE public.consent_records SET action = 'withdrawn' WHERE id = $1", [rec])).rejects.toMatchObject({ code: "TS409" });
    });
  });

  it("staff record through `record_consent`: stamped, pseudonymous, the same key for the same person, a different one in another organisation", async () => {
    await inTransaction(client, async (tx) => {
      await recordConsent(tx, legal(), ORG_A, { identifier: "  RLS-Person@Example.com ", reference: "Form 1" });
      const { rows } = await tx.asAdmin<{ principal_key: string; source: string; recorded_by: string; reference: string }>(
        "SELECT principal_key, source, recorded_by, reference FROM public.consent_records WHERE organization_id = $1 ORDER BY recorded_at DESC, id DESC LIMIT 1",
        [ORG_A],
      );
      expect(rows[0]).toMatchObject({ source: "staff", recorded_by: SEED_USERS.muLegal.id, reference: "Form 1" });
      expect(rows[0]!.principal_key).toMatch(/^[0-9a-f]{64}$/);
      // The identifier is nowhere in the row.
      const raw = await tx.asAdmin("SELECT 1 FROM public.consent_records WHERE row_to_json(consent_records)::text ILIKE '%rls-person%'");
      expect(raw.rowCount).toBe(0);
      const history = await tx.as<{ h: { principalKey: string; records: Json[] } }>(legal(), "SELECT public.consent_history($1, 'rls-person@example.com') AS h", [ORG_A]);
      expect(history.rows[0]!.h.principalKey).toBe(rows[0]!.principal_key);
      expect(history.rows[0]!.h.records).toHaveLength(1);
      const keyB = await tx.asAdmin<{ k: string }>("SELECT app.consent_principal_key($1, 'rls-person@example.com') AS k", [ORG_B]);
      expect(keyB.rows[0]!.k).not.toBe(rows[0]!.principal_key);
    });
  });

  it("finds the seeded history by the identifier, newest first: the alumnus gave, then withdrew", async () => {
    await inTransaction(client, async (tx) => {
      const { rows } = await tx.as<{ h: { records: { action: string; configVersion: number }[] } }>(
        dean(),
        "SELECT public.consent_history($1, $2) AS h",
        [ORG_A, SEED_CONSENT_RECORDS.alumnusGiven.identifier],
      );
      expect(rows[0]!.h.records.map((r) => r.action)).toEqual(["withdrawn", "given"]);
      expect(rows[0]!.h.records[0]!.configVersion).toBe(1);
    });
  });

  it("a record names only offered purposes, a basis that fits its kind, and a published widget version", async () => {
    await inTransaction(client, async (tx) => {
      await expect(recordConsent(tx, legal(), ORG_A, { purposes: ["admissions"] })).rejects.toMatchObject({ code: "TS422" });
      await expect(recordConsent(tx, legal(), ORG_A, { method: "rule_10_1_a" })).rejects.toMatchObject({ code: "TS422" });
      await expect(recordConsent(tx, legal(), ORG_A, { kind: "child", method: "rule_11_court" })).rejects.toMatchObject({ code: "TS422" });
      await expect(recordConsent(tx, legal(), ORG_A, { action: "withdrawn" })).rejects.toMatchObject({ code: "23514" });
      await expect(recordConsent(tx, legal(), ORG_A, { action: "given", purposes: [] })).rejects.toMatchObject({ code: "23514" });
      await expect(recordConsent(tx, legal(), ORG_A, { identifier: " " })).rejects.toMatchObject({ code: "TS422" });
      const draft = await draftConfig(tx, legal(), ORG_A, NOTICE, ["alumni_updates"]);
      await expect(recordConsent(tx, legal(), ORG_A, { config: draft.id })).rejects.toMatchObject({ code: "TS404" });
      await expect(recordConsent(tx, legal(), ORG_A, { kind: "guardian_ward", method: "rule_11_designated_authority" })).resolves.toBeDefined();
    });
  });

  it("the counts are over each person's LATEST record (core `countConsents`)", async () => {
    await inTransaction(client, async (tx) => {
      const facts = async () =>
        (await tx.as<{ f: { counts: Record<string, number> } }>(dean(), "SELECT public.consent_register_facts($1) AS f", [ORG_A])).rows[0]!.f.counts;
      const seeded = await facts();
      expect(Object.fromEntries(Object.entries(seeded).map(([k, v]) => [k, Number(v)]))).toEqual({
        principals: 2,
        given: 1,
        refused: 0,
        withdrawn: 1,
        onBehalf: 0,
        unverified: 0,
      });
      // The student now withdraws; a child's consent is given, unverified.
      await recordConsent(tx, legal(), ORG_A, { identifier: SEED_CONSENT_RECORDS.studentGiven.identifier, action: "withdrawn", purposes: [] });
      await recordConsent(tx, legal(), ORG_A, { identifier: "rls-child", kind: "child" });
      const after = await facts();
      expect(Number(after.withdrawn)).toBe(2);
      expect(Number(after.given)).toBe(1);
      expect(Number(after.onBehalf)).toBe(1);
      expect(Number(after.unverified)).toBe(1);
    });
  });
});

describe("5. the public functions (the server's only)", () => {
  it("answer nothing for a tenant without public pages, and the live widget version once they are open", async () => {
    await inTransaction(client, async (tx) => {
      const closed = await tx.asServer<{ w: Json | null }>("SELECT public.consent_widget('rls-mu') AS w");
      expect(closed.rows[0]!.w).toBeNull();
      await openPublicPages(tx, ORG_A, "rls-mu");
      const { rows } = await tx.asServer<{ w: { organization: Json; config: { id: string; version: number; purposes: { key: string; title: string }[] } } }>(
        "SELECT public.consent_widget('rls-mu') AS w",
      );
      expect(rows[0]!.w.config.id).toBe(CONFIG);
      // The widget version's purposes, in its order, in the words of its notice.
      expect(rows[0]!.w.config.purposes.map((p) => p.key)).toEqual(["alumni_updates", "event_photos"]);
      expect(rows[0]!.w.config.purposes[0]!.title).toBe("Alumni updates");
      expect(JSON.stringify(rows[0]!.w)).not.toContain(ORG_A);
      const notice = await tx.asServer<{ n: { notice: { version: number; language: string }; languages: string[] } }>(
        "SELECT public.consent_notice('rls-mu', 'hi') AS n",
      );
      expect(notice.rows[0]!.n.notice).toMatchObject({ version: 1, language: "en" }); // no Hindi version: English
      expect(notice.rows[0]!.n.languages).toEqual(["en"]);
    });
  });

  it("the notice page shows the LATEST published version; a draft never reaches it", async () => {
    await inTransaction(client, async (tx) => {
      await openPublicPages(tx, ORG_A, "rls-mu");
      const draft = await draftNotice(tx, legal(), ORG_A, "en");
      const before = await tx.asServer<{ n: { notice: { version: number } } }>("SELECT public.consent_notice('rls-mu', 'en') AS n");
      expect(before.rows[0]!.n.notice.version).toBe(1);
      await publishNotice(tx, legal(), draft.id);
      const after = await tx.asServer<{ n: { notice: { version: number; title: string } } }>("SELECT public.consent_notice('rls-mu', 'en') AS n");
      expect(after.rows[0]!.n.notice).toMatchObject({ version: 2, title: "RLS notice" });
    });
  });

  it("a widget record is the widget's: no verification, no person, counted; another tenant's slug never reaches this one's version", async () => {
    await inTransaction(client, async (tx) => {
      await openPublicPages(tx, ORG_A, "rls-mu");
      await openPublicPages(tx, ORG_B, "rls-bml");
      const ok = await widgetRecord(tx, "rls-mu", { kind: "child" });
      expect(ok.rows[0]!.r).toMatchObject({ status: "recorded", action: "given", purposes: ["event_photos"] });
      const row = (await tx.asAdmin<Json>("SELECT source, verification_method, recorded_by, principal_kind FROM public.consent_records WHERE organization_id = $1 ORDER BY recorded_at DESC, id DESC LIMIT 1", [ORG_A])).rows[0]!;
      expect(row).toEqual({ source: "widget", verification_method: null, recorded_by: null, principal_kind: "child" });
      const attempts = await tx.asAdmin("SELECT 1 FROM public.intake_attempts WHERE organization_id = $1 AND surface = 'consent' AND event = 'consent_record' AND email_hash IS NULL", [ORG_A]);
      expect(attempts.rowCount).toBe(1);
      // Org A's widget version through Org B's address: not found, and nothing written.
      const cross = await widgetRecord(tx, "rls-bml");
      expect(cross.rows[0]!.r).toEqual({ status: "not_found" });
      const unknown = await widgetRecord(tx, "no-such-slug");
      expect(unknown.rows[0]!.r).toEqual({ status: "not_found" });
      await expect(widgetRecord(tx, "rls-mu", { purposes: ["admissions"] })).rejects.toMatchObject({ code: "TS422" });
    });
  });

  it("the limits: ten records an hour per person, 120 an hour per client address", async () => {
    await inTransaction(client, async (tx) => {
      await openPublicPages(tx, ORG_A, "rls-mu");
      for (let i = 0; i < 10; i += 1) {
        const r = await widgetRecord(tx, "rls-mu", { identifier: "busy-person", action: i % 2 ? "withdrawn" : "given", purposes: i % 2 ? [] : ["event_photos"] });
        expect(r.rows[0]!.r.status, `record ${i + 1}`).toBe("recorded");
      }
      const eleventh = await widgetRecord(tx, "rls-mu", { identifier: "busy-person" });
      expect(eleventh.rows[0]!.r).toEqual({ status: "rate_limited", limit: "principal" });
      // 120 from one address within the hour (the ten above count too).
      const other = createHash("sha256").update("rls-campus").digest("hex");
      await tx.asAdmin(
        "INSERT INTO public.intake_attempts (organization_id, surface, event, client_hash, email_hash) SELECT $1, 'consent', 'consent_record', $2, NULL FROM generate_series(1, 120)",
        [ORG_A, other],
      );
      const blocked = await widgetRecord(tx, "rls-mu", { identifier: "campus-person", client: other });
      expect(blocked.rows[0]!.r).toEqual({ status: "rate_limited", limit: "client" });
      // An hour later, the address may record again.
      await tx.asAdmin("UPDATE public.intake_attempts SET created_at = now() - interval '61 minutes' WHERE client_hash = $1", [other]);
      expect((await widgetRecord(tx, "rls-mu", { identifier: "campus-person", client: other })).rows[0]!.r.status).toBe("recorded");
    });
  });
});

describe("6. audit", () => {
  it("a notice's draft and publication are audited by trigger — its number, language and status, never its text", async () => {
    await inTransaction(client, async (tx) => {
      const draft = await draftNotice(tx, legal(), ORG_A, "hi", "[]");
      await tx.as(legal(), "UPDATE public.privacy_notices SET purposes = $2::jsonb WHERE id = $1", [draft.id, PURPOSES]);
      await publishNotice(tx, legal(), draft.id);
      const { rows } = await tx.asAdmin<{ event_type: string; metadata: Json; user_id: string }>(
        "SELECT event_type, metadata, user_id FROM public.audit_logs WHERE entity_id = $1 ORDER BY created_at, id",
        [draft.id],
      );
      // One transaction: every row has the same created_at, so the order is not the test's to rely on.
      expect(rows.map((r) => r.event_type).sort()).toEqual([
        "consent.privacy_notices.insert",
        "consent.privacy_notices.update",
        "consent.privacy_notices.update",
      ]);
      const inserted = rows.find((r) => r.event_type === "consent.privacy_notices.insert")!;
      expect(inserted.metadata).toMatchObject({ consentVersion: 1, consentStatus: "draft", language: "hi" });
      const published = rows.find((r) => r.metadata.consentStatus === "published")!;
      expect(published.metadata).toMatchObject({ changed: ["status"] });
      expect(rows.find((r) => r.event_type.endsWith("update") && r !== published)!.metadata).toMatchObject({ changed: ["purposes"] });
      expect(rows.every((r) => r.user_id === SEED_USERS.muLegal.id)).toBe(true);
      expect(JSON.stringify(rows)).not.toContain("RLS notice");
      expect(JSON.stringify(rows)).not.toContain("Newsletter");
    });
  });

  it("a staff record is audited once, as the person, with no identifier or reference; a widget record is not audited", async () => {
    await inTransaction(client, async (tx) => {
      await recordConsent(tx, legal(), ORG_A, { identifier: "audit-person@example.com", reference: "Form 77", kind: "child", method: "rule_10_1_b_ii" });
      const { rows } = await tx.asAdmin<{ metadata: Json; user_id: string }>(
        "SELECT metadata, user_id FROM public.audit_logs WHERE organization_id = $1 AND event_type = 'consent.consent_records.insert'",
        [ORG_A],
      );
      expect(rows).toHaveLength(1);
      expect(rows[0]!.user_id).toBe(SEED_USERS.muLegal.id);
      expect(rows[0]!.metadata).toEqual({
        configVersion: 1,
        consentAction: "given",
        purposeCount: 1,
        principalKind: "child",
        verificationMethod: "rule_10_1_b_ii",
      });
      expect(JSON.stringify(rows)).not.toMatch(/audit-person|Form 77/);
      await openPublicPages(tx, ORG_A, "rls-mu");
      const before = (await tx.asAdmin("SELECT 1 FROM public.audit_logs WHERE organization_id = $1", [ORG_A])).rowCount;
      await widgetRecord(tx, "rls-mu");
      expect((await tx.asAdmin("SELECT 1 FROM public.audit_logs WHERE organization_id = $1", [ORG_A])).rowCount).toBe(before);
    });
  });
});

describe("7. model 1.3.0 in a stored snapshot", () => {
  it("an unverified child's consent sets head 3 Exposed; the verification, recorded as a new record, clears the fact", async () => {
    await inTransaction(client, async (tx) => {
      const input = async () =>
        (await tx.asAdmin<{ input: { consents: Json[] } }>("SELECT (app.exposure_input($1, current_date)) -> 'input' AS input", [ORG_A])).rows[0]!.input;
      // MU's seeded consents are adults': no fact reaches the model.
      expect((await input()).consents).toEqual([]);

      await recordConsent(tx, legal(), ORG_A, { identifier: "rls-child-1", kind: "child" });
      expect((await input()).consents).toEqual([{ principalKind: "child", action: "given", verificationMethod: null }]);
      const snapshot = async () => {
        const { rows } = await tx.as<{ id: string }>(registrar(), "SELECT public.record_exposure_snapshot($1) AS id", [ORG_A]);
        return (await tx.asAdmin<{ model_version: string; heads: { code: string; status: string; applies: boolean; reasons: { text: string }[] }[] }>(
          "SELECT model_version, heads FROM public.exposure_snapshots WHERE id = $1",
          [rows[0]!.id],
        )).rows[0]!;
      };
      const exposed = await snapshot();
      expect(exposed.model_version).toBe("1.7.0");
      const h3 = exposed.heads.find((h) => h.code === "H3")!;
      expect(h3.applies).toBe(true);
      expect(h3.status).toBe("exposed");
      expect(h3.reasons.map((r) => r.text)).toContain(
        "1 consent given on behalf of a child or a person with disability has no verification of the parent or lawful guardian recorded (s.9(1), Rules 10–11).",
      );

      // In one transaction both records would carry the same instant; in use each choice is its own
      // request. Date the first a minute back (tooling, triggers off) so "latest" is the second.
      await tx.asAdmin("SET LOCAL session_replication_role = replica");
      await tx.asAdmin("UPDATE public.consent_records SET recorded_at = recorded_at - interval '1 minute' WHERE organization_id = $1", [ORG_A]);
      await tx.asAdmin("SET LOCAL session_replication_role = origin");
      await recordConsent(tx, legal(), ORG_A, { identifier: "rls-child-1", kind: "child", method: "rule_10_1_a" });
      expect((await input()).consents).toEqual([{ principalKind: "child", action: "given", verificationMethod: "rule_10_1_a" }]);
      const cleared = (await snapshot()).heads.find((h) => h.code === "H3")!;
      expect(cleared.reasons.map((r) => r.text).join(" ")).not.toContain("no verification of the parent");
    });
  });
});
