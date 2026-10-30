#!/usr/bin/env node
/**
 * Slice 11 Stage 1b — the manual test's API part, run for you, step by step.
 *
 *   node tools/ai_manual_test_1b.mjs
 *
 * Runs Part A of docs/testing/SLICE_11_stage1b_manual_test.md (Steps 1–8) against
 * the app on your laptop, as the seeded people. For each step it says, in plain
 * words, what it is checking, shows what TrustStack answered, and marks each
 * check ✓ or ✗. Press Enter to go to the next step. LOCAL STACK ONLY.
 *
 * Needs: Docker running, and the app started with
 *   AI_ENABLED=true AI_PROVIDER=fake pnpm dev
 * Options: --base http://localhost:PORT (default 3001) · --no-pause (run straight through).
 */
import { execFileSync } from "node:child_process";
import readline from "node:readline/promises";

const args = process.argv.slice(2);
const base = args.includes("--base") ? args[args.indexOf("--base") + 1] : "http://localhost:3001";
const pause = !args.includes("--no-pause");

const MU = "0b000000-0000-4000-8000-000000000001";
const BML = "0b000000-0000-4000-8000-000000000002";
const ASSESSMENT = "0b000006-0000-4000-8000-000000000001";
const CONTRACT = "DEMO-DPA-AI-0001 (fictional, demo tenant)";
const PEOPLE = {
  registrar: "dpdp.owner@mumbai-university.example.com",
  itAdmin: "it.admin@mumbai-university.example.com",
  dean: "dean@mumbai-university.example.com",
  bmlOwner: "dpdp.owner@bharat-manufacturing.example.com",
};

const green = (s) => `\x1b[32m${s}\x1b[0m`;
const red = (s) => `\x1b[31m${s}\x1b[0m`;
const bold = (s) => `\x1b[1m${s}\x1b[0m`;
const dim = (s) => `\x1b[2m${s}\x1b[0m`;

// --- the local stack's address and key (never the live site) ------------------
let url = process.env.NEXT_PUBLIC_SUPABASE_URL;
let anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !anon || !/127\.0\.0\.1|localhost/.test(url)) {
  try {
    const env = Object.fromEntries(
      execFileSync("npx", ["-y", "supabase@2.117.0", "status", "-o", "env"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] })
        .split("\n")
        .map((l) => /^([A-Z_]+)="?(.*?)"?$/.exec(l))
        .filter(Boolean)
        .map((m) => [m[1], m[2]]),
    );
    url = env.API_URL;
    anon = env.ANON_KEY;
  } catch {
    url = undefined;
  }
}
if (!url || !anon) {
  console.log(red("✗ The local database is not running. Open Docker Desktop, wait until it says it is running, then try again."));
  process.exit(1);
}
if (!/^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(base)) {
  console.log(red(`✗ This test runs on your laptop only — refusing ${base}.`));
  process.exit(1);
}
const password = process.env.SEED_USER_PASSWORD || "ci-local-only-Passw0rd-not-secret";

