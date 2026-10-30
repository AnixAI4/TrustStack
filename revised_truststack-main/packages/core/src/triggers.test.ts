import { describe, expect, it } from "vitest";
import { EMPTY_SCOPE, type RiskInput } from "./scope.js";
import {
  describeTrigger, evaluateTrigger, MAPPED_TRIGGER_PHRASES, mapTriggerText, scopeFactsFrom,
  TRIGGER_FIELDS, UnknownTriggerFieldError, type ScopeFacts, type TriggerCondition,
} from "./triggers.js";

const BASE: ScopeFacts = {
  industryCode: "university",
  riskTags: [],
  aiUsageTypes: [],
  systemTypes: [],
  dataPrincipalCodes: [],
  vendorRoles: [],
  answers: EMPTY_SCOPE,
  processingScale: "normal",
  vendorDependency: "none",
};

const facts = (overrides: Partial<ScopeFacts> = {}): ScopeFacts => ({ ...BASE, ...overrides });
const evaluate = (condition: TriggerCondition, overrides: Partial<ScopeFacts> = {}) =>
  evaluateTrigger(condition, facts(overrides));

describe("evaluateTrigger — the operator truth table", () => {
  it("equals, on a scalar", () => {
    expect(evaluate({ field: "industryCode", operator: "equals", value: "university" })).toBe(true);
    expect(evaluate({ field: "industryCode", operator: "equals", value: "bfsi" })).toBe(false);
    expect(evaluate({ field: "processingScale", operator: "equals", value: "large_scale" })).toBe(false);
    expect(
      evaluate({ field: "processingScale", operator: "equals", value: "large_scale" }, { processingScale: "large_scale" }),
    ).toBe(true);
  });

  it("equals, on a boolean answer", () => {
    expect(evaluate({ field: "answers.multiLocation", operator: "equals", value: true })).toBe(false);
    expect(
      evaluate({ field: "answers.multiLocation", operator: "equals", value: true }, {
        answers: { ...EMPTY_SCOPE, multiLocation: true },
      }),
    ).toBe(true);
  });

  it("contains, on an array field", () => {
    expect(evaluate({ field: "systemTypes", operator: "contains", value: "lms" })).toBe(false);
    expect(evaluate({ field: "systemTypes", operator: "contains", value: "lms" }, { systemTypes: ["lms", "exam"] })).toBe(true);
    expect(evaluate({ field: "systemTypes", operator: "contains", value: "cctv" }, { systemTypes: ["lms"] })).toBe(false);
  });

  it("contains is false on a scalar field — it never coerces", () => {
    expect(evaluate({ field: "industryCode", operator: "contains", value: "university" })).toBe(false);
  });

  it("in, with an array of allowed values, against an array field", () => {
    const anyOf: TriggerCondition = { field: "systemTypes", operator: "in", value: ["cctv", "biometric"] };
    expect(evaluate(anyOf)).toBe(false);
    expect(evaluate(anyOf, { systemTypes: ["biometric"] })).toBe(true);
    expect(evaluate(anyOf, { systemTypes: ["lms", "cctv"] })).toBe(true);
    expect(evaluate(anyOf, { systemTypes: ["lms"] })).toBe(false);
  });

  it("in, against a scalar field", () => {
    const tri: TriggerCondition = { field: "answers.crossBorder", operator: "in", value: ["yes", "unknown"] };
    expect(evaluate(tri)).toBe(false);
    expect(evaluate(tri, { answers: { ...EMPTY_SCOPE, crossBorder: "unknown" } })).toBe(true);
    expect(evaluate(tri, { answers: { ...EMPTY_SCOPE, crossBorder: "yes" } })).toBe(true);
  });

  it("in, with a single value rather than an array", () => {
    expect(evaluate({ field: "industryCode", operator: "in", value: "university" })).toBe(true);
    expect(evaluate({ field: "industryCode", operator: "in", value: "bfsi" })).toBe(false);
  });

  it("exists: an empty array does NOT exist; a non-empty one does", () => {
    expect(evaluate({ field: "riskTags", operator: "exists" })).toBe(false);
    expect(evaluate({ field: "riskTags", operator: "exists" }, { riskTags: ["children_data"] })).toBe(true);
    expect(evaluate({ field: "industryCode", operator: "exists" })).toBe(true);
    expect(evaluate({ field: "industryCode", operator: "exists" }, { industryCode: "" })).toBe(false);
  });
});

