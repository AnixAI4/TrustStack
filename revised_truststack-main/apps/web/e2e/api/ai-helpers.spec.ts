/**
 * Slice 11, Stage 1b — the Evidence, Gap/Action and Score helpers and thumbs
 * up / down, end to end through the API (SLICE_11 §7a.3, §4.13; §8).
 *
 * Runs against the RECORDED FAKE (`AI_PROVIDER=fake`): no live model call.
 * Drafts are permanent, so everything that stores one runs on a DISPOSABLE
 * tenant, `…a028` (pitfall 5). One answer at a claim of 4 with no evidence
 * counts as 1 — it opens a gap, and its action — so each helper has something
 * real to explain.
 */
import { expect, test, type APIRequestContext } from "@playwright/test";
import { accessTokenFor, bearer, createE2eTenant, removeE2eTenant, SEED_ASSESSMENTS, SEED_ORGS, SEED_USERS, withDb } from "../helpers";

const base = (orgId: string) => `/api/v1/organizations/${orgId}`;

const ADMIN = SEED_USERS.muItSecurity;
/** A Department Owner here: reads gaps and scores, may not turn the assistant on. */
const OWNER = SEED_USERS.muLegal;

const TENANT = {
  organizationId: "0b0000ff-0000-4000-8000-00000000a028",
  name: "E2E AI Helpers Tenant",
  industryCode: "general",
  member: { userId: ADMIN.id, email: ADMIN.email },
  roleCode: "organization_admin",
  extraMembers: [{ userId: OWNER.id, roleCode: "department_owner" }],
};
const ORG = TENANT.organizationId;

async function call(request: APIRequestContext, method: string, url: string, email: string, data?: object) {
  const res = await request.fetch(url, { method, headers: bearer(await accessTokenFor(email)), ...(data ? { data } : {}) });
  const text = await res.text();
  return { status: res.status(), text, json: text ? JSON.parse(text) : null };
}
const run = (request: APIRequestContext, task: string, data: object, email: string = ADMIN.email) =>
  call(request, "POST", `${base(ORG)}/ai/${task}`, email, data);

const storedContext = (draftId: string) =>
  withDb(async (db) => JSON.stringify((await db.query("SELECT context FROM public.ai_drafts WHERE id = $1", [draftId])).rows[0].context));

let assessmentId = "";
let answered = "";
let unanswered = "";
let gapId = "";
let actionId = "";

test.describe.configure({ mode: "serial" });

test.beforeAll(async ({ playwright }) => {
  test.setTimeout(120_000);
  await createE2eTenant(TENANT);
  const request = await playwright.request.newContext({ baseURL: test.info().project.use.baseURL });
  const scope = await call(request, "PUT", `${base(ORG)}/scope`, ADMIN.email, {
    industryCode: "general",
    dataPrincipalCountEstimate: 1200,
    answers: {
      childrenData: "no",
      usesDataProcessors: "no",
      aiUsageTypes: [],
      marketingTracking: "no",
      crossBorder: "no",
      multiLocation: false,
      publicFacingPortal: "no",
      sensitiveDocuments: "no",
    },
  });
  expect(scope.status, scope.text).toBe(200);
  const created = await call(request, "POST", `${base(ORG)}/assessments`, ADMIN.email, { name: "E2E AI Helpers Baseline" });
  expect(created.status, created.text).toBe(201);
  assessmentId = created.json.data.assessment.id;
  const questions = (await call(request, "GET", `${base(ORG)}/assessments/${assessmentId}/questions`, ADMIN.email)).json.data
    .questions as { questionCode: string; domainCode: string }[];
  const security = questions.filter((q) => q.domainCode === "SECURITY");
  answered = security[0]!.questionCode;
  unanswered = security[1]!.questionCode;
  const answer = await call(request, "PUT", `${base(ORG)}/assessments/${assessmentId}/responses/${answered}`, ADMIN.email, {
    applicabilityDecision: "applicable",
    claimedMaturity: 4,
  });
  expect([200, 201], answer.text).toContain(answer.status);
  const generated = await call(request, "POST", `${base(ORG)}/assessments/${assessmentId}/gaps/generate`, ADMIN.email);
  expect(generated.status, generated.text).toBe(200);
  const register = await call(request, "GET", `${base(ORG)}/assessments/${assessmentId}/gaps`, ADMIN.email);
  const gap = (register.json.data.gaps as { id: string; questionCode: string; actions: { id: string }[] }[]).find((g) => g.questionCode === answered)!;
  gapId = gap.id;
  actionId = gap.actions[0]!.id;
  const on = await call(request, "PATCH", base(ORG), ADMIN.email, { ai: { enabled: true, contractRef: "E2E-DPA-HELPERS" } });
  expect(on.status, on.text).toBe(200);
  await request.dispose();
});

