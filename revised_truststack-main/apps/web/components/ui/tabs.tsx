"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

export interface TabDef {
  id: string;
  label: ReactNode;
  /** A small count or marker after the label ("3", "Due"). */
  badge?: ReactNode;
  /** Draws the badge in the warning colour — something here needs action. */
  attention?: boolean;
  /** Draws the badge in the success colour — this part is complete. */
  done?: boolean;
  content: ReactNode;
  /** Omit the tab entirely (e.g. a section the role cannot see). */
  hidden?: boolean;
}

/**
 * Tabs for a long detail page (Slice 10.5 Stage B0) — a breach: Timeline ·
 * Documents · Actions · Details — instead of one endless page. The first tab
 * is the one that needs action.
 *
 * Every panel stays mounted (hidden when not chosen), so a half-filled form
 * survives a tab switch. The chosen tab is kept in the URL hash
 * (`#documents`), so a link or a reload lands on it. Arrow keys move between
 * tabs (WAI-ARIA tabs pattern). Test ids: `tab-{id}` and `tabpanel-{id}`.
 *
 * Pass `value` and `onValueChange` to drive it from outside (Back / Next
 * buttons — `<SteppedTabs>`); otherwise it keeps its own state.
 */
export function Tabs({
  tabs,
  label,
  testId,
  value,
  onValueChange,
  variant = "underline",
}: {
  tabs: TabDef[];
  label: string;
  testId?: string;
  value?: string;
  onValueChange?: (id: string) => void;
  /** "steps": a wrapping row of pills — every step stays in view (a questionnaire's sections). */
  variant?: "underline" | "steps";
}) {
  const visible = tabs.filter((t) => !t.hidden);
  const [own, setOwn] = useState(visible[0]?.id ?? "");
  const active = value ?? own;
  const setActive = (id: string) => {
    setOwn(id);
    onValueChange?.(id);
  };
  const base = useId();
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    const fromHash = window.location.hash.slice(1);
    if (fromHash && visible.some((t) => t.id === fromHash)) setActive(fromHash);
    // Only on first render: the hash is an entry point, not a live binding.
  }, []);

  const current = visible.some((t) => t.id === active) ? active : (visible[0]?.id ?? "");

  function choose(id: string, focus = false) {
    setActive(id);
    if (typeof window !== "undefined") window.history.replaceState(null, "", `#${id}`);
    if (focus) refs.current[id]?.focus();
  }

  function onKeyDown(e: KeyboardEvent<HTMLButtonElement>, index: number) {
    const move = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (e.key === "Home" || e.key === "End") {
      e.preventDefault();
      choose(visible[e.key === "Home" ? 0 : visible.length - 1]!.id, true);
    } else if (move) {
      e.preventDefault();
      choose(visible[(index + move + visible.length) % visible.length]!.id, true);
    }
  }

  return (
    <div data-testid={testId} className="space-y-4">
      <div
        role="tablist"
        aria-label={label}
        className={variant === "steps" ? "flex flex-wrap gap-2" : "ts-scroll flex gap-1 overflow-x-auto border-b border-line"}
      >
        {visible.map((t, i) => {
          const selected = t.id === current;
          return (
            <button
              key={t.id}
              ref={(el) => {
                refs.current[t.id] = el;
              }}
              type="button"
              role="tab"
              id={`${base}-tab-${t.id}`}
              aria-controls={`${base}-panel-${t.id}`}
              aria-selected={selected}
              tabIndex={selected ? 0 : -1}
              data-testid={`tab-${t.id}`}
              onClick={() => choose(t.id)}
              onKeyDown={(e) => onKeyDown(e, i)}
              className={
                variant === "steps"
                  ? `flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-sm font-medium ${
                      selected ? "border-brand-navy bg-brand-navy text-white" : "border-line-strong bg-surface text-ink-soft hover:border-brand-blue hover:text-ink"
                    }`
                  : `-mb-px flex shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium ${
                      selected ? "border-brand-navy text-brand-navy" : "border-transparent text-ink-soft hover:border-line-strong hover:text-ink"
                    }`
              }
            >
              {t.label}
              {t.badge !== undefined && t.badge !== null && (
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[11px] font-semibold ${
                    t.attention ? "bg-warning-light text-warning-text" : t.done ? "bg-success-light text-success-text" : "bg-surface-subtle text-ink-soft"
                  }`}
                >
                  {t.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
      {visible.map((t) => (
        <div
          key={t.id}
          role="tabpanel"
          id={`${base}-panel-${t.id}`}
          aria-labelledby={`${base}-tab-${t.id}`}
          data-testid={`tabpanel-${t.id}`}
          hidden={t.id !== current}
          className="space-y-6"
        >
          {t.content}
        </div>
      ))}
    </div>
  );
}
