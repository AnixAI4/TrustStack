import "server-only";
import {
  CONSENT_ACTIONS,
  CONSENT_IDENTIFIER_LIMIT,
  CONSENT_LANGUAGES,
  CONSENT_REFERENCE_LIMIT,
  consentRecordProblems,
  ForbiddenError,
  NOTICE_LIMITS,
  noticePurposeProblems,
  PRINCIPAL_KINDS,
  PURPOSE_KEY_PATTERN,
  VERIFICATION_METHODS,
  WIDGET_COLOUR_PATTERN,
  WIDGET_POSITIONS,
  type NoticePurpose,
} from "@truststack/core";
import { z } from "zod";
import { ApiError, type TenantContext } from "@/lib/api/guard";
import { ok } from "@/lib/api/envelope";
import { activeMembers, namesFor } from "@/lib/gaps/shape";
import {
  CONFIG_COLUMNS,
  NOTICE_COLUMNS,
  noticeToApi,
  readConsentRegister,
  recordToApi,
  type ConfigRow,
  type NoticeRow,
  type RecordRow,
} from "./shape";

/**
 * The privacy notice, the consent widget's versions and the consent register
 * (Slice 10, Stage 3b), nested under `/organizations/{id}/…` like every tenant
 * route: both ids filter every query, so a foreign id is a 404, never data.
 *
 * Notices and widget versions are written through RLS (consent.write) and
 * their triggers, which number the versions, stamp who published and when,
 * refuse any change to a published version and audit every write in the same
 * transaction (D-027). Publishing needs consent.publish. A consent record is
 * written only by `record_consent` (staff) or the public widget's function —
 * there is no table grant — and is never changed.
 *
 * Staff write the notice; no AI drafts or translates anything here (Slice 11).
 */

type Ctx<B = unknown> = TenantContext<B, unknown>;

const text = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullable()
    .optional()
    .transform((v) => (v === "" ? null : v));

const purposeSchema = z
  .object({
    key: z.string().trim().regex(PURPOSE_KEY_PATTERN, "Use lower-case letters, digits and underscores, starting with a letter."),
    title: z.string().trim().max(NOTICE_LIMITS.purposeTitle),
    uses: z.string().trim().max(NOTICE_LIMITS.purposeUses),
    dataItems: z.array(z.string().trim().max(NOTICE_LIMITS.dataItem)).max(NOTICE_LIMITS.dataItems),
  })
  .strict();

const noticeContent = {
  title: z.string().trim().min(1).max(NOTICE_LIMITS.title),
  summary: text(NOTICE_LIMITS.summary),
  purposes: z.array(purposeSchema).max(NOTICE_LIMITS.purposes),
  withdrawMeans: text(NOTICE_LIMITS.means),
  rightsMeans: text(NOTICE_LIMITS.means),
  complaintMeans: text(NOTICE_LIMITS.means),
};

const createNoticeBody = z
  .object({ language: z.enum(CONSENT_LANGUAGES), ...noticeContent, purposes: noticeContent.purposes.default([]) })
  .strict();

const updateNoticeBody = z
  .object({
    title: noticeContent.title.optional(),
    summary: noticeContent.summary,
    purposes: noticeContent.purposes.optional(),
    withdrawMeans: noticeContent.withdrawMeans,
    rightsMeans: noticeContent.rightsMeans,
    complaintMeans: noticeContent.complaintMeans,
    /** Publishing is the only status change: a published notice never changes. */
    status: z.literal("published").optional(),
  })
  .strict()
  .refine((v) => Object.keys(v).length > 0, "Nothing to change.");

const configContent = {
  noticeId: z.uuid(),
  purposes: z.array(z.string().regex(PURPOSE_KEY_PATTERN)).max(20),
  languages: z.array(z.enum(CONSENT_LANGUAGES)).min(1).max(CONSENT_LANGUAGES.length),
  position: z.enum(WIDGET_POSITIONS),
  primaryColor: z.string().trim().toLowerCase().regex(WIDGET_COLOUR_PATTERN, "Use a colour like #1e3a8a."),
};

const createConfigBody = z
  .object({
    ...configContent,
    languages: configContent.languages.default(["en", "hi", "mr"]),
    position: configContent.position.default("bottom_bar"),
    primaryColor: configContent.primaryColor.default("#1e3a8a"),
  })
  .strict();

const updateConfigBody = z
  .object({
    noticeId: configContent.noticeId.optional(),
    purposes: configContent.purposes.optional(),
    languages: configContent.languages.optional(),
    position: configContent.position.optional(),
    primaryColor: configContent.primaryColor.optional(),
    status: z.literal("published").optional(),
  })
  .strict()
  .refine((v) => Object.keys(v).length > 0, "Nothing to change.");

