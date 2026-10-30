/**
 * Slice 10, Stage 4a — the processor register through the API: the contract
 * on the vendor register, a vendor's documents, the staff-entered
 * questionnaire with its accuracy controls (D-089), exposure model 1.4.0 —
 * and GATE 5.
 *
 * An accepted assessment is never deleted, so nothing here touches MU or BML
 * (SLICE_10 pitfall 7): one disposable tenant (`…a01b`) with three people —
 * the Organisation Admin who enters, Legal who reviews, the Executive Sponsor
 * who only reads.
 */
import { SCORED_VENDOR_QUESTIONS, addMonths } from "@truststack/core";
import { expect, test, type APIRequestContext } from "@playwright/test";
import { accessTokenFor, bearer, createE2eTenant, removeE2eTenant, SEED_USERS } from "../helpers";

/** Organisation Admin here: scope.write, vendor.assess, vendor.review. */
const ADMIN = SEED_USERS.muItSecurity;
/** Legal here: vendor.assess and vendor.review, never scope.write. */
const LEGAL = SEED_USERS.muLegal;
/** Executive Sponsor here: reads only. */
const SPONSOR = SEED_USERS.muDean;
/** A member of none of it. */
const OUTSIDER = SEED_USERS.bharatManufacturing;

const TENANT = {
  organizationId: "0b0000ff-0000-4000-8000-00000000a01b",
  name: "E2E Processor Tenant",
  industryCode: "general",
  member: { userId: ADMIN.id, email: ADMIN.email },
  roleCode: "organization_admin",
  extraMembers: [
    { userId: LEGAL.id, roleCode: "legal_user" },
    { userId: SPONSOR.id, roleCode: "executive_sponsor" },
  ],
};

const org = `/api/v1/organizations/${TENANT.organizationId}`;
const todayInIndia = () => new Date(Date.now() + 5.5 * 3_600_000).toISOString().slice(0, 10);

async function call(request: APIRequestContext, method: "get" | "post" | "patch" | "delete", url: string, email: string, data?: object) {
  const res = await request[method](url, { headers: bearer(await accessTokenFor(email)), ...(data ? { data } : {}) });
  const text = await res.text();
  return { status: res.status(), json: text ? JSON.parse(text) : null, text };
}

/** Every scored question answered with no risk; `docs` cites a document on the answers that need one. */
function complete(docs: Record<string, string> = {}) {
  return SCORED_VENDOR_QUESTIONS.map((q) =>
    q.type === "select"
      ? { code: q.code, answer: q.options!.find((o) => o.riskTenths === 0)!.value }
      : { code: q.code, answer: q.riskyAnswer === "no" ? "yes" : "no", evidenceId: docs[q.code] ?? null },
  );
}

test.describe.configure({ mode: "serial" });

let vendorId = "";
let assessmentId = "";
let contractId = "";

test.beforeAll(async () => {
  await createE2eTenant(TENANT);
});
test.afterAll(async () => {
  await removeE2eTenant(TENANT);
});

test("a vendor's contract is recorded on the vendor register, and the register counts its gap", async ({ request }) => {
  const created = await call(request, "post", `${org}/vendors`, ADMIN.email, {
    name: "E2E Cloud Hosting",
    vendorRole: "data_processor",
    contractExists: "yes",
    dpdpClauses: "no",
    crossBorder: "no",
    subProcessorsKnown: "yes",
  });
  expect(created.status, created.text).toBe(201);
  vendorId = created.json.data.item.id;
  expect(created.json.data.item).toMatchObject({ contractSignedOn: null, contractReviewBy: null });

  const register = await call(request, "get", `${org}/processors`, SPONSOR.email);
  expect(register.status, register.text).toBe(200);
  expect(register.json.data.counts).toMatchObject({ processors: 1, contractGaps: 1, neverAssessed: 1, awaitingReview: 0, outOfDate: 0 });

  // The dates: the review after the signing, and Legal (no scope.write) cannot change the register.
  const backwards = await call(request, "patch", `${org}/vendors/${vendorId}`, ADMIN.email, { contractSignedOn: "2026-08-01", contractReviewBy: "2026-07-01" });
  expect(backwards.status, backwards.text).toBe(422);
  const legal = await call(request, "patch", `${org}/vendors/${vendorId}`, LEGAL.email, { dpdpClauses: "yes" });
  expect(legal.status).toBe(403);
  const dated = await call(request, "patch", `${org}/vendors/${vendorId}`, ADMIN.email, { contractSignedOn: "2026-08-01", contractReviewBy: "2027-08-01" });
  expect(dated.status, dated.text).toBe(200);
  expect(dated.json.data.item).toMatchObject({ contractSignedOn: "2026-08-01", contractReviewBy: "2027-08-01" });
});

