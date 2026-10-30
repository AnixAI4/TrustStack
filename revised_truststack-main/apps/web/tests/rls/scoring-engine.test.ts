/**
 * Slice 5 — GATE 5 (RLS) for the scoring engine, finalise and the snapshot.
 *
 *   1. The SQL engine reproduces the workbook oracle: the 98 sample responses
 *      through `app.assessment_domain_results` give 25.3014 · 23.9% · 10 · 52
 *      (D-048 run (b) — the SQL keeps the spec's cap and only that).
 *   2. Finalise refuses an outstanding question, refuses without the
 *      permission, and writes exactly one audit row.
 *   3. A finalised snapshot cannot move — not by a user, not by tooling.
 *   4. Unlinking re-derives the score, is refused once locked, and cannot
 *      reach across tenants.
 *
 * Every test runs inside a transaction that is rolled back.
 */
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { SEED_ASSESSMENTS, SEED_ORGS, SEED_RESPONSES, SEED_USERS, seedEvidencePath, SEED_EVIDENCE } from "@truststack/db/seed-data";
import type pg from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { authSubjects, connect, inTransaction, type Tx } from "./db";

const ORG_A = SEED_ORGS.mumbaiUniversity.id;
const ORG_B = SEED_ORGS.bharatManufacturing.id;
const MU_BASELINE = SEED_ASSESSMENTS.muBaseline.id;

interface Sample {
  questionCode: string;
  domainCode: string;
  claimedMaturity: number;
  evidenceLevel: number;
}
const SAMPLE: { responses: Sample[]; expected: Record<string, { rawScore: number; criticalCount: number; highCount: number }> } =
  JSON.parse(
    readFileSync(
      path.resolve(import.meta.dirname, "../../../../packages/db/question-bank/workbook-sample.json"),
      "utf8",
    ),
  );

let client: pg.Client;
let who: Map<string, { sub: string; email: string }>;
const u = (id: string) => who.get(id)!;
const consultant = () => u(SEED_USERS.consultant.id); // PROGRAMME: holds assessment.finalise
const registrar = () => u(SEED_USERS.mumbaiUniversity.id); // dpdp_owner: also holds it
const legal = () => u(SEED_USERS.muLegal.id); // contributor: evidence.write, NO assessment.finalise
const dean = () => u(SEED_USERS.muDean.id); // executive sponsor: read-only
const bmlAdmin = () => u(SEED_USERS.bmlAdmin.id);

type Actor = { sub: string; email: string };

beforeAll(async () => {
  client = await connect();
  who = await authSubjects(client, Object.values(SEED_USERS).map((x) => x.id));
});
afterAll(async () => {
  await client?.end();
});

/** An assessment whose snapshot is exactly the 98 workbook samples, fully answered. */
async function workbookAssessment(tx: Tx, organizationId = ORG_A): Promise<string> {
  const { rows } = await tx.asAdmin<{ id: string }>(
    "INSERT INTO public.assessments (organization_id, name, status) VALUES ($1, 'RLS oracle ' || gen_random_uuid(), 'draft') RETURNING id",
    [organizationId],
  );
  const id = rows[0]!.id;

  // The question snapshot, at the workbook's own weights (from dpdp_domains,
  // which the seeder loaded from the same Config sheet).
  await tx.asAdmin(
    `INSERT INTO public.assessment_questions (organization_id, assessment_id, question_code, question_version,
       question_text, domain_code, domain_weight, applicability, pack_code, sort_order, included_reason)
     SELECT $1, $2, s.question_code, '1.0', s.question_code, s.domain_code, d.weight, 'mandatory',
            'CORE_DPDP_V1', s.ord, 'core'
     FROM jsonb_to_recordset($3::jsonb) AS s(question_code text, domain_code text, ord integer)
     JOIN public.dpdp_domains d ON d.code = s.domain_code`,
    [
      organizationId,
      id,
      // `jsonb_to_recordset` matches by COLUMN name, so the keys are snake_case.
      JSON.stringify(
        SAMPLE.responses.map((r, i) => ({ question_code: r.questionCode, domain_code: r.domainCode, ord: i + 1 })),
      ),
    ],
  );

  // The answers, and then REAL reviewed evidence for each one.
  //
  // A response's evidence level has NO user grant and is always re-derived by
  // trigger from the links (D-044) — so this fixture cannot set it, and must
  // not: going through evidence → review → link is what makes this a test of
  // the engine as the product actually runs it, rather than of numbers the
  // test wrote itself.
  const samples = JSON.stringify(
    SAMPLE.responses.map((r) => ({
      question_code: r.questionCode,
      claimed: r.claimedMaturity,
      level: r.evidenceLevel,
      // Pre-generated, because the storage path must contain the row's own id.
      evidence_id: randomUUID(),
    })),
  );

  await tx.asAdmin(
    `INSERT INTO public.assessment_responses (organization_id, assessment_id, question_code,
       applicability_decision, claimed_maturity)
     SELECT $1, $2, s.question_code, 'applicable', s.claimed
     FROM jsonb_to_recordset($3::jsonb) AS s(question_code text, claimed integer, level integer)`,
    [organizationId, id, samples],
  );

  // One reviewed artefact per answer, at the sample's evidence level. Uploaded
  // by one person and reviewed by another — nobody grades their own (D-043).
  await tx.asAdmin(
    `INSERT INTO public.evidence (id, organization_id, storage_path, file_name, content_type, byte_size,
       uploaded_by, review_status, evidence_level, reviewed_by, reviewed_at)
     SELECT s.evidence_id, $1::uuid,
            'organizations/' || $1::text || '/evidence/' || s.evidence_id || '/sample.pdf',
            'sample.pdf', 'application/pdf', 1024,
            $3::uuid, 'adequate', s.level, $4::uuid, now()
     FROM jsonb_to_recordset($2::jsonb) AS s(evidence_id uuid, level integer)`,
    [organizationId, samples, SEED_USERS.mumbaiUniversity.id, SEED_USERS.consultant.id],
  );

  // Linking requires the object to really be in the bucket (D-039).
  await tx.asAdmin(
    `INSERT INTO storage.objects (bucket_id, name)
     SELECT 'evidence', 'organizations/' || $1::text || '/evidence/' || s.evidence_id || '/sample.pdf'
     FROM jsonb_to_recordset($2::jsonb) AS s(evidence_id uuid)`,
    [organizationId, samples],
  );

  // The link is what gives each response its level, and so its adjusted score.
  await tx.asAdmin(
    `INSERT INTO public.evidence_links (organization_id, evidence_id, linked_entity_type, linked_entity_id)
     SELECT $1::uuid, s.evidence_id, 'assessment_response', r.id
     FROM jsonb_to_recordset($3::jsonb) AS s(evidence_id uuid, question_code text)
     JOIN public.assessment_responses r
       ON r.organization_id = $1::uuid AND r.assessment_id = $2::uuid AND r.question_code = s.question_code`,
    [organizationId, id, samples],
  );

  return id;
}

