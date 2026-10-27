"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowUpRight,
  BookOpen,
  Bot,
  MapPin,
  ScanLine,
  Gavel,
  Sparkles,
  Lock,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { CountUp } from "@/components/ui/CountUp";
import { DPDP_SCANNER_URL } from "@/content/home";
import { EASE } from "@/lib/motion";
import { useTranslations } from "next-intl";
import { PilotLockLink } from "@/components/gates/PilotLockLink";
import { useSubscription } from "@/contexts/SubscriptionContext";

type ReaderItem = { title: string; says: string; plain: string };

/* Section numbers for the flagship reader cards (content comes from i18n). */
const SECTION_NUMS = [6, 9, 8, 11, 5];

const gridParent = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.04 } },
};

const gridItem = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
};

function ReaderCell() {
  const t = useTranslations("bento");
  const reader = t.raw("reader") as ReaderItem[];
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const timer = setInterval(() => setIdx((i) => (i + 1) % reader.length), 4600);
    return () => clearInterval(timer);
  }, [paused, reader.length]);

  const s = reader[idx];
  const n = SECTION_NUMS[idx];

  return (
    <div
      className="card group relative flex h-full flex-col overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* breathing corner glow */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full"
        style={{
          background:
            "radial-gradient(circle, color-mix(in srgb, var(--accent) 26%, transparent), transparent 70%)",
        }}
        animate={{ opacity: [0.35, 0.7, 0.35], scale: [1, 1.15, 1] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* periodic sheen sweep */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 w-1/3"
        style={{
          background:
            "linear-gradient(105deg, transparent, color-mix(in srgb, var(--accent) 9%, transparent), transparent)",
        }}
        initial={{ x: "-150%" }}
        animate={{ x: "350%" }}
        transition={{ duration: 2.2, repeat: Infinity, repeatDelay: 4.5, ease: "easeInOut" }}
      />

      {/* top progress bar */}
      <div className="absolute inset-x-0 top-0 z-20 h-px bg-line">
        {!paused && (
          <motion.div
            key={idx}
            className="h-full bg-gradient-to-r from-accent to-amber"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 4.6, ease: "linear" }}
          />
        )}
      </div>

      <div className="relative z-10 flex h-full flex-col">
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-2 font-mono text-label uppercase tracking-[0.16em] text-text-muted">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent/60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
          </span>
          {t("reader_kicker")}
        </span>
        <BookOpen className="h-5 w-5 text-text-faint transition-colors group-hover:text-accent" />
      </div>

      <div className="mt-6 flex min-h-[16rem] flex-col">
        <AnimatePresence mode="wait">
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.45, ease: EASE }}
          >
            <div className="font-mono text-xs uppercase tracking-[0.2em] text-accent">
              {t("section_label", { n })}
            </div>
            <h3 className="mt-2 font-display text-3xl font-semibold tracking-tight text-text">
              {s.title}
            </h3>

            <p className="mt-4 border-l-2 border-line pl-4 font-serif text-lg italic leading-relaxed text-text-muted">
              {s.says}
            </p>

            <div className="mt-5 rounded-xl border border-accent/25 bg-accent/[0.06] p-4">
              <div className="flex items-center gap-2 font-mono text-label uppercase tracking-[0.16em] text-accent">
                <Sparkles className="h-3.5 w-3.5" />
                {t("in_plain_words")}
              </div>
              <p className="mt-2 text-[15px] leading-relaxed text-text">{s.plain}</p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-auto flex items-center justify-between pt-6">
        <div className="flex gap-1.5">
          {SECTION_NUMS.map((num, i) => (
            <button
              key={num}
              onClick={() => setIdx(i)}
              aria-label={t("show_section", { n: num })}
              className={`h-1.5 rounded-full transition-all ${
                i === idx ? "w-6 bg-accent" : "w-1.5 bg-line hover:bg-text-faint"
              }`}
            />
          ))}
        </div>
        <Link
          href="/act"
          className="inline-flex items-center gap-1 text-sm font-semibold text-accent transition-all hover:gap-2"
        >
          {t("open_act")}
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>
      </div>
    </div>
  );
}

