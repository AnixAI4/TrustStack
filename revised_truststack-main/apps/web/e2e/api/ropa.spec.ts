/**
 * Slice 7 — the ROPA / Processing Activity Register, end to end through the
 * API: create → complete → review → approve; evidence on a record; import with
 * bad rows; export; ROPA gaps on the shared action workflow.
 *
 * The journey runs on Mumbai University (`university`) and on a disposable
 * `general`-industry tenant and must behave identically (D-040): nothing about
 * a processing record is University-specific.
 *
 * Spec files run in parallel against one database, so everything here writes
 * to records THIS file creates, under its own name prefix, and asserts on
 * those rows — never on tenant-wide counts (pitfall 14).
 */
import { expect, test, type APIRequestContext } from "@playwright/test";
import {
  accessTokenFor,
  bearer,
  createE2eTenant,
  removeE2eTenant,
  removeEvidence,
  SEED_ASSESSMENTS,
  SEED_ORGS,
  SEED_SCOPE,
  SEED_USERS,
  withDb,
} from "../helpers";

const MU = SEED_ORGS.mumbaiUniversity;
const BML = SEED_ORGS.bharatManufacturing;
const NAME_PREFIX = "E2E ROPA API";
const base = (orgId: string) => `/api/v1/organizations/${orgId}`;
const FILE_BODY = "Sample ROPA export for the Slice 7 e2e.";

/** Only `muItSecurity` and `muLegal` may join a disposable tenant (pitfall 13). */
const GENERAL_TENANT = {
  organizationId: "0b0000ff-0000-4000-8000-00000000a007",
  name: "E2E ROPA General Tenant",
  industryCode: "general",
  dataPrincipalCountEstimate: 800,
  member: { userId: SEED_USERS.muItSecurity.id, email: SEED_USERS.muItSecurity.email },
  roleCode: "dpdp_owner",
  extraMembers: [{ userId: SEED_USERS.muLegal.id, roleCode: "legal_user" }],
};

interface Journey {
  orgId: string;
  /** Creates and completes the record. */
  writer: { id: string; email: string };
  /** Owns the record — and so may never approve it. */
  owner: { id: string; email: string };
  /** A reviewer who is not the owner: approves. */
  reviewer: { id: string; email: string };
}

const MU_JOURNEY: Journey = {
  orgId: MU.id,
  writer: { id: SEED_USERS.mumbaiUniversity.id, email: SEED_USERS.mumbaiUniversity.email },
  owner: { id: SEED_USERS.mumbaiUniversity.id, email: SEED_USERS.mumbaiUniversity.email },
  reviewer: { id: SEED_USERS.consultant.id, email: SEED_USERS.consultant.email },
};
const GENERAL_JOURNEY: Journey = {
  orgId: GENERAL_TENANT.organizationId,
  writer: { id: SEED_USERS.muLegal.id, email: SEED_USERS.muLegal.email },
  owner: { id: SEED_USERS.muLegal.id, email: SEED_USERS.muLegal.email },
  reviewer: { id: SEED_USERS.muItSecurity.id, email: SEED_USERS.muItSecurity.email },
};

const COMPLETE = {
  departmentText: "Admissions",
  dataPrincipalTypes: "Applicants",
  dataCategories: "Name, email, marks",
  purpose: "Admission eligibility",
  legalBasisNote: "Consent at application",
  collectionSource: "Admission portal",
  systemsText: "Admission portal",
  vendorsText: "None",
  noticeLinked: "Admission notice v1",
  consentLinked: "Consent at application",
  retentionRule: "Seven years after the decision",
  securitySafeguards: "RBAC, encryption",
  childrenData: "no",
  crossBorder: "no",
  aiProcessing: "no",
  highRiskDocuments: "no",
  nextReviewAt: "2099-12-31",
  lawfulBasis: "consent",
  retentionTrigger: "purpose_served",
  safeguards: ["encryption", "access_control", "logging", "backups", "log_retention", "organisational"],
};

const createdEvidence: { orgId: string; id: string }[] = [];

async function cleanup() {
  await withDb(async (db) => {
    await db.query("DELETE FROM public.ropa_records WHERE name LIKE 'E2E ROPA API%'");
    // The ROPA gaps this file generated for Bharat Manufacturing's empty register.
    await db.query("DELETE FROM public.ropa_gaps WHERE organization_id = $1 AND gap_code = 'no_records'", [BML.id]);
  });
}

