/**
 * Slice 11, Stage 2a — drafts for the registers, end to end through the API
 * (SLICE_11 §7b; D-129): a processing record from a description, the Board
 * intimation under Rule 7(2) from a breach, a response from a rights request;
 * accept (with the person's edits) or discard, by a register writer.
 *
 * The point of the stage: NOTHING WRITES A REGISTER ROW WITHOUT A PERSON. Every
 * test checks the register's own table is untouched after a draft and after an
 * accept — the person saves through the register's own form (the UI spec).
 *
 * Runs against the RECORDED FAKE (`AI_PROVIDER=fake`): no live model call. Drafts
 * are permanent, so everything runs on a DISPOSABLE tenant, `…a030` (pitfall 5).
 */
import { AI_INTIMATION_PERSON_PLACEHOLDER } from "@truststack/core";
import { expect, test, type APIRequestContext } from "@playwright/test";
import { accessTokenFor, bearer, createE2eTenant, removeE2eTenant, SEED_ORGS, SEED_USERS, withDb } from "../helpers";

const base = (orgId: string) => `/api/v1/organizations/${orgId}`;

const ADMIN = SEED_USERS.muItSecurity;
/** A Department Owner here: writes the registers — accepts a draft another person asked for (D-129.3). */
const WRITER = SEED_USERS.muLegal;
/** An Executive Sponsor here: reads the registers and holds ai.use, writes none. */
const READER = SEED_USERS.muDean;
const OUTSIDER = SEED_USERS.bharatManufacturing;

