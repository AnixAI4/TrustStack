import "server-only";
import {
  countRopaRegister,
  deriveRopaGaps,
  ROPA_BANDS,
  ROPA_CHILD_EXEMPTIONS,
  ROPA_COMPLETENESS_AREAS,
  ROPA_GAP_RULES,
  ROPA_IMPORT_FIELDS,
  ROPA_IMPORT_HEADERS,
  ROPA_LAWFUL_BASES,
  ROPA_RISK_FACTORS,
  ROPA_RISK_LABEL,
  ROPA_SAFEGUARDS,
  ROPA_STATUS_LABEL,
  type RopaAreaCode,
  type RopaImportField,
  type RopaBand,
  type RopaChildExemption,
  type RopaLawfulBasis,
  type RopaCountFacts,
  type RopaRetentionTrigger,
  type RopaSafeguard,
  type RopaGapCode,
  type RopaRecordForGaps,
  type RopaRiskRating,
  type RopaStatus,
  type TriState,
} from "@truststack/core";
import { EVIDENCE_COLUMNS, evidenceToApi, type EvidenceRow } from "@/lib/evidence/shape";
import { ACTION_COLUMNS, actionToApi, chunks, evidenceByAction, namesFor, type ActionRow, type Member } from "@/lib/gaps/shape";
import type { AppSupabaseClient } from "@/lib/supabase/server";

/**
 * Row → API shapes for the ROPA register (Slice 7), and the readers its
 * routes share.
 *
 * Every completeness score, band, risk factor and rating here was derived by
 * the database (migration 20261003000000_ropa) and CHECKed as a row
 * invariant; the API only reports it, with the words the UI needs to say WHY.
 */

/** One literal string: Supabase types a `select()` from the literal. */
export const RECORD_COLUMNS =
  "id, organization_id, record_code, name, description, department_id, department_text, owner_user_id, data_principal_types, data_categories, estimated_data_principals, purpose, legal_basis_note, collection_source, systems_text, vendors_text, sharing, retention_rule, security_safeguards, notice_linked, consent_linked, rights_workflow, grievance_linked, children_data, cross_border, ai_processing, high_risk_documents, evidence_note, last_reviewed_at, next_review_at, status, version, completeness_score, completeness_band, completeness_missing, risk_factors, risk_points, risk_rating_derived, risk_rating_assessor, risk_rating, system_link_count, vendor_link_count, evidence_count, approved_by, approved_at, created_by, updated_by, created_at, updated_at, lawful_basis, child_parental_consent, child_exemption, child_tracking, retention_trigger, retention_law, safeguards, vendor_contract_gaps, risk_rating_assessor_reason, risk_model_version" as const;

export const ROPA_GAP_COLUMNS =
  "id, organization_id, ropa_record_id, gap_code, severity, priority, state, finding, recommended_fix, generated_at, updated_at" as const;

export interface RecordRow {
  id: string;
  organization_id: string;
  record_code: string;
  name: string;
  description: string | null;
  department_id: string | null;
  department_text: string | null;
  owner_user_id: string | null;
  data_principal_types: string | null;
  data_categories: string | null;
  estimated_data_principals: number | null;
  purpose: string | null;
  legal_basis_note: string | null;
  collection_source: string | null;
  systems_text: string | null;
  vendors_text: string | null;
  sharing: string | null;
  retention_rule: string | null;
  security_safeguards: string | null;
  notice_linked: string | null;
  consent_linked: string | null;
  rights_workflow: string | null;
  grievance_linked: string | null;
  children_data: string;
  cross_border: string;
  ai_processing: string;
  high_risk_documents: string;
  evidence_note: string | null;
  last_reviewed_at: string | null;
  next_review_at: string | null;
  status: string;
  version: number;
  completeness_score: number;
  completeness_band: string;
  completeness_missing: string[] | null;
  risk_factors: string[] | null;
  risk_points: number;
  risk_rating_derived: string;
  risk_rating_assessor: string | null;
  risk_rating: string;
  system_link_count: number;
  vendor_link_count: number;
  evidence_count: number;
  approved_by: string | null;
  approved_at: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  lawful_basis: string | null;
  child_parental_consent: string;
  child_exemption: string | null;
  child_tracking: string;
  retention_trigger: string | null;
  retention_law: string | null;
  safeguards: string[] | null;
  vendor_contract_gaps: number;
  risk_rating_assessor_reason: string | null;
  risk_model_version: string;
}

