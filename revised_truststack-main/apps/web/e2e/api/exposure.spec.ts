/**
 * Slice 9, Stages 1–2 — `GET …/exposure` (the live DPDP exposure model), the
 * SDF notification, and (Stage 2) exposure history, the forecast, leverage
 * and the what-if, through the API.
 *
 * Nothing here may be University-specific (D-040): the model is exercised on
 * a disposable HEALTHCARE tenant (`…a008`) whose scope this file controls —
 * with no children's data H3 is Not applicable; with children's data and an
 * unconsented record it is Exposed, for children's reasons. MU is asserted
 * only on shape, budget and wording: its data is not quiet, and other specs
 * create its assessments in parallel (pitfall 13). BML is the empty state.
 */
import { expect, test, type APIRequestContext } from "@playwright/test";
import {
  accessTokenFor,
  bearer,
  createE2eTenant,
  removeE2eTenant,
  SEED_ORGS,
  SEED_SCOPE,
  SEED_USERS,
  withDb,
} from "../helpers";

const MU = SEED_ORGS.mumbaiUniversity;
const BML = SEED_ORGS.bharatManufacturing;
const base = (orgId: string) => `/api/v1/organizations/${orgId}`;

/**
 * The two seeded users no other spec asserts memberships for (see
 * `scoring.spec.ts`): an Organisation Admin, who may record an SDF
 * notification, and a DPDP Programme Owner, who may edit the scope but not that.
 */
const HEALTH = {
  organizationId: "0b0000ff-0000-4000-8000-00000000a008",
  name: "E2E Exposure Healthcare Tenant",
  industryCode: "healthcare",
  dataPrincipalCountEstimate: 5000,
  member: { userId: SEED_USERS.muItSecurity.id, email: SEED_USERS.muItSecurity.email },
  roleCode: "organization_admin",
  extraMembers: [{ userId: SEED_USERS.muLegal.id, roleCode: "dpdp_owner" }],
};
const ADMIN = SEED_USERS.muItSecurity.email;
const PROGRAMME_OWNER = SEED_USERS.muLegal.email;

const CAVEAT_D011 =
  "This report is a DPDP readiness and assessment output based on information, responses and evidence made available during the assessment. It is not a final legal opinion, statutory certification or guarantee of compliance. Final legal interpretation, policy approval and contractual sign-off should be reviewed by authorised legal counsel.";
const CAVEAT_EXPOSURE =
  "Exposure figures are indicative positions within statutory ceilings in the Schedule to the DPDP Act 2023, derived from your own assessment, register and remediation data under TrustStack exposure model 1.7.0. They are not a prediction of any decision of the Data Protection Board, which imposes a penalty only after an inquiry finds a breach significant and weighs the factors in section 33(2). They are not legal advice.";

async function call(request: APIRequestContext, method: string, url: string, email: string, data?: object) {
  const res = await request.fetch(url, { method, headers: bearer(await accessTokenFor(email)), ...(data ? { data } : {}) });
  const text = await res.text();
  return { status: res.status(), text, json: text ? JSON.parse(text) : null };
}

interface Head {
  code: string;
  applies: boolean;
  status: string;
  statusLabel: string;
  atStake: boolean;
  ceilingCrore: number;
  position: { band: string; rangeLabel: string; factors: { text: string }[] } | null;
  reasons: { kind: string; text: string }[];
}
const head = (json: { data: { heads: Head[] } }, code: string) => json.data.heads.find((h) => h.code === code)!;

/** No question code, pack code or trigger in anything a client receives (D-071). */
function expectBlackBox(text: string) {
  expect(text).not.toMatch(/\b[A-Z]{1,4}\d+\.\d+\b/);
  expect(text).not.toMatch(/[A-Z]+_V\d\b/);
  expect(text).not.toContain("trigger:");
  expect(text.toLowerCase()).not.toMatch(/\bcompliant\b/);
}

function scopeBody(over: { childrenData?: string; guardianData?: string; dataPrincipalCountEstimate?: number } = {}) {
  return {
    industryCode: "healthcare",
    dataPrincipalCountEstimate: over.dataPrincipalCountEstimate ?? 5000,
    answers: {
      childrenData: over.childrenData ?? "no",
      guardianData: over.guardianData ?? "no",
      usesDataProcessors: "yes",
      aiUsageTypes: [],
      marketingTracking: "no",
      crossBorder: "no",
      multiLocation: false,
      publicFacingPortal: "yes",
      sensitiveDocuments: "yes",
    },
  };
}

