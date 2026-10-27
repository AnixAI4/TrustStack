/**
 * generate-easy-content.mjs - the build-time "Easy read" simplification pipeline.
 *
 * WHAT IT DOES
 *   1. Scans src/ for every `<Easy>…</Easy>` plain-string child (the body text
 *      an author has marked as "simplify me").
 *   2. Hashes each string by its *content* (see src/lib/easy-hash.ts - the same
 *      algorithm is duplicated below and MUST stay in sync).
 *   3. Diffs those hashes against the committed cache (scripts/easy-read-cache.json).
 *      Only NEW or CHANGED strings are (re)sent for simplification - edited text
 *      changes its hash, so it is automatically re-simplified instead of going
 *      stale. Unchanged strings are free.
 *   4. Simplifies new/changed strings with an LLM *if* an API key is configured;
 *      otherwise it records them as pending (easy:null) and prints a to-do list,
 *      so the repo still builds with no key and a human/AI can fill them in.
 *   5. Compiles src/content/easy-generated.ts from the cache. The <Easy> component
 *      reads that map at render time; the CSS swap in globals.css does the rest.
 *
 * RUN
 *   npm run generate:easy
 *
 * OPTIONAL LLM (OpenAI-compatible; works with OpenAI, Groq, Azure, etc.)
 *   EASY_LLM_API_KEY   (or OPENAI_API_KEY) - enables generation
 *   EASY_LLM_BASE_URL  default https://api.openai.com/v1
 *   EASY_LLM_MODEL     default gpt-4o-mini
 *
 * NOTE ON <Easy> AUTHORING: children must be a single plain string - no nested
 * JSX and no {expressions}. That is what gets hashed and simplified. For richer
 * markup, hand-author both variants with <Swap> instead.
 */

import { readFile, writeFile, readdir, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SRC_DIR = path.join(ROOT, "src");
const CACHE_PATH = path.join(__dirname, "easy-read-cache.json");
const OUT_TS = path.join(ROOT, "src", "content", "easy-generated.ts");

// ---------------------------------------------------------------------------
// Content hash - KEEP IN SYNC with src/lib/easy-hash.ts
// ---------------------------------------------------------------------------
function normalizeEasy(text) {
  return text.replace(/\s+/g, " ").trim();
}
function easyKey(text) {
  const str = normalizeEasy(text);
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36);
}

// ---------------------------------------------------------------------------
// 1. Discover <Easy> strings across src/
// ---------------------------------------------------------------------------
async function walk(dir) {
  const out = [];
  for (const name of await readdir(dir)) {
    const full = path.join(dir, name);
    const s = await stat(full);
    if (s.isDirectory()) {
      if (name === "node_modules" || name.startsWith(".")) continue;
      out.push(...(await walk(full)));
    } else if (/\.(tsx|ts)$/.test(name)) {
      out.push(full);
    }
  }
  return out;
}

const EASY_TAG_RE = /<Easy>([\s\S]*?)<\/Easy>/g;

async function collectStrings() {
  const files = await walk(SRC_DIR);
  const found = new Map(); // key -> { normal, files:Set }
  let skipped = 0;

  for (const file of files) {
    const rel = path.relative(ROOT, file).replace(/\\/g, "/");
    // The component's own definition/JSDoc contains a literal <Easy>…</Easy>
    // example - don't scan the file that defines the tag.
    if (rel.endsWith("components/site/EasyContent.tsx")) continue;

    const code = await readFile(file, "utf8");
    let m;
    while ((m = EASY_TAG_RE.exec(code)) !== null) {
      const inner = m[1];
      // Only plain-string children: no nested JSX, no {expressions}.
      if (inner.includes("<") || inner.includes("{") || inner.includes("}")) {
        skipped++;
        continue;
      }
      const normal = normalizeEasy(inner);
      // Real body text is a sentence: has a space and meaningful length.
      // Filters placeholder/example fragments like "…".
      if (normal.length < 12 || !normal.includes(" ")) {
        skipped++;
        continue;
      }
      const key = easyKey(normal);
      if (found.has(key)) found.get(key).files.add(rel);
      else found.set(key, { normal, files: new Set([rel]) });
    }
  }
  return { found, skipped };
}

// ---------------------------------------------------------------------------
// 2. Cache
// ---------------------------------------------------------------------------
async function loadCache() {
  if (!existsSync(CACHE_PATH)) return { version: 1, entries: {} };
  try {
    const parsed = JSON.parse(await readFile(CACHE_PATH, "utf8"));
    return { version: 1, entries: {}, ...parsed };
  } catch {
    return { version: 1, entries: {} };
  }
}

