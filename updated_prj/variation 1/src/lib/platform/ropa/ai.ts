// M6 ROPA - AI-assisted entry. CLIENT-SAFE (no @anthropic-ai/sdk import), so the
// builder UI can import the prompt/sanitizer if needed and the Anthropic call
// stays isolated in the route (src/app/api/ropa/ai-suggest/route.ts). Mirrors
// src/lib/platform/vendors/dpa.ts + src/lib/platform/dsr/draft.ts.
//
// The route asks Claude for ONLY a JSON object (the ROPA fields) and parses it
// defensively with sanitizeRopaSuggestion below.
import { DATA_CATEGORIES, ROPA_SUBJECT_TYPES, DPDP_BASES } from '@/lib/platform/constants'
import type { RopaAiSuggestion } from '@/types/dpdp'

const VALID_CATEGORY_KEYS = new Set(DATA_CATEGORIES.map(c => c.key))
const VALID_SUBJECT_TYPES = new Set<string>(ROPA_SUBJECT_TYPES.map(s => s.value))
const VALID_BASES = new Set<string>(DPDP_BASES.map(b => b.id))

export const ROPA_AI_SYSTEM_PROMPT = `You are a DPDP (India Digital Personal Data Protection Act, 2023) compliance assistant. You help a Data Fiduciary build a Record of Processing Activities (ROPA) entry from a plain-language description of what they do with personal data.

Your job: read the description and return ONE structured JSON object describing the processing activity.

STRICT OUTPUT RULES:
- Output ONLY a single JSON object. No prose, no explanation, no Markdown, no code fences.
- Use ONLY these keys (omit any you cannot reasonably infer): activity_name, activity_description, data_controller_name, data_categories, data_subject_types, processing_purposes, legal_basis, data_sources, recipients, cross_border_transfer, transfer_countries, retention_period, security_measures, processor_names.
- "data_categories" MUST be an array drawn ONLY from the allowed category keys provided in the user message. Do not invent keys.
- "data_subject_types" MUST be an array drawn ONLY from the allowed subject-type values provided.
- "legal_basis" MUST be exactly one of the allowed legal-basis ids provided. Choose the single most appropriate basis; prefer "consent_s6" unless a statutory/employment basis clearly applies.
- "cross_border_transfer" is a boolean.
- "processing_purposes", "data_sources", "recipients", "transfer_countries", "security_measures", "processor_names" are arrays of short free-text strings.
- "retention_period" is a short free-text string (e.g. "5 years after account closure").
- Be specific and concrete, but NEVER invent facts not implied by the description. Leave a field out rather than guessing wildly.
- Suggest reasonable DPDP-aligned security_measures (e.g. "Encryption at rest and in transit", "Role-based access control", "Audit logging") even if not stated.`

export function buildRopaSuggestPrompt(
  description: string,
  ctx: { orgName?: string; industry?: string | null },
): string {
  const categories = DATA_CATEGORIES.map(c => `${c.key} (${c.label})`).join(', ')
  const subjects = ROPA_SUBJECT_TYPES.map(s => `${s.value} (${s.label})`).join(', ')
  const bases = DPDP_BASES.map(b => `${b.id} (${b.label})`).join(', ')

  return `Build a single ROPA entry from this description of a processing activity.

Organization (Data Fiduciary): ${ctx.orgName || 'the organization'}
Industry: ${ctx.industry || 'not specified'}

Description from the user:
"""
${description.trim()}
"""

Allowed data_categories keys (use ONLY these): ${categories}

Allowed data_subject_types values (use ONLY these): ${subjects}

Allowed legal_basis ids (choose exactly ONE): ${bases}

Default data_controller_name to the organization name above unless the description names a different controller.

Return ONLY the JSON object.`
}

// ── Defensive parsing / validation ─────────────────────────────────────────

function cleanStr(v: unknown, max = 500): string | undefined {
  if (typeof v !== 'string') return undefined
  const s = v.trim()
  return s ? s.slice(0, max) : undefined
}

function cleanStrArray(v: unknown, opts: { allowed?: Set<string>; maxItems?: number; maxLen?: number } = {}): string[] | undefined {
  if (!Array.isArray(v)) return undefined
  const { allowed, maxItems = 20, maxLen = 300 } = opts
  const out: string[] = []
  const seen = new Set<string>()
  for (const item of v) {
    if (typeof item !== 'string') continue
    const s = item.trim().slice(0, maxLen)
    if (!s) continue
    if (allowed && !allowed.has(s)) continue
    const key = s.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(s)
    if (out.length >= maxItems) break
  }
  return out.length ? out : undefined
}

// Validate Claude's JSON into a clean RopaAiSuggestion. Unknown keys are ignored,
// enums are filtered to valid values, and anything malformed is simply dropped.
export function sanitizeRopaSuggestion(raw: unknown): RopaAiSuggestion {
  let obj: unknown = raw
  if (typeof raw === 'string') {
    try { obj = JSON.parse(raw) } catch { return {} }
  }
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return {}
  const r = obj as Record<string, unknown>

  const suggestion: RopaAiSuggestion = {}

  const activityName = cleanStr(r.activity_name, 200)
  if (activityName) suggestion.activity_name = activityName

  const activityDescription = cleanStr(r.activity_description, 2000)
  if (activityDescription) suggestion.activity_description = activityDescription

  const controller = cleanStr(r.data_controller_name, 200)
  if (controller) suggestion.data_controller_name = controller

  const categories = cleanStrArray(r.data_categories, { allowed: VALID_CATEGORY_KEYS })
  if (categories) suggestion.data_categories = categories

  const subjects = cleanStrArray(r.data_subject_types, { allowed: VALID_SUBJECT_TYPES })
  if (subjects) suggestion.data_subject_types = subjects

  const purposes = cleanStrArray(r.processing_purposes, { maxItems: 12 })
  if (purposes) suggestion.processing_purposes = purposes

  if (typeof r.legal_basis === 'string' && VALID_BASES.has(r.legal_basis)) {
    suggestion.legal_basis = r.legal_basis
  }

  const sources = cleanStrArray(r.data_sources)
  if (sources) suggestion.data_sources = sources

  const recipients = cleanStrArray(r.recipients)
  if (recipients) suggestion.recipients = recipients

  if (typeof r.cross_border_transfer === 'boolean') {
    suggestion.cross_border_transfer = r.cross_border_transfer
  }

  const countries = cleanStrArray(r.transfer_countries)
  if (countries) suggestion.transfer_countries = countries

  const retention = cleanStr(r.retention_period, 300)
  if (retention) suggestion.retention_period = retention

  const security = cleanStrArray(r.security_measures)
  if (security) suggestion.security_measures = security

  const processors = cleanStrArray(r.processor_names)
  if (processors) suggestion.processor_names = processors

  return suggestion
}
