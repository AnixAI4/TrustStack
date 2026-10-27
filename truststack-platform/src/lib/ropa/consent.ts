// M6 ROPA — ROPA ↔ Consent cross-reference. CLIENT-SAFE (no SDK / no DB import):
// a pure matcher that the list/detail/stats API routes feed with the org's
// consent_purposes rows (M2). Note #6 — this is a READ-TIME join, never a stored
// column.
//
// Heuristic: an activity whose legal basis is consent (Section 6) is considered
// "configured" if the org has a consent purpose that shares a meaningful keyword
// with the activity's processing purposes or data categories. Activities on any
// other legal basis don't require a consent purpose → 'not_applicable'.
import { DATA_CATEGORIES } from '@/lib/constants'
import type { ConsentPurpose, RopaEntry, RopaConsentCoverage } from '@/types/dpdp'

// The legal-basis id (DPDP_BASES) that means "Consent under Section 6".
export const CONSENT_LEGAL_BASIS = 'consent_s6'

// Generic words that carry no matching signal — excluded from token overlap.
const STOPWORDS = new Set([
  'data', 'personal', 'processing', 'process', 'purpose', 'purposes', 'service',
  'services', 'information', 'this', 'that', 'with', 'your', 'our', 'the', 'and',
  'for', 'from', 'via', 'using', 'used', 'use', 'provide', 'providing', 'manage',
  'management', 'related', 'other', 'into', 'across', 'their', 'them', 'about',
])

const categoryLabel = (key: string): string =>
  DATA_CATEGORIES.find(c => c.key === key)?.label ?? key

// Significant lowercase tokens (length ≥ 4, not a stopword) from a set of strings.
function tokenize(parts: (string | null | undefined)[]): Set<string> {
  const tokens = new Set<string>()
  for (const part of parts) {
    if (!part) continue
    for (const raw of part.toLowerCase().split(/[^a-z0-9]+/)) {
      if (raw.length >= 4 && !STOPWORDS.has(raw)) tokens.add(raw)
    }
  }
  return tokens
}

// Compute whether a single ROPA entry has a matching consent purpose configured.
export function computeConsentCoverage(
  entry: Pick<RopaEntry, 'legal_basis' | 'processing_purposes' | 'data_categories' | 'activity_name'>,
  purposes: Pick<ConsentPurpose, 'name_en' | 'description_en' | 'purpose_key'>[],
): RopaConsentCoverage {
  if (entry.legal_basis !== CONSENT_LEGAL_BASIS) {
    return { status: 'not_applicable', matched_purposes: [] }
  }

  const entryTokens = tokenize([
    entry.activity_name,
    ...(entry.processing_purposes ?? []),
    ...(entry.data_categories ?? []).map(categoryLabel),
  ])

  const matched: string[] = []
  for (const p of purposes) {
    const purposeTokens = tokenize([p.name_en, p.description_en, p.purpose_key])
    for (const t of purposeTokens) {
      if (entryTokens.has(t)) { matched.push(p.name_en); break }
    }
  }

  return {
    status: matched.length > 0 ? 'configured' : 'missing',
    matched_purposes: matched,
  }
}

// Build an entryId → coverage map for a list of entries against the org's
// consent purposes (one pass; used by the list + consent-coverage routes).
export function buildCoverageMap(
  entries: Pick<RopaEntry, 'id' | 'legal_basis' | 'processing_purposes' | 'data_categories' | 'activity_name'>[],
  purposes: Pick<ConsentPurpose, 'name_en' | 'description_en' | 'purpose_key'>[],
): Record<string, RopaConsentCoverage> {
  const map: Record<string, RopaConsentCoverage> = {}
  for (const e of entries) map[e.id] = computeConsentCoverage(e, purposes)
  return map
}
