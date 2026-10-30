import { describe, expect, it } from "vitest";
import { AI_REFERENCE_SET, checkReferenceAnswer, citationMatches, isOneSentence, type ReferenceAnswer } from "./ai-reference-set.js";

const base = AI_REFERENCE_SET.find((c) => c.id === "R2")!;
const good: ReferenceAnswer = {
  answer: "This question asks whether the university protects personal data with encryption where appropriate.",
  whyItMatters: "It holds many records.",
  nextStep: { label: "Answer this question", page: "answer_question" },
  moreDetail: "",
  law: [{ citation: "s.8(5)", point: "Reasonable security safeguards.", source: "statute" }],
  suggestedEvidence: [],
  missingInformation: [],
  counselToConfirm: false,
};

describe("the reference-answer check (SLICE_11 §4.13)", () => {
  it("passes a good answer", () => expect(checkReferenceAnswer(base, good)).toEqual({ ok: true, failures: [] }));
  it("matches a provision and its sub-provisions, never a longer number", () => {
    expect(citationMatches("s.11(1)", "s.11")).toBe(true);
    expect(citationMatches("Rule 6(1)(a)", "Rule 6")).toBe(true);
    expect(citationMatches("Rule 14(1)", "Rule 1")).toBe(false);
    expect(citationMatches("s.80", "s.8")).toBe(false);
  });
  it("wants a one-sentence headline of at most thirty words (the live smoke's finding 2)", () => {
    expect(isOneSentence("One plain sentence about s.8(5) here.")).toBe(true);
    expect(isOneSentence("Two sentences. Here is the second.")).toBe(false);
    expect(isOneSentence(`${"word ".repeat(31)}end.`)).toBe(false);
    expect(checkReferenceAnswer(base, { ...good, answer: "First. Second one." }).failures[0]).toMatch(/one sentence/);
  });
  it("fails a missing provision, a wrong next step, a must-not-say line and a missing counsel hand-off", () => {
    const r8 = AI_REFERENCE_SET.find((c) => c.id === "R8")!;
    const { failures } = checkReferenceAnswer(r8, {
      ...good,
      answer: "Transfer outside India is prohibited for you.",
      nextStep: { label: "Look", page: "view_gaps" },
    });
    expect(failures).toEqual(
      expect.arrayContaining([
        "cites none of s.16",
        'next step "view_gaps" is not one of answer_question, add_evidence',
        'says "transfer outside india is prohibited"',
        "does not hand the unclear point to counsel",
      ]),
    );
  });
  it("tells statute from TrustStack's targets, both ways", () => {
    const r1 = AI_REFERENCE_SET.find((c) => c.id === "R1")!;
    const law = (citation: string, point: string, source: string) => ({ ...good, law: [{ citation: "s.11(1)", point: "Access, for data processed on consent (D-137).", source: "statute" }, { citation, point, source }] });
    expect(checkReferenceAnswer(r1, law("s.8(10)", "An effective grievance mechanism.", "truststack_default")).failures).toContain(
      "s.8(10) is the law but is labelled truststack_default",
    );
    expect(checkReferenceAnswer(r1, law("Rule 14(3)", "Reply within thirty days.", "statute")).failures).toContain(
      "Rule 14(3) presents a TrustStack target as the law",
    );
    expect(checkReferenceAnswer(r1, law("Rule 14(3)", "TrustStack's target: reply within thirty days.", "truststack_default")).ok).toBe(true);
  });
  it("never lets any case claim a decision the assistant does not make", () => {
    expect(checkReferenceAnswer(base, { ...good, moreDetail: "I have approved the policy." }).failures).toContain('says "I have approved"');
  });
});
