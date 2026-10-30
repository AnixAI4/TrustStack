import "server-only";
import {
  canTransition,
  CLOSING_REVIEW_STATUSES,
  CLOSURE_REFUSAL_MESSAGE,
  closureDecision,
  erasureCounts,
  RETENTION_CLOSURE_REFUSAL_MESSAGE,
  ForbiddenError,
  GAP_ACTION_STATUS_LABEL,
  GAP_ACTION_STATUSES,
  isCalendarDate,
  opensGap,
  type GapActionStatus,
  type ProcessorErasureAnswer,
} from "@truststack/core";
import { z } from "zod";
import { ApiError, rpcError, type TenantContext } from "@/lib/api/guard";
import { ok } from "@/lib/api/envelope";
import { requireAssessment } from "@/lib/assessments/routes";
import { mapWriteError } from "@/lib/evidence/shape";
import type { AppSupabaseClient } from "@/lib/supabase/server";
import { ACTION_COLUMNS, activeMembers, evidenceByAction, readGaps, type ActionRow, type Member } from "./shape";

/**
 * The gap register and its remediation actions (Slice 6), nested under
 * `/organizations/{id}/assessments/{assessmentId}/…` like every assessment
 * route (D-035): both ids filter every query, so a foreign id is a 404.
 *
 * A gap is DERIVED. Nothing here writes one: generation is one SECURITY
 * DEFINER RPC that takes two ids and derives every row in SQL from the stored
 * adjusted scores, and no user role holds a write grant on `assessment_gaps`.
 * What people edit is the ACTION — owner, due date, status, notes — and the
 * database decides whether an action may close (D-056).
 */

const FINALISED = "finalised";