test.describe.configure({ mode: "serial" });

test.beforeAll(async () => {
  await cleanup();
  await createE2eTenant(GENERAL_TENANT);
});
test.afterAll(async () => {
  await cleanup();
  for (const e of createdEvidence) await removeEvidence(e.orgId, [e.id]);
  await removeE2eTenant(GENERAL_TENANT);
});

async function api(request: APIRequestContext, method: string, path: string, as: string, data?: unknown) {
  const res = await request.fetch(path, { method, headers: bearer(await accessTokenFor(as)), ...(data === undefined ? {} : { data }) });
  const text = await res.text();
  return { status: res.status(), text, json: text.startsWith("{") ? JSON.parse(text) : null };
}

async function upload(request: APIRequestContext, orgId: string, as: string): Promise<string> {
  const issued = await api(request, "POST", `${base(orgId)}/evidence/upload-url`, as, {
    fileName: "ropa-export.txt",
    contentType: "text/plain",
    byteSize: Buffer.byteLength(FILE_BODY),
  });
  expect(issued.status, issued.text).toBe(201);
  const { evidence, upload: target } = issued.json.data;
  createdEvidence.push({ orgId, id: evidence.id });
  const put = await request.put(target.url, { data: Buffer.from(FILE_BODY), headers: { "Content-Type": target.contentType } });
  expect(put.status(), await put.text()).toBe(200);
  return evidence.id as string;
}

