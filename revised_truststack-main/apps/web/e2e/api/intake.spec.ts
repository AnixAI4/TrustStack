/**
 * Slice 10, Stage 3a — public intake through the API: the organisation's
 * public address and Rule 9 contact, the public rights and grievance forms,
 * the emailed one-time code, the limits — and GATE 5 for public surfaces.
 *
 * A request is never deleted, so nothing here touches MU or BML (SLICE_10
 * pitfall 7). Three disposable tenants: a HEALTHCARE one with public pages
 * (`…a014`) — not a university (D-040) — a second open one (`…a015`), the
 * tenant a slug must never reach across to, and a CLOSED one (`…a016`).
 *
 * Every request carries its own `X-Forwarded-For`, so the per-address limit
 * is exercised deliberately and never trips by accident; every address is
 * unique, so the per-email limit never does either.
 */
import { expect, test, type APIRequestContext } from "@playwright/test";
import {
  accessTokenFor,
  bearer,
  createE2eTenant,
  giveSubmissionKnownCode,
  openPublicPages,
  removeE2eTenant,
  SEED_USERS,
  withDb,
} from "../helpers";

/** Organisation Admin in all three: organization.update, rights.read. */
const ADMIN = SEED_USERS.muItSecurity;
/** Executive Sponsor in the healthcare tenant: no organization.update. */
const SPONSOR = SEED_USERS.muDean;

const HEALTH = {
  organizationId: "0b0000ff-0000-4000-8000-00000000a014",
  name: "E2E Public Intake Healthcare Tenant",
  industryCode: "healthcare",
  member: { userId: ADMIN.id, email: ADMIN.email },
  roleCode: "organization_admin",
  extraMembers: [{ userId: SPONSOR.id, roleCode: "executive_sponsor" }],
  slug: "e2e-intake-health",
};
const OTHER = {
  organizationId: "0b0000ff-0000-4000-8000-00000000a015",
  name: "E2E Public Intake Other Tenant",
  industryCode: "general",
  member: { userId: ADMIN.id, email: ADMIN.email },
  roleCode: "organization_admin",
  slug: "e2e-intake-other",
};
const CLOSED = {
  organizationId: "0b0000ff-0000-4000-8000-00000000a016",
  name: "E2E Public Intake Closed Tenant",
  industryCode: "general",
  member: { userId: ADMIN.id, email: ADMIN.email },
  roleCode: "organization_admin",
};

let n = 0;
/** A unique client address and email per call site, so no limit trips by accident. */
const unique = (label: string) => {
  n += 1;
  return { ip: `198.51.100.${n % 250}`, email: `e2e-intake-${label}-${Date.now()}-${n}@example.com` };
};

const pub = (slug: string) => `/api/v1/public/${slug}`;

async function post(request: APIRequestContext, url: string, data: object | undefined, ip: string) {
  const res = await request.post(url, { headers: { "X-Forwarded-For": ip }, ...(data ? { data } : {}) });
  const text = await res.text();
  return { status: res.status(), text, json: text ? JSON.parse(text) : null, headers: res.headers() };
}

function rightsBody(email: string, over: object = {}) {
  return {
    surface: "rights",
    kind: "access",
    requesterName: "E2E Patient",
    requesterEmail: email,
    principalIdentifier: "Patient number E2E-0042",
    summary: "Please send me a summary of the records the hospital holds about me and who they were shared with.",
    ...over,
  };
}

async function submit(request: APIRequestContext, slug: string, body: object, ip: string): Promise<string> {
  const r = await post(request, `${pub(slug)}/submissions`, body, ip);
  expect(r.status, r.text).toBe(202);
  return r.json.data.submissionId as string;
}

async function staffRegister(request: APIRequestContext, orgId: string) {
  const res = await request.get(`/api/v1/organizations/${orgId}/rights-requests`, { headers: bearer(await accessTokenFor(ADMIN.email)) });
  expect(res.status()).toBe(200);
  return (await res.json()).data.requests as { id: string; requestCode: string; channel: string; channelLabel: string; receivedOn: string; createdByName: string | null }[];
}

/** Today in India — the register's calendar (D-055). */
const today = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());

test.describe.configure({ mode: "serial" });

test.beforeAll(async () => {
  await createE2eTenant(HEALTH);
  await createE2eTenant(OTHER);
  await createE2eTenant(CLOSED);
  await openPublicPages(OTHER.organizationId, OTHER.slug);
});
test.afterAll(async () => {
  await removeE2eTenant(HEALTH);
  await removeE2eTenant(OTHER);
  await removeE2eTenant(CLOSED);
});

