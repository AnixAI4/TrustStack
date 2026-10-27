'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { FileBarChart, ArrowRight, Compass, Circle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import CompassScoreGauge from '@/components/modules/assessment/CompassScoreGauge'
import ModuleStatusGrid from '@/components/modules/board/ModuleStatusGrid'
import StatsRow from '@/components/modules/board/StatsRow'
import PriorityActionsCard from '@/components/modules/board/PriorityActionsCard'
import RecentActivityFeed from '@/components/modules/board/RecentActivityFeed'
import ComplianceCalendar from '@/components/modules/board/ComplianceCalendar'
import ComplianceCoverage from '@/components/modules/board/ComplianceCoverage'
import type { OverviewResponse } from '@/types/dpdp'

function greeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

const ONBOARDING_ACTIONS = [
  { title: 'Start your DPDP Compass Assessment', href: '/dashboard/assessment' },
  { title: 'Appoint a Grievance Officer', href: '/dashboard/grievance' },
  { title: 'Configure Consent Management', href: '/dashboard/consent' },
  { title: 'Create your Privacy Notice', href: '/dashboard/privacy-notice' },
]

export default function OverviewPage() {
  const [data, setData] = useState<OverviewResponse | null>(null)
  const [firstName, setFirstName] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      const full = (user?.user_metadata?.full_name as string) || ''
      if (full) setFirstName(full.split(' ')[0])
    })

    fetch('/api/dashboard/overview')
      .then(r => (r.ok ? r.json() : Promise.reject()))
      .then((d: OverviewResponse) => setData(d))
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-4">
        <div className="h-8 bg-gray-100 rounded w-72 animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="h-56 bg-gray-100 rounded-xl animate-pulse" />
          <div className="h-56 bg-gray-100 rounded-xl animate-pulse lg:col-span-2" />
        </div>
        <div className="h-24 bg-gray-100 rounded-xl animate-pulse" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center text-sm text-gray-500">
          Could not load your dashboard. Please refresh the page.
        </div>
      </div>
    )
  }

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const hasScore = data.effective_score != null
  const isNewUser = !hasScore && data.modules_completed === 0

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#003366]">
            {greeting()}{firstName ? `, ${firstName}` : ''}
            <span className="text-gray-400 font-normal"> · {data.org_name}</span>
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">{today}</p>
        </div>
        <Link
          href="/dashboard/reports"
          className="inline-flex items-center gap-2 bg-[#003366] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#1A5276] transition-colors self-start"
        >
          <FileBarChart className="w-4 h-4" /> Board Report
        </Link>
      </div>

      {isNewUser ? (
        <EmptyState />
      ) : (
        <>
          {/* Score + module status */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col items-center justify-center">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 self-start">Compass Score™</p>
              {hasScore ? (
                <>
                  <CompassScoreGauge
                    score={data.effective_score as number}
                    maturityLevel={data.maturity_level as 1 | 2 | 3 | 4 | 5}
                    size="md"
                  />
                  <TrendLabel trend={data.score_trend} />
                </>
              ) : (
                <div className="text-center py-6">
                  <Compass className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500 mb-4">Complete your assessment to get your score</p>
                  <Link
                    href="/dashboard/assessment"
                    className="inline-flex items-center gap-1.5 bg-[#003366] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#1A5276] transition-colors"
                  >
                    Start Assessment <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              )}
            </div>
            <div className="lg:col-span-2">
              <ModuleStatusGrid moduleStatus={data.module_status} />
            </div>
          </div>

          {/* Stats */}
          <StatsRow stats={data.stats} />

          {/* Compliance coverage (M5–M8) */}
          <ComplianceCoverage coverage={data.compliance} />

          {/* Priority actions */}
          <PriorityActionsCard actions={data.top_actions} />

          {/* Activity + calendar */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <RecentActivityFeed items={data.recent_activity} />
            <ComplianceCalendar
              daysUntilNoticeRenewal={data.stats.days_until_notice_renewal}
              lastAssessmentDate={data.last_assessment_date}
              openComplaints={data.stats.open_complaints}
            />
          </div>
        </>
      )}
    </div>
  )
}

function TrendLabel({ trend }: { trend: number | null }) {
  if (trend == null) return <p className="text-xs text-gray-400 mt-3">First assessment on record</p>
  if (trend === 0) return <p className="text-xs text-gray-400 mt-3">No change from last assessment</p>
  const up = trend > 0
  return (
    <p className={`text-xs mt-3 font-medium ${up ? 'text-green-600' : 'text-red-600'}`}>
      {up ? '↑' : '↓'} {Math.abs(trend)} pts from last assessment
    </p>
  )
}

// Step 7 — first-time user: onboarding actions + a live 30-day plan tracker.
function EmptyState() {
  return (
    <>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center">
        <div className="w-16 h-16 bg-[#D6E4F0] rounded-full flex items-center justify-center mx-auto mb-4">
          <Compass className="w-8 h-8 text-[#003366]" />
        </div>
        <h2 className="text-xl font-bold text-[#003366] mb-1">Welcome to TrustStack™</h2>
        <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">
          Go from zero to DPDP-compliant in 30 days. Start with your Compass Assessment to get your score and a
          prioritized roadmap.
        </p>
        <Link
          href="/dashboard/assessment"
          className="inline-flex items-center gap-2 bg-[#003366] text-white px-6 py-3 rounded-lg text-sm font-semibold hover:bg-[#1A5276] transition-colors"
        >
          Start your assessment <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Get started actions */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Get Started</p>
          <ul className="space-y-2">
            {ONBOARDING_ACTIONS.map((a, i) => (
              <li key={a.href}>
                <Link
                  href={a.href}
                  className="group flex items-center gap-3 rounded-lg border border-gray-100 p-3 hover:border-[#003366]/20 hover:bg-gray-50 transition-colors"
                >
                  <span className="w-6 h-6 rounded-full bg-[#D6E4F0] text-[#003366] text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {i + 1}
                  </span>
                  <span className="text-sm font-medium text-gray-800 flex-1">{a.title}</span>
                  <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-[#003366] transition-colors" />
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* 30-day plan */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">30-Day DPDP Compliance Plan</p>
          <ul className="space-y-3">
            {[
              { range: 'Day 1–3', label: 'Complete Compass Assessment' },
              { range: 'Day 4–7', label: 'Review gaps and roadmap' },
              { range: 'Day 8–14', label: 'Consent widget live + Privacy Notice published' },
              { range: 'Day 15–21', label: 'Grievance Officer appointed' },
              { range: 'Day 22–30', label: 'First compliance review' },
            ].map(step => (
              <li key={step.range} className="flex items-start gap-3">
                <Circle className="w-4 h-4 text-gray-300 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="text-[11px] font-semibold text-[#2874A6] uppercase tracking-wide">{step.range}</span>
                  <p className="text-sm text-gray-700 leading-snug">{step.label}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  )
}
