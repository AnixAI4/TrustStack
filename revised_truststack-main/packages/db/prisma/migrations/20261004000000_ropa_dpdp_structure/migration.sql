-- Slice 7, second migration — the DPDP structure of a processing record.
--
-- The first migration (20261003000000_ropa) is applied to the hosted project
-- and frozen. Everything here is additive or a CREATE OR REPLACE from the
-- latest body of the function it redefines.
--
-- Why: a register that does not know a record's LAWFUL GROUND raises false
-- gaps — it asked every record for a notice and consent, although s.5 and s.6
-- apply to consent, and payroll runs on the employment legitimate use
-- (s.7(i)). Children's data was one yes/no; the Act's duties are parental
-- consent (s.9(1), Rule 10) and no tracking or targeted advertising (s.9(3)),
-- each lifted only by a Fourth Schedule exemption (Rule 12). Retention was
-- free text; s.8(7) and Rule 8 need what ends it, and the law when a law
-- requires keeping the data. Rule 6 lists a minimum of safeguards. And s.8(2)
-- allows a Data Processor only under a valid contract — which the vendor
-- register already records, and a record never showed.
--
-- Every choice here is a NOTE FOR COUNSEL, never a legal opinion (D-011).
--
-- Layout: (1) columns; (2) vocabularies and rules in SQL — mirrors
-- packages/core/src/ropa.ts; (3) the derivation, factored into
-- app.ropa_derive(); (4) processor contracts read from the vendor register;
-- (5) the record trigger, with the 12-month review cycle; (6) ROPA gaps — 15
-- rules; (7) import; (8) audit; (9) grants; (10) re-derive every row, then
-- the constraints; (11) apply-time assertions.
--
-- Decisions: D-065 (the DPDP structure), D-066 (templates, the s.11 summary,
-- impact lookup, the review cycle).

-- ===========================================================================
-- (1) Columns
-- ===========================================================================

-- AlterTable
ALTER TABLE "ropa_records" ADD COLUMN     "child_exemption" TEXT,
ADD COLUMN     "child_parental_consent" TEXT NOT NULL DEFAULT 'unknown',
ADD COLUMN     "child_tracking" TEXT NOT NULL DEFAULT 'unknown',
ADD COLUMN     "lawful_basis" TEXT,
ADD COLUMN     "retention_law" TEXT,
ADD COLUMN     "retention_trigger" TEXT,
ADD COLUMN     "safeguards" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "vendor_contract_gaps" INTEGER NOT NULL DEFAULT 0;

-- The constraints and functions whose arguments change are dropped here and
-- re-created in (10), after every row has been re-derived.
ALTER TABLE public.ropa_records
  DROP CONSTRAINT ropa_records_missing_is_derived,
  DROP CONSTRAINT ropa_records_factors_are_derived;
ALTER TABLE public.ropa_gaps DROP CONSTRAINT ropa_gaps_code_check;

DROP FUNCTION app.ropa_missing_areas(text, uuid, text, uuid, text, text, text, text, text, text, integer, text, integer, text, text, text, text, date, integer);
DROP FUNCTION app.ropa_risk_factors(text, integer, text, text, integer, text, text, text, text, integer, uuid, date);
DROP FUNCTION app.ropa_record_gap_codes(text, uuid, text[], text, integer, text, text, text, text, date, date);


-- ===========================================================================
-- (2) Vocabularies and rules — mirrors packages/core/src/ropa.ts
-- ===========================================================================

-- The ground an activity relies on: consent (s.6), the nine legitimate uses
-- (s.7(a)–(i)), or the s.17 exemption.
CREATE OR REPLACE FUNCTION app.ropa_lawful_bases()
RETURNS text[]
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = ''
AS $$
  SELECT ARRAY['consent', 'voluntary', 'state_benefit', 'state_function', 'legal_obligation', 'court_order',
               'medical_emergency', 'public_health', 'disaster', 'employment', 'exempt']::text[];
$$;

