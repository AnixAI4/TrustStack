import "server-only";
import {
  RETENTION_BASIS_LABEL,
  RETENTION_BASIS_PROVISION,
  RIGHTS_KIND_LABEL,
  type DomainCode,
  type EvidenceIndexEntry,
  type EvidenceLinkLine,
  type EvidenceReviewStatus,
  type ReportActionLine,
  type RetentionBasis,
  type RightsKind,
} from "@truststack/core";
import { chunks, namesFor, type Member } from "@/lib/gaps/shape";
import { retentionContext, retentionParentName } from "@/lib/retention/shape";
import type { RecordRow } from "@/lib/ropa/shape";
import type { AppSupabaseClient } from "@/lib/supabase/server";
import { EVIDENCE_COLUMNS, type EvidenceRow } from "./shape";

/**
 * The evidence index (Slice 9, Stage 4): every stored artefact of an
 * organisation, with who uploaded and reviewed it and everything it is linked
 * to — an assessment ANSWER, a remediation ACTION or a register RECORD
 * (D-064's three link types) and, since Slice 10 Stage 6, a VENDOR, a
 * RETENTION SCHEDULE, an AI SYSTEM, a BREACH or a RIGHTS REQUEST — in plain
 * words, each named as its register names it and never by a person's
 * personal data (a request by its code and kind).
 *
 * Read, never computed: each level and verdict is the one stored by the
 * review (Slice 4). Every read is PAGED or CHUNKED (PostgREST caps a response
 * at 1,000 rows, and a long `in.(…)` outgrows the URL — pitfall 8). A
 * question is named by its text from the assessment's SNAPSHOT (D-035), never
 * by its code (D-071); the code is used only to join and is never returned.
 * The caller hands over the actions and records it already read, so a link
 * to an action names it exactly as the tracker does.
 */

const PAGE = 1000;

interface LinkRow {
  evidence_id: string;
  linked_entity_type: string;
  linked_entity_id: string;
}

/** The files a vendor's respondent sent through the questionnaire link (Stage 4b) — no member uploaded them (F4.7). */
async function readVendorLinkUploads(supabase: AppSupabaseClient, organizationId: string): Promise<Set<string>> {
  const out = new Set<string>();
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from("vendor_link_documents")
      .select("evidence_id")
      .eq("organization_id", organizationId)
      .order("evidence_id")
      .range(from, from + PAGE - 1);
    if (error) throw error;
    for (const d of data ?? []) out.add(d.evidence_id);
    if ((data ?? []).length < PAGE) return out;
  }
}

async function readAllEvidence(supabase: AppSupabaseClient, organizationId: string): Promise<EvidenceRow[]> {
  const out: EvidenceRow[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from("evidence")
      .select(EVIDENCE_COLUMNS)
      .eq("organization_id", organizationId)
      .order("uploaded_at")
      .order("id")
      .range(from, from + PAGE - 1);
    if (error) throw error;
    out.push(...((data ?? []) as EvidenceRow[]));
    if ((data ?? []).length < PAGE) return out;
  }
}

async function readAllLinks(supabase: AppSupabaseClient, organizationId: string): Promise<LinkRow[]> {
  const out: LinkRow[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from("evidence_links")
      .select("evidence_id, linked_entity_type, linked_entity_id")
      .eq("organization_id", organizationId)
      .order("linked_at")
      .order("id")
      .range(from, from + PAGE - 1);
    if (error) throw error;
    out.push(...((data ?? []) as LinkRow[]));
    if ((data ?? []).length < PAGE) return out;
  }
}

