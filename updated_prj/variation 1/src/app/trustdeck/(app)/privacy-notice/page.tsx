'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Plus, ExternalLink, AlertCircle, CheckCircle2,
  Clock, ArrowRight, Pencil,
} from 'lucide-react'
import { VersionHistory } from '@/components/platform/modules/privacy-notice/VersionHistory'
import { ModulePageHeader, ModulePanel, ModulePanelHeader, ModulePageSkeleton } from '@/components/platform/ui/ModulePageHeader'
import { ModulePage } from '@/components/platform/ui/ModulePage'
import { usePlatformOrg } from '@/contexts/PlatformOrgContext'
import type { PrivacyNotice, PrivacyNoticeVersion } from '@/types/dpdp'

interface NoticeResponse {
  available: boolean
  notice: PrivacyNotice | null
  current_version: PrivacyNoticeVersion | null
  versions: PrivacyNoticeVersion[]
}

const TWELVE_MONTHS_MS = 365 * 24 * 60 * 60 * 1000

export default function PrivacyNoticePage() {
  const org = usePlatformOrg()
  const [data, setData] = useState<NoticeResponse | null>(null)
  const [appUrl, setAppUrl] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setAppUrl(window.location.origin)
    fetch('/api/trustdeck/privacy-notice').then(r => r.json()).then((noticeRes) => {
      if (cancelled) return
      if (!noticeRes.error) setData(noticeRes)
    }).finally(() => {
      if (!cancelled) setLoading(false)
    })
    return () => { cancelled = true }
  }, [])

  const tableMissing = data?.available === false
  const notice = data?.notice || null
  const current = data?.current_version || null
  const versions = data?.versions || []
  const isPublished = !!notice?.published && !!current
  const hasDraft = !!notice && versions.length > 0 && !notice.published
  const publicSlug = notice?.slug || org.slug
  const publicUrl = publicSlug ? `${appUrl}/public/${publicSlug}` : null

  const isStale = !!current?.published_at && (Date.now() - new Date(current.published_at).getTime() > TWELVE_MONTHS_MS)

  const statusLabel = isPublished ? 'Published' : hasDraft ? 'Draft' : 'Not Created'

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <ModulePageHeader
        eyebrow="DPDP Section 5"
        title="Privacy Notice Builder"
        description="Generate, translate, and host a compliant privacy notice."
        action={
          <>
            {isPublished && publicUrl && (
              <a href={publicUrl} target="_blank" rel="noopener noreferrer"
                className="btn btn-ghost inline-flex min-h-11 items-center gap-1.5">
                <ExternalLink className="h-4 w-4" /> View Public Notice
              </a>
            )}
            <Link href="/trustdeck/privacy-notice/builder"
              className="btn btn-accent inline-flex min-h-11 items-center gap-1.5">
              {hasDraft ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {isPublished ? 'Create New Version' : hasDraft ? 'Edit Current Draft' : 'Create Notice'}
            </Link>
          </>
        }
      />

      {loading ? (
        <ModulePageSkeleton cards={2} showHeader={false} className="max-w-none" />
      ) : (
        <ModulePage className="space-y-6">
          {/* Table-not-created hint */}
          {tableMissing && (
            <div className="rounded-xl border border-accent/25 bg-accent/8 p-6 text-sm text-text">
              <p className="font-medium mb-1">Privacy notice tables not created yet</p>
              <p className="text-text-muted">
                Run <code className="bg-glass px-1.5 py-0.5 rounded font-mono text-xs">db/privacy_notices.sql</code> in
                your Supabase SQL Editor to enable this module.
              </p>
            </div>
          )}

          {!tableMissing && (
            <>
              {/* Status banner */}
              <div className={`flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center ${
                isPublished ? 'border-green/25 bg-green/8' : hasDraft ? 'border-accent/25 bg-accent/8' : 'border-amber/25 bg-amber/8'
              }`}>
                {isPublished ? <CheckCircle2 className="h-5 w-5 shrink-0 text-green" />
                  : hasDraft ? <Pencil className="h-5 w-5 shrink-0 text-accent" />
                  : <AlertCircle className="h-5 w-5 shrink-0 text-amber" />}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-text">
                    {statusLabel}{isPublished && current ? ` - Version ${current.version_number}` : ''}
                  </p>
                  <p className="mt-0.5 text-xs text-text-muted">
                    {isPublished && current?.published_at
                      ? `Live since ${new Date(current.published_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`
                      : hasDraft ? 'A draft exists but is not yet published.'
                      : 'No privacy notice has been created yet.'}
                  </p>
                </div>
                {!isPublished && (
                  <Link href="/trustdeck/privacy-notice/builder" className="inline-flex min-h-11 items-center gap-1 self-start text-sm font-medium text-amber hover:underline sm:ml-auto">
                    {hasDraft ? 'Continue' : 'Get started'} <ArrowRight className="h-4 w-4" />
                  </Link>
                )}
              </div>

              {/* Staleness warning */}
              {isStale && (
                <div className="rounded-xl border border-amber/25 bg-amber/8 p-4 flex items-center gap-3">
                  <Clock className="w-5 h-5 text-amber shrink-0" />
                  <p className="text-sm text-text">
                    This notice is over 12 months old. DPDP best practice is to review and re-publish it annually.
                  </p>
                </div>
              )}

              {/* Version history */}
              <ModulePanel>
                <ModulePanelHeader title="Version History" description="Published and draft notice versions" />
                <div className="p-5">
                  <VersionHistory versions={versions} currentVersionId={notice?.current_version_id || null} />
                </div>
              </ModulePanel>
            </>
          )}
        </ModulePage>
      )}
    </div>
  )
}
