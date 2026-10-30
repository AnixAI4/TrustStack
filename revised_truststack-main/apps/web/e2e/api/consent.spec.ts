/**
 * Slice 10, Stage 3b — notice and consent through the API: the privacy
 * notice's versions, the consent widget's versions, the public widget and
 * notice page, the staff register, and exposure model 1.3.0 — and GATE 5.
 *
 * A published notice and a consent record are never deleted, so nothing here
 * touches MU or BML (SLICE_10 pitfall 7). Two disposable tenants: a HEALTHCARE
 * one with public pages (`…a018`) — not a university (D-040) — and a second
 * open one (`…a019`), the tenant a slug must never reach across to.
 */
import { expect, test, type APIRequestContext } from "@playwright/test";
import { accessTokenFor, bearer, createE2eTenant, openPublicPages, removeE2eTenant, SEED_USERS } from "../helpers";

/** Organisation Admin in both: consent.read, consent.write, consent.publish. */
const ADMIN = SEED_USERS.muItSecurity;
/** Executive Sponsor in the healthcare tenant: consent.read only. */
const SPONSOR = SEED_USERS.muDean;
/** A member of neither. */
const OUTSIDER = SEED_USERS.bharatManufacturing;

const HEALTH = {
  organizationId: "0b0000ff-0000-4000-8000-00000000a018",
  name: "E2E Consent Healthcare Tenant",
  industryCode: "healthcare",
  member: { userId: ADMIN.id, email: ADMIN.email },
  roleCode: "organization_admin",
  extraMembers: [{ userId: SPONSOR.id, roleCode: "executive_sponsor" }],
  slug: "e2e-consent-health",
};
const OTHER = {
  organizationId: "0b0000ff-0000-4000-8000-00000000a019",
  name: "E2E Consent Other Tenant",
  industryCode: "general",
  member: { userId: ADMIN.id, email: ADMIN.email },
  roleCode: "organization_admin",
  slug: "e2e-consent-other",
};

const PURPOSES = [
  { key: "appointment_reminders", title: "Appointment reminders", uses: "Text and email reminders before your appointments.", dataItems: ["Name", "Mobile number", "Email address"] },
  { key: "health_newsletter", title: "Health newsletter", uses: "A monthly newsletter on the clinic's services.", dataItems: ["Name", "Email address"] },
];

const org = (id: string) => `/api/v1/organizations/${id}`;
const pub = (slug: string) => `/api/v1/public/${slug}/consent`;
const as = async (email: string) => bearer(await accessTokenFor(email));

let n = 0;
const ip = () => `203.0.113.${(n += 1) % 250}`;

async function call(request: APIRequestContext, method: "get" | "post" | "patch" | "delete", url: string, email: string, data?: object) {
  const res = await request[method](url, { headers: await as(email), ...(data ? { data } : {}) });
  const text = await res.text();
  return { status: res.status(), json: text ? JSON.parse(text) : null, text };
}

/** The widget posts text/plain (no preflight) from another origin. */
async function widgetPost(request: APIRequestContext, slug: string, body: object) {
  const res = await request.post(pub(slug), {
    headers: { "Content-Type": "text/plain", Origin: "https://clinic.example", "X-Forwarded-For": ip() },
    data: JSON.stringify(body),
  });
  const text = await res.text();
  return { status: res.status(), json: text ? JSON.parse(text) : null, text, headers: res.headers() };
}

async function publishedNotice(request: APIRequestContext, tenant: typeof HEALTH | typeof OTHER, title: string) {
  const created = await call(request, "post", `${org(tenant.organizationId)}/privacy-notices`, ADMIN.email, { language: "en", title, purposes: PURPOSES });
  expect(created.status, created.text).toBe(201);
  const id = created.json.data.notice.id as string;
  const published = await call(request, "patch", `${org(tenant.organizationId)}/privacy-notices/${id}`, ADMIN.email, { status: "published" });
  expect(published.status, published.text).toBe(200);
  return id;
}