test.describe.configure({ mode: "serial" });

test.beforeAll(async () => {
  await createE2eTenant(HEALTH);
});
test.afterAll(async () => {
  await removeE2eTenant(HEALTH);
});

test("a tenant that has said nothing is not yet assessed — silence is not mitigation", async ({ request }) => {
  const r = await call(request, "GET", `${base(HEALTH.organizationId)}/exposure`, ADMIN);
  expect(r.status, r.text).toBe(200);
  expect(r.json.data).toMatchObject({ basis: "none", live: true, modelVersion: "1.7.0", assessment: null });
  expect(r.json.data.freshness.scopeSaved).toBe(false);
  const statuses = Object.fromEntries(r.json.data.heads.map((h: Head) => [h.code, h.status]));
  // An unsaved scope is unknown on children's data, so H3 applies — as not yet assessed.
  expect(statuses).toEqual({ H1: "not_yet_assessed", H2: "not_yet_assessed", H3: "not_yet_assessed", H4: "not_applicable", H7: "not_yet_assessed" });
  expect(r.json.data.headline).toMatchObject({ ceilingsAtStakeCrore: 700, exposedHeads: 4, applicableHeads: 4 });
  expect(r.json.data.headline.byStatus.exposed).toBe(0);
  expect(r.json.data.s37.shown).toBe(true);
});

test("second sector, no children's data: H3 is Not applicable, and nothing is University-specific", async ({ request }) => {
  const saved = await call(request, "PUT", `${base(HEALTH.organizationId)}/scope`, PROGRAMME_OWNER, scopeBody());
  expect(saved.status, saved.text).toBe(200);
  expect(saved.json.data.answers.guardianData).toBe("no");

  const r = await call(request, "GET", `${base(HEALTH.organizationId)}/exposure`, ADMIN);
  expect(r.status, r.text).toBe(200);
  const h3 = head(r.json, "H3");
  expect(h3).toMatchObject({ applies: false, status: "not_applicable", statusLabel: "Not applicable", atStake: false, position: null });
  expect(r.json.data.headline.ceilingsAtStakeCrore).toBe(500);
  expect(r.text.toLowerCase()).not.toMatch(/universit|student|admission|examination|campus/);
  expectBlackBox(r.text);
});

test("an omitted guardian answer is unknown, never no — and H3 then applies", async ({ request }) => {
  const body = scopeBody();
  const { guardianData: _omitted, ...answers } = body.answers;
  const saved = await call(request, "PUT", `${base(HEALTH.organizationId)}/scope`, PROGRAMME_OWNER, { ...body, answers });
  expect(saved.status, saved.text).toBe(200);
  expect(saved.json.data.answers.guardianData).toBe("unknown");
  const h3 = head((await call(request, "GET", `${base(HEALTH.organizationId)}/exposure`, ADMIN)).json, "H3");
  expect(h3.applies).toBe(true);
  expect(h3.reasons[0]!.text).toContain("persons with disability who have a lawful guardian");
});

test("second sector WITH children's data and an unconsented record: H3 is Exposed, for children's reasons", async ({ request }) => {
  const saved = await call(request, "PUT", `${base(HEALTH.organizationId)}/scope`, PROGRAMME_OWNER, scopeBody({ childrenData: "yes" }));
  expect(saved.status, saved.text).toBe(200);
  const record = await call(request, "POST", `${base(HEALTH.organizationId)}/ropa`, PROGRAMME_OWNER, {
    name: "Paediatric outpatient registration",
    childrenData: "yes",
    childParentalConsent: "no",
    childTracking: "no",
  });
  expect(record.status, record.text).toBe(201);
  const generated = await call(request, "POST", `${base(HEALTH.organizationId)}/ropa/gaps/generate`, PROGRAMME_OWNER);
  expect(generated.status, generated.text).toBe(200);

  const r = await call(request, "GET", `${base(HEALTH.organizationId)}/exposure`, ADMIN);
  const h3 = head(r.json, "H3");
  expect(h3).toMatchObject({ applies: true, status: "exposed", statusLabel: "Exposed", atStake: true, ceilingCrore: 200 });
  expect(h3.reasons.map((x) => x.text)).toContain("Processing register: No verifiable parental consent (1 open gap).");
  expect(h3.position!.factors.map((f) => f.text)).toContain("Children's data is processed.");
  // Head 3 reads children's data at +3, sensitive documents +1, Exposed +1: the upper third.
  expect(h3.position).toMatchObject({ band: "upper", rangeLabel: "₹133–200 crore" });
  expect(r.json.data.freshness).toMatchObject({ scopeSaved: true, registerGapsGenerated: true });
  expect(r.text.toLowerCase()).not.toMatch(/universit|student|admission|examination|campus/);
  expectBlackBox(r.text);
});

