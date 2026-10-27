'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  FileText, Plus, ExternalLink, AlertCircle, CheckCircle2,
  Clock, ArrowRight, Pencil,
} from 'lucide-react'
import VersionHistory from '@/components/modules/privacy-notice/VersionHistory'
import type { PrivacyNotice, PrivacyNoticeVersion } from '@/types/dpdp'

interface NoticeResponse {
  available: boolean
  notice: PrivacyNotice | null
  current_version: PrivacyNoticeVersion | null
  versions: PrivacyNoticeVersion[]
}

const TWELVE_MONTHS_MS = 365 * 24 * 60 * 60 * 1000

export default function PrivacyNoticePage() {
  const [data, setData] = useState<NoticeResponse | null>(null)
  const [slug, setSlug] = useState<string | null>(null)
  const [appUrl, setAppUrl] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setAppUrl(window.location.origin)
    Promise.all([
      fetch('/api/privacy-notice').then(r => r.json()),
      fetch('/api/organizations/me').then(r => r.json()),
    ]).then(([noticeRes, orgRes]) => {
      if (!noticeRes.error) setData(noticeRes)
      if (orgRes?.data?.slug) setSlug(orgRes.data.slug)
    }).finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="h-8 bg-gray-100 rounded w-64 animate-pulse mb-8" />
        <div className="h-24 bg-gray-100 rounded-xl animate-pulse mb-6" />
        <div className="h-40 bg-gray-100 rounded-xl animate-pulse" />
      </div>
    )
  }

  const tableMissing = data?.available === false
  const notice = data?.notice || null
  const current = data?.current_version || null
  const versions = data?.versions || []
  const isPublished = !!notice?.published && !!current
  const hasDraft = !!notice && versions.length > 0 && !notice.published
  const publicSlug = notice?.slug || slug
  const publicUrl = publicSlug ? `${appUrl}/public/${publicSlug}` : null

  const isStale = !!current?.published_at && (Date.now() - new Date(current.published_at).getTime() > TWELVE_MONTHS_MS)

  const statusLabel = isPublished ? 'Published' : hasDraft ? 'Draft' : 'Not Created'

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#003366] flex items-center gap-2">
            <FileText className="w-7 h-7" /> Privacy Notice Builder
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            DPDP Section 5 — generate, translate, and host a compliant privacy notice.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isPublished && publicUrl && (
            <a href={publicUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">
              <ExternalLink className="w-4 h-4" /> View Public Notice
            </a>
          )}
          <Link href="/dashboard/privacy-notice/builder"
            className="flex items-center gap-1.5 text-sm px-4 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#1A5276]">
            {hasDraft ? <Pencil className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {isPublished ? 'Create New Version' : hasDraft ? 'Edit Current Draft' : 'Create Notice'}
          </Link>
        </div>
      </div>

      {/* Table-not-created hint */}
      {tableMissing && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-sm text-amber-800">
          <p className="font-medium mb-1">Privacy notice tables not created yet</p>
          <p className="text-amber-700">
            Run <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono text-xs">db/privacy_notices.sql</code> in
            your Supabase SQL Editor to enable this module.
          </p>
        </div>
      )}

      {!tableMissing && (
        <>
          {/* Status banner */}
          <div className={`rounded-xl border p-4 flex items-center gap-3 ${
            isPublished ? 'bg-green-50 border-green-200' : hasDraft ? 'bg-blue-50 border-blue-200' : 'bg-amber-50 border-amber-200'
          }`}>
            {isPublished ? <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
              : hasDraft ? <Pencil className="w-5 h-5 text-blue-600 shrink-0" />
              : <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />}
            <div>
              <p className={`font-semibold text-sm ${isPublished ? 'text-green-800' : hasDraft ? 'text-blue-800' : 'text-amber-800'}`}>
                {statusLabel}{isPublished && current ? ` — Version ${current.version_number}` : ''}
              </p>
              <p className={`text-xs mt-0.5 ${isPublished ? 'text-green-700' : hasDraft ? 'text-blue-700' : 'text-amber-700'}`}>
                {isPublished && current?.published_at
                  ? `Live since ${new Date(current.published_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`
                  : hasDraft ? 'A draft exists but is not yet published.'
                  : 'No privacy notice has been created yet.'}
              </p>
            </div>
            {!isPublished && (
              <Link href="/dashboard/privacy-notice/builder" className="ml-auto flex items-center gap-1 text-sm font-medium text-amber-800 hover:underline shrink-0">
                {hasDraft ? 'Continue' : 'Get started'} <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>

          {/* Staleness warning */}
          {isStale && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-center gap-3">
              <Clock className="w-5 h-5 text-amber-600 shrink-0" />
              <p className="text-sm text-amber-800">
                This notice is over 12 months old. DPDP best practice is to review and re-publish it annually.
              </p>
            </div>
          )}

          {/* Version history */}
          <div>
            <h2 className="font-semibold text-[#1A1A2E] mb-3">Version History</h2>
            <VersionHistory versions={versions} currentVersionId={notice?.current_version_id || null} />
          </div>
        </>
      )}
    </div>
  )
}
