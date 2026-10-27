"use client";

import { useState, type CSSProperties, type ReactNode } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  Sparkles,
  RotateCcw,
  ArrowRight,
  ArrowUpRight,
  ShieldCheck,
  Scale,
  ListChecks,
} from "lucide-react";
import { INDUSTRIES } from "@/content/dpdp";
import {
  SECTOR_ADVICE,
  SECTOR_ACCENT,
  READINESS_STAGES,
} from "@/content/industry-advisor";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { cn } from "@/lib/cn";
import { EASE } from "@/lib/motion";
import { Scenery, Building, windowsFor } from "@/components/site/Scenery";

type Turn = {
  id: string;
  role: "bot" | "user";
  lead?: string;
  text: string;
};

const DEFAULT_ACCENT = "var(--accent-rgb)";

export function IndustryAdvisor({ id }: { id?: string }) {
  const [sectorIdx, setSectorIdx] = useState<number | null>(null);
  const [dataPick, setDataPick] = useState<string | null>(null);
  const [worryPick, setWorryPick] = useState<string | null>(null);
  const [stageKey, setStageKey] = useState<string | null>(null);

  const sector = sectorIdx != null ? INDUSTRIES[sectorIdx] : null;
  const advice = sector ? SECTOR_ADVICE[sector.name] : null;
  const stage = READINESS_STAGES.find((s) => s.key === stageKey) ?? null;

  // Which question is live (0-3), or 4 once the result is ready.
  const step =
    sectorIdx == null
      ? 0
      : dataPick == null
        ? 1
        : worryPick == null
          ? 2
          : stageKey == null
            ? 3
            : 4;

  const started = sectorIdx != null;
  const accent = sector ? SECTOR_ACCENT[sector.name] ?? DEFAULT_ACCENT : DEFAULT_ACCENT;

  const reset = () => {
    setSectorIdx(null);
    setDataPick(null);
    setWorryPick(null);
    setStageKey(null);
  };

  // ---- Build the conversation transcript from state (deterministic) ----
  const turns: Turn[] = [
    {
      id: "intro",
      role: "bot",
      text:
        "Hi - let's have a genuine two-minute conversation about this. I'll ask four questions, you answer with a tap, and instead of vague \"you must comply\" talk, I'll show you specifically why the DPDP Act matters for your world and what it actually asks of you. Let's start simple: which sector best describes you?",
    },
  ];

  if (sector && advice) {
    turns.push({ id: "a-sector", role: "user", text: sector.name });
    turns.push({
      id: "q-data",
      role: "bot",
      lead: advice.hook,
      text: "To make this concrete instead of theoretical - which of these do you handle most? Pick the one closest to your day-to-day.",
    });
  }
  if (sector && advice && dataPick) {
    turns.push({ id: "a-data", role: "user", text: dataPick });
    turns.push({
      id: "q-worry",
      role: "bot",
      lead:
        advice.dataReplies[dataPick] ??
        `“${dataPick}” is squarely personal data under the Act - that alone brings you into its scope.`,
      text: "Now the honest question - which of these actually keeps you up at night? There's no wrong answer here.",
    });
  }
  if (sector && advice && worryPick) {
    turns.push({ id: "a-worry", role: "user", text: worryPick });
    turns.push({
      id: "q-stage",
      role: "bot",
      lead:
        advice.worryReplies[worryPick] ??
        `“${worryPick}” is exactly the kind of gap the DPDP Rules 2025 were written to close.`,
      text: "One last thing, so I pitch this right - how far along are you with DPDP today?",
    });
  }
  if (sector && stage) {
    turns.push({ id: "a-stage", role: "user", text: stage.label });
    turns.push({
      id: "q-result",
      role: "bot",
      lead: stage.reply,
      text: `Perfect - here's the part that matters: why the DPDP Act genuinely applies to ${sector.name}, what it expects of you, and exactly where I'd start if I were in your seat.`,
    });
  }

  return (
    <section
      id={id}
      className="section scroll-mt-24 relative overflow-hidden"
      style={{ ["--c" as string]: accent } as CSSProperties}
    >
      {/* sector-themed scenery that rises from the bottom once a sector is chosen */}
      <Scenery
        accent={accent}
        landmark={sector ? sectorFront(sector.name) : null}
        sceneKey={sector?.name}
        show={!!sector}
      />

      <div className="container-x relative z-10">
        <SectionHeader
          eyebrow="Personalised for you"
          easyEyebrow="Made for your work"
          title="Not sure why DPDP matters for you? Let's find out together."
          easyTitle="See why this law matters for your work"
          lede="Answer four quick questions - tap-only, no typing - and get a picture of exactly why the DPDP Act applies to your sector, what it expects, and where to start."
          easyLede="Tap a few buttons. We'll show you, in plain words, why this law matters for your kind of work and what to do first."
        />

        <div className="mx-auto mt-10 max-w-3xl">
          <div
            className="relative overflow-hidden rounded-2xl border"
            style={
              {
                borderColor: "rgb(var(--c) / 0.22)",
                boxShadow: "0 26px 70px -46px rgb(var(--c) / 0.6)",
              } as CSSProperties
            }
          >
            {/* themed backdrop */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "radial-gradient(80% 60% at 100% 0%, rgb(var(--c) / 0.16), transparent 55%), var(--surface-2)",
              }}
            />

            {/* header bar */}
            <div
              className="relative z-10 flex items-center justify-between gap-3 border-b px-4 py-3 sm:px-5"
              style={{ borderColor: "rgb(var(--c) / 0.16)" }}
            >
              <div className="flex items-center gap-2.5">
                <span
                  className="grid h-8 w-8 place-items-center rounded-full"
                  style={{
                    background:
                      "linear-gradient(150deg, rgb(var(--c) / 0.34), rgb(var(--c) / 0.10))",
                    border: "1px solid rgb(var(--c) / 0.4)",
                  }}
                >
                  <Sparkles className="h-4 w-4" style={{ color: "rgb(var(--c))" }} />
                </span>
                <div className="leading-tight">
                  <p className="text-sm font-semibold text-text">DPDP Industry Advisor</p>
                  <p className="font-mono text-label uppercase tracking-wider text-text-faint">
                    {step >= 4 ? "Your result" : `Question ${step + 1} of 4`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* progress dots */}
                <div className="hidden items-center gap-1.5 sm:flex" aria-hidden>
                  {[0, 1, 2, 3].map((i) => (
                    <span
                      key={i}
                      className="h-1.5 rounded-pill transition-all duration-300"
                      style={{
                        width: i === Math.min(step, 3) && step < 4 ? 18 : 8,
                        background:
                          i < step || step >= 4
                            ? "rgb(var(--c))"
                            : i === step
                              ? "rgb(var(--c) / 0.6)"
                              : "rgb(var(--c) / 0.2)",
                      }}
                    />
                  ))}
                </div>
                {started && (
                  <button
                    type="button"
                    onClick={reset}
                    className="inline-flex items-center gap-1.5 rounded-pill border border-line bg-surface-2/50 px-2.5 py-1 text-xs text-text-muted transition-colors hover:border-accent/40 hover:text-text"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Start over
                  </button>
                )}
              </div>
            </div>

            {/* conversation */}
            <div className="relative z-10 space-y-3 px-4 py-5 sm:px-5">
              <AnimatePresence initial={false}>
                {turns.map((turn) => (
                  <motion.div
                    key={turn.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.34, ease: EASE }}
                    className={cn(
                      "flex gap-2.5",
                      turn.role === "user" ? "justify-end" : "justify-start"
                    )}
                  >
                    {turn.role === "bot" && (
                      <span
                        className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full"
                        style={{
                          background: "rgb(var(--c) / 0.14)",
                          border: "1px solid rgb(var(--c) / 0.3)",
                        }}
                        aria-hidden
                      >
                        <Sparkles
                          className="h-3.5 w-3.5"
                          style={{ color: "rgb(var(--c))" }}
                        />
                      </span>
                    )}
                    <div
                      className={cn(
                        "max-w-[85%] rounded-2xl px-4 py-3 text-[15px] leading-relaxed sm:text-base",
                        turn.role === "user"
                          ? "rounded-br-sm font-medium text-text"
                          : "rounded-bl-sm border border-line bg-surface/60 text-text-muted"
                      )}
                      style={
                        turn.role === "user"
                          ? {
                              background: "rgb(var(--c) / 0.14)",
                              border: "1px solid rgb(var(--c) / 0.3)",
                            }
                          : undefined
                      }
                    >
                      {turn.lead && (
                        <p className="mb-1.5 font-medium text-text">{turn.lead}</p>
                      )}
                      <p>{turn.text}</p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* result, delivered inside the chat itself */}
              {sector && advice && stage && (
                <InChatResult
                  sectorName={sector.name}
                  advice={advice}
                  worry={worryPick}
                />
              )}

              {/* choices for the live question */}
              <div className="pt-1">
                <div key={step}>
                    {step === 0 && (
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {INDUSTRIES.map((s, i) => {
                          const Icon = s.icon;
                          const c = SECTOR_ACCENT[s.name] ?? DEFAULT_ACCENT;
                          return (
                            <button
                              key={s.name}
                              type="button"
                              onClick={() => setSectorIdx(i)}
                              className="group flex items-center gap-2.5 rounded-xl border border-line bg-surface-2/40 px-3.5 py-3.5 text-left text-[15px] font-semibold text-text transition-all hover:-translate-y-0.5"
                              style={{ ["--c" as string]: c } as CSSProperties}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor =
                                  "rgb(var(--c) / 0.5)";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = "";
                              }}
                            >
                              <span
                                className="grid h-9 w-9 shrink-0 place-items-center rounded-lg"
                                style={{
                                  background: "rgb(var(--c) / 0.14)",
                                  border: "1px solid rgb(var(--c) / 0.28)",
                                }}
                              >
                                <Icon
                                  className="h-5 w-5"
                                  style={{ color: "rgb(var(--c))" }}
                                />
                              </span>
                              {s.name}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {step === 1 && sector && (
                      <ChoiceRow
                        prompt="Tap what fits:"
                        options={sector.data}
                        onPick={setDataPick}
                      />
                    )}

                    {step === 2 && sector && (
                      <ChoiceRow
                        prompt="Pick the one that stings most:"
                        options={sector.risks}
                        onPick={setWorryPick}
                      />
                    )}

                    {step === 3 && (
                      <ChoiceRow
                        prompt="Be honest:"
                        options={READINESS_STAGES.map((s) => s.label)}
                        onPick={(label) => {
                          const found = READINESS_STAGES.find(
                            (s) => s.label === label
                          );
                          if (found) setStageKey(found.key);
                        }}
                      />
                    )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ChoiceRow({
  prompt,
  options,
  onPick,
}: {
  prompt: string;
  options: string[];
  onPick: (value: string) => void;
}) {
  return (
    <div>
      <p className="mb-2.5 font-mono text-xs uppercase tracking-wider text-text-faint">
        {prompt}
      </p>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onPick(opt)}
            className="inline-flex items-center gap-1.5 rounded-pill border px-4 py-2.5 text-[15px] font-semibold text-text-muted transition-all hover:-translate-y-0.5 hover:text-text"
            style={{
              borderColor: "rgb(var(--c) / 0.28)",
              background: "rgb(var(--c) / 0.06)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "rgb(var(--c) / 0.55)";
              e.currentTarget.style.background = "rgb(var(--c) / 0.12)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "rgb(var(--c) / 0.28)";
              e.currentTarget.style.background = "rgb(var(--c) / 0.06)";
            }}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

function InChatResult({
  sectorName,
  advice,
  worry,
}: {
  sectorName: string;
  advice: (typeof SECTOR_ADVICE)[string];
  worry: string | null;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE }}
    >
      {/* divider - marks the transition from Q&A to result */}
      <div className="my-5 flex items-center gap-3">
        <div className="h-px flex-1" style={{ background: "rgb(var(--c) / 0.2)" }} />
        <span
          className="flex items-center gap-1.5 rounded-pill border px-3 py-1 font-mono text-label uppercase tracking-wider"
          style={{
            borderColor: "rgb(var(--c) / 0.3)",
            background: "rgb(var(--c) / 0.07)",
            color: "rgb(var(--c))",
          }}
        >
          <Sparkles className="h-3 w-3" />
          Your {sectorName} briefing
        </span>
        <div className="h-px flex-1" style={{ background: "rgb(var(--c) / 0.2)" }} />
      </div>

      {/* briefing card - distinct visual register from the chat bubbles */}
      <div
        className="relative overflow-hidden rounded-2xl border"
        style={{
          borderColor: "rgb(var(--c) / 0.22)",
          boxShadow: "0 20px 60px -30px rgb(var(--c) / 0.3)",
        }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(80% 55% at 100% 0%, rgb(var(--c) / 0.12), transparent 52%), var(--surface-2)",
          }}
        />

        {/* sector + stat header */}
        <div
          className="relative z-10 flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4"
          style={{ borderColor: "rgb(var(--c) / 0.14)" }}
        >
          <div>
            <p className="font-mono text-label uppercase tracking-widest text-text-faint">
              Why DPDP matters for
            </p>
            <p className="mt-0.5 text-lg font-semibold text-text">{sectorName}</p>
          </div>
          <div
            className="rounded-xl border px-4 py-2 text-right"
            style={{
              borderColor: "rgb(var(--c) / 0.28)",
              background: "rgb(var(--c) / 0.09)",
            }}
          >
            <p className="font-display text-2xl font-bold leading-none" style={{ color: "rgb(var(--c))" }}>
              {advice.stat.value}
            </p>
            <p className="mt-0.5 text-label text-text-muted">{advice.stat.label}</p>
          </div>
        </div>

        <div className="relative z-10">

          {/* why it matters */}
          <div className="border-b px-5 py-5" style={{ borderColor: "rgb(var(--c) / 0.1)" }}>
            <p className="text-[15px] leading-relaxed text-text">{advice.why}</p>
          </div>

          {/* what the law expects */}
          <div className="border-b px-5 py-5" style={{ borderColor: "rgb(var(--c) / 0.1)" }}>
            <div className="mb-3 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 shrink-0" style={{ color: "rgb(var(--c))" }} />
              <span className="font-mono text-label uppercase tracking-widest text-text-faint">
                What the law expects
              </span>
            </div>
            <ul className="space-y-4">
              {advice.obligations.map((o) => (
                <li key={o.title}>
                  <p className="text-sm font-semibold text-text">{o.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-text-muted">{o.body}</p>
                </li>
              ))}
            </ul>
          </div>

          {/* what's at stake */}
          <div className="border-b px-5 py-5" style={{ borderColor: "rgb(var(--c) / 0.1)" }}>
            <div className="mb-3 flex items-center gap-2">
              <Scale className="h-4 w-4 shrink-0 text-red" />
              <span className="font-mono text-label uppercase tracking-widest text-text-faint">
                What&apos;s at stake
              </span>
            </div>
            <p className="text-sm font-medium leading-relaxed text-text">{advice.penalty}</p>
            <p className="mt-2 text-sm italic leading-relaxed text-text-muted">{advice.scenario}</p>
          </div>

          {/* where to start */}
          <div className="border-b px-5 py-5" style={{ borderColor: "rgb(var(--c) / 0.1)" }}>
            <div className="mb-3 flex items-center gap-2">
              <ListChecks className="h-4 w-4 shrink-0" style={{ color: "rgb(var(--c))" }} />
              <span className="font-mono text-label uppercase tracking-widest text-text-faint">
                {worry ? `Because you flagged "${worry}", start here` : "Where to start"}
              </span>
            </div>
            <ol className="space-y-3">
              {advice.actions.map((a, i) => (
                <li key={a} className="flex items-start gap-3">
                  <span
                    className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-bold"
                    style={{
                      background: "rgb(var(--c) / 0.14)",
                      color: "rgb(var(--c))",
                      border: "1px solid rgb(var(--c) / 0.25)",
                    }}
                  >
                    {i + 1}
                  </span>
                  <span className="text-sm leading-relaxed text-text">{a}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* CTA footer */}
          <div
            className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
            style={{ background: "rgb(var(--c) / 0.04)" }}
          >
            <p className="text-sm text-text-muted">Ready to move beyond the briefing?</p>
            <div className="flex flex-wrap gap-2">
              <Link href="/solutions" className="btn btn-accent gap-1.5">
                See the services <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/tools" className="btn btn-ghost gap-1.5">
                Check your readiness <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

        </div>
      </div>
    </motion.div>
  );
}

function sectorFront(name: string): ReactNode {
  switch (name) {
    case "BFSI":
      return (
        <g>
          <Building x={54} w={46} top={132} tone={0.14} roof="antenna" />
          <Building x={1330} w={44} top={140} tone={0.14} roof="tank" />
          <rect x="128" y="214" width="196" height="86" fill="rgb(var(--c) / 0.15)" />
          <rect x="114" y="288" width="224" height="12" fill="rgb(var(--c) / 0.15)" />
          <g fill="rgb(var(--c) / 0.2)">
            <rect x="146" y="222" width="11" height="60" />
            <rect x="174" y="222" width="11" height="60" />
            <rect x="202" y="222" width="11" height="60" />
            <rect x="230" y="222" width="11" height="60" />
            <rect x="258" y="222" width="11" height="60" />
            <rect x="286" y="222" width="11" height="60" />
          </g>
          <path d="M120 214 L226 166 L332 214 Z" fill="rgb(var(--c) / 0.2)" />
          <circle cx="226" cy="196" r="7" fill="rgb(var(--c) / 0.26)" />
          <Building x={1150} w={94} top={92} tone={0.15} roof="antenna" />
          <rect x="1170" y="80" width="54" height="12" fill="rgb(var(--c) / 0.18)" />
          <Building x={1256} w={58} top={150} tone={0.14} roof="setback" />
        </g>
      );

    case "Healthcare":
      return (
        <g>
          <Building x={54} w={46} top={150} tone={0.14} roof="tank" />
          <Building x={1332} w={44} top={150} tone={0.14} roof="antenna" />
          <rect x="126" y="150" width="100" height="150" rx="3" fill="rgb(var(--c) / 0.15)" />
          <rect x="232" y="200" width="92" height="100" rx="3" fill="rgb(var(--c) / 0.13)" />
          <g fill="rgb(var(--c) / 0.26)">
            <rect x="168" y="162" width="16" height="44" rx="2" />
            <rect x="154" y="176" width="44" height="16" rx="2" />
          </g>
          {windowsFor(126, 196, 100, 0.13)}
          {windowsFor(232, 200, 92, 0.11)}
          <path
            d="M0 132 H150 l14 -30 l16 52 l12 -22 H360"
            fill="none"
            stroke="rgb(var(--c) / 0.28)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Building x={1150} w={98} top={150} tone={0.15} roof="tank" />
          <g fill="rgb(var(--c) / 0.26)">
            <rect x="1168" y="176" width="12" height="56" />
            <rect x="1216" y="176" width="12" height="56" />
            <rect x="1180" y="198" width="36" height="12" />
          </g>
          <Building x={1258} w={54} top={186} tone={0.14} roof="antenna" />
        </g>
      );

    case "Education":
      return (
        <g>
          <Building x={56} w={44} top={158} tone={0.14} roof="pitch" />
          <Building x={1332} w={44} top={150} tone={0.14} roof="antenna" />
          <rect x="132" y="200" width="176" height="100" fill="rgb(var(--c) / 0.15)" />
          <rect x="196" y="138" width="40" height="62" fill="rgb(var(--c) / 0.15)" />
          <path d="M122 200 L220 162 L318 200 Z" fill="rgb(var(--c) / 0.2)" />
          <path d="M190 138 L216 110 L242 138 Z" fill="rgb(var(--c) / 0.2)" />
          <rect x="215" y="90" width="2" height="21" fill="rgb(var(--c) / 0.24)" />
          <path d="M217 92 L237 98 L217 104 Z" fill="rgb(var(--c) / 0.24)" />
          <circle cx="216" cy="166" r="9" fill="rgb(var(--c) / 0.22)" />
          <rect x="203" y="250" width="26" height="50" fill="rgb(var(--c) / 0.2)" />
          {windowsFor(140, 208, 52, 0.12)}
          {windowsFor(256, 208, 52, 0.12)}
          <Building x={1150} w={96} top={168} tone={0.15} roof="tank" />
          <g fill="rgb(var(--c) / 0.22)">
            <path d="M1262 150 L1300 138 L1338 150 L1300 162 Z" />
            <circle cx="1300" cy="182" r="4" />
          </g>
          <path d="M1300 162 L1300 180" stroke="rgb(var(--c) / 0.24)" strokeWidth="3" fill="none" />
          <Building x={1262} w={58} top={190} tone={0.14} roof="flat" />
        </g>
      );

    case "SaaS & IT":
      return (
        <g>
          <Building x={56} w={44} top={150} tone={0.14} roof="antenna" />
          <Building x={1332} w={44} top={158} tone={0.14} roof="setback" />
          <rect x="140" y="156" width="72" height="144" rx="3" fill="rgb(var(--c) / 0.15)" />
          <rect x="220" y="188" width="58" height="112" rx="3" fill="rgb(var(--c) / 0.13)" />
          <g fill="rgb(var(--c) / 0.24)">
            <rect x="150" y="170" width="52" height="7" />
            <rect x="150" y="184" width="52" height="7" />
            <rect x="150" y="198" width="52" height="7" />
            <rect x="150" y="212" width="52" height="7" />
            <rect x="150" y="226" width="52" height="7" />
            <rect x="150" y="240" width="52" height="7" />
            <rect x="230" y="200" width="40" height="6" />
            <rect x="230" y="214" width="40" height="6" />
            <rect x="230" y="228" width="40" height="6" />
            <rect x="230" y="242" width="40" height="6" />
          </g>
          <g fill="rgb(var(--c) / 0.42)">
            <circle cx="204" cy="168" r="3" />
            <circle cx="268" cy="200" r="3" />
          </g>
          <g fill="rgb(var(--c) / 0.16)">
            <circle cx="1180" cy="110" r="20" />
            <circle cx="1206" cy="100" r="25" />
            <circle cx="1234" cy="112" r="18" />
            <rect x="1176" y="110" width="62" height="22" rx="11" />
          </g>
          <Building x={1170} w={70} top={166} tone={0.15} roof="antenna" />
          <g fill="none" stroke="rgb(var(--c) / 0.26)" strokeWidth="3" strokeLinecap="round">
            <path d="M1256 188 a20 20 0 0 1 30 0" />
            <path d="M1250 196 a30 30 0 0 1 42 0" />
          </g>
          <circle cx="1271" cy="186" r="4" fill="rgb(var(--c) / 0.34)" />
          <Building x={1256} w={54} top={208} tone={0.14} roof="tank" />
        </g>
      );

    case "E-Commerce":
      return (
        <g>
          <Building x={56} w={44} top={158} tone={0.14} roof="flat" />
          <Building x={1332} w={44} top={150} tone={0.14} roof="antenna" />
          <rect x="130" y="190" width="110" height="110" fill="rgb(var(--c) / 0.15)" />
          <rect x="248" y="170" width="78" height="130" fill="rgb(var(--c) / 0.13)" />
          <path d="M122 190 L238 190 L228 214 L132 214 Z" fill="rgb(var(--c) / 0.2)" />
          <g fill="rgb(var(--c) / 0.28)">
            <path d="M150 190 L166 190 L158 214 L142 214 Z" />
            <path d="M186 190 L202 190 L194 214 L178 214 Z" />
            <path d="M222 190 L238 190 L230 214 L214 214 Z" />
          </g>
          <g fill="rgb(var(--c) / 0.2)">
            <rect x="160" y="252" width="30" height="48" />
          </g>
          {windowsFor(248, 176, 78, 0.11)}
          <Building x={1150} w={100} top={170} tone={0.15} roof="setback" />
          <rect x="1178" y="158" width="44" height="12" fill="rgb(var(--c) / 0.18)" />
          <rect x="1266" y="196" width="48" height="54" rx="5" fill="rgb(var(--c) / 0.16)" />
          <path d="M1278 198 a12 12 0 0 1 24 0" fill="none" stroke="rgb(var(--c) / 0.3)" strokeWidth="3" />
          <Building x={1322} w={40} top={210} tone={0.14} roof="flat" />
        </g>
      );

    case "Government":
      return (
        <g>
          <Building x={56} w={44} top={150} tone={0.14} roof="flat" />
          <Building x={1332} w={44} top={158} tone={0.14} roof="antenna" />
          <rect x="120" y="204" width="188" height="96" fill="rgb(var(--c) / 0.15)" />
          <rect x="64" y="288" width="300" height="12" fill="rgb(var(--c) / 0.13)" />
          <path d="M170 204 A44 44 0 0 1 258 204 Z" fill="rgb(var(--c) / 0.2)" />
          <rect x="213" y="136" width="2" height="28" fill="rgb(var(--c) / 0.24)" />
          <path d="M215 138 L235 144 L215 150 Z" fill="rgb(var(--c) / 0.24)" />
          <path d="M124 214 L214 184 L304 214 Z" fill="rgb(var(--c) / 0.2)" />
          <g fill="rgb(var(--c) / 0.2)">
            <rect x="136" y="216" width="10" height="66" />
            <rect x="160" y="216" width="10" height="66" />
            <rect x="184" y="216" width="10" height="66" />
            <rect x="208" y="216" width="10" height="66" />
            <rect x="232" y="216" width="10" height="66" />
            <rect x="256" y="216" width="10" height="66" />
            <rect x="280" y="216" width="10" height="66" />
          </g>
          <Building x={1150} w={100} top={180} tone={0.15} roof="flat" />
          <path d="M1150 180 L1200 158 L1250 180 Z" fill="rgb(var(--c) / 0.2)" />
          <rect x="1198" y="138" width="2" height="22" fill="rgb(var(--c) / 0.24)" />
          <path d="M1200 140 L1220 146 L1200 152 Z" fill="rgb(var(--c) / 0.24)" />
          <Building x={1258} w={54} top={206} tone={0.14} roof="tank" />
        </g>
      );

    default:
      return null;
  }
}
