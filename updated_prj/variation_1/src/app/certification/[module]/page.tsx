import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Lightbulb,
  Clock,
  FileCheck2,
  GraduationCap,
} from "lucide-react";
import { PageHero } from "@/components/sections/PageHero";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Reveal } from "@/components/ui/Reveal";
import { ModuleQuiz } from "@/components/sections/ModuleQuiz";
import { Flashcards } from "@/components/sections/Flashcards";
import { ScenarioChallenge } from "@/components/sections/ScenarioChallenge";
import { MODULES, getModule } from "@/content/curriculum";

export function generateStaticParams() {
  return MODULES.map((m) => ({ module: m.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ module: string }>;
}): Promise<Metadata> {
  const { module: slug } = await params;
  const mod = getModule(slug);
  if (!mod) return { title: "Module not found | TrustStack" };
  return {
    title: `Module ${mod.n}: ${mod.title} | Certified DPDP Practitioner`,
    description: mod.summary,
  };
}

export default async function ModulePage({
  params,
}: {
  params: Promise<{ module: string }>;
}) {
  const { module: slug } = await params;
  const mod = getModule(slug);
  if (!mod) notFound();

  const idx = MODULES.findIndex((m) => m.slug === slug);
  const prev = idx > 0 ? MODULES[idx - 1] : null;
  const next = idx < MODULES.length - 1 ? MODULES[idx + 1] : null;

  return (
    <>
      <PageHero
        kicker={`Module ${mod.n} of ${MODULES.length}`}
        title={<>{mod.title}</>}
        subhead={mod.summary}
        stats={[
          { value: mod.refs.split(" · ")[0], label: "Sections" },
          { value: `${mod.minutes} min`, label: "Read time" },
          { value: `${mod.lessons.length}`, label: "Lessons" },
          { value: `${mod.quiz.length} Q`, label: "Self-check" },
        ]}
      />

      {/* module stepper */}
      <section className="border-b border-line bg-bg-2/40">
        <div className="container-x py-4">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {MODULES.map((m) => (
              <Link
                key={m.slug}
                href={`/certification/${m.slug}`}
                title={`Module ${m.n}: ${m.title}`}
                className={`group flex shrink-0 items-center gap-2 rounded-pill border px-3 py-1.5 text-xs transition-colors ${
                  m.slug === slug
                    ? "border-accent/50 bg-accent/10 text-text"
                    : "border-line bg-glass text-text-faint hover:border-accent/40 hover:text-text"
                }`}
              >
                <span className="font-mono">{m.n.toString().padStart(2, "0")}</span>
                <span className="hidden max-w-[8rem] truncate sm:inline">{m.title}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* the lessons */}
      <section className="section">
        <div className="container-x">
          <SectionHeader
            eyebrow="The theory"
            title="Work through the module"
            lede={mod.whyItMatters}
          />
          <div className="mt-10 space-y-6">
            {mod.lessons.map((l, i) => (
              <Reveal
                key={l.heading}
                className="rounded-2xl border border-line bg-surface-2/30 p-6 sm:p-8"
              >
                <div className="flex items-start gap-4">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-line bg-glass font-display text-lg font-semibold text-accent">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="font-display text-xl font-semibold text-text sm:text-2xl">
                        {l.heading}
                      </h3>
                      {l.ref && (
                        <span className="rounded-pill border border-line bg-glass px-2.5 py-0.5 font-mono text-label text-accent/90">
                          {l.ref}
                        </span>
                      )}
                    </div>

                    <div className="mt-4 space-y-3.5">
                      {l.body.map((p) => (
                        <p key={p.slice(0, 32)} className="leading-relaxed text-text-muted">
                          {p}
                        </p>
                      ))}
                    </div>

                    {l.bullets && (
                      <ul className="mt-5 grid gap-2.5 sm:grid-cols-2">
                        {l.bullets.map((b) => (
                          <li
                            key={b}
                            className="flex gap-2.5 rounded-lg border border-line bg-glass px-3.5 py-2.5 text-sm leading-relaxed text-text-muted"
                          >
                            <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                            <span>{b}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {l.plainEnglish && (
                      <div className="mt-5 flex gap-3 border-l-2 border-accent/50 pl-4">
                        <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                        <p className="text-[15px] leading-relaxed text-text-muted">
                          <span className="font-medium text-text">In plain English - </span>
                          {l.plainEnglish}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* flashcards */}
      <section className="section pt-0">
        <div className="container-x">
          <SectionHeader
            eyebrow="Flashcards"
            title="Lock in the key terms"
            lede="The exact vocabulary the Act uses. Read the term, define it in your head, then flip to check yourself."
          />
          <div className="mt-8">
            <Flashcards terms={mod.keyTerms} />
          </div>
        </div>
      </section>

      {/* apply it */}
      <section className="section pt-0">
        <div className="container-x">
          <SectionHeader
            eyebrow="Apply it"
            title="Make the call"
            lede="Theory sticks when you use it. Read the situation, decide what the Act requires, then reveal the verdict."
          />
          <div className="mt-8">
            <ScenarioChallenge scenario={mod.scenario} />
          </div>
        </div>
      </section>

      {/* knowledge check */}
      <section className="section pt-0">
        <div className="container-x">
          <SectionHeader
            eyebrow="Self-check"
            title="Test what you've learned"
            lede="Answer these before you move on. They mirror the style of the certification exam - instant feedback, no pressure."
          />
          <div className="mt-8">
            <ModuleQuiz questions={mod.quiz} />
          </div>
        </div>
      </section>

      {/* prev / next navigation */}
      <section className="section pt-0">
        <div className="container-x">
          <div className="grid gap-4 sm:grid-cols-2">
            {prev ? (
              <Link
                href={`/certification/${prev.slug}`}
                className="group flex items-center gap-4 rounded-2xl border border-line bg-surface-2/30 p-5 transition-all hover:-translate-y-0.5 hover:border-accent/40"
              >
                <ArrowLeft className="h-5 w-5 shrink-0 text-accent transition-transform group-hover:-translate-x-0.5" />
                <span>
                  <span className="font-mono text-label uppercase tracking-wider text-text-faint">
                    Previous · Module {prev.n}
                  </span>
                  <span className="block font-display font-semibold text-text">{prev.title}</span>
                </span>
              </Link>
            ) : (
              <Link
                href="/certification"
                className="group flex items-center gap-4 rounded-2xl border border-line bg-surface-2/30 p-5 transition-all hover:-translate-y-0.5 hover:border-accent/40"
              >
                <ArrowLeft className="h-5 w-5 shrink-0 text-accent transition-transform group-hover:-translate-x-0.5" />
                <span>
                  <span className="font-mono text-label uppercase tracking-wider text-text-faint">
                    Back to
                  </span>
                  <span className="block font-display font-semibold text-text">
                    Certification overview
                  </span>
                </span>
              </Link>
            )}

            {next ? (
              <Link
                href={`/certification/${next.slug}`}
                className="group flex items-center justify-end gap-4 rounded-2xl border border-line bg-surface-2/30 p-5 text-right transition-all hover:-translate-y-0.5 hover:border-accent/40"
              >
                <span>
                  <span className="font-mono text-label uppercase tracking-wider text-text-faint">
                    Next · Module {next.n}
                  </span>
                  <span className="block font-display font-semibold text-text">{next.title}</span>
                </span>
                <ArrowRight className="h-5 w-5 shrink-0 text-accent transition-transform group-hover:translate-x-0.5" />
              </Link>
            ) : (
              <Link
                href="/certification/exam"
                className="group flex items-center justify-end gap-4 rounded-2xl border border-accent/40 bg-accent/[0.07] p-5 text-right transition-all hover:-translate-y-0.5 hover:border-accent/60"
              >
                <span>
                  <span className="font-mono text-label uppercase tracking-wider text-accent/80">
                    You&apos;ve finished the modules
                  </span>
                  <span className="block font-display font-semibold text-text">
                    Sit the certification exam
                  </span>
                </span>
                <FileCheck2 className="h-5 w-5 shrink-0 text-accent" />
              </Link>
            )}
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
            <Link
              href="/certification"
              className="inline-flex items-center gap-1.5 text-sm text-text-faint transition-colors hover:text-accent"
            >
              <GraduationCap className="h-4 w-4" /> All modules
            </Link>
            <div className="flex items-center gap-1.5 font-mono text-label uppercase tracking-wider text-text-faint">
              <Clock className="h-3.5 w-3.5" /> {mod.minutes} min read
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
