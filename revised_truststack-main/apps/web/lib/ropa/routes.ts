import "server-only";
import {
  APPROVAL_REFUSAL_MESSAGE,
  approvalDecision,
  canRopaTransition,
  csvCell,
  isCalendarDate,
  ROPA_CHILD_EXEMPTION_CODES,
  ROPA_IMPORT_FIELDS,
  ROPA_IMPORT_HEADERS,
  ROPA_LAWFUL_BASES,
  ROPA_LAWFUL_BASIS_CODES,
  ROPA_NAME_LIMIT,
  ROPA_RECORD_CODE_PATTERN,
  ROPA_RETENTION_TRIGGER_CODES,
  ROPA_RETENTION_TRIGGERS,
  ROPA_RISK_RATINGS,
  ROPA_SAFEGUARD_CODES,
  ropaTemplatesFor,
  ROPA_STATUS_LABEL,
  ROPA_STATUSES,
  ROPA_TEXT_LIMIT,
  TRI_STATES,
  type RopaChildExemption,
  type RopaImportField,
  type RopaLawfulBasis,
  type RopaRetentionTrigger,
  type RopaSafeguard,
  type RopaStatus,
} from "@truststack/core";
import { z } from "zod";
import { ApiError, rpcError, type TenantContext } from "@/lib/api/guard";
import { ok } from "@/lib/api/envelope";
import { mapWriteError } from "@/lib/evidence/shape";
import { actionPatchBody, applyActionUpdate, detachActionEvidence } from "@/lib/gaps/routes";
import { ACTION_COLUMNS, activeMembers, namesFor, type ActionRow } from "@/lib/gaps/shape";
import { CSV_MAX_BYTES, CsvError } from "./csv";
import { prepareImport, prepareRows, toRpcRow } from "./import";
import { parseXlsx, XLSX_MAX_BYTES, XlsxError } from "./xlsx";
import {
  readAllRecords,
  readRecord,
  readRecordLinks,
  readRopaGapRegister,
  readRopaGaps,
  RECORD_FIELD_COLUMNS,
  recordSummaryToApi,
  recordToApi,
  ropaExportHeaders,
  ropaExportRow,
  ropaRegisterCounts,
  todayInIndia,
  type RecordField,
  type RecordRow,
} from "./shape";

/**
 * The ROPA / Processing Activity Register (Slice 7), nested under
 * `/organizations/{id}/ropa…` like every tenant route (D-035): both ids filter
 * every query, so a foreign id under this path is a 404, never data.
 *
 * Plain CRUD runs through RLS write policies (D-023, D-027); the database
 * derives completeness and risk on every write and refuses anything that does
 * not match. Every rule repeated here is repeated only for the message.
 *
 * Positioning (D-011): a readiness register, never a statutory record — and
 * never "compliant".
 */

const text = z
  .string()
  .trim()
  .max(ROPA_TEXT_LIMIT)
  .nullable()
  .optional()
  .transform((v) => (v === "" ? null : v));
const date = z.string().refine(isCalendarDate, "must be a calendar date, YYYY-MM-DD").nullable().optional();
const tri = z.enum(TRI_STATES).optional();
const ids = z.array(z.uuid()).max(50).optional();
/** `z.enum` wants a literal tuple; core's vocabularies are readonly arrays. */
const oneOf = <T extends string>(values: readonly T[]) => z.enum(values as unknown as [T, ...T[]]);

const fields = {
  name: z.string().trim().min(1).max(ROPA_NAME_LIMIT),
  description: text,
  departmentId: z.uuid().nullable().optional(),
  departmentText: text,
  ownerUserId: z.uuid().nullable().optional(),
  dataPrincipalTypes: text,
  dataCategories: text,
  estimatedDataPrincipals: z.number().int().min(0).max(2_147_483_647).nullable().optional(),
  purpose: text,
  legalBasisNote: text,
  collectionSource: text,
  systemsText: text,
  vendorsText: text,
  sharing: text,
  retentionRule: text,
  securitySafeguards: text,
  noticeLinked: text,
  consentLinked: text,
  rightsWorkflow: text,
  grievanceLinked: text,
  childrenData: tri,
  crossBorder: tri,
  aiProcessing: tri,
  highRiskDocuments: tri,
  evidenceNote: text,
  // An assessor may raise the derived rating, never lower it (D-061). The
  // database refuses a lower one; null withdraws a raise.
  riskRatingAssessor: z.enum(ROPA_RISK_RATINGS).nullable().optional(),
  // D-067: a raise needs its reason; the database refuses one without.
  riskRatingAssessorReason: text,
  lastReviewedAt: date,
  nextReviewAt: date,
  // D-065 — each a note for counsel, never a legal opinion.
  lawfulBasis: oneOf<RopaLawfulBasis>(ROPA_LAWFUL_BASIS_CODES).nullable().optional(),
  childParentalConsent: tri,
  childExemption: oneOf<RopaChildExemption>(ROPA_CHILD_EXEMPTION_CODES).nullable().optional(),
  childTracking: tri,
  retentionTrigger: oneOf<RopaRetentionTrigger>(ROPA_RETENTION_TRIGGER_CODES).nullable().optional(),
  retentionLaw: text,
  safeguards: z
    .array(oneOf<RopaSafeguard>(ROPA_SAFEGUARD_CODES))
    .max(ROPA_SAFEGUARD_CODES.length)
    .optional()
    .transform((v) => (v === undefined ? undefined : [...new Set(v)])),
};

