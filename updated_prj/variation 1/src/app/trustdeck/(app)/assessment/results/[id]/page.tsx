import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  FileBarChart,
  ShieldCheck,
  Target,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import CompassScoreGauge from '@/components/platform/modules/assessment/CompassScoreGauge'
import MaturityBadge from '@/components/platform/modules/assessment/MaturityBadge'
import GapReportCard from '@/components/platform/modules/assessment/GapReportCard'
import { RISK_TIERS } from '@/lib/platform/constants'
import {
  ASSESSMENT_QUESTIONS,
  getIndustryQuestions,
} from '@/lib/platform/assessment-questions'
import { ModulePage } from '@/components/platform/ui/ModulePage'
import { ModulePageHeader } from '@/components/platform/ui/ModulePageHeader'
import type { Assessment, AssessmentGap } from '@/types/dpdp'

const PRIORITY_ORDER: Record<string, number> = { p0: 0, p1: 1, p2: 2, p3: 3 }

function scoreSummary(score: number): { title: string; body: string } {
  if (score >= 81) {
    return {
      title: 'Strong operational foundation',
      body: 'Core controls are established. Focus on the remaining exceptions and keep evidence current as your processing changes.',
    }
  }
  if (score >= 61) {
    return {
      title: 'Controls are taking shape',
      body: 'The foundation is credible, but several controls still need operational evidence or consistent execution.',
    }
  }
  if (score >= 41) {
    return {
      title: 'Material readiness gaps remain',
      body: 'Prioritize high-impact controls before relying on this posture for board or partner assurance.',
    }
  }
  return {
    title: 'Immediate remediation required',
    body: 'The current control environment leaves significant DPDP exposure. Address critical gaps before expanding processing activity.',
  }
}

