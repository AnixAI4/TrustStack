import { describe, expect, it } from "vitest";
import {
  assessScopeProfile,
  CORE_PACK_CODE,
  DEFAULT_RISK_TRIGGER_CONFIG,
  LARGE_SCALE_NOTICE,
  processingScaleLevel,
  vendorDependencyLevel,
  deriveRiskTags,
  EMPTY_SCOPE,
  explainRiskTags,
  INDUSTRIES,
  INDUSTRY_CODES,
  RISK_TAGS,
  selectQuestionPacks,
  type RiskInput,
  type ScopeSystem,
  type ScopeVendor,
  type TriState,
} from "./index.js";

const empty: RiskInput = { scope: EMPTY_SCOPE, systems: [], vendors: [], dataPrincipalTypes: [], dataPrincipalCountEstimate: null };

const system = (over: Partial<ScopeSystem> = {}): ScopeSystem => ({
  name: "SIS",
  systemType: "sis",
  hostingModel: "on_premise",
  dataLocation: "india",
  processesChildrenData: "no",
  ...over,
});
const vendor = (over: Partial<ScopeVendor> = {}): ScopeVendor => ({
  name: "Vendor",
  vendorRole: "independent",
  crossBorder: "no",
  ...over,
});

describe("industries", () => {
  it("are the ten authored pack industries, `general` not `other`", () => {
    expect(INDUSTRY_CODES).toEqual([
      "university", "edtech", "bfsi", "healthcare", "saas", "manufacturing",
      "retail_ecommerce", "professional_services", "public_sector", "general",
    ]);
    expect(new Set(INDUSTRIES.map((i) => i.overlayPackCode)).size).toBe(10);
  });
});

