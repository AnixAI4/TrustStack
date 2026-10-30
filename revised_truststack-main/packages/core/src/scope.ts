/**
 * Scope wizard domain logic (Slice 2). Pure functions, no I/O.
 *
 * Principle (spec Step H): DPDP applicability is driven by ACTUAL processing,
 * not by industry alone. The client describes its environment; this module
 * DERIVES the risk tags and question packs. Tags are never hand-set.
 *
 * `unknown` is a first-class answer and behaves as risk, never as "no"
 * (spec Step G) — an organisation that cannot say where its data lives has a
 * cross-border finding, not a clean bill of health.
 */

// ---------------------------------------------------------------------------
// Industries — codes follow the authored question packs (D-013), so
// `general`, not the spec's `other` (D-026).
// ---------------------------------------------------------------------------

export const INDUSTRIES = [
  { code: "university", name: "University / Higher Education", overlayPackCode: "UNIVERSITY_HIGHER_ED_V1" },
  { code: "edtech", name: "EdTech / Online Learning", overlayPackCode: "EDTECH_OVERLAY_V1" },
  { code: "bfsi", name: "Banking, Financial Services and Insurance", overlayPackCode: "BFSI_OVERLAY_V1" },
  { code: "healthcare", name: "Healthcare / Hospital / Clinic / Diagnostics", overlayPackCode: "HEALTHCARE_OVERLAY_V1" },
  { code: "saas", name: "SaaS / Technology Platform", overlayPackCode: "SAAS_TECH_OVERLAY_V1" },
  { code: "manufacturing", name: "Manufacturing / Industrial", overlayPackCode: "MANUFACTURING_OVERLAY_V1" },
  { code: "retail_ecommerce", name: "Retail / E-commerce", overlayPackCode: "RETAIL_ECOMMERCE_OVERLAY_V1" },
  { code: "professional_services", name: "Consulting / Legal / Accounting / Advisory", overlayPackCode: "PROFESSIONAL_SERVICES_OVERLAY_V1" },
  { code: "public_sector", name: "Public Sector / Government-linked Institution", overlayPackCode: "PUBLIC_SECTOR_OVERLAY_V1" },
  { code: "general", name: "General Organisation", overlayPackCode: "GENERAL_ORGANISATION_V1" },
] as const;

export type IndustryCode = (typeof INDUSTRIES)[number]["code"];
export const INDUSTRY_CODES = INDUSTRIES.map((i) => i.code) as readonly IndustryCode[];
export const DEFAULT_INDUSTRY: IndustryCode = "general";

export function isIndustryCode(value: string): value is IndustryCode {
  return (INDUSTRY_CODES as readonly string[]).includes(value);
}

// ---------------------------------------------------------------------------
// Answer vocabularies
// ---------------------------------------------------------------------------

export const TRI_STATES = ["yes", "no", "unknown"] as const;
export type TriState = (typeof TRI_STATES)[number];

/** yes OR unknown — the rule for every tri-state risk input. */
export const isYesOrUnknown = (value: TriState | null | undefined): boolean =>
  value === "yes" || value === "unknown";

export const SYSTEM_TYPES = [
  "erp", "sis", "lms", "exam", "hrms", "payroll", "crm", "website", "mobile_app",
  "payment", "email_sms", "cctv", "biometric", "ai", "other",
] as const;
export type SystemType = (typeof SYSTEM_TYPES)[number];

export const HOSTING_MODELS = ["on_premise", "cloud", "saas", "unknown"] as const;
export type HostingModel = (typeof HOSTING_MODELS)[number];

export const DATA_LOCATIONS = ["india", "outside_india", "unknown"] as const;
export type DataLocation = (typeof DATA_LOCATIONS)[number];

export const VENDOR_ROLES = ["data_processor", "independent", "unknown"] as const;
export type VendorRole = (typeof VENDOR_ROLES)[number];

