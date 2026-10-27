import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'
import { ANTHROPIC_MODEL } from '@/lib/ai/anthropic'
import { createClient } from '@/lib/supabase/server'
import { requirePlatformOrg } from '@/lib/platform/org'
import { DPA_SYSTEM_PROMPT, buildDpaUserPrompt } from '@/lib/platform/vendors/dpa'
import type { Vendor } from '@/types/dpdp'

// POST - Claude generates a DPDP-compliant DPA (Markdown) tailored to the vendor
// type + risk tier. Mirrors src/app/api/dsr/draft/route.ts. The DPA text is
// returned to the client for preview / print / download; it is not stored
// (dpa_document_url is for an externally-hosted signed copy).
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'DPA generation is not configured' }, { status: 400 })
    }

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

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const response = await anthropic.messages.create({
      model: ANTHROPIC_MODEL,
      max_tokens: 4000,
      system: DPA_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: buildDpaUserPrompt(vendor as Vendor, org?.name ?? 'the Company') }],
    })

    const content = response.content[0]
    if (content.type !== 'text') {
      return NextResponse.json({ error: 'Unexpected response type' }, { status: 500 })
    }

    return NextResponse.json({ success: true, dpa: content.text.trim() })
  } catch (error) {
    console.error('[Vendors] DPA generation error:', error)
    return NextResponse.json({ error: 'Failed to generate DPA' }, { status: 500 })
  }
}
