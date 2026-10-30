/**
 * Slice 9, Stage 2 — the Exposure Command Centre and the overview's exposure
 * strip, in a browser, on Mumbai University's real data.
 *
 *  - The Dean (read-only) reaches the Command Centre from the overview, sees
 *    the headline, all five modelled heads, both caveats verbatim, and no way
 *    to record a snapshot; a what-if moves the figures and writes nothing.
 *  - The DPDP Programme Owner is offered "Record a snapshot now".
 *
 * Recording is exercised through the API on a disposable tenant
 * (`e2e/api/exposure.spec.ts`): a stored snapshot is immutable, so this file
 * never records one on MU. It creates nothing.
 */
import { expect, test, type Page } from "@playwright/test";
import { actionsOpenLabel, CEILINGS_AT_STAKE_HEADING } from "@truststack/core";
import { accessTokenFor, bearer, SEED_ORGS, SEED_USERS, seedPassword, withDb } from "../helpers";

const MU = SEED_ORGS.mumbaiUniversity;
const CAVEAT_EXPOSURE =
  "Exposure figures are indicative positions within statutory ceilings in the Schedule to the DPDP Act 2023, derived from your own assessment, register and remediation data under TrustStack exposure model 1.7.0. They are not a prediction of any decision of the Data Protection Board, which imposes a penalty only after an inquiry finds a breach significant and weighs the factors in section 33(2). They are not legal advice.";

async function signIn(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(seedPassword());
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

test.beforeAll(async ({ request }) => {
  // The register's gaps are generated on request (D-062); make sure MU has
  // them, so there is open work on heads at stake to rank.
  const res = await request.post(`/api/v1/organizations/${MU.id}/ropa/gaps/generate`, {
    headers: bearer(await accessTokenFor(SEED_USERS.consultant.email)),
  });
  expect(res.status(), await res.text()).toBe(200);
});

test("the Dean reaches the Command Centre from the overview and reads every head, read-only", async ({ page }) => {
  await signIn(page, SEED_USERS.muDean.email);

  const strip = page.getByTestId("overview-exposure");
  await expect(strip).toBeVisible();
  await expect(page.getByTestId("overview-exposure-ceilings")).toContainText("crore");
  await expect(strip).toContainText("Statutory ceilings, not a predicted fine");
  // Q2 (Slice 10.5 B4): one name for the headline, here and on the Exposure page.
  await expect(strip).toContainText(CEILINGS_AT_STAKE_HEADING);
  await page.getByTestId("overview-exposure-link").click();
  await expect(page).toHaveURL(/\/dashboard\/exposure$/);

  const centre = page.getByTestId("exposure-command-centre");
  await expect(centre).toBeVisible();
  await expect(page.getByTestId("exposure-ceilings")).toContainText("crore");
  await expect(page.getByTestId("exposure-ceilings")).toContainText(CEILINGS_AT_STAKE_HEADING);
  // F4.1: the s.37 note is a legal note under the tiles — announced politely, not as an error.
  await expect(page.getByTestId("exposure-s37")).toHaveAttribute("role", "status");
  await expect(page.getByTestId("exposure-s37")).toContainText("(s.37)");
  // N3: the heads have their own tab; the caveats stay on the page whatever the tab.
  await page.getByTestId("tab-penalty-heads").click();
  for (const code of ["H1", "H2", "H3", "H4", "H7"]) await expect(page.getByTestId(`exposure-head-${code}`)).toBeVisible();
  // MU processes children's data; no SDF notification is recorded.
  await expect(page.getByTestId("exposure-status-H3")).not.toHaveText("Not applicable");
  await expect(page.getByTestId("exposure-status-H4")).toHaveText("Not applicable");
  await expect(page.getByTestId("exposure-caveat")).toHaveText(CAVEAT_EXPOSURE);
  await expect(page.getByTestId("readiness-caveat")).toContainText("It is not a final legal opinion");
  // Read-only role: no recording.
  await expect(page.getByTestId("exposure-record-snapshot")).toHaveCount(0);
  // No code of any kind on a client screen (D-071), and never "compliant".
  const text = await centre.innerText();
  expect(text).not.toMatch(/\b[A-Z]{1,4}\d+\.\d+\b|[A-Z]+_V\d\b|trigger:/);
  expect(text.toLowerCase()).not.toMatch(/\bcompliant\b/);
});

test("a what-if moves the figures and writes nothing", async ({ page }) => {
  const count = () =>
    withDb((db) =>
      db.query<{ actions: string; snapshots: string }>(
        `SELECT (SELECT count(*) FROM public.gap_actions WHERE organization_id = $1 AND status = 'closed') AS actions,
                (SELECT count(*) FROM public.exposure_snapshots WHERE organization_id = $1) AS snapshots`,
        [MU.id],
      ),
    );
  const before = (await count()).rows[0];

  await signIn(page, SEED_USERS.muDean.email);
  await page.goto("/dashboard/exposure");
  await page.getByTestId("tab-what-if").click();
  await expect(page.getByTestId("leverage-0")).toBeVisible();
  await page.getByTestId("whatif-tick-0").check();
  await page.getByTestId("whatif-run").click();
  const result = page.getByTestId("whatif-result");
  await expect(result).toBeVisible();
  await expect(result).toContainText("Ceilings at stake");
  await expect(result).toContainText("A what-if changes nothing");

  expect((await count()).rows[0]).toEqual(before);
});

test("the DPDP Programme Owner is offered recording; the history renders with a table view", async ({ page }) => {
  await signIn(page, SEED_USERS.mumbaiUniversity.email);
  await page.goto("/dashboard/exposure");
  await expect(page.getByTestId("exposure-command-centre")).toBeVisible();
  await page.getByTestId("tab-history").click();
  await expect(page.getByTestId("exposure-record-snapshot")).toBeVisible();
  await expect(page.getByTestId("exposure-history").or(page.getByTestId("exposure-history-empty"))).toBeVisible();
  await expect(page.getByTestId("nav-exposure")).toBeVisible();
});

test("Q1 (model 1.7.0): the Exposure page counts every open action the Actions page counts", async ({ page, request }) => {
  const token = await accessTokenFor(SEED_USERS.mumbaiUniversity.email);
  const [exposure, dashboard] = await Promise.all([
    request.get(`/api/v1/organizations/${MU.id}/exposure`, { headers: bearer(token) }),
    request.get(`/api/v1/organizations/${MU.id}/dashboard`, { headers: bearer(token) }),
  ]);
  expect(exposure.status()).toBe(200);
  expect(dashboard.status()).toBe(200);
  const forecast = (await exposure.json()).data.intelligence.forecast;
  const summary = (await dashboard.json()).data.actions.summary;
  // The breach, rights and retention actions count too — not only the assessment's and the register's.
  expect(summary.bySource.breach.outstanding + summary.bySource.rights.outstanding + summary.bySource.retention.outstanding).toBeGreaterThan(0);
  expect(forecast.all.outstanding).toBe(summary.outstanding);

  await signIn(page, SEED_USERS.mumbaiUniversity.email);
  await page.goto("/dashboard/exposure");
  // With too little closure history to forecast, the tile says how many are open — in the singular for one (F4.2).
  if (forecast.notEnoughHistory && forecast.all.outstanding > 0) {
    await expect(page.getByTestId("exposure-forecast-tile")).toContainText(actionsOpenLabel(summary.outstanding));
  }
});
