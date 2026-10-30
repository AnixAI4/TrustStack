import "server-only";
import {
  canRightsTransition,
  countRights,
  ForbiddenError,
  isCalendarDate,
  needsIdentity,
  rightsFamily,
  RIGHTS_CAPACITIES,
  RIGHTS_CHANNELS,
  RIGHTS_CLOCK_NOTE,
  RIGHTS_EARLIEST_RECEIVED_ON,
  RIGHTS_KINDS,
  RIGHTS_NAME_LIMIT,
  RIGHTS_OUTCOMES,
  RIGHTS_SHORT_LIMIT,
  RIGHTS_STATUS_LABEL,
  RIGHTS_STATUSES,
  RIGHTS_TEXT_LIMIT,
  type RightsKind,
  type RightsStatus,
} from "@truststack/core";
import { z } from "zod";
import { ApiError, type TenantContext } from "@/lib/api/guard";
import { ok } from "@/lib/api/envelope";
import { actionPatchBody, applyActionUpdate, detachActionEvidence } from "@/lib/gaps/routes";
import { ACTION_COLUMNS, activeMembers, type ActionRow } from "@/lib/gaps/shape";
import { todayInIndia } from "@/lib/ropa/shape";
import { clockFactsOf, readRights, RIGHTS_COLUMNS, type RightsRow } from "./shape";
import { readSharingList } from "./sharing";

/**
 * The rights and grievance register (Slice 10, Stage 2), nested under
 * `/organizations/{id}/rights-requests…` like every tenant route: both ids
 * filter every query, so a foreign id under this path is a 404, never data.
 *
 * STAFF-ENTERED only: a person in the organisation records what a Data
 * Principal asked by email, letter, phone or in person (SLICE_10 decision 3).
 * The public forms come in Stage 3, through their own RPCs.
 *
 * Writes run through RLS (rights.write) and the request trigger, which
 * derives the code and the respond-by date, stamps who recorded the identity
 * check and the response, enforces the lifecycle and audits every change in
 * the same transaction (D-027). Every rule repeated here is repeated only for
 * the message. Ninety days is the Rules'; thirty is TrustStack's (pitfall 1).
 * No AI drafts anything here (pitfall 4, Slice 11).
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
/** `z.enum` wants a literal tuple; core's vocabularies are readonly arrays. */
const oneOf = <T extends string>(values: readonly T[]) => z.enum(values as unknown as [T, ...T[]]);
const email = z
  .string()
  .trim()
  .max(320)
  .nullable()
  .optional()
  .transform((v) => (v === "" ? null : v))
  .refine((v) => v === null || v === undefined || /^[^@\s]+@[^@\s]+$/.test(v), "must be an email address");

const person = {
  channel: oneOf(RIGHTS_CHANNELS),
  requesterName: required(RIGHTS_NAME_LIMIT),
  requesterEmail: email,
  requesterPhone: text(40),
  requesterCapacity: oneOf(RIGHTS_CAPACITIES),
  /** Rule 14(1)(b), (5): an identifier the organisation issued, e.g. an enrolment or customer number. */
  principalIdentifier: text(200),
  summary: required(RIGHTS_TEXT_LIMIT),
  /** A grievance about an earlier request, or a request following one. */
  relatedRequestId: z.uuid().nullable().optional(),
  /** Rule 14(4): a nomination names its nominee. */
  nomineeName: text(RIGHTS_NAME_LIMIT),
  nomineeContact: text(RIGHTS_SHORT_LIMIT),
  nomineeRelationship: text(RIGHTS_NAME_LIMIT),
  ownerUserId: z.uuid().nullable().optional(),
};

const createBody = z
  .object({
    kind: oneOf(RIGHTS_KINDS),
    /** The day it reached the organisation, in India — the ninety days run from here and it cannot be edited afterwards. */
    receivedOn: date,
    ...person,
    requesterCapacity: person.requesterCapacity.optional(),
  })
  .strict();

