/**
 * Slice 7 — GATE 5 (RLS) for the ROPA / Processing Activity Register.
 *
 *   1. Org A cannot see or touch Org B's records, links or ROPA gaps; anon
 *      sees nothing; composite FKs refuse a foreign link even from tooling.
 *   2. Completeness and risk are DERIVED: no user can write them, and tooling
 *      that forges one is refused by a CHECK.
 *   3. An assessor may raise the risk rating, never lower it.
 *   4. Approval takes a reviewer who is not the owner; an approved record is
 *      read-only until reopened, which starts a new version.
 *   5. ROPA gaps are derived, SELECT-only, and their actions live in the
 *      SHARED action table under D-056's closing rule, unchanged.
 *   6. evidence_links accepts a THIRD type — and the first two still behave:
 *      an answer's evidence still moves its score; an action's still does not.
 *   7. Ten records leave the `ROPA` DOMAIN score exactly where it was.
 *   8. Audit: by trigger per user write, ONCE per import, never free text.
 *
 * Every test runs inside a transaction that is rolled back. Assertions are on
 * the rows each test creates — the hosted database is not quiet (pitfall 14).
 */
import { randomUUID } from "node:crypto";
import { SEED_ASSESSMENTS, SEED_ORGS, SEED_ROPA, SEED_SCOPE, SEED_USERS } from "@truststack/db/seed-data";
import type pg from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { authSubjects, connect, inTransaction, type Tx } from "./db";

const ORG_A = SEED_ORGS.mumbaiUniversity.id;
const ORG_B = SEED_ORGS.bharatManufacturing.id;
const MU = SEED_SCOPE.mumbaiUniversity;
const BML = SEED_SCOPE.bharatManufacturing;

let client: pg.Client;
let who: Map<string, { sub: string; email: string }>;
const u = (id: string) => who.get(id)!;
const consultant = () => u(SEED_USERS.consultant.id); // ropa.write + evidence.review
const registrar = () => u(SEED_USERS.mumbaiUniversity.id); // dpdp_owner: the same
const legal = () => u(SEED_USERS.muLegal.id); // contributor: ropa.write, NO evidence.review
const dean = () => u(SEED_USERS.muDean.id); // executive sponsor: ropa.read only
const bmlOwner = () => u(SEED_USERS.bharatManufacturing.id);
type Actor = { sub: string; email: string };

beforeAll(async () => {
  client = await connect();
  who = await authSubjects(client, Object.values(SEED_USERS).map((x) => x.id));
});
afterAll(async () => {
  await client?.end();
});

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

/** Complete in every area but evidence (96/100) — unless the test says otherwise. */
const COMPLETE = {
  name: "RLS processing activity",
  department_text: "Admissions",
  data_principal_types: "Applicants",
  data_categories: "Name, email, marks",
  purpose: "Admission eligibility",
  legal_basis_note: "Consent at application",
  collection_source: "Admission portal",
  systems_text: "Admission portal",
  vendors_text: "None",
  notice_linked: "Admission notice v1",
  consent_linked: "Consent at application",
  retention_rule: "Seven years",
  security_safeguards: "RBAC, encryption",
  children_data: "no",
  cross_border: "no",
  ai_processing: "no",
  high_risk_documents: "no",
  next_review_at: "2099-12-31",
  // D-065
  lawful_basis: "consent",
  retention_trigger: "purpose_served",
  safeguards: ["encryption", "access_control", "logging", "backups", "log_retention", "organisational"],
};

interface Rec {
  id: string;
  name: string;
  record_code: string;
  status: string;
  version: number;
  completeness_score: number;
  completeness_band: string;
  completeness_missing: string[];
  risk_factors: string[];
  risk_points: number;
  risk_rating_derived: string;
  risk_rating_assessor: string | null;
  risk_rating: string;
  evidence_count: number;
  system_link_count: number;
  vendor_link_count: number;
  approved_by: string | null;
  owner_user_id: string | null;
  created_by: string | null;
}

/** Insert a record AS A USER (or as tooling with `actor = null`), with these columns. */
async function createRecord(
  tx: Tx,
  actor: Actor | null,
  columns: Record<string, unknown> = {},
  organizationId: string = ORG_A as string,
): Promise<Rec> {
  const cols = { ...COMPLETE, name: `RLS ROPA ${randomUUID()}`, ...columns };
  const keys = Object.keys(cols);
  const sql = `INSERT INTO public.ropa_records (organization_id, ${keys.join(", ")})
     VALUES ($1, ${keys.map((_, i) => `$${i + 2}`).join(", ")}) RETURNING *`;
  const params = [organizationId, ...Object.values(cols)];
  const { rows } = actor === null ? await tx.asAdmin<Rec>(sql, params) : await tx.as<Rec>(actor, sql, params);
  return rows[0]!;
}

const read = async (tx: Tx, id: string) =>
  (await tx.asAdmin<Rec>("SELECT * FROM public.ropa_records WHERE id = $1", [id])).rows[0]!;

const setRecord = (tx: Tx, actor: Actor, id: string, set: string, params: unknown[] = []) =>
  tx.as<Rec>(actor, `UPDATE public.ropa_records SET ${set} WHERE id = $1 RETURNING *`, [id, ...params]);

/** A stored artefact (an object exists at its path), optionally reviewed. */
async function storedEvidence(tx: Tx, organizationId: string = ORG_A, review: { status: string; level: number } | null = null) {
  const id = randomUUID();
  const filePath = `organizations/${organizationId}/evidence/${id}/proof.pdf`;
  const uploader = organizationId === ORG_A ? SEED_USERS.mumbaiUniversity.id : SEED_USERS.bharatManufacturing.id;
  await tx.asAdmin("INSERT INTO storage.objects (bucket_id, name) VALUES ('evidence', $1)", [filePath]);
  await tx.asAdmin(
    `INSERT INTO public.evidence (id, organization_id, storage_path, file_name, content_type, byte_size, uploaded_by,
       review_status, evidence_level, reviewed_by, reviewed_at)
     VALUES ($1, $2, $3, 'proof.pdf', 'application/pdf', 1024, $4, $5, $6, $7, $8)`,
    [
      id,
      organizationId,
      filePath,
      uploader,
      review?.status ?? "pending",
      review?.level ?? null,
      review ? SEED_USERS.consultant.id : null,
      review ? new Date() : null,
    ],
  );
  return id;
}

const linkEvidence = (tx: Tx, actor: Actor, evidenceId: string, type: string, targetId: string, organizationId: string = ORG_A) =>
  tx.as(
    actor,
    `INSERT INTO public.evidence_links (organization_id, evidence_id, linked_entity_type, linked_entity_id)
     VALUES ($1, $2, $3, $4) RETURNING id`,
    [organizationId, evidenceId, type, targetId],
  );

const generate = (tx: Tx, actor: Actor, organizationId: string = ORG_A) =>
  tx.as<{ result: Record<string, number> }>(actor, "SELECT public.generate_ropa_gaps($1) AS result", [organizationId]);