test.afterAll(async () => {
  await removeE2eTenant(TENANT);
});

test.describe("the Evidence Helper", () => {
  test("explains the evidence on an answer: verdicts and whether it held the claim down — no level, no code", async ({ request }) => {
    const res = await run(request, "evidence_helper", { assessmentId, questionCode: answered });
    expect(res.status, res.text).toBe(200);
    expect(res.json.data.draft).toMatchObject({ task: "evidence_helper", status: "draft" });
    expect(res.json.data.draft.target).toEqual({ type: "assessment_response", id: assessmentId, key: answered });
    expect(res.json.data.draft.answer).toMatchObject({ requiresHumanReview: true, legalReviewRequired: false });
    const context = await storedContext(res.json.data.draft.id);
    expect(context).toContain('"heldDownByEvidence":true');
    expect(context).toContain('"attached":0');
    expect(context).not.toContain(answered);
    expect(context).not.toMatch(/"(evidenceLevel|adjustedScore|questionCode|domainWeight)"/);
  });
  test("an unanswered question has no evidence to explain: a 409, nothing stored", async ({ request }) => {
    const res = await run(request, "evidence_helper", { assessmentId, questionCode: unanswered });
    expect(res.status, res.text).toBe(409);
    expect(res.json.error.message).toMatch(/Answer this question first/);
  });
});

test.describe("the Gap/Action Helper", () => {
  test("explains a gap from the register: owners as roles, actions and their evidence", async ({ request }) => {
    const res = await run(request, "gap_helper", { assessmentId, gapId });
    expect(res.status, res.text).toBe(200);
    expect(res.json.data.draft.target).toEqual({ type: "assessment_gap", id: gapId, key: null });
    const context = await storedContext(res.json.data.draft.id);
    expect(context).toContain('"actions":[{"item":1');
    expect(context).not.toMatch(/"(ownerName|ownerUserId|closedByName|adjustedScore|questionCode)"/);
    expect(context).not.toContain(ADMIN.email);
  });
  test("explains an action from the Actions page, by its id alone", async ({ request }) => {
    const res = await run(request, "gap_helper", { actionId, ask: "What would let us close this action?" }, OWNER.email);
    expect(res.status, res.text).toBe(200);
    expect(res.json.data.draft.target).toEqual({ type: "assessment_gap", id: gapId, key: actionId });
    expect(await storedContext(res.json.data.draft.id)).toContain('"askedAbout":true');
  });
  test("Gate 5 — another organisation's action or gap is a plain 404 on this path", async ({ request }) => {
    const foreignAction = await withDb(
      async (db) =>
        (await db.query("SELECT id FROM public.gap_actions WHERE organization_id = $1 AND gap_id IS NOT NULL LIMIT 1", [SEED_ORGS.mumbaiUniversity.id]))
          .rows[0]?.id as string | undefined,
    );
    if (foreignAction) {
      const res = await run(request, "gap_helper", { actionId: foreignAction });
      expect(res.status, res.text).toBe(404);
    }
    const gap = await run(request, "gap_helper", { assessmentId: SEED_ASSESSMENTS.muBaseline.id, gapId });
    expect(gap.status, gap.text).toBe(404);
    expect(gap.text).not.toContain(SEED_ORGS.mumbaiUniversity.name);
  });
});

