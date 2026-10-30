import { expect, test } from "@playwright/test";
import { SEED_ORGS, SEED_USERS, seedPassword } from "../helpers";

test("sign in → /dashboard shows the organisation name", async ({ page }) => {
  const user = SEED_USERS.mumbaiUniversity;

  await page.goto("/login");
  // Slice 10.5 B1 (F1.9, Q4): what TrustStack is, and who helps with a forgotten password.
  await expect(page.getByTestId("login-about")).toHaveText("DPDP readiness for your organisation — assessments, registers and reports.");
  await expect(page.getByTestId("login-forgot")).toHaveText("Forgot your password? Ask your organisation's admin.");
  await page.getByLabel("Email").fill(user.email);
  await page.getByLabel("Password").fill(seedPassword());
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByTestId("organization-name")).toHaveText(SEED_ORGS.mumbaiUniversity.name);
  await expect(page.getByTestId("user-email")).toHaveText(user.email);
  await expect(page.getByText(SEED_ORGS.bharatManufacturing.name)).toHaveCount(0);

  await page.getByTestId("user-menu").click();
  await page.getByRole("menuitem", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/login/);
});

test("wrong password shows an error instead of swallowing it", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill(SEED_USERS.mumbaiUniversity.email);
  await page.getByLabel("Password").fill("definitely-wrong");
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page.getByTestId("login-error")).toContainText(/invalid/i);
  await expect(page).toHaveURL(/\/login/);
});
