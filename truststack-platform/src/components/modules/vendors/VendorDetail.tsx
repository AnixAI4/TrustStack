'use client'

import { useState } from 'react'
import {
  Globe, Mail, User, MapPin, ShieldCheck, Sparkles, Send, Copy, Check,
  Pencil, Trash2, FileSignature, ClipboardList, AlertTriangle, ExternalLink,
} from 'lucide-react'
import { VendorStatusBadge } from './VendorStatusBadge'
import { VendorRiskBadge } from './VendorRiskBadge'
import { DpaExpiryIndicator } from './DpaExpiryIndicator'
import { DpaPreview } from './DpaPreview'
import { VendorFormModal } from './VendorFormModal'
import { VENDOR_TYPES, DATA_CATEGORIES } from '@/lib/constants'
import { VENDOR_QUESTION_SECTIONS, vendorQuestionsForSection, type VendorQuestion } from '@/lib/vendors/questionnaire'
import { effectiveDpaStatus, dpaNeedsAttention } from '@/lib/vendors/status'
import type { Vendor, VendorQuestionnaireResponse, VendorDpaStatus } from '@/types/dpdp'

interface Props {
  vendor: Vendor
  responses: VendorQuestionnaireResponse[]
  onUpdate: (v: Vendor) => void
  onDeleted: () => void
}

const inputClass =
  'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]'

function typeLabel(v: string) { return VENDOR_TYPES.find(t => t.value === v)?.label ?? v }
function categoryLabel(k: string) { return DATA_CATEGORIES.find(c => c.key === k)?.label ?? k }
function toDateInput(iso: string | null): string { return iso ? iso.slice(0, 10) : '' }
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
}

// Human-readable answer for a stored questionnaire response.
function answerLabel(q: VendorQuestion, answer: string): string {
  if (q.type === 'select') return q.options?.find(o => o.value === answer)?.label ?? answer
  const a = answer.toLowerCase()
  if (a === 'yes') return 'Yes'
  if (a === 'no') return 'No'
  if (a === 'partial') return 'Partial'
  return answer
}

