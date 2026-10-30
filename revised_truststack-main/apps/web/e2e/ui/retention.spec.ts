/**
 * Slice 10, Stage 5 — the retention register and the AI risk register in a browser.
 *
 *  - The Dean (Executive Sponsor) reaches both registers from the nav on Mumbai
 *    University: ROPA-009's erasure is overdue, ROPA-003 has no end recorded,
 *    ROPA-008 is erased; the AI proctoring system is never reviewed and head 4
 *    does not apply. Nothing is offered to record, and nothing is written on MU.
 *  - An Organisation Admin on a disposable healthcare tenant (`…a023`) adds a
 *    schedule whose erasure is overdue, adds an action owned by a Department
 *    Owner, records the erasure — and the owner then closes the action, which
 *    the one Actions page labels "Retention register". The owner then marks the
 *    erasure as recorded in error, and the schedule is overdue again (D-096).
 *    The admin also adds an AI system that tracks children with no exemption —
 *    a red warning — records the exemption, and records its review.
 *  - D-096: the overview's retention section; MU's proctoring relies on A3.
 */
import { expect, test, type Page } from "@playwright/test";
import { addDays } from "@truststack/core";
import { createE2eTenant, removeE2eTenant, SEED_USERS, seedPassword, withDb } from "../helpers";

const TENANT = {
  organizationId: "0b0000ff-0000-4000-8000-00000000a023",
  name: "E2E Retention UI Healthcare Tenant",
  industryCode: "healthcare",
  member: { userId: SEED_USERS.muItSecurity.id, email: SEED_USERS.muItSecurity.email },
  roleCode: "organization_admin",
  extraMembers: [{ userId: SEED_USERS.muLegal.id, roleCode: "department_owner" }],
};

const today = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());

