"use client";

import { type CSSProperties } from "react";
import { motion } from "framer-motion";
import {
  Database,
  AlertTriangle,
  Layers,
  MessageSquare,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { INDUSTRIES } from "@/content/dpdp";
import { OPEN_LEXBOT_EVENT } from "@/lib/progress";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { cn } from "@/lib/cn";
import { EASE } from "@/lib/motion";

/** Per-sector accent hue (rgb triplet var) that themes each card background + logo. */
const SECTOR_C: Record<string, string> = {
  BFSI: "var(--blue-rgb)",
  Healthcare: "var(--green-rgb)",
  Education: "var(--amber-rgb)",
  "SaaS & IT": "var(--brand-rgb)",
  "E-Commerce": "var(--accent-rgb)",
  Government: "var(--red-rgb)",
};

/** Risk label -> existing badge variant (so the risk pill is correctly coloured). */
const RISK_BADGE: Record<string, string> = {
  "Highest risk": "badge-red",
  Critical: "badge-red",
  High: "badge-gold",
  Strategic: "badge-blue",
};

/**
 * Per-sector TrustChat marketing copy. `hook` is a punchy, pain-led one-liner
 * that sells the assistant's relevance to the sector; `primary` + `prompts` are
 * phrased to hit a strong entry in the knowledge base so the seeded answer is
 * relevant and useful.
 */
const SECTOR_CHAT: Record<
  string,
  { hook: string; primary: string; prompts: string[] }
> = {
  BFSI: {
    hook: "From KYC consent to RBI overlaps and GenAI risk - get a straight answer before your next audit, not a lawyer's bill.",
    primary: "How does DPDP apply to banks, NBFCs and fintech?",
    prompts: [
      "How do RBI rules on data localisation fit DPDP?",
      "What consent do we need for credit-bureau data?",
    ],
  },
  Healthcare: {
    hook: "Patient records, children's consent, the 72-hour breach clock - clarity in seconds, not billable hours.",
    primary: "What does DPDP require for hospitals and patient health data?",
    prompts: [
      "Do we need parental consent for a child's records?",
      "How fast must we report a health-data breach?",
    ],
  },
  Education: {
    hook: "Parental consent, student data, EdTech profiling limits - the rules for schools without the legalese.",
    primary: "How does DPDP protect student data in schools and edtech?",
    prompts: [
      "What is verifiable parental consent?",
      "Can edtech profile or target students?",
    ],
  },
  "SaaS & IT": {
    hook: "Processor duties, cross-border transfers, AI-training data - answers that keep your roadmap moving.",
    primary: "Are SaaS platforms data processors under DPDP?",
    prompts: [
      "What are our processor obligations?",
      "Can we transfer customer data cross-border?",
    ],
  },
  "E-Commerce": {
    hook: "Cookie consent, WhatsApp marketing, loyalty and CRM data - know what's allowed before you hit send.",
    primary: "Do we need consent for cookies and WhatsApp marketing?",
    prompts: [
      "How should we handle cookie consent?",
      "What are DPDP's data retention rules?",
    ],
  },
  Government: {
    hook: "Citizen data, legitimate uses, Aadhaar-linked services - public-sector answers in plain language.",
    primary: "Can government use citizen data without consent for State subsidies?",
    prompts: [
      "What legitimate uses apply to State services?",
      "What are the 7 principles we must follow?",
    ],
  },
};

/** Open TrustChat (the site's DPDP assistant) pre-seeded with a question. */
function askTrustChat(question: string) {
  window.dispatchEvent(
    new CustomEvent(OPEN_LEXBOT_EVENT, { detail: { ask: question } })
  );
}

export function IndustriesSection({ id, active }: { id?: string; active: number }) {
  const ind = INDUSTRIES[active] ?? INDUSTRIES[0];
  const Icon = ind.icon;

  return (
    <section id={id} className="section scroll-mt-24">
      <div className="container-x">
        <SectionHeader
          eyebrow="By sector"
          title="Built for every industry that handles personal data"
          lede="Industry-specific playbooks mean faster implementation, less risk and better outcomes. Pick a sector to see what matters most."
        />

        <div
            id="industry-sector-panel"
            role="tabpanel"
            aria-labelledby={`industry-model-tab-${active}`}
            className="relative mt-6 overflow-hidden rounded-2xl border p-6 sm:p-8"
            style={
              {
                "--c": SECTOR_C[ind.name] ?? "var(--accent-rgb)",
                borderColor: "rgb(var(--c) / 0.22)",
                boxShadow: "0 26px 70px -42px rgb(var(--c) / 0.6)",
              } as CSSProperties
            }
        >
            {/* per-sector themed background */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "radial-gradient(85% 78% at 92% 0%, rgb(var(--c) / 0.22), transparent 46%), radial-gradient(72% 66% at 0% 100%, rgb(var(--c) / 0.13), transparent 46%), linear-gradient(135deg, rgb(var(--c) / 0.10), transparent 44%), var(--surface-2)",
              }}
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                backgroundImage:
                  "linear-gradient(rgb(var(--c) / 0.10) 1px, transparent 1px), linear-gradient(90deg, rgb(var(--c) / 0.10) 1px, transparent 1px)",
                backgroundSize: "34px 34px",
                maskImage:
                  "radial-gradient(78% 74% at 28% 18%, #000, transparent 76%)",
                WebkitMaskImage:
                  "radial-gradient(78% 74% at 28% 18%, #000, transparent 76%)",
              }}
            />
            <Icon
              aria-hidden
              className="pointer-events-none absolute -bottom-12 -right-10 h-72 w-72 rotate-[-8deg]"
              style={{ color: "rgb(var(--c))", opacity: 0.07 }}
              strokeWidth={1}
            />

            {/* content */}
            <div className="relative z-10 grid gap-6 lg:grid-cols-[280px_1fr]">
              <div
                className="flex flex-col items-center gap-5 text-center lg:items-start lg:justify-center lg:border-r lg:pr-7 lg:text-left"
                style={{ borderColor: "rgb(var(--c) / 0.16)" }}
              >
                <div className="relative">
                  <div
                    aria-hidden
                    className="absolute inset-0 rounded-full blur-2xl"
                    style={{ background: "rgb(var(--c) / 0.4)" }}
                  />
                  <div
                    className="relative grid h-24 w-24 place-items-center rounded-3xl"
                    style={{
                      background:
                        "linear-gradient(150deg, rgb(var(--c) / 0.34), rgb(var(--c) / 0.08))",
                      border: "1px solid rgb(var(--c) / 0.38)",
                      boxShadow:
                        "inset 0 1px 0 rgb(255 255 255 / 0.22), 0 20px 40px -18px rgb(var(--c) / 0.7)",
                    }}
                  >
                    <Icon
                      className="h-12 w-12"
                      style={{ color: "rgb(var(--c))" }}
                      strokeWidth={1.6}
                    />
                  </div>
                </div>
                <div>
                  <h3 className="font-display text-2xl font-semibold text-text">
                    {ind.name}
                  </h3>
                  <span className={cn("badge mt-2", RISK_BADGE[ind.risk])}>
                    {ind.risk}
                  </span>
                </div>
              </div>

              <div className="grid gap-6 sm:grid-cols-3">
                <Column icon={Database} title="Data" items={ind.data} tone="muted" />
                <Column
                  icon={AlertTriangle}
                  title="Key risks"
                  items={ind.risks}
                  tone="amber"
                />
                <Column
                  icon={Layers}
                  title="Services"
                  items={ind.services}
                  tone="accent"
                />
              </div>
            </div>
        </div>

        <TrustChatPromo
          key={ind.name}
          sector={ind.name}
          accent={SECTOR_C[ind.name] ?? "var(--accent-rgb)"}
        />
      </div>
    </section>
  );
}