export const DATA_PRINCIPAL_CODES = [
  "applicant", "student", "parent_guardian", "faculty", "employee", "alumni", "customer",
  "patient", "visitor", "contractor", "research_participant", "other",
] as const;
export type DataPrincipalCode = (typeof DATA_PRINCIPAL_CODES)[number];

export const AI_USAGE_TYPES = ["proctoring", "chatbot", "analytics", "scoring", "recommendation", "none"] as const;
export type AiUsageType = (typeof AI_USAGE_TYPES)[number];

// ---------------------------------------------------------------------------
// Risk tags (spec 03_*.md §Secondary Risk Tags)
// ---------------------------------------------------------------------------

export const RISK_TAGS = [
  "ai_processing",
  "children_data",
  "cloud_saas_processing",
  "cross_border_unknown",
  "high_vendor_dependency",
  "large_scale_processing",
  "marketing_tracking",
  "multi_location",
  "public_facing_portal",
  "sensitive_documents",
] as const;
export type RiskTag = (typeof RISK_TAGS)[number];

/**
 * TrustStack INTERNAL risk triggers — approved for V1 by Aniket, 2026-09-15 (D-028).
 * They decide which deeper questions appear. They are NOT statutory thresholds:
 * nothing here classifies an organisation as a Significant Data Fiduciary, which
 * only the Central Government can notify. Override per call; never hard-code
 * these numbers elsewhere.
 */
export interface RiskTriggerConfig {
  /** Data Processors at or above which the organisation is vendor-dependent. */
  vendorDependentThreshold: number;
  /** Data Processors at or above which it is a complex vendor ecosystem. */
  complexVendorEcosystemThreshold: number;
  /** Data Principals at or above which scale is elevated. */
  elevatedScaleThreshold: number;
  /** Data Principals at or above which the large-scale processing trigger fires. */
  largeScaleProcessingThreshold: number;
}

export const DEFAULT_RISK_TRIGGER_CONFIG: Readonly<RiskTriggerConfig> = Object.freeze({
  vendorDependentThreshold: 3,
  complexVendorEcosystemThreshold: 10,
  elevatedScaleThreshold: 10_000,
  largeScaleProcessingThreshold: 100_000,
});

export const VENDOR_DEPENDENCY_LEVELS = ["none", "limited", "vendor_dependent", "complex_ecosystem"] as const;
export type VendorDependencyLevel = (typeof VENDOR_DEPENDENCY_LEVELS)[number];

export const PROCESSING_SCALE_LEVELS = ["normal", "elevated", "large_scale"] as const;
export type ProcessingScaleLevel = (typeof PROCESSING_SCALE_LEVELS)[number];

/** Shown wherever the large-scale trigger is displayed (wording approved in D-028). */
export const LARGE_SCALE_NOTICE =
  "Based on the number of individuals involved, this assessment treats the organisation as large-scale for internal DPDP readiness review. This is a TrustStack risk trigger and not a statutory classification.";

export function vendorDependencyLevel(
  dataProcessorCount: number,
  config: RiskTriggerConfig = DEFAULT_RISK_TRIGGER_CONFIG,
): VendorDependencyLevel {
  if (dataProcessorCount >= config.complexVendorEcosystemThreshold) return "complex_ecosystem";
  if (dataProcessorCount >= config.vendorDependentThreshold) return "vendor_dependent";
  if (dataProcessorCount >= 1) return "limited";
  return "none";
}

export function processingScaleLevel(
  dataPrincipalCount: number,
  config: RiskTriggerConfig = DEFAULT_RISK_TRIGGER_CONFIG,
): ProcessingScaleLevel {
  if (dataPrincipalCount >= config.largeScaleProcessingThreshold) return "large_scale";
  if (dataPrincipalCount >= config.elevatedScaleThreshold) return "elevated";
  return "normal";
}

