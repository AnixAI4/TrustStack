/**
 * Slice 11, Stage 1a — GATE 5 (RLS) and the database's rules for the AI
 * gateway (migration 20261020000000_ai_gateway; SLICE_11 §4.4, §4.8, §4.10, §6).
 *
 *   1. Org A cannot read or write Org B's drafts; anon holds nothing; reading
 *      needs `ai.use` AND the task's read permission.
 *   2. The second lock: no draft is stored while the organisation's assistant is
 *      off or held. Who asked is stamped; a draft is never changed or removed.
 *   3. The switch (A2): on only with the contract reference and only with
 *      `organization.update`; stamped and audited; off at once.
 *   4. A4: `bfsi` / `healthcare` stay off without counsel's sign-off, an SDF
 *      stays off, and moving into either turns the assistant OFF.
 *   5. Audit by trigger, as the person: task, target, model, tokens — never the
 *      context or the answer.
 *   6. Usage for the limits counts every call, whatever the caller may read.
 *   7. The vocabularies mirror packages/core.
 *   8. Stage 1b (20261021000000_ai_explain_helpers): thumbs up / down — once, by
 *      the person who asked, on an answer that was kept; stamped; audited as
 *      `ai.feedback` without the comment; nothing else in the row may change.
 *   9. Stage 2a (20261022000000_ai_register_drafts): a drafting task's draft is
 *      accepted (with the person's text) or discarded — once, by a holder of the
 *      register's WRITE permission, not only the asker (D-129.3); stamped; audited
 *      `ai.draft.accepted` / `ai.draft.discarded` without the text. The two update
 *      policies are OR'd, so the GUARD keeps a rating to its asker and a decision
 *      to a writer — tested both ways. An explanation is never accepted.
 *  9b. Stage 2b (20261023000000_ai_notice_narrative): a notice and its translation are
 *      decided with consent.write; a report's narrative with report.generate (§7c.1).
 *
 * Every test runs inside a transaction that is rolled back.
 */
import { randomUUID } from "node:crypto";
import { AI_HELD_INDUSTRIES, AI_REJECTIONS, AI_TARGET_TYPES, AI_TASK_SPECS, AI_TASKS } from "@truststack/core";
import { SEED_ASSESSMENTS, SEED_ORGS, SEED_USERS } from "@truststack/db/seed-data";
import type pg from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { authSubjects, connect, inTransaction, type Tx } from "./db";

const ORG_A = SEED_ORGS.mumbaiUniversity.id; // AI on in the seed (fictional contract)
const ORG_B = SEED_ORGS.bharatManufacturing.id; // AI off
const ASSESSMENT = SEED_ASSESSMENTS.muBaseline.id;

let client: pg.Client;
let who: Map<string, { sub: string; email: string }>;
const u = (id: string) => who.get(id)!;
const registrar = () => u(SEED_USERS.mumbaiUniversity.id); // dpdp_owner: no organization.update
const muAdmin = () => u(SEED_USERS.muAdmin.id); // organization_admin: organization.update
const dean = () => u(SEED_USERS.muDean.id); // executive_sponsor: reads the registers, writes none
const legal = () => u(SEED_USERS.muLegal.id); // legal_user: ropa.write, breach.write, rights.write
const bmlOwner = () => u(SEED_USERS.bharatManufacturing.id);
const bmlAdmin = () => u(SEED_USERS.bmlAdmin.id);
type Actor = { sub: string; email: string };

beforeAll(async () => {
  client = await connect();
  who = await authSubjects(client, Object.values(SEED_USERS).map((x) => x.id));
});
afterAll(async () => {
  await client?.end();
});

const DIGEST = "a".repeat(64);
const insertDraft = (tx: Tx, actor: Actor | null, org: string, extra: Record<string, unknown> = {}) => {
  const row = {
    organization_id: org,
    task: "question_helper",
    target_type: "assessment_question",
    target_id: ASSESSMENT,
    target_key: "G1.2",
    status: "draft",
    rejection: null,
    input_digest: DIGEST,
    context: { question: { text: "SECRET-CONTEXT-TEXT" } },
    output: { answer: "SECRET-ANSWER-TEXT" },
    model: "fake-recorded-1a",
    corpus_version: "test",
    prompt_version: "test",
    input_tokens: 900,
    output_tokens: 450,
    cache_read_tokens: 30000,
    cache_write_tokens: 0,
    ...extra,
  };
  const cols = Object.keys(row);
  const sql = `INSERT INTO public.ai_drafts (${cols.join(", ")}) VALUES (${cols.map((_, i) => `$${i + 1}`).join(", ")}) RETURNING id, requested_by, created_at`;
  const params = Object.values(row).map((v) => (v !== null && typeof v === "object" ? JSON.stringify(v) : v));
  return actor === null ? tx.asAdmin<{ id: string; requested_by: string | null }>(sql, params) : tx.as<{ id: string; requested_by: string | null }>(actor, sql, params);
};

