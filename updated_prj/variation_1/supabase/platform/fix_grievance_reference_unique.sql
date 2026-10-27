-- P1.5 FIX1 - M4 Grievance reference-number bug
-- Swap the GLOBAL unique constraint on grievance_complaints.reference_number
-- for a PER-ORG composite unique index, matching the M5 (dsr_requests) and
-- M8 (breach_incidents) pattern.
--
-- Why: reference numbers are generated per-org (GRV-YYYY-NNN restarts at 001
-- for each organization). A global UNIQUE(reference_number) rejects a second
-- org's first complaint (both compute GRV-2026-001). The generator in
-- src/app/api/grievance/submit/route.ts is already org-scoped; this migration
-- aligns the schema with it.
--
-- Run this in the Supabase SQL Editor BEFORE deploying. Safe to run on an empty
-- table; if data already exists, all current reference numbers remain valid
-- (the composite index is strictly more permissive than the global one).

BEGIN;

-- Step 1: Drop the global unique constraint (auto-generated name from `UNIQUE`).
ALTER TABLE grievance_complaints
  DROP CONSTRAINT IF EXISTS grievance_complaints_reference_number_key;

-- Step 2: Add the per-org composite unique index.
CREATE UNIQUE INDEX IF NOT EXISTS grievance_complaints_org_reference_uniq
  ON grievance_complaints (organization_id, reference_number);

COMMIT;

-- Verify (optional):
--   SELECT indexname FROM pg_indexes
--   WHERE tablename = 'grievance_complaints'
--     AND indexname = 'grievance_complaints_org_reference_uniq';