// ---------------------------------------------------------------------------
// 3. Optional LLM simplification (OpenAI-compatible)
// ---------------------------------------------------------------------------
const LLM_KEY = process.env.EASY_LLM_API_KEY || process.env.OPENAI_API_KEY || "";
const LLM_BASE = process.env.EASY_LLM_BASE_URL || "https://api.openai.com/v1";
const LLM_MODEL = process.env.EASY_LLM_MODEL || "gpt-4o-mini";

const SYSTEM_PROMPT =
  "You rewrite text from India's Digital Personal Data Protection (DPDP) Act 2023, " +
  "the DPDP Rules 2025, and related compliance material into clear, plain English " +
  "for a non-specialist adult reader (around an 8th-grade reading level). Rules: " +
  "preserve the meaning exactly; never add, drop, soften or invent any obligation, " +
  "right, number or deadline; prefer short sentences and everyday words; keep it " +
  "concise (roughly the same length or shorter). Return ONLY the rewritten text, " +
  "with no preamble, quotes or notes.";

async function simplify(text) {
  if (!LLM_KEY) return null;
  const res = await fetch(`${LLM_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${LLM_KEY}`,
    },
    body: JSON.stringify({
      model: LLM_MODEL,
      temperature: 0.2,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: text },
      ],
    }),
  });
  if (!res.ok) {
    console.warn(`  ! LLM ${res.status} - leaving pending`);
    return null;
  }
  const json = await res.json();
  const out = json?.choices?.[0]?.message?.content?.trim();
  return out || null;
}

// ---------------------------------------------------------------------------
// 4. Compile the runtime map
// ---------------------------------------------------------------------------
function emitTs(entries) {
  const map = {};
  const unreviewed = [];
  for (const [key, e] of Object.entries(entries)) {
    if (!e.easy) continue;
    map[key] = e.easy;
    if (!e.reviewed) unreviewed.push(key);
  }
  const body = Object.entries(map)
    .map(([k, v]) => `  ${JSON.stringify(k)}: ${JSON.stringify(v)},`)
    .join("\n");
  const rev = unreviewed.map((k) => `  ${JSON.stringify(k)},`).join("\n");
  return `/**
 * AUTO-GENERATED - do not edit by hand.
 *
 * Compiled from scripts/easy-read-cache.json by scripts/generate-easy-content.mjs
 * (run \`npm run generate:easy\`). Maps a content hash of the original text
 * (see src/lib/easy-hash.ts) to its plain-language "Easy read" version.
 *
 * The <Easy> component (src/components/site/EasyContent.tsx) looks entries up
 * here at render time; the CSS swap in globals.css shows the right variant.
 */
export const EASY_MAP: Record<string, string> = {
${body}
};

/** Hashes whose simplification has not yet been human-reviewed for legal
 * accuracy. Rendered anyway (so nothing looks broken) but surfaced here for a
 * review checklist. */
export const EASY_UNREVIEWED: readonly string[] = [
${rev}
];
`;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const { found, skipped } = await collectStrings();
  const cache = await loadCache();
  const entries = cache.entries;

  let generated = 0;
  let pending = 0;
  const todo = [];

  for (const [key, { normal, files }] of found) {
    const existing = entries[key];
    if (existing && existing.normal === normal && (existing.easy || LLM_KEY === "")) {
      // Already cached (or pending and we still can't generate) - leave it.
      if (!existing.easy) {
        pending++;
        todo.push(normal);
      }
      entries[key] = { ...existing, files: [...files] };
      continue;
    }
    // New or changed → try to simplify.
    process.stdout.write(`  · ${key} ${normal.slice(0, 56)}…\n`);
    const easy = await simplify(normal);
    entries[key] = {
      normal,
      easy: easy ?? null,
      reviewed: false,
      files: [...files],
      updatedAt: new Date().toISOString(),
    };
    if (easy) generated++;
    else {
      pending++;
      todo.push(normal);
    }
  }

  cache.entries = entries;
  await writeFile(CACHE_PATH, JSON.stringify(cache, null, 2) + "\n", "utf8");
  await writeFile(OUT_TS, emitTs(entries), "utf8");

  const total = found.size;
  const live = Object.values(entries).filter((e) => e.easy).length;
  console.log("\nEasy read generation complete.");
  console.log(`  <Easy> strings found : ${total}`);
  console.log(`  simplified this run  : ${generated}`);
  console.log(`  live in map          : ${live}`);
  console.log(`  pending (no easy yet): ${pending}`);
  if (skipped) console.log(`  skipped (non-string children): ${skipped}`);
  if (!LLM_KEY && pending) {
    console.log(
      `\n  No LLM key set (EASY_LLM_API_KEY / OPENAI_API_KEY). ${pending} string(s) need a` +
        `\n  plain-language version. Fill their "easy" field in scripts/easy-read-cache.json` +
        `\n  and re-run, or set a key to auto-generate. Pending text:`
    );
    for (const t of todo) console.log(`    - ${t.slice(0, 90)}${t.length > 90 ? "…" : ""}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
