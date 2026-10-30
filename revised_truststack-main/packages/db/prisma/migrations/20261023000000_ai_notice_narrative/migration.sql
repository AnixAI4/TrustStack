-- Slice 11, Stage 2b — a privacy notice drafted from the processing register,
-- its translation (Hindi, Marathi), and the narrative for the Exposure Brief, the
-- Programme Status Report and the evidence pack (SLICE_11 §2.3, §7c; D-133).
--
-- DPDP anchoring (the Act and G.S.R. 846(E), checked in docs/legal/):
--   * s.5(1), Rule 3: a notice accompanies or precedes a request for CONSENT — it
--     is drafted from the consent-based records only (D-133.3); the person saves
--     and publishes it through the notice's own routes (consent.write,
--     consent.publish). Nothing here writes a notice.
--   * s.5(3): English or any Eighth Schedule language. A translation is a draft of
--     a NEW notice in that language, keeping every purpose's key (D-133.2).
--   * s.8(1): the fiduciary stays responsible; the narrative is a person's text,
--     accepted by a `report.generate` holder, printed only in a NEW version.
--
-- What is enforced HERE, not only in the application:
--   * Ten tasks: 1b's four, 2a's three, and 2b's three drafting tasks, read with
--     their register's permission beside `ai.use` and decided with its write one:
--     notice_draft, notice_translation_draft → consent.read / consent.write;
--     report_narrative_draft → report.read / report.generate (§7c.1).
--   * D-133.1 — a narrated report is the stored document plus the narrative:
--       - the Exposure Brief, the Programme Status Report and the evidence pack
--         keep the document they printed (`reports.document`), written ONCE by
--         `complete_report` as the report finishes, and never again;
--       - `begin_narrated_report` makes version N+1 from version N: the same
--         snapshot, the same assessment, the same date, a new file — only from a
--         finished version N that kept its document, only with an ACCEPTED
--         narrative drafted about version N, and once per narrative;
--       - `complete_report` refuses a narrated version whose document is not
--         version N's sections, caveats and notes with ONE section in front.
--   * A report stays immutable (`app.report_is_immutable`, replaced: the document
--     joins the finish step; the two new pointers join the cleared pointers).
--
-- Additive: three columns and their FKs on `reports`, two CHECKs and one index;
-- the task vocabularies and the target CHECK replaced (1a–2a's migrations are
-- frozen); `complete_report` gains a document parameter (the two-argument
-- version is dropped); one new function. No trigger is added to `ai_drafts`.
--
-- Layout: (1) DDL; (2) vocabularies; (3) immutability; (4) the report functions;
-- (5) grants; (6) apply-time assertions.


-- ===========================================================================
-- (1) DDL — the document a report printed, and a narrated version's two links
-- ===========================================================================

ALTER TABLE "reports" ADD COLUMN "document" JSONB;
ALTER TABLE "reports" ADD COLUMN "narrated_from_id" UUID;
ALTER TABLE "reports" ADD COLUMN "narrative_draft_id" UUID;

-- Composite: a narrated version and its narrative are the same organisation's (D-027).
ALTER TABLE public.reports
  ADD CONSTRAINT reports_organization_id_narrated_from_id_fkey
    FOREIGN KEY (organization_id, narrated_from_id) REFERENCES public.reports (organization_id, id)
    ON DELETE SET NULL (narrated_from_id) ON UPDATE CASCADE,
  ADD CONSTRAINT reports_organization_id_narrative_draft_id_fkey
    FOREIGN KEY (organization_id, narrative_draft_id) REFERENCES public.ai_drafts (organization_id, id)
    ON DELETE SET NULL (narrative_draft_id) ON UPDATE CASCADE;

