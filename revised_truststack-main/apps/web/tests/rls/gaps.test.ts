/**
 * Slice 6 — GATE 5 (RLS) for the gap register and remediation actions.
 *
 *   1. Gaps are DERIVED: the SQL generator reproduces the workbook sample
 *      (98 gaps: 10 critical · 52 high · 36 medium), opens a gap at adjusted
 *      3 and not at 4, and no user — nor tooling with a forged severity — can
 *      write one.
 *   2. Org A cannot see or touch Org B's gaps or actions.
 *   3. Regeneration never discards an action somebody has worked on (D-057).
 *   4. An action cannot be closed on a promise (D-056).
 *   5. `evidence_links` accepts a gap action, and linking or unlinking one
 *      never moves an answer's score.
 *   6. A finalised assessment's gaps are frozen with its score; its actions
 *      live on (D-058).
 *
 * Every test runs inside a transaction that is rolled back.
 */
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { SEED_ASSESSMENTS, SEED_ORGS, SEED_USERS } from "@truststack/db/seed-data";
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
const SAMPLE: { responses: Sample[] } = JSON.parse(
  readFileSync(
    path.resolve(import.meta.dirname, "../../../../packages/db/question-bank/workbook-sample.json"),
    "utf8",
  ),
);

let client: pg.Client;
let who: Map<string, { sub: string; email: string }>;
const u = (id: string) => who.get(id)!;
const consultant = () => u(SEED_USERS.consultant.id); // PROGRAMME: gap.write + evidence.review
const registrar = () => u(SEED_USERS.mumbaiUniversity.id); // dpdp_owner: the same
const legal = () => u(SEED_USERS.muLegal.id); // contributor: gap.write, NO evidence.review
const itSecurity = () => u(SEED_USERS.muItSecurity.id); // contributor, a second one
const dean = () => u(SEED_USERS.muDean.id); // executive sponsor: gap.read only
const bmlAdmin = () => u(SEED_USERS.bmlAdmin.id);
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

interface Answer {
  code: string;
  claimed: number;
  /** A REVIEWED artefact at this level is linked to the answer; null = no evidence at all. */
  level: number | null;
}

/**
 * A new assessment holding exactly these questions (copied from MU's seeded
 * snapshot, so they are real rows with real text) and these answers.
 *
 * A response's evidence level has no user grant and is always re-derived by
 * trigger from its links (D-044), so the fixture goes evidence → review →
 * link, exactly as the product does.
 */
async function assessmentWith(tx: Tx, answers: Answer[], organizationId: string = ORG_A, extraQuestions: string[] = []) {
  const { rows } = await tx.asAdmin<{ id: string }>(
    "INSERT INTO public.assessments (organization_id, name, status) VALUES ($1, 'RLS gaps ' || gen_random_uuid(), 'draft') RETURNING id",
    [organizationId],
  );
  const id = rows[0]!.id;

  await tx.asAdmin(
    `INSERT INTO public.assessment_questions (organization_id, assessment_id, question_code, question_version, question_text,
       domain_code, domain_weight, applicability, priority, evidence_guidance, suggested_owner, pack_code, sort_order, included_reason)
     SELECT $1, $2, question_code, question_version, question_text, domain_code, domain_weight, applicability,
       priority, evidence_guidance, suggested_owner, pack_code, sort_order, included_reason
     FROM public.assessment_questions WHERE assessment_id = $3 AND question_code = ANY($4::text[])`,
    [organizationId, id, MU_BASELINE, [...answers.map((a) => a.code), ...extraQuestions]],
  );

  for (const answer of answers) await answerQuestion(tx, organizationId, id, answer);
  return id;
}

async function answerQuestion(tx: Tx, organizationId: string, assessmentId: string, answer: Answer) {
  const { rows } = await tx.asAdmin<{ id: string }>(
    `INSERT INTO public.assessment_responses (organization_id, assessment_id, question_code, applicability_decision, claimed_maturity)
     VALUES ($1, $2, $3, 'applicable', $4) RETURNING id`,
    [organizationId, assessmentId, answer.code, answer.claimed],
  );
  const responseId = rows[0]!.id;
  if (answer.level !== null) {
    const evidenceId = await reviewedEvidence(tx, organizationId, answer.level);
    await tx.asAdmin(
      `INSERT INTO public.evidence_links (organization_id, evidence_id, linked_entity_type, linked_entity_id)
       VALUES ($1, $2, 'assessment_response', $3)`,
      [organizationId, evidenceId, responseId],
    );
  }
  return responseId;
}

/** A stored, reviewed artefact — uploaded by one person, reviewed by another (D-043). */
async function reviewedEvidence(tx: Tx, organizationId: string, level: number, status = "adequate") {
  const id = randomUUID();
  const filePath = `organizations/${organizationId}/evidence/${id}/proof.pdf`;
  const [uploader, reviewer] =
    organizationId === ORG_A
      ? [SEED_USERS.mumbaiUniversity.id, SEED_USERS.consultant.id]
      : [SEED_USERS.bharatManufacturing.id, SEED_USERS.consultant.id];
  await tx.asAdmin("INSERT INTO storage.objects (bucket_id, name) VALUES ('evidence', $1)", [filePath]);
  await tx.asAdmin(
    `INSERT INTO public.evidence (id, organization_id, storage_path, file_name, content_type, byte_size,
       uploaded_by, review_status, evidence_level, reviewed_by, reviewed_at)
     VALUES ($1, $2, $3, 'proof.pdf', 'application/pdf', 1024, $4, $5, $6, $7, now())`,
    [id, organizationId, filePath, uploader, status, level, reviewer],
  );
  return id;
}

/** Uploaded by a user and stored, but NOT reviewed. */
async function pendingEvidence(tx: Tx, actor: Actor, organizationId: string = ORG_A, stored = true) {
  const id = randomUUID();
  const filePath = `organizations/${organizationId}/evidence/${id}/proof.pdf`;
  await tx.as(
    actor,
    `INSERT INTO public.evidence (id, organization_id, storage_path, file_name, content_type, byte_size)
     VALUES ($1, $2, $3, 'proof.pdf', 'application/pdf', 1024)`,
    [id, organizationId, filePath],
  );
  if (stored) await tx.asAdmin("INSERT INTO storage.objects (bucket_id, name) VALUES ('evidence', $1)", [filePath]);
  return id;
}

/** The whole workbook sample as an assessment — 98 answers, each with reviewed evidence. */
async function workbookAssessment(tx: Tx): Promise<string> {
  const { rows } = await tx.asAdmin<{ id: string }>(
    "INSERT INTO public.assessments (organization_id, name, status) VALUES ($1, 'RLS gaps oracle ' || gen_random_uuid(), 'draft') RETURNING id",
    [ORG_A],
  );
  const id = rows[0]!.id;
  const samples = JSON.stringify(
    SAMPLE.responses.map((r, i) => ({
      question_code: r.questionCode,
      domain_code: r.domainCode,
      ord: i + 1,
      claimed: r.claimedMaturity,
      level: r.evidenceLevel,
      evidence_id: randomUUID(),
    })),
  );
  await tx.asAdmin(
    `INSERT INTO public.assessment_questions (organization_id, assessment_id, question_code, question_version,
       question_text, domain_code, domain_weight, applicability, pack_code, sort_order, included_reason)
     SELECT $1, $2, s.question_code, '1.0', 'Question ' || s.question_code, s.domain_code, d.weight, 'mandatory',
            'CORE_DPDP_V1', s.ord, 'core'
     FROM jsonb_to_recordset($3::jsonb) AS s(question_code text, domain_code text, ord integer)
     JOIN public.dpdp_domains d ON d.code = s.domain_code`,
    [ORG_A, id, samples],
  );
  await tx.asAdmin(
    `INSERT INTO public.assessment_responses (organization_id, assessment_id, question_code, applicability_decision, claimed_maturity)
     SELECT $1, $2, s.question_code, 'applicable', s.claimed
     FROM jsonb_to_recordset($3::jsonb) AS s(question_code text, claimed integer)`,
    [ORG_A, id, samples],
  );
  await tx.asAdmin(
    `INSERT INTO storage.objects (bucket_id, name)
     SELECT 'evidence', 'organizations/' || $1::text || '/evidence/' || s.evidence_id || '/sample.pdf'
     FROM jsonb_to_recordset($2::jsonb) AS s(evidence_id uuid)`,
    [ORG_A, samples],
  );
  await tx.asAdmin(
    `INSERT INTO public.evidence (id, organization_id, storage_path, file_name, content_type, byte_size,
       uploaded_by, review_status, evidence_level, reviewed_by, reviewed_at)
     SELECT s.evidence_id, $1::uuid, 'organizations/' || $1::text || '/evidence/' || s.evidence_id || '/sample.pdf',
            'sample.pdf', 'application/pdf', 1024, $3::uuid, 'adequate', s.level, $4::uuid, now()
     FROM jsonb_to_recordset($2::jsonb) AS s(evidence_id uuid, level integer)`,
    [ORG_A, samples, SEED_USERS.mumbaiUniversity.id, SEED_USERS.consultant.id],
  );
  await tx.asAdmin(
    `INSERT INTO public.evidence_links (organization_id, evidence_id, linked_entity_type, linked_entity_id)
     SELECT $1::uuid, s.evidence_id, 'assessment_response', r.id
     FROM jsonb_to_recordset($3::jsonb) AS s(evidence_id uuid, question_code text)
     JOIN public.assessment_responses r
       ON r.organization_id = $1::uuid AND r.assessment_id = $2::uuid AND r.question_code = s.question_code`,
    [ORG_A, id, samples],
  );
  return id;
}

