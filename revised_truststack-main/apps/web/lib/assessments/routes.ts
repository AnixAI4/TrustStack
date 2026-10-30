import "server-only";
import { ASSESSMENT_TYPES, summariseByDomain, type DomainCode } from "@truststack/core";
import { z } from "zod";
import { ApiError, rpcError, type TenantContext } from "@/lib/api/guard";
import { ok } from "@/lib/api/envelope";
import type { AppSupabaseClient } from "@/lib/supabase/server";
import { generateForOrganization, generationPayload } from "./generate";

/**
 * Assessment routes, nested under `/organizations/{id}/…`.
 *
 * The spec's paths are flat (`/assessments/{assessmentId}`), which would need a
 * new guard mode that reads the row's `organization_id` before it knows which
 * tenant to check. Nesting works with today's `tenant: "fromParam"` chain and
 * keeps tenancy visible in the URL, so an Org A path with an Org B assessment
 * id is a plain 404 from the `.eq("organization_id", …)` filter, twice over —
 * the guard and the query (D-003).
 */

/** One literal string: Supabase types a `select()` from the literal, not a concatenation. */
const ASSESSMENT_COLUMNS =
  "id, organization_id, name, assessment_type, status, industry_code, risk_tags, scope_derived_at, generated_at, created_by, created_at, updated_at" as const;

const createBody = z
  .object({
    name: z.string().trim().min(1).max(200),
    assessmentType: z.enum(ASSESSMENT_TYPES).default("baseline"),
  })
  .strict();