/** MU's baseline, copied as a draft — it has 124 questions and one answer. */
async function freshAssessment(tx: Tx): Promise<string> {
  const { rows } = await tx.asAdmin<{ id: string }>(
    "INSERT INTO public.assessments (organization_id, name, status) VALUES ($1, 'RLS scoring ' || gen_random_uuid(), 'draft') RETURNING id",
    [ORG_A],
  );
  const id = rows[0]!.id;
  await tx.asAdmin(
    `INSERT INTO public.assessment_questions (organization_id, assessment_id, question_code, question_version, question_text,
       domain_code, domain_weight, applicability, priority, evidence_guidance, suggested_owner, pack_code, sort_order, included_reason)
     SELECT organization_id, $1, question_code, question_version, question_text, domain_code, domain_weight, applicability,
       priority, evidence_guidance, suggested_owner, pack_code, sort_order, included_reason
     FROM public.assessment_questions WHERE assessment_id = $2`,
    [id, MU_BASELINE],
  );
  return id;
}

async function storedEvidence(tx: Tx, actor: Actor, org: string = ORG_A): Promise<{ id: string; path: string }> {
  const id = randomUUID();
  const filePath = `organizations/${org}/evidence/${id}/order.pdf`;
  await tx.as(
    actor,
    `INSERT INTO public.evidence (id, organization_id, storage_path, file_name, content_type, byte_size)
     VALUES ($1, $2, $3, 'order.pdf', 'application/pdf', 1024)`,
    [id, org, filePath],
  );
  await tx.asAdmin("INSERT INTO storage.objects (bucket_id, name) VALUES ('evidence', $1)", [filePath]);
  return { id, path: filePath };
}

async function reviewAs(tx: Tx, actor: Actor, evidenceId: string, level: number, org = ORG_A) {
  await tx.as(
    actor,
    "UPDATE public.evidence SET review_status = 'adequate', evidence_level = $2 WHERE id = $1 AND organization_id = $3",
    [evidenceId, level, org],
  );
}

const num = (v: unknown) => Number(v);

// ---------------------------------------------------------------------------
// GATE — the SQL engine against the workbook oracle
// ---------------------------------------------------------------------------

