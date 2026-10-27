'use client'

import { useEffect, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { AuditTable } from '@/components/platform/modules/consent/AuditTable'
import type { ConsentRecord } from '@/types/dpdp'

export default function ConsentAuditPage() {
  const [records, setRecords] = useState<ConsentRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/trustdeck/consent/audit?limit=100')
      .then(response => response.json())
      .then(result => setRecords((result.records as ConsentRecord[]) ?? []))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/trustdeck/consent"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-text-faint transition-colors hover:bg-glass hover:text-text"
          aria-label="Back to Consent Management"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="font-display text-xl font-semibold text-text sm:text-2xl">Consent Audit Log</h1>
          <p className="text-sm text-text-muted">
            Full record of all consent events - DPDP Section 6(5) requires you to be able to demonstrate consent.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-amber/25 bg-amber/8 px-4 py-3 text-xs text-text">
        <strong>Privacy note:</strong> User identifiers are stored as SHA-256 hashes. Raw email/phone numbers are never stored here.
        Hashes include your org ID as salt to prevent cross-org correlation.
      </div>

      <div className="rounded-xl border border-line bg-bg-2 p-3 shadow-card sm:p-6">
        <AuditTable records={records} loading={loading} />
      </div>
    </div>
  )
}
