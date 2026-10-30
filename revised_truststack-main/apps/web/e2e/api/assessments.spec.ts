/**
 * Slice 3 API behaviour.
 *
 * Playwright runs spec FILES in parallel against ONE database (Slice 2 pitfall
 * 9), so anything that depends on a tenant's SCOPE gets its own tenant: the
 * Slice 2 spec already owns Bharat Manufacturing's scope and re-saves it, which
 * would silently un-stale a scope this file had just made stale.
 *
 * Reads of Mumbai University's seeded baseline are safe — nothing here writes
 * MU's scope, and the UI spec only generates new assessments from it.
 */
import { expect, test, type APIRequestContext } from "@playwright/test";
import { describeTrigger, mapTriggerText } from "@truststack/core";
import {
  accessTokenFor, bearer, createE2eTenant, removeE2eTenant, SEED_ASSESSMENTS, SEED_ORGS, SEED_USERS, withDb,
} from "../helpers";

/** The expression the core pack's "vendors exist" phrase maps to (D-037). */
const VENDORS_EXIST = `trigger:${describeTrigger(mapTriggerText("vendors exist")!)}`;

const MU = SEED_ORGS.mumbaiUniversity;
const MU_BASELINE = SEED_ASSESSMENTS.muBaseline.id;
const base = (orgId: string) => `/api/v1/organizations/${orgId}`;
const NAME_PREFIX = "E2E API assessment";

/**
 * This file's own tenant and its own member, for everything that touches a
 * SCOPE. It cannot share Bharat Manufacturing (the Slice 2 spec re-saves that
 * scope) and it cannot borrow a seeded user (the Slice 1 spec asserts exactly
 * which organisations the consultant belongs to). `general` industry, whose
 * overlay is still draft, so its assessments are core questions only.
 */
const OWN_TENANT = {
  organizationId: "0b0000ff-0000-4000-8000-00000000a003",
  name: "E2E API Slice 3 Tenant",
  industryCode: "general",
  dataPrincipalCountEstimate: 4000,
  // MU's IT/Security user: no other spec asserts its memberships, and it holds
  // organization_admin HERE, which carries assessment.write.
  member: { userId: SEED_USERS.muItSecurity.id, email: SEED_USERS.muItSecurity.email },
  roleCode: "organization_admin",
};

test.describe.configure({ mode: "serial" });

test.beforeAll(async () => {
  await createE2eTenant(OWN_TENANT);
});

test.afterAll(async () => {
  await withDb((db) => db.query("DELETE FROM public.assessments WHERE name LIKE $1", [`${NAME_PREFIX}%`]));
  await removeE2eTenant(OWN_TENANT);
});

/** This tenant's Organisation Admin — the role that carries assessment.write. */
const ownToken = () => accessTokenFor(OWN_TENANT.member.email);

async function saveOwnScope(
  request: APIRequestContext,
  token: string,
  usesDataProcessors: "yes" | "no" | "unknown" = "no",
) {
  const res = await request.put(`${base(OWN_TENANT.organizationId)}/scope`, {
    headers: bearer(token),
    data: {
      industryCode: "general",
      dataPrincipalCountEstimate: 4000,
      answers: {
        childrenData: "no", usesDataProcessors, aiUsageTypes: [], marketingTracking: "no",
        crossBorder: "no", multiLocation: false, publicFacingPortal: "no", sensitiveDocuments: "no",
      },
    },
  });
  expect(res.status(), await res.text()).toBe(200);
}

const uniqueName = (label: string) => `${NAME_PREFIX} ${label} ${Date.now()}`;

async function createAssessment(request: APIRequestContext, token: string, orgId: string, label: string) {
  return request.post(`${base(orgId)}/assessments`, {
    headers: bearer(token),
    data: { name: uniqueName(label) },
  });
}

// ---------------------------------------------------------------------------
// The bank
// ---------------------------------------------------------------------------

