#!/usr/bin/env node
/**
 * Slice 11 Stage 1a — the manual test, run for you, step by step.
 *
 *   node tools/ai_manual_test.mjs
 *
 * Runs Part A of docs/testing/SLICE_11_stage1a_manual_test.md (Steps 1–10) against
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
const ask = (email, org, extra = {}) => api(email, "POST", `/organizations/${org}/ai/question_helper`, { assessmentId: ASSESSMENT, questionCode: "G1.2", ...extra });
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
async function step(title, why, run) {
  stepNo += 1;
  console.log(`\n${bold(`STEP ${stepNo} of 10 — ${title}`)}`);
  console.log(`   ${dim("What this checks:")} ${why}`);
  try {
    await run();
  } catch (error) {
    check(false, `the step could not run: ${error.message}`);
  }
  if (rl && stepNo < 10) await rl.question(dim("\n   Press Enter for the next step… "));
}

console.log(bold("\nSlice 11 · Stage 1a — the AI assistant's safety checks, on your laptop"));
console.log(dim(`App: ${base} · the recorded fake answers, never the real model · nothing reaches the live site`));

const health = await fetch(`${base}/api/v1/health`).catch(() => null);
if (!health?.ok) {
  console.log(red(`\n✗ The app is not running at ${base}. Start it in another Terminal tab with:\n\n   AI_ENABLED=true AI_PROVIDER=fake pnpm dev\n`));
  process.exit(1);
}

await step("Is the assistant on for Mumbai University?", "it is on only because a contract reference was recorded (the demo's is fictional).", async () => {
  const r = await api(PEOPLE.registrar, "GET", `/organizations/${MU}/ai`);
  const ai = r.body.data?.ai;
  said(ai ? `available = ${ai.available}; contract = "${ai.organisation.contractRef}"` : JSON.stringify(r.body.error));
  check(r.status === 200 && ai?.available === true, "the assistant is available for Mumbai University");
  check(ai?.organisation.contractRef === CONTRACT, "it names the contract that allows it");
  check(ai?.platformEnabled === true, "the laptop's master switch is on (on the live site it stays off)");
});

let firstAnswer = null;
await step("Ask the assistant to explain a question", "the Registrar asks about question G1.2; the answer comes back in its one plain shape, with the law and the review warnings.", async () => {
  const r = await ask(PEOPLE.registrar, MU);
  const a = r.body.data?.draft?.answer;
  firstAnswer = a;
  said(a ? `"${a.answer}"` : JSON.stringify(r.body.error));
  if (a) console.log(`   ${dim("The law it cites:")} ${a.sourceReferences.join(", ")}`);
  check(r.status === 200, "it answered");
  check(Boolean(a?.answer && a?.whyItMatters && a?.nextStep?.label), "the answer has its parts: the answer, why it matters, one next step");
  check(a?.sourceReferences?.includes("s.8(5)"), "it points to the Act (s.8(5))");
  check(a?.requiresHumanReview === true && /a person must review it/.test(a?.reviewNote ?? ""), "it says a person must review it");
  check(/not a final legal opinion, statutory certification/.test(a?.caveat ?? ""), "it carries the legal caveat (not a certification)");
});

await step("Bharat Manufacturing's assistant is off", "an organisation whose contract does not name the AI provider gets a clear no — and nothing is sent anywhere.", async () => {
  const r = await ask(PEOPLE.bmlOwner, BML);
  said(r.body.error?.message ?? JSON.stringify(r.body));
  check(r.status === 403 && r.body.error?.code === "AI_DISABLED", "it was refused, as switched off");
  check(/contract with TrustStack names the AI provider/.test(r.body.error?.message ?? ""), "the message says why, in plain words");
});

await step("One organisation cannot use another's assistant", "Bharat Manufacturing's owner tries to ask about Mumbai University's question.", async () => {
  const r = await ask(PEOPLE.bmlOwner, MU);
  said(r.body.error?.message ?? JSON.stringify(r.body));
  check(r.status === 403 && r.body.error?.code === "TENANT_ACCESS_DENIED", "refused: no access to another organisation");
  check(!JSON.stringify(r.body).includes("Mumbai"), "nothing about Mumbai University in the reply");
});

await step('An answer that says "compliant" is never kept', 'we make the fake reply "Your organisation is fully compliant" — TrustStack must refuse to keep it.', async () => {
  const r = await ask(PEOPLE.registrar, MU, { ask: "[fake:certifies]" });
  said(r.body.error?.message ?? JSON.stringify(r.body));
  check(r.status === 422 && r.body.error?.code === "AI_ANSWER_REJECTED", "the answer was refused");
  check(detail(r, "rejection") === "wording", "because of its wording");
});

await step("A TrustStack target dressed up as the law is refused", 'the fake claims "the Act requires an answer within 30 days" — 30 days is TrustStack\'s target; the Rules allow up to ninety days (Rule 14(3)).', async () => {
  const r = await ask(PEOPLE.registrar, MU, { ask: "[fake:statute_target]" });
  said(r.body.error?.message ?? JSON.stringify(r.body));
  check(r.status === 422 && detail(r, "rejection") === "wording", "refused: our target is not the law");
});

await step("Citations are checked against the Act and the Rules", "an answer citing only invented sections is refused; one with a real and an invented citation keeps the real one and drops the invented one.", async () => {
  const bad = await ask(PEOPLE.registrar, MU, { ask: "[fake:bad_citation]" });
  said(`all invented → ${bad.body.error?.message ?? bad.status}`);
  check(bad.status === 422 && detail(bad, "rejection") === "citation", "all-invented citations: refused");
  const partial = await ask(PEOPLE.registrar, MU, { ask: "[fake:partial_citation]" });
  const d = partial.body.data?.draft;
  said(d ? `one real, one invented → kept, citing ${d.answer.sourceReferences.join(", ")}; dropped: ${d.citationFlags.map((f) => f.citation).join(", ")}` : JSON.stringify(partial.body.error));
  check(partial.status === 200 && d?.answer.sourceReferences.join() === "s.8(5)", "one real citation: the answer is kept with s.8(5) only");
  check(d?.citationFlags?.[0]?.citation === "Rule 42(9)", 'the invented "Rule 42(9)" was dropped and noted');
});

await step("A refusal is a clear message, never half an answer", "when the AI declines, the person is told plainly and nothing changes.", async () => {
  const r = await ask(PEOPLE.registrar, MU, { ask: "[fake:refusal]" });
  said(r.body.error?.message ?? JSON.stringify(r.body));
  check(r.status === 422 && detail(r, "rejection") === "refusal", "a clear refusal");
  check(/Nothing was changed/.test(r.body.error?.message ?? ""), 'it says "Nothing was changed"');
});

await step("Every question asked is in the audit trail — without the text", "the IT Admin reads the audit log: each call is there, as the person who asked, but never the question or the answer.", async () => {
  const events = await auditEvents();
  const types = events.map((e) => e.event_type);
  console.log(`   ${dim("Audit log (newest first):")}`);
  for (const e of events.slice(0, 8)) console.log(`     ${e.event_type.padEnd(16)} ${dim([e.metadata?.task, e.metadata?.rejection && `refused: ${e.metadata.rejection}`].filter(Boolean).join(" · "))}`);
  check(types.filter((t) => t === "ai.requested").length >= 2, "the kept answers are recorded (ai.requested)");
  check(types.filter((t) => t === "ai.refused").length >= 4, "the refused ones are recorded with their reason (ai.refused)");
  const firstText = firstAnswer?.answer ?? "This question asks";
  check(!JSON.stringify(events).includes(firstText.slice(0, 30)), "no answer text is stored in the audit log");
});

await step("Only an administrator turns it off — and off is immediate", "the Registrar may not switch it; the IT Admin switches it off, a question is refused at once, and it cannot come back on without the contract reference.", async () => {
  const r1 = await api(PEOPLE.registrar, "PATCH", `/organizations/${MU}`, { ai: { enabled: false, contractRef: CONTRACT } });
  check(r1.status === 403, "the Registrar cannot switch it off (not an administrator)");
  const r2 = await api(PEOPLE.itAdmin, "PATCH", `/organizations/${MU}`, { ai: { enabled: false, contractRef: CONTRACT } });
  check(r2.status === 200 && r2.body.data?.organization.ai.enabled === false, "the IT Admin switches it off");
  const r3 = await ask(PEOPLE.registrar, MU);
  check(r3.status === 403 && r3.body.error?.code === "AI_DISABLED", "a question straight after is refused");
  const r4 = await api(PEOPLE.itAdmin, "PATCH", `/organizations/${MU}`, { ai: { enabled: true } });
  said(r4.body.error?.details?.[0]?.issue ?? JSON.stringify(r4.body));
  check(r4.status === 400, "it cannot be switched on without the contract reference");
  const r5 = await api(PEOPLE.itAdmin, "PATCH", `/organizations/${MU}`, { ai: { enabled: true, contractRef: CONTRACT } });
  check(r5.status === 200 && r5.body.data?.organization.ai.enabled === true, "with the reference, it is back on");
  const types = (await auditEvents(5)).map((e) => e.event_type);
  check(types.includes("ai.disabled") && types.includes("ai.enabled"), "switching off and on is in the audit log");
});

rl?.close();
console.log(`\n${bold("RESULT")}  ${green(`${passed} checks passed`)}${failed ? `, ${red(`${failed} failed`)}` : ""}.`);
if (failed) {
  console.log(red("\nWhat was different:"));
  for (const f of failures) console.log(red(`  • ${f}`));
  console.log("\nCopy this into the chat for Claude.");
} else {
  console.log(green('\nEverything behaved as it should. If you are happy, tell Claude: "Stage 1a approved".'));
}
process.exit(failed ? 1 : 0);
