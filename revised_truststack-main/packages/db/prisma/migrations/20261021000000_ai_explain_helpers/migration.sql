-- Slice 11, Stage 1b — explain in the app: the three new explain helpers and
-- thumbs up / down on an answer (SLICE_11 §2.2, §4.7, §4.13, §7a; D-126).
--
-- DPDP anchoring (the Act and G.S.R. 846(E), checked in docs/legal/):
--   * Nothing here widens what is SENT to the model (§4.6, §6.2): the new
--     helpers explain an answer's evidence, a gap and its actions, and a
--     domain's score — each reads with the read permission of what it explains
--     (§4.7), and its context builder (apps/web/lib/ai/tasks/) keeps the
--     allow-list, the black box and the scrub.
--   * Rule 6(1)(c): access stays controlled and logged — a rating is audited by
--     trigger as the person (`ai.feedback`), with the task and the target, never
--     the comment (it is free text and stays in the row, §4.10).
--
-- What is enforced HERE, not only in the application:
--   * Four explain tasks, each read with its own permission beside `ai.use`:
--     question_helper → assessment.read · evidence_helper → evidence.read ·
--     gap_helper → gap.read · score_helper → score.read.
--   * A draft is still recorded once and never changed — EXCEPT its rating:
--     `feedback` (up / down) and an optional `feedback_comment` (≤ 500), given
--     once, by the person who asked, on an answer that was kept (not on a
--     rejected call). Who rated and when are stamped by the database.
--
-- Additive: four columns, the task vocabularies replaced (the 1a migration is
-- frozen), the target-type CHECK widened, the update trigger replaced by a
-- narrower guard, one audit trigger, one column grant, one policy.
--
-- Layout: (1) DDL; (2) vocabularies; (3) the draft's one permitted change;
-- (4) audit; (5) grants + RLS; (6) apply-time assertions.


-- ===========================================================================
-- (1) DDL — the rating (§4.13: "every answer takes a thumbs up or down")
-- ===========================================================================

ALTER TABLE "ai_drafts" ADD COLUMN "feedback" TEXT;
ALTER TABLE "ai_drafts" ADD COLUMN "feedback_comment" TEXT;
ALTER TABLE "ai_drafts" ADD COLUMN "feedback_by" UUID;
ALTER TABLE "ai_drafts" ADD COLUMN "feedback_at" TIMESTAMPTZ(6);

ALTER TABLE "ai_drafts" ADD CONSTRAINT "ai_drafts_feedback_by_fkey" FOREIGN KEY ("feedback_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ai_drafts" ADD CONSTRAINT "ai_drafts_feedback_check" CHECK ("feedback" IS NULL OR "feedback" IN ('up', 'down'));
ALTER TABLE "ai_drafts" ADD CONSTRAINT "ai_drafts_feedback_comment_check"
  CHECK ("feedback_comment" IS NULL OR ("feedback" IS NOT NULL AND char_length("feedback_comment") BETWEEN 1 AND 500));
-- A rating is stamped when it is given, and only an answer that was kept takes one.
ALTER TABLE "ai_drafts" ADD CONSTRAINT "ai_drafts_feedback_stamp_check"
  CHECK (("feedback" IS NULL AND "feedback_at" IS NULL AND "feedback_by" IS NULL) OR ("feedback" IS NOT NULL AND "feedback_at" IS NOT NULL));
ALTER TABLE "ai_drafts" ADD CONSTRAINT "ai_drafts_feedback_status_check" CHECK ("feedback" IS NULL OR "status" <> 'rejected');


-- ===========================================================================
-- (2) Vocabularies — mirrored in packages/core/src/ai-tasks.ts
-- ===========================================================================

-- The tasks the gateway runs. Stage 1b: the four explain helpers.
CREATE OR REPLACE FUNCTION app.ai_tasks()
RETURNS text[]
LANGUAGE sql
IMMUTABLE
SET search_path = ''
AS $$ SELECT ARRAY['question_helper', 'evidence_helper', 'gap_helper', 'score_helper'] $$;

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
  END
$$;

-- What each helper explains: a question, an answer's evidence, a gap (and one
-- of its actions), a domain's score.
ALTER TABLE "ai_drafts" DROP CONSTRAINT "ai_drafts_target_type_check";
ALTER TABLE "ai_drafts" ADD CONSTRAINT "ai_drafts_target_type_check"
  CHECK ("target_type" IN ('assessment_question', 'assessment_response', 'assessment_gap', 'assessment_domain'));


-- ===========================================================================
-- (3) The draft's one permitted change: its rating, once, by the person who asked
-- ===========================================================================

-- Replaces 1a's "never changed" trigger with a narrower guard: every column but
-- the rating is still frozen, for tooling too.
DROP TRIGGER "ai_drafts_refuse_update" ON public.ai_drafts;
DROP FUNCTION app.refuse_ai_draft_change();

