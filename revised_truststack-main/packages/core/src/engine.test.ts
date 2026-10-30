import { describe, expect, it } from "vitest";
import { DPDP_DOMAINS, domainWeight, type DomainCode } from "./domains.js";
import {
  applyRedFlags,
  DOMAIN_SCORE_STATES,
  ENGINE_VERSION,
  exactProportion,
  GAP_SEVERITIES,
  MATURITY_BANDS,
  maturityBand,
  NO_SCORE_CAP,
  overallEvidenceConfidence,
  questionSeverity,
  RED_FLAG_MAX_ADJUSTED,
  RED_FLAGS,
  scoreAssessment,
  scoreDomain,
  SPEC_CAP_RULE,
  type CapRule,
  type EngineDomainInput,
  type EngineResponse,
} from "./engine.js";
import { ScoringInputError, type MaturityLevel } from "./scoring.js";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

/**
 * The workbook's naive rule, `MIN(claimed, evidence)` (D-045). It lives HERE,
 * in the test, and nowhere else: the product and the database always use the
 * spec's cap table. Plugging it into the aggregation isolates the cap from
 * everything else the engine does (D-048).
 */
const NAIVE_CAP_RULE: CapRule = (claimed, level) => Math.min(claimed, level ?? 0) as MaturityLevel;

const answer = (questionCode: string, claimed: number, level: number | null): EngineResponse => ({
  questionCode,
  applicabilityDecision: "applicable",
  claimedMaturity: claimed,
  evidenceLevel: level,
});

const naAnswer = (questionCode: string): EngineResponse => ({
  questionCode,
  applicabilityDecision: "not_applicable",
  claimedMaturity: null,
  evidenceLevel: null,
});

/** A domain with `responses.length` questions — nothing outstanding. */
const domainInput = (code: DomainCode, responses: EngineResponse[]): EngineDomainInput => ({
  code,
  weight: domainWeight(code),
  questionCount: responses.length,
  responses,
});

/** All sixteen domains, each with one perfect answer — a 100/100 baseline. */
const allDomainsPerfect = (): EngineDomainInput[] =>
  DPDP_DOMAINS.map((d) => domainInput(d.code, [answer(`${d.code}-1`, 5, 5)]));

// ---------------------------------------------------------------------------
// Maturity bands
// ---------------------------------------------------------------------------

describe("maturityBand", () => {
  it("uses the workbook's labels", () => {
    expect(MATURITY_BANDS.map((b) => b.label)).toEqual([
      "Level 0 - Not Started",
      "Level 1 - Aware",
      "Level 2 - Defined",
      "Level 3 - Implementing",
      "Level 4 - Operational",
      "Level 5 - Continuous Assurance",
    ]);
  });

  // The workbook's nested IF is `<=`, so each boundary belongs to the LOWER band.
  it.each([
    [0, 0],
    [0.2, 0],
    [0.2001, 1],
    [0.4, 1],
    [0.4001, 2],
    [0.6, 2],
    [0.6001, 3],
    [0.75, 3],
    [0.7501, 4],
    [0.9, 4],
    [0.9001, 5],
    [1, 5],
  ])("%s → Level %s", (percent, level) => {
    expect(maturityBand(percent).level).toBe(level);
  });

  it("refuses a non-finite percent rather than banding it", () => {
    expect(() => maturityBand(Number.NaN)).toThrow(ScoringInputError);
  });

  /**
   * Found on a real assessment (2026-10-02): the live score said Level 1 and
   * its own finalised snapshot said Level 0. Summing sixteen floating-point
   * domain scores gives 20.000000000000004, which is "above" the 0.20
   * boundary unless the noise is removed first. The database sums exact
   * numerics and was right all along.
   */
  describe("a boundary is not crossed by floating-point noise", () => {
    it.each([
      [0.20000000000000004, 0],
      [0.4000000000000001, 1],
      [0.6000000000000001, 2],
      [0.7500000000000001, 3],
      [0.9000000000000001, 4],
    ])("%s is the boundary itself → Level %s", (percent, level) => {
      expect(maturityBand(percent).level).toBe(level);
    });

    it("still moves up for a value that is genuinely above the boundary", () => {
      expect(maturityBand(0.200001).level).toBe(1);
      expect(maturityBand(0.2 + 2e-9).level).toBe(1);
    });

    it("exactProportion removes the noise and nothing else", () => {
      expect(exactProportion(0.20000000000000004)).toBe(0.2);
      expect(exactProportion(0.123456789)).toBe(0.123456789);
      expect(exactProportion(0)).toBe(0);
      expect(exactProportion(1)).toBe(1);
    });
  });
});

