import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import CompassScoreGauge from '@/components/modules/assessment/CompassScoreGauge'
import MaturityBadge from '@/components/modules/assessment/MaturityBadge'
import GapReportCard from '@/components/modules/assessment/GapReportCard'
import { RISK_TIERS } from '@/lib/constants'
import type { Assessment, AssessmentGap } from '@/types/dpdp'

const PRIORITY_ORDER: Record<string, number> = { p0: 0, p1: 1, p2: 2, p3: 3 }

export default async function AssessmentResultsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .limit(1)
    .single()

  if (!membership) redirect('/create-organization')

  const { data: assessment } = await supabase
    .from('assessments')
    .select('*')
    .eq('id', id)
    .eq('organization_id', membership.organization_id)
    .single()

  if (!assessment) redirect('/dashboard/assessment')

  const assessmentData = assessment as Assessment

  if (assessmentData.status !== 'completed') {
    redirect(`/dashboard/assessment/${id}`)
  }

  const { data: gaps } = await supabase
    .from('assessment_gaps')
    .select('*')
    .eq('assessment_id', id)

  const allGaps = ((gaps ?? []) as AssessmentGap[]).sort(
    (a, b) => (PRIORITY_ORDER[a.priority] ?? 4) - (PRIORITY_ORDER[b.priority] ?? 4)
  )

  const openGaps = allGaps.filter(g => !g.resolved)
  const p0Gaps = openGaps.filter(g => g.priority === 'p0')
  const riskConfig = assessmentData.risk_tier ? RISK_TIERS[assessmentData.risk_tier] : null

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
            Assessment completed ·{' '}
            {new Date(assessmentData.completed_at!).toLocaleDateString('en-IN', {
              day: 'numeric', month: 'long', year: 'numeric',
            })}
          </p>
          <h1 className="text-2xl font-bold text-[#003366]">DPDP Compass™ Report</h1>
        </div>
        <Link
          href="/dashboard/assessment"
          className="text-sm text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0 mt-1"
        >
          ← All assessments
        </Link>
      </div>

      {/* Score card */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8">
        <div className="flex flex-col sm:flex-row items-center gap-8">
          {/* Gauge */}
          <div className="flex-shrink-0">
            <CompassScoreGauge
              score={assessmentData.compass_score!}
              maturityLevel={assessmentData.maturity_level!}
              size="lg"
            />
          </div>

          {/* Score breakdown */}
          <div className="flex-1 space-y-4">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Maturity Level</p>
              <MaturityBadge level={assessmentData.maturity_level!} size="lg" />
            </div>

            {riskConfig && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Risk Tier</p>
                <span
                  className="inline-block text-sm font-semibold px-3 py-1 rounded-full"
                  style={{ color: riskConfig.color, backgroundColor: riskConfig.bgColor }}
                >
                  {riskConfig.label}
                </span>
              </div>
            )}

            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Gap Summary</p>
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">{p0Gaps.length}</p>
                  <p className="text-xs text-gray-400">Critical (P0)</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-500">{openGaps.filter(g => g.priority === 'p1').length}</p>
                  <p className="text-xs text-gray-400">High (P1)</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{openGaps.filter(g => g.priority === 'p2').length}</p>
                  <p className="text-xs text-gray-400">Medium (P2)</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{openGaps.filter(g => g.priority === 'p3').length}</p>
                  <p className="text-xs text-gray-400">Low (P3)</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Download PDF — coming soon */}
      <div className="flex items-center justify-between bg-gray-50 rounded-xl border border-gray-100 px-5 py-3.5">
        <div>
          <p className="text-sm font-semibold text-gray-700">Board-Ready PDF Report</p>
          <p className="text-xs text-gray-400">Export a shareable compliance report for your leadership team</p>
        </div>
        <button
          disabled
          className="text-sm bg-gray-200 text-gray-400 px-4 py-2 rounded-lg cursor-not-allowed"
        >
          Coming Soon
        </button>
      </div>

      {/* Gap report */}
      {openGaps.length > 0 ? (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
              Gap Report — {openGaps.length} open item{openGaps.length !== 1 ? 's' : ''}
            </h2>
            <p className="text-xs text-gray-400">Sorted by priority (P0 first)</p>
          </div>

          <div className="space-y-3">
            {allGaps.map(gap => (
              <GapReportCard key={gap.id} gap={gap} />
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center">
          <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-lg font-bold text-green-700 mb-1">All gaps resolved!</p>
          <p className="text-sm text-gray-400">Your organization has addressed all identified compliance gaps.</p>
        </div>
      )}

      {/* Next steps CTA */}
      {p0Gaps.length > 0 && (
        <div className="bg-red-50 rounded-xl border border-red-100 p-5">
          <h3 className="text-sm font-bold text-red-800 mb-2">
            ⚠️ {p0Gaps.length} Critical Gap{p0Gaps.length !== 1 ? 's' : ''} Require Immediate Attention
          </h3>
          <p className="text-sm text-red-700 mb-3">
            P0 gaps represent direct violations of the DPDP Act. Address these first to reduce your penalty risk.
          </p>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/dashboard/consent"
              className="text-xs bg-white text-red-700 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
            >
              Set up Consent Management →
            </Link>
            <Link
              href="/dashboard/grievance"
              className="text-xs bg-white text-red-700 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
            >
              Appoint Grievance Officer →
            </Link>
            <Link
              href="/dashboard/privacy-notice"
              className="text-xs bg-white text-red-700 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
            >
              Build Privacy Notice →
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
