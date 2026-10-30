"use client";

import type {
  RopaAreaCode,
  RopaBand,
  RopaChildExemption,
  RopaGapCode,
  RopaLawfulBasis,
  RopaRetentionTrigger,
  RopaRiskRating,
  RopaSafeguard,
  RopaStatus,
  RopaTemplate,
  TriState,
} from "@truststack/core";
import type { EvidenceItem } from "./assessments";
import type { GapAction, GapMember } from "./gaps";

/** Shapes the ROPA register API returns (Slice 7). */

export interface RopaRecordSummary {
  id: string;
  recordCode: string;
  name: string;
  departmentId: string | null;
  departmentText: string | null;
  ownerUserId: string | null;
  ownerName: string | null;
  status: RopaStatus;
  statusLabel: string;
  version: number;
  childrenData: TriState;
  aiProcessing: TriState;
  completenessScore: number;
  completenessBand: RopaBand;
  completenessBandLabel: string;
  riskRating: RopaRiskRating;
  riskRatingLabel: string;
  lastReviewedAt: string | null;
  nextReviewAt: string | null;
  evidenceCount: number;
  updatedAt: string;
}

export interface RopaArea {
  code: RopaAreaCode;
  label: string;
  weight: number;
  rule: string;
  complete: boolean;
}

export interface RopaRecord extends RopaRecordSummary {
  description: string | null;
  dataPrincipalTypes: string | null;
  dataCategories: string | null;
  estimatedDataPrincipals: number | null;
  purpose: string | null;
  legalBasisNote: string | null;
  collectionSource: string | null;
  systemsText: string | null;
  vendorsText: string | null;
  sharing: string | null;
  retentionRule: string | null;
  securitySafeguards: string | null;
  noticeLinked: string | null;
  consentLinked: string | null;
  rightsWorkflow: string | null;
  grievanceLinked: string | null;
  crossBorder: TriState;
  highRiskDocuments: TriState;
  evidenceNote: string | null;
  lawfulBasis: RopaLawfulBasis | null;
  childParentalConsent: TriState;
  childExemption: RopaChildExemption | null;
  childTracking: TriState;
  retentionTrigger: RopaRetentionTrigger | null;
  retentionLaw: string | null;
  safeguards: RopaSafeguard[];
  /** Linked Data Processors without a contract or DPDP clauses — counted by the database. */
  vendorContractGaps: number;
  approvedBy: string | null;
  approvedByName: string | null;
  approvedAt: string | null;
  createdAt: string;
  areas: RopaArea[];
  risk: {
    rating: RopaRiskRating;
    derived: RopaRiskRating;
    assessor: RopaRiskRating | null;
    assessorReason: string | null;
    modelVersion: string;
    points: number;
    factors: { code: string; label: string; points: number }[];
  };
  systems: { id: string; name: string }[];
  vendors: { id: string; name: string }[];
  evidence: EvidenceItem[];
}

export interface RopaOptions {
  departments: { id: string; name: string }[];
  systems: { id: string; name: string }[];
  vendors: { id: string; name: string }[];
  members: GapMember[];
}

export interface RopaRegisterPayload {
  organizationId: string;
  industryCode: string | null;
  templates: RopaTemplate[];
  positioning: string;
  counts: {
    total: number;
    archived: number;
    approved: number;
    belowUsable: number;
    highRisk: number;
    children: number;
    reviewOverdue: number;
    byBand: Record<RopaBand, number>;
  };
  records: RopaRecordSummary[];
  options: RopaOptions | null;
}

export interface RopaGap {
  id: string;
  recordId: string | null;
  recordCode: string | null;
  recordName: string | null;
  gapCode: RopaGapCode;
  label: string;
  severity: "critical" | "high" | "medium" | "low";
  priority: "P0" | "P1" | "P2" | "P3";
  state: "open" | "superseded";
  finding: string;
  recommendedFix: string;
  generatedAt: string;
  actions: GapAction[];
}

export interface RopaDetailPayload {
  record: RopaRecord;
  gaps: RopaGap[];
  options?: RopaOptions | null;
}

export interface RopaGapsPayload {
  counts: { gapCount: number; critical: number; high: number; medium: number; low: number; supersededCount: number };
  stale: boolean;
  generated: boolean;
  gaps: RopaGap[];
  members: GapMember[];
}

export const BAND_STYLE: Record<RopaBand, string> = {
  incomplete: "bg-red-100 text-red-900",
  basic: "bg-amber-100 text-amber-900",
  usable: "bg-sky-100 text-sky-900",
  strong: "bg-emerald-100 text-emerald-900",
};

export const RISK_STYLE: Record<RopaRiskRating, string> = {
  critical: "bg-red-100 text-red-900",
  high: "bg-orange-100 text-orange-900",
  medium: "bg-amber-100 text-amber-900",
  low: "bg-slate-100 text-slate-800",
};

export const TRI_LABEL: Record<TriState, string> = { yes: "Yes", no: "No", unknown: "Not known" };

/** The words every ROPA screen opens with (D-011): a readiness register, not a statutory record. */
export const ROPA_POSITIONING =
  "A practical DPDP readiness register of your processing activities. It is not a statutory record, and a Strong record is complete — not a finding that the processing is lawful.";

export interface RopaLookupRecord {
  id: string;
  recordCode: string;
  name: string;
  status: RopaStatus;
  match: "linked" | "named";
  dataPrincipalTypes: string | null;
  dataCategories: string | null;
  purpose: string | null;
  lawfulBasis: RopaLawfulBasis | null;
  lawfulBasisLabel: string | null;
  retentionRule: string | null;
  sharing: string | null;
  systems: string[];
  systemsText: string | null;
  processors: string[];
  vendorsText: string | null;
  childrenData: TriState;
  riskRating: RopaRiskRating;
}

export interface RopaLookupPayload {
  principals: string[];
  systems: { id: string; name: string }[];
  vendors: { id: string; name: string }[];
  subject: string | null;
  records: RopaLookupRecord[];
}
