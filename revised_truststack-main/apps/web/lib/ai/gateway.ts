import "server-only";
import { createHash } from "node:crypto";
import {
  AI_LIMIT_MESSAGE,
  AI_OFF_MESSAGE,
  AI_REJECTION_MESSAGE,
  AI_STATES_OUTCOME_MESSAGE,
  AI_TASK_SPECS,
  aiLimitHit,
  aiOffReason,
  AI_NARRATIVE_NUMBERS_MESSAGE,
  AI_TRANSLATION_KEYS_MESSAGE,
  can,
  isReportKind,
  reportKindDefinition,
  type ReportDocument,
  type AiOffReason,
  type AiTask,
  type AiUsage,
} from "@truststack/core";
import { ApiError, rpcError, type TenantContext } from "@/lib/api/guard";
import { fail, ok } from "@/lib/api/envelope";
import { readAssessmentQuestion, requireAssessment } from "@/lib/assessments/routes";
import { readResponseForQuestion, readResponsesForDomain } from "@/lib/assessments/responses";
import { readAssessmentScore } from "@/lib/assessments/score";
import { readBreaches } from "@/lib/breach/shape";
import { NOTICE_COLUMNS, noticeToApi, type NoticeRow } from "@/lib/consent/shape";
import { activeMembers, readGapForAction, readGaps } from "@/lib/gaps/shape";
import { readNarratableReport } from "@/lib/reports/narrate";
import { readRights } from "@/lib/rights/shape";
import { readAllRecords, todayInIndia } from "@/lib/ropa/shape";
import type { Json } from "@/lib/supabase/database.types";
import type { AppSupabaseClient } from "@/lib/supabase/server";
import { evaluateAnswer, MODEL_ANSWER_JSON_SCHEMA } from "./answer";
import { aiPlatformEnabled, createProvider } from "./config";
import { DRAFT_JSON_SCHEMAS, evaluateDraft, isDraftTask } from "./drafts";
import { CORPUS_VERSION, PROMPT_VERSION, provisionIndex, SYSTEM_PREFIX, untrustedJson } from "./prompt";
import { ProviderUnavailableError, type AiProvider } from "./provider";
import { breachIntimationBody, shapeBreachIntimationContext } from "./tasks/breach-intimation";
import { evidenceHelperBody, shapeEvidenceHelperContext } from "./tasks/evidence-helper";
import { gapHelperBody, shapeGapHelperContext } from "./tasks/gap-helper";
import { noticeDraftBody, shapeNoticeDraftContext } from "./tasks/notice-draft";
import { noticeTranslationBody, shapeNoticeTranslationContext } from "./tasks/notice-translation";
import { reportNarrativeBody, shapeReportNarrativeContext } from "./tasks/report-narrative";
import { questionHelperBody, shapeQuestionHelperContext } from "./tasks/question-helper";
import { rightsResponseBody, shapeRightsResponseContext } from "./tasks/rights-response";
import { ropaDraftBody, shapeRopaDraftContext } from "./tasks/ropa-draft";
import { scoreHelperBody, shapeScoreHelperContext } from "./tasks/score-helper";
import type { OrganisationRaw, ShapedContext } from "./tasks/shared";
import type { z } from "zod";

/**
 * THE AI gateway (SLICE_11 §2.1; D-124). One chain, in this order:
 *
 *   withApi (auth → tenant → `ai.use`)            — the route
 *   → off?        kill switch, sector/SDF hold, the organisation's switch → 403, no provider call
 *   → may?        the task's own read permission (§4.7); a draft's write one too → 403
 *   → valid?      the task's body (Zod)                                    → 400
 *   → limits      per person, per organisation, monthly tokens (§4.9)      → 429
 *   → context     the routes' readers → allow-list, black box, scrub, injection flag
 *   → provider    the cached corpus prefix + the context; structured output
 *   → guardrails  refusal, truncation, schema, wording, other tenant, citations
 *   → draft row   as the person, RLS + the database's second lock; audited by trigger
 *
 * The AI has no tool and writes nothing but its own draft row (§4.4). A
 * drafting task (Stages 2a–2b) returns a draft a person edits and accepts or discards
 * (routes.ts); accepting pre-fills the register's own form — the person saves. A
 * report's narrative is printed only in a NEW version a person generates (D-133.1).
 */

