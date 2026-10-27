"use client";

import { A11yToolbar } from "./A11yToolbar";
import { ReadingModeToggle } from "./ReadingModeToggle";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

/** Shared settings controls used in the account island and guest settings menu. */
export function SettingsPanel({ up = false }: { up?: boolean }) {
  // Nested menus open the opposite way of the settings panel so they stay inside
  // the visible panel instead of spilling past the viewport edge.
  const nestedUp = !up;

  return (
    <div className="min-w-0 space-y-3">
      <div className="min-w-0 space-y-1.5">
        <p className="px-1 text-xs font-medium text-text-muted">Easy read</p>
        <ReadingModeToggle full />
      </div>

      <div className="flex min-w-0 items-center justify-between gap-2 rounded-lg border border-line bg-glass/40 px-3 py-2">
        <span className="shrink-0 text-sm font-medium text-text">Language</span>
        <div className="min-w-0 shrink">
          <LanguageSwitcher up={nestedUp} />
        </div>
      </div>

      <div className="flex min-w-0 items-center justify-between gap-2 rounded-lg border border-line bg-glass/40 px-3 py-2">
        <div className="min-w-0 flex-1 pr-1">
          <p className="truncate text-sm font-medium text-text">Accessibility</p>
          <p className="truncate text-label leading-normal text-text-faint">
            Text size, contrast, more
          </p>
        </div>
        <A11yToolbar up={nestedUp} className="shrink-0" />
      </div>
    </div>
  );
}
