'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, ArrowRight, Check, Save, Send, Sparkles, Loader2,
  AlertTriangle, Mail, Phone, Briefcase, CheckCircle2, XCircle,
} from 'lucide-react'
import toast from 'react-hot-toast'
import {
  THIRD_PARTY_CATEGORIES,
  DATA_CATEGORIES,
  getIndustryPurposes,
} from '@/lib/constants'
import { validateNotice } from '@/lib/ai/notice-generator'
import type {
  NoticeBuilderData, NoticePurposeMapping, NoticeRetentionRule, GrievanceOfficer,
} from '@/types/dpdp'
import DataCategorySelector from './DataCategorySelector'
import PurposeMapper from './PurposeMapper'
import LanguageSelector from './LanguageSelector'
import NoticePreview from './NoticePreview'

type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8

const STEPS: string[] = [
  'Company', 'Data Collected', 'Purposes', 'Sharing',
  'Retention', 'Grievance Officer', 'Languages', 'Preview & Publish',
]

const JSON_HEADERS = { 'Content-Type': 'application/json' }

const EMPTY_FORM: NoticeBuilderData = {
  company: { legal_name: '', registered_address: '', cin: '', contact_email: '' },
  data_categories: [],
  other_category: '',
  purposes: [],
  sharing: { third_parties: [], cross_border: false, countries: '' },
  retention: [],
  languages: ['en'],
}

function buildPurposes(categories: string[], existing: NoticePurposeMapping[], industry: string | null): NoticePurposeMapping[] {
  const sug = new Map(getIndustryPurposes(industry).map(s => [s.data_category, s]))
  return categories.map(cat => {
    const found = existing.find(p => p.data_category === cat)
    if (found) return found
    const s = sug.get(cat)
    return { data_category: cat, purpose: s?.purpose || '', basis: s?.basis || 'consent_s6' }
  })
}

function buildRetention(categories: string[], existing: NoticeRetentionRule[]): NoticeRetentionRule[] {
  return categories.map(cat => existing.find(r => r.data_category === cat) || { data_category: cat, period: '' })
}

function categoryLabel(key: string, otherText?: string): string {
  if (key === 'other') return otherText?.trim() || 'Other personal data'
  return DATA_CATEGORIES.find(c => c.key === key)?.label ?? key
}

