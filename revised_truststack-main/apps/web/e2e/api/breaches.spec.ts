/**
 * Slice 10, Stage 1 — the breach register through the API: the Rule 7
 * timeline, the derived clock, the lifecycle, the breach's actions on the ONE
 * action table, the overview's section and exposure model 1.1.0 — and GATE 5.
 *
 * A breach is never deleted and a snapshot is permanent, so nothing here
 * touches MU or BML (SLICE_10 pitfall 7). Two disposable tenants: a HEALTHCARE
 * one where the breaches are recorded (`…a00e`) — not a university, so nothing
 * here is University-specific (D-040) — and an EMPTY general one (`…a00f`).
 * BML's admin is the Org B attacker.
 */
import { expect, test, type APIRequestContext } from "@playwright/test";
import { accessTokenFor, bearer, createE2eTenant, removeE2eTenant, SEED_ORGS, SEED_USERS, withDb } from "../helpers";

const BML = SEED_ORGS.bharatManufacturing;
const base = (orgId: string) => `/api/v1/organizations/${orgId}`;
const HOUR = 3_600_000;

/** Organisation Admin here: breach.write, gap.write and evidence.review. */
const ADMIN = SEED_USERS.muItSecurity;
/** A Department Owner here: owns the remedial action, may not approve its own closure. */
const OWNER = SEED_USERS.muLegal;
/** Executive Sponsor here: reads the register, writes nothing. */
const SPONSOR = SEED_USERS.muDean;

const HEALTH = {
  organizationId: "0b0000ff-0000-4000-8000-00000000a00e",
  name: "E2E Breach Register Healthcare Tenant",
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
  organizationId: "0b0000ff-0000-4000-8000-00000000a00f",
  name: "E2E Breach Register Empty Tenant",
  industryCode: "general",
  member: { userId: ADMIN.id, email: ADMIN.email },
  roleCode: "organization_admin",
};

async function call(request: APIRequestContext, method: string, url: string, email: string, data?: object) {
  const res = await request.fetch(url, { method, headers: bearer(await accessTokenFor(email)), ...(data ? { data } : {}) });
  const text = await res.text();
  return { status: res.status(), text, json: text ? JSON.parse(text) : null };
}

const ago = (hours: number) => new Date(Date.now() - hours * HOUR).toISOString();

