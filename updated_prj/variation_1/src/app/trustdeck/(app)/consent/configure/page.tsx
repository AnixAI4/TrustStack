'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, Check, Save } from 'lucide-react'
import toast from 'react-hot-toast'
import { SUPPORTED_LANGUAGES, DEFAULT_PURPOSES } from '@/lib/platform/constants'
import { PurposeEditor, type Purpose as PurposeFormData } from '@/components/platform/modules/consent/PurposeEditor'
import { WidgetPreview } from '@/components/platform/modules/consent/WidgetPreview'

type Step = 1 | 2 | 3 | 4

interface ConfigForm {
  purposes: PurposeFormData[]
  languages: string[]
  position: 'bottom-bar' | 'corner-popup' | 'center-modal'
  primary_color: string
  show_reject_all: boolean
  require_age_confirmation: boolean
  whatsapp_enabled: boolean
}

const DEFAULT_FORM: ConfigForm = {
  purposes: DEFAULT_PURPOSES.map(p => ({
    ...p,
    name_hi: p.name_hi || '',
    name_ta: p.name_ta || '',
    name_te: p.name_te || '',
  })),
  languages: ['en', 'hi'],
  position: 'bottom-bar',
  primary_color: '003366',
  show_reject_all: true,
  require_age_confirmation: false,
  whatsapp_enabled: false,
}

const STEPS = [
  { num: 1, label: 'Purposes' },
  { num: 2, label: 'Languages' },
  { num: 3, label: 'Customize' },
  { num: 4, label: 'Preview & Save' },
] as const

