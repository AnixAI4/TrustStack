#!/usr/bin/env node
/**
 * Slice 11 — the reference-answer test, run by hand (SLICE_11 §4.13; D-126.3).
 *
 *   node tools/ai_reference_run.mjs [--base http://localhost:3001] [--only R1,R6] [--out results.json]
 *
 * Asks each case of packages/core's reference set through the real gateway, as
 * Mumbai University's DPDP Programme Owner (fictional demo data, §6.6), and runs
 * the same check CI runs on the recorded answers (`checkReferenceAnswer`) on what
 * comes back. LOCAL STACK ONLY.
 *
 * Stage 2a: the ten DRAFTING cases too (D1–D10, `checkDraftReferenceAnswer`). The
 * Rule 7(2) and rights cases need an open breach and open requests, which the seed
 * does not have: the runner records them on the LOCAL Mumbai University first
 * (fictional; "Asha Fictional-Requester" is there to prove no name reaches a draft).
 * `--only D1,D4` runs some; `--explain` or `--drafts` one set.
 *
 * Stage 2b: D11–D20. A notice is drafted from MU's own processing register; a
 * translation from MU's published English notice; a narrative from a FRESH report of
 * the case's kind, generated here on the local MU. The narrative's number check ran in
 * the gateway against that report's own stored document, so the CI fixture text the
 * case carries is not used here.
 *
 * Against the LIVE model (before every release, after any prompt or model change):
 *   AI_ENABLED=true AI_PROVIDER=anthropic pnpm dev     (the key in .env.local; never committed)
 * Against the recorded fake it only proves the runner works:
 *   AI_ENABLED=true AI_PROVIDER=fake pnpm dev
 *
 * Every case stores a draft on the LOCAL database; rebuild it from the seed afterwards.
 * Needs `pnpm --filter @truststack/core build` (it reads core's built set).
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import {
  AI_DRAFT_REFERENCE_SET,
  AI_REFERENCE_SET,
  AI_REFERENCE_SET_VERSION,
  checkDraftReferenceAnswer,
  checkReferenceAnswer,
} from "../packages/core/dist/index.js";

const args = process.argv.slice(2);
const opt = (name) => (args.includes(name) ? args[args.indexOf(name) + 1] : undefined);
const base = opt("--base") ?? "http://localhost:3001";
const only = (opt("--only") ?? "").split(",").filter(Boolean);
const out = opt("--out");
const onlyExplain = args.includes("--explain");
const onlyDrafts = args.includes("--drafts");

const MU = "0b000000-0000-4000-8000-000000000001";
const ASSESSMENT = "0b000006-0000-4000-8000-000000000001";
const REGISTRAR = "dpdp.owner@mumbai-university.example.com";

const green = (s) => `\x1b[32m${s}\x1b[0m`;
const red = (s) => `\x1b[31m${s}\x1b[0m`;
const bold = (s) => `\x1b[1m${s}\x1b[0m`;
const dim = (s) => `\x1b[2m${s}\x1b[0m`;

if (!/^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(base)) {
  console.log(red(`✗ The reference run is for your laptop only — refusing ${base}.`));
  process.exit(1);
}
let url = process.env.NEXT_PUBLIC_SUPABASE_URL;
let anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
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

const signIn = await fetch(`${url}/auth/v1/token?grant_type=password`, {
  method: "POST",
  headers: { apikey: anon, "Content-Type": "application/json" },
  body: JSON.stringify({ email: REGISTRAR, password }),
});
if (!signIn.ok) {
  console.log(red("✗ Could not sign in to the local stack. Is Docker running, and the database seeded?"));
  process.exit(1);
}
const token = (await signIn.json()).access_token;
async function api(method, path, body) {
  const res = await fetch(`${base}/api/v1/organizations/${MU}${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return { status: res.status, body: await res.json() };
}

const status = await api("GET", "/ai");
if (status.status !== 200 || !status.body.data.ai.available) {
  console.log(red(`✗ The assistant is not available for Mumbai University here: ${JSON.stringify(status.body.data?.ai ?? status.body.error)}`));
  process.exit(1);
}
const gaps = (await api("GET", `/assessments/${ASSESSMENT}/gaps`)).body.data.gaps;
const gap = gaps[0];

const bodyFor = (c) => {
  const ask = c.ask ? { ask: c.ask } : {};
  switch (c.target.kind) {
    case "question":
      return { assessmentId: ASSESSMENT, questionCode: c.target.questionCode, ...ask };
    case "gap":
      return { assessmentId: ASSESSMENT, gapId: gap.id, ...ask };
    case "action":
      return { actionId: gap.actions[0].id, ...ask };
    case "domain":
      return { assessmentId: ASSESSMENT, domainCode: c.target.domainCode, ...ask };
  }
};

console.log(bold(`\nThe reference set ${AI_REFERENCE_SET_VERSION} — ${base}`));
const results = [];
const explainCases = onlyDrafts ? [] : AI_REFERENCE_SET.filter((x) => only.length === 0 || only.includes(x.id));
const draftCases = onlyExplain ? [] : AI_DRAFT_REFERENCE_SET.filter((x) => only.length === 0 || only.includes(x.id));
for (const c of explainCases) {
  const started = Date.now();
  const r = await api("POST", `/ai/${c.task}`, bodyFor(c));
  const seconds = ((Date.now() - started) / 1000).toFixed(1);
  let failures;
  let draft = null;
  if (r.status === 200) {
    draft = r.body.data.draft;
    failures = checkReferenceAnswer(c, draft.answer).failures;
  } else {
    failures = [`HTTP ${r.status}: ${r.body.error?.message ?? "no answer"}`];
  }
  results.push({ id: c.id, task: c.task, ok: failures.length === 0, failures, seconds: Number(seconds), model: draft?.model, answer: draft?.answer ?? null });
  console.log(`${failures.length === 0 ? green("✓") : red("✗")} ${c.id} ${c.title} ${dim(`(${seconds}s${draft ? `, ${draft.model}` : ""})`)}`);
  for (const f of failures) console.log(`    ${red("·")} ${f}`);
  if (draft) console.log(`    ${dim(draft.answer.answer)}`);
}
// ---------------------------------------------------------------------------
// Stage 2a — the drafting cases, on fictional records made here (LOCAL only)
// ---------------------------------------------------------------------------
const HOUR = 3_600_000;
const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
const fixtures = {};
async function fixture(key, make) {
  fixtures[key] ??= await make();
  return fixtures[key];
}
async function breachFor(principalsTold) {
  return fixture(`breach-${principalsTold}`, async () => {
    const r = await api("POST", "/breaches", {
      title: "Examinations portal account used from outside (reference run)",
      nature: "unauthorised_access",
      severity: "high",
      awareAt: new Date(Date.now() - 6 * HOUR).toISOString(),
      principalsAffected: 1200,
      location: "Examinations portal, on the university's servers in Mumbai",
      dataCategories: "Names, roll numbers, programme, marks",
      likelyImpact: "Marks and contact details could be disclosed; phishing risk",
      containmentMeasures: "The account was disabled and its password reset",
      description: "A staff account of the examinations portal was used from outside the university to view student records.",
    });
    if (r.status !== 201) throw new Error(`could not record the reference breach: ${JSON.stringify(r.body.error)}`);
    const id = r.body.data.incident.id;
    if (principalsTold) {
      await api("PATCH", `/breaches/${id}`, { principals: { at: new Date(Date.now() - 2 * HOUR).toISOString(), method: "Email to each student affected" } });
    }
    return id;
  });
}
async function requestFor(kind, identityVerified) {
  return fixture(`rights-${kind}-${identityVerified}`, async () => {
    const r = await api("POST", "/rights-requests", {
      kind,
      receivedOn: today,
      channel: "email",
      requesterName: "Asha Fictional-Requester",
      requesterEmail: "asha.fictional@example.com",
      principalIdentifier: "ENROL-FICTIONAL-42",
      summary:
        kind === "erasure"
          ? "Asks the university to delete her hostel and mess records now that she has left."
          : kind === "correction"
            ? "Asks the university to correct the spelling of her surname in the examination records."
            : "Asks for a summary of the personal data the university holds about her and who it is shared with.",
    });
    if (r.status !== 201) throw new Error(`could not record the reference request: ${JSON.stringify(r.body.error)}`);
    const id = r.body.data.request.id;
    if (identityVerified) await api("PATCH", `/rights-requests/${id}`, { identity: { verifiedOn: today, method: "Matched the registered email address" } });
    return id;
  });
}
async function draftBodyFor(c) {
  const ask = c.ask ? { ask: c.ask } : {};
  switch (c.target.kind) {
    case "ropa":
      return { description: c.target.description, ...ask };
    case "breach":
      return { breachId: await breachFor(c.target.principalsTold), ...ask };
    case "rights":
      return { requestId: await requestFor(c.target.requestKind, c.target.identityVerified), ...ask };
    case "notice":
      return { ...ask };
    case "translation":
      return { noticeId: await publishedNotice(), language: c.target.language, ...ask };
    case "narrative":
      return { reportId: await reportFor(c.target.reportKind), ...ask };
  }
}
async function publishedNotice() {
  return fixture("notice", async () => {
    const r = await api("GET", "/consent");
    const n = (r.body.data?.notices ?? []).find((x) => x.language === "en" && x.status === "published");
    if (!n) throw new Error("MU has no published English notice — is the database seeded?");
    return n.id;
  });
}
async function reportFor(kind) {
  return fixture(`report-${kind}`, async () => {
    const r = await api("POST", "/reports", { kind });
    if (r.status !== 201) throw new Error(`could not generate the reference ${kind}: ${JSON.stringify(r.body.error)}`);
    return r.body.data.report.id;
  });
}

for (const c of draftCases) {
  const started = Date.now();
  const r = await api("POST", `/ai/${c.task}`, await draftBodyFor(c));
  const seconds = ((Date.now() - started) / 1000).toFixed(1);
  let failures;
  let draft = null;
  const rejection = (r.body.error?.details ?? []).find((d) => d.field === "rejection")?.issue;
  let refusedAsAllowed = false;
  if (r.status === 200) {
    draft = r.body.data.draft;
    // A narrative's numbers were checked by the gateway against the real stored report (D-133.1).
    failures = checkDraftReferenceAnswer({ ...c, facts: undefined }, draft.answer).failures;
  } else if (r.status === 422 && c.expect.refusalPasses && rejection === c.expect.refusalPasses) {
    // D-130.15: nothing was kept, which meets the case (D7: no compliance claim was kept).
    failures = [];
    refusedAsAllowed = true;
  } else {
    failures = [`HTTP ${r.status}: ${r.body.error?.message ?? "no answer"}`];
  }
  results.push({ id: c.id, task: c.task, ok: failures.length === 0, failures, seconds: Number(seconds), model: draft?.model, refused: refusedAsAllowed ? rejection : undefined, answer: draft?.answer ?? null });
  console.log(`${failures.length === 0 ? green("✓") : red("✗")} ${c.id} ${c.title} ${dim(`(${seconds}s${draft ? `, ${draft.model}` : ""})`)}`);
  for (const f of failures) console.log(`    ${red("·")} ${f}`);
  if (draft) console.log(`    ${dim(draft.answer.answer)}`);
  if (refusedAsAllowed) console.log(`    ${dim(`refused (${rejection}) — nothing kept, which this case allows`)}`);
}

const passed = results.filter((r) => r.ok).length;
console.log(bold(`\n${passed} of ${results.length} cases pass.`));
if (out) {
  fs.writeFileSync(out, JSON.stringify({ version: AI_REFERENCE_SET_VERSION, base, ranAt: new Date().toISOString(), results }, null, 2));
  console.log(dim(`Results written to ${out}`));
}
process.exit(passed === results.length ? 0 : 1);
