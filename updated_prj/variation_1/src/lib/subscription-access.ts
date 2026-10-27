import { createClient } from "@/lib/supabase/server";
import { resolvePilotTier } from "@/lib/security/pilot-gate";
import type { SubscriptionTier } from "@/lib/supabase/types";

/** Server-side Pilot/free tier for the current auth user. */
export async function getCurrentUserTier(): Promise<SubscriptionTier> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return "free";
  return resolvePilotTier(supabase, user.id) as Promise<SubscriptionTier>;
}
