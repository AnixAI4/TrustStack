/**
 * Server-render smoke matrix for every App Router page template and locale.
 * The dynamic routes use one valid representative parameter; their full data
 * collections are covered by the source/catalog parity audit.
 */
const BASE_URL = process.env.I18N_AUDIT_URL ?? "http://localhost:3000";

const LOCALES = [
  "hi",
  "bn",
  "te",
  "mr",
  "ta",
  "ur",
  "gu",
  "kn",
  "or",
  "ml",
  "pa",
  "as",
  "mai",
  "sa",
  "kok",
  "sd",
  "ne",
  "si",
  "mni",
  "doi",
  "sat",
  "ks",
  "en",
];

const RTL_LOCALES = new Set(["ur", "ks"]);

const ROUTES = [
  "/",
  "/act",
  "/blog",
  "/blog/dpdp-rules-2025-industry-implications",
  "/cases",
  "/cases/puttaswamy-right-to-privacy",
  "/certification",
  "/certification/foundations",
  "/certification/exam",
  "/certification/verify",
  "/cookies",
  "/courses",
  "/courses/citizens",
  "/framework",
  "/industries",
  "/learn",
  "/privacy",
  "/rights",
  "/rules",
  "/rules/1",
  "/scanner",
  "/section",
  "/section/1",
  "/security",
  "/solutions",
  "/templates",
  "/templates/consent-form",
  "/terms",
  "/tools",
  "/why-us",
];

function attribute(html, name) {
  return html.match(new RegExp(`<html[^>]*\\b${name}="([^"]+)"`, "i"))?.[1];
}

async function runPool(items, concurrency, worker) {
  let cursor = 0;
  const runners = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      await worker(items[index]);
    }
  });
  await Promise.all(runners);
}

async function check({ locale, route }) {
  const url = new URL(route, BASE_URL);
  const response = await fetch(url, {
    redirect: "follow",
    headers: { cookie: `NEXT_LOCALE=${locale}` },
    signal: AbortSignal.timeout(60_000),
  });
  const html = await response.text();
  const problems = [];
  const expectedDirection = RTL_LOCALES.has(locale) ? "rtl" : "ltr";

  if (!response.ok) problems.push(`HTTP ${response.status}`);
  if (attribute(html, "lang") !== locale) {
    problems.push(`lang=${attribute(html, "lang") ?? "missing"}`);
  }
  if (attribute(html, "dir") !== expectedDirection) {
    problems.push(`dir=${attribute(html, "dir") ?? "missing"}`);
  }
  if (!/<body\b/i.test(html) || html.length < 500) problems.push("empty document");
  if (/Application error|Internal Server Error|IntlError/i.test(html)) {
    problems.push("error marker in HTML");
  }
  if (locale !== "en" && !html.includes(`/i18n/site/${locale}.json`)) {
    problems.push("catalog preload missing");
  }

  return problems.length
    ? `${locale.padEnd(4)} ${route.padEnd(52)} ${problems.join(", ")}`
    : undefined;
}

async function main() {
  const matrix = LOCALES.flatMap((locale) =>
    ROUTES.map((route) => ({ locale, route })),
  );
  const failures = [];
  const completed = new Map();

  console.log(
    `Checking ${LOCALES.length} locales x ${ROUTES.length} routes ` +
      `(${matrix.length} responses) at ${BASE_URL}`,
  );

  await runPool(matrix, 6, async (entry) => {
    try {
      const failure = await check(entry);
      if (failure) failures.push(failure);
    } catch (error) {
      failures.push(
        `${entry.locale.padEnd(4)} ${entry.route.padEnd(52)} ${error.message}`,
      );
    }
    const count = (completed.get(entry.locale) ?? 0) + 1;
    completed.set(entry.locale, count);
    if (count === ROUTES.length) {
      const localeFailures = failures.filter((failure) =>
        failure.startsWith(entry.locale.padEnd(4)),
      ).length;
      console.log(
        `${entry.locale.padEnd(4)} ${ROUTES.length - localeFailures}/${ROUTES.length} passed`,
      );
    }
  });

  if (failures.length) {
    console.error(`\n${failures.length} route-locale check(s) failed:`);
    failures.forEach((failure) => console.error(`  ${failure}`));
    process.exitCode = 1;
  } else {
    console.log(`\nAll ${matrix.length} route-locale checks passed.`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});