async function recordBreach(request: APIRequestContext, hoursAgo: number, over: object = {}) {
  const r = await call(request, "POST", `${base(HEALTH.organizationId)}/breaches`, ADMIN.email, {
    title: "Patient appointment list emailed to the wrong clinic",
    nature: "accidental_disclosure",
    severity: "high",
    awareAt: ago(hoursAgo),
    principalsAffected: 320,
    dataCategories: "Names, phone numbers, appointment times",
    ...over,
  });
  expect(r.status, r.text).toBe(201);
  return r.json.data.incident as {
    id: string;
    incidentCode: string;
    awareAt: string;
    status: string;
    board: { dueAt: string; clock: { state: string; label: string } };
    actions: { id: string; status: string; ownerUserId: string | null }[];
  };
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

let overdue: Awaited<ReturnType<typeof recordBreach>>;

test("the empty state: no breach, zero counts, and the overview's section says so", async ({ request }) => {
  const list = await call(request, "GET", `${base(EMPTY.organizationId)}/breaches`, ADMIN.email);
  expect(list.status, list.text).toBe(200);
  expect(list.json.data.incidents).toEqual([]);
  expect(list.json.data.counts).toEqual({ total: 0, active: 0, insideWindow: 0, overdue: 0, principalsPending: 0, closed: 0, dismissed: 0 });
  expect(list.json.data.clockNote).toContain("TrustStack targets, not statutory periods");
  const dash = await call(request, "GET", `${base(EMPTY.organizationId)}/dashboard`, ADMIN.email);
  expect(dash.json.data.breaches.counts.total).toBe(0);
  expect(dash.json.data.breaches.clocks).toEqual([]);
});

test("recording a breach: the code and the 72-hour due time are the server's, and the clock runs from awareness", async ({ request }) => {
  overdue = await recordBreach(request, 80);
  expect(overdue.incidentCode).toMatch(new RegExp(`^BRH-${new Date(overdue.awareAt).getFullYear()}-001$`));
  expect(Date.parse(overdue.board.dueAt) - Date.parse(overdue.awareAt)).toBe(72 * HOUR);
  expect(overdue.board.clock.state).toBe("overdue");
  expect(overdue.board.clock.label).toMatch(/^Overdue by 8h/);
  expect(overdue.status).toBe("open");

  // A client cannot send the code, the due time or a status.
  for (const forged of [{ incidentCode: "BRH-2026-999" }, { boardReportDueAt: ago(-1000) }, { status: "closed" }]) {
    const r = await call(request, "POST", `${base(HEALTH.organizationId)}/breaches`, ADMIN.email, {
      title: "x",
      nature: "other",
      severity: "low",
      awareAt: ago(1),
      ...forged,
    });
    expect(r.status, JSON.stringify(forged)).toBe(400);
  }
  // Nothing in the future; awareness cannot be edited afterwards.
  const future = await call(request, "POST", `${base(HEALTH.organizationId)}/breaches`, ADMIN.email, { title: "x", nature: "other", severity: "low", awareAt: ago(-2) });
  expect(future.status).toBe(422);
  const move = await call(request, "PATCH", `${base(HEALTH.organizationId)}/breaches/${overdue.id}`, ADMIN.email, { awareAt: ago(1) });
  expect(move.status).toBe(400);
});

test("1.1.0: an overdue Board report sets head 2 Exposed, with the reason in words; repetition is scored", async ({ request }) => {
  const r = await call(request, "GET", `${base(HEALTH.organizationId)}/exposure`, ADMIN.email);
  expect(r.status, r.text).toBe(200);
  // The breach rows came in 1.1.0; the model is now 1.7.0 (Slice 10.5 B4) and they stand unchanged.
  expect(r.json.data.modelVersion).toBe("1.7.0");
  const h2 = r.json.data.heads.find((h: { code: string }) => h.code === "H2");
  expect(h2.status).toBe("exposed");
  const texts = h2.reasons.map((x: { text: string }) => x.text);
  expect(texts).toContain("1 personal data breach: the detailed report to the Board is past its due time and not recorded as made (Rule 7(2)(b)).");
  expect(texts).toContain("1 personal data breach: affected Data Principals are not recorded as intimated (Rule 7(1)).");
  expect(h2.position.factors.find((f: { code: string }) => f.code === "repetition")).toMatchObject({ points: 1, clause: "(c)" });
  // 1.6.0 (D-098): a recorded breach also assesses head 2 — a reason, never a status of its own.
  expect(texts).toContain("1 personal data breach is recorded in the breach register (s.8(6), Rule 7), so this head is assessed from it.");
  expect(h2.evidencedBy.moduleInputs.map((m: { code: string }) => m.code)).toEqual(["breach_board_overdue", "breach_principals_pending", "breach_recorded"]);
  expect(r.json.data.unscoredFactors.map((f: { clause: string }) => f.clause)).toEqual(["(d)", "(f)", "(g)"]);

  // A stored snapshot, derived in SQL, says exactly what the live model says.
  const stored = await call(request, "POST", `${base(HEALTH.organizationId)}/exposure/snapshots`, ADMIN.email);
  expect(stored.status, stored.text).toBe(201);
  const storedH2 = stored.json.data.heads.find((h: { code: string }) => h.code === "H2");
  expect(stored.json.data.modelVersion).toBe("1.7.0");
  expect({ status: storedH2.status, reasons: storedH2.reasons, position: storedH2.position }).toEqual({
    status: h2.status,
    reasons: h2.reasons,
    position: h2.position,
  });
});

test("the Rule 7 timeline: each fact stamped with who recorded it; the report stops the clock; a fact cannot be removed", async ({ request }) => {
  const url = `${base(HEALTH.organizationId)}/breaches/${overdue.id}`;
  const initial = await call(request, "PATCH", url, ADMIN.email, { boardInitialAt: ago(79) });
  expect(initial.status, initial.text).toBe(200);
  expect(initial.json.data.incident.board.initial.recorded.byUserId).toBe(ADMIN.id);

  const report = await call(request, "PATCH", url, ADMIN.email, { boardReport: { at: ago(2), reference: "DPB-E2E-1" } });
  expect(report.status, report.text).toBe(200);
  const made = report.json.data.incident;
  expect(made.board.clock.state).toBe("made");
  expect(made.board.clock.label).toContain("after the due time");
  expect(made.board.report).toMatchObject({ reference: "DPB-E2E-1", recorded: { byUserId: ADMIN.id } });

  // Before awareness, or in the future: refused, in words.
  const early = await call(request, "PATCH", url, ADMIN.email, { principals: { at: ago(100), method: "SMS" } });
  expect(early.status).toBe(422);
  const later = await call(request, "PATCH", url, ADMIN.email, { boardInitialAt: ago(-3) });
  expect(later.status).toBe(422);

  // The report made, head 2 is no longer Exposed by the breach — the people are still not told.
  const exposure = await call(request, "GET", `${base(HEALTH.organizationId)}/exposure`, ADMIN.email);
  const h2 = exposure.json.data.heads.find((h: { code: string }) => h.code === "H2");
  expect(h2.reasons.map((x: { text: string }) => x.text).join(" ")).not.toContain("past its due time");
});

test("the Board's extension moves the due time — and must run beyond 72 hours with the Board's reference", async ({ request }) => {
  const b = await recordBreach(request, 10, { title: "Ransomware on a lab workstation", nature: "ransomware", severity: "critical" });
  expect(b.incidentCode).toMatch(/-002$/);
  const url = `${base(HEALTH.organizationId)}/breaches/${b.id}`;
  const short = await call(request, "PATCH", url, ADMIN.email, { boardExtension: { until: new Date(Date.parse(b.awareAt) + 48 * HOUR).toISOString(), reference: "DPB/EXT/1" } });
  expect(short.status).toBe(422);
  const noRef = await call(request, "PATCH", url, ADMIN.email, { boardExtension: { until: new Date(Date.parse(b.awareAt) + 168 * HOUR).toISOString() } });
  expect(noRef.status).toBe(400);
  const until = new Date(Date.parse(b.awareAt) + 168 * HOUR).toISOString();
  const ok = await call(request, "PATCH", url, ADMIN.email, { boardExtension: { until, reference: "DPB/EXT/1" } });
  expect(ok.status, ok.text).toBe(200);
  expect(ok.json.data.incident.board.dueAt).toBe(until);
  expect(ok.json.data.incident.board.extension).toMatchObject({ reference: "DPB/EXT/1", recorded: { byUserId: ADMIN.id } });

  const list = await call(request, "GET", `${base(HEALTH.organizationId)}/breaches`, ADMIN.email);
  expect(list.json.data.counts).toMatchObject({ total: 2, active: 2, insideWindow: 1, overdue: 0, principalsPending: 2 });
});

test("the lifecycle: closing needs both intimations; a closed breach is reopened to change; a dismissal needs its reason", async ({ request }) => {
  const url = `${base(HEALTH.organizationId)}/breaches/${overdue.id}`;
  const early = await call(request, "PATCH", url, ADMIN.email, { status: "closed" });
  expect(early.status).toBe(409);
  expect(early.json.error.message).toContain("before closing this breach");
  const told = await call(request, "PATCH", url, ADMIN.email, { principals: { at: ago(1), method: "SMS and a call to each patient" } });
  expect(told.status, told.text).toBe(200);
  const closed = await call(request, "PATCH", url, ADMIN.email, { status: "closed" });
  expect(closed.status, closed.text).toBe(200);
  expect(closed.json.data.incident).toMatchObject({ status: "closed", closedByName: expect.any(String) });
  const locked = await call(request, "PATCH", url, ADMIN.email, { title: "Edited after closing" });
  expect(locked.status).toBe(409);
  const reopened = await call(request, "PATCH", url, ADMIN.email, { status: "open" });
  expect(reopened.status).toBe(200);
  expect((await call(request, "PATCH", url, ADMIN.email, { status: "closed" })).status).toBe(200);

  const suspected = await recordBreach(request, 3, { title: "Suspected phishing click", nature: "other", severity: "low" });
  const surl = `${base(HEALTH.organizationId)}/breaches/${suspected.id}`;
  expect((await call(request, "PATCH", surl, ADMIN.email, { status: "dismissed" })).status).toBe(422);
  const dismissed = await call(request, "PATCH", surl, ADMIN.email, { status: "dismissed", dismissalReason: "No personal data was reached: the link was blocked." });
  expect(dismissed.status, dismissed.text).toBe(200);
  expect(dismissed.json.data.incident.board.clock.state).toBe("not_applicable");

  const list = await call(request, "GET", `${base(HEALTH.organizationId)}/breaches`, ADMIN.email);
  expect(list.json.data.counts).toMatchObject({ total: 3, active: 1, closed: 1, dismissed: 1, principalsPending: 1 });
});

test("a breach's actions are on the ONE action list, labelled by source, under the same closing rule", async ({ request }) => {
  const url = `${base(HEALTH.organizationId)}/breaches/${overdue.id}/actions`;
  // A closed breach can still take remedial work; a dismissed one cannot.
  const added = await call(request, "POST", url, ADMIN.email, { title: "Restrict the clinic mailing list to named staff", ownerUserId: OWNER.id, dueDate: "2027-01-31" });
  expect(added.status, added.text).toBe(201);
  const action = added.json.data.incident.actions[0];
  expect(action).toMatchObject({ status: "open", ownerUserId: OWNER.id, dueDate: "2027-01-31", breachIncidentId: overdue.id });

  const dash = await call(request, "GET", `${base(HEALTH.organizationId)}/dashboard`, ADMIN.email);
  expect(dash.json.data.actions.sources).toContain("breach");
  const item = dash.json.data.actions.items.find((i: { id: string }) => i.id === action.id);
  expect(item).toMatchObject({ source: "breach", sourceLabel: "Breach register", severity: "high", priority: "P1", href: `/dashboard/breaches/${overdue.id}` });
  expect(dash.json.data.actions.summary.bySource.breach).toEqual({ outstanding: 1, overdue: 0 });
  expect(dash.json.data.breaches.counts).toMatchObject({ total: 3, closed: 1, dismissed: 1 });

  const actionUrl = `${url}/${action.id}`;
  // The owner cannot approve their own action without reviewed evidence (D-056)…
  const own = await call(request, "PATCH", actionUrl, OWNER.email, { status: "closed" });
  expect(own.status).toBe(409);
  // …a reviewer who is not the owner can.
  const approved = await call(request, "PATCH", actionUrl, ADMIN.email, { status: "closed" });
  expect(approved.status, approved.text).toBe(200);
  expect(approved.json.data.incident.actions[0]).toMatchObject({ status: "closed", closureBasis: "reviewer_approval" });
});

test("permissions: the Executive Sponsor reads but writes nothing; a Department Owner may record a breach", async ({ request }) => {
  const list = await call(request, "GET", `${base(HEALTH.organizationId)}/breaches`, SPONSOR.email);
  expect(list.status).toBe(200);
  const create = await call(request, "POST", `${base(HEALTH.organizationId)}/breaches`, SPONSOR.email, { title: "x", nature: "other", severity: "low", awareAt: ago(1) });
  expect(create.status).toBe(403);
  const patch = await call(request, "PATCH", `${base(HEALTH.organizationId)}/breaches/${overdue.id}`, SPONSOR.email, { status: "open" });
  expect(patch.status).toBe(403);
  const action = await call(request, "POST", `${base(HEALTH.organizationId)}/breaches/${overdue.id}/actions`, SPONSOR.email, { title: "x" });
  expect(action.status).toBe(403);
  // Contributors write registers: the Department Owner may record a breach.
  const contributor = await call(request, "POST", `${base(HEALTH.organizationId)}/breaches`, OWNER.email, { title: "Lost laptop", nature: "loss_or_destruction", severity: "medium", awareAt: ago(1) });
  expect(contributor.status, contributor.text).toBe(201);
});

test("GATE 5: Org B's admin never reaches this tenant's register, by either path", async ({ request }) => {
  const bml = SEED_USERS.bmlAdmin.email;
  const viaHealth = await call(request, "GET", `${base(HEALTH.organizationId)}/breaches`, bml);
  expect(viaHealth.status).toBe(403);
  expect(viaHealth.json.error.code).toBe("TENANT_ACCESS_DENIED");
  for (const [method, tail, data] of [
    ["GET", `/breaches/${overdue.id}`, undefined],
    ["PATCH", `/breaches/${overdue.id}`, { title: "Hijacked" }],
    ["POST", `/breaches/${overdue.id}/actions`, { title: "Hijacked" }],
  ] as const) {
    const r = await call(request, method, `${base(BML.id)}${tail}`, bml, data);
    expect(r.status, `${method} ${tail}`).toBe(404);
    expect(r.text).not.toContain(HEALTH.name);
    expect(r.text).not.toContain("clinic");
  }
  const still = await call(request, "GET", `${base(HEALTH.organizationId)}/breaches/${overdue.id}`, ADMIN.email);
  expect(still.json.data.incident.title).toBe("Patient appointment list emailed to the wrong clinic");
});

test("every write is audited as the person — the code and status, never the title", async () => {
  const rows = await withDb(async (db) =>
    (
      await db.query<{ event_type: string; user_id: string; metadata: Record<string, unknown> }>(
        "SELECT event_type, user_id, metadata FROM public.audit_logs WHERE organization_id = $1 AND entity_id = $2 ORDER BY created_at",
        [HEALTH.organizationId, overdue.id],
      )
    ).rows,
  );
  expect(rows[0]).toMatchObject({ event_type: "breach.breach_incidents.insert", user_id: ADMIN.id });
  expect(rows.length).toBeGreaterThan(5);
  expect(JSON.stringify(rows)).not.toContain("Patient appointment list");
  expect(JSON.stringify(rows)).not.toContain("DPB-E2E-1");
});
