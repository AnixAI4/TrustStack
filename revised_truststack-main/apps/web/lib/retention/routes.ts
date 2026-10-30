import "server-only";
import {
  countRetention,
  ERASURE_METHODS,
  ERASURE_VOID_REASON_LIMIT,
  ForbiddenError,
  isCalendarDate,
  PROCESSOR_ERASURE_ANSWERS,
  RETENTION_BASES,
  RETENTION_DEEMED_MONTHS,
  RETENTION_EARLIEST_ON,
  RETENTION_MAX_MONTHS,
  RETENTION_NAME_LIMIT,
  RETENTION_NOTE,
  RETENTION_TEXT_LIMIT,
  retentionScheduleProblem,
  THIRD_SCHEDULE_CLASS_LABEL,
  type RetentionBasis,
  type ThirdScheduleClass,
} from "@truststack/core";
import { z } from "zod";
import { ApiError, type TenantContext } from "@/lib/api/guard";
import { ok } from "@/lib/api/envelope";
import { actionPatchBody, applyActionUpdate, detachActionEvidence } from "@/lib/gaps/routes";
import { ACTION_COLUMNS, activeMembers, type ActionRow } from "@/lib/gaps/shape";
import { todayInIndia } from "@/lib/ropa/shape";
import { factsOf, readRetention, SCHEDULE_COLUMNS, type ScheduleRow } from "./shape";

/**
 * The retention register (Slice 10, Stage 5), nested under
 * `/organizations/{id}/retention-schedules…` like every tenant route: both ids
 * filter every query, so a foreign id under this path is a 404, never data.
 *
 * Writes run through RLS (retention.write) and the schedule and erasure
 * triggers, which derive the end and inform-by dates, stamp who recorded each
 * erasure, refuse Rule 8(1)'s period without a recorded Third-Schedule class,
 * and audit every change in the same transaction (D-027). Every rule repeated
 * here is repeated only for the message. One year is Rule 8(3)'s; no AI
 * drafts anything here (pitfall 4, Slice 11).
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
/** `z.enum` wants a literal tuple; core's vocabularies are readonly arrays. */
const oneOf = <T extends string>(values: readonly T[]) => z.enum(values as unknown as [T, ...T[]]);
/** Any whole number here: Rule 8(3)'s floor is checked below, so the person is told the rule, not a range. */
const period = z.number().int().min(1).max(RETENTION_MAX_MONTHS);

const createBody = z
  .object({
    ropaRecordId: z.uuid(),
    basis: oneOf(RETENTION_BASES),
    /** Whole months; at least twelve (Rule 8(3)); thirty-six for the Third-Schedule period. */
    periodMonths: period,
    lawName: text(RETENTION_NAME_LIMIT),
    /** The day the clock started, in India; null while the purpose is still being served. */
    startsOn: date.nullable().optional(),
    notes: text(RETENTION_TEXT_LIMIT),
  })
  .strict();

