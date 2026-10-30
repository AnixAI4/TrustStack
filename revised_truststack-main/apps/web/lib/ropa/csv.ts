import "server-only";

/**
 * A small RFC 4180 CSV reader for the ROPA import (Slice 7, D-063).
 *
 * Why here and not a library: the import is CSV-only for the pilot, a CSV
 * parser is forty lines, and a new npm dependency is a stack change. Why here
 * and not `packages/core`: the file is untrusted input, so it is parsed on the
 * server, in the route, under a size limit — and core only ever sees cells.
 *
 * What it never does: evaluate anything. A cell reading `=HYPERLINK(...)` is
 * the string `=HYPERLINK(...)`. There is no formula engine to reach, and no
 * link inside a cell is ever followed.
 */

export class CsvError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CsvError";
  }
}

/** The import's limits: an upload is untrusted input (pitfall 7). */
export const CSV_MAX_BYTES = 1_000_000;
export const CSV_MAX_RECORDS = 2000;

/**
 * Rows of cells. Handles quoted cells, `""` inside quotes, commas and new
 * lines inside quotes, CRLF or LF, and a leading byte-order mark (Excel's
 * "CSV UTF-8" writes one). Blank lines are skipped.
 */
export function parseCsv(text: string): string[][] {
  const input = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  let i = 0;

  const endRow = () => {
    row.push(cell);
    if (row.length > 1 || row[0] !== "") rows.push(row);
    row = [];
    cell = "";
  };

  while (i < input.length) {
    const ch = input[i]!;
    if (quoted) {
      if (ch === '"') {
        if (input[i + 1] === '"') {
          cell += '"';
          i += 2;
          continue;
        }
        quoted = false;
        i += 1;
        continue;
      }
      cell += ch;
      i += 1;
      continue;
    }
    if (ch === '"' && cell === "") {
      quoted = true;
    } else if (ch === ",") {
      row.push(cell);
      cell = "";
    } else if (ch === "\r") {
      if (input[i + 1] === "\n") i += 1;
      endRow();
    } else if (ch === "\n") {
      endRow();
    } else {
      cell += ch;
    }
    i += 1;
  }
  if (quoted) throw new CsvError("The file ends inside a quoted cell — check for a missing closing quote.");
  if (cell !== "" || row.length > 0) endRow();
  return rows;
}
