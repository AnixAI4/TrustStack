'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function NewAssessmentPage() {
  const router = useRouter()

  useEffect(() => {
    async function createAndRedirect() {
      const res = await fetch('/api/assessment/start', { method: 'POST' })
      const data = await res.json() as { success?: boolean; data?: { id: string }; error?: string }

      if (data.success && data.data?.id) {
        router.replace(`/dashboard/assessment/${data.data.id}`)
      } else {
        router.replace('/dashboard/assessment')
      }
    }
    createAndRedirect()
  }, [router])

  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-[#003366] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-gray-500">Setting up your assessment…</p>
      </div>
    </div>
  )
}
