import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requirePlatformOrg } from '@/lib/platform/org'
import { signQuestionnaireToken } from '@/lib/platform/vendors/token'
import { sendQuestionnaireEmail } from '@/lib/platform/vendors/email'
import type { Vendor } from '@/types/dpdp'

// POST - issue a signed public questionnaire link for the vendor and email it to
// the vendor contact. Returns the link (so the dashboard can also copy it) and
// whether the email was sent (email failure is non-fatal).
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const ctx = await requirePlatformOrg(supabase, user.id)
    if (!ctx.ok) return NextResponse.json({ error: ctx.error }, { status: ctx.status })

    const [{ data: vendor }, { data: org }] = await Promise.all([
      supabase.from('vendors').select('*').eq('id', id).eq('organization_id', ctx.organizationId).single(),
      supabase.from('organizations').select('name').eq('id', ctx.organizationId).single(),
    ])

    if (!vendor) return NextResponse.json({ error: 'Vendor not found' }, { status: 404 })
    const v = vendor as Vendor

    const token = signQuestionnaireToken(v.id, ctx.organizationId)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin
    const link = `${baseUrl}/trustdeck/public/vendor-questionnaire/${token}`

    let emailSent = false
    if (v.contact_email) {
      emailSent = await sendQuestionnaireEmail(v.contact_email, {
        vendorName: v.name,
        orgName: org?.name ?? 'our organisation',
        link,
        contactName: v.contact_name,
      })
    }

    // Move the DPA workflow forward: requesting the questionnaire counts as
    // engaging the vendor, so a 'pending' DPA becomes 'sent'.
    if (v.dpa_status === 'pending') {
      await supabase
        .from('vendors')
        .update({ dpa_status: 'sent', updated_at: new Date().toISOString() })
        .eq('id', v.id)
        .eq('organization_id', ctx.organizationId)
    }

    return NextResponse.json({
      success: true,
      link,
      email_sent: emailSent,
      has_contact_email: Boolean(v.contact_email),
      message: v.contact_email
        ? (emailSent
            ? `Questionnaire emailed to ${v.contact_email}.`
            : 'Could not email the vendor right now - copy the link and share it manually.')
        : 'No vendor contact email on file - copy the link and share it manually.',
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
