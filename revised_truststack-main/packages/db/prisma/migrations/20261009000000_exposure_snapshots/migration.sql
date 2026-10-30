-- Slice 9, Stage 2 — exposure history: the exposure model 1.0.0 in SQL, and
-- the snapshots it alone may write (SLICE_09 §4.1, §7, D-072.1).
--
-- WHY A SECOND COPY OF THE MODEL. The live view is `exposureFor` in
-- packages/core (fast, testable). A STORED snapshot is evidence of where the
-- organisation stood on a date — every report records one (Stage 3) — so,
-- exactly as a finalised score (D-052, D-053), it is derived HERE by one
-- SECURITY DEFINER function that takes an organisation id and nothing else.
-- A client can never store numbers it chose.
--
-- HOW THE TWO ARE HELD TOGETHER.
--   * The model's data (heads, mapping, thresholds, points, forecast
--     constants, version) is in small IMMUTABLE functions below;
--     `tests/unit/exposure-mirror.test.ts` parses them and fails if any row
--     differs from core.
--   * The model's logic is `app.exposure_evaluate(input jsonb)`, a pure
--     function over core's own `ExposureInput` shape; the RLS suite feeds the
--     same generated inputs to it and to `exposureFor` and fails on any
--     difference — statuses, positions, reasons, word for word.
--   * The inputs are gathered by `app.exposure_input`, which reads exactly
--     what the API's readers read; the e2e suite proves a stored snapshot
--     equals the live model at that moment.
--   Any rule change goes in both places and bumps the model version.
--
-- Additive: new functions, one new table, one new RPC. Nothing is revoked.

-- ===========================================================================
-- (1) The model's data — mirrors packages/core/src/exposure.ts + forecast.ts
-- ===========================================================================

CREATE OR REPLACE FUNCTION app.exposure_model_version()
RETURNS text
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = ''
AS $$
  SELECT '1.0.0'::text;
$$;

-- 13 May 2027: Rules 3, 5–16, 22 and 23 commence. Every head uses it until
-- counsel confirms which provisions take effect on which date.
CREATE OR REPLACE FUNCTION app.exposure_deadline()
RETURNS date
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = ''
AS $$
  SELECT DATE '2027-05-13';
$$;

-- The Schedule's seven heads (s.33(1)). Ceilings in rupees; H6 has none of
-- its own. H5 and H6 are listed and never evaluated.
CREATE OR REPLACE FUNCTION app.exposure_heads()
RETURNS TABLE (code text, serial integer, title text, provision text, ceiling_rupees bigint, modelled boolean)
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = ''
AS $$
  VALUES
    ('H1', 1, 'Reasonable security safeguards to prevent a personal data breach', 's.8(5)', 2500000000::bigint, true),
    ('H2', 2, 'Notice of a personal data breach to the Board and to affected Data Principals', 's.8(6)', 2000000000::bigint, true),
    ('H3', 3, 'Additional obligations for children''s data (and persons with disability who have a lawful guardian)', 's.9', 2000000000::bigint, true),
    ('H4', 4, 'Additional obligations of a Significant Data Fiduciary', 's.10', 1500000000::bigint, true),
    ('H5', 5, 'Duties of a Data Principal', 's.15', 10000::bigint, false),
    ('H6', 6, 'Breach of a voluntary undertaking accepted by the Board', 's.32', NULL::bigint, false),
    ('H7', 7, 'Any other provision of the Act or the Rules', 'Any other provision', 500000000::bigint, true);
$$;