describe("evaluateTrigger — all / any", () => {
  const children: TriggerCondition = { field: "riskTags", operator: "contains", value: "children_data" };
  const ai: TriggerCondition = { field: "riskTags", operator: "contains", value: "ai_processing" };

  it("all is true only when every branch is", () => {
    expect(evaluate({ all: [children, ai] })).toBe(false);
    expect(evaluate({ all: [children, ai] }, { riskTags: ["children_data"] })).toBe(false);
    expect(evaluate({ all: [children, ai] }, { riskTags: ["children_data", "ai_processing"] })).toBe(true);
  });

  it("any is true as soon as one branch is", () => {
    expect(evaluate({ any: [children, ai] })).toBe(false);
    expect(evaluate({ any: [children, ai] }, { riskTags: ["ai_processing"] })).toBe(true);
  });

  it("nests to any depth", () => {
    const nested: TriggerCondition = {
      all: [children, { any: [ai, { field: "systemTypes", operator: "contains", value: "lms" }] }],
    };
    expect(evaluate(nested, { riskTags: ["children_data"] })).toBe(false);
    expect(evaluate(nested, { riskTags: ["children_data"], systemTypes: ["lms"] })).toBe(true);
    expect(evaluate(nested, { riskTags: ["children_data", "ai_processing"] })).toBe(true);
  });

  it("an empty all passes (nothing failed); an empty any does not (nothing passed)", () => {
    expect(evaluate({ all: [] })).toBe(true);
    expect(evaluate({ any: [] })).toBe(false);
  });
});

describe("evaluateTrigger — an unknown field is an authoring error, not a silent false", () => {
  it("throws, so a bad expression is caught at seed time and never on a client's screen", () => {
    expect(() => evaluate({ field: "answers.doesNotExist" as never, operator: "exists" })).toThrow(
      UnknownTriggerFieldError,
    );
  });

  it("every declared field is actually readable", () => {
    for (const field of TRIGGER_FIELDS) {
      expect(() => evaluate({ field, operator: "exists" })).not.toThrow();
    }
  });
});

