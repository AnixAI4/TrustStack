'use client'

import { useEffect, useState } from 'react'
import { X, Sparkles, Plus } from 'lucide-react'
import { DPDP_BASES, DATA_CATEGORIES, DATA_CATEGORY_GROUPS, ROPA_SUBJECT_TYPES } from '@/lib/constants'
import type { RopaEntry, RopaAiSuggestion } from '@/types/dpdp'

interface Props {
  open: boolean
  onClose: () => void
  onSaved: (entry: RopaEntry) => void
  entry?: RopaEntry | null // present = edit mode
}

const inputClass =
  'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]'

const VALID_SUBJECTS = new Set<string>(ROPA_SUBJECT_TYPES.map(s => s.value))

const toLines = (s: string) => s.split('\n').map(x => x.trim()).filter(Boolean)
const toCommaList = (s: string) => s.split(',').map(x => x.trim()).filter(Boolean)
const linesFrom = (a?: string[] | null) => (a ?? []).join('\n')
const commaFrom = (a?: string[] | null) => (a ?? []).join(', ')

export function RopaEntryForm({ open, onClose, onSaved, entry }: Props) {
  const isEdit = Boolean(entry)

  const [name, setName]               = useState('')
  const [description, setDescription] = useState('')
  const [controller, setController]   = useState('')
  const [legalBasis, setLegalBasis]   = useState('consent_s6')
  const [subjects, setSubjects]       = useState<string[]>([])
  const [categories, setCategories]   = useState<string[]>([])
  const [purposesText, setPurposesText]   = useState('')
  const [sourcesText, setSourcesText]     = useState('')
  const [recipientsText, setRecipientsText] = useState('')
  const [processorsText, setProcessorsText] = useState('')
  const [crossBorder, setCrossBorder]     = useState(false)
  const [countriesText, setCountriesText] = useState('')
  const [retention, setRetention]         = useState('')
  const [securityText, setSecurityText]   = useState('')

  const [vendorNames, setVendorNames] = useState<string[]>([])
  const [aiInput, setAiInput] = useState('')
  const [aiBusy, setAiBusy]   = useState(false)
  const [aiNote, setAiNote]   = useState<string | null>(null)
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState<string | null>(null)

  // Reset / hydrate whenever the modal opens.
  useEffect(() => {
    if (!open) return
    setName(entry?.activity_name ?? '')
    setDescription(entry?.activity_description ?? '')
    setController(entry?.data_controller_name ?? '')
    setLegalBasis(entry?.legal_basis ?? 'consent_s6')
    setSubjects(entry?.data_subject_types ?? [])
    setCategories(entry?.data_categories ?? [])
    setPurposesText(linesFrom(entry?.processing_purposes))
    setSourcesText(linesFrom(entry?.data_sources))
    setRecipientsText(linesFrom(entry?.recipients))
    setProcessorsText(commaFrom(entry?.processor_names))
    setCrossBorder(entry?.cross_border_transfer ?? false)
    setCountriesText(commaFrom(entry?.transfer_countries))
    setRetention(entry?.retention_period ?? '')
    setSecurityText(linesFrom(entry?.security_measures))
    setAiInput(''); setAiNote(null); setError(null)

    // Default the controller to the org name (create mode) + load vendor names
    // for the processor quick-add chips (note #5 cross-link).
    fetch('/api/organizations/me').then(r => r.json()).then(j => {
      if (j?.data?.name && !entry) setController(prev => prev || j.data.name)
    }).catch(() => {})
    fetch('/api/vendors?limit=50').then(r => r.json()).then(j => {
      if (j?.success) setVendorNames((j.data as { name: string }[]).map(v => v.name))
    }).catch(() => {})
  }, [open, entry])

  if (!open) return null

  function toggle(list: string[], key: string, setter: (v: string[]) => void) {
    setter(list.includes(key) ? list.filter(c => c !== key) : [...list, key])
  }

  function addProcessor(nameToAdd: string) {
    const current = toCommaList(processorsText)
    if (current.some(c => c.toLowerCase() === nameToAdd.toLowerCase())) return
    setProcessorsText([...current, nameToAdd].join(', '))
  }

  async function runAi() {
    if (aiInput.trim().length < 10) { setError('Describe the activity in a bit more detail first.'); return }
    setAiBusy(true); setError(null); setAiNote(null)
    try {
      const res = await fetch('/api/ropa/ai-suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: aiInput.trim() }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'AI assist failed.'); return }
      const s = json.suggestion as RopaAiSuggestion
      // Merge — only overwrite fields the suggestion actually provided.
      if (s.activity_name) setName(s.activity_name)
      if (s.activity_description) setDescription(s.activity_description)
      if (s.data_controller_name) setController(prev => prev || s.data_controller_name!)
      if (s.legal_basis) setLegalBasis(s.legal_basis)
      if (s.data_subject_types?.length) setSubjects(s.data_subject_types.filter(t => VALID_SUBJECTS.has(t)))
      if (s.data_categories?.length) setCategories(s.data_categories)
      if (s.processing_purposes?.length) setPurposesText(s.processing_purposes.join('\n'))
      if (s.data_sources?.length) setSourcesText(s.data_sources.join('\n'))
      if (s.recipients?.length) setRecipientsText(s.recipients.join('\n'))
      if (s.processor_names?.length) setProcessorsText(s.processor_names.join(', '))
      if (typeof s.cross_border_transfer === 'boolean') setCrossBorder(s.cross_border_transfer)
      if (s.transfer_countries?.length) setCountriesText(s.transfer_countries.join(', '))
      if (s.retention_period) setRetention(s.retention_period)
      if (s.security_measures?.length) setSecurityText(s.security_measures.join('\n'))
      setAiNote('AI filled the fields below — review and edit before saving.')
    } catch {
      setError('Network error while generating — please try again.')
    } finally {
      setAiBusy(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!name.trim()) { setError('Activity name is required.'); return }
    if (!controller.trim()) { setError('Data controller is required.'); return }
    if (!legalBasis) { setError('Select a legal basis.'); return }

    setSaving(true)
    try {
      const payload = {
        activity_name: name.trim(),
        activity_description: description.trim() || undefined,
        data_controller_name: controller.trim(),
        legal_basis: legalBasis,
        data_subject_types: subjects,
        data_categories: categories,
        processing_purposes: toLines(purposesText),
        data_sources: toLines(sourcesText),
        recipients: toLines(recipientsText),
        processor_names: toCommaList(processorsText),
        cross_border_transfer: crossBorder,
        transfer_countries: crossBorder ? toCommaList(countriesText) : [],
        retention_period: retention.trim() || undefined,
        security_measures: toLines(securityText),
      }
      const res = await fetch(isEdit ? `/api/ropa/${entry!.id}` : '/api/ropa', {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'Failed to save entry.'); return }
      onSaved(json.data as RopaEntry)
    } catch {
      setError('Network error — please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h2 className="text-lg font-bold text-[#003366]">{isEdit ? 'Edit Processing Activity' : 'Add Processing Activity'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* AI assist */}
          <div className="bg-[#F5F8FC] border border-[#D6E4F0] rounded-xl p-4">
            <label className="flex items-center gap-1.5 text-sm font-semibold text-[#003366] mb-1.5">
              <Sparkles size={15} /> Describe what you do with this data
            </label>
            <textarea
              value={aiInput}
              onChange={e => setAiInput(e.target.value)}
              rows={2}
              placeholder="e.g. We collect customer email and phone to send order updates and process refunds…"
              className={`${inputClass} resize-none bg-white`}
            />
            <div className="flex items-center justify-between gap-2 mt-2">
              <span className="text-xs text-gray-500">{aiNote ?? 'AI suggests structured ROPA fields you can edit.'}</span>
              <button
                type="button"
                onClick={runAi}
                disabled={aiBusy}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-[#2874A6] text-white rounded-lg hover:bg-[#003366] transition-colors disabled:opacity-50 shrink-0"
              >
                <Sparkles size={14} /> {aiBusy ? 'Generating…' : 'Suggest with AI'}
              </button>
            </div>
          </div>

          {/* Core */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Activity Name <span className="text-red-500">*</span></label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Customer Onboarding (KYC)" className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data Controller <span className="text-red-500">*</span></label>
              <input value={controller} onChange={e => setController(e.target.value)} placeholder="Your organization name" className={inputClass} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description <span className="text-gray-400 font-normal">(optional)</span></label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="What this activity involves…" className={`${inputClass} resize-none`} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Legal Basis <span className="text-red-500">*</span></label>
            <select value={legalBasis} onChange={e => setLegalBasis(e.target.value)} className={inputClass}>
              {DPDP_BASES.map(b => <option key={b.id} value={b.id}>{b.label}</option>)}
            </select>
          </div>

          {/* Data subjects */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Data Subject Types</label>
            <div className="flex flex-wrap gap-2">
              {ROPA_SUBJECT_TYPES.map(s => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => toggle(subjects, s.value, setSubjects)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                    subjects.includes(s.value) ? 'bg-[#003366] text-white border-[#003366]' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Data categories grouped */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Personal Data Categories</label>
            <div className="border border-gray-100 rounded-lg p-3 max-h-52 overflow-y-auto space-y-3">
              {DATA_CATEGORY_GROUPS.map(group => {
                const cats = DATA_CATEGORIES.filter(c => c.group === group)
                if (!cats.length) return null
                return (
                  <div key={group}>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{group}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                      {cats.map(cat => (
                        <label key={cat.key} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={categories.includes(cat.key)}
                            onChange={() => toggle(categories, cat.key, setCategories)}
                            className="rounded border-gray-300 text-[#003366] focus:ring-[#003366]"
                          />
                          {cat.label}{cat.sensitive && <span className="text-[10px] text-amber-600">●</span>}
                        </label>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Purposes + retention */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Processing Purposes <span className="text-gray-400 font-normal">(one per line)</span></label>
              <textarea value={purposesText} onChange={e => setPurposesText(e.target.value)} rows={3} placeholder={'KYC verification\nFraud detection'} className={`${inputClass} resize-none`} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Retention Period</label>
              <input value={retention} onChange={e => setRetention(e.target.value)} placeholder="e.g. 8 years after account closure" className={inputClass} />
              <label className="block text-sm font-medium text-gray-700 mb-1 mt-3">Security Measures <span className="text-gray-400 font-normal">(one per line)</span></label>
              <textarea value={securityText} onChange={e => setSecurityText(e.target.value)} rows={2} placeholder={'Encryption at rest\nRole-based access'} className={`${inputClass} resize-none`} />
            </div>
          </div>

          {/* Sources + recipients */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data Sources <span className="text-gray-400 font-normal">(one per line)</span></label>
              <textarea value={sourcesText} onChange={e => setSourcesText(e.target.value)} rows={2} placeholder={'Signup form\nMobile app'} className={`${inputClass} resize-none`} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Recipients <span className="text-gray-400 font-normal">(one per line)</span></label>
              <textarea value={recipientsText} onChange={e => setRecipientsText(e.target.value)} rows={2} placeholder={'Payment gateway\nKYC agency'} className={`${inputClass} resize-none`} />
            </div>
          </div>

          {/* Processors (with vendor quick-add) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Processors / Vendors <span className="text-gray-400 font-normal">(comma-separated)</span></label>
            <input value={processorsText} onChange={e => setProcessorsText(e.target.value)} placeholder="Razorpay, AWS ap-south-1" className={inputClass} />
            {vendorNames.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                <span className="text-xs text-gray-400">From your vendors:</span>
                {vendorNames.slice(0, 12).map(v => (
                  <button key={v} type="button" onClick={() => addProcessor(v)} className="inline-flex items-center gap-0.5 text-xs text-[#003366] bg-[#D6E4F0] hover:bg-[#c2d8ee] rounded-full px-2 py-0.5">
                    <Plus size={10} /> {v}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Cross-border */}
          <div>
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input type="checkbox" checked={crossBorder} onChange={e => setCrossBorder(e.target.checked)} className="rounded border-gray-300 text-[#003366] focus:ring-[#003366]" />
              This activity transfers personal data outside India (cross-border)
            </label>
            {crossBorder && (
              <input value={countriesText} onChange={e => setCountriesText(e.target.value)} placeholder="Destination countries (comma-separated): Singapore, USA" className={`${inputClass} mt-2`} />
            )}
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800">Cancel</button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-sm font-medium bg-[#003366] text-white rounded-lg hover:bg-[#1A5276] transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Activity'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
