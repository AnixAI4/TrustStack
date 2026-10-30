/**
 * Slice 9, Stage 3 — the report store and the two exposure reports, through
 * the API: generate, list, read, download by signed URL, regenerate.
 *
 * Every report records an exposure snapshot, and a stored snapshot is
 * permanent, so this file never generates on MU or BML (STATE, Stage 2's open
 * loop). It uses two disposable tenants: a HEALTHCARE one with children's data
 * and a register (`…a009`, the second sector), and an EMPTY general one
 * (`…a00a`, the empty state). BML's admin is the Org B attacker.
 *
 * What is proved here, on the FILE (text extracted from the stored PDF):
 * both caveats verbatim; the headline is the stored snapshot's; no question
 * code, pack code or trigger; nothing University-specific. And: versions,
 * the old file untouched; audit as the person; permissions; GATE 5 by path,
 * by id and against the bucket.
 */
import { createHash } from "node:crypto";
import { expect, test, type APIRequestContext } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { ACTION_SOURCE_LABEL, CEILINGS_AT_STAKE_HEADING, DPDP_REPORT_CAVEAT, EXPOSURE_CAVEAT, FROM_EVERY_REGISTER, croreLabel } from "@truststack/core";
import { pdfText, squash } from "../../tests/support/pdf-text";
import { accessTokenFor, bearer, createE2eTenant, removeE2eTenant, SEED_ORGS, SEED_USERS, withDb } from "../helpers";

const BML = SEED_ORGS.bharatManufacturing;
const base = (orgId: string) => `/api/v1/organizations/${orgId}`;

/**
 * Only the two seeded users no other spec asserts memberships for (see
 * `scoring.spec.ts`) — the Dean, for one, must stay single-organisation
 * (`ui/tenancy.spec.ts`). Roles are per membership, so the same Legal user is
 * the Executive Sponsor here and a Department Owner in the empty tenant.
 */
const HEALTH = {
  organizationId: "0b0000ff-0000-4000-8000-00000000a009",
  name: "E2E Reports Healthcare Tenant",
  industryCode: "healthcare",
  dataPrincipalCountEstimate: 5000,
  member: { userId: SEED_USERS.muItSecurity.id, email: SEED_USERS.muItSecurity.email },
  roleCode: "organization_admin",
  extraMembers: [{ userId: SEED_USERS.muLegal.id, roleCode: "executive_sponsor" }],
};
const EMPTY = {
  organizationId: "0b0000ff-0000-4000-8000-00000000a00a",
  name: "E2E Reports Empty Tenant",
  industryCode: "general",
  member: { userId: SEED_USERS.muItSecurity.id, email: SEED_USERS.muItSecurity.email },
  roleCode: "organization_admin",
  extraMembers: [{ userId: SEED_USERS.muLegal.id, roleCode: "department_owner" }],
};
const ADMIN = SEED_USERS.muItSecurity;
/** Executive Sponsor in HEALTH; Department Owner in EMPTY. */
const OTHER = SEED_USERS.muLegal;

async function call(request: APIRequestContext, method: string, url: string, email: string, data?: object) {
  const res = await request.fetch(url, { method, headers: bearer(await accessTokenFor(email)), ...(data ? { data } : {}) });
  const text = await res.text();
  return { status: res.status(), text, json: text ? JSON.parse(text) : null };
}

interface ReportItem {
  id: string;
  kind: string;
  version: number;
  status: string;
  fileName: string;
  byteSize: number;
  exposureSnapshotId: string | null;
  generatedBy: string;
}

async function generate(request: APIRequestContext, org: string, kind: string, email = ADMIN.email) {
  const r = await call(request, "POST", `${base(org)}/reports`, email, { kind });
  expect(r.status, r.text).toBe(201);
  return r.json.data as { report: ReportItem; generation: { totalMs: number; renderMs: number; bytes: number } };
}

async function download(request: APIRequestContext, org: string, reportId: string, email = ADMIN.email) {
  const signed = await call(request, "GET", `${base(org)}/reports/${reportId}/download-url`, email);
  expect(signed.status, signed.text).toBe(200);
  expect(signed.json.data.expiresInSeconds).toBe(60);
  const file = await request.get(signed.json.data.url);
  expect(file.status()).toBe(200);
  expect(file.headers()["content-type"]).toContain("application/pdf");
  return Buffer.from(await file.body());
}

const sha = (b: Buffer) => createHash("sha256").update(b).digest("hex");

