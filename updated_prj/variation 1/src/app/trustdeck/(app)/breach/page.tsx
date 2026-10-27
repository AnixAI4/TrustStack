'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  AlertTriangle, ArrowRight, Clock, ShieldCheck, Plus, FileWarning,
} from 'lucide-react'
import { BreachTable } from '@/components/platform/modules/breach/BreachTable'
import { BreachCountdown } from '@/components/platform/modules/breach/BreachCountdown'
import { BreachLogModal } from '@/components/platform/modules/breach/BreachLogModal'
import { BREACH_NATURE_TYPES } from '@/lib/platform/constants'
import { ModulePageHeader, ModulePanel, ModulePanelHeader, ModulePageSkeleton } from '@/components/platform/ui/ModulePageHeader'
import { ModulePage } from '@/components/platform/ui/ModulePage'
import { ModuleStatGrid, ModuleRefreshControl } from '@/components/platform/ui/ModuleStatGrid'
import { ModuleNotice } from '@/components/platform/ui/ModuleNotice'
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
  const cancelledRef = useRef(false)

  const load = useCallback(async () => {
    try {
      const [statsRes, listRes] = await Promise.all([
        fetch('/api/trustdeck/breach/stats'),
        fetch('/api/trustdeck/breach?limit=50'),
      ])
      const statsJson = await statsRes.json()
      const listJson  = await listRes.json()
      if (cancelledRef.current) return
      if (statsJson.success) setStats(statsJson.data as BreachStats)
      if (listJson.success)  setIncidents(listJson.data as BreachIncident[])
    } finally {
      if (!cancelledRef.current) {
        setLoading(false)
        setLastRefreshed(new Date())
      }
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    cancelledRef.current = false
    load()
    intervalRef.current = setInterval(() => {
      if (document.visibilityState === 'visible') void load()
    }, 30_000)
    const handleVisibility = () => { if (document.visibilityState === 'visible') void load() }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => {
      cancelled = true
      cancelledRef.current = cancelled
      if (intervalRef.current) clearInterval(intervalRef.current)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [load])

  // Active incidents still on the 72-hour clock (not resolved, not yet notified).
  const active = incidents.filter(b => !b.dpbi_notified && b.status !== 'resolved')

  return (
    <div className="space-y-6">
      <ModulePageHeader
        eyebrow="DPDP §8(6) + Rule 7"
        title="Breach Response"
        description="72-hour DPBI notification workflow"
        action={
          <>
            <ModuleRefreshControl onRefresh={() => load()} lastRefreshed={lastRefreshed} />
            <button
              type="button"
              onClick={() => setLogOpen(true)}
              className="btn btn-accent inline-flex items-center gap-1.5"
            >
              <Plus size={14} /> Log Breach
            </button>
            <Link
              href="/trustdeck/breach/list"
              className="btn btn-ghost inline-flex items-center gap-1.5"
            >
              Breach Register <ArrowRight size={14} />
            </Link>
          </>
        }
      />

      {loading ? (
        <ModulePageSkeleton cards={4} showHeader={false} className="max-w-none" />
      ) : (
        <ModulePage className="space-y-6">
          {/* Overdue / awaiting alert */}
          {stats && stats.overdue_dpbi > 0 ? (
            <ModuleNotice
              tone="red"
              alert
              icon={<AlertTriangle size={20} />}
              eyebrow="DPBI deadline breached"
              title={`${stats.overdue_dpbi} breach${stats.overdue_dpbi !== 1 ? 'es are' : ' is'} past the 72-hour deadline`}
              description="Notify the Data Protection Board of India immediately and record it on the incident."
            />
          ) : stats && stats.awaiting_dpbi > 0 ? (
            <ModuleNotice
              tone="amber"
              alert
              icon={<Clock size={20} />}
              eyebrow="Clock running"
              title={`${stats.awaiting_dpbi} open breach${stats.awaiting_dpbi !== 1 ? 'es' : ''} awaiting DPBI notification`}
              description="The 72-hour clock runs from discovery. Generate the notification draft and notify the DPBI before each deadline."
            />
          ) : null}

          {/* Active incident countdowns */}
          {active.length > 0 && (
            <ModulePanel>
              <ModulePanelHeader eyebrow="Active" title="DPBI clock running" />
              <div className="grid grid-cols-1 gap-3 p-5 lg:grid-cols-2">
                {active.slice(0, 4).map(b => (
                  <Link
                    key={b.id}
                    href={`/trustdeck/breach/${b.id}`}
                    className="block rounded-xl border border-line bg-glass/40 p-4 transition-colors hover:border-accent/30"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="font-mono text-xs font-semibold text-accent">{b.reference_number}</span>
                      <span className="text-xs text-text-muted">{natureLabel(b.nature)}</span>
                    </div>
                    <BreachCountdown dueAt={b.dpbi_notification_due_at} dpbiNotified={b.dpbi_notified} variant="banner" live />
                  </Link>
                ))}
              </div>
            </ModulePanel>
          )}

          {/* Stats */}
          <ModuleStatGrid
            items={[
              { icon: <FileWarning size={16} />, label: 'Total Incidents', value: stats?.total ?? 0, tone: 'blue' },
              { icon: <Clock size={16} />, label: 'Open', value: stats?.open ?? 0, tone: (stats?.open ?? 0) > 0 ? 'amber' : 'green' },
              { icon: <AlertTriangle size={16} />, label: 'Overdue DPBI', value: stats?.overdue_dpbi ?? 0, tone: (stats?.overdue_dpbi ?? 0) > 0 ? 'red' : 'green' },
              { icon: <ShieldCheck size={16} />, label: 'DPBI Notified', value: stats?.dpbi_notified ?? 0, tone: 'green' },
            ]}
          />

          {/* Recent incidents */}
          <ModulePanel>
            <ModulePanelHeader
              title="Recent Incidents"
              action={
                <Link href="/trustdeck/breach/list" className="inline-flex items-center gap-1 text-sm text-accent hover:underline">
                  View register <ArrowRight size={13} />
                </Link>
              }
            />
            <div className="p-5">
              <BreachTable incidents={incidents.slice(0, 5)} />
            </div>
          </ModulePanel>
        </ModulePage>
      )}

      <BreachLogModal
        open={logOpen}
        onClose={() => setLogOpen(false)}
        onLogged={incident => { setLogOpen(false); router.push(`/trustdeck/breach/${incident.id}`) }}
      />
    </div>
  )
}