describe("deriveRiskTags", () => {
  it("an empty scope yields no tags", () => {
    expect(deriveRiskTags(empty)).toEqual([]);
  });

  it("THE stub example: university + under-18 students + AI proctoring ⇒ exactly ai_processing, children_data", () => {
    const tags = deriveRiskTags({
      ...empty,
      scope: { ...EMPTY_SCOPE, aiUsageTypes: ["proctoring"] },
      dataPrincipalTypes: [{ code: "student", label: "Students", includesChildren: "yes", estimatedCount: null }],
    });
    expect(tags).toEqual(["ai_processing", "children_data"]);
  });

  describe("`unknown` behaves as risk, never as `no` — every tri-state input", () => {
    const cases: [string, (v: TriState) => RiskInput, string][] = [
      ["scope.childrenData", (v) => ({ ...empty, scope: { ...EMPTY_SCOPE, childrenData: v } }), "children_data"],
      ["dataPrincipalType.includesChildren", (v) => ({ ...empty, dataPrincipalTypes: [{ code: "student", label: "S", includesChildren: v, estimatedCount: null }] }), "children_data"],
      ["system.processesChildrenData", (v) => ({ ...empty, systems: [system({ processesChildrenData: v })] }), "children_data"],
      ["scope.marketingTracking", (v) => ({ ...empty, scope: { ...EMPTY_SCOPE, marketingTracking: v } }), "marketing_tracking"],
      ["scope.publicFacingPortal", (v) => ({ ...empty, scope: { ...EMPTY_SCOPE, publicFacingPortal: v } }), "public_facing_portal"],
      ["scope.sensitiveDocuments", (v) => ({ ...empty, scope: { ...EMPTY_SCOPE, sensitiveDocuments: v } }), "sensitive_documents"],
    ];
    for (const [name, build, tag] of cases) {
      it(`${name}: yes → ${tag}; unknown → ${tag}; no → nothing`, () => {
        expect(deriveRiskTags(build("yes"))).toContain(tag);
        expect(deriveRiskTags(build("unknown"))).toContain(tag);
        expect(deriveRiskTags(build("no"))).not.toContain(tag);
      });
    }
  });

  it("cross_border_unknown fires on UNKNOWN location — scope, system or vendor — but not on a known transfer", () => {
    expect(deriveRiskTags({ ...empty, scope: { ...EMPTY_SCOPE, crossBorder: "unknown" } })).toEqual(["cross_border_unknown"]);
    expect(deriveRiskTags({ ...empty, systems: [system({ dataLocation: "unknown" })] })).toEqual(["cross_border_unknown"]);
    expect(deriveRiskTags({ ...empty, vendors: [vendor({ crossBorder: "unknown" })] })).toEqual(["cross_border_unknown"]);
    // A KNOWN transfer is not "unknown" — it is assessed by questions, not flagged as unknown.
    expect(deriveRiskTags({ ...empty, scope: { ...EMPTY_SCOPE, crossBorder: "yes" } })).toEqual([]);
    expect(deriveRiskTags({ ...empty, systems: [system({ dataLocation: "outside_india" })] })).toEqual([]);
  });

  it("ai_processing: any non-`none` usage, or an AI system", () => {
    expect(deriveRiskTags({ ...empty, scope: { ...EMPTY_SCOPE, aiUsageTypes: ["none"] } })).toEqual([]);
    expect(deriveRiskTags({ ...empty, scope: { ...EMPTY_SCOPE, aiUsageTypes: ["chatbot"] } })).toEqual(["ai_processing"]);
    expect(deriveRiskTags({ ...empty, systems: [system({ systemType: "ai" })] })).toEqual(["ai_processing"]);
  });

  it("cloud_saas_processing: cloud or saas hosting only", () => {
    expect(deriveRiskTags({ ...empty, systems: [system({ hostingModel: "saas" })] })).toEqual(["cloud_saas_processing"]);
    expect(deriveRiskTags({ ...empty, systems: [system({ hostingModel: "cloud" })] })).toEqual(["cloud_saas_processing"]);
    expect(deriveRiskTags({ ...empty, systems: [system({ hostingModel: "on_premise" })] })).toEqual([]);
  });

  it("high_vendor_dependency at the processor threshold, counting only Data Processors", () => {
    const processors = (n: number) => Array.from({ length: n }, (_, i) => vendor({ name: `P${i}`, vendorRole: "data_processor" }));
    expect(deriveRiskTags({ ...empty, vendors: processors(DEFAULT_RISK_TRIGGER_CONFIG.vendorDependentThreshold - 1) })).toEqual([]);
    expect(deriveRiskTags({ ...empty, vendors: processors(DEFAULT_RISK_TRIGGER_CONFIG.vendorDependentThreshold) })).toEqual(["high_vendor_dependency"]);
    expect(deriveRiskTags({ ...empty, vendors: [...processors(2), vendor({ vendorRole: "independent" })] })).toEqual([]);
  });

  it("large_scale_processing uses the larger of the org estimate and the DP-type sum", () => {
    expect(deriveRiskTags({ ...empty, dataPrincipalCountEstimate: DEFAULT_RISK_TRIGGER_CONFIG.largeScaleProcessingThreshold - 1 })).toEqual([]);
    expect(deriveRiskTags({ ...empty, dataPrincipalCountEstimate: DEFAULT_RISK_TRIGGER_CONFIG.largeScaleProcessingThreshold })).toEqual(["large_scale_processing"]);
    expect(
      deriveRiskTags({
        ...empty,
        dataPrincipalTypes: [
          { code: "student", label: "S", includesChildren: "no", estimatedCount: 60_000 },
          { code: "alumni", label: "A", includesChildren: "no", estimatedCount: 40_000 },
        ],
      }),
    ).toEqual(["large_scale_processing"]);
  });

  it("multi_location is a plain boolean", () => {
    expect(deriveRiskTags({ ...empty, scope: { ...EMPTY_SCOPE, multiLocation: true } })).toEqual(["multi_location"]);
  });

  it("is deterministic: sorted in RISK_TAGS order, de-duplicated, independent of input order", () => {
    const a: RiskInput = {
      ...empty,
      scope: { ...EMPTY_SCOPE, childrenData: "yes", crossBorder: "unknown", multiLocation: true },
      systems: [system({ name: "LMS", hostingModel: "saas", dataLocation: "unknown", processesChildrenData: "yes" }), system({ name: "AI", systemType: "ai" })],
    };
    const b: RiskInput = { ...a, systems: [...a.systems].reverse() };
    expect(deriveRiskTags(a)).toEqual(deriveRiskTags(b));
    const tags = deriveRiskTags(a);
    expect(tags).toEqual(RISK_TAGS.filter((t) => tags.includes(t)));
    expect(new Set(tags).size).toBe(tags.length);
  });

  it("explains every tag it fires", () => {
    const out = explainRiskTags({ ...empty, systems: [system({ name: "LMS", dataLocation: "unknown" })] });
    expect(out).toEqual([{ tag: "cross_border_unknown", reasons: ["LMS: data location unknown"] }]);
  });
});