CREATE OR REPLACE FUNCTION app.guard_ai_draft_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_actor uuid := app.current_user_id();
  v_rating text[] := ARRAY['feedback', 'feedback_comment', 'feedback_by', 'feedback_at'];
BEGIN
  IF (to_jsonb(NEW) - v_rating) IS DISTINCT FROM (to_jsonb(OLD) - v_rating) THEN
    RAISE EXCEPTION 'An AI draft is recorded once and never changed.' USING ERRCODE = 'TS409';
  END IF;
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

CREATE TRIGGER ai_drafts_guard_update BEFORE UPDATE ON public.ai_drafts
  FOR EACH ROW EXECUTE FUNCTION app.guard_ai_draft_update();


-- ===========================================================================
-- (4) Audit — as the person, never the comment (§4.10)
-- ===========================================================================

CREATE OR REPLACE FUNCTION app.audit_ai_draft_feedback()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.feedback IS NOT DISTINCT FROM OLD.feedback OR NEW.feedback_by IS NULL THEN
    RETURN NULL;
  END IF;
  INSERT INTO public.audit_logs (organization_id, user_id, event_type, entity_type, entity_id, description, metadata)
  VALUES (
    NEW.organization_id, NEW.feedback_by, 'ai.feedback', 'ai_draft', NEW.id,
    CASE NEW.feedback WHEN 'up' THEN 'AI assistant answer rated helpful' ELSE 'AI assistant answer rated not helpful' END,
    jsonb_strip_nulls(jsonb_build_object(
      'task', NEW.task,
      'targetType', NEW.target_type,
      'targetId', NEW.target_id,
      'targetKey', NEW.target_key,
      'feedback', NEW.feedback,
      'withComment', NEW.feedback_comment IS NOT NULL,
      'model', NEW.model,
      'promptVersion', NEW.prompt_version
    ))
  );
  RETURN NULL;
END;
$$;

CREATE TRIGGER ai_drafts_audit_feedback AFTER UPDATE ON public.ai_drafts
  FOR EACH ROW EXECUTE FUNCTION app.audit_ai_draft_feedback();


-- ===========================================================================
-- (5) Grants + RLS (D-019) — the rating only, the asker only
-- ===========================================================================

GRANT UPDATE (feedback, feedback_comment) ON public.ai_drafts TO authenticated;

CREATE POLICY ai_drafts_update_feedback ON public.ai_drafts
  FOR UPDATE TO authenticated
  USING (
    organization_id IN (SELECT app.current_user_organization_ids())
    AND app.has_permission(organization_id, 'ai.use')
    AND app.has_permission(organization_id, app.ai_task_read_permission(task))
    AND requested_by = app.current_user_id()
  )
  WITH CHECK (
    organization_id IN (SELECT app.current_user_organization_ids())
    AND app.has_permission(organization_id, 'ai.use')
    AND app.has_permission(organization_id, app.ai_task_read_permission(task))
    AND requested_by = app.current_user_id()
  );


-- ===========================================================================
-- (6) Apply-time assertions
-- ===========================================================================

DO $$
DECLARE
  v_priv text;
BEGIN
  ASSERT app.ai_tasks() = ARRAY['question_helper', 'evidence_helper', 'gap_helper', 'score_helper'], 'Stage 1b: the four explain helpers';
  ASSERT app.ai_task_read_permission('question_helper') = 'assessment.read'
     AND app.ai_task_read_permission('evidence_helper') = 'evidence.read'
     AND app.ai_task_read_permission('gap_helper') = 'gap.read'
     AND app.ai_task_read_permission('score_helper') = 'score.read', '§4.7: each helper reads with its own permission';
  ASSERT (SELECT count(*) FROM public.permissions WHERE code IN ('assessment.read', 'evidence.read', 'gap.read', 'score.read')) = 4,
    'the read permissions are real permission codes';
  -- Only the rating is writable; the stamps, the answer and the rest are not.
  ASSERT has_column_privilege('authenticated', 'public.ai_drafts', 'feedback', 'UPDATE')
     AND has_column_privilege('authenticated', 'public.ai_drafts', 'feedback_comment', 'UPDATE'), 'the rating is writable';
  FOREACH v_priv IN ARRAY ARRAY['feedback_by', 'feedback_at', 'output', 'status', 'context', 'model', 'requested_by'] LOOP
    ASSERT NOT has_column_privilege('authenticated', 'public.ai_drafts', v_priv, 'UPDATE'), 'drafts: no update of ' || v_priv;
  END LOOP;
  ASSERT NOT has_table_privilege('authenticated', 'public.ai_drafts', 'DELETE'), 'drafts: no delete';
  ASSERT NOT has_table_privilege('anon', 'public.ai_drafts', 'UPDATE'), 'anon: nothing';
  ASSERT NOT EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
                     WHERE n.nspname = 'app' AND p.proname = 'refuse_ai_draft_change'), '1a''s blanket refusal is replaced';
END;
$$;
