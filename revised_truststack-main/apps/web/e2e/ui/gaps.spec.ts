/**
 * Slice 6 — GATE 6: the gap register in the browser. Generate it, filter it,
 * assign an owner, be refused a close on a promise, attach evidence, have a
 * second person review it, close — and watch the roadmap follow.
 *
 * Works on its own assessment ("E2E gap register UI …"), created through the
 * API and removed afterwards — never MU's seeded baseline (specs share one DB).
 */
import { expect, test, type Page } from "@playwright/test";
import { accessTokenFor, bearer, removeEvidence, SEED_ORGS, SEED_USERS, seedPassword, withDb } from "../helpers";

const MU = SEED_ORGS.mumbaiUniversity;
/** Its own prefix — a shared one lets another file's teardown delete this mid-run. */
const NAME_PREFIX = "E2E gap register UI";
/** A file name only this spec uses, so teardown finds its artefact whether or not it is still linked. */
const FILE_NAME = "gap-register-ui-proof.txt";
let assessmentId: string;

test.describe.configure({ mode: "serial" });

test.beforeAll(async ({ playwright }) => {
  const request = await playwright.request.newContext({ baseURL: test.info().project.use.baseURL });
  const headers = bearer(await accessTokenFor(SEED_USERS.consultant.email));
  const created = await request.post(`/api/v1/organizations/${MU.id}/assessments`, {
    headers,
    data: { name: `${NAME_PREFIX} ${Date.now()}` },
  });
  expect(created.status(), await created.text()).toBe(201);
  assessmentId = (await created.json()).data.assessment.id;

  // Two answers, nothing evidenced: a claim of 0 is Critical; a claim of 5
  // adjusts to 1 and is High.
  for (const [code, claim] of [
    ["G1.1", 0],
    ["G1.2", 5],
  ] as const) {
    const res = await request.put(`/api/v1/organizations/${MU.id}/assessments/${assessmentId}/responses/${code}`, {
      headers,
      data: { applicabilityDecision: "applicable", claimedMaturity: claim },
    });
    expect([200, 201], await res.text()).toContain(res.status());
  }
  await request.dispose();
});

test.afterAll(async () => {
  const evidenceIds = await withDb(async (db) =>
    (
      await db.query<{ id: string }>("SELECT id FROM public.evidence WHERE organization_id = $1 AND file_name = $2", [
        MU.id,
        FILE_NAME,
      ])
    ).rows.map((r) => r.id),
  );
  await removeEvidence(MU.id, evidenceIds);
  await withDb((db) => db.query("DELETE FROM public.assessments WHERE name LIKE $1", [`${NAME_PREFIX}%`]));
});

