'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import {
  Building2, ArrowRight, FileSignature, Clock, AlertTriangle, ShieldAlert,
  Plus, Library, X,
} from 'lucide-react'
import { VendorsTable } from '@/components/platform/modules/vendors/VendorsTable'
import { VendorFormModal } from '@/components/platform/modules/vendors/VendorFormModal'
import { VendorLibraryPicker } from '@/components/platform/modules/vendors/VendorLibraryPicker'
import { ModulePageHeader, ModulePanel, ModulePanelHeader, ModulePageSkeleton } from '@/components/platform/ui/ModulePageHeader'
import { ModulePage } from '@/components/platform/ui/ModulePage'
import { ModuleStatGrid, ModuleRefreshControl } from '@/components/platform/ui/ModuleStatGrid'
import { ModuleNotice } from '@/components/platform/ui/ModuleNotice'
import type { Vendor, VendorStats } from '@/types/dpdp'

export default function VendorsPage() {
  const [stats, setStats]     = useState<VendorStats | null>(null)
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [showLib, setShowLib] = useState(false)
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date())
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const loadAbortRef = useRef<AbortController | null>(null)
  const cancelledRef = useRef(false)

  const load = useCallback(async () => {
    loadAbortRef.current?.abort()
    const controller = new AbortController()
    loadAbortRef.current = controller

    try {
      const [statsRes, listRes] = await Promise.all([
        fetch('/api/trustdeck/vendors/stats', { signal: controller.signal }),
        fetch('/api/trustdeck/vendors?limit=50', { signal: controller.signal }),
      ])
      if (!statsRes.ok || !listRes.ok) {
        throw new Error('Could not load vendors. The server may be restarting — try Refresh.')
      }
      const statsJson = await statsRes.json()
      const listJson = await listRes.json()
      if (cancelledRef.current) return
      if (statsJson.success) setStats(statsJson.data as VendorStats)
      if (listJson.success) setVendors(listJson.data as Vendor[])
      setLoadError(null)
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return
      if (cancelledRef.current) return
      setLoadError(err instanceof Error ? err.message : 'Could not load vendors')
    } finally {
      if (!controller.signal.aborted && !cancelledRef.current) {
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
      loadAbortRef.current?.abort()
      if (intervalRef.current) clearInterval(intervalRef.current)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [load])

  function onVendorAdded(v: Vendor) {
    setVendors(prev => [v, ...prev])
    setShowAdd(false)
    load()
  }

  async function createVendor(data: Partial<Vendor>): Promise<Vendor> {
    const response = await fetch('/api/trustdeck/vendors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const result = await response.json() as { data?: Vendor; error?: string }
    if (!response.ok || !result.data) throw new Error(result.error || 'Failed to add vendor.')
    return result.data
  }

  async function handleLibraryAdd(data: Partial<Vendor>) {
    const vendor = await createVendor(data)
    setShowLib(false)
    onVendorAdded(vendor)
  }

  const attentionCount = (stats?.expiring_soon ?? 0) + (stats?.expired ?? 0)

  return (
    <div className="space-y-6">
      <ModulePageHeader
        eyebrow="Vendor risk & DPAs"
        title="Vendor DPA Manager"
        description="Track data processors, assess risk, and manage DPAs"
        action={
          <>
            <ModuleRefreshControl onRefresh={() => load()} lastRefreshed={lastRefreshed} />
            <button type="button" onClick={() => setShowLib(true)} className="btn btn-ghost inline-flex min-h-11 items-center gap-1.5">
              <Library size={15} /> Add from Library
            </button>
            <button type="button" onClick={() => setShowAdd(true)} className="btn btn-accent inline-flex min-h-11 items-center gap-1.5">
              <Plus size={15} /> Add Vendor
            </button>
          </>
        }
      />

      {loading ? (
        <ModulePageSkeleton cards={4} showHeader={false} className="max-w-none" />
      ) : (
        <ModulePage className="space-y-6">
          {loadError && (
            <ModuleNotice tone="red" alert icon={<AlertTriangle size={18} />} title="Could not load vendors" description={loadError} />
          )}

          {/* Expiry alert */}
          {attentionCount > 0 && (
            <ModuleNotice
              tone="red"
              alert
              icon={<AlertTriangle size={20} />}
              eyebrow="Agreement attention"
              title={
                <>
                  {stats!.expired > 0 && <>{stats!.expired} DPA{stats!.expired !== 1 ? 's have' : ' has'} expired. </>}
                  {stats!.expiring_soon > 0 && <>{stats!.expiring_soon} expiring within 30 days.</>}
                </>
              }
              description="Renew expiring DPAs to keep every data processor under a valid agreement."
            />
          )}

          {/* Stats */}
          <ModuleStatGrid
            items={[
              { icon: <Building2 size={16} />, label: 'Total Vendors', value: stats?.total ?? 0, tone: 'blue' },
              { icon: <FileSignature size={16} />, label: 'Signed DPAs', value: stats?.signed ?? 0, tone: 'green' },
              { icon: <Clock size={16} />, label: 'Awaiting Signature', value: stats?.awaiting ?? 0, tone: (stats?.awaiting ?? 0) > 0 ? 'amber' : 'green' },
              { icon: <AlertTriangle size={16} />, label: 'Expiring / Expired', value: attentionCount, tone: attentionCount > 0 ? 'red' : 'green' },
            ]}
          />

          {stats && stats.high_risk > 0 && (
            <ModuleNotice
              tone="amber"
              icon={<ShieldAlert size={17} />}
              title={`${stats.high_risk} vendor${stats.high_risk !== 1 ? 's are' : ' is'} rated High or Critical risk`}
              description="Prioritise their DPAs and controls before onboarding more data processing."
            />
          )}

          {/* Recent vendors */}
          <ModulePanel>
            <ModulePanelHeader
              title="Vendors"
              action={
                <Link href="/trustdeck/vendors/list" className="inline-flex items-center gap-1 text-sm text-accent hover:underline">
                  View all <ArrowRight size={13} />
                </Link>
              }
            />
            <div className="p-5">
              <VendorsTable vendors={vendors.slice(0, 8)} />
            </div>
          </ModulePanel>
        </ModulePage>
      )}

      <VendorFormModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onSave={async data => {
          const vendor = await createVendor(data)
          onVendorAdded(vendor)
        }}
      />

      {showLib && (
        <div
          className="module-dialog-backdrop fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overscroll-contain p-2 sm:p-4"
          onClick={() => setShowLib(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="vendor-library-title"
            className="module-dialog-surface max-h-[calc(100dvh-1rem)] w-full max-w-2xl overflow-y-auto rounded-xl p-3 sm:max-h-[calc(100dvh-2rem)] sm:p-5"
            onClick={event => event.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between gap-3 border-b border-line px-1 pb-3">
              <h2 id="vendor-library-title" className="font-display text-lg font-semibold text-text">Vendor library</h2>
              <button type="button" onClick={() => setShowLib(false)} aria-label="Close vendor library" className="grid h-10 w-10 place-items-center rounded-lg text-text-faint hover:bg-glass hover:text-text">
                <X className="h-5 w-5" />
              </button>
            </div>
            <VendorLibraryPicker
              existingVendorNames={vendors.map(vendor => vendor.name)}
              onSelect={handleLibraryAdd}
            />
          </div>
        </div>
      )}
    </div>
  )
}
