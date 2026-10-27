"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Scale, Lightbulb, Gavel, Eye } from "lucide-react";
import type { Scenario } from "@/content/curriculum";

/**
 * Applied-learning scenario. The situation is shown up front; the learner is
 * prompted to make their own call before revealing the analysis and the verdict.
 * Predict-then-reveal is a stronger learning loop than passively reading the
 * answer.
 */
export function ScenarioChallenge({ scenario }: { scenario: Scenario }) {
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-gradient-to-br from-surface-2/60 to-bg-2">
      <div className="flex items-center gap-3 border-b border-line bg-glass px-6 py-4 sm:px-8">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-accent/30 bg-accent/10 text-accent">
          <Scale className="h-4 w-4" />
        </span>
        <div>
          <div className="font-mono text-label uppercase tracking-wider text-accent/80">
            Make the call
          </div>
          <h3 className="font-display text-lg font-semibold text-text">{scenario.title}</h3>
        </div>
      </div>

      <div className="p-6 sm:p-8">
        <div className="font-mono text-label uppercase tracking-wider text-text-faint">
          The situation
        </div>
        <p className="mt-2.5 text-base leading-relaxed text-text">{scenario.situation}</p>

        {!revealed ? (
          <div className="mt-6 flex flex-col gap-4 rounded-xl border border-dashed border-line bg-glass p-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="inline-flex items-center gap-2.5 text-sm text-text-muted">
              <Lightbulb className="h-4 w-4 shrink-0 text-accent" />
              Decide what the Act requires here - then check yourself.
            </p>
            <button
              type="button"
              onClick={() => setRevealed(true)}
              className="btn btn-accent shrink-0"
            >
              <Eye className="h-4 w-4" /> Reveal the verdict
            </button>
          </div>
        ) : (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: [0.22, 0.61, 0.36, 1] }}
              className="mt-6 space-y-4"
            >
              <div className="rounded-xl border border-line bg-bg-2/60 p-5">
                <div className="flex items-center gap-2 font-mono text-label uppercase tracking-wider text-text-faint">
                  <Scale className="h-3.5 w-3.5 text-text-faint" /> The analysis
                </div>
                <p className="mt-2.5 text-sm leading-relaxed text-text-muted">
                  {scenario.analysis}
                </p>
              </div>

              <div className="rounded-xl border border-accent/30 bg-accent/[0.06] p-5">
                <div className="flex items-center gap-2 font-mono text-label uppercase tracking-wider text-accent-soft">
                  <Gavel className="h-3.5 w-3.5" /> The verdict
                </div>
                <p className="mt-2.5 leading-relaxed text-text">{scenario.lesson}</p>
              </div>
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
