/**
 * Slice 11, Stage 2b — a privacy notice drafted from the processing register, its
 * Hindi or Marathi translation, and a report's narrative, end to end through the API
 * (SLICE_11 §7c; D-133).
 *
 * The points of the stage, each checked here:
 *   * NOTHING WRITES A NOTICE WITHOUT A PERSON — the notices table is untouched after
 *     a draft and after an accept; the person saves in the notice editor (the UI spec).
 *   * A notice is drafted from the consent-based records only (D-133.3, s.5(1)).
 *   * A translation keeps every purpose's key (D-133.2) — the model's and the person's.
 *   * A narrated report is version N's STORED figures with the narrative in front, as a
 *     NEW version a person prints (D-133.1); every number must be the report's own.
 *
 * Runs against the RECORDED FAKE (`AI_PROVIDER=fake`). Drafts and reports are
 * permanent, so everything runs on a DISPOSABLE tenant, `…a032` (pitfall 5).
 */
import { AI_NARRATIVE_NUMBERS_MESSAGE, AI_NARRATIVE_SECTION_TITLE, AI_TRANSLATION_KEYS_MESSAGE } from "@truststack/core";
import { expect, test, type APIRequestContext } from "@playwright/test";
import { pdfText, squash } from "../../tests/support/pdf-text";
import { accessTokenFor, bearer, createE2eTenant, removeE2eTenant, SEED_USERS, withDb } from "../helpers";

const base = (orgId: string) => `/api/v1/organizations/${orgId}`;

const ADMIN = SEED_USERS.muItSecurity;
/** A Department Owner here: consent.write (decides a notice draft), no report.generate. */
const WRITER = SEED_USERS.muLegal;
/** An Executive Sponsor here: reads consent and reports, holds ai.use, writes neither. */
const READER = SEED_USERS.muDean;
const OUTSIDER = SEED_USERS.bharatManufacturing;

const TENANT = {
  organizationId: "0b0000ff-0000-4000-8000-00000000a032",
  name: "E2E AI Notice and Narrative Tenant",
  industryCode: "general",
  member: { userId: ADMIN.id, email: ADMIN.email },
  roleCode: "organization_admin",
  extraMembers: [
    { userId: WRITER.id, roleCode: "department_owner" },
    { userId: READER.id, roleCode: "executive_sponsor" },
  ],
};
const ORG = TENANT.organizationId;
const KEYS = ["admissions", "alumni_updates"];

async function call(request: APIRequestContext, method: string, url: string, email: string, data?: object) {
  const res = await request.fetch(url, { method, headers: bearer(await accessTokenFor(email)), ...(data ? { data } : {}) });
  const text = await res.text();
  return { status: res.status(), text, json: text ? JSON.parse(text) : null };
}
const run = (request: APIRequestContext, task: string, data: object, email: string = ADMIN.email) => call(request, "POST", `${base(ORG)}/ai/${task}`, email, data);

const storedContext = (draftId: string) =>
  withDb(async (db) => JSON.stringify((await db.query("SELECT context FROM public.ai_drafts WHERE id = $1", [draftId])).rows[0].context));
const count = (table: string) =>
  withDb(async (db) => Number((await db.query(`SELECT count(*)::int AS n FROM public.${table} WHERE organization_id = $1`, [ORG])).rows[0].n));

let noticeId = "";
let draftNoticeId = "";

test.describe.configure({ mode: "serial" });

