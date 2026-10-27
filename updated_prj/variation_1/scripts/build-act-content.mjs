/**
 * Parses the pinned Gazette corpus into per-section statutory text.
 * Run directly: node scripts/build-act-content.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const srcTxt = path.join(__dirname, "sources", "dpdp_act.txt");
const outTs = path.join(root, "src/content/section-official-text.ts");

const raw = fs.readFileSync(srcTxt, "utf8");
const scheduleStart = raw.indexOf("\n## The Schedule");

if (!raw.includes("Official Gazette publication: CG-DL-E-12082023-248045")) {
  throw new Error("Act source is not the pinned Gazette corpus");
}
if (scheduleStart < 0) {
  throw new Error("Act source is missing the Schedule boundary");
}

const sectionRe = /^### Section (\d{1,2})\.\s+(.+)$/gm;
const matches = [...raw.matchAll(sectionRe)].filter((m) => {
  const n = Number(m[1]);
  return n >= 1 && n <= 44;
});

const numbers = matches.map((match) => Number(match[1]));
const expected = Array.from({ length: 44 }, (_, index) => index + 1);
if (JSON.stringify(numbers) !== JSON.stringify(expected)) {
  throw new Error(`Expected sections 1-44 once and in order; found ${numbers.join(", ")}`);
}

const sections = {};
for (let i = 0; i < matches.length; i++) {
  const n = Number(matches[i][1]);
  const title = matches[i][2].trim();
  const start = matches[i].index + matches[i][0].length;
  const end = i + 1 < matches.length ? matches[i + 1].index : scheduleStart;
  const body = raw
    .slice(start, end)
    .replace(/^## Chapter.*$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  sections[n] = `Section ${n}. ${title}.\n\n${body}`;
}

if (/Resource|Appendices|THE SCHEDULE/.test(sections[44])) {
  throw new Error("Section 44 contains source artifacts or Schedule content");
}

const ts = `/**
 * Auto-generated from the pinned Gazette corpus in scripts/sources/dpdp_act.txt.
 * Gazette publication CG-DL-E-12082023-248045. Do not edit by hand.
 */
export const SECTION_OFFICIAL_TEXT: Record<number, string> = ${JSON.stringify(sections, null, 2)};
`;
fs.writeFileSync(outTs, ts);
console.log(`Wrote ${Object.keys(sections).length} sections to section-official-text.ts`);
