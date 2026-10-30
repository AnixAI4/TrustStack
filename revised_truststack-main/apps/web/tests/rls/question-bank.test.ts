/**
 * Slice 3 — GATE 5 (RLS) for the question bank and assessments, plus the two
 * database-side rules that make a score defensible:
 *
 *   1. The bank is reference data. No user role may write it, at all.
 *   2. The snapshot is append-only, and only through the RPC. Editing the bank
 *      must not change an assessment that already exists.
 */
import { SEED_ASSESSMENTS, SEED_ORGS, SEED_USERS } from "@truststack/db/seed-data";
import type pg from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { authSubjects, connect, inTransaction } from "./db";

const ORG_A = SEED_ORGS.mumbaiUniversity.id;
const ORG_B = SEED_ORGS.bharatManufacturing.id;
const MU_BASELINE = SEED_ASSESSMENTS.muBaseline.id;

let client: pg.Client;
let who: Map<string, { sub: string; email: string }>;
const u = (id: string) => who.get(id)!;
const muAdmin = () => u(SEED_USERS.muAdmin.id);
const bmlAdmin = () => u(SEED_USERS.bmlAdmin.id);
const examDeptOwner = () => u(SEED_USERS.muDepartmentOwner.id);

beforeAll(async () => {
  client = await connect();
  who = await authSubjects(client, Object.values(SEED_USERS).map((x) => x.id));
});
afterAll(async () => {
  await client?.end();
});

const REFERENCE_TABLES = ["dpdp_domains", "question_packs", "questions", "question_versions"] as const;

describe("the bank is reference data: readable by every member, writable by nobody", () => {
  for (const table of REFERENCE_TABLES) {
    // Since D-071 the bank itself is Anix's view: only a holder of
    // `question.read_bank` reads it. The domain weights stay readable by all.
    it(`${table}: ${table === "dpdp_domains" ? "every member" : "only Anix staff (question.read_bank)"} can SELECT it`, async () => {
      await inTransaction(client, async (tx) => {
        const count = async (who: ReturnType<typeof u>) =>
          Number((await tx.as<{ n: string }>(who, `SELECT count(*) AS n FROM public.${table}`)).rows[0]!.n);
        expect(await count(u(SEED_USERS.consultant.id))).toBeGreaterThan(0);
        if (table === "dpdp_domains") {
          expect(await count(muAdmin())).toBeGreaterThan(0);
        } else {
          // RLS hides the rows: an Organisation Admin with every OTHER permission sees none.
          expect(await count(muAdmin())).toBe(0);
          expect(await count(u(SEED_USERS.muDean.id))).toBe(0);
          expect(await count(bmlAdmin())).toBe(0);
        }
      });
    });

    it(`${table}: anon cannot`, async () => {
      await inTransaction(client, async (tx) => {
        await expect(tx.as(null, `SELECT count(*) FROM public.${table}`)).rejects.toThrow(/permission denied/);
      });
    });
  }

  it("no INSERT, UPDATE or DELETE grant on any bank table, for any user role", async () => {
    await inTransaction(client, async (tx) => {
      const { rows } = await tx.asAdmin<{ table_name: string; privilege_type: string }>(
        `SELECT table_name, privilege_type FROM information_schema.role_table_grants
         WHERE table_schema = 'public' AND grantee IN ('anon', 'authenticated')
           AND table_name IN ('dpdp_domains','question_packs','questions','question_versions')
           AND privilege_type <> 'SELECT'`,
      );
      expect(rows).toEqual([]);
    });
  });

  it("a question version cannot be rewritten, even by an Organisation Admin with every permission", async () => {
    await inTransaction(client, async (tx) => {
      await expect(
        tx.as(muAdmin(), "UPDATE public.question_versions SET question_text = 'Forged' WHERE question_code = 'G1.2'"),
      ).rejects.toThrow(/permission denied/);
      await expect(
        tx.as(muAdmin(), "DELETE FROM public.question_versions WHERE question_code = 'G1.2'"),
      ).rejects.toThrow(/permission denied/);
      await expect(
        tx.as(muAdmin(), "UPDATE public.dpdp_domains SET weight = 99 WHERE code = 'GOV'"),
      ).rejects.toThrow(/permission denied/);
    });
  });
});

