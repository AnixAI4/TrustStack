// DPDP Certificate Examination bank. Local fallback for module checks when
// Supabase exam_questions is unavailable. 224 questions across modules 1-6.
export type ExamQuestion = {
  q: string;
  options: string[];
  answer: number;
  module: number;
  difficulty: "basic" | "intermediate" | "advanced";
};

export const EXAM_BANK: ExamQuestion[] = [
  {
    "q": "What is the primary objective of the Digital Personal Data Protection Act, 2023?",
    "options": [
      "To regulate all data processing in India",
      "To balance the right to protection of personal data with the need to process such data",
      "To prevent all cross-border data transfers",
      "To establish a data localization mandate"
    ],
    "answer": 1,
    "module": 1,
    "difficulty": "basic"
  },
  {
    "q": "Under DPDPA 2023, what is 'Personal Data'?",
    "options": [
      "Only biometric and financial information",
      "Data about a natural person who is identifiable by or in relation to such data",
      "Any data stored in electronic format",
      "Only data collected with consent"
    ],
    "answer": 1,
    "module": 1,
    "difficulty": "basic"
  },
  {
    "q": "When did the DPDPA 2023 receive Presidential assent?",
    "options": [
      "June 15, 2023",
      "August 11, 2023",
      "December 15, 2023",
      "January 10, 2024"
    ],
    "answer": 1,
    "module": 1,
    "difficulty": "basic"
  },
  {
    "q": "What is the territorial scope of DPDPA?",
    "options": [
      "Applies only within India",
      "Applies to processing in India and outside India if offering goods/services to Data Principals in India",
      "Applies only to Indian companies",
      "Applies only to government entities"
    ],
    "answer": 1,
    "module": 1,
    "difficulty": "basic"
  },
  {
    "q": "Which constitutional judgment forms the foundation of the DPDPA, 2023?",
    "options": [
      "Maneka Gandhi v. Union of India",
      "K.S. Puttaswamy v. Union of India",
      "ADM Jabalpur v. Shivkant Shukla",
      "Shreya Singhal v. Union of India"
    ],
    "answer": 1,
    "module": 1,
    "difficulty": "basic"
  },
  {
    "q": "Which category of data is explicitly excluded from the scope of the DPDPA?",
    "options": [
      "Digitised personal data",
      "Personal data processed by private companies",
      "Anonymised data",
      "Personal data processed by the State"
    ],
    "answer": 2,
    "module": 1,
    "difficulty": "basic"
  },
  {
    "q": "Does the DPDPA apply to personal data processed for household purposes?",
    "options": [
      "Yes, without exception",
      "Yes, only if digital",
      "No, personal or domestic purposes are exempt",
      "Only if shared on social media"
    ],
    "answer": 2,
    "module": 1,
    "difficulty": "basic"
  },
  {
    "q": "Which form of data triggers applicability of the DPDPA?",
    "options": [
      "Only paper-based records",
      "Only biometric databases",
      "Digital personal data or data digitised subsequently",
      "Only government-held data"
    ],
    "answer": 2,
    "module": 1,
    "difficulty": "basic"
  },
  {
    "q": "Who is the primary rights-holder under the DPDPA?",
    "options": [
      "Data Fiduciary",
      "Data Processor",
      "Data Principal",
      "Data Protection Board"
    ],
    "answer": 2,
    "module": 1,
    "difficulty": "basic"
  },
  {
    "q": "Does DPDPA protect data of companies and firms?",
    "options": [
      "Yes, all entities",
      "Yes, listed companies only",
      "No, it applies only to natural persons",
      "Only startups"
    ],
    "answer": 2,
    "module": 1,
    "difficulty": "basic"
  },
  {
    "q": "Which of the following best describes the nature of DPDPA?",
    "options": [
      "Criminal statute",
      "Purely contractual framework",
      "Rights-based data protection law",
      "Cybercrime legislation"
    ],
    "answer": 2,
    "module": 1,
    "difficulty": "basic"
  },
  {
    "q": "Is intent of the data fiduciary relevant for determining applicability of DPDPA?",
    "options": [
      "Yes, intent is mandatory",
      "Only in criminal cases",
      "No, applicability depends on processing activity",
      "Only for government entities"
    ],
    "answer": 2,
    "module": 1,
    "difficulty": "basic"
  },
  {
    "q": "Which authority enforces compliance under the DPDPA?",
    "options": [
      "CERT-In",
      "MeitY",
      "Data Protection Board of India",
      "Supreme Court of India"
    ],
    "answer": 2,
    "module": 1,
    "difficulty": "basic"
  },
  {
    "q": "Does DPDPA apply to non-digital data stored permanently in files?",
    "options": [
      "Yes, always",
      "Yes, if consent exists",
      "No, unless digitised",
      "Only for government departments"
    ],
    "answer": 2,
    "module": 1,
    "difficulty": "basic"
  },
  {
    "q": "What is the legislative nature of penalties under DPDPA?",
    "options": [
      "Criminal imprisonment",
      "Civil penalties without compensation",
      "Administrative monetary penalties",
      "Contractual damages"
    ],
    "answer": 2,
    "module": 1,
    "difficulty": "basic"
  },
  {
    "q": "Which principle best reflects the philosophy of DPDPA?",
    "options": [
      "Absolute data localization",
      "Consent at all costs",
      "Balance between privacy and lawful processing",
      "Government data ownership"
    ],
    "answer": 2,
    "module": 1,
    "difficulty": "basic"
  },
  {
    "q": "Does the DPDPA override the IT Act, 2000?",
    "options": [
      "Yes, fully repeals it",
      "Only Section 43A",
      "No, both operate concurrently",
      "Only for private companies"
    ],
    "answer": 2,
    "module": 1,
    "difficulty": "basic"
  },
  {
    "q": "What happens if offline data is later digitised?",
    "options": [
      "DPDPA still does not apply",
      "DPDPA applies prospectively",
      "DPDPA applies once digitised",
      "Only consent provisions apply"
    ],
    "answer": 2,
    "module": 1,
    "difficulty": "basic"
  },
  {
    "q": "Which entity determines the purpose and means of processing?",
    "options": [
      "Data Processor",
      "Data Principal",
      "Data Fiduciary",
      "Data Auditor"
    ],
    "answer": 2,
    "module": 1,
    "difficulty": "basic"
  },
  {
    "q": "Is harm mandatory to establish a DPDPA violation?",
    "options": [
      "Yes, harm must be proven",
      "Only financial harm",
      "No, breach of obligation is sufficient",
      "Only reputational harm"
    ],
    "answer": 2,
    "module": 1,
    "difficulty": "basic"
  },
  {
    "q": "Which body appoints members of the Data Protection Board?",
    "options": [
      "Supreme Court",
      "Parliament",
      "Central Government",
      "Election Commission"
    ],
    "answer": 2,
    "module": 1,
    "difficulty": "basic"
  },
  {
    "q": "Does DPDPA recognise data ownership?",
    "options": [
      "Yes, Data Principal owns data",
      "Yes, Government owns data",
      "No, it recognises data rights, not ownership",
      "Only companies own data"
    ],
    "answer": 2,
    "module": 1,
    "difficulty": "basic"
  },
  {
    "q": "Which category of processing is exempt from DPDPA?",
    "options": [
      "Commercial analytics",
      "Personal data for domestic purposes",
      "Employee monitoring",
      "Marketing databases"
    ],
    "answer": 1,
    "module": 1,
    "difficulty": "basic"
  },
  {
    "q": "Is DPDPA a technology-neutral law?",
    "options": [
      "No, applies only to AI systems",
      "No, applies only to cloud platforms",
      "Yes, applies regardless of technology used",
      "Only applies to mobile apps"
    ],
    "answer": 2,
    "module": 1,
    "difficulty": "basic"
  },
  {
    "q": "Under DPDPA, who is a 'Data Fiduciary'?",
    "options": [
      "The person whose data is being processed",
      "Any person who determines the purpose and means of processing personal data",
      "Only the Data Protection Board",
      "Any IT company"
    ],
    "answer": 1,
    "module": 1,
    "difficulty": "basic"
  },
  {
    "q": "What is a 'Data Processor' under DPDPA?",
    "options": [
      "The individual data subject",
      "Any person who processes personal data on behalf of a Data Fiduciary",
      "The Data Protection Board",
      "Any government official"
    ],
    "answer": 1,
    "module": 1,
    "difficulty": "basic"
  },
  {
    "q": "Which of the following is considered 'processing' under DPDPA?",
    "options": [
      "Only storage of data",
      "Only deletion of data",
      "Collection, storage, use, sharing, and deletion of data",
      "Only sharing of data"
    ],
    "answer": 2,
    "module": 1,
    "difficulty": "basic"
  },
  {
    "q": "[SCENARIO] A US-based e-commerce company has no physical presence in India but sells products to Indian customers through its website. Does DPDPA apply?",
    "options": [
      "No, because the company has no offices in India",
      "Yes, due to extraterritorial application under Section 3",
      "Only if the company stores data in India",
      "Only if annual sales exceed ₹100 crore"
    ],
    "answer": 1,
    "module": 1,
    "difficulty": "advanced"
  },
  {
    "q": "What is the definition of 'Data Principal' under DPDPA?",
    "options": [
      "The person who controls the data",
      "The natural person to whom the personal data relates",
      "The Chief Data Officer",
      "The Data Protection Board"
    ],
    "answer": 1,
    "module": 1,
    "difficulty": "basic"
  },
  {
    "q": "Under DPDPA, can children's personal data be processed?",
    "options": [
      "No, never",
      "Yes, with verifiable parental consent",
      "Yes, without any restrictions",
      "Only for educational purposes"
    ],
    "answer": 1,
    "module": 1,
    "difficulty": "basic"
  },
  {
    "q": "What age is considered a 'child' under DPDPA?",
    "options": [
      "Under 16 years",
      "Under 18 years",
      "Under 21 years",
      "As prescribed by the Central Government"
    ],
    "answer": 1,
    "module": 1,
    "difficulty": "basic"
  },
  {
    "q": "Which body is responsible for enforcement of DPDPA?",
    "options": [
      "Supreme Court of India",
      "Ministry of Electronics and IT",
      "Data Protection Board of India",
      "Reserve Bank of India"
    ],
    "answer": 2,
    "module": 1,
    "difficulty": "basic"
  },
  {
    "q": "[SCENARIO] A hospital in Mumbai treats patients from Nepal and Bangladesh. When processing their medical data, does DPDPA apply?",
    "options": [
      "Yes, because processing occurs in India",
      "No, because patients are not Indian citizens",
      "Only for emergency treatments",
      "Only if patients provide consent in writing"
    ],
    "answer": 0,
    "module": 1,
    "difficulty": "advanced"
  },
  {
    "q": "What is the primary legal basis for processing personal data under DPDPA?",
    "options": [
      "Legitimate interest only",
      "Consent of the Data Principal",
      "Government authorization",
      "Payment of fees"
    ],
    "answer": 1,
    "module": 1,
    "difficulty": "basic"
  },
  {
    "q": "Can personal data be processed for purposes other than the original purpose?",
    "options": [
      "Yes, anytime without restrictions",
      "Only with fresh consent or if covered under specified legitimate uses",
      "Never allowed under any circumstances",
      "Only with Data Protection Board approval"
    ],
    "answer": 1,
    "module": 1,
    "difficulty": "basic"
  },
  {
    "q": "Under Section 7, which of these is a 'specified purpose' for processing without consent?",
    "options": [
      "Marketing purposes",
      "Functions of the State",
      "Third-party advertising",
      "Employee monitoring"
    ],
    "answer": 1,
    "module": 1,
    "difficulty": "basic"
  },
  {
    "q": "What does 'anonymization' mean under DPDPA?",
    "options": [
      "Encrypting personal data",
      "Irreversible process of transforming data such that a Data Principal cannot be identified",
      "Temporarily hiding identifiers",
      "Storing data in a secure location"
    ],
    "answer": 1,
    "module": 1,
    "difficulty": "basic"
  },
  {
    "q": "Is anonymized data covered under DPDPA?",
    "options": [
      "Yes, fully regulated",
      "No, because Data Principals cannot be identified",
      "Only if re-identification is possible",
      "Only for commercial purposes"
    ],
    "answer": 1,
    "module": 1,
    "difficulty": "basic"
  },
  {
    "q": "[SCENARIO] An Indian fintech startup uses AWS (US-based) to store customer financial data. The fintech is the Data Fiduciary. What is AWS?",
    "options": [
      "Also a Data Fiduciary",
      "A Data Processor",
      "A Data Principal",
      "Not covered under DPDPA"
    ],
    "answer": 1,
    "module": 1,
    "difficulty": "advanced"
  },
  {
    "q": "How many sections are there in the DPDPA 2023?",
    "options": [
      "33 sections",
      "44 sections",
      "55 sections",
      "66 sections"
    ],
    "answer": 1,
    "module": 1,
    "difficulty": "basic"
  },
  {
    "q": "When were the DPDP Rules 2025 notified?",
    "options": [
      "January 3, 2025",
      "November 13, 2025",
      "December 1, 2024",
      "February 1, 2025"
    ],
    "answer": 1,
    "module": 1,
    "difficulty": "basic"
  },
  {
    "q": "Which of the following is NOT a right of Data Principals under DPDPA?",
    "options": [
      "Right to correction",
      "Right to erasure",
      "Right to data portability",
      "Right to nominate"
    ],
    "answer": 2,
    "module": 2,
    "difficulty": "basic"
  },
  {
    "q": "When must a Data Fiduciary provide a notice to Data Principals?",
    "options": [
      "Only when requested by the Data Principal",
      "Before or at the time of asking for consent",
      "Within 30 days of data collection",
      "Only if processing sensitive personal data"
    ],
    "answer": 1,
    "module": 2,
    "difficulty": "basic"
  },
  {
    "q": "What must be included in the notice to Data Principals under Section 5?",
    "options": [
      "Only the Data Fiduciary's name",
      "Personal data being collected, purpose, manner of exercising rights, and grievance redressal",
      "Only the purpose of processing",
      "Only contact details"
    ],
    "answer": 1,
    "module": 2,
    "difficulty": "basic"
  },
  {
    "q": "Under Section 6, valid consent must be which of the following?",
    "options": [
      "Implied, general, and permanent",
      "Free, specific, informed, unambiguous, and involve clear affirmative action",
      "Written, notarized, and witnessed",
      "Verbal and recorded"
    ],
    "answer": 1,
    "module": 2,
    "difficulty": "basic"
  },
  {
    "q": "[SCENARIO] An e-commerce app has a pre-ticked checkbox that says 'I agree to share my data with partners for marketing.' Is this valid consent?",
    "options": [
      "Yes, if users can untick it",
      "No, consent must involve clear affirmative action (user must actively tick)",
      "Yes, if mentioned in terms & conditions",
      "Only valid for existing customers"
    ],
    "answer": 1,
    "module": 2,
    "difficulty": "advanced"
  },
  {
    "q": "Can consent be withdrawn under DPDPA?",
    "options": [
      "No, consent is permanent",
      "Yes, as easily as it was given",
      "Only with Data Protection Board approval",
      "Only after 30 days"
    ],
    "answer": 1,
    "module": 2,
    "difficulty": "basic"
  },
  {
    "q": "What is the Right to Correction under Section 12?",
    "options": [
      "Right to sue for damages",
      "Right to correct inaccurate or misleading personal data",
      "Right to modify consent",
      "Right to delete the Data Fiduciary's records"
    ],
    "answer": 1,
    "module": 2,
    "difficulty": "basic"
  },
  {
    "q": "What is the Right to Erasure under Section 10?",
    "options": [
      "Right to erase the Data Fiduciary's servers",
      "Right to require cessation of data processing and deletion when consent is withdrawn or purpose is fulfilled",
      "Right to delete other people's data",
      "Right to erase public records"
    ],
    "answer": 1,
    "module": 2,
    "difficulty": "basic"
  },
  {
    "q": "[SCENARIO] A user withdraws consent for a shopping app to use their data for recommendations. The app says it will take 90 days to stop processing. Is this compliant?",
    "options": [
      "Yes, 90 days is reasonable",
      "No, processing must cease promptly unless another legal basis exists",
      "Yes, if mentioned in privacy policy",
      "Only if the user agrees to the delay"
    ],
    "answer": 1,
    "module": 2,
    "difficulty": "advanced"
  },
  {
    "q": "What is the Right to Grievance Redressal under Section 13?",
    "options": [
      "Right to file criminal complaints",
      "Right to seek remedies for failure to comply with DPDPA provisions",
      "Right to compensation from the government",
      "Right to data portability"
    ],
    "answer": 1,
    "module": 2,
    "difficulty": "basic"
  },
  {
    "q": "What is the Right to Nominate under Section 14?",
    "options": [
      "Right to nominate a Data Fiduciary",
      "Right to nominate another person to exercise rights in the event of death or incapacity",
      "Right to nominate a lawyer",
      "Right to nominate data for deletion"
    ],
    "answer": 1,
    "module": 2,
    "difficulty": "basic"
  },
  {
    "q": "Under Section 8, what are the obligations of a Data Fiduciary?",
    "options": [
      "Only to store data securely",
      "Process lawfully, ensure accuracy, implement security safeguards, delete data upon purpose completion",
      "Only to obtain consent",
      "Only to respond to requests"
    ],
    "answer": 1,
    "module": 2,
    "difficulty": "basic"
  },
  {
    "q": "What is the purpose limitation principle under Section 4?",
    "options": [
      "Data can be used for any purpose",
      "Personal data shall be processed only for lawful purposes for which consent was given",
      "Purpose can be changed without notice",
      "Purpose is decided by the Data Protection Board"
    ],
    "answer": 1,
    "module": 2,
    "difficulty": "basic"
  },
  {
    "q": "[SCENARIO] A telecom company collects customer data for billing purposes but starts using it for targeted advertising without fresh consent. Is this allowed?",
    "options": [
      "Yes, if disclosed in privacy policy",
      "No, violates purpose limitation - fresh consent is required",
      "Yes, if customers are notified",
      "Only for existing customers"
    ],
    "answer": 1,
    "module": 2,
    "difficulty": "advanced"
  },
  {
    "q": "Under Section 8(3), what is the accuracy obligation?",
    "options": [
      "Data must be 100% perfect",
      "Data Fiduciary must ensure completeness, accuracy, and consistency of personal data",
      "Only financial data must be accurate",
      "Accuracy is optional"
    ],
    "answer": 1,
    "module": 2,
    "difficulty": "basic"
  },
  {
    "q": "What is data minimization under Section 4?",
    "options": [
      "Collecting as much data as possible",
      "Collecting only data necessary for the specified purpose",
      "Minimizing storage costs",
      "Collecting data from minimal sources"
    ],
    "answer": 1,
    "module": 2,
    "difficulty": "basic"
  },
  {
    "q": "Under Section 8(7), when must personal data be deleted?",
    "options": [
      "Never, data can be kept indefinitely",
      "When it is no longer necessary for the purpose or consent is withdrawn",
      "After 10 years",
      "Only when requested by Data Principal"
    ],
    "answer": 1,
    "module": 2,
    "difficulty": "basic"
  },
  {
    "q": "[SCENARIO] A job portal keeps candidate data for 5 years after the hiring process ends 'for future opportunities.' Is this compliant without fresh consent?",
    "options": [
      "Yes, it's good practice",
      "No, violates data retention principles - must delete or obtain fresh consent for new purpose",
      "Yes, if mentioned in privacy policy",
      "Only for successful candidates"
    ],
    "answer": 1,
    "module": 2,
    "difficulty": "advanced"
  },
  {
    "q": "What are 'reasonable security safeguards' under Section 8(5)?",
    "options": [
      "Only antivirus software",
      "Measures to prevent data breaches, including technical, operational, and organizational measures",
      "Only passwords",
      "Only firewalls"
    ],
    "answer": 1,
    "module": 2,
    "difficulty": "basic"
  },
  {
    "q": "Under Section 8(6), when must a Data Fiduciary notify a breach to the Board?",
    "options": [
      "Within 72 hours",
      "As soon as reasonably possible after becoming aware",
      "Within 30 days",
      "Never, only Data Principals need notification"
    ],
    "answer": 0,
    "module": 2,
    "difficulty": "basic"
  },
  {
    "q": "[SCENARIO] A mobile app uses pre-ticked boxes for accepting its privacy policy. Under DPDPA, is this valid consent?",
    "options": [
      "No, consent must be by clear affirmative action",
      "Yes, if disclosed in the policy",
      "Yes, if users can later opt out",
      "Only for government apps"
    ],
    "answer": 0,
    "module": 2,
    "difficulty": "advanced"
  },
  {
    "q": "[SCENARIO] An e-commerce platform bundles consent for marketing emails with account creation. Is this compliant?",
    "options": [
      "Yes, bundled consent is permitted",
      "No, consent must be specific and granular",
      "Only if emails are infrequent",
      "Yes, for registered users"
    ],
    "answer": 1,
    "module": 2,
    "difficulty": "advanced"
  },
  {
    "q": "[SCENARIO] A hospital processes patient data during an emergency without consent. Is this lawful under DPDPA?",
    "options": [
      "Only if later consent is taken",
      "Only for government hospitals",
      "Yes, under legitimate use for medical emergency",
      "No, consent is mandatory"
    ],
    "answer": 2,
    "module": 2,
    "difficulty": "advanced"
  },
  {
    "q": "[SCENARIO] An employer processes employee attendance data without explicit consent. Is this allowed?",
    "options": [
      "Only if employees agree in writing",
      "Yes, under legitimate use for employment purposes",
      "No, consent is mandatory",
      "Only for public sector employers"
    ],
    "answer": 1,
    "module": 2,
    "difficulty": "advanced"
  },
  {
    "q": "[SCENARIO] A fintech app continues processing personal data after consent has been withdrawn. Is this compliant?",
    "options": [
      "Yes, for analytics purposes",
      "Only if anonymised",
      "No, processing must stop after withdrawal",
      "Yes, if data was already collected"
    ],
    "answer": 2,
    "module": 2,
    "difficulty": "advanced"
  },
  {
    "q": "[SCENARIO] A data fiduciary seeks consent using vague language like 'for business purposes'. Is this valid?",
    "options": [
      "Yes, broad purposes are allowed",
      "Only for startups",
      "No, consent must be informed and specific",
      "Yes, if explained elsewhere"
    ],
    "answer": 2,
    "module": 2,
    "difficulty": "advanced"
  },
  {
    "q": "[SCENARIO] A government department processes citizen data for subsidy distribution without consent. Is this lawful?",
    "options": [
      "Yes, as a State function under legitimate use",
      "Only with parliamentary approval",
      "No, consent is mandatory",
      "Only if data is encrypted"
    ],
    "answer": 0,
    "module": 2,
    "difficulty": "advanced"
  },
  {
    "q": "[SCENARIO] A company relies on consent obtained before DPDPA enforcement without updating its notice. Is this valid?",
    "options": [
      "Yes, old consent continues indefinitely",
      "Only if users are informed orally",
      "No, consent must meet DPDPA standards",
      "Only for one year"
    ],
    "answer": 2,
    "module": 2,
    "difficulty": "advanced"
  },
  {
    "q": "[SCENARIO] A social media platform processes data of children without parental consent. Is this permitted?",
    "options": [
      "Only above age 13",
      "Yes, if the child agreed",
      "Only for educational content",
      "No, verifiable parental consent is required"
    ],
    "answer": 3,
    "module": 2,
    "difficulty": "advanced"
  },
  {
    "q": "[SCENARIO] A telecom company processes call data records to comply with a court order. Is consent required?",
    "options": [
      "Only if data is sensitive",
      "Yes, consent is mandatory",
      "Only with DPB approval",
      "No, processing is permitted for legal obligation"
    ],
    "answer": 3,
    "module": 2,
    "difficulty": "advanced"
  },
  {
    "q": "[SCENARIO] A user clicks 'Agree' without reading the notice. Is consent still valid?",
    "options": [
      "Yes, if notice was accessible",
      "No, reading is mandatory",
      "Only if highlighted",
      "Only for non-sensitive data"
    ],
    "answer": 0,
    "module": 2,
    "difficulty": "advanced"
  },
  {
    "q": "[SCENARIO] A company collects personal data for one purpose and later uses it for another without consent. Is this lawful?",
    "options": [
      "Yes, for internal use",
      "No, fresh consent is required",
      "Yes, if related purpose",
      "Only if anonymised"
    ],
    "answer": 1,
    "module": 2,
    "difficulty": "advanced"
  },
  {
    "q": "[SCENARIO] A food delivery app processes address data after order completion for analytics. Is this allowed?",
    "options": [
      "Only if within stated purpose or consent",
      "Never allowed",
      "Yes, always",
      "Only with DPB approval"
    ],
    "answer": 0,
    "module": 2,
    "difficulty": "advanced"
  },
  {
    "q": "[SCENARIO] A data fiduciary refuses service unless consent for marketing is given. Is this valid consent?",
    "options": [
      "Yes, service condition is allowed",
      "Only for premium services",
      "No, consent must be freely given",
      "Only if disclosed"
    ],
    "answer": 2,
    "module": 2,
    "difficulty": "advanced"
  },
  {
    "q": "[SCENARIO] A bank processes KYC data to meet RBI requirements without consent. Is this lawful?",
    "options": [
      "Only with customer notice",
      "Yes, under legal obligation",
      "No, consent is mandatory",
      "Only for public banks"
    ],
    "answer": 1,
    "module": 2,
    "difficulty": "advanced"
  },
  {
    "q": "[SCENARIO] A data fiduciary fails to provide consent withdrawal mechanism. Is this compliant?",
    "options": [
      "Yes, if consent was once given",
      "Yes, if stated in policy",
      "Only for small entities",
      "No, withdrawal must be as easy as giving consent"
    ],
    "answer": 3,
    "module": 2,
    "difficulty": "advanced"
  },
  {
    "q": "[SCENARIO] A logistics company processes delivery data after contract completion for dispute resolution. Is this permitted?",
    "options": [
      "Yes, under legitimate use",
      "Only with fresh consent",
      "No, consent expired",
      "Only for government contracts"
    ],
    "answer": 0,
    "module": 2,
    "difficulty": "advanced"
  },
  {
    "q": "[SCENARIO] A user gives consent under pressure to avoid account suspension. Is consent valid?",
    "options": [
      "Yes, user agreed",
      "No, consent must be free of coercion",
      "Only if approved by DPB",
      "Yes, if documented"
    ],
    "answer": 1,
    "module": 2,
    "difficulty": "advanced"
  },
  {
    "q": "[SCENARIO] A company processes personal data for fraud prevention without consent. Is this lawful?",
    "options": [
      "Yes, under legitimate use",
      "Only if anonymised",
      "No, consent mandatory",
      "Only for banks"
    ],
    "answer": 0,
    "module": 2,
    "difficulty": "advanced"
  },
  {
    "q": "[SCENARIO] A startup collects consent via long unreadable legal text. Is this compliant?",
    "options": [
      "Yes, length does not matter",
      "Only if lawyer-drafted",
      "Only for paid users",
      "No, consent must be informed and clear"
    ],
    "answer": 3,
    "module": 2,
    "difficulty": "advanced"
  },
  {
    "q": "When must Data Principals be notified about a breach under Section 8(6)?",
    "options": [
      "Always, in all cases",
      "Only if the breach is likely to cause harm to the Data Principal",
      "Never, only the Board needs notification",
      "Only for financial data breaches"
    ],
    "answer": 0,
    "module": 2,
    "difficulty": "basic"
  },
  {
    "q": "What threshold makes a Data Fiduciary a 'Significant Data Fiduciary' (SDF)?",
    "options": [
      "Processing data of 10,000 individuals",
      "Annual revenue exceeding ₹500 crore",
      "As notified by the Central Government based on prescribed parameters",
      "Processing any sensitive personal data"
    ],
    "answer": 2,
    "module": 3,
    "difficulty": "intermediate"
  },
  {
    "q": "What is the primary responsibility of a Data Protection Officer (DPO)?",
    "options": [
      "To manage IT infrastructure",
      "To represent the Data Fiduciary before the Data Protection Board and ensure DPDPA compliance",
      "To audit all third-party vendors",
      "To approve all data processing activities"
    ],
    "answer": 1,
    "module": 3,
    "difficulty": "intermediate"
  },
  {
    "q": "Under Rule 13, which entities MUST appoint a Data Protection Officer (DPO)?",
    "options": [
      "All Data Fiduciaries",
      "Only Significant Data Fiduciaries",
      "Only government entities",
      "Only companies with revenue > ₹100 crore"
    ],
    "answer": 1,
    "module": 3,
    "difficulty": "intermediate"
  },
  {
    "q": "What are the additional obligations for Significant Data Fiduciaries under Section 9?",
    "options": [
      "Pay higher fees only",
      "Appoint DPO, conduct DPIA, conduct periodic audits, and other measures as prescribed",
      "None, same as regular Data Fiduciaries",
      "Only conduct audits"
    ],
    "answer": 1,
    "module": 3,
    "difficulty": "intermediate"
  },
  {
    "q": "[SCENARIO] A social media platform with 50 million Indian users has been notified as an SDF. What new obligations does it have?",
    "options": [
      "No additional obligations",
      "Must appoint DPO, conduct DPIA, periodic audits, maintain processing records",
      "Only pay higher penalties",
      "Only faster breach notification"
    ],
    "answer": 1,
    "module": 3,
    "difficulty": "advanced"
  },
  {
    "q": "What is a Data Protection Impact Assessment (DPIA)?",
    "options": [
      "Financial impact analysis",
      "Assessment of potential risks to rights of Data Principals from processing activities",
      "Assessment of IT infrastructure",
      "Market research"
    ],
    "answer": 1,
    "module": 3,
    "difficulty": "intermediate"
  },
  {
    "q": "Under Rule 13, when must an SDF conduct a DPIA?",
    "options": [
      "Never required",
      "Before undertaking processing likely to involve significant risk to Data Principals",
      "After a breach occurs",
      "Every 5 years"
    ],
    "answer": 1,
    "module": 3,
    "difficulty": "intermediate"
  },
  {
    "q": "What is the purpose of periodic audits for SDFs?",
    "options": [
      "Financial compliance only",
      "To assess compliance with DPDPA provisions and identify vulnerabilities",
      "Tax purposes",
      "Marketing assessment"
    ],
    "answer": 1,
    "module": 3,
    "difficulty": "intermediate"
  },
  {
    "q": "[SCENARIO] An e-commerce company designated as SDF wants to launch a new AI-powered facial recognition payment system. What must it do first?",
    "options": [
      "Launch immediately if technically ready",
      "Conduct a Data Protection Impact Assessment (DPIA) to assess risks",
      "Only obtain consent from users",
      "Pay a fee to the Data Protection Board"
    ],
    "answer": 1,
    "module": 3,
    "difficulty": "advanced"
  },
  {
    "q": "[SCENARIO] A user asks a company whether their personal data is being processed and requests a summary. Which right is being exercised?",
    "options": [
      "Right to erasure",
      "Right to grievance redressal",
      "Right to access information",
      "Right to correction"
    ],
    "answer": 2,
    "module": 3,
    "difficulty": "advanced"
  },
  {
    "q": "[SCENARIO] A Data Principal requests correction of an incorrect address, but the company ignores the request. Which right is violated?",
    "options": [
      "Right to nomination",
      "Right to access",
      "Right to correction and erasure",
      "Right to consent withdrawal"
    ],
    "answer": 2,
    "module": 3,
    "difficulty": "advanced"
  },
  {
    "q": "[SCENARIO] A user withdraws consent but the data fiduciary retains the data without lawful basis. Which right applies?",
    "options": [
      "Right to erasure",
      "Right to information",
      "Right to grievance redressal",
      "Right to correction"
    ],
    "answer": 0,
    "module": 3,
    "difficulty": "advanced"
  },
  {
    "q": "[SCENARIO] A company provides incomplete information in response to an access request. Which right is impacted?",
    "options": [
      "Right to grievance redressal",
      "Right to access information",
      "Right to nomination",
      "Right to correction"
    ],
    "answer": 1,
    "module": 3,
    "difficulty": "advanced"
  },
  {
    "q": "[SCENARIO] A Data Principal nominates their spouse to exercise rights after death. Which right is this?",
    "options": [
      "Right to access",
      "Right to correction",
      "Right to nomination",
      "Right to erasure"
    ],
    "answer": 2,
    "module": 3,
    "difficulty": "advanced"
  },
  {
    "q": "[SCENARIO] A company refuses to delete personal data even after consent withdrawal and purpose completion. Which right is violated?",
    "options": [
      "Right to erasure",
      "Right to access",
      "Right to nomination",
      "Right to grievance redressal"
    ],
    "answer": 0,
    "module": 3,
    "difficulty": "advanced"
  },
  {
    "q": "[SCENARIO] A Data Principal files a complaint but the company does not respond within reasonable time. Which right applies?",
    "options": [
      "Right to information",
      "Right to grievance redressal",
      "Right to erasure",
      "Right to correction"
    ],
    "answer": 1,
    "module": 3,
    "difficulty": "advanced"
  },
  {
    "q": "[SCENARIO] A platform refuses to correct inaccurate personal data citing internal policy. Which right is breached?",
    "options": [
      "Right to access",
      "Right to grievance redressal",
      "Right to correction",
      "Right to nomination"
    ],
    "answer": 2,
    "module": 3,
    "difficulty": "advanced"
  },
  {
    "q": "[SCENARIO] A user requests information about third parties with whom their data is shared. Which right applies?",
    "options": [
      "Right to erasure",
      "Right to access information",
      "Right to nomination",
      "Right to correction"
    ],
    "answer": 1,
    "module": 3,
    "difficulty": "advanced"
  },
  {
    "q": "[SCENARIO] A Data Principal nominates a legal heir using an online portal. Is this valid under DPDPA?",
    "options": [
      "No, nomination must be physical",
      "Only for government services",
      "Yes, digital nomination is permitted",
      "Only after DPB approval"
    ],
    "answer": 2,
    "module": 3,
    "difficulty": "advanced"
  },
  {
    "q": "[SCENARIO] A user seeks deletion of data that is still required under law. Can the fiduciary refuse?",
    "options": [
      "Yes, legal obligation overrides erasure",
      "No, erasure is absolute",
      "Only with DPB approval",
      "Only for government data"
    ],
    "answer": 0,
    "module": 3,
    "difficulty": "advanced"
  },
  {
    "q": "[SCENARIO] A company demands a fee for correcting inaccurate personal data. Is this compliant?",
    "options": [
      "Yes, administrative fees are allowed",
      "Only for repeated requests",
      "No, correction must be free of charge",
      "Only for private companies"
    ],
    "answer": 2,
    "module": 3,
    "difficulty": "advanced"
  },
  {
    "q": "[SCENARIO] A Data Principal requests data access in an unreadable format. Is the fiduciary compliant?",
    "options": [
      "Yes, format does not matter",
      "Only if data is complete",
      "No, information must be understandable",
      "Only for technical users"
    ],
    "answer": 2,
    "module": 3,
    "difficulty": "advanced"
  },
  {
    "q": "[SCENARIO] A platform delays responding to a rights request indefinitely. Which remedy is available?",
    "options": [
      "Direct criminal complaint",
      "Approach Data Protection Board after grievance",
      "Immediate civil suit",
      "No remedy exists"
    ],
    "answer": 1,
    "module": 3,
    "difficulty": "advanced"
  },
  {
    "q": "[SCENARIO] A user seeks erasure, but data has been anonymised. Is erasure still required?",
    "options": [
      "Yes, anonymised data must be erased",
      "No, anonymised data is outside DPDPA scope",
      "Only for sensitive data",
      "Only with consent"
    ],
    "answer": 1,
    "module": 3,
    "difficulty": "advanced"
  },
  {
    "q": "[SCENARIO] A company denies access request claiming trade secrets. Is blanket denial allowed?",
    "options": [
      "Yes, trade secrets override rights",
      "Only with court order",
      "No, limited disclosure must still be given",
      "Only for startups"
    ],
    "answer": 2,
    "module": 3,
    "difficulty": "advanced"
  },
  {
    "q": "[SCENARIO] A Data Principal submits a correction request with supporting documents. What must the fiduciary do?",
    "options": [
      "Ignore unless court ordered",
      "Verify and update data",
      "Delete entire record",
      "Forward to DPB"
    ],
    "answer": 1,
    "module": 3,
    "difficulty": "advanced"
  },
  {
    "q": "[SCENARIO] A company requires Aadhaar to process a grievance request. Is this lawful?",
    "options": [
      "Yes, for identity verification",
      "Only with government approval",
      "No, excessive data collection violates proportionality",
      "Only for financial services"
    ],
    "answer": 2,
    "module": 3,
    "difficulty": "advanced"
  },
  {
    "q": "[SCENARIO] A deceased user’s nominee requests account access. Which provision enables this?",
    "options": [
      "Right to access",
      "Right to nomination",
      "Right to erasure",
      "Right to correction"
    ],
    "answer": 1,
    "module": 3,
    "difficulty": "advanced"
  },
  {
    "q": "[SCENARIO] A company auto-closes grievance tickets without resolution. Which right is affected?",
    "options": [
      "Right to grievance redressal",
      "Right to correction",
      "Right to nomination",
      "Right to erasure"
    ],
    "answer": 0,
    "module": 3,
    "difficulty": "advanced"
  },
  {
    "q": "What is 'privacy by design' under DPDPA?",
    "options": [
      "Designing beautiful privacy policies",
      "Integrating privacy considerations into the design of systems, processes, and products from the outset",
      "Designing secure buildings",
      "Graphic design for privacy notices"
    ],
    "answer": 1,
    "module": 3,
    "difficulty": "intermediate"
  },
  {
    "q": "Under Section 16, what is required when processing personal data outside India?",
    "options": [
      "Completely prohibited",
      "Allowed to prescribed countries/territories with adequate data protection measures",
      "Requires payment of fees",
      "Requires individual permission for each transfer"
    ],
    "answer": 1,
    "module": 3,
    "difficulty": "intermediate"
  },
  {
    "q": "What are 'Standard Contractual Clauses' (SCCs) in the context of data transfers?",
    "options": [
      "Marketing contracts",
      "Pre-approved contractual terms to ensure adequate protection for cross-border transfers",
      "Employment contracts",
      "Vendor payment terms"
    ],
    "answer": 1,
    "module": 3,
    "difficulty": "intermediate"
  },
  {
    "q": "[SCENARIO] An Indian bank wants to use a US-based cloud provider for storing customer data. What safeguards are needed?",
    "options": [
      "None, cloud providers are automatically compliant",
      "Data Processing Agreement ensuring DPDPA compliance, security measures, and proper transfer mechanisms",
      "Only encryption",
      "Only inform customers"
    ],
    "answer": 1,
    "module": 3,
    "difficulty": "advanced"
  },
  {
    "q": "What is a 'Data Processing Agreement' (DPA)?",
    "options": [
      "Agreement between two Data Principals",
      "Contract between Data Fiduciary and Data Processor defining terms of processing",
      "Agreement with the Data Protection Board",
      "Marketing agreement"
    ],
    "answer": 1,
    "module": 3,
    "difficulty": "intermediate"
  },
  {
    "q": "What are the minimum elements required in a Data Processing Agreement?",
    "options": [
      "Only payment terms",
      "Scope of processing, processor obligations, data security, return/deletion provisions, sub-processor terms",
      "Only confidentiality clause",
      "Only termination clause"
    ],
    "answer": 1,
    "module": 3,
    "difficulty": "intermediate"
  },
  {
    "q": "Under Section 8(1), who is accountable for the Data Processor's compliance?",
    "options": [
      "The Data Processor alone",
      "The Data Fiduciary remains accountable",
      "The Data Protection Board",
      "No one is accountable"
    ],
    "answer": 1,
    "module": 3,
    "difficulty": "intermediate"
  },
  {
    "q": "What is a 'Record of Processing Activities' (RoPA)?",
    "options": [
      "Financial records",
      "Documentation of all processing activities including purposes, data categories, recipients, and retention",
      "Employee attendance records",
      "Marketing campaign records"
    ],
    "answer": 1,
    "module": 3,
    "difficulty": "intermediate"
  },
  {
    "q": "[SCENARIO] During an audit, the Data Protection Board asks an SDF to produce its Record of Processing Activities (RoPA). The SDF doesn't have one. What is the consequence?",
    "options": [
      "Warning only for first offense",
      "Penalty up to ₹250 crore for non-compliance with Section 10 obligations",
      "No consequence",
      "1-year grace period given"
    ],
    "answer": 1,
    "module": 3,
    "difficulty": "advanced"
  },
  {
    "q": "What is the role of the Consent Manager under DPDPA?",
    "options": [
      "Manages employee attendance",
      "Helps Data Principals give, manage, review, and withdraw consent through interoperable platforms",
      "Manages financial consents only",
      "Government official"
    ],
    "answer": 1,
    "module": 3,
    "difficulty": "intermediate"
  },
  {
    "q": "Who can register as a Consent Manager under DPDPA?",
    "options": [
      "Any individual",
      "Entities registered with the Data Protection Board meeting prescribed requirements",
      "Only government entities",
      "Only banks"
    ],
    "answer": 1,
    "module": 3,
    "difficulty": "intermediate"
  },
  {
    "q": "What is the difference between a Data Fiduciary and a Consent Manager?",
    "options": [
      "No difference, same role",
      "Data Fiduciary processes data; Consent Manager facilitates consent management for Data Principals",
      "Consent Manager is always a government entity",
      "Data Fiduciary only stores data"
    ],
    "answer": 1,
    "module": 3,
    "difficulty": "intermediate"
  },
  {
    "q": "What is the maximum penalty that the Data Protection Board can impose on a Data Fiduciary for non-compliance?",
    "options": [
      "₹100 crore",
      "₹250 crore",
      "₹500 crore",
      "As determined by the Board based on severity"
    ],
    "answer": 1,
    "module": 4,
    "difficulty": "intermediate"
  },
  {
    "q": "Within what timeframe must a Data Fiduciary notify a personal data breach to the Board?",
    "options": [
      "Immediately upon discovery",
      "Within 72 hours",
      "As soon as reasonably possible",
      "Within 7 days"
    ],
    "answer": 1,
    "module": 4,
    "difficulty": "intermediate"
  },
  {
    "q": "Under which section can penalties be imposed by the Data Protection Board?",
    "options": [
      "Section 29",
      "Section 33",
      "Section 40",
      "Section 50"
    ],
    "answer": 1,
    "module": 4,
    "difficulty": "intermediate"
  },
  {
    "q": "What factors does the Data Protection Board consider when determining penalty amounts?",
    "options": [
      "Only the company's revenue",
      "Nature, gravity, and duration of breach; type and nature of personal data; repetitive nature; actions taken to mitigate harm",
      "Only the number of users affected",
      "Random determination"
    ],
    "answer": 1,
    "module": 4,
    "difficulty": "intermediate"
  },
  {
    "q": "[SCENARIO] A fintech startup suffers a data breach affecting 10,000 customers but notifies the Board within 2 hours and Data Principals within 24 hours. All affected were given 1 year of credit monitoring. How might this affect the penalty?",
    "options": [
      "Maximum penalty automatically applied",
      "Prompt notification and mitigation efforts are likely to reduce the penalty significantly",
      "No penalty since notification was fast",
      "Penalty doubled for having a breach"
    ],
    "answer": 1,
    "module": 4,
    "difficulty": "advanced"
  },
  {
    "q": "Can the Data Protection Board issue directions to Data Fiduciaries?",
    "options": [
      "No, only penalties",
      "Yes, can issue directions to ensure compliance and protect Data Principal rights",
      "Only to government entities",
      "Only after court approval"
    ],
    "answer": 1,
    "module": 4,
    "difficulty": "intermediate"
  },
  {
    "q": "What is the appeal mechanism under DPDPA?",
    "options": [
      "No appeals allowed",
      "Appeals to Telecom Disputes Settlement and Appellate Tribunal (TDSAT)",
      "Appeals to Supreme Court directly",
      "Appeals to Ministry of IT"
    ],
    "answer": 1,
    "module": 4,
    "difficulty": "intermediate"
  },
  {
    "q": "Within what time period can an appeal be filed against a Data Protection Board order?",
    "options": [
      "30 days",
      "60 days",
      "90 days",
      "6 months"
    ],
    "answer": 1,
    "module": 4,
    "difficulty": "intermediate"
  },
  {
    "q": "[SCENARIO] A Data Fiduciary is penalized ₹50 crore by the Board. The company believes the penalty is excessive. What is its recourse?",
    "options": [
      "Must pay, no recourse",
      "File appeal to TDSAT within 60 days",
      "File review petition with the Board",
      "Approach the Prime Minister's Office"
    ],
    "answer": 1,
    "module": 4,
    "difficulty": "advanced"
  },
  {
    "q": "What is the role of the Data Protection Board of India?",
    "options": [
      "Only collecting penalties",
      "Enforcement, adjudication of complaints, imposing penalties, issuing directions, and protecting Data Principal rights",
      "Only policy making",
      "Only conducting awareness programs"
    ],
    "answer": 1,
    "module": 4,
    "difficulty": "intermediate"
  },
  {
    "q": "How is the Data Protection Board constituted?",
    "options": [
      "Single member",
      "Chairperson and members (whole-time and part-time) appointed by Central Government",
      "Elected by Data Fiduciaries",
      "Permanent bureaucrats"
    ],
    "answer": 1,
    "module": 4,
    "difficulty": "intermediate"
  },
  {
    "q": "Can Data Principals file complaints directly with the Data Protection Board?",
    "options": [
      "No, must go through courts only",
      "Yes, Data Principals can file complaints regarding violations of their rights",
      "Only through Consent Managers",
      "Only if damages exceed ₹1 lakh"
    ],
    "answer": 1,
    "module": 4,
    "difficulty": "intermediate"
  },
  {
    "q": "[SCENARIO] A user's request for data erasure is ignored by an e-commerce platform for 90 days despite multiple follow-ups. What can the user do?",
    "options": [
      "Nothing, must wait indefinitely",
      "File a complaint with the Data Protection Board for violation of Right to Erasure",
      "File criminal case directly",
      "Approach consumer court only"
    ],
    "answer": 1,
    "module": 4,
    "difficulty": "advanced"
  },
  {
    "q": "What is the penalty for non-compliance with Board directions?",
    "options": [
      "No specific penalty",
      "Up to ₹200 crore",
      "Only warning",
      "₹10 lakh"
    ],
    "answer": 1,
    "module": 4,
    "difficulty": "intermediate"
  },
  {
    "q": "[SCENARIO] A company collects personal data without publishing a privacy notice. Which obligation under DPDPA is violated?",
    "options": [
      "Duty to ensure data accuracy",
      "Duty to provide notice",
      "Duty to minimise data",
      "Duty to appoint DPO"
    ],
    "answer": 1,
    "module": 4,
    "difficulty": "advanced"
  },
  {
    "q": "[SCENARIO] A data fiduciary stores outdated customer information leading to incorrect service delivery. Which obligation is breached?",
    "options": [
      "Data minimisation",
      "Consent obligation",
      "Data accuracy obligation",
      "Grievance redressal"
    ],
    "answer": 2,
    "module": 4,
    "difficulty": "advanced"
  },
  {
    "q": "[SCENARIO] A startup collects excessive personal data unrelated to its service. Which principle is violated?",
    "options": [
      "Data minimisation",
      "Purpose limitation",
      "Consent withdrawal",
      "Security safeguard"
    ],
    "answer": 0,
    "module": 4,
    "difficulty": "advanced"
  },
  {
    "q": "[SCENARIO] A data fiduciary fails to implement reasonable security safeguards and suffers a breach. Which obligation applies?",
    "options": [
      "Notice obligation",
      "Security safeguard obligation",
      "Consent obligation",
      "Nomination obligation"
    ],
    "answer": 1,
    "module": 4,
    "difficulty": "advanced"
  },
  {
    "q": "[SCENARIO] A company does not delete personal data even after the purpose is fulfilled. Which duty is violated?",
    "options": [
      "Duty to erase personal data",
      "Duty to appoint DPO",
      "Duty to notify breach",
      "Duty to obtain consent"
    ],
    "answer": 0,
    "module": 4,
    "difficulty": "advanced"
  },
  {
    "q": "[SCENARIO] A Significant Data Fiduciary fails to appoint a Data Protection Officer. Is this compliant?",
    "options": [
      "Yes, DPO is optional",
      "Only required for government entities",
      "No, appointment of DPO is mandatory",
      "Only for foreign companies"
    ],
    "answer": 2,
    "module": 4,
    "difficulty": "advanced"
  },
  {
    "q": "[SCENARIO] A data processor uses personal data for its own analytics without permission. Which rule is violated?",
    "options": [
      "Processor limitation obligation",
      "Consent obligation",
      "Breach notification rule",
      "Nomination rule"
    ],
    "answer": 0,
    "module": 4,
    "difficulty": "advanced"
  },
  {
    "q": "[SCENARIO] A fiduciary outsources processing but fails to ensure contractual safeguards. What is the consequence?",
    "options": [
      "Processor bears full liability",
      "No consequence",
      "Fiduciary remains responsible",
      "Only DPB is responsible"
    ],
    "answer": 2,
    "module": 4,
    "difficulty": "advanced"
  },
  {
    "q": "[SCENARIO] A company does not publish grievance redressal contact details. Which obligation is breached?",
    "options": [
      "Security obligation",
      "Grievance redressal obligation",
      "Consent obligation",
      "Data accuracy obligation"
    ],
    "answer": 1,
    "module": 4,
    "difficulty": "advanced"
  },
  {
    "q": "[SCENARIO] A fiduciary continues processing data despite unresolved grievance. Is this allowed?",
    "options": [
      "Yes, grievances do not affect processing",
      "Only for public interest",
      "No, fiduciary must address grievances promptly",
      "Only for large companies"
    ],
    "answer": 2,
    "module": 4,
    "difficulty": "advanced"
  },
  {
    "q": "[SCENARIO] A company does not conduct Data Protection Impact Assessment despite high-risk processing. Is this compliant?",
    "options": [
      "Yes, DPIA is optional",
      "Only required outside India",
      "No, DPIA is mandatory for significant fiduciaries",
      "Only after breach"
    ],
    "answer": 2,
    "module": 4,
    "difficulty": "advanced"
  },
  {
    "q": "[SCENARIO] A fiduciary delays breach notification to affected users. Which obligation is violated?",
    "options": [
      "Breach notification obligation",
      "Data minimisation",
      "Consent requirement",
      "Nomination obligation"
    ],
    "answer": 0,
    "module": 4,
    "difficulty": "advanced"
  },
  {
    "q": "[SCENARIO] A data fiduciary uses personal data beyond the stated purpose. Which duty is breached?",
    "options": [
      "Purpose limitation obligation",
      "Security safeguard",
      "Nomination duty",
      "Grievance handling"
    ],
    "answer": 0,
    "module": 4,
    "difficulty": "advanced"
  },
  {
    "q": "[SCENARIO] A Significant Data Fiduciary does not appoint an independent auditor. Is this compliant?",
    "options": [
      "Yes, audits are voluntary",
      "Only required for banks",
      "No, periodic audits are mandatory",
      "Only after breach"
    ],
    "answer": 2,
    "module": 4,
    "difficulty": "advanced"
  },
  {
    "q": "[SCENARIO] A fiduciary collects data lawfully but stores it indefinitely. Which principle is violated?",
    "options": [
      "Storage limitation",
      "Consent obligation",
      "Data accuracy",
      "Security safeguard"
    ],
    "answer": 0,
    "module": 4,
    "difficulty": "advanced"
  },
  {
    "q": "[SCENARIO] A data processor sub-contracts processing without informing the fiduciary. Is this allowed?",
    "options": [
      "Yes, processors are independent",
      "Only for cloud providers",
      "No, fiduciary authorisation is required",
      "Only for government contracts"
    ],
    "answer": 2,
    "module": 4,
    "difficulty": "advanced"
  },
  {
    "q": "[SCENARIO] A company fails to publish details of its DPO on its website. Which obligation applies?",
    "options": [
      "Notice obligation",
      "Security obligation",
      "DPO disclosure obligation",
      "Consent withdrawal obligation"
    ],
    "answer": 2,
    "module": 4,
    "difficulty": "advanced"
  },
  {
    "q": "[SCENARIO] A fiduciary does not verify age before processing children’s data. Is this compliant?",
    "options": [
      "Yes, age verification is optional",
      "Only for social media",
      "No, reasonable verification is required",
      "Only for foreign platforms"
    ],
    "answer": 2,
    "module": 4,
    "difficulty": "advanced"
  },
  {
    "q": "[SCENARIO] A data fiduciary ignores DPB directions during inquiry. What is the implication?",
    "options": [
      "No impact",
      "Possible monetary penalty",
      "Only warning issued",
      "Only civil liability"
    ],
    "answer": 1,
    "module": 4,
    "difficulty": "advanced"
  },
  {
    "q": "[SCENARIO] A company does not document its data protection measures. Is this compliant?",
    "options": [
      "Yes, documentation is optional",
      "Only required after breach",
      "No, accountability requires documentation",
      "Only for government bodies"
    ],
    "answer": 2,
    "module": 4,
    "difficulty": "advanced"
  },
  {
    "q": "What is the penalty for failure to implement reasonable security safeguards?",
    "options": [
      "₹50 crore",
      "Up to ₹250 crore",
      "₹10 crore",
      "No specific penalty"
    ],
    "answer": 1,
    "module": 4,
    "difficulty": "intermediate"
  },
  {
    "q": "What is the penalty for failure to notify a breach to the Board or Data Principals?",
    "options": [
      "₹100 crore",
      "Up to ₹200 crore",
      "₹50 crore",
      "Warning only"
    ],
    "answer": 1,
    "module": 4,
    "difficulty": "intermediate"
  },
  {
    "q": "[SCENARIO] A healthcare provider suffers a ransomware attack exposing patient records but delays notification to the Board by 45 days fearing reputational damage. What are the consequences?",
    "options": [
      "Only a warning for first offense",
      "Penalty up to ₹200 crore for breach notification failure, plus penalties for security safeguard failures",
      "No consequence if data is eventually recovered",
      "Penalty waived if ransom is paid"
    ],
    "answer": 1,
    "module": 4,
    "difficulty": "advanced"
  },
  {
    "q": "What is the penalty for processing children's personal data in contravention of Section 9?",
    "options": [
      "₹50 crore",
      "Up to ₹200 crore",
      "₹100 crore",
      "Warning only"
    ],
    "answer": 1,
    "module": 4,
    "difficulty": "intermediate"
  },
  {
    "q": "Can criminal prosecution be initiated for DPDPA violations?",
    "options": [
      "Yes, for all violations",
      "No, DPDPA provides only civil penalties through the Board",
      "Only for breaches affecting > 1 million users",
      "Only if approved by Supreme Court"
    ],
    "answer": 1,
    "module": 4,
    "difficulty": "intermediate"
  },
  {
    "q": "What is the enforcement timeline prescribed in the DPDP Rules 2025?",
    "options": [
      "Immediate from notification date",
      "Sections 3-17 (core provisions) by May 13, 2027 (18 months)",
      "Full enforcement from January 1, 2030",
      "No specific timeline"
    ],
    "answer": 1,
    "module": 4,
    "difficulty": "intermediate"
  },
  {
    "q": "[SCENARIO] A startup incorporated in 2026 claims DPDPA doesn't apply to it because it wasn't registered when the Act was passed. Is this correct?",
    "options": [
      "Yes, only entities existing in 2023 are covered",
      "No, DPDPA applies to all entities processing personal data after enforcement dates, regardless of incorporation date",
      "Yes, 5-year grandfather clause exists",
      "Only if revenue exceeds threshold"
    ],
    "answer": 1,
    "module": 4,
    "difficulty": "advanced"
  },
  {
    "q": "In data mapping, what does RoPA stand for?",
    "options": [
      "Record of Processing Activities",
      "Register of Personal Attributes",
      "Record of Privacy Assessments",
      "Register of Processing Authorities"
    ],
    "answer": 0,
    "module": 5,
    "difficulty": "advanced"
  },
  {
    "q": "What are the 5 essential elements of valid consent under Section 6 of DPDPA?",
    "options": [
      "Written, Documented, Archived, Revocable, Specific",
      "Free, Specific, Informed, Unambiguous, Withdrawable",
      "Explicit, Granular, Time-bound, Renewable, Recorded",
      "Voluntary, Clear, Documented, Limited, Revocable"
    ],
    "answer": 1,
    "module": 5,
    "difficulty": "advanced"
  },
  {
    "q": "In a consent register, which of these fields is most critical for DPDPA compliance?",
    "options": [
      "IP address of user",
      "Timestamp and withdrawal capability",
      "Device fingerprint",
      "Browser type"
    ],
    "answer": 1,
    "module": 5,
    "difficulty": "advanced"
  },
  {
    "q": "[SCENARIO] You are building a consent management system for an e-commerce platform. Which feature is mandatory under DPDPA?",
    "options": [
      "Biometric authentication for consent",
      "Ability to withdraw consent as easily as it was given",
      "Consent valid for lifetime by default",
      "Consent stored only locally on user device"
    ],
    "answer": 1,
    "module": 5,
    "difficulty": "advanced"
  },
  {
    "q": "Under Rule 13, when is a Data Protection Impact Assessment (DPIA) mandatory?",
    "options": [
      "For all data processing activities",
      "Only for cross-border transfers",
      "For Significant Data Fiduciaries processing certain data",
      "When processing more than 1 million records"
    ],
    "answer": 2,
    "module": 5,
    "difficulty": "advanced"
  },
  {
    "q": "In a risk assessment matrix, what is typically a 'High Risk' score range?",
    "options": [
      "1-4",
      "5-9",
      "10-15",
      "16-25"
    ],
    "answer": 2,
    "module": 5,
    "difficulty": "advanced"
  },
  {
    "q": "[SCENARIO] A company fails to implement reasonable security safeguards leading to a major breach. What is the likely consequence under DPDPA?",
    "options": [
      "Criminal prosecution of directors",
      "Warning only",
      "Monetary penalty imposed by the Data Protection Board",
      "Immediate shutdown of business"
    ],
    "answer": 2,
    "module": 5,
    "difficulty": "advanced"
  },
  {
    "q": "[SCENARIO] A data fiduciary repeatedly ignores directions issued by the Data Protection Board. What action can be taken?",
    "options": [
      "Only advisory notice",
      "Imposition of monetary penalty",
      "Civil imprisonment",
      "Automatic license cancellation"
    ],
    "answer": 1,
    "module": 5,
    "difficulty": "advanced"
  },
  {
    "q": "[SCENARIO] A Significant Data Fiduciary fails to appoint a Data Protection Officer despite notification. What follows?",
    "options": [
      "No action unless breach occurs",
      "Only public warning",
      "Penalty as prescribed under the Act",
      "Criminal FIR registration"
    ],
    "answer": 2,
    "module": 5,
    "difficulty": "advanced"
  },
  {
    "q": "[SCENARIO] A company delays breach notification causing harm to users. Which enforcement mechanism applies?",
    "options": [
      "Adjudication by Data Protection Board",
      "Civil court suit only",
      "Criminal prosecution under IPC",
      "Consumer court action"
    ],
    "answer": 0,
    "module": 5,
    "difficulty": "advanced"
  },
  {
    "q": "[SCENARIO] A data fiduciary violates multiple provisions in a single incident. How are penalties determined?",
    "options": [
      "One penalty per incident",
      "Highest penalty only",
      "Separate penalties for each violation",
      "No penalty for first offence"
    ],
    "answer": 2,
    "module": 5,
    "difficulty": "advanced"
  },
  {
    "q": "[SCENARIO] A startup argues inability to pay penalty due to financial hardship. Is this a valid defence?",
    "options": [
      "Yes, hardship exempts liability",
      "Only for MSMEs",
      "No, financial status does not negate liability",
      "Only for first-time offenders"
    ],
    "answer": 2,
    "module": 5,
    "difficulty": "advanced"
  },
  {
    "q": "[SCENARIO] A company challenges a penalty imposed by the Data Protection Board. Where can it appeal?",
    "options": [
      "High Court directly",
      "Supreme Court",
      "Telecom Disputes Settlement Appellate Tribunal",
      "Consumer Forum"
    ],
    "answer": 2,
    "module": 5,
    "difficulty": "advanced"
  },
  {
    "q": "[SCENARIO] A data fiduciary provides false information during a DPB inquiry. What is the consequence?",
    "options": [
      "No consequence",
      "Reduced penalty",
      "Higher penalty for non-cooperation",
      "Only written warning"
    ],
    "answer": 2,
    "module": 5,
    "difficulty": "advanced"
  },
  {
    "q": "[SCENARIO] A breach occurs despite best security measures. Is penalty automatic?",
    "options": [
      "Yes, strict liability applies",
      "No, DPB considers mitigating factors",
      "Only for significant fiduciaries",
      "Only if harm is proven"
    ],
    "answer": 1,
    "module": 5,
    "difficulty": "advanced"
  },
  {
    "q": "[SCENARIO] A company fails to comply with DPB summons. What power does the Board have?",
    "options": [
      "Arrest powers",
      "Impose monetary penalty",
      "Issue criminal warrant",
      "Cancel company registration"
    ],
    "answer": 1,
    "module": 5,
    "difficulty": "advanced"
  },
  {
    "q": "[SCENARIO] Can compensation be awarded to Data Principals under DPDPA?",
    "options": [
      "Yes, by the DPB",
      "Yes, by civil courts",
      "No, DPDPA provides penalties, not compensation",
      "Only by Supreme Court"
    ],
    "answer": 2,
    "module": 5,
    "difficulty": "advanced"
  },
  {
    "q": "[SCENARIO] A company commits the same violation multiple times. How does DPB respond?",
    "options": [
      "Issue only warnings",
      "Ignore repeat offences",
      "Consider aggravating factors for higher penalty",
      "Bar business operations permanently"
    ],
    "answer": 2,
    "module": 5,
    "difficulty": "advanced"
  },
  {
    "q": "[SCENARIO] A fiduciary claims lack of awareness of DPDPA provisions. Is ignorance a defence?",
    "options": [
      "Yes, for first year",
      "Only for small companies",
      "No, ignorance of law is not a defence",
      "Only if disclosure was absent"
    ],
    "answer": 2,
    "module": 5,
    "difficulty": "advanced"
  },
  {
    "q": "[SCENARIO] A data processor is responsible for breach caused by its negligence. Who is penalised?",
    "options": [
      "Only processor",
      "Only fiduciary",
      "Both may be held accountable",
      "Neither"
    ],
    "answer": 2,
    "module": 5,
    "difficulty": "advanced"
  },
  {
    "q": "[SCENARIO] What is the maximum penalty that can be imposed under DPDPA?",
    "options": [
      "₹100 crore",
      "₹250 crore",
      "₹500 crore",
      "Unlimited"
    ],
    "answer": 2,
    "module": 5,
    "difficulty": "advanced"
  },
  {
    "q": "[SCENARIO] Can DPB initiate action without a complaint from a Data Principal?",
    "options": [
      "No, complaint is mandatory",
      "Yes, Board can act suo motu",
      "Only with court direction",
      "Only for government entities"
    ],
    "answer": 1,
    "module": 5,
    "difficulty": "advanced"
  },
  {
    "q": "[SCENARIO] A company settles grievance but violation already occurred. Can DPB still impose penalty?",
    "options": [
      "No, settlement bars penalty",
      "Only if user insists",
      "Yes, regulatory action is independent",
      "Only for significant fiduciaries"
    ],
    "answer": 2,
    "module": 5,
    "difficulty": "advanced"
  },
  {
    "q": "[SCENARIO] A fiduciary voluntarily reports a breach promptly. How does DPB treat this?",
    "options": [
      "Mandatory maximum penalty",
      "No inquiry conducted",
      "As a mitigating factor",
      "As an admission of guilt only"
    ],
    "answer": 2,
    "module": 5,
    "difficulty": "advanced"
  },
  {
    "q": "[SCENARIO] A company fails to pay imposed penalty within stipulated time. What can follow?",
    "options": [
      "No further action",
      "Recovery proceedings as per law",
      "Automatic imprisonment",
      "Immediate shutdown"
    ],
    "answer": 1,
    "module": 5,
    "difficulty": "advanced"
  },
  {
    "q": "[SCENARIO] A Data Principal files a frivolous complaint. What power does DPB have?",
    "options": [
      "Ignore complaint",
      "Penalise the Data Principal",
      "Refer matter to police",
      "Mandate mediation"
    ],
    "answer": 1,
    "module": 5,
    "difficulty": "advanced"
  },
  {
    "q": "In the DPIA process, what comes immediately after 'Risk Identification'?",
    "options": [
      "Documentation & Review",
      "Mitigation Design",
      "Risk Assessment",
      "Compliance Check"
    ],
    "answer": 2,
    "module": 5,
    "difficulty": "advanced"
  },
  {
    "q": "[SCENARIO] Your company wants to implement a new employee monitoring system using AI-powered cameras. Before deployment, what should you conduct?",
    "options": [
      "Market research only",
      "Data Protection Impact Assessment (DPIA) to evaluate privacy risks",
      "Financial feasibility study only",
      "No assessment needed if employees are informed"
    ],
    "answer": 1,
    "module": 5,
    "difficulty": "advanced"
  },
  {
    "q": "Under Section 8(6), when must a Data Fiduciary notify Data Principals about a breach?",
    "options": [
      "Always, within 72 hours",
      "Only if harm is likely to be caused",
      "Never, only the Board needs notification",
      "Within 30 days in all cases"
    ],
    "answer": 0,
    "module": 5,
    "difficulty": "advanced"
  },
  {
    "q": "What is the first phase in the 6-phase incident response lifecycle?",
    "options": [
      "Containment",
      "Detection & Identification",
      "Assessment & Triage",
      "Eradication & Recovery"
    ],
    "answer": 1,
    "module": 5,
    "difficulty": "advanced"
  },
  {
    "q": "Under Rule 6, what characteristics must security safeguards have?",
    "options": [
      "Expensive and complex",
      "Comprehensive, appropriate, effective, and documented",
      "Outsourced to third parties",
      "Annual review only"
    ],
    "answer": 1,
    "module": 5,
    "difficulty": "advanced"
  },
  {
    "q": "Which encryption standard is recommended for data at rest?",
    "options": [
      "DES",
      "MD5",
      "AES-256",
      "SHA-1"
    ],
    "answer": 2,
    "module": 5,
    "difficulty": "advanced"
  },
  {
    "q": "[SCENARIO] Your database containing 500,000 customer records is stored without encryption. A disgruntled employee copies it to a USB drive. What DPDPA violations occurred?",
    "options": [
      "None, employee theft is not covered",
      "Failure to implement reasonable security safeguards (Section 8(5)) - penalty up to ₹250 crore",
      "Only breach notification failure",
      "No violation if data is recovered"
    ],
    "answer": 1,
    "module": 5,
    "difficulty": "advanced"
  },
  {
    "q": "According to Section 8(8), who is accountable for Data Processors?",
    "options": [
      "The Data Processor themselves",
      "The Data Protection Board",
      "The Data Fiduciary",
      "The Data Principal"
    ],
    "answer": 2,
    "module": 5,
    "difficulty": "advanced"
  },
  {
    "q": "What are the 3 most essential clauses in a Data Processing Agreement (DPA)?",
    "options": [
      "Payment terms, SLAs, Termination",
      "Scope of Processing, Processor Obligations, Data Return/Deletion",
      "Insurance, Indemnity, Warranties",
      "Audit rights, Penalties, Force majeure"
    ],
    "answer": 1,
    "module": 5,
    "difficulty": "advanced"
  },
  {
    "q": "In vendor risk tiering, which tier requires SOC 2 Type II compliance?",
    "options": [
      "Low tier vendors",
      "Medium tier vendors",
      "High tier vendors",
      "Critical tier vendors"
    ],
    "answer": 3,
    "module": 5,
    "difficulty": "advanced"
  },
  {
    "q": "[SCENARIO] You're selecting a cloud vendor to process sensitive customer data. The vendor has ISO 27001 but no SOC 2. What should you do?",
    "options": [
      "Proceed, ISO 27001 is sufficient",
      "Request SOC 2 Type II certification OR conduct detailed security assessment before onboarding",
      "Reject immediately",
      "No security requirements needed for cloud vendors"
    ],
    "answer": 1,
    "module": 5,
    "difficulty": "advanced"
  },
  {
    "q": "What is the recommended frequency for reviewing access controls?",
    "options": [
      "Monthly",
      "Quarterly",
      "Annually",
      "Only when incidents occur"
    ],
    "answer": 1,
    "module": 5,
    "difficulty": "advanced"
  },
  {
    "q": "What is 'Machine Unlearning' in the context of Data Principal rights?",
    "options": [
      "Deleting AI models completely",
      "Removing specific data's influence from trained models",
      "Preventing AI from learning new data",
      "Disabling machine learning features"
    ],
    "answer": 1,
    "module": 5,
    "difficulty": "advanced"
  },
  {
    "q": "What does 'Technical Safeguard' encompass in the context of Rule 6?",
    "options": [
      "Only firewall and antivirus",
      "Encryption, access control, network security, logging, data masking, backup",
      "Physical security measures only",
      "Employee training programs"
    ],
    "answer": 1,
    "module": 5,
    "difficulty": "advanced"
  },
  {
    "q": "In the AI lifecycle under DPDPA, how many stages are typically identified?",
    "options": [
      "4 stages",
      "6 stages",
      "8 stages",
      "10 stages"
    ],
    "answer": 2,
    "module": 6,
    "difficulty": "advanced"
  },
  {
    "q": "What is the core challenge of applying DPDPA's data minimization principle to AI systems?",
    "options": [
      "AI doesn't use personal data",
      "Tension between 'more data = better models' and 'collect only necessary data'",
      "AI systems are exempt from minimization",
      "Minimization only applies to training, not inference"
    ],
    "answer": 1,
    "module": 6,
    "difficulty": "advanced"
  },
  {
    "q": "Which privacy-preserving ML technique allows training models without centralizing raw data?",
    "options": [
      "Differential Privacy",
      "Federated Learning",
      "Homomorphic Encryption",
      "Synthetic Data Generation"
    ],
    "answer": 1,
    "module": 6,
    "difficulty": "advanced"
  },
  {
    "q": "What does k-anonymity achieve in ML training data?",
    "options": [
      "Encrypts all data fields",
      "Ensures each group has at least k individuals, making re-identification difficult",
      "Removes all identifiers completely",
      "Adds random noise to data"
    ],
    "answer": 1,
    "module": 6,
    "difficulty": "advanced"
  },
  {
    "q": "[SCENARIO] A hospital wants to train an AI model for disease prediction using patient records. Under DPDPA, what is the compliance pathway?",
    "options": [
      "Can use data freely for medical research",
      "Must obtain explicit consent OR use anonymized data OR rely on legitimate medical purpose exemption with safeguards",
      "AI training is completely prohibited for medical data",
      "No restrictions for hospitals"
    ],
    "answer": 1,
    "module": 6,
    "difficulty": "advanced"
  },
  {
    "q": "When is consent required for AI processing under DPDPA?",
    "options": [
      "Always, for any AI use",
      "Never, AI is exempt",
      "For non-essential AI like marketing/profiling, but not for fraud detection",
      "Only for AI using biometric data"
    ],
    "answer": 2,
    "module": 6,
    "difficulty": "advanced"
  },
  {
    "q": "What must be included in AI transparency notices to Data Principals?",
    "options": [
      "Complete source code of the algorithm",
      "Meaningful information about logic, significance, and consequences",
      "Only that AI is used, no details needed",
      "Mathematical formulas of the model"
    ],
    "answer": 1,
    "module": 6,
    "difficulty": "advanced"
  },
  {
    "q": "Which type of AI bias results from training data reflecting past discrimination?",
    "options": [
      "Measurement Bias",
      "Historical Bias",
      "Aggregation Bias",
      "Evaluation Bias"
    ],
    "answer": 1,
    "module": 6,
    "difficulty": "advanced"
  },
  {
    "q": "What does 'Demographic Parity' mean in algorithmic fairness?",
    "options": [
      "All demographics must be represented in training data",
      "Positive outcome rate is equal across groups",
      "AI must never use demographic data",
      "Models must be retrained for each demographic"
    ],
    "answer": 1,
    "module": 6,
    "difficulty": "advanced"
  },
  {
    "q": "[SCENARIO] Your AI-powered loan approval system approves 70% of male applicants but only 45% of equally qualified female applicants. What DPDPA issue exists?",
    "options": [
      "None, AI decisions are objective",
      "Violates accuracy obligation (Section 8(3)) due to algorithmic bias creating unfair outcomes",
      "Only an issue if explicitly programmed",
      "Acceptable if disclosed to users"
    ],
    "answer": 1,
    "module": 6,
    "difficulty": "advanced"
  },
  {
    "q": "What is LIME in the context of Explainable AI (XAI)?",
    "options": [
      "Legal Information Management Engine",
      "Local Interpretable Model-agnostic Explanations",
      "Limited Information Minimal Exposure",
      "Layered Intelligence Model Engine"
    ],
    "answer": 1,
    "module": 6,
    "difficulty": "advanced"
  },
  {
    "q": "Under Section 8(3), why is accuracy particularly important for AI systems?",
    "options": [
      "It's not, AI is exempt from accuracy requirements",
      "Biased training data violates accuracy obligation; inaccurate data leads to unfair AI decisions",
      "Accuracy only matters for traditional databases",
      "AI systems self-correct so accuracy isn't a concern"
    ],
    "answer": 1,
    "module": 6,
    "difficulty": "advanced"
  },
  {
    "q": "What is a 'Model Extraction Attack'?",
    "options": [
      "Physically stealing servers containing models",
      "Querying a model repeatedly to reconstruct it and steal IP/data insights",
      "Extracting features from raw data",
      "Removing trained models from production"
    ],
    "answer": 1,
    "module": 6,
    "difficulty": "advanced"
  },
  {
    "q": "[SCENARIO] Your company uses ChatGPT (free version) and employees paste customer emails with personal data for summarization. What is the DPDPA issue?",
    "options": [
      "No issue, ChatGPT is a tool like email",
      "Unauthorized third-party data transfer without consent or DPA; personal data sent to OpenAI",
      "Issue only if sensitive personal data is involved",
      "OpenAI is a Data Fiduciary so no concern"
    ],
    "answer": 1,
    "module": 6,
    "difficulty": "advanced"
  },
  {
    "q": "What is the purpose of an 'AI Model Card'?",
    "options": [
      "Payment card for AI services",
      "Standardized documentation of model's purpose, training data, performance, and limitations",
      "Business card for AI developers",
      "Credit scoring card generated by AI"
    ],
    "answer": 1,
    "module": 6,
    "difficulty": "advanced"
  },
  {
    "q": "Under EU AI Act risk classification, which AI systems are prohibited (Unacceptable Risk)?",
    "options": [
      "All AI systems in healthcare",
      "Social scoring by governments, subliminal manipulation",
      "Any AI using personal data",
      "AI systems without human oversight"
    ],
    "answer": 1,
    "module": 6,
    "difficulty": "advanced"
  },
  {
    "q": "What does 'Differential Privacy' add to data/models?",
    "options": [
      "Encryption",
      "Carefully calibrated noise to prevent identification of individuals",
      "Access controls",
      "Watermarks"
    ],
    "answer": 1,
    "module": 6,
    "difficulty": "advanced"
  },
  {
    "q": "If a Data Principal exercises right to erasure, what challenge does this pose for AI?",
    "options": [
      "No challenge, just delete from database",
      "Need to remove data's influence from already-trained models (machine unlearning)",
      "Can ignore since AI is exempt",
      "Only affects future model training"
    ],
    "answer": 1,
    "module": 6,
    "difficulty": "advanced"
  },
  {
    "q": "[SCENARIO] A fintech uses AI to predict loan defaults. A customer requests erasure of their data. The company says AI models can't be modified. Is this acceptable?",
    "options": [
      "Yes, technical impossibility is a valid excuse",
      "No, must implement machine unlearning OR retrain model OR cease using that model for the individual",
      "Yes, if mentioned in privacy policy",
      "Only acceptable for older models"
    ],
    "answer": 1,
    "module": 6,
    "difficulty": "advanced"
  },
  {
    "q": "What is 'prompt engineering for privacy' in the context of GenAI?",
    "options": [
      "Making prompts longer to confuse AI",
      "Designing prompts that don't include personal data while still achieving the goal",
      "Encrypting prompts before sending",
      "Only using AI in private mode"
    ],
    "answer": 1,
    "module": 6,
    "difficulty": "advanced"
  }
];
