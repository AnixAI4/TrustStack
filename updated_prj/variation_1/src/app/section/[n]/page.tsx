import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Download,
  ExternalLink,
  FileText,
  Lightbulb,
} from "lucide-react";
import { CtaBand } from "@/components/sections/CtaBand";
import { getSection, getAllSections } from "@/content/section-enrichment";
import { SECTION_OFFICIAL_TEXT } from "@/content/section-official-text";
import { ACT_PROVENANCE, getIndiaCodeSectionUrl } from "@/content/act-provenance";
import { OfficialText } from "@/components/resources/OfficialText";
import { Swap } from "@/components/site/EasyContent";
import { RULES } from "@/content/rules";

export function generateStaticParams() {
  return getAllSections().map((s) => ({ n: String(s.n) }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ n: string }>;
}): Promise<Metadata> {
  const { n } = await params;
  const sec = getSection(Number(n));
  if (!sec) return { title: "Section not found | TrustStack" };
  return {
    title: `Section ${sec.n}: ${sec.title} | DPDP Act, 2023`,
    description: sec.summary,
  };
}

function relatedRules(n: number) {
  return RULES.filter(
    (r) =>
      r.mapsTo.includes(`Section ${n}`) ||
      r.mapsTo.includes(`Sections ${n}`) ||
      (n >= 11 && n <= 14 && r.mapsTo.includes("Sections 11"))
  );
}