/**
 * Sector-aware promotion for TrustChat - the site's DPDP assistant. It reacts to
 * the currently selected industry and opens the chat pre-seeded with a relevant
 * question (primary CTA) or one of two quick prompts.
 */
function TrustChatPromo({ sector, accent }: { sector: string; accent: string }) {
  const chat = SECTOR_CHAT[sector] ?? {
    hook: `Consent, breach rules, penalties - get plain-language DPDP answers for ${sector} in seconds.`,
    primary: `How does DPDP apply to ${sector}?`,
    prompts: ["Who must comply with DPDP?", "What are the penalties?"],
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: EASE }}
      className="relative mt-6 overflow-hidden rounded-2xl border p-6 sm:p-7"
      style={
        {
          "--c": accent,
          borderColor: "rgb(var(--c) / 0.22)",
          boxShadow: "0 26px 70px -46px rgb(var(--c) / 0.55)",
        } as CSSProperties
      }
    >
      {/* themed backdrop */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(70% 84% at 100% 0%, rgb(var(--c) / 0.16), transparent 55%), linear-gradient(135deg, rgb(var(--c) / 0.08), transparent 42%), var(--surface-2)",
        }}
      />

      <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4">
          {/* TrustChat mark */}
          <span
            aria-hidden
            className="relative grid h-12 w-12 shrink-0 place-items-center rounded-2xl"
            style={{
              background:
                "linear-gradient(150deg, rgb(var(--c) / 0.34), rgb(var(--c) / 0.08))",
              border: "1px solid rgb(var(--c) / 0.4)",
              boxShadow: "inset 0 1px 0 rgb(255 255 255 / 0.2)",
            }}
          >
            <MessageSquare className="h-6 w-6" style={{ color: "rgb(var(--c))" }} />
          </span>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-label uppercase tracking-widest text-text-faint">
                Ask TrustChat
              </span>
              <span
                className="rounded-pill border px-2 py-0.5 font-mono text-label uppercase tracking-wider"
                style={{
                  borderColor: "rgb(var(--c) / 0.35)",
                  background: "rgb(var(--c) / 0.1)",
                  color: "rgb(var(--c))",
                }}
              >
                Free · Instant · Private
              </span>
            </div>
            <h3 className="mt-1.5 font-display text-xl font-semibold text-text">
              Have a DPDP question about {sector}?
            </h3>
            <p className="mt-1.5 max-w-xl text-sm font-medium text-text">
              {chat.hook}
            </p>
            <p className="mt-1 max-w-xl text-sm text-text-muted">
              Trained on the full DPDP Act 2023 &amp; Rules 2025, TrustChat
              answers in seconds - right here in your browser. No sign-up, no
              sales call.
            </p>

            {/* quick prompts */}
            <div className="mt-3 flex flex-wrap gap-2">
              {chat.prompts.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => askTrustChat(p)}
                  className="inline-flex items-center gap-1.5 rounded-pill border px-3 py-1.5 text-xs font-medium text-text-muted transition-all hover:-translate-y-0.5 hover:text-text"
                  style={{
                    borderColor: "rgb(var(--c) / 0.28)",
                    background: "rgb(var(--c) / 0.06)",
                  }}
                >
                  <Sparkles
                    className="h-3 w-3"
                    style={{ color: "rgb(var(--c))" }}
                  />
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* primary CTA */}
        <button
          type="button"
          onClick={() => askTrustChat(chat.primary)}
          aria-label={`Ask TrustChat about DPDP for ${sector}`}
          className="group inline-flex shrink-0 items-center justify-center gap-2 rounded-pill border px-5 py-3 text-sm font-semibold text-text transition-all hover:-translate-y-0.5"
          style={{
            borderColor: "rgb(var(--c) / 0.5)",
            background: "rgb(var(--c) / 0.14)",
          }}
        >
          <MessageSquare className="h-4 w-4" style={{ color: "rgb(var(--c))" }} />
          Ask about {sector}
          <ArrowRight
            className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
            style={{ color: "rgb(var(--c))" }}
          />
        </button>
      </div>
    </motion.div>
  );
}

function Column({
  icon: Icon,
  title,
  items,
  tone,
}: {
  icon: typeof Database;
  title: string;
  items: string[];
  tone: "muted" | "amber" | "accent";
}) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <Icon
          className={cn(
            "h-4 w-4",
            tone === "amber"
              ? "text-amber"
              : tone === "accent"
                ? "text-accent"
                : "text-text-faint"
          )}
        />
        <span className="font-mono text-label uppercase tracking-wider text-text-faint">
          {title}
        </span>
      </div>
      <ul className="mt-3 space-y-2">
        {items.map((it) => (
          <li key={it} className="text-sm text-text-muted">
            {it}
          </li>
        ))}
      </ul>
    </div>
  );
}

