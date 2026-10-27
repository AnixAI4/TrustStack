/**
 * Audit plain-language coverage across every non-official content collection.
 *
 * Run without npm:
 *   node --import tsx scripts/audit-easy-read.mjs
 *
 * Official Act, Rules and Gazette text is intentionally excluded. The reader
 * hides those blocks in Easy Read and shows authored plain-language guidance.
 */

const CONTENT_MODULES = [
  "act",
  "blog",
  "blog-articles",
  "cases",
  "certification",
  "course-activities",
  "course-lessons",
  "courses",
  "curriculum",
  "dpdp",
  "dpdpa-questions",
  "exam-bank",
  "hero-configs",
  "home",
  "industry-advisor",
  "learn",
  "lexbot-kb",
  "quiz-bank",
  "rights",
  "risk-explainers",
  "rules",
  "sample-questions",
  "scanner",
  "section-enrichment",
  "section-plain",
  "security-compliance-legal",
  "security-scanner",
  "service-detail",
  "site",
  "template-documents",
  "templates",
  "trail",
];

const TECHNICAL_LANGUAGE = new RegExp(
  String.raw`\b(?:adjudicat|algorithmic|authoris|breach|commencement|compliance|` +
    String.raw`consent|data fiduciary|data principal|data processor|disclosure|` +
    String.raw`due diligence|erasure|extra-territorial|fiduciar|framework|` +
    String.raw`grievance|intermediar|jurisprudence|lawful basis|materiality|` +
    String.raw`mitigation|notification|obligation|operationalis|personal data|` +
    String.raw`prescribed|processing|provision|regime|regulator|remediation|` +
    String.raw`retention|safeguard|statutory|tokenis|unauthorised)\w*`,
  "i",
);

const MALFORMED = [
  /\b(?:a|an|the|each|every|affected)\s+(?:a|an|the)\b/i,
  /\ba (?:organisation|authority)\b/i,
  /\b(\w+)\s+\1\b/i,
];

const PROTECTED_UNCHANGED = new Set([
  "Digital Personal Data Privacy Act",
  "Digital Personal Data Protection Act",
]);

function normalize(text) {
  return text.replace(/\s+/g, " ").trim();
}

function collectStrings(value, output, seen) {
  if (typeof value === "string") {
    const text = normalize(value);
    if (text.length >= 12 && text.includes(" ")) output.add(text);
    return;
  }
  if (!value || typeof value !== "object" || seen.has(value)) return;
  seen.add(value);
  if (Array.isArray(value)) {
    value.forEach((item) => collectStrings(item, output, seen));
    return;
  }
  Object.values(value).forEach((item) => collectStrings(item, output, seen));
}

function readingGrade(text) {
  const words = text.match(/[A-Za-z]+/g) ?? [];
  if (words.length < 8) return 0;
  const sentences = Math.max(1, (text.match(/[.!?]+/g) ?? []).length);
  const syllables = words.reduce((total, word) => {
    const groups = word
      .toLowerCase()
      .replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "")
      .replace(/^y/, "")
      .match(/[aeiouy]{1,2}/g);
    return total + Math.max(1, groups?.length ?? 1);
  }, 0);
  return 0.39 * (words.length / sentences) + 11.8 * (syllables / words.length) - 15.59;
}

const { fallbackEasyText, lookupEasyText } = await import(
  "../src/content/easy-static.ts"
);
const { readFile, readdir } = await import("node:fs/promises");
const path = await import("node:path");
const typescriptModule = await import("typescript");
const ts = typescriptModule.default ?? typescriptModule;

async function sourceFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "easy") continue;
      files.push(...(await sourceFiles(fullPath)));
    } else if (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx")) {
      files.push(fullPath);
    }
  }
  return files;
}