async function liveWidget(request: APIRequestContext, tenant: typeof HEALTH | typeof OTHER, noticeId: string, purposes: string[]) {
  const draft = await call(request, "post", `${org(tenant.organizationId)}/consent-configs`, ADMIN.email, { noticeId, purposes });
  expect(draft.status, draft.text).toBe(201);
  const id = (draft.json.data.configs as { id: string; status: string }[]).find((c) => c.status === "draft")!.id;
  const published = await call(request, "patch", `${org(tenant.organizationId)}/consent-configs/${id}`, ADMIN.email, { status: "published" });
  expect(published.status, published.text).toBe(200);
  return id;
}

test.describe.configure({ mode: "serial" });

let configId = "";
let otherConfigId = "";

test.beforeAll(async () => {
  await createE2eTenant(HEALTH);
  await createE2eTenant(OTHER);
  await openPublicPages(HEALTH.organizationId, HEALTH.slug);
  await openPublicPages(OTHER.organizationId, OTHER.slug);
});
test.afterAll(async () => {
  await removeE2eTenant(HEALTH);
  await removeE2eTenant(OTHER);
});

test("a notice is drafted, refused while incomplete, published by consent.publish, and never changes after", async ({ request }) => {
  const base = `${org(HEALTH.organizationId)}/privacy-notices`;
  const sponsor = await call(request, "post", base, SPONSOR.email, { language: "en", title: "x" });
  expect(sponsor.status).toBe(403);

  const draft = await call(request, "post", base, ADMIN.email, { language: "en", title: "How the clinic uses your personal data", purposes: [] });
  expect(draft.status, draft.text).toBe(201);
  const notice = draft.json.data.notice;
  expect(notice).toMatchObject({ version: 1, status: "draft", language: "en", languageLabel: "English" });
  expect(notice.problems).toContain("A notice names at least one purpose.");

  const second = await call(request, "post", base, ADMIN.email, { language: "en", title: "A second draft" });
  expect(second.status).toBe(409);

  const refused = await call(request, "patch", `${base}/${notice.id}`, ADMIN.email, { status: "published" });
  expect(refused.status).toBe(422);
  expect(refused.json.error.message).toContain("at least one purpose");

  const filled = await call(request, "patch", `${base}/${notice.id}`, ADMIN.email, { purposes: PURPOSES, summary: "Plain words first." });
  expect(filled.status, filled.text).toBe(200);
  expect(filled.json.data.notice.dataItems).toEqual(["Name", "Mobile number", "Email address"]);
  const published = await call(request, "patch", `${base}/${notice.id}`, ADMIN.email, { status: "published" });
  expect(published.status, published.text).toBe(200);
  expect(published.json.data.notice).toMatchObject({ status: "published", publishedByName: expect.any(String) });
  expect(published.json.data.notice.publishedAt).toBeTruthy();

  const changed = await call(request, "patch", `${base}/${notice.id}`, ADMIN.email, { title: "Changed" });
  expect(changed.status).toBe(409);
  const deleted = await call(request, "delete", `${base}/${notice.id}`, ADMIN.email);
  expect(deleted.status).toBe(409);

  // The next draft is version 2; a draft may be discarded.
  const next = await call(request, "post", base, ADMIN.email, { language: "en", title: "Next" });
  expect(next.json.data.notice.version).toBe(2);
  expect((await call(request, "delete", `${base}/${next.json.data.notice.id}`, ADMIN.email)).status).toBe(200);

  const register = await call(request, "get", `${org(HEALTH.organizationId)}/consent`, SPONSOR.email);
  expect(register.status).toBe(200);
  expect(register.json.data.notices.map((x: { version: number; status: string }) => [x.version, x.status])).toEqual([[1, "published"]]);
  expect(register.json.data.publicSlug).toBe(HEALTH.slug);
});

