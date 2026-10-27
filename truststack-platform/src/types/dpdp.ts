// TypeScript types for all DPDP domain objects

export type UserRole = 'admin' | 'dpo' | 'viewer' | 'board'

export interface Organization {
  id: string
  name: string
  slug: string
  cin: string | null
  gstin: string | null
  registered_state: string | null
  industry: string | null
  employee_count_range: string | null
  revenue_range: string | null
  created_at: string
  updated_at: string
}

export interface OrganizationMember {
  id: string
  organization_id: string
  user_id: string
  role: UserRole
  created_at: string
}

// M1: Assessment

export type AssessmentStatus = 'in_progress' | 'completed'
export type RiskTier = 'critical' | 'high' | 'medium' | 'low' | 'managed'
export type GapPriority = 'p0' | 'p1' | 'p2' | 'p3'

export type AssessmentSection =
  | 'org_profile'
  | 'data_fiduciary'
  | 'consent'
  | 'notice'
  | 'rights'
  | 'security'
  | 'breach'
  | 'vendor'
  | 'industry_fintech'
  | 'industry_healthtech'
  | 'industry_edtech'

export type AnswerValue = 'yes' | 'no' | 'partial' | string

export interface Assessment {
  id: string
  organization_id: string
  created_by: string
  status: AssessmentStatus
  compass_score: number | null
  maturity_level: 1 | 2 | 3 | 4 | 5 | null
  risk_tier: RiskTier | null
  completed_at: string | null
  created_at: string
  updated_at: string
}

export interface AssessmentAnswer {
  id: string
  assessment_id: string
  organization_id: string
  question_id: string
  section: AssessmentSection
  answer: AnswerValue
  created_at: string
}

export interface AssessmentGap {
  id: string
  assessment_id: string
  organization_id: string
  question_id: string
  gap_description: string
  priority: GapPriority
  dpdp_section: string | null
  recommended_action: string
  module_to_fix: string | null
  resolved: boolean
  resolved_at: string | null
  created_at: string
}

// Assessment question structure
export type QuestionType = 'yes_no_partial' | 'text' | 'select'

export interface AssessmentQuestion {
  id: string
  section: AssessmentSection
  text: string
  type: QuestionType
  options?: { value: string; label: string }[]
  pointValue: number
  scorable: boolean
  hint?: string
}

// Scoring result
export interface ScoringResult {
  compass_score: number
  maturity_level: 1 | 2 | 3 | 4 | 5
  risk_tier: RiskTier
  raw_score: number
  max_raw_score: number
  section_scores: Record<AssessmentSection, { earned: number; max: number }>
}

// Gap generation input
export interface GapDefinition {
  gap_description: string
  priority: GapPriority
  dpdp_section: string
  recommended_action: string
  module_to_fix: string
}

// Assessment with joined data (for results page)
export interface AssessmentWithResults extends Assessment {
  answers: AssessmentAnswer[]
  gaps: AssessmentGap[]
}

// M2: Consent

export type ConsentChannel = 'web' | 'whatsapp' | 'sms' | 'aadhaar'

export interface ConsentPurpose {
  id: string
  organization_id: string
  purpose_key: string
  name_en: string
  name_hi: string | null
  name_ta: string | null
  name_te: string | null
  description_en: string
  required: boolean
  dpdp_basis: string | null
  created_at: string
}

export interface ConsentConfig {
  id: string
  organization_id: string
  widget_version: string
  languages: string[]
  position: 'bottom-bar' | 'corner-popup' | 'center-modal'
  primary_color: string
  show_reject_all: boolean
  require_age_confirmation: boolean
  whatsapp_enabled: boolean
  whatsapp_template_id: string | null
  created_at: string
  updated_at: string
}

export interface ConsentConfigVersionPurpose {
  purpose_key: string
  name_en: string
  name_hi: string | null
  name_ta: string | null
  name_te: string | null
  description_en: string
  required: boolean
  dpdp_basis: string | null
}

