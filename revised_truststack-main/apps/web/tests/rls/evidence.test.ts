/**
 * Slice 4 — GATE 5 (RLS) for answers, evidence and links, and the database
 * rules that make the evidence cap more than decoration:
 *
 *   1. adjusted_score is DERIVED. No user grant can write it, a CHECK refuses
 *      an uncapped value even from tooling, and the trigger is its only writer.
 *   2. Nobody grades their own evidence: contributors hold no evidence.review,
 *      and a reviewer may not review what they uploaded (D-043).
 *   3. Every evidence row is a stored artefact; linking and reviewing both
 *      require the object to exist in the bucket (D-039).
 *   4. Storage policies keep one tenant's files out of another's reach.
 *
 * Every test runs inside a transaction that is rolled back.
 */
import { randomUUID } from "node:crypto";
import { SEED_ASSESSMENTS, SEED_EVIDENCE, SEED_ORGS, SEED_RESPONSES, SEED_USERS, seedEvidencePath } from "@truststack/db/seed-data";
import type pg from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { authSubjects, connect, inTransaction, type Tx } from "./db";

const ORG_A = SEED_ORGS.mumbaiUniversity.id;
const ORG_B = SEED_ORGS.bharatManufacturing.id;
const MU_BASELINE = SEED_ASSESSMENTS.muBaseline.id;
const SEEDED = SEED_EVIDENCE.muG12OfficeOrder;
const SEEDED_PATH = seedEvidencePath(SEEDED);

let client: pg.Client;
let who: Map<string, { sub: string; email: string }>;
const u = (id: string) => who.get(id)!;
const muAdmin = () => u(SEED_USERS.muAdmin.id);
const consultant = () => u(SEED_USERS.consultant.id); // PROGRAMME role: answers, uploads AND reviews
const registrar = () => u(SEED_USERS.mumbaiUniversity.id); // dpdp_owner: also a reviewer
const legal = () => u(SEED_USERS.muLegal.id); // contributor: evidence.write, never evidence.review
const dean = () => u(SEED_USERS.muDean.id); // executive sponsor: read-only
const bmlAdmin = () => u(SEED_USERS.bmlAdmin.id);

beforeAll(async () => {
  client = await connect();
  who = await authSubjects(client, Object.values(SEED_USERS).map((x) => x.id));
});
afterAll(async () => {
  await client?.end();
});