const recordBody = z
  .object({
    configId: z.uuid(),
    /** The identifier the organisation holds for the person (an enrolment number, an email). Hashed by the database, never stored. */
    identifier: z.string().trim().min(1).max(CONSENT_IDENTIFIER_LIMIT),
    action: z.enum(CONSENT_ACTIONS),
    purposes: z.array(z.string().regex(PURPOSE_KEY_PATTERN)).max(20).default([]),
    principalKind: z.enum(PRINCIPAL_KINDS).default("self"),
    verificationMethod: z.enum(VERIFICATION_METHODS).nullable().default(null),
    language: z.enum(CONSENT_LANGUAGES).default("en"),
    /** Where the choice is on file — a form number, a letter's date. Not the person's name. */
    reference: text(CONSENT_REFERENCE_LIMIT),
  })
  .strict();

/** POST, so the identifier never travels in a URL. */
const lookupBody = z.object({ identifier: z.string().trim().min(1).max(CONSENT_IDENTIFIER_LIMIT) }).strict();

/** The CHECKs that can fail on a well-formed body, in words. Anything else is a bug and stays a 500. */
const CHECK_MESSAGES: Record<string, string> = {
  privacy_notices_published_complete:
    "A published notice states at least one purpose, what each provides or enables, and the personal data each needs (Rule 3(b)).",
  privacy_notices_purposes_shape: "The purposes are not in the right shape.",
  privacy_notices_text_lengths: "A text is empty or too long.",
  consent_configs_languages_check: "A widget version always offers English.",
  consent_configs_purposes_check: "A published widget version offers at least one purpose.",
  consent_records_given_has_purposes: "Consent is given for at least one purpose; a refusal or a withdrawal names none.",
  consent_records_verification_fits: "That basis does not fit this kind of consent.",
};

function writeError(error: { code?: string; message: string }, notFound: string): never {
  if (error.code === "23514") {
    const constraint = Object.keys(CHECK_MESSAGES).find((c) => error.message.includes(c));
    throw new ApiError(422, "VALIDATION_ERROR", constraint ? CHECK_MESSAGES[constraint]! : "That breaks a rule of the consent register.");
  }
  if (error.code === "23505") {
    throw new ApiError(409, "CONFLICT", "A draft already exists — edit it, or discard it first.");
  }
  // The composite FK: the notice is not this organisation's, or a widget version still cites a draft.
  if (error.code === "23503") throw new ApiError(422, "VALIDATION_ERROR", "The notice was not found, or a widget version still cites it.");
  if (error.code === "PGRST116") throw new ApiError(404, "NOT_FOUND", notFound);
  // TS4xx from the triggers and functions are mapped by the guard (rpcError).
  throw error;
}

function idParam(ctx: Ctx, param: string, notFound: string): string {
  const parsed = z.uuid().safeParse(ctx.params[param]);
  if (!parsed.success) throw new ApiError(404, "NOT_FOUND", notFound);
  return parsed.data;
}

async function requireNotice(ctx: Ctx): Promise<NoticeRow> {
  const { data, error } = await ctx.supabase
    .from("privacy_notices")
    .select(NOTICE_COLUMNS)
    .eq("organization_id", ctx.organizationId)
    .eq("id", idParam(ctx, "noticeId", "Notice not found."))
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new ApiError(404, "NOT_FOUND", "Notice not found.");
  return data as NoticeRow;
}

async function requireConfig(ctx: Ctx): Promise<ConfigRow> {
  const { data, error } = await ctx.supabase
    .from("consent_configs")
    .select(CONFIG_COLUMNS)
    .eq("organization_id", ctx.organizationId)
    .eq("id", idParam(ctx, "configId", "Widget version not found."))
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new ApiError(404, "NOT_FOUND", "Widget version not found.");
  return data as ConfigRow;
}

async function noticeDetail(ctx: Ctx, id: string) {
  const { data, error } = await ctx.supabase
    .from("privacy_notices")
    .select(NOTICE_COLUMNS)
    .eq("organization_id", ctx.organizationId)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new ApiError(404, "NOT_FOUND", "Notice not found.");
  const row = data as NoticeRow;
  const members = await activeMembers(ctx.supabase, ctx.organizationId);
  const names = await namesFor(ctx.supabase, members, [row.published_by, row.created_by]);
  return { notice: noticeToApi(row, names) };
}

const register = async (ctx: Ctx) => readConsentRegister(ctx.supabase, ctx.organizationId, await activeMembers(ctx.supabase, ctx.organizationId));

const conflict = (message: string): never => {
  throw new ApiError(409, "CONFLICT", message);
};
const invalid = (message: string, field: string): never => {
  throw new ApiError(422, "VALIDATION_ERROR", message, [{ field, issue: message }]);
};

