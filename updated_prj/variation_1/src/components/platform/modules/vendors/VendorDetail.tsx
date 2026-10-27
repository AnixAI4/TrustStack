'use client'

import { useState } from 'react'
import { ExternalLink, FileText, Send, Trash2 } from 'lucide-react'
import { VendorStatusBadge } from './VendorStatusBadge'
import { VendorRiskBadge } from './VendorRiskBadge'
import { DpaExpiryIndicator } from './DpaExpiryIndicator'
import { DpaPreview } from './DpaPreview'
import { VendorFormModal } from './VendorFormModal'
import { VENDOR_TYPES, DATA_CATEGORIES } from '@/lib/platform/constants'
import { VENDOR_QUESTION_SECTIONS, vendorQuestionsForSection, type VendorQuestion } from '@/lib/platform/vendors/questionnaire'
import { effectiveDpaStatus, dpaNeedsAttention } from '@/lib/platform/vendors/status'
import type { Vendor, VendorQuestionnaireResponse } from '@/types/dpdp'

interface Props {
  vendor: Vendor
  responses: VendorQuestionnaireResponse[]
  onUpdate: (updated: Vendor) => void
  onDeleted: () => void
}

function typeLabel(v: string): string {
  return VENDOR_TYPES.find(t => t.value === v)?.label ?? v
}
function categoryLabel(key: string): string {
  return DATA_CATEGORIES.find(c => c.key === key)?.label ?? key
}
function fmtDate(d: string): string {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
}

const labelCls = 'text-xs font-semibold text-text-muted uppercase tracking-wider'

