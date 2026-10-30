import "server-only";
import { AVAILABLE_REPORT_KINDS, REPORT_KINDS, can, isReportKind, reportKindDefinition, type ReportKind } from "@truststack/core";
import { z } from "zod";
import { ApiError, type TenantContext } from "@/lib/api/guard";
import { ok } from "@/lib/api/envelope";
import { assertExposureInputs } from "@/lib/exposure/read";
import { generateReport } from "./generate";
import { generateNarratedReport, pendingNarratives } from "./narrate";
import {
  REPORTS_BUCKET,
  REPORT_DOWNLOAD_URL_SECONDS,
  listReportRows,
  memberNames,
  readReportRow,
  reportToApi,
  type ReportRow,
} from "./store";

/**
 * The report routes (Slice 9, Stages 3–4; SLICE_09 §9). Every handler goes
 * through `withApi`; RLS on `reports` and the bucket's policies are the
 * second lock (D-042). Permissions are the existing ones (decision 9):
 * `report.read` to list, `report.generate` to generate or regenerate,
 * `report.download` for a signed URL — except that an owner may generate and
 * download their OWN Owner Action Pack with `gap.read` (so the generate
 * routes are guarded by `report.read`, and the rule is checked here and again
 * in `begin_report`). An exposure report also records an exposure snapshot,
 * so it needs `score.calculate` and every input the exposure view reads.
 */

const kindEnum = z.enum(AVAILABLE_REPORT_KINDS as [ReportKind, ...ReportKind[]]);
const createBody = z
  .object({
    kind: kindEnum,
    /** Optional; when sent it must be the kind's own format. */
    format: z.enum(["pdf", "xlsx"]).optional(),
    /** The owner an Owner Action Pack is for — required for that kind, refused for any other. */
    ownerUserId: z.uuid().optional(),
  })
  .strict();
const listQuery = z
  .object({
    kind: z.enum(REPORT_KINDS as unknown as [ReportKind, ...ReportKind[]]).optional(),
    limit: z.coerce.number().int().min(1).max(200).default(50),
  })
  .strict();
const reportParams = z.object({ reportId: z.uuid() });
const narrateBody = z.object({ draftId: z.uuid() }).strict();

/**
 * May this person generate this kind (for this owner)? Checked here for the
 * message; `begin_report` checks again (decision 9): anyone's report with
 * `report.generate`; your OWN Owner Action Pack with `gap.read`.
 */
function assertCanGenerate(permissions: ReadonlySet<string>, kind: ReportKind, userId: string, ownerUserId: string | null) {
  const own = reportKindDefinition(kind).perOwner && ownerUserId === userId && can(permissions, "gap.read");
  if (!can(permissions, "report.generate") && !own) {
    throw new ApiError(403, "FORBIDDEN", "You do not have permission to generate this report.");
  }
  if (!reportKindDefinition(kind).recordsExposure) return;
  if (!can(permissions, "score.calculate") || !can(permissions, "score.read")) {
    throw new ApiError(403, "FORBIDDEN", "This report records an exposure snapshot, which needs permission to calculate scores.");
  }
  assertExposureInputs(permissions);
}

async function requireReport(ctx: TenantContext<unknown, unknown>): Promise<ReportRow> {
  const parsed = reportParams.safeParse(ctx.params);
  // A malformed id is simply not found — the same answer as another tenant's.
  const row = parsed.success ? await readReportRow(ctx.supabase, ctx.organizationId, parsed.data.reportId) : null;
  if (!row) throw new ApiError(404, "NOT_FOUND", "Report not found.");
  return row;
}

