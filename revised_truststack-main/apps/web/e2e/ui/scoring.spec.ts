/**
 * Slice 5 — GATE 6: the whole score in the browser. The overall panel, the
 * sixteen-row scorecard, a red flag named in plain language, detaching
 * evidence, and Finalise — which stays disabled until nothing is outstanding.
 *
 * Works on its own assessment ("E2E scoring UI …"), created through the API
 * and removed afterwards — never MU's seeded baseline (specs share one DB).
 */
import { expect, test, type Page } from "@playwright/test";
import { accessTokenFor, bearer, removeEvidence, SEED_ORGS, SEED_USERS, seedPassword, withDb } from "../helpers";

const MU = SEED_ORGS.mumbaiUniversity;
/** Its own prefix — a shared one lets another file's teardown delete this mid-run. */
const NAME_PREFIX = "E2E scoring UI";
/**
 * A file name only this spec uses. Teardown CANNOT find its artefacts through
 * `evidence_links` the way Slice 4's does: this spec detaches one, and an
 * artefact with no link would then be invisible to cleanup and leak forever
 * (nobody can delete evidence — D-042 — so only teardown ever removes it).
 */
const FILE_NAME = "scoring-ui-office-order.txt";
let assessmentId: string;

test.describe.configure({ mode: "serial" });

test.beforeAll(async ({ playwright }) => {
  const request = await playwright.request.newContext({ baseURL: test.info().project.use.baseURL });
  const res = await request.post(`/api/v1/organizations/${MU.id}/assessments`, {
    headers: bearer(await accessTokenFor(SEED_USERS.consultant.email)),
    data: { name: `${NAME_PREFIX} ${Date.now()}` },
  });
  expect(res.status(), await res.text()).toBe(201);
  assessmentId = (await res.json()).data.assessment.id;
  await request.dispose();
});

test.afterAll(async () => {
  const evidenceIds = await withDb(async (db) =>
    (
      await db.query<{ id: string }>(
        "SELECT id FROM public.evidence WHERE organization_id = $1 AND file_name = $2",
        [MU.id, FILE_NAME],
      )
    ).rows.map((r) => r.id),
  );
  await removeEvidence(MU.id, evidenceIds);
  await withDb((db) => db.query("DELETE FROM public.assessments WHERE name LIKE $1", [`${NAME_PREFIX}%`]));
});

/**
 * The middleware sends an authenticated visitor away from `/login`, so
 * switching user means signing out first. Whether that is needed is decided by
 * where `goto` actually landed — probing for the Sign out button races the
 * dashboard's own render, which is how this flaked.
 */
/**
 * Open the assessment and wait until it is actually usable.
 *
 * Slice 5 opened answering on every domain, so this page now renders an answer
 * panel for all 124 questions, plus the score panel, the scorecard and the
 * question list — far heavier than Slice 4's eight GOV panels. Asserting
 * against it without waiting for a known anchor races the first paint, which
 * is how three of these tests flaked.
 */
async function openAssessment(page: Page, anchor = "answer-G1.2") {
  await page.goto(`/dashboard/assessments/${assessmentId}`);
  // Slice 10.5 B0: Questions and Score are tabs; both stay mounted, Questions shows first.
  await expect(page.getByTestId("overall-score")).toBeAttached({ timeout: 20_000 });
  await expect(page.getByTestId(anchor)).toBeVisible({ timeout: 20_000 });
}

/** The assessment page's two tabs (Slice 10.5 B0). */
async function showTab(page: Page, tab: "questions" | "score") {
  await page.getByTestId(`tab-${tab}`).click();
}

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

test("the overall panel, the scorecard, answering any domain, and a named red flag", async ({ page }) => {
  await signIn(page, SEED_USERS.consultant.email);
  await openAssessment(page);

  // --- Nothing answered yet -------------------------------------------------
  await showTab(page, "score");
  await expect(page.getByTestId("overall-score-value")).toHaveText("0.00");
  await expect(page.getByTestId("score-provisional")).toBeVisible();
  await expect(page.getByTestId("coverage-line")).toContainText("Assessed Weight Coverage");

  // All sixteen domains, including any that are empty.
  await expect(page.getByTestId("scorecard")).toBeVisible();
  await expect(page.locator('[data-testid^="scorecard-row-"]')).toHaveCount(16);
  await expect(page.getByTestId("scorecard-row-GOV")).toContainText("Governance");
  await expect(page.getByTestId("scorecard-score-GOV")).toHaveText("—");

  // --- Answering outside GOV: Slice 4 rendered a panel for GOV only ---------
  await showTab(page, "questions");
  const securityGroup = page.getByTestId("domain-group-SECURITY");
  // One domain at a time since Slice 10.5 B2 (N2): choose it from its card.
  await page.getByTestId("domain-toggle-SECURITY").click();
  await expect(securityGroup).toBeVisible();
  const firstCode = await securityGroup.locator('[data-testid^="claim-"]').first().getAttribute("data-testid");
  expect(firstCode, "no answer panel outside GOV").toBeTruthy();
  const code = firstCode!.replace("claim-", "");

  await page.getByTestId(`claim-${code}`).selectOption("4");
  await page.getByTestId(`save-answer-${code}`).click();

  // Unevidenced, so it is capped at 1 and the page names the cap.
  await expect(page.getByTestId(`adjusted-value-${code}`)).toHaveText("1");
  await expect(page.getByTestId(`cap-note-${code}`)).toContainText("evidence level 0 of 5) — this answer counts at most 1");
  await expect(page.getByTestId("scorecard-score-SECURITY")).not.toHaveText("—");
  await expect(page.getByTestId("overall-high")).not.toHaveText("0");

  // --- A red flag, in plain language ---------------------------------------
  // G1.2 is the keystone AND a red flag: claim 5 with nothing reviewed
  // adjusts to 1, which caps the whole assessment at 60.
  await page.getByTestId("domain-toggle-GOV").click();
  await page.getByTestId("claim-G1.2").selectOption("5");
  await page.getByTestId("save-answer-G1.2").click();
  await expect(page.getByTestId("adjusted-value-G1.2")).toHaveText("1");

  await showTab(page, "score");
  const flag = page.getByTestId("red-flag-no_evidenced_dpdp_owner");
  await expect(flag).toBeVisible();
  await expect(flag).toContainText("No evidenced DPDP owner");
  await expect(page.getByTestId("red-flags")).toContainText("capped at");
  // No question codes, no pack codes — the client sees plain language (D-040).
  await expect(flag).not.toContainText("G1.2");
});

