import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { SubscriptionTier, CanScanResult } from "@/lib/supabase/types";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    let tier: SubscriptionTier = "free";

    const { data: tierData, error: tierError } = await supabase.rpc(
      "get_user_tier",
      { p_user_id: user.id }
    );

    if (!tierError && tierData) {
      tier = tierData as SubscriptionTier;
    } else {
      const { data: subData } = await supabase
        .from("truststack_subscriptions")
        .select("tier, status, current_period_end")
        .eq("user_id", user.id)
        .eq("status", "active")
        .single();

      if (subData) {
        tier = subData.tier as SubscriptionTier;
      }
    }

    let canScan: CanScanResult | null = null;

    const { data: scanData, error: scanError } = await supabase.rpc(
      "can_user_scan",
      { p_user_id: user.id }
    );

    if (!scanError && scanData) {
      canScan = scanData as CanScanResult;
    }

    return NextResponse.json({
      user_id: user.id,
      email: user.email,
      tier,
      canScan,
    });
  } catch (error) {
    console.error("Subscription status error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
