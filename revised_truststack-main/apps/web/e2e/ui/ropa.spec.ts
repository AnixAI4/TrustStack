/**
 * Slice 7 — GATE 6: the Processing Activity Register in the browser. Read the
 * seeded register, create a record through the form and watch its areas
 * complete, submit it, have a SECOND person approve it, import a spreadsheet
 * with bad rows, and generate the register's gaps.
 *
 * Works on records this file creates ("E2E ROPA UI …"), removed afterwards —
 * specs share one database, so nothing here edits a seeded record.
 */
import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import { SEED_USERS, seedPassword, withDb } from "../helpers";

/** Its own prefix — a shared one lets another file's teardown delete this mid-run. */
const NAME_PREFIX = "E2E ROPA UI";
const RUN = Date.now().toString(36);

test.describe.configure({ mode: "serial" });

test.afterAll(async () => {
  await withDb((db) => db.query("DELETE FROM public.ropa_records WHERE name LIKE 'E2E ROPA UI%'"));
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

let recordUrl: string;

test("the register reads in plain language, shows the seeded records, and never says 'compliant'", async ({ page }) => {
  await signIn(page, SEED_USERS.mumbaiUniversity.email);
  await page.getByTestId("nav-ropa").click();
  await expect(page.getByTestId("ropa-summary")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId("ropa-positioning")).toContainText("not a statutory record");
  await expect(page.getByTestId("ropa-row-ROPA-001")).toContainText("Online admission application");
  await expect(page.getByTestId("ropa-score-ROPA-001")).toHaveText("70");
  await expect(page.getByTestId("ropa-risk-ROPA-002")).toHaveText("Critical");
  await expect(page.locator("body")).not.toContainText(/compliant/i);

  // Slice 10.5 B3 (F3.3): one primary action; Import, Export, Ask and Gaps under More.
  await expect(page.getByTestId("ropa-new")).toBeVisible();
  await expect(page.getByTestId("ropa-lookup-link")).toBeHidden();
  await page.getByTestId("ropa-more-toggle").click();
  for (const id of ["ropa-import-link", "ropa-export", "ropa-lookup-link", "ropa-gaps-link"]) await expect(page.getByTestId(id)).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByTestId("ropa-lookup-link")).toBeHidden();
  // F3.1: the menu says what the top bar says.
  await expect(page.getByTestId("nav-ropa")).toContainText("Processing register");
  await expect(page.getByTestId("page-title")).toHaveText("Processing register");

  // A filter narrows the table.
  await page.getByTestId("ropa-filter-risk").selectOption("critical");
  await expect(page.getByTestId("ropa-row-ROPA-001")).toHaveCount(0);
  await expect(page.getByTestId("ropa-row-ROPA-008")).toBeVisible();
});

test("create through the form, tab by tab: each area says what it is worth, and the database scores it on save", async ({ page }) => {
  await signIn(page, SEED_USERS.mumbaiUniversity.email);
  await page.goto("/dashboard/ropa/new");
  await expect(page.getByTestId("ropa-form")).toBeVisible({ timeout: 20_000 });

  // Slice 10.5 B3 (F3.4): a blank record is High on its unknowns, and says so.
  await expect(page.getByTestId("ropa-record-risk")).toHaveText("High");
  await expect(page.getByTestId("ropa-record-risk-unknowns")).toHaveText("Risk: High until the unknowns are answered.");
  // F3.2: five tabs, each saying what it is worth on a new record.
  for (const [id, pts] of [["who", "34 pts"], ["purpose", "24 pts"], ["systems", "16 pts"], ["retention", "22 pts"], ["evidence", "4 pts"]] as const) {
    await expect(page.getByTestId(`ropa-tab-points-${id}`)).toHaveText(pts);
  }

  // Who and what
  await expect(page.getByTestId("ropa-area-state-identity")).toHaveText("Missing · worth 8 pts");
  await page.getByTestId("ropa-field-name").fill(`${NAME_PREFIX} ${RUN} webinar sign-ups`);
  await expect(page.getByTestId("ropa-area-state-identity")).toHaveText("Complete · 8 pts");
  await page.getByTestId("ropa-field-departmentText").fill("Communications");
  await page.getByTestId("ropa-field-ownerUserId").selectOption(SEED_USERS.muLegal.id);
  await page.getByTestId("ropa-field-dataPrincipalTypes").fill("Students, external participants");
  await page.getByTestId("ropa-field-dataCategories").fill("Name, email, mobile");
  // Children "unknown" shows the s.9 questions; "no" hides them.
  await expect(page.getByTestId("ropa-children")).toBeVisible();
  await page.getByTestId("ropa-field-childrenData").selectOption("no");
  await expect(page.getByTestId("ropa-children")).toHaveCount(0);

  // Purpose and ground
  await page.getByTestId("tab-purpose").click();
  await page.getByTestId("ropa-field-purpose").fill("Event administration");
  // F3.5: s.7(a) in the Act's terms, the section in brackets.
  await expect(page.getByTestId("ropa-field-lawfulBasis").locator('option[value="voluntary"]')).toHaveText(
    "A specified purpose the person voluntarily gave the data for, and has not said they do not consent to its use (s.7(a))",
  );
  // A note is not a decision: the area completes when a lawful GROUND is chosen (D-065).
  await page.getByTestId("ropa-field-legalBasisNote").fill("Consent on the sign-up form");
  await expect(page.getByTestId("ropa-area-state-purpose_basis")).toHaveText("Missing · worth 10 pts");
  await page.getByTestId("ropa-field-lawfulBasis").selectOption("consent");
  await expect(page.getByTestId("ropa-area-state-purpose_basis")).toHaveText("Complete · 10 pts");
  await page.getByTestId("ropa-field-collectionSource").fill("Web form");
  await page.getByTestId("ropa-field-noticeLinked").fill("Event notice v1");
  await page.getByTestId("ropa-field-consentLinked").fill("Consent on the sign-up form");

  // Systems and processors
  await page.getByTestId("tab-systems").click();
  await page.getByTestId("ropa-field-systemsText").fill("Forms, email platform");
  await page.getByTestId("ropa-field-vendorsText").fill("None");

  // Retention and security
  await page.getByTestId("tab-retention").click();
  await page.getByTestId("ropa-field-retentionRule").fill("Ninety days after the event");
  await page.getByTestId("ropa-field-retentionTrigger").selectOption("purpose_served");
  await page.getByTestId("ropa-field-securitySafeguards").fill("Access restrictions, export control");
  await page.getByTestId("ropa-safeguard-access_control").check();
  await page.getByTestId("ropa-field-nextReviewAt").fill("2099-06-30");

  // A tab switch keeps what was typed (every panel stays mounted).
  await page.getByTestId("tab-who").click();
  await expect(page.getByTestId("ropa-field-name")).toHaveValue(`${NAME_PREFIX} ${RUN} webinar sign-ups`);

  // One Save, for every tab.
  await expect(page.getByTestId("ropa-save")).toHaveCount(1);
  await page.getByTestId("ropa-save").click();
  await expect(page).toHaveURL(/\/dashboard\/ropa\/[0-9a-f-]{36}$/, { timeout: 20_000 });
  recordUrl = page.url();
  // 96: everything but a stored artefact.
  await expect(page.getByTestId("ropa-record-score")).toHaveText("96", { timeout: 20_000 });
  await expect(page.getByTestId("ropa-record-band")).toHaveText("Strong");
  await expect(page.getByTestId("ropa-record-status")).toHaveText("Draft");
  // The tabs' points are the record's own, from the register.
  for (const [id, pts] of [["who", "34/34"], ["purpose", "24/24"], ["systems", "16/16"], ["retention", "22/22"], ["evidence", "0/4"]] as const) {
    await expect(page.getByTestId(`ropa-tab-points-${id}`)).toHaveText(pts);
  }
  await expect(page.getByTestId("ropa-record-risk-unknowns")).toHaveCount(0);
  await page.getByTestId("tab-evidence").click();
  await expect(page.getByTestId("ropa-area-state-evidence")).toHaveText("Missing · worth 4 pts");
  await expect(page.getByTestId("ropa-evidence")).toBeVisible();

  // Fill two tabs, save once, and a reload shows both.
  await page.getByTestId("tab-who").click();
  await page.getByTestId("ropa-field-description").fill("Sign-ups for the public webinar series.");
  await page.getByTestId("tab-systems").click();
  await page.getByTestId("ropa-field-sharing").fill("None outside the university");
  await page.getByTestId("ropa-save").click();
  await expect(page.getByTestId("ropa-saved")).toBeVisible({ timeout: 20_000 });
  await page.reload();
  await expect(page.getByTestId("ropa-field-description")).toHaveValue("Sign-ups for the public webinar series.", { timeout: 20_000 });
  await page.getByTestId("tab-systems").click();
  await expect(page.getByTestId("ropa-field-sharing")).toHaveValue("None outside the university");

  await page.getByTestId("ropa-submit").click();
  await expect(page.getByTestId("ropa-record-status")).toHaveText("In review");
  // The Registrar is not the owner, but holds evidence.review: the button is there.
  await expect(page.getByTestId("ropa-approve")).toBeVisible();
});

test("a second person approves, and the approved record is read-only", async ({ page }) => {
  await signIn(page, SEED_USERS.consultant.email);
  await page.goto(recordUrl);
  await expect(page.getByTestId("ropa-record-status")).toHaveText("In review", { timeout: 20_000 });
  await page.getByTestId("ropa-approve").click();
  await expect(page.getByTestId("ropa-record-status")).toHaveText("Approved");
  await expect(page.getByTestId("ropa-readonly")).toContainText("approved");
  await expect(page.getByTestId("ropa-field-name")).toBeDisabled();
  await expect(page.getByTestId("ropa-reopen")).toBeVisible();
});

test("import: confirm the mapping, see the bad rows with their reasons, import the rest", async ({ page }) => {
  await signIn(page, SEED_USERS.mumbaiUniversity.email);
  await page.goto("/dashboard/ropa/import");
  await expect(page.getByTestId("ropa-import-file")).toBeVisible({ timeout: 20_000 });

  // Slice 10.5 B3 (F3.12): a template to start from — the columns the importer reads.
  const download = page.waitForEvent("download");
  await page.getByTestId("ropa-import-template").click();
  const template = await download;
  expect(template.suggestedFilename()).toBe("processing-register-template.csv");
  const header = readFileSync(await template.path(), "utf8").split("\r\n")[0]!;
  expect(header.split(",").slice(0, 3)).toEqual(["ROPA ID", "Processing Activity", "Description"]);

  const row = (n: number) => `${NAME_PREFIX} ${RUN} import ${n},Purpose ${n},2027-01-15`;
  const csv = [
    "Processing Activity,Purpose,Next Review",
    row(1),
    row(2),
    ",No name here,2027-01-15",
    row(3),
    row(4),
    `${NAME_PREFIX} ${RUN} import 5,Purpose,not a date`,
    row(6),
    row(7),
    row(8),
    row(9),
  ].join("\n");
  await page.getByTestId("ropa-import-file").setInputFiles({ name: "register.csv", mimeType: "text/csv", buffer: Buffer.from(csv) });
  await page.getByTestId("ropa-import-check").click();

  await expect(page.getByTestId("ropa-import-preview")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId("ropa-import-map-Processing Activity")).toHaveValue("name");
  await expect(page.getByTestId("ropa-import-valid")).toHaveText("8");
  await expect(page.getByTestId("ropa-import-rejected-count")).toHaveText("2");
  await expect(page.getByTestId("ropa-import-rejected-row-4")).toContainText("needs a name");
  await expect(page.getByTestId("ropa-import-rejected-row-7")).toContainText("Use a date like");
  // N6: the rejected rows are a paged, searchable table.
  await page.getByTestId("ropa-import-rejected-table-search").fill("date");
  await expect(page.getByTestId("ropa-import-rejected-row-4")).toHaveCount(0);
  await expect(page.getByTestId("ropa-import-rejected-row-7")).toBeVisible();
  await page.getByTestId("ropa-import-rejected-table-search").fill("");

  await page.getByTestId("ropa-import-run").click();
  await expect(page.getByTestId("ropa-import-imported")).toHaveText("8", { timeout: 20_000 });
  await page.getByTestId("ropa-import-done").click();
  await expect(page.getByTestId("ropa-table")).toContainText(`${NAME_PREFIX} ${RUN} import 9`, { timeout: 20_000 });
});

test("the register's gaps are generated in SQL and land on the shared action workflow", async ({ page }) => {
  await signIn(page, SEED_USERS.mumbaiUniversity.email);
  await page.goto("/dashboard/ropa/gaps");
  await expect(page.getByTestId("ropa-gaps-summary")).toBeVisible({ timeout: 20_000 });
  await page.getByTestId("ropa-generate-gaps").click();
  await expect(page.getByTestId("ropa-gap-list")).toBeVisible({ timeout: 20_000 });
  // An imported record has no owner: its gap is on the list with one action. The
  // list is paged since Slice 10.5 B2 (F2.5) — find it with the search.
  await page.getByTestId("ropa-gap-list-search").fill(`${NAME_PREFIX} ${RUN} import 1`);
  const gap = page.locator('[data-code="no_owner"]', { hasText: `${NAME_PREFIX} ${RUN} import 1` });
  await expect(gap).toHaveCount(1);
  await expect(gap.locator('span[data-testid^="action-status-"]')).toHaveText("Open");
  await page.getByTestId("ropa-gaps-view-roadmap").click();
  await expect(page.getByTestId("roadmap")).toBeVisible();
});

test("ask the register: what do we hold about students, and what does a system touch", async ({ page }) => {
  await signIn(page, SEED_USERS.muDean.email);
  await page.goto("/dashboard/ropa/lookup");
  await expect(page.getByTestId("ropa-lookup-choice")).toBeVisible({ timeout: 20_000 });
  // Slice 10.5 B3 (F3.12): what the page is for, and one kind of person once.
  await expect(page.getByTestId("ropa-lookup-purpose")).toContainText("section 11(1)");
  const people = await page.getByTestId("ropa-lookup-choice").locator("option").allTextContents();
  expect(people).toContain("Applicant");
  expect(people).not.toContain("Applicants");
  await page.getByTestId("ropa-lookup-choice").selectOption("Student");
  await expect(page.getByTestId("ropa-lookup-summary")).toContainText("processing activities use their personal data");
  await expect(page.getByTestId("ropa-lookup-ROPA-003")).toBeVisible();
  // N7: the results are a paged, searchable table.
  await page.getByTestId("ropa-lookup-records-search").fill("ROPA-003");
  await expect(page.getByTestId("ropa-lookup-ROPA-003")).toBeVisible();
  await expect(page.locator('[data-testid^="ropa-lookup-ROPA-"]')).toHaveCount(1);

  await page.getByTestId("ropa-lookup-mode-system").click();
  await page.getByTestId("ropa-lookup-choice").selectOption({ label: "Student ERP / SIS" });
  await expect(page.getByTestId("ropa-lookup-summary")).toContainText("Student ERP / SIS is used by");
  await expect(page.getByTestId("ropa-lookup-ROPA-001")).toBeVisible();
});
