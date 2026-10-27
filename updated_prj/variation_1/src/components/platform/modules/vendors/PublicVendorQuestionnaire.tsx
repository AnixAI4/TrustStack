'use client'

import { useState } from 'react'
import { ShieldCheck } from 'lucide-react'
import { VENDOR_QUESTION_SECTIONS, vendorQuestionsForSection, type VendorQuestion } from '@/lib/platform/vendors/questionnaire'

interface Props {
  token: string
  vendorName: string
  orgName: string
}

const inputClass =
  'module-field'

export function PublicVendorQuestionnaire({ token, vendorName, orgName }: Props) {
  const [responses, setResponses] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted]   = useState(false)
  const [error, setError]           = useState<string | null>(null)

  function update(key: string, value: string) {
    setResponses(prev => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const response = await fetch('/api/trustdeck/vendors/questionnaire/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          answers: Object.entries(responses).map(([question_id, answer]) => ({ question_id, answer })),
        }),
      })
      const result = await response.json() as { error?: string }
      if (!response.ok) throw new Error(result.error || 'Could not submit the questionnaire.')
      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred - please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="max-w-md mx-auto text-center py-12">
        <div className="w-14 h-14 rounded-full bg-green/10 flex items-center justify-center mx-auto mb-4">
          <ShieldCheck className="h-7 w-7 text-green" />
        </div>
        <h2 className="font-display text-xl font-semibold tracking-tight text-text">Thank You</h2>
        <p className="text-sm text-text-muted mt-2">
          Your questionnaire response has been submitted. The requesting organisation will review your answers.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-6 sm:space-y-8">
      <div className="text-center">
        <h1 className="font-display text-xl font-semibold tracking-tight text-text sm:text-2xl">Vendor Security Questionnaire</h1>
        <p className="text-sm text-text-muted mt-2">
          <span className="font-medium text-text">{orgName}</span> requested this assessment for{' '}
          <span className="font-medium text-text">{vendorName}</span>.
        </p>
      </div>

      {VENDOR_QUESTION_SECTIONS.map(section => {
        const questions = vendorQuestionsForSection(section.key)
        return (
          <section key={section.key} className="rounded-xl border border-line bg-bg-2 shadow-card p-4 sm:p-6">
            <div className="mb-4">
              <h2 className="font-mono text-label font-semibold uppercase tracking-[var(--tracking-label)] text-accent">{section.label}</h2>
              <p className="mt-1 text-xs leading-relaxed text-text-faint">{section.description}</p>
            </div>
            <div className="space-y-4">
              {questions.map((q: VendorQuestion) => (
                <div key={q.id}>
                  <label htmlFor={`vendor-question-${q.id}`} className="block text-sm font-medium text-text mb-1">
                    {q.text}
                    {q.weight > 0 && <span className="text-red ml-0.5">*</span>}
                  </label>
                  {q.type === 'select' && q.options ? (
                    <select
                      id={`vendor-question-${q.id}`}
                      value={responses[q.id] ?? ''}
                      onChange={e => update(q.id, e.target.value)}
                      required={q.weight > 0}
                      className={inputClass}
                    >
                      <option value="">Select…</option>
                      {q.options.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  ) : q.type === 'yes_no' || q.type === 'yes_no_partial' ? (
                    <select
                      id={`vendor-question-${q.id}`}
                      value={responses[q.id] ?? ''}
                      onChange={e => update(q.id, e.target.value)}
                      required={q.weight > 0}
                      className={inputClass}
                    >
                      <option value="">Select…</option>
                      <option value="yes">Yes</option>
                      {q.type === 'yes_no_partial' && <option value="partial">Partially</option>}
                      <option value="no">No</option>
                    </select>
                  ) : (
                    <input
                      id={`vendor-question-${q.id}`}
                      type="text"
                      value={responses[q.id] ?? ''}
                      onChange={e => update(q.id, e.target.value)}
                      placeholder={q.hint}
                      required={q.weight > 0}
                      className={inputClass}
                    />
                  )}
                  {q.hint && <p className="text-xs text-text-faint mt-1">{q.hint}</p>}
                </div>
              ))}
            </div>
          </section>
        )
      })}

      {error && <p className="text-sm text-red bg-red/10 border border-red/30 rounded-lg px-3 py-2">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="btn btn-accent w-full min-h-11 disabled:opacity-50"
      >
        {submitting ? 'Submitting…' : 'Submit Questionnaire'}
      </button>
    </form>
  )
}
