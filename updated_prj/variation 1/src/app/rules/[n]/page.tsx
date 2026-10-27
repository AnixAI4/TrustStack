import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Download, ExternalLink, FileText } from "lucide-react";
import { CtaBand } from "@/components/sections/CtaBand";
import { RULES, getRule } from "@/content/rules";
import { RULE_OFFICIAL_TEXT } from "@/content/rule-official-text";
import { Swap } from "@/components/site/EasyContent";

export function generateStaticParams() {
  return RULES.map((r) => ({ n: String(r.n) }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ n: string }>;
}): Promise<Metadata> {
  const { n } = await params;
  const rule = getRule(Number(n));
  if (!rule) return { title: "Rule not found | TrustStack" };
  return {
    title: `Rule ${rule.n}: ${rule.title} | DPDP Rules 2025`,
    description: rule.summary,
  };
}

export default async function RuleDetailPage({
  params,
}: {
  params: Promise<{ n: string }>;
}) {
  const { n: nParam } = await params;
  const n = Number(nParam);
  const idx = RULES.findIndex((r) => r.n === n);
  const rule = idx >= 0 ? RULES[idx] : null;
  if (!rule) notFound();

  const official = RULE_OFFICIAL_TEXT[n] ?? "";
  const prev = idx > 0 ? RULES[idx - 1] : null;
  const next = idx < RULES.length - 1 ? RULES[idx + 1] : null;

  // In Easy read, lead with the plainest one-liner we have.
  const easySummary = rule.plainEnglish.split(/(?<=[.!?])\s+/)[0] || rule.summary;

  return (
    <>
      <article>
        <div className="border-b border-line">
          <div className="container-x py-10 lg:py-14">
            <Link
              href="/rules"
              className="inline-flex items-center gap-2 text-sm text-text-muted transition-colors hover:text-accent"
            >
              <ArrowLeft className="h-4 w-4" /> All rules
            </Link>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-lg border border-line bg-glass font-mono text-sm font-semibold text-accent">
                {rule.n}
              </span>
              <Link
                href="/act"
                className="rounded-pill border border-line px-3 py-1 font-mono text-label uppercase tracking-wider text-text-muted transition-colors hover:border-accent/40 hover:text-accent"
              >
                {rule.mapsTo}
              </Link>
            </div>
            <h1 className="mt-4 max-w-3xl font-display text-3xl font-semibold leading-tight tracking-tight text-text sm:text-4xl lg:text-5xl">
              {rule.title}
            </h1>
            <p className="mt-5 max-w-2xl text-lg text-text-muted">
              <Swap easy={easySummary}>{rule.summary}</Swap>
            </p>
            <a
              href="/DPDP-Rules-2025.pdf"
              download="DPDP-Rules-2025.pdf"
              className="btn btn-accent mt-6 text-sm"
            >
              <Download className="h-4 w-4" /> Download full Rules (PDF)
            </a>
          </div>
        </div>

        <div className="container-x py-12 lg:py-16">
          <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-14">
            <div>
              <h2 className="font-display text-xl font-semibold text-text">
                In plain English
              </h2>
              <p className="mt-4 text-base leading-relaxed text-text-muted">
                {rule.plainEnglish}
              </p>

              <h3 className="mt-8 font-display text-lg font-semibold text-text">
                Key points
              </h3>
              <ul className="mt-4 space-y-3">
                {rule.highlights.map((h) => (
                  <li
                    key={h}
                    className="flex gap-3 text-sm leading-relaxed text-text-muted"
                  >
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                    {h}
                  </li>
                ))}
              </ul>

              <div className="mt-8 rounded-lg border border-line bg-surface-2/40 p-5">
                <p className="text-sm text-text-muted">
                  This rule gives effect to{" "}
                  <strong className="text-text">{rule.mapsTo}</strong> of the
                  Digital Personal Data Protection Act, 2023.
                </p>
                <Link
                  href="/act"
                  className="mt-3 inline-flex items-center gap-1.5 text-sm text-accent hover:underline"
                >
                  Read the parent section <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            <div>
              <div data-rm="normal">
                <h2 className="font-display text-xl font-semibold text-text">
                  Official rule text
                </h2>
                <p className="mt-2 text-sm text-text-faint">
                  Reproduced from the Gazette notification (G.S.R. 846(E), 13
                  November 2025).
                </p>
                <div className="mt-5 max-h-[32rem] overflow-y-auto rounded-lg border border-line bg-surface-2/30 p-5 sm:p-6">
                  {official ? (
                    <div className="space-y-4 font-mono text-xs leading-relaxed text-text-muted sm:text-sm">
                      {official.split(/\n\n+/).map((para, i) => (
                        <p key={i}>{para}</p>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-text-faint">
                      Official text for this rule is not yet available. Download
                      the PDF for the full gazette notification.
                    </p>
                  )}
                </div>
              </div>
              <div
                data-rm="easy"
                className="flex items-start gap-3 rounded-lg border border-line border-l-2 border-l-accent/50 bg-surface-2/20 p-4 text-sm leading-relaxed text-text-muted"
              >
                <FileText className="mt-0.5 h-4 w-4 shrink-0 text-text-faint" />
                <span>
                  We&apos;ve kept this view simple. The exact legal wording is
                  hidden in Easy read - turn Easy read off in the top bar to
                  read the official gazette text, or download the full Rules PDF
                  above.
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-line">
          <div className="container-x flex flex-wrap items-center justify-between gap-4 py-8">
            {prev ? (
              <Link
                href={`/rules/${prev.n}`}
                className="group inline-flex max-w-sm items-center gap-2 text-sm text-text-muted hover:text-accent"
              >
                <ArrowLeft className="h-4 w-4 shrink-0" />
                <span>
                  <span className="font-mono text-text-faint">Rule {prev.n}</span>
                  <span className="block truncate">{prev.title}</span>
                </span>
              </Link>
            ) : (
              <span />
            )}
            {next ? (
              <Link
                href={`/rules/${next.n}`}
                className="group inline-flex max-w-sm items-center gap-2 text-right text-sm text-text-muted hover:text-accent"
              >
                <span>
                  <span className="font-mono text-text-faint">Rule {next.n}</span>
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