async function auditStaticAttributes() {
  const values = new Map();
  for (const file of await sourceFiles(path.resolve("src"))) {
    const source = await readFile(file, "utf8");
    const sourceFile = ts.createSourceFile(
      file,
      source,
      ts.ScriptTarget.Latest,
      true,
      file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
    );

    const visit = (node) => {
      if (ts.isJsxAttribute(node)) {
        const name = node.name.getText(sourceFile);
        if (["aria-label", "title", "placeholder", "alt"].includes(name)) {
          let value;
          if (node.initializer && ts.isStringLiteral(node.initializer)) {
            value = node.initializer.text;
          } else if (
            node.initializer &&
            ts.isJsxExpression(node.initializer) &&
            node.initializer.expression &&
            ts.isStringLiteral(node.initializer.expression)
          ) {
            value = node.initializer.expression.text;
          }
          if (value) values.set(normalize(value), { file, name, value });
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(sourceFile);
  }

  const residual = [];
  for (const item of values.values()) {
    if (PROTECTED_UNCHANGED.has(item.value)) continue;
    const easy = lookupEasyText(item.value) ?? fallbackEasyText(item.value);
    const rendered = easy ?? item.value;
    if (TECHNICAL_LANGUAGE.test(rendered) || readingGrade(rendered) > 10) {
      residual.push({ ...item, easy });
    }
  }
  return { total: values.size, residual };
}

const totals = {
  strings: 0,
  exact: 0,
  fallback: 0,
  unchanged: 0,
  residual: 0,
  malformed: 0,
};
const findings = [];

console.log("Easy Read source coverage (official legal text excluded)\n");
console.log("module".padEnd(28), "all exact fallback unchanged residual malformed");

for (const name of CONTENT_MODULES) {
  const module = await import(`../src/content/${name}.ts`);
  const strings = new Set();
  collectStrings(module, strings, new WeakSet());

  const stats = {
    strings: strings.size,
    exact: 0,
    fallback: 0,
    unchanged: 0,
    residual: 0,
    malformed: 0,
  };

  for (const normal of strings) {
    if (PROTECTED_UNCHANGED.has(normal)) {
      stats.unchanged += 1;
      continue;
    }
    const exact = lookupEasyText(normal);
    const easy = exact ?? fallbackEasyText(normal);
    if (exact) stats.exact += 1;
    else if (easy) stats.fallback += 1;
    else stats.unchanged += 1;

    if (easy && MALFORMED.some((pattern) => pattern.test(easy))) {
      stats.malformed += 1;
      findings.push({ name, kind: "malformed", normal, easy });
      continue;
    }

    const rendered = easy ?? normal;
    if (!exact && (TECHNICAL_LANGUAGE.test(rendered) || readingGrade(rendered) > 10)) {
      stats.residual += 1;
      findings.push({
        name,
        kind: easy ? "fallback-hard" : "unchanged-hard",
        normal,
        easy,
        grade: Number(readingGrade(rendered).toFixed(1)),
      });
    }
  }

  Object.keys(totals).forEach((key) => {
    totals[key] += stats[key];
  });
  console.log(
    name.padEnd(28),
    String(stats.strings).padStart(3),
    String(stats.exact).padStart(5),
    String(stats.fallback).padStart(8),
    String(stats.unchanged).padStart(9),
    String(stats.residual).padStart(8),
    String(stats.malformed).padStart(9),
  );
}

console.log("\nTotals", totals);

const attributes = await auditStaticAttributes();
console.log("\nStatic UI attributes", {
  total: attributes.total,
  residual: attributes.residual.length,
});
for (const item of attributes.residual.slice(0, 20)) {
  console.log(`  ${item.file} [${item.name}] ${item.value}`);
}

const priority = findings
  .sort((left, right) => {
    if (left.kind === "malformed" && right.kind !== "malformed") return -1;
    if (right.kind === "malformed" && left.kind !== "malformed") return 1;
    return (right.grade ?? 0) - (left.grade ?? 0);
  })
  .slice(0, 40);

if (priority.length) {
  console.log("\nHighest-priority findings:");
  for (const item of priority) {
    const detail = item.easy ? ` -> ${item.easy}` : "";
    console.log(
      `\n[${item.name}] ${item.kind}${item.grade ? ` grade=${item.grade}` : ""}\n` +
        `${item.normal}${detail}`,
    );
  }
}

if (
  process.argv.includes("--strict") &&
  (totals.residual || totals.malformed || attributes.residual.length)
) {
  process.exitCode = 1;
}