export interface RopaGapRow {
  id: string;
  organization_id: string;
  ropa_record_id: string | null;
  gap_code: string;
  severity: string;
  priority: string;
  state: string;
  finding: string;
  recommended_fix: string;
  generated_at: string;
  updated_at: string;
}

/** The content fields, camelCase, as the API reads and writes them. */
export const RECORD_FIELD_COLUMNS = {
  name: "name",
  description: "description",
  departmentId: "department_id",
  departmentText: "department_text",
  ownerUserId: "owner_user_id",
  dataPrincipalTypes: "data_principal_types",
  dataCategories: "data_categories",
  estimatedDataPrincipals: "estimated_data_principals",
  purpose: "purpose",
  legalBasisNote: "legal_basis_note",
  collectionSource: "collection_source",
  systemsText: "systems_text",
  vendorsText: "vendors_text",
  sharing: "sharing",
  retentionRule: "retention_rule",
  securitySafeguards: "security_safeguards",
  noticeLinked: "notice_linked",
  consentLinked: "consent_linked",
  rightsWorkflow: "rights_workflow",
  grievanceLinked: "grievance_linked",
  childrenData: "children_data",
  crossBorder: "cross_border",
  aiProcessing: "ai_processing",
  highRiskDocuments: "high_risk_documents",
  evidenceNote: "evidence_note",
  riskRatingAssessor: "risk_rating_assessor",
  riskRatingAssessorReason: "risk_rating_assessor_reason",
  lastReviewedAt: "last_reviewed_at",
  nextReviewAt: "next_review_at",
  lawfulBasis: "lawful_basis",
  childParentalConsent: "child_parental_consent",
  childExemption: "child_exemption",
  childTracking: "child_tracking",
  retentionTrigger: "retention_trigger",
  retentionLaw: "retention_law",
  safeguards: "safeguards",
} as const satisfies Record<string, keyof RecordRow>;
export type RecordField = keyof typeof RECORD_FIELD_COLUMNS;

const bandLabel = (band: string) => ROPA_BANDS.find((b) => b.band === band)?.label ?? band;

/** The register's row: what a list shows. */
export function recordSummaryToApi(row: RecordRow, names: ReadonlyMap<string, string>) {
  return {
    id: row.id,
    recordCode: row.record_code,
    name: row.name,
    departmentId: row.department_id,
    departmentText: row.department_text,
    ownerUserId: row.owner_user_id,
    ownerName: row.owner_user_id ? (names.get(row.owner_user_id) ?? null) : null,
    status: row.status as RopaStatus,
    statusLabel: ROPA_STATUS_LABEL[row.status as RopaStatus] ?? row.status,
    version: row.version,
    childrenData: row.children_data as TriState,
    aiProcessing: row.ai_processing as TriState,
    completenessScore: row.completeness_score,
    completenessBand: row.completeness_band as RopaBand,
    completenessBandLabel: bandLabel(row.completeness_band),
    riskRating: row.risk_rating as RopaRiskRating,
    riskRatingLabel: ROPA_RISK_LABEL[row.risk_rating as RopaRiskRating] ?? row.risk_rating,
    lastReviewedAt: row.last_reviewed_at,
    nextReviewAt: row.next_review_at,
    evidenceCount: row.evidence_count,
    updatedAt: row.updated_at,
  };
}