/** `/login` redirects an authenticated visitor away, so switching user means signing out first. */
async function signIn(page: Page, email: string) {
  await page.goto("/login");
  if (!page.url().includes("/login")) {
    await page.getByTestId("user-menu").click();
    await page.getByRole("menuitem", { name: "Sign out" }).click();
    await expect(page).toHaveURL(/\/login/);
  }
  await expect(page.getByLabel("Email")).toBeVisible();
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(seedPassword());
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

async function openRegister(page: Page) {
  await page.goto(`/dashboard/assessments/${assessmentId}/gaps`);
  await expect(page.getByTestId("gap-summary")).toBeVisible({ timeout: 20_000 });
}

const card = (page: Page, severity: string) => page.locator(`[data-testid^="gap-"][data-severity="${severity}"]`);

/** The action id inside a gap card, read off its own test id. */
async function actionIdIn(page: Page, severity: string): Promise<string> {
  const action = card(page, severity).locator('[data-testid^="action-status-"]').first();
  await expect(action).toBeVisible();
  return (await action.getAttribute("data-testid"))!.replace("action-status-", "");
}

test("generate the register, filter it, assign an owner — and be refused a close on a promise", async ({ page }) => {
  await signIn(page, SEED_USERS.consultant.email);

  // --- The way in is from the score panel ----------------------------------
  await page.goto(`/dashboard/assessments/${assessmentId}`);
  // Slice 10.5 B0: the score panel is the assessment page's Score tab.
  await page.getByTestId("tab-score").click();
  const link = page.getByTestId("gap-register-link");
  await expect(link).toBeVisible({ timeout: 20_000 });
  await expect(link).toContainText("not generated yet");
  await link.getByRole("link").click();
  await expect(page).toHaveURL(new RegExp(`/dashboard/assessments/${assessmentId}/gaps$`));

  // --- Nothing generated yet ------------------------------------------------
  await expect(page.getByTestId("gap-empty")).toContainText("No gap register has been generated");
  await expect(page.getByTestId("gap-count")).toHaveText("0");

  await page.getByTestId("generate-gaps").click();
  await expect(page.getByTestId("gap-count")).toHaveText("2");
  await expect(page.getByTestId("gap-count-critical")).toHaveText("1");
  await expect(page.getByTestId("gap-count-high")).toHaveText("1");
  await expect(page.getByTestId("gap-closed-count")).toHaveText("0 of 2");
  await expect(page.getByTestId("gap-stale")).toHaveCount(0);

  // --- Plain language (D-040) -----------------------------------------------
  const list = page.getByTestId("gap-list");
  await expect(list.locator('[data-testid^="gap-severity-"]')).toHaveText(["Critical", "High"]);
  await expect(card(page, "critical")).toContainText("Governance");
  await expect(card(page, "critical")).toContainText("Priority P0 · within 30 days");
  await expect(card(page, "high")).toContainText("Priority P1 · within 60 days");
  await expect(card(page, "critical")).toContainText("scored 0 of 5");
  // The question is shown; its code, its pack and its version are not.
  await expect(list).not.toContainText("G1.1");
  await expect(list).not.toContainText("G1.2");
  await expect(list).not.toContainText("CORE_DPDP");

  // --- Filters --------------------------------------------------------------
  await page.getByTestId("gap-filter-severity").selectOption("high");
  await expect(page.getByTestId("gap-shown-count")).toHaveText("Showing 1 of 2");
  await expect(card(page, "critical")).toHaveCount(0);
  await page.getByTestId("gap-filter-severity").selectOption("");
  await page.getByTestId("gap-filter-status").selectOption("closed");
  await expect(page.getByTestId("gap-shown-count")).toHaveText("Showing 0 of 2");
  await page.getByTestId("gap-filter-status").selectOption("");
  await page.getByTestId("gap-filter-owner").selectOption("__unassigned__");
  await expect(page.getByTestId("gap-shown-count")).toHaveText("Showing 2 of 2");
  await page.getByTestId("gap-filter-owner").selectOption("");

  // --- Assign ---------------------------------------------------------------
  const actionId = await actionIdIn(page, "critical");
  await expect(page.getByTestId(`action-owner-${actionId}`)).toContainText("Unassigned");
  await page.getByTestId(`action-owner-select-${actionId}`).selectOption(SEED_USERS.consultant.id);
  await page.getByTestId(`action-status-select-${actionId}`).selectOption("in_progress");
  await page.getByTestId(`action-notes-${actionId}`).fill("Role mapping workshop booked with the Registrar.");
  await page.getByTestId(`save-action-${actionId}`).click();
  await expect(page.getByTestId(`action-owner-${actionId}`)).toContainText(SEED_USERS.consultant.fullName);
  await expect(page.getByTestId(`action-status-${actionId}`)).toHaveText("In Progress");

  // --- Slice 10.5 B2 (F2.5): a paged, searchable table — find a gap by its owner
  await page.getByTestId("gap-list-search").fill(SEED_USERS.consultant.fullName);
  await expect(page.getByTestId("gap-list").locator('[data-testid^="gap-severity-"]')).toHaveText(["Critical"]);
  await page.getByTestId("gap-list-search").fill("no-such-gap-anywhere");
  await expect(page.getByTestId("gap-list")).toContainText("No gaps match");
  // The search never matches a question code (D-040).
  await page.getByTestId("gap-list-search").fill("G1.1");
  await expect(page.getByTestId("gap-list")).toContainText("No gaps match");
  await page.getByTestId("gap-list-search").fill("");
  await expect(page.getByTestId("gap-list").locator('[data-testid^="gap-severity-"]')).toHaveCount(2);

  // The status menu offers only the moves the workflow allows.
  await expect(page.getByTestId(`action-status-select-${actionId}`).locator("option")).toHaveText([
    "In Progress",
    "Open",
    "Blocked",
    "Closed",
  ]);

  // --- Closing on a promise is refused, with the reason ---------------------
  await page.getByTestId(`action-status-select-${actionId}`).selectOption("closed");
  await page.getByTestId(`save-action-${actionId}`).click();
  await expect(page.getByTestId(`action-error-${actionId}`)).toContainText("Closing needs reviewed evidence");
  await expect(page.getByTestId(`action-status-${actionId}`)).toHaveText("In Progress");

  // --- Attach evidence to the ACTION ----------------------------------------
  await page.getByTestId(`action-evidence-file-${actionId}`).setInputFiles({
    name: FILE_NAME,
    mimeType: "text/plain",
    buffer: Buffer.from("Role mapping: Data Fiduciary for admissions, Data Processor for the consortium. (e2e artefact)"),
  });
  await page.getByTestId(`attach-action-evidence-${actionId}`).click();
  await expect(page.getByTestId(`action-attach-error-${actionId}`)).toHaveCount(0);
  await expect(
    page.getByTestId(`action-${actionId}`).locator('[data-testid^="action-evidence-status-"]').first(),
  ).toContainText("Awaiting review", { timeout: 15_000 });
  // The uploader cannot review their own file (D-043).
  await expect(page.getByTestId(`action-${actionId}`)).toContainText("another reviewer must review it");

  // --- The roadmap ----------------------------------------------------------
  await page.getByTestId("gap-view-roadmap").click();
  await expect(page.getByTestId("roadmap")).toBeVisible();
  await expect(page.getByTestId("roadmap-count-days_30")).toHaveText("1 action");
  await expect(page.getByTestId("roadmap-days_30-critical")).toHaveText("1 Critical");
  await expect(page.getByTestId("roadmap-count-days_60")).toHaveText("1 action");
  await expect(page.getByTestId("roadmap-days_60-high")).toHaveText("1 High");
  // Grouped by owner: one assigned, one not.
  await expect(page.getByTestId("roadmap-days_30")).toContainText(SEED_USERS.consultant.fullName);
  await expect(page.getByTestId("roadmap-days_60")).toContainText("Unassigned");
  await expect(page.getByTestId("roadmap-overdue")).toHaveCount(0);
});

test("a second person reviews the evidence, and the action closes on it", async ({ page }) => {
  // The Registrar is the DPDP Programme Owner: holds evidence.review, and did not upload the file.
  await signIn(page, SEED_USERS.mumbaiUniversity.email);
  await openRegister(page);

  const actionId = await actionIdIn(page, "critical");
  const action = page.getByTestId(`action-${actionId}`);
  const reviewSelect = action.locator('[data-testid^="review-status-"]').first();
  const evidenceId = (await reviewSelect.getAttribute("data-testid"))!.replace("review-status-", "");
  await page.getByTestId(`review-status-${evidenceId}`).selectOption("strong");
  await page.getByTestId(`review-level-${evidenceId}`).selectOption("5");
  await page.getByTestId(`save-review-${evidenceId}`).click();
  await expect(page.getByTestId(`action-evidence-status-${evidenceId}`)).toHaveText("Strong");

  // Strong evidence on the ACTION does not move the ANSWER: still 0 of 5, still Critical.
  await expect(card(page, "critical")).toContainText("scored 0 of 5");
  await expect(page.getByTestId("gap-stale")).toHaveCount(0);

  await page.getByTestId(`action-status-select-${actionId}`).selectOption("closed");
  await page.getByTestId(`save-action-${actionId}`).click();
  await expect(page.getByTestId(`action-status-${actionId}`)).toHaveText("Closed");
  await expect(page.getByTestId(`action-closure-${actionId}`)).toContainText("on reviewed evidence");
  await expect(page.getByTestId(`action-closure-${actionId}`)).toContainText(SEED_USERS.mumbaiUniversity.fullName);
  await expect(page.getByTestId("gap-closed-count")).toHaveText("1 of 2");

  // Closed is read-only: no edit form, no Detach — only Reopen.
  await expect(page.getByTestId(`save-action-${actionId}`)).toHaveCount(0);
  await expect(page.getByTestId(`detach-action-evidence-${evidenceId}`)).toHaveCount(0);
  await expect(page.getByTestId(`reopen-action-${actionId}`)).toBeVisible();

  // The closed action leaves the roadmap.
  await page.getByTestId("gap-view-roadmap").click();
  await expect(page.getByTestId("roadmap-count-days_30")).toHaveText("0 actions");
  await expect(page.getByTestId("roadmap-count-days_60")).toHaveText("1 action");

  // And the score panel on the assessment page counts the gaps.
  await page.goto(`/dashboard/assessments/${assessmentId}`);
  await page.getByTestId("tab-score").click();
  await expect(page.getByTestId("gap-link-count")).toHaveText("2", { timeout: 20_000 });
  await expect(page.getByTestId("gap-link-critical")).toHaveText("1");
  // Red flags and gaps are shown side by side, never merged.
  await expect(page.getByTestId("red-flags")).toBeVisible();
});

test("a role without gap.write reads the register and can change nothing", async ({ page }) => {
  // The Dean is an executive sponsor: read-only on the work itself.
  await signIn(page, SEED_USERS.muDean.email);
  await openRegister(page);

  await expect(page.getByTestId("gap-count")).toHaveText("2");
  await expect(page.getByTestId("gap-list").locator('[data-testid^="gap-severity-"]')).toHaveCount(2);
  await expect(page.getByTestId("generate-gaps")).toHaveCount(0);
  await expect(page.locator('[data-testid^="save-action-"]')).toHaveCount(0);
  await expect(page.locator('[data-testid^="reopen-action-"]')).toHaveCount(0);
  await expect(page.locator('[data-testid^="attach-action-evidence-"]')).toHaveCount(0);
});