export default function NoticeBuilder() {
  const router = useRouter()
  const [step, setStep] = useState<Step>(1)
  const [form, setForm] = useState<NoticeBuilderData>(EMPTY_FORM)
  const [industry, setIndustry] = useState<string | null>(null)
  const [officer, setOfficer] = useState<GrievanceOfficer | null>(null)
  const [loading, setLoading] = useState(true)

  const [contentEn, setContentEn] = useState('')
  const [translations, setTranslations] = useState<Record<string, string>>({})
  const [changeSummary, setChangeSummary] = useState('')
  const [generating, setGenerating] = useState(false)
  const [translating, setTranslating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch('/api/organizations/me').then(r => r.json()),
      fetch('/api/grievance/officer').then(r => r.json()),
    ]).then(([orgRes, officerRes]) => {
      if (orgRes?.data) {
        setIndustry(orgRes.data.industry || null)
        setForm(f => ({
          ...f,
          company: {
            ...f.company,
            legal_name: orgRes.data.name || '',
            cin: orgRes.data.cin || '',
          },
        }))
      }
      if (officerRes?.data) {
        setOfficer(officerRes.data)
        setForm(f => ({ ...f, company: { ...f.company, contact_email: f.company.contact_email || officerRes.data.email } }))
      }
    }).finally(() => setLoading(false))
  }, [])

  const complianceErrors = useMemo(
    () => validateNotice({
      content_en: contentEn,
      grievance_officer_name: officer?.name,
      grievance_officer_email: officer?.email,
    }),
    [contentEn, officer]
  )

  // Auto-generate English on first reaching the preview step.
  useEffect(() => {
    if (step === 8 && !contentEn && !generating && officer) generate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step])

  const canProceed = (): boolean => {
    if (step === 1) return !!form.company.legal_name.trim() && !!form.company.contact_email.trim()
    if (step === 2) return form.data_categories.length > 0
    if (step === 6) return !!officer
    return true
  }

  const next = () => {
    if (!canProceed()) return
    if (step === 2) setForm(f => ({ ...f, purposes: buildPurposes(f.data_categories, f.purposes, industry) }))
    if (step === 4) setForm(f => ({ ...f, retention: buildRetention(f.data_categories, f.retention) }))
    setStep(s => Math.min(8, s + 1) as Step)
  }
  const back = () => setStep(s => Math.max(1, s - 1) as Step)

  async function generate() {
    setGenerating(true)
    try {
      const res = await fetch('/api/privacy-notice/generate', { method: 'POST', headers: JSON_HEADERS, body: JSON.stringify(form) })
      const data = await res.json()
      if (data.error) toast.error(data.error)
      else { setContentEn(data.content_en); setTranslations({}) }
    } catch {
      toast.error('Failed to generate notice')
    } finally {
      setGenerating(false)
    }
  }

  async function translateAll() {
    const targets = form.languages.filter(c => c !== 'en')
    if (!contentEn || targets.length === 0) return
    setTranslating(true)
    try {
      const results: Record<string, string> = {}
      for (const code of targets) {
        const res = await fetch('/api/privacy-notice/translate', { method: 'POST', headers: JSON_HEADERS, body: JSON.stringify({ content_en: contentEn, target_language: code }) })
        const data = await res.json()
        if (!data.error && data.translated_content) results[code] = data.translated_content
      }
      setTranslations(results)
      toast.success('Translations generated')
    } catch {
      toast.error('Translation failed')
    } finally {
      setTranslating(false)
    }
  }

  const buildPayload = () => ({
    content_en: contentEn,
    content_hi: translations['hi'] || null,
    content_ta: translations['ta'] || null,
    content_te: translations['te'] || null,
    content_mr: translations['mr'] || null,
    change_summary: changeSummary.trim() || null,
  })

  async function save(): Promise<string | null> {
    const res = await fetch('/api/privacy-notice/save', { method: 'POST', headers: JSON_HEADERS, body: JSON.stringify(buildPayload()) })
    const data = await res.json()
    if (data.error) { toast.error(data.error); return null }
    return data.version?.id || null
  }

  async function handleSaveDraft() {
    setSaving(true)
    const id = await save()
    setSaving(false)
    if (id) { toast.success('Saved as draft'); router.push('/dashboard/privacy-notice') }
  }

  async function handlePublish() {
    setPublishing(true)
    const id = await save()
    if (!id) { setPublishing(false); return }
    const res = await fetch('/api/privacy-notice/publish', { method: 'POST', headers: JSON_HEADERS, body: JSON.stringify({ version_id: id }) })
    const data = await res.json()
    setPublishing(false)
    if (data.error) { toast.error(Array.isArray(data.errors) && data.errors.length ? data.errors.join(' · ') : data.error); return }
    toast.success('Privacy notice published!')
    router.push('/dashboard/privacy-notice')
  }

  if (loading) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="h-8 bg-gray-100 rounded w-56 animate-pulse mb-8" />
        <div className="h-72 bg-gray-100 rounded-xl animate-pulse" />
      </div>
    )
  }

  const previewContent: Record<string, string> = { en: contentEn, ...translations }
  const extraLangs = form.languages.filter(c => c !== 'en')

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.push('/dashboard/privacy-notice')} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-[#003366]">Privacy Notice Builder</h1>
          <p className="text-sm text-gray-500">DPDP Section 5 — build, translate, and publish your notice</p>
        </div>
      </div>

      {/* Step progress */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-[#003366]">Step {step} of 8 — {STEPS[step - 1]}</span>
          <span className="text-xs text-gray-400">{Math.round((step / 8) * 100)}%</span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-[#003366] transition-all" style={{ width: `${(step / 8) * 100}%` }} />
        </div>
      </div>

      {/* Step body */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="font-semibold text-[#1A1A2E]">Company Details</h2>
            <Field label="Legal name" required>
              <input className={inputCls} value={form.company.legal_name}
                onChange={e => setForm(f => ({ ...f, company: { ...f.company, legal_name: e.target.value } }))} placeholder="Acme Technologies Pvt Ltd" />
            </Field>
            <Field label="Registered address">
              <textarea className={inputCls} rows={2} value={form.company.registered_address}
                onChange={e => setForm(f => ({ ...f, company: { ...f.company, registered_address: e.target.value } }))} placeholder="Building, Street, City, State, PIN" />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="CIN (Corporate Identification Number)">
                <input className={inputCls} value={form.company.cin}
                  onChange={e => setForm(f => ({ ...f, company: { ...f.company, cin: e.target.value } }))} placeholder="U72900KA2020PTC000000" />
              </Field>
              <Field label="Data Fiduciary contact email" required>
                <input className={inputCls} type="email" value={form.company.contact_email}
                  onChange={e => setForm(f => ({ ...f, company: { ...f.company, contact_email: e.target.value } }))} placeholder="privacy@company.com" />
              </Field>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <h2 className="font-semibold text-[#1A1A2E]">Data You Collect</h2>
              <p className="text-sm text-gray-500 mt-1">Select every category of personal data your organization processes.</p>
            </div>
            <DataCategorySelector
              selected={form.data_categories}
              onChange={cats => setForm(f => ({ ...f, data_categories: cats }))}
              otherText={form.other_category || ''}
              onOtherChange={t => setForm(f => ({ ...f, other_category: t }))}
            />
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div>
              <h2 className="font-semibold text-[#1A1A2E]">Processing Purposes</h2>
              <p className="text-sm text-gray-500 mt-1">
                Assign a purpose and DPDP legal basis to each category.
                {industry && <span className="text-[#2874A6]"> Suggestions pre-filled for your industry.</span>}
              </p>
            </div>
            <PurposeMapper
              purposes={form.purposes}
              otherText={form.other_category}
              onChange={p => setForm(f => ({ ...f, purposes: p }))}
            />
          </div>
        )}

        {step === 4 && (
          <div className="space-y-5">
            <div>
              <h2 className="font-semibold text-[#1A1A2E]">Data Sharing</h2>
              <p className="text-sm text-gray-500 mt-1">Which categories of third parties do you share data with?</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {THIRD_PARTY_CATEGORIES.map(tp => {
                const sel = form.sharing.third_parties.includes(tp.key)
                return (
                  <button key={tp.key} type="button"
                    onClick={() => setForm(f => ({
                      ...f,
                      sharing: { ...f.sharing, third_parties: sel ? f.sharing.third_parties.filter(k => k !== tp.key) : [...f.sharing.third_parties, tp.key] },
                    }))}
                    className={`flex items-center gap-2 p-3 rounded-lg border text-left transition-colors ${sel ? 'border-[#003366] bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${sel ? 'bg-[#003366] border-[#003366]' : 'border-gray-300'}`}>
                      {sel && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span className="text-sm text-[#1A1A2E]">{tp.label}</span>
                  </button>
                )
              })}
            </div>
            <div className="flex items-start gap-3 p-3 rounded-xl border border-gray-100">
              <button onClick={() => setForm(f => ({ ...f, sharing: { ...f.sharing, cross_border: !f.sharing.cross_border } }))}
                className={`relative w-10 h-6 rounded-full transition-colors shrink-0 mt-0.5 ${form.sharing.cross_border ? 'bg-[#003366]' : 'bg-gray-200'}`}>
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.sharing.cross_border ? 'translate-x-4' : ''}`} />
              </button>
              <div className="flex-1">
                <p className="text-sm font-medium text-[#1A1A2E]">Cross-border transfers</p>
                <p className="text-xs text-gray-500">Is any personal data transferred or stored outside India?</p>
                {form.sharing.cross_border && (
                  <input className={`${inputCls} mt-2`} value={form.sharing.countries}
                    onChange={e => setForm(f => ({ ...f, sharing: { ...f.sharing, countries: e.target.value } }))}
                    placeholder="Countries, e.g. United States, Singapore" />
                )}
              </div>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-4">
            <div>
              <h2 className="font-semibold text-[#1A1A2E]">Data Retention</h2>
              <p className="text-sm text-gray-500 mt-1">How long do you keep each category of data?</p>
            </div>
            {form.retention.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No data categories selected.</p>
            ) : (
              <div className="space-y-2">
                {form.retention.map((r, i) => (
                  <div key={r.data_category} className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-center">
                    <span className="text-sm text-[#1A1A2E]">{categoryLabel(r.data_category, form.other_category)}</span>
                    <input className={inputCls} value={r.period}
                      onChange={e => setForm(f => ({ ...f, retention: f.retention.map((x, j) => j === i ? { ...x, period: e.target.value } : x) }))}
                      placeholder="e.g. 3 years after last transaction" />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {step === 6 && (
          <div className="space-y-4">
            <h2 className="font-semibold text-[#1A1A2E]">Grievance Officer</h2>
            {officer ? (
              <div className="rounded-xl border border-gray-100 p-5 bg-gray-50/60">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Appointed under DPDP Section 14</p>
                <div className="space-y-2 text-sm text-gray-700">
                  <div className="flex items-center gap-2"><Briefcase size={14} className="text-gray-400" /><span>{officer.name} — {officer.designation}</span></div>
                  <div className="flex items-center gap-2"><Mail size={14} className="text-gray-400" /><span>{officer.email}</span></div>
                  {officer.phone && <div className="flex items-center gap-2"><Phone size={14} className="text-gray-400" /><span>{officer.phone}</span></div>}
                </div>
                <p className="text-xs text-gray-400 mt-3">These details are embedded into the published notice automatically.</p>
              </div>
            ) : (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
                <div className="flex items-center gap-2 text-amber-800 font-medium mb-1">
                  <AlertTriangle size={16} /> No Grievance Officer appointed
                </div>
                <p className="text-sm text-amber-700 mb-3">
                  DPDP requires a Grievance Officer in your privacy notice. Appoint one before generating the notice.
                </p>
                <Link href="/dashboard/grievance" className="inline-flex items-center gap-1.5 text-sm bg-[#003366] text-white px-4 py-2 rounded-lg hover:bg-[#1A5276]">
                  Go to Grievance module <ArrowRight size={14} />
                </Link>
              </div>
            )}
          </div>
        )}

        {step === 7 && (
          <div className="space-y-4">
            <div>
              <h2 className="font-semibold text-[#1A1A2E]">Languages</h2>
              <p className="text-sm text-gray-500 mt-1">English is always generated. Add Indian languages — translated by Claude on publish.</p>
            </div>
            <LanguageSelector selected={form.languages} onChange={langs => setForm(f => ({ ...f, languages: langs }))} />
          </div>
        )}

        {step === 8 && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-[#1A1A2E]">Preview &amp; Publish</h2>
              <button onClick={generate} disabled={generating}
                className="flex items-center gap-1.5 text-sm px-3 py-1.5 border border-[#003366] text-[#003366] rounded-lg hover:bg-[#D6E4F0] disabled:opacity-50">
                {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {contentEn ? 'Regenerate' : 'Generate'}
              </button>
            </div>

            {generating && !contentEn ? (
              <div className="text-center py-12 text-sm text-gray-500">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#003366]" />
                Generating your DPDP-compliant notice…
              </div>
            ) : contentEn ? (
              <>
                <NoticePreview contentByLang={previewContent} />

                {extraLangs.length > 0 && (
                  <div className="flex items-center justify-between rounded-lg bg-blue-50 px-4 py-3">
                    <p className="text-sm text-[#003366]">
                      {Object.keys(translations).length > 0
                        ? `Translations ready: ${Object.keys(translations).map(c => c.toUpperCase()).join(', ')}`
                        : `${extraLangs.length} language${extraLangs.length > 1 ? 's' : ''} selected (${extraLangs.map(c => c.toUpperCase()).join(', ')})`}
                    </p>
                    <button onClick={translateAll} disabled={translating}
                      className="flex items-center gap-1.5 text-sm px-3 py-1.5 bg-[#003366] text-white rounded-lg hover:bg-[#1A5276] disabled:opacity-50">
                      {translating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                      Generate translations
                    </button>
                  </div>
                )}

                {/* Compliance checklist */}
                <div className="rounded-xl border border-gray-100 p-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Compliance checks</p>
                  {complianceErrors.length === 0 ? (
                    <div className="flex items-center gap-2 text-sm text-green-700">
                      <CheckCircle2 className="w-4 h-4" /> All DPDP compliance checks passed.
                    </div>
                  ) : (
                    <ul className="space-y-1.5">
                      {complianceErrors.map(err => (
                        <li key={err} className="flex items-center gap-2 text-sm text-red-600">
                          <XCircle className="w-4 h-4 shrink-0" /> {err}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <Field label="Change summary (optional)">
                  <input className={inputCls} value={changeSummary}
                    onChange={e => setChangeSummary(e.target.value)} placeholder="e.g. Added health data and updated retention" />
                </Field>
              </>
            ) : (
              <p className="text-sm text-gray-400 text-center py-10">Click Generate to create your notice.</p>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button onClick={back} disabled={step === 1}
          className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 disabled:opacity-40 text-sm">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        {step < 8 ? (
          <button onClick={next} disabled={!canProceed()}
            className="flex items-center gap-2 px-5 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#1A5276] disabled:opacity-40 text-sm">
            Next: {STEPS[step]} <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button onClick={handleSaveDraft} disabled={!contentEn || saving || publishing}
              className="flex items-center gap-2 px-4 py-2 border border-[#003366] text-[#003366] rounded-lg hover:bg-[#D6E4F0] disabled:opacity-50 text-sm">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save as Draft
            </button>
            <button onClick={handlePublish} disabled={!contentEn || complianceErrors.length > 0 || publishing || saving}
              className="flex items-center gap-2 px-5 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#1A5276] disabled:opacity-50 text-sm">
              {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Publish Notice
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]/20'

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}{required && <span className="text-red-500"> *</span>}
      </label>
      {children}
    </div>
  )
}