// ---------------------------------------------------------------------------
// Stage 2 — history, the forecast, leverage and the what-if
// ---------------------------------------------------------------------------

interface StoredHead extends Omit<Head, "position"> {
  serial: number;
  title: string;
  position: {
    points: number;
    band: string;
    bandLabel: string;
    fromCrore: number;
    toCrore: number;
    rangeLabel: string;
    factors: { code: string; clause: string; points: number; text: string }[];
  } | null;
}

/** The fields the SQL derives, from the live head (which carries more). */
const derived = (h: StoredHead) => ({
  code: h.code,
  serial: h.serial,
  title: h.title,
  ceilingCrore: h.ceilingCrore,
  applies: h.applies,
  status: h.status,
  statusLabel: h.statusLabel,
  atStake: h.atStake,
  position: h.position && {
    points: h.position.points,
    band: h.position.band,
    bandLabel: h.position.bandLabel,
    fromCrore: h.position.fromCrore,
    toCrore: h.position.toCrore,
    rangeLabel: h.position.rangeLabel,
    factors: h.position.factors.map((f) => ({ code: f.code, clause: f.clause, points: f.points, text: f.text })),
  },
  reasons: h.reasons.map((r) => ({ kind: r.kind, text: r.text })),
});

/** Record a snapshot and prove it equals the live model at that moment (§11 "stored = live"). */
async function storedEqualsLive(request: APIRequestContext, orgId: string, email: string) {
  const stored = await call(request, "POST", `${base(orgId)}/exposure/snapshots`, email);
  expect(stored.status, stored.text).toBe(201);
  const live = await call(request, "GET", `${base(orgId)}/exposure`, email);
  expect(live.status, live.text).toBe(200);
  const s = stored.json.data;
  const l = live.json.data;
  expect(s.heads.map(derived)).toEqual(l.heads.map(derived));
  expect({ ceilings: s.ceilingsAtStakeCrore, exposed: s.exposedHeads, applicable: s.applicableHeads, basis: s.basis, version: s.modelVersion }).toEqual({
    ceilings: l.headline.ceilingsAtStakeCrore,
    exposed: l.headline.exposedHeads,
    applicable: l.headline.applicableHeads,
    basis: l.basis,
    version: l.modelVersion,
  });
  expect(s.forecast).toEqual(l.intelligence.forecast);
  // The live view now measures itself against the snapshot just stored.
  expect(l.lastSnapshot.id).toBe(s.id);
  expect(l.intelligence.changes.change.heads).toEqual([]);
  expectBlackBox(stored.text);
  return { stored: s, live: l };
}

