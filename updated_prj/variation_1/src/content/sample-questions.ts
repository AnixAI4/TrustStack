// A deliberately tiny fallback set, shown ONLY when the database is unreachable
// so the quiz/exam UI still renders something offline. The real question banks
// live in Supabase (tables `quiz_questions` / `exam_questions`) and are never
// shipped to the browser in bulk - the client only ever receives a small,
// random, capped subset per attempt via the secure RPCs (see
// supabase/secure_questions.sql). This file intentionally contains only a
// handful of generic questions.

export type SampleQuestion = {
  q: string;
  options: string[];
  answer: number;
  explanation: string;
  difficulty?: "basic" | "intermediate" | "advanced";
};

export const SAMPLE_QUESTIONS: SampleQuestion[] = [
  {
    q: "What does the DPDP Act, 2023 primarily regulate?",
    options: [
      "Physical paper records only",
      "The processing of digital personal data",
      "Corporate income tax",
      "Cybercrime sentencing",
    ],
    answer: 1,
    explanation:
      "The Act governs the processing of digital personal data - data in digital form, or non-digital data that is later digitised.",
    difficulty: "basic",
  },
  {
    q: "Who is a 'Data Principal' under the DPDP Act?",
    options: [
      "The company processing the data",
      "The government regulator",
      "The individual to whom the personal data relates",
      "A third-party processor",
    ],
    answer: 2,
    explanation:
      "A Data Principal is the individual the personal data is about; for a child, it includes their parents or lawful guardian.",
    difficulty: "basic",
  },
  {
    q: "Which authority is established to enforce the DPDP Act?",
    options: [
      "The Reserve Bank of India",
      "The Supreme Court",
      "SEBI",
      "The Data Protection Board of India",
    ],
    answer: 3,
    explanation:
      "The Data Protection Board of India adjudicates breaches and handles complaints under the Act.",
    difficulty: "basic",
  },
  {
    q: "Which statement describes valid consent under Section 6 of the DPDP Act?",
    options: [
      "It must be free, specific, informed, unconditional and unambiguous",
      "It can be inferred from silence or inactivity",
      "It permanently authorises every future use of the data",
      "It may be bundled with unrelated purposes without a separate choice",
    ],
    answer: 0,
    explanation:
      "Section 6 requires consent to be free, specific, informed, unconditional and unambiguous, given through a clear affirmative action.",
    difficulty: "intermediate",
  },
  {
    q: "What is the maximum penalty for failing to take reasonable security safeguards to prevent a personal data breach?",
    options: [
      "Up to ₹1 lakh",
      "Up to ₹250 crore",
      "Up to ₹10 crore",
      "No financial penalty",
    ],
    answer: 1,
    explanation:
      "Penalties under the Schedule can reach up to ₹250 crore per instance for significant failures, such as inadequate security safeguards.",
    difficulty: "intermediate",
  },
];