describe("selectQuestionPacks", () => {
  it("always includes core, then the industry overlay", () => {
    expect(selectQuestionPacks({ industryCode: "bfsi", riskTags: [], aiUsageTypes: [] })).toEqual([CORE_PACK_CODE, "BFSI_OVERLAY_V1"]);
  });

  it("an unknown or missing industry degrades to general", () => {
    for (const industryCode of [null, "education.higher", "other", ""]) {
      expect(selectQuestionPacks({ industryCode, riskTags: [], aiUsageTypes: [] })).toEqual([CORE_PACK_CODE, "GENERAL_ORGANISATION_V1"]);
    }
  });

  it("adds conditional packs from tags, without duplicates", () => {
    expect(
      selectQuestionPacks({
        industryCode: "saas",
        riskTags: ["cloud_saas_processing", "cross_border_unknown", "high_vendor_dependency", "marketing_tracking", "large_scale_processing"],
        aiUsageTypes: [],
      }),
    ).toEqual([CORE_PACK_CODE, "SAAS_TECH_OVERLAY_V1", "VENDOR_PROCESSOR_V1", "CLOUD_CROSSBORDER_V1", "MARKETING_TRACKING_V1", "SDF_READINESS_V1"]);
  });

  it("university + proctoring adds the University AI proctoring pack; elsewhere it does not", () => {
    const tags = deriveRiskTags({
      ...empty,
      scope: { ...EMPTY_SCOPE, aiUsageTypes: ["proctoring"] },
      dataPrincipalTypes: [{ code: "student", label: "Students", includesChildren: "yes", estimatedCount: null }],
    });
    expect(selectQuestionPacks({ industryCode: "university", riskTags: tags, aiUsageTypes: ["proctoring"] })).toEqual([
      CORE_PACK_CODE, "UNIVERSITY_HIGHER_ED_V1", "CHILDREN_DATA_V1", "AI_RISK_V1",
      "UNIVERSITY_CONDITIONAL_V1", "UNIVERSITY_AI_PROCTORING_V1",
    ]);
    expect(selectQuestionPacks({ industryCode: "edtech", riskTags: tags, aiUsageTypes: ["proctoring"] })).not.toContain(
      "UNIVERSITY_AI_PROCTORING_V1",
    );
  });

  it("the University conditional pool comes with the industry, proctoring or not (D-029.1)", () => {
    expect(selectQuestionPacks({ industryCode: "university", riskTags: [], aiUsageTypes: [] })).toEqual([
      CORE_PACK_CODE, "UNIVERSITY_HIGHER_ED_V1", "UNIVERSITY_CONDITIONAL_V1",
    ]);
    expect(selectQuestionPacks({ industryCode: "general", riskTags: [], aiUsageTypes: [] })).not.toContain(
      "UNIVERSITY_CONDITIONAL_V1",
    );
    // The reference pool is browsable, never selected.
    expect(selectQuestionPacks({ industryCode: "university", riskTags: [], aiUsageTypes: [] })).not.toContain(
      "UNIVERSITY_REFERENCE_V1",
    );
  });
});

