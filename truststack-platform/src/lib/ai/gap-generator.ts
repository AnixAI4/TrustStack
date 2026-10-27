import type { GapDefinition, AnswerValue } from '@/types/dpdp'
import { ASSESSMENT_QUESTIONS, getIndustryQuestions } from '@/lib/assessment-questions'

// Full gap map for all 45 core questions + 24 industry questions
const GAP_MAP: Record<string, GapDefinition> = {
  // Section 2: Data Fiduciary
  Q6: {
    gap_description: 'No documented notice or disclosure for direct personal data collection',
    priority: 'p1',
    dpdp_section: 'Section 6',
    recommended_action: 'Publish a collection notice stating what data is collected, why, and the legal basis before collection.',
    module_to_fix: 'M3: Privacy Notice Builder',
  },
  Q7: {
    gap_description: 'No policy governing automated decision-making that affects individuals',
    priority: 'p1',
    dpdp_section: 'Section 6',
    recommended_action: 'Document all automated decision-making processes and implement human review mechanisms for high-impact decisions.',
    module_to_fix: 'M1: DPDP Compass™',
  },
  Q8: {
    gap_description: 'Potential Significant Data Fiduciary (SDF) status has not been formally assessed',
    priority: 'p0',
    dpdp_section: 'Section 10',
    recommended_action: 'Conduct an SDF assessment. If classified as SDF, appoint a DPO, conduct a DPIA, and register with the Data Protection Board.',
    module_to_fix: 'M1: DPDP Compass™',
  },
  Q9: {
    gap_description: "No verifiable parental consent mechanism for processing children's data",
    priority: 'p0',
    dpdp_section: 'Section 9',
    recommended_action: "Implement age verification and verifiable parental consent before processing any user's data when they may be under 18.",
    module_to_fix: 'M2: Consent Management',
  },
  Q10: {
    gap_description: 'Cross-border data transfers occur without adequate controls or localization measures',
    priority: 'p1',
    dpdp_section: 'Section 16',
    recommended_action: "Map all cross-border data flows, identify the legal basis for each transfer, and implement contractual safeguards with foreign processors.",
    module_to_fix: 'M7: Vendor DPA Manager',
  },
  Q11: {
    gap_description: 'No Platform Data Fiduciary framework in place for third-party marketplace operations',
    priority: 'p1',
    dpdp_section: 'Section 10',
    recommended_action: 'Implement a framework governing how third-party sellers/service providers on your platform handle user data.',
    module_to_fix: 'M1: DPDP Compass™',
  },
  Q12: {
    gap_description: 'No AI governance policy for ML models trained on personal data',
    priority: 'p1',
    dpdp_section: 'Section 6',
    recommended_action: 'Document all AI/ML models that use personal data, assess their privacy impact, and include AI use in consent notices.',
    module_to_fix: 'M1: DPDP Compass™',
  },
  Q13: {
    gap_description: 'No Data Processing Agreements (DPAs) with third-party processors',
    priority: 'p0',
    dpdp_section: 'Section 8(2)',
    recommended_action: 'Execute DPAs with all vendors who process personal data on your behalf. Use TrustStack DPA templates.',
    module_to_fix: 'M7: Vendor DPA Manager',
  },

  // Section 3: Consent
  Q14: {
    gap_description: 'No documented consent mechanism in place',
    priority: 'p0',
    dpdp_section: 'Section 6',
    recommended_action: 'Deploy TrustStack Consent Widget with DPDP-compliant consent flow for your website and app.',
    module_to_fix: 'M2: Consent Management',
  },
  Q15: {
    gap_description: 'Consent is bundled or not granular per processing purpose',
    priority: 'p0',
    dpdp_section: 'Section 6(2)',
    recommended_action: 'Redesign consent to be purpose-specific. Users must be able to accept/reject each purpose individually.',
    module_to_fix: 'M2: Consent Management',
  },
  Q16: {
    gap_description: 'No easy mechanism for users to withdraw consent at any time',
    priority: 'p0',
    dpdp_section: 'Section 6(4)',
    recommended_action: 'Implement a self-serve consent withdrawal portal. Withdrawal must be as easy as granting consent.',
    module_to_fix: 'M2: Consent Management',
  },
  Q17: {
    gap_description: 'No audit trail or records of consents obtained',
    priority: 'p0',
    dpdp_section: 'Section 6(5)',
    recommended_action: 'Implement consent record-keeping with immutable logs of what was consented to, when, and by whom.',
    module_to_fix: 'M2: Consent Management',
  },
  Q18: {
    gap_description: 'Consent request not available in the language(s) users understand',
    priority: 'p1',
    dpdp_section: 'Section 5(1)',
    recommended_action: "Enable multilingual consent notices in the languages of your user base using TrustStack's 22-language support.",
    module_to_fix: 'M2: Consent Management',
  },
  Q19: {
    gap_description: 'No verifiable parental consent flow for users who may be under 18',
    priority: 'p0',
    dpdp_section: 'Section 9',
    recommended_action: 'Add age gate and parental consent verification before processing data of any user who may be a minor.',
    module_to_fix: 'M2: Consent Management',
  },

  // Section 4: Notice
  Q20: {
    gap_description: 'No Privacy Notice published for users to access',
    priority: 'p0',
    dpdp_section: 'Section 5',
    recommended_action: 'Use TrustStack Privacy Notice Builder to generate and publish a DPDP-compliant privacy notice immediately.',
    module_to_fix: 'M3: Privacy Notice Builder',
  },
  Q21: {
    gap_description: 'Privacy Notice does not clearly state all processing purposes',
    priority: 'p0',
    dpdp_section: 'Section 5(1)(a)',
    recommended_action: 'Update your privacy notice to include an explicit, exhaustive list of all purposes for which data is processed.',
    module_to_fix: 'M3: Privacy Notice Builder',
  },
  Q22: {
    gap_description: 'Privacy Notice does not inform users of all 7 rights under the DPDP Act',
    priority: 'p0',
    dpdp_section: 'Section 5(1)(b)',
    recommended_action: 'Add a dedicated "Your Rights" section to your privacy notice covering all 7 DPDP rights and how to exercise them.',
    module_to_fix: 'M3: Privacy Notice Builder',
  },
  Q23: {
    gap_description: 'Privacy Notice not available in the languages your users understand',
    priority: 'p1',
    dpdp_section: 'Section 5(2)',
    recommended_action: "Publish translations of your privacy notice in the relevant 8th Schedule languages using TrustStack's AI translation.",
    module_to_fix: 'M3: Privacy Notice Builder',
  },

  // Section 5: Rights
  Q24: {
    gap_description: 'No Grievance Officer appointed for DPDP compliance',
    priority: 'p0',
    dpdp_section: 'Section 14',
    recommended_action: 'Appoint a Grievance Officer in TrustStack and publish their contact information in your privacy notice.',
    module_to_fix: 'M4: Grievance Officer Portal',
  },
  Q25: {
    gap_description: "Grievance Officer's contact information is not publicly available to users",
    priority: 'p0',
    dpdp_section: 'Section 14(2)',
    recommended_action: "Prominently display the Grievance Officer's name, email, and phone number on your website and in your privacy notice.",
    module_to_fix: 'M4: Grievance Officer Portal',
  },
  Q26: {
    gap_description: 'No process for users to exercise their right to access personal data',
    priority: 'p1',
    dpdp_section: 'Section 11',
    recommended_action: 'Set up a Data Subject Request (DSR) portal allowing users to request a summary of their personal data held.',
    module_to_fix: 'M5: DSR Management',
  },
  Q27: {
    gap_description: 'No process for users to request correction of inaccurate personal data',
    priority: 'p1',
    dpdp_section: 'Section 12(a)(b)',
    recommended_action: 'Implement a correction request workflow through your DSR portal with a defined SLA for response.',
    module_to_fix: 'M5: DSR Management',
  },
  Q28: {
    gap_description: 'No process for users to request erasure of their personal data',
    priority: 'p1',
    dpdp_section: 'Section 12(c)',
    recommended_action: 'Implement an erasure/deletion request workflow including identity verification and a defined SLA.',
    module_to_fix: 'M5: DSR Management',
  },
  Q29: {
    gap_description: 'No mechanism for users to nominate a representative for their DPDP rights',
    priority: 'p2',
    dpdp_section: 'Section 15',
    recommended_action: "Add a nomination form to your DSR portal enabling users to designate someone to exercise their rights in case of death or incapacity.",
    module_to_fix: 'M5: DSR Management',
  },

  // Section 6: Security
  Q30: {
    gap_description: 'Personal data is not encrypted at rest in databases or file storage',
    priority: 'p0',
    dpdp_section: 'Section 8(4)',
    recommended_action: 'Enable encryption at rest for all databases, file storage, and backup systems that contain personal data.',
    module_to_fix: 'M1: DPDP Compass™',
  },
  Q31: {
    gap_description: 'Data transmission not fully encrypted with HTTPS/TLS 1.2+',
    priority: 'p0',
    dpdp_section: 'Section 8(4)',
    recommended_action: 'Enforce HTTPS across all endpoints. Disable TLS 1.0/1.1. Apply SSL pinning for mobile applications.',
    module_to_fix: 'M1: DPDP Compass™',
  },
  Q32: {
    gap_description: 'No role-based access control (RBAC) for personal data',
    priority: 'p0',
    dpdp_section: 'Section 8(4)',
    recommended_action: 'Implement RBAC ensuring employees only access personal data necessary for their specific role (principle of least privilege).',
    module_to_fix: 'M1: DPDP Compass™',
  },
  Q33: {
    gap_description: 'No access logs maintained for personal data access',
    priority: 'p1',
    dpdp_section: 'Section 8(4)',
    recommended_action: 'Enable comprehensive audit logging for all personal data access events — who, when, what data, from where.',
    module_to_fix: 'M1: DPDP Compass™',
  },
  Q34: {
    gap_description: 'No recent security assessment or penetration test conducted',
    priority: 'p1',
    dpdp_section: 'Section 8(4)',
    recommended_action: 'Commission an annual penetration test and vulnerability assessment from a qualified security firm.',
    module_to_fix: 'M1: DPDP Compass™',
  },
  Q35: {
    gap_description: 'No documented data retention policy specifying how long personal data is kept',
    priority: 'p0',
    dpdp_section: 'Section 8(7)',
    recommended_action: 'Create a data retention schedule for each data category. Implement automated deletion/anonymization at end of retention period.',
    module_to_fix: 'M6: ROPA Builder',
  },

  // Section 7: Breach Preparedness
  Q36: {
    gap_description: 'No documented personal data breach incident response procedure',
    priority: 'p0',
    dpdp_section: 'Section 8(6)',
    recommended_action: 'Use TrustStack Breach Response module to create a documented incident response playbook with clear roles and escalation paths.',
    module_to_fix: 'M8: Breach Response',
  },
  Q37: {
    gap_description: 'Breach procedure does not include 72-hour DPBI notification requirement',
    priority: 'p0',
    dpdp_section: 'Section 8(6)',
    recommended_action: 'Update your breach procedure to include a mandatory 72-hour notification to the Data Protection Board of India (DPBI).',
    module_to_fix: 'M8: Breach Response',
  },
  Q38: {
    gap_description: 'Personal data breach occurred that was not fully remediated',
    priority: 'p0',
    dpdp_section: 'Section 8(6)',
    recommended_action: 'Document the breach, assess impact on data subjects, notify DPBI if required, and implement preventive controls.',
    module_to_fix: 'M8: Breach Response',
  },
  Q39: {
    gap_description: 'No breach register maintained to document incidents and resolutions',
    priority: 'p1',
    dpdp_section: 'Section 8(6)',
    recommended_action: 'Create and maintain a breach register in TrustStack documenting all incidents, their classification, impact, and resolution.',
    module_to_fix: 'M8: Breach Response',
  },
  Q40: {
    gap_description: 'Breach response procedure has not been tested in the last 12 months',
    priority: 'p2',
    dpdp_section: 'Section 8(6)',
    recommended_action: 'Conduct an annual tabletop exercise simulating a data breach to test your response team and identify gaps in the procedure.',
    module_to_fix: 'M8: Breach Response',
  },

  // Section 8: Vendor Management
  Q41: {
    gap_description: 'Personal data shared with third-party vendors without adequate controls',
    priority: 'p1',
    dpdp_section: 'Section 8(2)',
    recommended_action: 'Map all vendor data flows, classify vendors by risk, and ensure each has appropriate contractual data protection obligations.',
    module_to_fix: 'M7: Vendor DPA Manager',
  },
  Q42: {
    gap_description: 'No Data Processing Agreements (DPAs) with vendors who handle personal data',
    priority: 'p0',
    dpdp_section: 'Section 8(2)',
    recommended_action: "Execute DPAs with all vendors. Use TrustStack's DPDP-compliant DPA templates to deploy them at scale.",
    module_to_fix: 'M7: Vendor DPA Manager',
  },
  Q43: {
    gap_description: "Vendor data protection posture not assessed before onboarding",
    priority: 'p1',
    dpdp_section: 'Section 8(2)',
    recommended_action: 'Implement a vendor onboarding questionnaire covering security, DPDP compliance, breach notification processes, and sub-processors.',
    module_to_fix: 'M7: Vendor DPA Manager',
  },
  Q44: {
    gap_description: 'Vendor contracts do not require 6-hour breach notification',
    priority: 'p0',
    dpdp_section: 'Section 8(2)',
    recommended_action: 'Add a 6-hour breach notification clause to all vendor DPAs. You need this window to meet your own 72-hour DPBI deadline.',
    module_to_fix: 'M7: Vendor DPA Manager',
  },
  Q45: {
    gap_description: 'No up-to-date register of vendors who process personal data',
    priority: 'p1',
    dpdp_section: 'Section 8(2)',
    recommended_action: 'Build and maintain a vendor data processing register in TrustStack listing all processors, the data shared, and the purpose.',
    module_to_fix: 'M7: Vendor DPA Manager',
  },

  // ─── Fintech & BFSI industry questions ───
  FIN1: {
    gap_description: 'Payment instrument data stored or processed without tokenization or adequate controls',
    priority: 'p0',
    dpdp_section: 'Section 8(4)',
    recommended_action: 'Tokenize all payment instrument data. Comply with PCI-DSS and align storage controls with RBI Master Direction on Payment System Data.',
    module_to_fix: 'M1: DPDP Compass™',
  },
  FIN2: {
    gap_description: 'AI/ML credit-scoring or underwriting models are not explainable to affected users',
    priority: 'p1',
    dpdp_section: 'Section 6',
    recommended_action: 'Implement model explainability for credit decisions. Document all AI models that influence financial outcomes and disclose algorithmic processing in consent notices.',
    module_to_fix: 'M1: DPDP Compass™',
  },
  FIN3: {
    gap_description: 'Customer financial data shared with credit bureaus without explicit, documented consent',
    priority: 'p0',
    dpdp_section: 'Section 6(2)',
    recommended_action: 'Obtain explicit, purpose-specific consent before sharing data with CIBIL, Experian, or Equifax. Disclose bureau sharing in your privacy notice and consent flow.',
    module_to_fix: 'M2: Consent Management',
  },
  FIN4: {
    gap_description: 'Data handling not aligned with RBI Master Direction on IT Framework',
    priority: 'p1',
    dpdp_section: 'Section 8(4)',
    recommended_action: 'Conduct a gap assessment against RBI\'s Master Direction on IT Framework for NBFCs/Banks. Address audit trail, incident reporting, and governance gaps.',
    module_to_fix: 'M1: DPDP Compass™',
  },
  FIN5: {
    gap_description: 'Financial data shared with insurance or lending partners without explicit consent',
    priority: 'p0',
    dpdp_section: 'Section 6(2)',
    recommended_action: 'Add a dedicated purpose-specific consent for partner data sharing. Do not rely on general service terms — each partner relationship needs separate consent.',
    module_to_fix: 'M2: Consent Management',
  },
  FIN6: {
    gap_description: 'No documented process for responding to regulatory data requests (SEBI, RBI, ED)',
    priority: 'p2',
    dpdp_section: 'Section 8(2)',
    recommended_action: 'Create a regulatory data request SOP. Designate a legal/compliance owner, define response timelines, and ensure the process respects data subject rights where applicable.',
    module_to_fix: 'M1: DPDP Compass™',
  },
  FIN7: {
    gap_description: 'No opt-out mechanism for financial product cross-selling based on transaction data',
    priority: 'p1',
    dpdp_section: 'Section 6(4)',
    recommended_action: 'Implement a clear opt-out for behavioural profiling used in cross-selling. Consent withdrawal for marketing must not affect core financial services.',
    module_to_fix: 'M2: Consent Management',
  },
  FIN8: {
    gap_description: 'KYC data retention not reconciled between PMLA requirements and DPDP purpose limitation',
    priority: 'p1',
    dpdp_section: 'Section 8(7)',
    recommended_action: 'Build a dual-regulation retention matrix. KYC records must be retained for 5 years under PMLA — document the legal basis override for DPDP purpose-limitation conflicts.',
    module_to_fix: 'M6: ROPA Builder',
  },

  // ─── Healthtech industry questions ───
  HLT1: {
    gap_description: 'Sensitive health data processed without adequate classification, access controls, or consent',
    priority: 'p0',
    dpdp_section: 'Section 8(4)',
    recommended_action: 'Classify all health records, prescriptions, and diagnostic data as sensitive. Apply enhanced encryption, access controls, and obtain explicit, purpose-specific consent before processing.',
    module_to_fix: 'M1: DPDP Compass™',
  },
  HLT2: {
    gap_description: 'Clinical consent (for treatment) is not separated from data consent in user flows',
    priority: 'p0',
    dpdp_section: 'Section 6',
    recommended_action: 'Implement distinct consent flows: one for clinical treatment (clinical basis) and a separate, revocable consent for data processing under DPDP + DISHA.',
    module_to_fix: 'M2: Consent Management',
  },
  HLT3: {
    gap_description: 'Patients cannot restrict access to their health records to specific providers',
    priority: 'p1',
    dpdp_section: 'Section 13',
    recommended_action: 'Implement patient-level access controls allowing users to designate which providers can view their records. Align with ABDM consent manager framework.',
    module_to_fix: 'M5: DSR Management',
  },
  HLT4: {
    gap_description: 'Platform not assessed for alignment with DISHA (Digital Information Security in Healthcare Act)',
    priority: 'p1',
    dpdp_section: 'Section 8(4)',
    recommended_action: 'Conduct a DISHA compliance gap assessment alongside your DPDP assessment. Key DISHA requirements: EHR standards, consent manager integration, and security audit.',
    module_to_fix: 'M1: DPDP Compass™',
  },
  HLT5: {
    gap_description: 'Health data shared with insurers, employers, or researchers without separate explicit consent',
    priority: 'p0',
    dpdp_section: 'Section 6(2)',
    recommended_action: 'Each data-sharing relationship (insurer, employer, researcher) requires its own explicit, purpose-specific consent. Disclose all such sharing clearly in your privacy notice.',
    module_to_fix: 'M2: Consent Management',
  },
  HLT6: {
    gap_description: 'Telemedicine session recordings not classified as sensitive personal data',
    priority: 'p1',
    dpdp_section: 'Section 8(4)',
    recommended_action: 'Classify all telemedicine recordings as sensitive health data. Apply encryption at rest, strict RBAC, explicit consent for recording, and defined retention/deletion timelines.',
    module_to_fix: 'M1: DPDP Compass™',
  },
  HLT7: {
    gap_description: 'No documented process for handling health data requests from ABDM',
    priority: 'p2',
    dpdp_section: 'Section 8(2)',
    recommended_action: 'Designate an ABDM compliance owner. Document the process for responding to health data exchange requests from the Ayushman Bharat Digital Mission ecosystem.',
    module_to_fix: 'M1: DPDP Compass™',
  },
  HLT8: {
    gap_description: 'No health-specific data retention policy separate from the general retention policy',
    priority: 'p1',
    dpdp_section: 'Section 8(7)',
    recommended_action: 'Create a health data retention schedule that accounts for clinical record minimums, treatment continuity requirements, and DPDP purpose limitation. Document legal basis for any retention beyond purpose fulfillment.',
    module_to_fix: 'M6: ROPA Builder',
  },

  // ─── EdTech industry questions ───
  EDT1: {
    gap_description: 'No age verification mechanism before account creation — minors may be onboarded without parental consent',
    priority: 'p0',
    dpdp_section: 'Section 9',
    recommended_action: 'Implement age verification at account creation — before any data collection. For users under 18, trigger a parental consent flow immediately. This is your highest-priority DPDP risk.',
    module_to_fix: 'M2: Consent Management',
  },
  EDT2: {
    gap_description: 'Student behavioural analytics or learning profiles processed without adequate consent or controls',
    priority: 'p0',
    dpdp_section: 'Section 6',
    recommended_action: 'Obtain explicit parental consent for processing learning profiles and behavioural analytics. Document the purpose, ensure data minimisation, and disclose this processing in your privacy notice.',
    module_to_fix: 'M2: Consent Management',
  },
  EDT3: {
    gap_description: 'Student data shared with third-party tools without explicit disclosure or parental consent',
    priority: 'p0',
    dpdp_section: 'Section 8(2)',
    recommended_action: 'Audit all third-party proctoring, assessment, and analytics tools. Obtain parental consent for each data-sharing relationship and disclose it explicitly in your privacy notice.',
    module_to_fix: 'M7: Vendor DPA Manager',
  },
  EDT4: {
    gap_description: "Parental consent for students under 18 does not cover all third-party data sharing",
    priority: 'p0',
    dpdp_section: 'Section 9',
    recommended_action: 'Review your parental consent form and ensure it explicitly names every third-party recipient and the data shared with them. Generic consent is not legally sufficient for minor data.',
    module_to_fix: 'M2: Consent Management',
  },
  EDT5: {
    gap_description: 'Biometric data from student proctoring not classified as sensitive or adequately protected',
    priority: 'p1',
    dpdp_section: 'Section 8(4)',
    recommended_action: 'Classify facial recognition and biometric proctoring data as sensitive. Apply enhanced encryption, strict access controls, obtain explicit parental consent, and define clear retention limits.',
    module_to_fix: 'M1: DPDP Compass™',
  },
  EDT6: {
    gap_description: "Parents cannot access or delete their child's data through a dedicated mechanism",
    priority: 'p1',
    dpdp_section: 'Section 12(c)',
    recommended_action: "Build a parent portal with DSR capabilities — parents must be able to view, correct, and delete their child's data independently of the student account.",
    module_to_fix: 'M5: DSR Management',
  },
  EDT7: {
    gap_description: 'Teacher/tutor background check data retained without a documented policy',
    priority: 'p2',
    dpdp_section: 'Section 8(7)',
    recommended_action: 'Create a retention policy for teacher onboarding data. Define what is retained, for how long, and ensure deletion after the retention period. Disclose this in your internal privacy notice for staff.',
    module_to_fix: 'M6: ROPA Builder',
  },
  EDT8: {
    gap_description: 'Automated decisions affecting student educational outcomes not disclosed or subject to review',
    priority: 'p1',
    dpdp_section: 'Section 6',
    recommended_action: 'Disclose all automated decisions (content gating, streaming, advancement) in your privacy notice. Implement a human review mechanism for any decision that significantly impacts a student\'s educational path.',
    module_to_fix: 'M1: DPDP Compass™',
  },
}

