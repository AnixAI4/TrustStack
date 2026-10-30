#!/usr/bin/env node
/**
 * Slice 11 Stage 1a — ask the AI Question Helper through the API, as a seeded
 * person, and print the answer in plain words (the manual test's tool:
 * docs/testing/SLICE_11_stage1a_manual_test.md). LOCAL STACK ONLY.
 *
 *   node tools/ai_ask.mjs                       # the Registrar asks about G1.2 on MU
 *   node tools/ai_ask.mjs --as dean@mumbai-university.example.com --question R1.1
 *   node tools/ai_ask.mjs --ask "What would count as evidence here?"
 *   node tools/ai_ask.mjs --org bml             # Bharat Manufacturing (off)
 *   node tools/ai_ask.mjs --status              # only GET …/ai
 *   node tools/ai_ask.mjs --raw                 # the whole JSON envelope
 *   node tools/ai_ask.mjs --as it.admin@mumbai-university.example.com --switch off
 *   node tools/ai_ask.mjs --as it.admin@mumbai-university.example.com --switch on --ref "DEMO-DPA-AI-0001"
 *   node tools/ai_ask.mjs --as it.admin@mumbai-university.example.com --audit   # the last ai.* audit events
 *
 * Reads the local stack's address and key from `supabase status` when they are
 * not exported, and the seed's local password (CI's, not a secret) when
 * SEED_USER_PASSWORD is not set. The app must be running (default
 * http://localhost:3001, or --base).
 */
import { execFileSync } from "node:child_process";

const args = process.argv.slice(2);
const flag = (name, fallback = null) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? fallback : (args[i + 1] ?? fallback);
};
const has = (name) => args.includes(`--${name}`);

const ORGS = {
  mu: "0b000000-0000-4000-8000-000000000001",
  bml: "0b000000-0000-4000-8000-000000000002",
};
const MU_BASELINE = "0b000006-0000-4000-8000-000000000001";

const base = flag("base", "http://localhost:3001");
const email = flag("as", "dpdp.owner@mumbai-university.example.com");
const orgKey = flag("org", "mu");
const org = ORGS[orgKey] ?? orgKey;
const questionCode = flag("question", "G1.2");
const ask = flag("ask");

let url = process.env.NEXT_PUBLIC_SUPABASE_URL;
let anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
// .env.local points at HOSTED: read the LOCAL stack's own address and key instead.
if (!url || !anon || !/127\.0\.0\.1|localhost/.test(url)) {
  const env = Object.fromEntries(
    execFileSync("npx", ["-y", "supabase@2.117.0", "status", "-o", "env"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] })
      .split("\n")
      .map((l) => /^([A-Z_]+)="?(.*?)"?$/.exec(l))
      .filter(Boolean)
      .map((m) => [m[1], m[2]]),
  );
  url = env.API_URL;
  anon = env.ANON_KEY;
}
const password = process.env.SEED_USER_PASSWORD || "ci-local-only-Passw0rd-not-secret";
if (!url || !anon) {
  console.error("The local stack is not running — open Docker Desktop and start it (npx -y supabase@2.117.0 start).");
  process.exit(2);
}
if (!/^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(url) || !/^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(base)) {
  console.error(`Local stack only — refusing ${url} / ${base}.`);
  process.exit(2);
}

const signIn = await fetch(`${url}/auth/v1/token?grant_type=password`, {
  method: "POST",
  headers: { apikey: anon, "Content-Type": "application/json" },
  body: JSON.stringify({ email, password }),
});
if (!signIn.ok) {
  console.error(`Sign-in failed for ${email}: ${signIn.status} ${await signIn.text()}`);
  process.exit(1);
}
const { access_token: token } = await signIn.json();
const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

