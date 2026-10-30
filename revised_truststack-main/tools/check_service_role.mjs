#!/usr/bin/env node
/**
 * Pitfall 2 as a CI gate (D-012): the service-role key bypasses RLS entirely.
 *
 *  1. SUPABASE_SERVICE_ROLE_KEY may be referenced in apps/ from exactly one
 *     module: apps/web/lib/supabase/admin.ts.
 *  2. No NEXT_PUBLIC_* variable may name a service role or secret.
 *  3. That module must import "server-only".
 *  4. With --build-output, the key's VALUE must not appear in the client bundle.
 *  5. Slice 11 (SLICE_11 §5): ANTHROPIC_API_KEY likewise — referenced only by
 *     apps/web/lib/ai/claude.ts, which imports "server-only"; never NEXT_PUBLIC_;
 *     and its value, when set, never in the client bundle.
 */
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const ALLOWED = "apps/web/lib/supabase/admin.ts";
const AI_KEY_ALLOWED = "apps/web/lib/ai/claude.ts";
const errors = [];

const tracked = execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard", "apps"], {
  encoding: "utf8",
})
  .split("\n")
  .filter((f) => /\.(ts|tsx|js|jsx|mjs|cjs)$/.test(f) && existsSync(f));

for (const file of tracked) {
  const src = readFileSync(file, "utf8");
  if (src.includes("SUPABASE_SERVICE_ROLE_KEY") && file !== ALLOWED) {
    errors.push(`${file} references SUPABASE_SERVICE_ROLE_KEY — only ${ALLOWED} may`);
  }
  if (src.includes("ANTHROPIC_API_KEY") && file !== AI_KEY_ALLOWED) {
    errors.push(`${file} references ANTHROPIC_API_KEY — only ${AI_KEY_ALLOWED} may`);
  }
  for (const m of src.matchAll(/NEXT_PUBLIC_[A-Z0-9_]*(SERVICE|SECRET|ANTHROPIC|API_KEY)[A-Z0-9_]*/g)) {
    errors.push(`${file} uses ${m[0]} — secrets must never be NEXT_PUBLIC_`);
  }
}

for (const f of [ALLOWED, AI_KEY_ALLOWED]) {
  if (!readFileSync(f, "utf8").includes('import "server-only"')) errors.push(`${f} must import "server-only"`);
}

const buildFlag = process.argv.indexOf("--build-output");
if (buildFlag !== -1) {
  const dir = process.argv[buildFlag + 1] ?? "apps/web/.next/static";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    errors.push("--build-output needs SUPABASE_SERVICE_ROLE_KEY in env to scan for its value");
  } else if (existsSync(dir)) {
    const walk = (d) =>
      readdirSync(d).flatMap((n) => {
        const p = path.join(d, n);
        return statSync(p).isDirectory() ? walk(p) : [p];
      });
    const aiKey = process.env.ANTHROPIC_API_KEY;
    for (const f of walk(dir)) {
      const text = readFileSync(f, "utf8");
      if (text.includes(key)) errors.push(`service-role key value found in ${f}`);
      if (aiKey && text.includes(aiKey)) errors.push(`ANTHROPIC_API_KEY value found in ${f}`);
    }
  } else {
    errors.push(`build output ${dir} not found`);
  }
}

if (errors.length) {
  for (const e of errors) console.log(`::error::${e}`);
  process.exit(1);
}
console.log(`service-role guard: OK (${tracked.length} files scanned)`);
