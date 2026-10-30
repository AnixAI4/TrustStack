/**
 * Slice 10, Stage 1 — the breach register in a browser.
 *
 *  - The Dean (Executive Sponsor) reaches the register from the nav on Mumbai
 *    University, sees its one past breach handled in time, and is offered no
 *    "Record a breach". Nothing is written on MU: a breach is never deleted.
 *  - An Organisation Admin on a disposable healthcare tenant (`…a010`) records
 *    a breach, walks its Rule 7 timeline (Board told, the detailed report,
 *    the people told), closes it, adds a remedial action — and finds that
 *    action on the one Actions page, labelled "Breach register".
 *  - Stage 6: the detailed report is attached to the breach itself, and once
 *    the breach is closed it stays attached (no Detach).
 */
import { expect, test, type Page } from "@playwright/test";
import { createE2eTenant, removeE2eTenant, SEED_USERS, seedPassword } from "../helpers";

const TENANT = {
  organizationId: "0b0000ff-0000-4000-8000-00000000a010",
  name: "E2E Breach UI Healthcare Tenant",
  industryCode: "healthcare",
  member: { userId: SEED_USERS.muItSecurity.id, email: SEED_USERS.muItSecurity.email },
  roleCode: "organization_admin",
  extraMembers: [{ userId: SEED_USERS.muLegal.id, roleCode: "department_owner" }],
};

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
});
test.afterAll(async () => {
  await removeE2eTenant(TENANT);
});

test("the Dean reads Mumbai University's register: one past breach, handled in time, and nothing to record", async ({ page }) => {
  await signIn(page, SEED_USERS.muDean.email);
  await expect(page.getByTestId("overview-breaches")).toContainText("Personal data breaches");
  await page.getByTestId("nav-breaches").click();
  await expect(page).toHaveURL(/\/dashboard\/breaches$/);
  await expect(page.getByTestId("breach-count-total")).toHaveText("1");
  await expect(page.getByTestId("breach-count-overdue")).toHaveText("0");
  await expect(page.getByTestId("breach-clock-BRH-2026-001")).toHaveText("Made 16 Mar 2026, 16:30 IST");
  await expect(page.getByTestId("breach-principals-BRH-2026-001")).toHaveText("Told 15 Mar 2026, 11:30 IST");
  await expect(page.getByTestId("breach-clock-note")).toContainText("TrustStack targets, not statutory periods");
  await expect(page.getByTestId("breach-new")).toHaveCount(0);

  await page.getByRole("link", { name: "Examination marks list shared through a public link" }).click();
  await expect(page.getByTestId("breach-status")).toHaveText("Closed");
  await expect(page.getByTestId("breach-due")).toHaveText("17 Mar 2026, 10:20 IST");
  await expect(page.getByTestId("breach-lifecycle")).toHaveCount(0);
  await expect(page.getByTestId("breach-actions")).toContainText("Review link-sharing settings on every examinations folder");
  // Stage 6: the Documents panel is there to read; the Dean may not attach.
  // Slice 10.5 B0: the breach page is in tabs — Timeline · Documents · Actions · Details.
  await page.getByTestId("tab-documents").click();
  await expect(page.getByTestId("breach-documents")).toBeVisible();
  await expect(page.getByTestId("breach-attach")).toHaveCount(0);
});

