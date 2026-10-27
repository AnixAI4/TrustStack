import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requirePlatformOrg } from '@/lib/platform/org'
import { renderBoardReportPdf } from '@/components/platform/modules/board/BoardReportPDF'
import type { BoardReportData } from '@/types/dpdp'

// @react-pdf/renderer needs the Node runtime (native font/layout deps).
export const runtime = 'nodejs'

// POST (auth) - body: { report }. Renders the structured board report as a
// multi-page PDF and streams it back.
//
// NOTE: deviates from the prompt's `{ report_html }` body. @react-pdf renders
// structured primitives (not arbitrary HTML), so the client posts the same
// structured `report` object returned by /report/generate. This avoids a second
// Claude call and keeps the PDF layout authoritative.
export async function POST(req: Request) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const ctx = await requirePlatformOrg(supabase, user.id)
    if (!ctx.ok) return NextResponse.json({ error: ctx.error }, { status: ctx.status })

    const body = (await req.json().catch(() => ({}))) as { report?: BoardReportData }
    if (!body.report) {
      return NextResponse.json({ error: 'Missing report payload' }, { status: 400 })
    }

    const buffer = await renderBoardReportPdf(body.report)

    const safeName = (body.report.org_name || 'organization')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40)
    const filename = `truststack-board-report-${safeName || 'org'}.pdf`

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    console.error('Board report PDF error:', error)
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 })
  }
}
