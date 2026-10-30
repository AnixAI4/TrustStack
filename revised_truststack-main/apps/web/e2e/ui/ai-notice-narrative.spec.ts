/**
 * Slice 11 Stage 2b — a notice, its translation and a report's narrative in a
 * browser (SLICE_11 §7c.5–6; D-133).
 *
 * On a disposable tenant (`…a033`), with the assistant on:
 *  - Notice and consent: "Draft a notice from the processing register" → edit →
 *    "Use this draft" → the notice editor is PRE-FILLED and says so; a notice exists
 *    only when the person clicks the editor's own Save.
 *  - A published notice: "Translate into Hindi" → the keys are read-only → "Use this
 *    translation" → a new Hindi notice, pre-filled, saved only by the person.
 *  - Reports: "Draft a narrative" on a stored Exposure Brief → "Accept this narrative"
 *    → "Print the narrated version" → a new version, marked "With narrative".
 *  - A reader without the write permissions sees none of the drafting buttons.
 *
 * Runs against the recorded fake (`AI_PROVIDER=fake`): no live model call.
 */
import { expect, test, type APIRequestContext, type Page } from "@playwright/test";
import { accessTokenFor, bearer, createE2eTenant, removeE2eTenant, SEED_USERS, seedPassword, withDb } from "../helpers";

const ADMIN = SEED_USERS.muItSecurity;
const READER = SEED_USERS.muDean;
const TENANT = {
  organizationId: "0b0000ff-0000-4000-8000-00000000a033",
  name: "E2E AI Notice Panel Tenant",
  industryCode: "general",
  member: { userId: ADMIN.id, email: ADMIN.email },
  roleCode: "organization_admin",
  extraMembers: [{ userId: READER.id, roleCode: "executive_sponsor" }],
};
const ORG = TENANT.organizationId;
const api = (path: string) => `/api/v1/organizations/${ORG}${path}`;

async function call(request: APIRequestContext, method: string, url: string, data?: object) {
  const res = await request.fetch(url, { method, headers: bearer(await accessTokenFor(ADMIN.email)), ...(data ? { data } : {}) });
  const text = await res.text();
  expect(res.status(), text).toBeLessThan(300);
  return text ? JSON.parse(text) : null;
}

async function signInTo(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(seedPassword());
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.getByTestId("organization-switcher").selectOption(ORG);
  await expect(page.getByTestId("organization-name")).toHaveText(TENANT.name);
}

const notices = () =>
  withDb(async (db) => (await db.query("SELECT language, title FROM public.privacy_notices WHERE organization_id = $1 ORDER BY created_at", [ORG])).rows as { language: string; title: string }[]);

let noticeId = "";
let briefId = "";

test.describe.configure({ mode: "serial" });

test.beforeAll(async ({ playwright }) => {
  test.setTimeout(120_000);
  await createE2eTenant(TENANT);
  const request = await playwright.request.newContext({ baseURL: test.info().project.use.baseURL });
  await call(request, "POST", api("/ropa"), { name: "Alumni newsletter", purpose: "Alumni news", dataCategories: "Name, email address", lawfulBasis: "consent" });
  noticeId = (
    await call(request, "POST", api("/privacy-notices"), {
      language: "en",
      title: "How we use your personal data",
      purposes: [
        { key: "admissions", title: "Admissions", uses: "Deciding your application", dataItems: ["Name", "Marks"] },
        { key: "alumni_updates", title: "Alumni updates", uses: "Sending alumni news", dataItems: ["Name", "Email address"] },
      ],
    })
  ).data.notice.id;
  await call(request, "PATCH", api(`/privacy-notices/${noticeId}`), { status: "published" });
  briefId = (await call(request, "POST", api("/reports"), { kind: "exposure_brief" })).data.report.id;
  await call(request, "PATCH", `/api/v1/organizations/${ORG}`, { ai: { enabled: true, contractRef: "E2E-DPA-NOTICE-UI" } });
  await request.dispose();
});

test.afterAll(async () => {
  await removeE2eTenant(TENANT);
});