/** A fresh DRAFT copy of MU's baseline snapshot, so a test can watch the first answer move it on. */
async function freshAssessment(tx: Tx): Promise<string> {
  const { rows } = await tx.asAdmin<{ id: string }>(
    "INSERT INTO public.assessments (organization_id, name, status) VALUES ($1, 'RLS keystone ' || gen_random_uuid(), 'draft') RETURNING id",
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

async function potentiallyApplicableCode(tx: Tx): Promise<string> {
  const { rows } = await tx.asAdmin<{ question_code: string }>(
    "SELECT question_code FROM public.assessment_questions WHERE assessment_id = $1 AND applicability = 'potentially_applicable' ORDER BY sort_order LIMIT 1",
    [MU_BASELINE],
  );
  return rows[0]!.question_code;
}

type Actor = { sub: string; email: string };

async function answer(tx: Tx, actor: Actor, assessmentId: string, code: string, claimed: number) {
  const { rows } = await tx.as<{ id: string; adjusted_score: number; evidence_level: number | null }>(
    actor,
    `INSERT INTO public.assessment_responses (organization_id, assessment_id, question_code, applicability_decision, claimed_maturity)
     VALUES ($1, $2, $3, 'applicable', $4) RETURNING id, adjusted_score, evidence_level`,
    [ORG_A, assessmentId, code, claimed],
  );
  return rows[0]!;
}

/** Registers an evidence row as `actor` AND puts an object at its path, as a completed upload would. */
async function storedEvidence(tx: Tx, actor: Actor, org: string = ORG_A): Promise<{ id: string; path: string }> {
  const id = randomUUID();
  const path = `organizations/${org}/evidence/${id}/order.pdf`;
  await tx.as(
    actor,
    `INSERT INTO public.evidence (id, organization_id, storage_path, file_name, content_type, byte_size)
     VALUES ($1, $2, $3, 'order.pdf', 'application/pdf', 1024)`,
    [id, org, path],
  );
  await tx.asAdmin("INSERT INTO storage.objects (bucket_id, name) VALUES ('evidence', $1)", [path]);
  return { id, path };
}

async function link(tx: Tx, actor: Actor, evidenceId: string, responseId: string) {
  await tx.as(
    actor,
    `INSERT INTO public.evidence_links (organization_id, evidence_id, linked_entity_type, linked_entity_id)
     VALUES ($1, $2, 'assessment_response', $3)`,
    [ORG_A, evidenceId, responseId],
  );
}

async function review(tx: Tx, actor: Actor, evidenceId: string, status: string, level: number) {
  return tx.as(actor, "UPDATE public.evidence SET review_status = $2, evidence_level = $3 WHERE id = $1", [
    evidenceId,
    status,
    level,
  ]);
}

async function scoreOf(tx: Tx, responseId: string) {
  const { rows } = await tx.asAdmin<{ claimed_maturity: number; evidence_level: number | null; adjusted_score: number }>(
    "SELECT claimed_maturity, evidence_level, adjusted_score FROM public.assessment_responses WHERE id = $1",
    [responseId],
  );
  return rows[0]!;
}

// ---------------------------------------------------------------------------
// The keystone, in the database
// ---------------------------------------------------------------------------

describe("the cap is computed by the database", () => {
  it("claim 5 → upload → review E5 → 5; downgrade to E0 → 1 (the keystone journey)", async () => {
    await inTransaction(client, async (tx) => {
      const assessment = await freshAssessment(tx);
      const r = await answer(tx, consultant(), assessment, "G1.2", 5);
      // Unevidenced: scored as E0, never ignored.
      expect(r).toMatchObject({ adjusted_score: 1, evidence_level: null });

      const e = await storedEvidence(tx, consultant());
      await link(tx, consultant(), e.id, r.id);
      expect(await scoreOf(tx, r.id)).toMatchObject({ evidence_level: null, adjusted_score: 1 }); // linked, unreviewed

      await review(tx, registrar(), e.id, "strong", 5);
      expect(await scoreOf(tx, r.id)).toMatchObject({ evidence_level: 5, adjusted_score: 5 });

      await review(tx, registrar(), e.id, "rejected", 0);
      expect(await scoreOf(tx, r.id)).toMatchObject({ claimed_maturity: 5, evidence_level: 0, adjusted_score: 1 });
    });
  });

  it("claim 4 + E1 → 2 and claim 4 + E2 → 2 — E1 and E2 both cap at 2", async () => {
    await inTransaction(client, async (tx) => {
      const assessment = await freshAssessment(tx);
      const r = await answer(tx, consultant(), assessment, "G1.2", 4);
      const e = await storedEvidence(tx, consultant());
      await link(tx, consultant(), e.id, r.id);

      await review(tx, registrar(), e.id, "partial", 1);
      expect((await scoreOf(tx, r.id)).adjusted_score).toBe(2);
      await review(tx, registrar(), e.id, "partial", 2);
      expect((await scoreOf(tx, r.id)).adjusted_score).toBe(2);
      await review(tx, registrar(), e.id, "adequate", 3);
      expect((await scoreOf(tx, r.id)).adjusted_score).toBe(3);
    });
  });

  it("a response takes the STRONGEST reviewed artefact linked to it", async () => {
    await inTransaction(client, async (tx) => {
      const assessment = await freshAssessment(tx);
      const r = await answer(tx, consultant(), assessment, "G1.2", 5);
      const weak = await storedEvidence(tx, consultant());
      const strong = await storedEvidence(tx, consultant());
      await link(tx, consultant(), weak.id, r.id);
      await link(tx, consultant(), strong.id, r.id);
      await review(tx, registrar(), weak.id, "rejected", 0);
      await review(tx, registrar(), strong.id, "adequate", 4);
      expect(await scoreOf(tx, r.id)).toMatchObject({ evidence_level: 4, adjusted_score: 4 });
    });
  });

  it("changing the claim re-derives the adjusted score against the same evidence", async () => {
    await inTransaction(client, async (tx) => {
      const assessment = await freshAssessment(tx);
      const r = await answer(tx, consultant(), assessment, "G1.2", 5);
      const e = await storedEvidence(tx, consultant());
      await link(tx, consultant(), e.id, r.id);
      await review(tx, registrar(), e.id, "adequate", 3);
      await tx.as(consultant(), "UPDATE public.assessment_responses SET claimed_maturity = 2 WHERE id = $1", [r.id]);
      expect(await scoreOf(tx, r.id)).toMatchObject({ claimed_maturity: 2, adjusted_score: 2 });
    });
  });

  it("the seeded MU answer is claim 5 · E3 → adjusted 3", async () => {
    await inTransaction(client, async (tx) => {
      expect(await scoreOf(tx, SEED_RESPONSES.muG12.id)).toMatchObject({ claimed_maturity: 5, evidence_level: 3, adjusted_score: 3 });
    });
  });
});

describe("adjusted_score and evidence_level cannot be written by a client", () => {
  it("no UPDATE grant on the derived columns — even for an Organisation Admin with every permission", async () => {
    await inTransaction(client, async (tx) => {
      for (const column of ["adjusted_score", "evidence_level", "answered_by", "answered_at"]) {
        await expect(
          tx.as(muAdmin(), `UPDATE public.assessment_responses SET ${column} = ${column} WHERE id = $1`, [SEED_RESPONSES.muG12.id]),
        ).rejects.toThrow(/permission denied/);
      }
    });
  });

  it("no INSERT grant on them either", async () => {
    await inTransaction(client, async (tx) => {
      const assessment = await freshAssessment(tx);
      await expect(
        tx.as(
          muAdmin(),
          `INSERT INTO public.assessment_responses (organization_id, assessment_id, question_code, applicability_decision, claimed_maturity, adjusted_score)
           VALUES ($1, $2, 'G1.2', 'applicable', 5, 5)`,
          [ORG_A, assessment],
        ),
      ).rejects.toThrow(/permission denied/);
    });
  });

  it("even tooling cannot store an uncapped score: a CHECK, not only a trigger", async () => {
    await inTransaction(client, async (tx) => {
      await tx.asAdmin("ALTER TABLE public.assessment_responses DISABLE TRIGGER assessment_responses_before_write");
      await expect(
        tx.asAdmin("UPDATE public.assessment_responses SET adjusted_score = 5 WHERE id = $1", [SEED_RESPONSES.muG12.id]),
      ).rejects.toThrow(/assessment_responses_adjusted_is_capped/);
    });
  });
});

describe("Not Applicable", () => {
  it("without a reason is refused by the CHECK, not only by Zod", async () => {
    await inTransaction(client, async (tx) => {
      const assessment = await freshAssessment(tx);
      const code = await potentiallyApplicableCode(tx);
      for (const reason of [null, "   "]) {
        await expect(
          tx.as(
            consultant(),
            `INSERT INTO public.assessment_responses (organization_id, assessment_id, question_code, applicability_decision, na_reason)
             VALUES ($1, $2, $3, 'not_applicable', $4)`,
            [ORG_A, assessment, code, reason],
          ),
        ).rejects.toThrow(/assessment_responses_na_needs_reason/);
      }
    });
  });

  it("with a reason is accepted, and carries no score", async () => {
    await inTransaction(client, async (tx) => {
      const assessment = await freshAssessment(tx);
      const code = await potentiallyApplicableCode(tx);
      const { rows } = await tx.as<{ adjusted_score: number | null }>(
        consultant(),
        `INSERT INTO public.assessment_responses (organization_id, assessment_id, question_code, applicability_decision, na_reason)
         VALUES ($1, $2, $3, 'not_applicable', 'No such processing at this organisation') RETURNING adjusted_score`,
        [ORG_A, assessment, code],
      );
      expect(rows[0]!.adjusted_score).toBeNull();
    });
  });

  it("is refused on a MANDATORY question", async () => {
    await inTransaction(client, async (tx) => {
      const assessment = await freshAssessment(tx);
      await expect(
        tx.as(
          consultant(),
          `INSERT INTO public.assessment_responses (organization_id, assessment_id, question_code, applicability_decision, na_reason)
           VALUES ($1, $2, 'G1.2', 'not_applicable', 'We would rather not')`,
          [ORG_A, assessment],
        ),
      ).rejects.toThrow(/mandatory question cannot be marked Not Applicable/);
    });
  });

  it("an answer must reference a question in THIS assessment's snapshot", async () => {
    await inTransaction(client, async (tx) => {
      const assessment = await freshAssessment(tx);
      await expect(answer(tx, consultant(), assessment, "UNI-GOV-001", 5)).rejects.toThrow(/foreign key/);
    });
  });
});

describe("answering moves a draft on, and freezes its question set (D-041)", () => {
  it("the first answer moves draft → in_progress; regeneration is then refused", async () => {
    await inTransaction(client, async (tx) => {
      const assessment = await freshAssessment(tx);
      await answer(tx, legal(), assessment, "G1.2", 3); // a contributor, who holds no assessment.write
      const { rows } = await tx.asAdmin<{ status: string }>("SELECT status FROM public.assessments WHERE id = $1", [assessment]);
      expect(rows[0]!.status).toBe("in_progress");
      await expect(
        tx.as(muAdmin(), "SELECT public.set_assessment_questions($1, $2, '[]'::jsonb)", [ORG_A, assessment]),
      ).rejects.toThrow(/Only a draft assessment can be regenerated/);
    });
  });

  it("an assessment with answers cannot be put back to draft — even by tooling", async () => {
    await inTransaction(client, async (tx) => {
      await expect(
        tx.asAdmin("UPDATE public.assessments SET status = 'draft' WHERE id = $1", [MU_BASELINE]),
      ).rejects.toThrow(/cannot return to draft/);
    });
  });

  it("a finalised assessment's answers are locked", async () => {
    await inTransaction(client, async (tx) => {
      await tx.asAdmin("UPDATE public.assessments SET status = 'finalised' WHERE id = $1", [MU_BASELINE]);
      await expect(
        tx.as(consultant(), "UPDATE public.assessment_responses SET claimed_maturity = 1 WHERE id = $1", [SEED_RESPONSES.muG12.id]),
      ).rejects.toThrow(/finalised — its answers are locked/);
      await expect(review(tx, consultant(), SEEDED.id, "strong", 5)).rejects.toThrow(/finalised assessment/);
    });
  });
});

// ---------------------------------------------------------------------------
// No self-review (D-043)
// ---------------------------------------------------------------------------

describe("nobody grades their own evidence", () => {
  it("a contributor cannot set an evidence level at all — the row is not even visible to the UPDATE", async () => {
    await inTransaction(client, async (tx) => {
      const e = await storedEvidence(tx, legal());
      const up = await review(tx, legal(), e.id, "strong", 5);
      expect(up.rowCount).toBe(0);
      const other = await review(tx, legal(), SEEDED.id, "strong", 5);
      expect(other.rowCount).toBe(0);
      const { rows } = await tx.asAdmin<{ review_status: string; evidence_level: number | null }>(
        "SELECT review_status, evidence_level FROM public.evidence WHERE id = ANY($1::uuid[])",
        [[e.id, SEEDED.id]],
      );
      expect(rows.find((r) => r.review_status === "pending")!.evidence_level).toBeNull();
      expect(rows.some((r) => r.evidence_level === 5)).toBe(false);
    });
  });

  it("a reviewer cannot review evidence THEY uploaded", async () => {
    await inTransaction(client, async (tx) => {
      const e = await storedEvidence(tx, consultant());
      await expect(review(tx, consultant(), e.id, "strong", 5)).rejects.toThrow(/cannot review evidence you uploaded/);
      await expect(review(tx, registrar(), e.id, "strong", 5)).resolves.toMatchObject({ rowCount: 1 });
    });
  });

  it("the rule binds tooling too: a CHECK refuses reviewed_by = uploaded_by", async () => {
    await inTransaction(client, async (tx) => {
      await expect(
        tx.asAdmin("UPDATE public.evidence SET reviewed_by = uploaded_by WHERE id = $1", [SEEDED.id]),
      ).rejects.toThrow(/evidence_no_self_review/);
    });
  });

  it("the reviewer is stamped by the database, not claimed by the client", async () => {
    await inTransaction(client, async (tx) => {
      const e = await storedEvidence(tx, consultant());
      await expect(
        tx.as(registrar(), "UPDATE public.evidence SET reviewed_by = $2 WHERE id = $1", [e.id, SEED_USERS.muAdmin.id]),
      ).rejects.toThrow(/permission denied/);
      await review(tx, registrar(), e.id, "adequate", 4);
      const { rows } = await tx.asAdmin<{ reviewed_by: string; uploaded_by: string }>(
        "SELECT reviewed_by, uploaded_by FROM public.evidence WHERE id = $1",
        [e.id],
      );
      expect(rows[0]).toEqual({ reviewed_by: SEED_USERS.mumbaiUniversity.id, uploaded_by: SEED_USERS.consultant.id });
    });
  });

  it("rejected evidence is E0, and a reviewed status always has a level", async () => {
    await inTransaction(client, async (tx) => {
      const e = await storedEvidence(tx, consultant());
      await expect(review(tx, registrar(), e.id, "rejected", 3)).rejects.toThrow(/evidence_rejected_is_e0/);
      await expect(
        tx.as(registrar(), "UPDATE public.evidence SET review_status = 'strong' WHERE id = $1", [e.id]),
      ).rejects.toThrow(/evidence_pending_has_no_level/);
    });
  });
});

// ---------------------------------------------------------------------------
// Stored artefacts only (D-039)
// ---------------------------------------------------------------------------

describe("every evidence row is a stored artefact", () => {
  it("an evidence row cannot exist without a storage_path", async () => {
    await inTransaction(client, async (tx) => {
      await expect(
        tx.asAdmin(
          `INSERT INTO public.evidence (organization_id, storage_path, file_name, content_type, byte_size)
           VALUES ($1, NULL, 'x.pdf', 'application/pdf', 1)`,
          [ORG_A],
        ),
      ).rejects.toThrow(/null value in column "storage_path"/);
    });
  });

  it("the path is exactly this row's, in this organisation — it cannot point at another tenant's object", async () => {
    await inTransaction(client, async (tx) => {
      const id = randomUUID();
      await expect(
        tx.as(
          muAdmin(),
          `INSERT INTO public.evidence (id, organization_id, storage_path, file_name, content_type, byte_size)
           VALUES ($1, $2, $3, 'order.pdf', 'application/pdf', 10)`,
          [id, ORG_A, `organizations/${ORG_B}/evidence/${id}/order.pdf`],
        ),
      ).rejects.toThrow(/evidence_storage_path_layout/);
    });
  });

  it("there is no attested or 'observed but not stored' status", async () => {
    await inTransaction(client, async (tx) => {
      const e = await storedEvidence(tx, consultant());
      for (const status of ["attested", "observed", "restricted"]) {
        await expect(review(tx, registrar(), e.id, status, 4)).rejects.toThrow(/evidence_review_status_check/);
      }
    });
  });

  it("an artefact whose upload never completed cannot be linked or reviewed", async () => {
    await inTransaction(client, async (tx) => {
      const assessment = await freshAssessment(tx);
      const r = await answer(tx, consultant(), assessment, "G1.2", 5);
      const id = randomUUID();
      await tx.as(
        consultant(),
        `INSERT INTO public.evidence (id, organization_id, storage_path, file_name, content_type, byte_size)
         VALUES ($1, $2, $3, 'order.pdf', 'application/pdf', 10)`,
        [id, ORG_A, `organizations/${ORG_A}/evidence/${id}/order.pdf`],
      );
      await expect(link(tx, consultant(), id, r.id)).rejects.toThrow(/has not finished uploading/);
      await expect(review(tx, registrar(), id, "strong", 5)).rejects.toThrow(/has not been uploaded/);
    });
  });

  /**
   * Slice 5 opened exactly one of these: a LINK can now be removed, so a wrong
   * attachment can be undone (D-051). The artefact and the answer still
   * cannot be deleted by anyone — an artefact, once stored, is retained
   * (D-042), and an answer is the assessment's record.
   */
  it("a user cannot delete evidence or an answer — there is no grant at all", async () => {
    await inTransaction(client, async (tx) => {
      await expect(
        tx.as(muAdmin(), "DELETE FROM public.evidence WHERE id = $1", [SEEDED.id]),
      ).rejects.toThrow(/permission denied/);
      await expect(
        tx.as(muAdmin(), "DELETE FROM public.assessment_responses WHERE id = $1", [SEED_RESPONSES.muG12.id]),
      ).rejects.toThrow(/permission denied/);
    });
  });

  it("a link CAN be removed from Slice 5 on, and the artefact survives it (D-051)", async () => {
    await inTransaction(client, async (tx) => {
      const { rowCount } = await tx.as(muAdmin(), "DELETE FROM public.evidence_links WHERE evidence_id = $1", [
        SEEDED.id,
      ]);
      expect(rowCount).toBe(1);
      const { rows } = await tx.asAdmin("SELECT 1 FROM public.evidence WHERE id = $1", [SEEDED.id]);
      expect(rows).toHaveLength(1);
    });
  });
});

// ---------------------------------------------------------------------------
// GATE 5 — Org A ≠ Org B
// ---------------------------------------------------------------------------

describe("GATE 5 — Org B's JWT never reaches Org A's answers, evidence or links", () => {
  for (const table of ["assessment_responses", "evidence", "evidence_links"]) {
    it(`${table}: Org B sees none of Org A's rows; Org A sees its own`, async () => {
      await inTransaction(client, async (tx) => {
        const theirs = await tx.as<{ n: string }>(bmlAdmin(), `SELECT count(*) AS n FROM public.${table} WHERE organization_id = $1`, [ORG_A]);
        expect(Number(theirs.rows[0]!.n)).toBe(0);
        const mine = await tx.as<{ organization_id: string }>(muAdmin(), `SELECT organization_id FROM public.${table}`);
        expect(mine.rows.length).toBeGreaterThan(0);
        expect(mine.rows.every((r) => r.organization_id === ORG_A)).toBe(true);
      });
    });
  }

  it("Org B cannot answer, review or link in Org A", async () => {
    await inTransaction(client, async (tx) => {
      await expect(
        tx.as(
          bmlAdmin(),
          `INSERT INTO public.assessment_responses (organization_id, assessment_id, question_code, applicability_decision, claimed_maturity)
           VALUES ($1, $2, 'G1.1', 'applicable', 5)`,
          [ORG_A, MU_BASELINE],
        ),
      ).rejects.toThrow(/row-level security/);
      const up = await review(tx, bmlAdmin(), SEEDED.id, "rejected", 0);
      expect(up.rowCount).toBe(0);
      const upAnswer = await tx.as(bmlAdmin(), "UPDATE public.assessment_responses SET claimed_maturity = 0 WHERE id = $1", [
        SEED_RESPONSES.muG12.id,
      ]);
      expect(upAnswer.rowCount).toBe(0);
      await expect(
        tx.as(
          bmlAdmin(),
          `INSERT INTO public.evidence_links (organization_id, evidence_id, linked_entity_type, linked_entity_id)
           VALUES ($1, $2, 'assessment_response', $3)`,
          [ORG_A, SEEDED.id, SEED_RESPONSES.muG12.id],
        ),
      ).rejects.toThrow(/row-level security/);
    });
  });

  it("a link cannot cross tenants even from inside one: Org B evidence → Org A answer is refused", async () => {
    await inTransaction(client, async (tx) => {
      const theirs = await storedEvidence(tx, bmlAdmin(), ORG_B);
      // Org B, linking its own evidence to Org A's answer, under its own organisation id…
      await expect(
        tx.as(
          bmlAdmin(),
          `INSERT INTO public.evidence_links (organization_id, evidence_id, linked_entity_type, linked_entity_id)
           VALUES ($1, $2, 'assessment_response', $3)`,
          [ORG_B, theirs.id, SEED_RESPONSES.muG12.id],
        ),
      ).rejects.toThrow(/Response not found/);
      // …and even tooling cannot attach Org B's evidence to an Org A link row
      // (the trigger refuses it first; the composite FK would refuse it anyway).
      await expect(
        tx.asAdmin(
          `INSERT INTO public.evidence_links (organization_id, evidence_id, linked_entity_type, linked_entity_id)
           VALUES ($1, $2, 'assessment_response', $3)`,
          [ORG_A, theirs.id, SEED_RESPONSES.muG12.id],
        ),
      ).rejects.toThrow(/Evidence not found/);
    });
  });

  it("anon has no access at all", async () => {
    await inTransaction(client, async (tx) => {
      for (const table of ["assessment_responses", "evidence", "evidence_links"]) {
        await expect(tx.as(null, `SELECT count(*) FROM public.${table}`)).rejects.toThrow(/permission denied/);
      }
    });
  });
});

describe("Storage policies — the second lock on the files themselves", () => {
  it("Org A's member sees Org A's object; Org B's admin does not, and cannot register an upload into it", async () => {
    await inTransaction(client, async (tx) => {
      const mine = await tx.as<{ n: string }>(muAdmin(), "SELECT count(*) AS n FROM storage.objects WHERE name = $1", [SEEDED_PATH]);
      expect(Number(mine.rows[0]!.n)).toBe(1);
      const theirs = await tx.as<{ n: string }>(bmlAdmin(), "SELECT count(*) AS n FROM storage.objects WHERE name = $1", [SEEDED_PATH]);
      expect(Number(theirs.rows[0]!.n)).toBe(0);
      await expect(
        tx.as(bmlAdmin(), "INSERT INTO storage.objects (bucket_id, name) VALUES ('evidence', $1)", [
          `organizations/${ORG_A}/evidence/${randomUUID()}/forged.pdf`,
        ]),
      ).rejects.toThrow(/row-level security/);
    });
  });

  it("an upload needs a registered evidence row for exactly that path, uploaded by the caller", async () => {
    await inTransaction(client, async (tx) => {
      const unregistered = `organizations/${ORG_A}/evidence/${randomUUID()}/free.pdf`;
      await expect(
        tx.as(muAdmin(), "INSERT INTO storage.objects (bucket_id, name) VALUES ('evidence', $1)", [unregistered]),
      ).rejects.toThrow(/row-level security/);

      // Registered by the consultant — so the admin cannot upload into it either.
      const id = randomUUID();
      const path = `organizations/${ORG_A}/evidence/${id}/order.pdf`;
      await tx.as(
        consultant(),
        `INSERT INTO public.evidence (id, organization_id, storage_path, file_name, content_type, byte_size)
         VALUES ($1, $2, $3, 'order.pdf', 'application/pdf', 10)`,
        [id, ORG_A, path],
      );
      await expect(
        tx.as(muAdmin(), "INSERT INTO storage.objects (bucket_id, name) VALUES ('evidence', $1)", [path]),
      ).rejects.toThrow(/row-level security/);
      await expect(
        tx.as(consultant(), "INSERT INTO storage.objects (bucket_id, name) VALUES ('evidence', $1)", [path]),
      ).resolves.toMatchObject({ rowCount: 1 });
    });
  });

  it("an executive sponsor (read-only) can read evidence but not upload it", async () => {
    await inTransaction(client, async (tx) => {
      const seen = await tx.as<{ n: string }>(dean(), "SELECT count(*) AS n FROM storage.objects WHERE name = $1", [SEEDED_PATH]);
      expect(Number(seen.rows[0]!.n)).toBe(1);
      await expect(
        tx.as(
          dean(),
          `INSERT INTO public.evidence (id, organization_id, storage_path, file_name, content_type, byte_size)
           VALUES ($1, $2, $3, 'x.pdf', 'application/pdf', 1)`,
          [randomUUID(), ORG_A, "unused"],
        ),
      ).rejects.toThrow(/row-level security|evidence_storage_path_layout/);
    });
  });

  it("no user may overwrite or delete a stored artefact", async () => {
    await inTransaction(client, async (tx) => {
      const up = await tx.as(muAdmin(), "UPDATE storage.objects SET metadata = '{}'::jsonb WHERE name = $1", [SEEDED_PATH]);
      expect(up.rowCount).toBe(0);
      const del = await tx.as(muAdmin(), "DELETE FROM storage.objects WHERE name = $1", [SEEDED_PATH]).catch((e: Error) => e);
      // Either Storage's own delete guard or the absence of a DELETE policy stops it.
      expect(del instanceof Error ? del.message : (del as { rowCount: number }).rowCount).toSatisfy(
        (v: unknown) => v === 0 || /not allowed|permission denied/.test(String(v)),
      );
    });
  });
});

// ---------------------------------------------------------------------------
// Audit (gate 8): answer, link and review by trigger, in the same transaction
// ---------------------------------------------------------------------------

describe("audit", () => {
  it("answer, evidence registration, link and review each write an audit row, as the actor", async () => {
    await inTransaction(client, async (tx) => {
      const assessment = await freshAssessment(tx);
      const r = await answer(tx, consultant(), assessment, "G1.2", 5);
      const e = await storedEvidence(tx, consultant());
      await link(tx, consultant(), e.id, r.id);
      await review(tx, registrar(), e.id, "rejected", 0);

      const { rows } = await tx.asAdmin<{ event_type: string; user_id: string; metadata: Record<string, unknown> }>(
        `SELECT event_type, user_id, metadata FROM public.audit_logs
         WHERE entity_id IN ($1, $2) OR (metadata ->> 'evidenceId') = $2::text ORDER BY created_at, event_type`,
        [r.id, e.id],
      );
      const events = rows.map((row) => row.event_type);
      expect(events).toContain("response.assessment_responses.insert");
      expect(events).toContain("evidence.evidence.insert");
      expect(events).toContain("evidence.evidence_links.insert");
      expect(events).toContain("evidence.evidence.update");

      const reviewRow = rows.find((row) => row.event_type === "evidence.evidence.update")!;
      expect(reviewRow.user_id).toBe(SEED_USERS.mumbaiUniversity.id);
      expect(reviewRow.metadata).toMatchObject({ evidenceLevel: 0, reviewStatus: "rejected" });
      // The score change the review caused is itself on the record, under the reviewer.
      const rescored = rows.filter(
        (row) => row.event_type === "response.assessment_responses.update" && row.metadata.adjustedScore === 1,
      );
      expect(rescored.length).toBeGreaterThan(0);
    });
  });

  it("free text stays out of the log", async () => {
    await inTransaction(client, async (tx) => {
      const assessment = await freshAssessment(tx);
      const code = await potentiallyApplicableCode(tx);
      const { rows } = await tx.as<{ id: string }>(
        consultant(),
        `INSERT INTO public.assessment_responses (organization_id, assessment_id, question_code, applicability_decision, na_reason, notes)
         VALUES ($1, $2, $3, 'not_applicable', 'SECRET-REASON', 'SECRET-NOTE') RETURNING id`,
        [ORG_A, assessment, code],
      );
      const log = await tx.asAdmin<{ metadata: unknown; description: string }>(
        "SELECT metadata, description FROM public.audit_logs WHERE entity_id = $1",
        [rows[0]!.id],
      );
      expect(JSON.stringify(log.rows)).not.toMatch(/SECRET/);
    });
  });
});
