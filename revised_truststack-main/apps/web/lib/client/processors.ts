"use client";

import type { TriState, VendorAssessmentStatus, VendorLinkState, VendorQuestionSection, VendorRiskTier, VendorRole } from "@truststack/core";

/** Shapes the processor register's API returns (Slice 10, Stage 4a). Dates are India's calendar dates; times are instants. */

export interface ProcessorDocument {
  id: string;
  fileName: string;
  contentType: string;
  byteSize: number;
  uploadedBy: string | null;
  uploadedAt: string;
  reviewStatus: string;
  /** Stored and not rejected or outdated in review — it can back an answer. */
  counts: boolean;
  /** Uploaded by the vendor's respondent through a link (Stage 4b). */
  fromVendor: boolean;
}

export interface AssessmentHeader {
  id: string;
  vendorId: string;
  version: number;
  status: VendorAssessmentStatus;
  statusLabel: string;
  source: string;
  sourceLabel: string;
  sourceNote: string | null;
  riskScore: number | null;
  riskTier: VendorRiskTier | null;
  riskTierLabel: string | null;
  unevidenced: string[];
  reviewBy: string | null;
  outOfDate: boolean;
  returnReason: string | null;
  createdBy: string | null;
  createdByName: string | null;
  submittedBy: string | null;
  submittedByName: string | null;
  submittedAt: string | null;
  reviewedBy: string | null;
  reviewedByName: string | null;
  reviewedAt: string | null;
  /** The vendor's respondent declared it accurate and complete (Stage 4b). */
  declaration: { name: string; role: string; at: string } | null;
  /** A link to the vendor is open: the vendor is answering. */
  withVendor: boolean;
  createdAt: string;
}

/** A link sent to the vendor's respondent (Stage 4b) — never its token. */
export interface VendorLink {
  id: string;
  respondentName: string;
  respondentEmail: string;
  state: VendorLinkState;
  stateLabel: string;
  expiresAt: string;
  confirmedAt: string | null;
  submittedAt: string | null;
  revokedAt: string | null;
  revokedByName: string | null;
  sentBy: string | null;
  sentByName: string | null;
  sentAt: string;
}

export interface Processor {
  id: string;
  name: string;
  service: string | null;
  vendorRole: VendorRole;
  contractExists: TriState;
  dpdpClauses: TriState;
  crossBorder: TriState;
  subProcessorsKnown: TriState;
  contractSignedOn: string | null;
  contractReviewBy: string | null;
  contractReviewPassed: boolean;
  isProcessor: boolean;
  contractGap: boolean;
  documents: ProcessorDocument[];
  current: AssessmentHeader | null;
  open: AssessmentHeader | null;
  versions: AssessmentHeader[];
}

export interface ProcessorRegisterPayload {
  today: string;
  counts: {
    vendors: number;
    processors: number;
    contractGaps: number;
    accepted: number;
    neverAssessed: number;
    awaitingReview: number;
    outOfDate: number;
    withVendor: number;
  };
  vendors: Processor[];
}

export interface AssessmentAnswer {
  code: string;
  answer: string | null;
  notApplicable: boolean;
  naReason: string | null;
  evidenceId: string | null;
  answeredBy: string | null;
  answeredByName: string | null;
  /** The vendor's respondent answered it through a link. */
  answeredByVendor: boolean;
  answeredAt: string;
}

export interface AssessmentDetail {
  processor: Processor;
  assessment: AssessmentHeader & {
    riskIsPreview: boolean;
    answered: number;
    notApplicable: number;
    scorable: number;
    missing: string[];
    flags: { code: string; questions: string[]; message: string }[];
    involved: string[];
    links: VendorLink[];
    openLink: VendorLink | null;
    answers: AssessmentAnswer[];
  };
}

export const ASSESSMENT_STATUS_STYLE: Readonly<Record<VendorAssessmentStatus, string>> = {
  draft: "bg-slate-100 text-slate-700",
  submitted: "bg-amber-50 text-amber-800",
  returned: "bg-orange-50 text-orange-800",
  accepted: "bg-emerald-50 text-emerald-800",
};

export const RISK_TIER_STYLE: Readonly<Record<VendorRiskTier, string>> = {
  low: "text-emerald-800",
  medium: "text-amber-800",
  high: "text-orange-800",
  critical: "text-red-800",
};

export const TRI_LABEL: Readonly<Record<TriState, string>> = { yes: "Yes", no: "No", unknown: "Not known" };

export const ROLE_LABEL: Readonly<Record<VendorRole, string>> = {
  data_processor: "Data processor",
  independent: "Independent fiduciary",
  unknown: "Role not known",
};

/**
 * A questionnaire section's tab (Slice 10.5 B5a, N1): its letter and a short
 * name — the full `VENDOR_SECTION_LABEL` heads the panel and names the Next step.
 */
export const SECTION_TAB: Readonly<Record<VendorQuestionSection, string>> = {
  company: "A · Company",
  data_handling: "B · Data handling",
  security: "C · Security",
  subprocessors: "D · Sub-processors",
  residency: "E · Residency",
  incident: "F · Incidents",
  dpdp: "G · DPDP duties",
};
