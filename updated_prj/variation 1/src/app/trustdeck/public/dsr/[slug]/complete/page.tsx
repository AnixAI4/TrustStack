import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'
import { Shield } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import { DsrLinkComplete } from '@/components/platform/modules/dsr/DsrLinkComplete'

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

export default async function DsrLinkCompletePage({ params }: Props) {
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
        <div className="rounded-xl border border-line bg-bg-2 p-6 shadow-card">
          <Suspense fallback={<p className="text-center text-sm text-text-muted">Loading…</p>}>
            <DsrLinkComplete orgSlug={org.slug} orgName={org.name} />
          </Suspense>
        </div>
        <p className="mt-6 text-center text-xs text-text-faint">
          Powered by <Link href="/" className="hover:text-accent">TrustStack</Link>
        </p>
      </main>
    </div>
  )
}