export type AssessmentRow = {
  id: string;
  organization_id: string;
  name: string;
  assessment_type: string;
  status: string;
  industry_code: string | null;
  risk_tags: string[] | null;
  scope_derived_at: string | null;
  generated_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

/**
 * The black box, enforced by the database (D-071): which packs an assessment
 * came from, and why each question is in it, are withdrawn from client roles
 * by column privilege. Anix staff (`question.read_bank`) read them through
 * one SECURITY DEFINER function; everyone else never receives the fields.
 */
export interface Provenance {
  /** assessment id → pack codes */
  assessments: Record<string, string[]>;
  questions: { question_code: string; pack_code: string; included_reason: string }[];
}

export async function readProvenance(
  ctx: TenantContext<unknown, unknown>,
  assessmentId?: string,
): Promise<Provenance | null> {
  if (!ctx.permissions.has("question.read_bank")) return null;
  const { data, error } = await ctx.supabase.rpc("assessment_provenance", {
    p_organization_id: ctx.organizationId,
    ...(assessmentId ? { p_assessment_id: assessmentId } : {}),
  });
  if (error) throw rpcError(error) ?? error;
  return data as unknown as Provenance;
}

function toApi(row: AssessmentRow, questionCount?: number, packCodes?: string[]) {
  return {
    id: row.id,
    organizationId: row.organization_id,
    name: row.name,
    assessmentType: row.assessment_type,
    status: row.status,
    industryCode: row.industry_code,
    riskTags: row.risk_tags ?? [],
    // Anix staff only (D-071): absent, not empty, for a client.
    ...(packCodes === undefined ? {} : { packCodes }),
    scopeDerivedAt: row.scope_derived_at,
    generatedAt: row.generated_at,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    ...(questionCount === undefined ? {} : { questionCount }),
  };
}

/** A question as a client role reads it — named columns only, never `*` (D-071). */
const QUESTION_COLUMNS =
  "question_code, question_version, question_text, domain_code, domain_weight, applicability, priority, evidence_guidance, suggested_owner, sort_order" as const;

export interface AssessmentQuestionRow {
  question_code: string;
  question_version: number;
  question_text: string;
  domain_code: string;
  domain_weight: number | string;
  applicability: string;
  priority: string | null;
  evidence_guidance: string | null;
  suggested_owner: string | null;
  sort_order: number;
}

/**
 * One question of one assessment, by both ids and the code — the reader the AI
 * Question Helper builds its context from (Slice 11, D-069). Null when the
 * assessment is not this organisation's or the code is not in its snapshot.
 */
export async function readAssessmentQuestion(
  supabase: AppSupabaseClient,
  organizationId: string,
  assessmentId: string,
  questionCode: string,
): Promise<AssessmentQuestionRow | null> {
  const { data, error } = await supabase
    .from("assessment_questions")
    .select(QUESTION_COLUMNS)
    .eq("assessment_id", assessmentId)
    .eq("organization_id", organizationId)
    .eq("question_code", questionCode)
    .maybeSingle();
  if (error) throw error;
  return (data as AssessmentQuestionRow | null) ?? null;
}

/** Both ids, always — so an Org B id under an Org A path returns 404, not data. */
/** Every assessment of an organisation, newest first — the full row, as the readers take it. */
export async function listAssessments(supabase: AppSupabaseClient, organizationId: string): Promise<AssessmentRow[]> {
  const { data, error } = await supabase
    .from("assessments")
    .select(ASSESSMENT_COLUMNS)
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as AssessmentRow[];
}

export async function requireAssessment(ctx: TenantContext<unknown, unknown>, assessmentId: string) {
  const parsed = z.uuid().safeParse(assessmentId);
  if (!parsed.success) throw new ApiError(404, "NOT_FOUND", "Assessment not found.");

  const { data, error } = await ctx.supabase
    .from("assessments")
    .select(ASSESSMENT_COLUMNS)
    .eq("id", parsed.data)
    .eq("organization_id", ctx.organizationId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new ApiError(404, "NOT_FOUND", "Assessment not found.");
  return data as AssessmentRow;
}

export const assessments = {
  list: {
    options: { auth: "required", tenant: "fromParam", permission: "assessment.read" } as const,
    handler: async (ctx: TenantContext<undefined, undefined>) => {
      const { request, supabase, organizationId } = ctx;
      const { data, error } = await supabase
        .from("assessments")
        .select(ASSESSMENT_COLUMNS)
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      const rows = (data ?? []) as AssessmentRow[];

      // One head count per assessment, on a NAMED column. An embedded
      // `assessment_questions(count)` needs table-level SELECT, which client
      // roles no longer hold (D-071: provenance is withheld by column).
      const counts = await Promise.all(
        rows.map(async (r) => {
          const { count, error: cError } = await supabase
            .from("assessment_questions")
            .select("question_code", { count: "exact", head: true })
            .eq("assessment_id", r.id)
            .eq("organization_id", organizationId);
          if (cError) throw cError;
          return count ?? 0;
        }),
      );

      const provenance = await readProvenance(ctx as TenantContext<unknown, unknown>);
      return ok(
        {
          assessments: rows.map((r, i) =>
            toApi(r, counts[i], provenance ? (provenance.assessments[r.id] ?? []) : undefined),
          ),
        },
        request,
      );
    },
  },

  create: {
    options: {
      auth: "required",
      tenant: "fromParam",
      permission: "assessment.write",
      body: createBody,
    } as const,
    handler: async (ctx: TenantContext<z.infer<typeof createBody>, undefined>) => {
      const { request, supabase, organizationId, body, user } = ctx;

      const { data, error } = await supabase
        .from("assessments")
        .insert({
          organization_id: organizationId,
          name: body.name,
          assessment_type: body.assessmentType,
          status: "draft",
          created_by: user.id,
        })
        .select(ASSESSMENT_COLUMNS)
        .single();
      if (error) {
        if (error.code === "23505" || error.code === "23P01") {
          throw new ApiError(409, "CONFLICT", "An assessment with that name already exists.");
        }
        throw error;
      }

      // Generate straight away: an assessment with no questions is not useful,
      // and a stale scope must fail the whole request, not leave an empty row.
      const created = data as AssessmentRow;
      try {
        const outcome = await generateForOrganization(supabase, organizationId, created.id);
        const refreshed = await requireAssessment(ctx as TenantContext<unknown, unknown>, created.id);
        const fullBank = ctx.permissions.has("question.read_bank");
        return ok(
          {
            assessment: toApi(refreshed, outcome.writtenCount, fullBank ? outcome.packCodes : undefined),
            generation: generationPayload(outcome, fullBank),
          },
          request,
          { status: 201 },
        );
      } catch (generationError) {
        // PostgREST has no multi-statement transaction: compensate, exactly as
        // the Slice 2 vendor create does (D-027.4).
        await supabase.from("assessments").delete().eq("id", created.id).eq("organization_id", organizationId);
        throw generationError;
      }
    },
  },

  read: {
    options: { auth: "required", tenant: "fromParam", permission: "assessment.read" } as const,
    handler: async (ctx: TenantContext<undefined, undefined>) => {
      const row = await requireAssessment(ctx as TenantContext<unknown, unknown>, ctx.params.assessmentId ?? "");
      const { count, error } = await ctx.supabase
        .from("assessment_questions")
        // A named column, never `*`: the provenance columns are not granted (D-071).
        .select("question_code", { count: "exact", head: true })
        .eq("assessment_id", row.id)
        .eq("organization_id", ctx.organizationId);
      if (error) throw error;
      const provenance = await readProvenance(ctx as TenantContext<unknown, unknown>, row.id);
      return ok({ assessment: toApi(row, count ?? 0, provenance?.assessments[row.id]) }, ctx.request);
    },
  },

  questions: {
    options: { auth: "required", tenant: "fromParam", permission: "assessment.read" } as const,
    handler: async (ctx: TenantContext<undefined, undefined>) => {
      const row = await requireAssessment(ctx as TenantContext<unknown, unknown>, ctx.params.assessmentId ?? "");
      const { data, error } = await ctx.supabase
        .from("assessment_questions")
        .select(QUESTION_COLUMNS)
        .eq("assessment_id", row.id)
        .eq("organization_id", ctx.organizationId)
        .order("sort_order");
      if (error) throw error;

      // Allow-listed per view (D-071): provenance only for Anix staff.
      const provenance = await readProvenance(ctx as TenantContext<unknown, unknown>, row.id);
      const why = new Map((provenance?.questions ?? []).map((p) => [p.question_code, p]));
      const questions = (data ?? []).map((q) => ({
        questionCode: q.question_code,
        questionVersion: q.question_version,
        questionText: q.question_text,
        domainCode: q.domain_code as DomainCode,
        domainWeight: Number(q.domain_weight),
        applicability: q.applicability,
        priority: q.priority,
        evidenceGuidance: q.evidence_guidance,
        suggestedOwner: q.suggested_owner,
        sortOrder: q.sort_order,
        ...(provenance
          ? { packCode: why.get(q.question_code)?.pack_code ?? null, includedReason: why.get(q.question_code)?.included_reason ?? null }
          : {}),
      }));

      return ok(
        {
          assessment: toApi(row, questions.length, provenance?.assessments[row.id]),
          questions,
          domains: summariseByDomain(questions as never),
        },
        ctx.request,
      );
    },
  },

  generate: {
    options: { auth: "required", tenant: "fromParam", permission: "assessment.write" } as const,
    handler: async (ctx: TenantContext<undefined, undefined>) => {
      const row = await requireAssessment(ctx as TenantContext<unknown, unknown>, ctx.params.assessmentId ?? "");
      // The RPC refuses this too; failing here gives the better message.
      if (row.status !== "draft") {
        throw new ApiError(
          409,
          "CONFLICT",
          `Only a draft assessment can be regenerated — this one is ${row.status}.`,
        );
      }
      const outcome = await generateForOrganization(ctx.supabase, ctx.organizationId, row.id);
      const refreshed = await requireAssessment(ctx as TenantContext<unknown, unknown>, row.id);
      const fullBank = ctx.permissions.has("question.read_bank");
      return ok(
        {
          assessment: toApi(refreshed, outcome.writtenCount, fullBank ? outcome.packCodes : undefined),
          generation: generationPayload(outcome, fullBank),
        },
        ctx.request,
      );
    },
  },
};
