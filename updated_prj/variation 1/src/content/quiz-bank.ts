// DPDP quiz question bank with per-question difficulty
// (basic/intermediate/advanced).
import type { QuizQuestion } from "./learn";

export const QUIZ_BANK: QuizQuestion[] = [
  {
    "q": "What does DPDPA stand for?",
    "options": [
      "Digital Personal Data Privacy Act",
      "Digital Personal Data Protection Act",
      "Data Protection and Digital Privacy Act",
      "Digital Privacy Data Protection Act"
    ],
    "answer": 1,
    "explanation": "DPDPA stands for Digital Personal Data Protection Act, 2023. This is India's primary legislation for data protection enacted to regulate the processing of digital personal data. (Reference: DPDPA 2023, Title)",
    "difficulty": "basic"
  },
  {
    "q": "When did the Digital Personal Data Protection Act receive Presidential assent?",
    "options": [
      "August 11, 2022",
      "August 11, 2023",
      "December 15, 2023",
      "January 1, 2024"
    ],
    "answer": 1,
    "explanation": "The DPDPA received Presidential assent on August 11, 2023, marking a significant milestone in India's data protection framework. (Reference: DPDPA 2023, Enactment Date)",
    "difficulty": "basic"
  },
  {
    "q": "Who is a 'Data Fiduciary' under DPDPA?",
    "options": [
      "Any person whose data is being processed",
      "Any person who processes personal data",
      "Any person who alone or in conjunction with others determines the purpose and means of processing personal data",
      "Only government entities processing data"
    ],
    "answer": 2,
    "explanation": "Section 2(i) defines Data Fiduciary as any person who alone or in conjunction with others determines the purpose and means of processing of personal data. This includes both public and private entities that control data processing activities. (Reference: Section 2(i), DPDPA 2023)",
    "difficulty": "basic"
  },
  {
    "q": "What is a 'Data Principal' according to DPDPA?",
    "options": [
      "The head of the Data Protection Board",
      "The Chief Technology Officer of a company",
      "The individual to whom the personal data relates",
      "The Data Protection Officer"
    ],
    "answer": 2,
    "explanation": "Section 2(j) defines Data Principal as the individual to whom the personal data relates. The Data Principal is the person whose data is being processed and who has rights under the Act. (Reference: Section 2(j), DPDPA 2023)",
    "difficulty": "basic"
  },
  {
    "q": "How many sections does the DPDPA 2023 contain?",
    "options": [
      "25 sections",
      "44 sections",
      "60 sections",
      "100 sections"
    ],
    "answer": 1,
    "explanation": "The Digital Personal Data Protection Act, 2023 is a compact legislation containing 44 sections organized across multiple chapters covering various aspects of data protection. (Reference: DPDPA 2023, Structure)",
    "difficulty": "basic"
  },
  {
    "q": "What is the territorial scope of DPDPA?",
    "options": [
      "Only applies within India",
      "Applies to processing within India and offering goods/services to Data Principals in India",
      "Only applies to Indian citizens",
      "Applies globally without restrictions"
    ],
    "answer": 1,
    "explanation": "Section 3 provides extraterritorial application: DPDPA applies to processing of digital personal data within India and also to processing outside India if it's in connection with any activity related to offering goods or services to Data Principals within India. (Reference: Section 3, DPDPA 2023)",
    "difficulty": "basic"
  },
  {
    "q": "What is 'Personal Data' under DPDPA?",
    "options": [
      "Only biometric information",
      "Data about legal entities",
      "Data about an individual who is identifiable by or in relation to such data",
      "Only financial information"
    ],
    "answer": 2,
    "explanation": "Section 2(t) defines Personal Data as data about an individual who is identifiable by or in relation to such data. This is a broad definition covering any data that can identify a natural person. (Reference: Section 2(t), DPDPA 2023)",
    "difficulty": "basic"
  },
  {
    "q": "Who is the central authority responsible for enforcement of DPDPA?",
    "options": [
      "Supreme Court of India",
      "Ministry of Electronics and Information Technology",
      "Data Protection Board of India",
      "CERT-In"
    ],
    "answer": 2,
    "explanation": "Chapter VII establishes the Data Protection Board of India as the independent authority responsible for monitoring and enforcing compliance with the provisions of DPDPA. The Board has adjudicatory and regulatory powers. (Reference: Section 18, Chapter VII, DPDPA 2023)",
    "difficulty": "basic"
  },
  {
    "q": "What is meant by 'processing' of personal data?",
    "options": [
      "Only storing data",
      "Only sharing data",
      "A wholly or partly automated operation or set of operations performed on digital personal data",
      "Only deleting data"
    ],
    "answer": 2,
    "explanation": "Section 2(u) defines Processing as a wholly or partly automated operation or set of operations performed on digital personal data, including collection, recording, organization, structuring, storage, adaptation, retrieval, use, alignment, disclosure, erasure, or destruction. (Reference: Section 2(u), DPDPA 2023)",
    "difficulty": "basic"
  },
  {
    "q": "Can DPDPA apply to non-automated processing of personal data?",
    "options": [
      "Yes, it applies to all personal data processing",
      "No, it only applies to digital personal data",
      "Yes, but only for government entities",
      "It depends on the sector"
    ],
    "answer": 1,
    "explanation": "DPDPA specifically applies to 'digital personal data' which means personal data in digitized form. The Act does not regulate manual or non-automated processing of data unless it's part of a filing system. This is a key distinction from GDPR. (Reference: Section 2(h), Section 3, DPDPA 2023)",
    "difficulty": "basic"
  },
  {
    "q": "Which of the following is NOT a ground for processing personal data under DPDPA?",
    "options": [
      "Consent of the Data Principal",
      "For certain legitimate uses",
      "Commercial interests of the Data Fiduciary",
      "For compliance with any law"
    ],
    "answer": 2,
    "explanation": "Section 6 specifies lawful grounds for processing including consent, legitimate uses, and legal compliance. However, 'commercial interests' alone is not a lawful ground. Processing must be based on consent or fall within specified legitimate purposes defined in Section 7. (Reference: Section 6, DPDPA 2023)",
    "difficulty": "intermediate"
  },
  {
    "q": "What are the essential characteristics of valid consent under DPDPA?",
    "options": [
      "Free and specific",
      "Free, specific, informed, unconditional and unambiguous",
      "Written and notarized",
      "Verbal or written"
    ],
    "answer": 1,
    "explanation": "Section 6(1) mandates that consent must be free, specific, informed, unconditional, and unambiguous with a clear affirmative action. This ensures Data Principals have genuine control. Bundled or coerced consent is invalid under this framework. (Reference: Section 6(1), DPDPA 2023)",
    "difficulty": "intermediate"
  },
  {
    "q": "Can a Data Principal withdraw consent once given?",
    "options": [
      "No, consent is irrevocable",
      "Yes, and it should be as easy as giving consent",
      "Only with written application to Data Protection Board",
      "Only if Data Fiduciary agrees"
    ],
    "answer": 1,
    "explanation": "Section 6(3) provides that withdrawal of consent shall be as easy as giving consent, ensuring Data Principals maintain continuous control over their data. However, withdrawal doesn't affect lawfulness of processing done before withdrawal. (Reference: Section 6(3), DPDPA 2023)",
    "difficulty": "intermediate"
  },
  {
    "q": "Which right allows a Data Principal to correct inaccurate personal data?",
    "options": [
      "Right to information",
      "Right to correction and erasure",
      "Right to data portability",
      "Right to grievance redressal"
    ],
    "answer": 1,
    "explanation": "Section 12 provides Data Principals the right to correction of inaccurate or misleading personal data and completion of incomplete personal data, as well as erasure of personal data when retention is no longer necessary or consent is withdrawn. (Reference: Section 12, DPDPA 2023)",
    "difficulty": "intermediate"
  },
  {
    "q": "What must a Data Fiduciary do when processing children's data?",
    "options": [
      "No special obligations",
      "Obtain verifiable consent of parent or lawful guardian",
      "Only process for educational purposes",
      "Register with the Data Protection Board"
    ],
    "answer": 1,
    "explanation": "Section 9 mandates that Data Fiduciaries must obtain verifiable consent of parents or lawful guardians before processing children's data. The government may specify age thresholds and exempt certain categories of Data Fiduciaries from this requirement. (Reference: Section 9, DPDPA 2023)",
    "difficulty": "intermediate"
  },
  {
    "q": "What is the maximum penalty for non-compliance with Data Protection Board directions?",
    "options": [
      "₹50 crore",
      "₹100 crore",
      "₹200 crore",
      "₹250 crore"
    ],
    "answer": 3,
    "explanation": "Section 33(1) prescribes that Data Fiduciaries failing to comply with Board directions may face penalties up to ₹250 crore. This represents the highest category of penalties under DPDPA, reflecting the seriousness of non-compliance with regulatory orders. (Reference: Section 33(1), DPDPA 2023)",
    "difficulty": "intermediate"
  },
  {
    "q": "Who can file a complaint with the Data Protection Board?",
    "options": [
      "Only lawyers",
      "Only Data Principals affected",
      "Any Data Principal or any person authorized by Data Principal",
      "Only NGOs and civil society organizations"
    ],
    "answer": 2,
    "explanation": "Section 17 permits any Data Principal or any person authorized by the Data Principal to file a complaint with the Board regarding violation of provisions of the Act. This ensures accessibility to grievance mechanisms. (Reference: Section 17, DPDPA 2023)",
    "difficulty": "intermediate"
  },
  {
    "q": "What is the purpose limitation principle under DPDPA?",
    "options": [
      "Data can be used for any purpose",
      "Personal data should be processed only for specified, clear, and lawful purposes",
      "Data processing has time limitations",
      "Only specific sectors can process data"
    ],
    "answer": 1,
    "explanation": "Section 8(2) embodies the purpose limitation principle requiring Data Fiduciaries to process personal data only for purposes that are clear and specified. Further processing must be compatible with the original purpose or require fresh consent. (Reference: Section 8(2), DPDPA 2023)",
    "difficulty": "intermediate"
  },
  {
    "q": "What is a 'Data Processor' under DPDPA?",
    "options": [
      "Same as Data Fiduciary",
      "Any person who processes personal data on behalf of a Data Fiduciary",
      "The Data Protection Board",
      "A hardware device that processes data"
    ],
    "answer": 1,
    "explanation": "Section 2(k) defines Data Processor as any person who processes personal data on behalf of a Data Fiduciary. Processors act on instructions from Fiduciaries and have their own set of obligations under Section 8. (Reference: Section 2(k), Section 8(6), DPDPA 2023)",
    "difficulty": "intermediate"
  },
  {
    "q": "How long can a Data Fiduciary retain personal data?",
    "options": [
      "Indefinitely",
      "Maximum 5 years",
      "Only for as long as necessary for the specified purpose or as required by law",
      "Until Data Principal withdraws consent"
    ],
    "answer": 2,
    "explanation": "Section 8(5) requires that personal data shall not be retained beyond the period necessary to satisfy the purpose for which it is processed, unless required by law. This storage limitation principle prevents indefinite data hoarding. (Reference: Section 8(5), DPDPA 2023)",
    "difficulty": "intermediate"
  },
  {
    "q": "What is a 'Significant Data Fiduciary' and who determines this classification?",
    "options": [
      "Any Data Fiduciary processing more than 1 lakh data subjects",
      "Data Fiduciaries designated by the Central Government based on specific factors",
      "Only government departments",
      "Data Fiduciaries who have faced penalties"
    ],
    "answer": 1,
    "explanation": "Section 10 empowers the Central Government to notify certain Data Fiduciaries as Significant Data Fiduciaries based on factors like volume and sensitivity of data, risk to rights of Data Principals, potential impact on sovereignty and integrity of India, among others. These entities face enhanced obligations. (Reference: Section 10, DPDPA 2023)",
    "difficulty": "advanced"
  },
  {
    "q": "What additional obligations do Significant Data Fiduciaries have?",
    "options": [
      "Only higher penalties",
      "Must appoint a Data Protection Officer, conduct periodic audits, and conduct Data Protection Impact Assessments",
      "Must relocate servers to India",
      "Must obtain annual certification"
    ],
    "answer": 1,
    "explanation": "Section 10(3) mandates that Significant Data Fiduciaries must: (a) appoint a Data Protection Officer; (b) appoint an independent data auditor; (c) conduct periodic Data Protection Impact Assessments; and (d) undertake other measures as may be prescribed. These enhanced obligations reflect greater responsibility. (Reference: Section 10(3), DPDPA 2023)",
    "difficulty": "advanced"
  },
  {
    "q": "Under what circumstances can personal data be processed without consent?",
    "options": [
      "Never, consent is always mandatory",
      "For specified legitimate uses including state functions, legal obligations, employment, medical emergency, etc.",
      "Whenever commercially necessary",
      "Only with court orders"
    ],
    "answer": 1,
    "explanation": "Section 7 lists legitimate uses where consent is not required, including: voluntary provision by Data Principal, functions of the State, legal rights/claims, employment purposes, medical emergency, disaster management, public health, research, and certain specified purposes. Each has specific conditions. (Reference: Section 7, DPDPA 2023)",
    "difficulty": "advanced"
  },
  {
    "q": "What is the consequence if a Data Fiduciary fails to implement reasonable security safeguards?",
    "options": [
      "Warning only",
      "₹50 crore penalty",
      "₹250 crore penalty",
      "₹10,000 penalty"
    ],
    "answer": 2,
    "explanation": "Section 33(2) specifies penalties up to ₹250 crore for failure to implement reasonable security safeguards under Section 8(4). However, Section 33(2) itemizes specific violations with ₹50 crore penalties, while Section 33(3) provides for ₹200 crore penalties for breach of children's data obligations. (Reference: Section 33(2), DPDPA 2023)",
    "difficulty": "advanced"
  },
  {
    "q": "Can the Central Government exempt certain Data Fiduciaries from DPDPA provisions?",
    "options": [
      "No, the Act applies universally without exemptions",
      "Yes, in the interests of sovereignty, security, public order, or friendly relations with foreign states",
      "Only with parliamentary approval",
      "Only for temporary periods not exceeding 6 months"
    ],
    "answer": 1,
    "explanation": "Section 17 empowers the Central Government to exempt any instrumentality of the State from provisions of the Act in the interests of sovereignty and integrity of India, security of the State, friendly relations with foreign states, maintenance of public order, or preventing incitement to any cognizable offense. These exemptions are subject to procedural safeguards. (Reference: Section 17, DPDPA 2023)",
    "difficulty": "advanced"
  },
  {
    "q": "What is the time limit for Data Fiduciaries to respond to Data Principal rights requests?",
    "options": [
      "7 days",
      "As may be prescribed, considering volume and complexity",
      "30 days",
      "No time limit specified"
    ],
    "answer": 1,
    "explanation": "While the Act doesn't specify exact timelines in the statute itself, Section 8(9) requires Data Fiduciaries to address grievances and respond to requests in such manner and within such period as may be prescribed by rules. The DPDP Rules 2025 specify detailed timelines. (Reference: Section 8(9), DPDPA 2023; DPDP Rules 2025)",
    "difficulty": "advanced"
  },
  {
    "q": "What happens if there is a personal data breach?",
    "options": [
      "No obligations on Data Fiduciary",
      "Data Fiduciary must notify the Board and affected Data Principals as prescribed",
      "Only notify if more than 10,000 users affected",
      "Only criminal liability"
    ],
    "answer": 1,
    "explanation": "Section 8(7) mandates that in case of a personal data breach, the Data Fiduciary shall give the Board and each affected Data Principal intimation of such breach in such form and manner as may be prescribed. This ensures transparency and enables affected individuals to take protective measures. (Reference: Section 8(7), DPDPA 2023)",
    "difficulty": "advanced"
  },
  {
    "q": "Does DPDPA create a right to be forgotten?",
    "options": [
      "Yes, explicitly mentioned",
      "No such right exists",
      "Indirectly through right to erasure when retention is no longer necessary",
      "Only for minors"
    ],
    "answer": 2,
    "explanation": "Section 12 provides a right to correction and erasure. While not explicitly termed 'right to be forgotten' like GDPR Article 17, the erasure right applies when retention is no longer necessary for the specified purpose or consent is withdrawn, achieving a similar outcome with Indian context. (Reference: Section 12, DPDPA 2023)",
    "difficulty": "advanced"
  },
  {
    "q": "What is the composition of the Data Protection Board of India?",
    "options": [
      "One Chairperson only",
      "Chairperson and members as prescribed by Central Government",
      "Chairperson and 10 members",
      "Chairperson, State representatives, and industry members"
    ],
    "answer": 1,
    "explanation": "Section 19 establishes that the Board shall consist of a Chairperson and such number of members as the Central Government may prescribe. The qualification, appointment, tenure, and conditions of service are to be prescribed, ensuring appropriate expertise and independence. (Reference: Section 19, DPDPA 2023)",
    "difficulty": "advanced"
  },
  {
    "q": "Can decisions of the Data Protection Board be appealed?",
    "options": [
      "No appeals allowed",
      "Yes, to Supreme Court only",
      "Yes, to Telecom Disputes Settlement and Appellate Tribunal (TDSAT)",
      "Yes, to High Court"
    ],
    "answer": 2,
    "explanation": "Section 29 provides that any person aggrieved by a decision or order of the Board may file an appeal to the Telecom Disputes Settlement and Appellate Tribunal. This ensures judicial oversight while leveraging existing specialized tribunals familiar with digital economy issues. (Reference: Section 29, DPDPA 2023)",
    "difficulty": "advanced"
  },
  {
    "q": "What is meant by 'verifiable consent' for children's data?",
    "options": [
      "Any consent from the child",
      "Consent that ensures reasonable verification of the identity and age of parent/guardian",
      "Notarized consent",
      "Consent via Aadhaar authentication"
    ],
    "answer": 1,
    "explanation": "Section 9 requires 'verifiable consent of parents or lawful guardian' meaning the Data Fiduciary must implement reasonable methods to verify the identity and relationship of the person providing consent, ensuring genuine parental authorization before processing children's data. (Reference: Section 9, DPDPA 2023)",
    "difficulty": "intermediate"
  },
  {
    "q": "Is there a data localization requirement under DPDPA?",
    "options": [
      "Yes, all data must be stored in India",
      "No restriction on data transfer",
      "Government may restrict transfer to certain countries",
      "Only financial data must be localized"
    ],
    "answer": 2,
    "explanation": "Section 16 empowers the Central Government to restrict transfer of personal data by a Data Fiduciary to certain countries or territories. Unlike earlier drafts, DPDPA doesn't mandate blanket data localization but gives government power to restrict based on specific concerns. (Reference: Section 16, DPDPA 2023)",
    "difficulty": "intermediate"
  },
  {
    "q": "What is the penalty for Data Principals providing false information?",
    "options": [
      "No penalty on Data Principals",
      "₹10,000 per default",
      "₹1 lakh",
      "Criminal prosecution"
    ],
    "answer": 1,
    "explanation": "Section 35 uniquely imposes obligations on Data Principals not to impersonate others, suppress material information, or register false complaints. Violation may result in penalty up to ₹10,000 per default, balancing rights with responsibilities. (Reference: Section 35, DPDPA 2023)",
    "difficulty": "intermediate"
  },
  {
    "q": "Can a Data Fiduciary use personal data for targeted advertising without consent?",
    "options": [
      "Yes, always allowed",
      "No, explicit consent required for targeted advertising to children; general advertising may fall under legitimate use",
      "Only if user doesn't opt-out",
      "Only for free services"
    ],
    "answer": 1,
    "explanation": "Section 9 specifically prohibits tracking or behavioral monitoring of children or targeted advertising directed at children. For adults, targeted advertising may require consent as it involves profiling, though this area awaits detailed regulatory guidance. (Reference: Section 9, DPDPA 2023)",
    "difficulty": "advanced"
  },
  {
    "q": "What is the notice requirement when collecting personal data?",
    "options": [
      "No notice required",
      "Notice must be given in clear and plain language",
      "Legal notice format mandatory",
      "Notice only if specifically requested"
    ],
    "answer": 1,
    "explanation": "Section 8(3) mandates that Data Fiduciaries must give Data Principals a notice containing prescribed particulars before or at the time of seeking consent or collecting data. The notice must be in clear and plain language, enabling informed decision-making. (Reference: Section 8(3), DPDPA 2023)",
    "difficulty": "intermediate"
  },
  {
    "q": "Which principle requires processing only the minimum data necessary?",
    "options": [
      "Purpose Limitation",
      "Data Minimization",
      "Storage Limitation",
      "Accuracy"
    ],
    "answer": 1,
    "explanation": "Though not explicitly stated as 'data minimization' in a single section, this principle is embedded throughout DPDPA. Section 8 requires that processing be necessary for the specified purpose, implicitly requiring collection of only essential data. This aligns with global best practices. (Reference: Section 8, DPDPA 2023)",
    "difficulty": "intermediate"
  },
  {
    "q": "What duty does a Data Processor have under DPDPA?",
    "options": [
      "Same as Data Fiduciary",
      "Process data only pursuant to contract and instructions of Data Fiduciary",
      "No specific duties mentioned",
      "Only data security duties"
    ],
    "answer": 1,
    "explanation": "Section 8(6) specifies that Data Processors may process personal data only pursuant to a valid contract with and on instructions of the Data Fiduciary. They cannot process data for their own purposes or beyond the scope of instructions received. (Reference: Section 8(6), DPDPA 2023)",
    "difficulty": "advanced"
  },
  {
    "q": "Can research institutions process personal data without consent?",
    "options": [
      "Never without consent",
      "Yes, for research, archiving or statistical purposes subject to safeguards",
      "Only government research institutions",
      "Only anonymized data"
    ],
    "answer": 1,
    "explanation": "Section 7(j) permits processing for research, archiving, or statistical purposes without consent, provided certain safeguards specified by government are followed. This balances research needs with privacy protection, following the K.S. Puttaswamy judgment's emphasis on proportionality. (Reference: Section 7(j), DPDPA 2023)",
    "difficulty": "advanced"
  },
  {
    "q": "What is the penalty for breach of confidentiality by Board members?",
    "options": [
      "Dismissal from service",
      "₹1 lakh",
      "No specific penalty under DPPA for Board members",
      "Imprisonment up to 2 years and fine"
    ],
    "answer": 2,
    "explanation": "Just that sections 8,9 and 10 places indirect responsibility on Board members and officers to maintain confidentiality, ensuring high standards of data protection at the regulatory level itself. (Reference: Sections 8, 9 and 10 DPDPA 2023)",
    "difficulty": "advanced"
  },
  {
    "q": "When did the DPDP Rules, 2025 come into force?",
    "options": [
      "November 14, 2025",
      "November 13, 2025",
      "December 15, 2024",
      "Rules not yet notified"
    ],
    "answer": 1,
    "explanation": "The Digital Personal Data Protection Rules, 2025 were notified on November 13, 2025, providing the operational framework for implementing the DPDPA. These rules detail procedural aspects, forms, timelines, and technical requirements for compliance. (Reference: DPDP Rules 2025, Notification Date)",
    "difficulty": "basic"
  },
  {
    "q": "What is the philosophical foundation of DPDPA rooted in?",
    "options": [
      "Contract Theory",
      "Right to Privacy as Fundamental Right (K.S. Puttaswamy judgment)",
      "Property Rights",
      "Commercial Law"
    ],
    "answer": 1,
    "explanation": "DPDPA is rooted in the landmark Justice K.S. Puttaswamy v. Union of India (2017) judgment which declared privacy as a fundamental right under Article 21 of the Constitution. The Act operationalizes this right in the digital context, balancing individual autonomy with legitimate state and commercial interests. (Reference: K.S. Puttaswamy v. Union of India (2017) 10 SCC 1; DPDPA 2023 Preamble)",
    "difficulty": "intermediate"
  },
  {
    "q": "How does DPDPA balance innovation with privacy?",
    "options": [
      "It doesn't, privacy is absolute",
      "Through exemptions for startups and legitimate use provisions",
      "Innovation is not considered",
      "Only through penalties"
    ],
    "answer": 1,
    "explanation": "DPDPA embodies proportionality by providing legitimate use exemptions (Section 7), permitting research (Section 7(j)), allowing government to exempt certain processing for innovation, and adopting lighter obligations compared to GDPR. This reflects the Puttaswamy judgment's emphasis on balancing fundamental rights with other legitimate interests. (Reference: Section 7, DPDPA 2023; Puttaswamy judgment (proportionality test))",
    "difficulty": "advanced"
  },
  {
    "q": "What is the significance of 'digital personal data' limitation?",
    "options": [
      "No significance",
      "Excludes manual/paper records from Act's scope, focusing on digital economy risks",
      "Only applies to cloud data",
      "Applies only to encrypted data"
    ],
    "answer": 1,
    "explanation": "By limiting scope to 'digital personal data' (Section 2(h)), DPDPA acknowledges the unique risks of digital processing - scale, speed, profiling capabilities, and cross-border flows. This focused approach differs from GDPR and reflects India's priority to regulate digital economy harms while not overburdening traditional paper-based operations. (Reference: Section 2(h), Section 3, DPDPA 2023)",
    "difficulty": "advanced"
  },
  {
    "q": "Which factor is NOT considered for designating a Significant Data Fiduciary?",
    "options": [
      "Volume and sensitivity of personal data",
      "Annual revenue of the organization",
      "Risk to rights of Data Principals",
      "Potential impact on sovereignty of India"
    ],
    "answer": 1,
    "explanation": "Section 10(1) lists factors including: (a) volume and sensitivity of data; (b) risk to rights of Data Principals; (c) potential impact on sovereignty and integrity of India; (d) risk to electoral democracy; (e) security of State; and (f) public order. Annual revenue is not a statutory criterion, though it may be indirectly relevant to volume. (Reference: Section 10(1), DPDPA 2023)",
    "difficulty": "advanced"
  },
  {
    "q": "What is the role of a Data Protection Officer?",
    "options": [
      "Marketing role",
      "Represent Significant Data Fiduciary for compliance and interface with Board and Data Principals",
      "Only technical role",
      "Financial auditor"
    ],
    "answer": 1,
    "explanation": "Section 10(3)(a) mandates Significant Data Fiduciaries to appoint a Data Protection Officer (DPO) who serves as the point of contact with the Data Protection Board and Data Principals. The DPO ensures organizational compliance, conducts training, and represents the entity on data protection matters. (Reference: Section 10(3)(a), DPDPA 2023)",
    "difficulty": "intermediate"
  },
  {
    "q": "Can personal data of deceased persons be processed under DPDPA?",
    "options": [
      "Yes, same rules apply",
      "No, Act doesn't apply to deceased persons",
      "Only with legal heir consent",
      "Only government can process"
    ],
    "answer": 1,
    "explanation": "DPDPA defines Data Principal as an 'individual' to whom the data relates. Since deceased persons are not 'individuals' in the legal sense of having rights, the Act does not apply to data of deceased persons. However, processing such data may be regulated under other laws or ethical frameworks. (Reference: Section 2(j), DPDPA 2023)",
    "difficulty": "advanced"
  },
  {
    "q": "What is consent fatigue and how does DPDPA address it?",
    "options": [
      "DPDPA doesn't address consent fatigue",
      "Through legitimate use provisions and implied consent for certain processing",
      "By making all consent permanent",
      "Through simplified consent forms only"
    ],
    "answer": 1,
    "explanation": "Consent fatigue occurs when users are overwhelmed with consent requests. DPDPA addresses this through Section 7's legitimate use provisions, allowing processing without consent for specified purposes like employment, legal obligations, and voluntary provision by Data Principal, reducing unnecessary consent requests while maintaining protection. (Reference: Section 7, DPDPA 2023)",
    "difficulty": "advanced"
  },
  {
    "q": "Which constitutional article forms the basis of the right to privacy?",
    "options": [
      "Article 19",
      "Article 21",
      "Article 14",
      "Article 32"
    ],
    "answer": 1,
    "explanation": "The Supreme Court in K.S. Puttaswamy v. Union of India held that the right to privacy is a fundamental right protected under Article 21 (right to life and personal liberty) read with Article 19 (freedom of speech and expression) of the Constitution. DPDPA operationalizes this constitutional mandate. (Reference: Article 21, Constitution of India; Puttaswamy judgment)",
    "difficulty": "intermediate"
  },
  {
    "q": "What test must government exemptions satisfy as per constitutional principles?",
    "options": [
      "Rational nexus test",
      "Proportionality test (legitimate aim, necessity, proportionality, procedural safeguards)",
      "Reasonableness test only",
      "No test required"
    ],
    "answer": 1,
    "explanation": "The Puttaswamy judgment established that any restriction on privacy must satisfy the proportionality test: (i) legitimate state aim, (ii) suitable/necessary measure, (iii) proportionate means, and (iv) procedural safeguards. Section 17 exemptions must satisfy these constitutional standards to withstand judicial scrutiny. (Reference: Puttaswamy judgment; Section 17, DPDPA 2023)",
    "difficulty": "advanced"
  },
  {
    "q": "How does DPDPA differ from GDPR in enforcement approach?",
    "options": [
      "No difference",
      "DPDPA uses administrative penalties by Board; GDPR has both administrative fines and civil liability",
      "DPDPA has criminal penalties only",
      "DPDPA has no enforcement mechanism"
    ],
    "answer": 1,
    "explanation": "DPDPA establishes an administrative enforcement model through the Data Protection Board with prescribed penalties (Sections 33-34), while GDPR provides for administrative fines by supervisory authorities plus civil liability. DPDPA's approach reflects India's regulatory preference for specialized tribunals with sectoral expertise. (Reference: Sections 18, 33-34, DPDPA 2023; GDPR Articles 82-83)",
    "difficulty": "advanced"
  }
];
