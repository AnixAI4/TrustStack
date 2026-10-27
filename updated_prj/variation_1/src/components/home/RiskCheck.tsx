"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Check, MinusCircle, AlertTriangle, ArrowUpRight, Info } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Tooltip } from "@/components/ui/Tooltip";
import { cn } from "@/lib/cn";
import { notifyProgressUpdate } from "@/lib/progress";
import { storageGetJSON, storageSetJSON } from "@/lib/safe-storage";
import { RISK_EXPLAINERS } from "@/content/risk-explainers";
import { RiskGuideModal } from "@/components/home/RiskGuide";

type Status = "covered" | "progress" | "gap" | null;

const OPTIONS: { key: Exclude<Status, null>; labelKey: string; tipKey: string; icon: typeof Check }[] = [
  { key: "covered", labelKey: "opt_covered", tipKey: "tip_covered", icon: Check },
  { key: "progress", labelKey: "opt_progress", tipKey: "tip_progress", icon: MinusCircle },
  { key: "gap", labelKey: "opt_gap", tipKey: "tip_gap", icon: AlertTriangle },
];

const STORE = "dpdp-risk-v1";

export function RiskCheck() {
  const t = useTranslations("risk");
  const fallbackQuestions = t.raw("questions") as string[];
  const [dbQuestions, setDbQuestions] = useState<string[] | null>(null);
  const questions = dbQuestions ?? fallbackQuestions;
  const total = questions.length;
  const [explainIndex, setExplainIndex] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Status[]>(() =>
    Array(fallbackQuestions.length).fill(null)
  );

  // Pull the risk-assessment prompts from their own Supabase table; fall back
  // to the bundled list if Supabase is unconfigured, unreachable, or empty.
  useEffect(() => {
    if (!supabase) return;
    let active = true;
    supabase
      .from("risk_assessment")
      .select("prompt")
      .order("sort_order", { ascending: true })
      .then(({ data, error }) => {
        if (!active || error || !data || data.length === 0) return;
        const prompts = data.map((r) => (r as { prompt: string }).prompt);
        setDbQuestions(prompts);
        setAnswers((prev) =>
          prev.length === prompts.length ? prev : Array(prompts.length).fill(null)
        );
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const parsed = storageGetJSON<Status[] | null>(STORE, null);
    if (Array.isArray(parsed) && parsed.length === total) setAnswers(parsed);
  }, [total]);

  const set = (i: number, s: Exclude<Status, null>) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[i] = prev[i] === s ? null : s;
      storageSetJSON(STORE, next);
      notifyProgressUpdate();
      return next;
    });
  };

  const tally = useMemo(() => {
    const t = { covered: 0, progress: 0, gap: 0, unanswered: 0 };
    answers.forEach((a) => {
      if (a === "covered") t.covered++;
      else if (a === "progress") t.progress++;
      else if (a === "gap") t.gap++;
      else t.unanswered++;
    });
    return t;
  }, [answers]);

  const readiness = Math.round(
    ((tally.covered + tally.progress * 0.5) / total) * 100
  );
  const started = tally.unanswered < total;

  const band =
    !started || readiness < 40
      ? { color: "var(--red)", label: started ? t("band_high") : t("band_start") }
      : readiness < 70
        ? { color: "var(--amber)", label: t("band_developing") }
        : readiness < 90
          ? { color: "var(--blue)", label: t("band_strong") }
          : { color: "var(--green)", label: t("band_ready") };

  const R = 54;
  const C = 2 * Math.PI * R;

  return (
    <section id="risk-check" className="section relative scroll-mt-24">
      <div className="container-x">
        <SectionHeader
          eyebrow={t("eyebrow")}
          title={t("heading")}
          lede={t("subheading")}
        />

        <div className="mt-12 grid gap-6 lg:grid-cols-[1fr_360px]">
          <p className="flex flex-wrap items-center gap-2 text-xs text-text-muted lg:col-span-2">
            <span className="font-semibold uppercase tracking-[0.05em] text-text-muted">Mark each question:</span>
            {OPTIONS.map((o) => {
              const Icon = o.icon;
              return (
                <Tooltip key={o.key} label={t(o.tipKey)}>
                  <span className="inline-flex items-center gap-1 rounded-pill border border-line bg-surface-2/60 px-2.5 py-1">
                    <Icon className="h-3.5 w-3.5 text-text-muted" />
                    {t(o.labelKey)}
                  </span>
                </Tooltip>
              );
            })}
          </p>

          {/* questions */}
          <ol className="space-y-3">
            {questions.map((q, i) => (
              <li
                key={i}
                className="rounded-lg border border-line bg-surface-2/40 p-4 transition-colors md:flex md:items-start md:justify-between md:gap-4"
              >
                <div className="flex min-w-0 flex-1 gap-3">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md border border-line font-mono text-xs text-text-faint">
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm leading-relaxed text-text">{q}</p>
                    {RISK_EXPLAINERS[i] && (
                      <button
                        type="button"
                        onClick={() => setExplainIndex(i)}
                        aria-label={`What does question ${i + 1} mean? Explain in plain English`}
                        className="mt-2 inline-flex items-center gap-1.5 rounded-pill border border-line bg-bg-2/70 px-2.5 py-1 text-label font-medium text-text-muted transition-colors hover:border-accent/50 hover:bg-accent/10 hover:text-accent"
                      >
                        <Info className="h-3.5 w-3.5 text-accent" />
                        What does this mean?
                      </button>
                    )}
                  </div>
                </div>
                <div className="mt-3 flex w-full min-w-0 flex-wrap gap-1.5 md:mt-0 md:w-auto md:max-w-[min(100%,22rem)] md:justify-end md:shrink-0">
                  {OPTIONS.map((o) => {
                    const active = answers[i] === o.key;
                    const Icon = o.icon;
                    return (
                      <Tooltip
                        key={o.key}
                        label={active ? t("tip_clear") : t(o.tipKey)}
                      >
                        <button
                          type="button"
                          onClick={() => set(i, o.key)}
                          aria-pressed={active}
                          aria-label={t(o.labelKey)}
                          className={cn(
                            "inline-flex max-w-full items-center gap-1.5 rounded-pill border px-2.5 py-2 text-xs font-semibold transition-all sm:px-3 sm:text-sm",
                            active
                              ? o.key === "covered"
                                ? "border-green/60 bg-green/20 text-green-soft"
                                : o.key === "progress"
                                  ? "border-amber/60 bg-amber/20 text-amber"
                                  : "border-red/60 bg-red/20 text-red-soft"
                              : "border-line bg-bg-2/80 text-text-muted hover:border-accent/50 hover:bg-surface-2 hover:text-text"
                          )}
                        >
                          <Icon className="h-4 w-4 shrink-0" />
                          <span className="truncate">{t(o.labelKey)}</span>
                        </button>
                      </Tooltip>
                    );
                  })}
                </div>
              </li>
            ))}
          </ol>

          {/* live board */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="glass rounded-xl p-6">
              <div className="relative mx-auto grid h-44 w-44 place-items-center">
                <svg viewBox="0 0 128 128" className="h-full w-full -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r={R}
                    fill="none"
                    stroke="var(--line)"
                    strokeWidth="10"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r={R}
                    fill="none"
                    stroke={band.color}
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={C}
                    strokeDashoffset={C - (C * readiness) / 100}
                    style={{ transition: "stroke-dashoffset .6s var(--ease), stroke .3s" }}
                  />
                </svg>
                <div className="absolute inset-[22%] flex flex-col items-center justify-center text-center">
                  <div className="font-display text-3xl font-semibold leading-none text-text">
                    {readiness}
                    <span className="text-lg text-text-faint">%</span>
                  </div>
                  <div
                    className="mt-1.5 max-w-full text-[10px] font-semibold uppercase leading-snug tracking-[0.04em]"
                    style={{ color: band.color }}
                  >
                    {band.label}
                  </div>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-2.5 text-center">
                <Stat n={tally.covered} label={t("opt_covered")} tone="green" />
                <Stat n={tally.progress} label={t("opt_progress")} tone="amber" />
                <Stat n={tally.gap} label={t("stat_gaps")} tone="red" />
                <Stat n={tally.unanswered} label={t("stat_unanswered")} tone="neutral" />
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-line bg-surface-2/40 p-5">
              <p className="text-sm leading-relaxed text-text-muted">
                {t("cta_text")}
              </p>
              <div className="mt-4 flex flex-col gap-2">
                <Link href="/solutions" className="btn btn-accent w-full">
                  {t("cta_primary")}
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
                <Link href="/framework" className="btn btn-ghost w-full">
                  {t("cta_secondary")}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <RiskGuideModal
        open={explainIndex !== null}
        explainer={explainIndex !== null ? RISK_EXPLAINERS[explainIndex] ?? null : null}
        questionNumber={(explainIndex ?? 0) + 1}
        onClose={() => setExplainIndex(null)}
      />
    </section>
  );
}

const STAT_TONES = {
  green: { num: "text-green", card: "border-green/25 bg-green/[0.06]" },
  amber: { num: "text-amber", card: "border-amber/25 bg-amber/[0.06]" },
  red: { num: "text-red", card: "border-red/25 bg-red/[0.06]" },
  neutral: { num: "text-text", card: "border-line bg-bg-2/40" },
} as const;

function Stat({
  n,
  label,
  tone,
}: {
  n: number;
  label: string;
  tone: keyof typeof STAT_TONES;
}) {
  const s = STAT_TONES[tone];
  return (
    <div className={cn("rounded-lg border py-3.5", s.card)}>
      <div
        className={cn(
          "font-display text-3xl font-bold leading-none tabular-nums",
          s.num
        )}
      >
        {n}
      </div>
      <div className="mt-1.5 text-label font-semibold uppercase tracking-[0.05em] text-text-muted">
        {label}
      </div>
    </div>
  );
}
