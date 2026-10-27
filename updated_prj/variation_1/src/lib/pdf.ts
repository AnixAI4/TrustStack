/**
 * Real client-side PDF generation, built on jsPDF (vector output - crisp,
 * lightweight, and a genuine `.pdf` download rather than a print dialog or an
 * `.svg`/`.html` blob).
 *
 * Every helper here is browser-only: jsPDF is imported dynamically inside each
 * function so it is code-split and never pulled into the server bundle. Call
 * these from `"use client"` components, in response to a user action.
 */

import type { ActChapter } from "@/content/act";
import { certificateSealSvg } from "@/lib/seal";

type RGB = readonly [number, number, number];

// ── Brand palette, tuned for print (warm ivory paper, navy + gold ink) ──────
const IVORY: RGB = [251, 248, 240];
const NAVY: RGB = [16, 31, 58];
const GOLD: RGB = [173, 138, 58];
const INK: RGB = [33, 37, 41];
const MUTED: RGB = [110, 116, 128];

function ts(date = new Date()): string {
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

/** Render an uppercase wordmark with reliable letter-spacing (jsPDF v2-safe). */
function spaced(text: string, gap = " "): string {
  return text.split("").join(gap);
}

/** Rasterise a self-contained SVG string to a PNG data URL (browser-only). */
async function rasterizeSvg(svg: string, px: number): Promise<string> {
  const url = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  const img = new Image();
  img.width = px;
  img.height = px;
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("seal raster failed"));
    img.src = url;
  });
  const canvas = document.createElement("canvas");
  canvas.width = px;
  canvas.height = px;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no 2d context");
  ctx.drawImage(img, 0, 0, px, px);
  return canvas.toDataURL("image/png");
}

// ─────────────────────────────────────────────────────────────────────────
//  CERTIFICATE
// ─────────────────────────────────────────────────────────────────────────

export type CertificateData = {
  /** Name as the recipient typed it. */
  name: string;
  /** Optional examination score (omitted for a sample / demo certificate). */
  score?: number | null;
  /** Display date; defaults to today. */
  date?: string;
  /** Stable certificate identifier. */
  certId: string;
};

export function makeCertId(): string {
  return (
    "CDP-" +
    Date.now().toString(36).toUpperCase() +
    "-" +
    Math.random().toString(36).slice(2, 6).toUpperCase()
  );
}

/**
 * Draw and download an A4-landscape certificate. Pure vector - borders,
 * flourishes, seal and type are all drawn, so it stays sharp at any zoom and
 * prints beautifully.
 */
