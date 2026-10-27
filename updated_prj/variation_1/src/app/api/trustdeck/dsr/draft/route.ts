import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'
import { ANTHROPIC_MODEL } from '@/lib/ai/anthropic'
import { createClient } from '@/lib/supabase/server'
import { requirePlatformOrg } from '@/lib/platform/org'
import { DSR_DRAFT_SYSTEM, buildDraftUserPrompt, type DsrDraftMode } from '@/lib/platform/dsr/draft'
import type { DsrRequest } from '@/types/dpdp'

// Optional helper: Claude drafts a professional fulfillment/denial reply the DPO
// can review and edit. Mirrors src/app/api/chat/route.ts.
export async function POST(req: Request) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'AI drafting is not configured' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const ctx = await requirePlatformOrg(supabase, user.id)
    if (!ctx.ok) return NextResponse.json({ error: ctx.error }, { status: ctx.status })

    const { id, mode } = (await req.json()) as { id?: string; mode?: DsrDraftMode }
    if (!id || (mode !== 'fulfillment' && mode !== 'denial')) {
      return NextResponse.json({ error: 'id and a valid mode (fulfillment | denial) are required' }, { status: 400 })
    }

    const { data: request } = await supabase
      .from('dsr_requests')
      .select('*')
      .eq('id', id)
      .eq('organization_id', ctx.organizationId)
      .single()

    if (!request) return NextResponse.json({ error: 'Request not found' }, { status: 404 })

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const response = await anthropic.messages.create({
      model: ANTHROPIC_MODEL,
      max_tokens: 700,
      system: DSR_DRAFT_SYSTEM,
      messages: [{ role: 'user', content: buildDraftUserPrompt(request as DsrRequest, mode) }],
    })

    const content = response.content[0]
    if (content.type !== 'text') {
      return NextResponse.json({ error: 'Unexpected response type' }, { status: 500 })
    }

    return NextResponse.json({ success: true, draft: content.text.trim() })
  } catch (error) {
    console.error('[DSR] draft error:', error)
    return NextResponse.json({ error: 'Failed to generate draft' }, { status: 500 })
  }
}
