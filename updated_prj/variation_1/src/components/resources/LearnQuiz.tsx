"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Check, ArrowRight, RotateCcw, Sparkles } from "lucide-react";
import { SAMPLE_QUESTIONS } from "@/content/sample-questions";
import type { QuizQuestion, Difficulty } from "@/content/learn";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/cn";
import { notifyProgressUpdate } from "@/lib/progress";
import { storageGetItem, storageSetItem } from "@/lib/safe-storage";

// The free quiz is a taster: it only ever exposes a small pool of questions to
// the browser - never the full bank or the paid certificate-exam set.
const FREE_POOL = 15; // max questions fetched / exposed to the client
const SERVE = 10; // questions drawn per attempt (kept within the 10-15 range)

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function LearnQuiz() {
  const [open, setOpen] = useState(false);
  const [order, setOrder] = useState<number[]>([]);
  const [step, setStep] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [correct, setCorrect] = useState(0);
  const [done, setDone] = useState(false);
  const [best, setBest] = useState(0);
  const [bank, setBank] = useState<QuizQuestion[]>(() => SAMPLE_QUESTIONS.slice(0, FREE_POOL));

  useEffect(() => {
    setBest(Number(storageGetItem("dpdp-quiz-best") || 0));
  }, []);

  // The free quiz only ever receives a small, random, capped slice of the FREE
  // quiz set - never the full bank or any paid certificate-exam questions. It
  // calls a server-side RPC (get_quiz_sample) and falls back to a capped select,
  // then to a tiny offline sample. See supabase/secure_questions.sql.
  useEffect(() => {
    if (!supabase) return;
    const sb = supabase;
    let active = true;
    (async () => {
      let rows: QuizQuestion[] = [];
      const rpc = await sb.rpc("get_quiz_sample", { p_count: FREE_POOL });
      if (!rpc.error && Array.isArray(rpc.data)) {
        rows = (rpc.data as Array<{
          question: string;
          options: string[];
          correct: number;
          explanation?: string;
          difficulty?: Difficulty;
        }>).map((r) => ({
          q: r.question,
          options: r.options,
          answer: r.correct,
          explanation: r.explanation ?? "",
          difficulty: r.difficulty,
        }));
      } else {
        const sel = await sb
          .from("quiz_questions")
          .select("q:question,options,answer:correct,explanation,difficulty")
          .limit(FREE_POOL);
        if (!sel.error) rows = (sel.data as unknown as QuizQuestion[]) || [];
      }
      if (!active) return;
      const seen = new Set<string>();
      const pool = rows.filter((m) => {
        const k = (m.q || "").trim().toLowerCase();
        if (!m.q || !Array.isArray(m.options) || seen.has(k)) return false;
        seen.add(k);
        return true;
      });
      if (pool.length > 0) setBank(pool.slice(0, FREE_POOL));
    })();
    return () => {
      active = false;
    };
  }, []);

  const start = () => {
    const source = bank.map((_, i) => i);
    setOrder(shuffle(source).slice(0, Math.min(SERVE, source.length)));
    setStep(0);
    setPicked(null);
    setCorrect(0);
    setDone(false);
    setOpen(true);
  };

  const q = useMemo(
    () => (order.length ? bank[order[step]] : null),
    [order, step, bank]
  );

  const choose = (i: number) => {
    if (picked !== null || !q) return;
    setPicked(i);
    if (i === q.answer) setCorrect((c) => c + 1);
  };

  const next = () => {
    if (step + 1 >= order.length) {
      const pct = Math.round((correct / order.length) * 100);
      const newBest = Math.max(pct, best);
      setBest(newBest);
      storageSetItem("dpdp-quiz-best", String(newBest));
      notifyProgressUpdate();
      setDone(true);
    } else {
      setStep((s) => s + 1);
      setPicked(null);
    }
  };

  return (
    <>
      <div className="rounded-2xl border border-line bg-surface-2/40 p-8">
        <span className="badge">
          <Sparkles className="h-3 w-3" /> Adaptive quiz
        </span>
        <h3 className="mt-4 font-display text-2xl font-semibold text-text">
          Test yourself in 5 minutes
        </h3>
        <p className="mt-2 max-w-xl text-text-muted">
          Ten multiple-choice questions, drawn at random from a free{" "}
          {bank.length}-question starter set, with instant feedback. The full
          question bank and certificate exam come with the course.
        </p>
        {best > 0 && (
          <div className="mt-5">
            <div className="flex items-center justify-between text-sm text-text-muted">
              <span>Best score</span>
              <span className="font-semibold text-text">{best}%</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-pill bg-line">
              <div
                className="h-full rounded-pill bg-gradient-to-r from-accent to-amber"
                style={{ width: `${best}%` }}
              />
            </div>
          </div>
        )}
        <button onClick={start} className="btn btn-accent mt-6">
          Start the quiz
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] grid place-items-center overflow-y-auto overscroll-contain bg-black/70 p-2 backdrop-blur-sm sm:p-4"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label="DPDP knowledge quiz"
              className="max-h-[calc(100dvh-1rem)] w-full max-w-lg overflow-y-auto overscroll-contain rounded-2xl border border-line bg-bg-2 shadow-glow sm:max-h-[calc(100dvh-2rem)]"
            >
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-bg-2/95 px-4 py-3 backdrop-blur sm:px-6 sm:py-4">
                <span className="font-mono text-xs uppercase tracking-wider text-text-faint">
                  {done ? "Results" : `Question ${step + 1} of ${order.length}`}
                </span>
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Close quiz"
                  className="grid h-8 w-8 place-items-center rounded-pill border border-line text-text-muted hover:text-text"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {!done && q ? (
                <div className="p-4 sm:p-6">
                  <h4 className="font-display text-lg font-semibold text-text">
                    {q.q}
                  </h4>
                  <div className="mt-4 space-y-2">
                    {q.options.map((o, i) => {
                      const isAnswer = i === q.answer;
                      const isPicked = i === picked;
                      const show = picked !== null;
                      return (
                        <button
                          key={i}
                          onClick={() => choose(i)}
                          disabled={show}
                          className={cn(
                            "flex w-full items-center justify-between gap-3 rounded-lg border px-4 py-3 text-left text-sm transition-all",
                            !show && "border-line hover:border-accent/40",
                            show && isAnswer && "border-green/50 bg-green/15 text-green-soft",
                            show && isPicked && !isAnswer && "border-red/50 bg-red/15 text-red-soft",
                            show && !isAnswer && !isPicked && "border-line opacity-60"
                          )}
                        >
                          {o}
                          {show && isAnswer && <Check className="h-4 w-4" />}
                        </button>
                      );
                    })}
                  </div>
                  {picked !== null && q.explanation && (
                    <div className="mt-4 rounded-lg border border-line bg-surface-2/50 p-4 text-sm text-text-muted">
                      {q.explanation}
                    </div>
                  )}
                  <button
                    onClick={next}
                    disabled={picked === null}
                    className="btn btn-accent mt-5 w-full disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {step + 1 >= order.length ? "See results" : "Next question"}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="p-5 text-center sm:p-8">
                  <div className="font-display text-5xl font-semibold text-text">
                    {Math.round((correct / order.length) * 100)}%
                  </div>
                  <p className="mt-2 text-text-muted">
                    You scored {correct} / {order.length}
                  </p>
                  <div className="mt-6 flex justify-center gap-2">
                    <button onClick={start} className="btn btn-ghost">
                      <RotateCcw className="h-4 w-4" /> Retry
                    </button>
                    <button onClick={() => setOpen(false)} className="btn btn-accent">
                      Done
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