describe("the 100-point invariant is the database's, not only the application's", () => {
  /**
   * The trigger is DEFERRABLE INITIALLY DEFERRED, so it normally fires at
   * COMMIT — and this harness always rolls back. `SET CONSTRAINTS … IMMEDIATE`
   * runs the pending check there and then, which is how a rolled-back
   * transaction can still prove what a commit would have done.
   */
  const check = (tx: { asAdmin: (sql: string) => Promise<unknown> }) =>
    tx.asAdmin("SET CONSTRAINTS dpdp_domains_weight_total IMMEDIATE");

  it("a net change to the domain weights is refused, even as tooling", async () => {
    await inTransaction(client, async (tx) => {
      await tx.asAdmin("UPDATE public.dpdp_domains SET weight = weight + 1 WHERE code = 'GOV'");
      await expect(check(tx)).rejects.toThrow(/DOMAIN_WEIGHT_TOTAL_INVALID/);
    });
  });

  it("a compensating swap inside one transaction is allowed — the total is what matters", async () => {
    await inTransaction(client, async (tx) => {
      await tx.asAdmin("UPDATE public.dpdp_domains SET weight = weight + 1 WHERE code = 'GOV'");
      await tx.asAdmin("UPDATE public.dpdp_domains SET weight = weight - 1 WHERE code = 'INV'");
      await expect(check(tx)).resolves.toBeDefined();
      const { rows } = await tx.asAdmin<{ total: string }>("SELECT sum(weight) AS total FROM public.dpdp_domains");
      expect(Number(rows[0]!.total)).toBe(100);
    });
  });

  it("dropping a domain is refused — its weight cannot simply vanish", async () => {
    await inTransaction(client, async (tx) => {
      await tx.asAdmin("DELETE FROM public.question_versions WHERE domain_code = 'CROSSBORDER'");
      await tx.asAdmin("DELETE FROM public.dpdp_domains WHERE code = 'CROSSBORDER'");
      await expect(check(tx)).rejects.toThrow(/DOMAIN_WEIGHT_TOTAL_INVALID/);
    });
  });
});