async function ropaGapsOf(tx: Tx, recordId: string) {
  const { rows } = await tx.asAdmin<{ id: string; gap_code: string; severity: string; priority: string; state: string }>(
    "SELECT id, gap_code, severity, priority, state FROM public.ropa_gaps WHERE ropa_record_id = $1 ORDER BY gap_code",
    [recordId],
  );
  return rows;
}

async function actionOf(tx: Tx, ropaGapId: string) {
  const { rows } = await tx.asAdmin<{ id: string; gap_id: string | null; ropa_gap_id: string; status: string; due_date: string | null; owner_user_id: string | null }>(
    "SELECT id, gap_id, ropa_gap_id, status, due_date::text AS due_date, owner_user_id FROM public.gap_actions WHERE ropa_gap_id = $1",
    [ropaGapId],
  );
  return rows;
}

// ---------------------------------------------------------------------------
// 1. Tenancy
// ---------------------------------------------------------------------------

describe("Org A cannot reach Org B's register", () => {
  it("Org B's member sees none of Org A's records, links or ROPA gaps", async () => {
    await inTransaction(client, async (tx) => {
      const rec = await createRecord(tx, null);
      await tx.asAdmin("SELECT app.refresh_ropa_gaps($1)", [ORG_A]);
      for (const table of ["ropa_records", "ropa_systems", "ropa_vendors", "ropa_gaps"]) {
        const { rows } = await tx.as(bmlOwner(), `SELECT 1 FROM public.${table} WHERE organization_id = $1`, [ORG_A]);
        expect(rows, table).toHaveLength(0);
      }
      const { rows } = await tx.as(bmlOwner(), "SELECT 1 FROM public.ropa_records WHERE id = $1", [rec.id]);
      expect(rows).toHaveLength(0);
      // …while Org A's own members do see them.
      expect((await tx.as(dean(), "SELECT 1 FROM public.ropa_records WHERE id = $1", [rec.id])).rows).toHaveLength(1);
    });
  });

  it("the seeded MU register is visible to MU and invisible to BML", async () => {
    await inTransaction(client, async (tx) => {
      const ids = Object.values(SEED_ROPA.records).map((r) => r.id);
      const mine = await tx.as(registrar(), "SELECT id FROM public.ropa_records WHERE id = ANY($1::uuid[])", [ids]);
      expect(mine.rows).toHaveLength(10);
      const theirs = await tx.as(bmlOwner(), "SELECT id FROM public.ropa_records WHERE id = ANY($1::uuid[])", [ids]);
      expect(theirs.rows).toHaveLength(0);
    });
  });

  it("Org B cannot create a record in Org A, nor update or archive one", async () => {
    await inTransaction(client, async (tx) => {
      await expect(createRecord(tx, bmlOwner(), {}, ORG_A)).rejects.toMatchObject({ code: "42501" });
      const rec = await createRecord(tx, null);
      const { rows } = await setRecord(tx, bmlOwner(), rec.id, "name = 'Hijacked'");
      expect(rows).toHaveLength(0);
      expect((await setRecord(tx, bmlOwner(), rec.id, "status = 'archived'")).rows).toHaveLength(0);
      expect((await read(tx, rec.id)).name).not.toBe("Hijacked");
    });
  });

  it("anon sees nothing and writes nothing", async () => {
    await inTransaction(client, async (tx) => {
      await expect(tx.as(null, "SELECT 1 FROM public.ropa_records")).rejects.toMatchObject({ code: "42501" });
      await expect(tx.as(null, "SELECT 1 FROM public.ropa_gaps")).rejects.toMatchObject({ code: "42501" });
    });
  });

  it("a composite FK refuses Org B's system, vendor or department on Org A's record — even from tooling", async () => {
    await inTransaction(client, async (tx) => {
      const rec = await createRecord(tx, null);
      await expect(
        tx.asAdmin("INSERT INTO public.ropa_systems (organization_id, ropa_record_id, system_id) VALUES ($1, $2, $3)", [
          ORG_A,
          rec.id,
          BML.systems.hrms.id,
        ]),
      ).rejects.toMatchObject({ code: "23503" });
      await expect(
        tx.asAdmin("INSERT INTO public.ropa_vendors (organization_id, ropa_record_id, vendor_id) VALUES ($1, $2, $3)", [
          ORG_A,
          rec.id,
          BML.vendors.payrollBureau.id,
        ]),
      ).rejects.toMatchObject({ code: "23503" });
      await expect(tx.asAdmin("UPDATE public.ropa_records SET department_id = $2 WHERE id = $1", [rec.id, BML.departments.hr.id])).rejects.toMatchObject({
        code: "23503",
      });
    });
  });

  it("Org B cannot generate Org A's ROPA gaps, nor import into Org A", async () => {
    await inTransaction(client, async (tx) => {
      await expect(generate(tx, bmlOwner(), ORG_A)).rejects.toMatchObject({ code: "TS403" });
      await expect(
        tx.as(bmlOwner(), "SELECT public.import_ropa_records($1, $2::jsonb)", [ORG_A, JSON.stringify([{ name: "x" }])]),
      ).rejects.toMatchObject({ code: "TS403" });
    });
  });

  it("an owner from another organisation is refused", async () => {
    await inTransaction(client, async (tx) => {
      await expect(createRecord(tx, registrar(), { owner_user_id: SEED_USERS.bharatManufacturing.id })).rejects.toMatchObject({
        code: "TS422",
      });
    });
  });

  it("evidence from Org B cannot be linked to Org A's record", async () => {
    await inTransaction(client, async (tx) => {
      const rec = await createRecord(tx, null);
      const foreign = await storedEvidence(tx, ORG_B);
      // The trigger looks the artefact up in THIS organisation first; the composite FK would refuse it next.
      await expect(linkEvidence(tx, registrar(), foreign, "ropa_record", rec.id)).rejects.toMatchObject({ code: "TS404" });
      // …and Org A's record cannot be targeted from Org B, under Org B's id.
      await expect(linkEvidence(tx, bmlOwner(), foreign, "ropa_record", rec.id, ORG_B)).rejects.toMatchObject({ code: "TS404" });
    });
  });
});

// ---------------------------------------------------------------------------
// 2. Derived, not sent
// ---------------------------------------------------------------------------

