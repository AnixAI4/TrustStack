/**
 * Trigger conditions: the JSON expression language from the spec's §Dynamic
 * Rule Examples, the scope facts it reads, and the reviewed lookup table that
 * turns authored trigger phrases into expressions.
 *
 * Two rules govern this file:
 *   1. Unknown is risk. A condition that cannot be evaluated never hides a
 *      question — it becomes Potentially Applicable (D-026, D-029.3).
 *   2. No NLP. `mapTriggerText` is a hand-reviewed table. An unrecognised
 *      phrase returns null, is counted, and is reported — never guessed.
 */

import {
  assessScopeProfile, DEFAULT_INDUSTRY, DEFAULT_RISK_TRIGGER_CONFIG, deriveRiskTags, isIndustryCode,
  type AiUsageType, type DataPrincipalCode, type ProcessingScaleLevel, type RiskInput, type RiskTag,
  type RiskTriggerConfig, type ScopeAnswers, type SystemType, type VendorDependencyLevel, type VendorRole,
} from "./scope.js";

// ---------------------------------------------------------------------------
// Facts
// ---------------------------------------------------------------------------

/**
 * Everything a trigger may read, assembled from the Slice 2 scope: the wizard
 * answers, the four registers and `assessScopeProfile()`. `processingScale` and
 * `vendorDependency` arrive pre-derived so no trigger re-implements a threshold
 * (D-028).
 */
export interface ScopeFacts {
  industryCode: string;
  riskTags: readonly RiskTag[];
  aiUsageTypes: readonly AiUsageType[];
  systemTypes: readonly SystemType[];
  dataPrincipalCodes: readonly DataPrincipalCode[];
  vendorRoles: readonly VendorRole[];
  answers: ScopeAnswers;
  processingScale: ProcessingScaleLevel;
  vendorDependency: VendorDependencyLevel;
}

/** Fields a `TriggerCondition` may name. A field outside this list is an authoring error. */
export const TRIGGER_FIELDS = [
  "industryCode",
  "riskTags",
  "aiUsageTypes",
  "systemTypes",
  "dataPrincipalCodes",
  "vendorRoles",
  "processingScale",
  "vendorDependency",
  "answers.childrenData",
  "answers.usesDataProcessors",
  "answers.marketingTracking",
  "answers.crossBorder",
  "answers.multiLocation",
  "answers.publicFacingPortal",
  "answers.sensitiveDocuments",
] as const;
export type TriggerField = (typeof TRIGGER_FIELDS)[number];

export const TRIGGER_OPERATORS = ["equals", "contains", "in", "exists"] as const;
export type TriggerOperator = (typeof TRIGGER_OPERATORS)[number];

export interface TriggerComparison {
  field: TriggerField;
  operator: TriggerOperator;
  /** Omitted for `exists`. `in` takes an array; `contains` a single member. */
  value?: string | number | boolean | readonly (string | number | boolean)[];
}

export type TriggerCondition =
  | TriggerComparison
  | { all: readonly TriggerCondition[] }
  | { any: readonly TriggerCondition[] };

export class UnknownTriggerFieldError extends Error {
  constructor(public readonly field: string) {
    super(`unknown trigger field "${field}"`);
    this.name = "UnknownTriggerFieldError";
  }
}

const isAll = (c: TriggerCondition): c is { all: readonly TriggerCondition[] } => "all" in c;
const isAny = (c: TriggerCondition): c is { any: readonly TriggerCondition[] } => "any" in c;

function readField(facts: ScopeFacts, field: string): unknown {
  switch (field) {
    case "industryCode": return facts.industryCode;
    case "riskTags": return facts.riskTags;
    case "aiUsageTypes": return facts.aiUsageTypes;
    case "systemTypes": return facts.systemTypes;
    case "dataPrincipalCodes": return facts.dataPrincipalCodes;
    case "vendorRoles": return facts.vendorRoles;
    case "processingScale": return facts.processingScale;
    case "vendorDependency": return facts.vendorDependency;
    case "answers.childrenData": return facts.answers.childrenData;
    case "answers.usesDataProcessors": return facts.answers.usesDataProcessors;
    case "answers.marketingTracking": return facts.answers.marketingTracking;
    case "answers.crossBorder": return facts.answers.crossBorder;
    case "answers.multiLocation": return facts.answers.multiLocation;
    case "answers.publicFacingPortal": return facts.answers.publicFacingPortal;
    case "answers.sensitiveDocuments": return facts.answers.sensitiveDocuments;
    default: throw new UnknownTriggerFieldError(field);
  }
}

