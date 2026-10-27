import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BadgeCheck, Clock, Layers } from "lucide-react";
import { CoursesRouterHero } from "@/components/sections/CoursesRouterHero";
import { CtaBand } from "@/components/sections/CtaBand";
import { COURSES } from "@/content/courses";
import { HERO_CONFIGS } from "@/content/hero-configs";

export const metadata: Metadata = {
  title: "Courses by Role | DPDP learning paths for every persona | TrustStack",
  description:
    "Pick the DPDP course written for your role - citizens, founders, DPOs, legal teams, engineers and students. Each is a section-mapped curriculum that teaches what you actually need to do.",
};

export default function CoursesPage() {
  return (
    <>
      <CoursesRouterHero {...HERO_CONFIGS.courses} />

      <section className="section">
        <div className="container-x">
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {COURSES.map((c) => {
              const Icon = c.icon;
              return (
                <Link
                  key={c.slug}
                  href={`/courses/${c.slug}`}
                  className="group flex flex-col rounded-2xl border border-line bg-surface-2/30 p-6 transition-all hover:-translate-y-0.5 hover:border-accent/40"
                >
                  <div className="flex items-center justify-between">
                    <span className="grid h-12 w-12 place-items-center rounded-xl border border-line bg-glass text-accent">
                      <Icon className="h-6 w-6" />
                    </span>
                    {c.certificate && (
                      <span className="badge">
                        <BadgeCheck className="h-3 w-3" /> Certificate
                      </span>
                    )}
                  </div>
                  <div className="mt-5 font-mono text-label uppercase tracking-wider text-text-faint">
                    {c.persona}
                  </div>
                  <h2 className="mt-1 font-display text-xl font-semibold text-text">{c.title}</h2>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-text-muted">{c.tagline}</p>
                  <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-label uppercase tracking-wider text-text-faint">
                    <span className="inline-flex items-center gap-1.5">
                      <Layers className="h-3.5 w-3.5" /> {c.modules.length} modules
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" /> {c.hours}
                    </span>
                    <span className="text-accent/80">{c.level}</span>
                  </div>
                  <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-accent">
                    View course
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
