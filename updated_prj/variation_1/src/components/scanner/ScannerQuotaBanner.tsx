"use client";

import Link from "next/link";
import { Loader2 } from "lucide-react";
import type { ScannerQuotaResponse } from "@/app/api/scanner/quota/route";

interface Props {
  quota: ScannerQuotaResponse | null;
  loading?: boolean;
  buying?: boolean;
  onBuyExtraScan?: () => void;
}

export function ScannerQuotaBanner({
  quota,
  loading,
  buying,
  onBuyExtraScan,
}: Props) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-line bg-surface-2/60 px-4 py-3 text-sm text-text-muted">
        <Loader2 className="h-4 w-4 animate-spin text-accent" />
        Loading scan balance…
      </div>
    );
  }

  if (!quota) return null;

  if (!quota.signed_in) {
    return (
      <div className="flex flex-col gap-2 rounded-xl border border-line bg-bg-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-text">Sign in to scan</p>
          <p className="mt-0.5 text-xs text-text-muted">
            1 free preview scan per account · Pilot = 1 full scan/day · Additional
            scan credits available when needed
          </p>
        </div>
        <Link
          href="/auth/sign-in?next=/scanner"
          className="inline-flex min-h-11 items-center justify-center rounded-lg border border-accent/30 bg-accent/10 px-3 text-sm font-medium text-accent"
        >
          Sign in
        </Link>
      </div>
    );
  }

  const prepaid = quota.prepaid_scans ?? 0;
  const hasPilot = quota.has_pilot;
  const pilotRemaining = quota.pilot_scans_remaining ?? 0;
  const freeRemaining = quota.free_scans_remaining ?? 0;
  const locked = !quota.can_scan;

  let count = "Ready to scan";
  let detail = quota.message;

  if (locked) {
    count = hasPilot
      ? "0 of 1 full scans remaining today"
      : "0 of 1 free preview scans remaining";
    detail = hasPilot
      ? "Pilot daily scan used. Purchase an additional scan credit, or wait for tomorrow’s reset."
      : "Free preview used. Get Pilot for 1 full scan/day, or purchase an additional scan credit.";
  } else if (hasPilot && pilotRemaining > 0) {
    count =
      prepaid > 0
        ? `${pilotRemaining} of 1 Pilot today · +${prepaid} credit${prepaid === 1 ? "" : "s"}`
        : `${pilotRemaining} of 1 full scans remaining today`;
    detail = "Pilot · full report included";
  } else if (hasPilot && prepaid > 0) {
    count = `${prepaid} paid full-scan credit${prepaid === 1 ? "" : "s"} ready`;
    detail = "Today's Pilot scan used · credits still available";
  } else if (!hasPilot && freeRemaining > 0) {
    count = `${freeRemaining} of 1 free preview scans remaining (lifetime)`;
    detail = "Preview scan · upgrade to Pilot for daily full scans";
  } else if (prepaid > 0) {
    count = `${prepaid} paid full-scan credit${prepaid === 1 ? "" : "s"} ready`;
  }

  return (
    <div
      className={`flex flex-col gap-3 rounded-xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${
        locked
          ? "border-amber/40 bg-amber/10"
          : "border-accent/25 bg-accent/8"
      }`}
    >
      <div className="min-w-0">
        <p
          className={`text-sm font-semibold ${
            locked ? "text-amber" : "text-text"
          }`}
        >
          {count}
        </p>
        {detail ? (
          <p className="mt-0.5 text-xs text-text-muted">{detail}</p>
        ) : null}
      </div>
      {locked ? (
        <div className="flex shrink-0 flex-wrap gap-2">
          {!hasPilot ? (
            <Link
              href="/subscribe?next=/scanner"
              className="inline-flex min-h-11 items-center justify-center rounded-lg bg-accent px-3 text-sm font-medium text-white"
            >
              Get Pilot
            </Link>
          ) : null}
          <button
            type="button"
            onClick={onBuyExtraScan}
            disabled={buying || !onBuyExtraScan}
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-amber/50 bg-surface px-3 text-sm font-medium text-text disabled:opacity-60"
          >
            {buying ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Opening…
              </>
            ) : (
              `Purchase scan credit`
            )}
          </button>
        </div>
      ) : null}
    </div>
  );
}
