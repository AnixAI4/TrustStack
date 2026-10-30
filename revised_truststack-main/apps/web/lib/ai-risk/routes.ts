import "server-only";
import {
  aiChildProblem,
  AI_EARLIEST_REVIEW_ON,
  AI_NAME_LIMIT,
  AI_REGISTER_USAGE_TYPES,
  AI_RISK_NOTE,
  AI_SYSTEM_STATUSES,
  AI_TEXT_LIMIT,
  ForbiddenError,
  isCalendarDate,
  ROPA_CHILD_EXEMPTION_CODES,
  TRI_STATES,
  type TriState,
} from "@truststack/core";
import { z } from "zod";
import { ApiError, type TenantContext } from "@/lib/api/guard";
import { ok } from "@/lib/api/envelope";
import { activeMembers } from "@/lib/gaps/shape";
import { todayInIndia } from "@/lib/ropa/shape";
import { AI_COLUMNS, readAiRegister, readAiSystems, type AiRow } from "./shape";

/**
 * The AI risk register (Slice 10, Stage 5), nested under
 * `/organizations/{id}/ai-systems…`: both ids filter every query, so a foreign
 * id is a 404, never data.
 *
 * Read with `ropa.read` and written with `ropa.write` — the processing
 * register's permissions (D-094.2, D-096 R5). It has no actions of its own
 * (D-094.3) and sets no exposure status: head 4 reads it only once an SDF
 * notification is recorded, and then only as a reason (1.5.0). The trigger
 * stamps who recorded a review and audits every change (D-027). No AI drafts
 * or reviews anything here (pitfall 4, Slice 11).
 */

type Ctx<B = unknown> = TenantContext<B, unknown>;

const date = z.string().refine(isCalendarDate, "must be a calendar date, YYYY-MM-DD");
const text = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullable()
    .optional()
    .transform((v) => (v === "" ? null : v));
const required = (max: number) => z.string().trim().min(1).max(max);
const oneOf = <T extends string>(values: readonly T[]) => z.enum(values as unknown as [T, ...T[]]);

const fields = {
  /** One of the scope's systems, or none. */
  systemId: z.uuid().nullable().optional(),
  usageType: oneOf(AI_REGISTER_USAGE_TYPES).nullable().optional(),
  name: required(AI_NAME_LIMIT),
  purpose: required(AI_TEXT_LIMIT),
  personalData: required(AI_TEXT_LIMIT),
  /** s.9(3): does it track, behaviourally monitor or target advertising at children? */
  childTracking: oneOf(TRI_STATES),
  /** The Fourth Schedule exemption relied on (Rule 12) — only on "yes". */
  childExemption: oneOf(ROPA_CHILD_EXEMPTION_CODES).nullable().optional(),
  humanReview: text(AI_TEXT_LIMIT),
  status: oneOf(AI_SYSTEM_STATUSES),
  /** The last review, in India; corrected, never removed. */
  lastReviewedOn: date.nullable().optional(),
};

const createBody = z
  .object({ ...fields, childTracking: fields.childTracking.optional(), status: fields.status.optional() })
  .strict();