export interface ConsentConfigVersion {
  id: string
  organization_id: string
  version: string
  purposes: ConsentConfigVersionPurpose[]
  languages: string[]
  position: 'bottom-bar' | 'corner-popup' | 'center-modal'
  primary_color: string
  show_reject_all: boolean
  require_age_confirmation: boolean
  whatsapp_enabled: boolean
  created_at: string
}

export interface ConsentRecord {
  id: string
  organization_id: string
  config_version: string
  data_principal_hash: string
  channel: ConsentChannel
  purposes_accepted: string[]
  purposes_rejected: string[]
  language: string
  user_agent: string | null
  ip_hash: string | null
  withdrawn: boolean
  withdrawn_at: string | null
  created_at: string
}

export interface ConsentStats {
  total_this_month: number
  consent_rate: number
  withdrawals_this_month: number
  by_channel: Record<string, number>
}

// M4: Grievance

export type GrievanceComplaintType = 'consent' | 'access' | 'correction' | 'erasure' | 'breach' | 'other'
export type GrievanceStatus = 'new' | 'under_review' | 'resolved' | 'escalated_to_dpbi'

export interface GrievanceOfficer {
  id: string
  organization_id: string
  name: string
  designation: string
  email: string
  phone: string | null
  active: boolean
  appointed_at: string
  created_at: string
}

export interface GrievanceComplaint {
  id: string
  organization_id: string
  reference_number: string
  complainant_name: string
  complainant_email: string | null
  complainant_phone: string | null
  complaint_type: GrievanceComplaintType
  description: string
  attachment_url: string | null
  language: string
  status: GrievanceStatus
  assigned_to: string | null
  resolution_notes: string | null
  resolved_at: string | null
  escalated_at: string | null
  created_at: string
  updated_at: string
}

// M3: Privacy Notice

export interface PrivacyNotice {
  id: string
  organization_id: string
  current_version_id: string | null
  slug: string
  published: boolean
  created_at: string
  updated_at: string
}

export interface PrivacyNoticeVersion {
  id: string
  notice_id: string
  organization_id: string
  version_number: number
  content_en: string
  content_hi: string | null
  content_ta: string | null
  content_te: string | null
  content_mr: string | null
  grievance_officer_name: string
  grievance_officer_email: string
  grievance_officer_phone: string | null
  change_summary: string | null
  published_at: string | null
  created_by: string | null
  created_at: string
}

// Builder (wizard) form shapes — what the dashboard collects before generation.
export interface NoticeCompanyDetails {
  legal_name: string
  registered_address: string
  cin: string
  contact_email: string
}

export interface NoticePurposeMapping {
  data_category: string
  purpose: string
  basis: string
}

export interface NoticeRetentionRule {
  data_category: string
  period: string
}

export interface NoticeSharing {
  third_parties: string[]
  cross_border: boolean
  countries: string
}

export interface NoticeBuilderData {
  company: NoticeCompanyDetails
  data_categories: string[]
  other_category?: string
  purposes: NoticePurposeMapping[]
  sharing: NoticeSharing
  retention: NoticeRetentionRule[]
  languages: string[]
}

// M9: Board Dashboard
// Aggregated, read-only view over M1–M4. Creates no tables.

export interface OverviewModuleStatus {
  m1_assessment: { status: 'complete' | 'in_progress' | 'not_started'; last_score?: number }
  m2_consent:    { status: 'active' | 'configured' | 'not_configured'; records_this_month?: number }
  m3_notice:     { status: 'published' | 'draft' | 'not_created'; version?: number; days_until_renewal?: number }
  m4_grievance:  { status: 'officer_set' | 'no_officer'; officer_name?: string; open_complaints?: number }
}

export type TopActionPriority = 'p0' | 'p1' | 'p2'

export interface TopAction {
  priority: TopActionPriority
  title: string
  description: string
  module: string
  action_url: string
}

export type ActivityType =
  | 'complaint'
  | 'consent_activated'
  | 'assessment'
  | 'notice_published'
  | 'officer_appointed'

export interface RecentActivityItem {
  timestamp: string
  type: ActivityType
  description: string
}

