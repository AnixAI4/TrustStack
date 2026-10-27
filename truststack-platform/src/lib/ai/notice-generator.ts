// M3: Privacy Notice generation — Claude prompts, prompt assembly, and the
// pre-publish compliance validator. Kept framework-free so it can be imported
// by the API routes (server) without pulling in any React/Next dependencies.

import { DPDP_BASES, DATA_CATEGORIES, THIRD_PARTY_CATEGORIES } from '@/lib/constants'
import type { NoticeBuilderData } from '@/types/dpdp'

// Exact system prompt (do not paraphrase) — see P0_M3 Step 5.
export const NOTICE_GENERATION_PROMPT = `You are a DPDP (Digital Personal Data Protection Act 2023, India) compliance expert.
Generate a comprehensive, legally compliant Privacy Notice for an Indian company.

The notice MUST include:
1. Identity and contact details of the Data Fiduciary
2. Categories of personal data collected (from the provided list)
3. Purposes of processing for each data category
4. Legal basis for each processing purpose (Section 6 consent or Section 7 legitimate uses)
5. Categories of recipients (third parties the data is shared with)
6. Cross-border transfer details (if applicable)
7. Data retention periods
8. All 7 rights of Data Principals under DPDP:
   - Right to Access Information (Section 11)
   - Right to Correction (Section 12(a))
   - Right to Completeness (Section 12(b))
   - Right to Erasure (Section 12(c))
   - Right to Restrict Processing (Section 13)
   - Right to Grievance Redressal (Section 14)
   - Right to Nominate (Section 15)
9. How to exercise each right (contact the Grievance Officer)
10. Grievance Officer name, designation, email, and phone
11. How to withdraw consent
12. Breach notification commitment
13. Reference to DPDP Act 2023

Write in clear, simple language (avoid legal jargon). The notice should be readable by a person with 10th-grade education.
Use proper headings and numbered sections.
Output in Markdown format.`

// Human-readable label lookups
function dataCategoryLabel(key: string): string {
  return DATA_CATEGORIES.find(c => c.key === key)?.label ?? key
}
function basisLabel(id: string): string {
  return DPDP_BASES.find(b => b.id === id)?.label ?? id
}
function thirdPartyLabel(key: string): string {
  return THIRD_PARTY_CATEGORIES.find(t => t.key === key)?.label ?? key
}

export interface NoticeGenerationContext {
  builder: NoticeBuilderData
  organization_name: string
  cin: string | null
  grievance_officer: {
    name: string
    designation: string
    email: string
    phone: string | null
  }
}

// Build the user-turn prompt from the structured wizard data + authoritative
// org/officer details fetched server-side.
export function buildNoticeUserPrompt(ctx: NoticeGenerationContext): string {
  const { builder, organization_name, cin, grievance_officer } = ctx
  const company = builder.company

  const categories = builder.data_categories.map(key => {
    if (key === 'other') return builder.other_category?.trim() || 'Other personal data'
    return dataCategoryLabel(key)
  })

  const purposeLines = builder.purposes
    .filter(p => p.purpose.trim())
    .map(p => `- ${dataCategoryLabel(p.data_category)}: ${p.purpose.trim()} (Legal basis: ${basisLabel(p.basis)})`)

  const retentionLines = builder.retention
    .filter(r => r.period.trim())
    .map(r => `- ${dataCategoryLabel(r.data_category)}: ${r.period.trim()}`)

  const thirdParties = builder.sharing.third_parties.map(thirdPartyLabel)

  return [
    `## Company / Data Fiduciary`,
    `- Legal name: ${company.legal_name || organization_name}`,
    `- Registered address: ${company.registered_address || 'Not provided'}`,
    cin ? `- Corporate Identification Number (CIN): ${cin}` : null,
    `- Data Fiduciary contact email: ${company.contact_email || grievance_officer.email}`,
    ``,
    `## Categories of personal data collected`,
    categories.length ? categories.map(c => `- ${c}`).join('\n') : '- (none specified)',
    ``,
    `## Processing purposes & legal basis`,
    purposeLines.length ? purposeLines.join('\n') : '- (none specified)',
    ``,
    `## Data sharing`,
    thirdParties.length
      ? `Shared with these categories of recipients:\n${thirdParties.map(t => `- ${t}`).join('\n')}`
      : 'No personal data is shared with third parties.',
    builder.sharing.cross_border
      ? `Cross-border transfers: YES${builder.sharing.countries.trim() ? ` — countries: ${builder.sharing.countries.trim()}` : ''}.`
      : 'Cross-border transfers: None. Data is processed within India.',
    ``,
    `## Data retention`,
    retentionLines.length ? retentionLines.join('\n') : '- Retained only as long as necessary for the stated purposes.',
    ``,
    `## Grievance Officer (DPDP Section 14)`,
    `- Name: ${grievance_officer.name}`,
    `- Designation: ${grievance_officer.designation}`,
    `- Email: ${grievance_officer.email}`,
    grievance_officer.phone ? `- Phone: ${grievance_officer.phone}` : null,
    ``,
    `Generate the full DPDP-compliant Privacy Notice now using the structure required above. Use the company's legal name as the title. Address the reader as "you".`,
  ]
    .filter(line => line !== null)
    .join('\n')
}

// Translation prompt — preserves Markdown structure and legal precision.
export function buildTranslationSystemPrompt(targetLanguageName: string): string {
  return `You are a professional legal translator specializing in Indian languages and the Digital Personal Data Protection Act 2023.

Translate the user's Privacy Notice from English into ${targetLanguageName}.

Rules:
- Preserve the EXACT Markdown structure: headings (#, ##, ###), numbered/bulleted lists, bold, and line breaks.
- Keep proper nouns, email addresses, phone numbers, URLs, and DPDP Section references (e.g. "Section 11", "DPDP Act 2023") unchanged.
- Use clear, simple ${targetLanguageName} a person with 10th-grade education can read.
- Output ONLY the translated Markdown — no preamble, no explanation.`
}

// Pre-publish compliance checks (P0_M3 Step 7). Returns an array of human-
// readable errors; an empty array means the notice is publishable.
export interface NoticeValidationInput {
  content_en: string | null | undefined
  grievance_officer_name: string | null | undefined
  grievance_officer_email: string | null | undefined
}

export function validateNotice(version: NoticeValidationInput): string[] {
  const errors: string[] = []
  const content = version.content_en || ''

  if (!version.grievance_officer_name) errors.push('Grievance Officer not set')
  if (!version.grievance_officer_email) errors.push('Grievance Officer email required')
  if (!content.includes('Section 11')) errors.push('Notice missing rights section (Section 11)')
  if (!/withdraw/i.test(content)) errors.push('Notice missing consent withdrawal instructions')
  if (!content.includes('72')) errors.push('Notice should mention the 72-hour breach notification timeline')

  return errors
}