describe("completeness and risk are derived by the database, never sent", () => {
  it("a new record is scored on write: complete but for evidence → 96, Strong", async () => {
    await inTransaction(client, async (tx) => {
      const rec = await createRecord(tx, registrar());
      expect(rec).toMatchObject({
        status: "draft",
        version: 1,
        completeness_score: 96 - 8 /* no owner */,
        completeness_band: "strong",
        completeness_missing: ["department_owner", "evidence"],
        created_by: SEED_USERS.mumbaiUniversity.id,
      });
      expect(rec.record_code).toMatch(/^ROPA-\d{3,}$/);
    });
  });

  it("no user can INSERT or UPDATE a derived column — there is no grant", async () => {
    await inTransaction(client, async (tx) => {
      await expect(createRecord(tx, registrar(), { completeness_score: 100 })).rejects.toMatchObject({ code: "42501" });
      const rec = await createRecord(tx, registrar());
      for (const set of [
        "completeness_score = 100",
        "completeness_band = 'strong'",
        "risk_rating = 'low'",
        "risk_rating_derived = 'low'",
        "risk_factors = '{}'",
        "evidence_count = 9",
        "version = 7",
        "approved_by = id",
      ]) {
        await expect(setRecord(tx, registrar(), rec.id, set), set).rejects.toMatchObject({ code: "42501" });
      }
      // …and no DELETE: a record is archived, never removed.
      await expect(tx.as(registrar(), "DELETE FROM public.ropa_records WHERE id = $1", [rec.id])).rejects.toMatchObject({
        code: "42501",
      });
    });
  });

  it("tooling that forges a score with the trigger disabled is refused by a CHECK", async () => {
    await inTransaction(client, async (tx) => {
      const rec = await createRecord(tx, null);
      await tx.asAdmin("ALTER TABLE public.ropa_records DISABLE TRIGGER ropa_records_before_write");
      await expect(
        tx.asAdmin("UPDATE public.ropa_records SET completeness_score = 100 WHERE id = $1", [rec.id]),
      ).rejects.toMatchObject({ code: "23514", constraint: "ropa_records_score_is_derived" });
      await expect(
        tx.asAdmin("UPDATE public.ropa_records SET risk_rating = 'low', risk_rating_derived = 'low' WHERE id = $1 AND risk_rating = 'high'", [rec.id]),
      ).resolves.toBeDefined();
      await expect(
        tx.asAdmin("UPDATE public.ropa_records SET risk_points = 0, risk_rating_derived = 'low', risk_rating = 'low' WHERE id = $1", [rec.id]),
      ).rejects.toMatchObject({ code: "23514", constraint: "ropa_records_points_are_derived" });
      await expect(
        tx.asAdmin("UPDATE public.ropa_records SET completeness_missing = '{}' WHERE id = $1", [rec.id]),
      ).rejects.toMatchObject({ code: "23514", constraint: "ropa_records_missing_is_derived" });
      await tx.asAdmin("ALTER TABLE public.ropa_records ENABLE TRIGGER ropa_records_before_write");
    });
  });

  it("'Unknown' fields are incomplete, an undecided ground leaves purpose incomplete, and the risk rises with them (D-026)", async () => {
    await inTransaction(client, async (tx) => {
      const rec = await createRecord(tx, registrar(), { retention_rule: "Unknown", lawful_basis: null });
      expect(rec.completeness_missing).toEqual(["department_owner", "purpose_basis", "retention", "evidence"]);
      expect(rec.completeness_score).toBe(100 - 8 - 10 - 8 - 4);
      expect(rec.risk_factors).toContain("no_retention");
    });
  });

  it("linking a system or vendor updates the counts the database keeps — users cannot", async () => {
    await inTransaction(client, async (tx) => {
      const rec = await createRecord(tx, registrar(), { vendors_text: "Cloud provider, SMS vendor" });
      expect(rec.vendor_link_count).toBe(0);
      expect(rec.risk_factors).toContain("multiple_vendors");
      await tx.as(registrar(), "INSERT INTO public.ropa_systems (organization_id, ropa_record_id, system_id) VALUES ($1, $2, $3)", [
        ORG_A,
        rec.id,
        MU.systems.sis.id,
      ]);
      await tx.as(registrar(), "INSERT INTO public.ropa_vendors (organization_id, ropa_record_id, vendor_id) VALUES ($1, $2, $3)", [
        ORG_A,
        rec.id,
        MU.vendors.lmsProvider.id,
      ]);
      expect(await read(tx, rec.id)).toMatchObject({ system_link_count: 1, vendor_link_count: 1 });
      await tx.as(registrar(), "DELETE FROM public.ropa_systems WHERE ropa_record_id = $1", [rec.id]);
      expect((await read(tx, rec.id)).system_link_count).toBe(0);
    });
  });

  it("a linked system cannot be deleted from the register while a record uses it", async () => {
    await inTransaction(client, async (tx) => {
      const rec = await createRecord(tx, registrar());
      await tx.as(registrar(), "INSERT INTO public.ropa_systems (organization_id, ropa_record_id, system_id) VALUES ($1, $2, $3)", [
        ORG_A,
        rec.id,
        MU.systems.website.id,
      ]);
      await expect(tx.as(registrar(), "DELETE FROM public.systems WHERE id = $1", [MU.systems.website.id])).rejects.toMatchObject({
        code: "23503",
      });
    });
  });

  it("a record code is unique per organisation, case-insensitively, and assigned when missing", async () => {
    await inTransaction(client, async (tx) => {
      await expect(createRecord(tx, registrar(), { record_code: "ropa-001" })).rejects.toMatchObject({ code: "23505" });
      const a = await createRecord(tx, registrar());
      const b = await createRecord(tx, registrar());
      expect(Number(b.record_code.slice(5))).toBe(Number(a.record_code.slice(5)) + 1);
      // Another organisation numbers from its own register.
      const other = await createRecord(tx, bmlOwner(), {}, ORG_B);
      expect(other.record_code).toBe("ROPA-001");
    });
  });
});

// ---------------------------------------------------------------------------
// 3. Risk
// ---------------------------------------------------------------------------

describe("an assessor may raise the risk rating, never lower it", () => {
  it("raising is stored and shown", async () => {
    await inTransaction(client, async (tx) => {
      const rec = await createRecord(tx, registrar());
      expect(rec.risk_rating_derived).toBe("low");
      const [raised] = (
        await setRecord(tx, registrar(), rec.id, "risk_rating_assessor = 'high', risk_rating_assessor_reason = 'Sensitive cohort'")
      ).rows;
      expect(raised).toMatchObject({ risk_rating_derived: "low", risk_rating_assessor: "high", risk_rating: "high" });
    });
  });

  it("lowering below the derived floor is refused", async () => {
    await inTransaction(client, async (tx) => {
      // children 3 + AI 2 + documents 2 + no evidence 1 = 8: High.
      const high = { owner_user_id: SEED_USERS.mumbaiUniversity.id, children_data: "yes", ai_processing: "yes", high_risk_documents: "yes" };
      const rec = await createRecord(tx, registrar(), high);
      expect(rec.risk_rating_derived).toBe("high");
      await expect(setRecord(tx, registrar(), rec.id, "risk_rating_assessor = 'low'")).rejects.toMatchObject({ code: "TS422" });
      await expect(createRecord(tx, registrar(), { ...high, risk_rating_assessor: "medium", risk_rating_assessor_reason: "x" })).rejects.toMatchObject({
        code: "TS422",
      });
    });
  });

  it("if the derived floor later rises above a raise, the floor wins", async () => {
    await inTransaction(client, async (tx) => {
      const rec = await createRecord(tx, registrar(), {
        owner_user_id: SEED_USERS.mumbaiUniversity.id,
        risk_rating_assessor: "medium",
        risk_rating_assessor_reason: "Volume expected to grow",
      });
      expect(rec.risk_rating).toBe("medium");
      const [after] = (await setRecord(tx, registrar(), rec.id, "children_data = 'yes', ai_processing = 'yes', high_risk_documents = 'yes'")).rows;
      expect(after).toMatchObject({ risk_rating_derived: "high", risk_rating_assessor: "medium", risk_rating: "high" });
    });
  });
});

