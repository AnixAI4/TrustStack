// Server-only: @react-pdf/renderer document for the DPDP-format ROPA register.
// Do NOT import this from a client component — it pulls in Node-only deps.
// The /api/ropa/export/pdf route calls renderRopaReportPdf().

import { Document, Page, Text, View, StyleSheet, renderToBuffer } from '@react-pdf/renderer'
import { DPDP_BASES, DATA_CATEGORIES, ROPA_SUBJECT_TYPES, ROPA_STATUS_LABELS } from '@/lib/constants'
import type { RopaEntry, RopaConsentCoverage } from '@/types/dpdp'

const NAVY = '#003366'
const ACCENT = '#2874A6'
const GRAY = '#6B7280'
const MUTED = '#9CA3AF'
const LIGHT = '#EEF2F7'
const GREEN = '#059669'
const AMBER = '#D97706'

const styles = StyleSheet.create({
  page: {
    paddingTop: 44,
    paddingBottom: 54,
    paddingHorizontal: 44,
    fontSize: 10,
    color: '#1A1A2E',
    fontFamily: 'Helvetica',
    lineHeight: 1.4,
  },
  eyebrow: { fontSize: 9, letterSpacing: 1, color: GRAY, fontFamily: 'Helvetica-Bold' },
  h1: { fontSize: 20, color: NAVY, marginTop: 6, fontFamily: 'Helvetica-Bold' },
  sub: { fontSize: 9, color: GRAY, marginTop: 3 },
  headerRule: { borderBottomWidth: 2, borderBottomColor: NAVY, paddingBottom: 12, marginBottom: 16 },

  summaryRow: { flexDirection: 'row', marginBottom: 18, gap: 10 },
  summaryCard: { flex: 1, borderWidth: 1, borderColor: LIGHT, borderRadius: 8, padding: 10 },
  summaryNum: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: NAVY },
  summaryLabel: { fontSize: 8, color: GRAY, marginTop: 2 },

  block: {
    borderWidth: 1,
    borderColor: LIGHT,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  blockHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  activityName: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: NAVY, flex: 1, paddingRight: 8 },
  badge: { fontSize: 8, fontFamily: 'Helvetica-Bold', paddingVertical: 2, paddingHorizontal: 6, borderRadius: 4 },
  desc: { fontSize: 9, color: '#374151', marginBottom: 8, lineHeight: 1.5 },

  fieldRow: { flexDirection: 'row', marginBottom: 4 },
  fieldLabel: { width: '28%', fontSize: 9, color: GRAY, fontFamily: 'Helvetica-Bold' },
  fieldValue: { width: '72%', fontSize: 9, color: '#1A1A2E' },

  footer: {
    position: 'absolute',
    bottom: 24,
    left: 44,
    right: 44,
    textAlign: 'center',
    fontSize: 8,
    color: MUTED,
    borderTopWidth: 1,
    borderTopColor: LIGHT,
    paddingTop: 8,
  },
})

const basisLabel = (id: string) => DPDP_BASES.find(b => b.id === id)?.label ?? id
const categoryLabel = (key: string) => DATA_CATEGORIES.find(c => c.key === key)?.label ?? key
const subjectLabel = (v: string) => ROPA_SUBJECT_TYPES.find(s => s.value === v)?.label ?? v
const statusLabel = (s: string) => ROPA_STATUS_LABELS[s] ?? s

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function statusColor(status: string): { bg: string; color: string } {
  if (status === 'active')   return { bg: '#ECFDF5', color: GREEN }
  if (status === 'archived') return { bg: '#F3F4F6', color: GRAY }
  return { bg: '#FFFBEB', color: AMBER } // draft
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.fieldRow}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value || '—'}</Text>
    </View>
  )
}

