/**
 * Slice 10, Stage 6 — the three stakeholder reports and the evidence index's
 * register link types, through the API, asserted on the FILES (text extracted
 * from the PDF; every cell read back from the XLSX).
 *
 * A stored report is permanent and records an exposure snapshot, so nothing
 * here touches MU or BML. Two disposable tenants: a HEALTHCARE one built here
 * with a row in every register and a document on each (`…a024`), and an EMPTY
 * general one (`…a025`). BML's admin is the Org B attacker.
 *
 * What is proved: a document attaches to a breach and to a request (and the
 * register says when it may not); every register's documents are in the
 * Evidence Index, named as the register names them — a request by code and
 * kind, never the person; each report prints its registers, both caveats
 * verbatim, nothing personal and no bank internals; the empty state; who may
 * generate; GATE 5.
 */
import { expect, test, type APIRequestContext } from "@playwright/test";
import { DPDP_REPORT_CAVEAT, EXPOSURE_CAVEAT } from "@truststack/core";
import { pdfText, squash } from "../../tests/support/pdf-text";
import { xlsxCells } from "../../tests/support/xlsx-cells";
import { accessTokenFor, bearer, createE2eTenant, removeE2eTenant, SEED_ORGS, SEED_USERS } from "../helpers";

const BML = SEED_ORGS.bharatManufacturing;
const base = (orgId: string) => `/api/v1/organizations/${orgId}`;
const FILE_BODY = "Sample artefact for the Slice 10 Stage 6 report e2e.";

const ADMIN = SEED_USERS.muItSecurity;
/** A Department Owner here: writes the registers, may not generate a report. */
const OWNER = SEED_USERS.muLegal;

const HEALTH = {
  organizationId: "0b0000ff-0000-4000-8000-00000000a024",
  name: "E2E Stakeholder Reports Healthcare Tenant",
  industryCode: "healthcare",
  dataPrincipalCountEstimate: 12000,
  member: { userId: ADMIN.id, email: ADMIN.email },
  roleCode: "organization_admin",
  extraMembers: [{ userId: OWNER.id, roleCode: "department_owner" }],
};
const EMPTY = {
  organizationId: "0b0000ff-0000-4000-8000-00000000a025",
  name: "E2E Stakeholder Reports Empty Tenant",
  industryCode: "general",
  member: { userId: ADMIN.id, email: ADMIN.email },
  roleCode: "organization_admin",
};

/** The person who made the request — personal data that must never leave the register. */
const REQUESTER = { name: "E2E Requester Kavita", email: "e2e.requester.kavita@example.com" };
const VENDOR_NAME = "E2E Claims Processing Ltd";

async function call(request: APIRequestContext, method: string, url: string, email: string, data?: object) {
  const res = await request.fetch(url, { method, headers: bearer(await accessTokenFor(email)), ...(data ? { data } : {}) });
  const text = await res.text();
  return { status: res.status(), text, json: text ? JSON.parse(text) : null };
}

interface ReportItem {
  id: string;
  kind: string;
  version: number;
  format: string;
  fileName: string;
  exposureSnapshotId: string | null;
}

async function generate(request: APIRequestContext, org: string, kind: string) {
  const r = await call(request, "POST", `${base(org)}/reports`, ADMIN.email, { kind });
  expect(r.status, r.text).toBe(201);
  return r.json.data.report as ReportItem;
}

async function download(request: APIRequestContext, org: string, report: ReportItem) {
  const signed = await call(request, "GET", `${base(org)}/reports/${report.id}/download-url`, ADMIN.email);
  expect(signed.status, signed.text).toBe(200);
  const file = await request.get(signed.json.data.url);
  expect(file.status()).toBe(200);
  return new Uint8Array(await file.body());
}

/** No question code, pack code or trigger (D-071); never "compliant"; nothing University-specific (D-040); nothing personal. */
function expectClientSafe(text: string) {
  expect(text).not.toMatch(/\b[A-Z]{1,4}\d+\.\d+\b/);
  expect(text).not.toMatch(/[A-Z]+_V\d\b/);
  expect(text).not.toContain("trigger:");
  expect(text.toLowerCase()).not.toMatch(/\bcompliant\b/);
  expect(text.toLowerCase()).not.toMatch(/universit|student|admission|examination|campus/);
  expect(text).not.toContain(squash(REQUESTER.name));
  expect(text).not.toContain(REQUESTER.email);
}

