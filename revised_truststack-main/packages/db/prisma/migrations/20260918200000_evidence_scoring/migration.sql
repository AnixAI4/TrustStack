-- Slice 4 — the keystone: answer → evidence → review → score, for one question.
--
-- DPDP anchoring: the evidence cap IS the product. A claim is worth only what
-- its reviewed evidence supports — adjusted = min(claimed, cap(evidence level))
-- where E0→1, E1→2, E2→2, E3→3, E4→4, E5→5. The cap is computed HERE, in the
-- database, by trigger; no client ever sends an adjusted score, and no user
-- role holds a grant that could write one.
--
-- Rule 6(a) (reasonable security safeguards) and Rule 6(c) (logging) apply to
-- the evidence store itself: it holds the client's most sensitive documents.
-- So the bucket is private, paths carry the tenant, Storage policies check
-- membership AND permission, artefacts are immutable once stored, and every
-- signed URL is audited by the API.
--
-- Layout: (1) Prisma-generated DDL;
-- (2) the cap; (3) CHECK vocabularies; (4) evidence helpers; (5) answering;
-- (6) evidence and review; (7) links; (8) audit; (9) grants + RLS; (10) Storage.
--
-- Decisions: D-039 (stored artefacts only — no cap override of any kind);
-- D-041 (answering moves a draft to in_progress, freezing its question set);
-- D-042 (the storage layout and policy shape); D-043 (no self-review).

-- ===========================================================================
-- (1) DDL
-- ===========================================================================

-- CreateTable
CREATE TABLE "assessment_responses" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "assessment_id" UUID NOT NULL,
    "question_code" TEXT NOT NULL,
    "applicability_decision" TEXT NOT NULL,
    "na_reason" TEXT,
    "claimed_maturity" SMALLINT,
    "evidence_level" SMALLINT,
    "adjusted_score" SMALLINT,
    "notes" TEXT,
    "answered_by" UUID,
    "answered_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assessment_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evidence" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "storage_path" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "content_type" TEXT NOT NULL,
    "byte_size" INTEGER NOT NULL,
    "uploaded_by" UUID,
    "uploaded_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "review_status" TEXT NOT NULL DEFAULT 'pending',
    "evidence_level" SMALLINT,
    "reviewed_by" UUID,
    "reviewed_at" TIMESTAMPTZ(6),
    "review_notes" TEXT,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evidence_links" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "evidence_id" UUID NOT NULL,
    "linked_entity_type" TEXT NOT NULL,
    "linked_entity_id" UUID NOT NULL,
    "linked_by" UUID,
    "linked_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evidence_links_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "assessment_responses_organization_id_idx" ON "assessment_responses"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "assessment_responses_organization_id_assessment_id_question_key" ON "assessment_responses"("organization_id", "assessment_id", "question_code");