test.beforeAll(async ({ playwright }) => {
  test.setTimeout(120_000);
  await createE2eTenant(TENANT);
  const request = await playwright.request.newContext({ baseURL: test.info().project.use.baseURL });
  // Three records: consent, an s.7(i) legitimate use, and one whose basis is not yet decided.
  for (const r of [
    { name: "Alumni newsletter", purpose: "Alumni news. Write to alumni.planted@example.com.", dataCategories: "Name, email address", lawfulBasis: "consent" },
    { name: "Staff payroll", purpose: "Paying salaries", dataCategories: "Bank account, PAN", lawfulBasis: "employment" },
    { name: "Event registration", purpose: "Registering people for events", dataCategories: "Name, email address" },
  ]) {
    const created = await call(request, "POST", `${base(ORG)}/ropa`, ADMIN.email, r);
    expect(created.status, created.text).toBe(201);
  }
  const notice = await call(request, "POST", `${base(ORG)}/privacy-notices`, ADMIN.email, {
    language: "en",
    title: "How we use your personal data",
    summary: "This notice explains what we ask your consent for.",
    purposes: [
      { key: "admissions", title: "Admissions", uses: "Deciding your application", dataItems: ["Name", "Marks"] },
      { key: "alumni_updates", title: "Alumni updates", uses: "Sending alumni news", dataItems: ["Name", "Email address"] },
    ],
  });
  expect(notice.status, notice.text).toBe(201);
  noticeId = notice.json.data.notice.id;
  const published = await call(request, "PATCH", `${base(ORG)}/privacy-notices/${noticeId}`, ADMIN.email, { status: "published" });
  expect(published.status, published.text).toBe(200);
  const draft = await call(request, "POST", `${base(ORG)}/privacy-notices`, ADMIN.email, { language: "en", title: "A draft notice", purposes: [] });
  expect(draft.status, draft.text).toBe(201);
  draftNoticeId = draft.json.data.notice.id;
  const on = await call(request, "PATCH", base(ORG), ADMIN.email, { ai: { enabled: true, contractRef: "E2E-DPA-NOTICE" } });
  expect(on.status, on.text).toBe(200);
  await request.dispose();
});

test.afterAll(async () => {
  await removeE2eTenant(TENANT);
});

test.describe("a privacy notice from the processing register (D-133.3)", () => {
  test("drafts from the consent-based records only; writes no notice; a consent writer who did not ask accepts it", async ({ request }) => {
    const before = await count("privacy_notices");
    const res = await run(request, "notice_draft", {});
    expect(res.status, res.text).toBe(200);
    const draft = res.json.data.draft;
    expect(draft).toMatchObject({ task: "notice_draft", status: "draft", target: { type: "notice_new", id: null, key: null } });
    expect(draft.answer).toMatchObject({ kind: "draft", requiresHumanReview: true, legalReviewRequired: true });
    expect(draft.answer.draft).toMatchObject({ language: "en", title: expect.any(String), purposes: expect.any(Array) });
    for (const k of ["withdrawMeans", "rightsMeans", "complaintMeans", "status"]) expect(draft.answer.draft).not.toHaveProperty(k);
    const context = await storedContext(draft.id);
    expect(context).toContain("Alumni newsletter");
    expect(context).toContain("Event registration");
    expect(context).not.toContain("Staff payroll");
    expect(context).not.toContain("alumni.planted@example.com");
    expect(await count("privacy_notices")).toBe(before);

    const edited = { ...draft.answer.draft, title: "How we use your personal data (edited)" };
    const accepted = await call(request, "POST", `${base(ORG)}/ai/drafts/${draft.id}/accept`, WRITER.email, { output: edited });
    expect(accepted.status, accepted.text).toBe(200);
    expect(accepted.json.data.draft).toMatchObject({ status: "accepted", acceptedOutput: edited });
    expect(await count("privacy_notices")).toBe(before);
  });

  test("a person without consent.write may not ask, nor accept; an outsider reaches nothing", async ({ request }) => {
    expect((await run(request, "notice_draft", {}, READER.email)).status).toBe(403);
    const d = (await run(request, "notice_draft", {})).json.data.draft;
    expect((await call(request, "POST", `${base(ORG)}/ai/drafts/${d.id}/accept`, READER.email, { output: d.answer.draft })).status).toBe(403);
    expect((await run(request, "notice_draft", {}, OUTSIDER.email)).status).toBe(403);
    expect((await call(request, "GET", `${base(ORG)}/ai/drafts/${d.id}`, OUTSIDER.email)).status).toBe(403);
  });

  test("an accepted notice must still be a notice: a status, an empty title or a bad key are refused", async ({ request }) => {
    const d = (await run(request, "notice_draft", {})).json.data.draft;
    const purposes = d.answer.draft.purposes as { key: string }[];
    for (const bad of [
      { ...d.answer.draft, status: "published" },
      { ...d.answer.draft, title: "" },
      { ...d.answer.draft, purposes: [{ ...purposes[0], key: "Not A Key" }] },
      { ...d.answer.draft, withdrawMeans: "Write to us" },
    ]) {
      const r = await call(request, "POST", `${base(ORG)}/ai/drafts/${d.id}/accept`, ADMIN.email, { output: bad });
      expect(r.status, r.text).toBe(400);
    }
  });
});

