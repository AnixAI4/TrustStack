import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

/**
 * THE ONLY service-role client in the web app.
 *
 * The service role BYPASSES RLS ENTIRELY. It must never reach the browser and
 * never be exposed as NEXT_PUBLIC_*. `tools/check_service_role.mjs` fails CI if
 * SUPABASE_SERVICE_ROLE_KEY is referenced anywhere else in apps/.
 *
 * Every use needs a reason in the calling code and explicit scoping. Uses:
 *  - lib/invites/lookup.ts — reads ONE invite by the hash of a token the
 *    caller holds, and creates the invitee's confirmed Auth user (D-022).
 *  - lib/intake/rpc.ts — calls the four `intake_*` functions and (Stage 3b)
 *    `consent_notice`, `consent_widget` and `consent_record_public`, which
 *    only `service_role` may execute, and nothing else: a Data Principal is
 *    not a user, and the anon key is public (D-086).
 */
export function createSupabaseAdminClient(): SupabaseClient<Database> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
  }
  return createClient<Database>(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