export default async function AssessmentResultsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  if (
    process.env.NODE_ENV === 'development'
    && (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  ) {
    redirect('/trustdeck/assessment')
  }

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .limit(1)
    .single()

  if (!membership) redirect('/trustdeck/create-organization')

  const { data: assessment } = await supabase
    .from('assessments')
    .select('*')
    .eq('id', id)
    .eq('organization_id', membership.organization_id)
    .eq('created_by', user.id)
    .single()

  if (!assessment) redirect('/trustdeck/assessment')

  const assessmentData = assessment as Assessment

  if (assessmentData.status !== 'completed') {
    redirect(`/trustdeck/assessment/${id}`)
  }

  const [{ data: gaps }, { data: answers }, { data: organization }] = await Promise.all([
    supabase
      .from('assessment_gaps')
      .select('*')
      .eq('assessment_id', id),
    supabase
      .from('assessment_answers')
      .select('question_id')
      .eq('assessment_id', id),
    supabase
      .from('organizations')
      .select('industry')
      .eq('id', membership.organization_id)
      .single(),
  ])

  const allGaps = ((gaps ?? []) as AssessmentGap[]).sort(
    (a, b) => (PRIORITY_ORDER[a.priority] ?? 4) - (PRIORITY_ORDER[b.priority] ?? 4)
  )

  const openGaps = allGaps.filter(g => !g.resolved)
  const p0Gaps = openGaps.filter(g => g.priority === 'p0')
  const riskConfig = assessmentData.risk_tier ? RISK_TIERS[assessmentData.risk_tier] : null
  const score = assessmentData.compass_score ?? 0
  const maturityLevel = assessmentData.maturity_level ?? 1
  const summary = scoreSummary(score)
  const industryQuestions = getIndustryQuestions(organization?.industry ?? null)
  const expectedQuestionIds = new Set([
    ...ASSESSMENT_QUESTIONS.map(question => question.id),
    ...industryQuestions.map(question => question.id),
  ])
  const answeredQuestionIds = new Set(
    (answers ?? [])
      .map(answer => answer.question_id)
      .filter(questionId => expectedQuestionIds.has(questionId))
  )
  const expectedAnswers = expectedQuestionIds.size
  const answeredCount = answeredQuestionIds.size
  const coveragePercent = expectedAnswers
    ? Math.min(100, Math.round((answeredCount / expectedAnswers) * 100))
    : 0
  const reportIsComplete =
    coveragePercent === 100 &&
    assessmentData.compass_score !== null &&
    assessmentData.maturity_level !== null &&
    assessmentData.risk_tier !== null
  const completedAt = new Date(assessmentData.completed_at!)
  const reviewBy = new Date(completedAt)
  reviewBy.setFullYear(reviewBy.getFullYear() + 1)
  const priorityCounts = (['p0', 'p1', 'p2', 'p3'] as const).map(priority => ({
    priority,
    count: openGaps.filter(gap => gap.priority === priority).length,
  }))
  const priorityPresentation = {
    p0: { label: 'Critical', color: 'text-red', bar: 'bg-red' },
    p1: { label: 'High', color: 'text-amber', bar: 'bg-amber' },
    p2: { label: 'Medium', color: 'text-blue', bar: 'bg-blue' },
    p3: { label: 'Low', color: 'text-green', bar: 'bg-green' },
  }
  const riskTone = {
    critical: 'text-red',
    high: 'text-amber',
    medium: 'text-blue',
    low: 'text-green',
    managed: 'text-green',
  }[assessmentData.risk_tier ?? 'managed']

  return (
    <ModulePage className="mx-auto max-w-6xl space-y-6 pb-10">
      <ModulePageHeader
        eyebrow={`Assessment completed · ${completedAt.toLocaleDateString('en-IN', {
          day: 'numeric', month: 'long', year: 'numeric',
        })}`}
        title="DPDP Compass™ Report"
        description="A point-in-time view of submitted controls, supporting evidence, and priority remediation."
        action={
          <>
            <Link href="/trustdeck/assessment" className="btn btn-ghost inline-flex min-h-10 items-center gap-2 text-sm">
              <ArrowLeft className="h-4 w-4" /> All assessments
            </Link>
            <Link href="/trustdeck/reports" className="btn btn-accent inline-flex min-h-10 items-center gap-2 text-sm">
              <FileBarChart className="h-4 w-4" /> Board report
            </Link>
          </>
        }
      />

      <section className="relative overflow-hidden rounded-xl border border-line bg-bg-2 shadow-card">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-accent via-amber to-green" />
        <div className="grid items-center gap-7 px-6 py-7 sm:px-8 md:grid-cols-[12rem_minmax(0,1fr)] md:gap-8 md:py-8">
          <div className="flex flex-col items-center border-b border-line pb-7 md:border-b-0 md:border-r md:pb-0 md:pr-8">
            <p className="mb-3 font-mono text-label font-semibold uppercase tracking-[var(--tracking-label)] text-text-faint">
              Readiness score
            </p>
            <CompassScoreGauge score={score} maturityLevel={maturityLevel} size="lg" />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <MaturityBadge level={maturityLevel} size="lg" />
              {riskConfig && (
                <span className={`inline-flex items-center rounded-lg border border-line bg-bg-2 px-3 py-1.5 text-sm font-semibold shadow-sm ${riskTone}`}>
                  {riskConfig.label}
                </span>
              )}
            </div>
            <h2 className="mt-5 font-display text-2xl font-semibold leading-tight text-text sm:text-3xl">
              {summary.title}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-text-muted sm:text-base">
              {summary.body}
            </p>
            <div className="mt-6 h-2 overflow-hidden rounded-pill bg-surface-2">
              <div className="h-full rounded-pill bg-accent" style={{ width: `${score}%` }} />
            </div>
          </div>
        </div>

        <dl className="grid border-t border-line bg-surface-2/25 sm:grid-cols-3">
          <div className="flex items-center gap-3 border-b border-line px-5 py-4 sm:border-b-0 sm:border-r">
            <span className={`grid h-9 w-9 place-items-center rounded-lg ${reportIsComplete ? 'bg-green/10 text-green' : 'bg-amber/10 text-amber'}`}>
              {reportIsComplete ? <ShieldCheck className="h-4 w-4" /> : <ClipboardCheck className="h-4 w-4" />}
            </span>
            <div>
              <dt className="text-xs text-text-faint">Assessment validity</dt>
              <dd className="text-sm font-semibold text-text">{reportIsComplete ? 'Complete snapshot' : 'Review required'}</dd>
            </div>
          </div>
          <div className="flex items-center gap-3 border-b border-line px-5 py-4 sm:border-b-0 sm:border-r">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-blue/10 text-blue"><Target className="h-4 w-4" /></span>
            <div>
              <dt className="text-xs text-text-faint">Answer coverage</dt>
              <dd className="text-sm font-semibold text-text">{answeredCount} of {expectedAnswers} · {coveragePercent}%</dd>
            </div>
          </div>
          <div className="flex items-center gap-3 px-5 py-4">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-accent/10 text-accent"><CalendarDays className="h-4 w-4" /></span>
            <div>
              <dt className="text-xs text-text-faint">Review by</dt>
              <dd className="text-sm font-semibold text-text">{reviewBy.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</dd>
            </div>
          </div>
        </dl>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(18rem,0.55fr)]">
        <section className="rounded-xl border border-line bg-bg-2 p-5 shadow-card sm:p-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="font-mono text-label font-semibold uppercase tracking-[var(--tracking-label)] text-text-faint">Priority profile</p>
              <h2 className="mt-1 font-display text-xl font-semibold text-text">{openGaps.length} open control gap{openGaps.length !== 1 ? 's' : ''}</h2>
            </div>
            <span className="text-xs text-text-faint">Unresolved only</span>
          </div>
          <div className="mt-5 grid grid-cols-2 border-l border-t border-line sm:grid-cols-4">
            {priorityCounts.map(({ priority, count }) => {
              const presentation = priorityPresentation[priority]
              return (
                <div key={priority} className="relative border-b border-r border-line px-4 py-4">
                  <span className={`absolute inset-x-0 top-0 h-0.5 ${presentation.bar}`} />
                  <p className={`font-display text-3xl font-semibold tabular-nums ${presentation.color}`}>{count}</p>
                  <p className="mt-0.5 text-xs font-medium text-text-muted">{presentation.label} · {priority.toUpperCase()}</p>
                </div>
              )
            })}
          </div>
        </section>

        <aside className="flex flex-col rounded-xl border border-line bg-surface-2/35 p-5 shadow-card sm:p-6">
          <span className="grid h-10 w-10 place-items-center rounded-lg border border-line bg-bg-2 text-accent shadow-sm">
            <FileBarChart className="h-5 w-5" />
          </span>
          <h2 className="mt-4 font-display text-xl font-semibold text-text">Leadership-ready output</h2>
          <p className="mt-2 text-sm leading-relaxed text-text-muted">
            Turn this assessment into a board report with an executive summary, module status, actions, PDF export, and a seven-day share link.
          </p>
          <Link href="/trustdeck/reports" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-accent hover:text-accent-soft">
            Create board report <ArrowRight className="h-4 w-4" />
          </Link>
        </aside>
      </div>

      {openGaps.length > 0 ? (
        <section>
          <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-mono text-label font-semibold uppercase tracking-[var(--tracking-label)] text-text-faint">Remediation plan</p>
              <h2 className="mt-1 font-display text-xl font-semibold text-text">Controls requiring action</h2>
            </div>
            <p className="text-xs text-text-faint">Ordered by regulatory priority</p>
          </div>

          <div className="space-y-4">
            {openGaps.map(gap => (
              <GapReportCard key={gap.id} gap={gap} />
            ))}
          </div>
        </section>
      ) : !reportIsComplete ? (
        <section className="flex items-center gap-4 rounded-xl border border-amber/30 bg-amber/[0.07] p-5 shadow-card sm:p-6">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-amber/10 text-amber"><ClipboardCheck className="h-5 w-5" /></span>
          <div>
            <h2 className="font-display text-lg font-semibold text-text">Gap analysis incomplete</h2>
            <p className="mt-0.5 text-sm text-text-muted">This legacy report was completed without every required answer. Start a new assessment before relying on its score or gap profile.</p>
          </div>
        </section>
      ) : (
        <section className="flex items-center gap-4 rounded-xl border border-green/25 bg-green/[0.06] p-5 shadow-card sm:p-6">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-green/10 text-green"><CheckCircle2 className="h-5 w-5" /></span>
          <div>
            <h2 className="font-display text-lg font-semibold text-text">No unresolved control gaps</h2>
            <p className="mt-0.5 text-sm text-text-muted">Maintain evidence and reassess after material changes to processing or controls.</p>
          </div>
        </section>
      )}

      {p0Gaps.length > 0 && (
        <section className="rounded-xl border border-red/25 bg-red/[0.06] p-5 sm:p-6">
          <h2 className="text-sm font-bold text-red">
            {p0Gaps.length} Critical Gap{p0Gaps.length !== 1 ? 's' : ''} Require Immediate Attention
          </h2>
          <p className="mt-2 text-sm text-text-muted">
            P0 gaps represent direct violations of the DPDP Act. Address these first to reduce your penalty risk.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/trustdeck/consent"
              className="btn btn-ghost btn-sm"
            >
              Consent Management <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              href="/trustdeck/grievance"
              className="btn btn-ghost btn-sm"
            >
              Grievance Officer <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              href="/trustdeck/privacy-notice"
              className="btn btn-ghost btn-sm"
            >
              Privacy Notice <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </section>
      )}

      <footer className="flex flex-col gap-2 border-t border-line pt-5 text-xs leading-relaxed text-text-faint sm:flex-row sm:items-start sm:justify-between">
        <p className="max-w-2xl">
          Validity: this is a decision-support snapshot based on answers submitted on {completedAt.toLocaleDateString('en-IN')}. It is not a statutory certificate or legal opinion. Reassess after material changes or by the review date above.
        </p>
        <p className="shrink-0 font-mono">Report {id.slice(0, 8).toUpperCase()}</p>
      </footer>
    </ModulePage>
  )
}