interface OrganisationAiRow {
  name: string;
  organization_type: string;
  industry_code: string | null;
  sdf_notified_on: string | null;
  ai_enabled: boolean;
  ai_contract_ref: string | null;
  ai_enabled_at: string | null;
}

export async function readAiStatus(supabase: AppSupabaseClient, organizationId: string) {
  const [{ data: org, error }, { data: signoffs, error: sError }] = await Promise.all([
    supabase
      .from("organizations")
      .select("name, organization_type, industry_code, sdf_notified_on, ai_enabled, ai_contract_ref, ai_enabled_at")
      .eq("id", organizationId)
      .maybeSingle(),
    supabase.from("ai_industry_signoffs").select("industry_code"),
  ]);
  if (error) throw error;
  if (sError) throw sError;
  if (!org) throw new ApiError(403, "TENANT_ACCESS_DENIED", "You do not have access to this organisation.");
  const row = org as OrganisationAiRow;
  const offReason = aiOffReason({
    platformEnabled: aiPlatformEnabled(),
    organisationEnabled: row.ai_enabled,
    industryCode: row.industry_code,
    sdfNotifiedOn: row.sdf_notified_on,
    signedOffIndustries: (signoffs ?? []).map((s) => s.industry_code),
  });
  return { row, offReason };
}

/** GET …/ai — whether the assistant can answer here, and why not (the panel's empty state, Stage 1b). */
export function aiStatusPayload(row: OrganisationAiRow, offReason: AiOffReason | null) {
  return {
    available: offReason === null,
    offReason,
    message: offReason ? AI_OFF_MESSAGE[offReason] : null,
    platformEnabled: aiPlatformEnabled(),
    organisation: { enabled: row.ai_enabled, contractRef: row.ai_contract_ref, enabledAt: row.ai_enabled_at },
  };
}

async function readUsage(supabase: AppSupabaseClient, organizationId: string): Promise<AiUsage> {
  const { data, error } = await supabase.rpc("ai_usage", { p_organization_id: organizationId });
  if (error) throw rpcError(error) ?? error;
  const u = data as unknown as Record<string, number>;
  return {
    personCallsLastHour: Number(u.personCallsLastHour ?? 0),
    organizationCallsLastHour: Number(u.organizationCallsLastHour ?? 0),
    organizationTokensThisMonth: Number(u.organizationTokensThisMonth ?? 0),
  };
}

/** Names of the OTHER organisations this person can see — an answer naming one is rejected (§8). */
async function otherOrganisationNames(supabase: AppSupabaseClient, organizationId: string): Promise<string[]> {
  const { data, error } = await supabase.from("organizations").select("name").neq("id", organizationId);
  if (error) throw error;
  return (data ?? []).map((o) => o.name);
}

/** The task's body, or a 400 with each issue — the same shape `withApi` gives. */
function parseBody<T extends z.ZodType>(schema: T, body: unknown): z.infer<T> {
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    throw new ApiError(
      400,
      "VALIDATION_ERROR",
      "Invalid request body.",
      parsed.error.issues.map((i) => ({ field: i.path.join("."), issue: i.message })),
    );
  }
  return parsed.data;
}

/** The organisation as every helper sends it — its name, type and industry's name. */
async function organisationRaw(supabase: AppSupabaseClient, org: OrganisationAiRow): Promise<OrganisationRaw> {
  const { data: industry } = org.industry_code
    ? await supabase.from("industries").select("name").eq("code", org.industry_code).maybeSingle()
    : { data: null };
  return { name: org.name, organizationType: org.organization_type, industryName: industry?.name ?? null };
}

