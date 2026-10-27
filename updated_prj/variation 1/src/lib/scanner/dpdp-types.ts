/** Original DPDP scanner ReportContext (dpdp_comp) — stored as user_scans.payload. */

export type IndicatorStatus = "Found" | "Partial" | "Missing";

export type IndicatorRow = {
  key: string;
  indicator: string;
  status: string;
  confidence: string;
  rule: string;
  points: number;
  max_points: number;
};

export type DpdpFinding = IndicatorRow & {
  analysis: string;
  recommendation: string;
  excerpt: string;
};

export type DpdpReportCore = {
  url?: string;
  timestamp?: string;
  scraping_method?: string;
  privacy_policy_found?: boolean;
  cookie_banner_found?: boolean;
  grievance_officer_contact?: string | null;
  errors?: string[];
  score?: number;
  verdict?: string;
  scanner_version?: string;
  rules_version?: string;
};

export type DpdpReportContext = {
  engine: "dpdp_comp";
  report_id: string;
  report: DpdpReportCore;
  score: number;
  verdict: string;
  verdict_class: string;
  score_class: string;
  rows: IndicatorRow[];
  missing_indicators?: IndicatorRow[];
  discovered_policy_pages?: Record<string, string>;
  findings: DpdpFinding[];
  score_breakdown: Record<string, number>;
  rule_citations: Record<string, string>;
  analysis_details: Record<string, unknown>;
  ai_engine: string;
  policy_extraction_warning: boolean;
  prompt_injection_detected?: string[];
  scanner_version: string;
  rules_version: string;
  access_tier?: "preview" | "full";
  confidence_label?: "high" | "medium" | "low" | null;
  average_confidence?: number | null;
};

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) {
    return Number(value);
  }
  return null;
}

/**
 * Coerce Flask / stored JSON into a stable ReportContext shape.
 * Older rows and thin API shells may omit top-level score/verdict/findings.
 */
export function normalizeDpdpReportContext(
  value: unknown,
  reportId?: string
): DpdpReportContext | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  const report =
    v.report && typeof v.report === "object"
      ? (v.report as Record<string, unknown>)
      : {};

  const rows = Array.isArray(v.rows) ? (v.rows as IndicatorRow[]) : [];
  const findings = Array.isArray(v.findings)
    ? (v.findings as DpdpFinding[])
    : [];

  // Thin TrustStack shells have engine=dpdp_comp but empty findings/rows —
  // those are not reopenable full reports.
  const looksLikeEngine =
    v.engine === "dpdp_comp" ||
    rows.length > 0 ||
    findings.length > 0 ||
    Boolean(v.score_breakdown && typeof v.score_breakdown === "object");

  if (!looksLikeEngine) return null;

  const score =
    asNumber(v.score) ??
    asNumber(report.score) ??
    asNumber(v.overall_score);
  if (score === null) return null;

  // Require at least one of the checklist structures so a thin shell
  // ({ engine, findings: [] }) never passes as a full report.
  if (rows.length === 0 && findings.length === 0) return null;

  const verdict = String(
    v.verdict || report.verdict || v.grade || v.risk_level || ""
  ).trim();
  if (!verdict) return null;

  return {
    ...(v as unknown as DpdpReportContext),
    engine: "dpdp_comp",
    report_id: String(v.report_id || reportId || ""),
    report: (v.report as DpdpReportCore) || {},
    score,
    verdict,
    verdict_class: String(v.verdict_class || ""),
    score_class: String(v.score_class || ""),
    rows,
    findings,
    score_breakdown:
      v.score_breakdown && typeof v.score_breakdown === "object"
        ? (v.score_breakdown as Record<string, number>)
        : {},
    rule_citations:
      v.rule_citations && typeof v.rule_citations === "object"
        ? (v.rule_citations as Record<string, string>)
        : {},
    analysis_details:
      v.analysis_details && typeof v.analysis_details === "object"
        ? (v.analysis_details as Record<string, unknown>)
        : {},
    ai_engine: String(v.ai_engine || "DeepSeek Expert"),
    policy_extraction_warning: Boolean(v.policy_extraction_warning),
    scanner_version: String(v.scanner_version || report.scanner_version || ""),
    rules_version: String(v.rules_version || report.rules_version || ""),
  };
}

export function isDpdpReportContext(value: unknown): value is DpdpReportContext {
  return normalizeDpdpReportContext(value) !== null;
}
