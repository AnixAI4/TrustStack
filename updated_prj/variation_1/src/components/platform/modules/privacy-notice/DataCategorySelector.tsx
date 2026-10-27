'use client'

import { DATA_CATEGORIES, DATA_CATEGORY_GROUPS } from '@/lib/platform/constants'

interface Props {
  selected: string[]
  onChange: (selected: string[]) => void
}

export function DataCategorySelector({ selected, onChange }: Props) {
  function toggle(key: string) {
    onChange(selected.includes(key) ? selected.filter(k => k !== key) : [...selected, key])
  }

  function selectGroup(group: string) {
    const keys = DATA_CATEGORIES.filter(c => c.group === group).map(c => c.key)
    const allSelected = keys.every(k => selected.includes(k))
    if (allSelected) {
      onChange(selected.filter(k => !keys.includes(k)))
    } else {
      onChange([...new Set([...selected, ...keys])])
    }
  }

  return (
    <div className="border border-line rounded-lg p-3 max-h-64 overflow-y-auto space-y-4">
      {DATA_CATEGORY_GROUPS.map(group => {
        const cats = DATA_CATEGORIES.filter(c => c.group === group)
        if (!cats.length) return null
        const allSelected = cats.every(c => selected.includes(c.key))
        return (
          <div key={group}>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">{group}</p>
              <button
                type="button"
                onClick={() => selectGroup(group)}
                className="text-xs text-brand hover:text-accent"
              >
                {allSelected ? 'Deselect all' : 'Select all'}
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {cats.map(cat => {
                const isSelected = selected.includes(cat.key)
                return (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => toggle(cat.key)}
                    className={`px-2 py-0.5 rounded-full text-xs font-medium transition-colors ${
                      isSelected
                        ? 'bg-accent text-white'
                        : 'bg-surface-2 text-text-muted hover:bg-surface-2'
                    }`}
                  >
                    {cat.label}
                    {cat.sensitive && <span className="ml-0.5 text-amber-300">●</span>}
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default DataCategorySelector