test("evidence can be detached, and the score falls back with it", async ({ page }) => {
  // Attaching needs one person and reviewing another (D-043).
  await signIn(page, SEED_USERS.consultant.email);
  await openAssessment(page);
  // G1.2 was answered at 5 by the test above, unevidenced → adjusted 1.
  await expect(page.getByTestId("adjusted-value-G1.2")).toHaveText("1");

  await page.getByTestId("evidence-file-G1.2").setInputFiles({
    name: FILE_NAME,
    mimeType: "text/plain",
    buffer: Buffer.from("Office order: the Registrar is the DPDP Programme Owner. (e2e artefact)"),
  });
  await page.getByTestId("attach-G1.2").click();
  const answer = page.getByTestId("answer-G1.2");
  // If the upload failed, say why rather than timing out on a missing row.
  await expect(answer.getByTestId("attach-error-G1.2")).toHaveCount(0);
  await expect(answer.locator('[data-testid^="evidence-status-"]').first()).toContainText("Awaiting review", {
    timeout: 15_000,
  });

  // The Registrar reviews it as strong — the claim of 5 now stands.
  await signIn(page, SEED_USERS.mumbaiUniversity.email);
  await openAssessment(page);
  const evidenceRow = page.getByTestId("answer-G1.2").locator('[data-testid^="review-status-"]').first();
  const evidenceId = (await evidenceRow.getAttribute("data-testid"))!.replace("review-status-", "");
  await page.getByTestId(`review-status-${evidenceId}`).selectOption("strong");
  await page.getByTestId(`review-level-${evidenceId}`).selectOption("5");
  await page.getByTestId(`save-review-${evidenceId}`).click();
  await expect(page.getByTestId("adjusted-value-G1.2")).toHaveText("5");
  // With the owner evidenced, that red flag stops firing.
  await expect(page.getByTestId("red-flag-no_evidenced_dpdp_owner")).toHaveCount(0);

  // Detach it: the answer falls straight back to unevidenced.
  await page.getByTestId(`detach-evidence-${evidenceId}`).click();
  await expect(page.getByTestId("adjusted-value-G1.2")).toHaveText("1");
  await expect(page.getByTestId("cap-note-G1.2")).toContainText("No reviewed evidence yet (evidence level 0 of 5)");
  await showTab(page, "score");
  await expect(page.getByTestId("red-flag-no_evidenced_dpdp_owner")).toBeVisible();

  // The Registrar is the DPDP Programme Owner, so it holds assessment.finalise
  // — and cannot use it while 100-odd questions are unanswered (D-041).
  const finaliseButton = page.getByTestId("finalise-assessment");
  await expect(finaliseButton).toBeVisible();
  await expect(finaliseButton).toBeDisabled();
  await expect(page.getByTestId("finalise-hint")).toContainText("still outstanding");
});

test("a role without assessment.finalise never sees the button", async ({ page }) => {
  // The Dean is an executive sponsor: read-only on the work itself.
  await signIn(page, SEED_USERS.muDean.email);
  await page.goto(`/dashboard/assessments/${assessmentId}`);
  await page.getByTestId("tab-score").click();
  await expect(page.getByTestId("overall-score")).toBeVisible({ timeout: 20_000 });

  await expect(page.getByTestId("finalise-assessment")).toHaveCount(0);
  // Read-only all the way down: no answer form either.
  await expect(page.getByTestId("claim-G1.2")).toHaveCount(0);
});

test("the overview shows the overall score, not one domain", async ({ page }) => {
  await signIn(page, SEED_USERS.consultant.email);
  await page.goto("/dashboard");

  await expect(page.getByTestId("overview-score")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId("overview-score-value")).toBeVisible();
  await expect(page.getByTestId("overview-score")).toContainText("DPDP Compass Readiness Score");
});