describe("internal risk triggers are configurable and tiered (D-028)", () => {
  const processors = (n: number) => Array.from({ length: n }, (_, i) => vendor({ name: `P${i}`, vendorRole: "data_processor" }));

  it("approved V1 defaults", () => {
    expect(DEFAULT_RISK_TRIGGER_CONFIG).toEqual({
      vendorDependentThreshold: 3,
      complexVendorEcosystemThreshold: 10,
      elevatedScaleThreshold: 10_000,
      largeScaleProcessingThreshold: 100_000,
    });
    expect(Object.isFrozen(DEFAULT_RISK_TRIGGER_CONFIG)).toBe(true);
  });

  it("vendor dependency tiers: 0 none · 1–2 limited · 3–9 vendor-dependent · 10+ complex ecosystem", () => {
    expect([0, 1, 2, 3, 9, 10, 25].map((n) => vendorDependencyLevel(n))).toEqual([
      "none", "limited", "limited", "vendor_dependent", "vendor_dependent", "complex_ecosystem", "complex_ecosystem",
    ]);
  });

  it("scale tiers: <10,000 normal · 10,000–99,999 elevated · 1,00,000+ large scale", () => {
    expect([0, 9_999, 10_000, 99_999, 100_000].map((n) => processingScaleLevel(n))).toEqual([
      "normal", "normal", "elevated", "elevated", "large_scale",
    ]);
  });

  it("high_vendor_dependency fires for both vendor_dependent and complex_ecosystem", () => {
    expect(deriveRiskTags({ ...empty, vendors: processors(12) })).toEqual(["high_vendor_dependency"]);
  });

  it("a different config changes the tags, with no code change elsewhere", () => {
    const strict = { ...DEFAULT_RISK_TRIGGER_CONFIG, vendorDependentThreshold: 2, largeScaleProcessingThreshold: 50_000 };
    const input = { ...empty, vendors: processors(2), dataPrincipalCountEstimate: 60_000 };
    expect(deriveRiskTags(input)).toEqual([]);
    expect(deriveRiskTags(input, strict)).toEqual(["high_vendor_dependency", "large_scale_processing"]);
  });

  it("the large-scale reason says it is not a statutory classification", () => {
    const [reason] = explainRiskTags({ ...empty, dataPrincipalCountEstimate: 250_000 });
    expect(reason!.reasons[0]).toMatch(/not a statutory classification/);
  });

  it("profile: levels, the approved notice only at large scale, never infers SDF status", () => {
    const small = assessScopeProfile({ ...empty, dataPrincipalCountEstimate: 20_000, vendors: processors(1) });
    expect(small).toMatchObject({
      dataPrincipalCount: 20_000,
      processingScale: "elevated",
      largeScaleNotice: null,
      dataProcessorCount: 1,
      vendorDependency: "limited",
      significantDataFiduciaryInferred: false,
    });
    const large = assessScopeProfile({ ...empty, dataPrincipalCountEstimate: 500_000 });
    expect(large.largeScaleNotice).toBe(LARGE_SCALE_NOTICE);
    expect(large.significantDataFiduciaryInferred).toBe(false);
  });

  it("enhanced review below the large-scale threshold: children, biometric, AI profiling, sensitive documents", () => {
    const profile = assessScopeProfile({
      ...empty,
      dataPrincipalCountEstimate: 500,
      scope: { ...EMPTY_SCOPE, childrenData: "yes", aiUsageTypes: ["scoring"], sensitiveDocuments: "unknown" },
      systems: [system({ name: "Attendance", systemType: "biometric" })],
    });
    expect(profile.processingScale).toBe("normal");
    expect(profile.enhancedReview).toEqual({
      required: true,
      triggers: ["children_data", "sensitive_documents", "biometric_data", "ai_profiling"],
    });
    expect(assessScopeProfile(empty).enhancedReview).toEqual({ required: false, triggers: [] });
  });
});
