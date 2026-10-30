/**
 * GATE — the scoring engine against the workbook oracle (D-007, D-048).
 *
 * The 98 sample responses from the workbook's `Responses` sheet, run through
 * `packages/core`'s engine TWICE:
 *
 *   (a) with the workbook's own naive `MIN(claimed, evidence)` plugged in, it
 *       must reproduce 24.7014 · 23.9% · 10 critical · 57 high EXACTLY. That
 *       proves the AGGREGATION — weights, averages, N/A handling, confidence,
 *       severity counts — matches the workbook.
 *   (b) with the spec's cap table, it gives 25.3014 · 23.9% · 10 · 52. Those
 *       are the product's own numbers.
 *
 * The only difference between them is the cap, on five `CB1.x` rows (D-047).
 *
 * This lives in `apps/web` rather than `packages/core` for one reason: it
 * reads a fixture from disk, and `packages/core` has no Node types and no I/O
 * by design (D-004). The engine it exercises is entirely core's.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  DPDP_DOMAINS,
  scoreAssessment,
  type CapRule,
  type DomainCode,
  type EngineDomainInput,
  type EngineResponse,
  type MaturityLevel,
} from "@truststack/core";
import { describe, expect, it } from "vitest";

/**
 * The workbook's naive rule (D-045). It lives HERE, in the test, and nowhere
 * else: the product and the database always use the spec's cap table, and the
 * naive rule is never exported for product use (D-048).
 */
const NAIVE_CAP_RULE: CapRule = (claimed, level) => Math.min(claimed, level ?? 0) as MaturityLevel;

const answer = (questionCode: string, claimed: number, level: number | null): EngineResponse => ({
  questionCode,
  applicabilityDecision: "applicable",
  claimedMaturity: claimed,
  evidenceLevel: level,
});



interface SampleFixture {
  expected: Record<"naive" | "spec", { rawScore: number; evidenceConfidence: number; criticalCount: number; highCount: number }> & {
    scoreCap: number;
  };
  responses: {
    questionCode: string;
    domainId: string;
    domainCode: DomainCode;
    applicability: string;
    claimedMaturity: number;
    evidenceLevel: number;
    evidenceCurrent: string;
  }[];
}

const SAMPLE: SampleFixture = JSON.parse(
  readFileSync(
    path.resolve(import.meta.dirname, "../../../../packages/db/question-bank/workbook-sample.json"),
    "utf8",
  ),
);

/** The 98 samples as sixteen domain inputs, at the workbook's own weights. */
function sampleDomains(): EngineDomainInput[] {
  return DPDP_DOMAINS.map((d) => {
    const responses = SAMPLE.responses
      .filter((r) => r.domainCode === d.code)
      // "Applicable" and "Conditional" both COUNT as applicable; the sheet has
      // no "Not Applicable" row at all.
      .map((r) => answer(r.questionCode, r.claimedMaturity, r.evidenceLevel));
    return { code: d.code, weight: d.weight, questionCount: responses.length, responses };
  });
}

