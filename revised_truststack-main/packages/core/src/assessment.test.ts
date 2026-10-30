import { describe, expect, it } from "vitest";
import {
  generateAssessmentQuestions, REGENERABLE_STATUSES, summariseByDomain,
  type QuestionBank, type QuestionPack,
} from "./assessment.js";
import { DPDP_DOMAINS } from "./domains.js";
import { MANDATORY_NA_RULE, type Applicability, type QuestionRecord } from "./questions.js";
import { EMPTY_SCOPE } from "./scope.js";
import { describeTrigger, mapTriggerText, type ScopeFacts } from "./triggers.js";

const pack = (code: string, tier: QuestionPack["tier"], status: QuestionPack["status"] = "approved"): QuestionPack => ({
  code, tier, industryCode: null, name: code, version: "1.0", status, sourceFile: null,
});

interface QOpts {
  domain?: QuestionRecord["domainCode"];
  applicability?: Applicability;
  trigger?: string | null;
  priority?: QuestionRecord["priority"];
  status?: QuestionRecord["status"];
}

/** Mirrors the loader: the trigger expression is attached, and applicability resolved. */
function question(code: string, packCode: string, o: QOpts = {}): QuestionRecord {
  const triggerText = o.trigger ?? null;
  const triggerCondition = mapTriggerText(triggerText);
  const authored = o.applicability ?? (triggerText ? "conditional" : "mandatory");
  return {
    questionCode: code,
    questionText: `Question ${code}`,
    packCode,
    sourceTag: "core",
    domainCode: o.domain ?? "GOV",
    secondaryDomainCodes: [],
    applicability:
      authored === "conditional" && triggerCondition === null ? "potentially_applicable" : authored,
    typeText: null,
    triggerText,
    triggerCondition,
    riskTags: [],
    evidenceGuidance: `Evidence for ${code}`,
    riskIfWeak: null,
    suggestedOwner: "Owner",
    priority: o.priority ?? null,
    criticality: null,
    legalControlBasis: null,
    recommendedFix: null,
    truststackModule: null,
    naRule: MANDATORY_NA_RULE,
    version: "1.0",
    status: o.status ?? "draft",
    sourceRef: null,
  };
}

const FACTS: ScopeFacts = {
  industryCode: "university",
  riskTags: ["children_data"],
  aiUsageTypes: ["proctoring"],
  systemTypes: ["lms"],
  dataPrincipalCodes: ["student"],
  vendorRoles: ["data_processor"],
  answers: EMPTY_SCOPE,
  processingScale: "normal",
  vendorDependency: "limited",
};

