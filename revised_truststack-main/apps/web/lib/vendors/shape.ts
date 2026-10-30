import "server-only";
import {
  assessmentOutOfDate,
  consistencyFlags,
  INTAKE_LIMITS,
  VENDOR_LINK_STATE_LABEL,
  vendorLinkState,
  missingAnswers,
  VENDOR_ASSESSMENT_SOURCE_LABEL,
  VENDOR_ASSESSMENT_STATUS_LABEL,
  VENDOR_RISK_TIER_LABEL,
  vendorContractGap,
  vendorRisk,
  type ExposureVendorInput,
  type TriState,
  type VendorAssessmentSource,
  type VendorAssessmentStatus,
  type VendorRegisterFacts,
  type VendorRiskTier,
  type VendorRole,
} from "@truststack/core";
import { namesFor, type Member } from "@/lib/gaps/shape";
import { EVIDENCE_COLUMNS, evidenceToApi, type EvidenceRow } from "@/lib/evidence/shape";
import type { AppSupabaseClient } from "@/lib/supabase/server";

/**
 * The processor register (Slice 10, Stage 4a): the vendor register's rows
 * with the contract, the documents attached to each vendor, and each vendor's
 * assessments — read as the caller, so RLS applies (any member reads it, as
 * the vendor register).
 *
 * Every number here is the database's (a submitted or accepted assessment's
 * score is stored by its function) or core's (a draft's live preview, the
 * consistency flags, whether an accepted assessment is out of date). Nothing
 * is decided here.
 *
 * Stage 4b: an assessment's links to the vendor (who each went to, its state,
 * who sent it — never a hash), the respondent's declaration, which answers and
 * documents came from the vendor's respondent, and the link senders among
 * those who may not review (D-092).
 */

export const VENDOR_COLUMNS =
  "id, name, service, vendor_role, contract_exists, dpdp_clauses, cross_border, sub_processors_known, contract_signed_on, contract_review_by" as const;
export const ASSESSMENT_COLUMNS =
  "id, organization_id, vendor_id, version, status, source, source_note, risk_score, risk_tier, unevidenced, review_by, return_reason, created_by, submitted_by, submitted_at, reviewed_by, reviewed_at, declared_name, declared_role, declared_at, created_at, updated_at" as const;
/** Never a hash: members hold SELECT on these columns only. */
export const LINK_COLUMNS =
  "id, assessment_id, respondent_name, respondent_email, expires_at, wrong_codes, confirmed_at, submitted_at, revoked_at, revoked_by, created_by, created_at" as const;
export const ANSWER_COLUMNS = "question_code, answer, not_applicable, na_reason, evidence_id, answered_by, answered_at" as const;

export interface VendorRow {
  id: string;
  name: string;
  service: string | null;
  vendor_role: string;
  contract_exists: string;
  dpdp_clauses: string;
  cross_border: string;
  sub_processors_known: string;
  contract_signed_on: string | null;
  contract_review_by: string | null;
}

