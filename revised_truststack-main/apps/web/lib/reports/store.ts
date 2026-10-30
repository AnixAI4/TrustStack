import "server-only";
import { REPORT_STATUS_LABEL, isReportKind, reportKindDefinition, type ReportKind, type ReportStatus } from "@truststack/core";
import { activeMembers } from "@/lib/gaps/shape";
import type { AppSupabaseClient } from "@/lib/supabase/server";

/**
 * The report store (Slice 9, Stage 3): reading `reports` rows. A row is
 * written ONLY by `begin_report` / `complete_report` / `fail_report`
 * (migration 20261010000000_reports) — this file never inserts, updates or
 * deletes one, and `tests/unit/report-store.test.ts` fails if it does.
 */

export const REPORTS_BUCKET = "reports";
/** Signed download URLs live a minute and every one is audited (as evidence, D-042). */
export const REPORT_DOWNLOAD_URL_SECONDS = 60;
/** A report still "generating" after this long has failed without saying so. */
const STALLED_AFTER_MS = 10 * 60 * 1000;

export const REPORT_COLUMNS =
  "id, organization_id, kind, format, version, subject_user_id, assessment_id, exposure_snapshot_id, as_of, status, storage_path, file_name, byte_size, generated_by, requested_at, generated_at, error, narrated_from_id, narrative_draft_id, document_kind:document->>kind" as const;

export interface ReportRow {
  id: string;
  organization_id: string;
  kind: string;
  format: string;
  version: number;
  subject_user_id: string | null;
  assessment_id: string | null;
  exposure_snapshot_id: string | null;
  as_of: string;
  status: string;
  storage_path: string;
  file_name: string;
  byte_size: number | string | null;
  generated_by: string | null;
  requested_at: string;
  generated_at: string | null;
  error: string | null;
  /** Stage 2b (D-133.1): the version a narrated one prints the figures of, and its accepted narrative. */
  narrated_from_id: string | null;
  narrative_draft_id: string | null;
  /** Whether it kept the document it printed (never the document itself in a list). */
  document_kind: string | null;
}

export function reportToApi(row: ReportRow, names: ReadonlyMap<string, string | null>, now = Date.now()) {
  const kind = isReportKind(row.kind) ? (row.kind as ReportKind) : null;
  const status = row.status as ReportStatus;
  return {
    id: row.id,
    kind: row.kind,
    kindLabel: kind ? reportKindDefinition(kind).label : row.kind,
    format: row.format,
    version: row.version,
    status,
    statusLabel: REPORT_STATUS_LABEL[status] ?? row.status,
    /** Still "generating" long after it started: it will not finish. */
    stalled: status === "running" && now - Date.parse(row.requested_at) > STALLED_AFTER_MS,
    fileName: row.file_name,
    byteSize: row.byte_size === null ? null : Number(row.byte_size),
    /** The date in India it describes (D-055). */
    asOf: row.as_of,
    requestedAt: row.requested_at,
    generatedAt: row.generated_at,
    generatedBy: row.generated_by,
    generatedByName: row.generated_by ? (names.get(row.generated_by) ?? null) : null,
    subjectUserId: row.subject_user_id,
    /** The owner an Owner Action Pack is for. */
    subjectName: row.subject_user_id
      ? names.has(row.subject_user_id)
        ? (names.get(row.subject_user_id) ?? null)
        : "A former member"
      : null,
    assessmentId: row.assessment_id,
    exposureSnapshotId: row.exposure_snapshot_id,
    error: row.error,
    /** A finished version that kept its figures and has no narrative of its own: a narrative may be drafted on it (D-133.1). */
    narratable: status === "ready" && row.document_kind !== null && row.narrated_from_id === null,
    /** A narrated version: the version whose figures it prints. */
    narratedFromId: row.narrated_from_id,
  };
}

export type ReportApi = ReturnType<typeof reportToApi>;

export async function memberNames(supabase: AppSupabaseClient, organizationId: string) {
  const members = await activeMembers(supabase, organizationId);
  return new Map(members.map((m) => [m.userId, m.fullName]));
}

/** One row, by RLS, scoped to the organisation — or null (another tenant's id is simply not found). */
export async function readReportRow(supabase: AppSupabaseClient, organizationId: string, reportId: string): Promise<ReportRow | null> {
  const { data, error } = await supabase
    .from("reports")
    .select(REPORT_COLUMNS)
    .eq("organization_id", organizationId)
    .eq("id", reportId)
    .maybeSingle();
  if (error) throw error;
  return (data as ReportRow | null) ?? null;
}

export async function listReportRows(
  supabase: AppSupabaseClient,
  organizationId: string,
  options: { kind?: string; limit: number },
): Promise<ReportRow[]> {
  let query = supabase.from("reports").select(REPORT_COLUMNS).eq("organization_id", organizationId);
  if (options.kind) query = query.eq("kind", options.kind);
  const { data, error } = await query
    .order("requested_at", { ascending: false })
    .order("version", { ascending: false })
    .limit(options.limit);
  if (error) throw error;
  return (data ?? []) as ReportRow[];
}
