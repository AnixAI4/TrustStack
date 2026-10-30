/**
 * e2e spec files run in PARALLEL against one database, and each cleans up its
 * own assessments with `DELETE … WHERE name LIKE 'prefix%'`. If one file's
 * prefix is a prefix of another's, its teardown deletes the other file's
 * assessment mid-run — and the victim fails with "Assessment not found",
 * nowhere near the cause.
 *
 * Slice 4 wrote this down as a pitfall. Slice 5 hit it anyway: an API spec
 * named its assessments "E2E scoring" and a UI spec named its own "E2E scoring
 * UI", so the API spec's cleanup swept the UI spec's assessment away on every
 * run. Prose did not prevent it, so it is a check now (D-012).
 */
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const E2E_DIR = path.resolve(import.meta.dirname, "../../e2e");

function specFiles(): string[] {
  const out: string[] = [];
  for (const dir of ["api", "ui"]) {
    const full = path.join(E2E_DIR, dir);
    for (const file of readdirSync(full)) {
      if (file.endsWith(".spec.ts")) out.push(path.join(full, file));
    }
  }
  return out;
}

/**
 * Every `DELETE FROM public.<table> WHERE name LIKE …` a spec performs, as
 * `{ table, prefix }`.
 *
 * The prefix comes either from the literal in the statement or, when the
 * statement is parameterised, from the file's `NAME_PREFIX` constant. Only the
 * real delete shape is matched, so prose about the rule does not count as an
 * instance of it — and the TABLE is captured because two specs may safely
 * share a prefix if they sweep different tables.
 */
function cleanupsIn(source: string): { table: string; prefix: string }[] {
  const constant = source.match(/NAME_PREFIX\s*=\s*"([^"]+)"/)?.[1];
  const out: { table: string; prefix: string }[] = [];
  for (const m of source.matchAll(
    /DELETE FROM public\.(\w+) WHERE name LIKE (?:'([^%']*)%'|\$\d)/g,
  )) {
    const prefix = m[2] ?? constant;
    if (prefix !== undefined) out.push({ table: m[1]!, prefix });
  }
  return out;
}

describe("no e2e spec's assessment-name prefix is a prefix of another's", () => {
  // Qualified by directory, not the bare basename: `api/scoring.spec.ts` and
  // `ui/scoring.spec.ts` share a basename, and keying on it made this guard
  // skip the very pair it was written for.
  const cleanups = specFiles().flatMap((file) =>
    cleanupsIn(readFileSync(file, "utf8")).map((c) => ({
      ...c,
      file: `${path.basename(path.dirname(file))}/${path.basename(file)}`,
    })),
  );

  it("finds the specs that clean up by name at all", () => {
    // A guard on the guard: if the cleanup idiom changes, this test must not
    // quietly start checking nothing.
    expect(cleanups.filter((c) => c.table === "assessments").length).toBeGreaterThanOrEqual(4);
  });

  it("no prefix starts with another, within the same table", () => {
    const clashes: string[] = [];
    for (const a of cleanups) {
      for (const b of cleanups) {
        if (a.file === b.file || a.table !== b.table) continue;
        if (b.prefix.startsWith(a.prefix)) {
          clashes.push(
            `${a.file} deletes ${a.table} LIKE "${a.prefix}%", which also matches ${b.file}'s "${b.prefix}"`,
          );
        }
      }
    }
    expect(clashes).toEqual([]);
  });

  it("two specs may share a prefix only if they sweep different tables", () => {
    // `ui/assessments.spec.ts` and `ui/scope.spec.ts` both use "E2E UI " — one
    // on assessments, one on departments. That is fine, and this records why.
    const shared = cleanups.filter((a) => cleanups.some((b) => b.file !== a.file && b.prefix === a.prefix));
    for (const a of shared) {
      const others = shared.filter((b) => b.file !== a.file && b.prefix === a.prefix);
      expect(others.every((b) => b.table !== a.table), `${a.file} shares "${a.prefix}" on ${a.table}`).toBe(true);
    }
  });
});

/**
 * Found in Slice 8 (D-071): Supabase's default `auth.signOut()` is GLOBAL — it
 * revokes every session the user holds, so the access tokens other spec files
 * cached for that seeded user start failing with 401 mid-run, nowhere near the
 * cause. A spec that signs out must say `{ scope: "local" }`.
 */
describe("no e2e spec signs a shared seeded user out globally", () => {
  for (const file of specFiles()) {
    it(path.relative(E2E_DIR, file), () => {
      const source = readFileSync(file, "utf8");
      const calls = [...source.matchAll(/auth\.signOut\(([^)]*)\)/g)].map((m) => m[1]!.trim());
      for (const args of calls) expect(args, "use signOut({ scope: \"local\" })").toMatch(/scope:\s*"local"/);
    });
  }
});
