import { NextResponse } from "next/server";
import { resolveScanAccess } from "@/lib/scanner/entitlements";
import { createClient } from "@/lib/supabase/server";
import type { CanScanResult, SubscriptionTier } from "@/lib/supabase/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export type ScannerQuotaResponse = {
  signed_in: boolean;
  tier: SubscriptionTier;
  can_scan: boolean;
  scan_type?: CanScanResult["scan_type"];
  reason?: CanScanResult["reason"];
  message: string;
  free_scans_limit: number;
  free_scans_used: number;
  free_scans_remaining: number;
  pilot_scans_remaining: number;
  prepaid_scans: number;
  scan_credits: number;
  has_pilot: boolean;
  scans_remaining: number;
  extra_scan_price_display: string;
  /** When Pilot daily quota refreshes (ISO). Null if not a Pilot account. */
  next_pilot_scan_at: string | null;
};

const EXTRA_SCAN_PRICE_DISPLAY =
  process.env.NEXT_PUBLIC_EXTRA_SCAN_PRICE_DISPLAY || "299";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({
      signed_in: false,
      tier: "free",
      can_scan: false,
      message: "Sign in to see your scan balance.",
      free_scans_limit: 1,
      free_scans_used: 0,
      free_scans_remaining: 0,
      pilot_scans_remaining: 0,
      prepaid_scans: 0,
      scan_credits: 0,
      has_pilot: false,
      scans_remaining: 0,
      extra_scan_price_display: EXTRA_SCAN_PRICE_DISPLAY,
      next_pilot_scan_at: null,
    } satisfies ScannerQuotaResponse);
  }

  const access = await resolveScanAccess(user.id);

  const body: ScannerQuotaResponse = {
    signed_in: true,
    tier: access.tier,
    can_scan: access.can_scan,
    scan_type: access.scan_type,
    reason: access.reason,
    message: access.message || "",
    free_scans_limit: 1,
    free_scans_used: access.free_scans_used,
    free_scans_remaining: access.free_scans_remaining,
    pilot_scans_remaining: access.pilot_scans_remaining,
    prepaid_scans: access.scan_credits,
    scan_credits: access.scan_credits,
    has_pilot: access.has_pilot,
    scans_remaining: access.scans_remaining,
    extra_scan_price_display: EXTRA_SCAN_PRICE_DISPLAY,
    next_pilot_scan_at: access.next_pilot_scan_at,
  };

  return NextResponse.json(body);
}