/** A whole record: every field, plus the reasons behind its two derived numbers. */
export function recordToApi(row: RecordRow, names: ReadonlyMap<string, string>) {
  const missing = new Set(row.completeness_missing ?? []);
  return {
    ...recordSummaryToApi(row, names),
    description: row.description,
    dataPrincipalTypes: row.data_principal_types,
    dataCategories: row.data_categories,
    estimatedDataPrincipals: row.estimated_data_principals,
    purpose: row.purpose,
    legalBasisNote: row.legal_basis_note,
    collectionSource: row.collection_source,
    systemsText: row.systems_text,
    vendorsText: row.vendors_text,
    sharing: row.sharing,
    retentionRule: row.retention_rule,
    securitySafeguards: row.security_safeguards,
    noticeLinked: row.notice_linked,
    consentLinked: row.consent_linked,
    rightsWorkflow: row.rights_workflow,
    grievanceLinked: row.grievance_linked,
    crossBorder: row.cross_border as TriState,
    highRiskDocuments: row.high_risk_documents as TriState,
    evidenceNote: row.evidence_note,
    lawfulBasis: row.lawful_basis as RopaLawfulBasis | null,
    childParentalConsent: row.child_parental_consent as TriState,
    childExemption: row.child_exemption as RopaChildExemption | null,
    childTracking: row.child_tracking as TriState,
    retentionTrigger: row.retention_trigger as RopaRetentionTrigger | null,
    retentionLaw: row.retention_law,
    safeguards: (row.safeguards ?? []) as RopaSafeguard[],
    /** Linked Data Processors without a contract or DPDP clauses (s.8(2)) — counted by the database. */
    vendorContractGaps: row.vendor_contract_gaps,
    approvedBy: row.approved_by,
    approvedByName: row.approved_by ? (names.get(row.approved_by) ?? null) : null,
    approvedAt: row.approved_at,
    createdAt: row.created_at,
    /** Every area, complete or not, with what it is worth — the form groups by these. */
    areas: ROPA_COMPLETENESS_AREAS.map((a) => ({
      code: a.code as RopaAreaCode,
      label: a.label,
      weight: a.weight,
      rule: a.rule,
      complete: !missing.has(a.code),
    })),
    risk: {
      rating: row.risk_rating as RopaRiskRating,
      derived: row.risk_rating_derived as RopaRiskRating,
      /** Kept only when it RAISES the derived rating — and always with its reason (D-067). */
      assessor: row.risk_rating_assessor as RopaRiskRating | null,
      assessorReason: row.risk_rating_assessor_reason,
      /** Which version of the risk rules produced this rating. */
      modelVersion: row.risk_model_version,
      points: row.risk_points,
      factors: (row.risk_factors ?? []).map((code) => {
        const factor = ROPA_RISK_FACTORS.find((f) => f.code === code);
        return { code, label: factor?.label ?? code, points: factor?.points ?? 0 };
      }),
    },
  };
}

export type RecordApi = ReturnType<typeof recordToApi>;

/**
 * Every record of an organisation, PAGED: PostgREST caps a response at 1,000
 * rows, and an import may hold 2,000 (pitfall 19).
 */
export async function readAllRecords(supabase: AppSupabaseClient, organizationId: string): Promise<RecordRow[]> {
  const page = 1000;
  const out: RecordRow[] = [];
  for (let from = 0; ; from += page) {
    const { data, error } = await supabase
      .from("ropa_records")
      .select(RECORD_COLUMNS)
      .eq("organization_id", organizationId)
      .order("record_code")
      .range(from, from + page - 1);
    if (error) throw error;
    out.push(...((data ?? []) as RecordRow[]));
    if ((data ?? []).length < page) return out;
  }
}

