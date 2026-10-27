'use client'

import type { AssessmentQuestion } from '@/types/dpdp'
import { cn } from '@/lib/utils'

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
  green:  { base: 'border-gray-200 hover:border-green-300',  selected: 'border-green-500 bg-green-50 ring-1 ring-green-500' },
  yellow: { base: 'border-gray-200 hover:border-yellow-300', selected: 'border-yellow-500 bg-yellow-50 ring-1 ring-yellow-500' },
  red:    { base: 'border-gray-200 hover:border-red-300',    selected: 'border-red-500 bg-red-50 ring-1 ring-red-500' },
}

const LABEL_COLOR: Record<string, string> = {
  green:  'text-green-700',
  yellow: 'text-yellow-700',
  red:    'text-red-700',
}

export default function AssessmentQuestionCard({ question, value, onChange }: AssessmentQuestionProps) {
  if (question.type === 'text') {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <p className="text-sm font-semibold text-gray-900 mb-1">{question.text}</p>
        {question.hint && (
          <p className="text-xs text-gray-400 mb-3">{question.hint}</p>
        )}
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="Type your answer here…"
          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#003366]/20 focus:border-[#003366] transition-colors"
        />
      </div>
    )
  }

  if (question.type === 'select' && question.options) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <p className="text-sm font-semibold text-gray-900 mb-1">{question.text}</p>
        {question.hint && (
          <p className="text-xs text-gray-400 mb-3">{question.hint}</p>
        )}
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#003366]/20 focus:border-[#003366] transition-colors bg-white"
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
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <p className="text-sm font-semibold text-gray-900 mb-1">{question.text}</p>
      {question.hint && (
        <p className="text-xs text-gray-400 mb-3">{question.hint}</p>
      )}
      <div className="grid grid-cols-3 gap-2 mt-3">
        {YES_NO_OPTIONS.map(opt => {
          const isSelected = value === opt.value
          const style = COLOR_STYLES[opt.color]
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={cn(
                'flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all text-center',
                isSelected ? style.selected : style.base
              )}
            >
              <span className={cn('text-sm font-semibold', isSelected ? LABEL_COLOR[opt.color] : 'text-gray-700')}>
                {opt.label}
              </span>
              <span className={cn('text-[10px] mt-0.5', isSelected ? LABEL_COLOR[opt.color] : 'text-gray-400')}>
                {opt.desc}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
