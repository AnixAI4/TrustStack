import "server-only";
import {
  applyMapping,
  fromCsvCell,
  importedRecordFacts,
  mapColumns,
  ropaRisk,
  validateRopaRow,
  type ColumnMapping,
  type RopaImportField,
  type RopaImportRecord,
  type RowIssue,
} from "@truststack/core";
import { CSV_MAX_RECORDS, CsvError, parseCsv } from "./csv";

/**
 * The import pipeline, short of the database (Slice 7, D-063):
 *
 *   CSV text → rows of cells (server) → a column mapping by header NAME
 *   (proposed by core, confirmed by the user) → each row validated by core.
 *
 * A bad row is REJECTED with its reasons, beside its row number in the file;
 * it never fails the file. What survives goes to `public.import_ropa_records`,
 * which can still refuse a row (a duplicate record ID) the same way.
 */

export interface PreparedRow {
  /** The row's number in the FILE, counting the header as row 1 — what a spreadsheet shows. */
  row: number;
  record: RopaImportRecord;
  warnings: RowIssue[];
}

export interface RejectedRow {
  row: number;
  errors: { field: string; issue: string }[];
}

export interface PreparedImport {
  headers: string[];
  mapping: ColumnMapping;
  valid: PreparedRow[];
  rejected: RejectedRow[];
}

/** A row and the number the client's own file gives it. */
export interface NumberedRow {
  number: number;
  cells: string[];
}

/** CSV text → numbered rows (the Nth non-blank line is row N). */
export function prepareImport(csvText: string, chosen?: Readonly<Record<string, RopaImportField | null>>): PreparedImport {
  return prepareRows(parseCsv(csvText).map((cells, i) => ({ number: i + 1, cells })), chosen);
}

/** Rows from either reader (CSV, or `./xlsx.ts`) → mapping → validation. */
export function prepareRows(
  numbered: readonly NumberedRow[],
  chosen?: Readonly<Record<string, RopaImportField | null>>,
): PreparedImport {
  // Leading comment lines (`# …`) are skipped — the register's own export
  // opens with one saying what the file is, and is not (D-011).
  let skipped = 0;
  while (skipped < numbered.length && (numbered[skipped]!.cells[0] ?? "").trim().startsWith("#")) skipped += 1;
  const rows = numbered.slice(skipped);
  if (rows.length === 0) throw new CsvError("The file is empty.");
  const [headerRow, ...dataRows] = rows;
  const headers = headerRow!.cells.map((h) => h.trim());
  if (dataRows.length > CSV_MAX_RECORDS) {
    throw new CsvError(`An import is at most ${CSV_MAX_RECORDS.toLocaleString("en-IN")} records — split the file.`);
  }

  const mapping = chosen ? applyMapping(headers, chosen) : mapColumns(headers);
  const valid: PreparedRow[] = [];
  const rejected: RejectedRow[] = [];

  dataRows.forEach(({ number: row, cells }) => {
    const mapped = Object.fromEntries(
      Object.entries(mapping.fields).map(([field, index]) => [field, fromCsvCell(cells[index!] ?? "")]),
    ) as Partial<Record<RopaImportField, string>>;
    const result = validateRopaRow(mapped);
    if (!result.ok) {
      rejected.push({ row, errors: result.errors });
      return;
    }
    const warnings = [...result.warnings];
    // A hand-entered rating is an opinion: kept only when it RAISES the
    // derived floor (D-061). Lower is not an error — it is ignored, and said.
    const record = result.record;
    if (record.riskRating !== null) {
      const risk = ropaRisk(importedRecordFacts(record), record.riskRating);
      if (risk.assessor === null && record.riskRating !== risk.derived) {
        warnings.push({
          field: "riskRating",
          issue: `The file says ${record.riskRating}; the register's own rules rate it ${risk.derived}. A rating can be raised, never lowered, so ${risk.derived} stands.`,
        });
      }
    }
    valid.push({ row, record, warnings });
  });

  return { headers, mapping, valid, rejected };
}

/** A prepared row as the import RPC takes it. The assessor rating is sent only when it raises. */
export function toRpcRow(prepared: PreparedRow, departmentId: string | null) {
  const { record } = prepared;
  const risk = ropaRisk(importedRecordFacts(record), record.riskRating);
  const t = record.text;
  return {
    row: prepared.row,
    record_code: record.recordCode,
    name: record.name,
    description: t.description ?? null,
    department_id: departmentId,
    department_text: t.departmentText ?? null,
    data_principal_types: t.dataPrincipalTypes ?? null,
    data_categories: t.dataCategories ?? null,
    estimated_data_principals: record.estimatedDataPrincipals,
    purpose: t.purpose ?? null,
    legal_basis_note: t.legalBasisNote ?? null,
    collection_source: t.collectionSource ?? null,
    systems_text: t.systemsText ?? null,
    vendors_text: t.vendorsText ?? null,
    sharing: t.sharing ?? null,
    retention_rule: t.retentionRule ?? null,
    security_safeguards: t.securitySafeguards ?? null,
    notice_linked: t.noticeLinked ?? null,
    consent_linked: t.consentLinked ?? null,
    rights_workflow: t.rightsWorkflow ?? null,
    grievance_linked: t.grievanceLinked ?? null,
    children_data: record.childrenData,
    cross_border: record.crossBorder,
    ai_processing: record.aiProcessing,
    high_risk_documents: record.highRiskDocuments,
    evidence_note: t.evidenceNote ?? null,
    risk_rating_assessor: risk.assessor,
    // A raise always carries its reason (D-067).
    risk_rating_assessor_reason: risk.assessor ? `Rated ${risk.assessor} in the imported register (row ${prepared.row}).` : null,
    last_reviewed_at: record.lastReviewedAt,
    next_review_at: record.nextReviewAt,
    lawful_basis: record.lawfulBasis,
    retention_trigger: record.retentionTrigger,
    retention_law: t.retentionLaw ?? null,
  };
}
