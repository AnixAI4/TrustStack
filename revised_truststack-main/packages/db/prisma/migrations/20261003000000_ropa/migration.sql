-- Slice 7 — the ROPA / Processing Activity Register.
--
-- DPDP anchoring: the Act never says "ROPA". What it requires — a notice that
-- itemises the personal data and its purpose (s.5, Rule 3), processing limited
-- to that purpose, erasure when the purpose is served (s.8(7), Rule 8),
-- reasonable security safeguards (Rule 6) and accountability for every Data
-- Processor (s.8(2)) — cannot be shown without knowing what is processed,
-- where, and by whom. The register is how an organisation knows.
--
-- Positioning (spec Step I, verbatim): "a practical DPDP readiness artifact.
-- It should not be overclaimed as a statutory GDPR-style ROPA requirement."
--
-- What is enforced HERE, not only in the application:
--
--   * Completeness /100 and the risk rating are DERIVED by the database on
--     every write and CHECKed as row invariants (the D-044 pattern). No user
--     holds a grant on any derived column, so a score a report quotes cannot
--     be forged — or change between two reads of the same record.
--   * Risk is a floor: an assessor may RAISE it, never lower it (D-039's
--     direction).
--   * Approval takes two people: a reviewer who is not the record's owner
--     (D-043, D-056).
--   * ROPA gaps are derived (D-060) and share `gap_actions`, so a ROPA action
--     obeys the same closing rule as every other action (D-056).
--   * The register never touches `app.assessment_domain_results`: the ROPA
--     DOMAIN is scored from answered, evidenced questions only (D-035).
--
-- `packages/core/src/ropa.ts` holds the same rules for the API and the UI;
-- `apps/web/tests/unit/ropa-register.test.ts` parses this file and fails if
-- the two ever differ (D-053).
--
-- Layout: (1) DDL; (2) the rules, in SQL; (3) CHECK vocabularies and row
-- invariants; (4) the record trigger — derivation and lifecycle; (5) links to
-- systems and vendors; (6) evidence on a record — widening evidence_links;
-- (7) ROPA gaps and their actions; (8) import; (9) audit; (10) grants + RLS;
-- (11) apply-time assertions.
--
-- Decisions: D-061 (the record, completeness, risk, lifecycle, links,
-- data categories); D-062 (ROPA gaps and where their actions show); D-063
-- (the import: CSV only, no new dependency); D-064 (the third evidence link
-- type).

-- ===========================================================================
-- (1) DDL
-- ===========================================================================

-- CreateTable
CREATE TABLE "ropa_records" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "record_code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "department_id" UUID,
    "department_text" TEXT,
    "owner_user_id" UUID,
    "data_principal_types" TEXT,
    "data_categories" TEXT,
    "estimated_data_principals" INTEGER,
    "purpose" TEXT,
    "legal_basis_note" TEXT,
    "collection_source" TEXT,
    "systems_text" TEXT,
    "vendors_text" TEXT,
    "sharing" TEXT,
    "retention_rule" TEXT,
    "security_safeguards" TEXT,
    "notice_linked" TEXT,
    "consent_linked" TEXT,
    "rights_workflow" TEXT,
    "grievance_linked" TEXT,
    "children_data" TEXT NOT NULL DEFAULT 'unknown',
    "cross_border" TEXT NOT NULL DEFAULT 'unknown',
    "ai_processing" TEXT NOT NULL DEFAULT 'unknown',
    "high_risk_documents" TEXT NOT NULL DEFAULT 'unknown',
    "evidence_note" TEXT,
    "last_reviewed_at" DATE,
    "next_review_at" DATE,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "version" INTEGER NOT NULL DEFAULT 1,
    "completeness_score" SMALLINT NOT NULL DEFAULT 0,
    "completeness_band" TEXT NOT NULL DEFAULT 'incomplete',
    "completeness_missing" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "risk_factors" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "risk_points" SMALLINT NOT NULL DEFAULT 0,
    "risk_rating_derived" TEXT NOT NULL DEFAULT 'low',
    "risk_rating_assessor" TEXT,
    "risk_rating" TEXT NOT NULL DEFAULT 'low',
    "system_link_count" INTEGER NOT NULL DEFAULT 0,
    "vendor_link_count" INTEGER NOT NULL DEFAULT 0,
    "evidence_count" INTEGER NOT NULL DEFAULT 0,
    "approved_by" UUID,
    "approved_at" TIMESTAMPTZ(6),
    "created_by" UUID,
    "updated_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ropa_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ropa_systems" (
    "organization_id" UUID NOT NULL,
    "ropa_record_id" UUID NOT NULL,
    "system_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ropa_systems_pkey" PRIMARY KEY ("ropa_record_id","system_id")
);

-- CreateTable
CREATE TABLE "ropa_vendors" (
    "organization_id" UUID NOT NULL,
    "ropa_record_id" UUID NOT NULL,
    "vendor_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ropa_vendors_pkey" PRIMARY KEY ("ropa_record_id","vendor_id")
);

-- CreateTable
CREATE TABLE "ropa_gaps" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "ropa_record_id" UUID,
    "gap_code" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'open',
    "finding" TEXT NOT NULL,
    "recommended_fix" TEXT NOT NULL,
    "generated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ropa_gaps_pkey" PRIMARY KEY ("id")
);

-- AlterTable — an action now has exactly one parent: an assessment gap OR a
-- ROPA gap (D-060). One action table means one workflow, one closing rule,
-- one roadmap.
ALTER TABLE "gap_actions" ALTER COLUMN "gap_id" DROP NOT NULL,
ADD COLUMN     "ropa_gap_id" UUID;

-- CreateIndex
CREATE INDEX "ropa_records_organization_id_idx" ON "ropa_records"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "ropa_records_organization_id_id_key" ON "ropa_records"("organization_id", "id");

-- CreateIndex
CREATE INDEX "ropa_systems_organization_id_idx" ON "ropa_systems"("organization_id");

-- CreateIndex
CREATE INDEX "ropa_systems_system_id_idx" ON "ropa_systems"("system_id");

-- CreateIndex
CREATE INDEX "ropa_vendors_organization_id_idx" ON "ropa_vendors"("organization_id");

-- CreateIndex
CREATE INDEX "ropa_vendors_vendor_id_idx" ON "ropa_vendors"("vendor_id");

-- CreateIndex
CREATE INDEX "ropa_gaps_organization_id_idx" ON "ropa_gaps"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "ropa_gaps_organization_id_id_key" ON "ropa_gaps"("organization_id", "id");

-- CreateIndex
CREATE INDEX "gap_actions_ropa_gap_id_idx" ON "gap_actions"("ropa_gap_id");