test("an Organisation Admin opens the public pages; a sponsor may not; a slug needs the Rule 9 contact and is unique", async ({ request }) => {
  const url = `/api/v1/organizations/${HEALTH.organizationId}`;
  const as = async (email: string, data: object) =>
    request.patch(url, { headers: bearer(await accessTokenFor(email)), data });
  const contact = { name: "Dr Meera Iyer", email: "dpo@e2e-health.example.com", phone: "+91 22 4000 0000", isDpo: true };

  const sponsor = await as(SPONSOR.email, { publicPages: { slug: HEALTH.slug, contact } });
  expect(sponsor.status()).toBe(403);
  const noContact = await as(ADMIN.email, { publicPages: { slug: HEALTH.slug, contact: null } });
  expect(noContact.status()).toBe(400);
  expect(await noContact.text()).toContain("Publish a contact before opening the public pages");
  const badSlug = await as(ADMIN.email, { publicPages: { slug: "E2E Health", contact } });
  expect(badSlug.status()).toBe(400);
  const taken = await as(ADMIN.email, { publicPages: { slug: OTHER.slug, contact } });
  expect(taken.status()).toBe(409);
  expect((await taken.json()).error.message).toBe("That public address is already taken — choose another.");

  const opened = await as(ADMIN.email, { publicPages: { slug: HEALTH.slug, contact } });
  expect(opened.status(), await opened.text()).toBe(200);
  expect((await opened.json()).data.organization.publicPages).toEqual({ slug: HEALTH.slug, contact });
  // Audited: the column names, never the contact.
  const audit = await withDb((db) =>
    db.query<{ metadata: { changed: string[] } }>(
      "SELECT metadata FROM public.audit_logs WHERE organization_id = $1 AND event_type = 'scope.organizations.update' ORDER BY created_at DESC LIMIT 1",
      [HEALTH.organizationId],
    ),
  );
  expect(audit.rows[0]!.metadata.changed).toEqual(expect.arrayContaining(["public_slug", "public_contact_email"]));
  expect(JSON.stringify(audit.rows[0]!.metadata)).not.toContain("dpo@e2e-health.example.com");
});

test("the public header names the organisation and its contact — never its id; an unknown, malformed or closed address is the same 404", async ({ request }) => {
  const open = await request.get(pub(HEALTH.slug));
  expect(open.status()).toBe(200);
  const body = await open.json();
  expect(body.data.organization).toEqual({
    name: HEALTH.name,
    legalName: null,
    slug: HEALTH.slug,
    contact: { name: "Dr Meera Iyer", email: "dpo@e2e-health.example.com", phone: "+91 22 4000 0000", isDpo: true },
  });
  expect(JSON.stringify(body)).not.toContain(HEALTH.organizationId);

  const errors = [];
  for (const slug of ["e2e-intake-nobody", "Bad_Slug", CLOSED.organizationId, "e2e-public-intake-closed-tenant"]) {
    const res = await request.get(pub(slug));
    expect(res.status(), slug).toBe(404);
    errors.push((await res.json()).error);
  }
  for (const e of errors) expect(e).toEqual(errors[0]);
  expect(errors[0]).toEqual({ code: "NOT_FOUND", message: "This page is not available.", details: [{ field: "outcome", issue: "not_found" }] });

  // The same for a submission to them.
  const u = unique("closed");
  const closed = await post(request, `${pub("e2e-intake-nobody")}/submissions`, rightsBody(u.email), u.ip);
  expect(closed.status).toBe(404);
  expect(closed.json.error).toEqual(errors[0]);
});

