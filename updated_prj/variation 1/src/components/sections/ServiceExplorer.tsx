"use client";

import { useState, type CSSProperties, type ReactNode } from "react";
import { useReducedMotion } from "framer-motion";
import {
  Sparkles,
  ArrowRight,
  ArrowUpRight,
  ArrowLeft,
  Check,
  Scale,
  ListChecks,
  Target,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { SERVICES } from "@/content/dpdp";
import { SERVICE_ACCENT, SERVICE_DETAIL } from "@/content/service-detail";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { cn } from "@/lib/cn";

const DEFAULT_ACCENT = "var(--accent-rgb)";

export function ServiceExplorer({ id }: { id?: string }) {
  const [pick, setPick] = useState<string | null>(null);
  const reduce = useReducedMotion();
  const accent = pick ? SERVICE_ACCENT[pick] ?? DEFAULT_ACCENT : DEFAULT_ACCENT;
  const active = !!pick;

  return (
    <section
      id={id}
      className="section scroll-mt-24 relative overflow-hidden"
      style={{ ["--c" as string]: accent } as CSSProperties}
    >
      <div className="container-x relative z-10">
        <SectionHeader
          eyebrow="Find your service"
          easyEyebrow="Pick a service"
          title="Not sure which service you need? Pick one and see exactly what it does."
          easyTitle="Not sure which service you need? Tap one to see what it does."
          lede="Seven services, one journey - from your first workshop to a verifiable credential. Tap any service and we'll show you, in plain English, what it is, who it's for, and what changes after."
          easyLede="Seven services, one path - from your first workshop to a verified certificate. Tap any service to see what it is, who it's for, and what changes after."
        />

        <div className="mt-10">
          {!active ? (
            /* idle - the detailed grid (fades up on appear) */
            <div
              key="svc-grid"
              className="svc-fade-in mx-auto grid max-w-6xl gap-5 sm:grid-cols-2 lg:grid-cols-3"
            >
              {SERVICES.map((s) => (
                <ServiceCard
                  key={s.name}
                  name={s.name}
                  subtitle={s.subtitle}
                  tag={s.tag}
                  desc={s.desc}
                  points={s.points}
                  Icon={s.icon}
                  featured={s.featured}
                  accentVar={SERVICE_ACCENT[s.name] ?? DEFAULT_ACCENT}
                  selected={false}
                  anyActive={false}
                  onClick={() => setPick(s.name)}
                />
              ))}
            </div>
          ) : (
            /* active - compact rail (cards slide in from the left, staggered) + panel (slides in from the right) */
            <div
              key="svc-split"
              className="grid gap-5 lg:grid-cols-[minmax(240px,320px)_1fr] lg:items-start"
            >
              <div className="grid grid-cols-2 gap-2.5 lg:sticky lg:top-24 lg:flex lg:flex-col lg:self-start">
                {SERVICES.map((s, i) => (
                  <div
                    key={s.name}
                    className="svc-rail-in"
                    style={{ animationDelay: `${i * 55}ms` }}
                  >
                    <ServiceCard
                      name={s.name}
                      subtitle={s.subtitle}
                      tag={s.tag}
                      desc={s.desc}
                      points={s.points}
                      Icon={s.icon}
                      featured={s.featured}
                      accentVar={SERVICE_ACCENT[s.name] ?? DEFAULT_ACCENT}
                      selected={pick === s.name}
                      anyActive
                      onClick={() => setPick(s.name)}
                    />
                  </div>
                ))}
              </div>

              {/* right panel - the "rectangle": themed backdrop + extra-info briefing */}
              <div
                className="svc-panel-in relative min-h-[26rem] overflow-hidden rounded-3xl border"
                style={
                  {
                    borderColor: "rgb(var(--c) / 0.24)",
                    boxShadow: "0 34px 90px -54px rgb(var(--c) / 0.65)",
                    background: "var(--surface-2)",
                  } as CSSProperties
                }
              >
                {/* themed backdrop - layered accent light + a fine grid (abstract &
                    designed, NOT literal icons), tinted to the active service */}
                <ServicePanelBackdrop />
                {/* the extra info appears in the rectangle. Keyed by `pick` so switching
                    service REPLACES the body (no overlap / no ghosting) with a soft fade */}
                <div className="relative z-10">
                  <div key={pick} className={reduce ? undefined : "svc-brief-in"}>
                    {pick && (
                      <BriefingBody
                        name={pick}
                        onPick={setPick}
                        onReset={() => setPick(null)}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {!active && (
          <p className="mt-6 text-center font-mono text-label uppercase tracking-wider text-text-faint">
            Tap a service above to see its briefing
          </p>
        )}
      </div>
    </section>
  );
}

/* ── themed panel backdrop: a soft accent glow + a fine engineering grid that fades
   out toward the lower-left. Abstract & premium (NOT literal icons); tints to the
   active service via --c so each service reads as its own colour world. ───────── */
function ServicePanelBackdrop() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
    >
      {/* primary glow, upper-right */}
      <div
        className="absolute -right-24 -top-28 h-80 w-80 rounded-full blur-[90px]"
        style={{ background: "rgb(var(--c) / 0.2)" }}
      />
      {/* secondary glow, lower-left */}
      <div
        className="absolute -bottom-28 -left-20 h-72 w-72 rounded-full blur-[90px]"
        style={{ background: "rgb(var(--c) / 0.12)" }}
      />
      {/* fine engineering grid, masked to fade from the top-right corner */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgb(var(--c) / 0.05) 1px, transparent 1px), linear-gradient(90deg, rgb(var(--c) / 0.05) 1px, transparent 1px)",
          backgroundSize: "34px 34px",
          WebkitMaskImage:
            "radial-gradient(130% 100% at 100% 0%, #000 12%, transparent 70%)",
          maskImage:
            "radial-gradient(130% 100% at 100% 0%, #000 12%, transparent 70%)",
        }}
      />
      {/* soft top sheen for depth */}
      <div
        className="absolute inset-x-0 top-0 h-24"
        style={{
          background:
            "linear-gradient(180deg, rgb(var(--c) / 0.06), transparent)",
        }}
      />
    </div>
  );
}

/* ── selector card: the ORIGINAL detailed card (coloured) that shrinks long → short
   and slides into the left rail when a service is picked ────────────────────── */
function ServiceCard({
  name,
  subtitle,
  tag,
  desc,
  points,
  Icon,
  featured,
  accentVar,
  selected,
  anyActive,
  onClick,
}: {
  name: string;
  subtitle: string;
  tag: string;
  desc: string;
  points: string[];
  Icon: LucideIcon;
  featured?: boolean;
  accentVar: string;
  selected: boolean;
  anyActive: boolean;
  onClick: () => void;
}) {
  const restingBorder = selected
    ? "rgb(var(--c) / 0.65)"
    : featured
      ? "rgb(var(--c) / 0.4)"
      : "rgb(var(--c) / 0.2)";
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        "group relative flex w-full flex-col overflow-hidden rounded-2xl border bg-surface-2/40 text-left transition-[transform,box-shadow,padding] duration-300 hover:-translate-y-0.5",
        anyActive ? "p-3.5" : "p-5"
      )}
      style={
        {
          ["--c" as string]: accentVar,
          borderColor: restingBorder,
          background: selected
            ? "rgb(var(--c) / 0.10)"
            : featured
              ? "rgb(var(--c) / 0.06)"
              : undefined,
          boxShadow: selected ? "0 14px 32px -22px rgb(var(--c) / 0.45)" : undefined,
        } as CSSProperties
      }
      onMouseEnter={(e) => {
        if (!selected) e.currentTarget.style.borderColor = "rgb(var(--c) / 0.5)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = restingBorder;
      }}
    >
      {/* header: coloured icon tile + tag (always visible) */}
      <div className="flex items-center justify-between gap-2">
        <span
          className="grid h-10 w-10 shrink-0 place-items-center rounded-lg"
          style={{
            background: "rgb(var(--c) / 0.14)",
            border: "1px solid rgb(var(--c) / 0.28)",
          }}
        >
          <Icon className="h-5 w-5" style={{ color: "rgb(var(--c))" }} />
        </span>
        <span
          className="font-mono text-label uppercase tracking-wider text-text-faint"
          style={selected || featured ? { color: "rgb(var(--c))" } : undefined}
        >
          {tag}
        </span>
      </div>

      {/* name + subtitle (always visible) */}
      <div className={anyActive ? "mt-2" : "mt-4"}>
        <h3 className="font-display text-lg font-semibold leading-tight text-text">
          {name}
        </h3>
        <p
          className="mt-0.5 font-mono text-label uppercase tracking-wider"
          style={{ color: "rgb(var(--c))" }}
        >
          {subtitle}
        </p>
      </div>

      {/* long-only detail - collapses away as the card shrinks into the rail */}
      {!anyActive && (
        <div className="flex flex-1 flex-col">
          <p className="mt-3 text-sm text-text-muted">{desc}</p>
          <ul className="mt-4 flex-1 space-y-2.5">
            {points.map((p) => (
              <li key={p} className="flex items-start gap-2.5">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-soft" />
                <span className="text-sm text-text-muted">{p}</span>
              </li>
            ))}
          </ul>
          <p className="mt-5 text-xs text-text-faint">
            Custom quote · based on organization size
          </p>
        </div>
      )}
    </button>
  );
}

