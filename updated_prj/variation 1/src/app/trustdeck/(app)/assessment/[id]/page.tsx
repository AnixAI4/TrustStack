'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ASSESSMENT_SECTION_ORDER, ASSESSMENT_SECTION_LABELS, INDUSTRY_SECTION_LABELS } from '@/lib/platform/constants'
import { ASSESSMENT_QUESTIONS, getQuestionsBySection, getIndustryQuestions } from '@/lib/platform/assessment-questions'
import AssessmentQuestionCard from '@/components/platform/modules/assessment/AssessmentQuestion'
import AssessmentProgress from '@/components/platform/modules/assessment/AssessmentProgress'
import type { AnswerValue, AssessmentQuestion } from '@/types/dpdp'
import { ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react'
import { ModuleDetailNotFound, ModuleDetailSkeleton } from '@/components/platform/ui/ModuleDetailState'
import { usePlatformOrg } from '@/contexts/PlatformOrgContext'

type AnswerMap = Map<string, string>

export default function AssessmentPage() {
  const params = useParams()
  const router = useRouter()
  const assessmentId = params.id as string
  const org = usePlatformOrg()

  const [sectionIndex, setSectionIndex] = useState(0)
  const [answers, setAnswers] = useState<AnswerMap>(new Map())
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [savingAnswers, setSavingAnswers] = useState<Set<string>>(new Set())
  const debounceTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  // Industry section state - populated after org fetch on mount
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

  // Load existing answers; organization defaults already come from the layout.
  useEffect(() => {
    async function init() {
      try {
        const answerRes = await fetch(`/api/trustdeck/assessment/results/${assessmentId}`)
        const answerData = await answerRes.json() as {
            success?: boolean
            data?: {
              assessment: { status: string }
              answers: Array<{ question_id: string; answer: string }>
            }
          }

        if (!answerData.success || !answerData.data) {
          setNotFound(true)
          return
        }

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
        if (answerData.data) {
          if (answerData.data.assessment.status === 'completed') {
            router.replace(`/trustdeck/assessment/results/${assessmentId}`)
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
            fetch('/api/trustdeck/assessment/save-answer', {
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
        setNotFound(true)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [assessmentId, org, router])

  const saveAnswer = useCallback(async (questionId: string, answer: string) => {
    setSavingAnswers(prev => new Set(prev).add(questionId))
    try {
      await fetch('/api/trustdeck/assessment/save-answer', {
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
      const res = await fetch('/api/trustdeck/assessment/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assessment_id: assessmentId }),
      })
      const data = await res.json() as { success?: boolean; data?: { id: string } }

      if (data.success) {
        router.push(`/trustdeck/assessment/results/${assessmentId}`)
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <ModuleDetailSkeleton label="assessment" />
  }

  if (notFound) {
    return (
      <ModuleDetailNotFound
        title="Assessment not found"
        description="This assessment may have been removed, completed in another workspace, or opened from an expired link."
        backHref="/trustdeck/assessment"
        backLabel="Back to assessments"
      />
    )
  }

  // Total scorable questions answered (for overall progress display - includes industry Qs)
  const allScorable = [...ASSESSMENT_QUESTIONS, ...industryQuestions].filter(q => q.scorable)
  const totalScorableQuestions = allScorable.length
  const answeredScorable = allScorable.filter(q => answers.has(q.id) && answers.get(q.id) !== '').length

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Progress header */}
      <div className="overflow-hidden rounded-xl border border-line bg-bg-2 p-5 shadow-card">
        <AssessmentProgress
          currentSectionIndex={sectionIndex}
          answeredInSection={answeredInSection}
          totalInSection={currentQuestions.length}
          totalSections={effectiveSections.length}
          sectionLabel={currentSection ? (effectiveSectionLabels[currentSection] ?? '') : ''}
        />
        <p className="mt-2 text-xs text-text-faint">
          {answeredScorable} of {totalScorableQuestions} scored questions answered
          {savingAnswers.size > 0 && (
            <span className="ml-2 text-brand">· Saving…</span>
          )}
        </p>
      </div>

      {/* Section header */}
      <div>
        <p className="font-mono text-label font-semibold uppercase tracking-[var(--tracking-label)] text-accent">
          Section {sectionIndex + 1} of {effectiveSections.length}
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-text sm:text-[2.1rem]">
          {currentSection ? (effectiveSectionLabels[currentSection] ?? '') : ''}
        </h1>
        {currentSection === 'org_profile' && (
          <p className="mt-1.5 text-sm text-text-muted">
            These questions help us calibrate your assessment. They don&apos;t affect your score.
          </p>
        )}
        {isIndustrySection && (
          <p className="mt-1.5 text-sm text-text-muted">
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
      <div className="flex items-center justify-between gap-3 pb-24 pt-2 sm:pb-8">
        <button
          onClick={handleBack}
          disabled={sectionIndex === 0}
          className="btn btn-ghost inline-flex min-h-11 items-center gap-1.5 disabled:cursor-not-allowed disabled:opacity-30"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </button>

        {isLastSection ? (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="btn btn-accent inline-flex min-h-11 items-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <CheckCircle className="h-4 w-4" />
            {submitting ? 'Submitting…' : 'Submit Assessment'}
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="btn btn-accent inline-flex min-h-11 items-center gap-1.5"
          >
            Continue
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )
}
