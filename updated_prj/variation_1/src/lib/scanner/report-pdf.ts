/**
 * Client-side downloadable PDF for a TrustStack ScanReport (jsPDF).
 */
import type { ScanReport } from "@/content/scanner";
import { mapScanReportToIndicators, scoreBreakdownFromReport } from "@/lib/scanner/assessment-map";

type RGB = readonly [number, number, number];

const IVORY: RGB = [251, 248, 240];
const NAVY: RGB = [16, 31, 58];
const GOLD: RGB = [173, 138, 58];
const INK: RGB = [33, 37, 41];
const MUTED: RGB = [110, 116, 128];
const RED: RGB = [180, 60, 50];
const GREEN: RGB = [40, 130, 90];

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function safeName(url: string): string {
  try {
    return new URL(url.startsWith("http") ? url : `https://${url}`).hostname.replace(
      /[^\w.-]+/g,
      "_"
    );
  } catch {
    return "scan";
  }
}

export async function downloadScannerReportPdf(
  report: ScanReport,
  reportId?: string
): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = 210;
  const margin = 16;
  const maxW = W - margin * 2;
  let y = 18;

  const fill = (c: RGB) => doc.setFillColor(c[0], c[1], c[2]);
  const stroke = (c: RGB) => doc.setDrawColor(c[0], c[1], c[2]);
  const text = (c: RGB) => doc.setTextColor(c[0], c[1], c[2]);

  const ensure = (need: number) => {
    if (y + need > 285) {
      doc.addPage();
      y = 18;
    }
  };

  const writeWrapped = (
    str: string,
    opts: { size?: number; color?: RGB; bold?: boolean; gap?: number } = {}
  ) => {
    const size = opts.size ?? 10;
    const color = opts.color ?? INK;
    doc.setFont("helvetica", opts.bold ? "bold" : "normal");
    doc.setFontSize(size);
    text(color);
    const lines = doc.splitTextToSize(str, maxW) as string[];
    for (const line of lines) {
      ensure(size * 0.45 + 2);
      doc.text(line, margin, y);
      y += size * 0.42 + 1.2;
    }
    y += opts.gap ?? 1;
  };

  // Header bar
  fill(NAVY);
  doc.rect(0, 0, W, 28, "F");
  text([255, 255, 255]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("TrustStack DPDP Assessment Report", margin, 12);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  text([200, 210, 220]);
  doc.text("Indicative public-signal scan · not legal advice", margin, 20);
  y = 36;

  fill(IVORY);
  doc.rect(margin, y, maxW, 28, "F");
  stroke(GOLD);
  doc.setLineWidth(0.4);
  doc.rect(margin, y, maxW, 28);
  text(NAVY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text(`${report.overall_score}`, margin + 6, y + 14);
  doc.setFontSize(9);
  text(MUTED);
  doc.text("/ 100", margin + 6, y + 20);
  text(NAVY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(
    `${report.grade || " - "}  ·  ${String(report.risk_level || "").toUpperCase()} RISK`,
    margin + 32,
    y + 12
  );
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  text(MUTED);
  const urlLine = doc.splitTextToSize(report.meta.final_url ?? report.url, maxW - 40) as string[];
  doc.text(urlLine[0] ?? report.url, margin + 32, y + 19);
  y += 36;

  writeWrapped(`Assessment date: ${fmtDate(report.scanned_at)}`, {
    size: 9,
    color: MUTED,
  });
  if (reportId) {
    writeWrapped(`Report ID: ${reportId}`, { size: 8, color: MUTED });
  }
  writeWrapped(report.summary || "No summary available.", { size: 10, gap: 4 });

  // Category scores
  if (report.categories.length) {
    ensure(14);
    writeWrapped("Score by category", { size: 12, bold: true, color: NAVY, gap: 2 });
    for (const c of report.categories) {
      ensure(8);
      text(INK);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(`${c.label}`, margin, y);
      doc.text(`${c.score}`, margin + maxW - 8, y, { align: "right" });
      y += 3;
      fill([230, 230, 230]);
      doc.rect(margin, y, maxW, 2.2, "F");
      const barW = Math.max(1, (maxW * Math.min(100, c.score)) / 100);
      fill(c.score >= 67 ? GREEN : c.score >= 34 ? GOLD : RED);
      doc.rect(margin, y, barW, 2.2, "F");
      y += 7;
    }
    y += 2;
  }

  // Key signals
  ensure(16);
  writeWrapped("Key signals", { size: 12, bold: true, color: NAVY, gap: 2 });
  const privacy = report.policies.find((p) => p.kind === "privacy");
  const cookiePol = report.policies.find((p) => p.kind === "cookie");
  const signals = [
    ["HTTPS", report.meta.https ? "Yes" : "No"],
    ["Consent banner", report.meta.consent_banner_detected ? "Detected" : "Not detected"],
    ["Privacy policy", privacy?.found ? "Found" : "Not found"],
    ["Cookie policy", cookiePol?.found ? "Found" : "Not found"],
    ["Cookies on load", String(report.meta.cookies_total)],
    ["Third-party trackers", String(report.meta.third_party_trackers)],
  ];
  for (const [k, v] of signals) {
    ensure(6);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    text(INK);
    doc.text(k, margin, y);
    doc.setFont("helvetica", "normal");
    text(MUTED);
    doc.text(v, margin + 55, y);
    y += 5.5;
  }
  y += 3;

  const indicators = mapScanReportToIndicators(report);
  const breakdown = scoreBreakdownFromReport(report);
  const remediation = indicators.filter((i) => i.status !== "Found");

  if (remediation.length) {
    ensure(14);
    writeWrapped(`Remediation Plan (${remediation.length} items)`, {
      size: 12,
      bold: true,
      color: NAVY,
      gap: 2,
    });
    remediation.forEach((f, idx) => {
      ensure(16);
      writeWrapped(`${idx + 1}. [${f.status}] ${f.indicator}`, {
        size: 10,
        bold: true,
        gap: 0.5,
      });
      if (f.recommendation)
        writeWrapped(`Action: ${f.recommendation}`, { size: 9, color: INK, gap: 0.5 });
      writeWrapped(
        `${f.rule} · ${f.points}/${f.max_points} pts · conf ${f.confidence}`,
        { size: 8, color: MUTED, gap: 2 }
      );
    });
  }

  if (indicators.length) {
    ensure(14);
    writeWrapped("Compliance Summary", {
      size: 12,
      bold: true,
      color: NAVY,
      gap: 2,
    });
    for (const row of indicators) {
      ensure(8);
      writeWrapped(
        `${row.indicator} - ${row.status} · ${row.points}/${row.max_points} · ${row.rule}`,
        { size: 8, color: INK, gap: 1.2 }
      );
    }
    y += 2;
  }

  if (breakdown.length) {
    ensure(14);
    writeWrapped("Score Breakdown", { size: 12, bold: true, color: NAVY, gap: 2 });
    for (const b of breakdown) {
      ensure(7);
      writeWrapped(`+${b.points} pts · ${b.label} - ${b.citation}`, {
        size: 9,
        gap: 1.2,
      });
    }
    y += 2;
  }

  if (indicators.length) {
    ensure(14);
    writeWrapped("Detailed Analysis", {
      size: 12,
      bold: true,
      color: NAVY,
      gap: 2,
    });
    for (const f of indicators) {
      ensure(18);
      writeWrapped(`[${f.status}] ${f.indicator}`, {
        size: 10,
        bold: true,
        gap: 0.5,
      });
      if (f.analysis) writeWrapped(f.analysis, { size: 9, color: MUTED, gap: 0.5 });
      if (f.excerpt && f.excerpt !== f.analysis)
        writeWrapped(`Excerpt: “${f.excerpt}”`, { size: 8, color: MUTED, gap: 0.5 });
      if (f.recommendation && f.status !== "Found")
        writeWrapped(`Recommended action: ${f.recommendation}`, {
          size: 9,
          color: INK,
          gap: 0.5,
        });
      writeWrapped(f.rule, { size: 8, color: MUTED, gap: 2 });
    }
  }

  // Policies
  if (report.policies.some((p) => p.found || p.url)) {
    ensure(14);
    writeWrapped("Discovered policy pages", {
      size: 12,
      bold: true,
      color: NAVY,
      gap: 2,
    });
    for (const p of report.policies) {
      ensure(10);
      writeWrapped(
        `${p.kind}: ${p.found ? p.url || "Found" : "Not found"}${
          p.word_count ? ` (${p.word_count} words)` : ""
        }`,
        { size: 9, gap: 1.5 }
      );
    }
  }

  // Trackers / cookies (compact)
  if (report.trackers.length) {
    ensure(14);
    writeWrapped(`Third-party domains (${report.trackers.length})`, {
      size: 12,
      bold: true,
      color: NAVY,
      gap: 2,
    });
    writeWrapped(
      report.trackers.map((t) => `${t.domain} (${t.category})`).join(", "),
      { size: 8, color: MUTED, gap: 3 }
    );
  }

  if (report.cookies.length) {
    ensure(14);
    writeWrapped(`Cookies on load (${report.cookies.length})`, {
      size: 12,
      bold: true,
      color: NAVY,
      gap: 2,
    });
    for (const ck of report.cookies.slice(0, 40)) {
      ensure(6);
      writeWrapped(
        `${ck.name} · ${ck.domain} · ${ck.session ? "session" : "persistent"}${
          ck.third_party ? " · 3rd-party" : ""
        }`,
        { size: 8, color: MUTED, gap: 0.8 }
      );
    }
    if (report.cookies.length > 40) {
      writeWrapped(`…and ${report.cookies.length - 40} more`, {
        size: 8,
        color: MUTED,
      });
    }
  }

  // Footer disclaimer
  ensure(20);
  y += 4;
  stroke(GOLD);
  doc.setLineWidth(0.3);
  doc.line(margin, y, margin + maxW, y);
  y += 6;
  writeWrapped(
    "Disclaimer: This automated scan is an indicative first-pass check of public-facing signals against the DPDP Act, 2023 / Rules. It is not legal advice or a certification.",
    { size: 7.5, color: MUTED }
  );

  const file = `TrustStack-DPDP-Report-${safeName(report.url)}-${report.overall_score}.pdf`;
  doc.save(file);
}
