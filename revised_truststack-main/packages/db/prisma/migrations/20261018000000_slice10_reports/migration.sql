-- Slice 10, Stage 6 — the three stakeholder reports and the evidence index's
-- last two link types (SLICE_10 §7d, D-097).
--
-- (1) Three report kinds, all PDF, all recording a fresh exposure snapshot
--     first (SLICE_10 §4.7), on the Slice 9 store unchanged — `begin_report`,
--     `complete_report` and `fail_report` read the kinds from
--     `app.report_kinds()`, so widening that function and the kind/format
--     CHECK is all the store needs:
--       security_breach     — for the CISO: the breach register, the Rule 7
--                             clocks, head 2's position;
--       legal_position      — for counsel: rights and grievance, notice and
--                             consent, retention, heads 3 and 7; the AI
--                             register only as an enabling note;
--       processor_exposure  — for procurement: the processor register, its
--                             assessments, contract gaps, heads 1 and 7.
-- (2) Two evidence link types deferred to this stage: `breach_incident`
--     (D-081.13 — the Board's intimations, the notice to the people affected)
--     and `rights_request` (D-083 — the response sent). Attaching is work on
--     the register (breach.write, rights.write), refused on a breach
--     dismissed as not a breach or a request entered in error, as adding an
--     action is; detaching is refused while the breach is closed or
--     dismissed, or the request responded, withdrawn or void — each register's
--     own rule, "reopen it to change it".
--
-- (3) Exposure model 1.6.0 (Aniket's change at the Stage 6 gate, D-098): a
--     breach recorded and not dismissed makes head 2 assessed.
--
-- Additive — functions and triggers replaced, two CHECKs widened, nothing
-- revoked — so it may go to hosted before the merge, at Stage 6's approval.

-- ===========================================================================
-- (1) The kinds — mirrors packages/core/src/reports.ts (REPORT_KIND_DEFINITIONS)
-- ===========================================================================
-- `tests/unit/report-store.test.ts` parses this block (the newest definition)
-- and fails if a kind, its format, whether it records an exposure snapshot,
-- or its file name differs from core.

CREATE OR REPLACE FUNCTION app.report_kinds()
RETURNS TABLE (kind text, format text, records_exposure boolean, per_owner boolean, file_slug text)
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = ''
AS $$
  VALUES
    ('exposure_brief',     'pdf',  true,  false, 'DPDP_Exposure_Brief'),
    ('programme_status',   'pdf',  true,  false, 'Programme_Status_Report'),
    ('owner_action_pack',  'pdf',  false, true,  'Owner_Action_Pack'),
    ('evidence_pack',      'pdf',  true,  false, 'Regulator_Ready_Evidence_Pack'),
    ('gap_action_tracker', 'xlsx', false, false, 'Gap_and_Action_Tracker'),
    ('ropa_register',      'xlsx', false, false, 'ROPA_Register'),
    ('evidence_index',     'xlsx', false, false, 'Evidence_Index'),
    ('security_breach',    'pdf',  true,  false, 'Security_and_Breach_Report'),
    ('legal_position',     'pdf',  true,  false, 'Legal_Position_Report'),
    ('processor_exposure', 'pdf',  true,  false, 'Processor_Exposure_Report');
$$;

REVOKE ALL ON FUNCTION app.report_kinds() FROM PUBLIC;

ALTER TABLE public.reports DROP CONSTRAINT reports_kind_format_check;
ALTER TABLE public.reports
  ADD CONSTRAINT reports_kind_format_check CHECK ((kind, format) IN (
    ('exposure_brief', 'pdf'), ('programme_status', 'pdf'), ('owner_action_pack', 'pdf'), ('evidence_pack', 'pdf'),
    ('gap_action_tracker', 'xlsx'), ('ropa_register', 'xlsx'), ('evidence_index', 'xlsx'),
    ('security_breach', 'pdf'), ('legal_position', 'pdf'), ('processor_exposure', 'pdf')));


-- ===========================================================================
-- (2) Evidence link types — `breach_incident` and `rights_request`
-- ===========================================================================
-- Each function is its 20261017000000_retention_ai_risk body with the two new
-- branches and nothing else changed. Neither type re-derives anything (the
-- after-insert and after-delete triggers act only on an answer or a record).

ALTER TABLE public.evidence_links DROP CONSTRAINT evidence_links_entity_type_check;
ALTER TABLE public.evidence_links
  ADD CONSTRAINT evidence_links_entity_type_check
    CHECK (linked_entity_type IN ('assessment_response', 'gap_action', 'ropa_record', 'vendor', 'retention_schedule', 'ai_system',
                                  'breach_incident', 'rights_request'));

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
  ELSIF NEW.linked_entity_type = 'retention_schedule' THEN
    PERFORM 1
    FROM public.retention_schedules s
    WHERE s.id = NEW.linked_entity_id AND s.organization_id = NEW.organization_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Schedule not found.' USING ERRCODE = 'TS404';
    END IF;
    -- Attaching an erasure certificate is work on the retention register.
    IF v_actor IS NOT NULL AND NOT app.has_permission(NEW.organization_id, 'retention.write') THEN
      RAISE EXCEPTION 'You do not have permission to change the retention register.' USING ERRCODE = 'TS403';
    END IF;
  ELSIF NEW.linked_entity_type = 'ai_system' THEN
    PERFORM 1
    FROM public.ai_systems a
    WHERE a.id = NEW.linked_entity_id AND a.organization_id = NEW.organization_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'AI system not found.' USING ERRCODE = 'TS404';
    END IF;
    -- Attaching a review is work on the AI risk register (ropa.write, D-094.2).
    IF v_actor IS NOT NULL AND NOT app.has_permission(NEW.organization_id, 'ropa.write') THEN
      RAISE EXCEPTION 'You do not have permission to change the AI risk register.' USING ERRCODE = 'TS403';
    END IF;
  ELSIF NEW.linked_entity_type = 'breach_incident' THEN
    SELECT b.status INTO v_status
    FROM public.breach_incidents b
    WHERE b.id = NEW.linked_entity_id AND b.organization_id = NEW.organization_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Breach not found.' USING ERRCODE = 'TS404';
    END IF;
    -- As an action (add_breach_action): a breach dismissed as not a personal
    -- data breach is a record. Reopen it to add to it.
    IF v_status = 'dismissed' THEN
      RAISE EXCEPTION 'This breach was dismissed as not a personal data breach — reopen it to attach a document.' USING ERRCODE = 'TS409';
    END IF;
    -- Attaching the Board's intimations or a notice to the people affected is work on the breach register.
    IF v_actor IS NOT NULL AND NOT app.has_permission(NEW.organization_id, 'breach.write') THEN
      RAISE EXCEPTION 'You do not have permission to change this breach.' USING ERRCODE = 'TS403';
    END IF;
  ELSIF NEW.linked_entity_type = 'rights_request' THEN
    SELECT r.status INTO v_status
    FROM public.rights_requests r
    WHERE r.id = NEW.linked_entity_id AND r.organization_id = NEW.organization_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Request not found.' USING ERRCODE = 'TS404';
    END IF;
    -- As an action (add_rights_action): a request entered in error is void. Reopen it to add to it.
    IF v_status = 'void' THEN
      RAISE EXCEPTION 'This request was entered in error — reopen it to attach a document.' USING ERRCODE = 'TS409';
    END IF;
    -- Attaching the response sent is work on the rights register.
    IF v_actor IS NOT NULL AND NOT app.has_permission(NEW.organization_id, 'rights.write') THEN
      RAISE EXCEPTION 'You do not have permission to change this request.' USING ERRCODE = 'TS403';
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

  -- Stage 6: a closed breach stands on its intimations, and a dismissed one is
  -- a record (the breach register's own rule: reopen it to change it). The
  -- organisation's own deletion removes everything, as for a vendor.
  IF OLD.linked_entity_type = 'breach_incident' THEN
    SELECT b.status INTO v_status
    FROM public.breach_incidents b
    WHERE b.id = OLD.linked_entity_id AND b.organization_id = OLD.organization_id;
    v_target_exists := FOUND;
    IF v_target_exists AND v_evidence_exists AND v_status IN ('closed', 'dismissed')
       AND EXISTS (SELECT 1 FROM public.organizations o WHERE o.id = OLD.organization_id) THEN
      RAISE EXCEPTION 'This breach is % — reopen it before detaching its documents.', v_status USING ERRCODE = 'TS409';
    END IF;
    RETURN OLD;
  END IF;

  -- Stage 6: a responded, withdrawn or void request is a record, and a
  -- response stands on what was sent (the rights register's own rule).
  IF OLD.linked_entity_type = 'rights_request' THEN
    SELECT r.status INTO v_status
    FROM public.rights_requests r
    WHERE r.id = OLD.linked_entity_id AND r.organization_id = OLD.organization_id;
    v_target_exists := FOUND;
    IF v_target_exists AND v_evidence_exists AND v_status IN ('responded', 'withdrawn', 'void')
       AND EXISTS (SELECT 1 FROM public.organizations o WHERE o.id = OLD.organization_id) THEN
      RAISE EXCEPTION 'This request is % — reopen it before detaching its documents.', v_status USING ERRCODE = 'TS409';
    END IF;
    RETURN OLD;
  END IF;

  -- Stage 5: no approval stands on a schedule's or an AI system's documents.
  IF OLD.linked_entity_type IN ('retention_schedule', 'ai_system') THEN
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


-- ===========================================================================
-- (3) Exposure model 1.6.0 — Aniket's change at Stage 6 (D-098)
-- ===========================================================================
-- "Any recorded, non-dismissed breach counts as assessed for head 2." A new
-- module row `breach_recorded` (effect `assessed`: the head is no longer "Not
-- yet assessed"; nothing else). Mirrors packages/core/src/exposure.ts. Each
-- function is its 20261017000000_retention_ai_risk body with only the 1.6.0
-- changes; 1.5.0 stays in that migration as applied (D-074: an applied rule
-- never changes under the same version).

CREATE OR REPLACE FUNCTION app.exposure_model_version()
RETURNS text
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = ''
AS $$
  SELECT '1.6.0'::text;
$$;

-- §6.2b, with the 1.6.0 row. `ord` is core's MODULE_INPUTS order: a fact read
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
     '{n} processors'' accepted assessments are past their review-by dates (a TrustStack default, not a statutory period).'),
    (10, 'retention_overdue', 'H7', 's.8(7), Rule 8(3)', 'exposed', 'Retention register',
     'A retention schedule past its end date with no erasure recorded',
     '1 retention schedule is past its end date with no erasure recorded (s.8(7)).',
     '{n} retention schedules are past their end dates with no erasure recorded (s.8(7)).'),
    (11, 'retention_end_unrecorded', 'H7', 's.8(7)', 'reason', 'Retention register',
     'A retention schedule with no end date recorded',
     '1 retention schedule has no end date recorded, so its erasure cannot be shown to follow (s.8(7)).',
     '{n} retention schedules have no end date recorded, so their erasure cannot be shown to follow (s.8(7)).'),
    (12, 'ai_system_unreviewed', 'H4', 'Rule 13(3); twelve months is a TrustStack default', 'reason', 'AI risk register',
     'An AI system in use with no review recorded in the last twelve months',
     '1 AI system in use has no review recorded in the last twelve months (Rule 13(3) due diligence; the interval is a TrustStack default).',
     '{n} AI systems in use have no review recorded in the last twelve months (Rule 13(3) due diligence; the interval is a TrustStack default).'),
    (13, 'breach_recorded', 'H2', 's.8(6), Rule 7', 'assessed', 'Breach register',
     'A personal data breach recorded and not dismissed',
     '1 personal data breach is recorded in the breach register (s.8(6), Rule 7), so this head is assessed from it.',
     '{n} personal data breaches are recorded in the breach register (s.8(6), Rule 7), so this head is assessed from them.');
$$;

REVOKE ALL ON FUNCTION app.exposure_model_version(), app.exposure_module_inputs() FROM PUBLIC;
REVOKE ALL ON FUNCTION app.ai_review_months() FROM PUBLIC;

-- The evaluator, from its 1.5.0 body with the 1.6.0 rule: a breach recorded and
-- not dismissed is counted, and an `assessed` row that holds takes the head out
-- of "Not yet assessed". Everything else is unchanged, word for word.
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
  -- 1.6.0: a recorded breach assesses head 2.
  v_n_breach_recorded integer;
  v_module_assesses boolean;
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
  -- 1.5.0: the retention register and the AI risk register.
  v_n_retention_overdue integer;
  v_n_retention_no_end integer;
  v_n_ai_unreviewed integer;
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

  -- --- The workflow modules' facts (core `moduleInputCounts`, `recentBreachCount`) — 1.1.0 to 1.5.0
  -- A breach dismissed as not a personal data breach never counts. "Overdue"
  -- is strictly after the due instant: exactly 72 hours is still in time.
  -- The repetition window is 24 calendar months ending today, both ends
  -- included, the awareness dated in India.
  SELECT count(*) FILTER (WHERE jsonb_typeof(b.value -> 'boardReportAt') IS DISTINCT FROM 'string'
                            AND v_now > (b.value ->> 'boardReportDueAt')::timestamptz),
         count(*) FILTER (WHERE jsonb_typeof(b.value -> 'principalsIntimatedAt') IS DISTINCT FROM 'string'),
         count(*) FILTER (WHERE ((b.value ->> 'awareAt')::timestamptz AT TIME ZONE 'Asia/Kolkata')::date
                                  BETWEEN (v_today - make_interval(months => app.exposure_repetition_window_months()))::date AND v_today),
         count(*)
    INTO v_n_board_overdue, v_n_principals_pending, v_n_recent, v_n_breach_recorded
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
  -- 1.5.0: the retention register (core `retentionOverdue`, `retentionEndUnrecorded`):
  -- erased for the current cycle = an erasure on or after the clock started
  -- (any, when none has); overdue strictly after the end date.
  SELECT count(*) FILTER (WHERE jsonb_typeof(x.value -> 'endsOn') = 'string'
                            AND v_today > (x.value ->> 'endsOn')::date AND NOT x.erased),
         count(*) FILTER (WHERE jsonb_typeof(x.value -> 'endsOn') IS DISTINCT FROM 'string' AND NOT x.erased)
    INTO v_n_retention_overdue, v_n_retention_no_end
  FROM (
    SELECT r.value,
           jsonb_typeof(r.value -> 'lastErasedOn') = 'string'
             AND (jsonb_typeof(r.value -> 'startsOn') IS DISTINCT FROM 'string'
                  OR (r.value ->> 'lastErasedOn')::date >= (r.value ->> 'startsOn')::date) AS erased
    FROM jsonb_array_elements(COALESCE(p_input -> 'retention', '[]'::jsonb)) r(value)
  ) x;
  -- 1.5.0: the AI risk register (core `aiSystemUnreviewed`): in use, and no review
  -- recorded, or the last one more than twelve months ago (strictly after).
  SELECT count(*) FILTER (WHERE a.value ->> 'status' = 'in_use'
                            AND (jsonb_typeof(a.value -> 'lastReviewedOn') IS DISTINCT FROM 'string'
                                 OR v_today > ((a.value ->> 'lastReviewedOn')::date + make_interval(months => app.ai_review_months()))::date))
    INTO v_n_ai_unreviewed
  FROM jsonb_array_elements(COALESCE(p_input -> 'aiSystems', '[]'::jsonb)) a(value);
  v_counts := jsonb_build_object('breach_board_overdue', v_n_board_overdue, 'breach_principals_pending', v_n_principals_pending,
                                 'rights_ceiling_overdue', v_n_rights_ceiling, 'rights_target_overdue', v_n_rights_target,
                                 'child_consent_unverified', v_n_consent_unverified,
                                 'vendor_contract_missing', v_n_vendor_contract,
                                 'vendor_assessment_out_of_date', v_n_vendor_out_of_date,
                                 'retention_overdue', v_n_retention_overdue,
                                 'retention_end_unrecorded', v_n_retention_no_end,
                                 'ai_system_unreviewed', v_n_ai_unreviewed,
                                 'breach_recorded', v_n_breach_recorded);
  SELECT COALESCE(bool_or(m.effect = 'exposed' AND (v_counts ->> m.code)::integer > 0), false),
         COALESCE(bool_or(m.effect = 'not_mitigated' AND (v_counts ->> m.code)::integer > 0), false),
         COALESCE(bool_or(m.effect IN ('exposed', 'assessed') AND (v_counts ->> m.code)::integer > 0), false)
    INTO v_module_exposes, v_module_bars, v_module_assesses
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

  IF v_unanswered AND v_n_register_direct = 0 AND NOT v_module_assesses THEN
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

REVOKE ALL ON FUNCTION app.exposure_evaluate_head(jsonb, text) FROM PUBLIC;
