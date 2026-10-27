"use client";

import { Sparkles } from "lucide-react";
import { cn } from "@/lib/cn";
import { useReadingMode } from "./ReadingMode";

/**
 * The "Easy read" switch. One clear, labelled control that flips the whole site
 * between the normal (technical) copy and plain-language "easy" copy. Rendered
 * in the header (desktop) and the mobile drawer.
 */
export function ReadingModeToggle({
  className,
  full = false,
}: {
  className?: string;
  full?: boolean;
}) {
  const { easy, toggle } = useReadingMode();

  return (
    <button
      type="button"
      role="switch"
      aria-checked={easy}
      onClick={toggle}
      title={
        easy
          ? "Easy read is ON - showing plain, simple language"
          : "Turn on Easy read - plain, simple language"
      }
      aria-label="Easy read mode: turns technical pages into plain, simple language"
      className={cn(
        "group inline-flex h-10 shrink-0 select-none items-center gap-2 rounded-pill border px-3 text-sm font-semibold transition-colors",
        full && "h-11 w-full justify-between px-4",
        easy
          ? "border-accent/50 bg-accent/10 text-accent"
          : "border-line bg-glass text-text-muted hover:border-accent/40 hover:text-text",
        className
      )}
    >
      <span className="inline-flex items-center gap-2">
        <Sparkles
          className={cn(
            "h-4 w-4 transition-colors",
            easy ? "text-accent" : "text-text-faint group-hover:text-accent"
          )}
        />
        Easy read
      </span>
      <span
        aria-hidden
        className={cn(
          "grid h-5 min-w-[2.4rem] place-items-center rounded-pill px-1.5 text-label font-bold uppercase tracking-wide transition-colors",
          easy ? "bg-accent" : "bg-surface-2 text-text-faint"
        )}
        style={easy ? { color: "var(--on-accent)" } : undefined}
      >
        {easy ? "On" : "Off"}
      </span>
    </button>
  );
}