test("GET /dpdp-domains returns 16 domains whose weights total exactly 100", async ({ request }) => {
  const token = await accessTokenFor(SEED_USERS.muDean.email);
  const res = await request.get("/api/v1/dpdp-domains", { headers: bearer(token) });
  expect(res.status()).toBe(200);
  const { data } = await res.json();

  expect(data.domains).toHaveLength(16);
  expect(data.weightTotal).toBe(100);
  expect(data.domains.map((d: { domainId: string }) => d.domainId)).toEqual(
    Array.from({ length: 16 }, (_, i) => `D${String(i + 1).padStart(2, "0")}`),
  );
  // Config's own numbers, not Question_Bank's stale 104-point column (D-006).
  const security = data.domains.find((d: { code: string }) => d.code === "SECURITY");
  expect(security.weight).toBe(10);
});

test("GET /question-packs lists all 20 packs, with counts, tiers and statuses, to Anix staff", async ({ request }) => {
  const token = await accessTokenFor(SEED_USERS.consultant.email);
  const { data } = await (await request.get("/api/v1/question-packs", { headers: bearer(token) })).json();

  expect(data.packs).toHaveLength(20);
  const byCode = new Map(data.packs.map((p: { code: string }) => [p.code, p]));
  expect(byCode.get("CORE_DPDP_V1")).toMatchObject({ tier: "core", status: "approved", questionCount: 98 });
  // The confirmed 10 (D-029.1) — 98 + 10 is the 108 the PRD and proposal quote.
  expect(byCode.get("UNIVERSITY_HIGHER_ED_V1")).toMatchObject({ tier: "overlay", status: "approved", questionCount: 10 });
  expect(byCode.get("UNIVERSITY_REFERENCE_V1")).toMatchObject({ tier: "reference", questionCount: 78 });
  // Authored but not yet through its own overlap exercise.
  expect(byCode.get("EDTECH_OVERLAY_V1")).toMatchObject({ status: "draft", questionCount: 162 });
  expect(byCode.get("CHILDREN_DATA_V1")).toMatchObject({ questionCount: 0 });

  const total = data.packs.reduce((n: number, p: { questionCount: number }) => n + p.questionCount, 0);
  expect(total).toBe(1527);
});

test("GET /question-packs/{code}/questions never invents a priority or a legal basis", async ({ request }) => {
  const token = await accessTokenFor(SEED_USERS.consultant.email);
  const { data } = await (
    await request.get("/api/v1/question-packs/SAAS_TECH_OVERLAY_V1/questions", { headers: bearer(token) })
  ).json();

  expect(data.questionCount).toBe(156);
  // The SaaS file has no Priority column at all.
  expect(data.questions.every((q: { priority: string | null }) => q.priority === null)).toBe(true);
  expect(data.questions.every((q: { legalControlBasis: string | null }) => q.legalControlBasis === null)).toBe(true);
});

test("GET /question-packs/{code}/questions 404s on an unknown pack", async ({ request }) => {
  const token = await accessTokenFor(SEED_USERS.consultant.email);
  const res = await request.get("/api/v1/question-packs/NOT_A_PACK/questions", { headers: bearer(token) });
  expect(res.status()).toBe(404);
  expect((await res.json()).error.code).toBe("NOT_FOUND");
});

// --- The black box (D-068, D-071) ---------------------------------------------

test("the bank routes are Anix's view: every client role is refused, whatever it holds", async ({ request }) => {
  for (const user of [SEED_USERS.muDean, SEED_USERS.muAdmin, SEED_USERS.mumbaiUniversity, SEED_USERS.bmlAdmin]) {
    const token = await accessTokenFor(user.email);
    for (const url of ["/api/v1/question-packs", "/api/v1/question-packs/CORE_DPDP_V1/questions"]) {
      const res = await request.get(url, { headers: bearer(token) });
      expect(res.status(), `${user.email} ${url}`).toBe(403);
      expect((await res.json()).error.code).toBe("FORBIDDEN");
    }
  }
});

// ---------------------------------------------------------------------------
// Mumbai University's seeded baseline
// ---------------------------------------------------------------------------

