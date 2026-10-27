// Generates messages/<locale>.json for every non-English locale by machine-
// translating messages/en.json (the single source of truth) with the public
// Google Translate endpoint.
//
// Usage:
//   node scripts/translate-messages.mjs            # all 22 target locales
//   node scripts/translate-messages.mjs hi bn ta   # only the given locales
//
// Notes:
// - Requires network access. Repeated provider failures abort without writing
//   the locale, so an English fallback is never mistaken for a translation.
// - ICU placeholders such as {year} are protected and restored verbatim.
// - Identical source strings are translated once per locale (cached).

import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MESSAGES_DIR = path.resolve(__dirname, "..", "messages");

// our locale code -> Google Translate target code (differs for a few)
const GT = {
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
  kok: "gom", // Google calls Konkani "gom" (Goan Konkani)
  sd: "sd", // NOTE: Google outputs Perso-Arabic Sindhi, not Devanagari - review
  ne: "ne",
  si: "si",
  mni: "mni-Mtei", // Meitei (Manipuri) in Meitei Mayek
  doi: "doi",
  sat: "sat", // Santali in Ol Chiki
  ks: "ks", // Kashmiri in Perso-Arabic (Nastaliq)
};

const ALL_TARGETS = Object.keys(GT);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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

async function translateWithBing(text, target) {
  bingSession ??= await createBingSession();
  const url = new URL("https://www.bing.com/ttranslatev3");
  url.searchParams.set("isVertical", "1");
  url.searchParams.set("IG", bingSession.ig);
  url.searchParams.set("IID", bingSession.iid);
  const body = new URLSearchParams({
    fromLang: "en",
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
}

function protect(text, ascii = false) {
  const store = [];
  const out = text.replace(/\{[^}]+\}/g, (m) => {
    const token = ascii ? `__TS_PH_${store.length}__` : `\uE000${store.length}\uE000`;
    store.push(m);
    return token;
  });
  return { out, store, ascii };
}

function restore(text, store, ascii = false) {
  const expression = ascii ? /__TS_PH_(\d+)__/g : /\uE000(\d+)\uE000/g;
  return text.replace(expression, (_, i) => store[Number(i)] ?? "");
}

async function translateOne(text, tl, attempt = 0) {
  if (!text || !text.trim()) return text;
  const { out: protectedText, store, ascii } = protect(text, tl === "ks");
  try {
    let joined;
    if (tl === "ks") {
      joined = await translateWithBing(protectedText, "ks");
    } else {
      const url =
        "https://translate.googleapis.com/translate_a/single?client=gtx" +
        `&sl=en&tl=${encodeURIComponent(tl)}&dt=t&q=${encodeURIComponent(protectedText)}`;
      const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
      if (!res.ok) throw new Error(`Google HTTP ${res.status}`);
      const data = await res.json();
      joined = (data[0] || []).map((seg) => seg[0]).join("");
    }
    const result = restore(joined, store, ascii).trim();
    if (!result) throw new Error("Provider returned an empty translation");
    return result;
  } catch (err) {
    if (attempt < 4) {
      await sleep(600 * (attempt + 1));
      return translateOne(text, tl, attempt + 1);
    }
    throw new Error(`[${tl}] "${text.slice(0, 40)}" - ${err.message}`);
  }
}

async function translateTree(enNode, existingNode, tl, cache) {
  if (typeof enNode === "string") {
    // Preserve an existing, already-translated value (incremental mode).
    if (typeof existingNode === "string" && existingNode.trim()) {
      return existingNode;
    }
    if (cache.has(enNode)) return cache.get(enNode);
    const t = await translateOne(enNode, tl);
    cache.set(enNode, t);
    await sleep(80);
    return t;
  }
  if (Array.isArray(enNode)) {
    const out = [];
    for (let i = 0; i < enNode.length; i++) {
      const ex = Array.isArray(existingNode) ? existingNode[i] : undefined;
      out.push(await translateTree(enNode[i], ex, tl, cache));
    }
    return out;
  }
  if (enNode && typeof enNode === "object") {
    const out = {};
    for (const [k, v] of Object.entries(enNode)) {
      const ex =
        existingNode && typeof existingNode === "object"
          ? existingNode[k]
          : undefined;
      out[k] = await translateTree(v, ex, tl, cache);
    }
    return out;
  }
  return enNode;
}

async function main() {
  const en = JSON.parse(await readFile(path.join(MESSAGES_DIR, "en.json"), "utf8"));
  const args = process.argv.slice(2);
  // --force re-translates everything; otherwise existing translations are kept
  // and only missing keys are translated (incremental).
  const force = args.includes("--force");
  const filter = args.filter((a) => !a.startsWith("--"));
  const targets = filter.length
    ? ALL_TARGETS.filter((l) => filter.includes(l))
    : ALL_TARGETS;

  console.log(
    `Translating ${targets.length} locale(s)${force ? " [force]" : " [incremental]"}: ${targets.join(", ")}`,
  );
  for (const locale of targets) {
    const tl = GT[locale];
    const cache = new Map();
    let existing = {};
    if (!force) {
      try {
        existing = JSON.parse(
          await readFile(path.join(MESSAGES_DIR, `${locale}.json`), "utf8"),
        );
      } catch {
        existing = {};
      }
    }
    process.stdout.write(`→ ${locale} (gt:${tl}) … `);
    const translated = await translateTree(en, existing, tl, cache);
    await writeFile(
      path.join(MESSAGES_DIR, `${locale}.json`),
      JSON.stringify(translated, null, 2) + "\n",
      "utf8",
    );
    console.log(`done (${cache.size} newly translated)`);
  }
  console.log("All locales written.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
