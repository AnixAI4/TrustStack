import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { renderRopaReportPdf } from '@/components/modules/ropa/RopaReportPDF'
import { buildCoverageMap } from '@/lib/ropa/consent'
import type { RopaEntry, ConsentPurpose } from '@/types/dpdp'

// @react-pdf/renderer needs the Node runtime (native font/layout deps).
export const runtime = 'nodejs'

// GET (auth) — renders the org's full ROPA register as a DPDP-format PDF and
// streams it. Server-derived (no body) so a plain link/window.open downloads it.
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: membership } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .single()

    if (!membership) return NextResponse.json({ error: 'No organization found' }, { status: 404 })

    const [{ data: org }, { data: entriesData }, { data: purposes }] = await Promise.all([
      supabase.from('organizations').select('name').eq('id', membership.organization_id).single(),
      supabase
        .from('ropa_entries')
        .select('*')
        .eq('organization_id', membership.organization_id)
        .order('status', { ascending: true })
        .order('created_at', { ascending: false })
        .limit(500),
      supabase
        .from('consent_purposes')
        .select('name_en, description_en, purpose_key')
        .eq('organization_id', membership.organization_id),
    ])

    const entries = (entriesData ?? []) as RopaEntry[]
    const coverage = buildCoverageMap(entries, (purposes ?? []) as Pick<ConsentPurpose, 'name_en' | 'description_en' | 'purpose_key'>[])
    const orgName = org?.name ?? 'Organization'

    const buffer = await renderRopaReportPdf({
      orgName,
      generatedAt: new Date().toISOString(),
      entries,
      coverage,
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