describe("GATE 5 — Org A's JWT never reaches Org B's assessments", () => {
  it("assessments: a member sees only their own organisation's", async () => {
    await inTransaction(client, async (tx) => {
      const mine = await tx.as<{ organization_id: string }>(muAdmin(), "SELECT organization_id FROM public.assessments");
      expect(mine.rows.length).toBeGreaterThan(0);
      expect(mine.rows.every((r) => r.organization_id === ORG_A)).toBe(true);

      // Bharat Manufacturing has none seeded — it exercises the empty state.
      const theirs = await tx.as<{ organization_id: string }>(bmlAdmin(), "SELECT organization_id FROM public.assessments");
      expect(theirs.rows).toEqual([]);
    });
  });

  it("assessment_questions: the same, by assessment id as well as by organisation", async () => {
    await inTransaction(client, async (tx) => {
      const mine = await tx.as<{ n: string }>(
        muAdmin(),
        "SELECT count(*) AS n FROM public.assessment_questions WHERE assessment_id = $1",
        [MU_BASELINE],
      );
      expect(Number(mine.rows[0]!.n)).toBeGreaterThan(100);

      const theirs = await tx.as<{ n: string }>(
        bmlAdmin(),
        "SELECT count(*) AS n FROM public.assessment_questions WHERE assessment_id = $1",
        [MU_BASELINE],
      );
      expect(Number(theirs.rows[0]!.n)).toBe(0);
    });
  });

  it("anon sees nothing and can do nothing", async () => {
    await inTransaction(client, async (tx) => {
      await expect(tx.as(null, "SELECT count(*) FROM public.assessments")).rejects.toThrow(/permission denied/);
      await expect(tx.as(null, "SELECT count(*) FROM public.assessment_questions")).rejects.toThrow(/permission denied/);
    });
  });

  it("Org A cannot INSERT an assessment into Org B", async () => {
    await inTransaction(client, async (tx) => {
      await expect(
        tx.as(muAdmin(), "INSERT INTO public.assessments (organization_id, name) VALUES ($1, 'Forged')", [ORG_B]),
      ).rejects.toThrow(/row-level security/);
    });
  });

  it("Org B's admin cannot rename or delete Org A's assessment", async () => {
    await inTransaction(client, async (tx) => {
      const up = await tx.as(bmlAdmin(), "UPDATE public.assessments SET name = 'Forged' WHERE id = $1", [MU_BASELINE]);
      const del = await tx.as(bmlAdmin(), "DELETE FROM public.assessments WHERE id = $1", [MU_BASELINE]);
      expect(up.rowCount).toBe(0);
      expect(del.rowCount).toBe(0);
    });
  });

  it("the composite FK refuses an Org B question row against an Org A assessment, even as tooling", async () => {
    await inTransaction(client, async (tx) => {
      await expect(
        tx.asAdmin(
          `INSERT INTO public.assessment_questions
             (organization_id, assessment_id, question_code, question_version, question_text,
              domain_code, domain_weight, applicability, pack_code, sort_order, included_reason)
           VALUES ($1, $2, 'NOT-IN-THIS-SNAPSHOT', '1.0', 'Forged', 'GOV', 7, 'mandatory', 'CORE_DPDP_V1', 999, 'core')`,
          [ORG_B, MU_BASELINE],
        ),
      ).rejects.toThrow(/foreign key/);
    });
  });
});

describe("the snapshot is append-only", () => {
  it("no user role holds INSERT, UPDATE or DELETE on assessment_questions", async () => {
    await inTransaction(client, async (tx) => {
      // Since D-071 SELECT is granted per COLUMN (the provenance columns are
      // withheld), so no table-level grant of any kind remains.
      const table = await tx.asAdmin<{ privilege_type: string }>(
        `SELECT privilege_type FROM information_schema.role_table_grants
         WHERE table_schema = 'public' AND table_name = 'assessment_questions'
           AND grantee IN ('anon', 'authenticated')`,
      );
      expect(table.rows).toEqual([]);
      const columns = await tx.asAdmin<{ privilege_type: string }>(
        `SELECT DISTINCT privilege_type FROM information_schema.column_privileges
         WHERE table_schema = 'public' AND table_name = 'assessment_questions'
           AND grantee IN ('anon', 'authenticated')`,
      );
      expect(columns.rows.map((r) => r.privilege_type)).toEqual(["SELECT"]);
    });
  });

  it("a snapshot row cannot be edited by its own organisation's admin", async () => {
    await inTransaction(client, async (tx) => {
      await expect(
        tx.as(muAdmin(), "UPDATE public.assessment_questions SET question_text = 'Forged' WHERE assessment_id = $1", [
          MU_BASELINE,
        ]),
      ).rejects.toThrow(/permission denied/);
      await expect(
        tx.as(muAdmin(), "DELETE FROM public.assessment_questions WHERE assessment_id = $1", [MU_BASELINE]),
      ).rejects.toThrow(/permission denied/);
    });
  });
});

