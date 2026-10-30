/**
 * The 16-domain scoring engine (Slice 5). Pure functions, no I/O.
 *
 * Slice 4 settled what ONE answer is worth: `adjusted = min(claimed,
 * EVIDENCE_CAP[level])` (`scoring.ts`). This file aggregates those adjusted
 * scores into a domain score, the sixteen into an overall DPDP Compass
 * Readiness Score, and applies the red-flag caps.
 *
 * DPDP anchoring: the red flags encode the obligations whose absence makes
 * everything else moot — no DPDP owner, no inventory, no ROPA, no security
 * safeguards, no breach readiness, no processor governance, unreviewed
 * children's data. A score that let those be averaged away would be a
 * readiness score in name only.
 *
 * Three things here are deliberate and easy to get wrong:
 *
 * 1. **The cap rule is a PARAMETER of the aggregation** (D-048). The product
 *    always uses `SPEC_CAP_RULE`; the CI parity gate plugs in the workbook's
 *    naive `MIN(claimed, evidence)` to prove the aggregation — weights,
 *    averages, N/A handling, confidence, severity counts — reproduces the
 *    workbook exactly. The naive rule lives in the test fixture only and is
 *    never exported for product use.
 * 2. **Overall evidence confidence is the mean of DOMAIN confidences**, not of
 *    questions. Averaging questions gives a different number and fails parity.
 * 3. **An empty domain leaves the denominator; it never scores zero** (D-038).
 *    That applies to the weight denominator, to the confidence average and to
 *    the maturity band alike.
 *
 * Mirrored in SQL by `…_scoring_engine/migration.sql`, which is what actually
 * computes a finalised snapshot; `apps/web/tests/unit/scoring-engine.test.ts`
 * parses that migration and fails if the two ever differ.
 */

import { DOMAIN_CODES, domainByCode, type DomainCode } from "./domains.js";
import {
  adjustedScore,
  evidenceConfidence,
  ScoringInputError,
  type ApplicabilityDecision,
  type MaturityLevel,
} from "./scoring.js";

/**
 * Stamped on every snapshot. Bump it whenever a change here could give a
 * different number for the same answers — a stored score must always say
 * which engine produced it, or a reassessment delta (Slice 12) is unreadable.
 */
export const ENGINE_VERSION = "1.0.0";

// ---------------------------------------------------------------------------
// The cap rule, as a parameter
// ---------------------------------------------------------------------------

/** `(claimed, reviewed evidence level or null) → adjusted`. */
export type CapRule = (claimed: number, evidenceLevel: number | null) => MaturityLevel;

/**
 * The product's rule, and the only one the application or the database ever
 * uses: E0→1, E1→2, E2→2, E3→3, E4→4, E5→5 (D-045).
 */
export const SPEC_CAP_RULE: CapRule = adjustedScore;

// ---------------------------------------------------------------------------
// Maturity bands
// ---------------------------------------------------------------------------

export const MATURITY_BANDS = Object.freeze([
  { level: 0, label: "Level 0 - Not Started", maxPercent: 0.2 },
  { level: 1, label: "Level 1 - Aware", maxPercent: 0.4 },
  { level: 2, label: "Level 2 - Defined", maxPercent: 0.6 },
  { level: 3, label: "Level 3 - Implementing", maxPercent: 0.75 },
  { level: 4, label: "Level 4 - Operational", maxPercent: 0.9 },
  { level: 5, label: "Level 5 - Continuous Assurance", maxPercent: Infinity },
] as const);

export type MaturityBand = (typeof MATURITY_BANDS)[number];

/**
 * A proportion with floating-point noise removed, for comparing against a
 * boundary.
 *
 * A score is a sum of sixteen `(avg / 5) × weight` terms, and in binary
 * floating point that sum can land a hair off the value it stands for:
 * sixteen domains all averaging 1 give 20.000000000000004, not 20. Compared
 * raw, 0.20000000000000004 is "above" the 0.20 boundary and bands one level
 * too high — while the database, which sums exact numerics, bands the same
 * answers correctly. A live score and its own finalised snapshot then name
 * different maturity levels (found on a real assessment, 2026-10-02).
 *
 * Nine decimal places is far below anything a score can legitimately differ
 * by, and far above the noise (about 1e-16).
 */