test("a widget version offers only its notice's purposes and goes live when published; the public widget answers any origin", async ({ request }) => {
  const noticeId = (await call(request, "get", `${org(HEALTH.organizationId)}/consent`, ADMIN.email)).json.data.notices[0].id as string;
  const wrong = await call(request, "post", `${org(HEALTH.organizationId)}/consent-configs`, ADMIN.email, { noticeId, purposes: ["marketing"] });
  expect(wrong.status).toBe(422);

  // Nothing is live yet: the same "not found" as every public page.
  const before = await request.get(pub(HEALTH.slug));
  expect(before.status()).toBe(404);

  configId = await liveWidget(request, HEALTH, noticeId, ["health_newsletter", "appointment_reminders"]);
  const res = await request.get(pub(HEALTH.slug), { headers: { Origin: "https://clinic.example" } });
  expect(res.status()).toBe(200);
  expect(res.headers()["access-control-allow-origin"]).toBe("*");
  const body = await res.json();
  expect(body.data.config).toMatchObject({ id: configId, version: 1, languages: ["en", "hi", "mr"], position: "bottom_bar" });
  // In the widget version's order, in the notice's words.
  expect(body.data.config.purposes.map((p: { key: string }) => p.key)).toEqual(["health_newsletter", "appointment_reminders"]);
  expect(body.data.config.purposes[1].title).toBe("Appointment reminders");
  expect(JSON.stringify(body)).not.toContain(HEALTH.organizationId);

  const published = await call(request, "patch", `${org(HEALTH.organizationId)}/consent-configs/${configId}`, ADMIN.email, { position: "corner" });
  expect(published.status).toBe(409);

  // The widget's own file is served to other websites.
  const js = await request.get("/widget/consent-v1.js");
  expect(js.status()).toBe(200);
  expect(await js.text()).toContain("window.TrustStackConsent");
});

test("the widget records given, refused and withdrawn — never a verification — and the register counts each person's latest", async ({ request }) => {
  const given = await widgetPost(request, HEALTH.slug, { configId, identifier: "browser-e2e-1", action: "given", purposes: ["health_newsletter"] });
  expect(given.status, given.text).toBe(201);
  expect(given.headers["access-control-allow-origin"]).toBe("*");
  expect(given.json.data).toMatchObject({ status: "recorded", action: "given", purposes: ["health_newsletter"] });
  expect((await widgetPost(request, HEALTH.slug, { configId, identifier: "browser-e2e-2", action: "refused" })).status).toBe(201);
  expect((await widgetPost(request, HEALTH.slug, { configId, identifier: "browser-e2e-1", action: "withdrawn" })).status).toBe(201);

  // The widget cannot claim a verification, name an unoffered purpose, or give consent to nothing.
  expect((await widgetPost(request, HEALTH.slug, { configId, identifier: "x", action: "given", purposes: ["health_newsletter"], verificationMethod: "rule_10_1_a" })).status).toBe(400);
  expect((await widgetPost(request, HEALTH.slug, { configId, identifier: "x", action: "given", purposes: ["marketing"] })).status).toBe(400);
  expect((await widgetPost(request, HEALTH.slug, { configId, identifier: "x", action: "given", purposes: [] })).status).toBe(400);

  const register = (await call(request, "get", `${org(HEALTH.organizationId)}/consent`, SPONSOR.email)).json.data;
  expect(register.counts).toEqual({ principals: 2, given: 0, refused: 1, withdrawn: 1, onBehalf: 0, unverified: 0 });
  expect(register.recent[0]).toMatchObject({ action: "withdrawn", source: "widget", recordedByName: null, configVersion: 1 });
  expect(register.recent[0].principal).toMatch(/^[0-9a-f]{12}$/);
  expect(JSON.stringify(register)).not.toContain("browser-e2e");

  const lookup = await call(request, "post", `${org(HEALTH.organizationId)}/consent-records/lookup`, SPONSOR.email, { identifier: "browser-e2e-1" });
  expect(lookup.status).toBe(200);
  expect(lookup.json.data.records.map((r: { action: string }) => r.action)).toEqual(["withdrawn", "given"]);
});

