import assert from "node:assert/strict";
import test from "node:test";

import {
  EXAM_BANK_SIZE,
  EXAM_MINUTES,
  EXAM_PASS_PCT,
  EXAM_SIZE,
} from "../src/content/certification";
import { EXAM_BANK } from "../src/content/exam-bank";
import { SAMPLE_QUESTIONS } from "../src/content/sample-questions";

const EXPECTED_FALLBACK_ANSWERS = new Map([
  [
    "What does the DPDP Act, 2023 primarily regulate?",
    "The processing of digital personal data",
  ],
  [
    "Who is a 'Data Principal' under the DPDP Act?",
    "The individual to whom the personal data relates",
  ],
  [
    "Which authority is established to enforce the DPDP Act?",
    "The Data Protection Board of India",
  ],
  [
    "Which statement describes valid consent under Section 6 of the DPDP Act?",
    "It must be free, specific, informed, unconditional and unambiguous",
  ],
  [
    "What is the maximum penalty for failing to take reasonable security safeguards to prevent a personal data breach?",
    "Up to \u20b9250 crore",
  ],
]);

test("certification requires a perfect score across five questions", () => {
  assert.equal(EXAM_SIZE, 5);
  assert.equal(EXAM_PASS_PCT, 100);
  assert.equal(EXAM_MINUTES, 10);
});

test("the offline five-question set has the audited answer keys", () => {
  assert.equal(SAMPLE_QUESTIONS.length, EXAM_SIZE);

  for (const question of SAMPLE_QUESTIONS) {
    const expected = EXPECTED_FALLBACK_ANSWERS.get(question.q);
    assert.ok(expected, `Unexpected fallback question: ${question.q}`);
    assert.equal(question.options[question.answer], expected, question.q);
  }
});

test("all local exam-bank answer indexes point to a real option", () => {
  assert.equal(EXAM_BANK.length, EXAM_BANK_SIZE);

  for (const question of EXAM_BANK) {
    assert.ok(Number.isInteger(question.answer), `${question.q}: answer is not an integer`);
    assert.ok(question.answer >= 0, `${question.q}: answer is negative`);
    assert.ok(question.answer < question.options.length, `${question.q}: answer is out of range`);
    assert.ok(question.options[question.answer]?.trim(), `${question.q}: correct option is empty`);
  }
});