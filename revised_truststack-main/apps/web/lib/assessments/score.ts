import "server-only";
import {
  DOMAIN_CODES,
  DPDP_DOMAINS,
  domainByCode,
  scoreAssessment,
  type AssessmentScore,
  type DomainCode,
  type DomainResult,
  type EngineDomainInput,
  type EngineResponse,
} from "@truststack/core";
import { z } from "zod";
import { ApiError, rpcError, type TenantContext } from "@/lib/api/guard";
import { ok } from "@/lib/api/envelope";
import type { AppSupabaseClient } from "@/lib/supabase/server";
import { requireAssessment, type AssessmentRow } from "./routes";

/**
 * Scoring and finalising (Slice 5).
 *
 * A LIVE score is recomputed on every read from the stored adjusted scores —
 * each of which the database derived and CHECK-capped (D-044), so nothing
 * here can inflate one. A FINALISED score is not recomputed at all: it is
 * read from the snapshot `public.finalise_assessment` wrote, because a
 * finalised score is evidence of what was assessed and when, and must never
 * move (D-035).
 *
 * Every weight comes from the SNAPSHOT (`assessment_questions.domain_weight`),
 * never the live `dpdp_domains` row — a later rebalance must not rewrite an
 * existing assessment's score.
 */

/**
 * No default. An absent `domain` means "everything": Slice 4 defaulted it to
 * `GOV`, which would now silently answer the wrong question.
 */
const scoreQuery = z.object({ domain: z.enum(DOMAIN_CODES).optional() }).strict();

const FINALISED = "finalised";

interface QuestionRow {
  question_code: string;
  domain_code: string;
  domain_weight: string | number;
}

interface ResponseRow {
  question_code: string;
  applicability_decision: string;
  claimed_maturity: number | null;
  evidence_level: number | null;
}

/**
 * The live score, over every domain in the model.
 *
 * A domain with no snapshotted question is SCOPED OUT and carries its live
 * weight for display only; it contributes nothing to the score and nothing to
 * the denominator (D-038).
 */
async function liveScore(
  supabase: AppSupabaseClient,
  organizationId: string,
  assessmentId: string,
): Promise<AssessmentScore> {
  const { data: questions, error: qError } = await supabase
    .from("assessment_questions")
    .select("question_code, domain_code, domain_weight")
    .eq("assessment_id", assessmentId)
    .eq("organization_id", organizationId);
  if (qError) throw qError;

  const { data: answers, error: rError } = await supabase
    .from("assessment_responses")
    .select("question_code, applicability_decision, claimed_maturity, evidence_level")
    .eq("assessment_id", assessmentId)
    .eq("organization_id", organizationId);
  if (rError) throw rError;

  const answerByCode = new Map(
    ((answers ?? []) as ResponseRow[]).map((r) => [
      r.question_code,
      {
        questionCode: r.question_code,
        applicabilityDecision: r.applicability_decision as EngineResponse["applicabilityDecision"],
        claimedMaturity: r.claimed_maturity,
        evidenceLevel: r.evidence_level,
      } satisfies EngineResponse,
    ]),
  );

  const byDomain = new Map<DomainCode, { weight: number; questionCount: number; responses: EngineResponse[] }>();
  for (const q of (questions ?? []) as QuestionRow[]) {
    const code = q.domain_code as DomainCode;
    const entry = byDomain.get(code) ?? { weight: Number(q.domain_weight), questionCount: 0, responses: [] };
    entry.questionCount += 1;
    const answer = answerByCode.get(q.question_code);
    if (answer) entry.responses.push(answer);
    byDomain.set(code, entry);
  }

  const domains: EngineDomainInput[] = DPDP_DOMAINS.map((d) => {
    const entry = byDomain.get(d.code);
    return entry === undefined
      ? { code: d.code, weight: d.weight, questionCount: 0, responses: [] }
      : { code: d.code, weight: entry.weight, questionCount: entry.questionCount, responses: entry.responses };
  });

  return scoreAssessment(domains);
}

// ---------------------------------------------------------------------------
// Snapshot → the same shape a live score has
// ---------------------------------------------------------------------------

const SNAPSHOT_COLUMNS =
  "id, calculated_at, calculated_by, raw_score, score_cap, final_score, applicable_weight, evidence_confidence, maturity_level, critical_count, high_count, red_flags, engine_version" as const;
const DOMAIN_SCORE_COLUMNS =
  "domain_code, weight, state, applicable_count, not_applicable_count, avg_adjusted, score, evidence_confidence, maturity_level, critical_count, high_count, status, sort_order" as const;