describe("GATE — the workbook's 98 samples through the SQL engine (D-007, D-048)", () => {
  /**
   * Run (b) only. The SQL keeps the spec's cap and nothing else: the naive
   * rule exists in the TypeScript parity fixture and is never reachable from
   * the database, so there is no "which rule is this?" to get wrong in
   * production (D-048).
   */
  it("gives 25.3014 · 23.9% · 10 critical · 52 high", async () => {
    await inTransaction(client, async (tx) => {
      const id = await workbookAssessment(tx);
      const { rows } = await tx.asAdmin<Record<string, unknown>>(
        `SELECT sum(score) FILTER (WHERE state = 'scored') AS raw,
                sum(weight) FILTER (WHERE state = 'scored') AS applicable_weight,
                avg(evidence_confidence) FILTER (WHERE evidence_confidence IS NOT NULL) AS confidence,
                sum(critical_count) AS critical, sum(high_count) AS high,
                count(*) AS domains
         FROM app.assessment_domain_results($1, $2)`,
        [ORG_A, id],
      );
      const r = rows[0]!;
      expect(num(r.raw)).toBeCloseTo(25.3014, 4);
      expect(num(r.raw)).toBeCloseTo(SAMPLE.expected.spec!.rawScore, 4);
      expect(num(r.confidence)).toBeCloseTo(23.9033, 4);
      expect(Number(r.critical)).toBe(10);
      expect(Number(r.high)).toBe(52);
      expect(num(r.applicable_weight)).toBe(100);
      expect(Number(r.domains)).toBe(16);
    });
  });

  it("the red-flag cap on the sample is 50 — children's data, and security too under ≤ 2", async () => {
    await inTransaction(client, async (tx) => {
      const id = await workbookAssessment(tx);
      const { rows } = await tx.asAdmin<{ flags: { code: string; cap: number }[] }>(
        "SELECT app.assessment_red_flags($1, $2) AS flags",
        [ORG_A, id],
      );
      const codes = rows[0]!.flags.map((f) => f.code);
      expect(codes).toContain("unreviewed_childrens_data");
      expect(codes).toContain("weak_security_safeguards");
      expect(Math.min(...rows[0]!.flags.map((f) => Number(f.cap)))).toBe(50);
    });
  });

  it("every domain score matches the workbook's Domain_Scoring sheet under the spec's cap", async () => {
    await inTransaction(client, async (tx) => {
      const id = await workbookAssessment(tx);
      const { rows } = await tx.asAdmin<{ domain_code: string; score: string }>(
        "SELECT domain_code, score FROM app.assessment_domain_results($1, $2) ORDER BY sort_order",
        [ORG_A, id],
      );
      // Identical to the workbook's Domain_Scoring sheet everywhere EXCEPT
      // CROSSBORDER: the five CB1.x rows (claim 2 + E1) are the only ones the
      // cap rule separates, and they are all in that domain — 0.6 under the
      // workbook's naive MIN, 1.2 under the spec's cap (D-047).
      const expected: Record<string, number> = {
        GOV: 2.6, INV: 1.3714285714, ROPA: 1.05, PURPOSE: 2.8, NOTICE: 2.8, CONSENT: 1.1666666667,
        RIGHTS: 1.4, GRIEVANCE: 0.6, RETENTION: 1.2, ACCURACY: 1.6, SECURITY: 4, BREACH: 1.0666666667,
        VENDOR: 1.1666666667, CHILD: 0.48, CROSSBORDER: 1.2, SDF_AI: 0.8,
      };
      for (const row of rows) expect(num(row.score)).toBeCloseTo(expected[row.domain_code]!, 8);
    });
  });

  it("finalising it stores exactly those numbers", async () => {
    await inTransaction(client, async (tx) => {
      const id = await workbookAssessment(tx);
      await tx.as(consultant(), "SELECT public.finalise_assessment($1, $2)", [ORG_A, id]);
      const { rows } = await tx.asAdmin<Record<string, unknown>>(
        "SELECT * FROM public.assessment_score_snapshots WHERE assessment_id = $1",
        [id],
      );
      const s = rows[0]!;
      expect(num(s.raw_score)).toBeCloseTo(25.3014, 4);
      expect(num(s.score_cap)).toBe(50);
      expect(num(s.final_score)).toBeCloseTo(25.3014, 4); // min(raw, cap) — the cap is far above
      expect(num(s.applicable_weight)).toBe(100);
      expect(num(s.evidence_confidence)).toBeCloseTo(23.9033, 4);
      expect(s.maturity_level).toBe("Level 1 - Aware");
      expect(Number(s.critical_count)).toBe(10);
      expect(Number(s.high_count)).toBe(52);
      expect(s.engine_version).toBe("1.0.0");
    });
  });
});

// ---------------------------------------------------------------------------
// The SQL engine's own rules
// ---------------------------------------------------------------------------

