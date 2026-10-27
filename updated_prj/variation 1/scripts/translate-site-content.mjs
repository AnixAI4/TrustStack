/**
 * Builds on-demand browser translation catalogs for text that lives outside
 * next-intl messages (page JSX, content modules, question banks and JSON data).
 *
 * Usage:
 *   npm run translate:site -- --extract-only
 *   npm run translate:site
 *   npm run translate:site -- hi bn
 *   npm run translate:site -- ks --force
 */
import { createHash } from "node:crypto";
import {
  mkdir,
  readFile,
  readdir,
  stat,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC_DIR = path.join(ROOT, "src");
const MESSAGES_DIR = path.join(ROOT, "messages");
const OUTPUT_DIR = path.join(ROOT, "public", "i18n", "site");
const SOURCE_PATH = path.join(OUTPUT_DIR, "source.json");

const GOOGLE_TARGETS = {
  hi: "hi",
  bn: "bn",
  te: "te",
  mr: "mr",
  ta: "ta",
  ur: "ur",
  gu: "gu",
  kn: "kn",
  or: "or",
  ml: "ml",
  pa: "pa",
  as: "as",
  mai: "mai",
  sa: "sa",
  kok: "gom",
  sd: "sd",
  ne: "ne",
  si: "si",
  mni: "mni-Mtei",
  doi: "doi",
  sat: "sat",
};
const TARGETS = [...Object.keys(GOOGLE_TARGETS), "ks"];

const SKIP_ATTRIBUTES = new Set([
  "action",
  "class",
  "classname",
  "d",
  "data",
  "fill",
  "formaction",
  "height",
  "href",
  "htmlfor",
  "id",
  "key",
  "method",
  "name",
  "path",
  "points",
  "referrerpolicy",
  "rel",
  "role",
  "src",
  "stroke",
  "style",
  "target",
  "type",
  "value",
  "viewbox",
  "width",
]);
const SKIP_PROPERTIES = new Set([
  "class",
  "className",
  "cookie",
  "d",
  "endpoint",
  "event",
  "files",
  "href",
  "icon",
  "id",
  "key",
  "keywords",
  "path",
  "route",
  "slug",
  "src",
  "storageKey",
  "style",
  "url",
  "viewBox",
]);
const CLASS_CALLS = new Set(["cn", "clsx", "cva", "twMerge"]);

function normalizeText(text) {
  return decodeEntities(text).replace(/\s+/g, " ").trim();
}

function textKey(text) {
  const normalized = normalizeText(text);
  let hash = 0x811c9dc5;
  for (let index = 0; index < normalized.length; index++) {
    hash ^= normalized.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(36);
}

function decodeEntities(text) {
  return text
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&apos;|&#39;|&#x27;/gi, "'")
    .replace(/&quot;|&#34;/gi, '"')
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

function propertyName(node) {
  if (!node) return "";
  if (ts.isIdentifier(node) || ts.isPrivateIdentifier(node)) return node.text;
  if (ts.isStringLiteral(node) || ts.isNumericLiteral(node)) return node.text;
  return "";
}

function hasAncestor(node, predicate) {
  for (let current = node.parent; current; current = current.parent) {
    if (predicate(current)) return current;
  }
  return undefined;
}

function isStructuralString(node) {
  if (
    hasAncestor(
      node,
      (current) =>
        ts.isImportDeclaration(current) ||
        ts.isExportDeclaration(current) ||
        ts.isImportTypeNode(current) ||
        ts.isLiteralTypeNode(current),
    )
  ) {
    return true;
  }

  const parent = node.parent;
  if (
    (ts.isPropertyAssignment(parent) || ts.isMethodDeclaration(parent)) &&
    parent.name === node
  ) {
    return true;
  }
  if (
    (ts.isElementAccessExpression(parent) && parent.argumentExpression === node) ||
    ts.isCaseClause(parent)
  ) {
    return true;
  }

  const jsxAttribute = hasAncestor(node, ts.isJsxAttribute);
  if (jsxAttribute) {
    const name = jsxAttribute.name.getText().toLowerCase();
    if (name.startsWith("data-") || SKIP_ATTRIBUTES.has(name)) return true;
  }

  const property = hasAncestor(
    node,
    (current) => ts.isPropertyAssignment(current) && current.initializer === node,
  );
  if (property && SKIP_PROPERTIES.has(propertyName(property.name))) return true;

  const call = hasAncestor(node, ts.isCallExpression);
  if (call) {
    const callee = call.expression.getText();
    if (
      CLASS_CALLS.has(callee) ||
      callee === "fetch" ||
      callee === "require" ||
      callee.endsWith(".setProperty") ||
      callee.endsWith(".getItem") ||
      callee.endsWith(".setItem")
    ) {
      return true;
    }
  }

  return false;
}

function looksLikeHumanText(value) {
  const text = normalizeText(value);
  if (text.length < 2 || !/[\p{L}]/u.test(text)) return false;
  if (/^(?:use client|use server)$/i.test(text)) return false;
  if (/^(?:https?:|mailto:|data:|javascript:|file:|\/|#|\.|@)/i.test(text)) {
    return false;
  }
  if (/\.(?:tsx?|jsx?|mjs|json|css|svg|png|jpe?g|webp|pdf|docx?|mp4|woff2?)(?:\?|$)/i.test(text)) {
    return false;
  }
  if (/^(?:GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)$/u.test(text)) return false;
  if (/^(?:en|hi|bn|te|mr|ta|ur|gu|kn|or|ml|pa|as|mai|sa|kok|sd|ne|si|mni|doi|sat|ks)$/u.test(text)) {
    return false;
  }
  if (/^[\w@./:+-]+$/.test(text) && /[./:@_-]/.test(text)) return false;
  if (/^(?:\[[\w*^$|~="'.:# -]+\]|[.#][\w-]+|[a-z][\w-]*\[[^\]]+\])$/i.test(text)) {
    return false;
  }
  if (/^<\/?[a-z][^>]*>$/i.test(text)) return false;
  if (/^(?:rgb|rgba|hsl|hsla|oklch|linear-gradient|radial-gradient)\(/i.test(text)) {
    return false;
  }
  if (
    /^[MmLlHhVvCcSsQqTtAaZz\d\s,.-]+$/.test(text) &&
    (text.length > 80 || /^M[-\d\s,.]/.test(text))
  ) {
    return false;
  }
  const letters = text.match(/\p{L}/gu)?.length ?? 0;
  if (text.length > 120 && letters / text.length < 0.08) return false;
  return true;
}

function looksLikeHumanPattern(value) {
  const text = normalizeText(value);
  if (!looksLikeHumanText(text)) return false;
  if (!/\s/.test(text) && /^[\w.:-]*(?:\{\{\d+\}\})[\w.{}:-]*$/.test(text)) return false;
  if (/^\s*(?:<!doctype|<(?:html|svg|p|title)\b)/i.test(text)) return false;
  if (/^\[data-|^cards\.\{\{/i.test(text)) return false;
  if (/^(?:rotate|translate|url)\s*\(/i.test(text)) return false;
  if (/^[ML]\d*\s+\{\{.*(?:[ML]\d*|Z)/i.test(text)) return false;
  if (/^rule\s+(?:\{\{\d+\}\}\s*){4}$/i.test(text)) return false;
  if (/^(?:\{\{\d+\}\}\s*)+case judgment$/i.test(text)) return false;
  return true;
}

function placeholderPattern(text) {
  let index = 0;
  const source = normalizeText(text).replace(/\{[\w.]+\}/g, () => `{{${index++}}}`);
  return index ? source : undefined;
}

async function walk(dir) {
  const files = [];
  for (const entry of await readdir(dir)) {
    const fullPath = path.join(dir, entry);
    const info = await stat(fullPath);
    if (info.isDirectory()) {
      if (entry.startsWith(".") || entry === "node_modules") continue;
      files.push(...(await walk(fullPath)));
    } else if (/\.(?:ts|tsx|json)$/.test(entry) && !entry.endsWith(".d.ts")) {
      files.push(fullPath);
    }
  }
  return files;
}

function visitJson(value, owner, addExact, property = "") {
  if (typeof value === "string") {
    if (!SKIP_PROPERTIES.has(property)) addExact(value, owner);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item) => visitJson(item, owner, addExact, property));
    return;
  }
  if (value && typeof value === "object") {
    Object.entries(value).forEach(([key, item]) =>
      visitJson(item, owner, addExact, key),
    );
  }
}

async function collectSource() {
  const exact = new Map();
  const patterns = new Map();
  const owners = new Map();

  const addPattern = (raw, owner) => {
    const source = normalizeText(raw);
    if (!source || !source.includes("{{0}}") || !looksLikeHumanPattern(source)) return;
    patterns.set(source, source);
    const key = `pattern:${source}`;
    if (!owners.has(key)) owners.set(key, new Set());
    owners.get(key).add(owner);
  };

  const addExact = (raw, owner) => {
    const text = normalizeText(raw);
    if (!looksLikeHumanText(text)) return;
    const key = textKey(text);
    const collision = exact.get(key);
    if (collision && collision !== text) {
      throw new Error(`Text hash collision for ${key}: ${collision} / ${text}`);
    }
    exact.set(key, text);
    if (!owners.has(key)) owners.set(key, new Set());
    owners.get(key).add(owner);
    const pattern = placeholderPattern(text);
    if (pattern) addPattern(pattern, owner);
  };

  const addExactSegments = (raw, owner) => {
    addExact(raw, owner);
    if (!/[\r\n]/.test(raw)) return;
    raw.split(/\r?\n/).forEach((line) => addExact(line, owner));
  };

  const addPatternSegments = (raw, owner) => {
    addPattern(raw, owner);
    if (!/[\r\n]/.test(raw)) return;
    raw.split(/\r?\n/).forEach((line) => addPattern(line, owner));
  };

  for (const file of await walk(SRC_DIR)) {
    const owner = path.relative(ROOT, file).replaceAll("\\", "/");
    if (owner.endsWith("TextRuntime.tsx")) continue;
    if (
      owner.startsWith("src/app/api/") ||
      owner.startsWith("src/lib/server/") ||
      owner === "src/lib/security-compliance-contract.ts"
    ) {
      continue;
    }
    const code = await readFile(file, "utf8");

    if (file.endsWith(".json")) {
      visitJson(JSON.parse(code), owner, addExact);
      continue;
    }

    const sourceFile = ts.createSourceFile(
      file,
      code,
      ts.ScriptTarget.Latest,
      true,
      file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
    );

    const visit = (node) => {
      if (ts.isTemplateExpression(node) && !isStructuralString(node)) {
        let pattern = node.head.text;
        node.templateSpans.forEach((span, index) => {
          pattern += `{{${index}}}${span.literal.text}`;
        });
        addPatternSegments(pattern, owner);
      } else if (ts.isJsxText(node)) {
        addExactSegments(node.getText(sourceFile), owner);
      } else if (
        (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) &&
        !isStructuralString(node)
      ) {
        addExactSegments(node.text, owner);
      }
      ts.forEachChild(node, visit);
    };
    visit(sourceFile);
  }

  const exactObject = Object.fromEntries(
    [...exact.entries()].sort((left, right) => left[0].localeCompare(right[0])),
  );
  const patternList = [...patterns.keys()].sort();
  const fingerprint = createHash("sha256")
    .update(JSON.stringify([exactObject, patternList]))
    .digest("hex")
    .slice(0, 16);
  const ownerCounts = new Map();
  for (const files of owners.values()) {
    for (const file of files) ownerCounts.set(file, (ownerCounts.get(file) ?? 0) + 1);
  }

  return {
    manifest: {
      version: 1,
      fingerprint,
      exact: exactObject,
      patterns: patternList,
    },
    ownerCounts,
  };
}

function flattenMessages(value, prefix = "", output = new Map()) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => flattenMessages(item, `${prefix}[${index}]`, output));
  } else if (value && typeof value === "object") {
    Object.entries(value).forEach(([key, item]) =>
      flattenMessages(item, prefix ? `${prefix}.${key}` : key, output),
    );
  } else if (typeof value === "string") {
    output.set(prefix, value);
  }
  return output;
}

async function readJson(file, fallback = undefined) {
  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch {
    return fallback;
  }
}

function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function protectPlaceholders(text, ascii = false) {
  const placeholders = [];
  const protectedText = text.replace(/\{\{\d+\}\}|\{[\w.]+\}/g, (match) => {
    const token = ascii
      ? `ZXQPH${placeholders.length}QXZ`
      : `\uE200${placeholders.length}\uE201`;
    placeholders.push(match);
    return token;
  });
  return { protectedText, placeholders, ascii };
}

function restorePlaceholders(text, placeholders, ascii = false) {
  const expression = ascii ? /ZXQPH(\d+)QXZ/g : /\uE200(\d+)\uE201/g;
  return text.replace(expression, (_, index) => placeholders[Number(index)] ?? "");
}

function placeholderSignature(text) {
  return (text.match(/\{\{\d+\}\}|\{[\w.]+\}/g) ?? []).sort().join("|");
}

async function googleTranslate(text, target, attempt = 0) {
  const url =
    "https://translate.googleapis.com/translate_a/single?client=gtx" +
    `&sl=auto&tl=${encodeURIComponent(target)}&dt=t&q=${encodeURIComponent(text)}`;
  try {
    const response = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!response.ok) throw new Error(`Google HTTP ${response.status}`);
    const data = await response.json();
    const translated = (data[0] ?? []).map((segment) => segment[0]).join("").trim();
    if (!translated) throw new Error("Google returned an empty translation");
    return translated;
  } catch (error) {
    if (attempt >= 4) throw error;
    await sleep(500 * (attempt + 1));
    return googleTranslate(text, target, attempt + 1);
  }
}

let bingSession;

async function createBingSession() {
  const response = await fetch("https://www.bing.com/translator", {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/138 Safari/537.36",
      "Accept-Language": "en-US,en;q=0.9",
    },
  });
  if (!response.ok) throw new Error(`Bing session HTTP ${response.status}`);
  const cookies = (response.headers.getSetCookie?.() ?? [])
    .map((cookie) => cookie.split(";", 1)[0])
    .join("; ");
  const html = await response.text();
  const ig = html.match(/IG:"([^"]+)"/)?.[1];
  const iid = html.match(/data-iid="([^"]+)"/)?.[1];
  const abuse = html
    .match(/params_AbusePreventionHelper\s*=\s*\[([^\]]+)\]/)?.[1]
    ?.match(/(\d+),"([^"]+)"/);
  if (!ig || !iid || !abuse) throw new Error("Bing translator session data not found");
  return { ig, iid, key: abuse[1], token: abuse[2], cookies };
}

async function bingTranslate(text, target, attempt = 0) {
  try {
    bingSession ??= await createBingSession();
    const url = new URL("https://www.bing.com/ttranslatev3");
    url.searchParams.set("isVertical", "1");
    url.searchParams.set("IG", bingSession.ig);
    url.searchParams.set("IID", bingSession.iid);
    const body = new URLSearchParams({
      fromLang: "auto-detect",
      text,
      to: target,
      token: bingSession.token,
      key: bingSession.key,
    });
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/138 Safari/537.36",
        "Content-Type": "application/x-www-form-urlencoded",
        Origin: "https://www.bing.com",
        Referer: "https://www.bing.com/translator",
        Cookie: bingSession.cookies,
      },
      body,
    });
    if (!response.ok) {
      if (response.status === 401) bingSession = undefined;
      throw new Error(`Bing HTTP ${response.status}`);
    }
    const data = await response.json();
    const translated = data?.[0]?.translations?.[0]?.text?.trim();
    if (!translated) throw new Error("Bing returned an empty translation");
    return translated;
  } catch (error) {
    if (attempt >= 4) throw error;
    await sleep(700 * (attempt + 1));
    return bingTranslate(text, target, attempt + 1);
  }
}

function makeBatches(items, maxCharacters) {
  const batches = [];
  let batch = [];
  let size = 0;
  for (const item of items) {
    const itemSize = item.text.length + 14;
    if (batch.length && size + itemSize > maxCharacters) {
      batches.push(batch);
      batch = [];
      size = 0;
    }
    batch.push(item);
    size += itemSize;
  }
  if (batch.length) batches.push(batch);
  return batches;
}

async function translateBatch(batch, locale) {
  const ascii = locale === "ks";
  const prepared = batch.map(({ text }) => protectPlaceholders(text, true));
  const payload = prepared
    .map(({ protectedText }, index) =>
      ascii ? `[[[TS${index}]]]${protectedText}` : `\uE100${index}\uE101${protectedText}`,
    )
    .join("\n");
  const translated =
    locale === "ks"
      ? await bingTranslate(payload, "ks")
      : await googleTranslate(payload, GOOGLE_TARGETS[locale]);
  const parts = new Map();
  const expression = ascii
    ? /\[\[\[TS(\d+)\]\]\]([\s\S]*?)(?=\[\[\[TS\d+\]\]\]|$)/g
    : /\uE100(\d+)\uE101([\s\S]*?)(?=\uE100\d+\uE101|$)/g;
  let match;
  while ((match = expression.exec(translated))) {
    parts.set(Number(match[1]), match[2].trim());
  }
  if (parts.size !== batch.length) {
    throw new Error(`Batch markers lost (${parts.size}/${batch.length})`);
  }
  return batch.map((item, index) => {
    const translated = restorePlaceholders(
      parts.get(index),
      prepared[index].placeholders,
      prepared[index].ascii,
    ).trim();
    if (!translated) throw new Error(`Empty translation for: ${item.text.slice(0, 80)}`);
    if (placeholderSignature(item.text) !== placeholderSignature(translated)) {
      throw new Error(`Damaged placeholder in: ${item.text.slice(0, 80)}`);
    }
    return { ...item, translated };
  });
}

function splitLongText(text, maxCharacters) {
  if (text.length <= maxCharacters) return [text];
  const words = text.split(" ");
  const chunks = [];
  let chunk = "";
  for (const word of words) {
    if (chunk && chunk.length + word.length + 1 > maxCharacters) {
      chunks.push(chunk);
      chunk = word;
    } else {
      chunk = chunk ? `${chunk} ${word}` : word;
    }
  }
  if (chunk) chunks.push(chunk);
  return chunks;
}

async function translateItem(item, locale) {
  const maxCharacters = locale === "ks" ? 700 : 2300;
  const chunks = splitLongText(item.text, maxCharacters);
  const translatedChunks = [];
  for (const chunk of chunks) {
    const prepared = protectPlaceholders(chunk, true);
    const translated =
      locale === "ks"
        ? await bingTranslate(prepared.protectedText, "ks")
        : await googleTranslate(prepared.protectedText, GOOGLE_TARGETS[locale]);
    translatedChunks.push(
      restorePlaceholders(translated, prepared.placeholders, prepared.ascii),
    );
  }
  const translated = translatedChunks.join(" ");
  if (placeholderSignature(item.text) !== placeholderSignature(translated)) {
    throw new Error(`Damaged placeholder in: ${item.text.slice(0, 80)}`);
  }
  return { ...item, translated };
}

async function runPool(items, concurrency, worker) {
  let cursor = 0;
  const runners = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      await worker(items[index], index);
    }
  });
  await Promise.all(runners);
}

