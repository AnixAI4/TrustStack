/**
 * Slice 5 — the whole assessment, end to end through the API: answer across
 * every domain → see the sixteen scores and the overall → finalise → the
 * snapshot is frozen.
 *
 * It runs twice, on Mumbai University (`university`) and on a disposable
 * `general`-industry tenant, and must behave identically. That is the
 * per-industry claim (D-040) as a test rather than a slide: the scoring model
 * is the same sixteen domains for everyone.
 *
 * Spec files run in parallel against one database, so everything here writes
 * to assessments THIS file creates, under its own name prefix, and never to
 * MU's seeded baseline.
 */
import { expect, test, type APIRequestContext } from "@playwright/test";
import {
  accessTokenFor,
  bearer,
  createE2eTenant,
  removeE2eTenant,
  removeEvidence,
  SEED_ORGS,
  SEED_USERS,
  withDb,
} from "../helpers";

const MU = SEED_ORGS.mumbaiUniversity;
/**
 * Its own prefix — and note "E2E scoring" alone would NOT do: teardown deletes
 * by `name LIKE 'prefix%'`, and that one is also a prefix of the UI spec's
 * "E2E scoring UI", so this file's cleanup would delete that file's assessment
 * mid-run. Spec files run in parallel against one database.
 */
const NAME_PREFIX = "E2E scoring API";
const base = (orgId: string) => `/api/v1/organizations/${orgId}`;
const FILE_BODY = "Sample artefact for the Slice 5 scoring e2e.";

/**
 * Two members, because nobody may review evidence they uploaded (D-043) — and
 * the SAME two Slice 4 picked, deliberately: specs run in parallel against one
 * database, and these are the only seeded users whose memberships no other
 * spec asserts. The Dean and the Organisation Admin are both asserted to be
 * single-organisation elsewhere, so adding either here breaks `tenancy.spec`.
 */
const GENERAL_TENANT = {
  organizationId: "0b0000ff-0000-4000-8000-00000000a005",
  name: "E2E Scoring General Tenant",
  industryCode: "general",
  dataPrincipalCountEstimate: 1200,
  member: { userId: SEED_USERS.muItSecurity.id, email: SEED_USERS.muItSecurity.email },
  roleCode: "consultant",
  extraMembers: [{ userId: SEED_USERS.muLegal.id, roleCode: "dpdp_owner" }],
};

interface Journey {
  orgId: string;
  /** Answers, uploads and generates. */
  answerer: string;
  /** Reviews and finalises. */
  reviewer: string;
}

