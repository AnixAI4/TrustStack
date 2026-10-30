#!/usr/bin/env node
/**
 * The visual journey report (multi-level assessment, Step 4b) — production-grade, data-driven visuals.
 *
 *   pnpm --filter @truststack/core build && node tools/visual_report.mjs
 *   node tools/visual_report.mjs --no-db        # the assessment section only (no local database)
 *
 * Every number is computed, never typed:
 *  - THE ASSESSMENT: the validated Excel MVP's 98 answers (packages/db/question-bank/workbook-sample.json,
 *    the scoring oracle) scored by TrustStack's own engine (@truststack/core `scoreAssessment`) twice —
 *    PROVEN with the product's evidence cap (SPEC_CAP_RULE, D-045) and DECLARED with the Pulse rule
 *    (claimed → claimed, Step 3 Q4). The two are shown side by side and never blended.
 *  - THE PLATFORM JOURNEY: the LOCAL demo tenant's registers (Mumbai University seed), read read-only from
 *    the local Supabase container. Never the hosted database.
 *
 * Writes docs/reference/assessment_visuals/VISUAL_JOURNEY_REPORT.html (self-contained; Apache ECharts
 * 5.5.0 from cdnjs, jsDelivr as fallback). In the product these charts become components fed by the same readers (Step 7).
 */
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const core = await import(path.join(ROOT, "packages/core/dist/index.js"));
const { DPDP_DOMAINS, scoreAssessment, questionSeverity, questionPriority, MATURITY_BANDS, ENGINE_VERSION } = core;
const OUT = path.join(ROOT, "docs/reference/assessment_visuals/VISUAL_JOURNEY_REPORT.html");
const noDb = process.argv.includes("--no-db");

// ---------------------------------------------------------------- the assessment (oracle sample)
const sample = JSON.parse(readFileSync(path.join(ROOT, "packages/db/question-bank/workbook-sample.json"), "utf8"));
const pack = JSON.parse(readFileSync(path.join(ROOT, "packages/db/question-bank/core-pack.json"), "utf8"));
const meta = new Map(pack.questions.map((q) => [q.questionCode, q]));
const domainsInput = DPDP_DOMAINS.map((d) => {
  const responses = sample.responses
    .filter((r) => r.domainCode === d.code)
    .map((r) => ({ questionCode: r.questionCode, applicabilityDecision: "applicable", claimedMaturity: r.claimedMaturity, evidenceLevel: r.evidenceLevel }));
  return { code: d.code, weight: d.weight, questionCount: responses.length, responses };
});
const proven = scoreAssessment(domainsInput);
const declared = scoreAssessment(domainsInput, { capRule: (claimed) => claimed });

const SHORT = { GOV: "Governance", INV: "Data inventory", ROPA: "Processing register", PURPOSE: "Purpose & basis", NOTICE: "Notice", CONSENT: "Consent", RIGHTS: "Rights", GRIEVANCE: "Grievance", RETENTION: "Retention", ACCURACY: "Accuracy", SECURITY: "Security", BREACH: "Breach", VENDOR: "Processors", CHILD: "Children", CROSSBORDER: "Cross-border", SDF_AI: "SDF & AI" };
const pct = (score, weight) => (score == null || !weight ? 0 : Math.round((score / weight) * 1000) / 10);
const domains = DPDP_DOMAINS.map((d) => {
  const p = proven.domains.find((x) => x.code === d.code);
  const c = declared.domains.find((x) => x.code === d.code);
  return {
    code: d.code, name: SHORT[d.code] ?? d.name, weight: d.weight,
    proven: p.score ?? 0, declared: c.score ?? 0, provenPct: pct(p.score, d.weight), declaredPct: pct(c.score, d.weight),
    evidenceConfidence: p.evidenceConfidence, critical: p.criticalCount, high: p.highCount, status: p.status,
  };
});
const matrix = Array.from({ length: 6 }, () => Array(6).fill(0));
for (const r of sample.responses) matrix[r.claimedMaturity][r.evidenceLevel] += 1;
const overClaimed = sample.responses.filter((r) => r.claimedMaturity > Math.min(r.claimedMaturity, [1, 2, 2, 3, 4, 5][r.evidenceLevel])).length;

const GROUPS = { GOV: "Governance & data", INV: "Governance & data", ROPA: "Governance & data", PURPOSE: "Governance & data", ACCURACY: "Governance & data", RETENTION: "Governance & data",
  NOTICE: "People-facing", CONSENT: "People-facing", RIGHTS: "People-facing", GRIEVANCE: "People-facing",
  SECURITY: "Security & vendors", BREACH: "Security & vendors", VENDOR: "Security & vendors", CHILD: "Special risk", CROSSBORDER: "Special risk", SDF_AI: "Special risk" };
const SEV = { critical: "Critical", high: "High", medium: "Medium", low: "Low" };
const flows = new Map();
const owners = new Map();
const gapsByDomain = new Map();
for (const r of sample.responses) {
  const adj = Math.min(r.claimedMaturity, [1, 2, 2, 3, 4, 5][r.evidenceLevel]);
  if (adj > 3) continue; // a gap opens at adjusted <= 3 (D-054)
  const sev = questionSeverity(adj);
  if (!SEV[sev]) continue;
  const pr = questionPriority(sev);
  const g = GROUPS[r.domainCode];
  const k1 = `${g}|${SEV[sev]}`, k2 = `${SEV[sev]}|${pr}`;
  flows.set(k1, (flows.get(k1) ?? 0) + 1);
  flows.set(k2, (flows.get(k2) ?? 0) + 1);
  const owner = (meta.get(r.questionCode)?.suggestedOwner ?? "Unassigned").split(/[+/,]/)[0].trim();
  owners.set(owner, (owners.get(owner) ?? 0) + 1);
  const gd = gapsByDomain.get(r.domainCode) ?? { critical: 0, high: 0, medium: 0, low: 0 };
  gd[sev] += 1;
  gapsByDomain.set(r.domainCode, gd);
}
const sankeyLinks = [...flows].map(([k, v]) => { const [s, t] = k.split("|"); return { source: s, target: t, value: v }; });

