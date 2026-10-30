/**
 * Slice 10, Stage 4b — the vendor-facing link in a browser.
 *
 *  - The Dean reads Mumbai University's seeded vendor-answered assessment (the
 *    AI proctoring vendor): the declaration, answers by the vendor's
 *    respondent, the vendor's own document. Legal, who sent its link, is told
 *    someone else must review it. Nothing is written on MU.
 *  - On a disposable tenant (`…a01f`) Legal sends a link; the page shows it
 *    open and the answers locked; the respondent, in a separate browser with no
 *    sign-in, confirms the code, answers, signs and submits; Legal may not
 *    review; the Organisation Admin can.
 */
import { SCORED_VENDOR_QUESTIONS, VENDOR_QUESTION_SECTIONS } from "@truststack/core";
import { SEED_VENDOR_LINK } from "@truststack/db/seed-data";
import { expect, test, type Page } from "@playwright/test";
import {
  accessTokenFor,
  bearer,
  createE2eTenant,
  giveVendorLinkKnownCode,
  giveVendorLinkKnownToken,
  removeE2eTenant,
  SEED_SCOPE,
  SEED_USERS,
  seedPassword,
} from "../helpers";

const ADMIN = SEED_USERS.muItSecurity;
const LEGAL = SEED_USERS.muLegal;
const TENANT = {
  organizationId: "0b0000ff-0000-4000-8000-00000000a01f",
  name: "E2E Vendor Link UI Tenant",
  industryCode: "healthcare",
  member: { userId: ADMIN.id, email: ADMIN.email },
  roleCode: "organization_admin",
  extraMembers: [{ userId: LEGAL.id, roleCode: "legal_user" }],
};
const PROCTORING = SEED_SCOPE.mumbaiUniversity.vendors.proctoringVendor.id;