for (const journey of [MU_JOURNEY, GENERAL_JOURNEY]) {
  const label = journey === MU_JOURNEY ? "university" : "general";

  test(`${label}: create → complete → review → approve, with every number derived by the database`, async ({ request }) => {
    const r = base(journey.orgId);

    // A client cannot send a score: the body is strict.
    const forged = await api(request, "POST", `${r}/ropa`, journey.writer.email, { name: `${NAME_PREFIX} forged`, completenessScore: 100 });
    expect(forged.status).toBe(400);

    // Create — a bare Draft.
    const created = await api(request, "POST", `${r}/ropa`, journey.writer.email, { name: `${NAME_PREFIX} ${label} admissions` });
    expect(created.status, created.text).toBe(201);
    const record = created.json.data.record;
    expect(record).toMatchObject({ status: "draft", version: 1, completenessScore: 8, completenessBand: "incomplete" });
    expect(record.recordCode).toMatch(/^ROPA-\d{3,}$/);
    expect(record.areas).toHaveLength(13);

    // Complete it, and name an owner — 96: everything but stored evidence.
    const completed = await api(request, "PATCH", `${r}/ropa/${record.id}`, journey.writer.email, {
      ...COMPLETE,
      ownerUserId: journey.owner.id,
    });
    expect(completed.status, completed.text).toBe(200);
    expect(completed.json.data.record).toMatchObject({ completenessScore: 96, completenessBand: "strong", riskRating: "low" });
    expect(completed.json.data.record.areas.filter((a: { complete: boolean }) => !a.complete).map((a: { code: string }) => a.code)).toEqual(["evidence"]);

    // Evidence on the record completes the last area — and touches no answer.
    const evidenceId = await upload(request, journey.orgId, journey.writer.email);
    const linked = await api(request, "POST", `${r}/evidence/${evidenceId}/link`, journey.writer.email, { ropaRecordId: record.id });
    expect(linked.status, linked.text).toBe(201);
    expect(linked.json.data).toMatchObject({ completenessScore: 100, evidenceCount: 1 });

    // An assessor may raise the risk, never lower it.
    // A raise needs its reason (D-067).
    const unexplained = await api(request, "PATCH", `${r}/ropa/${record.id}`, journey.writer.email, { riskRatingAssessor: "high" });
    expect(unexplained.status).toBe(422);
    const raised = await api(request, "PATCH", `${r}/ropa/${record.id}`, journey.writer.email, {
      riskRatingAssessor: "high",
      riskRatingAssessorReason: "Large cohort of minors expected next year",
    });
    expect(raised.json.data.record.risk).toMatchObject({ derived: "low", assessor: "high", rating: "high", modelVersion: "1.0.0" });
    const risky = await api(request, "PATCH", `${r}/ropa/${record.id}`, journey.writer.email, {
      riskRatingAssessor: null,
      childrenData: "yes",
      aiProcessing: "yes",
      highRiskDocuments: "yes",
    });
    expect(risky.json.data.record.risk.derived).toBe("high");
    const lowered = await api(request, "PATCH", `${r}/ropa/${record.id}`, journey.writer.email, { riskRatingAssessor: "low" });
    expect(lowered.status, lowered.text).toBe(422);

    // Review: the owner may not approve their own record; a reviewer who is not the owner may.
    expect((await api(request, "PATCH", `${r}/ropa/${record.id}`, journey.writer.email, { status: "in_review" })).status).toBe(200);
    const self = await api(request, "PATCH", `${r}/ropa/${record.id}`, journey.owner.email, { status: "approved" });
    expect(self.status).toBe(403);
    expect(self.json.error.message).toMatch(/owner cannot approve|Only a reviewer/);
    const approved = await api(request, "PATCH", `${r}/ropa/${record.id}`, journey.reviewer.email, { status: "approved" });
    expect(approved.status, approved.text).toBe(200);
    expect(approved.json.data.record).toMatchObject({ status: "approved", approvedBy: journey.reviewer.id, version: 1 });

    // Approved is read-only; reopening starts version 2.
    const edit = await api(request, "PATCH", `${r}/ropa/${record.id}`, journey.writer.email, { purpose: "Changed" });
    expect(edit.status).toBe(409);
    const detach = await api(request, "DELETE", `${r}/ropa/${record.id}/evidence/${evidenceId}`, journey.writer.email);
    expect(detach.status).toBe(409);
    const reopened = await api(request, "PATCH", `${r}/ropa/${record.id}`, journey.writer.email, { status: "draft", purpose: "Changed" });
    expect(reopened.status, reopened.text).toBe(200);
    expect(reopened.json.data.record).toMatchObject({ status: "draft", version: 2, purpose: "Changed" });

    // DELETE archives. Nothing is removed.
    const archived = await api(request, "DELETE", `${r}/ropa/${record.id}`, journey.writer.email);
    expect(archived.json.data.record.status).toBe("archived");
    expect((await api(request, "GET", `${r}/ropa/${record.id}`, journey.writer.email)).status).toBe(200);
  });

  test(`${label}: ROPA gaps share the action workflow — an action closes only under D-056`, async ({ request }) => {
    const r = base(journey.orgId);
    const created = await api(request, "POST", `${r}/ropa`, journey.writer.email, {
      ...COMPLETE,
      name: `${NAME_PREFIX} ${label} gaps`,
      retentionRule: "Unknown",
    });
    const recordId = created.json.data.record.id as string;

    const generated = await api(request, "POST", `${r}/ropa/gaps/generate`, journey.writer.email);
    expect(generated.status, generated.text).toBe(200);
    const list = await api(request, "GET", `${r}/ropa/gaps`, journey.writer.email);
    expect(list.json.data.stale).toBe(false);
    const mine = list.json.data.gaps.filter((g: { recordId: string }) => g.recordId === recordId);
    expect(mine.map((g: { gapCode: string }) => g.gapCode).sort()).toEqual(["no_owner", "retention_missing"]);
    for (const g of mine) {
      expect(g.actions).toHaveLength(1);
      expect(g.actions[0]).toMatchObject({ gapId: null, ropaGapId: g.id, status: "open" });
    }

    const gap = mine.find((g: { gapCode: string }) => g.gapCode === "retention_missing");
    const action = gap.actions[0];
    const url = `${r}/ropa/gaps/${gap.id}/actions/${action.id}`;
    // No owner → refused.
    expect((await api(request, "PATCH", url, journey.reviewer.email, { status: "closed" })).status).toBe(409);
    // The owner, alone, with nothing attached → refused.
    expect((await api(request, "PATCH", url, journey.writer.email, { ownerUserId: journey.owner.id })).status).toBe(200);
    const alone = await api(request, "PATCH", url, journey.owner.email, { status: "closed" });
    expect(alone.status).toBe(409);
    // A reviewer who is not the owner → closed, on approval.
    const closed = await api(request, "PATCH", url, journey.reviewer.email, { status: "closed" });
    expect(closed.status, closed.text).toBe(200);
    expect(closed.json.data.gap.actions[0]).toMatchObject({ status: "closed", closureBasis: "reviewer_approval" });

    // Fixing the record makes the register stale; regenerating keeps the worked action.
    await api(request, "PATCH", `${r}/ropa/${recordId}`, journey.writer.email, { retentionRule: "Seven years" });
    expect((await api(request, "GET", `${r}/ropa/gaps`, journey.writer.email)).json.data.stale).toBe(true);
    await api(request, "POST", `${r}/ropa/gaps/generate`, journey.writer.email);
    const after = (await api(request, "GET", `${r}/ropa/gaps`, journey.writer.email)).json.data.gaps.find(
      (g: { id: string }) => g.id === gap.id,
    );
    expect(after).toMatchObject({ state: "superseded" });
  });
}

