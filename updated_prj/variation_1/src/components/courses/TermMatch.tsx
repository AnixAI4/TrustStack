"use client";

import { useMemo, useState } from "react";
import { Check, RotateCcw, Sparkles } from "lucide-react";
import { cn } from "@/lib/cn";
import type { MatchSet } from "@/content/course-activities";

/** Deterministic string hash - keeps the shuffled column identical on the
 *  server and the client, avoiding any hydration mismatch. */
function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return h;
}

/**
 * Click-to-match game. Terms sit on the left in order; definitions on the right
 * in a stable shuffled order. Select one from each side - a correct pair locks
 * green, a wrong pair flashes and clears. Finish the set for a small reward.
 */
export function TermMatch({ set }: { set: MatchSet }) {
  const [selTerm, setSelTerm] = useState<number | null>(null);
  const [selDef, setSelDef] = useState<number | null>(null);
  const [matched, setMatched] = useState<Set<number>>(new Set());
  const [wrong, setWrong] = useState<{ t: number; d: number } | null>(null);

  const orderedDefs = useMemo(
    () =>
      set.pairs
        .map((p, i) => ({ def: p.def, i }))
        .sort((a, b) => hash(a.def) - hash(b.def)),
    [set]
  );

  const total = set.pairs.length;
  const complete = matched.size === total;

  const evaluate = (t: number, d: number) => {
    if (t === d) {
      setMatched((m) => {
        const n = new Set(m);
        n.add(t);
        return n;
      });
      setSelTerm(null);
      setSelDef(null);
    } else {
      setWrong({ t, d });
      setSelTerm(null);
      setSelDef(null);
      window.setTimeout(() => setWrong(null), 650);
    }
  };

  const onTerm = (i: number) => {
    if (matched.has(i)) return;
    if (selTerm === i) {
      setSelTerm(null);
      return;
    }
    if (selDef !== null) evaluate(i, selDef);
    else setSelTerm(i);
  };

  const onDef = (d: number) => {
    if (matched.has(d)) return;
    if (selDef === d) {
      setSelDef(null);
      return;
    }
    if (selTerm !== null) evaluate(selTerm, d);
    else setSelDef(d);
  };

  const reset = () => {
    setMatched(new Set());
    setSelTerm(null);
    setSelDef(null);
    setWrong(null);
  };

  if (complete) {
    return (
      <div className="flex flex-col items-center gap-5 rounded-2xl border border-green/40 bg-green/[0.07] px-6 py-10 text-center">
        <span className="grid h-14 w-14 place-items-center rounded-2xl border border-green/40 bg-green/15 text-green-soft">
          <Sparkles className="h-7 w-7" />
        </span>
        <div>
          <div className="font-display text-2xl font-semibold text-text">All matched</div>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-text-muted">
            Every term paired with its meaning - that vocabulary is the spine of the whole Act.
          </p>
        </div>
        <button type="button" onClick={reset} className="btn btn-ghost">
          <RotateCcw className="h-4 w-4" /> Shuffle &amp; retry
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <span className="font-mono text-label uppercase tracking-wider text-text-faint">
          Pick a term, then its meaning
        </span>
        <span className="font-mono text-label text-text-faint">
          <span className="text-accent">{matched.size}</span>/{total} matched
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4">
        {/* terms */}
        <div className="grid content-start gap-2.5">
          {set.pairs.map((p, i) => {
            const isMatched = matched.has(i);
            const isSel = selTerm === i;
            const isWrong = wrong?.t === i;
            return (
              <button
                key={p.term}
                type="button"
                disabled={isMatched}
                onClick={() => onTerm(i)}
                className={cn(
                  "rounded-xl border px-3.5 py-3 text-left text-sm font-medium transition-all",
                  isMatched && "border-green/50 bg-green/10 text-text",
                  !isMatched && isSel && "border-accent/60 bg-accent/10 text-text",
                  !isMatched && isWrong && "border-red/60 bg-red/10 text-text",
                  !isMatched && !isSel && !isWrong &&
                    "border-line bg-glass text-text-muted hover:border-accent/40 hover:text-text"
                )}
              >
                <span className="flex items-center gap-2">
                  {isMatched && <Check className="h-3.5 w-3.5 shrink-0 text-green-soft" />}
                  {p.term}
                </span>
              </button>
            );
          })}
        </div>

        {/* definitions (stable shuffled) */}
        <div className="grid content-start gap-2.5">
          {orderedDefs.map(({ def, i }) => {
            const isMatched = matched.has(i);
            const isSel = selDef === i;
            const isWrong = wrong?.d === i;
            return (
              <button
                key={def}
                type="button"
                disabled={isMatched}
                onClick={() => onDef(i)}
                className={cn(
                  "rounded-xl border px-3.5 py-3 text-left text-sm leading-snug transition-all",
                  isMatched && "border-green/50 bg-green/10 text-text",
                  !isMatched && isSel && "border-accent/60 bg-accent/10 text-text",
                  !isMatched && isWrong && "border-red/60 bg-red/10 text-text",
                  !isMatched && !isSel && !isWrong &&
                    "border-line bg-glass text-text-muted hover:border-accent/40 hover:text-text"
                )}
              >
                {def}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
