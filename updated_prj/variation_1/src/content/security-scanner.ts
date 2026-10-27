/** Types + presentation metadata for the DPDP Security Posture scan
 *  (mirrors scanner-agent/app/security_schemas.py). */

export type CheckStatus = "pass" | "fail" | "partial" | "unknown";

export type SubCheckResult = {
  id: string;
  label: string;
  status: CheckStatus;
  evidence?: string;
  dpdp_reference?: string;
  remediation?: string;
};

export type CapabilityResult = {
  key: string;
  label: string;
  icon: string;
  score: number;
  weight: number;
  dpdp_reference: string;
  checks: SubCheckResult[];
};

export type DeeperAssessmentItem = {
  key: string;
  label: string;
  icon: string;
  dpdp_reference: string;
  why: string;
  needs: string;
};

export type SecurityMeta = {
  final_url?: string | null;
  https: boolean;
  tls_version?: string | null;
  tls_days_to_expiry?: number | null;
  third_party_domains: number;
  engine: string;
  notes: string[];
};

export type SecurityReport = {
  url: string;
  scanned_at: string;
  overall_score: number;
  grade: string;
  risk_level: string;
  summary: string;
  capabilities: CapabilityResult[];
  remediation: SubCheckResult[];
  deeper_assessment: DeeperAssessmentItem[];
  meta: SecurityMeta;
};

export type SecurityScanError = { error: string; detail?: string };

export const STATUS_META: Record<CheckStatus, { label: string; badge: string }> = {
  pass: { label: "Pass", badge: "badge-green" },
  fail: { label: "Fail", badge: "badge-red" },
  partial: { label: "Partial", badge: "badge-gold" },
  unknown: { label: "N/A", badge: "badge-blue" },
};

export const SECURITY_COPY = {
  disclaimer:
    "This is a passive, external security-posture check of your public site - transport/TLS, security headers, data exposure, cookies, third-party surface and breach contactability - mapped to the DPDP Act, 2023. It reads only what any visitor can see; it does not log in or probe internal systems. Deeper controls (access, cloud, logging) need connected systems.",
  placeholder: "yourbusiness.com",
};
