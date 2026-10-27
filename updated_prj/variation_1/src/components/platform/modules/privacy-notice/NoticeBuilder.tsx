'use client'

import { useState, useEffect } from 'react'
import { Sparkles, Eye, EyeOff, AlertTriangle, Plus, Trash2 } from 'lucide-react'
import { THIRD_PARTY_CATEGORIES, DATA_CATEGORIES, getIndustryPurposes } from '@/lib/platform/constants'
import type { NoticeBuilderData, NoticePurposeMapping, NoticeRetentionRule } from '@/types/dpdp'
import DataCategorySelector from './DataCategorySelector'
import PurposeMapper from './PurposeMapper'
import LanguageSelector from './LanguageSelector'
import NoticePreview from './NoticePreview'

interface Props {
  initialData?: Partial<NoticeBuilderData>
}

const inputClass =
  'module-field'

function validateBuilder(data: NoticeBuilderData): string[] {
  const issues: string[] = []
  if (!data.company.legal_name.trim()) issues.push('Organisation legal name is required.')
  if (!data.data_categories.length) issues.push('Select at least one data category.')
  if (!data.purposes.length) issues.push('Add at least one processing purpose.')
  if (data.purposes.some(purpose => !purpose.data_category || !purpose.purpose.trim() || !purpose.basis)) {
    issues.push('Complete the category, purpose, and legal basis for every purpose mapping.')
  }
  if (data.sharing.cross_border && !data.sharing.countries.trim()) {
    issues.push('List the countries involved in cross-border transfers.')
  }
  return issues
}

