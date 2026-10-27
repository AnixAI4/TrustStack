"use client";

import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { BreadcrumbNav } from "./BreadcrumbNav";
import type { Crumb } from "@/components/sections/PageHero";

// The breadcrumb stays tucked away as a discoverable "handle" (a small tab
// showing the current page) and only reveals the full trail when the user
// hovers it, tabs into a crumb (:focus-within), OR just after the route changes
// - it flashes open briefly on navigation, then quietly collapses again. The
// revealed trail is overlaid absolutely so page content below never shifts.
export function BreadcrumbBar({ items }: { items: Crumb[] }) {
  // A stable key that changes whenever the crumb set (i.e. the route) changes.
  const revealKey = items.map((c) => `${c.href}:${c.label}`).join("|");
  const [peek, setPeek] = useState(true);

  useEffect(() => {
    // Reveal on mount and on every route change, then auto-collapse.
    setPeek(true);
    const t = setTimeout(() => setPeek(false), 3200);
    return () => clearTimeout(t);
  }, [revealKey]);

  // Show breadcrumb navigation on every screen, including the homepage (which
  // renders a single "Home" crumb). Only skip when there is nothing at all.
  if (items.length === 0) return null;

  const current = items[items.length - 1]?.label ?? "";

  return (
    <div className="site-breadcrumb-sticky group sticky z-30">
      {/* Resting state: a discoverable handle showing the current page. Fades
          out while the full trail is revealed (hover / focus / route change). */}
      <div
        className={`flex h-7 items-center justify-center border-b border-line bg-bg-2/90 backdrop-blur-sm transition-opacity duration-200 ${
          peek
            ? "opacity-0"
            : "opacity-100 group-hover:opacity-0 group-focus-within:opacity-0"
        }`}
      >
        <span className="inline-flex max-w-[70vw] items-center gap-1 rounded-pill border border-line bg-surface px-2.5 py-0.5 text-[0.7rem] font-medium text-text-muted shadow-sm">
          <ChevronDown className="h-3 w-3 shrink-0 text-text-faint" aria-hidden />
          <span className="min-w-0 truncate">{current}</span>
        </span>
      </div>

      {/* The full breadcrumb - overlaid so revealing it never pushes page
          content down. Shown on hover, keyboard focus, or briefly after a route
          change. */}
      <div
        className={`absolute inset-x-0 top-0 border-b border-line bg-bg-2/95 shadow-card backdrop-blur-sm transition-all duration-200 group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:translate-y-0 group-focus-within:opacity-100 ${
          peek
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none -translate-y-1 opacity-0"
        }`}
      >
        <div className="container-x py-2.5">
          <BreadcrumbNav items={items} />
        </div>
      </div>
    </div>
  );
}
