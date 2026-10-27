import type { DocSection } from "@/content/template-documents";

/** Stable anchor id from a heading, used by the "What's inside" outline. */
export function headingId(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function InlineText({ text }: { text: string }) {
  // Render blank-line runs (fill-in fields) as a subtle underline so the
  // document reads like a real form rather than a wall of underscores.
  const parts = text.split(/(_{3,})/g);
  return (
    <>
      {parts.map((part, i) =>
        /^_{3,}$/.test(part) ? (
          <span
            key={i}
            aria-hidden
            className="mx-1 inline-block w-24 max-w-full translate-y-[3px] border-b border-dashed border-text-faint/70 align-baseline sm:w-40"
          />
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

function DocTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="my-6 overflow-x-auto rounded-lg border border-line">
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="bg-surface-2/70">
            {headers.map((h, i) => (
              <th
                key={i}
                className="border-b border-line px-3 py-2.5 font-display text-xs font-semibold uppercase tracking-wide text-text"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} className="align-top odd:bg-surface-2/20">
              {row.map((cell, ci) => (
                <td
                  key={ci}
                  className="border-b border-line/70 px-3 py-2.5 text-text-muted [overflow-wrap:anywhere]"
                >
                  <InlineText text={cell} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function TemplateDocument({ sections }: { sections: DocSection[] }) {
  return (
    <div className="template-doc max-w-none">
      {sections.map((s, i) => {
        switch (s.type) {
          // Document-control block is surfaced in the sidebar instead.
          case "doccontrol":
            return null;

          case "meta":
            return (
              <p
                key={i}
                className="mb-5 border-l-2 border-accent/40 bg-surface-2/30 px-4 py-2 text-sm italic text-text-faint"
              >
                {s.text}
              </p>
            );

          case "heading":
            return (
              <h2
                key={i}
                id={headingId(s.text)}
                className="mt-10 scroll-mt-28 border-b border-line pb-2 font-display text-xl font-semibold tracking-tight text-text first:mt-0"
              >
                {s.text}
              </h2>
            );

          case "subheading":
            return (
              <h3
                key={i}
                className="mt-6 font-display text-base font-semibold text-text"
              >
                {s.text}
              </h3>
            );

          case "para":
            return (
              <p
                key={i}
                className="mt-4 text-[15px] leading-relaxed text-text-muted [overflow-wrap:anywhere]"
              >
                <InlineText text={s.text} />
              </p>
            );

          case "clause":
            return (
              <p
                key={i}
                className="mt-4 flex gap-3 text-[15px] leading-relaxed text-text-muted [overflow-wrap:anywhere]"
              >
                <span className="shrink-0 font-semibold text-text">{s.num}</span>
                <span>
                  <InlineText text={s.text} />
                </span>
              </p>
            );

          case "bullets":
            return (
              <ul key={i} className="mt-4 space-y-2.5">
                {s.items.map((item, bi) => (
                  <li
                    key={bi}
                    className="flex gap-3 text-[15px] leading-relaxed text-text-muted [overflow-wrap:anywhere]"
                  >
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                    <span>
                      <InlineText text={item} />
                    </span>
                  </li>
                ))}
              </ul>
            );

          case "table":
            return <DocTable key={i} headers={s.headers} rows={s.rows} />;

          case "divider":
            return <div key={i} className="my-8 hairline" />;

          default:
            return null;
        }
      })}
    </div>
  );
}