// ---------------------------------------------------------------------------
// 4. Lifecycle
// ---------------------------------------------------------------------------

describe("approval takes two people, and an approved record is read-only", () => {
  async function inReview(tx: Tx, owner: string) {
    const rec = await createRecord(tx, registrar(), { owner_user_id: owner });
    await setRecord(tx, registrar(), rec.id, "status = 'in_review'");
    return rec;
  }

  it("the owner cannot approve their own record", async () => {
    await inTransaction(client, async (tx) => {
      const rec = await inReview(tx, SEED_USERS.mumbaiUniversity.id);
      await expect(setRecord(tx, registrar(), rec.id, "status = 'approved'")).rejects.toMatchObject({ code: "TS403" });
    });
  });

  it("a contributor without evidence.review cannot approve", async () => {
    await inTransaction(client, async (tx) => {
      const rec = await inReview(tx, SEED_USERS.mumbaiUniversity.id);
      await expect(setRecord(tx, legal(), rec.id, "status = 'approved'")).rejects.toMatchObject({ code: "TS403" });
    });
  });

  it("a reviewer who is not the owner approves — stamped by the database", async () => {
    await inTransaction(client, async (tx) => {
      const rec = await inReview(tx, SEED_USERS.mumbaiUniversity.id);
      const [approved] = (await setRecord(tx, consultant(), rec.id, "status = 'approved'")).rows;
      expect(approved).toMatchObject({ status: "approved", approved_by: SEED_USERS.consultant.id, version: 1 });
    });
  });

  it("never straight from Draft, and never without an owner", async () => {
    await inTransaction(client, async (tx) => {
      const draft = await createRecord(tx, registrar(), { owner_user_id: SEED_USERS.mumbaiUniversity.id });
      await expect(setRecord(tx, consultant(), draft.id, "status = 'approved'")).rejects.toMatchObject({ code: "TS409" });
      const unowned = await createRecord(tx, registrar());
      await setRecord(tx, registrar(), unowned.id, "status = 'in_review'");
      await expect(setRecord(tx, consultant(), unowned.id, "status = 'approved'")).rejects.toMatchObject({ code: "TS409" });
    });
  });

  it("a record below Usable cannot be approved", async () => {
    await inTransaction(client, async (tx) => {
      const thin = await createRecord(tx, registrar(), {
        owner_user_id: SEED_USERS.mumbaiUniversity.id,
        data_categories: null,
        purpose: null,
        collection_source: null,
        retention_rule: null,
        security_safeguards: null,
        safeguards: [],
      });
      expect(thin.completeness_score).toBeLessThanOrEqual(60);
      await setRecord(tx, registrar(), thin.id, "status = 'in_review'");
      await expect(setRecord(tx, consultant(), thin.id, "status = 'approved'")).rejects.toMatchObject({ code: "TS409" });
    });
  });

  it("no self-approval is a CHECK, so it binds tooling too", async () => {
    await inTransaction(client, async (tx) => {
      const rec = await createRecord(tx, null, { owner_user_id: SEED_USERS.consultant.id });
      await tx.asAdmin("ALTER TABLE public.ropa_records DISABLE TRIGGER ropa_records_before_write");
      await expect(
        tx.asAdmin("UPDATE public.ropa_records SET status = 'approved', approved_at = now(), approved_by = owner_user_id WHERE id = $1", [rec.id]),
      ).rejects.toMatchObject({ code: "23514", constraint: "ropa_records_no_self_approval" });
      await tx.asAdmin("ALTER TABLE public.ropa_records ENABLE TRIGGER ropa_records_before_write");
    });
  });

  it("an approved record cannot be edited, re-linked or stripped of evidence — reopening it starts version 2", async () => {
    await inTransaction(client, async (tx) => {
      const rec = await inReview(tx, SEED_USERS.mumbaiUniversity.id);
      const evidence = await storedEvidence(tx);
      await linkEvidence(tx, registrar(), evidence, "ropa_record", rec.id);
      await setRecord(tx, consultant(), rec.id, "status = 'approved'");

      await expect(setRecord(tx, registrar(), rec.id, "purpose = 'Something else'")).rejects.toMatchObject({ code: "TS409" });
      await expect(
        tx.as(registrar(), "INSERT INTO public.ropa_systems (organization_id, ropa_record_id, system_id) VALUES ($1, $2, $3)", [
          ORG_A,
          rec.id,
          MU.systems.lms.id,
        ]),
      ).rejects.toMatchObject({ code: "TS409" });
      await expect(
        tx.as(registrar(), "DELETE FROM public.evidence_links WHERE linked_entity_type = 'ropa_record' AND linked_entity_id = $1", [rec.id]),
      ).rejects.toMatchObject({ code: "TS409" });

      const [reopened] = (await setRecord(tx, registrar(), rec.id, "status = 'draft'")).rows;
      expect(reopened).toMatchObject({ status: "draft", version: 2, approved_by: null });
      const [edited] = (await setRecord(tx, registrar(), rec.id, "purpose = 'Something else'")).rows;
      expect(edited!.status).toBe("draft");
    });
  });

  it("an archived record is read-only, opens no gap, and takes no evidence", async () => {
    await inTransaction(client, async (tx) => {
      const rec = await createRecord(tx, registrar());
      await setRecord(tx, registrar(), rec.id, "status = 'archived'");
      await expect(setRecord(tx, registrar(), rec.id, "name = 'Edited'")).rejects.toMatchObject({ code: "TS409" });
      await expect(linkEvidence(tx, registrar(), await storedEvidence(tx), "ropa_record", rec.id)).rejects.toMatchObject({
        code: "TS409",
      });
      await tx.asAdmin("SELECT app.refresh_ropa_gaps($1)", [ORG_A]);
      expect(await ropaGapsOf(tx, rec.id)).toEqual([]);
      // Restoring is a move to Draft.
      expect((await setRecord(tx, registrar(), rec.id, "status = 'draft'")).rows[0]!.status).toBe("draft");
    });
  });

  it("an executive sponsor (ropa.read only) can read but not write", async () => {
    await inTransaction(client, async (tx) => {
      await expect(createRecord(tx, dean())).rejects.toMatchObject({ code: "42501" });
      const rec = await createRecord(tx, null);
      expect((await setRecord(tx, dean(), rec.id, "name = 'x'")).rows).toHaveLength(0);
    });
  });
});

// ---------------------------------------------------------------------------
// 5. ROPA gaps on the SHARED action table
// ---------------------------------------------------------------------------