test("MU's baseline is 98 core + the 10 confirmed overlay questions, plus what its scope triggers", async ({
  request,
}) => {
  // Which pack a question came from is Anix's view (D-071).
  const token = await accessTokenFor(SEED_USERS.consultant.email);
  const { data } = await (
    await request.get(`${base(MU.id)}/assessments/${MU_BASELINE}/questions`, { headers: bearer(token) })
  ).json();

  const byPack = new Map<string, number>();
  for (const q of data.questions) byPack.set(q.packCode, (byPack.get(q.packCode) ?? 0) + 1);

  expect(byPack.get("CORE_DPDP_V1")).toBe(98);
  expect(byPack.get("UNIVERSITY_HIGHER_ED_V1")).toBe(10);
  // MU's scope reports proctoring, so the proctoring pack is selected too.
  expect(byPack.get("UNIVERSITY_AI_PROCTORING_V1")).toBe(1);
  expect(byPack.get("UNIVERSITY_REFERENCE_V1")).toBeUndefined();
  expect(data.questions).toHaveLength(124);

  // All 16 domains, and the weights still total 100 whatever the overlay added.
  expect(data.domains).toHaveLength(16);
  expect(data.domains.reduce((n: number, d: { weight: number }) => n + d.weight, 0)).toBe(100);
});

test("a client reads its own questions but never where they came from (D-071)", async ({ request }) => {
  const token = await accessTokenFor(SEED_USERS.muDean.email);
  const { data } = await (
    await request.get(`${base(MU.id)}/assessments/${MU_BASELINE}/questions`, { headers: bearer(token) })
  ).json();
  expect(data.questions).toHaveLength(124);
  expect(data.assessment).not.toHaveProperty("packCodes");
  for (const q of data.questions) {
    expect(q).not.toHaveProperty("packCode");
    expect(q).not.toHaveProperty("includedReason");
  }
  const list = await (await request.get(`${base(MU.id)}/assessments`, { headers: bearer(token) })).json();
  for (const a of list.data.assessments) expect(a).not.toHaveProperty("packCodes");
});

test("every question in MU's baseline says why it is there — to Anix staff", async ({ request }) => {
  const token = await accessTokenFor(SEED_USERS.consultant.email);
  const { data } = await (
    await request.get(`${base(MU.id)}/assessments/${MU_BASELINE}/questions`, { headers: bearer(token) })
  ).json();

  for (const q of data.questions) {
    expect(
      q.includedReason === "core" ||
        q.includedReason === "overlay" ||
        q.includedReason === "potentially_applicable" ||
        q.includedReason.startsWith("trigger:"),
      `${q.questionCode} → ${q.includedReason}`,
    ).toBe(true);
  }

  const find = (code: string) => data.questions.find((q: { questionCode: string }) => q.questionCode === code);
  // The core pack's vendor questions fire on a real trigger, not "mandatory".
  expect(find("V1.1").includedReason).toBe(VENDORS_EXIST);
  // A confirmed overlay question with an evaluable condition.
  expect(find("UNI-AI-003").includedReason).toBe("trigger:aiUsageTypes contains proctoring");
  // A condition the wizard cannot capture is SHOWN, not hidden (D-029.3).
  expect(find("UNI-INV-004").applicability).toBe("potentially_applicable");
  expect(find("UNI-INV-004").includedReason).toBe("potentially_applicable");
  // Excluded on purpose: MU records no research participants.
  expect(find("UNI-ROPA-007")).toBeUndefined();
});

test("a question's snapshot row carries a copy of the text, not a reference", async ({ request }) => {
  const token = await accessTokenFor(SEED_USERS.muDean.email);
  const snapshot = await (
    await request.get(`${base(MU.id)}/assessments/${MU_BASELINE}/questions`, { headers: bearer(token) })
  ).json();
  // The bank's own record, with its version, is Anix's view (D-068).
  const bank = await (
    await request.get("/api/v1/question-packs/CORE_DPDP_V1/questions", {
      headers: bearer(await accessTokenFor(SEED_USERS.consultant.email)),
    })
  ).json();

  const snapshotRow = snapshot.data.questions.find((q: { questionCode: string }) => q.questionCode === "G1.2");
  const bankRow = bank.data.questions.find((q: { questionCode: string }) => q.questionCode === "G1.2");
  expect(snapshotRow.questionText).toBe(bankRow.questionText);
  expect(snapshotRow.questionVersion).toBe(bankRow.version);
  expect(snapshotRow.domainWeight).toBe(7);
});

// ---------------------------------------------------------------------------
// Generating
// ---------------------------------------------------------------------------

