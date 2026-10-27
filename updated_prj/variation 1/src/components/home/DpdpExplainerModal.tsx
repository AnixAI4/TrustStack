"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, ArrowUpRight, ChevronLeft, Lightbulb, X } from "lucide-react";
import { EASE } from "@/lib/motion";
import { cn } from "@/lib/cn";
import { DPDP_EXPLAINER_SLIDES, type ExplainerSlide } from "@/content/dpdp-explainer";

const COLOR_VAR: Record<ExplainerSlide["colorKey"], string> = {
  accent: "var(--accent-rgb)",
  brand: "var(--brand-rgb)",
  green: "var(--green-rgb)",
  amber: "var(--amber-rgb)",
  red: "var(--red-rgb)",
};

export function DpdpExplainerModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState(1);
  const canPortal = typeof document !== "undefined";
  const total = DPDP_EXPLAINER_SLIDES.length;
  const slide = DPDP_EXPLAINER_SLIDES[index];
  const isLast = index === total - 1;
  const color = `rgb(${COLOR_VAR[slide.colorKey]})`;

  useEffect(() => {
    if (open) setIndex(0);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    document.body.style.overflow = "hidden";
    root.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
      root.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, index]);

  function go(delta: 1 | -1) {
    setDir(delta);
    setIndex((i) => Math.min(total - 1, Math.max(0, i + delta)));
  }

  if (!canPortal) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-2 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label="What is the DPDP Act - a quick explainer"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="absolute inset-0 bg-black/65 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.97 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="relative z-10 flex max-h-[calc(100dvh-1rem)] w-full max-w-[58rem] flex-col overflow-hidden rounded-[1.25rem] border border-line bg-bg-2 shadow-[0_50px_120px_-30px_rgba(0,0,0,0.6)] sm:max-h-[calc(100dvh-2rem)] sm:rounded-[1.5rem]"
          >
            {/* header */}
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-line px-4 py-2.5 sm:px-6 sm:py-3">
              <div className="flex min-w-0 items-center gap-3">
                <div
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border"
                  style={{
                    background: `color-mix(in srgb, ${color} 15%, transparent)`,
                    borderColor: `color-mix(in srgb, ${color} 25%, var(--line))`,
                    color,
                  }}
                >
                  <slide.icon className="h-[1.1rem] w-[1.1rem]" />
                </div>
                <div className="min-w-0">
                  <p className="truncate font-display text-sm font-semibold tracking-tight text-text">
                    DPDP Act, at a glance
                  </p>
                  <p className="truncate text-[0.66rem] font-medium text-text-faint sm:text-xs">
                    {slide.eyebrow} · Plain-English explainer
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-pill border border-line bg-glass text-text-muted transition-colors hover:border-text-faint hover:text-text"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* slide content */}
            <div className="relative min-h-0 flex-1 overflow-y-auto px-4 py-3 sm:px-6 sm:py-4">
              <motion.div
                key={index}
                initial={reduce ? { opacity: 0 } : { opacity: 0, x: dir * 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.28, ease: EASE }}
                className="grid gap-4 min-[500px]:grid-cols-[1.08fr_0.92fr] min-[500px]:items-stretch min-[500px]:gap-5"
              >
                {/* illustration panel */}
                <div
                  className="relative flex min-h-[13rem] flex-col items-center justify-between overflow-hidden rounded-xl border p-4 min-[500px]:min-h-[17.5rem] sm:rounded-2xl sm:p-5"
                  style={{
                    borderColor: `color-mix(in srgb, ${color} 24%, var(--line))`,
                    backgroundColor: `color-mix(in srgb, ${color} 7%, var(--bg))`,
                    backgroundImage: `linear-gradient(color-mix(in srgb, ${color} 8%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in srgb, ${color} 8%, transparent) 1px, transparent 1px)`,
                    backgroundSize: "24px 24px",
                  }}
                >
                  <div
                    className="relative self-start rounded-pill border bg-bg/90 px-2.5 py-1 font-mono text-[0.55rem] uppercase tracking-[0.12em]"
                    style={{
                      borderColor: `color-mix(in srgb, ${color} 24%, var(--line))`,
                      color,
                    }}
                  >
                    India · DPDP 2023
                  </div>

                  <div className="relative my-4 w-full max-w-[17rem]">
                    <div
                      className="rounded-xl border bg-bg/95 p-3 shadow-[0_18px_40px_-28px_rgba(0,0,0,0.65)]"
                      style={{ borderColor: `color-mix(in srgb, ${color} 26%, var(--line))` }}
                    >
                      <div className="flex items-center gap-1.5 border-b border-line pb-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-red/70" />
                        <span className="h-1.5 w-1.5 rounded-full bg-amber/70" />
                        <span className="h-1.5 w-1.5 rounded-full bg-green/70" />
                        <span className="ml-auto h-1.5 w-10 rounded-pill bg-line" />
                      </div>

                      <div className="flex items-center gap-3 py-3">
                        <span
                          className="grid h-12 w-12 shrink-0 place-items-center rounded-xl"
                        style={{
                            background: `color-mix(in srgb, ${color} 16%, transparent)`,
                            color,
                          }}
                        >
                          <slide.icon className="h-6 w-6" />
                        </span>
                        <span className="flex-1 space-y-2" aria-hidden>
                          <span className="block h-2 w-4/5 rounded-pill bg-text/15" />
                          <span className="block h-1.5 w-full rounded-pill bg-text/10" />
                          <span className="block h-1.5 w-2/3 rounded-pill bg-text/10" />
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-1.5">
                        {slide.points.map((point, pointIndex) => (
                          <span
                            key={point.title}
                            className="flex min-w-0 items-center justify-center gap-1 rounded-lg border bg-bg-2 px-1.5 py-2"
                            style={{
                              borderColor: `color-mix(in srgb, ${color} 18%, var(--line))`,
                              color,
                              opacity: 0.72 + pointIndex * 0.12,
                            }}
                          >
                            <point.icon className="h-3.5 w-3.5 shrink-0" />
                          </span>
                        ))}
                      </div>
                    </div>

                    <span
                      aria-hidden
                      className="absolute -bottom-3 left-1/2 h-3 w-4/5 -translate-x-1/2 rounded-b-xl border-x border-b"
                      style={{ borderColor: `color-mix(in srgb, ${color} 18%, var(--line))` }}
                    />
                  </div>

                  <div className="relative flex w-full items-center gap-2">
                    <span
                      className="h-px flex-1"
                      style={{ background: `color-mix(in srgb, ${color} 22%, var(--line))` }}
                    />
                    <p className="max-w-[12rem] text-center text-[0.62rem] font-semibold leading-snug text-text-faint">
                      {slide.eyebrow.split("·")[1]?.trim() ?? "DPDP Act"}
                    </p>
                    <span
                      className="h-px flex-1"
                      style={{ background: `color-mix(in srgb, ${color} 22%, var(--line))` }}
                    />
                  </div>
                </div>

                {/* copy + feature rows */}
                <div className="flex min-w-0 flex-col justify-center">
                  <p className="font-mono text-[0.58rem] uppercase tracking-[0.12em] text-text-faint">
                    About this slide
                  </p>
                  <h3 className="mt-1 font-display text-[1.05rem] font-semibold tracking-tight text-text sm:text-[1.3rem]">
                    {slide.title}
                  </h3>
                  <p className="mt-1.5 text-[0.68rem] leading-[1.5] text-text-muted sm:text-[0.82rem]">{slide.body}</p>

                  <div className="mt-2 divide-y divide-line border-t border-line">
                    {slide.points.map((p) => (
                      <div key={p.title} className="flex items-start gap-2 py-1.5 sm:py-2">
                        <span
                          className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full sm:h-7 sm:w-7"
                          style={{
                            background: `color-mix(in srgb, ${color} 14%, transparent)`,
                            color,
                          }}
                        >
                          <p.icon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                        </span>
                        <div className="min-w-0">
                          <p className="text-[0.68rem] font-semibold text-text sm:text-[0.78rem]">{p.title}</p>
                          <p className="text-[0.61rem] leading-[1.45] text-text-muted sm:text-[0.7rem]">{p.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>

            {/* tip footer */}
            <div className="relative mx-4 flex shrink-0 items-center gap-2.5 overflow-hidden rounded-xl border border-accent/15 bg-accent/8 px-3 py-2 sm:mx-6 sm:px-4 sm:py-2.5">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-accent/15 text-accent">
                <Lightbulb className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0">
                <p className="text-[0.68rem] font-semibold text-accent">Tip</p>
                <p className="text-[0.66rem] leading-relaxed text-text-muted sm:text-xs">{slide.tip}</p>
              </div>
              <svg
                aria-hidden
                viewBox="0 0 120 40"
                className="pointer-events-none ml-auto hidden h-8 w-24 shrink-0 text-accent/25 sm:block"
                fill="none"
              >
                <path
                  d="M2 30 C 30 5, 55 35, 118 10"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeDasharray="4 5"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            {/* controls */}
            <div className="flex shrink-0 items-center justify-between gap-3 px-4 py-2.5 sm:px-6 sm:py-3">
              <div className="flex items-center gap-1.5" aria-label={`Slide ${index + 1} of ${total}`}>
                {DPDP_EXPLAINER_SLIDES.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    aria-label={`Go to slide ${i + 1}`}
                    onClick={() => {
                      setDir(i > index ? 1 : -1);
                      setIndex(i);
                    }}
                    className={cn(
                      "h-1.5 rounded-pill transition-all",
                      i === index ? "w-6 bg-accent" : "w-1.5 bg-line hover:bg-text-faint"
                    )}
                  />
                ))}
              </div>

              <div className="flex items-center gap-2">
                {index > 0 && (
                  <button
                    type="button"
                    onClick={() => go(-1)}
                    aria-label="Previous"
                    className="grid h-9 w-9 place-items-center rounded-pill border border-line bg-glass text-text-muted transition-colors hover:text-text"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                )}
                {isLast ? (
                  <Link
                    href="/act"
                    prefetch={false}
                    onClick={onClose}
                    className="btn btn-accent inline-flex h-9 items-center px-4 text-sm"
                  >
                    Open the Act
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => go(1)}
                    aria-label="Next"
                    className="btn btn-accent inline-flex h-9 items-center justify-center gap-1.5 px-3 text-xs"
                  >
                    <span>Next</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
