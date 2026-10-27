"use client";

import { useMemo, useState } from "react";
import { Check, X, RotateCcw, Trophy, HelpCircle } from "lucide-react";
import type { QuizQuestion } from "@/content/curriculum";
import { cn } from "@/lib/cn";

/**
 * Inline end-of-module knowledge check. Unlike the modal LearnQuiz, this renders
 * every question on the page, gives instant per-question feedback with the
 * explanation, and tallies a live score - a low-stakes self-test to consolidate
 * the module before the real exam.
 */
export function ModuleQuiz({ questions }: { questions: QuizQuestion[] }) {
  const [picked, setPicked] = useState<(number | null)[]>(() => questions.map(() => null));

  const answered = picked.filter((p) => p !== null).length;
  const correct = useMemo(
    () =>
      picked.reduce<number>(
        (sum, p, i) => (p !== null && p === questions[i].answer ? sum + 1 : sum),
        0
      ),
    [picked, questions]
  );
  const allDone = answered === questions.length;
  const pct = questions.length ? Math.round((correct / questions.length) * 100) : 0;

  const choose = (qi: number, oi: number) => {
    if (picked[qi] !== null) return; // lock after first answer
    setPicked((prev) => {
      const next = [...prev];
      next[qi] = oi;
      return next;
    });
  };

  const reset = () => setPicked(questions.map(() => null));

  return (
    <div className="rounded-2xl border border-line bg-surface-2/40 p-6 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl border border-line bg-glass text-accent">
            <HelpCircle className="h-5 w-5" />
          </span>
          <div>
            <h3 className="font-display text-xl font-semibold text-text">Check your understanding</h3>
            <p className="text-sm text-text-muted">
              {questions.length} quick questions with instant feedback - no score is saved.
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="font-display text-2xl font-semibold text-text">
            {correct}
            <span className="text-text-faint">/{questions.length}</span>
          </div>
          <div className="font-mono text-label uppercase tracking-wider text-text-faint">
            {answered === 0 ? "Not started" : allDone ? "Complete" : `${answered} answered`}
          </div>
        </div>
      </div>

      {/* progress bar */}
      <div className="mt-5 h-2 overflow-hidden rounded-pill bg-line">
        <div
          className="h-full rounded-pill bg-gradient-to-r from-accent to-amber transition-[width] duration-500"
          style={{ width: `${(answered / questions.length) * 100}%` }}
        />
      </div>

      <ol className="mt-8 space-y-8">
        {questions.map((q, qi) => {
          const chosen = picked[qi];
          const isAnswered = chosen !== null;
          return (
            <li key={q.q}>
              <p className="flex gap-3 font-display text-base font-semibold text-text">
                <span className="font-mono text-sm text-accent">{qi + 1}.</span>
                <span>{q.q}</span>
              </p>
              <div className="mt-4 grid gap-2.5">
                {q.options.map((opt, oi) => {
                  const isCorrect = oi === q.answer;
                  const isChosen = chosen === oi;
                  const showCorrect = isAnswered && isCorrect;
                  const showWrong = isAnswered && isChosen && !isCorrect;
                  return (
                    <button
                      key={opt}
                      type="button"
                      disabled={isAnswered}
                      onClick={() => choose(qi, oi)}
                      className={cn(
                        "flex items-start gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-all",
                        !isAnswered &&
                          "border-line bg-glass text-text-muted hover:border-accent/40 hover:text-text",
                        showCorrect && "border-green/50 bg-green/10 text-text",
                        showWrong && "border-red/50 bg-red/10 text-text",
                        isAnswered && !showCorrect && !showWrong && "border-line bg-glass text-text-faint"
                      )}
                    >
                      <span
                        className={cn(
                          "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border text-label",
                          showCorrect && "border-green/60 bg-green/20 text-green-soft",
                          showWrong && "border-red/60 bg-red/20 text-red-soft",
                          !showCorrect && !showWrong && "border-line text-text-faint"
                        )}
                      >
                        {showCorrect ? (
                          <Check className="h-3 w-3" />
                        ) : showWrong ? (
                          <X className="h-3 w-3" />
                        ) : (
                          String.fromCharCode(65 + oi)
                        )}
                      </span>
                      <span>{opt}</span>
                    </button>
                  );
                })}
              </div>

              {isAnswered && (
                <div
                  className={cn(
                    "mt-3 rounded-xl border p-4 text-sm leading-relaxed",
                    chosen === q.answer
                      ? "border-green/30 bg-green/5 text-text-muted"
                      : "border-accent/30 bg-accent/5 text-text-muted"
                  )}
                >
                  <span
                    className={cn(
                      "font-display font-semibold",
                      chosen === q.answer ? "text-green-soft" : "text-accent-soft"
                    )}
                  >
                    {chosen === q.answer ? "Correct. " : "Not quite. "}
                  </span>
                  {q.explanation}
                </div>
              )}
            </li>
          );
        })}
      </ol>

      {allDone && (
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-line bg-glass p-5">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-lg border border-line text-accent">
              <Trophy className="h-5 w-5" />
            </span>
            <p className="text-sm text-text-muted">
              You scored{" "}
              <span className="font-display font-semibold text-text">
                {correct}/{questions.length} ({pct}%)
              </span>{" "}
              on this check.{" "}
              {pct >= 70
                ? "You're ready to move on."
                : "Worth a quick re-read before the next module."}
            </p>
          </div>
          <button type="button" onClick={reset} className="btn btn-ghost">
            <RotateCcw className="h-4 w-4" /> Try again
          </button>
        </div>
      )}
    </div>
  );
}
