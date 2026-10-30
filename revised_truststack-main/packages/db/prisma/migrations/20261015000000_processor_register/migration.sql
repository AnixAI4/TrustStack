-- Slice 10, Stage 4a — the processor register: the contract as evidence, the
-- questionnaire entered by staff with its accuracy controls, and exposure
-- model 1.4.0 (SLICE_10 §6, §7b; D-079.6; D-089).
--
-- DPDP anchoring (the Act and the Gazette text, G.S.R. 846(E)):
--   * s.8(2): a Data Fiduciary may engage a Data Processor "only under a
--     valid contract".
--   * s.8(5), Rule 6(1)(f): reasonable security safeguards include an
--     "appropriate provision in the contract" between the Data Fiduciary and
--     the Data Processor "for taking reasonable security safeguards".
--
-- What is enforced HERE, not only in the application (4a.4, required — D-089):
--   * COMPLETE — an assessment is submitted only when every scored question is
--     answered or marked "not applicable" with a reason; `submit_vendor_assessment`
--     refuses anything less. A draft may be partial.
--   * EVIDENCE-BACKED — an answer that claims a control a document must back
--     (A3, A4, C4, D2, G1) scores as the risky answer until one of the
--     vendor's documents (`evidence_links` type `vendor`) is cited on it, still
--     stored and not rejected or outdated in review. The score is derived here.
--   * REVIEWED BY A SECOND PERSON — only an ACCEPTED assessment counts, and
--     nobody who created, answered or submitted it may accept or return it.
--   * ATTRIBUTED — who created, answered, submitted and reviewed it, and when,
--     are stamped by these functions, never sent by a client; every step is
--     audited once, with no free text.
--   * FROZEN ONCE ACCEPTED — an accepted assessment and its answers never
--     change, for anyone; a correction is a new version.
--   * CURRENT — an accepted assessment carries a review-by date (twelve months
--     by default — a TrustStack default, never statute).
--   The consistency checks against the register are flags for the reviewer
--   (packages/core VENDOR_CONSISTENCY_RULES): they decide nothing, so they
--   are not here.
--
-- Every write is a SECURITY DEFINER function that checks the caller's
-- permission itself; users hold SELECT only on the two new tables.
--
-- The exposure model moves to 1.4.0 in this same migration — the processor
-- register's rows on heads 1 and 7 — mirrored in packages/core/src/exposure.ts
-- and held together by tests/unit/exposure-mirror.test.ts and
-- tests/rls/exposure-mirror.test.ts.
--
-- Additive: two permissions, two columns on `vendors`, two new tables, new
-- functions, the evidence link CHECK widened (every existing row satisfies
-- it), functions replaced in place. Nothing a live user holds is revoked.
--
-- Layout: (1) permissions; (2) DDL; (3) the questionnaire as data, and row
-- invariants; (4) triggers; (5) the score; (6) the staff functions; (7) the
-- vendor's documents (`evidence_links` type `vendor`); (8) grants + RLS;
-- (9) exposure model 1.4.0; (10) apply-time assertions.


-- ===========================================================================
-- (1) Permissions — a matrix change is core + a migration in one PR (D-020)
-- ===========================================================================

INSERT INTO public.permissions (code, description) VALUES
  ('vendor.assess', 'Enter and submit a processor assessment — the answers, where they came from and the documents behind them.'),
  ('vendor.review', 'Accept or return a processor assessment someone else entered: only an accepted assessment counts.');

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM (VALUES ('super_admin'), ('consultant'), ('organization_admin'), ('dpdp_owner'), ('department_owner'), ('legal_user'), ('it_security_user'), ('procurement_user')) AS g(role_code)
JOIN public.roles r ON r.code = g.role_code
JOIN public.permissions p ON p.code = 'vendor.assess';

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM (VALUES ('super_admin'), ('consultant'), ('organization_admin'), ('dpdp_owner'), ('legal_user'), ('procurement_user')) AS g(role_code)
JOIN public.roles r ON r.code = g.role_code
JOIN public.permissions p ON p.code = 'vendor.review';


-- ===========================================================================
-- (2) DDL
-- ===========================================================================

-- AlterTable — the contract's dates. Whether a contract exists and carries
-- DPDP clauses stay the register's tri-states, which the model reads; the
-- contract itself is a document (§7), never a URL.
ALTER TABLE "vendors" ADD COLUMN "contract_signed_on" DATE;
ALTER TABLE "vendors" ADD COLUMN "contract_review_by" DATE;

-- CreateTable — one version of one vendor's assessment.
CREATE TABLE "vendor_assessments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "vendor_id" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "source" TEXT NOT NULL DEFAULT 'staff',
    "source_note" TEXT,
    "risk_score" INTEGER,
    "risk_tier" TEXT,
    "unevidenced" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "review_by" DATE,
    "return_reason" TEXT,
    "created_by" UUID,
    "submitted_by" UUID,
    "submitted_at" TIMESTAMPTZ(6),
    "reviewed_by" UUID,
    "reviewed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vendor_assessments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "vendor_assessments_organization_id_idx" ON "vendor_assessments"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "vendor_assessments_organization_id_id_key" ON "vendor_assessments"("organization_id", "id");

-- CreateIndex — versions are numbered per vendor.
CREATE UNIQUE INDEX "vendor_assessments_organization_id_vendor_id_version_key" ON "vendor_assessments"("organization_id", "vendor_id", "version");

-- CreateIndex — one assessment open (not yet accepted) per vendor at a time.
CREATE UNIQUE INDEX "vendor_assessments_one_open" ON "vendor_assessments"("organization_id", "vendor_id") WHERE status <> 'accepted';

-- AddForeignKey
ALTER TABLE "vendor_assessments" ADD CONSTRAINT "vendor_assessments_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey — composite: an assessment is of a vendor of its own
-- organisation; a vendor with an assessment on record cannot be deleted.
ALTER TABLE "vendor_assessments" ADD CONSTRAINT "vendor_assessments_organization_id_vendor_id_fkey" FOREIGN KEY ("organization_id", "vendor_id") REFERENCES "vendors"("organization_id", "id") ON DELETE NO ACTION ON UPDATE CASCADE;
ALTER TABLE "vendor_assessments" ADD CONSTRAINT "vendor_assessments_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "vendor_assessments" ADD CONSTRAINT "vendor_assessments_submitted_by_fkey" FOREIGN KEY ("submitted_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "vendor_assessments" ADD CONSTRAINT "vendor_assessments_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable — one answer in one assessment.
CREATE TABLE "vendor_assessment_answers" (
    "organization_id" UUID NOT NULL,
    "assessment_id" UUID NOT NULL,
    "question_code" TEXT NOT NULL,
    "answer" TEXT,
    "not_applicable" BOOLEAN NOT NULL DEFAULT false,
    "na_reason" TEXT,
    "evidence_id" UUID,
    "answered_by" UUID,
    "answered_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vendor_assessment_answers_pkey" PRIMARY KEY ("assessment_id", "question_code")
);

-- CreateIndex
CREATE INDEX "vendor_assessment_answers_organization_id_idx" ON "vendor_assessment_answers"("organization_id");

-- CreateIndex
CREATE INDEX "vendor_assessment_answers_evidence_id_idx" ON "vendor_assessment_answers"("evidence_id");

