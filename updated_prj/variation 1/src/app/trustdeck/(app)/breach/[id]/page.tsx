'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { BreachDetail } from '@/components/platform/modules/breach/BreachDetail'
import { ModuleDetailNotFound, ModuleDetailSkeleton } from '@/components/platform/ui/ModuleDetailState'
import type { BreachIncident } from '@/types/dpdp'

export default function BreachDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId]             = useState<string | null>(null)
  const [incident, setIncident] = useState<BreachIncident | null>(null)
  const [loading, setLoading]   = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => { params.then(p => setId(p.id)) }, [params])

  useEffect(() => {
    if (!id) return
    setLoading(true)
    fetch(`/api/trustdeck/breach/${id}`)
      .then(r => r.json())
      .then(json => {
        if (json.success) setIncident(json.data as BreachIncident)
        else setNotFound(true)
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return <ModuleDetailSkeleton label="breach incident" />
  }

  if (notFound || !incident) {
    return (
      <ModuleDetailNotFound
        title="Breach incident not found"
        description="This incident may have been removed, or it is not available in your current workspace."
        backHref="/trustdeck/breach/list"
        backLabel="Back to the register"
      />
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/trustdeck/breach/list" className="btn btn-ghost inline-flex items-center gap-1 mb-3">
          <ChevronLeft size={14} /> Back to Register
        </Link>
        <h1 className="font-display text-2xl font-semibold text-text">Breach Incident</h1>
      </div>
      <div className="rounded-xl border border-line bg-bg-2 p-6 shadow-card">
        <BreachDetail incident={incident} onUpdate={setIncident} />
      </div>
    </div>
  )
}
