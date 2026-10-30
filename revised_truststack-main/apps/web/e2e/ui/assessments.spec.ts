/**
 * Slice 3 — GATE 6: the bank browser and the assessment views on real data.
 *
 * The generation journey creates its own assessment named "E2E UI …" and
 * removes it afterwards; Mumbai University's seeded baseline is read, never
 * written (these specs share one database).
 */
import { expect, test, type Page } from "@playwright/test";
import { SEED_ASSESSMENTS, SEED_ORGS, SEED_USERS, seedPassword, withDb } from "../helpers";

const MU_BASELINE = SEED_ASSESSMENTS.muBaseline.id;

test.afterAll(async () => {
  await withDb((db) => db.query("DELETE FROM public.assessments WHERE name LIKE 'E2E UI %'"));
});

async function signIn(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(seedPassword());
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

test("the question bank browser shows the 16 domains, the packs, and a pack's questions", async ({ page }) => {
  await signIn(page, SEED_USERS.consultant.email);
  await page.getByTestId("nav-questions").click();
  await expect(page).toHaveURL(/\/dashboard\/questions$/);

  // The 100-point model, from the server.
  await expect(page.getByTestId("weight-total")).toHaveText("100");
  await expect(page.getByTestId("domain-list").getByRole("listitem")).toHaveCount(16);
  await expect(page.getByTestId("domain-list")).toContainText("Security safeguards");

  // Every pack, including the ones not approved for generation.
  await expect(page.getByTestId("pack-list").getByRole("listitem")).toHaveCount(20);
  await expect(page.getByTestId("pack-CORE_DPDP_V1")).toBeVisible();
  await expect(page.getByTestId("pack-EDTECH_OVERLAY_V1")).toBeVisible();

  // The confirmed 10, grouped by domain, each labelled.
  await page.getByTestId("pack-UNIVERSITY_HIGHER_ED_V1").click();
  const questions = page.getByTestId("pack-questions");
  await expect(questions).toBeVisible();
  await expect(page.getByTestId("question-UNI-SEC-002")).toContainText("maker-checker");
  await expect(page.getByTestId("question-UNI-ACC-001")).toContainText("Priority P0");
  // A condition the wizard cannot decide is shown as Potentially Applicable.
  await expect(page.getByTestId("question-UNI-INV-004")).toContainText("Potentially Applicable");
  // Nothing is invented: the legal basis is still pending counsel review.
  await expect(page.getByTestId("question-UNI-SEC-002")).toContainText("pending counsel review");

  // A pack with no authored questions says so rather than showing nothing.
  await page.getByTestId("pack-CHILDREN_DATA_V1").click();
  await expect(page.getByTestId("pack-empty")).toBeVisible();
});

test("the SaaS pack shows an absent priority as a dash, never as a guess", async ({ page }) => {
  await signIn(page, SEED_USERS.consultant.email);
  await page.goto("/dashboard/questions");
  await page.getByTestId("pack-SAAS_TECH_OVERLAY_V1").click();
  await expect(page.getByTestId("pack-questions")).toBeVisible();
  await expect(page.getByTestId("pack-questions").getByText("Priority —").first()).toBeVisible();
});

test("MU's seeded baseline lists 124 questions in 16 domain groups, each with its reason", async ({ page }) => {
  await signIn(page, SEED_USERS.consultant.email);
  await page.getByTestId("nav-assessments").click();
  await expect(page).toHaveURL(/\/dashboard\/assessments$/);

  await expect(page.getByTestId(`assessment-${MU_BASELINE}`)).toContainText("Mumbai University DPDP Compass Baseline");
  await page.getByTestId(`assessment-${MU_BASELINE}`).click();
  await expect(page).toHaveURL(new RegExp(`/dashboard/assessments/${MU_BASELINE}$`));

  await expect(page.getByTestId("question-count")).toHaveText("124");
  await expect(page.getByTestId("domain-summary").getByRole("listitem")).toHaveCount(16);

  // All 16 domains are offered, in report order — one at a time since Slice
  // 10.5 B2 (N2): a pill each, the first one open, every panel rendered.
  const order = [
    "GOV", "INV", "ROPA", "PURPOSE", "NOTICE", "CONSENT", "RIGHTS", "GRIEVANCE",
    "RETENTION", "ACCURACY", "SECURITY", "BREACH", "VENDOR", "CHILD", "CROSSBORDER", "SDF_AI",
  ];
  for (const domain of order) {
    await expect(page.getByTestId(`tab-${domain}`)).toBeVisible();
    await expect(page.getByTestId(`domain-group-${domain}`)).toBeAttached();
  }
  await expect(page.getByTestId("domain-group-GOV")).toBeVisible();
  await expect(page.getByTestId("domain-group-SECURITY")).toBeHidden();

  // Each question says why it is in the set (every panel is rendered, so a hidden one still reads).
  await expect(page.getByTestId("aq-G1.2")).toContainText("Core pack");
  await expect(page.getByTestId("aq-UNI-SEC-002")).toContainText("Industry overlay");
  await expect(page.getByTestId("aq-UNI-AI-003")).toContainText("Triggered by aiUsageTypes contains proctoring");
  // The vendor questions are in because MU declared processors (D-037), so the
  // reason names the answer as well as the register.
  await expect(page.getByTestId("aq-V1.1")).toContainText("Triggered by");
  await expect(page.getByTestId("aq-V1.1")).toContainText("answers.usesDataProcessors");

  // A Potentially Applicable question tells the assessor what to do with it.
  const pa = page.getByTestId("aq-UNI-INV-004");
  await expect(pa).toContainText("Potentially Applicable");
  await expect(pa).toContainText("mark it Not Applicable with a reason");
});

test("a consultant generates an MU assessment from the wizard's last step", async ({ page }) => {
  await signIn(page, SEED_USERS.consultant.email);
  await page.getByTestId("nav-scope").click();

  // Step 7 — the scope is already saved, so generation is offered.
  await page.getByTestId("step-7").click();
  await expect(page.getByTestId("preview-packs")).toContainText("UNIVERSITY_HIGHER_ED_V1");
  await expect(page.getByTestId("generate-blocked")).toHaveCount(0);

  const name = `E2E UI Baseline ${Date.now()}`;
  await page.getByTestId("assessment-name").fill(name);
  await page.getByTestId("generate-assessment").click();

  // Straight to the new assessment, with its question set already snapshotted.
  await expect(page).toHaveURL(/\/dashboard\/assessments\/[0-9a-f-]{36}$/);
  await expect(page.getByTestId("question-count")).toHaveText("124");
  await expect(page.getByTestId("domain-summary").getByRole("listitem")).toHaveCount(16);
  await page.getByTestId("tab-SECURITY").click();
  await expect(page.getByTestId("domain-group-SECURITY")).toBeVisible();

  // And it appears in the list.
  await page.getByTestId("nav-assessments").click();
  await expect(page.getByTestId("assessment-list")).toContainText(name);
});

test("a Department Owner sees the assessment but is offered no Generate button", async ({ page }) => {
  await signIn(page, SEED_USERS.muDepartmentOwner.email);

  await page.goto("/dashboard/assessments");
  await expect(page.getByTestId(`assessment-${MU_BASELINE}`)).toBeVisible();

  await page.goto("/dashboard/scope");
  await page.getByTestId("step-7").click();
  await expect(page.getByTestId("preview-tags")).toBeVisible();
  // Pack codes are Anix's view (D-071): the API never sends them to a client role.
  await expect(page.getByTestId("preview-packs")).toHaveCount(0);
  // <Can permission="assessment.write"> hides it; the API refuses it regardless.
  await expect(page.getByTestId("generate-assessment")).toHaveCount(0);
});

test("Bharat Manufacturing shows the empty state, not an error", async ({ page }) => {
  await signIn(page, SEED_USERS.bmlAdmin.email);
  await expect(page.getByTestId("organization-name")).toHaveText(SEED_ORGS.bharatManufacturing.name);

  await page.getByTestId("nav-assessments").click();
  await expect(page.getByTestId("assessments-empty")).toContainText("No assessments yet");
  await expect(page.getByTestId("assessments-error")).toHaveCount(0);
});

// --- Slice 10.5 Batch B2 — assessment, evidence and gaps --------------------

test("the assessments list speaks in words: a status label, a calendar date, progress, one Open", async ({ page }) => {
  await signIn(page, SEED_USERS.mumbaiUniversity.email);
  await page.goto("/dashboard/assessments");
  await expect(page.getByTestId(`assessment-status-${MU_BASELINE}`)).toHaveText("In progress");
  await expect(page.getByTestId(`assessment-generated-${MU_BASELINE}`)).toHaveText(/^\d{1,2} [A-Z][a-z]{2} \d{4}$/);
  await expect(page.getByTestId(`assessment-progress-${MU_BASELINE}`)).toHaveText(/^answered \d+ of 124$/, { timeout: 20_000 });
  await expect(page.getByTestId("assessment-list")).not.toContainText("in_progress");
  // N5: the list is a paged, searchable table.
  await page.getByTestId("assessment-list-search").fill("no such assessment");
  await expect(page.getByTestId("assessment-list")).toContainText("No assessments match");
  await page.getByTestId("assessment-list-search").fill("");
  await page.getByTestId(`open-assessment-${MU_BASELINE}`).click();
  await expect(page).toHaveURL(new RegExp(`/dashboard/assessments/${MU_BASELINE}$`));
});

test("the assessment page leads with progress: status in words, answered of total, what may not apply, a bar", async ({ page }) => {
  await signIn(page, SEED_USERS.mumbaiUniversity.email);
  await page.goto(`/dashboard/assessments/${MU_BASELINE}`);
  await expect(page.getByTestId("assessment-summary")).toHaveText(
    /^In progress · \d+ of 124 answered( · \d+ may not apply — confirm or answer them)?$/,
    { timeout: 20_000 },
  );
  await expect(page.getByTestId("assessment-progress")).toHaveAttribute("aria-valuemax", "124");
  // Each domain card counts its own.
  await expect(page.getByTestId("domain-progress-GOV")).toHaveText(/^answered \d+ of 8$/);
  // The scorecard on the Score tab says Not started for an untouched domain (Q3).
  await page.getByTestId("tab-score").click();
  await expect(page.getByTestId("scorecard").locator('[data-testid^="scorecard-state-"]', { hasText: /^Not started$/ }).first()).toBeVisible({
    timeout: 20_000,
  });
});

test("Unanswered only hides what is answered; the claim picker names each level", async ({ page }) => {
  await signIn(page, SEED_USERS.mumbaiUniversity.email);
  await page.goto(`/dashboard/assessments/${MU_BASELINE}`);
  // G1.2 is the seed's one answer.
  await expect(page.getByTestId("adjusted-G1.2")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId("claim-G1.1").locator("option", { hasText: "3 — Defined" })).toHaveCount(1);
  await page.getByTestId("questions-unanswered-only").check();
  await expect(page.getByTestId("aq-G1.2")).toHaveCount(0);
  await expect(page.getByTestId("aq-G1.1")).toBeVisible();
  await page.getByTestId("questions-unanswered-only").uncheck();
  await expect(page.getByTestId("aq-G1.2")).toBeVisible();
});

test("a Department Owner opens on the questions for their role, and can switch to all", async ({ page }) => {
  await signIn(page, SEED_USERS.muDepartmentOwner.email);
  await page.goto(`/dashboard/assessments/${MU_BASELINE}`);
  const mine = page.getByTestId("questions-mine");
  await expect(mine).toHaveAttribute("aria-pressed", "true", { timeout: 20_000 });
  await expect(page.getByTestId("questions-mine-note")).toContainText("A guide, not a limit");
  // G1.2's suggested owner is the Executive Sponsor / DPDP Owner — not a department's.
  await expect(page.getByTestId("aq-G1.2")).toHaveCount(0);
  await page.getByTestId("questions-all").click();
  await expect(page.getByTestId("questions-all")).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByTestId("aq-G1.2")).toBeVisible();
});

test("a programme role opens on every question", async ({ page }) => {
  await signIn(page, SEED_USERS.mumbaiUniversity.email);
  await page.goto(`/dashboard/assessments/${MU_BASELINE}`);
  await expect(page.getByTestId("aq-G1.2")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId("questions-mine-note")).toHaveCount(0);
});

test("the question bank says what it is for, and every count has its unit", async ({ page }) => {
  await signIn(page, SEED_USERS.consultant.email);
  await page.goto("/dashboard/questions");
  await expect(page.getByTestId("bank-purpose")).toContainText("for Anix consultants only");
  await expect(page.getByTestId("pack-count-UNIVERSITY_HIGHER_ED_V1")).toHaveText(/^\d+ questions$/);
  await expect(page.getByTestId("pack-list")).toContainText("Approved");
  await expect(page.getByTestId("pack-list")).not.toContainText("approved");
});
