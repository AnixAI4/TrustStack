// Slice 11 Stage 1b — screenshots of the AI assistant panel on Mumbai University's seeded data,
// at laptop and phone width, with every browser console error. LOCAL STACK ONLY: it signs in
// with the seed password, and the app must run with AI_ENABLED=true AI_PROVIDER=fake.
//
// Usage: node tools/ai_panel_shots.mjs <baseURL> <outDir>
//   SEED_USER_PASSWORD must be exported (the local env). Each answer it opens is a draft row on
//   the LOCAL database — rebuild it from the seed afterwards.
import { createRequire } from "node:module";
const { chromium } = createRequire(new URL("../apps/web/package.json", import.meta.url))("@playwright/test");
import fs from "node:fs";
import path from "node:path";

const [baseURL, outDir] = process.argv.slice(2);
const password = process.env.SEED_USER_PASSWORD;
if (!baseURL || !outDir || !password) {
  console.error("usage: SEED_USER_PASSWORD=… node tools/ai_panel_shots.mjs <baseURL> <outDir>");
  process.exit(2);
}
fs.mkdirSync(outDir, { recursive: true });

const ASSESSMENT = "0b000006-0000-4000-8000-000000000001";
const DPO = "dpdp.owner@mumbai-university.example.com";
const ADMIN = "it.admin@mumbai-university.example.com";
const VIEWPORTS = [
  ["laptop", { width: 1366, height: 800 }],
  ["phone", { width: 390, height: 844 }],
];
const errors = [];

async function signIn(page, email) {
  await page.goto(baseURL + "/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(/\/dashboard$/, { timeout: 30_000 });
}

async function openPanel(page, testId) {
  // A trailing "-" means "the first one whose id starts with this".
  const button = (testId.endsWith("-") ? page.locator(`[data-testid^="${testId}"]:visible`) : page.getByTestId(testId)).first();
  await button.waitFor({ timeout: 30_000 });
  await button.scrollIntoViewIfNeeded();
  await page.screenshot({ path: shot.current("button") });
  await button.click();
  await page.getByTestId("ai-answer").waitFor({ timeout: 60_000 });
  await page.waitForTimeout(300);
}

const shot = { vp: "", name: "", current: (suffix) => path.join(outDir, `${shot.name}-${suffix}--${shot.vp}.png`) };

const browser = await chromium.launch();
for (const [vp, size] of VIEWPORTS) {
  shot.vp = vp;
  for (const who of [DPO, ADMIN]) {
    const ctx = await browser.newContext({ viewport: size, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    page.on("console", (m) => m.type() === "error" && errors.push({ vp, who, url: page.url(), text: m.text() }));
    page.on("pageerror", (e) => errors.push({ vp, who, url: page.url(), text: String(e) }));
    await signIn(page, who);
    if (who === DPO) {
      // U11 — the Question Helper, then the law and "Tell me more" unfolded.
      shot.name = "U11-question";
      await page.goto(`${baseURL}/dashboard/assessments/${ASSESSMENT}`);
      await openPanel(page, "ai-explain-question-G1.2");
      await page.screenshot({ path: shot.current("panel") });
      await page.getByTestId("ai-answer-law").locator("summary").click();
      await page.getByTestId("ai-answer-more").locator("summary").click();
      await page.screenshot({ path: shot.current("panel-open"), fullPage: false });
      await page.getByTestId("ai-feedback-up").click();
      await page.screenshot({ path: shot.current("feedback") });
      await page.getByTestId("ai-panel-close").click();
      // U11 — the Evidence Helper.
      shot.name = "U11-evidence";
      await openPanel(page, "ai-explain-evidence-G1.2");
      await page.screenshot({ path: shot.current("panel") });
      await page.getByTestId("ai-panel-close").click();
      // U11 Score tab — the Score Helper.
      shot.name = "U11-score";
      await page.getByTestId("tab-score").click();
      await openPanel(page, "ai-explain-score-GOV");
      await page.screenshot({ path: shot.current("panel") });
      await page.getByTestId("ai-panel-close").click();
      // U12 — the Gap Helper.
      shot.name = "U12-gap";
      await page.goto(`${baseURL}/dashboard/assessments/${ASSESSMENT}/gaps`);
      await openPanel(page, "ai-explain-gap-");
      await page.screenshot({ path: shot.current("panel") });
      await page.getByTestId("ai-panel-close").click();
      // U13 — an action on the Actions page.
      shot.name = "U13-action";
      await page.goto(`${baseURL}/dashboard/actions`);
      await page.getByTestId("tab-all").click();
      await openPanel(page, "ai-explain-action-");
      await page.screenshot({ path: shot.current("panel") });
      await page.getByTestId("ai-panel-close").click();
      // U06 — the AI tab, as someone who may not change it.
      shot.name = "U06-ai-readonly";
      await page.goto(`${baseURL}/dashboard/organization#ai`);
      await page.getByTestId("ai-settings-status").waitFor();
      await page.screenshot({ path: shot.current("tab") });
    } else {
      shot.name = "U06-ai-admin";
      await page.goto(`${baseURL}/dashboard/organization#ai`);
      await page.getByTestId("ai-settings-status").waitFor();
      await page.screenshot({ path: shot.current("tab"), fullPage: true });
    }
    await ctx.close();
  }
}
await browser.close();
fs.writeFileSync(path.join(outDir, "console-errors.json"), JSON.stringify(errors, null, 2));
console.log(`done: ${fs.readdirSync(outDir).filter((f) => f.endsWith(".png")).length} screenshots, ${errors.length} console errors`);
