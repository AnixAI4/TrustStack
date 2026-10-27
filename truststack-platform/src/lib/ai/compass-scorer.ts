import type { AssessmentSection, AnswerValue, ScoringResult, RiskTier } from '@/types/dpdp'
import {
  ASSESSMENT_QUESTIONS,
  FINTECH_QUESTIONS,
  HEALTHTECH_QUESTIONS,
  EDTECH_QUESTIONS,
} from '@/lib/assessment-questions'
import { MATURITY_LEVELS } from '@/lib/constants'

// All questions across core and industry modules — industry answers contribute to the score
const ALL_QUESTIONS = [...ASSESSMENT_QUESTIONS, ...FINTECH_QUESTIONS, ...HEALTHTECH_QUESTIONS, ...EDTECH_QUESTIONS]

// Core section point maximums — 112 raw pts; industry section adds up to 24 pts dynamically
const SECTION_MAX: Record<string, number> = {
  org_profile:    0,   // informational only
  data_fiduciary: 16,  // 2 pts × 8 questions
  consent:        18,  // 3 pts × 6 questions
  notice:         12,  // 3 pts × 4 questions
  rights:         18,  // 3 pts × 6 questions
  security:       18,  // 3 pts × 6 questions
  breach:         15,  // 3 pts × 5 questions
  vendor:         15,  // 3 pts × 5 questions
}

const TOTAL_RAW_MAX = 112

function answerToPoints(answer: AnswerValue, maxPoints: number): number {
  // Q38 (past breaches) is inverted: no breach = full points
  if (answer === 'yes')     return maxPoints
  if (answer === 'partial') return maxPoints / 2
  if (answer === 'no')      return 0
  return 0
}

function scoreToRiskTier(score: number): RiskTier {
  if (score <= 20) return 'critical'
  if (score <= 40) return 'high'
  if (score <= 60) return 'medium'
  if (score <= 80) return 'low'
  return 'managed'
}

function scoreToMaturityLevel(score: number): 1 | 2 | 3 | 4 | 5 {
  for (const [level, config] of Object.entries(MATURITY_LEVELS) as [string, { range: [number, number] }][]) {
    const [min, max] = config.range
    if (score >= min && score <= max) return Number(level) as 1 | 2 | 3 | 4 | 5
  }
  return 1
}

export function computeCompassScore(
  answers: { question_id: string; answer: AnswerValue }[]
): ScoringResult {
  const answerMap = new Map(answers.map(a => [a.question_id, a.answer]))

  const sectionScores: Partial<Record<AssessmentSection, { earned: number; max: number }>> = {}
  let totalEarned = 0
  let totalMax = 0

  for (const question of ALL_QUESTIONS) {
    if (!question.scorable) continue

    const answer = answerMap.get(question.id)
    if (!answer) continue

    const section = question.section
    if (!sectionScores[section]) {
      sectionScores[section] = { earned: 0, max: 0 }
    }

    let pts: number
    // Q38: inverted — "no breach" is the good answer
    if (question.id === 'Q38') {
      if (answer === 'no')      pts = question.pointValue       // no breach = full pts
      else if (answer === 'partial') pts = question.pointValue / 2
      else                      pts = 0                         // yes = breach occurred
    } else {
      pts = answerToPoints(answer, question.pointValue)
    }

    sectionScores[section]!.earned += pts
    sectionScores[section]!.max    += question.pointValue
    totalEarned += pts
    totalMax    += question.pointValue
  }

  // Normalize to 0–100 based on answered questions (answered max, not TOTAL_RAW_MAX)
  // This avoids penalizing partial completion. If fully answered, totalMax ≈ TOTAL_RAW_MAX.
  const effectiveMax = totalMax > 0 ? totalMax : TOTAL_RAW_MAX
  const compass_score = Math.round((totalEarned / effectiveMax) * 100)

  // Fill in any missing core sections with zeros
  const allSections: AssessmentSection[] = Object.keys(SECTION_MAX) as AssessmentSection[]
  for (const sec of allSections) {
    if (!sectionScores[sec]) {
      sectionScores[sec] = { earned: 0, max: SECTION_MAX[sec] }
    }
  }

  return {
    compass_score,
    maturity_level: scoreToMaturityLevel(compass_score),
    risk_tier: scoreToRiskTier(compass_score),
    raw_score: totalEarned,
    max_raw_score: effectiveMax,
    section_scores: sectionScores as Record<AssessmentSection, { earned: number; max: number }>,
  }
}
