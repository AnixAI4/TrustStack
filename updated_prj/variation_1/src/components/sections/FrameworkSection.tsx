"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Pause, Play } from "lucide-react";
import { FRAMEWORK } from "@/content/dpdp";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { cn } from "@/lib/cn";
import {
  HERO_AUTO_ADVANCE_MS,
  HERO_AUTO_ADVANCE_SECONDS,
} from "@/lib/hero-auto-advance";

/* Each of the seven disciplines gets its own hue - a cool-to-warm progression
   that culminates on the brand orange (Drive). Themed via --c so light/dark and
   every accent just work. */
const STAGE_ACCENT = [
  "var(--blue-rgb)", // 01 Discover
  "var(--brand-rgb)", // 02 Define
  "var(--gold-rgb)", // 03 Design
  "var(--red-rgb)", // 04 Defend  (security / alert)
  "var(--green-rgb)", // 05 Deploy  (go-live)
  "var(--amber-rgb)", // 06 Demonstrate
  "var(--accent-rgb)", // 07 Drive  (the brand engine)
];

export function FrameworkSection({ id }: { id?: string }) {
  const n = FRAMEWORK.length;
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [seen, setSeen] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  const stage = FRAMEWORK[active];
  const Icon = stage.icon;
  const accent = STAGE_ACCENT[active] ?? "var(--accent-rgb)";
  const prev = FRAMEWORK[(active - 1 + n) % n];
  const next = FRAMEWORK[(active + 1) % n];

  // only run the guided tour once the section is actually on screen
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setSeen(e.isIntersecting), {
      threshold: 0.3,
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // advance through the stages while playing + visible
  useEffect(() => {
    if (!playing || !seen) return;
    const t = window.setTimeout(
      () => setActive((a) => (a + 1) % n),
      HERO_AUTO_ADVANCE_MS
    );
    return () => window.clearTimeout(t);
  }, [playing, seen, active, n]);

  // Manual selection restarts the current seven-second cycle. The dedicated
  // Pause control is the only action that stops the guided tour.
  const go = (i: number) => {
    setActive(((i % n) + n) % n);
  };

  return (
    <section
      ref={sectionRef}
      id={id}
      className="section scroll-mt-24"
      style={{ ["--c" as string]: accent } as CSSProperties}
    >
      <div className="container-x">
        <SectionHeader
          eyebrow="The seven disciplines"
          title={
            <>
              The Anix <span className="gradient-text">7D DPDP Framework™</span>
            </>
          }
          lede="India's first end-to-end DPDP compliance methodology - from data discovery to continuous compliance operations. Each stage builds on the last into one evidence-based program."
        />

        {/* ── the journey track ─────────────────────────────────────────── */}
        <div className="mt-12">
          <div className="mb-5 flex items-center justify-between gap-4">
            <p className="font-mono text-label uppercase tracking-[0.2em] text-text-faint">
              The 7D journey ·{" "}
              <span style={{ color: "rgb(var(--c))" }}>
                {String(active + 1).padStart(2, "0")}
              </span>{" "}
              / 07
            </p>
            <button
              type="button"
              onClick={() => setPlaying((p) => !p)}
              aria-pressed={playing}
              aria-label={playing ? "Pause the guided tour" : "Play the guided tour"}
              className="inline-flex items-center gap-1.5 rounded-pill border px-3 py-1.5 font-mono text-label uppercase tracking-wider text-text-muted transition-colors hover:text-text"
              style={{
                borderColor: "rgb(var(--c) / 0.3)",
                background: "rgb(var(--c) / 0.06)",
              }}
            >
              {playing ? (
                <Pause className="h-3.5 w-3.5" />
              ) : (
                <Play className="h-3.5 w-3.5" />
              )}
              {playing ? "Pause" : "Play"}
            </button>
          </div>

          {/* connected node track */}
          <div className="flex gap-1 overflow-x-auto pb-1 sm:gap-0 sm:overflow-visible">
            {FRAMEWORK.map((s, i) => {
              const StageIcon = s.icon;
              const isActive = i === active;
              const done = i < active;
              const filled = i <= active; // the connector leading INTO this node
              return (
                <div
                  key={s.id}
                  className="relative flex min-w-[86px] flex-1 flex-col items-center sm:min-w-0"
                  style={{ ["--c" as string]: STAGE_ACCENT[i] } as CSSProperties}
                >
                  {/* connector to the previous node (its own stage hue once reached) */}
                  {i > 0 && (
                    <span
                      aria-hidden
                      className="absolute right-1/2 top-[21px] h-[2px] w-full"
                      style={{
                        background: filled ? "rgb(var(--c) / 0.5)" : "var(--line)",
                        transition: "background 0.4s ease",
                      }}
                    />
                  )}
                  {/* node */}
                  <button
                    type="button"
                    aria-pressed={isActive}
                    aria-label={`Stage ${i + 1}: ${s.name}`}
                    onClick={() => go(i)}
                    style={
                      {
                        borderColor: isActive
                          ? "rgb(var(--c))"
                          : done
                            ? "rgb(var(--c) / 0.5)"
                            : undefined,
                        background: done
                          ? "linear-gradient(0deg, rgb(var(--c) / 0.16), rgb(var(--c) / 0.16)), rgb(var(--surface-rgb))"
                          : undefined,
                        boxShadow: isActive
                          ? "0 10px 26px -8px rgb(var(--c) / 0.5)"
                          : undefined,
                        color: isActive || done ? "rgb(var(--c))" : undefined,
                      } as CSSProperties
                    }
                    className={cn(
                      "relative z-10 grid h-11 w-11 place-items-center rounded-full border-2 bg-surface transition-all duration-300",
                      isActive ? "scale-110 border-[3px]" : "hover:scale-105",
                      !isActive && !done && "border-line text-text-faint"
                    )}
                  >
                    {done ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <StageIcon className={isActive ? "h-[22px] w-[22px]" : "h-5 w-5"} />
                    )}
                  </button>
                  {/* label */}
                  <span className="mt-2.5 flex flex-col items-center text-center">
                    <span
                      className="font-mono text-label font-semibold"
                      style={{
                        color: isActive || done ? "rgb(var(--c))" : undefined,
                      }}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span
                      className={cn(
                        "font-display text-xs font-semibold leading-tight sm:text-sm",
                        isActive ? "text-text" : "text-text-muted"
                      )}
                    >
                      {s.name}
                    </span>
                  </span>
                </div>
              );
            })}
          </div>

          {/* autoplay timer bar */}
          <div
            className="mt-2 h-[2px] w-full overflow-hidden rounded-full"
            style={{ background: "rgb(var(--c) / 0.1)" }}
          >
            {playing && seen && (
              <motion.div
                key={`${active}-${playing}`}
                className="h-full w-full origin-left rounded-full"
                style={{
                  background: "rgb(var(--c) / 0.7)",
                }}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{
                  duration: HERO_AUTO_ADVANCE_SECONDS,
                  ease: "linear",
                }}
              />
            )}
          </div>
        </div>

        {/* ── the detail panel ──────────────────────────────────────────── */}
        <div
          className="relative mt-8 overflow-hidden rounded-3xl border"
          style={{
            borderColor: "rgb(var(--c) / 0.24)",
            boxShadow: "0 40px 100px -60px rgb(var(--c) / 0.6)",
            background: "var(--surface-2)",
          }}
        >
          <FrameworkBackdrop />

          <div key={stage.id} className="fw-detail-in relative z-10">
            {/* header */}
            <div
              className="flex flex-wrap items-start gap-4 border-b px-6 py-6 sm:px-8"
              style={{ borderColor: "rgb(var(--c) / 0.14)" }}
            >
              <span
                className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl"
                style={{
                  background:
                    "linear-gradient(150deg, rgb(var(--c) / 0.32), rgb(var(--c) / 0.08))",
                  border: "1px solid rgb(var(--c) / 0.4)",
                }}
              >
                <Icon className="h-8 w-8" style={{ color: "rgb(var(--c))" }} />
              </span>
              <div className="min-w-0">
                <div
                  className="font-mono text-label uppercase tracking-[0.2em]"
                  style={{ color: "rgb(var(--c))" }}
                >
                  Stage {String(active + 1).padStart(2, "0")} / 07
                </div>
                <h3 className="mt-1 font-display text-3xl font-bold leading-tight text-text sm:text-4xl">
                  {stage.name}
                </h3>
                <p className="mt-1 text-lg text-text-muted">{stage.tagline}</p>
              </div>
            </div>

            {/* points */}
            <div className="px-6 py-6 sm:px-8">
              <p className="mb-4 font-mono text-label uppercase tracking-widest text-text-faint">
                What happens in this stage
              </p>
              <ul className="grid gap-3 sm:grid-cols-2">
                {stage.points.map((p, i) => (
                  <li
                    key={p}
                    className="fw-point-in flex items-start gap-3 rounded-xl border px-4 py-3"
                    style={{
                      animationDelay: `${i * 65}ms`,
                      borderColor: "rgb(var(--c) / 0.16)",
                      background: "rgb(var(--c) / 0.04)",
                    }}
                  >
                    <span
                      className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full"
                      style={{
                        background: "rgb(var(--c) / 0.16)",
                        color: "rgb(var(--c))",
                      }}
                    >
                      <Check className="h-3 w-3" />
                    </span>
                    <span className="text-sm leading-relaxed text-text">{p}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* footer: prev · dots · next */}
            <div
              className="flex items-center justify-between gap-3 border-t px-5 py-4 sm:px-8"
              style={{
                borderColor: "rgb(var(--c) / 0.12)",
                background: "rgb(var(--c) / 0.04)",
              }}
            >
              <button
                type="button"
                onClick={() => go(active - 1)}
                className="group inline-flex items-center gap-2 text-left"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-line text-text-muted transition-colors group-hover:text-text">
                  <ArrowLeft className="h-4 w-4" />
                </span>
                <span className="hidden sm:block">
                  <span className="block font-mono text-label uppercase tracking-wider text-text-faint">
                    {String(((active - 1 + n) % n) + 1).padStart(2, "0")} · Prev
                  </span>
                  <span className="block text-sm font-semibold text-text-muted">
                    {prev.name}
                  </span>
                </span>
              </button>

              <div className="flex items-center gap-1.5">
                {FRAMEWORK.map((s, i) => (
                  <button
                    key={s.id}
                    type="button"
                    aria-label={`Go to ${s.name}`}
                    onClick={() => go(i)}
                    className="h-2 rounded-full transition-all duration-300"
                    style={{
                      width: i === active ? 22 : 8,
                      background:
                        i === active ? "rgb(var(--c))" : "rgb(var(--c) / 0.22)",
                    }}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={() => go(active + 1)}
                className="group inline-flex items-center gap-2 text-right"
              >
                <span className="hidden sm:block">
                  <span className="block font-mono text-label uppercase tracking-wider text-text-faint">
                    {String(((active + 1) % n) + 1).padStart(2, "0")} · Next
                  </span>
                  <span className="block text-sm font-semibold text-text-muted">
                    {next.name}
                  </span>
                </span>
                <span
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full transition-transform group-hover:translate-x-0.5"
                  style={{
                    background: "rgb(var(--c) / 0.16)",
                    border: "1px solid rgb(var(--c) / 0.4)",
                    color: "rgb(var(--c))",
                  }}
                >
                  <ArrowRight className="h-4 w-4" />
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── themed panel backdrop: a soft accent glow + a fine grid that fades toward
   the lower-left. Abstract & premium, tinted to the active stage via --c. ─── */
function FrameworkBackdrop() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
    >
      <div
        className="absolute -right-24 -top-28 h-80 w-80 rounded-full blur-[90px]"
        style={{ background: "rgb(var(--c) / 0.18)" }}
      />
      <div
        className="absolute -bottom-28 -left-16 h-72 w-72 rounded-full blur-[90px]"
        style={{ background: "rgb(var(--c) / 0.1)" }}
      />
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgb(var(--c) / 0.05) 1px, transparent 1px), linear-gradient(90deg, rgb(var(--c) / 0.05) 1px, transparent 1px)",
          backgroundSize: "36px 36px",
          WebkitMaskImage:
            "radial-gradient(130% 100% at 100% 0%, #000 12%, transparent 72%)",
          maskImage:
            "radial-gradient(130% 100% at 100% 0%, #000 12%, transparent 72%)",
        }}
      />
    </div>
  );
}