-- AddForeignKey — composite: an answer belongs to an assessment of its own organisation.
ALTER TABLE "vendor_assessment_answers" ADD CONSTRAINT "vendor_assessment_answers_organization_id_assessment_id_fkey" FOREIGN KEY ("organization_id", "assessment_id") REFERENCES "vendor_assessments"("organization_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey — composite: the document cited is the organisation's own.
-- Checked at commit: an organisation's deletion reaches its evidence and its
-- answers by different cascades, in no fixed order. No user deletes evidence.
ALTER TABLE "vendor_assessment_answers" ADD CONSTRAINT "vendor_assessment_answers_organization_id_evidence_id_fkey" FOREIGN KEY ("organization_id", "evidence_id") REFERENCES "evidence"("organization_id", "id") ON DELETE NO ACTION ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE "vendor_assessment_answers" ADD CONSTRAINT "vendor_assessment_answers_answered_by_fkey" FOREIGN KEY ("answered_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- ===========================================================================
-- (3) The questionnaire as data (mirror packages/core/src/vendors.ts), and
--     row invariants
-- ===========================================================================

-- core VENDOR_QUESTIONS: code, section, type, weight, risky answer, each
-- option's risk in whole tenths, and whether a document must back a "yes".
-- The wording lives in core; the database needs only what it checks and scores.
CREATE OR REPLACE FUNCTION app.vendor_questions()
RETURNS TABLE (ord integer, code text, section text, type text, weight integer, risky_answer text, options jsonb, needs_document boolean)
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = ''
AS $$
  VALUES
    (1, 'A1', 'company', 'text', 0, NULL::text, NULL::jsonb, false),
    (2, 'A2', 'company', 'select', 1, NULL::text, '[{"value":"lt2","riskTenths":10},{"value":"2to5","riskTenths":5},{"value":"gt5","riskTenths":0}]'::jsonb, false),
    (3, 'A3', 'company', 'yes_no', 3, 'no', NULL::jsonb, true),
    (4, 'A4', 'company', 'yes_no_partial', 2, 'no', NULL::jsonb, true),
    (5, 'A5', 'company', 'yes_no', 2, 'no', NULL::jsonb, false),
    (6, 'A6', 'company', 'yes_no', 2, 'no', NULL::jsonb, false),
    (7, 'B1', 'data_handling', 'select', 2, NULL::text, '[{"value":"lt1k","riskTenths":0},{"value":"1kto100k","riskTenths":4},{"value":"100kto1m","riskTenths":7},{"value":"gt1m","riskTenths":10}]'::jsonb, false),
    (8, 'B2', 'data_handling', 'yes_no', 3, 'yes', NULL::jsonb, false),
    (9, 'B3', 'data_handling', 'yes_no', 2, 'no', NULL::jsonb, false),
    (10, 'B4', 'data_handling', 'yes_no_partial', 2, 'no', NULL::jsonb, false),
    (11, 'B5', 'data_handling', 'yes_no', 3, 'yes', NULL::jsonb, false),
    (12, 'B6', 'data_handling', 'yes_no_partial', 1, 'no', NULL::jsonb, false),
    (13, 'B7', 'data_handling', 'yes_no', 2, 'no', NULL::jsonb, false),
    (14, 'C1', 'security', 'yes_no', 3, 'no', NULL::jsonb, false),
    (15, 'C2', 'security', 'yes_no', 3, 'no', NULL::jsonb, false),
    (16, 'C3', 'security', 'yes_no', 2, 'no', NULL::jsonb, false),
    (17, 'C4', 'security', 'yes_no_partial', 2, 'no', NULL::jsonb, true),
    (18, 'C5', 'security', 'yes_no_partial', 2, 'no', NULL::jsonb, false),
    (19, 'C6', 'security', 'yes_no', 2, 'no', NULL::jsonb, false),
    (20, 'C7', 'security', 'yes_no', 2, 'no', NULL::jsonb, false),
    (21, 'C8', 'security', 'yes_no_partial', 1, 'no', NULL::jsonb, false),
    (22, 'D1', 'subprocessors', 'yes_no', 2, 'yes', NULL::jsonb, false),
    (23, 'D2', 'subprocessors', 'yes_no_partial', 2, 'no', NULL::jsonb, true),
    (24, 'D3', 'subprocessors', 'yes_no', 3, 'no', NULL::jsonb, false),
    (25, 'D4', 'subprocessors', 'yes_no', 2, 'no', NULL::jsonb, false),
    (26, 'D5', 'subprocessors', 'yes_no_partial', 1, 'no', NULL::jsonb, false),
    (27, 'D6', 'subprocessors', 'yes_no', 2, 'yes', NULL::jsonb, false),
    (28, 'E1', 'residency', 'yes_no', 3, 'no', NULL::jsonb, false),
    (29, 'E2', 'residency', 'select', 2, NULL::text, '[{"value":"india","riskTenths":0},{"value":"apac","riskTenths":5},{"value":"eu","riskTenths":6},{"value":"us","riskTenths":8},{"value":"global","riskTenths":10}]'::jsonb, false),
    (30, 'E3', 'residency', 'yes_no', 2, 'yes', NULL::jsonb, false),
    (31, 'E4', 'residency', 'yes_no_partial', 2, 'no', NULL::jsonb, false),
    (32, 'E5', 'residency', 'yes_no', 1, 'no', NULL::jsonb, false),
    (33, 'E6', 'residency', 'yes_no_partial', 1, 'no', NULL::jsonb, false),
    (34, 'F1', 'incident', 'yes_no', 3, 'no', NULL::jsonb, false),
    (35, 'F2', 'incident', 'select', 3, NULL::text, '[{"value":"le24","riskTenths":0},{"value":"le48","riskTenths":2},{"value":"le72","riskTenths":4},{"value":"gt72","riskTenths":10}]'::jsonb, false),
    (36, 'F3', 'incident', 'yes_no', 2, 'no', NULL::jsonb, false),
    (37, 'F4', 'incident', 'yes_no', 3, 'yes', NULL::jsonb, false),
    (38, 'F5', 'incident', 'yes_no_partial', 2, 'no', NULL::jsonb, false),
    (39, 'F6', 'incident', 'yes_no_partial', 1, 'no', NULL::jsonb, false),
    (40, 'G1', 'dpdp', 'yes_no', 3, 'no', NULL::jsonb, true),
    (41, 'G2', 'dpdp', 'yes_no', 3, 'no', NULL::jsonb, false),
    (42, 'G3', 'dpdp', 'yes_no', 3, 'no', NULL::jsonb, false),
    (43, 'G4', 'dpdp', 'yes_no', 2, 'no', NULL::jsonb, false),
    (44, 'G5', 'dpdp', 'yes_no_partial', 2, 'no', NULL::jsonb, false),
    (45, 'G6', 'dpdp', 'yes_no', 2, 'no', NULL::jsonb, false);
$$;

-- core VENDOR_REVIEW_MONTHS (the default) and VENDOR_REVIEW_MAX_MONTHS — a
-- TrustStack default, never statute.
CREATE OR REPLACE FUNCTION app.vendor_review_months()
RETURNS TABLE (default_months integer, max_months integer)
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = ''
AS $$
  VALUES (12, 36);
$$;

-- core `answerProblem`, as a yes/no: the question exists; "not applicable"
-- carries no answer, a reason, and only on a scored question; an answer is
-- one of the question's own (or text, at most 500 characters).
CREATE OR REPLACE FUNCTION app.vendor_answer_valid(p_code text, p_answer text, p_not_applicable boolean, p_na_reason text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = ''
AS $$
  SELECT COALESCE((
    SELECT CASE
      WHEN p_not_applicable THEN
        q.weight > 0 AND p_answer IS NULL AND p_na_reason IS NOT NULL AND btrim(p_na_reason) <> '' AND char_length(p_na_reason) <= 500
      WHEN p_answer IS NULL OR btrim(p_answer) = '' OR p_na_reason IS NOT NULL THEN false
      WHEN q.type = 'yes_no' THEN p_answer IN ('yes', 'no')
      WHEN q.type = 'yes_no_partial' THEN p_answer IN ('yes', 'no', 'partial')
      WHEN q.type = 'select' THEN EXISTS (SELECT 1 FROM jsonb_array_elements(q.options) o WHERE o ->> 'value' = p_answer)
      ELSE char_length(p_answer) <= 500
    END
    FROM app.vendor_questions() q
    WHERE q.code = p_code), false);
$$;

REVOKE ALL ON FUNCTION app.vendor_questions(), app.vendor_review_months(), app.vendor_answer_valid(text, text, boolean, text) FROM PUBLIC;

ALTER TABLE public.vendors
  ADD CONSTRAINT vendors_contract_dates_check
    CHECK (contract_review_by IS NULL OR contract_signed_on IS NULL OR contract_review_by > contract_signed_on);

ALTER TABLE public.vendor_assessments
  ADD CONSTRAINT vendor_assessments_status_check CHECK (status IN ('draft', 'submitted', 'returned', 'accepted')),
  -- Stage 4b adds 'vendor' — a source, not a second table.
  ADD CONSTRAINT vendor_assessments_source_check CHECK (source IN ('staff')),
  ADD CONSTRAINT vendor_assessments_version_check CHECK (version >= 1),
  ADD CONSTRAINT vendor_assessments_risk_check CHECK (
    (risk_score IS NULL AND risk_tier IS NULL)
    OR (risk_score BETWEEN 0 AND 100 AND risk_tier = CASE WHEN risk_score <= 25 THEN 'low' WHEN risk_score <= 50 THEN 'medium'
                                                       WHEN risk_score <= 75 THEN 'high' ELSE 'critical' END)),
  ADD CONSTRAINT vendor_assessments_text_lengths CHECK (
    (source_note IS NULL OR (btrim(source_note) <> '' AND char_length(source_note) <= 300))
    AND (return_reason IS NULL OR (btrim(return_reason) <> '' AND char_length(return_reason) <= 1000))),
  -- Attributed: a submitted assessment says where its answers came from, and was submitted.
  ADD CONSTRAINT vendor_assessments_submitted_complete CHECK (
    status = 'draft' OR (source_note IS NOT NULL AND submitted_at IS NOT NULL AND risk_score IS NOT NULL)),
  ADD CONSTRAINT vendor_assessments_returned_has_reason CHECK (status <> 'returned' OR (return_reason IS NOT NULL AND reviewed_at IS NOT NULL)),
  -- Current: an accepted assessment carries its review-by date.
  ADD CONSTRAINT vendor_assessments_accepted_complete CHECK (status <> 'accepted' OR (reviewed_at IS NOT NULL AND review_by IS NOT NULL));

ALTER TABLE public.vendor_assessment_answers
  ADD CONSTRAINT vendor_assessment_answers_valid CHECK (app.vendor_answer_valid(question_code, answer, not_applicable, na_reason)),
  ADD CONSTRAINT vendor_assessment_answers_evidence_needs_answer CHECK (evidence_id IS NULL OR NOT not_applicable);

CREATE TRIGGER vendor_assessments_touch_updated_at BEFORE UPDATE ON public.vendor_assessments
  FOR EACH ROW EXECUTE FUNCTION app.touch_updated_at();


-- ===========================================================================
-- (4) Triggers — frozen once accepted, for everyone
-- ===========================================================================
-- Users write only through the functions in (6). These hold for tooling too:
-- an accepted assessment and its answers never change, and only a draft or a
-- returned assessment is ever deleted — except by its organisation's deletion.

CREATE OR REPLACE FUNCTION app.vendor_assessment_guard()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF OLD.status = 'accepted' THEN
      RAISE EXCEPTION 'An accepted assessment never changes — start a new version.' USING ERRCODE = 'TS409';
    END IF;
    IF NEW.organization_id IS DISTINCT FROM OLD.organization_id OR NEW.vendor_id IS DISTINCT FROM OLD.vendor_id
       OR NEW.version IS DISTINCT FROM OLD.version OR NEW.created_by IS DISTINCT FROM OLD.created_by THEN
      RAISE EXCEPTION 'An assessment''s vendor, version and creator never change.' USING ERRCODE = 'TS409';
    END IF;
    RETURN NEW;
  END IF;
  -- DELETE. The organisation's own deletion removes everything; otherwise
  -- only what was never submitted, or was returned, may go.
  IF NOT EXISTS (SELECT 1 FROM public.organizations o WHERE o.id = OLD.organization_id) THEN
    RETURN OLD;
  END IF;
  IF OLD.status NOT IN ('draft', 'returned') THEN
    RAISE EXCEPTION 'A submitted or accepted assessment is never deleted.' USING ERRCODE = 'TS409';
  END IF;
  RETURN OLD;
END;
$$;

CREATE TRIGGER vendor_assessments_guard
  BEFORE UPDATE OR DELETE ON public.vendor_assessments
  FOR EACH ROW EXECUTE FUNCTION app.vendor_assessment_guard();

-- An answer changes only while its assessment is a draft or returned; a
-- cited document must be attached to the assessment's vendor.
CREATE OR REPLACE FUNCTION app.vendor_answer_guard()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_row public.vendor_assessment_answers;
  v_assessment public.vendor_assessments;
BEGIN
  IF TG_OP = 'DELETE' THEN v_row := OLD; ELSE v_row := NEW; END IF;
  -- The organisation's own deletion removes everything, in whatever order its
  -- cascades reach the answers.
  IF TG_OP = 'DELETE' AND NOT EXISTS (SELECT 1 FROM public.organizations o WHERE o.id = OLD.organization_id) THEN
    RETURN OLD;
  END IF;
  SELECT * INTO v_assessment FROM public.vendor_assessments a
  WHERE a.organization_id = v_row.organization_id AND a.id = v_row.assessment_id;
  IF NOT FOUND THEN
    -- The assessment's own deletion (a discarded draft) takes its answers with it.
    IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
    RAISE EXCEPTION 'Assessment not found.' USING ERRCODE = 'TS404';
  END IF;
  IF v_assessment.status NOT IN ('draft', 'returned') THEN
    RAISE EXCEPTION 'This assessment is % — its answers are frozen.', v_assessment.status USING ERRCODE = 'TS409';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  IF NEW.evidence_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.evidence_links l
    WHERE l.organization_id = NEW.organization_id AND l.evidence_id = NEW.evidence_id
      AND l.linked_entity_type = 'vendor' AND l.linked_entity_id = v_assessment.vendor_id) THEN
    RAISE EXCEPTION 'Cite one of this vendor''s documents — attach it to the vendor first.' USING ERRCODE = 'TS422';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER vendor_assessment_answers_guard
  BEFORE INSERT OR UPDATE OR DELETE ON public.vendor_assessment_answers
  FOR EACH ROW EXECUTE FUNCTION app.vendor_answer_guard();

REVOKE ALL ON FUNCTION app.vendor_assessment_guard(), app.vendor_answer_guard() FROM PUBLIC;


-- ===========================================================================
-- (5) The score — core `vendorRisk`, in whole numbers
-- ===========================================================================

-- Weighted risk over the scored questions ANSWERED ("not applicable" leaves the
-- denominator), as a whole percentage rounded half up. A claim a document must
-- back, with none cited (or the one cited rejected or outdated in review),
-- scores as the risky answer — and is listed, so the screen can say so.
CREATE OR REPLACE FUNCTION app.vendor_assessment_risk(p_organization_id uuid, p_assessment_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  WITH a AS (
    SELECT x.question_code, x.answer, x.not_applicable,
           x.evidence_id IS NOT NULL
             AND EXISTS (SELECT 1 FROM public.evidence_links l
                         WHERE l.organization_id = x.organization_id AND l.evidence_id = x.evidence_id
                           AND l.linked_entity_type = 'vendor' AND l.linked_entity_id = va.vendor_id)
             AND EXISTS (SELECT 1 FROM public.evidence e
                         WHERE e.organization_id = x.organization_id AND e.id = x.evidence_id
                           AND e.review_status NOT IN ('rejected', 'outdated')) AS documented
    FROM public.vendor_assessment_answers x
    JOIN public.vendor_assessments va ON va.organization_id = x.organization_id AND va.id = x.assessment_id
    WHERE x.organization_id = p_organization_id AND x.assessment_id = p_assessment_id
  ),
  s AS (
    SELECT q.ord, q.code, q.weight, a.not_applicable,
           (q.needs_document AND q.risky_answer = 'no' AND a.answer IN ('yes', 'partial') AND NOT a.documented) AS unevidenced,
           CASE
             WHEN a.not_applicable OR q.type = 'text' THEN NULL
             WHEN q.type = 'select' THEN (SELECT (o ->> 'riskTenths')::integer FROM jsonb_array_elements(q.options) o WHERE o ->> 'value' = a.answer)
             WHEN q.needs_document AND q.risky_answer = 'no' AND a.answer IN ('yes', 'partial') AND NOT a.documented THEN 10
             WHEN a.answer = 'partial' THEN 5
             WHEN a.answer = q.risky_answer THEN 10
             ELSE 0
           END AS tenths
    FROM app.vendor_questions() q
    JOIN a ON a.question_code = q.code
    WHERE q.weight > 0
  ),
  t AS (
    SELECT COALESCE(sum(s.weight * s.tenths) FILTER (WHERE s.tenths IS NOT NULL), 0) AS earned,
           COALESCE(sum(s.weight * 10) FILTER (WHERE s.tenths IS NOT NULL), 0) AS max,
           count(*) FILTER (WHERE s.tenths IS NOT NULL) AS answered,
           count(*) FILTER (WHERE s.not_applicable) AS not_applicable,
           COALESCE(array_agg(s.code ORDER BY s.ord) FILTER (WHERE s.unevidenced AND s.tenths IS NOT NULL), ARRAY[]::text[]) AS unevidenced
    FROM s
  ),
  r AS (
    SELECT t.*, CASE WHEN t.max > 0 THEN ((200 * t.earned + t.max) / (2 * t.max))::integer END AS score FROM t
  )
  SELECT jsonb_build_object(
    'score', r.score,
    'tier', CASE WHEN r.score IS NULL THEN NULL WHEN r.score <= 25 THEN 'low' WHEN r.score <= 50 THEN 'medium'
                 WHEN r.score <= 75 THEN 'high' ELSE 'critical' END,
    'answered', r.answered,
    'notApplicable', r.not_applicable,
    'unevidenced', to_jsonb(r.unevidenced))
  FROM r;
$$;

-- Scored questions with neither an answer nor a "not applicable" (core `missingAnswers`).
CREATE OR REPLACE FUNCTION app.vendor_assessment_missing(p_organization_id uuid, p_assessment_id uuid)
RETURNS text[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT COALESCE(array_agg(q.code ORDER BY q.ord), ARRAY[]::text[])
  FROM app.vendor_questions() q
  WHERE q.weight > 0
    AND NOT EXISTS (
      SELECT 1 FROM public.vendor_assessment_answers x
      WHERE x.organization_id = p_organization_id AND x.assessment_id = p_assessment_id AND x.question_code = q.code);
$$;

REVOKE ALL ON FUNCTION app.vendor_assessment_risk(uuid, uuid), app.vendor_assessment_missing(uuid, uuid) FROM PUBLIC;


-- ===========================================================================
-- (6) The staff functions — each checks the caller, stamps, and audits once
-- ===========================================================================

-- The assessment, checked to be this organisation's (a foreign id is the same
-- 404 as a missing one), locked for the rest of the transaction.
CREATE OR REPLACE FUNCTION app.vendor_assessment_for_update(p_organization_id uuid, p_assessment_id uuid)
RETURNS public.vendor_assessments
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_row public.vendor_assessments;
BEGIN
  SELECT * INTO v_row FROM public.vendor_assessments a
  WHERE a.organization_id = p_organization_id AND a.id = p_assessment_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Assessment not found.' USING ERRCODE = 'TS404';
  END IF;
  RETURN v_row;
END;
$$;

REVOKE ALL ON FUNCTION app.vendor_assessment_for_update(uuid, uuid) FROM PUBLIC;

-- Start a vendor's next version: a draft, carrying forward the answers of its
-- latest ACCEPTED version (if any) as the starting point — a correction or a
-- re-assessment is a new version, never an edit (4a.4.6). Carried answers are
-- stamped as answered by the person who started it: they own what they submit.
CREATE OR REPLACE FUNCTION public.start_vendor_assessment(p_organization_id uuid, p_vendor_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_actor uuid := app.current_user_id();
  v_previous public.vendor_assessments;
  v_row public.vendor_assessments;
  v_copied integer := 0;
BEGIN
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'Sign in to continue.' USING ERRCODE = 'TS401';
  END IF;
  IF NOT app.has_permission(p_organization_id, 'vendor.assess') THEN
    RAISE EXCEPTION 'You do not have permission to assess a vendor.' USING ERRCODE = 'TS403';
  END IF;
  PERFORM 1 FROM public.vendors v WHERE v.organization_id = p_organization_id AND v.id = p_vendor_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Vendor not found.' USING ERRCODE = 'TS404';
  END IF;
  IF EXISTS (SELECT 1 FROM public.vendor_assessments a
             WHERE a.organization_id = p_organization_id AND a.vendor_id = p_vendor_id AND a.status <> 'accepted') THEN
    RAISE EXCEPTION 'An assessment of this vendor is already open — finish it, or discard it first.' USING ERRCODE = 'TS409';
  END IF;

  SELECT * INTO v_previous FROM public.vendor_assessments a
  WHERE a.organization_id = p_organization_id AND a.vendor_id = p_vendor_id AND a.status = 'accepted'
  ORDER BY a.version DESC
  LIMIT 1;

  INSERT INTO public.vendor_assessments (organization_id, vendor_id, version, status, source, created_by)
  VALUES (p_organization_id, p_vendor_id,
          COALESCE((SELECT max(a.version) FROM public.vendor_assessments a
                    WHERE a.organization_id = p_organization_id AND a.vendor_id = p_vendor_id), 0) + 1,
          'draft', 'staff', v_actor)
  RETURNING * INTO v_row;

  IF v_previous.id IS NOT NULL THEN
    INSERT INTO public.vendor_assessment_answers (organization_id, assessment_id, question_code, answer, not_applicable, na_reason, evidence_id, answered_by)
    SELECT p_organization_id, v_row.id, x.question_code, x.answer, x.not_applicable, x.na_reason, x.evidence_id, v_actor
    FROM public.vendor_assessment_answers x
    WHERE x.organization_id = p_organization_id AND x.assessment_id = v_previous.id;
    GET DIAGNOSTICS v_copied = ROW_COUNT;
  END IF;

  INSERT INTO public.audit_logs (organization_id, user_id, event_type, entity_type, entity_id, description, metadata)
  VALUES (p_organization_id, v_actor, 'vendor.vendor_assessments.insert', 'vendor_assessments', v_row.id,
    'Started a processor assessment',
    jsonb_strip_nulls(jsonb_build_object('vendorId', p_vendor_id, 'version', v_row.version, 'source', v_row.source,
      'fromVersion', v_previous.version, 'answersCarried', v_copied)));

  RETURN jsonb_build_object('id', v_row.id, 'version', v_row.version);
END;
$$;

-- Save answers to a draft (or a returned) assessment, and where they came
-- from. Each entry: {code, answer, notApplicable, naReason, evidenceId}; an
-- entry with no answer and not "not applicable" clears that question. Only a
-- CHANGED answer is re-stamped with who answered it. Audited once, by count.
CREATE OR REPLACE FUNCTION public.save_vendor_assessment(p_organization_id uuid, p_assessment_id uuid, p_source_note text, p_answers jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_actor uuid := app.current_user_id();
  v_row public.vendor_assessments;
  v_note text := NULLIF(btrim(p_source_note), '');
  v_entry jsonb;
  v_code text;
  v_answer text;
  v_na boolean;
  v_reason text;
  v_evidence uuid;
  v_changed integer := 0;
  v_cleared integer := 0;
  v_n integer;
BEGIN
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'Sign in to continue.' USING ERRCODE = 'TS401';
  END IF;
  IF NOT app.has_permission(p_organization_id, 'vendor.assess') THEN
    RAISE EXCEPTION 'You do not have permission to assess a vendor.' USING ERRCODE = 'TS403';
  END IF;
  v_row := app.vendor_assessment_for_update(p_organization_id, p_assessment_id);
  IF v_row.status NOT IN ('draft', 'returned') THEN
    RAISE EXCEPTION 'This assessment is % — its answers can no longer change.', v_row.status USING ERRCODE = 'TS409';
  END IF;
  IF jsonb_typeof(COALESCE(p_answers, '[]'::jsonb)) <> 'array' OR jsonb_array_length(COALESCE(p_answers, '[]'::jsonb)) > 45 THEN
    RAISE EXCEPTION 'Send the answers as a list, at most one per question.' USING ERRCODE = 'TS422';
  END IF;
  IF (SELECT count(*) <> count(DISTINCT e.value ->> 'code') FROM jsonb_array_elements(COALESCE(p_answers, '[]'::jsonb)) e(value)) THEN
    RAISE EXCEPTION 'Each question is answered once.' USING ERRCODE = 'TS422';
  END IF;

  FOR v_entry IN SELECT e.value FROM jsonb_array_elements(COALESCE(p_answers, '[]'::jsonb)) e(value) LOOP
    v_code := v_entry ->> 'code';
    v_answer := NULLIF(btrim(v_entry ->> 'answer'), '');
    v_na := COALESCE((v_entry ->> 'notApplicable')::boolean, false);
    v_reason := NULLIF(btrim(v_entry ->> 'naReason'), '');
    v_evidence := NULLIF(v_entry ->> 'evidenceId', '')::uuid;
    IF NOT EXISTS (SELECT 1 FROM app.vendor_questions() q WHERE q.code = v_code) THEN
      RAISE EXCEPTION '% is not a question in the questionnaire.', COALESCE(v_code, 'An entry') USING ERRCODE = 'TS422';
    END IF;

    IF v_answer IS NULL AND NOT v_na THEN
      DELETE FROM public.vendor_assessment_answers x
      WHERE x.organization_id = p_organization_id AND x.assessment_id = p_assessment_id AND x.question_code = v_code;
      GET DIAGNOSTICS v_n = ROW_COUNT;
      v_cleared := v_cleared + v_n;
      CONTINUE;
    END IF;
    IF v_na THEN
      v_answer := NULL;
      v_evidence := NULL;
    ELSE
      v_reason := NULL;
    END IF;
    IF NOT app.vendor_answer_valid(v_code, v_answer, v_na, v_reason) THEN
      RAISE EXCEPTION '%: give one of its answers, or mark it not applicable with a reason.', v_code USING ERRCODE = 'TS422';
    END IF;

    INSERT INTO public.vendor_assessment_answers AS x (organization_id, assessment_id, question_code, answer, not_applicable, na_reason, evidence_id, answered_by, answered_at)
    VALUES (p_organization_id, p_assessment_id, v_code, v_answer, v_na, v_reason, v_evidence, v_actor, now())
    ON CONFLICT (assessment_id, question_code) DO UPDATE
      SET answer = EXCLUDED.answer, not_applicable = EXCLUDED.not_applicable, na_reason = EXCLUDED.na_reason,
          evidence_id = EXCLUDED.evidence_id, answered_by = EXCLUDED.answered_by, answered_at = EXCLUDED.answered_at
      WHERE (x.answer, x.not_applicable, x.na_reason, x.evidence_id)
            IS DISTINCT FROM (EXCLUDED.answer, EXCLUDED.not_applicable, EXCLUDED.na_reason, EXCLUDED.evidence_id);
    GET DIAGNOSTICS v_n = ROW_COUNT;
    v_changed := v_changed + v_n;
  END LOOP;

  IF v_note IS DISTINCT FROM v_row.source_note THEN
    IF v_note IS NOT NULL AND char_length(v_note) > 300 THEN
      RAISE EXCEPTION 'Say where the answers came from in at most 300 characters.' USING ERRCODE = 'TS422';
    END IF;
    UPDATE public.vendor_assessments a SET source_note = v_note WHERE a.organization_id = p_organization_id AND a.id = p_assessment_id;
  END IF;

  IF v_changed + v_cleared > 0 OR v_note IS DISTINCT FROM v_row.source_note THEN
    INSERT INTO public.audit_logs (organization_id, user_id, event_type, entity_type, entity_id, description, metadata)
    VALUES (p_organization_id, v_actor, 'vendor.vendor_assessments.answers_saved', 'vendor_assessments', p_assessment_id,
      'Saved answers to a processor assessment',
      jsonb_build_object('vendorId', v_row.vendor_id, 'version', v_row.version, 'answersChanged', v_changed,
        'answersCleared', v_cleared, 'sourceNoteChanged', v_note IS DISTINCT FROM v_row.source_note));
  END IF;

  RETURN jsonb_build_object('answersChanged', v_changed, 'answersCleared', v_cleared);
END;
$$;

-- Submit for review (4a.4.1): refused unless COMPLETE and attributed to a
-- source. The score is derived here and stored with it.
CREATE OR REPLACE FUNCTION public.submit_vendor_assessment(p_organization_id uuid, p_assessment_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_actor uuid := app.current_user_id();
  v_row public.vendor_assessments;
  v_missing text[];
  v_risk jsonb;
BEGIN
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'Sign in to continue.' USING ERRCODE = 'TS401';
  END IF;
  IF NOT app.has_permission(p_organization_id, 'vendor.assess') THEN
    RAISE EXCEPTION 'You do not have permission to assess a vendor.' USING ERRCODE = 'TS403';
  END IF;
  v_row := app.vendor_assessment_for_update(p_organization_id, p_assessment_id);
  IF v_row.status NOT IN ('draft', 'returned') THEN
    RAISE EXCEPTION 'This assessment is already %.', CASE v_row.status WHEN 'submitted' THEN 'awaiting review' ELSE v_row.status END
      USING ERRCODE = 'TS409';
  END IF;
  IF v_row.source_note IS NULL THEN
    RAISE EXCEPTION 'Say where the answers came from (for example, "the vendor''s email of 3 Oct 2026") before submitting.' USING ERRCODE = 'TS422';
  END IF;
  v_missing := app.vendor_assessment_missing(p_organization_id, p_assessment_id);
  IF cardinality(v_missing) > 0 THEN
    RAISE EXCEPTION '% % not answered or marked not applicable: %.', cardinality(v_missing),
      CASE WHEN cardinality(v_missing) = 1 THEN 'question is' ELSE 'questions are' END, array_to_string(v_missing, ', ')
      USING ERRCODE = 'TS422';
  END IF;

  v_risk := app.vendor_assessment_risk(p_organization_id, p_assessment_id);
  IF v_risk ->> 'score' IS NULL THEN
    RAISE EXCEPTION 'Answer at least one scored question — an assessment cannot be "not applicable" throughout.' USING ERRCODE = 'TS422';
  END IF;
  UPDATE public.vendor_assessments a
  SET status = 'submitted', submitted_by = v_actor, submitted_at = now(),
      risk_score = (v_risk ->> 'score')::integer, risk_tier = v_risk ->> 'tier',
      unevidenced = ARRAY(SELECT jsonb_array_elements_text(v_risk -> 'unevidenced'))
  WHERE a.organization_id = p_organization_id AND a.id = p_assessment_id
  RETURNING * INTO v_row;

  INSERT INTO public.audit_logs (organization_id, user_id, event_type, entity_type, entity_id, description, metadata)
  VALUES (p_organization_id, v_actor, 'vendor.vendor_assessments.submitted', 'vendor_assessments', p_assessment_id,
    'Submitted a processor assessment for review',
    jsonb_build_object('vendorId', v_row.vendor_id, 'version', v_row.version, 'riskScore', v_row.risk_score,
      'riskTier', v_row.risk_tier, 'unevidencedCount', cardinality(v_row.unevidenced)));

  RETURN jsonb_build_object('id', v_row.id, 'status', v_row.status, 'riskScore', v_row.risk_score);
END;
$$;

-- The second person (4a.4.4): accept — the assessment now counts, is frozen,
-- and is current until its review-by date — or return it with a reason.
-- Nobody who created, answered or submitted it may do either (D-043's rule).
CREATE OR REPLACE FUNCTION public.review_vendor_assessment(
  p_organization_id uuid,
  p_assessment_id uuid,
  p_decision text,
  p_reason text,
  p_review_by date
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_actor uuid := app.current_user_id();
  v_row public.vendor_assessments;
  v_today date := (now() AT TIME ZONE 'Asia/Kolkata')::date;
  v_months record;
  v_review_by date;
  v_reason text := NULLIF(btrim(p_reason), '');
  v_risk jsonb;
BEGIN
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'Sign in to continue.' USING ERRCODE = 'TS401';
  END IF;
  IF NOT app.has_permission(p_organization_id, 'vendor.review') THEN
    RAISE EXCEPTION 'You do not have permission to review a processor assessment.' USING ERRCODE = 'TS403';
  END IF;
  v_row := app.vendor_assessment_for_update(p_organization_id, p_assessment_id);
  IF v_row.status <> 'submitted' THEN
    RAISE EXCEPTION 'Only an assessment awaiting review can be accepted or returned (this one is %).', v_row.status USING ERRCODE = 'TS409';
  END IF;
  IF v_actor = v_row.created_by OR v_actor = v_row.submitted_by OR EXISTS (
       SELECT 1 FROM public.vendor_assessment_answers x
       WHERE x.organization_id = p_organization_id AND x.assessment_id = p_assessment_id AND x.answered_by = v_actor) THEN
    RAISE EXCEPTION 'You entered or answered this assessment — someone else must review it.' USING ERRCODE = 'TS403';
  END IF;

  IF p_decision = 'return' THEN
    IF v_reason IS NULL OR char_length(v_reason) > 1000 THEN
      RAISE EXCEPTION 'Say why it is returned, in at most 1,000 characters.' USING ERRCODE = 'TS422';
    END IF;
    UPDATE public.vendor_assessments a
    SET status = 'returned', return_reason = v_reason, reviewed_by = v_actor, reviewed_at = now()
    WHERE a.organization_id = p_organization_id AND a.id = p_assessment_id
    RETURNING * INTO v_row;
  ELSIF p_decision = 'accept' THEN
    SELECT * INTO v_months FROM app.vendor_review_months();
    v_review_by := COALESCE(p_review_by, (v_today + make_interval(months => v_months.default_months))::date);
    IF v_review_by <= v_today OR v_review_by > (v_today + make_interval(months => v_months.max_months))::date THEN
      RAISE EXCEPTION 'The review-by date is after today and at most % months away.', v_months.max_months USING ERRCODE = 'TS422';
    END IF;
    -- Derived again: a document may have been rejected in review since it was submitted.
    v_risk := app.vendor_assessment_risk(p_organization_id, p_assessment_id);
    UPDATE public.vendor_assessments a
    SET status = 'accepted', reviewed_by = v_actor, reviewed_at = now(), review_by = v_review_by,
        risk_score = (v_risk ->> 'score')::integer, risk_tier = v_risk ->> 'tier',
        unevidenced = ARRAY(SELECT jsonb_array_elements_text(v_risk -> 'unevidenced'))
    WHERE a.organization_id = p_organization_id AND a.id = p_assessment_id
    RETURNING * INTO v_row;
  ELSE
    RAISE EXCEPTION 'Accept it or return it.' USING ERRCODE = 'TS422';
  END IF;

  INSERT INTO public.audit_logs (organization_id, user_id, event_type, entity_type, entity_id, description, metadata)
  VALUES (p_organization_id, v_actor,
    CASE WHEN p_decision = 'accept' THEN 'vendor.vendor_assessments.accepted' ELSE 'vendor.vendor_assessments.returned' END,
    'vendor_assessments', p_assessment_id,
    CASE WHEN p_decision = 'accept' THEN 'Accepted a processor assessment' ELSE 'Returned a processor assessment for changes' END,
    jsonb_strip_nulls(jsonb_build_object('vendorId', v_row.vendor_id, 'version', v_row.version, 'riskScore', v_row.risk_score,
      'riskTier', v_row.risk_tier, 'reviewBy', to_char(v_row.review_by, 'YYYY-MM-DD'))));

  RETURN jsonb_build_object('id', v_row.id, 'status', v_row.status, 'reviewBy', to_char(v_row.review_by, 'YYYY-MM-DD'));
END;
$$;

-- Discard a draft, or a returned assessment no one will resubmit. A submitted
-- or accepted one is never deleted (the guard holds that for tooling too).
CREATE OR REPLACE FUNCTION public.discard_vendor_assessment(p_organization_id uuid, p_assessment_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_actor uuid := app.current_user_id();
  v_row public.vendor_assessments;
BEGIN
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'Sign in to continue.' USING ERRCODE = 'TS401';
  END IF;
  IF NOT app.has_permission(p_organization_id, 'vendor.assess') THEN
    RAISE EXCEPTION 'You do not have permission to assess a vendor.' USING ERRCODE = 'TS403';
  END IF;
  v_row := app.vendor_assessment_for_update(p_organization_id, p_assessment_id);
  IF v_row.status NOT IN ('draft', 'returned') THEN
    RAISE EXCEPTION 'A submitted or accepted assessment is never discarded.' USING ERRCODE = 'TS409';
  END IF;
  DELETE FROM public.vendor_assessments a WHERE a.organization_id = p_organization_id AND a.id = p_assessment_id;

  INSERT INTO public.audit_logs (organization_id, user_id, event_type, entity_type, entity_id, description, metadata)
  VALUES (p_organization_id, v_actor, 'vendor.vendor_assessments.delete', 'vendor_assessments', p_assessment_id,
    'Discarded a processor assessment',
    jsonb_build_object('vendorId', v_row.vendor_id, 'version', v_row.version, 'status', v_row.status));

  RETURN jsonb_build_object('deleted', p_assessment_id);
END;
$$;

REVOKE ALL ON FUNCTION public.start_vendor_assessment(uuid, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.save_vendor_assessment(uuid, uuid, text, jsonb) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.submit_vendor_assessment(uuid, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.review_vendor_assessment(uuid, uuid, text, text, date) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.discard_vendor_assessment(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.start_vendor_assessment(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.save_vendor_assessment(uuid, uuid, text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_vendor_assessment(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.review_vendor_assessment(uuid, uuid, text, text, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.discard_vendor_assessment(uuid, uuid) TO authenticated;


-- ===========================================================================
-- (7) The vendor's documents — `evidence_links` type `vendor` (decision 2)
-- ===========================================================================
-- The contract, and the certificates and reports the questionnaire asks for,
-- are stored artefacts linked to the VENDOR. Each function below is its
-- 20261003000000_ropa body with a `vendor` branch and nothing else changed.
--   * BEFORE INSERT: the vendor must be this organisation's, and the actor
--     needs vendor.assess (attaching a document is work on the assessment).
--   * BEFORE DELETE: a document an answer cites stays attached — an accepted
--     assessment may be standing on it.
--   * AFTER INSERT / AFTER DELETE: unchanged — a vendor's document re-derives
--     nothing (the score is derived when submitted and when accepted).
-- The evidence index learns to read the type in Stage 6 with the others.

ALTER TABLE public.evidence_links DROP CONSTRAINT evidence_links_entity_type_check;
ALTER TABLE public.evidence_links
  ADD CONSTRAINT evidence_links_entity_type_check
    CHECK (linked_entity_type IN ('assessment_response', 'gap_action', 'ropa_record', 'vendor'));

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
  ELSIF NEW.linked_entity_type = 'vendor' THEN
    PERFORM 1
    FROM public.vendors v
    WHERE v.id = NEW.linked_entity_id AND v.organization_id = NEW.organization_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Vendor not found.' USING ERRCODE = 'TS404';
    END IF;
    -- Attaching a vendor's document is work on its assessment.
    IF v_actor IS NOT NULL AND NOT app.has_permission(NEW.organization_id, 'vendor.assess') THEN
      RAISE EXCEPTION 'You do not have permission to attach a document to this vendor.' USING ERRCODE = 'TS403';
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

  IF OLD.linked_entity_type = 'vendor' THEN
    v_target_exists := EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = OLD.linked_entity_id AND v.organization_id = OLD.organization_id);
    -- An answer cites this document — an accepted assessment may stand on it.
    -- (The organisation's own deletion removes everything.)
    IF v_target_exists AND v_evidence_exists
       AND EXISTS (SELECT 1 FROM public.organizations o WHERE o.id = OLD.organization_id) AND EXISTS (
         SELECT 1 FROM public.vendor_assessment_answers x
         JOIN public.vendor_assessments a ON a.organization_id = x.organization_id AND a.id = x.assessment_id
         WHERE x.organization_id = OLD.organization_id AND x.evidence_id = OLD.evidence_id AND a.vendor_id = OLD.linked_entity_id) THEN
      RAISE EXCEPTION 'An assessment of this vendor cites this document — it stays attached.' USING ERRCODE = 'TS409';
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

-- Links are polymorphic, so no FK can cascade them (D-008): a deleted vendor
-- takes its documents' links with it (the documents themselves stay stored).
CREATE OR REPLACE FUNCTION app.vendor_after_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  DELETE FROM public.evidence_links
  WHERE organization_id = OLD.organization_id
    AND linked_entity_type = 'vendor'
    AND linked_entity_id = OLD.id;
  RETURN NULL;
END;
$$;

REVOKE ALL ON FUNCTION app.vendor_after_delete() FROM PUBLIC;

CREATE TRIGGER vendors_after_delete
  AFTER DELETE ON public.vendors
  FOR EACH ROW EXECUTE FUNCTION app.vendor_after_delete();


-- ===========================================================================
-- (8) Grants + RLS (D-019) — read by members, as the vendor register is;
--     written only by the functions in (6)
-- ===========================================================================

REVOKE ALL ON public.vendor_assessments, public.vendor_assessment_answers FROM anon, authenticated;
GRANT SELECT ON public.vendor_assessments, public.vendor_assessment_answers TO authenticated;

ALTER TABLE public.vendor_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_assessment_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY vendor_assessments_select_member ON public.vendor_assessments
  FOR SELECT TO authenticated
  USING (organization_id IN (SELECT app.current_user_organization_ids()));
CREATE POLICY vendor_assessment_answers_select_member ON public.vendor_assessment_answers
  FOR SELECT TO authenticated
  USING (organization_id IN (SELECT app.current_user_organization_ids()));


-- ===========================================================================
-- (9) Exposure model 1.4.0 — mirrors packages/core/src/exposure.ts
-- ===========================================================================
-- SLICE_10 §6, §7b.5: the processor register's rows on heads 1 and 7. One
-- version per stage: 1.3.0's migration stays as it was and this one replaces
-- the functions, each from its 1.3.0 body with the 1.4.0 rules and nothing else.

CREATE OR REPLACE FUNCTION app.exposure_model_version()
RETURNS text
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = ''
AS $$
  SELECT '1.4.0'::text;
$$;

-- §6.2b, with the 1.4.0 rows. `ord` is core's MODULE_INPUTS order: a fact read
-- on two heads is two rows, one per head, each with its own provision.
CREATE OR REPLACE FUNCTION app.exposure_module_inputs()
RETURNS TABLE (ord integer, code text, head text, provision text, effect text, register text, label text,
               reason_one text, reason_many text)
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = ''
AS $$
  VALUES
    (1, 'breach_board_overdue', 'H2', 's.8(6), Rule 7(2)(b)', 'exposed', 'Breach register',
     'Detailed report to the Board past its due time (72 hours, or the time the Board allowed) and not recorded as made',
     '1 personal data breach: the detailed report to the Board is past its due time and not recorded as made (Rule 7(2)(b)).',
     '{n} personal data breaches: the detailed report to the Board is past its due time and not recorded as made (Rule 7(2)(b)).'),
    (2, 'breach_principals_pending', 'H2', 's.8(6), Rule 7(1)', 'not_mitigated', 'Breach register',
     'Affected Data Principals not yet recorded as intimated',
     '1 personal data breach: affected Data Principals are not recorded as intimated (Rule 7(1)).',
     '{n} personal data breaches: affected Data Principals are not recorded as intimated (Rule 7(1)).'),
    (3, 'rights_ceiling_overdue', 'H7', 's.11–14, Rule 14(3)', 'exposed', 'Rights and grievance register',
     'A rights request or grievance open past the ninety days the Rules allow for a response',
     '1 rights request or grievance has been open for more than ninety days since it was received (Rule 14(3)).',
     '{n} rights requests or grievances have been open for more than ninety days since they were received (Rule 14(3)).'),
    (4, 'rights_target_overdue', 'H7', 'Rule 14(3) sets ninety days; thirty is a TrustStack target', 'reason', 'Rights and grievance register',
     'Open past TrustStack''s 30-day response target, still inside the ninety days',
     '1 rights request or grievance is open past TrustStack''s 30-day response target (a target, not a statutory period).',
     '{n} rights requests or grievances are open past TrustStack''s 30-day response target (a target, not a statutory period).'),
    (5, 'child_consent_unverified', 'H3', 's.9(1), Rules 10–11', 'exposed', 'Consent register',
     'A child''s or a lawful guardian''s consent, still given, with no verification of the parent or guardian recorded',
     '1 consent given on behalf of a child or a person with disability has no verification of the parent or lawful guardian recorded (s.9(1), Rules 10–11).',
     '{n} consents given on behalf of a child or a person with disability have no verification of the parent or lawful guardian recorded (s.9(1), Rules 10–11).'),
    (6, 'vendor_contract_missing', 'H1', 's.8(5), Rule 6(1)(f)', 'not_mitigated', 'Processor register',
     'A processor with no contract, or no DPDP clauses, recorded',
     '1 processor has no contract with DPDP clauses recorded — the contract is where reasonable security safeguards are provided for (Rule 6(1)(f)).',
     '{n} processors have no contract with DPDP clauses recorded — the contract is where reasonable security safeguards are provided for (Rule 6(1)(f)).'),
    (7, 'vendor_contract_missing', 'H7', 's.8(2)', 'not_mitigated', 'Processor register',
     'A processor with no contract, or no DPDP clauses, recorded',
     '1 processor has no contract with DPDP clauses recorded — a processor is engaged only under a valid contract (s.8(2)).',
     '{n} processors have no contract with DPDP clauses recorded — a processor is engaged only under a valid contract (s.8(2)).'),
    (8, 'vendor_assessment_out_of_date', 'H1', 'Twelve months is a TrustStack default; the Act sets no interval', 'reason', 'Processor register',
     'A processor''s accepted assessment past its review-by date',
     '1 processor''s accepted assessment is past its review-by date (a TrustStack default, not a statutory period).',
     '{n} processors'' accepted assessments are past their review-by dates (a TrustStack default, not a statutory period).'),
    (9, 'vendor_assessment_out_of_date', 'H7', 'Twelve months is a TrustStack default; the Act sets no interval', 'reason', 'Processor register',
     'A processor''s accepted assessment past its review-by date',
     '1 processor''s accepted assessment is past its review-by date (a TrustStack default, not a statutory period).',
     '{n} processors'' accepted assessments are past their review-by dates (a TrustStack default, not a statutory period).');
$$;

REVOKE ALL ON FUNCTION app.exposure_model_version(), app.exposure_module_inputs() FROM PUBLIC;

-- The evaluator, from its 1.3.0 body with the 1.4.0 rules: the processor
-- register's two facts join the module counts. Everything else is unchanged,
-- word for word.
CREATE OR REPLACE FUNCTION app.exposure_evaluate_head(p_input jsonb, p_head text)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_meta record;
  v_t record;
  v_ceiling_crore numeric;
  v_has_assessment boolean := jsonb_typeof(p_input -> 'assessment') = 'object';
  v_children text;
  v_guardian text;
  v_parts text[] := ARRAY[]::text[];
  v_why text;
  v_reasons jsonb := '[]'::jsonb;
  v_status text;
  v_unanswered boolean;
  v_n_register_direct integer;
  v_n_red_direct integer;
  v_n_critical integer;
  v_n_serious integer;
  v_n_below integer;
  v_n_answered integer;
  v_n_evidencing integer;
  v_all_mitigated boolean;
  v_row record;
  v_points integer := 0;
  v_factors jsonb := '[]'::jsonb;
  v_band text;
  v_band_index integer;
  v_from integer;
  v_to integer;
  v_position jsonb := NULL;
  v_planned boolean;
  v_confident boolean;
  v_location_unknown boolean;
  v_at_stake boolean;
  v_status_label text;
  -- 1.1.0: the breach register.
  v_now timestamptz := (p_input ->> 'now')::timestamptz;
  v_today date := (p_input ->> 'today')::date;
  v_n_board_overdue integer;
  v_n_principals_pending integer;
  v_n_recent integer;
  v_counts jsonb;
  v_module_exposes boolean;
  v_module_bars boolean;
  -- 1.2.0: the rights and grievance register.
  v_n_rights_ceiling integer;
  v_n_rights_target integer;
  -- 1.3.0: the consent register.
  v_n_consent_unverified integer;
  v_consent_child boolean;
  v_consent_ward boolean;
  -- 1.4.0: the processor register.
  v_n_vendor_contract integer;
  v_n_vendor_out_of_date integer;
BEGIN
  SELECT * INTO v_meta FROM app.exposure_heads() h WHERE h.code = p_head;
  SELECT * INTO v_t FROM app.exposure_thresholds();
  v_ceiling_crore := v_meta.ceiling_rupees / 10000000; -- every modelled ceiling is whole crore

  -- 1.3.0 (core `childrenAndGuardianFacts`): a consent still given on behalf of
  -- a child means children's data IS processed; one given by a lawful guardian,
  -- that a ward's data is.
  SELECT COALESCE(bool_or(c.value ->> 'action' = 'given' AND c.value ->> 'principalKind' = 'child'), false),
         COALESCE(bool_or(c.value ->> 'action' = 'given' AND c.value ->> 'principalKind' = 'guardian_ward'), false)
    INTO v_consent_child, v_consent_ward
  FROM jsonb_array_elements(COALESCE(p_input -> 'consents', '[]'::jsonb)) c(value);
  SELECT app.exposure_strongest(
           ARRAY[p_input #>> '{scope,childrenData}']
           || COALESCE((SELECT array_agg(x) FROM jsonb_array_elements_text(p_input #> '{register,childrenData}') x), ARRAY[]::text[])
           || CASE WHEN v_consent_child THEN ARRAY['yes'] ELSE ARRAY[]::text[] END)
    INTO v_children;
  SELECT app.exposure_strongest(
           ARRAY[p_input #>> '{scope,guardianData}']
           || CASE WHEN v_consent_ward THEN ARRAY['yes'] ELSE ARRAY[]::text[] END)
    INTO v_guardian;

  -- --- Does the head apply? -------------------------------------------------
  IF p_head = 'H3' THEN
    IF v_children = 'no' AND v_guardian = 'no' THEN
      RETURN jsonb_build_object(
        'code', p_head, 'serial', v_meta.serial, 'title', v_meta.title, 'ceilingCrore', v_ceiling_crore,
        'applies', false, 'status', 'not_applicable', 'statusLabel', 'Not applicable', 'atStake', false,
        'position', NULL,
        'reasons', jsonb_build_array(jsonb_build_object('kind', 'applies', 'text',
          'Neither children''s data nor data of persons with disability who have a lawful guardian is processed, as recorded in the scope and the register.')));
    END IF;
    IF v_children = 'yes' THEN v_parts := v_parts || 'children''s data is processed'::text;
    ELSIF v_children = 'unknown' THEN v_parts := v_parts || 'whether children''s data is processed is not yet known'::text;
    END IF;
    IF v_guardian = 'yes' THEN v_parts := v_parts || 'data of persons with disability who have a lawful guardian is processed'::text;
    ELSIF v_guardian = 'unknown' THEN v_parts := v_parts || 'whether data of persons with disability who have a lawful guardian is processed is not yet known'::text;
    END IF;
    v_why := 'Applies because ' || array_to_string(v_parts, ', and ') || '.';
  ELSIF p_head = 'H4' THEN
    IF jsonb_typeof(p_input #> '{sdf,notifiedOn}') IS DISTINCT FROM 'string' THEN
      RETURN jsonb_build_object(
        'code', p_head, 'serial', v_meta.serial, 'title', v_meta.title, 'ceilingCrore', v_ceiling_crore,
        'applies', false, 'status', 'not_applicable', 'statusLabel', 'Not applicable', 'atStake', false,
        'position', NULL,
        'reasons', jsonb_build_array(jsonb_build_object('kind', 'applies', 'text',
          'No Significant Data Fiduciary notification is recorded. TrustStack never infers this.')));
    END IF;
    v_why := 'Applies because a Significant Data Fiduciary notification dated ' || (p_input #>> '{sdf,notifiedOn}') || ' is recorded.';
  END IF;

  IF v_why IS NOT NULL THEN
    v_reasons := v_reasons || jsonb_build_array(jsonb_build_object('kind', 'applies', 'text', v_why));
  END IF;

  -- --- The workflow modules' facts (core `moduleInputCounts`, `recentBreachCount`) — 1.1.0 to 1.4.0
  -- A breach dismissed as not a personal data breach never counts. "Overdue"
  -- is strictly after the due instant: exactly 72 hours is still in time.
  -- The repetition window is 24 calendar months ending today, both ends
  -- included, the awareness dated in India.
  SELECT count(*) FILTER (WHERE jsonb_typeof(b.value -> 'boardReportAt') IS DISTINCT FROM 'string'
                            AND v_now > (b.value ->> 'boardReportDueAt')::timestamptz),
         count(*) FILTER (WHERE jsonb_typeof(b.value -> 'principalsIntimatedAt') IS DISTINCT FROM 'string'),
         count(*) FILTER (WHERE ((b.value ->> 'awareAt')::timestamptz AT TIME ZONE 'Asia/Kolkata')::date
                                  BETWEEN (v_today - make_interval(months => app.exposure_repetition_window_months()))::date AND v_today)
    INTO v_n_board_overdue, v_n_principals_pending, v_n_recent
  FROM jsonb_array_elements(COALESCE(p_input -> 'breaches', '[]'::jsonb)) b(value)
  WHERE b.value ->> 'status' <> 'dismissed';
  -- 1.2.0: the rights register (core `rightsCeilingOverdue`, `rightsPastTarget`).
  -- Only an OPEN request counts. Day 90 since receipt is still in time:
  -- overdue is strictly after; past TrustStack's target strictly after day
  -- 30 and never also overdue. A date minus a date is whole days.
  SELECT count(*) FILTER (WHERE v_today - (r.value ->> 'receivedOn')::date > app.rights_ceiling_days()),
         count(*) FILTER (WHERE v_today - (r.value ->> 'receivedOn')::date > app.rights_target_days()
                            AND v_today - (r.value ->> 'receivedOn')::date <= app.rights_ceiling_days())
    INTO v_n_rights_ceiling, v_n_rights_target
  FROM jsonb_array_elements(COALESCE(p_input -> 'rights', '[]'::jsonb)) r(value)
  WHERE r.value ->> 'status' = 'open';
  -- 1.3.0: the consent register (core `childConsentUnverified`): still given,
  -- on behalf of a child or a ward, with no verification or exemption recorded.
  SELECT count(*) FILTER (WHERE c.value ->> 'action' = 'given' AND c.value ->> 'principalKind' <> 'self'
                            AND jsonb_typeof(c.value -> 'verificationMethod') IS DISTINCT FROM 'string')
    INTO v_n_consent_unverified
  FROM jsonb_array_elements(COALESCE(p_input -> 'consents', '[]'::jsonb)) c(value);
  -- 1.4.0: the processor register (core `vendorContractGap`, `assessmentOutOfDate`):
  -- anyone not recorded as an independent fiduciary (unknown counts) with no
  -- contract or no DPDP clauses recorded; and an accepted assessment strictly
  -- past its review-by date.
  SELECT count(*) FILTER (WHERE v.value ->> 'role' <> 'independent'
                            AND (v.value ->> 'contractExists' <> 'yes' OR v.value ->> 'dpdpClauses' <> 'yes')),
         count(*) FILTER (WHERE v.value ->> 'role' <> 'independent'
                            AND jsonb_typeof(v.value -> 'assessmentReviewBy') = 'string'
                            AND v_today > (v.value ->> 'assessmentReviewBy')::date)
    INTO v_n_vendor_contract, v_n_vendor_out_of_date
  FROM jsonb_array_elements(COALESCE(p_input -> 'vendors', '[]'::jsonb)) v(value);
  v_counts := jsonb_build_object('breach_board_overdue', v_n_board_overdue, 'breach_principals_pending', v_n_principals_pending,
                                 'rights_ceiling_overdue', v_n_rights_ceiling, 'rights_target_overdue', v_n_rights_target,
                                 'child_consent_unverified', v_n_consent_unverified,
                                 'vendor_contract_missing', v_n_vendor_contract,
                                 'vendor_assessment_out_of_date', v_n_vendor_out_of_date);
  SELECT COALESCE(bool_or(m.effect = 'exposed' AND (v_counts ->> m.code)::integer > 0), false),
         COALESCE(bool_or(m.effect = 'not_mitigated' AND (v_counts ->> m.code)::integer > 0), false)
    INTO v_module_exposes, v_module_bars
  FROM app.exposure_module_inputs() m
  WHERE m.head = p_head;

  -- --- The direct evidence, as temporary sets -------------------------------
  -- Domains: in the input's order; de-noised to nine places as core does.
  IF to_regclass('pg_temp.exp_domains') IS NULL THEN
    CREATE TEMP TABLE exp_domains (
      ord bigint, code text, name text, state text, question_count integer, outstanding_count integer,
      percent numeric, confidence numeric, direct boolean, enabling boolean) ON COMMIT DROP;
  END IF;
  TRUNCATE pg_temp.exp_domains;
  INSERT INTO pg_temp.exp_domains
  SELECT e.ord, e.value ->> 'code', dd.name, e.value ->> 'state',
         (e.value ->> 'questionCount')::integer, (e.value ->> 'outstandingCount')::integer,
         round((e.value ->> 'percent')::numeric, 9), round((e.value ->> 'evidenceConfidence')::numeric, 9),
         EXISTS (SELECT 1 FROM app.exposure_domain_links() l
                 WHERE l.domain_code = e.value ->> 'code' AND l.kind = 'direct' AND l.head = p_head),
         EXISTS (SELECT 1 FROM app.exposure_domain_links() l
                 WHERE l.domain_code = e.value ->> 'code' AND l.kind = 'enabling' AND l.head = p_head)
  FROM jsonb_array_elements(CASE WHEN v_has_assessment THEN p_input #> '{assessment,domains}' ELSE '[]'::jsonb END)
         WITH ORDINALITY AS e(value, ord)
  LEFT JOIN public.dpdp_domains dd ON dd.code = e.value ->> 'code';

  -- Gaps: OUTSTANDING only (open, and an action not closed or no action).
  IF to_regclass('pg_temp.exp_gaps') IS NULL THEN
    CREATE TEMP TABLE exp_gaps (
      ord bigint, source text, code text, severity text, direct boolean, enabling boolean,
      n_actions integer, planned boolean) ON COMMIT DROP;
  END IF;
  TRUNCATE pg_temp.exp_gaps;
  INSERT INTO pg_temp.exp_gaps
  SELECT g.ord, g.value ->> 'source',
         CASE WHEN g.value ->> 'source' = 'assessment' THEN g.value ->> 'domainCode' ELSE g.value ->> 'gapCode' END,
         g.value ->> 'severity',
         CASE WHEN g.value ->> 'source' = 'assessment'
              THEN EXISTS (SELECT 1 FROM app.exposure_domain_links() l
                           WHERE l.domain_code = g.value ->> 'domainCode' AND l.kind = 'direct' AND l.head = p_head)
              ELSE EXISTS (SELECT 1 FROM app.exposure_rule_links() l
                           WHERE l.gap_code = g.value ->> 'gapCode' AND l.kind = 'direct' AND l.head = p_head) END,
         CASE WHEN g.value ->> 'source' = 'assessment'
              THEN EXISTS (SELECT 1 FROM app.exposure_domain_links() l
                           WHERE l.domain_code = g.value ->> 'domainCode' AND l.kind = 'enabling' AND l.head = p_head)
              ELSE EXISTS (SELECT 1 FROM app.exposure_rule_links() l
                           WHERE l.gap_code = g.value ->> 'gapCode' AND l.kind = 'enabling' AND l.head = p_head) END,
         jsonb_array_length(g.value -> 'actions'),
         -- (e) mitigation: every action not closed has an owner, and a due
         -- date unless the gap is Low (a Low gap carries none, D-055).
         jsonb_array_length(g.value -> 'actions') > 0
           AND NOT EXISTS (
             SELECT 1 FROM jsonb_array_elements(g.value -> 'actions') a(value)
             WHERE a.value ->> 'status' <> 'closed'
               AND (jsonb_typeof(a.value -> 'ownerUserId') IS DISTINCT FROM 'string'
                    OR (jsonb_typeof(a.value -> 'dueDate') IS DISTINCT FROM 'string' AND g.value ->> 'severity' <> 'low')))
  FROM jsonb_array_elements(p_input -> 'gaps') WITH ORDINALITY AS g(value, ord)
  WHERE g.value ->> 'state' = 'open'
    AND (jsonb_array_length(g.value -> 'actions') = 0
         OR EXISTS (SELECT 1 FROM jsonb_array_elements(g.value -> 'actions') a(value) WHERE a.value ->> 'status' <> 'closed'));

  -- --- Status (§6.3, first match wins) --------------------------------------
  v_unanswered := NOT v_has_assessment OR NOT EXISTS (
    SELECT 1 FROM pg_temp.exp_domains d
    WHERE d.direct AND d.state <> 'scoped_out' AND d.question_count > 0
      AND d.outstanding_count <> d.question_count);
  SELECT count(*) INTO v_n_register_direct FROM pg_temp.exp_gaps g WHERE g.direct AND g.source = 'ropa';
  SELECT count(*) INTO v_n_red_direct
  FROM jsonb_array_elements(CASE WHEN v_has_assessment THEN p_input #> '{assessment,redFlags}' ELSE '[]'::jsonb END) f(value)
  WHERE EXISTS (SELECT 1 FROM app.exposure_domain_links() l
                WHERE l.domain_code = f.value ->> 'domainCode' AND l.kind = 'direct' AND l.head = p_head);
  SELECT count(*) INTO v_n_critical FROM pg_temp.exp_gaps g WHERE g.direct AND g.severity = 'critical';
  SELECT count(*) INTO v_n_serious FROM pg_temp.exp_gaps g WHERE g.direct AND g.severity IN ('critical', 'high');
  -- "evidencing": has questions, not scoped out, not excluded in full (D-038).
  SELECT count(*) FILTER (WHERE d.percent IS NOT NULL),
         count(*),
         count(*) FILTER (WHERE d.percent IS NOT NULL AND d.percent < v_t.exposed_below_percent),
         COALESCE(bool_and(d.percent >= v_t.mitigated_min_percent AND d.confidence IS NOT NULL
                           AND d.confidence >= v_t.mitigated_min_confidence) FILTER (WHERE d.percent IS NOT NULL), true)
    INTO v_n_answered, v_n_evidencing, v_n_below, v_all_mitigated
  FROM pg_temp.exp_domains d
  WHERE d.direct AND d.state <> 'scoped_out' AND d.question_count > 0 AND d.state <> 'all_not_applicable';

  IF v_unanswered AND v_n_register_direct = 0 AND NOT v_module_exposes THEN
    v_status := 'not_yet_assessed';
    v_reasons := v_reasons || jsonb_build_array(jsonb_build_object('kind', 'status', 'text',
      CASE WHEN NOT v_has_assessment
           THEN 'No assessment has been started, and no register gap is open for this head.'
           ELSE 'No question that evidences this head has been answered yet, and no register gap is open for it.' END));
  ELSIF v_n_red_direct > 0 OR v_n_critical > 0 OR v_n_below > 0 OR v_module_exposes THEN
    v_status := 'exposed';
  ELSIF v_n_answered > 0 AND v_n_answered = v_n_evidencing AND v_all_mitigated AND v_n_serious = 0 AND NOT v_module_bars THEN
    v_status := 'mitigated';
  ELSE
    v_status := 'partially_mitigated';
  END IF;

  -- --- Why: direct evidence -------------------------------------------------
  IF v_status <> 'not_yet_assessed' THEN
    IF v_status = 'mitigated' THEN
      v_reasons := v_reasons || jsonb_build_array(jsonb_build_object('kind', 'status', 'text',
        'Every area that evidences this head scored at least ' || app.exposure_pct(v_t.mitigated_min_percent)
        || ' with evidence confidence of at least ' || v_t.mitigated_min_confidence::text || '%, and no critical or high gap is open.'));
    END IF;
    -- Red flags in a direct domain, in the input's order.
    FOR v_row IN
      SELECT f.value ->> 'label' AS label
      FROM jsonb_array_elements(CASE WHEN v_has_assessment THEN p_input #> '{assessment,redFlags}' ELSE '[]'::jsonb END)
             WITH ORDINALITY AS f(value, ord)
      WHERE EXISTS (SELECT 1 FROM app.exposure_domain_links() l
                    WHERE l.domain_code = f.value ->> 'domainCode' AND l.kind = 'direct' AND l.head = p_head)
      ORDER BY f.ord
    LOOP
      v_reasons := v_reasons || jsonb_build_array(jsonb_build_object('kind', 'status', 'text', 'Red flag: ' || v_row.label || '.'));
    END LOOP;
    -- Below 40%.
    FOR v_row IN
      SELECT d.name, d.percent FROM pg_temp.exp_domains d
      WHERE d.direct AND d.state <> 'scoped_out' AND d.question_count > 0 AND d.state <> 'all_not_applicable'
        AND d.percent IS NOT NULL AND d.percent < v_t.exposed_below_percent
      ORDER BY d.ord
    LOOP
      v_reasons := v_reasons || jsonb_build_array(jsonb_build_object('kind', 'status', 'text',
        v_row.name || ' scored ' || app.exposure_pct(v_row.percent) || ' of its weight (below ' || app.exposure_pct(v_t.exposed_below_percent) || ').'));
    END LOOP;
    -- Open assessment gaps, per direct domain in the model's order.
    FOR v_row IN
      SELECT dd.name, count(*)::integer AS n,
             concat_ws(', ',
               CASE WHEN count(*) FILTER (WHERE g.severity = 'critical') > 0 THEN (count(*) FILTER (WHERE g.severity = 'critical'))::text || ' critical' END,
               CASE WHEN count(*) FILTER (WHERE g.severity = 'high') > 0 THEN (count(*) FILTER (WHERE g.severity = 'high'))::text || ' high' END,
               CASE WHEN count(*) FILTER (WHERE g.severity = 'medium') > 0 THEN (count(*) FILTER (WHERE g.severity = 'medium'))::text || ' medium' END,
               CASE WHEN count(*) FILTER (WHERE g.severity = 'low') > 0 THEN (count(*) FILTER (WHERE g.severity = 'low'))::text || ' low' END
             ) AS phrase,
             min(l.ord) AS ord
      FROM pg_temp.exp_gaps g
      JOIN app.exposure_domain_links() l ON l.domain_code = g.code AND l.kind = 'direct' AND l.head = p_head
      JOIN public.dpdp_domains dd ON dd.code = g.code
      WHERE g.direct AND g.source = 'assessment'
      GROUP BY dd.name
      ORDER BY min(l.ord)
    LOOP
      v_reasons := v_reasons || jsonb_build_array(jsonb_build_object('kind', 'status', 'text',
        v_row.name || ': ' || app.exposure_plural(v_row.n, 'open gap', 'open gaps') || ' (' || v_row.phrase || ').'));
    END LOOP;
    -- Open register gaps, per direct rule in the model's order.
    FOR v_row IN
      SELECT r.label, count(*)::integer AS n
      FROM pg_temp.exp_gaps g
      JOIN app.exposure_rule_links() l ON l.gap_code = g.code AND l.kind = 'direct' AND l.head = p_head
      JOIN app.ropa_gap_rules() r ON r.code = g.code
      WHERE g.direct AND g.source = 'ropa'
      GROUP BY r.label, l.ord
      ORDER BY l.ord
    LOOP
      v_reasons := v_reasons || jsonb_build_array(jsonb_build_object('kind', 'status', 'text',
        'Processing register: ' || v_row.label || ' (' || app.exposure_plural(v_row.n, 'open gap', 'open gaps') || ').'));
    END LOOP;
    -- 1.1.0: the module facts that hold, in the model's order.
    FOR v_row IN
      SELECT m.reason_one, m.reason_many, (v_counts ->> m.code)::integer AS n
      FROM app.exposure_module_inputs() m
      WHERE m.head = p_head AND (v_counts ->> m.code)::integer > 0
      ORDER BY m.ord
    LOOP
      v_reasons := v_reasons || jsonb_build_array(jsonb_build_object('kind', 'status', 'text',
        CASE WHEN v_row.n = 1 THEN v_row.reason_one ELSE replace(v_row.reason_many, '{n}', v_row.n::text) END));
    END LOOP;
    -- Not answered yet.
    FOR v_row IN
      SELECT d.name FROM pg_temp.exp_domains d
      WHERE d.direct AND d.state <> 'scoped_out' AND d.question_count > 0 AND d.state <> 'all_not_applicable'
        AND d.percent IS NULL
      ORDER BY d.ord
    LOOP
      v_reasons := v_reasons || jsonb_build_array(jsonb_build_object('kind', 'status', 'text', v_row.name || ' has not been answered yet.'));
    END LOOP;
    IF v_status = 'partially_mitigated' THEN
      FOR v_row IN
        SELECT d.name, d.percent FROM pg_temp.exp_domains d
        WHERE d.direct AND d.state <> 'scoped_out' AND d.question_count > 0 AND d.state <> 'all_not_applicable'
          AND d.percent IS NOT NULL AND d.percent >= v_t.exposed_below_percent AND d.percent < v_t.mitigated_min_percent
        ORDER BY d.ord
      LOOP
        v_reasons := v_reasons || jsonb_build_array(jsonb_build_object('kind', 'status', 'text',
          v_row.name || ' scored ' || app.exposure_pct(v_row.percent) || ' of its weight (below ' || app.exposure_pct(v_t.mitigated_min_percent) || ').'));
      END LOOP;
      FOR v_row IN
        SELECT d.name, d.confidence FROM pg_temp.exp_domains d
        WHERE d.direct AND d.state <> 'scoped_out' AND d.question_count > 0 AND d.state <> 'all_not_applicable'
          AND d.percent IS NOT NULL AND (d.confidence IS NULL OR d.confidence < v_t.mitigated_min_confidence)
        ORDER BY d.ord
      LOOP
        v_reasons := v_reasons || jsonb_build_array(jsonb_build_object('kind', 'status', 'text',
          v_row.name || ': evidence confidence ' || round(COALESCE(v_row.confidence, 0))::text || '% (below '
          || v_t.mitigated_min_confidence::text || '%).'));
      END LOOP;
    END IF;
  END IF;

  -- --- Why: root causes (enabling controls — never a status) ----------------
  IF v_status <> 'mitigated' THEN
    FOR v_row IN
      SELECT f.value ->> 'label' AS label
      FROM jsonb_array_elements(CASE WHEN v_has_assessment THEN p_input #> '{assessment,redFlags}' ELSE '[]'::jsonb END)
             WITH ORDINALITY AS f(value, ord)
      WHERE EXISTS (SELECT 1 FROM app.exposure_domain_links() l
                    WHERE l.domain_code = f.value ->> 'domainCode' AND l.kind = 'enabling' AND l.head = p_head)
      ORDER BY f.ord
    LOOP
      v_reasons := v_reasons || jsonb_build_array(jsonb_build_object('kind', 'root_cause', 'text', 'Root cause: ' || v_row.label || '.'));
    END LOOP;
    FOR v_row IN
      SELECT r.label, count(*)::integer AS n
      FROM pg_temp.exp_gaps g
      JOIN app.exposure_rule_links() l ON l.gap_code = g.code AND l.kind = 'enabling' AND l.head = p_head
      JOIN app.ropa_gap_rules() r ON r.code = g.code
      WHERE g.source = 'ropa'
      GROUP BY r.label, l.ord
      ORDER BY l.ord
    LOOP
      v_reasons := v_reasons || jsonb_build_array(jsonb_build_object('kind', 'root_cause', 'text',
        'Root cause: processing register — ' || v_row.label || ' (' || app.exposure_plural(v_row.n, 'open gap', 'open gaps') || ').'));
    END LOOP;
  END IF;

  -- --- Position within the ceiling (§6.4) -----------------------------------
  v_at_stake := v_status IN ('exposed', 'partially_mitigated', 'not_yet_assessed');
  IF v_at_stake THEN
    IF v_children = 'yes' THEN
      v_factors := v_factors || jsonb_build_array(jsonb_build_object('code', 'children_data', 'clause', '(b)',
        'points', CASE WHEN p_head = 'H3' THEN (SELECT h3_points FROM app.exposure_position_factors() WHERE code = 'children_data')
                       ELSE (SELECT points FROM app.exposure_position_factors() WHERE code = 'children_data') END,
        'text', 'Children''s data is processed.'));
    ELSIF v_children = 'unknown' THEN
      v_factors := v_factors || jsonb_build_array(jsonb_build_object('code', 'children_data', 'clause', '(b)',
        'points', CASE WHEN p_head = 'H3' THEN (SELECT h3_unknown_points FROM app.exposure_position_factors() WHERE code = 'children_data')
                       ELSE (SELECT unknown_points FROM app.exposure_position_factors() WHERE code = 'children_data') END,
        'text', 'Children''s data may be processed (not yet known).'));
    END IF;
    IF p_input #>> '{scope,sensitiveDocuments}' = 'yes' THEN
      v_factors := v_factors || jsonb_build_array(jsonb_build_object('code', 'sensitive_documents', 'clause', '(b)',
        'points', (SELECT points FROM app.exposure_position_factors() WHERE code = 'sensitive_documents'),
        'text', 'Identity, financial or health documents are collected.'));
    ELSIF p_input #>> '{scope,sensitiveDocuments}' = 'unknown' THEN
      v_factors := v_factors || jsonb_build_array(jsonb_build_object('code', 'sensitive_documents', 'clause', '(b)',
        'points', (SELECT points FROM app.exposure_position_factors() WHERE code = 'sensitive_documents'),
        'text', 'Identity, financial or health documents may be collected (not yet known).'));
    END IF;
    IF (p_input #>> '{scope,largeScale}')::boolean THEN
      v_factors := v_factors || jsonb_build_array(jsonb_build_object('code', 'large_scale', 'clause', '(a)',
        'points', (SELECT points FROM app.exposure_position_factors() WHERE code = 'large_scale'),
        'text', 'A large number of Data Principals (a TrustStack trigger, not a statutory classification).'));
    END IF;
    v_location_unknown := (p_input #>> '{scope,locationUnknown}')::boolean
      OR EXISTS (SELECT 1 FROM jsonb_array_elements_text(p_input #> '{register,crossBorder}') x WHERE x = 'unknown');
    IF v_location_unknown AND p_head = (SELECT only_head FROM app.exposure_position_factors() WHERE code = 'location_unknown') THEN
      v_factors := v_factors || jsonb_build_array(jsonb_build_object('code', 'location_unknown', 'clause', '(a)',
        'points', (SELECT points FROM app.exposure_position_factors() WHERE code = 'location_unknown'),
        'text', 'Where personal data is held or sent is not known.'));
    END IF;
    IF v_status = 'exposed' THEN
      v_factors := v_factors || jsonb_build_array(jsonb_build_object('code', 'status_exposed', 'clause', '(a)',
        'points', (SELECT points FROM app.exposure_position_factors() WHERE code = 'status_exposed'),
        'text', 'Exposed rather than partly mitigated.'));
    END IF;
    SELECT count(*) > 0 AND bool_and(g.planned) INTO v_planned FROM pg_temp.exp_gaps g WHERE g.direct;
    IF v_planned THEN
      v_factors := v_factors || jsonb_build_array(jsonb_build_object('code', 'remediation_planned', 'clause', '(e)',
        'points', (SELECT points FROM app.exposure_position_factors() WHERE code = 'remediation_planned'),
        'text', 'Every open gap on this head has an owner and a due date.'));
    END IF;
    SELECT count(*) > 0 AND bool_and(d.confidence IS NOT NULL AND d.confidence >= v_t.mitigated_min_confidence)
      INTO v_confident
    FROM pg_temp.exp_domains d
    WHERE d.direct AND d.state <> 'scoped_out' AND d.question_count > 0 AND d.state <> 'all_not_applicable'
      AND d.percent IS NOT NULL;
    IF v_confident THEN
      v_factors := v_factors || jsonb_build_array(jsonb_build_object('code', 'evidence_confident', 'clause', '(e)',
        'points', (SELECT points FROM app.exposure_position_factors() WHERE code = 'evidence_confident'),
        'text', 'Evidence confidence is at least ' || v_t.mitigated_min_confidence::text || '% in every area that evidences this head.'));
    END IF;

    -- 1.1.0 — (c) repetition: breaches in the window, on the one head that reads it.
    IF v_n_recent > 0 AND p_head = (SELECT only_head FROM app.exposure_position_factors() WHERE code = 'repetition') THEN
      v_factors := v_factors || jsonb_build_array(jsonb_build_object('code', 'repetition', 'clause', '(c)',
        'points', CASE WHEN v_n_recent = 1 THEN (SELECT points FROM app.exposure_position_factors() WHERE code = 'repetition')
                       ELSE (SELECT repeated_points FROM app.exposure_position_factors() WHERE code = 'repetition') END,
        'text', app.exposure_plural(v_n_recent, 'personal data breach', 'personal data breaches')
                || ' recorded in the last ' || app.exposure_repetition_window_months()::text || ' months.'));
    END IF;

    SELECT COALESCE(sum((f.value ->> 'points')::integer), 0) INTO v_points FROM jsonb_array_elements(v_factors) f(value);
    -- ≤ 1 lower third · 2–3 middle · ≥ 4 upper; each a third of the ceiling in WHOLE crore.
    v_band_index := CASE WHEN v_points <= 1 THEN 0 WHEN v_points <= 3 THEN 1 ELSE 2 END;
    v_band := (ARRAY['lower', 'middle', 'upper'])[v_band_index + 1];
    v_from := round(v_ceiling_crore * v_band_index / 3);
    v_to := round(v_ceiling_crore * (v_band_index + 1) / 3);
    v_position := jsonb_build_object(
      'points', v_points,
      'band', v_band,
      'bandLabel', (ARRAY['Lower third', 'Middle third', 'Upper third'])[v_band_index + 1],
      'fromCrore', v_from,
      'toCrore', v_to,
      'rangeLabel', CASE WHEN v_from = 0 THEN 'up to ₹' || v_to::text || ' crore'
                         ELSE '₹' || v_from::text || '–' || v_to::text || ' crore' END,
      'factors', v_factors);
  END IF;

  v_status_label := CASE v_status
    WHEN 'not_yet_assessed' THEN 'Not yet assessed'
    WHEN 'exposed' THEN 'Exposed'
    WHEN 'partially_mitigated' THEN 'Partially mitigated'
    WHEN 'mitigated' THEN 'Mitigated'
  END;

  RETURN jsonb_build_object(
    'code', p_head, 'serial', v_meta.serial, 'title', v_meta.title, 'ceilingCrore', v_ceiling_crore,
    'applies', true, 'status', v_status, 'statusLabel', v_status_label, 'atStake', v_at_stake,
    'position', v_position, 'reasons', v_reasons);
END;
$$;

-- The inputs, from the 1.3.0 body, plus the vendor register.
CREATE OR REPLACE FUNCTION app.exposure_input(p_organization_id uuid, p_today date)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_finalised record;
  v_chosen uuid;
  v_basis text := 'none';
  v_snapshot uuid;
  v_assessment jsonb := NULL;
  v_gaps jsonb;
  v_saved boolean;
  v_scope record;
  v_principals bigint;
  v_children text;
  v_input jsonb;
BEGIN
  SELECT a.id, a.created_at INTO v_finalised
  FROM public.assessments a
  WHERE a.organization_id = p_organization_id AND a.status = 'finalised'
  ORDER BY a.created_at DESC
  LIMIT 1;

  IF v_finalised.id IS NOT NULL THEN
    v_chosen := v_finalised.id;
    v_basis := 'finalised';
  ELSE
    SELECT a.id INTO v_chosen
    FROM public.assessments a
    WHERE a.organization_id = p_organization_id AND a.status <> 'finalised'
    ORDER BY (a.status <> 'draft') DESC, a.created_at DESC
    LIMIT 1;
    IF v_chosen IS NOT NULL THEN v_basis := 'provisional'; END IF;
  END IF;

  IF v_chosen IS NOT NULL THEN
    SELECT s.id INTO v_snapshot
    FROM public.assessment_score_snapshots s
    WHERE s.organization_id = p_organization_id AND s.assessment_id = v_chosen AND v_basis = 'finalised';

    IF v_snapshot IS NOT NULL THEN
      SELECT jsonb_build_object(
               'domains', COALESCE((
                 SELECT jsonb_agg(jsonb_build_object(
                          'code', d.domain_code,
                          'state', d.state,
                          'weight', d.weight,
                          'questionCount', d.applicable_count + d.not_applicable_count,
                          'outstandingCount', 0,
                          'percent', CASE WHEN d.score IS NULL THEN NULL ELSE d.score / d.weight END,
                          'evidenceConfidence', d.evidence_confidence) ORDER BY d.sort_order)
                 FROM public.assessment_domain_scores d
                 WHERE d.organization_id = p_organization_id AND d.snapshot_id = v_snapshot), '[]'::jsonb),
               'redFlags', COALESCE((
                 SELECT jsonb_agg(jsonb_build_object('code', f.value ->> 'code', 'domainCode', f.value ->> 'domainCode',
                                                     'label', f.value ->> 'label') ORDER BY f.ord)
                 FROM public.assessment_score_snapshots s,
                      jsonb_array_elements(s.red_flags) WITH ORDINALITY AS f(value, ord)
                 WHERE s.id = v_snapshot), '[]'::jsonb))
        INTO v_assessment;
    ELSE
      SELECT jsonb_build_object(
               'domains', COALESCE((
                 SELECT jsonb_agg(jsonb_build_object(
                          'code', d.domain_code,
                          'state', d.state,
                          'weight', d.weight,
                          'questionCount', d.applicable_count + d.not_applicable_count + d.outstanding_count,
                          'outstandingCount', d.outstanding_count,
                          'percent', CASE WHEN d.score IS NULL THEN NULL ELSE d.score / d.weight END,
                          'evidenceConfidence', d.evidence_confidence) ORDER BY d.sort_order)
                 FROM app.assessment_domain_results(p_organization_id, v_chosen) d), '[]'::jsonb),
               'redFlags', COALESCE((
                 SELECT jsonb_agg(jsonb_build_object('code', f.value ->> 'code', 'domainCode', f.value ->> 'domainCode',
                                                     'label', f.value ->> 'label') ORDER BY f.ord)
                 FROM jsonb_array_elements(app.assessment_red_flags(p_organization_id, v_chosen)) WITH ORDINALITY AS f(value, ord)),
                 '[]'::jsonb))
        INTO v_assessment;
    END IF;
  END IF;

  -- Gaps from the chosen assessment AND the register, every state; the model
  -- itself decides which are outstanding.
  SELECT COALESCE(jsonb_agg(x.gap), '[]'::jsonb) INTO v_gaps
  FROM (
    SELECT jsonb_build_object(
             'source', 'assessment', 'domainCode', g.domain_code, 'severity', g.severity, 'state', g.state,
             'actions', COALESCE((
               SELECT jsonb_agg(jsonb_build_object('id', a.id, 'ownerUserId', a.owner_user_id,
                                                   'dueDate', to_char(a.due_date, 'YYYY-MM-DD'), 'status', a.status)
                                ORDER BY a.created_at, a.id)
               FROM public.gap_actions a
               WHERE a.organization_id = p_organization_id AND a.gap_id = g.id), '[]'::jsonb)) AS gap
    FROM public.assessment_gaps g
    WHERE g.organization_id = p_organization_id AND g.assessment_id = v_chosen
    UNION ALL
    SELECT jsonb_build_object(
             'source', 'ropa', 'gapCode', g.gap_code, 'severity', g.severity, 'state', g.state,
             'actions', COALESCE((
               SELECT jsonb_agg(jsonb_build_object('id', a.id, 'ownerUserId', a.owner_user_id,
                                                   'dueDate', to_char(a.due_date, 'YYYY-MM-DD'), 'status', a.status)
                                ORDER BY a.created_at, a.id)
               FROM public.gap_actions a
               WHERE a.organization_id = p_organization_id AND a.ropa_gap_id = g.id), '[]'::jsonb))
    FROM public.ropa_gaps g
    WHERE g.organization_id = p_organization_id
  ) x;

  -- The scope (`scopeFacts`). Never saved = unknown on every fact (D-026, D-073.3).
  SELECT s.* INTO v_scope FROM public.organization_scopes s WHERE s.organization_id = p_organization_id;
  v_saved := v_scope.organization_id IS NOT NULL;

  SELECT app.exposure_strongest(
           ARRAY[v_scope.children_data]
           || COALESCE((SELECT array_agg(d.includes_children) FROM public.data_principal_types d WHERE d.organization_id = p_organization_id), ARRAY[]::text[])
           || COALESCE((SELECT array_agg(s.processes_children_data) FROM public.systems s WHERE s.organization_id = p_organization_id), ARRAY[]::text[]))
    INTO v_children;

  -- The larger of the organisation's estimate and the Data Principal types' sum.
  SELECT greatest(
           COALESCE((SELECT o.data_principal_count_estimate FROM public.organizations o WHERE o.id = p_organization_id), 0),
           COALESCE((SELECT sum(COALESCE(d.estimated_count, 0)) FROM public.data_principal_types d WHERE d.organization_id = p_organization_id), 0))
    INTO v_principals;

  v_input := jsonb_build_object(
    'today', to_char(p_today, 'YYYY-MM-DD'),
    -- 1.1.0: a breach clock is hours — the instant the snapshot is taken.
    'now', app.iso_instant(now()),
    'basis', v_basis,
    'assessment', v_assessment,
    'gaps', v_gaps,
    'scope', jsonb_build_object(
      'childrenData', CASE WHEN v_saved THEN v_children ELSE 'unknown' END,
      'guardianData', CASE WHEN v_saved THEN v_scope.guardian_data ELSE 'unknown' END,
      'sensitiveDocuments', CASE WHEN v_saved THEN v_scope.sensitive_documents ELSE 'unknown' END,
      'largeScale', v_principals >= app.exposure_large_scale_threshold(),
      'locationUnknown', NOT v_saved
        OR v_scope.cross_border = 'unknown'
        OR EXISTS (SELECT 1 FROM public.systems s WHERE s.organization_id = p_organization_id AND s.data_location = 'unknown')
        OR EXISTS (SELECT 1 FROM public.vendors v WHERE v.organization_id = p_organization_id AND v.cross_border = 'unknown')),
    'register', jsonb_build_object(
      'childrenData', COALESCE((SELECT jsonb_agg(r.children_data ORDER BY r.record_code) FROM public.ropa_records r
                                WHERE r.organization_id = p_organization_id AND r.status <> 'archived'), '[]'::jsonb),
      'crossBorder', COALESCE((SELECT jsonb_agg(r.cross_border ORDER BY r.record_code) FROM public.ropa_records r
                               WHERE r.organization_id = p_organization_id AND r.status <> 'archived'), '[]'::jsonb)),
    'sdf', jsonb_build_object('notifiedOn',
      (SELECT to_char(o.sdf_notified_on, 'YYYY-MM-DD') FROM public.organizations o WHERE o.id = p_organization_id)),
    -- 1.1.0: every incident in the breach register, as `readBreachFacts` reads
    -- it — raw facts; the model decides what they mean.
    'breaches', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
               'status', b.status,
               'awareAt', app.iso_instant(b.aware_at),
               'boardReportDueAt', app.iso_instant(b.board_report_due_at),
               'boardReportAt', app.iso_instant(b.board_report_at),
               'principalsIntimatedAt', app.iso_instant(b.principals_intimated_at)) ORDER BY b.aware_at, b.id)
      FROM public.breach_incidents b
      WHERE b.organization_id = p_organization_id), '[]'::jsonb),
    -- 1.2.0: every request and grievance in the rights register, as
    -- `readRightsFacts` reads it — raw facts; the model decides what they mean.
    'rights', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
               'kind', r.kind,
               'status', r.status,
               'receivedOn', to_char(r.received_on, 'YYYY-MM-DD')) ORDER BY r.received_on, r.id)
      FROM public.rights_requests r
      WHERE r.organization_id = p_organization_id), '[]'::jsonb),
    -- 1.3.0: each principal's latest consent record, where it is on behalf of a
    -- child or a ward — what `consent_register_facts` returns to the TS reader.
    'consents', app.consent_model_facts(p_organization_id),
    -- 1.4.0: every vendor in the register, as `readVendorFacts` reads it — its
    -- role, the contract's tri-states, and the review-by date of its latest
    -- ACCEPTED assessment; the model decides what they mean.
    'vendors', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
               'role', v.vendor_role,
               'contractExists', v.contract_exists,
               'dpdpClauses', v.dpdp_clauses,
               'assessmentReviewBy', (
                 SELECT to_char(a.review_by, 'YYYY-MM-DD')
                 FROM public.vendor_assessments a
                 WHERE a.organization_id = v.organization_id AND a.vendor_id = v.id AND a.status = 'accepted'
                 ORDER BY a.version DESC
                 LIMIT 1)) ORDER BY lower(v.name), v.id)
      FROM public.vendors v
      WHERE v.organization_id = p_organization_id), '[]'::jsonb));

  RETURN jsonb_build_object('input', v_input, 'assessmentId', v_chosen, 'scoreSnapshotId', v_snapshot);
END;
$$;

REVOKE ALL ON FUNCTION app.exposure_evaluate_head(jsonb, text), app.exposure_input(uuid, date) FROM PUBLIC;


-- ===========================================================================
-- (10) Apply-time assertions
-- ===========================================================================

DO $$
DECLARE
  v_fn text;
BEGIN
  -- The questionnaire.
  ASSERT (SELECT count(*) FROM app.vendor_questions()) = 45, 'forty-five questions';
  ASSERT (SELECT count(*) FROM app.vendor_questions() WHERE weight > 0) = 44, 'forty-four scored';
  ASSERT (SELECT string_agg(code, ',' ORDER BY ord) FROM app.vendor_questions() WHERE needs_document) = 'A3,A4,C4,D2,G1',
    'five answers need a document';
  ASSERT app.vendor_answer_valid('A4', 'partial', false, NULL) AND NOT app.vendor_answer_valid('A3', 'partial', false, NULL),
    'partial only where the question allows it';
  ASSERT app.vendor_answer_valid('E2', 'india', false, NULL) AND NOT app.vendor_answer_valid('E2', 'mars', false, NULL),
    'a select answer is one of its options';
  ASSERT app.vendor_answer_valid('D3', NULL, true, 'No sub-processors') AND NOT app.vendor_answer_valid('D3', NULL, true, ' '),
    'not applicable, with a reason';
  ASSERT NOT app.vendor_answer_valid('A1', NULL, true, 'x'), 'an unscored question is never not applicable';
  ASSERT NOT app.vendor_answer_valid('Z9', 'yes', false, NULL), 'only the bank''s questions';
  ASSERT (SELECT row(m.*)::text FROM app.vendor_review_months() m) = '(12,36)', 'the review months';
  -- Written only by the functions.
  FOREACH v_fn IN ARRAY ARRAY['INSERT', 'UPDATE', 'DELETE'] LOOP
    ASSERT NOT has_table_privilege('authenticated', 'public.vendor_assessments', v_fn), 'assessments: no ' || v_fn;
    ASSERT NOT has_table_privilege('authenticated', 'public.vendor_assessment_answers', v_fn), 'answers: no ' || v_fn;
  END LOOP;
  ASSERT NOT has_table_privilege('anon', 'public.vendor_assessments', 'SELECT'), 'anon reads nothing';
  FOREACH v_fn IN ARRAY ARRAY[
    'public.start_vendor_assessment(uuid, uuid)',
    'public.save_vendor_assessment(uuid, uuid, text, jsonb)',
    'public.submit_vendor_assessment(uuid, uuid)',
    'public.review_vendor_assessment(uuid, uuid, text, text, date)',
    'public.discard_vendor_assessment(uuid, uuid)'] LOOP
    ASSERT NOT has_function_privilege('anon', v_fn, 'EXECUTE'), v_fn || ': anon may not execute it';
    ASSERT has_function_privilege('authenticated', v_fn, 'EXECUTE'), v_fn || ': a signed-in user may (it checks the permission itself)';
  END LOOP;
  -- No existing assessment yet; every vendor's new dates are empty.
  ASSERT NOT EXISTS (SELECT 1 FROM public.vendors WHERE contract_signed_on IS NOT NULL OR contract_review_by IS NOT NULL), 'new columns start empty';
  -- The model.
  ASSERT app.exposure_model_version() = '1.4.0', 'model 1.4.0';
  ASSERT (SELECT count(*) FROM app.exposure_module_inputs()) = 9, 'nine module rows in 1.4.0';
  ASSERT (SELECT string_agg(code || ':' || head || ':' || effect, ',' ORDER BY ord) FROM app.exposure_module_inputs() WHERE register = 'Processor register')
         = 'vendor_contract_missing:H1:not_mitigated,vendor_contract_missing:H7:not_mitigated,vendor_assessment_out_of_date:H1:reason,vendor_assessment_out_of_date:H7:reason',
    'the processor register''s rows';
END;
$$;
