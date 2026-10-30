-- Slice 11, Stage 2a — drafts for the registers: a processing record from a
-- description, the Board intimation under Rule 7(2) from a breach, and a
-- response from a rights request — each a draft a person edits and accepts or
-- discards (SLICE_11 §2.3, §4.4, §4.7, §4.10, §7b; D-129).
--
-- DPDP anchoring (the Act and G.S.R. 846(E), checked in docs/legal/):
--   * s.8(6), Rule 7(2)(a)–(b)(i)–(vi): the Board intimation's duty and contents
--     — not a form. The accepted, person-edited text lives on the draft row
--     (D-129.1); recording that the report was made stays the breach register's
--     own step, and the copy actually sent is attached under its Documents. No
--     breach-register change here.
--   * ss.11–14: a rights response's outcome is a person's decision (s.12(3)'s
--     "necessary for the specified purpose or for compliance with any law" is a
--     legal judgement). Accepting a response draft pre-fills the summary only;
--     the outcome is never part of a draft (D-129.2). No rights-register change.
--   * s.8(1), Rule 6(1)(c): the fiduciary stays responsible and access is logged —
--     a decision is taken by a holder of the register's WRITE permission (not only
--     the asker, D-129.3), stamped by the database, and audited as the person
--     (`ai.draft.accepted` / `ai.draft.discarded`), never with the text.
--
-- What is enforced HERE, not only in the application:
--   * Seven tasks: the four explain helpers, and three drafting tasks, each read
--     with its register's read permission beside `ai.use` (§4.7):
--     ropa_draft → ropa.read · breach_intimation_draft → breach.read ·
--     rights_response_draft → rights.read; and DECIDED with its write permission
--     (ropa.write · breach.write · rights.write). An explain task has none, so it
--     can never be accepted.
--   * A draft is still recorded once and never changed — EXCEPT (a) its rating,
--     exactly as Stage 1b (D-127.7), and (b) ONE decision: draft → accepted (with
--     the person's edited text) or draft → discarded, once, by a holder of the
--     task's write permission. Who decided, and when, are stamped.
--   * Postgres ORs permissive policies: through the new decision policy a writer
--     can reach another person's row. So the GUARD — not the policies — keeps a
--     rating to its asker and a decision to a writer.
--
-- Additive: three columns, the task vocabularies replaced (1a's and 1b's
-- migrations are frozen), one new vocabulary function, two CHECKs widened and
-- three added, the update guard replaced (the rating rule kept as it was), one
-- audit trigger, one column grant, one policy. Accepting writes no register row:
-- the person saves through the register's own route.
--
-- Layout: (1) DDL; (2) vocabularies; (3) the draft's two permitted changes;
-- (4) audit; (5) grants + RLS; (6) apply-time assertions.


-- ===========================================================================
-- (1) DDL — the decision (§4.4: `draft | accepted | discarded`, who and when)
-- ===========================================================================

ALTER TABLE "ai_drafts" ADD COLUMN "accepted_output" JSONB;
ALTER TABLE "ai_drafts" ADD COLUMN "decided_by" UUID;
ALTER TABLE "ai_drafts" ADD COLUMN "decided_at" TIMESTAMPTZ(6);

ALTER TABLE "ai_drafts" ADD CONSTRAINT "ai_drafts_decided_by_fkey" FOREIGN KEY ("decided_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- An accepted draft, a discarded one and a rejected call — never a half-answer (§4.3).
ALTER TABLE "ai_drafts" DROP CONSTRAINT "ai_drafts_status_check";
ALTER TABLE "ai_drafts" ADD CONSTRAINT "ai_drafts_status_check" CHECK ("status" IN ('draft', 'rejected', 'accepted', 'discarded'));
ALTER TABLE "ai_drafts" DROP CONSTRAINT "ai_drafts_outcome_check";
ALTER TABLE "ai_drafts" ADD CONSTRAINT "ai_drafts_outcome_check"
  CHECK (("status" IN ('draft', 'accepted', 'discarded') AND "output" IS NOT NULL AND "rejection" IS NULL)
      OR ("status" = 'rejected' AND "output" IS NULL AND "rejection" IS NOT NULL));
-- The person's text belongs to an accepted draft, and only to one.
ALTER TABLE "ai_drafts" ADD CONSTRAINT "ai_drafts_accepted_output_check"
  CHECK (("status" = 'accepted') = ("accepted_output" IS NOT NULL)
     AND ("accepted_output" IS NULL OR jsonb_typeof("accepted_output") = 'object'));
-- A decision is stamped when it is taken (who may later be removed: SET NULL).
ALTER TABLE "ai_drafts" ADD CONSTRAINT "ai_drafts_decided_check"
  CHECK (("status" IN ('accepted', 'discarded')) = ("decided_at" IS NOT NULL)
     AND ("decided_by" IS NULL OR "decided_at" IS NOT NULL));

-- The register's drafts are found by what they are about (the breach's step, the request's response).
CREATE INDEX "ai_drafts_organization_id_target_id_idx" ON "ai_drafts"("organization_id", "target_id");


-- ===========================================================================
-- (2) Vocabularies — mirrored in packages/core/src/ai-tasks.ts
-- ===========================================================================

-- The tasks the gateway runs. Stage 2a: the four explain helpers and three drafting tasks.
CREATE OR REPLACE FUNCTION app.ai_tasks()
RETURNS text[]
LANGUAGE sql
IMMUTABLE
SET search_path = ''
AS $$ SELECT ARRAY['question_helper', 'evidence_helper', 'gap_helper', 'score_helper',
                   'ropa_draft', 'breach_intimation_draft', 'rights_response_draft'] $$;

-- The permission a task's draft is read with, beside `ai.use` (§4.7).
CREATE OR REPLACE FUNCTION app.ai_task_read_permission(p_task text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = ''
AS $$
  SELECT CASE p_task
    WHEN 'question_helper' THEN 'assessment.read'
    WHEN 'evidence_helper' THEN 'evidence.read'
    WHEN 'gap_helper' THEN 'gap.read'
    WHEN 'score_helper' THEN 'score.read'
    WHEN 'ropa_draft' THEN 'ropa.read'
    WHEN 'breach_intimation_draft' THEN 'breach.read'
    WHEN 'rights_response_draft' THEN 'rights.read'
  END
$$;

-- The permission a draft is accepted or discarded with: the register's own
-- write permission (D-129.3). Null for an explain task — it is never accepted.
CREATE OR REPLACE FUNCTION app.ai_task_write_permission(p_task text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = ''
AS $$
  SELECT CASE p_task
    WHEN 'ropa_draft' THEN 'ropa.write'
    WHEN 'breach_intimation_draft' THEN 'breach.write'
    WHEN 'rights_response_draft' THEN 'rights.write'
  END
$$;

-- What a draft is about: 1b's four, a processing record not yet made (no target
-- id), a breach incident, a rights request.
ALTER TABLE "ai_drafts" DROP CONSTRAINT "ai_drafts_target_type_check";
ALTER TABLE "ai_drafts" ADD CONSTRAINT "ai_drafts_target_type_check"
  CHECK ("target_type" IN ('assessment_question', 'assessment_response', 'assessment_gap', 'assessment_domain',
                           'ropa_new', 'breach_incident', 'rights_request'));


-- ===========================================================================
-- (3) The draft's two permitted changes: its rating (1b, unchanged) and one decision
-- ===========================================================================

-- Replaces 1b's guard. The rating rule is 1b's, line for line (D-127.7); the
-- decision rule is new. Every other column is still frozen, for tooling too.
CREATE OR REPLACE FUNCTION app.guard_ai_draft_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_actor uuid := app.current_user_id();
  v_rating text[] := ARRAY['feedback', 'feedback_comment', 'feedback_by', 'feedback_at'];
  v_decision text[] := ARRAY['status', 'accepted_output', 'decided_by', 'decided_at'];
  v_write text;
BEGIN
  IF (to_jsonb(NEW) - v_rating - v_decision) IS DISTINCT FROM (to_jsonb(OLD) - v_rating - v_decision) THEN
    RAISE EXCEPTION 'An AI draft is recorded once and never changed.' USING ERRCODE = 'TS409';
  END IF;

  -- (b) The decision: draft → accepted | discarded, once, by a holder of the task's write permission.
  IF (NEW.status, NEW.accepted_output) IS NOT DISTINCT FROM (OLD.status, OLD.accepted_output) THEN
    NEW.decided_by := OLD.decided_by;
    NEW.decided_at := OLD.decided_at;
  ELSE
    v_write := app.ai_task_write_permission(OLD.task);
    IF v_write IS NULL THEN
      RAISE EXCEPTION 'An explanation is not a draft: there is nothing to accept or discard.' USING ERRCODE = 'TS409';
    END IF;
    IF v_actor IS NULL OR NOT app.has_permission(OLD.organization_id, v_write) THEN
      RAISE EXCEPTION 'Only someone who can write to this register can accept or discard this draft.' USING ERRCODE = 'TS403';
    END IF;
    IF OLD.status = 'rejected' THEN
      RAISE EXCEPTION 'This answer was not kept, so there is nothing to accept or discard.' USING ERRCODE = 'TS409';
    END IF;
    IF OLD.status <> 'draft' THEN
      RAISE EXCEPTION 'This draft has already been accepted or discarded.' USING ERRCODE = 'TS409';
    END IF;
    IF NEW.status NOT IN ('accepted', 'discarded') THEN
      RAISE EXCEPTION 'A draft is either accepted or discarded.' USING ERRCODE = 'TS422';
    END IF;
    IF (NEW.status = 'accepted') <> (NEW.accepted_output IS NOT NULL) THEN
      RAISE EXCEPTION 'An accepted draft keeps the text the person accepted; a discarded one keeps none.' USING ERRCODE = 'TS422';
    END IF;
    NEW.decided_by := v_actor;
    NEW.decided_at := now();
  END IF;

  -- (a) The rating — Stage 1b's rule, unchanged.
  IF (NEW.feedback, NEW.feedback_comment) IS NOT DISTINCT FROM (OLD.feedback, OLD.feedback_comment) THEN
    -- Nothing a person may change has changed: keep the stamps as they were.
    NEW.feedback_by := OLD.feedback_by;
    NEW.feedback_at := OLD.feedback_at;
    RETURN NEW;
  END IF;
  IF v_actor IS NULL OR OLD.requested_by IS DISTINCT FROM v_actor THEN
    RAISE EXCEPTION 'Only the person who asked can rate this answer.' USING ERRCODE = 'TS403';
  END IF;
  IF OLD.feedback IS NOT NULL THEN
    RAISE EXCEPTION 'This answer has already been rated.' USING ERRCODE = 'TS409';
  END IF;
  IF NEW.feedback IS NULL THEN
    RAISE EXCEPTION 'Choose thumbs up or thumbs down.' USING ERRCODE = 'TS422';
  END IF;
  NEW.feedback_by := v_actor;
  NEW.feedback_at := now();
  RETURN NEW;
END;
$$;


-- ===========================================================================
-- (4) Audit — as the person, never the text (§4.10)
-- ===========================================================================

CREATE OR REPLACE FUNCTION app.audit_ai_draft_decision()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.status IS NOT DISTINCT FROM OLD.status OR NEW.status NOT IN ('accepted', 'discarded') THEN
    RETURN NULL;
  END IF;
  INSERT INTO public.audit_logs (organization_id, user_id, event_type, entity_type, entity_id, description, metadata)
  VALUES (
    NEW.organization_id, NEW.decided_by,
    CASE NEW.status WHEN 'accepted' THEN 'ai.draft.accepted' ELSE 'ai.draft.discarded' END,
    'ai_draft', NEW.id,
    CASE NEW.status WHEN 'accepted' THEN 'AI assistant draft accepted for a person to save' ELSE 'AI assistant draft discarded' END,
    jsonb_strip_nulls(jsonb_build_object(
      'task', NEW.task,
      'targetType', NEW.target_type,
      'targetId', NEW.target_id,
      'targetKey', NEW.target_key,
      -- Whether the person changed the draft before accepting it — never what it says.
      'edited', CASE WHEN NEW.status = 'accepted' THEN NEW.accepted_output IS DISTINCT FROM NEW.output -> 'draft' END,
      'model', NEW.model,
      'promptVersion', NEW.prompt_version
    ))
  );
  RETURN NULL;
END;
$$;

CREATE TRIGGER ai_drafts_audit_decision AFTER UPDATE ON public.ai_drafts
  FOR EACH ROW EXECUTE FUNCTION app.audit_ai_draft_decision();


-- ===========================================================================
-- (5) Grants + RLS (D-019) — the decision only, a register writer only
-- ===========================================================================

GRANT UPDATE (status, accepted_output) ON public.ai_drafts TO authenticated;

-- OR'd with 1b's `ai_drafts_update_feedback`: the guard above keeps each change to its own people.
CREATE POLICY ai_drafts_update_decision ON public.ai_drafts
  FOR UPDATE TO authenticated
  USING (
    organization_id IN (SELECT app.current_user_organization_ids())
    AND app.has_permission(organization_id, 'ai.use')
    AND app.has_permission(organization_id, app.ai_task_read_permission(task))
    AND app.ai_task_write_permission(task) IS NOT NULL
    AND app.has_permission(organization_id, app.ai_task_write_permission(task))
  )
  WITH CHECK (
    organization_id IN (SELECT app.current_user_organization_ids())
    AND app.has_permission(organization_id, 'ai.use')
    AND app.has_permission(organization_id, app.ai_task_read_permission(task))
    AND app.ai_task_write_permission(task) IS NOT NULL
    AND app.has_permission(organization_id, app.ai_task_write_permission(task))
  );


-- ===========================================================================
-- (6) Apply-time assertions
-- ===========================================================================

DO $$
DECLARE
  v_priv text;
BEGIN
  ASSERT app.ai_tasks() = ARRAY['question_helper', 'evidence_helper', 'gap_helper', 'score_helper',
                                'ropa_draft', 'breach_intimation_draft', 'rights_response_draft'], 'Stage 2a: four explain helpers, three drafting tasks';
  ASSERT app.ai_task_read_permission('ropa_draft') = 'ropa.read'
     AND app.ai_task_read_permission('breach_intimation_draft') = 'breach.read'
     AND app.ai_task_read_permission('rights_response_draft') = 'rights.read', '§4.7: each drafting task reads with its register''s permission';
  ASSERT app.ai_task_read_permission('question_helper') = 'assessment.read'
     AND app.ai_task_read_permission('score_helper') = 'score.read', 'the explain helpers keep their permissions';
  ASSERT app.ai_task_write_permission('ropa_draft') = 'ropa.write'
     AND app.ai_task_write_permission('breach_intimation_draft') = 'breach.write'
     AND app.ai_task_write_permission('rights_response_draft') = 'rights.write', 'D-129.3: a register writer decides';
  ASSERT app.ai_task_write_permission('question_helper') IS NULL
     AND app.ai_task_write_permission('evidence_helper') IS NULL
     AND app.ai_task_write_permission('gap_helper') IS NULL
     AND app.ai_task_write_permission('score_helper') IS NULL, 'an explanation is never accepted';
  ASSERT (SELECT count(*) FROM public.permissions
          WHERE code IN ('ropa.read', 'breach.read', 'rights.read', 'ropa.write', 'breach.write', 'rights.write')) = 6,
    'the permissions are real permission codes';
  -- A person may change the rating and the decision; never a stamp, the answer or the rest.
  FOREACH v_priv IN ARRAY ARRAY['feedback', 'feedback_comment', 'status', 'accepted_output'] LOOP
    ASSERT has_column_privilege('authenticated', 'public.ai_drafts', v_priv, 'UPDATE'), 'drafts: ' || v_priv || ' is writable';
  END LOOP;
  FOREACH v_priv IN ARRAY ARRAY['decided_by', 'decided_at', 'feedback_by', 'feedback_at', 'output', 'context', 'model', 'requested_by', 'task', 'target_id'] LOOP
    ASSERT NOT has_column_privilege('authenticated', 'public.ai_drafts', v_priv, 'UPDATE'), 'drafts: no update of ' || v_priv;
  END LOOP;
  ASSERT NOT has_table_privilege('authenticated', 'public.ai_drafts', 'DELETE'), 'drafts: no delete';
  ASSERT NOT has_table_privilege('anon', 'public.ai_drafts', 'UPDATE'), 'anon: nothing';
  ASSERT NOT EXISTS (SELECT 1 FROM public.ai_drafts WHERE status NOT IN ('draft', 'rejected')), 'nothing is decided on apply';
END;
$$;
