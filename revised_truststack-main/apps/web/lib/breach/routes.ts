import "server-only";
import {
  BREACH_CLOCK_NOTE,
  BREACH_NATURES,
  BREACH_REF_LIMIT,
  BREACH_SEVERITIES,
  BREACH_STATUS_LABEL,
  BREACH_STATUSES,
  BREACH_TEXT_LIMIT,
  BREACH_TITLE_LIMIT,
  canBreachTransition,
  countBreaches,
  ForbiddenError,
  isCalendarDate,
  isInstant,
  type BreachStatus,
} from "@truststack/core";
import { z } from "zod";
import { ApiError, type TenantContext } from "@/lib/api/guard";
import { ok } from "@/lib/api/envelope";
import { actionPatchBody, applyActionUpdate, detachActionEvidence } from "@/lib/gaps/routes";
import { ACTION_COLUMNS, activeMembers, type ActionRow } from "@/lib/gaps/shape";
import { BREACH_COLUMNS, clockFactsOf, readBreaches, type BreachRow } from "./shape";

/**
 * The breach register (Slice 10, Stage 1), nested under
 * `/organizations/{id}/breaches…` like every tenant route: both ids filter
 * every query, so a foreign id under this path is a 404, never data.
 *
 * Writes run through RLS (breach.write) and the incident trigger, which
 * derives the code and the Board report's due time, stamps who recorded each
 * intimation, enforces the lifecycle and audits every change in the same
 * transaction (D-027). Every rule repeated here is repeated only for the
 * message. Seventy-two hours is the Rules'; the alerts are TrustStack's
 * (pitfall 1). No AI drafts anything here (pitfall 4, Slice 11).
 */

type Ctx<B = unknown> = TenantContext<B, unknown>;

/** Five minutes of clock skew between a laptop and the server; the database allows the same. */
const SKEW_MS = 5 * 60_000;

const instant = z.string().refine(isInstant, "must be a date and time with an offset, e.g. 2026-10-12T14:05:00+05:30");
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

const narrative = {
  title: z.string().trim().min(1).max(BREACH_TITLE_LIMIT),
  description: text(BREACH_TEXT_LIMIT),
  nature: oneOf(BREACH_NATURES),
  severity: oneOf(BREACH_SEVERITIES),
  occurredAt: instant.nullable().optional(),
  location: text(500),
  principalsAffected: z.number().int().min(0).max(2_147_483_647).nullable().optional(),
  dataCategories: text(2000),
  likelyImpact: text(BREACH_TEXT_LIMIT),
  containmentMeasures: text(BREACH_TEXT_LIMIT),
};

const createBody = z
  .object({
    ...narrative,
    /** When the organisation became aware — the clock starts here and cannot be edited afterwards. */
    awareAt: instant,
  })
  .strict();