const generateAs = (tx: Tx, actor: Actor, assessmentId: string, organizationId: string = ORG_A) =>
  tx.as<{ result: Record<string, number> }>(actor, "SELECT public.generate_assessment_gaps($1, $2) AS result", [
    organizationId,
    assessmentId,
  ]);

interface GapRow {
  id: string;
  question_code: string;
  severity: string;
  priority: string;
  adjusted_score: number;
  state: string;
}

async function gapsOf(tx: Tx, assessmentId: string) {
  const { rows } = await tx.asAdmin<GapRow>(
    "SELECT id, question_code, severity, priority, adjusted_score, state FROM public.assessment_gaps WHERE assessment_id = $1 ORDER BY question_code",
    [assessmentId],
  );
  return rows;
}

interface ActionRow {
  id: string;
  gap_id: string;
  title: string;
  owner_user_id: string | null;
  owner_role: string | null;
  status: string;
  due_date: string | null;
  closed_at: Date | null;
  closed_by: string | null;
  closure_basis: string | null;
  notes: string | null;
  updated_by: string | null;
}

async function actionFor(tx: Tx, assessmentId: string, questionCode: string) {
  const { rows } = await tx.asAdmin<ActionRow>(
    `SELECT a.id, a.gap_id, a.title, a.owner_user_id, a.owner_role, a.status, a.due_date::text AS due_date,
            a.closed_at, a.closed_by, a.closure_basis, a.notes, a.updated_by
     FROM public.gap_actions a JOIN public.assessment_gaps g ON g.id = a.gap_id
     WHERE g.assessment_id = $1 AND g.question_code = $2`,
    [assessmentId, questionCode],
  );
  return rows[0]!;
}

const setAction = (tx: Tx, actor: Actor, actionId: string, set: string, params: unknown[] = []) =>
  tx.as(actor, `UPDATE public.gap_actions SET ${set} WHERE id = $1 RETURNING id`, [actionId, ...params]);

/** One assessment, one weak answer, its gap generated — the usual starting point for an action test. */
async function oneGap(tx: Tx, answer: Answer = { code: "G1.1", claimed: 1, level: null }) {
  const assessmentId = await assessmentWith(tx, [answer]);
  await generateAs(tx, consultant(), assessmentId);
  const action = await actionFor(tx, assessmentId, answer.code);
  return { assessmentId, action };
}

const linkToAction = (tx: Tx, actor: Actor | "admin", evidenceId: string, actionId: string, organizationId: string = ORG_A) => {
  const sql = `INSERT INTO public.evidence_links (organization_id, evidence_id, linked_entity_type, linked_entity_id)
               VALUES ($1, $2, 'gap_action', $3)`;
  const params = [organizationId, evidenceId, actionId];
  return actor === "admin" ? tx.asAdmin(sql, params) : tx.as(actor, sql, params);
};

// ---------------------------------------------------------------------------
// GATE — generation is derived
// ---------------------------------------------------------------------------

describe("GATE — the workbook's 98 samples through the SQL generator", () => {
  it("opens 98 gaps: 10 critical · 52 high · 36 medium — the same counts the score reports", async () => {
    await inTransaction(client, async (tx) => {
      const id = await workbookAssessment(tx);
      const { rows } = await generateAs(tx, consultant(), id);
      expect(rows[0]!.result).toMatchObject({
        gapCount: 98,
        critical: 10,
        high: 52,
        medium: 36,
        low: 0,
        supersededCount: 0,
        opened: 98,
        superseded: 0,
        removed: 0,
      });

      // The register and the engine count the same answers the same way.
      const score = await tx.asAdmin<{ critical: string; high: string }>(
        "SELECT sum(critical_count) AS critical, sum(high_count) AS high FROM app.assessment_domain_results($1, $2)",
        [ORG_A, id],
      );
      expect(Number(score.rows[0]!.critical)).toBe(10);
      expect(Number(score.rows[0]!.high)).toBe(52);
    });
  });

  it("gives every gap exactly one action, due 30 / 60 / 90 days out by priority", async () => {
    await inTransaction(client, async (tx) => {
      const id = await workbookAssessment(tx);
      await generateAs(tx, consultant(), id);
      const { rows } = await tx.asAdmin<{ priority: string; days: number | null; n: string }>(
        `SELECT g.priority, a.due_date - (now() AT TIME ZONE 'Asia/Kolkata')::date AS days, count(*) AS n
         FROM public.assessment_gaps g JOIN public.gap_actions a ON a.gap_id = g.id
         WHERE g.assessment_id = $1 GROUP BY 1, 2 ORDER BY 1`,
        [id],
      );
      expect(rows.map((r) => [r.priority, r.days, Number(r.n)])).toEqual([
        ["P0", 30, 10],
        ["P1", 60, 52],
        ["P2", 90, 36],
      ]);
    });
  });

  it("is idempotent: generating twice changes nothing", async () => {
    await inTransaction(client, async (tx) => {
      const id = await workbookAssessment(tx);
      await generateAs(tx, consultant(), id);
      const before = await tx.asAdmin("SELECT id, updated_at FROM public.assessment_gaps WHERE assessment_id = $1 ORDER BY id", [id]);
      const { rows } = await generateAs(tx, registrar(), id);
      expect(rows[0]!.result).toMatchObject({ gapCount: 98, opened: 0, superseded: 0, removed: 0 });
      const after = await tx.asAdmin("SELECT id, updated_at FROM public.assessment_gaps WHERE assessment_id = $1 ORDER BY id", [id]);
      expect(after.rows).toEqual(before.rows);
      const actions = await tx.asAdmin(
        "SELECT 1 FROM public.gap_actions a JOIN public.assessment_gaps g ON g.id = a.gap_id WHERE g.assessment_id = $1",
        [id],
      );
      expect(actions.rows).toHaveLength(98);
    });
  });
});

