/**
 * Slice 11 Stage 2a — drafts for the registers in a browser (SLICE_11 §7b.6–7; D-129).
 *
 * On a disposable tenant (`…a031`), with the assistant on:
 *  - ROPA: "Draft a record from a description" → describe → edit → "Use this
 *    draft" → the new-record form is PRE-FILLED and says so; the register gains
 *    the record only when the person clicks the form's own Save.
 *  - Breach: on the Rule 7(2)(b) step, "Draft the Board intimation" → (iv) is the
 *    placeholder, (vi) is written from the record → Accept → the accepted text
 *    shows with Copy and Download and the attach line; the report is NOT recorded.
 *  - Rights: on the Response step, "Draft a response" → the letter with its
 *    placeholders → Accept → the summary is pre-filled and the outcome is NOT
 *    chosen; saving needs a person to choose it.
 *  - A reader of the registers sees no drafting button, but sees accepted text.
 *
 * Runs against the recorded fake (`AI_PROVIDER=fake`): no live model call.
 */
import { AI_INTIMATION_PERSON_PLACEHOLDER } from "@truststack/core";
import { expect, test, type APIRequestContext, type Page } from "@playwright/test";
import { accessTokenFor, bearer, createE2eTenant, removeE2eTenant, SEED_USERS, seedPassword, withDb } from "../helpers";

const ADMIN = SEED_USERS.muItSecurity;
const READER = SEED_USERS.muDean;
const TENANT = {
  organizationId: "0b0000ff-0000-4000-8000-00000000a031",
  name: "E2E AI Drafts Panel Tenant",
  industryCode: "general",
  member: { userId: ADMIN.id, email: ADMIN.email },
  roleCode: "organization_admin",
  extraMembers: [{ userId: READER.id, roleCode: "executive_sponsor" }],
};
const ORG = TENANT.organizationId;
const api = (path: string) => `/api/v1/organizations/${ORG}${path}`;
const HOUR = 3_600_000;
const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());

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

const ropaCount = () =>
  withDb(async (db) => Number((await db.query("SELECT count(*)::int AS n FROM public.ropa_records WHERE organization_id = $1", [ORG])).rows[0].n));

let breachId = "";
let requestId = "";

test.describe.configure({ mode: "serial" });

test.beforeAll(async ({ playwright }) => {
  test.setTimeout(120_000);
  await createE2eTenant(TENANT);
  const request = await playwright.request.newContext({ baseURL: test.info().project.use.baseURL });
  breachId = (
    await call(request, "POST", api("/breaches"), {
      title: "Examinations portal account used from outside",
      nature: "unauthorised_access",
      severity: "high",
      awareAt: new Date(Date.now() - 5 * HOUR).toISOString(),
      principalsAffected: 1200,
      dataCategories: "Names, roll numbers, marks",
    })
  ).data.incident.id;
  await call(request, "PATCH", api(`/breaches/${breachId}`), { principals: { at: new Date(Date.now() - 2 * HOUR).toISOString(), method: "Email to each student" } });
  requestId = (
    await call(request, "POST", api("/rights-requests"), {
      kind: "access",
      receivedOn: today,
      channel: "email",
      requesterName: "Asha Fictional-Requester",
      requesterEmail: "asha.fictional@example.com",
      summary: "Asks for a summary of the personal data held about her.",
    })
  ).data.request.id;
  await call(request, "PATCH", `/api/v1/organizations/${ORG}`, { ai: { enabled: true, contractRef: "E2E-DPA-DRAFTS-UI" } });
  await request.dispose();
});

test.afterAll(async () => {
  await removeE2eTenant(TENANT);
});