describe("SNAPSHOT IMMUTABILITY — editing the bank never rewrites history", () => {
  it("rewriting a question version's text leaves the existing snapshot untouched", async () => {
    await inTransaction(client, async (tx) => {
      const before = await tx.as<{ question_text: string; question_version: string }>(
        muAdmin(),
        "SELECT question_text, question_version FROM public.assessment_questions WHERE assessment_id = $1 AND question_code = 'G1.2'",
        [MU_BASELINE],
      );
      expect(before.rows).toHaveLength(1);
      const original = before.rows[0]!.question_text;
      expect(original).toContain("DPDP owner");

      // As TOOLING (no JWT) — the only thing that can touch the bank at all.
      await tx.asAdmin("UPDATE public.question_versions SET question_text = $1 WHERE question_code = 'G1.2'", [
        "REWRITTEN BY A LATER BANK EDIT",
      ]);
      const bank = await tx.asAdmin<{ question_text: string }>(
        "SELECT question_text FROM public.question_versions WHERE question_code = 'G1.2'",
      );
      expect(bank.rows[0]!.question_text).toBe("REWRITTEN BY A LATER BANK EDIT");

      const after = await tx.as<{ question_text: string }>(
        muAdmin(),
        "SELECT question_text FROM public.assessment_questions WHERE assessment_id = $1 AND question_code = 'G1.2'",
        [MU_BASELINE],
      );
      expect(after.rows[0]!.question_text).toBe(original);
    });
  });

  it("adding a v2 of a question leaves the snapshot pinned to the version it used", async () => {
    await inTransaction(client, async (tx) => {
      await tx.asAdmin(
        `INSERT INTO public.question_versions
           (question_code, version, question_text, domain_code, applicability, na_rule, status)
         SELECT 'G1.2', '2.0', 'A materially different v2 question', domain_code, applicability, na_rule, 'draft'
         FROM public.question_versions WHERE question_code = 'G1.2' AND version = '1.0'`,
      );
      await tx.asAdmin("UPDATE public.questions SET current_version = '2.0' WHERE code = 'G1.2'");

      const { rows } = await tx.as<{ question_version: string; question_text: string }>(
        muAdmin(),
        "SELECT question_version, question_text FROM public.assessment_questions WHERE assessment_id = $1 AND question_code = 'G1.2'",
        [MU_BASELINE],
      );
      expect(rows[0]!.question_version).toBe("1.0");
      expect(rows[0]!.question_text).not.toBe("A materially different v2 question");
    });
  });

  it("moving a domain's weight leaves the weight the snapshot recorded", async () => {
    await inTransaction(client, async (tx) => {
      const before = await tx.as<{ domain_weight: string }>(
        muAdmin(),
        "SELECT domain_weight FROM public.assessment_questions WHERE assessment_id = $1 AND domain_code = 'GOV' LIMIT 1",
        [MU_BASELINE],
      );
      expect(Number(before.rows[0]!.domain_weight)).toBe(7);

      await tx.asAdmin(
        `UPDATE public.dpdp_domains SET weight = 9 WHERE code = 'GOV';
         UPDATE public.dpdp_domains SET weight = 6 WHERE code = 'INV';`,
      );

      const after = await tx.as<{ domain_weight: string }>(
        muAdmin(),
        "SELECT domain_weight FROM public.assessment_questions WHERE assessment_id = $1 AND domain_code = 'GOV' LIMIT 1",
        [MU_BASELINE],
      );
      expect(Number(after.rows[0]!.domain_weight)).toBe(7);
    });
  });
});

