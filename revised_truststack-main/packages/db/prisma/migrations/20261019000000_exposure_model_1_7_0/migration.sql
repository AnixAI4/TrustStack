-- Slice 10.5, Batch B4 — exposure model 1.7.0 (Q1, D-104.1): the forecast
-- counts every open action.
--
-- Breach, rights and retention actions hang on their register's record, not on
-- a gap row (D-067, `gap_actions_one_parent`), so `app.exposure_input` left them
-- out and the forecast, "Critical and high work" and the Programme Status
-- disagreed with the Actions page. Now:
--
-- (1) `app.exposure_input` adds `registerActions` — every action on a breach, a
--     request or grievance, and a retention schedule, with the severity and
--     state the Actions page gives it;
-- (2) `app.exposure_outstanding_work` counts each one that is still owed (its
--     record stands and it is not closed) as one unit, critical and high apart;
-- (3) `app.exposure_model_version()` says 1.7.0.
--
-- `app.exposure_evaluate_head` is NOT replaced: no head reads the new input, so
-- every status, position and leverage weight is unchanged (D-104.1: "penalty-
-- head leverage rules are unchanged"). Mirrors packages/core/src/exposure.ts and
-- intelligence.ts (`outstandingWork`); `tests/rls/exposure-mirror.test.ts` holds
-- the two together. Stored snapshots are immutable: those already taken keep
-- 1.6.0 (D-074).
--
-- Functions only — no table, grant or revoke change — so it is applied to hosted
-- right after the merge's production deploy (D-071 runbook, SLICE_10_5 §3.4).

-- ===========================================================================
-- (1) The version
-- ===========================================================================

CREATE OR REPLACE FUNCTION app.exposure_model_version()
RETURNS text
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = ''
AS $$
  SELECT '1.7.0'::text;
$$;

REVOKE ALL ON FUNCTION app.exposure_model_version() FROM PUBLIC;


-- ===========================================================================
-- (2) The input — its 20261017000000_retention_ai_risk body plus `registerActions`
-- ===========================================================================

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
    -- 1.7.0 (Q1): every action on a breach, a request or grievance, and a
    -- retention schedule — no gap row, so each carries the severity and state
    -- the Actions page gives it (`breachItems`, `rightsItems`, `retentionItems`):
    -- a breach its own severity, superseded once dismissed; a grievance high, a
    -- request medium, superseded once void; a schedule high while past its end
    -- with no erasure that counts for this cycle, else medium. Outstanding work
    -- only — no head reads them.
    'registerActions', COALESCE((
      SELECT jsonb_agg(x.action ORDER BY x.created_at, x.id)
      FROM (
        SELECT a.created_at, a.id, jsonb_build_object(
                 'source', 'breach', 'severity', b.severity,
                 'state', CASE WHEN b.status = 'dismissed' THEN 'superseded' ELSE 'open' END,
                 'id', a.id, 'ownerUserId', a.owner_user_id, 'dueDate', to_char(a.due_date, 'YYYY-MM-DD'), 'status', a.status) AS action
        FROM public.gap_actions a
        JOIN public.breach_incidents b ON b.organization_id = a.organization_id AND b.id = a.breach_incident_id
        WHERE a.organization_id = p_organization_id
        UNION ALL
        SELECT a.created_at, a.id, jsonb_build_object(
                 'source', 'rights', 'severity', CASE WHEN r.kind = 'grievance' THEN 'high' ELSE 'medium' END,
                 'state', CASE WHEN r.status = 'void' THEN 'superseded' ELSE 'open' END,
                 'id', a.id, 'ownerUserId', a.owner_user_id, 'dueDate', to_char(a.due_date, 'YYYY-MM-DD'), 'status', a.status)
        FROM public.gap_actions a
        JOIN public.rights_requests r ON r.organization_id = a.organization_id AND r.id = a.rights_request_id
        WHERE a.organization_id = p_organization_id
        UNION ALL
        SELECT a.created_at, a.id, jsonb_build_object(
                 'source', 'retention',
                 'severity', CASE WHEN s.ends_on IS NOT NULL AND p_today > s.ends_on
                                       AND NOT COALESCE((
                                         SELECT max(e.erased_on) >= s.starts_on
                                         FROM public.retention_erasures e
                                         WHERE e.organization_id = s.organization_id AND e.retention_schedule_id = s.id
                                           AND e.processors_told <> 'no'
                                           AND NOT EXISTS (
                                             SELECT 1 FROM public.retention_erasure_voids v
                                             WHERE v.organization_id = e.organization_id AND v.retention_erasure_id = e.id)), false)
                                  THEN 'high' ELSE 'medium' END,
                 'state', 'open',
                 'id', a.id, 'ownerUserId', a.owner_user_id, 'dueDate', to_char(a.due_date, 'YYYY-MM-DD'), 'status', a.status)
        FROM public.gap_actions a
        JOIN public.retention_schedules s ON s.organization_id = a.organization_id AND s.id = a.retention_schedule_id
        WHERE a.organization_id = p_organization_id
      ) x), '[]'::jsonb),
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
      WHERE v.organization_id = p_organization_id), '[]'::jsonb),
    -- 1.5.0: every schedule in the retention register, as `readRetentionFacts`
    -- reads it — its start, its derived end and its latest erasure that COUNTS:
    -- the processors told or none held it (s.8(7)(b)), not marked in error (D-096).
    'retention', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
               'startsOn', to_char(s.starts_on, 'YYYY-MM-DD'),
               'endsOn', to_char(s.ends_on, 'YYYY-MM-DD'),
               'lastErasedOn', (
                 SELECT to_char(max(x.erased_on) FILTER (
                          WHERE x.processors_told <> 'no'
                            AND NOT EXISTS (
                              SELECT 1 FROM public.retention_erasure_voids v
                              WHERE v.organization_id = x.organization_id AND v.retention_erasure_id = x.id)), 'YYYY-MM-DD')
                 FROM public.retention_erasures x
                 WHERE x.organization_id = s.organization_id AND x.retention_schedule_id = s.id)) ORDER BY s.created_at, s.id)
      FROM public.retention_schedules s
      WHERE s.organization_id = p_organization_id), '[]'::jsonb),
    -- 1.5.0: every row of the AI risk register — its status and last review.
    'aiSystems', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
               'status', a.status,
               'lastReviewedOn', to_char(a.last_reviewed_on, 'YYYY-MM-DD')) ORDER BY a.created_at, a.id)
      FROM public.ai_systems a
      WHERE a.organization_id = p_organization_id), '[]'::jsonb));

  RETURN jsonb_build_object('input', v_input, 'assessmentId', v_chosen, 'scoreSnapshotId', v_snapshot);