-- A notice accompanies a request for consent (s.5, Rule 3); a s.7(b) benefit
-- needs the Second Schedule's intimation. UNDECIDED counts as required (D-026).
CREATE OR REPLACE FUNCTION app.ropa_notice_required(p_basis text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = ''
AS $$
  SELECT p_basis IS NULL OR p_basis = ANY (ARRAY['consent', 'state_benefit']::text[]);
$$;

CREATE OR REPLACE FUNCTION app.ropa_consent_required(p_basis text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = ''
AS $$
  SELECT p_basis IS NULL OR p_basis = ANY (ARRAY['consent']::text[]);
$$;

-- The Fourth Schedule's exemptions (Rule 12), Part A then Part B.
CREATE OR REPLACE FUNCTION app.ropa_child_exemptions()
RETURNS text[]
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = ''
AS $$
  SELECT ARRAY['clinical', 'allied_health', 'education', 'creche', 'school_transport', 'child_law_function',
               'child_state_benefit', 'email_account', 'location_safety', 'harmful_content', 'age_check']::text[];
$$;

-- What ends the retention (s.8(7), s.8(8), Rule 8).
CREATE OR REPLACE FUNCTION app.ropa_retention_triggers()
RETURNS text[]
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = ''
AS $$
  SELECT ARRAY['purpose_served', 'consent_withdrawn', 'law_requires', 'third_schedule']::text[];
$$;

-- Rule 6(1)'s minimum safeguards; (f) is read from the linked vendors.
CREATE OR REPLACE FUNCTION app.ropa_safeguard_codes()
RETURNS text[]
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = ''
AS $$
  SELECT ARRAY['encryption', 'access_control', 'logging', 'backups', 'log_retention', 'organisational']::text[];
$$;

-- Approving a record schedules its next review this many months out (D-066).
CREATE OR REPLACE FUNCTION app.ropa_review_cycle_months()
RETURNS integer
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = ''
AS $$
  SELECT 12;
$$;

-- Which areas a record is still missing, in the model's order. Four areas
-- sharpen (D-065): purpose needs a lawful GROUND; notice and consent only
-- where the ground needs them; retention needs what ends it, and the law when
-- a law requires keeping the data; security may be ticked against Rule 6.
CREATE OR REPLACE FUNCTION app.ropa_missing_areas(
  p_name text,
  p_department_id uuid,
  p_department_text text,
  p_owner_user_id uuid,
  p_data_principal_types text,
  p_data_categories text,
  p_purpose text,
  p_lawful_basis text,
  p_collection_source text,
  p_systems_text text,
  p_system_link_count integer,
  p_vendors_text text,
  p_vendor_link_count integer,
  p_notice_linked text,
  p_consent_linked text,
  p_retention_rule text,
  p_retention_trigger text,
  p_retention_law text,
  p_security_safeguards text,
  p_safeguards text[],
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
    CASE WHEN NOT (app.ropa_text_complete(p_purpose) AND p_lawful_basis IS NOT NULL) THEN 'purpose_basis' END,
    CASE WHEN NOT app.ropa_text_complete(p_collection_source) THEN 'collection_source' END,
    CASE WHEN NOT (p_system_link_count > 0 OR app.ropa_text_complete(p_systems_text)) THEN 'systems' END,
    CASE WHEN NOT (p_vendor_link_count > 0 OR app.ropa_text_complete(p_vendors_text)) THEN 'vendors' END,
    CASE WHEN NOT ((NOT app.ropa_notice_required(p_lawful_basis) OR app.ropa_text_complete(p_notice_linked))
                   AND (NOT app.ropa_consent_required(p_lawful_basis) OR app.ropa_text_complete(p_consent_linked)))
         THEN 'notice_consent' END,
    CASE WHEN NOT (app.ropa_text_complete(p_retention_rule) AND p_retention_trigger IS NOT NULL
                   AND (p_retention_trigger <> 'law_requires' OR app.ropa_text_complete(p_retention_law)))
         THEN 'retention' END,
    CASE WHEN NOT (COALESCE(cardinality(p_safeguards), 0) > 0 OR app.ropa_text_complete(p_security_safeguards))
         THEN 'security' END,
    CASE WHEN p_next_review_at IS NULL THEN 'risk_review' END,
    CASE WHEN NOT (p_evidence_count > 0) THEN 'evidence' END
  ]::text[], NULL);
$$;

-- The risk factors, unchanged but for one: a missing notice is a risk only
-- where the ground needs a notice.
CREATE OR REPLACE FUNCTION app.ropa_risk_factors(
  p_children_data text,
  p_estimated_data_principals integer,
  p_high_risk_documents text,
  p_vendors_text text,
  p_vendor_link_count integer,
  p_cross_border text,
  p_ai_processing text,
  p_lawful_basis text,
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
    CASE WHEN app.ropa_notice_required(p_lawful_basis) AND NOT app.ropa_text_complete(p_notice_linked) THEN 'no_notice' END,
    CASE WHEN NOT app.ropa_text_complete(p_retention_rule) THEN 'no_retention' END,
    CASE WHEN NOT (p_evidence_count > 0) THEN 'no_security_evidence' END,
    CASE WHEN p_owner_user_id IS NULL OR p_next_review_at IS NULL THEN 'no_owner_or_review' END
  ]::text[], NULL);