-- CreateIndex
CREATE UNIQUE INDEX "assessment_responses_organization_id_id_key" ON "assessment_responses"("organization_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "evidence_storage_path_key" ON "evidence"("storage_path");

-- CreateIndex
CREATE INDEX "evidence_organization_id_idx" ON "evidence"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "evidence_organization_id_id_key" ON "evidence"("organization_id", "id");

-- CreateIndex
CREATE INDEX "evidence_links_organization_id_idx" ON "evidence_links"("organization_id");

-- CreateIndex
CREATE INDEX "evidence_links_linked_entity_type_linked_entity_id_idx" ON "evidence_links"("linked_entity_type", "linked_entity_id");

-- CreateIndex
CREATE UNIQUE INDEX "evidence_links_evidence_id_linked_entity_type_linked_entity_key" ON "evidence_links"("evidence_id", "linked_entity_type", "linked_entity_id");

-- CreateIndex
CREATE UNIQUE INDEX "assessment_questions_organization_id_assessment_id_question_key" ON "assessment_questions"("organization_id", "assessment_id", "question_code");

-- AddForeignKey
ALTER TABLE "assessment_responses" ADD CONSTRAINT "assessment_responses_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_responses" ADD CONSTRAINT "assessment_responses_organization_id_assessment_id_fkey" FOREIGN KEY ("organization_id", "assessment_id") REFERENCES "assessments"("organization_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_responses" ADD CONSTRAINT "assessment_responses_organization_id_assessment_id_questio_fkey" FOREIGN KEY ("organization_id", "assessment_id", "question_code") REFERENCES "assessment_questions"("organization_id", "assessment_id", "question_code") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_responses" ADD CONSTRAINT "assessment_responses_answered_by_fkey" FOREIGN KEY ("answered_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence" ADD CONSTRAINT "evidence_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence" ADD CONSTRAINT "evidence_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence" ADD CONSTRAINT "evidence_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence_links" ADD CONSTRAINT "evidence_links_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence_links" ADD CONSTRAINT "evidence_links_organization_id_evidence_id_fkey" FOREIGN KEY ("organization_id", "evidence_id") REFERENCES "evidence"("organization_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence_links" ADD CONSTRAINT "evidence_links_linked_by_fkey" FOREIGN KEY ("linked_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;



-- ===========================================================================
-- (2) The cap — mirrors packages/core EVIDENCE_CAP
-- ===========================================================================
-- apps/web/tests/unit/evidence-cap.test.ts parses the WHEN pairs below and
-- fails if they ever differ from the TypeScript table. E1 and E2 BOTH cap at
-- 2: "use the evidence level as the cap" passes every workbook sample and is
-- wrong (D-007). No reviewed evidence is E0, never null-and-ignored.

CREATE OR REPLACE FUNCTION app.evidence_cap(p_level integer)
RETURNS integer
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = ''
AS $$
  SELECT CASE p_level
    WHEN 0 THEN 1
    WHEN 1 THEN 2
    WHEN 2 THEN 2
    WHEN 3 THEN 3
    WHEN 4 THEN 4
    WHEN 5 THEN 5
  END;
$$;

-- min(claimed, cap(level)), with an unreviewed level scored as E0.
CREATE OR REPLACE FUNCTION app.adjusted_score(p_claimed integer, p_level integer)
RETURNS integer
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = ''
AS $$
  SELECT least(p_claimed, app.evidence_cap(COALESCE(p_level, 0)));
$$;

REVOKE ALL ON FUNCTION app.evidence_cap(integer), app.adjusted_score(integer, integer) FROM PUBLIC;
-- Pure functions; a CHECK below calls them as the writing user.
GRANT EXECUTE ON FUNCTION app.evidence_cap(integer), app.adjusted_score(integer, integer) TO authenticated;


-- ===========================================================================
-- (3) Constraints Prisma cannot express
-- ===========================================================================

ALTER TABLE public.assessment_responses
  ADD CONSTRAINT assessment_responses_decision_check
    CHECK (applicability_decision IN ('applicable', 'not_applicable')),
  ADD CONSTRAINT assessment_responses_claimed_range CHECK (claimed_maturity BETWEEN 0 AND 5),
  ADD CONSTRAINT assessment_responses_evidence_level_range CHECK (evidence_level BETWEEN 0 AND 5),
  ADD CONSTRAINT assessment_responses_adjusted_range CHECK (adjusted_score BETWEEN 0 AND 5),
  -- Not Applicable needs a written reason — a CHECK, not a convention (D-029.3).
  ADD CONSTRAINT assessment_responses_na_needs_reason
    CHECK (applicability_decision <> 'not_applicable' OR (na_reason IS NOT NULL AND btrim(na_reason) <> '')),
  ADD CONSTRAINT assessment_responses_na_has_no_claim
    CHECK (applicability_decision <> 'not_applicable' OR claimed_maturity IS NULL),
  ADD CONSTRAINT assessment_responses_applicable_has_claim
    CHECK (applicability_decision <> 'applicable' OR (claimed_maturity IS NOT NULL AND na_reason IS NULL)),
  -- The cap as an invariant of the ROW: even tooling cannot store an
  -- uncapped score. The trigger computes it; this refuses anything else.
  ADD CONSTRAINT assessment_responses_adjusted_is_capped
    CHECK (adjusted_score IS NOT DISTINCT FROM
           CASE WHEN applicability_decision = 'applicable'
                THEN app.adjusted_score(claimed_maturity, evidence_level) END),
  ADD CONSTRAINT assessment_responses_na_reason_length CHECK (char_length(na_reason) <= 2000),
  ADD CONSTRAINT assessment_responses_notes_length CHECK (char_length(notes) <= 4000);

ALTER TABLE public.evidence
  -- There is no "observed but not stored" or "attested" status (D-039).
  ADD CONSTRAINT evidence_review_status_check
    CHECK (review_status IN ('pending', 'adequate', 'strong', 'partial', 'rejected', 'outdated')),
  ADD CONSTRAINT evidence_level_range CHECK (evidence_level BETWEEN 0 AND 5),
  ADD CONSTRAINT evidence_pending_has_no_level CHECK ((review_status = 'pending') = (evidence_level IS NULL)),
  ADD CONSTRAINT evidence_pending_is_unreviewed CHECK ((review_status = 'pending') = (reviewed_at IS NULL)),
  ADD CONSTRAINT evidence_rejected_is_e0 CHECK (review_status <> 'rejected' OR evidence_level = 0),
  -- No self-review, ever (D-043). The trigger gives the friendly message; this
  -- is the invariant, and it binds tooling too.
  ADD CONSTRAINT evidence_no_self_review
    CHECK (reviewed_by IS NULL OR uploaded_by IS NULL OR reviewed_by <> uploaded_by),
  ADD CONSTRAINT evidence_byte_size_range CHECK (byte_size > 0 AND byte_size <= 26214400),
  ADD CONSTRAINT evidence_content_type_check CHECK (content_type IN (
    'application/pdf', 'image/png', 'image/jpeg', 'text/plain', 'text/csv',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation')),
  ADD CONSTRAINT evidence_file_name_safe CHECK (file_name ~ '^[A-Za-z0-9_-][A-Za-z0-9_.-]{0,119}$'),
  -- Tenancy in the path, and the path is exactly this row's: a row can never
  -- point at another organisation's object, or at another row's (D-042).
  ADD CONSTRAINT evidence_storage_path_layout CHECK (
    storage_path = 'organizations/' || organization_id::text || '/evidence/' || id::text || '/' || file_name),
  ADD CONSTRAINT evidence_review_notes_length CHECK (char_length(review_notes) <= 4000);

ALTER TABLE public.evidence_links
  ADD CONSTRAINT evidence_links_entity_type_check CHECK (linked_entity_type IN ('assessment_response'));

CREATE TRIGGER assessment_responses_touch_updated_at BEFORE UPDATE ON public.assessment_responses
  FOR EACH ROW EXECUTE FUNCTION app.touch_updated_at();
CREATE TRIGGER evidence_touch_updated_at BEFORE UPDATE ON public.evidence
  FOR EACH ROW EXECUTE FUNCTION app.touch_updated_at();


-- ===========================================================================
-- (4) Evidence helpers
-- ===========================================================================

-- True when the artefact is actually in the bucket. Linking and reviewing
-- both require it: reviewed evidence is a stored artefact, never a promise.
CREATE OR REPLACE FUNCTION app.evidence_object_exists(p_path text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM storage.objects o WHERE o.bucket_id = 'evidence' AND o.name = p_path
  );
$$;

-- A response's evidence level = the STRONGEST reviewed artefact linked to it
-- (packages/core responseEvidenceLevel). Unreviewed links do not count; with
-- none reviewed it is null, which the cap scores as E0.
CREATE OR REPLACE FUNCTION app.linked_evidence_level(p_organization_id uuid, p_response_id uuid)
RETURNS smallint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT max(e.evidence_level)
  FROM public.evidence_links l
  JOIN public.evidence e ON e.id = l.evidence_id AND e.organization_id = l.organization_id
  WHERE l.organization_id = p_organization_id
    AND l.linked_entity_type = 'assessment_response'
    AND l.linked_entity_id = p_response_id;
$$;

-- Re-derive the level (and so, by trigger, the adjusted score) of every
-- response an artefact is linked to.
CREATE OR REPLACE FUNCTION app.refresh_linked_responses(p_organization_id uuid, p_evidence_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  UPDATE public.assessment_responses r
  SET evidence_level = app.linked_evidence_level(r.organization_id, r.id)
  WHERE r.organization_id = p_organization_id
    AND r.id IN (
      SELECT l.linked_entity_id FROM public.evidence_links l
      WHERE l.organization_id = p_organization_id
        AND l.evidence_id = p_evidence_id
        AND l.linked_entity_type = 'assessment_response'
    );
$$;

REVOKE ALL ON FUNCTION app.evidence_object_exists(text), app.linked_evidence_level(uuid, uuid),
  app.refresh_linked_responses(uuid, uuid) FROM PUBLIC;


-- ===========================================================================
-- (5) Answering
-- ===========================================================================
-- Derived columns are ALWAYS re-derived here, whoever writes: evidence_level
-- from the links, adjusted_score from the cap. Users hold no grant on either
-- column; this trigger is the only writer.

CREATE OR REPLACE FUNCTION app.assessment_response_before_write()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_actor uuid := app.current_user_id();
  v_status text;
  v_applicability text;
BEGIN
  IF TG_OP = 'UPDATE' AND (NEW.organization_id, NEW.assessment_id, NEW.question_code)
       IS DISTINCT FROM (OLD.organization_id, OLD.assessment_id, OLD.question_code) THEN
    RAISE EXCEPTION 'A response cannot be moved to another question.' USING ERRCODE = 'TS422';
  END IF;

  IF TG_OP = 'INSERT'
     OR (NEW.applicability_decision, NEW.claimed_maturity, NEW.na_reason, NEW.notes)
        IS DISTINCT FROM (OLD.applicability_decision, OLD.claimed_maturity, OLD.na_reason, OLD.notes) THEN
    SELECT a.status INTO v_status
    FROM public.assessments a
    WHERE a.id = NEW.assessment_id AND a.organization_id = NEW.organization_id;
    IF v_status IN ('submitted', 'finalised') THEN
      RAISE EXCEPTION 'This assessment is % — its answers are locked.', v_status USING ERRCODE = 'TS409';
    END IF;

    SELECT q.applicability INTO v_applicability
    FROM public.assessment_questions q
    WHERE q.organization_id = NEW.organization_id
      AND q.assessment_id = NEW.assessment_id
      AND q.question_code = NEW.question_code;
    -- A mandatory question applies to every organisation by definition; only
    -- a conditional or Potentially Applicable one may be excluded (D-029.3).
    IF v_applicability = 'mandatory' AND NEW.applicability_decision = 'not_applicable' THEN
      RAISE EXCEPTION 'A mandatory question cannot be marked Not Applicable.' USING ERRCODE = 'TS422';
    END IF;

    NEW.answered_at := now();
    IF v_actor IS NOT NULL THEN
      NEW.answered_by := v_actor;
    END IF;
  END IF;

  NEW.evidence_level := app.linked_evidence_level(NEW.organization_id, NEW.id);
  NEW.adjusted_score := CASE WHEN NEW.applicability_decision = 'applicable'
                             THEN app.adjusted_score(NEW.claimed_maturity, NEW.evidence_level) END;
  RETURN NEW;
END;
$$;

-- The first answer moves a draft to in_progress (D-041). Regeneration is
-- draft-only, so this is what stops a scope change from rewriting — or
-- orphaning — questions that already have answers.
CREATE OR REPLACE FUNCTION app.assessment_response_after_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.assessments SET status = 'in_progress'
  WHERE id = NEW.assessment_id AND organization_id = NEW.organization_id AND status = 'draft';
  RETURN NULL;
END;
$$;

-- Links are polymorphic, so no FK can cascade them (D-008).
CREATE OR REPLACE FUNCTION app.assessment_response_after_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  DELETE FROM public.evidence_links
  WHERE organization_id = OLD.organization_id
    AND linked_entity_type = 'assessment_response'
    AND linked_entity_id = OLD.id;
  RETURN NULL;
END;
$$;

-- An assessment with answers never goes back to draft: that would reopen
-- regeneration underneath them.
CREATE OR REPLACE FUNCTION app.assessment_guard_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.status = 'draft' AND OLD.status <> 'draft' AND EXISTS (
    SELECT 1 FROM public.assessment_responses r WHERE r.assessment_id = NEW.id
  ) THEN
    RAISE EXCEPTION 'An assessment with answers cannot return to draft.' USING ERRCODE = 'TS409';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION app.assessment_response_before_write(), app.assessment_response_after_insert(),
  app.assessment_response_after_delete(), app.assessment_guard_status() FROM PUBLIC;

CREATE TRIGGER assessment_responses_before_write
  BEFORE INSERT OR UPDATE ON public.assessment_responses
  FOR EACH ROW EXECUTE FUNCTION app.assessment_response_before_write();
CREATE TRIGGER assessment_responses_after_insert
  AFTER INSERT ON public.assessment_responses
  FOR EACH ROW EXECUTE FUNCTION app.assessment_response_after_insert();
CREATE TRIGGER assessment_responses_after_delete
  AFTER DELETE ON public.assessment_responses
  FOR EACH ROW EXECUTE FUNCTION app.assessment_response_after_delete();
CREATE TRIGGER assessments_guard_status
  BEFORE UPDATE OF status ON public.assessments
  FOR EACH ROW EXECUTE FUNCTION app.assessment_guard_status();


-- ===========================================================================
-- (6) Evidence and review
-- ===========================================================================

CREATE OR REPLACE FUNCTION app.evidence_before_write()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_actor uuid := app.current_user_id();
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- A user's upload always starts unreviewed and is always theirs.
    IF v_actor IS NOT NULL THEN
      NEW.uploaded_by := v_actor;
      NEW.uploaded_at := now();
      NEW.review_status := 'pending';
      NEW.evidence_level := NULL;
      NEW.reviewed_by := NULL;
      NEW.reviewed_at := NULL;
      NEW.review_notes := NULL;
    END IF;
    RETURN NEW;
  END IF;

  IF (NEW.review_status, NEW.evidence_level, NEW.review_notes)
     IS NOT DISTINCT FROM (OLD.review_status, OLD.evidence_level, OLD.review_notes) THEN
    RETURN NEW;
  END IF;

  IF v_actor IS NOT NULL THEN
    -- RLS already filters the row out for anyone without evidence.review;
    -- this is the second lock, with a message.
    IF NOT app.has_permission(NEW.organization_id, 'evidence.review') THEN
      RAISE EXCEPTION 'You do not have permission to review evidence.' USING ERRCODE = 'TS403';
    END IF;
    IF v_actor = OLD.uploaded_by THEN
      RAISE EXCEPTION 'You cannot review evidence you uploaded — another reviewer must.' USING ERRCODE = 'TS403';
    END IF;
    NEW.reviewed_by := v_actor;
  END IF;

  IF NOT app.evidence_object_exists(NEW.storage_path) THEN
    RAISE EXCEPTION 'The file has not been uploaded — there is nothing to review.' USING ERRCODE = 'TS409';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.evidence_links l
    JOIN public.assessment_responses r ON r.id = l.linked_entity_id AND r.organization_id = l.organization_id
    JOIN public.assessments a ON a.id = r.assessment_id AND a.organization_id = r.organization_id
    WHERE l.evidence_id = NEW.id AND l.linked_entity_type = 'assessment_response' AND a.status = 'finalised'
  ) THEN
    RAISE EXCEPTION 'This evidence supports a finalised assessment and cannot be re-reviewed.' USING ERRCODE = 'TS409';
  END IF;

  IF NEW.review_status = 'pending' THEN
    NEW.reviewed_by := NULL;
    NEW.reviewed_at := NULL;
  ELSE
    NEW.reviewed_at := now();
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION app.evidence_after_review()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.evidence_level IS DISTINCT FROM OLD.evidence_level THEN
    PERFORM app.refresh_linked_responses(NEW.organization_id, NEW.id);
  END IF;
  RETURN NULL;
END;
$$;

REVOKE ALL ON FUNCTION app.evidence_before_write(), app.evidence_after_review() FROM PUBLIC;

CREATE TRIGGER evidence_before_write
  BEFORE INSERT OR UPDATE ON public.evidence
  FOR EACH ROW EXECUTE FUNCTION app.evidence_before_write();
CREATE TRIGGER evidence_after_review
  AFTER UPDATE OF evidence_level ON public.evidence
  FOR EACH ROW EXECUTE FUNCTION app.evidence_after_review();


-- ===========================================================================
-- (7) Links
-- ===========================================================================

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
  UPDATE public.assessment_responses r
  SET evidence_level = app.linked_evidence_level(r.organization_id, r.id)
  WHERE r.id = NEW.linked_entity_id AND r.organization_id = NEW.organization_id;
  RETURN NULL;
END;
$$;

REVOKE ALL ON FUNCTION app.evidence_link_before_insert(), app.evidence_link_after_insert() FROM PUBLIC;

CREATE TRIGGER evidence_links_before_insert
  BEFORE INSERT ON public.evidence_links
  FOR EACH ROW EXECUTE FUNCTION app.evidence_link_before_insert();
CREATE TRIGGER evidence_links_after_insert
  AFTER INSERT ON public.evidence_links
  FOR EACH ROW EXECUTE FUNCTION app.evidence_link_after_insert();


-- ===========================================================================
-- (8) Audit (D-027) — answer, link and review by trigger, in the same
--     transaction. Upload-URL and download-URL issuance are audited by the
--     API, because issuing a URL writes no row.
-- ===========================================================================
-- The metadata gains the scoring fields, so the log shows WHO set a level and
-- what it did to the score. Still no free text: notes, N/A reasons and review
-- notes stay out of the log.

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
    WHERE n.key NOT IN ('updated_at', 'derived_at', 'generated_at') AND (v_old -> n.key) IS DISTINCT FROM n.value;
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
      'linkedEntityId', v_row ->> 'linked_entity_id'
    ))
  );
  RETURN NULL;
END;
$$;

CREATE TRIGGER assessment_responses_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.assessment_responses
  FOR EACH ROW EXECUTE FUNCTION app.audit_scope_change('response');
CREATE TRIGGER evidence_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.evidence
  FOR EACH ROW EXECUTE FUNCTION app.audit_scope_change('evidence');
CREATE TRIGGER evidence_links_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.evidence_links
  FOR EACH ROW EXECUTE FUNCTION app.audit_scope_change('evidence');


-- ===========================================================================
-- (9) Grants + RLS (D-019) — column-level, so the derived columns have no
--     user write path at all
-- ===========================================================================

REVOKE ALL ON public.assessment_responses, public.evidence, public.evidence_links FROM anon, authenticated;

GRANT SELECT ON public.assessment_responses TO authenticated;
GRANT INSERT (organization_id, assessment_id, question_code, applicability_decision, na_reason, claimed_maturity, notes)
  ON public.assessment_responses TO authenticated;
GRANT UPDATE (applicability_decision, na_reason, claimed_maturity, notes)
  ON public.assessment_responses TO authenticated;
-- No DELETE: an answer is changed, never erased. No grant on evidence_level,
-- adjusted_score, answered_by or answered_at.

GRANT SELECT ON public.evidence TO authenticated;
GRANT INSERT (id, organization_id, storage_path, file_name, content_type, byte_size) ON public.evidence TO authenticated;
-- The ONLY updatable columns are the review. Any user UPDATE is a review, so
-- the policy below can require evidence.review for all of it.
GRANT UPDATE (review_status, evidence_level, review_notes) ON public.evidence TO authenticated;
-- No DELETE: a stored artefact is retained.

GRANT SELECT ON public.evidence_links TO authenticated;
GRANT INSERT (organization_id, evidence_id, linked_entity_type, linked_entity_id) ON public.evidence_links TO authenticated;

ALTER TABLE public.assessment_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidence_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY assessment_responses_select_member ON public.assessment_responses
  FOR SELECT TO authenticated
  USING (
    organization_id IN (SELECT app.current_user_organization_ids())
    AND app.has_permission(organization_id, 'response.read')
  );
CREATE POLICY assessment_responses_insert_writer ON public.assessment_responses
  FOR INSERT TO authenticated
  WITH CHECK (app.has_permission(organization_id, 'response.write'));
CREATE POLICY assessment_responses_update_writer ON public.assessment_responses
  FOR UPDATE TO authenticated
  USING (app.has_permission(organization_id, 'response.write'))
  WITH CHECK (app.has_permission(organization_id, 'response.write'));

CREATE POLICY evidence_select_member ON public.evidence
  FOR SELECT TO authenticated
  USING (
    organization_id IN (SELECT app.current_user_organization_ids())
    AND app.has_permission(organization_id, 'evidence.read')
  );
CREATE POLICY evidence_insert_writer ON public.evidence
  FOR INSERT TO authenticated
  WITH CHECK (app.has_permission(organization_id, 'evidence.write'));
-- A contributor holds evidence.write, never evidence.review: they cannot grade
-- any evidence, let alone their own (D-043).
CREATE POLICY evidence_update_reviewer ON public.evidence
  FOR UPDATE TO authenticated
  USING (app.has_permission(organization_id, 'evidence.review'))
  WITH CHECK (app.has_permission(organization_id, 'evidence.review'));

CREATE POLICY evidence_links_select_member ON public.evidence_links
  FOR SELECT TO authenticated
  USING (
    organization_id IN (SELECT app.current_user_organization_ids())
    AND app.has_permission(organization_id, 'evidence.read')
  );
CREATE POLICY evidence_links_insert_writer ON public.evidence_links
  FOR INSERT TO authenticated
  WITH CHECK (app.has_permission(organization_id, 'evidence.write'));


-- ===========================================================================
-- (10) Storage — private bucket, tenancy in the path (D-042)
-- ===========================================================================
-- organizations/{organization_id}/evidence/{evidence_id}/{file_name}
--
-- Policies on storage.objects, checked against the SAME helpers as every
-- tenant table. Signed URLs are minted with the caller's JWT, so Storage runs
-- these policies at signing time — the service role is not needed.
--
--   SELECT (sign a download URL): member + evidence.read + a registered
--          evidence row for exactly this path.
--   INSERT (sign an upload URL / upload): member + evidence.write + a
--          registered evidence row for exactly this path, uploaded by the caller.
--   No UPDATE, no DELETE: an artefact, once stored, is immutable and retained.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'evidence', 'evidence', false, 26214400,
  ARRAY[
    'application/pdf', 'image/png', 'image/jpeg', 'text/plain', 'text/csv',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ]
)
ON CONFLICT (id) DO UPDATE
  SET public = false,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

