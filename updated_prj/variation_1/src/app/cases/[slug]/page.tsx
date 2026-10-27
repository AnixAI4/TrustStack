import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Scale,
  Landmark,
  BookMarked,
} from "lucide-react";
import { CaseBody } from "@/components/resources/CaseBody";
import { CtaBand } from "@/components/sections/CtaBand";
import { CASES, getCase, type CaseCat } from "@/content/cases";

const CAT_LABEL: Record<CaseCat, string> = {
  privacy: "Right to privacy",
  consent: "Consent & confidentiality",
  surveillance: "Surveillance & the state",
  speech: "Speech & the internet",
};

export function generateStaticParams() {
  return CASES.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const c = getCase(slug);
  if (!c) return { title: "Case not found | TrustStack" };
  return {
    title: `${c.shortTitle} | TrustStack Case Law`,
    description: c.holding,
  };
}

export default async function CaseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const idx = CASES.findIndex((c) => c.slug === slug);
  const c = idx >= 0 ? CASES[idx] : null;
  if (!c) notFound();

  const prev = idx > 0 ? CASES[idx - 1] : null;
  const next = idx < CASES.length - 1 ? CASES[idx + 1] : null;

  return (
    <>
      <article>
        {/* Header */}
        <div className="border-b border-line">
          <div className="container-x py-10 lg:py-14">
            <Link
              href="/cases"
              className="inline-flex items-center gap-2 text-sm text-text-muted transition-colors hover:text-accent"
            >
              <ArrowLeft className="h-4 w-4" /> All case law
            </Link>
            <p className="mt-6 font-mono text-xs uppercase tracking-wider text-accent">
              {CAT_LABEL[c.cat]} · {c.year}
            </p>
            <h1 className="mt-3 max-w-3xl font-display text-3xl font-semibold leading-tight tracking-tight text-text sm:text-4xl lg:text-5xl">
              {c.title}
            </h1>

            {/* Metadata row */}
            <dl className="mt-7 flex flex-wrap gap-x-8 gap-y-4">
              <div className="flex items-start gap-2">
                <Landmark className="mt-0.5 h-4 w-4 shrink-0 text-text-faint" />
                <div>
                  <dt className="font-mono text-label uppercase tracking-wider text-text-faint">
                    Court
                  </dt>
                  <dd className="text-sm text-text">{c.court}</dd>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Scale className="mt-0.5 h-4 w-4 shrink-0 text-text-faint" />
                <div>
                  <dt className="font-mono text-label uppercase tracking-wider text-text-faint">
                    Bench
                  </dt>
                  <dd className="text-sm text-text">{c.bench}</dd>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <BookMarked className="mt-0.5 h-4 w-4 shrink-0 text-text-faint" />
                <div>
                  <dt className="font-mono text-label uppercase tracking-wider text-text-faint">
                    Citation
                  </dt>
                  <dd className="text-sm text-text">{c.citation}</dd>
                </div>
              </div>
            </dl>
          </div>
        </div>

        <div className="container-x py-12 lg:py-16">
          <div className="max-w-prose">
            {/* Headnote: question + holding */}
            <div className="mb-12 rounded-xl border border-line bg-surface-2/40 p-6 sm:p-7">
              <p className="font-mono text-xs uppercase tracking-wider text-text-faint">
                The question
              </p>
              <p className="mt-2 text-lg font-medium leading-relaxed text-text text-pretty">
                {c.question}
              </p>
              <p className="mt-5 font-mono text-xs uppercase tracking-wider text-green-soft">
                What the Court held
              </p>
              <p className="mt-2 text-lg leading-relaxed text-text-muted text-pretty">
                {c.holding}
              </p>
            </div>

            {/* The long read */}
            <CaseBody blocks={c.summary} />

            {/* Why it matters for DPDP */}
            <section className="mt-12 rounded-xl border border-accent/30 bg-accent/[0.06] p-6 sm:p-7">
              <h2 className="flex items-center gap-2 font-display text-xl font-semibold text-text">
                <ShieldCheck className="h-5 w-5 text-accent" />
                Why it matters for the DPDP Act
              </h2>
              <ul className="mt-4 space-y-3">
                {c.whyItMatters.map((point, i) => (
                  <li key={i} className="flex items-start gap-3 text-text-muted">
                    <ArrowRight className="mt-1.5 h-3.5 w-3.5 shrink-0 text-accent" />
                    <span className="leading-relaxed">{point}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Key takeaways */}
            <section className="mt-8">
              <h2 className="font-display text-xl font-semibold text-text">
                Key takeaways
              </h2>
              <ul className="mt-4 space-y-3">
                {c.takeaways.map((point, i) => (
                  <li key={i} className="flex items-start gap-3 text-text-muted">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-soft" />
                    <span className="leading-relaxed">{point}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Verified source link */}
            <aside className="mt-10 flex flex-col gap-4 rounded-xl border border-line bg-glass p-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-display text-base font-semibold text-text">
                  Read the primary source
                </p>
                <p className="mt-1 text-sm text-text-muted">
                  Verified full judgment - open the complete text to read it in the
                  Court&apos;s own words.
                </p>
              </div>
              <a
                href={c.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-accent/40 bg-accent/10 px-4 py-2.5 text-sm font-medium text-accent transition-colors hover:bg-accent/20"
              >
                {c.sourceLabel}
                <ExternalLink className="h-4 w-4" />
              </a>
            </aside>

            <p className="mt-8 border-t border-line pt-6 text-sm leading-relaxed text-text-faint">
              This summary is an editorial explainer for general understanding, not
              legal advice. For any compliance or litigation decision, read the full
              judgment and consult a qualified lawyer.
            </p>
          </div>
        </div>

        {/* Prev / next */}
        <div className="border-t border-line">
          <div className="container-x flex flex-wrap items-center justify-between gap-4 py-8">
            {prev ? (
              <Link
                href={`/cases/${prev.slug}`}
                className="group inline-flex max-w-sm items-center gap-2 text-sm text-text-muted hover:text-accent"
              >
                <ArrowLeft className="h-4 w-4 shrink-0" />
                <span className="truncate">{prev.shortTitle}</span>
              </Link>
            ) : (
              <span />
            )}
            {next ? (
              <Link
                href={`/cases/${next.slug}`}
                className="group inline-flex max-w-sm items-center gap-2 text-right text-sm text-text-muted hover:text-accent"
              >
                <span className="truncate">{next.shortTitle}</span>
                <ArrowRight className="h-4 w-4 shrink-0" />
              </Link>
            ) : (
              <span />
            )}
          </div>
        </div>
      </article>
      <CtaBand />
    </>
  );
}