$$;

REVOKE ALL ON FUNCTION
  app.ropa_lawful_bases(), app.ropa_notice_required(text), app.ropa_consent_required(text),
  app.ropa_child_exemptions(), app.ropa_retention_triggers(), app.ropa_safeguard_codes(),
  app.ropa_review_cycle_months(),
  app.ropa_missing_areas(text, uuid, text, uuid, text, text, text, text, text, text, integer, text, integer, text, text, text, text, text, text, text[], date, integer),
  app.ropa_risk_factors(text, integer, text, text, integer, text, text, text, text, text, integer, uuid, date)
FROM PUBLIC;
GRANT EXECUTE ON FUNCTION
  app.ropa_lawful_bases(), app.ropa_notice_required(text), app.ropa_consent_required(text),
  app.ropa_child_exemptions(), app.ropa_retention_triggers(), app.ropa_safeguard_codes(),
  app.ropa_review_cycle_months(),
  app.ropa_missing_areas(text, uuid, text, uuid, text, text, text, text, text, text, integer, text, integer, text, text, text, text, text, text, text[], date, integer),
  app.ropa_risk_factors(text, integer, text, text, integer, text, text, text, text, text, integer, uuid, date)
TO authenticated;


-- ===========================================================================
-- (3) The derivation, in one place
-- ===========================================================================
-- Completeness and risk from the row itself. The record trigger calls it
-- before the lifecycle (approval needs the score) and after (approval may set
-- the next review date). The CHECKs in (10) refuse any row it did not produce.

CREATE OR REPLACE FUNCTION app.ropa_derive(r public.ropa_records)
RETURNS public.ropa_records
LANGUAGE plpgsql
IMMUTABLE
SET search_path = ''
AS $$
BEGIN
  r.completeness_missing := app.ropa_missing_areas(
    r.name, r.department_id, r.department_text, r.owner_user_id, r.data_principal_types,
    r.data_categories, r.purpose, r.lawful_basis, r.collection_source, r.systems_text,
    r.system_link_count, r.vendors_text, r.vendor_link_count, r.notice_linked, r.consent_linked,
    r.retention_rule, r.retention_trigger, r.retention_law, r.security_safeguards, r.safeguards,
    r.next_review_at, r.evidence_count);
  r.completeness_score := app.ropa_completeness_score(r.completeness_missing);
  r.completeness_band := app.ropa_band(r.completeness_score);
  r.risk_factors := app.ropa_risk_factors(
    r.children_data, r.estimated_data_principals, r.high_risk_documents, r.vendors_text,
    r.vendor_link_count, r.cross_border, r.ai_processing, r.lawful_basis, r.notice_linked,
    r.retention_rule, r.evidence_count, r.owner_user_id, r.next_review_at);
  r.risk_points := app.ropa_risk_points(r.risk_factors);
  r.risk_rating_derived := app.ropa_risk_rating(r.risk_points);
  r.risk_rating := app.ropa_effective_risk(r.risk_rating_derived, r.risk_rating_assessor);
  RETURN r;
END;
$$;

REVOKE ALL ON FUNCTION app.ropa_derive(public.ropa_records) FROM PUBLIC;


