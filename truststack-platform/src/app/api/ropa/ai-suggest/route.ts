import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ROPA_AI_SYSTEM_PROMPT, buildRopaSuggestPrompt, sanitizeRopaSuggestion } from '@/lib/ropa/ai'

// POST (auth) — body: { description }. Claude maps a plain-language description of
// a processing activity to STRUCTURED ROPA fields so the form can pre-fill.
// Mirrors src/app/api/vendors/[id]/dpa/route.ts (SDK call isolated here; the
// prompt builder + sanitizer live in the client-safe src/lib/ropa/ai.ts).
export async function POST(req: Request) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'AI assist is not configured' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: membership } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .single()

    if (!membership) return NextResponse.json({ error: 'No organization found' }, { status: 404 })

    const body = (await req.json().catch(() => ({}))) as { description?: string }
    const description = (body.description ?? '').trim()
    if (description.length < 10) {
      return NextResponse.json({ error: 'Please describe the activity in a bit more detail (at least 10 characters).' }, { status: 400 })
    }

    const { data: org } = await supabase
      .from('organizations')
      .select('name, industry')
      .eq('id', membership.organization_id)
      .single()

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      system: ROPA_AI_SYSTEM_PROMPT,
      messages: [{
        role: 'user',
        content: buildRopaSuggestPrompt(description, { orgName: org?.name ?? undefined, industry: org?.industry ?? null }),
      }],
    })

    const content = response.content[0]
    if (content.type !== 'text') {
      return NextResponse.json({ error: 'Unexpected response type' }, { status: 500 })
    }

    // Extract the JSON object defensively (strip any stray fences / prose).
    const text = content.text.trim().replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim()
    const start = text.indexOf('{')
    const end = text.lastIndexOf('}')
    const jsonSlice = start !== -1 && end !== -1 && end > start ? text.slice(start, end + 1) : text

    const suggestion = sanitizeRopaSuggestion(jsonSlice)
    if (Object.keys(suggestion).length === 0) {
      return NextResponse.json({ error: 'Could not derive ROPA fields from that description. Try adding more detail.' }, { status: 422 })
    }

    return NextResponse.json({ success: true, suggestion })
  } catch (error) {
    console.error('[ROPA] AI suggest error:', error)
    return NextResponse.json({ error: 'Failed to generate suggestion' }, { status: 500 })
  }
}
