"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Play,
  RotateCcw,
  Radar,
  Database,
  Boxes,
  Building2,
  Globe2,
  ShieldAlert,
  IndianRupee,
  Route,
  Check,
  ArrowUpRight,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { cn } from "@/lib/cn";
import { EASE } from "@/lib/motion";
import {
  DEMO_SCENARIOS,
  type DemoScenario,
  type DemoSeverity,
} from "@/content/demo";

// ── Stage machine ────────────────────────────────────────────────────
const STAGES = ["discover", "assess", "quantify", "roadmap", "done"] as const;
type Stage = (typeof STAGES)[number];

const STAGE_MS: Record<Stage, number> = {
  discover: 2600,
  assess: 3400,
  quantify: 2800,
  roadmap: 2600,
  done: 0,
};

const STATUS: Record<Stage, string> = {
  discover: "Mapping personal data across your systems…",
  assess: "Checking against DPDP Act 2023 + Rules 2025…",
  quantify: "Pricing your regulatory exposure…",
  roadmap: "Generating your 90-day remediation roadmap…",
  done: "Assessment complete.",
};

const RAIL: { key: Stage; label: string; icon: LucideIcon }[] = [
  { key: "discover", label: "Discover", icon: Radar },
  { key: "assess", label: "Assess", icon: ShieldAlert },
  { key: "quantify", label: "Quantify", icon: IndianRupee },
  { key: "roadmap", label: "Roadmap", icon: Route },
];

const SEV: Record<DemoSeverity, { label: string; badge: string; dot: string }> = {
  critical: { label: "Critical", badge: "border-red/40 bg-red/10 text-red-soft", dot: "bg-red" },
  high: { label: "High", badge: "border-amber/40 bg-amber/10 text-amber", dot: "bg-amber" },
  medium: { label: "Medium", badge: "border-blue/40 bg-blue/10 text-blue", dot: "bg-blue" },
};

const PANEL = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
  transition: { duration: 0.4, ease: EASE },
};

// Count a number up to `target` while `run` is true. Falls back to the final
// value instantly for reduced-motion users.
function useCountUp(target: number, run: boolean, ms = 1000) {
  const [val, setVal] = useState(0);
  const reduce = useReducedMotion();
  useEffect(() => {
    if (!run) {
      setVal(0);
      return;
    }
    if (reduce) {
      setVal(target);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / ms);
      const eased = 1 - Math.pow(1 - t, 3);
      setVal(target * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
      else setVal(target);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, run, ms, reduce]);
  return val;
}

function Stat({ icon: Icon, value, label }: { icon: LucideIcon; value: number; label: string }) {
  return (
    <div className="rounded-lg border border-line bg-bg-2/50 p-3 text-center">
      <Icon className="mx-auto h-4 w-4 text-accent" />
      <div className="mt-1 font-display text-2xl font-semibold tabular-nums text-text">{value}</div>
      <div className="font-mono text-label uppercase tracking-wider text-text-faint">{label}</div>
    </div>
  );
}

function Gauge({ value }: { value: number }) {
  const v = useCountUp(value, true, 1400);
  const R = 46;
  const C = 2 * Math.PI * R;
  const band = value < 40 ? "var(--red)" : value < 75 ? "var(--amber)" : "var(--green)";
  return (
    <div className="relative mx-auto grid h-32 w-32 place-items-center">
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
        <circle cx="60" cy="60" r={R} fill="none" stroke="var(--line)" strokeWidth="9" />
        <circle
          cx="60"
          cy="60"
          r={R}
          fill="none"
          stroke={band}
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={C - (C * v) / 100}
        />
      </svg>
      <div className="absolute text-center">
        <div className="font-display text-2xl font-semibold tabular-nums text-text">
          {Math.round(v)}
          <span className="text-sm text-text-faint">%</span>
        </div>
        <div className="font-mono text-[9px] uppercase tracking-wider text-text-faint">Readiness</div>
      </div>
    </div>
  );
}

// ── Per-stage panels ─────────────────────────────────────────────────
function IdlePanel({ s, onPlay }: { s: DemoScenario; onPlay: () => void }) {
  const Icon = s.icon;
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-xl border border-accent/30 bg-accent/10 text-accent">
        <Icon className="h-7 w-7" />
      </span>
      <h3 className="mt-4 font-display text-lg font-semibold text-text">
        Assess a {s.industry.toLowerCase()} company
      </h3>
      <p className="mt-1 max-w-sm text-sm text-text-muted">
        Watch TrustStack map data, find DPDP gaps, price the risk and build a roadmap - in seconds.
      </p>
      <button type="button" onClick={onPlay} className="btn btn-accent mt-4">
        <Play className="h-4 w-4" /> Run live demo
      </button>
    </div>
  );
}

