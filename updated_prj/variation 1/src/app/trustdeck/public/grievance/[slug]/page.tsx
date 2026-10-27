import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Shield, Mail, Phone, Briefcase } from 'lucide-react'
import { PublicComplaintForm } from '@/components/platform/modules/grievance/PublicComplaintForm'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  return {
    title: `Submit a Complaint - ${slug}`,
    description: 'Submit a grievance complaint under the Digital Personal Data Protection Act 2023',
  }
}

export default async function PublicGrievancePage({ params }: Props) {
  const { slug } = await params
  const supabase = createAdminClient()
  if (!supabase) notFound()

  const { data: org } = await supabase
    .from('organizations')
    .select('id, name, slug')
    .eq('slug', slug)
    .single()

  if (!org) notFound()

  const { data: officer } = await supabase
    .from('grievance_officers')
    .select('name, designation, email, phone')
    .eq('organization_id', org.id)
    .eq('active', true)
    .order('appointed_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return (
    <div className="min-h-dvh bg-bg">
      <main className="mx-auto max-w-2xl px-3 py-6 sm:px-4 sm:py-10">
        <p className="mb-6 font-mono text-label font-semibold uppercase tracking-[var(--tracking-label)] text-accent">
          <Shield size={12} className="mr-1.5 inline" />
          Grievance portal
        </p>
        <div className="mb-5 rounded-xl border border-line bg-bg-2 p-4 shadow-card sm:mb-6 sm:p-6">
          <h1 className="mb-1 font-display text-xl font-semibold tracking-tight text-text">{org.name}</h1>
          <p className="text-sm text-text-muted mb-4">
            Grievance portal under the Digital Personal Data Protection Act 2023 (DPDP Section 14)
          </p>

          {officer ? (
            <div>
              <p className="text-xs font-semibold text-text-faint uppercase tracking-wider mb-3">Grievance Officer</p>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-sm text-text">
                  <Briefcase size={14} className="text-text-faint shrink-0" />
                  <span>{officer.name} - {officer.designation}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-text">
                  <Mail size={14} className="text-text-faint shrink-0" />
                  <a href={`mailto:${officer.email}`} className="break-all hover:text-accent">{officer.email}</a>
                </div>
                {officer.phone && (
                  <div className="flex items-center gap-2 text-sm text-text">
                    <Phone size={14} className="text-text-faint shrink-0" />
                    <span>{officer.phone}</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-accent bg-accent/10 border border-accent/20 rounded-lg px-3 py-2">
              This organization has not yet appointed a Grievance Officer. Please contact them directly.
            </p>
          )}
        </div>

        {/* Submission form */}
        <div className="rounded-xl border border-line bg-bg-2 p-4 shadow-card sm:p-6">
          <h2 className="font-display text-lg font-semibold tracking-tight text-text mb-1">Submit a Complaint</h2>
          <p className="text-sm text-text-muted mb-5">
            All complaints will be responded to within <strong>30 days</strong> as required by DPDP Section 14.
            You will receive a reference number upon submission.
          </p>
          <PublicComplaintForm orgSlug={org.slug} orgName={org.name} />
        </div>

        <p className="text-center text-xs text-text-faint mt-6">
          Powered by <Link href="/" className="hover:text-accent">TrustStack</Link>
        </p>
      </main>
    </div>
  )
}
