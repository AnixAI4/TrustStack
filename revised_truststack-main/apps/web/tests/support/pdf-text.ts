/**
 * Text out of a PDF, for tests: the caveats must be in the FILE, verbatim
 * (SLICE_09 §11), not only in the document model. pdfjs returns one item per
 * run of text; joining them with spaces and collapsing whitespace restores
 * the sentences, because the renderer never hyphenates.
 */
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

export async function pdfText(bytes: Uint8Array): Promise<{ text: string; pages: number; title: string | null }> {
  const task = getDocument({ data: new Uint8Array(bytes), useSystemFonts: false });
  const pdf = await task.promise;
  const parts: string[] = [];
  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();
    for (const item of content.items) if ("str" in item) parts.push(item.str);
  }
  const meta = await pdf.getMetadata();
  const info = meta.info as { Title?: string } | undefined;
  const pages = pdf.numPages;
  await task.destroy();
  return { text: parts.join(" ").replace(/\s+/g, " ").trim(), pages, title: info?.Title ?? null };
}

/** The same whitespace rule, for the sentence being looked for. */
export const squash = (s: string) => s.replace(/\s+/g, " ").trim();