/** For each linked answer: its assessment's name, its domain and its question's text — from the snapshot. */
async function answerContexts(
  supabase: AppSupabaseClient,
  organizationId: string,
  responseIds: readonly string[],
  assessmentNames: ReadonlyMap<string, string>,
): Promise<Map<string, Extract<EvidenceLinkLine, { type: "assessment_response" }>>> {
  const responses: { id: string; assessment_id: string; question_code: string }[] = [];
  for (const ids of chunks(responseIds)) {
    const { data, error } = await supabase
      .from("assessment_responses")
      .select("id, assessment_id, question_code")
      .eq("organization_id", organizationId)
      .in("id", ids);
    if (error) throw error;
    responses.push(...(data ?? []));
  }

  const questions = new Map<string, { question_text: string; domain_code: string }>();
  const byAssessment = new Map<string, string[]>();
  for (const r of responses) byAssessment.set(r.assessment_id, [...(byAssessment.get(r.assessment_id) ?? []), r.question_code]);
  for (const [assessmentId, codes] of byAssessment) {
    for (const part of chunks([...new Set(codes)])) {
      const { data, error } = await supabase
        .from("assessment_questions")
        .select("question_code, question_text, domain_code")
        .eq("organization_id", organizationId)
        .eq("assessment_id", assessmentId)
        .in("question_code", part);
      if (error) throw error;
      for (const q of data ?? []) questions.set(`${assessmentId}|${q.question_code}`, q);
    }
  }

  const out = new Map<string, Extract<EvidenceLinkLine, { type: "assessment_response" }>>();
  for (const r of responses) {
    const q = questions.get(`${r.assessment_id}|${r.question_code}`);
    if (!q) continue;
    out.set(r.id, {
      type: "assessment_response",
      assessmentName: assessmentNames.get(r.assessment_id) ?? "An assessment",
      domainCode: q.domain_code as DomainCode,
      questionText: q.question_text,
    });
  }
  return out;
}

/** The rows a register's links point at, read as the caller (RLS decides what they may see), chunked. */
async function readTargets<T extends { id: string }>(
  supabase: AppSupabaseClient,
  organizationId: string,
  table: "vendors" | "retention_schedules" | "ai_systems" | "breach_incidents" | "rights_requests",
  columns: string,
  ids: readonly string[],
): Promise<Map<string, T>> {
  const out = new Map<string, T>();
  for (const part of chunks(ids)) {
    const { data, error } = await supabase.from(table).select(columns).eq("organization_id", organizationId).in("id", part);
    if (error) throw error;
    for (const row of (data ?? []) as unknown as T[]) out.set(row.id, row);
  }
  return out;
}

/** Each register's links, named as its register names them. */
async function registerLines(
  supabase: AppSupabaseClient,
  organizationId: string,
  links: readonly LinkRow[],
  records: ReadonlyMap<string, RecordRow>,
): Promise<Map<string, EvidenceLinkLine>> {
  const idsOf = (type: string) => [...new Set(links.filter((l) => l.linked_entity_type === type).map((l) => l.linked_entity_id))];
  const [vendors, schedules, ai, breaches, requests] = await Promise.all([
    readTargets<{ id: string; name: string; service: string | null }>(supabase, organizationId, "vendors", "id, name, service", idsOf("vendor")),
    readTargets<{ id: string; ropa_record_id: string; basis: string }>(supabase, organizationId, "retention_schedules", "id, ropa_record_id, basis", idsOf("retention_schedule")),
    readTargets<{ id: string; name: string }>(supabase, organizationId, "ai_systems", "id, name", idsOf("ai_system")),
    readTargets<{ id: string; incident_code: string; title: string }>(supabase, organizationId, "breach_incidents", "id, incident_code, title", idsOf("breach_incident")),
    readTargets<{ id: string; request_code: string; kind: string }>(supabase, organizationId, "rights_requests", "id, request_code, kind", idsOf("rights_request")),
  ]);

  const out = new Map<string, EvidenceLinkLine>();
  for (const v of vendors.values()) out.set(v.id, { type: "vendor", vendorName: v.name, service: v.service });
  for (const s of schedules.values()) {
    const r = records.get(s.ropa_record_id);
    const basis = s.basis as RetentionBasis;
    const named = {
      record: r ? { id: r.id, recordCode: r.record_code, name: r.name, status: r.status } : null,
      basisLabel: RETENTION_BASIS_LABEL[basis] ?? s.basis,
      provision: RETENTION_BASIS_PROVISION[basis] ?? "",
    };
    out.set(s.id, { type: "retention_schedule", scheduleName: retentionParentName(named), context: retentionContext(named) });
  }
  for (const a of ai.values()) out.set(a.id, { type: "ai_system", systemName: a.name });
  for (const b of breaches.values()) out.set(b.id, { type: "breach_incident", incidentCode: b.incident_code, title: b.title });
  for (const q of requests.values()) {
    out.set(q.id, { type: "rights_request", requestCode: q.request_code, kindLabel: RIGHTS_KIND_LABEL[q.kind as RightsKind] ?? q.kind });
  }
  return out;
}