-- ===========================================================================
-- (4) Processor contracts, read from the vendor register (s.8(2), Rule 6(1)(f))
-- ===========================================================================
-- A linked vendor that is (or may be) a Data Processor needs a contract with
-- DPDP clauses. The vendor register already records both; the record keeps a
-- COUNT of the linked vendors that fall short, maintained here — when a link
-- is made or removed, and when a vendor's contract status changes.

CREATE OR REPLACE FUNCTION app.ropa_vendor_contract_gaps(p_organization_id uuid, p_record_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT count(*)::integer
  FROM public.ropa_vendors rv
  JOIN public.vendors v ON v.id = rv.vendor_id AND v.organization_id = rv.organization_id
  WHERE rv.organization_id = p_organization_id
    AND rv.ropa_record_id = p_record_id
    AND v.vendor_role <> 'independent'
    AND (v.contract_exists <> 'yes' OR v.dpdp_clauses <> 'yes');
$$;

REVOKE ALL ON FUNCTION app.ropa_vendor_contract_gaps(uuid, uuid) FROM PUBLIC;

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
          WHERE v.organization_id = r.organization_id AND v.ropa_record_id = r.id),
        vendor_contract_gaps = app.ropa_vendor_contract_gaps(r.organization_id, r.id)
    WHERE r.id = v_record_id AND r.organization_id = v_organization_id;
  END IF;
  RETURN NULL;
END;
$$;
REVOKE ALL ON FUNCTION app.ropa_link_after_write() FROM PUBLIC;

-- A vendor's contract status changed: every record it is linked to recounts.
CREATE OR REPLACE FUNCTION app.ropa_vendor_after_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.ropa_records r
  SET vendor_contract_gaps = app.ropa_vendor_contract_gaps(r.organization_id, r.id)
  WHERE r.organization_id = NEW.organization_id
    AND r.id IN (SELECT rv.ropa_record_id FROM public.ropa_vendors rv
                 WHERE rv.organization_id = NEW.organization_id AND rv.vendor_id = NEW.id);
  RETURN NULL;
END;
$$;

REVOKE ALL ON FUNCTION app.ropa_vendor_after_update() FROM PUBLIC;

CREATE TRIGGER vendors_ropa_contract_gaps
  AFTER UPDATE OF vendor_role, contract_exists, dpdp_clauses ON public.vendors
  FOR EACH ROW EXECUTE FUNCTION app.ropa_vendor_after_update();


