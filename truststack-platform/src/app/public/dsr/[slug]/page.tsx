import { notFound } from 'next/navigation'
import { Shield } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import { PublicDsrForm } from '@/components/modules/dsr/PublicDsrForm'

interface Props {
  params: Promise<{ slug: string }>
}

async function loadOrg(slug: string) {
  const supabase = createAdminClient()
  const { data: org } = await supabase
    .from('organizations')
    .select('id, name, slug')
    .eq('slug', slug)
    .maybeSingle()
  return org as { id: string; name: string; slug: string } | null
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const org = await loadOrg(slug)
  const name = org?.name || slug
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || ''
  return {
    title: `Exercise Your Data Rights — ${name}`,
    description: `Submit a data subject rights request to ${name} under the Digital Personal Data Protection Act 2023`,
    alternates: { canonical: `${baseUrl}/public/dsr/${slug}` },
  }
}

export default async function PublicDsrPage({ params }: Props) {
  const { slug } = await params
  const org = await loadOrg(slug)
  if (!org) notFound()

  return (
    <div className="min-h-screen bg-[#F4F8FC]">
      <header className="bg-[#003366] text-white py-4 px-6">
        <div className="max-w-2xl mx-auto flex items-center gap-2">
          <Shield size={18} className="text-[#D6E4F0]" />
          <span className="text-sm font-medium text-[#D6E4F0]">TrustStack™ — DPDP Compliance</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-10">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-6">
          <h1 className="text-xl font-bold text-[#003366] mb-1">{org.name}</h1>
          <p className="text-sm text-gray-500">
            Exercise your rights as a Data Principal under the Digital Personal Data Protection Act 2023
            (Sections 11–15). Requests are verified by email and answered within <strong>30 days</strong>.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-[#003366] mb-1">Submit a Request</h2>
          <p className="text-sm text-gray-500 mb-5">
            Choose the right you would like to exercise. You&apos;ll receive a reference number after verifying your identity.
          </p>
          <PublicDsrForm orgSlug={org.slug} orgName={org.name} />
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Powered by <a href="/" className="hover:text-[#003366]">TrustStack™ by Anix AI</a>
        </p>
      </main>
    </div>
  )
}