export const reports = {
  list: {
    options: { auth: "required", tenant: "fromParam", permission: "report.read", query: listQuery } as const,
    handler: async (ctx: TenantContext<undefined, z.infer<typeof listQuery>>) => {
      const { supabase, organizationId, query, request } = ctx;
      const [rows, names] = await Promise.all([
        listReportRows(supabase, organizationId, { kind: query.kind, limit: query.limit }),
        memberNames(supabase, organizationId),
      ]);
      // Slice 11 Stage 2b: an accepted narrative not yet printed (a list's newest rows; the reader's own RLS).
      const pending = await pendingNarratives(supabase, organizationId, rows);
      return ok(
        {
          organizationId,
          /** Newest first. A report is never edited or deleted; regenerating adds a version. */
          reports: rows.map((r) => ({ ...reportToApi(r, names), pendingNarrativeDraftId: pending.get(r.id) ?? null })),
        },
        request,
      );
    },
  },

  read: {
    options: { auth: "required", tenant: "fromParam", permission: "report.read" } as const,
    handler: async (ctx: TenantContext<undefined, undefined>) => {
      const row = await requireReport(ctx as TenantContext<unknown, unknown>);
      return ok({ report: reportToApi(row, await memberNames(ctx.supabase, ctx.organizationId)) }, ctx.request);
    },
  },

  create: {
    // `report.read`, not `report.generate`: an owner may generate their own pack (decision 9).
    options: { auth: "required", tenant: "fromParam", permission: "report.read", body: createBody } as const,
    handler: async (ctx: TenantContext<z.infer<typeof createBody>, undefined>) => {
      const { body, permissions, user, request } = ctx;
      const def = reportKindDefinition(body.kind);
      if (body.format && body.format !== def.format) {
        throw new ApiError(400, "VALIDATION_ERROR", `${def.label} is a ${def.format.toUpperCase()} report.`, [
          { field: "format", issue: `must be ${def.format}` },
        ]);
      }
      if (def.perOwner !== (body.ownerUserId !== undefined)) {
        throw new ApiError(400, "VALIDATION_ERROR", def.perOwner ? "Choose whose pack to generate." : "Only an Owner Action Pack names an owner.", [
          { field: "ownerUserId", issue: def.perOwner ? "required" : "not allowed for this kind" },
        ]);
      }
      assertCanGenerate(permissions, body.kind, user.id, body.ownerUserId ?? null);
      const result = await generateReport(ctx as TenantContext<unknown, unknown>, body.kind, { ownerUserId: body.ownerUserId });
      return ok(result, request, { status: 201 });
    },
  },

  regenerate: {
    // As `create`: an owner may regenerate their own pack.
    options: { auth: "required", tenant: "fromParam", permission: "report.read" } as const,
    handler: async (ctx: TenantContext<undefined, undefined>) => {
      const { permissions, user, request } = ctx;
      const row = await requireReport(ctx as TenantContext<unknown, unknown>);
      if (!isReportKind(row.kind) || !(AVAILABLE_REPORT_KINDS as readonly string[]).includes(row.kind)) {
        throw new ApiError(422, "VALIDATION_ERROR", "This kind of report cannot be generated yet.");
      }
      const kind = row.kind as ReportKind;
      assertCanGenerate(permissions, kind, user.id, row.subject_user_id);
      // A NEW version — for an owner's pack, of the same owner's pack; for an
      // exposure report, with a fresh snapshot. The old version and its file
      // are never touched.
      const result = await generateReport(ctx as TenantContext<unknown, unknown>, kind, { ownerUserId: row.subject_user_id ?? undefined });
      return ok({ ...result, regeneratedFrom: { id: row.id, version: row.version } }, request, { status: 201 });
    },
  },

  /**
   * POST …/reports/{reportId}/narrate — Stage 2b (D-133.1): version N+1, version N's STORED
   * figures with an accepted narrative in front. A person asks for it; it is never automatic.
   * No new exposure snapshot: nothing is recomputed, so `report.generate` alone.
   */
  narrate: {
    options: { auth: "required", tenant: "fromParam", permission: "report.generate", body: narrateBody } as const,
    handler: async (ctx: TenantContext<z.infer<typeof narrateBody>, undefined>) => {
      const row = await requireReport(ctx as TenantContext<unknown, unknown>);
      const result = await generateNarratedReport(ctx as TenantContext<unknown, unknown>, row.id, ctx.body.draftId);
      return ok(result, ctx.request, { status: 201 });
    },
  },

  downloadUrl: {
    options: { auth: "required", tenant: "fromParam", permission: "report.read" } as const,
    handler: async (ctx: TenantContext<undefined, undefined>) => {
      const { supabase, organizationId, permissions, user, request } = ctx;
      const row = await requireReport(ctx as TenantContext<unknown, unknown>);
      // report.download — or, for an owner's pack, being its owner (decision 9).
      const ownPack = row.kind === "owner_action_pack" && row.subject_user_id === user.id;
      if (!can(permissions, "report.download") && !ownPack) {
        throw new ApiError(403, "FORBIDDEN", "You do not have permission to download reports.");
      }
      if (row.status !== "ready") {
        throw new ApiError(409, "CONFLICT", row.status === "failed" ? "This report failed to generate; generate it again." : "This report is still being generated.");
      }

      // Signed with the caller's JWT: Storage checks the bucket's policy again.
      const signed = await supabase.storage
        .from(REPORTS_BUCKET)
        .createSignedUrl(row.storage_path, REPORT_DOWNLOAD_URL_SECONDS, { download: row.file_name });
      if (signed.error || !signed.data) throw new ApiError(404, "NOT_FOUND", "The report file is not available.");

      // Every issuance, every time (Rule 6(1)(c)).
      await ctx.audit([
        {
          organizationId,
          eventType: "report.download_url.issued",
          entityType: "reports",
          entityId: row.id,
          description: "Issued a signed report download URL",
          metadata: { kind: row.kind, version: row.version, fileName: row.file_name, expiresInSeconds: REPORT_DOWNLOAD_URL_SECONDS },
        },
      ]);

      return ok({ url: signed.data.signedUrl, expiresInSeconds: REPORT_DOWNLOAD_URL_SECONDS, fileName: row.file_name }, request);
    },
  },
};
