"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X, Lightbulb, ArrowUpRight, Zap } from "lucide-react";
import type { RiskExplainer } from "@/content/risk-explainers";
import { cn } from "@/lib/cn";

/**
 * "Dee" - the static DPDP guide mascot.
 *
 * A friendly-but-mature support robot (visor face, headphones, antenna) drawn
 * inline as SVG so it themes with the site accent and needs no image asset.
 */
export function GuideMascot({
  className,
  size = 40,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label="Dee, the DPDP guide"
    >
      <defs>
        <linearGradient id="dee-head" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--amber)" />
          <stop offset="1" stopColor="var(--accent)" />
        </linearGradient>
      </defs>
      {/* antenna */}
      <line x1="32" y1="6" x2="32" y2="15" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="32" cy="5" r="3" fill="var(--accent)" />
      {/* headphone cups */}
      <rect x="7" y="27" width="7" height="14" rx="3.5" fill="#20252f" />
      <rect x="50" y="27" width="7" height="14" rx="3.5" fill="#20252f" />
      {/* head */}
      <rect x="13" y="15" width="38" height="35" rx="13" fill="url(#dee-head)" />
      {/* visor / face plate */}
      <rect x="18" y="21" width="28" height="22" rx="10" fill="#141821" />
      {/* eyes */}
      <rect x="25" y="28" width="4.2" height="8.5" rx="2.1" fill="#fff" />
      <rect x="34.8" y="28" width="4.2" height="8.5" rx="2.1" fill="#fff" />
      {/* smile */}
      <path
        d="M27 39.5 q5 3.6 10 0"
        fill="none"
        stroke="var(--amber)"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function Bubble({
  side,
  delay = 0,
  reduce,
  children,
}: {
  side: "guide" | "user";
  delay?: number;
  reduce: boolean | null;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.28, delay }}
      className={cn(
        "flex w-full",
        side === "user" ? "justify-end" : "justify-start",
      )}
    >
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
          side === "guide"
            ? "rounded-tl-sm border border-line bg-surface-2 text-text"
            : "rounded-tr-sm bg-accent/15 text-text",
        )}
      >
        {children}
      </div>
    </motion.div>
  );
}

/**
 * Static chat-style helper panel, docked in the corner like a chat window.
 * Reads a pre-written explanation and example from `RISK_EXPLAINERS` - no
 * network, no LLM, no tokens. "Need an example" is a button that reveals a
 * second, equally-static message (no simulated typing).
 */
export function RiskGuideModal({
  open,
  explainer,
  questionNumber,
  onClose,
}: {
  open: boolean;
  explainer: RiskExplainer | null;
  questionNumber: number;
  onClose: () => void;
}) {
  const reduce = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  // Keep the last non-null explainer so the exit animation still has content.
  const [data, setData] = useState<RiskExplainer | null>(explainer);
  const [num, setNum] = useState(questionNumber);
  const [showExample, setShowExample] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (explainer) {
      setData(explainer);
      setNum(questionNumber);
    }
  }, [explainer, questionNumber]);

  // Reset the example reveal whenever a different question is opened.
  useEffect(() => {
    if (open) setShowExample(false);
  }, [open, questionNumber]);

  // Escape to close. This is a docked chat panel (not a modal), so the page
  // stays interactive and scrollable underneath - no body-scroll lock.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const id = window.setTimeout(() => closeRef.current?.focus(), 60);
    return () => {
      document.removeEventListener("keydown", onKey);
      window.clearTimeout(id);
    };
  }, [open, onClose]);

  // Auto-scroll the chat to the newest message.
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [showExample]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && data && (
        <motion.div
          className="pointer-events-none fixed inset-0 z-[70] flex items-end justify-end p-4 sm:p-6"
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          role="presentation"
        >
          <motion.div
            role="dialog"
            aria-labelledby="risk-guide-title"
            initial={reduce ? false : { opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 20, scale: 0.96 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="pointer-events-auto flex max-h-[min(78vh,620px)] w-[min(400px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-line bg-bg-2/95 shadow-[0_24px_70px_-20px_rgba(0,0,0,0.7)] backdrop-blur-xl"
          >
            {/* header */}
            <div className="flex items-center gap-3 border-b border-line bg-surface-2/60 px-4 py-3">
              <div className="relative grid h-11 w-11 shrink-0 place-items-center rounded-full border border-accent/40 bg-accent/10">
                <GuideMascot size={34} />
                <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-bg-2 bg-green-soft" />
              </div>
              <div className="min-w-0">
                <div
                  id="risk-guide-title"
                  className="flex items-center gap-1.5 font-display text-base font-semibold text-text"
                >
                  TrustStack AI
                </div>
                <div className="truncate text-xs text-text-muted">
                  Your DPDP guide · plain-English help
                </div>
              </div>
              <button
                ref={closeRef}
                type="button"
                onClick={onClose}
                aria-label="Close guide"
                className="ml-auto grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-line text-text-muted transition-colors hover:bg-surface-2 hover:text-text"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* chat body */}
            <div
              ref={scrollRef}
              className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-contain px-4 py-4"
            >
              <div className="mx-auto rounded-pill border border-line bg-surface-2/50 px-3 py-1 font-mono text-label uppercase tracking-wider text-text-faint">
                Question {num} · {data.stage}
              </div>

              <Bubble side="guide" reduce={reduce}>
                <span className="mb-1 block text-xs font-semibold text-accent">
                  In short
                </span>
                {data.gist}
              </Bubble>

              <Bubble side="guide" delay={reduce ? 0 : 0.08} reduce={reduce}>
                {data.explain}
              </Bubble>

              {showExample && (
                <Bubble side="guide" reduce={reduce}>
                  <span className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-accent">
                    <Lightbulb className="h-3.5 w-3.5" />
                    Example
                  </span>
                  {data.example}
                </Bubble>
              )}
            </div>

            {/* footer / actions */}
            <div className="border-t border-line bg-surface-2/40 px-4 py-3">
              {!showExample ? (
                <button
                  type="button"
                  onClick={() => setShowExample(true)}
                  className="flex w-full items-center justify-center gap-2 rounded-pill border border-accent/40 bg-accent/10 px-4 py-2.5 text-sm font-semibold text-accent transition-colors hover:bg-accent/15"
                >
                  <Lightbulb className="h-4 w-4" />
                  Need an example?
                </button>
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <Link
                    href="/framework"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-accent transition-all hover:gap-1.5"
                    onClick={onClose}
                  >
                    See the full 7D framework
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-pill border border-line bg-bg-2 px-4 py-2 text-sm font-semibold text-text-muted transition-colors hover:text-text"
                  >
                    Got it
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