test("a consultant generates an assessment, and it lands with a question set", async ({ request }) => {
  const token = await accessTokenFor(SEED_USERS.consultant.email);
  const res = await createAssessment(request, token, MU.id, "consultant");
  expect(res.status()).toBe(201);
  const { data } = await res.json();

  expect(data.assessment.status).toBe("draft");
  expect(data.assessment.assessmentType).toBe("baseline");
  expect(data.assessment.questionCount).toBe(124);
  expect(data.generation.questionCount).toBe(124);
  expect(data.assessment.packCodes).toEqual([
    "CORE_DPDP_V1", "UNIVERSITY_HIGHER_ED_V1", "UNIVERSITY_CONDITIONAL_V1", "UNIVERSITY_AI_PROCTORING_V1",
  ]);

  // The scope it was built from is snapshotted onto the assessment.
  expect(data.assessment.industryCode).toBe("university");
  expect(data.assessment.riskTags).toContain("large_scale_processing");
  expect(data.assessment.scopeDerivedAt).not.toBeNull();

  // The six cross-industry packs are selected but have no authored questions.
  expect(data.generation.skippedPacks.map((p: { code: string }) => p.code)).toEqual([
    "CHILDREN_DATA_V1", "VENDOR_PROCESSOR_V1", "CLOUD_CROSSBORDER_V1",
    "AI_RISK_V1", "MARKETING_TRACKING_V1", "SDF_READINESS_V1",
  ]);
  expect(data.generation.triggerCoverage.unresolved).toBeGreaterThan(0);
  expect(data.generation.triggerCoverage.unresolvedPhrases).toContain("placements");
});

test("generating twice gives the same question set — generation is deterministic", async ({ request }) => {
  const token = await accessTokenFor(SEED_USERS.consultant.email);
  const created = await (await createAssessment(request, token, MU.id, "determinism")).json();
  const id = created.data.assessment.id;

  const first = await (
    await request.get(`${base(MU.id)}/assessments/${id}/questions`, { headers: bearer(token) })
  ).json();
  const again = await request.post(`${base(MU.id)}/assessments/${id}/generate-questions`, { headers: bearer(token) });
  expect(again.status()).toBe(200);
  const second = await (
    await request.get(`${base(MU.id)}/assessments/${id}/questions`, { headers: bearer(token) })
  ).json();

  expect(second.data.questions).toEqual(first.data.questions);
});

test("regeneration replaces the snapshot rather than appending to it", async ({ request }) => {
  const token = await accessTokenFor(SEED_USERS.consultant.email);
  const created = await (await createAssessment(request, token, MU.id, "replace")).json();
  const id = created.data.assessment.id;

  await request.post(`${base(MU.id)}/assessments/${id}/generate-questions`, { headers: bearer(token) });
  const { data } = await (
    await request.get(`${base(MU.id)}/assessments/${id}/questions`, { headers: bearer(token) })
  ).json();

  expect(data.questions).toHaveLength(124);
  const codes = data.questions.map((q: { questionCode: string }) => q.questionCode);
  expect(new Set(codes).size).toBe(codes.length);
  expect(data.questions.map((q: { sortOrder: number }) => q.sortOrder)).toEqual(
    Array.from({ length: 124 }, (_, i) => i + 1),
  );
});

test("generating is audited once, not once per question", async ({ request }) => {
  const token = await accessTokenFor(SEED_USERS.consultant.email);
  const created = await (await createAssessment(request, token, MU.id, "audit")).json();
  const id = created.data.assessment.id;

  const events = await withDb(async (db) => {
    const { rows } = await db.query<{ event_type: string; metadata: { questionCount: number } }>(
      "SELECT event_type, metadata FROM public.audit_logs WHERE entity_id = $1 ORDER BY created_at",
      [id],
    );
    return rows;
  });

  expect(events.map((e) => e.event_type)).toEqual([
    "assessment.assessments.insert",
    "assessment.questions.generated",
    "assessment.assessments.update",
  ]);
  expect(events[1]!.metadata.questionCount).toBe(124);
});

