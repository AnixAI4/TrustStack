import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Shield, Mail, Phone, Briefcase } from 'lucide-react'
import { PublicComplaintForm } from '@/components/modules/grievance/PublicComplaintForm'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  return {
    title: `Submit a Complaint — ${slug}`,
    description: 'Submit a grievance complaint under the Digital Personal Data Protection Act 2023',
  }
}

export default async function PublicGrievancePage({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()

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
    <div className="min-h-screen bg-[#F4F8FC]">
      {/* Header */}
      <header className="bg-[#003366] text-white py-4 px-6">
        <div className="max-w-2xl mx-auto flex items-center gap-2">
          <Shield size={18} className="text-[#D6E4F0]" />
          <span className="text-sm font-medium text-[#D6E4F0]">TrustStack™ — DPDP Compliance</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-10">
        {/* Org + Officer info */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-6">
          <h1 className="text-xl font-bold text-[#003366] mb-1">{org.name}</h1>
          <p className="text-sm text-gray-500 mb-4">
            Grievance portal under the Digital Personal Data Protection Act 2023 (DPDP Section 14)
          </p>

          {officer ? (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Grievance Officer</p>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Briefcase size={14} className="text-gray-400 shrink-0" />
                  <span>{officer.name} — {officer.designation}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Mail size={14} className="text-gray-400 shrink-0" />
                  <a href={`mailto:${officer.email}`} className="hover:text-[#003366]">{officer.email}</a>
                </div>
                {officer.phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Phone size={14} className="text-gray-400 shrink-0" />
                    <span>{officer.phone}</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
              This organization has not yet appointed a Grievance Officer. Please contact them directly.
            </p>
          )}
        </div>

        {/* Submission form */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-[#003366] mb-1">Submit a Complaint</h2>
          <p className="text-sm text-gray-500 mb-5">
            All complaints will be responded to within <strong>30 days</strong> as required by DPDP Section 14.
            You will receive a reference number upon submission.
          </p>
          <PublicComplaintForm orgSlug={org.slug} orgName={org.name} />
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Powered by <a href="/" className="hover:text-[#003366]">TrustStack™ by Anix AI</a>
        </p>
      </main>
    </div>
  )
}
