'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  CheckSquare, Settings, ClipboardList, Lock, AlertCircle,
  Globe, ArrowRight,
} from 'lucide-react'
import { ConsentConfig, ConsentPurpose } from '@/types/dpdp'
import ConsentStatsCard from '@/components/modules/consent/ConsentStatsCard'
import EmbedCodeSnippet from '@/components/modules/consent/EmbedCodeSnippet'

interface ManageResponse {
  config: ConsentConfig | null
  purposes: ConsentPurpose[]
}

interface OrgData {
  slug: string
  name: string
}

export default function ConsentPage() {
  const [manageData, setManageData] = useState<ManageResponse | null>(null)
  const [org, setOrg] = useState<OrgData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/consent/manage').then(r => r.json()),
      fetch('/api/organizations/me').then(r => r.json()),
    ]).then(([manage, orgRes]) => {
      if (!manage.error) setManageData(manage)
      if (!orgRes.error && orgRes.data) setOrg({ slug: orgRes.data.slug, name: orgRes.data.name })
    }).finally(() => setLoading(false))
  }, [])

  const isConfigured = !!manageData?.config

  if (loading) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="h-8 bg-gray-100 rounded w-64 animate-pulse mb-8" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[1,2,3,4].map(i => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#003366] flex items-center gap-2">
            <CheckSquare className="w-7 h-7" />
            Consent Management
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            DPDP Section 6 — Manage consent collection, track records, and configure your widget.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/consent/audit"
            className="flex items-center gap-1.5 text-sm px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <ClipboardList className="w-4 h-4" />
            Audit Log
          </Link>
          <Link
            href="/dashboard/consent/configure"
            className="flex items-center gap-1.5 text-sm px-4 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#1A5276] transition-colors"
          >
            <Settings className="w-4 h-4" />
            {isConfigured ? 'Edit Configuration' : 'Get Started'}
          </Link>
        </div>
      </div>

      {/* Status banner */}
      <div className={`rounded-xl border p-4 flex items-center gap-3 ${
        isConfigured
          ? 'bg-green-50 border-green-200'
          : 'bg-amber-50 border-amber-200'
      }`}>
        {isConfigured ? (
          <CheckSquare className="w-5 h-5 text-green-600 shrink-0" />
        ) : (
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
        )}
        <div>
          <p className={`font-semibold text-sm ${isConfigured ? 'text-green-800' : 'text-amber-800'}`}>
            {isConfigured
              ? `Widget Active — Version ${manageData?.config?.widget_version}`
              : 'Not Configured'}
          </p>
          <p className={`text-xs mt-0.5 ${isConfigured ? 'text-green-700' : 'text-amber-700'}`}>
            {isConfigured
              ? `${manageData?.purposes.length || 0} purposes defined · Languages: ${manageData?.config?.languages.join(', ').toUpperCase()}`
              : 'Set up your consent widget to start collecting DPDP-compliant consent.'}
          </p>
        </div>
        {isConfigured && (
          <Link
            href="/dashboard/consent/versions"
            className="ml-auto flex items-center gap-1 text-sm font-medium text-green-800 hover:underline shrink-0"
          >
            View history <ArrowRight className="w-4 h-4" />
          </Link>
        )}
        {!isConfigured && (
          <Link
            href="/dashboard/consent/configure"
            className="ml-auto flex items-center gap-1 text-sm font-medium text-amber-800 hover:underline"
          >
            Configure now <ArrowRight className="w-4 h-4" />
          </Link>
        )}
      </div>

      {/* Stats */}
      {isConfigured && <ConsentStatsCard />}

      {/* Embed code */}
      {isConfigured && org && <EmbedCodeSnippet orgSlug={org.slug} />}

      {/* Purposes list */}
      {isConfigured && manageData && manageData.purposes.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-[#1A1A2E]">Configured Purposes</h2>
            <Link
              href="/dashboard/consent/configure"
              className="text-sm text-[#003366] hover:underline"
            >
              Edit
            </Link>
          </div>
          <div className="space-y-2">
            {manageData.purposes.map(p => (
              <div
                key={p.purpose_key}
                className="flex items-center gap-3 p-3 rounded-lg bg-gray-50"
              >
                <div className={`w-2 h-2 rounded-full shrink-0 ${p.required ? 'bg-amber-500' : 'bg-green-500'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#1A1A2E]">{p.name_en}</p>
                  <p className="text-xs text-gray-500 truncate">{p.description_en}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {p.required ? (
                    <span className="flex items-center gap-1 text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                      <Lock className="w-3 h-3" />Required
                    </span>
                  ) : (
                    <span className="text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                      Optional
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Supported languages */}
      {isConfigured && manageData?.config && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-3">
            <Globe className="w-5 h-5 text-[#003366]" />
            <h2 className="font-semibold text-[#1A1A2E]">Languages</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {manageData.config.languages.map(code => (
              <span key={code} className="px-3 py-1 rounded-full text-sm bg-blue-50 text-[#003366] border border-blue-100">
                {code.toUpperCase()}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Not configured CTA */}
      {!isConfigured && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center">
          <CheckSquare className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <h3 className="font-semibold text-[#1A1A2E] mb-2">Set up Consent Management</h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto mb-4">
            Configure your consent widget to collect lawful consent from users visiting your website.
            Supports 22 Indian languages and WhatsApp consent flow.
          </p>
          <Link
            href="/dashboard/consent/configure"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#003366] text-white text-sm rounded-lg hover:bg-[#1A5276] transition-colors"
          >
            <Settings className="w-4 h-4" />
            Configure Widget
          </Link>
        </div>
      )}
    </div>
  )
}
