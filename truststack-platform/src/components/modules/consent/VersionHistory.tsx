'use client'

import { useEffect, useState } from 'react'
import { History, Lock, Globe, Layout, Palette } from 'lucide-react'
import { ConsentConfigVersion } from '@/types/dpdp'

interface VersionsResponse {
  versions: ConsentConfigVersion[]
  available: boolean
}

export default function VersionHistory() {
  const [data, setData] = useState<VersionsResponse | null>(null)
  const [currentVersion, setCurrentVersion] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/consent/versions').then(r => r.json()),
      fetch('/api/consent/manage').then(r => r.json()),
    ]).then(([versions, manage]) => {
      if (!versions.error) setData(versions)
      if (manage?.config?.widget_version) setCurrentVersion(manage.config.widget_version)
    }).finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2].map(i => <div key={i} className="h-40 bg-gray-100 rounded-xl animate-pulse" />)}
      </div>
    )
  }

  // Table not created yet
  if (data && data.available === false) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-sm text-amber-800">
        <p className="font-medium mb-1">Version history not enabled yet</p>
        <p className="text-amber-700">
          Run <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono text-xs">db/consent_config_versions.sql</code> in
          your Supabase SQL Editor to start capturing an immutable snapshot of every config version.
        </p>
      </div>
    )
  }

  if (!data || data.versions.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center text-gray-400 text-sm">
        No version snapshots yet. They&apos;ll appear here each time you save your consent configuration.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {data.versions.map(v => {
        const isCurrent = v.version === currentVersion
        const color = v.primary_color.startsWith('#') ? v.primary_color : `#${v.primary_color}`
        return (
          <div key={v.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gray-50/60">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-[#003366]" />
                <span className="font-semibold text-[#1A1A2E]">Version {v.version}</span>
                {isCurrent && (
                  <span className="text-xs font-medium text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                    Current
                  </span>
                )}
              </div>
              <span className="text-xs text-gray-400">
                {new Date(v.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            <div className="p-5 space-y-4">
              {/* Settings row */}
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-gray-600">
                <span className="flex items-center gap-1.5"><Layout className="w-3.5 h-3.5 text-gray-400" />{v.position}</span>
                <span className="flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-gray-400" />
                  <span className="inline-block w-3 h-3 rounded-sm border border-gray-200" style={{ backgroundColor: color }} />
                  {color}
                </span>
                <span className="flex items-center gap-1.5"><Globe className="w-3.5 h-3.5 text-gray-400" />{v.languages.map(l => l.toUpperCase()).join(', ')}</span>
                <span>Reject All: {v.show_reject_all ? 'Yes' : 'No'}</span>
                <span>Age check: {v.require_age_confirmation ? 'Yes' : 'No'}</span>
              </div>

              {/* Purposes snapshot */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  {v.purposes.length} purpose{v.purposes.length !== 1 ? 's' : ''}
                </p>
                <div className="space-y-1.5">
                  {v.purposes.map(p => (
                    <div key={p.purpose_key} className="flex items-center gap-2 text-sm">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${p.required ? 'bg-amber-500' : 'bg-green-500'}`} />
                      <span className="text-[#1A1A2E]">{p.name_en}</span>
                      <span className="text-gray-300">·</span>
                      <span className="text-gray-400 font-mono text-xs">{p.purpose_key}</span>
                      {p.required && (
                        <span className="flex items-center gap-1 text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-full border border-amber-200">
                          <Lock className="w-2.5 h-2.5" />Required
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
