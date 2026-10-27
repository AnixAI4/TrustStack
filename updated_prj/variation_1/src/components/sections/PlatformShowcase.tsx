"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowUpRight,
  Bell,
  Wifi,
  BatteryFull,
  CheckCircle2,
  Home,
  ListChecks,
  ShieldCheck,
  ShieldHalf,
  BarChart3,
  Settings,
  Lock,
  User,
} from "lucide-react";
import { FRAMEWORK } from "@/content/dpdp";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { CountUp } from "@/components/ui/CountUp";
import { EASE } from "@/lib/motion";

/* illustrative progress per discipline (Discover → Drive) */
const PROGRESS = [100, 100, 70, 30, 0, 0, 0];

const BULLETS = [
  "Live readiness across all seven disciplines",
  "Evidence vault and audit trail on the go",
  "Board-ready maturity score, updated continuously",
];

function ScoreRing({
  value,
  px,
  gradId,
}: {
  value: number;
  px: number;
  gradId: string;
}) {
  const stroke = Math.max(5, Math.round(px * 0.085));
  const cx = px / 2;
  const r = cx - stroke / 2 - 1;
  const c = 2 * Math.PI * r;
  return (
    <div
      className="relative grid shrink-0 place-items-center"
      style={{ height: px, width: px }}
    >
      <svg viewBox={`0 0 ${px} ${px}`} width={px} height={px} className="-rotate-90">
        <circle cx={cx} cy={cx} r={r} fill="none" stroke="var(--line)" strokeWidth={stroke} />
        <motion.circle
          cx={cx}
          cy={cx}
          r={r}
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          whileInView={{ strokeDashoffset: c * (1 - value / 100) }}
          viewport={{ once: true }}
          transition={{ duration: 1.5, ease: EASE }}
        />
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="var(--accent)" />
            <stop offset="1" stopColor="var(--amber)" />
          </linearGradient>
        </defs>
      </svg>
      <div
        className="absolute font-display font-semibold tracking-tight text-text"
        style={{ fontSize: Math.round(px * 0.24) }}
      >
        <CountUp value={value} />%
      </div>
    </div>
  );
}

function MaturityBars() {
  return (
    <div className="flex h-16 gap-1.5">
      {FRAMEWORK.map((s, i) => {
        const p = PROGRESS[i] ?? 0;
        return (
          <div key={s.id} className="flex flex-1 flex-col items-center">
            <div className="relative w-full flex-1 overflow-hidden rounded-sm bg-line/50">
              <motion.div
                className="absolute bottom-0 left-0 w-full rounded-sm bg-gradient-to-t from-accent to-amber"
                initial={{ height: "0%" }}
                whileInView={{ height: `${Math.max(p, 5)}%` }}
                viewport={{ once: true }}
                transition={{ duration: 0.9, delay: 0.1 + i * 0.06, ease: EASE }}
              />
            </div>
            <span className="mt-1 text-[8px] font-medium text-text-faint">{i + 1}</span>
          </div>
        );
      })}
    </div>
  );
}

