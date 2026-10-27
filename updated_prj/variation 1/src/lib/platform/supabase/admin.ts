import { createClient } from '@supabase/supabase-js'

// Admin client - server-side only, uses service role key, bypasses RLS
// NEVER import this in any file that runs in the browser
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  // Prefer ROLE_KEY; fall back to existing TrustStack SERVICE_KEY
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY

  if (!url || !key) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY / SUPABASE_SERVICE_KEY'
    )
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
