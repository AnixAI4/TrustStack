'use client'

import { useEffect, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { VersionHistory } from '@/components/platform/modules/consent/VersionHistory'
import type { ConsentConfigVersion } from '@/types/dpdp'

export default function ConsentVersionsPage() {
  const [versions, setVersions] = useState<ConsentConfigVersion[]>([])

  useEffect(() => {
    fetch('/api/trustdeck/consent/versions')
      .then(response => response.json())
      .then(result => setVersions((result.versions as ConsentConfigVersion[]) ?? []))
  }, [])

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/trustdeck/consent"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-text-faint transition-colors hover:bg-glass hover:text-text"
          aria-label="Back to Consent Management"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="font-display text-xl font-semibold text-text sm:text-2xl">Consent Version History</h1>
          <p className="text-sm text-text-muted">
            An immutable snapshot of each configuration version - what every consent record was actually agreed against.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-accent/25 bg-accent/8 px-4 py-3 text-xs text-accent">
        <strong>Why this matters:</strong> Each consent record stores its <code className="bg-glass px-1 py-0.5 rounded font-mono">config_version</code>.
        These snapshots let you reconstruct exactly which purposes and notice settings a data principal agreed to on a given date - evidence for DPDP Section 6(5).
      </div>

      <VersionHistory versions={versions} current={versions[0] ?? null} />
    </div>
  )
}