test("a Department Owner may read an assessment but not generate one", async ({ request }) => {
  const token = await accessTokenFor(SEED_USERS.muDepartmentOwner.email);

  const read = await request.get(`${base(MU.id)}/assessments/${MU_BASELINE}`, { headers: bearer(token) });
  expect(read.status()).toBe(200);

  const create = await createAssessment(request, token, MU.id, "dept-owner");
  expect(create.status()).toBe(403);
  expect((await create.json()).error.code).toBe("FORBIDDEN");

  const regenerate = await request.post(`${base(MU.id)}/assessments/${MU_BASELINE}/generate-questions`, {
    headers: bearer(token),
  });
  expect(regenerate.status()).toBe(403);
});

test("generating before the scope is saved at all is refused with 409", async ({ request }) => {
  const token = await ownToken();
  const res = await createAssessment(request, token, OWN_TENANT.organizationId, "no-scope");
  expect(res.status()).toBe(409);
  const body = await res.json();
  expect(body.error.code).toBe("CONFLICT");
  expect(body.error.message).toMatch(/Save the scope before generating/);

  // Compensated: no orphan row (D-027.4).
  const list = await (await request.get(`${base(OWN_TENANT.organizationId)}/assessments`, { headers: bearer(token) })).json();
  expect(list.data.assessments).toEqual([]);
});

test("a DOCUMENTED 'no processors' scopes the Vendor domain out — 92 of the 98 core questions", async ({
  request,
}) => {
  const token = await ownToken();
  await saveOwnScope(request, token, "no");

  const res = await createAssessment(request, token, OWN_TENANT.organizationId, "core-only");
  expect(res.status(), await res.text()).toBe(201);
  const { data } = await res.json();

  // An Organisation Admin GENERATES (through bank_for_generation, D-071) but
  // never receives pack codes, skipped packs or trigger exclusions — the
  // stored truth is read straight from the database here.
  expect(data.assessment).not.toHaveProperty("packCodes");
  expect(data.generation).not.toHaveProperty("skippedPacks");
  expect(data.generation).not.toHaveProperty("excludedByTrigger");
  const stored = await withDb(async (db) => {
    const a = await db.query<{ pack_codes: string[] }>("SELECT pack_codes FROM public.assessments WHERE id = $1", [
      data.assessment.id,
    ]);
    const vendor = await db.query<{ n: string }>(
      "SELECT count(*) AS n FROM public.assessment_questions WHERE assessment_id = $1 AND question_code LIKE 'V1.%'",
      [data.assessment.id],
    );
    return { packCodes: a.rows[0]!.pack_codes, vendorQuestions: Number(vendor.rows[0]!.n) };
  });
  // `general`'s overlay is authored but has not had its own overlap exercise, so only core is generated.
  expect(stored.packCodes).toEqual(["CORE_DPDP_V1"]);

  // FIFTEEN domains, not sixteen: every VENDOR question is conditional on
  // vendors existing, so a tenant with no Data Processors has no question in
  // that domain at all. The domain keeps its weight of 7 in the model — what a
  // domain with no applicable question contributes to the score is Slice 5's
  // call, and this is the case that forces it.
  expect(data.generation.domains).toHaveLength(15);
  expect(data.generation.domains.map((d: { domainCode: string }) => d.domainCode)).not.toContain("VENDOR");

  // 98 core minus the six vendor questions: `Mandatory where vendors exist` is
  // CONDITIONAL, and this tenant has DECLARED it has no Data Processors. An
  // organisation with no processors is not asked to evidence processor
  // contracts — but only because it said so (D-037).
  expect(data.generation.questionCount).toBe(92);
  // The six V1.x vendor questions are the ones excluded by their trigger.
  expect(stored.vendorQuestions).toBe(0);
});

