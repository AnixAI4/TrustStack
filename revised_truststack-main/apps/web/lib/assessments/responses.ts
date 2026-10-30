import "server-only";
import { z } from "zod";
import { ApiError, type TenantContext } from "@/lib/api/guard";
import { ok } from "@/lib/api/envelope";
import {
  EVIDENCE_COLUMNS,
  mapWriteError,
  RESPONSE_COLUMNS,
  responseToApi,
  type EvidenceRow,
  type ResponseRow,
} from "@/lib/evidence/shape";
import type { AppSupabaseClient } from "@/lib/supabase/server";
import { requireAssessment } from "./routes";

/**
 * Answering and scoring (Slice 4), nested under
 * `/organizations/{id}/assessments/{assessmentId}/…` like every assessment
 * route (D-035): both ids filter every query, so a foreign id is a 404.
 *
 * A response references the SNAPSHOT (`assessment_questions`), never the live
 * bank. The adjusted score is never computed here — the database derives it
 * and a CHECK caps it (D-044); this module only reports what it stored.
 *
 * Scoring itself moved to `./score.ts` in Slice 5, when it grew from one
 * domain to sixteen plus an overall.
 */

const LOCKED_STATUSES = new Set(["submitted", "finalised"]);

const questionCodeParam = z.string().min(1).max(64).regex(/^[A-Za-z0-9._-]+$/);

const putBody = z.discriminatedUnion("applicabilityDecision", [
  z
    .object({
      applicabilityDecision: z.literal("applicable"),
      claimedMaturity: z.number().int().min(0).max(5),
      notes: z.string().trim().max(4000).optional(),
    })
    .strict(),
  z
    .object({
      applicabilityDecision: z.literal("not_applicable"),
      // Required AND non-blank: N/A leaves the denominator, so it must say why (D-029.3).
      naReason: z.string().trim().min(1, "A reason is required to mark a question Not Applicable.").max(2000),
      notes: z.string().trim().max(4000).optional(),
    })
    .strict(),
]);

/** Linked evidence for a set of responses, grouped by response id. Two queries: links are polymorphic (D-008). */
async function evidenceByResponse(
  supabase: AppSupabaseClient,
  organizationId: string,
  responseIds: string[],
): Promise<Map<string, EvidenceRow[]>> {
  const out = new Map<string, EvidenceRow[]>();
  if (responseIds.length === 0) return out;
  const { data, error } = await supabase
    .from("evidence_links")
    .select(`linked_entity_id, evidence(${EVIDENCE_COLUMNS})`)
    .eq("organization_id", organizationId)
    .eq("linked_entity_type", "assessment_response")
    .in("linked_entity_id", responseIds)
    .order("linked_at");
  if (error) throw error;
  for (const link of data ?? []) {
    const evidence = link.evidence as unknown as EvidenceRow | null;
    if (!evidence) continue;
    const list = out.get(link.linked_entity_id) ?? [];
    list.push(evidence);
    out.set(link.linked_entity_id, list);
  }
  return out;
}

export async function readResponse(supabase: AppSupabaseClient, organizationId: string, responseId: string) {
  const { data, error } = await supabase
    .from("assessment_responses")
    .select(RESPONSE_COLUMNS)
    .eq("id", responseId)
    .eq("organization_id", organizationId)
    .single();
  if (error) mapWriteError(error, "Response not found.");
  const evidence = await evidenceByResponse(supabase, organizationId, [responseId]);
  return responseToApi(data as ResponseRow, evidence.get(responseId));
}

/**
 * The answer to one question, by its code, with its evidence — or null when it
 * has not been answered. The AI Question Helper's reader (Slice 11, D-069).
 */
export async function readResponseForQuestion(
  supabase: AppSupabaseClient,
  organizationId: string,
  assessmentId: string,
  questionCode: string,
) {
  const { data, error } = await supabase
    .from("assessment_responses")
    .select(RESPONSE_COLUMNS)
    .eq("assessment_id", assessmentId)
    .eq("organization_id", organizationId)
    .eq("question_code", questionCode)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const row = data as ResponseRow;
  const evidence = await evidenceByResponse(supabase, organizationId, [row.id]);
  return responseToApi(row, evidence.get(row.id));
}

/**
 * The stored answers to one domain's questions, without their evidence — the AI
 * Score Helper's reader (Slice 11 Stage 1b, D-069). The domain is the
 * SNAPSHOT's (`assessment_questions`), so a later rebalance cannot move it.
 */