describe("the gap threshold in SQL (D-054)", () => {
  // The workbook sample cannot police this: none of its answers is above 2.
  it("adjusted 3 opens a gap; adjusted 4 does not", async () => {
    await inTransaction(client, async (tx) => {
      const id = await assessmentWith(tx, [
        { code: "G1.1", claimed: 3, level: 3 }, // adjusted 3 → Low
        { code: "G1.3", claimed: 4, level: 4 }, // adjusted 4 → no gap
        { code: "G1.4", claimed: 5, level: 5 }, // adjusted 5 → no gap
      ]);
      await generateAs(tx, consultant(), id);
      expect(await gapsOf(tx, id)).toMatchObject([
        { question_code: "G1.1", severity: "low", priority: "P3", adjusted_score: 3, state: "open" },
      ]);
    });
  });

  it("a Low gap gets no invented due date — it belongs to the next cycle", async () => {
    await inTransaction(client, async (tx) => {
      const { action } = await oneGap(tx, { code: "G1.1", claimed: 3, level: 3 });
      expect(action.due_date).toBeNull();
    });
  });

  it("severity comes from the ADJUSTED score: an unevidenced claim of 5 is a High / P1 gap, not Critical", async () => {
    await inTransaction(client, async (tx) => {
      const id = await assessmentWith(tx, [
        { code: "G1.1", claimed: 5, level: null }, // adjusted 1
        { code: "G1.3", claimed: 0, level: null }, // adjusted 0
        { code: "G1.4", claimed: 4, level: 1 }, // E1 caps at 2
      ]);
      await generateAs(tx, consultant(), id);
      expect(await gapsOf(tx, id)).toMatchObject([
        { question_code: "G1.1", severity: "high", priority: "P1", adjusted_score: 1 },
        { question_code: "G1.3", severity: "critical", priority: "P0", adjusted_score: 0 },
        { question_code: "G1.4", severity: "medium", priority: "P2", adjusted_score: 2 },
      ]);
    });
  });

  it("an unanswered question and a Not Applicable answer open nothing", async () => {
    await inTransaction(client, async (tx) => {
      // UNI-GOV-009 is conditional, so it may be excluded; G1.5 is never answered.
      const id = await assessmentWith(tx, [{ code: "G1.1", claimed: 1, level: null }], ORG_A, ["G1.5", "UNI-GOV-009"]);
      await tx.asAdmin(
        `INSERT INTO public.assessment_responses (organization_id, assessment_id, question_code, applicability_decision, na_reason)
         VALUES ($1, $2, 'UNI-GOV-009', 'not_applicable', 'The University has no affiliated colleges.')`,
        [ORG_A, id],
      );
      await generateAs(tx, consultant(), id);
      expect((await gapsOf(tx, id)).map((g) => g.question_code)).toEqual(["G1.1"]);
    });
  });

  it("a Scoped Out domain has no gaps — its questions were never asked (D-038)", async () => {
    await inTransaction(client, async (tx) => {
      const id = await assessmentWith(tx, [
        { code: "G1.1", claimed: 0, level: null },
        { code: "S1.1", claimed: 0, level: null },
      ]);
      await generateAs(tx, consultant(), id);
      const states = await tx.asAdmin<{ domain_code: string; state: string }>(
        "SELECT domain_code, state FROM app.assessment_domain_results($1, $2) WHERE domain_code = 'VENDOR'",
        [ORG_A, id],
      );
      expect(states.rows[0]!.state).toBe("scoped_out");
      const domains = await tx.asAdmin<{ domain_code: string }>(
        "SELECT DISTINCT domain_code FROM public.assessment_gaps WHERE assessment_id = $1 ORDER BY 1",
        [id],
      );
      expect(domains.rows.map((r) => r.domain_code)).toEqual(["GOV", "SECURITY"]);
    });
  });

  // 234 bank questions have no authored priority. A gap's priority comes from
  // its severity, so a null there can neither crash the generator nor become P0.
  it("a question with NO authored priority still gets a gap, prioritised by severity", async () => {
    await inTransaction(client, async (tx) => {
      const id = await assessmentWith(tx, [{ code: "G1.1", claimed: 3, level: 3 }]);
      await tx.asAdmin("UPDATE public.assessment_questions SET priority = NULL WHERE assessment_id = $1", [id]);
      await generateAs(tx, consultant(), id);
      expect(await gapsOf(tx, id)).toMatchObject([{ question_code: "G1.1", severity: "low", priority: "P3" }]);
    });
  });

  it("carries the question's recommended fix and suggested owner onto the gap and its action", async () => {
    await inTransaction(client, async (tx) => {
      const { assessmentId, action } = await oneGap(tx, { code: "G1.2", claimed: 2, level: 2 });
      const { rows } = await tx.asAdmin<{ finding: string; recommended_fix: string }>(
        "SELECT finding, recommended_fix FROM public.assessment_gaps WHERE assessment_id = $1",
        [assessmentId],
      );
      expect(rows[0]!.finding).toBe("Review and remediate: Is there a formally nominated DPDP owner or nodal officer?");
      expect(rows[0]!.recommended_fix).toBe("Nominate DPDP owner and publish internal responsibility note.");
      expect(action.title).toBe("Nominate DPDP owner and publish internal responsibility note.");
      expect(action.owner_role).toBe("Executive Sponsor / DPDP Owner");
      expect(action.owner_user_id).toBeNull();
      expect(action.status).toBe("open");
    });
  });
});

describe("a gap is never hand-written", () => {
  it("no user can INSERT, UPDATE or DELETE a gap — there is no grant", async () => {
    await inTransaction(client, async (tx) => {
      const { assessmentId } = await oneGap(tx);
      await expect(
        tx.as(
          consultant(),
          `INSERT INTO public.assessment_gaps (organization_id, assessment_id, question_code, domain_code, severity, priority, adjusted_score, finding)
           VALUES ($1, $2, 'G1.1', 'GOV', 'low', 'P3', 3, 'made up')`,
          [ORG_A, assessmentId],
        ),
      ).rejects.toMatchObject({ code: "42501" });
      await expect(
        tx.as(consultant(), "UPDATE public.assessment_gaps SET severity = 'low' WHERE assessment_id = $1", [assessmentId]),
      ).rejects.toMatchObject({ code: "42501" });
      await expect(
        tx.as(consultant(), "DELETE FROM public.assessment_gaps WHERE assessment_id = $1", [assessmentId]),
      ).rejects.toMatchObject({ code: "42501" });
    });
  });

  it("no user can INSERT or DELETE an action either — the generator creates them", async () => {
    await inTransaction(client, async (tx) => {
      const { action } = await oneGap(tx);
      await expect(
        tx.as(consultant(), "INSERT INTO public.gap_actions (organization_id, gap_id, title) VALUES ($1, $2, 'extra')", [
          ORG_A,
          action.gap_id,
        ]),
      ).rejects.toMatchObject({ code: "42501" });
      await expect(tx.as(consultant(), "DELETE FROM public.gap_actions WHERE id = $1", [action.id])).rejects.toMatchObject({
        code: "42501",
      });
    });
  });

  it("a forged severity is refused even from tooling — severity is an invariant of the adjusted score", async () => {
    await inTransaction(client, async (tx) => {
      const { assessmentId } = await oneGap(tx); // adjusted 1 → high
      await expect(
        // A consistent pair — Low / P3 — on an answer that actually scored 1.
        tx.asAdmin("UPDATE public.assessment_gaps SET severity = 'low', priority = 'P3' WHERE assessment_id = $1", [assessmentId]),
      ).rejects.toMatchObject({ code: "23514", constraint: "assessment_gaps_severity_is_derived" });
      await expect(
        tx.asAdmin("UPDATE public.assessment_gaps SET priority = 'P3' WHERE assessment_id = $1", [assessmentId]),
      ).rejects.toMatchObject({ code: "23514", constraint: "assessment_gaps_priority_is_derived" });
    });
  });

  it("tooling cannot store a 'gap' for an answer that scored 4", async () => {
    await inTransaction(client, async (tx) => {
      const { assessmentId } = await oneGap(tx);
      await expect(
        tx.asAdmin(
          "UPDATE public.assessment_gaps SET adjusted_score = 4, severity = 'improvement', priority = 'P3' WHERE assessment_id = $1",
          [assessmentId],
        ),
      ).rejects.toMatchObject({ code: "23514" });
    });
  });

  it("the RPC takes two ids and nothing a caller could forge", async () => {
    const { rows } = await client.query<{ args: string }>(
      "SELECT pg_get_function_identity_arguments('public.generate_assessment_gaps(uuid, uuid)'::regprocedure) AS args",
    );
    expect(rows[0]!.args).toBe("p_organization_id uuid, p_assessment_id uuid");
  });
});

