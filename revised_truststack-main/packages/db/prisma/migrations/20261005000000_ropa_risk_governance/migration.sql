-- Slice 7, third migration — risk governance for a production launch (D-067).
--
-- The platform launches live, with no pilot to calibrate against. Two things
-- make a derived risk rating defensible from day one:
--
--   * Every rating names the RULES that produced it: `risk_model_version`,
--     stamped by the derivation. A later recalibration bumps the version and
--     re-derives in its own migration; an export or a report (Slice 9) can
--     always say which model a rating came from.
--   * An assessor who RAISES a rating says why: `risk_rating_assessor_reason`
--     is required whenever `risk_rating_assessor` is set (a CHECK), and cleared
--     when the raise is withdrawn. Lowering stays impossible (D-061).
--
-- The earlier migrations are applied and frozen; functions are redefined from
-- their latest bodies (20261004000000_ropa_dpdp_structure).

-- AlterTable
ALTER TABLE "ropa_records" ADD COLUMN     "risk_model_version" TEXT NOT NULL DEFAULT '1.0.0',
ADD COLUMN     "risk_rating_assessor_reason" TEXT;

-- The version of the risk rules — bump it, and re-derive every row in the
-- same migration, whenever a factor, a point value or a threshold changes.
CREATE OR REPLACE FUNCTION app.ropa_risk_model_version()
RETURNS text
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = ''
AS $$
  SELECT '1.0.0';
$$;

REVOKE ALL ON FUNCTION app.ropa_risk_model_version() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app.ropa_risk_model_version() TO authenticated;

-- The derivation, from its D-065 body, stamping the version.
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
  -- D-067: which rules produced the rating, and an assessor's raise carries its reason.
  r.risk_model_version := app.ropa_risk_model_version();
  IF r.risk_rating_assessor IS NULL THEN
    r.risk_rating_assessor_reason := NULL;
  END IF;
  RETURN r;
END;
$$;

-- The record trigger, from its D-065 body: the reason is content.
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
      NEW.child_exemption, NEW.child_tracking, NEW.retention_trigger, NEW.retention_law, NEW.safeguards,
      NEW.risk_rating_assessor_reason
    ) IS DISTINCT FROM (
      OLD.name, OLD.description, OLD.department_id, OLD.department_text, OLD.owner_user_id,
      OLD.data_principal_types, OLD.data_categories, OLD.estimated_data_principals, OLD.purpose,
      OLD.legal_basis_note, OLD.collection_source, OLD.systems_text, OLD.vendors_text, OLD.sharing,
      OLD.retention_rule, OLD.security_safeguards, OLD.notice_linked, OLD.consent_linked,
      OLD.rights_workflow, OLD.grievance_linked, OLD.children_data, OLD.cross_border,
      OLD.ai_processing, OLD.high_risk_documents, OLD.evidence_note, OLD.last_reviewed_at,
      OLD.next_review_at, OLD.risk_rating_assessor, OLD.lawful_basis, OLD.child_parental_consent,
      OLD.child_exemption, OLD.child_tracking, OLD.retention_trigger, OLD.retention_law, OLD.safeguards,
      OLD.risk_rating_assessor_reason
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

-- Import, from its D-065 body: a raise from the file carries its reason.
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
        next_review_at, lawful_basis, retention_trigger, retention_law, risk_rating_assessor_reason
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
        NULLIF(v_row ->> 'retention_law', ''),
        NULLIF(v_row ->> 'risk_rating_assessor_reason', '')
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

-- A raise that predates this migration carries the reason it came with.
UPDATE public.ropa_records
SET risk_rating_assessor_reason = 'Raised before reasons were recorded; please state the reason.'
WHERE risk_rating_assessor IS NOT NULL AND risk_rating_assessor_reason IS NULL;

-- Re-derive every row so each carries the model version.
UPDATE public.ropa_records SET vendor_contract_gaps = vendor_contract_gaps;

ALTER TABLE public.ropa_records
  ADD CONSTRAINT ropa_records_raise_has_reason CHECK (
    risk_rating_assessor IS NULL
    OR (risk_rating_assessor_reason IS NOT NULL AND btrim(risk_rating_assessor_reason) <> '')),
  ADD CONSTRAINT ropa_records_reason_needs_raise CHECK (risk_rating_assessor IS NOT NULL OR risk_rating_assessor_reason IS NULL),
  ADD CONSTRAINT ropa_records_reason_length CHECK (char_length(risk_rating_assessor_reason) <= 2000),
  ADD CONSTRAINT ropa_records_model_version_check CHECK (risk_model_version ~ '^\d+\.\d+\.\d+$');

GRANT INSERT (risk_rating_assessor_reason) ON public.ropa_records TO authenticated;
GRANT UPDATE (risk_rating_assessor_reason) ON public.ropa_records TO authenticated;

DO $$
BEGIN
  ASSERT app.ropa_risk_model_version() = '1.0.0', 'risk model 1.0.0';
  ASSERT NOT EXISTS (SELECT 1 FROM public.ropa_records WHERE risk_model_version <> app.ropa_risk_model_version()),
    'every row carries the current model';
END;
$$;
