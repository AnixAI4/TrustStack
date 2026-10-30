/**
 * Slice 4 — the keystone, end to end through the API: answer → upload by
 * signed URL → link → review → score, on ONE question (`G1.2`) in ONE domain
 * (`GOV`).
 *
 * The same journey runs twice — on Mumbai University (`university`) and on a
 * disposable `general`-industry tenant — and must give the same result. That
 * is the per-industry claim (D-040) as a test rather than a slide: nothing in
 * the mechanism is University-specific.
 *
 * Spec files run in parallel against one database, so everything here writes
 * to assessments this file creates, never to MU's seeded baseline.
 */
import { createClient } from "@supabase/supabase-js";
import { expect, test, type APIRequestContext } from "@playwright/test";
import {
  accessTokenFor, bearer, createE2eTenant, removeE2eTenant, removeEvidence, SEED_EVIDENCE, SEED_ORGS, SEED_USERS, withDb,
} from "../helpers";

const MU = SEED_ORGS.mumbaiUniversity;
const BML = SEED_ORGS.bharatManufacturing;
const NAME_PREFIX = "E2E keystone";
const base = (orgId: string) => `/api/v1/organizations/${orgId}`;
const FILE_BODY = "Office order: the Registrar is nominated DPDP Programme Owner. (e2e test artefact)";

/**
 * Two members, because nobody may review evidence they uploaded (D-043). The
 * answerer holds `consultant` HERE (it may answer, upload and generate); the
 * reviewer holds `dpdp_owner`. Neither user's memberships are asserted by any
 * other spec.
 */
const GENERAL_TENANT = {
  organizationId: "0b0000ff-0000-4000-8000-00000000a004",
  name: "E2E Keystone General Tenant",
  industryCode: "general",
  dataPrincipalCountEstimate: 2500,
  member: { userId: SEED_USERS.muItSecurity.id, email: SEED_USERS.muItSecurity.email },
  roleCode: "consultant",
  extraMembers: [{ userId: SEED_USERS.muLegal.id, roleCode: "dpdp_owner" }],
};

interface Journey {
  orgId: string;
  answerer: string;
  reviewer: string;
}

const MU_JOURNEY: Journey = { orgId: MU.id, answerer: SEED_USERS.consultant.email, reviewer: SEED_USERS.mumbaiUniversity.email };
const GENERAL_JOURNEY: Journey = {
  orgId: GENERAL_TENANT.organizationId,
  answerer: SEED_USERS.muItSecurity.email,
  reviewer: SEED_USERS.muLegal.email,
};

const createdEvidence: { orgId: string; id: string }[] = [];

test.describe.configure({ mode: "serial" });

test.beforeAll(async ({ playwright }) => {
  await createE2eTenant(GENERAL_TENANT);
  const request = await playwright.request.newContext({ baseURL: test.info().project.use.baseURL });
  const token = await accessTokenFor(GENERAL_TENANT.member.email);
  const res = await request.put(`${base(GENERAL_TENANT.organizationId)}/scope`, {
    headers: bearer(token),
    data: {
      industryCode: "general",
      dataPrincipalCountEstimate: 2500,
      answers: {
        childrenData: "no", usesDataProcessors: "no", aiUsageTypes: [], marketingTracking: "no",
        crossBorder: "no", multiLocation: false, publicFacingPortal: "no", sensitiveDocuments: "no",
      },
    },
  });
  expect(res.status(), await res.text()).toBe(200);
  await request.dispose();
});

test.afterAll(async () => {
  for (const orgId of new Set(createdEvidence.map((e) => e.orgId))) {
    await removeEvidence(orgId, createdEvidence.filter((e) => e.orgId === orgId).map((e) => e.id));
  }
  // Answers and links go with their assessment (cascade + the response trigger).
  await withDb((db) => db.query("DELETE FROM public.assessments WHERE name LIKE $1", [`${NAME_PREFIX}%`]));
  await removeE2eTenant(GENERAL_TENANT);
});