test("a request: held until the code is entered, then ONE web-form request received the day it was submitted", async ({ request }) => {
  const u = unique("flow");
  const before = (await staffRegister(request, HEALTH.organizationId)).length;

  const r = await post(request, `${pub(HEALTH.slug)}/submissions`, rightsBody(u.email), u.ip);
  expect(r.status, r.text).toBe(202);
  expect(r.json.data).toMatchObject({ emailed: true });
  expect(r.json.data.email).toMatch(/^e2\*+@example\.com$/);
  expect(r.text).not.toContain(u.email);
  const submissionId = r.json.data.submissionId as string;

  // Not in the register yet.
  expect(await staffRegister(request, HEALTH.organizationId)).toHaveLength(before);

  const code = await giveSubmissionKnownCode(submissionId);
  const wrong = await post(request, `${pub(HEALTH.slug)}/submissions/${submissionId}/confirm`, { code: "000000" }, u.ip);
  expect(wrong.status).toBe(422);
  expect(wrong.json.error.message).toBe("That code is not right. Check the email and try again. 4 tries left.");

  const done = await post(request, `${pub(HEALTH.slug)}/submissions/${submissionId}/confirm`, { code }, u.ip);
  expect(done.status, done.text).toBe(201);
  expect(done.json.data).toMatchObject({ kind: "access", receivedOn: today(), emailed: true });
  expect(done.json.data.requestCode).toMatch(/^DPR-\d{4}-\d{3}$/);
  const days = (Date.parse(done.json.data.respondBy) - Date.parse(done.json.data.receivedOn)) / 86_400_000;
  expect(days).toBe(90);

  const register = await staffRegister(request, HEALTH.organizationId);
  expect(register).toHaveLength(before + 1);
  const row = register.find((x) => x.requestCode === done.json.data.requestCode)!;
  expect(row).toMatchObject({ channel: "web_form", channelLabel: "Web form", receivedOn: today(), createdByName: null });

  // Single use.
  const replay = await post(request, `${pub(HEALTH.slug)}/submissions/${submissionId}/confirm`, { code }, u.ip);
  expect(replay.status).toBe(409);
  expect(replay.json.error.details).toEqual([{ field: "outcome", issue: "already_confirmed" }]);
  expect(await staffRegister(request, HEALTH.organizationId)).toHaveLength(before + 1);
});

test("gate 5: another tenant's address never reaches a submission, even with the right code, and never names it", async ({ request }) => {
  const u = unique("tenancy");
  const submissionId = await submit(request, HEALTH.slug, rightsBody(u.email), u.ip);
  const code = await giveSubmissionKnownCode(submissionId);

  for (const [path, data] of [
    [`${pub(OTHER.slug)}/submissions/${submissionId}/confirm`, { code }],
    [`${pub(OTHER.slug)}/submissions/${submissionId}/resend`, undefined],
  ] as const) {
    const r = await post(request, path, data, u.ip);
    expect(r.status, path).toBe(404);
    expect(r.json.error.message).toBe("This page is not available.");
    for (const marker of [HEALTH.name, HEALTH.organizationId, OTHER.organizationId]) expect(r.text).not.toContain(marker);
  }
  // Nothing reached the other register; the submission still confirms through its own address.
  expect(await staffRegister(request, OTHER.organizationId)).toHaveLength(0);
  const done = await post(request, `${pub(HEALTH.slug)}/submissions/${submissionId}/confirm`, { code }, u.ip);
  expect(done.status, done.text).toBe(201);
  expect(done.text).not.toContain(OTHER.name);
});

test("a new code retires the old one; five wrong entries lock the submission", async ({ request }) => {
  const u = unique("codes");
  const submissionId = await submit(request, HEALTH.slug, rightsBody(u.email), u.ip);
  const first = await giveSubmissionKnownCode(submissionId, "111111");

  const again = await post(request, `${pub(HEALTH.slug)}/submissions/${submissionId}/resend`, undefined, u.ip);
  expect(again.status, again.text).toBe(202);
  expect(again.json.data.email).toMatch(/^e2\*+@example\.com$/);
  const old = await post(request, `${pub(HEALTH.slug)}/submissions/${submissionId}/confirm`, { code: first }, u.ip);
  expect(old.status).toBe(422);

  for (let i = 0; i < 3; i++) await post(request, `${pub(HEALTH.slug)}/submissions/${submissionId}/confirm`, { code: "000000" }, u.ip);
  const locked = await post(request, `${pub(HEALTH.slug)}/submissions/${submissionId}/confirm`, { code: "000000" }, u.ip);
  expect(locked.status).toBe(410);
  expect(locked.json.error).toMatchObject({ code: "GONE", message: "Too many wrong codes. Please start again." });
  const current = await giveSubmissionKnownCode(submissionId, "222222");
  const stillLocked = await post(request, `${pub(HEALTH.slug)}/submissions/${submissionId}/confirm`, { code: current }, u.ip);
  expect(stillLocked.status).toBe(410);
});

