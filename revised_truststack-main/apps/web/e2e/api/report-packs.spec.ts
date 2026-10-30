/**
 * Slice 9, Stage 4 — the Owner Action Pack, the Regulator-Ready Evidence Pack
 * and the three working spreadsheets, through the API, asserted on the FILES
 * (text extracted from the PDF; every cell read back from the XLSX).
 *
 * A stored report is permanent and the evidence pack records an exposure
 * snapshot, so nothing here touches MU or BML (STATE, Stage 2's open loop).
 * Two disposable tenants: a HEALTHCARE one built here with both parents —
 * an assessment with gaps and a register with a record — and evidence on all
 * three link types (`…a00c`), and an EMPTY general one (`…a00d`). BML's admin
 * is the Org B attacker.
 *
 * What is proved: both parents in the tracker and the owner's pack, labelled
 * by source; all three link types in the Evidence Index, generated WITH the
 * evidence pack and named by it; the ROPA workbook has the CSV's columns;
 * caveats verbatim; no formula or hyperlink in any workbook; no question code,
 * pack code or trigger; an owner generates and downloads their OWN pack and
 * nobody else's; the empty state; audit as the person; GATE 5.
 */
import { expect, test, type APIRequestContext } from "@playwright/test";
import { DPDP_REPORT_CAVEAT, EXPOSURE_CAVEAT } from "@truststack/core";
import { pdfText, squash } from "../../tests/support/pdf-text";
import { xlsxCells } from "../../tests/support/xlsx-cells";
import { accessTokenFor, bearer, createE2eTenant, removeE2eTenant, SEED_ORGS, SEED_USERS, withDb } from "../helpers";

const BML = SEED_ORGS.bharatManufacturing;
const base = (orgId: string) => `/api/v1/organizations/${orgId}`;
const XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
const FILE_BODY = "Sample artefact for the Slice 9 Stage 4 report e2e.";

/** The two seeded users no other spec asserts memberships for. */
const ADMIN = SEED_USERS.muItSecurity;
/** A Department Owner here: owns the actions, uploads the evidence, may not generate or download others' reports. */
const OWNER = SEED_USERS.muLegal;

const HEALTH = {
  organizationId: "0b0000ff-0000-4000-8000-00000000a00c",
  name: "E2E Report Packs Healthcare Tenant",
  industryCode: "healthcare",
  dataPrincipalCountEstimate: 8000,
  member: { userId: ADMIN.id, email: ADMIN.email },
  roleCode: "organization_admin",
  extraMembers: [{ userId: OWNER.id, roleCode: "department_owner" }],
};
const EMPTY = {
  organizationId: "0b0000ff-0000-4000-8000-00000000a00d",
  name: "E2E Report Packs Empty Tenant",
  industryCode: "general",
  member: { userId: ADMIN.id, email: ADMIN.email },
  roleCode: "organization_admin",
};

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
  format: string;
  fileName: string;
  subjectUserId: string | null;
  exposureSnapshotId: string | null;
}

async function generate(request: APIRequestContext, org: string, body: object, email: string = ADMIN.email) {
  const r = await call(request, "POST", `${base(org)}/reports`, email, body);
  expect(r.status, r.text).toBe(201);
  return r.json.data as { report: ReportItem; companion: ReportItem | null; generation: { totalMs: number } };
}

async function download(request: APIRequestContext, org: string, report: ReportItem, email: string = ADMIN.email) {
  const signed = await call(request, "GET", `${base(org)}/reports/${report.id}/download-url`, email);
  expect(signed.status, signed.text).toBe(200);
  expect(signed.json.data.fileName).toBe(report.fileName);
  const file = await request.get(signed.json.data.url);
  expect(file.status()).toBe(200);
  expect(file.headers()["content-type"]).toContain(report.format === "pdf" ? "application/pdf" : XLSX);
  return new Uint8Array(await file.body());
}

