/**
 * Renders the official Gazette text of a DPDP section as a clean, book-like
 * reading page: a titled header, hanging-indented sub-clauses, numbered lists,
 * distinct Illustration / Explanation call-outs, and a real table for the
 * penalty Schedule. The source strings are the raw statutory text, so the
 * parser is deliberately tolerant of the small formatting artefacts in them.
 *
 * Clause nesting follows Indian statute convention:
 *   (1)/(2) → (a)/(b) → (i)/(ii) → (A)/(B)
 * Ambiguous markers like (i)/(v)/(x) are letters when they continue the
 * alphabet, otherwise roman children of the preceding clause.
 */

type MarkerKind = "num" | "letter" | "roman" | "upper";

type Block =
  | { t: "heading"; text: string }
  | { t: "clause"; marker: string; text: string; level: number }
  | { t: "list"; items: { marker: string; text: string }[] }
  | { t: "callout"; label: "Illustration" | "Explanation"; paras: string[] }
  | { t: "table"; head: string[]; rows: string[][] }
  | { t: "caption"; text: string }
  | { t: "para"; text: string };

const squash = (s: string) => s.replace(/\s+/g, " ").trim();

const isArtifact = (s: string) =>
  s === "" || /^\|?\s*\[?\s*\d+\s*Resource\s*\]?$/i.test(s);

const isPlain = (s: string) =>
  !/^\(\w+\)/.test(s) &&
  !/^\d+\.\s/.test(s) &&
  !/^Illustration\b/i.test(s) &&
  !/^Explanation\b/i.test(s) &&
  !s.startsWith("|");

const RANK: Record<MarkerKind, number> = {
  num: 0,
  letter: 1,
  roman: 2,
  upper: 3,
};

const UNAMBIGUOUS_ROMAN =
  /^(ii|iii|iv|vi|vii|viii|ix|xi|xii|xiii|xiv|xv|xvi|xvii|xviii|xix|xx)$/;

/** Indent classes per nesting depth (parent → child → grandchild). */
const CLAUSE_INDENT = [
  "",
  "ml-5 sm:ml-7",
  "ml-10 sm:ml-14",
  "ml-[3.75rem] sm:ml-[5.25rem]",
] as const;

function nextAlpha(marker: string): string | null {
  const m = marker.toLowerCase();
  if (m.length === 1 && m >= "a" && m <= "y") {
    return String.fromCharCode(m.charCodeAt(0) + 1);
  }
  if (/^[a-z]{2}$/.test(m)) {
    const chars = m.split("");
    if (chars[1] < "z") {
      return chars[0] + String.fromCharCode(chars[1].charCodeAt(0) + 1);
    }
  }
  return null;
}

function classifyMarker(
  marker: string,
  lastLetterMarker: string | null
): MarkerKind {
  if (/^\d+$/.test(marker)) return "num";
  if (/^[A-Z]+$/.test(marker)) return "upper";

  const lower = marker.toLowerCase();
  if (UNAMBIGUOUS_ROMAN.test(lower)) return "roman";

  const ambiguous = lower === "i" || lower === "v" || lower === "x";
  if (ambiguous) {
    // Continues (h)→(i), (u)→(v), (w)→(x) as a lettered sibling.
    if (lastLetterMarker && nextAlpha(lastLetterMarker) === lower) {
      return "letter";
    }
    return "roman";
  }

  if (/^[a-z]+$/.test(lower)) return "letter";
  return "letter";
}

