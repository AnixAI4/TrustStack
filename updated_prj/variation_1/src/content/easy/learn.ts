/**
 * Easy read pairs for /learn: hero, "courses by role" section, Compliance tools,
 * the LearnQuiz intro chrome and the FAQ (content/learn.ts FAQS).
 *
 * The live quiz bank questions render inside a modal and are faithfulness-
 * sensitive test items, so they are left to fallbackEasyText. Course card
 * titles/taglines are mapped in courses.ts (shared). "Courses by role" is
 * already mapped in common.ts.
 */
export const PAIRS: [string, string][] = [
  // ---- hero ----
  [
    'A structured course, an adaptive quiz and free tools - built to take you from "what does the law say?" to "I know exactly what to do."',
    'A step-by-step course, a smart quiz and free tools - built to take you from "what does the law say?" to "I know exactly what to do."',
  ],

  // ---- courses-by-role section ----
  [
    "The DPDP Act lands differently on a citizen, a founder, a DPO, a lawyer, an engineer and a student. Choose your track - each maps to the same Act, but teaches what you actually need to do.",
    "The DPDP Act affects a citizen, a founder, a DPO, a lawyer, an engineer and a student differently. Choose your track - each covers the same Act, but teaches what you actually need to do.",
  ],

  // ---- compliance tools ----
  ["Assess a lawful basis", "Check a legal reason"],
  ["Consent checklist", "Permission checklist"],
  ["Audit your consent flow", "Check your permission steps"],

  // ---- learn quiz ----
  ["Adaptive quiz", "Smart quiz"],
  ["Ten multiple-choice questions, drawn at random from a free", "Ten multiple-choice questions, picked at random from a free"],

  // ---- FAQ ----
  ["What counts as valid consent?", "What counts as valid permission?"],
  ["What are the penalties for non-compliance?", "What are the fines for breaking the law?"],
  [
    "It is India's comprehensive law governing how organisations collect, use and protect personal data. It sets out obligations for Data Fiduciaries and rights for individuals, enforced by the Data Protection Board of India.",
    "It is India's main law on how organisations collect, use and protect personal data. It sets out duties for the organisations responsible for data and rights for individuals, enforced by the Data Protection Board of India.",
  ],
  [
    "The Data Principal is the individual the data is about. The Data Fiduciary is the person or organisation deciding why and how data is processed. A Significant Data Fiduciary is a larger or higher-risk fiduciary with extra obligations.",
    "The Data Principal is the person the data is about. The Data Fiduciary is the person or organisation that decides why and how data is used. A Significant Data Fiduciary is a larger or higher-risk one with extra duties.",
  ],
  [
    "Consent must be free, specific, informed, unconditional and unambiguous, given by a clear affirmative action, limited to the stated purpose, and withdrawable as easily as it was given.",
    "Permission must be freely given, clear and for a specific reason, made by a clear yes, limited to the stated reason, and easy to take back.",
  ],
  [
    "The Schedule sets graded financial penalties, up to ₹250 crore for failing to take reasonable security safeguards leading to a breach, fixed by the Data Protection Board.",
    "The Schedule sets step-based fines, up to ₹250 crore for failing to take sensible security steps that lead to a data leak, set by the Data Protection Board.",
  ],
  [
    "Section 9 requires verifiable parental consent before processing the data of anyone under 18, and prohibits tracking, behavioural monitoring and targeted advertising directed at children.",
    "Section 9 requires confirmed parent permission before using the data of anyone under 18, and bans tracking, monitoring and targeted ads aimed at children.",
  ],
  [
    "It is being brought into force in phases through Government notification, with the DPDP Rules 2025 supplying operational detail. Significant Data Fiduciaries should expect to move first.",
    "It is coming into force in stages through Government notices, with the DPDP Rules 2025 giving the practical detail. Large, high-risk organisations should expect to act first.",
  ],
];