async function signIn(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(seedPassword());
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

test.describe.configure({ mode: "serial" });

test.beforeAll(async () => {
  await createE2eTenant(TENANT);
  await withDb((db) => db.query("INSERT INTO public.ropa_records (organization_id, name) VALUES ($1, 'Outpatient appointment reminders')", [TENANT.organizationId]));
});
test.afterAll(async () => {
  await removeE2eTenant(TENANT);
});

test("the Dean reads Mumbai University's retention and AI registers, and is offered nothing to record", async ({ page }) => {
  await signIn(page, SEED_USERS.muDean.email);
  // The overview's retention section (D-096, R6): ROPA-009's erasure is overdue.
  await expect(page.getByTestId("overview-retention")).toBeVisible();
  await expect(page.getByTestId("retention-metric-overdue")).toHaveText("1");
  await expect(page.getByTestId("retention-metric-no-end")).toHaveText("1");
  await expect(page.getByTestId("overview-retention-overdue")).toContainText("ROPA-009");
  await page.getByTestId("nav-retention").click();
  await expect(page).toHaveURL(/\/dashboard\/retention$/);
  await expect(page.getByTestId("retention-count-total")).toHaveText("10");
  await expect(page.getByTestId("retention-count-overdue")).toHaveText("1");
  await expect(page.getByTestId("retention-state-ROPA-009")).toHaveText("Erasure overdue");
  await expect(page.getByTestId("retention-state-ROPA-003")).toHaveText("No end recorded");
  await expect(page.getByTestId("retention-state-ROPA-008")).toHaveText("Erased");
  await expect(page.getByTestId("retention-note")).toContainText("Rule 8(3)");
  await expect(page.getByTestId("retention-note")).toContainText("Seventh Schedule");
  await expect(page.getByTestId("retention-add")).toHaveCount(0);
  // Slice 10.5 B3 (F3.9): periods in years where whole — the stored months unchanged.
  await expect(page.getByTestId("retention-ROPA-002")).toContainText("10 years");
  await expect(page.getByTestId("retention-ROPA-008")).toContainText("1 year");
  await expect(page.getByTestId("retention-list")).not.toContainText("120 months");
  await expect(page.getByTestId("nav-retention")).toContainText("Retention register");
  await page.getByTestId("retention-ROPA-009").getByRole("link").click();
  await expect(page.getByTestId("retention-overdue")).toBeVisible();
  await expect(page.getByTestId("retention-ends-on")).toHaveText("15 Feb 2026");
  await expect(page.getByTestId("retention-actions")).toContainText("Erase the February 2025 webinar registrations");
  await expect(page.getByTestId("retention-erasure-form")).toHaveCount(0);

  await page.getByTestId("nav-ai-risk").click();
  await expect(page.getByTestId("ai-count-total")).toHaveText("1");
  await expect(page.getByTestId("ai-sdf")).toContainText("penalty head 4 does not apply");
  await expect(page.getByTestId("ai-list")).toContainText("AI proctoring");
  // D-096 (R5): it monitors children, under the educational-institution exemption — no warning.
  await expect(page.getByTestId("ai-list")).toContainText("Exemption: A3");
  await expect(page.getByTestId("ai-count-child-tracking")).toHaveText("1");
  await expect(page.getByTestId("ai-count-child-unexempt")).toHaveText("0");
  await expect(page.getByTestId("ai-child-warning")).toHaveCount(0);
  await expect(page.getByTestId("ai-add")).toHaveCount(0);
});

test("an admin adds an overdue schedule and an action; the erasure recorded, the owner closes it on the one Actions list", async ({ page, browser }) => {
  await signIn(page, SEED_USERS.muItSecurity.email);
  await page.getByTestId("organization-switcher").selectOption(TENANT.organizationId);
  await expect(page.getByTestId("organization-name")).toHaveText(TENANT.name);

  await page.goto("/dashboard/retention");
  await expect(page.getByTestId("retention-empty")).toBeVisible();
  await page.getByTestId("retention-add").click();
  await page.getByTestId("retention-basis").selectOption("purpose_served");
  // Rule 8(3): the database refuses less than a year, and says why.
  await page.getByTestId("retention-period").fill("6");
  await page.getByTestId("retention-starts-on").fill(addDays(today(), -400));
  await page.getByTestId("retention-add-save").click();
  await expect(page.getByTestId("retention-add-form")).toBeVisible();
  await page.getByTestId("retention-period").fill("12");
  // Slice 10.5 B3 (F3.9): the months entered, said in years.
  await expect(page.getByTestId("retention-period-words")).toHaveText("1 year.");
  await page.getByTestId("retention-add-save").click();
  await expect(page.getByTestId("retention-count-overdue")).toHaveText("1");
  await page.getByTestId("retention-ROPA-001").getByRole("link").click();
  await expect(page.getByTestId("retention-state")).toHaveText("Erasure overdue");

  // Slice 10.5 B0: the schedule page is in tabs — Erasure · Documents · Actions · Schedule.
  await page.getByTestId("tab-actions").click();
  await page.getByTestId("retention-add-action").click();
  await page.getByTestId("retention-add-action-form").getByLabel("What will be done").fill("Erase the reminder list from the SMS tool");
  await page.getByTestId("retention-add-action-form").getByLabel("Owner").selectOption({ label: `${SEED_USERS.muLegal.fullName} — Department Owner` });
  await page.getByTestId("retention-add-action-form").getByRole("button", { name: "Add" }).click();
  await expect(page.getByTestId("retention-actions")).toContainText("Erase the reminder list from the SMS tool");

  await page.getByTestId("tab-erasure").click();
  await page.getByTestId("retention-erased-on").fill(addDays(today(), -1));
  await page.getByTestId("retention-erasure-save").click();
  await expect(page.getByTestId("retention-state")).toHaveText("Erased");
  await expect(page.getByTestId("retention-erasures")).toContainText(`Recorded by ${SEED_USERS.muItSecurity.fullName}`);

  // The owner closes the action: the erasure was recorded by someone else (D-095).
  const ownerContext = await browser.newContext();
  const owner = await ownerContext.newPage();
  await signIn(owner, SEED_USERS.muLegal.email);
  await owner.getByTestId("organization-switcher").selectOption(TENANT.organizationId);
  await expect(owner.getByTestId("organization-name")).toHaveText(TENANT.name);
  await owner.goto("/dashboard/actions");
  // Slice 10.5 B1 (F1.5): a department owner with an action lands on "My actions".
  await expect(owner.getByTestId("tab-mine")).toHaveAttribute("aria-selected", "true");
  const row = owner.getByTestId("actions-mine").locator("tr").filter({ hasText: "Erase the reminder list from the SMS tool" }).first();
  await expect(row).toContainText("Retention register");
  await owner.goto(page.url());
  // The address carries the admin's last tab (#erasure): open Actions.
  await owner.getByTestId("tab-actions").click();
  const status = owner.getByTestId("retention-actions").locator('[data-testid^="action-status-select-"]');
  const actionId = (await status.getAttribute("data-testid"))!.replace("action-status-select-", "");
  await expect(owner.getByTestId(`action-status-${actionId}`)).toHaveText("Open");
  await status.selectOption("closed");
  await owner.getByTestId(`save-action-${actionId}`).click();
  await expect(owner.getByTestId(`action-status-${actionId}`)).toHaveText("Closed");
  await expect(owner.getByTestId(`action-${actionId}`)).toContainText("an erasure recorded by someone else");

  // D-096 (R4): the owner marks the admin's erasure as recorded in error — it stays, struck through, and stops counting.
  await owner.getByTestId("tab-erasure").click();
  await owner.getByTestId("retention-erasures").getByRole("button", { name: "Mark as recorded in error" }).click();
  await owner.getByTestId("retention-erasures").getByLabel("Why it was recorded in error").fill("The SMS tool still holds the list");
  await owner.getByTestId("retention-erasures").getByRole("button", { name: "Mark as recorded in error" }).click();
  await expect(owner.getByTestId("retention-state")).toHaveText("Erasure overdue");
  await expect(owner.getByTestId("retention-erasures").locator('[data-standing="voided"]')).toContainText("Recorded in error");
  await expect(owner.getByTestId("retention-erasures")).toContainText("The SMS tool still holds the list");
  await ownerContext.close();

  // The admin recorded it, so is never offered to mark it.
  await page.reload();
  await expect(page.getByTestId("retention-erasures").getByRole("button", { name: "Mark as recorded in error" })).toHaveCount(0);
});

test("an admin adds an AI system and records its review", async ({ page }) => {
  await signIn(page, SEED_USERS.muItSecurity.email);
  await page.getByTestId("organization-switcher").selectOption(TENANT.organizationId);
  await expect(page.getByTestId("organization-name")).toHaveText(TENANT.name);
  await page.goto("/dashboard/ai-risk");
  await expect(page.getByTestId("ai-empty")).toBeVisible();
  await page.getByTestId("ai-add").click();
  await page.getByTestId("ai-name").fill("Triage chatbot");
  await page.getByTestId("ai-usage").selectOption("chatbot");
  await page.getByTestId("ai-purpose").fill("Answers appointment questions.");
  await page.getByTestId("ai-personal-data").fill("Name, phone number and symptoms typed into the chat.");
  // D-096 (R5): it tracks children, and no exemption is recorded yet.
  await page.getByTestId("ai-child-tracking").selectOption("yes");
  await expect(page.getByTestId("ai-child-exemption")).toBeVisible();
  await page.getByTestId("ai-add-save").click();
  await expect(page.getByTestId("ai-count-unreviewed")).toHaveText("1");
  await expect(page.getByTestId("ai-count-child-unexempt")).toHaveText("1");
  await expect(page.getByTestId("ai-child-warning")).toContainText("no Fourth Schedule exemption is recorded");
  await page.getByTestId("ai-list").getByRole("link", { name: "Triage chatbot" }).click();
  await expect(page.getByTestId("ai-detail-reviewed")).toContainText("Never");
  await expect(page.getByTestId("ai-child-warning")).toBeVisible();
  await page.getByTestId("ai-edit").click();
  await page.getByTestId("ai-child-exemption").selectOption("clinical");
  await page.getByTestId("ai-reviewed-on").fill(addDays(today(), -1));
  await page.getByTestId("ai-edit-save").click();
  // Slice 10.5 B3 (F3.10): the exemption by its short name, the code in brackets; the full wording on hover.
  await expect(page.getByTestId("ai-detail-child-exemption")).toHaveText("Exemption relied on (Fourth Schedule): Clinical health services (A1)");
  await expect(page.getByTestId("ai-detail-child-exemption")).toHaveAttribute("title", /^A1 — Health services by a clinical establishment/);
  await expect(page.getByTestId("ai-child-warning")).toHaveCount(0);
  await expect(page.getByTestId("ai-detail-reviewed")).toContainText(`Recorded by ${SEED_USERS.muItSecurity.fullName}`);
});
