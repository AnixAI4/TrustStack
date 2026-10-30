/**
 * Slice 10, Stage 3b — notice and consent in a browser.
 *
 *  - An Organisation Admin on a disposable healthcare tenant (`…a01a`, public
 *    pages open) writes the privacy notice, sees what stops it being
 *    published, publishes it, then makes and publishes a widget version and
 *    gets the snippet.
 *  - A visitor on the organisation's own website (served here as
 *    another origin) sees the widget: nothing ticked; chooses one
 *    purpose; later withdraws from "Privacy choices".
 *  - The admin sees both choices; records a child's consent with no
 *    verification and sees it counted; the public notice page shows it all.
 */
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { expect, test, type Page } from "@playwright/test";
import { createE2eTenant, openPublicPages, removeE2eTenant, SEED_USERS, seedPassword } from "../helpers";

const ADMIN = SEED_USERS.muItSecurity;
const TENANT = {
  organizationId: "0b0000ff-0000-4000-8000-00000000a01a",
  name: "E2E Consent UI Healthcare Tenant",
  industryCode: "healthcare",
  member: { userId: ADMIN.id, email: ADMIN.email },
  roleCode: "organization_admin",
};
const SLUG = "e2e-consent-ui-health";
/**
 * The organisation's own website: another ORIGIN, served by a real server this
 * test starts. On loopback like the local server — Chrome refuses a page it
 * cannot place on loopback (an intercepted one counts as public) a loopback
 * script (Private Network Access) — and http, as the local server is.
 */
