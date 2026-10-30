import { DOMAIN_CODES, domainStatusLabel, pickAllowed } from "@truststack/core";
import { z } from "zod";
import { createCleaner, userTurn, type OrganisationRaw, type ShapedContext } from "./shared";

/**
 * The Score Helper (SLICE_11 §2.2, Stage 1b) — "Why is this domain's score
 * what it is?" on the scorecard and the domain tile. Read with `score.read`
 * (§4.7) through THE score reader (`readAssessmentScore`, D-069) and, with
 * `response.read`, the domain's stored answers; shaped here, pure.
 *
 * Pitfall 1 — the model is not the authority: every number it gets was read
 * from the stored score. It may say THAT reviewed evidence held answers down,
 * and by how much (in answer points, from the stored adjusted scores); it never
 * gets the cap TABLE, a weight, a red-flag rule or the bank's codes (§4.5), and
 * its answer may never say the score has been changed (§4.11).
 *
 * What it sends: the domain's NAME, state and status, the share of its points
 * scored (a percentage — never the weight), the maturity band, the evidence
 * confidence, how many questions there are, are answered, Not Applicable or
 * outstanding, the critical and high gaps, whether it is provisional or
 * finalised; and from the answers: how many applicable answers, how many the
 * evidence held down, the points held down, and the average level claimed and
 * counted. The organisation; the person's own question.
 */

export const scoreHelperBody = z
  .object({
    assessmentId: z.uuid(),
    domainCode: z.enum(DOMAIN_CODES),
    ask: z.string().trim().max(500).optional(),
  })
  .strict();
export type ScoreHelperBody = z.infer<typeof scoreHelperBody>;

/** What the readers return — wider than what is sent, on purpose. */
export interface ScoreHelperRaw {
  organisation: OrganisationRaw;
  /** One domain, as `readAssessmentScore` returns it. */
  domain: Record<string, unknown> & { name: string };
  finalised: boolean;
  /** The domain's stored answers — null when the person cannot read answers (`response.read`). */
  answers: (Record<string, unknown> & { applicabilityDecision: string })[] | null;
  ask: string | null;
}

const ORGANISATION_FIELDS = ["name", "organizationType", "industryName"] as const;
const DOMAIN_FIELDS = [
  "name",
  "state",
  "status",
  "questionCount",
  "applicableCount",
  "notApplicableCount",
  "outstandingCount",
  "provisional",
  "score",
  "percent",
  "maturityLevel",
  "evidenceConfidence",
  "criticalCount",
  "highCount",
] as const;
const ANSWER_FIELDS = ["applicabilityDecision", "claimedMaturity", "adjustedScore"] as const;

const STATE_WORDS: Record<string, string> = {
  scored: "scored",
  scoped_out: "scoped out — no question in this area applies to the organisation",
  all_not_applicable: "every question was marked Not Applicable, with a reason",
};

const round1 = (n: number) => Math.round(n * 10) / 10;

export function shapeScoreHelperContext(
  raw: ScoreHelperRaw,
  target: { assessmentId: string; domainCode: string },
  untrustedJson: (value: unknown) => string,
): ShapedContext {
  const cleaner = createCleaner();
  const clean = cleaner.clean;
  const org = pickAllowed(raw.organisation, ORGANISATION_FIELDS);
  const d = pickAllowed(raw.domain, DOMAIN_FIELDS);
  const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);

  const organisation = { name: clean(org.name, false), type: org.organizationType, industry: org.industryName ?? null };
  const percent = num(d.percent);
  const confidence = num(d.evidenceConfidence);
  const domain = {
    area: clean(d.name, false),
    state: STATE_WORDS[String(d.state)] ?? String(d.state ?? ""),
    // The scorecard's own words ("Not started" for an untouched area, Q3).
    status:
      d.state === "scored"
        ? domainStatusLabel({
            state: "scored",
            status: d.status as Parameters<typeof domainStatusLabel>[0]["status"],
            questionCount: Number(d.questionCount ?? 0),
            outstandingCount: Number(d.outstandingCount ?? 0),
          })
        : null,
    // A share of the area's points — never the weight itself (§4.5).
    pointsScoredPercent: percent === null ? null : Math.round(percent * 100),
    maturityBand: typeof d.maturityLevel === "string" ? d.maturityLevel : null,
    evidenceConfidencePercent: confidence === null ? null : Math.round(confidence),
    questions: Number(d.questionCount ?? 0),
    answeredApplicable: Number(d.applicableCount ?? 0),
    notApplicable: Number(d.notApplicableCount ?? 0),
    unanswered: Number(d.outstandingCount ?? 0),
    criticalGaps: Number(d.criticalCount ?? 0),
    highGaps: Number(d.highCount ?? 0),
    provisional: d.provisional === true,
    finalised: raw.finalised,
  };

  let evidenceEffect: Record<string, unknown> = { known: false, why: "The person cannot read the answers, so only the domain's totals are shown." };
  if (raw.answers !== null) {
    const applicable = raw.answers
      .map((a) => pickAllowed(a, ANSWER_FIELDS))
      .filter((a) => a.applicabilityDecision === "applicable" && typeof a.claimedMaturity === "number" && typeof a.adjustedScore === "number")
      .map((a) => ({ claimed: a.claimedMaturity as number, counted: a.adjustedScore as number }));
    const held = applicable.filter((a) => a.counted < a.claimed);
    const avg = (xs: number[]) => (xs.length === 0 ? null : round1(xs.reduce((s, x) => s + x, 0) / xs.length));
    evidenceEffect = {
      known: true,
      applicableAnswers: applicable.length,
      answersHeldDownByEvidence: held.length,
      // In answer points (each answer 0–5), from the stored adjusted scores — never recomputed (pitfall 1).
      answerPointsHeldDown: held.reduce((s, a) => s + (a.claimed - a.counted), 0),
      averageClaimed: avg(applicable.map((a) => a.claimed)),
      averageCounted: avg(applicable.map((a) => a.counted)),
    };
  }
  const ask = clean(raw.ask, true);

  const context = { task: "score_helper", organisation, domain, evidenceEffect, ask };
  const user = userTurn(
    'Explain why this area\'s readiness score is what it is, using ONLY the numbers given — they were read from the stored score, and you must not recalculate, predict or change them. In TrustStack each answer counts only as far as its reviewed evidence supports it: if evidence held answers down, say so and by how much (answer points), and what would lift it (reviewed evidence, answering what is unanswered). Unanswered questions are neither scored nor excluded. Say a TrustStack band or score is TrustStack\'s method, not the law. One next step (nextStep.page: "answer_question" if questions are unanswered, "add_evidence" if evidence held answers down, "view_gaps" if there are critical or high gaps, otherwise "none").',
    [
      { tag: "organisation", value: organisation },
      { tag: "domain_score", value: domain },
      { tag: "evidence_effect", value: evidenceEffect },
    ],
    ask,
    untrustedJson,
  );
  return {
    context,
    user,
    injectionFlagged: cleaner.injectionFlagged,
    scrubbed: cleaner.scrubbed,
    target: { type: "assessment_domain", id: target.assessmentId, key: target.domainCode },
  };
}