describe("the engine in SQL", () => {
  it("a domain with no questions is SCOPED OUT — null score, not zero (D-038)", async () => {
    await inTransaction(client, async (tx) => {
      const id = await freshAssessment(tx);
      await tx.asAdmin("DELETE FROM public.assessment_questions WHERE assessment_id = $1 AND domain_code = 'VENDOR'", [id]);
      const { rows } = await tx.asAdmin<{ state: string; score: string | null; evidence_confidence: string | null }>(
        "SELECT state, score, evidence_confidence FROM app.assessment_domain_results($1, $2) WHERE domain_code = 'VENDOR'",
        [ORG_A, id],
      );
      expect(rows[0]!.state).toBe("scoped_out");
      expect(rows[0]!.score).toBeNull();
      expect(rows[0]!.evidence_confidence).toBeNull();
    });
  });

  it("a domain whose every question is Not Applicable is a DIFFERENT state, also null", async () => {
    await inTransaction(client, async (tx) => {
      const id = await freshAssessment(tx);
      // Only conditional questions may be excluded (D-041), so use a domain
      // whose questions all are — and say why, as the CHECK requires.
      await tx.asAdmin(
        `UPDATE public.assessment_questions SET applicability = 'conditional'
         WHERE assessment_id = $1 AND domain_code = 'CROSSBORDER'`,
        [id],
      );
      await tx.asAdmin(
        `INSERT INTO public.assessment_responses (organization_id, assessment_id, question_code,
           applicability_decision, na_reason)
         SELECT $1, $2, question_code, 'not_applicable', 'No personal data leaves India.'
         FROM public.assessment_questions WHERE assessment_id = $2 AND domain_code = 'CROSSBORDER'`,
        [ORG_A, id],
      );
      const { rows } = await tx.asAdmin<{ state: string; score: string | null; not_applicable_count: number }>(
        "SELECT state, score, not_applicable_count FROM app.assessment_domain_results($1, $2) WHERE domain_code = 'CROSSBORDER'",
        [ORG_A, id],
      );
      expect(rows[0]!.state).toBe("all_not_applicable");
      expect(rows[0]!.score).toBeNull();
      expect(Number(rows[0]!.not_applicable_count)).toBeGreaterThan(0);
    });
  });

  it("counts outstanding questions honestly — one answer in a 124-question set", async () => {
    await inTransaction(client, async (tx) => {
      const { rows } = await tx.asAdmin<{ outstanding: string; applicable: string }>(
        `SELECT sum(outstanding_count) AS outstanding, sum(applicable_count) AS applicable
         FROM app.assessment_domain_results($1, $2)`,
        [ORG_A, MU_BASELINE],
      );
      expect(Number(rows[0]!.applicable)).toBe(1);
      expect(Number(rows[0]!.outstanding)).toBe(123);
    });
  });

  it("uses the SNAPSHOT's weight, so rebalancing dpdp_domains cannot move a score (D-035)", async () => {
    await inTransaction(client, async (tx) => {
      const before = await tx.asAdmin<{ weight: string; score: string }>(
        "SELECT weight, score FROM app.assessment_domain_results($1, $2) WHERE domain_code = 'GOV'",
        [ORG_A, MU_BASELINE],
      );
      // A compensating swap, so the 100-point total holds (D-036).
      await tx.asAdmin("UPDATE public.dpdp_domains SET weight = 9 WHERE code = 'GOV'");
      await tx.asAdmin("UPDATE public.dpdp_domains SET weight = 8 WHERE code = 'SECURITY'");
      await tx.asAdmin("SET CONSTRAINTS ALL IMMEDIATE");
      const after = await tx.asAdmin<{ weight: string; score: string }>(
        "SELECT weight, score FROM app.assessment_domain_results($1, $2) WHERE domain_code = 'GOV'",
        [ORG_A, MU_BASELINE],
      );
      expect(num(after.rows[0]!.weight)).toBe(num(before.rows[0]!.weight));
      expect(num(after.rows[0]!.score)).toBe(num(before.rows[0]!.score));
    });
  });

  it("the cap binds the aggregate: an unevidenced claim of 5 contributes 1, not 5", async () => {
    await inTransaction(client, async (tx) => {
      const { rows } = await tx.asAdmin<{ avg_adjusted: string; evidence_confidence: string }>(
        "SELECT avg_adjusted, evidence_confidence FROM app.assessment_domain_results($1, $2) WHERE domain_code = 'GOV'",
        [ORG_A, MU_BASELINE],
      );
      // The seeded answer is claim 5 with E3 evidence → adjusted 3.
      expect(num(rows[0]!.avg_adjusted)).toBe(3);
      expect(num(rows[0]!.evidence_confidence)).toBe(60);
    });
  });
});

// ---------------------------------------------------------------------------
// Finalise
// ---------------------------------------------------------------------------

