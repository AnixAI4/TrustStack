/**
 * Slice 9, Stages 3–4 — the Reports page in a browser.
 *
 *  - The Dean (Executive Sponsor) reaches Reports from the nav on Mumbai
 *    University and is offered no "Generate" — only their own action pack
 *    (decision 9). Nothing is generated on MU: a report is permanent.
 *  - An Organisation Admin on a disposable tenant (`…a00b`) generates the
 *    DPDP Exposure Brief, sees it listed as version 1, downloads the PDF, and
 *    makes version 2; version 1 stays listed. Then a working spreadsheet
 *    (XLSX) and a named member's Owner Action Pack.
 *  - That member, a Department Owner here, generates and downloads their
 *    OWN pack, and is offered nothing else.
 */
import { expect, test, type Page } from "@playwright/test";
import { createE2eTenant, removeE2eTenant, SEED_USERS, seedPassword } from "../helpers";

const TENANT = {
  organizationId: "0b0000ff-0000-4000-8000-00000000a00b",
  name: "E2E Reports UI Tenant",
  industryCode: "general",
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

test("the Dean reaches Reports from the nav and is offered no Generate", async ({ page }) => {
  await signIn(page, SEED_USERS.muDean.email);
  await page.getByTestId("nav-reports").click();
  await expect(page).toHaveURL(/\/dashboard\/reports$/);
  await expect(page.getByRole("heading", { name: "Reports", level: 1 })).toBeVisible();
  // Slice 10.5 B4 (F4.8): the Dean sees the PDF tab (their own pack) and the stored reports — no working files.
  await expect(page.getByTestId("tab-working-files")).toHaveCount(0);
  await page.getByTestId("tab-stored").click();
  await expect(page.getByTestId("reports-table").or(page.getByTestId("reports-empty"))).toBeVisible();
  await page.getByTestId("tab-pdf").click();
  await expect(page.getByTestId("generate-exposure_brief")).toHaveCount(0);
  await expect(page.getByTestId("generate-programme_status")).toHaveCount(0);
  await expect(page.getByTestId("generate-gap_action_tracker")).toHaveCount(0);
  await expect(page.getByTestId("generate-own-pack")).toBeVisible();
  await expect(page.getByText("It is not a final legal opinion")).toBeVisible();
});

test("an admin generates the Exposure Brief, downloads it, and makes a new version", async ({ page }) => {
  await signIn(page, SEED_USERS.muItSecurity.email);
  await page.getByTestId("organization-switcher").selectOption(TENANT.organizationId);
  await expect(page.getByTestId("organization-name")).toHaveText(TENANT.name);

  await page.goto("/dashboard/reports");
  // Slice 10.5 B4 (F4.8): three tabs; the PDF tab opens first, led by "Which report do I need?".
  const guide = page.getByTestId("tabpanel-pdf").getByTestId("reports-guide");
  await expect(guide).toContainText("Which report do I need?");
  await expect(guide).toContainText("Board, CEO and Executive Sponsor: DPDP Exposure Brief");
  await page.getByTestId("tab-stored").click();
  await expect(page.getByTestId("reports-empty")).toBeVisible();
  await page.getByTestId("tab-pdf").click();
  // Slice 10, Stage 6: one report per stakeholder, offered with the others.
  for (const kind of ["security_breach", "legal_position", "processor_exposure"]) await expect(page.getByTestId(`generate-${kind}`)).toBeVisible();
  await page.getByTestId("generate-exposure_brief").click();
  await expect(page.getByTestId("reports-notice")).toContainText("DPDP Exposure Brief version 1 is ready");

  // Generating opens the Stored tab, where the new report is.
  await expect(page.getByTestId("tab-stored")).toHaveAttribute("aria-selected", "true");
  const table = page.getByTestId("reports-table");
  await expect(table).toContainText("DPDP Exposure Brief");
  await expect(table).toContainText("v1");
  await expect(table).toContainText("Ready");

  const row = table.locator("tbody tr").first();
  const downloading = page.waitForEvent("download");
  await row.getByRole("button", { name: "Download" }).click();
  const file = await downloading;
  expect(file.suggestedFilename()).toMatch(/^TrustStack_DPDP_Exposure_Brief_v1_\d{4}-\d{2}-\d{2}\.pdf$/);

  await row.getByRole("button", { name: "New version" }).click();
  await expect(page.getByTestId("reports-notice")).toContainText("DPDP Exposure Brief version 2 is ready");
  await expect(table.locator("tbody tr")).toHaveCount(2);
  await expect(table).toContainText("v2");
  await expect(table).toContainText("v1");
});

test("the admin generates a working spreadsheet and a named member's action pack", async ({ page }) => {
  await signIn(page, SEED_USERS.muItSecurity.email);
  await page.getByTestId("organization-switcher").selectOption(TENANT.organizationId);
  await expect(page.getByTestId("organization-name")).toHaveText(TENANT.name);
  await page.goto("/dashboard/reports");
  const table = page.getByTestId("reports-table");
  await page.getByTestId("tab-stored").click();
  await expect(table).toBeVisible();

  await page.getByTestId("tab-working-files").click();
  await page.getByTestId("generate-gap_action_tracker").click();
  await expect(page.getByTestId("reports-notice")).toContainText("Gap & Action Tracker version 1 is ready");
  const trackerRow = table.locator("tbody tr", { hasText: "Gap & Action Tracker" });
  const downloading = page.waitForEvent("download");
  await trackerRow.getByRole("button", { name: "Download" }).click();
  expect((await downloading).suggestedFilename()).toMatch(/^TrustStack_Gap_and_Action_Tracker_v1_\d{4}-\d{2}-\d{2}\.xlsx$/);

  await page.getByTestId("tab-pdf").click();
  const legal = page.getByTestId("owner-select").locator("option", { hasText: "Department Owner" });
  await page.getByTestId("owner-select").selectOption(await legal.getAttribute("value"));
  await page.getByTestId("generate-owner_action_pack").click();
  await expect(page.getByTestId("reports-notice")).toContainText("Owner Action Pack version 1 is ready");
  await expect(table.locator("tbody tr", { hasText: "Owner Action Pack" })).toHaveCount(1);
});

test("a department owner generates and downloads their OWN pack, and is offered nothing else", async ({ page }) => {
  await signIn(page, SEED_USERS.muLegal.email);
  await page.getByTestId("organization-switcher").selectOption(TENANT.organizationId);
  await expect(page.getByTestId("organization-name")).toHaveText(TENANT.name);
  await page.goto("/dashboard/reports");
  await expect(page.getByTestId("generate-exposure_brief")).toHaveCount(0);

  await page.getByTestId("generate-own-pack").click();
  await expect(page.getByTestId("reports-notice")).toContainText("Owner Action Pack version 2 is ready");
  const table = page.getByTestId("reports-table");
  // The notice shows before the list reloads: wait for the new version's own row.
  const mine = table.locator("tbody tr", { hasText: "Owner Action Pack" }).filter({ hasText: "v2" });
  await expect(mine).toHaveCount(1);
  const downloading = page.waitForEvent("download");
  await mine.getByRole("button", { name: "Download" }).click();
  expect((await downloading).suggestedFilename()).toMatch(/^TrustStack_Owner_Action_Pack_v2_\d{4}-\d{2}-\d{2}\.pdf$/);
  // Others' reports are listed (report.read) but not downloadable (no report.download).
  await expect(table.locator("tbody tr", { hasText: "Gap & Action Tracker" }).getByRole("button", { name: "Download" })).toHaveCount(0);
});