const expectError = async (p: Promise<unknown>, code: string | RegExp) => {
  const err = (await p.then(
    () => null,
    (e: unknown) => e,
  )) as { code?: string; message?: string } | null;
  expect(err, "expected the database to refuse").not.toBeNull();
  if (typeof code === "string") expect(err!.code).toBe(code);
  else expect(err!.message).toMatch(code);
};

describe("1 · Gate 5 — drafts belong to one organisation", () => {
  it("a member reads their organisation's drafts; another organisation's member reads none", async () => {
    await inTransaction(client, async (tx) => {
      const { rows } = await insertDraft(tx, registrar(), ORG_A);
      const id = rows[0]!.id;
      expect((await tx.as(dean(), "SELECT id FROM public.ai_drafts WHERE id = $1", [id])).rowCount).toBe(1);
      expect((await tx.as(bmlOwner(), "SELECT id FROM public.ai_drafts WHERE id = $1", [id])).rowCount).toBe(0);
      expect((await tx.as(bmlOwner(), "SELECT id FROM public.ai_drafts WHERE organization_id = $1", [ORG_A])).rowCount).toBe(0);
    });
  });
  it("Org B cannot write a draft into Org A", async () => {
    await inTransaction(client, async (tx) => {
      await expectError(insertDraft(tx, bmlOwner(), ORG_A), "42501");
    });
  });
  it("anon holds nothing", async () => {
    await inTransaction(client, async (tx) => {
      await expectError(tx.as(null, "SELECT 1 FROM public.ai_drafts"), "42501");
      await expectError(tx.as(null, "SELECT 1 FROM public.ai_industry_signoffs"), "42501");
      await expectError(tx.as(null, "SELECT public.ai_usage($1)", [ORG_A]), "42501");
    });
  });
  it("reading needs the task's own permission beside ai.use (§4.7)", async () => {
    await inTransaction(client, async (tx) => {
      const { rows } = await insertDraft(tx, registrar(), ORG_A);
      // A role without assessment.read: every seeded role holds it, so build one here (rolled back).
      const roleId = (await tx.asAdmin<{ id: string }>(
        "INSERT INTO public.roles (code, name, description) VALUES ($1, 'Test: AI only', 'Rolled back') RETURNING id",
        [`test_ai_only_${randomUUID().slice(0, 8)}`],
      )).rows[0]!.id;
      await tx.asAdmin(
        "INSERT INTO public.role_permissions (role_id, permission_id) SELECT $1, id FROM public.permissions WHERE code = 'ai.use'",
        [roleId],
      );
      await tx.asAdmin("UPDATE public.organization_users SET role_id = $1 WHERE user_id = $2 AND organization_id = $3", [
        roleId,
        SEED_USERS.muDean.id,
        ORG_A,
      ]);
      expect((await tx.as(dean(), "SELECT id FROM public.ai_drafts WHERE id = $1", [rows[0]!.id])).rowCount).toBe(0);
      await expectError(insertDraft(tx, dean(), ORG_A), "42501");
    });
  });
});

describe("2 · the draft store", () => {
  it("is stamped with who asked and when — a caller cannot send either", async () => {
    await inTransaction(client, async (tx) => {
      const { rows } = await insertDraft(tx, registrar(), ORG_A);
      expect(rows[0]!.requested_by).toBe(SEED_USERS.mumbaiUniversity.id);
      await expectError(insertDraft(tx, registrar(), ORG_A, { requested_by: SEED_USERS.muDean.id }), "42501");
    });
  });
  it("refuses a draft while the organisation's assistant is off — the second lock", async () => {
    await inTransaction(client, async (tx) => {
      await expectError(insertDraft(tx, bmlOwner(), ORG_B), "TS403");
      await expectError(insertDraft(tx, null, ORG_B), "TS403"); // tooling too
    });
  });
  it("is never changed or removed — not even by tooling", async () => {
    await inTransaction(client, async (tx) => {
      const id = (await insertDraft(tx, registrar(), ORG_A)).rows[0]!.id;
      // Stage 2a granted `status` for a decision; an explanation has none to take (§9).
      await expectError(tx.as(registrar(), "UPDATE public.ai_drafts SET status = 'rejected' WHERE id = $1", [id]), "TS409");
      await expectError(tx.as(registrar(), "UPDATE public.ai_drafts SET context = '{}' WHERE id = $1", [id]), "42501");
      await expectError(tx.as(registrar(), "DELETE FROM public.ai_drafts WHERE id = $1", [id]), "42501");
      await expectError(tx.asAdmin("UPDATE public.ai_drafts SET model = 'x' WHERE id = $1", [id]), "TS409");
    });
  });
  it("keeps a draft whole or a rejection whole — never a half-answer (§4.3)", async () => {
    await inTransaction(client, async (tx) => {
      await expectError(insertDraft(tx, registrar(), ORG_A, { status: "draft", output: null }), "23514");
      await expectError(insertDraft(tx, registrar(), ORG_A, { status: "rejected", rejection: "wording" }), "23514");
      await expectError(insertDraft(tx, registrar(), ORG_A, { status: "rejected", output: null, rejection: "made_up" }), "23514");
      await expectError(insertDraft(tx, registrar(), ORG_A, { task: "made_up_task" }), /row-level security|check constraint/);
      // Stage 2a: nobody inserts a decision — it is taken once, later, and stamped.
      await expectError(insertDraft(tx, registrar(), ORG_A, { status: "accepted" }), "23514");
      await expectError(insertDraft(tx, registrar(), ORG_A, { status: "discarded" }), "23514");
      const ok = await insertDraft(tx, registrar(), ORG_A, { status: "rejected", output: null, rejection: "wording" });
      expect(ok.rowCount).toBe(1);
    });
  });
});