test("an admin records a breach, walks its Rule 7 timeline, closes it and adds a remedial action", async ({ page }) => {
  await signIn(page, SEED_USERS.muItSecurity.email);
  await page.getByTestId("organization-switcher").selectOption(TENANT.organizationId);
  await expect(page.getByTestId("organization-name")).toHaveText(TENANT.name);
  await expect(page.getByTestId("overview-breaches-empty")).toBeVisible();

  await page.goto("/dashboard/breaches");
  await expect(page.getByTestId("breaches-empty")).toBeVisible();
  await page.getByTestId("breach-new").click();
  await expect(page).toHaveURL(/\/dashboard\/breaches\/new$/);
  await page.getByTestId("breach-title").fill("Discharge summaries sent to the wrong patient");
  await page.getByTestId("breach-nature").selectOption("accidental_disclosure");
  await page.getByTestId("breach-principals-affected").fill("12");
  await page.getByTestId("breach-save").click();

  // The detail page: the code and the 72-hour clock are the server's.
  await expect(page.getByTestId("breach-code")).toHaveText(/^BRH-\d{4}-001$/);
  await expect(page.getByTestId("breach-status")).toHaveText("Open");
  await expect(page.getByTestId("breach-clock")).toHaveText(/^7[01]h \d+m remaining$/);

  // Board told without delay (Rule 7(2)(a)), then the detailed report (Rule 7(2)(b)).
  await page.getByTestId("form-board-initial-open").click();
  await page.getByTestId("form-board-initial").getByRole("button", { name: "Save" }).click();
  await expect(page.getByTestId("step-board-initial")).toContainText("Recorded by");
  await page.getByTestId("form-board-report-open").click();
  await page.getByTestId("form-board-report").getByLabel("Reference (optional)").fill("DPB-UI-1");
  await page.getByTestId("form-board-report").getByRole("button", { name: "Save" }).click();
  await expect(page.getByTestId("breach-clock")).toHaveText(/^Made /);
  await expect(page.getByTestId("step-board-report")).toContainText("DPB-UI-1");

  // Stage 6: the detailed report itself, attached to the breach.
  await page.getByTestId("tab-documents").click();
  await page.getByTestId("breach-file").setInputFiles({ name: "detailed-report-to-board.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4 e2e") });
  await page.getByTestId("breach-attach").click();
  await expect(page.getByTestId("breach-documents")).toContainText("detailed-report-to-board.pdf");
  await expect(page.getByTestId("breach-documents").getByRole("button", { name: "Detach" })).toHaveCount(1);

  // Closing before the people are told is refused, in words.
  await page.getByTestId("tab-timeline").click();
  await page.getByTestId("breach-move-closed").click();
  await expect(page.getByTestId("breach-lifecycle-error")).toContainText("before closing this breach");
  await page.getByTestId("form-principals-open").click();
  await page.getByTestId("form-principals").getByLabel("How they were told — required").fill("Phone call to each patient");
  await page.getByTestId("form-principals").getByRole("button", { name: "Save" }).click();
  await expect(page.getByTestId("step-principals")).toContainText("Phone call to each patient");
  await page.getByTestId("breach-move-closed").click();
  await expect(page.getByTestId("breach-status")).toHaveText("Closed");
  await expect(page.getByTestId("breach-edit")).toHaveCount(0);
  // A closed breach keeps its documents: no Detach.
  await expect(page.getByTestId("breach-documents")).toContainText("detailed-report-to-board.pdf");
  await expect(page.getByTestId("breach-documents").getByRole("button", { name: "Detach" })).toHaveCount(0);

  // A closed breach still takes remedial work.
  await page.getByTestId("tab-actions").click();
  await page.getByTestId("breach-add-action").click();
  const form = page.getByTestId("breach-add-action-form");
  await form.getByLabel("What will be done").fill("Check the patient identifier before every discharge email");
  await form.getByLabel("Owner").selectOption(SEED_USERS.muLegal.id);
  await form.getByRole("button", { name: "Add" }).click();
  await expect(page.getByTestId("breach-actions")).toContainText("Check the patient identifier before every discharge email");

  // The one Actions page lists it, labelled by where it came from.
  await page.getByTestId("nav-actions").click();
  await page.getByTestId("actions-filter-source").selectOption("breach");
  // Listed by owner and in its due window: the same action, twice on the page.
  await expect(page.getByText("Check the patient identifier before every discharge email").first()).toBeVisible();
  // Its source label (Slice 10.5 B0: the menu no longer says "Breach register", so look at the action itself).
  await expect(page.locator('[data-testid^="owner-item-source-"]', { hasText: "Breach register" }).first()).toBeVisible();
});
