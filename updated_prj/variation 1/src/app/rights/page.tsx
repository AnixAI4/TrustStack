import type { Metadata } from "next";
import { Check } from "lucide-react";
import { RightsWheelHero } from "@/components/sections/RightsWheelHero";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { CtaBand } from "@/components/sections/CtaBand";
import { RightsRequestGenerator } from "@/components/sections/RightsRequestGenerator";
import { EasyIntro } from "@/components/site/EasyContent";
import {
  DATA_PRINCIPAL_RIGHTS,
  GRIEVANCE_LADDER,
  CHILDREN,
  DUTIES,
  RIGHTS_FAQ,
} from "@/content/rights";
import { HERO_CONFIGS } from "@/content/hero-configs";

export const metadata: Metadata = {
  title: "Your Data, Your Rights | DPDP rights for citizens | TrustStack",
  description:
    "A plain-language guide to your rights under India's DPDP Act, 2023 - access, correction, erasure, grievance, nomination and consent withdrawal - with free, ready-to-send request letters.",
};

export default function RightsPage() {
  return (
    <>
      <RightsWheelHero {...HERO_CONFIGS.rights} />

      <EasyIntro
        title="What this page gives you"
        points={[
          "See your six rights in plain language",
          "Ask a company to show, fix or delete your data",
          "Get a ready-to-send request letter for free",
          "Know what to do if a company ignores you",
        ]}
      >
        You don&apos;t need a lawyer to use your rights. This page explains each
        one in everyday words and hands you the exact letter to send - just
        fill in your details.
      </EasyIntro>

      {/* the rights */}
      <section className="section">
        <div className="container-x">
          <SectionHeader
            eyebrow="The six rights"
            title="What you can ask for"
            lede="Chapter III of the Act spells out exactly what every individual can demand of any company that holds their personal data. No jargon - here's each right and what it means for you."
            easyLede="The law gives every person six clear rights over their own data. Here is each one - and what it means for you - in plain, everyday words."
          />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {DATA_PRINCIPAL_RIGHTS.map((r) => {
              const Icon = r.icon;
              return (
                <div
                  key={r.title}
                  className="rounded-2xl border border-line bg-surface-2/30 p-6 transition-colors hover:border-accent/40"
                >
                  <div className="flex items-center justify-between">
                    <span className="grid h-11 w-11 place-items-center rounded-lg border border-line bg-glass text-accent">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="font-mono text-label uppercase tracking-wider text-accent/80">
                      {r.section}
                    </span>
                  </div>
                  <div className="mt-4 font-mono text-label uppercase tracking-wider text-text-faint">
                    {r.hook}
                  </div>
                  <h3 className="mt-1 font-display text-lg font-semibold text-text">{r.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-text-muted">{r.plain}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* request letter generator */}
      <RightsRequestGenerator id="request" />

      {/* grievance ladder */}
      <section className="section pt-0">
        <div className="container-x">
          <SectionHeader
            eyebrow="If you're not heard"
            title="The grievance ladder"
            lede="If a company won't co-operate, you have a clear path to escalate - all the way to the regulator and beyond."
            easyTitle="How to complain"
            easyLede="If a company won't help, you have a clear path to complain - step by step, all the way up to the government's Data Protection Board."
          />
          <ol className="mt-10 grid gap-4 lg:grid-cols-4">
            {GRIEVANCE_LADDER.map((s) => {
              const Icon = s.icon;
              return (
                <li
                  key={s.step}
                  className="relative rounded-2xl border border-line bg-surface-2/30 p-6"
                >
                  <div className="flex items-center justify-between">
                    <span className="grid h-11 w-11 place-items-center rounded-lg border border-line bg-glass text-accent">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="font-display text-3xl font-semibold text-text-faint/40">
                      {s.step}
                    </span>
                  </div>
                  <h3 className="mt-4 font-display font-semibold text-text">{s.title}</h3>
                  <div className="mt-0.5 font-mono text-label uppercase tracking-wider text-accent/80">
                    {s.section}
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-text-muted">{s.body}</p>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      {/* children & guardians */}
      <section className="section pt-0">
        <div className="container-x">
          <div className="overflow-hidden rounded-2xl border border-line bg-gradient-to-br from-surface-2/60 to-bg-2 p-6 sm:p-10">
            <div className="max-w-2xl">
              <p className="eyebrow mb-4">{CHILDREN.eyebrow}</p>
              <h2 className="font-display text-3xl font-semibold leading-[1.08] tracking-tight text-balance sm:text-4xl">
                {CHILDREN.title}
              </h2>
              <p className="mt-5 text-lg leading-relaxed text-text-muted text-pretty">
                {CHILDREN.lede}
              </p>
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {CHILDREN.points.map((p) => {
                const Icon = p.icon;
                return (
                  <div
                    key={p.title}
                    className="flex gap-4 rounded-xl border border-line bg-bg-2/50 p-5"
                  >
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-line text-accent">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div>
                      <h3 className="font-display font-semibold text-text">{p.title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-text-muted">{p.body}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* duties */}
      <section className="section pt-0">
        <div className="container-x">
          <SectionHeader eyebrow={DUTIES.eyebrow} title={DUTIES.title} lede={DUTIES.lede} />
          <ul className="mt-8 grid gap-3 sm:grid-cols-2">
            {DUTIES.items.map((d) => (
              <li
                key={d}
                className="flex items-start gap-3 rounded-xl border border-line bg-surface-2/30 p-4 text-sm leading-relaxed text-text-muted"
              >
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                <span>{d}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* faq */}
      <section className="section pt-0">
        <div className="container-x">
          <SectionHeader
            eyebrow="Questions"
            title="Citizen FAQ"
            align="center"
            className="mb-10"
          />
          <div className="mx-auto max-w-3xl space-y-3">
            {RIGHTS_FAQ.map((f) => (
              <details
                key={f.q}
                className="group rounded-lg border border-line bg-surface-2/30 p-5 [&_summary::-webkit-details-marker]:hidden"
              >
                <summary className="flex cursor-pointer items-center justify-between gap-4 font-display font-semibold text-text">
                  {f.q}
                  <span className="text-accent transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-2 text-sm leading-relaxed text-text-muted">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