const updateBody = z
  .object({
    kind: oneOf(RIGHTS_KINDS).optional(),
    channel: person.channel.optional(),
    requesterName: person.requesterName.optional(),
    requesterEmail: person.requesterEmail,
    requesterPhone: person.requesterPhone,
    requesterCapacity: person.requesterCapacity.optional(),
    principalIdentifier: person.principalIdentifier,
    summary: person.summary.optional(),
    relatedRequestId: person.relatedRequestId,
    nomineeName: person.nomineeName,
    nomineeContact: person.nomineeContact,
    nomineeRelationship: person.nomineeRelationship,
    ownerUserId: person.ownerUserId,
    /** Rule 14(1)(b), (2): how the person was identified. Corrected, never removed. */
    identity: z.object({ verifiedOn: date, method: required(RIGHTS_SHORT_LIMIT) }).strict().optional(),
    status: oneOf(RIGHTS_STATUSES).optional(),
    /** Required with `status: "responded"`; anything short of fulfilled says why. */
    response: z
      .object({ outcome: oneOf(RIGHTS_OUTCOMES), respondedOn: date, summary: text(RIGHTS_TEXT_LIMIT) })
      .strict()
      .optional(),
    /** Required with `status: "withdrawn"` or `"void"`. */
    closureReason: text(2000),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, "Nothing to change.");

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
  rights_requests_received_after_act: "A request under the Act is one received on or after 11 August 2023.",
  rights_requests_nominee: "A nomination names its nominee; no other request carries one.",
  rights_requests_related_not_self: "A request cannot be about itself.",
  rights_requests_dates_after_receipt: "Nothing can be dated before the request was received.",
  rights_requests_response_reason: "Say why the request was not fulfilled in full.",
  rights_requests_fulfilled_is_identified: "Record how the person's identity was verified before fulfilling the request.",
  rights_requests_closure_reason: "Say why the request was withdrawn or is void.",
  rights_requests_response_whole: "Record the outcome and the day of the response.",
  rights_requests_email_shape: "The email address is not valid.",
};

function writeError(error: { code?: string; message: string }, notFound = "Request not found."): never {
  if (error.code === "23514") {
    const constraint = Object.keys(CHECK_MESSAGES).find((c) => error.message.includes(c));
    throw new ApiError(422, "VALIDATION_ERROR", constraint ? CHECK_MESSAGES[constraint]! : "That breaks a rule of the rights register.");
  }
  // The composite FK: the related request is not this organisation's.
  if (error.code === "23503") throw new ApiError(422, "VALIDATION_ERROR", "The related request was not found.", [{ field: "relatedRequestId", issue: "not found" }]);
  if (error.code === "PGRST116") throw new ApiError(404, "NOT_FOUND", notFound);
  // TS4xx from the trigger are mapped by the guard (rpcError).
  throw error;
}

function requestId(ctx: Ctx): string {
  const parsed = z.uuid().safeParse(ctx.params.requestId);
  if (!parsed.success) throw new ApiError(404, "NOT_FOUND", "Request not found.");
  return parsed.data;
}

async function requireRequest(ctx: Ctx): Promise<RightsRow> {
  const { data, error } = await ctx.supabase
    .from("rights_requests")
    .select(RIGHTS_COLUMNS)
    .eq("organization_id", ctx.organizationId)
    .eq("id", requestId(ctx))
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new ApiError(404, "NOT_FOUND", "Request not found.");
  return data as RightsRow;
}