describe("mapTriggerText — a reviewed table, never NLP", () => {
  it("returns null for anything unmapped, which is what makes a question Potentially Applicable", () => {
    expect(mapTriggerText(null)).toBeNull();
    expect(mapTriggerText("")).toBeNull();
    expect(mapTriggerText("placements conducted")).toBeNull();
    expect(mapTriggerText("NAD/DigiLocker used")).toBeNull();
    expect(mapTriggerText("something nobody has authored")).toBeNull();
  });

  it("is case- and whitespace-insensitive, and tolerates trailing punctuation", () => {
    for (const text of ["LMS used", "lms used", "  LMS   used  ", "LMS used."]) {
      expect(mapTriggerText(text)).not.toBeNull();
    }
  });

  it("maps the University phrases onto the Slice 2 scope", () => {
    expect(evaluateTrigger(mapTriggerText("LMS used")!, facts({ systemTypes: ["lms"] }))).toBe(true);
    expect(evaluateTrigger(mapTriggerText("LMS used")!, facts({ systemTypes: ["exam"] }))).toBe(false);
    expect(evaluateTrigger(mapTriggerText("AI proctoring")!, facts({ aiUsageTypes: ["proctoring"] }))).toBe(true);
    expect(evaluateTrigger(mapTriggerText("AI proctoring")!, facts({ aiUsageTypes: ["chatbot"] }))).toBe(false);
    expect(evaluateTrigger(mapTriggerText("minors")!, facts({ riskTags: ["children_data"] }))).toBe(true);
    expect(evaluateTrigger(mapTriggerText("alumni database")!, facts({ dataPrincipalCodes: ["alumni"] }))).toBe(true);
    expect(
      evaluateTrigger(mapTriggerText("research")!, facts({ dataPrincipalCodes: ["research_participant"] })),
    ).toBe(true);
    expect(
      evaluateTrigger(mapTriggerText("multi-campus/affiliated structure")!, facts({
        answers: { ...EMPTY_SCOPE, multiLocation: true },
      })),
    ).toBe(true);
  });

  it("'vendors exist': silence is not a denial (D-037)", () => {
    const condition = mapTriggerText("vendors exist")!;
    const answers = (usesDataProcessors: "yes" | "no" | "unknown") => ({ ...EMPTY_SCOPE, usesDataProcessors });

    // A recorded processor settles it, whatever was answered.
    expect(evaluateTrigger(condition, facts({ vendorRoles: ["data_processor"] }))).toBe(true);
    // So does saying yes, before anything is recorded.
    expect(evaluateTrigger(condition, facts({ answers: answers("yes") }))).toBe(true);
    // UNKNOWN fires too — an organisation that has not mapped its supply chain
    // has a finding, not an exemption. This is the case that used to vanish.
    expect(evaluateTrigger(condition, facts({ answers: answers("unknown") }))).toBe(true);
    // And an unanswered scope defaults to unknown, so it fires as well.
    expect(evaluateTrigger(condition, facts())).toBe(true);

    // ONLY an explicit no, with nothing in the register, suppresses it.
    expect(evaluateTrigger(condition, facts({ answers: answers("no") }))).toBe(false);
    expect(evaluateTrigger(condition, facts({ answers: answers("no"), vendorRoles: ["independent"] }))).toBe(false);
    // A register entry beats a "no" — the safe direction.
    expect(evaluateTrigger(condition, facts({ answers: answers("no"), vendorRoles: ["data_processor"] }))).toBe(true);
  });

  it("'minors + vendors' needs BOTH", () => {
    const condition = mapTriggerText("minors + vendors")!;
    const noProcessors = { ...EMPTY_SCOPE, usesDataProcessors: "no" as const };

    expect(evaluateTrigger(condition, facts({ riskTags: ["children_data"], answers: noProcessors }))).toBe(false);
    expect(evaluateTrigger(condition, facts({ vendorRoles: ["data_processor"] }))).toBe(false);
    expect(
      evaluateTrigger(condition, facts({ riskTags: ["children_data"], vendorRoles: ["data_processor"] })),
    ).toBe(true);
  });

  it("'cross-border' fires on a KNOWN transfer too, not only an unknown one (D-026)", () => {
    const condition = mapTriggerText("cross-border")!;
    expect(evaluateTrigger(condition, facts({ answers: { ...EMPTY_SCOPE, crossBorder: "yes" } }))).toBe(true);
    expect(evaluateTrigger(condition, facts({ answers: { ...EMPTY_SCOPE, crossBorder: "unknown" } }))).toBe(true);
    expect(evaluateTrigger(condition, facts({ riskTags: ["cross_border_unknown"] }))).toBe(true);
    expect(evaluateTrigger(condition, facts())).toBe(false);
  });

  it("every mapped phrase produces an expression that evaluates without throwing", () => {
    expect(MAPPED_TRIGGER_PHRASES.length).toBeGreaterThan(40);
    for (const phrase of MAPPED_TRIGGER_PHRASES) {
      const condition = mapTriggerText(phrase);
      expect(condition, phrase).not.toBeNull();
      expect(() => evaluateTrigger(condition!, facts()), phrase).not.toThrow();
    }
  });
});

describe("describeTrigger", () => {
  it("renders an expression a consultant can read in included_reason", () => {
    expect(describeTrigger({ field: "systemTypes", operator: "contains", value: "lms" })).toBe(
      "systemTypes contains lms",
    );
    expect(describeTrigger({ field: "systemTypes", operator: "in", value: ["cctv", "biometric"] })).toBe(
      "systemTypes in [cctv, biometric]",
    );
    expect(describeTrigger({ field: "riskTags", operator: "exists" })).toBe("riskTags exists");
    expect(
      describeTrigger({
        all: [
          { field: "riskTags", operator: "contains", value: "children_data" },
          { any: [{ field: "riskTags", operator: "contains", value: "ai_processing" }] },
        ],
      }),
    ).toBe("(riskTags contains children_data and (riskTags contains ai_processing))");
  });
});