interface SnapshotRow {
  id: string;
  calculated_at: string;
  calculated_by: string | null;
  raw_score: string | number;
  score_cap: string | number;
  final_score: string | number;
  applicable_weight: string | number;
  evidence_confidence: string | number;
  maturity_level: string;
  critical_count: number;
  high_count: number;
  red_flags: unknown;
  engine_version: string;
}

interface DomainScoreRow {
  domain_code: string;
  weight: string | number;
  state: string;
  applicable_count: number;
  not_applicable_count: number;
  avg_adjusted: string | number | null;
  score: string | number | null;
  evidence_confidence: string | number | null;
  maturity_level: string | null;
  critical_count: number;
  high_count: number;
  status: string;
  sort_order: number;
}

const n = (v: string | number) => Number(v);
const nullableN = (v: string | number | null) => (v === null ? null : Number(v));

/** The API shape, whether the numbers were just computed or read from a snapshot. */
function domainToApi(d: DomainResult) {
  return {
    code: d.code,
    domainId: d.domainId,
    name: d.name,
    weight: d.weight,
    state: d.state,
    questionCount: d.questionCount,
    applicableCount: d.applicableCount,
    notApplicableCount: d.notApplicableCount,
    outstandingCount: d.outstandingCount,
    provisional: d.provisional,
    avgAdjusted: d.avgAdjusted,
    score: d.score,
    percent: d.percent,
    maturityLevel: d.maturityLevel,
    evidenceConfidence: d.evidenceConfidence,
    criticalCount: d.criticalCount,
    highCount: d.highCount,
    status: d.status,
    // Slice 4's tile still reads this; a scoped-out domain has no score.
    scopedOut: d.state === "scoped_out",
  };
}

function snapshotDomainToApi(row: DomainScoreRow) {
  const domain = domainByCode(row.domain_code)!;
  const weight = n(row.weight);
  const score = nullableN(row.score);
  return {
    code: domain.code,
    domainId: domain.domainId,
    name: domain.name,
    weight,
    state: row.state,
    // A finalised assessment has nothing outstanding, by definition (D-041).
    questionCount: row.applicable_count + row.not_applicable_count,
    applicableCount: row.applicable_count,
    notApplicableCount: row.not_applicable_count,
    outstandingCount: 0,
    provisional: false,
    avgAdjusted: nullableN(row.avg_adjusted),
    score,
    percent: score === null ? null : score / weight,
    maturityLevel: row.maturity_level,
    evidenceConfidence: nullableN(row.evidence_confidence),
    criticalCount: row.critical_count,
    highCount: row.high_count,
    status: row.status,
    scopedOut: row.state === "scoped_out",
  };
}

function liveToApi(assessment: AssessmentRow, score: AssessmentScore) {
  return {
    assessmentId: assessment.id,
    status: assessment.status,
    /** Live: recomputed from the stored adjusted scores on this read. */
    finalised: false,
    snapshot: null,
    overall: {
      rawScore: score.rawScore,
      scoreCap: score.scoreCap,
      finalScore: score.finalScore,
      applicableWeight: score.applicableWeight,
      coverage: score.coverage,
      maturityLevel: score.maturityLevel,
      evidenceConfidence: score.evidenceConfidence,
      criticalCount: score.criticalCount,
      highCount: score.highCount,
      redFlags: score.redFlags,
      provisional: score.provisional,
      outstandingCount: score.outstandingCount,
      engineVersion: score.engineVersion,
    },
    domains: score.domains.map(domainToApi),
  };
}

function snapshotToApi(assessment: AssessmentRow, snapshot: SnapshotRow, domains: DomainScoreRow[]) {
  const applicableWeight = n(snapshot.applicable_weight);
  return {
    assessmentId: assessment.id,
    status: assessment.status,
    /** Frozen: these numbers are read, never recomputed. */
    finalised: true,
    snapshot: {
      id: snapshot.id,
      calculatedAt: snapshot.calculated_at,
      calculatedBy: snapshot.calculated_by,
    },
    overall: {
      rawScore: n(snapshot.raw_score),
      scoreCap: n(snapshot.score_cap),
      finalScore: n(snapshot.final_score),
      applicableWeight,
      coverage: applicableWeight / 100,
      maturityLevel: snapshot.maturity_level,
      evidenceConfidence: n(snapshot.evidence_confidence),
      criticalCount: snapshot.critical_count,
      highCount: snapshot.high_count,
      redFlags: Array.isArray(snapshot.red_flags) ? snapshot.red_flags : [],
      provisional: false,
      outstandingCount: 0,
      engineVersion: snapshot.engine_version,
    },
    domains: [...domains].sort((a, b) => a.sort_order - b.sort_order).map(snapshotDomainToApi),
  };
}

