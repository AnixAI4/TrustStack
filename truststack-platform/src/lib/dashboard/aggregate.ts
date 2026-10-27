// M9 Board Dashboard — server-side data aggregation.
// Reads M1–M4 tables (no new tables). Used by /api/dashboard/overview and the
// board report routes. The Supabase client is passed in so this stays usable
// with either the auth server client or the admin client.

import type { SupabaseClient } from '@supabase/supabase-js'
import { MATURITY_LEVELS } from '@/lib/constants'
import type {
  OverviewResponse,
  OverviewModuleStatus,
  TopAction,
  TopActionPriority,
  RecentActivityItem,
  GapPriority,
  BoardReportData,
  BoardReportModuleRow,
  BoardReportGapItem,
  BoardReportTimelineItem,
  BoardComplianceCoverage,
} from '@/types/dpdp'

type DB = SupabaseClient

const DAY_MS = 86_400_000

// ── Pure helpers (also reused by the report PDF) ────────────────────────────

export function maturityFromScore(score: number): 1 | 2 | 3 | 4 | 5 {
  if (score <= 20) return 1
  if (score <= 40) return 2
  if (score <= 60) return 3
  if (score <= 80) return 4
  return 5
}

// Step 5 — the "effective" score: M1's assessment score nudged upward as the
// org completes modules, capped at +20 total and 100 overall. Completing a
// module visibly raises the headline number, which motivates finishing setup.
export function computeEffectiveScore(baseScore: number, m: OverviewModuleStatus): number {
  let bonus = 0
  if (m.m2_consent.status === 'active') bonus += 5
  if (m.m3_notice.status === 'published') bonus += 5
  if (m.m4_grievance.status === 'officer_set') bonus += 5
  if (m.m4_grievance.status === 'officer_set' && m.m4_grievance.open_complaints === 0) bonus += 2
  return Math.min(100, baseScore + Math.min(bonus, 20))
}

const MODULE_TO_URL: Record<string, string> = {
  M1: '/dashboard/assessment',
  M2: '/dashboard/consent',
  M3: '/dashboard/privacy-notice',
  M4: '/dashboard/grievance',
  M5: '/dashboard/dsr',
  M6: '/dashboard/ropa',
  M7: '/dashboard/vendors',
  M8: '/dashboard/breach',
}

// `module_to_fix` is stored as e.g. "M2: Consent Management" — map the leading
// token to its dashboard route so priority actions are clickable.
export function moduleToUrl(moduleToFix: string | null): string {
  if (!moduleToFix) return '/dashboard/overview'
  const token = moduleToFix.split(':')[0].trim().toUpperCase()
  return MODULE_TO_URL[token] ?? '/dashboard/overview'
}

const PRIORITY_RANK: Record<GapPriority, number> = { p0: 0, p1: 1, p2: 2, p3: 3 }