export function exactProportion(value: number): number {
  return Math.round(value * 1e9) / 1e9;
}

/**
 * The band for a proportion in 0–1. Boundaries are INCLUSIVE of the lower
 * band, exactly as the workbook's nested `IF($G2<=0.2, …)` — so 0.40 is
 * "Aware", not "Defined".
 */
export function maturityBand(percent: number): MaturityBand {
  if (!Number.isFinite(percent)) throw new ScoringInputError(`maturity percent must be finite (got ${percent})`);
  const exact = exactProportion(percent);
  return MATURITY_BANDS.find((b) => exact <= b.maxPercent)!;
}

// ---------------------------------------------------------------------------
// Gap severity
// ---------------------------------------------------------------------------

export const GAP_SEVERITIES = ["no_gap", "improvement", "low", "medium", "high", "critical"] as const;
export type GapSeverity = (typeof GAP_SEVERITIES)[number];

export const GAP_SEVERITY_LABEL: Readonly<Record<GapSeverity, string>> = Object.freeze({
  no_gap: "No Gap",
  improvement: "Improvement",
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
});

/**
 * One answer's severity, from its ADJUSTED score — so an unevidenced claim is
 * graded on what the evidence supports, not on what was claimed.
 *
 * Under the spec's cap an adjusted 0 needs a claim of 0: an unevidenced claim
 * of 5 is **High**, not Critical. Slice 6 builds gaps on this; Slice 5 counts.
 */
export function questionSeverity(adjusted: number): GapSeverity {
  if (!Number.isInteger(adjusted) || adjusted < 0 || adjusted > 5) {
    throw new ScoringInputError(`adjusted score must be an integer 0–5 (got ${adjusted})`);
  }
  if (adjusted >= 5) return "no_gap";
  if (adjusted >= 4) return "improvement";
  if (adjusted >= 3) return "low";
  if (adjusted >= 2) return "medium";
  if (adjusted >= 1) return "high";
  return "critical";
}

/**
 * The remediation priority a severity carries — the workbook's `Responses!L`,
 * read from the formula: Critical→P0 · High→P1 · Medium→P2 · Low→P3 ·
 * Improvement→P3 · anything else "Monitor".
 *
 * This is the GAP's priority and it comes from severity, which is always
 * present. It is not the question's own authored `priority`, which is null on
 * 234 bank questions and is never guessed (`QUESTION_FORMAT.md`).
 *
 * Mirrored in SQL by `app.question_priority()` (Slice 6 migration).
 */
export const GAP_PRIORITIES = ["P0", "P1", "P2", "P3", "Monitor"] as const;
export type GapPriority = (typeof GAP_PRIORITIES)[number];

export const SEVERITY_PRIORITY: Readonly<Record<GapSeverity, GapPriority>> = Object.freeze({
  critical: "P0",
  high: "P1",
  medium: "P2",
  low: "P3",
  improvement: "P3",
  no_gap: "Monitor",
});

export function questionPriority(severity: GapSeverity): GapPriority {
  const priority = SEVERITY_PRIORITY[severity];
  if (priority === undefined) throw new ScoringInputError(`unknown gap severity ${String(severity)}`);
  return priority;
}

// ---------------------------------------------------------------------------
// Red flags
// ---------------------------------------------------------------------------

/**
 * A red flag fires when an answer in its area scores **2 or below** (D-046).
 *
 * The workbook used `< 2`, calibrated on its naive `MIN(claimed, evidence)`
 * under which E1 evidence already produced 1. Under the spec's cap E1 and E2
 * both produce 2, so `< 2` would have quietly stopped firing for them. `≤ 2`
 * restores the intent: in a red-flag area, anything short of E3 evidence (or a
 * claim of 2 or less) caps the whole assessment.
 */
