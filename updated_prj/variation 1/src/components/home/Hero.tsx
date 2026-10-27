"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { useTranslations, useLocale } from "next-intl";
import { ArrowUpRight, BookOpen } from "lucide-react";
import { HERO_STATS } from "@/content/dpdp";
import { HeroSearch } from "./HeroSearch";
import { CountUp } from "@/components/ui/CountUp";
import { IndiaMap } from "@/components/sections/IndiaMap";
import { EASE } from "@/lib/motion";

function StatValue({ value }: { value: string }) {
  const m = value.match(/^(\D*)(\d+)(\D*)$/);
  if (!m) return <>{value}</>;
  const [, prefix, num, suffix] = m;
  return (
    <>
      {prefix}
      <CountUp value={Number(num)} />
      {suffix}
    </>
  );
}

const rise = (delay: number) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, delay, ease: EASE },
});

export function Hero() {
  const t = useTranslations("hero");
  const tHome = useTranslations("home");
  const locale = useLocale();
  const reduce = useReducedMotion();
  const loop = <T,>(a: T): T | undefined => (reduce ? undefined : a);

  return (
    <section className="relative overflow-x-clip">
      {/* ambient, calm, living background */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <motion.div
          className="absolute inset-x-0 top-0 h-[520px]"
          style={{
            background:
              "radial-gradient(58% 100% at 50% 0%, color-mix(in srgb, var(--accent) 15%, transparent), transparent 72%)",
          }}
          animate={loop({ opacity: [0.65, 1, 0.65] })}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -left-32 top-8 h-[30rem] w-[30rem] rounded-full bg-accent/10 blur-[130px]"
          animate={loop({ x: [0, 42, 0], y: [0, 28, 0] })}
          transition={{ duration: 23, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -right-28 -top-4 h-[26rem] w-[26rem] rounded-full bg-amber/10 blur-[140px]"
          animate={loop({ x: [0, -38, 0], y: [0, 24, 0] })}
          transition={{ duration: 28, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="container-x grid items-center gap-12 pb-16 pt-16 lg:grid-cols-2 lg:gap-8 lg:py-10 xl:gap-10">
        <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
          <motion.span
            {...rise(0)}
            className="inline-flex items-center gap-2 rounded-pill border border-line bg-glass px-3.5 py-1.5 text-label font-semibold uppercase tracking-[0.12em] text-text-muted"
          >
            <span className="relative flex h-1.5 w-1.5">
              <motion.span
                className="absolute inline-flex h-full w-full rounded-full bg-accent"
                animate={loop({ opacity: [0.7, 0, 0.7], scale: [1, 2.4, 1] })}
                transition={{ duration: 2.6, repeat: Infinity, ease: "easeOut" }}
              />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
            </span>
            {t("kicker")}
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 22, filter: "blur(12px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.85, delay: 0.06, ease: EASE }}
            className="mt-7 max-w-xl font-display text-[2.5rem] font-semibold leading-[1.05] tracking-tight text-balance sm:text-5xl lg:mt-5 lg:text-[3.05rem] xl:text-[3.45rem]"
          >
            <span data-rm="normal">
              {locale === "en" ? (
                <>
                  {t("title_lead")}
                  <span className="gradient-text gradient-text--shimmer">{t("title_em1")}</span>
                  {t("title_mid")}
                  <span className="whitespace-nowrap">
                    <span className="relative inline-block font-serif italic">
                      {t("title_em2")}
                      <motion.span
                        aria-hidden
                        className="absolute -bottom-1 left-0 h-[3px] w-full rounded-full bg-gradient-to-r from-accent to-amber"
                        initial={{ scaleX: 0, opacity: 0 }}
                        animate={{ scaleX: 1, opacity: 1 }}
                        transition={{ duration: 0.7, delay: 0.95, ease: EASE }}
                        style={{ transformOrigin: "left" }}
                      />
                    </span>
                    {t("title_tail").charAt(0)}
                  </span>
                  {t("title_tail").slice(1)}
                </>
              ) : (
                tHome("hero_title")
              )}
            </span>
            <span data-rm="easy">
              India&apos;s privacy law,{" "}
              <span className="gradient-text gradient-text--shimmer">
                in plain English
              </span>
              .
            </span>
          </motion.h1>

          <motion.p
            {...rise(0.12)}
            className="mt-6 max-w-xl text-base leading-relaxed text-text-muted text-pretty sm:text-lg lg:mt-4"
          >
            <span data-rm="normal">{t("subhead")}</span>
            <span data-rm="easy">
              The DPDP Act is India&apos;s law on how companies must look after
              your personal information. We explain it in simple, everyday words
              - your rights, and what businesses must do - with no
              legal background needed.
            </span>
          </motion.p>

          <motion.div
            {...rise(0.18)}
            className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:mt-6 lg:justify-start"
          >
            <Link href="/#risk-check" className="btn btn-accent btn-lg">
              {t("cta_risk")}
              <ArrowUpRight className="h-4 w-4" />
            </Link>
            <Link href="/act" className="btn btn-ghost btn-lg">
              <BookOpen className="h-4 w-4" />
              {t("cta_act")}
            </Link>
          </motion.div>

          <motion.div {...rise(0.24)} className="mt-8 w-full max-w-xl lg:mt-6">
            <HeroSearch placeholder={t("search_placeholder")} chips={t.raw("search_chips") as string[]} />
          </motion.div>

          <motion.div
            {...rise(0.32)}
            className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 lg:mt-7 lg:justify-start"
          >
            {HERO_STATS.map((s) => (
              <div key={s.label} className="flex items-baseline gap-2">
                <span className="font-display text-2xl font-semibold tracking-tight text-text">
                  <StatValue value={s.value} />
                </span>
                <span className="text-label font-semibold uppercase tracking-[0.08em] text-text-muted">
                  {s.label}
                </span>
              </div>
            ))}
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2, ease: EASE }}
          className="mx-auto w-full max-w-[440px] overflow-visible pt-3 lg:-mt-4 lg:max-w-[min(420px,calc(75svh_-_9rem))] xl:max-w-[min(440px,calc(75svh_-_9rem))]"
        >
          <motion.div
            className="india-flag-float relative overflow-visible"
            animate={loop({
              y: [0, -5, 0],
            })}
            transition={{ duration: 8.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <IndiaMap />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