describe("the generation RPC is the only write path, and it has its own locks", () => {
  const row = (code: string) => ({
    question_code: code,
    question_version: "1.0",
    question_text: `Row for ${code}`,
    domain_code: "GOV",
    domain_weight: 7,
    applicability: "mandatory",
    priority: null,
    evidence_guidance: null,
    suggested_owner: null,
    pack_code: "CORE_DPDP_V1",
    sort_order: 1,
    included_reason: "core",
  });

  it("writes the rows for a draft, and audits the generation once", async () => {
    await inTransaction(client, async (tx) => {
      // Since Slice 4 the seeded baseline holds an answer, which moved it to
      // in_progress (D-041). Take it back to a bare draft for this test.
      await tx.asAdmin("DELETE FROM public.assessment_responses WHERE assessment_id = $1", [MU_BASELINE]);
      await tx.asAdmin("UPDATE public.assessments SET status = 'draft' WHERE id = $1", [MU_BASELINE]);
      const { rows } = await tx.as<{ set_assessment_questions: number }>(
        muAdmin(),
        "SELECT public.set_assessment_questions($1, $2, $3::jsonb)",
        [ORG_A, MU_BASELINE, JSON.stringify([row("G1.1"), row("G1.2")])],
      );
      expect(rows[0]!.set_assessment_questions).toBe(2);

      const audit = await tx.as<{ n: string; metadata: { questionCount: number } }>(
        muAdmin(),
        `SELECT count(*) AS n, min(metadata::text)::jsonb AS metadata FROM public.audit_logs
         WHERE entity_id = $1 AND event_type = 'assessment.questions.generated'`,
        [MU_BASELINE],
      );
      expect(Number(audit.rows[0]!.n)).toBe(1);
      expect(audit.rows[0]!.metadata.questionCount).toBe(2);
    });
  });

  it("refuses a caller without assessment.write", async () => {
    await inTransaction(client, async (tx) => {
      // A Department Owner contributes answers; it does not own the assessment.
      await expect(
        tx.as(examDeptOwner(), "SELECT public.set_assessment_questions($1, $2, $3::jsonb)", [
          ORG_A,
          MU_BASELINE,
          JSON.stringify([row("G1.1")]),
        ]),
      ).rejects.toThrow(/do not have permission/);
    });
  });

  it("refuses another organisation's assessment", async () => {
    await inTransaction(client, async (tx) => {
      await expect(
        tx.as(bmlAdmin(), "SELECT public.set_assessment_questions($1, $2, $3::jsonb)", [
          ORG_B,
          MU_BASELINE,
          JSON.stringify([row("G1.1")]),
        ]),
      ).rejects.toThrow(/not found/i);
      // And it cannot borrow Org A's id either.
      await expect(
        tx.as(bmlAdmin(), "SELECT public.set_assessment_questions($1, $2, $3::jsonb)", [
          ORG_A,
          MU_BASELINE,
          JSON.stringify([row("G1.1")]),
        ]),
      ).rejects.toThrow(/do not have permission/);
    });
  });

  it("refuses anything but a draft — a submitted question set is frozen", async () => {
    await inTransaction(client, async (tx) => {
      await tx.asAdmin("UPDATE public.assessments SET status = 'submitted' WHERE id = $1", [MU_BASELINE]);
      await expect(
        tx.as(muAdmin(), "SELECT public.set_assessment_questions($1, $2, $3::jsonb)", [
          ORG_A,
          MU_BASELINE,
          JSON.stringify([row("G1.1")]),
        ]),
      ).rejects.toThrow(/Only a draft assessment can be regenerated/);
    });
  });

  it("refuses an anonymous caller", async () => {
    await inTransaction(client, async (tx) => {
      await expect(
        tx.as(null, "SELECT public.set_assessment_questions($1, $2, '[]'::jsonb)", [ORG_A, MU_BASELINE]),
      ).rejects.toThrow(/permission denied|Sign in/);
    });
  });
});

