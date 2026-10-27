import type { Metadata } from "next";
import Link from "next/link";
import { Users, FileCheck2, ArrowRight } from "lucide-react";
import { CertificationPressHero } from "@/components/sections/CertificationPressHero";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { CtaBand } from "@/components/sections/CtaBand";
import { HERO_CONFIGS } from "@/content/hero-configs";
import { CertificationGate } from "@/components/gates/CertificationGate";
import {
  CERT_OUTCOMES,
  CERT_AUDIENCE,
  CERT_STEPS,
  CERT_FORMAT,
  CERT_FAQ,
  EXAM_SIZE,
  EXAM_PASS_PCT,
  EXAM_MINUTES,
  EXAM_BANK_SIZE,
} from "@/content/certification";

export const metadata: Metadata = {
  title: "Certified DPDP Practitioner | DPDP certification programme",
  description:
    "A free, practitioner-grade certification on India's DPDP Act, 2023 and Rules 2025 - eight section-mapped modules, a timed exam from a 224-question bank, and a verifiable certificate.",
};

export default function CertificationPage() {
  return (
    <>
      <CertificationPressHero {...HERO_CONFIGS.certification} />

      <CertificationGate>
      {/* format facts */}
      <section className="section pb-0">
        <div className="container-x">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {CERT_FORMAT.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.label}
                  className="flex items-center gap-3 rounded-xl border border-line bg-surface-2/30 p-4"
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-line text-accent">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <div className="font-display font-semibold text-text">{f.value}</div>
                    <div className="font-mono text-label uppercase tracking-wider text-text-faint">
                      {f.label}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* curriculum - study via courses (kept short so the modules aren't repeated here) */}
      <section className="section">
        <div className="container-x">
          <SectionHeader
            eyebrow="The curriculum"
            title="Eight modules, mapped to the Act"
            lede="Eight modules cover the DPDP Act, 2023 and the DPDP Rules 2025 - section by section. Rather than repeat them here, study the ground through our role-based courses, then come back to sit the exam and earn your certificate."
          />
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/courses/practitioner" className="btn btn-accent">
              Study the Practitioner track
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/courses" className="btn btn-ghost">
              Browse all courses
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* outcomes */}
      <section className="section">
        <div className="container-x">
          <SectionHeader
            eyebrow="Outcomes"
            title="What you'll be able to do"
            lede="Skills you carry into the role - each maps to a duty the Act actually imposes on a data fiduciary."
          />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {CERT_OUTCOMES.map((o) => {
              const Icon = o.icon;
              return (
                <div key={o.title} className="rounded-xl border border-line bg-surface-2/30 p-5">
                  <span className="grid h-11 w-11 place-items-center rounded-lg border border-line bg-glass text-accent">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 font-display text-lg font-semibold text-text">{o.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-text-muted">{o.desc}</p>
                </div>
              );
            })}
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-2.5 rounded-xl border border-line bg-surface-2/30 p-5">
            <span className="inline-flex items-center gap-2 font-mono text-label uppercase tracking-wider text-text-faint">
              <Users className="h-4 w-4" /> Built for
            </span>
            {CERT_AUDIENCE.map((a) => (
              <span key={a} className="chip">
                {a}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* how it works */}
      <section className="section pt-0">
        <div className="container-x">
          <SectionHeader eyebrow="How it works" title="Four steps to your credential" />
          <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {CERT_STEPS.map((s) => {
              const Icon = s.icon;
              return (
                <li key={s.n} className="rounded-xl border border-line bg-surface-2/30 p-5">
                  <span className="font-mono text-xs text-text-faint">Step {s.n}</span>
                  <span className="mt-3 grid h-10 w-10 place-items-center rounded-lg border border-line text-accent">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-3 font-display font-semibold text-text">{s.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-text-muted">{s.desc}</p>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      {/* certification exam */}
      <section id="programme" className="section pt-0">
        <div className="container-x">
          <SectionHeader
            eyebrow="Assessment"
            title="The certification exam"
            lede={`A timed, ${EXAM_SIZE}-question exam drawn at random from the ${EXAM_BANK_SIZE}-question bank. Score ${EXAM_PASS_PCT}% or higher to earn your certificate.`}
          />
          <div className="mt-10 overflow-hidden rounded-2xl border border-line bg-gradient-to-br from-surface-2/60 to-bg-2 p-6 sm:p-10">
            <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:items-center">
              <div>
                <span className="badge">
                  <FileCheck2 className="h-3 w-3" /> Certification exam
                </span>
                <h3 className="mt-4 font-display text-2xl font-semibold text-text sm:text-3xl">
                  Sit the {EXAM_SIZE}-question examination
                </h3>
                <p className="mt-3 max-w-xl leading-relaxed text-text-muted">
                  A closed-book, {EXAM_MINUTES}-minute exam that opens as a focused, full-screen
                  surface - just the questions, a live timer, and your answered / unanswered
                  progress. Score {EXAM_PASS_PCT}% to earn your certificate.
                </p>
                <Link href="/certification/exam" className="btn btn-accent btn-lg mt-6">
                  <FileCheck2 className="h-4 w-4" /> Begin the exam
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line">
                {[
                  { k: "Questions", v: `${EXAM_SIZE}` },
                  { k: "Time limit", v: `${EXAM_MINUTES} min` },
                  { k: "Pass mark", v: `${EXAM_PASS_PCT}%` },
                  { k: "Question bank", v: `${EXAM_BANK_SIZE}` },
                ].map((s) => (
                  <div key={s.k} className="bg-bg-2/60 p-4">
                    <dt className="font-mono text-label uppercase tracking-wider text-text-faint">
                      {s.k}
                    </dt>
                    <dd className="mt-1 font-display text-2xl font-semibold text-text">{s.v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>
      </section>

      {/* faq */}
      <section className="section pt-0">
        <div className="container-x">
          <SectionHeader
            eyebrow="Questions"
            title="Certification FAQ"
            align="center"
            className="mb-10"
          />
          <div className="mx-auto max-w-3xl space-y-3">
            {CERT_FAQ.map((f) => (
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
      </CertificationGate>

      <CtaBand />
    </>
  );
}