export async function readRecord(
  supabase: AppSupabaseClient,
  organizationId: string,
  recordId: string,
): Promise<RecordRow | null> {
  const { data, error } = await supabase
    .from("ropa_records")
    .select(RECORD_COLUMNS)
    .eq("id", recordId)
    .eq("organization_id", organizationId)
    .maybeSingle();
  if (error) throw error;
  return (data as RecordRow | null) ?? null;
}

/** A record's links to the Slice 2 registers and its stored evidence. */
export async function readRecordLinks(supabase: AppSupabaseClient, organizationId: string, recordId: string) {
  const [systems, vendors, links] = await Promise.all([
    supabase
      .from("ropa_systems")
      .select("system_id, systems(name)")
      .eq("organization_id", organizationId)
      .eq("ropa_record_id", recordId),
    supabase
      .from("ropa_vendors")
      .select("vendor_id, vendors(name)")
      .eq("organization_id", organizationId)
      .eq("ropa_record_id", recordId),
    supabase
      .from("evidence_links")
      .select(`linked_at, evidence(${EVIDENCE_COLUMNS})`)
      .eq("organization_id", organizationId)
      .eq("linked_entity_type", "ropa_record")
      .eq("linked_entity_id", recordId)
      .order("linked_at"),
  ]);
  for (const r of [systems, vendors, links]) if (r.error) throw r.error;
  return {
    systems: (systems.data ?? []).map((s) => ({ id: s.system_id, name: s.systems?.name ?? "" })),
    vendors: (vendors.data ?? []).map((v) => ({ id: v.vendor_id, name: v.vendors?.name ?? "" })),
    evidence: (links.data ?? []).flatMap((l) => {
      const e = l.evidence as unknown as EvidenceRow | null;
      return e ? [evidenceToApi(e)] : [];
    }),
  };
}

// ---------------------------------------------------------------------------
// ROPA gaps
// ---------------------------------------------------------------------------

export function ropaGapToApi(
  row: RopaGapRow,
  record: { record_code: string; name: string } | undefined,
  actions: ReturnType<typeof actionToApi>[],
) {
  const rule = ROPA_GAP_RULES.find((r) => r.code === row.gap_code);
  return {
    id: row.id,
    recordId: row.ropa_record_id,
    recordCode: record?.record_code ?? null,
    recordName: record?.name ?? null,
    gapCode: row.gap_code as RopaGapCode,
    label: rule?.label ?? row.gap_code,
    severity: row.severity,
    priority: row.priority,
    state: row.state,
    finding: row.finding,
    recommendedFix: row.recommended_fix,
    generatedAt: row.generated_at,
    actions,
  };
}

export type RopaGapApi = ReturnType<typeof ropaGapToApi>;

const SEVERITY_ORDER = ["critical", "high", "medium", "low"];

