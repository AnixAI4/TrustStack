/**
 * Slice 10, Stage 4b — the vendor-facing questionnaire link through the API:
 * staff send and revoke it; the respondent confirms the address with a code,
 * answers, uploads a document, signs the declaration and submits; the link's
 * sender may not review (D-092) — and GATE 5 for the public surface.
 *
 * An accepted assessment is never deleted, so nothing here touches MU or BML
 * (SLICE_10 pitfall 7). Two disposable tenants: a HEALTHCARE one (`…a01d`) —
 * not a university (D-040) — whose CISO enters, Legal sends, the Organisation
 * Admin reviews and the Executive Sponsor only reads; and a second (`…a01e`)
 * whose own link must never reach the first.
 */
import { maskEmail, SCORED_VENDOR_QUESTIONS } from "@truststack/core";
import { expect, test, type APIRequestContext } from "@playwright/test";
import {
  accessTokenFor,
  bearer,
  createE2eTenant,
  giveVendorLinkKnownCode,
  giveVendorLinkKnownToken,
  removeE2eTenant,
  SEED_USERS,
  withDb,
} from "../helpers";

/** IT and security here: vendor.assess, never vendor.review. */
const CISO = SEED_USERS.muItSecurity;
/** Legal here: vendor.assess and vendor.review — and the link's sender. */
const LEGAL = SEED_USERS.muLegal;
/** Organisation Admin here: the second person. */
const ADMIN = SEED_USERS.muAdmin;
/** Executive Sponsor here: reads only. */
const SPONSOR = SEED_USERS.muDean;

const HEALTH = {
  organizationId: "0b0000ff-0000-4000-8000-00000000a01d",
  name: "E2E Vendor Link Healthcare Tenant",
  industryCode: "healthcare",
  member: { userId: ADMIN.id, email: ADMIN.email },
  roleCode: "organization_admin",
  extraMembers: [
    { userId: CISO.id, roleCode: "it_security_user" },
    { userId: LEGAL.id, roleCode: "legal_user" },
    { userId: SPONSOR.id, roleCode: "executive_sponsor" },
  ],
};
const OTHER = {
  organizationId: "0b0000ff-0000-4000-8000-00000000a01e",
  name: "E2E Vendor Link Other Tenant",
  industryCode: "general",
  member: { userId: ADMIN.id, email: ADMIN.email },
  roleCode: "organization_admin",
};

const RESPONDENT = "e2e-vendor-link-respondent@example.com";
const orgOf = (t: { organizationId: string }) => `/api/v1/organizations/${t.organizationId}`;
const linkUrl = (token: string) => `/api/v1/vendor-links/${token}`;

async function call(request: APIRequestContext, method: "get" | "post" | "patch" | "delete", url: string, email: string, data?: object) {
  const res = await request[method](url, { headers: bearer(await accessTokenFor(email)), ...(data ? { data } : {}) });
  const text = await res.text();
  return { status: res.status(), json: text ? JSON.parse(text) : null, text };
}

/** The respondent: no Supabase session, only the link's own cookie when they have one. */
async function pub(request: APIRequestContext, method: "get" | "post" | "patch", url: string, cookie: string | null, data?: object) {
  const res = await request[method](url, { headers: { ...(cookie ? { Cookie: cookie } : {}), "X-Forwarded-For": "198.51.100.77" }, ...(data ? { data } : {}) });
  const text = await res.text();
  return { status: res.status(), json: text ? JSON.parse(text) : null, text, headers: res.headersArray() };
}

/** Every scored question answered with no risk; `docs` cites a document on the answers that need one. */
function complete(docs: Record<string, string> = {}) {
  return SCORED_VENDOR_QUESTIONS.map((q) =>
    q.type === "select"
      ? { code: q.code, answer: q.options!.find((o) => o.riskTenths === 0)!.value }
      : { code: q.code, answer: q.riskyAnswer === "no" ? "yes" : "no", ...(docs[q.code] ? { evidenceId: docs[q.code] } : {}) },
  );
}