export const RED_FLAG_MAX_ADJUSTED = 2;

export interface RedFlag {
  code: string;
  /** When set, only this question fires the flag; otherwise any question in the domain. */
  questionCode?: string;
  domainCode: DomainCode;
  /** The highest final score this flag allows. Several flags → the LOWEST cap wins. */
  cap: number;
  /** Plain language, for the client's report. No question codes, no pack codes (D-040). */
  label: string;
}

/**
 * The seven obligations that cap the whole assessment. Order is the order they
 * are reported in.
 *
 * Note the keystone question is itself a red flag: Slice 4's journey (claim 5
 * with no reviewed evidence → adjusted 1) caps a whole assessment at 60.
 */
export const RED_FLAGS: readonly RedFlag[] = Object.freeze([
  {
    code: "no_evidenced_dpdp_owner",
    questionCode: "G1.2",
    domainCode: "GOV",
    cap: 60,
    label: "No evidenced DPDP owner or nodal officer",
  },
  {
    code: "weak_data_inventory",
    domainCode: "INV",
    cap: 55,
    label: "Personal data discovery and inventory is weak or unevidenced",
  },
  {
    code: "weak_ropa",
    domainCode: "ROPA",
    cap: 60,
    label: "Records of processing activities are weak or unevidenced",
  },
  {
    code: "weak_security_safeguards",
    domainCode: "SECURITY",
    cap: 60,
    label: "Security safeguards are weak or unevidenced",
  },
  {
    code: "weak_breach_readiness",
    domainCode: "BREACH",
    cap: 65,
    label: "Personal data breach readiness is weak or unevidenced",
  },
  {
    code: "weak_processor_governance",
    domainCode: "VENDOR",
    cap: 70,
    label: "Vendor / Data Processor governance is weak or unevidenced",
  },
  {
    code: "unreviewed_childrens_data",
    domainCode: "CHILD",
    cap: 50,
    label: "Children's data and guardian consent handling is weak or unevidenced",
  },
]);

/** The cap when nothing fires: the score is not capped at all. */
export const NO_SCORE_CAP = 100;

export interface FiredRedFlag extends RedFlag {
  /** The answers in this flag's area that scored at or below the threshold. */
  questionCodes: string[];
}

export interface RedFlagOutcome {
  /** The LOWEST cap among the flags that fired, or 100 when none did. */
  cap: number;
  fired: readonly FiredRedFlag[];
}

// ---------------------------------------------------------------------------
// Inputs
// ---------------------------------------------------------------------------

/**
 * One answer, as the database stores it. `claimedMaturity` is null exactly
 * when the decision is Not Applicable; `evidenceLevel` is the strongest
 * REVIEWED artefact, or null when nothing has been reviewed (scored as E0).
 */
export interface EngineResponse {
  questionCode: string;
  applicabilityDecision: ApplicabilityDecision;
  claimedMaturity: number | null;
  evidenceLevel: number | null;
}

/**
 * One domain of an assessment. `weight` and `questionCount` come from the
 * SNAPSHOT (`assessment_questions`), never the live `dpdp_domains` row — a
 * later rebalance must not rewrite an existing assessment's score (D-035).
 *
 * `questionCount` of 0 means the domain was SCOPED OUT: its questions were
 * never generated, because the scope said they do not apply (D-038).
 */
export interface EngineDomainInput {
  code: DomainCode;
  weight: number;
  questionCount: number;
  responses: readonly EngineResponse[];
}

// ---------------------------------------------------------------------------
// Results
// ---------------------------------------------------------------------------

/**
 * The three states a domain can be in, and they must stay distinct in every
 * report (D-038):
 * - `scored` — it has applicable questions and counts towards the score.
 * - `scoped_out` — no question was ever generated for it.
 * - `all_not_applicable` — every generated question was excluded, each with a
 *   written reason.
 *
 * Neither empty state scores zero, and neither renormalises the remaining
 * weights back to 100. Renormalising hides that the scope changed; scoring
 * zero punishes an organisation for a risk surface it does not have.
 */