const updateBody = z
  .object({
    systemId: fields.systemId,
    usageType: fields.usageType,
    name: fields.name.optional(),
    purpose: fields.purpose.optional(),
    personalData: fields.personalData.optional(),
    childTracking: fields.childTracking.optional(),
    childExemption: fields.childExemption,
    humanReview: fields.humanReview,
    status: fields.status.optional(),
    lastReviewedOn: fields.lastReviewedOn,
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, "Nothing to change.");

function writeError(error: { code?: string; message: string }): never {
  if (error.code === "23514" && error.message.includes("ai_systems_child_exemption_check")) {
    throw new ApiError(422, "VALIDATION_ERROR", "An exemption is recorded only when the system tracks, monitors or targets advertising at children.", [
      { field: "childExemption", issue: "only on yes" },
    ]);
  }
  if (error.code === "23514") throw new ApiError(422, "VALIDATION_ERROR", "That breaks a rule of the AI risk register.");
  if (error.code === "23505") throw new ApiError(409, "CONFLICT", "That system is already in the AI risk register.");
  // The composite FK: the system is not this organisation's.
  if (error.code === "23503") throw new ApiError(422, "VALIDATION_ERROR", "The system was not found.", [{ field: "systemId", issue: "not found" }]);
  if (error.code === "PGRST116") throw new ApiError(404, "NOT_FOUND", "AI system not found.");
  throw error;
}

const invalid = (message: string, field: string, issue: string): never => {
  throw new ApiError(422, "VALIDATION_ERROR", message, [{ field, issue }]);
};

function checkReview(on: string | null | undefined, today: string) {
  if (on === null || on === undefined) return;
  if (on > today) invalid("A date in the register cannot be in the future.", "lastReviewedOn", "in the future");
  if (on < AI_EARLIEST_REVIEW_ON) invalid("No review under the Act is dated before 11 August 2023.", "lastReviewedOn", "before the Act");
}

/** The children's answer and exemption, as they will stand — the CHECK's rule, earlier and in words. */
function checkChildren(childTracking: TriState, childExemption: string | null) {
  const problem = aiChildProblem(childTracking, childExemption);
  if (problem) invalid(problem, "childExemption", "only on yes");
}

function aiSystemId(ctx: Ctx): string {
  const parsed = z.uuid().safeParse(ctx.params.aiSystemId);
  if (!parsed.success) throw new ApiError(404, "NOT_FOUND", "AI system not found.");
  return parsed.data;
}

async function requireAi(ctx: Ctx): Promise<AiRow> {
  const { data, error } = await ctx.supabase
    .from("ai_systems")
    .select(AI_COLUMNS)
    .eq("organization_id", ctx.organizationId)
    .eq("id", aiSystemId(ctx))
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new ApiError(404, "NOT_FOUND", "AI system not found.");
  return data as AiRow;
}

async function detail(ctx: Ctx, id: string) {
  const members = await activeMembers(ctx.supabase, ctx.organizationId);
  const today = todayInIndia();
  const [system] = await readAiSystems(ctx.supabase, ctx.organizationId, members, today, id);
  if (!system) throw new ApiError(404, "NOT_FOUND", "AI system not found.");
  return { today, system, note: AI_RISK_NOTE };
}

export const aiRisk = {
  list: {
    options: { auth: "required", tenant: "fromParam", permission: "ropa.read" } as const,
    handler: async (ctx: Ctx<undefined>) => {
      const today = todayInIndia();
      const members = await activeMembers(ctx.supabase, ctx.organizationId);
      const [{ systems, counts, sdfNotified }, scope] = await Promise.all([
        readAiRegister(ctx.supabase, ctx.organizationId, members, today),
        // The scope's AI systems — what a new row may name.
        ctx.supabase.from("systems").select("id, name, system_type").eq("organization_id", ctx.organizationId).order("name"),
      ]);
      if (scope.error) throw scope.error;
      return ok(
        {
          organizationId: ctx.organizationId,
          today,
          /** Counted in core over the rows above (D-069). */
          counts,
          note: AI_RISK_NOTE,
          /** Head 4 (s.10, Rule 13(3)) applies only once a notification is recorded — never inferred (D-028). */
          sdfNotified,
          scopeSystems: (scope.data ?? []).map((s) => ({ id: s.id, name: s.name, systemType: s.system_type })),
          systems,
        },
        ctx.request,
      );
    },
  },

  create: {
    options: { auth: "required", tenant: "fromParam", permission: "ropa.write", body: createBody } as const,
    handler: async (ctx: Ctx<z.infer<typeof createBody>>) => {
      const { body } = ctx;
      checkReview(body.lastReviewedOn, todayInIndia());
      checkChildren(body.childTracking ?? "unknown", body.childExemption ?? null);
      // The review stamps and every created/updated stamp are the database's.
      const { data, error } = await ctx.supabase
        .from("ai_systems")
        .insert({
          organization_id: ctx.organizationId,
          system_id: body.systemId ?? null,
          usage_type: body.usageType ?? null,
          name: body.name,
          purpose: body.purpose,
          personal_data: body.personalData,
          child_tracking: body.childTracking ?? "unknown",
          child_exemption: body.childExemption ?? null,
          human_review: body.humanReview ?? null,
          status: body.status ?? "in_use",
          last_reviewed_on: body.lastReviewedOn ?? null,
        } as never)
        .select("id")
        .single();
      if (error) writeError(error);
      return ok(await detail(ctx, data.id), ctx.request, { status: 201 });
    },
  },

  read: {
    options: { auth: "required", tenant: "fromParam", permission: "ropa.read" } as const,
    handler: async (ctx: Ctx<undefined>) => ok(await detail(ctx, aiSystemId(ctx)), ctx.request),
  },

  update: {
    options: { auth: "required", tenant: "fromParam", permission: "ropa.write", body: updateBody } as const,
    handler: async (ctx: Ctx<z.infer<typeof updateBody>>) => {
      const row = await requireAi(ctx);
      const { body } = ctx;
      checkReview(body.lastReviewedOn, todayInIndia());
      if (body.lastReviewedOn === null && row.last_reviewed_on !== null) {
        throw new ApiError(409, "CONFLICT", "A recorded review cannot be removed — correct it instead.");
      }
      // Answering anything but "yes" drops the exemption with it.
      const childTracking = body.childTracking ?? (row.child_tracking as TriState);
      const childExemption =
        body.childExemption !== undefined ? body.childExemption : childTracking === "yes" ? row.child_exemption : null;
      checkChildren(childTracking, childExemption);
      const { error } = await ctx.supabase
        .from("ai_systems")
        .update({
          ...(body.systemId === undefined ? {} : { system_id: body.systemId }),
          ...(body.usageType === undefined ? {} : { usage_type: body.usageType }),
          ...(body.name === undefined ? {} : { name: body.name }),
          ...(body.purpose === undefined ? {} : { purpose: body.purpose }),
          ...(body.personalData === undefined ? {} : { personal_data: body.personalData }),
          ...(body.childTracking === undefined ? {} : { child_tracking: body.childTracking }),
          ...(childExemption === row.child_exemption ? {} : { child_exemption: childExemption }),
          ...(body.humanReview === undefined ? {} : { human_review: body.humanReview }),
          ...(body.status === undefined ? {} : { status: body.status }),
          ...(body.lastReviewedOn === undefined ? {} : { last_reviewed_on: body.lastReviewedOn }),
        })
        .eq("organization_id", ctx.organizationId)
        .eq("id", row.id)
        .select("id")
        .single();
      if (error) writeError(error);
      return ok(await detail(ctx, row.id), ctx.request);
    },
  },

  unlinkEvidence: {
    options: { auth: "required", tenant: "fromParam", permission: "ropa.write" } as const,
    handler: async (ctx: Ctx<undefined>) => {
      if (!ctx.permissions.has("evidence.write")) throw new ForbiddenError();
      const row = await requireAi(ctx);
      const evidenceId = z.uuid().safeParse(ctx.params.evidenceId);
      if (!evidenceId.success) throw new ApiError(404, "NOT_FOUND", "That document is not attached to this AI system.");
      // The artefact stays (D-042).
      const { data, error } = await ctx.supabase
        .from("evidence_links")
        .delete()
        .eq("organization_id", ctx.organizationId)
        .eq("evidence_id", evidenceId.data)
        .eq("linked_entity_type", "ai_system")
        .eq("linked_entity_id", row.id)
        .select("id");
      if (error) writeError(error);
      if (!data || data.length === 0) throw new ApiError(404, "NOT_FOUND", "That document is not attached to this AI system.");
      return ok(await detail(ctx, row.id), ctx.request);
    },
  },
};
