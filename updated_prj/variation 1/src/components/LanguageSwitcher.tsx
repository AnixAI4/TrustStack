"use client";

import { useEffect, useLayoutEffect, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Check, ChevronDown } from "lucide-react";
import { setLocale } from "@/i18n/locale-actions";
import {
  locales,
  localeNames,
  localeEnglishNames,
  isRTL,
  type Locale,
} from "@/i18n/locales";
import { cn } from "@/lib/cn";
import {
  placeAnchoredMenu,
  type AnchoredMenuStyle,
} from "@/lib/anchored-menu";

/**
 * Language picker for all 23 supported languages.
 *
 * - The trigger shows the active language's own name, e.g. "English", "हिन्दी".
 * - The dropdown lists every language in its own native script (scrollable).
 * - Selecting one stores the choice in a cookie (server action) and refreshes
 *   the route so server components re-render in the new language - no full page
 *   reload and no URL change.
 * - Menu is portaled to `document.body` and clamped to the viewport so nested
 *   settings panels never clip it. Pass `up` to prefer opening upwards.
 */
export function LanguageSwitcher({
  className,
  up = false,
}: {
  className?: string;
  up?: boolean;
}) {
  const t = useTranslations("language_switcher");
  const active = useLocale() as Locale;
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [pos, setPos] = useState<AnchoredMenuStyle | null>(null);
  const [canPortal, setCanPortal] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setCanPortal(true);
  }, []);

  useLayoutEffect(() => {
    if (!open || !btnRef.current) return;
    const update = () => {
      if (!btnRef.current) return;
      setPos(
        placeAnchoredMenu(btnRef.current.getBoundingClientRect(), {
          preferUp: up,
          maxHeightCap: 384,
          width: Math.min(240, window.innerWidth - 16),
        }),
      );
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open, up]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      const target = e.target as Node;
      if (rootRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const select = (next: Locale) => {
    setOpen(false);
    if (next === active) return;
    startTransition(async () => {
      await setLocale(next);
      router.refresh();
    });
  };

  const menu =
    open &&
    pos &&
    canPortal &&
    createPortal(
      <div
        ref={menuRef}
        role="listbox"
        aria-label={t("choose")}
        tabIndex={-1}
        data-i18n-ignore
        data-anchored-menu
        style={{
          position: "fixed",
          top: pos.top,
          bottom: pos.bottom,
          right: pos.right,
          maxHeight: pos.maxHeight,
          width: pos.width,
          zIndex: 200,
        }}
        className="overflow-y-auto overscroll-contain rounded-xl border border-line bg-bg-2 p-1.5 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.6)]"
      >
        {locales.map((l) => {
          const isActive = l === active;
          return (
            <button
              key={l}
              type="button"
              role="option"
              aria-selected={isActive}
              lang={l}
              dir={isRTL(l) ? "rtl" : "ltr"}
              onClick={() => select(l)}
              className={cn(
                "flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-start transition-colors",
                isActive
                  ? "bg-surface-2 text-accent"
                  : "text-text-muted hover:bg-surface-2 hover:text-text",
              )}
            >
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-medium leading-tight">
                  {localeNames[l]}
                </span>
                <span className="truncate text-label leading-tight text-text-faint">
                  {localeEnglishNames[l]}
                </span>
              </span>
              <span className="flex shrink-0 items-center gap-2">
                <span className="font-mono text-label uppercase tracking-wide text-text-faint">
                  {l}
                </span>
                {isActive && <Check className="h-4 w-4" />}
              </span>
            </button>
          );
        })}
      </div>,
      document.body,
    );

  return (
    <div ref={rootRef} data-i18n-ignore className={cn("relative", className)}>
      <button
        ref={btnRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t("label")}
        title={t("label")}
        disabled={pending}
        onClick={() => setOpen((v) => !v)}
        className="flex max-w-full items-center gap-1.5 rounded-pill border border-line bg-glass px-2.5 py-2 text-sm font-medium text-text-muted transition-colors hover:text-text disabled:opacity-60 sm:px-3"
      >
        <span
          lang={active}
          dir={isRTL(active) ? "rtl" : "ltr"}
          className="truncate"
        >
          {localeNames[active]}
        </span>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 shrink-0 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
      {menu}
    </div>
  );
}
