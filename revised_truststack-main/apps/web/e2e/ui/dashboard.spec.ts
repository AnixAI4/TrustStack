/**
 * Slice 8 — the dashboards on real data, in a browser.
 *
 *  - The Dean (executive sponsor) reads everything and is offered no control
 *    that changes anything — on the overview, the actions page, the gap
 *    register and the ROPA pages.
 *  - An overdue ROPA action and an overdue assessment action appear side by
 *    side in the owner-wise view and in the roadmap, each labelled by source.
 *  - Bharat Manufacturing's overview renders its empty state.
 *  - The question bank is a black box to a client (enforced by the database
 *    since D-071 — `e2e/api/black-box.spec.ts`); the assessment page
 *    collapses by domain.
 *
 * Everything asserted about actions is about the two THIS file creates, with
 * explicit past due dates (pitfalls 4 and 13).
 */
import { expect, test, type APIRequestContext, type Page } from "@playwright/test";
import { accessTokenFor, bearer, SEED_ASSESSMENTS, SEED_ORGS, SEED_ROPA, SEED_USERS, seedPassword, withDb } from "../helpers";

const MU = SEED_ORGS.mumbaiUniversity;
const NAME_PREFIX = "E2E dashboard UI";
const base = (orgId: string) => `/api/v1/organizations/${orgId}`;
const OVERDUE = "2026-02-01";
const WRITER = SEED_USERS.consultant;
const OWNER = SEED_USERS.mumbaiUniversity;
const MU_BASELINE = SEED_ASSESSMENTS.muBaseline.id;

/** The controls a read-only executive must never be offered. */
const WRITE_CONTROLS = /^(save|generate|regenerate|approve|reopen|attach|import|submit for review|finalise)/i;
/**
 * The links that lead to a write: matched EXACTLY, because an action's title
 * is data and may well begin "Approve…" or "Attach…" — a link to read it is
 * not a control.
 */
const WRITE_LINKS = /^(add a processing activity|import from a spreadsheet)$/i;

async function call(request: APIRequestContext, method: string, url: string, data?: object) {
  const res = await request.fetch(url, { method, headers: bearer(await accessTokenFor(WRITER.email)), ...(data ? { data } : {}) });
  const text = await res.text();
  expect(res.status(), `${method} ${url}: ${text}`).toBeLessThan(300);
  return JSON.parse(text);
}

async function cleanup() {
  await withDb(async (db) => {
    await db.query("DELETE FROM public.assessments WHERE name LIKE $1", [`${NAME_PREFIX}%`]);
    await db.query("DELETE FROM public.ropa_records WHERE name LIKE $1", [`${NAME_PREFIX}%`]);
  });
}

