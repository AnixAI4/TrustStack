'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { FileBarChart, FileText, ArrowRight, ArrowUpRight, AlertTriangle, ShieldCheck, ClipboardCheck, ListChecks, Gauge, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import ModuleStatusGrid from '@/components/platform/modules/board/ModuleStatusGrid'
import StatsRow from '@/components/platform/modules/board/StatsRow'
import PriorityActionsCard from '@/components/platform/modules/board/PriorityActionsCard'
import RecentActivityFeed from '@/components/platform/modules/board/RecentActivityFeed'
import ComplianceCalendar from '@/components/platform/modules/board/ComplianceCalendar'
import ComplianceCoverage from '@/components/platform/modules/board/ComplianceCoverage'
import { Reveal, RevealGroup, RevealItem } from '@/components/ui/Reveal'
import { ModulePageHeader, ModulePageSkeleton } from '@/components/platform/ui/ModulePageHeader'
import { ModulePage } from '@/components/platform/ui/ModulePage'
import { MATURITY_LEVELS } from '@/lib/platform/constants'
import type { OverviewResponse } from '@/types/dpdp'

const OVERVIEW_CACHE_TTL_MS = 10_000
let overviewCache: {
  userId: string
  data: OverviewResponse
  cachedAt: number
} | null = null

function greeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function OverviewPage() {
  const [data, setData] = useState<OverviewResponse | null>(null)
  const [firstName, setFirstName] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function loadOverview(isCancelled?: () => boolean) {
    setError(null)
    let hasCachedData = false
    try {
      const supabase = createClient()
      const auth = await supabase.auth.getSession()
      const full = (auth.data.session?.user.user_metadata?.full_name as string) || ''
      const userId = auth.data.session?.user.id
      if (isCancelled?.()) return
      if (full) setFirstName(full.split(' ')[0])

      if (userId && overviewCache?.userId === userId) {
        hasCachedData = true
        setData(overviewCache.data)
        setLoading(false)
        if (Date.now() - overviewCache.cachedAt < OVERVIEW_CACHE_TTL_MS) return
      } else {
        setLoading(true)
      }

      const res = await fetch('/api/trustdeck/dashboard/overview', {
        credentials: 'include',
        cache: 'default',
      })
      const body = await res.json().catch(() => ({}))
      if (isCancelled?.()) return
      if (!res.ok) {
        throw new Error(
          (body as { error?: string }).error || `Failed to load (${res.status})`
        )
      }
      const nextData = body as OverviewResponse
      setData(nextData)
      if (userId) overviewCache = { userId, data: nextData, cachedAt: Date.now() }
    } catch (err) {
      if (isCancelled?.()) return
      if (!hasCachedData) {
        setData(null)
        setError(err instanceof Error ? err.message : 'Could not load dashboard')
      }
    } finally {
      if (!isCancelled?.()) setLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    void loadOverview(() => cancelled)
    return () => { cancelled = true }
  }, [])

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  if (loading) {
    return (
      <div className="platform-overview mx-auto max-w-7xl space-y-7">
        <Reveal>
          <ModulePageHeader
            eyebrow={today}
            title="Overview"
            description={
              <>
                {greeting()}
                {firstName ? `, ${firstName}` : ''}. Here is today&apos;s compliance position.
              </>
            }
            action={
              <Link href="/trustdeck/reports" className="btn btn-ghost inline-flex h-10 items-center gap-2">
                <FileBarChart className="h-4 w-4" /> Board report
              </Link>
            }
          />
        </Reveal>
        <ModulePageSkeleton cards={6} showHeader={false} className="max-w-none" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-7xl">
        <div className="rounded-xl border border-line bg-bg-2 p-8 text-center shadow-card">
          <h2 className="font-display text-lg font-semibold text-text">
            Couldn&apos;t load your dashboard
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-text-muted">
            {error || 'Something went wrong while loading overview data.'}
          </p>
          <button
            type="button"
            onClick={() => void loadOverview()}
            className="btn btn-accent mt-5 inline-flex"
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  const hasScore = data.effective_score != null
  const criticalGaps = data.stats.critical_gaps
  const score = data.effective_score ?? 0
  const maturity = data.maturity_level ? MATURITY_LEVELS[data.maturity_level] : null
  const firstAction = data.top_actions[0]

  return (
    <div className="platform-overview mx-auto max-w-7xl space-y-7">
      <Reveal>
        <ModulePageHeader
          eyebrow={`${today} · ${data.org_name}`}
          title="Overview"
          description={
            <>
              {greeting()}
              {firstName ? `, ${firstName}` : ''}. Here is today&apos;s compliance position.
            </>
          }
          action={
            <Link href="/trustdeck/reports" className="btn btn-ghost inline-flex h-10 items-center gap-2">
              <FileBarChart className="h-4 w-4" /> Board report
            </Link>
          }
        />
      </Reveal>

      <ModulePage className="space-y-7">
        {!hasScore ? (
          <RevealGroup className="space-y-6">
            <RevealItem>
              <AssessmentRequired />
            </RevealItem>
            <RevealItem>
              <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(21rem,0.75fr)]">
                <GettingStartedPanel moduleStatus={data.module_status} />
                <ModuleStatusGrid moduleStatus={data.module_status} />
              </div>
            </RevealItem>
          </RevealGroup>
        ) : (
          <RevealGroup className="space-y-7">
            <RevealItem>
              <div className="grid items-stretch gap-5 lg:grid-cols-[minmax(0,1.55fr)_minmax(18rem,0.7fr)]">
                <section className="rounded-xl border border-line bg-bg-2 p-6 shadow-card" aria-labelledby="posture-title">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-mono text-label font-semibold uppercase tracking-[var(--tracking-label)] text-text-faint">
                        Compliance posture
                      </p>
                      <h2 id="posture-title" className="mt-1 font-display text-lg font-semibold text-text">
                        DPDP readiness
                      </h2>
                    </div>
                    <span className="rounded-pill bg-surface-2 px-3 py-1 text-xs font-medium text-text-muted">
                      Current readiness
                    </span>
                  </div>

                  <div className="mt-6 grid items-center gap-7 lg:grid-cols-[11rem_minmax(0,1fr)]">
                    <div className="border-r border-line pr-7">
                      <div className="flex items-end gap-1.5">
                        <strong
                          aria-label={`Readiness score ${score} out of 100`}
                          className="font-display text-6xl font-semibold leading-none text-text"
                        >
                          {score}
                        </strong>
                        <span className="pb-1 text-sm text-text-faint">/100</span>
                      </div>
                      <TrendLabel trend={data.score_trend} />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="font-mono text-label uppercase tracking-[var(--tracking-label)] text-text-faint">
                            Maturity level
                          </p>
                          <p className="mt-0.5 text-xl font-semibold text-text">
                            Level {data.maturity_level} · {maturity?.label}
                          </p>
                        </div>
                        <span className={`grid h-10 w-10 place-items-center rounded-lg ${criticalGaps > 0 ? 'bg-red/10 text-red' : 'bg-green/10 text-green'}`}>
                          {criticalGaps > 0 ? <AlertTriangle className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}
                        </span>
                      </div>
                      <div
                        className="mt-5 h-2 overflow-hidden rounded-pill bg-surface-2"
                        role="progressbar"
                        aria-label="Assessment score"
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={score}
                      >
                        <div
                          className="h-full rounded-pill bg-accent transition-[width] duration-700 ease-[var(--ease)]"
                          style={{ width: `${score}%` }}
                        />
                      </div>
                      <dl className="mt-5 grid grid-cols-3 gap-4 border-t border-line pt-4">
                        <div>
                          <dt className="font-mono text-label uppercase tracking-[var(--tracking-label)] text-text-faint">Operational</dt>
                          <dd className="mt-1 text-lg font-semibold text-text">{data.modules_completed}<span className="text-sm font-normal text-text-faint"> / 8</span></dd>
                        </div>
                        <div>
                          <dt className="font-mono text-label uppercase tracking-[var(--tracking-label)] text-text-faint">Open gaps</dt>
                          <dd className="mt-1 text-lg font-semibold text-text">{data.stats.unresolved_gaps}</dd>
                        </div>
                        <div>
                          <dt className="font-mono text-label uppercase tracking-[var(--tracking-label)] text-text-faint">Critical</dt>
                          <dd className={`mt-1 text-lg font-semibold ${criticalGaps > 0 ? 'text-red' : 'text-green'}`}>{criticalGaps}</dd>
                        </div>
                      </dl>
                    </div>
                  </div>
                </section>

                <aside className="flex flex-col rounded-xl border border-accent/25 bg-accent/8 p-6 shadow-card">
                  <span className={`grid h-10 w-10 place-items-center rounded-lg ${criticalGaps > 0 ? 'bg-accent text-[color:var(--on-accent)]' : 'bg-green/10 text-green'}`}>
                    {criticalGaps > 0 ? <AlertTriangle className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}
                  </span>
                  <p className="mt-5 font-mono text-label font-semibold uppercase tracking-[var(--tracking-label)] text-accent">
                    Immediate attention
                  </p>
                  <p className="mt-2 font-display text-3xl font-semibold leading-tight text-text">
                    {criticalGaps > 0 ? `${criticalGaps} critical controls` : 'No critical controls'}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-text-muted">
                    {firstAction?.title ?? 'Your priority controls are currently on track.'}
                  </p>
                  <a
                    href="#priority-work-title"
                    className="mt-auto inline-flex items-center gap-2 pt-6 text-sm font-semibold text-accent transition-colors hover:text-accent-soft"
                  >
                    Review priority queue <ArrowRight className="h-4 w-4" />
                  </a>
                </aside>
              </div>
            </RevealItem>

            <RevealItem>
              <StatsRow stats={data.stats} />
            </RevealItem>

            <RevealItem>
              <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(20rem,0.8fr)]">
                <PriorityActionsCard actions={data.top_actions} />
                <ModuleStatusGrid moduleStatus={data.module_status} />
              </div>
            </RevealItem>

            <RevealItem>
              <ComplianceCoverage coverage={data.compliance} />
            </RevealItem>

            <RevealItem>
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <RecentActivityFeed items={data.recent_activity} />
                <ComplianceCalendar
                  daysUntilNoticeRenewal={data.stats.days_until_notice_renewal}
                  lastAssessmentDate={data.last_assessment_date}
                  openComplaints={data.stats.open_complaints}
                />
              </div>
            </RevealItem>
          </RevealGroup>
        )}
      </ModulePage>
    </div>
  )
}

