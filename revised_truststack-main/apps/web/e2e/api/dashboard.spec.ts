/**
 * Slice 8 — `GET …/dashboard` through the API: one request, both action
 * parents, the empty state, and the < 3 s budget (PRD US-10).
 *
 * Spec files run in parallel against one database, and MU's data is not quiet
 * (pitfall 13): everything asserted here is about rows THIS file creates —
 * one assessment action and one ROPA action, each given an explicit past due
 * date — never a tenant-wide count, and never a date-dependent seeded count
 * (pitfall 4).
 */
import { expect, test, type APIRequestContext } from "@playwright/test";
import { accessTokenFor, bearer, SEED_ORGS, SEED_USERS, withDb } from "../helpers";

const MU = SEED_ORGS.mumbaiUniversity;
const BML = SEED_ORGS.bharatManufacturing;
const NAME_PREFIX = "E2E dashboard API";
const base = (orgId: string) => `/api/v1/organizations/${orgId}`;
const OVERDUE = "2026-01-15";

/** Does the work; the actions are assigned to the Registrar. */
const WRITER = SEED_USERS.consultant;
const OWNER = SEED_USERS.mumbaiUniversity;

async function call(request: APIRequestContext, method: string, url: string, email: string, data?: object) {
  const res = await request.fetch(url, { method, headers: bearer(await accessTokenFor(email)), ...(data ? { data } : {}) });
  const text = await res.text();
  return { status: res.status(), text, json: text ? JSON.parse(text) : null };
}

async function cleanup() {
  await withDb(async (db) => {
    // Gaps and actions go with their parent.
    await db.query("DELETE FROM public.assessments WHERE name LIKE $1", [`${NAME_PREFIX}%`]);
    await db.query("DELETE FROM public.ropa_records WHERE name LIKE $1", [`${NAME_PREFIX}%`]);
  });
}

let assessmentActionId: string;
let ropaActionId: string;

test.describe.configure({ mode: "serial" });

test.beforeAll(async ({ playwright }) => {
  await cleanup();
  const request = await playwright.request.newContext({ baseURL: test.info().project.use.baseURL });
  try {
    // --- One overdue ASSESSMENT action ---------------------------------------
    const created = await call(request, "POST", `${base(MU.id)}/assessments`, WRITER.email, {
      name: `${NAME_PREFIX} ${Date.now()}`,
    });
    expect(created.status, created.text).toBe(201);
    const assessmentId = created.json.data.assessment.id as string;
    const answered = await call(request, "PUT", `${base(MU.id)}/assessments/${assessmentId}/responses/G1.2`, WRITER.email, {
      applicabilityDecision: "applicable",
      claimedMaturity: 1,
    });
    expect([200, 201], answered.text).toContain(answered.status);
    const generated = await call(request, "POST", `${base(MU.id)}/assessments/${assessmentId}/gaps/generate`, WRITER.email);
    expect(generated.status, generated.text).toBe(200);
    const register = await call(request, "GET", `${base(MU.id)}/assessments/${assessmentId}/gaps`, WRITER.email);
    const gap = register.json.data.gaps.find((g: { questionCode: string }) => g.questionCode === "G1.2");
    assessmentActionId = gap.actions[0].id;
    const patched = await call(
      request,
      "PATCH",
      `${base(MU.id)}/assessments/${assessmentId}/gaps/${gap.id}/actions/${assessmentActionId}`,
      WRITER.email,
      { ownerUserId: OWNER.id, dueDate: OVERDUE },
    );
    expect(patched.status, patched.text).toBe(200);

    // --- One overdue ROPA action ---------------------------------------------
    const record = await call(request, "POST", `${base(MU.id)}/ropa`, WRITER.email, { name: `${NAME_PREFIX} record ${Date.now()}` });
    expect(record.status, record.text).toBe(201);
    const recordId = record.json.data.record.id as string;
    const ropaGenerated = await call(request, "POST", `${base(MU.id)}/ropa/gaps/generate`, WRITER.email);
    expect(ropaGenerated.status, ropaGenerated.text).toBe(200);
    const ropaGaps = await call(request, "GET", `${base(MU.id)}/ropa/gaps`, WRITER.email);
    const ropaGap = ropaGaps.json.data.gaps.find(
      (g: { recordId: string | null; state: string; actions: unknown[] }) =>
        g.recordId === recordId && g.state === "open" && g.actions.length > 0,
    );
    expect(ropaGap, "the new record opens at least one ROPA gap").toBeTruthy();
    ropaActionId = ropaGap.actions[0].id;
    const ropaPatched = await call(
      request,
      "PATCH",
      `${base(MU.id)}/ropa/gaps/${ropaGap.id}/actions/${ropaActionId}`,
      WRITER.email,
      { ownerUserId: OWNER.id, dueDate: OVERDUE },
    );
    expect(ropaPatched.status, ropaPatched.text).toBe(200);
  } finally {
    await request.dispose();
  }
});

test.afterAll(cleanup);

