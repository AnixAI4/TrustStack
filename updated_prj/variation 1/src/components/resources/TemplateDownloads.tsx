"use client";

import { Download, FileText } from "lucide-react";
import { markDocGenerated } from "@/lib/progress";

function downloadHref(slug: string, format: "docx" | "pdf") {
  return `/api/templates/${encodeURIComponent(slug)}/download?format=${format}`;
}

/**
 * Same download chrome as before - authenticated URLs only (purchase-gated).
 * - default: accent/ghost buttons (detail header / sidebar)
 * - compact: inline DOCX / PDF text links (catalog cards)
 */
export function TemplateDownloads({
  slug,
  stacked = false,
  compact = false,
}: {
  slug: string;
  stacked?: boolean;
  compact?: boolean;
}) {
  const docx = downloadHref(slug, "docx");
  const pdf = downloadHref(slug, "pdf");

  if (compact) {
    return (
      <span className="relative z-10 flex items-center gap-3">
        <a
          href={docx}
          download
          onClick={() => markDocGenerated()}
          title="Download editable Word document"
          className="inline-flex items-center gap-1 text-xs font-medium text-text-muted transition-colors hover:text-accent"
        >
          <Download className="h-3.5 w-3.5" /> DOCX
        </a>
        <a
          href={pdf}
          download
          onClick={() => markDocGenerated()}
          title="Download print-ready PDF"
          className="inline-flex items-center gap-1 text-xs font-medium text-text-muted transition-colors hover:text-accent"
        >
          <Download className="h-3.5 w-3.5" /> PDF
        </a>
      </span>
    );
  }

  return (
    <div
      className={
        stacked
          ? "flex flex-col gap-2.5"
          : "flex flex-wrap items-center gap-3"
      }
    >
      <a
        href={docx}
        download
        onClick={() => markDocGenerated()}
        className={`btn btn-accent text-sm ${stacked ? "w-full" : ""}`}
      >
        <Download className="h-4 w-4" /> Download .docx
      </a>
      <a
        href={pdf}
        download
        onClick={() => markDocGenerated()}
        className={`btn btn-ghost text-sm ${stacked ? "w-full" : ""}`}
      >
        <FileText className="h-4 w-4" /> Download PDF
      </a>
    </div>
  );
}