async function newVendor(request: APIRequestContext, tenant: { organizationId: string }, name: string) {
  const created = await call(request, "post", `${orgOf(tenant)}/vendors`, ADMIN.email, {
    name,
    vendorRole: "data_processor",
    contractExists: "yes",
    dpdpClauses: "yes",
    crossBorder: "no",
    subProcessorsKnown: "yes",
  });
  expect(created.status, created.text).toBe(201);
  return created.json.data.item.id as string;
}

test.describe.configure({ mode: "serial" });

let vendorId = "";
let assessmentId = "";
let token = "";
let cookie = "";
let documentId = "";

test.beforeAll(async () => {
  await createE2eTenant(HEALTH);
  await createE2eTenant(OTHER);
});
test.afterAll(async () => {
  await removeE2eTenant(HEALTH);
  await removeE2eTenant(OTHER);
});

test("staff send the link (vendor.assess): the token is emailed, never returned; while it is open staff cannot change the answers", async ({ request }) => {
  vendorId = await newVendor(request, HEALTH, "E2E Telehealth Platform");
  const started = await call(request, "post", `${orgOf(HEALTH)}/processors/${vendorId}/assessments`, CISO.email);
  expect(started.status, started.text).toBe(201);
  assessmentId = started.json.data.assessment.id;
  const base = `${orgOf(HEALTH)}/processors/${vendorId}/assessments/${assessmentId}`;

  const body = { respondentName: "E2E Respondent", respondentEmail: RESPONDENT };
  expect((await call(request, "post", `${base}/link`, SPONSOR.email, body)).status).toBe(403);
  expect((await call(request, "post", `${base}/link`, LEGAL.email, { ...body, respondentEmail: "not an email" })).status).toBe(400);
  const sent = await call(request, "post", `${base}/link`, LEGAL.email, body);
  expect(sent.status, sent.text).toBe(201);
  expect(sent.json.data).toMatchObject({
    emailed: true, // example.com is suppressed, not failed
    assessment: { source: "vendor", withVendor: true, openLink: { respondentEmail: RESPONDENT, state: "open", sentBy: LEGAL.id } },
  });
  expect(sent.text).not.toMatch(/token/i);

  const save = await call(request, "patch", base, CISO.email, { sourceNote: "x", answers: [{ code: "C1", answer: "yes" }] });
  expect(save.status, save.text).toBe(409);
  expect((await call(request, "post", `${base}/submit`, CISO.email)).status).toBe(409);
  // Another tenant's path to this assessment is nothing.
  expect((await call(request, "post", `${orgOf(OTHER)}/processors/${vendorId}/assessments/${assessmentId}/link`, ADMIN.email, body)).status).toBe(404);
  expect((await call(request, "delete", `${orgOf(OTHER)}/processors/${vendorId}/assessments/${assessmentId}/link`, ADMIN.email)).status).toBe(404);

  const register = await call(request, "get", `${orgOf(HEALTH)}/processors`, SPONSOR.email);
  expect(register.json.data.counts).toMatchObject({ withVendor: 1, awaitingReview: 0 });
  token = await giveVendorLinkKnownToken(assessmentId);
});

test("every dead or unknown link is the same 404; before the code, only the header", async ({ request }) => {
  const unknown = await pub(request, "get", linkUrl("A".repeat(43)), null);
  expect(unknown.status).toBe(404);
  const malformed = await pub(request, "get", linkUrl("short"), null);
  expect(malformed.status).toBe(404);
  expect(malformed.text.replace(/"(requestId|timestamp)":"[^"]*"/g, "")).toBe(unknown.text.replace(/"(requestId|timestamp)":"[^"]*"/g, ""));

  const header = await pub(request, "get", linkUrl(token), null);
  expect(header.status, header.text).toBe(200);
  expect(header.json.data).toMatchObject({
    status: "unconfirmed",
    organization: { name: HEALTH.name },
    vendor: { name: "E2E Telehealth Platform" },
    respondentName: "E2E Respondent",
    respondentEmail: maskEmail(RESPONDENT),
  });
  expect(header.json.data).not.toHaveProperty("answers");
  const blocked = await pub(request, "patch", linkUrl(token), null, { answers: [{ code: "C1", answer: "no" }] });
  expect(blocked.status).toBe(401);
  expect(blocked.json.error.details[0]).toEqual({ field: "outcome", issue: "unconfirmed" });
});