-- ===========================================================================
-- (5) The record trigger — from the Slice 7 body, with the derivation moved
--     into app.ropa_derive(), the new columns in "content", and the review
--     cycle on approval (D-066)
-- ===========================================================================

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
      NEW.next_review_at, NEW.risk_rating_assessor, NEW.lawful_basis, NEW.child_parental_consent,
      NEW.child_exemption, NEW.child_tracking, NEW.retention_trigger, NEW.retention_law, NEW.safeguards
    ) IS DISTINCT FROM (
      OLD.name, OLD.description, OLD.department_id, OLD.department_text, OLD.owner_user_id,
      OLD.data_principal_types, OLD.data_categories, OLD.estimated_data_principals, OLD.purpose,
      OLD.legal_basis_note, OLD.collection_source, OLD.systems_text, OLD.vendors_text, OLD.sharing,
      OLD.retention_rule, OLD.security_safeguards, OLD.notice_linked, OLD.consent_linked,
      OLD.rights_workflow, OLD.grievance_linked, OLD.children_data, OLD.cross_border,
      OLD.ai_processing, OLD.high_risk_documents, OLD.evidence_note, OLD.last_reviewed_at,
      OLD.next_review_at, OLD.risk_rating_assessor, OLD.lawful_basis, OLD.child_parental_consent,
      OLD.child_exemption, OLD.child_tracking, OLD.retention_trigger, OLD.retention_law, OLD.safeguards
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

  -- Derive. Always — whoever writes (app.ropa_derive, below).
  NEW := app.ropa_derive(NEW);

  -- An assessor may RAISE the rating, never lower it (D-039's direction).
  -- Checked when the assessor's rating is set; if the derived floor later
  -- rises above it, the floor simply wins.
  IF NEW.risk_rating_assessor IS NOT NULL
     AND (TG_OP = 'INSERT' OR NEW.risk_rating_assessor IS DISTINCT FROM OLD.risk_rating_assessor)
     AND app.ropa_risk_rank(NEW.risk_rating_assessor) < app.ropa_risk_rank(NEW.risk_rating_derived) THEN
    RAISE EXCEPTION 'An assessor may raise a record''s risk rating, never lower it below the derived rating (%).',
      NEW.risk_rating_derived USING ERRCODE = 'TS422';
  END IF;

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
      -- D-066: the next review is a year out, unless a sooner one is already set.
      IF NEW.next_review_at IS NULL OR NEW.next_review_at <= NEW.last_reviewed_at THEN
        NEW.next_review_at := (NEW.last_reviewed_at + make_interval(months => app.ropa_review_cycle_months()))::date;
      END IF;
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

  -- The lifecycle may have set a review date: derive again, so the stored
  -- numbers are always those of the row as stored.
  NEW := app.ropa_derive(NEW);
  RETURN NEW;
END;
$$;

-- ===========================================================================
-- (6) ROPA gaps — fifteen rules
-- ===========================================================================
-- The spec's twelve, with "children's data without review" replaced by the
-- Act's two duties (s.9(1) parental consent, s.9(3) no tracking), and two
-- more the Act names: a processor without a valid contract (s.8(2)) and the
-- Rule 6 minimum not confirmed. Notice and consent gaps open only where the
-- ground needs them.

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
    ('purpose_missing', 'high', 'Purpose or lawful ground undecided', 'State the purpose, and choose the ground it relies on — consent or a legitimate use — for counsel to confirm.'),
    ('vendor_unmapped', 'medium', 'Vendor not mapped', 'Link the Data Processors involved to the vendor register.'),
    ('processor_contract_missing', 'high', 'Processor without a valid contract', 'Put a contract with DPDP and security clauses in place with each linked Data Processor (s.8(2), Rule 6(1)(f)).'),
    ('notice_missing', 'high', 'No notice linked', 'Link the notice that itemises this data and its purpose (s.5, Rule 3).'),
    ('consent_missing', 'medium', 'Consent capture not recorded', 'Record how consent is captured and how it can be withdrawn as easily as it was given.'),
    ('retention_missing', 'high', 'Retention or erasure undecided', 'Record how long the data is kept, what ends it, and the law if one requires keeping it (s.8(7), Rule 8).'),
    ('safeguards_missing', 'high', 'No safeguards recorded', 'Record the security safeguards that protect this data.'),
    ('rule6_unconfirmed', 'medium', 'Rule 6 minimum safeguards not confirmed', 'Confirm each Rule 6 minimum safeguard is in place — encryption, access control, logs, backups, one-year log retention, organisational measures.'),
    ('child_consent_missing', 'critical', 'No verifiable parental consent', 'Obtain verifiable consent of a parent before processing a child''s data (s.9(1), Rule 10), or record the Fourth Schedule exemption that applies.'),
    ('child_tracking', 'critical', 'Children may be tracked or targeted', 'Stop tracking, behavioural monitoring and targeted advertising of children (s.9(3)), or record the Fourth Schedule exemption that applies.'),
    ('ai_unreviewed', 'high', 'AI processing not reviewed', 'Review the AI or automated processing and approve the record.'),
    ('review_overdue', 'medium', 'Review overdue', 'Review the record and set its next review date.');
$$;

-- The gaps ONE record opens on p_today. An archived record opens none.
CREATE OR REPLACE FUNCTION app.ropa_record_gap_codes(
  p_status text,
  p_owner_user_id uuid,
  p_missing text[],
  p_vendors_text text,
  p_vendor_link_count integer,
  p_vendor_contract_gaps integer,
  p_lawful_basis text,
  p_notice_linked text,
  p_consent_linked text,
  p_safeguards text[],
  p_children_data text,
  p_child_parental_consent text,
  p_child_exemption text,
  p_child_tracking text,
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
    CASE WHEN p_vendor_contract_gaps > 0 THEN 'processor_contract_missing' END,
    CASE WHEN app.ropa_notice_required(p_lawful_basis) AND NOT app.ropa_text_complete(p_notice_linked) THEN 'notice_missing' END,
    CASE WHEN app.ropa_consent_required(p_lawful_basis) AND NOT app.ropa_text_complete(p_consent_linked) THEN 'consent_missing' END,
    CASE WHEN 'retention' = ANY (p_missing) THEN 'retention_missing' END,
    CASE WHEN 'security' = ANY (p_missing) THEN 'safeguards_missing' END,
    CASE WHEN NOT ('security' = ANY (p_missing))
              AND NOT (app.ropa_safeguard_codes() <@ COALESCE(p_safeguards, ARRAY[]::text[])) THEN 'rule6_unconfirmed' END,
    CASE WHEN p_children_data <> 'no' AND p_child_exemption IS NULL AND p_child_parental_consent <> 'yes'
         THEN 'child_consent_missing' END,
    CASE WHEN p_children_data <> 'no' AND p_child_exemption IS NULL AND p_child_tracking <> 'no'
         THEN 'child_tracking' END,
    CASE WHEN p_ai_processing <> 'no' AND p_status <> 'approved' THEN 'ai_unreviewed' END,
    CASE WHEN p_next_review_at IS NULL OR p_next_review_at < p_today THEN 'review_overdue' END
  ]::text[], NULL) END;
$$;

REVOKE ALL ON FUNCTION app.ropa_record_gap_codes(text, uuid, text[], text, integer, integer, text, text, text, text[], text, text, text, text, text, date, date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app.ropa_record_gap_codes(text, uuid, text[], text, integer, integer, text, text, text, text[], text, text, text, text, text, date, date) TO authenticated;

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
      l.vendor_contract_gaps, l.lawful_basis, l.notice_linked, l.consent_linked, l.safeguards,
      l.children_data, l.child_parental_consent, l.child_exemption, l.child_tracking,
      l.ai_processing, l.next_review_at, (now() AT TIME ZONE 'Asia/Kolkata')::date)) AS c(code)
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