export interface ScopeAnswers {
  childrenData: TriState;
  /**
   * Personal data of persons with disability who have a lawful guardian
   * (s.9(1)) — with children's data, it decides whether penalty head 3
   * applies (Slice 9). It fires no risk tag and selects no pack.
   */
  guardianData: TriState;
  /**
   * Whether the organisation uses Data Processors at all.
   *
   * Explicit, because an EMPTY vendor register means nothing was recorded — not
   * that no processor exists, and "unknown behaves as risk, never as no" is the
   * principle the whole wizard is built on (D-026). `VENDOR` is the only core
   * domain whose every question hangs off one trigger, so without this field an
   * organisation that has not mapped its supply chain silently loses the entire
   * domain. Only a documented "no" may do that (D-037).
   */
  usesDataProcessors: TriState;
  aiUsageTypes: readonly AiUsageType[];
  marketingTracking: TriState;
  crossBorder: TriState;
  multiLocation: boolean;
  publicFacingPortal: TriState;
  sensitiveDocuments: TriState;
}

export interface ScopeSystem {
  name: string;
  systemType: SystemType;
  hostingModel: HostingModel;
  dataLocation: DataLocation;
  processesChildrenData: TriState;
}

export interface ScopeVendor {
  name: string;
  vendorRole: VendorRole;
  crossBorder: TriState;
}

export interface ScopeDataPrincipalType {
  code: DataPrincipalCode;
  label: string;
  includesChildren: TriState;
  estimatedCount: number | null;
}

export interface RiskInput {
  scope: ScopeAnswers;
  systems: readonly ScopeSystem[];
  vendors: readonly ScopeVendor[];
  dataPrincipalTypes: readonly ScopeDataPrincipalType[];
  /** Organisation-level estimate; the larger of this and the DP-type sum is used. */
  dataPrincipalCountEstimate: number | null;
}

export const EMPTY_SCOPE: ScopeAnswers = {
  childrenData: "no",
  // `unknown`, as the column defaults: nobody has said "no" yet (D-026).
  guardianData: "unknown",
  // `unknown`, unlike its neighbours: an organisation that has said nothing has
  // not said "no", and this answer gates a whole domain (D-037).
  usesDataProcessors: "unknown",
  aiUsageTypes: [],
  marketingTracking: "no",
  crossBorder: "no",
  multiLocation: false,
  publicFacingPortal: "no",
  sensitiveDocuments: "no",
};

export interface RiskTagReason {
  tag: RiskTag;
  /** Plain-English reasons, shown in the wizard's preview ("why did this fire?"). */
  reasons: string[];
}

/**
 * Derives risk tags with the reason(s) each fired. Output is sorted by tag and
 * de-duplicated, so the same input always yields the same array — it will be
 * snapshotted into assessments from Slice 3.
 */