test("the code proves the address: a wrong one is counted; the right one sets this browser's session cookie", async ({ request }) => {
  const sent = await pub(request, "post", `${linkUrl(token)}/code`, null);
  expect(sent.status, sent.text).toBe(202);
  expect(sent.json.data).toMatchObject({ email: maskEmail(RESPONDENT), emailed: true });
  const wrong = await pub(request, "post", `${linkUrl(token)}/confirm`, null, { code: "000000" });
  expect(wrong.status).toBe(422);
  expect(wrong.json.error.message).toMatch(/4 tries left/);
  const code = await giveVendorLinkKnownCode(token);
  const right = await pub(request, "post", `${linkUrl(token)}/confirm`, null, { code });
  expect(right.status, right.text).toBe(200);
  const setCookie = right.headers.find((h) => h.name.toLowerCase() === "set-cookie")!.value;
  expect(setCookie).toMatch(/^ts_vl_[0-9a-f]{16}=[A-Za-z0-9_-]{43};/);
  expect(setCookie.toLowerCase()).toContain("httponly");
  expect(setCookie.toLowerCase()).toContain("samesite=lax");
  cookie = setCookie.split(";")[0]!;
  const open = await pub(request, "get", linkUrl(token), cookie);
  expect(open.json.data).toMatchObject({ status: "open", missing: SCORED_VENDOR_QUESTIONS.map((q) => q.code) });
  // The code is single use.
  expect((await pub(request, "post", `${linkUrl(token)}/confirm`, null, { code })).status).toBe(410);
});

test("the respondent uploads a document, answers (attributed to nobody here), signs and submits; the link is then used up", async ({ request }) => {
  const doc = "SAMPLE — E2E vendor ISO certificate";
  const issued = await pub(request, "post", `${linkUrl(token)}/documents`, cookie, { fileName: "iso.txt", contentType: "text/plain", byteSize: Buffer.byteLength(doc) });
  expect(issued.status, issued.text).toBe(201);
  documentId = issued.json.data.document.id;
  // Not uploaded yet: it cannot be attached.
  expect((await pub(request, "post", `${linkUrl(token)}/documents/${documentId}/attach`, cookie)).status).toBe(409);
  const put = await request.put(issued.json.data.upload.url, { data: Buffer.from(doc), headers: { "Content-Type": "text/plain" } });
  expect(put.status()).toBe(200);
  const attached = await pub(request, "post", `${linkUrl(token)}/documents/${documentId}/attach`, cookie);
  expect(attached.status, attached.text).toBe(201);
  // No session, no upload.
  expect((await pub(request, "post", `${linkUrl(token)}/documents`, null, { fileName: "x.txt", contentType: "text/plain", byteSize: 1 })).status).toBe(401);

  const saved = await pub(request, "patch", linkUrl(token), cookie, { answers: complete({ A3: documentId }) });
  expect(saved.status, saved.text).toBe(200);
  expect(saved.json.data.missing).toEqual([]);
  // The declaration is required, ticked.
  const unsigned = await pub(request, "post", `${linkUrl(token)}/submit`, cookie, { declaredName: "E2E Respondent", declaredRole: "CISO", accurate: false });
  expect(unsigned.status).toBe(400);
  const submitted = await pub(request, "post", `${linkUrl(token)}/submit`, cookie, { declaredName: "E2E Respondent", declaredRole: "CISO", accurate: true });
  expect(submitted.status, submitted.text).toBe(200);
  expect((await pub(request, "get", linkUrl(token), cookie)).status).toBe(404);

  const read = await call(request, "get", `${orgOf(HEALTH)}/processors/${vendorId}/assessments/${assessmentId}`, SPONSOR.email);
  const a = read.json.data.assessment;
  expect(a).toMatchObject({
    status: "submitted",
    source: "vendor",
    sourceLabel: "Answered by the vendor",
    submittedBy: null,
    declaration: { name: "E2E Respondent", role: "CISO" },
    unevidenced: ["A4", "C4", "D2", "G1"],
  });
  expect(a.involved.sort()).toEqual([CISO.id, LEGAL.id].sort());
  expect(a.answers.every((x: { answeredByVendor: boolean }) => x.answeredByVendor)).toBe(true);
  expect(read.json.data.processor.documents).toEqual([expect.objectContaining({ id: documentId, fromVendor: true, uploadedBy: null, reviewStatus: "pending" })]);
});