describe("ROPA gaps are derived, and their actions share the workflow (D-060)", () => {
  it("a record opens the gaps its fields call for — and each has ONE action, in gap_actions", async () => {
    await inTransaction(client, async (tx) => {
      const rec = await createRecord(tx, registrar(), {
        children_data: "unknown",
        retention_rule: "Define retention",
        vendors_text: "Cloud provider",
        next_review_at: "2020-01-01",
      });
      const { rows } = await generate(tx, registrar());
      expect(rows[0]!.result.gapCount).toBeGreaterThan(0);
      const gaps = await ropaGapsOf(tx, rec.id);
      expect(gaps.map((g) => `${g.gap_code}:${g.severity}:${g.priority}`)).toEqual([
        "child_consent_missing:critical:P0",
        "child_tracking:critical:P0",
        "no_owner:high:P1",
        "retention_missing:high:P1",
        "review_overdue:medium:P2",
        "vendor_unmapped:medium:P2",
      ]);
      for (const g of gaps) {
        const actions = await actionOf(tx, g.id);
        expect(actions).toHaveLength(1);
        expect(actions[0]).toMatchObject({ gap_id: null, ropa_gap_id: g.id, status: "open", owner_user_id: null });
      }
      // Due 30 / 60 / 90 days out, like every other action.
      const critical = await actionOf(tx, gaps[0]!.id);
      expect(critical[0]!.due_date).not.toBeNull();
    });
  });

  it("generating twice changes nothing", async () => {
    await inTransaction(client, async (tx) => {
      await createRecord(tx, registrar(), { owner_user_id: null });
      await generate(tx, registrar());
      const { rows } = await generate(tx, registrar());
      expect(rows[0]!.result).toMatchObject({ opened: 0, removed: 0, superseded: 0 });
    });
  });

  it("an empty register — Bharat Manufacturing's — opens ONE critical organisation-level gap", async () => {
    await inTransaction(client, async (tx) => {
      await tx.asAdmin("DELETE FROM public.ropa_records WHERE organization_id = $1", [ORG_B]);
      await generate(tx, bmlOwner(), ORG_B);
      const { rows } = await tx.asAdmin<{ gap_code: string; severity: string; ropa_record_id: string | null }>(
        "SELECT gap_code, severity, ropa_record_id FROM public.ropa_gaps WHERE organization_id = $1",
        [ORG_B],
      );
      expect(rows).toEqual([{ gap_code: "no_records", severity: "critical", ropa_record_id: null }]);
    });
  });

  it("no user can write a ROPA gap — SELECT only — and no user inserts an action", async () => {
    await inTransaction(client, async (tx) => {
      const rec = await createRecord(tx, registrar());
      await expect(
        tx.as(registrar(), "INSERT INTO public.ropa_gaps (organization_id, ropa_record_id, gap_code, severity, priority, finding, recommended_fix) VALUES ($1, $2, 'no_owner', 'high', 'P1', 'x', 'y')", [
          ORG_A,
          rec.id,
        ]),
      ).rejects.toMatchObject({ code: "42501" });
      await generate(tx, registrar());
      const [gap] = await ropaGapsOf(tx, rec.id);
      await expect(tx.as(registrar(), "UPDATE public.ropa_gaps SET severity = 'low' WHERE id = $1", [gap!.id])).rejects.toMatchObject({
        code: "42501",
      });
      await expect(tx.as(registrar(), "DELETE FROM public.ropa_gaps WHERE id = $1", [gap!.id])).rejects.toMatchObject({ code: "42501" });
    });
  });

  it("a forged severity is refused even from tooling", async () => {
    await inTransaction(client, async (tx) => {
      const rec = await createRecord(tx, null);
      await tx.asAdmin("SELECT app.refresh_ropa_gaps($1)", [ORG_A]);
      const [gap] = await ropaGapsOf(tx, rec.id);
      await expect(tx.asAdmin("UPDATE public.ropa_gaps SET severity = 'low', priority = 'P3' WHERE id = $1", [gap!.id])).rejects.toMatchObject({
        code: "23514",
        constraint: "ropa_gaps_severity_is_derived",
      });
    });
  });

  it("an action has exactly one parent — never both, never neither", async () => {
    await inTransaction(client, async (tx) => {
      const rec = await createRecord(tx, null);
      await tx.asAdmin("SELECT app.refresh_ropa_gaps($1)", [ORG_A]);
      const [gap] = await ropaGapsOf(tx, rec.id);
      await expect(
        tx.asAdmin("INSERT INTO public.gap_actions (organization_id, title) VALUES ($1, 'orphan')", [ORG_A]),
      ).rejects.toMatchObject({ code: "23514", constraint: "gap_actions_one_parent" });
      const [action] = await actionOf(tx, gap!.id);
      await expect(
        tx.as(registrar(), "UPDATE public.gap_actions SET status = 'in_progress' WHERE id = $1 AND ropa_gap_id IS NOT NULL RETURNING id", [action!.id]),
      ).resolves.toMatchObject({ rowCount: 1 });
    });
  });

  it("a ROPA action obeys D-056 unchanged: no owner → refused; owner closing alone → refused; a reviewer who is not the owner → closed", async () => {
    await inTransaction(client, async (tx) => {
      const rec = await createRecord(tx, registrar());
      await generate(tx, registrar());
      const [gap] = (await ropaGapsOf(tx, rec.id)).filter((g) => g.gap_code === "no_owner");
      const [action] = await actionOf(tx, gap!.id);
      const close = (actor: Actor) => tx.as(actor, "UPDATE public.gap_actions SET status = 'closed' WHERE id = $1 RETURNING closure_basis", [action!.id]);

      await expect(close(consultant())).rejects.toMatchObject({ code: "TS409" }); // no owner
      await tx.as(registrar(), "UPDATE public.gap_actions SET owner_user_id = $2 WHERE id = $1", [action!.id, SEED_USERS.muLegal.id]);
      await expect(close(legal())).rejects.toMatchObject({ code: "TS409" }); // the owner, no evidence, no review right
      const { rows } = await close(consultant());
      expect(rows[0]).toEqual({ closure_basis: "reviewer_approval" });
    });
  });

  it("…and accepted evidence on a ROPA action closes it on evidence", async () => {
    await inTransaction(client, async (tx) => {
      const rec = await createRecord(tx, registrar());
      await generate(tx, registrar());
      const [gap] = (await ropaGapsOf(tx, rec.id)).filter((g) => g.gap_code === "no_owner");
      const [action] = await actionOf(tx, gap!.id);
      await tx.as(registrar(), "UPDATE public.gap_actions SET owner_user_id = $2 WHERE id = $1", [action!.id, SEED_USERS.muLegal.id]);
      const accepted = await storedEvidence(tx, ORG_A, { status: "adequate", level: 4 });
      await linkEvidence(tx, legal(), accepted, "gap_action", action!.id);
      const { rows } = await tx.as(legal(), "UPDATE public.gap_actions SET status = 'closed' WHERE id = $1 RETURNING closure_basis", [action!.id]);
      expect(rows[0]).toEqual({ closure_basis: "evidence" });
    });
  });

  it("a resolved gap whose action carries work is superseded, not deleted (D-057)", async () => {
    await inTransaction(client, async (tx) => {
      const rec = await createRecord(tx, registrar());
      await generate(tx, registrar());
      const [gap] = (await ropaGapsOf(tx, rec.id)).filter((g) => g.gap_code === "no_owner");
      const [action] = await actionOf(tx, gap!.id);
      await tx.as(registrar(), "UPDATE public.gap_actions SET notes = 'Started' WHERE id = $1", [action!.id]);
      await setRecord(tx, registrar(), rec.id, "owner_user_id = $2", [SEED_USERS.mumbaiUniversity.id]);
      await generate(tx, registrar());
      expect((await ropaGapsOf(tx, rec.id)).find((g) => g.gap_code === "no_owner")).toMatchObject({ state: "superseded" });
      expect(await actionOf(tx, gap!.id)).toHaveLength(1);
    });
  });
});

