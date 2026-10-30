/**
 * The black box, attacked the way an attacker would (D-070, D-071).
 *
 * The Supabase URL and anon key ship in every browser, so a signed-in client
 * can skip our API and call PostgREST directly with its own JWT. Before D-071
 * that read the whole question bank — all 20 packs, the drafts, the trigger
 * rules — and the provenance of its own snapshot. These tests make that
 * direct call, as a client, and require the DATABASE to refuse it. They also
 * check that every API response a client gets is allow-listed: no pack code,
 * no trigger reason, no overlay mapping.
 *
 * Read-only: nothing here writes.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { expect, test } from "@playwright/test";
import { accessTokenFor, bearer, SEED_ASSESSMENTS, SEED_ORGS, SEED_USERS, seedPassword } from "../helpers";

const MU = SEED_ORGS.mumbaiUniversity;
const MU_BASELINE = SEED_ASSESSMENTS.muBaseline.id;

/** Every role a client organisation can hold that we seed — none holds question.read_bank. */
const CLIENTS = [SEED_USERS.muDean, SEED_USERS.muAdmin, SEED_USERS.mumbaiUniversity, SEED_USERS.muDepartmentOwner, SEED_USERS.bmlAdmin];

/**
 * A fresh session per client. Signed out with `scope: "local"` ONLY: the
 * default sign-out is GLOBAL and revokes every session that user holds —
 * including the tokens other spec files cached, which then fail with 401.
 */
async function signedIn(email: string): Promise<SupabaseClient> {
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error } = await sb.auth.signInWithPassword({ email, password: seedPassword() });
  if (error) throw new Error(`sign-in failed for ${email}: ${error.message}`);
  return sb;
}

test.describe.configure({ mode: "serial" });

test("straight at PostgREST with a client's own JWT: the bank tables return nothing", async () => {
  for (const user of CLIENTS) {
    const sb = await signedIn(user.email);
    for (const table of ["question_packs", "questions", "question_versions"] as const) {
      const { data, error } = await sb.from(table).select("*").limit(5);
      expect(error, `${user.email} ${table}`).toBeNull();
      expect(data, `${user.email} ${table}`).toEqual([]);
    }
    // The domain weights are not secret: clients see them on every scorecard.
    const domains = await sb.from("dpdp_domains").select("code");
    expect(domains.data).toHaveLength(16);
    await sb.auth.signOut({ scope: "local" });
  }
});

test("straight at PostgREST: provenance columns are refused outright, the rest of the snapshot is readable", async () => {
  const sb = await signedIn(SEED_USERS.muDean.email);
  for (const [table, column] of [
    ["assessment_questions", "pack_code"],
    ["assessment_questions", "included_reason"],
    ["assessments", "pack_codes"],
    ["industries", "overlay_pack_code"],
  ] as const) {
    const { data, error } = await sb.from(table).select(column).limit(1);
    expect(data, `${table}.${column}`).toBeNull();
    expect(error?.code, `${table}.${column}`).toBe("42501");
  }
  const own = await sb.from("assessment_questions").select("question_code, question_text").eq("assessment_id", MU_BASELINE);
  expect(own.error).toBeNull();
  expect(own.data).toHaveLength(124);
  await sb.auth.signOut({ scope: "local" });
});

test("straight at the database functions: a client gets no provenance and no raw bank", async () => {
  for (const user of CLIENTS) {
    const sb = await signedIn(user.email);
    const provenance = await sb.rpc("assessment_provenance", { p_organization_id: MU.id, p_assessment_id: MU_BASELINE });
    expect(provenance.data, user.email).toBeNull();
    expect(provenance.error?.code, user.email).toBe("TS403");
    await sb.auth.signOut({ scope: "local" });
  }
  // A role that MAY generate gets approved packs only — never a draft, even when it names one.
  const owner = await signedIn(SEED_USERS.mumbaiUniversity.email);
  const bank = await owner.rpc("bank_for_generation", {
    p_organization_id: MU.id,
    p_pack_codes: ["EDTECH_OVERLAY_V1", "UNIVERSITY_REFERENCE_V1"],
  });
  expect(bank.error).toBeNull();
  expect((bank.data as { questions: unknown[] }).questions).toEqual([]);
  await owner.auth.signOut({ scope: "local" });
});

test("every API response a client gets is allow-listed: no pack code, trigger reason or overlay mapping", async ({
  request,
}) => {
  const token = await accessTokenFor(SEED_USERS.muAdmin.email);
  const bodies = await Promise.all(
    [
      request.get(`/api/v1/organizations/${MU.id}/assessments`, { headers: bearer(token) }),
      request.get(`/api/v1/organizations/${MU.id}/assessments/${MU_BASELINE}`, { headers: bearer(token) }),
      request.get(`/api/v1/organizations/${MU.id}/assessments/${MU_BASELINE}/questions`, { headers: bearer(token) }),
      request.get(`/api/v1/organizations/${MU.id}/scope`, { headers: bearer(token) }),
      request.post(`/api/v1/organizations/${MU.id}/scope/preview-assessment`, { headers: bearer(token) }),
      request.get("/api/v1/industries", { headers: bearer(token) }),
      request.get(`/api/v1/organizations/${MU.id}/dashboard`, { headers: bearer(token) }),
    ].map(async (p) => {
      const res = await p;
      expect(res.status()).toBe(200);
      return res.text();
    }),
  );
  for (const body of bodies) {
    expect(body).not.toMatch(/_V1"|"packCodes?"|"includedReason"|"overlayPackCode"|"questionPacks"|trigger:/);
  }
});

test("Anix staff still see provenance — through the database function, in their own tenant", async ({ request }) => {
  const token = await accessTokenFor(SEED_USERS.consultant.email);
  const { data } = await (
    await request.get(`/api/v1/organizations/${MU.id}/assessments/${MU_BASELINE}/questions`, { headers: bearer(token) })
  ).json();
  expect(data.assessment.packCodes).toContain("CORE_DPDP_V1");
  const g12 = data.questions.find((q: { questionCode: string }) => q.questionCode === "G1.2");
  expect(g12).toMatchObject({ packCode: "CORE_DPDP_V1", includedReason: "core" });
});