function Ring({ value }: { value: number }) {
  const r = 46;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative grid place-items-center">
      <svg viewBox="0 0 120 120" className="h-28 w-28 -rotate-90">
        <circle cx="60" cy="60" r={r} fill="none" stroke="var(--line)" strokeWidth="9" />
        <motion.circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke="url(#ringGrad)"
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          whileInView={{ strokeDashoffset: c * (1 - value / 100) }}
          viewport={{ once: true }}
          transition={{ duration: 1.5, ease: EASE }}
        />
        <defs>
          <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="var(--accent)" />
            <stop offset="1" stopColor="var(--amber)" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute font-display text-2xl font-semibold tracking-tight text-text">
        <CountUp value={value} />%
      </div>
    </div>
  );
}

function RiskCell() {
  const t = useTranslations("bento");
  return (
    <Link
      href="/#risk-check"
      className="card card-hover group flex h-full flex-col items-center text-center"
    >
      <Ring value={64} />
      <h3 className="mt-4 font-display text-lg font-semibold text-text">
        {t("risk_title")}
      </h3>
      <p className="mt-1 text-sm text-text-muted">
        {t("risk_desc")}
      </p>
      <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-accent transition-all group-hover:gap-2">
        {t("risk_cta")}
        <ArrowUpRight className="h-4 w-4" />
      </span>
    </Link>
  );
}

function LexCell() {
  const t = useTranslations("bento");
  const router = useRouter();
  const { canAccess } = useSubscription();
  const locked = !canAccess("trustchat");
  const openLex = () => {
    if (locked) {
      router.push("/subscribe");
      return;
    }
    const btn = document.querySelector<HTMLButtonElement>(
      "[data-trustchat-trigger]"
    );
    btn?.click();
  };
  return (
    <button
      onClick={openLex}
      className="card card-hover group flex h-full w-full flex-col text-left"
    >
      <div className="flex items-center justify-between">
        <span className="grid h-11 w-11 place-items-center rounded-lg border border-line bg-glass text-accent transition-transform group-hover:scale-105">
          <motion.span
            animate={{ y: [0, -2.5, 0] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          >
            {locked ? <Lock className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
          </motion.span>
        </span>
        <span className="badge">{locked ? "Pilot" : t("lex_badge")}</span>
      </div>

      <div className="mt-5 space-y-2">
        <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-sm border border-line bg-surface-2 px-3 py-2 text-xs text-text">
          {t("lex_msg")}
        </div>
        <div className="flex max-w-[60%] items-center gap-1.5 rounded-2xl rounded-bl-sm border border-accent/25 bg-accent/[0.06] px-3 py-2.5">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="h-1.5 w-1.5 rounded-full bg-accent"
              animate={{ opacity: [0.3, 1, 0.3], y: [0, -2, 0] }}
              transition={{
                duration: 1.1,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.18,
              }}
            />
          ))}
        </div>
      </div>

      <h3 className="mt-5 font-display text-lg font-semibold text-text">
        {t("lex_title")}
      </h3>
      <p className="mt-1 text-sm text-text-muted">
        {t("lex_desc")}
      </p>
    </button>
  );
}