export const actionPatchBody = z
  .object({
    title: z.string().trim().min(1).max(500).optional(),
    ownerUserId: z.uuid().nullable().optional(),
    ownerRole: z.string().trim().max(200).nullable().optional(),
    status: z.enum(GAP_ACTION_STATUSES).optional(),
    // A calendar date, stored as given — never a timestamp, never computed at read time (D-055).
    dueDate: z
      .string()
      .refine(isCalendarDate, "must be a calendar date, YYYY-MM-DD")
      .nullable()
      .optional(),
    notes: z.string().trim().max(4000).nullable().optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, "Nothing to change.");

export interface GapCounts {
  gapCount: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  supersededCount: number;
}

export function countsOf(gaps: readonly { state: string; severity: string }[]): GapCounts {
  const open = gaps.filter((g) => g.state === "open");
  const of = (severity: string) => open.filter((g) => g.severity === severity).length;
  return {
    gapCount: open.length,
    critical: of("critical"),
    high: of("high"),
    medium: of("medium"),
    low: of("low"),
    supersededCount: gaps.length - open.length,
  };
}

/**
 * Do the stored gaps still match the current answers? The register is
 * regenerated on request, not on every answer, so between the two it can be
 * out of date — and the UI must say so rather than present it as current.
 */
async function registerIsStale(
  supabase: AppSupabaseClient,
  organizationId: string,
  assessmentId: string,
  gaps: readonly { state: string; questionCode: string; adjustedScore: number }[],
): Promise<{ stale: boolean; answeredCount: number }> {
  const { data, error } = await supabase
    .from("assessment_responses")
    .select("question_code, applicability_decision, adjusted_score")
    .eq("organization_id", organizationId)
    .eq("assessment_id", assessmentId);
  if (error) throw error;

  const derived = new Map<string, number>();
  for (const r of data ?? []) {
    if (r.applicability_decision === "applicable" && r.adjusted_score !== null && opensGap(r.adjusted_score)) {
      derived.set(r.question_code, r.adjusted_score);
    }
  }
  const stored = new Map(gaps.filter((g) => g.state === "open").map((g) => [g.questionCode, g.adjustedScore]));
  const same = derived.size === stored.size && [...derived].every(([code, adjusted]) => stored.get(code) === adjusted);
  return { stale: !same, answeredCount: (data ?? []).length };
}

/** Both ids, always — an Org B gap or action id under an Org A path is a 404, never data. */
async function requireAction(ctx: TenantContext<unknown, unknown>, assessmentId: string): Promise<ActionRow> {
  const gapId = z.uuid().safeParse(ctx.params.gapId);
  const actionId = z.uuid().safeParse(ctx.params.actionId);
  if (!gapId.success || !actionId.success) throw new ApiError(404, "NOT_FOUND", "Action not found.");

  const { data: gap, error: gError } = await ctx.supabase
    .from("assessment_gaps")
    .select("id")
    .eq("id", gapId.data)
    .eq("organization_id", ctx.organizationId)
    .eq("assessment_id", assessmentId)
    .maybeSingle();
  if (gError) throw gError;
  if (!gap) throw new ApiError(404, "NOT_FOUND", "Action not found.");

  const { data, error } = await ctx.supabase
    .from("gap_actions")
    .select(ACTION_COLUMNS)
    .eq("id", actionId.data)
    .eq("organization_id", ctx.organizationId)
    .eq("gap_id", gap.id)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new ApiError(404, "NOT_FOUND", "Action not found.");
  return data as ActionRow;
}

/**
 * One assessment's whole register — its gaps, their actions, the counts and
 * whether it is out of date. The gap route and the dashboard (Slice 8) both
 * read through here.
 */
export async function readGapRegister(
  supabase: AppSupabaseClient,
  organizationId: string,
  assessment: { id: string; status: string },
  members: readonly Member[],
) {
  const register = await readGaps(supabase, organizationId, assessment.id, members);
  const frozen = assessment.status === FINALISED;
  const { stale, answeredCount } = await registerIsStale(supabase, organizationId, assessment.id, register);
  return {
    /** A finalised assessment's gaps were generated with its score and cannot move (D-058). */
    frozen,
    /** True when the answers have changed since the register was generated. Never true once frozen. */
    stale: !frozen && stale,
    answeredCount,
    counts: countsOf(register),
    gaps: register,
  };
}

export const gaps = {
  list: {
    options: { auth: "required", tenant: "fromParam", permission: "gap.read" } as const,
    handler: async (ctx: TenantContext<undefined, undefined>) => {
      const { supabase, organizationId, request, permissions } = ctx;
      const assessment = await requireAssessment(ctx as TenantContext<unknown, unknown>, ctx.params.assessmentId ?? "");

      const members = await activeMembers(supabase, organizationId);
      const register = await readGapRegister(supabase, organizationId, assessment, members);

      return ok(
        {
          assessmentId: assessment.id,
          status: assessment.status,
          ...register,
          // Who an action can be assigned to — only for those who can assign.
          members: permissions.has("gap.write") ? members : [],
        },
        request,
      );
    },
  },

  generate: {
    options: { auth: "required", tenant: "fromParam", permission: "gap.write" } as const,
    handler: async (ctx: TenantContext<undefined, undefined>) => {
      const { supabase, organizationId, request } = ctx;
      const assessment = await requireAssessment(ctx as TenantContext<unknown, unknown>, ctx.params.assessmentId ?? "");

      // The RPC refuses this too; failing here gives the same message without a round trip.
      if (assessment.status === FINALISED) {
        throw new ApiError(409, "CONFLICT", "This assessment is finalised — its gap register is frozen with its score.");
      }

      // Two ids and nothing else. Every gap is derived inside the RPC, in SQL,
      // from the stored adjusted scores — there is no severity, priority or
      // finding for a caller to send, and so none to forge.
      const { data, error } = await supabase.rpc("generate_assessment_gaps", {
        p_organization_id: organizationId,
        p_assessment_id: assessment.id,
      });
      if (error) throw rpcError(error) ?? error;

      const result = (data ?? {}) as Record<string, number>;
      return ok(
        {
          assessmentId: assessment.id,
          counts: {
            gapCount: result.gapCount ?? 0,
            critical: result.critical ?? 0,
            high: result.high ?? 0,
            medium: result.medium ?? 0,
            low: result.low ?? 0,
            supersededCount: result.supersededCount ?? 0,
          } satisfies GapCounts,
          changes: {
            opened: result.opened ?? 0,
            superseded: result.superseded ?? 0,
            removed: result.removed ?? 0,
          },
        },
        request,
      );
    },
  },

  updateAction: {
    options: { auth: "required", tenant: "fromParam", permission: "gap.write", body: actionPatchBody } as const,
    handler: async (ctx: TenantContext<z.infer<typeof actionPatchBody>, undefined>) => {
      const { supabase, organizationId, request } = ctx;
      const assessment = await requireAssessment(ctx as TenantContext<unknown, unknown>, ctx.params.assessmentId ?? "");
      const action = await requireAction(ctx as TenantContext<unknown, unknown>, assessment.id);
      await applyActionUpdate(ctx, action);

      const members = await activeMembers(supabase, organizationId);
      // `requireAction` read it by `gap_id`, so it is an assessment action.
      const [gap] = await readGaps(supabase, organizationId, assessment.id, members, action.gap_id!);
      return ok({ gap }, request);
    },
  },

  unlinkEvidence: {
    options: { auth: "required", tenant: "fromParam", permission: "gap.write" } as const,
    handler: async (ctx: TenantContext<undefined, undefined>) => {
      const { supabase, organizationId, request } = ctx;
      const assessment = await requireAssessment(ctx as TenantContext<unknown, unknown>, ctx.params.assessmentId ?? "");
      const action = await requireAction(ctx as TenantContext<unknown, unknown>, assessment.id);
      await detachActionEvidence(ctx as TenantContext<unknown, unknown>, action);

      const members = await activeMembers(supabase, organizationId);
      const [gap] = await readGaps(supabase, organizationId, assessment.id, members, action.gap_id!);
      return ok({ gap }, request);
    },
  },
};

/**
 * One action edit — owner, due date, status, notes — for ANY action, whose
 * parent is an assessment gap or a ROPA gap (D-060: one action table, one
 * workflow, one closing rule). The caller has already found the action under
 * both ids.
 */
export async function applyActionUpdate(
  ctx: TenantContext<z.infer<typeof actionPatchBody>, undefined>,
  action: ActionRow,
): Promise<void> {
  const { supabase, organizationId, body, user, permissions } = ctx;
  const current = action.status as GapActionStatus;
  const next = body.status ?? current;

  // The database enforces every rule below by trigger and CHECK; they are
  // repeated here only so the caller gets a specific message.
  if (current === "closed" && next === "closed") {
    throw new ApiError(409, "CONFLICT", "This action is closed — reopen it to change it.");
  }
  if (next !== current && !canTransition(current, next)) {
    throw new ApiError(
      409,
      "CONFLICT",
      `An action that is ${GAP_ACTION_STATUS_LABEL[current]} cannot move to ${GAP_ACTION_STATUS_LABEL[next]}.`,
    );
  }

  const members = await activeMembers(supabase, organizationId);
  const ownerUserId = body.ownerUserId === undefined ? action.owner_user_id : body.ownerUserId;
  if (body.ownerUserId && !members.some((m) => m.userId === body.ownerUserId)) {
    throw new ApiError(422, "VALIDATION_ERROR", "The owner must be an active member of this organisation.", [
      { field: "ownerUserId", issue: "not an active member" },
    ]);
  }

  if (next === "closed" && current !== "closed") {
    const evidence = (await evidenceByAction(supabase, organizationId, [action.id])).get(action.id) ?? [];
    const retention = action.retention_schedule_id;
    const decision = closureDecision({
      ownerUserId,
      closedByUserId: user.id,
      closerCanReview: permissions.has("evidence.review"),
      hasAcceptedEvidence: evidence.some((e) =>
        (CLOSING_REVIEW_STATUSES as readonly string[]).includes(e.review_status),
      ),
      // Slice 10 Stage 5: a retention schedule's action may close on the erasure.
      hasErasureByAnother: retention === null ? false : await erasureByAnother(supabase, organizationId, retention, ownerUserId),
    });
    if (!decision.allowed) {
      throw new ApiError(
        409,
        "CONFLICT",
        retention !== null && decision.reason === "no_evidence_or_reviewer" ? RETENTION_CLOSURE_REFUSAL_MESSAGE : CLOSURE_REFUSAL_MESSAGE[decision.reason],
      );
    }
  }

  // Only the editable columns: closed_at, closed_by, closure_basis and
  // updated_by have no user grant and are stamped by the database.
  const change = {
    ...(body.title === undefined ? {} : { title: body.title }),
    ...(body.ownerUserId === undefined ? {} : { owner_user_id: body.ownerUserId }),
    ...(body.ownerRole === undefined ? {} : { owner_role: body.ownerRole || null }),
    ...(body.status === undefined ? {} : { status: body.status }),
    ...(body.dueDate === undefined ? {} : { due_date: body.dueDate }),
    ...(body.notes === undefined ? {} : { notes: body.notes || null }),
  };
  const { error } = await supabase
    .from("gap_actions")
    .update(change)
    .eq("id", action.id)
    .eq("organization_id", organizationId)
    .select("id")
    .single();
  if (error) mapWriteError(error, "Action not found.");
}

/**
 * Is an erasure recorded on this schedule for its current cycle (on or after
 * the day its clock started, or any when none has) by someone who is not the
 * action's owner — one that COUNTS: the processors told or none held it
 * (s.8(7)(b)), and not marked as recorded in error (D-096)? The trigger's rule,
 * read as the caller, for the message.
 */
async function erasureByAnother(
  supabase: AppSupabaseClient,
  organizationId: string,
  scheduleId: string,
  ownerUserId: string | null,
): Promise<boolean> {
  const [schedule, erasures] = await Promise.all([
    supabase.from("retention_schedules").select("starts_on").eq("organization_id", organizationId).eq("id", scheduleId).maybeSingle(),
    supabase
      .from("retention_erasures")
      .select("id, erased_on, processors_told, recorded_by")
      .eq("organization_id", organizationId)
      .eq("retention_schedule_id", scheduleId),
  ]);
  if (schedule.error) throw schedule.error;
  if (erasures.error) throw erasures.error;
  const ids = (erasures.data ?? []).map((e) => e.id);
  const voids =
    ids.length === 0
      ? { data: [] as { retention_erasure_id: string }[], error: null }
      : await supabase.from("retention_erasure_voids").select("retention_erasure_id").eq("organization_id", organizationId).in("retention_erasure_id", ids);
  if (voids.error) throw voids.error;
  const voided = new Set((voids.data ?? []).map((v) => v.retention_erasure_id));
  const startsOn = schedule.data?.starts_on ?? null;
  return (erasures.data ?? []).some(
    (e) =>
      (startsOn === null || e.erased_on >= startsOn) &&
      e.recorded_by !== ownerUserId &&
      erasureCounts({ processorsTold: e.processors_told as ProcessorErasureAnswer, voided: voided.has(e.id) }),
  );
}

/** Detach one artefact from ANY action. The artefact itself stays (D-042); no score moves. */
export async function detachActionEvidence(ctx: TenantContext<unknown, unknown>, action: ActionRow): Promise<void> {
  const { supabase, organizationId, permissions } = ctx;
  // Detaching evidence is an evidence write as well as work on the action.
  if (!permissions.has("evidence.write")) throw new ForbiddenError();
  const evidenceId = z.uuid().safeParse(ctx.params.evidenceId);
  if (!evidenceId.success) throw new ApiError(404, "NOT_FOUND", "That evidence is not attached to this action.");

  if (action.status === "closed") {
    throw new ApiError(409, "CONFLICT", "This action is closed — reopen it before detaching its evidence.");
  }

  // The link's delete trigger knows an action from an answer: detaching here
  // never re-derives any score.
  const { data, error } = await supabase
    .from("evidence_links")
    .delete()
    .eq("organization_id", organizationId)
    .eq("evidence_id", evidenceId.data)
    .eq("linked_entity_type", "gap_action")
    .eq("linked_entity_id", action.id)
    .select("id");
  if (error) mapWriteError(error, "Action not found.");
  if (!data || data.length === 0) {
    throw new ApiError(404, "NOT_FOUND", "That evidence is not attached to this action.");
  }
}