function startOfMonthISO(): string {
  const d = new Date()
  d.setDate(1)
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

// ── Raw collection ──────────────────────────────────────────────────────────

interface AssessmentRow {
  id: string
  compass_score: number | null
  maturity_level: number | null
  risk_tier: string | null
  completed_at: string | null
  created_at: string
}

interface GapRow {
  question_id: string
  gap_description: string
  priority: GapPriority
  recommended_action: string
  module_to_fix: string | null
}

interface DashboardRaw {
  latest: AssessmentRow | null
  previous: AssessmentRow | null
  gaps: GapRow[]
  moduleStatus: OverviewModuleStatus
  consentConfigCreatedAt: string | null
  recordsThisMonth: number
  noticePublishedAt: string | null
  noticeVersion: number | undefined
  officerName: string | null
  officerAppointedAt: string | null
  openComplaints: number
  recentComplaints: Array<{ reference_number: string; created_at: string }>
}

async function collect(supabase: DB, orgId: string): Promise<DashboardRaw> {
  // Independent reads in parallel. Missing tables surface as errors with null
  // data — every consumer below treats null as "not set up", so the dashboard
  // degrades gracefully instead of 500-ing.
  const [
    assessmentsRes,
    consentConfigRes,
    consentCountRes,
    noticeRes,
    officerRes,
    openCountRes,
    recentComplaintsRes,
  ] = await Promise.all([
    supabase
      .from('assessments')
      .select('id, compass_score, maturity_level, risk_tier, completed_at, created_at')
      .eq('organization_id', orgId)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(2),
    supabase
      .from('consent_configs')
      .select('created_at')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('consent_records')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .gte('created_at', startOfMonthISO()),
    supabase
      .from('privacy_notices')
      .select('id, published, current_version_id')
      .eq('organization_id', orgId)
      .maybeSingle(),
    supabase
      .from('grievance_officers')
      .select('name, appointed_at')
      .eq('organization_id', orgId)
      .eq('active', true)
      .order('appointed_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('grievance_complaints')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .in('status', ['new', 'under_review']),
    supabase
      .from('grievance_complaints')
      .select('reference_number, created_at')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const assessments = (assessmentsRes.data ?? []) as AssessmentRow[]
  const latest = assessments[0] ?? null
  const previous = assessments[1] ?? null

  // Dependent reads: gaps for the latest assessment + the relevant notice version.
  const notice = noticeRes.data as { id: string; published: boolean; current_version_id: string | null } | null

  const [gapsRes, noticeVersionInfo] = await Promise.all([
    latest
      ? supabase
          .from('assessment_gaps')
          .select('question_id, gap_description, priority, recommended_action, module_to_fix')
          .eq('assessment_id', latest.id)
          .eq('resolved', false)
      : Promise.resolve({ data: [] as GapRow[] }),
    resolveNoticeVersion(supabase, notice),
  ])

  const gaps = (gapsRes.data ?? []) as GapRow[]

  const consentConfig = consentConfigRes.data as { created_at: string } | null
  const recordsThisMonth = consentCountRes.count ?? 0
  const officer = officerRes.data as { name: string; appointed_at: string } | null
  const openComplaints = openCountRes.count ?? 0
  const recentComplaints = (recentComplaintsRes.data ?? []) as Array<{ reference_number: string; created_at: string }>

  const m2_status: OverviewModuleStatus['m2_consent']['status'] = consentConfig ? 'active' : 'not_configured'

  const moduleStatus: OverviewModuleStatus = {
    m1_assessment: latest
      ? { status: 'complete', last_score: latest.compass_score ?? undefined }
      : { status: 'not_started' },
    m2_consent: { status: m2_status, records_this_month: recordsThisMonth },
    m3_notice: {
      status: noticeVersionInfo.status,
      version: noticeVersionInfo.version,
      days_until_renewal: noticeVersionInfo.daysUntilRenewal ?? undefined,
    },
    m4_grievance: {
      status: officer ? 'officer_set' : 'no_officer',
      officer_name: officer?.name,
      open_complaints: openComplaints,
    },
  }

  return {
    latest,
    previous,
    gaps,
    moduleStatus,
    consentConfigCreatedAt: consentConfig?.created_at ?? null,
    recordsThisMonth,
    noticePublishedAt: noticeVersionInfo.publishedAt,
    noticeVersion: noticeVersionInfo.version,
    officerName: officer?.name ?? null,
    officerAppointedAt: officer?.appointed_at ?? null,
    openComplaints,
    recentComplaints,
  }
}

interface NoticeVersionInfo {
  status: 'published' | 'draft' | 'not_created'
  version: number | undefined
  publishedAt: string | null
  daysUntilRenewal: number | null
}

async function resolveNoticeVersion(
  supabase: DB,
  notice: { id: string; published: boolean; current_version_id: string | null } | null
): Promise<NoticeVersionInfo> {
  if (!notice) return { status: 'not_created', version: undefined, publishedAt: null, daysUntilRenewal: null }

  if (notice.published && notice.current_version_id) {
    const { data: v } = await supabase
      .from('privacy_notice_versions')
      .select('version_number, published_at')
      .eq('id', notice.current_version_id)
      .maybeSingle()
    if (v) {
      const publishedAt = (v as { published_at: string | null }).published_at
      const version = (v as { version_number: number }).version_number
      const daysUntilRenewal = publishedAt
        ? Math.max(0, 365 - Math.floor((Date.now() - new Date(publishedAt).getTime()) / DAY_MS))
        : null
      return { status: 'published', version, publishedAt, daysUntilRenewal }
    }
  }

  // Not published (or current version missing): is there any draft version?
  const { data: latestVersion } = await supabase
    .from('privacy_notice_versions')
    .select('version_number')
    .eq('notice_id', notice.id)
    .order('version_number', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (latestVersion) {
    return {
      status: 'draft',
      version: (latestVersion as { version_number: number }).version_number,
      publishedAt: null,
      daysUntilRenewal: null,
    }
  }
  return { status: 'not_created', version: undefined, publishedAt: null, daysUntilRenewal: null }
}

// ── M5–M8 compliance coverage (P1.5 FIX3) ───────────────────────────────────
// Read-time counts for the board view. Every read is independent and tolerant of
// an empty/absent table: count queries fall back to 0, single-row reads to null,
// so a freshly-onboarded org (or one missing a table) degrades to zeros instead
// of 500-ing. Definitions mirror the modules' own derived helpers:
//   DSR  open  = status in (received|identity_pending|processing); overdue = open && past due_date (dsr/sla.ts)
//   Vendor overdue = dpa_status 'expired' OR a 'signed' DPA past dpa_expires_at (vendors/status.ts)
//   Breach open = status != 'resolved'; past-deadline = un-notified && past the 72h due_at (breach/countdown.ts)
export async function collectComplianceCoverage(supabase: DB, orgId: string): Promise<BoardComplianceCoverage> {
  const nowISO = new Date().toISOString()
  const thirtyDaysAgoISO = new Date(Date.now() - 30 * DAY_MS).toISOString()
  const DSR_OPEN = ['received', 'identity_pending', 'processing']
  const headCount = (table: string) => supabase.from(table).select('id', { count: 'exact', head: true }).eq('organization_id', orgId)

  const [
    dsrPendingRes,
    dsrOverdueRes,
    dsrCompletedRes,
    ropaActiveRes,
    ropaLastReviewRes,
    vendorTotalRes,
    vendorExpiredRes,
    vendorLapsedRes,
    breachOpenRes,
    breachPastDpbiRes,
    breachLastRes,
  ] = await Promise.all([
    headCount('dsr_requests').in('status', DSR_OPEN),
    headCount('dsr_requests').in('status', DSR_OPEN).lt('due_date', nowISO),
    headCount('dsr_requests').eq('status', 'fulfilled').gte('fulfilled_at', thirtyDaysAgoISO),
    headCount('ropa_entries').eq('status', 'active'),
    supabase
      .from('ropa_entries')
      .select('last_reviewed_at')
      .eq('organization_id', orgId)
      .not('last_reviewed_at', 'is', null)
      .order('last_reviewed_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    headCount('vendors'),
    headCount('vendors').eq('dpa_status', 'expired'),
    headCount('vendors').eq('dpa_status', 'signed').lt('dpa_expires_at', nowISO),
    headCount('breach_incidents').neq('status', 'resolved'),
    headCount('breach_incidents').eq('dpbi_notified', false).lt('dpbi_notification_due_at', nowISO),
    supabase
      .from('breach_incidents')
      .select('discovered_at')
      .eq('organization_id', orgId)
      .order('discovered_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  const ropaLast = ropaLastReviewRes.data as { last_reviewed_at: string | null } | null
  const breachLast = breachLastRes.data as { discovered_at: string | null } | null

  return {
    dsr: {
      pending: dsrPendingRes.count ?? 0,
      overdue: dsrOverdueRes.count ?? 0,
      completed_last_30_days: dsrCompletedRes.count ?? 0,
    },
    ropa: {
      active_entries: ropaActiveRes.count ?? 0,
      last_review_date: ropaLast?.last_reviewed_at ?? null,
    },
    vendors: {
      total: vendorTotalRes.count ?? 0,
      // 'expired' and 'signed' are disjoint dpa_status values, so summing the two
      // counts can't double-count a vendor.
      overdue_assessments: (vendorExpiredRes.count ?? 0) + (vendorLapsedRes.count ?? 0),
    },
    breach: {
      open_incidents: breachOpenRes.count ?? 0,
      past_dpbi_deadline: breachPastDpbiRes.count ?? 0,
      last_incident_date: breachLast?.discovered_at ?? null,
    },
  }
}

// ── Shaping ──────────────────────────────────────────────────────────────────

function buildTopActions(gaps: GapRow[], limit = 6): TopAction[] {
  return [...gaps]
    .sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority])
    .slice(0, limit)
    .map(g => ({
      priority: (g.priority === 'p3' ? 'p2' : g.priority) as TopActionPriority,
      title: g.gap_description,
      description: g.recommended_action,
      module: g.module_to_fix ?? '',
      action_url: moduleToUrl(g.module_to_fix),
    }))
}

function buildRecentActivity(raw: DashboardRaw): RecentActivityItem[] {
  const events: RecentActivityItem[] = []

  raw.recentComplaints.forEach(c =>
    events.push({ timestamp: c.created_at, type: 'complaint', description: `New complaint ${c.reference_number}` })
  )
  if (raw.latest?.completed_at) {
    events.push({
      timestamp: raw.latest.completed_at,
      type: 'assessment',
      description: `Compass Assessment completed — score ${raw.latest.compass_score ?? '—'}`,
    })
  }
  if (raw.consentConfigCreatedAt) {
    events.push({ timestamp: raw.consentConfigCreatedAt, type: 'consent_activated', description: 'Consent widget configured' })
  }
  if (raw.noticePublishedAt) {
    events.push({
      timestamp: raw.noticePublishedAt,
      type: 'notice_published',
      description: `Privacy notice published${raw.noticeVersion ? ` (v${raw.noticeVersion})` : ''}`,
    })
  }
  if (raw.officerAppointedAt && raw.officerName) {
    events.push({
      timestamp: raw.officerAppointedAt,
      type: 'officer_appointed',
      description: `Grievance officer appointed: ${raw.officerName}`,
    })
  }

  return events
    .filter(e => !!e.timestamp)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 6)
}

function countCompletedModules(m: OverviewModuleStatus): number {
  return [
    m.m1_assessment.status === 'complete',
    m.m2_consent.status === 'active',
    m.m3_notice.status === 'published',
    m.m4_grievance.status === 'officer_set',
  ].filter(Boolean).length
}

// ── Public: overview ─────────────────────────────────────────────────────────

export async function getOverviewData(supabase: DB, orgId: string, orgName: string): Promise<OverviewResponse> {
  const [raw, compliance] = await Promise.all([
    collect(supabase, orgId),
    collectComplianceCoverage(supabase, orgId),
  ])
  const { latest, previous, moduleStatus, gaps } = raw

  const baseScore = latest?.compass_score ?? null
  const effective = baseScore != null ? computeEffectiveScore(baseScore, moduleStatus) : null
  const maturity = effective != null ? maturityFromScore(effective) : null

  // Trend = raw assessment-score delta vs the previous completed assessment.
  const scoreTrend =
    latest?.compass_score != null && previous?.compass_score != null
      ? latest.compass_score - previous.compass_score
      : null

  return {
    org_name: orgName,
    compass_score: baseScore,
    effective_score: effective,
    maturity_level: maturity,
    risk_tier: (latest?.risk_tier as OverviewResponse['risk_tier']) ?? null,
    score_trend: scoreTrend,
    last_assessment_date: latest?.completed_at ?? latest?.created_at ?? null,
    modules_completed: countCompletedModules(moduleStatus),
    module_status: moduleStatus,
    stats: {
      consent_records_this_month: raw.recordsThisMonth,
      open_complaints: raw.openComplaints,
      unresolved_gaps: gaps.length,
      critical_gaps: gaps.filter(g => g.priority === 'p0').length,
      days_until_notice_renewal: moduleStatus.m3_notice.days_until_renewal ?? null,
    },
    top_actions: buildTopActions(gaps),
    recent_activity: buildRecentActivity(raw),
    compliance,
  }
}

// ── Public: board report facts (everything except the AI summary) ─────────────

export interface ReportFacts {
  report: BoardReportData // summary is '' here; filled by the generate route
  modules_completed: number
}

export async function getReportFacts(
  supabase: DB,
  orgId: string,
  orgName: string,
  fromDate: string,
  toDate: string
): Promise<ReportFacts> {
  const [raw, compliance] = await Promise.all([
    collect(supabase, orgId),
    collectComplianceCoverage(supabase, orgId),
  ])
  const { latest, previous, moduleStatus, gaps } = raw

  const baseScore = latest?.compass_score ?? null
  const effective = baseScore != null ? computeEffectiveScore(baseScore, moduleStatus) : null
  const maturity = effective != null ? maturityFromScore(effective) : null
  const scoreTrend =
    latest?.compass_score != null && previous?.compass_score != null
      ? latest.compass_score - previous.compass_score
      : null

  // Period-scoped numbers: consent volume this window vs the equal window before
  // it, and complaints resolved within the window.
  const from = new Date(fromDate)
  const to = new Date(toDate)
  const windowMs = Math.max(DAY_MS, to.getTime() - from.getTime())
  const prevFrom = new Date(from.getTime() - windowMs)

  const [consentThisRes, consentLastRes, resolvedRes] = await Promise.all([
    supabase
      .from('consent_records')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .gte('created_at', from.toISOString())
      .lte('created_at', to.toISOString()),
    supabase
      .from('consent_records')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .gte('created_at', prevFrom.toISOString())
      .lt('created_at', from.toISOString()),
    supabase
      .from('grievance_complaints')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .eq('status', 'resolved')
      .gte('resolved_at', from.toISOString())
      .lte('resolved_at', to.toISOString()),
  ])

  const fmtDate = (iso: string | null) =>
    iso ? new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : null

  const modules: BoardReportModuleRow[] = [
    {
      module: 'M1 Compass Assessment',
      status: moduleStatus.m1_assessment.status === 'complete' ? 'Completed' : 'Not started',
      metric: latest?.compass_score != null ? `Score ${latest.compass_score}/100` : '—',
      last_updated: fmtDate(latest?.completed_at ?? latest?.created_at ?? null),
    },
    {
      module: 'M2 Consent Management',
      status: moduleStatus.m2_consent.status === 'active' ? 'Active' : 'Not configured',
      metric: `${raw.recordsThisMonth} records this month`,
      last_updated: fmtDate(raw.consentConfigCreatedAt),
    },
    {
      module: 'M3 Privacy Notice',
      status:
        moduleStatus.m3_notice.status === 'published'
          ? 'Published'
          : moduleStatus.m3_notice.status === 'draft'
            ? 'Draft'
            : 'Not created',
      metric: moduleStatus.m3_notice.version ? `Version ${moduleStatus.m3_notice.version}` : '—',
      last_updated: fmtDate(raw.noticePublishedAt),
    },
    {
      module: 'M4 Grievance Officer',
      status: moduleStatus.m4_grievance.status === 'officer_set' ? 'Officer appointed' : 'No officer',
      metric: raw.officerName ?? '—',
      last_updated: fmtDate(raw.officerAppointedAt),
    },
  ]

  const toGapItem = (g: GapRow): BoardReportGapItem => ({
    priority: g.priority,
    title: g.gap_description,
    action: g.recommended_action,
    module: g.module_to_fix ?? '',
  })

  const actions_p0 = gaps.filter(g => g.priority === 'p0').map(toGapItem)
  const actions_p1 = gaps.filter(g => g.priority === 'p1').map(toGapItem)

  // Timeline: completed events that fall inside the window + standing upcoming items.
  const timeline: BoardReportTimelineItem[] = []
  const inWindow = (iso: string | null) =>
    !!iso && new Date(iso) >= from && new Date(iso) <= to
  if (inWindow(latest?.completed_at ?? null)) {
    timeline.push({ label: 'Compass Assessment completed', date: fmtDate(latest!.completed_at), kind: 'completed' })
  }
  if (inWindow(raw.noticePublishedAt)) {
    timeline.push({ label: 'Privacy notice published', date: fmtDate(raw.noticePublishedAt), kind: 'completed' })
  }
  if (inWindow(raw.officerAppointedAt)) {
    timeline.push({ label: 'Grievance officer appointed', date: fmtDate(raw.officerAppointedAt), kind: 'completed' })
  }
  if (inWindow(raw.consentConfigCreatedAt)) {
    timeline.push({ label: 'Consent widget configured', date: fmtDate(raw.consentConfigCreatedAt), kind: 'completed' })
  }
  if (moduleStatus.m3_notice.days_until_renewal != null) {
    const renewal = new Date(Date.now() + moduleStatus.m3_notice.days_until_renewal * DAY_MS)
    timeline.push({
      label: `Privacy notice renewal (${moduleStatus.m3_notice.days_until_renewal} days)`,
      date: fmtDate(renewal.toISOString()),
      kind: 'upcoming',
    })
  }
  if (latest) {
    const nextAssessment = new Date(Date.now() + 90 * DAY_MS)
    timeline.push({ label: 'Recommended re-assessment', date: fmtDate(nextAssessment.toISOString()), kind: 'upcoming' })
  }

  const report: BoardReportData = {
    org_name: orgName,
    period_from: fromDate,
    period_to: toDate,
    generated_at: new Date().toISOString(),
    compass_score: effective,
    base_score: baseScore,
    maturity_level: maturity,
    maturity_label: maturity ? MATURITY_LEVELS[maturity].label : null,
    score_trend: scoreTrend,
    summary: '',
    modules,
    metrics: {
      consent_this_period: consentThisRes.count ?? 0,
      consent_last_period: consentLastRes.count ?? 0,
      complaints_open: raw.openComplaints,
      complaints_resolved: resolvedRes.count ?? 0,
      gaps_p0: gaps.filter(g => g.priority === 'p0').length,
      gaps_p1: gaps.filter(g => g.priority === 'p1').length,
      gaps_p2plus: gaps.filter(g => g.priority === 'p2' || g.priority === 'p3').length,
      gaps_total: gaps.length,
    },
    actions_p0,
    actions_p1,
    timeline,
    compliance,
  }

  return { report, modules_completed: countCompletedModules(moduleStatus) }
}