function AssessmentRequired() {
  return (
    <section className="relative overflow-hidden rounded-xl border border-line bg-bg-2 shadow-card" aria-labelledby="assessment-required-title">
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-accent via-amber to-green" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-32 h-80 w-80 rounded-full bg-accent/10 blur-3xl" />
      <div className="relative grid lg:grid-cols-[17rem_minmax(0,1fr)]">
        <div className="flex flex-col justify-between border-b border-line bg-surface-2/45 p-7 lg:border-b-0 lg:border-r">
          <div>
            <div className="flex items-center gap-2 font-mono text-label font-semibold uppercase tracking-[var(--tracking-label)] text-text-faint">
              <Gauge className="h-4 w-4 text-accent" />
              DPDP readiness
            </div>
            <div className="mt-7 flex items-center gap-4">
              <div
                className="grid h-24 w-24 shrink-0 place-items-center rounded-full border-[7px] border-bg-2 bg-bg-2 shadow-[0_0_0_1px_var(--line)]"
                role="img"
                aria-label="Readiness score not yet calculated"
              >
                <strong className="font-display text-4xl font-semibold leading-none text-text-faint">—</strong>
              </div>
              <div>
                <p className="font-display text-lg font-semibold text-text">Score pending</p>
                <p className="mt-1 text-xs leading-relaxed text-text-muted">Complete your baseline to unlock a readiness score.</p>
              </div>
            </div>
          </div>
          <div className="mt-7 border-t border-line pt-4">
            <p className="font-mono text-label font-semibold uppercase tracking-[var(--tracking-label)] text-accent">First milestone</p>
            <p className="mt-1.5 text-sm font-semibold text-text">Establish your compliance baseline</p>
          </div>
        </div>

        <div className="p-7 sm:p-8 lg:px-10">
          <p className="font-mono text-label font-semibold uppercase tracking-[var(--tracking-label)] text-accent">DPDP Compass™</p>
          <h2 id="assessment-required-title" className="mt-2 max-w-3xl font-display text-2xl font-semibold leading-tight text-text sm:text-3xl">
            Build your compliance roadmap from a verified baseline
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-text-muted">
            Answer one guided assessment to measure readiness, uncover statutory gaps, and turn them into an ordered plan your team can execute.
          </p>

          <ul className="mt-7 grid gap-x-8 gap-y-5 sm:grid-cols-2">
            <li className="flex items-start gap-3">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-accent/10 text-accent"><ClipboardCheck className="h-4 w-4" /></span>
              <div><p className="text-sm font-semibold text-text">Guided assessment</p><p className="mt-0.5 text-xs text-text-muted">45 questions across 8 DPDP control areas</p></div>
            </li>
            <li className="flex items-start gap-3">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-blue/10 text-blue"><Gauge className="h-4 w-4" /></span>
              <div><p className="text-sm font-semibold text-text">Personal readiness score</p><p className="mt-0.5 text-xs text-text-muted">Calculated from your submitted answers</p></div>
            </li>
            <li className="flex items-start gap-3">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-amber/10 text-amber"><ListChecks className="h-4 w-4" /></span>
              <div><p className="text-sm font-semibold text-text">Prioritized gap roadmap</p><p className="mt-0.5 text-xs text-text-muted">Critical and high-priority actions ranked first</p></div>
            </li>
            <li className="flex items-start gap-3">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-green/10 text-green"><FileBarChart className="h-4 w-4" /></span>
              <div><p className="text-sm font-semibold text-text">Board-ready output</p><p className="mt-0.5 text-xs text-text-muted">Turn results into an executive compliance report</p></div>
            </li>
          </ul>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link href="/trustdeck/assessment" className="btn btn-accent inline-flex min-h-11 items-center gap-2 px-5 shadow-[0_10px_24px_-14px_rgb(var(--accent-rgb))]">
              Start your assessment <ArrowRight className="h-4 w-4" />
            </Link>
            <div className="text-xs text-text-faint">
              <p className="font-medium text-text-muted">About 15 minutes</p>
              <p className="mt-0.5">Progress saves automatically</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function GettingStartedPanel({ moduleStatus }: { moduleStatus: OverviewResponse['module_status'] }) {
  const steps = [
    {
      number: '01',
      title: 'Establish your baseline',
      description: 'Complete DPDP Compass to identify your highest-priority gaps.',
      href: '/trustdeck/assessment',
      icon: ClipboardCheck,
      complete: moduleStatus.m1_assessment.status === 'complete',
      status: moduleStatus.m1_assessment.status === 'in_progress' ? 'In progress' : 'Start here',
    },
    {
      number: '02',
      title: 'Configure consent capture',
      description: 'Define purposes, languages, and the consent experience for your channels.',
      href: '/trustdeck/consent',
      icon: ShieldCheck,
      complete: moduleStatus.m2_consent.status === 'active' || moduleStatus.m2_consent.status === 'configured',
      status: 'Set up next',
    },
    {
      number: '03',
      title: 'Create your privacy notice',
      description: 'Publish a clear notice aligned to your processing activities and rights flow.',
      href: '/trustdeck/privacy-notice',
      icon: FileText,
      complete: moduleStatus.m3_notice.status === 'published',
      status: moduleStatus.m3_notice.status === 'draft' ? 'Draft started' : 'Then publish',
    },
  ]
  const completed = steps.filter(step => step.complete).length

  return (
    <section className="overflow-hidden rounded-xl border border-line bg-bg-2 shadow-card" aria-labelledby="getting-started-title">
      <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4 sm:px-6">
        <div>
          <p className="font-mono text-label font-semibold uppercase tracking-[var(--tracking-label)] text-accent">Recommended path</p>
          <h2 id="getting-started-title" className="mt-1 font-display text-lg font-semibold text-text">Your first three moves</h2>
          <p className="mt-1 text-xs text-text-muted">Build the foundation in a practical order.</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-display text-xl font-semibold leading-none text-text">{completed}<span className="text-sm font-normal text-text-faint"> / {steps.length}</span></p>
          <p className="mt-1 font-mono text-label uppercase tracking-[var(--tracking-label)] text-text-faint">complete</p>
        </div>
      </div>

      <ol className="divide-y divide-line">
        {steps.map((step, index) => {
          const Icon = step.icon
          return (
            <li key={step.number}>
              <Link
                href={step.href}
                className="group grid gap-3 px-5 py-4 transition-colors duration-200 ease-[var(--ease)] hover:bg-glass sm:grid-cols-[2.25rem_2.5rem_minmax(0,1fr)_auto] sm:items-center sm:px-6"
              >
                <span className="font-mono text-xs font-semibold text-text-faint">{step.number}</span>
                <span className={`grid h-10 w-10 place-items-center rounded-lg ${step.complete ? 'bg-green/10 text-green' : index === 0 ? 'bg-accent/10 text-accent' : 'bg-surface-2 text-text-muted'}`}>
                  {step.complete ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-text transition-colors group-hover:text-accent">{step.title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-text-muted">{step.description}</p>
                </div>
                <span className={`inline-flex w-fit items-center gap-1 text-xs font-semibold ${step.complete ? 'text-green' : index === 0 ? 'text-accent' : 'text-text-faint'}`}>
                  {step.complete ? 'Complete' : step.status}
                  {!step.complete && <ArrowUpRight className="h-3.5 w-3.5" />}
                </span>
              </Link>
            </li>
          )
        })}
      </ol>
    </section>
  )
}

function TrendLabel({ trend }: { trend: number | null }) {
  if (trend == null) return <p className="mt-2 text-xs text-text-faint">First assessment</p>
  if (trend === 0) return <p className="mt-2 text-xs text-text-faint">No change</p>
  const up = trend > 0
  return (
    <p className={`mt-2 text-xs font-medium ${up ? 'text-green' : 'text-red'}`}>
      {up ? '↑' : '↓'} {Math.abs(trend)} pts from last assessment
    </p>
  )
}