test("the Dean's dashboard lists an overdue assessment action AND an overdue ROPA action, each labelled by source", async ({
  request,
}) => {
  const { status, json, text } = await call(request, "GET", `${base(MU.id)}/dashboard`, SEED_USERS.muDean.email);
  expect(status, text).toBe(200);
  const { actions, today, omitted } = json.data;
  expect(omitted).toEqual([]);
  // Slice 10: the breach register is the third parent — MU's seeded breach has one open action;
  // the rights register the fourth — MU's seeded grievance has one; the retention register the
  // fifth (Stage 5) — ROPA-009's overdue erasure has one.
  expect(actions.sources).toEqual(["assessment", "ropa", "breach", "rights", "retention"]);

  const byId = new Map(actions.items.map((i: { id: string }) => [i.id, i]));
  expect(byId.get(assessmentActionId)).toMatchObject({
    source: "assessment",
    sourceLabel: "Assessment",
    ownerUserId: OWNER.id,
    dueDate: OVERDUE,
    gapId: expect.any(String),
    ropaGapId: null,
  });
  expect(byId.get(ropaActionId)).toMatchObject({
    source: "ropa",
    sourceLabel: "Processing register",
    ownerUserId: OWNER.id,
    dueDate: OVERDUE,
    gapId: null,
    ropaGapId: expect.any(String),
  });
  // Plain language: the assessment action's context is its domain, never a question code.
  const assessmentItem = byId.get(assessmentActionId) as { context: string };
  expect(assessmentItem.context).not.toContain("G1.2");
  expect((byId.get(ropaActionId) as { context: string }).context).toMatch(/^ROPA-\d+ · /);

  // The counts include both, under their own sources — at least: MU is not quiet.
  expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  expect(actions.summary.overdue).toBeGreaterThanOrEqual(2);
  expect(actions.summary.bySource.assessment.overdue).toBeGreaterThanOrEqual(1);
  expect(actions.summary.bySource.ropa.overdue).toBeGreaterThanOrEqual(1);
  expect(actions.summary.bySource.breach.outstanding).toBeGreaterThanOrEqual(1);
  expect(json.data.breaches.counts.total).toBeGreaterThanOrEqual(1);
  expect(actions.summary.bySource.rights.outstanding).toBeGreaterThanOrEqual(1);
  expect(actions.summary.bySource.retention.outstanding).toBeGreaterThanOrEqual(1);
  expect(json.data.rights.counts.total).toBeGreaterThanOrEqual(2);
});

test("the readiness section reports the engine's numbers: frozen and provisional are separate entries, never blended", async ({
  request,
}) => {
  const { json } = await call(request, "GET", `${base(MU.id)}/dashboard`, SEED_USERS.muDean.email);
  const { readiness } = json.data;
  const shown = [readiness.finalised, readiness.inProgress].filter(Boolean);
  expect(shown.length).toBeGreaterThan(0);
  for (const view of shown) {
    // Exactly what GET …/score returns for that assessment — the same reader.
    const score = await call(
      request,
      "GET",
      `${base(MU.id)}/assessments/${view.assessment.id}/score`,
      SEED_USERS.muDean.email,
    );
    expect(view.score).toEqual(score.json.data);
  }
  if (readiness.finalised) expect(readiness.finalised.score.finalised).toBe(true);
  if (readiness.inProgress) expect(readiness.inProgress.score.finalised).toBe(false);
});

test("the ROPA section's counts are the register page's counts — one function, one answer", async ({ request }) => {
  const [dash, register] = await Promise.all([
    call(request, "GET", `${base(MU.id)}/dashboard`, SEED_USERS.muDean.email),
    call(request, "GET", `${base(MU.id)}/ropa`, SEED_USERS.muDean.email),
  ]);
  expect(dash.json.data.ropa.counts).toEqual(register.json.data.counts);
  expect(dash.json.data.ropa.positioning).toContain("not a statutory record");
  expect(dash.text.toLowerCase()).not.toContain("compliant");
});

test("Bharat Manufacturing's empty state is empty sections, not an error", async ({ request }) => {
  const { status, json, text } = await call(request, "GET", `${base(BML.id)}/dashboard`, SEED_USERS.bmlAdmin.email);
  expect(status, text).toBe(200);
  expect(json.data.readiness).toEqual({ finalised: null, inProgress: null });
  expect(json.data.ropa.counts.total).toBe(0);
  expect(json.data.actions).not.toBeNull();
  // No assessment, so no assessment action — whatever another spec does to BML's register meanwhile.
  expect(json.data.actions.items.filter((i: { source: string }) => i.source === "assessment")).toEqual([]);
});

test("MU's dashboard answers inside the 3-second budget (PRD US-10)", async ({ request }) => {
  const token = await accessTokenFor(WRITER.email);
  await request.get(`${base(MU.id)}/dashboard`, { headers: bearer(token) }); // warm the route
  const started = Date.now();
  const res = await request.get(`${base(MU.id)}/dashboard`, { headers: bearer(token) });
  const elapsed = Date.now() - started;
  expect(res.status()).toBe(200);
  expect(elapsed, `took ${elapsed} ms`).toBeLessThan(3000);
});