describe("audit — the assessment itself (gate 8)", () => {
  it("creating and renaming an assessment is audited in the same transaction", async () => {
    await inTransaction(client, async (tx) => {
      const created = await tx.as<{ id: string }>(
        muAdmin(),
        "INSERT INTO public.assessments (organization_id, name) VALUES ($1, 'RLS audit probe') RETURNING id",
        [ORG_A],
      );
      const id = created.rows[0]!.id;

      const onInsert = await tx.as<{ event_type: string; user_id: string }>(
        muAdmin(),
        "SELECT event_type, user_id FROM public.audit_logs WHERE entity_id = $1",
        [id],
      );
      expect(onInsert.rows.map((r) => r.event_type)).toEqual(["assessment.assessments.insert"]);
      expect(onInsert.rows[0]!.user_id).toBe(SEED_USERS.muAdmin.id);

      await tx.as(muAdmin(), "UPDATE public.assessments SET name = 'Renamed probe' WHERE id = $1", [id]);
      const afterUpdate = await tx.as<{ event_type: string; metadata: { changed: string[] } }>(
        muAdmin(),
        "SELECT event_type, metadata FROM public.audit_logs WHERE entity_id = $1 ORDER BY created_at, event_type",
        [id],
      );
      expect(afterUpdate.rows.map((r) => r.event_type)).toContain("assessment.assessments.update");
      const update = afterUpdate.rows.find((r) => r.event_type === "assessment.assessments.update")!;
      expect(update.metadata.changed).toEqual(["name"]);
    });
  });

  it("a no-op save is not an event", async () => {
    await inTransaction(client, async (tx) => {
      const before = await tx.as<{ n: string }>(
        muAdmin(),
        "SELECT count(*) AS n FROM public.audit_logs WHERE entity_id = $1",
        [MU_BASELINE],
      );
      await tx.as(muAdmin(), "UPDATE public.assessments SET name = name WHERE id = $1", [MU_BASELINE]);
      const after = await tx.as<{ n: string }>(
        muAdmin(),
        "SELECT count(*) AS n FROM public.audit_logs WHERE entity_id = $1",
        [MU_BASELINE],
      );
      expect(after.rows[0]!.n).toBe(before.rows[0]!.n);
    });
  });

  it("the Slice 2 scope events keep their own prefix — the shared trigger did not rename them", async () => {
    await inTransaction(client, async (tx) => {
      await tx.as(muAdmin(), "INSERT INTO public.departments (organization_id, name) VALUES ($1, 'Prefix probe')", [
        ORG_A,
      ]);
      const { rows } = await tx.as<{ event_type: string }>(
        muAdmin(),
        "SELECT event_type FROM public.audit_logs WHERE event_type LIKE 'scope.departments.%' ORDER BY created_at DESC LIMIT 1",
      );
      expect(rows[0]!.event_type).toBe("scope.departments.insert");
    });
  });

  it("tooling is not a user action, so it is not audited", async () => {
    await inTransaction(client, async (tx) => {
      const created = await tx.asAdmin<{ id: string }>(
        "INSERT INTO public.assessments (organization_id, name) VALUES ($1, 'Tooling probe') RETURNING id",
        [ORG_A],
      );
      const { rows } = await tx.asAdmin<{ n: string }>(
        "SELECT count(*) AS n FROM public.audit_logs WHERE entity_id = $1",
        [created.rows[0]!.id],
      );
      expect(Number(rows[0]!.n)).toBe(0);
    });
  });
});

describe("a finalised assessment is evidence, not a draft", () => {
  it("cannot be deleted, even by the organisation that owns it", async () => {
    await inTransaction(client, async (tx) => {
      await tx.asAdmin("UPDATE public.assessments SET status = 'finalised' WHERE id = $1", [MU_BASELINE]);
      const del = await tx.as(muAdmin(), "DELETE FROM public.assessments WHERE id = $1", [MU_BASELINE]);
      expect(del.rowCount).toBe(0);
    });
  });

  it("a draft can be", async () => {
    await inTransaction(client, async (tx) => {
      const created = await tx.as<{ id: string }>(
        muAdmin(),
        "INSERT INTO public.assessments (organization_id, name) VALUES ($1, 'Deletable draft') RETURNING id",
        [ORG_A],
      );
      const del = await tx.as(muAdmin(), "DELETE FROM public.assessments WHERE id = $1", [created.rows[0]!.id]);
      expect(del.rowCount).toBe(1);
    });
  });
});