describe("generateAssessmentQuestions — inclusion", () => {
  const bank: QuestionBank = {
    packs: [pack("CORE", "core"), pack("OVER", "overlay")],
    questions: [
      question("CORE-001", "CORE"),
      question("CORE-002", "CORE", { trigger: "vendors exist" }),
      question("CORE-003", "CORE", { trigger: "placements" }),
      question("OVER-001", "OVER"),
      question("OVER-002", "OVER", { trigger: "LMS used" }),
      question("OVER-003", "OVER", { trigger: "research" }),
    ],
  };

  it("labels each question with why it is there", () => {
    const { questions } = generateAssessmentQuestions(bank, ["CORE", "OVER"], FACTS);
    const reasons = new Map(questions.map((q) => [q.questionCode, q.includedReason]));
    expect(reasons.get("CORE-001")).toBe("core");
    expect(reasons.get("OVER-001")).toBe("overlay");
    expect(reasons.get("CORE-002")).toBe(`trigger:${describeTrigger(mapTriggerText("vendors exist")!)}`);
    expect(reasons.get("OVER-002")).toBe("trigger:systemTypes contains lms");
    expect(reasons.get("CORE-003")).toBe("potentially_applicable");
  });

  it("excludes a question whose trigger is false, and says which and why", () => {
    const result = generateAssessmentQuestions(bank, ["CORE", "OVER"], FACTS);
    expect(result.questions.map((q) => q.questionCode)).not.toContain("OVER-003");
    expect(result.excludedByTrigger).toEqual([
      {
        questionCode: "OVER-003",
        triggerText: "research",
        expression: "dataPrincipalCodes contains research_participant",
      },
    ]);
  });

  it("an unmappable condition is INCLUDED as Potentially Applicable, never dropped (D-029.3)", () => {
    const result = generateAssessmentQuestions(bank, ["CORE", "OVER"], FACTS);
    const pa = result.questions.find((q) => q.questionCode === "CORE-003");
    expect(pa).toBeDefined();
    expect(pa!.applicability).toBe("potentially_applicable");
    expect(result.coverage.unresolved).toBe(1);
    expect(result.coverage.unresolvedPhrases).toEqual(["placements"]);
    // `mapped` counts conditions we could EVALUATE, including OVER-003's,
    // which evaluated false and excluded its question. Coverage is about the
    // mapping table, not about what ended up in this one assessment.
    expect(result.coverage.mapped).toBe(3);
  });

  it("counts a bare 'Conditional' with no condition at all", () => {
    const vague: QuestionBank = {
      packs: [pack("CORE", "core")],
      questions: [question("CORE-900", "CORE", { applicability: "potentially_applicable", trigger: null })],
    };
    const { coverage, questions } = generateAssessmentQuestions(vague, ["CORE"], FACTS);
    expect(questions).toHaveLength(1);
    expect(coverage.unresolved).toBe(1);
    expect(coverage.unstatedConditions).toBe(1);
    expect(coverage.unresolvedPhrases).toEqual([]);
  });

  it("skips a retired question without skipping its pack", () => {
    const withRetired: QuestionBank = {
      packs: [pack("CORE", "core")],
      questions: [question("CORE-001", "CORE"), question("CORE-OLD", "CORE", { status: "retired" })],
    };
    const { questions } = generateAssessmentQuestions(withRetired, ["CORE"], FACTS);
    expect(questions.map((q) => q.questionCode)).toEqual(["CORE-001"]);
  });
});

describe("generateAssessmentQuestions — packs", () => {
  it("refuses a pack that is not approved, and says so", () => {
    const bank: QuestionBank = {
      packs: [pack("CORE", "core"), pack("DRAFTY", "overlay", "draft")],
      questions: [question("CORE-001", "CORE"), question("DRAFT-001", "DRAFTY")],
    };
    const result = generateAssessmentQuestions(bank, ["CORE", "DRAFTY"], FACTS);
    expect(result.questions.map((q) => q.questionCode)).toEqual(["CORE-001"]);
    expect(result.skippedPacks).toEqual([{ code: "DRAFTY", reason: "not_approved" }]);
    expect(result.packCodes).toEqual(["CORE"]);
  });

  it("never generates from a reference pack, however approved it is", () => {
    const bank: QuestionBank = {
      packs: [pack("CORE", "core"), pack("REF", "reference")],
      questions: [question("CORE-001", "CORE"), question("REF-001", "REF")],
    };
    const result = generateAssessmentQuestions(bank, ["CORE", "REF"], FACTS);
    expect(result.questions.map((q) => q.questionCode)).toEqual(["CORE-001"]);
    expect(result.skippedPacks).toEqual([{ code: "REF", reason: "reference_pack" }]);
  });

  it("reports an empty pack and an unknown pack code separately", () => {
    const bank: QuestionBank = {
      packs: [pack("CORE", "core"), pack("EMPTY", "conditional")],
      questions: [question("CORE-001", "CORE")],
    };
    const result = generateAssessmentQuestions(bank, ["CORE", "EMPTY", "NOT_A_PACK"], FACTS);
    expect(result.skippedPacks).toEqual([
      { code: "EMPTY", reason: "no_questions" },
      { code: "NOT_A_PACK", reason: "unknown_pack" },
    ]);
  });

  it("a pack whose every question is excluded by a trigger is reported, not silently used", () => {
    const bank: QuestionBank = {
      packs: [pack("CORE", "core"), pack("COND", "conditional")],
      questions: [question("CORE-001", "CORE"), question("COND-001", "COND", { trigger: "research" })],
    };
    const result = generateAssessmentQuestions(bank, ["CORE", "COND"], FACTS);
    expect(result.packCodes).toEqual(["CORE"]);
    expect(result.skippedPacks).toEqual([{ code: "COND", reason: "no_questions" }]);
  });

  it("the first pack to carry a code wins, so an overlay never duplicates a core question", () => {
    const bank: QuestionBank = {
      packs: [pack("CORE", "core"), pack("OVER", "overlay")],
      questions: [question("SHARED-1", "CORE"), question("SHARED-1", "OVER"), question("OVER-001", "OVER")],
    };
    const result = generateAssessmentQuestions(bank, ["CORE", "OVER"], FACTS);
    const codes = result.questions.map((q) => q.questionCode);
    expect(codes).toEqual(["OVER-001", "SHARED-1"]);
    expect(new Set(codes).size).toBe(codes.length);
    expect(result.questions.find((q) => q.questionCode === "SHARED-1")!.packCode).toBe("CORE");
    expect(result.questions.find((q) => q.questionCode === "SHARED-1")!.includedReason).toBe("core");
  });
});

