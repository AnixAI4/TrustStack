import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/platform/supabase/admin'

async function generateReferenceNumber(supabase: ReturnType<typeof createAdminClient>, organizationId: string): Promise<string> {
  const year = new Date().getFullYear()
  const { count } = await supabase
    .from('grievance_complaints')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .gte('created_at', `${year}-01-01`)
  const sequence = String((count ?? 0) + 1).padStart(3, '0')
  return `GRV-${year}-${sequence}`
}

export async function POST(req: Request) {
  try {
    const body = await req.json() as {
      org_slug?:          string
      complainant_name?:  string
      complainant_email?: string
      complainant_phone?: string
      complaint_type?:    string
      description?:       string
      language?:          string
    }

    const { org_slug, complainant_name, complainant_email, complainant_phone, complaint_type, description, language } = body

    if (!org_slug)          return NextResponse.json({ error: 'org_slug is required' }, { status: 400 })
    if (!complainant_name)  return NextResponse.json({ error: 'complainant_name is required' }, { status: 400 })
    if (!complainant_email && !complainant_phone) {
      return NextResponse.json({ error: 'At least one of complainant_email or complainant_phone is required' }, { status: 400 })
    }
    if (!complaint_type)    return NextResponse.json({ error: 'complaint_type is required' }, { status: 400 })
    if (!description || description.trim().length < 50) {
      return NextResponse.json({ error: 'description must be at least 50 characters' }, { status: 400 })
    }

    // The public caller never receives database credentials. Validation happens
    // above, then this trusted server route performs the RLS-bypassing write.
    const supabase = createAdminClient()

    const { data: org } = await supabase
      .from('organizations')
      .select('id, name')
      .eq('slug', org_slug)
      .single()

    if (!org) return NextResponse.json({ error: 'Organization not found' }, { status: 404 })

    const { data: officer } = await supabase
      .from('grievance_officers')
      .select('name, email')
      .eq('organization_id', org.id)
      .eq('active', true)
      .single()

    const referenceNumber = await generateReferenceNumber(supabase, org.id)

    const { error: insertError } = await supabase
      .from('grievance_complaints')
      .insert({
        organization_id:  org.id,
        reference_number: referenceNumber,
        complainant_name: complainant_name.trim(),
        complainant_email: complainant_email?.trim().toLowerCase() || null,
        complainant_phone: complainant_phone?.trim() || null,
        complaint_type,
        description: description.trim(),
        language: language ?? 'en',
        status: 'new',
      })

    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 400 })

    // Send email notification to Grievance Officer if Resend is configured
    // FROM address: use verified Resend test domain until truststack.in is verified in Resend dashboard.
    // Once truststack.in is verified, change to: 'TrustStack™ <noreply@truststack.in>'
    if (officer && process.env.RESEND_API_KEY) {
      try {
        const { Resend } = await import('resend')
        const resend = new Resend(process.env.RESEND_API_KEY)
        const { data: emailData, error: emailError } = await resend.emails.send({
          from: 'TrustStack™ <noreply@anixai.io>',
          to:   officer.email,
          subject: `New Grievance Complaint - ${referenceNumber}`,
          html: `
            <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
              <h2 style="color:#E2620A">New Grievance Complaint Received</h2>
              <p>A new complaint has been submitted via ${org.name}'s public grievance portal.</p>
              <table style="border-collapse:collapse;width:100%;margin:16px 0">
                <tr><td style="padding:8px;font-weight:600;color:#6B7280;width:140px">Reference</td><td style="padding:8px;font-family:monospace;font-weight:700">${referenceNumber}</td></tr>
                <tr style="background:#F9FAFB"><td style="padding:8px;font-weight:600;color:#6B7280">From</td><td style="padding:8px">${complainant_name}</td></tr>
                <tr><td style="padding:8px;font-weight:600;color:#6B7280">Type</td><td style="padding:8px">${complaint_type}</td></tr>
                <tr style="background:#F9FAFB"><td style="padding:8px;font-weight:600;color:#6B7280">Description</td><td style="padding:8px">${description.substring(0, 300)}${description.length > 300 ? '…' : ''}</td></tr>
              </table>
              <p>You must respond within <strong>30 days</strong> as required under DPDP Section 14.</p>
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/trustdeck/grievance/complaints" style="display:inline-block;padding:12px 24px;background:#E2620A;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;margin-top:8px">
                Review Complaint in TrustStack™
              </a>
            </div>
          `,
        })
        if (emailError) {
          console.error('[Grievance] Resend error:', emailError)
        } else {
          console.log('[Grievance] Email sent:', emailData?.id)
        }
      } catch (e) {
        console.error('[Grievance] Email exception:', e)
      }
    }

    return NextResponse.json({ success: true, reference_number: referenceNumber, message: 'Complaint submitted successfully. We will respond within 30 days.' })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
