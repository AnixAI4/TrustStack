import { describe, expect, it } from "vitest";
import {
  allowedAnswers,
  answerProblem,
  assessmentOutOfDate,
  canReviewAssessment,
  consistencyFlags,
  defaultReviewBy,
  missingAnswers,
  reviewByProblem,
  SCORED_VENDOR_QUESTIONS,
  VENDOR_CONSISTENCY_RULES,
  VENDOR_QUESTION_SECTIONS,
  VENDOR_QUESTIONS,
  vendorContractGap,
  vendorQuestion,
  vendorRisk,
  vendorRiskTier,
  isVendorLinkToken,
  VENDOR_ASSESSMENT_SOURCE_LABEL,
  VENDOR_ASSESSMENT_SOURCES,
  VENDOR_LINK_LIMITS,
  vendorLinkPath,
  vendorLinkState,
  VENDOR_SECTION_VOICE,
  VENDOR_VOICE,
  vendorSectionVoice,
  vendorVoice,
  type ScoredVendorAnswer,
  type VendorRegisterFacts,
} from "./vendors.js";

/** The answer that carries no risk, documented where a document is needed. */
function safe(code: string): ScoredVendorAnswer {
  const q = vendorQuestion(code)!;
  if (q.type === "select") return { code, answer: q.options!.find((o) => o.riskTenths === 0)!.value, notApplicable: false, documented: false };
  return { code, answer: q.riskyAnswer === "no" ? "yes" : "no", notApplicable: false, documented: q.document !== undefined };
}
function risky(code: string): ScoredVendorAnswer {
  const q = vendorQuestion(code)!;
  if (q.type === "select") return { code, answer: q.options!.find((o) => o.riskTenths === 10)!.value, notApplicable: false, documented: false };
  return { code, answer: q.riskyAnswer ?? "no", notApplicable: false, documented: false };
}

const REGISTER: VendorRegisterFacts = { role: "data_processor", contractExists: "yes", dpdpClauses: "yes", crossBorder: "no", subProcessorsKnown: "yes" };

describe("the questionnaire (the old bank, as data)", () => {
  it("is forty-five questions in seven sections, codes unique, A1 informational", () => {
    expect(VENDOR_QUESTIONS).toHaveLength(45);
    expect(new Set(VENDOR_QUESTIONS.map((q) => q.code)).size).toBe(45);
    expect(new Set(VENDOR_QUESTIONS.map((q) => q.section))).toEqual(new Set(VENDOR_QUESTION_SECTIONS));
    expect(SCORED_VENDOR_QUESTIONS).toHaveLength(44);
    expect(VENDOR_QUESTIONS.filter((q) => q.weight === 0).map((q) => q.code)).toEqual(["A1"]);
    // The old sections' sizes: A6 B7 C8 D6 E6 F6 G6.
    expect(VENDOR_QUESTION_SECTIONS.map((s) => VENDOR_QUESTIONS.filter((q) => q.section === s).length)).toEqual([6, 7, 8, 6, 6, 6, 6]);
  });

  it("names exactly five answers a document must back", () => {
    expect(VENDOR_QUESTIONS.filter((q) => q.document).map((q) => q.code)).toEqual(["A3", "A4", "C4", "D2", "G1"]);
    // A document backs a control that EXISTS — never a risky practice.
    for (const q of VENDOR_QUESTIONS.filter((x) => x.document)) expect(q.riskyAnswer).toBe("no");
  });

  it("scores each option in whole tenths, 0–10, with one option at no risk and one at full", () => {
    for (const q of VENDOR_QUESTIONS.filter((x) => x.type === "select")) {
      for (const o of q.options!) expect(Number.isInteger(o.riskTenths) && o.riskTenths >= 0 && o.riskTenths <= 10, `${q.code} ${o.value}`).toBe(true);
      expect(q.options!.some((o) => o.riskTenths === 0) && q.options!.some((o) => o.riskTenths === 10), q.code).toBe(true);
    }
    for (const q of VENDOR_QUESTIONS.filter((x) => x.type === "yes_no" || x.type === "yes_no_partial")) expect(q.riskyAnswer, q.code).toBeDefined();
  });

  it("accepts each type's answers and nothing else", () => {
    expect(allowedAnswers(vendorQuestion("A3")!)).toEqual(["yes", "no"]);
    expect(allowedAnswers(vendorQuestion("A4")!)).toEqual(["yes", "no", "partial"]);
    expect(allowedAnswers(vendorQuestion("E2")!)).toEqual(["india", "apac", "eu", "us", "global"]);
    expect(allowedAnswers(vendorQuestion("A1")!)).toBeNull();
    expect(answerProblem({ code: "A3", answer: "yes", notApplicable: false, naReason: null })).toBeNull();
    expect(answerProblem({ code: "A3", answer: "partial", notApplicable: false, naReason: null })).toMatch(/not one of its answers/);
    expect(answerProblem({ code: "A3", answer: null, notApplicable: false, naReason: null })).toMatch(/give an answer/);
    expect(answerProblem({ code: "Z9", answer: "yes", notApplicable: false, naReason: null })).toMatch(/not a question/);
    expect(answerProblem({ code: "A1", answer: "x".repeat(501), notApplicable: false, naReason: null })).toMatch(/at most 500/);
  });

  it("asks a reason for every 'not applicable', and none on an unscored question", () => {
    expect(answerProblem({ code: "D3", answer: null, notApplicable: true, naReason: "No sub-processors are engaged." })).toBeNull();
    expect(answerProblem({ code: "D3", answer: null, notApplicable: true, naReason: " " })).toMatch(/say why/);
    expect(answerProblem({ code: "D3", answer: "yes", notApplicable: true, naReason: "x" })).toMatch(/carries no answer/);
    expect(answerProblem({ code: "A1", answer: null, notApplicable: true, naReason: "x" })).toMatch(/not scored/);
  });
});

