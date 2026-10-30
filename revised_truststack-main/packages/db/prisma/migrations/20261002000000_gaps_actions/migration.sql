-- Slice 6 — the gap register and remediation actions.
--
-- DPDP anchoring: a score tells a Data Fiduciary where it stands; a gap
-- register tells it what to do, who does it and by when. That documented,
-- owned, dated remediation plan is what the accountability duty and Rule 6's
-- "reasonable security safeguards" demand in practice, and it is the input to
-- the 90-day sprint clients need before 13 May 2027.
--
-- Two things make a register worth having, and both are enforced HERE:
--
--   * A gap is DERIVED, never hand-written. Every row comes from a stored
--     `assessment_responses.adjusted_score` — which the database itself
--     derived and CHECK-capped (D-044) — through one generator, in SQL. No
--     user role holds a write grant on `assessment_gaps`, and severity and
--     priority are row invariants of the adjusted score, so a forged severity
--     is refused even from tooling.
--   * A gap is never closed on a promise. Closing an action needs accepted
--     evidence attached to it, or a reviewer who is not its owner.
--
-- `packages/core/src/gaps.ts` holds the same rules for the API and the UI;
-- `apps/web/tests/unit/gap-register.test.ts` parses this file and fails if the
-- two ever differ (D-053).
--
-- Layout: (1) Prisma-generated DDL; (2) the rules, in SQL; (3) CHECK
-- vocabularies and row invariants; (4) the generator; (5) the action
-- workflow; (6) evidence on an action — widening evidence_links; (7) finalise
-- freezes the register; (8) audit; (9) grants + RLS; (10) apply-time
-- assertions.
--
-- Decisions: D-054 (a gap opens at adjusted <= 3 — not the red-flag
-- threshold); D-055 (due dates from priority, stored); D-056 (what closing
-- requires); D-057 (regeneration never discards human work); D-058 (a
-- finalised assessment's gaps are frozen, its actions live on); D-059 (the
-- gap/action shape and the evidence_links widening).

-- ===========================================================================
-- (1) DDL
-- ===========================================================================

-- CreateTable
CREATE TABLE "assessment_gaps" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "assessment_id" UUID NOT NULL,
    "question_code" TEXT NOT NULL,
    "domain_code" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "adjusted_score" SMALLINT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'open',
    "finding" TEXT NOT NULL,
    "recommended_fix" TEXT,
    "generated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assessment_gaps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gap_actions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "gap_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "owner_user_id" UUID,
    "owner_role" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "due_date" DATE,
    "closed_at" TIMESTAMPTZ(6),
    "closed_by" UUID,
    "closure_basis" TEXT,
    "notes" TEXT,
    "updated_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gap_actions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "assessment_gaps_organization_id_idx" ON "assessment_gaps"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "assessment_gaps_organization_id_assessment_id_question_code_key" ON "assessment_gaps"("organization_id", "assessment_id", "question_code");

-- CreateIndex
CREATE UNIQUE INDEX "assessment_gaps_organization_id_id_key" ON "assessment_gaps"("organization_id", "id");

-- CreateIndex
CREATE INDEX "gap_actions_organization_id_idx" ON "gap_actions"("organization_id");

-- CreateIndex
CREATE INDEX "gap_actions_gap_id_idx" ON "gap_actions"("gap_id");

-- CreateIndex
CREATE UNIQUE INDEX "gap_actions_organization_id_id_key" ON "gap_actions"("organization_id", "id");