/**
 * Evaluates a condition against the scope facts.
 *
 * Throws `UnknownTriggerFieldError` on an unknown field — the mapper catches it
 * at seed time so a bad expression can never reach a client's assessment. An
 * empty `all` is true (nothing fails); an empty `any` is false (nothing passes).
 */
export function evaluateTrigger(condition: TriggerCondition, facts: ScopeFacts): boolean {
  if (isAll(condition)) return condition.all.every((c) => evaluateTrigger(c, facts));
  if (isAny(condition)) return condition.any.some((c) => evaluateTrigger(c, facts));

  const actual = readField(facts, condition.field);
  switch (condition.operator) {
    case "exists":
      return Array.isArray(actual) ? actual.length > 0 : actual !== null && actual !== undefined && actual !== "";
    case "equals":
      return actual === condition.value;
    case "contains":
      return Array.isArray(actual) && actual.includes(condition.value as never);
    case "in": {
      const allowed = (Array.isArray(condition.value) ? condition.value : [condition.value]) as readonly unknown[];
      if (Array.isArray(actual)) return actual.some((a) => allowed.includes(a));
      return allowed.includes(actual);
    }
  }
}

// ---------------------------------------------------------------------------
// Authored phrase → expression
// ---------------------------------------------------------------------------

const has = (field: TriggerField, value: string): TriggerComparison => ({ field, operator: "contains", value });
const anyOf = (field: TriggerField, value: readonly string[]): TriggerComparison => ({ field, operator: "in", value });
const eq = (field: TriggerField, value: string | boolean): TriggerComparison => ({ field, operator: "equals", value });

const CHILDREN = has("riskTags", "children_data");
/**
 * Processors are in play unless the organisation has explicitly said they are
 * not. A register entry proves it; `yes` or `unknown` asserts or admits it.
 * Only an explicit `no` AND an empty register suppresses the vendor questions
 * (D-037) — silence is not a denial.
 */
const VENDORS: TriggerCondition = {
  any: [
    anyOf("answers.usesDataProcessors", ["yes", "unknown"]),
    has("vendorRoles", "data_processor"),
  ],
};
const AI = has("riskTags", "ai_processing");
const CLOUD = has("riskTags", "cloud_saas_processing");
const MARKETING = has("riskTags", "marketing_tracking");
/** A KNOWN transfer out of India is as much a trigger as an unknown one (D-026). */
const CROSS_BORDER: TriggerCondition = {
  any: [anyOf("answers.crossBorder", ["yes", "unknown"]), has("riskTags", "cross_border_unknown")],
};

/**
 * Phrases the Slice 2 scope can actually decide, lower-cased and normalised.
 * Everything else is deliberately absent: an unmapped phrase becomes
 * Potentially Applicable, which is honest, whereas a loose guess would silently
 * hide a question a client needed to answer.
 *
 * D-029's wizard-field backlog is the list of phrases we WANT here and cannot
 * yet map: placements, alumni engagement, hostel, transport, events, NAD/
 * DigiLocker, research consent basis, scholarship documents, plus the BFSI and
 * healthcare process phrases.
 */