test("history: closures feed the forecast, and a stored snapshot equals the live model at that moment", async ({ request }) => {
  // Two register actions closed by a reviewer who does not own them, one of
  // them nine days ago: two active weeks — enough history to forecast.
  const gaps = await call(request, "GET", `${base(HEALTH.organizationId)}/ropa/gaps`, ADMIN);
  expect(gaps.status, gaps.text).toBe(200);
  const actions = (gaps.json.data.gaps as { id: string; state: string; actions: { id: string; status: string }[] }[])
    .filter((g) => g.state === "open")
    .flatMap((g) => g.actions.map((a) => ({ ...a, url: `${base(HEALTH.organizationId)}/ropa/gaps/${g.id}/actions/${a.id}` })))
    .filter((a) => a.status !== "closed")
    .slice(0, 2);
  expect(actions).toHaveLength(2);
  for (const a of actions) {
    const owned = await call(request, "PATCH", a.url, ADMIN, { ownerUserId: SEED_USERS.muLegal.id });
    expect(owned.status, owned.text).toBe(200);
    const closed = await call(request, "PATCH", a.url, ADMIN, { status: "closed" });
    expect(closed.status, closed.text).toBe(200);
  }
  // The database stamps closed_at; only this tooling moves one back a week.
  await withDb((db) =>
    db.query("UPDATE public.gap_actions SET closed_at = closed_at - interval '9 days' WHERE id = $1 AND organization_id = $2", [actions[0]!.id, HEALTH.organizationId]),
  );

  const { stored, live } = await storedEqualsLive(request, HEALTH.organizationId, ADMIN);
  expect(live.intelligence.forecast.notEnoughHistory).toBe(false);
  expect(live.intelligence.forecast.activeWeeks).toBe(2);
  expect(stored.forecast.all.p50Date).not.toBeNull();
  expect(stored.recordedByName).not.toBeNull();

  // Audited once, as the person.
  const audited = await withDb((db) =>
    db.query<{ user_id: string }>("SELECT user_id FROM public.audit_logs WHERE entity_id = $1 AND event_type = 'exposure.snapshot.recorded'", [stored.id]),
  );
  expect(audited.rows.map((r) => r.user_id)).toEqual([HEALTH.member.userId]);

  // The history lists it; the full read returns it unchanged.
  const history = await call(request, "GET", `${base(HEALTH.organizationId)}/exposure/snapshots`, PROGRAMME_OWNER);
  expect(history.status, history.text).toBe(200);
  expect(history.json.data.snapshots[0]).toMatchObject({ id: stored.id, ceilingsAtStakeCrore: stored.ceilingsAtStakeCrore, basis: "none" });
  const one = await call(request, "GET", `${base(HEALTH.organizationId)}/exposure/snapshots/${stored.id}`, PROGRAMME_OWNER);
  expect(one.json.data.heads).toEqual(stored.heads);
});

test("stored = live with a Significant Data Fiduciary notification on record (H4 applies)", async ({ request }) => {
  const set = await call(request, "PATCH", base(HEALTH.organizationId), ADMIN, {
    sdfNotification: { notifiedOn: "2026-09-01", reference: "G.S.R. 998(E)" },
  });
  expect(set.status, set.text).toBe(200);
  try {
    const { stored } = await storedEqualsLive(request, HEALTH.organizationId, PROGRAMME_OWNER);
    expect(stored.heads.find((h: Head) => h.code === "H4").applies).toBe(true);
  } finally {
    await call(request, "PATCH", base(HEALTH.organizationId), ADMIN, { sdfNotification: null });
  }
});

test("leverage ranks open actions on heads at stake, and the what-if changes nothing", async ({ request }) => {
  const live = await call(request, "GET", `${base(HEALTH.organizationId)}/exposure`, ADMIN);
  const leverage = live.json.data.intelligence.leverage as { actionId: string; weight: number; heads: string[]; action: { title: string; source: string } }[];
  expect(leverage.length).toBeGreaterThan(0);
  const weights = leverage.map((e) => e.weight);
  expect([...weights].sort((a, b) => b - a)).toEqual(weights);
  expect(leverage[0]!.action.source).toBe("ropa");

  const countRows = () =>
    withDb((db) =>
      db.query<{ actions: string; snapshots: string; audit: string }>(
        `SELECT (SELECT string_agg(id || status, ',' ORDER BY id) FROM public.gap_actions WHERE organization_id = $1) AS actions,
                (SELECT count(*) FROM public.exposure_snapshots WHERE organization_id = $1) AS snapshots,
                (SELECT count(*) FROM public.audit_logs WHERE organization_id = $1) AS audit`,
        [HEALTH.organizationId],
      ),
    );
  const before = (await countRows()).rows[0];
  const ids = leverage.map((e) => e.actionId);
  const r = await call(request, "POST", `${base(HEALTH.organizationId)}/exposure/what-if`, ADMIN, { actionIds: ids });
  expect(r.status, r.text).toBe(200);
  expect(r.json.data.actions.map((a: { actionId: string }) => a.actionId).sort()).toEqual([...ids].sort());
  expect(r.json.data.unknownActionIds).toEqual([]);
  // Closing every top action never raises the ceilings at stake.
  expect(r.json.data.change.ceilingsAtStakeCrore.to).toBeLessThanOrEqual(r.json.data.change.ceilingsAtStakeCrore.from);
  expect(r.json.data.forecast.after.all.outstanding).toBeLessThan(r.json.data.forecast.before.all.outstanding);
  expect((await countRows()).rows[0]).toEqual(before);
  expectBlackBox(r.text);

  const tooMany = await call(request, "POST", `${base(HEALTH.organizationId)}/exposure/what-if`, ADMIN, {
    actionIds: Array.from({ length: 51 }, () => ids[0]),
  });
  expect(tooMany.status).toBe(400);
});