describe("GATE — the workbook's 98 sample responses (D-007, D-048)", () => {
  it("the fixture is the sheet as it actually is: 98 rows, 76 + 22, none N/A, none stale", () => {
    expect(SAMPLE.responses).toHaveLength(98);
    const byApplicability = SAMPLE.responses.reduce<Record<string, number>>((acc, r) => {
      acc[r.applicability] = (acc[r.applicability] ?? 0) + 1;
      return acc;
    }, {});
    expect(byApplicability).toEqual({ Applicable: 76, Conditional: 22 });
    expect(SAMPLE.responses.every((r) => r.evidenceCurrent === "Yes")).toBe(true);
    expect(new Set(SAMPLE.responses.map((r) => r.domainCode)).size).toBe(16);
  });

  /**
   * Run (a): the workbook's own naive rule plugged into OUR aggregation. This
   * is what proves the aggregation — weights, averages, N/A handling,
   * confidence and severity counts — reproduces the workbook exactly. If this
   * fails, the aggregation is wrong, not the cap.
   */
  it("(a) aggregation parity — the naive rule gives 24.7014 · 23.9% · 10 critical · 57 high", () => {
    const s = scoreAssessment(sampleDomains(), { capRule: NAIVE_CAP_RULE });
    expect(s.rawScore).toBeCloseTo(24.7014, 4);
    expect(s.evidenceConfidence!).toBeCloseTo(23.9, 1);
    expect(s.criticalCount).toBe(10);
    expect(s.highCount).toBe(57);
    expect(s.rawScore).toBeCloseTo(SAMPLE.expected.naive.rawScore, 4);
    expect(s.criticalCount).toBe(SAMPLE.expected.naive.criticalCount);
    expect(s.highCount).toBe(SAMPLE.expected.naive.highCount);
  });

  /**
   * Run (b): the product's own numbers, under the spec's cap. The ONLY
   * difference from (a) is the cap, on five `CB1.x` rows (claim 2 + E1 → 1
   * there, 2 here) — which is why the score moves 0.6 and five High gaps
   * become Medium (D-047).
   */
  it("(b) the product — the spec's cap gives 25.3014 · 23.9% · 10 critical · 52 high", () => {
    const s = scoreAssessment(sampleDomains());
    expect(s.rawScore).toBeCloseTo(25.3014, 4);
    expect(s.evidenceConfidence!).toBeCloseTo(23.9, 1);
    expect(s.criticalCount).toBe(10);
    expect(s.highCount).toBe(52);
    expect(s.rawScore).toBeCloseTo(SAMPLE.expected.spec.rawScore, 4);
    expect(s.criticalCount).toBe(SAMPLE.expected.spec.criticalCount);
    expect(s.highCount).toBe(SAMPLE.expected.spec.highCount);
  });

  it("the difference between the two runs is exactly the five CB1.x rows", () => {
    const naive = scoreAssessment(sampleDomains(), { capRule: NAIVE_CAP_RULE });
    const spec = scoreAssessment(sampleDomains());
    const adjustedBy = (s: ReturnType<typeof scoreAssessment>) =>
      new Map(s.domains.flatMap((d) => d.questions.map((q) => [q.questionCode, q.adjusted] as const)));
    const a = adjustedBy(naive);
    const b = adjustedBy(spec);
    const differing = [...a.keys()].filter((code) => a.get(code) !== b.get(code)).sort();
    expect(differing).toEqual(["CB1.1", "CB1.2", "CB1.3", "CB1.4", "CB1.5"]);
    expect(spec.rawScore - naive.rawScore).toBeCloseTo(0.6, 10);
  });

  it("evidence confidence is 23.9% under BOTH rules — the cap does not touch it", () => {
    const naive = scoreAssessment(sampleDomains(), { capRule: NAIVE_CAP_RULE });
    const spec = scoreAssessment(sampleDomains());
    expect(spec.evidenceConfidence).toBe(naive.evidenceConfidence);
    expect(spec.evidenceConfidence!).toBeCloseTo(23.9033, 4);
  });

  it("the red-flag cap on the sample is 50 (children's data) under both rules", () => {
    for (const capRule of [undefined, NAIVE_CAP_RULE]) {
      const s = scoreAssessment(sampleDomains(), { capRule });
      expect(s.scoreCap).toBe(50);
      expect(s.scoreCap).toBe(SAMPLE.expected.scoreCap);
      expect(s.redFlags.map((f) => f.code)).toContain("unreviewed_childrens_data");
    }
  });

  it("≤ 2 additionally fires the security flag, which the workbook's < 2 did not (D-046)", () => {
    const s = scoreAssessment(sampleDomains());
    expect(s.redFlags.map((f) => f.code)).toContain("weak_security_safeguards");
    // The sample's SECURITY answers are all adjusted 2 — under `< 2` none fired.
    const security = s.domains.find((d) => d.code === "SECURITY")!;
    expect(security.questions.every((q) => q.adjusted === 2)).toBe(true);
  });

  it("the cap is far above the raw score, so the sample's final score is its raw score", () => {
    const s = scoreAssessment(sampleDomains());
    expect(s.finalScore).toBeCloseTo(25.3014, 4);
    expect(s.maturityLevel).toBe("Level 1 - Aware");
    expect(s.applicableWeight).toBe(100);
  });

  it("every one of the sixteen domain scores matches the workbook's Domain_Scoring sheet", () => {
    const s = scoreAssessment(sampleDomains(), { capRule: NAIVE_CAP_RULE });
    // Cached values read from the workbook on 2026-09-20.
    const expected: Record<string, number> = {
      D01: 2.6, D02: 1.3714285714285714, D03: 1.05, D04: 2.8, D05: 2.8, D06: 1.1666666666666667,
      D07: 1.4, D08: 0.6, D09: 1.2, D10: 1.6, D11: 4, D12: 1.0666666666666667,
      D13: 1.1666666666666667, D14: 0.48, D15: 0.6, D16: 0.8,
    };
    for (const d of s.domains) expect(d.score!).toBeCloseTo(expected[d.domainId]!, 10);
  });
});
