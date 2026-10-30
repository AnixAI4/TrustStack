"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { useRef, useState } from "react";
import { Tabs, type TabDef } from "./tabs";

export interface StepDef extends TabDef {
  /** The step's name in words, for "Next: B. Data handling". */
  title: string;
}

/**
 * A long form in steps (Slice 10.5 Batch B5a, N1, D-107): `<Tabs>` with Back
 * and Next under each panel. The tabs stay clickable in any order; every panel
 * stays mounted, so nothing typed is lost between steps.
 *
 * `onNext` runs before moving on (e.g. save the answers); return false to stay
 * on the step — its error shows where it is. Test ids: `step-back-{id}`,
 * `step-next-{id}`, plus `<Tabs>`' own.
 */
export function SteppedTabs({
  steps,
  label,
  testId,
  onNext,
  busy = false,
}: {
  steps: StepDef[];
  label: string;
  testId?: string;
  onNext?: (from: string, to: string) => Promise<boolean> | boolean;
  busy?: boolean;
}) {
  const visible = steps.filter((s) => !s.hidden);
  const [active, setActive] = useState(visible[0]?.id ?? "");
  const top = useRef<HTMLDivElement>(null);

  function go(id: string) {
    setActive(id);
    if (typeof window !== "undefined") window.history.replaceState(null, "", `#${id}`);
    top.current?.scrollIntoView({ block: "start", behavior: "smooth" });
  }

  const tabs: TabDef[] = visible.map((s, i) => {
    const prev = visible[i - 1];
    const next = visible[i + 1];
    return {
      ...s,
      content: (
        <>
          {s.content}
          {(prev || next) && (
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-4">
              {prev ? (
                <button
                  type="button"
                  data-testid={`step-back-${s.id}`}
                  onClick={() => go(prev.id)}
                  className="inline-flex items-center gap-1.5 rounded-md border border-line-strong bg-surface px-3 py-1.5 text-sm font-medium text-ink hover:bg-surface-muted"
                >
                  <ArrowLeft aria-hidden="true" className="h-4 w-4" />
                  Back
                </button>
              ) : (
                <span />
              )}
              {next && (
                <button
                  type="button"
                  data-testid={`step-next-${s.id}`}
                  disabled={busy}
                  onClick={async () => {
                    // Refused (a save failed): back to the top, where the error shows.
                    if (onNext && !(await onNext(s.id, next.id))) return top.current?.scrollIntoView({ block: "start", behavior: "smooth" });
                    go(next.id);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-md bg-indigo-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-800 disabled:opacity-50"
                >
                  Next: {next.title}
                  <ArrowRight aria-hidden="true" className="h-4 w-4" />
                </button>
              )}
            </div>
          )}
        </>
      ),
    };
  });

  return (
    <div ref={top} className="scroll-mt-20">
      <Tabs tabs={tabs} label={label} testId={testId} value={active} onValueChange={setActive} variant="steps" />
    </div>
  );
}
