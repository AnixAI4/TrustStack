import { createAdminClient } from '@/lib/supabase/admin'
import { verifyShareToken } from '@/lib/dashboard/share-token'
import { getReportFacts } from '@/lib/dashboard/aggregate'
import { buildReportHtml, deterministicSummary } from '@/lib/dashboard/report-content'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Board Compliance Report — TrustStack™',
  robots: { index: false, follow: false },
}

function InvalidView({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-[#F4F8FC] flex items-center justify-center p-6">
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 max-w-md text-center">
        <h1 className="text-lg font-bold text-[#003366] mb-2">Link unavailable</h1>
        <p className="text-sm text-gray-500">{message}</p>
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
    const { data: org } = await admin.from('organizations').select('name').eq('id', payload.o).maybeSingle()
    const orgName = (org as { name: string } | null)?.name ?? 'Organization'

    const { report, modules_completed } = await getReportFacts(admin, payload.o, orgName, payload.f, payload.t)
    // No Claude on the public view — deterministic summary keeps it free + instant.
    report.summary = deterministicSummary(report, modules_completed)
    html = buildReportHtml(report)
  } catch {
    return <InvalidView message="We couldn't load this report right now. Please try again later." />
  }

  return (
    <div className="min-h-screen bg-[#F4F8FC] py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-4 text-xs text-gray-400">
          <span className="font-semibold text-[#003366]">TrustStack™</span>
          <span>Shared board report · Confidential · expires in 7 days</span>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8" dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    </div>
  )
}
