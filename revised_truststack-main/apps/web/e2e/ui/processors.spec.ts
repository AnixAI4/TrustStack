/**
 * Slice 10, Stage 4a — the processor register in a browser.
 *
 *  - The Dean (Executive Sponsor) reads Mumbai University's register: the
 *    payment gateway accepted, the LMS provider awaiting review with its
 *    unevidenced claims and the three flags for the reviewer — and is offered
 *    no review. The Registrar, who entered it, is told someone else must review
 *    it. Nothing is written on MU: an accepted assessment is never deleted.
 *  - On a disposable tenant (`…a01c`) an Organisation Admin starts an
 *    assessment, is told a claim with no document scores as the risky answer,
 *    submits it, and cannot review it; Legal accepts it.
 */
import { SCORED_VENDOR_QUESTIONS } from "@truststack/core";
import { expect, test, type Page } from "@playwright/test";
import { accessTokenFor, bearer, createE2eTenant, removeE2eTenant, SEED_SCOPE, SEED_USERS, seedPassword } from "../helpers";

const ADMIN = SEED_USERS.muItSecurity;
const LEGAL = SEED_USERS.muLegal;
const TENANT = {
  organizationId: "0b0000ff-0000-4000-8000-00000000a01c",
  name: "E2E Processor UI Tenant",
  industryCode: "general",
  member: { userId: ADMIN.id, email: ADMIN.email },
  roleCode: "organization_admin",
  extraMembers: [{ userId: LEGAL.id, roleCode: "legal_user" }],
};
const LMS = SEED_SCOPE.mumbaiUniversity.vendors.lmsProvider.id;
const PAYMENTS = SEED_SCOPE.mumbaiUniversity.vendors.paymentGateway.id;
const LMS_ASSESSMENT = "0b000014-0000-4000-8000-000000000022";

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

test.beforeAll(async ({ request }) => {
  await createE2eTenant(TENANT);
  const res = await request.post(`/api/v1/organizations/${TENANT.organizationId}/vendors`, {
    headers: bearer(await accessTokenFor(ADMIN.email)),
    data: { name: "E2E UI Payroll Processor", vendorRole: "data_processor", contractExists: "yes", dpdpClauses: "unknown" },
  });
  expect(res.status(), await res.text()).toBe(201);
  vendorId = (await res.json()).data.item.id;
});
test.afterAll(async () => {
  await removeE2eTenant(TENANT);
});

test("the Dean reads Mumbai University's processors: one accepted, one awaiting review with its flags — and no review for a reader", async ({ page }) => {
  await signIn(page, SEED_USERS.muDean.email);
  await page.getByTestId("nav-processors").click();
  await expect(page).toHaveURL(/\/dashboard\/processors$/);
  await expect(page.getByTestId("processors-count-processors")).toHaveText("3");
  await expect(page.getByTestId("processors-count-contract-gaps")).toHaveText("2");
  // The LMS provider (entered by staff) and, from Stage 4b, the proctoring vendor (answered by the vendor).
  await expect(page.getByTestId("processors-count-awaiting-review")).toHaveText("2");
  await expect(page.getByTestId(`processor-contract-gap-${LMS}`)).toBeVisible();
  await expect(page.getByTestId(`processor-current-${PAYMENTS}`)).toContainText("v1 · risk 16 (Low)");
  // Slice 10.5 B3 (F3.8): a processor whose v1 awaits review has no ACCEPTED assessment — it has been assessed.
  await expect(page.getByTestId("processors-summary")).toContainText("No accepted assessment");
  await expect(page.getByTestId("processors-summary")).not.toContainText("Never assessed");

  await page.goto(`/dashboard/processors/${LMS}/assessments/${LMS_ASSESSMENT}`);
  await expect(page.getByTestId("assessment-status")).toHaveText("Awaiting review");
  // F3.8: each unevidenced claim named by its question, the code in brackets; progress in words.
  await expect(page.getByTestId("assessment-unevidenced")).toContainText("Is the vendor ISO/IEC 27001 certified? (A3);");
  await expect(page.getByTestId("assessment-unevidenced")).toContainText("(C4); ");
  await expect(page.getByTestId("assessment-unevidenced")).toContainText("(G1).");
  await expect(page.getByTestId("assessment-progress")).toHaveText(/^\d+ answered, \d+ not applicable, of \d+$/);
  await expect(page.getByTestId("assessment-flag-contract_vs_register")).toBeVisible();
  await expect(page.getByTestId("assessment-flag-no_subprocessors_vs_register")).toBeVisible();
  await expect(page.getByTestId("assessment-flag-storage_answers_disagree")).toBeVisible();
  await expect(page.getByTestId("q-D2-answer")).toContainText("Not applicable — The vendor says it engages no sub-processors.");
  await expect(page.getByTestId("assessment-review")).toHaveCount(0);
  await expect(page.getByTestId("assessment-save")).toHaveCount(0);
});

