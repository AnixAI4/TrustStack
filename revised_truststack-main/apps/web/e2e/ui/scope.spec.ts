import { expect, test, type Page } from "@playwright/test";
import { SEED_ORGS, SEED_USERS, seedPassword, withDb } from "../helpers";

test.afterAll(async () => {
  await withDb((db) => db.query("DELETE FROM public.departments WHERE name LIKE 'E2E UI %'"));
});

async function signIn(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(seedPassword());
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

test("consultant walks the MU scope wizard: adds a department, saves answers, previews children + AI tags", async ({ page }) => {
  await signIn(page, SEED_USERS.consultant.email);
  await expect(page.getByTestId("organization-name")).toHaveText(SEED_ORGS.mumbaiUniversity.name);
  await page.getByTestId("nav-scope").click();
  await expect(page).toHaveURL(/\/dashboard\/scope$/);

  // Step 1 — industry comes from the server.
  await expect(page.getByTestId("industry-select")).toHaveValue("university");

  // Step 3 — departments register.
  await page.getByTestId("step-3").click();
  await expect(page.getByTestId("departments-list")).toContainText("Examinations");
  const deptName = `E2E UI Dept ${Date.now()}`;
  await page.getByTestId("departments-form").getByLabel("Department name").fill(deptName);
  await page.getByTestId("departments-add").click();
  await expect(page.getByTestId("departments-list")).toContainText(deptName);

  // Step 6 — answers, with an explicit Unknown option. Slice 10.5 B1 (F1.11): Next saves them
  // (no separate Save button) and the server derives the tags.
  await page.getByTestId("step-6").click();
  await expect(page.getByRole("radio", { name: "Unknown" }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Save answers" })).toHaveCount(0);

  // Step 7 — preview with reasons and packs.
  await page.getByTestId("step-next").click();
  await expect(page.getByTestId("tag-children_data")).toContainText("Students may include under-18s");
  await expect(page.getByTestId("tag-ai_processing")).toBeVisible();
  await expect(page.getByTestId("preview-packs")).toContainText("UNIVERSITY_AI_PROCTORING_V1");
  // D-028: internal trigger wording, tiers, and enhanced-review flags.
  await expect(page.getByTestId("large-scale-notice")).toHaveText(
    "Based on the number of individuals involved, this assessment treats the organisation as large-scale for internal DPDP readiness review. This is a TrustStack risk trigger and not a statutory classification.",
  );
  await expect(page.getByTestId("preview-profile")).toContainText("Vendor dependent");
  await expect(page.getByTestId("enhanced-review")).toContainText("children’s data, identity, financial or health documents, AI profiling, scoring or proctoring");

  // Remove what we added.
  await page.getByTestId("step-3").click();
  await page.getByRole("button", { name: `Remove ${deptName}` }).click();
  await expect(page.getByTestId("departments-list")).not.toContainText(deptName);
});

test("the scope wizard's Next saves the step: a reload shows the answer", async ({ page }) => {
  await signIn(page, SEED_USERS.consultant.email);
  await page.goto("/dashboard/scope");
  await page.getByTestId("step-6").click();
  const multi = page.getByLabel("Multiple campuses, branches or subsidiaries");
  const before = await multi.isChecked();
  try {
    await multi.setChecked(!before);
    await page.getByTestId("step-next").click();
    await expect(page.getByTestId("preview-profile")).toBeVisible();
    await page.reload();
    await page.getByTestId("step-6").click();
    await expect(page.getByLabel("Multiple campuses, branches or subsidiaries")).toBeChecked({ checked: !before });
  } finally {
    // Put MU's answer back, through the same Next.
    const box = page.getByLabel("Multiple campuses, branches or subsidiaries");
    if ((await box.isChecked()) !== before) {
      await box.setChecked(before);
      await page.getByTestId("step-next").click();
      await expect(page.getByTestId("preview-profile")).toBeVisible();
    }
  }
});

test("a department owner sees the scope read-only, and the profile read-only", async ({ page }) => {
  await signIn(page, SEED_USERS.muDepartmentOwner.email);
  await page.goto("/dashboard/scope");
  await expect(page.getByTestId("scope-readonly")).toBeVisible();
  await page.getByTestId("step-3").click();
  await expect(page.getByTestId("departments-list")).toContainText("Examinations");
  await expect(page.getByTestId("departments-form")).toHaveCount(0);

  await page.goto("/dashboard/organization");
  // Slice 10.5 B1 (F1.10): the profile is the first of four settings tabs.
  await expect(page.getByTestId("page-title")).toHaveText("Organisation settings");
  await expect(page.getByTestId("tab-profile")).toHaveAttribute("aria-selected", "true");
  await expect(page.getByTestId("profile-industry")).toHaveText("University / Higher Education");
  await expect(page.getByTestId("profile-readonly")).toBeVisible();
  await expect(page.getByRole("button", { name: "Save profile" })).toHaveCount(0);
});