test("import: 8 good rows and 2 bad import 8 and report 2, with reasons; a formula is kept as text", async ({ request }) => {
  const r = base(MU.id);
  const as = MU_JOURNEY.writer.email;
  const formula = '=HYPERLINK("http://evil.example","click")';
  const row = (n: number) => `${NAME_PREFIX} import ${n},Purpose ${n},Students,2027-01-15,`;
  const csv = [
    "Processing Activity,Purpose,Data Principal Type,Next Review,Evidence",
    row(1),
    row(2),
    ",A row with no name,Students,2027-01-15,", // file row 4
    row(3),
    row(4),
    `${NAME_PREFIX} import 5,Purpose,Students,31/31/2027,`, // file row 7: bad date
    row(6),
    row(7),
    `${NAME_PREFIX} import 8,Purpose,Students,2027-01-15,"${formula.replace(/"/g, '""')}"`,
    row(9),
  ].join("\n");

  const check = await api(request, "POST", `${r}/ropa/import`, as, { csv, dryRun: true });
  expect(check.status, check.text).toBe(200);
  expect(check.json.data).toMatchObject({ dryRun: true, valid: 8, unmapped: [], missingRequired: [] });
  expect(check.json.data.mapping).toMatchObject({ "Processing Activity": "name", Purpose: "purpose", Evidence: "evidenceNote" });
  expect(check.json.data.rejected.map((x: { row: number }) => x.row)).toEqual([4, 7]);

  const done = await api(request, "POST", `${r}/ropa/import`, as, { csv });
  expect(done.status, done.text).toBe(201);
  expect(done.json.data.imported).toBe(8);
  expect(done.json.data.rejected).toEqual([
    { row: 4, errors: [{ field: "name", issue: "The processing activity needs a name." }] },
    { row: 7, errors: [{ field: "nextReviewAt", issue: "Use a date like 2026-12-31 or 31/12/2026." }] },
  ]);

  // Stored as typed: a formula is text, never evaluated.
  const ids: string[] = done.json.data.ids;
  const records = await Promise.all(ids.map((id) => api(request, "GET", `${r}/ropa/${id}`, as)));
  const withFormula = records.find((x) => x.json.data.record.name === `${NAME_PREFIX} import 8`)!;
  expect(withFormula.json.data.record).toMatchObject({ evidenceNote: formula, status: "draft" });

  // Exactly ONE audit row for the import, with the counts.
  const audit = await withDb((db) =>
    db.query<{ metadata: Record<string, number> }>(
      "SELECT metadata FROM public.audit_logs WHERE organization_id = $1 AND event_type = 'ropa.records.imported' ORDER BY created_at DESC LIMIT 1",
      [MU.id],
    ),
  );
  expect(audit.rows[0]!.metadata).toEqual({ imported: 8, rejected: 0, submitted: 8 });
  const perRecord = await withDb((db) => db.query("SELECT 1 FROM public.audit_logs WHERE entity_id = ANY($1::uuid[])", [ids]));
  expect(perRecord.rowCount).toBe(0);

  // A file with no importable row is refused as a whole.
  const none = await api(request, "POST", `${r}/ropa/import`, as, { csv: "Processing Activity,Purpose\n,x\n,y" });
  expect(none.status).toBe(422);
  // A file with no name column cannot run until it is mapped.
  const unmapped = await api(request, "POST", `${r}/ropa/import`, as, { csv: "Activity title,Purpose\nx,y", dryRun: true });
  expect(unmapped.status).toBe(422);
  // A contributor without ropa.write cannot import.
  const dean = await api(request, "POST", `${r}/ropa/import`, SEED_USERS.muDean.email, { csv });
  expect(dean.status).toBe(403);
});