// ---------------------------------------------------------------------------
// 6. Evidence — the third type, and the first two still behave
// ---------------------------------------------------------------------------

describe("evidence_links: a ROPA record is a third target", () => {
  it("linking a stored artefact completes the record's evidence area; detaching re-derives it", async () => {
    await inTransaction(client, async (tx) => {
      const rec = await createRecord(tx, registrar());
      const evidence = await storedEvidence(tx);
      await linkEvidence(tx, legal(), evidence, "ropa_record", rec.id);
      const linked = await read(tx, rec.id);
      expect(linked).toMatchObject({ evidence_count: 1, completeness_score: rec.completeness_score + 4 });
      expect(linked.risk_factors).not.toContain("no_security_evidence");
      await tx.as(legal(), "DELETE FROM public.evidence_links WHERE evidence_id = $1", [evidence]);
      expect(await read(tx, rec.id)).toMatchObject({ evidence_count: 0, completeness_score: rec.completeness_score });
    });
  });

  it("an upload that never arrived cannot be linked (D-039 / D-042)", async () => {
    await inTransaction(client, async (tx) => {
      const rec = await createRecord(tx, registrar());
      const id = randomUUID();
      await tx.asAdmin(
        "INSERT INTO public.evidence (id, organization_id, storage_path, file_name, content_type, byte_size) VALUES ($1, $2, $3, 'x.pdf', 'application/pdf', 1)",
        [id, ORG_A, `organizations/${ORG_A}/evidence/${id}/x.pdf`],
      );
      await expect(linkEvidence(tx, registrar(), id, "ropa_record", rec.id)).rejects.toMatchObject({ code: "TS409" });
    });
  });

  it("an executive sponsor (no ropa.write) cannot attach evidence to a record", async () => {
    await inTransaction(client, async (tx) => {
      const rec = await createRecord(tx, null);
      await expect(linkEvidence(tx, dean(), await storedEvidence(tx), "ropa_record", rec.id)).rejects.toBeDefined();
    });
  });

  it("an unknown target type is refused", async () => {
    await inTransaction(client, async (tx) => {
      // The trigger refuses it with a message; the CHECK would refuse it next.
      await expect(linkEvidence(tx, registrar(), await storedEvidence(tx), "ropa_gap", randomUUID())).rejects.toMatchObject({
        code: "TS422",
      });
    });
  });

  /** Re-running Slice 6's test of the first two types, on the widened triggers. */
  it("the two earlier types still behave: an ANSWER's evidence moves its score; an ACTION's does not touch the answer at all", async () => {
    await inTransaction(client, async (tx) => {
      const { rows } = await tx.asAdmin<{ id: string }>(
        "INSERT INTO public.assessments (organization_id, name, status) VALUES ($1, 'RLS ropa ' || gen_random_uuid(), 'draft') RETURNING id",
        [ORG_A],
      );
      const assessmentId = rows[0]!.id;
      await tx.asAdmin(
        `INSERT INTO public.assessment_questions (organization_id, assessment_id, question_code, question_version, question_text,
           domain_code, domain_weight, applicability, priority, evidence_guidance, suggested_owner, pack_code, sort_order, included_reason)
         SELECT $1, $2, question_code, question_version, question_text, domain_code, domain_weight, applicability,
           priority, evidence_guidance, suggested_owner, pack_code, sort_order, included_reason
         FROM public.assessment_questions WHERE assessment_id = $3 AND question_code = 'G1.1'`,
        [ORG_A, assessmentId, SEED_ASSESSMENTS.muBaseline.id],
      );
      const response = (
        await tx.asAdmin<{ id: string }>(
          `INSERT INTO public.assessment_responses (organization_id, assessment_id, question_code, applicability_decision, claimed_maturity)
           VALUES ($1, $2, 'G1.1', 'applicable', 5) RETURNING id`,
          [ORG_A, assessmentId],
        )
      ).rows[0]!.id;
      const answer = async () =>
        (
          await tx.asAdmin<{ evidence_level: number | null; adjusted_score: number; row_version: string }>(
            "SELECT evidence_level, adjusted_score, xmin::text AS row_version FROM public.assessment_responses WHERE id = $1",
            [response],
          )
        ).rows[0]!;
      expect(await answer()).toMatchObject({ evidence_level: null, adjusted_score: 1 });

      // An answer's evidence moves its score, as it always has.
      await linkEvidence(tx, legal(), await storedEvidence(tx, ORG_A, { status: "strong", level: 5 }), "assessment_response", response);
      const scored = await answer();
      expect(scored).toMatchObject({ evidence_level: 5, adjusted_score: 5 });

      // A gap action's evidence never touches the answer — not even a write.
      await tx.asAdmin("SELECT app.refresh_assessment_gaps($1, $2)", [ORG_A, assessmentId]);
      await tx.as(legal(), "UPDATE public.assessment_responses SET claimed_maturity = 2 WHERE id = $1", [response]);
      await tx.asAdmin("SELECT app.refresh_assessment_gaps($1, $2)", [ORG_A, assessmentId]);
      const { rows: actions } = await tx.asAdmin<{ id: string }>(
        "SELECT a.id FROM public.gap_actions a JOIN public.assessment_gaps g ON g.id = a.gap_id WHERE g.assessment_id = $1",
        [assessmentId],
      );
      const before = await answer();
      await linkEvidence(tx, legal(), await storedEvidence(tx, ORG_A, { status: "strong", level: 5 }), "gap_action", actions[0]!.id);
      expect(await answer()).toEqual(before);

      // …nor does a ROPA record's.
      const rec = await createRecord(tx, registrar());
      await linkEvidence(tx, legal(), await storedEvidence(tx, ORG_A, { status: "strong", level: 5 }), "ropa_record", rec.id);
      expect(await answer()).toEqual(before);
    });
  });
});

// ---------------------------------------------------------------------------
// 7. The readiness score does not move
// ---------------------------------------------------------------------------

describe("a full register does not raise the readiness score (D-035, pitfall 1)", () => {
  it("adding ten complete, evidenced, approved records leaves the ROPA DOMAIN exactly where it was", async () => {
    await inTransaction(client, async (tx) => {
      const domain = async () =>
        (
          await tx.asAdmin<{ state: string; score: string | null; applicable_count: number }>(
            "SELECT state, score::text AS score, applicable_count FROM app.assessment_domain_results($1, $2) WHERE domain_code = 'ROPA'",
            [ORG_A, SEED_ASSESSMENTS.muBaseline.id],
          )
        ).rows[0]!;
      const before = await domain();
      for (let i = 0; i < 10; i++) {
        const rec = await createRecord(tx, registrar(), { owner_user_id: SEED_USERS.mumbaiUniversity.id });
        await linkEvidence(tx, legal(), await storedEvidence(tx), "ropa_record", rec.id);
        await setRecord(tx, registrar(), rec.id, "status = 'in_review'");
        await setRecord(tx, consultant(), rec.id, "status = 'approved'");
        expect((await read(tx, rec.id)).completeness_score).toBe(100);
      }
      expect(await domain()).toEqual(before);
    });
  });
});