function DiscoverPanel({ s }: { s: DemoScenario }) {
  const fields = useCountUp(s.fields, true, 1100);
  const systems = useCountUp(s.systems, true, 1100);
  const vendors = useCountUp(s.vendors, true, 1100);
  return (
    <div>
      <div className="grid grid-cols-3 gap-3">
        <Stat icon={Database} value={Math.round(fields)} label="Data fields" />
        <Stat icon={Boxes} value={Math.round(systems)} label="Systems" />
        <Stat icon={Building2} value={Math.round(vendors)} label="Vendors" />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {s.dataTypes.map((d, i) => (
          <motion.span
            key={d}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15 + i * 0.09, ease: EASE }}
            className="rounded-pill border border-line bg-bg-2/60 px-2.5 py-1 text-xs text-text-muted"
          >
            {d}
          </motion.span>
        ))}
      </div>
      <p className="mt-4 flex items-center gap-2 text-xs text-text-muted">
        <Globe2 className="h-3.5 w-3.5 text-accent" />
        {s.crossBorder} cross-border data flows detected
      </p>
    </div>
  );
}

function AssessPanel({ s }: { s: DemoScenario }) {
  const obligations = useCountUp(s.obligations, true, 900);
  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-text-muted">
          <span className="font-semibold tabular-nums text-text">{Math.round(obligations)}</span>{" "}
          obligations checked
        </span>
        <span className="font-semibold text-red-soft">{s.gaps.length} gaps found</span>
      </div>
      <ul className="mt-3 space-y-2">
        {s.gaps.map((g, i) => (
          <motion.li
            key={g.label}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 + i * 0.22, ease: EASE }}
            className="flex items-center justify-between gap-3 rounded-lg border border-line bg-surface-2/40 px-3 py-2.5"
          >
            <span className="flex min-w-0 items-center gap-2.5">
              <span className={cn("h-2 w-2 shrink-0 rounded-full", SEV[g.severity].dot)} />
              <span className="truncate text-sm text-text">{g.label}</span>
            </span>
            <span className="flex shrink-0 items-center gap-2">
              <span className="hidden font-mono text-label text-text-faint sm:inline">{g.ref}</span>
              <span
                className={cn(
                  "rounded-pill border px-2 py-0.5 text-label font-semibold",
                  SEV[g.severity].badge
                )}
              >
                {SEV[g.severity].label}
              </span>
            </span>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}

function QuantifyPanel({ s }: { s: DemoScenario }) {
  const exp = useCountUp(s.exposureCr, true, 1400);
  return (
    <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
      <div>
        <div className="font-mono text-label uppercase tracking-wider text-text-faint">
          Estimated penalty exposure
        </div>
        <div className="mt-1 font-display text-4xl font-semibold text-text sm:text-5xl">
          ₹{Math.round(exp)}
          <span className="ml-1 text-2xl text-text-faint">Cr</span>
        </div>
        <p className="mt-2 max-w-sm text-xs text-text-muted">
          Modelled from the gaps above against the Act&apos;s penalty schedule (up to ₹250 Cr).
          Indicative - never legal advice.
        </p>
      </div>
      <Gauge value={s.readiness} />
    </div>
  );
}

function RoadmapPanel({ s }: { s: DemoScenario }) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {s.roadmap.map((p, i) => (
        <motion.div
          key={p.window}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.18, ease: EASE }}
          className="rounded-lg border border-line bg-surface-2/40 p-4"
        >
          <div className="font-mono text-label uppercase tracking-wider text-accent">{p.window}</div>
          <div className="mt-0.5 font-display text-sm font-semibold text-text">{p.title}</div>
          <ul className="mt-2 space-y-1.5">
            {p.items.map((it) => (
              <li key={it} className="flex items-start gap-1.5 text-xs text-text-muted">
                <Check className="mt-0.5 h-3 w-3 shrink-0 text-green" />
                <span>{it}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      ))}
    </div>
  );
}