test("export: CSV a spreadsheet cannot execute, saying what it is — and every export is audited", async ({ request }) => {
  const res = await request.get(`${base(MU.id)}/ropa/export`, { headers: bearer(await accessTokenFor(MU_JOURNEY.writer.email)) });
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toContain("text/csv");
  expect(res.headers()["content-disposition"]).toMatch(/attachment; filename="ropa-register-\d{4}-\d{2}-\d{2}\.csv"/);
  const body = await res.text();
  expect(body).toContain("A DPDP readiness register, not a statutory record.");
  expect(body).toContain("Processing Activity");
  expect(body).toContain("Online admission application");
  expect(body.toLowerCase()).not.toContain("compliant");
  // The imported formula leaves guarded.
  expect(body).toContain(`"'=HYPERLINK(""http://evil.example"",""click"")"`);

  const audit = await withDb((db) =>
    db.query<{ user_id: string; metadata: { recordCount: number } }>(
      "SELECT user_id, metadata FROM public.audit_logs WHERE organization_id = $1 AND event_type = 'ropa.register.exported' ORDER BY created_at DESC LIMIT 1",
      [MU.id],
    ),
  );
  expect(audit.rows[0]!.user_id).toBe(MU_JOURNEY.writer.id);
  expect(audit.rows[0]!.metadata.recordCount).toBeGreaterThanOrEqual(10);
});

test("the register never moves the readiness score: the ROPA domain is where it was", async ({ request }) => {
  const as = MU_JOURNEY.writer.email;
  const score = async () => {
    const res = await api(request, "GET", `${base(MU.id)}/assessments/${SEED_ASSESSMENTS.muBaseline.id}/score`, as);
    expect(res.status, res.text).toBe(200);
    return res.json.data.domains.find((d: { code: string }) => d.code === "ROPA");
  };
  const before = await score();
  for (let i = 0; i < 3; i++) {
    await api(request, "POST", `${base(MU.id)}/ropa`, as, { ...COMPLETE, name: `${NAME_PREFIX} score ${i}`, ownerUserId: MU_JOURNEY.owner.id });
  }
  expect(await score()).toEqual(before);
});

test("the seeded register reads as the workbook typed it, and an empty register opens one critical gap", async ({ request }) => {
  const mu = await api(request, "GET", `${base(MU.id)}/ropa`, SEED_USERS.muDean.email);
  expect(mu.status).toBe(200);
  const seeded = mu.json.data.records.filter((x: { recordCode: string }) => /^ROPA-0(0[1-9]|10)$/.test(x.recordCode));
  expect(seeded).toHaveLength(10);
  expect(mu.json.data.positioning).toContain("not a statutory record");
  // A read-only role sees no form options.
  expect(mu.json.data.options).toBeNull();

  const bml = await api(request, "GET", `${base(BML.id)}/ropa`, SEED_USERS.bharatManufacturing.email);
  expect(bml.json.data.records).toEqual([]);
  await api(request, "POST", `${base(BML.id)}/ropa/gaps/generate`, SEED_USERS.bharatManufacturing.email);
  const gaps = await api(request, "GET", `${base(BML.id)}/ropa/gaps`, SEED_USERS.bharatManufacturing.email);
  expect(gaps.json.data.gaps.map((g: { gapCode: string; severity: string; recordId: string | null }) => [g.gapCode, g.severity, g.recordId])).toEqual([
    ["no_records", "critical", null],
  ]);
});

