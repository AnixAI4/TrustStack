/**
 * Slice 10, Stage 2 — the rights and grievance register in a browser.
 *
 *  - The Dean (Executive Sponsor) reaches the register from the nav on Mumbai
 *    University, sees its access request and its grievance answered in time,
 *    and is offered no "Record". Nothing is written on MU: a request is never
 *    deleted.
 *  - An Organisation Admin on a disposable healthcare tenant (`…a013`)
 *    records an erasure request, is stopped from fulfilling it before the
 *    person is identified, records the identity check and the response, adds
 *    a remedial action — and finds that action on the one Actions page,
 *    labelled "Rights and grievance register".
 */
import { expect, test, type Page } from "@playwright/test";
import { createE2eTenant, removeE2eTenant, SEED_USERS, seedPassword } from "../helpers";

const TENANT = {
  organizationId: "0b0000ff-0000-4000-8000-00000000a013",
  name: "E2E Rights UI Healthcare Tenant",
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

test("the Dean reads Mumbai University's register: two requests answered in time, and nothing to record", async ({ page }) => {
  await signIn(page, SEED_USERS.muDean.email);
  await expect(page.getByTestId("overview-rights")).toContainText("Rights requests and grievances");
  await page.getByTestId("nav-rights").click();
  await expect(page).toHaveURL(/\/dashboard\/rights$/);
  await expect(page.getByTestId("rights-count-overdue")).toHaveText("0");
  await expect(page.getByTestId("rights-clock-DPR-2026-001")).toHaveText("Responded on day 18");
  await expect(page.getByTestId("rights-clock-GRV-2026-001")).toHaveText("Responded on day 22");
  // Slice 10.5 B3 (F3.11): the list says what the filter and the record say.
  await expect(page.getByTestId("rights-status-GRV-2026-001")).toHaveText("Responded — Resolved");
  await expect(page.getByTestId("nav-rights")).toContainText("Rights and grievances");
  await expect(page.getByTestId("page-title")).toHaveText("Rights and grievances");
  await expect(page.getByTestId("rights-clock-note")).toContainText("TrustStack's, not a statutory period");
  await expect(page.getByTestId("rights-new")).toHaveCount(0);

  // D-139, s.11(1)(b): the access request lists who the data was shared with, from MU's processing register.
  await page.getByTestId("rights-DPR-2026-001").getByRole("link").click();
  const sharing = page.getByTestId("rights-sharing");
  await expect(sharing).toContainText("Who the person's data was shared with");
  await expect(page.getByTestId("rights-sharing-row-v-LMS provider")).toContainText("Data Processor · Learning management platform");
  await expect(page.getByTestId("rights-sharing-row-t-ROPA-001")).toContainText("Named in the record's text");
  // Payroll rests on employment (s.7(i)): this right does not reach it.
  await expect(page.getByTestId("rights-sharing-row-t-ROPA-005")).toHaveCount(0);
  await expect(page.getByTestId("rights-sharing-counts")).toContainText("1 record rests on another legitimate use (s.7)");
  await expect(sharing).toContainText("s.11(2)");
  await page.goto("/dashboard/rights");

  await page.getByTestId("rights-filter-family").selectOption("grievance");
  await expect(page.getByTestId("rights-DPR-2026-001")).toHaveCount(0);
  await page.getByTestId("rights-GRV-2026-001").getByRole("link").click();
  await expect(page.getByTestId("rights-status")).toHaveText("Responded — Resolved");
  await expect(page.getByTestId("rights-respond-by")).toHaveText("1 Dec 2026");
  await expect(page.getByTestId("rights-lifecycle")).toHaveCount(0);
  await expect(page.getByTestId("rights-actions")).toContainText("Make corrections in the student record flow to the examination system");
});

test("an admin records an erasure request, identifies the person, responds and adds a remedial action", async ({ page }) => {
  await signIn(page, SEED_USERS.muItSecurity.email);
  await page.getByTestId("organization-switcher").selectOption(TENANT.organizationId);
  await expect(page.getByTestId("organization-name")).toHaveText(TENANT.name);
  await expect(page.getByTestId("overview-rights-empty")).toBeVisible();

  await page.goto("/dashboard/rights");
  await expect(page.getByTestId("rights-empty")).toBeVisible();
  await page.getByTestId("rights-new").click();
  await expect(page).toHaveURL(/\/dashboard\/rights\/new$/);
  await page.getByTestId("rights-kind").selectOption("erasure");
  await page.getByTestId("rights-requester-name").fill("E2E UI Patient");
  await page.getByTestId("rights-identifier").fill("Patient number UI-0042");
  await page.getByTestId("rights-summary-text").fill("Asks the hospital to erase the mobile number it no longer needs.");
  await page.getByTestId("rights-save").click();

  // The detail page: the code and the ninety days are the server's.
  await expect(page.getByTestId("rights-code")).toHaveText(/^DPR-\d{4}-001$/);
  await expect(page.getByTestId("rights-status")).toHaveText("Open");
  await expect(page.getByTestId("rights-clock")).toHaveText("Day 0 of 90");

  // Fulfilling before the person is identified is refused, in words.
  await page.getByTestId("rights-respond-open").click();
  await page.getByTestId("rights-respond-save").click();
  await expect(page.getByTestId("rights-respond-error")).toContainText("identity was verified");

  await page.getByTestId("rights-identity-open").click();
  await page.getByTestId("rights-identity-form").getByLabel("How — required").fill("Matched the patient number and date of birth");
  await page.getByTestId("rights-identity-form").getByRole("button", { name: "Save" }).click();
  await expect(page.getByTestId("rights-identity")).toContainText("Recorded by");
  // The earlier refusal is gone: it must not read as a second one.
  await expect(page.getByTestId("rights-respond-error")).toHaveCount(0);

  await page.getByTestId("rights-respond-save").click();
  await expect(page.getByTestId("rights-status")).toHaveText("Responded — Fulfilled");
  await expect(page.getByTestId("rights-clock")).toHaveText("Responded on day 0");
  await expect(page.getByTestId("rights-edit")).toHaveCount(0);

  // A responded request still takes remedial work.
  // Slice 10.5 B0: the request page is in tabs — Response · Documents · Actions · Details.
  await page.getByTestId("tab-actions").click();
  await page.getByTestId("rights-add-action").click();
  const form = page.getByTestId("rights-add-action-form");
  await form.getByLabel("What will be done").fill("Erase the old number from the appointment-reminder processor too");
  await form.getByLabel("Owner").selectOption(SEED_USERS.muLegal.id);
  await form.getByRole("button", { name: "Add" }).click();
  await expect(page.getByTestId("rights-actions")).toContainText("Erase the old number from the appointment-reminder processor too");

  // The one Actions page lists it, labelled by where it came from — never by the person.
  await page.getByTestId("nav-actions").click();
  await page.getByTestId("actions-filter-source").selectOption("rights");
  await expect(page.getByText("Erase the old number from the appointment-reminder processor too").first()).toBeVisible();
  // The source badge on the row (the filter's own option carries the same words).
  await expect(page.getByTestId(/^owner-item-source-/).filter({ hasText: "Rights and grievance register" }).first()).toBeVisible();
  await expect(page.getByText("E2E UI Patient")).toHaveCount(0);
});
