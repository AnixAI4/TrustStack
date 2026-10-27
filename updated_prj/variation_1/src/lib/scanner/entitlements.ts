import { createAdminClient } from "@/lib/supabase/admin";
import { resolvePilotTier } from "@/lib/security/pilot-gate";
import type { CanScanResult, SubscriptionTier } from "@/lib/supabase/types";

export const FREE_PREVIEW_LIMIT = 1;
export const PILOT_DAILY_LIMIT = 1;
export const EXTRA_SCAN_PRICE_PAISE = parseInt(
  process.env.EXTRA_SCAN_PRICE_PAISE || "29900",
  10
);
export const EXTRA_SCAN_PRICE_DISPLAY =
  process.env.NEXT_PUBLIC_EXTRA_SCAN_PRICE_DISPLAY || "299";

export type ScanType = NonNullable<CanScanResult["scan_type"]>;

export type ScanAccess = CanScanResult & {
  free_scans_used: number;
  free_scans_remaining: number;
  pilot_scans_remaining: number;
  scan_credits: number;
  has_pilot: boolean;
  /** ISO timestamp when the next Pilot daily scan unlocks (UTC midnight). */
  next_pilot_scan_at: string | null;
};

/** Calendar day used for Pilot daily quota (UTC, matches scan_date storage). */
function todayISODate(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Next UTC midnight - when `scan_date` rolls and Pilot daily resets. */
export function nextPilotScanAtISO(from: Date = new Date()): string {
  const next = new Date(
    Date.UTC(
      from.getUTCFullYear(),
      from.getUTCMonth(),
      from.getUTCDate() + 1,
      0,
      0,
      0,
      0
    )
  );
  return next.toISOString();
}

/**
 * Authoritative scan access check (service role).
 * Free: 1 lifetime preview. Pilot: 1 full scan/day. Both: prepaid credits (₹299 each).
 */
export async function resolveScanAccess(userId: string): Promise<ScanAccess> {
  const admin = createAdminClient();
  if (!admin) {
    return {
      can_scan: false,
      tier: "free",
      reason: "payment_required",
      message: "Scanner entitlements unavailable. Try again shortly.",
      scans_remaining: 0,
      free_scans_used: 0,
      free_scans_remaining: 0,
      pilot_scans_remaining: 0,
      scan_credits: 0,
      has_pilot: false,
      next_pilot_scan_at: null,
    };
  }

  const tier = await resolvePilotTier(admin, userId);
  const hasPilot = tier === "pilot";

  const { data: entitlements } = await admin
    .from("user_entitlements")
    .select("free_scans_used, scan_credits")
    .eq("user_id", userId)
    .maybeSingle();

  let freeUsed = Math.max(0, entitlements?.free_scans_used ?? 0);
  const credits = Math.max(0, entitlements?.scan_credits ?? 0);

  // Heal: if free preview was never recorded but the account already has scans,
  // treat the lifetime free preview as consumed.
  if (!hasPilot && freeUsed < FREE_PREVIEW_LIMIT) {
    const { count } = await admin
      .from("user_scans")
      .select("report_id", { count: "exact", head: true })
      .eq("user_id", userId);
    if ((count ?? 0) > 0) {
      freeUsed = FREE_PREVIEW_LIMIT;
      await admin.from("user_entitlements").upsert(
        {
          user_id: userId,
          free_scans_used: FREE_PREVIEW_LIMIT,
          scan_credits: credits,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );
    }
  }

  const freeRemaining = Math.max(0, FREE_PREVIEW_LIMIT - freeUsed);

  if (hasPilot) {
    const { data: daily } = await admin
      .from("daily_scan_usage")
      .select("scans_used")
      .eq("user_id", userId)
      .eq("scan_date", todayISODate())
      .maybeSingle();

    const usedToday = Math.max(0, daily?.scans_used ?? 0);
    const pilotRemaining = Math.max(0, PILOT_DAILY_LIMIT - usedToday);

    const nextPilotAt = nextPilotScanAtISO();

    if (pilotRemaining > 0) {
      return {
        can_scan: true,
        tier: "pilot",
        scan_type: "pilot_daily",
        scans_remaining: pilotRemaining,
        message: `Pilot: ${pilotRemaining} full scan remaining today.`,
        free_scans_used: freeUsed,
        free_scans_remaining: freeRemaining,
        pilot_scans_remaining: pilotRemaining,
        scan_credits: credits,
        has_pilot: true,
        next_pilot_scan_at: nextPilotAt,
      };
    }

    if (credits > 0) {
      return {
        can_scan: true,
        tier: "pilot",
        scan_type: "prepaid",
        scans_remaining: credits,
        message: `Today's Pilot scan used · ${credits} paid credit${credits === 1 ? "" : "s"} ready.`,
        free_scans_used: freeUsed,
        free_scans_remaining: freeRemaining,
        pilot_scans_remaining: 0,
        scan_credits: credits,
        has_pilot: true,
        next_pilot_scan_at: nextPilotAt,
      };
    }

    return {
      can_scan: false,
      tier: "pilot",
      reason: "daily_limit_reached",
      scans_remaining: 0,
      message:
        "Today's Pilot scan used. Purchase an additional scan credit or come back tomorrow.",
      free_scans_used: freeUsed,
      free_scans_remaining: freeRemaining,
      pilot_scans_remaining: 0,
      scan_credits: 0,
      has_pilot: true,
      next_pilot_scan_at: nextPilotAt,
    };
  }

  // Free tier
  if (freeRemaining > 0) {
    return {
      can_scan: true,
      tier: "free",
      scan_type: "free_preview",
      scans_remaining: freeRemaining,
      message: `${freeRemaining} of ${FREE_PREVIEW_LIMIT} free preview scan remaining.`,
      free_scans_used: freeUsed,
      free_scans_remaining: freeRemaining,
      pilot_scans_remaining: 0,
      scan_credits: credits,
      has_pilot: false,
      next_pilot_scan_at: null,
    };
  }

  if (credits > 0) {
    return {
      can_scan: true,
      tier: "free",
      scan_type: "prepaid",
      scans_remaining: credits,
      message: `${credits} paid full-scan credit${credits === 1 ? "" : "s"} ready.`,
      free_scans_used: freeUsed,
      free_scans_remaining: 0,
      pilot_scans_remaining: 0,
      scan_credits: credits,
      has_pilot: false,
      next_pilot_scan_at: null,
    };
  }

  return {
    can_scan: false,
    tier: "free",
    reason: "payment_required",
    scans_remaining: 0,
    message:
      "Free preview used. Get Pilot for 1 full scan/day, or purchase an additional scan credit.",
    free_scans_used: freeUsed,
    free_scans_remaining: 0,
    pilot_scans_remaining: 0,
    scan_credits: 0,
    has_pilot: false,
    next_pilot_scan_at: null,
  };
}

/** Consume one scan entitlement after a successful scan. */
export async function consumeScan(
  userId: string,
  scanType: ScanType
): Promise<boolean> {
  const admin = createAdminClient();
  if (!admin) return false;

  if (scanType === "pilot_daily") {
    const today = todayISODate();
    const { data: existing } = await admin
      .from("daily_scan_usage")
      .select("id, scans_used")
      .eq("user_id", userId)
      .eq("scan_date", today)
      .maybeSingle();

    if (existing?.id) {
      const { error } = await admin
        .from("daily_scan_usage")
        .update({ scans_used: (existing.scans_used ?? 0) + 1 })
        .eq("id", existing.id);
      return !error;
    }

    const { error } = await admin.from("daily_scan_usage").insert({
      user_id: userId,
      scan_date: today,
      scans_used: 1,
    });
    return !error;
  }

  const { data: entitlements } = await admin
    .from("user_entitlements")
    .select("free_scans_used, scan_credits")
    .eq("user_id", userId)
    .maybeSingle();

  const freeUsed = entitlements?.free_scans_used ?? 0;
  const credits = entitlements?.scan_credits ?? 0;

  if (scanType === "free_preview") {
    const { error } = await admin.from("user_entitlements").upsert(
      {
        user_id: userId,
        free_scans_used: Math.max(freeUsed + 1, FREE_PREVIEW_LIMIT),
        scan_credits: credits,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );
    return !error;
  }

  if (scanType === "prepaid") {
    const { error } = await admin.from("user_entitlements").upsert(
      {
        user_id: userId,
        free_scans_used: freeUsed,
        scan_credits: Math.max(0, credits - 1),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );
    return !error;
  }

  return false;
}

/** Grant one prepaid full-scan credit after ₹299 payment. */
export async function grantScanCredit(userId: string): Promise<number | null> {
  const admin = createAdminClient();
  if (!admin) return null;

  const { data: entitlements } = await admin
    .from("user_entitlements")
    .select("free_scans_used, scan_credits")
    .eq("user_id", userId)
    .maybeSingle();

  const nextCredits = Math.max(0, (entitlements?.scan_credits ?? 0) + 1);
  const { error } = await admin.from("user_entitlements").upsert(
    {
      user_id: userId,
      free_scans_used: entitlements?.free_scans_used ?? 0,
      scan_credits: nextCredits,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  return error ? null : nextCredits;
}

/** Undo a reserved entitlement when the scan fails after consume. */
export async function refundScan(
  userId: string,
  scanType: ScanType
): Promise<boolean> {
  const admin = createAdminClient();
  if (!admin) return false;

  if (scanType === "pilot_daily") {
    const today = todayISODate();
    const { data: existing } = await admin
      .from("daily_scan_usage")
      .select("id, scans_used")
      .eq("user_id", userId)
      .eq("scan_date", today)
      .maybeSingle();
    if (!existing?.id) return true;
    const next = Math.max(0, (existing.scans_used ?? 1) - 1);
    const { error } = await admin
      .from("daily_scan_usage")
      .update({ scans_used: next })
      .eq("id", existing.id);
    return !error;
  }

  const { data: entitlements } = await admin
    .from("user_entitlements")
    .select("free_scans_used, scan_credits")
    .eq("user_id", userId)
    .maybeSingle();

  const freeUsed = entitlements?.free_scans_used ?? 0;
  const credits = entitlements?.scan_credits ?? 0;

  if (scanType === "free_preview") {
    const { error } = await admin.from("user_entitlements").upsert(
      {
        user_id: userId,
        free_scans_used: Math.max(0, freeUsed - 1),
        scan_credits: credits,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );
    return !error;
  }

  if (scanType === "prepaid") {
    const { error } = await admin.from("user_entitlements").upsert(
      {
        user_id: userId,
        free_scans_used: freeUsed,
        scan_credits: credits + 1,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );
    return !error;
  }

  return false;
}