test("Org B never reaches Org A's records — not by path, not by id", async ({ request }) => {
  const recordId = (await api(request, "GET", `${base(MU.id)}/ropa`, MU_JOURNEY.writer.email)).json.data.records[0].id as string;
  const bml = SEED_USERS.bharatManufacturing.email;
  // Org A's path: not a member → 403.
  expect((await api(request, "GET", `${base(MU.id)}/ropa/${recordId}`, bml)).status).toBe(403);
  // Org B's own path with Org A's record id → 404, and nothing about it.
  const byId = await api(request, "GET", `${base(BML.id)}/ropa/${recordId}`, bml);
  expect(byId.status).toBe(404);
  expect(byId.text).not.toContain("Online admission application");
  const patch = await api(request, "PATCH", `${base(BML.id)}/ropa/${recordId}`, bml, { name: "Hijacked" });
  expect(patch.status).toBe(404);
  // …and Org B's evidence cannot be linked to Org A's record through Org B's path.
  const issued = await api(request, "POST", `${base(BML.id)}/evidence/upload-url`, bml, {
    fileName: "bml.txt",
    contentType: "text/plain",
    byteSize: 3,
  });
  createdEvidence.push({ orgId: BML.id, id: issued.json.data.evidence.id });
  const put = await request.put(issued.json.data.upload.url, { data: Buffer.from("bml"), headers: { "Content-Type": "text/plain" } });
  expect(put.status()).toBe(200);
  const link = await api(request, "POST", `${base(BML.id)}/evidence/${issued.json.data.evidence.id}/link`, bml, { ropaRecordId: recordId });
  expect(link.status).toBe(404);
});

test("D-065: a legitimate use asks for no notice; children need parental consent; a processor needs a contract", async ({ request }) => {
  const r = base(MU.id);
  const as = MU_JOURNEY.writer.email;
  const payroll = await api(request, "POST", `${r}/ropa`, as, {
    ...COMPLETE,
    name: `${NAME_PREFIX} payroll`,
    lawfulBasis: "employment",
    noticeLinked: null,
    consentLinked: null,
    ownerUserId: MU_JOURNEY.owner.id,
  });
  expect(payroll.status, payroll.text).toBe(201);
  const areas = payroll.json.data.record.areas as { code: string; complete: boolean }[];
  expect(areas.find((a) => a.code === "notice_consent")!.complete).toBe(true);

  const children = await api(request, "POST", `${r}/ropa`, as, {
    ...COMPLETE,
    name: `${NAME_PREFIX} children`,
    childrenData: "yes",
    vendorsText: "LMS provider",
    vendorIds: [SEED_SCOPE.mumbaiUniversity.vendors.lmsProvider.id], // contract yes, DPDP clauses no
  });
  expect(children.status, children.text).toBe(201);
  expect(children.json.data.record.vendorContractGaps).toBe(1);

  await api(request, "POST", `${r}/ropa/gaps/generate`, as);
  const gaps = (await api(request, "GET", `${r}/ropa/gaps`, as)).json.data.gaps as { recordId: string; gapCode: string }[];
  const of = (id: string) => gaps.filter((g) => g.recordId === id).map((g) => g.gapCode).sort();
  expect(of(payroll.json.data.record.id)).toEqual([]);
  expect(of(children.json.data.record.id)).toEqual(["child_consent_missing", "child_tracking", "no_owner", "processor_contract_missing"]);

  // An exemption and parental consent are recorded choices, refused when outside the vocabulary.
  const bad = await api(request, "PATCH", `${r}/ropa/${children.json.data.record.id}`, as, { childExemption: "university" });
  expect(bad.status).toBe(400);
});

