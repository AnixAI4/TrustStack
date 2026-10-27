import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Assessment } from '@/types/dpdp'
import { MATURITY_LEVELS } from '@/lib/constants'

export default async function AssessmentListPage() {
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

  const { data: assessments } = await supabase
    .from('assessments')
    .select('*')
    .eq('organization_id', membership.organization_id)
    .order('created_at', { ascending: false })

  const allAssessments = (assessments ?? []) as Assessment[]
  const completedAssessments = allAssessments.filter(a => a.status === 'completed')
  const inProgressAssessment = allAssessments.find(a => a.status === 'in_progress')

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#003366]">DPDP Compass™ Assessment</h1>
          <p className="text-sm text-gray-500 mt-1">
            45 questions · 8 sections · ~15 minutes
          </p>
        </div>
        <StartAssessmentButton inProgressId={inProgressAssessment?.id} />
      </div>

      {/* Info card */}
      <div className="bg-[#D6E4F0]/30 rounded-xl border border-[#D6E4F0] p-5">
        <h2 className="text-sm font-semibold text-[#003366] mb-2">What the assessment covers</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            'Data Fiduciary Classification',
            'Consent Practices',
            'Privacy Notice',
            'User Rights',
            'Data Security',
            'Breach Preparedness',
            'Vendor Management',
            'Scoring + Gap Report',
          ].map(item => (
            <div key={item} className="flex items-center gap-1.5 text-xs text-[#003366]">
              <div className="w-1 h-1 rounded-full bg-[#003366] flex-shrink-0" />
              {item}
            </div>
          ))}
        </div>
      </div>

      {/* Past assessments */}
      {completedAssessments.length > 0 ? (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Assessment History</h2>
          <div className="space-y-3">
            {completedAssessments.map(a => {
              const maturityConfig = a.maturity_level ? MATURITY_LEVELS[a.maturity_level] : null
              return (
                <div key={a.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div
                      className="text-2xl font-bold"
                      style={{ color: maturityConfig?.color ?? '#003366' }}
                    >
                      {a.compass_score}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">
                        Compass Score™ — {new Date(a.completed_at!).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                      {maturityConfig && (
                        <span
                          className="text-xs font-medium px-2 py-0.5 rounded-full"
                          style={{ color: maturityConfig.color, backgroundColor: maturityConfig.bgColor }}
                        >
                          Level {a.maturity_level}: {maturityConfig.label}
                        </span>
                      )}
                    </div>
                  </div>
                  <Link
                    href={`/dashboard/assessment/results/${a.id}`}
                    className="text-sm text-[#2874A6] font-medium hover:text-[#003366] transition-colors flex-shrink-0"
                  >
                    View report →
                  </Link>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center text-gray-400">
          <p className="text-sm">No completed assessments yet. Start your first assessment above.</p>
        </div>
      )}
    </div>
  )
}

function StartAssessmentButton({ inProgressId }: { inProgressId?: string }) {
  if (inProgressId) {
    return (
      <Link
        href={`/dashboard/assessment/${inProgressId}`}
        className="inline-flex items-center gap-2 bg-[#D97706] text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-amber-600 transition-colors"
      >
        Continue Assessment →
      </Link>
    )
  }

  return <NewAssessmentButton />
}

function NewAssessmentButton() {
  return (
    <form action="/api/assessment/start-redirect" method="POST">
      <StartButtonClient />
    </form>
  )
}

// This is a client-side button — we'll handle it in the [id] page via a redirect
function StartButtonClient() {
  return (
    <Link
      href="/dashboard/assessment/new"
      className="inline-flex items-center gap-2 bg-[#003366] text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#1A5276] transition-colors"
    >
      Start New Assessment
    </Link>
  )
}