function LaptopMockup() {
  const nav = [
    { icon: Home, on: true },
    { icon: ListChecks, on: false },
    { icon: ShieldCheck, on: false },
    { icon: BarChart3, on: false },
    { icon: Settings, on: false },
  ];
  const kpis = [
    { k: "Evidence", v: "128" },
    { k: "Open tasks", v: "14" },
    { k: "Rules covered", v: "100%" },
  ];
  return (
    <div className="w-full">
      {/* lid / screen */}
      <div className="relative rounded-t-2xl border border-line bg-gradient-to-b from-[#2c333f] to-[#141a24] p-3 shadow-2xl ring-1 ring-inset ring-white/10">
        {/* webcam */}
        <span className="absolute left-1/2 top-1 h-1 w-1 -translate-x-1/2 rounded-full bg-white/25" />
        <div
          className="relative overflow-hidden rounded-lg bg-bg ring-1 ring-black/40"
          style={{ aspectRatio: "16 / 10.2" }}
        >
          {/* browser bar */}
          <div className="flex items-center gap-2 border-b border-line bg-bg-2 px-3 py-2">
            <span className="flex gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
            </span>
            <div className="mx-auto flex items-center gap-1.5 rounded-md bg-surface-2 px-3 py-1 text-label text-text-faint">
              <Lock className="h-2.5 w-2.5" />
              app.truststack.in/readiness
            </div>
          </div>

          {/* app body */}
          <div className="flex h-[calc(100%-33px)]">
            {/* sidebar */}
            <div className="flex w-11 flex-col items-center gap-3 border-r border-line bg-bg-2 py-3">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-accent/15 text-accent">
                <ShieldHalf className="h-4 w-4" />
              </span>
              <nav className="flex flex-1 flex-col items-center gap-2.5 pt-1">
                {nav.map(({ icon: Icon, on }, k) => (
                  <span
                    key={k}
                    className={`grid h-7 w-7 place-items-center rounded-lg ${
                      on ? "bg-accent/15 text-accent" : "text-text-faint"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                ))}
              </nav>
              <span className="h-6 w-6 rounded-full bg-gradient-to-br from-accent to-amber" />
            </div>

            {/* main */}
            <div className="flex flex-1 flex-col overflow-hidden p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-display text-base font-semibold text-text">
                    DPDP Readiness
                  </h4>
                  <p className="text-label text-text-faint">
                    Acme Corp · updated today
                  </p>
                </div>
                <span className="rounded-full border border-line bg-glass px-2.5 py-1 text-label text-text-muted">
                  Q3 2026
                </span>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="flex items-center gap-3 rounded-xl border border-line bg-surface-2 p-3">
                  <ScoreRing value={72} px={66} gradId="ringLaptop" />
                  <div>
                    <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-text-faint">
                      Readiness
                    </div>
                    <div className="font-display text-sm font-semibold text-text">
                      On track
                    </div>
                    <div className="mt-1 inline-flex rounded-full bg-green/12 px-1.5 py-0.5 text-label font-semibold text-green">
                      ▲ 8% this month
                    </div>
                  </div>
                </div>
                <div className="rounded-xl border border-line bg-surface-2 p-3">
                  <div className="mb-2 font-mono text-[9px] uppercase tracking-[0.14em] text-text-faint">
                    Maturity by discipline
                  </div>
                  <MaturityBars />
                </div>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2">
                {kpis.map((m) => (
                  <div
                    key={m.k}
                    className="rounded-lg border border-line bg-surface-2/60 px-2.5 py-2"
                  >
                    <div className="font-display text-sm font-semibold text-text">
                      {m.v}
                    </div>
                    <div className="text-[9px] text-text-faint">{m.k}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* base / deck */}
      <div className="relative mx-auto h-3.5 w-[106%] -translate-x-[3%] rounded-b-xl border-x border-b border-line bg-gradient-to-b from-[#2a313c] via-[#161c26] to-[#0b0f17]">
        <span className="absolute inset-x-10 top-0 h-px bg-white/10" />
        <span className="absolute left-1/2 top-0 h-1.5 w-20 -translate-x-1/2 rounded-b-lg bg-[#0a0f17]" />
      </div>
    </div>
  );
}

function PhoneMockup() {
  return (
    <div className="w-[152px] rounded-[1.8rem] border border-line bg-gradient-to-b from-[#2a313c] to-[#10151d] p-[7px] shadow-2xl ring-1 ring-inset ring-white/10">
      <div className="relative flex h-[326px] flex-col overflow-hidden rounded-[1.4rem] bg-bg ring-1 ring-black/50">
        {/* dynamic island */}
        <div className="absolute left-1/2 top-2 z-20 h-4 w-16 -translate-x-1/2 rounded-full bg-black" />

        {/* status bar */}
        <div className="flex items-center justify-between px-4 pt-3 text-[9px] font-medium text-text">
          <span className="font-mono">9:41</span>
          <span className="flex items-center gap-1">
            <Wifi className="h-3 w-3" />
            <BatteryFull className="h-3.5 w-3.5" />
          </span>
        </div>

        {/* header */}
        <div className="flex items-center justify-between px-3 pt-2">
          <span className="inline-flex items-center gap-1.5">
            <span className="grid h-5 w-5 place-items-center rounded-md bg-accent/15 text-accent">
              <ShieldHalf className="h-3 w-3" />
            </span>
            <span className="font-display text-label font-semibold text-text">
              TrustStack
            </span>
          </span>
          <Bell className="h-3.5 w-3.5 text-text-muted" />
        </div>

        {/* score card */}
        <div className="mx-3 mt-2 flex items-center gap-3 rounded-xl border border-line bg-surface-2 p-3">
          <ScoreRing value={72} px={54} gradId="ringPhone" />
          <div>
            <div className="font-mono text-[8px] uppercase tracking-[0.14em] text-text-faint">
              Readiness
            </div>
            <div className="font-display text-sm font-semibold text-text">On track</div>
            <div className="mt-0.5 inline-flex rounded-full bg-green/12 px-1.5 py-0.5 text-[9px] font-semibold text-green">
              ▲ 8%
            </div>
          </div>
        </div>

        {/* a few disciplines */}
        <div className="mt-2 space-y-1.5 px-3">
          {FRAMEWORK.slice(0, 3).map((s, i) => {
            const p = PROGRESS[i] ?? 0;
            const done = p >= 100;
            const Icon = s.icon;
            return (
              <div
                key={s.id}
                className="flex items-center gap-2 rounded-lg border border-line bg-surface-2/60 px-2 py-1.5"
              >
                <span
                  className={`grid h-6 w-6 shrink-0 place-items-center rounded-md ${
                    done ? "bg-green/12 text-green" : "bg-accent/15 text-accent"
                  }`}
                >
                  <Icon className="h-3 w-3" />
                </span>
                <span className="flex-1 truncate text-label font-semibold text-text">
                  {s.name}
                </span>
                {done ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-green" />
                ) : (
                  <span className="shrink-0 font-mono text-[9px] font-semibold text-accent">
                    {p}%
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* tab bar */}
        <div className="mt-auto flex items-center justify-around border-t border-line bg-bg-2/80 px-2 pb-4 pt-2 backdrop-blur">
          {[Home, ListChecks, ShieldCheck, User].map((Icon, i) => (
            <span key={i} className={i === 0 ? "text-accent" : "text-text-faint"}>
              <Icon className="h-4 w-4" />
            </span>
          ))}
        </div>

        {/* home indicator */}
        <span className="pointer-events-none absolute bottom-1.5 left-1/2 h-1 w-16 -translate-x-1/2 rounded-full bg-white/35" />
      </div>
    </div>
  );
}

export function PlatformShowcase({ id }: { id?: string }) {
  const reduce = useReducedMotion();

  return (
    <section id={id ?? "app"} className="section relative overflow-x-clip scroll-mt-24">
      <div className="container-x">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* copy */}
          <div>
            <SectionHeader
              align="left"
              eyebrow="TrustDeck™"
              title="Your DPDP programme, on every screen"
              lede="From a boardroom dashboard to your phone - Discover to Drive, every discipline and its evidence, always in sync."
            />
            <ul className="mt-8 space-y-3">
              {BULLETS.map((b) => (
                <li key={b} className="flex items-start gap-3">
                  <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent/12 text-accent">
                    <CheckCircle2 className="h-4 w-4" />
                  </span>
                  <span className="text-text-muted">{b}</span>
                </li>
              ))}
            </ul>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/#risk-check" className="btn btn-accent btn-lg">
                Get your readiness score
                <ArrowUpRight className="h-4 w-4" />
              </Link>
              <Link href="/solutions" className="btn btn-ghost btn-lg">
                Explore the platform
              </Link>
            </div>
          </div>

          {/* devices - phone is absolute over the laptop, so reserve bottom space
              and avoid overflow-y clipping from the section. */}
          <div className="relative">
            <div
              className="pointer-events-none absolute inset-0 -z-10"
              style={{
                background:
                  "radial-gradient(52% 52% at 55% 42%, color-mix(in srgb, var(--accent) 16%, transparent), transparent 70%)",
              }}
            />
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.7, ease: EASE }}
              className="relative mx-auto max-w-[520px] pb-[11.5rem] pr-4 sm:pb-48 sm:pr-6"
            >
              <motion.div
                animate={reduce ? undefined : { y: [0, -8, 0] }}
                transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
              >
                <LaptopMockup />
              </motion.div>
              <motion.div
                animate={reduce ? undefined : { y: [0, -12, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -right-1 bottom-2 z-20 sm:-right-4 sm:bottom-4"
              >
                <PhoneMockup />
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
