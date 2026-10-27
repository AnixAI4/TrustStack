/**
 * Server-rendered smoke audit for every concrete English route.
 *
 * Run without npm:
 *   node --import tsx scripts/audit-easy-routes.mjs
 */

import { ACT_CHAPTERS } from "../src/content/act.ts";
import { ARTICLES } from "../src/content/blog.ts";
import { CASES } from "../src/content/cases.ts";
import { COURSES } from "../src/content/courses.ts";
import { MODULES } from "../src/content/curriculum.ts";
import { RULES } from "../src/content/rules.ts";
import { TEMPLATES } from "../src/content/templates.ts";

const BASE_URL = process.env.EASY_AUDIT_URL ?? "http://127.0.0.1:3000";

const FIXED_ROUTES = [
  "/",
  "/act",
  "/blog",
  "/cases",
  "/certification",
  "/certification/exam",
  "/certification/verify",
  "/cookies",
  "/courses",
  "/framework",
  "/industries",
  "/learn",
  "/privacy",
  "/rights",
  "/rules",
  "/scanner",
  "/section",
  "/security",
  "/solutions",
  "/templates",
  "/terms",
  "/tools",
  "/why-us",
];

const ROUTES = [
  ...FIXED_ROUTES,
  ...ARTICLES.map(({ slug }) => `/blog/${slug}`),
  ...CASES.map(({ slug }) => `/cases/${slug}`),
  ...COURSES.map(({ slug }) => `/courses/${slug}`),
  ...MODULES.map(({ slug }) => `/certification/${slug}`),
  ...TEMPLATES.map(({ slug }) => `/templates/${slug}`),
  ...ACT_CHAPTERS.flatMap(({ sections }) =>
    sections.map(({ n }) => `/section/${n}`),
  ),
  ...RULES.map(({ n }) => `/rules/${n}`),
];

async function runPool(items, concurrency, worker) {
  let cursor = 0;
  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, async () => {
      while (cursor < items.length) {
        const item = items[cursor++];
        await worker(item);
      }
    }),
  );
}

async function checkRoute(route) {
  const response = await fetch(new URL(route, BASE_URL), {
    headers: { cookie: "NEXT_LOCALE=en" },
    redirect: "follow",
    signal: AbortSignal.timeout(60_000),
  });
  const html = await response.text();
  const problems = [];

  if (!response.ok) problems.push(`HTTP ${response.status}`);
  if (!/<html\b[^>]*\blang="en"/i.test(html)) problems.push("English html missing");
  if (!/<body\b/i.test(html)) problems.push("body missing");
  if (route !== "/certification/exam" && !/<main\b/i.test(html)) {
    problems.push("main missing");
  }
  if (!/data-reading="normal"/i.test(html)) problems.push("reading bootstrap missing");
  if (html.length < 5_000) problems.push(`document too small (${html.length} bytes)`);

  return { route, status: response.status, bytes: html.length, problems };
}

const duplicateRoutes = ROUTES.filter((route, index) => ROUTES.indexOf(route) !== index);
if (duplicateRoutes.length) {
  throw new Error(`Duplicate routes: ${[...new Set(duplicateRoutes)].join(", ")}`);
}

console.log(`Checking ${ROUTES.length} concrete routes at ${BASE_URL}`);
const results = [];
await runPool(ROUTES, 6, async (route) => {
  try {
    results.push(await checkRoute(route));
  } catch (error) {
    results.push({ route, status: 0, bytes: 0, problems: [error.message] });
  }
});

// Concurrent first-time compilation in `next dev` can transiently return a
// JSON-parse 500 while sibling routes sharing the same template compile. Retry
// only failed routes serially; a real route failure remains reproducible here.
for (let index = 0; index < results.length; index += 1) {
  if (!results[index].problems.length) continue;
  try {
    results[index] = await checkRoute(results[index].route);
  } catch (error) {
    results[index] = {
      route: results[index].route,
      status: 0,
      bytes: 0,
      problems: [error.message],
    };
  }
}

const failures = results.filter(({ problems }) => problems.length);
const totalBytes = results.reduce((sum, { bytes }) => sum + bytes, 0);
console.log(
  JSON.stringify(
    {
      routes: ROUTES.length,
      passed: ROUTES.length - failures.length,
      failed: failures.length,
      totalBytes,
    },
    null,
    2,
  ),
);

if (failures.length) {
  for (const { route, status, problems } of failures) {
    console.error(`${route} (${status}): ${problems.join(", ")}`);
  }
  process.exitCode = 1;
}