async function signIn(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(seedPassword());
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

async function useTenant(page: Page) {
  await page.getByTestId("organization-switcher").selectOption(TENANT.organizationId);
  await expect(page.getByTestId("organization-name")).toHaveText(TENANT.name);
}

test.describe.configure({ mode: "serial" });

let vendorId = "";
let assessmentId = "";

test.beforeAll(async ({ request }) => {
  await createE2eTenant(TENANT);
  const headers = bearer(await accessTokenFor(ADMIN.email));
  const res = await request.post(`/api/v1/organizations/${TENANT.organizationId}/vendors`, {
    headers,
    data: { name: "E2E UI Lab Results Processor", vendorRole: "data_processor", contractExists: "yes", dpdpClauses: "yes", crossBorder: "no", subProcessorsKnown: "yes" },
  });
  expect(res.status(), await res.text()).toBe(201);
  vendorId = (await res.json()).data.item.id;
  // Legal starts it and sends it; the Admin, who did neither, reviews.
  const started = await request.post(`/api/v1/organizations/${TENANT.organizationId}/processors/${vendorId}/assessments`, {
    headers: bearer(await accessTokenFor(LEGAL.email)),
  });
  expect(started.status(), await started.text()).toBe(201);
  assessmentId = (await started.json()).data.assessment.id;
});
test.afterAll(async () => {
  await removeE2eTenant(TENANT);
});

test("the Dean reads MU's vendor-answered assessment; Legal, who sent its link, is told someone else must review it", async ({ page, browser }) => {
  await signIn(page, SEED_USERS.muDean.email);
  await page.goto(`/dashboard/processors/${PROCTORING}/assessments/${SEED_VENDOR_LINK.assessmentId}`);
  await expect(page.getByTestId("assessment-status")).toHaveText("Awaiting review");
  await expect(page.getByTestId("assessment-source")).toContainText("Answered by the vendor");
  await expect(page.getByTestId("assessment-declaration")).toContainText(`signed ${SEED_VENDOR_LINK.respondentName}, ${SEED_VENDOR_LINK.declaredRole}`);
  await expect(page.getByTestId("assessment-submitted")).toContainText("the vendor's respondent");
  // B5a (N1): the questionnaire is in section tabs; C is Security.
  await page.getByTestId("tab-security").click();
  await expect(page.getByTestId("q-C1-by-vendor")).toBeVisible();
  // Slice 10.5 B3 (F3.8): claims named by their question, the code in brackets.
  await expect(page.getByTestId("assessment-unevidenced")).toContainText("Is the vendor ISO/IEC 27001 certified? (A3); ");
  await expect(page.getByTestId("assessment-unevidenced")).toContainText("(D2).");
  await expect(page.getByTestId("q-A4-answer")).toContainText("(from the vendor)");

  const legal = await (await browser.newContext()).newPage();
  await signIn(legal, LEGAL.email);
  await legal.goto(`/dashboard/processors/${PROCTORING}/assessments/${SEED_VENDOR_LINK.assessmentId}`);
  await expect(legal.getByTestId("assessment-review-self")).toHaveText("You sent this assessment to the vendor — someone else must review their answers.");
  await expect(legal.getByTestId("review-accept")).toHaveCount(0);
});

test("Legal sends a link; the vendor answers in its own browser, signs and submits; Legal may not review, the Admin accepts", async ({ page, browser }) => {
  await signIn(page, LEGAL.email);
  await useTenant(page);
  await page.goto(`/dashboard/processors/${vendorId}/assessments/${assessmentId}`);
  await page.getByTestId("vendor-link-name").fill("E2E Lab Respondent");
  await page.getByTestId("vendor-link-email").fill("e2e-vendor-link-ui@example.com");
  await page.getByTestId("vendor-link-send").click();
  await expect(page.getByTestId("vendor-link-open")).toContainText("sent to E2E Lab Respondent (e2e-vendor-link-ui@example.com)");
  await expect(page.getByTestId("assessment-notice")).toContainText("It works for 14 days.");
  // While the vendor answers, the staff form is locked.
  await expect(page.getByTestId("assessment-save")).toHaveCount(0);
  await expect(page.getByTestId("assessment-source")).toContainText("Answered by the vendor");

  // The respondent: a separate browser, nobody signed in.
  const token = await giveVendorLinkKnownToken(assessmentId);
  const vendorContext = await browser.newContext();
  const vendor = await vendorContext.newPage();
  await vendor.goto(`/v/${token}`);
  await expect(vendor.getByTestId("vendor-link-title")).toHaveText("Processor questionnaire — E2E UI Lab Results Processor");
  await expect(vendor.getByTestId("vendor-link-send-code")).toHaveText("Email me a code");
  await expect(vendor.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  await vendor.getByTestId("vendor-link-send-code").click();
  await expect(vendor.getByTestId("vendor-link-code-sent")).toContainText("We sent a code to e2");
  const code = await giveVendorLinkKnownCode(token);
  await vendor.getByTestId("vendor-link-code").fill(code);
  await vendor.getByTestId("vendor-link-confirm-code").click();
  await expect(vendor.getByTestId("section-company")).toBeVisible();
  // The vendor reads the questions in its own voice (F5.5); the staff page keeps "Do they…".
  await expect(vendor.getByTestId("q-G4")).toContainText(`Do you process ${TENANT.name}'s data only on its documented instructions`);
  await expect(vendor.getByTestId("q-A3")).toContainText("Is your company ISO/IEC 27001 certified?");
  await expect(vendor.getByTestId("vendor-link-progress")).toHaveText(`0 of ${SCORED_VENDOR_QUESTIONS.length} questions answered`);

  // B5a (N1): one tab per section. "Next" saves and moves on.
  const scoredIn = (section: string) => SCORED_VENDOR_QUESTIONS.filter((q) => q.section === section);
  const answerSafely = async (section: string) => {
    for (const q of scoredIn(section)) {
      if (q.type === "select") await vendor.getByTestId(`q-${q.code}-select`).selectOption(q.options!.find((o) => o.riskTenths === 0)!.value);
      else await vendor.getByTestId(`q-${q.code}-${q.riskyAnswer === "no" ? "yes" : "no"}`).check();
    }
  };
  await answerSafely("company");
  await expect(vendor.getByTestId("tab-company")).toContainText(`${scoredIn("company").length}/${scoredIn("company").length}`);
  await vendor.getByTestId("step-next-company").click();
  await expect(vendor.getByTestId("vendor-link-notice")).toHaveText("Saved.");
  await expect(vendor.getByTestId("section-data_handling")).toBeVisible();
  // Every other scored question, with no risk — then one risky answer, saved and reloaded.
  for (const section of VENDOR_QUESTION_SECTIONS.filter((s) => s !== "company")) {
    await vendor.getByTestId(`tab-${section}`).click();
    await answerSafely(section);
  }
  await vendor.getByTestId("tab-security").click();
  await vendor.getByTestId("q-C1-no").check();
  await expect(vendor.getByTestId("vendor-link-progress")).toHaveText(
    `${SCORED_VENDOR_QUESTIONS.length} of ${SCORED_VENDOR_QUESTIONS.length} questions answered`,
  );
  await vendor.getByTestId("vendor-link-save").click();
  await expect(vendor.getByTestId("vendor-link-notice")).toHaveText("Saved.");
  await vendor.reload();
  await expect(vendor.getByTestId("vendor-link-missing")).toHaveCount(0);
  await expect(vendor.getByTestId("q-C1-no")).toBeChecked();
  await vendor.getByTestId("tab-company").click();
  await expect(vendor.getByTestId("q-A3-claimed")).toBeVisible();
  // The last tab: where each section stands, the declaration and the one Submit.
  await vendor.getByTestId("tab-review").click();
  await expect(vendor.getByTestId("vendor-link-review-company")).toContainText(`${scoredIn("company").length} of ${scoredIn("company").length} answered`);
  await expect(vendor.getByTestId("vendor-link-review-claimed")).toContainText("A3");
  await vendor.getByTestId("vendor-link-declared-role").fill("Head of Security");
  await expect(vendor.getByTestId("vendor-link-submit")).toBeDisabled();
  await vendor.getByTestId("vendor-link-accurate").check();
  await vendor.getByTestId("vendor-link-submit").click();
  await expect(vendor.getByTestId("vendor-link-submitted")).toContainText("Thank you — your answers were submitted");
  await vendor.goto(`/v/${token}`);
  await expect(vendor.getByTestId("vendor-link-title")).toHaveCount(0); // the same not-found page as any dead link
  await expect(vendor.getByTestId("public-not-found")).toContainText("This page is not available");
  await vendorContext.close();

  // Back at the organisation: Legal sent it, so may not review.
  await page.reload();
  await expect(page.getByTestId("assessment-status")).toHaveText("Awaiting review");
  await expect(page.getByTestId("assessment-declaration")).toContainText("signed E2E Lab Respondent, Head of Security");
  await expect(page.getByTestId("q-C1-answer")).toContainText("No");
  await expect(page.getByTestId("assessment-review-self")).toHaveText("You sent this assessment to the vendor — someone else must review their answers.");

  const admin = await (await browser.newContext()).newPage();
  await signIn(admin, ADMIN.email);
  await useTenant(admin);
  await admin.goto(`/dashboard/processors/${vendorId}/assessments/${assessmentId}`);
  await admin.getByTestId("review-accept").click();
  await expect(admin.getByTestId("assessment-status")).toHaveText("Accepted");
});