export async function readEvidenceIndex(
  supabase: AppSupabaseClient,
  organizationId: string,
  context: {
    members: readonly Member[];
    assessmentNames: ReadonlyMap<string, string>;
    /** Every action the caller read (both parents), by id. */
    actions: readonly ReportActionLine[];
    records: readonly RecordRow[];
  },
): Promise<EvidenceIndexEntry[]> {
  const [evidence, links, fromVendor] = await Promise.all([
    readAllEvidence(supabase, organizationId),
    readAllLinks(supabase, organizationId),
    readVendorLinkUploads(supabase, organizationId),
  ]);
  const responseIds = [...new Set(links.filter((l) => l.linked_entity_type === "assessment_response").map((l) => l.linked_entity_id))];
  const records = new Map(context.records.map((r) => [r.id, r]));
  const [answers, names, registers] = await Promise.all([
    answerContexts(supabase, organizationId, responseIds, context.assessmentNames),
    namesFor(supabase, context.members, evidence.flatMap((e) => [e.uploaded_by, e.reviewed_by])),
    registerLines(supabase, organizationId, links, records),
  ]);
  const actions = new Map(context.actions.map((a) => [a.id, a]));

  const linksByEvidence = new Map<string, EvidenceLinkLine[]>();
  for (const l of links) {
    let line: EvidenceLinkLine | undefined;
    if (l.linked_entity_type === "assessment_response") {
      line = answers.get(l.linked_entity_id);
    } else if (l.linked_entity_type === "gap_action") {
      const a = actions.get(l.linked_entity_id);
      line = a && { type: "gap_action", actionTitle: a.title, sourceLabel: a.sourceLabel, parentName: a.parentName, context: a.context, mapping: a.mapping };
    } else if (l.linked_entity_type === "ropa_record") {
      const r = records.get(l.linked_entity_id);
      line = r && { type: "ropa_record", recordCode: r.record_code, recordName: r.name };
    } else {
      // Slice 10: a vendor, a retention schedule, an AI system, a breach or a request.
      const target = registers.get(l.linked_entity_id);
      line = target?.type === l.linked_entity_type ? target : undefined;
    }
    // A link whose target the caller cannot read is not invented: it is left out.
    if (!line) continue;
    linksByEvidence.set(l.evidence_id, [...(linksByEvidence.get(l.evidence_id) ?? []), line]);
  }

  return evidence.map((e) => ({
    fileName: e.file_name,
    contentType: e.content_type,
    byteSize: e.byte_size,
    uploadedByName: e.uploaded_by ? (names.get(e.uploaded_by) ?? "A former member") : null,
    uploadedViaVendorLink: fromVendor.has(e.id),
    uploadedAt: e.uploaded_at,
    reviewStatus: e.review_status as EvidenceReviewStatus,
    evidenceLevel: e.evidence_level,
    reviewedByName: e.reviewed_by ? (names.get(e.reviewed_by) ?? "A former member") : null,
    reviewedAt: e.reviewed_at,
    reviewNotes: e.review_notes,
    links: linksByEvidence.get(e.id) ?? [],
  }));
}
