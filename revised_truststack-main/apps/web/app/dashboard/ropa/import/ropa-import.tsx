"use client";

import { ropaImportTemplateCsv } from "@truststack/core";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { DataTable } from "@/components/data/data-table";
import { Notice } from "@/components/feedback/notice";
import { apiFetch } from "@/lib/client/api";
import { usePermissions } from "@/lib/client/permissions";
import { ROPA_POSITIONING } from "@/lib/client/ropa";

interface RowIssues {
  row: number;
  errors?: { field: string; issue: string }[];
  warnings?: { field: string; issue: string }[];
}

interface ImportPayload {
  dryRun: boolean;
  headers: string[];
  mapping: Record<string, string | null>;
  unmapped: string[];
  missingRequired: string[];
  fields: { field: string; header: string }[];
  valid?: number;
  imported?: number;
  rejected: RowIssues[];
  warnings: RowIssues[];
}

/** A 1 MB file is roughly 2,000 records of the workbook's width — the import's own limit. */
const MAX_BYTES = 1_000_000;

/**
 * Import: upload → confirm the column mapping → see rejected rows with the
 * reason beside each → import the rest (Slice 7).
 *
 * The file is read as TEXT in the browser and parsed on the server — never
 * evaluated, never rendered as HTML. A formula is just its text. A bad row is
 * reported, never the whole file.
 */