describe("complete (4a.4.1): every scored question answered or not applicable", () => {
  it("lists what is missing, in the bank's order, and never A1", () => {
    expect(missingAnswers([])).toEqual(SCORED_VENDOR_QUESTIONS.map((q) => q.code));
    const all = SCORED_VENDOR_QUESTIONS.map((q) => safe(q.code));
    expect(missingAnswers(all)).toEqual([]);
    expect(missingAnswers(all.filter((a) => a.code !== "G6"))).toEqual(["G6"]);
    expect(missingAnswers([...all.filter((a) => a.code !== "D3"), { code: "D3", answer: null, notApplicable: true }])).toEqual([]);
    expect(missingAnswers([...all.filter((a) => a.code !== "D3"), { code: "D3", answer: "", notApplicable: false }])).toEqual(["D3"]);
  });
});

describe("the risk score — TrustStack's indicator, higher is riskier", () => {
  it("is 0 with every control in place, 100 with none, and null before any answer", () => {
    expect(vendorRisk(SCORED_VENDOR_QUESTIONS.map((q) => safe(q.code)))).toMatchObject({ score: 0, tier: "low", answered: 44, unevidenced: [] });
    expect(vendorRisk(SCORED_VENDOR_QUESTIONS.map((q) => risky(q.code)))).toMatchObject({ score: 100, tier: "critical" });
    expect(vendorRisk([])).toMatchObject({ score: null, tier: null, answered: 0, scorable: 44 });
  });

  it("scores a partial as half, and a risky practice by its risky answer", () => {
    expect(vendorRisk([{ code: "B4", answer: "partial", notApplicable: false, documented: false }]).score).toBe(50);
    expect(vendorRisk([{ code: "B5", answer: "yes", notApplicable: false, documented: false }]).score).toBe(100);
    expect(vendorRisk([{ code: "B5", answer: "no", notApplicable: false, documented: false }]).score).toBe(0);
    expect(vendorRisk([{ code: "B1", answer: "100kto1m", notApplicable: false, documented: false }]).score).toBe(70);
  });

  it("evidence-backed (4a.4.2): a claim with no document cited scores as the risky answer, and says so", () => {
    const claimed = { code: "A3", answer: "yes", notApplicable: false, documented: false };
    expect(vendorRisk([claimed])).toMatchObject({ score: 100, unevidenced: ["A3"] });
    expect(vendorRisk([{ ...claimed, documented: true }])).toMatchObject({ score: 0, unevidenced: [] });
    // A partial claim needs the document too; a "no" needs none (it claims nothing).
    expect(vendorRisk([{ code: "C4", answer: "partial", notApplicable: false, documented: false }])).toMatchObject({ score: 100, unevidenced: ["C4"] });
    expect(vendorRisk([{ code: "C4", answer: "partial", notApplicable: false, documented: true }]).score).toBe(50);
    expect(vendorRisk([{ code: "G1", answer: "no", notApplicable: false, documented: false }])).toMatchObject({ score: 100, unevidenced: [] });
    // A question that needs no document ignores the flag.
    expect(vendorRisk([{ code: "C1", answer: "yes", notApplicable: false, documented: false }]).score).toBe(0);
  });

  it("leaves a 'not applicable' out of the denominator", () => {
    const r = vendorRisk([risky("C1"), { code: "D3", answer: null, notApplicable: true, documented: false }]);
    expect(r).toMatchObject({ score: 100, answered: 1, notApplicable: 1 });
  });

  it("rounds half up, in whole numbers (6 of 400 tenths = 1.5% → 2)", () => {
    const answers = ["C1", "C2", "A3", "B2", "B5", "D3", "E1", "F1", "F4", "G1", "G2", "G3", "A2"].map(safe);
    answers.push({ code: "F2", answer: "le48", notApplicable: false, documented: false });
    expect(vendorRisk(answers).score).toBe(2);
  });

  it("tiers at the old app's boundaries", () => {
    expect([0, 25, 26, 50, 51, 75, 76, 100].map(vendorRiskTier)).toEqual(["low", "low", "medium", "medium", "high", "high", "critical", "critical"]);
  });
});