test.describe("the Score Helper", () => {
  test("explains a domain from the stored score: by how much evidence held it down — never the weight", async ({ request }) => {
    const res = await run(request, "score_helper", { assessmentId, domainCode: "SECURITY" });
    expect(res.status, res.text).toBe(200);
    expect(res.json.data.draft.target).toEqual({ type: "assessment_domain", id: assessmentId, key: "SECURITY" });
    const context = JSON.parse(await storedContext(res.json.data.draft.id));
    expect(context.evidenceEffect).toMatchObject({ known: true, applicableAnswers: 1, answersHeldDownByEvidence: 1, answerPointsHeldDown: 3 });
    expect(context.domain).toMatchObject({ area: "Security safeguards", provisional: true, finalised: false });
    expect(JSON.stringify(context)).not.toMatch(/"(weight|domainWeight|scoreCap|redFlags|avgAdjusted)"/);
  });
  test("its answer may never say the score was changed (§4.11)", async ({ request }) => {
    const res = await run(request, "score_helper", { assessmentId, domainCode: "SECURITY", ask: "[fake:changes_score]" });
    expect(res.status, res.text).toBe(422);
    expect(res.json.error.details).toContainEqual({ field: "rejection", issue: "wording" });
  });
  test("a domain code that is not one of the sixteen is a 400", async ({ request }) => {
    const res = await run(request, "score_helper", { assessmentId, domainCode: "NOPE" });
    expect(res.status, res.text).toBe(400);
  });
});

test.describe("thumbs up / down (§4.13)", () => {
  test("the person who asked rates an answer once, with a comment that is scrubbed — audited without it", async ({ request }) => {
    const asked = await run(request, "question_helper", { assessmentId, questionCode: answered });
    expect(asked.status, asked.text).toBe(200);
    const id = asked.json.data.draft.id as string;
    const url = `${base(ORG)}/ai/drafts/${id}/feedback`;

    const other = await call(request, "POST", url, OWNER.email, { feedback: "down" });
    expect(other.status, other.text).toBe(403);

    const rated = await call(request, "POST", url, ADMIN.email, { feedback: "up", comment: "Helpful. Mail me at ravi.k@example.com" });
    expect(rated.status, rated.text).toBe(200);
    expect(rated.json.data.draft).toMatchObject({ id, feedback: "up" });
    await withDb(async (db) => {
      const { rows } = await db.query("SELECT feedback_comment, feedback_by FROM public.ai_drafts WHERE id = $1", [id]);
      expect(rows[0]).toEqual({ feedback_comment: "Helpful. Mail me at [email removed]", feedback_by: ADMIN.id });
      const audit = await db.query("SELECT metadata FROM public.audit_logs WHERE entity_id = $1 AND event_type = 'ai.feedback'", [id]);
      expect(audit.rows).toHaveLength(1);
      expect(audit.rows[0].metadata).toMatchObject({ feedback: "up", withComment: true, task: "question_helper" });
      expect(JSON.stringify(audit.rows)).not.toContain("Helpful");
    });

    const again = await call(request, "POST", url, ADMIN.email, { feedback: "down" });
    expect(again.status, again.text).toBe(409);
  });
  test("a rejected call cannot be rated; a stray field or another organisation's path is refused", async ({ request }) => {
    const rejected = await run(request, "question_helper", { assessmentId, questionCode: answered, ask: "[fake:certifies]" });
    expect(rejected.status, rejected.text).toBe(422);
    const draftId = (rejected.json.error.details as { field: string; issue: string }[]).find((d) => d.field === "draftId")!.issue;
    const res = await call(request, "POST", `${base(ORG)}/ai/drafts/${draftId}/feedback`, ADMIN.email, { feedback: "down" });
    expect(res.status, res.text).toBe(409);
    const stray = await call(request, "POST", `${base(ORG)}/ai/drafts/${draftId}/feedback`, ADMIN.email, { feedback: "up", rating: 5 });
    expect(stray.status, stray.text).toBe(400);
    const outsider = await call(request, "POST", `${base(ORG)}/ai/drafts/${draftId}/feedback`, SEED_USERS.bharatManufacturing.email, { feedback: "up" });
    expect(outsider.status, outsider.text).toBe(403);
    expect(outsider.json.error.code).toBe("TENANT_ACCESS_DENIED");
  });
});