async function requireRequestAction(ctx: Ctx): Promise<ActionRow> {
  const id = requestId(ctx);
  const actionId = z.uuid().safeParse(ctx.params.actionId);
  if (!actionId.success) throw new ApiError(404, "NOT_FOUND", "Action not found.");
  const { data, error } = await ctx.supabase
    .from("gap_actions")
    .select(ACTION_COLUMNS)
    .eq("id", actionId.data)
    .eq("organization_id", ctx.organizationId)
    .eq("rights_request_id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new ApiError(404, "NOT_FOUND", "Action not found.");
  return data as ActionRow;
}

/** One request as the detail page shows it, with the people it and its actions can be assigned to. */
async function detail(ctx: Ctx, id: string) {
  const members = await activeMembers(ctx.supabase, ctx.organizationId);
  const today = todayInIndia();
  const [request] = await readRights(ctx.supabase, ctx.organizationId, members, today, id);
  if (!request) throw new ApiError(404, "NOT_FOUND", "Request not found.");
  return { today, request, members, clockNote: RIGHTS_CLOCK_NOTE };
}

const invalid = (message: string, field: string, issue: string): never => {
  throw new ApiError(422, "VALIDATION_ERROR", message, [{ field, issue }]);
};

/** A nomination names its nominee; nothing else carries one — the CHECK's rule, in words. */
function checkNominee(kind: RightsKind, nominee: { name?: string | null; contact?: string | null; relationship?: string | null }) {
  if (kind === "nomination" && !nominee.name) invalid(CHECK_MESSAGES.rights_requests_nominee!, "nomineeName", "required");
  if (kind !== "nomination" && (nominee.name || nominee.contact || nominee.relationship)) {
    invalid(CHECK_MESSAGES.rights_requests_nominee!, "nomineeName", "only for a nomination");
  }
}

/** The messages the database would give, earlier and in words. */
function checkUpdate(row: RightsRow, body: z.infer<typeof updateBody>, today: string) {
  const kind = (body.kind ?? row.kind) as RightsKind;
  if (body.kind && rightsFamily(body.kind) !== rightsFamily(row.kind as RightsKind)) {
    invalid(
      "A grievance cannot become a request to exercise a right, or the other way round — record it anew and void this one.",
      "kind",
      "changes family",
    );
  }
  for (const [field, d] of [
    ["identity.verifiedOn", body.identity?.verifiedOn],
    ["response.respondedOn", body.response?.respondedOn],
  ] as const) {
    if (d === undefined) continue;
    if (d > today) invalid("A date in the register cannot be in the future.", field, "in the future");
    if (d < row.received_on) invalid(CHECK_MESSAGES.rights_requests_dates_after_receipt!, field, "before receipt");
  }
  if (body.relatedRequestId === row.id) invalid(CHECK_MESSAGES.rights_requests_related_not_self!, "relatedRequestId", "itself");

  const current = row.status as RightsStatus;
  const next = body.status ?? current;
  const recordsSomething = Object.keys(body).some((k) => k !== "status");
  if (current !== "open" && next === current && recordsSomething) {
    throw new ApiError(409, "CONFLICT", `This request is ${RIGHTS_STATUS_LABEL[current].toLowerCase()} — reopen it to change it.`);
  }
  if (next !== current && !canRightsTransition(current, next)) {
    throw new ApiError(409, "CONFLICT", `A request that is ${RIGHTS_STATUS_LABEL[current]} cannot move to ${RIGHTS_STATUS_LABEL[next]}.`);
  }
  if ((body.response !== undefined) !== (next === "responded" && current !== "responded")) {
    invalid(
      body.response === undefined ? CHECK_MESSAGES.rights_requests_response_whole! : "A response is recorded by moving the request to Responded.",
      "response",
      body.response === undefined ? "required" : "needs status responded",
    );
  }
  if (body.response) {
    if (body.response.outcome !== "fulfilled" && !body.response.summary) {
      invalid(CHECK_MESSAGES.rights_requests_response_reason!, "response.summary", "required");
    }
    const identified = row.identity_verified_on !== null || body.identity !== undefined;
    if (needsIdentity(kind, body.response.outcome) && !identified) {
      throw new ApiError(409, "CONFLICT", CHECK_MESSAGES.rights_requests_fulfilled_is_identified!);
    }
  }
  if ((next === "withdrawn" || next === "void") && next !== current && !body.closureReason) {
    invalid(CHECK_MESSAGES.rights_requests_closure_reason!, "closureReason", "required");
  }
  if (body.closureReason && !(next === "withdrawn" || next === "void")) {
    invalid("A reason is recorded when the request is withdrawn or void.", "closureReason", "needs status withdrawn or void");
  }
  // The nominee as it will stand after this change.
  if (body.kind !== undefined || body.nomineeName !== undefined || body.nomineeContact !== undefined || body.nomineeRelationship !== undefined) {
    checkNominee(kind, {
      name: body.nomineeName === undefined ? row.nominee_name : body.nomineeName,
      contact: body.nomineeContact === undefined ? row.nominee_contact : body.nomineeContact,
      relationship: body.nomineeRelationship === undefined ? row.nominee_relationship : body.nomineeRelationship,
    });
  }
}

export const rights = {
  list: {
    options: { auth: "required", tenant: "fromParam", permission: "rights.read" } as const,
    handler: async (ctx: Ctx<undefined>) => {
      const members = await activeMembers(ctx.supabase, ctx.organizationId);
      const today = todayInIndia();
      const requests = await readRights(ctx.supabase, ctx.organizationId, members, today);
      return ok(
        {
          organizationId: ctx.organizationId,
          /** The date in India every clock below was read on. */
          today,
          /** Counted in core over the rows above — nothing more (D-069). */
          counts: countRights(requests.map(clockFactsOf), today),
          clockNote: RIGHTS_CLOCK_NOTE,
          requests,
        },
        ctx.request,
      );
    },
  },

  create: {
    options: { auth: "required", tenant: "fromParam", permission: "rights.write", body: createBody } as const,
    handler: async (ctx: Ctx<z.infer<typeof createBody>>) => {
      const { body } = ctx;
      const today = todayInIndia();
      if (body.receivedOn > today) invalid("A date in the register cannot be in the future.", "receivedOn", "in the future");
      if (body.receivedOn < RIGHTS_EARLIEST_RECEIVED_ON) invalid(CHECK_MESSAGES.rights_requests_received_after_act!, "receivedOn", "before the Act");
      checkNominee(body.kind, { name: body.nomineeName, contact: body.nomineeContact, relationship: body.nomineeRelationship });
      // Only what a person records: the code, the respond-by date and every
      // stamp are the database's — users hold no grant on them, so they are
      // not sent at all (the generated Insert type calls them required; the trigger sets them).
      const { data, error } = await ctx.supabase
        .from("rights_requests")
        .insert({
          organization_id: ctx.organizationId,
          kind: body.kind,
          received_on: body.receivedOn,
          channel: body.channel,
          requester_name: body.requesterName,
          requester_email: body.requesterEmail ?? null,
          requester_phone: body.requesterPhone ?? null,
          requester_capacity: body.requesterCapacity ?? "self",
          principal_identifier: body.principalIdentifier ?? null,
          summary: body.summary,
          related_request_id: body.relatedRequestId ?? null,
          nominee_name: body.nomineeName ?? null,
          nominee_contact: body.nomineeContact ?? null,
          nominee_relationship: body.nomineeRelationship ?? null,
          owner_user_id: body.ownerUserId ?? null,
        } as never)
        .select("id")
        .single();
      if (error) writeError(error);
      return ok(await detail(ctx, data.id), ctx.request, { status: 201 });
    },
  },

  read: {
    options: { auth: "required", tenant: "fromParam", permission: "rights.read" } as const,
    handler: async (ctx: Ctx<undefined>) => ok(await detail(ctx, requestId(ctx)), ctx.request),
  },

  /**
   * s.11(1)(b) (D-139): for an ACCESS request, the organisation's list of other
   * Data Fiduciaries and Data Processors the data was shared with, and the kinds
   * of data, from the processing register. Read-only; a person decides what
   * concerns this requester. Every role with rights.read also holds ropa.read.
   */
  sharing: {
    options: { auth: "required", tenant: "fromParam", permission: "rights.read" } as const,
    handler: async (ctx: Ctx<undefined>) => {
      const row = await requireRequest(ctx);
      if (row.kind !== "access") {
        throw new ApiError(409, "CONFLICT", "Only a request for access to information (s.11) needs this list.");
      }
      if (!ctx.permissions.has("ropa.read")) throw new ForbiddenError();
      return ok({ requestId: row.id, ...(await readSharingList(ctx.supabase, ctx.organizationId)) }, ctx.request);
    },
  },

  update: {
    options: { auth: "required", tenant: "fromParam", permission: "rights.write", body: updateBody } as const,
    handler: async (ctx: Ctx<z.infer<typeof updateBody>>) => {
      const row = await requireRequest(ctx);
      const { body } = ctx;
      checkUpdate(row, body, todayInIndia());
      const change = {
        ...(body.kind === undefined ? {} : { kind: body.kind }),
        ...(body.channel === undefined ? {} : { channel: body.channel }),
        ...(body.requesterName === undefined ? {} : { requester_name: body.requesterName }),
        ...(body.requesterEmail === undefined ? {} : { requester_email: body.requesterEmail }),
        ...(body.requesterPhone === undefined ? {} : { requester_phone: body.requesterPhone }),
        ...(body.requesterCapacity === undefined ? {} : { requester_capacity: body.requesterCapacity }),
        ...(body.principalIdentifier === undefined ? {} : { principal_identifier: body.principalIdentifier }),
        ...(body.summary === undefined ? {} : { summary: body.summary }),
        ...(body.relatedRequestId === undefined ? {} : { related_request_id: body.relatedRequestId }),
        ...(body.nomineeName === undefined ? {} : { nominee_name: body.nomineeName }),
        ...(body.nomineeContact === undefined ? {} : { nominee_contact: body.nomineeContact }),
        ...(body.nomineeRelationship === undefined ? {} : { nominee_relationship: body.nomineeRelationship }),
        ...(body.ownerUserId === undefined ? {} : { owner_user_id: body.ownerUserId }),
        ...(body.identity === undefined ? {} : { identity_verified_on: body.identity.verifiedOn, identity_method: body.identity.method }),
        ...(body.status === undefined ? {} : { status: body.status }),
        ...(body.response === undefined
          ? {}
          : { outcome: body.response.outcome, responded_on: body.response.respondedOn, response_summary: body.response.summary ?? null }),
        ...(body.status === "withdrawn" || body.status === "void" ? { closure_reason: body.closureReason ?? null } : {}),
      };
      const { error } = await ctx.supabase
        .from("rights_requests")
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
    options: { auth: "required", tenant: "fromParam", permission: "rights.write", body: addActionBody } as const,
    handler: async (ctx: Ctx<z.infer<typeof addActionBody>>) => {
      // Remediation is work on the ONE action table (D-067): it needs gap.write too.
      if (!ctx.permissions.has("gap.write")) throw new ForbiddenError();
      const row = await requireRequest(ctx);
      const { error } = await ctx.supabase.rpc("add_rights_action", {
        p_organization_id: ctx.organizationId,
        p_rights_request_id: row.id,
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
      const action = await requireRequestAction(ctx as Ctx);
      // The SAME update as every other action: one workflow, one closing rule (D-056).
      await applyActionUpdate(ctx, action);
      return ok(await detail(ctx as Ctx, action.rights_request_id!), ctx.request);
    },
  },

  unlinkActionEvidence: {
    options: { auth: "required", tenant: "fromParam", permission: "gap.write" } as const,
    handler: async (ctx: Ctx<undefined>) => {
      const action = await requireRequestAction(ctx);
      await detachActionEvidence(ctx, action);
      return ok(await detail(ctx, action.rights_request_id!), ctx.request);
    },
  },

  /**
   * DELETE …/rights-requests/{requestId}/evidence/{evidenceId} — detach a
   * document from the request itself (Stage 6). The artefact stays (D-042).
   * Refused while the request is responded, withdrawn or void: "reopen it".
   */
  unlinkEvidence: {
    options: { auth: "required", tenant: "fromParam", permission: "rights.write" } as const,
    handler: async (ctx: Ctx<undefined>) => {
      if (!ctx.permissions.has("evidence.write")) throw new ForbiddenError();
      const row = await requireRequest(ctx);
      const evidenceId = z.uuid().safeParse(ctx.params.evidenceId);
      if (!evidenceId.success) throw new ApiError(404, "NOT_FOUND", "That document is not attached to this request.");
      const { data, error } = await ctx.supabase
        .from("evidence_links")
        .delete()
        .eq("organization_id", ctx.organizationId)
        .eq("evidence_id", evidenceId.data)
        .eq("linked_entity_type", "rights_request")
        .eq("linked_entity_id", row.id)
        .select("id");
      if (error) writeError(error);
      if (!data || data.length === 0) throw new ApiError(404, "NOT_FOUND", "That document is not attached to this request.");
      return ok(await detail(ctx, row.id), ctx.request);
    },
  },
};