// ---------------------------------------------------------------------------
// 8. Audit
// ---------------------------------------------------------------------------

describe("audit — by trigger, once per import, and never free text", () => {
  it("a user's create is audited as ropa.ropa_records.insert, with the code and NOT the activity's name", async () => {
    await inTransaction(client, async (tx) => {
      const secret = `Confidential activity ${randomUUID()}`;
      const rec = await createRecord(tx, registrar(), { name: secret, purpose: secret });
      const { rows } = await tx.asAdmin<{ event_type: string; metadata: Record<string, unknown>; user_id: string }>(
        "SELECT event_type, metadata, user_id FROM public.audit_logs WHERE entity_id = $1",
        [rec.id],
      );
      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({
        event_type: "ropa.ropa_records.insert",
        user_id: SEED_USERS.mumbaiUniversity.id,
        metadata: { recordCode: rec.record_code, recordStatus: "draft" },
      });
      expect(JSON.stringify(rows[0]!.metadata)).not.toContain(secret);
    });
  });

  it("an edit records the changed column NAMES; a re-derivation alone is not an event", async () => {
    await inTransaction(client, async (tx) => {
      const rec = await createRecord(tx, registrar());
      await setRecord(tx, registrar(), rec.id, "purpose = 'A secret purpose'");
      await tx.as(registrar(), "INSERT INTO public.ropa_systems (organization_id, ropa_record_id, system_id) VALUES ($1, $2, $3)", [
        ORG_A,
        rec.id,
        MU.systems.lms.id,
      ]);
      const { rows } = await tx.asAdmin<{ event_type: string; metadata: { changed?: string[] } }>(
        "SELECT event_type, metadata FROM public.audit_logs WHERE entity_id = $1 ORDER BY event_type",
        [rec.id],
      );
      // One transaction, one timestamp: compare the set, not an order.
      expect(rows.map((r) => r.event_type)).toEqual(["ropa.ropa_records.insert", "ropa.ropa_records.update", "ropa.ropa_systems.insert"]);
      expect(rows[1]!.metadata.changed).toEqual(["purpose"]);
      expect(JSON.stringify(rows)).not.toContain("A secret purpose");
    });
  });

  it("an import writes ONE audit row with the counts — and a duplicate row is rejected, never the file", async () => {
    await inTransaction(client, async (tx) => {
      const marker = randomUUID().slice(0, 8);
      const payload = [
        { row: 2, record_code: `IMP-${marker}-1`, name: "Imported one" },
        { row: 3, record_code: `IMP-${marker}-1`, name: "Duplicate code" },
        { row: 4, record_code: `IMP-${marker}-2`, name: "Imported two", children_data: "yes" },
      ];
      const { rows } = await tx.as<{ result: { imported: number; rejected: { row: number }[] } }>(
        registrar(),
        "SELECT public.import_ropa_records($1, $2::jsonb) AS result",
        [ORG_A, JSON.stringify(payload)],
      );
      expect(rows[0]!.result.imported).toBe(2);
      expect(rows[0]!.result.rejected.map((r) => r.row)).toEqual([3]);

      const imported = await tx.asAdmin<{ id: string; status: string; created_by: string }>(
        "SELECT id, status, created_by FROM public.ropa_records WHERE organization_id = $1 AND record_code LIKE $2",
        [ORG_A, `IMP-${marker}-%`],
      );
      expect(imported.rows.map((r) => r.status)).toEqual(["draft", "draft"]);
      const perRecord = await tx.asAdmin("SELECT 1 FROM public.audit_logs WHERE entity_id = ANY($1::uuid[])", [imported.rows.map((r) => r.id)]);
      expect(perRecord.rows).toHaveLength(0);
      const once = await tx.asAdmin<{ metadata: Record<string, number> }>(
        "SELECT metadata FROM public.audit_logs WHERE organization_id = $1 AND event_type = 'ropa.records.imported' AND created_at >= now()",
        [ORG_A],
      );
      expect(once.rows).toHaveLength(1);
      expect(once.rows[0]!.metadata).toEqual({ imported: 2, rejected: 1, submitted: 3 });
    });
  });

  it("generation is audited once, with the counts", async () => {
    await inTransaction(client, async (tx) => {
      await createRecord(tx, registrar());
      await generate(tx, registrar());
      const { rows } = await tx.asAdmin(
        "SELECT 1 FROM public.audit_logs WHERE organization_id = $1 AND event_type = 'ropa.gaps.generated' AND created_at >= now()",
        [ORG_A],
      );
      expect(rows).toHaveLength(1);
    });
  });
});

// ---------------------------------------------------------------------------
// 9. D-065 / D-066 — the DPDP structure
// ---------------------------------------------------------------------------