/** The ROPA gaps (or one record's, or one gap), each with its actions and their evidence. */
export async function readRopaGaps(
  supabase: AppSupabaseClient,
  organizationId: string,
  members: readonly Member[],
  filter: { recordId?: string; gapId?: string } = {},
): Promise<RopaGapApi[]> {
  // The whole register is read by organisation and PAGED; a filtered read is
  // small. Never one long `in.(…)` list in a URL.
  const gaps: RopaGapRow[] = [];
  for (let from = 0; ; from += 1000) {
    let query = supabase.from("ropa_gaps").select(ROPA_GAP_COLUMNS).eq("organization_id", organizationId);
    if (filter.recordId) query = query.eq("ropa_record_id", filter.recordId);
    if (filter.gapId) query = query.eq("id", filter.gapId);
    const { data, error } = await query.order("id").range(from, from + 999);
    if (error) throw error;
    gaps.push(...((data ?? []) as RopaGapRow[]));
    if ((data ?? []).length < 1000) break;
  }
  if (gaps.length === 0) return [];
  const gapIds = new Set(gaps.map((g) => g.id));

  const actions: ActionRow[] = [];
  for (let from = 0; ; from += 1000) {
    let query = supabase
      .from("gap_actions")
      .select(ACTION_COLUMNS)
      .eq("organization_id", organizationId)
      .not("ropa_gap_id", "is", null);
    if (filter.recordId || filter.gapId) query = query.in("ropa_gap_id", [...gapIds]);
    const { data, error } = await query.order("created_at").order("id").range(from, from + 999);
    if (error) throw error;
    actions.push(...((data ?? []) as ActionRow[]).filter((a) => a.ropa_gap_id !== null && gapIds.has(a.ropa_gap_id)));
    if ((data ?? []).length < 1000) break;
  }

  const recordIds = [...new Set(gaps.flatMap((g) => (g.ropa_record_id ? [g.ropa_record_id] : [])))];
  const records = new Map<string, { record_code: string; name: string }>();
  for (const ids of chunks(recordIds)) {
    const { data, error } = await supabase
      .from("ropa_records")
      .select("id, record_code, name")
      .eq("organization_id", organizationId)
      .in("id", ids);
    if (error) throw error;
    for (const r of data ?? []) records.set(r.id, r);
  }

  const evidence = await evidenceByAction(
    supabase,
    organizationId,
    actions.map((a) => a.id),
  );
  const names = await namesFor(
    supabase,
    members,
    actions.flatMap((a) => [a.owner_user_id, a.closed_by]),
  );
  const actionsByGap = new Map<string, ReturnType<typeof actionToApi>[]>();
  for (const a of actions) {
    const key = a.ropa_gap_id!;
    const list = actionsByGap.get(key) ?? [];
    list.push(actionToApi(a, evidence.get(a.id) ?? [], names));
    actionsByGap.set(key, list);
  }

  const ruleOrder = (code: string) => ROPA_GAP_RULES.findIndex((r) => r.code === code);
  return gaps
    .map((g) => ropaGapToApi(g, g.ropa_record_id ? records.get(g.ropa_record_id) : undefined, actionsByGap.get(g.id) ?? []))
    .sort(
      (a, b) =>
        SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity) ||
        (a.recordCode ?? "").localeCompare(b.recordCode ?? "", "en", { numeric: true }) ||
        ruleOrder(a.gapCode) - ruleOrder(b.gapCode),
    );
}

/** The ROPA gap an action belongs to, read back after a write; null for an assessment action. */
export async function readRopaGapForAction(
  supabase: AppSupabaseClient,
  organizationId: string,
  actionId: string,
  members: readonly Member[],
): Promise<RopaGapApi | null> {
  const { data, error } = await supabase
    .from("gap_actions")
    .select("ropa_gap_id")
    .eq("id", actionId)
    .eq("organization_id", organizationId)
    .maybeSingle();
  if (error) throw error;
  if (!data?.ropa_gap_id) return null;
  const [gap] = await readRopaGaps(supabase, organizationId, members, { gapId: data.ropa_gap_id });
  return gap ?? null;
}

/** The facts the gap rules read, from a stored row — the same mapping the database uses. */
export function rowFacts(row: RecordRow): RopaRecordForGaps {
  return {
    id: row.id,
    status: row.status as RopaStatus,
    name: row.name,
    departmentId: row.department_id,
    departmentText: row.department_text,
    ownerUserId: row.owner_user_id,
    dataPrincipalTypes: row.data_principal_types,
    dataCategories: row.data_categories,
    estimatedDataPrincipals: row.estimated_data_principals,
    purpose: row.purpose,
    legalBasisNote: row.legal_basis_note,
    collectionSource: row.collection_source,
    systemsText: row.systems_text,
    systemLinkCount: row.system_link_count,
    vendorsText: row.vendors_text,
    vendorLinkCount: row.vendor_link_count,
    noticeLinked: row.notice_linked,
    consentLinked: row.consent_linked,
    retentionRule: row.retention_rule,
    securitySafeguards: row.security_safeguards,
    childrenData: row.children_data as TriState,
    crossBorder: row.cross_border as TriState,
    aiProcessing: row.ai_processing as TriState,
    highRiskDocuments: row.high_risk_documents as TriState,
    evidenceCount: row.evidence_count,
    nextReviewAt: row.next_review_at,
    lawfulBasis: row.lawful_basis as RopaLawfulBasis | null,
    childParentalConsent: row.child_parental_consent as TriState,
    childExemption: row.child_exemption as RopaChildExemption | null,
    childTracking: row.child_tracking as TriState,
    retentionTrigger: row.retention_trigger as RopaRetentionTrigger | null,
    retentionLaw: row.retention_law,
    safeguards: (row.safeguards ?? []) as RopaSafeguard[],
    vendorContractGaps: row.vendor_contract_gaps,
  };
}

