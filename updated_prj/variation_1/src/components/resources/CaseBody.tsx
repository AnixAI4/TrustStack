import type { CaseBlock } from "@/content/cases";

export function CaseBody({ blocks }: { blocks: CaseBlock[] }) {
  if (!blocks || blocks.length === 0) return null;

  return (
    <div className="case-body">
      {blocks.map((block, i) => {
        if (block.type === "h2") {
          return (
            <h2
              key={i}
              className="mb-5 mt-12 font-display text-2xl font-semibold tracking-tight text-text first:mt-0 sm:text-3xl"
            >
              {block.text}
            </h2>
          );
        }
        if (block.type === "p") {
          return (
            <p
              key={i}
              className="mb-6 text-lg leading-relaxed text-text-muted text-pretty"
            >
              {block.text}
            </p>
          );
        }
        if (block.type === "ul") {
          return (
            <ul
              key={i}
              className="mb-8 mt-2 list-outside list-disc space-y-3 pl-6 text-lg text-text-muted"
            >
              {block.items.map((item, j) => (
                <li key={j} className="pl-2 leading-relaxed">
                  {item}
                </li>
              ))}
            </ul>
          );
        }
        if (block.type === "quote") {
          return (
            <figure
              key={i}
              className="my-10 rounded-r-lg border-l-2 border-accent bg-accent/[0.05] py-5 pl-6 pr-5"
            >
              <blockquote className="font-display text-xl italic leading-relaxed text-text text-pretty sm:text-2xl">
                &ldquo;{block.text}&rdquo;
              </blockquote>
              {block.cite && (
                <figcaption className="mt-3 font-mono text-xs uppercase tracking-wider text-text-faint"> - {block.cite}
                </figcaption>
              )}
            </figure>
          );
        }
        return null;
      })}
    </div>
  );
}