async function clinicSite(widgetUrl: string): Promise<{ url: string; close: () => Promise<void> }> {
  const html = `<!doctype html><html><head><title>Clinic</title></head><body><h1>Clinic</h1><script src="${widgetUrl}" data-org="${SLUG}" async></script></body></html>`;
  const server = createServer((_req, res) => {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(html);
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address() as AddressInfo;
  return { url: `http://127.0.0.1:${port}/`, close: () => new Promise((resolve) => server.close(() => resolve())) };
}

async function signIn(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(ADMIN.email);
  await page.getByLabel("Password").fill(seedPassword());
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.getByTestId("organization-switcher").selectOption(TENANT.organizationId);
  await expect(page.getByTestId("organization-name")).toHaveText(TENANT.name);
}

test.describe.configure({ mode: "serial" });

test.beforeAll(async () => {
  await createE2eTenant(TENANT);
  await openPublicPages(TENANT.organizationId, SLUG);
});
test.afterAll(async () => {
  await removeE2eTenant(TENANT);
});

test("an admin writes and publishes the notice, then publishes a widget version and gets the snippet", async ({ page }) => {
  await signIn(page);
  await page.getByTestId("nav-consent").click();
  await expect(page.getByTestId("consent-notices-empty")).toBeVisible();
  // Slice 10.5 B3 (F3.6): the widget is its own tab, and its badge says it is not live yet.
  await expect(page.getByTestId("tab-widget")).toContainText("Not live");
  await page.getByTestId("tab-widget").click();
  await expect(page.getByTestId("consent-widget-none")).toBeVisible();
  await page.getByTestId("tab-notice").click();

  await page.getByTestId("consent-notice-new").click();
  // Slice 10.5 B3 (F3.7): a blank notice is not told off — the checks come once a field is left or Save is pressed.
  await expect(page.getByTestId("notice-title")).toBeVisible();
  await expect(page.getByTestId("notice-problems")).toHaveCount(0);
  await page.getByTestId("notice-title").fill("How the clinic uses your personal data");
  await page.getByTestId("purpose-key-0").fill("appointment_reminders");
  await page.getByTestId("purpose-title-0").fill("Appointment reminders");
  await expect(page.getByTestId("notice-problems")).toContainText("Rule 3(b)(ii)");
  await page.getByTestId("purpose-uses-0").fill("Text and email reminders before your appointments.");
  await page.getByTestId("purpose-data-0").fill("Name\nMobile number");
  await page.getByTestId("notice-add-purpose").click();
  await page.getByTestId("purpose-key-1").fill("health_newsletter");
  await page.getByTestId("purpose-title-1").fill("Health newsletter");
  await page.getByTestId("purpose-uses-1").fill("A monthly newsletter on the clinic's services.");
  await page.getByTestId("purpose-data-1").fill("Name\nEmail address");
  await expect(page.getByTestId("notice-problems")).toHaveCount(0);
  await page.getByTestId("notice-save").click();
  await expect(page.getByTestId("notice-message")).toHaveText("Draft saved.");
  await expect(page.getByTestId("notice-heading")).toContainText("English privacy notice — version 1 (draft)");
  await page.getByTestId("notice-publish").click();
  await expect(page.getByTestId("notice-message")).toHaveText("Version 1 is published.");
  await expect(page.getByTestId("notice-published")).toContainText("Name, Mobile number, Email address");

  await page.goto("/dashboard/consent");
  await expect(page.getByTestId("consent-notice-en-v1")).toContainText("Published");
  // F3.6: Notice · Widget · Consent records, one at a time.
  await expect(page.getByTestId("tab-notice")).toHaveAttribute("aria-selected", "true");
  await page.getByTestId("tab-widget").click();
  const widget = page.getByTestId("consent-widget");
  await expect(widget.getByTestId("widget-languages-pending")).toContainText("20 more languages — translation pending");
  await expect(widget.getByTestId("widget-language-ta")).toBeHidden();
  await widget.getByTestId("widget-purpose-appointment_reminders").check();
  await widget.getByTestId("widget-purpose-health_newsletter").check();
  await widget.getByTestId("widget-save").click();
  await widget.getByTestId("widget-publish").click();
  await expect(widget.getByTestId("consent-widget-live")).toContainText("Live: version 1");
  // Staff read the purposes by their titles, not their keys.
  await expect(widget.getByTestId("consent-widget-live")).toContainText("offers Appointment reminders, Health newsletter.");
  await expect(page.locator("main")).not.toContainText("exposure model");
  await expect(widget.getByTestId("consent-widget-snippet")).toContainText(`/widget/consent-v1.js" data-org="${SLUG}"`);
});

test("on the organisation's own website the widget asks with nothing ticked, records a choice, and lets the visitor withdraw", async ({ browser, baseURL }) => {
  const site = await clinicSite(`${baseURL}/widget/consent-v1.js`);
  // No extra headers: the widget makes only simple requests (a GET, and a text/plain POST), and an
  // added header such as X-Forwarded-For would make the browser send a preflight the routes do not answer.
  const context = await browser.newContext();
  const page = await context.newPage();
  try {
    await page.goto(site.url);
    const dialog = page.getByRole("dialog", { name: "We value your privacy" });
    await expect(dialog).toBeVisible();
    // Who is asking, and refusing weighs the same as accepting (s.5, s.6(1); Slice 10.5 B5, F5.1).
    await expect(dialog).toContainText(`${TENANT.name} asks for your consent to use your personal data`);
    await expect(dialog.getByRole("button", { name: "Reject all" })).toHaveClass(/tsw-primary/);
    await expect(dialog.getByRole("button", { name: "Accept all" })).toHaveClass(/tsw-primary/);
    await expect(dialog.getByRole("button", { name: "Accept all" })).not.toBeFocused();
    await expect(dialog).toContainText("Appointment reminders");
    await expect(dialog).toContainText("Personal data: Name, Email address");
    const reminders = page.locator("#tsw-p-appointment_reminders");
    const newsletter = page.locator("#tsw-p-health_newsletter");
    await expect(reminders).not.toBeChecked();
    await expect(newsletter).not.toBeChecked();
    await expect(dialog.getByRole("link", { name: "Read the privacy notice" })).toHaveAttribute("href", `${baseURL}/p/${SLUG}/notice?lang=en`);

    await reminders.check();
    await dialog.getByRole("button", { name: "Save my choices" }).click();
    await expect(page.getByRole("status")).toHaveText("Your choices are saved.");
    await expect(dialog).toHaveCount(0);

    // Next visit: no banner, a "Privacy choices" button; withdrawing is as easy as giving.
    await page.reload();
    await page.getByRole("button", { name: "Privacy choices" }).click();
    await expect(page.locator("#tsw-p-appointment_reminders")).toBeChecked();
    await page.getByRole("button", { name: "Withdraw consent" }).click();
    await expect(page.getByRole("status")).toHaveText("Your consent has been withdrawn.");
  } finally {
    await context.close();
    await site.close();
  }
});

test("the admin sees both choices, records a child's consent with no verification, and the public notice page shows it all", async ({ page }) => {
  await signIn(page);
  await page.goto("/dashboard/consent");
  await expect(page.getByTestId("consent-count-principals")).toHaveText("1");
  await expect(page.getByTestId("consent-count-withdrawn")).toHaveText("1");
  await page.getByTestId("tab-records").click();
  await expect(page.getByTestId("consent-recent-list")).toContainText("Consent withdrawn");
  await expect(page.getByTestId("consent-recent-list")).toContainText("Consent given");
  await expect(page.getByTestId("consent-recent-list")).toContainText("Appointment reminders");
  await expect(page.getByTestId("consent-recent-list")).not.toContainText("appointment_reminders");

  const form = page.getByTestId("consent-record");
  await form.getByTestId("record-identifier").fill("MRN-UI-0007");
  await form.getByTestId("record-purpose-appointment_reminders").check();
  await form.getByTestId("record-kind").selectOption("child");
  await expect(form.getByTestId("record-method")).toHaveValue("");
  await form.getByTestId("record-reference").fill("Paediatric form 7");
  await form.getByTestId("record-submit").click();
  await expect(form.getByTestId("record-message")).toHaveText("Recorded.");
  await expect(page.getByTestId("consent-count-unverified")).toHaveText("1");
  await expect(page.getByTestId("consent-recent-list")).toContainText("no verification recorded");

  const lookup = page.getByTestId("consent-lookup");
  await lookup.getByTestId("lookup-identifier").fill("MRN-UI-0007");
  await lookup.getByTestId("lookup-submit").click();
  await expect(lookup.getByTestId("lookup-now")).toContainText("Consent given — Appointment reminders");

  await page.goto(`/p/${SLUG}/notice`);
  await expect(page.getByTestId("public-title")).toHaveText("How the clinic uses your personal data");
  await expect(page.getByTestId("notice-data-items")).toContainText("Mobile number");
  await expect(page.getByTestId("notice-board")).toContainText("Data Protection Board of India");
  await expect(page.getByTestId("notice-rights-link")).toHaveAttribute("href", `/p/${SLUG}/rights`);
  await page.goto(`/p/${SLUG}`);
  await expect(page.getByTestId("public-notice-link")).toHaveAttribute("href", `/p/${SLUG}/notice`);
});