describe("the DPDP structure (D-065, D-066)", () => {
  it("a legitimate use asks for no notice and no consent — no false gap, full marks for the area", async () => {
    await inTransaction(client, async (tx) => {
      const rec = await createRecord(tx, registrar(), { lawful_basis: "employment", notice_linked: null, consent_linked: null });
      expect(rec.completeness_missing).not.toContain("notice_consent");
      expect(rec.risk_factors).not.toContain("no_notice");
      await generate(tx, registrar());
      const codes = (await ropaGapsOf(tx, rec.id)).map((g) => g.gap_code);
      expect(codes).not.toContain("notice_missing");
      expect(codes).not.toContain("consent_missing");
    });
  });

  it("consent as the ground asks for both", async () => {
    await inTransaction(client, async (tx) => {
      const rec = await createRecord(tx, registrar(), { notice_linked: null, consent_linked: null });
      expect(rec.completeness_missing).toContain("notice_consent");
      await generate(tx, registrar());
      expect((await ropaGapsOf(tx, rec.id)).map((g) => g.gap_code)).toEqual(expect.arrayContaining(["notice_missing", "consent_missing"]));
    });
  });

  it("children's data: parental consent and no tracking clear both gaps; an exemption does too", async () => {
    await inTransaction(client, async (tx) => {
      const owned = { owner_user_id: SEED_USERS.mumbaiUniversity.id, children_data: "yes" };
      const a = await createRecord(tx, registrar(), { ...owned, child_parental_consent: "yes", child_tracking: "no" });
      const b = await createRecord(tx, registrar(), { ...owned, child_exemption: "education" });
      const c = await createRecord(tx, registrar(), { ...owned });
      await generate(tx, registrar());
      const childGaps = async (id: string) =>
        (await ropaGapsOf(tx, id)).map((g) => g.gap_code).filter((code) => code.startsWith("child_"));
      expect(await childGaps(a.id)).toEqual([]);
      expect(await childGaps(b.id)).toEqual([]);
      expect(await childGaps(c.id)).toEqual(["child_consent_missing", "child_tracking"]);
    });
  });

  it("an unknown exemption, ground, trigger or safeguard is refused by the database", async () => {
    await inTransaction(client, async (tx) => {
      await expect(createRecord(tx, registrar(), { child_exemption: "university" })).rejects.toMatchObject({ code: "23514" });
      await expect(createRecord(tx, registrar(), { lawful_basis: "legitimate_interest" })).rejects.toMatchObject({ code: "23514" });
      await expect(createRecord(tx, registrar(), { retention_trigger: "forever" })).rejects.toMatchObject({ code: "23514" });
      await expect(createRecord(tx, registrar(), { safeguards: ["firewall"] })).rejects.toMatchObject({ code: "23514" });
    });
  });

  it("retention needs what ends it, and the law when a law requires keeping the data", async () => {
    await inTransaction(client, async (tx) => {
      const noLaw = await createRecord(tx, registrar(), { retention_rule: "Eight years", retention_trigger: "law_requires" });
      expect(noLaw.completeness_missing).toContain("retention");
      const withLaw = await createRecord(tx, registrar(), {
        retention_rule: "Eight years",
        retention_trigger: "law_requires",
        retention_law: "Income-tax Act, 1961",
      });
      expect(withLaw.completeness_missing).not.toContain("retention");
    });
  });

  it("Rule 6: a partial checklist opens 'not confirmed'; a full one does not", async () => {
    await inTransaction(client, async (tx) => {
      const partial = await createRecord(tx, registrar(), { safeguards: ["encryption", "access_control"] });
      const full = await createRecord(tx, registrar());
      await generate(tx, registrar());
      expect((await ropaGapsOf(tx, partial.id)).map((g) => g.gap_code)).toContain("rule6_unconfirmed");
      expect((await ropaGapsOf(tx, full.id)).map((g) => g.gap_code)).not.toContain("rule6_unconfirmed");
    });
  });

  it("a processor without DPDP clauses opens a contract gap — and fixing it in the VENDOR register closes it", async () => {
    await inTransaction(client, async (tx) => {
      const rec = await createRecord(tx, registrar(), { vendors_text: "LMS provider" });
      await tx.as(registrar(), "INSERT INTO public.ropa_vendors (organization_id, ropa_record_id, vendor_id) VALUES ($1, $2, $3)", [
        ORG_A,
        rec.id,
        MU.vendors.lmsProvider.id, // contract yes, DPDP clauses NO in the seed
      ]);
      expect((await read(tx, rec.id) as Rec & { vendor_contract_gaps: number }).vendor_contract_gaps).toBe(1);
      await generate(tx, registrar());
      expect((await ropaGapsOf(tx, rec.id)).map((g) => g.gap_code)).toContain("processor_contract_missing");

      await tx.as(registrar(), "UPDATE public.vendors SET dpdp_clauses = 'yes' WHERE id = $1", [MU.vendors.lmsProvider.id]);
      expect((await read(tx, rec.id) as Rec & { vendor_contract_gaps: number }).vendor_contract_gaps).toBe(0);
    });
  });

  it("no user can write the contract count", async () => {
    await inTransaction(client, async (tx) => {
      const rec = await createRecord(tx, registrar());
      await expect(setRecord(tx, registrar(), rec.id, "vendor_contract_gaps = 0")).rejects.toMatchObject({ code: "42501" });
    });
  });

  it("approval schedules the next review a year out when none is set — and keeps a sooner one", async () => {
    await inTransaction(client, async (tx) => {
      const owner = { owner_user_id: SEED_USERS.mumbaiUniversity.id };
      const unset = await createRecord(tx, registrar(), { ...owner, next_review_at: null });
      const soon = await createRecord(tx, registrar(), { ...owner, next_review_at: "2099-01-31" });
      for (const r of [unset, soon]) await setRecord(tx, registrar(), r.id, "status = 'in_review'");
      // Without a review date the record scores 90 — still approvable.
      await setRecord(tx, consultant(), unset.id, "status = 'approved'");
      await setRecord(tx, consultant(), soon.id, "status = 'approved'");
      const { rows } = await tx.asAdmin<{ id: string; next: string; last: string }>(
        "SELECT id, next_review_at::text AS next, last_reviewed_at::text AS last FROM public.ropa_records WHERE id = ANY($1::uuid[])",
        [[unset.id, soon.id]],
      );
      const byId = new Map(rows.map((r) => [r.id, r]));
      const u = byId.get(unset.id)!;
      expect(new Date(u.next).getTime() - new Date(u.last).getTime()).toBeGreaterThanOrEqual(365 * 86_400_000);
      expect(byId.get(soon.id)!.next).toBe("2099-01-31");
      // …and the review date it set counts: the risk/review area is complete.
      expect((await read(tx, unset.id)).completeness_missing).not.toContain("risk_review");
    });
  });

  it("the lawful ground is logged as a code; the note for counsel never is", async () => {
    await inTransaction(client, async (tx) => {
      const rec = await createRecord(tx, registrar(), { lawful_basis: "employment", legal_basis_note: "Secret counsel note" });
      const { rows } = await tx.asAdmin<{ metadata: Record<string, unknown> }>("SELECT metadata FROM public.audit_logs WHERE entity_id = $1", [rec.id]);
      expect(rows[0]!.metadata).toMatchObject({ lawfulBasis: "employment" });
      expect(JSON.stringify(rows)).not.toContain("Secret counsel note");
    });
  });
});

describe("risk governance (D-067)", () => {
  it("every rating names the model version that produced it", async () => {
    await inTransaction(client, async (tx) => {
      const rec = await createRecord(tx, registrar());
      expect((rec as unknown as { risk_model_version: string }).risk_model_version).toBe("1.0.0");
      await expect(setRecord(tx, registrar(), rec.id, "risk_model_version = '9.9.9'")).rejects.toMatchObject({ code: "42501" });
    });
  });

  it("a raise without a reason is refused; withdrawing the raise clears the reason", async () => {
    await inTransaction(client, async (tx) => {
      const rec = await createRecord(tx, registrar());
      await expect(setRecord(tx, registrar(), rec.id, "risk_rating_assessor = 'critical'")).rejects.toMatchObject({
        code: "23514",
        constraint: "ropa_records_raise_has_reason",
      });
      await setRecord(tx, registrar(), rec.id, "risk_rating_assessor = 'critical', risk_rating_assessor_reason = 'Board asked'");
      const [withdrawn] = (await setRecord(tx, registrar(), rec.id, "risk_rating_assessor = NULL")).rows;
      expect(withdrawn as unknown as { risk_rating_assessor_reason: string | null }).toMatchObject({ risk_rating_assessor_reason: null });
    });
  });

  it("the seeded hand-rated raises carry their reason", async () => {
    await inTransaction(client, async (tx) => {
      const { rows } = await tx.asAdmin<{ record_code: string; risk_rating_assessor_reason: string }>(
        "SELECT record_code, risk_rating_assessor_reason FROM public.ropa_records WHERE organization_id = $1 AND risk_rating_assessor IS NOT NULL AND record_code IN ('ROPA-002', 'ROPA-007') ORDER BY 1",
        [ORG_A],
      );
      expect(rows.map((r) => r.record_code)).toEqual(["ROPA-002", "ROPA-007"]);
      for (const r of rows) expect(r.risk_rating_assessor_reason.length).toBeGreaterThan(10);
    });
  });
});
