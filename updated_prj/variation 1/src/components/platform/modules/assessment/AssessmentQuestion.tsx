'use client'

import type { AssessmentQuestion } from '@/types/dpdp'
import { cn } from '@/lib/cn'

interface AssessmentQuestionProps {
  question: AssessmentQuestion
  value: string
  onChange: (value: string) => void
}

const YES_NO_OPTIONS = [
  { value: 'yes',     label: 'Yes',     desc: 'Fully implemented',        color: 'green' },
  { value: 'partial', label: 'Partial', desc: 'Partially implemented',    color: 'yellow' },
  { value: 'no',      label: 'No',      desc: 'Not yet implemented',      color: 'red' },
]

const COLOR_STYLES: Record<string, { base: string; selected: string }> = {
  green:  { base: 'border-line hover:border-green/40', selected: 'border-green bg-green/10 ring-1 ring-green/40' },
  yellow: { base: 'border-line hover:border-amber/40', selected: 'border-amber bg-amber/10 ring-1 ring-amber/40' },
  red:    { base: 'border-line hover:border-red/40', selected: 'border-red bg-red/10 ring-1 ring-red/40' },
}

const LABEL_COLOR: Record<string, string> = {
  green:  'text-green',
  yellow: 'text-amber',
  red:    'text-red',
}

export default function AssessmentQuestionCard({ question, value, onChange }: AssessmentQuestionProps) {
  if (question.type === 'text') {
    return (
      <div className="platform-panel rounded-xl border border-line bg-bg-2 p-5 shadow-sm">
        <p className="text-sm font-semibold text-text mb-1">{question.text}</p>
        {question.hint && (
          <p className="text-xs text-text-faint mb-3">{question.hint}</p>
        )}
        <input
          type="text"
          aria-label={question.text}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="Type your answer here…"
          className="module-field"
        />
      </div>
    )
  }

  if (question.type === 'select' && question.options) {
    return (
      <div className="platform-panel rounded-xl border border-line bg-bg-2 p-5 shadow-sm">
        <p className="text-sm font-semibold text-text mb-1">{question.text}</p>
        {question.hint && (
          <p className="text-xs text-text-faint mb-3">{question.hint}</p>
        )}
        <select
          aria-label={question.text}
          value={value}
          onChange={e => onChange(e.target.value)}
          className="module-field"
        >
          <option value="">Select an option</option>
          {question.options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
    )
  }

  // yes_no_partial
  return (
    <div className="platform-panel rounded-xl border border-line bg-bg-2 p-5 shadow-sm">
      <p className="text-sm font-semibold text-text mb-1">{question.text}</p>
      {question.hint && (
        <p className="text-xs text-text-faint mb-3">{question.hint}</p>
      )}
      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
        {YES_NO_OPTIONS.map(opt => {
          const isSelected = value === opt.value
          const style = COLOR_STYLES[opt.color]
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={cn(
                'flex min-h-11 flex-col items-center justify-center rounded-lg border-2 p-3 text-center transition-all',
                isSelected ? style.selected : style.base
              )}
            >
              <span className={cn('text-sm font-semibold', isSelected ? LABEL_COLOR[opt.color] : 'text-text')}>
                {opt.label}
              </span>
              <span className={cn('mt-0.5 text-xs', isSelected ? LABEL_COLOR[opt.color] : 'text-text-faint')}>
                {opt.desc}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
