/**
 * Grant +1 prepaid full-scan credit to a user by email.
 * Usage: node scripts/grant-scan-credit.mjs ayuvwaman@gmail.com
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";

function loadEnv() {
  const envPath = resolve(process.cwd(), ".env.local");
  const raw = readFileSync(envPath, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    let v = m[2].trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    if (!process.env[m[1]]) process.env[m[1]] = v;
  }
}

loadEnv();

const email = (process.argv[2] || "").trim().toLowerCase();
if (!email) {
  console.error("Usage: node scripts/grant-scan-credit.mjs <email>");
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key =
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or service role key");
  process.exit(1);
}

const admin = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data: listed, error: listErr } = await admin.auth.admin.listUsers({
  page: 1,
  perPage: 1000,
});
if (listErr) {
  console.error("listUsers failed:", listErr.message);
  process.exit(1);
}

const user = (listed?.users || []).find(
  (u) => (u.email || "").toLowerCase() === email
);
if (!user) {
  console.error("User not found for email:", email);
  process.exit(1);
}

const { data: entitlements, error: entErr } = await admin
  .from("user_entitlements")
  .select("free_scans_used, scan_credits")
  .eq("user_id", user.id)
  .maybeSingle();

if (entErr) {
  console.error("read entitlements failed:", entErr.message);
  process.exit(1);
}

const freeUsed = entitlements?.free_scans_used ?? 0;
const before = entitlements?.scan_credits ?? 0;
const after = before + 1;

const { error: upErr } = await admin.from("user_entitlements").upsert(
  {
    user_id: user.id,
    free_scans_used: freeUsed,
    scan_credits: after,
    updated_at: new Date().toISOString(),
  },
  { onConflict: "user_id" }
);

if (upErr) {
  console.error("grant failed:", upErr.message);
  process.exit(1);
}

console.log(
  JSON.stringify(
    {
      email,
      user_id: user.id,
      scan_credits_before: before,
      scan_credits_after: after,
      granted: 1,
    },
    null,
    2
  )
);
