'use client'

import { History, Globe, CheckCircle2 } from 'lucide-react'
import { NOTICE_LANGUAGES } from '@/lib/constants'
import type { PrivacyNoticeVersion } from '@/types/dpdp'

interface Props {
  versions: PrivacyNoticeVersion[]
  currentVersionId: string | null
}

function langsIn(v: PrivacyNoticeVersion): string[] {
  const row = v as unknown as Record<string, string | null>
  return NOTICE_LANGUAGES.filter(l => !!row[l.column]).map(l => l.code.toUpperCase())
}

export default function VersionHistory({ versions, currentVersionId }: Props) {
  if (versions.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-10 text-center text-gray-400 text-sm">
        No versions yet. Each time you save a notice, an immutable snapshot appears here.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {versions.map(v => {
        const isCurrent = v.id === currentVersionId
        return (
          <div key={v.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gray-50/60">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-[#003366]" />
                <span className="font-semibold text-[#1A1A2E]">Version {v.version_number}</span>
                {isCurrent && (
                  <span className="flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3 h-3" /> Published
                  </span>
                )}
              </div>
              <span className="text-xs text-gray-400">
                {new Date(v.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <div className="p-5 space-y-3">
              {v.change_summary && (
                <p className="text-sm text-gray-600">{v.change_summary}</p>
              )}
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-gray-600">
                <span className="flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-gray-400" />
                  {langsIn(v).join(', ')}
                </span>
                <span>Grievance Officer: <span className="text-[#1A1A2E]">{v.grievance_officer_name}</span></span>
                {v.published_at && (
                  <span>Published {new Date(v.published_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
