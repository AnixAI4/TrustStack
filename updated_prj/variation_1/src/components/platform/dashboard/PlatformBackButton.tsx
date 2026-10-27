"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/cn";
import { getPlatformReturnPath } from "@/lib/platform-return";

/** Leaves the platform chrome and returns to the TrustStack page the user came from. */
export function PlatformBackButton({
  className,
  label = "Back to TrustStack",
  compact = false,
}: {
  className?: string;
  label?: string;
  compact?: boolean;
}) {
  const [href, setHref] = useState("/");

  useEffect(() => {
    setHref(getPlatformReturnPath());
  }, []);

  return (
    <Link
      href={href}
      prefetch={false}
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-pill border border-line bg-glass px-2.5 py-1.5 text-sm font-medium text-text-muted transition-colors hover:border-accent/40 hover:text-text",
        className,
      )}
    >
      <ArrowLeft className="h-4 w-4 shrink-0" />
      {!compact && <span className="hidden sm:inline">{label}</span>}
    </Link>
  );
}
