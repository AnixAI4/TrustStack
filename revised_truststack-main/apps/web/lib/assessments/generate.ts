import "server-only";
import {
  generateAssessmentQuestions, scopeFactsFrom, selectQuestionPacks, summariseByDomain,
  type GeneratedQuestion, type GenerationResult,
} from "@truststack/core";
import { ApiError } from "@/lib/api/guard";
import { loadScopeState, preview } from "@/lib/scope/risk";
import type { AppSupabaseClient } from "@/lib/supabase/server";
import { loadBankForPacks } from "./bank";

/**
 * Generating a question set, end to end: read the scope → derive facts →
 * select packs → load those packs → generate → write the snapshot through the
 * RPC.
 *
 * A STALE scope is refused. Generating from answers that no longer match the
 * registers would snapshot a scope nobody ever saved, and `scope_derived_at`
 * on the assessment would point at the wrong moment.
 */

export interface GenerationOutcome extends GenerationResult {
  industryCode: string | null;
  riskTags: string[];
  scopeDerivedAt: string | null;
  writtenCount: number;
}

export async function generateForOrganization(
  supabase: AppSupabaseClient,
  organizationId: string,
  assessmentId: string,
): Promise<GenerationOutcome> {
  const state = await loadScopeState(supabase, organizationId);
  const scopePreview = preview(state);
  if (scopePreview.stale) {
    throw new ApiError(
      409,
      "CONFLICT",
      state.stored === null
        ? "Save the scope before generating an assessment."
        : "The scope has changed since it was last saved — save it, then generate.",
    );
  }

  const facts = scopeFactsFrom(state.industryCode, state.input);
  const packCodes = selectQuestionPacks({
    industryCode: state.industryCode,
    riskTags: facts.riskTags,
    aiUsageTypes: facts.aiUsageTypes,
  });
  // Through the one database function that checks assessment.write and
  // returns only approved, generatable packs (D-071) — never the raw bank.
  const bank = await loadBankForPacks(supabase, organizationId, packCodes);
  const result = generateAssessmentQuestions(bank, packCodes, facts);

  if (result.questions.length === 0) {
    throw new ApiError(
      409,
      "CONFLICT",
      "No approved question pack applies to this scope yet. Check the organisation's industry.",
    );
  }

  // The RPC is the only write path into the snapshot: it re-checks
  // assessment.write and refuses anything but a draft (D-023).
  const { data, error } = await supabase.rpc("set_assessment_questions", {
    p_organization_id: organizationId,
    p_assessment_id: assessmentId,
    p_rows: result.questions.map(toRpcRow),
  });
  if (error) throw error;

  const { error: updateError } = await supabase
    .from("assessments")
    .update({
      industry_code: facts.industryCode,
      risk_tags: [...facts.riskTags],
      pack_codes: result.packCodes,
      scope_derived_at: state.stored?.derivedAt ?? null,
    })
    .eq("id", assessmentId)
    .eq("organization_id", organizationId);
  if (updateError) throw updateError;

  return {
    ...result,
    industryCode: facts.industryCode,
    riskTags: [...facts.riskTags],
    scopeDerivedAt: state.stored?.derivedAt ?? null,
    writtenCount: typeof data === "number" ? data : result.questions.length,
  };
}

/** snake_case keys: the RPC unpacks them with jsonb_to_recordset. */
function toRpcRow(q: GeneratedQuestion) {
  return {
    question_code: q.questionCode,
    question_version: q.questionVersion,
    question_text: q.questionText,
    domain_code: q.domainCode,
    domain_weight: q.domainWeight,
    applicability: q.applicability,
    priority: q.priority,
    evidence_guidance: q.evidenceGuidance,
    suggested_owner: q.suggestedOwner,
    pack_code: q.packCode,
    sort_order: q.sortOrder,
    included_reason: q.includedReason,
  };
}

/**
 * The API shape for a generation, with the per-domain summary the UI groups by.
 * Pack codes, skipped packs and trigger exclusions are Anix's working detail
 * (D-068, D-071): a client gets the count and the domains, nothing else.
 */
export function generationPayload(outcome: GenerationOutcome, fullBank: boolean) {
  return {
    questionCount: outcome.writtenCount,
    industryCode: outcome.industryCode,
    riskTags: outcome.riskTags,
    domains: summariseByDomain(outcome.questions),
    ...(fullBank
      ? {
          packCodes: outcome.packCodes,
          skippedPacks: outcome.skippedPacks,
          excludedByTrigger: outcome.excludedByTrigger,
          triggerCoverage: outcome.coverage,
        }
      : {}),
  };
}
