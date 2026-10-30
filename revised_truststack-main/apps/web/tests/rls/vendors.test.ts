/**
 * Slice 10, Stage 4a — GATE 5 (RLS) and the database's rules for the
 * processor register's questionnaire (migration 20261015000000_processor_register).
 *
 *   1. Org A cannot see or touch Org B's assessments or answers; anon holds
 *      nothing; nobody writes a table — only the five functions, each of which
 *      checks the caller (vendor.assess, vendor.review) and the tenancy.
 *   2. The accuracy controls (SLICE_10 §7b, 4a.4; D-089): complete, evidence-
 *      backed, reviewed by a second person, attributed, frozen once accepted,
 *      current.
 *   3. The vendor's documents: `evidence_links` type `vendor`, attached with
 *      vendor.assess, never detached while an answer cites one.
 *   4. Audit: every step once, as the person, with no free text. (2b: an
 *      organisation's deletion still removes everything.)
 *   5. The questionnaire and the score are core's, to the last digit.
 *   6. Model 1.4.0 in a stored snapshot: the contract gap bars Mitigated on
 *      heads 1 and 7; an accepted assessment past its review-by date is a reason.
 *
 * Every test runs inside a transaction that is rolled back.
 */
import { randomUUID } from "node:crypto";
import {
  addMonths,
  SCORED_VENDOR_QUESTIONS,
  VENDOR_QUESTIONS,
  vendorQuestion,
  vendorRisk,
  type ScoredVendorAnswer,
} from "@truststack/core";
import { SEED_ORGS, SEED_SCOPE, SEED_USERS } from "@truststack/db/seed-data";
import type pg from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { authSubjects, connect, inTransaction, type Tx } from "./db";

const ORG_A: string = SEED_ORGS.mumbaiUniversity.id;
const ORG_B: string = SEED_ORGS.bharatManufacturing.id;
/**
 * Two vendors of MU's with no assessment, made inside each test's transaction:
 * the seed assesses its own (the payment gateway accepted, the LMS provider
 * awaiting review). Both have a contract with DPDP clauses recorded, so they
 * add no contract gap to the model.
 */
let VENDOR = "";
let OTHER_VENDOR = "";
const PAYROLL = SEED_SCOPE.bharatManufacturing.vendors.payrollBureau.id;

let client: pg.Client;
let who: Map<string, { sub: string; email: string }>;
const u = (id: string) => who.get(id)!;
const ciso = () => u(SEED_USERS.muItSecurity.id); // vendor.assess, NOT vendor.review
const legal = () => u(SEED_USERS.muLegal.id); // vendor.assess + vendor.review
const registrar = () => u(SEED_USERS.mumbaiUniversity.id); // dpdp_owner: both
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

/** India's date, as the functions read it. */
const todayInIndia = () => new Date(Date.now() + 5.5 * 3_600_000).toISOString().slice(0, 10);

/** A rolled-back transaction with the two fresh vendors in it. */
const run = (fn: (tx: Tx) => Promise<void>) =>
  inTransaction(client, async (tx) => {
    const { rows } = await tx.asAdmin<{ id: string }>(
      `INSERT INTO public.vendors (organization_id, name, vendor_role, contract_exists, dpdp_clauses, cross_border, sub_processors_known)
       VALUES ($1, 'RLS vendor one', 'data_processor', 'yes', 'yes', 'no', 'yes'), ($1, 'RLS vendor two', 'data_processor', 'yes', 'yes', 'no', 'yes')
       RETURNING id`,
      [ORG_A],
    );
    [VENDOR, OTHER_VENDOR] = rows.map((r) => r.id) as [string, string];
    await fn(tx);
  });

async function start(tx: Tx, actor: Actor, vendor = VENDOR, org = ORG_A) {
  const { rows } = await tx.as<{ r: { id: string; version: number } }>(actor, "SELECT public.start_vendor_assessment($1, $2) AS r", [org, vendor]);
  return rows[0]!.r;
}

