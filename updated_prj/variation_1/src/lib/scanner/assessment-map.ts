import type { Finding, ScanReport, Severity } from "@/content/scanner";

export type IndicatorStatus = "Found" | "Partial" | "Missing";

/** Indicator row shaped like the original DPDP scanner report. */
export type AssessmentIndicator = {
  key: string;
  indicator: string;
  status: IndicatorStatus;
  confidence: string;
  rule: string;
  points: number;
  max_points: number;
  analysis: string;
  recommendation: string;
  excerpt: string;
  category: string;
};

function severityToStatus(s: Severity): IndicatorStatus {
  if (s === "pass") return "Found";
  if (s === "info" || s === "low") return "Partial";
  return "Missing";
}

function severityConfidence(s: Severity): string {
  if (s === "pass" || s === "critical") return "90%";
  if (s === "high") return "80%";
  if (s === "medium") return "70%";
  if (s === "low") return "60%";
  return "55%";
}

function severityShare(s: Severity): number {
  switch (s) {
    case "critical":
      return 1.4;
    case "high":
      return 1.2;
    case "medium":
      return 1;
    case "low":
      return 0.7;
    case "info":
      return 0.5;
    case "pass":
      return 1;
    default:
      return 1;
  }
}

function earnedRatio(status: IndicatorStatus): number {
  if (status === "Found") return 1;
  if (status === "Partial") return 0.45;
  return 0;
}

/** Map TrustStack ScanReport findings into original-style indicator rows. */
export function mapScanReportToIndicators(report: ScanReport): AssessmentIndicator[] {
  const byCat = new Map<string, Finding[]>();
  for (const f of report.findings) {
    const list = byCat.get(f.category) || [];
    list.push(f);
    byCat.set(f.category, list);
  }

  const catMax = new Map<string, number>();
  for (const c of report.categories) {
    catMax.set(c.key, Math.round(c.weight * 100));
  }
  // Fallback for findings whose category isn't in categories[]
  for (const key of byCat.keys()) {
    if (!catMax.has(key)) catMax.set(key, 10);
  }

  const rows: AssessmentIndicator[] = [];

  for (const [cat, findings] of byCat) {
    const maxForCat = catMax.get(cat) ?? 10;
    const shareSum = findings.reduce((s, f) => s + severityShare(f.severity), 0) || 1;

    for (const f of findings) {
      const status = severityToStatus(f.severity);
      const max_points =
        Math.round(((severityShare(f.severity) / shareSum) * maxForCat) * 10) / 10;
      const points = Math.round(max_points * earnedRatio(status) * 10) / 10;
      const policyExcerpt =
        report.policies.find((p) => p.kind === "privacy" && p.excerpt)?.excerpt || "";

      rows.push({
        key: f.id,
        indicator: f.title,
        status,
        confidence: severityConfidence(f.severity),
        rule: f.dpdp_reference || catLabel(report, f.category),
        points,
        max_points,
        analysis: f.evidence || analysisFallback(f, status),
        recommendation: f.recommendation || "",
        excerpt: f.evidence || (status !== "Found" ? "" : policyExcerpt.slice(0, 280)),
        category: f.category,
      });
    }
  }

  // Stable order: Missing → Partial → Found, then by gap
  const rank = { Missing: 0, Partial: 1, Found: 2 } as const;
  rows.sort(
    (a, b) =>
      rank[a.status] - rank[b.status] ||
      b.max_points - b.points - (a.max_points - a.points)
  );

  return rows;
}

function catLabel(report: ScanReport, key: string): string {
  return report.categories.find((c) => c.key === key)?.label || key;
}

function analysisFallback(f: Finding, status: IndicatorStatus): string {
  if (status === "Found") {
    return `This check passed for “${f.title}”. Evidence was present in the public website signals collected during the scan.`;
  }
  if (status === "Partial") {
    return `Partial evidence for “${f.title}”. The site shows related signals, but the wording or coverage looks incomplete against DPDP expectations.`;
  }
  return `“${f.title}” was not clearly evidenced from the public pages scanned. Closing this gap improves DPDP readiness.`;
}

export function scoreBreakdownFromReport(
  report: ScanReport
): { label: string; points: number; citation: string }[] {
  return report.categories.map((c) => ({
    label: c.label,
    points: Math.round(c.score * c.weight),
    citation: `Weight ${(c.weight * 100).toFixed(0)}% · category score ${c.score}/100`,
  }));
}

export function verdictFromReport(report: ScanReport): string {
  const g = (report.grade || "").trim();
  if (g && g !== " - " && !/^[A-F][+-]?$/i.test(g)) return g;
  const risk = (report.risk_level || "").toLowerCase();
  if (risk === "low") return "Likely Compliant";
  if (risk === "medium") return "Partially Compliant";
  if (risk === "high" || risk === "critical") return "Likely Non-Compliant";
  return g || "Assessment complete";
}
