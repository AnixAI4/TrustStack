import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const messagesDir = join(root, "messages");
const srcDir = join(root, "src");
const siteCatalogDir = join(root, "public", "i18n", "site");

function listFiles(dir, test) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) return listFiles(fullPath, test);
    return test(fullPath) ? [fullPath] : [];
  });
}

function flatten(value, prefix = "", output = new Map()) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => flatten(item, `${prefix}[${index}]`, output));
    return output;
  }

  if (value && typeof value === "object") {
    Object.entries(value).forEach(([key, item]) => {
      flatten(item, prefix ? `${prefix}.${key}` : key, output);
    });
    return output;
  }

  output.set(prefix, value);
  return output;
}

function routeFor(pagePath) {
  const appRelative = relative(join(srcDir, "app"), pagePath)
    .replaceAll("\\", "/")
    .replace(/\/page\.tsx$/, "");
  return appRelative ? `/${appRelative}` : "/";
}

function placeholders(value, pattern = /\{[\w.]+\}/g) {
  return typeof value === "string"
    ? (value.match(pattern) ?? []).sort().join("|")
    : "";
}

const messageFiles = readdirSync(messagesDir)
  .filter((name) => name.endsWith(".json"))
  .sort();
const english = flatten(
  JSON.parse(readFileSync(join(messagesDir, "en.json"), "utf8")),
);

console.log(`Locale dictionaries: ${messageFiles.length}`);
console.log(`English message leaves: ${english.size}\n`);

let dictionaryErrors = 0;
const locales = [];
for (const file of messageFiles) {
  if (file === "en.json") continue;
  const locale = file.replace(/\.json$/, "");
  locales.push(locale);
  const values = flatten(
    JSON.parse(readFileSync(join(messagesDir, file), "utf8")),
  );
  const missing = [...english.keys()].filter(
    (key) => !values.has(key) || values.get(key) === "",
  );
  const extra = [...values.keys()].filter((key) => !english.has(key));
  const identical = [...english.keys()].filter(
    (key) => typeof english.get(key) === "string" && values.get(key) === english.get(key),
  );
  const brokenPlaceholders = [...english.keys()].filter(
    (key) => placeholders(english.get(key)) !== placeholders(values.get(key)),
  );

  const stringLeaves = [...english.values()].filter(
    (value) => typeof value === "string",
  ).length;
  const suspiciousFallback = identical.length > stringLeaves / 2;
  dictionaryErrors +=
    missing.length + brokenPlaceholders.length + (suspiciousFallback ? 1 : 0);
  console.log(
    `${locale.padEnd(4)} missing=${String(missing.length).padStart(3)} ` +
      `extra=${String(extra.length).padStart(3)} ` +
      `placeholders=${String(brokenPlaceholders.length).padStart(2)} ` +
      `same-as-en=${String(identical.length).padStart(3)}`,
  );
  if (missing.length) console.log(`     missing: ${missing.slice(0, 8).join(", ")}`);
  if (suspiciousFallback) console.log("     error: locale is mostly unchanged English");
}

let catalogErrors = 0;
const sourceCatalogPath = join(siteCatalogDir, "source.json");
if (!existsSync(sourceCatalogPath)) {
  console.error("\nSite catalog source is missing. Run npm run translate:site.");
  catalogErrors++;
} else {
  const sourceCatalog = JSON.parse(readFileSync(sourceCatalogPath, "utf8"));
  const sourceExact = Object.entries(sourceCatalog.exact);
  console.log(
    `\nSite content source: ${sourceExact.length} exact strings, ` +
      `${sourceCatalog.patterns.length} patterns, ${sourceCatalog.fingerprint}`,
  );
  console.log("Locale site catalogs:");

  for (const locale of locales) {
    const catalogPath = join(siteCatalogDir, `${locale}.json`);
    if (!existsSync(catalogPath)) {
      console.log(`${locale.padEnd(4)} missing catalog`);
      catalogErrors++;
      continue;
    }

    const catalog = JSON.parse(readFileSync(catalogPath, "utf8"));
    const patternMap = new Map(catalog.patterns ?? []);
    const missingExact = sourceExact.filter(
      ([key]) => !catalog.exact?.[key],
    );
    const missingPatterns = sourceCatalog.patterns.filter(
      (source) => !patternMap.get(source),
    );
    const brokenExactPlaceholders = sourceExact.filter(
      ([key, source]) =>
        catalog.exact?.[key] &&
        placeholders(source) !== placeholders(catalog.exact[key]),
    );
    const brokenPatternPlaceholders = sourceCatalog.patterns.filter((source) => {
      const translated = patternMap.get(source);
      return (
        translated &&
        placeholders(source, /\{\{\d+\}\}/g) !==
          placeholders(translated, /\{\{\d+\}\}/g)
      );
    });
    const identical = sourceExact.filter(
      ([key, source]) => catalog.exact?.[key] === source,
    );
    const stale = catalog.fingerprint !== sourceCatalog.fingerprint;
    const identityMismatch = catalog.locale !== locale || catalog.version !== 1;
    const suspiciousFallback = identical.length > sourceExact.length / 2;
    catalogErrors +=
      missingExact.length +
      missingPatterns.length +
      brokenExactPlaceholders.length +
      brokenPatternPlaceholders.length +
      (stale ? 1 : 0) +
      (identityMismatch ? 1 : 0) +
      (suspiciousFallback ? 1 : 0);

    console.log(
      `${locale.padEnd(4)} missing=${String(missingExact.length).padStart(3)} ` +
        `patterns=${String(missingPatterns.length).padStart(3)} ` +
        `placeholders=${String(
          brokenExactPlaceholders.length + brokenPatternPlaceholders.length,
        ).padStart(3)} ` +
        `same-as-en=${String(identical.length).padStart(4)} ` +
        `fingerprint=${stale ? "STALE" : "ok"}` +
        (suspiciousFallback ? " MOSTLY-ENGLISH" : ""),
    );
  }
}

const sourceFiles = listFiles(srcDir, (file) => /\.(?:ts|tsx)$/.test(file));
const translationPattern = /\b(?:useTranslations|getTranslations)\s*\(/;
const translatedFiles = sourceFiles.filter((file) =>
  translationPattern.test(readFileSync(file, "utf8")),
);
const pages = sourceFiles.filter((file) => file.endsWith(`${join("", "page.tsx")}`));
const directTranslatedPages = pages.filter((file) =>
  translationPattern.test(readFileSync(file, "utf8")),
);
const layout = readFileSync(join(srcDir, "app", "layout.tsx"), "utf8");
const runtimeWired =
  layout.includes('import { LocaleTextRuntime }') &&
  /<LocaleTextRuntime(?:\s|\/>)/.test(layout);

console.log("\nSource coverage");
console.log(`Translation-aware source files: ${translatedFiles.length}/${sourceFiles.length}`);
console.log(`Direct next-intl route files: ${directTranslatedPages.length}/${pages.length}`);
console.log(`Root content runtime: ${runtimeWired ? "wired" : "MISSING"}`);
console.log(`Routes covered by root runtime: ${runtimeWired ? pages.length : 0}/${pages.length}`);
console.log(pages.map(routeFor).sort().join(", "));
if (!runtimeWired) catalogErrors++;

if (dictionaryErrors || catalogErrors) {
  console.error(
    `\nTranslation audit failed: ${dictionaryErrors} dictionary error(s), ` +
      `${catalogErrors} site-catalog error(s).`,
  );
  process.exitCode = 1;
} else {
  console.log("\nTranslation audit passed.");
}