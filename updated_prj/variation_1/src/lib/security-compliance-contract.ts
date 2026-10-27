import { z } from "zod";
import { SECURITY_LEGAL_REFERENCE_IDS } from "@/content/security-compliance-legal";

const CONTROL_CHARACTER_PATTERN = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;

function textSchema(max: number) {
  return z
    .string()
    .trim()
    .min(1)
    .max(max)
    .refine((value) => !CONTROL_CHARACTER_PATTERN.test(value), "Control characters are not allowed.");
}

const nullableText = (max: number) => textSchema(max).nullable();
const optionalText = (max: number) => textSchema(max).optional();

export const CheckStatusSchema = z.enum(["pass", "fail", "partial", "unknown"]);
export const ConfidenceSchema = z.enum(["high", "medium", "low"]);
export const AttentionLevelSchema = z.enum(["urgent_review", "important_review", "monitor"]);
export const ActionHorizonSchema = z.enum(["do_now", "plan_next", "monitor"]);
export const LegalReferenceIdSchema = z.enum(SECURITY_LEGAL_REFERENCE_IDS);

export const SubCheckResultSchema = z
  .object({
    id: textSchema(200),
    label: textSchema(1_000),
    status: CheckStatusSchema,
    evidence: optionalText(20_000),
    dpdp_reference: optionalText(2_000),
    remediation: optionalText(10_000),
  })
  .strict();

export const CapabilityResultSchema = z
  .object({
    key: textSchema(200),
    label: textSchema(1_000),
    icon: textSchema(100),
    score: z.number().finite().min(0).max(100),
    weight: z.number().finite().min(0).max(100),
    dpdp_reference: textSchema(2_000),
    checks: z.array(SubCheckResultSchema).max(100),
  })
  .strict();

export const DeeperAssessmentItemSchema = z
  .object({
    key: textSchema(200),
    label: textSchema(1_000),
    icon: textSchema(100),
    dpdp_reference: textSchema(2_000),
    why: textSchema(10_000),
    needs: textSchema(10_000),
  })
  .strict();

export const SecurityMetaSchema = z
  .object({
    final_url: z.string().trim().max(4_096).nullable().optional(),
    https: z.boolean(),
    tls_version: z.string().trim().max(100).nullable().optional(),
    tls_days_to_expiry: z.number().int().min(-100_000).max(100_000).nullable().optional(),
    third_party_domains: z.number().int().min(0).max(100_000),
    engine: textSchema(500),
    notes: z.array(textSchema(5_000)).max(50),
  })
  .strict();

export const SecurityReportSchema = z
  .object({
    url: textSchema(4_096),
    scanned_at: textSchema(100),
    overall_score: z.number().finite().min(0).max(100),
    grade: textSchema(20),
    risk_level: textSchema(100),
    summary: textSchema(20_000),
    capabilities: z.array(CapabilityResultSchema).max(100),
    remediation: z.array(SubCheckResultSchema).max(100),
    deeper_assessment: z.array(DeeperAssessmentItemSchema).max(60),
    meta: SecurityMetaSchema,
  })
  .strict();

export const ManagerContextSchema = z
  .object({
    sector: z.enum([
      "bfsi",
      "healthcare",
      "education",
      "saas_it",
      "ecommerce",
      "government",
      "other",
      "unspecified",
    ]),
    perspective: z.enum([
      "leadership",
      "privacy_legal",
      "security_engineering",
      "operations",
      "unspecified",
    ]),
    highImpactData: z
      .array(z.enum(["children", "health", "financial"]))
      .max(3)
      .refine((values) => new Set(values).size === values.length, "Duplicate values are not allowed."),
    activeBreach: z.enum(["no", "yes", "unsure"]),
  })
  .strict();

const RequestBaseSchema = z.object({
  report: SecurityReportSchema,
  context: ManagerContextSchema,
  locale: z.string().trim().min(2).max(10),
  readingMode: z.enum(["normal", "easy"]),
});

export const ManagerAnalysisRequestSchema = RequestBaseSchema.extend({
  action: z.literal("analyze"),
}).strict();

export const ManagerQuestionRequestSchema = RequestBaseSchema.extend({
  action: z.literal("question"),
  question: textSchema(500),
}).strict();

export const ManagerRequestSchema = z.discriminatedUnion("action", [
  ManagerAnalysisRequestSchema,
  ManagerQuestionRequestSchema,
]);

export const ManagerConfigResponseSchema = z
  .object({
    mode: z.enum(["live", "mock", "off"]),
    model: z.string().max(200).nullable(),
    provider: z.enum(["anthropic", "deterministic-mock"]).nullable(),
    configured: z.boolean(),
  })
  .strict();

export const EvidenceLinkSchema = z
  .object({
    findingId: textSchema(200),
    relevance: textSchema(800),
  })
  .strict();

