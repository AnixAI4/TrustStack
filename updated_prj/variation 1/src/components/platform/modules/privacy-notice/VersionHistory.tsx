'use client'

import { useState } from 'react'
import { Clock, ChevronDown, ChevronUp, Globe, FileText } from 'lucide-react'
import { NOTICE_LANGUAGES } from '@/lib/platform/constants'
import { ModuleEmptyState } from '@/components/platform/ui/ModuleStatGrid'
import type { PrivacyNoticeVersion } from '@/types/dpdp'

interface Props {
  versions: PrivacyNoticeVersion[]
  currentVersionId: string | null
  onRestore?: (version: PrivacyNoticeVersion) => void
}

function fmtDate(d: string): string {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function versionLanguages(version: PrivacyNoticeVersion): string {
  return NOTICE_LANGUAGES
    .filter(language => {
      const content = version[language.column as keyof PrivacyNoticeVersion]
      return typeof content === 'string' && content.trim().length > 0
    })
    .map(language => language.name)
    .join(', ')
}

export function VersionHistory({ versions, currentVersionId, onRestore }: Props) {
  const [expanded, setExpanded] = useState(false)
  const display = expanded ? versions : versions.slice(0, 3)

  if (!versions.length) {
    return (
      <ModuleEmptyState
        icon={<FileText className="h-5 w-5" />}
        title="No published versions yet"
        description="Publish your first privacy notice to start version history."
        className="py-10"
      />
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-line divide-y divide-line">
      {display.map(v => {
        const isCurrent = currentVersionId === v.id
        return (
          <div key={v.id} className="flex flex-wrap items-center gap-3 px-4 py-3 sm:flex-nowrap">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-surface-2 text-xs font-semibold text-text-muted">
              {v.version_number}
            </div>
            <div className="min-w-0 flex-1 text-sm">
              <p className={`font-medium ${isCurrent ? 'text-accent' : 'text-text'}`}>
                v{v.version_number}{' '}
                {isCurrent && (
                  <span className="ml-1 inline-flex items-center gap-1 text-xs font-medium text-green">
                    <span className="h-1.5 w-1.5 rounded-full bg-green" /> Live
                  </span>
                )}
              </p>
              <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-text-faint">
                <span className="flex items-center gap-1"><Clock size={11} /> {fmtDate(v.published_at ?? v.created_at)}</span>
                <span className="flex min-w-0 items-center gap-1"><Globe size={11} /> <span className="truncate">{versionLanguages(v)}</span></span>
              </p>
            </div>
            {onRestore && !isCurrent && (
              <button
                type="button"
                onClick={() => onRestore(v)}
                className="ml-11 min-h-10 text-xs font-medium text-accent underline underline-offset-2 hover:text-accent sm:ml-0"
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
