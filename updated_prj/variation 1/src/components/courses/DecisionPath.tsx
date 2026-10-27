"use client";

import { useState } from "react";
import { ArrowRight, RotateCcw, Check, X, Info, Lightbulb } from "lucide-react";
import { cn } from "@/lib/cn";
import type { DecisionTree, DecisionTone } from "@/content/course-activities";

const TONE: Record<DecisionTone, { ring: string; chip: string; icon: typeof Check }> = {
  yes: { ring: "border-green/40 bg-green/[0.07]", chip: "text-green-soft", icon: Check },
  no: { ring: "border-red/40 bg-red/[0.07]", chip: "text-red-soft", icon: X },
  info: { ring: "border-accent/30 bg-accent/[0.06]", chip: "text-accent", icon: Info },
};

/**
 * An interactive branching decision tool. Each node poses a question; choosing
 * an answer walks to the next node or lands on an outcome. The chosen path is
 * kept as a breadcrumb so the reasoning stays visible, and "Start over" resets.
 */
export function DecisionPath({ tree }: { tree: DecisionTree }) {
  const [nodeId, setNodeId] = useState(tree.start);
  const [trail, setTrail] = useState<string[]>([]);

  const node = tree.nodes.find((n) => n.id === nodeId);
  const outcome = tree.outcomes.find((o) => o.id === nodeId);

  const pick = (label: string, next: string) => {
    setTrail((t) => [...t, label]);
    setNodeId(next);
  };

  const reset = () => {
    setNodeId(tree.start);
    setTrail([]);
  };

  return (
    <div>
      {/* breadcrumb of choices */}
      {trail.length > 0 && (
        <div className="mb-5 flex flex-wrap items-center gap-1.5 text-label text-text-faint">
          {trail.map((step, i) => (
            <span key={`${step}-${i}`} className="inline-flex items-center gap-1.5">
              {i > 0 && <span className="text-line">›</span>}
              <span className="rounded-pill border border-line bg-glass px-2.5 py-1">{step}</span>
            </span>
          ))}
        </div>
      )}

      {node && (
        <div>
          <p className="text-lg font-medium leading-relaxed text-text">{node.question}</p>
          {node.hint && (
            <p className="mt-2 flex items-start gap-2 text-sm text-text-faint">
              <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent/70" />
              {node.hint}
            </p>
          )}
          <div className="mt-5 grid gap-2.5">
            {node.options.map((opt) => (
              <button
                key={opt.label}
                type="button"
                onClick={() => pick(opt.label, opt.next)}
                className="group flex items-center justify-between gap-3 rounded-xl border border-line bg-glass px-4 py-3.5 text-left text-sm text-text-muted transition-all hover:-translate-y-0.5 hover:border-accent/50 hover:text-text"
              >
                <span>{opt.label}</span>
                <ArrowRight className="h-4 w-4 shrink-0 text-text-faint transition-all group-hover:translate-x-0.5 group-hover:text-accent" />
              </button>
            ))}
          </div>
        </div>
      )}

      {outcome && (
        <div>
          {(() => {
            const tone = TONE[outcome.tone ?? "info"];
            const ToneIcon = tone.icon;
            return (
              <div className={cn("rounded-2xl border p-6", tone.ring)}>
                <div className="flex items-center gap-2 font-mono text-label uppercase tracking-wider">
                  <span className={cn("inline-flex items-center gap-1.5", tone.chip)}>
                    <ToneIcon className="h-3.5 w-3.5" /> Outcome
                  </span>
                  {outcome.ref && (
                    <span className="ml-auto text-text-faint">{outcome.ref}</span>
                  )}
                </div>
                <h4 className="mt-2 font-display text-xl font-semibold text-text">
                  {outcome.verdict}
                </h4>
                <p className="mt-2 text-sm leading-relaxed text-text-muted">{outcome.detail}</p>
              </div>
            );
          })()}
          <button type="button" onClick={reset} className="btn btn-ghost mt-5">
            <RotateCcw className="h-4 w-4" /> Start over
          </button>
        </div>
      )}
    </div>
  );
}