const createBody = z
  .object({
    ...fields,
    recordCode: z.string().trim().regex(ROPA_RECORD_CODE_PATTERN, "up to 50 letters, digits, dots, dashes or slashes").optional(),
    systemIds: ids,
    vendorIds: ids,
  })
  .strict();

const updateBody = z
  .object({
    ...fields,
    name: fields.name.optional(),
    status: z.enum(ROPA_STATUSES).optional(),
    systemIds: ids,
    vendorIds: ids,
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, "Nothing to change.");

const importBody = z
  .object({
    /** A CSV, as text… */
    csv: z.string().min(1).max(CSV_MAX_BYTES, `The file is larger than ${CSV_MAX_BYTES / 1_000_000} MB.`).optional(),
    /** …or an Excel workbook, base64 (D-067). Exactly one. */
    xlsx: z
      .string()
      .min(1)
      .max(Math.ceil((XLSX_MAX_BYTES * 4) / 3) + 4, "The file is larger than 2 MB.")
      .regex(/^[A-Za-z0-9+/]+={0,2}$/, "must be base64")
      .optional(),
    /** Header text → field, or null to ignore the column. Omit to use the proposed mapping. */
    mapping: z.record(z.string(), z.enum(ROPA_IMPORT_FIELDS).nullable()).optional(),
    /** Validate and report, write nothing. The UI's "check the file" step. */
    dryRun: z.boolean().default(false),
  })
  .strict()
  .refine((b) => (b.csv === undefined) !== (b.xlsx === undefined), "Send one file: a CSV or an Excel workbook.");

const lookupQuery = z
  .object({
    principal: z.string().trim().min(1).max(100).optional(),
    systemId: z.uuid().optional(),
    vendorId: z.uuid().optional(),
  })
  .strict()
  .refine((q) => [q.principal, q.systemId, q.vendorId].filter((v) => v !== undefined).length <= 1, "Ask about one thing at a time.");

type Ctx<B = unknown> = TenantContext<B, unknown>;

/** A raise needs its reason (D-067) — said here for the message; the database refuses it too. */
function requireRaiseReason(assessor: string | null | undefined, reason: string | null | undefined, stored: string | null = null) {
  if (assessor && !(reason ?? stored)) {
    throw new ApiError(422, "VALIDATION_ERROR", "Say why the risk rating is raised — the reason is kept with the rating.", [
      { field: "riskRatingAssessorReason", issue: "required when an assessor raises the rating" },
    ]);
  }
}

/** Database errors: our TS* codes first, then the standard ones. */
function writeError(error: { code?: string; message: string; hint?: string | null }, notFound = "Record not found."): never {
  const mapped = rpcError(error);
  if (mapped) throw mapped;
  if (error.code === "23505") throw new ApiError(409, "CONFLICT", "A record with this ID already exists in the register.");
  if (error.code === "23503") throw new ApiError(422, "VALIDATION_ERROR", "A linked item does not exist in this organisation.");
  mapWriteError(error, notFound);
}

/** Both ids, always. */
async function requireRecord(ctx: Ctx, param = "ropaId"): Promise<RecordRow> {
  const parsed = z.uuid().safeParse(ctx.params[param]);
  if (!parsed.success) throw new ApiError(404, "NOT_FOUND", "Record not found.");
  const row = await readRecord(ctx.supabase, ctx.organizationId, parsed.data);
  if (!row) throw new ApiError(404, "NOT_FOUND", "Record not found.");
  return row;
}

/**
 * References are validated BEFORE any write (D-027.4): a record cannot be
 * deleted by a user, so there is no compensating delete to fall back on.
 */
async function validateReferences(
  ctx: Ctx,
  input: { departmentId?: string | null; ownerUserId?: string | null; systemIds?: string[]; vendorIds?: string[] },
) {
  const { supabase, organizationId } = ctx;
  const missing = (field: string) =>
    new ApiError(422, "VALIDATION_ERROR", "A linked item does not exist in this organisation.", [{ field, issue: "not found" }]);

  if (input.departmentId) {
    const { data, error } = await supabase
      .from("departments")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("id", input.departmentId)
      .maybeSingle();
    if (error) throw error;
    if (!data) throw missing("departmentId");
  }
  if (input.ownerUserId) {
    const members = await activeMembers(supabase, organizationId);
    if (!members.some((m) => m.userId === input.ownerUserId)) {
      throw new ApiError(422, "VALIDATION_ERROR", "The owner must be an active member of this organisation.", [
        { field: "ownerUserId", issue: "not an active member" },
      ]);
    }
  }
  for (const [table, field, list] of [
    ["systems", "systemIds", input.systemIds],
    ["vendors", "vendorIds", input.vendorIds],
  ] as const) {
    const unique = [...new Set(list ?? [])];
    if (unique.length === 0) continue;
    const { data, error } = await supabase.from(table).select("id").eq("organization_id", organizationId).in("id", unique);
    if (error) throw error;
    if ((data ?? []).length !== unique.length) throw missing(field);
  }
}

/** camelCase body → the columns users may write. */
function toColumns(body: Partial<Record<RecordField, unknown>>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [field, column] of Object.entries(RECORD_FIELD_COLUMNS)) {
    const value = body[field as RecordField];
    if (value !== undefined) out[column] = value;
  }
  return out;
}

