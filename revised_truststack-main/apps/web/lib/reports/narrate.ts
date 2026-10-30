import "server-only";
import { narratedDocument, numbersNotInDocument, reportDocumentText, type ReportDocument, type ReportNarrative } from "@truststack/core";
import { ApiError, rpcError, type TenantContext } from "@/lib/api/guard";
import { namesFor } from "@/lib/gaps/shape";
import type { AppSupabaseClient } from "@/lib/supabase/server";
import { NARRATABLE_KINDS, runGeneration, toApi, type Begun } from "./generate";
import { readReportRow, type ReportRow } from "./store";

/**
 * A report's narrative (SLICE_11 §7c.5; D-133.1). The Exposure Brief, the Programme
 * Status Report and the evidence pack keep the document they printed. A narrative is
 * drafted from that STORED document; once a person accepts it, someone holding
 * `report.generate` prints version N+1 — version N's stored document with the
 * narrative in front: the same snapshot, the same figures, a new file, version N
 * untouched (D-076). `begin_narrated_report` and `complete_report` enforce it again.
 */

/** A finished version that kept its document and is not itself narrated — or the reason it cannot carry a narrative. */
export async function readNarratableReport(
  supabase: AppSupabaseClient,
  organizationId: string,
  reportId: string,
): Promise<{ row: ReportRow; document: ReportDocument }> {
  const row = await readReportRow(supabase, organizationId, reportId);
  if (!row) throw new ApiError(404, "NOT_FOUND", "Report not found.");
  if (!(NARRATABLE_KINDS as readonly string[]).includes(row.kind)) {
    throw new ApiError(409, "CONFLICT", "Only an Exposure Brief, a Programme Status Report or an evidence pack can carry a narrative.");
  }
  if (row.status !== "ready") throw new ApiError(409, "CONFLICT", "Only a finished report can carry a narrative.");
  if (row.narrated_from_id) {
    throw new ApiError(409, "CONFLICT", "This version already carries a narrative. Draft a new one on the version it was made from.");
  }
  const { data, error } = await supabase.from("reports").select("document").eq("organization_id", organizationId).eq("id", row.id).maybeSingle();
  if (error) throw error;
  const document = (data?.document ?? null) as ReportDocument | null;
  if (!document) {
    throw new ApiError(409, "CONFLICT", "This version was generated before reports kept their figures. Generate a new version, then draft its narrative.");
  }
  return { row, document };
}

/**
 * For the report list: each narratable version's latest ACCEPTED narrative that has no
 * narrated version yet (a failed attempt may be retried) — so "Print the narrated version"
 * survives a reload. Read through RLS (ai.use + report.read); none for a reader without them.
 */
export async function pendingNarratives(supabase: AppSupabaseClient, organizationId: string, rows: readonly ReportRow[]): Promise<Map<string, string>> {
  const sources = rows.filter((r) => r.document_kind !== null && r.narrated_from_id === null && r.status === "ready").map((r) => r.id);
  if (sources.length === 0) return new Map();
  const { data, error } = await supabase
    .from("ai_drafts")
    .select("id, target_id, decided_at")
    .eq("organization_id", organizationId)
    .eq("task", "report_narrative_draft")
    .eq("status", "accepted")
    .in("target_id", sources)
    .order("decided_at", { ascending: false });
  if (error) throw error;
  const printed = new Set(rows.filter((r) => r.narrative_draft_id && r.status !== "failed").map((r) => r.narrative_draft_id!));
  const out = new Map<string, string>();
  for (const d of data ?? []) if (d.target_id && !printed.has(d.id) && !out.has(d.target_id)) out.set(d.target_id, d.id);
  return out;
}

/** The person's narrative may state only the stored report's numbers too (D-133.1) — checked when it is accepted. */
export function narrativeNumberProblem(narrative: ReportNarrative, document: ReportDocument): string | null {
  const missing = numbersNotInDocument([narrative.headline, ...narrative.paragraphs, ...narrative.bullets].join("\n"), reportDocumentText(document));
  return missing.length === 0
    ? null
    : `The narrative states ${missing.map((n) => `“${n}”`).join(", ")}, which ${missing.length === 1 ? "is" : "are"} not in this version's figures. Use the report's own numbers, or refer to a provision by its citation.`;
}

interface NarrativeDraftRow {
  id: string;
  status: string;
  target_id: string | null;
  accepted_output: ReportNarrative | null;
  decided_by: string | null;
  decided_at: string | null;
}

/** POST …/reports/{reportId}/narrate — print version N+1 with the accepted narrative. Never automatic. */
export async function generateNarratedReport(ctx: TenantContext<unknown, unknown>, reportId: string, draftId: string) {
  const { supabase, organizationId, user } = ctx;
  const { row: source, document } = await readNarratableReport(supabase, organizationId, reportId);

  const { data, error } = await supabase
    .from("ai_drafts")
    .select("id, status, target_id, accepted_output, decided_by, decided_at")
    .eq("organization_id", organizationId)
    .eq("id", draftId)
    .eq("task", "report_narrative_draft")
    .maybeSingle();
  if (error) throw error;
  const draft = data as NarrativeDraftRow | null;
  if (!draft || draft.target_id !== source.id) throw new ApiError(404, "NOT_FOUND", "Narrative not found for this report.");
  if (draft.status !== "accepted" || !draft.accepted_output || !draft.decided_at) throw new ApiError(409, "CONFLICT", "Accept the narrative first.");

  const names = await namesFor(supabase, [], [draft.decided_by]);
  const generated = await runGeneration(
    ctx,
    async () => {
      const begin = await supabase.rpc("begin_narrated_report", { p_organization_id: organizationId, p_report_id: source.id, p_draft_id: draft.id });
      if (begin.error) throw rpcError(begin.error) ?? begin.error;
      return begin.data as unknown as Begun;
    },
    async (begun) => ({
      format: "pdf",
      doc: narratedDocument(document, {
        version: begun.version,
        sourceVersion: source.version,
        sourceGeneratedAt: source.generated_at,
        generatedAt: new Date().toISOString(),
        generatedByName: user.fullName,
        narrative: draft.accepted_output!,
        acceptedByName: draft.decided_by ? (names.get(draft.decided_by) ?? null) : null,
        acceptedAt: draft.decided_at!,
      }),
    }),
  );
  return {
    report: await toApi(ctx, generated.begun.id),
    narratedFrom: { id: source.id, version: source.version },
    generation: { totalMs: generated.totalMs, renderMs: generated.renderMs, bytes: generated.bytes },
  };
}
