'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { DsrRequestDetail } from '@/components/platform/modules/dsr/DsrRequestDetail'
import { ModuleDetailNotFound, ModuleDetailSkeleton } from '@/components/platform/ui/ModuleDetailState'
import type { DsrRequest, DsrNomination } from '@/types/dpdp'

export default function DsrRequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId]                 = useState<string | null>(null)
  const [request, setRequest]       = useState<DsrRequest | null>(null)
  const [nomination, setNomination] = useState<DsrNomination | null>(null)
  const [loading, setLoading]       = useState(true)
  const [notFound, setNotFound]     = useState(false)

  useEffect(() => { params.then(p => setId(p.id)) }, [params])

  useEffect(() => {
    if (!id) return
    setLoading(true)
    fetch(`/api/trustdeck/dsr/requests/${id}`)
      .then(r => r.json())
      .then(json => {
        if (json.success) {
          setRequest(json.data as DsrRequest)
          setNomination((json.nomination as DsrNomination | null) ?? null)
        } else {
          setNotFound(true)
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return <ModuleDetailSkeleton label="data rights request" />
  }

  if (notFound || !request) {
    return (
      <ModuleDetailNotFound
        title="Request not found"
        description="This data rights request may have been removed, or it is not available in your current workspace."
        backHref="/trustdeck/dsr/requests"
        backLabel="Back to requests"
      />
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/trustdeck/dsr/requests" className="btn btn-ghost inline-flex items-center gap-1 mb-3">
          <ChevronLeft size={14} /> Back to Requests
        </Link>
        <h1 className="font-display text-2xl font-semibold text-text">Request Detail</h1>
      </div>
      <div className="rounded-xl border border-line bg-bg-2 p-4 shadow-card sm:p-6">
        <DsrRequestDetail request={request} nomination={nomination} onUpdate={setRequest} />
      </div>
    </div>
  )
}