export const DOMAIN_SCORE_STATES = ["scored", "scoped_out", "all_not_applicable"] as const;
export type DomainScoreState = (typeof DOMAIN_SCORE_STATES)[number];

export const DOMAIN_STATUSES = ["critical", "high_risk", "needs_work", "on_track"] as const;
export type DomainStatus = (typeof DOMAIN_STATUSES)[number];

export const DOMAIN_STATUS_LABEL: Readonly<Record<DomainStatus, string>> = Object.freeze({
  critical: "Critical",
  high_risk: "High Risk",
  needs_work: "Needs Work",
  on_track: "On Track",
});

/**
 * What a domain's status SAYS (Slice 10.5, Q3 — D-104.3): a scored domain with
 * no answered question reads "Not started", not "Needs Work". A display rule
 * only — the stored status stays `needs_work`, and the score, the band and the
 * workbook oracle are untouched. Scoped Out and All Not Applicable keep their
 * own labels (D-038), so this answers only for a `scored` domain.
 */
export const DOMAIN_NOT_STARTED_LABEL = "Not started";

export function domainStatusLabel(domain: {
  state: DomainScoreState;
  status: DomainStatus;
  questionCount: number;
  outstandingCount: number;
}): string {
  if (domain.state === "scored" && domain.questionCount > 0 && domain.outstandingCount === domain.questionCount) {
    return DOMAIN_NOT_STARTED_LABEL;
  }
  return DOMAIN_STATUS_LABEL[domain.status];
}

/**
 * How far through an assessment is (F1.4): questions answered — an answer of
 * Not Applicable counts, it was answered — of every question generated. Counts
 * the engine's own per-domain figures; it scores nothing.
 */
export function answeredProgress(domains: readonly { questionCount: number; outstandingCount: number }[]): {
  answered: number;
  total: number;
} {
  const total = domains.reduce((sum, d) => sum + d.questionCount, 0);
  const outstanding = domains.reduce((sum, d) => sum + d.outstandingCount, 0);
  return { answered: total - outstanding, total };
}

/** Below this, a domain with no critical or high gap still "Needs Work". */
export const ON_TRACK_MIN_PERCENT = 0.61;

export interface ScoredQuestion {
  questionCode: string;
  claimedMaturity: MaturityLevel;
  evidenceLevel: number | null;
  adjusted: MaturityLevel;
  severity: GapSeverity;
}

export interface DomainResult {
  code: DomainCode;
  /** `D01`…`D16` — the workbook's identifier, kept for oracle parity (D-007). */
  domainId: string;
  name: string;
  weight: number;
  state: DomainScoreState;
  questionCount: number;
  applicableCount: number;
  notApplicableCount: number;
  /** Unanswered. While this is above zero the score is PROVISIONAL. */
  outstandingCount: number;
  provisional: boolean;
  /** Mean adjusted score over applicable answers, or null when there are none. */
  avgAdjusted: number | null;
  /** Out of `weight`, or null when the domain is not scored. */
  score: number | null;
  /** `score / weight`, or null. */
  percent: number | null;
  maturityLevel: string | null;
  /** 0–100, or null. */
  evidenceConfidence: number | null;
  criticalCount: number;
  highCount: number;
  status: DomainStatus;
  /** Every applicable answer, for the red-flag pass and (Slice 6) gap creation. */
  questions: readonly ScoredQuestion[];
}

