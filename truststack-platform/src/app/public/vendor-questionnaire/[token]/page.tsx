import { Shield, AlertCircle } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyQuestionnaireToken } from '@/lib/vendors/token'
import { PublicVendorQuestionnaire } from '@/components/modules/vendors/PublicVendorQuestionnaire'
import { VENDOR_QUESTION_COUNT } from '@/lib/vendors/questionnaire'

interface Props {
  params: Promise<{ token: string }>
}

export const metadata = {
  title: 'Vendor Data Protection Questionnaire — TrustStack™',
  robots: { index: false, follow: false },
}

// Token-verified load (admin client — no vendor session exists).
async function loadFromToken(token: string) {
  const payload = verifyQuestionnaireToken(token)
  if (!payload) return null
  const supabase = createAdminClient()
  const [{ data: vendor }, { data: org }] = await Promise.all([
    supabase.from('vendors').select('id, name').eq('id', payload.v).eq('organization_id', payload.o).maybeSingle(),
    supabase.from('organizations').select('name').eq('id', payload.o).maybeSingle(),
  ])
  if (!vendor) return null
  return {
    vendorName: (vendor as { name: string }).name,
    orgName: (org as { name: string } | null)?.name ?? 'the organisation',
  }
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F4F8FC]">
      <header className="bg-[#003366] text-white py-4 px-6">
        <div className="max-w-2xl mx-auto flex items-center gap-2">
          <Shield size={18} className="text-[#D6E4F0]" />
          <span className="text-sm font-medium text-[#D6E4F0]">TrustStack™ — DPDP Compliance</span>
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-4 py-10">{children}</main>
    </div>
  )
}

export default async function VendorQuestionnairePage({ params }: Props) {
  const { token } = await params
  const data = await loadFromToken(token)

  if (!data) {
    return (
      <Shell>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-amber-50 rounded-full mb-4">
            <AlertCircle className="text-amber-500" size={28} />
          </div>
          <h1 className="text-xl font-bold text-[#003366] mb-2">Link unavailable</h1>
          <p className="text-sm text-gray-500">
            This questionnaire link is invalid or has expired. Please ask the organisation that contacted you to send a fresh link.
          </p>
        </div>
      </Shell>
    )
  }

  return (
    <Shell>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-6">
        <h1 className="text-xl font-bold text-[#003366] mb-1">Data Protection Questionnaire</h1>
        <p className="text-sm text-gray-500">
          <strong>{data.orgName}</strong> is assessing <strong>{data.vendorName}</strong> as a data processor under
          India&apos;s Digital Personal Data Protection Act, 2023. Please answer the {VENDOR_QUESTION_COUNT} questions
          below — it takes about 10 minutes.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <PublicVendorQuestionnaire token={token} vendorName={data.vendorName} orgName={data.orgName} />
      </div>

      <p className="text-center text-xs text-gray-400 mt-6">
        Powered by <a href="/" className="hover:text-[#003366]">TrustStack™ by Anix AI</a>
      </p>
    </Shell>
  )
}