export function explainRiskTags(input: RiskInput, config: RiskTriggerConfig = DEFAULT_RISK_TRIGGER_CONFIG): RiskTagReason[] {
  const found = new Map<RiskTag, string[]>();
  const add = (tag: RiskTag, reason: string) => found.set(tag, [...(found.get(tag) ?? []), reason]);
  const { scope, systems, vendors, dataPrincipalTypes } = input;

  // children_data
  if (isYesOrUnknown(scope.childrenData)) add("children_data", `Children's data processed: ${scope.childrenData}`);
  for (const d of dataPrincipalTypes) {
    if (isYesOrUnknown(d.includesChildren)) add("children_data", `${d.label} may include under-18s (${d.includesChildren})`);
  }
  for (const s of systems) {
    if (isYesOrUnknown(s.processesChildrenData)) add("children_data", `${s.name} may process children's data (${s.processesChildrenData})`);
  }

  // ai_processing
  const ai = scope.aiUsageTypes.filter((t) => t !== "none");
  if (ai.length > 0) add("ai_processing", `AI used for: ${[...ai].sort().join(", ")}`);
  for (const s of systems) if (s.systemType === "ai") add("ai_processing", `${s.name} is an AI system`);

  // cloud_saas_processing
  for (const s of systems) {
    if (s.hostingModel === "cloud" || s.hostingModel === "saas") add("cloud_saas_processing", `${s.name} is hosted ${s.hostingModel}`);
  }

  // cross_border_unknown — "unknown" location is the finding
  if (scope.crossBorder === "unknown") add("cross_border_unknown", "Cross-border transfer: unknown");
  for (const s of systems) {
    if (s.dataLocation === "unknown") add("cross_border_unknown", `${s.name}: data location unknown`);
  }
  for (const v of vendors) {
    if (v.crossBorder === "unknown") add("cross_border_unknown", `${v.name}: cross-border processing unknown`);
  }

  // high_vendor_dependency — internal trigger (D-028)
  const processors = dataProcessorCount(input);
  if (vendorDependencyLevel(processors, config) === "vendor_dependent" || vendorDependencyLevel(processors, config) === "complex_ecosystem") {
    add(
      "high_vendor_dependency",
      `${processors} Data Processors — ${label(vendorDependencyLevel(processors, config))} (TrustStack trigger at ${config.vendorDependentThreshold})`,
    );
  }

  // large_scale_processing — internal trigger, never an SDF classification (D-028)
  const scale = dataPrincipalCount(input);
  if (processingScaleLevel(scale, config) === "large_scale") {
    add(
      "large_scale_processing",
      `About ${scale.toLocaleString("en-IN")} Data Principals (TrustStack trigger at ${config.largeScaleProcessingThreshold.toLocaleString("en-IN")}; not a statutory classification)`,
    );
  }

  if (isYesOrUnknown(scope.marketingTracking)) add("marketing_tracking", `Marketing, cookies or profiling: ${scope.marketingTracking}`);
  if (scope.multiLocation) add("multi_location", "Multiple locations, campuses or subsidiaries");
  if (isYesOrUnknown(scope.publicFacingPortal)) add("public_facing_portal", `Public website or app collects personal data: ${scope.publicFacingPortal}`);
  if (isYesOrUnknown(scope.sensitiveDocuments)) add("sensitive_documents", `Identity, academic, financial or health documents: ${scope.sensitiveDocuments}`);

  return RISK_TAGS.filter((t) => found.has(t)).map((tag) => ({ tag, reasons: found.get(tag)! }));
}

export function deriveRiskTags(input: RiskInput, config: RiskTriggerConfig = DEFAULT_RISK_TRIGGER_CONFIG): RiskTag[] {
  return explainRiskTags(input, config).map((r) => r.tag);
}

const label = (v: string) => v.replace(/_/g, " ");

export function dataProcessorCount(input: Pick<RiskInput, "vendors">): number {
  return input.vendors.filter((v) => v.vendorRole === "data_processor").length;
}

/** The larger of the organisation's estimate and the Data Principal type sum. */
export function dataPrincipalCount(input: Pick<RiskInput, "dataPrincipalTypes" | "dataPrincipalCountEstimate">): number {
  const dpSum = input.dataPrincipalTypes.reduce((n, d) => n + (d.estimatedCount ?? 0), 0);
  return Math.max(input.dataPrincipalCountEstimate ?? 0, dpSum);
}

/**
 * Conditions that call for enhanced review REGARDLESS of scale (D-028): a small
 * organisation processing children's or biometric data is not low-risk.
 * Health and financial data are captured only together today (the
 * `sensitiveDocuments` answer); separating them needs new wizard fields (Slice 3 backlog).
 */
export const ENHANCED_REVIEW_TRIGGERS = [
  "children_data",
  "sensitive_documents",
  "biometric_data",
  "ai_profiling",
  "high_vendor_dependency",
  "cross_border_unknown",
] as const;
export type EnhancedReviewTrigger = (typeof ENHANCED_REVIEW_TRIGGERS)[number];

export interface ScopeProfile {
  dataProcessorCount: number;
  vendorDependency: VendorDependencyLevel;
  dataPrincipalCount: number;
  processingScale: ProcessingScaleLevel;
  /** Present only when processingScale is large_scale. */
  largeScaleNotice: string | null;
  enhancedReview: { required: boolean; triggers: EnhancedReviewTrigger[] };
  /** Always false: the platform never infers Significant Data Fiduciary status (D-028). */
  significantDataFiduciaryInferred: false;
}