// ---------------------------------------------------------------------------
// Severity
// ---------------------------------------------------------------------------

describe("questionSeverity", () => {
  it.each([
    [5, "no_gap"],
    [4, "improvement"],
    [3, "low"],
    [2, "medium"],
    [1, "high"],
    [0, "critical"],
  ])("adjusted %s → %s", (adjusted, severity) => {
    expect(questionSeverity(adjusted)).toBe(severity);
  });

  it("covers every severity in the vocabulary", () => {
    expect(new Set([0, 1, 2, 3, 4, 5].map(questionSeverity))).toEqual(new Set(GAP_SEVERITIES));
  });

  /**
   * Under the spec's cap an adjusted 0 needs a CLAIM of 0, so the Slice 4
   * keystone journey — claim 5, nothing reviewed — is High, not Critical.
   * Under the workbook's naive rule it would have been Critical.
   */
  it("an unevidenced claim of 5 is High, not Critical", () => {
    expect(questionSeverity(SPEC_CAP_RULE(5, null))).toBe("high");
    expect(questionSeverity(NAIVE_CAP_RULE(5, null))).toBe("critical");
  });

  it("refuses a score outside 0–5", () => {
    expect(() => questionSeverity(6)).toThrow(ScoringInputError);
    expect(() => questionSeverity(-1)).toThrow(ScoringInputError);
    expect(() => questionSeverity(2.5)).toThrow(ScoringInputError);
  });
});

// ---------------------------------------------------------------------------
// One domain
// ---------------------------------------------------------------------------