-- Only the three narratable kinds keep a document, and it is a document (an object).
ALTER TABLE public.reports
  ADD CONSTRAINT reports_document_check CHECK (
    document IS NULL
    OR (jsonb_typeof(document) = 'object' AND kind IN ('exposure_brief', 'programme_status', 'evidence_pack'))),
  ADD CONSTRAINT reports_narrated_check CHECK (
    (narrated_from_id IS NULL AND narrative_draft_id IS NULL)
    OR kind IN ('exposure_brief', 'programme_status', 'evidence_pack'));

-- One narrated version per narrative (a failed attempt may be retried).
CREATE UNIQUE INDEX reports_narrative_draft_key ON public.reports (narrative_draft_id)
  WHERE narrative_draft_id IS NOT NULL AND status <> 'failed';


-- ===========================================================================
-- (2) Vocabularies — mirrored in packages/core/src/ai-tasks.ts
-- ===========================================================================

-- Stage 2b: the four explain helpers, 2a's three drafting tasks and 2b's three.
CREATE OR REPLACE FUNCTION app.ai_tasks()
RETURNS text[]
LANGUAGE sql
IMMUTABLE
SET search_path = ''
AS $$ SELECT ARRAY['question_helper', 'evidence_helper', 'gap_helper', 'score_helper',
                   'ropa_draft', 'breach_intimation_draft', 'rights_response_draft',
                   'notice_draft', 'notice_translation_draft', 'report_narrative_draft'] $$;

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
    WHEN 'notice_draft' THEN 'consent.read'
    WHEN 'notice_translation_draft' THEN 'consent.read'
    WHEN 'report_narrative_draft' THEN 'report.read'
  END
$$;

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
    WHEN 'notice_draft' THEN 'consent.write'
    WHEN 'notice_translation_draft' THEN 'consent.write'
    WHEN 'report_narrative_draft' THEN 'report.generate'
  END
$$;

-- What a draft is about: 2a's seven, a notice not yet made (no target id), the
-- published notice a translation is made from, the report version a narrative is about.
ALTER TABLE "ai_drafts" DROP CONSTRAINT "ai_drafts_target_type_check";
ALTER TABLE "ai_drafts" ADD CONSTRAINT "ai_drafts_target_type_check"
  CHECK ("target_type" IN ('assessment_question', 'assessment_response', 'assessment_gap', 'assessment_domain',
                           'ropa_new', 'breach_incident', 'rights_request',
                           'notice_new', 'privacy_notice', 'report'));


-- ===========================================================================
-- (3) Immutability — the document is written by the finish step, once
-- ===========================================================================

-- Replaces Slice 9's. The ONLY changes ever allowed are still:
--   * running → ready | failed, touching nothing but the status, the size, the
--     time it finished, the error — and now the document it printed;
--   * a cleared pointer when what it points at goes (the FK actions) — now also
--     the version a narrated one came from and its narrative.
CREATE OR REPLACE FUNCTION app.report_is_immutable()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_finish constant text[] := ARRAY['status', 'byte_size', 'generated_at', 'error', 'document'];
  v_pointers constant text[] := ARRAY['assessment_id', 'exposure_snapshot_id', 'generated_by', 'narrated_from_id', 'narrative_draft_id'];
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF EXISTS (SELECT 1 FROM public.organizations o WHERE o.id = OLD.organization_id) THEN
      RAISE EXCEPTION 'A report cannot be deleted — it is a record of what was shown on the day. Generate a new version instead.'
        USING ERRCODE = 'TS409';
    END IF;
    RETURN OLD;
  END IF;

  IF OLD.status = 'running' AND NEW.status IN ('ready', 'failed')
     AND (to_jsonb(NEW) - v_finish) = (to_jsonb(OLD) - v_finish)
     AND OLD.document IS NULL THEN
    RETURN NEW;
  END IF;
  IF NEW.status = OLD.status
     AND (to_jsonb(NEW) - v_pointers) = (to_jsonb(OLD) - v_pointers)
     AND (NEW.assessment_id IS NULL OR NEW.assessment_id = OLD.assessment_id)
     AND (NEW.exposure_snapshot_id IS NULL OR NEW.exposure_snapshot_id = OLD.exposure_snapshot_id)
     AND (NEW.generated_by IS NULL OR NEW.generated_by = OLD.generated_by)
     AND (NEW.narrated_from_id IS NULL OR NEW.narrated_from_id = OLD.narrated_from_id)
     AND (NEW.narrative_draft_id IS NULL OR NEW.narrative_draft_id = OLD.narrative_draft_id) THEN
    RETURN NEW;
  END IF;
  RAISE EXCEPTION 'A report cannot be changed — generate a new version instead.' USING ERRCODE = 'TS409';