export function assessScopeProfile(input: RiskInput, config: RiskTriggerConfig = DEFAULT_RISK_TRIGGER_CONFIG): ScopeProfile {
  const tags = new Set(deriveRiskTags(input, config));
  const processors = dataProcessorCount(input);
  const principals = dataPrincipalCount(input);
  const processingScale = processingScaleLevel(principals, config);

  const triggers: EnhancedReviewTrigger[] = [];
  if (tags.has("children_data")) triggers.push("children_data");
  if (tags.has("sensitive_documents")) triggers.push("sensitive_documents");
  if (input.systems.some((s) => s.systemType === "biometric")) triggers.push("biometric_data");
  if (input.scope.aiUsageTypes.some((t) => t === "scoring" || t === "recommendation" || t === "proctoring")) triggers.push("ai_profiling");
  if (tags.has("high_vendor_dependency")) triggers.push("high_vendor_dependency");
  if (tags.has("cross_border_unknown")) triggers.push("cross_border_unknown");

  return {
    dataProcessorCount: processors,
    vendorDependency: vendorDependencyLevel(processors, config),
    dataPrincipalCount: principals,
    processingScale,
    largeScaleNotice: processingScale === "large_scale" ? LARGE_SCALE_NOTICE : null,
    enhancedReview: { required: triggers.length > 0, triggers },
    significantDataFiduciaryInferred: false,
  };
}

// ---------------------------------------------------------------------------
// Question pack selection (spec 03_*.md §Question Packs, §Template Selection Flow)
// Slice 2 returns pack CODES only; Slice 3 loads their questions.
// ---------------------------------------------------------------------------

export const CORE_PACK_CODE = "CORE_DPDP_V1";

const CONDITIONAL_PACKS: readonly { code: string; when: (tags: ReadonlySet<RiskTag>) => boolean }[] = [
  { code: "CHILDREN_DATA_V1", when: (t) => t.has("children_data") },
  { code: "VENDOR_PROCESSOR_V1", when: (t) => t.has("high_vendor_dependency") || t.has("cloud_saas_processing") },
  { code: "CLOUD_CROSSBORDER_V1", when: (t) => t.has("cloud_saas_processing") || t.has("cross_border_unknown") },
  { code: "AI_RISK_V1", when: (t) => t.has("ai_processing") },
  { code: "MARKETING_TRACKING_V1", when: (t) => t.has("marketing_tracking") },
  { code: "SDF_READINESS_V1", when: (t) => t.has("large_scale_processing") },
];

export interface PackSelectionInput {
  industryCode: string | null;
  riskTags: readonly RiskTag[];
  aiUsageTypes: readonly AiUsageType[];
}

/**
 * Core → industry overlay → conditional packs, in that order, no duplicates.
 * An unknown or missing industry degrades to `general` — never to "no overlay".
 */
export function selectQuestionPacks(input: PackSelectionInput): string[] {
  const industry = input.industryCode && isIndustryCode(input.industryCode) ? input.industryCode : DEFAULT_INDUSTRY;
  const overlay = INDUSTRIES.find((i) => i.code === industry)!.overlayPackCode;
  const tags = new Set(input.riskTags);

  const packs = [CORE_PACK_CODE, overlay, ...CONDITIONAL_PACKS.filter((p) => p.when(tags)).map((p) => p.code)];
  if (industry === "university") {
    // The University conditional pool: selected for every University
    // assessment, then gated question by question by each question's own
    // trigger, so an unmappable condition shows as Potentially Applicable
    // instead of vanishing (D-029.1, D-029.3).
    packs.push("UNIVERSITY_CONDITIONAL_V1");
    // Spec §Dynamic Rule Examples — pack code as authored in the University file (D-013).
    if (input.aiUsageTypes.includes("proctoring")) packs.push("UNIVERSITY_AI_PROCTORING_V1");
  }
  return [...new Set(packs)];
}
