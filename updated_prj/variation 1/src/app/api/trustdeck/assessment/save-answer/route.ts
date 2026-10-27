import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requirePlatformOrg } from '@/lib/platform/org'
import {
  ASSESSMENT_QUESTIONS,
  FINTECH_QUESTIONS,
  HEALTHTECH_QUESTIONS,
  EDTECH_QUESTIONS,
} from '@/lib/platform/assessment-questions'

const ALL_QUESTIONS = [...ASSESSMENT_QUESTIONS, ...FINTECH_QUESTIONS, ...HEALTHTECH_QUESTIONS, ...EDTECH_QUESTIONS]

interface SaveAnswerBody {
  assessment_id: string
  question_id: string
  answer: string
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json() as SaveAnswerBody
    const { assessment_id, question_id, answer } = body

    if (!assessment_id || !question_id || answer === undefined || answer === null) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const question = ALL_QUESTIONS.find(q => q.id === question_id)
    if (!question) {
      return NextResponse.json({ error: 'Invalid question_id' }, { status: 400 })
    }

    // Verify the assessment belongs to the user's org
    const ctx = await requirePlatformOrg(supabase, user.id)
    if (!ctx.ok) return NextResponse.json({ error: ctx.error }, { status: ctx.status })

    const { data: assessment } = await supabase
      .from('assessments')
      .select('id, organization_id, status')
      .eq('id', assessment_id)
      .eq('organization_id', ctx.organizationId)
      .eq('created_by', user.id)
      .single()

    if (!assessment) {
      return NextResponse.json({ error: 'Assessment not found' }, { status: 404 })
    }

    if (assessment.status === 'completed') {
      return NextResponse.json({ error: 'Assessment already completed' }, { status: 400 })
    }

    // Upsert the answer (replace if already answered)
    const { error } = await supabase
      .from('assessment_answers')
      .upsert(
        {
          assessment_id,
          organization_id: ctx.organizationId,
          question_id,
          section: question.section,
          answer: String(answer),
        },
        { onConflict: 'assessment_id,question_id' }
      )

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
