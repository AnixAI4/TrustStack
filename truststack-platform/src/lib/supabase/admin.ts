import { createClient } from '@supabase/supabase-js'

// Admin client — server-side only, uses service role key, bypasses RLS
// NEVER import this in any file that runs in the browser
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
