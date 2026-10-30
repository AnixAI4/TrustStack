-- Slice 5 — the full 16-domain scoring engine, and a finalised score that
-- cannot move.
--
-- DPDP anchoring: the sixteen domains ARE the Act and the Rules as an
-- operating model. The red flags encode the obligations whose absence makes
-- everything else moot — no DPDP owner, no inventory, no ROPA, no security
-- safeguards, no breach readiness, no processor governance, unreviewed
-- children's data. A score that let those be averaged away would be a
-- readiness score in name only.
--
-- And a finalised score is evidence of what was assessed and when. So it is
-- computed HERE, in SQL, from the stored adjusted scores — an RPC that stored
-- numbers the caller computed would store numbers the caller can forge — and
-- once written it cannot be updated or deleted, by anyone, including tooling.
--
-- `packages/core/src/engine.ts` holds the same rules for the API and the UI;
-- `apps/web/tests/unit/scoring-engine.test.ts` parses this file and fails if
-- the two ever differ, exactly as Slice 4's cap test does.
--
-- Layout: (1) Prisma-generated DDL; (2) the engine in SQL; (3) CHECK
-- vocabularies; (4) unlinking evidence; (5) finalise; (6) immutability;
-- (7) audit; (8) grants + RLS.
--
-- Decisions: D-035 (the snapshot's weight, never the live bank); D-038 (an
-- empty domain leaves the denominator); D-041 (finalise refuses outstanding
-- questions); D-044 (derived in the database, never sent by a client);
-- D-046 (red flags at adjusted <= 2); D-048 (the spec's cap governs);
-- D-049 (evidence freshness deferred); D-050 (the band is out of the
-- applicable weight); D-051 (unlinking is the one reversible evidence action).

-- ===========================================================================
-- (1) DDL
-- ===========================================================================

-- CreateTable
CREATE TABLE "assessment_score_snapshots" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "assessment_id" UUID NOT NULL,
    "calculated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "calculated_by" UUID,
    "raw_score" DECIMAL(7,4) NOT NULL,
    "score_cap" DECIMAL(7,4) NOT NULL,
    "final_score" DECIMAL(7,4) NOT NULL,
    "applicable_weight" DECIMAL(5,2) NOT NULL,
    "evidence_confidence" DECIMAL(7,4) NOT NULL,
    "maturity_level" TEXT NOT NULL,
    "critical_count" INTEGER NOT NULL,
    "high_count" INTEGER NOT NULL,
    "red_flags" JSONB NOT NULL DEFAULT '[]',
    "engine_version" TEXT NOT NULL,

    CONSTRAINT "assessment_score_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessment_domain_scores" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "snapshot_id" UUID NOT NULL,
    "domain_code" TEXT NOT NULL,
    "weight" DECIMAL(5,2) NOT NULL,
    "state" TEXT NOT NULL,
    "applicable_count" INTEGER NOT NULL,
    "not_applicable_count" INTEGER NOT NULL,
    "avg_adjusted" DECIMAL(5,4),
    "score" DECIMAL(7,4),
    "evidence_confidence" DECIMAL(7,4),
    "maturity_level" TEXT,
    "critical_count" INTEGER NOT NULL,
    "high_count" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL,

    CONSTRAINT "assessment_domain_scores_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "assessment_score_snapshots_organization_id_idx" ON "assessment_score_snapshots"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "assessment_score_snapshots_organization_id_assessment_id_key" ON "assessment_score_snapshots"("organization_id", "assessment_id");

-- CreateIndex
CREATE UNIQUE INDEX "assessment_score_snapshots_organization_id_id_key" ON "assessment_score_snapshots"("organization_id", "id");

-- CreateIndex
CREATE INDEX "assessment_domain_scores_organization_id_idx" ON "assessment_domain_scores"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "assessment_domain_scores_snapshot_id_domain_code_key" ON "assessment_domain_scores"("snapshot_id", "domain_code");

-- AddForeignKey
ALTER TABLE "assessment_score_snapshots" ADD CONSTRAINT "assessment_score_snapshots_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_score_snapshots" ADD CONSTRAINT "assessment_score_snapshots_organization_id_assessment_id_fkey" FOREIGN KEY ("organization_id", "assessment_id") REFERENCES "assessments"("organization_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_score_snapshots" ADD CONSTRAINT "assessment_score_snapshots_calculated_by_fkey" FOREIGN KEY ("calculated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_domain_scores" ADD CONSTRAINT "assessment_domain_scores_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_domain_scores" ADD CONSTRAINT "assessment_domain_scores_organization_id_snapshot_id_fkey" FOREIGN KEY ("organization_id", "snapshot_id") REFERENCES "assessment_score_snapshots"("organization_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;


-- ===========================================================================
-- (2) The engine, in SQL — mirrors packages/core/src/engine.ts
-- ===========================================================================
-- Every function here has a counterpart in `engine.ts`, and the unit test
-- parses this file to prove they agree. Slice 4 already put the per-answer cap
-- in `app.adjusted_score()`; this is the aggregation on top of it.

-- Stamped on every snapshot. Bump it whenever a change here could give a
-- different number for the same answers — a stored score must always say
-- which engine produced it, or a reassessment delta (Slice 12) is unreadable.
CREATE OR REPLACE FUNCTION app.engine_version()
RETURNS text
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = ''
AS $$
  SELECT '1.0.0'::text;
$$;

-- The band for a proportion in 0-1. Boundaries are INCLUSIVE of the lower
-- band, exactly as the workbook's nested IF($G2<=0.2, ...) — so 0.40 is
-- "Aware", not "Defined".
CREATE OR REPLACE FUNCTION app.maturity_band(p_percent numeric)
RETURNS text
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = ''
AS $$
  SELECT CASE
    WHEN p_percent IS NULL THEN NULL
    WHEN p_percent <= 0.2  THEN 'Level 0 - Not Started'
    WHEN p_percent <= 0.4  THEN 'Level 1 - Aware'
    WHEN p_percent <= 0.6  THEN 'Level 2 - Defined'
    WHEN p_percent <= 0.75 THEN 'Level 3 - Implementing'
    WHEN p_percent <= 0.9  THEN 'Level 4 - Operational'
    ELSE 'Level 5 - Continuous Assurance'
  END;
$$;

-- One answer's severity, from its ADJUSTED score — so an unevidenced claim is
-- graded on what the evidence supports, not on what was claimed. Under the
-- spec's cap an adjusted 0 needs a claim of 0, so an unevidenced claim of 5 is
-- 'high', not 'critical'. Slice 6 builds gaps on this; Slice 5 counts.
CREATE OR REPLACE FUNCTION app.question_severity(p_adjusted integer)
RETURNS text
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = ''
AS $$
  SELECT CASE
    WHEN p_adjusted IS NULL THEN NULL
    WHEN p_adjusted >= 5 THEN 'no_gap'
    WHEN p_adjusted >= 4 THEN 'improvement'
    WHEN p_adjusted >= 3 THEN 'low'
    WHEN p_adjusted >= 2 THEN 'medium'
    WHEN p_adjusted >= 1 THEN 'high'
    ELSE 'critical'
  END;
$$;

-- A red flag fires when an answer in its area scores 2 OR BELOW (D-046). The
-- workbook used `< 2`, calibrated on its naive MIN(claimed, evidence) under
-- which E1 evidence already produced 1. Under the spec's cap E1 and E2 both
-- produce 2, so `< 2` would have quietly stopped firing for them.
CREATE OR REPLACE FUNCTION app.red_flag_max_adjusted()
RETURNS integer
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = ''
AS $$
  SELECT 2;
$$;

-- The seven obligations that cap the whole assessment. `question_code` is set
-- only for the DPDP-owner flag; the rest fire on ANY question in their domain.
-- Labels are plain language: the client never sees a question or pack code (D-040).
CREATE OR REPLACE FUNCTION app.red_flags()
RETURNS TABLE (ord integer, code text, question_code text, domain_code text, cap numeric, label text)
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = ''
AS $$
  VALUES
    (1, 'no_evidenced_dpdp_owner',  'G1.2', 'GOV',      60::numeric, 'No evidenced DPDP owner or nodal officer'),
    (2, 'weak_data_inventory',       NULL,  'INV',      55::numeric, 'Personal data discovery and inventory is weak or unevidenced'),
    (3, 'weak_ropa',                 NULL,  'ROPA',     60::numeric, 'Records of processing activities are weak or unevidenced'),
    (4, 'weak_security_safeguards',  NULL,  'SECURITY', 60::numeric, 'Security safeguards are weak or unevidenced'),
    (5, 'weak_breach_readiness',     NULL,  'BREACH',   65::numeric, 'Personal data breach readiness is weak or unevidenced'),
    (6, 'weak_processor_governance', NULL,  'VENDOR',   70::numeric, 'Vendor / Data Processor governance is weak or unevidenced'),
    (7, 'unreviewed_childrens_data', NULL,  'CHILD',    50::numeric, 'Children''s data and guardian consent handling is weak or unevidenced');
$$;

-- The cap when nothing fires: the score is not capped at all.
CREATE OR REPLACE FUNCTION app.no_score_cap()
RETURNS numeric
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = ''
AS $$
  SELECT 100::numeric;
$$;

-- Below this, a domain with no critical or high gap still "Needs Work".
CREATE OR REPLACE FUNCTION app.on_track_min_percent()
RETURNS numeric
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = ''
AS $$
  SELECT 0.61::numeric;
$$;

REVOKE ALL ON FUNCTION app.engine_version(), app.maturity_band(numeric), app.question_severity(integer),
  app.red_flag_max_adjusted(), app.red_flags(), app.no_score_cap(), app.on_track_min_percent() FROM PUBLIC;
-- Pure functions over no data. The live score route reads them.
GRANT EXECUTE ON FUNCTION app.engine_version(), app.maturity_band(numeric), app.question_severity(integer),
  app.red_flag_max_adjusted(), app.red_flags(), app.no_score_cap(), app.on_track_min_percent() TO authenticated;


-- ===========================================================================
-- (3) Constraints Prisma cannot express
-- ===========================================================================

ALTER TABLE public.assessment_score_snapshots
  ADD CONSTRAINT assessment_score_snapshots_raw_range CHECK (raw_score >= 0 AND raw_score <= 100),
  ADD CONSTRAINT assessment_score_snapshots_cap_range CHECK (score_cap >= 0 AND score_cap <= 100),
  ADD CONSTRAINT assessment_score_snapshots_weight_range
    CHECK (applicable_weight >= 0 AND applicable_weight <= 100),
  ADD CONSTRAINT assessment_score_snapshots_confidence_range
    CHECK (evidence_confidence >= 0 AND evidence_confidence <= 100),
  -- The final score IS min(raw, cap) — an invariant of the row, so a snapshot
  -- can never claim a score its own red flags forbid.
  ADD CONSTRAINT assessment_score_snapshots_final_is_capped
    CHECK (final_score = least(raw_score, score_cap)),
  ADD CONSTRAINT assessment_score_snapshots_counts_positive
    CHECK (critical_count >= 0 AND high_count >= 0),
  ADD CONSTRAINT assessment_score_snapshots_red_flags_is_array
    CHECK (jsonb_typeof(red_flags) = 'array'),
  ADD CONSTRAINT assessment_score_snapshots_band_check CHECK (maturity_level IN (
    'Level 0 - Not Started', 'Level 1 - Aware', 'Level 2 - Defined',
    'Level 3 - Implementing', 'Level 4 - Operational', 'Level 5 - Continuous Assurance'));

ALTER TABLE public.assessment_domain_scores
  ADD CONSTRAINT assessment_domain_scores_state_check
    CHECK (state IN ('scored', 'scoped_out', 'all_not_applicable')),
  ADD CONSTRAINT assessment_domain_scores_status_check
    CHECK (status IN ('critical', 'high_risk', 'needs_work', 'on_track')),
  ADD CONSTRAINT assessment_domain_scores_weight_positive CHECK (weight > 0 AND weight <= 100),
  ADD CONSTRAINT assessment_domain_scores_avg_range CHECK (avg_adjusted BETWEEN 0 AND 5),
  ADD CONSTRAINT assessment_domain_scores_score_range CHECK (score >= 0 AND score <= weight),
  ADD CONSTRAINT assessment_domain_scores_confidence_range
    CHECK (evidence_confidence >= 0 AND evidence_confidence <= 100),
  ADD CONSTRAINT assessment_domain_scores_counts_positive
    CHECK (applicable_count >= 0 AND not_applicable_count >= 0
           AND critical_count >= 0 AND high_count >= 0),
  -- An empty domain is NEVER scored zero: its score is null and it leaves the
  -- weighted denominator (D-038). This is that rule as a row invariant.
  ADD CONSTRAINT assessment_domain_scores_empty_is_null CHECK (
    (state = 'scored') = (score IS NOT NULL)),
  ADD CONSTRAINT assessment_domain_scores_empty_has_no_applicable CHECK (
    state = 'scored' OR applicable_count = 0),
  ADD CONSTRAINT assessment_domain_scores_band_check CHECK (
    maturity_level IS NULL OR maturity_level = app.maturity_band(
      CASE WHEN weight > 0 THEN score / weight END)),
  ADD CONSTRAINT assessment_domain_scores_band_present CHECK (
    (state = 'scored') = (maturity_level IS NOT NULL)),
  ADD CONSTRAINT assessment_domain_scores_code_check CHECK (domain_code IN (
    'GOV', 'INV', 'ROPA', 'PURPOSE', 'NOTICE', 'CONSENT', 'RIGHTS', 'GRIEVANCE',
    'RETENTION', 'ACCURACY', 'SECURITY', 'BREACH', 'VENDOR', 'CHILD',
    'CROSSBORDER', 'SDF_AI'));


-- ===========================================================================
-- (4) Unlinking evidence from an answer
-- ===========================================================================
-- Until now a link could be made and never undone, so a wrong attachment was
-- permanent — and it changes the score, because a response's level is the
-- strongest artefact linked to it. Evidence itself is still never deleted
-- (D-042): unlinking detaches it from ONE answer and leaves the artefact, and
-- its audit trail, exactly where they are.

CREATE OR REPLACE FUNCTION app.evidence_link_before_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_status text;
  v_response_exists boolean;
BEGIN
  SELECT a.status INTO v_status
  FROM public.assessment_responses r
  JOIN public.assessments a ON a.id = r.assessment_id AND a.organization_id = r.organization_id
  WHERE r.id = OLD.linked_entity_id AND r.organization_id = OLD.organization_id;
  v_response_exists := FOUND;

  -- Two cascades reach here and neither is somebody unlinking: a response
  -- deleted first takes its links with it (the Slice 4 after-delete trigger),
  -- and deleting the artefact takes them too (the composite FK). Both leave
  -- the parent row already gone, which is how they are told apart from a
  -- user's DELETE on the link itself.
  IF v_response_exists
     AND EXISTS (SELECT 1 FROM public.evidence e
                 WHERE e.id = OLD.evidence_id AND e.organization_id = OLD.organization_id)
     AND v_status IN ('submitted', 'finalised') THEN
    RAISE EXCEPTION 'This assessment is % — its evidence is locked.', v_status USING ERRCODE = 'TS409';
  END IF;
  RETURN OLD;
END;
$$;

-- Re-derive the response's level, and so its adjusted score, from whatever
-- links remain. Removing the only strong artefact must lower the score in the
-- same transaction, or the number would outlive its evidence.
CREATE OR REPLACE FUNCTION app.evidence_link_after_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.assessment_responses r
  SET evidence_level = app.linked_evidence_level(r.organization_id, r.id)
  WHERE r.id = OLD.linked_entity_id AND r.organization_id = OLD.organization_id;
  RETURN NULL;
END;
$$;

REVOKE ALL ON FUNCTION app.evidence_link_before_delete(), app.evidence_link_after_delete() FROM PUBLIC;

CREATE TRIGGER evidence_links_before_delete
  BEFORE DELETE ON public.evidence_links
  FOR EACH ROW EXECUTE FUNCTION app.evidence_link_before_delete();
CREATE TRIGGER evidence_links_after_delete
  AFTER DELETE ON public.evidence_links
  FOR EACH ROW EXECUTE FUNCTION app.evidence_link_after_delete();


-- ===========================================================================
-- (5) The engine over an assessment
-- ===========================================================================

-- Sixteen rows: one per domain, whatever the scope did to it.
--
-- WHERE EACH NUMBER COMES FROM. The weight of a domain that HAS questions is
-- the SNAPSHOT's (`assessment_questions.domain_weight`), never the live
-- `dpdp_domains` row — a later rebalance must not rewrite an existing
-- assessment's score (D-035). `dpdp_domains` is read only to know that all
-- sixteen domains exist and for a scoped-out domain's display weight and
-- ordering, neither of which touches the score: a scoped-out domain
-- contributes nothing to the total and nothing to the denominator (D-038).
CREATE OR REPLACE FUNCTION app.assessment_domain_results(
  p_organization_id uuid,
  p_assessment_id uuid
)
RETURNS TABLE (
  domain_code text,
  weight numeric,
  state text,
  applicable_count integer,
  not_applicable_count integer,
  outstanding_count integer,
  avg_adjusted numeric,
  score numeric,
  evidence_confidence numeric,
  maturity_level text,
  critical_count integer,
  high_count integer,
  status text,
  sort_order integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  -- ONE row per snapshotted question, carrying its answer if it has one. The
  -- join is question → its own response; joining the question set and the
  -- answer set separately would multiply them and count one answer many times.
  -- An unanswered question keeps its row with a NULL decision: that is what
  -- makes it OUTSTANDING rather than invisible (D-041).
  WITH snapshot AS (
    SELECT
      q.domain_code,
      q.question_code,
      q.domain_weight,
      r.applicability_decision,
      r.adjusted_score,
      COALESCE(r.evidence_level, 0) AS evidence_level
    FROM public.assessment_questions q
    LEFT JOIN public.assessment_responses r
      ON r.organization_id = q.organization_id
     AND r.assessment_id = q.assessment_id
     AND r.question_code = q.question_code
    WHERE q.organization_id = p_organization_id AND q.assessment_id = p_assessment_id
  ),
  per_domain AS (
    SELECT
      d.code AS domain_code,
      d.sort_order,
      -- The snapshot's weight where there is one; the live weight is display
      -- only, for a domain with no questions at all.
      COALESCE(max(s.domain_weight), d.weight) AS weight,
      count(s.question_code)::integer AS question_count,
      count(*) FILTER (WHERE s.applicability_decision = 'applicable')::integer AS applicable_count,
      count(*) FILTER (WHERE s.applicability_decision = 'not_applicable')::integer AS not_applicable_count,
      sum(s.adjusted_score) FILTER (WHERE s.applicability_decision = 'applicable') AS adjusted_total,
      sum(s.evidence_level) FILTER (WHERE s.applicability_decision = 'applicable') AS evidence_total,
      count(*) FILTER (WHERE s.applicability_decision = 'applicable'
                         AND app.question_severity(s.adjusted_score) = 'critical')::integer AS critical_count,
      count(*) FILTER (WHERE s.applicability_decision = 'applicable'
                         AND app.question_severity(s.adjusted_score) = 'high')::integer AS high_count
    FROM public.dpdp_domains d
    LEFT JOIN snapshot s ON s.domain_code = d.code
    GROUP BY d.code, d.weight, d.sort_order
  ),
  scored AS (
    SELECT
      p.*,
      CASE WHEN p.applicable_count > 0
           THEN p.adjusted_total::numeric / p.applicable_count END AS avg_adjusted,
      CASE WHEN p.applicable_count > 0
           THEN (p.adjusted_total::numeric / p.applicable_count / 5) * p.weight END AS score,
      CASE WHEN p.applicable_count > 0
           THEN (p.evidence_total::numeric / p.applicable_count / 5) * 100 END AS evidence_confidence,
      -- Three states, and they must stay distinct in every report (D-038):
      -- scoped out (never generated) is not the same fact as all-N/A (the
      -- assessor excluded every one, each with a written reason).
      CASE
        WHEN p.question_count = 0 THEN 'scoped_out'
        WHEN p.applicable_count = 0
         AND p.applicable_count + p.not_applicable_count = p.question_count THEN 'all_not_applicable'
        ELSE 'scored'
      END AS state
    FROM per_domain p
  )
  SELECT
    s.domain_code,
    s.weight,
    s.state,
    s.applicable_count,
    s.not_applicable_count,
    (s.question_count - s.applicable_count - s.not_applicable_count)::integer AS outstanding_count,
    s.avg_adjusted,
    s.score,
    s.evidence_confidence,
    app.maturity_band(CASE WHEN s.weight > 0 THEN s.score / s.weight END) AS maturity_level,
    s.critical_count,
    s.high_count,
    CASE
      WHEN s.critical_count > 0 THEN 'critical'
      WHEN s.high_count > 0 THEN 'high_risk'
      WHEN s.score IS NULL THEN 'needs_work'
      WHEN s.score / s.weight < app.on_track_min_percent() THEN 'needs_work'
      ELSE 'on_track'
    END AS status,
    s.sort_order
  FROM scored s
  ORDER BY s.sort_order;
$$;

-- Which red flags fired, as the jsonb the snapshot stores. `question_codes`
-- names the answers that tripped each flag, so a report can say why.
CREATE OR REPLACE FUNCTION app.assessment_red_flags(
  p_organization_id uuid,
  p_assessment_id uuid
)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
           'code', f.code,
           'domainCode', f.domain_code,
           'cap', f.cap,
           'label', f.label,
           'questionCodes', f.question_codes
         ) ORDER BY f.ord), '[]'::jsonb)
  FROM (
    SELECT rf.ord, rf.code, rf.domain_code, rf.cap, rf.label,
           jsonb_agg(q.question_code ORDER BY q.question_code) AS question_codes
    FROM app.red_flags() rf
    JOIN LATERAL (
      SELECT r.question_code
      FROM public.assessment_questions aq
      JOIN public.assessment_responses r
        ON r.organization_id = aq.organization_id
       AND r.assessment_id = aq.assessment_id
       AND r.question_code = aq.question_code
      WHERE aq.organization_id = p_organization_id
        AND aq.assessment_id = p_assessment_id
        AND aq.domain_code = rf.domain_code
        AND r.applicability_decision = 'applicable'
        AND r.adjusted_score <= app.red_flag_max_adjusted()
        AND (rf.question_code IS NULL OR r.question_code = rf.question_code)
    ) q ON TRUE
    GROUP BY rf.ord, rf.code, rf.domain_code, rf.cap, rf.label
  ) f;
$$;

REVOKE ALL ON FUNCTION app.assessment_domain_results(uuid, uuid), app.assessment_red_flags(uuid, uuid) FROM PUBLIC;


-- ===========================================================================
-- (6) Finalise — the snapshot's only write path
-- ===========================================================================
-- Every number is computed HERE. The caller passes two ids and nothing else:
-- an RPC that stored numbers the caller computed would store numbers the
-- caller can forge, and a finalised score is evidence.

CREATE OR REPLACE FUNCTION public.finalise_assessment(
  p_organization_id uuid,
  p_assessment_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_actor uuid := app.current_user_id();
  v_status text;
  v_outstanding integer;
  v_snapshot_id uuid;
  v_raw numeric;
  v_cap numeric;
  v_weight numeric;
BEGIN
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'Sign in to continue.' USING ERRCODE = 'TS401';
  END IF;
  IF NOT app.has_permission(p_organization_id, 'assessment.finalise') THEN
    RAISE EXCEPTION 'You do not have permission to finalise this assessment.' USING ERRCODE = 'TS403';
  END IF;

  SELECT status INTO v_status
  FROM public.assessments
  WHERE id = p_assessment_id AND organization_id = p_organization_id;

  IF v_status IS NULL THEN
    RAISE EXCEPTION 'Assessment not found.' USING ERRCODE = 'TS404';
  END IF;
  IF v_status <> 'in_progress' THEN
    RAISE EXCEPTION 'Only an assessment in progress can be finalised (this one is %).', v_status
      USING ERRCODE = 'TS409';
  END IF;

  -- Unanswered is OUTSTANDING: neither scored nor excluded (D-041). Finalising
  -- with questions outstanding would let a client answer only its strong ones
  -- and freeze the flattering half as its official score.
  SELECT count(*)::integer INTO v_outstanding
  FROM public.assessment_questions q
  WHERE q.organization_id = p_organization_id
    AND q.assessment_id = p_assessment_id
    AND NOT EXISTS (
      SELECT 1 FROM public.assessment_responses r
      WHERE r.organization_id = q.organization_id
        AND r.assessment_id = q.assessment_id
        AND r.question_code = q.question_code
    );
  IF v_outstanding > 0 THEN
    RAISE EXCEPTION 'Answer every question before finalising — % still outstanding.', v_outstanding
      USING ERRCODE = 'TS409', DETAIL = v_outstanding::text;
  END IF;

  -- The score over the APPLICABLE weight (D-038): an empty domain leaves the
  -- denominator, is never scored zero, and is never renormalised away.
  SELECT COALESCE(sum(d.score), 0), COALESCE(sum(d.weight) FILTER (WHERE d.state = 'scored'), 0)
    INTO v_raw, v_weight
  FROM app.assessment_domain_results(p_organization_id, p_assessment_id) d
  WHERE d.state = 'scored';

  -- Several flags fire → the LOWEST cap wins; none → 100, no cap at all.
  SELECT COALESCE(min((f.value ->> 'cap')::numeric), app.no_score_cap()) INTO v_cap
  FROM jsonb_array_elements(app.assessment_red_flags(p_organization_id, p_assessment_id)) AS f(value);

  INSERT INTO public.assessment_score_snapshots (
    organization_id, assessment_id, calculated_by, raw_score, score_cap, final_score,
    applicable_weight, evidence_confidence, maturity_level, critical_count, high_count,
    red_flags, engine_version
  )
  SELECT
    p_organization_id, p_assessment_id, v_actor,
    v_raw, v_cap, least(v_raw, v_cap),
    v_weight,
    -- The mean of the SCORED domains' confidences — per domain, unweighted,
    -- NOT per question. Averaging questions gives a different number and
    -- fails the workbook parity gate.
    COALESCE(avg(d.evidence_confidence) FILTER (WHERE d.evidence_confidence IS NOT NULL), 0),
    -- Out of the applicable weight, not a flat 100: judging an organisation
    -- against points that do not apply to it is the same error as scoring an
    -- empty domain zero (D-050).
    app.maturity_band(CASE WHEN v_weight > 0 THEN least(v_raw, v_cap) / v_weight ELSE 0 END),
    COALESCE(sum(d.critical_count), 0)::integer,
    COALESCE(sum(d.high_count), 0)::integer,
    app.assessment_red_flags(p_organization_id, p_assessment_id),
    app.engine_version()
  FROM app.assessment_domain_results(p_organization_id, p_assessment_id) d
  RETURNING id INTO v_snapshot_id;

  -- All sixteen rows, including the empty ones: the scorecard and the coverage
  -- line are what keep the denominator honest.
  INSERT INTO public.assessment_domain_scores (
    organization_id, snapshot_id, domain_code, weight, state, applicable_count,
    not_applicable_count, avg_adjusted, score, evidence_confidence, maturity_level,
    critical_count, high_count, status, sort_order
  )
  SELECT
    p_organization_id, v_snapshot_id, d.domain_code, d.weight, d.state, d.applicable_count,
    d.not_applicable_count, d.avg_adjusted, d.score, d.evidence_confidence, d.maturity_level,
    d.critical_count, d.high_count, d.status, d.sort_order
  FROM app.assessment_domain_results(p_organization_id, p_assessment_id) d;

  UPDATE public.assessments SET status = 'finalised'
  WHERE id = p_assessment_id AND organization_id = p_organization_id;

  -- ONE audit row for the finalisation, carrying the numbers that were frozen.
  INSERT INTO public.audit_logs (organization_id, user_id, event_type, entity_type, entity_id, description, metadata)
  SELECT
    p_organization_id, v_actor, 'assessment.score.finalised', 'assessments', p_assessment_id,
    'Finalised the assessment and froze its score',
    jsonb_build_object(
      'snapshotId', v_snapshot_id,
      'rawScore', s.raw_score,
      'scoreCap', s.score_cap,
      'finalScore', s.final_score,
      'applicableWeight', s.applicable_weight,
      'evidenceConfidence', s.evidence_confidence,
      'maturityLevel', s.maturity_level,
      'criticalCount', s.critical_count,
      'highCount', s.high_count,
      'redFlagCodes', (SELECT jsonb_agg(f.value -> 'code') FROM jsonb_array_elements(s.red_flags) AS f(value)),
      'engineVersion', s.engine_version
    )
  FROM public.assessment_score_snapshots s
  WHERE s.id = v_snapshot_id;

  RETURN v_snapshot_id;
END;
$$;

REVOKE ALL ON FUNCTION public.finalise_assessment(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.finalise_assessment(uuid, uuid) TO authenticated;


-- ===========================================================================
-- (7) Immutability — a finalised score never moves
-- ===========================================================================
-- Slice 4 already stops a finalised assessment being re-answered, re-linked
-- or re-reviewed. This stops the snapshot ITSELF being edited — and it binds
-- tooling too, which the grants alone would not.

-- A snapshot never CHANGES. It can still disappear with the thing it scored:
-- deleting the assessment (or the organisation) takes its score with it, and
-- that is a deliberate act on the whole record, not an edit to a number.
--
-- A cascade is told apart from a direct DELETE by looking for the parent: with
-- ON DELETE CASCADE Postgres removes the parent row FIRST, so by the time this
-- fires on a cascade the parent is already gone. The same trick keeps
-- `app.evidence_link_before_delete` from blocking its own cascades.
CREATE OR REPLACE FUNCTION app.snapshot_is_immutable()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_parent_exists boolean;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    RAISE EXCEPTION 'A finalised score cannot be changed — it is evidence of what was assessed and when.'
      USING ERRCODE = 'TS409';
  END IF;

  IF TG_TABLE_NAME = 'assessment_score_snapshots' THEN
    SELECT EXISTS (
      SELECT 1 FROM public.assessments a
      WHERE a.id = OLD.assessment_id AND a.organization_id = OLD.organization_id
    ) INTO v_parent_exists;
  ELSE
    SELECT EXISTS (
      SELECT 1 FROM public.assessment_score_snapshots s
      WHERE s.id = OLD.snapshot_id AND s.organization_id = OLD.organization_id
    ) INTO v_parent_exists;
  END IF;

  IF v_parent_exists THEN
    RAISE EXCEPTION 'A finalised score cannot be deleted — it is evidence of what was assessed and when.'
      USING ERRCODE = 'TS409';
  END IF;
  RETURN OLD;
END;
$$;

REVOKE ALL ON FUNCTION app.snapshot_is_immutable() FROM PUBLIC;

CREATE TRIGGER assessment_score_snapshots_immutable
  BEFORE UPDATE OR DELETE ON public.assessment_score_snapshots
  FOR EACH ROW EXECUTE FUNCTION app.snapshot_is_immutable();
CREATE TRIGGER assessment_domain_scores_immutable
  BEFORE UPDATE OR DELETE ON public.assessment_domain_scores
  FOR EACH ROW EXECUTE FUNCTION app.snapshot_is_immutable();


-- ===========================================================================
-- (8) Audit (D-027)
-- ===========================================================================
-- The snapshot insert is audited by `finalise_assessment` itself, as one row
-- carrying the frozen numbers — sixteen "domain score created" rows would
-- bury the event that matters. The link DELETE reuses the Slice 4 trigger,
-- which already covers DELETE, so unlinking is audited with no new code.


-- ===========================================================================
-- (9) Grants + RLS (D-019)
-- ===========================================================================

REVOKE ALL ON public.assessment_score_snapshots, public.assessment_domain_scores FROM anon, authenticated;

-- SELECT only. There is no user INSERT grant either: the RPC is SECURITY
-- DEFINER, so finalising is the one way a row appears.
GRANT SELECT ON public.assessment_score_snapshots TO authenticated;
GRANT SELECT ON public.assessment_domain_scores TO authenticated;

-- Unlinking, from Slice 4's evidence_links. Still no DELETE on `evidence`
-- itself: an artefact, once stored, is retained (D-042).
GRANT DELETE ON public.evidence_links TO authenticated;

ALTER TABLE public.assessment_score_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_domain_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY assessment_score_snapshots_select_member ON public.assessment_score_snapshots
  FOR SELECT TO authenticated
  USING (
    organization_id IN (SELECT app.current_user_organization_ids())
    AND app.has_permission(organization_id, 'score.read')
  );

CREATE POLICY assessment_domain_scores_select_member ON public.assessment_domain_scores
  FOR SELECT TO authenticated
  USING (
    organization_id IN (SELECT app.current_user_organization_ids())
    AND app.has_permission(organization_id, 'score.read')
  );

-- Unlinking changes the score, so it needs the same permission as linking.
CREATE POLICY evidence_links_delete_writer ON public.evidence_links
  FOR DELETE TO authenticated
  USING (
    organization_id IN (SELECT app.current_user_organization_ids())
    AND app.has_permission(organization_id, 'evidence.write')
  );


-- ===========================================================================
-- (10) Apply-time assertions
-- ===========================================================================
-- The cheapest possible regression test: if the engine is wrong, the
-- migration refuses to apply.

DO $$
BEGIN
  -- The bands, at every boundary. Each belongs to the LOWER band.
  ASSERT app.maturity_band(0.2) = 'Level 0 - Not Started', 'band at 0.20';
  ASSERT app.maturity_band(0.4) = 'Level 1 - Aware', 'band at 0.40';
  ASSERT app.maturity_band(0.6) = 'Level 2 - Defined', 'band at 0.60';
  ASSERT app.maturity_band(0.75) = 'Level 3 - Implementing', 'band at 0.75';
  ASSERT app.maturity_band(0.9) = 'Level 4 - Operational', 'band at 0.90';
  ASSERT app.maturity_band(0.9001) = 'Level 5 - Continuous Assurance', 'band above 0.90';

  -- Severity from the ADJUSTED score.
  ASSERT app.question_severity(5) = 'no_gap', 'severity 5';
  ASSERT app.question_severity(2) = 'medium', 'severity 2';
  ASSERT app.question_severity(1) = 'high', 'severity 1';
  ASSERT app.question_severity(0) = 'critical', 'severity 0';
  -- An unevidenced claim of 5 adjusts to 1, which is High, not Critical.
  ASSERT app.question_severity(app.adjusted_score(5, NULL)) = 'high', 'unevidenced claim of 5 is High';

  -- Red flags at <= 2 (D-046), seven of them, lowest cap 50.
  ASSERT app.red_flag_max_adjusted() = 2, 'red flags fire at adjusted <= 2';
  ASSERT (SELECT count(*) FROM app.red_flags()) = 7, 'seven red flags';
  ASSERT (SELECT min(cap) FROM app.red_flags()) = 50, 'lowest red-flag cap is 50';
  -- Claim 4 with only E1 evidence adjusts to 2 — so weak evidence alone fires.
  ASSERT app.adjusted_score(4, 1) <= app.red_flag_max_adjusted(), 'claim 4 + E1 fires a red flag';
  ASSERT app.adjusted_score(3, 3) > app.red_flag_max_adjusted(), 'claim 3 + E3 does not';
END;
$$;
