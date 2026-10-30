/**
 * Slice 6 — the gap register, end to end through the API: score → generate →
 * assign → attach evidence → close, then regenerate and finalise.
 *
 * It runs twice, on Mumbai University (`university`) and on a disposable
 * `general`-industry tenant, and must behave identically (D-040): a gap is a
 * weak answer in any industry, and closing one takes evidence in any industry.
 *
 * Spec files run in parallel against one database, so everything here writes
 * to assessments THIS file creates, under its own name prefix, and never to
 * MU's seeded baseline.
 */
import { expect, test, type APIRequestContext } from "@playwright/test";
import {
  accessTokenFor,
  bearer,
  createE2eTenant,
  removeE2eTenant,
  removeEvidence,
  SEED_ORGS,
  SEED_USERS,
  withDb,
} from "../helpers";

const MU = SEED_ORGS.mumbaiUniversity;
const NAME_PREFIX = "E2E gap register API";
const base = (orgId: string) => `/api/v1/organizations/${orgId}`;
const FILE_BODY = "Sample artefact for the Slice 6 gap register e2e.";

/**
 * Only `muItSecurity` and `muLegal` may join a disposable tenant: every other
 * seeded MU user is asserted to be single-organisation by another spec.
 */
const GENERAL_TENANT = {
  organizationId: "0b0000ff-0000-4000-8000-00000000a006",
  name: "E2E Gap Register General Tenant",
  industryCode: "general",
  dataPrincipalCountEstimate: 1200,
  member: { userId: SEED_USERS.muItSecurity.id, email: SEED_USERS.muItSecurity.email },
  roleCode: "consultant",
  extraMembers: [{ userId: SEED_USERS.muLegal.id, roleCode: "dpdp_owner" }],
};

interface Journey {
  orgId: string;
  /** Answers, uploads, generates — and OWNS the actions. */
  owner: { id: string; email: string };
  /** Reviews evidence, approves closures and finalises. Never the owner. */
  reviewer: { id: string; email: string };
}

const MU_JOURNEY: Journey = {
  orgId: MU.id,
  owner: { id: SEED_USERS.consultant.id, email: SEED_USERS.consultant.email },
  reviewer: { id: SEED_USERS.mumbaiUniversity.id, email: SEED_USERS.mumbaiUniversity.email },
};
const GENERAL_JOURNEY: Journey = {
  orgId: GENERAL_TENANT.organizationId,
  owner: { id: SEED_USERS.muItSecurity.id, email: SEED_USERS.muItSecurity.email },
  reviewer: { id: SEED_USERS.muLegal.id, email: SEED_USERS.muLegal.email },
};

const CLOSING_REFUSED =
  "Closing needs reviewed evidence attached to this action, or approval by a reviewer who is not its owner.";

const createdEvidence: { orgId: string; id: string }[] = [];

test.describe.configure({ mode: "serial" });

test.beforeAll(async ({ playwright }) => {
  await createE2eTenant(GENERAL_TENANT);
  const request = await playwright.request.newContext({ baseURL: test.info().project.use.baseURL });
  const res = await request.put(`${base(GENERAL_TENANT.organizationId)}/scope`, {
    headers: bearer(await accessTokenFor(GENERAL_TENANT.member.email)),
    data: {
      industryCode: "general",
      dataPrincipalCountEstimate: 1200,
      answers: {
        childrenData: "no",
        // An explicit `no` scopes the VENDOR domain out (D-037) — so this
        // tenant is the one that proves a scoped-out domain has no gaps.
        usesDataProcessors: "no",
        aiUsageTypes: [],
        marketingTracking: "no",
        crossBorder: "no",
        multiLocation: false,
        publicFacingPortal: "no",
        sensitiveDocuments: "no",
      },
    },
  });
  expect(res.status(), await res.text()).toBe(200);
  await request.dispose();
});

