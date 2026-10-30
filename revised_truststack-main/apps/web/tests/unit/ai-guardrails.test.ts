/**
 * Slice 11 Stage 1a — the guardrail suite (SLICE_11 §8), on the answers the
 * recorded fake returns. Every hostile answer is REJECTED with its reason, a
 * good one comes back with the server's flags forced, and the model cannot
 * unset a flag or add a field. The same outputs run through the whole chain in
 * e2e/api/ai.spec.ts.
 */
import { AI_REJECTIONS, DPDP_REPORT_CAVEAT } from "@truststack/core";
import { describe, expect, it } from "vitest";
import { evaluateAnswer, MODEL_ANSWER_JSON_SCHEMA, modelAnswerSchema } from "@/lib/ai/answer";
import { createFakeProvider, FAKE_SCENARIOS, fakeAnswer, scenarioFrom } from "@/lib/ai/fake";
import { provisionIndex } from "@/lib/ai/prompt";

const OPTIONS = { index: provisionIndex(), otherOrganisationNames: ["Mumbai University"] };
const evaluate = (raw: unknown) => evaluateAnswer("question_helper", typeof raw === "string" ? raw : JSON.stringify(raw), OPTIONS);

async function fakeText(scenario: string): Promise<string> {
  const result = await createFakeProvider().complete({
    task: "question_helper",
    system: "",
    user: `<person_question>[fake:${scenario}]</person_question>`,
    schema: {},
    effort: "low",
    maxTokens: 1000,
  });
  if (result.kind !== "answer") throw new Error(`scenario ${scenario} gave ${result.kind}`);
  return result.text;
}

describe("a good answer comes back with the server's flags, never the model's", () => {
  it("forces requiresHumanReview, sets legalReviewRequired from the task, and adds D-011's caveat", async () => {
    const result = evaluate(await fakeText("ok"));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.answer.requiresHumanReview).toBe(true);
    expect(result.answer.legalReviewRequired).toBe(false); // an explain task; every legal draft is true (2a)
    expect(result.answer.caveat).toBe(DPDP_REPORT_CAVEAT);
    expect(result.answer.reviewNote).toMatch(/a person must review it/);
    expect(result.answer.sourceReferences).toEqual(["s.8(5)", "Rule 6(1)"]);
    expect(result.citationFlags).toEqual([]);
  });
  it("cannot be told by the model to skip review: an extra field is an invalid answer", () => {
    const result = evaluate({ ...fakeAnswer(), requiresHumanReview: false, legalReviewRequired: false });
    expect(result).toMatchObject({ ok: false, rejection: "invalid_output" });
  });
  it("needs at least one citation and every field of the shape", () => {
    expect(evaluate({ ...fakeAnswer(), law: [] })).toMatchObject({ ok: false, rejection: "invalid_output" });
    const { whyItMatters: _drop, ...partial } = fakeAnswer();
    expect(evaluate(partial)).toMatchObject({ ok: false, rejection: "invalid_output" });
  });
  it("puts counsel's note on an answer that says counsel must confirm", () => {
    const result = evaluate(fakeAnswer({ counselToConfirm: true }));
    expect(result.ok && result.answer.counselNote).toBe("For review by counsel before use.");
  });
});

describe("§8 — every hostile answer is rejected, with its reason", () => {
  const expected: Record<string, string> = {
    certifies: "wording",
    approves_evidence: "wording",
    closes_gap: "wording",
    changes_score: "wording",
    statute_target: "wording",
    bad_citation: "citation",
    other_tenant: "other_tenant",
    invalid_json: "invalid_output",
  };
  for (const [scenario, rejection] of Object.entries(expected)) {
    it(`${scenario} → ${rejection}`, async () => {
      const raw =
        scenario === "invalid_json"
          ? "{ not json"
          : await fakeText(scenario);
      expect(evaluate(raw)).toMatchObject({ ok: false, rejection });
    });
  }
  it("a citation the corpus lacks is dropped and flagged; the rest of the answer stands", async () => {
    const result = evaluate(await fakeText("partial_citation"));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.answer.sourceReferences).toEqual(["s.8(5)"]);
    expect(result.citationFlags).toEqual([{ citation: "Rule 42(9)", reason: "not_in_corpus" }]);
  });
  it("the fake's refusal and truncation are not answers at all", async () => {
    for (const scenario of ["refusal", "truncated"] as const) {
      const r = await createFakeProvider().complete({ task: "question_helper", system: "", user: `[fake:${scenario}]`, schema: {}, effort: "low", maxTokens: 1 });
      expect(r.kind).toBe(scenario);
    }
  });
  it("every rejection the database allows has a scenario that reaches it", () => {
    const reached = new Set([...Object.values(expected), "refusal", "truncated"]);
    expect([...reached].sort()).toEqual([...AI_REJECTIONS].sort());
    expect(scenarioFrom("no marker")).toBe("ok");
    expect(FAKE_SCENARIOS).toContain("partial_citation");
  });
});

describe("the structured-output schema and the Zod check describe the same shape", () => {
  it("requires every field Zod requires, and allows no other", () => {
    const zodKeys = Object.keys(modelAnswerSchema.shape).sort();
    expect([...(MODEL_ANSWER_JSON_SCHEMA.required as string[])].sort()).toEqual(zodKeys);
    expect(Object.keys(MODEL_ANSWER_JSON_SCHEMA.properties as object).sort()).toEqual(zodKeys);
    expect(MODEL_ANSWER_JSON_SCHEMA.additionalProperties).toBe(false);
  });
  it("leaves out the bounds structured output does not accept", () => {
    expect(JSON.stringify(MODEL_ANSWER_JSON_SCHEMA)).not.toMatch(/maxLength|minLength|maxItems|minItems/);
  });
});
