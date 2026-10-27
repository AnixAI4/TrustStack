/** Types + presentation metadata for the DPDP Scanner (mirrors the service's
 *  ScanReport schema in scanner-agent/app/models.py). */

export type Severity = "critical" | "high" | "medium" | "low" | "pass" | "info";

export type Finding = {
  id: string;
  category: string;
  title: string;
  severity: Severity;
  evidence?: string;
  dpdp_reference?: string;
  recommendation?: string;
  source?: string;
};

export type CategoryScore = {
  key: string;
  label: string;
  score: number;
  weight: number;
};

export type CookieItem = {
  name: string;
  domain: string;
  third_party: boolean;
  secure: boolean;
  http_only: boolean;
  same_site?: string | null;
  session: boolean;
  category: string;
};

export type TrackerItem = {
  domain: string;
  category: string;
  requests: number;
};

export type PolicyDoc = {
  kind: string;
  url?: string | null;
  found: boolean;
  word_count: number;
  excerpt: string;
};

export type ScanMeta = {
  https: boolean;
  final_url?: string | null;
  status: number;
  consent_banner_detected: boolean;
  security_headers: Record<string, boolean>;
  cookies_total: number;
  third_party_trackers: number;
  model_mode: string;
  engine: string;
  notes: string[];
};

export type ScanReport = {
  url: string;
  scanned_at: string;
  overall_score: number;
  grade: string;
  risk_level: string;
  summary: string;
  categories: CategoryScore[];
  findings: Finding[];
  cookies: CookieItem[];
  trackers: TrackerItem[];
  policies: PolicyDoc[];
  meta: ScanMeta;
};

export type ScanError = { error: string; detail?: string };

export const SEVERITY_META: Record<
  Severity,
  { label: string; badge: string; order: number }
> = {
  critical: { label: "Critical", badge: "badge-red", order: 0 },
  high: { label: "High", badge: "badge-red", order: 1 },
  medium: { label: "Medium", badge: "badge-gold", order: 2 },
  low: { label: "Low", badge: "badge-blue", order: 3 },
  info: { label: "Info", badge: "badge-blue", order: 4 },
  pass: { label: "Pass", badge: "badge-green", order: 5 },
};

export const SCANNER_COPY = {
  disclaimer:
    "This automated scan is an indicative first-pass check of public-facing signals (cookies, trackers, consent banner and policy pages) against the DPDP Act, 2023. It is not legal advice or a certification. For a defensible assessment, book a DPDP Compass\u2122 review.",
  placeholder: "yourbusiness.com",
};