// ---------------------------------------------------------------- the platform journey (local demo tenant)
function q(sql) {
  const out = execFileSync("docker", ["exec", "-i", "supabase_db_truststack", "psql", "-U", "postgres", "-d", "postgres", "-Atc", sql], { encoding: "utf8" });
  return JSON.parse(out.trim() || "null") ?? [];
}
let reg = null;
if (!noDb) {
  try {
    const org = "(select id from organizations where name = 'Mumbai University')";
    reg = {
      ropa: q(`select coalesce(json_agg(json_build_object('code',record_code,'name',name,'completeness',completeness_score,'risk',risk_points,'rating',risk_rating,'principals',coalesce(estimated_data_principals,0),'children',children_data,'xb',cross_border,'basis',lawful_basis) order by record_code),'[]') from ropa_records where organization_id=${org}`),
      rights: q(`select coalesce(json_agg(json_build_object('code',request_code,'kind',kind,'status',status,'received',received_on,'respondBy',respond_by,'responded',responded_on) order by received_on),'[]') from rights_requests where organization_id=${org}`),
      breaches: q(`select coalesce(json_agg(json_build_object('code',incident_code,'status',status,'aware',aware_at,'due',board_report_due_at,'reported',board_report_at,'told',principals_intimated_at,'severity',severity)),'[]') from breach_incidents where organization_id=${org}`),
      vendors: q(`select coalesce(json_agg(json_build_object('name',name,'role',vendor_role,'contract',contract_exists,'clauses',dpdp_clauses,'xb',cross_border,'reviewBy',contract_review_by)),'[]') from vendors where organization_id=${org}`),
      retention: q(`select coalesce(json_agg(json_build_object('basis',basis,'months',period_months,'starts',starts_on,'ends',ends_on,'informBy',inform_by,'record',(select record_code from ropa_records r where r.id=s.ropa_record_id))),'[]') from retention_schedules s where organization_id=${org}`),
      ai: q(`select coalesce(json_agg(json_build_object('name',name,'status',status,'reviewed',last_reviewed_on,'human',human_review)),'[]') from ai_systems where organization_id=${org}`),
      actions: q(`select coalesce(json_agg(json_build_object('title',title,'status',status,'due',due_date)),'[]') from gap_actions where organization_id=${org}`),
      notices: q(`select coalesce(json_agg(json_build_object('lang',language,'status',status,'version',version)),'[]') from privacy_notices where organization_id=${org}`),
      scope: q(`select coalesce(json_agg(json_build_object('derived',scope_derived_at,'packs',pack_codes,'status',status,'answered',(select count(*) from assessment_responses r where r.assessment_id=a.id),'questions',(select count(*) from assessment_questions x where x.assessment_id=a.id))),'[]') from assessments a where organization_id=${org}`),
      counts: q(`select json_build_object('reports',(select count(*) from reports where organization_id=${org}),'evidence',(select count(*) from evidence where organization_id=${org}),'consent',(select count(*) from consent_records where organization_id=${org}),'users',(select count(*) from organization_users where organization_id=${org}))`),
    };
  } catch (e) {
    console.warn(`local database not reachable (${e.message.split("\n")[0]}); writing the assessment section only`);
  }
}

const data = {
  generatedAt: new Date().toISOString(),
  engineVersion: ENGINE_VERSION,
  source: sample.assessment,
  overall: {
    proven: proven.finalScore, provenRaw: proven.rawScore, declared: declared.finalScore, declaredRaw: declared.rawScore,
    cap: proven.scoreCap, declaredCap: declared.scoreCap, confidence: proven.evidenceConfidence,
    provenBand: proven.maturityLevel, declaredBand: declared.maturityLevel,
    critical: proven.criticalCount, high: proven.highCount, redFlags: proven.redFlags.map((f) => f.code ?? f.label ?? String(f)),
    declaredRedFlags: declared.redFlags.map((f) => f.code ?? f.label ?? String(f)), answers: sample.responses.length, overClaimed,
  },
  bands: MATURITY_BANDS.map((b) => ({ label: b.label, max: b.maxPercent === Infinity ? 1 : b.maxPercent })),
  domains, matrix, sankeyLinks,
  owners: [...owners].sort((a, b) => b[1] - a[1]).slice(0, 8),
  priorities: (() => { const c = { P0: 0, P1: 0, P2: 0, P3: 0 }; for (const r of sample.responses) { const adj = Math.min(r.claimedMaturity, [1, 2, 2, 3, 4, 5][r.evidenceLevel]); if (adj > 3) continue; const pr = questionPriority(questionSeverity(adj)); if (pr in c) c[pr] += 1; } return c; })(),
  gapsByDomain: [...gapsByDomain].map(([code, v]) => ({ code, name: domains.find((d) => d.code === code).name, ...v })),
  registers: reg,
};

const template = readFileSync(path.join(ROOT, "tools/visual_report_template.html"), "utf8");
writeFileSync(OUT, template.replace("__DATA__", JSON.stringify(data).replace(/</g, "\\u003c")), "utf8");
console.log(`proven ${proven.finalScore.toFixed(1)} (cap ${proven.scoreCap}) · declared ${declared.finalScore.toFixed(1)} (cap ${declared.scoreCap}) · ${overClaimed} of ${sample.responses.length} answers over-claimed · registers: ${reg ? "yes" : "no"}`);
console.log(`wrote ${path.relative(ROOT, OUT)}`);
