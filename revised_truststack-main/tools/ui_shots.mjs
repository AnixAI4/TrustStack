// UI page walk (Slice 10.5): a screenshot of every page at laptop and phone width, and every browser
// console error, as MU's seeded people. LOCAL STACK ONLY — it signs in with the seed password.
//
// Usage: node tools/ui_shots.mjs <baseURL> <outDir> [publicSlug]
//   SEED_USER_PASSWORD must be exported (the local env). The /p/… pages need an organisation with
//   public pages open: pass its slug (e.g. open BML's on the LOCAL database for the run, then close it).
// Writes <outDir>/<surface>--<laptop|phone>.png and console-errors.json. Used for B0's before/after.
//   ONLY=U11,U12 (optional) shoots just the surfaces whose name starts with one of those ids.
import { createRequire } from "node:module";
const { chromium } = createRequire(new URL("../apps/web/package.json", import.meta.url))("@playwright/test");
import fs from "node:fs";
import path from "node:path";

const [baseURL, outDir, slug] = process.argv.slice(2);
const password = process.env.SEED_USER_PASSWORD;
if (!baseURL || !outDir || !password) {
  console.error("usage: SEED_USER_PASSWORD=… node tools/ui_shots.mjs <baseURL> <outDir> [publicSlug]");
  process.exit(2);
}
fs.mkdirSync(outDir, { recursive: true });

const MU = {
  assessment: "0b000006-0000-4000-8000-000000000001",
  ropa: "0b00000a-0000-4000-8000-000000000001",
  breach: "0b000010-0000-4000-8000-000000000001",
  rights: "0b000012-0000-4000-8000-000000000001",
  vendor: "0b000004-0000-4000-8000-000000000002",
  vendorAssessment: "0b000014-0000-4000-8000-000000000021",
  retention: "0b000016-0000-4000-8000-000000000001",
  ai: "0b000016-0000-4000-8000-000000000041",
  notice: "0b000013-0000-4000-8000-000000000001",
};

const PERSONAS = [
  {
    who: "dpo",
    email: "dpdp.owner@mumbai-university.example.com",
    pages: [
      ["U04-overview", "/dashboard"],
      ["U10-assessments", "/dashboard/assessments"],
      ["U11-assessment", `/dashboard/assessments/${MU.assessment}`],
      ["U12-gaps", `/dashboard/assessments/${MU.assessment}/gaps`],
      ["U13-actions", "/dashboard/actions"],
      ["U19-exposure", "/dashboard/exposure"],
      ["U20-reports", "/dashboard/reports"],
      ["U14-ropa", "/dashboard/ropa"],
      ["U15-ropa-record", `/dashboard/ropa/${MU.ropa}`],
      ["U15-ropa-new", "/dashboard/ropa/new"],
      ["U16-ropa-gaps", "/dashboard/ropa/gaps"],
      ["U17-ropa-import", "/dashboard/ropa/import"],
      ["U18-ropa-lookup", "/dashboard/ropa/lookup"],
      ["U29-breaches", "/dashboard/breaches"],
      ["U30-breach", `/dashboard/breaches/${MU.breach}`],
      ["U30-breach-new", "/dashboard/breaches/new"],
      ["U31-rights", "/dashboard/rights"],
      ["U32-request", `/dashboard/rights/${MU.rights}`],
      ["U32-request-new", "/dashboard/rights/new"],
      ["U33-consent", "/dashboard/consent"],
      ["U34-notice", `/dashboard/consent/notices/${MU.notice}`],
      ["U35-processors", "/dashboard/processors"],
      ["U36-processor", `/dashboard/processors/${MU.vendor}`],
      ["U36-questionnaire", `/dashboard/processors/${MU.vendor}/assessments/${MU.vendorAssessment}`],
      ["U37-retention", "/dashboard/retention"],
      ["U37-schedule", `/dashboard/retention/${MU.retention}`],
      ["U38-ai", "/dashboard/ai-risk"],
      ["U38-ai-system", `/dashboard/ai-risk/${MU.ai}`],
      ["U06-organisation", "/dashboard/organization"],
      ["U08-scope", "/dashboard/scope"],
    ],
  },
  { who: "admin", email: "it.admin@mumbai-university.example.com", pages: [["U07-users", "/dashboard/users"]] },
  { who: "consultant", email: "consultant@anix-ai.example.com", pages: [["U09-questions", "/dashboard/questions"]] },
];

const PUBLIC = [
  ["U01-login", "/login"],
  ["U02-invite", "/invites/accept?token=not-a-real-token"],
  ...(slug
    ? [
        ["U39-public", `/p/${slug}`],
        ["U40-public-rights", `/p/${slug}/rights`],
        ["U40-public-grievance", `/p/${slug}/grievance`],
      ]
    : []),
];

const only = (process.env.ONLY ?? "").split(",").map((s) => s.trim()).filter(Boolean);
const wanted = ([name]) => only.length === 0 || only.some((id) => name.startsWith(id));

const VIEWPORTS = [
  ["laptop", { width: 1366, height: 800 }],
  ["phone", { width: 390, height: 844 }],
];

const errors = [];

async function settle(page) {
  await page.waitForLoadState("networkidle", { timeout: 20_000 }).catch(() => {});
  // Client panels fetch after hydration; wait until no "Loading" text remains (max 15 s).
  for (let i = 0; i < 30; i++) {
    const loading = await page.locator("main").getByText(/^Loading/).count().catch(() => 0);
    if (!loading) break;
    await page.waitForTimeout(500);
  }
  await page.waitForTimeout(400);
}

const browser = await chromium.launch();
for (const [vp, size] of VIEWPORTS) {
  // Signed-out pages.
  {
    const ctx = await browser.newContext({ viewport: size, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    page.on("console", (m) => m.type() === "error" && errors.push({ vp, who: "public", url: page.url(), text: m.text() }));
    page.on("pageerror", (e) => errors.push({ vp, who: "public", url: page.url(), text: String(e) }));
    for (const [name, url] of PUBLIC.filter(wanted)) {
      await page.goto(baseURL + url);
      await settle(page);
      await page.screenshot({ path: path.join(outDir, `${name}--${vp}.png`) });
    }
    await ctx.close();
  }
  for (const p of PERSONAS) {
    if (!p.pages.some(wanted)) continue;
    const ctx = await browser.newContext({ viewport: size, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    page.on("console", (m) => m.type() === "error" && errors.push({ vp, who: p.who, url: page.url(), text: m.text() }));
    page.on("pageerror", (e) => errors.push({ vp, who: p.who, url: page.url(), text: String(e) }));
    await page.goto(baseURL + "/login");
    await page.getByLabel("Email").fill(p.email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Sign in" }).click();
    await page.waitForURL(/\/dashboard$/, { timeout: 30_000 });
    for (const [name, url] of p.pages.filter(wanted)) {
      await page.goto(baseURL + url);
      await settle(page);
      await page.screenshot({ path: path.join(outDir, `${name}--${vp}.png`) });
    }
    await ctx.close();
  }
}
await browser.close();
fs.writeFileSync(path.join(outDir, "console-errors.json"), JSON.stringify(errors, null, 2));
console.log(`done: ${fs.readdirSync(outDir).filter((f) => f.endsWith(".png")).length} screenshots, ${errors.length} console errors`);
