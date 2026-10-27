'use client'

import { useState } from 'react'
import { CheckCircle, ChevronLeft, ChevronRight, ShieldCheck } from 'lucide-react'
import {
  VENDOR_QUESTION_SECTIONS,
  vendorQuestionsForSection,
  type VendorQuestion,
} from '@/lib/vendors/questionnaire'

interface Props {
  token: string
  vendorName: string
  orgName: string
}

const YN: { value: string; label: string }[] = [
  { value: 'yes', label: 'Yes' },
  { value: 'no',  label: 'No' },
]
const YNP: { value: string; label: string }[] = [
  { value: 'yes',     label: 'Yes' },
  { value: 'partial', label: 'Partially' },
  { value: 'no',      label: 'No' },
]

export function PublicVendorQuestionnaire({ token, vendorName, orgName }: Props) {
  const sections = VENDOR_QUESTION_SECTIONS
  const [step, setStep]         = useState(0)
  const [answers, setAnswers]   = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [done, setDone]         = useState(false)

  const section = sections[step]
  const questions = vendorQuestionsForSection(section.key)
  const isLast = step === sections.length - 1

  function setAnswer(id: string, value: string) {
    setAnswers(prev => ({ ...prev, [id]: value }))
  }

  // Every scorable (weight > 0) question in the current section must be answered.
  function sectionComplete(): boolean {
    return questions.filter(q => q.weight > 0).every(q => answers[q.id])
  }

  function next() {
    if (!sectionComplete()) { setError('Please answer all questions in this section before continuing.'); return }
    setError(null)
    setStep(s => Math.min(sections.length - 1, s + 1))
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function back() {
    setError(null)
    setStep(s => Math.max(0, s - 1))
  }

  async function submit() {
    if (!sectionComplete()) { setError('Please answer all questions in this section before submitting.'); return }
    setSubmitting(true)
    setError(null)
    try {
      const payload = Object.entries(answers).map(([question_id, answer]) => ({ question_id, answer }))
      const res = await fetch('/api/vendors/questionnaire/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, answers: payload }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'Submission failed. Please try again.'); return }
      setDone(true)
      if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch {
      setError('Network error — please check your connection and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
          <CheckCircle className="text-green-600" size={32} />
        </div>
        <h2 className="text-xl font-bold text-[#003366] mb-2">Thank you</h2>
        <p className="text-gray-600 max-w-md mx-auto">
          Your responses have been submitted to <strong>{orgName}</strong>. No further action is needed —
          they will be in touch about the Data Processing Agreement for <strong>{vendorName}</strong>.
        </p>
      </div>
    )
  }

  const answeredCount = Object.keys(answers).length

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div>
        <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
          <span className="font-semibold text-[#003366]">{section.label}</span>
          <span>Section {step + 1} of {sections.length}</span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-[#003366] transition-all" style={{ width: `${((step + 1) / sections.length) * 100}%` }} />
        </div>
        <p className="text-xs text-gray-400 mt-1.5">{section.description}</p>
      </div>

      {/* Questions */}
      <div className="space-y-5">
        {questions.map((q, i) => (
          <QuestionField key={q.id} q={q} index={i} value={answers[q.id] ?? ''} onChange={v => setAnswer(q.id, v)} />
        ))}
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

      {/* Nav */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <button
          type="button"
          onClick={back}
          disabled={step === 0}
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#003366] disabled:opacity-40"
        >
          <ChevronLeft size={15} /> Back
        </button>
        {isLast ? (
          <button
            type="button"
            onClick={submit}
            disabled={submitting}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#003366] text-white text-sm font-semibold rounded-lg hover:bg-[#1A5276] transition-colors disabled:opacity-50"
          >
            {submitting ? 'Submitting…' : 'Submit Questionnaire'}
          </button>
        ) : (
          <button
            type="button"
            onClick={next}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#003366] text-white text-sm font-semibold rounded-lg hover:bg-[#1A5276] transition-colors"
          >
            Next <ChevronRight size={15} />
          </button>
        )}
      </div>

      <p className="text-xs text-center text-gray-400 flex items-center justify-center gap-1">
        <ShieldCheck size={13} /> {answeredCount} answered · your responses are shared only with {orgName}.
      </p>
    </div>
  )
}

function QuestionField({
  q, index, value, onChange,
}: {
  q: VendorQuestion
  index: number
  value: string
  onChange: (v: string) => void
}) {
  const opts =
    q.type === 'select' ? (q.options ?? []).map(o => ({ value: o.value, label: o.label })) :
    q.type === 'yes_no_partial' ? YNP :
    q.type === 'yes_no' ? YN : null

  return (
    <div className="border border-gray-100 rounded-xl p-4">
      <label className="block text-sm font-medium text-gray-800">
        <span className="text-gray-400 mr-1">{index + 1}.</span>{q.text}
      </label>
      {q.hint && <p className="text-xs text-gray-400 mt-1">{q.hint}</p>}

      {q.type === 'text' ? (
        <input
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="Type your answer…"
          className="mt-2 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]"
        />
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">
          {opts!.map(o => (
            <button
              key={o.value}
              type="button"
              onClick={() => onChange(o.value)}
              className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                value === o.value
                  ? 'bg-[#003366] text-white border-[#003366]'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-[#003366]'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
