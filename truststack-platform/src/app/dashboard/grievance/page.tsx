'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import { MessageCircle, ArrowRight, CheckCircle2, Clock, XCircle, AlertCircle } from 'lucide-react'
import { GrievanceOfficerCard } from '@/components/modules/grievance/GrievanceOfficerCard'
import { GrievanceOfficerForm } from '@/components/modules/grievance/GrievanceOfficerForm'
import { ComplaintsTable } from '@/components/modules/grievance/ComplaintsTable'
import type { GrievanceOfficer, GrievanceComplaint, Organization } from '@/types/dpdp'

interface Stats {
  total:          number
  open:           number
  resolvedMonth:  number
  avgDays:        number | null
}

export default function GrievancePage() {
  const [org, setOrg]               = useState<Organization | null>(null)
  const [officer, setOfficer]       = useState<GrievanceOfficer | null>(null)
  const [complaints, setComplaints] = useState<GrievanceComplaint[]>([])
  const [stats, setStats]           = useState<Stats>({ total: 0, open: 0, resolvedMonth: 0, avgDays: null })
  const [editing, setEditing]       = useState(false)
  const [loading, setLoading]       = useState(true)
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date())
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [orgRes, officerRes, complaintsRes] = await Promise.all([
        fetch('/api/organizations/me'),
        fetch('/api/grievance/officer'),
        fetch('/api/grievance/complaints?limit=5'),
      ])
      const orgJson        = await orgRes.json()
      const officerJson    = await officerRes.json()
      const complaintsJson = await complaintsRes.json()

      if (orgJson.success)        setOrg(orgJson.data as Organization)
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
      setLoading(false)
      setLastRefreshed(new Date())
    }
  }, [])

  useEffect(() => {
    load()

    // Poll every 30 seconds
    intervalRef.current = setInterval(() => { load() }, 30_000)

    // Refresh when the tab regains focus (covers the public-form → dashboard switch)
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
        {[1,2,3].map(i => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />)}
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#D6E4F0] flex items-center justify-center">
            <MessageCircle size={18} className="text-[#003366]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#003366]">Grievance Officer Portal</h1>
            <p className="text-sm text-gray-500">DPDP Section 14 — Mandatory compliance module</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400">
            Updated {lastRefreshed.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
          <button
            onClick={() => load()}
            className="text-xs text-[#003366] hover:underline font-medium"
          >
            Refresh
          </button>
          <Link
            href="/dashboard/grievance/complaints"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#003366] text-white text-sm font-medium rounded-lg hover:bg-[#1A5276] transition-colors"
          >
            All Complaints <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {/* Officer section */}
      {editing ? (
        <GrievanceOfficerForm
          officer={officer}
          onSuccess={(updated) => { setOfficer(updated); setEditing(false) }}
          onCancel={() => setEditing(false)}
        />
      ) : (
        <GrievanceOfficerCard
          officer={officer}
          orgSlug={org?.slug ?? ''}
          onEdit={() => setEditing(true)}
        />
      )}

      {/* Stats */}
      {officer && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={<MessageCircle size={18} />} label="Total Complaints" value={stats.total} color="blue" />
          <StatCard icon={<Clock size={18} />}         label="Open"            value={stats.open}  color={stats.open > 0 ? 'amber' : 'green'} />
          <StatCard icon={<CheckCircle2 size={18} />}  label="Resolved This Month" value={stats.resolvedMonth} color="green" />
          <StatCard icon={<AlertCircle size={18} />}   label="SLA Limit"       value="30 days"    color="purple" isText />
        </div>
      )}

      {/* Recent complaints */}
      {officer && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-[#1A1A2E]">Recent Complaints</h2>
            <Link href="/dashboard/grievance/complaints" className="text-sm text-[#003366] hover:underline flex items-center gap-1">
              View all <ArrowRight size={13} />
            </Link>
          </div>
          <ComplaintsTable complaints={complaints} />
        </div>
      )}
    </div>
  )
}

function StatCard({
  icon, label, value, color, isText
}: {
  icon: React.ReactNode
  label: string
  value: number | string
  color: 'blue' | 'amber' | 'green' | 'purple'
  isText?: boolean
}) {
  const colorMap = {
    blue:   { bg: 'bg-blue-50',   text: 'text-blue-700',   icon: 'text-blue-500' },
    amber:  { bg: 'bg-amber-50',  text: 'text-amber-700',  icon: 'text-amber-500' },
    green:  { bg: 'bg-green-50',  text: 'text-green-700',  icon: 'text-green-500' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-700', icon: 'text-purple-500' },
  }
  const c = colorMap[color]
  return (
    <div className={`${c.bg} rounded-xl p-4`}>
      <div className={`${c.icon} mb-2`}>{icon}</div>
      <p className={`text-2xl font-bold ${c.text}`}>{isText ? value : value.toLocaleString('en-IN')}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  )
}
