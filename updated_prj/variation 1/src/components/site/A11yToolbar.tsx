"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Accessibility,
  X,
  Type,
  Contrast,
  Sparkles,
  Underline,
  Volume2,
  Square,
  RotateCcw,
  AlignJustify,
  Focus,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { useReadingMode } from "./ReadingMode";
import {
  storageGetJSON,
  storageSetJSON,
} from "@/lib/safe-storage";
import {
  placeAnchoredMenu,
  type AnchoredMenuStyle,
} from "@/lib/anchored-menu";

type Prefs = {
  textSize: 0 | 1 | 2;
  lineSpacing: 0 | 1 | 2;
  contrast: boolean;
  dyslexic: boolean;
  motion: boolean;
  underline: boolean;
  focusMode: boolean;
};

const DEFAULTS: Prefs = {
  textSize: 0,
  lineSpacing: 0,
  contrast: true,
  dyslexic: false,
  motion: false,
  underline: false,
  focusMode: false,
};

// Versioned (-v4) - keep in sync with A11Y_INIT in src/app/layout.tsx.
const STORAGE_KEY = "dpdp-a11y-v4";

// Root font-size multipliers for A / A+ / A++. Scaling the root is what actually
// grows the rem-based Tailwind text-* sizes (see --a11y-text-scale in globals.css).
const TEXT_SCALES = [1, 1.12, 1.25];
const FONT_SIZE_TIPS = [
  "Standard text size (default)",
  "Larger text (112%)",
  "Largest text (125%)",
];

const LINE_SPACING_TIPS = [
  "Default line spacing",
  "Relaxed line spacing",
  "Extra line spacing",
];

function apply(p: Prefs) {
  const el = document.documentElement;
  // Scale the root font size - the only lever that reaches every rem-based
  // text-* utility. (An earlier build set font-size on <main>, which did nothing.)
  el.style.setProperty("--a11y-text-scale", String(TEXT_SCALES[p.textSize] ?? 1));
  el.classList.toggle("a11y-contrast", p.contrast);
  el.classList.toggle("a11y-dyslexic", p.dyslexic);
  el.classList.toggle("a11y-no-motion", p.motion);
  el.classList.toggle("a11y-underline", p.underline);
  el.classList.toggle("a11y-line-relaxed", p.lineSpacing === 1);
  el.classList.toggle("a11y-line-loose", p.lineSpacing === 2);
  el.classList.toggle("a11y-focus-mode", p.focusMode);
}

