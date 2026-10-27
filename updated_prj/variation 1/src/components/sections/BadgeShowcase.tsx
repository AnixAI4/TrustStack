"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Footprints,
  ShieldCheck,
  Calculator,
  Cookie,
  FileText,
  GraduationCap,
  Bot,
  Trophy,
  RotateCcw,
  Play,
  Sparkles,
  ArrowUpRight,
  type LucideIcon,
} from "lucide-react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { cn } from "@/lib/cn";
import { EASE } from "@/lib/motion";

type Badge = { name: string; action: string; scoreAt: number; icon: LucideIcon };

// The 8 badges, in the order a real journey earns them. `scoreAt` is the
// readiness score the ring climbs to as each one unlocks (ends at 100).
const BADGES: Badge[] = [
  { name: "First steps", action: "Started the journey", scoreAt: 10, icon: Footprints },
  { name: "Risk Assessor", action: "Completed the risk self-assessment", scoreAt: 28, icon: ShieldCheck },
  { name: "Number Cruncher", action: "Modelled penalty exposure", scoreAt: 43, icon: Calculator },
  { name: "Privacy Conscious", action: "Set consent preferences", scoreAt: 55, icon: Cookie },
  { name: "Document Master", action: "Generated a DPDP document", scoreAt: 70, icon: FileText },
  { name: "Quiz Whiz", action: "Passed the DPDP quiz", scoreAt: 82, icon: GraduationCap },
  { name: "Curious Mind", action: "Asked TrustChat 3 questions", scoreAt: 90, icon: Bot },
  { name: "Compliance Champion", action: "Reached compliance-ready", scoreAt: 100, icon: Trophy },
];

const STEP_MS = 950;
const R = 54;
const C = 2 * Math.PI * R;

