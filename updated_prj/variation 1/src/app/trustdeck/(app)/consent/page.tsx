'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  CheckSquare, Settings, ClipboardList, Lock,
  ArrowRight,
} from 'lucide-react'
import { ConsentConfig, ConsentPurpose, ConsentStats } from '@/types/dpdp'
import { ConsentStatsCard } from '@/components/platform/modules/consent/ConsentStatsCard'
import { ModulePageHeader, ModulePanel, ModulePanelHeader, ModulePageSkeleton } from '@/components/platform/ui/ModulePageHeader'
import { ModulePage } from '@/components/platform/ui/ModulePage'
import { ModuleNotice } from '@/components/platform/ui/ModuleNotice'

interface ManageResponse {
  config: ConsentConfig | null
  purposes: ConsentPurpose[]
}

export default function ConsentPage() {
  const [manageData, setManageData] = useState<ManageResponse | null>(null)
  const [stats, setStats] = useState<ConsentStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    Promise.all([
      fetch('/api/trustdeck/consent/manage').then(r => r.json()),
      fetch('/api/trustdeck/consent/stats').then(r => r.json()),
    ]).then(([manage, statsRes]) => {
      if (cancelled) return
      if (!manage.error) setManageData(manage)
      if (!statsRes.error) setStats(statsRes as ConsentStats)
    }).finally(() => {
      if (!cancelled) setLoading(false)
    })
    return () => { cancelled = true }
  }, [])

  const isConfigured = !!manageData?.config

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <ModulePageHeader
        eyebrow="DPDP Section 6"
        title="Consent Management"
        description="Manage consent collection, track records, and configure your widget."
        action={
          <>
            <Link
              href="/trustdeck/consent/audit"
              className="btn btn-ghost inline-flex min-h-11 items-center gap-1.5"
            >
              <ClipboardList className="h-4 w-4" />
              Audit Log
            </Link>
            <Link
              href="/trustdeck/consent/configure"
              className="btn btn-accent inline-flex min-h-11 items-center gap-1.5"
            >
              <Settings className="h-4 w-4" />
              {isConfigured ? 'Edit Configuration' : 'Get Started'}
            </Link>
          </>
        }
      />

      {loading ? (
        <ModulePageSkeleton cards={4} showHeader={false} className="max-w-none" />
      ) : (
        <ModulePage className="space-y-6">
          {isConfigured && (
            <ModuleNotice
              tone="green"
              icon={<CheckSquare className="h-5 w-5" />}
              eyebrow="Live configuration"
              title={`Widget active · Version ${manageData?.config?.widget_version}`}
              description={`${manageData?.purposes.length || 0} purposes defined · Languages: ${manageData?.config?.languages.join(', ').toUpperCase()}`}
              action={
              <Link
                href="/trustdeck/consent/versions"
                className="inline-flex min-h-10 items-center gap-1 self-start text-sm font-semibold text-accent transition-colors hover:text-accent-soft sm:self-auto"
              >
                View history <ArrowRight className="h-4 w-4" />
              </Link>
              }
            />
          )}

          {isConfigured && stats && <ConsentStatsCard stats={stats} />}

          {isConfigured && manageData && manageData.purposes.length > 0 && (
            <ModulePanel>
              <ModulePanelHeader
                title="Configured Purposes"
                action={
                  <Link
                    href="/trustdeck/consent/configure"
                    className="text-sm font-semibold text-accent transition-colors hover:text-accent-soft"
                  >
                    Edit
                  </Link>
                }
              />
              <div className="divide-y divide-line">
                {manageData.purposes.map(p => (
                  <div
                    key={p.purpose_key}
                    className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-glass/50"
                  >
                    <div className={`h-2 w-2 shrink-0 rounded-full ${p.required ? 'bg-amber' : 'bg-green'}`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-text">{p.name_en}</p>
                      <p className="truncate text-xs text-text-muted">{p.description_en}</p>
                    </div>
                    <div className="shrink-0">
                      {p.required ? (
                        <span className="inline-flex items-center gap-1 rounded-pill border border-amber/20 bg-amber/10 px-2 py-0.5 text-xs text-amber">
                          <Lock className="h-3 w-3" />Required
                        </span>
                      ) : (
                        <span className="rounded-pill border border-green/20 bg-green/10 px-2 py-0.5 text-xs text-green">
                          Optional
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ModulePanel>
          )}

          {isConfigured && manageData?.config && (
            <ModulePanel>
              <ModulePanelHeader title="Languages" />
              <div className="flex flex-wrap gap-2 px-5 py-4">
                {manageData.config.languages.map(code => (
                  <span
                    key={code}
                    className="rounded-pill border border-accent/20 bg-accent/8 px-3 py-1 text-sm font-medium text-accent"
                  >
                    {code.toUpperCase()}
                  </span>
                ))}
              </div>
            </ModulePanel>
          )}

          {!isConfigured && (
            <ModulePanel>
              <div className="grid lg:grid-cols-[minmax(0,1.15fr)_minmax(19rem,0.85fr)]">
                <div className="p-6 sm:p-8">
                  <span className="grid h-12 w-12 place-items-center rounded-xl border border-accent/15 bg-accent/10 text-accent shadow-sm">
                    <CheckSquare className="h-6 w-6" />
                  </span>
                  <p className="mt-6 font-mono text-label font-semibold uppercase tracking-[var(--tracking-label)] text-accent">Consent foundation</p>
                  <h2 className="mt-2 max-w-xl font-display text-2xl font-semibold leading-tight text-text">Launch a consent experience that is clear, auditable, and multilingual</h2>
                  <p className="mt-3 max-w-xl text-sm leading-relaxed text-text-muted">
                    Define lawful purposes once, publish the widget to your channels, and keep every consent event in a searchable audit trail.
                  </p>
                  <Link href="/trustdeck/consent/configure" className="btn btn-accent mt-6 inline-flex items-center gap-2">
                    <Settings className="h-4 w-4" /> Configure consent
                  </Link>
                </div>
                <div className="border-t border-line bg-surface-2/25 p-6 lg:border-l lg:border-t-0 sm:p-8">
                  <p className="font-mono text-label font-semibold uppercase tracking-[var(--tracking-label)] text-text-faint">Three steps to go live</p>
                  <ol className="mt-5 space-y-5">
                    {[
                      ['01', 'Define purposes', 'Set required and optional processing purposes.'],
                      ['02', 'Choose channels', 'Configure languages, placement, and WhatsApp flow.'],
                      ['03', 'Publish and audit', 'Embed the widget and monitor consent records.'],
                    ].map(([number, title, description]) => (
                      <li key={number} className="flex gap-3">
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-line bg-bg-2 font-mono text-xs font-semibold text-accent shadow-sm">{number}</span>
                        <div><p className="text-sm font-semibold text-text">{title}</p><p className="mt-0.5 text-xs leading-relaxed text-text-muted">{description}</p></div>
                      </li>
                    ))}
                  </ol>
                  <p className="mt-6 border-t border-line pt-4 text-xs text-text-faint"><Lock className="mr-1.5 inline h-3.5 w-3.5" />Supports 22 Indian languages and versioned consent records.</p>
                </div>
              </div>
            </ModulePanel>
          )}
        </ModulePage>
      )}
    </div>
  )
}