describe("generate_assessment_gaps — who may call it", () => {
  it("refuses without gap.write, even to someone who can read the register", async () => {
    await inTransaction(client, async (tx) => {
      const id = await assessmentWith(tx, [{ code: "G1.1", claimed: 1, level: null }]);
      await expect(generateAs(tx, dean(), id)).rejects.toMatchObject({ code: "TS403" });
      expect(await gapsOf(tx, id)).toHaveLength(0);
    });
  });

  it("a contributor holds gap.write and may generate", async () => {
    await inTransaction(client, async (tx) => {
      const id = await assessmentWith(tx, [{ code: "G1.1", claimed: 1, level: null }]);
      await generateAs(tx, legal(), id);
      expect(await gapsOf(tx, id)).toHaveLength(1);
    });
  });

  it("refuses an anonymous caller", async () => {
    await inTransaction(client, async (tx) => {
      const id = await assessmentWith(tx, [{ code: "G1.1", claimed: 1, level: null }]);
      await expect(tx.as(null, "SELECT public.generate_assessment_gaps($1, $2)", [ORG_A, id])).rejects.toBeTruthy();
    });
  });

  it("refuses another tenant's assessment — a member of Org B cannot generate Org A's register", async () => {
    await inTransaction(client, async (tx) => {
      const id = await assessmentWith(tx, [{ code: "G1.1", claimed: 1, level: null }]);
      await expect(generateAs(tx, bmlAdmin(), id)).rejects.toMatchObject({ code: "TS403" });
      // …and naming its own organisation with Org A's assessment finds nothing.
      await expect(generateAs(tx, bmlAdmin(), id, ORG_B)).rejects.toMatchObject({ code: "TS404" });
      expect(await gapsOf(tx, id)).toHaveLength(0);
    });
  });

  it("refuses an unknown assessment id", async () => {
    await inTransaction(client, async (tx) => {
      await expect(generateAs(tx, consultant(), randomUUID())).rejects.toMatchObject({ code: "TS404" });
    });
  });

  it("writes ONE audit row carrying the counts — not one per gap", async () => {
    await inTransaction(client, async (tx) => {
      const id = await workbookAssessment(tx);
      await generateAs(tx, consultant(), id);
      const { rows } = await tx.asAdmin<{ event_type: string; metadata: Record<string, unknown> }>(
        "SELECT event_type, metadata FROM public.audit_logs WHERE entity_id = $1 AND event_type LIKE 'assessment.gaps.%'",
        [id],
      );
      expect(rows).toHaveLength(1);
      expect(rows[0]!.metadata).toMatchObject({ gapCount: 98, critical: 10, high: 52, medium: 36, opened: 98 });
      // No per-gap or per-action rows either.
      const noise = await tx.asAdmin(
        "SELECT 1 FROM public.audit_logs WHERE organization_id = $1 AND entity_type IN ('assessment_gaps', 'gap_actions') AND created_at >= now()",
        [ORG_A],
      );
      expect(noise.rows).toHaveLength(0);
    });
  });
});

// ---------------------------------------------------------------------------
// GATE 5 — Org A ≠ Org B
// ---------------------------------------------------------------------------

describe("GATE 5 — tenant isolation on gaps and actions", () => {
  it("Org B sees none of Org A's gaps or actions, and Org A none of Org B's", async () => {
    await inTransaction(client, async (tx) => {
      const a = await assessmentWith(tx, [{ code: "G1.1", claimed: 1, level: null }], ORG_A);
      const b = await assessmentWith(tx, [{ code: "G1.1", claimed: 1, level: null }], ORG_B);
      await generateAs(tx, consultant(), a, ORG_A);
      await generateAs(tx, consultant(), b, ORG_B);

      for (const table of ["assessment_gaps", "gap_actions"]) {
        const asB = await tx.as<{ organization_id: string }>(bmlAdmin(), `SELECT DISTINCT organization_id FROM public.${table}`);
        expect(asB.rows.map((r) => r.organization_id)).toEqual([ORG_B]);
        const asA = await tx.as<{ organization_id: string }>(registrar(), `SELECT DISTINCT organization_id FROM public.${table}`);
        expect(asA.rows.map((r) => r.organization_id)).toEqual([ORG_A]);
      }
    });
  });

  it("anon sees nothing at all", async () => {
    await inTransaction(client, async (tx) => {
      await expect(tx.as(null, "SELECT 1 FROM public.assessment_gaps")).rejects.toMatchObject({ code: "42501" });
      await expect(tx.as(null, "SELECT 1 FROM public.gap_actions")).rejects.toMatchObject({ code: "42501" });
    });
  });

  it("Org B cannot update Org A's action — the row is simply not there for it", async () => {
    await inTransaction(client, async (tx) => {
      const { action } = await oneGap(tx);
      const result = await setAction(tx, bmlAdmin(), action.id, "status = 'in_progress'");
      expect(result.rowCount).toBe(0);
      const after = await tx.asAdmin<{ status: string }>("SELECT status FROM public.gap_actions WHERE id = $1", [action.id]);
      expect(after.rows[0]!.status).toBe("open");
    });
  });

  it("a read-only member can see the register but not change an action", async () => {
    await inTransaction(client, async (tx) => {
      const { action } = await oneGap(tx);
      const seen = await tx.as(dean(), "SELECT 1 FROM public.gap_actions WHERE id = $1", [action.id]);
      expect(seen.rows).toHaveLength(1);
      const result = await setAction(tx, dean(), action.id, "status = 'in_progress'");
      expect(result.rowCount).toBe(0);
    });
  });

  it("an action cannot be owned by someone from another organisation", async () => {
    await inTransaction(client, async (tx) => {
      const { action } = await oneGap(tx);
      await expect(
        setAction(tx, consultant(), action.id, "owner_user_id = $2", [SEED_USERS.bmlAdmin.id]),
      ).rejects.toMatchObject({ code: "TS422" });
    });
  });

  it("the composite FK refuses an Org B action under an Org A gap, even as tooling (D-027)", async () => {
    await inTransaction(client, async (tx) => {
      const { action } = await oneGap(tx);
      await expect(
        tx.asAdmin("INSERT INTO public.gap_actions (organization_id, gap_id, title) VALUES ($1, $2, 'foreign')", [
          ORG_B,
          action.gap_id,
        ]),
      ).rejects.toMatchObject({ code: "23503" });
    });
  });

  it("Org B cannot attach its evidence to Org A's action, nor Org A's evidence to its own", async () => {
    await inTransaction(client, async (tx) => {
      const { action } = await oneGap(tx);
      const bEvidence = await reviewedEvidence(tx, ORG_B, 5);
      // Its own organisation, Org A's action: the action is not found there.
      await expect(linkToAction(tx, bmlOwner(), bEvidence, action.id, ORG_B)).rejects.toMatchObject({ code: "TS404" });
      // Naming Org A: it holds no permission there, and the trigger says so.
      await expect(linkToAction(tx, bmlOwner(), bEvidence, action.id, ORG_A)).rejects.toMatchObject({ code: "TS403" });
      // Tooling cannot cross the line either: the evidence is not Org A's.
      await expect(linkToAction(tx, "admin", bEvidence, action.id, ORG_A)).rejects.toBeTruthy();
    });
  });
});

// ---------------------------------------------------------------------------
// Regeneration (D-057)
// ---------------------------------------------------------------------------