export function NoticeBuilder({ initialData }: Props) {
  const [legalName, setLegalName]           = useState(initialData?.company?.legal_name ?? '')
  const [registeredAddress, setAddress]     = useState(initialData?.company?.registered_address ?? '')
  const [cin, setCin]                       = useState(initialData?.company?.cin ?? '')
  const [contactEmail, setContactEmail]     = useState(initialData?.company?.contact_email ?? '')
  const [industry, setIndustry]             = useState('')
  const [language, setLanguage]             = useState(initialData?.languages?.[0] ?? 'en')
  const [dataCategories, setDataCategories] = useState<string[]>(initialData?.data_categories ?? [])
  const [purposes, setPurposes]             = useState<NoticePurposeMapping[]>(initialData?.purposes ?? [])
  const [thirdParties, setThirdParties]     = useState<string[]>(initialData?.sharing?.third_parties ?? [])
  const [retention, setRetention]           = useState<NoticeRetentionRule[]>(initialData?.retention ?? [])
  const [crossBorder, setCrossBorder]       = useState(initialData?.sharing?.cross_border ?? false)
  const [crossBorderCountries, setCrossCountries] = useState(initialData?.sharing?.countries ?? '')

  const [generatedContentEn, setGeneratedContentEn] = useState('')
  const [generatedContent, setGeneratedContent] = useState('')
  const [showPreview, setShowPreview]           = useState(false)
  const [generating, setGenerating]             = useState(false)
  const [publishing, setPublishing]             = useState(false)
  const [validationIssues, setValidationIssues] = useState<string[]>([])
  const [error, setError]                       = useState<string | null>(null)

  // Prefill purposes when industry changes
  useEffect(() => {
    if (industry && purposes.length === 0) {
      const defaults = getIndustryPurposes(industry)
      if (defaults.length) {
        setPurposes(defaults.map(purpose => ({ ...purpose })))
      }
    }
  }, [industry, purposes.length])

  function buildData(): NoticeBuilderData {
    return {
      company: {
        legal_name: legalName.trim(),
        registered_address: registeredAddress.trim(),
        cin: cin.trim(),
        contact_email: contactEmail.trim(),
      },
      data_categories: dataCategories,
      purposes,
      sharing: {
        third_parties: thirdParties,
        cross_border: crossBorder,
        countries: crossBorder ? crossBorderCountries.trim() : '',
      },
      retention,
      languages: [language],
    }
  }

  function addRetentionRule() {
    setRetention(current => [
      ...current,
      { data_category: dataCategories[0] ?? '', period: '' },
    ])
  }

  function updateRetentionRule(index: number, partial: Partial<NoticeRetentionRule>) {
    setRetention(current => current.map((rule, ruleIndex) => (
      ruleIndex === index ? { ...rule, ...partial } : rule
    )))
  }

  function removeRetentionRule(index: number) {
    setRetention(current => current.filter((_, ruleIndex) => ruleIndex !== index))
  }

  async function handleGenerate() {
    setError(null)
    const data = buildData()
    const issues = validateBuilder(data)
    setValidationIssues(issues)
    if (issues.length > 0) return

    setGenerating(true)
    try {
      const response = await fetch('/api/trustdeck/privacy-notice/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const result = await response.json() as { content_en?: string; error?: string }
      if (!response.ok || !result.content_en) {
        throw new Error(result.error || 'Failed to generate notice.')
      }

      let previewContent = result.content_en
      setGeneratedContentEn(result.content_en)

      if (language !== 'en') {
        const translationResponse = await fetch('/api/trustdeck/privacy-notice/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content_en: result.content_en, target_language: language }),
        })
        const translation = await translationResponse.json() as { translated_content?: string; error?: string }
        if (!translationResponse.ok || !translation.translated_content) {
          throw new Error(translation.error || 'Failed to translate notice.')
        }
        previewContent = translation.translated_content
      }

      setGeneratedContent(previewContent)
      setShowPreview(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate notice.')
    } finally {
      setGenerating(false)
    }
  }

  async function handlePublish() {
    if (!generatedContent || !generatedContentEn) return
    setPublishing(true)
    setError(null)
    try {
      const savePayload: Record<string, string> = { content_en: generatedContentEn }
      if (language !== 'en') savePayload[`content_${language}`] = generatedContent

      const saveResponse = await fetch('/api/trustdeck/privacy-notice/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(savePayload),
      })
      const saved = await saveResponse.json() as { version?: { id?: string }; error?: string }
      if (!saveResponse.ok || !saved.version?.id) {
        throw new Error(saved.error || 'Failed to save the notice version.')
      }

      const publishResponse = await fetch('/api/trustdeck/privacy-notice/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ version_id: saved.version.id }),
      })
      const published = await publishResponse.json() as { success?: boolean; error?: string; errors?: string[] }
      if (!publishResponse.ok || !published.success) {
        throw new Error(published.errors?.join(' ') || published.error || 'Failed to publish the notice.')
      }

      window.location.assign('/trustdeck/privacy-notice')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to publish notice.')
    } finally {
      setPublishing(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Form side */}
      <div className="space-y-6">
        {/* Company details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="notice-legal-name" className="block text-sm font-medium text-text mb-1">Organisation name <span className="text-red">*</span></label>
            <input id="notice-legal-name" value={legalName} onChange={e => setLegalName(e.target.value)} placeholder="Legal company name" className={inputClass} />
          </div>
          <div>
            <label htmlFor="notice-industry" className="block text-sm font-medium text-text mb-1">Industry</label>
            <input id="notice-industry" value={industry} onChange={e => setIndustry(e.target.value)} placeholder="e.g. E-commerce, Healthcare" className={inputClass} />
          </div>
        </div>

        <div>
          <label htmlFor="notice-address" className="block text-sm font-medium text-text mb-1">Registered address</label>
          <textarea
            id="notice-address"
            value={registeredAddress}
            onChange={e => setAddress(e.target.value)}
            rows={2}
            placeholder="Registered office address"
            className={`${inputClass} resize-y`}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="notice-cin" className="block text-sm font-medium text-text mb-1">CIN</label>
            <input id="notice-cin" value={cin} onChange={e => setCin(e.target.value)} placeholder="Corporate Identification Number" className={inputClass} />
          </div>
          <div>
            <label htmlFor="notice-contact-email" className="block text-sm font-medium text-text mb-1">Contact email</label>
            <input id="notice-contact-email" type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} placeholder="privacy@example.com" className={inputClass} />
          </div>
        </div>

        {/* Language */}
        <div>
          <label className="block text-sm font-medium text-text mb-2">Notice language</label>
          <LanguageSelector value={language} onChange={setLanguage} />
        </div>

        {/* Data categories */}
        <div>
          <label className="block text-sm font-medium text-text mb-2">Data categories collected <span className="text-red">*</span></label>
          <DataCategorySelector selected={dataCategories} onChange={setDataCategories} />
        </div>

        {/* Purpose mappings */}
        <div>
          <label className="block text-sm font-medium text-text mb-2">Processing purposes &amp; legal bases <span className="text-red">*</span></label>
          <PurposeMapper mappings={purposes} onChange={setPurposes} />
        </div>

        {/* Retention */}
        <div>
          <div className="mb-2 flex items-center justify-between gap-3">
            <label className="block text-sm font-medium text-text">Retention rules</label>
            <button
              type="button"
              onClick={addRetentionRule}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-lg px-2 text-xs font-semibold text-brand transition-colors hover:bg-brand/10 hover:text-accent"
            >
              <Plus size={14} /> Add rule
            </button>
          </div>
          <div className="space-y-3">
            {retention.map((rule, index) => (
              <div key={index} className="grid gap-2 rounded-lg border border-line p-3 sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)_2.5rem] sm:items-end">
                <label className="block min-w-0 text-xs font-medium text-text-muted">
                  Data category
                  <select
                    value={rule.data_category}
                    onChange={event => updateRetentionRule(index, { data_category: event.target.value })}
                    className={`${inputClass} mt-1`}
                  >
                    <option value="">Select a category</option>
                    {DATA_CATEGORIES.map(category => (
                      <option key={category.key} value={category.key}>{category.label}</option>
                    ))}
                  </select>
                </label>
                <label className="block min-w-0 text-xs font-medium text-text-muted">
                  Retention period
                  <input
                    value={rule.period}
                    onChange={event => updateRetentionRule(index, { period: event.target.value })}
                    placeholder="e.g. 3 years after account closure"
                    className={`${inputClass} mt-1`}
                  />
                </label>
                <button
                  type="button"
                  onClick={() => removeRetentionRule(index)}
                  aria-label={`Remove retention rule ${index + 1}`}
                  className="grid h-10 w-10 place-items-center rounded-lg text-text-faint transition-colors hover:bg-red/10 hover:text-red"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
            {!retention.length && (
              <p className="rounded-lg border border-dashed border-line p-3 text-xs leading-relaxed text-text-faint">
                Add a rule for any category with a specific legal or operational retention period.
              </p>
            )}
          </div>
        </div>

        {/* Third parties */}
        <div>
          <label className="block text-sm font-medium text-text mb-2">Third-party sharing</label>
          <div className="flex flex-wrap gap-2">
            {THIRD_PARTY_CATEGORIES.map(tp => {
              const selected = thirdParties.includes(tp.key)
              return (
                <button
                  key={tp.key}
                  type="button"
                  onClick={() => setThirdParties(selected ? thirdParties.filter(t => t !== tp.key) : [...thirdParties, tp.key])}
                  className={`min-h-10 rounded-full px-3 py-2 text-xs font-medium transition-colors ${
                    selected
                      ? 'bg-accent text-white'
                      : 'bg-surface-2 text-text-muted hover:bg-surface-2'
                  }`}
                >
                  {tp.label}
                </button>
              )
            })}
          </div>
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
            Personal data is transferred outside India
          </label>
          {crossBorder && (
            <div className="mt-2">
              <input
                value={crossBorderCountries}
                onChange={e => setCrossCountries(e.target.value)}
                placeholder="List countries, e.g. USA, EU, Singapore"
                className={inputClass}
              />
            </div>
          )}
        </div>

        {/* Validation issues */}
        {validationIssues.length > 0 && (
          <div className="rounded-lg border border-amber/25 bg-amber/[0.07] p-3 text-sm">
            <div className="mb-1 flex items-center gap-2 font-medium text-amber">
              <AlertTriangle size={14} /> Please fix the following:
            </div>
            <ul className="list-inside list-disc space-y-0.5 text-text-muted">
              {validationIssues.map((issue, i) => <li key={i}>{issue}</li>)}
            </ul>
          </div>
        )}

        {error && <p className="rounded-lg border border-red/25 bg-red/[0.07] px-3 py-2 text-sm text-red">{error}</p>}

        {/* Generate button */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={generating}
            className="inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-soft disabled:opacity-50 sm:w-auto"
          >
            <Sparkles size={15} /> {generating ? 'Generating…' : 'Generate Notice'}
          </button>
          {generatedContent && (
            <button
              type="button"
              onClick={() => setShowPreview(p => !p)}
              className="inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-lg border border-line px-4 py-2 text-sm font-medium text-text transition-colors hover:bg-glass sm:w-auto"
            >
              {showPreview ? <><EyeOff size={14} /> Hide preview</> : <><Eye size={14} /> Show preview</>}
            </button>
          )}
        </div>
      </div>

      {/* Preview side */}
      <div>
        {showPreview && generatedContent ? (
          <div className="space-y-4 lg:sticky lg:top-24">
            <NoticePreview content={generatedContent} language={language} />
            <button
              type="button"
              onClick={handlePublish}
              disabled={publishing}
              className="min-h-11 w-full rounded-lg bg-green-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50"
            >
              {publishing ? 'Publishing…' : 'Save & Publish This Version'}
            </button>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-line p-6 text-center text-text-faint sm:p-8 lg:sticky lg:top-24">
            <Eye size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">Fill in the form and click <strong>Generate Notice</strong> to preview.</p>
          </div>
        )}
      </div>
    </div>
  )
}