function parse(raw: string): Block[] {
  const norm = raw.replace(/\r\n?/g, "\n").trim();
  const blocks = norm
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean);
  const out: Block[] = [];

  // Stack of open clause ranks for nesting depth.
  const stack: MarkerKind[] = [];
  let lastLetterMarker: string | null = null;

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    if (isArtifact(block)) continue;

    // Penalty Schedule / any pipe table
    if (block.startsWith("|")) {
      const rows = block
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l.startsWith("|") && !/^\|[\s|:-]+\|?$/.test(l))
        .map((l) =>
          l
            .replace(/^\|/, "")
            .replace(/\|$/, "")
            .split("|")
            .map((c) => c.trim())
        );
      if (rows.length) {
        const [head, ...body] = rows;
        out.push({ t: "table", head, rows: body });
      }
      continue;
    }

    // Official section heading (first block) and the Schedule marker
    if (i === 0 && /^Section\s+\d+\./i.test(block)) {
      out.push({ t: "heading", text: squash(block) });
      continue;
    }
    if (/^Appendices$/i.test(block)) {
      out.push({ t: "heading", text: "The Schedule" });
      continue;
    }
    if (/^\[See section/i.test(block)) {
      out.push({ t: "caption", text: squash(block) });
      continue;
    }

    // Illustration(s), either inline or followed by narrative / roman items.
    const illustration = block.match(/^Illustrations?\.?\s*([\s\S]*)$/i);
    if (illustration) {
      const paras = illustration[1] ? [squash(illustration[1])] : [];
      while (
        i + 1 < blocks.length &&
        (isPlain(blocks[i + 1]) || /^\([IVXLCDM]+\)\s/.test(blocks[i + 1]))
      ) {
        paras.push(squash(blocks[++i]));
      }
      out.push({ t: "callout", label: "Illustration", paras });
      continue;
    }

    // Explanation - usually inline as "Explanation. - ..."
    if (/^Explanation\b/i.test(block)) {
      const body = squash(block.replace(/^Explanation\.?\s*[ - --]*\s*/i, ""));
      if (body) out.push({ t: "callout", label: "Explanation", paras: [body] });
      continue;
    }

    // A run of numbered items ("1. …\n2. …") grouped by single newlines
    const lines = block
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length && lines.every((l) => /^\d+\.\s/.test(l))) {
      out.push({
        t: "list",
        items: lines.map((l) => {
          const m = l.match(/^(\d+)\.\s+([\s\S]*)$/);
          return { marker: m ? m[1] : "", text: m ? squash(m[2]) : squash(l) };
        }),
      });
      continue;
    }

    // Sub-clause "(1)", lettered "(a)", roman "(i)", or capital "(A)"
    const cm = block.match(/^\(([0-9a-z]+)\)\s+([\s\S]*)$/i);
    if (cm) {
      const marker = cm[1];
      const kind = classifyMarker(marker, lastLetterMarker);
      const rank = RANK[kind];

      while (stack.length && RANK[stack[stack.length - 1]] >= rank) {
        stack.pop();
      }
      const level = stack.length;
      stack.push(kind);

      if (kind === "letter") {
        lastLetterMarker = marker.toLowerCase();
      }

      out.push({
        t: "clause",
        marker,
        text: squash(cm[2]),
        level,
      });
      continue;
    }

    out.push({ t: "para", text: squash(block) });
  }

  return out;
}

export function OfficialText({ text }: { text: string }) {
  const blocks = parse(text);
  if (!blocks.length) return null;

  return (
    <div className="official-reader mx-auto max-w-[68ch] font-serif text-[15px] leading-[1.85] text-text sm:text-base">
      {blocks.map((b, i) => {
        switch (b.t) {
          case "heading":
            return (
              <p
                key={i}
                className="mb-6 border-b border-line pb-4 text-center font-display text-xs font-semibold uppercase tracking-[0.16em] text-text-muted sm:text-sm"
              >
                {b.text}
              </p>
            );

          case "caption":
            return (
              <p
                key={i}
                className="mt-6 text-center font-sans text-xs italic text-text-faint"
              >
                {b.text}
              </p>
            );

          case "clause": {
            const indent =
              CLAUSE_INDENT[Math.min(b.level, CLAUSE_INDENT.length - 1)];
            return (
              <div key={i} className={`mt-4 flex gap-3 ${indent}`}>
                <span className="shrink-0 font-display text-sm font-semibold tabular-nums text-accent">
                  ({b.marker})
                </span>
                <p className="flex-1">{b.text}</p>
              </div>
            );
          }

          case "list":
            return (
              <ol key={i} className="mt-3 list-none space-y-2 pl-6 sm:pl-9">
                {b.items.map((it, j) => (
                  <li key={j} className="flex gap-3">
                    <span className="shrink-0 font-display text-sm font-semibold tabular-nums text-accent/80">
                      {it.marker}.
                    </span>
                    <span className="flex-1">{it.text}</span>
                  </li>
                ))}
              </ol>
            );

          case "callout":
            return (
              <div
                key={i}
                className="my-5 rounded-lg border border-line border-l-2 border-l-accent/60 bg-accent/[0.05] px-4 py-3"
              >
                <span className="mb-1.5 inline-block font-display text-label font-semibold uppercase tracking-[0.12em] text-accent">
                  {b.label}
                </span>
                {b.paras.map((p, j) => (
                  <p
                    key={j}
                    className="font-sans text-sm leading-relaxed text-text-muted [&:not(:first-of-type)]:mt-2"
                  >
                    {p}
                  </p>
                ))}
              </div>
            );

          case "table":
            return (
              <div key={i} className="my-6 overflow-x-auto">
                <table className="w-full border-collapse font-sans text-sm">
                  <thead>
                    <tr>
                      {b.head.map((h, j) => (
                        <th
                          key={j}
                          className="border border-line bg-surface-2/60 px-3 py-2 text-left font-display text-label font-semibold uppercase tracking-wide text-text-muted"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {b.rows.map((r, ri) => (
                      <tr key={ri}>
                        {r.map((c, ci) => (
                          <td
                            key={ci}
                            className="border border-line px-3 py-2 align-top text-text-muted"
                          >
                            {c}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );

          case "para":
          default:
            return (
              <p key={i} className="mt-4 first:mt-0">
                {b.text}
              </p>
            );
        }
      })}
    </div>
  );
}