/** "Today" as a calendar date in India — the day the database derives "overdue" from (D-055). */
export function todayInIndia(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(now);
}

/**
 * Do the stored ROPA gaps still match the register? They are regenerated on
 * request (D-057's rule, D-062), so between the two they can be out of date —
 * and the UI says so rather than presenting them as current.
 */
export function ropaGapsAreStale(records: readonly RecordRow[], gaps: readonly RopaGapApi[], today: string): boolean {
  const key = (recordId: string | null, code: string) => `${recordId ?? "-"}:${code}`;
  const derived = new Set(deriveRopaGaps(records.map(rowFacts), today).map((g) => key(g.recordId, g.code)));
  const stored = new Set(gaps.filter((g) => g.state === "open").map((g) => key(g.recordId, g.gapCode)));
  return derived.size !== stored.size || [...derived].some((k) => !stored.has(k));
}

/** The stored fields the register's counts read (core `countRopaRegister`). */
export function ropaCountFacts(row: RecordRow): RopaCountFacts {
  return {
    status: row.status as RopaStatus,
    completenessScore: row.completeness_score,
    completenessBand: row.completeness_band as RopaBand,
    completenessMissing: row.completeness_missing ?? [],
    riskRating: row.risk_rating as RopaRiskRating,
    childrenData: row.children_data as TriState,
    aiProcessing: row.ai_processing as TriState,
    crossBorder: row.cross_border as TriState,
    vendorLinkCount: row.vendor_link_count,
    nextReviewAt: row.next_review_at,
  };
}

/**
 * The register's counts — the register page and the dashboard (Slice 8) both
 * read through here, so the two can never disagree. Counts of stored fields
 * only: every score and rating was derived by the database.
 */
export function ropaRegisterCounts(rows: readonly RecordRow[], today: string = todayInIndia()) {
  return countRopaRegister(rows.map(ropaCountFacts), today);
}

/**
 * The ROPA gaps as a register: the gaps with their actions, the open counts,
 * whether they are out of date, and whether anyone has generated them yet
 * (D-062). The ROPA gaps route and the dashboard both read through here.
 */
export async function readRopaGapRegister(
  supabase: AppSupabaseClient,
  organizationId: string,
  members: readonly Member[],
  records?: readonly RecordRow[],
) {
  const [gaps, rows] = await Promise.all([
    readRopaGaps(supabase, organizationId, members),
    records ? Promise.resolve(records) : readAllRecords(supabase, organizationId),
  ]);
  const open = gaps.filter((g) => g.state === "open");
  const of = (severity: string) => open.filter((g) => g.severity === severity).length;
  return {
    counts: {
      gapCount: open.length,
      critical: of("critical"),
      high: of("high"),
      medium: of("medium"),
      low: of("low"),
      supersededCount: gaps.length - open.length,
    },
    /** True when the register has changed since the gaps were generated. */
    stale: ropaGapsAreStale(rows, gaps, todayInIndia()),
    generated: gaps.length > 0,
    gaps,
  };
}