export function A11yToolbar({
  className,
  up = false,
}: {
  className?: string;
  /** Prefer opening the panel above the trigger when space allows. */
  up?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [prefs, setPrefs] = useState<Prefs>(DEFAULTS);
  const [speaking, setSpeaking] = useState(false);
  const [pos, setPos] = useState<AnchoredMenuStyle | null>(null);
  const [canPortal, setCanPortal] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const { easy, toggle: toggleEasy } = useReadingMode();

  useEffect(() => {
    setCanPortal(true);
  }, []);

  useEffect(() => {
    let p = DEFAULTS;
    const raw = storageGetJSON<Partial<Prefs> | null>(STORAGE_KEY, null);
    if (raw && typeof raw === "object") {
      p = { ...DEFAULTS, ...raw };
      storageSetJSON(STORAGE_KEY, p);
    } else {
      storageSetJSON(STORAGE_KEY, DEFAULTS);
    }
    // Clear any inline font-size left on <main>/<footer> by the previous build
    // (it scaled those elements directly, which never affected the text).
    document
      .querySelectorAll("main, footer")
      .forEach((n) => ((n as HTMLElement).style.fontSize = ""));
    setPrefs(p);
    apply(p);
    return () => {
      if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    };
  }, []);

  useLayoutEffect(() => {
    if (!open || !btnRef.current) return;
    const update = () => {
      if (!btnRef.current) return;
      const width = Math.min(320, window.innerWidth - 16);
      setPos(
        placeAnchoredMenu(btnRef.current.getBoundingClientRect(), {
          preferUp: up,
          maxHeightCap: 448,
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

  // While the panel is open: pull in prefs saved by the other toolbar instance
  // (desktop + mobile menu each mount their own), and allow Escape / outside
  // click to dismiss it.
  useEffect(() => {
    if (!open) return;
    const saved = storageGetJSON<Partial<Prefs> | null>(STORAGE_KEY, null);
    if (saved && typeof saved === "object") {
      setPrefs((prev) => ({ ...prev, ...saved }));
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onPointer = (e: PointerEvent) => {
      const target = e.target as Node;
      if (rootRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  const update = useCallback((patch: Partial<Prefs>) => {
    setPrefs((prev) => {
      const next = { ...prev, ...patch };
      apply(next);
      storageSetJSON(STORAGE_KEY, next);
      return next;
    });
  }, []);

  const reset = () => {
    setPrefs(DEFAULTS);
    apply(DEFAULTS);
    storageSetJSON(STORAGE_KEY, DEFAULTS);
  };

  const readAloud = () => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const nodes = document.querySelectorAll(
      "main h1, main h2, main h3, main p"
    );
    const text = Array.from(nodes)
      .map((n) => (n.textContent || "").trim())
      .filter(Boolean)
      .slice(0, 40)
      .join(". ");
    if (!text) return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-IN";
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
    setSpeaking(true);
  };

  const panel =
    canPortal &&
    createPortal(
      <AnimatePresence>
        {open && pos && (
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            role="dialog"
            aria-label="Accessibility toolbar"
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
            className="overflow-y-auto overscroll-contain rounded-2xl border border-line bg-bg-2 p-5 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.35)]"
          >
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent/15 text-accent">
                <Accessibility className="h-4 w-4" />
              </span>
              <div>
                <div className="text-sm font-semibold text-text">
                  Accessibility
                </div>
                <div className="font-mono text-label uppercase tracking-wider text-text-faint">
                  Inclusion & reading
                </div>
              </div>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={easy}
              onClick={toggleEasy}
              title="Easy read - rewrite technical pages in plain, simple language"
              className={cn(
                "mt-5 flex w-full items-center justify-between gap-3 rounded-xl border px-3.5 py-3 text-left transition-colors",
                easy
                  ? "border-accent/50 bg-accent/10"
                  : "border-line hover:border-accent/40"
              )}
            >
              <span className="flex min-w-0 items-center gap-3">
                <span
                  className={cn(
                    "grid h-8 w-8 shrink-0 place-items-center rounded-lg transition-colors",
                    easy
                      ? "bg-accent/20 text-accent"
                      : "bg-surface-2 text-text-muted"
                  )}
                >
                  <BookOpen className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-text">
                    Easy read
                  </span>
                  <span className="block text-label leading-snug text-text-faint">
                    Plain, simple language across the site
                  </span>
                </span>
              </span>
              <span
                aria-hidden
                className={cn(
                  "grid h-5 min-w-[2.4rem] shrink-0 place-items-center rounded-pill px-1.5 text-label font-bold uppercase tracking-wide transition-colors",
                  easy ? "bg-accent" : "bg-surface-2 text-text-faint"
                )}
                style={easy ? { color: "var(--on-accent)" } : undefined}
              >
                {easy ? "On" : "Off"}
              </span>
            </button>

            <div className="mt-5">
              <div className="mb-2 flex items-center gap-2 text-sm text-text-muted">
                <Type className="h-4 w-4" /> Text size
              </div>
              <div className="grid grid-cols-3 gap-2">
                {["A", "A+", "A++"].map((label, i) => (
                  <button
                    key={label}
                    title={FONT_SIZE_TIPS[i]}
                    onClick={() =>
                      update({ textSize: i as Prefs["textSize"] })
                    }
                    className={cn(
                      "rounded-lg border py-2 text-sm font-semibold transition-all",
                      prefs.textSize === i
                        ? "border-accent/50 bg-accent/10 text-text"
                        : "border-line text-text-muted hover:border-accent/40"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4">
              <div className="mb-2 flex items-center gap-2 text-sm text-text-muted">
                <AlignJustify className="h-4 w-4" /> Line spacing
              </div>
              <div className="grid grid-cols-3 gap-2">
                {["Normal", "Relaxed", "Wide"].map((label, i) => (
                  <button
                    key={label}
                    title={LINE_SPACING_TIPS[i]}
                    onClick={() =>
                      update({ lineSpacing: i as Prefs["lineSpacing"] })
                    }
                    className={cn(
                      "rounded-lg border py-2 text-sm font-semibold transition-all",
                      prefs.lineSpacing === i
                        ? "border-accent/50 bg-accent/10 text-text"
                        : "border-line text-text-muted hover:border-accent/40"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <Toggle
                icon={Contrast}
                label="High contrast"
                on={prefs.contrast}
                onClick={() => update({ contrast: !prefs.contrast })}
              />
              <Toggle
                icon={Sparkles}
                label="Readable font"
                on={prefs.dyslexic}
                onClick={() => update({ dyslexic: !prefs.dyslexic })}
              />
              <Toggle
                icon={Square}
                label="Reduce motion"
                on={prefs.motion}
                onClick={() => update({ motion: !prefs.motion })}
              />
              <Toggle
                icon={Underline}
                label="Underline links"
                on={prefs.underline}
                onClick={() => update({ underline: !prefs.underline })}
              />
              <Toggle
                icon={Focus}
                label="Reading focus"
                on={prefs.focusMode}
                onClick={() => update({ focusMode: !prefs.focusMode })}
              />
            </div>

            <div className="mt-4 flex gap-2">
              <button onClick={readAloud} className="btn btn-accent flex-1 text-sm">
                {speaking ? (
                  <Square className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
                {speaking ? "Stop" : "Read aloud"}
              </button>
              <button
                onClick={reset}
                className="btn btn-ghost text-sm"
                aria-label="Reset accessibility settings"
                title="Reset to default accessibility settings"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>,
      document.body,
    );

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Accessibility options"
        aria-expanded={open}
        title="Accessibility - text size, contrast, and reading options"
        className={cn(
          "grid h-10 w-10 place-items-center rounded-pill border border-line bg-glass text-text-muted transition-colors hover:border-accent/50 hover:text-text",
          open && "border-accent/50 text-accent"
        )}
      >
        {open ? (
          <X className="h-[18px] w-[18px]" />
        ) : (
          <Accessibility className="h-[18px] w-[18px]" />
        )}
      </button>
      {panel}
    </div>
  );
}

function Toggle({
  icon: Icon,
  label,
  on,
  onClick,
}: {
  icon: typeof Contrast;
  label: string;
  on: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      role="switch"
      aria-checked={on}
      className="flex w-full items-center justify-between gap-3 rounded-lg border border-line bg-surface-2/40 px-3 py-2.5 text-left transition-colors hover:border-accent/40"
    >
      <span className="flex items-center gap-2 text-sm text-text">
        <Icon className="h-4 w-4 text-text-muted" />
        {label}
      </span>
      <span
        className={cn(
          "relative h-5 w-9 rounded-full transition-colors",
          on ? "bg-accent" : "bg-line"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform",
            on ? "left-0.5 translate-x-4" : "left-0.5"
          )}
        />
      </span>
    </button>
  );
}