test("gate 5: a slug answers for its own tenant only; a foreign id under this tenant is a 404; an outsider is refused", async ({ request }) => {
  const otherNotice = await publishedNotice(request, OTHER, "Other tenant's notice");
  otherConfigId = await liveWidget(request, OTHER, otherNotice, ["health_newsletter"]);

  // The other tenant's widget version through this tenant's address, and the reverse: not found, nothing written.
  const across = await widgetPost(request, HEALTH.slug, { configId: otherConfigId, identifier: "x", action: "given", purposes: ["health_newsletter"] });
  expect(across.status).toBe(404);
  const back = await widgetPost(request, OTHER.slug, { configId, identifier: "x", action: "given", purposes: ["health_newsletter"] });
  expect(back.status).toBe(404);
  const unknown = await request.get(pub("e2e-consent-nobody"));
  const closed = await request.get(`/api/v1/public/e2e-consent-nobody`);
  expect(unknown.status()).toBe(404);
  expect((await unknown.json()).error).toEqual((await closed.json()).error);

  expect((await call(request, "get", `${org(HEALTH.organizationId)}/privacy-notices/${otherNotice}`, ADMIN.email)).status).toBe(404);
  expect((await call(request, "patch", `${org(HEALTH.organizationId)}/consent-configs/${otherConfigId}`, ADMIN.email, { position: "corner" })).status).toBe(404);
  const outsider = await call(request, "get", `${org(HEALTH.organizationId)}/consent`, OUTSIDER.email);
  expect(outsider.status).toBe(403);
  const recordAcross = await call(request, "post", `${org(HEALTH.organizationId)}/consent-records`, ADMIN.email, {
    configId: otherConfigId,
    identifier: "x",
    action: "refused",
  });
  expect(recordAcross.status).toBe(404);
});

test("model 1.3.0: a child's consent with no verification sets head 3 Exposed; the verification, as a new record, clears it", async ({ request }) => {
  const records = `${org(HEALTH.organizationId)}/consent-records`;
  const sponsor = await call(request, "post", records, SPONSOR.email, { configId, identifier: "child-1", action: "refused" });
  expect(sponsor.status).toBe(403);
  const wrongBasis = await call(request, "post", records, ADMIN.email, {
    configId,
    identifier: "child-1",
    action: "given",
    purposes: ["appointment_reminders"],
    principalKind: "child",
    verificationMethod: "rule_11_court",
  });
  expect(wrongBasis.status).toBe(422);

  const child = await call(request, "post", records, ADMIN.email, {
    configId,
    identifier: "MRN-E2E-0042",
    action: "given",
    purposes: ["appointment_reminders"],
    principalKind: "child",
    reference: "Paediatric consent form 42",
  });
  expect(child.status, child.text).toBe(201);
  expect(child.json.data.counts).toMatchObject({ onBehalf: 1, unverified: 1 });

  const h3 = async () => {
    const res = await call(request, "get", `${org(HEALTH.organizationId)}/exposure`, ADMIN.email);
    expect(res.status, res.text).toBe(200);
    expect(res.json.data.modelVersion).toBe("1.7.0");
    return res.json.data.heads.find((h: { code: string }) => h.code === "H3") as { status: string; reasons: { text: string }[] };
  };
  const exposed = await h3();
  expect(exposed.status).toBe("exposed");
  expect(exposed.reasons.map((r) => r.text)).toContain(
    "1 consent given on behalf of a child or a person with disability has no verification of the parent or lawful guardian recorded (s.9(1), Rules 10–11).",
  );

  const verified = await call(request, "post", records, ADMIN.email, {
    configId,
    identifier: "MRN-E2E-0042",
    action: "given",
    purposes: ["appointment_reminders"],
    principalKind: "child",
    verificationMethod: "rule_10_1_b_ii",
    reference: "DigiLocker token checked",
  });
  expect(verified.status).toBe(201);
  expect(verified.json.data.counts).toMatchObject({ onBehalf: 1, unverified: 0 });
  const cleared = await h3();
  expect(cleared.reasons.map((r) => r.text).join(" ")).not.toContain("no verification of the parent");
});

test("the public notice page shows the latest published version, and the same not-found page when there is none", async ({ request }) => {
  const page = await request.get(`/p/${HEALTH.slug}/notice`);
  expect(page.status()).toBe(200);
  const html = await page.text();
  expect(html).toContain("How the clinic uses your personal data");
  expect(html).toContain("Appointment reminders");
  expect(html).toContain("Data Protection Board of India");
  expect(html).toContain(`/p/${HEALTH.slug}/rights`);
  expect((await request.get(`/p/e2e-consent-nobody/notice`)).status()).toBe(404);
});