const TRIGGER_PHRASES: Readonly<Record<string, TriggerCondition>> = Object.freeze({
  // Systems
  "lms used": has("systemTypes", "lms"),
  "lms analytics used": { all: [has("systemTypes", "lms"), AI] },
  "lms/proctoring/recordings": { any: [has("systemTypes", "lms"), has("aiUsageTypes", "proctoring")] },
  payments: has("systemTypes", "payment"),
  "mobile app": has("systemTypes", "mobile_app"),
  "cctv/biometric/access control": anyOf("systemTypes", ["cctv", "biometric"]),
  "proctoring/cctv/biometric": {
    any: [has("aiUsageTypes", "proctoring"), anyOf("systemTypes", ["cctv", "biometric"])],
  },

  // AI
  "ai tools used": AI,
  "ai/analytics": AI,
  "ai/decisioning": AI,
  analytics: AI,
  "ai vendors": { all: [AI, VENDORS] },
  "high-risk ai": AI,
  "ai proctoring": has("aiUsageTypes", "proctoring"),
  "chatbot used": has("aiUsageTypes", "chatbot"),
  "automated decisions": anyOf("aiUsageTypes", ["scoring", "recommendation"]),

  // Children and guardians
  minors: CHILDREN,
  "minors possible": CHILDREN,
  "ug/early entrants/minors possible": CHILDREN,
  "guardian data": has("dataPrincipalCodes", "parent_guardian"),
  "guardian data collected": has("dataPrincipalCodes", "parent_guardian"),
  "parent/guardian data collected": has("dataPrincipalCodes", "parent_guardian"),
  "minors + ai/analytics": { all: [CHILDREN, AI] },
  "minors + vendors": { all: [CHILDREN, VENDORS] },
  "minor + marketing": { all: [CHILDREN, MARKETING] },

  // Vendors and processors
  vendors: VENDORS,
  processors: VENDORS,
  "processor vendors": VENDORS,
  "vendors process data": VENDORS,
  "vendor access": VENDORS,
  "vendor sharing": VENDORS,
  "vendor sub-processing": VENDORS,
  "vendor support": VENDORS,
  // The core pack's own phrasing ("Mandatory where vendors exist").
  "vendors exist": VENDORS,

  // Cloud, SaaS and cross-border
  saas: CLOUD,
  "saas vendors": { all: [CLOUD, VENDORS] },
  "saas/cloud vendors": { all: [CLOUD, VENDORS] },
  "cloud/saas": CLOUD,
  "cloud/saas used": CLOUD,
  "saas/cloud/ai": { any: [CLOUD, AI] },
  "cross-border": CROSS_BORDER,
  "cloud/cross-border": { any: [CLOUD, CROSS_BORDER] },

  // Marketing
  marketing: MARKETING,
  "marketing/cross-sell": MARKETING,

  // Data Principal groups
  research: has("dataPrincipalCodes", "research_participant"),
  "research data collected": has("dataPrincipalCodes", "research_participant"),
  "alumni database": has("dataPrincipalCodes", "alumni"),

  // Structure and scale
  "multi-campus/affiliated structure": eq("answers.multiLocation", true),
  "affiliated/partner model": eq("answers.multiLocation", true),
  "large scale/high risk": eq("processingScale", "large_scale"),
  "large-scale/high-risk": eq("processingScale", "large_scale"),
});

/**
 * Maps an authored trigger phrase to an expression, or null when no reviewed
 * mapping exists. Null is the signal for `potentially_applicable` (D-029.3).
 */
export function mapTriggerText(triggerText: string | null | undefined): TriggerCondition | null {
  if (!triggerText) return null;
  const key = triggerText.toLowerCase().replace(/\s+/g, " ").trim().replace(/[.;]$/, "");
  return TRIGGER_PHRASES[key] ?? null;
}

/** Every phrase with a reviewed mapping — used by tests and the coverage report. */
export const MAPPED_TRIGGER_PHRASES: readonly string[] = Object.freeze(Object.keys(TRIGGER_PHRASES).sort());

/** A short expression label for `included_reason` ("trigger:systemTypes contains lms"). */
export function describeTrigger(condition: TriggerCondition): string {
  if (isAll(condition)) return `(${condition.all.map(describeTrigger).join(" and ")})`;
  if (isAny(condition)) return `(${condition.any.map(describeTrigger).join(" or ")})`;
  if (condition.operator === "exists") return `${condition.field} exists`;
  const value = Array.isArray(condition.value) ? `[${condition.value.join(", ")}]` : String(condition.value);
  return `${condition.field} ${condition.operator} ${value}`;
}

// ---------------------------------------------------------------------------
// Facts from the Slice 2 scope
// ---------------------------------------------------------------------------

/**
 * Assembles `ScopeFacts` from the same `RiskInput` the wizard already builds,
 * so the seeder, the API and the tests all derive facts one way. Thresholds
 * come from the config, never from a literal here (D-028).
 */
export function scopeFactsFrom(
  industryCode: string | null,
  input: RiskInput,
  config: RiskTriggerConfig = DEFAULT_RISK_TRIGGER_CONFIG,
): ScopeFacts {
  const profile = assessScopeProfile(input, config);
  return {
    industryCode: industryCode && isIndustryCode(industryCode) ? industryCode : DEFAULT_INDUSTRY,
    riskTags: deriveRiskTags(input, config),
    aiUsageTypes: [...new Set(input.scope.aiUsageTypes)].sort(),
    systemTypes: [...new Set(input.systems.map((s) => s.systemType))].sort(),
    dataPrincipalCodes: [...new Set(input.dataPrincipalTypes.map((d) => d.code))].sort(),
    vendorRoles: [...new Set(input.vendors.map((v) => v.vendorRole))].sort(),
    answers: input.scope,
    processingScale: profile.processingScale,
    vendorDependency: profile.vendorDependency,
  };
}
