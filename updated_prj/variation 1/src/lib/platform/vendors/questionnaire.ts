// M7 Vendor DPA - the 45-question DPDP vendor risk questionnaire (Sections A-G).
// CLIENT-SAFE (no node deps): imported by the public questionnaire form, the
// dashboard detail view, and the risk scorer (src/lib/platform/vendors/risk.ts).
//
// Each scorable question carries a `weight` (its share of the risk denominator)
// and contributes a risk fraction (0 = no risk … 1 = full risk) per answer:
//   - yes_no / yes_no_partial: `riskyAnswer` names the FULL-risk answer.
//       'no'  → a MISSING control     (no = 1, partial = 0.5, yes = 0)
//       'yes' → a RISKY practice present (yes = 1, partial = 0.5, no = 0)
//   - select: each option carries its own `risk` (0..1).
//   - text / weight 0: informational, not scored.
//
// The original spec cited "Company_Documents/09_Vanta analysis", which is not in
// this repo, so this is a self-contained DPDP-aligned vendor questionnaire.

export type VendorQuestionSection =
  | 'company'
  | 'data_handling'
  | 'security'
  | 'subprocessors'
  | 'residency'
  | 'incident'
  | 'dpdp'

export type VendorQuestionType = 'yes_no' | 'yes_no_partial' | 'select' | 'text'

export interface VendorQuestionOption {
  value: string
  label: string
  risk: number // 0 (no risk) … 1 (full risk) contribution of this option
}

export interface VendorQuestion {
  id: string
  section: VendorQuestionSection
  text: string
  type: VendorQuestionType
  weight: number // risk denominator weight; 0 = informational (not scored)
  riskyAnswer?: 'yes' | 'no' // for yes_no / yes_no_partial
  options?: VendorQuestionOption[] // for select
  hint?: string
}

export const VENDOR_QUESTION_SECTIONS: {
  key: VendorQuestionSection
  label: string
  description: string
}[] = [
  { key: 'company',       label: 'A. Company & Certifications', description: 'Who the vendor is and what independent assurance they hold.' },
  { key: 'data_handling', label: 'B. Data Handling',            description: 'What personal data they process for you and how.' },
  { key: 'security',      label: 'C. Security Controls',        description: 'Technical and organisational safeguards.' },
  { key: 'subprocessors', label: 'D. Sub-processors',          description: "Onward processing by the vendor's own suppliers." },
  { key: 'residency',     label: 'E. Data Residency & Transfers', description: 'Where data is stored and how transfers are governed.' },
  { key: 'incident',      label: 'F. Incident Response',        description: 'Breach preparedness and notification.' },
  { key: 'dpdp',          label: 'G. DPDP-Specific Obligations', description: 'Processor duties under the DPDP Act 2023.' },
]