async function createAssessment(request: APIRequestContext, j: Journey, label: string): Promise<string> {
  const res = await request.post(`${base(j.orgId)}/assessments`, {
    headers: bearer(await accessTokenFor(j.answerer)),
    data: { name: `${NAME_PREFIX} ${label} ${Date.now()}` },
  });
  expect(res.status(), await res.text()).toBe(201);
  const { data } = await res.json();
  expect(data.assessment.status).toBe("draft");
  return data.assessment.id as string;
}

async function answer(request: APIRequestContext, j: Journey, assessmentId: string, code: string, body: object) {
  return request.put(`${base(j.orgId)}/assessments/${assessmentId}/responses/${code}`, {
    headers: bearer(await accessTokenFor(j.answerer)),
    data: body,
  });
}

async function gov(request: APIRequestContext, j: Journey, assessmentId: string) {
  const res = await request.get(`${base(j.orgId)}/assessments/${assessmentId}/score?domain=GOV`, {
    headers: bearer(await accessTokenFor(j.reviewer)),
  });
  expect(res.status()).toBe(200);
  return (await res.json()).data.domain;
}

/** upload-url → PUT the bytes to Storage → link. Returns the evidence id. */
async function uploadAndLink(request: APIRequestContext, j: Journey, responseId: string): Promise<string> {
  const token = await accessTokenFor(j.answerer);
  const issued = await request.post(`${base(j.orgId)}/evidence/upload-url`, {
    headers: bearer(token),
    data: { fileName: "office order.txt", contentType: "text/plain", byteSize: Buffer.byteLength(FILE_BODY) },
  });
  expect(issued.status(), await issued.text()).toBe(201);
  const { evidence, upload } = (await issued.json()).data;
  createdEvidence.push({ orgId: j.orgId, id: evidence.id });
  expect(evidence).toMatchObject({ fileName: "office_order.txt", reviewStatus: "pending", evidenceLevel: null });
  // The storage path is internal; clients address evidence by id.
  expect(JSON.stringify(evidence)).not.toContain("organizations/");

  const put = await request.put(upload.url, { data: Buffer.from(FILE_BODY), headers: { "Content-Type": upload.contentType } });
  expect(put.status(), await put.text()).toBe(200);
  // Single use: the artefact cannot be overwritten.
  const again = await request.put(upload.url, { data: Buffer.from("tampered"), headers: { "Content-Type": upload.contentType } });
  expect(again.ok()).toBe(false);

  const linked = await request.post(`${base(j.orgId)}/evidence/${evidence.id}/link`, {
    headers: bearer(token),
    data: { responseId },
  });
  expect(linked.status(), await linked.text()).toBe(201);
  return evidence.id as string;
}

async function review(request: APIRequestContext, j: Journey, evidenceId: string, reviewStatus: string, evidenceLevel: number, as = j.reviewer) {
  return request.patch(`${base(j.orgId)}/evidence/${evidenceId}/review`, {
    headers: bearer(await accessTokenFor(as)),
    data: { reviewStatus, evidenceLevel },
  });
}

async function readG12(request: APIRequestContext, j: Journey, assessmentId: string) {
  const res = await request.get(`${base(j.orgId)}/assessments/${assessmentId}/responses`, {
    headers: bearer(await accessTokenFor(j.reviewer)),
  });
  expect(res.status()).toBe(200);
  return (await res.json()).data.responses.find((r: { questionCode: string }) => r.questionCode === "G1.2");
}

/**
 * The keystone. Returns what it observed so the two tenants can be compared.
 */