/** Replace a record's links to one register with exactly this set. */
async function syncLinks(ctx: Ctx, recordId: string, table: "ropa_systems" | "ropa_vendors", wanted: string[]) {
  const { supabase, organizationId } = ctx;
  const column = table === "ropa_systems" ? "system_id" : "vendor_id";
  const { data, error } = await supabase
    .from(table)
    .select(column)
    .eq("organization_id", organizationId)
    .eq("ropa_record_id", recordId);
  if (error) throw error;
  const current = new Set(((data ?? []) as unknown as Record<string, string>[]).map((r) => r[column]!));
  const target = new Set(wanted);
  const remove = [...current].filter((id) => !target.has(id));
  const add = [...target].filter((id) => !current.has(id));
  if (remove.length > 0) {
    const { error: dError } = await supabase
      .from(table)
      .delete()
      .eq("organization_id", organizationId)
      .eq("ropa_record_id", recordId)
      .in(column, remove);
    if (dError) writeError(dError);
  }
  if (add.length > 0) {
    const { error: iError } = await supabase
      .from(table)
      .insert(add.map((id) => ({ organization_id: organizationId, ropa_record_id: recordId, [column]: id })) as never);
    if (iError) writeError(iError);
  }
}

async function detail(ctx: Ctx, row: RecordRow) {
  const { supabase, organizationId, permissions } = ctx;
  const members = await activeMembers(supabase, organizationId);
  const names = await namesFor(supabase, members, [row.owner_user_id, row.approved_by]);
  const links = await readRecordLinks(supabase, organizationId, row.id);
  const gaps = permissions.has("gap.read") ? await readRopaGaps(supabase, organizationId, members, { recordId: row.id }) : [];
  return {
    record: { ...recordToApi(row, names), ...links },
    gaps,
  };
}

/** The choices the record form offers — only to those who can write. */
async function formOptions(ctx: Ctx) {
  const { supabase, organizationId, permissions } = ctx;
  if (!permissions.has("ropa.write")) return null;
  const [departments, systems, vendors, members] = await Promise.all([
    supabase.from("departments").select("id, name").eq("organization_id", organizationId).order("name"),
    supabase.from("systems").select("id, name").eq("organization_id", organizationId).order("name"),
    supabase.from("vendors").select("id, name").eq("organization_id", organizationId).order("name"),
    activeMembers(supabase, organizationId),
  ]);
  for (const r of [departments, systems, vendors]) if (r.error) throw r.error;
  return {
    departments: departments.data ?? [],
    systems: systems.data ?? [],
    vendors: vendors.data ?? [],
    members,
  };
}