END;
$$;

-- ===========================================================================
-- (3) Units of work still owed (core `outstandingWork`)
-- ===========================================================================
-- Each outstanding gap counts its actions not closed, or one if it has none
-- yet (unchanged); and (1.7.0) each register action counts one while its
-- record stands and it is not closed.

CREATE OR REPLACE FUNCTION app.exposure_outstanding_work(p_input jsonb)
RETURNS TABLE (critical_high integer, all_work integer)
LANGUAGE sql
IMMUTABLE
SET search_path = ''
AS $$
  WITH outstanding AS (
    SELECT g.value ->> 'severity' AS severity,
           greatest(1, (SELECT count(*) FROM jsonb_array_elements(g.value -> 'actions') a(value)
                        WHERE a.value ->> 'status' <> 'closed'))::integer AS units
    FROM jsonb_array_elements(p_input -> 'gaps') g(value)
    WHERE g.value ->> 'state' = 'open'
      AND (jsonb_array_length(g.value -> 'actions') = 0
           OR EXISTS (SELECT 1 FROM jsonb_array_elements(g.value -> 'actions') a(value) WHERE a.value ->> 'status' <> 'closed'))
    UNION ALL
    SELECT r.value ->> 'severity', 1
    FROM jsonb_array_elements(COALESCE(p_input -> 'registerActions', '[]'::jsonb)) r(value)
    WHERE r.value ->> 'state' = 'open' AND r.value ->> 'status' <> 'closed'
  )
  SELECT COALESCE(sum(units) FILTER (WHERE severity IN ('critical', 'high')), 0)::integer,
         COALESCE(sum(units), 0)::integer
  FROM outstanding;
$$;

REVOKE ALL ON FUNCTION app.exposure_input(uuid, date), app.exposure_outstanding_work(jsonb) FROM PUBLIC;


-- ===========================================================================
-- (4) Apply-time assertions
-- ===========================================================================

DO $$
BEGIN
  ASSERT app.exposure_model_version() = '1.7.0', 'the model is 1.7.0';
  ASSERT (SELECT all_work FROM app.exposure_outstanding_work(
            '{"gaps": [], "registerActions": [{"source": "breach", "severity": "high", "state": "open", "status": "open"},
                                              {"source": "rights", "severity": "medium", "state": "superseded", "status": "open"},
                                              {"source": "retention", "severity": "medium", "state": "open", "status": "closed"}]}'::jsonb)) = 1,
         'a register action counts while its record stands and it is not closed';
  ASSERT (SELECT critical_high FROM app.exposure_outstanding_work(
            '{"gaps": [], "registerActions": [{"source": "breach", "severity": "high", "state": "open", "status": "open"}]}'::jsonb)) = 1,
         'a high register action is critical and high work';
  ASSERT (SELECT all_work FROM app.exposure_outstanding_work('{"gaps": []}'::jsonb)) = 0,
         'an input from before 1.7.0 (a stored test fixture) still reads';
END;
$$;