test("ROPA: a description becomes a pre-filled new-record form; the register gains it only on the person's Save", async ({ page }) => {
  test.setTimeout(120_000);
  await signInTo(page, ADMIN.email);
  const before = await ropaCount();
  await page.goto("/dashboard/ropa");
  await page.getByTestId("ropa-ai-draft").click();
  await expect(page.getByTestId("ai-draft-describe")).toBeVisible();
  await expect(page.getByTestId("ai-draft-describe-send")).toBeDisabled();
  await page.getByTestId("ai-draft-description").fill("Through the admissions portal we collect applicants' names, contact details and marks to decide admission.");
  await page.getByTestId("ai-draft-describe-send").click();
  await expect(page.getByTestId("ai-draft")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId("ai-draft-headline")).not.toBeEmpty();
  await expect(page.getByTestId("ai-draft-counsel")).toHaveCount(0); // a register entry, not a legal draft
  await page.getByTestId("ai-draft-field-name").fill("Undergraduate admissions (checked)");
  await page.getByTestId("ai-draft-accept").click();

  await expect(page).toHaveURL(/\/dashboard\/ropa\/new\?draft=/);
  await expect(page.getByTestId("ropa-from-draft")).toContainText("Check every field before you save");
  await expect(page.getByTestId("ropa-field-name")).toHaveValue("Undergraduate admissions (checked)");
  await expect(page.getByTestId("ropa-field-purpose")).not.toHaveValue("");
  expect(await ropaCount()).toBe(before);

  await page.getByTestId("ropa-save").click();
  await expect(page).toHaveURL(/\/dashboard\/ropa\/[0-9a-f-]{36}$/);
  expect(await ropaCount()).toBe(before + 1);
});

test("Breach: the Rule 7(2) intimation is drafted, accepted and offered to copy — the report is not recorded", async ({ page }) => {
  test.setTimeout(120_000);
  await signInTo(page, ADMIN.email);
  await page.goto(`/dashboard/breaches/${breachId}`);
  await expect(page.getByTestId("step-board-report")).toBeVisible();
  await page.getByTestId("breach-ai-draft").click();
  await expect(page.getByTestId("ai-draft")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId("ai-draft-counsel")).toContainText("For review by counsel before use.");
  await expect(page.getByTestId("ai-draft-field-personFindings")).toHaveValue(AI_INTIMATION_PERSON_PLACEHOLDER);
  await expect(page.getByTestId("ai-draft-field-principalsReport")).toHaveValue(/were informed on .* by: Email to each student/);
  await page.getByTestId("ai-draft-accept").click();

  const card = page.getByTestId("breach-ai-intimation");
  await expect(card).toContainText("Attach the copy you actually sent under Documents");
  await expect(card.getByTestId("breach-ai-intimation-copy")).toBeVisible();
  await expect(card.getByTestId("breach-ai-intimation-download")).toBeVisible();
  await card.locator("summary").click();
  await expect(card.getByTestId("breach-ai-intimation-text")).toContainText("such longer period as the Board may allow");
  // Recording that the report was made is still the person's own step.
  await expect(page.getByTestId("form-board-report-open")).toBeVisible();
  await expect(page.getByTestId("step-board-report")).not.toContainText("Report made");
});

test("Rights: the letter is drafted with its placeholders; accepting pre-fills the summary and leaves the outcome to a person", async ({ page }) => {
  test.setTimeout(120_000);
  await signInTo(page, ADMIN.email);
  await page.goto(`/dashboard/rights/${requestId}`);
  await page.getByTestId("rights-ai-draft").click();
  await expect(page.getByTestId("ai-draft")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId("ai-draft-field-letter")).toHaveValue(/Dear \[Name\],/);
  await expect(page.getByTestId("ai-draft-field-letter")).not.toHaveValue(/Asha/);
  await page.getByTestId("ai-draft-accept").click();

  await expect(page.getByTestId("rights-ai-letter")).toBeVisible();
  await expect(page.getByTestId("rights-respond-form")).toBeVisible();
  await expect(page.getByTestId("rights-respond-from-draft")).toBeVisible();
  await expect(page.getByTestId("rights-response-summary")).not.toHaveValue("");
  await expect(page.getByTestId("rights-outcome")).toHaveValue("");
  // Saving without an outcome is refused by the form — a person decides it.
  await page.getByTestId("rights-respond-save").click();
  await expect(page.getByTestId("rights-respond-form")).toBeVisible();
  const status = await withDb(async (db) => (await db.query("SELECT status, outcome FROM public.rights_requests WHERE id = $1", [requestId])).rows[0]);
  expect(status).toEqual({ status: "open", outcome: null });
});

test("a reader of the registers sees no drafting button, but sees the accepted text", async ({ page }) => {
  await signInTo(page, READER.email);
  await page.goto(`/dashboard/breaches/${breachId}`);
  await expect(page.getByTestId("breach-ai-intimation")).toBeVisible();
  await expect(page.getByTestId("breach-ai-draft")).toHaveCount(0);
  await page.goto("/dashboard/ropa");
  await expect(page.getByTestId("ropa-summary")).toBeVisible();
  await expect(page.getByTestId("ropa-ai-draft")).toHaveCount(0);
});