export interface AssessmentRow {
  id: string;
  organization_id: string;
  vendor_id: string;
  version: number;
  status: string;
  source: string;
  source_note: string | null;
  risk_score: number | null;
  risk_tier: string | null;
  unevidenced: string[];
  review_by: string | null;
  return_reason: string | null;
  created_by: string | null;
  submitted_by: string | null;
  submitted_at: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  declared_name: string | null;
  declared_role: string | null;
  declared_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface LinkRow {
  id: string;
  assessment_id: string;
  respondent_name: string;
  respondent_email: string;
  expires_at: string;
  wrong_codes: number;
  confirmed_at: string | null;
  submitted_at: string | null;
  revoked_at: string | null;
  revoked_by: string | null;
  created_by: string | null;
  created_at: string;
}

export interface AnswerRow {
  question_code: string;
  answer: string | null;
  not_applicable: boolean;
  na_reason: string | null;
  evidence_id: string | null;
  answered_by: string | null;
  answered_at: string;
}

export function registerFacts(v: VendorRow): VendorRegisterFacts {
  return {
    role: v.vendor_role as VendorRole,
    contractExists: v.contract_exists as TriState,
    dpdpClauses: v.dpdp_clauses as TriState,
    crossBorder: v.cross_border as TriState,
    subProcessorsKnown: v.sub_processors_known as TriState,
  };
}

const nameOf = (names: ReadonlyMap<string, string>, id: string | null) => (id ? (names.get(id) ?? "A former member") : null);

const linkState = (l: LinkRow, now: Date) =>
  vendorLinkState({ revokedAt: l.revoked_at, submittedAt: l.submitted_at, expiresAt: l.expires_at, wrongCodes: l.wrong_codes }, now, INTAKE_LIMITS.wrongCodes);

/** One link, as staff see it: who it went to, its state, who sent it. */
export function linkToApi(l: LinkRow, names: ReadonlyMap<string, string>, now: Date) {
  const state = linkState(l, now);
  return {
    id: l.id,
    respondentName: l.respondent_name,
    respondentEmail: l.respondent_email,
    state,
    stateLabel: VENDOR_LINK_STATE_LABEL[state],
    expiresAt: l.expires_at,
    confirmedAt: l.confirmed_at,
    submittedAt: l.submitted_at,
    revokedAt: l.revoked_at,
    revokedByName: nameOf(names, l.revoked_by),
    sentBy: l.created_by,
    sentByName: nameOf(names, l.created_by),
    sentAt: l.created_at,
  };
}

/** One assessment's header, as every list shows it. */
export function assessmentToApi(row: AssessmentRow, names: ReadonlyMap<string, string>, today: string, links: readonly LinkRow[] = [], now = new Date()) {
  const status = row.status as VendorAssessmentStatus;
  const mine = links.filter((l) => l.assessment_id === row.id);
  return {
    id: row.id,
    vendorId: row.vendor_id,
    version: row.version,
    status,
    statusLabel: VENDOR_ASSESSMENT_STATUS_LABEL[status],
    source: row.source,
    sourceLabel: VENDOR_ASSESSMENT_SOURCE_LABEL[row.source as VendorAssessmentSource] ?? row.source,
    sourceNote: row.source_note,
    riskScore: row.risk_score,
    riskTier: row.risk_tier as VendorRiskTier | null,
    riskTierLabel: row.risk_tier ? VENDOR_RISK_TIER_LABEL[row.risk_tier as VendorRiskTier] : null,
    unevidenced: row.unevidenced,
    reviewBy: row.review_by,
    outOfDate: status === "accepted" && assessmentOutOfDate(row.review_by, today),
    returnReason: row.return_reason,
    createdBy: row.created_by,
    createdByName: nameOf(names, row.created_by),
    submittedBy: row.submitted_by,
    submittedByName: nameOf(names, row.submitted_by),
    submittedAt: row.submitted_at,
    reviewedBy: row.reviewed_by,
    reviewedByName: nameOf(names, row.reviewed_by),
    reviewedAt: row.reviewed_at,
    /** The vendor's respondent declared it accurate and complete (Stage 4b). */
    declaration: row.declared_at ? { name: row.declared_name, role: row.declared_role, at: row.declared_at } : null,
    /** A link to the vendor is open: the vendor is answering. */
    withVendor: mine.some((l) => linkState(l, now) === "open"),
    createdAt: row.created_at,
  };
}

/** Every document attached to these vendors (`evidence_links` type `vendor`), by vendor. */
async function readDocuments(supabase: AppSupabaseClient, organizationId: string, vendorIds: readonly string[]) {
  const byVendor = new Map<string, EvidenceRow[]>();
  if (vendorIds.length === 0) return byVendor;
  const { data: links, error } = await supabase
    .from("evidence_links")
    .select("evidence_id, linked_entity_id")
    .eq("organization_id", organizationId)
    .eq("linked_entity_type", "vendor")
    .in("linked_entity_id", [...vendorIds]);
  if (error) throw error;
  const ids = [...new Set((links ?? []).map((l) => l.evidence_id))];
  if (ids.length === 0) return byVendor;
  const { data: rows, error: eError } = await supabase.from("evidence").select(EVIDENCE_COLUMNS).eq("organization_id", organizationId).in("id", ids);
  if (eError) throw eError;
  const evidence = new Map((rows ?? []).map((r) => [r.id, r as EvidenceRow]));
  for (const l of links ?? []) {
    const e = evidence.get(l.evidence_id);
    if (!e) continue;
    byVendor.set(l.linked_entity_id, [...(byVendor.get(l.linked_entity_id) ?? []), e]);
  }
  for (const list of byVendor.values()) list.sort((a, b) => a.uploaded_at.localeCompare(b.uploaded_at));
  return byVendor;
}

/** A document counts for an answer while it is stored and not rejected or outdated in review (as the database scores it). */
export const documentCounts = (e: Pick<EvidenceRow, "review_status">) => e.review_status !== "rejected" && e.review_status !== "outdated";

async function readVendorsAndAssessments(supabase: AppSupabaseClient, organizationId: string, vendorId?: string) {
  let vendorsQuery = supabase.from("vendors").select(VENDOR_COLUMNS).eq("organization_id", organizationId);
  if (vendorId) vendorsQuery = vendorsQuery.eq("id", vendorId);
  let assessmentsQuery = supabase.from("vendor_assessments").select(ASSESSMENT_COLUMNS).eq("organization_id", organizationId);
  if (vendorId) assessmentsQuery = assessmentsQuery.eq("vendor_id", vendorId);
  const [vendors, assessments] = await Promise.all([vendorsQuery.order("name"), assessmentsQuery.order("version", { ascending: false })]);
  if (vendors.error) throw vendors.error;
  if (assessments.error) throw assessments.error;
  const rows = (assessments.data ?? []) as AssessmentRow[];
  return { vendors: (vendors.data ?? []) as VendorRow[], assessments: rows, links: await readLinks(supabase, organizationId, rows.filter((a) => a.status !== "accepted").map((a) => a.id)) };
}

/** The links of these assessments, newest first. */
async function readLinks(supabase: AppSupabaseClient, organizationId: string, assessmentIds: readonly string[]): Promise<LinkRow[]> {
  if (assessmentIds.length === 0) return [];
  const { data, error } = await supabase
    .from("vendor_assessment_links")
    .select(LINK_COLUMNS)
    .eq("organization_id", organizationId)
    .in("assessment_id", [...assessmentIds])
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as LinkRow[];
}

/**
 * The vendor facts exposure model 1.4.0 reads — exactly what
 * `app.exposure_input` builds: role, the contract's tri-states, and the
 * review-by date of the latest ACCEPTED assessment.
 */
export async function readVendorFacts(supabase: AppSupabaseClient, organizationId: string): Promise<ExposureVendorInput[]> {
  const { vendors, assessments } = await readVendorsAndAssessments(supabase, organizationId);
  return vendors.map((v) => ({
    role: v.vendor_role as VendorRole,
    contractExists: v.contract_exists as TriState,
    dpdpClauses: v.dpdp_clauses as TriState,
    assessmentReviewBy: assessments.find((a) => a.vendor_id === v.id && a.status === "accepted")?.review_by ?? null,
  }));
}

function vendorToApi(
  v: VendorRow,
  assessments: readonly AssessmentRow[],
  documents: readonly EvidenceRow[],
  names: ReadonlyMap<string, string>,
  today: string,
  links: readonly LinkRow[],
  fromVendor: ReadonlySet<string>,
) {
  const mine = assessments.filter((a) => a.vendor_id === v.id);
  const current = mine.find((a) => a.status === "accepted") ?? null;
  const open = mine.find((a) => a.status !== "accepted") ?? null;
  const facts = registerFacts(v);
  return {
    id: v.id,
    name: v.name,
    service: v.service,
    vendorRole: v.vendor_role,
    contractExists: v.contract_exists,
    dpdpClauses: v.dpdp_clauses,
    crossBorder: v.cross_border,
    subProcessorsKnown: v.sub_processors_known,
    contractSignedOn: v.contract_signed_on,
    contractReviewBy: v.contract_review_by,
    /** The contract's own review date has passed — a register fact, shown, never a model input. */
    contractReviewPassed: v.contract_review_by !== null && today > v.contract_review_by,
    /** What the register records, as the consistency checks read it. */
    facts,
    isProcessor: v.vendor_role !== "independent",
    contractGap: vendorContractGap(facts),
    documents: documents.map((e) => ({ ...evidenceToApi(e), counts: documentCounts(e), fromVendor: fromVendor.has(e.id) })),
    /** The latest ACCEPTED assessment — the one that counts. */
    current: current ? assessmentToApi(current, names, today) : null,
    /** The one not yet accepted, if any (a draft, awaiting review, or returned). */
    open: open ? assessmentToApi(open, names, today, links) : null,
    versions: mine.map((a) => assessmentToApi(a, names, today, links)),
  };
}

export type ProcessorApi = ReturnType<typeof vendorToApi>;

/** The whole register, with the counts its page leads with. */
/** Which of these documents a vendor's respondent uploaded through a link. */
async function readFromVendor(supabase: AppSupabaseClient, organizationId: string, documents: ReadonlyMap<string, EvidenceRow[]>): Promise<Set<string>> {
  const ids = [...documents.values()].flat().map((e) => e.id);
  if (ids.length === 0) return new Set();
  const { data, error } = await supabase.from("vendor_link_documents").select("evidence_id").eq("organization_id", organizationId).in("evidence_id", ids);
  if (error) throw error;
  return new Set((data ?? []).map((d) => d.evidence_id));
}

export async function readProcessorRegister(supabase: AppSupabaseClient, organizationId: string, members: readonly Member[], today: string) {
  const { vendors, assessments, links } = await readVendorsAndAssessments(supabase, organizationId);
  const documents = await readDocuments(supabase, organizationId, vendors.map((v) => v.id));
  const fromVendor = await readFromVendor(supabase, organizationId, documents);
  const names = await namesFor(
    supabase,
    members,
    assessments.flatMap((a) => [a.created_by, a.submitted_by, a.reviewed_by]),
  );
  const rows = vendors.map((v) => vendorToApi(v, assessments, documents.get(v.id) ?? [], names, today, links, fromVendor));
  const processors = rows.filter((r) => r.isProcessor);
  return {
    today,
    counts: {
      vendors: rows.length,
      processors: processors.length,
      contractGaps: processors.filter((r) => r.contractGap).length,
      accepted: processors.filter((r) => r.current !== null).length,
      neverAssessed: processors.filter((r) => r.current === null).length,
      awaitingReview: rows.filter((r) => r.open?.status === "submitted").length,
      withVendor: rows.filter((r) => r.open?.withVendor).length,
      outOfDate: processors.filter((r) => r.current?.outOfDate).length,
    },
    vendors: rows,
  };
}

export async function readProcessor(supabase: AppSupabaseClient, organizationId: string, vendorId: string, members: readonly Member[], today: string) {
  const { vendors, assessments, links } = await readVendorsAndAssessments(supabase, organizationId, vendorId);
  const v = vendors[0];
  if (!v) return null;
  const documents = await readDocuments(supabase, organizationId, [v.id]);
  const fromVendor = await readFromVendor(supabase, organizationId, documents);
  const names = await namesFor(supabase, members, assessments.flatMap((a) => [a.created_by, a.submitted_by, a.reviewed_by]));
  return vendorToApi(v, assessments, documents.get(v.id) ?? [], names, today, links, fromVendor);
}

/**
 * One assessment with its answers, read for the questionnaire and the review:
 * who answered what, which documents back which answer, the score (stored
 * once submitted; core's live preview for a draft), what is still missing,
 * and the consistency flags against the register as it stands today.
 */
export async function readAssessmentDetail(
  supabase: AppSupabaseClient,
  organizationId: string,
  vendorId: string,
  assessmentId: string,
  members: readonly Member[],
  today: string,
) {
  const processor = await readProcessor(supabase, organizationId, vendorId, members, today);
  if (!processor) return null;
  const { data: row, error } = await supabase
    .from("vendor_assessments")
    .select(ASSESSMENT_COLUMNS)
    .eq("organization_id", organizationId)
    .eq("vendor_id", vendorId)
    .eq("id", assessmentId)
    .maybeSingle();
  if (error) throw error;
  if (!row) return null;
  const { data: answers, error: aError } = await supabase
    .from("vendor_assessment_answers")
    .select(ANSWER_COLUMNS)
    .eq("organization_id", organizationId)
    .eq("assessment_id", assessmentId);
  if (aError) throw aError;
  const rows = (answers ?? []) as AnswerRow[];
  const assessment = row as AssessmentRow;
  const links = await readLinks(supabase, organizationId, [assessmentId]);
  const names = await namesFor(supabase, members, [
    assessment.created_by,
    assessment.submitted_by,
    assessment.reviewed_by,
    ...rows.map((a) => a.answered_by),
    ...links.flatMap((l) => [l.created_by, l.revoked_by]),
  ]);
  const now = new Date();

  const counting = new Set(processor.documents.filter((d) => d.counts).map((d) => d.id));
  const mapped = rows.map((a) => ({ code: a.question_code, answer: a.answer, notApplicable: a.not_applicable, evidenceId: a.evidence_id }));
  const preview = vendorRisk(mapped.map((a) => ({ ...a, documented: a.evidenceId !== null && counting.has(a.evidenceId) })));
  const header = assessmentToApi(assessment, names, today, links, now);
  const frozen = assessment.status === "submitted" || assessment.status === "accepted";
  const involved = [
    ...new Set(
      [assessment.created_by, assessment.submitted_by, ...rows.map((a) => a.answered_by), ...links.map((l) => l.created_by)].filter(
        (x): x is string => x !== null,
      ),
    ),
  ];
  const apiLinks = links.map((l) => linkToApi(l, names, now));
  return {
    processor,
    assessment: {
      ...header,
      // Once submitted the score is the database's, stored; a draft shows core's preview of the same rule.
      riskScore: frozen ? header.riskScore : preview.score,
      riskTier: frozen ? header.riskTier : preview.tier,
      riskTierLabel: frozen ? header.riskTierLabel : preview.tier ? VENDOR_RISK_TIER_LABEL[preview.tier] : null,
      unevidenced: frozen ? header.unevidenced : preview.unevidenced,
      riskIsPreview: !frozen,
      answered: preview.answered,
      notApplicable: preview.notApplicable,
      scorable: preview.scorable,
      missing: missingAnswers(mapped),
      flags: consistencyFlags(mapped, processor.facts),
      /** Who may not review it: everyone who created, answered or submitted it (D-043's rule), or sent the vendor a link to it (D-092). */
      involved,
      /** Every link sent to the vendor for this version, newest first; `openLink` is the one the vendor may still use. */
      links: apiLinks,
      openLink: apiLinks.find((l) => l.state === "open") ?? null,
      answers: rows.map((a) => ({
        code: a.question_code,
        answer: a.answer,
        notApplicable: a.not_applicable,
        naReason: a.na_reason,
        evidenceId: a.evidence_id,
        answeredBy: a.answered_by,
        answeredByName: nameOf(names, a.answered_by),
        /** No one in the organisation: the vendor's respondent answered it through a link. */
        answeredByVendor: links.length > 0 && a.answered_by === null,
        answeredAt: a.answered_at,
      })),
    },
  };
}

export type AssessmentDetailApi = NonNullable<Awaited<ReturnType<typeof readAssessmentDetail>>>;