export interface OverviewStats {
  consent_records_this_month: number
  open_complaints: number
  unresolved_gaps: number
  critical_gaps: number // P0 gaps
  days_until_notice_renewal: number | null
}

export interface OverviewResponse {
  org_name: string
  // `compass_score` is the raw latest-assessment score (matches the M1 module).
  // `effective_score` adds module-completion bonuses (Step 5) and is what the gauge shows.
  compass_score: number | null
  effective_score: number | null
  maturity_level: 1 | 2 | 3 | 4 | 5 | null // derived from effective_score
  risk_tier: RiskTier | null
  score_trend: number | null // effective_score change vs the previous assessment
  last_assessment_date: string | null
  modules_completed: number // count of M1–M4 considered "done" (feeds the 30-day plan + report)
  module_status: OverviewModuleStatus
  stats: OverviewStats
  top_actions: TopAction[]
  recent_activity: RecentActivityItem[]
  compliance: BoardComplianceCoverage // M5–M8 operational coverage (P1.5 FIX3)
}

// Compass-score history (trend chart) — /api/dashboard/compass-score
export interface CompassScorePoint {
  assessment_id: string
  compass_score: number
  maturity_level: 1 | 2 | 3 | 4 | 5
  completed_at: string | null
  created_at: string
}

export interface CompassScoreHistory {
  current: CompassScorePoint | null
  history: CompassScorePoint[] // oldest → newest, up to 6
}

// Board report (PDF + on-screen preview) — /api/dashboard/report/generate + /pdf
export interface BoardReportModuleRow {
  module: string
  status: string
  metric: string
  last_updated: string | null
}

export interface BoardReportGapItem {
  priority: GapPriority
  title: string
  action: string
  module: string
}

export interface BoardReportTimelineItem {
  label: string
  date: string | null
  kind: 'completed' | 'upcoming'
}

// M5–M8 operational coverage for the board view (added P1.5 FIX3). All counts are
// derived at read time; dates are ISO strings or null when there's no data yet.
export interface BoardComplianceCoverage {
  dsr:     { pending: number; overdue: number; completed_last_30_days: number }
  ropa:    { active_entries: number; last_review_date: string | null }
  vendors: { total: number; overdue_assessments: number }
  breach:  { open_incidents: number; past_dpbi_deadline: number; last_incident_date: string | null }
}

export interface BoardReportData {
  org_name: string
  period_from: string
  period_to: string
  generated_at: string
  compass_score: number | null // effective score
  base_score: number | null    // raw assessment score
  maturity_level: 1 | 2 | 3 | 4 | 5 | null
  maturity_label: string | null
  score_trend: number | null
  summary: string // AI-generated executive summary (3 sentences)
  modules: BoardReportModuleRow[]
  metrics: {
    consent_this_period: number
    consent_last_period: number
    complaints_open: number
    complaints_resolved: number
    gaps_p0: number
    gaps_p1: number
    gaps_p2plus: number
    gaps_total: number
  }
  actions_p0: BoardReportGapItem[]
  actions_p1: BoardReportGapItem[]
  timeline: BoardReportTimelineItem[]
  compliance: BoardComplianceCoverage // M5–M8 operational coverage (P1.5 FIX3)
}

// M5: DSR (Data Subject Rights) Management

// The 6 actionable rights that create a dsr_requests row. Grievance redressal
// (Section 14) is handled by M4, so it is intentionally NOT a right_type here.
export type DsrRightType =
  | 'access'
  | 'correction'
  | 'completeness'
  | 'erasure'
  | 'restrict'
  | 'nominate'

export type DsrStatus =
  | 'received'
  | 'identity_pending'
  | 'processing'
  | 'fulfilled'
  | 'denied'
  | 'overdue'

export type DsrVerificationMethod = 'email_otp' | 'sms_otp' | 'aadhaar'