-- The organisation an object path belongs to, or null if the path is not in
-- the evidence layout at all (never a cast error inside a policy).
CREATE OR REPLACE FUNCTION app.evidence_object_organization_id(p_name text)
RETURNS uuid
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = ''
AS $$
  SELECT CASE
    WHEN p_name ~ '^organizations/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/evidence/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[^/]+$'
    THEN split_part(p_name, '/', 2)::uuid
  END;
$$;

REVOKE ALL ON FUNCTION app.evidence_object_organization_id(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app.evidence_object_organization_id(text) TO authenticated;

CREATE POLICY evidence_objects_select_member ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'evidence'
    AND app.evidence_object_organization_id(name) IN (SELECT app.current_user_organization_ids())
    AND app.has_permission(app.evidence_object_organization_id(name), 'evidence.read')
    AND EXISTS (
      SELECT 1 FROM public.evidence e
      WHERE e.storage_path = objects.name
        AND e.organization_id = app.evidence_object_organization_id(objects.name)
    )
  );

CREATE POLICY evidence_objects_insert_uploader ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'evidence'
    AND app.evidence_object_organization_id(name) IN (SELECT app.current_user_organization_ids())
    AND app.has_permission(app.evidence_object_organization_id(name), 'evidence.write')
    AND EXISTS (
      SELECT 1 FROM public.evidence e
      WHERE e.storage_path = objects.name
        AND e.organization_id = app.evidence_object_organization_id(objects.name)
        AND e.uploaded_by = app.current_user_id()
    )
  );