-- AddForeignKey
ALTER TABLE "assessment_gaps" ADD CONSTRAINT "assessment_gaps_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_gaps" ADD CONSTRAINT "assessment_gaps_organization_id_assessment_id_fkey" FOREIGN KEY ("organization_id", "assessment_id") REFERENCES "assessments"("organization_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_gaps" ADD CONSTRAINT "assessment_gaps_organization_id_assessment_id_question_cod_fkey" FOREIGN KEY ("organization_id", "assessment_id", "question_code") REFERENCES "assessment_questions"("organization_id", "assessment_id", "question_code") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gap_actions" ADD CONSTRAINT "gap_actions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gap_actions" ADD CONSTRAINT "gap_actions_organization_id_gap_id_fkey" FOREIGN KEY ("organization_id", "gap_id") REFERENCES "assessment_gaps"("organization_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gap_actions" ADD CONSTRAINT "gap_actions_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gap_actions" ADD CONSTRAINT "gap_actions_closed_by_fkey" FOREIGN KEY ("closed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gap_actions" ADD CONSTRAINT "gap_actions_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;



-- ===========================================================================
-- (2) The rules, in SQL — mirrors packages/core/src/gaps.ts
-- ===========================================================================

-- An applicable answer whose adjusted score is 3 OR BELOW opens a gap — the
-- workbook's Gap_Action_Tracker!D, `IF(Responses!$J2<=3, "Yes", "No")`.
--
-- This is NOT the red-flag threshold (`app.red_flag_max_adjusted()` = 2,
-- D-046). One is work to do, the other caps the score; merging them silently
-- drops every "Low" gap. 3 of 5 is "Implementing", not done (D-054).
CREATE OR REPLACE FUNCTION app.gap_max_adjusted()
RETURNS integer
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = ''
AS $$
  SELECT 3;
$$;

-- The remediation priority a severity carries — the workbook's Responses!L.
-- It comes from SEVERITY, which is always present; never from the question's
-- authored priority, which is null on 234 bank questions and is never guessed.
CREATE OR REPLACE FUNCTION app.question_priority(p_severity text)
RETURNS text
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = ''
AS $$
  SELECT CASE p_severity
    WHEN 'critical' THEN 'P0'
    WHEN 'high' THEN 'P1'
    WHEN 'medium' THEN 'P2'
    WHEN 'low' THEN 'P3'
    WHEN 'improvement' THEN 'P3'
    WHEN 'no_gap' THEN 'Monitor'
  END;
$$;

-- Days from the day a gap is first opened to its default due date (D-055).
-- NULL is "next assessment cycle": a Low gap is real work, but it is not part
-- of the 90-day sprint and gets no invented date.
CREATE OR REPLACE FUNCTION app.gap_due_days(p_priority text)
RETURNS integer
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = ''
AS $$
  SELECT CASE p_priority
    WHEN 'P0' THEN 30
    WHEN 'P1' THEN 60
    WHEN 'P2' THEN 90
  END;
$$;

-- The legal moves between action statuses. A Blocked action cannot be closed
-- directly; a Closed one reopens to In Progress only (D-056).
CREATE OR REPLACE FUNCTION app.gap_action_transition_allowed(p_from text, p_to text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = ''
AS $$
  SELECT (p_from, p_to) IN (
    ('open', 'in_progress'),
    ('open', 'blocked'),
    ('open', 'closed'),
    ('in_progress', 'open'),
    ('in_progress', 'blocked'),
    ('in_progress', 'closed'),
    ('blocked', 'open'),
    ('blocked', 'in_progress'),
    ('closed', 'in_progress')
  );
$$;

REVOKE ALL ON FUNCTION app.gap_max_adjusted(), app.question_priority(text), app.gap_due_days(text),
  app.gap_action_transition_allowed(text, text) FROM PUBLIC;
-- Pure functions over no data.
GRANT EXECUTE ON FUNCTION app.gap_max_adjusted(), app.question_priority(text), app.gap_due_days(text),
  app.gap_action_transition_allowed(text, text) TO authenticated;


-- ===========================================================================
-- (3) Constraints Prisma cannot express
-- ===========================================================================

ALTER TABLE public.assessment_gaps
  ADD CONSTRAINT assessment_gaps_state_check CHECK (state IN ('open', 'superseded')),
  ADD CONSTRAINT assessment_gaps_severity_check CHECK (severity IN ('critical', 'high', 'medium', 'low')),
  ADD CONSTRAINT assessment_gaps_priority_check CHECK (priority IN ('P0', 'P1', 'P2', 'P3')),
  -- A gap exists only at or below the threshold: there is no such thing as a
  -- gap for an answer that scored 4.
  ADD CONSTRAINT assessment_gaps_adjusted_opens_a_gap
    CHECK (adjusted_score >= 0 AND adjusted_score <= app.gap_max_adjusted()),
  -- Severity and priority are INVARIANTS of the adjusted score, not columns
  -- somebody fills in. A forged severity is refused even from tooling.
  ADD CONSTRAINT assessment_gaps_severity_is_derived
    CHECK (severity = app.question_severity(adjusted_score::integer)),
  ADD CONSTRAINT assessment_gaps_priority_is_derived
    CHECK (priority = app.question_priority(severity)),
  ADD CONSTRAINT assessment_gaps_finding_not_blank CHECK (btrim(finding) <> ''),
  ADD CONSTRAINT assessment_gaps_code_check CHECK (domain_code IN (
    'GOV', 'INV', 'ROPA', 'PURPOSE', 'NOTICE', 'CONSENT', 'RIGHTS', 'GRIEVANCE',
    'RETENTION', 'ACCURACY', 'SECURITY', 'BREACH', 'VENDOR', 'CHILD',
    'CROSSBORDER', 'SDF_AI'));

ALTER TABLE public.gap_actions
  ADD CONSTRAINT gap_actions_status_check CHECK (status IN ('open', 'in_progress', 'blocked', 'closed')),
  ADD CONSTRAINT gap_actions_closure_basis_check
    CHECK (closure_basis IS NULL OR closure_basis IN ('evidence', 'reviewer_approval')),
  -- The D-043 shape: closed, and when, and on what basis — all three or none.
  -- `closed_by` is not in the equation only because its FK is SET NULL.
  ADD CONSTRAINT gap_actions_closed_has_timestamp CHECK ((status = 'closed') = (closed_at IS NOT NULL)),
  ADD CONSTRAINT gap_actions_closed_has_basis CHECK ((status = 'closed') = (closure_basis IS NOT NULL)),
  ADD CONSTRAINT gap_actions_open_has_no_closer CHECK (status = 'closed' OR closed_by IS NULL),
  -- Nobody approves their own work. The trigger gives the friendly message;
  -- this is the invariant, and it binds tooling too.
  ADD CONSTRAINT gap_actions_no_self_approval CHECK (
    closure_basis IS DISTINCT FROM 'reviewer_approval'
    OR closed_by IS NULL OR owner_user_id IS NULL OR closed_by <> owner_user_id),
  ADD CONSTRAINT gap_actions_title_not_blank CHECK (btrim(title) <> ''),
  ADD CONSTRAINT gap_actions_title_length CHECK (char_length(title) <= 500),
  ADD CONSTRAINT gap_actions_owner_role_length CHECK (char_length(owner_role) <= 200),
  ADD CONSTRAINT gap_actions_notes_length CHECK (char_length(notes) <= 4000);

CREATE TRIGGER assessment_gaps_touch_updated_at BEFORE UPDATE ON public.assessment_gaps
  FOR EACH ROW EXECUTE FUNCTION app.touch_updated_at();
CREATE TRIGGER gap_actions_touch_updated_at BEFORE UPDATE ON public.gap_actions
  FOR EACH ROW EXECUTE FUNCTION app.touch_updated_at();


-- ===========================================================================
-- (4) The generator
-- ===========================================================================

-- What the CURRENT answers say the gaps are. One row per applicable answer at
-- or below the threshold.
--
-- Three kinds of question produce no row, and they are different facts: a
-- Scoped Out domain has no questions at all (D-038); a Not Applicable answer
-- was excluded with a reason; an unanswered question is outstanding — not yet
-- assessed, which is not the same as assessed and found weak.
--
-- Severity is READ off the stored adjusted score, never recomputed from the
-- claim. The text comes from the SNAPSHOT (`assessment_questions`); the
-- recommended fix from the exact question VERSION that snapshot names, never
-- from "whatever the bank says today" (D-035).
CREATE OR REPLACE FUNCTION app.assessment_derived_gaps(
  p_organization_id uuid,
  p_assessment_id uuid
)
RETURNS TABLE (
  question_code text,
  domain_code text,
  adjusted_score smallint,
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
  SELECT
    r.question_code,
    q.domain_code,
    r.adjusted_score,
    app.question_severity(r.adjusted_score::integer),
    app.question_priority(app.question_severity(r.adjusted_score::integer)),
    'Review and remediate: ' || q.question_text,
    v.recommended_fix,
    left(COALESCE(NULLIF(btrim(v.recommended_fix), ''), 'Review and remediate: ' || q.question_text), 500),
    left(q.suggested_owner, 200)
  FROM public.assessment_responses r
  JOIN public.assessment_questions q
    ON q.organization_id = r.organization_id
   AND q.assessment_id = r.assessment_id
   AND q.question_code = r.question_code
  LEFT JOIN public.question_versions v
    ON v.question_code = q.question_code AND v.version = q.question_version
  WHERE r.organization_id = p_organization_id
    AND r.assessment_id = p_assessment_id
    AND r.applicability_decision = 'applicable'
    AND r.adjusted_score <= app.gap_max_adjusted();
$$;

-- Has anybody worked on this gap's action? If so, regeneration must not
-- discard it (D-057).
CREATE OR REPLACE FUNCTION app.gap_has_human_work(p_organization_id uuid, p_gap_id uuid)
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
      AND a.gap_id = p_gap_id
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

-- Bring the register in line with the current answers. No permission check
-- and no audit row: this is the engine, called by the RPC below, by
-- `finalise_assessment`, and by the seed.
--
-- THE REGENERATION RULE (D-057). Gaps are derived data and follow the
-- answers — but an action somebody has worked on is never silently discarded:
--   * an answer that still opens a gap → its gap is refreshed in place;
--   * an answer that newly opens one → a gap, and one action for it;
--   * an answer that no longer opens one → its gap is DELETED if nobody
--     touched its action, and marked `superseded` if somebody did;
--   * an action that already exists is NEVER rewritten — not its owner, its
--     notes, its status, nor its due date. A due date is stored once, on the
--     day the gap first opens, or every report of the same assessment would
--     show different dates (D-055).
CREATE OR REPLACE FUNCTION app.refresh_assessment_gaps(
  p_organization_id uuid,
  p_assessment_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  -- "Today" for an Indian Data Fiduciary. A due date is a calendar date, and
  -- the server's UTC date is yesterday's for the first 5½ hours of every day.
  v_today date := (now() AT TIME ZONE 'Asia/Kolkata')::date;
  v_opened integer;
  v_superseded integer;
  v_removed integer;
BEGIN
  WITH upserted AS (
    INSERT INTO public.assessment_gaps AS g (
      organization_id, assessment_id, question_code, domain_code, severity, priority,
      adjusted_score, state, finding, recommended_fix
    )
    SELECT
      p_organization_id, p_assessment_id, d.question_code, d.domain_code, d.severity, d.priority,
      d.adjusted_score, 'open', d.finding, d.recommended_fix
    FROM app.assessment_derived_gaps(p_organization_id, p_assessment_id) d
    ON CONFLICT (organization_id, assessment_id, question_code) DO UPDATE
      SET domain_code = EXCLUDED.domain_code,
          severity = EXCLUDED.severity,
          priority = EXCLUDED.priority,
          adjusted_score = EXCLUDED.adjusted_score,
          state = 'open',
          finding = EXCLUDED.finding,
          recommended_fix = EXCLUDED.recommended_fix
      -- An unchanged gap is not touched at all, so regenerating twice is a no-op.
      WHERE (g.domain_code, g.severity, g.priority, g.adjusted_score, g.state, g.finding, g.recommended_fix)
            IS DISTINCT FROM
            (EXCLUDED.domain_code, EXCLUDED.severity, EXCLUDED.priority, EXCLUDED.adjusted_score, 'open',
             EXCLUDED.finding, EXCLUDED.recommended_fix)
    RETURNING (xmax = 0) AS inserted
  )
  SELECT count(*) FILTER (WHERE inserted)::integer INTO v_opened FROM upserted;

  -- One action per gap that has none. Never a second one, never a rewrite.
  INSERT INTO public.gap_actions (organization_id, gap_id, title, owner_role, status, due_date)
  SELECT g.organization_id, g.id, d.action_title, d.owner_role, 'open', v_today + app.gap_due_days(g.priority)
  FROM public.assessment_gaps g
  JOIN app.assessment_derived_gaps(p_organization_id, p_assessment_id) d ON d.question_code = g.question_code
  WHERE g.organization_id = p_organization_id
    AND g.assessment_id = p_assessment_id
    AND NOT EXISTS (
      SELECT 1 FROM public.gap_actions a WHERE a.organization_id = g.organization_id AND a.gap_id = g.id
    );

  -- The answer no longer opens a gap, but somebody worked on the action:
  -- keep the row, and say what happened to it.
  UPDATE public.assessment_gaps g
  SET state = 'superseded'
  WHERE g.organization_id = p_organization_id
    AND g.assessment_id = p_assessment_id
    AND g.state <> 'superseded'
    AND NOT EXISTS (
      SELECT 1 FROM app.assessment_derived_gaps(p_organization_id, p_assessment_id) d
      WHERE d.question_code = g.question_code
    )
    AND app.gap_has_human_work(g.organization_id, g.id);
  GET DIAGNOSTICS v_superseded = ROW_COUNT;

  -- …and nobody did: the gap was derived data and nothing more, so it goes.
  DELETE FROM public.assessment_gaps g
  WHERE g.organization_id = p_organization_id
    AND g.assessment_id = p_assessment_id
    AND NOT EXISTS (
      SELECT 1 FROM app.assessment_derived_gaps(p_organization_id, p_assessment_id) d
      WHERE d.question_code = g.question_code
    )
    AND NOT app.gap_has_human_work(g.organization_id, g.id);
  GET DIAGNOSTICS v_removed = ROW_COUNT;

  RETURN jsonb_build_object('opened', v_opened, 'superseded', v_superseded, 'removed', v_removed);
END;
$$;

-- The register's counts, as the RPC returns them and the audit row records.
CREATE OR REPLACE FUNCTION app.assessment_gap_counts(
  p_organization_id uuid,
  p_assessment_id uuid
)
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
  FROM public.assessment_gaps g
  WHERE g.organization_id = p_organization_id AND g.assessment_id = p_assessment_id;
$$;

REVOKE ALL ON FUNCTION app.assessment_derived_gaps(uuid, uuid), app.gap_has_human_work(uuid, uuid),
  app.refresh_assessment_gaps(uuid, uuid), app.assessment_gap_counts(uuid, uuid) FROM PUBLIC;

-- The register's only user-reachable write path. The caller passes two ids
-- and nothing else: every row is derived in SQL from the stored adjusted
-- scores, so there is no severity, priority or finding for a caller to forge.
CREATE OR REPLACE FUNCTION public.generate_assessment_gaps(
  p_organization_id uuid,
  p_assessment_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_actor uuid := app.current_user_id();
  v_status text;
  v_changes jsonb;
  v_counts jsonb;
BEGIN
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'Sign in to continue.' USING ERRCODE = 'TS401';
  END IF;
  IF NOT app.has_permission(p_organization_id, 'gap.write') THEN
    RAISE EXCEPTION 'You do not have permission to generate the gap register.' USING ERRCODE = 'TS403';
  END IF;

  SELECT status INTO v_status
  FROM public.assessments
  WHERE id = p_assessment_id AND organization_id = p_organization_id;

  IF v_status IS NULL THEN
    RAISE EXCEPTION 'Assessment not found.' USING ERRCODE = 'TS404';
  END IF;
  -- A finalised assessment's gaps were generated when it was finalised, from
  -- the answers that were frozen with it. They do not move again (D-058).
  IF v_status = 'finalised' THEN
    RAISE EXCEPTION 'This assessment is finalised — its gap register is frozen with its score.'
      USING ERRCODE = 'TS409';
  END IF;

  v_changes := app.refresh_assessment_gaps(p_organization_id, p_assessment_id);
  v_counts := app.assessment_gap_counts(p_organization_id, p_assessment_id);

  -- ONE audit row for the generation, carrying the counts — not one per gap.
  INSERT INTO public.audit_logs (organization_id, user_id, event_type, entity_type, entity_id, description, metadata)
  VALUES (
    p_organization_id, v_actor, 'assessment.gaps.generated', 'assessments', p_assessment_id,
    'Generated the gap register',
    v_counts || v_changes
  );

  RETURN v_counts || v_changes;
END;
$$;

REVOKE ALL ON FUNCTION public.generate_assessment_gaps(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.generate_assessment_gaps(uuid, uuid) TO authenticated;

-- A finalised assessment's gaps are as frozen as its score: they record what
-- was found, and when (D-058). This binds tooling too, which the absence of a
-- user grant alone would not. The ACTIONS are deliberately not frozen —
-- remediation is what happens after finalising.
--
-- A cascade is told apart from a direct DELETE the same way Slice 5 does it:
-- the parent row is removed first, so by the time this fires on a cascade the
-- assessment is already gone. The ORGANISATION is looked up too: a gap hangs
-- off both, and when a whole organisation is deleted nothing guarantees the
-- assessment's cascade reaches this table before the organisation's own does.
CREATE OR REPLACE FUNCTION app.gap_is_frozen_when_finalised()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_organization_id uuid;
  v_assessment_id uuid;
  v_status text;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_organization_id := OLD.organization_id;
    v_assessment_id := OLD.assessment_id;
  ELSE
    v_organization_id := NEW.organization_id;
    v_assessment_id := NEW.assessment_id;
  END IF;

  SELECT a.status INTO v_status
  FROM public.assessments a
  JOIN public.organizations o ON o.id = a.organization_id
  WHERE a.id = v_assessment_id AND a.organization_id = v_organization_id;

  IF v_status = 'finalised' THEN
    RAISE EXCEPTION 'This assessment is finalised — its gap register is frozen with its score.'
      USING ERRCODE = 'TS409';
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION app.gap_is_frozen_when_finalised() FROM PUBLIC;

CREATE TRIGGER assessment_gaps_frozen_when_finalised
  BEFORE INSERT OR UPDATE OR DELETE ON public.assessment_gaps
  FOR EACH ROW EXECUTE FUNCTION app.gap_is_frozen_when_finalised();


-- ===========================================================================
-- (5) The action workflow
-- ===========================================================================
-- Open → In Progress → Blocked → Closed, with Closed requiring more than a
-- promise (D-056):
--
--   * the action must have an owner — an unowned action has nobody who did
--     the work;
--   * and EITHER a stored artefact reviewed as Adequate or Strong is attached
--     to it — which already took a second person, because nobody reviews
--     their own upload (D-043);
--   * OR the person closing holds `evidence.review` and is not the owner.
--
-- `closed_at`, `closed_by`, `closure_basis` and `updated_by` are stamped here.
-- Users hold no grant on any of them.

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
  IF (NEW.organization_id, NEW.gap_id) IS DISTINCT FROM (OLD.organization_id, OLD.gap_id) THEN
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

-- Links are polymorphic, so no FK can cascade them (D-008).
CREATE OR REPLACE FUNCTION app.gap_action_after_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  DELETE FROM public.evidence_links
  WHERE organization_id = OLD.organization_id
    AND linked_entity_type = 'gap_action'
    AND linked_entity_id = OLD.id;
  RETURN NULL;
END;
$$;

REVOKE ALL ON FUNCTION app.gap_action_before_update(), app.gap_action_after_delete() FROM PUBLIC;

CREATE TRIGGER gap_actions_before_update
  BEFORE UPDATE ON public.gap_actions
  FOR EACH ROW EXECUTE FUNCTION app.gap_action_before_update();
CREATE TRIGGER gap_actions_after_delete
  AFTER DELETE ON public.gap_actions
  FOR EACH ROW EXECUTE FUNCTION app.gap_action_after_delete();


-- ===========================================================================
-- (6) Evidence on an action — widening evidence_links
-- ===========================================================================
-- `evidence_links` was built polymorphic (D-008) but every trigger on it
-- assumed its target was an assessment response. FOUR do, counted in the
-- migrations: before and after insert (Slice 4), before and after delete
-- (Slice 5). All four are widened here.
--
--   * BEFORE INSERT looked the response up unconditionally and would raise
--     TS404 for anything else.
--   * AFTER INSERT and AFTER DELETE re-derive a response's evidence level.
--     They must not fire at all for a gap action: evidence that closes an
--     action says nothing about what the answer scored.
--   * BEFORE DELETE looked the response up to apply the locked-assessment
--     rule.
--
-- The fifth trigger, the audit one, is generic and already records the
-- target's type.
--
-- The object-exists rule (D-039) applies to both targets. The
-- locked-assessment rule applies to RESPONSES only: an answer's evidence is
-- frozen with the score, but remediation — and the evidence that it happened —
-- is exactly what comes after finalising (D-058).

ALTER TABLE public.evidence_links DROP CONSTRAINT evidence_links_entity_type_check;
ALTER TABLE public.evidence_links
  ADD CONSTRAINT evidence_links_entity_type_check
    CHECK (linked_entity_type IN ('assessment_response', 'gap_action'));

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
-- (7) Finalise freezes the register with the score
-- ===========================================================================
-- Slice 5's function, with ONE addition: the gap register is brought in line
-- with the answers immediately before they are frozen. So a finalised
-- assessment's gaps are exactly the gaps of the answers its score was
-- computed from — the snapshot's critical and high counts and the register's
-- always agree — and after this they cannot move (D-058).
--
-- No number changes, so `app.engine_version()` does not.

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

  -- Slice 6: the register, from the same answers, BEFORE the status flips —
  -- once it is 'finalised' the gaps are frozen and this would be refused.
  PERFORM app.refresh_assessment_gaps(p_organization_id, p_assessment_id);

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
      'engineVersion', s.engine_version,
      'gapCount', (app.assessment_gap_counts(p_organization_id, p_assessment_id) -> 'gapCount')
    )
  FROM public.assessment_score_snapshots s
  WHERE s.id = v_snapshot_id;

  RETURN v_snapshot_id;
END;
$$;


-- ===========================================================================
-- (8) Audit (D-027)
-- ===========================================================================
-- Generation is audited by the RPC itself, as one row with the counts. Every
-- USER change to an action — owner, due date, status, closing, reopening — is
-- audited by trigger in the same transaction. Linking and unlinking evidence
-- reuse the Slice 4 trigger, which already records the target's type.
--
-- The metadata gains the workflow fields, so the log shows WHO closed an
-- action and on what basis. Still no free text: an action's title and notes,
-- and a gap's finding, never enter the log — `changed` carries column NAMES.

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

  IF TG_TABLE_NAME = 'organizations' THEN
    v_org := (v_row ->> 'id')::uuid;
    v_entity := v_org;
  ELSE
    v_org := (v_row ->> 'organization_id')::uuid;
    v_entity := COALESCE(v_row ->> 'id', v_row ->> 'vendor_id', v_row ->> 'organization_id')::uuid;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    SELECT COALESCE(jsonb_agg(n.key ORDER BY n.key), '[]'::jsonb) INTO v_changed
    FROM jsonb_each(v_new) n
    WHERE n.key NOT IN ('updated_at', 'derived_at', 'generated_at', 'updated_by')
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
      'name', COALESCE(v_row ->> 'name', v_row ->> 'label'),
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
      'closureBasis', v_row ->> 'closure_basis'
    ))
  );
  RETURN NULL;
END;
$$;

-- UPDATE only: an action is created and removed by the generator, which
-- audits the whole generation as one row.
CREATE TRIGGER gap_actions_audit
  AFTER UPDATE ON public.gap_actions
  FOR EACH ROW EXECUTE FUNCTION app.audit_scope_change('gap');


-- ===========================================================================
-- (9) Grants + RLS (D-019)
-- ===========================================================================

REVOKE ALL ON public.assessment_gaps, public.gap_actions FROM anon, authenticated;

-- SELECT only: a gap is derived. The generator is SECURITY DEFINER, so it is
-- the one way a row appears, changes or goes.
GRANT SELECT ON public.assessment_gaps TO authenticated;

-- An action is created by the generator and edited by people — these columns
-- and no others. No INSERT, no DELETE; no grant on closed_at, closed_by,
-- closure_basis or updated_by, which the trigger stamps.
GRANT SELECT ON public.gap_actions TO authenticated;
GRANT UPDATE (title, owner_user_id, owner_role, status, due_date, notes) ON public.gap_actions TO authenticated;

ALTER TABLE public.assessment_gaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gap_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY assessment_gaps_select_member ON public.assessment_gaps
  FOR SELECT TO authenticated
  USING (
    organization_id IN (SELECT app.current_user_organization_ids())
    AND app.has_permission(organization_id, 'gap.read')
  );

CREATE POLICY gap_actions_select_member ON public.gap_actions
  FOR SELECT TO authenticated
  USING (
    organization_id IN (SELECT app.current_user_organization_ids())
    AND app.has_permission(organization_id, 'gap.read')
  );

CREATE POLICY gap_actions_update_writer ON public.gap_actions
  FOR UPDATE TO authenticated
  USING (
    organization_id IN (SELECT app.current_user_organization_ids())
    AND app.has_permission(organization_id, 'gap.write')
  )
  WITH CHECK (
    organization_id IN (SELECT app.current_user_organization_ids())
    AND app.has_permission(organization_id, 'gap.write')
  );


-- ===========================================================================
-- (10) Apply-time assertions
-- ===========================================================================

DO $$
BEGIN
  -- The gap threshold is 3, and it is NOT the red-flag threshold.
  ASSERT app.gap_max_adjusted() = 3, 'a gap opens at adjusted <= 3';
  ASSERT app.gap_max_adjusted() <> app.red_flag_max_adjusted(), 'the gap and red-flag thresholds differ';

  -- Severity → priority, the whole table.
  ASSERT app.question_priority('critical') = 'P0', 'critical is P0';
  ASSERT app.question_priority('high') = 'P1', 'high is P1';
  ASSERT app.question_priority('medium') = 'P2', 'medium is P2';
  ASSERT app.question_priority('low') = 'P3', 'low is P3';
  ASSERT app.question_priority('improvement') = 'P3', 'improvement is P3';
  ASSERT app.question_priority('no_gap') = 'Monitor', 'no gap is Monitor';
  -- An unevidenced claim of 5 adjusts to 1: High, P1 — not Critical, not P0.
  ASSERT app.question_priority(app.question_severity(app.adjusted_score(5, NULL))) = 'P1',
    'unevidenced claim of 5 is P1';

  -- 30 / 60 / 90, and no invented date for a Low gap.
  ASSERT app.gap_due_days('P0') = 30 AND app.gap_due_days('P1') = 60 AND app.gap_due_days('P2') = 90,
    'due days are 30/60/90';
  ASSERT app.gap_due_days('P3') IS NULL, 'P3 has no due date';

  -- The workflow.
  ASSERT app.gap_action_transition_allowed('open', 'closed'), 'open may close';
  ASSERT NOT app.gap_action_transition_allowed('blocked', 'closed'), 'blocked may not close directly';
  ASSERT app.gap_action_transition_allowed('closed', 'in_progress'), 'closed may reopen';
  ASSERT NOT app.gap_action_transition_allowed('closed', 'open'), 'closed reopens to in progress only';
END;
$$;