const updateBody = z
  .object({
    basis: oneOf(RETENTION_BASES).optional(),
    periodMonths: period.optional(),
    lawName: text(RETENTION_NAME_LIMIT),
    startsOn: date.nullable().optional(),
    notes: text(RETENTION_TEXT_LIMIT),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, "Nothing to change.");

const erasureBody = z
  .object({
    erasedOn: date,
    method: oneOf(ERASURE_METHODS),
    methodNote: text(500),
    /** s.8(7)(b): was each processor that held it told to erase it? */
    processorsTold: oneOf(PROCESSOR_ERASURE_ANSWERS),
    /** Rule 8(2), the Third-Schedule period only. */
    principalsInformedOn: date.nullable().optional(),
  })
  .strict();

/** "Recorded in error" (D-096, R4): the reason, in words — never the erased personal data. */
const voidBody = z
  .object({
    reason: z.string().trim().min(1).max(ERASURE_VOID_REASON_LIMIT),
  })
  .strict();

const addActionBody = z
  .object({
    title: z.string().trim().min(1).max(500),
    ownerUserId: z.uuid().nullable().optional(),
    // A calendar date, stored as given (D-055).
    dueDate: date.nullable().optional(),
  })
  .strict();

/** The CHECKs that can fail on a well-formed body, in words. Anything else is a bug and stays a 500. */
const CHECK_MESSAGES: Record<string, string> = {
  retention_schedules_period_floor:
    "Personal data, traffic data and logs are kept for at least one year from the processing (Rule 8(3)) — the period is at least 12 months.",
  retention_schedules_deemed_period: "The Third Schedule sets the period: three years (36 months).",
  retention_schedules_law: "Name the law that requires the data to be kept — and only then.",
  retention_schedules_starts_after_act: "No retention under the Act starts before 11 August 2023.",
  retention_erasures_method_note: "Say how the data was erased.",
  retention_erasures_after_act: "No erasure under the Act is dated before 11 August 2023.",
  retention_erasures_informed_before: "The Data Principals are told before the erasure, not after it.",
  retention_erasure_voids_reason: "Say why the erasure was recorded in error, in up to 500 characters.",
};

function writeError(error: { code?: string; message: string }, notFound = "Schedule not found."): never {
  if (error.code === "23514") {
    const constraint = Object.keys(CHECK_MESSAGES).find((c) => error.message.includes(c));
    throw new ApiError(422, "VALIDATION_ERROR", constraint ? CHECK_MESSAGES[constraint]! : "That breaks a rule of the retention register.");
  }
  // One schedule per processing activity.
  if (error.code === "23505") throw new ApiError(409, "CONFLICT", "This processing activity already has a retention schedule — change that one.");
  // The composite FK: the record is not this organisation's.
  if (error.code === "23503") throw new ApiError(422, "VALIDATION_ERROR", "The processing activity was not found.", [{ field: "ropaRecordId", issue: "not found" }]);
  if (error.code === "PGRST116") throw new ApiError(404, "NOT_FOUND", notFound);
  // TS4xx from the triggers are mapped by the guard (rpcError).
  throw error;
}

const invalid = (message: string, field: string, issue: string): never => {
  throw new ApiError(422, "VALIDATION_ERROR", message, [{ field, issue }]);
};

function scheduleId(ctx: Ctx): string {
  const parsed = z.uuid().safeParse(ctx.params.scheduleId);
  if (!parsed.success) throw new ApiError(404, "NOT_FOUND", "Schedule not found.");
  return parsed.data;
}

async function requireSchedule(ctx: Ctx): Promise<ScheduleRow> {
  const { data, error } = await ctx.supabase
    .from("retention_schedules")
    .select(SCHEDULE_COLUMNS)
    .eq("organization_id", ctx.organizationId)
    .eq("id", scheduleId(ctx))
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new ApiError(404, "NOT_FOUND", "Schedule not found.");
  return data as ScheduleRow;
}

async function requireScheduleAction(ctx: Ctx): Promise<ActionRow> {
  const id = scheduleId(ctx);
  const actionId = z.uuid().safeParse(ctx.params.actionId);
  if (!actionId.success) throw new ApiError(404, "NOT_FOUND", "Action not found.");
  const { data, error } = await ctx.supabase
    .from("gap_actions")
    .select(ACTION_COLUMNS)
    .eq("id", actionId.data)
    .eq("organization_id", ctx.organizationId)
    .eq("retention_schedule_id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new ApiError(404, "NOT_FOUND", "Action not found.");
  return data as ActionRow;
}

/** The organisation's recorded Third-Schedule class — null for every client not in one (Rule 8(1)). */
async function thirdScheduleClass(ctx: Ctx): Promise<ThirdScheduleClass | null> {
  const { data, error } = await ctx.supabase.from("organizations").select("third_schedule_class").eq("id", ctx.organizationId).maybeSingle();
  if (error) throw error;
  return (data?.third_schedule_class ?? null) as ThirdScheduleClass | null;
}

/** What a page needs beside the rows: the note, the class, and the people actions can be assigned to. */
async function context(ctx: Ctx) {
  const cls = await thirdScheduleClass(ctx);
  return {
    note: RETENTION_NOTE,
    /** Null for every organisation not recorded as a Third-Schedule class: Rule 8(1)–(2) do not apply. */
    thirdSchedule: cls === null ? null : { class: cls, label: THIRD_SCHEDULE_CLASS_LABEL[cls] },
  };
}

async function detail(ctx: Ctx, id: string) {
  const members = await activeMembers(ctx.supabase, ctx.organizationId);
  const today = todayInIndia();
  const [[schedule], extra] = await Promise.all([readRetention(ctx.supabase, ctx.organizationId, members, today, id), context(ctx)]);
  if (!schedule) throw new ApiError(404, "NOT_FOUND", "Schedule not found.");
  return { today, schedule, members, ...extra };
}

/** The messages the database would give, earlier and in words. */
function checkSchedule(
  s: { basis: RetentionBasis; periodMonths: number; lawName: string | null; startsOn: string | null },
  cls: ThirdScheduleClass | null,
  today: string,
) {
  const problem = retentionScheduleProblem({ ...s, thirdScheduleClass: cls });
  if (problem) invalid(problem.message, problem.field, "breaks a rule");
  if (s.startsOn !== null && s.startsOn > today) invalid("A date in the register cannot be in the future.", "startsOn", "in the future");
  if (s.startsOn !== null && s.startsOn < RETENTION_EARLIEST_ON) invalid(CHECK_MESSAGES.retention_schedules_starts_after_act!, "startsOn", "before the Act");
}

export const retention = {
  list: {
    options: { auth: "required", tenant: "fromParam", permission: "retention.read" } as const,
    handler: async (ctx: Ctx<undefined>) => {
      const members = await activeMembers(ctx.supabase, ctx.organizationId);
      const today = todayInIndia();
      const [schedules, extra] = await Promise.all([readRetention(ctx.supabase, ctx.organizationId, members, today), context(ctx)]);
      return ok(
        {
          organizationId: ctx.organizationId,
          /** The date in India every clock below was read on. */
          today,
          /** Counted in core over the rows above — nothing more (D-069). */
          counts: countRetention(schedules.map(factsOf), today),
          ...extra,
          schedules,
        },
        ctx.request,
      );
    },
  },

  create: {
    options: { auth: "required", tenant: "fromParam", permission: "retention.write", body: createBody } as const,
    handler: async (ctx: Ctx<z.infer<typeof createBody>>) => {
      const { body } = ctx;
      const lawName = body.lawName ?? null;
      const startsOn = body.startsOn ?? null;
      checkSchedule({ basis: body.basis, periodMonths: body.periodMonths, lawName, startsOn }, await thirdScheduleClass(ctx), todayInIndia());
      // Only what a person records: the end date, the inform-by date and every
      // stamp are the database's (users hold no grant on them).
      const { data, error } = await ctx.supabase
        .from("retention_schedules")
        .insert({
          organization_id: ctx.organizationId,
          ropa_record_id: body.ropaRecordId,
          basis: body.basis,
          period_months: body.periodMonths,
          law_name: lawName,
          starts_on: startsOn,
          notes: body.notes ?? null,
        } as never)
        .select("id")
        .single();
      if (error) writeError(error);
      return ok(await detail(ctx, data.id), ctx.request, { status: 201 });
    },
  },

  read: {
    options: { auth: "required", tenant: "fromParam", permission: "retention.read" } as const,
    handler: async (ctx: Ctx<undefined>) => ok(await detail(ctx, scheduleId(ctx)), ctx.request),
  },

  update: {
    options: { auth: "required", tenant: "fromParam", permission: "retention.write", body: updateBody } as const,
    handler: async (ctx: Ctx<z.infer<typeof updateBody>>) => {
      const row = await requireSchedule(ctx);
      const { body } = ctx;
      const next = {
        basis: (body.basis ?? row.basis) as RetentionBasis,
        // Moving to the Third-Schedule period takes its fixed three years with it.
        periodMonths: body.periodMonths ?? (body.basis === "deemed_inactivity" ? RETENTION_DEEMED_MONTHS : row.period_months),
        lawName: body.lawName === undefined ? (body.basis && body.basis !== "legal_requirement" ? null : row.law_name) : body.lawName,
        startsOn: body.startsOn === undefined ? row.starts_on : body.startsOn,
      };
      checkSchedule(next, await thirdScheduleClass(ctx), todayInIndia());
      const { error } = await ctx.supabase
        .from("retention_schedules")
        .update({
          basis: next.basis,
          period_months: next.periodMonths,
          law_name: next.lawName,
          starts_on: next.startsOn,
          ...(body.notes === undefined ? {} : { notes: body.notes }),
        })
        .eq("organization_id", ctx.organizationId)
        .eq("id", row.id)
        .select("id")
        .single();
      if (error) writeError(error);
      return ok(await detail(ctx, row.id), ctx.request);
    },
  },

  recordErasure: {
    options: { auth: "required", tenant: "fromParam", permission: "retention.write", body: erasureBody } as const,
    handler: async (ctx: Ctx<z.infer<typeof erasureBody>>) => {
      const row = await requireSchedule(ctx);
      const { body } = ctx;
      const today = todayInIndia();
      const informed = body.principalsInformedOn ?? null;
      if (body.erasedOn > today || (informed !== null && informed > today)) invalid("A date in the register cannot be in the future.", "erasedOn", "in the future");
      if (body.erasedOn < RETENTION_EARLIEST_ON) invalid(CHECK_MESSAGES.retention_erasures_after_act!, "erasedOn", "before the Act");
      if (body.method === "other" && !body.methodNote) invalid(CHECK_MESSAGES.retention_erasures_method_note!, "methodNote", "required");
      const deemed = row.basis === "deemed_inactivity";
      if (deemed && informed === null) {
        invalid("Record the day the Data Principals were told, at least 48 hours before the erasure (Rule 8(2)).", "principalsInformedOn", "required");
      }
      if (!deemed && informed !== null) {
        invalid("The 48-hour notice of Rule 8(2) applies only under the Third-Schedule period.", "principalsInformedOn", "only for the Third-Schedule period");
      }
      if (informed !== null && informed > body.erasedOn) invalid(CHECK_MESSAGES.retention_erasures_informed_before!, "principalsInformedOn", "after the erasure");
      // Who recorded it, and when, are the database's. Never changed afterwards.
      const { error } = await ctx.supabase.from("retention_erasures").insert({
        organization_id: ctx.organizationId,
        retention_schedule_id: row.id,
        erased_on: body.erasedOn,
        method: body.method,
        method_note: body.methodNote ?? null,
        processors_told: body.processorsTold,
        principals_informed_on: informed,
      } as never);
      if (error) writeError(error);
      return ok(await detail(ctx, row.id), ctx.request, { status: 201 });
    },
  },

  /**
   * Mark an erasure as recorded in error (D-096, R4): once, with a reason, by
   * someone other than the person who recorded it. The erasure stays — struck
   * through — and no longer counts: the schedule may be overdue again. An
   * action already closed on it stays closed (its closure is in the audit log).
   */
  voidErasure: {
    options: { auth: "required", tenant: "fromParam", permission: "retention.write", body: voidBody } as const,
    handler: async (ctx: Ctx<z.infer<typeof voidBody>>) => {
      const row = await requireSchedule(ctx);
      const erasureId = z.uuid().safeParse(ctx.params.erasureId);
      if (!erasureId.success) throw new ApiError(404, "NOT_FOUND", "Erasure not found.");
      const { data: erasure, error: readError } = await ctx.supabase
        .from("retention_erasures")
        .select("id, recorded_by")
        .eq("organization_id", ctx.organizationId)
        .eq("retention_schedule_id", row.id)
        .eq("id", erasureId.data)
        .maybeSingle();
      if (readError) throw readError;
      if (!erasure) throw new ApiError(404, "NOT_FOUND", "Erasure not found.");
      // The trigger's rule, earlier and in words: two people (D-056's rule).
      if (erasure.recorded_by === ctx.user.id) {
        throw new ApiError(409, "CONFLICT", "Someone other than the person who recorded this erasure marks it as recorded in error.");
      }
      // Who marked it, and when, are the database's. Never changed afterwards.
      const { error } = await ctx.supabase.from("retention_erasure_voids").insert({
        organization_id: ctx.organizationId,
        retention_erasure_id: erasure.id,
        reason: ctx.body.reason,
      } as never);
      if (error) {
        if (error.code === "23505") throw new ApiError(409, "CONFLICT", "This erasure is already marked as recorded in error.");
        writeError(error);
      }
      return ok(await detail(ctx, row.id), ctx.request, { status: 201 });
    },
  },

  addAction: {
    options: { auth: "required", tenant: "fromParam", permission: "retention.write", body: addActionBody } as const,
    handler: async (ctx: Ctx<z.infer<typeof addActionBody>>) => {
      // Remediation is work on the ONE action table (D-067): it needs gap.write too.
      if (!ctx.permissions.has("gap.write")) throw new ForbiddenError();
      const row = await requireSchedule(ctx);
      const { error } = await ctx.supabase.rpc("add_retention_action", {
        p_organization_id: ctx.organizationId,
        p_retention_schedule_id: row.id,
        p_title: ctx.body.title,
        // The generated types mark nullable RPC arguments as required strings.
        p_owner_user_id: (ctx.body.ownerUserId ?? null) as unknown as string,
        p_due_date: (ctx.body.dueDate ?? null) as unknown as string,
      });
      if (error) throw error;
      return ok(await detail(ctx, row.id), ctx.request, { status: 201 });
    },
  },

  updateAction: {
    options: { auth: "required", tenant: "fromParam", permission: "gap.write", body: actionPatchBody } as const,
    handler: async (ctx: TenantContext<z.infer<typeof actionPatchBody>, undefined>) => {
      const action = await requireScheduleAction(ctx as Ctx);
      // The SAME update as every other action: one workflow, one closing rule (D-056).
      await applyActionUpdate(ctx, action);
      return ok(await detail(ctx as Ctx, action.retention_schedule_id!), ctx.request);
    },
  },

  unlinkActionEvidence: {
    options: { auth: "required", tenant: "fromParam", permission: "gap.write" } as const,
    handler: async (ctx: Ctx<undefined>) => {
      const action = await requireScheduleAction(ctx);
      await detachActionEvidence(ctx, action);
      return ok(await detail(ctx, action.retention_schedule_id!), ctx.request);
    },
  },

  unlinkEvidence: {
    options: { auth: "required", tenant: "fromParam", permission: "retention.write" } as const,
    handler: async (ctx: Ctx<undefined>) => {
      if (!ctx.permissions.has("evidence.write")) throw new ForbiddenError();
      const row = await requireSchedule(ctx);
      const evidenceId = z.uuid().safeParse(ctx.params.evidenceId);
      if (!evidenceId.success) throw new ApiError(404, "NOT_FOUND", "That document is not attached to this schedule.");
      // The artefact stays (D-042); nothing is re-derived.
      const { data, error } = await ctx.supabase
        .from("evidence_links")
        .delete()
        .eq("organization_id", ctx.organizationId)
        .eq("evidence_id", evidenceId.data)
        .eq("linked_entity_type", "retention_schedule")
        .eq("linked_entity_id", row.id)
        .select("id");
      if (error) writeError(error);
      if (!data || data.length === 0) throw new ApiError(404, "NOT_FOUND", "That document is not attached to this schedule.");
      return ok(await detail(ctx, row.id), ctx.request);
    },
  },
};
