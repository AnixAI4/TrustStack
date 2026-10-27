import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requirePlatformOrg } from '@/lib/platform/org'
import { generateRopaReportPdf } from '@/components/platform/modules/ropa/RopaReportPDF'
import type { RopaEntry } from '@/types/dpdp'

// @react-pdf/renderer needs the Node runtime (native font/layout deps).
export const runtime = 'nodejs'

// GET (auth) - renders the org's full ROPA register as a DPDP-format PDF and
// streams it. Server-derived (no body) so a plain link/window.open downloads it.
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const ctx = await requirePlatformOrg(supabase, user.id)
    if (!ctx.ok) return NextResponse.json({ error: ctx.error }, { status: ctx.status })

    const [{ data: org }, { data: entriesData }] = await Promise.all([
      supabase.from('organizations').select('name').eq('id', ctx.organizationId).single(),
      supabase
        .from('ropa_entries')
        .select('*')
        .eq('organization_id', ctx.organizationId)
        .order('status', { ascending: true })
        .order('created_at', { ascending: false })
        .limit(500),
    ])

    const entries = (entriesData ?? []) as RopaEntry[]
    const orgName = org?.name ?? 'Organization'

    const buffer = await generateRopaReportPdf({
      orgName,
      generatedAt: new Date(),
      entries,
    })

    const safeName = orgName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40)
    const filename = `truststack-ropa-register-${safeName || 'org'}.pdf`

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    console.error('[ROPA] PDF export error:', error)
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 })
  }
}
