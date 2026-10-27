import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyQuestionnaireToken } from '@/lib/vendors/token'
import { computeVendorRisk } from '@/lib/vendors/risk'
import { getVendorQuestion } from '@/lib/vendors/questionnaire'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

// POST — public. A vendor (no login) submits the questionnaire via a signed
// token. We verify the token, store the answers with the SERVICE-ROLE admin
// client (no session exists), recompute the risk score/tier, and mark the
// vendor's questionnaire complete.
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      token?: string
      answers?: { question_id?: unknown; answer?: unknown }[]
    }

    if (!body.token) {
      return NextResponse.json({ error: 'Missing token' }, { status: 400, headers: CORS_HEADERS })
    }
    const payload = verifyQuestionnaireToken(body.token)
    if (!payload) {
      return NextResponse.json({ error: 'This questionnaire link is invalid or has expired.' }, { status: 401, headers: CORS_HEADERS })
    }

    // Keep only well-formed answers for questions that actually exist.
    const answers = (Array.isArray(body.answers) ? body.answers : [])
      .map(a => ({ question_id: String(a.question_id ?? ''), answer: String(a.answer ?? '').trim() }))
      .filter(a => a.answer !== '' && getVendorQuestion(a.question_id))

    if (answers.length === 0) {
      return NextResponse.json({ error: 'Please answer the questionnaire before submitting.' }, { status: 400, headers: CORS_HEADERS })
    }

    const supabase = createAdminClient()

    // Confirm the vendor still exists for this org (token could outlive deletion).
    const { data: vendor } = await supabase
      .from('vendors')
      .select('id, organization_id')
      .eq('id', payload.v)
      .eq('organization_id', payload.o)
      .single()

    if (!vendor) {
      return NextResponse.json({ error: 'This vendor record is no longer available.' }, { status: 404, headers: CORS_HEADERS })
    }

    const nowIso = new Date().toISOString()

    // Upsert each answer (unique on vendor_id + question_id).
    const rows = answers.map(a => ({
      vendor_id: payload.v,
      organization_id: payload.o,
      question_id: a.question_id,
      answer: a.answer,
    }))
    const { error: upsertError } = await supabase
      .from('vendor_questionnaire_responses')
      .upsert(rows, { onConflict: 'vendor_id,question_id' })

    if (upsertError) {
      return NextResponse.json({ error: upsertError.message }, { status: 400, headers: CORS_HEADERS })
    }

    // Recompute risk from the freshly submitted answers.
    const risk = computeVendorRisk(answers)

    // Infer India residency from E1 ("is our data stored within India?") if answered.
    const e1 = answers.find(a => a.question_id === 'E1')
    const residencyUpdate = e1 ? { india_data_residency: e1.answer.toLowerCase() === 'yes' } : {}

    const { error: updateError } = await supabase
      .from('vendors')
      .update({
        risk_score: risk.risk_score,
        risk_tier: risk.risk_tier,
        questionnaire_completed: true,
        questionnaire_completed_at: nowIso,
        updated_at: nowIso,
        ...residencyUpdate,
      })
      .eq('id', payload.v)
      .eq('organization_id', payload.o)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400, headers: CORS_HEADERS })
    }

    // We intentionally do NOT return the internal risk score/tier to the vendor.
    return NextResponse.json(
      { success: true, message: 'Thank you — your responses have been submitted.' },
      { headers: CORS_HEADERS },
    )
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: CORS_HEADERS })
  }
}