test.afterAll(async () => {
  for (const orgId of new Set(createdEvidence.map((e) => e.orgId))) {
    await removeEvidence(orgId, createdEvidence.filter((e) => e.orgId === orgId).map((e) => e.id));
  }
  // Gaps, actions, answers and snapshots go with their assessment.
  await withDb((db) => db.query("DELETE FROM public.assessments WHERE name LIKE $1", [`${NAME_PREFIX}%`]));
  await removeE2eTenant(GENERAL_TENANT);
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function createAssessment(request: APIRequestContext, j: Journey, label: string): Promise<string> {
  const res = await request.post(`${base(j.orgId)}/assessments`, {
    headers: bearer(await accessTokenFor(j.owner.email)),
    data: { name: `${NAME_PREFIX} ${label} ${Date.now()}` },
  });
  expect(res.status(), await res.text()).toBe(201);
  return (await res.json()).data.assessment.id as string;
}

interface Question {
  questionCode: string;
  domainCode: string;
}

async function questions(request: APIRequestContext, j: Journey, assessmentId: string): Promise<Question[]> {
  const res = await request.get(`${base(j.orgId)}/assessments/${assessmentId}/questions`, {
    headers: bearer(await accessTokenFor(j.owner.email)),
  });
  expect(res.status()).toBe(200);
  return (await res.json()).data.questions as Question[];
}

async function answer(request: APIRequestContext, j: Journey, assessmentId: string, code: string, claim: number) {
  const res = await request.put(`${base(j.orgId)}/assessments/${assessmentId}/responses/${encodeURIComponent(code)}`, {
    headers: bearer(await accessTokenFor(j.owner.email)),
    data: { applicabilityDecision: "applicable", claimedMaturity: claim },
  });
  expect([200, 201], `${code}: ${await res.text()}`).toContain(res.status());
  return (await res.json()).data.response as { id: string; adjustedScore: number; evidenceLevel: number | null };
}

/** In batches of 8: 124 sequential writes time out against the hosted project. */
async function answerEverything(request: APIRequestContext, j: Journey, assessmentId: string, claim: number) {
  const all = await questions(request, j, assessmentId);
  const BATCH = 8;
  for (let i = 0; i < all.length; i += BATCH) {
    await Promise.all(all.slice(i, i + BATCH).map((q) => answer(request, j, assessmentId, q.questionCode, claim)));
  }
  return all;
}

/** upload-url → PUT to Storage. Returns the evidence id; nothing is linked yet. */
async function upload(request: APIRequestContext, j: Journey): Promise<string> {
  const issued = await request.post(`${base(j.orgId)}/evidence/upload-url`, {
    headers: bearer(await accessTokenFor(j.owner.email)),
    data: { fileName: "gap-artefact.txt", contentType: "text/plain", byteSize: Buffer.byteLength(FILE_BODY) },
  });
  expect(issued.status(), await issued.text()).toBe(201);
  const { evidence, upload: target } = (await issued.json()).data;
  createdEvidence.push({ orgId: j.orgId, id: evidence.id });
  const put = await request.put(target.url, { data: Buffer.from(FILE_BODY), headers: { "Content-Type": target.contentType } });
  expect(put.status(), await put.text()).toBe(200);
  return evidence.id as string;
}

async function link(request: APIRequestContext, j: Journey, evidenceId: string, target: object, as = j.owner.email) {
  return request.post(`${base(j.orgId)}/evidence/${evidenceId}/link`, {
    headers: bearer(await accessTokenFor(as)),
    data: target,
  });
}

async function review(request: APIRequestContext, j: Journey, evidenceId: string, status: string, level: number) {
  const res = await request.patch(`${base(j.orgId)}/evidence/${evidenceId}/review`, {
    headers: bearer(await accessTokenFor(j.reviewer.email)),
    data: { reviewStatus: status, evidenceLevel: level },
  });
  expect(res.status(), await res.text()).toBe(200);
}

interface Action {
  id: string;
  title: string;
  ownerUserId: string | null;
  ownerName: string | null;
  ownerRole: string | null;
  status: string;
  dueDate: string | null;
  closedBy: string | null;
  closedAt: string | null;
  closureBasis: string | null;
  notes: string | null;
  evidence: { id: string; reviewStatus: string }[];
}
interface Gap {
  id: string;
  questionCode: string;
  questionText: string | null;
  domainCode: string;
  severity: string;
  priority: string;
  adjustedScore: number;
  state: string;
  finding: string;
  actions: Action[];
}
interface Register {
  status: string;
  frozen: boolean;
  stale: boolean;
  counts: { gapCount: number; critical: number; high: number; medium: number; low: number; supersededCount: number };
  gaps: Gap[];
  members: { userId: string; fullName: string | null; roleName: string }[];
}

async function register(request: APIRequestContext, j: Journey, assessmentId: string, as = j.owner.email): Promise<Register> {
  const res = await request.get(`${base(j.orgId)}/assessments/${assessmentId}/gaps`, {
    headers: bearer(await accessTokenFor(as)),
  });
  expect(res.status(), await res.text()).toBe(200);
  return (await res.json()).data as Register;
}

async function generate(request: APIRequestContext, j: Journey, assessmentId: string, as = j.owner.email) {
  return request.post(`${base(j.orgId)}/assessments/${assessmentId}/gaps/generate`, {
    headers: bearer(await accessTokenFor(as)),
  });
}

async function patch(request: APIRequestContext, j: Journey, assessmentId: string, gap: Gap, data: object, as = j.owner.email) {
  return request.patch(`${base(j.orgId)}/assessments/${assessmentId}/gaps/${gap.id}/actions/${gap.actions[0]!.id}`, {
    headers: bearer(await accessTokenFor(as)),
    data,
  });
}

/** `YYYY-MM-DD`, `days` from today in India — the same "today" the database uses. */
function inDays(days: number): string {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
  return new Date(Date.parse(`${today}T00:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10);
}

/**
 * Four answers, one of each kind the threshold separates:
 * claim 0 → Critical · claim 5 unevidenced → High · claim 3 + E3 → Low ·
 * claim 4 + E4 → adjusted 4, NO gap.
 */
async function scoredAssessment(request: APIRequestContext, j: Journey, label: string) {
  const assessmentId = await createAssessment(request, j, label);
  const [critical, high, low, none] = (await questions(request, j, assessmentId)).slice(0, 4);

  await answer(request, j, assessmentId, critical!.questionCode, 0);
  await answer(request, j, assessmentId, high!.questionCode, 5);

  const lowResponse = await answer(request, j, assessmentId, low!.questionCode, 3);
  const lowEvidence = await upload(request, j);
  expect((await link(request, j, lowEvidence, { responseId: lowResponse.id })).status()).toBe(201);
  await review(request, j, lowEvidence, "partial", 3);

  const noneResponse = await answer(request, j, assessmentId, none!.questionCode, 4);
  const noneEvidence = await upload(request, j);
  expect((await link(request, j, noneEvidence, { responseId: noneResponse.id })).status()).toBe(201);
  await review(request, j, noneEvidence, "adequate", 4);

  return {
    assessmentId,
    codes: { critical: critical!.questionCode, high: high!.questionCode, low: low!.questionCode, none: none!.questionCode },
    lowEvidence,
  };
}

// ---------------------------------------------------------------------------
// The journey, on both tenants
// ---------------------------------------------------------------------------

for (const [label, journey] of [
  ["university", MU_JOURNEY],
  ["general", GENERAL_JOURNEY],
] as const) {
  test(`${label}: score → generate → assign → attach evidence → close`, async ({ request }) => {
    test.setTimeout(120_000);
    const j = journey;
    const { assessmentId, codes } = await scoredAssessment(request, j, label);

    // Before generation there is no register — and it says it is out of step.
    const before = await register(request, j, assessmentId);
    expect(before.gaps).toEqual([]);
    expect(before.stale).toBe(true);
    expect(before.frozen).toBe(false);

    // Generate: a POST with no body. There is nothing for a caller to send.
    const generated = await generate(request, j, assessmentId);
    expect(generated.status(), await generated.text()).toBe(200);
    expect((await generated.json()).data).toMatchObject({
      counts: { gapCount: 3, critical: 1, high: 1, medium: 0, low: 1, supersededCount: 0 },
      changes: { opened: 3, superseded: 0, removed: 0 },
    });

    const reg = await register(request, j, assessmentId);
    expect(reg.stale).toBe(false);
    // Most severe first; the answer that scored 4 has no gap at all.
    expect(reg.gaps.map((g) => [g.questionCode, g.severity, g.priority, g.adjustedScore, g.state])).toEqual([
      [codes.critical, "critical", "P0", 0, "open"],
      [codes.high, "high", "P1", 1, "open"],
      [codes.low, "low", "P3", 3, "open"],
    ]);
    // One action each, unowned and Open, due 30 / 60 days out — and no date
    // at all for the Low gap, which belongs to the next cycle (D-055).
    expect(reg.gaps.map((g) => g.actions.length)).toEqual([1, 1, 1]);
    expect(reg.gaps.map((g) => g.actions[0]!.dueDate)).toEqual([inDays(30), inDays(60), null]);
    for (const g of reg.gaps) {
      expect(g.actions[0]).toMatchObject({ status: "open", ownerUserId: null, closureBasis: null, evidence: [] });
      expect(g.finding).toBe(`Review and remediate: ${g.questionText}`);
    }
    // Those who can assign get the list of people to assign to.
    expect(reg.members.map((m) => m.userId)).toEqual(expect.arrayContaining([j.owner.id, j.reviewer.id]));

    const [criticalGap, highGap] = reg.gaps as [Gap, Gap, Gap];

    // ---- Assign ----------------------------------------------------------
    const assigned = await patch(request, j, assessmentId, criticalGap, {
      ownerUserId: j.owner.id,
      status: "in_progress",
      dueDate: inDays(14),
      notes: "Drafting the office order.",
    });
    expect(assigned.status(), await assigned.text()).toBe(200);
    expect((await assigned.json()).data.gap.actions[0]).toMatchObject({
      ownerUserId: j.owner.id,
      status: "in_progress",
      dueDate: inDays(14),
      notes: "Drafting the office order.",
    });

    // An owner from outside the organisation is refused.
    const outsider = await patch(request, j, assessmentId, criticalGap, { ownerUserId: SEED_USERS.bmlAdmin.id });
    expect(outsider.status()).toBe(422);

    // ---- Closing on a promise is refused ----------------------------------
    const promise = await patch(request, j, assessmentId, criticalGap, { status: "closed" });
    expect(promise.status()).toBe(409);
    expect((await promise.json()).error.message).toBe(CLOSING_REFUSED);

    // ---- Attach evidence to the ACTION ------------------------------------
    const scoreBefore = (await register(request, j, assessmentId)).gaps[0]!.adjustedScore;
    const evidenceId = await upload(request, j);
    const linked = await link(request, j, evidenceId, { gapActionId: criticalGap.actions[0]!.id });
    expect(linked.status(), await linked.text()).toBe(201);
    expect((await linked.json()).data.gap.actions[0].evidence).toMatchObject([{ id: evidenceId, reviewStatus: "pending" }]);
    // Twice is a conflict, not a second link.
    expect((await link(request, j, evidenceId, { gapActionId: criticalGap.actions[0]!.id })).status()).toBe(409);
    // One target, never both.
    const both = await link(request, j, evidenceId, { gapActionId: criticalGap.actions[0]!.id, responseId: criticalGap.id });
    expect(both.status()).toBe(400);

    // Unreviewed evidence is still a promise.
    const pending = await patch(request, j, assessmentId, criticalGap, { status: "closed" });
    expect(pending.status()).toBe(409);

    // ---- A reviewer accepts it; the OWNER can now close --------------------
    await review(request, j, evidenceId, "strong", 5);
    const closed = await patch(request, j, assessmentId, criticalGap, { status: "closed" });
    expect(closed.status(), await closed.text()).toBe(200);
    const closedAction = (await closed.json()).data.gap.actions[0] as Action;
    expect(closedAction).toMatchObject({ status: "closed", closureBasis: "evidence", closedBy: j.owner.id });
    expect(closedAction.closedAt).not.toBeNull();

    // Strong evidence on the ACTION did not lift the ANSWER: still adjusted 0,
    // still a Critical gap, and the register is not stale.
    const afterClose = await register(request, j, assessmentId);
    expect(afterClose.gaps[0]).toMatchObject({ questionCode: codes.critical, adjustedScore: scoreBefore, severity: "critical" });
    expect(afterClose.stale).toBe(false);

    // ---- Closed is read-only, and its evidence stays put -------------------
    expect((await patch(request, j, assessmentId, criticalGap, { notes: "afterthought" })).status()).toBe(409);
    const detachUrl = `${base(j.orgId)}/assessments/${assessmentId}/gaps/${criticalGap.id}/actions/${criticalGap.actions[0]!.id}/evidence/${evidenceId}`;
    const detachClosed = await request.delete(detachUrl, { headers: bearer(await accessTokenFor(j.owner.email)) });
    expect(detachClosed.status()).toBe(409);

    // ---- The other route to Closed: a reviewer who is not the owner --------
    expect((await patch(request, j, assessmentId, highGap, { ownerUserId: j.owner.id })).status()).toBe(200);
    // The owner cannot approve their own work…
    expect((await patch(request, j, assessmentId, highGap, { status: "closed" })).status()).toBe(409);
    // …a reviewer can.
    const approved = await patch(request, j, assessmentId, highGap, { status: "closed" }, j.reviewer.email);
    expect(approved.status(), await approved.text()).toBe(200);
    expect((await approved.json()).data.gap.actions[0]).toMatchObject({
      status: "closed",
      closureBasis: "reviewer_approval",
      closedBy: j.reviewer.id,
    });

    // ---- Reopen, then detach ---------------------------------------------
    expect((await patch(request, j, assessmentId, criticalGap, { status: "open" })).status()).toBe(409);
    const reopened = await patch(request, j, assessmentId, criticalGap, { status: "in_progress" });
    expect((await reopened.json()).data.gap.actions[0]).toMatchObject({ status: "in_progress", closureBasis: null, closedBy: null });
    const detached = await request.delete(detachUrl, { headers: bearer(await accessTokenFor(j.owner.email)) });
    expect(detached.status(), await detached.text()).toBe(200);
    expect((await detached.json()).data.gap.actions[0].evidence).toEqual([]);
    // The artefact itself is never deleted (D-042).
    const artefact = await withDb((db) => db.query("SELECT 1 FROM public.evidence WHERE id = $1", [evidenceId]));
    expect(artefact.rows).toHaveLength(1);

    // ---- The audit trail --------------------------------------------------
    const audit = await withDb((db) =>
      db.query<{ event_type: string; metadata: Record<string, unknown> }>(
        `SELECT event_type, metadata FROM public.audit_logs
         WHERE organization_id = $1 AND (entity_id = $2 OR entity_id = ANY($3::uuid[]))
         ORDER BY created_at`,
        [j.orgId, assessmentId, reg.gaps.map((g) => g.actions[0]!.id)],
      ),
    );
    const events = audit.rows.map((r) => r.event_type);
    expect(events.filter((e) => e === "assessment.gaps.generated")).toHaveLength(1);
    expect(events.filter((e) => e === "gap.gap_actions.update").length).toBeGreaterThanOrEqual(5);
    // No free text, ever: not the notes, not the title.
    expect(JSON.stringify(audit.rows)).not.toContain("Drafting the office order");
  });

  test(`${label}: regeneration follows the answers and never discards human work`, async ({ request }) => {
    test.setTimeout(120_000);
    const j = journey;
    const { assessmentId, codes, lowEvidence } = await scoredAssessment(request, j, `${label} regen`);
    expect((await generate(request, j, assessmentId)).status()).toBe(200);
    const first = await register(request, j, assessmentId);
    const [criticalGap, highGap] = first.gaps as [Gap, Gap, Gap];

    // Somebody works on the High gap's action; nobody touches the other two.
    expect(
      (await patch(request, j, assessmentId, highGap, { ownerUserId: j.owner.id, notes: "Policy drafted." })).status(),
    ).toBe(200);

    // The Low answer improves past the threshold (claim 4, evidence now E4)…
    await review(request, j, lowEvidence, "adequate", 4);
    await answer(request, j, assessmentId, codes.low, 4);
    // …the High answer does too, by evidence on the ANSWER…
    const highResponse = await answer(request, j, assessmentId, codes.high, 5);
    const highEvidence = await upload(request, j);
    expect((await link(request, j, highEvidence, { responseId: highResponse.id })).status()).toBe(201);
    await review(request, j, highEvidence, "strong", 5);
    // …and the Critical answer changes, but is still a gap (claim 2 unevidenced → 1).
    await answer(request, j, assessmentId, codes.critical, 2);

    // The register now knows it is out of step, and says so rather than lie.
    const stale = await register(request, j, assessmentId);
    expect(stale.stale).toBe(true);
    expect(stale.counts.gapCount).toBe(3);

    const regenerated = await generate(request, j, assessmentId);
    expect((await regenerated.json()).data).toMatchObject({
      counts: { gapCount: 1, critical: 0, high: 1, low: 0, supersededCount: 1 },
      changes: { opened: 0, superseded: 1, removed: 1 },
    });

    const after = await register(request, j, assessmentId);
    expect(after.stale).toBe(false);
    expect(after.gaps.map((g) => [g.questionCode, g.state, g.severity])).toEqual([
      // Refreshed in place: same gap, same action, new severity.
      [codes.critical, "open", "high"],
      // Kept, because its action carries human work.
      [codes.high, "superseded", "high"],
    ]);
    expect(after.gaps[0]!.id).toBe(criticalGap.id);
    expect(after.gaps[0]!.actions[0]!.id).toBe(criticalGap.actions[0]!.id);
    // A stored due date does not move when the priority does (D-055).
    expect(after.gaps[0]!.actions[0]!.dueDate).toBe(criticalGap.actions[0]!.dueDate);
    expect(after.gaps[1]!.actions[0]).toMatchObject({ ownerUserId: j.owner.id, notes: "Policy drafted." });
  });

  test(`${label}: finalising freezes the register with the score; actions live on`, async ({ request }) => {
    test.setTimeout(180_000);
    const j = journey;
    const assessmentId = await createAssessment(request, j, `${label} finalise`);
    // Every claim of 2, nothing evidenced → adjusted 1 → every answer is a High gap.
    const all = await answerEverything(request, j, assessmentId, 2);

    const finalised = await request.post(`${base(j.orgId)}/assessments/${assessmentId}/finalise`, {
      headers: bearer(await accessTokenFor(j.reviewer.email)),
    });
    expect(finalised.status(), await finalised.text()).toBe(201);
    const snapshot = (await finalised.json()).data;

    // Nobody generated anything: finalising did, from the answers it froze.
    const reg = await register(request, j, assessmentId);
    expect(reg.frozen).toBe(true);
    expect(reg.stale).toBe(false);
    expect(reg.counts).toMatchObject({ gapCount: all.length, critical: 0, high: all.length });
    // The register and the frozen score agree.
    expect(reg.counts.high).toBe(snapshot.overall.highCount);
    expect(reg.counts.critical).toBe(snapshot.overall.criticalCount);

    // A domain with no questions has no gaps — it was never asked (D-038).
    const scopedOut = (snapshot.domains as { code: string; state: string }[]).filter((d) => d.state === "scoped_out");
    for (const d of scopedOut) expect(reg.gaps.some((g) => g.domainCode === d.code)).toBe(false);
    if (label === "general") expect(scopedOut.map((d) => d.code)).toEqual(["VENDOR"]);

    // Frozen: it cannot be regenerated.
    const again = await generate(request, j, assessmentId);
    expect(again.status()).toBe(409);
    expect((await again.json()).error.message).toContain("frozen");

    // …but remediation is exactly what happens next.
    const gap = reg.gaps[0]!;
    const assigned = await patch(request, j, assessmentId, gap, { ownerUserId: j.owner.id, status: "in_progress" });
    expect(assigned.status(), await assigned.text()).toBe(200);
    const evidenceId = await upload(request, j);
    expect((await link(request, j, evidenceId, { gapActionId: gap.actions[0]!.id })).status()).toBe(201);
    await review(request, j, evidenceId, "adequate", 4);
    const closed = await patch(request, j, assessmentId, gap, { status: "closed" });
    expect((await closed.json()).data.gap.actions[0]).toMatchObject({ status: "closed", closureBasis: "evidence" });

    // And the frozen gap did not move.
    const after = await register(request, j, assessmentId);
    expect(after.gaps[0]).toMatchObject({ id: gap.id, severity: "high", state: "open", adjustedScore: 1 });
    // An ANSWER's evidence stays locked with the score.
    const responses = await request.get(`${base(j.orgId)}/assessments/${assessmentId}/responses`, {
      headers: bearer(await accessTokenFor(j.owner.email)),
    });
    const responseId = (await responses.json()).data.responses[0].id as string;
    expect((await link(request, j, evidenceId, { responseId })).status()).toBe(409);
  });
}

// ---------------------------------------------------------------------------
// Permissions and tenancy
// ---------------------------------------------------------------------------

test("a read-only member can read the register but not generate it or change an action", async ({ request }) => {
  const j = MU_JOURNEY;
  const { assessmentId } = await scoredAssessment(request, j, "read only");
  expect((await generate(request, j, assessmentId)).status()).toBe(200);

  const dean = SEED_USERS.muDean.email; // executive sponsor: gap.read, no gap.write
  const reg = await register(request, j, assessmentId, dean);
  expect(reg.counts.gapCount).toBe(3);
  // The assignee list is for those who can assign.
  expect(reg.members).toEqual([]);

  const generateRes = await generate(request, j, assessmentId, dean);
  expect(generateRes.status()).toBe(403);
  expect((await generateRes.json()).error.code).toBe("FORBIDDEN");

  const patchRes = await patch(request, j, assessmentId, reg.gaps[0]!, { status: "in_progress" }, dean);
  expect(patchRes.status()).toBe(403);
  const unchanged = await register(request, j, assessmentId);
  expect(unchanged.gaps[0]!.actions[0]!.status).toBe("open");
});

test("the PATCH body is validated: unknown fields, bad dates and empty bodies are refused", async ({ request }) => {
  const j = MU_JOURNEY;
  const { assessmentId } = await scoredAssessment(request, j, "validation");
  expect((await generate(request, j, assessmentId)).status()).toBe(200);
  const gap = (await register(request, j, assessmentId)).gaps[0]!;

  for (const body of [
    {},
    { status: "done" },
    { dueDate: "2026-02-31" },
    { dueDate: "31/12/2026" },
    // The derived and stamped fields are not the caller's to send.
    { severity: "low" },
    { closureBasis: "evidence" },
    { closedBy: SEED_USERS.consultant.id },
  ]) {
    const res = await patch(request, j, assessmentId, gap, body);
    expect(res.status(), JSON.stringify(body)).toBe(400);
  }
  // A due date can be cleared: "next cycle".
  const cleared = await patch(request, j, assessmentId, gap, { dueDate: null });
  expect((await cleared.json()).data.gap.actions[0].dueDate).toBeNull();
});

test("GATE 5: Org A cannot reach Org B's register — by path, by gap id, or by evidence link", async ({ request }) => {
  test.setTimeout(120_000);
  // Org B here is the disposable tenant, which really HAS gaps and actions.
  const b = GENERAL_JOURNEY;
  const { assessmentId: bAssessment } = await scoredAssessment(request, b, "tenant B");
  expect((await generate(request, b, bAssessment)).status()).toBe(200);
  const bGap = (await register(request, b, bAssessment)).gaps[0]!;

  const a = MU_JOURNEY;
  const { assessmentId: aAssessment } = await scoredAssessment(request, a, "tenant A");
  expect((await generate(request, a, aAssessment)).status()).toBe(200);

  // The MU reviewer is a member of Mumbai University only.
  const attacker = bearer(await accessTokenFor(a.reviewer.email));

  // 1. Org B's path → 403, whatever the method.
  const viaB = `${base(b.orgId)}/assessments/${bAssessment}/gaps`;
  for (const res of [
    await request.get(viaB, { headers: attacker }),
    await request.post(`${viaB}/generate`, { headers: attacker }),
    await request.patch(`${viaB}/${bGap.id}/actions/${bGap.actions[0]!.id}`, { headers: attacker, data: { status: "in_progress" } }),
  ]) {
    expect(res.status()).toBe(403);
    expect((await res.json()).error.code).toBe("TENANT_ACCESS_DENIED");
  }

  // 2. Org A's own path carrying Org B's ids → 404, and nothing leaks.
  for (const res of [
    await request.get(`${base(a.orgId)}/assessments/${bAssessment}/gaps`, { headers: attacker }),
    await request.post(`${base(a.orgId)}/assessments/${bAssessment}/gaps/generate`, { headers: attacker }),
    // Org A's own assessment, Org B's gap and action.
    await request.patch(`${base(a.orgId)}/assessments/${aAssessment}/gaps/${bGap.id}/actions/${bGap.actions[0]!.id}`, {
      headers: attacker,
      data: { status: "in_progress" },
    }),
  ]) {
    const body = await res.text();
    expect(res.status(), body).toBe(404);
    expect(body).not.toContain(bGap.id);
    expect(body).not.toContain(GENERAL_TENANT.name);
  }

  // 3. Org A's own evidence, linked to Org B's action through Org A's path → 404.
  const aEvidence = await upload(request, a);
  const crossLink = await request.post(`${base(a.orgId)}/evidence/${aEvidence}/link`, {
    headers: attacker,
    data: { gapActionId: bGap.actions[0]!.id },
  });
  expect(crossLink.status(), await crossLink.text()).toBe(404);

  // Org B's action is exactly as it was.
  const untouched = await register(request, b, bAssessment);
  expect(untouched.gaps[0]!.actions[0]).toMatchObject({ status: "open", evidence: [] });
});