describe("regeneration never discards human work (D-057)", () => {
  /** Raise the answer above the threshold by reviewing its evidence up — which is what real remediation looks like. */
  async function improve(tx: Tx, assessmentId: string, questionCode: string) {
    const evidenceId = await reviewedEvidence(tx, ORG_A, 5);
    await tx.asAdmin(
      `INSERT INTO public.evidence_links (organization_id, evidence_id, linked_entity_type, linked_entity_id)
       SELECT $1, $2, 'assessment_response', r.id FROM public.assessment_responses r
       WHERE r.assessment_id = $3 AND r.question_code = $4`,
      [ORG_A, evidenceId, assessmentId, questionCode],
    );
  }

  it("an untouched gap whose answer improves is simply removed", async () => {
    await inTransaction(client, async (tx) => {
      const id = await assessmentWith(tx, [{ code: "G1.1", claimed: 5, level: null }]);
      await generateAs(tx, consultant(), id);
      expect(await gapsOf(tx, id)).toHaveLength(1);

      await improve(tx, id, "G1.1"); // adjusted 1 → 5
      const { rows } = await generateAs(tx, consultant(), id);
      expect(rows[0]!.result).toMatchObject({ gapCount: 0, removed: 1, superseded: 0 });
      expect(await gapsOf(tx, id)).toHaveLength(0);
    });
  });

  it("a gap whose action carries human work is kept as SUPERSEDED — owner, notes and status intact", async () => {
    await inTransaction(client, async (tx) => {
      const id = await assessmentWith(tx, [{ code: "G1.1", claimed: 5, level: null }]);
      await generateAs(tx, consultant(), id);
      const action = await actionFor(tx, id, "G1.1");
      await setAction(tx, legal(), action.id, "owner_user_id = $2, notes = $3, status = 'in_progress'", [
        SEED_USERS.muLegal.id,
        "Office order drafted; awaiting the Vice-Chancellor's signature.",
      ]);

      await improve(tx, id, "G1.1");
      const { rows } = await generateAs(tx, consultant(), id);
      expect(rows[0]!.result).toMatchObject({ gapCount: 0, supersededCount: 1, superseded: 1, removed: 0 });

      expect(await gapsOf(tx, id)).toMatchObject([{ question_code: "G1.1", state: "superseded", adjusted_score: 1 }]);
      expect(await actionFor(tx, id, "G1.1")).toMatchObject({
        id: action.id,
        owner_user_id: SEED_USERS.muLegal.id,
        notes: "Office order drafted; awaiting the Vice-Chancellor's signature.",
        status: "in_progress",
      });
    });
  });

  it("evidence attached to an action counts as human work too", async () => {
    await inTransaction(client, async (tx) => {
      const id = await assessmentWith(tx, [{ code: "G1.1", claimed: 5, level: null }]);
      await generateAs(tx, consultant(), id);
      const action = await actionFor(tx, id, "G1.1");
      await linkToAction(tx, legal(), await pendingEvidence(tx, legal()), action.id);

      await improve(tx, id, "G1.1");
      await generateAs(tx, consultant(), id);
      expect(await gapsOf(tx, id)).toMatchObject([{ state: "superseded" }]);
    });
  });

  it("a gap that still applies is refreshed in place — and its action is NOT rewritten", async () => {
    await inTransaction(client, async (tx) => {
      const id = await assessmentWith(tx, [{ code: "G1.1", claimed: 2, level: null }]); // adjusted 1 → high / P1
      await generateAs(tx, consultant(), id);
      const before = await actionFor(tx, id, "G1.1");
      await setAction(tx, legal(), before.id, "due_date = '2027-01-15', notes = 'Agreed with the Registrar.'");

      // The answer gets worse: a claim of 0 is Critical.
      await tx.asAdmin("UPDATE public.assessment_responses SET claimed_maturity = 0 WHERE assessment_id = $1", [id]);
      const { rows } = await generateAs(tx, consultant(), id);
      expect(rows[0]!.result).toMatchObject({ gapCount: 1, critical: 1, opened: 0, removed: 0 });

      expect(await gapsOf(tx, id)).toMatchObject([{ severity: "critical", priority: "P0", adjusted_score: 0, state: "open" }]);
      const after = await actionFor(tx, id, "G1.1");
      expect(after.id).toBe(before.id);
      // A stored due date does not move under the client (D-055).
      expect(after.due_date).toBe("2027-01-15");
      expect(after.notes).toBe("Agreed with the Registrar.");
      const count = await tx.asAdmin("SELECT 1 FROM public.gap_actions WHERE gap_id = $1", [after.gap_id]);
      expect(count.rows).toHaveLength(1);
    });
  });

  it("a superseded gap reopens if the answer falls back — with the same action", async () => {
    await inTransaction(client, async (tx) => {
      const id = await assessmentWith(tx, [{ code: "G1.1", claimed: 5, level: null }]);
      await generateAs(tx, consultant(), id);
      const action = await actionFor(tx, id, "G1.1");
      await setAction(tx, legal(), action.id, "status = 'in_progress'");
      await improve(tx, id, "G1.1");
      await generateAs(tx, consultant(), id);
      expect(await gapsOf(tx, id)).toMatchObject([{ state: "superseded" }]);

      await tx.asAdmin("UPDATE public.assessment_responses SET claimed_maturity = 2 WHERE assessment_id = $1", [id]);
      await generateAs(tx, consultant(), id);
      expect(await gapsOf(tx, id)).toMatchObject([{ state: "open", severity: "medium", adjusted_score: 2 }]);
      expect((await actionFor(tx, id, "G1.1")).id).toBe(action.id);
    });
  });
});

// ---------------------------------------------------------------------------
// The workflow, and closing (D-056)
// ---------------------------------------------------------------------------

describe("the action workflow", () => {
  it("a contributor can assign an owner, set a due date and move the status", async () => {
    await inTransaction(client, async (tx) => {
      const { action } = await oneGap(tx);
      await setAction(tx, legal(), action.id, "owner_user_id = $2, due_date = '2026-12-01', status = 'in_progress'", [
        SEED_USERS.muItSecurity.id,
      ]);
      const { rows } = await tx.asAdmin<ActionRow>(
        "SELECT owner_user_id, due_date::text AS due_date, status, updated_by FROM public.gap_actions WHERE id = $1",
        [action.id],
      );
      expect(rows[0]).toMatchObject({
        owner_user_id: SEED_USERS.muItSecurity.id,
        due_date: "2026-12-01",
        status: "in_progress",
        updated_by: SEED_USERS.muLegal.id, // stamped by the database, not sent
      });
    });
  });

  it("refuses a move the graph does not allow: Blocked cannot close directly", async () => {
    await inTransaction(client, async (tx) => {
      const { action } = await oneGap(tx);
      await setAction(tx, consultant(), action.id, "owner_user_id = $2, status = 'blocked'", [SEED_USERS.muLegal.id]);
      await expect(setAction(tx, consultant(), action.id, "status = 'closed'")).rejects.toMatchObject({ code: "TS409" });
    });
  });

  it("refuses a status outside the vocabulary", async () => {
    await inTransaction(client, async (tx) => {
      const { action } = await oneGap(tx);
      await expect(setAction(tx, consultant(), action.id, "status = 'done'")).rejects.toBeTruthy();
    });
  });

  it("no user can write closed_at, closed_by, closure_basis or updated_by", async () => {
    await inTransaction(client, async (tx) => {
      const { action } = await oneGap(tx);
      for (const set of [
        "closed_at = now()",
        `closed_by = '${SEED_USERS.consultant.id}'`,
        "closure_basis = 'evidence'",
        `updated_by = '${SEED_USERS.consultant.id}'`,
        `gap_id = '${randomUUID()}'`,
      ]) {
        await expect(setAction(tx, consultant(), action.id, set)).rejects.toMatchObject({ code: "42501" });
      }
    });
  });

  it("audits a user's change with the column NAMES — never the notes or the title", async () => {
    await inTransaction(client, async (tx) => {
      const { action } = await oneGap(tx);
      await setAction(tx, legal(), action.id, "notes = 'CONFIDENTIAL remediation detail', title = 'SECRET plan', status = 'in_progress'");
      const { rows } = await tx.asAdmin<{ event_type: string; user_id: string; metadata: Record<string, unknown> }>(
        "SELECT event_type, user_id, metadata FROM public.audit_logs WHERE entity_id = $1",
        [action.id],
      );
      expect(rows).toHaveLength(1);
      expect(rows[0]!.event_type).toBe("gap.gap_actions.update");
      expect(rows[0]!.user_id).toBe(SEED_USERS.muLegal.id);
      expect(rows[0]!.metadata).toMatchObject({ changed: ["notes", "status", "title"], actionStatus: "in_progress" });
      expect(JSON.stringify(rows[0]!.metadata)).not.toMatch(/CONFIDENTIAL|SECRET/);
    });
  });

  it("a no-op save is not an event, and does not count as human work", async () => {
    await inTransaction(client, async (tx) => {
      const { action } = await oneGap(tx);
      await setAction(tx, legal(), action.id, "status = 'open'");
      const audit = await tx.asAdmin("SELECT 1 FROM public.audit_logs WHERE entity_id = $1", [action.id]);
      expect(audit.rows).toHaveLength(0);
      const { rows } = await tx.asAdmin<{ updated_by: string | null }>("SELECT updated_by FROM public.gap_actions WHERE id = $1", [
        action.id,
      ]);
      expect(rows[0]!.updated_by).toBeNull();
    });
  });
});

