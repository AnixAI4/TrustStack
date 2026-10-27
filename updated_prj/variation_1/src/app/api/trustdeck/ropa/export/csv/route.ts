import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requirePlatformOrg } from '@/lib/platform/org'
import { DPDP_BASES, DATA_CATEGORIES, ROPA_SUBJECT_TYPES, ROPA_STATUS_LABELS } from '@/lib/platform/constants'
import { buildCoverageMap } from '@/lib/platform/ropa/consent'
import type { RopaEntry, ConsentPurpose, RopaConsentCoverage } from '@/types/dpdp'

// GET (auth) - exports the org's ROPA register as CSV (opens in Excel). Hand-rolled,
// NO xlsx dependency (keeps npm audit at 0). Server-derived, streamed as a download.

const basisLabel = (id: string) => DPDP_BASES.find(b => b.id === id)?.label ?? id
const categoryLabel = (key: string) => DATA_CATEGORIES.find(c => c.key === key)?.label ?? key
const subjectLabel = (v: string) => ROPA_SUBJECT_TYPES.find(s => s.value === v)?.label ?? v
const statusLabel = (s: string) => ROPA_STATUS_LABELS[s] ?? s

// RFC-4180 field escaping: wrap in quotes when the value contains a comma, quote,
// CR or LF; double any embedded quotes.
function csvCell(value: string): string {
  if (/[",\r\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`
  return value
}

function coverageText(c: RopaConsentCoverage | undefined): string {
  if (!c || c.status === 'not_applicable') return 'N/A (not consent-based)'
  if (c.status === 'configured') return c.matched_purposes.length ? `Configured: ${c.matched_purposes.join('; ')}` : 'Configured'
  return 'Missing'
}

const HEADERS = [
  'Activity Name', 'Description', 'Data Controller', 'Data Subjects', 'Data Categories',
  'Processing Purposes', 'Legal Basis', 'Data Sources', 'Recipients', 'Processors',
  'Cross-Border Transfer', 'Transfer Countries', 'Retention Period', 'Security Measures',
  'Status', 'DPO Approved', 'DPO Approved At', 'Last Reviewed At', 'Consent Coverage', 'Created At',
]

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const ctx = await requirePlatformOrg(supabase, user.id)
    if (!ctx.ok) return NextResponse.json({ error: ctx.error }, { status: ctx.status })

    const [{ data: org }, { data: entriesData }, { data: purposes }] = await Promise.all([
      supabase.from('organizations').select('name').eq('id', ctx.organizationId).single(),
      supabase
        .from('ropa_entries')
        .select('*')
        .eq('organization_id', ctx.organizationId)
        .order('status', { ascending: true })
        .order('created_at', { ascending: false })
        .limit(2000),
      supabase
        .from('consent_purposes')
        .select('name_en, description_en, purpose_key')
        .eq('organization_id', ctx.organizationId),
    ])

    const entries = (entriesData ?? []) as RopaEntry[]
    const coverage = buildCoverageMap(entries, (purposes ?? []) as Pick<ConsentPurpose, 'name_en' | 'description_en' | 'purpose_key'>[])

    const lines: string[] = [HEADERS.map(csvCell).join(',')]
    for (const e of entries) {
      const row = [
        e.activity_name,
        e.activity_description ?? '',
        e.data_controller_name,
        (e.data_subject_types ?? []).map(subjectLabel).join('; '),
        (e.data_categories ?? []).map(categoryLabel).join('; '),
        (e.processing_purposes ?? []).join('; '),
        basisLabel(e.legal_basis),
        (e.data_sources ?? []).join('; '),
        (e.recipients ?? []).join('; '),
        (e.processor_names ?? []).join('; '),
        e.cross_border_transfer ? 'Yes' : 'No',
        (e.transfer_countries ?? []).join('; '),
        e.retention_period ?? '',
        (e.security_measures ?? []).join('; '),
        statusLabel(e.status),
        e.dpo_approved ? 'Yes' : 'No',
        e.dpo_approved_at ?? '',
        e.last_reviewed_at ?? '',
        coverageText(coverage[e.id]),
        e.created_at,
      ]
      lines.push(row.map(v => csvCell(String(v))).join(','))
    }

    // Prepend a UTF-8 BOM so Excel renders non-ASCII (₹, names) correctly.
    const csv = '﻿' + lines.join('\r\n')

    const safeName = (org?.name ?? 'organization').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40)
    const filename = `truststack-ropa-register-${safeName || 'org'}.csv`

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    console.error('[ROPA] CSV export error:', error)
    return NextResponse.json({ error: 'Failed to generate CSV' }, { status: 500 })
  }
}
