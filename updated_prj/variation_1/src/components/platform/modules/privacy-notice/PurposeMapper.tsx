'use client'

import { Plus, Trash2 } from 'lucide-react'
import { DATA_CATEGORIES, DPDP_BASES } from '@/lib/platform/constants'
import type { NoticePurposeMapping } from '@/types/dpdp'

interface Props {
  mappings: NoticePurposeMapping[]
  onChange: (mappings: NoticePurposeMapping[]) => void
}

export function PurposeMapper({ mappings, onChange }: Props) {
  function add() {
    onChange([...mappings, { data_category: '', purpose: '', basis: 'consent_s6' }])
  }

  function update(idx: number, partial: Partial<NoticePurposeMapping>) {
    const updated = mappings.map((m, i) => (i === idx ? { ...m, ...partial } : m))
    onChange(updated)
  }

  function remove(idx: number) {
    onChange(mappings.filter((_, i) => i !== idx))
  }

  return (
    <div className="space-y-4">
      {mappings.map((m, idx) => (
        <div key={idx} className="space-y-3 rounded-lg border border-line p-3 sm:p-4">
          <div className="flex items-start justify-between gap-2">
            <input
              value={m.purpose}
              onChange={e => update(idx, { purpose: e.target.value })}
              placeholder="Processing purpose, e.g. Marketing communications"
              aria-label={`Processing purpose ${idx + 1}`}
              className="min-w-0 flex-1 border-b border-line bg-transparent pb-2 text-sm font-medium focus:border-accent focus:outline-none"
            />
            <button
              type="button"
              onClick={() => remove(idx)}
              aria-label={`Remove purpose ${idx + 1}`}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-text-faint transition-colors hover:bg-red/10 hover:text-red"
            >
              <Trash2 size={15} />
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block min-w-0 text-xs font-medium text-text-muted">
              Data category
              <select
                value={m.data_category}
                onChange={e => update(idx, { data_category: e.target.value })}
                className="mt-1 min-h-11 w-full rounded-lg border border-line bg-bg-2 px-3 py-2 text-sm text-text focus:outline-none focus:ring-1 focus:ring-accent"
              >
                <option value="">Select a category</option>
                {DATA_CATEGORIES.map(category => (
                  <option key={category.key} value={category.key}>{category.label}</option>
                ))}
              </select>
            </label>

            <label className="block min-w-0 text-xs font-medium text-text-muted">
              Legal basis
              <select
                value={m.basis}
                onChange={e => update(idx, { basis: e.target.value })}
                className="mt-1 min-h-11 w-full rounded-lg border border-line bg-bg-2 px-3 py-2 text-sm text-text focus:outline-none focus:ring-1 focus:ring-accent"
              >
                {DPDP_BASES.map(basis => <option key={basis.id} value={basis.id}>{basis.label}</option>)}
              </select>
            </label>
          </div>
        </div>
      ))}
      <button
        onClick={add}
        type="button"
        className="inline-flex items-center gap-1.5 text-sm text-brand hover:text-accent font-medium"
      >
        <Plus size={15} /> Add purpose mapping
      </button>
    </div>
  )
}

export default PurposeMapper