describe("scopeFactsFrom — one derivation, shared by the seeder, the API and tests", () => {
  const university: RiskInput = {
    scope: { ...EMPTY_SCOPE, aiUsageTypes: ["proctoring"], childrenData: "yes", multiLocation: true },
    systems: [
      { name: "LMS", systemType: "lms", hostingModel: "saas", dataLocation: "unknown", processesChildrenData: "yes" },
      { name: "Exam", systemType: "exam", hostingModel: "on_premise", dataLocation: "india", processesChildrenData: "yes" },
    ],
    vendors: [
      { name: "LMS provider", vendorRole: "data_processor", crossBorder: "unknown" },
      { name: "Proctoring", vendorRole: "data_processor", crossBorder: "unknown" },
      { name: "Payments", vendorRole: "data_processor", crossBorder: "no" },
    ],
    dataPrincipalTypes: [
      { code: "student", label: "Students", includesChildren: "yes", estimatedCount: 300_000 },
      { code: "alumni", label: "Alumni", includesChildren: "no", estimatedCount: null },
    ],
    dataPrincipalCountEstimate: 500_000,
  };

  it("carries the derived scale and vendor tiers, so no trigger re-implements a threshold (D-028)", () => {
    const f = scopeFactsFrom("university", university);
    expect(f.processingScale).toBe("large_scale");
    expect(f.vendorDependency).toBe("vendor_dependent");
    expect(f.riskTags).toContain("children_data");
    expect(f.riskTags).toContain("large_scale_processing");
  });

  it("de-duplicates and sorts the register-derived facts, so generation is deterministic", () => {
    const f = scopeFactsFrom("university", university);
    expect(f.systemTypes).toEqual(["exam", "lms"]);
    expect(f.dataPrincipalCodes).toEqual(["alumni", "student"]);
    expect(f.vendorRoles).toEqual(["data_processor"]);
    expect(f.aiUsageTypes).toEqual(["proctoring"]);
  });

  it("an unknown or missing industry degrades to general, never to 'no industry'", () => {
    expect(scopeFactsFrom(null, university).industryCode).toBe("general");
    expect(scopeFactsFrom("not_an_industry", university).industryCode).toBe("general");
  });

  it("a threshold override flows all the way through", () => {
    const f = scopeFactsFrom("university", university, {
      vendorDependentThreshold: 99,
      complexVendorEcosystemThreshold: 100,
      elevatedScaleThreshold: 1_000_000,
      largeScaleProcessingThreshold: 10_000_000,
    });
    expect(f.processingScale).toBe("normal");
    // Still "limited": D-028's tiers put 1+ processors there whatever the
    // vendor-DEPENDENT threshold is. What the override moves is the tag.
    expect(f.vendorDependency).toBe("limited");
    expect(f.riskTags).not.toContain("large_scale_processing");
    expect(f.riskTags).not.toContain("high_vendor_dependency");
  });
});

describe("the vendor gate — an empty register is not a declaration (D-037)", () => {
  /**
   * `VENDOR` is the only core domain whose every question hangs off one
   * trigger, so this single answer decides whether a whole domain is assessed.
   * Before D-037 the trigger read the REGISTER, and an organisation that had
   * simply not mapped its processors lost the domain silently.
   */
  const answers = (usesDataProcessors: "yes" | "no" | "unknown") => ({ ...EMPTY_SCOPE, usesDataProcessors });
  const vendorPhrases = [
    "vendors", "processors", "processor vendors", "vendors process data",
    "vendor access", "vendor sharing", "vendor sub-processing", "vendor support", "vendors exist",
  ];

  it("every authored vendor phrase fires on unknown, and none fires on a documented no", () => {
    for (const phrase of vendorPhrases) {
      const condition = mapTriggerText(phrase);
      expect(condition, phrase).not.toBeNull();
      expect(evaluateTrigger(condition!, facts({ answers: answers("unknown") })), `${phrase} / unknown`).toBe(true);
      expect(evaluateTrigger(condition!, facts({ answers: answers("no") })), `${phrase} / no`).toBe(false);
    }
  });

  it("the default scope answers an organisation has never touched still fire it", () => {
    expect(EMPTY_SCOPE.usesDataProcessors).toBe("unknown");
    expect(evaluateTrigger(mapTriggerText("vendors exist")!, facts())).toBe(true);
  });

  it("scopeFactsFrom carries the answer through", () => {
    const input: RiskInput = {
      scope: { ...EMPTY_SCOPE, usesDataProcessors: "no" },
      systems: [],
      vendors: [],
      dataPrincipalTypes: [],
      dataPrincipalCountEstimate: null,
    };
    const f = scopeFactsFrom("general", input);
    expect(f.answers.usesDataProcessors).toBe("no");
    expect(evaluateTrigger(mapTriggerText("vendors exist")!, f)).toBe(false);
  });
});
