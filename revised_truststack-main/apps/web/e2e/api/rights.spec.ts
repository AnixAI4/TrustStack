/**
 * Slice 10, Stage 2 — the rights and grievance register through the API:
 * staff-entered requests and grievances, the derived ninety-day clock and
 * TrustStack's 30-day target, the identity check, the response, the
 * lifecycle, nomination, a request's actions on the ONE action table (with
 * evidence), the overview's section and exposure model 1.2.0 — and GATE 5.
 *
 * A request is never deleted and a snapshot is permanent, so nothing here
 * touches MU or BML (SLICE_10 pitfall 7). Two disposable tenants: a HEALTHCARE
 * one where the requests are recorded (`…a011`) — not a university, so
 * nothing here is University-specific (D-040) — and an EMPTY general one
 * (`…a012`). BML's admin is the Org B attacker.
 */
import { addDays } from "@truststack/core";
import { expect, test, type APIRequestContext } from "@playwright/test";
import { accessTokenFor, bearer, createE2eTenant, removeE2eTenant, SEED_ORGS, SEED_USERS, withDb } from "../helpers";

const BML = SEED_ORGS.bharatManufacturing;
const base = (orgId: string) => `/api/v1/organizations/${orgId}`;

/** Organisation Admin here: rights.write, gap.write, evidence.write and evidence.review. */
const ADMIN = SEED_USERS.muItSecurity;
/** A Department Owner here: owns the remedial action, may not approve its own closure. */
const OWNER = SEED_USERS.muLegal;
/** Executive Sponsor here: reads the register, writes nothing. */
const SPONSOR = SEED_USERS.muDean;

const HEALTH = {
  organizationId: "0b0000ff-0000-4000-8000-00000000a011",
  name: "E2E Rights Register Healthcare Tenant",
  industryCode: "healthcare",
  dataPrincipalCountEstimate: 5000,
  member: { userId: ADMIN.id, email: ADMIN.email },
  roleCode: "organization_admin",
  extraMembers: [
    { userId: OWNER.id, roleCode: "department_owner" },
    { userId: SPONSOR.id, roleCode: "executive_sponsor" },
  ],
};
const EMPTY = {
  organizationId: "0b0000ff-0000-4000-8000-00000000a012",
  name: "E2E Rights Register Empty Tenant",
  industryCode: "general",
  member: { userId: ADMIN.id, email: ADMIN.email },
  roleCode: "organization_admin",
};

async function call(request: APIRequestContext, method: string, url: string, email: string, data?: object) {
  const res = await request.fetch(url, { method, headers: bearer(await accessTokenFor(email)), ...(data ? { data } : {}) });
  const text = await res.text();
  return { status: res.status(), text, json: text ? JSON.parse(text) : null };
}

/** Today in India — the register's calendar (D-055). */
const today = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
const daysAgo = (n: number) => addDays(today(), -n);

type Req = {
  id: string;
  requestCode: string;
  status: string;
  receivedOn: string;
  respondBy: string;
  clock: { state: string; label: string; daysOpen: number | null; targetBy: string };
  identity: { verifiedOn: string; recorded: { byUserId: string } } | null;
  response: { outcome: string; outcomeLabel: string; recorded: { byUserId: string } } | null;
  actions: { id: string; status: string; ownerUserId: string | null; rightsRequestId: string }[];
};