export const ropa = {
  list: {
    options: { auth: "required", tenant: "fromParam", permission: "ropa.read" } as const,
    handler: async (ctx: TenantContext<undefined, undefined>) => {
      const c = ctx as Ctx;
      const rows = await readAllRecords(c.supabase, c.organizationId);
      const members = await activeMembers(c.supabase, c.organizationId);
      const names = await namesFor(c.supabase, members, rows.map((r) => r.owner_user_id));
      const today = todayInIndia();
      const { data: org, error: oError } = await c.supabase
        .from("organizations")
        .select("industry_code")
        .eq("id", c.organizationId)
        .maybeSingle();
      if (oError) throw oError;
      return ok(
        {
          organizationId: c.organizationId,
          industryCode: org?.industry_code ?? null,
          /** Starter activities for this industry (D-066) — a starting point, never a lawful ground. */
          templates: c.permissions.has("ropa.write") ? ropaTemplatesFor(org?.industry_code ?? null) : [],
          /** The register is a readiness artefact, not a statutory record (D-011). */
          positioning: "DPDP readiness register — not a statutory record.",
          // Counted in core, from stored fields (Slice 8) — the dashboard reads the same function.
          counts: ropaRegisterCounts(rows, today),
          records: rows.map((r) => recordSummaryToApi(r, names)),
          options: await formOptions(c),
        },
        c.request,
      );
    },
  },

  create: {
    options: { auth: "required", tenant: "fromParam", permission: "ropa.write", body: createBody } as const,
    handler: async (ctx: TenantContext<z.infer<typeof createBody>, undefined>) => {
      const c = ctx as Ctx<z.infer<typeof createBody>>;
      const { systemIds, vendorIds, recordCode, ...content } = c.body;
      requireRaiseReason(content.riskRatingAssessor, content.riskRatingAssessorReason);
      await validateReferences(c, { ...content, systemIds, vendorIds });

      // The database assigns ROPA-NNN when no code is given, starts every
      // record as a Draft, and derives completeness and risk.
      const { data, error } = await c.supabase
        .from("ropa_records")
        .insert({ ...toColumns(content), organization_id: c.organizationId, record_code: recordCode ?? null } as never)
        .select("id")
        .single();
      if (error) writeError(error);
      const id = (data as { id: string }).id;

      if (systemIds) await syncLinks(c, id, "ropa_systems", systemIds);
      if (vendorIds) await syncLinks(c, id, "ropa_vendors", vendorIds);

      const row = (await readRecord(c.supabase, c.organizationId, id))!;
      return ok(await detail(c, row), c.request, { status: 201 });
    },
  },

  read: {
    options: { auth: "required", tenant: "fromParam", permission: "ropa.read" } as const,
    handler: async (ctx: TenantContext<undefined, undefined>) => {
      const c = ctx as Ctx;
      const row = await requireRecord(c);
      return ok({ ...(await detail(c, row)), options: await formOptions(c) }, c.request);
    },
  },

  update: {
    options: { auth: "required", tenant: "fromParam", permission: "ropa.write", body: updateBody } as const,
    handler: async (ctx: TenantContext<z.infer<typeof updateBody>, undefined>) => {
      const c = ctx as Ctx<z.infer<typeof updateBody>>;
      const row = await requireRecord(c);
      const { status, systemIds, vendorIds, ...content } = c.body;
      const columns = toColumns(content);
      const editing = Object.keys(columns).length > 0 || systemIds !== undefined || vendorIds !== undefined;
      const current = row.status as RopaStatus;

      if (status !== undefined && status !== current && !canRopaTransition(current, status)) {
        throw new ApiError(
          409,
          "CONFLICT",
          `A record that is ${ROPA_STATUS_LABEL[current]} cannot move to ${ROPA_STATUS_LABEL[status]}.`,
        );
      }
      if (editing && status === "approved") {
        throw new ApiError(409, "CONFLICT", "Save the changes first, then approve the record.");
      }
      // Content changes only while a record is being worked on: an approved
      // record is reopened first, an archived one restored first.
      const after = status ?? current;
      if (editing && after !== "draft" && after !== "in_review") {
        throw new ApiError(
          409,
          "CONFLICT",
          current === "archived" ? "This record is archived — restore it to change it." : "This record is approved — reopen it to change it.",
        );
      }

      if (status === "approved" && current !== "approved") {
        const decision = approvalDecision({
          ownerUserId: row.owner_user_id,
          approverUserId: c.user.id,
          approverCanReview: c.permissions.has("evidence.review"),
          completenessScore: row.completeness_score,
        });
        if (!decision.allowed) {
          const forbidden = decision.reason === "not_a_reviewer" || decision.reason === "self_approval";
          throw new ApiError(forbidden ? 403 : 409, forbidden ? "FORBIDDEN" : "CONFLICT", APPROVAL_REFUSAL_MESSAGE[decision.reason]);
        }
      }

      requireRaiseReason(
        content.riskRatingAssessor,
        content.riskRatingAssessorReason,
        content.riskRatingAssessor === row.risk_rating_assessor ? row.risk_rating_assessor_reason : null,
      );
      await validateReferences(c, { ...content, systemIds, vendorIds });

      // Reopening or restoring comes BEFORE the edit, so the edit lands on a Draft.
      const statusFirst = status !== undefined && status !== current && (status === "draft" || status === "in_review");
      const setStatus = async () => {
        const { error } = await c.supabase
          .from("ropa_records")
          .update({ status } as never)
          .eq("id", row.id)
          .eq("organization_id", c.organizationId)
          .select("id")
          .single();
        if (error) writeError(error);
      };
      if (statusFirst) await setStatus();
      if (Object.keys(columns).length > 0) {
        const { error } = await c.supabase
          .from("ropa_records")
          .update(columns as never)
          .eq("id", row.id)
          .eq("organization_id", c.organizationId)
          .select("id")
          .single();
        if (error) writeError(error);
      }
      if (systemIds !== undefined) await syncLinks(c, row.id, "ropa_systems", systemIds);
      if (vendorIds !== undefined) await syncLinks(c, row.id, "ropa_vendors", vendorIds);
      if (status !== undefined && status !== current && !statusFirst) await setStatus();

      const fresh = (await readRecord(c.supabase, c.organizationId, row.id))!;
      return ok(await detail(c, fresh), c.request);
    },
  },

  archive: {
    options: { auth: "required", tenant: "fromParam", permission: "ropa.write" } as const,
    handler: async (ctx: TenantContext<undefined, undefined>) => {
      const c = ctx as Ctx;
      const row = await requireRecord(c);
      // DELETE archives. A processing record is never removed: it is the
      // register's own history.
      if (row.status !== "archived") {
        if (!canRopaTransition(row.status as RopaStatus, "archived")) {
          throw new ApiError(409, "CONFLICT", "This record cannot be archived from its current status.");
        }
        const { error } = await c.supabase
          .from("ropa_records")
          .update({ status: "archived" } as never)
          .eq("id", row.id)
          .eq("organization_id", c.organizationId)
          .select("id")
          .single();
        if (error) writeError(error);
      }
      const fresh = (await readRecord(c.supabase, c.organizationId, row.id))!;
      return ok(await detail(c, fresh), c.request);
    },
  },

  unlinkEvidence: {
    options: { auth: "required", tenant: "fromParam", permission: "ropa.write" } as const,
    handler: async (ctx: TenantContext<undefined, undefined>) => {
      const c = ctx as Ctx;
      if (!c.permissions.has("evidence.write")) throw new ApiError(403, "FORBIDDEN", "You do not have permission to do that.");
      const row = await requireRecord(c);
      const evidenceId = z.uuid().safeParse(c.params.evidenceId);
      if (!evidenceId.success) throw new ApiError(404, "NOT_FOUND", "That evidence is not attached to this record.");
      if (row.status === "approved") {
        throw new ApiError(409, "CONFLICT", "This record is approved — reopen it before detaching its evidence.");
      }
      // The artefact stays (D-042). The trigger re-derives the record's
      // completeness; no answer's score is touched.
      const { data, error } = await c.supabase
        .from("evidence_links")
        .delete()
        .eq("organization_id", c.organizationId)
        .eq("evidence_id", evidenceId.data)
        .eq("linked_entity_type", "ropa_record")
        .eq("linked_entity_id", row.id)
        .select("id");
      if (error) writeError(error);
      if (!data || data.length === 0) throw new ApiError(404, "NOT_FOUND", "That evidence is not attached to this record.");
      const fresh = (await readRecord(c.supabase, c.organizationId, row.id))!;
      return ok(await detail(c, fresh), c.request);
    },
  },

  import: {
    options: { auth: "required", tenant: "fromParam", permission: "ropa.write", body: importBody } as const,
    handler: async (ctx: TenantContext<z.infer<typeof importBody>, undefined>) => {
      const c = ctx as Ctx<z.infer<typeof importBody>>;
      let prepared;
      try {
        const chosen = c.body.mapping as Record<string, RopaImportField | null> | undefined;
        prepared =
          c.body.xlsx !== undefined
            ? prepareRows(await parseXlsx(Buffer.from(c.body.xlsx, "base64")), chosen)
            : prepareImport(c.body.csv!, chosen);
      } catch (error) {
        if (error instanceof CsvError || error instanceof XlsxError) throw new ApiError(422, "VALIDATION_ERROR", error.message);
        if (error instanceof Error && error.name === "RopaInputError") throw new ApiError(422, "VALIDATION_ERROR", error.message);
        throw error;
      }
      const { headers, mapping, valid, rejected } = prepared;
      const proposal = {
        headers,
        mapping: Object.fromEntries(headers.map((h, i) => [h, (Object.entries(mapping.fields).find(([, idx]) => idx === i)?.[0] ?? null) as RopaImportField | null])),
        unmapped: mapping.unmapped,
        missingRequired: mapping.missingRequired,
        fields: ROPA_IMPORT_FIELDS.map((f) => ({ field: f, header: ROPA_IMPORT_HEADERS[f][0] })),
      };
      const warnings = valid.filter((v) => v.warnings.length > 0).map((v) => ({ row: v.row, warnings: v.warnings }));

      if (mapping.missingRequired.length > 0) {
        throw new ApiError(422, "VALIDATION_ERROR", "Map a column to the processing activity's name before importing.", [
          { field: "mapping", issue: "name is not mapped" },
        ]);
      }
      if (c.body.dryRun) {
        return ok({ dryRun: true, ...proposal, valid: valid.length, rejected, warnings }, c.request);
      }
      if (valid.length === 0) {
        // A file with no importable row is refused as a whole; nothing is written.
        throw new ApiError(422, "VALIDATION_ERROR", "No row in the file can be imported — fix the rows listed and try again.", rejected.flatMap((r) => r.errors.map((e) => ({ field: `row ${r.row}: ${e.field}`, issue: e.issue }))));
      }

      // A department named exactly as one in the register is linked; anything
      // else stays as the text the file gave. Deterministic, never a guess.
      const { data: departments, error: dError } = await c.supabase
        .from("departments")
        .select("id, name")
        .eq("organization_id", c.organizationId);
      if (dError) throw dError;
      const byName = new Map((departments ?? []).map((d) => [d.name.trim().toLowerCase(), d.id]));

      const rows = valid.map((v) => toRpcRow(v, byName.get((v.record.text.departmentText ?? "").trim().toLowerCase()) ?? null));
      const { data, error } = await c.supabase.rpc("import_ropa_records", {
        p_organization_id: c.organizationId,
        p_rows: rows,
      });
      if (error) throw rpcError(error) ?? error;
      const result = data as { imported: number; ids: string[]; rejected: { row: number; errors: { field: string; issue: string }[] }[] };
      const allRejected = [...rejected, ...result.rejected].sort((a, b) => a.row - b.row);
      if (result.imported === 0) {
        throw new ApiError(422, "VALIDATION_ERROR", "No row in the file could be imported.", allRejected.flatMap((r) => r.errors.map((e) => ({ field: `row ${r.row}: ${e.field}`, issue: e.issue }))));
      }
      return ok({ dryRun: false, ...proposal, imported: result.imported, ids: result.ids, rejected: allRejected, warnings }, c.request, { status: 201 });
    },
  },

  export: {
    options: { auth: "required", tenant: "fromParam", permission: "ropa.read" } as const,
    handler: async (ctx: TenantContext<undefined, undefined>) => {
      const c = ctx as Ctx;
      const rows = await readAllRecords(c.supabase, c.organizationId);
      const members = await activeMembers(c.supabase, c.organizationId);
      const names = await namesFor(c.supabase, members, rows.flatMap((r) => [r.owner_user_id, r.approved_by]));
      const today = todayInIndia();

      const lines = [
        // A comment line the importer skips: what this file is, and is not (D-011).
        csvCell(`# TrustStack DPDP Compass — ROPA / Processing Activity Register. A DPDP readiness register, not a statutory record. Exported ${today}.`),
        ropaExportHeaders().map(csvCell).join(","),
        ...rows.map((r) => ropaExportRow(r, names).map(csvCell).join(",")),
      ];

      // A file leaving the system is audited, every time (Rule 6(c)).
      await c.audit([
        {
          organizationId: c.organizationId,
          eventType: "ropa.register.exported",
          entityType: "organizations",
          entityId: c.organizationId,
          description: "Exported the ROPA register",
          metadata: { format: "csv", recordCount: rows.length },
        },
      ]);

      return new Response(`﻿${lines.join("\r\n")}\r\n`, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="ropa-register-${today}.csv"`,
          "Cache-Control": "no-store",
          "X-Content-Type-Options": "nosniff",
        },
      });
    },
  },

  lookup: {
    options: { auth: "required", tenant: "fromParam", permission: "ropa.read", query: lookupQuery } as const,
    handler: async (ctx: TenantContext<undefined, z.infer<typeof lookupQuery>>) => {
      const c = ctx as unknown as TenantContext<undefined, z.infer<typeof lookupQuery>>;
      const rows = (await readAllRecords(c.supabase, c.organizationId)).filter((r) => r.status !== "archived");
      const [systemLinks, vendorLinks] = await Promise.all([
        readAllLinks(c, "ropa_systems"),
        readAllLinks(c, "ropa_vendors"),
      ]);
      const { principal, systemId, vendorId } = c.query;

      // The choices: whose data the register names, and the registers' systems and vendors.
      const principals = [
        ...new Map(
          rows
            .flatMap((r) => (r.data_principal_types ?? "").split(/[,;/\n]/))
            .map((p) => p.trim())
            .filter((p) => p !== "" && isResolvedPrincipal(p))
            .map((p) => [p.toLowerCase(), p.charAt(0).toUpperCase() + p.slice(1)] as const),
        ).values(),
      ].sort((a, b) => a.localeCompare(b));
      const systems = [...new Map(systemLinks.map((l) => [l.targetId, l.targetName])).entries()].map(([id, name]) => ({ id, name }));
      const vendors = [...new Map(vendorLinks.map((l) => [l.targetId, l.targetName])).entries()].map(([id, name]) => ({ id, name }));

      type Match = { row: RecordRow; how: "linked" | "named" };
      let matches: Match[] = [];
      let subject: string | null = null;
      if (principal) {
        // A plain, case-insensitive substring of the record's own words — never a guess.
        const needle = principal.toLowerCase();
        subject = principal;
        matches = rows.filter((r) => (r.data_principal_types ?? "").toLowerCase().includes(needle)).map((row) => ({ row, how: "named" }));
      } else if (systemId || vendorId) {
        const links = systemId ? systemLinks : vendorLinks;
        const targetId = (systemId ?? vendorId)!;
        const { data: target, error } = await c.supabase
          .from(systemId ? "systems" : "vendors")
          .select("id, name")
          .eq("organization_id", c.organizationId)
          .eq("id", targetId)
          .maybeSingle();
        if (error) throw error;
        // Both ids, always: a foreign system or vendor id is a 404, never a match.
        if (!target) throw new ApiError(404, "NOT_FOUND", systemId ? "System not found." : "Vendor not found.");
        subject = target.name;
        const linked = new Set(links.filter((l) => l.targetId === targetId).map((l) => l.recordId));
        const needle = target.name.toLowerCase();
        matches = rows.flatMap((row): Match[] => {
          if (linked.has(row.id)) return [{ row, how: "linked" }];
          const text = (systemId ? row.systems_text : row.vendors_text) ?? "";
          return text.toLowerCase().includes(needle) ? [{ row, how: "named" }] : [];
        });
      }

      const namesOf = (links: typeof systemLinks, id: string) => links.filter((l) => l.recordId === id).map((l) => l.targetName);
      return ok(
        {
          principals,
          systems,
          vendors,
          subject,
          records: matches.map(({ row, how }) => ({
            id: row.id,
            recordCode: row.record_code,
            name: row.name,
            status: row.status,
            /** "linked" through the register's join tables; "named" in the record's own text. */
            match: how,
            dataPrincipalTypes: row.data_principal_types,
            dataCategories: row.data_categories,
            purpose: row.purpose,
            lawfulBasis: row.lawful_basis,
            lawfulBasisLabel: ROPA_LAWFUL_BASES.find((b) => b.code === row.lawful_basis)?.label ?? null,
            retentionRule: row.retention_rule,
            sharing: row.sharing,
            systems: namesOf(systemLinks, row.id),
            systemsText: row.systems_text,
            /** Who the data is shared with — what s.11(1)(b) asks a Fiduciary to name. */
            processors: namesOf(vendorLinks, row.id),
            vendorsText: row.vendors_text,
            childrenData: row.children_data,
            riskRating: row.risk_rating,
          })),
        },
        c.request,
      );
    },
  },

  gaps: {
    options: { auth: "required", tenant: "fromParam", permission: "ropa.read" } as const,
    handler: async (ctx: TenantContext<undefined, undefined>) => {
      const c = ctx as Ctx;
      if (!c.permissions.has("gap.read")) throw new ApiError(403, "FORBIDDEN", "You do not have permission to do that.");
      const members = await activeMembers(c.supabase, c.organizationId);
      return ok(
        {
          ...(await readRopaGapRegister(c.supabase, c.organizationId, members)),
          members: c.permissions.has("gap.write") ? members : [],
        },
        c.request,
      );
    },
  },

  generateGaps: {
    options: { auth: "required", tenant: "fromParam", permission: "ropa.write" } as const,
    handler: async (ctx: TenantContext<undefined, undefined>) => {
      const c = ctx as Ctx;
      // One id and nothing else: every gap is derived inside the RPC, in SQL.
      const { data, error } = await c.supabase.rpc("generate_ropa_gaps", { p_organization_id: c.organizationId });
      if (error) throw rpcError(error) ?? error;
      const result = (data ?? {}) as Record<string, number>;
      return ok(
        {
          counts: {
            gapCount: result.gapCount ?? 0,
            critical: result.critical ?? 0,
            high: result.high ?? 0,
            medium: result.medium ?? 0,
            low: result.low ?? 0,
            supersededCount: result.supersededCount ?? 0,
          },
          changes: { opened: result.opened ?? 0, superseded: result.superseded ?? 0, removed: result.removed ?? 0 },
        },
        c.request,
      );
    },
  },

  updateAction: {
    options: { auth: "required", tenant: "fromParam", permission: "gap.write", body: actionPatchBody } as const,
    handler: async (ctx: TenantContext<z.infer<typeof actionPatchBody>, undefined>) => {
      const action = await requireRopaAction(ctx as Ctx);
      // The SAME update as an assessment action: one workflow, one closing rule (D-056, D-060).
      await applyActionUpdate(ctx, action);
      const members = await activeMembers(ctx.supabase, ctx.organizationId);
      const [gap] = await readRopaGaps(ctx.supabase, ctx.organizationId, members, { gapId: action.ropa_gap_id! });
      return ok({ gap }, ctx.request);
    },
  },

  unlinkActionEvidence: {
    options: { auth: "required", tenant: "fromParam", permission: "gap.write" } as const,
    handler: async (ctx: TenantContext<undefined, undefined>) => {
      const action = await requireRopaAction(ctx as Ctx);
      await detachActionEvidence(ctx as Ctx, action);
      const members = await activeMembers(ctx.supabase, ctx.organizationId);
      const [gap] = await readRopaGaps(ctx.supabase, ctx.organizationId, members, { gapId: action.ropa_gap_id! });
      return ok({ gap }, ctx.request);
    },
  },
};

/** A name the register can offer as a choice: not an "Unknown" or a placeholder. */
function isResolvedPrincipal(value: string) {
  return !/^(unknown|n\/?a|-|other)$/i.test(value);
}

/** Every link of one register, paged (PostgREST caps a response at 1,000 rows). */
async function readAllLinks(ctx: Ctx, table: "ropa_systems" | "ropa_vendors") {
  const page = 1000;
  const out: { recordId: string; targetId: string; targetName: string }[] = [];
  for (let from = 0; ; from += page) {
    const query =
      table === "ropa_systems"
        ? ctx.supabase.from("ropa_systems").select("ropa_record_id, system_id, systems(name)")
        : ctx.supabase.from("ropa_vendors").select("ropa_record_id, vendor_id, vendors(name)");
    const { data, error } = await query.eq("organization_id", ctx.organizationId).range(from, from + page - 1);
    if (error) throw error;
    for (const row of (data ?? []) as Record<string, unknown>[]) {
      const target = (row.systems ?? row.vendors) as { name: string } | null;
      out.push({
        recordId: row.ropa_record_id as string,
        targetId: (row.system_id ?? row.vendor_id) as string,
        targetName: target?.name ?? "",
      });
    }
    if ((data ?? []).length < page) return out;
  }
}

/** Both ids, always — a foreign ROPA gap or action id under this path is a 404. */
async function requireRopaAction(ctx: Ctx): Promise<ActionRow> {
  const gapId = z.uuid().safeParse(ctx.params.ropaGapId);
  const actionId = z.uuid().safeParse(ctx.params.actionId);
  if (!gapId.success || !actionId.success) throw new ApiError(404, "NOT_FOUND", "Action not found.");
  const { data, error } = await ctx.supabase
    .from("gap_actions")
    .select(ACTION_COLUMNS)
    .eq("id", actionId.data)
    .eq("organization_id", ctx.organizationId)
    .eq("ropa_gap_id", gapId.data)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new ApiError(404, "NOT_FOUND", "Action not found.");
  return data as ActionRow;
}