export const VENDOR_QUESTIONS: VendorQuestion[] = [
  // ─── Section A: Company & Certifications (A1-A6) ───
  { id: 'A1', section: 'company', text: 'Legal entity name of the vendor', type: 'text', weight: 0, hint: 'Full registered name of the processor.' },
  {
    id: 'A2', section: 'company', text: 'How long has the vendor been operating?', type: 'select', weight: 1,
    options: [
      { value: 'lt2',   label: 'Less than 2 years', risk: 1 },
      { value: '2to5',  label: '2-5 years',         risk: 0.5 },
      { value: 'gt5',   label: 'More than 5 years', risk: 0 },
    ],
  },
  { id: 'A3', section: 'company', text: 'Is the vendor ISO/IEC 27001 certified?',                       type: 'yes_no',         weight: 3, riskyAnswer: 'no' },
  { id: 'A4', section: 'company', text: 'Can the vendor provide a current SOC 2 Type II report?',        type: 'yes_no_partial', weight: 2, riskyAnswer: 'no' },
  { id: 'A5', section: 'company', text: 'Does the vendor carry cyber-liability / data-breach insurance?', type: 'yes_no',        weight: 2, riskyAnswer: 'no' },
  { id: 'A6', section: 'company', text: 'Has the vendor appointed a Data Protection Officer or privacy lead?', type: 'yes_no',    weight: 2, riskyAnswer: 'no' },

  // ─── Section B: Data Handling (B1-B7) ───
  {
    id: 'B1', section: 'data_handling', text: 'Approximate volume of our personal-data records they process', type: 'select', weight: 2,
    options: [
      { value: 'lt1k',     label: 'Fewer than 1,000',     risk: 0 },
      { value: '1kto100k', label: '1,000 - 1 Lakh',       risk: 0.4 },
      { value: '100kto1m', label: '1 Lakh - 10 Lakh',     risk: 0.7 },
      { value: 'gt1m',     label: 'More than 10 Lakh',    risk: 1 },
    ],
  },
  { id: 'B2', section: 'data_handling', text: "Do they process sensitive personal data (financial, health, biometric, or children's data)?", type: 'yes_no', weight: 3, riskyAnswer: 'yes' },
  { id: 'B3', section: 'data_handling', text: 'Is access to our data limited to a need-to-know basis (role-based access)?',                 type: 'yes_no', weight: 2, riskyAnswer: 'no' },
  { id: 'B4', section: 'data_handling', text: 'Do they maintain a record of processing activities (ROPA)?',                                  type: 'yes_no_partial', weight: 2, riskyAnswer: 'no' },
  { id: 'B5', section: 'data_handling', text: 'Do they use our data for their own purposes (e.g. product analytics or model training)?',     type: 'yes_no', weight: 3, riskyAnswer: 'yes' },
  { id: 'B6', section: 'data_handling', text: 'Is personal data pseudonymised or anonymised wherever feasible?',                             type: 'yes_no_partial', weight: 1, riskyAnswer: 'no' },
  { id: 'B7', section: 'data_handling', text: 'Do they operate a documented data retention and deletion schedule?',                          type: 'yes_no', weight: 2, riskyAnswer: 'no' },

  // ─── Section C: Security Controls (C1-C8) ───
  { id: 'C1', section: 'security', text: 'Is personal data encrypted in transit (TLS 1.2 or higher)?',                 type: 'yes_no',         weight: 3, riskyAnswer: 'no' },
  { id: 'C2', section: 'security', text: 'Is personal data encrypted at rest (AES-256 or equivalent)?',               type: 'yes_no',         weight: 3, riskyAnswer: 'no' },
  { id: 'C3', section: 'security', text: 'Is multi-factor authentication enforced for all privileged / admin access?', type: 'yes_no',        weight: 2, riskyAnswer: 'no' },
  { id: 'C4', section: 'security', text: 'Do they commission independent penetration testing at least annually?',      type: 'yes_no_partial', weight: 2, riskyAnswer: 'no' },
  { id: 'C5', section: 'security', text: 'Do they have centralised logging and security monitoring (SIEM)?',           type: 'yes_no_partial', weight: 2, riskyAnswer: 'no' },
  { id: 'C6', section: 'security', text: 'Do they run a documented vulnerability and patch-management process?',       type: 'yes_no',         weight: 2, riskyAnswer: 'no' },
  { id: 'C7', section: 'security', text: 'Are encrypted backups taken with periodically tested restoration?',          type: 'yes_no',         weight: 2, riskyAnswer: 'no' },
  { id: 'C8', section: 'security', text: 'Is security-awareness training given to staff handling personal data?',      type: 'yes_no_partial', weight: 1, riskyAnswer: 'no' },

  // ─── Section D: Sub-processors (D1-D6) ───
  { id: 'D1', section: 'subprocessors', text: 'Do they engage sub-processors to handle our data?',                              type: 'yes_no',         weight: 2, riskyAnswer: 'yes' },
  { id: 'D2', section: 'subprocessors', text: 'Is there a current, published list of their sub-processors?',                    type: 'yes_no_partial', weight: 2, riskyAnswer: 'no' },
  { id: 'D3', section: 'subprocessors', text: 'Are equivalent data-protection (flow-down) terms imposed on every sub-processor?', type: 'yes_no',       weight: 3, riskyAnswer: 'no' },
  { id: 'D4', section: 'subprocessors', text: 'Will they notify you before adding or changing a sub-processor?',                type: 'yes_no',         weight: 2, riskyAnswer: 'no' },
  { id: 'D5', section: 'subprocessors', text: 'Do they periodically audit or assess their sub-processors?',                     type: 'yes_no_partial', weight: 1, riskyAnswer: 'no' },
  { id: 'D6', section: 'subprocessors', text: 'Do any sub-processors store our data outside India?',                           type: 'yes_no',         weight: 2, riskyAnswer: 'yes' },

  // ─── Section E: Data Residency & Transfers (E1-E6) ───
  { id: 'E1', section: 'residency', text: 'Is our personal data stored within India?', type: 'yes_no', weight: 3, riskyAnswer: 'no' },
  {
    id: 'E2', section: 'residency', text: 'Primary storage location for our data', type: 'select', weight: 2,
    options: [
      { value: 'india',   label: 'India',                      risk: 0 },
      { value: 'apac',    label: 'Asia-Pacific (excl. India)', risk: 0.5 },
      { value: 'eu',      label: 'EU / UK',                    risk: 0.6 },
      { value: 'us',      label: 'United States',              risk: 0.8 },
      { value: 'global',  label: 'Multiple / global regions',  risk: 1 },
    ],
  },
  { id: 'E3', section: 'residency', text: 'Is data transferred to any country the Central Government may restrict?',     type: 'yes_no',         weight: 2, riskyAnswer: 'yes' },
  { id: 'E4', section: 'residency', text: 'Are cross-border transfers governed by contractual safeguards (SCC-equivalent)?', type: 'yes_no_partial', weight: 2, riskyAnswer: 'no' },
  { id: 'E5', section: 'residency', text: 'Can they provide an India-region deployment if required?',                   type: 'yes_no',         weight: 1, riskyAnswer: 'no' },
  { id: 'E6', section: 'residency', text: 'Do they support data localisation for regulated workloads (e.g. RBI / sectoral)?', type: 'yes_no_partial', weight: 1, riskyAnswer: 'no' },

  // ─── Section F: Incident Response (F1-F6) ───
  { id: 'F1', section: 'incident', text: 'Do they have a documented incident-response plan?', type: 'yes_no', weight: 3, riskyAnswer: 'no' },
  {
    id: 'F2', section: 'incident', text: 'Breach notification SLA to you', type: 'select', weight: 3,
    options: [
      { value: 'le24',  label: 'Within 24 hours',        risk: 0 },
      { value: 'le48',  label: 'Within 48 hours',        risk: 0.2 },
      { value: 'le72',  label: 'Within 72 hours',        risk: 0.4 },
      { value: 'gt72',  label: 'Over 72 hours / undefined', risk: 1 },
    ],
    hint: 'The DPDP Act requires breach reporting to the Data Protection Board; tighter vendor SLAs protect that window.',
  },
  { id: 'F3', section: 'incident', text: 'Will they assist with the DPDP 72-hour breach-reporting obligation?', type: 'yes_no',         weight: 2, riskyAnswer: 'no' },
  { id: 'F4', section: 'incident', text: 'Have they had a reported data breach in the last 24 months?',         type: 'yes_no',         weight: 3, riskyAnswer: 'yes' },
  { id: 'F5', section: 'incident', text: 'Do they perform post-incident reviews and share a root-cause analysis?', type: 'yes_no_partial', weight: 2, riskyAnswer: 'no' },
  { id: 'F6', section: 'incident', text: 'Do they run periodic breach / tabletop simulations?',                 type: 'yes_no_partial', weight: 1, riskyAnswer: 'no' },

  // ─── Section G: DPDP-Specific Obligations (G1-G6) ───
  { id: 'G1', section: 'dpdp', text: 'Will the vendor sign a DPDP-compliant Data Processing Agreement?',                         type: 'yes_no', weight: 3, riskyAnswer: 'no' },
  { id: 'G2', section: 'dpdp', text: 'Will they assist in fulfilling data-principal rights (access / correction / erasure) within SLA?', type: 'yes_no', weight: 3, riskyAnswer: 'no' },
  { id: 'G3', section: 'dpdp', text: 'Will they delete or return all personal data on contract termination?',                    type: 'yes_no', weight: 3, riskyAnswer: 'no' },
  { id: 'G4', section: 'dpdp', text: 'Do they process data only on your documented instructions (no independent use)?',          type: 'yes_no', weight: 2, riskyAnswer: 'no' },
  { id: 'G5', section: 'dpdp', text: 'Will they permit audits or provide compliance evidence on request?',                       type: 'yes_no_partial', weight: 2, riskyAnswer: 'no' },
  { id: 'G6', section: 'dpdp', text: 'Do they provide a grievance / privacy contact for escalations?',                          type: 'yes_no', weight: 2, riskyAnswer: 'no' },
]

export const VENDOR_QUESTION_COUNT = VENDOR_QUESTIONS.length // 45
export const VENDOR_SCORABLE_COUNT = VENDOR_QUESTIONS.filter(q => q.weight > 0).length

export function getVendorQuestion(id: string): VendorQuestion | undefined {
  return VENDOR_QUESTIONS.find(q => q.id === id)
}

export function vendorQuestionsForSection(section: VendorQuestionSection): VendorQuestion[] {
  return VENDOR_QUESTIONS.filter(q => q.section === section)
}
