import type { ArticleBlock } from "@/content/blog";

export function ArticleBody({ blocks }: { blocks: ArticleBlock[] }) {
  if (!blocks || blocks.length === 0) return null;

  return (
    <div className="article-body">
      {blocks.map((block, i) => {
        if (block.type === "h2") {
          return (
            <h2 key={i} className="mb-5 mt-12 font-display text-2xl font-semibold tracking-tight text-text first:mt-0 sm:text-3xl">
              {block.text}
            </h2>
          );
        }
        if (block.type === "p") {
          return (
            <p key={i} className="mb-6 text-lg leading-relaxed text-text-muted text-pretty">
              {block.text}
            </p>
          );
        }
        if (block.type === "ul") {
          return (
            <ul key={i} className="mb-8 mt-2 list-outside list-disc space-y-3 pl-6 text-lg text-text-muted">
              {block.items.map((item, j) => (
                <li key={j} className="pl-2 leading-relaxed">
                  {item}
                </li>
              ))}
            </ul>
          );
        }
        if (block.type === "table") {
          return (
            <div key={i} className="mb-8 mt-4 overflow-x-auto rounded-lg border border-line bg-surface-2/35">
              <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-line bg-bg-2/70">
                    {block.headers.map((header) => (
                      <th key={header} scope="col" className="px-4 py-3 font-mono text-label font-semibold uppercase tracking-wider text-text">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {block.rows.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {row.map((cell, cellIndex) => (
                        <td key={`${rowIndex}-${cellIndex}`} className="align-top px-4 py-4 leading-relaxed text-text-muted">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }
        return null;
      })}
    </div>
  );
}
