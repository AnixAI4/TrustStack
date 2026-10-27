import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

/**
 * Shared Supabase browser client.
 *
 * Resolves to `null` when the public env vars are missing so callers can
 * gracefully fall back to bundled local data instead of throwing at build
 * time. The publishable key is safe to expose to the browser.
 */
export const supabase: SupabaseClient | null =
  url && key ? createClient(url, key) : null;
