/**
 * Verifies all 44 Act pages against the pinned Gazette corpus.
 * Add --live to cross-check every section against India Code.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = path.join(root, "scripts", "sources", "dpdp_act.txt");
const generatedPath = path.join(root, "src", "content", "section-official-text.ts");
const plainPath = path.join(root, "src", "content", "section-plain.ts");
const officialPdfPath = path.join(root, "public", "DPDP-Act-2023-official.pdf");

const GAZETTE_ID = "CG-DL-E-12082023-248045";
const GAZETTE_SHA256 = "4deb23981d3010c8225a2ff6149e7243dc2268455b299e283afebdd7b72a7d15";
const INDIA_CODE_ACT_ID = "AC_CEN_45_0_00003_2023-22_1763464807080";
const INDIA_CODE_RECORD =
  "https://www.indiacode.nic.in/handle/123456789/22037?view_type=search&col=123456789/1362";

const source = fs.readFileSync(sourcePath, "utf8");
const generated = fs.readFileSync(generatedPath, "utf8");
const plain = fs.readFileSync(plainPath, "utf8");
const failures = [];
const expected = Array.from({ length: 44 }, (_, index) => index + 1);

function parseSourceSections(text) {
  const scheduleStart = text.indexOf("\n## The Schedule");
  const matches = [...text.matchAll(/^### Section (\d{1,2})\.\s+(.+)$/gm)];
  return matches.map((match, index) => {
    const number = Number(match[1]);
    const title = match[2].trim();
    const start = match.index + match[0].length;
    const end = index + 1 < matches.length ? matches[index + 1].index : scheduleStart;
    const body = text
      .slice(start, end)
      .replace(/^## Chapter.*$/gm, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
    return {
      number,
      text: `Section ${number}. ${title}.\n\n${body}`,
    };
  });
}

function parseGeneratedSections(text) {
  const match = text.match(/Record<number, string>\s*=\s*(\{[\s\S]*\});\s*$/);
  if (!match) throw new Error("Could not parse section-official-text.ts");
  return JSON.parse(match[1]);
}

function checkSequence(label, actual) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    failures.push(`${label}: expected sections 1-44 once and in order; found ${actual.join(", ")}`);
  }
}

const sourceSections = parseSourceSections(source);
const generatedSections = parseGeneratedSections(generated);
const plainSections = [...plain.matchAll(/^\s{2}(\d{1,2}):\s+\{/gm)].map(
  ([, number]) => Number(number)
);

checkSequence("Act source", sourceSections.map(({ number }) => number));
checkSequence("Generated official text", Object.keys(generatedSections).map(Number));
checkSequence("Plain-English companion", plainSections);

for (const { number, text } of sourceSections) {
  if (generatedSections[number] !== text) {
    failures.push(`Section ${number}: generated statutory text differs from the Gazette corpus`);
  }
}

const scheduleRows = [...source.matchAll(/^\| ([1-7])\. \|/gm)].map((match) => Number(match[1]));
if (!/An Act to provide for the processing of digital personal data/.test(source)) {
  failures.push("Act source: preamble is missing");
}
if (!source.includes(`Official Gazette publication: ${GAZETTE_ID}`)) {
  failures.push(`Act source: Gazette publication ${GAZETTE_ID} is not recorded`);
}
if (JSON.stringify(scheduleRows) !== JSON.stringify([1, 2, 3, 4, 5, 6, 7])) {
  failures.push(`Act source: expected seven ordered Schedule rows; found ${scheduleRows.join(", ")}`);
}
if (/Resource|Appendices|THE SCHEDULE/.test(generatedSections[44] ?? "")) {
  failures.push("Section 44: contains source artifacts or Schedule content");
}

if (!fs.existsSync(officialPdfPath)) {
  failures.push("Official Gazette PDF is missing");
} else {
  const pdfHash = crypto.createHash("sha256").update(fs.readFileSync(officialPdfPath)).digest("hex");
  if (pdfHash !== GAZETTE_SHA256) {
    failures.push(`Official Gazette PDF: expected SHA-256 ${GAZETTE_SHA256}; found ${pdfHash}`);
  }
}

function decodeEntities(text) {
  return text
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)));
}

function indiaCodeText(html) {
  return decodeEntities(
    html
      .replace(/<sup\b[\s\S]*?<\/sup>/gi, "")
      .replace(/<br\s*\/?\s*>|<\/br>|<hr\b[^>]*>/gi, " ")
      .replace(/<[^>]+>/g, " ")
  );
}

function comparable(text) {
  return text
    .replace(/\(\s*\d+\s+of\s+\d{4}\s*\)/gi, "")
    // India Code's web API pluralizes two labels that remain singular in both
    // the Gazette PDF and India Code's own consolidated PDF.
    .replace(/\bIllustrations\b/gi, "Illustration")
    .replace(/[^\p{L}\p{N}]+/gu, "")
    .toLowerCase();
}

async function fetchWithRetry(url, attempts = 3) {
  let response;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    response = await fetch(url);
    if (response.ok || ![429, 500, 502, 503, 504].includes(response.status)) return response;
    if (attempt < attempts) {
      await new Promise((resolve) => setTimeout(resolve, attempt * 250));
    }
  }
  return response;
}

async function runIndiaCodeAudit() {
  const response = await fetchWithRetry(INDIA_CODE_RECORD);
  if (!response.ok) throw new Error(`India Code record returned HTTP ${response.status}`);
  const record = await response.text();
  const links = [...record.matchAll(/href=(\/show-data\?[^ >]+)/gi)].map((match) =>
    decodeEntities(match[1])
  );
  const sectionRefs = new Map();
  for (const link of links) {
    const sectionNumber = Number(link.match(/[?&]sectionno=(\d+)/)?.[1]);
    const sectionId = link.match(/[?&]sectionId=(\d+)/)?.[1];
    if (sectionNumber && sectionId) sectionRefs.set(sectionNumber, sectionId);
  }
  checkSequence("India Code record", [...sectionRefs.keys()].sort((a, b) => a - b));

  const results = await Promise.all(
    expected.map(async (number) => {
      const sectionId = sectionRefs.get(number);
      if (!sectionId) return { number, error: "missing section ID" };
      const url = new URL("https://www.indiacode.nic.in/SectionPageContent");
      url.searchParams.set("actid", INDIA_CODE_ACT_ID);
      url.searchParams.set("sectionID", sectionId);
      const sectionResponse = await fetchWithRetry(url);
      if (!sectionResponse.ok) return { number, error: `HTTP ${sectionResponse.status}` };
      const payload = await sectionResponse.json();
      const official = sourceSections.find((section) => section.number === number)?.text ?? "";
      const officialBody = official.replace(/^Section \d+\.[^\n]+\n+/, "");
      return {
        number,
        matches: comparable(indiaCodeText(payload.content ?? "")) === comparable(officialBody),
      };
    })
  );

  for (const result of results) {
    if (result.error) failures.push(`India Code section ${result.number}: ${result.error}`);
    else if (!result.matches) failures.push(`India Code section ${result.number}: differs from Gazette corpus`);
  }
}

if (process.argv.includes("--live")) {
  try {
    await runIndiaCodeAudit();
  } catch (error) {
    failures.push(`India Code live audit: ${error instanceof Error ? error.message : String(error)}`);
  }
}

if (failures.length > 0) {
  console.error(`Act content audit failed (${failures.length}):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log("Act content audit passed");
  console.log("- 44/44 Gazette source sections present and ordered");
  console.log("- 44/44 generated section blocks exactly match the Gazette corpus");
  console.log("- 44/44 plain-English companions present");
  console.log("- Preamble and all seven Schedule rows present");
  console.log(`- Official Gazette PDF matches SHA-256 ${GAZETTE_SHA256}`);
  if (process.argv.includes("--live")) {
    console.log("- 44/44 Gazette sections match the India Code section API");
  }
}