describe("consistency checks (4a.4.3) — flagged, never resolved", () => {
  const flags = (answers: Record<string, string>, register: Partial<VendorRegisterFacts> = {}) =>
    consistencyFlags(
      Object.entries(answers).map(([code, answer]) => ({ code, answer, notApplicable: false })),
      { ...REGISTER, ...register },
    ).map((f) => f.code);

  it("flags each rule, and nothing on agreeing answers", () => {
    expect(flags({ E1: "yes", E2: "india", D1: "yes", D6: "no", G1: "yes" })).toEqual([]);
    expect(flags({ E1: "yes" }, { crossBorder: "yes" })).toEqual(["stored_in_india_vs_register"]);
    expect(flags({ E1: "no" })).toEqual(["outside_india_vs_register"]);
    expect(flags({ D6: "yes" })).toEqual(["outside_india_vs_register"]);
    expect(flags({ E1: "yes", E2: "us" })).toEqual(["outside_india_vs_register", "storage_answers_disagree"]);
    expect(flags({ D1: "no" }, { subProcessorsKnown: "no" })).toEqual(["no_subprocessors_vs_register"]);
    expect(flags({ G1: "yes" }, { dpdpClauses: "unknown" })).toEqual(["contract_vs_register"]);
    expect(flags({ G1: "no" })).toEqual(["no_contract_vs_register"]);
    expect(flags({}, { role: "independent" })).toEqual(["independent_not_processor"]);
  });

  it("reads an answer marked not applicable as no answer", () => {
    expect(consistencyFlags([{ code: "E1", answer: null, notApplicable: true }], { ...REGISTER, crossBorder: "yes" })).toEqual([]);
  });

  it("every rule names real questions and a message", () => {
    for (const r of VENDOR_CONSISTENCY_RULES) {
      for (const c of r.questions) expect(vendorQuestion(c), `${r.code}: ${c}`).toBeDefined();
      expect(r.message.length).toBeGreaterThan(20);
    }
  });
});

describe("the register's facts the model reads (1.4.0)", () => {
  it("a contract gap is the ROPA rule's test: not independent, contract or clauses not 'yes'", () => {
    expect(vendorContractGap({ role: "data_processor", contractExists: "yes", dpdpClauses: "yes" })).toBe(false);
    expect(vendorContractGap({ role: "data_processor", contractExists: "yes", dpdpClauses: "no" })).toBe(true);
    expect(vendorContractGap({ role: "unknown", contractExists: "unknown", dpdpClauses: "yes" })).toBe(true);
    expect(vendorContractGap({ role: "independent", contractExists: "no", dpdpClauses: "no" })).toBe(false);
  });

  it("current (4a.4.7): out of date strictly after the review-by date", () => {
    expect(assessmentOutOfDate("2026-10-13", "2026-10-13")).toBe(false);
    expect(assessmentOutOfDate("2026-10-13", "2026-10-14")).toBe(true);
    expect(assessmentOutOfDate(null, "2030-01-01")).toBe(false);
  });

  it("reviews by twelve months by default, clamped as Postgres clamps", () => {
    expect(defaultReviewBy("2026-10-13")).toBe("2027-10-13");
    expect(defaultReviewBy("2028-02-29")).toBe("2029-02-28");
    expect(reviewByProblem("2027-10-13", "2026-10-13")).toBeNull();
    expect(reviewByProblem("2026-10-13", "2026-10-13")).toMatch(/after today/);
    expect(reviewByProblem("2029-10-14", "2026-10-13")).toMatch(/at most 36 months/);
    expect(reviewByProblem("2029-10-13", "2026-10-13")).toBeNull();
    expect(reviewByProblem("2027-02-30", "2026-10-13")).toMatch(/calendar date/);
  });

  it("second person (4a.4.4): nobody who entered, answered or submitted it may review it", () => {
    expect(canReviewAssessment("u1", ["u1", null])).toBe(false);
    expect(canReviewAssessment("u2", ["u1", "u3", null])).toBe(true);
  });
});