test("GATE 5 — exposure history: no reading, recording or what-if across tenants, by path or by id", async ({ request }) => {
  const [snapshot] = (await call(request, "GET", `${base(HEALTH.organizationId)}/exposure/snapshots`, ADMIN)).json.data.snapshots;
  // MU's admin is not a member of the healthcare tenant.
  for (const [method, url] of [
    ["GET", `${base(HEALTH.organizationId)}/exposure/snapshots`],
    ["POST", `${base(HEALTH.organizationId)}/exposure/snapshots`],
    ["GET", `${base(HEALTH.organizationId)}/exposure/snapshots/${snapshot.id}`],
    ["POST", `${base(HEALTH.organizationId)}/exposure/what-if`],
  ] as const) {
    const r = await call(request, method, url, SEED_USERS.muAdmin.email, method === "POST" && url.endsWith("what-if") ? { actionIds: [] } : undefined);
    expect(r.status, `${method} ${url}`).toBe(403);
    expect(r.json.error.code).toBe("TENANT_ACCESS_DENIED");
  }
  // Its own path with the other tenant's snapshot id: not found, and nothing leaks.
  const viaMu = await call(request, "GET", `${base(MU.id)}/exposure/snapshots/${snapshot.id}`, SEED_USERS.muAdmin.email);
  expect(viaMu.status).toBe(404);
  expect(viaMu.text).not.toContain(HEALTH.name);
});

test("recording needs score.calculate: the Dean may read the history but not record (403)", async ({ request }) => {
  const before = await withDb((db) => db.query<{ n: string }>("SELECT count(*) AS n FROM public.exposure_snapshots WHERE organization_id = $1", [MU.id]));
  const r = await call(request, "POST", `${base(MU.id)}/exposure/snapshots`, SEED_USERS.muDean.email);
  expect(r.status, r.text).toBe(403);
  const list = await call(request, "GET", `${base(MU.id)}/exposure/snapshots`, SEED_USERS.muDean.email);
  expect(list.status, list.text).toBe(200);
  const after = await withDb((db) => db.query<{ n: string }>("SELECT count(*) AS n FROM public.exposure_snapshots WHERE organization_id = $1", [MU.id]));
  expect(after.rows[0]!.n).toBe(before.rows[0]!.n);
});