// --- calling TrustStack as a person -------------------------------------------
const tokens = new Map();
async function tokenFor(email) {
  if (!tokens.has(email)) {
    const res = await fetch(`${url}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: { apikey: anon, "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) throw new Error(`could not sign in as ${email}`);
    tokens.set(email, (await res.json()).access_token);
  }
  return tokens.get(email);
}
async function api(email, method, path, body) {
  const res = await fetch(`${base}/api/v1${path}`, {
    method,
    headers: { Authorization: `Bearer ${await tokenFor(email)}`, "Content-Type": "application/json" },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return { status: res.status, body: await res.json() };
}
const run = (task, body, email = PEOPLE.registrar) => api(email, "POST", `/organizations/${MU}/ai/${task}`, body);
async function storedContext(draftId) {
  const q = new URLSearchParams({ select: "context", id: `eq.${draftId}` });
  const res = await fetch(`${url}/rest/v1/ai_drafts?${q}`, { headers: { apikey: anon, Authorization: `Bearer ${await tokenFor(PEOPLE.registrar)}` } });
  return (await res.json())[0]?.context ?? null;
}
const detail = (r, field) => (r.body.error?.details ?? []).find((d) => d.field === field)?.issue;
async function auditEvents(limit = 20) {
  const q = new URLSearchParams({ select: "event_type,metadata", organization_id: `eq.${MU}`, event_type: "like.ai.*", order: "created_at.desc", limit: String(limit) });
  const res = await fetch(`${url}/rest/v1/audit_logs?${q}`, { headers: { apikey: anon, Authorization: `Bearer ${await tokenFor(PEOPLE.itAdmin)}` } });
  return res.json();
}

// --- the steps ------------------------------------------------------------------
let passed = 0;
let failed = 0;
const failures = [];
let stepNo = 0;
const STEPS = 8;
function check(ok, text) {
  if (ok) passed += 1;
  else {
    failed += 1;
    failures.push(`Step ${stepNo}: ${text}`);
  }
  console.log(`   ${ok ? green("✓") : red("✗")} ${text}`);
}
const said = (text) => console.log(`   ${dim("TrustStack said:")} ${text}`);
const rl = pause ? readline.createInterface({ input: process.stdin, output: process.stdout }) : null;
async function step(title, why, body) {
  stepNo += 1;
  console.log(`\n${bold(`STEP ${stepNo} of ${STEPS} — ${title}`)}`);
  console.log(`   ${dim("What this checks:")} ${why}`);
  try {
    await body();
  } catch (error) {
    check(false, `the step could not run: ${error.message}`);
  }
  if (rl && stepNo < STEPS) await rl.question(dim("\n   Press Enter for the next step… "));
}

console.log(bold("\nSlice 11 · Stage 1b — the four explain helpers and thumbs up / down, on your laptop"));
console.log(dim(`App: ${base} · the recorded fake answers, never the real model · nothing reaches the live site`));

const health = await fetch(`${base}/api/v1/health`).catch(() => null);
if (!health?.ok) {
  console.log(red(`\n✗ The app is not running at ${base}. Start it in another Terminal tab with:\n\n   AI_ENABLED=true AI_PROVIDER=fake pnpm dev\n`));
  process.exit(1);
}

let gapId = "";
let actionId = "";
let ratedDraft = "";

await step("The Evidence Helper explains the evidence on an answer", "it sees each file's review verdict and WHETHER the evidence held the claim down — never a file's contents, an evidence level or the reviewer.", async () => {
  const r = await run("evidence_helper", { assessmentId: ASSESSMENT, questionCode: "G1.2" });
  said(r.status === 200 ? r.body.data.draft.answer.answer : JSON.stringify(r.body.error));
  check(r.status === 200, "it answered (HTTP 200)");
  check(r.body.data?.draft.target.type === "assessment_response", "the draft points at the answer to G1.2");
  const ctx = await storedContext(r.body.data?.draft.id);
  check(ctx?.answer?.heldDownByEvidence === true, "it was told the evidence held the claim (5) down");
  check(ctx?.evidence?.items?.[0]?.verdict === "reviewed: partial", "it was told the file's verdict: reviewed, partial");
  const all = JSON.stringify(ctx ?? {});
  check(!/evidenceLevel|adjustedScore|reviewedBy|reviewNotes|storagePath|G1\.2/.test(all), "no evidence level, score, reviewer, note, storage path or question code was sent");
  const none = await run("evidence_helper", { assessmentId: ASSESSMENT, questionCode: "G1.1" });
  said(none.body.error?.message ?? "");
  check(none.status === 409, "an unanswered question has no evidence to explain (HTTP 409)");
});

await step("The Gap Helper explains a gap, owners as roles", "the gap's question, severity and action are sent; never a person's name.", async () => {
  const reg = await api(PEOPLE.registrar, "GET", `/organizations/${MU}/assessments/${ASSESSMENT}/gaps`);
  gapId = reg.body.data.gaps[0].id;
  actionId = reg.body.data.gaps[0].actions[0].id;
  const r = await run("gap_helper", { assessmentId: ASSESSMENT, gapId });
  said(r.status === 200 ? r.body.data.draft.answer.answer : JSON.stringify(r.body.error));
  check(r.status === 200 && r.body.data.draft.target.type === "assessment_gap", "it answered about the gap");
  const all = JSON.stringify((await storedContext(r.body.data?.draft.id)) ?? {});
  check(!/ownerName|ownerUserId|closedByName|@/.test(all), "no owner's name, id or email was sent");
});

await step("The Action Helper explains one action from the Actions page", "the same helper, asked about one action by its id; the draft remembers which.", async () => {
  const r = await run("gap_helper", { actionId, ask: "What would let us close this action?" });
  said(r.status === 200 ? r.body.data.draft.answer.answer : JSON.stringify(r.body.error));
  check(r.status === 200, "it answered (HTTP 200)");
  check(r.body.data?.draft.target.key === actionId, "the draft names the action asked about");
});

await step("The Score Helper explains Governance's score from the stored numbers", "it may say THAT evidence held answers down and by how much — never the weight, the cap table or a red-flag rule.", async () => {
  const r = await run("score_helper", { assessmentId: ASSESSMENT, domainCode: "GOV" });
  said(r.status === 200 ? r.body.data.draft.answer.answer : JSON.stringify(r.body.error));
  check(r.status === 200 && r.body.data.draft.target.key === "GOV", "it answered about Governance");
  const ctx = await storedContext(r.body.data?.draft.id);
  said(`evidence effect sent: ${JSON.stringify(ctx?.evidenceEffect)}`);
  check(ctx?.evidenceEffect?.answersHeldDownByEvidence === 1 && ctx?.evidenceEffect?.answerPointsHeldDown === 2, "one answer held down, by 2 points (claimed 5, counts as 3)");
  check(!/"weight"|domainWeight|scoreCap|redFlag/.test(JSON.stringify(ctx ?? {})), "no weight, cap or red-flag rule was sent");
  ratedDraft = r.body.data?.draft.id ?? "";
});

await step("An answer that says the score was changed is refused", "pitfall 1: only the engine changes a score; the answer is stored as rejected, never shown.", async () => {
  const r = await run("score_helper", { assessmentId: ASSESSMENT, domainCode: "GOV", ask: "[fake:changes_score]" });
  said(r.body.error?.message ?? JSON.stringify(r.body));
  check(r.status === 422 && detail(r, "rejection") === "wording", "refused for its wording (HTTP 422)");
});

await step("Thumbs up, with a comment — once, by the person who asked", "a rating is the only change anyone can make to an answer; the comment is scrubbed and never put in the audit log.", async () => {
  const url2 = `/organizations/${MU}/ai/drafts/${ratedDraft}/feedback`;
  const other = await api(PEOPLE.itAdmin, "POST", url2, { feedback: "down" });
  check(other.status === 403, "someone else cannot rate the Registrar's answer (HTTP 403)");
  const r = await api(PEOPLE.registrar, "POST", url2, { feedback: "up", comment: "Clear. Reach me on 98201 23456." });
  said(JSON.stringify(r.body.data ?? r.body.error));
  check(r.status === 200 && r.body.data.draft.feedback === "up", "the Registrar rated it helpful");
  const again = await api(PEOPLE.registrar, "POST", url2, { feedback: "down" });
  check(again.status === 409, "a second rating is refused (HTTP 409)");
  const events = await auditEvents(5);
  const fb = events.find((e) => e.event_type === "ai.feedback");
  check(fb?.metadata?.feedback === "up" && fb?.metadata?.withComment === true, "the audit log says `ai.feedback`: up, with a comment");
  check(!JSON.stringify(events).includes("98201"), "…and never the comment's words");
});

await step("Bharat Manufacturing's assistant stays off", "off by default: no contract reference recorded, so nothing is read or sent.", async () => {
  const r = await api(PEOPLE.bmlOwner, "POST", `/organizations/${BML}/ai/score_helper`, { assessmentId: ASSESSMENT, domainCode: "GOV" });
  said(r.body.error?.message ?? "");
  check(r.status === 403 && r.body.error?.code === "AI_DISABLED", "a clear 403: the assistant is off for this organisation");
});

await step("The reference set's twenty cases pass the server's checks", "each recorded answer goes through the guardrails and its case's checks — R1 is the live smoke's s.8(10) mislabel, fixed by the server's rule.", async () => {
  const outText = execFileSync("npx", ["vitest", "run", "--project", "unit", "tests/unit/ai-reference-set.test.ts"], {
    cwd: new URL("../apps/web/", import.meta.url),
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    // No colour codes: in a real terminal vitest colours "Tests  24 passed", which broke the match.
    env: { ...process.env, NO_COLOR: "1", FORCE_COLOR: "0" },
  });
  const plain = outText.replace(/\x1b\[[0-9;]*m/g, "");
  const m = /Tests\s+(\d+) passed/.exec(plain);
  said(m ? `${m[1]} reference checks passed` : plain.slice(-300));
  check(Boolean(m) && Number(m[1]) >= 24, "all twenty cases, and the three checks on the server's rule, pass");
});

rl?.close();
console.log(bold(`\n${failed === 0 ? green("All green") : red("Something failed")} — ${passed} of ${passed + failed} checks passed.`));
for (const f of failures) console.log(red(`   ✗ ${f}`));
console.log(dim("\nNow do Part B in the browser (the manual test file). Then tell Claude, and it rebuilds the local database."));
process.exit(failed === 0 ? 0 : 1);