async function translateLocale(locale, manifest, force) {
  const outputPath = path.join(OUTPUT_DIR, `${locale}.json`);
  const previous = (await readJson(outputPath, {})) ?? {};
  const exact = force ? {} : { ...(previous.exact ?? {}) };
  const patternMap = new Map(force ? [] : previous.patterns ?? []);

  const englishMessages = flattenMessages(
    await readJson(path.join(MESSAGES_DIR, "en.json"), {}),
  );
  const localeMessages = flattenMessages(
    await readJson(path.join(MESSAGES_DIR, `${locale}.json`), {}),
  );
  for (const [messagePath, source] of englishMessages) {
    const translated = localeMessages.get(messagePath);
    if (translated && translated !== source) exact[textKey(source)] = translated;
  }

  const translationsBySource = new Map();
  for (const [key, source] of Object.entries(manifest.exact)) {
    if (
      !force &&
      exact[key] &&
      placeholderSignature(source) === placeholderSignature(exact[key])
    ) {
      translationsBySource.set(source, exact[key]);
    } else if (exact[key]) {
      delete exact[key];
    }
  }
  for (const [source, translated] of patternMap) {
    if (
      translated &&
      placeholderSignature(source) === placeholderSignature(translated)
    ) {
      translationsBySource.set(source, translated);
    } else {
      patternMap.delete(source);
    }
  }

  const requested = new Map();
  for (const [key, source] of Object.entries(manifest.exact)) {
    if (!translationsBySource.has(source) && !requested.has(source)) {
      requested.set(source, { text: source, refs: [] });
    }
    requested.get(source)?.refs.push({ type: "exact", key });
  }
  for (const source of manifest.patterns) {
    if (!translationsBySource.has(source) && !requested.has(source)) {
      requested.set(source, { text: source, refs: [] });
    }
    requested.get(source)?.refs.push({ type: "pattern", key: source });
  }

  const items = [...requested.values()];
  const maxCharacters = locale === "ks" ? 850 : 2600;
  const batches = makeBatches(items, maxCharacters);
  let completed = 0;
  let failed = 0;
  const failures = [];
  process.stdout.write(
    `→ ${locale}: ${items.length} new string(s), ${batches.length} batch(es) `,
  );

  const commit = (results) => {
    for (const result of results) {
      translationsBySource.set(result.text, result.translated);
      for (const ref of result.refs) {
        if (ref.type === "exact") exact[ref.key] = result.translated;
        else patternMap.set(ref.key, result.translated);
      }
    }
  };

  await runPool(batches, locale === "ks" ? 2 : 4, async (batch) => {
    try {
      const results = await translateBatch(batch, locale);
      commit(results);
      completed += batch.length;
    } catch (batchError) {
      for (const item of batch) {
        try {
          commit([await translateItem(item, locale)]);
          completed++;
        } catch (itemError) {
          failed++;
          failures.push(`${itemError.message}: ${item.text.slice(0, 80)}`);
        }
      }
      if (failed && failures.length === 1) {
        failures.push(`Initial batch error: ${batchError.message}`);
      }
    }
    if (completed % 500 < batch.length) process.stdout.write(".");
  });

  const liveExact = Object.fromEntries(
    Object.entries(manifest.exact)
      .filter(([key]) => exact[key])
      .map(([key]) => [key, exact[key]]),
  );
  const livePatterns = manifest.patterns
    .filter((source) => patternMap.get(source))
    .map((source) => [source, patternMap.get(source)]);
  const catalog = {
    version: 1,
    locale,
    fingerprint: manifest.fingerprint,
    sourceCount: Object.keys(manifest.exact).length,
    exact: liveExact,
    patterns: livePatterns,
  };
  await writeFile(outputPath, `${JSON.stringify(catalog)}\n`, "utf8");

  const missing = catalog.sourceCount - Object.keys(catalog.exact).length;
  console.log(` done; exact=${Object.keys(catalog.exact).length}, missing=${missing}, failed=${failed}`);
  if (failures.length) {
    failures.slice(0, 5).forEach((failure) => console.error(`  ! ${failure}`));
  }
  return missing + (manifest.patterns.length - catalog.patterns.length);
}