describe("finalise_assessment", () => {
  it("refuses while any question is outstanding, and says how many (D-041)", async () => {
    await inTransaction(client, async (tx) => {
      await expect(
        tx.as(consultant(), "SELECT public.finalise_assessment($1, $2)", [ORG_A, MU_BASELINE]),
      ).rejects.toMatchObject({ code: "TS409", detail: "123" });
    });
  });

  it("refuses without assessment.finalise, even to someone who can answer", async () => {
    await inTransaction(client, async (tx) => {
      const id = await workbookAssessment(tx);
      await expect(
        tx.as(legal(), "SELECT public.finalise_assessment($1, $2)", [ORG_A, id]),
      ).rejects.toMatchObject({ code: "TS403" });
    });
  });

  it("refuses to an anonymous caller", async () => {
    await inTransaction(client, async (tx) => {
      const id = await workbookAssessment(tx);
      await expect(tx.as(null, "SELECT public.finalise_assessment($1, $2)", [ORG_A, id])).rejects.toBeTruthy();
    });
  });

  it("refuses another tenant's assessment — a member of Org B cannot finalise Org A's", async () => {
    await inTransaction(client, async (tx) => {
      const id = await workbookAssessment(tx);
      await expect(
        tx.as(bmlAdmin(), "SELECT public.finalise_assessment($1, $2)", [ORG_A, id]),
      ).rejects.toMatchObject({ code: "TS403" });
      const { rows } = await tx.asAdmin("SELECT 1 FROM public.assessment_score_snapshots WHERE assessment_id = $1", [id]);
      expect(rows).toHaveLength(0);
    });
  });

  it("refuses an unknown assessment id without saying whether it exists", async () => {
    await inTransaction(client, async (tx) => {
      await expect(
        tx.as(consultant(), "SELECT public.finalise_assessment($1, $2)", [ORG_A, randomUUID()]),
      ).rejects.toMatchObject({ code: "TS404" });
    });
  });

  it("refuses to finalise twice", async () => {
    await inTransaction(client, async (tx) => {
      const id = await workbookAssessment(tx);
      await tx.as(consultant(), "SELECT public.finalise_assessment($1, $2)", [ORG_A, id]);
      await expect(
        tx.as(registrar(), "SELECT public.finalise_assessment($1, $2)", [ORG_A, id]),
      ).rejects.toMatchObject({ code: "TS409" });
    });
  });

  it("moves the assessment to finalised and writes ONE audit row carrying the numbers", async () => {
    await inTransaction(client, async (tx) => {
      const id = await workbookAssessment(tx);
      await tx.as(consultant(), "SELECT public.finalise_assessment($1, $2)", [ORG_A, id]);

      const status = await tx.asAdmin<{ status: string }>("SELECT status FROM public.assessments WHERE id = $1", [id]);
      expect(status.rows[0]!.status).toBe("finalised");

      const audit = await tx.asAdmin<{ user_id: string; metadata: Record<string, unknown> }>(
        "SELECT user_id, metadata FROM public.audit_logs WHERE entity_id = $1 AND event_type = 'assessment.score.finalised'",
        [id],
      );
      expect(audit.rows).toHaveLength(1);
      expect(audit.rows[0]!.user_id).toBe(SEED_USERS.consultant.id);
      expect(num(audit.rows[0]!.metadata.finalScore)).toBeCloseTo(25.3014, 4);
      expect(audit.rows[0]!.metadata.engineVersion).toBe("1.0.0");
      // No free text: N/A reasons, notes and review notes never enter the log.
      expect(JSON.stringify(audit.rows[0]!.metadata)).not.toContain("reason");
    });
  });

  it("writes all sixteen domain rows, including the empty ones", async () => {
    await inTransaction(client, async (tx) => {
      const id = await workbookAssessment(tx);
      await tx.as(consultant(), "SELECT public.finalise_assessment($1, $2)", [ORG_A, id]);
      const { rows } = await tx.asAdmin<{ n: string }>(
        `SELECT count(*) AS n FROM public.assessment_domain_scores ds
         JOIN public.assessment_score_snapshots s ON s.id = ds.snapshot_id
         WHERE s.assessment_id = $1`,
        [id],
      );
      expect(Number(rows[0]!.n)).toBe(16);
    });
  });

  it("locks the answers: a finalised assessment cannot be re-answered or re-linked", async () => {
    await inTransaction(client, async (tx) => {
      const id = await workbookAssessment(tx);
      await tx.as(consultant(), "SELECT public.finalise_assessment($1, $2)", [ORG_A, id]);
      await expect(
        tx.as(
          consultant(),
          "UPDATE public.assessment_responses SET claimed_maturity = 5 WHERE assessment_id = $1 AND question_code = 'G1.2'",
          [id],
        ),
      ).rejects.toMatchObject({ code: "TS409" });
    });
  });

  it("a later review of evidence cannot move a finalised score", async () => {
    await inTransaction(client, async (tx) => {
      const id = await workbookAssessment(tx);
      await tx.as(consultant(), "SELECT public.finalise_assessment($1, $2)", [ORG_A, id]);
      const before = await tx.asAdmin<{ final_score: string }>(
        "SELECT final_score FROM public.assessment_score_snapshots WHERE assessment_id = $1",
        [id],
      );
      // Attach and review new evidence on one of its answers — refused,
      // because a finalised assessment's evidence is locked (Slice 4).
      const ev = await storedEvidence(tx, registrar());
      const response = await tx.asAdmin<{ id: string }>(
        "SELECT id FROM public.assessment_responses WHERE assessment_id = $1 AND question_code = 'G1.2'",
        [id],
      );
      await expect(
        tx.as(
          registrar(),
          `INSERT INTO public.evidence_links (organization_id, evidence_id, linked_entity_type, linked_entity_id)
           VALUES ($1, $2, 'assessment_response', $3)`,
          [ORG_A, ev.id, response.rows[0]!.id],
        ),
      ).rejects.toMatchObject({ code: "TS409" });

      const after = await tx.asAdmin<{ final_score: string }>(
        "SELECT final_score FROM public.assessment_score_snapshots WHERE assessment_id = $1",
        [id],
      );
      expect(after.rows[0]!.final_score).toBe(before.rows[0]!.final_score);
    });
  });
});

// ---------------------------------------------------------------------------
// The snapshot is immutable, and it is one tenant's
// ---------------------------------------------------------------------------