function Summary({ value, label, tone }: { value: string; label: string; tone: string }) {
  return (
    <div className="rounded-lg border border-line bg-bg-2/50 p-3 text-center">
      <div className={cn("font-display text-xl font-semibold tabular-nums", tone)}>{value}</div>
      <div className="font-mono text-label uppercase tracking-wider text-text-faint">{label}</div>
    </div>
  );
}

function ResultPanel({ s }: { s: DemoScenario }) {
  return (
    <div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Summary value={`${s.readiness}%`} label="Readiness" tone="text-text" />
        <Summary value={`₹${s.exposureCr} Cr`} label="Exposure" tone="text-red-soft" />
        <Summary value={`${s.gaps.length}`} label="Gaps found" tone="text-amber" />
        <Summary value="90 days" label="To compliant" tone="text-green-soft" />
      </div>
      <div className="mt-5 rounded-xl border border-accent/30 bg-accent/[0.06] p-5 text-center">
        <h3 className="font-display text-lg font-semibold text-text sm:text-xl">
          That was a simulation. Get your real {s.industry} assessment.
        </h3>
        <p className="mx-auto mt-1.5 max-w-md text-sm text-text-muted">
          A board-ready DPDP gap assessment mapped to the Act &amp; Rules 2025 - with a costed
          remediation plan and evidence you can show the regulator.
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          <Link href="/solutions" className="btn btn-accent">
            Book your assessment
            <ArrowUpRight className="h-4 w-4" />
          </Link>
          <Link href="/#risk-check" className="btn btn-ghost">
            Run the free risk check
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── Main showcase ────────────────────────────────────────────────────
export function SmartDemo({ id }: { id?: string }) {
  const [activeKey, setActiveKey] = useState(DEMO_SCENARIOS[0].key);
  const [stageIndex, setStageIndex] = useState(-1);
  const startedRef = useRef(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  const scenario = DEMO_SCENARIOS.find((x) => x.key === activeKey) ?? DEMO_SCENARIOS[0];
  const stage: Stage | "idle" = stageIndex < 0 ? "idle" : STAGES[stageIndex];

  // Advance the stage machine on a timer (state-driven, not rAF, so it runs
  // regardless of tab visibility). Restarts whenever the scenario changes.
  useEffect(() => {
    if (stageIndex < 0 || stage === "done") return;
    const t = setTimeout(
      () => setStageIndex((i) => Math.min(i + 1, STAGES.length - 1)),
      STAGE_MS[stage as Stage]
    );
    return () => clearTimeout(t);
  }, [stageIndex, activeKey, stage]);

  // Auto-start once the console scrolls into view.
  useEffect(() => {
    const el = rootRef.current;
    if (!el || startedRef.current) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !startedRef.current) {
          startedRef.current = true;
          setStageIndex(0);
          io.disconnect();
        }
      },
      { threshold: 0.25 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const play = useCallback(() => {
    startedRef.current = true;
    setStageIndex(0);
  }, []);

  const selectIndustry = (key: string) => {
    setActiveKey(key);
    startedRef.current = true;
    setStageIndex(0);
  };

  return (
    <section id={id} ref={rootRef} className="section scroll-mt-24">
      <div className="container-x">
        <SectionHeader
          eyebrow="Live demo"
          title={
            <>
              See TrustStack find your <span className="gradient-text">DPDP gaps</span> in seconds
            </>
          }
          lede="Pick your industry and watch our engine map your data, surface the gaps, price the risk and build a 90-day roadmap - a live preview of the real assessment."
        />

        {/* industry selector */}
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          {DEMO_SCENARIOS.map((sc) => {
            const Icon = sc.icon;
            const active = sc.key === activeKey;
            return (
              <button
                key={sc.key}
                type="button"
                onClick={() => selectIndustry(sc.key)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-pill border px-3.5 py-2 text-sm font-medium transition-all",
                  active
                    ? "border-accent/60 bg-accent/10 text-text"
                    : "border-line bg-surface-2/40 text-text-muted hover:border-accent/40 hover:text-text"
                )}
              >
                <Icon className={cn("h-4 w-4", active ? "text-accent" : "text-text-faint")} />
                {sc.industry}
              </button>
            );
          })}
        </div>

        {/* console */}
        <div className="mx-auto mt-8 max-w-4xl overflow-hidden rounded-2xl border border-line bg-surface-2/30 shadow-card">
          {/* title bar */}
          <div className="flex items-center justify-between gap-3 border-b border-line bg-bg-2/40 px-4 py-3">
            <div className="flex items-center gap-2.5">
              <span className="flex gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-red/60" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber/60" />
                <span className="h-2.5 w-2.5 rounded-full bg-green/60" />
              </span>
              <span className="font-mono text-xs text-text-muted">
                truststack · live assessment - <span className="text-text">{scenario.industry}</span>
              </span>
            </div>
            <button
              type="button"
              onClick={play}
              className="inline-flex items-center gap-1.5 rounded-pill border border-line px-2.5 py-1 text-xs text-text-muted transition-colors hover:border-accent/40 hover:text-text"
            >
              {stage === "done" ? <RotateCcw className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              {stage === "done" ? "Replay" : "Restart"}
            </button>
          </div>

          {/* stage rail */}
          <div className="flex items-center border-b border-line px-4 py-3">
            {RAIL.map((r, i) => {
              const Icon = r.icon;
              const done = stageIndex > i || stage === "done";
              const current = stageIndex === i && stage !== "done";
              return (
                <div key={r.key} className="flex flex-1 items-center">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 text-label font-semibold transition-colors",
                      done ? "text-green-soft" : current ? "text-accent" : "text-text-faint"
                    )}
                  >
                    <span
                      className={cn(
                        "grid h-5 w-5 place-items-center rounded-full border transition-colors",
                        done
                          ? "border-green/40 bg-green/15"
                          : current
                            ? "border-accent/50 bg-accent/15"
                            : "border-line bg-glass"
                      )}
                    >
                      {done ? <Check className="h-3 w-3" /> : <Icon className="h-3 w-3" />}
                    </span>
                    <span className="hidden sm:inline">{r.label}</span>
                  </span>
                  {i < RAIL.length - 1 && (
                    <span className="relative mx-2 h-px flex-1 overflow-hidden rounded-full bg-line">
                      <motion.span
                        aria-hidden
                        className="absolute inset-0 origin-left bg-accent"
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: done ? 1 : 0 }}
                        transition={{ duration: 0.4, ease: EASE }}
                      />
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* status line */}
          <div className="flex items-center gap-2 px-4 py-3 text-xs">
            {stage === "done" ? (
              <Check className="h-3.5 w-3.5 shrink-0 text-green" />
            ) : stage === "idle" ? (
              <Sparkles className="h-3.5 w-3.5 shrink-0 text-accent" />
            ) : reduce ? (
              <Radar className="h-3.5 w-3.5 shrink-0 text-accent" />
            ) : (
              <span className="h-3.5 w-3.5 shrink-0 animate-[spin-slow_1s_linear_infinite] rounded-full border-2 border-accent border-t-transparent" />
            )}
            <span className="font-mono text-text-muted">
              {stage === "idle" ? "Ready - press play or scroll to begin" : STATUS[stage as Stage]}
            </span>
          </div>

          {/* body */}
          <div className="min-h-[300px] px-4 pb-5 pt-1 sm:px-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={`${activeKey}-${stage}`}
                initial={PANEL.initial}
                animate={PANEL.animate}
                exit={PANEL.exit}
                transition={PANEL.transition}
              >
                {stage === "idle" && <IdlePanel s={scenario} onPlay={play} />}
                {stage === "discover" && <DiscoverPanel s={scenario} />}
                {stage === "assess" && <AssessPanel s={scenario} />}
                {stage === "quantify" && <QuantifyPanel s={scenario} />}
                {stage === "roadmap" && <RoadmapPanel s={scenario} />}
                {stage === "done" && <ResultPanel s={scenario} />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <p className="mx-auto mt-4 max-w-2xl text-center text-xs text-text-faint">
          Simulated preview using illustrative data - computed entirely in your browser, nothing
          uploaded. Your real assessment reflects your actual systems.
        </p>
      </div>
    </section>
  );
}
