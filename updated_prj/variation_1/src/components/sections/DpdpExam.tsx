"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  Clock,
  ArrowLeft,
  ArrowRight,
  X,
  Check,
  AlertTriangle,
  FileCheck2,
  ChevronLeft,
  Award,
} from "lucide-react";
import type { DpdpaQuestion } from "@/content/dpdpa-questions";
import { SAMPLE_QUESTIONS } from "@/content/sample-questions";
import { EXAM_SIZE, EXAM_MINUTES, EXAM_BANK_SIZE } from "@/content/certification";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/cn";
import { CertificateStudio } from "@/components/sections/CertificateStudio";

const LETTERS = ["A", "B", "C", "D", "E", "F"];

type Phase = "intro" | "exam" | "result";

function makeCertId(): string {
  return "CDP-" + Date.now().toString(36).toUpperCase() + "-" + Math.random().toString(36).slice(2, 6).toUpperCase();
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function mmss(total: number): string {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

// A quiet, static assessment backdrop. Difficulty changes only the restrained
// accent colour; the grid, hatch and framing rules never animate.
type QDiff = DpdpaQuestion["difficulty"];

const QBG_THEME: Record<
  NonNullable<QDiff>,
  { c: string; tier: "basic" | "intermediate" | "advanced" }
> = {
  basic: { c: "var(--green-rgb)", tier: "basic" },
  intermediate: { c: "var(--accent-rgb)", tier: "intermediate" },
  advanced: { c: "var(--brand-rgb)", tier: "advanced" },
};
const QBG_FALLBACK = { c: "var(--gold-rgb)", tier: "intermediate" as const };

function QuestionBackdrop({ difficulty }: { difficulty: QDiff }) {
  const th = (difficulty && QBG_THEME[difficulty]) || QBG_FALLBACK;
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
      <div className="qbg" data-tier={th.tier} style={{ ["--c" as string]: th.c }}>
        <span className="qbg__wash" />
        <span className="qbg__grid" />
        <span className="qbg__hatch" />
        <span className="qbg__frame" />
      </div>
    </div>
  );
}

export function DpdpExam() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [bank, setBank] = useState<DpdpaQuestion[]>(SAMPLE_QUESTIONS);
  const [examBank, setExamBank] = useState<DpdpaQuestion[]>(SAMPLE_QUESTIONS);
  const [order, setOrder] = useState<number[]>([]);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [step, setStep] = useState(0);
  const [remaining, setRemaining] = useState(EXAM_MINUTES * 60);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [certificateOpen, setCertificateOpen] = useState(false);
  const [confettiRun, setConfettiRun] = useState(0);
  const [certId] = useState(() => makeCertId());
  const deadlineRef = useRef<number | null>(null);
  const submittedRef = useRef(false);

  // The exam receives only what an attempt needs - a small, RANDOM, capped
  // subset from the server-side RPC (get_exam_questions), so the full bank is
  // never downloaded. Falls back to a capped select, then to a tiny offline
  // sample. See supabase/secure_questions.sql.
  useEffect(() => {
    if (!supabase) return;
    const sb = supabase;
    let active = true;
    (async () => {
      let rows: DpdpaQuestion[] = [];
      const rpc = await sb.rpc("get_exam_questions", { p_count: EXAM_SIZE });
      if (!rpc.error && Array.isArray(rpc.data)) {
        rows = (rpc.data as Array<{
          question: string;
          options: string[];
          correct: number;
          difficulty?: DpdpaQuestion["difficulty"];
        }>).map((r) => ({
          q: r.question,
          options: r.options,
          answer: r.correct,
          difficulty: r.difficulty,
        }));
      } else {
        const sel = await sb
          .from("exam_questions")
          .select("q:question,options,answer:correct,difficulty")
          .limit(EXAM_SIZE);
        if (!sel.error) rows = (sel.data as unknown as DpdpaQuestion[]) || [];
      }
      if (!active) return;
      const seen = new Set<string>();
      const merged = rows.filter((m) => {
        const key = (m.q || "").trim().toLowerCase();
        if (
          !m.q ||
          !Array.isArray(m.options) ||
          m.options.length < 2 ||
          !Number.isInteger(m.answer) ||
          m.answer < 0 ||
          m.answer >= m.options.length ||
          seen.has(key)
        ) {
          return false;
        }
        seen.add(key);
        return true;
      });
      const complete = [...merged];
      for (const fallback of SAMPLE_QUESTIONS) {
        if (complete.length >= EXAM_SIZE) break;
        const key = fallback.q.trim().toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        complete.push(fallback);
      }
      setBank(complete.slice(0, EXAM_SIZE));
    })();
    return () => {
      active = false;
    };
  }, []);

  const submit = useCallback(() => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setConfirmSubmit(false);
    setPhase("result");
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const submitRef = useRef(submit);
  useEffect(() => {
    submitRef.current = submit;
  }, [submit]);

  // Countdown with auto-submit at zero.
  useEffect(() => {
    if (phase !== "exam") return;
    const id = setInterval(() => {
      const left = deadlineRef.current
        ? Math.max(0, Math.round((deadlineRef.current - Date.now()) / 1000))
        : 0;
      setRemaining(left);
      if (left <= 0) {
        clearInterval(id);
        submitRef.current();
      }
    }, 1000);
    return () => clearInterval(id);
  }, [phase]);

  const begin = () => {
    const pool = bank.length ? bank : SAMPLE_QUESTIONS;
    const idx = shuffle(pool.map((_, i) => i)).slice(0, Math.min(EXAM_SIZE, pool.length));
    setExamBank(pool);
    setOrder(idx);
    setAnswers(Array(idx.length).fill(null));
    setStep(0);
    setRemaining(EXAM_MINUTES * 60);
    deadlineRef.current = Date.now() + EXAM_MINUTES * 60 * 1000;
    submittedRef.current = false;
    setConfirmSubmit(false);
    setCertificateOpen(false);
    setPhase("exam");
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "auto" });
  };

  const select = (i: number) => setAnswers((a) => a.map((x, idx) => (idx === step ? i : x)));

  const answeredCount = answers.filter((a) => a !== null).length;
  const unanswered = order.length - answeredCount;
  const correctCount = useMemo(
    () => order.reduce((acc, qi, i) => acc + (answers[i] === examBank[qi].answer ? 1 : 0), 0),
    [order, answers, examBank]
  );
  const pct = order.length ? Math.round((correctCount / order.length) * 100) : 0;
  const passed = order.length === EXAM_SIZE && correctCount === EXAM_SIZE;

  const showCertificate = useCallback(() => {
    setConfettiRun((run) => run + 1);
    setCertificateOpen(true);
  }, []);

  useEffect(() => {
    if (phase === "result" && passed) showCertificate();
  }, [passed, phase, showCertificate]);

  const lowTime = remaining <= 300;
  const critTime = remaining <= 60;

  // ---------- top bar ----------
  const TopBar = ({ children }: { children?: React.ReactNode }) => (
    <header className="sticky top-0 z-20 border-b border-line bg-bg/85 backdrop-blur">
      <div className="container-x flex h-14 items-center justify-between gap-4">
        <Link
          href="/certification"
          className="inline-flex items-center gap-1.5 font-mono text-label uppercase tracking-wider text-text-faint transition-colors hover:text-text"
        >
          <ChevronLeft className="h-4 w-4" /> Exit
        </Link>
        <span className="hidden font-mono text-label uppercase tracking-[0.2em] text-text-muted sm:block">
          DPDP Practitioner Examination
        </span>
        <div className="flex items-center gap-2">{children}</div>
      </div>
    </header>
  );

  // ---------- INTRO ----------
  if (phase === "intro") {
    return (
      <div className="relative isolate flex min-h-screen flex-col bg-bg">
        <QuestionBackdrop difficulty={undefined} />
        <TopBar />

        <div className="border-b border-green/30 bg-green/10 px-4 py-3">
          <div className="container-x flex items-center gap-3">
            <Award className="h-5 w-5 shrink-0 text-green-soft" />
            <p className="text-sm text-text-muted">
              <span className="font-semibold text-green-soft">Perfect-score challenge.</span>{" "}
              Answer all five questions correctly to unlock your personalised certificate.
            </p>
          </div>
        </div>

        <div className="container-x flex flex-1 flex-col items-center gap-10 py-12">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-2xl rounded-2xl border border-line bg-surface-2/30 p-6 sm:p-10"
          >
            <span className="badge">
              <FileCheck2 className="h-3 w-3" /> Certification exam
            </span>
            <h1 className="mt-5 font-display text-3xl font-semibold text-text sm:text-4xl">
              The DPDP Practitioner examination
            </h1>
            <p className="mt-3 leading-relaxed text-text-muted">
              A closed-book exam of {EXAM_SIZE} multiple-choice questions, selected at random from the
              full bank of {EXAM_BANK_SIZE} questions. The clock starts when you begin.
            </p>

            <dl className="mt-7 grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-4">
              {[
                { k: "Questions", v: `${EXAM_SIZE}` },
                { k: "Time limit", v: `${EXAM_MINUTES} min` },
                { k: "Pass mark", v: `${EXAM_SIZE} / ${EXAM_SIZE}` },
                { k: "Attempts", v: "Retake" },
              ].map((s) => (
                <div key={s.k} className="bg-bg-2/60 p-4">
                  <dt className="font-mono text-label uppercase tracking-wider text-text-faint">
                    {s.k}
                  </dt>
                  <dd className="mt-1 font-display text-xl font-semibold text-text">{s.v}</dd>
                </div>
              ))}
            </dl>

            <ul className="mt-6 space-y-2 text-sm text-text-muted">
              {[
                "Navigate freely - answer in any order and change answers before submitting.",
                "Unanswered questions are marked incorrect.",
                "The exam submits automatically when the timer reaches zero.",
                "Get all five correct and your certificate will open automatically.",
              ].map((r) => (
                <li key={r} className="flex gap-2.5">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  <span>{r}</span>
                </li>
              ))}
            </ul>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <motion.button
                onClick={begin}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="btn btn-accent btn-lg"
              >
                <FileCheck2 className="h-4 w-4" /> Begin the exam
              </motion.button>
            </div>

          </motion.div>

          {/* Certificate preview - the credential you'll earn on a pass */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="w-full max-w-2xl"
          >
            <div className="mb-5 text-center">
              <span className="badge">
                <Award className="h-3 w-3" /> Preview the credential
              </span>
              <h2 className="mt-3 font-display text-2xl font-semibold text-text">
                See your certificate
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-text-muted">
                Here&apos;s the credential you&apos;ll earn - a verifiable, on-screen certificate.
                Pass the exam to unlock and claim it with your name.
              </p>
            </div>
            <CertificateStudio locked />
          </motion.div>
        </div>
      </div>
    );
  }

  // ---------- RESULT ----------
  if (phase === "result") {
    const timeTaken = EXAM_MINUTES * 60 - remaining;

    return (
      <div className="relative isolate flex min-h-screen flex-col bg-bg">
        <QuestionBackdrop difficulty={passed ? "basic" : "advanced"} />
        <TopBar>
          <span className="font-mono text-label uppercase tracking-wider text-text-faint">
            Results
          </span>
        </TopBar>
        <div className="container-x flex-1 py-10">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto max-w-3xl rounded-2xl border border-line bg-surface-2/30 p-6 sm:p-10"
          >
            <div className="grid gap-6 sm:grid-cols-[auto_1fr] sm:items-center">
              <ScoreRing pct={pct} pass={passed} />
              <div>
                <span
                  className={cn(
                    "badge",
                    passed ? "badge-green" : "border-red/40 bg-red/10 text-red-soft"
                  )}
                >
                  {passed ? "Perfect score" : "Not yet passed"}
                </span>
                <h1 className="mt-3 font-display text-2xl font-semibold text-text sm:text-3xl">
                  {passed ? "Five out of five. Your certificate is ready." : "Not quite - review the answers below."}
                </h1>
                <p className="mt-2 text-text-muted">
                  You answered{" "}
                  <span className="text-text">
                    {correctCount} of {order.length}
                  </span>{" "}
                  correctly ({pct}%) in {mmss(timeTaken)}.{" "}
                  {passed
                    ? "That is the perfect score required for the certificate."
                    : `A certificate unlocks only at ${EXAM_SIZE}/${EXAM_SIZE}. Review the answers, then try again.`}
                </p>
              </div>
            </div>

            {/* The dialog opens automatically; this card lets the holder reopen it. */}
            {passed && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-8 flex flex-col gap-4 rounded-xl border border-green/30 bg-green/10 p-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-green/40 bg-green/10 text-green-soft">
                    <Award className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-display font-semibold text-text">Certificate unlocked</p>
                    <p className="text-sm text-text-muted">Add your name and claim your credential.</p>
                  </div>
                </div>
                <button type="button" onClick={showCertificate} className="btn btn-accent shrink-0">
                  <Award className="h-4 w-4" /> Open my certificate
                </button>
              </motion.div>
            )}

            <div className="mt-7 flex flex-wrap gap-3">
              {!passed && (
                <button type="button" onClick={begin} className="btn btn-accent">
                  <FileCheck2 className="h-4 w-4" /> Try again
                </button>
              )}
              <Link href="/certification" className="btn btn-accent">
                Back to certification
              </Link>
            </div>

            <div className="mt-8">
              <div className="font-mono text-label uppercase tracking-wider text-text-faint">
                Answer review
              </div>
              <ol className="mt-3 space-y-3">
                {order.map((qi, i) => {
                  const q = examBank[qi];
                  const picked = answers[i];
                  const right = picked === q.answer;
                  return (
                    <li key={i} className="rounded-xl border border-line bg-bg-2/40 p-4">
                      <div className="flex items-start gap-3">
                        <span
                          className={cn(
                            "mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-pill border text-label",
                            right
                              ? "border-green/40 bg-green/10 text-green-soft"
                              : "border-red/40 bg-red/10 text-red-soft"
                          )}
                        >
                          {right ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium leading-relaxed text-text">
                            <span className="text-text-faint">{i + 1}.</span> {q.q}
                          </p>
                          <p className="mt-2 text-sm text-text-muted">
                            <span className="text-text-faint">Correct: </span>
                            <span className="text-green-soft">{q.options[q.answer]}</span>
                          </p>
                          {!right && (
                            <p className="mt-1 text-sm text-text-muted">
                              <span className="text-text-faint">Your answer: </span>
                              <span className="text-red-soft">
                                {picked === null ? "Not answered" : q.options[picked]}
                              </span>
                            </p>
                          )}
                          {q.explanation && (
                            <p className="mt-2 border-l-2 border-line pl-3 text-sm leading-relaxed text-text-muted">
                              {q.explanation}
                            </p>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>
          </motion.div>
        </div>
        <CertificateCelebration
          open={certificateOpen}
          onClose={() => setCertificateOpen(false)}
          score={pct}
          certId={certId}
          confettiRun={confettiRun}
        />
      </div>
    );
  }

  // ---------- EXAM ----------
  const q = examBank[order[step]];

  return (
    <div className="relative isolate flex min-h-screen flex-col bg-bg">
      <QuestionBackdrop difficulty={q.difficulty} />
      <TopBar>
        <span className="hidden font-mono text-label uppercase tracking-wider text-text-faint sm:inline">
          {answeredCount}/{order.length} answered
        </span>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-pill border px-3 py-1 font-mono text-sm tabular-nums",
            critTime
              ? "border-red/50 bg-red/10 text-red-soft"
              : lowTime
                ? "border-amber/50 bg-amber/10 text-amber"
                : "border-line text-text-muted"
          )}
          aria-label="Time remaining"
        >
          <Clock className="h-3.5 w-3.5" /> {mmss(remaining)}
        </span>
      </TopBar>

      <div className="container-x flex-1 py-8">
        <div className="grid gap-8 lg:grid-cols-12">
          {/* question column */}
          <div className="lg:col-span-8">
            <div className="flex items-center gap-4">
              <div className="font-mono text-label uppercase tracking-wider text-text-faint">
                Question <span className="text-text">{step + 1}</span> of {order.length}
              </div>
              <div className="h-1 flex-1 overflow-hidden rounded-pill bg-line">
                <motion.div
                  className="h-full rounded-pill bg-accent"
                  initial={false}
                  animate={{ width: `${((step + 1) / order.length) * 100}%` }}
                  transition={{ type: "spring", stiffness: 120, damping: 20 }}
                />
              </div>
            </div>

            <div
              key={step}
              className="mt-5 rounded-2xl border border-line bg-surface-2/30 p-5 sm:p-8"
            >
                <h2 className="text-lg font-medium leading-relaxed text-text sm:text-xl">{q.q}</h2>

                <div className="mt-5 space-y-2.5" role="radiogroup" aria-label="Answer options">
                  {q.options.map((opt, i) => {
                    const selected = answers[step] === i;
                    return (
                      <button
                        key={i}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => select(i)}
                        className={cn(
                          "flex w-full items-start gap-3 rounded-xl border px-4 py-3.5 text-left text-sm transition-colors",
                          selected
                            ? "border-accent/60 bg-accent/10 text-text"
                            : "border-line text-text-muted hover:border-accent/40 hover:bg-surface-2/40 hover:text-text"
                        )}
                      >
                        <span
                          className={cn(
                            "grid h-6 w-6 shrink-0 place-items-center rounded-pill border font-mono text-xs",
                            selected
                              ? "border-accent bg-accent text-[var(--on-accent)]"
                              : "border-line text-text-faint"
                          )}
                        >
                          {LETTERS[i]}
                        </span>
                        <span className="pt-0.5 leading-relaxed">{opt}</span>
                      </button>
                    );
                  })}
                </div>
            </div>

            <div className="mt-6 flex items-center justify-between gap-3">
              <button
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                disabled={step === 0}
                className="btn btn-ghost disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ArrowLeft className="h-4 w-4" /> Previous
              </button>
              {step + 1 < order.length ? (
                <button
                  onClick={() => setStep((s) => Math.min(order.length - 1, s + 1))}
                  className="btn btn-accent"
                >
                  Next <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  onClick={() => (unanswered > 0 ? setConfirmSubmit(true) : submit())}
                  className="btn btn-accent"
                >
                  Submit exam <FileCheck2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* status + palette */}
          <aside className="lg:col-span-4">
            <div className="lg:sticky lg:top-20">
              <div className="rounded-2xl border border-line bg-surface-2/30 p-5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-label uppercase tracking-wider text-text-faint">
                    Progress
                  </span>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 font-mono text-sm tabular-nums",
                      critTime ? "text-red-soft" : lowTime ? "text-amber" : "text-text-muted"
                    )}
                  >
                    <Clock className="h-3.5 w-3.5" /> {mmss(remaining)}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <Stat label="Answered" value={answeredCount} tone="good" />
                  <Stat label="Left" value={unanswered} tone="muted" />
                  <Stat label="Total" value={order.length} tone="muted" />
                </div>

                <div className="mt-4 h-2 overflow-hidden rounded-pill bg-line">
                  <motion.div
                    className="h-full rounded-pill bg-accent"
                    initial={false}
                    animate={{ width: `${(answeredCount / order.length) * 100}%` }}
                    transition={{ type: "spring", stiffness: 120, damping: 22 }}
                  />
                </div>

                <div className="mt-5 font-mono text-label uppercase tracking-wider text-text-faint">
                  Questions
                </div>
                <div className="mt-2.5 grid grid-cols-8 gap-1.5 sm:grid-cols-10 lg:grid-cols-6 xl:grid-cols-8">
                  {order.map((_, i) => {
                    const isCurrent = i === step;
                    const isAnswered = answers[i] !== null;
                    return (
                      <button
                        key={i}
                        onClick={() => setStep(i)}
                        aria-label={`Go to question ${i + 1}${isAnswered ? ", answered" : ", unanswered"}`}
                        className={cn(
                          "grid h-7 w-full place-items-center rounded-md border text-center font-mono text-label tabular-nums transition-colors",
                          isCurrent
                            ? "border-accent bg-accent/20 text-accent ring-1 ring-accent"
                            : isAnswered
                              ? "border-accent/40 bg-accent/10 text-text"
                              : "border-line text-text-faint hover:border-accent/40"
                        )}
                      >
                        {i + 1}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-label text-text-faint">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-[3px] border border-accent/40 bg-accent/10" /> Answered
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-[3px] border border-line" /> Unanswered
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-[3px] border border-accent bg-accent/20 ring-1 ring-accent" />{" "}
                    Current
                  </span>
                </div>

                <button
                  onClick={() => (unanswered > 0 ? setConfirmSubmit(true) : submit())}
                  className="btn btn-accent mt-5 w-full"
                >
                  Submit exam <FileCheck2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* submit confirmation */}
      <AnimatePresence>
        {confirmSubmit && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] grid place-items-center bg-black/70 p-4 backdrop-blur-sm"
            onClick={() => setConfirmSubmit(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-2xl border border-line bg-bg-2 p-6 shadow-glow"
            >
              <span className="grid h-11 w-11 place-items-center rounded-lg border border-amber/40 bg-amber/10 text-amber">
                <AlertTriangle className="h-5 w-5" />
              </span>
              <h4 className="mt-4 font-display text-lg font-semibold text-text">
                Submit with {unanswered} unanswered?
              </h4>
              <p className="mt-1.5 text-sm text-text-muted">
                Unanswered questions are marked incorrect. You can keep going and submit when
                you&apos;re done.
              </p>
              <div className="mt-5 flex gap-3">
                <button onClick={() => setConfirmSubmit(false)} className="btn btn-ghost flex-1">
                  Keep going
                </button>
                <button onClick={submit} className="btn btn-accent flex-1">
                  Submit now
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const CONFETTI_COLORS = ["#ad8a3a", "#d7b85f", "#5c936f", "#c9674f", "#f1dfaa", "#47758a"];

const CELEBRATION_STYLES = `
@keyframes certificateConfettiFall {
  0% { opacity: 0; transform: translate3d(0, -12vh, 0) rotate(0deg); }
  8% { opacity: 1; }
  100% { opacity: 0.9; transform: translate3d(var(--confetti-drift), 112vh, 0) rotate(var(--confetti-spin)); }
}
@keyframes certificatePopIn {
  0% { opacity: 0; transform: translateY(20px) scale(0.97); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
}
.certificate-confetti-piece {
  animation: certificateConfettiFall var(--confetti-duration) cubic-bezier(0.18, 0.75, 0.35, 1) var(--confetti-delay) both;
}
.certificate-popup-panel { animation: certificatePopIn 420ms cubic-bezier(0.2, 0.8, 0.2, 1) both; }
@media (prefers-reduced-motion: reduce) {
  .certificate-confetti-layer { display: none !important; }
  .certificate-popup-panel { animation: none !important; }
}
`;

function CelebrationConfetti({ run }: { run: number }) {
  return (
    <div key={run} className="certificate-confetti-layer pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden>
      {Array.from({ length: 72 }, (_, index) => {
        const style = {
          left: `${(index * 47 + 9) % 100}%`,
          width: `${6 + (index % 4) * 2}px`,
          height: `${10 + (index % 3) * 4}px`,
          borderRadius: index % 3 === 0 ? "999px" : "2px",
          backgroundColor: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
          ["--confetti-drift" as string]: `${((index * 29) % 31) - 15}vw`,
          ["--confetti-spin" as string]: `${540 + (index % 5) * 180}deg`,
          ["--confetti-duration" as string]: `${2.8 + (index % 6) * 0.24}s`,
          ["--confetti-delay" as string]: `${(index % 12) * 0.055}s`,
        } as CSSProperties;
        return <span key={index} className="certificate-confetti-piece absolute -top-8" style={style} />;
      })}
    </div>
  );
}

function CertificateCelebration({
  open,
  onClose,
  score,
  certId,
  confettiRun,
}: {
  open: boolean;
  onClose: () => void;
  score: number;
  certId: string;
  confettiRun: number;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      previousFocus?.focus();
    };
  }, [onClose, open]);

  return (
    <div
      className={cn(
        "fixed inset-0 z-[80] place-items-center overflow-y-auto bg-black/75 p-3 backdrop-blur-sm sm:p-6",
        open ? "grid" : "hidden"
      )}
      role="dialog"
      aria-modal="true"
      aria-labelledby="certificate-celebration-title"
      aria-hidden={!open}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: CELEBRATION_STYLES }} />
      {open && <CelebrationConfetti run={confettiRun} />}
      <div
        key="certificate-panel"
        className="certificate-popup-panel relative z-10 my-auto w-full max-w-4xl overflow-hidden rounded-2xl border border-accent/40 bg-bg shadow-[0_24px_80px_rgba(0,0,0,0.45)]"
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4 sm:px-7">
          <div>
            <p className="font-mono text-label uppercase tracking-[0.18em] text-green-soft">Perfect score · 5/5</p>
            <h2 id="certificate-celebration-title" className="mt-1 font-display text-xl font-semibold text-text sm:text-2xl">
              Your certificate is ready
            </h2>
            <p className="mt-1 text-sm text-text-muted">Add your name below, then claim your personalised credential.</p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-line text-text-muted transition-colors hover:border-accent/50 hover:text-text"
            aria-label="Close certificate"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="max-h-[calc(100vh-8rem)] overflow-y-auto p-3 sm:p-5">
          <CertificateStudio score={score} presetCertId={certId} />
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone: "good" | "muted" }) {
  return (
    <div className="rounded-lg border border-line bg-bg-2/50 px-2 py-2.5">
      <div
        className={cn(
          "font-display text-xl font-semibold tabular-nums",
          tone === "good" ? "text-accent" : "text-text"
        )}
      >
        {value}
      </div>
      <div className="font-mono text-[9px] uppercase tracking-wider text-text-faint">{label}</div>
    </div>
  );
}

function ScoreRing({ pct, pass }: { pct: number; pass: boolean }) {
  const R = 50;
  const C = 2 * Math.PI * R;
  return (
    <div className="relative grid h-32 w-32 place-items-center">
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
        <circle cx="60" cy="60" r={R} fill="none" stroke="var(--line)" strokeWidth="8" />
        <motion.circle
          cx="60"
          cy="60"
          r={R}
          fill="none"
          stroke={pass ? "var(--green)" : "var(--accent)"}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={C}
          initial={{ strokeDashoffset: C }}
          animate={{ strokeDashoffset: C - (C * pct) / 100 }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute text-center">
        <div className="font-display text-3xl font-semibold tabular-nums text-text">{pct}%</div>
        <div className="font-mono text-[9px] uppercase tracking-wider text-text-faint">score</div>
      </div>
    </div>
  );
}
