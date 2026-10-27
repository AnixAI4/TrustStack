export type ModuleStatus = "done" | "active" | "locked";
export type Module = {
  n: number;
  title: string;
  sub: string;
  status: ModuleStatus;
};

export const MODULES: Module[] = [
  { n: 1, title: "Foundations of the DPDP Act", sub: "Scope, definitions and key players", status: "done" },
  { n: 2, title: "Notice & consent", sub: "Sections 5-7 and the 2025 Rules", status: "done" },
  { n: 3, title: "Rights of the Data Principal", sub: "Access, correction, erasure, grievance", status: "active" },
  { n: 4, title: "Obligations & breach response", sub: "Security safeguards and reporting", status: "locked" },
  { n: 5, title: "Children & significant fiduciaries", sub: "Section 9, Section 10 and DPIAs", status: "locked" },
  { n: 6, title: "The Board, penalties & appeals", sub: "Enforcement end to end", status: "locked" },
];

export type Difficulty = "basic" | "intermediate" | "advanced";

export type QuizQuestion = {
  q: string;
  options: string[];
  answer: number;
  explanation: string;
  difficulty?: Difficulty;
};

// NOTE: The live Learn quiz now pulls from QUIZ_BANK in ./quiz-bank.ts
// (50 questions, 14 served at random per attempt).
// This inline set is unused and kept only as a small offline reference.
export const QUIZ: QuizQuestion[] = [
  {
    q: 'Who is a "Data Principal" under the DPDP Act?',
    options: [
      "The individual the personal data is about",
      "The company processing the data",
      "The government regulator",
      "The data processor vendor",
    ],
    answer: 0,
    explanation: "The Data Principal is the individual to whom the personal data relates.",
  },
  {
    q: "What is the maximum financial penalty under the DPDP Act?",
    options: ["₹250 crore", "₹50 crore", "₹500 crore", "₹100 crore"],
    answer: 0,
    explanation: "The Schedule sets a maximum of ₹250 crore for failing to take reasonable security safeguards.",
  },
  {
    q: "Within how long must a personal data breach be intimated?",
    options: ["72 hours", "24 hours", "30 days", "7 days"],
    answer: 0,
    explanation: "Affected principals and the Board must be intimated within 72 hours under the Rules.",
  },
  {
    q: "Under Section 6, valid consent must be all of the following EXCEPT:",
    options: ["Bundled with unrelated terms", "Free", "Specific", "Informed"],
    answer: 0,
    explanation: "Consent must be free, specific, informed and unambiguous - never bundled with unrelated terms.",
  },
  {
    q: "What does the Act require before processing a child's personal data?",
    options: [
      "Verifiable parental consent",
      "A privacy notice only",
      "Board approval",
      "Nothing special",
    ],
    answer: 0,
    explanation: "Section 9 requires verifiable parental consent before processing the data of anyone under 18.",
  },
  {
    q: 'A "Consent Manager" under the DPDP Rules is:',
    options: [
      "A registered intermediary that helps people give and withdraw consent",
      "A government officer",
      "An AI chatbot",
      "A data processor",
    ],
    answer: 0,
    explanation: "A Consent Manager is a registered, interoperable intermediary for giving and withdrawing consent.",
  },
  {
    q: "Which body enforces the DPDP Act?",
    options: [
      "The Data Protection Board of India",
      "The Supreme Court",
      "The Reserve Bank of India",
      "CERT-In",
    ],
    answer: 0,
    explanation: "The Data Protection Board of India adjudicates and enforces the Act.",
  },
  {
    q: "For AI systems, the right to erasure under DPDP can extend to:",
    options: ["Machine unlearning", "Deleting one database row", "Nothing", "Encryption only"],
    answer: 0,
    explanation: "Erasure can extend to machine unlearning for models trained on personal data.",
  },
  {
    q: "Does the Act apply to a foreign company with no India office serving Indian users?",
    options: [
      "Yes, if it processes Indian users' digital personal data",
      "No, never",
      "Only with an India office",
      "Only for payments",
    ],
    answer: 0,
    explanation: "The Act has extra-territorial reach where Indian users' digital personal data is processed.",
  },
  {
    q: 'A "Significant Data Fiduciary" has extra obligations including:',
    options: [
      "Appointing a Data Protection Officer, plus DPIAs and audits",
      "No extra obligations",
      "Only encryption",
      "Paying a registration fee",
    ],
    answer: 0,
    explanation: "SDFs must appoint a DPO and carry out DPIAs and independent audits.",
  },
  {
    q: "Which case recognised privacy as a fundamental right?",
    options: [
      "K.S. Puttaswamy v. Union of India",
      "Shreya Singhal v. Union of India",
      "Kesavananda Bharati v. State of Kerala",
      "Maneka Gandhi v. Union of India",
    ],
    answer: 0,
    explanation: "The 2017 Puttaswamy judgment held privacy to be a fundamental right under Article 21.",
  },
  {
    q: "When were the DPDP Rules notified?",
    options: ["January 2025", "August 2023", "2024", "2026"],
    answer: 0,
    explanation: "The DPDP Rules were notified in 2025, supplying the Act's operational detail.",
  },
];

export const LEARN_TOOLS: { title: string; sub: string; href: string }[] = [
  { title: "Privacy Notice Generator", sub: "Build a Section 5 notice", href: "/tools#generators" },
  { title: "Legitimate Interest tool", sub: "Assess a lawful basis", href: "/tools" },
  { title: "Consent checklist", sub: "Audit your consent flow", href: "/tools" },
];

export const FAQS: { q: string; a: string }[] = [
  {
    q: "What is the DPDP Act, 2023?",
    a: "It is India's comprehensive law governing how organisations collect, use and protect personal data. It sets out obligations for Data Fiduciaries and rights for individuals, enforced by the Data Protection Board of India.",
  },
  {
    q: "Who is a Data Fiduciary and a Data Principal?",
    a: "The Data Principal is the individual the data is about. The Data Fiduciary is the person or organisation deciding why and how data is processed. A Significant Data Fiduciary is a larger or higher-risk fiduciary with extra obligations.",
  },
  {
    q: "What counts as valid consent?",
    a: "Consent must be free, specific, informed, unconditional and unambiguous, given by a clear affirmative action, limited to the stated purpose, and withdrawable as easily as it was given.",
  },
  {
    q: "What are the penalties for non-compliance?",
    a: "The Schedule sets graded financial penalties, up to ₹250 crore for failing to take reasonable security safeguards leading to a breach, fixed by the Data Protection Board.",
  },
  {
    q: "How is children's data treated?",
    a: "Section 9 requires verifiable parental consent before processing the data of anyone under 18, and prohibits tracking, behavioural monitoring and targeted advertising directed at children.",
  },
  {
    q: "When does the Act come into force?",
    a: "It is being brought into force in phases through Government notification, with the DPDP Rules 2025 supplying operational detail. Significant Data Fiduciaries should expect to move first.",
  },
];
