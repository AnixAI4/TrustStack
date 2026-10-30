#!/usr/bin/env node
/**
 * Slice 11 Stage 2a — the manual test's API part, run for you, step by step.
 *
 *   node tools/ai_manual_test_2a.mjs
 *
 * Runs Part A of docs/testing/SLICE_11_stage2a_manual_test.md (Steps 1–11) against
 * the app on your laptop, as the seeded people. For each step it says, in plain
 * words, what it is checking, shows what TrustStack answered, and marks each
 * check ✓ or ✗. Press Enter to go to the next step. LOCAL STACK ONLY.
 *
 * It records a FICTIONAL open breach and two open rights requests on your LOCAL
 * Mumbai University (the seed has none open), and stores drafts there. Claude
 * rebuilds the local database afterwards. Nothing reaches the live site.
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
  legal: "legal@mumbai-university.example.com",
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
const STEPS = 11;
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
const mu = (path) => `/organizations/${MU}${path}`;
const ropaTotal = async () => (await api(PEOPLE.registrar, "GET", mu("/ropa"))).body.data.counts.total;
const PLACEHOLDER = "[To be completed by the organisation — do not name individuals in this draft.]";
const HOUR = 3_600_000;
const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());

console.log(bold("\nSlice 11 · Stage 2a — drafts for the registers, on your laptop"));
console.log(dim(`App: ${base} · the recorded fake answers, never the real model · nothing reaches the live site`));

const health = await fetch(`${base}/api/v1/health`).catch(() => null);
if (!health?.ok) {
  console.log(red(`\n✗ The app is not running at ${base}. Start it in another Terminal tab with:\n\n   AI_ENABLED=true AI_PROVIDER=fake pnpm dev\n`));
  process.exit(1);
}

let ropaDraft = null;
let breachId = "";
let intimation = null;
let requestId = "";
let response = null;
let recordsBefore = 0;

await step(
  "Draft a processing record from a description",
  "the Registrar describes an activity; the assistant drafts the record's fields. An email typed by mistake is masked before anything is sent, and NO record is added to the register.",
  async () => {
    recordsBefore = await ropaTotal();
    const r = await run("ropa_draft", {
      description: "Through the admissions portal we collect applicants' names, contact details and marks to decide admission. Questions to admissions.desk@example.com.",
    });
    said(r.status === 200 ? r.body.data.draft.answer.answer : JSON.stringify(r.body.error));
    check(r.status === 200 && r.body.data.draft.answer.kind === "draft", "it drafted a record (HTTP 200)");
    ropaDraft = r.body.data?.draft;
    check(Boolean(ropaDraft?.answer.draft.name) && Boolean(ropaDraft?.answer.draft.purpose), "the draft has a name and a purpose");
    check(ropaDraft?.answer.legalReviewRequired === false, "a register entry, not a legal draft");
    check(!("riskRatingAssessor" in (ropaDraft?.answer.draft ?? {})) && !("status" in (ropaDraft?.answer.draft ?? {})), "it never sets a risk rating or a status");
    check(!JSON.stringify((await storedContext(ropaDraft?.id)) ?? {}).includes("admissions.desk@example.com"), "the email was masked before it was sent");
    check((await ropaTotal()) === recordsBefore, `the register still has ${recordsBefore} records — nothing was saved`);
  },
);

await step(
  "MU Legal — who did not ask — accepts the draft, edited",
  "any person who can write to the register may accept (D-129.3); accepting keeps their text and still saves NO record — the form does that, in the browser (Part B).",
  async () => {
    const edited = { ...ropaDraft.answer.draft, name: "Undergraduate admissions (checked by Legal)" };
    const r = await api(PEOPLE.legal, "POST", mu(`/ai/drafts/${ropaDraft.id}/accept`), { output: edited });
    said(r.status === 200 ? `accepted by ${r.body.data.draft.decidedByName}` : JSON.stringify(r.body.error));
    check(r.status === 200 && r.body.data.draft.status === "accepted", "accepted (HTTP 200)");
    check(r.body.data?.draft.acceptedOutput?.name === edited.name, "it keeps Legal's edited name");
    check((await ropaTotal()) === recordsBefore, "the register still has no new record");
    const again = await api(PEOPLE.registrar, "POST", mu(`/ai/drafts/${ropaDraft.id}/discard`));
    check(again.status === 409, "a second decision is refused (HTTP 409)");
  },
);

await step(
  "The Dean reads the registers but writes none — so no drafts",
  "the Executive Sponsor holds the assistant and can read the register, but not write it: no draft to ask for, none to decide.",
  async () => {
    const ask = await run("ropa_draft", { description: "The library lends books and records borrowers' names and roll numbers." }, PEOPLE.dean);
    said(ask.body.error?.message ?? "");
    check(ask.status === 403, "the Dean cannot ask for a draft (HTTP 403)");
    const mine = await run("ropa_draft", { description: "The canteen records staff meal cards and the names on them." });
    const decide = await api(PEOPLE.dean, "POST", mu(`/ai/drafts/${mine.body.data.draft.id}/discard`));
    check(decide.status === 403, "…or discard one (HTTP 403)");
  },
);

await step(
  "Draft the Board intimation for a breach (Rule 7(2))",
  "a FICTIONAL open breach is recorded first, with the affected students told. Part (iv) — who caused it — is ALWAYS a placeholder; part (vi) comes from the breach register's own record, not the assistant.",
  async () => {
    const b = await api(PEOPLE.registrar, "POST", mu("/breaches"), {
      title: "Examinations portal account used from outside (manual test)",
      nature: "unauthorised_access",
      severity: "high",
      awareAt: new Date(Date.now() - 5 * HOUR).toISOString(),
      principalsAffected: 1200,
      dataCategories: "Names, roll numbers, marks",
      description: "A staff account was used from outside. The clerk is on clerk.desk@example.com.",
    });
    check(b.status === 201, "the fictional breach was recorded (HTTP 201)");
    breachId = b.body.data.incident.id;
    await api(PEOPLE.registrar, "PATCH", mu(`/breaches/${breachId}`), { principals: { at: new Date(Date.now() - 2 * HOUR).toISOString(), method: "Email to each student" } });
    const r = await run("breach_intimation_draft", { breachId });
    said(r.status === 200 ? r.body.data.draft.answer.answer : JSON.stringify(r.body.error));
    intimation = r.body.data?.draft;
    check(r.status === 200 && intimation.answer.legalReviewRequired === true, "a legal draft, marked for counsel (HTTP 200)");
    check(intimation?.answer.draft.personFindings === PLACEHOLDER, "(iv) is the placeholder — no one is named");
    said(`(vi): ${intimation?.answer.draft.principalsReport}`);
    check(/^The affected Data Principals were informed on .* IST, by: Email to each student/.test(intimation?.answer.draft.principalsReport ?? ""), "(vi) reports the recorded intimation");
    const ctx = JSON.stringify((await storedContext(intimation?.id)) ?? {});
    check(!ctx.includes("clerk.desk@example.com") && !/createdByName|closedByName|dismissalReason/.test(ctx), "no email, recorder or closer was sent");
  },
);

await step(
  "Accepting the intimation records nothing on the breach",
  "the accepted text is kept with the draft (D-129.1); recording that the report was made stays the breach's own step.",
  async () => {
    const r = await api(PEOPLE.legal, "POST", mu(`/ai/drafts/${intimation.id}/accept`), { output: intimation.answer.draft });
    check(r.status === 200, "accepted (HTTP 200)");
    const list = await api(PEOPLE.dean, "GET", mu(`/ai/drafts?targetId=${breachId}&status=accepted`));
    check(list.body.data?.drafts?.[0]?.id === intimation.id, "the Dean can read the accepted text (to copy)");
    const breach = await api(PEOPLE.registrar, "GET", mu(`/breaches/${breachId}`));
    check(breach.body.data.incident.board.report === null, "the Board report is still NOT recorded — a person records it");
  },
);

await step(
  "Draft a response to a rights request",
  "a FICTIONAL open erasure request from 'Asha Fictional-Requester' is recorded first. The letter uses [Name], [reference] and [date]; her name, email and enrolment number are never sent; there is no outcome in the draft.",
  async () => {
    const q = await api(PEOPLE.registrar, "POST", mu("/rights-requests"), {
      kind: "erasure",
      receivedOn: today,
      channel: "email",
      requesterName: "Asha Fictional-Requester",
      requesterEmail: "asha.fictional@example.com",
      principalIdentifier: "ENROL-FICTIONAL-42",
      summary: "Asks the university to delete her hostel records now that she has left.",
    });
    check(q.status === 201, "the fictional request was recorded (HTTP 201)");
    requestId = q.body.data.request.id;
    const r = await run("rights_response_draft", { requestId });
    said(r.status === 200 ? r.body.data.draft.answer.answer : JSON.stringify(r.body.error));
    response = r.body.data?.draft;
    check(r.status === 200 && response.answer.legalReviewRequired === true, "a legal draft, marked for counsel (HTTP 200)");
    check(response?.answer.draft.letter.startsWith("Dear [Name],") && response.answer.draft.letter.includes("[reference]"), "the letter keeps its placeholders");
    check(Object.keys(response?.answer.draft ?? {}).sort().join(",") === "letter,summary", "the draft has a letter and a summary — no outcome");
    const ctx = JSON.stringify((await storedContext(response?.id)) ?? {});
    check(!/Asha|asha\.fictional|ENROL-FICTIONAL/.test(ctx), "her name, email and enrolment number were never sent");
  },
);

await step(
  "Accepting the response records no response — and an outcome is refused",
  "accepting keeps the letter to copy and fills the summary box in the browser; the outcome (fulfilled / partly / declined) is a person's decision (D-129.2).",
  async () => {
    const bad = await api(PEOPLE.registrar, "POST", mu(`/ai/drafts/${response.id}/accept`), { output: { ...response.answer.draft, outcome: "fulfilled" } });
    check(bad.status === 400, "an outcome cannot be accepted as part of the draft (HTTP 400)");
    const r = await api(PEOPLE.registrar, "POST", mu(`/ai/drafts/${response.id}/accept`), { output: response.answer.draft });
    check(r.status === 200, "the letter is accepted (HTTP 200)");
    const req = await api(PEOPLE.registrar, "GET", mu(`/rights-requests/${requestId}`));
    check(req.body.data.request.status === "open" && req.body.data.request.response === null, "the request is still open, with no response recorded");
  },
);

await step(
  "A letter that decides the outcome is refused",
  "if the assistant wrote 'We have erased all of your personal data', the server refuses it — the answer is stored as rejected and never shown.",
  async () => {
    const r = await run("rights_response_draft", { requestId, ask: "[fake:states_outcome]" });
    said(r.body.error?.message ?? JSON.stringify(r.body));
    check(r.status === 422 && detail(r, "rejection") === "wording", "refused for its wording (HTTP 422)");
    check(/decided the outcome of the request/.test(r.body.error?.message ?? ""), "…and the message says why: the outcome is a person's decision");
  },
);

await step(
  "Every decision is in the audit log — as the person, never the text",
  "`ai.draft.accepted` / `ai.draft.discarded`, who decided, whether they edited it — never what the draft said.",
  async () => {
    const events = (await auditEvents(30)).filter((e) => e.event_type.startsWith("ai.draft."));
    said(events.map((e) => `${e.event_type} (${e.metadata.task}${e.metadata.edited ? ", edited" : ""})`).join(" · "));
    check(events.some((e) => e.event_type === "ai.draft.accepted" && e.metadata.task === "ropa_draft" && e.metadata.edited === true), "the ROPA draft: accepted, edited");
    check(events.some((e) => e.event_type === "ai.draft.accepted" && e.metadata.task === "breach_intimation_draft"), "the intimation: accepted");
    check(!JSON.stringify(events).includes("checked by Legal") && !JSON.stringify(events).includes("Dear [Name]"), "…and never the words");
  },
);

await step(
  "Another organisation's people cannot touch these drafts",
  "Bharat Manufacturing's owner is refused on Mumbai University's path; and BML's own assistant is still off.",
  async () => {
    const r = await api(PEOPLE.bmlOwner, "POST", mu(`/ai/drafts/${response.id}/discard`));
    check(r.status === 403, "refused on Mumbai University's drafts (HTTP 403)");
    const off = await api(PEOPLE.bmlOwner, "POST", `/organizations/${BML}/ai/ropa_draft`, { description: "A description long enough to draft a record from." });
    check(off.status === 403 && off.body.error?.code === "AI_DISABLED", "BML's assistant is off (HTTP 403)");
  },
);

await step("The reference set's thirty cases pass the server's checks", "the twenty explain cases (1b) and the ten new drafting cases (D1–D10) — each recorded answer goes through the guardrails and its case's checks.", async () => {
  const outText = execFileSync("npx", ["vitest", "run", "--project", "unit", "tests/unit/ai-reference-set.test.ts"], {
    cwd: new URL("../apps/web/", import.meta.url),
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, NO_COLOR: "1", FORCE_COLOR: "0" },
  });
  const plain = outText.replace(/\x1b\[[0-9;]*m/g, "");
  const m = /Tests\s+(\d+) passed/.exec(plain);
  said(m ? `${m[1]} reference checks passed` : plain.slice(-300));
  check(Boolean(m) && Number(m[1]) >= 36, "all thirty cases, and the checks on the server's rules, pass");
});

rl?.close();
console.log(bold(`\n${failed === 0 ? green("All green") : red("Something failed")} — ${passed} of ${passed + failed} checks passed.`));
for (const f of failures) console.log(red(`   ✗ ${f}`));
console.log(dim("\nNow do Part B in the browser (the manual test file). Then tell Claude, and it rebuilds the local database."));
process.exit(failed === 0 ? 0 : 1);
