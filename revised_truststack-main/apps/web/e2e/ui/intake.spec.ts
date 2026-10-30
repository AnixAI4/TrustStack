/**
 * Slice 10, Stage 3a — public intake in a browser.
 *
 *  - An Organisation Admin on a disposable healthcare tenant (`…a017`) opens
 *    its public pages from the Organisation page: an address and the Rule 9
 *    contact.
 *  - A Data Principal — signed out, in a fresh browser — finds the page,
 *    makes an erasure request, enters the emailed code (a wrong one first),
 *    and gets the reference and the respond-by date.
 *  - The admin finds it in the register, labelled "Web form", recorded by
 *    the public form.
 *  - An unknown address is a plain not-found page.
 *  - Slice 10.5 B5: one name for the organisation, a way back from each form,
 *    a Send button that says a code comes next, and one plain not-found page
 *    for every dead public target (F5.2–F5.4).
 */
import { expect, test, type Page } from "@playwright/test";
import { createE2eTenant, giveSubmissionKnownCode, removeE2eTenant, SEED_USERS, seedPassword, waitingSubmissionFor } from "../helpers";

const ADMIN = SEED_USERS.muItSecurity;
const TENANT = {
  organizationId: "0b0000ff-0000-4000-8000-00000000a017",
  name: "E2E Public Intake UI Healthcare Tenant",
  industryCode: "healthcare",
  member: { userId: ADMIN.id, email: ADMIN.email },
  roleCode: "organization_admin",
};
const SLUG = "e2e-intake-ui-health";

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

let requestCode = "";

test("an admin opens the public pages with the Rule 9 contact", async ({ page }) => {
  await signIn(page, ADMIN.email);
  await page.getByTestId("organization-switcher").selectOption(TENANT.organizationId);
  await expect(page.getByTestId("organization-name")).toHaveText(TENANT.name);
  await page.goto("/dashboard/organization");
  // Slice 10.5 B1 (F1.10): public pages are one of the four settings tabs.
  await page.getByTestId("tab-public-pages").click();
  const form = page.getByTestId("public-pages-form");
  await expect(form.getByTestId("public-pages-status")).toContainText("Closed.");
  // The grey text is only a suggestion: saving an empty address warns, it does not open anything.
  await expect(form.getByTestId("public-slug")).toHaveValue("");
  await form.getByTestId("public-contact-name").fill("Dr Meera Iyer");
  await form.getByTestId("public-contact-email").fill("dpo@e2e-ui-health.example.com");
  await form.getByTestId("public-pages-save").click();
  await expect(form.getByTestId("public-pages-message")).toContainText("still closed: the address box is empty");
  await expect(form.getByTestId("public-pages-status")).toContainText("Closed.");
  await form.getByTestId("public-slug-suggest").click();
  await expect(form.getByTestId("public-slug")).not.toHaveValue("");
  await form.getByTestId("public-slug").fill(SLUG);
  await form.getByTestId("public-contact-name").fill("Dr Meera Iyer");
  await form.getByTestId("public-contact-email").fill("dpo@e2e-ui-health.example.com");
  await form.getByTestId("public-contact-is-dpo").check();
  await form.getByTestId("public-pages-save").click();
  await expect(form.getByTestId("public-pages-message")).toHaveText("Public pages saved.");
  await expect(form.getByTestId("public-pages-link")).toHaveText(`/p/${SLUG}`);
});

test("a Data Principal makes an erasure request, confirms the code, and gets the reference", async ({ browser }) => {
  // Signed out, from their own address: a fresh context.
  const context = await browser.newContext({ extraHTTPHeaders: { "X-Forwarded-For": "192.0.2.17" } });
  const page = await context.newPage();
  const email = `e2e-intake-ui-${Date.now()}@example.com`;
  try {
    await page.goto(`/p/${SLUG}`);
    await expect(page.getByTestId("public-title")).toHaveText("Your personal data");
    await expect(page.getByTestId("public-contact")).toContainText("Dr Meera Iyer, Data Protection Officer · dpo@e2e-ui-health.example.com");
    await expect(page.getByTestId("public-back")).toHaveCount(0); // the home page needs no way back
    await expect(page.locator("footer")).toContainText(`${TENANT.name} answers every request and grievance within ninety days`);
    await page.getByTestId("public-rights-link").click();
    await expect(page).toHaveURL(new RegExp(`/p/${SLUG}/rights$`));
    await expect(page.getByTestId("public-back")).toHaveText(`← Back to ${TENANT.name}’s privacy page`);
    await expect(page.getByTestId("public-back")).toHaveAttribute("href", `/p/${SLUG}`);
    await expect(page.getByTestId("intake-submit")).toHaveText("Send — we'll email you a code");

    await page.getByTestId("intake-kind-erasure").check();
    await page.getByTestId("intake-name").fill("E2E UI Visitor");
    await page.getByTestId("intake-email").fill(email);
    await page.getByTestId("intake-identifier").fill("Patient number UI-7731");
    await page.getByTestId("intake-summary").fill("Please erase the old mobile number you hold for me.");
    await page.getByTestId("intake-submit").click();

    await expect(page.getByTestId("intake-code-sent")).toContainText("We sent a six-digit code to e2");
    await expect(page.getByTestId("intake-code-sent")).not.toContainText(email);
    const code = await giveSubmissionKnownCode(await waitingSubmissionFor(email));

    await page.getByTestId("intake-code").fill("000000");
    await page.getByTestId("intake-confirm").click();
    await expect(page.getByTestId("intake-error")).toContainText("That code is not right. Check the email and try again. 4 tries left.");
    await expect(page.getByTestId("intake-restart")).toHaveCount(0);

    await page.getByTestId("intake-code").fill(code);
    await page.getByTestId("intake-confirm").click();
    await expect(page.getByTestId("intake-done")).toContainText("Your request has been received");
    requestCode = (await page.getByTestId("intake-reference").textContent()) ?? "";
    expect(requestCode).toMatch(/^DPR-\d{4}-001$/);
    const today = new Intl.DateTimeFormat("en-IN", { dateStyle: "long", timeZone: "Asia/Kolkata" }).format(new Date());
    await expect(page.getByTestId("intake-received-on")).toHaveText(today);
    await expect(page.getByTestId("intake-done")).toContainText("may ask you to confirm your identity");
  } finally {
    await context.close();
  }
});

