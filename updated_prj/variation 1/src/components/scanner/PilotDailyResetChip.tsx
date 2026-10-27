"use client";

import { useEffect, useRef, useState } from "react";
import { Clock } from "lucide-react";

function formatCountdown(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) {
    return `${h}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
  }
  return `${m}m ${String(s).padStart(2, "0")}s`;
}

function formatUnlockLocal(iso: string): string {
  try {
    return new Date(iso).toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return new Date(iso).toLocaleString();
  }
}

/** Compact Pilot daily-reset countdown - lives beside scan history, not in the quota banner. */
export function PilotDailyResetChip({
  targetISO,
  onExpire,
}: {
  targetISO: string;
  onExpire?: () => void;
}) {
  const [now, setNow] = useState(() => Date.now());
  const [expired, setExpired] = useState(false);
  const expireFired = useRef(false);

  useEffect(() => {
    setExpired(false);
    expireFired.current = false;
    const tick = () => {
      const t = Date.now();
      setNow(t);
      if (t >= new Date(targetISO).getTime()) setExpired(true);
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [targetISO]);

  useEffect(() => {
    if (!expired || expireFired.current) return;
    expireFired.current = true;
    onExpire?.();
  }, [expired, onExpire]);

  const remaining = Math.max(0, new Date(targetISO).getTime() - now);

  if (expired || remaining <= 0) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-green/35 bg-green/10 px-3 py-2.5 text-xs text-green">
        <Clock className="h-3.5 w-3.5 shrink-0" />
        <span className="font-medium">Daily Pilot scan unlocked</span>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-line bg-surface-2/50 px-3 py-2.5">
      <div className="flex items-center gap-2 text-text-muted">
        <Clock className="h-3.5 w-3.5 shrink-0 text-accent" />
        <span className="text-[0.65rem] font-semibold uppercase tracking-[0.14em]">
          Next daily scan
        </span>
      </div>
      <p className="mt-1.5 font-mono text-sm font-semibold tabular-nums tracking-tight text-text">
        {formatCountdown(remaining)}
      </p>
      <p className="mt-0.5 text-[11px] text-text-faint">
        {formatUnlockLocal(targetISO)} IST
      </p>
    </div>
  );
}
