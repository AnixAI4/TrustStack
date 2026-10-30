import "server-only";
import {
  DATA_LOCATIONS,
  DATA_PRINCIPAL_CODES,
  HOSTING_MODELS,
  isCalendarDate,
  SYSTEM_TYPES,
  TRI_STATES,
  VENDOR_ROLES,
} from "@truststack/core";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { ApiError, type TenantContext } from "@/lib/api/guard";
import { ok } from "@/lib/api/envelope";
import { scopeDbError } from "./db-errors";

/**
 * The four scope registers — departments, systems, vendors, Data Principal
 * types — share one implementation (list · create · update · delete).
 *
 * Tenancy, twice (D-003): the guard proves membership of `{id}` and the
 * permission; every query ALSO filters `organization_id = {id}` and child
 * routes filter by both ids, so a child id from another organisation is a
 * plain 404. RLS write policies (scope.write) and composite FKs are the
 * database's lock. Audit is written by trigger in the same transaction (D-026).
 *
 * Internally untyped (`table` is dynamic); the API contract is typed by the
 * Zod schemas and mappers below.
 */

type Row = Record<string, unknown>;

interface RegisterConfig {
  /** Checks run BEFORE any write, so a rejected request leaves nothing behind. */
  validate?: (db: SupabaseClient, organizationId: string, input: Row) => Promise<void>;
  table: "departments" | "systems" | "vendors" | "data_principal_types";
  label: string;
  columns: string;
  order: string;
  create: z.ZodType<Row>;
  update: z.ZodType<Row>;
  toDb: (input: Row) => Row;
  toApi: (row: Row) => Row;
  /** Runs after insert/update with the parsed body (e.g. vendor ↔ system links). */
  afterWrite?: (db: SupabaseClient, organizationId: string, id: string, input: Row) => Promise<void>;
  /** Extra embedded selects for list/read. */
  embed?: string;
}

const tri = z.enum(TRI_STATES);
const name = z.string().trim().min(1).max(200);

function atLeastOne<T extends z.ZodRawShape>(shape: T) {
  return z
    .object(shape)
    .partial()
    .refine((v) => Object.values(v).some((x) => x !== undefined), { message: "Provide at least one field." });
}

function snake(input: Row, map: Record<string, string>): Row {
  const out: Row = {};
  for (const [k, v] of Object.entries(input)) if (v !== undefined && map[k]) out[map[k]] = v;
  return out;
}

const childIdParam = (params: Record<string, string>, key: string) => {
  const parsed = z.uuid().safeParse(params[key]);
  if (!parsed.success) throw new ApiError(400, "VALIDATION_ERROR", "Invalid id.", [{ field: key, issue: "must be a UUID" }]);
  return parsed.data;
};

function build(cfg: RegisterConfig, childParam: string) {
  const db = (ctx: { supabase: unknown }) => ctx.supabase as SupabaseClient;
  const select = cfg.embed ? `${cfg.columns}, ${cfg.embed}` : cfg.columns;

  async function readOne(client: SupabaseClient, organizationId: string, id: string) {
    const { data, error } = await client.from(cfg.table).select(select).eq("organization_id", organizationId).eq("id", id).maybeSingle();
    if (error) throw scopeDbError(error, "update");
    return data as Row | null;
  }

  return {
    list: {
      options: { auth: "required", tenant: "fromParam", permission: "organization.read" } as const,
      handler: async (ctx: TenantContext<undefined, undefined>) => {
        const { data, error } = await db(ctx).from(cfg.table).select(select).eq("organization_id", ctx.organizationId).order(cfg.order);
        if (error) throw scopeDbError(error, "update");
        return ok({ organizationId: ctx.organizationId, items: ((data ?? []) as unknown as Row[]).map(cfg.toApi) }, ctx.request);
      },
    },
    create: {
      options: { auth: "required", tenant: "fromParam", permission: "scope.write", body: cfg.create } as const,
      handler: async (ctx: TenantContext<Row, undefined>) => {
        const client = db(ctx);
        await cfg.validate?.(client, ctx.organizationId, ctx.body);
        const { data, error } = await client
          .from(cfg.table)
          .insert({ ...cfg.toDb(ctx.body), organization_id: ctx.organizationId })
          .select("id")
          .single();
        if (error) throw scopeDbError(error, "create");
        const id = (data as { id: string }).id;
        try {
          await cfg.afterWrite?.(client, ctx.organizationId, id, ctx.body);
        } catch (err) {
          // PostgREST has no multi-statement transaction: compensate so a failed
          // create never leaves a half-written row.
          await client.from(cfg.table).delete().eq("organization_id", ctx.organizationId).eq("id", id);
          throw err;
        }
        return ok({ item: cfg.toApi((await readOne(client, ctx.organizationId, id))!) }, ctx.request, { status: 201 });
      },
    },
    update: {
      options: { auth: "required", tenant: "fromParam", permission: "scope.write", body: cfg.update } as const,
      handler: async (ctx: TenantContext<Row, undefined>) => {
        const client = db(ctx);
        const id = childIdParam(ctx.params, childParam);
        await cfg.validate?.(client, ctx.organizationId, ctx.body);
        const patch = cfg.toDb(ctx.body);
        if (Object.keys(patch).length > 0) {
          const { data, error } = await client.from(cfg.table).update(patch).eq("organization_id", ctx.organizationId).eq("id", id).select("id");
          if (error) throw scopeDbError(error, "update");
          if (!data?.length) throw new ApiError(404, "NOT_FOUND", `${cfg.label} not found.`);
        } else if (!(await readOne(client, ctx.organizationId, id))) {
          throw new ApiError(404, "NOT_FOUND", `${cfg.label} not found.`);
        }
        await cfg.afterWrite?.(client, ctx.organizationId, id, ctx.body);
        return ok({ item: cfg.toApi((await readOne(client, ctx.organizationId, id))!) }, ctx.request);
      },
    },
    remove: {
      options: { auth: "required", tenant: "fromParam", permission: "scope.write" } as const,
      handler: async (ctx: TenantContext<undefined, undefined>) => {
        const id = childIdParam(ctx.params, childParam);
        const { data, error } = await db(ctx).from(cfg.table).delete().eq("organization_id", ctx.organizationId).eq("id", id).select("id");
        if (error) throw scopeDbError(error, "delete");
        if (!data?.length) throw new ApiError(404, "NOT_FOUND", `${cfg.label} not found.`);
        return ok({ deleted: id }, ctx.request);
      },
    },
  };
}

