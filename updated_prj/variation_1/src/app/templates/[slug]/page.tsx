import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  FileText,
  Layers,
  ListChecks,
  Lock,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { CtaBand } from "@/components/sections/CtaBand";
import { TemplatesGate } from "@/components/gates/TemplatesGate";
import { ProtectedTemplateReader } from "@/components/resources/ProtectedTemplateReader";
import { TemplateDownloadAside } from "@/components/resources/TemplateDownloadAside";
import { TEMPLATES, TEMPLATE_CAT_META, getTemplate } from "@/content/templates";
import {
  getTemplateDocument,
  getDocHeadings,
  getDocControl,
  getDocWordCount,
} from "@/content/template-documents";

export function generateStaticParams() {
  return TEMPLATES.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const t = getTemplate(slug);
  if (!t) return { title: "Template not found | TrustStack" };
  return {
    title: `${t.title} | DPDP template`,
    description: t.overview,
  };
}

export default async function TemplateDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const idx = TEMPLATES.findIndex((t) => t.slug === slug);
  const template = idx >= 0 ? TEMPLATES[idx] : null;
  const doc = getTemplateDocument(slug);
  if (!template || !doc) notFound();

  const cat = TEMPLATE_CAT_META[template.cat];
  const headings = getDocHeadings(doc);
  const readMin = Math.max(1, Math.round(getDocWordCount(doc) / 200));
  const control = getDocControl(doc);
  const controlMap = Object.fromEntries(control);
  const classification = controlMap["Classification"] ?? "Template";

  const prev = idx > 0 ? TEMPLATES[idx - 1] : null;
  const next = idx < TEMPLATES.length - 1 ? TEMPLATES[idx + 1] : null;

  const facts = [
    { icon: Layers, label: `${headings.length} sections` },
    { icon: Clock, label: `${readMin} min read` },
    { icon: FileText, label: ".docx + PDF" },
    { icon: Lock, label: "Unlock to access" },
    { icon: ShieldCheck, label: classification },
  ];

  return (
    <>
      <TemplatesGate>
        <article>
          <div className="relative overflow-hidden border-b border-line">
            <div className="pointer-events-none absolute -left-24 top-0 h-64 w-64 rounded-full bg-accent/12 blur-[120px]" />
            <div className="container-x py-10 lg:py-14">
              <Link
                href="/templates"
                className="inline-flex items-center gap-2 text-sm text-text-muted transition-colors hover:text-accent"
              >
                <ArrowLeft className="h-4 w-4" /> All templates
              </Link>

              <div className="mt-6 flex flex-wrap items-center gap-2.5">
                <span className={cat.badge}>{cat.label}</span>
                <span className="inline-flex items-center gap-1.5 rounded-pill border border-line bg-glass px-2.5 py-1 font-mono text-label uppercase tracking-wider text-text-muted">
                  <Sparkles className="h-3 w-3 text-accent" /> DPDP 2023 · Rules
                  2025
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-pill border border-accent/30 bg-accent/10 px-2.5 py-1 font-mono text-label uppercase tracking-wider text-accent">
                  Unlock to access
                </span>
              </div>

              <h1 className="mt-4 max-w-3xl font-display text-3xl font-semibold leading-tight tracking-tight text-text sm:text-4xl lg:text-5xl">
                {template.title}
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-relaxed text-text-muted">
                {template.overview}
              </p>

              <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2">
                {facts.map((f) => (
                  <span
                    key={f.label}
                    className="inline-flex items-center gap-2 font-mono text-label uppercase tracking-wider text-text-faint"
                  >
                    <f.icon className="h-3.5 w-3.5 text-accent" />
                    {f.label}
                  </span>
                ))}
              </div>

              <p className="mt-6 max-w-xl text-xs text-text-faint">
                Unlock to read on-screen and download Word + PDF. Until then,
                binary files stay blocked. Pricing is confirmed at checkout.
              </p>
            </div>
          </div>

          <div className="container-x py-12 lg:py-16">
            <div className="grid gap-10 lg:grid-cols-[280px_1fr] lg:gap-14">
              <aside className="space-y-8 lg:sticky lg:top-28 lg:self-start">
                <div className="rounded-lg border border-line bg-surface-2/40 p-5">
                  <h2 className="flex items-center gap-2 font-display text-sm font-semibold text-text">
                    <Sparkles className="h-4 w-4 text-accent" /> When to use it
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-text-muted">
                    {template.use}
                  </p>
                </div>

                {headings.length > 0 && (
                  <div>
                    <h2 className="flex items-center gap-2 font-display text-sm font-semibold text-text">
                      <ListChecks className="h-4 w-4 text-accent" /> What&apos;s
                      inside
                    </h2>
                    <ol className="mt-3 space-y-1.5">
                      {headings.map((h) => (
                        <li
                          key={h}
                          className="rounded-md px-2 py-1 text-sm text-text-muted"
                        >
                          {h}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                {control.length > 0 && (
                  <div>
                    <h2 className="font-display text-sm font-semibold text-text">
                      Document details
                    </h2>
                    <dl className="mt-3 space-y-2 text-sm">
                      {control
                        .filter(([k]) =>
                          [
                            "Document reference",
                            "Version",
                            "Classification",
                            "Document owner",
                            "Applicable law",
                          ].includes(k)
                        )
                        .map(([k, v]) => (
                          <div
                            key={k}
                            className="flex justify-between gap-4 border-b border-line/60 pb-2"
                          >
                            <dt className="shrink-0 text-text-faint">{k}</dt>
                            <dd className="text-right text-text-muted">{v}</dd>
                          </div>
                        ))}
                    </dl>
                  </div>
                )}

                <TemplateDownloadAside slug={template.slug} />
              </aside>

              <div className="min-w-0">
                <ProtectedTemplateReader
                  slug={template.slug}
                  title={template.title}
                />
                <p className="mt-5 rounded-lg border border-line bg-surface-2/30 px-4 py-3 text-xs leading-relaxed text-text-faint">
                  <strong className="text-text-muted">Notice.</strong> This
                  template uses illustrative organisation details for guidance
                  only. Replace them with your entity&apos;s particulars and
                  obtain qualified legal review before execution or publication.
                  It does not constitute legal advice.
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-line">
            <div className="container-x flex flex-wrap items-center justify-between gap-4 py-8">
              {prev ? (
                <Link
                  href={`/templates/${prev.slug}`}
                  className="group inline-flex max-w-sm items-center gap-2 text-sm text-text-muted hover:text-accent"
                >
                  <ArrowLeft className="h-4 w-4 shrink-0" />
                  <span>
                    <span className="font-mono text-text-faint">Previous</span>
                    <span className="block truncate">{prev.title}</span>
                  </span>
                </Link>
              ) : (
                <span />
              )}
              {next ? (
                <Link
                  href={`/templates/${next.slug}`}
                  className="group inline-flex max-w-sm items-center gap-2 text-right text-sm text-text-muted hover:text-accent"
                >
                  <span>
                    <span className="font-mono text-text-faint">Next</span>
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
      </TemplatesGate>
      <CtaBand />
    </>
  );
}
