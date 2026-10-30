/**
 * Slice 10, Stage 5 — the retention register and the AI risk register through
 * the API: schedules with the database's end date, Rule 8(3)'s year, Rule
 * 8(1)–(2) only for a recorded Third-Schedule class, erasures recorded once,
 * an overdue erasure's action on the ONE action table closing on the erasure
 * (D-095), documents on both registers, model 1.5.0 on heads 7 and 4 — and
 * GATE 5. D-096: an erasure counts only when complete (s.8(7)(b)) and not
 * marked as recorded in error; the AI register's s.9(3) question and Fourth
 * Schedule exemption; the overview's retention section.
 *
 * An erasure is never changed and a snapshot is permanent, so nothing here
 * touches MU or BML (SLICE_10 pitfall 7). Three disposable tenants: a
 * HEALTHCARE one where the registers are kept (`…a020`) — not a university,
 * so nothing here is University-specific (D-040) — an EMPTY general one
 * (`…a021`), and an E-COMMERCE one (`…a022`) that records its Third-Schedule
 * class. BML's admin is the outsider.
 */
import { addDays } from "@truststack/core";
import { expect, test, type APIRequestContext } from "@playwright/test";
import { accessTokenFor, bearer, createE2eTenant, removeE2eTenant, SEED_USERS, withDb } from "../helpers";

const base = (orgId: string) => `/api/v1/organizations/${orgId}`;

/** Organisation Admin here: retention.write, ropa.write, gap.write, evidence.write and evidence.review. */
const ADMIN = SEED_USERS.muItSecurity;
/** A Department Owner here: owns the erasure action. */
const OWNER = SEED_USERS.muLegal;
/** Executive Sponsor here: reads both registers, writes nothing. */
const SPONSOR = SEED_USERS.muDean;
/** Org B: a member of none of these tenants. */
const OUTSIDER = SEED_USERS.bmlAdmin;

