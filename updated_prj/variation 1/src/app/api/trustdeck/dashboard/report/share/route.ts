import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requirePlatformOrg } from '@/lib/platform/org'
import { signShareToken } from '@/lib/platform/dashboard/share-token'

const DAY_MS = 86_400_000
const SHARE_TTL_DAYS = 7

// POST (auth) - body: { from_date, to_date }. Mints a signed, time-limited URL
// to the public board report so board members can view it without logging in.
export async function POST(req: Request) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const ctx = await requirePlatformOrg(supabase, user.id)
    if (!ctx.ok) return NextResponse.json({ error: ctx.error }, { status: ctx.status })

    const body = (await req.json().catch(() => ({}))) as { from_date?: string; to_date?: string }
    const toDate = body.to_date || new Date().toISOString()
    const fromDate = body.from_date || new Date(Date.now() - 30 * DAY_MS).toISOString()

    const token = signShareToken(ctx.organizationId, user.id, fromDate, toDate, SHARE_TTL_DAYS * DAY_MS)
    const base = process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin
    const url = `${base}/trustdeck/public/board-report/${token}`

    return NextResponse.json({ url, expires_in_days: SHARE_TTL_DAYS })
  } catch (error) {
    console.error('Board report share error:', error)
    return NextResponse.json({ error: 'Failed to create share link' }, { status: 500 })
  }
}