describe("generateAssessmentQuestions — the snapshot rows", () => {
  const bank: QuestionBank = {
    packs: [pack("CORE", "core")],
    questions: [
      question("SEC-1", "CORE", { domain: "SECURITY", priority: "P0" }),
      question("GOV-1", "CORE", { domain: "GOV" }),
      question("GOV-2", "CORE", { domain: "GOV" }),
      question("SDF-1", "CORE", { domain: "SDF_AI" }),
    ],
  };

  it("orders by domain sort order, then question code, and numbers sort_order from 1", () => {
    const { questions } = generateAssessmentQuestions(bank, ["CORE"], FACTS);
    expect(questions.map((q) => q.questionCode)).toEqual(["GOV-1", "GOV-2", "SEC-1", "SDF-1"]);
    expect(questions.map((q) => q.sortOrder)).toEqual([1, 2, 3, 4]);
  });

  it("is deterministic: the same inputs give byte-identical output", () => {
    const a = generateAssessmentQuestions(bank, ["CORE"], FACTS);
    const b = generateAssessmentQuestions(bank, ["CORE"], FACTS);
    expect(JSON.stringify(a.questions)).toBe(JSON.stringify(b.questions));
  });

  it("is deterministic regardless of the order the bank hands over its questions", () => {
    const shuffled: QuestionBank = { ...bank, questions: [...bank.questions].reverse() };
    const a = generateAssessmentQuestions(bank, ["CORE"], FACTS);
    const b = generateAssessmentQuestions(shuffled, ["CORE"], FACTS);
    expect(JSON.stringify(a.questions)).toBe(JSON.stringify(b.questions));
  });

  it("COPIES the text, domain and weight — the row is a snapshot, not a reference", () => {
    const { questions } = generateAssessmentQuestions(bank, ["CORE"], FACTS);
    const security = questions.find((q) => q.questionCode === "SEC-1")!;
    expect(security.questionText).toBe("Question SEC-1");
    expect(security.domainCode).toBe("SECURITY");
    expect(security.domainWeight).toBe(10);
    expect(security.questionVersion).toBe("1.0");
    expect(security.priority).toBe("P0");
    expect(security.evidenceGuidance).toBe("Evidence for SEC-1");
  });

  it("carries the weight from the model, not from the question", () => {
    const { questions } = generateAssessmentQuestions(bank, ["CORE"], FACTS);
    for (const q of questions) {
      expect(q.domainWeight).toBe(DPDP_DOMAINS.find((d) => d.code === q.domainCode)!.weight);
    }
  });

  it("only a draft may be regenerated", () => {
    expect(REGENERABLE_STATUSES).toEqual(["draft"]);
  });
});

describe("summariseByDomain", () => {
  it("groups in report order and counts the Potentially Applicable ones separately", () => {
    const bank: QuestionBank = {
      packs: [pack("CORE", "core")],
      questions: [
        question("SDF-1", "CORE", { domain: "SDF_AI" }),
        question("GOV-1", "CORE", { domain: "GOV" }),
        question("GOV-2", "CORE", { domain: "GOV", trigger: "placements" }),
      ],
    };
    const { questions } = generateAssessmentQuestions(bank, ["CORE"], FACTS);
    expect(summariseByDomain(questions)).toEqual([
      { domainCode: "GOV", weight: 7, questionCount: 2, potentiallyApplicableCount: 1 },
      { domainCode: "SDF_AI", weight: 4, questionCount: 1, potentiallyApplicableCount: 0 },
    ]);
  });

  it("omits a domain with no questions rather than reporting a zero", () => {
    expect(summariseByDomain([])).toEqual([]);
  });
});