test.describe("SDF: entered by an admin, never inferred (D-028)", () => {
  const sdfOf = async (request: APIRequestContext) =>
    head((await call(request, "GET", `${base(HEALTH.organizationId)}/exposure`, ADMIN)).json, "H4");

  test("a large-scale scope never makes H4 apply", async ({ request }) => {
    const saved = await call(
      request,
      "PUT",
      `${base(HEALTH.organizationId)}/scope`,
      PROGRAMME_OWNER,
      scopeBody({ childrenData: "yes", dataPrincipalCountEstimate: 5_000_000 }),
    );
    expect(saved.status, saved.text).toBe(200);
    expect(saved.json.data.preview.profile.processingScale).toBe("large_scale");
    const h4 = await sdfOf(request);
    expect(h4).toMatchObject({ applies: false, status: "not_applicable" });
    expect(h4.reasons[0]!.text).toContain("never infers");
  });

  test("the DPDP Programme Owner may not record a notification (403)", async ({ request }) => {
    const r = await call(request, "PATCH", base(HEALTH.organizationId), PROGRAMME_OWNER, {
      sdfNotification: { notifiedOn: "2026-09-01", reference: "G.S.R. 999(E)" },
    });
    expect(r.status, r.text).toBe(403);
    expect((await sdfOf(request)).applies).toBe(false);
  });

  test("half a notification, a future date or a pre-Act date is refused (400)", async ({ request }) => {
    for (const sdfNotification of [
      { notifiedOn: "2026-09-01" },
      { reference: "G.S.R. 999(E)" },
      { notifiedOn: "2099-01-01", reference: "G.S.R. 999(E)" },
      { notifiedOn: "2023-01-01", reference: "G.S.R. 999(E)" },
      { notifiedOn: "2026-09-01", reference: "   " },
    ]) {
      const r = await call(request, "PATCH", base(HEALTH.organizationId), ADMIN, { sdfNotification });
      expect(r.status, JSON.stringify(sdfNotification)).toBe(400);
    }
  });

  test("an Organisation Admin records it → H4 applies; removing it → H4 does not; both audited as the admin", async ({ request }) => {
    // Only the audit rows THIS test causes (an earlier Stage 2 test sets and clears one too).
    const startedAt = (await withDb((db) => db.query<{ now: string }>("SELECT now()::text AS now"))).rows[0]!.now;
    const set = await call(request, "PATCH", base(HEALTH.organizationId), ADMIN, {
      sdfNotification: { notifiedOn: "2026-09-01", reference: "G.S.R. 999(E)" },
    });
    expect(set.status, set.text).toBe(200);
    expect(set.json.data.organization.sdfNotification).toEqual({ notifiedOn: "2026-09-01", reference: "G.S.R. 999(E)" });
    const on = await sdfOf(request);
    // The record's AI processing is not yet known and it is unapproved: once
    // head 4 applies, that register gap is direct evidence against it (Rule 13(3)).
    expect(on).toMatchObject({ applies: true, status: "partially_mitigated", atStake: true, ceilingCrore: 150 });
    expect(on.reasons[0]!.text).toContain("2026-09-01");
    expect(on.reasons.map((x) => x.text)).toContain("Processing register: AI processing not reviewed (1 open gap).");

    const cleared = await call(request, "PATCH", base(HEALTH.organizationId), ADMIN, { sdfNotification: null });
    expect(cleared.status, cleared.text).toBe(200);
    expect(cleared.json.data.organization.sdfNotification).toBeNull();
    expect((await sdfOf(request)).applies).toBe(false);

    const audited = await withDb((db) =>
      db.query<{ user_id: string; changed: string[] }>(
        `SELECT user_id, metadata -> 'changed' AS changed FROM public.audit_logs
          WHERE organization_id = $1 AND event_type = 'scope.organizations.update' AND created_at >= $2::timestamptz ORDER BY created_at`,
        [HEALTH.organizationId, startedAt],
      ),
    );
    const sdfRows = audited.rows.filter((row) => row.changed.includes("sdf_notified_on"));
    expect(sdfRows.map((row) => row.user_id)).toEqual([HEALTH.member.userId, HEALTH.member.userId]);
  });
});

test("BML — the empty state: every head not yet assessed or not applicable, no error", async ({ request }) => {
  const r = await call(request, "GET", `${base(BML.id)}/exposure`, SEED_USERS.bmlAdmin.email);
  expect(r.status, r.text).toBe(200);
  expect(r.json.data.basis).toBe("none");
  for (const h of r.json.data.heads as Head[]) expect(["not_yet_assessed", "not_applicable"], h.code).toContain(h.status);
  // BML declared no children's and no guardian data.
  expect(head(r.json, "H3").status).toBe("not_applicable");
  expect(r.text).not.toContain(MU.id);
  // Stage 2: no work, no leverage, no warnings — and a what-if over nothing still answers.
  expect(r.json.data.intelligence).toMatchObject({ leverage: [], slippage: [], changes: null });
  expect(r.json.data.intelligence.forecast.all.outstanding).toBe(0);
  const w = await call(request, "POST", `${base(BML.id)}/exposure/what-if`, SEED_USERS.bmlAdmin.email, { actionIds: [] });
  expect(w.status, w.text).toBe(200);
  expect(w.json.data.change.heads).toEqual([]);
});