describe("closing — never on a promise (D-056)", () => {
  const CLOSING = "Closing needs reviewed evidence attached to this action, or approval by a reviewer who is not its owner.";

  async function owned(tx: Tx, ownerId: string) {
    const { assessmentId, action } = await oneGap(tx);
    await setAction(tx, consultant(), action.id, "owner_user_id = $2, status = 'in_progress'", [ownerId]);
    return { assessmentId, action };
  }

  it("refuses an action nobody owns", async () => {
    await inTransaction(client, async (tx) => {
      const { action } = await oneGap(tx);
      await expect(setAction(tx, consultant(), action.id, "status = 'closed'")).rejects.toMatchObject({
        code: "TS409",
        message: "Assign an owner before closing this action.",
      });
    });
  });

  it("refuses the owner closing their own action with nothing attached", async () => {
    await inTransaction(client, async (tx) => {
      const { action } = await owned(tx, SEED_USERS.muLegal.id);
      await expect(setAction(tx, legal(), action.id, "status = 'closed'")).rejects.toMatchObject({
        code: "TS409",
        message: CLOSING,
      });
    });
  });

  it("refuses the owner even when the owner is a reviewer — nobody approves their own work", async () => {
    await inTransaction(client, async (tx) => {
      const { action } = await owned(tx, SEED_USERS.consultant.id);
      await expect(setAction(tx, consultant(), action.id, "status = 'closed'")).rejects.toMatchObject({ code: "TS409" });
    });
  });

  it("refuses a colleague who is not a reviewer", async () => {
    await inTransaction(client, async (tx) => {
      const { action } = await owned(tx, SEED_USERS.muLegal.id);
      await expect(setAction(tx, itSecurity(), action.id, "status = 'closed'")).rejects.toMatchObject({
        code: "TS409",
        message: CLOSING,
      });
    });
  });

  it("allows a reviewer who is not the owner, and records who, when and on what basis", async () => {
    await inTransaction(client, async (tx) => {
      const { assessmentId, action } = await owned(tx, SEED_USERS.muLegal.id);
      await setAction(tx, registrar(), action.id, "status = 'closed'");
      const closed = await actionFor(tx, assessmentId, "G1.1");
      expect(closed).toMatchObject({
        status: "closed",
        closure_basis: "reviewer_approval",
        closed_by: SEED_USERS.mumbaiUniversity.id,
      });
      expect(closed.closed_at).not.toBeNull();

      const { rows } = await tx.asAdmin<{ metadata: Record<string, unknown>; user_id: string }>(
        "SELECT metadata, user_id FROM public.audit_logs WHERE entity_id = $1 ORDER BY created_at DESC, id DESC",
        [action.id],
      );
      expect(rows.some((r) => r.user_id === SEED_USERS.mumbaiUniversity.id && r.metadata.closureBasis === "reviewer_approval")).toBe(
        true,
      );
    });
  });

  it("evidence that has not been reviewed is still a promise", async () => {
    await inTransaction(client, async (tx) => {
      const { action } = await owned(tx, SEED_USERS.muLegal.id);
      await linkToAction(tx, legal(), await pendingEvidence(tx, legal()), action.id);
      await expect(setAction(tx, legal(), action.id, "status = 'closed'")).rejects.toMatchObject({
        code: "TS409",
        message: CLOSING,
      });
    });
  });

  it("nor is evidence reviewed as Partial or Rejected", async () => {
    await inTransaction(client, async (tx) => {
      const { action } = await owned(tx, SEED_USERS.muLegal.id);
      await linkToAction(tx, "admin", await reviewedEvidence(tx, ORG_A, 2, "partial"), action.id);
      await linkToAction(tx, "admin", await reviewedEvidence(tx, ORG_A, 0, "rejected"), action.id);
      await expect(setAction(tx, legal(), action.id, "status = 'closed'")).rejects.toMatchObject({ code: "TS409" });
    });
  });

  it("the owner CAN close once a reviewer has accepted evidence on the action", async () => {
    await inTransaction(client, async (tx) => {
      const { assessmentId, action } = await owned(tx, SEED_USERS.muLegal.id);
      const evidenceId = await pendingEvidence(tx, legal());
      await linkToAction(tx, legal(), evidenceId, action.id);
      // The second person: nobody reviews their own upload (D-043).
      await expect(
        tx.as(legal(), "UPDATE public.evidence SET review_status = 'adequate', evidence_level = 4 WHERE id = $1 RETURNING id", [
          evidenceId,
        ]),
      ).resolves.toMatchObject({ rowCount: 0 });
      await tx.as(consultant(), "UPDATE public.evidence SET review_status = 'adequate', evidence_level = 4 WHERE id = $1", [
        evidenceId,
      ]);

      await setAction(tx, legal(), action.id, "status = 'closed'");
      expect(await actionFor(tx, assessmentId, "G1.1")).toMatchObject({
        status: "closed",
        closure_basis: "evidence",
        closed_by: SEED_USERS.muLegal.id,
      });
    });
  });

  it("evidence is the recorded basis even when a reviewer closes", async () => {
    await inTransaction(client, async (tx) => {
      const { assessmentId, action } = await owned(tx, SEED_USERS.muLegal.id);
      await linkToAction(tx, "admin", await reviewedEvidence(tx, ORG_A, 5, "strong"), action.id);
      await setAction(tx, registrar(), action.id, "status = 'closed'");
      expect((await actionFor(tx, assessmentId, "G1.1")).closure_basis).toBe("evidence");
    });
  });

  it("a closed action is read-only until it is reopened", async () => {
    await inTransaction(client, async (tx) => {
      const { action } = await owned(tx, SEED_USERS.muLegal.id);
      await setAction(tx, registrar(), action.id, "status = 'closed'");
      await expect(setAction(tx, registrar(), action.id, "notes = 'afterthought'")).rejects.toMatchObject({ code: "TS409" });
      await expect(
        setAction(tx, registrar(), action.id, "owner_user_id = $2", [SEED_USERS.mumbaiUniversity.id]),
      ).rejects.toMatchObject({ code: "TS409" });
    });
  });

  it("reopening goes to In Progress only, and clears the closure", async () => {
    await inTransaction(client, async (tx) => {
      const { assessmentId, action } = await owned(tx, SEED_USERS.muLegal.id);
      await setAction(tx, registrar(), action.id, "status = 'closed'");
      await expect(setAction(tx, legal(), action.id, "status = 'open'")).rejects.toMatchObject({ code: "TS409" });
      await setAction(tx, legal(), action.id, "status = 'in_progress'");
      expect(await actionFor(tx, assessmentId, "G1.1")).toMatchObject({
        status: "in_progress",
        closed_at: null,
        closed_by: null,
        closure_basis: null,
      });
    });
  });

  it("the row invariants bind tooling: closed needs a timestamp and a basis, and nobody self-approves", async () => {
    await inTransaction(client, async (tx) => {
      const { action } = await owned(tx, SEED_USERS.muLegal.id);
      await expect(
        tx.asAdmin("ALTER TABLE public.gap_actions DISABLE TRIGGER gap_actions_before_update"),
      ).resolves.toBeTruthy();
      await expect(tx.asAdmin("UPDATE public.gap_actions SET status = 'closed' WHERE id = $1", [action.id])).rejects.toMatchObject({
        code: "23514",
      });
      await expect(
        tx.asAdmin(
          "UPDATE public.gap_actions SET status = 'closed', closed_at = now(), closure_basis = 'reviewer_approval', closed_by = owner_user_id WHERE id = $1",
          [action.id],
        ),
      ).rejects.toMatchObject({ code: "23514", constraint: "gap_actions_no_self_approval" });
      await expect(
        tx.asAdmin("UPDATE public.gap_actions SET closure_basis = 'self_attested' WHERE id = $1", [action.id]),
      ).rejects.toMatchObject({ code: "23514" });
    });
  });

  it("tooling without evidence cannot close either — there is no reviewer to approve", async () => {
    await inTransaction(client, async (tx) => {
      const { action } = await owned(tx, SEED_USERS.muLegal.id);
      await expect(tx.asAdmin("UPDATE public.gap_actions SET status = 'closed' WHERE id = $1", [action.id])).rejects.toMatchObject({
        code: "TS409",
      });
    });
  });
});

// ---------------------------------------------------------------------------
// Evidence on an action — the widened evidence_links
// ---------------------------------------------------------------------------

