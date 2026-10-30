#!/usr/bin/env node
/**
 * Manual-testing helper: answer every unanswered question in one assessment.
 *
 * It exists so Finalise can be exercised by hand. Finalising refuses while any
 * question is outstanding (D-041), and a generated assessment is 124 questions
 * for Mumbai University — nobody is clicking 124 dropdowns to reach the button.
 *
 * This is NOT part of the product and nothing depends on it. It signs in as a
 * real seeded user and calls the same `PUT …/responses/{code}` the UI calls, so
 * every answer still goes through the guard chain, the triggers and the
 * evidence cap. It cannot write a score: those are derived by the database.
 *
 * Usage, from the repo root, with `pnpm dev` running:
 *   node tools/answer_assessment.mjs "<assessment name>" [claim 0-5]
 *
 * Environment:
 *   APP_URL   the dev server (default http://localhost:3000 — Next picks
 *             another port when 3000 is taken, so pass it explicitly)
 *   AS_EMAIL  who to answer as (default the Anix consultant)
 *
 * Credentials come from the repo-root `.env.local`; nothing is printed.
 */
import { readFileSync } from "node:fs";

const [, , assessmentName, claimArg] = process.argv;
if (!assessmentName) {
  console.error('Usage: node tools/answer_assessment.mjs "<assessment name>" [claim 0-5]');
  process.exit(1);
}

const claim = Number(claimArg ?? 3);
if (!Number.isInteger(claim) || claim < 0 || claim > 5) {
  console.error(`claim must be an integer 0–5 (got ${claimArg})`);
  process.exit(1);
}

// `.env.local` holds values with spaces and `>`, so it is parsed rather than sourced.
const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n")
    .filter((line) => line.includes("=") && !line.trim().startsWith("#"))
    .map((line) => [line.slice(0, line.indexOf("=")).trim(), line.slice(line.indexOf("=") + 1).trim()]),
);

const APP = process.env.APP_URL ?? "http://localhost:3000";
const EMAIL = process.env.AS_EMAIL ?? "consultant@anix-ai.example.com";

const auth = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/token?grant_type=password`, {
  method: "POST",
  headers: { "Content-Type": "application/json", apikey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY },
  body: JSON.stringify({ email: EMAIL, password: env.SEED_USER_PASSWORD }),
}).catch((error) => {
  console.error(`cannot reach Supabase at ${env.NEXT_PUBLIC_SUPABASE_URL}: ${error.message}`);
  console.error("if this is an NXDOMAIN, the hosted project has lapsed — see docs/STATE.md");
  process.exit(1);
});
if (!auth.ok) {
  console.error(`sign-in failed for ${EMAIL}:`, (await auth.text()).slice(0, 200));
  process.exit(1);
}
const { access_token: token } = await auth.json();
const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

const api = async (path, init) => {
  const res = await fetch(`${APP}/api/v1${path}`, { ...init, headers });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body };
};

const health = await fetch(`${APP}/api/v1/health`).catch(() => null);
if (!health?.ok) {
  console.error(`no dev server at ${APP} — start it with \`pnpm dev\`, then pass APP_URL if the port differs`);
  process.exit(1);
}

const me = await api("/auth/me/organizations");
const org =
  me.body?.data?.organizations?.find((o) => o.name.includes("Mumbai")) ?? me.body?.data?.organizations?.[0];
if (!org) {
  console.error("no organisation for this user:", JSON.stringify(me.body).slice(0, 200));
  process.exit(1);
}

const list = await api(`/organizations/${org.id}/assessments`);
const assessment = list.body?.data?.assessments?.find((a) => a.name === assessmentName);
if (!assessment) {
  console.error(`no assessment named "${assessmentName}" in ${org.name}. Available:`);
  for (const a of list.body?.data?.assessments ?? []) console.error(`  - ${a.name}  (${a.status})`);
  console.error("\nCreate one: Scope → step 7 → name it → Generate assessment.");
  process.exit(1);
}
if (assessment.status === "finalised" || assessment.status === "submitted") {
  console.error(`"${assessment.name}" is ${assessment.status} — its answers are locked.`);
  process.exit(1);
}

const [questions, answered] = await Promise.all([
  api(`/organizations/${org.id}/assessments/${assessment.id}/questions`),
  api(`/organizations/${org.id}/assessments/${assessment.id}/responses`),
]);
const done = new Set((answered.body?.data?.responses ?? []).map((r) => r.questionCode));
const todo = (questions.body?.data?.questions ?? []).filter((q) => !done.has(q.questionCode));

console.log(`${assessment.name} — ${done.size} answered, ${todo.length} to go (claim ${claim}, as ${EMAIL})`);

// In batches: 124 sequential writes take minutes against Mumbai. Each answer is
// a different question, and the draft → in_progress move they race on is
// idempotent, so concurrency is safe here.
let ok = 0;
const failures = [];
for (let i = 0; i < todo.length; i += 8) {
  const results = await Promise.all(
    todo.slice(i, i + 8).map(async (q) => ({
      code: q.questionCode,
      ...(await api(
        `/organizations/${org.id}/assessments/${assessment.id}/responses/${encodeURIComponent(q.questionCode)}`,
        { method: "PUT", body: JSON.stringify({ applicabilityDecision: "applicable", claimedMaturity: claim }) },
      )),
    })),
  );
  for (const r of results) {
    if (r.status === 200 || r.status === 201) ok += 1;
    else failures.push(`${r.code}: ${r.status} ${r.body?.error?.message ?? ""}`);
  }
  process.stdout.write(`\r  answered ${ok}/${todo.length}`);
}
if (todo.length > 0) process.stdout.write("\n");
for (const f of failures) console.error("  FAILED", f);

const { body } = await api(`/organizations/${org.id}/assessments/${assessment.id}/score`);
const o = body?.data?.overall;
console.log(
  `score now: ${o?.finalScore?.toFixed(2)} / ${o?.applicableWeight} · ${o?.maturityLevel} · ` +
    `${o?.criticalCount} critical · ${o?.highCount} high · ${o?.outstandingCount} outstanding`,
);
if (o?.redFlags?.length) console.log(`red flags: ${o.redFlags.map((f) => f.label).join(" · ")} → cap ${o.scoreCap}`);
console.log(
  o?.outstandingCount === 0
    ? "→ Finalise is now enabled in the UI."
    : "→ still outstanding, Finalise stays disabled.",
);
