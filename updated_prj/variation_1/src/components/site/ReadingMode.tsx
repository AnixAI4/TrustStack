"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { storageSetItem } from "@/lib/safe-storage";

export type ReadingMode = "normal" | "easy";

type ReadingModeCtx = {
  mode: ReadingMode;
  easy: boolean;
  setEasy: (value: boolean) => void;
  toggle: () => void;
};

const STORAGE_KEY = "dpdp-reading";

const ReadingModeContext = createContext<ReadingModeCtx | null>(null);

/**
 * Global "Easy read" state. The active mode is mirrored onto
 * `document.documentElement[data-reading]` (also set pre-paint by the anti-FOUC
 * script in layout.tsx) so plain-CSS content swaps - `[data-rm="easy"]` vs
 * `[data-rm="normal"]` - work on server components too, while client components
 * can branch in JS via {@link useReadingMode}. Persisted to localStorage.
 */
export function ReadingModeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mode, setMode] = useState<ReadingMode>("normal");

  // Adopt whatever the anti-FOUC bootstrap already applied to <html> so the
  // toggle button reflects the real state on first mount.
  useEffect(() => {
    const root = document.documentElement;
    const sync = () => {
      const current = root.getAttribute("data-reading");
      if (current === "easy" || current === "normal") setMode(current);
    };
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(root, {
      attributes: true,
      attributeFilter: ["data-reading"],
    });
    return () => observer.disconnect();
  }, []);

  const apply = useCallback((next: ReadingMode) => {
    setMode(next);
    document.documentElement.setAttribute("data-reading", next);
    storageSetItem(STORAGE_KEY, next);
  }, []);

  const setEasy = useCallback(
    (value: boolean) => apply(value ? "easy" : "normal"),
    [apply]
  );

  const toggle = useCallback(
    () => apply(mode === "easy" ? "normal" : "easy"),
    [apply, mode]
  );

  return (
    <ReadingModeContext.Provider
      value={{ mode, easy: mode === "easy", setEasy, toggle }}
    >
      {children}
    </ReadingModeContext.Provider>
  );
}

/**
 * Read the current reading mode. Falls back to a no-op "normal" context when
 * used outside the provider so components never crash.
 */
export function useReadingMode(): ReadingModeCtx {
  const ctx = useContext(ReadingModeContext);
  if (!ctx) {
    return { mode: "normal", easy: false, setEasy: () => {}, toggle: () => {} };
  }
  return ctx;
}
