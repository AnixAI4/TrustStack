import "server-only";
import { capApplied } from "@truststack/core";
import { ApiError } from "@/lib/api/guard";
import type { AppSupabaseClient } from "@/lib/supabase/server";

/**
 * Row → API shapes for responses and evidence, and the database-error mapping
 * the Slice 4 routes share. Every level and adjusted score here was computed
 * by the database (migration 20260918200000_evidence_scoring); the API only
 * reports it.
 */

/** One literal string each: Supabase types a `select()` from the literal. */
export const RESPONSE_COLUMNS =
  "id, organization_id, assessment_id, question_code, applicability_decision, na_reason, claimed_maturity, evidence_level, adjusted_score, notes, answered_by, answered_at, updated_at" as const;
export const EVIDENCE_COLUMNS =
  "id, organization_id, storage_path, file_name, content_type, byte_size, uploaded_by, uploaded_at, review_status, evidence_level, reviewed_by, reviewed_at, review_notes" as const;

export interface ResponseRow {
  id: string;
  organization_id: string;
  assessment_id: string;
  question_code: string;
  applicability_decision: string;
  na_reason: string | null;
  claimed_maturity: number | null;
  evidence_level: number | null;
  adjusted_score: number | null;
  notes: string | null;
  answered_by: string | null;
  answered_at: string;
  updated_at: string;
}

export interface EvidenceRow {
  id: string;
  organization_id: string;
  storage_path: string;
  file_name: string;
  content_type: string;
  byte_size: number;
  uploaded_by: string | null;
  uploaded_at: string;
  review_status: string;
  evidence_level: number | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
}

/** The storage path is internal: clients address evidence by id, never by path. */
export function evidenceToApi(row: EvidenceRow) {
  return {
    id: row.id,
    organizationId: row.organization_id,
    fileName: row.file_name,
    contentType: row.content_type,
    byteSize: row.byte_size,
    uploadedBy: row.uploaded_by,
    uploadedAt: row.uploaded_at,
    reviewStatus: row.review_status,
    evidenceLevel: row.evidence_level,
    reviewedBy: row.reviewed_by,
    reviewedAt: row.reviewed_at,
    reviewNotes: row.review_notes,
  };
}

export function responseToApi(row: ResponseRow, evidence: EvidenceRow[] = []) {
  const applicable = row.applicability_decision === "applicable" && row.claimed_maturity !== null;
  return {
    id: row.id,
    assessmentId: row.assessment_id,
    questionCode: row.question_code,
    applicabilityDecision: row.applicability_decision,
    naReason: row.na_reason,
    claimedMaturity: row.claimed_maturity,
    /** The strongest REVIEWED artefact; null = nothing reviewed yet, scored as E0. */
    evidenceLevel: row.evidence_level,
    adjustedScore: row.adjusted_score,
    /** True when the evidence held the claim down — the UI names the cap. */
    capApplied: applicable ? capApplied(row.claimed_maturity!, row.evidence_level) : false,
    notes: row.notes,
    answeredBy: row.answered_by,
    answeredAt: row.answered_at,
    evidence: evidence.map(evidenceToApi),
  };
}

/**
 * Postgres errors the Slice 4 tables raise → the envelope. Custom TS* codes
 * are mapped by the guard; these are the standard ones a write can hit.
 */
export function mapWriteError(error: { code?: string; message: string }, notFound = "Not found."): never {
  switch (error.code) {
    case "23514": // CHECK — the database's own copy of a rule Zod also checks
      throw new ApiError(422, "VALIDATION_ERROR", "That answer breaks a scoring rule.", [{ issue: error.message }]);
    case "23503": // FK — e.g. a question that is not in this assessment's snapshot
      throw new ApiError(404, "NOT_FOUND", notFound);
    case "23505":
      throw new ApiError(409, "CONFLICT", "That already exists.");
    case "PGRST116": // .single() matched no row — RLS filtered it, or it is not there
      throw new ApiError(404, "NOT_FOUND", notFound);
    default:
      throw error;
  }
}

/**
 * The artefacts linked to each of a register's rows, by link type (Slice 10
 * Stage 5: `retention_schedule`, `ai_system`; Stage 6: `breach_incident`,
 * `rights_request`), oldest upload first. Links are polymorphic (D-008), so
 * this reads the links, then the artefacts.
 */
export async function evidenceByLinkedEntity(
  supabase: AppSupabaseClient,
  organizationId: string,
  type: "retention_schedule" | "ai_system" | "breach_incident" | "rights_request",
  entityIds: readonly string[],
): Promise<Map<string, EvidenceRow[]>> {
  const out = new Map<string, EvidenceRow[]>();
  if (entityIds.length === 0) return out;
  const links: { evidence_id: string; linked_entity_id: string }[] = [];
  for (let i = 0; i < entityIds.length; i += 80) {
    const { data, error } = await supabase
      .from("evidence_links")
      .select("evidence_id, linked_entity_id")
      .eq("organization_id", organizationId)
      .eq("linked_entity_type", type)
      .in("linked_entity_id", entityIds.slice(i, i + 80));
    if (error) throw error;
    links.push(...(data ?? []));
  }
  const ids = [...new Set(links.map((l) => l.evidence_id))];
  const rows = new Map<string, EvidenceRow>();
  for (let i = 0; i < ids.length; i += 80) {
    const { data, error } = await supabase.from("evidence").select(EVIDENCE_COLUMNS).eq("organization_id", organizationId).in("id", ids.slice(i, i + 80));
    if (error) throw error;
    for (const r of data ?? []) rows.set(r.id, r as EvidenceRow);
  }
  for (const l of links) {
    const e = rows.get(l.evidence_id);
    if (e) out.set(l.linked_entity_id, [...(out.get(l.linked_entity_id) ?? []), e]);
  }
  for (const list of out.values()) list.sort((a, b) => a.uploaded_at.localeCompare(b.uploaded_at));
  return out;
}
