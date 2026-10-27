'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import {
  Users, ArrowRight, Clock, CheckCircle2, AlertTriangle, ShieldAlert,
  ExternalLink, Copy, Check,
} from 'lucide-react'
import { DsrRequestsTable } from '@/components/platform/modules/dsr/DsrRequestsTable'
import { DSR_RIGHT_TYPES } from '@/lib/platform/constants'
import { ModulePageHeader, ModulePanel, ModulePanelHeader, ModulePageSkeleton } from '@/components/platform/ui/ModulePageHeader'
import { ModulePage } from '@/components/platform/ui/ModulePage'
import { ModuleStatGrid, ModuleRefreshControl } from '@/components/platform/ui/ModuleStatGrid'
import { ModuleNotice } from '@/components/platform/ui/ModuleNotice'
import { usePlatformOrg } from '@/contexts/PlatformOrgContext'
import type { DsrRequest, DsrStats } from '@/types/dpdp'

export default function DsrPage() {
  const org = usePlatformOrg()
  const [stats, setStats]       = useState<DsrStats | null>(null)
  const [requests, setRequests] = useState<DsrRequest[]>([])
  const [loading, setLoading]   = useState(true)
  const [copied, setCopied]     = useState(false)
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date())
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const cancelledRef = useRef(false)

  const load = useCallback(async () => {
    try {
      const [statsRes, listRes] = await Promise.all([
        fetch('/api/trustdeck/dsr/stats'),
        fetch('/api/trustdeck/dsr/requests?limit=5'),
      ])
      const statsJson = await statsRes.json()
      const listJson  = await listRes.json()
      if (cancelledRef.current) return
      if (statsJson.success) setStats(statsJson.data as DsrStats)
      if (listJson.success)  setRequests(listJson.data as DsrRequest[])
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

  const portalPath = `/trustdeck/public/dsr/${org.slug}`
  const portalUrl =
    `${typeof window !== 'undefined' ? window.location.origin : ''}/trustdeck/public/dsr/${org.slug}`

  async function copyPortal() {
    if (!portalUrl) return
    try {
      await navigator.clipboard.writeText(portalUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* clipboard unavailable - ignore */ }
  }

  return (
    <div className="space-y-6">
      <ModulePageHeader
        eyebrow="DPDP Sections 11-15"
        title="DSR Management"
        description="Data Subject Rights"
        action={
          <>
            <ModuleRefreshControl onRefresh={() => load()} lastRefreshed={lastRefreshed} />
            <Link
              href="/trustdeck/dsr/requests"
              className="btn btn-accent inline-flex items-center gap-1.5"
            >
              All Requests <ArrowRight size={14} />
            </Link>
          </>
        }
      />

      {loading ? (
        <ModulePageSkeleton cards={4} showHeader={false} className="max-w-none" />
      ) : (
        <ModulePage className="space-y-6">
          {/* Public portal card */}
          <ModulePanel padded>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="mb-2 font-mono text-label font-semibold uppercase tracking-[var(--tracking-label)] text-text-faint">
                  Public DSR Portal
                </p>
                <div className="flex min-w-0 items-center gap-2">
                  <input
                    readOnly
                    value={portalUrl || portalPath}
                    className="min-w-0 flex-1 truncate rounded-lg border border-line bg-glass px-3 py-2 font-mono text-xs text-text outline-none"
                    aria-label="Public DSR portal URL"
                  />
                  <button
                    type="button"
                    onClick={copyPortal}
                    className="btn btn-ghost inline-flex shrink-0 items-center gap-1.5"
                  >
                    {copied ? <><Check size={13} /> Copied</> : <><Copy size={13} /> Copy</>}
                  </button>
                </div>
                <p className="mt-2 text-xs text-text-muted">Share this link so data principals can submit requests.</p>
              </div>
              {portalPath && (
                <a
                  href={portalPath}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-ghost inline-flex shrink-0 items-center gap-1.5"
                >
                  <ExternalLink size={14} /> View Public Page
                </a>
              )}
            </div>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {DSR_RIGHT_TYPES.map(r => (
                <span key={r.value} className="rounded-full bg-accent/10 px-2.5 py-0.5 text-xs text-accent">{r.label}</span>
              ))}
              <span className="rounded-full bg-surface-2 px-2.5 py-0.5 text-xs text-text-muted">Grievance → M4</span>
            </div>
          </ModulePanel>

          {/* Overdue alert */}
          {stats && stats.overdue > 0 && (
            <ModuleNotice
              tone="red"
              alert
              icon={<AlertTriangle size={20} />}
              eyebrow="Deadline breached"
              title={`${stats.overdue} request${stats.overdue !== 1 ? 's are' : ' is'} past the 30-day DPDP deadline`}
              description="Review and resolve overdue requests promptly to stay compliant under the DPDP Act."
            />
          )}

          {/* Stats */}
          <ModuleStatGrid
            items={[
              { icon: <Users size={16} />, label: 'Total Requests', value: stats?.total ?? 0, tone: 'blue' },
              { icon: <Clock size={16} />, label: 'Open', value: stats?.open ?? 0, tone: (stats?.open ?? 0) > 0 ? 'amber' : 'green' },
              { icon: <AlertTriangle size={16} />, label: 'Overdue', value: stats?.overdue ?? 0, tone: (stats?.overdue ?? 0) > 0 ? 'red' : 'green' },
              { icon: <CheckCircle2 size={16} />, label: 'Fulfilled This Month', value: stats?.fulfilled_this_month ?? 0, tone: 'green' },
            ]}
          />

          {stats && stats.identity_pending > 0 && (
            <ModuleNotice
              tone="amber"
              icon={<ShieldAlert size={17} />}
              title={`${stats.identity_pending} request${stats.identity_pending !== 1 ? 's are' : ' is'} awaiting identity verification`}
              description="The data principal must complete verification before the request can move forward."
            />
          )}

          {/* Recent requests */}
          <ModulePanel>
            <ModulePanelHeader
              title="Recent Requests"
              action={
                <Link href="/trustdeck/dsr/requests" className="inline-flex items-center gap-1 text-sm text-accent hover:underline">
                  View all <ArrowRight size={13} />
                </Link>
              }
            />
            <div className="p-5">
              <DsrRequestsTable requests={requests} />
            </div>
          </ModulePanel>
        </ModulePage>
      )}
    </div>
  )
}
