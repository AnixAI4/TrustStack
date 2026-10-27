'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { ComplaintDetail } from '@/components/modules/grievance/ComplaintDetail'
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
    fetch(`/api/grievance/complaints/${id}`)
      .then(r => r.json())
      .then(json => {
        if (json.success) setComplaint(json.data as GrievanceComplaint)
        else setNotFound(true)
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        {[1,2,3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}
      </div>
    )
  }

  if (notFound || !complaint) {
    return (
      <div className="p-6">
        <p className="text-gray-600">Complaint not found.</p>
        <Link href="/dashboard/grievance/complaints" className="text-[#003366] hover:underline mt-2 inline-block">
          ← Back to complaints
        </Link>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <Link href="/dashboard/grievance/complaints" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#003366] mb-3">
          <ChevronLeft size={14} /> Back to Complaints
        </Link>
        <h1 className="text-2xl font-bold text-[#003366]">Complaint Detail</h1>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <ComplaintDetail complaint={complaint} onUpdate={setComplaint} />
      </div>
    </div>
  )
}