test("a document is stored as evidence and attached to the vendor with vendor.assess", async ({ request }) => {
  const body = "SAMPLE — E2E signed DPA";
  const issued = await call(request, "post", `${org}/evidence/upload-url`, ADMIN.email, { fileName: "dpa.txt", contentType: "text/plain", byteSize: Buffer.byteLength(body) });
  expect(issued.status, issued.text).toBe(201);
  contractId = issued.json.data.evidence.id;
  const put = await request.put(issued.json.data.upload.url, { data: Buffer.from(body), headers: { "Content-Type": "text/plain" } });
  expect(put.status()).toBe(200);
  // The Sponsor cannot attach it; the Admin can, once.
  expect((await call(request, "post", `${org}/evidence/${contractId}/link`, SPONSOR.email, { vendorId })).status).toBe(403);
  const linked = await call(request, "post", `${org}/evidence/${contractId}/link`, ADMIN.email, { vendorId });
  expect(linked.status, linked.text).toBe(201);
  expect((await call(request, "post", `${org}/evidence/${contractId}/link`, ADMIN.email, { vendorId })).status).toBe(409);

  const vendor = await call(request, "get", `${org}/processors/${vendorId}`, SPONSOR.email);
  expect(vendor.json.data.processor.documents.map((d: { id: string; counts: boolean }) => [d.id, d.counts])).toEqual([[contractId, true]]);
});

test("complete (4a.4.1) and evidence-backed (4a.4.2): a draft may be partial; a submission may not; a claim needs its document", async ({ request }) => {
  expect((await call(request, "post", `${org}/processors/${vendorId}/assessments`, SPONSOR.email)).status).toBe(403);
  const started = await call(request, "post", `${org}/processors/${vendorId}/assessments`, ADMIN.email);
  expect(started.status, started.text).toBe(201);
  assessmentId = started.json.data.assessment.id;
  expect(started.json.data.assessment).toMatchObject({ version: 1, status: "draft", source: "staff", riskScore: null, missing: SCORED_VENDOR_QUESTIONS.map((q) => q.code) });
  expect((await call(request, "post", `${org}/processors/${vendorId}/assessments`, LEGAL.email)).status).toBe(409);

  const base = `${org}/processors/${vendorId}/assessments/${assessmentId}`;
  const wrong = await call(request, "patch", base, ADMIN.email, { sourceNote: null, answers: [{ code: "A3", answer: "partial" }] });
  expect(wrong.status, wrong.text).toBe(422);
  const noReason = await call(request, "patch", base, ADMIN.email, { sourceNote: null, answers: [{ code: "D3", notApplicable: true }] });
  expect(noReason.status).toBe(422);

  // G1 claimed with no document: the preview scores it as the risky answer, and says so.
  const partial = await call(request, "patch", base, ADMIN.email, { sourceNote: null, answers: [{ code: "G1", answer: "yes" }] });
  expect(partial.status, partial.text).toBe(200);
  expect(partial.json.data.assessment).toMatchObject({ riskIsPreview: true, riskScore: 100, unevidenced: ["G1"] });
  // …and it contradicts the register ("no DPDP clauses") — flagged for the reviewer, not resolved.
  expect(partial.json.data.assessment.flags.map((f: { code: string }) => f.code)).toContain("contract_vs_register");

  const early = await call(request, "post", `${base}/submit`, ADMIN.email);
  expect(early.status).toBe(422);
  expect(early.json.error.message).toMatch(/where the answers came from/);
  await call(request, "patch", base, ADMIN.email, { sourceNote: "The vendor's email of 3 Oct 2026", answers: [] });
  const missing = await call(request, "post", `${base}/submit`, ADMIN.email);
  expect(missing.status).toBe(422);
  expect(missing.json.error.message).toMatch(/43 questions are not answered or marked not applicable/);

  const docs = { G1: contractId };
  const full = await call(request, "patch", base, ADMIN.email, { sourceNote: "The vendor's email of 3 Oct 2026", answers: complete(docs) });
  expect(full.status, full.text).toBe(200);
  expect(full.json.data.assessment.missing).toEqual([]);
  const submitted = await call(request, "post", `${base}/submit`, ADMIN.email);
  expect(submitted.status, submitted.text).toBe(200);
  // A3, A4, C4 and D2 claimed with nothing cited; G1 backed by the contract.
  expect(submitted.json.data.assessment).toMatchObject({ status: "submitted", riskIsPreview: false, unevidenced: ["A3", "A4", "C4", "D2"] });
  expect(submitted.json.data.assessment.submittedBy).toBe(ADMIN.id);
  // Awaiting review, it no longer changes.
  expect((await call(request, "patch", base, ADMIN.email, { sourceNote: "x", answers: [] })).status).toBe(409);
});

