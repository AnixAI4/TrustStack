import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowRight, Compass, Clock3, ListChecks, Shield } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import type { Assessment } from '@/types/dpdp'
import { MATURITY_LEVELS } from '@/lib/platform/constants'
import { cn } from '@/lib/cn'
import { ModulePageHeader, ModulePanel, ModulePanelHeader } from '@/components/platform/ui/ModulePageHeader'
import { ModuleEmptyState } from '@/components/platform/ui/ModuleStatGrid'

const COVERAGE = [
  'Data Fiduciary Classification',
  'Consent Practices',
  'Privacy Notice',
  'User Rights',
  'Data Security',
  'Breach Preparedness',
  'Vendor Management',
  'Scoring + Gap Report',
] as const

export default async function AssessmentListPage() {
  const localWorkspace = process.env.NODE_ENV === 'development'
    && (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  let allAssessments: Assessment[] = []

  if (!localWorkspace) {
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

    const { data: assessments } = await supabase
      .from('assessments')
      .select('*')
      .eq('organization_id', membership.organization_id)
      .eq('created_by', user.id)
      .order('created_at', { ascending: false })

    allAssessments = (assessments ?? []) as Assessment[]
  }
  const completedAssessments = allAssessments.filter(a => a.status === 'completed')
  const inProgressAssessment = allAssessments.find(a => a.status === 'in_progress')

  return (
    <div className="mx-auto max-w-6xl space-y-7">
      <ModulePageHeader
        eyebrow="DPDP Compass™"
        title="Assessment"
        description={
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="inline-flex items-center gap-1.5"><ListChecks className="h-3.5 w-3.5 text-text-faint" /> 45 questions</span>
            <span className="text-text-faint">·</span>
            <span>8 sections</span>
            <span className="text-text-faint">·</span>
            <span className="inline-flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5 text-text-faint" /> ~15 minutes</span>
          </p>
        }
        action={<StartAssessmentButton inProgressId={inProgressAssessment?.id} />}
      />

      {inProgressAssessment && (
        <div className="flex flex-col gap-3 rounded-xl border border-accent/25 bg-accent/8 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-accent text-[color:var(--on-accent)]">
              <Compass className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-text">Assessment in progress</p>
              <p className="mt-0.5 text-xs text-text-muted">
                Pick up where you left off — answers are saved automatically.
              </p>
            </div>
          </div>
          <Link
            href={`/trustdeck/assessment/${inProgressAssessment.id}`}
            className="btn btn-accent inline-flex min-h-10 items-center gap-2 self-start sm:self-auto"
          >
            Continue <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}

      <ModulePanel>
        <ModulePanelHeader eyebrow="Coverage" title="What the assessment covers" />
        <div className="grid gap-2 p-5 sm:grid-cols-2 lg:grid-cols-4">
          {COVERAGE.map(item => (
            <div
              key={item}
              className="flex items-center gap-2.5 rounded-lg border border-line/80 bg-glass/40 px-3 py-2.5 text-xs font-medium text-text"
            >
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              {item}
            </div>
          ))}
        </div>
      </ModulePanel>

      <section>
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <p className="font-mono text-label font-semibold uppercase tracking-[var(--tracking-label)] text-text-faint">
              History
            </p>
            <h2 className="mt-1 font-display text-lg font-semibold text-text">Past assessments</h2>
          </div>
          {completedAssessments.length > 0 && (
            <p className="text-xs text-text-faint">{completedAssessments.length} completed</p>
          )}
        </div>

        {completedAssessments.length > 0 ? (
          <div className="space-y-3">
            {completedAssessments.map(a => {
              const maturityConfig = a.maturity_level ? MATURITY_LEVELS[a.maturity_level] : null
              const score = a.compass_score ?? 0
              const tone =
                score >= 70 ? 'text-green bg-green/10 border-green/20'
                : score >= 40 ? 'text-blue bg-blue/10 border-blue/20'
                : 'text-red bg-red/10 border-red/20'
              return (
                <Link
                  key={a.id}
                  href={`/trustdeck/assessment/results/${a.id}`}
                  className="group flex flex-col gap-3 rounded-xl border border-line bg-bg-2 p-4 shadow-card transition-[border-color,transform,box-shadow] duration-200 ease-[var(--ease)] hover:border-accent/35 hover:shadow-[0_16px_40px_-28px_rgba(0,0,0,0.35)] sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                >
                  <div className="flex min-w-0 items-center gap-4">
                    <div
                      className={cn(
                        'grid h-14 w-14 shrink-0 place-items-center rounded-full border font-display text-xl font-semibold',
                        tone
                      )}
                    >
                      {score}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-text transition-colors group-hover:text-accent">
                        Compass Score™ ·{' '}
                        {new Date(a.completed_at!).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                      {maturityConfig && (
                        <span
                          className="mt-1.5 inline-flex rounded-pill px-2 py-0.5 text-xs font-medium"
                          style={{ color: maturityConfig.color, backgroundColor: maturityConfig.bgColor }}
                        >
                          Level {a.maturity_level}: {maturityConfig.label}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="inline-flex min-h-10 shrink-0 items-center gap-1.5 self-start text-sm font-semibold text-text-muted transition-colors group-hover:text-accent sm:self-auto">
                    View report <ArrowRight className="h-4 w-4" />
                  </span>
                </Link>
              )
            })}
          </div>
        ) : (
          <ModuleEmptyState
            icon={<Shield className="h-5 w-5" />}
            title="No completed assessments yet"
            description="Run your first Compass assessment to unlock a readiness score and prioritized gap roadmap."
            className="bg-bg-2/70 shadow-card"
          />
        )}
      </section>
    </div>
  )
}

function StartAssessmentButton({ inProgressId }: { inProgressId?: string }) {
  if (inProgressId) {
    return (
      <Link
        href={`/trustdeck/assessment/${inProgressId}`}
        className="btn btn-accent inline-flex min-h-11 items-center gap-2"
      >
        Continue assessment <ArrowRight className="h-4 w-4" />
      </Link>
    )
  }

  return (
    <Link
      href="/trustdeck/assessment/new"
      className="btn btn-accent inline-flex min-h-11 items-center gap-2"
    >
      Start new assessment <ArrowRight className="h-4 w-4" />
    </Link>
  )
}
