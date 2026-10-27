import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { maturityFromScore } from '@/lib/dashboard/aggregate'
import type { CompassScoreHistory, CompassScorePoint } from '@/types/dpdp'

interface ScoreRow {
  id: string
  compass_score: number | null
  maturity_level: number | null
  completed_at: string | null
  created_at: string
}

// GET (auth) — current Compass Score + the last 6 completed assessments for a
// trend chart (oldest → newest).
export async function GET() {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: member } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .limit(1)
      .single()

    if (!member) return NextResponse.json({ error: 'No organization found' }, { status: 404 })

    const { data } = await supabase
      .from('assessments')
      .select('id, compass_score, maturity_level, completed_at, created_at')
      .eq('organization_id', member.organization_id)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(6)

    const rows = (data ?? []) as ScoreRow[]
    const points: CompassScorePoint[] = rows
      .filter(r => r.compass_score != null)
      .map(r => ({
        assessment_id: r.id,
        compass_score: r.compass_score as number,
        maturity_level: (r.maturity_level ?? maturityFromScore(r.compass_score as number)) as 1 | 2 | 3 | 4 | 5,
        completed_at: r.completed_at,
        created_at: r.created_at,
      }))

    const payload: CompassScoreHistory = {
      current: points[0] ?? null,
      history: [...points].reverse(),
    }

    return NextResponse.json(payload)
  } catch (error) {
    console.error('Compass score history error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