describe("scoreDomain", () => {
  it("is (avg adjusted / 5) × weight", () => {
    // GOV weight 7; claims 5/3/1 all fully evidenced → avg 3 → (3/5)×7 = 4.2
    const d = scoreDomain(domainInput("GOV", [answer("a", 5, 5), answer("b", 3, 3), answer("c", 1, 5)]));
    expect(d.avgAdjusted).toBe(3);
    expect(d.score).toBeCloseTo(4.2, 10);
    expect(d.percent).toBeCloseTo(0.6, 10);
    expect(d.maturityLevel).toBe("Level 2 - Defined");
  });

  it("scores the ADJUSTED claim, so unevidenced claims do not lift the domain", () => {
    const evidenced = scoreDomain(domainInput("GOV", [answer("a", 5, 5)]));
    const bare = scoreDomain(domainInput("GOV", [answer("a", 5, null)]));
    expect(evidenced.score).toBe(7);
    expect(bare.score).toBeCloseTo(1.4, 10); // (1/5)×7
  });

  it("Not Applicable answers leave the question denominator (D-029.3)", () => {
    const d = scoreDomain(domainInput("GOV", [answer("a", 5, 5), naAnswer("b"), naAnswer("c")]));
    expect(d.applicableCount).toBe(1);
    expect(d.notApplicableCount).toBe(2);
    expect(d.avgAdjusted).toBe(5);
    expect(d.score).toBe(7);
    expect(d.state).toBe("scored");
  });

  it("evidence confidence is (avg evidence level / 5) × 100, and unreviewed counts as E0", () => {
    expect(scoreDomain(domainInput("GOV", [answer("a", 5, 5)])).evidenceConfidence).toBe(100);
    expect(scoreDomain(domainInput("GOV", [answer("a", 5, null)])).evidenceConfidence).toBe(0);
    expect(scoreDomain(domainInput("GOV", [answer("a", 5, 5), answer("b", 5, 0)])).evidenceConfidence).toBe(50);
  });

  it("counts outstanding questions and marks the score provisional", () => {
    const d = scoreDomain({ code: "GOV", weight: 7, questionCount: 4, responses: [answer("a", 5, 5)] });
    expect(d.outstandingCount).toBe(3);
    expect(d.provisional).toBe(true);
    expect(d.score).toBe(7); // over the answers that exist
  });

  it("refuses more responses than questions", () => {
    expect(() =>
      scoreDomain({ code: "GOV", weight: 7, questionCount: 1, responses: [answer("a", 5, 5), answer("b", 5, 5)] }),
    ).toThrow(ScoringInputError);
  });

  it("refuses an applicable answer with no claim", () => {
    const broken: EngineResponse = {
      questionCode: "a",
      applicabilityDecision: "applicable",
      claimedMaturity: null,
      evidenceLevel: 5,
    };
    expect(() => scoreDomain(domainInput("GOV", [broken]))).toThrow(ScoringInputError);
  });

  describe("the three states stay distinct (D-038)", () => {
    it("covers the whole vocabulary", () => {
      expect([...DOMAIN_SCORE_STATES]).toEqual(["scored", "scoped_out", "all_not_applicable"]);
    });

    it("scoped out — no question was ever generated", () => {
      const d = scoreDomain({ code: "VENDOR", weight: 7, questionCount: 0, responses: [] });
      expect(d.state).toBe("scoped_out");
      expect(d.score).toBeNull();
      expect(d.evidenceConfidence).toBeNull();
    });

    it("all Not Applicable — every generated question was excluded, with reasons", () => {
      const d = scoreDomain(domainInput("VENDOR", [naAnswer("a"), naAnswer("b")]));
      expect(d.state).toBe("all_not_applicable");
      expect(d.score).toBeNull();
      expect(d.notApplicableCount).toBe(2);
    });

    it("a domain that is merely unanswered is neither — it is scored and provisional", () => {
      const d = scoreDomain({ code: "VENDOR", weight: 7, questionCount: 3, responses: [] });
      expect(d.state).toBe("scored");
      expect(d.provisional).toBe(true);
      expect(d.score).toBeNull();
    });

    it("neither empty state scores zero", () => {
      for (const d of [
        scoreDomain({ code: "VENDOR", weight: 7, questionCount: 0, responses: [] }),
        scoreDomain(domainInput("VENDOR", [naAnswer("a")])),
      ]) {
        expect(d.score).not.toBe(0);
        expect(d.score).toBeNull();
      }
    });
  });

  describe("status", () => {
    it("any Critical → Critical, whatever the percentage", () => {
      expect(scoreDomain(domainInput("GOV", [answer("a", 5, 5), answer("b", 0, 5)])).status).toBe("critical");
    });
    it("else any High → High Risk", () => {
      expect(scoreDomain(domainInput("GOV", [answer("a", 5, 5), answer("b", 1, 5)])).status).toBe("high_risk");
    });
    it("else below 61% → Needs Work", () => {
      expect(scoreDomain(domainInput("GOV", [answer("a", 3, 3)])).status).toBe("needs_work"); // 60%
    });
    it("else On Track", () => {
      expect(scoreDomain(domainInput("GOV", [answer("a", 4, 4)])).status).toBe("on_track"); // 80%
    });
    it("a domain with nothing scored is Needs Work, never On Track by default", () => {
      expect(scoreDomain({ code: "GOV", weight: 7, questionCount: 2, responses: [] }).status).toBe("needs_work");
    });
  });
});

// ---------------------------------------------------------------------------
// Red flags
// ---------------------------------------------------------------------------

