// LexBot knowledge base.
//
// This is DATA, not UI. The chat assistant (src/components/site/LexBot.tsx)
// keyword-matches a user's question against these entries and returns the best
// `answer`. Expanding this file teaches the bot more without touching any
// frontend behaviour or layout.
//
// SCOPE: public, factual DPDP knowledge only - distilled from the dpdp-main
// knowledge base (01_What_Is_DPDP, 02_Industry_Prioritization,
// 03_Applicability_Analysis, 04_Government_Mandates). Internal business strategy
// (market landscape, competition, pricing, GTM, revenue plans) is deliberately
// NOT included here - it must never be served to the public.

export type LexEntry = { keywords: string[]; title: string; answer: string };

export const LEX_KB: LexEntry[] = [
  // ---- Core actors & concepts -------------------------------------------
  { keywords: ["data principal", "principal", "who am i", "individual"], title: "Data Principal", answer: "The Data Principal is the individual the personal data is about. For a child, it includes their parent or lawful guardian." },
  { keywords: ["data fiduciary", "fiduciary", "controller"], title: "Data Fiduciary", answer: "A Data Fiduciary decides the purpose and means of processing personal data. It carries the core obligations of notice, consent, security and breach response." },
  { keywords: ["significant", "sdf", "dpo officer"], title: "Significant Data Fiduciary", answer: "An SDF is a higher-risk fiduciary notified by the Government. It must appoint a Data Protection Officer in India, run DPIAs and undergo independent audits (Section 10, Rule 12)." },
  { keywords: ["data processor", "processor", "vendor", "sub-processor", "it vendor"], title: "Data Processor", answer: "A Data Processor processes personal data on behalf of a Data Fiduciary under a valid contract. The Fiduciary remains accountable for how its Processors handle the data." },
  { keywords: ["personal data", "what is personal data", "pii", "definition personal data"], title: "Personal data", answer: "Personal data is any data about an individual who is identifiable by or in relation to such data. The DPDP Act governs personal data in digital form, or non-digital data later digitised." },

  // ---- Obligations -------------------------------------------------------
  { keywords: ["consent", "valid consent", "section 6"], title: "Consent (Section 6)", answer: "Consent must be free, specific, informed, unconditional and unambiguous, given by clear affirmative action and limited to the stated purpose. It must be as easy to withdraw as to give." },
  { keywords: ["withdraw consent", "withdrawal", "revoke consent"], title: "Withdrawing consent", answer: "A Data Principal can withdraw consent at any time, as easily as it was given. On withdrawal, the Fiduciary and its Processors must stop processing unless another legal basis applies." },
  { keywords: ["notice", "section 5"], title: "Notice (Section 5)", answer: "Before or while seeking consent, a fiduciary must give an itemised notice in plain language: what data, for what purpose, how to exercise rights and how to complain to the Board." },
  { keywords: ["languages", "22 languages", "vernacular", "hindi notice", "regional language"], title: "Notice in 22 languages", answer: "Consent notices must be available in English and any of the 22 languages in the Eighth Schedule of the Constitution, in clear and plain language." },
  { keywords: ["principles", "7 principles", "seven principles", "core principles"], title: "The 7 principles", answer: "DPDP rests on seven principles: lawful purpose, consent, data minimisation, accuracy, storage limitation, security safeguards, and accountability of the Data Fiduciary." },
  { keywords: ["retention", "how long keep data", "storage limitation", "delete data", "keep data"], title: "Retention & deletion", answer: "Keep personal data only as long as the stated purpose needs it, then erase it - unless a law requires longer retention. Publish your retention periods and delete on schedule." },
  { keywords: ["security safeguards", "reasonable security", "encryption", "safeguards", "protect data"], title: "Security safeguards", answer: "Fiduciaries must take reasonable security safeguards - encryption, access control, logging, backups - to prevent breaches. Failure here carries the highest penalty, up to ₹250 crore." },

  // ---- Special categories -----------------------------------------------
  { keywords: ["children", "child", "minor", "parental", "section 9"], title: "Children's data (Section 9)", answer: "Processing a child's data needs verifiable parental consent. Tracking, behavioural monitoring and targeted advertising directed at children are prohibited." },
  { keywords: ["sensitive data", "data tiers", "categories of data", "types of personal data"], title: "Categories of personal data", answer: "In practice data falls into standard personal data, sensitive data (health, financial, biometric) needing stronger safeguards, and children's data (under 18) with the strictest rules." },

  // ---- Rights & duties ---------------------------------------------------
  { keywords: ["rights", "access", "correction", "erasure", "grievance", "nominate"], title: "Rights of the Data Principal", answer: "You can access information about your data, seek correction and erasure, raise a grievance, and nominate someone to exercise your rights (Sections 11-14)." },
  { keywords: ["erasure", "forgotten", "delete", "machine unlearning", "ai"], title: "Erasure & machine unlearning", answer: "The right to erasure can extend to machine unlearning for AI systems trained on personal data - not just deleting a database row." },
  { keywords: ["duties", "duty", "false complaint", "impersonate", "responsibilities", "duties of data principal"], title: "Duties of the Data Principal (Section 15)", answer: "You must not file false or frivolous complaints, impersonate others, or suppress material information when exercising your rights - breach can attract a penalty up to ₹10,000." },
  { keywords: ["grievance", "complain", "grievance officer", "complaint", "redressal"], title: "Grievance redressal", answer: "Every Data Fiduciary must offer an accessible grievance mechanism and a contact point. Only after exhausting it can a Data Principal approach the Data Protection Board." },

  // ---- Legal bases & exemptions -----------------------------------------
  { keywords: ["legitimate use", "legitimate uses", "without consent", "employment", "subsidy", "medical emergency", "grounds"], title: "Certain legitimate uses (Section 7)", answer: "Some uses don't need fresh consent - a purpose you voluntarily provided data for, State subsidies and services, medical emergencies, employment purposes, or compliance with law (Section 7)." },
  { keywords: ["exemption", "exempt", "research", "statistics", "national security", "startup", "exceptions"], title: "Exemptions (Section 17)", answer: "Certain processing is exempt - enforcing legal rights, judicial or regulatory functions, preventing or investigating offences, and research, archiving or statistics meeting prescribed standards. The State may also notify exemptions." },

  // ---- Breach & enforcement ---------------------------------------------
  { keywords: ["breach", "72", "hours", "report"], title: "Data breach", answer: "On a personal data breach, the fiduciary must intimate affected Data Principals and the Data Protection Board, in the form and within the time the Rules prescribe (within 72 hours)." },
  { keywords: ["penalty", "penalties", "fine", "250", "section 33"], title: "Penalties (Section 33)", answer: "The Schedule sets graded penalties up to ₹250 crore for failing to take reasonable security safeguards. The Data Protection Board fixes the amount on the Section 33(2) factors." },
  { keywords: ["how much penalty", "penalty amount", "200 crore", "150 crore", "50 crore", "schedule"], title: "Penalty amounts", answer: "Maximums: ₹250 crore for weak security safeguards; ₹200 crore for not notifying a breach or breaching children's-data duties; ₹150 crore for ignoring Board directions; ₹50 crore for other breaches; up to ₹10,000 on a Data Principal for misuse." },
  { keywords: ["board", "data protection board", "enforce", "regulator"], title: "Data Protection Board", answer: "The Data Protection Board of India is a digital-first body that inquires into breaches, directs remedial action and imposes penalties. Appeals go to the Appellate Tribunal." },
  { keywords: ["appeal", "tribunal", "tdsat", "appellate"], title: "Appeals", answer: "Appeals against Data Protection Board orders go to the Appellate Tribunal (TDSAT), and onward to the courts. The Board itself functions as a digital-first body." },

  // ---- Governance roles --------------------------------------------------
  { keywords: ["dpo", "data protection officer", "appoint dpo", "who needs a dpo"], title: "Data Protection Officer", answer: "A Significant Data Fiduciary must appoint a Data Protection Officer based in India, reporting to the Board of Directors, as the contact point for grievances and the Data Protection Board (Section 10)." },
  { keywords: ["dpia", "impact assessment", "data protection impact"], title: "Data Protection Impact Assessment", answer: "A DPIA is a structured review of the rights-risks of a processing activity. It is mandatory for Significant Data Fiduciaries and is good practice before any high-risk processing." },
  { keywords: ["audit", "annual audit", "independent audit"], title: "Audits", answer: "Significant Data Fiduciaries must undergo periodic independent data-protection audits and a DPIA, evidencing compliance to the Data Protection Board." },
  { keywords: ["consent manager", "rule 4"], title: "Consent Manager", answer: "A Consent Manager is a registered, interoperable intermediary through which a Data Principal can give, manage, review and withdraw consent (Rule 4, Schedule I)." },

  // ---- Scope & applicability --------------------------------------------
  { keywords: ["apply", "applicability", "foreign", "who needs"], title: "Who must comply", answer: "The Act covers digital personal data processed in India, and processing outside India that offers goods or services to Data Principals in India." },
  { keywords: ["does it apply to me", "applicability test", "do i need to comply", "am i covered"], title: "Does DPDP apply to you?", answer: "Yes if you (1) process digital personal data, (2) of people in India, (3) to offer goods or services. Almost every business with an app, website or digital records is a Data Fiduciary." },
  { keywords: ["sdf examples", "who is significant", "google", "meta", "jio"], title: "Who becomes an SDF", answer: "The Government notifies Significant Data Fiduciaries based on data volume, sensitivity and risk to rights, sovereignty or electoral integrity - typically large platforms such as big tech, telecom and major fintech or health players." },
  { keywords: ["cross border", "outside india", "transfer", "section 16"], title: "Cross-border transfers", answer: "Personal data may be transferred outside India except to countries the Government restricts. Sectoral laws with stricter rules continue to apply (Section 16, Rule 14)." },

  // ---- Industry guidance -------------------------------------------------
  { keywords: ["bank", "bfsi", "banking", "nbfc", "fintech", "loan"], title: "DPDP for BFSI", answer: "Banks, NBFCs, insurers and fintechs hold KYC, Aadhaar, PAN and transaction data, and must satisfy DPDP alongside RBI/SEBI/IRDAI rules - consent, erasure and breach reporting on top of existing compliance." },
  { keywords: ["hospital", "healthcare", "medical", "health data", "abdm", "clinic"], title: "DPDP for healthcare", answer: "Hospitals, labs and health-tech hold highly sensitive medical data and ABDM-linked health IDs. They need explicit consent, strong safeguards and a tight breach-response plan." },
  { keywords: ["edtech", "school", "education", "student data", "coaching", "college"], title: "DPDP for education & edtech", answer: "Schools, colleges, coaching and edtech process children's data - DPDP's strictest category. They need verifiable parental consent and must not profile or target children." },

  // ---- The wider regulatory stack ---------------------------------------
  { keywords: ["rbi", "reserve bank", "digital lending", "data localisation", "payment aggregator"], title: "RBI + DPDP", answer: "RBI rules (IT Framework, Digital Lending Guidelines, Payment Aggregator norms) require India-only storage and consent architecture. DPDP adds erasure rights and children's-account rules on top." },
  { keywords: ["sebi", "securities", "retention conflict", "8 year", "broker", "stock"], title: "SEBI + DPDP", answer: "SEBI requires long record retention (e.g. eight years), which can clash with DPDP's 'delete when done'. The fix is purpose-based retention: keep what the law mandates, erase the rest." },
  { keywords: ["irdai", "insurance", "policyholder", "tpa"], title: "IRDAI + DPDP", answer: "Insurers follow IRDAI cyber-security and data-portability rules; DPDP adds policyholder consent, processor agreements with TPAs, and transparency for AI underwriting." },
  { keywords: ["trai", "telecom", "subscriber", "dnd", "airtel", "vodafone"], title: "TRAI + DPDP", answer: "Telecom operators apply TRAI rules (DND, commercial communications) plus DPDP - subscriber consent at scale, location-data controls, and now coverage of OTT platforms." },
  { keywords: ["cert-in", "6 hours", "six hours", "incident reporting", "cert in"], title: "CERT-In 6-hour reporting", answer: "CERT-In Directions (2022) require reporting cyber incidents within 6 hours and keeping logs for 180 days. This is separate from - and faster than - DPDP's breach intimation to the Board." },
  { keywords: ["it act", "43a", "72a", "old law", "information technology act", "spdi"], title: "IT Act & SPDI Rules", answer: "Before DPDP, data protection ran on the IT Act (Sections 43A, 72A) and the 2011 SPDI Rules. These continue until fully superseded by the DPDP Rules." },
  { keywords: ["multiple regulators", "regulatory stack", "which regulators", "overlap", "multi regulator"], title: "The multi-regulator stack", answer: "Indian companies must satisfy DPDP plus their sector regulator (RBI/SEBI/IRDAI/TRAI/UGC), the IT Act/CERT-In, and state/central mandates - all at once. Map obligations across every layer." },

  // ---- Context & comparisons --------------------------------------------
  { keywords: ["why dpdp", "purpose of the act", "objective", "why was it passed", "problem"], title: "Why DPDP exists", answer: "DPDP gives Indians legal control over their personal data and holds companies accountable for how they collect, use, store and share it - balancing the right to privacy with lawful data processing." },
  { keywords: ["timeline", "when enforced", "enforcement date", "when does it start", "2026"], title: "DPDP timeline", answer: "The Act was passed in August 2023; the DPDP Rules were finalised in 2025; enforcement is being phased in from 2025-26 with full penalties following, after a transition period for most obligations." },
  { keywords: ["rules", "2025", "notified"], title: "DPDP Rules 2025", answer: "The DPDP Rules, 2025 supply the operational detail - notice, consent managers, breach reporting, children's data, security safeguards and Board procedure." },
  { keywords: ["gdpr", "compare", "comparison", "europe", "vs gdpr", "difference between dpdp and gdpr"], title: "DPDP vs GDPR", answer: "Both protect personal data, but DPDP is leaner: it focuses on digital personal data, uses 'Data Fiduciary / Data Principal', has graded penalties up to ₹250 crore, and enforces via the Data Protection Board rather than multiple DPAs." },

  // ---- Help --------------------------------------------------------------
  { keywords: ["start", "begin", "checklist", "roadmap", "how to comply", "get started", "first steps"], title: "Getting started", answer: "Start with a data inventory (what you hold, why, where), fix notice & consent, set up rights and grievance handling, write a 72-hour breach plan, and appoint a DPO if you're a Significant Data Fiduciary. Our free risk check is a good first step." },
  { keywords: ["hello", "hi", "hey", "help"], title: "Hello", answer: "Hi! I'm TrustChat. Ask me about consent, notice, penalties, breach, children's data, rights, cross-border transfers, the Board, or how DPDP applies to your industry." },
];