export const FindingExplanationSchema = z
  .object({
    findingId: textSchema(200),
    observedFact: textSchema(2_000),
    interpretation: textSchema(2_000),
    legalReferenceIds: z.array(LegalReferenceIdSchema).min(1).max(6),
    uncertainty: textSchema(1_500),
    humanChecks: z.array(textSchema(1_000)).min(1).max(5),
    confidence: ConfidenceSchema,
  })
  .strict();

export const ManagerActionSchema = z
  .object({
    id: textSchema(200),
    horizon: ActionHorizonSchema,
    title: textSchema(300),
    findingIds: z.array(textSchema(200)).min(1).max(12),
    ownerRole: z.enum([
      "leadership",
      "privacy_legal",
      "security_engineering",
      "operations",
      "vendor_management",
      "cross_functional",
    ]),
    action: textSchema(2_000),
    rationale: textSchema(2_000),
    legalReferenceIds: z.array(LegalReferenceIdSchema).min(1).max(6),
    verificationSteps: z.array(textSchema(1_000)).min(1).max(5),
    assumptions: z.array(textSchema(1_000)).max(5),
    confidence: ConfidenceSchema,
  })
  .strict();

export const VerificationQuestionSchema = z
  .object({
    id: textSchema(200),
    question: textSchema(1_000),
    whyItMatters: textSchema(1_500),
    evidenceToInspect: z.array(textSchema(1_000)).min(1).max(5),
    relatedFindingIds: z.array(textSchema(200)).min(1).max(12),
    legalReferenceIds: z.array(LegalReferenceIdSchema).max(6),
    externallyObservable: z.literal(false),
  })
  .strict();

export const ManagerModelAnalysisSchema = z
  .object({
    attentionLevel: AttentionLevelSchema,
    headline: textSchema(140),
    executiveSummary: textSchema(1_200),
    supportedConclusions: z.array(textSchema(1_000)).max(5),
    unsupportedConclusions: z.array(textSchema(1_000)).max(5),
    evidenceLinks: z.array(EvidenceLinkSchema).max(60),
    explanations: z.array(FindingExplanationSchema).max(12),
    actions: z.array(ManagerActionSchema).max(10),
    verificationQuestions: z.array(VerificationQuestionSchema).max(6),
  })
  .strict();

export const ManagerAnalysisSchema = ManagerModelAnalysisSchema.extend({
  schemaVersion: z.literal("1.0"),
  runId: textSchema(200),
  generatedAt: textSchema(100),
  engine: z
    .object({
      kind: z.enum(["anthropic", "deterministic_mock"]),
      provider: z.enum(["anthropic", "deterministic-mock"]),
      model: textSchema(200),
    })
    .strict(),
  language: textSchema(10),
  disclaimer: textSchema(500),
}).strict();

export const ManagerQuestionResponseSchema = z
  .object({
    answer: textSchema(2_000),
    findingIds: z.array(textSchema(200)).max(12),
    legalReferenceIds: z.array(LegalReferenceIdSchema).max(6),
    confidence: ConfidenceSchema,
    uncertainty: textSchema(1_000),
    humanCheck: textSchema(1_000),
  })
  .strict();

export const ManagerErrorCodeSchema = z.enum([
  "invalid_request",
  "request_too_large",
  "rate_limited",
  "ai_not_configured",
  "provider_unavailable",
  "provider_timeout",
  "invalid_model_output",
]);

export const ManagerErrorResponseSchema = z
  .object({
    error: ManagerErrorCodeSchema,
    detail: textSchema(500),
    runId: nullableText(200).optional(),
  })
  .strict();

export type ManagerContext = z.infer<typeof ManagerContextSchema>;
export type ManagerAnalysisRequest = z.infer<typeof ManagerAnalysisRequestSchema>;
export type ManagerQuestionRequest = z.infer<typeof ManagerQuestionRequestSchema>;
export type ManagerConfigResponse = z.infer<typeof ManagerConfigResponseSchema>;
export type EvidenceLink = z.infer<typeof EvidenceLinkSchema>;
export type FindingExplanation = z.infer<typeof FindingExplanationSchema>;
export type ManagerAction = z.infer<typeof ManagerActionSchema>;
export type VerificationQuestion = z.infer<typeof VerificationQuestionSchema>;
export type ManagerModelAnalysis = z.infer<typeof ManagerModelAnalysisSchema>;
export type ManagerAnalysis = z.infer<typeof ManagerAnalysisSchema>;
export type ManagerQuestionResponse = z.infer<typeof ManagerQuestionResponseSchema>;
export type ManagerErrorCode = z.infer<typeof ManagerErrorCodeSchema>;
export type ManagerErrorResponse = z.infer<typeof ManagerErrorResponseSchema>;
export type Confidence = z.infer<typeof ConfidenceSchema>;
export type AttentionLevel = z.infer<typeof AttentionLevelSchema>;
export type ActionHorizon = z.infer<typeof ActionHorizonSchema>;