async function signIn(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(seedPassword());
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

async function expectNoWriteControls(page: Page, where: string) {
  await expect(page.getByRole("button", { name: WRITE_CONTROLS }), `${where}: a write button`).toHaveCount(0);
  await expect(page.getByRole("link", { name: WRITE_LINKS }), `${where}: a write link`).toHaveCount(0);
  await expect(page.locator('[data-testid="ropa-new"], [data-testid="ropa-import-link"]'), `${where}: a write link`).toHaveCount(0);
}

let assessmentActionId: string;
let ropaActionId: string;

test.describe.configure({ mode: "serial" });

test.beforeAll(async ({ playwright }) => {
  await cleanup();
  const request = await playwright.request.newContext({ baseURL: test.info().project.use.baseURL });
  try {
    const created = await call(request, "POST", `${base(MU.id)}/assessments`, { name: `${NAME_PREFIX} ${Date.now()}` });
    const assessmentId = created.data.assessment.id as string;
    await call(request, "PUT", `${base(MU.id)}/assessments/${assessmentId}/responses/G1.2`, {
      applicabilityDecision: "applicable",
      claimedMaturity: 1,
    });
    await call(request, "POST", `${base(MU.id)}/assessments/${assessmentId}/gaps/generate`);
    const register = await call(request, "GET", `${base(MU.id)}/assessments/${assessmentId}/gaps`);
    const gap = register.data.gaps.find((g: { questionCode: string }) => g.questionCode === "G1.2");
    assessmentActionId = gap.actions[0].id;
    await call(request, "PATCH", `${base(MU.id)}/assessments/${assessmentId}/gaps/${gap.id}/actions/${assessmentActionId}`, {
      ownerUserId: OWNER.id,
      dueDate: OVERDUE,
    });

    const record = await call(request, "POST", `${base(MU.id)}/ropa`, { name: `${NAME_PREFIX} record ${Date.now()}` });
    const recordId = record.data.record.id as string;
    await call(request, "POST", `${base(MU.id)}/ropa/gaps/generate`);
    const ropaGaps = await call(request, "GET", `${base(MU.id)}/ropa/gaps`);
    const ropaGap = ropaGaps.data.gaps.find(
      (g: { recordId: string | null; state: string; actions: unknown[] }) =>
        g.recordId === recordId && g.state === "open" && g.actions.length > 0,
    );
    ropaActionId = ropaGap.actions[0].id;
    await call(request, "PATCH", `${base(MU.id)}/ropa/gaps/${ropaGap.id}/actions/${ropaActionId}`, {
      ownerUserId: OWNER.id,
      dueDate: OVERDUE,
    });
  } finally {
    await request.dispose();
  }
});

test.afterAll(cleanup);

test("the Dean's overview: score, actions and register on separate tiles, in plain language", async ({ page }) => {
  await signIn(page, SEED_USERS.muDean.email);
  await expect(page.getByTestId("executive-overview")).toBeVisible({ timeout: 20_000 });

  await expect(page.getByTestId("overview-score")).toContainText("DPDP Compass Readiness Score");
  await expect(page.getByTestId("overview-score-value")).toBeVisible();
  await expect(page.getByTestId("overview-actions")).toBeVisible();
  await expect(page.getByTestId("overview-scorecard").locator('[data-testid^="scorecard-row-"]')).toHaveCount(16);
  // Completeness is the REGISTER's measure, on its own tile, and says it is not the readiness score.
  const ropa = page.getByTestId("overview-ropa");
  await expect(ropa).toContainText("How complete the processing register is");
  await expect(ropa).toContainText("never moves it");
  await expect(page.getByTestId("ropa-metric-total")).not.toHaveText("0");
  for (const metric of ["approved", "not-approved", "high-risk", "children", "vendor", "ai", "location", "retention", "review"]) {
    await expect(page.getByTestId(`ropa-metric-${metric}`)).toBeVisible();
  }
  await expect(page.getByTestId("overview-score")).not.toContainText("How complete");

  await expect(page.locator("body")).not.toContainText(/compliant/i);
  await expect(page.locator("body")).not.toContainText(/CORE_DPDP_V1|UNIVERSITY_HIGHER_ED_V1/);
});

test("the Dean can read every dashboard and register page and is offered nothing that writes", async ({ page }) => {
  await signIn(page, SEED_USERS.muDean.email);
  await expect(page.getByTestId("executive-overview")).toBeVisible({ timeout: 20_000 });
  await expectNoWriteControls(page, "overview");

  await page.getByTestId("nav-actions").click();
  await expect(page.getByTestId("owner-groups")).toBeVisible({ timeout: 20_000 });
  await expectNoWriteControls(page, "actions");

  await page.goto(`/dashboard/assessments/${MU_BASELINE}/gaps`);
  await expect(page.getByRole("heading").first()).toBeVisible();
  await page.waitForLoadState("networkidle");
  await expectNoWriteControls(page, "gap register");

  await page.goto("/dashboard/ropa");
  await expect(page.getByText("ROPA-001").first()).toBeVisible({ timeout: 20_000 });
  await expectNoWriteControls(page, "ROPA register");

  await page.goto("/dashboard/ropa/gaps");
  await page.waitForLoadState("networkidle");
  await expectNoWriteControls(page, "ROPA gaps");

  await page.goto(`/dashboard/ropa/${SEED_ROPA.records["ROPA-001"].id}`);
  await page.waitForLoadState("networkidle");
  await expectNoWriteControls(page, "ROPA record");
});

test("an overdue ROPA action and an overdue assessment action sit side by side, by owner and on the roadmap", async ({
  page,
}) => {
  await signIn(page, SEED_USERS.muDean.email);
  await page.goto("/dashboard/actions");

  const owner = page.getByTestId(`owner-group-${OWNER.id}`);
  await expect(owner).toBeVisible({ timeout: 20_000 });
  await expect(owner.getByTestId(`owner-item-${assessmentActionId}`)).toContainText("Overdue");
  await expect(owner.getByTestId(`owner-item-${ropaActionId}`)).toContainText("Overdue");
  await expect(page.getByTestId(`owner-item-source-${assessmentActionId}`)).toHaveText("Assessment");
  await expect(page.getByTestId(`owner-item-source-${ropaActionId}`)).toHaveText("Processing register");

  const overdue = page.getByTestId("roadmap-overdue");
  await expect(overdue.getByTestId(`roadmap-item-${assessmentActionId}`)).toContainText("Assessment ·");
  await expect(overdue.getByTestId(`roadmap-item-${ropaActionId}`)).toContainText("Processing register · ROPA-");

  // Filter to one source: the other leaves the page.
  await page.getByTestId("actions-filter-source").selectOption("ropa");
  await expect(page.getByTestId(`owner-item-${ropaActionId}`)).toBeVisible();
  await expect(page.getByTestId(`owner-item-${assessmentActionId}`)).toHaveCount(0);
});

// ---------------------------------------------------------------------------
// Slice 10.5 B1 — first-run and the overview
// ---------------------------------------------------------------------------

test("Your next steps lists the person's own actions, overdue first — and never another person's", async ({ page }) => {
  // The Registrar (a programme role) owns this file's two overdue actions.
  await signIn(page, OWNER.email);
  const steps = page.getByTestId("next-steps");
  await expect(steps).toBeVisible({ timeout: 20_000 });
  await expect(steps.getByTestId("user-email")).toHaveText(OWNER.email);
  await expect(steps.getByTestId("user-role")).toHaveText("DPDP Programme Owner");
  await expect(steps.getByTestId(`next-step-${assessmentActionId}`)).toContainText("Overdue");
  await expect(steps.getByTestId(`next-step-${ropaActionId}`)).toContainText("Overdue");
  // A programme role also sees the one register item that most needs someone.
  await expect(steps.getByTestId("next-steps-urgent")).toBeVisible();
  // The old "Signed in as … dpdp_owner" panel is gone; the top bar says who is signed in.
  await expect(page.getByText("Signed in as", { exact: true })).toHaveCount(0);
  await expect(page.getByTestId("organization-kind")).toHaveText("University / Higher Education · consultant-assisted");
  await page.getByTestId("user-menu").click();
  await page.getByRole("menuitem", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/login/);

  // The Dean sees none of them: not theirs.
  await signIn(page, SEED_USERS.muDean.email);
  await expect(page.getByTestId("next-steps")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId(`next-step-${assessmentActionId}`)).toHaveCount(0);
  await expect(page.getByTestId(`next-step-${ropaActionId}`)).toHaveCount(0);
  await expect(page.getByTestId("next-steps-none")).toHaveText("Nothing is assigned to you right now.");
});

test("a department owner's next steps are their own work — no register item, which is the programme's", async ({ page }) => {
  await signIn(page, SEED_USERS.muDepartmentOwner.email);
  const steps = page.getByTestId("next-steps");
  await expect(steps).toBeVisible({ timeout: 20_000 });
  await expect(steps.getByTestId("user-role")).toHaveText("Department Owner");
  await expect(steps.locator('[data-testid^="next-step-"]').first()).toBeVisible();
  await expect(steps.getByTestId("next-steps-urgent")).toHaveCount(0);
});

test("the readiness tile leads with progress; an unanswered domain reads Not started; the deadline reads as a sentence", async ({
  page,
}) => {
  await signIn(page, SEED_USERS.muDean.email);
  await expect(page.getByTestId("executive-overview")).toBeVisible({ timeout: 20_000 });
  await expect(page.locator('[data-testid^="overview-progress-"]').first()).toContainText(/^[\d,]+ of [\d,]+ questions answered$/);
  await expect(page.getByTestId("overview-score")).toContainText("the weight of the domains that apply");
  // Q3 (D-104.3): a display rule only — the scorecard still has sixteen rows.
  const scorecard = page.getByTestId("overview-scorecard");
  await expect(scorecard.locator('[data-testid^="scorecard-state-"]', { hasText: /^Not started$/ }).first()).toBeVisible();
  await expect(scorecard.locator('[data-testid^="scorecard-row-"]')).toHaveCount(16);
  await expect(page.getByTestId("overview-exposure-days")).toContainText(/\d+ days? to 13 May 2027|13 May 2027 is today|past 13 May 2027/);
  await expect(page.getByTestId("overview-exposure-days")).toContainText("finish date:");
});

test("a department owner lands on My actions; a programme role keeps By owner first; the purpose line names five sources", async ({
  page,
}) => {
  await signIn(page, SEED_USERS.muDepartmentOwner.email);
  await page.goto("/dashboard/actions");
  await expect(page.getByTestId("tab-mine")).toHaveAttribute("aria-selected", "true", { timeout: 20_000 });
  await expect(page.getByTestId("actions-mine").locator('[data-testid^="actions-mine-row-"]').first()).toBeVisible();
  await expect(page.getByTestId("actions-purpose")).toContainText(
    "from the assessment, the processing register, and the breach, rights and retention registers",
  );
  // F1.6: the top bar's title is the page's only "Actions" heading.
  await expect(page.getByRole("heading", { name: "Actions", exact: true })).toHaveCount(1);
  await page.getByTestId("user-menu").click();
  await page.getByRole("menuitem", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/login/);

  // The Registrar owns this file's actions but runs the programme: By owner stays first.
  await signIn(page, OWNER.email);
  await page.goto("/dashboard/actions");
  await expect(page.getByTestId("tab-owners")).toHaveAttribute("aria-selected", "true", { timeout: 20_000 });
  await page.getByTestId("tab-mine").click();
  await expect(page.getByTestId(`actions-mine-row-${assessmentActionId}`)).toContainText("Overdue");
  await expect(page.getByTestId(`actions-mine-row-${ropaActionId}`)).toContainText("Overdue");
});

test("Bharat Manufacturing's overview renders its empty state", async ({ page }) => {
  await signIn(page, SEED_USERS.bmlAdmin.email);
  await expect(page.getByTestId("executive-overview")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId("overview-no-assessment")).toBeVisible();
  await expect(page.getByTestId("overview-score")).toHaveCount(0);
  await expect(page.getByTestId("overview-ropa-empty")).toBeVisible();
  await expect(page.getByTestId("overview-actions")).toBeVisible();
  await expect(page.locator("body")).not.toContainText(/compliant/i);
});

test("to a client the question bank is a black box: no bank in the nav, and the page points to its assessments", async ({
  page,
}) => {
  await signIn(page, SEED_USERS.muDean.email);
  await expect(page.getByTestId("executive-overview")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId("nav-questions")).toHaveCount(0);
  await page.goto("/dashboard/questions");
  await expect(page.getByTestId("bank-not-available")).toBeVisible();
  await expect(page.getByTestId("pack-list")).toHaveCount(0);
});

test("Bharat Manufacturing's admin is not shown the bank either", async ({ page }) => {
  await signIn(page, SEED_USERS.bmlAdmin.email);
  await page.goto("/dashboard/questions");
  await expect(page.getByTestId("bank-not-available")).toBeVisible();
});

test("the assessment page shows one domain at a time: pills, Next domain, and the choice kept in the link", async ({ page }) => {
  await signIn(page, SEED_USERS.muDean.email);
  await page.goto(`/dashboard/assessments/${MU_BASELINE}`);
  await expect(page.getByTestId("answer-G1.2")).toBeVisible({ timeout: 20_000 });

  // Slice 10.5 B2 (N2): the first domain is open; the others are a pill away.
  await expect(page.getByTestId("tab-GOV")).toHaveAttribute("aria-selected", "true");
  await expect(page.getByTestId("domain-group-SECURITY")).toBeHidden();
  // Each pill counts what is answered in it.
  await expect(page.getByTestId("tab-GOV")).toContainText(/\d+\/8/);

  // A domain card opens its domain.
  const toggle = page.getByTestId("domain-toggle-SECURITY");
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-current", "true");
  await expect(page.getByTestId("domain-group-SECURITY").locator('[data-testid^="aq-"]').first()).toBeVisible();
  await expect(page.getByTestId("domain-group-GOV")).toBeHidden();
  await expect(page).toHaveURL(/#SECURITY$/);

  // Next domain moves on; the link remembers where you were.
  await page.getByTestId("domain-next-SECURITY").click();
  await expect(page.getByTestId("domain-group-BREACH")).toBeVisible();
  await page.reload();
  await expect(page.getByTestId("domain-group-BREACH")).toBeVisible({ timeout: 20_000 });
  await page.getByTestId("domain-previous-BREACH").click();
  await expect(page.getByTestId("domain-group-SECURITY")).toBeVisible();

  // A client reads plain reasons, never a trigger expression or a pack code.
  await expect(page.getByTestId("assessment-packs")).toHaveCount(0);
  await expect(page.locator("body")).not.toContainText("Triggered by");
});

// ---------------------------------------------------------------------------
// Slice 10.5 B3 — the registers: one name per register (F3.1)
// ---------------------------------------------------------------------------

const REGISTER_NAMES: [string, string, string][] = [
  ["nav-ropa", "/dashboard/ropa", "Processing register"],
  ["nav-breaches", "/dashboard/breaches", "Breach register"],
  ["nav-rights", "/dashboard/rights", "Rights and grievances"],
  ["nav-consent", "/dashboard/consent", "Notice and consent"],
  ["nav-processors", "/dashboard/processors", "Processors"],
  ["nav-retention", "/dashboard/retention", "Retention register"],
  ["nav-ai-risk", "/dashboard/ai-risk", "AI risk register"],
];

test("the menu names each register as its page does, on a laptop and in the phone's drawer", async ({ page }) => {
  await signIn(page, OWNER.email);
  for (const [testId, href, name] of REGISTER_NAMES) {
    await expect(page.getByTestId(testId)).toHaveText(name);
    await expect(page.getByTestId(testId)).toHaveAttribute("href", href);
  }
  // Every name fits the laptop menu on one line.
  for (const [testId] of REGISTER_NAMES) {
    const box = await page.getByTestId(testId).boundingBox();
    expect(box!.height, testId).toBeLessThan(48);
  }
  await page.getByTestId("nav-consent").click();
  await expect(page.getByTestId("page-title")).toHaveText("Notice and consent");

  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByTestId("menu-open").click();
  for (const [testId, , name] of REGISTER_NAMES) await expect(page.getByTestId(testId)).toHaveText(name);
  await page.getByTestId("nav-ai-risk").click();
  await expect(page.getByTestId("page-title")).toHaveText("AI risk register");
});