test("the limits: five submissions an hour from one address to one form; the sixth is 429 with Retry-After", async ({ request }) => {
  const ip = "203.0.113.77";
  for (let i = 0; i < 5; i++) {
    const r = await post(request, `${pub(HEALTH.slug)}/submissions`, rightsBody(unique("limit").email), ip);
    expect(r.status, r.text).toBe(202);
  }
  const sixth = await post(request, `${pub(HEALTH.slug)}/submissions`, rightsBody(unique("limit").email), ip);
  expect(sixth.status).toBe(429);
  expect(sixth.headers["retry-after"]).toBe("3600");
  expect(sixth.json.error).toEqual({
    code: "RATE_LIMITED",
    message: "Too many attempts. Please wait an hour and try again.",
    details: [{ field: "outcome", issue: "rate_limited" }],
  });
  // The grievance form is its own count.
  const grievance = await post(
    request,
    `${pub(HEALTH.slug)}/submissions`,
    rightsBody(unique("limit").email, { surface: "grievance", kind: "grievance", summary: "My records were shared without my consent." }),
    ip,
  );
  expect(grievance.status, grievance.text).toBe(202);
});

test("the forms take only what the register records, each kind on its own form", async ({ request }) => {
  const u = unique("shape");
  const url = `${pub(HEALTH.slug)}/submissions`;
  for (const [label, over] of [
    ["grievance on the rights form", { kind: "grievance" }],
    ["a right on the grievance form", { surface: "grievance" }],
    ["nomination without a nominee", { kind: "nomination" }],
    ["a field the register sets", { status: "responded" }],
    ["an earlier request on a request", { relatedRequestCode: "DPR-2026-001" }],
    ["too long", { summary: "x".repeat(4001) }],
  ] as const) {
    const r = await post(request, url, rightsBody(u.email, over), u.ip);
    expect(r.status, label).toBe(400);
    expect(r.json.error.code, label).toBe("VALIDATION_ERROR");
  }
  const code = await post(request, `${pub(HEALTH.slug)}/submissions/0b0000ff-0000-4000-8000-0000000000ff/confirm`, { code: "12345" }, u.ip);
  expect(code.status).toBe(400);
});

test("a nomination and a grievance naming the person's own earlier request", async ({ request }) => {
  const u = unique("family");
  const nomId = await submit(
    request,
    HEALTH.slug,
    rightsBody(u.email, { kind: "nomination", summary: "I nominate my daughter.", nominee: { name: "Kavya Iyer", relationship: "Daughter" } }),
    u.ip,
  );
  const nom = await post(request, `${pub(HEALTH.slug)}/submissions/${nomId}/confirm`, { code: await giveSubmissionKnownCode(nomId) }, u.ip);
  expect(nom.status, nom.text).toBe(201);

  const gId = await submit(
    request,
    HEALTH.slug,
    rightsBody(u.email, {
      surface: "grievance",
      kind: "grievance",
      relatedRequestCode: nom.json.data.requestCode.toLowerCase(),
      summary: "Nobody has acknowledged my nomination.",
    }),
    u.ip,
  );
  const g = await post(request, `${pub(HEALTH.slug)}/submissions/${gId}/confirm`, { code: await giveSubmissionKnownCode(gId) }, u.ip);
  expect(g.status, g.text).toBe(201);
  expect(g.json.data.requestCode).toMatch(/^GRV-/);

  const rows = await withDb((db) =>
    db.query<{ request_code: string; kind: string; nominee_name: string | null; related: string | null }>(
      `SELECT r.request_code, r.kind, r.nominee_name, rel.request_code AS related
       FROM public.rights_requests r LEFT JOIN public.rights_requests rel ON rel.id = r.related_request_id
       WHERE r.organization_id = $1 AND r.request_code = ANY($2) ORDER BY r.kind`,
      [HEALTH.organizationId, [nom.json.data.requestCode, g.json.data.requestCode]],
    ),
  );
  expect(rows.rows).toEqual([
    { request_code: g.json.data.requestCode, kind: "grievance", nominee_name: null, related: nom.json.data.requestCode },
    { request_code: nom.json.data.requestCode, kind: "nomination", nominee_name: "Kavya Iyer", related: null },
  ]);
});

test("closing the public pages: the same 404 at once, and the register keeps what arrived", async ({ request }) => {
  const before = (await staffRegister(request, HEALTH.organizationId)).length;
  const close = await request.patch(`/api/v1/organizations/${HEALTH.organizationId}`, {
    headers: bearer(await accessTokenFor(ADMIN.email)),
    data: { publicPages: { slug: null, contact: { name: "Dr Meera Iyer", email: "dpo@e2e-health.example.com", phone: null, isDpo: true } } },
  });
  expect(close.status(), await close.text()).toBe(200);
  expect((await close.json()).data.organization.publicPages.slug).toBeNull();
  expect((await request.get(pub(HEALTH.slug))).status()).toBe(404);
  expect(await staffRegister(request, HEALTH.organizationId)).toHaveLength(before);
});