describe("the vendor-facing link (Stage 4b)", () => {
  it("is a source, not a second table: staff or vendor, each labelled", () => {
    expect(VENDOR_ASSESSMENT_SOURCES).toEqual(["staff", "vendor"]);
    expect(VENDOR_ASSESSMENT_SOURCE_LABEL.vendor).toBe("Answered by the vendor");
  });

  it("mirrors app.vendor_link_limits(): fourteen days, ten documents", () => {
    expect(VENDOR_LINK_LIMITS.linkDays).toBe(14);
    expect(VENDOR_LINK_LIMITS.documentsPerLink).toBe(10);
  });

  it("takes only a 43-character base64url token", () => {
    expect(isVendorLinkToken("A".repeat(43))).toBe(true);
    expect(isVendorLinkToken("abc_DEF-123".padEnd(43, "x"))).toBe(true);
    expect(isVendorLinkToken("A".repeat(42))).toBe(false);
    expect(isVendorLinkToken("A".repeat(44))).toBe(false);
    expect(isVendorLinkToken(`${"A".repeat(42)}/`)).toBe(false);
    expect(vendorLinkPath("tok")).toBe("/v/tok");
  });

  it("says what state a link is in: used and revoked win over time; five wrong codes lock it", () => {
    const now = new Date("2026-10-14T10:00:00.000Z");
    const link = { revokedAt: null, submittedAt: null, expiresAt: "2026-10-28T10:00:00.000Z", wrongCodes: 0 };
    expect(vendorLinkState(link, now, 5)).toBe("open");
    expect(vendorLinkState({ ...link, wrongCodes: 4 }, now, 5)).toBe("open");
    expect(vendorLinkState({ ...link, wrongCodes: 5 }, now, 5)).toBe("locked");
    expect(vendorLinkState({ ...link, expiresAt: now.toISOString() }, now, 5)).toBe("expired");
    expect(vendorLinkState({ ...link, revokedAt: "2026-10-14T09:00:00.000Z", expiresAt: "2026-10-01T00:00:00.000Z" }, now, 5)).toBe("revoked");
    expect(vendorLinkState({ ...link, submittedAt: "2026-10-14T09:00:00.000Z" }, now, 5)).toBe("submitted");
  });

  it("the link's sender is among those who may not review (D-092)", () => {
    // `involved` carries creators, answerers, submitters and link senders alike.
    expect(canReviewAssessment("sender", ["creator", "sender"])).toBe(false);
    expect(canReviewAssessment("reviewer", ["creator", "sender"])).toBe(true);
  });
});

describe("the questions in the vendor's voice (Slice 10.5 B5, F5.5)", () => {
  it("covers every question and every section, and nothing else", () => {
    expect(Object.keys(VENDOR_VOICE).sort()).toEqual(VENDOR_QUESTIONS.map((q) => q.code).sort());
    expect(Object.keys(VENDOR_SECTION_VOICE).sort()).toEqual([...VENDOR_QUESTION_SECTIONS].sort());
  });

  it("speaks to the vendor: never \"they\", \"the vendor\" or \"our\"", () => {
    const all = [...Object.values(VENDOR_VOICE).flatMap((v) => [v.text, v.hint ?? ""]), ...Object.values(VENDOR_SECTION_VOICE)];
    for (const s of all) expect(s).not.toMatch(/\bthey\b|\btheir\b|\bthe vendor\b|\bour\b/i);
  });

  it("names the organisation and keeps the staff wording unchanged", () => {
    const g4 = vendorQuestion("G4")!;
    expect(vendorVoice(g4, "Mumbai University").text).toBe(
      "Do you process Mumbai University's data only on its documented instructions (no independent use)?",
    );
    expect(g4.text).toBe("Do they process data only on your documented instructions (no independent use)?");
    expect(vendorVoice(vendorQuestion("F2")!, "MU").hint).toBe(
      "The Rules give MU 72 hours for the detailed report to the Board (Rule 7(2)(b)); telling it sooner protects that window.",
    );
    // G1's hint is the law, unchanged.
    expect(vendorVoice(vendorQuestion("G1")!, "MU").hint).toBe(vendorQuestion("G1")!.hint);
    expect(vendorSectionVoice("data_handling", "MU")).toBe("What personal data you process for MU, and how.");
    for (const q of VENDOR_QUESTIONS) expect(vendorVoice(q, "MU").text).not.toContain("{org}");
  });
});
