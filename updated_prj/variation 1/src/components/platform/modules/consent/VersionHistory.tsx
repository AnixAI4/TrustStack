'use client'

import { useState } from 'react'
import { Clock, ChevronDown, ChevronUp } from 'lucide-react'
import { ConsentConfigVersion } from '@/types/dpdp'
import { ModuleEmptyState } from '@/components/platform/ui/ModuleStatGrid'

interface Props {
  versions: ConsentConfigVersion[]
  current: ConsentConfigVersion | null
  onRestore?: (version: ConsentConfigVersion) => void
}

function fmtDate(d: string): string {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function VersionHistory({ versions, current, onRestore }: Props) {
  const [expanded, setExpanded] = useState(false)
  const display = expanded ? versions : versions.slice(0, 3)

  if (!versions.length) {
    return (
      <ModuleEmptyState
        icon={<Clock className="h-5 w-5" />}
        title="No version history yet"
        description="Publish your first consent configuration to start a versioned audit trail."
        className="py-9"
      />
    )
  }

  return (
    <div className="divide-y divide-line overflow-hidden rounded-lg border border-line">
      {display.map(v => {
        const isCurrent = current?.id === v.id
        return (
          <div key={v.id} className="flex flex-wrap items-center gap-3 px-4 py-3 sm:flex-nowrap">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-surface-2 flex items-center justify-center text-xs font-semibold text-text-muted">
              {v.version}
            </div>
            <div className="flex-1 text-sm">
              <p className={`font-medium ${isCurrent ? 'text-accent' : 'text-text'}`}>
                v{v.version} {isCurrent && <span className="text-xs text-green">● Live</span>}
              </p>
              <p className="text-xs text-text-faint flex items-center gap-1 mt-0.5">
                <Clock size={11} /> {fmtDate(v.created_at)}
              </p>
            </div>
            {onRestore && !isCurrent && (
              <button
                type="button"
                onClick={() => onRestore(v)}
                className="ml-11 min-h-10 text-xs font-medium text-brand underline underline-offset-2 hover:text-accent sm:ml-0"
              >
                Restore
              </button>
            )}
          </div>
        )
      })}
      {versions.length > 3 && (
        <button
          type="button"
          onClick={() => setExpanded(e => !e)}
          className="flex min-h-11 w-full items-center justify-center gap-1 py-2 text-xs font-medium text-text-muted hover:text-text"
        >
          {expanded ? <><ChevronUp size={13} /> Show less</> : <><ChevronDown size={13} /> Show all ({versions.length})</>}
        </button>
      )}
    </div>
  )
}
