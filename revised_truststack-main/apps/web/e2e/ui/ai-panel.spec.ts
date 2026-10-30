/**
 * Slice 11 Stage 1b — the TrustStack Assistant in a browser (SLICE_11 §7a.5–6).
 *
 *  - On Mumbai University (assistant on in the seed) the Dean sees the Explain
 *    buttons and the AI settings tab read-only; nothing is clicked there, so no
 *    draft is stored on a seeded tenant (pitfall 5).
 *  - On a disposable tenant (`…a029`) an Organisation Admin turns the assistant
 *    on in Organisation settings with the contract reference, then opens each
 *    helper — a question, its evidence, a domain's score, a gap and an action —
 *    in the side panel: the answer, why it matters, one next step, the law
 *    folded, the review note and caveat; rates one; sees a refused answer
 *    explained; and turns the assistant off, after which no Explain button shows.
 *
 * Runs against the recorded fake (`AI_PROVIDER=fake`): no live model call.
 */
import { expect, test, type APIRequestContext, type Page } from "@playwright/test";
import { accessTokenFor, bearer, createE2eTenant, removeE2eTenant, SEED_ASSESSMENTS, SEED_USERS, seedPassword } from "../helpers";

const ADMIN = SEED_USERS.muItSecurity;
const TENANT = {
  organizationId: "0b0000ff-0000-4000-8000-00000000a029",
  name: "E2E AI Panel Tenant",
  industryCode: "general",
  member: { userId: ADMIN.id, email: ADMIN.email },
  roleCode: "organization_admin",
  extraMembers: [{ userId: SEED_USERS.muLegal.id, roleCode: "department_owner" }],
};
const ORG = TENANT.organizationId;
const api = (path: string) => `/api/v1/organizations/${ORG}${path}`;

async function call(request: APIRequestContext, method: string, url: string, data?: object) {
  const res = await request.fetch(url, { method, headers: bearer(await accessTokenFor(ADMIN.email)), ...(data ? { data } : {}) });
  const text = await res.text();
  expect(res.status(), text).toBeLessThan(300);
  return text ? JSON.parse(text) : null;
}

