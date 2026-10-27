import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requirePlatformOrg } from '@/lib/platform/org'
import { computeCompassScore } from '@/lib/platform/ai/compass-scorer'
import { generateGaps } from '@/lib/platform/ai/gap-generator'
import {
  ASSESSMENT_QUESTIONS,
  getIndustryQuestions,
} from '@/lib/platform/assessment-questions'

interface SubmitBody {
  assessment_id: string
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { assessment_id } = await request.json() as SubmitBody

    if (!assessment_id) {
      return NextResponse.json({ error: 'assessment_id is required' }, { status: 400 })
    }

    const ctx = await requirePlatformOrg(supabase, user.id)
    if (!ctx.ok) return NextResponse.json({ error: ctx.error }, { status: ctx.status })

    // Fetch org industry for industry-aware gap recommendations
    const { data: org } = await supabase
      .from('organizations')
      .select('industry')
      .eq('id', ctx.organizationId)
      .single()

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
      return NextResponse.json({ success: true, data: { id: assessment_id } })
    }

    // Load all answers
    const { data: answers } = await supabase
      .from('assessment_answers')
      .select('question_id, answer')
      .eq('assessment_id', assessment_id)

    if (!answers || answers.length === 0) {
      return NextResponse.json({ error: 'No answers found for this assessment' }, { status: 400 })
    }

    const requiredQuestions = [
      ...ASSESSMENT_QUESTIONS,
      ...getIndustryQuestions(org?.industry ?? null),
    ]
    const answeredIds = new Set(
      answers
        .filter(answer => String(answer.answer ?? '').trim() !== '')
        .map(answer => answer.question_id)
    )
    const missingQuestionIds = requiredQuestions
      .map(question => question.id)
      .filter(questionId => !answeredIds.has(questionId))

    if (missingQuestionIds.length > 0) {
      return NextResponse.json(
        {
          error: `Assessment incomplete: ${answeredIds.size} of ${requiredQuestions.length} required questions answered`,
          answered: answeredIds.size,
          required: requiredQuestions.length,
          missing_question_ids: missingQuestionIds,
        },
        { status: 400 }
      )
    }

    // Compute score
    const scoring = computeCompassScore(answers)

    // Generate gaps (industry-aware)
    const gaps = generateGaps(assessment_id, ctx.organizationId, answers, org?.industry ?? null)

    // Save gaps
    if (gaps.length > 0) {
      const { error: gapsError } = await supabase
        .from('assessment_gaps')
        .insert(gaps)

      if (gapsError) {
        return NextResponse.json({ error: 'Failed to save gaps: ' + gapsError.message }, { status: 500 })
      }
    }

    // Mark assessment as completed with score
    const { error: updateError } = await supabase
      .from('assessments')
      .update({
        status: 'completed',
        compass_score: scoring.compass_score,
        maturity_level: scoring.maturity_level,
        risk_tier: scoring.risk_tier,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', assessment_id)
      .eq('created_by', user.id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: { id: assessment_id, scoring } })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
