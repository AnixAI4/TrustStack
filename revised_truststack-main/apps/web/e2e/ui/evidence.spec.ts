/**
 * Slice 4 — GATE 6: the keystone in the browser. A consultant answers G1.2
 * claiming 5 and attaches a file; a DIFFERENT reviewer accepts it, then
 * downgrades it to E0; the GOV tile moves each time.
 *
 * Works on its own assessment ("E2E evidence UI …"), created through the API
 * and removed afterwards — never MU's seeded baseline (specs share one DB).
 */
import { expect, test, type Page } from "@playwright/test";
import { accessTokenFor, bearer, removeEvidence, SEED_ORGS, SEED_USERS, seedPassword, withDb } from "../helpers";

const MU = SEED_ORGS.mumbaiUniversity;
const NAME_PREFIX = "E2E evidence UI";
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
    (await db.query<{ evidence_id: string }>(
      `SELECT l.evidence_id FROM public.evidence_links l
       JOIN public.assessment_responses r ON r.id = l.linked_entity_id
       JOIN public.assessments a ON a.id = r.assessment_id
       WHERE a.name LIKE $1`,
      [`${NAME_PREFIX}%`],
    )).rows.map((r) => r.evidence_id),
  );
  await removeEvidence(MU.id, evidenceIds);
  await withDb((db) => db.query("DELETE FROM public.assessments WHERE name LIKE $1", [`${NAME_PREFIX}%`]));
});

async function signIn(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(seedPassword());
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

const tile = (page: Page) => page.getByTestId("score-tile-GOV-value");

test("a consultant answers and attaches; a reviewer downgrades; the tile changes", async ({ page }) => {
  // --- The consultant answers, claiming 5, and attaches evidence -------------
  await signIn(page, SEED_USERS.consultant.email);
  await page.goto(`/dashboard/assessments/${assessmentId}`);
  // Slice 10.5 B0: the page is in tabs — Questions (first) and Score; both stay mounted.
  await page.getByTestId("tab-score").click();
  await expect(page.getByTestId("score-tile-GOV")).toBeVisible();
  await expect(tile(page)).toHaveText("—");
  // Slice 10.5 B2 (F2.1): the status in words, never the code.
  await expect(page.getByTestId("assessment-status")).toHaveText("Draft");

  await page.getByTestId("tab-questions").click();
  await page.getByTestId("claim-G1.2").selectOption("5");
  await page.getByTestId("save-answer-G1.2").click();

  // Nothing reviewed: scored as E0, and the page says so — in words, the code kept in the tooltip (F2.3).
  await expect(page.getByTestId("adjusted-value-G1.2")).toHaveText("1");
  await expect(page.getByTestId("cap-note-G1.2")).toHaveText(
    "No reviewed evidence yet (evidence level 0 of 5) — this answer counts at most 1",
  );
  await expect(page.getByTestId("cap-note-G1.2")).toHaveAttribute("title", "Evidence E0");
  await expect(tile(page)).toHaveText("1.40");
  await expect(page.getByTestId("assessment-status")).toHaveText("In progress");

  await page.getByTestId("evidence-file-G1.2").setInputFiles({
    name: "office-order.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("Office order nominating the DPDP Programme Owner (e2e UI test artefact)"),
  });
  await page.getByTestId("attach-G1.2").click();
  const answer = page.getByTestId("answer-G1.2");
  await expect(answer).toContainText("office-order.txt");
  await expect(answer).toContainText("Awaiting review");
  // The consultant holds evidence.review — but not over their own upload.
  await expect(answer).toContainText("another reviewer must review it");
  await expect(answer.locator('[data-testid^="save-review-"]')).toHaveCount(0);

  await page.getByTestId("user-menu").click();
  await page.getByRole("menuitem", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/login/);

  // --- A different reviewer accepts it, then downgrades it to E0 -------------
  await signIn(page, SEED_USERS.mumbaiUniversity.email);
  await page.goto(`/dashboard/assessments/${assessmentId}`);
  await expect(tile(page)).toHaveText("1.40");

  const status = page.getByTestId("answer-G1.2").locator('[data-testid^="review-status-"]');
  const level = page.getByTestId("answer-G1.2").locator('[data-testid^="review-level-"]');
  const save = page.getByTestId("answer-G1.2").locator('[data-testid^="save-review-"]');

  await status.selectOption("strong");
  await level.selectOption("5");
  await save.click();
  await expect(page.getByTestId("adjusted-value-G1.2")).toHaveText("5");
  await expect(page.getByTestId("cap-note-G1.2")).toHaveCount(0);
  await expect(tile(page)).toHaveText("7.00");
  await expect(page.getByTestId("score-tile-GOV-confidence")).toHaveText("100%");

  // THE KEYSTONE: claimed 5, evidence downgraded to E0 → adjusted 1, tile drops.
  await status.selectOption("rejected");
  await expect(level).toHaveValue("0");
  await save.click();
  await expect(page.getByTestId("claimed-G1.2")).toHaveText("5");
  await expect(page.getByTestId("adjusted-value-G1.2")).toHaveText("1");
  // Rejected is a review: level 0, which counts at most 1 — and the page names the review.
  await expect(page.getByTestId("cap-note-G1.2")).toHaveText(
    "Reviewed: Rejected (evidence level 0 of 5) — this answer counts at most 1",
  );
  await expect(tile(page)).toHaveText("1.40");
  await expect(page.getByTestId("score-tile-GOV-confidence")).toHaveText("0%");
});

test("a Not Applicable answer needs a reason, and a mandatory question does not offer it", async ({ page }) => {
  await signIn(page, SEED_USERS.consultant.email);
  await page.goto(`/dashboard/assessments/${assessmentId}`);
  // allTextContents() does not wait — assert the control is there first, or an
  // unloaded page passes vacuously.
  const claim = page.getByTestId("claim-G1.1");
  await expect(claim).toBeVisible();
  const options = await claim.locator("option").allTextContents();
  // Slice 10.5 B2 (F2.2): each level in words, from the spec's answer scale.
  expect(options).toContain("5 — Operational and monitored");
  expect(options).toContain("2 — Draft or partial");
  // G1.1 is mandatory: it may not be excluded (D-041).
  expect(options).not.toContain("Not Applicable");
  // UNI-GOV-009 is conditional: it may, with a reason.
  await expect(page.getByTestId("claim-UNI-GOV-009").locator("option", { hasText: "Not Applicable" })).toHaveCount(1);
});

// Slice 5 replaced the overview's single GOV tile with the overall score; the
// GOV tile itself moved to the assessment page, beside the scorecard.
test("the overview shows the overall score for the organisation's assessment in progress", async ({ page }) => {
  await signIn(page, SEED_USERS.muDean.email);
  await expect(page.getByTestId("overview-score")).toBeVisible();
  await expect(page.getByTestId("overview-score")).toContainText("DPDP Compass Readiness Score");
  // A read-only sponsor sees the score but no answer controls anywhere.
  await page.goto(`/dashboard/assessments/${assessmentId}`);
  await expect(page.getByTestId("answer-G1.2")).toBeVisible();
  await expect(page.getByTestId("claim-G1.2")).toHaveCount(0);
  await expect(page.getByTestId("attach-G1.2")).toHaveCount(0);
});

test("Bharat Manufacturing has no assessment, so its overview shows no score", async ({ page }) => {
  await signIn(page, SEED_USERS.bmlAdmin.email);
  await expect(page.getByTestId("organization-name")).toHaveText(SEED_ORGS.bharatManufacturing.name);
  await expect(page.getByTestId("overview-score")).toHaveCount(0);
});
