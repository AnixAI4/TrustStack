import type { Metadata } from "next";
import Link from "next/link";
import { Wrench, ArrowRight, BadgeCheck } from "lucide-react";
import { LearnPathHero } from "@/components/sections/LearnPathHero";
import { LearnQuiz } from "@/components/resources/LearnQuiz";
import { Faq } from "@/components/resources/Faq";
import { CtaBand } from "@/components/sections/CtaBand";
import { KolamBand } from "@/components/sections/KolamBand";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { LEARN_TOOLS } from "@/content/learn";
import { COURSES } from "@/content/courses";
import { HERO_CONFIGS } from "@/content/hero-configs";

export const metadata: Metadata = {
  title: "Learn & Certify | DPDP course, quiz & tools",
};

export default function LearnPage() {
  return (
    <>
      <LearnPathHero {...HERO_CONFIGS.learn} />

      {/* courses by role */}
      <section className="section">
        <div className="container-x">
          <SectionHeader
            eyebrow="Courses by role"
            title="Pick the course written for you"
            lede="The DPDP Act lands differently on a citizen, a founder, a DPO, a lawyer, an engineer and a student. Choose your track - each maps to the same Act, but teaches what you actually need to do."
          />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {COURSES.map((c) => {
              const Icon = c.icon;
              return (
                <Link
                  key={c.slug}
                  href={`/courses/${c.slug}`}
                  className="group flex flex-col rounded-2xl border border-line bg-surface-2/30 p-6 transition-all hover:-translate-y-0.5 hover:border-accent/40"
                >
                  <div className="flex items-center justify-between">
                    <span className="grid h-11 w-11 place-items-center rounded-xl border border-line bg-glass text-accent">
                      <Icon className="h-5 w-5" />
                    </span>
                    {c.certificate && (
                      <span className="badge">
                        <BadgeCheck className="h-3 w-3" /> Certificate
                      </span>
                    )}
                  </div>
                  <div className="mt-4 font-mono text-label uppercase tracking-wider text-text-faint">
                    {c.persona}
                  </div>
                  <h3 className="mt-1 font-display text-lg font-semibold text-text">{c.title}</h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-text-muted">{c.tagline}</p>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-accent">
                    View course
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              );
            })}
          </div>
          <div className="mt-6">
            <Link href="/courses" className="btn btn-ghost">
              Browse all courses
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* quiz */}
      <section className="section pt-0">
        <div className="container-x">
          <LearnQuiz />
        </div>
      </section>

      {/* tools */}
      <section className="section pt-0">
        <div className="container-x">
          <h2 className="font-display text-2xl font-semibold text-text sm:text-3xl">
            Compliance tools
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {LEARN_TOOLS.map((t) => (
              <Link
                key={t.title}
                href={t.href}
                className="group flex items-center gap-4 rounded-lg border border-line bg-surface-2/40 p-5 transition-all hover:-translate-y-0.5 hover:border-accent/40"
              >
                <span className="grid h-11 w-11 place-items-center rounded-lg border border-line bg-glass text-accent">
                  <Wrench className="h-5 w-5" />
                </span>
                <span>
                  <span className="block font-display font-semibold text-text">
                    {t.title}
                  </span>
                  <span className="block text-sm text-text-muted">{t.sub}</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* faq */}
      <section className="section pt-0">
        <div className="container-x">
          <SectionHeader
            eyebrow="Answers"
            title="Frequently asked questions"
            align="center"
            className="mb-10"
          />
          <Faq />
        </div>
      </section>

      <KolamBand />
      <CtaBand />
    </>
  );
}
