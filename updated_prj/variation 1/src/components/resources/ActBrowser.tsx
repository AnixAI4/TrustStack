"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, ArrowRight, Download, FileText, Loader2 } from "lucide-react";
import { ACT_CHAPTERS } from "@/content/act";
import { SECTION_PLAIN } from "@/content/section-plain";
import { downloadActGuidePdf } from "@/lib/pdf";
import { cn } from "@/lib/cn";

/** Plain-language one-liner for a section card in Easy read - the first
 * sentence of the hand-authored plain-English explanation, when we have one.
 * Falls back to the technical summary so every card still reads sensibly. */
function plainSummary(n: number, fallback: string): string {
  const p = SECTION_PLAIN[n];
  if (!p) return fallback;
  return p.plainEnglish.split(/(?<=[.!?])\s+/)[0] || fallback;
}

export function ActBrowser() {
  const [q, setQ] = useState("");
  const [pdfBusy, setPdfBusy] = useState(false);

  const handleDownloadPdf = async () => {
    if (pdfBusy) return;
    setPdfBusy(true);
    try {
      await downloadActGuidePdf(ACT_CHAPTERS);
    } finally {
      setPdfBusy(false);
    }
  };

  const chapters = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return ACT_CHAPTERS;
    return ACT_CHAPTERS.map((ch) => ({
      ...ch,
      sections: ch.sections.filter(
        (s) =>
          s.title.toLowerCase().includes(term) ||
          s.summary.toLowerCase().includes(term) ||
          String(s.n) === term
      ),
    })).filter((ch) => ch.sections.length > 0);
  }, [q]);

  return (
    <section className="section">
      <div className="container-x">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex w-full max-w-md items-center gap-3 rounded-pill border border-line bg-surface-2/60 px-4 py-2.5 focus-within:border-accent/50">
            <Search className="h-4 w-4 text-text-faint" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Filter sections by name…"
              className="w-full bg-transparent text-sm text-text outline-none placeholder:text-text-faint"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <a
              href="/DPDP-Act-2023-official.pdf"
              download="DPDP-Act-2023.pdf"
              className="btn btn-accent shrink-0 text-sm"
            >
              <Download className="h-4 w-4" /> Download Act (PDF)
            </a>
            <button
              onClick={handleDownloadPdf}
              disabled={pdfBusy}
              className="btn btn-ghost shrink-0 text-sm disabled:opacity-60"
            >
              {pdfBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
              {pdfBusy ? "Preparing…" : "Section guide (PDF)"}
            </button>
            <Link href="/rules" className="btn btn-ghost shrink-0 text-sm">
              Act ↔ Rules
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="mt-10 space-y-12">
          {chapters.map((ch) => (
            <div key={ch.n}>
              <div className="flex items-baseline gap-3">
                <span className="font-mono text-sm text-accent">
                  Ch. {String(ch.n).padStart(2, "0")}
                </span>
                <h2 className="font-display text-xl font-semibold text-text">
                  {ch.title}
                </h2>
                <span className="text-sm text-text-faint">{ch.range}</span>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {ch.sections.map((s) => (
                  <Link
                    key={s.n}
                    href={`/section/${s.n}`}
                    className={cn(
                      "group rounded-lg border border-line bg-surface-2/40 p-4 transition-all hover:-translate-y-0.5 hover:border-accent/40"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs text-text-faint">
                        Section {s.n}
                      </span>
                      <ArrowRight className="h-4 w-4 text-text-faint transition-all group-hover:translate-x-0.5 group-hover:text-accent" />
                    </div>
                    <h3 className="mt-2 font-display text-base font-semibold text-text">
                      {s.title}
                    </h3>
                    <p className="mt-1 text-sm text-text-muted">
                      <span data-rm="normal">{s.summary}</span>
                      <span data-rm="easy">{plainSummary(s.n, s.summary)}</span>
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          ))}
          {chapters.length === 0 && (
            <p className="text-center text-text-muted">
              No sections match “{q}”.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