test("the Registrar, who entered the LMS provider's assessment, is told someone else must review it", async ({ page }) => {
  await signIn(page, SEED_USERS.mumbaiUniversity.email);
  await page.goto(`/dashboard/processors/${LMS}/assessments/${LMS_ASSESSMENT}`);
  await expect(page.getByTestId("assessment-review-self")).toHaveText("You entered or answered this assessment — someone else must review it.");
  await expect(page.getByTestId("review-accept")).toHaveCount(0);
});

test("an admin starts an assessment, sees an unevidenced claim, submits it and cannot review it; Legal accepts it", async ({ page, request }) => {
  await signIn(page, ADMIN.email);
  await useTenant(page);
  await page.goto("/dashboard/processors");
  await expect(page.getByTestId(`processor-contract-gap-${vendorId}`)).toBeVisible();
  await page.getByTestId(`processor-${vendorId}`).getByRole("link", { name: "E2E UI Payroll Processor" }).click();
  await expect(page.getByTestId("processor-contract-gap")).toBeVisible();
  // Slice 10.5 B0: the processor page is in tabs — Contract · Assessments · Documents.
  await page.getByTestId("tab-assessments").click();
  await expect(page.getByTestId("processor-no-assessment")).toBeVisible();
  await page.getByTestId("processor-start-assessment").click();
  await expect(page).toHaveURL(/\/assessments\/[0-9a-f-]{36}$/);
  const assessmentId = page.url().split("/").pop()!;
  await expect(page.getByTestId("assessment-status")).toHaveText("Draft");

  // Submitting an empty draft is refused by the database, in words.
  await page.getByTestId("assessment-submit").click();
  await expect(page.getByTestId("assessment-action-error")).toContainText("Say where the answers came from");

  await page.getByTestId("assessment-source-note").fill("The vendor's email of 3 Oct 2026");
  await page.getByTestId("q-A3-yes").check();
  await expect(page.getByTestId("q-A3-claimed")).toContainText("Claimed, no evidence");
  await page.getByTestId("assessment-save").click();
  await expect(page.getByTestId("assessment-notice")).toHaveText("Saved.");
  await expect(page.getByTestId("assessment-unevidenced")).toContainText("Is the vendor ISO/IEC 27001 certified? (A3)");

  // The other 43 answers through the API (what the form sends), then submit in the browser.
  const answers = SCORED_VENDOR_QUESTIONS.filter((q) => q.code !== "A3").map((q) =>
    q.type === "select" ? { code: q.code, answer: q.options!.find((o) => o.riskTenths === 0)!.value } : { code: q.code, answer: q.riskyAnswer === "no" ? "yes" : "no" },
  );
  const saved = await request.patch(`/api/v1/organizations/${TENANT.organizationId}/processors/${vendorId}/assessments/${assessmentId}`, {
    headers: bearer(await accessTokenFor(ADMIN.email)),
    data: { sourceNote: "The vendor's email of 3 Oct 2026", answers },
  });
  expect(saved.status(), await saved.text()).toBe(200);
  await page.reload();
  await page.getByTestId("assessment-submit").click();
  await expect(page.getByTestId("assessment-status")).toHaveText("Awaiting review");
  await expect(page.getByTestId("assessment-submitted")).toContainText("MU IT/Security Lead");
  await expect(page.getByTestId("assessment-review-self")).toBeVisible();

  // Legal, who entered nothing, accepts it.
  await page.context().clearCookies();
  await signIn(page, LEGAL.email);
  await useTenant(page);
  await page.goto(`/dashboard/processors/${vendorId}/assessments/${assessmentId}`);
  await page.getByTestId("review-accept").click();
  await expect(page.getByTestId("assessment-status")).toHaveText("Accepted");
  await expect(page.getByTestId("assessment-reviewed")).toContainText("MU Legal Counsel");
  await expect(page.getByTestId("assessment-reviewed")).toContainText("review by");
  await expect(page.getByTestId("assessment-review")).toHaveCount(0);
});