export function VendorDetail({ vendor, responses, onUpdate, onDeleted }: Props) {
  const [editing, setEditing]             = useState(false)
  const [showDpaPreview, setShowDpaPreview] = useState(false)
  const [dpaContent, setDpaContent]       = useState('')
  const [questionnaireLink, setQuestionnaireLink] = useState('')
  const [saving, setSaving]               = useState(false)
  const [error, setError]                 = useState<string | null>(null)

  const status = effectiveDpaStatus(vendor)
  const questionnaire = Object.fromEntries(
    responses.map(response => [response.question_id, response.answer])
  )
  const hasQuestionnaire = vendor.questionnaire_completed || responses.length > 0

  async function patch(updates: Record<string, unknown>) {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/trustdeck/vendors/${vendor.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'Failed to update'); return }
      onUpdate(json.data as Vendor)
    } catch {
      setError('Network error - please try again.')
    } finally {
      setSaving(false)
    }
  }

  async function handleEdit(data: Partial<Vendor>) {
    await patch(data)
    setEditing(false)
  }

  async function sendQuestionnaire() {
    if (!vendor.contact_email) { setError('Vendor contact email is required.'); return }
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/trustdeck/vendors/${vendor.id}/send-questionnaire`, { method: 'POST' })
      const json = await res.json() as { error?: string; link?: string }
      if (!res.ok) { setError(json.error ?? 'Failed to send questionnaire'); return }
      setQuestionnaireLink(json.link ?? '')
      if (vendor.dpa_status === 'pending') onUpdate({ ...vendor, dpa_status: 'sent' })
    } catch {
      setError('Network error - please try again.')
    } finally {
      setSaving(false)
    }
  }

  async function generateDpa() {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/trustdeck/vendors/${vendor.id}/dpa`, { method: 'POST' })
      const json = await res.json() as { error?: string; dpa?: string }
      if (!res.ok || !json.dpa) { setError(json.error ?? 'Failed to generate DPA'); return }
      setDpaContent(json.dpa)
      setShowDpaPreview(true)
    } catch {
      setError('Network error - please try again.')
    } finally {
      setSaving(false)
    }
  }

  async function deleteVendor() {
    if (!window.confirm(`Delete ${vendor.name}? This also removes its questionnaire responses.`)) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/trustdeck/vendors/${vendor.id}`, { method: 'DELETE' })
      const json = await res.json() as { error?: string }
      if (!res.ok) { setError(json.error ?? 'Failed to delete vendor'); return }
      onDeleted()
    } catch {
      setError('Network error - please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-xl font-bold text-accent">{vendor.name}</h2>
          <p className="text-xs text-text-faint mt-1">{typeLabel(vendor.vendor_type)}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <VendorRiskBadge risk={vendor.risk_tier} />
          <VendorStatusBadge status={status} />
        </div>
      </div>

      {/* Warning banner */}
      {dpaNeedsAttention(vendor) && (
        <div className="rounded-lg border border-amber/25 bg-amber/[0.07] px-4 py-3 text-sm text-amber">
          DPA requires attention - please ensure a valid agreement is in place before sharing data.
        </div>
      )}

      {/* Basic info */}
      <div className="space-y-4 rounded-xl bg-glass p-4 sm:p-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div>
            <p className={labelCls}>Website</p>
            {vendor.website ? (
              <a href={vendor.website} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex max-w-full items-center gap-1 break-all text-brand hover:text-accent">
                <span className="min-w-0">{vendor.website.replace(/^https?:\/\//, '')}</span> <ExternalLink size={12} className="shrink-0" />
              </a>
            ) : (
              <p className="text-text-faint mt-1"> - </p>
            )}
          </div>
          <div>
            <p className={labelCls}>Contact</p>
            <p className="font-medium text-text mt-1">{vendor.contact_name || ' - '}</p>
            {vendor.contact_email && <p className="text-xs text-text-muted">{vendor.contact_email}</p>}
          </div>
          <div>
            <p className={labelCls}>Added</p>
            <p className="font-medium text-text mt-1">{fmtDate(vendor.created_at)}</p>
          </div>
        </div>
        {vendor.personal_data_categories?.length ? (
          <div>
            <p className={labelCls}>Data categories shared</p>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {vendor.personal_data_categories.map(c => (
                <span key={c} className="text-xs bg-accent/15 text-accent px-2 py-0.5 rounded-full">{categoryLabel(c)}</span>
              ))}
            </div>
          </div>
        ) : null}
        {vendor.data_location?.length ? (
          <div>
            <p className={labelCls}>Data locations</p>
            <p className="mt-1 text-sm text-text">{vendor.data_location.join(', ')}</p>
            <p className="mt-1 text-xs text-text-faint">
              {vendor.india_data_residency ? 'India data residency available' : 'No India residency confirmed'}
            </p>
          </div>
        ) : null}
        <div className="flex flex-col gap-2 sm:flex-row">
          <button onClick={() => setEditing(true)} className="min-h-11 rounded-lg px-3 text-sm font-medium text-brand hover:bg-brand/10 hover:text-accent">
            Edit details
          </button>
          <button onClick={deleteVendor} disabled={saving} className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg px-3 text-sm font-medium text-red hover:bg-red/10 disabled:opacity-50">
            <Trash2 size={14} /> Delete vendor
          </button>
        </div>
      </div>

      {/* DPA section */}
      <div className="space-y-4 rounded-xl border border-line bg-bg-2 p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <p className={labelCls}>Data Processing Agreement</p>
          <DpaExpiryIndicator expiresAt={vendor.dpa_expires_at} status={status} />
        </div>

        {dpaContent ? (
          <div className="space-y-3">
            <button
              onClick={() => setShowDpaPreview(p => !p)}
              className="inline-flex items-center gap-1.5 text-sm text-brand hover:text-accent font-medium"
            >
              <FileText size={14} /> {showDpaPreview ? 'Hide DPA' : 'View DPA'}
            </button>
            {showDpaPreview && <DpaPreview content={dpaContent} />}
          </div>
        ) : (
          <p className="text-sm text-text-muted">Generate a DPDP-aligned draft, then upload the signed copy to your document store.</p>
        )}

        {vendor.dpa_document_url && (
          <a href={vendor.dpa_document_url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-brand hover:text-accent">
            <ExternalLink size={14} /> Open signed DPA
          </a>
        )}

        <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:flex-wrap">
          <button
            onClick={generateDpa}
            disabled={saving}
            className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg border border-line px-4 py-2 text-sm font-medium text-text transition-colors hover:bg-glass disabled:opacity-50"
          >
            <FileText size={14} /> Generate DPA draft
          </button>
          <button
            onClick={() => patch({ dpa_status: 'signed', dpa_signed_at: new Date().toISOString() })}
            disabled={saving || status === 'signed'}
            className="min-h-11 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50"
          >
            Mark as Signed
          </button>
        </div>
      </div>

      {/* Questionnaire section */}
      <div className="space-y-4 rounded-xl border border-line bg-bg-2 p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <p className={labelCls}>Vendor Questionnaire</p>
          {vendor.questionnaire_completed_at && (
            <span className="text-xs text-text-faint">Completed {fmtDate(vendor.questionnaire_completed_at)}</span>
          )}
        </div>

        {hasQuestionnaire ? (
          <div className="space-y-4">
            {VENDOR_QUESTION_SECTIONS.map(section => {
              const questions = vendorQuestionsForSection(section.key)
              return (
                <div key={section.key} className="border-t border-line pt-3 first:border-0 first:pt-0">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-muted">{section.label}</p>
                  <div className="space-y-2">
                    {questions.map((q: VendorQuestion) => {
                      const answer = questionnaire[q.id]
                      return (
                        <div key={q.id} className="text-sm">
                          <p className="text-text-muted">{q.text}</p>
                          <p className="font-medium text-text">{answer ?? ' - '}</p>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-text-muted mb-3">
              Send a security and compliance questionnaire to this vendor.
            </p>
            <button
              onClick={sendQuestionnaire}
              disabled={saving}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-soft disabled:opacity-50"
            >
              <Send size={14} /> Send Questionnaire
            </button>
            {questionnaireLink && (
              <p className="mt-3 break-all text-xs text-green">Share link: {questionnaireLink}</p>
            )}
            {!vendor.contact_email && !questionnaireLink && (
              <p className="mt-2 text-xs text-amber">No contact email is set; generate the link and share it manually.</p>
            )}
          </div>
        )}
      </div>

      {/* Notes */}
      {vendor.notes && (
        <div className="bg-glass rounded-xl p-5">
          <p className={`${labelCls} mb-2`}>Notes</p>
          <p className="text-sm text-text whitespace-pre-wrap">{vendor.notes}</p>
        </div>
      )}

      {error && <p className="rounded-lg border border-red/25 bg-red/[0.07] px-3 py-2 text-sm text-red">{error}</p>}

      {/* Edit modal */}
      <VendorFormModal
        open={editing}
        onClose={() => setEditing(false)}
        onSave={handleEdit}
        initialData={vendor}
      />
    </div>
  )
}