// ---------------------------------------------------------------------------
// The export's columns — ONE list for the CSV and the XLSX (SLICE_09 §5)
// ---------------------------------------------------------------------------

const EXPORT_TRI: Record<string, string> = { yes: "Yes", no: "No", unknown: "Unknown" };

const EXPORT_DERIVED_HEADERS = [
  "Status", "Version", "Completeness /100", "Completeness band", "Missing areas", "Derived risk", "Risk factors",
  "Owner", "Approved by", "Approved on", "Lawful ground (note for counsel)", "Children: parental consent",
  "Children: Fourth Schedule exemption", "Children: tracking or targeting", "Rule 6 safeguards confirmed",
  "Processors without a valid contract", "Risk raised by assessor because", "Risk model version",
] as const;

/**
 * The workbook's own columns first, by their workbook names — so an export
 * imports straight back — then what the register derived.
 */
export function ropaExportHeaders(): string[] {
  return [...ROPA_IMPORT_FIELDS.map((f) => ROPA_IMPORT_HEADERS[f][0] ?? f), ...EXPORT_DERIVED_HEADERS];
}

function exportValue(r: RecordRow, f: RopaImportField): string | number | null {
  switch (f) {
    case "recordCode": return r.record_code;
    case "name": return r.name;
    case "childrenData": return EXPORT_TRI[r.children_data] ?? r.children_data;
    case "crossBorder": return EXPORT_TRI[r.cross_border] ?? r.cross_border;
    case "aiProcessing": return EXPORT_TRI[r.ai_processing] ?? r.ai_processing;
    case "highRiskDocuments": return EXPORT_TRI[r.high_risk_documents] ?? r.high_risk_documents;
    case "riskRating": return ROPA_RISK_LABEL[r.risk_rating as RopaRiskRating] ?? r.risk_rating;
    case "lastReviewedAt": return r.last_reviewed_at;
    case "nextReviewAt": return r.next_review_at;
    case "estimatedDataPrincipals": return r.estimated_data_principals;
    default: return (r as unknown as Record<string, string | null>)[RECORD_FIELD_COLUMNS[f as RecordField]] ?? null;
  }
}

/** One record as the export writes it, in `ropaExportHeaders()` order: stored values and their labels only. */
export function ropaExportRow(r: RecordRow, names: ReadonlyMap<string, string | null>): (string | number | null)[] {
  return [
    ...ROPA_IMPORT_FIELDS.map((f) => exportValue(r, f)),
    ROPA_STATUS_LABEL[r.status as RopaStatus] ?? r.status,
    r.version,
    r.completeness_score,
    ROPA_BANDS.find((b) => b.band === r.completeness_band)?.label ?? r.completeness_band,
    (r.completeness_missing ?? []).map((m) => ROPA_COMPLETENESS_AREAS.find((a) => a.code === m)?.label ?? m).join("; "),
    ROPA_RISK_LABEL[r.risk_rating_derived as RopaRiskRating] ?? r.risk_rating_derived,
    (r.risk_factors ?? []).join("; "),
    r.owner_user_id ? (names.get(r.owner_user_id) ?? "") : "",
    r.approved_by ? (names.get(r.approved_by) ?? "") : "",
    r.approved_at ? r.approved_at.slice(0, 10) : "",
    ROPA_LAWFUL_BASES.find((b) => b.code === r.lawful_basis)?.label ?? "Undecided",
    EXPORT_TRI[r.child_parental_consent] ?? r.child_parental_consent,
    ROPA_CHILD_EXEMPTIONS.find((e) => e.code === r.child_exemption)?.label ?? "",
    EXPORT_TRI[r.child_tracking] ?? r.child_tracking,
    (r.safeguards ?? []).map((g) => ROPA_SAFEGUARDS.find((x) => x.code === g)?.label ?? g).join("; "),
    r.vendor_contract_gaps,
    r.risk_rating_assessor_reason ?? "",
    r.risk_model_version,
  ];
}
