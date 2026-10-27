import {
  BookOpenCheck,
  ChevronRight,
  FileCheck2,
  Scale,
  ShieldCheck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Swap } from "@/components/site/EasyContent";

const DIMENSION_COUNT = 10;

export function FrameworkMethodHero() {
  return (
    <section
      className="page-hero route-hero-standard relative overflow-hidden border-b border-line"
      data-framework-method=""
      style={{
        background:
          "linear-gradient(135deg, var(--bg) 0%, var(--surface-2) 58%, var(--bg) 100%)",
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        aria-hidden="true"
        style={{
          backgroundImage:
            "linear-gradient(rgb(var(--accent-rgb) / 0.05) 1px, transparent 1px), linear-gradient(90deg, rgb(var(--brand-rgb) / 0.045) 1px, transparent 1px)",
          backgroundSize: "42px 42px",
          maskImage: "linear-gradient(90deg, transparent, black 28%, black)",
        }}
      />
      <div
        className="pointer-events-none absolute -left-24 top-[-7rem] h-80 w-80 rounded-full bg-accent/10 blur-[120px]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute right-[-5rem] top-1/2 h-[30rem] w-[30rem] -translate-y-1/2 rounded-full bg-brand/10 blur-[140px]"
        aria-hidden="true"
      />

      <div className="route-hero-inner container-x">
        <div className="route-hero-grid lg:grid-cols-[0.9fr_1.1fr]">
          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <span className="eyebrow">
                <Swap easy="Our simple method">Proprietary methodology</Swap>
              </span>
            </div>

            <h1 className="mt-3 max-w-3xl pb-1 font-display text-4xl font-semibold leading-[1.08] tracking-tight text-balance sm:text-5xl">
              <Swap
                easy={
                  <>
                    Turn privacy law into{" "}
                    <span className="gradient-text">clear action</span>
                  </>
                }
              >
                Turn DPDP law into{" "}
                <span className="gradient-text">operational proof</span>
              </Swap>
            </h1>

            <p className="mt-3 max-w-2xl text-base leading-relaxed text-text-muted text-pretty">
              <Swap easy="We connect the law to the work your teams do every day, then collect the proof that shows your privacy program is working.">
                One operating architecture that connects legal requirements,
                operational controls and evidence you can take to the board or
                the regulator.
              </Swap>
            </p>

            <div className="mt-5 grid max-w-xl grid-cols-3 border-y border-line">
              {[
                ["7", "Disciplines"],
                ["10", "Maturity dimensions"],
                ["100%", "Rules 2025 coverage"],
              ].map(([value, label], index) => (
                <div
                  key={label}
                  className={`py-3 ${index > 0 ? "border-l border-line pl-4 sm:pl-6" : "pr-4 sm:pr-6"}`}
                >
                  <div className="font-display text-3xl font-semibold leading-none text-text">
                    {value}
                  </div>
                  <div className="mt-2 font-mono text-label uppercase tracking-wider text-text-faint">
                    {label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <MethodArchitecture />
        </div>
      </div>
    </section>
  );
}

function MethodArchitecture() {
  return (
    <div
      className="route-hero-stage relative mx-auto h-[220px] w-full max-w-[620px] lg:h-[var(--route-hero-stage-height)]"
      aria-hidden="true"
      data-method-architecture=""
    >
      <CompactMethodArchitecture />

      <div className="absolute inset-x-0 top-1/2 hidden h-[350px] -translate-y-1/2 lg:block">
        <div className="absolute inset-x-[3%] top-4 h-[322px] border border-line bg-surface shadow-[0_34px_90px_-46px_rgb(var(--text-rgb)/0.44)] sm:inset-x-[5%]">
          <div className="flex h-[52px] items-center border-b border-line px-4 sm:px-5">
            <div className="flex items-center gap-2 font-mono text-label font-semibold uppercase tracking-wider text-accent">
              <span className="h-2 w-2 rounded-full bg-accent" />
              Anix 7D assurance model
            </div>
            <div className="ml-auto font-mono text-label uppercase tracking-wider text-text-faint">
              Law → proof
            </div>
          </div>

          <div className="h-[206px] border-b border-line bg-surface-2/45 px-4 py-4 sm:px-5">
            <div className="grid h-full grid-cols-[minmax(0,1fr)_18px_116px_18px_minmax(0,1fr)] items-center">
              <ArchitectureGroup
                eyebrow="Statutory inputs"
                items={[
                  {
                    icon: Scale,
                    label: "DPDP Act 2023",
                    meta: "Legal duties",
                    color: "var(--gold-rgb)",
                  },
                  {
                    icon: BookOpenCheck,
                    label: "Rules 2025",
                    meta: "Operational detail",
                    color: "var(--amber-rgb)",
                  },
                ]}
              />

              <FlowConnector />

              <div className="relative mx-auto grid h-[116px] w-[116px] place-items-center rounded-full border-2 border-accent/50 bg-bg shadow-[0_22px_54px_-28px_rgb(var(--accent-rgb)/0.9)]">
                <div className="absolute inset-[7px] rounded-full border border-dashed border-accent/30" />
                <div className="absolute inset-[17px] rounded-full bg-accent/5" />
                <div className="relative text-center">
                  <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">
                    Method core
                  </div>
                  <div className="mt-0.5 font-display text-[3.1rem] font-semibold leading-none text-text">
                    7D
                  </div>
                  <div className="mt-1 font-mono text-[10px] uppercase tracking-wider text-text-faint">
                    Operate
                  </div>
                </div>
              </div>

              <FlowConnector />

              <ArchitectureGroup
                eyebrow="Assurance outputs"
                items={[
                  {
                    icon: ShieldCheck,
                    label: "Controls",
                    meta: "Owned and operated",
                    color: "var(--green-rgb)",
                  },
                  {
                    icon: FileCheck2,
                    label: "Evidence",
                    meta: "Board and regulator",
                    color: "var(--blue-rgb)",
                  },
                ]}
              />
            </div>
          </div>

          <div className="flex h-[63px] items-center gap-3 px-4 sm:px-5">
            <div className="shrink-0">
              <div className="font-mono text-label uppercase tracking-wider text-text-faint">
                Maturity model
              </div>
              <div className="mt-0.5 text-xs text-text-muted">
                10 dimensions
              </div>
            </div>
            <DimensionMarkers />
          </div>
        </div>
      </div>
    </div>
  );
}

function CompactMethodArchitecture() {
  return (
    <div className="absolute inset-x-0 top-1/2 h-[210px] -translate-y-1/2 border border-line bg-surface shadow-[0_24px_70px_-40px_rgb(var(--accent-rgb)/0.65)] lg:hidden">
      <div className="flex h-10 items-center border-b border-line px-3">
        <span className="h-2 w-2 rounded-full bg-accent" />
        <span className="ml-2 font-mono text-label font-semibold uppercase tracking-wider text-accent">
          7D assurance model
        </span>
        <span className="ml-auto font-mono text-label uppercase tracking-wider text-text-faint">
          Law → proof
        </span>
      </div>

      <div className="grid h-[116px] grid-cols-[1fr_18px_72px_18px_1fr] items-center border-b border-line bg-surface-2/45 px-3">
        <div className="flex h-[62px] min-w-0 items-center border border-gold/35 bg-surface px-2 shadow-[inset_3px_0_0_rgb(var(--gold-rgb)/0.68)]">
          <Scale className="h-4 w-4 shrink-0 text-gold" strokeWidth={1.55} />
          <div className="ml-2 min-w-0">
            <div className="text-xs font-semibold text-text">Law</div>
            <div className="truncate text-[11px] text-text-faint">Act + Rules</div>
          </div>
        </div>

        <CompactFlowConnector />

        <div className="grid h-[72px] w-[72px] place-items-center rounded-full border-2 border-accent/45 bg-bg shadow-[inset_0_0_0_5px_rgb(var(--accent-rgb)/0.05)]">
          <div className="text-center">
            <div className="font-mono text-[9px] uppercase tracking-wider text-accent">
              Core
            </div>
            <div className="font-display text-[2.35rem] font-semibold leading-none text-text">
              7D
            </div>
          </div>
        </div>

        <CompactFlowConnector />

        <div className="flex h-[62px] min-w-0 items-center border border-blue/35 bg-surface px-2 shadow-[inset_-3px_0_0_rgb(var(--blue-rgb)/0.68)]">
          <FileCheck2 className="h-4 w-4 shrink-0 text-blue" strokeWidth={1.55} />
          <div className="ml-2 min-w-0">
            <div className="text-xs font-semibold text-text">Proof</div>
            <div className="text-[10px] leading-tight text-text-faint">
              Controls + evidence
            </div>
          </div>
        </div>
      </div>

      <div className="flex h-[53px] items-center gap-2 px-3">
        <span className="shrink-0 font-mono text-label uppercase tracking-wider text-text-faint">
          10 dimensions
        </span>
        <DimensionMarkers compact />
      </div>
    </div>
  );
}

function ArchitectureGroup({
  eyebrow,
  items,
}: {
  eyebrow: string;
  items: Array<{
    icon: LucideIcon;
    label: string;
    meta: string;
    color: string;
  }>;
}) {
  return (
    <div className="min-w-0">
      <div className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-text-faint">
        {eyebrow}
      </div>
      <div className="space-y-2">
        {items.map(({ icon: Icon, label, meta, color }) => (
          <div
            key={label}
            className="relative flex min-h-[62px] items-center border bg-surface px-2.5 sm:px-3"
            style={{
              borderColor: `rgb(${color} / 0.34)`,
              boxShadow: `inset 3px 0 0 rgb(${color} / 0.72)`,
            }}
          >
            <Icon
              className="h-4 w-4 shrink-0 sm:h-[18px] sm:w-[18px]"
              style={{ color: `rgb(${color})` }}
              strokeWidth={1.55}
            />
            <div className="ml-2 min-w-0">
              <div className="text-xs font-semibold leading-tight text-text sm:text-sm">
                {label}
              </div>
              <div className="mt-1 text-[10px] leading-tight text-text-faint sm:text-[11px]">
                {meta}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FlowConnector() {
  return (
    <div className="flex items-center text-accent/70">
      <span className="h-px min-w-0 flex-1 bg-accent/45" />
      <ChevronRight className="h-4 w-4 shrink-0" strokeWidth={1.7} />
    </div>
  );
}

function CompactFlowConnector() {
  return (
    <div className="grid place-items-center text-accent/70">
      <ChevronRight className="h-4 w-4" strokeWidth={1.7} />
    </div>
  );
}

function DimensionMarkers({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`grid min-w-0 flex-1 grid-cols-10 overflow-hidden border border-line bg-line ${
        compact ? "h-3" : "h-4"
      }`}
    >
      {Array.from({ length: DIMENSION_COUNT }, (_, index) => (
        <span
          key={index}
          className="border-r border-line bg-surface-2 last:border-r-0"
          style={{ boxShadow: "inset 0 2px 0 rgb(var(--accent-rgb) / 0.34)" }}
        />
      ))}
    </div>
  );
}
