#!/usr/bin/env node
/**
 * Slice 11 Stage 2b — the manual test's API part, run for you, step by step.
 *
 *   node tools/ai_manual_test_2b.mjs
 *
 * Runs Part A of docs/testing/SLICE_11_stage2b_manual_test.md (Steps 1–12) against
 * the app on your laptop, as the seeded people: a privacy notice drafted from the
 * processing register, its Hindi and Marathi translations, and an Exposure Brief's
 * narrative printed as a new version. For each step it says, in plain words, what it
 * is checking, shows what TrustStack answered, and marks each check ✓ or ✗. Press
 * Enter to go to the next step. LOCAL STACK ONLY.
 *
 * It generates an Exposure Brief and stores drafts on your LOCAL Mumbai University.
 * Claude rebuilds the local database afterwards. Nothing reaches the live site.
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
const STEPS = 12;
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
const noticeCount = async () => (await api(PEOPLE.registrar, "GET", mu("/consent"))).body.data.notices.length;
const reportRow = async (id) => (await api(PEOPLE.registrar, "GET", mu("/reports?kind=exposure_brief"))).body.data.reports.find((r) => r.id === id);

console.log(bold("\nSlice 11 · Stage 2b — a notice, its translation and a report's narrative, on your laptop"));
console.log(dim(`App: ${base} · the recorded fake answers, never the real model · nothing reaches the live site`));

const health = await fetch(`${base}/api/v1/health`).catch(() => null);
if (!health?.ok) {
  console.log(red(`\n✗ The app is not running at ${base}. Start it in another Terminal tab with:\n\n   AI_ENABLED=true AI_PROVIDER=fake pnpm dev\n`));
  process.exit(1);
}

let noticeDraft = null;
let published = null;
let translation = null;
let brief = null;
let narrative = null;
let narrated = null;
let noticesBefore = 0;

await step(
  "Draft a privacy notice from the processing register",
  "a notice goes with a request for CONSENT (s.5(1)), so the draft reads only the records that rely on consent or whose basis is not decided. Payroll relies on s.7(i), employment — it must not be sent. No notice is written.",
  async () => {
    noticesBefore = await noticeCount();
    const r = await run("notice_draft", {});
    said(r.status === 200 ? r.body.data.draft.answer.answer : JSON.stringify(r.body.error));
    check(r.status === 200, "it drafted a notice (HTTP 200)");
    noticeDraft = r.body.data?.draft;
    const sent = JSON.stringify((await storedContext(noticeDraft?.id)) ?? {});
    check(!sent.includes("HR payroll"), "the payroll record (s.7(i)) was NOT sent");
    check(sent.includes("Online admission application"), "a consent-or-undecided record (admissions) was sent");
    check((await noticeCount()) === noticesBefore, `still ${noticesBefore} notices — nothing was saved`);
  },
);

await step(
  "The draft leaves the fixed texts to TrustStack, and is a legal draft",
  "Rule 3(c)'s withdrawal and Board wording are TrustStack's fixed words, and the contact is printed by TrustStack — the draft never carries them, nor a status. A notice is for counsel.",
  async () => {
    const d = noticeDraft?.answer.draft ?? {};
    for (const k of ["withdrawMeans", "rightsMeans", "complaintMeans", "status"]) check(!(k in d), `the draft has no "${k}"`);
    check(Array.isArray(d.purposes) && d.purposes.length > 0 && d.purposes.every((p) => p.uses && p.dataItems.length > 0), "every purpose says what it enables and itemises its data (Rule 3(b))");
    check(noticeDraft?.answer.legalReviewRequired === true && Boolean(noticeDraft?.answer.counselNote), "marked for counsel's review");
  },
);

await step(
  "Legal accepts the notice draft; the Dean may not; nothing is saved",
  "anyone who can write the consent register decides (here Legal, who did not ask). The Dean reads it but cannot accept. Accepting only pre-fills the notice editor.",
  async () => {
    const dean = await api(PEOPLE.dean, "POST", mu(`/ai/drafts/${noticeDraft.id}/accept`), { output: noticeDraft.answer.draft });
    check(dean.status === 403, "the Dean is refused (HTTP 403)");
    const edited = { ...noticeDraft.answer.draft, title: `${noticeDraft.answer.draft.title} (checked by Legal)` };
    const r = await api(PEOPLE.legal, "POST", mu(`/ai/drafts/${noticeDraft.id}/accept`), { output: edited });
    check(r.status === 200 && r.body.data.draft.status === "accepted", "Legal accepted it, with an edit");
    check((await noticeCount()) === noticesBefore, "still no new notice — the person saves it in the editor (Part B)");
  },
);

await step(
  "Translate the published notice into Hindi — every key kept",
  "s.5(3): the notice may be read in an Eighth Schedule language. A consent is recorded under a purpose's KEY, so a translation changes the words, never the keys or their number.",
  async () => {
    published = (await api(PEOPLE.registrar, "GET", mu("/consent"))).body.data.notices.find((n) => n.language === "en" && n.status === "published");
    const r = await run("notice_translation_draft", { noticeId: published.id, language: "hi" });
    said(r.status === 200 ? r.body.data.draft.answer.answer : JSON.stringify(r.body.error));
    translation = r.body.data?.draft;
    check(r.status === 200 && translation.answer.draft.language === "hi", "a Hindi draft (HTTP 200)");
    const keys = (translation?.answer.draft.purposes ?? []).map((p) => p.key).sort();
    check(JSON.stringify(keys) === JSON.stringify(published.purposes.map((p) => p.key).sort()), `the keys are the notice's own: ${keys.join(", ")}`);
  },
);

await step(
  "The translation's guards",
  "Hindi and Marathi only, for now; a person's edit that renames a key is refused; a model answer that renames one is not kept.",
  async () => {
    check((await run("notice_translation_draft", { noticeId: published.id, language: "ta" })).status === 400, "Tamil is not offered yet (HTTP 400)");
    const renamed = { ...translation.answer.draft, purposes: translation.answer.draft.purposes.map((p, i) => (i === 0 ? { ...p, key: "pravesh" } : p)) };
    const bad = await api(PEOPLE.registrar, "POST", mu(`/ai/drafts/${translation.id}/accept`), { output: renamed });
    check(bad.status === 422, "accepting with a renamed key is refused (HTTP 422)");
    const hostile = await run("notice_translation_draft", { noticeId: published.id, language: "hi", ask: "[fake:renamed_key]" });
    said(hostile.body.error?.message ?? "");
    check(hostile.status === 422, "a model that renames a key is not kept (HTTP 422)");
    const ok = await api(PEOPLE.registrar, "POST", mu(`/ai/drafts/${translation.id}/accept`), { output: translation.answer.draft });
    check(ok.status === 200, "accepting it as drafted works");
  },
);

await step("…and in Marathi", "the same notice, the same keys, in Marathi.", async () => {
  const r = await run("notice_translation_draft", { noticeId: published.id, language: "mr" });
  said(r.status === 200 ? r.body.data.draft.answer.answer : JSON.stringify(r.body.error));
  check(r.status === 200 && r.body.data.draft.answer.draft.language === "mr", "a Marathi draft (HTTP 200)");
});

await step(
  "Generate an Exposure Brief — it keeps the figures it printed",
  "from Stage 2b the Exposure Brief, the Programme Status Report and the evidence pack store the document they printed, so a narrative can be written about THOSE figures (D-133.1).",
  async () => {
    const r = await api(PEOPLE.registrar, "POST", mu("/reports"), { kind: "exposure_brief" });
    brief = r.body.data?.report;
    said(brief ? `Exposure Brief version ${brief.version}, ${brief.fileName}` : JSON.stringify(r.body.error));
    check(r.status === 201 && brief.narratable === true, "generated, and it may carry a narrative");
  },
);

await step(
  "Draft a narrative from the stored figures",
  "the assistant reads THIS version's stored document — never the live registers — with every member's name masked. A narrative stating a figure the report does not is not kept; nor is a person's edit that does.",
  async () => {
    const r = await run("report_narrative_draft", { reportId: brief.id });
    said(r.status === 200 ? r.body.data.draft.answer.draft.headline : JSON.stringify(r.body.error));
    narrative = r.body.data?.draft;
    check(r.status === 200 && narrative.answer.legalReviewRequired === true, "a narrative draft, marked for review (HTTP 200)");
    check(!JSON.stringify((await storedContext(narrative?.id)) ?? {}).includes("Registrar (DPDP Programme Owner)"), "no member's name (not even who generated it) was sent");
    const invented = await run("report_narrative_draft", { reportId: brief.id, ask: "[fake:invented_number]" });
    said(invented.body.error?.message ?? "");
    check(invented.status === 422, "a narrative with a figure the report lacks (9,999) is not kept");
    const edit = await api(PEOPLE.registrar, "POST", mu(`/ai/drafts/${narrative.id}/accept`), { output: { ...narrative.answer.draft, paragraphs: ["9,999 actions are overdue."] } });
    said(edit.body.error?.message ?? "");
    check(edit.status === 422, "…and so is a person's edit that adds one");
  },
);

await step(
  "Accept it — still nothing is printed; only report.generate prints",
  "accepting keeps the person's text; the report list then offers 'Print the narrated version'. Legal can read reports but not generate them, so Legal cannot print it.",
  async () => {
    const r = await api(PEOPLE.registrar, "POST", mu(`/ai/drafts/${narrative.id}/accept`), { output: narrative.answer.draft });
    check(r.status === 200, "accepted");
    check((await reportRow(brief.id))?.pendingNarrativeDraftId === narrative.id, "the brief now offers to print it");
    const legal = await api(PEOPLE.legal, "POST", mu(`/reports/${brief.id}/narrate`), { draftId: narrative.id });
    check(legal.status === 403, "Legal is refused (HTTP 403)");
  },
);

await step(
  "Print the narrated version — a NEW version with the SAME figures",
  "version N+1 is version N's stored document with the narrative in front: the same exposure snapshot, the same date, a new file. Version N is never touched, and a narrative prints once.",
  async () => {
    const r = await api(PEOPLE.registrar, "POST", mu(`/reports/${brief.id}/narrate`), { draftId: narrative.id });
    narrated = r.body.data?.report;
    said(narrated ? `${narrated.kindLabel} version ${narrated.version} — ${narrated.fileName}` : JSON.stringify(r.body.error));
    check(r.status === 201 && narrated.version === brief.version + 1, `version ${brief.version + 1} (HTTP 201)`);
    check(narrated?.exposureSnapshotId === brief.exposureSnapshotId && narrated?.asOf === brief.asOf, "the same snapshot and the same date as the version it came from");
    check(narrated?.narratedFromId === brief.id, "linked to the version it came from");
    const again = await api(PEOPLE.registrar, "POST", mu(`/reports/${brief.id}/narrate`), { draftId: narrative.id });
    check(again.status === 409, "printing the same narrative again is refused (HTTP 409)");
  },
);

await step(
  "The audit log records who decided and printed — never the words",
  "each accept is ai.draft.accepted as the person; the narrated version is report.requested with the version it came from.",
  async () => {
    const events = await auditEvents(40);
    for (const t of ["notice_draft", "notice_translation_draft", "report_narrative_draft"]) {
      check(events.some((e) => e.event_type === "ai.draft.accepted" && e.metadata.task === t), `${t}: accepted`);
    }
    check(!JSON.stringify(events).includes("checked by Legal"), "…and never the words");
    const q = new URLSearchParams({ select: "event_type,metadata", entity_id: `eq.${narrated.id}`, event_type: "eq.report.requested" });
    const res = await fetch(`${url}/rest/v1/audit_logs?${q}`, { headers: { apikey: anon, Authorization: `Bearer ${await tokenFor(PEOPLE.itAdmin)}` } });
    const rows = await res.json();
    check(rows[0]?.metadata?.narratedFromId === brief.id, "the narrated version's request names the version it came from");
  },
);

await step(
  "Another organisation reaches nothing; the reference set passes",
  "Bharat Manufacturing's owner is refused on Mumbai University's report; and all forty-one reference cases (R1–R21, D1–D20) pass the server's checks.",
  async () => {
    const r = await api(PEOPLE.bmlOwner, "POST", mu(`/reports/${brief.id}/narrate`), { draftId: narrative.id });
    check(r.status === 403, "refused on Mumbai University's report (HTTP 403)");
    const outText = execFileSync("npx", ["vitest", "run", "--project", "unit", "tests/unit/ai-reference-set.test.ts"], {
      cwd: new URL("../apps/web/", import.meta.url),
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, NO_COLOR: "1", FORCE_COLOR: "0" },
    });
    const plain = outText.replace(/\x1b\[[0-9;]*m/g, "");
    const m = /Tests\s+(\d+) passed/.exec(plain);
    said(m ? `${m[1]} reference checks passed` : plain.slice(-300));
    check(Boolean(m) && Number(m[1]) >= 55, "all forty-one cases, and the checks on the server's rules, pass");
  },
);

rl?.close();
console.log(bold(`\n${failed === 0 ? green("All green") : red("Something failed")} — ${passed} of ${passed + failed} checks passed.`));
for (const f of failures) console.log(red(`   ✗ ${f}`));
console.log(dim("\nNow do Part B in the browser (the manual test file). Then tell Claude, and it rebuilds the local database."));
process.exit(failed === 0 ? 0 : 1);