async function recordRequest(request: APIRequestContext, ago: number, over: object = {}): Promise<Req> {
  const r = await call(request, "POST", `${base(HEALTH.organizationId)}/rights-requests`, ADMIN.email, {
    kind: "access",
    receivedOn: daysAgo(ago),
    channel: "email",
    requesterName: "E2E Patient",
    requesterEmail: "e2e.patient@example.com",
    principalIdentifier: "Patient number E2E-0001",
    summary: "Asks for a copy of the records the hospital holds about them and who they were shared with.",
    ...over,
  });
  expect(r.status, r.text).toBe(201);
  return r.json.data.request as Req;
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

let overdue: Req;
let grievance: Req;

test("the empty state: no request, zero counts, and the overview's section says so", async ({ request }) => {
  const list = await call(request, "GET", `${base(EMPTY.organizationId)}/rights-requests`, ADMIN.email);
  expect(list.status, list.text).toBe(200);
  expect(list.json.data.requests).toEqual([]);
  expect(list.json.data.counts).toEqual({
    total: 0,
    openRequests: 0,
    openGrievances: 0,
    pastTarget: 0,
    overdue: 0,
    overdueGrievances: 0,
    responded: 0,
    respondedLate: 0,
    closedOtherwise: 0,
  });
  expect(list.json.data.clockNote).toContain("not exceeding ninety days");
  expect(list.json.data.clockNote).toContain("TrustStack's, not a statutory period");
  const dash = await call(request, "GET", `${base(EMPTY.organizationId)}/dashboard`, ADMIN.email);
  expect(dash.json.data.rights.counts.total).toBe(0);
  expect(dash.json.data.rights.attention).toEqual([]);
});

test("recording a request: the code and the respond-by date are the server's; the clock runs from receipt", async ({ request }) => {
  overdue = await recordRequest(request, 95);
  expect(overdue.requestCode).toMatch(new RegExp(`^DPR-${daysAgo(95).slice(0, 4)}-001$`));
  expect(overdue.respondBy).toBe(addDays(overdue.receivedOn, 90));
  expect(overdue.clock).toMatchObject({ state: "overdue", daysOpen: 95, label: "Overdue — day 95, past the 90-day ceiling" });
  expect(overdue.status).toBe("open");

  // A client cannot send the code, the respond-by date or a status.
  for (const forged of [{ requestCode: "DPR-2026-999" }, { respondBy: "2030-01-01" }, { status: "responded" }]) {
    const r = await call(request, "POST", `${base(HEALTH.organizationId)}/rights-requests`, ADMIN.email, {
      kind: "access",
      receivedOn: daysAgo(1),
      channel: "email",
      requesterName: "x",
      summary: "x",
      ...forged,
    });
    expect(r.status, JSON.stringify(forged)).toBe(400);
  }
  // Nothing in the future; receipt cannot be edited afterwards.
  const future = await call(request, "POST", `${base(HEALTH.organizationId)}/rights-requests`, ADMIN.email, {
    kind: "access",
    receivedOn: addDays(today(), 2),
    channel: "email",
    requesterName: "x",
    summary: "x",
  });
  expect(future.status).toBe(422);
  const move = await call(request, "PATCH", `${base(HEALTH.organizationId)}/rights-requests/${overdue.id}`, ADMIN.email, { receivedOn: daysAgo(1) });
  expect(move.status).toBe(400);
});

test("the clock's edges: day 30 on target, day 31 past TrustStack's target, day 90 in time", async ({ request }) => {
  const onTarget = await recordRequest(request, 30, { kind: "correction" });
  expect(onTarget.clock).toMatchObject({ state: "within_target", daysOpen: 30 });
  const pastTarget = await recordRequest(request, 31, { kind: "erasure" });
  expect(pastTarget.clock).toMatchObject({ state: "past_target", label: "Day 31 of 90 — past TrustStack's 30-day target" });
  const lastDay = await recordRequest(request, 90, { kind: "updating" });
  expect(lastDay.clock).toMatchObject({ state: "past_target", daysOpen: 90 });

  const list = await call(request, "GET", `${base(HEALTH.organizationId)}/rights-requests`, ADMIN.email);
  expect(list.json.data.counts).toMatchObject({ total: 4, openRequests: 4, pastTarget: 2, overdue: 1 });
  // The overview lists what needs someone now, oldest first.
  const dash = await call(request, "GET", `${base(HEALTH.organizationId)}/dashboard`, ADMIN.email);
  expect(dash.json.data.rights.attention.map((a: { requestCode: string }) => a.requestCode)).toEqual([
    overdue.requestCode,
    lastDay.requestCode,
    pastTarget.requestCode,
  ]);
});

test("1.2.0: a request open past ninety days sets head 7 Exposed; the 30-day target is a reason, never a status", async ({ request }) => {
  const r = await call(request, "GET", `${base(HEALTH.organizationId)}/exposure`, ADMIN.email);
  expect(r.status, r.text).toBe(200);
  expect(r.json.data.modelVersion).toBe("1.7.0");
  const h7 = r.json.data.heads.find((h: { code: string }) => h.code === "H7");
  expect(h7.status).toBe("exposed");
  const texts = h7.reasons.map((x: { text: string }) => x.text);
  expect(texts).toContain("1 rights request or grievance has been open for more than ninety days since it was received (Rule 14(3)).");
  expect(texts).toContain("2 rights requests or grievances are open past TrustStack's 30-day response target (a target, not a statutory period).");
  // 1.4.0 added the processor register's rows to head 7, after the rights rows; 1.5.0 the retention register's.
  expect(h7.evidencedBy.moduleInputs.map((m: { code: string }) => m.code)).toEqual([
    "rights_ceiling_overdue",
    "rights_target_overdue",
    "vendor_contract_missing",
    "vendor_assessment_out_of_date",
    "retention_overdue",
    "retention_end_unrecorded",
  ]);

  // A stored snapshot, derived in SQL, says exactly what the live model says.
  const stored = await call(request, "POST", `${base(HEALTH.organizationId)}/exposure/snapshots`, ADMIN.email);
  expect(stored.status, stored.text).toBe(201);
  expect(stored.json.data.modelVersion).toBe("1.7.0");
  const storedH7 = stored.json.data.heads.find((h: { code: string }) => h.code === "H7");
  expect({ status: storedH7.status, reasons: storedH7.reasons, position: storedH7.position }).toEqual({
    status: h7.status,
    reasons: h7.reasons,
    position: h7.position,
  });
});

test("the response: fulfilling needs the identity check; both are stamped with who recorded them; a late response says so", async ({ request }) => {
  const url = `${base(HEALTH.organizationId)}/rights-requests/${overdue.id}`;
  const early = await call(request, "PATCH", url, ADMIN.email, { status: "responded", response: { outcome: "fulfilled", respondedOn: today() } });
  expect(early.status).toBe(409);
  expect(early.json.error.message).toContain("identity was verified");
  const before = await call(request, "PATCH", url, ADMIN.email, { identity: { verifiedOn: daysAgo(96), method: "x" } });
  expect(before.status).toBe(422);

  const identified = await call(request, "PATCH", url, ADMIN.email, { identity: { verifiedOn: daysAgo(94), method: "Matched the patient number and date of birth" } });
  expect(identified.status, identified.text).toBe(200);
  expect(identified.json.data.request.identity).toMatchObject({ verifiedOn: daysAgo(94), recorded: { byUserId: ADMIN.id } });

  const partly = await call(request, "PATCH", url, ADMIN.email, { status: "responded", response: { outcome: "partly_fulfilled", respondedOn: today() } });
  expect(partly.status).toBe(422);
  const responded = await call(request, "PATCH", url, ADMIN.email, {
    status: "responded",
    response: { outcome: "fulfilled", respondedOn: today(), summary: "Sent the summary of records and the list of labs they were shared with." },
  });
  expect(responded.status, responded.text).toBe(200);
  const r = responded.json.data.request as Req;
  expect(r.response).toMatchObject({ outcome: "fulfilled", outcomeLabel: "Fulfilled", recorded: { byUserId: ADMIN.id } });
  expect(r.clock).toMatchObject({ state: "responded_late", label: "Responded on day 95 — after the 90-day ceiling" });

  // Responded is a record: reopen it to change it. Head 7 is no longer Exposed by it.
  const locked = await call(request, "PATCH", url, ADMIN.email, { summary: "Edited after responding" });
  expect(locked.status).toBe(409);
  const exposure = await call(request, "GET", `${base(HEALTH.organizationId)}/exposure`, ADMIN.email);
  const h7 = exposure.json.data.heads.find((h: { code: string }) => h.code === "H7");
  expect(h7.reasons.map((x: { text: string }) => x.text).join(" ")).not.toContain("more than ninety days");
  const list = await call(request, "GET", `${base(HEALTH.organizationId)}/rights-requests`, ADMIN.email);
  expect(list.json.data.counts).toMatchObject({ responded: 1, respondedLate: 1, overdue: 0 });
});

test("a grievance: its own code; resolved without an identity check; about an earlier request; never turned into a request", async ({ request }) => {
  grievance = await recordRequest(request, 5, {
    kind: "grievance",
    requesterName: "E2E Guardian",
    requesterCapacity: "guardian",
    summary: "The records sent were incomplete: the lab reports from March are missing.",
    relatedRequestId: overdue.id,
  });
  expect(grievance.requestCode).toMatch(/^GRV-\d{4}-001$/);
  const detail = await call(request, "GET", `${base(HEALTH.organizationId)}/rights-requests/${grievance.id}`, ADMIN.email);
  expect(detail.json.data.request.related).toEqual({ id: overdue.id, requestCode: overdue.requestCode });
  const across = await call(request, "PATCH", `${base(HEALTH.organizationId)}/rights-requests/${grievance.id}`, ADMIN.email, { kind: "erasure" });
  expect(across.status).toBe(422);

  // An Org B request id is not this tenant's.
  const foreign = await call(request, "POST", `${base(HEALTH.organizationId)}/rights-requests`, ADMIN.email, {
    kind: "grievance",
    receivedOn: daysAgo(1),
    channel: "letter",
    requesterName: "x",
    summary: "x",
    relatedRequestId: "0b000013-0000-4000-8000-0000000000ff",
  });
  expect(foreign.status).toBe(422);

  const dash = await call(request, "GET", `${base(HEALTH.organizationId)}/dashboard`, ADMIN.email);
  expect(dash.json.data.rights.counts).toMatchObject({ openGrievances: 1, overdueGrievances: 0 });
});

test("nomination names its nominee (Rule 14(4)); nothing else carries one", async ({ request }) => {
  const missing = await call(request, "POST", `${base(HEALTH.organizationId)}/rights-requests`, ADMIN.email, {
    kind: "nomination",
    receivedOn: daysAgo(2),
    channel: "in_person",
    requesterName: "E2E Patient",
    summary: "Nominates a sister to exercise their rights.",
  });
  expect(missing.status).toBe(422);
  const stray = await call(request, "POST", `${base(HEALTH.organizationId)}/rights-requests`, ADMIN.email, {
    kind: "access",
    receivedOn: daysAgo(2),
    channel: "in_person",
    requesterName: "E2E Patient",
    summary: "x",
    nomineeName: "Someone",
  });
  expect(stray.status).toBe(422);
  const nomination = await recordRequest(request, 2, {
    kind: "nomination",
    channel: "in_person",
    summary: "Nominates a sister to exercise their rights on death or incapacity.",
    nomineeName: "E2E Nominee",
    nomineeRelationship: "Sister",
  });
  expect(nomination.requestCode).toMatch(/^DPR-/);
  const detail = await call(request, "GET", `${base(HEALTH.organizationId)}/rights-requests/${nomination.id}`, ADMIN.email);
  expect(detail.json.data.request.nominee).toEqual({ name: "E2E Nominee", contact: null, relationship: "Sister" });
});

test("the lifecycle: withdrawn and void carry a reason; reopening withdraws the response and the reason", async ({ request }) => {
  const r = await recordRequest(request, 3, { kind: "correction" });
  const url = `${base(HEALTH.organizationId)}/rights-requests/${r.id}`;
  expect((await call(request, "PATCH", url, ADMIN.email, { status: "withdrawn" })).status).toBe(422);
  const withdrawn = await call(request, "PATCH", url, ADMIN.email, { status: "withdrawn", closureReason: "The patient phoned to withdraw it on the 2nd." });
  expect(withdrawn.status, withdrawn.text).toBe(200);
  expect(withdrawn.json.data.request.clock.state).toBe("not_applicable");
  const reopened = await call(request, "PATCH", url, ADMIN.email, { status: "open" });
  expect(reopened.status).toBe(200);
  expect(reopened.json.data.request.closureReason).toBeNull();
  const voided = await call(request, "PATCH", url, ADMIN.email, { status: "void", closureReason: "Recorded twice." });
  expect(voided.status).toBe(200);

  const back = await call(request, "PATCH", `${base(HEALTH.organizationId)}/rights-requests/${overdue.id}`, ADMIN.email, { status: "open" });
  expect(back.status, back.text).toBe(200);
  expect(back.json.data.request).toMatchObject({ status: "open", response: null });
  expect(back.json.data.request.identity).not.toBeNull();
});

test("a request's actions are on the ONE action list, labelled by source and named without the person; evidence attaches", async ({ request }) => {
  const url = `${base(HEALTH.organizationId)}/rights-requests/${grievance.id}/actions`;
  const added = await call(request, "POST", url, ADMIN.email, { title: "Include lab reports in every access response", ownerUserId: OWNER.id, dueDate: "2027-01-31" });
  expect(added.status, added.text).toBe(201);
  const action = added.json.data.request.actions[0];
  expect(action).toMatchObject({ status: "open", ownerUserId: OWNER.id, dueDate: "2027-01-31", rightsRequestId: grievance.id });

  const dash = await call(request, "GET", `${base(HEALTH.organizationId)}/dashboard`, ADMIN.email);
  expect(dash.json.data.actions.sources).toContain("rights");
  const item = dash.json.data.actions.items.find((i: { id: string }) => i.id === action.id);
  expect(item).toMatchObject({
    source: "rights",
    sourceLabel: "Rights and grievance register",
    parentName: `Grievance ${grievance.requestCode}`,
    severity: "high",
    priority: "P1",
    href: `/dashboard/rights/${grievance.id}`,
  });
  // Personal data stays in the register.
  expect(JSON.stringify(item)).not.toContain("E2E Guardian");
  expect(dash.json.data.actions.summary.bySource.rights).toEqual({ outstanding: 1, overdue: 0 });

  // Evidence attaches to the action, and the answer is a success (the Stage 1 link bug, fixed here).
  const token = await accessTokenFor(OWNER.email);
  const body = "Updated access-response checklist";
  const issued = await request.post(`${base(HEALTH.organizationId)}/evidence/upload-url`, {
    headers: bearer(token),
    data: { fileName: "checklist.txt", contentType: "text/plain", byteSize: Buffer.byteLength(body) },
  });
  expect(issued.status(), await issued.text()).toBe(201);
  const { evidence, upload } = (await issued.json()).data;
  expect((await request.put(upload.url, { data: Buffer.from(body), headers: { "Content-Type": upload.contentType } })).status()).toBe(200);
  const linked = await call(request, "POST", `${base(HEALTH.organizationId)}/evidence/${evidence.id}/link`, OWNER.email, { gapActionId: action.id });
  expect(linked.status, linked.text).toBe(201);
  expect(linked.json.data.action).toMatchObject({ id: action.id, rightsRequestId: grievance.id });
  const withEvidence = await call(request, "GET", `${base(HEALTH.organizationId)}/rights-requests/${grievance.id}`, ADMIN.email);
  expect(withEvidence.json.data.request.actions[0].evidence.map((e: { fileName: string }) => e.fileName)).toEqual(["checklist.txt"]);

  const actionUrl = `${url}/${action.id}`;
  // The owner cannot approve their own action without reviewed evidence (D-056)…
  const own = await call(request, "PATCH", actionUrl, OWNER.email, { status: "closed" });
  expect(own.status).toBe(409);
  // …a reviewer who is not the owner can.
  const approved = await call(request, "PATCH", actionUrl, ADMIN.email, { status: "closed" });
  expect(approved.status, approved.text).toBe(200);
  expect(approved.json.data.request.actions[0]).toMatchObject({ status: "closed", closureBasis: "reviewer_approval" });
});

test("permissions: the Executive Sponsor reads but writes nothing; a Department Owner may record a request", async ({ request }) => {
  const list = await call(request, "GET", `${base(HEALTH.organizationId)}/rights-requests`, SPONSOR.email);
  expect(list.status).toBe(200);
  const create = await call(request, "POST", `${base(HEALTH.organizationId)}/rights-requests`, SPONSOR.email, {
    kind: "access",
    receivedOn: daysAgo(1),
    channel: "email",
    requesterName: "x",
    summary: "x",
  });
  expect(create.status).toBe(403);
  const patch = await call(request, "PATCH", `${base(HEALTH.organizationId)}/rights-requests/${grievance.id}`, SPONSOR.email, { summary: "x" });
  expect(patch.status).toBe(403);
  const action = await call(request, "POST", `${base(HEALTH.organizationId)}/rights-requests/${grievance.id}/actions`, SPONSOR.email, { title: "x" });
  expect(action.status).toBe(403);
  const contributor = await call(request, "POST", `${base(HEALTH.organizationId)}/rights-requests`, OWNER.email, {
    kind: "erasure",
    receivedOn: daysAgo(1),
    channel: "letter",
    requesterName: "E2E Patient",
    summary: "Asks the hospital to erase their old mobile number.",
  });
  expect(contributor.status, contributor.text).toBe(201);
});

test("s.11(1)(b), D-139: an access request lists who the data was shared with, from the processing register", async ({ request }) => {
  const org = base(HEALTH.organizationId);
  const vendor = async (name: string, vendorRole: string, service: string | null) => {
    const v = await call(request, "POST", `${org}/vendors`, ADMIN.email, { name, vendorRole, service });
    expect(v.status, v.text).toBe(201);
    return v.json.data.item.id as string;
  };
  const lab = await vendor("E2E Path Lab", "data_processor", "Lab tests");
  const insurer = await vendor("E2E Insurer", "independent", null);
  const regulator = await vendor("E2E Statutory Registry", "independent", null);
  const record = async (body: object) => {
    const r = await call(request, "POST", `${org}/ropa`, ADMIN.email, body);
    expect(r.status, r.text).toBe(201);
  };
  await record({ name: "E2E Diagnostics", lawfulBasis: "consent", dataCategories: "Test results", vendorIds: [lab, insurer] });
  await record({ name: "E2E Claims", lawfulBasis: null, dataCategories: "Bills", sharing: "Third-party administrator", vendorIds: [insurer] });
  // A legal duty under s.7(d): s.11 does not reach it, so its recipient is not listed.
  await record({ name: "E2E Statutory returns", lawfulBasis: "legal_obligation", dataCategories: "Births", vendorIds: [regulator] });

  const r = await call(request, "GET", `${org}/rights-requests/${overdue.id}/sharing`, SPONSOR.email);
  expect(r.status, r.text).toBe(200);
  const d = r.json.data;
  expect(d.requestId).toBe(overdue.id);
  expect(d.recipients.map((x: { name: string; kind: string }) => [x.name, x.kind])).toEqual([
    ["E2E Insurer", "data_fiduciary"],
    ["E2E Path Lab", "data_processor"],
  ]);
  expect(d.recipients[0].records.map((x: { name: string }) => x.name)).toEqual(["E2E Diagnostics", "E2E Claims"]);
  expect(d.namedInRecords).toEqual([expect.objectContaining({ text: "Third-party administrator" })]);
  expect(d.counts).toMatchObject({ recordsRead: 3, recordsInScope: 2, recordsUndecided: 1, recordsOutOfScope: 1 });
  expect(d.text).toContain("- E2E Path Lab (Data Processor, Lab tests): Test results");
  expect(d.text).not.toContain("E2E Statutory Registry");
  expect(d.lawNote).toContain("s.11(2)");
  // Nothing about the person: no name, email or identifier.
  expect(r.text).not.toContain("E2E Patient");
  expect(r.text).not.toContain("e2e.patient@example.com");

  // Only an access request needs it; a foreign or missing id is a 404.
  const onGrievance = await call(request, "GET", `${org}/rights-requests/${grievance.id}/sharing`, ADMIN.email);
  expect(onGrievance.status, onGrievance.text).toBe(409);
  const missing = await call(request, "GET", `${org}/rights-requests/00000000-0000-4000-8000-000000000000/sharing`, ADMIN.email);
  expect(missing.status).toBe(404);
});

test("GATE 5: Org B's admin never reaches this tenant's register, by either path", async ({ request }) => {
  const bml = SEED_USERS.bmlAdmin.email;
  const viaHealth = await call(request, "GET", `${base(HEALTH.organizationId)}/rights-requests`, bml);
  expect(viaHealth.status).toBe(403);
  expect(viaHealth.json.error.code).toBe("TENANT_ACCESS_DENIED");
  for (const [method, tail, data] of [
    ["GET", `/rights-requests/${grievance.id}`, undefined],
    ["PATCH", `/rights-requests/${grievance.id}`, { summary: "Hijacked" }],
    ["POST", `/rights-requests/${grievance.id}/actions`, { title: "Hijacked" }],
    ["GET", `/rights-requests/${overdue.id}/sharing`, undefined],
  ] as const) {
    const r = await call(request, method, `${base(BML.id)}${tail}`, bml, data);
    expect(r.status, `${method} ${tail}`).toBe(404);
    expect(r.text).not.toContain(HEALTH.name);
    expect(r.text).not.toContain("E2E Guardian");
  }
  const still = await call(request, "GET", `${base(HEALTH.organizationId)}/rights-requests/${grievance.id}`, ADMIN.email);
  expect(still.json.data.request.summary).toBe("The records sent were incomplete: the lab reports from March are missing.");
});

test("every write is audited as the person — code, kind and status, never the person or what they asked", async () => {
  const rows = await withDb(async (db) =>
    (
      await db.query<{ event_type: string; user_id: string; metadata: Record<string, unknown> }>(
        "SELECT event_type, user_id, metadata FROM public.audit_logs WHERE organization_id = $1 AND entity_id = $2 ORDER BY created_at",
        [HEALTH.organizationId, overdue.id],
      )
    ).rows,
  );
  expect(rows[0]).toMatchObject({ event_type: "rights.rights_requests.insert", user_id: ADMIN.id });
  expect(rows.length).toBeGreaterThanOrEqual(4);
  const text = JSON.stringify(rows);
  for (const secret of ["E2E Patient", "e2e.patient", "E2E-0001", "Asks for a copy", "labs they were shared"]) expect(text).not.toContain(secret);
});