export async function downloadCertificatePdf(data: CertificateData): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

  const W = 297;
  const H = 210;
  const cx = W / 2;
  const name = (data.name || "").trim() || "Recipient Name";
  const date = data.date || ts();
  const hasScore = typeof data.score === "number" && !Number.isNaN(data.score);

  const fill = (c: RGB) => doc.setFillColor(c[0], c[1], c[2]);
  const stroke = (c: RGB) => doc.setDrawColor(c[0], c[1], c[2]);
  const text = (c: RGB) => doc.setTextColor(c[0], c[1], c[2]);

  // Paper
  fill(IVORY);
  doc.rect(0, 0, W, H, "F");

  // Layered frame
  stroke(NAVY);
  doc.setLineWidth(2);
  doc.rect(9, 9, W - 18, H - 18);
  stroke(GOLD);
  doc.setLineWidth(0.8);
  doc.rect(12, 12, W - 24, H - 24);
  stroke(NAVY);
  doc.setLineWidth(0.3);
  doc.rect(14, 14, W - 28, H - 28);

  // Corner diamonds
  fill(GOLD);
  for (const [x, y] of [
    [14, 14],
    [W - 14, 14],
    [14, H - 14],
    [W - 14, H - 14],
  ] as const) {
    doc.triangle(x, y - 2.2, x + 2.2, y, x, y + 2.2, "F");
    doc.triangle(x, y - 2.2, x - 2.2, y, x, y + 2.2, "F");
  }

  // Header wordmark
  text(GOLD);
  doc.setFont("times", "bold");
  doc.setFontSize(15);
  doc.text(spaced("TRUSTSTACK"), cx, 31, { align: "center" });
  text(MUTED);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(spaced("PRIVACY · GOVERNANCE · COMPLIANCE"), cx, 37, { align: "center" });

  // Header rule with centre diamond
  stroke(GOLD);
  doc.setLineWidth(0.4);
  doc.line(cx - 60, 42, cx - 4, 42);
  doc.line(cx + 4, 42, cx + 60, 42);
  fill(GOLD);
  doc.triangle(cx, 40, cx + 2, 42, cx, 44, "F");
  doc.triangle(cx, 40, cx - 2, 42, cx, 44, "F");

  // Title
  text(NAVY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(spaced("CERTIFICATE OF ACHIEVEMENT"), cx, 62, { align: "center" });

  // Presented to
  text(MUTED);
  doc.setFont("times", "italic");
  doc.setFontSize(13);
  doc.text("This certificate is proudly presented to", cx, 80, { align: "center" });

  // Recipient name - fit to width, fall back to two lines for very long names
  text(NAVY);
  doc.setFont("times", "bolditalic");
  const maxNameW = W - 80;
  let namePt = 46;
  doc.setFontSize(namePt);
  while (namePt > 24 && doc.getTextWidth(name) > maxNameW) {
    namePt -= 1;
    doc.setFontSize(namePt);
  }
  if (doc.getTextWidth(name) > maxNameW) {
    const lines = doc.splitTextToSize(name, maxNameW).slice(0, 2);
    doc.text(lines, cx, 98, { align: "center" });
  } else {
    doc.text(name, cx, 100, { align: "center" });
  }

  // Underline with end diamonds
  stroke(GOLD);
  doc.setLineWidth(0.6);
  doc.line(cx - 70, 108, cx + 70, 108);
  fill(GOLD);
  doc.triangle(cx - 70, 106, cx - 68, 108, cx - 70, 110, "F");
  doc.triangle(cx + 70, 106, cx + 72, 108, cx + 70, 110, "F");

  // Citation
  text(MUTED);
  doc.setFont("times", "italic");
  doc.setFontSize(13);
  doc.text("has successfully completed the certification programme", cx, 123, { align: "center" });

  // Programme name
  text(GOLD);
  doc.setFont("times", "bold");
  doc.setFontSize(24);
  doc.text("Certified DPDP Practitioner", cx, 137, { align: "center" });

  text(INK);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Digital Personal Data Protection Act, 2023 & DPDP Rules 2025", cx, 145, { align: "center" });

  // Score line (only when an exam score is supplied)
  if (hasScore) {
    text(NAVY);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(spaced("EXAMINATION SCORE"), cx, 156, { align: "center" });
    text(GOLD);
    doc.setFont("times", "bold");
    doc.setFontSize(15);
    doc.text(`${Math.round(data.score as number)}%`, cx, 165, { align: "center" });
  }

  // Signatures - issuer (left) and date (centre); the official seal sits to the right
  stroke(NAVY);
  doc.setLineWidth(0.3);
  // Left - issuer
  doc.line(38, 183, 96, 183);
  text(NAVY);
  doc.setFont("times", "italic");
  doc.setFontSize(13);
  doc.text("TrustStack", 67, 181, { align: "center" });
  text(MUTED);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(spaced("PROGRAMME DIRECTOR"), 67, 188, { align: "center" });
  // Centre - date
  doc.line(120, 183, 178, 183);
  text(NAVY);
  doc.setFont("times", "normal");
  doc.setFontSize(12);
  doc.text(date, 149, 181, { align: "center" });
  text(MUTED);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(spaced("DATE OF ISSUE"), 149, 188, { align: "center" });

  // Official embossed seal (right) - identical artwork to the live preview
  try {
    const sealPng = await rasterizeSvg(certificateSealSvg(), 440);
    const sealD = 42; // diameter in mm
    doc.addImage(sealPng, "PNG", 237 - sealD / 2, 158 - sealD / 2, sealD, sealD);
  } catch {
    /* the seal is decorative - skip silently if rasterisation is unavailable */
  }

  // Footer - verification
  text(MUTED);
  doc.setFont("courier", "normal");
  doc.setFontSize(8);
  doc.text(
    `Certificate ID: ${data.certId}   ·   Verify at dpdp.in/certification   ·   Issued in the public interest`,
    cx,
    194,
    { align: "center" }
  );

  doc.save(`DPDP-Certificate-${data.certId}.pdf`);
}

// ─────────────────────────────────────────────────────────────────────────
//  ACT - section-by-section reference guide
// ─────────────────────────────────────────────────────────────────────────