const TENANT = {
  organizationId: "0b0000ff-0000-4000-8000-00000000a030",
  name: "E2E AI Drafts Tenant",
  industryCode: "general",
  member: { userId: ADMIN.id, email: ADMIN.email },
  roleCode: "organization_admin",
  extraMembers: [
    { userId: WRITER.id, roleCode: "department_owner" },
    { userId: READER.id, roleCode: "executive_sponsor" },
  ],
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
const count = (table: string) =>
  withDb(async (db) => Number((await db.query(`SELECT count(*)::int AS n FROM public.${table} WHERE organization_id = $1`, [ORG])).rows[0].n));
const auditFor = (draftId: string) =>
  withDb(async (db) => (await db.query("SELECT event_type, user_id, metadata FROM public.audit_logs WHERE entity_id = $1 AND event_type LIKE 'ai.draft.%'", [draftId])).rows);

const HOUR = 3_600_000;
const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
let breachId = "";
let requestId = "";

test.describe.configure({ mode: "serial" });

test.beforeAll(async ({ playwright }) => {
  test.setTimeout(120_000);
  await createE2eTenant(TENANT);
  const request = await playwright.request.newContext({ baseURL: test.info().project.use.baseURL });
  const breach = await call(request, "POST", `${base(ORG)}/breaches`, ADMIN.email, {
    title: "Examinations portal account used from outside",
    nature: "unauthorised_access",
    severity: "high",
    awareAt: new Date(Date.now() - 5 * HOUR).toISOString(),
    principalsAffected: 1200,
    dataCategories: "Names, roll numbers, marks",
    description: "A staff account was used from outside. Contact the clerk at clerk.planted@example.com.",
  });
  expect(breach.status, breach.text).toBe(201);
  breachId = breach.json.data.incident.id;
  const told = await call(request, "PATCH", `${base(ORG)}/breaches/${breachId}`, ADMIN.email, {
    principals: { at: new Date(Date.now() - 2 * HOUR).toISOString(), method: "Email to each student" },
  });
  expect(told.status, told.text).toBe(200);
  const rights = await call(request, "POST", `${base(ORG)}/rights-requests`, ADMIN.email, {
    kind: "erasure",
    receivedOn: today,
    channel: "email",
    requesterName: "Asha Fictional-Requester",
    requesterEmail: "asha.fictional@example.com",
    principalIdentifier: "ENROL-FICTIONAL-42",
    summary: "Asks the organisation to delete her hostel records.",
  });
  expect(rights.status, rights.text).toBe(201);
  requestId = rights.json.data.request.id;
  const on = await call(request, "PATCH", base(ORG), ADMIN.email, { ai: { enabled: true, contractRef: "E2E-DPA-DRAFTS" } });
  expect(on.status, on.text).toBe(200);
  await request.dispose();
});

test.afterAll(async () => {
  await removeE2eTenant(TENANT);
});

test.describe("a processing record from a description", () => {
  test("drafts the create form's fields; writes no record; a writer who did not ask accepts it", async ({ request }) => {
    const before = await count("ropa_records");
    const res = await run(request, "ropa_draft", {
      description: "Through the admissions portal we collect applicants' names, contact details and marks. Questions to admissions.planted@example.com.",
    });
    expect(res.status, res.text).toBe(200);
    const draft = res.json.data.draft;
    expect(draft).toMatchObject({ task: "ropa_draft", status: "draft", target: { type: "ropa_new", id: null, key: null } });
    expect(draft.answer).toMatchObject({ kind: "draft", requiresHumanReview: true, legalReviewRequired: false });
    expect(draft.answer.draft).toMatchObject({ name: expect.any(String), purpose: expect.any(String) });
    expect(draft.answer.draft).not.toHaveProperty("riskRatingAssessor");
    expect(draft.answer.draft).not.toHaveProperty("status");
    expect(await storedContext(draft.id)).not.toContain("admissions.planted@example.com");
    expect(await count("ropa_records")).toBe(before);

    const edited = { ...draft.answer.draft, name: "Undergraduate admissions (edited)" };
    const accepted = await call(request, "POST", `${base(ORG)}/ai/drafts/${draft.id}/accept`, WRITER.email, { output: edited });
    expect(accepted.status, accepted.text).toBe(200);
    expect(accepted.json.data.draft).toMatchObject({ status: "accepted", acceptedOutput: edited, decidedByName: expect.any(String) });
    expect(await count("ropa_records")).toBe(before);

    // The new-record form reads it back to pre-fill; a second decision is refused.
    const read = await call(request, "GET", `${base(ORG)}/ai/drafts/${draft.id}`, ADMIN.email);
    expect(read.json.data.draft.acceptedOutput).toEqual(edited);
    const again = await call(request, "POST", `${base(ORG)}/ai/drafts/${draft.id}/discard`, ADMIN.email);
    expect(again.status, again.text).toBe(409);

    const audit = await auditFor(draft.id);
    expect(audit).toHaveLength(1);
    expect(audit[0]).toMatchObject({ event_type: "ai.draft.accepted", user_id: WRITER.id, metadata: { task: "ropa_draft", edited: true } });
    expect(JSON.stringify(audit)).not.toContain("Undergraduate admissions");
  });

  test("an accepted record must still be a valid record: no name, a made-up lawful basis, a status — refused", async ({ request }) => {
    const res = await run(request, "ropa_draft", { description: "The library lends books and records borrowers' names and roll numbers." });
    const d = res.json.data.draft;
    for (const bad of [{ ...d.answer.draft, name: "" }, { ...d.answer.draft, lawfulBasis: "because_we_can" }, { ...d.answer.draft, status: "approved" }]) {
      const r = await call(request, "POST", `${base(ORG)}/ai/drafts/${d.id}/accept`, ADMIN.email, { output: bad });
      expect(r.status, r.text).toBe(400);
    }
  });

  test("a reader of the register may neither ask for a draft nor decide one", async ({ request }) => {
    const ask = await run(request, "ropa_draft", { description: "The library lends books and records borrowers' names." }, READER.email);
    expect(ask.status, ask.text).toBe(403);
    const mine = await run(request, "ropa_draft", { description: "The canteen records staff meal cards and their names." });
    const decide = await call(request, "POST", `${base(ORG)}/ai/drafts/${mine.json.data.draft.id}/discard`, READER.email);
    expect(decide.status, decide.text).toBe(403);
  });
});

test.describe("the Board intimation under Rule 7(2)", () => {
  test("(iv) is the placeholder, (vi) is the register's own record, and it is a legal draft", async ({ request }) => {
    const res = await run(request, "breach_intimation_draft", { breachId });
    expect(res.status, res.text).toBe(200);
    const a = res.json.data.draft.answer;
    expect(res.json.data.draft.target).toEqual({ type: "breach_incident", id: breachId, key: null });
    expect(a).toMatchObject({ legalReviewRequired: true, counselNote: "For review by counsel before use." });
    expect(a.draft.personFindings).toBe(AI_INTIMATION_PERSON_PLACEHOLDER);
    expect(a.draft.principalsReport).toMatch(/^The affected Data Principals were informed on .* IST, by: Email to each student/);
    const context = await storedContext(res.json.data.draft.id);
    expect(context).not.toContain("clerk.planted@example.com");
    expect(context).not.toMatch(/"(createdByName|closedByName|dismissalReason|incidentCode)"/);
  });

  test("accepting keeps the person's text on the draft and records nothing on the breach (D-129.1)", async ({ request }) => {
    const res = await run(request, "breach_intimation_draft", { breachId });
    const d = res.json.data.draft;
    const edited = { ...d.answer.draft, personFindings: "Our review found a reused staff password; no individual is named." };
    const accepted = await call(request, "POST", `${base(ORG)}/ai/drafts/${d.id}/accept`, WRITER.email, { output: edited });
    expect(accepted.status, accepted.text).toBe(200);
    const list = await call(request, "GET", `${base(ORG)}/ai/drafts?targetId=${breachId}&status=accepted`, READER.email);
    expect(list.status, list.text).toBe(200);
    expect(list.json.data.drafts[0]).toMatchObject({ id: d.id, task: "breach_intimation_draft", acceptedOutput: edited });
    const breach = await call(request, "GET", `${base(ORG)}/breaches/${breachId}`, ADMIN.email);
    expect(breach.json.data.incident.board.report).toBeNull();
  });

  test("a dismissed breach has no intimation to draft — a 409, nothing stored", async ({ request }) => {
    const other = await call(request, "POST", `${base(ORG)}/breaches`, ADMIN.email, {
      title: "Suspected loss, found the next day",
      nature: "loss_or_destruction",
      severity: "medium",
      awareAt: new Date(Date.now() - HOUR).toISOString(),
    });
    expect(other.status, other.text).toBe(201);
    const dismissed = await call(request, "PATCH", `${base(ORG)}/breaches/${other.json.data.incident.id}`, ADMIN.email, {
      status: "dismissed",
      dismissalReason: "The laptop was found locked in the office; no personal data was affected.",
    });
    expect(dismissed.status, dismissed.text).toBe(200);
    const res = await run(request, "breach_intimation_draft", { breachId: other.json.data.incident.id });
    expect(res.status, res.text).toBe(409);
  });
});

test.describe("a response to a rights request", () => {
  test("carries no identity, keeps its placeholders, never an outcome — and accepting records no response", async ({ request }) => {
    const res = await run(request, "rights_response_draft", { requestId });
    expect(res.status, res.text).toBe(200);
    const d = res.json.data.draft;
    expect(d.answer).toMatchObject({ legalReviewRequired: true });
    expect(Object.keys(d.answer.draft).sort()).toEqual(["letter", "summary"]);
    expect(d.answer.draft.letter).toContain("Dear [Name],");
    const context = await storedContext(d.id);
    for (const v of ["Asha", "asha.fictional@example.com", "ENROL-FICTIONAL-42"]) expect(context).not.toContain(v);

    const accepted = await call(request, "POST", `${base(ORG)}/ai/drafts/${d.id}/accept`, ADMIN.email, {
      output: { letter: d.answer.draft.letter, summary: d.answer.draft.summary },
    });
    expect(accepted.status, accepted.text).toBe(200);
    const req = await call(request, "GET", `${base(ORG)}/rights-requests/${requestId}`, ADMIN.email);
    expect(req.json.data.request).toMatchObject({ status: "open", response: null });
  });

  test("an outcome is never accepted as part of the draft", async ({ request }) => {
    const res = await run(request, "rights_response_draft", { requestId });
    const r = await call(request, "POST", `${base(ORG)}/ai/drafts/${res.json.data.draft.id}/accept`, ADMIN.email, {
      output: { letter: "Dear [Name],", summary: "", outcome: "fulfilled" },
    });
    expect(r.status, r.text).toBe(400);
  });

  test("a letter stating the outcome, or dropping its placeholders, is not kept (422)", async ({ request }) => {
    for (const scenario of ["states_outcome", "no_placeholders"]) {
      const res = await run(request, "rights_response_draft", { requestId, ask: `[fake:${scenario}]` });
      expect(res.status, res.text).toBe(422);
      expect(res.json.error.code).toBe("AI_ANSWER_REJECTED");
      if (scenario === "states_outcome") expect(res.json.error.message).toMatch(/decided the outcome of the request/);
    }
  });
});

test.describe("Gate 5 — another organisation's drafts", () => {
  test("an outsider is refused on this tenant's path; this tenant's draft is a 404 on another organisation's path", async ({ request }) => {
    const res = await run(request, "rights_response_draft", { requestId });
    const id = res.json.data.draft.id;
    const outsider = await call(request, "POST", `${base(ORG)}/ai/drafts/${id}/discard`, OUTSIDER.email);
    expect(outsider.status, outsider.text).toBe(403);
    const elsewhere = await call(request, "POST", `${base(SEED_ORGS.mumbaiUniversity.id)}/ai/drafts/${id}/discard`, ADMIN.email);
    expect(elsewhere.status, elsewhere.text).toBe(404);
    const read = await call(request, "GET", `${base(SEED_ORGS.mumbaiUniversity.id)}/ai/drafts/${id}`, ADMIN.email);
    expect(read.status, read.text).toBe(404);
    const discarded = await call(request, "POST", `${base(ORG)}/ai/drafts/${id}/discard`, WRITER.email);
    expect(discarded.status, discarded.text).toBe(200);
  });
});
