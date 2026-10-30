// Slice 11 Stage 2b — screenshots of the notice, translation and narrative drafting on Mumbai
// University, at laptop and phone width, with every browser console error. LOCAL STACK ONLY: it
// signs in with the seed password, and the app must run with AI_ENABLED=true AI_PROVIDER=fake.
//
// Usage: node tools/ai_notice_shots.mjs <baseURL> <outDir> [--before]
//   --before   turns MU's assistant OFF first (as its admin), so the pages render exactly as Stage 2a
//              left them — no drafting buttons — and turns it back on at the end.
//   SEED_USER_PASSWORD, NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be exported
//   (the local env). It generates a report and stores drafts on the LOCAL Mumbai University —
//   rebuild the database afterwards.
import { createRequire } from "node:module";
const { chromium } = createRequire(new URL("../apps/web/package.json", import.meta.url))("@playwright/test");
import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const [baseURL, outDir] = args;
const before = args.includes("--before");
const password = process.env.SEED_USER_PASSWORD;
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!baseURL || !outDir || !password || !url || !/127\.0\.0\.1|localhost/.test(url)) {
  console.error("usage (local env exported): node tools/ai_notice_shots.mjs <baseURL> <outDir> [--before]");
  process.exit(2);
}
fs.mkdirSync(outDir, { recursive: true });

const MU = "0b000000-0000-4000-8000-000000000001";
const DPO = "dpdp.owner@mumbai-university.example.com";
const ADMIN = "it.admin@mumbai-university.example.com";
const VIEWPORTS = [
  ["laptop", { width: 1366, height: 800 }],
  ["phone", { width: 390, height: 844 }],
];
const errors = [];

async function tokenFor(email) {
  const r = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: anon, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return (await r.json()).access_token;
}
const dpoToken = await tokenFor(DPO);
const api = async (method, p, body, token = dpoToken) => {
  const res = await fetch(`${baseURL}/api/v1/organizations/${MU}${p}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return res.json();
};
const switchAi = async (enabled) => api("PATCH", "", { ai: { enabled, contractRef: "DEMO-DPA-AI-0001" } }, await tokenFor(ADMIN));

const notice = (await api("GET", "/consent")).data.notices.find((n) => n.language === "en" && n.status === "published");
const brief = (await api("POST", "/reports", { kind: "exposure_brief" })).data.report;
if (before) await switchAi(false);

async function signIn(page, email) {
  await page.goto(baseURL + "/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(/\/dashboard$/, { timeout: 30_000 });
}
const shot = (name, vp) => path.join(outDir, `${name}--${vp}.png`);
async function draftPanel(page) {
  await page.getByTestId("ai-draft").waitFor({ timeout: 60_000 });
  await page.waitForTimeout(300);
}

const browser = await chromium.launch();
for (const [vp, size] of VIEWPORTS) {
  const ctx = await browser.newContext({ viewport: size, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  page.on("console", (m) => m.type() === "error" && errors.push({ vp, url: page.url(), text: m.text() }));
  page.on("pageerror", (e) => errors.push({ vp, url: page.url(), text: String(e) }));
  await signIn(page, DPO);

  // U33 — Notice and consent: the notice section, with "Draft a notice from the processing register".
  await page.goto(`${baseURL}/dashboard/consent`);
  await page.getByTestId("consent-notices").waitFor();
  await page.waitForTimeout(500);
  await page.screenshot({ path: shot("U33-consent", vp) });
  // U34 — the published notice, with "Translate into Hindi / Marathi".
  await page.goto(`${baseURL}/dashboard/consent/notices/${notice.id}`);
  await page.getByTestId("notice-published").waitFor();
  await page.waitForTimeout(500);
  await page.screenshot({ path: shot("U34-notice-published", vp) });
  // U20 — the Stored tab, with "Draft a narrative" on the brief.
  await page.goto(`${baseURL}/dashboard/reports`);
  await page.getByTestId("tab-stored").click();
  await page.getByTestId(`report-row-${brief.id}`).waitFor();
  await page.waitForTimeout(500);
  await page.screenshot({ path: shot("U20-reports-stored", vp) });

  if (!before) {
    // U47 — the notice draft; U34 — the editor pre-filled from it.
    await page.goto(`${baseURL}/dashboard/consent`);
    await page.getByTestId("consent-notice-draft").click();
    await draftPanel(page);
    await page.screenshot({ path: shot("U47-notice-draft", vp) });
    await page.getByTestId("ai-draft-fixed-texts").scrollIntoViewIfNeeded();
    await page.screenshot({ path: shot("U47-notice-draft-fixed-texts", vp) });
    await page.getByTestId("ai-draft-accept").click();
    await page.getByTestId("notice-from-draft").waitFor({ timeout: 30_000 });
    await page.screenshot({ path: shot("U34-notice-new-from-draft", vp) });

    // U47 — the Hindi translation (keys locked); U34 — the new Hindi notice, pre-filled.
    await page.goto(`${baseURL}/dashboard/consent/notices/${notice.id}`);
    await page.getByTestId("notice-translate-hi").click();
    await draftPanel(page);
    await page.screenshot({ path: shot("U47-translation-hi", vp) });
    await page.getByTestId("ai-draft-accept").click();
    await page.getByTestId("notice-from-draft").waitFor({ timeout: 30_000 });
    await page.screenshot({ path: shot("U34-notice-new-from-translation", vp) });

    // U47 — the narrative; U20 — "Print the narrated version", then the narrated version.
    await page.goto(`${baseURL}/dashboard/reports`);
    await page.getByTestId("tab-stored").click();
    await page.getByTestId(`narrative-draft-${brief.id}`).click();
    await draftPanel(page);
    await page.screenshot({ path: shot("U47-narrative-draft", vp) });
    await page.getByTestId("ai-draft-accept").click();
    await page.getByTestId(`narrative-print-${brief.id}`).waitFor({ timeout: 30_000 });
    await page.screenshot({ path: shot("U20-reports-print", vp) });
    if (vp === "laptop") {
      await page.getByTestId(`narrative-print-${brief.id}`).click();
      await page.locator('[data-testid^="narrated-"]').first().waitFor({ timeout: 60_000 });
      await page.waitForTimeout(500);
      await page.screenshot({ path: shot("U20-reports-narrated", vp) });
    }
  }
  await ctx.close();
}
await browser.close();
if (before) await switchAi(true);

fs.writeFileSync(path.join(outDir, "console-errors.json"), JSON.stringify(errors, null, 2));
console.log(`Done: ${fs.readdirSync(outDir).filter((f) => f.endsWith(".png")).length} screenshots, ${errors.length} console errors`);