test("a notice drafted from the register pre-fills the editor; it is saved only by the person", async ({ page }) => {
  await signInTo(page, ADMIN.email);
  await page.goto("/dashboard/consent");
  const before = (await notices()).length;
  await page.getByTestId("consent-notice-draft").click();
  const panel = page.getByTestId("ai-draft-panel");
  await expect(panel.getByTestId("ai-draft")).toBeVisible();
  await expect(panel.getByTestId("ai-draft-purpose-0")).toBeVisible();
  await expect(panel.getByTestId("ai-draft-fixed-texts")).toContainText("Always printed by TrustStack");
  await panel.getByTestId("ai-draft-field-title").fill("Our privacy notice (from the register)");
  await panel.getByTestId("ai-draft-accept").click();

  await expect(page).toHaveURL(/\/dashboard\/consent\/notices\/new\?draft=/);
  await expect(page.getByTestId("notice-from-draft")).toContainText("Pre-filled from an AI draft");
  await expect(page.getByTestId("notice-title")).toHaveValue("Our privacy notice (from the register)");
  expect((await notices()).length).toBe(before);
  await page.getByTestId("notice-save").click();
  await expect(page.getByTestId("notice-message")).toContainText("Draft saved.");
  expect((await notices()).length).toBe(before + 1);
});

test("a published notice translates into Hindi with its keys locked; a new Hindi notice only when saved", async ({ page }) => {
  await signInTo(page, ADMIN.email);
  await page.goto(`/dashboard/consent/notices/${noticeId}`);
  await expect(page.getByTestId("notice-translate-mr")).toBeVisible();
  await page.getByTestId("notice-translate-hi").click();
  const panel = page.getByTestId("ai-draft-panel");
  await expect(panel.getByTestId("ai-draft-purpose-key-0")).toHaveAttribute("readonly", "");
  await expect(panel.getByTestId("ai-draft-purpose-key-0")).toHaveValue("admissions");
  await panel.getByTestId("ai-draft-accept").click();

  await expect(page).toHaveURL(/\/dashboard\/consent\/notices\/new\?draft=/);
  await expect(page.getByTestId("notice-from-draft")).toContainText("Pre-filled from an AI translation");
  await expect(page.getByTestId("notice-language")).toHaveValue("hi");
  expect((await notices()).filter((n) => n.language === "hi")).toHaveLength(0);
  await page.getByTestId("notice-save").click();
  await expect(page.getByTestId("notice-message")).toContainText("Draft saved.");
  expect((await notices()).filter((n) => n.language === "hi")).toHaveLength(1);
});

test("a report's narrative: draft, accept, then print a new version — never automatically", async ({ page }) => {
  await signInTo(page, ADMIN.email);
  await page.goto("/dashboard/reports");
  await page.getByTestId("tab-stored").click();
  await page.getByTestId(`narrative-draft-${briefId}`).click();
  const panel = page.getByTestId("ai-draft-panel");
  await expect(panel.getByTestId("ai-draft-field-headline")).not.toHaveValue("");
  await panel.getByTestId("ai-draft-accept").click();

  // Accepting printed nothing: the row now offers to print it.
  const print = page.getByTestId(`narrative-print-${briefId}`);
  await expect(print).toBeVisible();
  await expect(page.locator('[data-testid^="narrated-"]')).toHaveCount(0);
  await print.click();
  await expect(page.getByTestId("reports-notice")).toContainText("figures with the narrative in front");
  await expect(page.locator('[data-testid^="narrated-"]')).toHaveCount(1);
  await expect(page.locator('[data-testid^="narrated-"]').first()).toContainText("figures of v1");
  await expect(page.getByTestId(`narrative-print-${briefId}`)).toHaveCount(0);
});

test("a reader without the write permissions sees no drafting button", async ({ page }) => {
  await signInTo(page, READER.email);
  await page.goto("/dashboard/consent");
  await expect(page.getByTestId("consent-notices")).toBeVisible();
  await expect(page.getByTestId("consent-notice-draft")).toHaveCount(0);
  await page.goto(`/dashboard/consent/notices/${noticeId}`);
  await expect(page.getByTestId("notice-published")).toBeVisible();
  await expect(page.getByTestId("notice-translate-hi")).toHaveCount(0);
  await page.goto("/dashboard/reports");
  await page.getByTestId("tab-stored").click();
  await expect(page.getByTestId("reports-table")).toBeVisible();
  await expect(page.locator('[data-testid^="narrative-draft-"]')).toHaveCount(0);
});
