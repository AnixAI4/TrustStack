import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { DPBI_SYSTEM_PROMPT, buildDpbiUserPrompt } from '@/lib/breach/notification'
import type { BreachIncident } from '@/types/dpdp'

// POST — Claude generates the DPBI breach notification letter (formal text, NOT
// JSON) under DPDP §8(6) + Rule 7. Mirrors src/app/api/vendors/[id]/dpa/route.ts.
// The "Contact person for DPBI follow-up" is pulled from the org's active M4
// Grievance Officer SERVER-SIDE (like M3 pulled the officer into the notice),
// never from the client. The draft is persisted to dpbi_notification_draft so it
// re-loads on the detail page.
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'DPBI draft generation is not configured' }, { status: 400 })
    }

    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: membership } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .single()

    if (!membership) return NextResponse.json({ error: 'No organization found' }, { status: 404 })

    const [{ data: breach }, { data: org }, { data: officer }] = await Promise.all([
      supabase.from('breach_incidents').select('*').eq('id', id).eq('organization_id', membership.organization_id).single(),
      supabase.from('organizations').select('name').eq('id', membership.organization_id).single(),
      supabase
        .from('grievance_officers')
        .select('name, designation, email, phone')
        .eq('organization_id', membership.organization_id)
        .eq('active', true)
        .order('appointed_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ])

    if (!breach) return NextResponse.json({ error: 'Breach incident not found' }, { status: 404 })
    if (!officer) {
      return NextResponse.json(
        { error: 'No Grievance Officer set. Appoint one in the Grievance module first — they are the DPBI follow-up contact (Rule 7).' },
        { status: 400 },
      )
    }

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      system: DPBI_SYSTEM_PROMPT,
      messages: [{
        role: 'user',
        content: buildDpbiUserPrompt(breach as BreachIncident, org?.name ?? 'the Company', {
          name: officer.name,
          designation: officer.designation,
          email: officer.email,
          phone: officer.phone ?? null,
        }),
      }],
    })

    const content = response.content[0]
    if (content.type !== 'text') {
      return NextResponse.json({ error: 'Unexpected response type' }, { status: 500 })
    }

    const draft = content.text.trim()

    // Persist so the draft re-loads on the detail page (note 6).
    await supabase
      .from('breach_incidents')
      .update({ dpbi_notification_draft: draft, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('organization_id', membership.organization_id)

    return NextResponse.json({ success: true, draft })
  } catch (error) {
    console.error('[Breach] DPBI draft error:', error)
    return NextResponse.json({ error: 'Failed to generate DPBI notification draft' }, { status: 500 })
  }
}
