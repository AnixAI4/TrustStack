'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { VendorDetail } from '@/components/modules/vendors/VendorDetail'
import type { Vendor, VendorQuestionnaireResponse } from '@/types/dpdp'

export default function VendorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [id, setId]               = useState<string | null>(null)
  const [vendor, setVendor]       = useState<Vendor | null>(null)
  const [responses, setResponses] = useState<VendorQuestionnaireResponse[]>([])
  const [loading, setLoading]     = useState(true)
  const [notFound, setNotFound]   = useState(false)

  useEffect(() => { params.then(p => setId(p.id)) }, [params])

  useEffect(() => {
    if (!id) return
    setLoading(true)
    fetch(`/api/vendors/${id}`)
      .then(r => r.json())
      .then(json => {
        if (json.success) {
          setVendor(json.data as Vendor)
          setResponses((json.responses as VendorQuestionnaireResponse[]) ?? [])
        } else {
          setNotFound(true)
        }
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

  if (notFound || !vendor) {
    return (
      <div className="p-6">
        <p className="text-gray-600">Vendor not found.</p>
        <Link href="/dashboard/vendors" className="text-[#003366] hover:underline mt-2 inline-block">
          ← Back to vendors
        </Link>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <Link href="/dashboard/vendors" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#003366] mb-3">
          <ChevronLeft size={14} /> Back to Vendors
        </Link>
        <h1 className="text-2xl font-bold text-[#003366]">Vendor Detail</h1>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <VendorDetail
          vendor={vendor}
          responses={responses}
          onUpdate={setVendor}
          onDeleted={() => router.push('/dashboard/vendors')}
        />
      </div>
    </div>
  )
}