async function main() {
  const args = process.argv.slice(2);
  const extractOnly = args.includes("--extract-only");
  const force = args.includes("--force");
  const requestedLocales = args.filter((arg) => !arg.startsWith("--"));
  const locales = requestedLocales.length
    ? TARGETS.filter((locale) => requestedLocales.includes(locale))
    : TARGETS;
  if (requestedLocales.some((locale) => !TARGETS.includes(locale))) {
    throw new Error(`Unknown locale: ${requestedLocales.find((locale) => !TARGETS.includes(locale))}`);
  }

  await mkdir(OUTPUT_DIR, { recursive: true });
  const { manifest, ownerCounts } = await collectSource();
  await writeFile(SOURCE_PATH, `${JSON.stringify(manifest)}\n`, "utf8");
  const sourceCharacters = Object.values(manifest.exact).reduce(
    (total, text) => total + text.length,
    0,
  );
  console.log(
    `Collected ${Object.keys(manifest.exact).length} exact strings ` +
      `(${sourceCharacters.toLocaleString()} characters) and ${manifest.patterns.length} patterns.`,
  );
  console.log(`Source fingerprint: ${manifest.fingerprint}`);
  console.log("Largest text owners:");
  [...ownerCounts.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 12)
    .forEach(([file, count]) => console.log(`  ${String(count).padStart(4)}  ${file}`));
  if (extractOnly) return;

  let missing = 0;
  await runPool(locales, 2, async (locale) => {
    missing += await translateLocale(locale, manifest, force);
  });
  if (missing) {
    console.error(`Translation generation finished with ${missing} missing entries.`);
    process.exitCode = 1;
  } else {
    console.log(`All ${locales.length} requested locale catalog(s) are complete.`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});