function ActivityBlock({ entry, coverage }: { entry: RopaEntry; coverage?: RopaConsentCoverage }) {
  const sc = statusColor(entry.status)
  const consentText =
    !coverage || coverage.status === 'not_applicable'
      ? 'N/A (not consent-based)'
      : coverage.status === 'configured'
        ? `Configured ✓${coverage.matched_purposes.length ? ` (${coverage.matched_purposes.join(', ')})` : ''}`
        : 'Missing — no matching consent purpose'

  return (
    <View style={styles.block} wrap={false}>
      <View style={styles.blockHead}>
        <Text style={styles.activityName}>{entry.activity_name}</Text>
        <Text style={[styles.badge, { backgroundColor: sc.bg, color: sc.color }]}>{statusLabel(entry.status).toUpperCase()}</Text>
      </View>
      {entry.activity_description ? <Text style={styles.desc}>{entry.activity_description}</Text> : null}

      <Field label="Data Controller" value={entry.data_controller_name} />
      <Field label="Data Subjects" value={(entry.data_subject_types ?? []).map(subjectLabel).join(', ')} />
      <Field label="Data Categories" value={(entry.data_categories ?? []).map(categoryLabel).join(', ')} />
      <Field label="Purposes" value={(entry.processing_purposes ?? []).join('; ')} />
      <Field label="Legal Basis" value={basisLabel(entry.legal_basis)} />
      {entry.data_sources?.length ? <Field label="Data Sources" value={entry.data_sources.join(', ')} /> : null}
      {entry.recipients?.length ? <Field label="Recipients" value={entry.recipients.join(', ')} /> : null}
      {entry.processor_names?.length ? <Field label="Processors" value={entry.processor_names.join(', ')} /> : null}
      <Field
        label="Cross-Border"
        value={entry.cross_border_transfer ? `Yes${entry.transfer_countries?.length ? ` → ${entry.transfer_countries.join(', ')}` : ''}` : 'No'}
      />
      <Field label="Retention" value={entry.retention_period ?? ''} />
      {entry.security_measures?.length ? <Field label="Security Measures" value={entry.security_measures.join(', ')} /> : null}
      <Field
        label="DPO Approval"
        value={entry.dpo_approved ? `Approved${entry.dpo_approved_at ? ` on ${fmtDate(entry.dpo_approved_at)}` : ''}` : 'Pending'}
      />
      <Field label="Consent Coverage" value={consentText} />
    </View>
  )
}

function Footer({ generatedAt }: { generatedAt: string }) {
  return (
    <Text style={styles.footer} fixed>
      Record of Processing Activities · Generated by TrustStack™ | {fmtDate(generatedAt)} | Confidential
    </Text>
  )
}

export interface RopaReportInput {
  orgName: string
  generatedAt: string
  entries: RopaEntry[]
  coverage: Record<string, RopaConsentCoverage>
}

function RopaRegisterDocument({ orgName, generatedAt, entries, coverage }: RopaReportInput) {
  const active   = entries.filter(e => e.status === 'active').length
  const draft    = entries.filter(e => e.status === 'draft').length
  const archived = entries.filter(e => e.status === 'archived').length

  return (
    <Document title={`ROPA Register — ${orgName}`} author="TrustStack™" subject="DPDP Record of Processing Activities">
      <Page size="A4" style={styles.page} wrap>
        <View style={styles.headerRule}>
          <Text style={styles.eyebrow}>RECORD OF PROCESSING ACTIVITIES (ROPA)</Text>
          <Text style={styles.h1}>{orgName}</Text>
          <Text style={styles.sub}>DPDP Act, 2023 — processing register · Generated {fmtDate(generatedAt)}</Text>
        </View>

        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryNum}>{entries.length}</Text>
            <Text style={styles.summaryLabel}>Total Activities</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={[styles.summaryNum, { color: GREEN }]}>{active}</Text>
            <Text style={styles.summaryLabel}>Active</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={[styles.summaryNum, { color: AMBER }]}>{draft}</Text>
            <Text style={styles.summaryLabel}>Draft</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={[styles.summaryNum, { color: GRAY }]}>{archived}</Text>
            <Text style={styles.summaryLabel}>Archived</Text>
          </View>
        </View>

        {entries.length === 0 ? (
          <Text style={{ fontSize: 11, color: GRAY }}>No processing activities recorded yet.</Text>
        ) : (
          entries.map(e => <ActivityBlock key={e.id} entry={e} coverage={coverage[e.id]} />)
        )}

        <Footer generatedAt={generatedAt} />
      </Page>
    </Document>
  )
}

export async function renderRopaReportPdf(input: RopaReportInput): Promise<Buffer> {
  return renderToBuffer(<RopaRegisterDocument {...input} />)
}