test("D-066: templates for the industry, and the register answers 'what do we hold about…' and 'what does this touch'", async ({ request }) => {
  const r = base(MU.id);
  const list = await api(request, "GET", `${r}/ropa`, MU_JOURNEY.writer.email);
  expect(list.json.data.industryCode).toBe("university");
  expect(list.json.data.templates[0].name).toBe("Online admission application");
  // A read-only role gets no templates.
  expect((await api(request, "GET", `${r}/ropa`, SEED_USERS.muDean.email)).json.data.templates).toEqual([]);

  const options = await api(request, "GET", `${r}/ropa/lookup`, SEED_USERS.muDean.email);
  expect(options.status, options.text).toBe(200);
  expect(options.json.data.principals).toContain("Student");

  const students = await api(request, "GET", `${r}/ropa/lookup?principal=Student`, SEED_USERS.muDean.email);
  const codes = (students.json.data.records as { recordCode: string }[]).map((x) => x.recordCode);
  expect(codes).toEqual(expect.arrayContaining(["ROPA-002", "ROPA-003", "ROPA-004"]));
  expect(codes).not.toContain("ROPA-005"); // payroll: faculty, staff, employees

  // MU's student ERP: linked to five of the seeded records.
  const erp = await api(request, "GET", `${r}/ropa/lookup?systemId=${SEED_SCOPE.mumbaiUniversity.systems.sis.id}`, SEED_USERS.muDean.email);
  const linked = (erp.json.data.records as { recordCode: string; match: string }[]).filter((x) => x.match === "linked").map((x) => x.recordCode);
  expect(linked).toEqual(expect.arrayContaining(["ROPA-001", "ROPA-002", "ROPA-003", "ROPA-006", "ROPA-007"]));

  // Another organisation's system under MU's path is a 404, and one question at a time.
  expect((await api(request, "GET", `${r}/ropa/lookup?systemId=${SEED_SCOPE.bharatManufacturing.systems.hrms.id}`, SEED_USERS.muDean.email)).status).toBe(404);
  expect((await api(request, "GET", `${r}/ropa/lookup?principal=x&systemId=${SEED_SCOPE.mumbaiUniversity.systems.sis.id}`, SEED_USERS.muDean.email)).status).toBe(400);
});

test("D-067: an Excel workbook imports through the same checks — values only, bad rows reported", async ({ request }) => {
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  const sheet = wb.addWorksheet("ROPA_Register");
  sheet.addRow(["Processing Activity", "Purpose", "Lawful Basis", "Evidence"]);
  for (let n = 1; n <= 8; n++) sheet.addRow([`${NAME_PREFIX} xlsx ${n}`, `Purpose ${n}`, "s.7(i)", ""]);
  sheet.addRow(["", "No name", "", ""]);
  sheet.addRow([`${NAME_PREFIX} xlsx bad ground`, "Purpose", "legitimate interest", ""]);
  sheet.getCell("D2").value = { formula: 'HYPERLINK("http://evil.example","contract")', result: "contract" } as never;
  const xlsx = Buffer.from(await wb.xlsx.writeBuffer()).toString("base64");

  const r = base(MU.id);
  const done = await api(request, "POST", `${r}/ropa/import`, MU_JOURNEY.writer.email, { xlsx });
  expect(done.status, done.text).toBe(201);
  expect(done.json.data.imported).toBe(8);
  expect(done.json.data.rejected.map((x: { row: number }) => x.row)).toEqual([10, 11]);
  const first = await api(request, "GET", `${r}/ropa/${done.json.data.ids[0]}`, MU_JOURNEY.writer.email);
  expect(first.json.data.record).toMatchObject({ evidenceNote: "contract", lawfulBasis: "employment" });

  // Not a workbook, or both files at once: refused.
  expect((await api(request, "POST", `${r}/ropa/import`, MU_JOURNEY.writer.email, { xlsx: Buffer.from("nope").toString("base64") })).status).toBe(422);
  expect((await api(request, "POST", `${r}/ropa/import`, MU_JOURNEY.writer.email, { xlsx, csv: "a" })).status).toBe(400);
});

test("a large register still reads in one call — no id list long enough to break the URL (found in Slice 7)", async ({ request }) => {
  const r = base(GENERAL_TENANT.organizationId);
  const as = GENERAL_JOURNEY.writer.email;
  const rows = Array.from({ length: 60 }, (_, i) => `${NAME_PREFIX} bulk ${i},Purpose ${i}`);
  const imported = await api(request, "POST", `${r}/ropa/import`, as, { csv: ["Processing Activity,Purpose", ...rows].join("\n") });
  expect(imported.status, imported.text).toBe(201);
  expect((await api(request, "POST", `${r}/ropa/gaps/generate`, as)).status).toBe(200);
  const gaps = await api(request, "GET", `${r}/ropa/gaps`, as);
  expect(gaps.status, gaps.text.slice(0, 200)).toBe(200);
  // Every imported record opens several gaps, each with one action.
  expect(gaps.json.data.gaps.length).toBeGreaterThan(300);
  for (const g of gaps.json.data.gaps) expect(g.actions).toHaveLength(1);
});