describe("3 · the switch (A2)", () => {
  const readOrg = async (tx: Tx, org: string) =>
    (await tx.asAdmin<{ ai_enabled: boolean; ai_contract_ref: string | null; ai_enabled_by: string | null; ai_enabled_at: string | null }>(
      "SELECT ai_enabled, ai_contract_ref, ai_enabled_by, ai_enabled_at FROM public.organizations WHERE id = $1",
      [org],
    )).rows[0]!;

  it("only organization.update turns it on or off", async () => {
    await inTransaction(client, async (tx) => {
      await expectError(tx.as(registrar(), "UPDATE public.organizations SET ai_enabled = false WHERE id = $1", [ORG_A]), "TS403");
      await tx.as(muAdmin(), "UPDATE public.organizations SET ai_enabled = false WHERE id = $1", [ORG_A]);
      expect((await readOrg(tx, ORG_A)).ai_enabled).toBe(false);
    });
  });
  it("on needs the contract reference; who and when are stamped; off clears them", async () => {
    await inTransaction(client, async (tx) => {
      await expectError(tx.as(bmlAdmin(), "UPDATE public.organizations SET ai_enabled = true WHERE id = $1", [ORG_B]), "23514");
      await expectError(tx.as(bmlAdmin(), "UPDATE public.organizations SET ai_enabled = true, ai_contract_ref = '  ' WHERE id = $1", [ORG_B]), "23514");
      await tx.as(bmlAdmin(), "UPDATE public.organizations SET ai_enabled = true, ai_contract_ref = 'BML-DPA-2026-07' WHERE id = $1", [ORG_B]);
      const on = await readOrg(tx, ORG_B);
      expect(on).toMatchObject({ ai_enabled: true, ai_contract_ref: "BML-DPA-2026-07", ai_enabled_by: SEED_USERS.bmlAdmin.id });
      expect(on.ai_enabled_at).not.toBeNull();
      await expectError(tx.as(bmlAdmin(), "UPDATE public.organizations SET ai_enabled_by = $2 WHERE id = $1", [ORG_B, SEED_USERS.bharatManufacturing.id]), "42501");
      await tx.as(bmlAdmin(), "UPDATE public.organizations SET ai_enabled = false WHERE id = $1", [ORG_B]);
      expect(await readOrg(tx, ORG_B)).toMatchObject({ ai_enabled: false, ai_enabled_by: null, ai_enabled_at: null, ai_contract_ref: "BML-DPA-2026-07" });
    });
  });
  it("audits on, off and a changed reference — as the person, with the reference", async () => {
    await inTransaction(client, async (tx) => {
      await tx.as(bmlAdmin(), "UPDATE public.organizations SET ai_enabled = true, ai_contract_ref = 'BML-DPA-1' WHERE id = $1", [ORG_B]);
      await tx.as(bmlAdmin(), "UPDATE public.organizations SET ai_contract_ref = 'BML-DPA-2' WHERE id = $1", [ORG_B]);
      await tx.as(bmlAdmin(), "UPDATE public.organizations SET ai_enabled = false WHERE id = $1", [ORG_B]);
      const { rows } = await tx.asAdmin<{ event_type: string; user_id: string; metadata: Record<string, unknown> }>(
        "SELECT event_type, user_id, metadata FROM public.audit_logs WHERE organization_id = $1 AND event_type LIKE 'ai.%' ORDER BY event_type",
        [ORG_B],
      );
      // One transaction: one timestamp, so compare as a set.
      expect(rows.map((r) => r.event_type)).toEqual(["ai.contract_changed", "ai.disabled", "ai.enabled"]);
      expect(rows.every((r) => r.user_id === SEED_USERS.bmlAdmin.id)).toBe(true);
      expect(rows[0]!.metadata).toMatchObject({ contractRef: "BML-DPA-2", previousContractRef: "BML-DPA-1" });
      // The scope audit reports the switch, never its stamps.
      const scope = await tx.asAdmin<{ metadata: { changed: string[] } }>(
        "SELECT metadata FROM public.audit_logs WHERE organization_id = $1 AND event_type = 'scope.organizations.update'",
        [ORG_B],
      );
      const changed = scope.rows.flatMap((r) => r.metadata.changed);
      expect(scope.rowCount).toBe(3);
      expect(new Set(changed)).toEqual(new Set(["ai_contract_ref", "ai_enabled"]));
    });
  });
});