/* ── briefing content (sits inside the panel, over the scene) ───────────────── */
function BriefingBody({
  name,
  onPick,
  onReset,
}: {
  name: string;
  onPick: (name: string) => void;
  onReset: () => void;
}) {
  const svc = SERVICES.find((s) => s.name === name);
  const d = SERVICE_DETAIL[name];
  if (!svc) return null;
  const Icon = svc.icon;
  const youGet = d?.youGet ?? svc.points;
  const mailto = `mailto:consult@anixai.io?subject=${encodeURIComponent(
    `Request a quote - ${name}`
  )}`;

  return (
    <div>
      {/* header: stage pill + name + subtitle, with a back control + stat on the right */}
      <div
        className="flex flex-wrap items-start justify-between gap-3 border-b px-5 py-4 sm:px-6"
        style={{ borderColor: "rgb(var(--c) / 0.14)" }}
      >
        <div className="flex items-start gap-3">
          <span
            className="grid h-11 w-11 shrink-0 place-items-center rounded-xl"
            style={{
              background:
                "linear-gradient(150deg, rgb(var(--c) / 0.34), rgb(var(--c) / 0.10))",
              border: "1px solid rgb(var(--c) / 0.4)",
            }}
          >
            <Icon className="h-5 w-5" style={{ color: "rgb(var(--c))" }} />
          </span>
          <div>
            {d && (
              <span
                className="inline-flex items-center rounded-pill border px-2.5 py-0.5 font-mono text-label uppercase tracking-wider"
                style={{
                  borderColor: "rgb(var(--c) / 0.3)",
                  background: "rgb(var(--c) / 0.08)",
                  color: "rgb(var(--c))",
                }}
              >
                {d.stage}
              </span>
            )}
            <p className="mt-1 text-xl font-semibold leading-tight text-text">{name}</p>
            <p
              className="font-mono text-label uppercase tracking-wider"
              style={{ color: "rgb(var(--c))" }}
            >
              {svc.subtitle}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1.5 rounded-pill border border-line bg-surface/70 px-3 py-1.5 text-xs text-text-muted backdrop-blur transition-colors hover:text-text"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            All services
          </button>
          {d && (
            <div
              className="rounded-xl border px-4 py-2 text-right"
              style={{
                borderColor: "rgb(var(--c) / 0.28)",
                background: "rgb(var(--c) / 0.09)",
              }}
            >
              <p
                className="font-display text-2xl font-bold leading-none"
                style={{ color: "rgb(var(--c))" }}
              >
                {d.stat.value}
              </p>
              <p className="mt-0.5 text-label text-text-muted">{d.stat.label}</p>
            </div>
          )}
        </div>
      </div>

      {/* What it is */}
      <div className="border-b px-5 py-5 sm:px-6" style={{ borderColor: "rgb(var(--c) / 0.1)" }}>
        <SectionEyebrow icon={<Sparkles className="h-4 w-4" />}>What it is</SectionEyebrow>
        <p className="text-[15px] leading-relaxed text-text">{d?.oneLiner ?? svc.desc}</p>
      </div>

      {/* Best for */}
      {d && (
        <div className="border-b px-5 py-5 sm:px-6" style={{ borderColor: "rgb(var(--c) / 0.1)" }}>
          <SectionEyebrow icon={<Users className="h-4 w-4" />}>Best for</SectionEyebrow>
          <div className="flex flex-wrap gap-2">
            {d.bestFor.map((b) => (
              <span
                key={b}
                className="inline-flex items-center rounded-pill border px-3 py-1.5 text-sm text-text-muted"
                style={{
                  borderColor: "rgb(var(--c) / 0.28)",
                  background: "rgb(var(--c) / 0.06)",
                }}
              >
                {b}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* The problem it removes */}
      {d && (
        <div className="border-b px-5 py-5 sm:px-6" style={{ borderColor: "rgb(var(--c) / 0.1)" }}>
          <SectionEyebrow icon={<Scale className="h-4 w-4 text-red" />} muteIcon>
            The problem it removes
          </SectionEyebrow>
          <p className="text-sm leading-relaxed text-text-muted">{d.problem}</p>
        </div>
      )}

      {/* What you get */}
      <div className="border-b px-5 py-5 sm:px-6" style={{ borderColor: "rgb(var(--c) / 0.1)" }}>
        <SectionEyebrow icon={<ListChecks className="h-4 w-4" />}>What you get</SectionEyebrow>
        <ul className="space-y-2.5">
          {youGet.map((p) => (
            <li key={p} className="flex items-start gap-2.5">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-soft" />
              <span className="text-sm leading-relaxed text-text-muted">{p}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* A real scenario */}
      {d && (
        <div className="border-b px-5 py-5 sm:px-6" style={{ borderColor: "rgb(var(--c) / 0.1)" }}>
          <SectionEyebrow icon={<Sparkles className="h-4 w-4" />}>A real scenario</SectionEyebrow>
          <p className="text-sm italic leading-relaxed text-text-muted">{d.scenario}</p>
        </div>
      )}

      {/* The outcome */}
      {d && (
        <div className="border-b px-5 py-5 sm:px-6" style={{ borderColor: "rgb(var(--c) / 0.1)" }}>
          <SectionEyebrow icon={<Target className="h-4 w-4" />}>The outcome</SectionEyebrow>
          <p className="text-sm font-medium leading-relaxed text-text">{d.outcome}</p>
          {d.timeline && (
            <p className="mt-2 font-mono text-label uppercase tracking-wider text-text-faint">
              Timeline · {d.timeline}
            </p>
          )}
        </div>
      )}

      {/* footer: quote + pairs with */}
      <div
        className="flex flex-col gap-4 px-5 py-4 sm:px-6"
        style={{ background: "rgb(var(--c) / 0.05)" }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <a href={mailto} className="btn btn-accent gap-1.5">
            Request a quote <ArrowRight className="h-4 w-4" />
          </a>
        </div>
        {d && d.pairsWith.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-label uppercase tracking-wider text-text-faint">
              Pairs well with
            </span>
            {d.pairsWith.map((p) => {
              const pc = SERVICE_ACCENT[p] ?? DEFAULT_ACCENT;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => onPick(p)}
                  className="inline-flex items-center gap-1 rounded-pill border px-3 py-1.5 text-xs font-semibold transition-all hover:-translate-y-0.5"
                  style={
                    {
                      ["--c" as string]: pc,
                      borderColor: "rgb(var(--c) / 0.4)",
                      background: "rgb(var(--c) / 0.08)",
                      color: "rgb(var(--c))",
                    } as CSSProperties
                  }
                >
                  {p}
                  <ArrowUpRight className="h-3 w-3" />
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function SectionEyebrow({
  icon,
  children,
  muteIcon,
}: {
  icon: ReactNode;
  children: ReactNode;
  muteIcon?: boolean;
}) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <span
        className="shrink-0"
        style={muteIcon ? undefined : { color: "rgb(var(--c))" }}
      >
        {icon}
      </span>
      <span className="font-mono text-label uppercase tracking-widest text-text-faint">
        {children}
      </span>
    </div>
  );
}