/** No question code, pack code or trigger (D-071); never "compliant"; nothing University-specific (D-040). */
function expectClientSafe(text: string) {
  expect(text).not.toMatch(/\b[A-Z]{1,4}\d+\.\d+\b/);
  expect(text).not.toMatch(/[A-Z]+_V\d\b/);
  expect(text).not.toContain("trigger:");
  expect(text.toLowerCase()).not.toMatch(/\bcompliant\b/);
  expect(text.toLowerCase()).not.toMatch(/universit|student|admission|examination|campus/);
}

test.describe.configure({ mode: "serial" });

test.beforeAll(async () => {
  await createE2eTenant(HEALTH);
  await createE2eTenant(EMPTY);
});
test.afterAll(async () => {
  await removeE2eTenant(HEALTH);
  await removeE2eTenant(EMPTY);
});

test("empty state: an organisation with nothing gets both reports, complete, with no error", async ({ request }) => {
  // The DPO's report first: nothing has been recorded before it.
  const programme = await generate(request, EMPTY.organizationId, "programme_status");
  expect(programme.report).toMatchObject({ kind: "programme_status", version: 1, status: "ready" });
  const brief = await generate(request, EMPTY.organizationId, "exposure_brief");
  expect(brief.report).toMatchObject({ kind: "exposure_brief", version: 1, status: "ready" });

  const b = await pdfText(await download(request, EMPTY.organizationId, brief.report.id));
  expect(b.pages).toBe(1);
  expect(b.text).toContain("No assessment yet");
  expect(b.text).toContain("No open action counts against a penalty head that is at stake.");
  expect(b.text).toContain(squash(DPDP_REPORT_CAVEAT));
  expect(b.text).toContain(squash(EXPOSURE_CAVEAT));
  expectClientSafe(b.text);

  const p = await pdfText(await download(request, EMPTY.organizationId, programme.report.id));
  expect(p.text).toContain("No assessment has been started, so there is no readiness score yet.");
  expect(p.text).toContain("This is the first exposure snapshot recorded for the organisation");
  expect(p.text).toContain(squash(DPDP_REPORT_CAVEAT));
  expect(p.text).toContain(squash(EXPOSURE_CAVEAT));
  expectClientSafe(p.text);
});

test("second sector: the brief prints the snapshot it recorded — headline, heads and children's reasons", async ({ request }) => {
  const scope = await call(request, "PUT", `${base(HEALTH.organizationId)}/scope`, ADMIN.email, {
    industryCode: "healthcare",
    dataPrincipalCountEstimate: 5000,
    answers: {
      childrenData: "yes",
      guardianData: "no",
      usesDataProcessors: "yes",
      aiUsageTypes: [],
      marketingTracking: "no",
      crossBorder: "no",
      multiLocation: false,
      publicFacingPortal: "yes",
      sensitiveDocuments: "yes",
    },
  });
  expect(scope.status, scope.text).toBe(200);
  const record = await call(request, "POST", `${base(HEALTH.organizationId)}/ropa`, ADMIN.email, {
    name: "Paediatric outpatient registration",
    childrenData: "yes",
    childParentalConsent: "no",
    childTracking: "no",
  });
  expect(record.status, record.text).toBe(201);
  const gaps = await call(request, "POST", `${base(HEALTH.organizationId)}/ropa/gaps/generate`, ADMIN.email);
  expect(gaps.status, gaps.text).toBe(200);

  const { report, generation } = await generate(request, HEALTH.organizationId, "exposure_brief");
  expect(report.exposureSnapshotId).toBeTruthy();
  // Inside the synchronous budget (decision 8) — measured, and logged by the server.
  expect(generation.totalMs).toBeLessThan(10_000);

  const snapshot = await call(request, "GET", `${base(HEALTH.organizationId)}/exposure/snapshots/${report.exposureSnapshotId}`, ADMIN.email);
  expect(snapshot.status, snapshot.text).toBe(200);
  const s = snapshot.json.data;
  const h3 = s.heads.find((h: { code: string }) => h.code === "H3");
  expect(h3.status).toBe("exposed");

  const { text, pages } = await pdfText(await download(request, HEALTH.organizationId, report.id));
  expect(pages).toBe(1);
  expect(text).toContain(croreLabel(s.ceilingsAtStakeCrore));
  expect(text).toContain(`${s.exposedHeads} of ${s.applicableHeads}`);
  expect(text).toContain("3. Children and lawful guardians (s.9) Exposed");
  expect(text).toContain(h3.position.rangeLabel);
  expect(text).toContain("Processing register: No verifiable parental consent (1 open gap).");
  expect(text).toContain(squash(DPDP_REPORT_CAVEAT));
  expect(text).toContain(squash(EXPOSURE_CAVEAT));
  expectClientSafe(text);
});

