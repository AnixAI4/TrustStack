import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { ArticleBody } from "@/components/resources/ArticleBody";
import { CtaBand } from "@/components/sections/CtaBand";
import { ARTICLES, getArticle } from "@/content/blog";

export function generateStaticParams() {
  return ARTICLES.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) return { title: "Article not found | TrustStack" };
  return {
    title: `${article.title} | TrustStack Insights`,
    description: article.desc,
  };
}

export default async function BlogArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const idx = ARTICLES.findIndex((a) => a.slug === slug);
  const article = idx >= 0 ? ARTICLES[idx] : null;
  if (!article) notFound();

  const prev = idx > 0 ? ARTICLES[idx - 1] : null;
  const next = idx < ARTICLES.length - 1 ? ARTICLES[idx + 1] : null;

  return (
    <>
      <article>
        <div className="border-b border-line">
          <div className="container-x py-10 lg:py-14">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-sm text-text-muted transition-colors hover:text-accent"
            >
              <ArrowLeft className="h-4 w-4" /> All insights
            </Link>
            <p className="mt-6 font-mono text-xs uppercase tracking-wider text-text-faint">
              TrustStack Insights
            </p>
            <p className="mt-2 font-mono text-xs uppercase tracking-wider text-accent">
              {article.kind} · {article.read}
            </p>
            <h1 className="mt-3 max-w-3xl font-display text-3xl font-semibold leading-tight tracking-tight text-text sm:text-4xl lg:text-5xl">
              {article.title}
            </h1>
            <p className="mt-5 max-w-2xl text-lg text-text-muted">{article.desc}</p>
          </div>
        </div>

        <div className="container-x py-12 lg:py-16">
          <div className="max-w-prose">
            <ArticleBody blocks={article.body} />
            <aside className="mt-10 border-t border-line pt-6">
              <p className="text-sm leading-relaxed text-text-faint">
                TrustStack Insights publishes editorial analysis of India&apos;s data
                protection framework. Cross-check material provisions against the
                Digital Personal Data Protection Act, 2023 and the DPDP Rules,
                2025 before relying on it for compliance decisions.
              </p>
            </aside>
          </div>
        </div>

        <div className="border-t border-line">
          <div className="container-x flex flex-col items-stretch justify-between gap-4 py-8 sm:flex-row sm:items-center">
            {prev ? (
              <Link
                href={`/blog/${prev.slug}`}
                className="group inline-flex min-w-0 max-w-full items-center gap-2 text-sm text-text-muted hover:text-accent sm:max-w-[48%]"
              >
                <ArrowLeft className="h-4 w-4 shrink-0" />
                <span className="truncate">{prev.title}</span>
              </Link>
            ) : (
              <span />
            )}
            {next ? (
              <Link
                href={`/blog/${next.slug}`}
                className="group inline-flex min-w-0 max-w-full items-center justify-end gap-2 text-right text-sm text-text-muted hover:text-accent sm:max-w-[48%]"
              >
                <span className="truncate">{next.title}</span>
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
