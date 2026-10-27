'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { RopaEntryDetail } from '@/components/platform/modules/ropa/RopaEntryDetail'
import { ModuleDetailNotFound, ModuleDetailSkeleton } from '@/components/platform/ui/ModuleDetailState'
import type { RopaEntry, RopaConsentCoverage } from '@/types/dpdp'

export default function RopaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [id, setId]             = useState<string | null>(null)
  const [entry, setEntry]       = useState<RopaEntry | null>(null)
  const [coverage, setCoverage] = useState<RopaConsentCoverage | undefined>(undefined)
  const [loading, setLoading]   = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => { params.then(p => setId(p.id)) }, [params])

  useEffect(() => {
    if (!id) return
    setLoading(true)
    fetch(`/api/trustdeck/ropa/${id}`)
      .then(r => r.json())
      .then(json => {
        if (json.success) {
          setEntry(json.data as RopaEntry)
          setCoverage(json.coverage as RopaConsentCoverage)
        } else {
          setNotFound(true)
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [id])

  // Instant entry update + refresh the read-time consent coverage (edits can
  // change legal basis / purposes, which the coverage depends on).
  function handleUpdate(e: RopaEntry) {
    setEntry(e)
    fetch(`/api/trustdeck/ropa/${e.id}`)
      .then(r => r.json())
      .then(json => { if (json.success) setCoverage(json.coverage as RopaConsentCoverage) })
      .catch(() => {})
  }

  if (loading) {
    return <ModuleDetailSkeleton label="processing activity" />
  }

  if (notFound || !entry) {
    return (
      <ModuleDetailNotFound
        title="Processing activity not found"
        description="This activity may have been removed, or it is not available in your current workspace."
        backHref="/trustdeck/ropa"
        backLabel="Back to ROPA Builder"
      />
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/trustdeck/ropa" className="btn btn-ghost inline-flex items-center gap-1 mb-3">
          <ChevronLeft size={14} /> Back to ROPA Builder
        </Link>
        <h1 className="font-display text-2xl font-semibold text-text">Processing Activity</h1>
      </div>
      <div className="rounded-xl border border-line bg-bg-2 p-4 shadow-card sm:p-6">
        <RopaEntryDetail
          entry={entry}
          coverage={coverage}
          onUpdate={handleUpdate}
          onDeleted={() => router.push('/trustdeck/ropa')}
        />
      </div>
    </div>
  )
}
