import type { SupabaseClient } from "@supabase/supabase-js";
import type { SubscriptionTier } from "@/lib/supabase/types";

/**
 * Single source of truth for "does this user have Pilot right now".
 *
 * The rest of the app resolved this four different ways and three of them
 * ignored current_period_end, so an expired subscription still unlocked
 * TrustDeck and TrustChat forever. This one always honours expiry.
 */
export async function resolvePilotTier(
  supabase: SupabaseClient,
  userId: string
): Promise<SubscriptionTier> {
  const now = Date.now();
  const isLivePilot = (subscription: {
    tier: string;
    current_period_end: string | null;
  }) =>
    subscription.tier === "pilot" &&
    (!subscription.current_period_end ||
      new Date(subscription.current_period_end).getTime() > now);

  const { data: personal, error: personalError } = await supabase
    .from("truststack_subscriptions")
    .select("tier, current_period_end")
    .eq("user_id", userId)
    .in("status", ["active", "trialing"]);

  if (!personalError && personal?.some(isLivePilot)) return "pilot";

  const { data: memberships, error: membershipError } = await supabase
    .from("organization_members")
    .select("org_id, organization_id")
    .eq("user_id", userId);

  if (membershipError) return "free";

  const orgIds = [
    ...new Set(
      (memberships ?? [])
        .map((membership) => membership.organization_id || membership.org_id)
        .filter((id): id is string => Boolean(id))
    ),
  ];

  if (!orgIds.length) return "free";

  const { data: organizationSubscriptions, error: organizationError } =
    await supabase
      .from("truststack_subscriptions")
      .select("tier, current_period_end")
      .in("org_id", orgIds)
      .in("status", ["active", "trialing"]);

  if (organizationError) return "free";
  return organizationSubscriptions?.some(isLivePilot) ? "pilot" : "free";
}