const HEALTH = {
  organizationId: "0b0000ff-0000-4000-8000-00000000a020",
  name: "E2E Retention Register Healthcare Tenant",
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
  organizationId: "0b0000ff-0000-4000-8000-00000000a021",
  name: "E2E Retention Register Empty Tenant",
  industryCode: "general",
  member: { userId: ADMIN.id, email: ADMIN.email },
  roleCode: "organization_admin",
};
const SHOP = {
  organizationId: "0b0000ff-0000-4000-8000-00000000a022",
  name: "E2E Retention Register E-commerce Tenant",
  industryCode: "retail_ecommerce",
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

/** Processing records, as tooling: the register is the processing register's (one schedule per record). */
async function records(orgId: string, n: number): Promise<string[]> {
  return withDb(async (db) => {
    const ids: string[] = [];
    for (let i = 0; i < n; i += 1) {
      const { rows } = await db.query<{ id: string }>("INSERT INTO public.ropa_records (organization_id, name) VALUES ($1, $2) RETURNING id", [orgId, `E2E activity ${i + 1}`]);
      ids.push(rows[0]!.id);
    }
    return ids;
  });
}

type Schedule = {
  id: string;
  record: { recordCode: string } | null;
  basis: string;
  periodMonths: number;
  startsOn: string | null;
  endsOn: string | null;
  informBy: string | null;
  clock: { state: string; label: string };
  erasureIncomplete: boolean;
  erasures: { id: string; erasedOn: string; standing: string; recorded: { byUserId: string }; void: { byUserId: string; reason: string } | null }[];
  documents: { fileName: string }[];
  actions: { id: string; status: string; closureBasis: string | null; retentionScheduleId: string }[];
};

test.describe.configure({ mode: "serial" });

let recordIds: string[];
let shopRecords: string[];
test.beforeAll(async () => {
  await createE2eTenant(HEALTH);
  await createE2eTenant(EMPTY);
  await createE2eTenant(SHOP);
  recordIds = await records(HEALTH.organizationId, 3);
  shopRecords = await records(SHOP.organizationId, 1);
});
test.afterAll(async () => {
  await removeE2eTenant(HEALTH);
  await removeE2eTenant(EMPTY);
  await removeE2eTenant(SHOP);
});

let overdue: Schedule;
let noEnd: Schedule;

test("the empty state: no schedule, no AI system, zero counts", async ({ request }) => {
  const list = await call(request, "GET", `${base(EMPTY.organizationId)}/retention-schedules`, ADMIN.email);
  expect(list.status, list.text).toBe(200);
  expect(list.json.data).toMatchObject({
    schedules: [],
    counts: { total: 0, noEnd: 0, running: 0, endingSoon: 0, overdue: 0, erased: 0 },
    thirdSchedule: null,
  });
  expect(list.json.data.note).toContain("at least one year from the last day the data was processed (Rule 8(3))");
  expect(list.json.data.note).toContain("held only for the purposes in the Seventh Schedule");
  const ai = await call(request, "GET", `${base(EMPTY.organizationId)}/ai-systems`, ADMIN.email);
  expect(ai.status, ai.text).toBe(200);
  expect(ai.json.data).toMatchObject({
    systems: [],
    counts: { total: 0, inUse: 0, unreviewed: 0, childTracking: 0, childTrackingUnexempt: 0, childTrackingUnknown: 0 },
    sdfNotified: false,
  });
  // D-096 (R6): the overview's retention section, empty.
  const dash = await call(request, "GET", `${base(EMPTY.organizationId)}/dashboard`, ADMIN.email);
  expect(dash.status, dash.text).toBe(200);
  expect(dash.json.data.retention).toMatchObject({ counts: { total: 0, overdue: 0, endingSoon: 0, noEnd: 0 }, overdue: [] });
  expect(ai.json.data.note).toContain("Rule 13(3)");
});

test("a schedule's end date is the database's: start + period, in calendar months", async ({ request }) => {
  const url = `${base(HEALTH.organizationId)}/retention-schedules`;
  const r = await call(request, "POST", url, ADMIN.email, {
    ropaRecordId: recordIds[0],
    basis: "purpose_served",
    periodMonths: 12,
    startsOn: daysAgo(400),
    notes: "Discharged patients' appointment reminders.",
  });
  expect(r.status, r.text).toBe(201);
  overdue = r.json.data.schedule;
  expect(overdue).toMatchObject({ basis: "purpose_served", periodMonths: 12, startsOn: daysAgo(400), informBy: null });
  expect(overdue.record?.recordCode).toMatch(/^ROPA-\d{3}$/);
  expect(overdue.endsOn! < today()).toBe(true);
  expect(overdue.clock).toMatchObject({ state: "overdue", label: "Erasure overdue" });

  const r2 = await call(request, "POST", url, ADMIN.email, { ropaRecordId: recordIds[1], basis: "fixed_period", periodMonths: 84 });
  expect(r2.status, r2.text).toBe(201);
  noEnd = r2.json.data.schedule;
  expect(noEnd).toMatchObject({ startsOn: null, endsOn: null, clock: { state: "no_end", label: "No end recorded" } });

  const list = await call(request, "GET", url, SPONSOR.email);
  expect(list.status).toBe(200);
  expect(list.json.data.counts).toMatchObject({ total: 2, overdue: 1, noEnd: 1 });
});

test("Rule 8(3)'s year, the named law, no future start, one schedule per record, no foreign record", async ({ request }) => {
  const url = `${base(HEALTH.organizationId)}/retention-schedules`;
  const short = await call(request, "POST", url, ADMIN.email, { ropaRecordId: recordIds[2], basis: "fixed_period", periodMonths: 11, startsOn: daysAgo(10) });
  expect(short.status).toBe(422);
  expect(short.json.error.message).toContain("Rule 8(3)");
  const noLaw = await call(request, "POST", url, ADMIN.email, { ropaRecordId: recordIds[2], basis: "legal_requirement", periodMonths: 96 });
  expect(noLaw.status).toBe(422);
  expect(noLaw.json.error.message).toContain("Name the law");
  const future = await call(request, "POST", url, ADMIN.email, { ropaRecordId: recordIds[2], basis: "fixed_period", periodMonths: 12, startsOn: addDays(today(), 1) });
  expect(future.status).toBe(422);
  const deemed = await call(request, "POST", url, ADMIN.email, { ropaRecordId: recordIds[2], basis: "deemed_inactivity", periodMonths: 36 });
  expect(deemed.status).toBe(422);
  expect(deemed.json.error.message).toContain("Third-Schedule class");
  const twice = await call(request, "POST", url, ADMIN.email, { ropaRecordId: recordIds[0], basis: "fixed_period", periodMonths: 12 });
  expect(twice.status).toBe(409);
  const foreign = await call(request, "POST", url, ADMIN.email, { ropaRecordId: shopRecords[0], basis: "fixed_period", periodMonths: 12 });
  expect(foreign.status, foreign.text).toBe(422);
  expect(foreign.text).not.toContain(SHOP.name);
});

test("model 1.5.0: the overdue erasure sets head 7 Exposed; no end recorded is a reason; a stored snapshot agrees", async ({ request }) => {
  const live = await call(request, "GET", `${base(HEALTH.organizationId)}/exposure`, ADMIN.email);
  expect(live.status, live.text).toBe(200);
  expect(live.json.data.modelVersion).toBe("1.7.0");
  const h7 = live.json.data.heads.find((h: { code: string }) => h.code === "H7");
  expect(h7.status).toBe("exposed");
  const texts = h7.reasons.map((x: { text: string }) => x.text);
  expect(texts).toContain("1 retention schedule is past its end date with no erasure recorded (s.8(7)).");
  expect(texts).toContain("1 retention schedule has no end date recorded, so its erasure cannot be shown to follow (s.8(7)).");
  const stored = await call(request, "POST", `${base(HEALTH.organizationId)}/exposure/snapshots`, ADMIN.email);
  expect(stored.status, stored.text).toBe(201);
  const storedH7 = stored.json.data.heads.find((h: { code: string }) => h.code === "H7");
  expect(storedH7.status).toBe("exposed");
  expect(storedH7.reasons.map((x: { text: string }) => x.text)).toEqual(texts);
});

test("the overdue erasure is work on the ONE action list, and closes on the erasure someone else recorded (D-095)", async ({ request }) => {
  const url = `${base(HEALTH.organizationId)}/retention-schedules/${overdue.id}`;
  const added = await call(request, "POST", `${url}/actions`, ADMIN.email, { title: "Erase the reminder list from the SMS tool", ownerUserId: OWNER.id, dueDate: addDays(today(), 14) });
  expect(added.status, added.text).toBe(201);
  const action = added.json.data.schedule.actions[0];
  expect(action).toMatchObject({ status: "open", retentionScheduleId: overdue.id });

  const dash = await call(request, "GET", `${base(HEALTH.organizationId)}/dashboard`, ADMIN.email);
  expect(dash.json.data.actions.sources).toContain("retention");
  const item = dash.json.data.actions.items.find((i: { id: string }) => i.id === action.id);
  expect(item).toMatchObject({ source: "retention", sourceLabel: "Retention register", severity: "high", priority: "P1", href: `/dashboard/retention/${overdue.id}` });
  expect(item.parentName).toMatch(/^Retention of ROPA-\d{3}$/);
  // The notes are the register's, never the action list's.
  expect(JSON.stringify(item)).not.toContain("appointment reminders");

  const actionUrl = `${url}/actions/${action.id}`;
  const own = await call(request, "PATCH", actionUrl, OWNER.email, { status: "closed" });
  expect(own.status).toBe(409);
  expect(own.json.error.message).toContain("the erasure recorded on its schedule by someone other than its owner");

  // Rule 8(2)'s notice is refused outside the Third-Schedule period; no erasure in the future.
  const notice = await call(request, "POST", `${url}/erasures`, ADMIN.email, { erasedOn: daysAgo(1), method: "deleted", processorsTold: "yes", principalsInformedOn: daysAgo(4) });
  expect(notice.status).toBe(422);
  const future = await call(request, "POST", `${url}/erasures`, ADMIN.email, { erasedOn: addDays(today(), 1), method: "deleted", processorsTold: "yes" });
  expect(future.status).toBe(422);
  const other = await call(request, "POST", `${url}/erasures`, ADMIN.email, { erasedOn: daysAgo(1), method: "other", processorsTold: "yes" });
  expect(other.status).toBe(422);

  const erased = await call(request, "POST", `${url}/erasures`, ADMIN.email, { erasedOn: daysAgo(1), method: "deleted", processorsTold: "yes" });
  expect(erased.status, erased.text).toBe(201);
  expect(erased.json.data.schedule.clock.state).toBe("erased");
  expect(erased.json.data.schedule.erasures[0]).toMatchObject({ erasedOn: daysAgo(1), processorsTold: "yes", recorded: { byUserId: ADMIN.id } });

  const closed = await call(request, "PATCH", actionUrl, OWNER.email, { status: "closed" });
  expect(closed.status, closed.text).toBe(200);
  expect(closed.json.data.schedule.actions[0]).toMatchObject({ status: "closed", closureBasis: "erasure_recorded" });

  const after = await call(request, "GET", `${base(HEALTH.organizationId)}/exposure`, ADMIN.email);
  const h7 = after.json.data.heads.find((h: { code: string }) => h.code === "H7");
  expect(h7.reasons.map((x: { text: string }) => x.text).join(" ")).not.toContain("past its end date with no erasure");
});

test("a schedule's documents: an erasure certificate attaches and detaches", async ({ request }) => {
  const token = await accessTokenFor(ADMIN.email);
  const body = "Certificate of erasure — SMS reminder list";
  const issued = await request.post(`${base(HEALTH.organizationId)}/evidence/upload-url`, {
    headers: bearer(token),
    data: { fileName: "erasure-certificate.txt", contentType: "text/plain", byteSize: Buffer.byteLength(body) },
  });
  expect(issued.status(), await issued.text()).toBe(201);
  const { evidence, upload } = (await issued.json()).data;
  expect((await request.put(upload.url, { data: Buffer.from(body), headers: { "Content-Type": upload.contentType } })).status()).toBe(200);
  const linked = await call(request, "POST", `${base(HEALTH.organizationId)}/evidence/${evidence.id}/link`, ADMIN.email, { retentionScheduleId: overdue.id });
  expect(linked.status, linked.text).toBe(201);
  const read = await call(request, "GET", `${base(HEALTH.organizationId)}/retention-schedules/${overdue.id}`, SPONSOR.email);
  expect(read.json.data.schedule.documents.map((d: { fileName: string }) => d.fileName)).toEqual(["erasure-certificate.txt"]);
  // Executive Sponsor holds no retention.write.
  const refused = await call(request, "DELETE", `${base(HEALTH.organizationId)}/retention-schedules/${overdue.id}/evidence/${evidence.id}`, SPONSOR.email);
  expect(refused.status).toBe(403);
  const detached = await call(request, "DELETE", `${base(HEALTH.organizationId)}/retention-schedules/${overdue.id}/evidence/${evidence.id}`, ADMIN.email);
  expect(detached.status, detached.text).toBe(200);
  expect(detached.json.data.schedule.documents).toEqual([]);
});

test("D-096: an incomplete erasure leaves the schedule overdue; one recorded in error is struck by someone else and stops counting; the overview counts it", async ({
  request,
}) => {
  const created = await call(request, "POST", `${base(HEALTH.organizationId)}/retention-schedules`, ADMIN.email, {
    ropaRecordId: recordIds[2],
    basis: "consent_withdrawn",
    periodMonths: 12,
    startsOn: daysAgo(500),
  });
  expect(created.status, created.text).toBe(201);
  const url = `${base(HEALTH.organizationId)}/retention-schedules/${created.json.data.schedule.id}`;

  // R2: the processors not told — "Erasure incomplete", still overdue.
  const incomplete = await call(request, "POST", `${url}/erasures`, ADMIN.email, { erasedOn: daysAgo(3), method: "deleted", processorsTold: "no" });
  expect(incomplete.status, incomplete.text).toBe(201);
  let s = incomplete.json.data.schedule as Schedule;
  expect(s).toMatchObject({ clock: { state: "overdue" }, erasureIncomplete: true, lastErasedOn: null });
  expect(s.erasures[0]).toMatchObject({ standing: "incomplete", standingLabel: "Erasure incomplete — processors not told", void: null });

  // The overview (R6): this schedule's erasure is overdue — and incomplete.
  const dash = await call(request, "GET", `${base(HEALTH.organizationId)}/dashboard`, SPONSOR.email);
  expect(dash.status, dash.text).toBe(200);
  expect(dash.json.data.retention.counts).toMatchObject({ total: 3, overdue: 1, noEnd: 1 });
  expect(dash.json.data.retention.overdue).toEqual([
    { id: s.id, recordCode: s.record!.recordCode, endsOn: expect.any(String), erasureIncomplete: true },
  ]);
  expect(dash.json.data.omitted).not.toContain("retention");

  // Recorded again with the processors told: it counts.
  const complete = await call(request, "POST", `${url}/erasures`, ADMIN.email, { erasedOn: daysAgo(1), method: "deleted", processorsTold: "yes" });
  expect(complete.status, complete.text).toBe(201);
  s = complete.json.data.schedule as Schedule;
  expect(s).toMatchObject({ clock: { state: "erased" }, erasureIncomplete: false, lastErasedOn: daysAgo(1) });
  const latest = s.erasures[0]!;
  expect(latest).toMatchObject({ erasedOn: daysAgo(1), standing: "counts" });

  // R4: never by the person who recorded it; once, with a reason.
  const own = await call(request, "POST", `${url}/erasures/${latest.id}/void`, ADMIN.email, { reason: "Wrong activity" });
  expect(own.status).toBe(409);
  expect(own.json.error.message).toContain("Someone other than the person who recorded this erasure");
  // A blank reason fails the body's schema: a 400, like every malformed body.
  const empty = await call(request, "POST", `${url}/erasures/${latest.id}/void`, OWNER.email, { reason: " " });
  expect(empty.status).toBe(400);
  const sponsor = await call(request, "POST", `${url}/erasures/${latest.id}/void`, SPONSOR.email, { reason: "x" });
  expect(sponsor.status).toBe(403);
  const voided = await call(request, "POST", `${url}/erasures/${latest.id}/void`, OWNER.email, { reason: "Recorded against the wrong processing activity" });
  expect(voided.status, voided.text).toBe(201);
  s = voided.json.data.schedule as Schedule;
  expect(s.clock.state).toBe("overdue");
  const struck = s.erasures.find((e) => e.id === latest.id)!;
  expect(struck).toMatchObject({ standing: "voided", void: { byUserId: OWNER.id, reason: "Recorded against the wrong processing activity" } });
  const again = await call(request, "POST", `${url}/erasures/${latest.id}/void`, ADMIN.email, { reason: "Again" });
  expect(again.status).toBe(409);
  const unknown = await call(request, "POST", `${url}/erasures/${overdue.id}/void`, OWNER.email, { reason: "x" });
  expect(unknown.status).toBe(404);
});

test("Rule 8(1)–(2) only for a recorded Third-Schedule class: the three-year period, the inform-by date, the notice recorded", async ({ request }) => {
  const org = base(SHOP.organizationId);
  const recorded = await call(request, "PATCH", org, ADMIN.email, { thirdScheduleClass: "ecommerce" });
  expect(recorded.status, recorded.text).toBe(200);
  expect(recorded.json.data.organization.thirdScheduleClass).toMatchObject({ class: "ecommerce" });
  const created = await call(request, "POST", `${org}/retention-schedules`, ADMIN.email, {
    ropaRecordId: shopRecords[0],
    basis: "deemed_inactivity",
    periodMonths: 36,
    startsOn: "2024-05-01",
  });
  expect(created.status, created.text).toBe(201);
  const s = created.json.data.schedule as Schedule;
  expect(s).toMatchObject({ endsOn: "2028-11-13", informBy: "2028-11-11" });
  expect(created.json.data.note).toContain("Third Schedule");
  expect(created.json.data.thirdSchedule).toMatchObject({ class: "ecommerce" });
  const noNotice = await call(request, "POST", `${org}/retention-schedules/${s.id}/erasures`, ADMIN.email, { erasedOn: daysAgo(1), method: "deleted", processorsTold: "yes" });
  expect(noNotice.status).toBe(422);
  expect(noNotice.json.error.message).toContain("Rule 8(2)");
  const ok = await call(request, "POST", `${org}/retention-schedules/${s.id}/erasures`, ADMIN.email, {
    erasedOn: daysAgo(1),
    method: "anonymised",
    processorsTold: "not_applicable",
    principalsInformedOn: daysAgo(5),
  });
  expect(ok.status, ok.text).toBe(201);
  const cleared = await call(request, "PATCH", org, ADMIN.email, { thirdScheduleClass: null });
  expect(cleared.status).toBe(409);
});

test("the AI risk register: written with ropa.write, read by members; a review stamped, never removed; head 4 only for an SDF", async ({ request }) => {
  const url = `${base(HEALTH.organizationId)}/ai-systems`;
  const refused = await call(request, "POST", url, SPONSOR.email, { name: "x", purpose: "x", personalData: "x" });
  expect(refused.status).toBe(403);
  const created = await call(request, "POST", url, OWNER.email, {
    name: "Triage chatbot",
    usageType: "chatbot",
    purpose: "Answers appointment questions and routes urgent ones to a nurse.",
    personalData: "Name, phone number, symptoms typed into the chat.",
    childTracking: "unknown",
    humanReview: "A nurse reviews every conversation marked urgent.",
  });
  expect(created.status, created.text).toBe(201);
  const ai = created.json.data.system;
  expect(ai).toMatchObject({ status: "in_use", lastReviewedOn: null, reviewDue: true, usageLabel: "Chatbot", review: null });

  // Not an SDF: head 4 does not apply, whatever the register says (D-028, D-073).
  const before = await call(request, "GET", `${base(HEALTH.organizationId)}/exposure`, ADMIN.email);
  expect(before.json.data.heads.find((h: { code: string }) => h.code === "H4").status).toBe("not_applicable");
  // Once a notification is recorded, head 4 applies — and the unreviewed system never makes it Exposed,
  // nor even assessed: a reason row speaks only once the head is assessed (as 1.2.0's target does), and
  // this tenant has answered nothing. The reason's words are held by core's tests and the SQL mirror.
  const sdf = await call(request, "PATCH", base(HEALTH.organizationId), ADMIN.email, { sdfNotification: { notifiedOn: daysAgo(30), reference: "E2E/SDF/1" } });
  expect(sdf.status, sdf.text).toBe(200);
  const withSdf = await call(request, "GET", `${base(HEALTH.organizationId)}/exposure`, ADMIN.email);
  const h4 = withSdf.json.data.heads.find((h: { code: string }) => h.code === "H4");
  expect(h4).toMatchObject({ applies: true, status: "not_yet_assessed" });
  expect(h4.evidencedBy.moduleInputs.map((m: { code: string }) => m.code)).toEqual(["ai_system_unreviewed"]);

  const reviewed = await call(request, "PATCH", `${url}/${ai.id}`, OWNER.email, { lastReviewedOn: daysAgo(2) });
  expect(reviewed.status, reviewed.text).toBe(200);
  expect(reviewed.json.data.system).toMatchObject({ lastReviewedOn: daysAgo(2), reviewDue: false, review: { byUserId: OWNER.id } });
  const removed = await call(request, "PATCH", `${url}/${ai.id}`, OWNER.email, { lastReviewedOn: null });
  expect(removed.status).toBe(409);
  const after = await call(request, "GET", `${base(HEALTH.organizationId)}/exposure`, ADMIN.email);
  expect(after.json.data.heads.find((h: { code: string }) => h.code === "H4").status).toBe("not_yet_assessed");

  const list = await call(request, "GET", url, SPONSOR.email);
  expect(list.status).toBe(200);
  expect(list.json.data).toMatchObject({
    sdfNotified: true,
    counts: { total: 1, inUse: 1, unreviewed: 0, childTracking: 0, childTrackingUnexempt: 0, childTrackingUnknown: 1 },
  });
});

test("D-096 (R5): s.9(3)'s question, and the Fourth Schedule exemption only on yes — unexempt is a warning and a count", async ({ request }) => {
  const url = `${base(HEALTH.organizationId)}/ai-systems`;
  const refused = await call(request, "POST", url, OWNER.email, { name: "Paediatric triage", purpose: "x", personalData: "x", childTracking: "no", childExemption: "clinical" });
  expect(refused.status).toBe(422);
  expect(refused.json.error.message).toContain("only when the system tracks");
  // Not one of the Fourth Schedule's eleven: the body's schema refuses it.
  const notOne = await call(request, "POST", url, OWNER.email, { name: "Paediatric triage", purpose: "x", personalData: "x", childTracking: "yes", childExemption: "proctoring" });
  expect(notOne.status).toBe(400);
  const created = await call(request, "POST", url, OWNER.email, {
    name: "Paediatric triage",
    purpose: "Prioritises children's appointments by symptoms.",
    personalData: "Age, symptoms, guardian's phone number.",
    childTracking: "yes",
  });
  expect(created.status, created.text).toBe(201);
  const ai = created.json.data.system;
  expect(ai).toMatchObject({ childTracking: "yes", childExemption: null, childExemptionLabel: null, childTrackingUnexempt: true });
  let list = await call(request, "GET", url, SPONSOR.email);
  expect(list.json.data.counts).toMatchObject({ childTracking: 1, childTrackingUnexempt: 1 });

  const exempt = await call(request, "PATCH", `${url}/${ai.id}`, OWNER.email, { childExemption: "clinical" });
  expect(exempt.status, exempt.text).toBe(200);
  expect(exempt.json.data.system).toMatchObject({ childExemption: "clinical", childTrackingUnexempt: false });
  expect(exempt.json.data.system.childExemptionLabel).toMatch(/^A1 — /);
  list = await call(request, "GET", url, SPONSOR.email);
  expect(list.json.data.counts).toMatchObject({ childTracking: 1, childTrackingUnexempt: 0 });

  // Answering "no" takes the exemption with it.
  const no = await call(request, "PATCH", `${url}/${ai.id}`, OWNER.email, { childTracking: "no" });
  expect(no.status, no.text).toBe(200);
  expect(no.json.data.system).toMatchObject({ childTracking: "no", childExemption: null });
});

test("GATE 5: Org B is refused; another tenant's schedule or AI row under this tenant's path is a 404 and nothing", async ({ request }) => {
  for (const tail of ["/retention-schedules", `/retention-schedules/${overdue.id}`, "/ai-systems"]) {
    const res = await call(request, "GET", `${base(HEALTH.organizationId)}${tail}`, OUTSIDER.email);
    expect(res.status, tail).toBe(403);
    expect(res.text).not.toContain("E2E activity");
  }
  // ADMIN belongs to both HEALTH and SHOP: the PATH decides, so SHOP's schedule under HEALTH's path is not found.
  const shop = await call(request, "GET", `${base(SHOP.organizationId)}/retention-schedules`, ADMIN.email);
  const shopId = shop.json.data.schedules[0].id as string;
  const shopErasureId = shop.json.data.schedules[0].erasures[0].id as string;
  for (const [method, tail, data] of [
    ["GET", `/retention-schedules/${shopId}`, undefined],
    ["PATCH", `/retention-schedules/${shopId}`, { notes: "Hijacked" }],
    ["POST", `/retention-schedules/${shopId}/erasures`, { erasedOn: daysAgo(1), method: "deleted", processorsTold: "no" }],
    ["POST", `/retention-schedules/${shopId}/actions`, { title: "Hijacked" }],
    ["POST", `/retention-schedules/${shopId}/erasures/${shopErasureId}/void`, { reason: "Hijacked" }],
  ] as const) {
    const res = await call(request, method, `${base(HEALTH.organizationId)}${tail}`, ADMIN.email, data);
    expect(res.status, `${method} ${tail}`).toBe(404);
    expect(res.text).not.toContain(SHOP.name);
  }
  const shopAi = await call(request, "POST", `${base(SHOP.organizationId)}/ai-systems`, ADMIN.email, { name: "Shop recommender", purpose: "x", personalData: "x" });
  expect(shopAi.status, shopAi.text).toBe(201);
  const crossAi = await call(request, "PATCH", `${base(HEALTH.organizationId)}/ai-systems/${shopAi.json.data.system.id}`, ADMIN.email, { name: "Hijacked" });
  expect(crossAi.status).toBe(404);
  // Nothing moved in SHOP.
  const still = await call(request, "GET", `${base(SHOP.organizationId)}/ai-systems`, ADMIN.email);
  expect(still.json.data.systems.map((s: { name: string }) => s.name)).toEqual(["Shop recommender"]);
});