export function VendorDetail({ vendor, responses, onUpdate, onDeleted }: Props) {
  const [signedAt, setSignedAt]     = useState(toDateInput(vendor.dpa_signed_at))
  const [expiresAt, setExpiresAt]   = useState(toDateInput(vendor.dpa_expires_at))
  const [docUrl, setDocUrl]         = useState(vendor.dpa_document_url ?? '')
  const [saving, setSaving]         = useState(false)
  const [busy, setBusy]             = useState<string | null>(null)
  const [error, setError]           = useState<string | null>(null)
  const [editing, setEditing]       = useState(false)

  // DPA generation
  const [dpaText, setDpaText]       = useState<string | null>(null)
  const [showDpa, setShowDpa]       = useState(false)

  // Send questionnaire
  const [qLink, setQLink]           = useState<string | null>(null)
  const [qNotice, setQNotice]       = useState<string | null>(null)
  const [copied, setCopied]         = useState(false)

  const effective = effectiveDpaStatus(vendor)
  const attention = dpaNeedsAttention(vendor)
  const respMap = new Map(responses.map(r => [r.question_id, r.answer]))

  async function patch(updates: Record<string, unknown>, label?: string) {
    setBusy(label ?? 'save')
    setError(null)
    try {
      const res = await fetch(`/api/vendors/${vendor.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'Update failed'); return }
      onUpdate(json.data as Vendor)
    } catch {
      setError('Network error — please try again.')
    } finally {
      setBusy(null)
    }
  }

  async function saveDpaDetails() {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/vendors/${vendor.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dpa_signed_at: signedAt ? new Date(signedAt).toISOString() : null,
          dpa_expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
          dpa_document_url: docUrl.trim() || null,
        }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'Update failed'); return }
      onUpdate(json.data as Vendor)
    } catch {
      setError('Network error — please try again.')
    } finally {
      setSaving(false)
    }
  }

  async function setStatus(status: VendorDpaStatus) {
    const updates: Record<string, unknown> = { dpa_status: status }
    if (status === 'signed' && !signedAt) {
      const today = new Date().toISOString()
      updates.dpa_signed_at = today
      setSignedAt(toDateInput(today))
    }
    await patch(updates, `status-${status}`)
  }

  async function generateDpa() {
    setBusy('dpa')
    setError(null)
    try {
      const res = await fetch(`/api/vendors/${vendor.id}/dpa`, { method: 'POST' })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'Failed to generate DPA'); return }
      setDpaText(json.dpa as string)
      setShowDpa(true)
    } catch {
      setError('Network error while generating — please try again.')
    } finally {
      setBusy(null)
    }
  }

  async function sendQuestionnaire() {
    setBusy('send')
    setError(null)
    setQNotice(null)
    try {
      const res = await fetch(`/api/vendors/${vendor.id}/send-questionnaire`, { method: 'POST' })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'Failed to send questionnaire'); return }
      setQLink(json.link as string)
      setQNotice(json.message as string)
      if (json.success) onUpdate({ ...vendor, dpa_status: vendor.dpa_status === 'pending' ? 'sent' : vendor.dpa_status })
    } catch {
      setError('Network error — please try again.')
    } finally {
      setBusy(null)
    }
  }

  async function copyLink() {
    if (!qLink) return
    try { await navigator.clipboard.writeText(qLink); setCopied(true); setTimeout(() => setCopied(false), 2000) } catch { /* ignore */ }
  }

  async function remove() {
    if (!confirm(`Delete ${vendor.name}? This also removes its questionnaire responses.`)) return
    setBusy('delete')
    try {
      const res = await fetch(`/api/vendors/${vendor.id}`, { method: 'DELETE' })
      if (res.ok) { onDeleted(); return }
      const json = await res.json()
      setError(json.error ?? 'Delete failed')
    } catch {
      setError('Network error — please try again.')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-lg font-bold text-[#1A1A2E]">{vendor.name}</h2>
            <VendorStatusBadge status={effective} />
            <VendorRiskBadge tier={vendor.risk_tier} score={vendor.risk_score} showScore />
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {typeLabel(vendor.vendor_type)} · Added {fmtDate(vendor.created_at)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DpaExpiryIndicator status={vendor.dpa_status} expiresAt={vendor.dpa_expires_at} variant="inline" />
          <button onClick={() => setEditing(true)} className="inline-flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
            <Pencil size={13} /> Edit
          </button>
          <button onClick={remove} disabled={busy === 'delete'} className="inline-flex items-center gap-1 px-3 py-1.5 text-sm border border-red-200 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50">
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Attention banner */}
      {attention && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">
          <AlertTriangle size={16} className="text-red-500 shrink-0" />
          <span className="text-sm text-red-800">
            {effective === 'expired'
              ? 'This DPA has expired. Renew it and update the signing dates to stay compliant.'
              : 'This DPA expires within 30 days. Begin renewal now.'}
          </span>
        </div>
      )}

      {/* Vendor info */}
      <div className="bg-gray-50 rounded-xl p-5">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Vendor Details</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          {vendor.website && (
            <Field icon={<Globe size={14} />} label="Website">
              <a href={vendor.website} target="_blank" rel="noopener noreferrer" className="text-[#2874A6] hover:underline break-all">{vendor.website}</a>
            </Field>
          )}
          {vendor.contact_name && <Field icon={<User size={14} />} label="Contact">{vendor.contact_name}</Field>}
          {vendor.contact_email && <Field icon={<Mail size={14} />} label="Contact Email"><span className="break-all">{vendor.contact_email}</span></Field>}
          <Field icon={<MapPin size={14} />} label="Data Residency">
            {vendor.india_data_residency
              ? <span className="text-green-700">India ✓</span>
              : <span className="text-gray-600">{(vendor.data_location ?? []).join(', ') || 'Not confirmed in India'}</span>}
          </Field>
        </div>
        {vendor.personal_data_categories && vendor.personal_data_categories.length > 0 && (
          <div className="mt-3">
            <span className="text-xs text-gray-400">Personal data processed</span>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {vendor.personal_data_categories.map(c => (
                <span key={c} className="text-xs bg-[#D6E4F0] text-[#003366] px-2 py-0.5 rounded-full">{categoryLabel(c)}</span>
              ))}
            </div>
          </div>
        )}
        {vendor.notes && <p className="text-sm text-gray-600 mt-3 whitespace-pre-wrap">{vendor.notes}</p>}
      </div>

      {/* Risk + questionnaire */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Risk Assessment</p>
          <div className="flex items-center gap-2">
            <button
              onClick={sendQuestionnaire}
              disabled={busy === 'send'}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border border-[#003366] text-[#003366] rounded-lg hover:bg-[#D6E4F0] transition-colors disabled:opacity-50"
            >
              <Send size={13} /> {busy === 'send' ? 'Sending…' : vendor.questionnaire_completed ? 'Re-send Questionnaire' : 'Send Questionnaire'}
            </button>
          </div>
        </div>

        {vendor.questionnaire_completed ? (
          <div className="flex items-center gap-3 bg-green-50 border border-green-100 rounded-lg px-4 py-3 mb-4">
            <ShieldCheck size={18} className="text-green-600 shrink-0" />
            <div>
              <p className="text-sm text-green-800">
                Questionnaire completed{vendor.questionnaire_completed_at ? ` on ${fmtDate(vendor.questionnaire_completed_at)}` : ''}.
                Risk score <strong>{vendor.risk_score}/100</strong> (<VendorRiskBadgeInline tier={vendor.risk_tier} />).
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 bg-amber-50 border border-amber-100 rounded-lg px-4 py-3 mb-4">
            <ClipboardList size={18} className="text-amber-600 shrink-0" />
            <p className="text-sm text-amber-800">
              No questionnaire completed yet. Send the 45-question DPDP questionnaire to compute an automated risk score.
            </p>
          </div>
        )}

        {qNotice && (
          <div className="text-sm text-[#003366] bg-[#D6E4F0]/50 border border-[#D6E4F0] rounded-lg px-3 py-2 mb-3">
            <p>{qNotice}</p>
            {qLink && (
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <code className="text-xs bg-white border border-gray-200 rounded px-2 py-1 text-gray-700 break-all">{qLink}</code>
                <button onClick={copyLink} className="inline-flex items-center gap-1 text-xs text-[#003366] hover:underline">
                  {copied ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy link</>}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Responses by section */}
        {responses.length > 0 && (
          <div className="space-y-4 mt-4">
            {VENDOR_QUESTION_SECTIONS.map(section => {
              const qs = vendorQuestionsForSection(section.key).filter(q => respMap.has(q.id))
              if (qs.length === 0) return null
              return (
                <div key={section.key}>
                  <p className="text-xs font-semibold text-gray-500 mb-1.5">{section.label}</p>
                  <div className="space-y-1">
                    {qs.map(q => (
                      <div key={q.id} className="flex items-start justify-between gap-3 text-sm border-b border-gray-50 py-1.5">
                        <span className="text-gray-600">{q.text}</span>
                        <span className="font-medium text-[#1A1A2E] shrink-0">{answerLabel(q, respMap.get(q.id)!)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* DPA workflow */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Data Processing Agreement</p>
          <button
            onClick={generateDpa}
            disabled={busy === 'dpa'}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-[#2874A6] text-white rounded-lg hover:bg-[#003366] transition-colors disabled:opacity-50"
          >
            <Sparkles size={14} /> {busy === 'dpa' ? 'Generating…' : 'Generate DPA with AI'}
          </button>
        </div>

        {/* Status quick-actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-gray-500">Mark as:</span>
          {(['pending', 'sent', 'signed', 'expired'] as VendorDpaStatus[]).map(s => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              disabled={busy === `status-${s}` || vendor.dpa_status === s}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors disabled:opacity-40 ${
                vendor.dpa_status === s ? 'bg-[#003366] text-white border-[#003366]' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {busy === `status-${s}` ? '…' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        {/* DPA dates + doc */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Signed date</label>
            <input type="date" value={signedAt} onChange={e => setSignedAt(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Expiry date</label>
            <input type="date" value={expiresAt} onChange={e => setExpiresAt(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Signed document URL</label>
            <input value={docUrl} onChange={e => setDocUrl(e.target.value)} placeholder="https://…" className={inputClass} />
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={saveDpaDetails}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-[#003366] text-white rounded-lg hover:bg-[#1A5276] transition-colors disabled:opacity-50"
          >
            <FileSignature size={14} /> {saving ? 'Saving…' : 'Save DPA Details'}
          </button>
          {vendor.dpa_document_url && (
            <a href={vendor.dpa_document_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-[#2874A6] hover:underline">
              <ExternalLink size={13} /> View signed document
            </a>
          )}
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {dpaText && <DpaPreview open={showDpa} onClose={() => setShowDpa(false)} dpa={dpaText} vendorName={vendor.name} />}
      <VendorFormModal open={editing} onClose={() => setEditing(false)} vendor={vendor} onSaved={v => { onUpdate(v); setEditing(false) }} />
    </div>
  )
}

function Field({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div>
      <span className="flex items-center gap-1.5 text-gray-400 text-xs">{icon} {label}</span>
      <p className="font-medium text-[#1A1A2E] mt-0.5">{children}</p>
    </div>
  )
}

// Tiny inline tier label for the completed banner (no chip styling).
function VendorRiskBadgeInline({ tier }: { tier: Vendor['risk_tier'] }) {
  if (!tier) return <span>unrated</span>
  return <span className="capitalize">{tier} risk</span>
}