test.describe("a translation keeps every purpose's key (D-133.2)", () => {
  test("Hindi: the source notice's keys and count, in the language asked for; a new notice only when the person saves", async ({ request }) => {
    const before = await count("privacy_notices");
    const res = await run(request, "notice_translation_draft", { noticeId, language: "hi" });
    expect(res.status, res.text).toBe(200);
    const draft = res.json.data.draft;
    expect(draft).toMatchObject({ task: "notice_translation_draft", target: { type: "privacy_notice", id: noticeId, key: "hi" } });
    expect(draft.answer.draft.language).toBe("hi");
    expect((draft.answer.draft.purposes as { key: string }[]).map((p) => p.key).sort()).toEqual([...KEYS].sort());
    expect(draft.answer.legalReviewRequired).toBe(true);

    // The person's edit must keep the keys too.
    const renamed = { ...draft.answer.draft, purposes: (draft.answer.draft.purposes as { key: string }[]).map((p, i) => (i === 0 ? { ...p, key: "pravesh" } : p)) };
    const refused = await call(request, "POST", `${base(ORG)}/ai/drafts/${draft.id}/accept`, ADMIN.email, { output: renamed });
    expect(refused.status, refused.text).toBe(422);
    const accepted = await call(request, "POST", `${base(ORG)}/ai/drafts/${draft.id}/accept`, ADMIN.email, { output: draft.answer.draft });
    expect(accepted.status, accepted.text).toBe(200);
    expect(await count("privacy_notices")).toBe(before);
  });

  test("Marathi too; any other language, a draft notice or the notice's own language is refused", async ({ request }) => {
    const mr = await run(request, "notice_translation_draft", { noticeId, language: "mr" });
    expect(mr.status, mr.text).toBe(200);
    expect(mr.json.data.draft.answer.draft.language).toBe("mr");
    expect((await run(request, "notice_translation_draft", { noticeId, language: "ta" })).status).toBe(400);
    expect((await run(request, "notice_translation_draft", { noticeId: draftNoticeId, language: "hi" })).status).toBe(409);
    expect((await run(request, "notice_translation_draft", { noticeId: "0b000000-0000-4000-8000-0000000fffff", language: "hi" })).status).toBe(404);
  });

  test("a model that renames a key is not kept — the whole chain", async ({ request }) => {
    const res = await run(request, "notice_translation_draft", { noticeId, language: "hi", ask: "[fake:renamed_key]" });
    expect(res.status, res.text).toBe(422);
    expect(res.json.error).toMatchObject({ code: "AI_ANSWER_REJECTED", message: AI_TRANSLATION_KEYS_MESSAGE });
  });
});