export interface DsrRequest {
  id: string
  organization_id: string
  reference_number: string
  right_type: DsrRightType
  requestor_name: string
  requestor_email: string | null
  requestor_phone: string | null
  requestor_identity_verified: boolean
  verification_method: DsrVerificationMethod | null
  request_details: string | null
  affected_data_categories: string[] | null
  status: DsrStatus
  assigned_to: string | null
  fulfillment_notes: string | null
  denial_reason: string | null
  fulfilled_at: string | null
  due_date: string | null
  created_at: string
  updated_at: string
}

export interface DsrNomination {
  id: string
  organization_id: string
  data_principal_hash: string
  nominee_name: string
  nominee_email: string
  nominee_phone: string | null
  relationship: string | null
  active: boolean
  created_at: string
}

export interface DsrStats {
  total: number
  open: number              // received + identity_pending + processing
  identity_pending: number
  overdue: number           // open AND past due_date (derived)
  fulfilled_this_month: number
  by_right_type: Record<string, number>
}

// M7: Vendor DPA Manager

// What the vendor processes for us. Matches vendors.vendor_type.
export type VendorType =
  | 'cloud'
  | 'payments'
  | 'analytics'
  | 'marketing'
  | 'crm'
  | 'hr'
  | 'communications'
  | 'other'

// DPA signing lifecycle. 'expired' may be set manually OR derived at read time
// from dpa_expires_at (see src/lib/vendors/status.ts).
export type VendorDpaStatus = 'pending' | 'sent' | 'signed' | 'expired'

// Computed from the questionnaire by src/lib/vendors/risk.ts (low → critical).
export type VendorRiskTier = 'low' | 'medium' | 'high' | 'critical'

