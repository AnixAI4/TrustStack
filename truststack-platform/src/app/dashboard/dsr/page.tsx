'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import {
  Users, ArrowRight, Clock, CheckCircle2, AlertTriangle, ShieldAlert,
  ExternalLink, Copy, Check,
} from 'lucide-react'
import { DsrRequestsTable } from '@/components/modules/dsr/DsrRequestsTable'
import { DSR_RIGHT_TYPES } from '@/lib/constants'
import type { DsrRequest, DsrStats, Organization } from '@/types/dpdp'

export default function DsrPage() {
  const [org, setOrg]           = useState<Organization | null>(null)
  const [stats, setStats]       = useState<DsrStats | null>(null)
  const [requests, setRequests] = useState<DsrRequest[]>([])
  const [loading, setLoading]   = useState(true)
  const [copied, setCopied]     = useState(false)
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date())
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const load = useCallback(async () => {
    try {
      const [orgRes, statsRes, listRes] = await Promise.all([
        fetch('/api/organizations/me'),
        fetch('/api/dsr/stats'),
        fetch('/api/dsr/requests?limit=5'),
      ])
      const orgJson   = await orgRes.json()
      const statsJson = await statsRes.json()
      const listJson  = await listRes.json()
      if (orgJson.success)   setOrg(orgJson.data as Organization)
      if (statsJson.success) setStats(statsJson.data as DsrStats)
      if (listJson.success)  setRequests(listJson.data as DsrRequest[])
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

  const portalPath = org ? `/public/dsr/${org.slug}` : ''
  const portalUrl =
    org ? `${typeof window !== 'undefined' ? window.location.origin : ''}/public/dsr/${org.slug}` : ''

  async function copyPortal() {
    if (!portalUrl) return
    try {
      await navigator.clipboard.writeText(portalUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* clipboard unavailable — ignore */ }
  }

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
          <div className="w-9 h-9 rounded-lg bg-[#D6E4F0] flex items-center justify-center">
            <Users size={18} className="text-[#003366]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#003366]">DSR Management</h1>
            <p className="text-sm text-gray-500">DPDP Sections 11–15 — Data Subject Rights</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400">
            Updated {lastRefreshed.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
          <button onClick={() => load()} className="text-xs text-[#003366] hover:underline font-medium">Refresh</button>
          <Link
            href="/dashboard/dsr/requests"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#003366] text-white text-sm font-medium rounded-lg hover:bg-[#1A5276] transition-colors"
          >
            All Requests <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {/* Public portal card */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Public DSR Portal</p>
            <div className="flex items-center gap-2 flex-wrap">
              <code className="text-sm bg-gray-50 border border-gray-200 rounded px-2 py-1 text-gray-700 break-all">{portalUrl || portalPath}</code>
              <button onClick={copyPortal} className="inline-flex items-center gap-1 text-xs text-[#003366] hover:underline">
                {copied ? <><Check size={13} /> Copied</> : <><Copy size={13} /> Copy</>}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">Share this link so data principals can submit requests. Identity is verified by email OTP.</p>
          </div>
          {portalPath && (
            <a
              href={portalPath}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border border-[#003366] text-[#003366] rounded-lg hover:bg-[#D6E4F0] transition-colors shrink-0"
            >
              <ExternalLink size={14} /> View Public Page
            </a>
          )}
        </div>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {DSR_RIGHT_TYPES.map(r => (
            <span key={r.value} className="text-xs bg-[#D6E4F0] text-[#003366] px-2 py-0.5 rounded-full">{r.label}</span>
          ))}
          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Grievance → M4</span>
        </div>
      </div>

      {/* Overdue alert */}
      {stats && stats.overdue > 0 && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
          <AlertTriangle className="text-red-500 mt-0.5 shrink-0" size={20} />
          <div>
            <p className="font-semibold text-red-800">
              {stats.overdue} request{stats.overdue !== 1 ? 's are' : ' is'} past the 30-day DPDP deadline
            </p>
            <p className="text-sm text-red-600 mt-0.5">
              Review and resolve overdue requests promptly to stay compliant under the DPDP Act.
            </p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Users size={18} />}        label="Total Requests"       value={stats?.total ?? 0}            color="blue" />
        <StatCard icon={<Clock size={18} />}        label="Open"                 value={stats?.open ?? 0}             color={(stats?.open ?? 0) > 0 ? 'amber' : 'green'} />
        <StatCard icon={<AlertTriangle size={18} />} label="Overdue"             value={stats?.overdue ?? 0}          color={(stats?.overdue ?? 0) > 0 ? 'red' : 'green'} />
        <StatCard icon={<CheckCircle2 size={18} />} label="Fulfilled This Month" value={stats?.fulfilled_this_month ?? 0} color="green" />
      </div>

      {stats && stats.identity_pending > 0 && (
        <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-4 py-2.5">
          <ShieldAlert size={15} className="shrink-0" />
          {stats.identity_pending} request{stats.identity_pending !== 1 ? 's are' : ' is'} awaiting identity verification by the data principal.
        </div>
      )}

      {/* Recent requests */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-[#1A1A2E]">Recent Requests</h2>
          <Link href="/dashboard/dsr/requests" className="text-sm text-[#003366] hover:underline flex items-center gap-1">
            View all <ArrowRight size={13} />
          </Link>
        </div>
        <DsrRequestsTable requests={requests} />
      </div>
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
