'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { ComplaintDetail } from '@/components/platform/modules/grievance/ComplaintDetail'
import { ModuleDetailNotFound, ModuleDetailSkeleton } from '@/components/platform/ui/ModuleDetailState'
import type { GrievanceComplaint } from '@/types/dpdp'

export default function ComplaintDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId]                 = useState<string | null>(null)
  const [complaint, setComplaint]   = useState<GrievanceComplaint | null>(null)
  const [loading, setLoading]       = useState(true)
  const [notFound, setNotFound]     = useState(false)

  useEffect(() => {
    params.then(p => setId(p.id))
  }, [params])

  useEffect(() => {
    if (!id) return
    setLoading(true)
    fetch(`/api/trustdeck/grievance/complaints/${id}`)
      .then(r => r.json())
      .then(json => {
        if (json.success) setComplaint(json.data as GrievanceComplaint)
        else setNotFound(true)
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return <ModuleDetailSkeleton label="complaint" />
  }

  if (notFound || !complaint) {
    return (
      <ModuleDetailNotFound
        title="Complaint not found"
        description="This complaint may have been removed, or it is not available in your current workspace."
        backHref="/trustdeck/grievance/complaints"
        backLabel="Back to complaints"
      />
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/trustdeck/grievance/complaints" className="btn btn-ghost inline-flex items-center gap-1 mb-3">
          <ChevronLeft size={14} /> Back to Complaints
        </Link>
        <h1 className="font-display text-2xl font-semibold text-text">Complaint Detail</h1>
      </div>
      <div className="rounded-xl border border-line bg-bg-2 p-6 shadow-card">
        <ComplaintDetail complaint={complaint} onUpdate={setComplaint} />
      </div>
    </div>
  )
}
