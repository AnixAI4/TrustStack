// M7 Vendor DPA - prompt builders for Claude-generated Data Processing Agreements.
// CLIENT-SAFE (no SDK import), mirroring src/lib/platform/dsr/draft.ts so the Anthropic
// call stays isolated in the API route (src/app/api/vendors/[id]/dpa/route.ts).
import type { Vendor } from '@/types/dpdp'
import { VENDOR_TYPES, VENDOR_RISK_TIERS } from '@/lib/platform/constants'

export const DPA_SYSTEM_PROMPT = `You are a DPDP (India Digital Personal Data Protection Act, 2023) legal-drafting assistant. You draft a Data Processing Agreement (DPA) between a Data Fiduciary (the company) and a Data Processor (the vendor).

Rules:
- Output a complete, ready-to-review DPA in clean GitHub-flavoured Markdown ONLY. No preamble, no closing commentary, no code fences.
- Start with a level-1 heading "# Data Processing Agreement" followed by the parties.
- Use clear numbered sections. Include, at minimum: 1. Parties & Definitions, 2. Subject Matter & Duration, 3. Nature and Purpose of Processing, 4. Categories of Personal Data & Data Principals, 5. Obligations of the Processor (process only on documented instructions; confidentiality; assist with data-principal rights under DPDP §§11-15), 6. Security Measures (DPDP §8(5) reasonable security safeguards), 7. Sub-processing (prior authorisation + flow-down terms), 8. Personal Data Breach (assist the Fiduciary's reporting to the Data Protection Board of India), 9. Cross-Border Transfers & Data Localisation, 10. Audits & Compliance Evidence, 11. Return or Deletion of Personal Data on termination, 12. Liability & Indemnity, 13. Governing Law (India).
- Cite specific DPDP sections inline where relevant (e.g. "(DPDP §8(5))").
- Tailor depth and the security/sub-processor/transfer clauses to the vendor type and risk tier provided. For HIGH or CRITICAL risk, add stricter controls (e.g. shorter breach-notification SLA, mandatory India data residency, pre-approval of every sub-processor, enhanced audit rights).
- Where a concrete commercial detail is unknown, insert a clearly bracketed placeholder like [insert breach-notification window] rather than inventing it.
- Do NOT invent certifications, dates, or facts not provided. This is a draft template for legal review, not final legal advice - include a one-line note to that effect at the very end.`

function vendorTypeLabel(t: string): string {
  return VENDOR_TYPES.find(v => v.value === t)?.label ?? t
}

function riskLabel(tier: string | null): string {
  if (!tier) return 'Not yet assessed'
  return VENDOR_RISK_TIERS[tier as keyof typeof VENDOR_RISK_TIERS]?.label ?? tier
}

export function buildDpaUserPrompt(vendor: Vendor, orgName: string): string {
  const locations = (vendor.data_location ?? []).join(', ') || 'not specified'
  const categories = (vendor.personal_data_categories ?? []).join(', ') || 'not specified'
  return `Draft a DPDP-compliant Data Processing Agreement.

Data Fiduciary (Company): ${orgName}
Data Processor (Vendor): ${vendor.name}
Vendor category: ${vendorTypeLabel(vendor.vendor_type)}
Assessed risk tier: ${riskLabel(vendor.risk_tier)}${vendor.risk_score != null ? ` (risk score ${vendor.risk_score}/100)` : ''}
Stores data in India: ${vendor.india_data_residency ? 'Yes' : 'No / unconfirmed'}
Data storage location(s): ${locations}
Categories of personal data processed: ${categories}
Vendor contact: ${vendor.contact_name || 'not provided'}${vendor.contact_email ? ` <${vendor.contact_email}>` : ''}

Produce the full DPA tailored to the above. Apply stricter clauses if the risk tier is High or Critical, or if data is not confirmed to be stored in India.`
}