/** The stored snapshot, or null when the assessment has not been finalised. */
async function readSnapshot(
  supabase: AppSupabaseClient,
  organizationId: string,
  assessmentId: string,
): Promise<{ snapshot: SnapshotRow; domains: DomainScoreRow[] } | null> {
  const { data, error } = await supabase
    .from("assessment_score_snapshots")
    .select(SNAPSHOT_COLUMNS)
    .eq("assessment_id", assessmentId)
    .eq("organization_id", organizationId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const snapshot = data as unknown as SnapshotRow;
  const { data: domains, error: dError } = await supabase
    .from("assessment_domain_scores")
    .select(DOMAIN_SCORE_COLUMNS)
    .eq("snapshot_id", snapshot.id)
    .eq("organization_id", organizationId)
    .order("sort_order");
  if (dError) throw dError;
  return { snapshot, domains: (domains ?? []) as unknown as DomainScoreRow[] };
}

/**
 * THE score reader: a finalised assessment's SNAPSHOT, never a recomputation,
 * or the live score of one still in progress. The score route and the
 * dashboard (Slice 8) both read through here, so they can never disagree.
 */
export async function readAssessmentScore(
  supabase: AppSupabaseClient,
  organizationId: string,
  assessment: AssessmentRow,
) {
  const stored = assessment.status === FINALISED ? await readSnapshot(supabase, organizationId, assessment.id) : null;
  return stored
    ? snapshotToApi(assessment, stored.snapshot, stored.domains)
    : liveToApi(assessment, await liveScore(supabase, organizationId, assessment.id));
}

export type AssessmentScoreApi = Awaited<ReturnType<typeof readAssessmentScore>>;

export const score = {
  read: {
    options: { auth: "required", tenant: "fromParam", permission: "score.read", query: scoreQuery } as const,
    handler: async (ctx: TenantContext<undefined, z.infer<typeof scoreQuery>>) => {
      const { supabase, organizationId, query, request } = ctx;
      const assessment = await requireAssessment(ctx as TenantContext<unknown, unknown>, ctx.params.assessmentId ?? "");

      // A finalised assessment returns its SNAPSHOT, not a recomputation —
      // even if something later changed underneath it, which Slice 4's locks
      // already prevent.
      const payload = await readAssessmentScore(supabase, organizationId, assessment);

      // `?domain=` still works — the Slice 4 tile and its tests use it.
      if (query.domain) {
        const domain = payload.domains.find((d) => d.code === query.domain);
        if (!domain) throw new ApiError(404, "NOT_FOUND", "Domain not found.");
        return ok({ assessmentId: assessment.id, domain }, request);
      }
      return ok(payload, request);
    },
  },

  finalise: {
    options: { auth: "required", tenant: "fromParam", permission: "assessment.finalise" } as const,
    handler: async (ctx: TenantContext<undefined, undefined>) => {
      const { supabase, organizationId, request } = ctx;
      const assessment = await requireAssessment(ctx as TenantContext<unknown, unknown>, ctx.params.assessmentId ?? "");

      // Every number is computed inside the RPC, in SQL. The caller passes two
      // ids and nothing else: an RPC that stored numbers the caller computed
      // would store numbers the caller can forge.
      const { error } = await supabase.rpc("finalise_assessment", {
        p_organization_id: organizationId,
        p_assessment_id: assessment.id,
      });
      if (error) {
        const mapped = rpcError(error);
        if (mapped) {
          // The RPC puts the outstanding count in DETAIL, so the UI can say
          // how many are left rather than just "not yet".
          const outstanding = Number(error.details ?? "");
          if (mapped.status === 409 && Number.isInteger(outstanding) && outstanding > 0) {
            throw new ApiError(409, "CONFLICT", mapped.message, [
              { field: "outstandingCount", issue: String(outstanding) },
            ]);
          }
          throw mapped;
        }
        throw error;
      }

      const refreshed = await requireAssessment(ctx as TenantContext<unknown, unknown>, assessment.id);
      const stored = await readSnapshot(supabase, organizationId, assessment.id);
      if (!stored) throw new ApiError(500, "INTERNAL_ERROR", "The score was not stored. Try again.");
      return ok(snapshotToApi(refreshed, stored.snapshot, stored.domains), request, { status: 201 });
    },
  },
};
