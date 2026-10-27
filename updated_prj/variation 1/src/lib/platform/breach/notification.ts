// M8 Breach - DPBI notification prompt builders for Claude. CLIENT-SAFE (no SDK
// import), mirroring src/lib/platform/vendors/dpa.ts so the Anthropic call stays isolated
// in the API route (src/app/api/breach/[id]/dpbi-draft/route.ts). The output is a
// FORMAL LETTER in Markdown / plain text - NOT JSON (unlike M6's structured
// AI-assist). The "Contact person for DPBI follow-up" is pulled from the org's
// active M4 Grievance Officer server-side and passed in here - never the client.
import type { BreachIncident } from '@/types/dpdp'
import { BREACH_NATURE_TYPES, DATA_CATEGORIES } from '@/lib/platform/constants'

export const DPBI_SYSTEM_PROMPT = `You are a DPDP (India Digital Personal Data Protection Act, 2023) compliance assistant drafting a personal data breach notification from a Data Fiduciary to the Data Protection Board of India (DPBI), under Section 8(6) and the DPDP Rules 2025, Rule 7.

Rules:
- Output a complete, ready-to-review FORMAL LETTER addressed to the Data Protection Board of India, in clean plain text / lightweight Markdown ONLY. No preamble, no closing commentary, no code fences.
- Professional, factual tone. State only what is provided - do NOT speculate or invent facts, dates, certifications, or numbers. Where a required detail is unknown, insert a clearly bracketed placeholder like [to be confirmed] rather than guessing.
- The letter MUST address, as clearly labelled sections, EVERY field required under DPDP Rules 2025 Rule 7: (1) nature and extent of the breach; (2) timing - when discovered and, if known, when it occurred; (3) categories of personal data involved; (4) approximate number of data principals affected; (5) likely consequences of the breach; (6) measures taken or proposed to address the breach and mitigate harm; (7) contact person for DPBI follow-up.
- For "likely consequences", reason conservatively from the nature of the breach and the categories of data involved; frame them as potential / likely harms, not certainties.
- End with a single-line note that this is a draft prepared for internal review and is not a substitute for legal advice.`

function natureLabel(n: string): string {
  return BREACH_NATURE_TYPES.find(x => x.value === n)?.label ?? n
}

function categoryLabels(keys: string[] | null | undefined): string {
  if (!keys || keys.length === 0) return 'not specified'
  return keys.map(k => DATA_CATEGORIES.find(c => c.key === k)?.label ?? k).join(', ')
}

// The DPBI follow-up contact - sourced from the org's active grievance_officers
// row in the route, never trusted from the client (mirrors M3's notice officer).
export interface DpbiContact {
  name: string
  designation: string
  email: string
  phone: string | null
}

export function buildDpbiUserPrompt(
  breach: BreachIncident,
  orgName: string,
  contact: DpbiContact,
): string {
  const categories = categoryLabels(breach.data_categories_affected)
  const systems = (breach.systems_involved ?? []).join(', ') || 'not specified'
  const count =
    breach.data_subjects_affected_approx != null
      ? String(breach.data_subjects_affected_approx)
      : 'unknown / to be confirmed'
  const occurred = breach.occurred_at ? new Date(breach.occurred_at).toUTCString() : 'not known'
  const contactLine = `${contact.name}, ${contact.designation} - ${contact.email}${contact.phone ? `, ${contact.phone}` : ''}`

  return `Generate a breach notification to the Data Protection Board of India (DPBI) under DPDP Act 2023, Section 8(6) and Rule 7.

Data Fiduciary: ${orgName}
Breach reference: ${breach.reference_number}
Breach discovered: ${new Date(breach.discovered_at).toUTCString()}
When the breach occurred: ${occurred}
Nature: ${natureLabel(breach.nature)}
Data categories affected: ${categories}
Approximate data principals affected: ${count}
Systems involved: ${systems}
Discovery method: ${breach.discovery_method || 'not specified'}
Containment actions taken: ${breach.containment_actions || 'not specified'}
Contact person for DPBI follow-up: ${contactLine}

Include all fields required under DPDP Rules 2025 Rule 7:
1. Nature and extent of the breach
2. Timing (when discovered, when occurred if known)
3. Categories of personal data involved
4. Approximate number of data principals affected
5. Likely consequences of the breach
6. Measures taken/proposed to address the breach
7. Contact person for DPBI follow-up

Format: Formal letter to DPBI. Professional tone. Factual, no speculation.`
}