// ---------------------------------------------------------------------------

export const departments = build(
  {
    table: "departments",
    label: "Department",
    columns: "id, name, created_at",
    order: "name",
    create: z.object({ name }),
    update: atLeastOne({ name }),
    toDb: (i) => snake(i, { name: "name" }),
    toApi: (r) => ({ id: r.id, name: r.name }),
  },
  "departmentId",
);

const systemShape = {
  name,
  systemType: z.enum(SYSTEM_TYPES),
  hostingModel: z.enum(HOSTING_MODELS),
  dataLocation: z.enum(DATA_LOCATIONS),
  processesChildrenData: tri,
  ownerDepartmentId: z.uuid().nullable(),
};
const systemMap = {
  name: "name",
  systemType: "system_type",
  hostingModel: "hosting_model",
  dataLocation: "data_location",
  processesChildrenData: "processes_children_data",
  ownerDepartmentId: "owner_department_id",
};

export const systems = build(
  {
    table: "systems",
    label: "System",
    columns: "id, name, system_type, hosting_model, data_location, processes_children_data, owner_department_id",
    order: "name",
    create: z.object({
      ...systemShape,
      hostingModel: systemShape.hostingModel.default("unknown"),
      dataLocation: systemShape.dataLocation.default("unknown"),
      processesChildrenData: tri.default("unknown"),
      ownerDepartmentId: systemShape.ownerDepartmentId.default(null),
    }),
    update: atLeastOne(systemShape),
    toDb: (i) => snake(i, systemMap),
    toApi: (r) => ({
      id: r.id,
      name: r.name,
      systemType: r.system_type,
      hostingModel: r.hosting_model,
      dataLocation: r.data_location,
      processesChildrenData: r.processes_children_data,
      ownerDepartmentId: r.owner_department_id,
    }),
  },
  "systemId",
);

const vendorShape = {
  name,
  service: z.string().trim().max(300).nullable(),
  vendorRole: z.enum(VENDOR_ROLES),
  contractExists: tri,
  dpdpClauses: tri,
  crossBorder: tri,
  subProcessorsKnown: tri,
  /** Slice 10 Stage 4a: the contract's dates (the contract itself is a document attached to the vendor). */
  contractSignedOn: z.string().refine(isCalendarDate, "must be a calendar date, YYYY-MM-DD").nullable(),
  contractReviewBy: z.string().refine(isCalendarDate, "must be a calendar date, YYYY-MM-DD").nullable(),
  /** Replaces the vendor's system links. Each id must be a system of THIS organisation. */
  systemIds: z.array(z.uuid()).max(200),
};
const vendorMap = {
  name: "name",
  service: "service",
  vendorRole: "vendor_role",
  contractExists: "contract_exists",
  dpdpClauses: "dpdp_clauses",
  crossBorder: "cross_border",
  subProcessorsKnown: "sub_processors_known",
  contractSignedOn: "contract_signed_on",
  contractReviewBy: "contract_review_by",
};