const daysAgo = (days: number) => {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
  return new Date(Date.parse(`${today}T00:00:00Z`) - days * 86_400_000).toISOString().slice(0, 10);
};

async function upload(request: APIRequestContext, org: string, fileName: string): Promise<string> {
  const issued = await call(request, "POST", `${base(org)}/evidence/upload-url`, ADMIN.email, {
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

const linkTo = (request: APIRequestContext, org: string, evidenceId: string, target: object, email: string = ADMIN.email) =>
  call(request, "POST", `${base(org)}/evidence/${evidenceId}/link`, email, target);

const ids = { breach: "", request: "", vendor: "", schedule: "", ai: "", breachDoc: "", requestDoc: "", incidentCode: "", requestCode: "" };

test.describe.configure({ mode: "serial" });

test.beforeAll(async ({ playwright }) => {
  test.setTimeout(120_000);
  await createE2eTenant(HEALTH);
  await createE2eTenant(EMPTY);
  const request = await playwright.request.newContext({ baseURL: test.info().project.use.baseURL });
  const org = HEALTH.organizationId;

  // A breach whose detailed report to the Board is overdue (aware 80 hours ago).
  const breach = await call(request, "POST", `${base(org)}/breaches`, ADMIN.email, {
    title: "E2E claims export sent to the wrong insurer",
    nature: "accidental_disclosure",
    severity: "high",
    awareAt: new Date(Date.now() - 80 * 3_600_000).toISOString(),
  });
  expect(breach.status, breach.text).toBe(201);
  ids.breach = breach.json.data.incident.id;
  ids.incidentCode = breach.json.data.incident.incidentCode;

  // A request open past the Rules' ninety days.
  const rights = await call(request, "POST", `${base(org)}/rights-requests`, ADMIN.email, {
    kind: "access",
    receivedOn: daysAgo(95),
    channel: "email",
    requesterName: REQUESTER.name,
    requesterEmail: REQUESTER.email,
    summary: "Asks for a copy of the claims records held about them.",
  });
  expect(rights.status, rights.text).toBe(201);
  ids.request = rights.json.data.request.id;
  ids.requestCode = rights.json.data.request.requestCode;

  // A processor with no DPDP clauses.
  const vendor = await call(request, "POST", `${base(org)}/vendors`, ADMIN.email, {
    name: VENDOR_NAME,
    vendorRole: "data_processor",
    contractExists: "yes",
    dpdpClauses: "no",
    crossBorder: "no",
    subProcessorsKnown: "yes",
  });
  expect(vendor.status, vendor.text).toBe(201);
  ids.vendor = vendor.json.data.item.id;

  // A processing record whose retention ended long ago, with nothing erased.
  const record = await call(request, "POST", `${base(org)}/ropa`, ADMIN.email, { name: "E2E claims archive" });
  expect(record.status, record.text).toBe(201);
  const schedule = await call(request, "POST", `${base(org)}/retention-schedules`, ADMIN.email, {
    ropaRecordId: record.json.data.record.id,
    basis: "consent_withdrawn",
    periodMonths: 12,
    startsOn: daysAgo(500),
  });
  expect(schedule.status, schedule.text).toBe(201);
  ids.schedule = schedule.json.data.schedule.id;

  // An AI system that tracks children with no exemption — counsel's note.
  const ai = await call(request, "POST", `${base(org)}/ai-systems`, ADMIN.email, {
    name: "E2E paediatric triage assistant",
    purpose: "Suggests a triage level for children's appointments.",
    personalData: "Age, symptoms",
    childTracking: "yes",
  });
  expect(ai.status, ai.text).toBe(201);
  ids.ai = ai.json.data.system.id;

  // A document on each register's row.
  ids.breachDoc = await upload(request, org, "board-intimation.txt");
  expect((await linkTo(request, org, ids.breachDoc, { breachIncidentId: ids.breach })).status).toBe(201);
  ids.requestDoc = await upload(request, org, "response-sent.txt");
  expect((await linkTo(request, org, ids.requestDoc, { rightsRequestId: ids.request })).status).toBe(201);
  expect((await linkTo(request, org, await upload(request, org, "processor-contract.txt"), { vendorId: ids.vendor })).status).toBe(201);
  expect((await linkTo(request, org, await upload(request, org, "erasure-certificate.txt"), { retentionScheduleId: ids.schedule })).status).toBe(201);
  expect((await linkTo(request, org, await upload(request, org, "ai-review.txt"), { aiSystemId: ids.ai })).status).toBe(201);
  await request.dispose();
});

test.afterAll(async () => {
  await removeE2eTenant(HEALTH);
  await removeE2eTenant(EMPTY);
});

test("a document attaches to a breach and to a request; each page lists it; detaching keeps the artefact", async ({ request }) => {
  const org = HEALTH.organizationId;
  const breach = await call(request, "GET", `${base(org)}/breaches/${ids.breach}`, ADMIN.email);
  expect(breach.json.data.incident.documents.map((d: { id: string }) => d.id)).toEqual([ids.breachDoc]);
  const req = await call(request, "GET", `${base(org)}/rights-requests/${ids.request}`, ADMIN.email);
  expect(req.json.data.request.documents.map((d: { id: string }) => d.id)).toEqual([ids.requestDoc]);

  // Twice is a conflict, not a second link.
  expect((await linkTo(request, org, ids.breachDoc, { breachIncidentId: ids.breach })).status).toBe(409);

  // Detached from an open breach: the link goes, the artefact stays; then back.
  const extra = await upload(request, org, "draft-notice.txt");
  expect((await linkTo(request, org, extra, { breachIncidentId: ids.breach })).status).toBe(201);
  const detached = await call(request, "DELETE", `${base(org)}/breaches/${ids.breach}/evidence/${extra}`, ADMIN.email);
  expect(detached.status, detached.text).toBe(200);
  expect(detached.json.data.incident.documents.map((d: { id: string }) => d.id)).toEqual([ids.breachDoc]);
  expect((await call(request, "GET", `${base(org)}/evidence/${extra}/download-url`, ADMIN.email)).status).toBe(200);
  expect((await call(request, "DELETE", `${base(org)}/breaches/${ids.breach}/evidence/${extra}`, ADMIN.email)).status).toBe(404);
});

test("a request entered in error takes no document, and an answered one keeps what was sent", async ({ request }) => {
  const org = HEALTH.organizationId;
  const r = await call(request, "POST", `${base(org)}/rights-requests`, ADMIN.email, {
    kind: "correction",
    receivedOn: daysAgo(2),
    channel: "email",
    requesterName: REQUESTER.name,
    summary: "Asks to correct a date of birth.",
  });
  expect(r.status, r.text).toBe(201);
  const url = `${base(org)}/rights-requests/${r.json.data.request.id}`;
  const sent = await upload(request, org, "correction-response.txt");
  expect((await linkTo(request, org, sent, { rightsRequestId: r.json.data.request.id })).status).toBe(201);
  const voided = await call(request, "PATCH", url, ADMIN.email, { status: "void", closureReason: "Entered twice by mistake" });
  expect(voided.status, voided.text).toBe(200);
  const refusedDetach = await call(request, "DELETE", `${url}/evidence/${sent}`, ADMIN.email);
  expect(refusedDetach.status, refusedDetach.text).toBe(409);
  expect(refusedDetach.json.error.message).toContain("reopen it");
  const refusedAttach = await linkTo(request, org, await upload(request, org, "late.txt"), { rightsRequestId: r.json.data.request.id });
  expect(refusedAttach.status, refusedAttach.text).toBe(409);
  expect(refusedAttach.json.error.message).toContain("entered in error");
});

test("the Evidence Index names every register's documents as the register does — a request by code and kind", async ({ request }) => {
  const org = HEALTH.organizationId;
  const report = await generate(request, org, "evidence_index");
  const book = await xlsxCells(await download(request, org, report));
  expect(book.active).toEqual([]);
  const rows = book.sheets.get("Evidence index")!.slice(1).map((r) => r.map((c) => (c === null ? "" : String(c))));
  const byFile = (name: string) => rows.find((r) => r[0] === name)!;
  expect(byFile("board-intimation.txt").slice(10)).toEqual(["Personal data breach", ids.incidentCode, "E2E claims export sent to the wrong insurer", "Head 2"]);
  expect(byFile("response-sent.txt").slice(10)).toEqual(["Rights request or grievance", ids.requestCode, "Access to information", "Head 7"]);
  expect(byFile("processor-contract.txt").slice(10)).toEqual(["Vendor", "Processor register", VENDOR_NAME, "Head 1, Head 7"]);
  expect(byFile("erasure-certificate.txt").slice(10, 12)).toEqual(["Retention schedule", "Retention register"]);
  expect(byFile("ai-review.txt").slice(10)).toEqual(["AI system", "AI risk register", "E2E paediatric triage assistant", "—"]);
  expect(JSON.stringify(rows)).not.toContain(REQUESTER.name);
});

test("the three reports print their registers, both caveats verbatim, nothing personal and no bank internals", async ({ request }) => {
  const org = HEALTH.organizationId;
  const expectations: [string, string[]][] = [
    ["security_breach", [ids.incidentCode, "The breach register (s.8(6), Rule 7)", "Detailed reports to the Board overdue", "Breach notification"]],
    ["legal_position", [ids.requestCode, "Open past the ninety days the Rules allow", "Past the end date with no erasure that counts", "for counsel to confirm", "AI systems — an enabling note, not a status"]],
    // Slice 10.5 B4 (F4.4): the real next step, and B3's "No accepted assessment" (D-116.9).
    ["processor_exposure", [VENDOR_NAME, "Contracts to fix", "Amend the contract to carry DPDP clauses, then record it", "No accepted assessment", "with no accepted assessment"]],
  ];
  for (const [kind, marks] of expectations) {
    const report = await generate(request, org, kind);
    expect(report.format).toBe("pdf");
    expect(report.exposureSnapshotId).not.toBeNull();
    const { text } = await pdfText(await download(request, org, report));
    expect(text).toContain(squash(DPDP_REPORT_CAVEAT));
    expect(text).toContain(squash(EXPOSURE_CAVEAT.slice(0, 80)));
    for (const mark of marks) expect(text, `${kind}: ${mark}`).toContain(squash(mark));
    expectClientSafe(text);
    expect(text.toLowerCase(), kind).not.toContain("never assessed");
  }
});

test("an empty organisation gets all three, each saying so", async ({ request }) => {
  const org = EMPTY.organizationId;
  for (const [kind, empty] of [
    ["security_breach", "No personal data breach is recorded."],
    ["legal_position", "No privacy notice has been published."],
    ["processor_exposure", "No vendor is recorded."],
  ] as const) {
    const { text } = await pdfText(await download(request, org, await generate(request, org, kind)));
    expect(text).toContain(squash(empty));
    expectClientSafe(text);
  }
});

test("who may generate: a department owner may not; Org B's admin reaches nothing here (gate 5)", async ({ request }) => {
  const org = HEALTH.organizationId;
  const owner = await call(request, "POST", `${base(org)}/reports`, OWNER.email, { kind: "legal_position" });
  expect(owner.status, owner.text).toBe(403);
  const bml = SEED_USERS.bharatManufacturing.email;
  expect((await call(request, "POST", `${base(org)}/reports`, bml, { kind: "security_breach" })).status).toBe(403);
  // This tenant's path: Org B's admin is no member. Org B's path with this tenant's ids: never found.
  expect((await linkTo(request, org, ids.breachDoc, { breachIncidentId: ids.breach }, bml)).status).toBe(403);
  expect((await call(request, "DELETE", `${base(BML.id)}/breaches/${ids.breach}/evidence/${ids.breachDoc}`, bml)).status).toBe(404);
  expect((await call(request, "DELETE", `${base(BML.id)}/rights-requests/${ids.request}/evidence/${ids.requestDoc}`, bml)).status).toBe(404);
});
