// The complete DPDP question set. Merges the 50-question quiz bank (which carries
// answer explanations) with the 224-question certificate-exam bank into one
// deduplicated pool of 272 unique questions - the single source the certification
// exam draws from.
import { EXAM_BANK } from "./exam-bank";
import { QUIZ_BANK } from "./quiz-bank";

export type DpdpaQuestion = {
  q: string;
  options: string[];
  answer: number;
  explanation?: string;
  difficulty?: "basic" | "intermediate" | "advanced";
};

const seen = new Set<string>();

// Quiz first so the explained version wins for any question present in both banks.
export const DPDPA_QUESTIONS: DpdpaQuestion[] = [
  ...QUIZ_BANK.map((x) => ({
    q: x.q,
    options: x.options,
    answer: x.answer,
    explanation: x.explanation,
    difficulty: x.difficulty,
  })),
  ...EXAM_BANK.map((x) => ({
    q: x.q,
    options: x.options,
    answer: x.answer,
    difficulty: x.difficulty,
  })),
].filter((m) => {
  const k = m.q.trim().toLowerCase();
  if (seen.has(k)) return false;
  seen.add(k);
  return true;
});

export const DPDPA_QUESTION_COUNT = DPDPA_QUESTIONS.length;