describe("red flags", () => {
  const withFlagAnswer = (code: DomainCode, questionCode: string, claimed: number, level: number | null) =>
    allDomainsPerfect().map((d) =>
      d.code === code ? domainInput(code, [answer(questionCode, 5, 5), answer(questionCode, claimed, level)]) : d,
    );

  it("there are exactly seven, each naming a domain and a cap", () => {
    expect(RED_FLAGS).toHaveLength(7);
    expect(RED_FLAGS.map((f) => f.cap)).toEqual([60, 55, 60, 60, 65, 70, 50]);
    expect(RED_FLAGS.map((f) => f.domainCode)).toEqual([
      "GOV", "INV", "ROPA", "SECURITY", "BREACH", "VENDOR", "CHILD",
    ]);
  });

  it("only the GOV flag is pinned to one question — G1.2", () => {
    expect(RED_FLAGS.filter((f) => f.questionCode !== undefined).map((f) => f.questionCode)).toEqual(["G1.2"]);
  });

  it("every label is plain language: no question codes, no pack codes (D-040)", () => {
    for (const flag of RED_FLAGS) {
      expect(flag.label).not.toMatch(/\b[A-Z]{2,}\d|_V\d|\bD\d{2}\b/);
      expect(flag.label.length).toBeGreaterThan(20);
    }
  });

  it("nothing firing leaves the score uncapped at 100", () => {
    const outcome = applyRedFlags(allDomainsPerfect().map((d) => scoreDomain(d)));
    expect(outcome.fired).toEqual([]);
    expect(outcome.cap).toBe(NO_SCORE_CAP);
  });

  it.each(RED_FLAGS.map((f) => [f.code, f.domainCode, f.questionCode ?? "X1.1", f.cap] as const))(
    "%s fires alone at cap %s",
    (code, domainCode, questionCode, cap) => {
      const domains = withFlagAnswer(domainCode, questionCode, 2, 5).map((d) => scoreDomain(d));
      const outcome = applyRedFlags(domains);
      expect(outcome.fired.map((f) => f.code)).toEqual([code]);
      expect(outcome.cap).toBe(cap);
      expect(outcome.fired[0]!.questionCodes).toEqual([questionCode]);
    },
  );

  it("two together → the LOWER cap wins", () => {
    // VENDOR (70) and CHILD (50) both weak.
    const domains = allDomainsPerfect()
      .map((d) => (d.code === "VENDOR" ? domainInput("VENDOR", [answer("V1.1", 2, 5)]) : d))
      .map((d) => (d.code === "CHILD" ? domainInput("CHILD", [answer("CH1.1", 2, 5)]) : d))
      .map((d) => scoreDomain(d));
    const outcome = applyRedFlags(domains);
    expect(outcome.fired.map((f) => f.cap).sort()).toEqual([50, 70]);
    expect(outcome.cap).toBe(50);
  });

  // D-046: ≤ 2, not the workbook's < 2. Under the spec's cap E1 and E2 both
  // produce 2, so `< 2` would have stopped firing for weak evidence entirely.
  describe("the threshold is ≤ 2, tested at the boundary (D-046)", () => {
    it("is 2", () => expect(RED_FLAG_MAX_ADJUSTED).toBe(2));

    it("adjusted 2 FIRES", () => {
      const domains = withFlagAnswer("CHILD", "CH1.4", 2, 5).map((d) => scoreDomain(d));
      expect(applyRedFlags(domains).cap).toBe(50);
    });

    it("adjusted 3 does NOT fire", () => {
      const domains = withFlagAnswer("CHILD", "CH1.4", 3, 5).map((d) => scoreDomain(d));
      expect(applyRedFlags(domains).fired).toEqual([]);
      expect(applyRedFlags(domains).cap).toBe(NO_SCORE_CAP);
    });

    it("claim 4 with only E1 evidence gives adjusted 2 — so weak evidence alone fires it", () => {
      const domains = withFlagAnswer("CHILD", "CH1.4", 4, 1).map((d) => scoreDomain(d));
      expect(applyRedFlags(domains).cap).toBe(50);
    });
  });

  // The keystone question is itself a red flag.
  it("claim 5 + E0 on G1.2 → adjusted 1 → caps the assessment at 60", () => {
    const domains = allDomainsPerfect()
      .map((d) => (d.code === "GOV" ? domainInput("GOV", [answer("G1.2", 5, null)]) : d))
      .map((d) => scoreDomain(d));
    expect(domains.find((d) => d.code === "GOV")!.questions[0]!.adjusted).toBe(1);
    expect(applyRedFlags(domains).cap).toBe(60);
  });

  it("another weak GOV question does NOT fire the owner flag — it is pinned to G1.2", () => {
    const domains = allDomainsPerfect()
      .map((d) => (d.code === "GOV" ? domainInput("GOV", [answer("G1.7", 0, null)]) : d))
      .map((d) => scoreDomain(d));
    expect(applyRedFlags(domains).fired).toEqual([]);
  });

  it("a scoped-out domain cannot fire its flag — it has no answers", () => {
    const domains = allDomainsPerfect()
      .map((d) => (d.code === "VENDOR" ? { ...d, questionCount: 0, responses: [] } : d))
      .map((d) => scoreDomain(d));
    expect(applyRedFlags(domains).fired).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// The whole assessment
// ---------------------------------------------------------------------------

describe("scoreAssessment", () => {
  /**
   * The case that found the bug: every answer adjusted 1, in all sixteen
   * domains. Each domain is exactly 20% of its weight, so the total is exactly
   * 20 of 100 — the 0.20 boundary, which belongs to Level 0. The raw
   * floating-point sum is 20.000000000000004.
   */
  it("bands a score that sits EXACTLY on a boundary in the lower band, as the database does", () => {
    const score = scoreAssessment(DPDP_DOMAINS.map((d) => domainInput(d.code, [answer(`${d.code}-1`, 1, 1)])));
    expect(score.finalScore).toBeCloseTo(20, 9);
    expect(score.applicableWeight).toBe(100);
    expect(score.maturityLevel).toBe("Level 0 - Not Started");
    // Every domain is on the same boundary, and none of them drifts either.
    for (const d of score.domains) {
      expect(d.percent).toBe(0.2);
      expect(d.maturityLevel).toBe("Level 0 - Not Started");
    }
  });

  it("does the same at every other boundary a whole assessment can land on", () => {
    // Adjusted 2 everywhere is 40%, adjusted 3 is 60% — both boundaries.
    for (const [adjusted, label] of [
      [2, "Level 1 - Aware"],
      [3, "Level 2 - Defined"],
    ] as const) {
      const score = scoreAssessment(
        DPDP_DOMAINS.map((d) => domainInput(d.code, [answer(`${d.code}-1`, adjusted, adjusted)])),
      );
      expect(score.maturityLevel).toBe(label);
    }
  });

  it("sixteen perfect domains → 100 / 100, Level 5, confidence 100", () => {
    const s = scoreAssessment(allDomainsPerfect());
    expect(s.rawScore).toBeCloseTo(100, 10);
    expect(s.applicableWeight).toBe(100);
    expect(s.coverage).toBe(1);
    expect(s.scoreCap).toBe(NO_SCORE_CAP);
    expect(s.finalScore).toBeCloseTo(100, 10);
    expect(s.maturityLevel).toBe("Level 5 - Continuous Assurance");
    expect(s.evidenceConfidence).toBe(100);
    expect(s.criticalCount).toBe(0);
    expect(s.highCount).toBe(0);
    expect(s.provisional).toBe(false);
    expect(s.engineVersion).toBe(ENGINE_VERSION);
  });

  it("final score = min(raw, cap) — a red flag caps a strong assessment", () => {
    const s = scoreAssessment(
      allDomainsPerfect().map((d) => (d.code === "CHILD" ? domainInput("CHILD", [answer("CH1.1", 2, 5)]) : d)),
    );
    expect(s.rawScore).toBeGreaterThan(50);
    expect(s.scoreCap).toBe(50);
    expect(s.finalScore).toBe(50);
    expect(s.redFlags.map((f) => f.code)).toEqual(["unreviewed_childrens_data"]);
  });

  it("the band follows the FINAL score, so a capped assessment is not reported as Level 5", () => {
    const s = scoreAssessment(
      allDomainsPerfect().map((d) => (d.code === "CHILD" ? domainInput("CHILD", [answer("CH1.1", 2, 5)]) : d)),
    );
    expect(s.maturityLevel).toBe("Level 2 - Defined"); // 50/100
  });

  it("returns the domains in the canonical D01…D16 order, whatever order they arrive in", () => {
    const shuffled = [...allDomainsPerfect()].reverse();
    expect(scoreAssessment(shuffled).domains.map((d) => d.domainId)).toEqual(
      DPDP_DOMAINS.map((d) => d.domainId),
    );
  });

  it("refuses a duplicated domain rather than double-counting its weight", () => {
    const domains = allDomainsPerfect();
    expect(() => scoreAssessment([...domains, domains[0]!])).toThrow(ScoringInputError);
  });

  describe("an empty domain leaves the denominator (D-038)", () => {
    const scopedOutVendor = () =>
      allDomainsPerfect().map((d) => (d.code === "VENDOR" ? { ...d, questionCount: 0, responses: [] } : d));

    it("scoped out → the denominator is 93, not renormalised to 100", () => {
      const s = scoreAssessment(scopedOutVendor());
      expect(s.applicableWeight).toBe(93);
      expect(s.rawScore).toBeCloseTo(93, 10);
      expect(s.coverage).toBeCloseTo(0.93, 10);
      expect(s.domains.find((d) => d.code === "VENDOR")!.state).toBe("scoped_out");
    });

    /**
     * The two wrong answers this rules out. Scoring the domain zero out of a
     * flat 100 would report 93% — punishing the client for a risk surface it
     * does not have. Renormalising the other fifteen weights back to 100 would
     * report 100% and hide that the scope changed at all. The right answer is
     * a perfect 93 out of a visible 93.
     */
    it("a scoped-out domain is neither scored zero nor renormalised away", () => {
      const s = scoreAssessment(scopedOutVendor());
      expect(s.domains.find((d) => d.code === "VENDOR")!.score).toBeNull();
      expect(s.finalScore).toBeCloseTo(93, 10);
      expect(s.applicableWeight).toBe(93);
      expect(s.finalScore / s.applicableWeight).toBeCloseTo(1, 10);
      expect(s.finalScore / 100).toBeCloseTo(0.93, 10); // what scoring it zero would have reported
      expect(s.maturityLevel).toBe("Level 5 - Continuous Assurance");
      expect(s.coverage).toBeCloseTo(0.93, 10); // and the coverage line says so
    });

    it("all-Not-Applicable does the same, with a DIFFERENT state", () => {
      const s = scoreAssessment(
        allDomainsPerfect().map((d) => (d.code === "VENDOR" ? domainInput("VENDOR", [naAnswer("V1.1")]) : d)),
      );
      expect(s.applicableWeight).toBe(93);
      expect(s.domains.find((d) => d.code === "VENDOR")!.state).toBe("all_not_applicable");
    });

    it("an empty domain does not drag the confidence average to zero (§4.4.3)", () => {
      expect(scoreAssessment(scopedOutVendor()).evidenceConfidence).toBe(100);
      expect(overallEvidenceConfidence(scopedOutVendor().map((d) => scoreDomain(d)))).toBe(100);
    });

    it("overall confidence is the mean of DOMAIN confidences, not of questions", () => {
      // GOV: two answers at E5 and E0 → 50%. Everything else: one answer at E5 → 100%.
      // Per domain: (50 + 15×100)/16 = 96.875. Per question: (17×5 - 5)/17/5 → 94.1%.
      const s = scoreAssessment(
        allDomainsPerfect().map((d) =>
          d.code === "GOV" ? domainInput("GOV", [answer("G1.1", 5, 5), answer("G1.2", 5, 0)]) : d,
        ),
      );
      expect(s.evidenceConfidence).toBeCloseTo(96.875, 10);
    });
  });

  it("counts outstanding questions across every domain and marks the total provisional", () => {
    const s = scoreAssessment(
      allDomainsPerfect().map((d) => (d.code === "GOV" ? { ...d, questionCount: 4 } : d)),
    );
    expect(s.outstandingCount).toBe(3);
    expect(s.provisional).toBe(true);
  });

  it("a question moves exactly ONE domain score — the snapshot names one domain (D-029.2)", () => {
    const base = scoreAssessment(allDomainsPerfect());
    const weakened = scoreAssessment(
      allDomainsPerfect().map((d) => (d.code === "SECURITY" ? domainInput("SECURITY", [answer("S1.1", 0, 0)]) : d)),
    );
    const moved = base.domains.filter(
      (d) => d.score !== weakened.domains.find((w) => w.code === d.code)!.score,
    );
    expect(moved.map((d) => d.code)).toEqual(["SECURITY"]);
  });

  it("uses the SNAPSHOT weight it is given, so a later rebalance cannot rewrite a score", () => {
    // GOV rebalanced 7 → 9 in dpdp_domains; the snapshot still says 7.
    const snapshot = scoreAssessment(allDomainsPerfect());
    const rebalanced = scoreAssessment(
      allDomainsPerfect().map((d) => (d.code === "GOV" ? { ...d, weight: 9 } : d)),
    );
    expect(snapshot.domains.find((d) => d.code === "GOV")!.score).toBe(7);
    expect(rebalanced.domains.find((d) => d.code === "GOV")!.score).toBe(9);
    expect(snapshot.applicableWeight).toBe(100);
  });
});
