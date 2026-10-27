"use client";

import { useState } from "react";
import { RotateCw, Check } from "lucide-react";
import type { KeyTerm } from "@/content/curriculum";
import { cn } from "@/lib/cn";

/**
 * Flip flashcards for active recall. Each card shows a term; tap to flip it in
 * 3D and reveal the definition. Both faces share one CSS-grid cell so the card
 * height adapts to the taller face automatically.
 */
export function Flashcards({ terms }: { terms: KeyTerm[] }) {
  const [flipped, setFlipped] = useState<Set<number>>(new Set());

  const toggle = (i: number) =>
    setFlipped((prev) => {
      const n = new Set(prev);
      if (n.has(i)) n.delete(i);
      else n.add(i);
      return n;
    });

  const revealed = flipped.size;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="inline-flex items-center gap-2 font-mono text-label uppercase tracking-wider text-text-faint">
          <RotateCw className="h-3.5 w-3.5" /> Tap a card to flip it
        </p>
        <div className="flex items-center gap-3">
          <span className="font-mono text-label text-text-faint">
            {revealed}/{terms.length} revealed
          </span>
          {revealed > 0 && (
            <button
              type="button"
              onClick={() => setFlipped(new Set())}
              className="font-mono text-label uppercase tracking-wider text-accent transition-colors hover:text-accent-soft"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {terms.map((t, i) => {
          const isFlipped = flipped.has(i);
          return (
            <button
              key={t.term}
              type="button"
              onClick={() => toggle(i)}
              aria-pressed={isFlipped}
              aria-label={`${t.term}. ${isFlipped ? t.definition : "Tap to reveal the definition."}`}
              className="group relative text-left [perspective:1400px]"
            >
              <div
                className={cn(
                  "grid transition-transform duration-500 ease-[cubic-bezier(0.22,0.61,0.36,1)] [transform-style:preserve-3d]",
                  isFlipped && "[transform:rotateY(180deg)]"
                )}
              >
                {/* front - the term */}
                <div className="col-start-1 row-start-1 flex min-h-[10rem] flex-col justify-between rounded-2xl border border-line bg-surface-2/40 p-5 [backface-visibility:hidden] transition-colors group-hover:border-accent/40">
                  <span className="inline-flex w-fit items-center gap-1.5 rounded-pill border border-line bg-glass px-2.5 py-1 font-mono text-label uppercase tracking-wider text-text-faint">
                    Term {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="font-display text-xl font-semibold text-text">{t.term}</span>
                  <span className="inline-flex items-center gap-1.5 font-mono text-label uppercase tracking-wider text-accent/80">
                    <RotateCw className="h-3 w-3" /> Reveal definition
                  </span>
                </div>

                {/* back - the definition */}
                <div className="col-start-1 row-start-1 flex min-h-[10rem] flex-col rounded-2xl border border-accent/30 bg-gradient-to-br from-accent/[0.08] to-surface-2/40 p-5 [backface-visibility:hidden] [transform:rotateY(180deg)]">
                  <span className="inline-flex w-fit items-center gap-1.5 font-mono text-label uppercase tracking-wider text-accent-soft">
                    <Check className="h-3 w-3" /> {t.term}
                  </span>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-text">{t.definition}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