describe("4 · A4 — sector rules (s.16(2)) and SDFs (Rule 13(4)) hold the assistant off", () => {
  async function newOrg(tx: Tx, industry: string): Promise<string> {
    const { rows } = await tx.asAdmin<{ id: string }>(
      "INSERT INTO public.organizations (name, organization_type, industry_code) VALUES ($1, 'company', $2) RETURNING id",
      [`RLS AI ${randomUUID()}`, industry],
    );
    return rows[0]!.id;
  }
  for (const industry of AI_HELD_INDUSTRIES) {
    it(`${industry}: refused without counsel's sign-off, allowed once it is recorded`, async () => {
      await inTransaction(client, async (tx) => {
        const org = await newOrg(tx, industry);
        await expectError(tx.asAdmin("UPDATE public.organizations SET ai_enabled = true, ai_contract_ref = 'X' WHERE id = $1", [org]), /sector rules \(s\.16\(2\)\)/);
        await tx.asAdmin("INSERT INTO public.ai_industry_signoffs (industry_code, counsel_ref, signed_on) VALUES ($1, 'COUNSEL-TEST', '2026-10-20')", [industry]);
        await tx.asAdmin("UPDATE public.organizations SET ai_enabled = true, ai_contract_ref = 'X' WHERE id = $1", [org]);
        expect((await tx.asAdmin<{ ai_enabled: boolean }>("SELECT ai_enabled FROM public.organizations WHERE id = $1", [org])).rows[0]!.ai_enabled).toBe(true);
      });
    });
  }
  it("an SDF is refused, whatever its industry", async () => {
    await inTransaction(client, async (tx) => {
      const org = await newOrg(tx, "university");
      await tx.asAdmin("UPDATE public.organizations SET sdf_notified_on = '2026-03-01', sdf_notification_ref = 'S.O. TEST' WHERE id = $1", [org]);
      await expectError(tx.asAdmin("UPDATE public.organizations SET ai_enabled = true, ai_contract_ref = 'X' WHERE id = $1", [org]), /Rule 13\(4\)/);
      await expectError(
        tx.asAdmin("INSERT INTO public.organizations (name, organization_type, industry_code, ai_enabled, ai_contract_ref) VALUES ('x', 'company', 'bfsi', true, 'X')"),
        "TS409",
      );
    });
  });
  it("moving into a held industry, or recording an SDF notification, turns it OFF in the same update", async () => {
    await inTransaction(client, async (tx) => {
      await tx.as(muAdmin(), "UPDATE public.organizations SET sdf_notified_on = '2026-03-01', sdf_notification_ref = 'S.O. TEST' WHERE id = $1", [ORG_A]);
      const after = (await tx.asAdmin<{ ai_enabled: boolean }>("SELECT ai_enabled FROM public.organizations WHERE id = $1", [ORG_A])).rows[0]!;
      expect(after.ai_enabled).toBe(false);
      const ev = await tx.asAdmin<{ event_type: string }>("SELECT event_type FROM public.audit_logs WHERE organization_id = $1 AND event_type = 'ai.disabled'", [ORG_A]);
      expect(ev.rowCount).toBe(1);
      await expectError(insertDraft(tx, registrar(), ORG_A), "TS403");
    });
    await inTransaction(client, async (tx) => {
      await tx.asAdmin("UPDATE public.organizations SET industry_code = 'healthcare' WHERE id = $1", [ORG_A]);
      expect((await tx.asAdmin<{ ai_enabled: boolean }>("SELECT ai_enabled FROM public.organizations WHERE id = $1", [ORG_A])).rows[0]!.ai_enabled).toBe(false);
    });
  });
});

