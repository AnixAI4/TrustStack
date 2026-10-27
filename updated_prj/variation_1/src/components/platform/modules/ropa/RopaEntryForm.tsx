'use client'

import { useState, useEffect } from 'react'
import { Sparkles } from 'lucide-react'
import { DPDP_BASES, DATA_CATEGORIES, DATA_CATEGORY_GROUPS, ROPA_SUBJECT_TYPES } from '@/lib/platform/constants'
import type { RopaEntry, RopaAiSuggestion } from '@/types/dpdp'

interface Props {
  entry?: RopaEntry | null
  aiSuggestion?: RopaAiSuggestion | null
  onSave: (data: Partial<RopaEntry>) => Promise<void>
  onRequestAi?: (activityName: string) => void
}

const inputClass =
  'module-field'

function splitList(value: string): string[] {
  return value.split(/[\n,]/).map(item => item.trim()).filter(Boolean)
}

export function RopaEntryForm({ entry, aiSuggestion, onSave, onRequestAi }: Props) {
  const [activityName, setActivityName]     = useState('')
  const [activityDescription, setActivityDescription] = useState('')
  const [controllerName, setControllerName] = useState('')
  const [processingPurposes, setProcessingPurposes] = useState('')
  const [legalBasis, setLegalBasis]         = useState('consent_s6')
  const [dataCategories, setDataCategories] = useState<string[]>([])
  const [subjectTypes, setSubjectTypes]     = useState<string[]>([])
  const [retentionPeriod, setRetentionPeriod] = useState('')
  const [crossBorder, setCrossBorder]       = useState(false)
  const [crossBorderCountries, setCrossCountries] = useState('')
  const [dataSources, setDataSources]       = useState('')
  const [recipients, setRecipients]         = useState('')
  const [processors, setProcessors]         = useState('')
  const [securityMeasures, setSecurityMeasures] = useState('')

  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState<string | null>(null)

  // Load entry data if editing
  useEffect(() => {
    if (entry) {
      setActivityName(entry.activity_name ?? '')
      setActivityDescription(entry.activity_description ?? '')
      setControllerName(entry.data_controller_name ?? '')
      setProcessingPurposes(entry.processing_purposes?.join('\n') ?? '')
      setLegalBasis(entry.legal_basis ?? 'consent_s6')
      setDataCategories(entry.data_categories ?? [])
      setSubjectTypes(entry.data_subject_types ?? [])
      setRetentionPeriod(entry.retention_period ?? '')
      setCrossBorder(!!entry.cross_border_transfer)
      setCrossCountries(entry.transfer_countries?.join(', ') ?? '')
      setDataSources(entry.data_sources?.join(', ') ?? '')
      setRecipients(entry.recipients?.join(', ') ?? '')
      setProcessors(entry.processor_names?.join(', ') ?? '')
      setSecurityMeasures(entry.security_measures?.join(', ') ?? '')
    }
  }, [entry])

  // Apply AI suggestion
  useEffect(() => {
    if (aiSuggestion) {
      if (aiSuggestion.activity_name) setActivityName(aiSuggestion.activity_name)
      if (aiSuggestion.activity_description) setActivityDescription(aiSuggestion.activity_description)
      if (aiSuggestion.data_controller_name) setControllerName(aiSuggestion.data_controller_name)
      if (aiSuggestion.processing_purposes?.length) setProcessingPurposes(aiSuggestion.processing_purposes.join('\n'))
      if (aiSuggestion.legal_basis) setLegalBasis(aiSuggestion.legal_basis)
      if (aiSuggestion.data_categories?.length) setDataCategories(aiSuggestion.data_categories)
      if (aiSuggestion.data_subject_types?.length) setSubjectTypes(aiSuggestion.data_subject_types)
      if (aiSuggestion.data_sources?.length) setDataSources(aiSuggestion.data_sources.join(', '))
      if (aiSuggestion.recipients?.length) setRecipients(aiSuggestion.recipients.join(', '))
      if (aiSuggestion.retention_period) setRetentionPeriod(aiSuggestion.retention_period)
      if (typeof aiSuggestion.cross_border_transfer === 'boolean') setCrossBorder(aiSuggestion.cross_border_transfer)
      if (aiSuggestion.transfer_countries?.length) setCrossCountries(aiSuggestion.transfer_countries.join(', '))
      if (aiSuggestion.processor_names?.length) setProcessors(aiSuggestion.processor_names.join(', '))
      if (aiSuggestion.security_measures?.length) setSecurityMeasures(aiSuggestion.security_measures.join(', '))
    }
  }, [aiSuggestion])

  function toggleCategory(key: string) {
    setDataCategories(prev => (prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]))
  }

  function toggleSubjectType(key: string) {
    setSubjectTypes(prev => (prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!activityName.trim()) { setError('Activity name is required.'); return }
    if (!legalBasis) { setError('Legal basis is required.'); return }
    if (dataCategories.length === 0) { setError('Select at least one data category.'); return }

    setSaving(true)
    try {
      await onSave({
        activity_name: activityName.trim(),
        activity_description: activityDescription.trim(),
        data_controller_name: controllerName.trim() || undefined,
        processing_purposes: splitList(processingPurposes),
        legal_basis: legalBasis,
        data_categories: dataCategories,
        data_subject_types: subjectTypes,
        data_sources: splitList(dataSources),
        recipients: splitList(recipients),
        retention_period: retentionPeriod.trim(),
        cross_border_transfer: crossBorder,
        transfer_countries: crossBorder ? splitList(crossBorderCountries) : [],
        processor_names: splitList(processors),
        security_measures: splitList(securityMeasures),
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save entry.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Activity name + AI assist */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-sm font-medium text-text">Activity name <span className="text-red">*</span></label>
          {onRequestAi && activityName.trim().length > 5 && (
            <button
              type="button"
              onClick={() => onRequestAi(activityName.trim())}
              className="inline-flex items-center gap-1 text-xs text-brand hover:text-accent"
            >
              <Sparkles size={12} /> Suggest fields
            </button>
          )}
        </div>
        <input
          value={activityName}
          onChange={e => setActivityName(e.target.value)}
          placeholder="e.g. Customer onboarding, Newsletter marketing"
          className={inputClass}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-text mb-1">Data controller</label>
          <input
            value={controllerName}
            onChange={e => setControllerName(e.target.value)}
            placeholder="Defaults to your organisation"
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text mb-1">Legal basis <span className="text-red">*</span></label>
          <select value={legalBasis} onChange={e => setLegalBasis(e.target.value)} className={inputClass}>
            {DPDP_BASES.map(basis => <option key={basis.id} value={basis.id}>{basis.label}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-text mb-1">Activity description</label>
        <textarea
          value={activityDescription}
          onChange={e => setActivityDescription(e.target.value)}
          rows={2}
          placeholder="Describe how this processing activity works."
          className={`${inputClass} resize-y`}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-text mb-1">Processing purposes</label>
        <textarea
          value={processingPurposes}
          onChange={e => setProcessingPurposes(e.target.value)}
          rows={3}
          placeholder={'One purpose per line\ne.g. Account creation\nService communications'}
          className={`${inputClass} resize-y`}
        />
      </div>

      {/* Data categories */}
      <div>
        <label className="block text-sm font-medium text-text mb-2">Data categories <span className="text-red">*</span></label>
        <div className="border border-line rounded-lg p-3 max-h-52 overflow-y-auto space-y-3">
          {DATA_CATEGORY_GROUPS.map(group => {
            const cats = DATA_CATEGORIES.filter(c => c.group === group)
            if (!cats.length) return null
            return (
              <div key={group}>
                <p className="text-xs font-semibold text-text-faint uppercase tracking-wider mb-1">{group}</p>
                <div className="flex flex-wrap gap-1.5">
                  {cats.map(cat => {
                    const selected = dataCategories.includes(cat.key)
                    return (
                      <button
                        key={cat.key}
                        type="button"
                        onClick={() => toggleCategory(cat.key)}
                        className={`min-h-10 rounded-full px-2.5 py-1.5 text-xs font-medium transition-colors ${
                          selected
                            ? 'bg-accent text-white'
                            : 'bg-surface-2 text-text-muted hover:bg-surface-2'
                        }`}
                      >
                        {cat.label}{cat.sensitive && <span className="ml-0.5 text-amber-300">●</span>}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Subject types */}
      <div>
        <label className="block text-sm font-medium text-text mb-2">Data subject types</label>
        <div className="flex flex-wrap gap-2">
          {ROPA_SUBJECT_TYPES.map(s => {
            const selected = subjectTypes.includes(s.value)
            return (
              <button
                key={s.value}
                type="button"
                onClick={() => toggleSubjectType(s.value)}
                className={`min-h-10 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  selected
                    ? 'bg-accent text-white'
                    : 'bg-surface-2 text-text-muted hover:bg-surface-2'
                }`}
              >
                {s.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Retention */}
      <div>
        <label className="block text-sm font-medium text-text mb-1">Retention period</label>
        <input
          value={retentionPeriod}
          onChange={e => setRetentionPeriod(e.target.value)}
          placeholder="e.g. 5 years after account closure"
          className={inputClass}
        />
      </div>

      {/* Cross-border */}
      <div className="border-t border-line pt-4">
        <label className="flex items-center gap-2 text-sm text-text cursor-pointer">
          <input
            type="checkbox"
            checked={crossBorder}
            onChange={e => setCrossBorder(e.target.checked)}
            className="rounded border-line text-accent focus:ring-accent"
          />
          Data is transferred outside India
        </label>
        {crossBorder && (
          <div className="mt-2">
            <input
              value={crossBorderCountries}
              onChange={e => setCrossCountries(e.target.value)}
              placeholder="List countries, e.g. USA, Singapore"
              className={inputClass}
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-text mb-1">Data sources</label>
          <input
            value={dataSources}
            onChange={e => setDataSources(e.target.value)}
            placeholder="e.g. Signup form, support desk"
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text mb-1">Recipients</label>
          <input
            value={recipients}
            onChange={e => setRecipients(e.target.value)}
            placeholder="e.g. Payment gateway, auditors"
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text mb-1">Processors / vendors</label>
          <input
            value={processors}
            onChange={e => setProcessors(e.target.value)}
            placeholder="e.g. AWS, Salesforce"
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text mb-1">Security measures</label>
          <input
            value={securityMeasures}
            onChange={e => setSecurityMeasures(e.target.value)}
            placeholder="e.g. Encryption, access controls"
            className={inputClass}
          />
        </div>
      </div>

      {error && <p className="rounded-lg border border-red/25 bg-red/[0.07] px-3 py-2 text-sm text-red">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="min-h-11 w-full rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-soft disabled:opacity-50 sm:w-auto"
      >
        {saving ? 'Saving…' : entry ? 'Update Entry' : 'Add Entry'}
      </button>
    </form>
  )
}