export async function downloadActGuidePdf(chapters: ActChapter[]): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const W = 210;
  const H = 297;
  const ML = 22;
  const MR = 22;
  const MT = 24;
  const MB = 22;
  const contentW = W - ML - MR;
  let y = MT;

  const stroke = (c: RGB) => doc.setDrawColor(c[0], c[1], c[2]);
  const text = (c: RGB) => doc.setTextColor(c[0], c[1], c[2]);

  const ensure = (need: number) => {
    if (y + need > H - MB) {
      doc.addPage();
      y = MT;
    }
  };

  // Cover header
  text(MUTED);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text(spaced("THE DIGITAL PERSONAL DATA PROTECTION ACT, 2023"), W / 2, y, { align: "center" });
  y += 9;
  text(NAVY);
  doc.setFont("times", "bold");
  doc.setFontSize(20);
  doc.text("Section-by-Section Reference Guide", W / 2, y, { align: "center" });
  y += 8;
  text(MUTED);
  doc.setFont("times", "italic");
  doc.setFontSize(10);
  doc.text("No. 22 of 2023 · Received assent on 11 August 2023", W / 2, y, { align: "center" });
  y += 6;
  doc.setFontSize(9);
  doc.text("Summarises all 44 sections across 9 chapters. Not a substitute for the official Gazette text.", W / 2, y, {
    align: "center",
  });
  y += 6;
  stroke(NAVY);
  doc.setLineWidth(0.5);
  doc.line(ML, y, W - MR, y);
  y += 10;

  for (const ch of chapters) {
    ensure(20);
    // Chapter header
    text(GOLD);
    doc.setFont("courier", "normal");
    doc.setFontSize(9);
    doc.text(`CHAPTER ${String(ch.n).padStart(2, "0")}`, ML, y);
    text(MUTED);
    doc.text(ch.range.toUpperCase(), W - MR, y, { align: "right" });
    y += 6;
    text(NAVY);
    doc.setFont("times", "bold");
    doc.setFontSize(14);
    doc.text(ch.title, ML, y);
    y += 3;
    stroke(GOLD);
    doc.setLineWidth(0.4);
    doc.line(ML, y, W - MR, y);
    y += 7;

    for (const s of ch.sections) {
      const numW = 14;
      const bodyX = ML + numW;
      const bodyW = contentW - numW;

      text(INK);
      doc.setFont("times", "bold");
      doc.setFontSize(10.5);
      const titleLines = doc.splitTextToSize(s.title, bodyW) as string[];
      doc.setFont("times", "normal");
      doc.setFontSize(9.5);
      const summaryLines = doc.splitTextToSize(s.summary, bodyW) as string[];

      const blockH = titleLines.length * 5 + summaryLines.length * 4.6 + 4;
      ensure(blockH);

      // Section number
      text(MUTED);
      doc.setFont("courier", "normal");
      doc.setFontSize(9);
      doc.text(`Section ${s.n}`, ML, y + 0.5);

      // Title
      text(INK);
      doc.setFont("times", "bold");
      doc.setFontSize(10.5);
      doc.text(titleLines, bodyX, y);
      y += titleLines.length * 5;

      // Summary
      text(MUTED);
      doc.setFont("times", "normal");
      doc.setFontSize(9.5);
      doc.text(summaryLines, bodyX, y);
      y += summaryLines.length * 4.6 + 3.5;

      // Hairline separator
      stroke([224, 224, 224]);
      doc.setLineWidth(0.2);
      doc.line(bodyX, y - 1.5, W - MR, y - 1.5);
    }
    y += 6;
  }

  // Footer on every page
  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    text(MUTED);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text("Digital Personal Data Protection Act, 2023 · Section Guide · Generated from dpdp.in", ML, H - 12);
    doc.text(`Page ${p} of ${pages}`, W - MR, H - 12, { align: "right" });
  }

  doc.save("DPDP-Act-2023-Section-Guide.pdf");
}

// ─────────────────────────────────────────────────────────────────────────
//  RIGHTS REQUEST LETTER
// ─────────────────────────────────────────────────────────────────────────

export async function downloadLetterPdf(opts: { title: string; body: string; fileName?: string }): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const W = 210;
  const H = 297;
  const ML = 28;
  const MR = 28;
  const MT = 30;
  const MB = 26;
  const contentW = W - ML - MR;
  let y = MT;

  const text = (c: RGB) => doc.setTextColor(c[0], c[1], c[2]);

  const ensure = (need: number) => {
    if (y + need > H - MB) {
      doc.addPage();
      y = MT;
    }
  };

  text(INK);
  const paras = opts.body.split("\n");
  for (const raw of paras) {
    const line = raw.replace(/\s+$/u, "");
    if (!line.trim()) {
      y += 4;
      continue;
    }
    const isSubject = /^subject:/i.test(line.trim());
    doc.setFont("times", isSubject ? "bold" : "normal");
    doc.setFontSize(11.5);
    text(isSubject ? NAVY : INK);
    const wrapped = doc.splitTextToSize(line, contentW) as string[];
    for (const w of wrapped) {
      ensure(6);
      doc.text(w, ML, y);
      y += 6.2;
    }
    y += 2.4;
  }

  doc.save(opts.fileName || `${opts.title.replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "")}.pdf`);
}