-- AddForeignKey
ALTER TABLE "ropa_records" ADD CONSTRAINT "ropa_records_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey — NO ACTION, not RESTRICT: a department in use cannot be
-- deleted, but deleting a whole organisation cascades both sides before the
-- check runs at the end of the statement.
ALTER TABLE "ropa_records" ADD CONSTRAINT "ropa_records_organization_id_department_id_fkey" FOREIGN KEY ("organization_id", "department_id") REFERENCES "departments"("organization_id", "id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ropa_records" ADD CONSTRAINT "ropa_records_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ropa_records" ADD CONSTRAINT "ropa_records_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ropa_records" ADD CONSTRAINT "ropa_records_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ropa_records" ADD CONSTRAINT "ropa_records_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ropa_systems" ADD CONSTRAINT "ropa_systems_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ropa_systems" ADD CONSTRAINT "ropa_systems_organization_id_ropa_record_id_fkey" FOREIGN KEY ("organization_id", "ropa_record_id") REFERENCES "ropa_records"("organization_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ropa_systems" ADD CONSTRAINT "ropa_systems_organization_id_system_id_fkey" FOREIGN KEY ("organization_id", "system_id") REFERENCES "systems"("organization_id", "id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ropa_vendors" ADD CONSTRAINT "ropa_vendors_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ropa_vendors" ADD CONSTRAINT "ropa_vendors_organization_id_ropa_record_id_fkey" FOREIGN KEY ("organization_id", "ropa_record_id") REFERENCES "ropa_records"("organization_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ropa_vendors" ADD CONSTRAINT "ropa_vendors_organization_id_vendor_id_fkey" FOREIGN KEY ("organization_id", "vendor_id") REFERENCES "vendors"("organization_id", "id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ropa_gaps" ADD CONSTRAINT "ropa_gaps_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ropa_gaps" ADD CONSTRAINT "ropa_gaps_organization_id_ropa_record_id_fkey" FOREIGN KEY ("organization_id", "ropa_record_id") REFERENCES "ropa_records"("organization_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gap_actions" ADD CONSTRAINT "gap_actions_organization_id_ropa_gap_id_fkey" FOREIGN KEY ("organization_id", "ropa_gap_id") REFERENCES "ropa_gaps"("organization_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- One gap per record and rule; the organisation-level `no_records` gap has no
-- record, so NULLs must collide too (Postgres 15+). Prisma cannot express it.
CREATE UNIQUE INDEX ropa_gaps_record_code_key
  ON public.ropa_gaps (organization_id, ropa_record_id, gap_code) NULLS NOT DISTINCT;

-- A record's human-readable id, unique per organisation, case-insensitively.
-- Not the primary key.
CREATE UNIQUE INDEX ropa_records_org_code_key ON public.ropa_records (organization_id, lower(record_code));


-- ===========================================================================
-- (2) The rules, in SQL — mirrors packages/core/src/ropa.ts
-- ===========================================================================
-- Every function here is IMMUTABLE and reads no table, because the CHECK
-- constraints in (3) call them: a stored score is a row invariant, not a
-- number somebody wrote.

-- Phrases that mark a value as unresolved — a reviewed list, never NLP.
CREATE OR REPLACE FUNCTION app.ropa_unresolved_phrases()
RETURNS text[]
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = ''
AS $$
  SELECT ARRAY['unknown', 'to be reviewed', 'to be legally reviewed', 'review needed', 'needs review',
               'to be confirmed', 'to be defined', 'not defined', 'not known', 'tbc', 'tbd']::text[];
$$;

-- Lower-cased, whitespace collapsed, trimmed: the form every rule compares.
CREATE OR REPLACE FUNCTION app.ropa_normalise(p_value text)
RETURNS text
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = ''
AS $$
  SELECT btrim(regexp_replace(lower(p_value), '\s+', ' ', 'g'));
$$;

-- Is a text field complete? "Unknown" and "To be legally reviewed" are
-- honest, and NOT complete — they are exactly the gap (D-026).
CREATE OR REPLACE FUNCTION app.ropa_text_complete(p_value text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = ''
AS $$
  SELECT p_value IS NOT NULL
    AND app.ropa_normalise(p_value) <> ''
    AND app.ropa_normalise(p_value) <> ALL (ARRAY['-', '—', '?']::text[])
    AND left(app.ropa_normalise(p_value), 7) <> 'define '
    AND NOT EXISTS (
      SELECT 1 FROM unnest(app.ropa_unresolved_phrases()) AS ph(phrase)
      WHERE strpos(app.ropa_normalise(p_value), ph.phrase) > 0
    );
$$;

-- "None", "No", "N/A" … — a complete answer that says no Data Processor is involved.
CREATE OR REPLACE FUNCTION app.ropa_is_no_vendor(p_value text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = ''
AS $$
  SELECT COALESCE(app.ropa_normalise(p_value) = ANY (ARRAY['none', 'no', 'nil', 'n/a', 'na', 'not applicable',
    'no vendor', 'no vendors', 'no processor', 'no processors']::text[]), false);
$$;

-- How many Data Processors: the linked ones, or the ones the text names
-- (split on commas, semicolons and new lines), whichever is more.
CREATE OR REPLACE FUNCTION app.ropa_vendor_count(p_vendors_text text, p_vendor_link_count integer)
RETURNS integer
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = ''
AS $$
  SELECT greatest(
    p_vendor_link_count,
    CASE WHEN app.ropa_text_complete(p_vendors_text) AND NOT app.ropa_is_no_vendor(p_vendors_text)
      THEN (SELECT count(*)::integer FROM regexp_split_to_table(p_vendors_text, '[,;\n]') AS t(item)
            WHERE regexp_replace(t.item, '\s', '', 'g') <> '')
      ELSE 0
    END
  );
$$;

-- The thirteen areas, in the model's order.
CREATE OR REPLACE FUNCTION app.ropa_area_codes()
RETURNS text[]
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = ''
AS $$
  SELECT ARRAY['identity', 'department_owner', 'data_principals', 'data_categories', 'purpose_basis',
               'collection_source', 'systems', 'vendors', 'notice_consent', 'retention', 'security',
               'risk_review', 'evidence']::text[];
$$;

-- The spec's weights (Step I) — whole numbers, total exactly 100.
CREATE OR REPLACE FUNCTION app.ropa_area_weight(p_area text)
RETURNS integer
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = ''
AS $$
  SELECT CASE p_area
    WHEN 'identity' THEN 8
    WHEN 'department_owner' THEN 8
    WHEN 'data_principals' THEN 8
    WHEN 'data_categories' THEN 10
    WHEN 'purpose_basis' THEN 10
    WHEN 'collection_source' THEN 6
    WHEN 'systems' THEN 8
    WHEN 'vendors' THEN 8
    WHEN 'notice_consent' THEN 8
    WHEN 'retention' THEN 8
    WHEN 'security' THEN 8
    WHEN 'risk_review' THEN 6
    WHEN 'evidence' THEN 4
  END;
$$;

-- Which areas a record is still missing, in the model's order.
CREATE OR REPLACE FUNCTION app.ropa_missing_areas(
  p_name text,
  p_department_id uuid,
  p_department_text text,
  p_owner_user_id uuid,
  p_data_principal_types text,
  p_data_categories text,
  p_purpose text,
  p_legal_basis_note text,
  p_collection_source text,
  p_systems_text text,
  p_system_link_count integer,
  p_vendors_text text,
  p_vendor_link_count integer,
  p_notice_linked text,
  p_consent_linked text,
  p_retention_rule text,
  p_security_safeguards text,
  p_next_review_at date,
  p_evidence_count integer
)
RETURNS text[]
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = ''
AS $$
  SELECT array_remove(ARRAY[
    CASE WHEN NOT app.ropa_text_complete(p_name) THEN 'identity' END,
    CASE WHEN NOT ((p_department_id IS NOT NULL OR app.ropa_text_complete(p_department_text))
                   AND p_owner_user_id IS NOT NULL) THEN 'department_owner' END,
    CASE WHEN NOT app.ropa_text_complete(p_data_principal_types) THEN 'data_principals' END,
    CASE WHEN NOT app.ropa_text_complete(p_data_categories) THEN 'data_categories' END,
    CASE WHEN NOT (app.ropa_text_complete(p_purpose) AND app.ropa_text_complete(p_legal_basis_note)) THEN 'purpose_basis' END,
    CASE WHEN NOT app.ropa_text_complete(p_collection_source) THEN 'collection_source' END,
    CASE WHEN NOT (p_system_link_count > 0 OR app.ropa_text_complete(p_systems_text)) THEN 'systems' END,
    CASE WHEN NOT (p_vendor_link_count > 0 OR app.ropa_text_complete(p_vendors_text)) THEN 'vendors' END,
    CASE WHEN NOT (app.ropa_text_complete(p_notice_linked) AND app.ropa_text_complete(p_consent_linked)) THEN 'notice_consent' END,
    CASE WHEN NOT app.ropa_text_complete(p_retention_rule) THEN 'retention' END,
    CASE WHEN NOT app.ropa_text_complete(p_security_safeguards) THEN 'security' END,
    CASE WHEN p_next_review_at IS NULL THEN 'risk_review' END,
    CASE WHEN NOT (p_evidence_count > 0) THEN 'evidence' END
  ]::text[], NULL);
$$;

-- The sum of the weights of the areas that are NOT missing — an integer,
-- never a fraction compared with a boundary (Slice 6 pitfall 16).
CREATE OR REPLACE FUNCTION app.ropa_completeness_score(p_missing text[])
RETURNS integer
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = ''
AS $$
  SELECT COALESCE(sum(app.ropa_area_weight(a.code)), 0)::integer
  FROM unnest(app.ropa_area_codes()) AS a(code)
  WHERE a.code <> ALL (COALESCE(p_missing, ARRAY[]::text[]));
$$;

-- The spec's bands. Each boundary belongs to the LOWER band: 30 is
-- Incomplete, 31 is Basic.
CREATE OR REPLACE FUNCTION app.ropa_band(p_score integer)
RETURNS text
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = ''
AS $$
  SELECT CASE
    WHEN p_score <= 30 THEN 'incomplete'
    WHEN p_score <= 60 THEN 'basic'
    WHEN p_score <= 80 THEN 'usable'
    ELSE 'strong'
  END;
$$;

-- The scope wizard's large-scale trigger (D-028): internal, never statutory.
CREATE OR REPLACE FUNCTION app.ropa_large_scale_threshold()
RETURNS integer
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = ''
AS $$
  SELECT 100000;
$$;

-- The spec's ten risk factors. A tri-state scores more for YES than for
-- UNKNOWN, and unknown still scores (D-026). Cross-border fires on unknown
-- only — a known transfer is assessed by questions.
CREATE OR REPLACE FUNCTION app.ropa_risk_factors(
  p_children_data text,
  p_estimated_data_principals integer,
  p_high_risk_documents text,
  p_vendors_text text,
  p_vendor_link_count integer,
  p_cross_border text,
  p_ai_processing text,
  p_notice_linked text,
  p_retention_rule text,
  p_evidence_count integer,
  p_owner_user_id uuid,
  p_next_review_at date
)
RETURNS text[]
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = ''
AS $$
  SELECT array_remove(ARRAY[
    CASE WHEN p_children_data = 'yes' THEN 'children_data' END,
    CASE WHEN p_children_data = 'unknown' THEN 'children_data_unknown' END,
    CASE WHEN p_estimated_data_principals >= app.ropa_large_scale_threshold() THEN 'large_scale' END,
    CASE WHEN p_high_risk_documents = 'yes' THEN 'high_risk_documents' END,
    CASE WHEN p_high_risk_documents = 'unknown' THEN 'high_risk_documents_unknown' END,
    CASE WHEN app.ropa_vendor_count(p_vendors_text, p_vendor_link_count) >= 2 THEN 'multiple_vendors' END,
    CASE WHEN p_cross_border = 'unknown' THEN 'cross_border_unknown' END,
    CASE WHEN p_ai_processing = 'yes' THEN 'ai_processing' END,
    CASE WHEN p_ai_processing = 'unknown' THEN 'ai_processing_unknown' END,
    CASE WHEN NOT app.ropa_text_complete(p_notice_linked) THEN 'no_notice' END,
    CASE WHEN NOT app.ropa_text_complete(p_retention_rule) THEN 'no_retention' END,
    CASE WHEN NOT (p_evidence_count > 0) THEN 'no_security_evidence' END,
    CASE WHEN p_owner_user_id IS NULL OR p_next_review_at IS NULL THEN 'no_owner_or_review' END
  ]::text[], NULL);
$$;

CREATE OR REPLACE FUNCTION app.ropa_risk_factor_points(p_factor text)
RETURNS integer
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = ''
AS $$
  SELECT CASE p_factor
    WHEN 'children_data' THEN 3
    WHEN 'children_data_unknown' THEN 1
    WHEN 'large_scale' THEN 2
    WHEN 'high_risk_documents' THEN 2
    WHEN 'high_risk_documents_unknown' THEN 1
    WHEN 'multiple_vendors' THEN 1
    WHEN 'cross_border_unknown' THEN 1
    WHEN 'ai_processing' THEN 2
    WHEN 'ai_processing_unknown' THEN 1
    WHEN 'no_notice' THEN 1
    WHEN 'no_retention' THEN 1
    WHEN 'no_security_evidence' THEN 1
    WHEN 'no_owner_or_review' THEN 1
  END;
$$;

CREATE OR REPLACE FUNCTION app.ropa_risk_points(p_factors text[])
RETURNS integer
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = ''
AS $$
  SELECT COALESCE(sum(app.ropa_risk_factor_points(f.code)), 0)::integer
  FROM unnest(COALESCE(p_factors, ARRAY[]::text[])) AS f(code);
$$;

-- Points → rating. Each boundary belongs to the LOWER rating: 2 is Low.
CREATE OR REPLACE FUNCTION app.ropa_risk_rating(p_points integer)
RETURNS text
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = ''
AS $$
  SELECT CASE
    WHEN p_points <= 2 THEN 'low'
    WHEN p_points <= 5 THEN 'medium'
    WHEN p_points <= 8 THEN 'high'
    ELSE 'critical'
  END;
$$;

CREATE OR REPLACE FUNCTION app.ropa_risk_rank(p_rating text)
RETURNS integer
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = ''
AS $$
  SELECT CASE p_rating WHEN 'low' THEN 0 WHEN 'medium' THEN 1 WHEN 'high' THEN 2 WHEN 'critical' THEN 3 END;
$$;

-- What is shown: the derived floor, or the assessor's rating when it is HIGHER.
CREATE OR REPLACE FUNCTION app.ropa_effective_risk(p_derived text, p_assessor text)
RETURNS text
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = ''
AS $$
  SELECT CASE
    WHEN p_assessor IS NOT NULL AND app.ropa_risk_rank(p_assessor) > app.ropa_risk_rank(p_derived) THEN p_assessor
    ELSE p_derived
  END;
$$;

-- The lifecycle. Approval only from review; an approved record is read-only
-- until reopened to Draft, an archived one until restored to Draft.
CREATE OR REPLACE FUNCTION app.ropa_transition_allowed(p_from text, p_to text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = ''
AS $$
  SELECT (p_from, p_to) IN (
    ('draft', 'in_review'),
    ('draft', 'archived'),
    ('in_review', 'draft'),
    ('in_review', 'approved'),
    ('in_review', 'archived'),
    ('approved', 'draft'),
    ('approved', 'archived'),
    ('archived', 'draft')
  );
$$;

-- "Usable" is the floor for approval.
CREATE OR REPLACE FUNCTION app.ropa_approval_min_score()
RETURNS integer
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = ''
AS $$
  SELECT 61;
$$;

-- The spec's twelve gap conditions, with this slice's own severity ladder
-- (D-060: never `question_severity`, which is a function of an adjusted score).
CREATE OR REPLACE FUNCTION app.ropa_gap_rules()
RETURNS TABLE (code text, severity text, label text, fix text)
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = ''
AS $$
  VALUES
    ('no_records', 'critical', 'No processing records', 'Record the organisation''s main processing activities in the register.'),
    ('no_owner', 'high', 'No owner', 'Assign a named owner who is accountable for this processing activity.'),
    ('categories_missing', 'high', 'Personal data categories missing', 'List the personal data this activity processes.'),
    ('purpose_missing', 'high', 'Purpose or basis unresolved', 'State the purpose, and resolve the DPDP basis note with legal review.'),
    ('vendor_unmapped', 'medium', 'Vendor not mapped', 'Link the Data Processors involved to the vendor register.'),
    ('notice_missing', 'high', 'No notice linked', 'Link the notice that covers this processing.'),
    ('consent_missing', 'medium', 'Consent position unresolved', 'Record how consent is captured, or why it is not the basis.'),
    ('retention_missing', 'high', 'No retention rule', 'Define how long the data is kept and what triggers erasure.'),
    ('safeguards_missing', 'high', 'No safeguards recorded', 'Record the security safeguards that protect this data.'),
    ('children_unreviewed', 'critical', 'Children''s data not reviewed', 'Review the children''s data handling (Rules 10–11) and approve the record.'),
    ('ai_unreviewed', 'high', 'AI processing not reviewed', 'Review the AI or automated processing and approve the record.'),
    ('review_overdue', 'medium', 'Review overdue', 'Review the record and set its next review date.');
$$;

CREATE OR REPLACE FUNCTION app.ropa_gap_severity(p_code text)
RETURNS text
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = ''
AS $$
  SELECT r.severity FROM app.ropa_gap_rules() r WHERE r.code = p_code;
$$;

-- The gaps ONE record opens on `p_today` (the date in India — D-055). A due
-- date of today is not overdue. An archived record opens none.
CREATE OR REPLACE FUNCTION app.ropa_record_gap_codes(
  p_status text,
  p_owner_user_id uuid,
  p_missing text[],
  p_vendors_text text,
  p_vendor_link_count integer,
  p_notice_linked text,
  p_consent_linked text,
  p_children_data text,
  p_ai_processing text,
  p_next_review_at date,
  p_today date
)
RETURNS text[]
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = ''
AS $$
  SELECT CASE WHEN p_status = 'archived' THEN ARRAY[]::text[] ELSE array_remove(ARRAY[
    CASE WHEN p_owner_user_id IS NULL THEN 'no_owner' END,
    CASE WHEN 'data_categories' = ANY (p_missing) THEN 'categories_missing' END,
    CASE WHEN 'purpose_basis' = ANY (p_missing) THEN 'purpose_missing' END,
    CASE WHEN app.ropa_text_complete(p_vendors_text) AND NOT app.ropa_is_no_vendor(p_vendors_text)
              AND p_vendor_link_count = 0 THEN 'vendor_unmapped' END,
    CASE WHEN NOT app.ropa_text_complete(p_notice_linked) THEN 'notice_missing' END,
    CASE WHEN NOT app.ropa_text_complete(p_consent_linked) THEN 'consent_missing' END,
    CASE WHEN 'retention' = ANY (p_missing) THEN 'retention_missing' END,
    CASE WHEN 'security' = ANY (p_missing) THEN 'safeguards_missing' END,
    CASE WHEN p_children_data <> 'no' AND p_status <> 'approved' THEN 'children_unreviewed' END,
    CASE WHEN p_ai_processing <> 'no' AND p_status <> 'approved' THEN 'ai_unreviewed' END,
    CASE WHEN p_next_review_at IS NULL OR p_next_review_at < p_today THEN 'review_overdue' END
  ]::text[], NULL) END;
$$;

REVOKE ALL ON FUNCTION
  app.ropa_unresolved_phrases(), app.ropa_normalise(text), app.ropa_text_complete(text),
  app.ropa_is_no_vendor(text), app.ropa_vendor_count(text, integer), app.ropa_area_codes(),
  app.ropa_area_weight(text),
  app.ropa_missing_areas(text, uuid, text, uuid, text, text, text, text, text, text, integer, text, integer, text, text, text, text, date, integer),
  app.ropa_completeness_score(text[]), app.ropa_band(integer), app.ropa_large_scale_threshold(),
  app.ropa_risk_factors(text, integer, text, text, integer, text, text, text, text, integer, uuid, date),
  app.ropa_risk_factor_points(text), app.ropa_risk_points(text[]), app.ropa_risk_rating(integer),
  app.ropa_risk_rank(text), app.ropa_effective_risk(text, text), app.ropa_transition_allowed(text, text),
  app.ropa_approval_min_score(), app.ropa_gap_rules(), app.ropa_gap_severity(text),
  app.ropa_record_gap_codes(text, uuid, text[], text, integer, text, text, text, text, date, date)
FROM PUBLIC;
-- Pure functions over no data. `authenticated` needs them: the CHECKs below
-- evaluate as the writing role.
GRANT EXECUTE ON FUNCTION
  app.ropa_unresolved_phrases(), app.ropa_normalise(text), app.ropa_text_complete(text),
  app.ropa_is_no_vendor(text), app.ropa_vendor_count(text, integer), app.ropa_area_codes(),
  app.ropa_area_weight(text),
  app.ropa_missing_areas(text, uuid, text, uuid, text, text, text, text, text, text, integer, text, integer, text, text, text, text, date, integer),
  app.ropa_completeness_score(text[]), app.ropa_band(integer), app.ropa_large_scale_threshold(),
  app.ropa_risk_factors(text, integer, text, text, integer, text, text, text, text, integer, uuid, date),
  app.ropa_risk_factor_points(text), app.ropa_risk_points(text[]), app.ropa_risk_rating(integer),
  app.ropa_risk_rank(text), app.ropa_effective_risk(text, text), app.ropa_transition_allowed(text, text),
  app.ropa_approval_min_score(), app.ropa_gap_rules(), app.ropa_gap_severity(text),
  app.ropa_record_gap_codes(text, uuid, text[], text, integer, text, text, text, text, date, date)
TO authenticated;


-- ===========================================================================
-- (3) Constraints Prisma cannot express
-- ===========================================================================
-- CHECKs are evaluated in NAME order (Slice 6 pitfall 10). A test that
-- asserts which one refused a row must make only that one fail.

ALTER TABLE public.ropa_records
  ADD CONSTRAINT ropa_records_status_check CHECK (status IN ('draft', 'in_review', 'approved', 'archived')),
  ADD CONSTRAINT ropa_records_children_data_check CHECK (children_data IN ('yes', 'no', 'unknown')),
  ADD CONSTRAINT ropa_records_cross_border_check CHECK (cross_border IN ('yes', 'no', 'unknown')),
  ADD CONSTRAINT ropa_records_ai_processing_check CHECK (ai_processing IN ('yes', 'no', 'unknown')),
  ADD CONSTRAINT ropa_records_high_risk_documents_check CHECK (high_risk_documents IN ('yes', 'no', 'unknown')),
  ADD CONSTRAINT ropa_records_band_check CHECK (completeness_band IN ('incomplete', 'basic', 'usable', 'strong')),
  ADD CONSTRAINT ropa_records_risk_check CHECK (
    risk_rating IN ('low', 'medium', 'high', 'critical')
    AND risk_rating_derived IN ('low', 'medium', 'high', 'critical')
    AND (risk_rating_assessor IS NULL OR risk_rating_assessor IN ('low', 'medium', 'high', 'critical'))),
  ADD CONSTRAINT ropa_records_record_code_check CHECK (record_code ~ '^[A-Za-z0-9][A-Za-z0-9._/-]{0,49}$'),
  ADD CONSTRAINT ropa_records_name_not_blank CHECK (btrim(name) <> '' AND char_length(name) <= 300),
  ADD CONSTRAINT ropa_records_text_length CHECK (
    greatest(char_length(description), char_length(department_text), char_length(data_principal_types),
      char_length(data_categories), char_length(purpose), char_length(legal_basis_note),
      char_length(collection_source), char_length(systems_text), char_length(vendors_text),
      char_length(sharing), char_length(retention_rule), char_length(security_safeguards),
      char_length(notice_linked), char_length(consent_linked), char_length(rights_workflow),
      char_length(grievance_linked), char_length(evidence_note)) <= 2000),
  ADD CONSTRAINT ropa_records_counts_check CHECK (
    version >= 1 AND system_link_count >= 0 AND vendor_link_count >= 0 AND evidence_count >= 0
    AND (estimated_data_principals IS NULL OR estimated_data_principals >= 0)),
  -- Completeness is a row invariant of the record's own fields and links —
  -- never a number somebody wrote. Three CHECKs, one per derived column.
  ADD CONSTRAINT ropa_records_missing_is_derived CHECK (
    completeness_missing = app.ropa_missing_areas(
      name, department_id, department_text, owner_user_id, data_principal_types, data_categories,
      purpose, legal_basis_note, collection_source, systems_text, system_link_count, vendors_text,
      vendor_link_count, notice_linked, consent_linked, retention_rule, security_safeguards,
      next_review_at, evidence_count)),
  ADD CONSTRAINT ropa_records_score_is_derived
    CHECK (completeness_score = app.ropa_completeness_score(completeness_missing)),
  ADD CONSTRAINT ropa_records_band_is_derived CHECK (completeness_band = app.ropa_band(completeness_score)),
  -- Risk: the factors, their points, the derived floor, and what is shown.
  ADD CONSTRAINT ropa_records_factors_are_derived CHECK (
    risk_factors = app.ropa_risk_factors(
      children_data, estimated_data_principals, high_risk_documents, vendors_text, vendor_link_count,
      cross_border, ai_processing, notice_linked, retention_rule, evidence_count, owner_user_id,
      next_review_at)),
  ADD CONSTRAINT ropa_records_points_are_derived CHECK (risk_points = app.ropa_risk_points(risk_factors)),
  ADD CONSTRAINT ropa_records_rating_is_derived CHECK (risk_rating_derived = app.ropa_risk_rating(risk_points)),
  -- The assessor can only RAISE what is shown (D-039's direction).
  ADD CONSTRAINT ropa_records_rating_never_lowered
    CHECK (risk_rating = app.ropa_effective_risk(risk_rating_derived, risk_rating_assessor)),
  -- Approved ⇔ when, and nobody approves a record they own (D-043, D-056).
  ADD CONSTRAINT ropa_records_approved_has_timestamp CHECK ((status = 'approved') = (approved_at IS NOT NULL)),
  ADD CONSTRAINT ropa_records_unapproved_has_no_approver CHECK (status = 'approved' OR approved_by IS NULL),
  ADD CONSTRAINT ropa_records_no_self_approval
    CHECK (approved_by IS NULL OR owner_user_id IS NULL OR approved_by <> owner_user_id);

ALTER TABLE public.ropa_gaps
  ADD CONSTRAINT ropa_gaps_state_check CHECK (state IN ('open', 'superseded')),
  ADD CONSTRAINT ropa_gaps_code_check CHECK (gap_code IN (
    'no_records', 'no_owner', 'categories_missing', 'purpose_missing', 'vendor_unmapped',
    'notice_missing', 'consent_missing', 'retention_missing', 'safeguards_missing',
    'children_unreviewed', 'ai_unreviewed', 'review_overdue')),
  -- Severity is the rule's, and priority the severity's — invariants, so a
  -- forged severity is refused even from tooling.
  ADD CONSTRAINT ropa_gaps_severity_is_derived CHECK (severity = app.ropa_gap_severity(gap_code)),
  ADD CONSTRAINT ropa_gaps_priority_is_derived CHECK (priority = app.question_priority(severity)),
  -- Only "the register is empty" is about the organisation rather than a record.
  ADD CONSTRAINT ropa_gaps_record_matches_code CHECK ((gap_code = 'no_records') = (ropa_record_id IS NULL)),
  ADD CONSTRAINT ropa_gaps_finding_not_blank CHECK (btrim(finding) <> '');

-- Exactly one parent per action (D-060).
ALTER TABLE public.gap_actions
  ADD CONSTRAINT gap_actions_one_parent CHECK (num_nonnulls(gap_id, ropa_gap_id) = 1);

CREATE TRIGGER ropa_records_touch_updated_at BEFORE UPDATE ON public.ropa_records
  FOR EACH ROW EXECUTE FUNCTION app.touch_updated_at();
CREATE TRIGGER ropa_gaps_touch_updated_at BEFORE UPDATE ON public.ropa_gaps
  FOR EACH ROW EXECUTE FUNCTION app.touch_updated_at();


-- ===========================================================================
-- (4) The record trigger — derivation and lifecycle
-- ===========================================================================
-- On EVERY write, whoever writes: the record code is assigned if missing, the
-- lifecycle rules are applied, and completeness and risk are re-derived from
-- the row. The CHECKs in (3) then refuse anything that does not match — so
-- even tooling with this trigger disabled cannot store a forged score.

CREATE OR REPLACE FUNCTION app.ropa_record_before_write()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_actor uuid := app.current_user_id();
  v_next integer;
  v_content_edited boolean;
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- A human-readable code, unique per organisation: ROPA-001, ROPA-002 …
    -- Serialised per organisation so two creates cannot take the same number.
    IF NEW.record_code IS NULL OR btrim(NEW.record_code) = '' THEN
      PERFORM pg_advisory_xact_lock(hashtextextended('ropa_record_code:' || NEW.organization_id::text, 0));
      SELECT COALESCE(max((substring(r.record_code FROM '^ROPA-(\d{1,9})$'))::integer), 0) + 1 INTO v_next
      FROM public.ropa_records r
      WHERE r.organization_id = NEW.organization_id AND r.record_code ~ '^ROPA-\d{1,9}$';
      NEW.record_code := 'ROPA-' || lpad(v_next::text, greatest(3, length(v_next::text)), '0');
    END IF;
    NEW.record_code := btrim(NEW.record_code);
    -- A new record always starts as a draft of version 1, with no links and
    -- no evidence yet; the link triggers count them as they arrive.
    NEW.status := COALESCE(NEW.status, 'draft');
    IF v_actor IS NOT NULL THEN
      NEW.status := 'draft';
      NEW.created_by := v_actor;
      NEW.updated_by := v_actor;
    END IF;
    NEW.version := 1;
    NEW.system_link_count := 0;
    NEW.vendor_link_count := 0;
    NEW.evidence_count := 0;
    NEW.approved_by := NULL;
    NEW.approved_at := NULL;
    IF NEW.status = 'approved' THEN
      RAISE EXCEPTION 'A record is approved through review, not created approved.' USING ERRCODE = 'TS422';
    END IF;
  ELSE
    IF (NEW.organization_id, NEW.record_code) IS DISTINCT FROM (OLD.organization_id, OLD.record_code) THEN
      RAISE EXCEPTION 'A record''s ID cannot be changed.' USING ERRCODE = 'TS422';
    END IF;

    v_content_edited := (
      NEW.name, NEW.description, NEW.department_id, NEW.department_text, NEW.owner_user_id,
      NEW.data_principal_types, NEW.data_categories, NEW.estimated_data_principals, NEW.purpose,
      NEW.legal_basis_note, NEW.collection_source, NEW.systems_text, NEW.vendors_text, NEW.sharing,
      NEW.retention_rule, NEW.security_safeguards, NEW.notice_linked, NEW.consent_linked,
      NEW.rights_workflow, NEW.grievance_linked, NEW.children_data, NEW.cross_border,
      NEW.ai_processing, NEW.high_risk_documents, NEW.evidence_note, NEW.last_reviewed_at,
      NEW.next_review_at, NEW.risk_rating_assessor
    ) IS DISTINCT FROM (
      OLD.name, OLD.description, OLD.department_id, OLD.department_text, OLD.owner_user_id,
      OLD.data_principal_types, OLD.data_categories, OLD.estimated_data_principals, OLD.purpose,
      OLD.legal_basis_note, OLD.collection_source, OLD.systems_text, OLD.vendors_text, OLD.sharing,
      OLD.retention_rule, OLD.security_safeguards, OLD.notice_linked, OLD.consent_linked,
      OLD.rights_workflow, OLD.grievance_linked, OLD.children_data, OLD.cross_border,
      OLD.ai_processing, OLD.high_risk_documents, OLD.evidence_note, OLD.last_reviewed_at,
      OLD.next_review_at, OLD.risk_rating_assessor
    );

    -- Content changes only while the record is being worked on. An approved
    -- record records what was approved; editing it would quietly change it,
    -- so it is reopened first. Approving and editing in one step is refused
    -- for the same reason: the approver approves what they saw.
    IF v_content_edited AND NEW.status NOT IN ('draft', 'in_review') THEN
      IF OLD.status = 'archived' AND NEW.status = 'archived' THEN
        RAISE EXCEPTION 'This record is archived — restore it to change it.' USING ERRCODE = 'TS409';
      ELSIF NEW.status = 'approved' AND OLD.status <> 'approved' THEN
        RAISE EXCEPTION 'Save the changes first, then approve the record.' USING ERRCODE = 'TS409';
      ELSE
        RAISE EXCEPTION 'This record is approved — reopen it to change it.' USING ERRCODE = 'TS409';
      END IF;
    END IF;

    IF v_actor IS NOT NULL AND (v_content_edited OR NEW.status IS DISTINCT FROM OLD.status) THEN
      -- RLS filters the row out for anyone without ropa.write; this is the
      -- second lock, with a message.
      IF NOT app.has_permission(NEW.organization_id, 'ropa.write') THEN
        RAISE EXCEPTION 'You do not have permission to change this record.' USING ERRCODE = 'TS403';
      END IF;
      NEW.updated_by := v_actor;
    ELSE
      NEW.updated_by := OLD.updated_by;
    END IF;

    -- Stamped columns are the database's, never the caller's.
    NEW.created_by := OLD.created_by;
    NEW.version := OLD.version;
    NEW.approved_by := OLD.approved_by;
    NEW.approved_at := OLD.approved_at;
  END IF;

  -- The owner is a person in THIS organisation.
  IF NEW.owner_user_id IS NOT NULL AND (TG_OP = 'INSERT' OR NEW.owner_user_id IS DISTINCT FROM OLD.owner_user_id) THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.organization_users ou
      WHERE ou.organization_id = NEW.organization_id
        AND ou.user_id = NEW.owner_user_id
        AND ou.status = 'active'
    ) THEN
      RAISE EXCEPTION 'The owner must be an active member of this organisation.' USING ERRCODE = 'TS422';
    END IF;
  END IF;

  -- Derive. Always — whoever writes.
  NEW.completeness_missing := app.ropa_missing_areas(
    NEW.name, NEW.department_id, NEW.department_text, NEW.owner_user_id, NEW.data_principal_types,
    NEW.data_categories, NEW.purpose, NEW.legal_basis_note, NEW.collection_source, NEW.systems_text,
    NEW.system_link_count, NEW.vendors_text, NEW.vendor_link_count, NEW.notice_linked,
    NEW.consent_linked, NEW.retention_rule, NEW.security_safeguards, NEW.next_review_at,
    NEW.evidence_count);
  NEW.completeness_score := app.ropa_completeness_score(NEW.completeness_missing);
  NEW.completeness_band := app.ropa_band(NEW.completeness_score);
  NEW.risk_factors := app.ropa_risk_factors(
    NEW.children_data, NEW.estimated_data_principals, NEW.high_risk_documents, NEW.vendors_text,
    NEW.vendor_link_count, NEW.cross_border, NEW.ai_processing, NEW.notice_linked,
    NEW.retention_rule, NEW.evidence_count, NEW.owner_user_id, NEW.next_review_at);
  NEW.risk_points := app.ropa_risk_points(NEW.risk_factors);
  NEW.risk_rating_derived := app.ropa_risk_rating(NEW.risk_points);

  -- An assessor may RAISE the rating, never lower it (D-039's direction).
  -- Checked when the assessor's rating is set; if the derived floor later
  -- rises above it, the floor simply wins.
  IF NEW.risk_rating_assessor IS NOT NULL
     AND (TG_OP = 'INSERT' OR NEW.risk_rating_assessor IS DISTINCT FROM OLD.risk_rating_assessor)
     AND app.ropa_risk_rank(NEW.risk_rating_assessor) < app.ropa_risk_rank(NEW.risk_rating_derived) THEN
    RAISE EXCEPTION 'An assessor may raise a record''s risk rating, never lower it below the derived rating (%).',
      NEW.risk_rating_derived USING ERRCODE = 'TS422';
  END IF;
  NEW.risk_rating := app.ropa_effective_risk(NEW.risk_rating_derived, NEW.risk_rating_assessor);

  -- The lifecycle.
  IF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    IF NOT app.ropa_transition_allowed(OLD.status, NEW.status) THEN
      RAISE EXCEPTION 'A record that is % cannot move to %.', replace(OLD.status, '_', ' '), replace(NEW.status, '_', ' ')
        USING ERRCODE = 'TS409';
    END IF;

    IF NEW.status = 'approved' THEN
      -- Two people, always: an owner, and a reviewer who is not that owner.
      IF NEW.owner_user_id IS NULL THEN
        RAISE EXCEPTION 'Assign an owner before approving this record.' USING ERRCODE = 'TS409';
      END IF;
      IF v_actor IS NOT NULL THEN
        IF NOT app.has_permission(NEW.organization_id, 'evidence.review') THEN
          RAISE EXCEPTION 'Only a reviewer can approve a processing record.' USING ERRCODE = 'TS403';
        END IF;
        IF v_actor = NEW.owner_user_id THEN
          RAISE EXCEPTION 'The record''s owner cannot approve it — another reviewer must.' USING ERRCODE = 'TS403';
        END IF;
      END IF;
      IF NEW.completeness_score < app.ropa_approval_min_score() THEN
        RAISE EXCEPTION 'A record must be at least Usable (61/100) before it can be approved.' USING ERRCODE = 'TS409';
      END IF;
      NEW.approved_by := v_actor;
      NEW.approved_at := now();
      -- Approval IS a review: it is dated in India (D-055).
      NEW.last_reviewed_at := (now() AT TIME ZONE 'Asia/Kolkata')::date;
    ELSIF OLD.status = 'approved' THEN
      -- Leaving approval. The audit log keeps it; the row stops claiming it.
      NEW.approved_by := NULL;
      NEW.approved_at := NULL;
      -- Reopened for correction: what is approved next is a new version.
      IF NEW.status = 'draft' THEN
        NEW.version := OLD.version + 1;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Links are polymorphic, so no FK can cascade them (D-008).
CREATE OR REPLACE FUNCTION app.ropa_record_after_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  DELETE FROM public.evidence_links
  WHERE organization_id = OLD.organization_id
    AND linked_entity_type = 'ropa_record'
    AND linked_entity_id = OLD.id;
  RETURN NULL;
END;
$$;

REVOKE ALL ON FUNCTION app.ropa_record_before_write(), app.ropa_record_after_delete() FROM PUBLIC;

CREATE TRIGGER ropa_records_before_write
  BEFORE INSERT OR UPDATE ON public.ropa_records
  FOR EACH ROW EXECUTE FUNCTION app.ropa_record_before_write();
CREATE TRIGGER ropa_records_after_delete
  AFTER DELETE ON public.ropa_records
  FOR EACH ROW EXECUTE FUNCTION app.ropa_record_after_delete();


-- ===========================================================================
-- (5) Links to the Slice 2 registers
-- ===========================================================================
-- The imported text is kept AND a record can be linked to the system and
-- vendor registers through these join tables (composite FKs on both sides).
-- Text alone counts as complete; the vendor-mapping GAP is what asks for the
-- link (D-061). The counts on the record are the database's.

CREATE OR REPLACE FUNCTION app.ropa_link_before_write()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_record_id uuid := CASE WHEN TG_OP = 'DELETE' THEN OLD.ropa_record_id ELSE NEW.ropa_record_id END;
  v_organization_id uuid := CASE WHEN TG_OP = 'DELETE' THEN OLD.organization_id ELSE NEW.organization_id END;
  v_status text;
BEGIN
  SELECT r.status INTO v_status
  FROM public.ropa_records r
  WHERE r.id = v_record_id AND r.organization_id = v_organization_id;

  -- The record is already gone: this is its cascade, not somebody unlinking.
  IF TG_OP = 'DELETE' AND NOT FOUND THEN
    RETURN OLD;
  END IF;

  IF v_status = 'approved' THEN
    RAISE EXCEPTION 'This record is approved — reopen it to change its links.' USING ERRCODE = 'TS409';
  ELSIF v_status = 'archived' THEN
    RAISE EXCEPTION 'This record is archived — restore it to change its links.' USING ERRCODE = 'TS409';
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION app.ropa_link_after_write()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_record_id uuid := CASE WHEN TG_OP = 'DELETE' THEN OLD.ropa_record_id ELSE NEW.ropa_record_id END;
  v_organization_id uuid := CASE WHEN TG_OP = 'DELETE' THEN OLD.organization_id ELSE NEW.organization_id END;
BEGIN
  -- The record's trigger re-derives completeness and risk from the new count.
  IF TG_TABLE_NAME = 'ropa_systems' THEN
    UPDATE public.ropa_records r
    SET system_link_count = (
      SELECT count(*) FROM public.ropa_systems s
      WHERE s.organization_id = r.organization_id AND s.ropa_record_id = r.id)
    WHERE r.id = v_record_id AND r.organization_id = v_organization_id;
  ELSE
    UPDATE public.ropa_records r
    SET vendor_link_count = (
      SELECT count(*) FROM public.ropa_vendors v
      WHERE v.organization_id = r.organization_id AND v.ropa_record_id = r.id)
    WHERE r.id = v_record_id AND r.organization_id = v_organization_id;
  END IF;
  RETURN NULL;
END;
$$;

REVOKE ALL ON FUNCTION app.ropa_link_before_write(), app.ropa_link_after_write() FROM PUBLIC;

CREATE TRIGGER ropa_systems_before_write BEFORE INSERT OR DELETE ON public.ropa_systems
  FOR EACH ROW EXECUTE FUNCTION app.ropa_link_before_write();
CREATE TRIGGER ropa_systems_after_write AFTER INSERT OR DELETE ON public.ropa_systems
  FOR EACH ROW EXECUTE FUNCTION app.ropa_link_after_write();
CREATE TRIGGER ropa_vendors_before_write BEFORE INSERT OR DELETE ON public.ropa_vendors
  FOR EACH ROW EXECUTE FUNCTION app.ropa_link_before_write();
CREATE TRIGGER ropa_vendors_after_write AFTER INSERT OR DELETE ON public.ropa_vendors
  FOR EACH ROW EXECUTE FUNCTION app.ropa_link_after_write();


-- ===========================================================================
-- (6) Evidence on a record — widening evidence_links to a third type
-- ===========================================================================
-- FOUR trigger functions on evidence_links carry a branch per target type.
-- Each is redefined here from its LATEST body — the Slice 6 migration, which
-- is where the gap_action branches live (copying Slice 4's or 5's would
-- silently drop them). `apps/web/tests/unit/ropa-register.test.ts` counts
-- them from every migration and fails if one is missed.
--
--   * BEFORE INSERT gains a `ropa_record` branch: the record must be this
--     organisation's and not archived, and the actor needs ropa.write.
--   * AFTER INSERT / AFTER DELETE: an answer re-derives its score as before;
--     a ROPA record re-derives its COMPLETENESS (the evidence area, and the
--     "no evidence" risk factor) — D-064. A gap action still re-derives
--     nothing, and a ROPA link never touches an answer.
--   * BEFORE DELETE: evidence cannot be detached from an approved record —
--     it may be what the approval stood on. Reopen it first.
--
-- The object-exists rule (D-039) applies to all three targets.

ALTER TABLE public.evidence_links DROP CONSTRAINT evidence_links_entity_type_check;
ALTER TABLE public.evidence_links
  ADD CONSTRAINT evidence_links_entity_type_check
    CHECK (linked_entity_type IN ('assessment_response', 'gap_action', 'ropa_record'));

-- How many stored artefacts a record has. Every link was checked against a
-- stored object when it was made.
CREATE OR REPLACE FUNCTION app.ropa_evidence_count(p_organization_id uuid, p_record_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT count(*)::integer
  FROM public.evidence_links l
  WHERE l.organization_id = p_organization_id
    AND l.linked_entity_type = 'ropa_record'
    AND l.linked_entity_id = p_record_id;
$$;

REVOKE ALL ON FUNCTION app.ropa_evidence_count(uuid, uuid) FROM PUBLIC;

CREATE OR REPLACE FUNCTION app.evidence_link_before_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_actor uuid := app.current_user_id();
  v_status text;
  v_path text;
BEGIN
  -- Same organisation, always: the composite FK covers the evidence side, and
  -- this covers the polymorphic side, which no FK can.
  IF NEW.linked_entity_type = 'assessment_response' THEN
    SELECT a.status INTO v_status
    FROM public.assessment_responses r
    JOIN public.assessments a ON a.id = r.assessment_id AND a.organization_id = r.organization_id
    WHERE r.id = NEW.linked_entity_id AND r.organization_id = NEW.organization_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Response not found.' USING ERRCODE = 'TS404';
    END IF;
    IF v_status IN ('submitted', 'finalised') THEN
      RAISE EXCEPTION 'This assessment is % — its evidence is locked.', v_status USING ERRCODE = 'TS409';
    END IF;
  ELSIF NEW.linked_entity_type = 'gap_action' THEN
    PERFORM 1
    FROM public.gap_actions ga
    WHERE ga.id = NEW.linked_entity_id AND ga.organization_id = NEW.organization_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Action not found.' USING ERRCODE = 'TS404';
    END IF;
    -- Attaching evidence to an action is work on the action.
    IF v_actor IS NOT NULL AND NOT app.has_permission(NEW.organization_id, 'gap.write') THEN
      RAISE EXCEPTION 'You do not have permission to change this action.' USING ERRCODE = 'TS403';
    END IF;
  ELSIF NEW.linked_entity_type = 'ropa_record' THEN
    SELECT rr.status INTO v_status
    FROM public.ropa_records rr
    WHERE rr.id = NEW.linked_entity_id AND rr.organization_id = NEW.organization_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Record not found.' USING ERRCODE = 'TS404';
    END IF;
    IF v_status = 'archived' THEN
      RAISE EXCEPTION 'This record is archived — restore it before attaching evidence.' USING ERRCODE = 'TS409';
    END IF;
    -- Attaching evidence to a record is work on the register.
    IF v_actor IS NOT NULL AND NOT app.has_permission(NEW.organization_id, 'ropa.write') THEN
      RAISE EXCEPTION 'You do not have permission to change this record.' USING ERRCODE = 'TS403';
    END IF;
  ELSE
    RAISE EXCEPTION 'Evidence cannot be linked to that.' USING ERRCODE = 'TS422';
  END IF;

  SELECT e.storage_path INTO v_path
  FROM public.evidence e
  WHERE e.id = NEW.evidence_id AND e.organization_id = NEW.organization_id;
  IF v_path IS NULL THEN
    RAISE EXCEPTION 'Evidence not found.' USING ERRCODE = 'TS404';
  END IF;
  IF NOT app.evidence_object_exists(v_path) THEN
    RAISE EXCEPTION 'The file has not finished uploading — link it once the upload completes.' USING ERRCODE = 'TS409';
  END IF;

  NEW.linked_at := now();
  IF v_actor IS NOT NULL THEN
    NEW.linked_by := v_actor;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION app.evidence_link_after_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- A ROPA record re-derives its completeness — never an answer's score.
  IF NEW.linked_entity_type = 'ropa_record' THEN
    UPDATE public.ropa_records rr
    SET evidence_count = app.ropa_evidence_count(rr.organization_id, rr.id)
    WHERE rr.id = NEW.linked_entity_id AND rr.organization_id = NEW.organization_id;
    RETURN NULL;
  END IF;
  -- Only an answer has a score to re-derive.
  IF NEW.linked_entity_type <> 'assessment_response' THEN
    RETURN NULL;
  END IF;
  UPDATE public.assessment_responses r
  SET evidence_level = app.linked_evidence_level(r.organization_id, r.id)
  WHERE r.id = NEW.linked_entity_id AND r.organization_id = NEW.organization_id;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION app.evidence_link_before_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_status text;
  v_target_exists boolean;
  v_evidence_exists boolean;
BEGIN
  -- Two cascades reach here and neither is somebody unlinking: the target
  -- deleted first takes its links with it (an after-delete trigger), and
  -- deleting the artefact takes them too (the composite FK). Both leave the
  -- parent row already gone, which is how they are told apart from a user's
  -- DELETE on the link itself.
  SELECT EXISTS (
    SELECT 1 FROM public.evidence e
    WHERE e.id = OLD.evidence_id AND e.organization_id = OLD.organization_id
  ) INTO v_evidence_exists;

  IF OLD.linked_entity_type = 'gap_action' THEN
    SELECT ga.status INTO v_status
    FROM public.gap_actions ga
    WHERE ga.id = OLD.linked_entity_id AND ga.organization_id = OLD.organization_id;
    v_target_exists := FOUND;

    -- A closed action may be standing on this artefact. Reopen it first.
    IF v_target_exists AND v_evidence_exists AND v_status = 'closed' THEN
      RAISE EXCEPTION 'This action is closed — reopen it before detaching its evidence.' USING ERRCODE = 'TS409';
    END IF;
    RETURN OLD;
  END IF;

  IF OLD.linked_entity_type = 'ropa_record' THEN
    SELECT rr.status INTO v_status
    FROM public.ropa_records rr
    WHERE rr.id = OLD.linked_entity_id AND rr.organization_id = OLD.organization_id;
    v_target_exists := FOUND;

    -- An approved record may be standing on this artefact. Reopen it first.
    IF v_target_exists AND v_evidence_exists AND v_status = 'approved' THEN
      RAISE EXCEPTION 'This record is approved — reopen it before detaching its evidence.' USING ERRCODE = 'TS409';
    END IF;
    RETURN OLD;
  END IF;

  SELECT a.status INTO v_status
  FROM public.assessment_responses r
  JOIN public.assessments a ON a.id = r.assessment_id AND a.organization_id = r.organization_id
  WHERE r.id = OLD.linked_entity_id AND r.organization_id = OLD.organization_id;
  v_target_exists := FOUND;

  IF v_target_exists AND v_evidence_exists AND v_status IN ('submitted', 'finalised') THEN
    RAISE EXCEPTION 'This assessment is % — its evidence is locked.', v_status USING ERRCODE = 'TS409';
  END IF;
  RETURN OLD;
END;
$$;

CREATE OR REPLACE FUNCTION app.evidence_link_after_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- A ROPA record re-derives its completeness — never an answer's score. On
  -- the record's own cascade the UPDATE finds nothing, which is correct.
  IF OLD.linked_entity_type = 'ropa_record' THEN
    UPDATE public.ropa_records rr
    SET evidence_count = app.ropa_evidence_count(rr.organization_id, rr.id)
    WHERE rr.id = OLD.linked_entity_id AND rr.organization_id = OLD.organization_id;
    RETURN NULL;
  END IF;
  -- Detaching evidence from a gap action must never move an answer's score.
  IF OLD.linked_entity_type <> 'assessment_response' THEN
    RETURN NULL;
  END IF;
  UPDATE public.assessment_responses r
  SET evidence_level = app.linked_evidence_level(r.organization_id, r.id)
  WHERE r.id = OLD.linked_entity_id AND r.organization_id = OLD.organization_id;
  RETURN NULL;
END;
$$;


-- ===========================================================================
-- (7) ROPA gaps, and their actions on the SHARED table (D-060)
-- ===========================================================================

-- What the register says the gaps are TODAY (in India). One row per record
-- and rule, plus `no_records` when the register is empty or all archived.
CREATE OR REPLACE FUNCTION app.ropa_derived_gaps(p_organization_id uuid)
RETURNS TABLE (
  ropa_record_id uuid,
  gap_code text,
  severity text,
  priority text,
  finding text,
  recommended_fix text,
  action_title text,
  owner_role text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  WITH live AS (
    SELECT r.*
    FROM public.ropa_records r
    WHERE r.organization_id = p_organization_id AND r.status <> 'archived'
  ),
  per_record AS (
    SELECT l.id, l.record_code, l.name, l.department_text, c.code
    FROM live l
    CROSS JOIN LATERAL unnest(app.ropa_record_gap_codes(
      l.status, l.owner_user_id, l.completeness_missing, l.vendors_text, l.vendor_link_count,
      l.notice_linked, l.consent_linked, l.children_data, l.ai_processing, l.next_review_at,
      (now() AT TIME ZONE 'Asia/Kolkata')::date)) AS c(code)
  )
  SELECT
    p.id, p.code, g.severity, app.question_priority(g.severity),
    g.label || ': ' || p.record_code || ' — ' || p.name,
    g.fix,
    left(g.fix || ' (' || p.record_code || ')', 500),
    left(p.department_text, 200)
  FROM per_record p
  JOIN app.ropa_gap_rules() g ON g.code = p.code
  UNION ALL
  SELECT NULL::uuid, g.code, g.severity, app.question_priority(g.severity),
    g.label || ': the register holds no live processing activity.', g.fix, g.fix, NULL::text
  FROM app.ropa_gap_rules() g
  WHERE g.code = 'no_records' AND NOT EXISTS (SELECT 1 FROM live);
$$;

-- D-057's "human work", for an action whose parent is a ROPA gap.
CREATE OR REPLACE FUNCTION app.ropa_gap_has_human_work(p_organization_id uuid, p_ropa_gap_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.gap_actions a
    WHERE a.organization_id = p_organization_id
      AND a.ropa_gap_id = p_ropa_gap_id
      AND (
        a.updated_by IS NOT NULL
        OR a.owner_user_id IS NOT NULL
        OR a.notes IS NOT NULL
        OR a.status <> 'open'
        OR EXISTS (
          SELECT 1 FROM public.evidence_links l
          WHERE l.organization_id = a.organization_id
            AND l.linked_entity_type = 'gap_action'
            AND l.linked_entity_id = a.id
        )
      )
  );
$$;

-- Bring the ROPA gaps in line with the register. The SAME regeneration rule
-- as the assessment register (D-057): still derived → refreshed in place;
-- newly derived → a gap and one action; no longer derived → deleted if
-- nobody touched its action, superseded if somebody did; an existing action
-- is NEVER rewritten. No permission check and no audit row: this is the
-- engine, called by the RPC below.
CREATE OR REPLACE FUNCTION app.refresh_ropa_gaps(p_organization_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_today date := (now() AT TIME ZONE 'Asia/Kolkata')::date;
  v_opened integer;
  v_superseded integer;
  v_removed integer;
BEGIN
  WITH upserted AS (
    INSERT INTO public.ropa_gaps AS g (
      organization_id, ropa_record_id, gap_code, severity, priority, state, finding, recommended_fix
    )
    SELECT p_organization_id, d.ropa_record_id, d.gap_code, d.severity, d.priority, 'open', d.finding, d.recommended_fix
    FROM app.ropa_derived_gaps(p_organization_id) d
    ON CONFLICT (organization_id, ropa_record_id, gap_code) DO UPDATE
      SET severity = EXCLUDED.severity,
          priority = EXCLUDED.priority,
          state = 'open',
          finding = EXCLUDED.finding,
          recommended_fix = EXCLUDED.recommended_fix
      -- An unchanged gap is not touched at all, so regenerating twice is a no-op.
      WHERE (g.severity, g.priority, g.state, g.finding, g.recommended_fix)
            IS DISTINCT FROM
            (EXCLUDED.severity, EXCLUDED.priority, 'open', EXCLUDED.finding, EXCLUDED.recommended_fix)
    RETURNING (xmax = 0) AS inserted
  )
  SELECT count(*) FILTER (WHERE inserted)::integer INTO v_opened FROM upserted;

  -- One action per gap that has none. Never a second one, never a rewrite.
  INSERT INTO public.gap_actions (organization_id, ropa_gap_id, title, owner_role, status, due_date)
  SELECT g.organization_id, g.id, d.action_title, d.owner_role, 'open', v_today + app.gap_due_days(g.priority)
  FROM public.ropa_gaps g
  JOIN app.ropa_derived_gaps(p_organization_id) d
    ON d.gap_code = g.gap_code AND d.ropa_record_id IS NOT DISTINCT FROM g.ropa_record_id
  WHERE g.organization_id = p_organization_id
    AND NOT EXISTS (
      SELECT 1 FROM public.gap_actions a WHERE a.organization_id = g.organization_id AND a.ropa_gap_id = g.id
    );

  UPDATE public.ropa_gaps g
  SET state = 'superseded'
  WHERE g.organization_id = p_organization_id
    AND g.state <> 'superseded'
    AND NOT EXISTS (
      SELECT 1 FROM app.ropa_derived_gaps(p_organization_id) d
      WHERE d.gap_code = g.gap_code AND d.ropa_record_id IS NOT DISTINCT FROM g.ropa_record_id
    )
    AND app.ropa_gap_has_human_work(g.organization_id, g.id);
  GET DIAGNOSTICS v_superseded = ROW_COUNT;

  DELETE FROM public.ropa_gaps g
  WHERE g.organization_id = p_organization_id
    AND NOT EXISTS (
      SELECT 1 FROM app.ropa_derived_gaps(p_organization_id) d
      WHERE d.gap_code = g.gap_code AND d.ropa_record_id IS NOT DISTINCT FROM g.ropa_record_id
    )
    AND NOT app.ropa_gap_has_human_work(g.organization_id, g.id);
  GET DIAGNOSTICS v_removed = ROW_COUNT;

  RETURN jsonb_build_object('opened', v_opened, 'superseded', v_superseded, 'removed', v_removed);
END;
$$;

CREATE OR REPLACE FUNCTION app.ropa_gap_counts(p_organization_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT jsonb_build_object(
    'gapCount', count(*) FILTER (WHERE g.state = 'open'),
    'critical', count(*) FILTER (WHERE g.state = 'open' AND g.severity = 'critical'),
    'high', count(*) FILTER (WHERE g.state = 'open' AND g.severity = 'high'),
    'medium', count(*) FILTER (WHERE g.state = 'open' AND g.severity = 'medium'),
    'low', count(*) FILTER (WHERE g.state = 'open' AND g.severity = 'low'),
    'supersededCount', count(*) FILTER (WHERE g.state = 'superseded')
  )
  FROM public.ropa_gaps g
  WHERE g.organization_id = p_organization_id;
$$;

REVOKE ALL ON FUNCTION app.ropa_derived_gaps(uuid), app.ropa_gap_has_human_work(uuid, uuid),
  app.refresh_ropa_gaps(uuid), app.ropa_gap_counts(uuid) FROM PUBLIC;

-- The ROPA gaps' only user-reachable write path. One id and nothing else:
-- every row is derived in SQL from the stored records, so there is no
-- severity, priority or finding for a caller to forge.
CREATE OR REPLACE FUNCTION public.generate_ropa_gaps(p_organization_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_actor uuid := app.current_user_id();
  v_changes jsonb;
  v_counts jsonb;
BEGIN
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'Sign in to continue.' USING ERRCODE = 'TS401';
  END IF;
  IF NOT app.has_permission(p_organization_id, 'ropa.write') THEN
    RAISE EXCEPTION 'You do not have permission to generate the ROPA gaps.' USING ERRCODE = 'TS403';
  END IF;

  v_changes := app.refresh_ropa_gaps(p_organization_id);
  v_counts := app.ropa_gap_counts(p_organization_id);

  -- ONE audit row for the generation, carrying the counts — not one per gap.
  INSERT INTO public.audit_logs (organization_id, user_id, event_type, entity_type, entity_id, description, metadata)
  VALUES (
    p_organization_id, v_actor, 'ropa.gaps.generated', 'organizations', p_organization_id,
    'Generated the ROPA gaps',
    v_counts || v_changes
  );

  RETURN v_counts || v_changes;
END;
$$;

REVOKE ALL ON FUNCTION public.generate_ropa_gaps(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.generate_ropa_gaps(uuid) TO authenticated;

-- The shared action trigger, from its Slice 6 body, with ONE change: an
-- action can be moved to neither another assessment gap nor another ROPA
-- gap. The closing rule (D-056) is untouched, so a ROPA action obeys it.
CREATE OR REPLACE FUNCTION app.gap_action_before_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_actor uuid := app.current_user_id();
  v_edited boolean := (NEW.title, NEW.owner_user_id, NEW.owner_role, NEW.status, NEW.due_date, NEW.notes)
                      IS DISTINCT FROM
                      (OLD.title, OLD.owner_user_id, OLD.owner_role, OLD.status, OLD.due_date, OLD.notes);
BEGIN
  IF (NEW.organization_id, NEW.gap_id, NEW.ropa_gap_id) IS DISTINCT FROM (OLD.organization_id, OLD.gap_id, OLD.ropa_gap_id) THEN
    RAISE EXCEPTION 'An action cannot be moved to another gap.' USING ERRCODE = 'TS422';
  END IF;

  IF v_actor IS NOT NULL AND v_edited THEN
    -- RLS already filters the row out for anyone without gap.write; this is
    -- the second lock, with a message.
    IF NOT app.has_permission(NEW.organization_id, 'gap.write') THEN
      RAISE EXCEPTION 'You do not have permission to change this action.' USING ERRCODE = 'TS403';
    END IF;
    -- A closed action records how it was closed. Editing it afterwards would
    -- quietly change what was approved, so it is reopened first.
    IF OLD.status = 'closed' AND NEW.status = 'closed' THEN
      RAISE EXCEPTION 'This action is closed — reopen it to change it.' USING ERRCODE = 'TS409';
    END IF;
    -- Non-null from here on: this is what "carries human work" means (D-057).
    NEW.updated_by := v_actor;
  END IF;

  IF NEW.owner_user_id IS NOT NULL AND NEW.owner_user_id IS DISTINCT FROM OLD.owner_user_id THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.organization_users ou
      WHERE ou.organization_id = NEW.organization_id
        AND ou.user_id = NEW.owner_user_id
        AND ou.status = 'active'
    ) THEN
      RAISE EXCEPTION 'The owner must be an active member of this organisation.' USING ERRCODE = 'TS422';
    END IF;
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NOT app.gap_action_transition_allowed(OLD.status, NEW.status) THEN
      RAISE EXCEPTION 'An action that is % cannot move to %.', replace(OLD.status, '_', ' '), replace(NEW.status, '_', ' ')
        USING ERRCODE = 'TS409';
    END IF;

    IF NEW.status = 'closed' THEN
      IF NEW.owner_user_id IS NULL THEN
        RAISE EXCEPTION 'Assign an owner before closing this action.' USING ERRCODE = 'TS409';
      END IF;

      IF EXISTS (
        SELECT 1
        FROM public.evidence_links l
        JOIN public.evidence e ON e.id = l.evidence_id AND e.organization_id = l.organization_id
        WHERE l.organization_id = NEW.organization_id
          AND l.linked_entity_type = 'gap_action'
          AND l.linked_entity_id = NEW.id
          AND e.review_status IN ('adequate', 'strong')
      ) THEN
        NEW.closure_basis := 'evidence';
      ELSIF v_actor IS NOT NULL
            AND v_actor <> NEW.owner_user_id
            AND app.has_permission(NEW.organization_id, 'evidence.review') THEN
        NEW.closure_basis := 'reviewer_approval';
      ELSE
        RAISE EXCEPTION 'Closing needs reviewed evidence attached to this action, or approval by a reviewer who is not its owner.'
          USING ERRCODE = 'TS409';
      END IF;

      NEW.closed_at := now();
      NEW.closed_by := v_actor;
    ELSIF OLD.status = 'closed' THEN
      -- Reopened. The audit log keeps the closure; the row stops claiming it.
      NEW.closed_at := NULL;
      NEW.closed_by := NULL;
      NEW.closure_basis := NULL;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;


-- ===========================================================================
-- (8) Import — many records, one audit row
-- ===========================================================================
-- The route parses the file (CSV, on the server — D-063), validates every row
-- with packages/core, and sends only the valid ones here. This inserts each
-- in its own sub-transaction, so a row the DATABASE refuses (a duplicate
-- record ID, say) is reported back and never fails the file. Every record
-- arrives as a Draft, derived by the same trigger as a hand-made one.
--
-- One audit row per import carrying the counts — never one per record. The
-- per-row trigger is told so through a transaction-local setting that only
-- this SECURITY DEFINER function sets.

CREATE OR REPLACE FUNCTION public.import_ropa_records(p_organization_id uuid, p_rows jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_actor uuid := app.current_user_id();
  v_row jsonb;
  v_index bigint;
  v_imported integer := 0;
  v_rejected jsonb := '[]'::jsonb;
  v_ids jsonb := '[]'::jsonb;
  v_id uuid;
BEGIN
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'Sign in to continue.' USING ERRCODE = 'TS401';
  END IF;
  IF NOT app.has_permission(p_organization_id, 'ropa.write') THEN
    RAISE EXCEPTION 'You do not have permission to import processing records.' USING ERRCODE = 'TS403';
  END IF;
  IF jsonb_typeof(p_rows) <> 'array' THEN
    RAISE EXCEPTION 'Rows must be a list.' USING ERRCODE = 'TS422';
  END IF;
  IF jsonb_array_length(p_rows) > 2000 THEN
    RAISE EXCEPTION 'An import is at most 2,000 records.' USING ERRCODE = 'TS422';
  END IF;

  PERFORM set_config('app.ropa_bulk_import', 'on', true);

  FOR v_row, v_index IN SELECT r.value, r.ordinality FROM jsonb_array_elements(p_rows) WITH ORDINALITY AS r(value, ordinality) LOOP
    BEGIN
      INSERT INTO public.ropa_records (
        organization_id, record_code, name, description, department_id, department_text,
        data_principal_types, data_categories, estimated_data_principals, purpose, legal_basis_note,
        collection_source, systems_text, vendors_text, sharing, retention_rule, security_safeguards,
        notice_linked, consent_linked, rights_workflow, grievance_linked, children_data, cross_border,
        ai_processing, high_risk_documents, evidence_note, risk_rating_assessor, last_reviewed_at,
        next_review_at
      ) VALUES (
        p_organization_id,
        NULLIF(v_row ->> 'record_code', ''),
        v_row ->> 'name',
        v_row ->> 'description',
        (v_row ->> 'department_id')::uuid,
        v_row ->> 'department_text',
        v_row ->> 'data_principal_types',
        v_row ->> 'data_categories',
        (v_row ->> 'estimated_data_principals')::integer,
        v_row ->> 'purpose',
        v_row ->> 'legal_basis_note',
        v_row ->> 'collection_source',
        v_row ->> 'systems_text',
        v_row ->> 'vendors_text',
        v_row ->> 'sharing',
        v_row ->> 'retention_rule',
        v_row ->> 'security_safeguards',
        v_row ->> 'notice_linked',
        v_row ->> 'consent_linked',
        v_row ->> 'rights_workflow',
        v_row ->> 'grievance_linked',
        COALESCE(v_row ->> 'children_data', 'unknown'),
        COALESCE(v_row ->> 'cross_border', 'unknown'),
        COALESCE(v_row ->> 'ai_processing', 'unknown'),
        COALESCE(v_row ->> 'high_risk_documents', 'unknown'),
        v_row ->> 'evidence_note',
        v_row ->> 'risk_rating_assessor',
        (v_row ->> 'last_reviewed_at')::date,
        (v_row ->> 'next_review_at')::date
      )
      RETURNING id INTO v_id;
      v_imported := v_imported + 1;
      v_ids := v_ids || to_jsonb(v_id);
    EXCEPTION
      WHEN unique_violation THEN
        v_rejected := v_rejected || jsonb_build_object('row', COALESCE((v_row ->> 'row')::bigint, v_index),
          'errors', jsonb_build_array(jsonb_build_object('field', 'recordCode',
            'issue', 'A record with this ID already exists in the register.')));
      WHEN check_violation OR foreign_key_violation OR invalid_text_representation OR numeric_value_out_of_range
           OR invalid_datetime_format OR datetime_field_overflow THEN
        v_rejected := v_rejected || jsonb_build_object('row', COALESCE((v_row ->> 'row')::bigint, v_index),
          'errors', jsonb_build_array(jsonb_build_object('field', 'row',
            'issue', 'A value is outside what the register accepts.')));
      WHEN SQLSTATE 'TS422' THEN
        v_rejected := v_rejected || jsonb_build_object('row', COALESCE((v_row ->> 'row')::bigint, v_index),
          'errors', jsonb_build_array(jsonb_build_object('field', 'row', 'issue', SQLERRM)));
    END;
  END LOOP;

  PERFORM set_config('app.ropa_bulk_import', 'off', true);

  INSERT INTO public.audit_logs (organization_id, user_id, event_type, entity_type, entity_id, description, metadata)
  VALUES (
    p_organization_id, v_actor, 'ropa.records.imported', 'organizations', p_organization_id,
    'Imported processing records',
    jsonb_build_object('imported', v_imported, 'rejected', jsonb_array_length(v_rejected),
      'submitted', jsonb_array_length(p_rows))
  );

  RETURN jsonb_build_object('imported', v_imported, 'ids', v_ids, 'rejected', v_rejected);
END;
$$;

REVOKE ALL ON FUNCTION public.import_ropa_records(uuid, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.import_ropa_records(uuid, jsonb) TO authenticated;


-- ===========================================================================
-- (9) Audit (D-027)
-- ===========================================================================
-- Every USER write to a record and its links is audited by trigger in the
-- same transaction (`ropa.<table>.<op>`). The metadata gains the record's
-- code, status, completeness and risk — and still NO free text: the
-- activity's name, purpose and every other text field never enter the log.
-- A re-derivation alone (a link counted, a score moved) is not an event: the
-- derived columns are left out of `changed`, so an update that changes only
-- them writes nothing. An import writes ONE row, from its RPC.

CREATE OR REPLACE FUNCTION app.audit_scope_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_actor uuid := app.current_user_id();
  v_new jsonb := CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE to_jsonb(NEW) END;
  v_old jsonb := CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE to_jsonb(OLD) END;
  v_row jsonb := COALESCE(v_new, v_old);
  v_prefix text := CASE WHEN TG_NARGS > 0 THEN TG_ARGV[0] ELSE 'scope' END;
  v_org uuid;
  v_entity uuid;
  v_changed jsonb;
BEGIN
  IF v_actor IS NULL THEN
    RETURN NULL;
  END IF;
  -- Slice 7: an import is audited once, by its RPC, with the counts.
  IF TG_TABLE_NAME = 'ropa_records' AND current_setting('app.ropa_bulk_import', true) = 'on' THEN
    RETURN NULL;
  END IF;

  IF TG_TABLE_NAME = 'organizations' THEN
    v_org := (v_row ->> 'id')::uuid;
    v_entity := v_org;
  ELSE
    v_org := (v_row ->> 'organization_id')::uuid;
    v_entity := COALESCE(v_row ->> 'id', v_row ->> 'ropa_record_id', v_row ->> 'vendor_id', v_row ->> 'organization_id')::uuid;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    SELECT COALESCE(jsonb_agg(n.key ORDER BY n.key), '[]'::jsonb) INTO v_changed
    FROM jsonb_each(v_new) n
    WHERE n.key NOT IN ('updated_at', 'derived_at', 'generated_at', 'updated_by',
                        -- Slice 7: derived by the database, never an edit
                        'completeness_score', 'completeness_band', 'completeness_missing', 'risk_factors',
                        'risk_points', 'risk_rating_derived', 'risk_rating', 'system_link_count',
                        'vendor_link_count', 'evidence_count')
      AND (v_old -> n.key) IS DISTINCT FROM n.value;
    IF v_changed = '[]'::jsonb THEN
      RETURN NULL; -- a no-op save is not an event
    END IF;
  END IF;

  INSERT INTO public.audit_logs (organization_id, user_id, event_type, entity_type, entity_id, description, metadata)
  VALUES (
    v_org, v_actor,
    v_prefix || '.' || TG_TABLE_NAME || '.' || lower(TG_OP),
    TG_TABLE_NAME, v_entity,
    initcap(lower(TG_OP)) || ' ' || replace(TG_TABLE_NAME, '_', ' '),
    jsonb_strip_nulls(jsonb_build_object(
      -- A processing activity's name is free text: never logged (Slice 7).
      'name', CASE WHEN TG_TABLE_NAME <> 'ropa_records' THEN COALESCE(v_row ->> 'name', v_row ->> 'label') END,
      'changed', v_changed,
      'systemId', v_row ->> 'system_id',
      -- Slice 4
      'assessmentId', v_row ->> 'assessment_id',
      'questionCode', v_row ->> 'question_code',
      'applicabilityDecision', v_row ->> 'applicability_decision',
      'claimedMaturity', (v_row -> 'claimed_maturity'),
      'evidenceLevel', (v_row -> 'evidence_level'),
      'adjustedScore', (v_row -> 'adjusted_score'),
      'reviewStatus', v_row ->> 'review_status',
      'fileName', v_row ->> 'file_name',
      'evidenceId', v_row ->> 'evidence_id',
      'linkedEntityType', v_row ->> 'linked_entity_type',
      'linkedEntityId', v_row ->> 'linked_entity_id',
      -- Slice 6
      'gapId', v_row ->> 'gap_id',
      'actionStatus', CASE WHEN TG_TABLE_NAME = 'gap_actions' THEN v_row ->> 'status' END,
      'ownerUserId', v_row ->> 'owner_user_id',
      'dueDate', v_row ->> 'due_date',
      'closureBasis', v_row ->> 'closure_basis',
      -- Slice 7
      'ropaGapId', v_row ->> 'ropa_gap_id',
      'ropaRecordId', v_row ->> 'ropa_record_id',
      'vendorId', CASE WHEN TG_TABLE_NAME = 'ropa_vendors' THEN v_row ->> 'vendor_id' END,
      'recordCode', v_row ->> 'record_code',
      'recordStatus', CASE WHEN TG_TABLE_NAME = 'ropa_records' THEN v_row ->> 'status' END,
      'version', CASE WHEN TG_TABLE_NAME = 'ropa_records' THEN v_row -> 'version' END,
      'completenessScore', (v_row -> 'completeness_score'),
      'riskRating', v_row ->> 'risk_rating'
    ))
  );
  RETURN NULL;
END;
$$;

CREATE TRIGGER ropa_records_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.ropa_records
  FOR EACH ROW EXECUTE FUNCTION app.audit_scope_change('ropa');
CREATE TRIGGER ropa_systems_audit
  AFTER INSERT OR DELETE ON public.ropa_systems
  FOR EACH ROW EXECUTE FUNCTION app.audit_scope_change('ropa');
CREATE TRIGGER ropa_vendors_audit
  AFTER INSERT OR DELETE ON public.ropa_vendors
  FOR EACH ROW EXECUTE FUNCTION app.audit_scope_change('ropa');


-- ===========================================================================
-- (10) Grants + RLS (D-019, D-027)
-- ===========================================================================

REVOKE ALL ON public.ropa_records, public.ropa_systems, public.ropa_vendors, public.ropa_gaps FROM anon, authenticated;

-- A record is written by people — these columns and no others. No grant on
-- any derived or stamped column (scores, risk, counts, version, approval,
-- created_by, updated_by), and no DELETE: a record is archived, never removed.
GRANT SELECT ON public.ropa_records TO authenticated;
GRANT INSERT (
  organization_id, record_code, name, description, department_id, department_text, owner_user_id,
  data_principal_types, data_categories, estimated_data_principals, purpose, legal_basis_note,
  collection_source, systems_text, vendors_text, sharing, retention_rule, security_safeguards,
  notice_linked, consent_linked, rights_workflow, grievance_linked, children_data, cross_border,
  ai_processing, high_risk_documents, evidence_note, risk_rating_assessor, last_reviewed_at, next_review_at
) ON public.ropa_records TO authenticated;
GRANT UPDATE (
  name, description, department_id, department_text, owner_user_id,
  data_principal_types, data_categories, estimated_data_principals, purpose, legal_basis_note,
  collection_source, systems_text, vendors_text, sharing, retention_rule, security_safeguards,
  notice_linked, consent_linked, rights_workflow, grievance_linked, children_data, cross_border,
  ai_processing, high_risk_documents, evidence_note, risk_rating_assessor, last_reviewed_at, next_review_at,
  status
) ON public.ropa_records TO authenticated;

GRANT SELECT, INSERT, DELETE ON public.ropa_systems, public.ropa_vendors TO authenticated;

-- SELECT only: a ROPA gap is derived. The generator is SECURITY DEFINER.
GRANT SELECT ON public.ropa_gaps TO authenticated;

ALTER TABLE public.ropa_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ropa_systems ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ropa_vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ropa_gaps ENABLE ROW LEVEL SECURITY;

CREATE POLICY ropa_records_select_member ON public.ropa_records
  FOR SELECT TO authenticated
  USING (
    organization_id IN (SELECT app.current_user_organization_ids())
    AND app.has_permission(organization_id, 'ropa.read')
  );
CREATE POLICY ropa_records_insert_writer ON public.ropa_records
  FOR INSERT TO authenticated
  WITH CHECK (
    organization_id IN (SELECT app.current_user_organization_ids())
    AND app.has_permission(organization_id, 'ropa.write')
  );
CREATE POLICY ropa_records_update_writer ON public.ropa_records
  FOR UPDATE TO authenticated
  USING (
    organization_id IN (SELECT app.current_user_organization_ids())
    AND app.has_permission(organization_id, 'ropa.write')
  )
  WITH CHECK (
    organization_id IN (SELECT app.current_user_organization_ids())
    AND app.has_permission(organization_id, 'ropa.write')
  );

CREATE POLICY ropa_systems_select_member ON public.ropa_systems
  FOR SELECT TO authenticated
  USING (
    organization_id IN (SELECT app.current_user_organization_ids())
    AND app.has_permission(organization_id, 'ropa.read')
  );
CREATE POLICY ropa_systems_insert_writer ON public.ropa_systems
  FOR INSERT TO authenticated
  WITH CHECK (
    organization_id IN (SELECT app.current_user_organization_ids())
    AND app.has_permission(organization_id, 'ropa.write')
  );
CREATE POLICY ropa_systems_delete_writer ON public.ropa_systems
  FOR DELETE TO authenticated
  USING (
    organization_id IN (SELECT app.current_user_organization_ids())
    AND app.has_permission(organization_id, 'ropa.write')
  );

CREATE POLICY ropa_vendors_select_member ON public.ropa_vendors
  FOR SELECT TO authenticated
  USING (
    organization_id IN (SELECT app.current_user_organization_ids())
    AND app.has_permission(organization_id, 'ropa.read')
  );
CREATE POLICY ropa_vendors_insert_writer ON public.ropa_vendors
  FOR INSERT TO authenticated
  WITH CHECK (
    organization_id IN (SELECT app.current_user_organization_ids())
    AND app.has_permission(organization_id, 'ropa.write')
  );
CREATE POLICY ropa_vendors_delete_writer ON public.ropa_vendors
  FOR DELETE TO authenticated
  USING (
    organization_id IN (SELECT app.current_user_organization_ids())
    AND app.has_permission(organization_id, 'ropa.write')
  );

CREATE POLICY ropa_gaps_select_member ON public.ropa_gaps
  FOR SELECT TO authenticated
  USING (
    organization_id IN (SELECT app.current_user_organization_ids())
    AND app.has_permission(organization_id, 'ropa.read')
  );


-- ===========================================================================
-- (11) Apply-time assertions
-- ===========================================================================

DO $$
BEGIN
  -- The thirteen weights total exactly 100 (the D-036 invariant, on a new table).
  ASSERT (SELECT sum(app.ropa_area_weight(a)) FROM unnest(app.ropa_area_codes()) a) = 100,
    'ROPA completeness weights total 100';
  ASSERT array_length(app.ropa_area_codes(), 1) = 13, 'thirteen completeness areas';
  ASSERT (SELECT bool_and(app.ropa_area_weight(a) IS NOT NULL) FROM unnest(app.ropa_area_codes()) a),
    'every area has a weight';

  -- The bands, at every boundary — each belongs to the LOWER band.
  ASSERT app.ropa_band(30) = 'incomplete' AND app.ropa_band(31) = 'basic', '30/31';
  ASSERT app.ropa_band(60) = 'basic' AND app.ropa_band(61) = 'usable', '60/61';
  ASSERT app.ropa_band(80) = 'usable' AND app.ropa_band(81) = 'strong', '80/81';
  ASSERT app.ropa_approval_min_score() = 61 AND app.ropa_band(app.ropa_approval_min_score()) = 'usable',
    'approval needs Usable';

  -- Unknown and "to be legally reviewed" are NOT complete (D-026).
  ASSERT NOT app.ropa_text_complete('Unknown'), 'unknown is not complete';
  ASSERT NOT app.ropa_text_complete('To be legally reviewed'), 'awaiting legal review is not complete';
  ASSERT NOT app.ropa_text_complete('Define retention for chat logs'), 'a to-do is not a rule';
  ASSERT app.ropa_text_complete('As per academic/legal retention schedule'), 'a rule is complete';

  -- Risk: the boundaries, and an assessor can only raise.
  ASSERT app.ropa_risk_rating(2) = 'low' AND app.ropa_risk_rating(3) = 'medium', '2/3';
  ASSERT app.ropa_risk_rating(5) = 'medium' AND app.ropa_risk_rating(6) = 'high', '5/6';
  ASSERT app.ropa_risk_rating(8) = 'high' AND app.ropa_risk_rating(9) = 'critical', '8/9';
  ASSERT app.ropa_effective_risk('high', 'medium') = 'high', 'an assessor never lowers';
  ASSERT app.ropa_effective_risk('medium', 'critical') = 'critical', 'an assessor may raise';

  -- The lifecycle.
  ASSERT app.ropa_transition_allowed('in_review', 'approved'), 'review → approved';
  ASSERT NOT app.ropa_transition_allowed('draft', 'approved'), 'never approved straight from draft';
  ASSERT app.ropa_transition_allowed('approved', 'draft'), 'an approved record can be reopened';

  -- Twelve gap rules, each with a severity, and none of them a question's.
  ASSERT (SELECT count(*) FROM app.ropa_gap_rules()) = 12, 'twelve ROPA gap rules';
  ASSERT app.ropa_gap_severity('no_records') = 'critical', 'an empty register is critical';
END;
$$;