async function keystone(request: APIRequestContext, j: Journey, label: string) {
  const assessmentId = await createAssessment(request, j, label);
  const before = await gov(request, j, assessmentId);
  expect(before).toMatchObject({ code: "GOV", weight: 7, score: null, scopedOut: false });

  // 1. Claim 5 with nothing to show: scored as E0 → 1, and the cap is named.
  const answered = await answer(request, j, assessmentId, "G1.2", { applicabilityDecision: "applicable", claimedMaturity: 5 });
  expect(answered.status(), await answered.text()).toBe(201);
  const first = (await answered.json()).data;
  expect(first.response).toMatchObject({ claimedMaturity: 5, evidenceLevel: null, adjustedScore: 1, capApplied: true });
  // The first answer moves the draft on, which freezes its question set (D-041).
  expect(first.assessmentStatus).toBe("in_progress");
  const regenerate = await request.post(`${base(j.orgId)}/assessments/${assessmentId}/generate-questions`, {
    headers: bearer(await accessTokenFor(j.answerer)),
  });
  expect(regenerate.status()).toBe(409);

  const unevidenced = await gov(request, j, assessmentId);
  expect(unevidenced.score).toBeCloseTo(1.4, 10); // (1 / 5) × 7
  expect(unevidenced).toMatchObject({ evidenceConfidence: 0, applicableCount: 1, provisional: true });

  // 2. Upload by signed URL and link. Linked but unreviewed still scores E0.
  const evidenceId = await uploadAndLink(request, j, first.response.id);
  expect(await readG12(request, j, assessmentId)).toMatchObject({ evidenceLevel: null, adjustedScore: 1 });

  // 3. Nobody grades their own evidence.
  const self = await review(request, j, evidenceId, "strong", 5, j.answerer);
  expect(self.status()).toBe(403);
  expect((await self.json()).error.message).toMatch(/cannot review evidence you uploaded/);

  // 4. A reviewer accepts it as E5 → the claim stands at 5 → GOV 7 / 7.
  const accepted = await review(request, j, evidenceId, "strong", 5);
  expect(accepted.status(), await accepted.text()).toBe(200);
  expect(await readG12(request, j, assessmentId)).toMatchObject({ evidenceLevel: 5, adjustedScore: 5, capApplied: false });
  const full = await gov(request, j, assessmentId);
  expect(full).toMatchObject({ score: 7, evidenceConfidence: 100 });

  // 5. THE KEYSTONE: downgraded to E0, the claimed 5 drops to 1 and GOV moves.
  const downgraded = await review(request, j, evidenceId, "rejected", 0);
  expect(downgraded.status(), await downgraded.text()).toBe(200);
  const capped = await readG12(request, j, assessmentId);
  expect(capped).toMatchObject({ claimedMaturity: 5, evidenceLevel: 0, adjustedScore: 1, capApplied: true });
  const after = await gov(request, j, assessmentId);
  expect(after.score).toBeCloseTo(1.4, 10);
  expect(after.score).toBeLessThan(full.score);
  expect(after.evidenceConfidence).toBe(0);

  return { assessmentId, evidenceId, adjusted: capped.adjustedScore, scores: [unevidenced.score, full.score, after.score] };
}

// ---------------------------------------------------------------------------

let mu: Awaited<ReturnType<typeof keystone>>;
let general: Awaited<ReturnType<typeof keystone>>;

test("the keystone on Mumbai University: claim 5 → upload → review E0 → adjusted 1 → GOV moves", async ({ request }) => {
  mu = await keystone(request, MU_JOURNEY, "mu");
});

test("the SAME journey on a general-industry tenant gives the same result — nothing is University-specific", async ({
  request,
}) => {
  general = await keystone(request, GENERAL_JOURNEY, "general");
  expect(general.adjusted).toBe(mu.adjusted);
  expect(general.scores).toEqual(mu.scores);
  const industry = await withDb(async (db) =>
    (await db.query<{ industry_code: string }>("SELECT industry_code FROM public.organizations WHERE id = $1", [
      GENERAL_TENANT.organizationId,
    ])).rows[0]!.industry_code,
  );
  expect(industry).toBe("general");
});