const MU_JOURNEY: Journey = {
  orgId: MU.id,
  answerer: SEED_USERS.consultant.email,
  reviewer: SEED_USERS.mumbaiUniversity.email,
};
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
  const res = await request.put(`${base(GENERAL_TENANT.organizationId)}/scope`, {
    headers: bearer(await accessTokenFor(GENERAL_TENANT.member.email)),
    data: {
      industryCode: "general",
      dataPrincipalCountEstimate: 1200,
      answers: {
        childrenData: "no",
        // An explicit `no` is the only thing that scopes the VENDOR domain out
        // (D-037) — which is what makes the D-038 denominator visible here.
        usesDataProcessors: "no",
        aiUsageTypes: [],
        marketingTracking: "no",
        crossBorder: "no",
        multiLocation: false,
        publicFacingPortal: "no",
        sensitiveDocuments: "no",
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
  // Snapshots, answers and links go with their assessment (cascade + triggers).
  await withDb((db) => db.query("DELETE FROM public.assessments WHERE name LIKE $1", [`${NAME_PREFIX}%`]));
  await removeE2eTenant(GENERAL_TENANT);
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function createAssessment(request: APIRequestContext, j: Journey, label: string): Promise<string> {
  const res = await request.post(`${base(j.orgId)}/assessments`, {
    headers: bearer(await accessTokenFor(j.answerer)),
    data: { name: `${NAME_PREFIX} ${label} ${Date.now()}` },
  });
  expect(res.status(), await res.text()).toBe(201);
  return (await res.json()).data.assessment.id as string;
}

interface Question {
  questionCode: string;
  domainCode: string;
  applicability: string;
}

async function questions(request: APIRequestContext, j: Journey, assessmentId: string): Promise<Question[]> {
  const res = await request.get(`${base(j.orgId)}/assessments/${assessmentId}/questions`, {
    headers: bearer(await accessTokenFor(j.answerer)),
  });
  expect(res.status()).toBe(200);
  return (await res.json()).data.questions as Question[];
}

async function score(request: APIRequestContext, j: Journey, assessmentId: string, query = "") {
  const res = await request.get(`${base(j.orgId)}/assessments/${assessmentId}/score${query}`, {
    headers: bearer(await accessTokenFor(j.reviewer)),
  });
  expect(res.status(), await res.text()).toBe(200);
  return (await res.json()).data;
}

async function answer(request: APIRequestContext, j: Journey, assessmentId: string, code: string, body: object) {
  return request.put(`${base(j.orgId)}/assessments/${assessmentId}/responses/${encodeURIComponent(code)}`, {
    headers: bearer(await accessTokenFor(j.answerer)),
    data: body,
  });
}

/**
 * Answer every question in the snapshot, all at the same claim.
 *
 * In batches, not one at a time: MU's baseline is 124 questions, and a
 * sequential loop of 124 writes takes seconds against a local stack but
 * minutes against the hosted project in Mumbai — which is where this suite is
 * re-run to verify a deploy. Concurrent writes are safe here because each one
 * is a different question, and the draft → in_progress move they race on is
 * idempotent (`WHERE status = 'draft'`).
 */
async function answerEverything(request: APIRequestContext, j: Journey, assessmentId: string, claim: number) {
  const all = await questions(request, j, assessmentId);
  const BATCH = 8;
  for (let i = 0; i < all.length; i += BATCH) {
    const results = await Promise.all(
      all.slice(i, i + BATCH).map(async (q) => ({
        code: q.questionCode,
        res: await answer(request, j, assessmentId, q.questionCode, {
          applicabilityDecision: "applicable",
          claimedMaturity: claim,
        }),
      })),
    );
    for (const { code, res } of results) {
      expect([200, 201], `${code}: ${await res.text()}`).toContain(res.status());
    }
  }
}

async function finalise(request: APIRequestContext, j: Journey, assessmentId: string) {
  return request.post(`${base(j.orgId)}/assessments/${assessmentId}/finalise`, {
    headers: bearer(await accessTokenFor(j.reviewer)),
  });
}

/** upload-url → PUT to Storage → link. Returns the evidence id. */
async function uploadAndLink(request: APIRequestContext, j: Journey, responseId: string): Promise<string> {
  const token = await accessTokenFor(j.answerer);
  const issued = await request.post(`${base(j.orgId)}/evidence/upload-url`, {
    headers: bearer(token),
    data: { fileName: "artefact.txt", contentType: "text/plain", byteSize: Buffer.byteLength(FILE_BODY) },
  });
  expect(issued.status(), await issued.text()).toBe(201);
  const { evidence, upload } = (await issued.json()).data;
  createdEvidence.push({ orgId: j.orgId, id: evidence.id });

  const put = await request.put(upload.url, {
    data: Buffer.from(FILE_BODY),
    headers: { "Content-Type": upload.contentType },
  });
  expect(put.status(), await put.text()).toBe(200);

  const linked = await request.post(`${base(j.orgId)}/evidence/${evidence.id}/link`, {
    headers: bearer(token),
    data: { responseId },
  });
  expect(linked.status(), await linked.text()).toBe(201);
  return evidence.id as string;
}

async function review(request: APIRequestContext, j: Journey, evidenceId: string, status: string, level: number) {
  const res = await request.patch(`${base(j.orgId)}/evidence/${evidenceId}/review`, {
    headers: bearer(await accessTokenFor(j.reviewer)),
    data: { reviewStatus: status, evidenceLevel: level },
  });
  expect(res.status(), await res.text()).toBe(200);
}

async function responseFor(request: APIRequestContext, j: Journey, assessmentId: string, code: string) {
  const res = await request.get(`${base(j.orgId)}/assessments/${assessmentId}/responses`, {
    headers: bearer(await accessTokenFor(j.reviewer)),
  });
  expect(res.status()).toBe(200);
  return (await res.json()).data.responses.find((r: { questionCode: string }) => r.questionCode === code);
}

// ---------------------------------------------------------------------------
// The journey, on both tenants
// ---------------------------------------------------------------------------

for (const [label, journey] of [
  ["university", MU_JOURNEY],
  ["general", GENERAL_JOURNEY],
] as const) {
  test(`${label}: every domain answerable, sixteen scores, one overall`, async ({ request }) => {
    const j = journey;
    const assessmentId = await createAssessment(request, j, label);

    const empty = await score(request, j, assessmentId);
    expect(empty.finalised).toBe(false);
    expect(empty.domains).toHaveLength(16);
    expect(empty.overall.provisional).toBe(true);
    expect(empty.overall.outstandingCount).toBeGreaterThan(0);
    expect(empty.overall.finalScore).toBe(0);

    // Every domain the scope generated is answerable — Slice 4 allowed GOV only.
    const all = await questions(request, j, assessmentId);
    const domainsWithQuestions = new Set(all.map((q) => q.domainCode));
    expect(domainsWithQuestions.size).toBeGreaterThan(1);
    for (const q of all.slice(0, 3)) {
      const res = await answer(request, j, assessmentId, q.questionCode, {
        applicabilityDecision: "applicable",
        claimedMaturity: 4,
      });
      expect([200, 201], await res.text()).toContain(res.status());
    }

    const partial = await score(request, j, assessmentId);
    expect(partial.overall.provisional).toBe(true);
    // Unevidenced claims of 4 are capped at 1, so every answered question is High.
    expect(partial.overall.highCount).toBe(3);
    expect(partial.overall.criticalCount).toBe(0);

    // `?domain=` still narrows to one — Slice 4's tile depends on it.
    const one = await score(request, j, assessmentId, "?domain=GOV");
    expect(one.domain).toMatchObject({ code: "GOV", domainId: "D01" });
    expect(one.domains).toBeUndefined();

    // An unknown domain is rejected by the query schema — NOT silently
    // defaulted to GOV, which is what Slice 4's schema would have done.
    const bad = await request.get(`${base(j.orgId)}/assessments/${assessmentId}/score?domain=NOPE`, {
      headers: bearer(await accessTokenFor(j.reviewer)),
    });
    expect(bad.status()).toBe(400);
    expect((await bad.json()).error.code).toBe("VALIDATION_ERROR");
  });

  test(`${label}: the denominator is the APPLICABLE weight, and empty domains stay distinct (D-038)`, async ({
    request,
  }) => {
    const j = journey;
    const assessmentId = await createAssessment(request, j, `${label} denominator`);
    const payload = await score(request, j, assessmentId);

    const scored = payload.domains.filter((d: { state: string }) => d.state === "scored");
    const expectedWeight = scored.reduce((sum: number, d: { weight: number }) => sum + d.weight, 0);
    expect(payload.overall.applicableWeight).toBeCloseTo(expectedWeight, 6);
    expect(payload.overall.coverage).toBeCloseTo(expectedWeight / 100, 6);

    for (const d of payload.domains) {
      if (d.state === "scored") continue;
      // Never zero, never renormalised away — and it says WHICH kind of empty.
      expect(d.score).toBeNull();
      expect(["scoped_out", "all_not_applicable"]).toContain(d.state);
    }
  });
}

/**
 * The `general` tenant declares it uses no Data Processors, which is the ONLY
 * thing that scopes a domain out (D-037). So it is the one that proves the
 * denominator really moves: 93 applicable weighted points, not 100, and not a
 * VENDOR score of zero.
 */
test("general: a scoped-out VENDOR domain leaves the denominator at 93", async ({ request }) => {
  const j = GENERAL_JOURNEY;
  const assessmentId = await createAssessment(request, j, "scoped out");
  const payload = await score(request, j, assessmentId);

  const vendor = payload.domains.find((d: { code: string }) => d.code === "VENDOR");
  expect(vendor).toMatchObject({ state: "scoped_out", score: null, evidenceConfidence: null, scopedOut: true });
  expect(payload.overall.applicableWeight).toBeCloseTo(93, 6);
  expect(payload.overall.coverage).toBeCloseTo(0.93, 6);
  // The other fifteen weights are NOT rebalanced back to 100.
  const scoredWeight = payload.domains
    .filter((d: { state: string }) => d.state === "scored")
    .reduce((sum: number, d: { weight: number }) => sum + d.weight, 0);
  expect(scoredWeight).toBeCloseTo(93, 6);
});

test("university: a red flag caps the whole assessment, and the lowest cap wins", async ({ request }) => {
  const j = MU_JOURNEY;
  const assessmentId = await createAssessment(request, j, "red flags");

  // One weak answer in each red-flag area is enough: a claim of 5 with nothing
  // evidenced adjusts to 1, which is at or below the threshold (D-046).
  const RED_FLAG_DOMAINS = ["GOV", "INV", "ROPA", "SECURITY", "BREACH", "VENDOR", "CHILD"];
  const all = await questions(request, j, assessmentId);
  for (const domain of RED_FLAG_DOMAINS) {
    // The owner flag is pinned to G1.2; the rest fire on any question.
    const q = domain === "GOV" ? all.find((x) => x.questionCode === "G1.2") : all.find((x) => x.domainCode === domain);
    if (!q) continue;
    const res = await answer(request, j, assessmentId, q.questionCode, {
      applicabilityDecision: "applicable",
      claimedMaturity: 5,
    });
    expect([200, 201], await res.text()).toContain(res.status());
  }
  const payload = await score(request, j, assessmentId);

  expect(payload.overall.redFlags.length).toBeGreaterThan(0);
  const caps = payload.overall.redFlags.map((f: { cap: number }) => f.cap);
  expect(payload.overall.scoreCap).toBe(Math.min(...caps));
  expect(payload.overall.finalScore).toBe(Math.min(payload.overall.rawScore, payload.overall.scoreCap));

  // The keystone question is itself a red flag.
  expect(payload.overall.redFlags.map((f: { code: string }) => f.code)).toContain("no_evidenced_dpdp_owner");
  // Plain language only — the client never sees a question or pack code (D-040).
  for (const flag of payload.overall.redFlags) {
    expect(flag.label).not.toMatch(/_V\d|\bD\d{2}\b/);
  }
  // An unevidenced claim of 5 adjusts to 1: High, not Critical.
  expect(payload.overall.criticalCount).toBe(0);
  expect(payload.overall.highCount).toBeGreaterThan(0);
});

test("university: finalise refuses while anything is outstanding, then freezes the score", async ({ request }) => {
  // 124 real writes, then a finalise that computes sixteen domain scores in
  // SQL. Comfortable locally; this budget is for the live run against Mumbai.
  test.setTimeout(180_000);
  const j = MU_JOURNEY;
  const assessmentId = await createAssessment(request, j, "finalise");

  // 1. One answer is not enough.
  const first = await questions(request, j, assessmentId);
  const one = await answer(request, j, assessmentId, first[0]!.questionCode, {
    applicabilityDecision: "applicable",
    claimedMaturity: 3,
  });
  expect(one.status()).toBe(201);

  const tooEarly = await finalise(request, j, assessmentId);
  expect(tooEarly.status(), await tooEarly.text()).toBe(409);
  const tooEarlyBody = await tooEarly.json();
  expect(tooEarlyBody.error.message).toMatch(/outstanding/);
  expect(tooEarlyBody.error.details?.[0]?.issue).toBe(String(first.length - 1));

  // 2. Answer the rest, evidence one of them properly, then finalise.
  await answerEverything(request, j, assessmentId, 3);
  const target = first[0]!.questionCode;
  const response = await responseFor(request, j, assessmentId, target);
  const evidenceId = await uploadAndLink(request, j, response.id);
  await review(request, j, evidenceId, "strong", 5);
  expect(await responseFor(request, j, assessmentId, target)).toMatchObject({ evidenceLevel: 5, adjustedScore: 3 });

  const live = await score(request, j, assessmentId);
  expect(live.overall.provisional).toBe(false);
  expect(live.finalised).toBe(false);

  const done = await finalise(request, j, assessmentId);
  expect(done.status(), await done.text()).toBe(201);
  const snapshot = (await done.json()).data;
  expect(snapshot.finalised).toBe(true);
  expect(snapshot.snapshot.id).toBeTruthy();
  expect(snapshot.status).toBe("finalised");
  expect(snapshot.domains).toHaveLength(16);
  // The frozen numbers are the ones the live score had just reported.
  expect(snapshot.overall.finalScore).toBeCloseTo(live.overall.finalScore, 4);
  expect(snapshot.overall.applicableWeight).toBeCloseTo(live.overall.applicableWeight, 4);
  expect(snapshot.overall.criticalCount).toBe(live.overall.criticalCount);
  expect(snapshot.overall.highCount).toBe(live.overall.highCount);
  expect(snapshot.overall.engineVersion).toBeTruthy();

  // 3. It is read back, not recomputed — and it cannot be finalised twice.
  const reread = await score(request, j, assessmentId);
  expect(reread.finalised).toBe(true);
  expect(reread.snapshot.id).toBe(snapshot.snapshot.id);
  expect(reread.overall.finalScore).toBeCloseTo(snapshot.overall.finalScore, 6);

  const again = await finalise(request, j, assessmentId);
  expect(again.status()).toBe(409);

  // 4. And nothing underneath it can move any more.
  const locked = await answer(request, j, assessmentId, target, {
    applicabilityDecision: "applicable",
    claimedMaturity: 5,
  });
  expect(locked.status()).toBe(409);

  const after = await score(request, j, assessmentId);
  expect(after.overall.finalScore).toBeCloseTo(snapshot.overall.finalScore, 6);
});

test("university: unlinking evidence re-derives the answer, and never deletes the artefact", async ({ request }) => {
  const j = MU_JOURNEY;
  const assessmentId = await createAssessment(request, j, "unlink");
  const [q] = await questions(request, j, assessmentId);

  const answered = await answer(request, j, assessmentId, q!.questionCode, {
    applicabilityDecision: "applicable",
    claimedMaturity: 5,
  });
  expect(answered.status()).toBe(201);
  const responseId = (await answered.json()).data.response.id;

  const evidenceId = await uploadAndLink(request, j, responseId);
  await review(request, j, evidenceId, "strong", 5);
  expect(await responseFor(request, j, assessmentId, q!.questionCode)).toMatchObject({
    evidenceLevel: 5,
    adjustedScore: 5,
  });

  const token = bearer(await accessTokenFor(j.answerer));
  const unlinked = await request.delete(`${base(j.orgId)}/evidence/${evidenceId}/links/${responseId}`, {
    headers: token,
  });
  expect(unlinked.status(), await unlinked.text()).toBe(200);
  // Back to unevidenced: a claim of 5 with nothing reviewed scores 1.
  expect((await unlinked.json()).data.response).toMatchObject({
    evidenceLevel: null,
    adjustedScore: 1,
    capApplied: true,
    evidence: [],
  });

  // Unlinking twice is a 404, not a silent success.
  const twice = await request.delete(`${base(j.orgId)}/evidence/${evidenceId}/links/${responseId}`, { headers: token });
  expect(twice.status()).toBe(404);

  // The artefact itself survives — it can be attached somewhere else.
  const relinked = await request.post(`${base(j.orgId)}/evidence/${evidenceId}/link`, {
    headers: token,
    data: { responseId },
  });
  expect(relinked.status(), await relinked.text()).toBe(201);
  expect(await responseFor(request, j, assessmentId, q!.questionCode)).toMatchObject({
    evidenceLevel: 5,
    adjustedScore: 5,
  });
});

test("a role without assessment.finalise cannot finalise", async ({ request }) => {
  const j = MU_JOURNEY;
  const assessmentId = await createAssessment(request, j, "permission");

  // Refused on the permission, before the outstanding check is ever reached —
  // so this needs no answers at all. The guard says 403 and the RPC would too.
  const res = await request.post(`${base(j.orgId)}/assessments/${assessmentId}/finalise`, {
    headers: bearer(await accessTokenFor(SEED_USERS.muDean.email)),
  });
  expect(res.status(), await res.text()).toBe(403);

  const still = await score(request, j, assessmentId);
  expect(still.finalised).toBe(false);
});