/** One question of the assessment, as a client role reads it — the Question and Evidence helpers' reader. */
async function questionRaw(ctx: TenantContext<unknown, unknown>, assessmentId: string, questionCode: string) {
  const question = await readAssessmentQuestion(ctx.supabase, ctx.organizationId, assessmentId, questionCode);
  if (!question) throw new ApiError(404, "NOT_FOUND", "Question not found in this assessment.");
  return {
    questionCode: question.question_code,
    questionText: question.question_text,
    evidenceGuidance: question.evidence_guidance,
    domainCode: question.domain_code,
    domainWeight: question.domain_weight,
    applicability: question.applicability,
    priority: question.priority,
    suggestedOwner: question.suggested_owner,
  };
}

/**
 * The task's context, read through the routes' OWN readers (D-069) and shaped
 * by its builder (allow-list, black box, scrub, injection flag). A new task adds
 * a case here.
 */
async function buildContext(
  task: AiTask,
  ctx: TenantContext<unknown, unknown>,
  org: OrganisationAiRow,
): Promise<ShapedContext> {
  switch (task) {
    case "question_helper": {
      const body = parseBody(questionHelperBody, ctx.body);
      const question = await questionRaw(ctx, body.assessmentId, body.questionCode);
      // The answer is read with response.read; without it the helper explains the question alone.
      const response = can(ctx.permissions, "response.read")
        ? await readResponseForQuestion(ctx.supabase, ctx.organizationId, body.assessmentId, body.questionCode)
        : null;
      return shapeQuestionHelperContext(
        {
          organisation: await organisationRaw(ctx.supabase, org),
          question,
          response: response as unknown as (Record<string, unknown> & { evidence?: Record<string, unknown>[] }) | null,
          ask: body.ask ?? null,
        },
        { assessmentId: body.assessmentId, questionCode: body.questionCode },
        untrustedJson,
      );
    }
    case "evidence_helper": {
      const body = parseBody(evidenceHelperBody, ctx.body);
      const question = await questionRaw(ctx, body.assessmentId, body.questionCode);
      // Evidence hangs on an answer: none (or none this person may read) is a 409, not a guess.
      const response = can(ctx.permissions, "response.read")
        ? await readResponseForQuestion(ctx.supabase, ctx.organizationId, body.assessmentId, body.questionCode)
        : null;
      if (!response || response.applicabilityDecision !== "applicable") {
        throw new ApiError(409, "CONFLICT", "Answer this question first — evidence is attached to an answer that applies.");
      }
      return shapeEvidenceHelperContext(
        {
          organisation: await organisationRaw(ctx.supabase, org),
          question,
          response: response as unknown as Record<string, unknown> & { evidence?: Record<string, unknown>[] },
          ask: body.ask ?? null,
        },
        { assessmentId: body.assessmentId, questionCode: body.questionCode },
        untrustedJson,
      );
    }
    case "gap_helper": {
      const body = parseBody(gapHelperBody, ctx.body);
      let gap;
      let actionId: string | null = null;
      if ("actionId" in body) {
        // The Actions page: the action's own assessment gap. A register's action (ROPA, breach…) has none.
        actionId = body.actionId;
        gap = await readGapForAction(ctx.supabase, ctx.organizationId, body.actionId);
        if (!gap) throw new ApiError(404, "NOT_FOUND", "Only an action on an assessment gap can be explained here.");
      } else {
        await requireAssessment(ctx, body.assessmentId);
        // No members passed: the helper never sends a name, so it needs none beyond what the reader looks up.
        [gap] = await readGaps(ctx.supabase, ctx.organizationId, body.assessmentId, [], body.gapId);
        if (!gap) throw new ApiError(404, "NOT_FOUND", "Gap not found in this assessment.");
      }
      return shapeGapHelperContext(
        {
          organisation: await organisationRaw(ctx.supabase, org),
          gap: gap as unknown as Record<string, unknown> & { actions?: Record<string, unknown>[] },
          actionId,
          ask: body.ask ?? null,
        },
        { gapId: gap.id },
        untrustedJson,
      );
    }
    case "score_helper": {
      const body = parseBody(scoreHelperBody, ctx.body);
      const assessment = await requireAssessment(ctx, body.assessmentId);
      // THE score reader: a finalised assessment's snapshot, or the live score (pitfall 1).
      const score = await readAssessmentScore(ctx.supabase, ctx.organizationId, assessment);
      const domain = score.domains.find((d) => d.code === body.domainCode);
      if (!domain) throw new ApiError(404, "NOT_FOUND", "Domain not found.");
      const answers = can(ctx.permissions, "response.read")
        ? await readResponsesForDomain(ctx.supabase, ctx.organizationId, assessment.id, body.domainCode)
        : null;
      return shapeScoreHelperContext(
        {
          organisation: await organisationRaw(ctx.supabase, org),
          domain: domain as unknown as Record<string, unknown> & { name: string },
          finalised: score.finalised,
          answers: answers as unknown as (Record<string, unknown> & { applicabilityDecision: string })[] | null,
          ask: body.ask ?? null,
        },
        { assessmentId: assessment.id, domainCode: body.domainCode },
        untrustedJson,
      );
    }
    case "ropa_draft": {
      const body = parseBody(ropaDraftBody, ctx.body);
      // The organisation's own words for its parts and its people — names only.
      const [departments, principalTypes] = await Promise.all([
        ctx.supabase.from("departments").select("name").eq("organization_id", ctx.organizationId).order("name"),
        ctx.supabase.from("data_principal_types").select("label, includes_children").eq("organization_id", ctx.organizationId).order("label"),
      ]);
      if (departments.error) throw departments.error;
      if (principalTypes.error) throw principalTypes.error;
      return shapeRopaDraftContext(
        {
          organisation: await organisationRaw(ctx.supabase, org),
          departments: departments.data ?? [],
          dataPrincipalTypes: (principalTypes.data ?? []).map((p) => ({ label: p.label, includesChildren: p.includes_children })),
          description: body.description,
          ask: body.ask ?? null,
        },
        untrustedJson,
      );
    }
    case "breach_intimation_draft": {
      const body = parseBody(breachIntimationBody, ctx.body);
      // THE register's reader; no members passed — the draft never sends a name.
      const [breach] = await readBreaches(ctx.supabase, ctx.organizationId, [], new Date().toISOString(), body.breachId);
      if (!breach) throw new ApiError(404, "NOT_FOUND", "Breach not found.");
      if (breach.status === "closed" || breach.status === "dismissed") {
        throw new ApiError(409, "CONFLICT", "This breach is closed or dismissed, so there is no intimation to draft. Reopen it first.");
      }
      return shapeBreachIntimationContext(
        {
          organisation: await organisationRaw(ctx.supabase, org),
          breach: breach as unknown as Parameters<typeof shapeBreachIntimationContext>[0]["breach"],
          ask: body.ask ?? null,
        },
        { breachId: breach.id },
        untrustedJson,
      );
    }
    case "rights_response_draft": {
      const body = parseBody(rightsResponseBody, ctx.body);
      const [request] = await readRights(ctx.supabase, ctx.organizationId, [], todayInIndia(), body.requestId);
      if (!request) throw new ApiError(404, "NOT_FOUND", "Request not found.");
      if (request.status !== "open") {
        throw new ApiError(409, "CONFLICT", "This request is no longer open, so there is no response to draft. Reopen it first.");
      }
      return shapeRightsResponseContext(
        {
          organisation: await organisationRaw(ctx.supabase, org),
          request: request as unknown as Record<string, unknown>,
          ask: body.ask ?? null,
        },
        { requestId: request.id },
        untrustedJson,
      );
    }
    case "notice_draft": {
      const body = parseBody(noticeDraftBody, ctx.body);
      // THE register's reader (D-069); the builder keeps the consent-based records (D-133.3).
      const [records, current] = await Promise.all([
        readAllRecords(ctx.supabase, ctx.organizationId),
        ctx.supabase
          .from("privacy_notices")
          .select("purposes")
          .eq("organization_id", ctx.organizationId)
          .eq("language", "en")
          .eq("status", "published")
          .order("version", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);
      if (current.error) throw current.error;
      return shapeNoticeDraftContext(
        {
          organisation: await organisationRaw(ctx.supabase, org),
          records: records as unknown as Parameters<typeof shapeNoticeDraftContext>[0]["records"],
          currentPurposes: ((current.data?.purposes ?? []) as Record<string, unknown>[]) ?? [],
          ask: body.ask ?? null,
        },
        untrustedJson,
      );
    }
    case "notice_translation_draft": {
      const body = parseBody(noticeTranslationBody, ctx.body);
      const { data, error } = await ctx.supabase
        .from("privacy_notices")
        .select(NOTICE_COLUMNS)
        .eq("organization_id", ctx.organizationId)
        .eq("id", body.noticeId)
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new ApiError(404, "NOT_FOUND", "Notice not found.");
      // The routes' own shape; no names are passed, so none is read.
      const notice = noticeToApi(data as NoticeRow, new Map());
      if (notice.status !== "published") throw new ApiError(409, "CONFLICT", "Translate a published notice: a draft may still change.");
      if (notice.language === body.language) throw new ApiError(409, "CONFLICT", "This notice is already in that language.");
      return shapeNoticeTranslationContext(
        {
          organisation: await organisationRaw(ctx.supabase, org),
          notice: notice as unknown as Parameters<typeof shapeNoticeTranslationContext>[0]["notice"],
          language: body.language,
          ask: body.ask ?? null,
        },
        { noticeId: notice.id },
        untrustedJson,
      );
    }
    case "report_narrative_draft": {
      const body = parseBody(reportNarrativeBody, ctx.body);
      const { row, document } = await readNarratableReport(ctx.supabase, ctx.organizationId, body.reportId);
      const members = await activeMembers(ctx.supabase, ctx.organizationId);
      return shapeReportNarrativeContext(
        {
          organisation: await organisationRaw(ctx.supabase, org),
          report: {
            kindLabel: isReportKind(row.kind) ? reportKindDefinition(row.kind).label : row.kind,
            version: row.version,
            asOf: row.as_of,
          },
          document: document as ReportDocument,
          memberNames: members.map((m) => m.fullName).filter((n): n is string => typeof n === "string"),
          ask: body.ask ?? null,
        },
        { reportId: row.id },
        untrustedJson,
      );
    }
  }
}

function digest(context: Record<string, unknown>): string {
  return createHash("sha256").update(JSON.stringify(context)).digest("hex");
}

export async function runAiTask(
  ctx: TenantContext<unknown, unknown>,
  task: AiTask,
  providerFactory: () => AiProvider = createProvider,
): Promise<Response> {
  const { supabase, organizationId, request } = ctx;
  const spec = AI_TASK_SPECS[task];

  // Off: nothing is read, nothing is sent, no provider is created.
  const { row: org, offReason } = await readAiStatus(supabase, organizationId);
  if (offReason) return fail(403, "AI_DISABLED", AI_OFF_MESSAGE[offReason], request, [{ issue: offReason }]);

  if (!can(ctx.permissions, spec.readPermission)) {
    throw new ApiError(403, "FORBIDDEN", "You do not have permission to use this AI helper here.");
  }
  // A draft is for someone who can act on it: the register's write permission too (§4.7, D-129.3).
  if (spec.writePermission !== null && !can(ctx.permissions, spec.writePermission)) {
    throw new ApiError(403, "FORBIDDEN", "Only someone who can write to this register can ask for a draft.");
  }

  const shaped = await buildContext(task, ctx, org);

  const hit = aiLimitHit(await readUsage(supabase, organizationId));
  if (hit) return fail(429, "RATE_LIMITED", AI_LIMIT_MESSAGE[hit], request, [{ issue: hit }], { "Retry-After": "3600" });

  let provider: AiProvider;
  let result;
  try {
    provider = providerFactory();
    result = await provider.complete({
      task,
      system: SYSTEM_PREFIX,
      user: shaped.user,
      schema: isDraftTask(task) ? DRAFT_JSON_SCHEMAS[task] : MODEL_ANSWER_JSON_SCHEMA,
      effort: spec.effort,
      maxTokens: spec.maxTokens,
    });
  } catch (error) {
    if (!(error instanceof ProviderUnavailableError)) throw error;
    console.error("[ai]", task, error.message);
    await ctx.audit([
      {
        organizationId,
        eventType: "ai.unavailable",
        entityType: "ai_draft",
        description: "AI assistant could not be reached",
        metadata: { task, targetType: shaped.target.type, targetId: shaped.target.id },
      },
    ]);
    return fail(503, "AI_UNAVAILABLE", "The AI assistant could not be reached. Try again in a moment.", request);
  }

  const evaluation =
    result.kind === "answer"
      ? isDraftTask(task)
        ? evaluateDraft(task, result.text, {
            index: provisionIndex(),
            otherOrganisationNames: await otherOrganisationNames(supabase, organizationId),
            facts: shaped.facts,
          })
        : evaluateAnswer(task, result.text, {
            index: provisionIndex(),
            otherOrganisationNames: await otherOrganisationNames(supabase, organizationId),
          })
      : ({ ok: false, rejection: result.kind, detail: result.kind === "refusal" ? (result.category ?? "") : "", citationFlags: [] } as const);

  // The rule that refused an answer, by name only (wording kinds, schema paths) — never its text.
  if (!evaluation.ok) console.warn("[ai]", task, "refused:", evaluation.rejection, evaluation.detail);

  const { data: draft, error } = await supabase
    .from("ai_drafts")
    .insert({
      organization_id: organizationId,
      task,
      target_type: shaped.target.type,
      target_id: shaped.target.id,
      target_key: shaped.target.key,
      status: evaluation.ok ? "draft" : "rejected",
      rejection: evaluation.ok ? null : evaluation.rejection,
      input_digest: digest(shaped.context),
      context: shaped.context as Json,
      output: evaluation.ok ? (evaluation.answer as unknown as Json) : null,
      model: result.model,
      corpus_version: CORPUS_VERSION,
      prompt_version: PROMPT_VERSION,
      input_tokens: result.usage.inputTokens,
      output_tokens: result.usage.outputTokens,
      cache_read_tokens: result.usage.cacheReadTokens,
      cache_write_tokens: result.usage.cacheWriteTokens,
      latency_ms: result.latencyMs,
      injection_flagged: shaped.injectionFlagged,
      citation_flags: evaluation.citationFlags as unknown as Json,
    })
    .select("id, created_at")
    .single();
  if (error) throw rpcError(error) ?? error;

  if (!evaluation.ok) {
    const message =
      evaluation.detail === "states_outcome"
        ? AI_STATES_OUTCOME_MESSAGE
        : evaluation.detail === "numbers_not_in_document"
          ? AI_NARRATIVE_NUMBERS_MESSAGE
          : evaluation.detail === "translation_keys"
            ? AI_TRANSLATION_KEYS_MESSAGE
            : AI_REJECTION_MESSAGE[evaluation.rejection];
    return fail(422, "AI_ANSWER_REJECTED", message, request, [
      { field: "draftId", issue: draft.id },
      { field: "rejection", issue: evaluation.rejection },
    ]);
  }
  return ok(
    {
      draft: {
        id: draft.id,
        task,
        status: "draft" as const,
        target: shaped.target,
        createdAt: draft.created_at,
        model: result.model,
        corpusVersion: CORPUS_VERSION,
        promptVersion: PROMPT_VERSION,
        injectionFlagged: shaped.injectionFlagged,
        citationFlags: evaluation.citationFlags,
        answer: evaluation.answer,
      },
    },
    request,
  );
}