describe("evidence_links accepts a gap action", () => {
  it("links a stored artefact to an action, stamped with who linked it", async () => {
    await inTransaction(client, async (tx) => {
      const { action } = await oneGap(tx);
      const evidenceId = await pendingEvidence(tx, legal());
      await linkToAction(tx, legal(), evidenceId, action.id);
      const { rows } = await tx.asAdmin<{ linked_by: string }>(
        "SELECT linked_by FROM public.evidence_links WHERE linked_entity_type = 'gap_action' AND linked_entity_id = $1",
        [action.id],
      );
      expect(rows).toEqual([{ linked_by: SEED_USERS.muLegal.id }]);
    });
  });

  it("the object-exists rule still applies: a file that never arrived cannot be attached (D-039)", async () => {
    await inTransaction(client, async (tx) => {
      const { action } = await oneGap(tx);
      const evidenceId = await pendingEvidence(tx, legal(), ORG_A, false);
      await expect(linkToAction(tx, legal(), evidenceId, action.id)).rejects.toMatchObject({ code: "TS409" });
    });
  });

  it("refuses an action that does not exist, and a target type nobody defined", async () => {
    await inTransaction(client, async (tx) => {
      const evidenceId = await pendingEvidence(tx, legal());
      await expect(linkToAction(tx, legal(), evidenceId, randomUUID())).rejects.toMatchObject({ code: "TS404" });
      await expect(
        tx.asAdmin(
          "INSERT INTO public.evidence_links (organization_id, evidence_id, linked_entity_type, linked_entity_id) VALUES ($1, $2, 'ropa_record', $3)",
          [ORG_A, evidenceId, randomUUID()],
        ),
      ).rejects.toBeTruthy();
    });
  });

  it("a read-only member cannot attach evidence to an action", async () => {
    await inTransaction(client, async (tx) => {
      const { action } = await oneGap(tx);
      const evidenceId = await reviewedEvidence(tx, ORG_A, 5);
      await expect(linkToAction(tx, dean(), evidenceId, action.id)).rejects.toMatchObject({ code: "TS403" });
    });
  });

  /**
   * The point of widening all four triggers: evidence that an ACTION was done
   * says nothing about what the ANSWER scored. Strong evidence on the action
   * must not lift the answer, and detaching it must not lower it.
   */
  it("linking and unlinking a gap action NEVER re-derives the answer's score", async () => {
    await inTransaction(client, async (tx) => {
      const id = await assessmentWith(tx, [{ code: "G1.1", claimed: 5, level: 2 }]); // E2 caps at 2
      await generateAs(tx, consultant(), id);
      const action = await actionFor(tx, id, "G1.1");
      const answer = () =>
        tx.asAdmin<{ evidence_level: number; adjusted_score: number; row_version: string }>(
          "SELECT evidence_level, adjusted_score, xmin::text AS row_version FROM public.assessment_responses WHERE assessment_id = $1",
          [id],
        );
      const before = (await answer()).rows[0]!;
      expect(before).toMatchObject({ evidence_level: 2, adjusted_score: 2 });

      const strong = await reviewedEvidence(tx, ORG_A, 5, "strong");
      await linkToAction(tx, legal(), strong, action.id);
      // Same level, same score, and the row was not even written (same xmin).
      expect((await answer()).rows[0]).toEqual(before);

      await tx.as(
        legal(),
        "DELETE FROM public.evidence_links WHERE evidence_id = $1 AND linked_entity_type = 'gap_action' AND linked_entity_id = $2",
        [strong, action.id],
      );
      expect((await answer()).rows[0]).toEqual(before);
      const left = await tx.asAdmin("SELECT 1 FROM public.evidence_links WHERE evidence_id = $1", [strong]);
      expect(left.rows).toHaveLength(0);
    });
  });

  it("the same artefact on the ANSWER still moves the score — the response path is unchanged", async () => {
    await inTransaction(client, async (tx) => {
      const id = await assessmentWith(tx, [{ code: "G1.1", claimed: 5, level: 2 }]);
      const strong = await reviewedEvidence(tx, ORG_A, 5, "strong");
      await tx.as(
        legal(),
        `INSERT INTO public.evidence_links (organization_id, evidence_id, linked_entity_type, linked_entity_id)
         SELECT $1, $2, 'assessment_response', id FROM public.assessment_responses WHERE assessment_id = $3`,
        [ORG_A, strong, id],
      );
      const up = await tx.asAdmin<{ adjusted_score: number }>(
        "SELECT adjusted_score FROM public.assessment_responses WHERE assessment_id = $1",
        [id],
      );
      expect(up.rows[0]!.adjusted_score).toBe(5);
      await tx.as(legal(), "DELETE FROM public.evidence_links WHERE evidence_id = $1", [strong]);
      const down = await tx.asAdmin<{ adjusted_score: number }>(
        "SELECT adjusted_score FROM public.assessment_responses WHERE assessment_id = $1",
        [id],
      );
      expect(down.rows[0]!.adjusted_score).toBe(2);
    });
  });

  it("evidence cannot be detached from a CLOSED action — reopen it first", async () => {
    await inTransaction(client, async (tx) => {
      const { action } = await oneGap(tx);
      const evidenceId = await reviewedEvidence(tx, ORG_A, 5);
      await linkToAction(tx, "admin", evidenceId, action.id);
      await setAction(tx, consultant(), action.id, "owner_user_id = $2, status = 'closed'", [SEED_USERS.muLegal.id]);
      const detach = () =>
        tx.as(legal(), "DELETE FROM public.evidence_links WHERE evidence_id = $1 AND linked_entity_id = $2", [evidenceId, action.id]);
      await expect(detach()).rejects.toMatchObject({ code: "TS409" });
      await setAction(tx, legal(), action.id, "status = 'in_progress'");
      await expect(detach()).resolves.toMatchObject({ rowCount: 1 });
    });
  });

  it("removing an untouched gap takes nothing else with it; removing an action takes its links", async () => {
    await inTransaction(client, async (tx) => {
      const { assessmentId, action } = await oneGap(tx);
      const evidenceId = await reviewedEvidence(tx, ORG_A, 5);
      await linkToAction(tx, "admin", evidenceId, action.id);
      // Deleting the assessment cascades to its gaps and actions; the links,
      // being polymorphic, go by trigger — and the artefact itself stays.
      await tx.asAdmin("DELETE FROM public.assessments WHERE id = $1", [assessmentId]);
      const links = await tx.asAdmin("SELECT 1 FROM public.evidence_links WHERE linked_entity_id = $1", [action.id]);
      expect(links.rows).toHaveLength(0);
      const artefact = await tx.asAdmin("SELECT 1 FROM public.evidence WHERE id = $1", [evidenceId]);
      expect(artefact.rows).toHaveLength(1);
    });
  });
});

// ---------------------------------------------------------------------------
// Finalised (D-058)
// ---------------------------------------------------------------------------

