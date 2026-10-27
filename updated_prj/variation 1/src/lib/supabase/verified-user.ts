import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'

export type VerifiedUser = { id: string }

/** Verify the signed access token and return only its stable user subject. */
export async function getVerifiedUser(
  supabase: SupabaseClient
): Promise<VerifiedUser | null> {
  const { data, error } = await supabase.auth.getClaims()
  return !error && data?.claims.sub ? { id: data.claims.sub } : null
}