export const vendors = build(
  {
    table: "vendors",
    label: "Vendor",
    columns: "id, name, service, vendor_role, contract_exists, dpdp_clauses, cross_border, sub_processors_known, contract_signed_on, contract_review_by",
    embed: "vendor_systems(system_id)",
    order: "name",
    create: z.object({
      ...vendorShape,
      service: vendorShape.service.default(null),
      vendorRole: vendorShape.vendorRole.default("unknown"),
      contractExists: tri.default("unknown"),
      dpdpClauses: tri.default("unknown"),
      crossBorder: tri.default("unknown"),
      subProcessorsKnown: tri.default("unknown"),
      contractSignedOn: vendorShape.contractSignedOn.default(null),
      contractReviewBy: vendorShape.contractReviewBy.default(null),
      systemIds: vendorShape.systemIds.default([]),
    }),
    update: atLeastOne(vendorShape),
    toDb: (i) => snake(i, vendorMap),
    toApi: (r) => ({
      id: r.id,
      name: r.name,
      service: r.service,
      vendorRole: r.vendor_role,
      contractExists: r.contract_exists,
      dpdpClauses: r.dpdp_clauses,
      crossBorder: r.cross_border,
      subProcessorsKnown: r.sub_processors_known,
      contractSignedOn: r.contract_signed_on,
      contractReviewBy: r.contract_review_by,
      systemIds: ((r.vendor_systems as { system_id: string }[] | undefined) ?? []).map((l) => l.system_id).sort(),
    }),
    validate: async (client, organizationId, input) => {
      const signed = input.contractSignedOn as string | null | undefined;
      const reviewBy = input.contractReviewBy as string | null | undefined;
      if (signed && reviewBy && reviewBy <= signed) {
        throw new ApiError(422, "VALIDATION_ERROR", "The contract's review date is after the date it was signed.", [
          { field: "contractReviewBy", issue: "after the signing date" },
        ]);
      }
      const wanted = input.systemIds as string[] | undefined;
      if (!wanted?.length) return;
      const unique = [...new Set(wanted)];
      const { data, error } = await client.from("systems").select("id").eq("organization_id", organizationId).in("id", unique);
      if (error) throw scopeDbError(error, "create");
      if ((data ?? []).length !== unique.length) {
        throw new ApiError(422, "VALIDATION_ERROR", "A referenced item does not exist in this organisation.", [
          { field: "systemIds", issue: "every system must belong to this organisation" },
        ]);
      }
    },
    afterWrite: async (client, organizationId, vendorId, input) => {
      const wanted = input.systemIds as string[] | undefined;
      if (wanted === undefined) return;
      const unique = [...new Set(wanted)];
      const { error: delError } = await client
        .from("vendor_systems")
        .delete()
        .eq("organization_id", organizationId)
        .eq("vendor_id", vendorId)
        .not("system_id", "in", `(${unique.length ? unique.join(",") : "00000000-0000-0000-0000-000000000000"})`);
      if (delError) throw scopeDbError(delError, "delete");
      if (unique.length) {
        const { error } = await client
          .from("vendor_systems")
          .upsert(
            unique.map((systemId) => ({ organization_id: organizationId, vendor_id: vendorId, system_id: systemId })),
            { onConflict: "vendor_id,system_id", ignoreDuplicates: true },
          );
        if (error) throw scopeDbError(error, "create");
      }
    },
  },
  "vendorId",
);

const dpShape = {
  code: z.enum(DATA_PRINCIPAL_CODES),
  label: name,
  includesChildren: tri,
  estimatedCount: z.number().int().min(0).max(2_000_000_000).nullable(),
};
const dpMap = { code: "code", label: "label", includesChildren: "includes_children", estimatedCount: "estimated_count" };

export const dataPrincipalTypes = build(
  {
    table: "data_principal_types",
    label: "Data Principal type",
    columns: "id, code, label, includes_children, estimated_count",
    order: "label",
    create: z.object({
      ...dpShape,
      includesChildren: tri.default("unknown"),
      estimatedCount: dpShape.estimatedCount.default(null),
    }),
    update: atLeastOne(dpShape),
    toDb: (i) => snake(i, dpMap),
    toApi: (r) => ({
      id: r.id,
      code: r.code,
      label: r.label,
      includesChildren: r.includes_children,
      estimatedCount: r.estimated_count,
    }),
  },
  "dataPrincipalTypeId",
);