test("an UNANSWERED processor question keeps the Vendor domain in — silence is not a denial (D-037)", async ({
  request,
}) => {
  // The defect this replaced: the trigger read the vendor REGISTER, so an
  // organisation that had simply not mapped its supply chain lost the whole
  // domain — and from Slice 5 would have lost its 7 points — without anyone
  // deciding that. `unknown` must behave as risk (D-026).
  const token = await ownToken();
  await saveOwnScope(request, token, "unknown");

  const res = await createAssessment(request, token, OWN_TENANT.organizationId, "unknown-processors");
  expect(res.status(), await res.text()).toBe(201);
  const { data } = await res.json();

  expect(data.generation.questionCount).toBe(98);
  expect(data.generation.domains).toHaveLength(16);
  expect(data.generation.domains.map((d: { domainCode: string }) => d.domainCode)).toContain("VENDOR");

  // Why V1.1 is in the set is provenance — not returned to an Organisation
  // Admin (D-071); the stored reason is read from the database.
  const reason = await withDb(async (db) =>
    (
      await db.query<{ included_reason: string }>(
        "SELECT included_reason FROM public.assessment_questions WHERE assessment_id = $1 AND question_code = 'V1.1'",
        [data.assessment.id],
      )
    ).rows[0]!.included_reason,
  );
  expect(reason).toBe(VENDORS_EXIST);
});

test("generating from a STALE scope is refused with 409, and leaves no empty assessment behind", async ({
  request,
}) => {
  const token = await ownToken();
  await saveOwnScope(request, token);

  // A register row that derives a tag the stored scope does not have. The
  // precondition is asserted, not assumed.
  const created = await request.post(`${base(OWN_TENANT.organizationId)}/data-principal-types`, {
    headers: bearer(token),
    data: { code: "other", label: "Under-18 learners", includesChildren: "yes" },
  });
  expect(created.status(), await created.text()).toBe(201);

  const preview = await (
    await request.post(`${base(OWN_TENANT.organizationId)}/scope/preview-assessment`, { headers: bearer(token) })
  ).json();
  expect(preview.data.riskTags.map((t: { tag: string }) => t.tag)).toContain("children_data");
  expect(preview.data.stale).toBe(true);

  const res = await createAssessment(request, token, OWN_TENANT.organizationId, "stale");
  expect(res.status()).toBe(409);
  const body = await res.json();
  expect(body.error.code).toBe("CONFLICT");
  expect(body.error.message).toMatch(/scope has changed/);

  const list = await (await request.get(`${base(OWN_TENANT.organizationId)}/assessments`, { headers: bearer(token) })).json();
  expect(list.data.assessments.filter((a: { name: string }) => a.name.includes("stale"))).toEqual([]);
});

test("a non-draft assessment cannot be regenerated", async ({ request }) => {
  const token = await accessTokenFor(SEED_USERS.consultant.email);
  const created = await (await createAssessment(request, token, MU.id, "frozen")).json();
  const id = created.data.assessment.id;

  await withDb((db) => db.query("UPDATE public.assessments SET status = 'submitted' WHERE id = $1", [id]));

  const res = await request.post(`${base(MU.id)}/assessments/${id}/generate-questions`, { headers: bearer(token) });
  expect(res.status()).toBe(409);
  expect((await res.json()).error.message).toMatch(/Only a draft/);
});

test("two assessments cannot share a name within one organisation", async ({ request }) => {
  const token = await accessTokenFor(SEED_USERS.consultant.email);
  const name = uniqueName("duplicate");
  const first = await request.post(`${base(MU.id)}/assessments`, { headers: bearer(token), data: { name } });
  expect(first.status()).toBe(201);
  const second = await request.post(`${base(MU.id)}/assessments`, { headers: bearer(token), data: { name } });
  expect(second.status()).toBe(409);
  expect((await second.json()).error.code).toBe("CONFLICT");
});

test("the body is validated: a blank name and an unknown field are both rejected", async ({ request }) => {
  const token = await accessTokenFor(SEED_USERS.consultant.email);
  for (const data of [{ name: "  " }, { name: uniqueName("extra"), somethingElse: true }, {}]) {
    const res = await request.post(`${base(MU.id)}/assessments`, { headers: bearer(token), data });
    expect(res.status(), JSON.stringify(data)).toBe(400);
    expect((await res.json()).error.code).toBe("VALIDATION_ERROR");
  }
});

test("a malformed or unknown assessment id is a plain 404", async ({ request }) => {
  const token = await accessTokenFor(SEED_USERS.muDean.email);
  for (const id of ["not-a-uuid", "0b000006-0000-4000-8000-0000000000ff"]) {
    const res = await request.get(`${base(MU.id)}/assessments/${id}`, { headers: bearer(token) });
    expect(res.status(), id).toBe(404);
  }
});