export interface AssessmentScore {
  domains: readonly DomainResult[];
  /** Σ of the scored domains' scores, before any red-flag cap. */
  rawScore: number;
  /** The lowest red-flag cap that fired, or 100. */
  scoreCap: number;
  /** `min(rawScore, scoreCap)` — the reported DPDP Compass Readiness Score. */
  finalScore: number;
  /** The D-038 denominator: Σ weight of the SCORED domains. Often 100. */
  applicableWeight: number;
  /** `applicableWeight / 100` — the "Assessed Weight Coverage" line. */
  coverage: number;
  maturityLevel: string;
  /** Mean of the scored domains' confidences, 0–100, or null when nothing is scored. */
  evidenceConfidence: number | null;
  criticalCount: number;
  highCount: number;
  redFlags: readonly FiredRedFlag[];
  /** True while any question anywhere is unanswered — a provisional total. */
  provisional: boolean;
  outstandingCount: number;
  engineVersion: string;
}

// ---------------------------------------------------------------------------
// The engine
// ---------------------------------------------------------------------------

export interface EngineOptions {
  /**
   * Defaults to `SPEC_CAP_RULE`, which is the only rule the product or the
   * database ever uses. The parity gate passes the workbook's naive rule here
   * to isolate the aggregation from the cap (D-048).
   */
  capRule?: CapRule;
}

/** One domain, from its snapshotted questions and whatever responses exist. */
export function scoreDomain(input: EngineDomainInput, options: EngineOptions = {}): DomainResult {
  const capRule = options.capRule ?? SPEC_CAP_RULE;
  const domain = domainByCode(input.code);
  if (!domain) throw new ScoringInputError(`unknown domain code ${input.code}`);
  if (!(input.weight > 0)) throw new ScoringInputError(`domain weight must be positive (got ${input.weight})`);
  if (input.responses.length > input.questionCount) {
    throw new ScoringInputError(
      `${input.code}: ${input.responses.length} responses for ${input.questionCount} questions`,
    );
  }

  const applicable = input.responses.filter((r) => r.applicabilityDecision === "applicable");
  const notApplicableCount = input.responses.length - applicable.length;
  const outstandingCount = input.questionCount - input.responses.length;

  const questions: ScoredQuestion[] = applicable.map((r) => {
    if (r.claimedMaturity === null) {
      throw new ScoringInputError(`${r.questionCode}: an applicable answer needs a claimed maturity`);
    }
    const adjusted = capRule(r.claimedMaturity, r.evidenceLevel);
    return {
      questionCode: r.questionCode,
      claimedMaturity: r.claimedMaturity as MaturityLevel,
      evidenceLevel: r.evidenceLevel,
      adjusted,
      severity: questionSeverity(adjusted),
    };
  });

  const state: DomainScoreState =
    input.questionCount === 0
      ? "scoped_out"
      : applicable.length === 0 && outstandingCount === 0
        ? "all_not_applicable"
        : "scored";

  const avgAdjusted =
    questions.length === 0 ? null : questions.reduce((sum, q) => sum + q.adjusted, 0) / questions.length;
  const score = avgAdjusted === null ? null : (avgAdjusted / 5) * input.weight;
  // De-noised once, here: the band AND the On Track threshold both compare it.
  const percent = score === null ? null : exactProportion(score / input.weight);

  // The same helper Slice 4 uses, so the tile and the scorecard cannot drift.
  const confidence = evidenceConfidence(
    applicable.map((r) => ({
      applicabilityDecision: "applicable" as const,
      claimedMaturity: r.claimedMaturity!,
      evidenceLevel: r.evidenceLevel,
    })),
  );

  const criticalCount = questions.filter((q) => q.severity === "critical").length;
  const highCount = questions.filter((q) => q.severity === "high").length;
  const status: DomainStatus =
    criticalCount > 0
      ? "critical"
      : highCount > 0
        ? "high_risk"
        : percent !== null && percent < ON_TRACK_MIN_PERCENT
          ? "needs_work"
          : percent === null
            ? "needs_work"
            : "on_track";

  return {
    code: input.code,
    domainId: domain.domainId,
    name: domain.name,
    weight: input.weight,
    state,
    questionCount: input.questionCount,
    applicableCount: applicable.length,
    notApplicableCount,
    outstandingCount,
    provisional: outstandingCount > 0,
    avgAdjusted,
    score,
    percent,
    maturityLevel: percent === null ? null : maturityBand(percent).label,
    evidenceConfidence: confidence,
    criticalCount,
    highCount,
    status,
    questions,
  };
}

