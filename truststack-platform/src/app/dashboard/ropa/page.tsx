'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import {
  Database, ArrowRight, FileCheck2, Clock, ShieldAlert, Plus, Layers,
  FileDown, Sheet, CheckCircle2,
} from 'lucide-react'
import { RopaTable } from '@/components/modules/ropa/RopaTable'
import { RopaEntryForm } from '@/components/modules/ropa/RopaEntryForm'
import { RopaTemplatePicker } from '@/components/modules/ropa/RopaTemplatePicker'
import type { RopaEntry, RopaStats, RopaConsentCoverage } from '@/types/dpdp'

export default function RopaPage() {
  const [stats, setStats]       = useState<RopaStats | null>(null)
  const [entries, setEntries]   = useState<RopaEntry[]>([])
  const [coverage, setCoverage] = useState<Record<string, RopaConsentCoverage>>({})
  const [loading, setLoading]   = useState(true)
  const [showAdd, setShowAdd]   = useState(false)
  const [showTpl, setShowTpl]   = useState(false)
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date())
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const load = useCallback(async () => {
    try {
      const [statsRes, listRes] = await Promise.all([
        fetch('/api/ropa/stats'),
        fetch('/api/ropa?limit=50'),
      ])
      const statsJson = await statsRes.json()
      const listJson  = await listRes.json()
      if (statsJson.success) setStats(statsJson.data as RopaStats)
      if (listJson.success) {
        setEntries(listJson.data as RopaEntry[])
        setCoverage((listJson.coverage as Record<string, RopaConsentCoverage>) ?? {})
      }
    } finally {
      setLoading(false)
      setLastRefreshed(new Date())
    }
  }, [])

  useEffect(() => {
    load()
    intervalRef.current = setInterval(() => { load() }, 30_000)
    const handleVisibility = () => { if (document.visibilityState === 'visible') load() }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [load])

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        {[1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />)}
      </div>
    )
  }

  const hasEntries = entries.length > 0

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#D6E4F0] flex items-center justify-center">
            <Database size={18} className="text-[#003366]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#003366]">ROPA Builder</h1>
            <p className="text-sm text-gray-500">Record of Processing Activities — your DPDP processing inventory</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 hidden sm:inline">
            Updated {lastRefreshed.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
          </span>
          <button onClick={() => setShowTpl(true)} className="inline-flex items-center gap-1.5 px-4 py-2 border border-[#003366] text-[#003366] text-sm font-medium rounded-lg hover:bg-[#D6E4F0] transition-colors">
            <Layers size={15} /> Add from Template
          </button>
          <button onClick={() => setShowAdd(true)} className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#003366] text-white text-sm font-medium rounded-lg hover:bg-[#1A5276] transition-colors">
            <Plus size={15} /> Add Activity
          </button>
        </div>
      </div>

      {/* Consent-gap alert */}
      {stats && stats.consent_gaps > 0 && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <ShieldAlert className="text-amber-500 mt-0.5 shrink-0" size={20} />
          <div>
            <p className="font-semibold text-amber-800">
              {stats.consent_gaps} consent-based {stats.consent_gaps === 1 ? 'activity has' : 'activities have'} no matching consent purpose.
            </p>
            <p className="text-sm text-amber-700 mt-0.5">
              Configure these in <Link href="/dashboard/consent" className="underline font-medium">Consent Management</Link> to close the cross-reference gap.
            </p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Database size={18} />}    label="Total Activities"   value={stats?.total ?? 0}             color="blue" />
        <StatCard icon={<FileCheck2 size={18} />}  label="Active"             value={stats?.active ?? 0}            color="green" />
        <StatCard icon={<Clock size={18} />}       label="Awaiting Approval"  value={stats?.awaiting_approval ?? 0} color={(stats?.awaiting_approval ?? 0) > 0 ? 'amber' : 'green'} />
        <StatCard icon={<ShieldAlert size={18} />} label="Consent Gaps"       value={stats?.consent_gaps ?? 0}      color={(stats?.consent_gaps ?? 0) > 0 ? 'red' : 'green'} />
      </div>

      {stats && stats.consent_based > 0 && (
        <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 border border-gray-100 rounded-lg px-4 py-2.5">
          <CheckCircle2 size={15} className="text-green-500 shrink-0" />
          {stats.consent_configured} of {stats.consent_based} consent-based {stats.consent_based === 1 ? 'activity has' : 'activities have'} a matching consent purpose configured.
        </div>
      )}

      {/* Activities + exports */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h2 className="font-semibold text-[#1A1A2E]">Processing Activities</h2>
          <div className="flex items-center gap-2">
            {hasEntries && (
              <>
                <a href="/api/ropa/export/pdf" className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
                  <FileDown size={14} /> PDF
                </a>
                <a href="/api/ropa/export/csv" className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
                  <Sheet size={14} /> Excel (CSV)
                </a>
              </>
            )}
            <Link href="/dashboard/ropa/list" className="text-sm text-[#003366] hover:underline flex items-center gap-1">
              View all <ArrowRight size={13} />
            </Link>
          </div>
        </div>
        <RopaTable entries={entries.slice(0, 8)} coverage={coverage} />
      </div>

      <RopaEntryForm open={showAdd} onClose={() => setShowAdd(false)} onSaved={() => { setShowAdd(false); load() }} />
      <RopaTemplatePicker
        open={showTpl}
        onClose={() => setShowTpl(false)}
        existingNames={entries.map(e => e.activity_name)}
        onAdded={() => { load() }}
      />
    </div>
  )
}

function StatCard({
  icon, label, value, color,
}: {
  icon: React.ReactNode
  label: string
  value: number | string
  color: 'blue' | 'amber' | 'green' | 'red' | 'purple'
}) {
  const colorMap = {
    blue:   { bg: 'bg-blue-50',   text: 'text-blue-700',   icon: 'text-blue-500' },
    amber:  { bg: 'bg-amber-50',  text: 'text-amber-700',  icon: 'text-amber-500' },
    green:  { bg: 'bg-green-50',  text: 'text-green-700',  icon: 'text-green-500' },
    red:    { bg: 'bg-red-50',    text: 'text-red-700',    icon: 'text-red-500' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-700', icon: 'text-purple-500' },
  }
  const c = colorMap[color]
  return (
    <div className={`${c.bg} rounded-xl p-4`}>
      <div className={`${c.icon} mb-2`}>{icon}</div>
      <p className={`text-2xl font-bold ${c.text}`}>{typeof value === 'number' ? value.toLocaleString('en-IN') : value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  )
}