describe("5 · audit — as the person, never the text (§4.10)", () => {
  it("a draft is `ai.requested`, a rejection `ai.refused`, an injection `ai.injection_flagged`", async () => {
    await inTransaction(client, async (tx) => {
      const a = (await insertDraft(tx, registrar(), ORG_A)).rows[0]!.id;
      const b = (await insertDraft(tx, registrar(), ORG_A, { status: "rejected", output: null, rejection: "wording", injection_flagged: true })).rows[0]!.id;
      const { rows } = await tx.asAdmin<{ event_type: string; entity_id: string; user_id: string; metadata: Record<string, unknown> }>(
        "SELECT event_type, entity_id, user_id, metadata FROM public.audit_logs WHERE entity_id = ANY($1::uuid[]) ORDER BY event_type",
        [[a, b]],
      );
      expect(rows.map((r) => `${r.event_type}:${r.entity_id === a ? "a" : "b"}`)).toEqual(["ai.injection_flagged:b", "ai.refused:b", "ai.requested:a"]);
      expect(rows.every((r) => r.user_id === SEED_USERS.mumbaiUniversity.id)).toBe(true);
      expect(rows[2]!.metadata).toMatchObject({ task: "question_helper", targetKey: "G1.2", model: "fake-recorded-1a", inputTokens: 900, cacheReadTokens: 30000 });
      expect(rows[1]!.metadata).toMatchObject({ rejection: "wording" });
      const all = JSON.stringify(rows);
      expect(all).not.toContain("SECRET-CONTEXT-TEXT");
      expect(all).not.toContain("SECRET-ANSWER-TEXT");
    });
  });
});

describe("6 · usage for the limits (§4.9)", () => {
  it("counts every call in the organisation, and the caller's own", async () => {
    await inTransaction(client, async (tx) => {
      const before = (await tx.as<{ u: { personCallsLastHour: number; organizationCallsLastHour: number; organizationTokensThisMonth: number } }>(registrar(), "SELECT public.ai_usage($1) AS u", [ORG_A])).rows[0]!.u;
      await insertDraft(tx, registrar(), ORG_A);
      await insertDraft(tx, dean(), ORG_A, { status: "rejected", output: null, rejection: "refusal", input_tokens: 10, output_tokens: 0, cache_read_tokens: 0 });
      const after = (await tx.as<{ u: { personCallsLastHour: number; organizationCallsLastHour: number; organizationTokensThisMonth: number } }>(registrar(), "SELECT public.ai_usage($1) AS u", [ORG_A])).rows[0]!.u;
      expect(after.personCallsLastHour - before.personCallsLastHour).toBe(1);
      expect(after.organizationCallsLastHour - before.organizationCallsLastHour).toBe(2);
      expect(after.organizationTokensThisMonth - before.organizationTokensThisMonth).toBe(900 + 450 + 30000 + 10);
    });
  });
  it("is refused for another organisation", async () => {
    await inTransaction(client, async (tx) => {
      await expectError(tx.as(bmlOwner(), "SELECT public.ai_usage($1)", [ORG_A]), "TS403");
    });
  });
});

describe("7 · the vocabularies mirror packages/core", () => {
  it("tasks, their read permissions and target types, held industries and rejections", async () => {
    await inTransaction(client, async (tx) => {
      const { rows } = await tx.asAdmin<{ tasks: string[]; held: string[]; rejection: string; target: string }>(
        `SELECT app.ai_tasks() AS tasks, app.ai_held_industries() AS held,
                (SELECT pg_get_constraintdef(c.oid) FROM pg_constraint c WHERE c.conname = 'ai_drafts_rejection_check') AS rejection,
                (SELECT pg_get_constraintdef(c.oid) FROM pg_constraint c WHERE c.conname = 'ai_drafts_target_type_check') AS target`,
      );
      expect(rows[0]!.tasks).toEqual([...AI_TASKS]);
      expect(rows[0]!.held).toEqual([...AI_HELD_INDUSTRIES]);
      for (const r of AI_REJECTIONS) expect(rows[0]!.rejection).toContain(`'${r}'`);
      for (const t of AI_TARGET_TYPES) expect(rows[0]!.target).toContain(`'${t}'`);
      for (const task of AI_TASKS) {
        const perm = (await tx.asAdmin<{ p: string }>("SELECT app.ai_task_read_permission($1) AS p", [task])).rows[0]!.p;
        expect(perm, task).toBe(AI_TASK_SPECS[task].readPermission);
        // Stage 2a: the write permission a draft is decided with — none for an explanation.
        const write = (await tx.asAdmin<{ p: string | null }>("SELECT app.ai_task_write_permission($1) AS p", [task])).rows[0]!.p;
        expect(write, task).toBe(AI_TASK_SPECS[task].writePermission);
        expect(rows[0]!.target, task).toContain(`'${AI_TASK_SPECS[task].targetType}'`);
      }
    });
  });
});