describe("the vendor gate is a column, not an inference (D-037)", () => {
  it("defaults to unknown, so an organisation that has answered nothing still gets the domain", async () => {
    await inTransaction(client, async (tx) => {
      const { rows } = await tx.asAdmin<{ uses_data_processors: string }>(
        `INSERT INTO public.organizations (name, organization_type, industry_code)
         VALUES ('Gate probe', 'company', 'general') RETURNING id`,
      );
      const orgId = (rows[0] as unknown as { id: string }).id;
      const scope = await tx.asAdmin<{ uses_data_processors: string }>(
        "INSERT INTO public.organization_scopes (organization_id) VALUES ($1) RETURNING uses_data_processors",
        [orgId],
      );
      expect(scope.rows[0]!.uses_data_processors).toBe("unknown");
    });
  });

  it("rejects anything but the tri-state vocabulary", async () => {
    await inTransaction(client, async (tx) => {
      await expect(
        tx.asAdmin("UPDATE public.organization_scopes SET uses_data_processors = 'maybe' WHERE organization_id = $1", [
          ORG_A,
        ]),
      ).rejects.toThrow(/uses_data_processors_check/);
    });
  });

  it("the migration recorded 'yes' for organisations whose register already proves it", async () => {
    await inTransaction(client, async (tx) => {
      const { rows } = await tx.as<{ uses_data_processors: string }>(
        muAdmin(),
        "SELECT uses_data_processors FROM public.organization_scopes WHERE organization_id = $1",
        [ORG_A],
      );
      expect(rows[0]!.uses_data_processors).toBe("yes");
    });
  });
});

// ---------------------------------------------------------------------------
// Slice 8 — the black box (D-040, D-068)
// ---------------------------------------------------------------------------
// The bank tables stay readable by every member — generating an assessment
// reads them as the caller (D-033) — so the black box is not a policy on the
// bank. It rests on two database facts the API relies on: only Anix roles
// hold `question.read_bank`, and the list of packs a CLIENT may browse comes
// from its own assessments, which RLS confines to its own tenant.