/** No question code, pack code or trigger (D-071); never "compliant"; nothing University-specific (D-040). */
function expectClientSafe(text: string) {
  expect(text).not.toMatch(/\b[A-Z]{1,4}\d+\.\d+\b/);
  expect(text).not.toMatch(/[A-Z]+_V\d\b/);
  expect(text).not.toContain("trigger:");
  expect(text.toLowerCase()).not.toMatch(/\bcompliant\b/);
  expect(text.toLowerCase()).not.toMatch(/universit|student|admission|examination|campus/);
}

/** `YYYY-MM-DD`, `days` from today in India. */
function inDays(days: number): string {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
  return new Date(Date.parse(`${today}T00:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10);
}

/** The fixture's own titles — the files are searched for them. */
const TITLE = {
  overdue: "E2E packs: appoint a breach response lead",
  closed: "E2E packs: publish the security policy",
  ropa: "E2E packs: record parental consent for paediatric registration",
};
let ownerName = "";

async function upload(request: APIRequestContext, org: string, email: string, fileName: string): Promise<string> {
  const issued = await call(request, "POST", `${base(org)}/evidence/upload-url`, email, {
    fileName,
    contentType: "text/plain",
    byteSize: Buffer.byteLength(FILE_BODY),
  });
  expect(issued.status, issued.text).toBe(201);
  const { evidence, upload: target } = issued.json.data;
  const put = await request.put(target.url, { data: Buffer.from(FILE_BODY), headers: { "Content-Type": target.contentType } });
  expect(put.status(), await put.text()).toBe(200);
  return evidence.id as string;
}

async function link(request: APIRequestContext, org: string, evidenceId: string, target: object, email: string = OWNER.email) {
  const r = await call(request, "POST", `${base(org)}/evidence/${evidenceId}/link`, email, target);
  expect(r.status, r.text).toBe(201);
}

test.describe.configure({ mode: "serial" });

test.beforeAll(async ({ playwright }) => {
  test.setTimeout(120_000);
  await createE2eTenant(HEALTH);
  await createE2eTenant(EMPTY);
  ownerName = (await withDb((db) => db.query<{ full_name: string }>("SELECT full_name FROM public.users WHERE id = $1", [OWNER.id]))).rows[0]!.full_name;
  const request = await playwright.request.newContext({ baseURL: test.info().project.use.baseURL });
  const org = HEALTH.organizationId;

  // ---- Scope: children's data, so the register's child rules fire --------
  const scope = await call(request, "PUT", `${base(org)}/scope`, ADMIN.email, {
    industryCode: "healthcare",
    dataPrincipalCountEstimate: 8000,
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

  // ---- The register: one record the owner owns, its gaps, one action theirs
  const record = await call(request, "POST", `${base(org)}/ropa`, ADMIN.email, {
    name: "Paediatric outpatient registration",
    ownerUserId: OWNER.id,
    childrenData: "yes",
    childParentalConsent: "no",
    childTracking: "no",
  });
  expect(record.status, record.text).toBe(201);
  const recordId = record.json.data.record.id as string;
  expect((await call(request, "POST", `${base(org)}/ropa/gaps/generate`, ADMIN.email)).status).toBe(200);
  const ropaGaps = (await call(request, "GET", `${base(org)}/ropa/gaps`, ADMIN.email)).json.data.gaps as {
    id: string;
    gapCode: string;
    actions: { id: string }[];
  }[];
  const consent = ropaGaps.find((g) => g.gapCode === "child_consent_missing")!;
  const ropaAction = await call(request, "PATCH", `${base(org)}/ropa/gaps/${consent.id}/actions/${consent.actions[0]!.id}`, ADMIN.email, {
    title: TITLE.ropa,
    ownerUserId: OWNER.id,
    dueDate: inDays(10),
  });
  expect(ropaAction.status, ropaAction.text).toBe(200);

  // ---- An assessment: two critical answers → two gaps, both the owner's ---
  const created = await call(request, "POST", `${base(org)}/assessments`, ADMIN.email, { name: "E2E report packs assessment" });
  expect(created.status, created.text).toBe(201);
  const assessmentId = created.json.data.assessment.id as string;
  const questions = (await call(request, "GET", `${base(org)}/assessments/${assessmentId}/questions`, ADMIN.email)).json.data
    .questions as { questionCode: string }[];
  const responses: string[] = [];
  for (const q of questions.slice(0, 2)) {
    const r = await call(request, "PUT", `${base(org)}/assessments/${assessmentId}/responses/${encodeURIComponent(q.questionCode)}`, OWNER.email, {
      applicabilityDecision: "applicable",
      claimedMaturity: 0,
    });
    expect([200, 201], r.text).toContain(r.status);
    responses.push(r.json.data.response.id);
  }
  expect((await call(request, "POST", `${base(org)}/assessments/${assessmentId}/gaps/generate`, ADMIN.email)).status).toBe(200);
  const gaps = (await call(request, "GET", `${base(org)}/assessments/${assessmentId}/gaps`, ADMIN.email)).json.data.gaps as {
    id: string;
    actions: { id: string }[];
  }[];
  expect(gaps.length).toBeGreaterThanOrEqual(2);
  const [overdueGap, closedGap] = gaps;
  const patchAction = (gap: { id: string; actions: { id: string }[] }, data: object, email: string = ADMIN.email) =>
    call(request, "PATCH", `${base(org)}/assessments/${assessmentId}/gaps/${gap.id}/actions/${gap.actions[0]!.id}`, email, data);
  expect((await patchAction(overdueGap!, { title: TITLE.overdue, ownerUserId: OWNER.id, dueDate: inDays(-5) })).status).toBe(200);
  expect((await patchAction(closedGap!, { title: TITLE.closed, ownerUserId: OWNER.id, dueDate: inDays(20) })).status).toBe(200);

  // ---- Evidence on all three link types; one accepted, then the action closes
  const onAnswer = await upload(request, org, OWNER.email, "consent-notice.txt");
  await link(request, org, onAnswer, { responseId: responses[0] });
  const onAction = await upload(request, org, OWNER.email, "security-policy.txt");
  await link(request, org, onAction, { gapActionId: closedGap!.actions[0]!.id });
  const onRecord = await upload(request, org, OWNER.email, "registration-form.txt");
  await link(request, org, onRecord, { ropaRecordId: recordId });
  await upload(request, org, OWNER.email, "unlinked-draft.txt");
  const review = await call(request, "PATCH", `${base(org)}/evidence/${onAction}/review`, ADMIN.email, { reviewStatus: "adequate", evidenceLevel: 4 });
  expect(review.status, review.text).toBe(200);
  const closed = await patchAction(closedGap!, { status: "closed" }, OWNER.email);
  expect(closed.status, closed.text).toBe(200);

  await request.dispose();
});

test.afterAll(async () => {
  await removeE2eTenant(HEALTH);
  await removeE2eTenant(EMPTY);
});

test("Gap & Action Tracker: both parents, labelled by source, values only, with the caveat", async ({ request }) => {
  const { report } = await generate(request, HEALTH.organizationId, { kind: "gap_action_tracker" });
  expect(report).toMatchObject({ kind: "gap_action_tracker", format: "xlsx", version: 1, status: "ready", exposureSnapshotId: null });
  const book = await xlsxCells(await download(request, HEALTH.organizationId, report));
  expect([...book.sheets.keys()]).toEqual(["About", "Actions", "Gaps"]);
  expect(book.active).toEqual([]);
  expect(book.text).toContain(DPDP_REPORT_CAVEAT);

  const [head, ...rows] = book.sheets.get("Actions")!;
  const col = (name: string) => head!.indexOf(name);
  const byTitle = (title: string) => rows.find((r) => r[col("Action")] === title)!;
  expect(byTitle(TITLE.overdue)[col("Source")]).toBe("Assessment");
  expect(byTitle(TITLE.overdue)[col("Overdue")]).toBe("Yes");
  expect(byTitle(TITLE.overdue)[col("Owner")]).toBe(ownerName);
  expect(byTitle(TITLE.ropa)[col("Source")]).toBe("Processing register");
  expect(byTitle(TITLE.ropa)[col("Area or register rule")]).toMatch(/^ROPA-\d+ · /);
  expect(byTitle(TITLE.ropa)[col("Penalty heads")]).toBe("Head 3");
  expect(byTitle(TITLE.closed)[col("Status")]).toBe("Closed");
  expect(byTitle(TITLE.closed)[col("Closed on the basis of")]).toBe("Accepted evidence");
  expect(byTitle(TITLE.closed)[col("Accepted artefacts")]).toBe(1);
  expect(book.sheets.get("Gaps")!.length).toBeGreaterThan(3);
  expectClientSafe(book.text);
});

test("ROPA Register workbook: the CSV export's columns, the record, values only", async ({ request }) => {
  const { report } = await generate(request, HEALTH.organizationId, { kind: "ropa_register" });
  const book = await xlsxCells(await download(request, HEALTH.organizationId, report));
  expect(book.active).toEqual([]);
  expect(book.text).toContain(DPDP_REPORT_CAVEAT);
  expect(book.text).toContain("A DPDP readiness register — not a statutory record.");

  const csv = await request.get(`${base(HEALTH.organizationId)}/ropa/export`, { headers: bearer(await accessTokenFor(ADMIN.email)) });
  expect(csv.status()).toBe(200);
  const csvHeader = (await csv.text()).replace(/^﻿/, "").split("\r\n")[1]!;
  const [head, ...rows] = book.sheets.get("Register")!;
  // One column list for both (SLICE_09 §5); the CSV quotes a header holding a comma.
  expect(head!.map((h) => (String(h).includes(",") ? `"${h}"` : h)).join(",")).toBe(csvHeader);
  expect(rows.some((r) => r.includes("Paediatric outpatient registration"))).toBe(true);
});

test("Evidence Pack: generates the Evidence Index with it, names it, and the index has all three link types", async ({ request }) => {
  const { report, companion } = await generate(request, HEALTH.organizationId, { kind: "evidence_pack" });
  expect(report).toMatchObject({ kind: "evidence_pack", format: "pdf", status: "ready" });
  expect(report.exposureSnapshotId).toBeTruthy();
  expect(companion).toMatchObject({ kind: "evidence_index", format: "xlsx", status: "ready", version: 1 });

  const pack = await pdfText(await download(request, HEALTH.organizationId, report));
  for (const heading of ["Where you stand", "Your evidence at a glance", "Evidence by penalty head", "Evidence by obligation area", "Remediation closed, and on what basis", "Review status of every artefact"]) {
    expect(pack.text, heading).toContain(heading);
  }
  expect(pack.text).toContain(companion!.fileName);
  expect(pack.text).toContain(TITLE.closed);
  expect(pack.text).toContain("Accepted evidence");
  expect(pack.text).toContain(squash(DPDP_REPORT_CAVEAT));
  expect(pack.text).toContain(squash(EXPOSURE_CAVEAT));
  expectClientSafe(pack.text);

  const index = await xlsxCells(await download(request, HEALTH.organizationId, companion!));
  expect(index.active).toEqual([]);
  expect(index.text).toContain(DPDP_REPORT_CAVEAT);
  const [head, ...rows] = index.sheets.get("Evidence index")!;
  const col = (name: string) => head!.indexOf(name);
  const linkedTo = new Set(rows.map((r) => r[col("Linked to")]));
  expect(linkedTo).toEqual(new Set(["Assessment answer", "Remediation action", "Register record", "Not linked"]));
  const accepted = rows.find((r) => r[col("Artefact")] === "security-policy.txt")!;
  expect(accepted[col("Review")]).toBe("Adequate");
  expect(accepted[col("Evidence level")]).toBe("E4");
  expect(accepted[col("Reviewed by")]).not.toBeNull();
  expect(String(accepted[col("What it supports")])).toContain(TITLE.closed);
  expect(rows.find((r) => r[col("Artefact")] === "registration-form.txt")![col("Where")]).toMatch(/^ROPA-\d+$/);
  expectClientSafe(index.text);
});

test("Owner Action Pack: an owner generates and downloads their OWN pack — both parents, overdue first", async ({ request }) => {
  const { report } = await generate(request, HEALTH.organizationId, { kind: "owner_action_pack", ownerUserId: OWNER.id }, OWNER.email);
  expect(report).toMatchObject({ kind: "owner_action_pack", subjectUserId: OWNER.id, version: 1, exposureSnapshotId: null });
  // No report.download — but it is their own pack (decision 9).
  const { text } = await pdfText(await download(request, HEALTH.organizationId, report, OWNER.email));
  expect(text).toContain(`For ${ownerName}`);
  for (const heading of ["At a glance", "Overdue", "Your actions, by when they are due", "Evidence to provide", "Your processing register records"]) {
    expect(text, heading).toContain(heading);
  }
  expect(text).toContain(TITLE.overdue);
  expect(text).toContain(TITLE.ropa);
  expect(text).toContain("Assessment ·");
  expect(text).toContain("Processing register · ROPA-");
  expect(text).toContain("Paediatric outpatient registration");
  // Closed work is counted, not listed as owed.
  expect(text).not.toContain(TITLE.closed);
  expect(text).toContain(squash(DPDP_REPORT_CAVEAT));
  expect(text).not.toContain(squash(EXPOSURE_CAVEAT));
  expectClientSafe(text);

  // An admin generates the same owner's pack: that owner's version 2.
  const second = await generate(request, HEALTH.organizationId, { kind: "owner_action_pack", ownerUserId: OWNER.id });
  expect(second.report).toMatchObject({ subjectUserId: OWNER.id, version: 2 });
  // The owner may regenerate their own pack, too.
  const regen = await call(request, "POST", `${base(HEALTH.organizationId)}/reports/${report.id}/regenerate`, OWNER.email);
  expect(regen.status, regen.text).toBe(201);
  expect(regen.json.data.report).toMatchObject({ subjectUserId: OWNER.id, version: 3 });
});

test("permissions: an owner gets nobody else's pack and no other report", async ({ request }) => {
  const url = `${base(HEALTH.organizationId)}/reports`;
  expect((await call(request, "POST", url, OWNER.email, { kind: "owner_action_pack", ownerUserId: ADMIN.id })).status).toBe(403);
  expect((await call(request, "POST", url, OWNER.email, { kind: "gap_action_tracker" })).status).toBe(403);
  const list = (await call(request, "GET", url, OWNER.email)).json.data.reports as ReportItem[];
  const tracker = list.find((r) => r.kind === "gap_action_tracker")!;
  expect((await call(request, "GET", `${url}/${tracker.id}/download-url`, OWNER.email)).status).toBe(403);
  expect((await call(request, "POST", `${url}/${tracker.id}/regenerate`, OWNER.email)).status).toBe(403);
  // The admin's own pack is not the owner's to download.
  const adminPack = await generate(request, HEALTH.organizationId, { kind: "owner_action_pack", ownerUserId: ADMIN.id });
  expect((await call(request, "GET", `${url}/${adminPack.report.id}/download-url`, OWNER.email)).status).toBe(403);
});

test("validation: an owner's pack needs its owner, nothing else takes one, and the owner must be a member here", async ({ request }) => {
  const url = `${base(HEALTH.organizationId)}/reports`;
  expect((await call(request, "POST", url, ADMIN.email, { kind: "owner_action_pack" })).status).toBe(400);
  expect((await call(request, "POST", url, ADMIN.email, { kind: "gap_action_tracker", ownerUserId: OWNER.id })).status).toBe(400);
  expect((await call(request, "POST", url, ADMIN.email, { kind: "evidence_index", format: "pdf" })).status).toBe(400);
  expect((await call(request, "POST", url, ADMIN.email, { kind: "owner_action_pack", ownerUserId: SEED_USERS.bmlAdmin.id })).status).toBe(422);
});

test("audit: the owner's generation and download are on the log, as the owner", async ({ request }) => {
  const { report } = await generate(request, HEALTH.organizationId, { kind: "owner_action_pack", ownerUserId: OWNER.id }, OWNER.email);
  await download(request, HEALTH.organizationId, report, OWNER.email);
  const { rows } = await withDb((db) =>
    db.query<{ event_type: string; user_id: string }>(
      "SELECT event_type, user_id FROM public.audit_logs WHERE organization_id = $1 AND entity_id = $2",
      [HEALTH.organizationId, report.id],
    ),
  );
  expect(rows.map((r) => r.event_type).sort()).toEqual(["report.download_url.issued", "report.generated", "report.requested"]);
  expect(new Set(rows.map((r) => r.user_id))).toEqual(new Set([OWNER.id]));
});

test("empty state: every Stage 4 output generates for an organisation with nothing, and says so", async ({ request }) => {
  const org = EMPTY.organizationId;
  const tracker = await xlsxCells(await download(request, org, (await generate(request, org, { kind: "gap_action_tracker" })).report));
  expect(tracker.text).toContain("No remediation action yet.");
  const register = await xlsxCells(await download(request, org, (await generate(request, org, { kind: "ropa_register" })).report));
  expect(register.text).toContain("No processing record yet.");

  const { report, companion } = await generate(request, org, { kind: "evidence_pack" });
  const index = await xlsxCells(await download(request, org, companion!));
  expect(index.text).toContain("No evidence has been uploaded yet.");
  const pack = await pdfText(await download(request, org, report));
  expect(pack.text).toContain("No remediation action has been closed yet.");
  expect(pack.text).toContain("No assessment yet");

  const own = await pdfText(await download(request, org, (await generate(request, org, { kind: "owner_action_pack", ownerUserId: ADMIN.id })).report));
  expect(own.text).toContain("Nothing is assigned to you that is still open.");
  expect(own.text).toContain("You are not named as the owner of any processing record.");
});

test("GATE 5: Org B cannot generate, read, download or regenerate Org A's Stage 4 outputs", async ({ request }) => {
  const attacker = SEED_USERS.bmlAdmin.email;
  const own = (await call(request, "GET", `${base(HEALTH.organizationId)}/reports`, ADMIN.email)).json.data.reports as ReportItem[];
  const pack = own.find((r) => r.kind === "owner_action_pack")!;
  const index = own.find((r) => r.kind === "evidence_index")!;

  for (const body of [{ kind: "gap_action_tracker" }, { kind: "evidence_pack" }, { kind: "owner_action_pack", ownerUserId: OWNER.id }]) {
    const r = await call(request, "POST", `${base(HEALTH.organizationId)}/reports`, attacker, body);
    expect(r.status, JSON.stringify(body)).toBe(403);
  }
  for (const target of [pack, index]) {
    expect((await call(request, "GET", `${base(HEALTH.organizationId)}/reports/${target.id}/download-url`, attacker)).status).toBe(403);
    expect((await call(request, "GET", `${base(BML.id)}/reports/${target.id}`, attacker)).status).toBe(404);
    expect((await call(request, "GET", `${base(BML.id)}/reports/${target.id}/download-url`, attacker)).status).toBe(404);
    expect((await call(request, "POST", `${base(BML.id)}/reports/${target.id}/regenerate`, attacker)).status).toBe(404);
  }
  // Naming Org A's member as the owner of a pack on Org B's own path: not a member there.
  expect((await call(request, "POST", `${base(BML.id)}/reports`, attacker, { kind: "owner_action_pack", ownerUserId: OWNER.id })).status).toBe(422);
});