test("the Programme Status Report: forecast, actions from the register, the scorecard appendix", async ({ request }) => {
  const { report } = await generate(request, HEALTH.organizationId, "programme_status");
  const { text, pages } = await pdfText(await download(request, HEALTH.organizationId, report.id));
  expect(pages).toBeGreaterThan(1);
  for (const heading of ["At a glance", "Slippage warnings", "Exposure by penalty head", "Pace and forecast", "What changed since the last snapshot", "The actions that retire the most exposure", "Remediation by owner and by window", "Processing register", "Appendix — Readiness scorecard"]) {
    expect(text, heading).toContain(heading);
  }
  // The register's actions, labelled by source; the brief's snapshot is now the "last".
  expect(text).toContain("Processing register · ROPA-");
  // Slice 10.5 B4 (F4.5): "No change since the snapshot of …" when nothing moved — never "from ₹X to ₹X".
  expect(text).toMatch(/(No change since|Since) the snapshot of \d{1,2} \w+ 20\d\d/);
  expect(text).not.toMatch(/went from (₹[\d,]+ crore) to \1/);
  // F4.3 + Q1: actions are counted from every register, and the source table lists all five.
  expect(text).toContain(FROM_EVERY_REGISTER);
  for (const label of Object.values(ACTION_SOURCE_LABEL)) expect(text, label).toContain(label);
  expect(text).toContain(CEILINGS_AT_STAKE_HEADING);
  expect(text).not.toContain("where you are exposed");
  expect(text).toContain(squash(DPDP_REPORT_CAVEAT));
  expect(text).toContain(squash(EXPOSURE_CAVEAT));
  expectClientSafe(text);
});

test("regenerating adds version 2 with a fresh snapshot; version 1 and its file are untouched", async ({ request }) => {
  const list = await call(request, "GET", `${base(HEALTH.organizationId)}/reports?kind=exposure_brief`, ADMIN.email);
  expect(list.status, list.text).toBe(200);
  const v1 = (list.json.data.reports as ReportItem[]).find((r) => r.version === 1)!;
  const before = sha(await download(request, HEALTH.organizationId, v1.id));

  const regen = await call(request, "POST", `${base(HEALTH.organizationId)}/reports/${v1.id}/regenerate`, ADMIN.email);
  expect(regen.status, regen.text).toBe(201);
  const v2 = regen.json.data.report as ReportItem;
  expect(v2).toMatchObject({ kind: "exposure_brief", version: 2, status: "ready" });
  expect(v2.id).not.toBe(v1.id);
  expect(v2.exposureSnapshotId).not.toBe(v1.exposureSnapshotId);
  expect(regen.json.data.regeneratedFrom).toEqual({ id: v1.id, version: 1 });

  const again = await call(request, "GET", `${base(HEALTH.organizationId)}/reports/${v1.id}`, ADMIN.email);
  expect(again.json.data.report).toMatchObject({ version: 1, status: "ready", byteSize: v1.byteSize, fileName: v1.fileName });
  expect(sha(await download(request, HEALTH.organizationId, v1.id))).toBe(before);
});

test("every step is on the audit log, as the person", async ({ request }) => {
  const list = await call(request, "GET", `${base(HEALTH.organizationId)}/reports?kind=exposure_brief`, ADMIN.email);
  const v2 = (list.json.data.reports as ReportItem[]).find((r) => r.version === 2)!;
  await download(request, HEALTH.organizationId, v2.id);
  const { rows } = await withDb((db) =>
    db.query<{ event_type: string; user_id: string }>(
      `SELECT event_type, user_id FROM public.audit_logs
        WHERE organization_id = $1 AND (entity_id = $2 OR (event_type = 'exposure.snapshot.recorded' AND entity_id = $3))`,
      [HEALTH.organizationId, v2.id, v2.exposureSnapshotId],
    ),
  );
  const events = rows.map((r) => r.event_type).sort();
  expect(events).toEqual(["exposure.snapshot.recorded", "report.download_url.issued", "report.generated", "report.requested"]);
  expect(new Set(rows.map((r) => r.user_id))).toEqual(new Set([ADMIN.id]));
});