test("MU — inside the 3 s budget, both caveats verbatim, black box, and nothing of BML's", async ({ request }) => {
  const token = await accessTokenFor(SEED_USERS.muDean.email);
  const started = Date.now();
  const res = await request.get(`${base(MU.id)}/exposure`, { headers: bearer(token) });
  const elapsed = Date.now() - started;
  const text = await res.text();
  expect(res.status(), text).toBe(200);
  expect(elapsed, `GET …/exposure took ${elapsed} ms`).toBeLessThan(3000);

  const { data } = JSON.parse(text);
  expect(data.caveats).toEqual({ readiness: CAVEAT_D011, exposure: CAVEAT_EXPOSURE });
  expect(data.headline.ceilingsLabel).toBe("Statutory ceilings, not a predicted fine; penalties are per breach.");
  expect(data.heads.map((h: Head) => h.code)).toEqual(["H1", "H2", "H3", "H4", "H7"]);
  expect(data.notModelled.map((h: { code: string }) => h.code)).toEqual(["H5", "H6"]);
  // MU processes children's data: head 3 applies, whatever its status today.
  expect(head({ data }, "H3").applies).toBe(true);
  expect(head({ data }, "H4").applies).toBe(false);
  // Stage 2: the intelligence travels with the live model, inside the same budget.
  expect(Object.keys(data.intelligence).sort()).toEqual(["changes", "forecast", "leverage", "slippage"]);
  expect(data.intelligence.leverage.length).toBeLessThanOrEqual(10);
  expect(data.intelligence.forecast.deadline).toBe("2027-05-13");
  expectBlackBox(text);
  for (const marker of [BML.id, BML.name, ...Object.values(SEED_SCOPE.bharatManufacturing.vendors).map((v) => v.name)]) {
    expect(text).not.toContain(marker);
  }
});

test("GATE 5 — MU's admin cannot read BML's exposure, or record BML's SDF notification", async ({ request }) => {
  const read = await call(request, "GET", `${base(BML.id)}/exposure`, SEED_USERS.muAdmin.email);
  expect(read.status).toBe(403);
  expect(read.json.error.code).toBe("TENANT_ACCESS_DENIED");
  const write = await call(request, "PATCH", base(BML.id), SEED_USERS.muAdmin.email, {
    sdfNotification: { notifiedOn: "2026-09-01", reference: "Forged" },
  });
  expect(write.status).toBe(403);
  const still = await withDb((db) => db.query("SELECT sdf_notified_on FROM public.organizations WHERE id = $1", [BML.id]));
  expect(still.rows[0].sdf_notified_on).toBeNull();
});

test("Q1 (model 1.7.0): a breach's open action counts in the forecast — stored and live alike — and moves no head", async ({ request }) => {
  // Last in this file: the breach it records changes head 2 for any test after it.
  const breach = await call(request, "POST", `${base(HEALTH.organizationId)}/breaches`, ADMIN, {
    title: "Discharge summaries emailed to the wrong ward",
    nature: "accidental_disclosure",
    severity: "high",
    awareAt: new Date(Date.now() - 3_600_000).toISOString(),
  });
  expect(breach.status, breach.text).toBe(201);
  const before = await call(request, "GET", `${base(HEALTH.organizationId)}/exposure`, ADMIN);
  expect(before.status, before.text).toBe(200);

  const action = await call(request, "POST", `${base(HEALTH.organizationId)}/breaches/${breach.json.data.incident.id}/actions`, ADMIN, {
    title: "Restrict the ward mailing list to named staff",
    dueDate: "2027-01-31",
  });
  expect(action.status, action.text).toBe(201);

  // The SQL that writes a snapshot and the TS that serves the page agree, on 1.7.0.
  const { stored, live } = await storedEqualsLive(request, HEALTH.organizationId, ADMIN);
  expect(stored.modelVersion).toBe("1.7.0");
  const was = before.json.data.intelligence.forecast;
  expect(live.intelligence.forecast.all.outstanding).toBe(was.all.outstanding + 1);
  // A high breach's action is critical and high work.
  expect(live.intelligence.forecast.criticalHigh.outstanding).toBe(was.criticalHigh.outstanding + 1);
  // Outstanding work only: every head, status and position is unchanged (D-104.1).
  expect(live.heads.map(derived)).toEqual(before.json.data.heads.map(derived));
  expect(live.headline.ceilingsAtStakeCrore).toBe(before.json.data.headline.ceilingsAtStakeCrore);
  // And it is never ranked by leverage: no penalty-head weight of its own.
  const actionId = (action.json.data.incident.actions as { id: string; title: string }[]).find((x) => x.title === "Restrict the ward mailing list to named staff")!.id;
  expect(live.intelligence.leverage.map((e: { actionId: string }) => e.actionId)).not.toContain(actionId);
});