describe("the snapshot", () => {
  it("cannot be updated or deleted — even as tooling", async () => {
    await inTransaction(client, async (tx) => {
      const id = await workbookAssessment(tx);
      await tx.as(consultant(), "SELECT public.finalise_assessment($1, $2)", [ORG_A, id]);
      for (const sql of [
        "UPDATE public.assessment_score_snapshots SET final_score = 99 WHERE assessment_id = $1",
        "DELETE FROM public.assessment_score_snapshots WHERE assessment_id = $1",
      ]) {
        await expect(tx.asAdmin(sql, [id])).rejects.toMatchObject({ code: "TS409" });
      }
      for (const sql of [
        `UPDATE public.assessment_domain_scores SET score = 7 WHERE snapshot_id IN
           (SELECT id FROM public.assessment_score_snapshots WHERE assessment_id = $1)`,
        `DELETE FROM public.assessment_domain_scores WHERE snapshot_id IN
           (SELECT id FROM public.assessment_score_snapshots WHERE assessment_id = $1)`,
      ]) {
        await expect(tx.asAdmin(sql, [id])).rejects.toMatchObject({ code: "TS409" });
      }
    });
  });

  /**
   * A score never CHANGES, but it can go with the thing it scored. Deleting an
   * assessment — or the whole organisation, which is what erasure means —
   * takes its snapshot too, and a trigger that blocked its own cascade would
   * make a finalised tenant undeletable.
   */
  it("goes with its assessment when the whole assessment is deleted", async () => {
    await inTransaction(client, async (tx) => {
      const id = await workbookAssessment(tx);
      await tx.as(consultant(), "SELECT public.finalise_assessment($1, $2)", [ORG_A, id]);
      const snapshot = await tx.asAdmin<{ id: string }>(
        "SELECT id FROM public.assessment_score_snapshots WHERE assessment_id = $1",
        [id],
      );
      const snapshotId = snapshot.rows[0]!.id;

      await tx.asAdmin("DELETE FROM public.assessments WHERE id = $1", [id]);

      // THIS snapshot specifically, not "any snapshot this tenant has" — the
      // organisation may hold other finalised assessments, and asserting over
      // the whole tenant made this pass only on a database where it did not.
      const snaps = await tx.asAdmin("SELECT 1 FROM public.assessment_score_snapshots WHERE id = $1", [snapshotId]);
      expect(snaps.rows).toHaveLength(0);
      const domains = await tx.asAdmin("SELECT 1 FROM public.assessment_domain_scores WHERE snapshot_id = $1", [
        snapshotId,
      ]);
      expect(domains.rows).toHaveLength(0);
    });
  });

  it("holds no user write grant of any kind", async () => {
    await inTransaction(client, async (tx) => {
      const { rows } = await tx.asAdmin<{ privilege_type: string; table_name: string }>(
        `SELECT table_name, privilege_type FROM information_schema.role_table_grants
         WHERE table_schema = 'public' AND grantee IN ('anon', 'authenticated')
           AND table_name IN ('assessment_score_snapshots', 'assessment_domain_scores')
           AND privilege_type <> 'SELECT'`,
      );
      expect(rows).toEqual([]);
    });
  });

  it("Org B cannot read Org A's snapshot", async () => {
    await inTransaction(client, async (tx) => {
      const id = await workbookAssessment(tx);
      await tx.as(consultant(), "SELECT public.finalise_assessment($1, $2)", [ORG_A, id]);
      for (const table of ["assessment_score_snapshots", "assessment_domain_scores"]) {
        const { rows } = await tx.as(bmlAdmin(), `SELECT * FROM public.${table} WHERE organization_id = $1`, [ORG_A]);
        expect(rows).toHaveLength(0);
      }
    });
  });

  it("a member without score.read sees nothing either", async () => {
    await inTransaction(client, async (tx) => {
      const id = await workbookAssessment(tx);
      await tx.as(consultant(), "SELECT public.finalise_assessment($1, $2)", [ORG_A, id]);
      // Strip score.read from the Dean's role for this transaction only.
      await tx.asAdmin(
        `DELETE FROM public.role_permissions rp
         USING public.permissions p, public.organization_users ou
         WHERE rp.permission_id = p.id AND p.code = 'score.read'
           AND rp.role_id = ou.role_id AND ou.user_id = $1 AND ou.organization_id = $2`,
        [SEED_USERS.muDean.id, ORG_A],
      );
      const { rows } = await tx.as(dean(), "SELECT * FROM public.assessment_score_snapshots WHERE organization_id = $1", [ORG_A]);
      expect(rows).toHaveLength(0);
    });
  });

  it("carries a composite tenant FK: Org B's id with Org A's assessment matches nothing", async () => {
    await inTransaction(client, async (tx) => {
      // (organization_id, assessment_id) -> assessments(organization_id, id).
      // Org A's assessment under Org B's tenant is not a row anywhere, and the
      // FK says so even to tooling (D-027).
      await expect(
        tx.asAdmin(
          `INSERT INTO public.assessment_score_snapshots (organization_id, assessment_id, raw_score, score_cap,
             final_score, applicable_weight, evidence_confidence, maturity_level, critical_count, high_count, engine_version)
           VALUES ($1, $2, 50, 100, 50, 100, 50, 'Level 2 - Defined', 0, 0, '1.0.0')`,
          [ORG_B, MU_BASELINE],
        ),
      ).rejects.toMatchObject({ code: "23503" });
    });
  });

  it("a domain row cannot be smuggled into another tenant's snapshot", async () => {
    await inTransaction(client, async (tx) => {
      // A snapshot always carries all sixteen domains, so an id that exists
      // would collide on (snapshot_id, domain_code) before the FK was reached.
      // An id Org B does not own is the clean test of the composite FK.
      await expect(
        tx.asAdmin(
          `INSERT INTO public.assessment_domain_scores (organization_id, snapshot_id, domain_code, weight, state,
             applicable_count, not_applicable_count, score, maturity_level, critical_count, high_count, status, sort_order)
           VALUES ($1, $2, 'GOV', 7, 'scored', 1, 0, 7, 'Level 5 - Continuous Assurance', 0, 0, 'on_track', 1)`,
          [ORG_B, randomUUID()],
        ),
      ).rejects.toMatchObject({ code: "23503" });
    });
  });

  it("refuses a stored final score that is not min(raw, cap), even from tooling", async () => {
    await inTransaction(client, async (tx) => {
      await expect(
        tx.asAdmin(
          `INSERT INTO public.assessment_score_snapshots (organization_id, assessment_id, raw_score, score_cap,
             final_score, applicable_weight, evidence_confidence, maturity_level, critical_count, high_count, engine_version)
           VALUES ($1, $2, 90, 50, 90, 100, 50, 'Level 4 - Operational', 0, 0, '1.0.0')`,
          [ORG_A, MU_BASELINE],
        ),
      ).rejects.toMatchObject({ code: "23514" });
    });
  });

  it("refuses an empty domain scored zero rather than null (D-038)", async () => {
    await inTransaction(client, async (tx) => {
      const id = await workbookAssessment(tx);
      await tx.as(consultant(), "SELECT public.finalise_assessment($1, $2)", [ORG_A, id]);
      const snap = await tx.asAdmin<{ id: string }>(
        "SELECT id FROM public.assessment_score_snapshots WHERE assessment_id = $1",
        [id],
      );
      await expect(
        tx.asAdmin(
          `INSERT INTO public.assessment_domain_scores (organization_id, snapshot_id, domain_code, weight, state,
             applicable_count, not_applicable_count, score, maturity_level, critical_count, high_count, status, sort_order)
           VALUES ($1, $2, 'GOV', 7, 'scoped_out', 0, 0, 0, 'Level 0 - Not Started', 0, 0, 'needs_work', 1)`,
          [ORG_A, snap.rows[0]!.id],
        ),
      ).rejects.toMatchObject({ code: "23514" });
    });
  });
});