function PenaltyCell() {
  const t = useTranslations("bento");
  return (
    <PilotLockLink href="/tools" feature="tools" className="card card-hover group flex h-full flex-col">
      <div className="flex items-center justify-between">
        <span className="grid h-11 w-11 place-items-center rounded-lg border border-line bg-glass text-accent transition-transform group-hover:scale-105">
          <motion.span
            animate={{ rotate: [0, -10, 0, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", repeatDelay: 1.2 }}
          >
            <Gavel className="h-5 w-5" />
          </motion.span>
        </span>
        <ArrowUpRight className="h-5 w-5 text-text-faint transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent" />
      </div>
      <div className="mt-5 font-display text-4xl font-semibold tracking-tight text-text">
        ₹<CountUp value={250} /> {t("penalty_unit")}
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-line">
        <motion.div
          className="relative h-full overflow-hidden rounded-full bg-gradient-to-r from-amber to-accent"
          initial={{ width: "0%" }}
          whileInView={{ width: "100%" }}
          viewport={{ once: true }}
          transition={{ duration: 1.4, ease: EASE }}
        >
          <motion.span
            aria-hidden
            className="absolute inset-y-0 w-8 -skew-x-12 bg-white/40 blur-[2px]"
            initial={{ x: "-250%" }}
            animate={{ x: "700%" }}
            transition={{ duration: 1.8, repeat: Infinity, repeatDelay: 1.4, ease: "easeInOut" }}
          />
        </motion.div>
      </div>
      <p className="mt-3 text-sm text-text-muted">
        {t("penalty_desc")}
      </p>
    </PilotLockLink>
  );
}

function CoverageCell() {
  const t = useTranslations("bento");
  return (
    <Link
      href="/industries"
      className="card card-hover group flex h-full flex-col items-center text-center"
    >
      <div className="relative grid h-24 w-full place-items-center overflow-hidden">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="absolute rounded-full border border-accent/40"
            style={{ width: 34 + i * 30, height: 34 + i * 30 }}
            animate={{ opacity: [0.5, 0.12, 0.5], scale: [0.9, 1.08, 0.9] }}
            transition={{
              duration: 3 + i,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.3,
            }}
          />
        ))}
        <span className="relative grid h-9 w-9 place-items-center rounded-full bg-accent/15 text-accent">
          <MapPin className="h-5 w-5" />
        </span>
      </div>
      <h3 className="mt-3 font-display text-lg font-semibold text-text">
        {t("coverage_title")}
      </h3>
      <p className="mt-1 text-sm text-text-muted">
        {t("coverage_desc")}
      </p>
    </Link>
  );
}

function ScannerCell() {
  const external = DPDP_SCANNER_URL.startsWith("http");
  return (
    <PilotLockLink
      href={DPDP_SCANNER_URL}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className="card card-hover group relative flex h-full flex-col overflow-hidden"
    >
      <div className="relative grid h-24 place-items-center overflow-hidden rounded-lg border border-line bg-surface-2/40">
        <span className="absolute right-2 top-2 z-10 rounded-pill border border-accent/25 bg-bg/85 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent backdrop-blur-sm">
          New
        </span>
        {/* sweeping scan beam */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 h-8 bg-gradient-to-b from-transparent via-accent/35 to-transparent"
          animate={{ y: ["-120%", "240%"] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="relative grid h-12 w-12 place-items-center rounded-lg border border-accent/40 bg-accent/10 text-accent"
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        >
          <ScanLine className="h-6 w-6" />
        </motion.div>
      </div>
      <h3 className="mt-4 inline-flex items-center gap-1.5 font-display text-lg font-semibold text-text">
        DPDP Scanner
        <ArrowUpRight className="h-4 w-4 text-accent transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </h3>
      <p className="mt-1 text-sm text-text-muted">
        Scan your website for consent, notice, cookie and security gaps - and get a
        prioritised fix-list in minutes.
      </p>
    </PilotLockLink>
  );
}

export function BentoShowcase({ id }: { id?: string }) {
  const t = useTranslations("bento");
  return (
    <section id={id ?? "platform"} className="section relative scroll-mt-24">
      {/* ambient pulsing glow */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/3 -z-10 h-[34rem] w-[34rem] -translate-x-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(circle, color-mix(in srgb, var(--accent) 12%, transparent), transparent 70%)",
        }}
        animate={{ opacity: [0.4, 0.78, 0.4], scale: [0.95, 1.08, 0.95] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="container-x">
        <SectionHeader
          eyebrow={t("eyebrow")}
          title={t("title")}
          lede={t("lede")}
        />

        <motion.div
          className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          variants={gridParent}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
        >
          <motion.div
            variants={gridItem}
            whileHover={{ y: -5 }}
            className="sm:col-span-2 lg:row-span-2"
          >
            <ReaderCell />
          </motion.div>
          <motion.div variants={gridItem} whileHover={{ y: -5 }}>
            <RiskCell />
          </motion.div>
          <motion.div variants={gridItem} whileHover={{ y: -5 }}>
            <LexCell />
          </motion.div>
          <motion.div variants={gridItem} whileHover={{ y: -5 }}>
            <PenaltyCell />
          </motion.div>
          <motion.div variants={gridItem} whileHover={{ y: -5 }}>
            <CoverageCell />
          </motion.div>
          <motion.div variants={gridItem} whileHover={{ y: -5 }}>
            <ScannerCell />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
