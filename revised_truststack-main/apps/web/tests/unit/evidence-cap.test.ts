/**
 * The cap lives in two places — `app.evidence_cap()` in the migration (which
 * actually computes every stored adjusted score) and `EVIDENCE_CAP` in
 * packages/core (which the API and the tile use). This parses the SQL and
 * fails if the two tables ever differ (D-020's mirror rule, applied to the
 * one number the whole product rests on).
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  EVIDENCE_CAP,
  EVIDENCE_CONTENT_TYPES,
  EVIDENCE_MAX_BYTES,
  EVIDENCE_REVIEW_STATUSES,
  evidenceStoragePath,
} from "@truststack/core";
import { SEED_EVIDENCE, seedEvidencePath } from "@truststack/db/seed-data";
import { describe, expect, it } from "vitest";

const sql = readFileSync(
  path.resolve(import.meta.dirname, "../../../../packages/db/prisma/migrations/20260918200000_evidence_scoring/migration.sql"),
  "utf8",
);

function block(startMarker: string, endMarker: string): string {
  const start = sql.indexOf(startMarker);
  expect(start, `${startMarker} not found in the migration`).toBeGreaterThan(-1);
  const end = sql.indexOf(endMarker, start);
  return sql.slice(start, end);
}

/** Every quoted MIME type inside a block of SQL. */
const mimeTypes = (text: string) => [...text.matchAll(/'([a-z]+\/[a-z0-9.+-]+)'/g)].map((m) => m[1]!).sort();

describe("app.evidence_cap() in SQL equals EVIDENCE_CAP in packages/core", () => {
  const fn = block("CREATE OR REPLACE FUNCTION app.evidence_cap", "$$;");
  const pairs = Object.fromEntries(
    [...fn.matchAll(/WHEN\s+(\d)\s+THEN\s+(\d)/g)].map((m) => [Number(m[1]), Number(m[2])]),
  );

  it("maps all six levels", () => {
    expect(Object.keys(pairs)).toHaveLength(6);
  });

  it("is the same table", () => {
    expect(pairs).toEqual(EVIDENCE_CAP);
  });

  it("caps E1 AND E2 at 2 in SQL too", () => {
    expect(pairs[1]).toBe(2);
    expect(pairs[2]).toBe(2);
  });

  it("scores an unreviewed level as E0 (COALESCE to 0, never ignored)", () => {
    expect(block("CREATE OR REPLACE FUNCTION app.adjusted_score", "$$;")).toMatch(
      /least\(p_claimed,\s*app\.evidence_cap\(COALESCE\(p_level,\s*0\)\)\)/,
    );
  });
});

describe("the evidence vocabularies match packages/core", () => {
  it("review statuses — and no attested status (D-039)", () => {
    const check = block("evidence_review_status_check", "),");
    const statuses = [...check.matchAll(/'([a-z_]+)'/g)].map((m) => m[1]);
    expect(statuses).toEqual([...EVIDENCE_REVIEW_STATUSES]);
  });

  it("the content-type CHECK and the bucket's allowed_mime_types are both EVIDENCE_CONTENT_TYPES", () => {
    const expected = [...EVIDENCE_CONTENT_TYPES].sort();
    expect(mimeTypes(block("evidence_content_type_check", "evidence_file_name_safe"))).toEqual(expected);
    expect(mimeTypes(block("INSERT INTO storage.buckets", "ON CONFLICT"))).toEqual(expected);
  });

  it("the byte limit is the same in the CHECK, the bucket and core", () => {
    expect(block("evidence_byte_size_range", ",\n")).toContain(`<= ${EVIDENCE_MAX_BYTES}`);
    expect(block("INSERT INTO storage.buckets", "ON CONFLICT")).toContain(`false, ${EVIDENCE_MAX_BYTES},`);
  });

  it("the bucket is private", () => {
    expect(block("INSERT INTO storage.buckets", "ON CONFLICT")).toMatch(/'evidence', 'evidence', false/);
  });
});

describe("the storage layout is one layout", () => {
  it("the seed fixtures use the same path the API writes", () => {
    for (const e of Object.values(SEED_EVIDENCE)) {
      expect(seedEvidencePath(e)).toBe(evidenceStoragePath(e.organizationId, e.id, e.fileName));
    }
  });

  it("no UPDATE or DELETE policy on storage.objects: a stored artefact is immutable", () => {
    const policies = [...sql.matchAll(/CREATE POLICY \w+ ON storage\.objects\s+FOR (\w+)/g)].map((m) => m[1]);
    expect(policies.sort()).toEqual(["INSERT", "SELECT"]);
  });

  it("no user grant on a derived column", () => {
    const grants = [...sql.matchAll(/GRANT (INSERT|UPDATE) \(([^)]*)\)\s+ON public\.(\w+)/g)].map((m) => ({
      table: m[3],
      columns: m[2]!.split(",").map((c) => c.trim()),
    }));
    const responses = grants.filter((g) => g.table === "assessment_responses").flatMap((g) => g.columns);
    for (const derived of ["adjusted_score", "evidence_level", "answered_by", "answered_at"]) {
      expect(responses).not.toContain(derived);
    }
    const evidenceInsert = grants.find((g) => g.table === "evidence" && !g.columns.includes("review_status"))!;
    for (const reviewColumn of ["review_status", "evidence_level", "reviewed_by", "uploaded_by"]) {
      expect(evidenceInsert.columns).not.toContain(reviewColumn);
    }
  });
});
