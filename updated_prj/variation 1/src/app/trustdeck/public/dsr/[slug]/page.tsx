import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Shield } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import { PublicDsrForm } from '@/components/platform/modules/dsr/PublicDsrForm'

interface Props {
  params: Promise<{ slug: string }>
}

async function loadOrg(slug: string) {
  const supabase = createAdminClient()
  if (!supabase) return null
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
    title: `Exercise Your Data Rights - ${name}`,
    description: `Submit a data subject rights request to ${name} under the Digital Personal Data Protection Act 2023`,
    alternates: { canonical: `${baseUrl}/trustdeck/public/dsr/${slug}` },
  }
}

export default async function PublicDsrPage({ params }: Props) {
  const { slug } = await params
  const org = await loadOrg(slug)
  if (!org) notFound()

  return (
    <div className="bg-bg">
      <main className="mx-auto max-w-2xl px-4 py-10">
        <p className="mb-6 font-mono text-label font-semibold uppercase tracking-[var(--tracking-label)] text-accent">
          <Shield size={12} className="mr-1.5 inline" />
          Data subject rights
        </p>
        <div className="mb-6 rounded-xl border border-line bg-bg-2 p-6 shadow-card">
          <h1 className="mb-1 font-display text-xl font-semibold tracking-tight text-text">{org.name}</h1>
          <p className="text-sm text-text-muted">
            Exercise your rights as a Data Principal under the Digital Personal Data Protection Act 2023
            (Sections 11-15). Requests are answered within <strong>30 days</strong>.
          </p>
        </div>

        <div className="bg-bg-2 rounded-xl border border-line shadow-card p-6">
          <h2 className="font-display text-lg font-semibold tracking-tight text-text mb-1">Submit a Request</h2>
          <p className="text-sm text-text-muted mb-5">
            Choose the right you would like to exercise. You&apos;ll receive a reference number after submitting.
          </p>
          <PublicDsrForm orgSlug={org.slug} orgName={org.name} />
        </div>

        <p className="text-center text-xs text-text-faint mt-6">
          Powered by <Link href="/" className="hover:text-accent">TrustStack</Link>
        </p>
      </main>
    </div>
  )
}