-- What evidences each head (§6.2). One row per DIRECT link (with its
-- provision) and one per head an ENABLING control explains (provision NULL).
-- `ord` is core's DOMAIN_CODES order.
CREATE OR REPLACE FUNCTION app.exposure_domain_links()
RETURNS TABLE (ord integer, domain_code text, kind text, head text, provision text)
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = ''
AS $$
  VALUES
    (1,  'GOV',         'enabling', 'H1', NULL::text),
    (1,  'GOV',         'enabling', 'H2', NULL),
    (1,  'GOV',         'enabling', 'H3', NULL),
    (1,  'GOV',         'enabling', 'H4', NULL),
    (1,  'GOV',         'enabling', 'H7', NULL),
    (2,  'INV',         'enabling', 'H1', NULL),
    (2,  'INV',         'enabling', 'H2', NULL),
    (2,  'INV',         'enabling', 'H7', NULL),
    (3,  'ROPA',        'enabling', 'H1', NULL),
    (3,  'ROPA',        'enabling', 'H7', NULL),
    (4,  'PURPOSE',     'direct',   'H7', 's.4, s.7'),
    (5,  'NOTICE',      'direct',   'H7', 's.5, Rule 3'),
    (6,  'CONSENT',     'direct',   'H7', 's.6'),
    (7,  'RIGHTS',      'direct',   'H7', 's.11–14, Rule 14'),
    (8,  'GRIEVANCE',   'direct',   'H7', 's.8(9)–(10), Rules 9 and 14(3)'),
    (9,  'RETENTION',   'direct',   'H7', 's.8(7)–(8), Rule 8'),
    (10, 'ACCURACY',    'direct',   'H7', 's.8(3)'),
    (11, 'SECURITY',    'direct',   'H1', 's.8(5), Rule 6(1)'),
    (12, 'BREACH',      'direct',   'H2', 's.8(6), Rule 7'),
    (13, 'VENDOR',      'direct',   'H1', 's.8(5), Rule 6(1)(f)'),
    (13, 'VENDOR',      'direct',   'H7', 's.8(2)'),
    (14, 'CHILD',       'direct',   'H3', 's.9, Rules 10–11'),
    (15, 'CROSSBORDER', 'enabling', 'H1', NULL),
    (15, 'CROSSBORDER', 'enabling', 'H7', NULL),
    (16, 'SDF_AI',      'direct',   'H4', 's.10(2), Rule 13');
$$;

-- The same for the register's gap rules. `ord` is core's ROPA_GAP_CODES order.
CREATE OR REPLACE FUNCTION app.exposure_rule_links()
RETURNS TABLE (ord integer, gap_code text, kind text, head text, provision text)
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = ''
AS $$
  VALUES
    (1,  'no_records',                 'enabling', 'H1', NULL::text),
    (1,  'no_records',                 'enabling', 'H2', NULL),
    (1,  'no_records',                 'enabling', 'H7', NULL),
    (2,  'no_owner',                   'enabling', 'H1', NULL),
    (2,  'no_owner',                   'enabling', 'H7', NULL),
    (3,  'categories_missing',         'enabling', 'H1', NULL),
    (3,  'categories_missing',         'enabling', 'H7', NULL),
    (4,  'purpose_missing',            'direct',   'H7', 's.4, s.7'),
    (5,  'vendor_unmapped',            'enabling', 'H1', NULL),
    (5,  'vendor_unmapped',            'enabling', 'H7', NULL),
    (6,  'processor_contract_missing', 'direct',   'H1', 'Rule 6(1)(f)'),
    (6,  'processor_contract_missing', 'direct',   'H7', 's.8(2)'),
    (7,  'notice_missing',             'direct',   'H7', 's.5, Rule 3'),
    (8,  'consent_missing',            'direct',   'H7', 's.6'),
    (9,  'retention_missing',          'direct',   'H7', 's.8(7), Rule 8'),
    (10, 'safeguards_missing',         'direct',   'H1', 's.8(5)'),
    (11, 'rule6_unconfirmed',          'direct',   'H1', 'Rule 6(1)'),
    (12, 'child_consent_missing',      'direct',   'H3', 's.9(1), Rule 10'),
    (13, 'child_tracking',             'direct',   'H3', 's.9(3)'),
    (14, 'ai_unreviewed',              'direct',   'H4', 'Rule 13(3)'),
    (15, 'review_overdue',             'enabling', 'H7', NULL);
$$;

-- §6.3: a direct scored domain below 40% → Exposed; every one at or above
-- 60% with confidence at or above 60 (and no critical or high gap) → Mitigated.
CREATE OR REPLACE FUNCTION app.exposure_thresholds()
RETURNS TABLE (exposed_below_percent numeric, mitigated_min_percent numeric, mitigated_min_confidence numeric)
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = ''
AS $$
  VALUES (0.4::numeric, 0.6::numeric, 60::numeric);