export function BadgeShowcase({ id }: { id?: string }) {
  const reduce = useReducedMotion();
  const [earned, setEarned] = useState(0);
  const startedRef = useRef(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const lastUnlocked = earned - 1;
  const done = earned >= BADGES.length;
  const score = earned === 0 ? 0 : BADGES[earned - 1].scoreAt;
  const band = score < 40 ? "var(--red)" : score < 75 ? "var(--amber)" : "var(--green)";

  // Step the simulation: unlock one badge every STEP_MS until all are earned.
  // Timer-based (not rAF) so it runs regardless of tab visibility.
  useEffect(() => {
    if (earned <= 0 || done) return;
    const t = setTimeout(() => setEarned((n) => Math.min(n + 1, BADGES.length)), STEP_MS);
    return () => clearTimeout(t);
  }, [earned, done]);

  // Auto-play once the section scrolls into view.
  useEffect(() => {
    const el = rootRef.current;
    if (!el || startedRef.current) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !startedRef.current) {
          startedRef.current = true;
          setEarned(reduce ? BADGES.length : 1);
          io.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduce]);

  const play = useCallback(() => {
    startedRef.current = true;
    setEarned(reduce ? BADGES.length : 1);
  }, [reduce]);

  return (
    <section id={id} ref={rootRef} className="section scroll-mt-24">
      <div className="container-x">
        <SectionHeader
          eyebrow="Gamified journey"
          title={
            <>
              Earn badges as you get <span className="gradient-text">DPDP-ready</span>
            </>
          }
          lede="Every tool you use lifts your readiness score and earns a badge. Here's the whole journey - watch it play, then start earning your own."
        />

        <div className="mt-12 grid gap-6 lg:grid-cols-[340px_1fr]">
          {/* left - readiness ring, meter, replay, CTA */}
          <div className="glass rounded-xl p-6">
            <div className="relative mx-auto grid h-44 w-44 place-items-center">
              <svg viewBox="0 0 128 128" className="h-full w-full -rotate-90">
                <circle cx="64" cy="64" r={R} fill="none" stroke="var(--line)" strokeWidth="10" />
                <circle
                  cx="64"
                  cy="64"
                  r={R}
                  fill="none"
                  stroke={band}
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={C}
                  strokeDashoffset={C - (C * score) / 100}
                  style={{ transition: "stroke-dashoffset .7s var(--ease), stroke .3s" }}
                />
              </svg>
              <div className="absolute text-center">
                <div className="font-display text-4xl font-semibold tabular-nums text-text">
                  {score}
                  <span className="text-xl text-text-faint">%</span>
                </div>
                <div className="mt-0.5 font-mono text-label uppercase tracking-wider text-text-faint">
                  {done ? "Compliance-ready" : earned === 0 ? "Ready to start" : "Leveling up"}
                </div>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between text-sm">
              <span className="font-mono text-label uppercase tracking-wider text-text-faint">Badges</span>
              <span className="tabular-nums text-text-muted">
                <span className="font-semibold text-gold">{earned}</span> / {BADGES.length}
              </span>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-pill bg-line/70">
              <motion.div
                className="h-full rounded-pill bg-gradient-to-r from-gold/60 to-gold"
                initial={false}
                animate={{ width: `${(earned / BADGES.length) * 100}%` }}
                transition={{ duration: 0.5, ease: EASE }}
              />
            </div>

            <button onClick={play} className="btn btn-ghost mt-5 w-full text-xs">
              {earned > 0 ? <RotateCcw className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {done ? "Replay journey" : earned > 0 ? "Restart" : "Play journey"}
            </button>

            <AnimatePresence>
              {done && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4, ease: EASE }}
                  className="mt-4 rounded-lg border border-accent/30 bg-accent/[0.06] p-4 text-center"
                >
                  <p className="text-sm text-text-muted">
                    Start your own journey - the free risk check earns your{" "}
                    <span className="text-text">first badge</span>.
                  </p>
                  <Link href="/#risk-check" className="btn btn-accent mt-3 w-full text-xs">
                    Earn your first badge
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* right - live unlock line + badge grid */}
          <div>
            <div className="min-h-[2rem]">
              <AnimatePresence mode="wait">
                {lastUnlocked >= 0 && (
                  <motion.div
                    key={done ? "done" : lastUnlocked}
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.35, ease: EASE }}
                    className="flex items-center gap-2 text-sm font-semibold text-gold"
                  >
                    <Sparkles className="h-4 w-4 shrink-0" />
                    {done ? (
                      <span>All 8 badges earned - compliance-ready!</span>
                    ) : (
                      <span>
                        {BADGES[lastUnlocked].action} - {" "}
                        <span className="text-text">{BADGES[lastUnlocked].name}</span> unlocked
                      </span>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {BADGES.map((b, i) => {
                const got = i < earned;
                const isNew = got && i === lastUnlocked;
                const celebrate = isNew && !reduce;
                const Icon = b.icon;
                return (
                  <motion.div
                    key={b.name}
                    title={b.action}
                    initial={false}
                    animate={celebrate ? { scale: [0.7, 1.14, 1] } : { scale: 1 }}
                    transition={{ duration: 0.6, ease: EASE }}
                    className={cn(
                      "relative overflow-hidden rounded-xl border p-4 text-center transition-colors duration-500",
                      got ? "border-gold/45 bg-gold/10" : "border-line bg-bg-2/40 opacity-55"
                    )}
                  >
                    {celebrate && (
                      <motion.span
                        aria-hidden
                        className="pointer-events-none absolute inset-0 rounded-xl border-2 border-gold"
                        initial={{ opacity: 0.75 }}
                        animate={{ opacity: 0 }}
                        transition={{ duration: 0.9, ease: "easeOut" }}
                      />
                    )}
                    {celebrate && (
                      <motion.span
                        aria-hidden
                        className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                        initial={{ x: "-30%", opacity: 0 }}
                        animate={{ x: "320%", opacity: [0, 1, 0] }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                      />
                    )}
                    <span
                      className={cn(
                        "relative mx-auto grid h-10 w-10 place-items-center rounded-full transition-colors",
                        got ? "bg-gold/20 text-gold" : "bg-glass text-text-faint"
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <span
                      className={cn(
                        "relative mt-2 block text-label font-semibold leading-tight transition-colors",
                        isNew ? "text-gold" : got ? "text-text" : "text-text-faint"
                      )}
                    >
                      {b.name}
                    </span>
                  </motion.div>
                );
              })}
            </div>

            <p className="mt-4 text-xs text-text-faint">
              A live preview of TrustStack&apos;s gamified journey - earn all eight as you complete the
              tools. Your real progress saves privately in your browser, never uploaded.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