type Entry = { code: string; answer?: string | null; notApplicable?: boolean; naReason?: string | null; evidenceId?: string | null };
const save = (tx: Tx, actor: Actor, id: string, answers: Entry[], note: string | null = "The vendor's email of 3 Oct 2026", org = ORG_A) =>
  tx.as<{ r: Json }>(actor, "SELECT public.save_vendor_assessment($1, $2, $3, $4::jsonb) AS r", [org, id, note, JSON.stringify(answers)]);
const submit = (tx: Tx, actor: Actor, id: string, org = ORG_A) =>
  tx.as<{ r: Json }>(actor, "SELECT public.submit_vendor_assessment($1, $2) AS r", [org, id]);
const review = (tx: Tx, actor: Actor, id: string, decision: "accept" | "return", reason: string | null = null, reviewBy: string | null = null) =>
  tx.as<{ r: Json }>(actor, "SELECT public.review_vendor_assessment($1, $2, $3, $4, $5::date) AS r", [ORG_A, id, decision, reason, reviewBy]);
const discard = (tx: Tx, actor: Actor, id: string) => tx.as<{ r: Json }>(actor, "SELECT public.discard_vendor_assessment($1, $2) AS r", [ORG_A, id]);

const row = async (tx: Tx, id: string) =>
  (await tx.asAdmin<Json>("SELECT * FROM public.vendor_assessments WHERE id = $1", [id])).rows[0]!;

/** Every scored question answered with no risk; documents cited where `docs` names them. */
function complete(docs: Record<string, string> = {}): Entry[] {
  return SCORED_VENDOR_QUESTIONS.map((q) => {
    if (q.type === "select") return { code: q.code, answer: q.options!.find((o) => o.riskTenths === 0)!.value };
    return { code: q.code, answer: q.riskyAnswer === "no" ? "yes" : "no", evidenceId: docs[q.code] ?? null };
  });
}

/** A stored artefact of `org`, attached to `vendor` (as the CISO unless said). */
async function document(tx: Tx, vendor = VENDOR, org = ORG_A, review: "pending" | "rejected" = "pending") {
  const id = randomUUID();
  const path = `organizations/${org}/evidence/${id}/contract.pdf`;
  const uploader = org === ORG_A ? SEED_USERS.muItSecurity.id : SEED_USERS.bharatManufacturing.id;
  await tx.asAdmin("INSERT INTO storage.objects (bucket_id, name) VALUES ('evidence', $1)", [path]);
  await tx.asAdmin(
    `INSERT INTO public.evidence (id, organization_id, storage_path, file_name, content_type, byte_size, uploaded_by,
       review_status, evidence_level, reviewed_by, reviewed_at)
     VALUES ($1, $2, $3, 'contract.pdf', 'application/pdf', 1024, $4, $5, $6, $7, $8)`,
    [id, org, path, uploader, review, review === "rejected" ? 0 : null, review === "rejected" ? SEED_USERS.consultant.id : null, review === "rejected" ? new Date() : null],
  );
  await tx.as(org === ORG_A ? ciso() : bmlOwner(), "INSERT INTO public.evidence_links (organization_id, evidence_id, linked_entity_type, linked_entity_id) VALUES ($1, $2, 'vendor', $3)", [
    org,
    id,
    vendor,
  ]);
  return id;
}

/** Started by the CISO, completed, documented where needed, submitted. */
async function submitted(tx: Tx, vendor = VENDOR) {
  const a = await start(tx, ciso(), vendor);
  const contract = await document(tx, vendor);
  const docs = Object.fromEntries(VENDOR_QUESTIONS.filter((q) => q.document).map((q) => [q.code, contract]));
  await save(tx, ciso(), a.id, complete(docs));
  await submit(tx, ciso(), a.id);
  return { ...a, contract };
}