// ---------------------------------------------------------------------------
// Unlinking evidence
// ---------------------------------------------------------------------------

describe("unlinking evidence from an answer (D-051)", () => {
  async function answeredWithEvidence(tx: Tx, level: number) {
    const assessmentId = await freshAssessment(tx);
    const answered = await tx.as<{ id: string }>(
      registrar(),
      `INSERT INTO public.assessment_responses (organization_id, assessment_id, question_code, applicability_decision, claimed_maturity)
       VALUES ($1, $2, 'G1.2', 'applicable', 5) RETURNING id`,
      [ORG_A, assessmentId],
    );
    const responseId = answered.rows[0]!.id;
    const ev = await storedEvidence(tx, registrar());
    await reviewAs(tx, consultant(), ev.id, level);
    await tx.as(
      registrar(),
      `INSERT INTO public.evidence_links (organization_id, evidence_id, linked_entity_type, linked_entity_id)
       VALUES ($1, $2, 'assessment_response', $3)`,
      [ORG_A, ev.id, responseId],
    );
    return { assessmentId, responseId, evidenceId: ev.id };
  }

  const scoreOf = async (tx: Tx, responseId: string) =>
    (
      await tx.asAdmin<{ adjusted_score: number; evidence_level: number | null }>(
        "SELECT adjusted_score, evidence_level FROM public.assessment_responses WHERE id = $1",
        [responseId],
      )
    ).rows[0]!;

  it("re-derives the level and the adjusted score — the number never outlives its evidence", async () => {
    await inTransaction(client, async (tx) => {
      const { responseId, evidenceId } = await answeredWithEvidence(tx, 5);
      expect(await scoreOf(tx, responseId)).toMatchObject({ adjusted_score: 5, evidence_level: 5 });

      await tx.as(registrar(), "DELETE FROM public.evidence_links WHERE evidence_id = $1 AND organization_id = $2", [
        evidenceId,
        ORG_A,
      ]);
      // Back to unevidenced: claim 5 with nothing reviewed is E0 → 1.
      expect(await scoreOf(tx, responseId)).toMatchObject({ adjusted_score: 1, evidence_level: null });
    });
  });

  it("leaves the strongest of whatever remains", async () => {
    await inTransaction(client, async (tx) => {
      const { responseId, evidenceId } = await answeredWithEvidence(tx, 5);
      const weaker = await storedEvidence(tx, registrar());
      await reviewAs(tx, consultant(), weaker.id, 3);
      await tx.as(
        registrar(),
        `INSERT INTO public.evidence_links (organization_id, evidence_id, linked_entity_type, linked_entity_id)
         VALUES ($1, $2, 'assessment_response', $3)`,
        [ORG_A, weaker.id, responseId],
      );
      expect(await scoreOf(tx, responseId)).toMatchObject({ evidence_level: 5 });

      await tx.as(registrar(), "DELETE FROM public.evidence_links WHERE evidence_id = $1 AND organization_id = $2", [
        evidenceId,
        ORG_A,
      ]);
      expect(await scoreOf(tx, responseId)).toMatchObject({ adjusted_score: 3, evidence_level: 3 });
    });
  });

  it("the artefact itself survives — unlinking is not deleting (D-042)", async () => {
    await inTransaction(client, async (tx) => {
      const { evidenceId } = await answeredWithEvidence(tx, 5);
      await tx.as(registrar(), "DELETE FROM public.evidence_links WHERE evidence_id = $1 AND organization_id = $2", [
        evidenceId,
        ORG_A,
      ]);
      const { rows } = await tx.asAdmin("SELECT 1 FROM public.evidence WHERE id = $1", [evidenceId]);
      expect(rows).toHaveLength(1);
    });
  });

  it("needs evidence.write — a read-only member cannot unlink", async () => {
    await inTransaction(client, async (tx) => {
      const { evidenceId } = await answeredWithEvidence(tx, 5);
      const { rowCount } = await tx.as(
        dean(),
        "DELETE FROM public.evidence_links WHERE evidence_id = $1 AND organization_id = $2",
        [evidenceId, ORG_A],
      );
      expect(rowCount).toBe(0); // the policy filters it away, silently
      const still = await tx.asAdmin("SELECT 1 FROM public.evidence_links WHERE evidence_id = $1", [evidenceId]);
      expect(still.rows).toHaveLength(1);
    });
  });

  it("Org B cannot unlink Org A's evidence", async () => {
    await inTransaction(client, async (tx) => {
      const { evidenceId } = await answeredWithEvidence(tx, 5);
      const { rowCount } = await tx.as(bmlAdmin(), "DELETE FROM public.evidence_links WHERE evidence_id = $1", [
        evidenceId,
      ]);
      expect(rowCount).toBe(0);
      const still = await tx.asAdmin("SELECT 1 FROM public.evidence_links WHERE evidence_id = $1", [evidenceId]);
      expect(still.rows).toHaveLength(1);
    });
  });

  it("is refused once the assessment is locked", async () => {
    await inTransaction(client, async (tx) => {
      const { assessmentId, evidenceId } = await answeredWithEvidence(tx, 5);
      await tx.asAdmin("UPDATE public.assessments SET status = 'submitted' WHERE id = $1", [assessmentId]);
      await expect(
        tx.as(registrar(), "DELETE FROM public.evidence_links WHERE evidence_id = $1 AND organization_id = $2", [
          evidenceId,
          ORG_A,
        ]),
      ).rejects.toMatchObject({ code: "TS409" });
    });
  });

  it("is audited, as the person who did it", async () => {
    await inTransaction(client, async (tx) => {
      const { evidenceId } = await answeredWithEvidence(tx, 5);
      await tx.as(registrar(), "DELETE FROM public.evidence_links WHERE evidence_id = $1 AND organization_id = $2", [
        evidenceId,
        ORG_A,
      ]);
      const { rows } = await tx.asAdmin<{ user_id: string; metadata: Record<string, unknown> }>(
        "SELECT user_id, metadata FROM public.audit_logs WHERE event_type = 'evidence.evidence_links.delete' AND metadata ->> 'evidenceId' = $1",
        [evidenceId],
      );
      expect(rows).toHaveLength(1);
      expect(rows[0]!.user_id).toBe(SEED_USERS.mumbaiUniversity.id);
    });
  });

  it("deleting the ARTEFACT takes its links with it, even on a locked assessment", async () => {
    await inTransaction(client, async (tx) => {
      const { assessmentId, evidenceId } = await answeredWithEvidence(tx, 5);
      await tx.asAdmin("UPDATE public.assessments SET status = 'finalised' WHERE id = $1", [assessmentId]);
      // Tooling only — no user holds DELETE on `evidence` (D-042). The cascade
      // must not be mistaken for somebody unlinking.
      await tx.asAdmin("DELETE FROM public.evidence WHERE id = $1", [evidenceId]);
      const { rows } = await tx.asAdmin("SELECT 1 FROM public.evidence_links WHERE evidence_id = $1", [evidenceId]);
      expect(rows).toHaveLength(0);
    });
  });

  it("deleting the response takes its links with it, and that is not blocked as 'locked'", async () => {
    await inTransaction(client, async (tx) => {
      const { responseId, evidenceId } = await answeredWithEvidence(tx, 5);
      await tx.asAdmin("DELETE FROM public.assessment_responses WHERE id = $1", [responseId]);
      const { rows } = await tx.asAdmin("SELECT 1 FROM public.evidence_links WHERE evidence_id = $1", [evidenceId]);
      expect(rows).toHaveLength(0);
    });
  });

  it("the seeded MU link is still there — nothing above touched real data", async () => {
    await inTransaction(client, async (tx) => {
      const { rows } = await tx.asAdmin("SELECT 1 FROM public.evidence_links WHERE evidence_id = $1", [
        SEED_EVIDENCE.muG12OfficeOrder.id,
      ]);
      expect(rows).toHaveLength(1);
      expect(seedEvidencePath(SEED_EVIDENCE.muG12OfficeOrder)).toContain(SEED_RESPONSES.muG12.organizationId);
    });
  });
});
