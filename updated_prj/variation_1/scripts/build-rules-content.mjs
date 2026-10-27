/**
 * Parses dpdp_rules.txt into per-rule official text + generates public PDF.
 * Run: node scripts/build-rules-content.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import PDFDocument from "pdfkit";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const srcTxt = path.join(__dirname, "sources", "dpdp_rules.txt");
const outTs = path.join(root, "src/content/rule-official-text.ts");
const outPdf = path.join(root, "public/DPDP-Rules-2025.pdf");

const raw = fs.readFileSync(srcTxt, "utf8");

function clean(text) {
  return text
    .replace(/\[\u0900-\u097F\s\S]*?भारत का रािपत्र[\s\S]*?\d+\s*/g, "")
    .replace(/THE GAZETTE OF INDIA[\s\S]*?PART II[^\n]*\n/g, "")
    .replace(/\f/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// Only the numbered rules block - stop before schedules so schedule items are not matched.
const rulesStart = raw.indexOf("1. Short title");
const rulesEnd = raw.indexOf("FIRST SCHEDULE", rulesStart);
const rulesSection = raw.slice(rulesStart, rulesEnd > rulesStart ? rulesEnd : undefined);

const ruleStartRe = /^(\d{1,2})\.\s*(?=[A-Za-z"“])/gm;
const starts = [];
let match;
while ((match = ruleStartRe.exec(rulesSection)) !== null) {
  const n = Number(match[1]);
  if (n >= 1 && n <= 23) starts.push({ n, index: match.index });
}

const seen = new Set();
const uniqueStarts = starts.filter(({ n }) => {
  if (seen.has(n)) return false;
  seen.add(n);
  return true;
});
uniqueStarts.sort((a, b) => a.index - b.index);

const rules = {};
for (let i = 0; i < uniqueStarts.length; i++) {
  const { n, index } = uniqueStarts[i];
  const end =
    i + 1 < uniqueStarts.length ? uniqueStarts[i + 1].index : rulesSection.length;
  rules[n] = clean(rulesSection.slice(index, end));
}

const ts = `/** Auto-generated from dpdp_rules.txt - run: node scripts/build-rules-content.mjs */\nexport const RULE_OFFICIAL_TEXT: Record<number, string> = ${JSON.stringify(rules, null, 2)};\n`;
fs.writeFileSync(outTs, ts);
console.log(`Wrote ${Object.keys(rules).length} rules to rule-official-text.ts`);

await new Promise((resolve, reject) => {
  const doc = new PDFDocument({ size: "A4", margin: 50 });
  const stream = fs.createWriteStream(outPdf);
  doc.pipe(stream);
  doc
    .fontSize(16)
    .font("Helvetica-Bold")
    .text("Digital Personal Data Protection Rules, 2025", { align: "center" });
  doc.moveDown(0.5);
  doc
    .fontSize(9)
    .font("Helvetica")
    .fillColor("#444")
    .text(
      "G.S.R. 846(E) · Notified 13 November 2025 · Ministry of Electronics and IT",
      { align: "center" }
    );
  doc.moveDown(1.5);
  doc.fillColor("#111").fontSize(8.5);
  doc.text(clean(rulesSection), { align: "justify", lineGap: 2 });
  doc.end();
  stream.on("finish", () => {
    console.log(`Wrote ${outPdf}`);
    resolve();
  });
  stream.on("error", reject);
});