describe("a finalised assessment's gaps are frozen; its actions live on (D-058)", () => {
  async function finalised(tx: Tx) {
    const id = await assessmentWith(tx, [
      { code: "G1.1", claimed: 0, level: null }, // critical
      { code: "G1.3", claimed: 5, level: null }, // high
      { code: "G1.4", claimed: 3, level: 3 }, // low
      { code: "G1.5", claimed: 5, level: 5 }, // no gap
    ]);
    await tx.as(consultant(), "SELECT public.finalise_assessment($1, $2)", [ORG_A, id]);
    return id;
  }

  it("finalising generates the register from the answers it freezes — nobody has to remember to", async () => {
    await inTransaction(client, async (tx) => {
      const id = await finalised(tx);
      expect(await gapsOf(tx, id)).toMatchObject([
        { question_code: "G1.1", severity: "critical" },
        { question_code: "G1.3", severity: "high" },
        { question_code: "G1.4", severity: "low" },
      ]);
    });
  });

  it("the register and the snapshot agree on critical and high", async () => {
    await inTransaction(client, async (tx) => {
      const id = await finalised(tx);
      const { rows } = await tx.asAdmin<{ critical_count: number; high_count: number; critical: string; high: string }>(
        `SELECT s.critical_count, s.high_count,
                (SELECT count(*) FROM public.assessment_gaps g WHERE g.assessment_id = s.assessment_id AND g.severity = 'critical') AS critical,
                (SELECT count(*) FROM public.assessment_gaps g WHERE g.assessment_id = s.assessment_id AND g.severity = 'high') AS high
         FROM public.assessment_score_snapshots s WHERE s.assessment_id = $1`,
        [id],
      );
      expect(Number(rows[0]!.critical)).toBe(rows[0]!.critical_count);
      expect(Number(rows[0]!.high)).toBe(rows[0]!.high_count);
      expect(rows[0]!.critical_count).toBe(1);
    });
  });

  it("finalising still writes exactly one finalisation audit row, now carrying the gap count", async () => {
    await inTransaction(client, async (tx) => {
      const id = await finalised(tx);
      const { rows } = await tx.asAdmin<{ event_type: string; metadata: Record<string, unknown> }>(
        "SELECT event_type, metadata FROM public.audit_logs WHERE entity_id = $1 AND event_type LIKE 'assessment.%.%ed' AND event_type NOT LIKE 'assessment.assessments.%'",
        [id],
      );
      expect(rows.map((r) => r.event_type)).toEqual(["assessment.score.finalised"]);
      expect(rows[0]!.metadata.gapCount).toBe(3);
    });
  });

  it("the register cannot be regenerated once finalised", async () => {
    await inTransaction(client, async (tx) => {
      const id = await finalised(tx);
      await expect(generateAs(tx, consultant(), id)).rejects.toMatchObject({ code: "TS409" });
    });
  });

  it("a frozen gap cannot be edited, added or deleted — not even by tooling", async () => {
    await inTransaction(client, async (tx) => {
      const id = await finalised(tx);
      await expect(
        tx.asAdmin("UPDATE public.assessment_gaps SET finding = 'rewritten' WHERE assessment_id = $1", [id]),
      ).rejects.toMatchObject({ code: "TS409" });
      await expect(tx.asAdmin("DELETE FROM public.assessment_gaps WHERE assessment_id = $1", [id])).rejects.toMatchObject({
        code: "TS409",
      });
      await expect(
        tx.asAdmin(
          `INSERT INTO public.assessment_gaps (organization_id, assessment_id, question_code, domain_code, severity, priority, adjusted_score, finding)
           VALUES ($1, $2, 'G1.5', 'GOV', 'low', 'P3', 3, 'invented after the fact')`,
          [ORG_A, id],
        ),
      ).rejects.toMatchObject({ code: "TS409" });
      // The engine itself is refused too: there is no back door around the freeze.
      await expect(tx.asAdmin("SELECT app.refresh_assessment_gaps($1, $2)", [ORG_A, id])).rejects.toMatchObject({
        code: "TS409",
      });
    });
  });

  it("remediation continues: an action can still be assigned, evidenced and closed after finalising", async () => {
    await inTransaction(client, async (tx) => {
      const id = await finalised(tx);
      const action = await actionFor(tx, id, "G1.1");
      await setAction(tx, legal(), action.id, "owner_user_id = $2, status = 'in_progress'", [SEED_USERS.muLegal.id]);

      const evidenceId = await pendingEvidence(tx, legal());
      await linkToAction(tx, legal(), evidenceId, action.id);
      await tx.as(consultant(), "UPDATE public.evidence SET review_status = 'strong', evidence_level = 5 WHERE id = $1", [evidenceId]);
      await setAction(tx, legal(), action.id, "status = 'closed'");

      expect(await actionFor(tx, id, "G1.1")).toMatchObject({ status: "closed", closure_basis: "evidence" });
      // …and none of it touched the frozen score or the frozen gap.
      expect(await gapsOf(tx, id)).toMatchObject([{ severity: "critical" }, { severity: "high" }, { severity: "low" }]);
    });
  });

  it("an ANSWER's evidence stays locked — only actions accept evidence after finalising", async () => {
    await inTransaction(client, async (tx) => {
      const id = await finalised(tx);
      const evidenceId = await reviewedEvidence(tx, ORG_A, 5);
      await expect(
        tx.as(
          legal(),
          `INSERT INTO public.evidence_links (organization_id, evidence_id, linked_entity_type, linked_entity_id)
           SELECT $1, $2, 'assessment_response', id FROM public.assessment_responses WHERE assessment_id = $3 AND question_code = 'G1.1'`,
          [ORG_A, evidenceId, id],
        ),
      ).rejects.toMatchObject({ code: "TS409" });
    });
  });

  // The backfill migration switches the freeze off to give pre-Slice-6
  // finalised assessments their register, and must switch it back on.
  it("the freeze is ENABLED, not merely present", async () => {
    const { rows } = await client.query<{ tgenabled: string }>(
      `SELECT t.tgenabled FROM pg_trigger t JOIN pg_class c ON c.oid = t.tgrelid
       WHERE c.relname = 'assessment_gaps' AND t.tgname = 'assessment_gaps_frozen_when_finalised'`,
    );
    expect(rows).toEqual([{ tgenabled: "O" }]);
  });

  it("no finalised assessment is left without a register it should have", async () => {
    // Every finalised assessment with a weak answer has at least one gap —
    // including any that were finalised before the register existed.
    const { rows } = await client.query(
      `SELECT a.id FROM public.assessments a
       WHERE a.status = 'finalised'
         AND EXISTS (SELECT 1 FROM app.assessment_derived_gaps(a.organization_id, a.id))
         AND NOT EXISTS (SELECT 1 FROM public.assessment_gaps g WHERE g.assessment_id = a.id)`,
    );
    expect(rows).toEqual([]);
  });

  it("a finalised assessment can still be deleted whole — the freeze does not block its own cascade", async () => {
    await inTransaction(client, async (tx) => {
      const id = await finalised(tx);
      await tx.asAdmin("DELETE FROM public.assessments WHERE id = $1", [id]);
      expect(await gapsOf(tx, id)).toHaveLength(0);
    });
  });
});

describe("erasure — a whole organisation can still be deleted", () => {
  /**
   * A gap hangs off BOTH its assessment and its organisation. When the
   * organisation goes, nothing guarantees the assessment's cascade reaches the
   * gap before the organisation's own does — so the freeze must not mistake
   * that for somebody editing a finalised register. Slice 13's erasure depends
   * on this.
   */
  it("takes its finalised assessment's frozen gaps, actions and evidence links with it", async () => {
    await inTransaction(client, async (tx) => {
      const org = randomUUID();
      await tx.asAdmin(
        "INSERT INTO public.organizations (id, name, organization_type, industry_code) VALUES ($1, 'RLS gaps erasure', 'company', 'general')",
        [org],
      );
      const id = await assessmentWith(tx, [{ code: "G1.1", claimed: 0, level: null }], org);
      await tx.asAdmin("SELECT app.refresh_assessment_gaps($1, $2)", [org, id]);
      const action = await actionFor(tx, id, "G1.1");
      const evidenceId = randomUUID();
      const filePath = `organizations/${org}/evidence/${evidenceId}/proof.pdf`;
      await tx.asAdmin("INSERT INTO storage.objects (bucket_id, name) VALUES ('evidence', $1)", [filePath]);
      await tx.asAdmin(
        `INSERT INTO public.evidence (id, organization_id, storage_path, file_name, content_type, byte_size)
         VALUES ($1, $2, $3, 'proof.pdf', 'application/pdf', 1024)`,
        [evidenceId, org, filePath],
      );
      await linkToAction(tx, "admin", evidenceId, action.id, org);
      await tx.asAdmin("UPDATE public.assessments SET status = 'finalised' WHERE id = $1", [id]);
      // Frozen, as far as anything short of deleting the organisation goes.
      await expect(tx.asAdmin("DELETE FROM public.assessment_gaps WHERE assessment_id = $1", [id])).rejects.toMatchObject({
        code: "TS409",
      });

      await tx.asAdmin("DELETE FROM public.organizations WHERE id = $1", [org]);

      for (const table of ["assessment_gaps", "gap_actions", "evidence_links", "assessments"]) {
        const { rows } = await tx.asAdmin(`SELECT 1 FROM public.${table} WHERE organization_id = $1`, [org]);
        expect(rows, table).toHaveLength(0);
      }
    });
  });
});

// ---------------------------------------------------------------------------
// The seed
// ---------------------------------------------------------------------------

describe("the seeded register", () => {
  it("MU's baseline has exactly one gap, derived from its one answer: G1.2, Low / P3", async () => {
    await inTransaction(client, async (tx) => {
      expect(await gapsOf(tx, MU_BASELINE)).toMatchObject([
        { question_code: "G1.2", severity: "low", priority: "P3", adjusted_score: 3, state: "open" },
      ]);
      const action = await actionFor(tx, MU_BASELINE, "G1.2");
      expect(action).toMatchObject({ status: "open", owner_user_id: null, due_date: null });
    });
  });

  it("Bharat Manufacturing has none", async () => {
    const { rows } = await client.query("SELECT 1 FROM public.assessment_gaps WHERE organization_id = $1", [ORG_B]);
    expect(rows).toHaveLength(0);
  });
});
