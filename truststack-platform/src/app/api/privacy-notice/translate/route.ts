import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { buildTranslationSystemPrompt } from '@/lib/ai/notice-generator'
import { NOTICE_LANGUAGES } from '@/lib/constants'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// POST (auth) — translates an English notice into a target Indian language,
// preserving Markdown structure. target_language is a NOTICE_LANGUAGES code.
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { content_en, target_language } = (await request.json()) as {
      content_en?: string
      target_language?: string
    }

    if (!content_en || !content_en.trim()) {
      return NextResponse.json({ error: 'content_en is required' }, { status: 400 })
    }

    const lang = NOTICE_LANGUAGES.find(l => l.code === target_language)
    if (!lang || lang.code === 'en') {
      return NextResponse.json({ error: 'Unsupported target language' }, { status: 400 })
    }

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: buildTranslationSystemPrompt(lang.name),
      messages: [{ role: 'user', content: content_en }],
    })

    const content = response.content[0]
    if (content.type !== 'text') {
      return NextResponse.json({ error: 'Unexpected response type' }, { status: 500 })
    }

    return NextResponse.json({ translated_content: content.text })
  } catch (error) {
    console.error('Notice translation error:', error)
    return NextResponse.json({ error: 'Failed to translate notice' }, { status: 500 })
  }
}
