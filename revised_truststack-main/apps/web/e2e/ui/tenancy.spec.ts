import { expect, test, type Page } from "@playwright/test";
import { SEED_ORGS, SEED_USERS, seedPassword } from "../helpers";

async function signIn(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(seedPassword());
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

test("consultant switches organisation and the dashboard organisation name changes", async ({ page }) => {
  await signIn(page, SEED_USERS.consultant.email);
  await expect(page.getByTestId("organization-name")).toHaveText(SEED_ORGS.mumbaiUniversity.name);

  const switcher = page.getByTestId("organization-switcher");
  await expect(switcher).toBeVisible();
  await switcher.selectOption(SEED_ORGS.bharatManufacturing.id);

  await expect(page.getByTestId("organization-name")).toHaveText(SEED_ORGS.bharatManufacturing.name);
  // Survives a reload: the signed cookie, not client state, holds the choice.
  await page.reload();
  await expect(page.getByTestId("organization-name")).toHaveText(SEED_ORGS.bharatManufacturing.name);
});

test("single-organisation users see no switcher", async ({ page }) => {
  await signIn(page, SEED_USERS.muDean.email);
  await expect(page.getByTestId("organization-name")).toHaveText(SEED_ORGS.mumbaiUniversity.name);
  await expect(page.getByTestId("organization-switcher")).toHaveCount(0);
});

test("org admin sees the Users list with role badges; a department owner gets no Users link and a 403 page", async ({
  page,
}) => {
  await signIn(page, SEED_USERS.muAdmin.email);
  await page.getByTestId("nav-users").click();
  await expect(page).toHaveURL(/\/dashboard\/users$/);
  const members = page.getByTestId("members");
  await expect(members).toContainText(SEED_USERS.muDean.email);
  await expect(members).toContainText(SEED_USERS.consultant.email);
  await expect(members).not.toContainText(SEED_USERS.bmlAdmin.email);
  await expect(page.getByRole("button", { name: "Invite user" })).toBeVisible();
  // Slice 10.5 B1 (F1.8): a purpose line, and statuses in words.
  await expect(page.getByTestId("users-purpose")).toHaveText(
    `Who can sign in to ${SEED_ORGS.mumbaiUniversity.name}, and what each role may do.`,
  );
  await expect(members.getByText("Active", { exact: true }).first()).toBeVisible();
  // Only the roles the admin may grant are offered — never Anix AI Consultant (D-068).
  await page.getByRole("button", { name: "Invite user" }).click();
  const invitable = await page.getByLabel("Role", { exact: true }).locator("option").allTextContents();
  expect(invitable).toContain("Legal User");
  expect(invitable).not.toContain("Anix AI Consultant");
  expect(invitable).not.toContain("Super Admin");
  await page.getByRole("button", { name: "Cancel" }).click();
  // The consultant's own role cannot be changed by the admin either: a badge, not a list.
  await expect(page.getByLabel(`Role for ${SEED_USERS.consultant.email}`)).toHaveCount(0);
  await expect(page.getByLabel(`Role for ${SEED_USERS.muDean.email}`)).toBeVisible();
  const deanRoles = await page.getByLabel(`Role for ${SEED_USERS.muDean.email}`).locator("option").allTextContents();
  expect(deanRoles).not.toContain("Anix AI Consultant");
  // What each role can do, from the same matrix the server enforces.
  await page.getByTestId("role-guide").locator("summary").click();
  await expect(page.getByTestId("role-guide-consultant")).toContainText("you cannot grant this role");
  await expect(page.getByTestId("role-guide-executive_sponsor")).toContainText("Download reports");
  await page.getByTestId("user-menu").click();
  await page.getByRole("menuitem", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/login/);

  await signIn(page, SEED_USERS.muDepartmentOwner.email);
  await expect(page.getByTestId("organization-name")).toBeVisible();
  await expect(page.getByTestId("nav-users")).toHaveCount(0);
  // Typing the URL does not help: the API refuses and the page says so.
  await page.goto("/dashboard/users");
  await expect(page.getByTestId("users-error")).toContainText("FORBIDDEN");
});
