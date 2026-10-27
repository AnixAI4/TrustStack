import type { ReactNode } from "react";
import { Swap } from "@/components/site/EasyContent";

export type Crumb = { label: string; href: string };

/**
 * THE RULE: the first section's `eyebrow` rendered under this hero must differ
 * from this hero's `kicker` (not equal, nor a prefix/suffix of one another) - * otherwise two identical pills stack under the divider and read as a
 * copy-paste bug. See docs/eyebrow-labels-master-prompt.md.
 */
export function PageHero({
  kicker,
  kickerHindi,
  title,
  subhead,
  stats,
  easyKicker,
  easyTitle,
  easySubhead,
}: {
  kicker: string;
  kickerHindi?: string;
  title: ReactNode;
  subhead: string;
  stats?: { value: string; label: string }[];
  /** Plain-language variants, shown when "Easy read" is on. */
  easyKicker?: string;
  easyTitle?: ReactNode;
  easySubhead?: string;
}) {
  return (
    <section className="page-hero route-hero-content-led relative overflow-hidden border-b border-line">
      <div className="pointer-events-none absolute -left-20 top-0 h-64 w-64 rounded-full bg-accent/15 blur-[110px]" />
      <div className="pointer-events-none absolute right-0 top-10 h-64 w-64 rounded-full bg-brand/15 blur-[120px]" />
      <div className="route-hero-inner container-x">
        <div>
          <div className="flex items-center gap-3">
            <span className="eyebrow">
              {easyKicker ? <Swap easy={easyKicker}>{kicker}</Swap> : kicker}
            </span>
            {kickerHindi && (
              <span className="font-deva text-sm text-text-faint" data-rm="normal">
                {kickerHindi}
              </span>
            )}
          </div>

          <h1 className="mt-4 max-w-3xl font-display text-4xl font-semibold leading-[1.08] tracking-tight text-balance sm:text-5xl">
            {easyTitle ? <Swap easy={easyTitle}>{title}</Swap> : title}
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-text-muted text-pretty">
            {easySubhead ? <Swap easy={easySubhead}>{subhead}</Swap> : subhead}
          </p>

          {stats && stats.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-x-10 gap-y-4">
              {stats.map((s) => (
                <div key={s.label}>
                  <div className="font-display text-2xl font-semibold text-text">
                    {s.value}
                  </div>
                  <div className="font-mono text-label uppercase tracking-wider text-text-faint">
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