describe("the black box: who may see the whole bank, and what a client's pack list is built from", () => {
  it("question.read_bank is held by the Super Admin and the Consultant, in both tenants, and by no client role", async () => {
    const { rows } = await client.query<{ code: string }>(
      `SELECT r.code FROM public.role_permissions rp
       JOIN public.roles r ON r.id = rp.role_id JOIN public.permissions p ON p.id = rp.permission_id
       WHERE p.code = 'question.read_bank' ORDER BY r.code`,
    );
    expect(rows.map((r) => r.code)).toEqual(["consultant", "super_admin"]);

    await inTransaction(client, async (tx) => {
      const has = async (userId: string, org: string) =>
        (await tx.as<{ ok: boolean }>(u(userId), "SELECT app.has_permission($1, 'question.read_bank') AS ok", [org])).rows[0]!
          .ok;
      expect(await has(SEED_USERS.consultant.id, ORG_A)).toBe(true);
      expect(await has(SEED_USERS.consultant.id, ORG_B)).toBe(true);
      for (const client of [
        SEED_USERS.muAdmin, SEED_USERS.muDean, SEED_USERS.mumbaiUniversity, SEED_USERS.muDepartmentOwner,
        SEED_USERS.muLegal, SEED_USERS.muItSecurity,
      ]) {
        expect(await has(client.id, ORG_A), client.email).toBe(false);
      }
      expect(await has(SEED_USERS.bmlAdmin.id, ORG_B)).toBe(false);
    });
  });

  it("provenance is withheld by COLUMN privilege: no signed-in role reads pack codes or trigger reasons directly", async () => {
    for (const who of [SEED_USERS.muDean.id, SEED_USERS.muAdmin.id, SEED_USERS.consultant.id]) {
      for (const sql of [
        "SELECT pack_code FROM public.assessment_questions LIMIT 1",
        "SELECT included_reason FROM public.assessment_questions LIMIT 1",
        "SELECT * FROM public.assessment_questions LIMIT 1",
        "SELECT pack_codes FROM public.assessments LIMIT 1",
        "SELECT overlay_pack_code FROM public.industries LIMIT 1",
      ]) {
        await inTransaction(client, async (tx) => {
          await expect(tx.as(u(who), sql), `${who}: ${sql}`).rejects.toThrow(/permission denied/);
        });
      }
    }
    // The rest of the snapshot is still the member's to read.
    await inTransaction(client, async (tx) => {
      const { rows } = await tx.as<{ n: string }>(
        u(SEED_USERS.muDean.id),
        "SELECT count(question_text) AS n FROM public.assessment_questions WHERE assessment_id = $1",
        [MU_BASELINE],
      );
      expect(Number(rows[0]!.n)).toBe(124);
    });
  });

  it("assessment_provenance: Anix staff in THAT organisation only", async () => {
    await inTransaction(client, async (tx) => {
      const call = "SELECT public.assessment_provenance($1, $2) AS p";
      const { rows } = await tx.as<{ p: { assessments: Record<string, string[]>; questions: { pack_code: string; included_reason: string }[] } }>(
        u(SEED_USERS.consultant.id),
        call,
        [ORG_A, MU_BASELINE],
      );
      expect(rows[0]!.p.assessments[MU_BASELINE]).toContain("CORE_DPDP_V1");
      expect(rows[0]!.p.questions).toHaveLength(124);
      expect(rows[0]!.p.questions.some((q) => q.included_reason.startsWith("trigger:"))).toBe(true);

      for (const client of [SEED_USERS.muDean.id, SEED_USERS.muAdmin.id, SEED_USERS.mumbaiUniversity.id]) {
        await expect(tx.as(u(client), call, [ORG_A, MU_BASELINE]), client).rejects.toMatchObject({ code: "TS403" });
      }
      // GATE 5: BML's admin, aimed at MU.
      await expect(tx.as(bmlAdmin(), call, [ORG_A, MU_BASELINE])).rejects.toMatchObject({ code: "TS403" });
    });
  });

  it("bank_for_generation: a role that may generate gets approved packs only — never a draft or the reference pool", async () => {
    await inTransaction(client, async (tx) => {
      const call = "SELECT public.bank_for_generation($1, $2) AS b";
      type Bank = { b: { packs: { code: string; status: string }[]; questions: { pack_code: string; trigger_text: string | null }[] } };
      const { rows } = await tx.as<Bank>(u(SEED_USERS.mumbaiUniversity.id), call, [
        ORG_A,
        ["CORE_DPDP_V1", "UNIVERSITY_HIGHER_ED_V1", "EDTECH_OVERLAY_V1", "UNIVERSITY_REFERENCE_V1"],
      ]);
      const byPack = new Set(rows[0]!.b.questions.map((q) => q.pack_code));
      expect(byPack).toEqual(new Set(["CORE_DPDP_V1", "UNIVERSITY_HIGHER_ED_V1"]));
      expect(rows[0]!.b.questions.filter((q) => q.pack_code === "CORE_DPDP_V1")).toHaveLength(98);
      // Pack metadata only for the codes the caller named.
      expect(rows[0]!.b.packs.map((p) => p.code).sort()).toEqual(
        ["CORE_DPDP_V1", "EDTECH_OVERLAY_V1", "UNIVERSITY_HIGHER_ED_V1", "UNIVERSITY_REFERENCE_V1"],
      );

      // A role that may not generate, and a tenant that is not yours.
      await expect(tx.as(u(SEED_USERS.muDean.id), call, [ORG_A, ["CORE_DPDP_V1"]])).rejects.toMatchObject({ code: "TS403" });
      await expect(tx.as(examDeptOwner(), call, [ORG_A, ["CORE_DPDP_V1"]])).rejects.toMatchObject({ code: "TS403" });
      await expect(tx.as(u(SEED_USERS.mumbaiUniversity.id), call, [ORG_B, ["CORE_DPDP_V1"]])).rejects.toMatchObject({
        code: "TS403",
      });
      await expect(tx.as(null, call, [ORG_A, ["CORE_DPDP_V1"]])).rejects.toThrow(/permission denied/);
    });
  });

  it("an org admin cannot mint a consultant — the role carries a permission the admin does not hold", async () => {
    await inTransaction(client, async (tx) => {
      await expect(
        tx.as(muAdmin(), "SELECT * FROM public.create_organization_invite($1, $2, $3, $4)", [
          ORG_A,
          "would-be-consultant@example.com",
          "consultant",
          "0".repeat(64),
        ]),
      ).rejects.toMatchObject({ code: "TS403" });
    });
  });
});
