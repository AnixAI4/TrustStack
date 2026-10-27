"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Tooltip({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span className={cn("group/tip relative inline-flex", className)}>
      {children}
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-[calc(100%+6px)] left-1/2 z-50 w-max max-w-[220px] -translate-x-1/2 rounded-md border border-line bg-surface px-2.5 py-1.5 text-center text-label leading-snug text-text-muted opacity-0 shadow-lg transition-opacity duration-150 group-hover/tip:opacity-100 group-focus-within/tip:opacity-100"
      >
        {label}
        <span
          aria-hidden
          className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-surface"
        />
      </span>
    </span>
  );
}