test.describe("a report's narrative — version N's stored figures, printed as version N+1 (D-133.1)", () => {
  let v1: { id: string; version: number; exposureSnapshotId: string; byteSize: number } = { id: "", version: 0, exposureSnapshotId: "", byteSize: 0 };
  let narrativeId = "";

  test("an Exposure Brief keeps its document and may carry a narrative; a spreadsheet may not", async ({ request }) => {
    const brief = await call(request, "POST", `${base(ORG)}/reports`, ADMIN.email, { kind: "exposure_brief" });
    expect(brief.status, brief.text).toBe(201);
    v1 = brief.json.data.report;
    expect(brief.json.data.report.narratable).toBe(true);
    const stored = await withDb(async (db) => (await db.query("SELECT document->>'kind' AS k FROM public.reports WHERE id = $1", [v1.id])).rows[0].k);
    expect(stored).toBe("exposure_brief");
    const sheet = await call(request, "POST", `${base(ORG)}/reports`, ADMIN.email, { kind: "evidence_index" });
    expect(sheet.json.data.report.narratable).toBe(false);
    expect((await run(request, "report_narrative_draft", { reportId: sheet.json.data.report.id })).status).toBe(409);
  });

  test("drafts from the stored document, names masked; a figure the report lacks is not kept", async ({ request }) => {
    const res = await run(request, "report_narrative_draft", { reportId: v1.id });
    expect(res.status, res.text).toBe(200);
    const draft = res.json.data.draft;
    narrativeId = draft.id;
    expect(draft).toMatchObject({ task: "report_narrative_draft", target: { type: "report", id: v1.id } });
    expect(draft.answer.draft).toMatchObject({ headline: expect.any(String), paragraphs: expect.any(Array), bullets: expect.any(Array) });
    expect(await storedContext(draft.id)).not.toContain(ADMIN.fullName);

    const invented = await run(request, "report_narrative_draft", { reportId: v1.id, ask: "[fake:invented_number]" });
    expect(invented.status, invented.text).toBe(422);
    expect(invented.json.error.message).toBe(AI_NARRATIVE_NUMBERS_MESSAGE);
    // …and a person's edit is held to the same rule.
    const bad = { ...draft.answer.draft, paragraphs: ["9,999 actions are overdue."] };
    const refused = await call(request, "POST", `${base(ORG)}/ai/drafts/${draft.id}/accept`, ADMIN.email, { output: bad });
    expect(refused.status, refused.text).toBe(422);
    expect(refused.json.error.message).toContain("9999");
    // A reader without report.generate may not ask.
    expect((await run(request, "report_narrative_draft", { reportId: v1.id }, READER.email)).status).toBe(403);
  });

  test("accepting prints nothing; the list offers to print it; only report.generate prints it", async ({ request }) => {
    const before = await count("reports");
    const draft = (await call(request, "GET", `${base(ORG)}/ai/drafts/${narrativeId}`, ADMIN.email)).json.data.draft;
    const accepted = await call(request, "POST", `${base(ORG)}/ai/drafts/${narrativeId}/accept`, ADMIN.email, { output: draft.answer.draft });
    expect(accepted.status, accepted.text).toBe(200);
    expect(await count("reports")).toBe(before);
    const list = await call(request, "GET", `${base(ORG)}/reports?kind=exposure_brief`, ADMIN.email);
    expect(list.json.data.reports.find((r: { id: string }) => r.id === v1.id).pendingNarrativeDraftId).toBe(narrativeId);
    const writer = await call(request, "POST", `${base(ORG)}/reports/${v1.id}/narrate`, WRITER.email, { draftId: narrativeId });
    expect(writer.status, writer.text).toBe(403);
  });

  test("version N+1: the same snapshot and date, the narrative in front of the same figures; version N untouched; once", async ({ request }) => {
    const res = await call(request, "POST", `${base(ORG)}/reports/${v1.id}/narrate`, ADMIN.email, { draftId: narrativeId });
    expect(res.status, res.text).toBe(201);
    const v2 = res.json.data.report;
    expect(v2).toMatchObject({ kind: "exposure_brief", version: v1.version + 1, status: "ready", exposureSnapshotId: v1.exposureSnapshotId, narratedFromId: v1.id, narratable: false });
    expect(res.json.data.narratedFrom).toEqual({ id: v1.id, version: v1.version });

    const [a, b] = await withDb(async (db) =>
      (await db.query("SELECT id, document, byte_size FROM public.reports WHERE id = ANY($1) ORDER BY version", [[v1.id, v2.id]])).rows,
    );
    expect(Number(a.byte_size)).toBe(v1.byteSize);
    expect(b.document.sections.slice(1)).toEqual(a.document.sections);
    expect(b.document.sections[0].title).toBe(AI_NARRATIVE_SECTION_TITLE);

    const signed = await call(request, "GET", `${base(ORG)}/reports/${v2.id}/download-url`, ADMIN.email);
    const file = await request.get(signed.json.data.url);
    const text = squash((await pdfText(Buffer.from(await file.body()))).text);
    expect(text).toContain(AI_NARRATIVE_SECTION_TITLE);
    expect(text).toContain(`As recorded in version ${v1.version}`);
    expect(text.toLowerCase()).not.toMatch(/\bcompliant\b/);

    expect((await call(request, "POST", `${base(ORG)}/reports/${v1.id}/narrate`, ADMIN.email, { draftId: narrativeId })).status).toBe(409);
    expect((await run(request, "report_narrative_draft", { reportId: v2.id })).status).toBe(409);
    const list = await call(request, "GET", `${base(ORG)}/reports?kind=exposure_brief`, ADMIN.email);
    expect(list.json.data.reports.find((r: { id: string }) => r.id === v1.id).pendingNarrativeDraftId).toBeNull();
  });

  test("Gate 5: an outsider neither drafts, reads nor prints Org A's narrative", async ({ request }) => {
    expect((await run(request, "report_narrative_draft", { reportId: v1.id }, OUTSIDER.email)).status).toBe(403);
    expect((await call(request, "POST", `${base(ORG)}/reports/${v1.id}/narrate`, OUTSIDER.email, { draftId: narrativeId })).status).toBe(403);
  });
});
