'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import { MessageCircle, ArrowRight, CheckCircle2, Clock, AlertCircle } from 'lucide-react'
import { GrievanceOfficerCard } from '@/components/platform/modules/grievance/GrievanceOfficerCard'
import { GrievanceOfficerForm } from '@/components/platform/modules/grievance/GrievanceOfficerForm'
import { ComplaintsTable } from '@/components/platform/modules/grievance/ComplaintsTable'
import { ModulePageHeader, ModulePanel, ModulePanelHeader, ModulePageSkeleton } from '@/components/platform/ui/ModulePageHeader'
import { ModulePage } from '@/components/platform/ui/ModulePage'
import { ModuleStatGrid, ModuleRefreshControl } from '@/components/platform/ui/ModuleStatGrid'
import { usePlatformOrg } from '@/contexts/PlatformOrgContext'
import type { GrievanceOfficer, GrievanceComplaint } from '@/types/dpdp'

interface Stats {
  total:          number
  open:           number
  resolvedMonth:  number
  avgDays:        number | null
}

export default function GrievancePage() {
  const org = usePlatformOrg()
  const [officer, setOfficer]       = useState<GrievanceOfficer | null>(null)
  const [complaints, setComplaints] = useState<GrievanceComplaint[]>([])
  const [stats, setStats]           = useState<Stats>({ total: 0, open: 0, resolvedMonth: 0, avgDays: null })
  const [editing, setEditing]       = useState(false)
  const [loading, setLoading]       = useState(true)
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date())
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const cancelledRef = useRef(false)

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true)
    try {
      const [officerRes, complaintsRes] = await Promise.all([
        fetch('/api/trustdeck/grievance/officer'),
        fetch('/api/trustdeck/grievance/complaints?limit=5'),
      ])
      const officerJson    = await officerRes.json()
      const complaintsJson = await complaintsRes.json()

      if (cancelledRef.current) return
      if (officerJson.success)    setOfficer(officerJson.data as GrievanceOfficer | null)
      if (complaintsJson.success) {
        const all = complaintsJson.data as GrievanceComplaint[]
        setComplaints(all)
        const now  = new Date()
        const open = all.filter(c => c.status === 'new' || c.status === 'under_review').length
        const resolvedThisMonth = all.filter(c => {
          if (c.status !== 'resolved' || !c.resolved_at) return false
          const d = new Date(c.resolved_at)
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
        }).length
        setStats({ total: complaintsJson.total ?? all.length, open, resolvedMonth: resolvedThisMonth, avgDays: null })
      }
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
    void load()

    // Poll every 30 seconds
    intervalRef.current = setInterval(() => {
      if (document.visibilityState === 'visible') void load({ silent: true })
    }, 30_000)

    // Refresh when the tab regains focus (covers the public-form → dashboard switch)
    const handleVisibility = () => { if (document.visibilityState === 'visible') void load({ silent: true }) }
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      cancelled = true
      cancelledRef.current = cancelled
      if (intervalRef.current) clearInterval(intervalRef.current)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [load])

  return (
    <div className="space-y-6">
      <ModulePageHeader
        eyebrow="DPDP Section 14"
        title="Grievance Officer Portal"
        description="Mandatory compliance module"
        action={
          <>
            <ModuleRefreshControl onRefresh={() => void load({ silent: true })} lastRefreshed={lastRefreshed} />
            <Link
              href="/trustdeck/grievance/complaints"
              className="btn btn-accent inline-flex items-center gap-1.5"
            >
              All Complaints <ArrowRight size={14} />
            </Link>
          </>
        }
      />

      {loading ? (
        <ModulePageSkeleton cards={4} showHeader={false} className="max-w-none" />
      ) : (
        <ModulePage className="space-y-6">
          {/* Officer section */}
          {editing ? (
            <ModulePanel padded>
              <GrievanceOfficerForm
                officer={officer}
                onSave={async (data) => {
                  const res = await fetch('/api/trustdeck/grievance/officer', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                  })
                  const json = await res.json()
                  if (!res.ok || !json.success) {
                    throw new Error(json.error || 'Failed to save officer')
                  }
                  setOfficer(json.data as GrievanceOfficer)
                  setEditing(false)
                }}
                onCancel={() => setEditing(false)}
              />
            </ModulePanel>
          ) : (
            <GrievanceOfficerCard
              officer={officer}
              orgSlug={org.slug}
              onEdit={() => setEditing(true)}
            />
          )}

          {/* Stats */}
          {officer && (
            <ModuleStatGrid
              items={[
                { icon: <MessageCircle size={16} />, label: 'Total Complaints', value: stats.total, tone: 'blue' },
                { icon: <Clock size={16} />, label: 'Open', value: stats.open, tone: stats.open > 0 ? 'amber' : 'green' },
                { icon: <CheckCircle2 size={16} />, label: 'Resolved This Month', value: stats.resolvedMonth, tone: 'green' },
                { icon: <AlertCircle size={16} />, label: 'SLA Limit', value: '30 days', tone: 'accent', isText: true },
              ]}
            />
          )}

          {/* Recent complaints */}
          {officer && (
            <ModulePanel>
              <ModulePanelHeader
                title="Recent Complaints"
                action={
                  <Link href="/trustdeck/grievance/complaints" className="inline-flex items-center gap-1 text-sm text-accent hover:underline">
                    View all <ArrowRight size={13} />
                  </Link>
                }
              />
              <div className="p-5">
                <ComplaintsTable complaints={complaints} />
              </div>
            </ModulePanel>
          )}
        </ModulePage>
      )}
    </div>
  )
}
