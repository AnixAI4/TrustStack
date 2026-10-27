import Link from 'next/link'
import { Shield, AlertCircle } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyQuestionnaireToken } from '@/lib/platform/vendors/token'
import { PublicVendorQuestionnaire } from '@/components/platform/modules/vendors/PublicVendorQuestionnaire'
import { VENDOR_QUESTION_COUNT } from '@/lib/platform/vendors/questionnaire'

interface Props {
  params: Promise<{ token: string }>
}

export const metadata = {
  title: 'Vendor Data Protection Questionnaire - TrustStack™',
  robots: { index: false, follow: false },
}

// Token-verified load (admin client - no vendor session exists).
async function loadFromToken(token: string) {
  const payload = verifyQuestionnaireToken(token)
  if (!payload) return null
  const supabase = createAdminClient()
  if (!supabase) return null
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
    <div className="min-h-dvh bg-bg">
      <main className="mx-auto max-w-2xl px-3 py-6 sm:px-4 sm:py-10">
        <p className="mb-6 font-mono text-label font-semibold uppercase tracking-[var(--tracking-label)] text-accent">
          <Shield size={12} className="mr-1.5 inline" />
          Vendor questionnaire
        </p>
        {children}
      </main>
    </div>
  )
}

export default async function VendorQuestionnairePage({ params }: Props) {
  const { token } = await params
  const data = await loadFromToken(token)

  if (!data) {
    return (
      <Shell>
        <div className="rounded-xl border border-line bg-bg-2 p-5 text-center shadow-card sm:p-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-accent/10 rounded-full mb-4">
            <AlertCircle className="text-accent" size={28} />
          </div>
          <h1 className="font-display text-xl font-semibold tracking-tight text-text mb-2">Link unavailable</h1>
          <p className="text-sm text-text-muted">
            This questionnaire link is invalid or has expired. Please ask the organisation that contacted you to send a fresh link.
          </p>
        </div>
      </Shell>
    )
  }

  return (
    <Shell>
      <div className="mb-5 rounded-xl border border-line bg-bg-2 p-4 shadow-card sm:mb-6 sm:p-6">
        <h1 className="font-display text-xl font-semibold tracking-tight text-text mb-1">Data Protection Questionnaire</h1>
        <p className="text-sm text-text-muted">
          <strong>{data.orgName}</strong> is assessing <strong>{data.vendorName}</strong> as a data processor under
          India&apos;s Digital Personal Data Protection Act, 2023. Please answer the {VENDOR_QUESTION_COUNT} questions
          below - it takes about 10 minutes.
        </p>
      </div>

      <div className="rounded-xl border border-line bg-bg-2 p-3 shadow-card sm:p-6">
        <PublicVendorQuestionnaire token={token} vendorName={data.vendorName} orgName={data.orgName} />
      </div>

      <p className="text-center text-xs text-text-faint mt-6">
        Powered by <Link href="/" className="hover:text-accent">TrustStack</Link>
      </p>
    </Shell>
  )
}