if (has("switch")) {
  const on = flag("switch") === "on";
  const res = await fetch(`${base}/api/v1/organizations/${org}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ ai: { enabled: on, contractRef: flag("ref") } }),
  });
  const body = await res.json();
  console.log(`\n${email} turns the AI assistant ${on ? "ON" : "OFF"} → HTTP ${res.status}`);
  if (body.success) console.log(JSON.stringify(body.data.organization.ai, null, 2));
  else {
    console.log(`✗ ${body.error.code}: ${body.error.message}`);
    for (const d of body.error.details ?? []) console.log(`  ${d.field ? `${d.field}: ` : ""}${d.issue}`);
  }
  process.exit(0);
}

if (has("audit")) {
  // As the signed-in person, through RLS: an auditor or an admin reads the log; others see nothing.
  const q = new URLSearchParams({
    select: "created_at,event_type,user_id,metadata",
    organization_id: `eq.${org}`,
    event_type: "like.ai.*",
    order: "created_at.desc",
    limit: flag("limit", "10"),
  });
  const res = await fetch(`${url}/rest/v1/audit_logs?${q}`, { headers: { ...headers, apikey: anon } });
  const rows = await res.json();
  console.log(`\nThe last ${rows.length} AI audit events in ${orgKey.toUpperCase()} (read as ${email}):\n`);
  for (const r of rows) {
    const m = r.metadata ?? {};
    const what = [m.task, m.targetKey && `question ${m.targetKey}`, m.rejection && `refused: ${m.rejection}`, m.model, m.contractRef && `contract ${m.contractRef}`]
      .filter(Boolean)
      .join(" · ");
    console.log(`  ${r.created_at.slice(0, 19).replace("T", " ")}  ${r.event_type.padEnd(22)} ${what}`);
  }
  process.exit(0);
}

const status = await fetch(`${base}/api/v1/organizations/${org}/ai`, { headers });
const statusBody = await status.json();
if (has("status")) {
  console.log(JSON.stringify(statusBody, null, 2));
  process.exit(0);
}

const started = Date.now();
const res = await fetch(`${base}/api/v1/organizations/${org}/ai/question_helper`, {
  method: "POST",
  headers,
  body: JSON.stringify({ assessmentId: MU_BASELINE, questionCode, ...(ask ? { ask } : {}) }),
});
const body = await res.json();
const seconds = ((Date.now() - started) / 1000).toFixed(1);

if (has("raw")) {
  console.log(JSON.stringify(body, null, 2));
  process.exit(0);
}

console.log(`\n${email} → ${orgKey.toUpperCase()} · question ${questionCode} · HTTP ${res.status} in ${seconds}s\n`);
if (!body.success) {
  console.log(`✗ ${body.error.code}: ${body.error.message}`);
  for (const d of body.error.details ?? []) console.log(`  ${d.field ? `${d.field}: ` : ""}${d.issue}`);
  process.exit(0);
}
const { draft } = body.data;
const a = draft.answer;
console.log(`ANSWER        ${a.answer}`);
console.log(`WHY IT MATTERS ${a.whyItMatters}`);
console.log(`NEXT STEP     ${a.nextStep.label}  [${a.nextStep.page}]`);
console.log(`THE LAW`);
for (const l of a.law) console.log(`  · ${l.citation} (${l.source === "statute" ? "the law" : "TrustStack default"}) — ${l.point}`);
if (a.suggestedEvidence.length) console.log(`EVIDENCE      ${a.suggestedEvidence.join(" · ")}`);
if (a.missingInformation.length) console.log(`MISSING       ${a.missingInformation.join(" · ")}`);
console.log(`\nTELL ME MORE  ${a.moreDetail}`);
console.log(`\n— ${a.reviewNote}${a.counselNote ? ` ${a.counselNote}` : ""}`);
console.log(`— ${a.caveat}`);
console.log(
  `\nflags: requiresHumanReview=${a.requiresHumanReview} legalReviewRequired=${a.legalReviewRequired} injectionFlagged=${draft.injectionFlagged}` +
    ` citationsDropped=${draft.citationFlags.length} · model ${draft.model} · draft ${draft.id}`,
);