test("E1 and E2 both cap a claim of 4 at 2 — through the API", async ({ request }) => {
  const assessmentId = await createAssessment(request, MU_JOURNEY, "e1e2");
  const res = await answer(request, MU_JOURNEY, assessmentId, "G1.2", { applicabilityDecision: "applicable", claimedMaturity: 4 });
  const responseId = (await res.json()).data.response.id;
  const evidenceId = await uploadAndLink(request, MU_JOURNEY, responseId);
  for (const level of [1, 2]) {
    expect((await review(request, MU_JOURNEY, evidenceId, "partial", level)).status()).toBe(200);
    expect(await readG12(request, MU_JOURNEY, assessmentId)).toMatchObject({ evidenceLevel: level, adjustedScore: 2 });
  }
});

test("a contributor may answer and upload, but never review", async ({ request }) => {
  const token = await accessTokenFor(SEED_USERS.muDepartmentOwner.email);
  const res = await request.patch(`${base(MU.id)}/evidence/${mu.evidenceId}/review`, {
    headers: bearer(token),
    data: { reviewStatus: "strong", evidenceLevel: 5 },
  });
  expect(res.status()).toBe(403);
  expect((await res.json()).error.code).toBe("FORBIDDEN");
});

test("Not Applicable: a reason is required, a mandatory question refuses it, and it leaves the denominator", async ({ request }) => {
  const assessmentId = await createAssessment(request, MU_JOURNEY, "na");
  const token = await accessTokenFor(MU_JOURNEY.answerer);
  const questions = (
    await (await request.get(`${base(MU.id)}/assessments/${assessmentId}/questions`, { headers: bearer(token) })).json()
  ).data.questions as { questionCode: string; applicability: string }[];
  const pa = questions.find((q) => q.applicability === "potentially_applicable")!;

  const noReason = await answer(request, MU_JOURNEY, assessmentId, pa.questionCode, { applicabilityDecision: "not_applicable", naReason: "  " });
  expect(noReason.status()).toBe(400);

  const mandatory = await answer(request, MU_JOURNEY, assessmentId, "G1.2", { applicabilityDecision: "not_applicable", naReason: "No" });
  expect(mandatory.status()).toBe(422);

  const ok = await answer(request, MU_JOURNEY, assessmentId, pa.questionCode, {
    applicabilityDecision: "not_applicable",
    naReason: "This processing does not happen here.",
  });
  expect(ok.status(), await ok.text()).toBe(201);
  expect((await ok.json()).data.response).toMatchObject({ applicabilityDecision: "not_applicable", adjustedScore: null });

  const unknown = await answer(request, MU_JOURNEY, assessmentId, "NOT-A-QUESTION", { applicabilityDecision: "applicable", claimedMaturity: 3 });
  expect(unknown.status()).toBe(404);
  const derived = await answer(request, MU_JOURNEY, assessmentId, "G1.1", { applicabilityDecision: "applicable", claimedMaturity: 3, adjustedScore: 5 });
  expect(derived.status(), "a client may not send an adjusted score").toBe(400);
});

test("only documents and images, within the size limit, may be uploaded", async ({ request }) => {
  const token = await accessTokenFor(MU_JOURNEY.answerer);
  for (const data of [
    { fileName: "x.exe", contentType: "application/x-msdownload", byteSize: 10 },
    { fileName: "x.zip", contentType: "application/zip", byteSize: 10 },
    { fileName: "x.pdf", contentType: "application/pdf", byteSize: 26 * 1024 * 1024 },
  ]) {
    const res = await request.post(`${base(MU.id)}/evidence/upload-url`, { headers: bearer(token), data });
    expect(res.status()).toBe(400);
  }
});