test("a second person (4a.4.4): the person who entered it cannot review it; the Sponsor cannot; Legal returns, then accepts", async ({ request }) => {
  const base = `${org}/processors/${vendorId}/assessments/${assessmentId}`;
  const self = await call(request, "post", `${base}/review`, ADMIN.email, { decision: "accept" });
  expect(self.status, self.text).toBe(403);
  expect(self.json.error.message).toMatch(/someone else must review it/);
  expect((await call(request, "post", `${base}/review`, SPONSOR.email, { decision: "accept" })).status).toBe(403);
  expect((await call(request, "post", `${base}/review`, LEGAL.email, { decision: "return" })).status).toBe(422);

  const returned = await call(request, "post", `${base}/review`, LEGAL.email, { decision: "return", reason: "Attach the ISO certificate before A3 can stand." });
  expect(returned.status, returned.text).toBe(200);
  expect(returned.json.data.assessment).toMatchObject({ status: "returned", returnReason: "Attach the ISO certificate before A3 can stand.", reviewedBy: LEGAL.id });
  expect((await call(request, "post", `${base}/submit`, ADMIN.email)).status).toBe(200);

  const late = await call(request, "post", `${base}/review`, LEGAL.email, { decision: "accept", reviewBy: addMonths(todayInIndia(), 40) });
  expect(late.status).toBe(422);
  const accepted = await call(request, "post", `${base}/review`, LEGAL.email, { decision: "accept" });
  expect(accepted.status, accepted.text).toBe(200);
  expect(accepted.json.data.assessment).toMatchObject({ status: "accepted", reviewBy: addMonths(todayInIndia(), 12), outOfDate: false, reviewedBy: LEGAL.id });
});

test("frozen once accepted (4a.4.6): never changed or discarded; a correction is a new version that its starter cannot review", async ({ request }) => {
  const base = `${org}/processors/${vendorId}/assessments/${assessmentId}`;
  expect((await call(request, "patch", base, ADMIN.email, { sourceNote: "x", answers: [] })).status).toBe(409);
  expect((await call(request, "delete", base, ADMIN.email)).status).toBe(409);
  // The cited contract stays attached.
  const register = await call(request, "get", `${org}/processors`, SPONSOR.email);
  expect(register.json.data.counts).toMatchObject({ accepted: 1, neverAssessed: 0, awaitingReview: 0 });

  const next = await call(request, "post", `${org}/processors/${vendorId}/assessments`, LEGAL.email);
  expect(next.status, next.text).toBe(201);
  const v2 = next.json.data.assessment;
  expect(v2).toMatchObject({ version: 2, status: "draft" });
  expect(v2.answers).toHaveLength(SCORED_VENDOR_QUESTIONS.length);
  expect(v2.involved).toContain(LEGAL.id);
  // Discarding a draft is allowed; the accepted v1 still counts.
  expect((await call(request, "delete", `${org}/processors/${vendorId}/assessments/${v2.id}`, LEGAL.email)).status).toBe(200);
  const vendor = await call(request, "get", `${org}/processors/${vendorId}`, SPONSOR.email);
  expect(vendor.json.data.processor.current).toMatchObject({ version: 1, status: "accepted" });
  expect(vendor.json.data.processor.open).toBeNull();
});

test("model 1.4.0: the vendor's contract gap is read on heads 1 and 7; once recorded, it is not", async ({ request }) => {
  const read = async () => {
    const res = await call(request, "get", `${org}/exposure`, ADMIN.email);
    expect(res.status, res.text).toBe(200);
    return res.json.data;
  };
  const before = await read();
  expect(before.modelVersion).toBe("1.7.0");
  for (const code of ["H1", "H7"]) {
    const h = before.heads.find((x: { code: string }) => x.code === code);
    const read = h.evidencedBy.moduleInputs.map((m: { code: string }) => m.code);
    expect(read).toContain("vendor_contract_missing");
    expect(read).toContain("vendor_assessment_out_of_date");
    // With no assessment and no register gap the head is not yet assessed: a not-mitigated fact
    // never makes it assessed on its own (as 1.1.0's breach row). The stored-snapshot reasons are
    // held by tests/rls/vendors.test.ts on MU, whose heads are assessed.
    expect(h.status).toBe("not_yet_assessed");
  }
  expect((await call(request, "patch", `${org}/vendors/${vendorId}`, ADMIN.email, { dpdpClauses: "yes" })).status).toBe(200);
  const register = await call(request, "get", `${org}/processors`, SPONSOR.email);
  expect(register.json.data.counts.contractGaps).toBe(0);
});

test("gate 5: an outsider reads and writes nothing; a foreign id under this organisation is a 404", async ({ request }) => {
  expect((await call(request, "get", `${org}/processors`, OUTSIDER.email)).status).toBe(403);
  expect((await call(request, "get", `${org}/processors/${vendorId}`, OUTSIDER.email)).status).toBe(403);
  expect((await call(request, "post", `${org}/processors/${vendorId}/assessments`, OUTSIDER.email)).status).toBe(403);
  const bml = `/api/v1/organizations/${OUTSIDER.memberships[0].organizationId}`;
  const reach = await call(request, "get", `${bml}/processors/${vendorId}/assessments/${assessmentId}`, OUTSIDER.email);
  expect(reach.status).toBe(404);
  expect(reach.text).not.toContain("E2E Cloud Hosting");
  expect((await call(request, "post", `${bml}/processors/${vendorId}/assessments`, OUTSIDER.email)).status).toBe(404);
});