async function signIn(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(seedPassword());
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

/** Opens a helper and waits for its answer. */
async function explain(page: Page, testId: string) {
  await page.getByTestId(testId).click();
  await expect(page.getByTestId("ai-panel")).toBeVisible();
  await expect(page.getByTestId("ai-answer")).toBeVisible({ timeout: 30_000 });
}

let assessmentId = "";
let answered = "";

test.describe.configure({ mode: "serial" });

test.beforeAll(async ({ playwright }) => {
  test.setTimeout(120_000);
  await createE2eTenant(TENANT);
  const request = await playwright.request.newContext({ baseURL: test.info().project.use.baseURL });
  await call(request, "PUT", api("/scope"), {
    industryCode: "general",
    dataPrincipalCountEstimate: 800,
    answers: {
      childrenData: "no",
      usesDataProcessors: "no",
      aiUsageTypes: [],
      marketingTracking: "no",
      crossBorder: "no",
      multiLocation: false,
      publicFacingPortal: "no",
      sensitiveDocuments: "no",
    },
  });
  assessmentId = (await call(request, "POST", api("/assessments"), { name: "E2E AI Panel Baseline" })).data.assessment.id;
  const questions = (await call(request, "GET", api(`/assessments/${assessmentId}/questions`))).data.questions as { questionCode: string; domainCode: string }[];
  answered = questions.find((q) => q.domainCode === "SECURITY")!.questionCode;
  await call(request, "PUT", api(`/assessments/${assessmentId}/responses/${answered}`), { applicabilityDecision: "applicable", claimedMaturity: 4 });
  await call(request, "POST", api(`/assessments/${assessmentId}/gaps/generate`));
  await request.dispose();
});

test.afterAll(async () => {
  await removeE2eTenant(TENANT);
});

test("Mumbai University: the Dean sees the Explain buttons and the AI settings read-only", async ({ page }) => {
  await signIn(page, SEED_USERS.muDean.email);
  await page.goto(`/dashboard/assessments/${SEED_ASSESSMENTS.muBaseline.id}`);
  await expect(page.getByTestId("ai-explain-question-G1.2")).toBeVisible();
  await page.goto("/dashboard/organization#ai");
  await expect(page.getByTestId("ai-settings-status")).toContainText("On since");
  await expect(page.getByTestId("ai-settings-status")).toContainText("DEMO-DPA-AI-0001");
  await expect(page.getByTestId("ai-settings-readonly")).toBeVisible();
  await expect(page.getByTestId("ai-settings-on")).toHaveCount(0);
  await expect(page.getByTestId("ai-settings-off")).toHaveCount(0);
});

test("an admin turns the assistant on, opens each helper in the side panel, rates an answer, and turns it off", async ({ page }) => {
  test.setTimeout(180_000);
  await signIn(page, ADMIN.email);
  await page.getByTestId("organization-switcher").selectOption(ORG);
  await expect(page.getByTestId("organization-name")).toHaveText(TENANT.name);

  // Off by default: no Explain button anywhere.
  await page.goto(`/dashboard/assessments/${assessmentId}#SECURITY`);
  await expect(page.getByTestId(`aq-${answered}`)).toBeVisible();
  await expect(page.getByTestId(`ai-explain-question-${answered}`)).toHaveCount(0);

  // A2: on only with the contract reference.
  await page.goto("/dashboard/organization#ai");
  await expect(page.getByTestId("ai-settings-status")).toHaveText("Off. No contract reference has been recorded.");
  await expect(page.getByTestId("ai-settings-on")).toBeDisabled();
  await page.getByTestId("ai-settings-contract").fill("E2E-DPA-PANEL-01");
  await page.getByTestId("ai-settings-on").click();
  await expect(page.getByTestId("ai-settings-message")).toHaveText("The AI assistant is on.");
  await expect(page.getByTestId("ai-settings-status")).toContainText("under contract E2E-DPA-PANEL-01");
  await expect(page.getByTestId("ai-settings-status")).toContainText(`turned on by ${ADMIN.fullName}`);

  // The Question Helper: the one shape (§4.13).
  await page.goto(`/dashboard/assessments/${assessmentId}#SECURITY`);
  await explain(page, `ai-explain-question-${answered}`);
  await expect(page.getByTestId("ai-answer-headline")).not.toBeEmpty();
  await expect(page.getByTestId("ai-answer-why")).not.toBeEmpty();
  await expect(page.getByTestId("ai-answer-review-note")).toHaveText(/a person must review it/);
  await expect(page.getByTestId("ai-answer-caveat")).toContainText("not a final legal opinion");
  const law = page.getByTestId("ai-answer-law");
  await expect(law.getByText("s.8(5)")).toBeHidden(); // folded away by default
  await law.locator("summary").click();
  await expect(law.getByText("s.8(5)")).toBeVisible();
  await expect(law.getByText("The law").first()).toBeVisible();
  // Thumbs up, with a comment — once.
  await page.getByTestId("ai-feedback-up").click();
  await page.getByTestId("ai-feedback-comment").fill("Clear.");
  await page.getByTestId("ai-feedback-send").click();
  await expect(page.getByTestId("ai-feedback-sent")).toHaveText("You rated this answer helpful. Thank you.");
  // The next step goes to the question's own answer form.
  await page.getByTestId("ai-answer-next-step").click();
  await expect(page.getByTestId("ai-panel")).toHaveCount(0);
  await expect(page.getByTestId(`claim-${answered}`)).toBeFocused();

  // A refused answer is explained, not shown (§4.11).
  await explain(page, `ai-explain-question-${answered}`);
  await page.getByTestId("ai-panel-ask").fill("[fake:certifies]");
  await page.getByTestId("ai-panel-ask-send").click();
  await expect(page.getByTestId("ai-panel-error")).toContainText("That answer was not kept");
  await expect(page.getByTestId("ai-panel-error")).toContainText("calling an organisation compliant");
  await page.getByTestId("ai-panel-close").click();

  // The Evidence Helper, on the answer's evidence section.
  await explain(page, `ai-explain-evidence-${answered}`);
  await expect(page.getByTestId("ai-panel")).toContainText("Is this evidence enough?");
  await expect(page.getByTestId("ai-answer-headline")).toContainText("reviewed evidence");
  await page.keyboard.press("Escape");
  await expect(page.getByTestId("ai-panel")).toHaveCount(0);

  // The Score Helper, on the scorecard.
  await page.getByTestId("tab-score").click();
  await explain(page, "ai-explain-score-SECURITY");
  await expect(page.getByTestId("ai-panel-subject")).toHaveText("Security safeguards");
  await page.getByTestId("ai-panel-close").click();

  // The Gap Helper, on the gap register.
  await page.goto(`/dashboard/assessments/${assessmentId}/gaps`);
  const gapButton = page.locator('[data-testid^="ai-explain-gap-"]:visible').first();
  await gapButton.click();
  await expect(page.getByTestId("ai-answer")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId("ai-panel")).toContainText("Explain this gap");
  await page.getByTestId("ai-panel-close").click();

  // The Action Helper, on the one Actions page — assessment actions only.
  await page.goto("/dashboard/actions");
  await page.getByTestId("tab-all").click();
  const actionButton = page.locator('[data-testid^="ai-explain-action-"]:visible').first();
  await actionButton.click();
  await expect(page.getByTestId("ai-answer")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId("ai-panel")).toContainText("Explain this action");
  await page.getByTestId("ai-panel-close").click();

  // Off is immediate: the buttons go.
  await page.goto("/dashboard/organization#ai");
  await page.getByTestId("ai-settings-off").click();
  await expect(page.getByTestId("ai-settings-message")).toContainText("The AI assistant is off.");
  await expect(page.getByTestId("ai-settings-status")).toHaveText("Off. The last contract reference recorded was E2E-DPA-PANEL-01.");
  await page.goto(`/dashboard/assessments/${assessmentId}#SECURITY`);
  await expect(page.getByTestId(`aq-${answered}`)).toBeVisible();
  await expect(page.getByTestId(`ai-explain-question-${answered}`)).toHaveCount(0);
});