-- "Children's data not reviewed" is replaced by the two duties. An existing
-- gap of the old kind becomes the consent one (same severity); its action,
-- and any work on it, is kept. The next regeneration settles the rest.
UPDATE public.ropa_gaps SET gap_code = 'child_consent_missing' WHERE gap_code = 'children_unreviewed';


-- ===========================================================================
-- (7) Import — from the Slice 7 body, with the three new optional columns
-- ===========================================================================

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
        next_review_at, lawful_basis, retention_trigger, retention_law
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
        (v_row ->> 'next_review_at')::date,
        NULLIF(v_row ->> 'lawful_basis', ''),
        NULLIF(v_row ->> 'retention_trigger', ''),
        NULLIF(v_row ->> 'retention_law', '')
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

-- ===========================================================================
-- (8) Audit — from the Slice 7 body: the contract count is derived, never an
--     edit; the lawful ground is logged (a code, not free text)
-- ===========================================================================

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
                        'vendor_link_count', 'evidence_count',
                        -- D-065: counted from the vendor register, never an edit
                        'vendor_contract_gaps')
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
      'riskRating', v_row ->> 'risk_rating',
      -- D-065
      'lawfulBasis', v_row ->> 'lawful_basis'
    ))
  );
  RETURN NULL;
END;
$$;

-- ===========================================================================
-- (9) Grants — the new content columns, and nothing derived
-- ===========================================================================

GRANT INSERT (lawful_basis, child_parental_consent, child_exemption, child_tracking, retention_trigger,
  retention_law, safeguards) ON public.ropa_records TO authenticated;
GRANT UPDATE (lawful_basis, child_parental_consent, child_exemption, child_tracking, retention_trigger,
  retention_law, safeguards) ON public.ropa_records TO authenticated;


-- ===========================================================================
-- (10) Re-derive every row, then the constraints
-- ===========================================================================
-- The touch fires the record trigger, which re-derives completeness and risk
-- under the new rules and recounts the processor contracts. It is tooling (no
-- JWT): not audited, and not an edit — content is unchanged, so an approved
-- record stays approved.

UPDATE public.ropa_records r
SET vendor_contract_gaps = app.ropa_vendor_contract_gaps(r.organization_id, r.id);

