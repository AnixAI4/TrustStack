import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'
import { ANTHROPIC_MODEL } from '@/lib/ai/anthropic'
import { createClient } from '@/lib/supabase/server'
import { requirePlatformOrg } from '@/lib/platform/org'
import { DPBI_SYSTEM_PROMPT, buildDpbiUserPrompt } from '@/lib/platform/breach/notification'
import type { BreachIncident } from '@/types/dpdp'

// POST - Claude generates the DPBI breach notification letter (formal text, NOT
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

    const ctx = await requirePlatformOrg(supabase, user.id)
    if (!ctx.ok) return NextResponse.json({ error: ctx.error }, { status: ctx.status })

    const [{ data: breach }, { data: org }, { data: officer }] = await Promise.all([
      supabase.from('breach_incidents').select('*').eq('id', id).eq('organization_id', ctx.organizationId).single(),
      supabase.from('organizations').select('name').eq('id', ctx.organizationId).single(),
      supabase
        .from('grievance_officers')
        .select('name, designation, email, phone')
        .eq('organization_id', ctx.organizationId)
        .eq('active', true)
        .order('appointed_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ])

    if (!breach) return NextResponse.json({ error: 'Breach incident not found' }, { status: 404 })
    if (!officer) {
      return NextResponse.json(
        { error: 'No Grievance Officer set. Appoint one in the Grievance module first - they are the DPBI follow-up contact (Rule 7).' },
        { status: 400 },
      )
    }

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const response = await anthropic.messages.create({
      model: ANTHROPIC_MODEL,
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
      .eq('organization_id', ctx.organizationId)

    return NextResponse.json({ success: true, draft })
  } catch (error) {
    console.error('[Breach] DPBI draft error:', error)
    return NextResponse.json({ error: 'Failed to generate DPBI notification draft' }, { status: 500 })
  }
}
