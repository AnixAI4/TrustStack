"use client";

import { motion } from "framer-motion";

/**
 * Soft breathing glow behind the active tab's icon/label, signalling
 * "this one is active" without implying a task is progressing.
 * Render as the first child of a `relative` tab button.
 */
export function HeroTabGlow({
  colorVar,
  reduce,
}: {
  colorVar: string;
  reduce: boolean;
}) {
  return (
    <motion.span
      aria-hidden="true"
      className="pointer-events-none absolute inset-0"
      style={{
        background: `radial-gradient(ellipse at center, rgb(${colorVar} / 0.16), transparent 70%)`,
      }}
      initial={{ opacity: 0.35 }}
      animate={reduce ? { opacity: 0.35 } : { opacity: [0.2, 0.5, 0.2] }}
      transition={
        reduce ? undefined : { duration: 2.4, repeat: Infinity, ease: "easeInOut" }
      }
    />
  );
}

/**
 * Slideshow-style position dots below an auto-rotating tab row.
 * Reads as "content rotates" rather than "a process is loading".
 */
export function HeroRotationDots({
  count,
  active,
  onSelect,
  getColorVar,
  label = "Show item",
}: {
  count: number;
  active: number;
  onSelect: (index: number) => void;
  getColorVar: (index: number) => string;
  label?: string;
}) {
  if (count < 2) return null;
  return (
    <div className="flex items-center justify-center gap-2 py-3" aria-hidden="true">
      {Array.from({ length: count }, (_, index) => {
        const selected = index === active;
        return (
          <button
            key={index}
            type="button"
            tabIndex={-1}
            onClick={() => onSelect(index)}
            aria-label={`${label} ${index + 1}`}
            className="grid h-4 w-4 place-items-center"
          >
            <span
              className="rounded-full transition-all duration-300"
              style={{
                width: selected ? 18 : 6,
                height: 6,
                background: selected
                  ? `rgb(${getColorVar(index)})`
                  : "rgb(var(--text-rgb) / 0.22)",
              }}
            />
          </button>
        );
      })}
    </div>
  );
}