export default async function SectionDetailPage({
  params,
}: {
  params: Promise<{ n: string }>;
}) {
  const { n: nParam } = await params;
  const n = Number(nParam);
  const all = getAllSections();
  const idx = all.findIndex((s) => s.n === n);
  const sec = idx >= 0 ? all[idx] : null;
  if (!sec) notFound();

  const official = SECTION_OFFICIAL_TEXT[n] ?? "";
  const indiaCodeUrl = getIndiaCodeSectionUrl(n);
  const related = relatedRules(n);
  const prev = idx > 0 ? all[idx - 1] : null;
  const next = idx < all.length - 1 ? all[idx + 1] : null;

  // In Easy read, lead with the plainest one-liner we have (the first sentence
  // of the plain-English explanation) instead of the technical summary.
  const easySummary = sec.plainEnglish.split(/(?<=[.!?])\s+/)[0] || sec.summary;

  return (
    <>
      <article>
        <div className="border-b border-line">
          <div className="container-x py-10 lg:py-14">
            <Link
              href="/act"
              className="inline-flex items-center gap-2 text-sm text-text-muted transition-colors hover:text-accent"
            >
              <ArrowLeft className="h-4 w-4" /> All sections
            </Link>
            <p className="mt-6 font-mono text-xs uppercase tracking-wider text-accent">
              Chapter {sec.chapterN} · {sec.chapter}
            </p>
            <h1 className="mt-3 max-w-3xl font-display text-3xl font-semibold leading-tight tracking-tight text-text sm:text-4xl lg:text-5xl">
              <span className="text-text-faint">Section {sec.n}</span> - {sec.title}
            </h1>
            <p className="mt-5 max-w-2xl text-lg text-text-muted">
              <Swap easy={easySummary}>{sec.summary}</Swap>
            </p>
            <a
              href="/DPDP-Act-2023-official.pdf"
              download="DPDP-Act-2023.pdf"
              className="btn btn-accent mt-6 text-sm"
            >
              <Download className="h-4 w-4" /> Download full Act (PDF)
            </a>
          </div>
        </div>

        <div className="container-x py-12 lg:py-16">
          <div className="grid gap-10 lg:grid-cols-[1fr_300px] lg:gap-14">
            <div>
              <h2 className="font-display text-xl font-semibold text-text">
                In plain English
              </h2>
              <div className="mt-4 space-y-4 text-base leading-relaxed text-text-muted">
                {sec.plainEnglish.split(/\n\n+/).map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>

              {sec.example && (
                <div className="mt-6 flex gap-3 rounded-xl border border-line border-l-2 border-l-accent/60 bg-accent/[0.05] p-4 sm:p-5">
                  <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                  <div>
                    <span className="font-display text-label font-semibold uppercase tracking-[0.12em] text-accent">
                      Example
                    </span>
                    <p className="mt-1.5 text-sm leading-relaxed text-text-muted">
                      {sec.example}
                    </p>
                  </div>
                </div>
              )}

              <h3 className="mt-8 font-display text-lg font-semibold text-text">
                Key points
              </h3>
              <ul className="mt-4 space-y-3">
                {sec.highlights.map((h) => (
                  <li
                    key={h}
                    className="flex gap-3 text-sm leading-relaxed text-text-muted"
                  >
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                    {h}
                  </li>
                ))}
              </ul>

              <div data-rm="normal">
                <h2 className="mt-10 font-display text-xl font-semibold text-text">
                  Official section text
                </h2>
                <div className="mt-5 rounded-xl border border-line bg-surface-2/30 px-5 py-8 sm:px-9 sm:py-10">
                  {official ? (
                    <OfficialText text={official} />
                  ) : (
                    <p className="text-sm text-text-faint">
                      Official text for this section is not yet available.
                      Download the PDF for the full Act.
                    </p>
                  )}
                </div>
              </div>
              <div
                data-rm="easy"
                className="mt-10 flex items-start gap-3 rounded-xl border border-line border-l-2 border-l-accent/50 bg-surface-2/20 p-4 text-sm leading-relaxed text-text-muted"
              >
                <FileText className="mt-0.5 h-4 w-4 shrink-0 text-text-faint" />
                <span>
                  The exact legal wording is hidden in Easy read to keep things
                  simple. Turn Easy read off in the top bar to see the official
                  Act text, or download the full Act PDF above.
                </span>
              </div>
            </div>

            <aside className="lg:sticky lg:top-24 lg:self-start">
              <div className="rounded-xl border border-line bg-surface-2/40 p-5">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-mono text-label uppercase tracking-wider text-text-faint">
                    Source verification
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-pill border border-accent/30 bg-accent/[0.08] px-2.5 py-1 text-xs font-medium text-accent">
                    <BadgeCheck className="h-3.5 w-3.5" /> 44/44 matched
                  </span>
                </div>
                <p className="mt-4 text-sm font-medium text-text">
                  Official text independently matched
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-text-muted">
                  <Swap easy="We checked the legal text on all 44 section pages against the official Gazette and India Code.">
                    All 44 statutory sections were matched to Gazette publication {ACT_PROVENANCE.gazettePublicationId} and independently cross-checked against India Code.
                  </Swap>
                </p>
                <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm">
                  <a
                    href={ACT_PROVENANCE.gazetteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 font-medium text-accent hover:text-accent-soft"
                  >
                    Gazette PDF <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                  <a
                    href={indiaCodeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 font-medium text-accent hover:text-accent-soft"
                  >
                    India Code section <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
                <p className="mt-4 border-t border-line pt-4 text-xs leading-relaxed text-text-faint">
                  <Swap easy="The plain-English part explains the law. It is not the law itself or legal advice.">
                    The plain-English copy was reviewed for fidelity, but remains explanatory rather than statutory wording or legal advice.
                  </Swap>
                </p>
                <p className="mt-2 font-mono text-label text-text-faint">
                  Act as enacted · checked {ACT_PROVENANCE.verifiedOn}
                </p>
              </div>

              <div className="mt-4 rounded-xl border border-line bg-surface-2/40 p-5">
                <span className="font-mono text-label uppercase tracking-wider text-text-faint">
                  Related rules
                </span>
                {related.length > 0 ? (
                  <ul className="mt-4 space-y-3">
                    {related.map((r) => (
                      <li key={r.n}>
                        <Link
                          href={`/rules/${r.n}`}
                          className="group block rounded-lg border border-line bg-bg-2/40 p-3 transition-colors hover:border-accent/40"
                        >
                          <span className="font-mono text-xs text-accent">
                            Rule {r.n}
                          </span>
                          <span className="mt-1 block text-sm text-text">
                            {r.title}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-sm text-text-muted">
                    No Rules map directly to this section.
                  </p>
                )}
                <Link
                  href="/rules"
                  className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-accent hover:text-accent-soft"
                >
                  Browse all rules →
                </Link>
              </div>
            </aside>
          </div>
        </div>

        <div className="border-t border-line">
          <div className="container-x flex flex-wrap items-center justify-between gap-4 py-8">
            {prev ? (
              <Link
                href={`/section/${prev.n}`}
                className="group inline-flex max-w-sm items-center gap-2 text-sm text-text-muted hover:text-accent"
              >
                <ArrowLeft className="h-4 w-4 shrink-0" />
                <span>
                  <span className="font-mono text-text-faint">S.{prev.n}</span>
                  <span className="block truncate">{prev.title}</span>
                </span>
              </Link>
            ) : (
              <span />
            )}
            {next ? (
              <Link
                href={`/section/${next.n}`}
                className="group inline-flex max-w-sm items-center gap-2 text-right text-sm text-text-muted hover:text-accent"
              >
                <span>
                  <span className="font-mono text-text-faint">S.{next.n}</span>
                  <span className="block truncate">{next.title}</span>
                </span>
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
