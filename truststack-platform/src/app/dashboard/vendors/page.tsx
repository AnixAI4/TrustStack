'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import {
  Building2, ArrowRight, FileSignature, Clock, AlertTriangle, ShieldAlert,
  Plus, Library,
} from 'lucide-react'
import { VendorsTable } from '@/components/modules/vendors/VendorsTable'
import { VendorFormModal } from '@/components/modules/vendors/VendorFormModal'
import { VendorLibraryPicker } from '@/components/modules/vendors/VendorLibraryPicker'
import type { Vendor, VendorStats } from '@/types/dpdp'

export default function VendorsPage() {
  const [stats, setStats]     = useState<VendorStats | null>(null)
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [showLib, setShowLib] = useState(false)
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date())
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const load = useCallback(async () => {
    try {
      const [statsRes, listRes] = await Promise.all([
        fetch('/api/vendors/stats'),
        fetch('/api/vendors?limit=50'),
      ])
      const statsJson = await statsRes.json()
      const listJson  = await listRes.json()
      if (statsJson.success) setStats(statsJson.data as VendorStats)
      if (listJson.success)  setVendors(listJson.data as Vendor[])
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

  function onVendorAdded(v: Vendor) {
    setVendors(prev => [v, ...prev])
    setShowAdd(false)
    load()
  }

  const attentionCount = (stats?.expiring_soon ?? 0) + (stats?.expired ?? 0)

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
            <Building2 size={18} className="text-[#003366]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#003366]">Vendor DPA Manager</h1>
            <p className="text-sm text-gray-500">Track data processors, assess risk, and manage DPAs</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 hidden sm:inline">
            Updated {lastRefreshed.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
          </span>
          <button onClick={() => setShowLib(true)} className="inline-flex items-center gap-1.5 px-4 py-2 border border-[#003366] text-[#003366] text-sm font-medium rounded-lg hover:bg-[#D6E4F0] transition-colors">
            <Library size={15} /> Add from Library
          </button>
          <button onClick={() => setShowAdd(true)} className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#003366] text-white text-sm font-medium rounded-lg hover:bg-[#1A5276] transition-colors">
            <Plus size={15} /> Add Vendor
          </button>
        </div>
      </div>

      {/* Expiry alert */}
      {attentionCount > 0 && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
          <AlertTriangle className="text-red-500 mt-0.5 shrink-0" size={20} />
          <div>
            <p className="font-semibold text-red-800">
              {stats!.expired > 0 && <>{stats!.expired} DPA{stats!.expired !== 1 ? 's have' : ' has'} expired. </>}
              {stats!.expiring_soon > 0 && <>{stats!.expiring_soon} expiring within 30 days.</>}
            </p>
            <p className="text-sm text-red-600 mt-0.5">
              Renew expiring DPAs to keep every data processor under a valid agreement.
            </p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Building2 size={18} />}     label="Total Vendors"      value={stats?.total ?? 0}        color="blue" />
        <StatCard icon={<FileSignature size={18} />} label="Signed DPAs"        value={stats?.signed ?? 0}       color="green" />
        <StatCard icon={<Clock size={18} />}         label="Awaiting Signature" value={stats?.awaiting ?? 0}     color={(stats?.awaiting ?? 0) > 0 ? 'amber' : 'green'} />
        <StatCard icon={<AlertTriangle size={18} />} label="Expiring / Expired" value={attentionCount}           color={attentionCount > 0 ? 'red' : 'green'} />
      </div>

      {stats && stats.high_risk > 0 && (
        <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-4 py-2.5">
          <ShieldAlert size={15} className="shrink-0" />
          {stats.high_risk} vendor{stats.high_risk !== 1 ? 's are' : ' is'} rated High or Critical risk — prioritise their DPAs and controls.
        </div>
      )}

      {/* Recent vendors */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-[#1A1A2E]">Vendors</h2>
          <Link href="/dashboard/vendors/list" className="text-sm text-[#003366] hover:underline flex items-center gap-1">
            View all <ArrowRight size={13} />
          </Link>
        </div>
        <VendorsTable vendors={vendors.slice(0, 8)} />
      </div>

      <VendorFormModal open={showAdd} onClose={() => setShowAdd(false)} onSaved={onVendorAdded} />
      <VendorLibraryPicker
        open={showLib}
        onClose={() => setShowLib(false)}
        existingNames={vendors.map(v => v.name)}
        onAdded={v => { setVendors(prev => [v, ...prev]); load() }}
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