$$;

-- §6.4: TrustStack's judgement of how the s.33(2) factors are likely to weigh.
-- The Act names the factors and gives them no weights.
CREATE OR REPLACE FUNCTION app.exposure_position_factors()
RETURNS TABLE (code text, clause text, points integer, unknown_points integer, h3_points integer, h3_unknown_points integer, only_head text)
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = ''
AS $$
  VALUES
    ('children_data',       '(b)', 2,  1::integer,    3::integer,    2::integer,    NULL::text),
    ('sensitive_documents', '(b)', 1,  NULL,          NULL,          NULL,          NULL),
    ('large_scale',         '(a)', 1,  NULL,          NULL,          NULL,          NULL),
    ('location_unknown',    '(a)', 1,  NULL,          NULL,          NULL,          'H1'),
    ('status_exposed',      '(a)', 1,  NULL,          NULL,          NULL,          NULL),
    ('remediation_planned', '(e)', -1, NULL,          NULL,          NULL,          NULL),
    ('evidence_confident',  '(e)', -1, NULL,          NULL,          NULL,          NULL),
    ('repetition',          '(c)', 0,  NULL,          NULL,          NULL,          NULL);
$$;

-- The scope's large-scale processing trigger — INTERNAL, never statutory
-- (D-028). core: DEFAULT_RISK_TRIGGER_CONFIG.largeScaleProcessingThreshold.
CREATE OR REPLACE FUNCTION app.exposure_large_scale_threshold()
RETURNS integer
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = ''
AS $$
  SELECT 100000;
$$;

-- core: FORECAST_CONFIG + FORECAST_PRNG (Park–Miller MINSTD).
CREATE OR REPLACE FUNCTION app.exposure_forecast_config()
RETURNS TABLE (trailing_weeks integer, min_active_weeks integer, simulations integer, seed bigint,
               horizon_weeks integer, p50 numeric, p85 numeric, prng_multiplier bigint, prng_modulus bigint)
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = ''
AS $$
  VALUES (8, 2, 1000, 20270513::bigint, 260, 0.5::numeric, 0.85::numeric, 48271::bigint, 2147483647::bigint);
$$;

-- Strongest of several tri-state facts: any yes → yes; else any unknown → unknown; else no.
CREATE OR REPLACE FUNCTION app.exposure_strongest(p_values text[])
RETURNS text
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = ''
AS $$
  SELECT CASE
    WHEN 'yes' = ANY (p_values) THEN 'yes'
    WHEN 'unknown' = ANY (p_values) THEN 'unknown'
    ELSE 'no'
  END;
$$;

-- core: `${n} ${n === 1 ? one : many}`
CREATE OR REPLACE FUNCTION app.exposure_plural(p_n integer, p_one text, p_many text)
RETURNS text
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = ''
AS $$
  SELECT p_n::text || ' ' || CASE WHEN p_n = 1 THEN p_one ELSE p_many END;
$$;

-- core: pct() — a proportion as a whole percentage. Numerics are exact, so the
-- de-noising core needs for doubles is a no-op here.
CREATE OR REPLACE FUNCTION app.exposure_pct(p numeric)
RETURNS text
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = ''
AS $$
  SELECT round(p * 100)::text || '%';
$$;

REVOKE ALL ON FUNCTION app.exposure_model_version(), app.exposure_deadline(), app.exposure_heads(),
  app.exposure_domain_links(), app.exposure_rule_links(), app.exposure_thresholds(),
  app.exposure_position_factors(), app.exposure_large_scale_threshold(), app.exposure_forecast_config(),
  app.exposure_strongest(text[]), app.exposure_plural(integer, text, text), app.exposure_pct(numeric) FROM PUBLIC;