export interface Vendor {
  id: string
  organization_id: string
  name: string
  website: string | null
  contact_name: string | null
  contact_email: string | null
  vendor_type: VendorType
  data_location: string[] | null
  india_data_residency: boolean
  personal_data_categories: string[] | null
  risk_tier: VendorRiskTier | null
  risk_score: number | null
  dpa_status: VendorDpaStatus
  dpa_signed_at: string | null
  dpa_expires_at: string | null
  dpa_document_url: string | null
  questionnaire_completed: boolean
  questionnaire_completed_at: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface VendorQuestionnaireResponse {
  id: string
  vendor_id: string
  organization_id: string
  question_id: string
  answer: string
  created_at: string
}

export interface VendorStats {
  total: number
  signed: number
  awaiting: number       // dpa_status pending + sent (DPA not yet signed)
  expiring_soon: number  // signed AND within 30 days of dpa_expires_at (derived)
  expired: number        // dpa_status='expired' OR derived past-expiry
  high_risk: number      // risk_tier high or critical
  by_status: Record<string, number>
  by_risk_tier: Record<string, number>
}

// M6: ROPA Builder — Record of Processing Activities

// Lifecycle of a processing-activity record. DPO sign-off flips draft → active.
export type RopaStatus = 'draft' | 'active' | 'archived'

// Whose personal data the activity processes (ropa_entries.data_subject_types).
export type RopaSubjectType =
  | 'customers'
  | 'employees'
  | 'children'
  | 'vendors'
  | 'website_visitors'

// A single Record of Processing Activity row (ropa_entries).
export interface RopaEntry {
  id: string
  organization_id: string
  activity_name: string
  activity_description: string | null
  data_controller_name: string
  data_categories: string[]            // DATA_CATEGORIES keys
  data_subject_types: string[]         // RopaSubjectType values
  processing_purposes: string[]
  legal_basis: string                  // DPDP_BASES id
  data_sources: string[] | null
  recipients: string[] | null
  cross_border_transfer: boolean
  transfer_countries: string[] | null
  retention_period: string | null
  security_measures: string[] | null
  processor_names: string[] | null
  dpo_approved: boolean
  dpo_approved_at: string | null
  last_reviewed_at: string | null
  status: RopaStatus
  created_by: string | null
  created_at: string
  updated_at: string
}

// ROPA ↔ Consent cross-reference, computed at READ TIME (no stored column).
// 'not_applicable' = the activity's legal basis is not consent (Section 6), so a
// consent purpose isn't expected. Otherwise 'configured'/'missing'.
export interface RopaConsentCoverage {
  status: 'configured' | 'missing' | 'not_applicable'
  matched_purposes: string[]  // names of the consent purposes that matched
}

export interface RopaStats {
  total: number
  draft: number
  active: number
  archived: number
  dpo_approved: number
  awaiting_approval: number   // not yet DPO-approved
  cross_border: number        // activities with a cross-border transfer
  consent_based: number       // activities whose legal basis is consent (S6)
  consent_configured: number  // consent-based activities WITH a matching consent purpose
  consent_gaps: number        // consent-based activities MISSING a consent purpose
  by_status: Record<string, number>
}

// Structured suggestion returned by POST /api/ropa/ai-suggest. Every field is
// optional — Claude fills what it can infer and the form merges it in. The route
// validates/sanitizes this defensively before returning (src/lib/ropa/ai.ts).
export interface RopaAiSuggestion {
  activity_name?: string
  activity_description?: string
  data_controller_name?: string
  data_categories?: string[]
  data_subject_types?: string[]
  processing_purposes?: string[]
  legal_basis?: string
  data_sources?: string[]
  recipients?: string[]
  cross_border_transfer?: boolean
  transfer_countries?: string[]
  retention_period?: string
  security_measures?: string[]
  processor_names?: string[]
}

// ============================================================================
// M8: Breach Response
// ============================================================================

// Nature of a personal data breach (breach_incidents.nature).
export type BreachNature =
  | 'unauthorized_access'
  | 'accidental_disclosure'
  | 'ransomware'
  | 'data_loss'
  | 'insider_threat'
  | 'other'

// Lifecycle of a breach incident. The 72-hour DPBI notification is tracked as a
// SEPARATE boolean (dpbi_notified), never a status value, so the two never
// collide — the schema's overlapping 'dpbi_notified' status value is unused.
export type BreachStatus = 'open' | 'contained' | 'resolved'

// Urgency band for the 72-hour countdown — derived at read time from the time
// remaining to dpbi_notification_due_at (see src/lib/breach/countdown.ts).
export type BreachUrgency = 'normal' | 'warning' | 'critical' | 'overdue'

// A single logged breach incident (breach_incidents row).
export interface BreachIncident {
  id: string
  organization_id: string
  reference_number: string                  // BRH-2026-001 — unique PER ORG, not global
  discovered_at: string                     // when the org became aware
  occurred_at: string | null                // when the breach actually happened (if known)
  nature: BreachNature
  data_categories_affected: string[]        // DATA_CATEGORIES keys
  data_subjects_affected_approx: number | null
  systems_involved: string[] | null
  discovery_method: string | null
  containment_actions: string | null
  // 72-hour DPBI countdown
  dpbi_notification_due_at: string          // discovered_at + 72h (stamped server-side on create)
  dpbi_notified: boolean
  dpbi_notified_at: string | null
  dpbi_notification_draft: string | null    // Claude-generated DPBI notification letter
  // Data principal notification
  principals_notified: boolean
  principals_notified_at: string | null
  notification_method: string | null
  // Status + post-mortem
  status: BreachStatus
  root_cause: string | null
  remediation_actions: string | null
  resolved_at: string | null
  // Escalation bookkeeping — which "hours remaining" thresholds have already
  // emailed the DPO, so /api/breach/escalations/run never double-sends.
  escalations_sent: string[] | null
  logged_by: string | null
  created_at: string
  updated_at: string
}

export interface BreachStats {
  total: number
  open: number                 // status open or contained (not resolved)
  awaiting_dpbi: number        // open AND not yet dpbi_notified
  overdue_dpbi: number         // awaiting_dpbi AND past the 72h deadline (derived)
  due_soon: number             // awaiting_dpbi AND within the escalation warning window (derived)
  resolved: number
  dpbi_notified: number
  by_nature: Record<string, number>
}

// API response types
export interface ApiError {
  error: string
}

export interface ApiSuccess<T = void> {
  success: true
  data: T
}
