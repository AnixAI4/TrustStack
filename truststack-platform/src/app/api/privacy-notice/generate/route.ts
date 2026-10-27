import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  NOTICE_GENERATION_PROMPT,
  buildNoticeUserPrompt,
} from '@/lib/ai/notice-generator'
import type { NoticeBuilderData } from '@/types/dpdp'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// POST (auth) — generates a DPDP-compliant Privacy Notice (English Markdown)
// from the wizard form data, combined with authoritative org + Grievance Officer
// details fetched server-side. Uses the project model (claude-sonnet-4-6).
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: member } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .single()

    if (!member) return NextResponse.json({ error: 'No organization found' }, { status: 403 })

    const builder = (await request.json()) as NoticeBuilderData
    if (!builder || !Array.isArray(builder.data_categories)) {
      return NextResponse.json({ error: 'Invalid notice data' }, { status: 400 })
    }

    const [{ data: org }, { data: officer }] = await Promise.all([
      supabase
        .from('organizations')
        .select('name, cin')
        .eq('id', member.organization_id)
        .single(),
      supabase
        .from('grievance_officers')
        .select('name, designation, email, phone')
        .eq('organization_id', member.organization_id)
        .eq('active', true)
        .order('appointed_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ])

    if (!officer) {
      return NextResponse.json(
        { error: 'No Grievance Officer set. Appoint one in the Grievance module first.' },
        { status: 400 }
      )
    }

    const userPrompt = buildNoticeUserPrompt({
      builder,
      organization_name: org?.name || builder.company?.legal_name || 'The Company',
      cin: org?.cin || (builder.company?.cin || null),
      grievance_officer: {
        name: officer.name,
        designation: officer.designation,
        email: officer.email,
        phone: officer.phone || null,
      },
    })

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: NOTICE_GENERATION_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    })

    const content = response.content[0]
    if (content.type !== 'text') {
      return NextResponse.json({ error: 'Unexpected response type' }, { status: 500 })
    }

    return NextResponse.json({ content_en: content.text })
  } catch (error) {
    console.error('Notice generation error:', error)
    return NextResponse.json({ error: 'Failed to generate notice' }, { status: 500 })
  }
}
