'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { VendorDetail } from '@/components/platform/modules/vendors/VendorDetail'
import { ModuleDetailNotFound, ModuleDetailSkeleton } from '@/components/platform/ui/ModuleDetailState'
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
    fetch(`/api/trustdeck/vendors/${id}`)
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
    return <ModuleDetailSkeleton label="vendor" />
  }

  if (notFound || !vendor) {
    return (
      <ModuleDetailNotFound
        title="Vendor not found"
        description="This vendor may have been removed, or the link no longer points to a record in your workspace."
        backHref="/trustdeck/vendors"
        backLabel="Back to vendors"
      />
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/trustdeck/vendors" className="btn btn-ghost inline-flex items-center gap-1 mb-3">
          <ChevronLeft size={14} /> Back to Vendors
        </Link>
        <h1 className="font-display text-2xl font-semibold text-text">Vendor Detail</h1>
      </div>
      <div className="rounded-xl border border-line bg-bg-2 p-4 shadow-card sm:p-6">
        <VendorDetail
          vendor={vendor}
          responses={responses}
          onUpdate={setVendor}
          onDeleted={() => router.push('/trustdeck/vendors')}
        />
      </div>
    </div>
  )
}
