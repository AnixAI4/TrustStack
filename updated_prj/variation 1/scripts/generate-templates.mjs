/**
 * Generates professional template .docx and .pdf files.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType,
  Footer,
  PageNumber,
  Header,
  ShadingType,
} from "docx";
import PDFDocument from "pdfkit";
import { TEMPLATE_CONTENT } from "./template-content/index.mjs";
import { SAMPLE, DISCLAIMER } from "./template-content/org.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const templatesDir = path.join(root, "public/templates");
const postersDir = path.join(root, "public/posters");

const NAVY = "1B2A4A";
const ACCENT = "2E5090";
const HEADER_FILL = "E8EEF4";
const BODY_SIZE = 22; // 11pt
const SMALL_SIZE = 18; // 9pt

const TABLE_BORDER = { style: BorderStyle.SINGLE, size: 1, color: "BFBFBF" };

function borderedCell(text, { bold = false, header = false } = {}) {
  return new TableCell({
    borders: {
      top: TABLE_BORDER,
      bottom: TABLE_BORDER,
      left: TABLE_BORDER,
      right: TABLE_BORDER,
    },
    shading: header ? { type: ShadingType.CLEAR, fill: HEADER_FILL } : undefined,
    margins: { top: 100, bottom: 100, left: 140, right: 140 },
    verticalAlign: "center",
    children: [
      new Paragraph({
        children: [new TextRun({ text: String(text), bold: bold || header, size: header ? 20 : BODY_SIZE })],
      }),
    ],
  });
}

function body(text, opts = {}) {
  return new Paragraph({
    children: [new TextRun({ text, size: BODY_SIZE, ...opts })],
    spacing: { after: opts.after ?? 160, line: 276 },
    alignment: opts.align ?? AlignmentType.JUSTIFIED,
  });
}

function meta(text) {
  return new Paragraph({
    children: [new TextRun({ text, italics: true, size: SMALL_SIZE, color: "555555" })],
    spacing: { after: 120 },
    alignment: AlignmentType.JUSTIFIED,
  });
}

function heading(text) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 26, color: NAVY })],
    spacing: { before: 320, after: 160 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: ACCENT, space: 4 } },
  });
}

function subheading(text) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 24, color: "333333" })],
    spacing: { before: 220, after: 120 },
  });
}

function clause(num, text) {
  return new Paragraph({
    children: [
      new TextRun({ text: `${num}  `, bold: true, size: BODY_SIZE }),
      new TextRun({ text, size: BODY_SIZE }),
    ],
    spacing: { after: 140, line: 276 },
    alignment: AlignmentType.JUSTIFIED,
  });
}

function bullets(items) {
  return items.map(
    (item) =>
      new Paragraph({
        children: [new TextRun({ text: item, size: BODY_SIZE })],
        bullet: { level: 0 },
        spacing: { after: 80 },
        alignment: AlignmentType.JUSTIFIED,
      })
  );
}

function divider() {
  return new Paragraph({
    border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" } },
    spacing: { before: 200, after: 200 },
  });
}

function disclaimerBlock() {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: { type: ShadingType.CLEAR, fill: "F5F5F5" },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1, color: ACCENT },
              bottom: TABLE_BORDER,
              left: TABLE_BORDER,
              right: TABLE_BORDER,
            },
            margins: { top: 120, bottom: 120, left: 160, right: 160 },
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: "Notice.  ", bold: true, size: SMALL_SIZE }),
                  new TextRun({ text: DISCLAIMER, italics: true, size: SMALL_SIZE, color: "444444" }),
                ],
                alignment: AlignmentType.JUSTIFIED,
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

function sectionsToDocx(sections) {
  return sections.flatMap((s) => {
    if (s.type === "doccontrol") {
      const rows = [
        new TableRow({ children: s.rows.map(([k, v]) => borderedCell(k, { bold: true, header: true })) }),
        new TableRow({ children: s.rows.map(([, v]) => borderedCell(v)) }),
      ];
      // Render as two-column key-value table instead
      const kvRows = s.rows.map(
        ([k, v]) =>
          new TableRow({
            children: [borderedCell(k, { bold: true, header: true }), borderedCell(v)],
          })
      );
      return [
        new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: kvRows }),
        body("", { after: 240 }),
      ];
    }
    if (s.type === "meta") return [meta(s.text)];
    if (s.type === "heading") return [heading(s.text)];
    if (s.type === "subheading") return [subheading(s.text)];
    if (s.type === "para") return [body(s.text)];
    if (s.type === "clause") return [clause(s.num, s.text)];
    if (s.type === "bullets") return bullets(s.items);
    if (s.type === "divider") return [divider()];
    if (s.type === "table") {
      const rows = [
        new TableRow({ children: s.headers.map((h) => borderedCell(h, { header: true })) }),
        ...s.rows.map((row) => new TableRow({ children: row.map((c) => borderedCell(c)) })),
      ];
      return [new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows }), body("", { after: 220 })];
    }
    return [];
  });
}

function buildDocxHeader() {
  return new Header({
    children: [
      new Paragraph({
        children: [
          new TextRun({ text: SAMPLE.org, bold: true, size: 18, color: NAVY }),
          new TextRun({ text: `   |   ${SAMPLE.cin}`, size: 16, color: "888888" }),
        ],
        border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: ACCENT, space: 1 } },
        spacing: { after: 120 },
      }),
    ],
  });
}

function buildDocxFooter() {
  return new Footer({
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({ text: `${SAMPLE.org} - Page `, size: 16, color: "888888" }),
          new TextRun({ children: [PageNumber.CURRENT], size: 16, color: "888888" }),
          new TextRun({ text: " of ", size: 16, color: "888888" }),
          new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 16, color: "888888" }),
        ],
      }),
    ],
  });
}

async function saveDoc(filename, title, sections) {
  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: "Calibri", size: BODY_SIZE },
        },
      },
    },
    sections: [
      {
        headers: { default: buildDocxHeader() },
        footers: { default: buildDocxFooter() },
        children: [
          new Paragraph({
            children: [new TextRun({ text: title, bold: true, size: 36, color: NAVY })],
            spacing: { after: 200 },
          }),
          disclaimerBlock(),
          body("", { after: 280 }),
          ...sectionsToDocx(sections),
          divider(),
          new Paragraph({
            children: [
              new TextRun({
                text: "End of document. This template is provided for educational purposes and does not constitute legal advice.",
                italics: true,
                size: SMALL_SIZE,
                color: "666666",
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 200 },
          }),
        ],
      },
    ],
  });
  fs.writeFileSync(path.join(templatesDir, filename), await Packer.toBuffer(doc));
  console.log(`  docx  ${filename}`);
}

// ── PDF rendering ──────────────────────────────────────────────

const PDF_MARGIN = 56;

// PDFKit's built-in fonts (Helvetica) only cover WinAnsi/CP1252, so characters
// such as → ☐ ☑ render as garbage in the PDF. Map them to safe equivalents for
// the PDF path only - the .docx keeps the original Unicode.
function pdfSafe(value) {
  return String(value ?? "")
    .replace(/\u2610/g, "[  ]") // ☐ empty checkbox
    .replace(/[\u2611\u2612]/g, "[x]") // ☑ ☒ checked box
    .replace(/\u2192/g, "->") // → rightwards arrow
    .replace(/\u2190/g, "<-") // ← leftwards arrow
    .replace(/[\u2018\u2019]/g, "'") // ‘ ’ curly single quotes
    .replace(/[\u201C\u201D]/g, '"'); // “ ” curly double quotes
}

// Drawn in the reserved top-margin band on EVERY page (fired from the
// `pageAdded` hook, so auto-flow page breaks get a letterhead too). The text
// cursor is saved/restored so drawing the header never shifts flowing content.
function pdfLetterhead(doc, contentWidth) {
  const prevX = doc.x;
  const prevY = doc.y;
  doc.save();
  doc.rect(PDF_MARGIN, 40, contentWidth, 3).fill(`#${ACCENT}`);
  doc
    .fillColor(`#${NAVY}`)
    .font("Helvetica-Bold")
    .fontSize(9)
    .text(SAMPLE.org, PDF_MARGIN, 50, { width: contentWidth, lineBreak: false });
  doc
    .fillColor("#666666")
    .font("Helvetica")
    .fontSize(7.5)
    .text(SAMPLE.address, PDF_MARGIN, 63, { width: contentWidth, lineBreak: false });
  doc.restore();
  doc.x = prevX;
  doc.y = prevY;
}

function drawPdfTable(doc, headers, rows, x, width) {
  const n = headers.length;
  const isKv = n === 2 && headers[0] === "Field";
  const colW = isKv
    ? [width * 0.32, width * 0.68]
    : headers.map(() => width / n);
  const pad = 5;
  const bottomLimit = () => doc.page.height - doc.page.margins.bottom;

  const measure = (cells) => {
    doc.font("Helvetica").fontSize(8);
    let maxH = 0;
    cells.forEach((cell, i) => {
      const h = doc.heightOfString(pdfSafe(cell), {
        width: colW[i] - pad * 2,
        lineGap: 1,
      });
      if (h > maxH) maxH = h;
    });
    return Math.max(16, maxH + pad * 2);
  };

  const drawRow = (cells, isHeader) => {
    const h = measure(cells);
    const top = doc.y;
    let cx = x;
    cells.forEach((cell, i) => {
      if (isHeader) {
        doc.rect(cx, top, colW[i], h).fillAndStroke(`#${HEADER_FILL}`, "#BFBFBF");
      } else {
        doc.lineWidth(0.5).rect(cx, top, colW[i], h).stroke("#BFBFBF");
      }
      doc
        .fillColor(isHeader ? `#${NAVY}` : "#222222")
        .font(isHeader ? "Helvetica-Bold" : "Helvetica")
        .fontSize(8)
        .text(pdfSafe(cell), cx + pad, top + pad, {
          width: colW[i] - pad * 2,
          lineGap: 1,
        });
      cx += colW[i];
    });
    doc.y = top + h;
    doc.x = x;
  };

  drawRow(headers, true);
  rows.forEach((row) => {
    const h = measure(row);
    if (doc.y + h > bottomLimit()) {
      doc.addPage();
      drawRow(headers, true); // repeat the column header on the new page
    }
    drawRow(row, false);
  });
  doc.x = x;
}

function saveTemplatePdf(filename, title, sections) {
  return new Promise((resolve, reject) => {
    const out = path.join(templatesDir, filename);
    const doc = new PDFDocument({
      size: "A4",
      // Reserve top/bottom bands so content never collides with the
      // letterhead or the page footer.
      margins: { top: 92, bottom: 64, left: PDF_MARGIN, right: PDF_MARGIN },
      bufferPages: true,
    });
    const stream = fs.createWriteStream(out);
    doc.pipe(stream);

    const contentWidth = doc.page.width - PDF_MARGIN * 2;
    const topMargin = doc.page.margins.top;
    const bottomLimit = () => doc.page.height - doc.page.margins.bottom;
    const keep = (h) => {
      if (doc.y + h > bottomLimit()) doc.addPage();
    };

    // Give every page a letterhead (the first page already exists, so draw it
    // directly; pages 2+ come through the hook).
    doc.on("pageAdded", () => pdfLetterhead(doc, contentWidth));
    pdfLetterhead(doc, contentWidth);
    doc.x = PDF_MARGIN;
    doc.y = topMargin;

    // Title
    doc
      .font("Helvetica-Bold")
      .fontSize(18)
      .fillColor(`#${NAVY}`)
      .text(pdfSafe(title), PDF_MARGIN, doc.y, { width: contentWidth });
    doc.moveDown(0.5);

    // Disclaimer box - auto-sized to fit its wrapped text.
    doc.font("Helvetica-Oblique").fontSize(7.5);
    const discText = pdfSafe(`Notice. ${DISCLAIMER}`);
    const discH =
      doc.heightOfString(discText, { width: contentWidth - 16, align: "justify" }) + 16;
    keep(discH + 12);
    const discY = doc.y;
    doc.rect(PDF_MARGIN, discY, contentWidth, discH).fillAndStroke("#F5F5F5", `#${ACCENT}`);
    doc
      .fillColor("#444444")
      .font("Helvetica-Oblique")
      .fontSize(7.5)
      .text(discText, PDF_MARGIN + 8, discY + 8, {
        width: contentWidth - 16,
        align: "justify",
      });
    doc.x = PDF_MARGIN;
    doc.y = discY + discH + 14;

    for (const s of sections) {
      // ── The critical fix: re-anchor the cursor to the left margin before
      // every element so nothing inherits a stray x from a preceding table. ──
      doc.x = PDF_MARGIN;

      if (s.type === "doccontrol") {
        drawPdfTable(doc, ["Field", "Value"], s.rows, PDF_MARGIN, contentWidth);
        doc.x = PDF_MARGIN;
        doc.moveDown(0.6);
      } else if (s.type === "meta") {
        doc
          .font("Helvetica-Oblique")
          .fontSize(8)
          .fillColor("#555555")
          .text(pdfSafe(s.text), PDF_MARGIN, doc.y, { width: contentWidth });
        doc.moveDown(0.35);
      } else if (s.type === "heading") {
        keep(56);
        doc.moveDown(0.5);
        doc
          .font("Helvetica-Bold")
          .fontSize(12)
          .fillColor(`#${NAVY}`)
          .text(pdfSafe(s.text), PDF_MARGIN, doc.y, { width: contentWidth });
        const uy = doc.y + 2;
        doc
          .strokeColor(`#${ACCENT}`)
          .lineWidth(0.75)
          .moveTo(PDF_MARGIN, uy)
          .lineTo(PDF_MARGIN + contentWidth, uy)
          .stroke();
        doc.x = PDF_MARGIN;
        doc.y = uy + 6;
      } else if (s.type === "subheading") {
        keep(40);
        doc.moveDown(0.35);
        doc
          .font("Helvetica-Bold")
          .fontSize(10)
          .fillColor("#333333")
          .text(pdfSafe(s.text), PDF_MARGIN, doc.y, { width: contentWidth });
        doc.moveDown(0.15);
      } else if (s.type === "para") {
        doc
          .font("Helvetica")
          .fontSize(9.5)
          .fillColor("#222222")
          .text(pdfSafe(s.text), PDF_MARGIN, doc.y, {
            width: contentWidth,
            align: "justify",
            lineGap: 2,
          });
        doc.moveDown(0.35);
      } else if (s.type === "clause") {
        keep(40);
        doc
          .font("Helvetica-Bold")
          .fontSize(9.5)
          .fillColor("#111111")
          .text(pdfSafe(`${s.num}  `), PDF_MARGIN, doc.y, { continued: true });
        doc
          .font("Helvetica")
          .fillColor("#222222")
          .text(pdfSafe(s.text), { width: contentWidth, align: "justify", lineGap: 2 });
        doc.x = PDF_MARGIN;
        doc.moveDown(0.3);
      } else if (s.type === "bullets") {
        doc.font("Helvetica").fontSize(9.5).fillColor("#222222");
        doc.list(s.items.map(pdfSafe), PDF_MARGIN, doc.y, {
          width: contentWidth,
          bulletRadius: 1.6,
          textIndent: 12,
          bulletIndent: 2,
          lineGap: 1,
          paragraphGap: 3,
        });
        doc.x = PDF_MARGIN;
        doc.moveDown(0.35);
      } else if (s.type === "divider") {
        doc.moveDown(0.3);
        doc
          .strokeColor("#CCCCCC")
          .lineWidth(0.5)
          .moveTo(PDF_MARGIN, doc.y)
          .lineTo(PDF_MARGIN + contentWidth, doc.y)
          .stroke();
        doc.moveDown(0.6);
      } else if (s.type === "table") {
        keep(60);
        drawPdfTable(doc, s.headers, s.rows, PDF_MARGIN, contentWidth);
        doc.x = PDF_MARGIN;
        doc.moveDown(0.5);
      }
    }

    // Footers with correct "Page X of Y" over every buffered page.
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);
      // Zero the bottom margin while drawing in the footer band, otherwise
      // PDFKit treats the write as an overflow and appends a blank page.
      const savedBottom = doc.page.margins.bottom;
      doc.page.margins.bottom = 0;
      const fy = doc.page.height - 40;
      doc.save();
      doc
        .strokeColor("#CCCCCC")
        .lineWidth(0.5)
        .moveTo(PDF_MARGIN, fy - 8)
        .lineTo(PDF_MARGIN + contentWidth, fy - 8)
        .stroke();
      doc
        .fillColor("#888888")
        .font("Helvetica")
        .fontSize(7)
        .text(
          `${SAMPLE.org}  ·  Page ${i - range.start + 1} of ${range.count}`,
          PDF_MARGIN,
          fy,
          { width: contentWidth, align: "center", lineBreak: false }
        );
      doc.restore();
      doc.page.margins.bottom = savedBottom;
    }

    doc.flushPages();
    doc.end();
    stream.on("finish", () => {
      console.log(`  pdf   ${filename}`);
      resolve();
    });
    stream.on("error", reject);
  });
}

async function saveTemplate(slug, { title, sections }) {
  await saveDoc(`${slug}.docx`, title, sections);
  await saveTemplatePdf(`${slug}.pdf`, title, sections);
}

function createPoster(filename, title, sub) {
  return new Promise((resolve, reject) => {
    const out = path.join(postersDir, filename);
    const doc = new PDFDocument({ size: "A4", layout: "portrait", margin: 60 });
    const stream = fs.createWriteStream(out);
    doc.pipe(stream);
    doc.rect(0, 0, doc.page.width, doc.page.height).fill("#0f1117");
    doc.rect(0, 0, doc.page.width, 12).fill("#2E5090");
    doc.fillColor("#ffffff").fontSize(32).font("Helvetica-Bold")
      .text(title, 60, 180, { align: "center", width: doc.page.width - 120 });
    doc.fillColor("#9aa6bd").fontSize(16).font("Helvetica")
      .text(sub, 60, 260, { align: "center", width: doc.page.width - 120 });
    doc.fillColor("#667085").fontSize(11)
      .text("Digital Personal Data Protection Act, 2023", 60, doc.page.height - 72, {
        align: "center", width: doc.page.width - 120,
      });
    doc.end();
    stream.on("finish", () => { console.log(`  pdf   ${filename}`); resolve(); });
    stream.on("error", reject);
  });
}

function writeContentJson() {
  // Emit the structured document content so the website can render a rich
  // in-browser preview from the same single source of truth as the .docx/.pdf.
  const outFile = path.join(root, "src/content/template-documents.json");
  const payload = {};
  for (const [slug, body] of Object.entries(TEMPLATE_CONTENT)) {
    payload[slug] = { title: body.title, sections: body.sections };
  }
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, JSON.stringify(payload, null, 2) + "\n");
  console.log(`  json  src/content/template-documents.json (${Object.keys(payload).length} documents)`);
}

async function main() {
  fs.mkdirSync(templatesDir, { recursive: true });
  fs.mkdirSync(postersDir, { recursive: true });
  console.log("Generating templates…");
  for (const [slug, body] of Object.entries(TEMPLATE_CONTENT)) {
    await saveTemplate(slug, body);
  }
  writeContentJson();
  console.log("Generating posters…");
  await Promise.all([
    createPoster("know-your-rights.pdf", "Know Your Rights", "Access, correct, erase and withdraw consent over your personal data under the DPDP Act, 2023."),
    createPoster("consent-done-right.pdf", "Consent Done Right", "Free, specific, informed and unconditional. Withdrawal must be as easy as giving consent."),
    createPoster("spot-a-breach.pdf", "Report a Data Breach", "Unusual access, lost devices or suspected leaks - notify your privacy office without delay."),
    createPoster("protect-children.pdf", "Protect Children's Data", "No tracking or behavioural advertising directed at children. Verifiable parental consent under Section 9."),
  ]);
  console.log("Done - files in public/templates and public/posters");
}

main().catch((err) => { console.error(err); process.exit(1); });