test("a download URL is short-lived, works, and is audited EVERY time it is issued", async ({ request }) => {
  const token = await accessTokenFor(MU_JOURNEY.reviewer);
  const count = () =>
    withDb(async (db) =>
      Number(
        (await db.query<{ n: string }>(
          "SELECT count(*) AS n FROM public.audit_logs WHERE event_type = 'evidence.download_url.issued' AND entity_id = $1",
          [mu.evidenceId],
        )).rows[0]!.n,
      ),
    );
  const before = await count();
  for (let i = 0; i < 2; i++) {
    const res = await request.get(`${base(MU.id)}/evidence/${mu.evidenceId}/download-url`, { headers: bearer(token) });
    expect(res.status()).toBe(200);
    const { data } = await res.json();
    expect(data.expiresInSeconds).toBe(60);
    const file = await request.get(data.url);
    expect(file.status()).toBe(200);
    expect(await file.text()).toBe(FILE_BODY);
  }
  expect(await count()).toBe(before + 2);
});

test("every step of the journey is on the audit log, as the person who did it", async () => {
  const rows = await withDb(async (db) =>
    (await db.query<{ event_type: string; user_id: string }>(
      `SELECT event_type, user_id FROM public.audit_logs
       WHERE organization_id = $1 AND (entity_id = $2 OR metadata ->> 'evidenceId' = $2::text OR metadata ->> 'assessmentId' = $3::text)`,
      [MU.id, mu.evidenceId, mu.assessmentId],
    )).rows,
  );
  const by = (type: string) => rows.filter((r) => r.event_type === type).map((r) => r.user_id);
  expect(by("response.assessment_responses.insert")).toEqual([SEED_USERS.consultant.id]);
  expect(by("evidence.upload_url.issued")).toEqual([SEED_USERS.consultant.id]);
  expect(by("evidence.evidence_links.insert")).toEqual([SEED_USERS.consultant.id]);
  expect(by("evidence.evidence.update")).toEqual([SEED_USERS.mumbaiUniversity.id, SEED_USERS.mumbaiUniversity.id]);
});

// ---------------------------------------------------------------------------
// GATE 5 — evidence across tenants, at the API AND at Storage
// ---------------------------------------------------------------------------

test("Org B cannot obtain a download URL for Org A's evidence — through the API", async ({ request }) => {
  const token = await accessTokenFor(SEED_USERS.bmlAdmin.email);
  const intoA = await request.get(`${base(MU.id)}/evidence/${mu.evidenceId}/download-url`, { headers: bearer(token) });
  expect(intoA.status()).toBe(403);
  expect((await intoA.json()).error.code).toBe("TENANT_ACCESS_DENIED");
  // Its own path with Org A's evidence id: a plain 404 that confirms nothing.
  const viaB = await request.get(`${base(BML.id)}/evidence/${mu.evidenceId}/download-url`, { headers: bearer(token) });
  expect(viaB.status()).toBe(404);
  const seeded = await request.get(`${base(BML.id)}/evidence/${SEED_EVIDENCE.muG12OfficeOrder.id}/download-url`, {
    headers: bearer(token),
  });
  expect(seeded.status()).toBe(404);
});

test("Org B cannot obtain, or use, Org A's evidence — straight at Storage with its own JWT", async () => {
  const token = await accessTokenFor(SEED_USERS.bmlAdmin.email);
  const storage = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  }).storage.from("evidence");
  const e = SEED_EVIDENCE.muG12OfficeOrder;
  const path = `organizations/${e.organizationId}/evidence/${e.id}/${e.fileName}`;

  const signed = await storage.createSignedUrl(path, 60);
  expect(signed.data).toBeNull();
  const direct = await storage.download(path);
  expect(direct.data).toBeNull();
  const listed = await storage.list(`organizations/${e.organizationId}/evidence`);
  expect(listed.data ?? []).toEqual([]);
  const upload = await storage.createSignedUploadUrl(`organizations/${e.organizationId}/evidence/${e.id}/forged.txt`);
  expect(upload.data).toBeNull();
});