test("the admin finds it in the register, labelled Web form, recorded by the public form", async ({ page }) => {
  expect(requestCode).not.toBe("");
  await signIn(page, ADMIN.email);
  await page.getByTestId("organization-switcher").selectOption(TENANT.organizationId);
  await expect(page.getByTestId("organization-name")).toHaveText(TENANT.name);
  await page.goto("/dashboard/rights");
  await expect(page.getByTestId(`rights-web-form-${requestCode}`)).toHaveText("Web form");
  await page.getByTestId(`rights-${requestCode}`).getByRole("link").click();
  await expect(page.getByTestId("rights-details")).toContainText("The public form, email address confirmed");
  await expect(page.getByTestId("rights-details")).toContainText("Patient number UI-7731");
});

test("when the code email could not be sent, the page says so once, with what to do (F1.12)", async ({ browser }) => {
  const context = await browser.newContext({ extraHTTPHeaders: { "X-Forwarded-For": "192.0.2.23" } });
  const page = await context.newPage();
  // The email provider is down: the API's own answer is replayed with emailed = false (as the
  // provider timing out would make it) — what is tested is what the page then says.
  const failSend = async (route: import("@playwright/test").Route) => {
    const res = await route.fetch();
    const body = await res.json();
    if (body?.data) body.data.emailed = false;
    await route.fulfill({ response: res, json: body });
  };
  await page.route(`**/api/v1/public/${SLUG}/submissions`, failSend);
  await page.route(`**/api/v1/public/${SLUG}/submissions/*/resend`, failSend);
  try {
    await page.goto(`/p/${SLUG}/rights`);
    await page.getByTestId("intake-kind-erasure").check();
    await page.getByTestId("intake-name").fill("E2E UI Unsent");
    await page.getByTestId("intake-email").fill(`e2e-intake-ui-unsent-${Date.now()}@example.com`);
    await page.getByTestId("intake-summary").fill("Please erase my old address.");
    await page.getByTestId("intake-submit").click();

    const message = `We could not send the email just now. Wait a minute, then choose Send a new code. Nothing reaches ${TENANT.name} until a code is entered.`;
    await expect(page.getByTestId("intake-code-sent")).toHaveText(message);
    // Wait for the resend's (failed) answer before reading the page.
    await Promise.all([
      page.waitForResponse((r) => r.url().endsWith("/resend") && r.request().method() === "POST"),
      page.getByTestId("intake-resend").click(),
    ]);
    await expect(page.getByTestId("intake-resend")).toBeEnabled();
    await expect(page.getByTestId("intake-code-sent")).toHaveText(message);
    // One message, not two.
    await expect(page.getByTestId("intake-notice")).toHaveCount(0);
    await expect(page.getByText("We could not send the email")).toHaveCount(1);
  } finally {
    await context.close();
  }
});

test("an unknown public address is a plain not-found page — the same one as a missing notice or a dead vendor link", async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  try {
    const res = await page.goto("/p/e2e-intake-nobody-here/rights");
    expect(res?.status()).toBe(404);
    await expect(page.getByTestId("intake-form")).toHaveCount(0);
    const dead = page.getByTestId("public-not-found");
    await expect(dead).toContainText("This page is not available");
    await expect(dead).toContainText("ask them for a new one");
    const words = (await dead.textContent()) ?? "";
    // No notice is published on this tenant, a malformed address, and a vendor link that never existed: the same page.
    for (const path of [`/p/${SLUG}/notice`, "/p/Not_A_Slug", "/v/not-a-real-token"]) {
      expect((await page.goto(path))?.status(), path).toBe(404);
      await expect(page.getByTestId("public-not-found")).toHaveText(words);
    }
  } finally {
    await context.close();
  }
});