test("the second person (D-092): the sender and the creator are refused; the Admin accepts", async ({ request }) => {
  const base = `${orgOf(HEALTH)}/processors/${vendorId}/assessments/${assessmentId}`;
  const bySender = await call(request, "post", `${base}/review`, LEGAL.email, { decision: "accept" });
  expect(bySender.status).toBe(403);
  expect(bySender.json.error.message).toBe("You sent this assessment to the vendor — someone else must review their answers.");
  expect((await call(request, "post", `${base}/review`, CISO.email, { decision: "accept" })).status).toBe(403);
  const accepted = await call(request, "post", `${base}/review`, ADMIN.email, { decision: "accept" });
  expect(accepted.status, accepted.text).toBe(200);
  expect(accepted.json.data.assessment).toMatchObject({ status: "accepted", source: "vendor", reviewedBy: ADMIN.id });
});

test("audit: the respondent's steps are nobody's and name no one", async () => {
  const rows = await withDb(async (db) =>
    (
      await db.query<{ event_type: string; user_id: string | null; text: string }>(
        "SELECT event_type, user_id, (description || metadata::text) AS text FROM public.audit_logs WHERE organization_id = $1 AND event_type LIKE 'vendor%' ORDER BY created_at",
        [HEALTH.organizationId],
      )
    ).rows,
  );
  const vendorSteps = rows.filter((r) => r.event_type.startsWith("vendor_link."));
  expect(vendorSteps.map((r) => r.event_type)).toEqual(
    expect.arrayContaining([
      "vendor_link.vendor_assessment_links.confirmed",
      "vendor_link.evidence.upload_url.issued",
      "vendor_link.evidence_links.insert",
      "vendor_link.vendor_assessments.answers_saved",
      "vendor_link.vendor_assessments.submitted",
    ]),
  );
  for (const r of vendorSteps) {
    expect(r.user_id).toBeNull();
    expect(r.text).not.toContain(RESPONDENT);
    expect(r.text).not.toContain("E2E Respondent");
  }
  expect(rows.find((r) => r.event_type === "vendor.vendor_assessment_links.sent")?.user_id).toBe(LEGAL.id);
});

test("gate 5: another tenant's link and session never reach this tenant; revoking ends a link", async ({ request }) => {
  const otherVendor = await newVendor(request, OTHER, "E2E Other Vendor");
  const started = await call(request, "post", `${orgOf(OTHER)}/processors/${otherVendor}/assessments`, ADMIN.email);
  const otherAssessment = started.json.data.assessment.id;
  const base = `${orgOf(OTHER)}/processors/${otherVendor}/assessments/${otherAssessment}`;
  expect((await call(request, "post", `${base}/link`, ADMIN.email, { respondentName: "Other", respondentEmail: "e2e-vendor-link-other@example.com" })).status).toBe(201);
  const otherToken = await giveVendorLinkKnownToken(otherAssessment);

  // The first link's session cookie opens nothing here; its document is not this link's.
  const viaCookie = await pub(request, "get", linkUrl(otherToken), cookie);
  expect(viaCookie.json.data).toMatchObject({ status: "unconfirmed", organization: { name: OTHER.name } });
  expect(viaCookie.text).not.toContain(HEALTH.name);
  expect((await pub(request, "post", `${linkUrl(otherToken)}/documents/${documentId}/attach`, cookie)).status).toBe(401);

  const revoked = await call(request, "delete", `${base}/link`, ADMIN.email);
  expect(revoked.status, revoked.text).toBe(200);
  expect(revoked.json.data.assessment).toMatchObject({ source: "staff", openLink: null, links: [expect.objectContaining({ state: "revoked" })] });
  expect((await pub(request, "get", linkUrl(otherToken), null)).status).toBe(404);
});
