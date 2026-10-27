"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, X } from "lucide-react";
import { EASE } from "@/lib/motion";
import { storageGetItem, storageSetItem } from "@/lib/safe-storage";
import { DpdpExplainerModal } from "./DpdpExplainerModal";

const STORAGE_KEY = "dpdp-know-section-dismissed";

const MARKS = [
  { q: "?", top: "6%", left: "2%", size: "3.4rem", opacity: 0.1, rotate: -12 },
  { q: "?", top: "55%", left: "8%", size: "2.2rem", opacity: 0.08, rotate: 8 },
  { q: "?", top: "16%", left: "17%", size: "1.7rem", opacity: 0.07, rotate: -4 },
  { q: "?", top: "68%", left: "23%", size: "2.8rem", opacity: 0.09, rotate: 14 },
  { q: "?", top: "10%", left: "35%", size: "2.1rem", opacity: 0.065, rotate: -18 },
  { q: "?", top: "60%", left: "41%", size: "1.5rem", opacity: 0.08, rotate: 6 },
  { q: "?", top: "20%", left: "52%", size: "2.6rem", opacity: 0.1, rotate: -8 },
  { q: "?", top: "66%", left: "57%", size: "1.9rem", opacity: 0.07, rotate: 16 },
  { q: "?", top: "8%", left: "68%", size: "1.65rem", opacity: 0.08, rotate: 10 },
  { q: "?", top: "52%", left: "72%", size: "3.2rem", opacity: 0.12, rotate: -6 },
  { q: "?", top: "14%", left: "84%", size: "4.8rem", opacity: 0.14, rotate: 4 },
  { q: "?", top: "62%", left: "88%", size: "2.35rem", opacity: 0.09, rotate: -14 },
  { q: "?", top: "36%", left: "94%", size: "7rem", opacity: 0.16, rotate: -2 },
  { q: "¿", top: "40%", left: "13%", size: "1.8rem", opacity: 0.06, rotate: 20 },
  { q: "؟", top: "32%", left: "47%", size: "1.55rem", opacity: 0.055, rotate: -10 },
  { q: "?", top: "78%", left: "78%", size: "1.4rem", opacity: 0.07, rotate: 22 },
] as const;

/**
 * Compact, dismissible homepage attention band under the nav.
 */
