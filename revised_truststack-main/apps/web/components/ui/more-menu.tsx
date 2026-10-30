"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";

/**
 * "More" (Slice 10.5 Batch B3, F3.3): the page keeps ONE primary action and
 * puts the rest behind this. A native disclosure (`<details>`), so the
 * keyboard works without help — Tab to it, Enter or Space opens it, Tab walks
 * the items, Escape closes it — and every item stays in the page (behind its
 * own `<Can>`), so a hidden permission is still hidden, not just folded away.
 * A click outside closes it.
 */
export function MoreMenu({ label = "More", testId, children }: { label?: string; testId?: string; children: ReactNode }) {
  const ref = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (ref.current?.open && !ref.current.contains(e.target as Node)) ref.current.open = false;
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && ref.current?.open) {
        ref.current.open = false;
        ref.current.querySelector("summary")?.focus();
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <details ref={ref} data-testid={testId} className="group relative">
      <summary
        data-testid={testId ? `${testId}-toggle` : undefined}
        className="flex cursor-pointer list-none items-center gap-1 rounded-md border border-line-strong bg-surface px-3 py-1.5 text-ink hover:bg-surface-muted [&::-webkit-details-marker]:hidden"
      >
        {label}
        <ChevronDown aria-hidden="true" className="h-4 w-4 text-ink-muted transition-transform group-open:rotate-180" />
      </summary>
      <div className="absolute left-0 z-30 mt-1 flex min-w-56 flex-col overflow-hidden rounded-lg border border-line bg-surface py-1 text-ink shadow-card-hover [&>*]:block [&>*]:px-3 [&>*]:py-2 [&>*:hover]:bg-surface-muted">
        {children}
      </div>
    </details>
  );
}