const updateBody = z
  .object({
    title: narrative.title.optional(),
    description: narrative.description,
    nature: narrative.nature.optional(),
    severity: narrative.severity.optional(),
    occurredAt: narrative.occurredAt,
    location: narrative.location,
    principalsAffected: narrative.principalsAffected,
    dataCategories: narrative.dataCategories,
    likelyImpact: narrative.likelyImpact,
    containmentMeasures: narrative.containmentMeasures,
    status: oneOf(BREACH_STATUSES).optional(),
    /** Required with `status: "dismissed"`. */
    dismissalReason: text(2000),
    /** Rule 7(2)(a): the Board told without delay. */
    boardInitialAt: instant.optional(),
    /** Rule 7(2)(b): the detailed report. */
    boardReport: z.object({ at: instant, reference: text(BREACH_REF_LIMIT) }).strict().optional(),
    /** Rule 7(2)(b): "such longer period as the Board may allow on a request made in writing". */
    boardExtension: z.object({ until: instant, reference: z.string().trim().min(1).max(BREACH_REF_LIMIT) }).strict().optional(),
    /** Rule 7(1): each affected Data Principal. */
    principals: z.object({ at: instant, method: z.string().trim().min(1).max(500) }).strict().optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, "Nothing to change.");

const addActionBody = z
  .object({
    title: z.string().trim().min(1).max(500),
    ownerUserId: z.uuid().nullable().optional(),
    // A calendar date, stored as given (D-055).
    dueDate: z.string().refine(isCalendarDate, "must be a calendar date, YYYY-MM-DD").nullable().optional(),
  })
  .strict();

/** The CHECKs that can fail on a well-formed body, in words. Anything else is a bug and stays a 500. */
const CHECK_MESSAGES: Record<string, string> = {
  breach_incidents_occurred_before_aware: "A breach cannot have occurred after the organisation became aware of it.",
  breach_incidents_intimations_after_aware: "An intimation cannot be dated before the organisation became aware of the breach.",
  breach_incidents_extension_longer: "An extension from the Board must run beyond the seventy-two hours.",
  breach_incidents_aware_after_act: "A DPDP breach is one the organisation became aware of on or after 11 August 2023.",
  breach_incidents_dismissed_has_reason: "Say why this is not a personal data breach.",
  breach_incidents_closed_is_intimated:
    "Record the report to the Board and the intimation to the affected Data Principals before closing this breach.",
};

function writeError(error: { code?: string; message: string }, notFound = "Breach not found."): never {
  if (error.code === "23514") {
    const constraint = Object.keys(CHECK_MESSAGES).find((c) => error.message.includes(c));
    throw new ApiError(422, "VALIDATION_ERROR", constraint ? CHECK_MESSAGES[constraint]! : "That breaks a rule of the breach register.");
  }
  if (error.code === "PGRST116") throw new ApiError(404, "NOT_FOUND", notFound);
  // TS4xx from the trigger are mapped by the guard (rpcError).
  throw error;
}

function breachId(ctx: Ctx): string {
  const parsed = z.uuid().safeParse(ctx.params.breachId);
  if (!parsed.success) throw new ApiError(404, "NOT_FOUND", "Breach not found.");
  return parsed.data;
}

async function requireBreach(ctx: Ctx): Promise<BreachRow> {
  const { data, error } = await ctx.supabase
    .from("breach_incidents")
    .select(BREACH_COLUMNS)
    .eq("organization_id", ctx.organizationId)
    .eq("id", breachId(ctx))
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new ApiError(404, "NOT_FOUND", "Breach not found.");
  return data as BreachRow;
}

async function requireBreachAction(ctx: Ctx): Promise<ActionRow> {
  const id = breachId(ctx);
  const actionId = z.uuid().safeParse(ctx.params.actionId);
  if (!actionId.success) throw new ApiError(404, "NOT_FOUND", "Action not found.");
  const { data, error } = await ctx.supabase
    .from("gap_actions")
    .select(ACTION_COLUMNS)
    .eq("id", actionId.data)
    .eq("organization_id", ctx.organizationId)
    .eq("breach_incident_id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new ApiError(404, "NOT_FOUND", "Action not found.");
  return data as ActionRow;
}

/** One incident as the detail page shows it, with the people an action can be assigned to. */
async function detail(ctx: Ctx, id: string) {
  const members = await activeMembers(ctx.supabase, ctx.organizationId);
  const now = new Date().toISOString();
  const [incident] = await readBreaches(ctx.supabase, ctx.organizationId, members, now, id);
  if (!incident) throw new ApiError(404, "NOT_FOUND", "Breach not found.");
  return { now, incident, members, clockNote: BREACH_CLOCK_NOTE };
}

const ms = (iso: string) => Date.parse(iso);

/** The messages the database would give, earlier and in words. */
function checkTimeline(row: BreachRow, body: z.infer<typeof updateBody>) {
  const now = Date.now();
  const aware = ms(row.aware_at);
  const times: [string, string | undefined][] = [
    ["occurredAt", body.occurredAt ?? undefined],
    ["boardInitialAt", body.boardInitialAt],
    ["boardReport.at", body.boardReport?.at],
    ["principals.at", body.principals?.at],
  ];
  for (const [field, t] of times) {
    if (t === undefined) continue;
    if (ms(t) > now + SKEW_MS) throw new ApiError(422, "VALIDATION_ERROR", "A breach time cannot be in the future.", [{ field, issue: "in the future" }]);
    if (field !== "occurredAt" && ms(t) < aware) {
      throw new ApiError(422, "VALIDATION_ERROR", CHECK_MESSAGES.breach_incidents_intimations_after_aware!, [{ field, issue: "before awareness" }]);
    }
  }
  if (body.occurredAt && ms(body.occurredAt) > aware) {
    throw new ApiError(422, "VALIDATION_ERROR", CHECK_MESSAGES.breach_incidents_occurred_before_aware!, [{ field: "occurredAt", issue: "after awareness" }]);
  }
  if (body.boardExtension && ms(body.boardExtension.until) <= aware + 72 * 3_600_000) {
    throw new ApiError(422, "VALIDATION_ERROR", CHECK_MESSAGES.breach_incidents_extension_longer!, [{ field: "boardExtension.until", issue: "not beyond 72 hours" }]);
  }

  const current = row.status as BreachStatus;
  const next = body.status ?? current;
  const recordsSomething = Object.keys(body).some((k) => k !== "status" && k !== "dismissalReason");
  if ((current === "closed" || current === "dismissed") && next === current && (recordsSomething || body.dismissalReason !== undefined)) {
    throw new ApiError(409, "CONFLICT", `This breach is ${BREACH_STATUS_LABEL[current].toLowerCase()} — reopen it to change it.`);
  }
  if (next !== current && !canBreachTransition(current, next)) {
    throw new ApiError(409, "CONFLICT", `A breach that is ${BREACH_STATUS_LABEL[current]} cannot move to ${BREACH_STATUS_LABEL[next]}.`);
  }
  if (next === "dismissed" && current !== "dismissed" && !body.dismissalReason) {
    throw new ApiError(422, "VALIDATION_ERROR", CHECK_MESSAGES.breach_incidents_dismissed_has_reason!, [{ field: "dismissalReason", issue: "required" }]);
  }
  if (next === "closed" && current !== "closed") {
    const reported = row.board_report_at !== null || body.boardReport !== undefined;
    const intimated = row.principals_intimated_at !== null || body.principals !== undefined;
    if (!reported || !intimated) throw new ApiError(409, "CONFLICT", CHECK_MESSAGES.breach_incidents_closed_is_intimated!);
  }
}

export const breaches = {
  list: {
    options: { auth: "required", tenant: "fromParam", permission: "breach.read" } as const,
    handler: async (ctx: Ctx<undefined>) => {
      const members = await activeMembers(ctx.supabase, ctx.organizationId);
      const now = new Date().toISOString();
      const incidents = await readBreaches(ctx.supabase, ctx.organizationId, members, now);
      return ok(
        {
          organizationId: ctx.organizationId,
          /** The instant every clock below was read at. */
          now,
          /** Counted in core over the rows above — nothing more (D-069). */
          counts: countBreaches(incidents.map(clockFactsOf), now),
          clockNote: BREACH_CLOCK_NOTE,
          incidents,
        },
        ctx.request,
      );
    },
  },

  create: {
    options: { auth: "required", tenant: "fromParam", permission: "breach.write", body: createBody } as const,
    handler: async (ctx: Ctx<z.infer<typeof createBody>>) => {
      const { body } = ctx;
      if (ms(body.awareAt) > Date.now() + SKEW_MS) {
        throw new ApiError(422, "VALIDATION_ERROR", "A breach time cannot be in the future.", [{ field: "awareAt", issue: "in the future" }]);
      }
      if (body.occurredAt && ms(body.occurredAt) > ms(body.awareAt)) {
        throw new ApiError(422, "VALIDATION_ERROR", CHECK_MESSAGES.breach_incidents_occurred_before_aware!, [{ field: "occurredAt", issue: "after awareness" }]);
      }
      // Only what a person records: the code, the due time and every stamp are
      // the database's — users hold no grant on them, so they are not sent at
      // all (the generated Insert type calls them required; the trigger sets them).
      const { data, error } = await ctx.supabase
        .from("breach_incidents")
        .insert({
          organization_id: ctx.organizationId,
          title: body.title,
          description: body.description ?? null,
          nature: body.nature,
          severity: body.severity,
          aware_at: body.awareAt,
          occurred_at: body.occurredAt ?? null,
          location: body.location ?? null,
          principals_affected: body.principalsAffected ?? null,
          data_categories: body.dataCategories ?? null,
          likely_impact: body.likelyImpact ?? null,
          containment_measures: body.containmentMeasures ?? null,
        } as never)
        .select("id")
        .single();
      if (error) writeError(error);
      return ok(await detail(ctx, data.id), ctx.request, { status: 201 });
    },
  },

  read: {
    options: { auth: "required", tenant: "fromParam", permission: "breach.read" } as const,
    handler: async (ctx: Ctx<undefined>) => ok(await detail(ctx, breachId(ctx)), ctx.request),
  },

  update: {
    options: { auth: "required", tenant: "fromParam", permission: "breach.write", body: updateBody } as const,
    handler: async (ctx: Ctx<z.infer<typeof updateBody>>) => {
      const row = await requireBreach(ctx);
      const { body } = ctx;
      checkTimeline(row, body);
      const change = {
        ...(body.title === undefined ? {} : { title: body.title }),
        ...(body.description === undefined ? {} : { description: body.description }),
        ...(body.nature === undefined ? {} : { nature: body.nature }),
        ...(body.severity === undefined ? {} : { severity: body.severity }),
        ...(body.occurredAt === undefined ? {} : { occurred_at: body.occurredAt }),
        ...(body.location === undefined ? {} : { location: body.location }),
        ...(body.principalsAffected === undefined ? {} : { principals_affected: body.principalsAffected }),
        ...(body.dataCategories === undefined ? {} : { data_categories: body.dataCategories }),
        ...(body.likelyImpact === undefined ? {} : { likely_impact: body.likelyImpact }),
        ...(body.containmentMeasures === undefined ? {} : { containment_measures: body.containmentMeasures }),
        ...(body.status === undefined ? {} : { status: body.status }),
        ...(body.status === "dismissed" ? { dismissal_reason: body.dismissalReason ?? null } : {}),
        ...(body.boardInitialAt === undefined ? {} : { board_initial_at: body.boardInitialAt }),
        ...(body.boardReport === undefined ? {} : { board_report_at: body.boardReport.at, board_report_ref: body.boardReport.reference ?? null }),
        ...(body.boardExtension === undefined
          ? {}
          : { board_extension_until: body.boardExtension.until, board_extension_ref: body.boardExtension.reference }),
        ...(body.principals === undefined
          ? {}
          : { principals_intimated_at: body.principals.at, principals_intimation_method: body.principals.method }),
      };
      const { error } = await ctx.supabase
        .from("breach_incidents")
        .update(change)
        .eq("organization_id", ctx.organizationId)
        .eq("id", row.id)
        .select("id")
        .single();
      if (error) writeError(error);
      return ok(await detail(ctx, row.id), ctx.request);
    },
  },

  addAction: {
    options: { auth: "required", tenant: "fromParam", permission: "breach.write", body: addActionBody } as const,
    handler: async (ctx: Ctx<z.infer<typeof addActionBody>>) => {
      // Remediation is work on the ONE action table (D-067): it needs gap.write too.
      if (!ctx.permissions.has("gap.write")) throw new ForbiddenError();
      const row = await requireBreach(ctx);
      const { error } = await ctx.supabase.rpc("add_breach_action", {
        p_organization_id: ctx.organizationId,
        p_breach_incident_id: row.id,
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
      const action = await requireBreachAction(ctx as Ctx);
      // The SAME update as every other action: one workflow, one closing rule (D-056).
      await applyActionUpdate(ctx, action);
      return ok(await detail(ctx as Ctx, action.breach_incident_id!), ctx.request);
    },
  },

  unlinkActionEvidence: {
    options: { auth: "required", tenant: "fromParam", permission: "gap.write" } as const,
    handler: async (ctx: Ctx<undefined>) => {
      const action = await requireBreachAction(ctx);
      await detachActionEvidence(ctx, action);
      return ok(await detail(ctx, action.breach_incident_id!), ctx.request);
    },
  },

  /**
   * DELETE …/breaches/{breachId}/evidence/{evidenceId} — detach a document
   * from the incident itself (Stage 6). The artefact stays (D-042). Refused
   * while the breach is closed or dismissed: the database says "reopen it".
   */
  unlinkEvidence: {
    options: { auth: "required", tenant: "fromParam", permission: "breach.write" } as const,
    handler: async (ctx: Ctx<undefined>) => {
      if (!ctx.permissions.has("evidence.write")) throw new ForbiddenError();
      const row = await requireBreach(ctx);
      const evidenceId = z.uuid().safeParse(ctx.params.evidenceId);
      if (!evidenceId.success) throw new ApiError(404, "NOT_FOUND", "That document is not attached to this breach.");
      const { data, error } = await ctx.supabase
        .from("evidence_links")
        .delete()
        .eq("organization_id", ctx.organizationId)
        .eq("evidence_id", evidenceId.data)
        .eq("linked_entity_type", "breach_incident")
        .eq("linked_entity_id", row.id)
        .select("id");
      if (error) writeError(error);
      if (!data || data.length === 0) throw new ApiError(404, "NOT_FOUND", "That document is not attached to this breach.");
      return ok(await detail(ctx, row.id), ctx.request);
    },
  },
};