function assertCanPublish(ctx: Ctx) {
  if (!ctx.permissions.has("consent.publish")) throw new ForbiddenError("You do not have permission to publish.");
}

export const consent = {
  /** GET …/consent — the whole register (consent.read). */
  register: {
    options: { auth: "required", tenant: "fromParam", permission: "consent.read" } as const,
    handler: async (ctx: Ctx<undefined>) => ok(await register(ctx), ctx.request),
  },

  createNotice: {
    options: { auth: "required", tenant: "fromParam", permission: "consent.write", body: createNoticeBody } as const,
    handler: async (ctx: Ctx<z.infer<typeof createNoticeBody>>) => {
      const { body } = ctx;
      // Only what a person writes: the version, the status and every stamp are the database's.
      const { data, error } = await ctx.supabase
        .from("privacy_notices")
        .insert({
          organization_id: ctx.organizationId,
          language: body.language,
          title: body.title,
          summary: body.summary ?? null,
          purposes: body.purposes,
          withdraw_means: body.withdrawMeans ?? null,
          rights_means: body.rightsMeans ?? null,
          complaint_means: body.complaintMeans ?? null,
        } as never)
        .select("id")
        .single();
      if (error) writeError(error, "Notice not found.");
      return ok(await noticeDetail(ctx, data.id), ctx.request, { status: 201 });
    },
  },

  readNotice: {
    options: { auth: "required", tenant: "fromParam", permission: "consent.read" } as const,
    handler: async (ctx: Ctx<undefined>) => ok(await noticeDetail(ctx, idParam(ctx, "noticeId", "Notice not found.")), ctx.request),
  },

  updateNotice: {
    options: { auth: "required", tenant: "fromParam", permission: "consent.write", body: updateNoticeBody } as const,
    handler: async (ctx: Ctx<z.infer<typeof updateNoticeBody>>) => {
      const row = await requireNotice(ctx);
      const { body } = ctx;
      if (row.status === "published") conflict("A published notice never changes — start a new version.");
      if (body.status === "published") {
        assertCanPublish(ctx);
        const problems = noticePurposeProblems((body.purposes ?? row.purposes ?? []) as NoticePurpose[]);
        if (problems.length > 0) invalid(problems.join(" "), "purposes");
      }
      const change = {
        ...(body.title === undefined ? {} : { title: body.title }),
        ...(body.summary === undefined ? {} : { summary: body.summary }),
        ...(body.purposes === undefined ? {} : { purposes: body.purposes }),
        ...(body.withdrawMeans === undefined ? {} : { withdraw_means: body.withdrawMeans }),
        ...(body.rightsMeans === undefined ? {} : { rights_means: body.rightsMeans }),
        ...(body.complaintMeans === undefined ? {} : { complaint_means: body.complaintMeans }),
        ...(body.status === undefined ? {} : { status: body.status }),
      };
      const { error } = await ctx.supabase
        .from("privacy_notices")
        .update(change as never)
        .eq("organization_id", ctx.organizationId)
        .eq("id", row.id)
        .select("id")
        .single();
      if (error) writeError(error, "Notice not found.");
      return ok(await noticeDetail(ctx, row.id), ctx.request);
    },
  },

  deleteNotice: {
    options: { auth: "required", tenant: "fromParam", permission: "consent.write" } as const,
    handler: async (ctx: Ctx<undefined>) => {
      const row = await requireNotice(ctx);
      if (row.status === "published") conflict("A published notice is never deleted — it stays readable as an earlier version.");
      const { error } = await ctx.supabase.from("privacy_notices").delete().eq("organization_id", ctx.organizationId).eq("id", row.id);
      if (error) writeError(error, "Notice not found.");
      return ok({ deleted: row.id }, ctx.request);
    },
  },

  createConfig: {
    options: { auth: "required", tenant: "fromParam", permission: "consent.write", body: createConfigBody } as const,
    handler: async (ctx: Ctx<z.infer<typeof createConfigBody>>) => {
      const { body } = ctx;
      const { error } = await ctx.supabase
        .from("consent_configs")
        .insert({
          organization_id: ctx.organizationId,
          notice_id: body.noticeId,
          purposes: body.purposes,
          languages: body.languages,
          position: body.position,
          primary_color: body.primaryColor,
        } as never)
        .select("id")
        .single();
      if (error) writeError(error, "Widget version not found.");
      return ok(await register(ctx), ctx.request, { status: 201 });
    },
  },

  updateConfig: {
    options: { auth: "required", tenant: "fromParam", permission: "consent.write", body: updateConfigBody } as const,
    handler: async (ctx: Ctx<z.infer<typeof updateConfigBody>>) => {
      const row = await requireConfig(ctx);
      const { body } = ctx;
      if (row.status === "published") conflict("A published widget version never changes — make a new version.");
      if (body.status === "published") {
        assertCanPublish(ctx);
        if ((body.purposes ?? row.purposes).length === 0) invalid("A published widget version offers at least one purpose.", "purposes");
      }
      const change = {
        ...(body.noticeId === undefined ? {} : { notice_id: body.noticeId }),
        ...(body.purposes === undefined ? {} : { purposes: body.purposes }),
        ...(body.languages === undefined ? {} : { languages: body.languages }),
        ...(body.position === undefined ? {} : { position: body.position }),
        ...(body.primaryColor === undefined ? {} : { primary_color: body.primaryColor }),
        ...(body.status === undefined ? {} : { status: body.status }),
      };
      const { error } = await ctx.supabase
        .from("consent_configs")
        .update(change as never)
        .eq("organization_id", ctx.organizationId)
        .eq("id", row.id)
        .select("id")
        .single();
      if (error) writeError(error, "Widget version not found.");
      return ok(await register(ctx), ctx.request);
    },
  },

  deleteConfig: {
    options: { auth: "required", tenant: "fromParam", permission: "consent.write" } as const,
    handler: async (ctx: Ctx<undefined>) => {
      const row = await requireConfig(ctx);
      if (row.status === "published") conflict("A published widget version is never deleted — consents were given against it.");
      const { error } = await ctx.supabase.from("consent_configs").delete().eq("organization_id", ctx.organizationId).eq("id", row.id);
      if (error) writeError(error, "Widget version not found.");
      return ok(await register(ctx), ctx.request);
    },
  },

  record: {
    options: { auth: "required", tenant: "fromParam", permission: "consent.write", body: recordBody } as const,
    handler: async (ctx: Ctx<z.infer<typeof recordBody>>) => {
      const { body } = ctx;
      const config = await ctx.supabase
        .from("consent_configs")
        .select("id, status, purposes")
        .eq("organization_id", ctx.organizationId)
        .eq("id", body.configId)
        .maybeSingle();
      if (config.error) throw config.error;
      if (!config.data || config.data.status !== "published") {
        throw new ApiError(404, "NOT_FOUND", "Widget version not found — a consent is recorded against a published version.");
      }
      const problems = consentRecordProblems({ ...body, offered: config.data.purposes });
      if (problems.length > 0) invalid(problems.join(" "), "purposes");
      const { error } = await ctx.supabase.rpc("record_consent", {
        p_organization_id: ctx.organizationId,
        p_config_id: body.configId,
        p_identifier: body.identifier,
        p_action: body.action,
        p_purposes: body.purposes,
        p_principal_kind: body.principalKind,
        // The generated types mark nullable RPC arguments as required strings.
        p_verification_method: body.verificationMethod as unknown as string,
        p_language: body.language,
        p_reference: (body.reference ?? null) as unknown as string,
      });
      if (error) writeError(error, "Widget version not found.");
      return ok(await register(ctx), ctx.request, { status: 201 });
    },
  },

  lookup: {
    options: { auth: "required", tenant: "fromParam", permission: "consent.read", body: lookupBody } as const,
    handler: async (ctx: Ctx<z.infer<typeof lookupBody>>) => {
      const { data, error } = await ctx.supabase.rpc("consent_history", {
        p_organization_id: ctx.organizationId,
        p_identifier: ctx.body.identifier,
      });
      if (error) throw error;
      const history = data as unknown as {
        principalKey: string;
        records: (Omit<RecordRow, "organization_id" | "principal_key"> & { configVersion: number })[];
      };
      // The function answers in camelCase; read it back as rows for the one shape.
      const rows: RecordRow[] = history.records.map((r) => {
        const x = r as unknown as Record<string, unknown>;
        return {
          id: x.id as string,
          organization_id: ctx.organizationId,
          config_id: x.configId as string,
          principal_key: history.principalKey,
          action: x.action as string,
          purposes: x.purposes as string[],
          principal_kind: x.principalKind as string,
          verification_method: (x.verificationMethod as string | null) ?? null,
          language: x.language as string,
          source: x.source as string,
          reference: (x.reference as string | null) ?? null,
          recorded_by: (x.recordedBy as string | null) ?? null,
          recorded_at: x.recordedAt as string,
        };
      });
      const versions = new Map(history.records.map((r) => [(r as unknown as { configId: string }).configId, r.configVersion]));
      const members = await activeMembers(ctx.supabase, ctx.organizationId);
      const names = await namesFor(ctx.supabase, members, rows.map((r) => r.recorded_by));
      return ok(
        {
          principal: history.principalKey.slice(0, 12),
          /** Newest first: the first is the person's position now. */
          records: rows.map((r) => recordToApi(r, versions, names)),
        },
        ctx.request,
      );
    },
  },
};

