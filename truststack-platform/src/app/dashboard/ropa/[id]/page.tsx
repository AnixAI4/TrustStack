'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { RopaEntryDetail } from '@/components/modules/ropa/RopaEntryDetail'
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
    fetch(`/api/ropa/${id}`)
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
    fetch(`/api/ropa/${e.id}`)
      .then(r => r.json())
      .then(json => { if (json.success) setCoverage(json.coverage as RopaConsentCoverage) })
      .catch(() => {})
  }

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        {[1, 2, 3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}
      </div>
    )
  }

  if (notFound || !entry) {
    return (
      <div className="p-6">
        <p className="text-gray-600">Processing activity not found.</p>
        <Link href="/dashboard/ropa" className="text-[#003366] hover:underline mt-2 inline-block">
          ← Back to ROPA Builder
        </Link>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <Link href="/dashboard/ropa" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#003366] mb-3">
          <ChevronLeft size={14} /> Back to ROPA Builder
        </Link>
        <h1 className="text-2xl font-bold text-[#003366]">Processing Activity</h1>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <RopaEntryDetail
          entry={entry}
          coverage={coverage}
          onUpdate={handleUpdate}
          onDeleted={() => router.push('/dashboard/ropa')}
        />
      </div>
    </div>
  )
}