export default function ConsentConfigurePage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>(1)
  const [form, setForm] = useState<ConfigForm>(DEFAULT_FORM)
  const [saving, setSaving] = useState(false)
  const [loadingExisting, setLoadingExisting] = useState(true)

  useEffect(() => {
    fetch('/api/trustdeck/consent/manage').then(r => r.json()).then(manage => {
      if (manage?.config) {
        const { config, purposes } = manage
        setForm({
          purposes: (purposes || []).map((p: {
            purpose_key: string
            name_en: string
            name_hi: string | null
            name_ta: string | null
            name_te: string | null
            description_en: string
            required: boolean
            dpdp_basis: string | null
          }) => ({
            purpose_key: p.purpose_key,
            name_en: p.name_en,
            name_hi: p.name_hi || '',
            name_ta: p.name_ta || '',
            name_te: p.name_te || '',
            description_en: p.description_en,
            required: p.required,
            dpdp_basis: p.dpdp_basis || 'consent_s6',
          })),
          languages: config.languages || ['en', 'hi'],
          position: config.position || 'bottom-bar',
          primary_color: config.primary_color || '003366',
          show_reject_all: config.show_reject_all ?? true,
          require_age_confirmation: config.require_age_confirmation ?? false,
          whatsapp_enabled: config.whatsapp_enabled ?? false,
        })
      }
    }).finally(() => setLoadingExisting(false))
  }, [])

  const toggleLanguage = (code: string) => {
    if (code === 'en') return // English cannot be removed
    setForm(prev => ({
      ...prev,
      languages: prev.languages.includes(code)
        ? prev.languages.filter(l => l !== code)
        : [...prev.languages, code],
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/trustdeck/consent/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          purposes: form.purposes,
          languages: form.languages,
          position: form.position,
          primary_color: form.primary_color.replace('#', ''),
          show_reject_all: form.show_reject_all,
          require_age_confirmation: form.require_age_confirmation,
          whatsapp_enabled: form.whatsapp_enabled,
        }),
      })
      const data = await res.json()
      if (data.error) {
        toast.error(data.error)
      } else {
        toast.success('Consent configuration saved!')
        router.push('/trustdeck/consent')
      }
    } catch {
      toast.error('Failed to save configuration')
    } finally {
      setSaving(false)
    }
  }

  if (loadingExisting) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="h-8 bg-surface-2 rounded w-48 animate-pulse mb-8" />
        <div className="h-64 bg-surface-2 rounded-xl animate-pulse" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push('/trustdeck/consent')}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-text-faint transition-colors hover:bg-glass hover:text-text"
          aria-label="Back to Consent Management"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="font-display text-xl font-semibold text-text sm:text-2xl">Configure Consent Widget</h1>
          <p className="text-sm text-text-muted">Set up your DPDP-compliant consent banner</p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-0">
        {STEPS.map((s, i) => (
          <div key={s.num} className="flex items-center flex-1 last:flex-none">
            <button
              onClick={() => step > s.num && setStep(s.num as Step)}
              className={`flex items-center gap-2 shrink-0 ${step > s.num ? 'cursor-pointer' : 'cursor-default'}`}
            >
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                step > s.num
                  ? 'bg-green text-white'
                  : step === s.num
                  ? 'bg-accent text-[color:var(--on-accent)]'
                  : 'bg-surface-2 text-text-faint'
              }`}>
                {step > s.num ? <Check className="w-4 h-4" /> : s.num}
              </div>
              <span className={`text-sm hidden sm:block ${step === s.num ? 'text-accent font-medium' : 'text-text-faint'}`}>
                {s.label}
              </span>
            </button>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 ${step > s.num ? 'bg-green/40' : 'bg-surface-2'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="rounded-xl border border-line bg-bg-2 p-6 shadow-card">

        {/* Step 1: Purposes */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <h2 className="font-semibold text-text">Consent Purposes</h2>
              <p className="text-sm text-text-muted mt-1">
                Define what data you process and why. Each purpose shown to users when they consent.
              </p>
            </div>
            <PurposeEditor
              purposes={form.purposes}
              onChange={purposes => setForm(prev => ({ ...prev, purposes }))}
            />
          </div>
        )}

        {/* Step 2: Languages */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <h2 className="font-semibold text-text">Supported Languages</h2>
              <p className="text-sm text-text-muted mt-1">
                The widget auto-detects the visitor&apos;s browser language. Select all languages you support.
                English is always required.
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {SUPPORTED_LANGUAGES.map(lang => {
                const selected = form.languages.includes(lang.code)
                const locked = lang.code === 'en'
                return (
                  <button
                    key={lang.code}
                    onClick={() => toggleLanguage(lang.code)}
                    disabled={locked}
                    className={`flex items-center gap-2 p-3 rounded-lg border text-left transition-colors ${
                      selected
                        ? 'border-accent/40 bg-accent/8'
                        : 'border-line hover:border-line'
                    } ${locked ? 'opacity-70 cursor-not-allowed' : ''}`}
                  >
                    <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                      selected ? 'bg-accent border-accent' : 'border-line'
                    }`}>
                      {selected && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text leading-tight">{lang.name}</p>
                      <p className="text-xs text-text-faint">{lang.nativeName}</p>
                    </div>
                  </button>
                )
              })}
            </div>
            <p className="text-xs text-text-faint">
              {form.languages.length} language{form.languages.length !== 1 ? 's' : ''} selected
            </p>
          </div>
        )}

        {/* Step 3: Visual customization */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="font-semibold text-text">Widget Appearance</h2>
              <p className="text-sm text-text-muted mt-1">Customize how the consent banner appears to your visitors.</p>
            </div>

            {/* Position */}
            <div>
              <label className="block text-sm font-medium text-text mb-3">Banner Position</label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {([
                  { value: 'bottom-bar',    label: 'Bottom Bar',    desc: 'Full-width at bottom' },
                  { value: 'corner-popup',  label: 'Corner Popup',  desc: 'Bottom-right corner' },
                  { value: 'center-modal',  label: 'Center Modal',  desc: 'Centered overlay' },
                ] as const).map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setForm(prev => ({ ...prev, position: opt.value }))}
                    className={`p-3 rounded-xl border-2 text-left transition-colors ${
                      form.position === opt.value
                        ? 'border-accent/40 bg-accent/8'
                        : 'border-line hover:border-line'
                    }`}
                  >
                    <p className="text-sm font-medium text-text">{opt.label}</p>
                    <p className="text-xs text-text-faint mt-0.5">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Primary color */}
            <div>
              <label className="block text-sm font-medium text-text mb-2">Primary Color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={form.primary_color.startsWith('#') ? form.primary_color : `#${form.primary_color}`}
                  onChange={e => setForm(prev => ({ ...prev, primary_color: e.target.value.replace('#', '') }))}
                  className="w-10 h-10 rounded-lg border border-line cursor-pointer"
                />
                <input
                  type="text"
                  value={form.primary_color}
                  onChange={e => setForm(prev => ({ ...prev, primary_color: e.target.value.replace('#', '') }))}
                  placeholder="003366"
                  className="border border-line rounded-lg px-3 py-2 text-sm font-mono w-32 focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
                <span className="text-sm text-text-faint">Hex code</span>
              </div>
            </div>

            {/* Toggles */}
            <div className="space-y-3">
              {([
                { key: 'show_reject_all',        label: 'Show "Reject All" button', desc: 'Required for DPDP compliance - equal visual weight with Accept All' },
                { key: 'require_age_confirmation', label: 'Require age confirmation', desc: 'User must confirm they are 18+ before consenting' },
                { key: 'whatsapp_enabled',         label: 'Enable WhatsApp consent channel', desc: 'Allow consent collection via WhatsApp (requires WhatsApp Business API)' },
              ] as const).map(({ key, label, desc }) => (
                <div key={key} className="flex items-start gap-3 p-3 rounded-xl border border-line">
                  <button
                    onClick={() => setForm(prev => ({ ...prev, [key]: !prev[key] }))}
                    className={`relative w-10 h-6 rounded-full transition-colors shrink-0 mt-0.5 ${
                      form[key] ? 'bg-accent' : 'bg-surface-2'
                    }`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-bg-2 rounded-full shadow transition-transform ${
                      form[key] ? 'translate-x-4' : ''
                    }`} />
                  </button>
                  <div>
                    <p className="text-sm font-medium text-text">{label}</p>
                    <p className="text-xs text-text-muted">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Preview */}
        {step === 4 && (
          <div className="space-y-4">
            <div>
              <h2 className="font-semibold text-text">Preview & Save</h2>
              <p className="text-sm text-text-muted mt-1">
                Review how your consent banner will appear to visitors.
              </p>
            </div>
            <WidgetPreview
              brandColor={form.primary_color.startsWith('#') ? form.primary_color : `#${form.primary_color}`}
              language={form.languages[0]}
              purposes={form.purposes}
            />
            <div className="rounded-xl border border-accent/25 bg-accent/8 p-4 text-sm text-accent">
              <p className="font-medium mb-1">Configuration summary</p>
              <ul className="space-y-0.5 text-xs text-text-muted">
                <li>· {form.purposes.length} purposes ({form.purposes.filter(p => p.required).length} required)</li>
                <li>· Languages: {form.languages.join(', ').toUpperCase()}</li>
                <li>· Position: {form.position}</li>
                <li>· Reject All button: {form.show_reject_all ? 'Shown' : 'Hidden'}</li>
                <li>· Age confirmation: {form.require_age_confirmation ? 'Required' : 'Not required'}</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => step > 1 && setStep((step - 1) as Step)}
          disabled={step === 1}
          className="flex items-center gap-2 px-4 py-2 border border-line text-text-muted rounded-lg hover:bg-glass disabled:opacity-40 transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {step < 4 ? (
          <button
            onClick={() => setStep((step + 1) as Step)}
            disabled={step === 1 && form.purposes.length === 0}
            className="btn btn-accent inline-flex items-center gap-2 disabled:opacity-40"
          >
            Next: {STEPS.at(step)?.label}
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn btn-accent inline-flex items-center gap-2 disabled:opacity-60"
          >
            {saving ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saving ? 'Saving…' : 'Save Configuration'}
          </button>
        )}
      </div>
    </div>
  )
}
