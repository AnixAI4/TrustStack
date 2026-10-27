'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  AlertTriangle, ArrowRight, Clock, CheckCircle2, ShieldCheck, Plus, FileWarning,
} from 'lucide-react'
import { BreachTable } from '@/components/modules/breach/BreachTable'
import { BreachCountdown } from '@/components/modules/breach/BreachCountdown'
import { BreachLogModal } from '@/components/modules/breach/BreachLogModal'
import { BREACH_NATURE_TYPES } from '@/lib/constants'
import type { BreachIncident, BreachStats } from '@/types/dpdp'

function natureLabel(v: string): string {
  return BREACH_NATURE_TYPES.find(n => n.value === v)?.label ?? v
}

export default function BreachPage() {
  const router = useRouter()
  const [stats, setStats]         = useState<BreachStats | null>(null)
  const [incidents, setIncidents] = useState<BreachIncident[]>([])
  const [loading, setLoading]     = useState(true)
  const [logOpen, setLogOpen]     = useState(false)
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date())
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const load = useCallback(async () => {
    try {
      const [statsRes, listRes] = await Promise.all([
        fetch('/api/breach/stats'),
        fetch('/api/breach?limit=50'),
      ])
      const statsJson = await statsRes.json()
      const listJson  = await listRes.json()
      if (statsJson.success) setStats(statsJson.data as BreachStats)
      if (listJson.success)  setIncidents(listJson.data as BreachIncident[])
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

  // Active incidents still on the 72-hour clock (not resolved, not yet notified).
  const active = incidents.filter(b => !b.dpbi_notified && b.status !== 'resolved')

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        {[1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />)}
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center">
            <AlertTriangle size={18} className="text-red-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#003366]">Breach Response</h1>
            <p className="text-sm text-gray-500">DPDP §8(6) + Rule 7 — 72-hour DPBI notification workflow</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400">
            Updated {lastRefreshed.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
          <button onClick={() => load()} className="text-xs text-[#003366] hover:underline font-medium">Refresh</button>
          <button
            onClick={() => setLogOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
          >
            <Plus size={14} /> Log Breach
          </button>
          <Link
            href="/dashboard/breach/list"
            className="inline-flex items-center gap-1.5 px-4 py-2 border border-[#003366] text-[#003366] text-sm font-medium rounded-lg hover:bg-[#D6E4F0] transition-colors"
          >
            Breach Register <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {/* Overdue / awaiting alert */}
      {stats && stats.overdue_dpbi > 0 ? (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
          <AlertTriangle className="text-red-500 mt-0.5 shrink-0" size={20} />
          <div>
            <p className="font-semibold text-red-800">
              {stats.overdue_dpbi} breach{stats.overdue_dpbi !== 1 ? 'es are' : ' is'} past the 72-hour DPBI deadline
            </p>
            <p className="text-sm text-red-600 mt-0.5">
              Notify the Data Protection Board of India immediately and record it on the incident.
            </p>
          </div>
        </div>
      ) : stats && stats.awaiting_dpbi > 0 ? (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <Clock className="text-amber-500 mt-0.5 shrink-0" size={20} />
          <div>
            <p className="font-semibold text-amber-800">
              {stats.awaiting_dpbi} open breach{stats.awaiting_dpbi !== 1 ? 'es' : ''} awaiting DPBI notification
            </p>
            <p className="text-sm text-amber-700 mt-0.5">
              The 72-hour clock runs from discovery — generate the notification draft and notify the DPBI before each deadline.
            </p>
          </div>
        </div>
      ) : null}

      {/* Active incident countdowns */}
      {active.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Active — DPBI clock running</p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {active.slice(0, 4).map(b => (
              <Link
                key={b.id}
                href={`/dashboard/breach/${b.id}`}
                className="block bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:border-[#003366]/30 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs font-semibold text-[#003366]">{b.reference_number}</span>
                  <span className="text-xs text-gray-500">{natureLabel(b.nature)}</span>
                </div>
                <BreachCountdown dueAt={b.dpbi_notification_due_at} dpbiNotified={b.dpbi_notified} variant="banner" live />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<FileWarning size={18} />}  label="Total Incidents"     value={stats?.total ?? 0}          color="blue" />
        <StatCard icon={<Clock size={18} />}        label="Open"                value={stats?.open ?? 0}           color={(stats?.open ?? 0) > 0 ? 'amber' : 'green'} />
        <StatCard icon={<AlertTriangle size={18} />} label="Overdue DPBI"       value={stats?.overdue_dpbi ?? 0}   color={(stats?.overdue_dpbi ?? 0) > 0 ? 'red' : 'green'} />
        <StatCard icon={<ShieldCheck size={18} />}  label="DPBI Notified"       value={stats?.dpbi_notified ?? 0}  color="green" />
      </div>

      {/* Recent incidents */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-[#1A1A2E]">Recent Incidents</h2>
          <Link href="/dashboard/breach/list" className="text-sm text-[#003366] hover:underline flex items-center gap-1">
            View register <ArrowRight size={13} />
          </Link>
        </div>
        <BreachTable incidents={incidents.slice(0, 5)} />
      </div>

      <BreachLogModal
        open={logOpen}
        onClose={() => setLogOpen(false)}
        onLogged={incident => { setLogOpen(false); router.push(`/dashboard/breach/${incident.id}`) }}
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