test("permissions: the sponsor downloads but cannot generate; a department owner can do neither", async ({ request }) => {
  const list = await call(request, "GET", `${base(HEALTH.organizationId)}/reports`, OTHER.email);
  expect(list.status, list.text).toBe(200);
  const id = (list.json.data.reports as ReportItem[])[0]!.id;
  expect((await call(request, "GET", `${base(HEALTH.organizationId)}/reports/${id}/download-url`, OTHER.email)).status).toBe(200);
  expect((await call(request, "POST", `${base(HEALTH.organizationId)}/reports`, OTHER.email, { kind: "exposure_brief" })).status).toBe(403);
  expect((await call(request, "POST", `${base(HEALTH.organizationId)}/reports/${id}/regenerate`, OTHER.email)).status).toBe(403);

  // The same person, as a Department Owner in another organisation.
  const empty = await call(request, "GET", `${base(EMPTY.organizationId)}/reports`, OTHER.email);
  expect(empty.status, empty.text).toBe(200);
  const emptyId = (empty.json.data.reports as ReportItem[])[0]!.id;
  expect((await call(request, "GET", `${base(EMPTY.organizationId)}/reports/${emptyId}/download-url`, OTHER.email)).status).toBe(403);
  expect((await call(request, "POST", `${base(EMPTY.organizationId)}/reports`, OTHER.email, { kind: "programme_status" })).status).toBe(403);
});

test("validation: each kind in its own format, an owner only for an owner's pack, and nothing else in the body", async ({ request }) => {
  const url = `${base(HEALTH.organizationId)}/reports`;
  expect((await call(request, "POST", url, ADMIN.email, { kind: "owner_action_pack" })).status).toBe(400);
  expect((await call(request, "POST", url, ADMIN.email, { kind: "exposure_brief", format: "xlsx" })).status).toBe(400);
  expect((await call(request, "POST", url, ADMIN.email, { kind: "exposure_brief", version: 9 })).status).toBe(400);
  expect((await call(request, "GET", `${url}/not-a-uuid`, ADMIN.email)).status).toBe(404);
});

test("GATE 5: Org B cannot list, read, download, regenerate or generate Org A's reports — by path, by id, or in the bucket", async ({ request }) => {
  const own = await call(request, "GET", `${base(HEALTH.organizationId)}/reports`, ADMIN.email);
  const target = (own.json.data.reports as (ReportItem & { fileName: string })[])[0]!;
  const attacker = SEED_USERS.bmlAdmin.email;

  // By path: Org A's organisation in the URL.
  for (const [method, url, data] of [
    ["GET", `${base(HEALTH.organizationId)}/reports`],
    ["GET", `${base(HEALTH.organizationId)}/reports/${target.id}`],
    ["GET", `${base(HEALTH.organizationId)}/reports/${target.id}/download-url`],
    ["POST", `${base(HEALTH.organizationId)}/reports/${target.id}/regenerate`],
    ["POST", `${base(HEALTH.organizationId)}/reports`, { kind: "exposure_brief" }],
  ] as [string, string, object?][]) {
    const r = await call(request, method, url, attacker, data);
    expect(r.status, `${method} ${url}`).toBe(403);
    expect(r.text).not.toContain(target.fileName);
  }

  // By id: Org A's report id on Org B's own path.
  for (const [method, url] of [
    ["GET", `${base(BML.id)}/reports/${target.id}`],
    ["GET", `${base(BML.id)}/reports/${target.id}/download-url`],
    ["POST", `${base(BML.id)}/reports/${target.id}/regenerate`],
  ]) {
    const r = await call(request, method!, url!, attacker);
    expect(r.status, `${method} ${url}`).toBe(404);
  }
  const bmlList = await call(request, "GET", `${base(BML.id)}/reports`, attacker);
  expect(bmlList.text).not.toContain(target.id);

  // The bucket itself, with Org B's own JWT: no signed URL for Org A's path.
  const { rows } = await withDb((db) => db.query<{ storage_path: string }>("SELECT storage_path FROM public.reports WHERE id = $1", [target.id]));
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    global: { headers: bearer(await accessTokenFor(attacker)) },
    auth: { persistSession: false },
  });
  const signed = await sb.storage.from("reports").createSignedUrl(rows[0]!.storage_path, 60);
  expect(signed.data).toBeNull();
  expect(signed.error).not.toBeNull();
});
