"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { createPortal } from "react-dom";
import { Settings } from "lucide-react";
import { cn } from "@/lib/cn";
import {
  placeAnchoredMenu,
  type AnchoredMenuStyle,
} from "@/lib/anchored-menu";
import { SettingsPanel } from "./SettingsPanel";

/** Guest-only settings trigger (logged-in users use the account island). */
export function SiteSettingsMenu({
  className,
  up = false,
}: {
  className?: string;
  up?: boolean;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<AnchoredMenuStyle | null>(null);
  const [canPortal, setCanPortal] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setCanPortal(true);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useLayoutEffect(() => {
    if (!open || !btnRef.current) return;
    const update = () => {
      if (!btnRef.current) return;
      const width = Math.min(320, window.innerWidth - 16);
      setPos(
        placeAnchoredMenu(btnRef.current.getBoundingClientRect(), {
          preferUp: up,
          maxHeightCap: 480,
          width,
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
      const target = e.target as Node | null;
      if (!target) return;
      if (target instanceof Element && target.closest("[data-anchored-menu]")) {
        return;
      }
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

  const panel =
    open &&
    pos &&
    canPortal &&
    createPortal(
      <div
        ref={menuRef}
        role="dialog"
        aria-label="Site settings"
        data-anchored-menu
        style={{
          position: "fixed",
          top: pos.top,
          bottom: pos.bottom,
          right: pos.right,
          width: pos.width,
          maxHeight: pos.maxHeight,
          zIndex: 200,
        }}
        className="overflow-y-auto overscroll-contain rounded-xl border border-line bg-bg-2 p-3 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.45)]"
      >
        <p className="px-1 font-mono text-label uppercase tracking-[0.18em] text-text-faint">
          Settings
        </p>
        <div className="mt-3">
          <SettingsPanel up={up} />
        </div>
      </div>,
      document.body,
    );

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Site settings"
        aria-expanded={open}
        aria-haspopup="dialog"
        title="Settings - easy read, language, accessibility"
        className={cn(
          "inline-flex h-9 items-center gap-1.5 rounded-pill border border-line bg-glass px-2.5 text-sm font-medium text-text-muted transition-colors hover:border-accent/50 hover:text-text",
          open && "border-accent/50 text-accent"
        )}
      >
        <Settings className="h-[18px] w-[18px] shrink-0" />
        <span>Settings</span>
      </button>
      {panel}
    </div>
  );
}