export function DpdpKnowSection() {
  const reduce = useReducedMotion();
  const [visible, setVisible] = useState(false);
  const [explainerOpen, setExplainerOpen] = useState(false);

  useEffect(() => {
    if (!storageGetItem(STORAGE_KEY)) setVisible(true);
  }, []);

  const dismiss = () => {
    storageSetItem(STORAGE_KEY, "1");
    setVisible(false);
  };

  return (
    <>
    <AnimatePresence>
      {visible && (
        <motion.section
          aria-label="Do you know the DPDP Act"
          initial={reduce ? false : { height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={reduce ? undefined : { height: 0, opacity: 0 }}
          transition={{ duration: 0.32, ease: [0.22, 0.61, 0.36, 1] }}
          className="relative overflow-hidden border-b border-accent/25"
        >
          <div className="pointer-events-none absolute inset-0" aria-hidden>
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(105deg, color-mix(in srgb, var(--accent) 22%, var(--bg)) 0%, color-mix(in srgb, var(--amber) 12%, var(--bg-2)) 48%, color-mix(in srgb, var(--accent) 10%, var(--bg)) 100%)",
              }}
            />
            <motion.div
              className="absolute -left-20 top-1/2 h-40 w-40 -translate-y-1/2 rounded-full bg-accent/30 blur-[70px]"
              animate={reduce ? undefined : { opacity: [0.35, 0.75, 0.35], scale: [1, 1.15, 1] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute -right-10 top-0 h-36 w-36 rounded-full bg-amber/25 blur-[60px]"
              animate={reduce ? undefined : { opacity: [0.3, 0.65, 0.3], x: [0, -14, 0] }}
              transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
            />
            {/* sliding sheen */}
            <motion.div
              className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              animate={reduce ? undefined : { left: ["-40%", "120%"] }}
              transition={{
                duration: 3.8,
                repeat: Infinity,
                ease: "easeInOut",
                repeatDelay: 1.8,
              }}
              style={{ left: "-40%" }}
            />
            <div
              className="absolute inset-0"
              style={{
                maskImage:
                  "linear-gradient(90deg, transparent 0%, black 10%, black 90%, transparent 100%), linear-gradient(180deg, transparent 0%, black 15%, black 85%, transparent 100%)",
                WebkitMaskImage:
                  "linear-gradient(90deg, transparent 0%, black 10%, black 90%, transparent 100%), linear-gradient(180deg, transparent 0%, black 15%, black 85%, transparent 100%)",
                maskComposite: "intersect",
                WebkitMaskComposite: "source-in",
              }}
            >
              {MARKS.map((m, i) => (
                <motion.span
                  key={`${m.q}-${i}`}
                  className="absolute select-none font-display font-semibold leading-none text-accent"
                  style={{
                    top: m.top,
                    left: m.left,
                    fontSize: m.size,
                    opacity: m.opacity,
                    transform: `rotate(${m.rotate}deg)`,
                  }}
                  animate={
                    reduce
                      ? undefined
                      : {
                          opacity: [m.opacity * 0.55, m.opacity, m.opacity * 0.55],
                          y: [0, i % 2 === 0 ? -3 : 3, 0],
                        }
                  }
                  transition={
                    reduce
                      ? undefined
                      : {
                          duration: 3.8 + (i % 5) * 0.45,
                          repeat: Infinity,
                          ease: "easeInOut",
                          delay: (i % 7) * 0.22,
                        }
                  }
                >
                  {m.q}
                </motion.span>
              ))}
            </div>
            {/* left accent rail */}
            <span className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-accent via-amber to-accent" />
          </div>

          <div className="container-x relative flex items-center gap-3 py-3.5 pe-11 sm:gap-5 sm:py-4 sm:pe-12">
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: EASE }}
              className="min-w-0 flex-1"
            >
              <p className="inline-flex items-center gap-1.5 font-mono text-[0.65rem] uppercase tracking-[0.16em] text-accent">
                <span className="relative flex h-1.5 w-1.5">
                  <motion.span
                    className="absolute inline-flex h-full w-full rounded-full bg-accent"
                    animate={reduce ? undefined : { opacity: [0.6, 0, 0.6], scale: [1, 2.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                  />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
                </span>
                Quick question
              </p>
              <h2 className="mt-0.5 font-display text-lg font-semibold tracking-tight text-text sm:text-xl">
                Do you know the <span className="text-accent">DPDP Act</span>?
              </h2>
              <p className="mt-0.5 max-w-lg text-xs leading-relaxed text-text-muted sm:text-sm">
                44 sections of India&apos;s data-protection law - as a story, not a statute.
              </p>
              <button
                type="button"
                onClick={() => setExplainerOpen(true)}
                className="group mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-accent"
              >
                Find out in 6 quick slides
                <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
              </button>
            </motion.div>

            {/* Top-right corner dismiss - same place cookie/ad banners put Close. */}
            <button
              type="button"
              onClick={dismiss}
              aria-label="Close this notice"
              title="Close this notice"
              className="absolute end-2 top-2 z-10 inline-flex h-7 w-7 items-center justify-center rounded-md border border-text/20 bg-bg text-text shadow-sm transition-colors hover:border-text/40 hover:bg-surface-2 sm:end-3 sm:top-2.5 sm:h-8 sm:w-8"
            >
              <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={2.75} aria-hidden />
            </button>
          </div>
        </motion.section>
      )}
    </AnimatePresence>
    <DpdpExplainerModal open={explainerOpen} onClose={() => setExplainerOpen(false)} />
    </>
  );
}
