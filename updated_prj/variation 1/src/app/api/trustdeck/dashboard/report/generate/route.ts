import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { ANTHROPIC_MODEL } from '@/lib/ai/anthropic'
import { createClient } from '@/lib/supabase/server'
import { requirePlatformOrg } from '@/lib/platform/org'
import { getReportFacts } from '@/lib/platform/dashboard/aggregate'
import { buildBoardReportPrompt, buildReportHtml, deterministicSummary } from '@/lib/platform/dashboard/report-content'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM =
  'You are an expert data-protection analyst writing board-level executive summaries for Indian companies under the DPDP Act 2023. Be precise, factual, and concise.'

const DAY_MS = 86_400_000

// POST (auth) - body: { from_date, to_date }. Aggregates the period facts, asks
// Claude for the 3-sentence executive summary, and returns both an HTML preview
// and the structured report (which the client passes to /report/pdf).
export async function POST(req: Request) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const ctx = await requirePlatformOrg(supabase, user.id)
    if (!ctx.ok) return NextResponse.json({ error: ctx.error }, { status: ctx.status })

    const body = (await req.json().catch(() => ({}))) as { from_date?: string; to_date?: string }
    const toDate = body.to_date || new Date().toISOString()
    const fromDate = body.from_date || new Date(Date.now() - 30 * DAY_MS).toISOString()

    const { report, modules_completed } = await getReportFacts(
      supabase,
      ctx.organizationId,
      ctx.org.name,
      fromDate,
      toDate,
      user.id
    )

    // AI executive summary. If the model call fails, fall back to a deterministic
    // summary so the report still generates.
    let summary = ''
    try {
      const response = await anthropic.messages.create({
        model: ANTHROPIC_MODEL,
        max_tokens: 400,
        system: SYSTEM,
        messages: [{ role: 'user', content: buildBoardReportPrompt(report, modules_completed) }],
      })
      const content = response.content[0]
      if (content.type === 'text') summary = content.text.trim()
    } catch (e) {
      console.error('Board report narrative error:', e)
    }

    if (!summary) {
      summary = deterministicSummary(report, modules_completed)
    }

    report.summary = summary
    const report_html = buildReportHtml(report)

    return NextResponse.json({ report_html, generated_at: report.generated_at, report })
  } catch (error) {
    console.error('Board report generate error:', error)
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 })
  }
}