describe("8 · thumbs up / down (Stage 1b, §4.13)", () => {
  const rate = (tx: Tx, actor: Actor | null, id: string, feedback: string | null, comment: string | null = null) =>
    actor === null
      ? tx.asAdmin("UPDATE public.ai_drafts SET feedback = $2, feedback_comment = $3 WHERE id = $1", [id, feedback, comment])
      : tx.as(actor, "UPDATE public.ai_drafts SET feedback = $2, feedback_comment = $3 WHERE id = $1", [id, feedback, comment]);

  it("the person who asked rates it once; who and when are stamped", async () => {
    await inTransaction(client, async (tx) => {
      const id = (await insertDraft(tx, registrar(), ORG_A)).rows[0]!.id;
      expect((await rate(tx, registrar(), id, "up", "Clear and useful.")).rowCount).toBe(1);
      const row = (await tx.asAdmin<{ feedback: string; feedback_comment: string; feedback_by: string; feedback_at: string | null }>(
        "SELECT feedback, feedback_comment, feedback_by, feedback_at FROM public.ai_drafts WHERE id = $1",
        [id],
      )).rows[0]!;
      expect(row).toMatchObject({ feedback: "up", feedback_comment: "Clear and useful.", feedback_by: SEED_USERS.mumbaiUniversity.id });
      expect(row.feedback_at).not.toBeNull();
      await expectError(rate(tx, registrar(), id, "down"), "TS409");
    });
  });
  it("nobody else rates it — another member, another organisation, or tooling", async () => {
    await inTransaction(client, async (tx) => {
      const id = (await insertDraft(tx, registrar(), ORG_A)).rows[0]!.id;
      expect((await rate(tx, dean(), id, "down")).rowCount).toBe(0);
      expect((await rate(tx, bmlOwner(), id, "down")).rowCount).toBe(0);
      await expectError(rate(tx, null, id, "down"), "TS403");
      const { rows } = await tx.asAdmin<{ feedback: string | null }>("SELECT feedback FROM public.ai_drafts WHERE id = $1", [id]);
      expect(rows[0]!.feedback).toBeNull();
    });
  });
  it("only the rating changes: no stamp, no answer, no rating of a rejected call, no comment without a rating", async () => {
    await inTransaction(client, async (tx) => {
      const id = (await insertDraft(tx, registrar(), ORG_A)).rows[0]!.id;
      await expectError(tx.as(registrar(), "UPDATE public.ai_drafts SET feedback_by = $2 WHERE id = $1", [id, SEED_USERS.muDean.id]), "42501");
      await expectError(tx.as(registrar(), "UPDATE public.ai_drafts SET output = '{}' WHERE id = $1", [id]), "42501");
      await expectError(tx.asAdmin("UPDATE public.ai_drafts SET feedback = 'up', model = 'x' WHERE id = $1", [id]), "TS409");
      await expectError(rate(tx, registrar(), id, "sideways"), "23514");
      await expectError(rate(tx, registrar(), id, "up", "x".repeat(501)), "23514");
      await expectError(rate(tx, registrar(), id, null, "A comment alone."), "TS422");
      const rejected = (await insertDraft(tx, registrar(), ORG_A, { status: "rejected", output: null, rejection: "wording" })).rows[0]!.id;
      await expectError(rate(tx, registrar(), rejected, "down"), "23514");
    });
  });
  it("is audited as `ai.feedback`, as the person — never the comment", async () => {
    await inTransaction(client, async (tx) => {
      const id = (await insertDraft(tx, registrar(), ORG_A)).rows[0]!.id;
      await rate(tx, registrar(), id, "down", "SECRET-FEEDBACK-COMMENT");
      const { rows } = await tx.asAdmin<{ user_id: string; metadata: Record<string, unknown> }>(
        "SELECT user_id, metadata FROM public.audit_logs WHERE entity_id = $1 AND event_type = 'ai.feedback'",
        [id],
      );
      expect(rows).toHaveLength(1);
      expect(rows[0]!.user_id).toBe(SEED_USERS.mumbaiUniversity.id);
      expect(rows[0]!.metadata).toMatchObject({ task: "question_helper", feedback: "down", withComment: true, targetKey: "G1.2" });
      expect(JSON.stringify(rows)).not.toContain("SECRET-FEEDBACK-COMMENT");
    });
  });
});

