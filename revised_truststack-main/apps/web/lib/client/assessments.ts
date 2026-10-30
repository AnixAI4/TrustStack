"use client";

/** Shapes the assessment API returns. Kept next to the client fetch helper. */

export interface AssessmentSummary {
  id: string;
  organizationId: string;
  name: string;
  assessmentType: string;
  status: string;
  industryCode: string | null;
  riskTags: string[];
  /** Anix staff only (`question.read_bank`, D-071) — absent for a client. */
  packCodes?: string[];
  scopeDerivedAt: string | null;
  generatedAt: string | null;
  createdAt: string;
  questionCount?: number;
}

export interface AssessmentQuestion {
  questionCode: string;
  questionVersion: string;
  questionText: string;
  domainCode: string;
  domainWeight: number;
  applicability: string;
  priority: string | null;
  evidenceGuidance: string | null;
  suggestedOwner: string | null;
  sortOrder: number;
  /** Provenance — Anix staff only (D-071); absent for a client. */
  packCode?: string | null;
  includedReason?: string | null;
}

export interface DomainSummary {
  domainCode: string;
  weight: number;
  questionCount: number;
  potentiallyApplicableCount: number;
}

export interface GenerationSummary {
  questionCount: number;
  domains: DomainSummary[];
  // Anix staff only (D-071) — absent for a client.
  packCodes?: string[];
  skippedPacks?: { code: string; reason: string }[];
  excludedByTrigger?: { questionCode: string; triggerText: string; expression: string }[];
  triggerCoverage?: { mapped: number; unresolved: number; unresolvedPhrases: string[]; unstatedConditions: number };
}

export const APPLICABILITY_LABEL: Record<string, string> = {
  mandatory: "Mandatory",
  conditional: "Conditional",
  potentially_applicable: "Potentially Applicable",
};

/** `trigger:<expression>` is shown as the expression that put the question in. */
export function includedReasonLabel(reason: string): string {
  if (reason === "core") return "Core pack";
  if (reason === "overlay") return "Industry overlay";
  if (reason === "potentially_applicable") return "Potentially Applicable — the scope cannot decide";
  if (reason.startsWith("trigger:")) return `Triggered by ${reason.slice("trigger:".length)}`;
  return reason;
}

// --- Slice 4: answers, evidence, one domain's score ------------------------

export interface EvidenceItem {
  id: string;
  fileName: string;
  contentType: string;
  byteSize: number;
  uploadedBy: string | null;
  uploadedAt: string;
  reviewStatus: string;
  evidenceLevel: number | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  reviewNotes: string | null;
}

export interface AssessmentResponse {
  id: string;
  assessmentId: string;
  questionCode: string;
  applicabilityDecision: "applicable" | "not_applicable";
  naReason: string | null;
  claimedMaturity: number | null;
  /** Strongest REVIEWED artefact; null = nothing reviewed yet, scored as E0. */
  evidenceLevel: number | null;
  adjustedScore: number | null;
  capApplied: boolean;
  notes: string | null;
  answeredBy: string | null;
  answeredAt: string;
  evidence: EvidenceItem[];
}

export interface DomainScore {
  code: string;
  domainId: string;
  name: string;
  /** `scored` · `scoped_out` · `all_not_applicable` — they must stay distinct (D-038). */
  state: "scored" | "scoped_out" | "all_not_applicable";
  scopedOut: boolean;
  weight: number;
  score: number | null;
  percent: number | null;
  avgAdjusted: number | null;
  maturityLevel: string | null;
  evidenceConfidence: number | null;
  questionCount: number;
  applicableCount: number;
  notApplicableCount: number;
  outstandingCount: number;
  provisional: boolean;
  criticalCount: number;
  highCount: number;
  status: "critical" | "high_risk" | "needs_work" | "on_track";
}

export interface FiredRedFlag {
  code: string;
  domainCode: string;
  cap: number;
  /** Plain language — the client never sees a question or pack code (D-040). */
  label: string;
  questionCodes: string[];
}

export interface OverallScore {
  /** Before any red-flag cap. */
  rawScore: number;
  scoreCap: number;
  /** `min(rawScore, scoreCap)` — the reported DPDP Compass Readiness Score. */
  finalScore: number;
  /** The D-038 denominator: Σ weight of the SCORED domains. Often 100, not always. */
  applicableWeight: number;
  coverage: number;
  maturityLevel: string;
  evidenceConfidence: number | null;
  criticalCount: number;
  highCount: number;
  redFlags: FiredRedFlag[];
  provisional: boolean;
  outstandingCount: number;
  engineVersion: string;
}

export interface AssessmentScorePayload {
  assessmentId: string;
  status: string;
  /** True when these numbers were READ from a frozen snapshot, not recomputed. */
  finalised: boolean;
  snapshot: { id: string; calculatedAt: string; calculatedBy: string | null } | null;
  overall: OverallScore;
  domains: DomainScore[];
}

export const DOMAIN_STATUS_LABEL: Record<string, string> = {
  critical: "Critical",
  high_risk: "High Risk",
  needs_work: "Needs Work",
  on_track: "On Track",
};

/** What a domain contributes, in the client's language — never "scoped_out". */
export const DOMAIN_STATE_LABEL: Record<string, string> = {
  scored: "Scored",
  scoped_out: "Scoped out",
  all_not_applicable: "All Not Applicable",
};

export const REVIEW_STATUS_LABEL: Record<string, string> = {
  pending: "Awaiting review",
  adequate: "Adequate",
  strong: "Strong",
  partial: "Partial",
  rejected: "Rejected",
  outdated: "Outdated",
};

/** Two decimals, the way the workbook reports a domain score. */
export const formatScore = (n: number) => n.toFixed(2);