// Industry-specific overrides for recommended_action (and optional dpdp_section).
// forcePriority prevents the partial-answer downgrade for critical items.
type IndustryOverride = {
  recommended_action: string
  dpdp_section?: string
  forcePriority?: string
}

const INDUSTRY_GAP_OVERRIDES: Record<string, Partial<Record<string, IndustryOverride>>> = {
  fintech: {
    Q9: {
      recommended_action: 'Payment platforms commonly serve minors for student accounts and UPI. Implement age verification at account creation and verifiable parental consent before processing any financial data of users under 18.',
    },
    Q10: {
      recommended_action: 'Cross-border transfers of payment data may violate RBI\'s data localization requirements. Map all offshore flows — card processors, cloud analytics, KYC vendors — and implement contractual safeguards. Cross-reference RBI Master Direction on Storage of Payment System Data.',
    },
    Q12: {
      recommended_action: 'Fintech AI models for credit scoring, fraud detection, and UPI risk profiling must be explainable and documented under both DPDP and RBI\'s AI/ML governance guidance. Add model cards to your AI governance policy and ensure consent notices disclose algorithmic processing.',
    },
    Q13: {
      recommended_action: 'Execute DPAs with all payment processors, credit bureaus (CIBIL, Experian), and KYC/AML vendors. Align with both DPDP Section 8(2) and RBI outsourcing guidelines — dual compliance is required for fintech processors.',
    },
    Q14: {
      recommended_action: 'Deploy a consent widget covering payment data, UPI transaction history, and credit bureau queries. Each processing purpose — transaction processing, fraud detection, cross-selling — requires separate consent. Cross-reference RBI Master Direction on IT §6.',
    },
    Q15: {
      recommended_action: 'Payment consent must be granular: separate consent for transaction processing, fraud detection, credit bureau reporting, and marketing/cross-selling. Bundled consent for financial data is invalid under both DPDP and RBI guidelines.',
    },
    Q16: {
      recommended_action: 'Consent withdrawal must not block legitimate payment processing that relies on legal/contractual basis. Design your withdrawal flow to distinguish consent-based (marketing, profiling) from contractual (transactions, KYC) — and communicate this distinction clearly to users.',
    },
    Q17: {
      recommended_action: 'Maintain immutable consent audit trails for all payment-related consent events. For fintech, these logs support both DPDP compliance and RBI/SEBI audit responses — retain for minimum 5 years with tamper-evident storage.',
    },
    Q19: {
      recommended_action: 'UPI and neobanking platforms must verify user age at onboarding. Parental consent is mandatory before processing any financial data of users under 18 — failure exposes you to both DPDP and RBI penalties.',
    },
    Q20: {
      recommended_action: 'Your privacy notice must explicitly disclose: sharing with credit bureaus, RBI-mandated regulatory reporting, fraud consortium data sharing, behavioural profiling for product recommendations, and any offshore data processing.',
    },
    Q24: {
      recommended_action: 'Your Grievance Officer must handle both DPDP data rights requests and financial complaints under RBI\'s Integrated Ombudsman Scheme. Ensure the same escalation path satisfies both regulatory frameworks.',
    },
    Q35: {
      recommended_action: 'Financial data retention must satisfy DPDP purpose limitation AND PMLA requirements (5-year minimum for transaction records). Build a dual-regulation retention matrix for each data category with documented legal basis for extended retention.',
    },
    Q36: {
      recommended_action: 'Fintech breach response must simultaneously address DPBI notification (72 hours) and RBI incident reporting requirements. Update your incident playbook to run both notification tracks concurrently — they have different templates and escalation paths.',
    },
    Q37: {
      recommended_action: 'Your breach procedure must cover the 72-hour DPBI notification requirement in parallel with RBI incident reporting. Train your incident response team on both regulatory pathways — they must operate simultaneously, not sequentially.',
    },
    Q42: {
      recommended_action: 'DPAs with fintech vendors must satisfy both DPDP Section 8(2) and RBI\'s outsourcing guidelines. Prioritize payment processors, cloud providers, and analytics vendors. TrustStack DPA templates cover dual-regulation requirements for fintech.',
    },
    Q44: {
      recommended_action: 'Require vendors to notify you within 6 hours of a breach — you need this window to meet your 72-hour DPBI AND RBI reporting timelines simultaneously. Explicitly include payment processors, card networks, and KYC vendors in this requirement.',
    },
  },

  healthtech: {
    Q9: {
      recommended_action: 'Health platforms routinely serve minors. Implement mandatory age verification at account creation and verifiable parental consent before processing any health data of users under 18 — this is your highest legal risk under DPDP Section 9.',
    },
    Q14: {
      recommended_action: 'Implement separate consent flows for clinical data (treatment) vs. platform data (analytics, marketing). Health records require distinct, revocable consent under both DPDP and DISHA. A single bundled consent is legally insufficient.',
    },
    Q15: {
      recommended_action: 'Health consent must cover each category separately: treatment records, insurance data sharing, research use, employer sharing, and platform analytics. Each requires independent consent — bundling any two of these is invalid under DPDP + DISHA.',
    },
    Q16: {
      recommended_action: 'Patients must be able to withdraw consent from insurer or researcher data sharing without losing access to treatment services. Design your withdrawal flow to preserve this separation — and communicate it clearly to patients.',
    },
    Q17: {
      recommended_action: 'Maintain audit trails for all health data consent events, including provider-level record access. DISHA requires similar audit capabilities — build your consent record system to satisfy both frameworks simultaneously.',
    },
    Q19: {
      recommended_action: 'Parental consent for minors\' health data is mandatory before account creation. Your age gate must operate before onboarding — a post-hoc consent mechanism does not satisfy DPDP Section 9 for health data of minors.',
    },
    Q20: {
      recommended_action: 'Your privacy notice must disclose: sharing health data with insurance companies, ABDM integration scope, telemedicine session recording practices, use of clinical data for AI model training, and any research or employer data sharing.',
    },
    Q24: {
      recommended_action: 'Your Grievance Officer must handle both DPDP data rights requests and patient grievances under the Consumer Protection framework. Assess whether the same person can serve both roles — and publish contact details on your patient portal.',
    },
    Q32: {
      recommended_action: 'Clinical records must be restricted at the patient level — doctors should only see records for their own patients. Implement patient-level RBAC or attribute-based access controls aligned with DISHA\'s data access standards.',
    },
    Q34: {
      recommended_action: 'Health data platforms are high-value targets. Commission a DISHA-aligned security assessment alongside your standard penetration test. For platforms processing sensitive clinical records, bi-annual assessment cadence is recommended.',
    },
    Q36: {
      recommended_action: 'Your breach response playbook for health data must go beyond 72-hour DPBI notification to include a patient notification protocol — patients may face immediate safety risks from health data exposure that require urgent communication.',
    },
    Q37: {
      recommended_action: 'Update your breach procedure for 72-hour DPBI notification. If the breach involves health records, also assess additional patient notification obligations under your duty-of-care — DPBI notification alone may not be sufficient.',
    },
  },

  edtech: {
    Q9: {
      recommended_action: 'EdTech platforms process children\'s data at scale. Implement mandatory age verification before account creation — this is your single highest legal risk. Processing a minor\'s data without parental consent exposes you to per-user penalties under DPDP Section 9.',
      forcePriority: 'p0',
    },
    Q14: {
      recommended_action: 'Parental consent for students under 18 must cover all data categories: academic performance, behavioural analytics, proctoring data, and anything shared with third-party tools. A generic "I agree" checkbox is legally insufficient.',
    },
    Q15: {
      recommended_action: 'Academic consent must be purpose-specific: separate consent for learning analytics, third-party proctoring, AI-driven tutoring recommendations, and any data shared with research institutions. Each purpose needs an independent opt-in.',
    },
    Q16: {
      recommended_action: 'Parents must be able to withdraw consent without the student losing access to core educational services. Design your withdrawal flow with this built in — and communicate clearly which services depend on consent vs. contract.',
    },
    Q17: {
      recommended_action: 'Maintain parent-linked consent records for all student accounts, not just user-linked records. When a regulator asks who consented on behalf of a minor, your audit trail must show the parent\'s identity and the specific purposes they approved.',
    },
    Q19: {
      recommended_action: '⚠ CRITICAL: Parental consent for users under 18 is your absolute highest DPDP risk. Implement verifiable parental consent immediately — this is a mandatory legal requirement, not a best practice. Each minor processed without consent is a separate violation under Section 9.',
      forcePriority: 'p0',
    },
    Q20: {
      recommended_action: 'Your privacy notice must specifically address: how student data is used for AI personalisation, what behavioural data is shared with proctoring/assessment tools, how parents can access and delete their child\'s data, and any cross-platform student data sharing.',
    },
    Q24: {
      recommended_action: 'Your Grievance Officer must be reachable by parents, not just students. Publish contact information on your parent portal and ensure your grievance workflow accepts complaints from guardians acting on behalf of their children.',
    },
    Q36: {
      recommended_action: 'Student data breaches require parent notification alongside 72-hour DPBI reporting. Your breach playbook must include a parent communication protocol — especially since minors cannot effectively respond to breach impacts themselves.',
    },
    Q37: {
      recommended_action: 'Update your breach procedure for 72-hour DPBI notification. For breaches involving student data, also assess whether guardian notification is required given the age of affected data subjects and your duty-of-care obligations.',
    },
  },
}

