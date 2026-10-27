import { createAdminClient } from '@/lib/supabase/admin'
import { verifyShareToken } from '@/lib/platform/dashboard/share-token'
import { getReportFacts } from '@/lib/platform/dashboard/aggregate'
import { buildReportHtml, deterministicSummary } from '@/lib/platform/dashboard/report-content'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Board Compliance Report - TrustStack™',
  robots: { index: false, follow: false },
}

function InvalidView({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-6">
    <div className="bg-bg-2 rounded-xl border border-line shadow-card p-8 max-w-md text-center">
      <h1 className="font-display text-lg font-semibold tracking-tight text-text mb-2">Link unavailable</h1>
        <p className="text-sm text-text-muted">{message}</p>
      </div>
    </div>
  )
}

export default async function PublicBoardReportPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const payload = verifyShareToken(token)

  if (!payload) {
    return <InvalidView message="This board report link is invalid or has expired. Please request a fresh link from your compliance team." />
  }

  let html: string
  try {
    const admin = createAdminClient()
    if (!admin) {
      return <InvalidView message="We couldn't load this report right now. Please try again later." />
    }
    const { data: org } = await admin.from('organizations').select('name').eq('id', payload.o).maybeSingle()
    const orgName = (org as { name: string } | null)?.name ?? 'Organization'

    const { report, modules_completed } = await getReportFacts(
      admin,
      payload.o,
      orgName,
      payload.f,
      payload.t,
      payload.u
    )
    // No Claude on the public view - deterministic summary keeps it free + instant.
    report.summary = deterministicSummary(report, modules_completed)
    html = buildReportHtml(report)
  } catch {
    return <InvalidView message="We couldn't load this report right now. Please try again later." />
  }

  return (
    <div className="min-h-screen bg-bg py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-4 text-xs text-text-faint">
          <span className="font-mono text-label font-semibold uppercase tracking-[var(--tracking-label)] text-accent">TrustStack™</span>
          <span>Shared board report · Confidential · expires in 7 days</span>
        </div>
        <div className="bg-bg-2 rounded-xl border border-line shadow-card p-8" dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    </div>
  )
}
