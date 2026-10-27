// M7 Vendor DPA - automated risk scoring. CLIENT-SAFE pure functions (no node
// deps), so the public questionnaire form, the dashboard, and the submit API
// route all share one source of truth. Mirrors src/lib/platform/ai/compass-scorer.ts
// (weighted, normalised by the answered max) - but here a HIGHER score means
// HIGHER risk, the inverse of the Compass Score.
import { VENDOR_QUESTIONS, VENDOR_SCORABLE_COUNT, type VendorQuestion } from './questionnaire'
import type { VendorRiskTier } from '@/types/dpdp'

export interface VendorAnswer {
  question_id: string
  answer: string
}

export interface VendorRiskResult {
  risk_score: number // 0 (no residual risk) … 100 (maximum risk)
  risk_tier: VendorRiskTier
  answered: number // scorable questions actually answered
  scorable: number // total scorable questions in the bank
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n))
}

// Risk fraction (0..1) a single answer contributes, or null if the question is
// informational / the answer is unrecognised (excluded from the denominator).
function riskFraction(q: VendorQuestion, answer: string): number | null {
  if (q.weight <= 0) return null
  const a = answer.trim().toLowerCase()
  if (!a) return null

  if (q.type === 'select') {
    const opt = q.options?.find(o => o.value === answer)
    return opt ? clamp01(opt.risk) : null
  }

  // yes_no / yes_no_partial - a 'partial' is always half-risk.
  if (a === 'partial') return 0.5
  const risky = q.riskyAnswer ?? 'no'
  if (risky === 'no') {
    if (a === 'no') return 1
    if (a === 'yes') return 0
  } else {
    if (a === 'yes') return 1
    if (a === 'no') return 0
  }
  return null
}

// 0-25 low · 26-50 medium · 51-75 high · 76-100 critical
export function vendorRiskTier(score: number): VendorRiskTier {
  if (score <= 25) return 'low'
  if (score <= 50) return 'medium'
  if (score <= 75) return 'high'
  return 'critical'
}

// Representative 0-100 risk score for a tier - used when seeding a vendor from
// the pre-assessed library (no questionnaire answers exist yet).
export function scoreForTier(tier: VendorRiskTier): number {
  switch (tier) {
    case 'low':      return 12
    case 'medium':   return 38
    case 'high':     return 63
    case 'critical': return 88
  }
}

export function computeVendorRisk(answers: VendorAnswer[]): VendorRiskResult {
  const map = new Map(answers.map(a => [a.question_id, a.answer]))
  let earned = 0
  let max = 0
  let answered = 0

  for (const q of VENDOR_QUESTIONS) {
    if (q.weight <= 0) continue
    const ans = map.get(q.id)
    if (ans == null) continue
    const frac = riskFraction(q, ans)
    if (frac == null) continue
    earned += q.weight * frac
    max += q.weight
    answered += 1
  }

  const risk_score = max > 0 ? Math.round((earned / max) * 100) : 0
  return {
    risk_score,
    risk_tier: vendorRiskTier(risk_score),
    answered,
    scorable: VENDOR_SCORABLE_COUNT,
  }
}