END;
$$;

REVOKE ALL ON FUNCTION app.report_is_immutable() FROM PUBLIC;


-- ===========================================================================
-- (4) The report functions
-- ===========================================================================

-- The kinds that keep their document, and so may be narrated (D-133.1).
CREATE OR REPLACE FUNCTION app.report_narratable_kinds()
RETURNS text[]
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = ''
AS $$ SELECT ARRAY['evidence_pack', 'exposure_brief', 'programme_status'] $$;

REVOKE ALL ON FUNCTION app.report_narratable_kinds() FROM PUBLIC;

-- Slice 9's, with the document. A narratable kind MUST keep the document it
-- printed; any other kind keeps none. A narrated version's document must be its
-- source's sections, caveats and notes, with ONE section in front — the
-- narrative: the same figures, nothing removed or reworded (D-133.1).
DROP FUNCTION public.complete_report(uuid, uuid);

CREATE FUNCTION public.complete_report(p_organization_id uuid, p_report_id uuid, p_document jsonb DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_row public.reports := app.report_for_finish(p_organization_id, p_report_id);
  v_size bigint := app.report_object_size(v_row.storage_path);
  v_source jsonb;
BEGIN
  IF v_size IS NULL OR v_size <= 0 THEN
    RAISE EXCEPTION 'The report file has not been stored.' USING ERRCODE = 'TS422';
  END IF;

  IF v_row.kind = ANY (app.report_narratable_kinds()) THEN
    IF p_document IS NULL OR jsonb_typeof(p_document) <> 'object' OR p_document ->> 'kind' IS DISTINCT FROM v_row.kind
       OR jsonb_typeof(p_document -> 'sections') <> 'array' THEN
      RAISE EXCEPTION 'This report must keep the document it printed.' USING ERRCODE = 'TS422';
    END IF;
    IF v_row.narrated_from_id IS NOT NULL THEN
      SELECT r.document INTO v_source FROM public.reports r
      WHERE r.organization_id = v_row.organization_id AND r.id = v_row.narrated_from_id;
      IF v_source IS NULL
         OR jsonb_array_length(p_document -> 'sections') <> jsonb_array_length(v_source -> 'sections') + 1
         OR (p_document -> 'sections') - 0 IS DISTINCT FROM v_source -> 'sections'
         OR p_document -> 'caveats' IS DISTINCT FROM v_source -> 'caveats'
         OR p_document -> 'notes' IS DISTINCT FROM v_source -> 'notes' THEN
        RAISE EXCEPTION 'A narrated version prints the figures of the version it was made from, with the narrative in front — nothing else.'
          USING ERRCODE = 'TS422';
      END IF;
    END IF;
  ELSIF p_document IS NOT NULL THEN
    RAISE EXCEPTION 'Only an Exposure Brief, a Programme Status Report or an evidence pack keeps its document.' USING ERRCODE = 'TS422';
  END IF;

  UPDATE public.reports
  SET status = 'ready', byte_size = v_size, generated_at = now(), document = p_document
  WHERE id = v_row.id;

  INSERT INTO public.audit_logs (organization_id, user_id, event_type, entity_type, entity_id, description, metadata)
  VALUES (
    v_row.organization_id, app.current_user_id(), 'report.generated', 'reports', v_row.id,
    'Generated a report',
    jsonb_strip_nulls(jsonb_build_object('kind', v_row.kind, 'format', v_row.format, 'version', v_row.version,
                       'fileName', v_row.file_name, 'byteSize', v_size,
                       'subjectUserId', v_row.subject_user_id, 'exposureSnapshotId', v_row.exposure_snapshot_id,
                       'narratedFromId', v_row.narrated_from_id, 'narrativeDraftId', v_row.narrative_draft_id)));
END;
$$;

-- Version N+1 of a report: version N's stored figures with an accepted narrative
-- in front. Nothing is recomputed — the same snapshot, assessment and date —
-- so the figures cannot move between the two versions (D-133.1, pitfall 1).
CREATE OR REPLACE FUNCTION public.begin_narrated_report(p_organization_id uuid, p_report_id uuid, p_draft_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_actor uuid := app.current_user_id();
  v_source public.reports;
  v_draft record;
  v_version integer;
  v_id uuid := gen_random_uuid();
  v_file text;
  v_path text;
BEGIN
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'Sign in to continue.' USING ERRCODE = 'TS401';
  END IF;
  IF p_organization_id IS NULL OR p_organization_id NOT IN (SELECT app.current_user_organization_ids())
     OR NOT app.has_permission(p_organization_id, 'report.generate') THEN
    RAISE EXCEPTION 'You do not have permission to generate this report.' USING ERRCODE = 'TS403';
  END IF;

  SELECT * INTO v_source FROM public.reports r WHERE r.id = p_report_id AND r.organization_id = p_organization_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Report not found.' USING ERRCODE = 'TS404';
  END IF;
  IF NOT (v_source.kind = ANY (app.report_narratable_kinds())) THEN
    RAISE EXCEPTION 'Only an Exposure Brief, a Programme Status Report or an evidence pack can carry a narrative.' USING ERRCODE = 'TS422';
  END IF;
  IF v_source.status <> 'ready' THEN
    RAISE EXCEPTION 'Only a finished report can carry a narrative.' USING ERRCODE = 'TS409';
  END IF;
  IF v_source.narrated_from_id IS NOT NULL THEN
    RAISE EXCEPTION 'This version already carries a narrative. Draft a new one on the version it was made from.' USING ERRCODE = 'TS409';
  END IF;
  IF v_source.document IS NULL THEN
    RAISE EXCEPTION 'This version was generated before reports kept their figures. Generate a new version, then draft its narrative.' USING ERRCODE = 'TS409';
  END IF;

  SELECT d.status INTO v_draft FROM public.ai_drafts d
  WHERE d.id = p_draft_id AND d.organization_id = p_organization_id
    AND d.task = 'report_narrative_draft' AND d.target_type = 'report' AND d.target_id = v_source.id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Narrative not found for this report.' USING ERRCODE = 'TS404';
  END IF;
  IF v_draft.status <> 'accepted' THEN
    RAISE EXCEPTION 'Accept the narrative first.' USING ERRCODE = 'TS409';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended('report:' || p_organization_id || ':' || v_source.kind || ':-', 0));
  IF EXISTS (SELECT 1 FROM public.reports r WHERE r.narrative_draft_id = p_draft_id AND r.status <> 'failed') THEN
    RAISE EXCEPTION 'This narrative already has its version of the report.' USING ERRCODE = 'TS409';
  END IF;
  SELECT coalesce(max(r.version), 0) + 1 INTO v_version
  FROM public.reports r
  WHERE r.organization_id = p_organization_id AND r.kind = v_source.kind AND r.subject_user_id IS NULL;

  v_file := app.report_file_name(v_source.kind, v_version, v_source.as_of);
  v_path := 'organizations/' || p_organization_id || '/reports/' || v_id || '/' || v_file;

  INSERT INTO public.reports (
    id, organization_id, kind, format, version, subject_user_id, assessment_id, exposure_snapshot_id,
    as_of, status, storage_path, file_name, generated_by, narrated_from_id, narrative_draft_id
  ) VALUES (
    v_id, p_organization_id, v_source.kind, v_source.format, v_version, NULL, v_source.assessment_id, v_source.exposure_snapshot_id,
    v_source.as_of, 'running', v_path, v_file, v_actor, v_source.id, p_draft_id
  );

  INSERT INTO public.audit_logs (organization_id, user_id, event_type, entity_type, entity_id, description, metadata)
  VALUES (
    p_organization_id, v_actor, 'report.requested', 'reports', v_id,
    'Started generating a narrated version of a report',
    jsonb_build_object('kind', v_source.kind, 'format', v_source.format, 'version', v_version,
                       'exposureSnapshotId', v_source.exposure_snapshot_id,
                       'narratedFromId', v_source.id, 'narratedFromVersion', v_source.version, 'narrativeDraftId', p_draft_id));

  RETURN jsonb_build_object(
    'id', v_id,
    'kind', v_source.kind,
    'format', v_source.format,
    'version', v_version,
    'asOf', to_char(v_source.as_of, 'YYYY-MM-DD'),
    'fileName', v_file,
    'storagePath', v_path,
    'assessmentId', v_source.assessment_id,
    'exposureSnapshotId', v_source.exposure_snapshot_id,
    'narratedFromId', v_source.id,
    'narratedFromVersion', v_source.version);
END;
$$;


-- ===========================================================================
-- (5) Grants
-- ===========================================================================

REVOKE ALL ON FUNCTION public.complete_report(uuid, uuid, jsonb), public.begin_narrated_report(uuid, uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.complete_report(uuid, uuid, jsonb), public.begin_narrated_report(uuid, uuid, uuid) TO authenticated;


-- ===========================================================================
-- (6) Apply-time assertions
-- ===========================================================================

DO $$
BEGIN
  ASSERT app.ai_tasks() = ARRAY['question_helper', 'evidence_helper', 'gap_helper', 'score_helper',
                                'ropa_draft', 'breach_intimation_draft', 'rights_response_draft',
                                'notice_draft', 'notice_translation_draft', 'report_narrative_draft'], 'Stage 2b: ten tasks';
  ASSERT app.ai_task_read_permission('notice_draft') = 'consent.read'
     AND app.ai_task_read_permission('notice_translation_draft') = 'consent.read'
     AND app.ai_task_read_permission('report_narrative_draft') = 'report.read', '§7c.1: read permissions';
  ASSERT app.ai_task_write_permission('notice_draft') = 'consent.write'
     AND app.ai_task_write_permission('notice_translation_draft') = 'consent.write'
     AND app.ai_task_write_permission('report_narrative_draft') = 'report.generate', '§7c.1: write permissions';
  ASSERT app.ai_task_write_permission('ropa_draft') = 'ropa.write'
     AND app.ai_task_write_permission('question_helper') IS NULL, '2a and 1b keep theirs';
  ASSERT (SELECT count(*) FROM public.permissions WHERE code IN ('consent.read', 'consent.write', 'report.read', 'report.generate')) = 4,
    'the permissions are real permission codes';
  ASSERT NOT EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
                     WHERE n.nspname = 'public' AND p.proname = 'complete_report' AND p.pronargs <> 3), 'one complete_report';
  ASSERT NOT has_function_privilege('anon', 'public.begin_narrated_report(uuid, uuid, uuid)', 'EXECUTE'), 'anon: nothing';
  ASSERT has_function_privilege('authenticated', 'public.complete_report(uuid, uuid, jsonb)', 'EXECUTE'), 'the finish step is callable';
  ASSERT NOT EXISTS (SELECT 1 FROM public.reports WHERE document IS NOT NULL OR narrated_from_id IS NOT NULL), 'nothing is narrated on apply';
END;
$$;