export function generateGaps(
  assessmentId: string,
  organizationId: string,
  answers: { question_id: string; answer: AnswerValue }[],
  industry: string | null
): Array<{
  assessment_id: string
  organization_id: string
  question_id: string
  gap_description: string
  priority: string
  dpdp_section: string | null
  recommended_action: string
  module_to_fix: string | null
  resolved: boolean
}> {
  // Normalize bfsi → fintech for override lookups (same regulatory obligations)
  const normalizedIndustry = industry === 'bfsi' ? 'fintech' : industry

  // Build a lookup including all industry questions for the current org
  const industryQs = getIndustryQuestions(industry)
  const allQuestions = [...ASSESSMENT_QUESTIONS, ...industryQs]

  const gaps = []

  for (const answer of answers) {
    const shouldGenerateGap = answer.answer === 'no' || answer.answer === 'partial'
    // Q38 is inverted: 'yes' (breach occurred) is the bad answer
    const isQ38Breach = answer.question_id === 'Q38' && answer.answer === 'yes'

    if (!shouldGenerateGap && !isQ38Breach) continue

    const question = allQuestions.find(q => q.id === answer.question_id)
    if (!question?.scorable) continue

    const gapDef = GAP_MAP[answer.question_id]
    if (!gapDef) continue

    // Apply industry override if available
    const override = normalizedIndustry
      ? INDUSTRY_GAP_OVERRIDES[normalizedIndustry]?.[answer.question_id]
      : undefined

    const recommended_action = override?.recommended_action ?? gapDef.recommended_action
    const dpdp_section = override?.dpdp_section ?? gapDef.dpdp_section

    // Determine priority — forcePriority prevents partial-answer downgrade
    let priority = override?.forcePriority ?? gapDef.priority
    if (!override?.forcePriority && answer.answer === 'partial' && !isQ38Breach) {
      const downgrades: Record<string, string> = { p0: 'p1', p1: 'p2', p2: 'p3', p3: 'p3' }
      priority = downgrades[priority] ?? priority
    }

    gaps.push({
      assessment_id: assessmentId,
      organization_id: organizationId,
      question_id: answer.question_id,
      gap_description: gapDef.gap_description,
      priority,
      dpdp_section,
      recommended_action,
      module_to_fix: gapDef.module_to_fix,
      resolved: false,
    })
  }

  return gaps
}
