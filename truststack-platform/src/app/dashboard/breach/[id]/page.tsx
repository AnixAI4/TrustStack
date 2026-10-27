'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { BreachDetail } from '@/components/modules/breach/BreachDetail'
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
    fetch(`/api/breach/${id}`)
      .then(r => r.json())
      .then(json => {
        if (json.success) setIncident(json.data as BreachIncident)
        else setNotFound(true)
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        {[1, 2, 3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}
      </div>
    )
  }

  if (notFound || !incident) {
    return (
      <div className="p-6">
        <p className="text-gray-600">Breach incident not found.</p>
        <Link href="/dashboard/breach/list" className="text-[#003366] hover:underline mt-2 inline-block">
          ← Back to the register
        </Link>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <Link href="/dashboard/breach/list" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#003366] mb-3">
          <ChevronLeft size={14} /> Back to Register
        </Link>
        <h1 className="text-2xl font-bold text-[#003366]">Breach Incident</h1>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <BreachDetail incident={incident} onUpdate={setIncident} />
      </div>
    </div>
  )
}