export function RopaImport() {
  const permissions = usePermissions();
  const organizationId = permissions.kind === "ready" ? permissions.value.organizationId : null;
  const canWrite = permissions.kind === "ready" && permissions.value.permissions.includes("ropa.write");

  /** The file as the API takes it: CSV text, or an Excel workbook in base64. */
  const [file, setFile] = useState<{ csv: string } | { xlsx: string } | null>(null);
  const [fileName, setFileName] = useState("");
  const [check, setCheck] = useState<ImportPayload | null>(null);
  const [mapping, setMapping] = useState<Record<string, string | null>>({});
  const [result, setResult] = useState<ImportPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorRows, setErrorRows] = useState<{ field?: string; issue: string }[]>([]);
  const [busy, setBusy] = useState(false);

  async function post(dryRun: boolean, chosen?: Record<string, string | null>) {
    if (!organizationId || file === null) return null;
    setError(null);
    setErrorRows([]);
    setBusy(true);
    const r = await apiFetch<ImportPayload>(`/api/v1/organizations/${organizationId}/ropa/import`, {
      method: "POST",
      body: JSON.stringify({ ...file, dryRun, ...(chosen ? { mapping: chosen } : {}) }),
    });
    setBusy(false);
    if (!r.success) {
      setError(r.error.message);
      setErrorRows(r.error.details ?? []);
      return null;
    }
    return r.data;
  }

  async function choose(event: React.ChangeEvent<HTMLInputElement>) {
    setCheck(null);
    setResult(null);
    setError(null);
    const file = event.target.files?.[0];
    if (!file) return;
    const isXlsx = /\.xlsx$/i.test(file.name);
    if (!isXlsx && !/\.csv$/i.test(file.name)) {
      return setError("Choose an Excel workbook (.xlsx) or a CSV file. Macro workbooks (.xlsm) are not accepted.");
    }
    if (file.size > (isXlsx ? 2_000_000 : MAX_BYTES)) return setError("The file is too large — split it into smaller files.");
    setFileName(file.name);
    if (isXlsx) {
      const bytes = new Uint8Array(await file.arrayBuffer());
      let binary = "";
      for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
      setFile({ xlsx: btoa(binary) });
    } else {
      setFile({ csv: await file.text() });
    }
  }

  async function checkFile(event: FormEvent) {
    event.preventDefault();
    const data = await post(true);
    if (data) {
      setCheck(data);
      setMapping(data.mapping);
    }
  }

  async function recheck() {
    const data = await post(true, mapping);
    if (data) setCheck(data);
  }

  async function importRows() {
    const data = await post(false, mapping);
    if (data) setResult(data);
  }

  if (permissions.kind === "loading") return <p className="text-sm text-slate-500">Loading…</p>;
  if (!canWrite) return <p className="text-sm text-slate-700">You do not have permission to import processing records.</p>;

  const nameMapped = Object.values(mapping).includes("name");

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard/ropa" className="text-xs text-indigo-700 hover:underline">
          ← Back to the register
        </Link>
        <h2 className="mt-1 text-lg font-semibold">Import processing records</h2>
        <p className="text-sm text-slate-600">
          Bring in the register you already keep — an Excel workbook (.xlsx) or a CSV. Choose it below and check how
          its columns are read before anything is imported. Only the values you see are read: formulas are never
          run and links are never followed. Every imported row arrives as a
          Draft for its owner to complete.
        </p>
        {/* Slice 10.5 B3 (F3.12): a template to start from — the columns the importer already reads. */}
        <p className="mt-2 text-sm">
          <a
            href={`data:text/csv;charset=utf-8,${encodeURIComponent(ropaImportTemplateCsv())}`}
            download="processing-register-template.csv"
            data-testid="ropa-import-template"
            className="font-medium text-indigo-700 hover:underline"
          >
            Download a template (CSV)
          </a>{" "}
          <span className="text-xs text-slate-500">— one column for each thing the register records; only the activity&apos;s name is required.</span>
        </p>
        <p className="mt-1 text-xs text-slate-500">{ROPA_POSITIONING}</p>
      </div>

      <form onSubmit={checkFile} className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 p-4 text-sm">
        <input
          type="file"
          accept=".xlsx,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          data-testid="ropa-import-file"
          onChange={choose}
        />
        <button
          type="submit"
          data-testid="ropa-import-check"
          disabled={busy || file === null}
          className="rounded-md bg-indigo-700 px-3 py-1.5 font-medium text-white hover:bg-indigo-800 disabled:opacity-50"
        >
          {busy && !check ? "Checking…" : "Check the file"}
        </button>
        {fileName && <span className="text-xs text-slate-500">{fileName}</span>}
      </form>

      {error && (
        <Notice tone="error" testId="ropa-import-error">
          <p>{error}</p>
          {errorRows.length > 0 && (
            <div className="mt-2 text-xs">
              <DataTable
                testId="ropa-import-error-details"
                rows={errorRows.map((d, i) => ({ ...d, n: i }))}
                rowKey={(d) => String(d.n)}
                noun="problems"
                columns={[
                  { key: "field", header: "Column", className: "font-mono", cell: (d) => d.field ?? "—" },
                  { key: "issue", header: "Problem", cell: (d) => d.issue },
                ]}
              />
            </div>
          )}
        </Notice>
      )}

      {check && !result && (
        <section data-testid="ropa-import-preview" className="space-y-4">
          <div className="rounded-xl border border-slate-200 p-4">
            <h3 className="text-sm font-semibold">1. How the columns are read</h3>
            <p className="text-xs text-slate-600">
              Matched by column NAME. Change any that are wrong; columns set to “Ignore” are not imported.
            </p>
            <table className="mt-2 w-full text-left text-xs">
              <thead className="text-slate-600">
                <tr>
                  <th className="py-1">Column in your file</th>
                  <th className="py-1">Read as</th>
                </tr>
              </thead>
              <tbody>
                {check.headers.map((header) => (
                  <tr key={header} className="border-t border-slate-100">
                    <td className="py-1 pr-3 font-mono">{header}</td>
                    <td className="py-1">
                      <select
                        data-testid={`ropa-import-map-${header}`}
                        value={mapping[header] ?? ""}
                        onChange={(e) => setMapping((m) => ({ ...m, [header]: e.target.value || null }))}
                        className="rounded-md border border-slate-300 bg-white px-1 py-0.5"
                      >
                        <option value="">Ignore</option>
                        {check.fields.map((f) => (
                          <option key={f.field} value={f.field}>
                            {f.header}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!nameMapped && (
              <p className="mt-2 text-xs font-medium text-red-800">Choose the column that holds the processing activity's name.</p>
            )}
            <button
              type="button"
              onClick={recheck}
              disabled={busy || !nameMapped}
              className="mt-2 rounded-md border border-slate-300 bg-white px-3 py-1 text-xs hover:bg-slate-100 disabled:opacity-50"
            >
              Check again with this mapping
            </button>
          </div>

          <div className="rounded-xl border border-slate-200 p-4">
            <h3 className="text-sm font-semibold">2. What will happen</h3>
            <p data-testid="ropa-import-summary" className="text-sm">
              <strong data-testid="ropa-import-valid">{check.valid ?? 0}</strong> row{check.valid === 1 ? "" : "s"} can be imported ·{" "}
              <strong data-testid="ropa-import-rejected-count">{check.rejected.length}</strong> cannot, and are listed below.
            </p>
            <RowList testId="ropa-import-rejected" title="Rows that will not be imported" rows={check.rejected} kind="errors" />
            <RowList testId="ropa-import-warnings" title="Notes on rows that will be imported" rows={check.warnings} kind="warnings" />
            <button
              type="button"
              data-testid="ropa-import-run"
              onClick={importRows}
              disabled={busy || !nameMapped || (check.valid ?? 0) === 0}
              className="mt-3 rounded-md bg-indigo-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-800 disabled:opacity-50"
            >
              {busy ? "Importing…" : `Import ${check.valid ?? 0} row${check.valid === 1 ? "" : "s"}`}
            </button>
          </div>
        </section>
      )}

      {result && (
        <Notice tone="success" testId="ropa-import-result">
          <p>
            Imported <strong data-testid="ropa-import-imported">{result.imported}</strong> record{result.imported === 1 ? "" : "s"} as Drafts.
            {result.rejected.length > 0 && ` ${result.rejected.length} row${result.rejected.length === 1 ? " was" : "s were"} not imported:`}
          </p>
          <RowList testId="ropa-import-result-rejected" title="" rows={result.rejected} kind="errors" />
          <Link href="/dashboard/ropa" data-testid="ropa-import-done" className="text-indigo-700 hover:underline">
            Go to the register
          </Link>
        </Notice>
      )}
    </div>
  );
}

/**
 * Row numbers are the file's own, counting the header as row 1 — what the spreadsheet shows.
 * Paged and searchable (Slice 10.5 B3, N6): a large file can reject hundreds of rows.
 */
function RowList({ testId, title, rows, kind }: { testId: string; title: string; rows: RowIssues[]; kind: "errors" | "warnings" }) {
  if (rows.length === 0) return null;
  const why = (r: RowIssues) => (r[kind] ?? []).map((e) => e.issue).join(" ");
  return (
    <div data-testid={testId} className="mt-2 text-xs">
      {title && <p className="mb-1 font-semibold text-slate-700">{title}</p>}
      <DataTable
        testId={`${testId}-table`}
        rows={rows}
        rowKey={(r) => String(r.row)}
        rowTestId={(r) => `${testId}-row-${r.row}`}
        noun="rows"
        search={{ label: "Search these rows", placeholder: "Search by row number or reason", text: (r) => `${r.row} ${why(r)}` }}
        columns={[
          { key: "row", header: "Row", className: "whitespace-nowrap", sortValue: (r) => r.row, cell: (r) => `Row ${r.row}` },
          { key: "why", header: kind === "errors" ? "Why it is not imported" : "Note", className: kind === "errors" ? "text-red-800" : "text-amber-900", cell: why },
        ]}
      />
    </div>
  );
}