describe("9 · accept or discard a draft (Stage 2a, §4.4, D-129)", () => {
  const ropaDraft = (tx: Tx, actor: Actor | null) =>
    insertDraft(tx, actor, ORG_A, { task: "ropa_draft", target_type: "ropa_new", target_id: null, target_key: null, output: { draft: { name: "SECRET-DRAFT-TEXT" } } });
  const ACCEPTED = { name: "SECRET-ACCEPTED-TEXT", purpose: "Admissions" };
  const accept = (tx: Tx, actor: Actor | null, id: string, output: unknown = ACCEPTED) =>
    actor === null
      ? tx.asAdmin("UPDATE public.ai_drafts SET status = 'accepted', accepted_output = $2 WHERE id = $1", [id, JSON.stringify(output)])
      : tx.as(actor, "UPDATE public.ai_drafts SET status = 'accepted', accepted_output = $2 WHERE id = $1", [id, JSON.stringify(output)]);
  const discard = (tx: Tx, actor: Actor, id: string) => tx.as(actor, "UPDATE public.ai_drafts SET status = 'discarded' WHERE id = $1", [id]);
  const row = async (tx: Tx, id: string) =>
    (await tx.asAdmin<{ status: string; accepted_output: unknown; decided_by: string | null; decided_at: string | null; feedback: string | null }>(
      "SELECT status, accepted_output, decided_by, decided_at, feedback FROM public.ai_drafts WHERE id = $1",
      [id],
    )).rows[0]!;

  it("a register writer who did not ask accepts it, once; who and when are stamped", async () => {
    await inTransaction(client, async (tx) => {
      const id = (await ropaDraft(tx, registrar())).rows[0]!.id;
      expect((await accept(tx, legal(), id)).rowCount).toBe(1);
      const r = await row(tx, id);
      expect(r).toMatchObject({ status: "accepted", accepted_output: ACCEPTED, decided_by: SEED_USERS.muLegal.id });
      expect(r.decided_at).not.toBeNull();
      await expectError(accept(tx, registrar(), id, { name: "A second decision" }), "TS409");
      await expectError(discard(tx, registrar(), id), "TS409");
      expect((await row(tx, id)).decided_by).toBe(SEED_USERS.muLegal.id);
    });
  });
  it("the asker discards it; nothing is kept but the decision", async () => {
    await inTransaction(client, async (tx) => {
      const id = (await ropaDraft(tx, registrar())).rows[0]!.id;
      expect((await discard(tx, registrar(), id)).rowCount).toBe(1);
      expect(await row(tx, id)).toMatchObject({ status: "discarded", accepted_output: null, decided_by: SEED_USERS.mumbaiUniversity.id });
    });
  });
  it("nobody without the register's write permission decides — a reader, another organisation, tooling", async () => {
    await inTransaction(client, async (tx) => {
      const id = (await ropaDraft(tx, registrar())).rows[0]!.id;
      expect((await accept(tx, dean(), id)).rowCount).toBe(0); // reads the register, cannot write it
      expect((await accept(tx, bmlOwner(), id)).rowCount).toBe(0);
      await expectError(accept(tx, null, id), "TS403");
      expect((await row(tx, id)).status).toBe("draft");
    });
  });
  it("OR'd policies: the asker WITHOUT the write permission reaches the row through the rating policy — the guard refuses", async () => {
    await inTransaction(client, async (tx) => {
      const id = (await ropaDraft(tx, dean())).rows[0]!.id;
      await expectError(accept(tx, dean(), id), "TS403");
      // …and may still rate their own draft (D-127.7, unchanged).
      expect((await tx.as(dean(), "UPDATE public.ai_drafts SET feedback = 'up' WHERE id = $1", [id])).rowCount).toBe(1);
    });
  });
  it("OR'd policies: a writer reaches another person's row through the decision policy — but may not RATE it", async () => {
    await inTransaction(client, async (tx) => {
      const id = (await ropaDraft(tx, registrar())).rows[0]!.id;
      await expectError(tx.as(legal(), "UPDATE public.ai_drafts SET feedback = 'down' WHERE id = $1", [id]), "TS403");
      expect((await row(tx, id)).feedback).toBeNull();
    });
  });
  it("an explanation is never accepted; a rejected call is never decided", async () => {
    await inTransaction(client, async (tx) => {
      const explain = (await insertDraft(tx, registrar(), ORG_A)).rows[0]!.id;
      await expectError(accept(tx, registrar(), explain), "TS409");
      const rejected = (await insertDraft(tx, registrar(), ORG_A, { task: "ropa_draft", target_type: "ropa_new", target_id: null, status: "rejected", output: null, rejection: "wording" })).rows[0]!.id;
      await expectError(accept(tx, registrar(), rejected), "TS409");
    });
  });
  it("only the decision changes: accepted keeps the person's text, discarded keeps none, no going back, no stamps", async () => {
    await inTransaction(client, async (tx) => {
      const id = (await ropaDraft(tx, registrar())).rows[0]!.id;
      await expectError(tx.as(registrar(), "UPDATE public.ai_drafts SET status = 'accepted' WHERE id = $1", [id]), "TS422");
      await expectError(tx.as(registrar(), "UPDATE public.ai_drafts SET status = 'discarded', accepted_output = '{}' WHERE id = $1", [id]), "TS422");
      await expectError(tx.as(registrar(), "UPDATE public.ai_drafts SET status = 'rejected' WHERE id = $1", [id]), "TS422");
      await expectError(accept(tx, registrar(), id, ["not", "an", "object"]), "23514");
      await expectError(tx.as(registrar(), "UPDATE public.ai_drafts SET decided_by = $2 WHERE id = $1", [id, SEED_USERS.muLegal.id]), "42501");
      await expectError(tx.as(registrar(), "UPDATE public.ai_drafts SET output = '{}' WHERE id = $1", [id]), "42501");
      await expectError(tx.asAdmin("UPDATE public.ai_drafts SET status = 'accepted', accepted_output = '{}', model = 'x' WHERE id = $1", [id]), "TS409");
      await accept(tx, registrar(), id);
      await expectError(tx.as(registrar(), "UPDATE public.ai_drafts SET accepted_output = '{\"name\":\"changed\"}' WHERE id = $1", [id]), "TS409");
      await expectError(tx.as(registrar(), "UPDATE public.ai_drafts SET status = 'draft', accepted_output = NULL WHERE id = $1", [id]), "TS409");
    });
  });
  it("is audited as `ai.draft.accepted` / `ai.draft.discarded`, as the person — never the text", async () => {
    await inTransaction(client, async (tx) => {
      const a = (await ropaDraft(tx, registrar())).rows[0]!.id;
      const d = (await ropaDraft(tx, registrar())).rows[0]!.id;
      await accept(tx, legal(), a);
      await discard(tx, registrar(), d);
      const { rows } = await tx.asAdmin<{ entity_id: string; event_type: string; user_id: string; metadata: Record<string, unknown> }>(
        "SELECT entity_id, event_type, user_id, metadata FROM public.audit_logs WHERE entity_id = ANY($1) AND event_type LIKE 'ai.draft.%' ORDER BY event_type",
        [[a, d]],
      );
      expect(rows.map((r) => [r.entity_id, r.event_type, r.user_id])).toEqual([
        [a, "ai.draft.accepted", SEED_USERS.muLegal.id],
        [d, "ai.draft.discarded", SEED_USERS.mumbaiUniversity.id],
      ]);
      expect(rows[0]!.metadata).toMatchObject({ task: "ropa_draft", targetType: "ropa_new", edited: true });
      expect(JSON.stringify(rows)).not.toMatch(/SECRET-(DRAFT|ACCEPTED)-TEXT/);
    });
  });
  it("Stage 2b: a notice or translation is decided with consent.write; a narrative with report.generate — not a register's other permissions", async () => {
    await inTransaction(client, async (tx) => {
      const notice = (await insertDraft(tx, registrar(), ORG_A, { task: "notice_draft", target_type: "notice_new", target_id: null, target_key: null, output: { draft: {} } })).rows[0]!.id;
      const translation = (await insertDraft(tx, registrar(), ORG_A, { task: "notice_translation_draft", target_type: "privacy_notice", target_id: randomUUID(), target_key: "hi", output: { draft: {} } })).rows[0]!.id;
      const narrative = (await insertDraft(tx, registrar(), ORG_A, { task: "report_narrative_draft", target_type: "report", target_id: randomUUID(), target_key: null, output: { draft: {} } })).rows[0]!.id;
      expect((await accept(tx, dean(), notice)).rowCount).toBe(0); // reads consent, cannot write it
      expect((await accept(tx, legal(), notice)).rowCount).toBe(1); // consent.write
      expect((await accept(tx, legal(), translation)).rowCount).toBe(1);
      expect((await accept(tx, legal(), narrative)).rowCount).toBe(0); // report.read, no report.generate
      expect((await accept(tx, registrar(), narrative)).rowCount).toBe(1); // report.generate
      expect((await row(tx, narrative)).decided_by).toBe(SEED_USERS.mumbaiUniversity.id);
    });
  });
  it("Gate 5: another organisation reads none of it", async () => {
    await inTransaction(client, async (tx) => {
      const id = (await ropaDraft(tx, registrar())).rows[0]!.id;
      await accept(tx, legal(), id);
      const { rows } = await tx.as<{ id: string }>(bmlOwner(), "SELECT id FROM public.ai_drafts WHERE id = $1", [id]);
      expect(rows).toHaveLength(0);
    });
  });
});
