"use client";

import { FileText } from "lucide-react";
import { TemplateDocument } from "./TemplateDocument";
import type { DocSection } from "@/content/template-documents";

/**
 * View-only template body. Binary .docx / PDF files are not linked or fetched - * content is rendered from the structured document source only.
 */
export function TemplateFormatViewer({
  docTitle,
  sections,
}: {
  /** @deprecated Kept for call-site compatibility; binaries are never loaded. */
  pdfUrl?: string;
  /** @deprecated Kept for call-site compatibility; binaries are never loaded. */
  docxUrl?: string;
  docTitle: string;
  sections: DocSection[];
}) {
  return (
    <div>
      <div className="mb-4 inline-flex items-center gap-1.5 rounded-pill border border-line bg-glass px-3 py-1.5 text-sm font-medium text-text-muted">
        <FileText className="h-4 w-4 text-accent" />
        On-screen reader
      </div>

      <div className="rounded-xl border border-line bg-surface-2/25 p-6 shadow-sm sm:p-8 lg:p-10">
        <div className="mb-8 border-b border-line pb-6">
          <h2 className="font-display text-2xl font-semibold tracking-tight text-text">
            {docTitle}
          </h2>
          <p className="mt-2 text-sm text-text-faint">
            View-only preview. Word and PDF downloads are not available on the
            Pilot plan.
          </p>
        </div>
        <TemplateDocument sections={sections} />
      </div>
    </div>
  );
}
