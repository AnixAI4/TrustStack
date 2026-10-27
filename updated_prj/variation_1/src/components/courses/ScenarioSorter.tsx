"use client";

import { useState } from "react";
import { Check, X, RotateCcw, Trophy, ArrowRight, Gavel } from "lucide-react";
import { cn } from "@/lib/cn";
import type { SorterDeck } from "@/content/course-activities";

/**
 * "Make the call" - a rapid-fire judgement game. The learner reads a real-world
 * situation, picks a verdict, and gets instant feedback with the reasoning and
 * a section reference. A running score and an end-of-deck summary keep it
 * engaging without any leaderboard/flag mechanics.
 */
export function ScenarioSorter({ deck }: { deck: SorterDeck }) {
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const card = deck.cards[index];
  const isLast = index === deck.cards.length - 1;
  const total = deck.cards.length;

  const choose = (optionIndex: number) => {
    if (picked !== null) return;
    setPicked(optionIndex);
    if (card.options[optionIndex].correct) setScore((s) => s + 1);
  };

  const advance = () => {
    if (isLast) {
      setDone(true);
      return;
    }
    setIndex((n) => n + 1);
    setPicked(null);
  };

  const restart = () => {
    setIndex(0);
    setPicked(null);
    setScore(0);
    setDone(false);
  };

  if (done) {
    const pct = Math.round((score / total) * 100);
    const message =
      pct === 100
        ? "Flawless - you're reading these like the Board would."
        : pct >= 60
          ? "Solid instincts. Re-run the ones that caught you out."
          : "Worth another pass - the explanations are where it clicks.";
    return (
      <div className="flex flex-col items-center gap-5 rounded-2xl border border-line bg-glass px-6 py-10 text-center">
        <span className="grid h-14 w-14 place-items-center rounded-2xl border border-accent/30 bg-accent/10 text-accent">
          <Trophy className="h-7 w-7" />
        </span>
        <div>
          <div className="font-display text-4xl font-semibold text-text">
            {score}
            <span className="text-text-faint">/{total}</span>
          </div>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-text-muted">{message}</p>
        </div>
        <button type="button" onClick={restart} className="btn btn-ghost">
          <RotateCcw className="h-4 w-4" /> Play again
        </button>
      </div>
    );
  }

  const answered = picked !== null;

  return (
    <div>
      {/* progress + score */}
      <div className="flex items-center justify-between gap-4">
        <span className="font-mono text-label uppercase tracking-wider text-text-faint">
          Call {index + 1} of {total}
        </span>
        <span className="font-mono text-label text-text-faint">
          Score <span className="text-accent">{score}</span>
        </span>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-pill bg-line">
        <div
          className="h-full rounded-pill bg-accent transition-[width] duration-500"
          style={{ width: `${((index + (answered ? 1 : 0)) / total) * 100}%` }}
        />
      </div>

      {/* prompt */}
      <p className="mt-6 text-lg leading-relaxed text-text">{card.prompt}</p>

      {/* options */}
      <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
        {card.options.map((opt, oi) => {
          const isCorrect = !!opt.correct;
          const isChosen = picked === oi;
          const showCorrect = answered && isCorrect;
          const showWrong = answered && isChosen && !isCorrect;
          return (
            <button
              key={opt.label}
              type="button"
              disabled={answered}
              onClick={() => choose(oi)}
              className={cn(
                "flex items-center gap-3 rounded-xl border px-4 py-3.5 text-left text-sm font-medium transition-all",
                !answered &&
                  "border-line bg-glass text-text-muted hover:-translate-y-0.5 hover:border-accent/50 hover:text-text",
                showCorrect && "border-green/50 bg-green/10 text-text",
                showWrong && "border-red/50 bg-red/10 text-text",
                answered && !showCorrect && !showWrong && "border-line bg-glass text-text-faint"
              )}
            >
              <span
                className={cn(
                  "grid h-6 w-6 shrink-0 place-items-center rounded-full border text-label",
                  showCorrect && "border-green/60 bg-green/20 text-green-soft",
                  showWrong && "border-red/60 bg-red/20 text-red-soft",
                  !showCorrect && !showWrong && "border-line text-text-faint"
                )}
              >
                {showCorrect ? (
                  <Check className="h-3.5 w-3.5" />
                ) : showWrong ? (
                  <X className="h-3.5 w-3.5" />
                ) : (
                  String.fromCharCode(65 + oi)
                )}
              </span>
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>

      {/* feedback */}
      {answered && (
        <div className="mt-5 rounded-xl border border-line bg-bg-2/60 p-5">
          <div className="flex items-center gap-2 font-mono text-label uppercase tracking-wider text-text-faint">
            {card.options[picked].correct ? (
              <span className="inline-flex items-center gap-1.5 text-green-soft">
                <Check className="h-3.5 w-3.5" /> Correct
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-red-soft">
                <X className="h-3.5 w-3.5" /> Not quite
              </span>
            )}
            {card.ref && (
              <span className="ml-auto inline-flex items-center gap-1.5 text-accent/90">
                <Gavel className="h-3 w-3" /> {card.ref}
              </span>
            )}
          </div>
          <p className="mt-2.5 text-sm leading-relaxed text-text-muted">{card.explain}</p>
          <div className="mt-4">
            <button type="button" onClick={advance} className="btn btn-accent">
              {isLast ? "See results" : "Next call"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
