// Slice 11 Stage 2a — screenshots of the drafting panel on Mumbai University, at laptop and phone
// width, with every browser console error. LOCAL STACK ONLY: it signs in with the seed password,
// and the app must run with AI_ENABLED=true AI_PROVIDER=fake.
//
// Usage: node tools/ai_draft_shots.mjs <baseURL> <outDir>
//   SEED_USER_PASSWORD, NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be exported
//   (the local env). It records a FICTIONAL open breach and an open request on the LOCAL Mumbai
//   University (the seed has none open), and stores drafts — rebuild the database afterwards.
import { createRequire } from "node:module";
const { chromium } = createRequire(new URL("../apps/web/package.json", import.meta.url))("@playwright/test");
import fs from "node:fs";
import path from "node:path";

const [baseURL, outDir] = process.argv.slice(2);
const password = process.env.SEED_USER_PASSWORD;
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!baseURL || !outDir || !password || !url || !/127\.0\.0\.1|localhost/.test(url)) {
  console.error("usage (local env exported): node tools/ai_draft_shots.mjs <baseURL> <outDir>");
  process.exit(2);
}
fs.mkdirSync(outDir, { recursive: true });

const MU = "0b000000-0000-4000-8000-000000000001";
const DPO = "dpdp.owner@mumbai-university.example.com";
const DEAN = "dean@mumbai-university.example.com";
const VIEWPORTS = [
  ["laptop", { width: 1366, height: 800 }],
  ["phone", { width: 390, height: 844 }],
];
const errors = [];

// --- fixtures, through the API as the Registrar ---------------------------------
const token = (await (await fetch(`${url}/auth/v1/token?grant_type=password`, {
  method: "POST",
  headers: { apikey: anon, "Content-Type": "application/json" },
  body: JSON.stringify({ email: DPO, password }),
})).json()).access_token;
const api = async (method, p, body) => {
  const res = await fetch(`${baseURL}/api/v1/organizations/${MU}${p}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return res.json();
};
const HOUR = 3_600_000;
const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
const breachId = (
  await api("POST", "/breaches", {
    title: "Examinations portal account used from outside",
    nature: "unauthorised_access",
    severity: "high",
    awareAt: new Date(Date.now() - 5 * HOUR).toISOString(),
    principalsAffected: 1200,
    dataCategories: "Names, roll numbers, marks",
  })
).data.incident.id;
await api("PATCH", `/breaches/${breachId}`, { principals: { at: new Date(Date.now() - 2 * HOUR).toISOString(), method: "Email to each student" } });
const requestId = (
  await api("POST", "/rights-requests", {
    kind: "erasure",
    receivedOn: today,
    channel: "email",
    requesterName: "Asha Fictional-Requester",
    summary: "Asks the university to delete her hostel records now that she has left.",
  })
).data.request.id;

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

  // U14 — the register's new button, the description, the draft; U15 — the pre-filled form.
  await page.goto(`${baseURL}/dashboard/ropa`);
  await page.getByTestId("ropa-ai-draft").waitFor();
  await page.screenshot({ path: shot("U14-ropa", vp) });
  await page.getByTestId("ropa-ai-draft").click();
  await page.getByTestId("ai-draft-description").fill("Through the admissions portal we collect applicants' names, contact details and marks to decide admission.");
  await page.screenshot({ path: shot("U47-ropa-describe", vp) });
  await page.getByTestId("ai-draft-describe-send").click();
  await draftPanel(page);
  await page.screenshot({ path: shot("U47-ropa-draft", vp) });
  await page.getByTestId("ai-draft-accept").click();
  await page.getByTestId("ropa-from-draft").waitFor({ timeout: 30_000 });
  await page.screenshot({ path: shot("U15-ropa-new-from-draft", vp) });

  // U30 — the Rule 7(2)(b) step, the intimation draft in two tabs, the accepted text.
  await page.goto(`${baseURL}/dashboard/breaches/${breachId}`);
  await page.getByTestId("breach-ai-draft").waitFor();
  await page.getByTestId("step-board-report").scrollIntoViewIfNeeded();
  await page.screenshot({ path: shot("U30-breach", vp) });
  await page.getByTestId("breach-ai-draft").click();
  await draftPanel(page);
  await page.screenshot({ path: shot("U47-intimation-a", vp) });
  await page.getByTestId("tab-intimation-b").click();
  await page.getByTestId("ai-draft-field-personFindings").scrollIntoViewIfNeeded();
  await page.screenshot({ path: shot("U47-intimation-b", vp) });
  await page.getByTestId("ai-draft-accept").click();
  await page.getByTestId("breach-ai-intimation").waitFor({ timeout: 30_000 });
  await page.getByTestId("breach-ai-intimation").scrollIntoViewIfNeeded();
  await page.screenshot({ path: shot("U30-breach-intimation-accepted", vp) });

  // U32 — the Response step, the letter, the pre-filled form with the outcome unchosen.
  await page.goto(`${baseURL}/dashboard/rights/${requestId}`);
  await page.getByTestId("rights-ai-draft").waitFor();
  await page.screenshot({ path: shot("U32-request", vp) });
  await page.getByTestId("rights-ai-draft").click();
  await draftPanel(page);
  await page.screenshot({ path: shot("U47-response-draft", vp) });
  await page.getByTestId("ai-draft-accept").click();
  await page.getByTestId("rights-respond-from-draft").waitFor({ timeout: 30_000 });
  await page.getByTestId("rights-respond-form").scrollIntoViewIfNeeded();
  await page.screenshot({ path: shot("U32-request-response-prefilled", vp) });
  await ctx.close();
}

// The Dean reads the accepted text, with no drafting button.
const ctx = await browser.newContext({ viewport: { width: 1366, height: 800 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
await signIn(page, DEAN);
await page.goto(`${baseURL}/dashboard/breaches/${breachId}`);
await page.getByTestId("breach-ai-intimation").waitFor({ timeout: 30_000 });
await page.getByTestId("breach-ai-intimation").scrollIntoViewIfNeeded();
await page.screenshot({ path: shot("U30-breach-dean-readonly", "laptop") });
await browser.close();

fs.writeFileSync(path.join(outDir, "console-errors.json"), JSON.stringify(errors, null, 2));
console.log(`Done: ${fs.readdirSync(outDir).filter((f) => f.endsWith(".png")).length} screenshots, ${errors.length} console errors`);