-- ===========================================================================
-- (2) The model — app.exposure_evaluate(input) mirrors exposureFor(input)
-- ===========================================================================
-- Pure over its argument: the same `ExposureInput` (core's shape, as jsonb)
-- always gives the same output, and nothing here reads a clock. It reads
-- reference data only — the mapping above, the domain names and the register
-- rules' labels.
--
-- Its output per head is the live API's, restricted to what the model DERIVES:
-- code, serial, title, ceilingCrore, applies, status, statusLabel, atStake,
-- position and reasons. The RLS suite compares it with `exposureFor` field by
-- field on generated inputs.

-- VOLATILE only because it stages the input in temporary tables (dropped at
-- commit); it writes nothing else and reads no clock.
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
  v_guardian text := p_input #>> '{scope,guardianData}';
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
BEGIN
  SELECT * INTO v_meta FROM app.exposure_heads() h WHERE h.code = p_head;
  SELECT * INTO v_t FROM app.exposure_thresholds();
  v_ceiling_crore := v_meta.ceiling_rupees / 10000000; -- every modelled ceiling is whole crore

  SELECT app.exposure_strongest(
           ARRAY[p_input #>> '{scope,childrenData}']
           || COALESCE((SELECT array_agg(x) FROM jsonb_array_elements_text(p_input #> '{register,childrenData}') x), ARRAY[]::text[]))
    INTO v_children;

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

  IF v_unanswered AND v_n_register_direct = 0 THEN
    v_status := 'not_yet_assessed';
    v_reasons := v_reasons || jsonb_build_array(jsonb_build_object('kind', 'status', 'text',
      CASE WHEN NOT v_has_assessment
           THEN 'No assessment has been started, and no register gap is open for this head.'
           ELSE 'No question that evidences this head has been answered yet, and no register gap is open for it.' END));
  ELSIF v_n_red_direct > 0 OR v_n_critical > 0 OR v_n_below > 0 THEN
    v_status := 'exposed';
  ELSIF v_n_answered > 0 AND v_n_answered = v_n_evidencing AND v_all_mitigated AND v_n_serious = 0 THEN
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

CREATE OR REPLACE FUNCTION app.exposure_evaluate(p_input jsonb)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_heads jsonb := '[]'::jsonb;
  v_code text;
BEGIN
  FOR v_code IN SELECT h.code FROM app.exposure_heads() h WHERE h.modelled ORDER BY h.serial LOOP
    v_heads := v_heads || jsonb_build_array(app.exposure_evaluate_head(p_input, v_code));
  END LOOP;
  RETURN jsonb_build_object(
    'modelVersion', app.exposure_model_version(),
    'heads', v_heads,
    -- Σ CEILINGS of the heads at stake — a ceiling, never a fine (§6.5).
    'ceilingsAtStakeCrore', (SELECT COALESCE(sum((h.value ->> 'ceilingCrore')::numeric), 0)
                             FROM jsonb_array_elements(v_heads) h(value) WHERE (h.value ->> 'atStake')::boolean),
    'exposedHeads', (SELECT count(*) FROM jsonb_array_elements(v_heads) h(value) WHERE (h.value ->> 'atStake')::boolean),
    'applicableHeads', (SELECT count(*) FROM jsonb_array_elements(v_heads) h(value) WHERE (h.value ->> 'applies')::boolean));
END;
$$;

REVOKE ALL ON FUNCTION app.exposure_evaluate_head(jsonb, text), app.exposure_evaluate(jsonb) FROM PUBLIC;


-- ===========================================================================
-- (3) The inputs — what `readExposureInput` reads, read the same way
-- ===========================================================================
-- Which assessment (decision 2, `pickAssessments`, D-069.1): the newest
-- FINALISED one; else, created after it (all of them when none is
-- finalised), the newest with answers, else the newest. A finalised
-- assessment is read from its SNAPSHOT; anything else live, through the
-- engine's own SQL (`app.assessment_domain_results`). Red flags carry their
-- code, domain and label only — never the question codes that tripped them
-- (D-071).

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
      (SELECT to_char(o.sdf_notified_on, 'YYYY-MM-DD') FROM public.organizations o WHERE o.id = p_organization_id)));

  RETURN jsonb_build_object('input', v_input, 'assessmentId', v_chosen, 'scoreSnapshotId', v_snapshot);
END;
$$;

-- Units of work still owed (core `outstandingWork`): each outstanding gap
-- counts its actions not closed, or one if it has none yet.
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
  )
  SELECT COALESCE(sum(units) FILTER (WHERE severity IN ('critical', 'high')), 0)::integer,
         COALESCE(sum(units), 0)::integer
  FROM outstanding;
$$;

-- Every closure in the organisation, as the date in India — the pace the
-- forecast reads, from either parent and any assessment.
CREATE OR REPLACE FUNCTION app.exposure_closures(p_organization_id uuid)
RETURNS date[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT COALESCE(array_agg((a.closed_at AT TIME ZONE 'Asia/Kolkata')::date ORDER BY a.closed_at), ARRAY[]::date[])
  FROM public.gap_actions a
  WHERE a.organization_id = p_organization_id AND a.closed_at IS NOT NULL;
$$;

REVOKE ALL ON FUNCTION app.exposure_input(uuid, date), app.exposure_outstanding_work(jsonb),
  app.exposure_closures(uuid) FROM PUBLIC;


-- ===========================================================================
-- (4) The forecast — app.exposure_forecast mirrors core `forecast`
-- ===========================================================================
-- Draw for draw: the same Park–Miller generator, the same seed, the same
-- nearest-rank percentiles. Integer arithmetic only, so nothing can drift.

CREATE OR REPLACE FUNCTION app.exposure_forecast(
  p_closed_on date[],
  p_critical_high integer,
  p_all integer,
  p_today date,
  p_deadline date
)
RETURNS jsonb
LANGUAGE plpgsql
IMMUTABLE
SET search_path = ''
AS $$
DECLARE
  c record;
  v_weekly integer[];
  v_active integer;
  v_total integer;
  v_not_enough boolean;
  v_days integer := p_deadline - p_today;
  v_state bigint;
  v_runs_ch integer[] := ARRAY[]::integer[];
  v_runs_all integer[] := ARRAY[]::integer[];
  v_done integer;
  v_week integer;
  v_done_ch integer;
  v_done_all integer;
  v_infinity constant integer := 2147483647;
  v_simulate boolean;
BEGIN
  IF p_critical_high < 0 OR p_all < 0 OR p_critical_high > p_all THEN
    RAISE EXCEPTION 'critical and high work is part of all the work (% of %)', p_critical_high, p_all;
  END IF;
  SELECT * INTO c FROM app.exposure_forecast_config();

  -- Week 0 is the seven days ending today; a future or older closure is not counted.
  SELECT array_agg(COALESCE(n, 0) ORDER BY w) INTO v_weekly
  FROM generate_series(0, c.trailing_weeks - 1) w
  LEFT JOIN (
    SELECT (p_today - d) / 7 AS week, count(*)::integer AS n
    FROM unnest(COALESCE(p_closed_on, ARRAY[]::date[])) d
    WHERE d <= p_today AND (p_today - d) / 7 < c.trailing_weeks
    GROUP BY 1
  ) x ON x.week = w;

  SELECT count(*) FILTER (WHERE n > 0), COALESCE(sum(n), 0) INTO v_active, v_total FROM unnest(v_weekly) n;
  v_not_enough := v_active < c.min_active_weeks;
  v_simulate := NOT (v_not_enough AND p_all > 0);

  IF v_simulate THEN
    v_state := c.seed;
    FOR r IN 1 .. c.simulations LOOP
      v_done := 0;
      v_week := 0;
      v_done_ch := CASE WHEN p_critical_high = 0 THEN 0 END;
      v_done_all := CASE WHEN p_all = 0 THEN 0 END;
      WHILE v_done_all IS NULL AND v_week < c.horizon_weeks LOOP
        v_state := (v_state * c.prng_multiplier) % c.prng_modulus;
        v_done := v_done + v_weekly[(v_state % c.trailing_weeks)::integer + 1];
        v_week := v_week + 1;
        IF v_done_ch IS NULL AND v_done >= p_critical_high THEN v_done_ch := v_week; END IF;
        IF v_done >= p_all THEN v_done_all := v_week; END IF;
      END LOOP;
      v_runs_ch := v_runs_ch || COALESCE(v_done_ch, v_infinity);
      v_runs_all := v_runs_all || COALESCE(v_done_all, v_infinity);
    END LOOP;
  END IF;

  RETURN jsonb_build_object(
    'today', to_char(p_today, 'YYYY-MM-DD'),
    'deadline', to_char(p_deadline, 'YYYY-MM-DD'),
    'daysToDeadline', v_days,
    'weeklyClosures', to_jsonb(v_weekly),
    'activeWeeks', v_active,
    'averagePerWeek', round(round((v_total * 10)::numeric / c.trailing_weeks) / 10, 1),
    'notEnoughHistory', v_not_enough,
    'criticalHigh', app.exposure_projection(p_critical_high, CASE WHEN v_simulate THEN v_runs_ch END, p_today, p_deadline, v_days),
    'all', app.exposure_projection(p_all, CASE WHEN v_simulate THEN v_runs_all END, p_today, p_deadline, v_days),
    'method', 'Resamples the last eight weeks'' closures 1,000 times with a fixed seed; P50 and P85 are the 50th and 85th percentile of the weeks needed. Critical and high work is assumed to be done first.');
END;
$$;

CREATE OR REPLACE FUNCTION app.exposure_projection(
  p_outstanding integer,
  p_runs integer[],
  p_today date,
  p_deadline date,
  p_days integer
)
RETURNS jsonb
LANGUAGE plpgsql
IMMUTABLE
SET search_path = ''
AS $$
DECLARE
  c record;
  v_sorted integer[];
  v_n integer;
  v_p50 integer;
  v_p85 integer;
  v_infinity constant integer := 2147483647;
  v_required numeric;
BEGIN
  SELECT * INTO c FROM app.exposure_forecast_config();
  -- Actions a week to finish by the deadline, one decimal, rounded UP.
  v_required := CASE WHEN p_days <= 0 THEN NULL
                     WHEN p_outstanding = 0 THEN 0
                     ELSE round(ceil((p_outstanding * 70)::numeric / p_days) / 10, 1) END;

  IF p_runs IS NULL THEN
    RETURN jsonb_build_object(
      'outstanding', p_outstanding, 'requiredPerWeek', v_required,
      'p50Weeks', NULL, 'p85Weeks', NULL, 'p50Date', NULL, 'p85Date', NULL,
      'beyondHorizon', jsonb_build_object('p50', false, 'p85', false),
      'meetsDeadline', jsonb_build_object('p50', NULL, 'p85', NULL));
  END IF;

  SELECT array_agg(x ORDER BY x) INTO v_sorted FROM unnest(p_runs) x;
  v_n := cardinality(v_sorted);
  -- Nearest rank: the ⌈p·n⌉-th value.
  v_p50 := v_sorted[least(greatest(ceil(c.p50 * v_n)::integer, 1), v_n)];
  v_p85 := v_sorted[least(greatest(ceil(c.p85 * v_n)::integer, 1), v_n)];

  RETURN jsonb_build_object(
    'outstanding', p_outstanding,
    'requiredPerWeek', v_required,
    'p50Weeks', CASE WHEN v_p50 = v_infinity THEN NULL ELSE v_p50 END,
    'p85Weeks', CASE WHEN v_p85 = v_infinity THEN NULL ELSE v_p85 END,
    'p50Date', CASE WHEN v_p50 = v_infinity THEN NULL ELSE to_char(p_today + v_p50 * 7, 'YYYY-MM-DD') END,
    'p85Date', CASE WHEN v_p85 = v_infinity THEN NULL ELSE to_char(p_today + v_p85 * 7, 'YYYY-MM-DD') END,
    'beyondHorizon', jsonb_build_object('p50', v_p50 = v_infinity, 'p85', v_p85 = v_infinity),
    'meetsDeadline', jsonb_build_object(
      'p50', v_p50 <> v_infinity AND p_today + v_p50 * 7 <= p_deadline,
      'p85', v_p85 <> v_infinity AND p_today + v_p85 * 7 <= p_deadline));
END;
$$;

REVOKE ALL ON FUNCTION app.exposure_forecast(date[], integer, integer, date, date),
  app.exposure_projection(integer, integer[], date, date, integer) FROM PUBLIC;


-- ===========================================================================
-- (5) exposure_snapshots — history, written by one function only
-- ===========================================================================

-- CreateTable
CREATE TABLE "exposure_snapshots" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "recorded_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recorded_by" UUID,
    "as_of" DATE NOT NULL,
    "model_version" TEXT NOT NULL,
    "basis" TEXT NOT NULL,
    "assessment_id" UUID,
    "score_snapshot_id" UUID,
    "heads" JSONB NOT NULL,
    "ceilings_at_stake" DECIMAL(9,3) NOT NULL,
    "exposed_heads" INTEGER NOT NULL,
    "applicable_heads" INTEGER NOT NULL,
    "forecast" JSONB NOT NULL,

    CONSTRAINT "exposure_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "exposure_snapshots_organization_id_recorded_at_idx" ON "exposure_snapshots"("organization_id", "recorded_at");

-- CreateIndex
CREATE UNIQUE INDEX "exposure_snapshots_organization_id_id_key" ON "exposure_snapshots"("organization_id", "id");

-- AddForeignKey
ALTER TABLE "exposure_snapshots" ADD CONSTRAINT "exposure_snapshots_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exposure_snapshots" ADD CONSTRAINT "exposure_snapshots_recorded_by_fkey" FOREIGN KEY ("recorded_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exposure_snapshots" ADD CONSTRAINT "exposure_snapshots_organization_id_assessment_id_fkey" FOREIGN KEY ("organization_id", "assessment_id") REFERENCES "assessments"("organization_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exposure_snapshots" ADD CONSTRAINT "exposure_snapshots_organization_id_score_snapshot_id_fkey" FOREIGN KEY ("organization_id", "score_snapshot_id") REFERENCES "assessment_score_snapshots"("organization_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE public.exposure_snapshots
  ADD CONSTRAINT exposure_snapshots_basis_check CHECK (basis IN ('finalised', 'provisional', 'none')),
  -- No assessment exactly when the basis is none; a score snapshot only under a finalised basis.
  ADD CONSTRAINT exposure_snapshots_basis_assessment CHECK ((basis = 'none') = (assessment_id IS NULL)),
  ADD CONSTRAINT exposure_snapshots_basis_snapshot CHECK (score_snapshot_id IS NULL OR basis = 'finalised'),
  ADD CONSTRAINT exposure_snapshots_heads_is_array CHECK (jsonb_typeof(heads) = 'array' AND jsonb_array_length(heads) = 5),
  ADD CONSTRAINT exposure_snapshots_forecast_is_object CHECK (jsonb_typeof(forecast) = 'object'),
  ADD CONSTRAINT exposure_snapshots_counts CHECK (
    exposed_heads BETWEEN 0 AND 5 AND applicable_heads BETWEEN 0 AND 5 AND exposed_heads <= applicable_heads),
  ADD CONSTRAINT exposure_snapshots_ceilings_range CHECK (ceilings_at_stake >= 0 AND ceilings_at_stake <= 850);

-- A stored snapshot is evidence of where the organisation stood on a date:
-- nothing may edit one, tooling included. It goes only when what it was
-- about goes — its organisation, its assessment or its score snapshot
-- (the cascade, as D-052).
CREATE OR REPLACE FUNCTION app.exposure_snapshot_is_immutable()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    RAISE EXCEPTION 'A recorded exposure snapshot cannot be changed — it is evidence of where the organisation stood.'
      USING ERRCODE = 'TS409';
  END IF;
  IF EXISTS (SELECT 1 FROM public.organizations o WHERE o.id = OLD.organization_id)
     AND (OLD.assessment_id IS NULL OR EXISTS (
           SELECT 1 FROM public.assessments a WHERE a.id = OLD.assessment_id AND a.organization_id = OLD.organization_id))
     AND (OLD.score_snapshot_id IS NULL OR EXISTS (
           SELECT 1 FROM public.assessment_score_snapshots s WHERE s.id = OLD.score_snapshot_id AND s.organization_id = OLD.organization_id)) THEN
    RAISE EXCEPTION 'A recorded exposure snapshot cannot be deleted — it is evidence of where the organisation stood.'
      USING ERRCODE = 'TS409';
  END IF;
  RETURN OLD;
END;
$$;

REVOKE ALL ON FUNCTION app.exposure_snapshot_is_immutable() FROM PUBLIC;

CREATE TRIGGER exposure_snapshots_immutable
  BEFORE UPDATE OR DELETE ON public.exposure_snapshots
  FOR EACH ROW EXECUTE FUNCTION app.exposure_snapshot_is_immutable();

-- Grants + RLS (D-019): SELECT only, and only with score.read. No INSERT,
-- UPDATE or DELETE grant of any kind — the RPC below is the one door.
REVOKE ALL ON public.exposure_snapshots FROM anon, authenticated;
GRANT SELECT ON public.exposure_snapshots TO authenticated;

ALTER TABLE public.exposure_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY exposure_snapshots_select_member ON public.exposure_snapshots
  FOR SELECT TO authenticated
  USING (
    organization_id IN (SELECT app.current_user_organization_ids())
    AND app.has_permission(organization_id, 'score.read')
  );


-- ===========================================================================
-- (6) record_exposure_snapshot — the snapshot's only write path
-- ===========================================================================
-- One id in, nothing else. Every value is derived here, in SQL, from the
-- stored data — as the date in India — so a caller can neither choose a
-- number nor back-date one.

CREATE OR REPLACE FUNCTION public.record_exposure_snapshot(p_organization_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_actor uuid := app.current_user_id();
  v_today date := (now() AT TIME ZONE 'Asia/Kolkata')::date;
  v_built jsonb;
  v_model jsonb;
  v_work record;
  v_forecast jsonb;
  v_id uuid;
BEGIN
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'Sign in to continue.' USING ERRCODE = 'TS401';
  END IF;
  IF NOT app.has_permission(p_organization_id, 'score.calculate') THEN
    RAISE EXCEPTION 'You do not have permission to record an exposure snapshot.' USING ERRCODE = 'TS403';
  END IF;

  v_built := app.exposure_input(p_organization_id, v_today);
  v_model := app.exposure_evaluate(v_built -> 'input');
  SELECT * INTO v_work FROM app.exposure_outstanding_work(v_built -> 'input');
  v_forecast := app.exposure_forecast(app.exposure_closures(p_organization_id), v_work.critical_high, v_work.all_work,
                                      v_today, app.exposure_deadline());

  INSERT INTO public.exposure_snapshots (
    organization_id, recorded_by, as_of, model_version, basis, assessment_id, score_snapshot_id,
    heads, ceilings_at_stake, exposed_heads, applicable_heads, forecast
  ) VALUES (
    p_organization_id, v_actor, v_today, v_model ->> 'modelVersion', v_built #>> '{input,basis}',
    (v_built ->> 'assessmentId')::uuid, (v_built ->> 'scoreSnapshotId')::uuid,
    v_model -> 'heads', (v_model ->> 'ceilingsAtStakeCrore')::numeric, (v_model ->> 'exposedHeads')::integer,
    (v_model ->> 'applicableHeads')::integer, v_forecast
  )
  RETURNING id INTO v_id;

  -- ONE audit row, as the person, carrying the headline that was recorded.
  INSERT INTO public.audit_logs (organization_id, user_id, event_type, entity_type, entity_id, description, metadata)
  VALUES (
    p_organization_id, v_actor, 'exposure.snapshot.recorded', 'exposure_snapshots', v_id,
    'Recorded an exposure snapshot',
    jsonb_build_object(
      'modelVersion', v_model ->> 'modelVersion',
      'basis', v_built #>> '{input,basis}',
      'asOf', to_char(v_today, 'YYYY-MM-DD'),
      'ceilingsAtStakeCrore', (v_model ->> 'ceilingsAtStakeCrore')::numeric,
      'exposedHeads', (v_model ->> 'exposedHeads')::integer));

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.record_exposure_snapshot(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_exposure_snapshot(uuid) TO authenticated;
