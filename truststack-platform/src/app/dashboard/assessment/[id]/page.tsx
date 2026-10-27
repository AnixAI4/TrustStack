'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ASSESSMENT_SECTION_ORDER, ASSESSMENT_SECTION_LABELS, INDUSTRY_SECTION_LABELS } from '@/lib/constants'
import { ASSESSMENT_QUESTIONS, getQuestionsBySection, getIndustryQuestions } from '@/lib/assessment-questions'
import AssessmentQuestionCard from '@/components/modules/assessment/AssessmentQuestion'
import AssessmentProgress from '@/components/modules/assessment/AssessmentProgress'
import type { AnswerValue, AssessmentQuestion } from '@/types/dpdp'
import { ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react'

type AnswerMap = Map<string, string>

export default function AssessmentPage() {
  const params = useParams()
  const router = useRouter()
  const assessmentId = params.id as string

  const [sectionIndex, setSectionIndex] = useState(0)
  const [answers, setAnswers] = useState<AnswerMap>(new Map())
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [savingAnswers, setSavingAnswers] = useState<Set<string>>(new Set())
  const debounceTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  // Industry section state — populated after org fetch on mount
  const [industryQuestions, setIndustryQuestions] = useState<AssessmentQuestion[]>([])
  const [effectiveSections, setEffectiveSections] = useState<string[]>([...ASSESSMENT_SECTION_ORDER])
  const [effectiveSectionLabels, setEffectiveSectionLabels] = useState<Record<string, string>>({ ...ASSESSMENT_SECTION_LABELS })

  const coreLength = ASSESSMENT_SECTION_ORDER.length
  const currentSection = effectiveSections[sectionIndex]
  const isIndustrySection = sectionIndex >= coreLength
  const currentQuestions: AssessmentQuestion[] = isIndustrySection
    ? industryQuestions.filter(q => q.section === currentSection)
    : (currentSection ? getQuestionsBySection(currentSection) : [])
  const isLastSection = sectionIndex === effectiveSections.length - 1

  // Count answered questions in current section
  const answeredInSection = currentQuestions.filter(q => {
    const ans = answers.get(q.id)
    return ans !== undefined && ans !== ''
  }).length

  // Load existing answers and org industry on mount
  useEffect(() => {
    async function init() {
      try {
        // Fetch answers and org industry in parallel
        const [answerRes, orgRes] = await Promise.all([
          fetch(`/api/assessment/results/${assessmentId}`),
          fetch('/api/organizations/me'),
        ])
        const [answerData, orgData] = await Promise.all([
          answerRes.json() as Promise<{
            success?: boolean
            data?: {
              assessment: { status: string }
              answers: Array<{ question_id: string; answer: string }>
            }
          }>,
          orgRes.json() as Promise<{
            success?: boolean
            data?: { name: string; industry: string | null; revenue_range: string | null }
          }>,
        ])

        const org = orgData?.data

        // Resolve industry and build effective sections
        const industry: string | null = org?.industry ?? null
        const indQs = getIndustryQuestions(industry)
        setIndustryQuestions(indQs)

        const sections: string[] = [...ASSESSMENT_SECTION_ORDER]
        const labels: Record<string, string> = { ...ASSESSMENT_SECTION_LABELS }
        if (indQs.length > 0) {
          sections.push(indQs[0].section)
          Object.assign(labels, INDUSTRY_SECTION_LABELS)
        }
        setEffectiveSections(sections)
        setEffectiveSectionLabels(labels)

        // Process answers
        if (answerData.success && answerData.data) {
          if (answerData.data.assessment.status === 'completed') {
            router.replace(`/dashboard/assessment/results/${assessmentId}`)
            return
          }

          const map = new Map<string, string>()
          for (const a of answerData.data.answers) {
            map.set(a.question_id, a.answer)
          }

          // Pre-fill Section 1 from org registration data (only if not already answered)
          const prefills: Array<{ id: string; value: string }> = []
          if (org?.name && !map.has('Q1')) {
            map.set('Q1', org.name)
            prefills.push({ id: 'Q1', value: org.name })
          }
          if (org?.industry && !map.has('Q2')) {
            map.set('Q2', org.industry)
            prefills.push({ id: 'Q2', value: org.industry })
          }
          if (org?.revenue_range && !map.has('Q3')) {
            map.set('Q3', org.revenue_range)
            prefills.push({ id: 'Q3', value: org.revenue_range })
          }

          setAnswers(map)

          // Persist pre-fills to the backend (fire and forget)
          for (const pf of prefills) {
            fetch('/api/assessment/save-answer', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                assessment_id: assessmentId,
                question_id: pf.id,
                answer: pf.value,
              }),
            })
          }

          // Resume at the first section that has unanswered questions
          for (let i = 0; i < sections.length; i++) {
            const sec = sections[i]
            const sectionQs = i >= ASSESSMENT_SECTION_ORDER.length
              ? indQs.filter(q => q.section === sec)
              : getQuestionsBySection(sec)
            const allAnswered = sectionQs.every(q => map.has(q.id) && map.get(q.id) !== '')
            if (!allAnswered) {
              setSectionIndex(i)
              break
            }
          }
        }
      } catch {
        // Proceed with empty answers and default (core) sections if fetch fails
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [assessmentId, router])

  const saveAnswer = useCallback(async (questionId: string, answer: string) => {
    setSavingAnswers(prev => new Set(prev).add(questionId))
    try {
      await fetch('/api/assessment/save-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assessment_id: assessmentId,
          question_id: questionId,
          answer,
        }),
      })
    } finally {
      setSavingAnswers(prev => {
        const next = new Set(prev)
        next.delete(questionId)
        return next
      })
    }
  }, [assessmentId])

  function handleAnswerChange(questionId: string, value: AnswerValue) {
    setAnswers(prev => {
      const next = new Map(prev)
      next.set(questionId, value)
      return next
    })

    // Debounce save: 400ms after last change
    const existing = debounceTimers.current.get(questionId)
    if (existing) clearTimeout(existing)

    const timer = setTimeout(() => {
      saveAnswer(questionId, value)
      debounceTimers.current.delete(questionId)
    }, 400)
    debounceTimers.current.set(questionId, timer)
  }

  function handleNext() {
    if (sectionIndex < effectiveSections.length - 1) {
      setSectionIndex(s => s + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  function handleBack() {
    if (sectionIndex > 0) {
      setSectionIndex(s => s - 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  async function handleSubmit() {
    // Flush any pending debounced saves
    for (const [questionId, timer] of debounceTimers.current.entries()) {
      clearTimeout(timer)
      const answer = answers.get(questionId)
      if (answer !== undefined) {
        await saveAnswer(questionId, answer)
      }
    }
    debounceTimers.current.clear()

    setSubmitting(true)
    try {
      const res = await fetch('/api/assessment/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assessment_id: assessmentId }),
      })
      const data = await res.json() as { success?: boolean; data?: { id: string } }

      if (data.success) {
        router.push(`/dashboard/assessment/results/${assessmentId}`)
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#003366] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">Loading assessment…</p>
        </div>
      </div>
    )
  }

  // Total scorable questions answered (for overall progress display — includes industry Qs)
  const allScorable = [...ASSESSMENT_QUESTIONS, ...industryQuestions].filter(q => q.scorable)
  const totalScorableQuestions = allScorable.length
  const answeredScorable = allScorable.filter(q => answers.has(q.id) && answers.get(q.id) !== '').length

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Progress header */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <AssessmentProgress
          currentSectionIndex={sectionIndex}
          answeredInSection={answeredInSection}
          totalInSection={currentQuestions.length}
          totalSections={effectiveSections.length}
          sectionLabel={currentSection ? (effectiveSectionLabels[currentSection] ?? '') : ''}
        />
        <p className="text-xs text-gray-400 mt-2">
          {answeredScorable} of {totalScorableQuestions} scored questions answered
          {savingAnswers.size > 0 && (
            <span className="ml-2 text-[#2874A6]">· Saving…</span>
          )}
        </p>
      </div>

      {/* Section header */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
          Section {sectionIndex + 1} of {effectiveSections.length}
        </p>
        <h1 className="text-xl font-bold text-[#003366]">
          {currentSection ? (effectiveSectionLabels[currentSection] ?? '') : ''}
        </h1>
        {currentSection === 'org_profile' && (
          <p className="text-sm text-gray-500 mt-1">
            These questions help us calibrate your assessment. They don&apos;t affect your score.
          </p>
        )}
        {isIndustrySection && (
          <p className="text-sm text-gray-500 mt-1">
            These questions cover regulatory obligations specific to your industry. Answers contribute to your Compass Score.
          </p>
        )}
      </div>

      {/* Questions */}
      <div className="space-y-3">
        {currentQuestions.map(question => (
          <AssessmentQuestionCard
            key={question.id}
            question={question}
            value={answers.get(question.id) ?? ''}
            onChange={value => handleAnswerChange(question.id, value)}
          />
        ))}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-2 pb-8">
        <button
          onClick={handleBack}
          disabled={sectionIndex === 0}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>

        {isLastSection ? (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex items-center gap-2 bg-[#003366] text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#1A5276] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <CheckCircle className="w-4 h-4" />
            {submitting ? 'Submitting…' : 'Submit Assessment'}
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="flex items-center gap-1.5 bg-[#003366] text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#1A5276] transition-colors"
          >
            Continue
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}