describe("1. tenancy (gate 5) and who may do what", () => {
  it("members read their own organisation's assessments and answers; Org B's owner sees none; anon is refused", async () => {
    await run(async (tx) => {
      const a = await start(tx, ciso());
      await save(tx, ciso(), a.id, [{ code: "C1", answer: "yes" }]);
      for (const table of ["vendor_assessments", "vendor_assessment_answers"]) {
        expect((await tx.as(dean(), `SELECT 1 FROM public.${table} WHERE organization_id = $1`, [ORG_A])).rowCount).toBeGreaterThan(0);
        expect((await tx.as(bmlOwner(), `SELECT 1 FROM public.${table} WHERE organization_id = $1`, [ORG_A])).rowCount).toBe(0);
        await expect(tx.as(null, `SELECT 1 FROM public.${table}`)).rejects.toThrow(/permission denied/);
      }
    });
  });

  it("nobody writes the tables directly — not even the organisation's own leads", async () => {
    await run(async (tx) => {
      const a = await start(tx, ciso());
      await expect(
        tx.as(registrar(), "INSERT INTO public.vendor_assessments (organization_id, vendor_id, version) VALUES ($1, $2, 9)", [ORG_A, OTHER_VENDOR]),
      ).rejects.toThrow(/permission denied/);
      await expect(tx.as(registrar(), "UPDATE public.vendor_assessments SET status = 'accepted' WHERE id = $1", [a.id])).rejects.toThrow(/permission denied/);
      await expect(
        tx.as(registrar(), "INSERT INTO public.vendor_assessment_answers (organization_id, assessment_id, question_code, answer) VALUES ($1, $2, 'C1', 'yes')", [
          ORG_A,
          a.id,
        ]),
      ).rejects.toThrow(/permission denied/);
      await expect(tx.as(registrar(), "DELETE FROM public.vendor_assessments WHERE id = $1", [a.id])).rejects.toThrow(/permission denied/);
    });
  });

  it("Org B cannot start, save, submit, review or discard on Org A — nor reach Org A's assessment from its own organisation", async () => {
    await run(async (tx) => {
      const a = await start(tx, ciso());
      await expect(start(tx, bmlOwner(), VENDOR, ORG_A)).rejects.toThrow(/permission/);
      await expect(save(tx, bmlOwner(), a.id, [{ code: "C1", answer: "no" }], null, ORG_A)).rejects.toThrow(/permission/);
      // From its own organisation, Org A's ids are the same 404 as no ids at all.
      await expect(start(tx, bmlOwner(), VENDOR, ORG_B)).rejects.toThrow(/Vendor not found/);
      await expect(save(tx, bmlOwner(), a.id, [{ code: "C1", answer: "no" }], null, ORG_B)).rejects.toThrow(/Assessment not found/);
      await expect(submit(tx, bmlOwner(), a.id, ORG_B)).rejects.toThrow(/Assessment not found/);
      await expect(
        tx.as(bmlOwner(), "SELECT public.review_vendor_assessment($1, $2, 'accept', NULL, NULL)", [ORG_B, a.id]),
      ).rejects.toThrow(/Assessment not found/);
      await expect(tx.as(bmlOwner(), "SELECT public.discard_vendor_assessment($1, $2)", [ORG_B, a.id])).rejects.toThrow(/Assessment not found/);
      expect((await row(tx, a.id)).status).toBe("draft");
      // …and BML's own vendor is assessed in BML only.
      const b = await start(tx, bmlOwner(), PAYROLL, ORG_B);
      expect(b.version).toBe(1);
    });
  });

  it("reading needs no more than membership; entering needs vendor.assess; anon executes nothing", async () => {
    await run(async (tx) => {
      await expect(start(tx, dean())).rejects.toThrow(/permission to assess/);
      await expect(tx.as(null, "SELECT public.start_vendor_assessment($1, $2)", [ORG_A, VENDOR])).rejects.toThrow(/permission denied/);
    });
  });
});