ALTER TABLE public.ropa_records
  ADD CONSTRAINT ropa_records_lawful_basis_check
    CHECK (lawful_basis IS NULL OR lawful_basis = ANY (app.ropa_lawful_bases())),
  ADD CONSTRAINT ropa_records_child_check CHECK (
    child_parental_consent IN ('yes', 'no', 'unknown') AND child_tracking IN ('yes', 'no', 'unknown')
    AND (child_exemption IS NULL OR child_exemption = ANY (app.ropa_child_exemptions()))),
  ADD CONSTRAINT ropa_records_retention_trigger_check
    CHECK (retention_trigger IS NULL OR retention_trigger = ANY (app.ropa_retention_triggers())),
  ADD CONSTRAINT ropa_records_safeguards_check
    CHECK (COALESCE(safeguards, ARRAY[]::text[]) <@ app.ropa_safeguard_codes()),
  ADD CONSTRAINT ropa_records_retention_law_length CHECK (char_length(retention_law) <= 2000),
  ADD CONSTRAINT ropa_records_contract_gaps_check CHECK (vendor_contract_gaps >= 0),
  ADD CONSTRAINT ropa_records_missing_is_derived CHECK (
    completeness_missing = app.ropa_missing_areas(
      name, department_id, department_text, owner_user_id, data_principal_types, data_categories,
      purpose, lawful_basis, collection_source, systems_text, system_link_count, vendors_text,
      vendor_link_count, notice_linked, consent_linked, retention_rule, retention_trigger, retention_law,
      security_safeguards, safeguards, next_review_at, evidence_count)),
  ADD CONSTRAINT ropa_records_factors_are_derived CHECK (
    risk_factors = app.ropa_risk_factors(
      children_data, estimated_data_principals, high_risk_documents, vendors_text, vendor_link_count,
      cross_border, ai_processing, lawful_basis, notice_linked, retention_rule, evidence_count,
      owner_user_id, next_review_at));

ALTER TABLE public.ropa_gaps
  ADD CONSTRAINT ropa_gaps_code_check CHECK (gap_code IN (
    'no_records', 'no_owner', 'categories_missing', 'purpose_missing', 'vendor_unmapped',
    'processor_contract_missing', 'notice_missing', 'consent_missing', 'retention_missing',
    'safeguards_missing', 'rule6_unconfirmed', 'child_consent_missing', 'child_tracking',
    'ai_unreviewed', 'review_overdue'));


-- ===========================================================================
-- (11) Apply-time assertions
-- ===========================================================================

DO $$
BEGIN
  ASSERT array_length(app.ropa_lawful_bases(), 1) = 11, 'consent, nine legitimate uses, s.17';
  ASSERT array_length(app.ropa_child_exemptions(), 1) = 11, 'the Fourth Schedule has eleven exemptions';
  ASSERT array_length(app.ropa_safeguard_codes(), 1) = 6, 'Rule 6(1) minimum, less (f)';
  ASSERT (SELECT count(*) FROM app.ropa_gap_rules()) = 15, 'fifteen ROPA gap rules';
  -- A legitimate use needs no notice and no consent; undecided needs both (D-026).
  ASSERT NOT app.ropa_notice_required('employment') AND NOT app.ropa_consent_required('employment'), 'employment';
  ASSERT app.ropa_notice_required(NULL) AND app.ropa_consent_required(NULL), 'undecided';
  ASSERT app.ropa_notice_required('state_benefit') AND NOT app.ropa_consent_required('state_benefit'), 's.7(b)';
  -- The weights are untouched: still exactly 100.
  ASSERT (SELECT sum(app.ropa_area_weight(a)) FROM unnest(app.ropa_area_codes()) a) = 100, 'weights total 100';
  ASSERT app.ropa_review_cycle_months() = 12, 'a yearly review';
  -- Every row was re-derived under the new rules.
  ASSERT NOT EXISTS (SELECT 1 FROM public.ropa_records WHERE completeness_missing IS DISTINCT FROM app.ropa_missing_areas(
      name, department_id, department_text, owner_user_id, data_principal_types, data_categories,
      purpose, lawful_basis, collection_source, systems_text, system_link_count, vendors_text,
      vendor_link_count, notice_linked, consent_linked, retention_rule, retention_trigger, retention_law,
      security_safeguards, safeguards, next_review_at, evidence_count)), 'every row re-derived';
END;
$$;