/**
 * Which red flags fired, and the cap that results. Several flags → the LOWEST
 * cap wins; none → 100, meaning no cap at all.
 */
export function applyRedFlags(domains: readonly DomainResult[]): RedFlagOutcome {
  const byCode = new Map(domains.map((d) => [d.code, d]));
  const fired: FiredRedFlag[] = [];

  for (const flag of RED_FLAGS) {
    const domain = byCode.get(flag.domainCode);
    if (!domain) continue;
    const questionCodes = domain.questions
      .filter(
        (q) =>
          q.adjusted <= RED_FLAG_MAX_ADJUSTED &&
          (flag.questionCode === undefined || q.questionCode === flag.questionCode),
      )
      .map((q) => q.questionCode);
    if (questionCodes.length > 0) fired.push({ ...flag, questionCodes });
  }

  return { cap: Math.min(NO_SCORE_CAP, ...fired.map((f) => f.cap)), fired };
}

/**
 * The mean of the SCORED domains' confidences — per domain, unweighted, NOT
 * per question (§4.4.3). A domain with no applicable answer has no confidence
 * to contribute, so it leaves this average exactly as it leaves the weight
 * denominator; counting it as 0 would drag the figure down for a risk surface
 * the organisation does not have.
 */
export function overallEvidenceConfidence(domains: readonly DomainResult[]): number | null {
  const values = domains.map((d) => d.evidenceConfidence).filter((c): c is number => c !== null);
  if (values.length === 0) return null;
  return values.reduce((sum, c) => sum + c, 0) / values.length;
}

/**
 * The whole assessment: sixteen domain scores, the red-flag cap, the overall
 * score over the APPLICABLE weight (D-038), the band, confidence and counts.
 *
 * `domains` should carry every domain in the snapshot, including the empty
 * ones — a caller that silently drops a scoped-out domain loses the coverage
 * line, which is the part that keeps the denominator honest.
 */
export function scoreAssessment(
  domains: readonly EngineDomainInput[],
  options: EngineOptions = {},
): AssessmentScore {
  const seen = new Set<DomainCode>();
  for (const d of domains) {
    if (seen.has(d.code)) throw new ScoringInputError(`domain ${d.code} appears twice`);
    seen.add(d.code);
  }

  const results = domains
    .map((d) => scoreDomain(d, options))
    .sort((a, b) => DOMAIN_CODES.indexOf(a.code) - DOMAIN_CODES.indexOf(b.code));

  const scored = results.filter((d) => d.state === "scored");
  const rawScore = scored.reduce((sum, d) => sum + (d.score ?? 0), 0);
  const applicableWeight = scored.reduce((sum, d) => sum + d.weight, 0);
  const { cap, fired } = applyRedFlags(results);
  const finalScore = Math.min(rawScore, cap);

  // Out of the APPLICABLE weight, not a flat 100: judging an organisation
  // against points that do not apply to it is the same error as scoring an
  // empty domain zero (D-038). On the workbook sample all 16 domains are
  // scored, so this is 100 and parity is unaffected.
  const percent = applicableWeight === 0 ? 0 : exactProportion(finalScore / applicableWeight);
  const outstandingCount = results.reduce((sum, d) => sum + d.outstandingCount, 0);

  return {
    domains: results,
    rawScore,
    scoreCap: cap,
    finalScore,
    applicableWeight,
    coverage: applicableWeight / 100,
    maturityLevel: maturityBand(percent).label,
    evidenceConfidence: overallEvidenceConfidence(results),
    criticalCount: results.reduce((sum, d) => sum + d.criticalCount, 0),
    highCount: results.reduce((sum, d) => sum + d.highCount, 0),
    redFlags: fired,
    provisional: outstandingCount > 0,
    outstandingCount,
    engineVersion: ENGINE_VERSION,
  };
}
