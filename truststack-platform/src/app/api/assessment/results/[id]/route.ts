import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: membership } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .limit(1)
      .single()

    if (!membership) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 })
    }

    // Fetch assessment (RLS ensures org scoping)
    const { data: assessment } = await supabase
      .from('assessments')
      .select('*')
      .eq('id', id)
      .eq('organization_id', membership.organization_id)
      .single()

    if (!assessment) {
      return NextResponse.json({ error: 'Assessment not found' }, { status: 404 })
    }

    // Fetch answers
    const { data: answers } = await supabase
      .from('assessment_answers')
      .select('*')
      .eq('assessment_id', id)

    // Fetch gaps, sorted by priority
    const { data: gaps } = await supabase
      .from('assessment_gaps')
      .select('*')
      .eq('assessment_id', id)
      .order('priority', { ascending: true })  // p0, p1, p2, p3

    return NextResponse.json({
      success: true,
      data: {
        assessment,
        answers: answers ?? [],
        gaps: gaps ?? [],
      },
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