describe("2. the accuracy controls (4a.4)", () => {
  it("versions are the database's; one assessment open per vendor; a draft may be partial and discarded", async () => {
    await run(async (tx) => {
      const a = await start(tx, ciso());
      expect(a.version).toBe(1);
      expect(await row(tx, a.id)).toMatchObject({ status: "draft", source: "staff", created_by: SEED_USERS.muItSecurity.id });
      await expect(start(tx, legal())).rejects.toThrow(/already open/);
      await save(tx, ciso(), a.id, [{ code: "C1", answer: "yes" }], null);
      await discard(tx, ciso(), a.id);
      expect((await tx.asAdmin("SELECT 1 FROM public.vendor_assessments WHERE id = $1", [a.id])).rowCount).toBe(0);
      expect((await start(tx, ciso())).version).toBe(1);
    });
  });

  it("refuses an answer that is not one of the question's own, and a 'not applicable' without a reason", async () => {
    await run(async (tx) => {
      const a = await start(tx, ciso());
      await expect(save(tx, ciso(), a.id, [{ code: "A3", answer: "partial" }])).rejects.toThrow(/A3: give one of its answers/);
      await expect(save(tx, ciso(), a.id, [{ code: "E2", answer: "mars" }])).rejects.toThrow(/E2/);
      await expect(save(tx, ciso(), a.id, [{ code: "D3", notApplicable: true, naReason: " " }])).rejects.toThrow(/D3/);
      await expect(save(tx, ciso(), a.id, [{ code: "Z9", answer: "yes" }])).rejects.toThrow(/not a question/);
      await expect(save(tx, ciso(), a.id, [{ code: "C1", answer: "yes" }, { code: "C1", answer: "no" }])).rejects.toThrow(/once/);
      await save(tx, ciso(), a.id, [{ code: "D3", notApplicable: true, naReason: "No sub-processors are engaged." }]);
      // A blank entry clears the question.
      await save(tx, ciso(), a.id, [{ code: "D3" }]);
      expect((await tx.asAdmin("SELECT 1 FROM public.vendor_assessment_answers WHERE assessment_id = $1", [a.id])).rowCount).toBe(0);
    });
  });

  it("complete (4a.4.1): the database refuses a submission with a question unanswered, or with no stated source", async () => {
    await run(async (tx) => {
      const a = await start(tx, ciso());
      await save(tx, ciso(), a.id, complete().filter((e) => e.code !== "G6" && e.code !== "B3"), null);
      await expect(submit(tx, ciso(), a.id)).rejects.toThrow(/Say where the answers came from/);
      await save(tx, ciso(), a.id, [], "The vendor's email of 3 Oct 2026");
      await expect(submit(tx, ciso(), a.id)).rejects.toThrow(/2 questions are not answered or marked not applicable: B3, G6/);
      await save(tx, ciso(), a.id, [
        { code: "B3", answer: "yes" },
        { code: "G6", notApplicable: true, naReason: "Contact is through the account manager." },
      ]);
      const r = (await submit(tx, ciso(), a.id)).rows[0]!.r;
      expect(r.status).toBe("submitted");
      expect(await row(tx, a.id)).toMatchObject({ submitted_by: SEED_USERS.muItSecurity.id, source_note: "The vendor's email of 3 Oct 2026" });
    });
  });

  it("evidence-backed (4a.4.2): a claim with no document cited scores as the risky answer until one is", async () => {
    await run(async (tx) => {
      const a = await start(tx, ciso());
      await save(tx, ciso(), a.id, complete());
      await submit(tx, ciso(), a.id);
      const claimed = await row(tx, a.id);
      expect(claimed.unevidenced).toEqual(["A3", "A4", "C4", "D2", "G1"]);
      expect(claimed.risk_score).toBeGreaterThan(0);

      const b = await submitted(tx, OTHER_VENDOR);
      expect(await row(tx, b.id)).toMatchObject({ risk_score: 0, risk_tier: "low", unevidenced: [] });
    });
  });

  it("evidence-backed: a cited document must be attached to THIS vendor; a rejected one does not count", async () => {
    await run(async (tx) => {
      const a = await start(tx, ciso());
      const other = await document(tx, OTHER_VENDOR);
      await expect(save(tx, ciso(), a.id, [{ code: "G1", answer: "yes", evidenceId: other }])).rejects.toThrow(/Cite one of this vendor's documents/);
      const foreign = await document(tx, PAYROLL, ORG_B);
      await expect(save(tx, ciso(), a.id, [{ code: "G1", answer: "yes", evidenceId: foreign }])).rejects.toThrow();
      const rejected = await document(tx, VENDOR, ORG_A, "rejected");
      await save(tx, ciso(), a.id, complete({ G1: rejected }));
      await submit(tx, ciso(), a.id);
      expect((await row(tx, a.id)).unevidenced).toContain("G1");
    });
  });

  it("second person (4a.4.4): neither the creator, a person who answered, nor the submitter may accept or return it", async () => {
    await run(async (tx) => {
      // The Registrar starts it; the CISO answers and submits; Legal answers one question too.
      const a = await start(tx, registrar());
      const contract = await document(tx);
      await save(tx, ciso(), a.id, complete({ A3: contract, A4: contract, C4: contract, D2: contract, G1: contract }));
      await save(tx, legal(), a.id, [{ code: "C8", answer: "partial" }]);
      await submit(tx, ciso(), a.id);
      for (const actor of [registrar(), ciso(), legal()]) {
        await expect(review(tx, actor, a.id, "accept")).rejects.toThrow(/someone else must review it|permission to review/);
      }
      // The CISO has no vendor.review at all.
      await expect(review(tx, ciso(), a.id, "accept")).rejects.toThrow(/permission to review/);
      // The Organisation Admin did nothing on it: they may.
      const r = (await review(tx, u(SEED_USERS.muAdmin.id), a.id, "accept")).rows[0]!.r;
      expect(r.status).toBe("accepted");
    });
  });

  it("returned with a reason, corrected and resubmitted; the reviewer and the time are stamped", async () => {
    await run(async (tx) => {
      const a = await submitted(tx);
      await expect(review(tx, legal(), a.id, "return", " ")).rejects.toThrow(/Say why/);
      await review(tx, legal(), a.id, "return", "G1 cites the old contract; attach the 2026 one.");
      expect(await row(tx, a.id)).toMatchObject({ status: "returned", reviewed_by: SEED_USERS.muLegal.id, return_reason: "G1 cites the old contract; attach the 2026 one." });
      await expect(review(tx, legal(), a.id, "accept")).rejects.toThrow(/awaiting review/);
      await save(tx, ciso(), a.id, [{ code: "C8", answer: "partial" }]);
      await submit(tx, ciso(), a.id);
      await review(tx, legal(), a.id, "accept");
      expect((await row(tx, a.id)).status).toBe("accepted");
    });
  });

  it("current (4a.4.7): review by twelve months on by default; a chosen date after today and within 36 months", async () => {
    await run(async (tx) => {
      const a = await submitted(tx);
      const today = todayInIndia();
      await expect(review(tx, legal(), a.id, "accept", null, today)).rejects.toThrow(/after today/);
      await expect(review(tx, legal(), a.id, "accept", null, addMonths(today, 37))).rejects.toThrow(/at most 36 months/);
      const r = (await review(tx, legal(), a.id, "accept")).rows[0]!.r;
      expect(r.reviewBy).toBe(addMonths(today, 12));
      const b = await submitted(tx, OTHER_VENDOR);
      expect((await review(tx, legal(), b.id, "accept", null, addMonths(today, 6))).rows[0]!.r.reviewBy).toBe(addMonths(today, 6));
    });
  });

  it("frozen once accepted (4a.4.6): for everyone, tooling included; a correction is a new version that starts from it", async () => {
    await run(async (tx) => {
      const a = await submitted(tx);
      await review(tx, legal(), a.id, "accept");
      await expect(save(tx, ciso(), a.id, [{ code: "C1", answer: "no" }])).rejects.toThrow(/accepted/);
      await expect(discard(tx, ciso(), a.id)).rejects.toThrow(/never discarded/);
      await expect(tx.asAdmin("UPDATE public.vendor_assessments SET risk_score = 1, risk_tier = 'low' WHERE id = $1", [a.id])).rejects.toThrow(/never changes/);
      await expect(tx.asAdmin("UPDATE public.vendor_assessment_answers SET answer = 'no' WHERE assessment_id = $1 AND question_code = 'C1'", [a.id])).rejects.toThrow(
        /frozen/,
      );
      await expect(tx.asAdmin("DELETE FROM public.vendor_assessments WHERE id = $1", [a.id])).rejects.toThrow(/never deleted/);

      const next = await start(tx, legal());
      expect(next.version).toBe(2);
      const carried = await tx.asAdmin<{ n: string; by: string }>(
        "SELECT count(*) AS n, min(answered_by::text) AS by FROM public.vendor_assessment_answers WHERE assessment_id = $1",
        [next.id],
      );
      expect(Number(carried.rows[0]!.n)).toBe(SCORED_VENDOR_QUESTIONS.length);
      // Carried answers are the starter's to submit — so the starter cannot then review them.
      expect(carried.rows[0]!.by).toBe(SEED_USERS.muLegal.id);
      expect((await row(tx, a.id)).status).toBe("accepted");
    });
  });

  it("a submitted assessment is never discarded, and a vendor with an assessment on record is never deleted", async () => {
    await run(async (tx) => {
      const a = await submitted(tx);
      await expect(discard(tx, ciso(), a.id)).rejects.toThrow(/never discarded/);
      await expect(tx.as(registrar(), "DELETE FROM public.vendors WHERE id = $1", [VENDOR])).rejects.toThrow(/foreign key|violates/);
    });
  });
});

describe("2b. an organisation's own deletion removes everything", () => {
  it("an accepted assessment, its answers and the documents they cite all go with the organisation (tooling)", async () => {
    await run(async (tx) => {
      const a = await submitted(tx);
      await review(tx, legal(), a.id, "accept");
      // As the e2e teardown does: the append-only log first (RESTRICT), then the organisation.
      await tx.asAdmin("DELETE FROM public.audit_logs WHERE organization_id = $1", [ORG_A]);
      await tx.asAdmin("DELETE FROM public.organizations WHERE id = $1", [ORG_A]);
      // The cited document's key is checked at commit; check it now.
      await tx.asAdmin("SET CONSTRAINTS ALL IMMEDIATE");
      expect((await tx.asAdmin("SELECT 1 FROM public.vendor_assessments WHERE organization_id = $1", [ORG_A])).rowCount).toBe(0);
      expect((await tx.asAdmin("SELECT 1 FROM public.vendor_assessment_answers WHERE organization_id = $1", [ORG_A])).rowCount).toBe(0);
    });
  });
});

describe("3. the vendor's documents (evidence_links type 'vendor')", () => {
  it("attaching needs vendor.assess and a vendor of the same organisation; a cited document stays attached", async () => {
    await run(async (tx) => {
      const a = await submitted(tx);
      // A reader cannot attach.
      const id = randomUUID();
      const path = `organizations/${ORG_A}/evidence/${id}/cert.pdf`;
      await tx.asAdmin("INSERT INTO storage.objects (bucket_id, name) VALUES ('evidence', $1)", [path]);
      await tx.asAdmin(
        "INSERT INTO public.evidence (id, organization_id, storage_path, file_name, content_type, byte_size, uploaded_by) VALUES ($1, $2, $3, 'cert.pdf', 'application/pdf', 10, $4)",
        [id, ORG_A, path, SEED_USERS.muDean.id],
      );
      await expect(
        tx.as(dean(), "INSERT INTO public.evidence_links (organization_id, evidence_id, linked_entity_type, linked_entity_id) VALUES ($1, $2, 'vendor', $3)", [ORG_A, id, VENDOR]),
      ).rejects.toThrow();
      // Org B's vendor is not found from Org A.
      await expect(
        tx.as(ciso(), "INSERT INTO public.evidence_links (organization_id, evidence_id, linked_entity_type, linked_entity_id) VALUES ($1, $2, 'vendor', $3)", [ORG_A, id, PAYROLL]),
      ).rejects.toThrow(/Vendor not found/);
      // The contract the submitted answers cite cannot be detached.
      await expect(
        tx.asAdmin("DELETE FROM public.evidence_links WHERE evidence_id = $1 AND linked_entity_type = 'vendor'", [a.contract]),
      ).rejects.toThrow(/cites this document/);
    });
  });
});

describe("4. audit — every step once, as the person, never the free text", () => {
  it("start, save, submit and accept each write one row; no source note, reason or answer reaches the log", async () => {
    await run(async (tx) => {
      const a = await submitted(tx);
      await review(tx, legal(), a.id, "accept");
      const { rows } = await tx.asAdmin<{ event_type: string; user_id: string; metadata: Json }>(
        "SELECT event_type, user_id, metadata FROM public.audit_logs WHERE entity_id = $1 ORDER BY created_at, event_type",
        [a.id],
      );
      expect(rows.map((r) => r.event_type).sort()).toEqual(
        [
          "vendor.vendor_assessments.accepted",
          "vendor.vendor_assessments.answers_saved",
          "vendor.vendor_assessments.insert",
          "vendor.vendor_assessments.submitted",
        ].sort(),
      );
      expect(rows.find((r) => r.event_type.endsWith(".accepted"))!.user_id).toBe(SEED_USERS.muLegal.id);
      const text = JSON.stringify(rows.map((r) => r.metadata));
      expect(text).not.toContain("email of 3 Oct");
      expect(text).not.toContain('"yes"');
    });
  });

  it("a save that changes nothing writes nothing", async () => {
    await run(async (tx) => {
      const a = await start(tx, ciso());
      await save(tx, ciso(), a.id, [{ code: "C1", answer: "yes" }]);
      await save(tx, ciso(), a.id, [{ code: "C1", answer: "yes" }]);
      const { rows } = await tx.asAdmin("SELECT 1 FROM public.audit_logs WHERE entity_id = $1 AND event_type LIKE '%answers_saved'", [a.id]);
      expect(rows).toHaveLength(1);
    });
  });
});

describe("5. the questionnaire and the score are core's", () => {
  it("app.vendor_questions() is VENDOR_QUESTIONS, row for row", async () => {
    await run(async (tx) => {
      const { rows } = await tx.asAdmin<{ code: string; section: string; type: string; weight: number; risky_answer: string | null; options: Json[] | null; needs_document: boolean }>(
        "SELECT code, section, type, weight, risky_answer, options, needs_document FROM app.vendor_questions() ORDER BY ord",
      );
      expect(rows).toEqual(
        VENDOR_QUESTIONS.map((q) => ({
          code: q.code,
          section: q.section,
          type: q.type,
          weight: q.weight,
          risky_answer: q.riskyAnswer ?? null,
          options: q.options ? q.options.map((o) => ({ value: o.value, riskTenths: o.riskTenths })) : null,
          needs_document: q.document !== undefined,
        })),
      );
    });
  });

  it("app.vendor_assessment_risk equals vendorRisk on 120 generated answer sets", async () => {
    let seed = 7;
    const next = () => {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      return seed / 2147483648;
    };
    await run(async (tx) => {
      const doc = await document(tx);
      for (let i = 0; i < 120; i += 1) {
        const a = await start(tx, ciso());
        const entries: Entry[] = [];
        const scored: ScoredVendorAnswer[] = [];
        for (const q of SCORED_VENDOR_QUESTIONS) {
          const roll = next();
          if (roll < 0.15) continue;
          if (roll < 0.25) {
            entries.push({ code: q.code, notApplicable: true, naReason: "Does not apply." });
            scored.push({ code: q.code, answer: null, notApplicable: true, documented: false });
            continue;
          }
          const answers = q.type === "select" ? q.options!.map((o) => o.value) : q.type === "yes_no" ? ["yes", "no"] : ["yes", "no", "partial"];
          const answer = answers[Math.floor(next() * answers.length)]!;
          const cite = vendorQuestion(q.code)!.document !== undefined && next() < 0.5;
          entries.push({ code: q.code, answer, evidenceId: cite ? doc : null });
          scored.push({ code: q.code, answer, notApplicable: false, documented: cite });
        }
        await save(tx, ciso(), a.id, entries);
        const { rows } = await tx.asAdmin<{ r: { score: number | null; tier: string | null; answered: number; notApplicable: number; unevidenced: string[] } }>(
          "SELECT app.vendor_assessment_risk($1, $2) AS r",
          [ORG_A, a.id],
        );
        const core = vendorRisk(scored);
        expect(rows[0]!.r, `set ${i}`).toEqual({
          score: core.score,
          tier: core.tier,
          answered: core.answered,
          notApplicable: core.notApplicable,
          unevidenced: core.unevidenced,
        });
        await discard(tx, ciso(), a.id);
      }
    });
  });
});

describe("6. model 1.4.0 in a stored snapshot", () => {
  it("MU's two processors with contract gaps bar Mitigated on heads 1 and 7; an out-of-date accepted assessment is a reason", async () => {
    await run(async (tx) => {
      const input = async () =>
        (await tx.asAdmin<{ input: { vendors: Json[] } }>("SELECT (app.exposure_input($1, current_date)) -> 'input' AS input", [ORG_A])).rows[0]!.input;
      const facts = (await input()).vendors;
      expect(facts.filter((v) => v.role !== "independent" && (v.contractExists !== "yes" || v.dpdpClauses !== "yes"))).toHaveLength(2);

      // A not-mitigated fact never makes a head "assessed" on its own (as 1.1.0's breach row): MU's
      // register gaps do — the LMS provider is linked to ROPA-004, so its contract gap is one of them.
      await tx.asAdmin("SELECT app.refresh_ropa_gaps($1)", [ORG_A]);
      const snapshot = async () => {
        const { rows } = await tx.as<{ id: string }>(registrar(), "SELECT public.record_exposure_snapshot($1) AS id", [ORG_A]);
        return (await tx.asAdmin<{ model_version: string; heads: { code: string; status: string; reasons: { text: string }[] }[] }>(
          "SELECT model_version, heads FROM public.exposure_snapshots WHERE id = $1",
          [rows[0]!.id],
        )).rows[0]!;
      };
      const first = await snapshot();
      expect(first.model_version).toBe("1.7.0");
      for (const code of ["H1", "H7"]) {
        const h = first.heads.find((x) => x.code === code)!;
        expect(h.status).not.toBe("mitigated");
        expect(h.reasons.map((r) => r.text).join(" ")).toContain("2 processors have no contract with DPDP clauses recorded");
      }

      // An accepted assessment, then its review-by date put in the past (tooling, triggers off).
      const a = await submitted(tx);
      await review(tx, legal(), a.id, "accept");
      expect((await input()).vendors.some((v) => v.assessmentReviewBy !== null)).toBe(true);
      await tx.asAdmin("SET LOCAL session_replication_role = replica");
      await tx.asAdmin("UPDATE public.vendor_assessments SET review_by = current_date - 1 WHERE id = $1", [a.id]);
      await tx.asAdmin("SET LOCAL session_replication_role = origin");
      const stale = await snapshot();
      for (const code of ["H1", "H7"]) {
        expect(stale.heads.find((x) => x.code === code)!.reasons.map((r) => r.text)).toContain(
          "1 processor's accepted assessment is past its review-by date (a TrustStack default, not a statutory period).",
        );
      }
    });
  });
});