export async function readResponsesForDomain(
  supabase: AppSupabaseClient,
  organizationId: string,
  assessmentId: string,
  domainCode: string,
) {
  const { data: questions, error: qError } = await supabase
    .from("assessment_questions")
    .select("question_code")
    .eq("assessment_id", assessmentId)
    .eq("organization_id", organizationId)
    .eq("domain_code", domainCode);
  if (qError) throw qError;
  const codes = (questions ?? []).map((q) => q.question_code);
  if (codes.length === 0) return [];
  const { data, error } = await supabase
    .from("assessment_responses")
    .select(RESPONSE_COLUMNS)
    .eq("assessment_id", assessmentId)
    .eq("organization_id", organizationId)
    .in("question_code", codes);
  if (error) throw error;
  return ((data ?? []) as ResponseRow[]).map((r) => responseToApi(r));
}

export const responses = {
  list: {
    options: { auth: "required", tenant: "fromParam", permission: "response.read" } as const,
    handler: async (ctx: TenantContext<undefined, undefined>) => {
      const assessment = await requireAssessment(ctx as TenantContext<unknown, unknown>, ctx.params.assessmentId ?? "");
      const { data, error } = await ctx.supabase
        .from("assessment_responses")
        .select(RESPONSE_COLUMNS)
        .eq("assessment_id", assessment.id)
        .eq("organization_id", ctx.organizationId)
        .order("question_code");
      if (error) throw error;
      const rows = (data ?? []) as ResponseRow[];
      const evidence = await evidenceByResponse(ctx.supabase, ctx.organizationId, rows.map((r) => r.id));
      return ok(
        { assessmentId: assessment.id, responses: rows.map((r) => responseToApi(r, evidence.get(r.id))) },
        ctx.request,
      );
    },
  },

  put: {
    options: { auth: "required", tenant: "fromParam", permission: "response.write", body: putBody } as const,
    handler: async (ctx: TenantContext<z.infer<typeof putBody>, undefined>) => {
      const { supabase, organizationId, body, request } = ctx;
      const assessment = await requireAssessment(ctx as TenantContext<unknown, unknown>, ctx.params.assessmentId ?? "");
      const code = questionCodeParam.safeParse(ctx.params.questionCode);
      if (!code.success) throw new ApiError(404, "NOT_FOUND", "Question not found in this assessment.");

      // The database refuses both of these too; checking first gives the better message.
      if (LOCKED_STATUSES.has(assessment.status)) {
        throw new ApiError(409, "CONFLICT", `This assessment is ${assessment.status} — its answers are locked.`);
      }
      const { data: question, error: qError } = await supabase
        .from("assessment_questions")
        .select("question_code, applicability")
        .eq("assessment_id", assessment.id)
        .eq("organization_id", organizationId)
        .eq("question_code", code.data)
        .maybeSingle();
      if (qError) throw qError;
      if (!question) throw new ApiError(404, "NOT_FOUND", "Question not found in this assessment.");
      if (question.applicability === "mandatory" && body.applicabilityDecision === "not_applicable") {
        throw new ApiError(422, "VALIDATION_ERROR", "A mandatory question cannot be marked Not Applicable.", [
          { field: "applicabilityDecision", issue: "mandatory questions apply to every organisation" },
        ]);
      }

      // Only the answer columns: evidence_level, adjusted_score, answered_by
      // and answered_at have no user grant and are set by the database.
      const answer =
        body.applicabilityDecision === "applicable"
          ? { applicability_decision: "applicable", claimed_maturity: body.claimedMaturity, na_reason: null, notes: body.notes ?? null }
          : { applicability_decision: "not_applicable", claimed_maturity: null, na_reason: body.naReason, notes: body.notes ?? null };

      const { data: existing, error: eError } = await supabase
        .from("assessment_responses")
        .select("id")
        .eq("assessment_id", assessment.id)
        .eq("organization_id", organizationId)
        .eq("question_code", code.data)
        .maybeSingle();
      if (eError) throw eError;

      let responseId: string;
      if (existing) {
        const { error } = await supabase
          .from("assessment_responses")
          .update(answer)
          .eq("id", existing.id)
          .eq("organization_id", organizationId);
        if (error) mapWriteError(error, "Response not found.");
        responseId = existing.id;
      } else {
        const { data, error } = await supabase
          .from("assessment_responses")
          .insert({ organization_id: organizationId, assessment_id: assessment.id, question_code: code.data, ...answer })
          .select("id")
          .single();
        if (error) mapWriteError(error, "Question not found in this assessment.");
        responseId = data!.id;
      }

      const response = await readResponse(supabase, organizationId, responseId);
      const refreshed = await requireAssessment(ctx as TenantContext<unknown, unknown>, assessment.id);
      return ok({ response, assessmentStatus: refreshed.status }, request, { status: existing ? 200 : 201 });
    },
  },
};
