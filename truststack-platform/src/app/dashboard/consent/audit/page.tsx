'use client'

import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import AuditTable from '@/components/modules/consent/AuditTable'

export default function ConsentAuditPage() {
  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/consent"
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-[#003366]">Consent Audit Log</h1>
          <p className="text-sm text-gray-500">
            Full record of all consent events — DPDP Section 6(5) requires you to be able to demonstrate consent.
          </p>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-800">
        <strong>Privacy note:</strong> User identifiers are stored as SHA-256 hashes. Raw email/phone numbers are never stored here.
        Hashes include your org ID as salt to prevent cross-org correlation.
      </div>

      <AuditTable />
    </div>
  )
}
