'use client'

import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import VersionHistory from '@/components/modules/consent/VersionHistory'

export default function ConsentVersionsPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/consent"
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-[#003366]">Consent Version History</h1>
          <p className="text-sm text-gray-500">
            An immutable snapshot of each configuration version — what every consent record was actually agreed against.
          </p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-xs text-[#003366]">
        <strong>Why this matters:</strong> Each consent record stores its <code className="bg-blue-100 px-1 py-0.5 rounded font-mono">config_version</code>.
        These snapshots let you reconstruct exactly which purposes and notice settings a data principal agreed to on a given date —
        evidence for DPDP Section 6(5).
      </div>

      <VersionHistory />
    </div>
  )
}
