'use client'

import { useState } from 'react'
import { GripVertical, Plus, Trash2 } from 'lucide-react'
import { DPDP_BASES } from '@/lib/platform/constants'

export interface Purpose {
  purpose_key: string
  name_en: string
  name_hi?: string | null
  name_ta?: string | null
  name_te?: string | null
  description_en: string
  required: boolean
  dpdp_basis: string
}

interface Props {
  purposes: Purpose[]
  onChange: (purposes: Purpose[]) => void
}

function genPurposeKey() {
  return 'p_' + Math.random().toString(36).slice(2, 9)
}

export function PurposeEditor({ purposes, onChange }: Props) {
  const [dragIdx, setDragIdx] = useState<number | null>(null)

  function add() {
    onChange([
      ...purposes,
      {
        purpose_key: genPurposeKey(),
        name_en: '',
        name_hi: '',
        name_ta: '',
        name_te: '',
        description_en: '',
        required: false,
        dpdp_basis: 'consent_s6',
      },
    ])
  }

  function update(idx: number, partial: Partial<Purpose>) {
    const updated = purposes.map((p, i) => {
      if (i !== idx) return p
      const next = { ...p, ...partial }
      if ('name_en' in partial && !next.description_en?.trim()) {
        next.description_en = partial.name_en ?? next.name_en
      }
      return next
    })
    onChange(updated)
  }

  function remove(idx: number) {
    onChange(purposes.filter((_, i) => i !== idx))
  }

  function handleDragStart(idx: number) {
    setDragIdx(idx)
  }

  function handleDrop(targetIdx: number) {
    if (dragIdx === null || dragIdx === targetIdx) {
      setDragIdx(null)
      return
    }
    const reordered = [...purposes]
    const [moved] = reordered.splice(dragIdx, 1)
    reordered.splice(targetIdx, 0, moved)
    onChange(reordered)
    setDragIdx(null)
  }

  return (
    <div className="space-y-3">
      {purposes.map((p, idx) => (
        <div
          key={p.purpose_key || `purpose-${idx}`}
          draggable
          onDragStart={() => handleDragStart(idx)}
          onDragOver={e => e.preventDefault()}
          onDrop={() => handleDrop(idx)}
          className="flex items-start gap-2 rounded-lg border border-line bg-bg-2 p-3"
        >
          <GripVertical size={16} className="cursor-grab text-text-faint mt-2" />
          <div className="flex-1 space-y-2">
            <input
              value={p.name_en}
              onChange={e => update(idx, { name_en: e.target.value })}
              placeholder="Purpose label, e.g. Marketing communications"
              className="min-h-10 w-full border-b border-line bg-transparent pb-1 text-sm text-text focus:border-accent focus:outline-none"
            />
            <textarea
              value={p.description_en}
              onChange={e => update(idx, { description_en: e.target.value })}
              rows={2}
              placeholder="Explain this purpose in plain language"
              className="w-full resize-y rounded-lg border border-line bg-bg-2 px-3 py-2 text-sm text-text focus:outline-none focus:ring-1 focus:ring-accent"
            />
            <div className="flex flex-col gap-2 text-sm sm:flex-row sm:items-center sm:gap-4">
              <label className="flex min-h-11 items-center gap-1.5 text-text-muted">
                <input
                  type="checkbox"
                  checked={p.required}
                  onChange={e => update(idx, { required: e.target.checked })}
                  className="rounded border-line text-accent focus:ring-accent"
                />
                Required (cannot opt out)
              </label>
              <select
                value={p.dpdp_basis}
                onChange={e => update(idx, { dpdp_basis: e.target.value })}
                className="min-h-11 w-full rounded border border-line bg-bg-2 px-2 py-1 text-xs text-text focus:outline-none focus:ring-1 focus:ring-accent sm:w-auto"
              >
                {DPDP_BASES.map(basis => (
                  <option key={basis.id} value={basis.id}>{basis.label}</option>
                ))}
              </select>
            </div>
          </div>
          <button
            type="button"
            onClick={() => remove(idx)}
            className="mt-0 grid min-h-11 min-w-11 place-items-center text-text-faint hover:text-red sm:mt-2"
            aria-label="Remove purpose"
          >
            <Trash2 size={15} />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-sm font-medium text-brand hover:bg-brand/10 hover:text-accent"
      >
        <Plus size={15} /> Add purpose
      </button>
    </div>
  )
}
