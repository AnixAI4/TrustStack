-- Slice 9, Stage 3 — the report store (SLICE_09 §4.8, §4.10, §7, §9).
--
-- A report is a STORED, VERSIONED artefact: what the Board, the DPO, an owner
-- or an auditor was shown on a date. So, like evidence (D-042) and a stored
-- exposure snapshot (D-074.9):
--   * one private bucket, tenancy in the path
--     `organizations/{organization_id}/reports/{report_id}/{file_name}`,
--     policies through the tenant helpers, no overwrite, no delete;
--   * the `reports` row is written ONLY by three SECURITY DEFINER functions —
--     `begin_report` (the row, its version and its file name, and for an
--     exposure report a FRESH exposure snapshot first), `complete_report`
--     (the size, read from the stored object, never sent by the caller) and
--     `fail_report`. No user INSERT, UPDATE or DELETE grant of any kind;
--   * nothing may edit a finished row, tooling included. Regenerating makes
--     a new version; version 1 and its file are never touched (decision 10:
--     a report and its file go together, and users delete neither).
--
-- The file itself is rendered by the app (the PDF library is not in the
-- database). The database decides WHICH row it is, WHERE it goes, WHAT it is
-- called and WHEN it is finished; the bytes are uploaded with the generator's
-- own JWT, which Storage checks against a `running` row the same person began.
--
-- Additive: one table, one bucket, two storage policies, new functions.
-- Nothing is revoked, so it may go to hosted before merge — once Stage 3 is
-- approved (SLICE_09 §12).

-- ===========================================================================
-- (1) The kinds — mirrors packages/core/src/reports.ts (REPORT_KIND_DEFINITIONS)
-- ===========================================================================
-- `tests/unit/report-store-mirror.test.ts` parses this block and fails if a
-- kind, its format, whether it records an exposure snapshot, or its file
-- name differs from core.

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
    ('evidence_index',     'xlsx', false, false, 'Evidence_Index');
$$;

-- `TrustStack_DPDP_Exposure_Brief_v3_2026-10-06.pdf` — the kind, the version
-- and the date in India it describes. Plain characters only: it is a path
-- segment and a download name.
CREATE OR REPLACE FUNCTION app.report_file_name(p_kind text, p_version integer, p_as_of date)
RETURNS text
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = ''
AS $$
  SELECT 'TrustStack_' || k.file_slug || '_v' || p_version || '_' || to_char(p_as_of, 'YYYY-MM-DD') || '.' || k.format
  FROM app.report_kinds() k
  WHERE k.kind = p_kind;
$$;

REVOKE ALL ON FUNCTION app.report_kinds(), app.report_file_name(text, integer, date) FROM PUBLIC;


-- ===========================================================================
-- (2) reports
-- ===========================================================================

-- CreateTable
CREATE TABLE "reports" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "kind" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "subject_user_id" UUID,
    "assessment_id" UUID,
    "exposure_snapshot_id" UUID,
    "as_of" DATE NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'running',
    "storage_path" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "byte_size" BIGINT,
    "generated_by" UUID,
    "requested_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "generated_at" TIMESTAMPTZ(6),
    "error" TEXT,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "reports_organization_id_requested_at_idx" ON "reports"("organization_id", "requested_at");

-- CreateIndex
CREATE UNIQUE INDEX "reports_organization_id_id_key" ON "reports"("organization_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "reports_storage_path_key" ON "reports"("storage_path");

-- One version number per organisation, kind and subject — an organisation's
-- Exposure Briefs run 1, 2, 3…; each owner's pack has its own sequence.
CREATE UNIQUE INDEX reports_version_key ON public.reports (organization_id, kind, subject_user_id, version) NULLS NOT DISTINCT;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_generated_by_fkey" FOREIGN KEY ("generated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey — an owner's pack names its owner; that person cannot be
-- hard-deleted while it exists (erasure is Slice 13's job).
ALTER TABLE "reports" ADD CONSTRAINT "reports_subject_user_id_fkey" FOREIGN KEY ("subject_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- The basis it was generated on. A report OUTLIVES them (it is what was
-- shown on the day): if a draft assessment is deleted, or a snapshot goes
-- with it, only the pointer is cleared — never the organisation column of a
-- composite key, and never the report.
ALTER TABLE public.reports
  ADD CONSTRAINT reports_organization_id_assessment_id_fkey
    FOREIGN KEY (organization_id, assessment_id) REFERENCES public.assessments (organization_id, id)
    ON DELETE SET NULL (assessment_id) ON UPDATE CASCADE,
  ADD CONSTRAINT reports_organization_id_exposure_snapshot_id_fkey
    FOREIGN KEY (organization_id, exposure_snapshot_id) REFERENCES public.exposure_snapshots (organization_id, id)
    ON DELETE SET NULL (exposure_snapshot_id) ON UPDATE CASCADE;

ALTER TABLE public.reports
  ADD CONSTRAINT reports_kind_format_check CHECK ((kind, format) IN (
    ('exposure_brief', 'pdf'), ('programme_status', 'pdf'), ('owner_action_pack', 'pdf'), ('evidence_pack', 'pdf'),
    ('gap_action_tracker', 'xlsx'), ('ropa_register', 'xlsx'), ('evidence_index', 'xlsx'))),
  ADD CONSTRAINT reports_status_check CHECK (status IN ('running', 'ready', 'failed')),
  ADD CONSTRAINT reports_version_check CHECK (version >= 1),
  -- An owner's pack names its owner; nothing else names anyone.
  ADD CONSTRAINT reports_subject_check CHECK ((kind = 'owner_action_pack') = (subject_user_id IS NOT NULL)),
  ADD CONSTRAINT reports_file_name_check CHECK (file_name ~ '^[A-Za-z0-9._-]{1,160}$'),
  -- The row can only point at its OWN object, in its own tenant (as D-042).
  ADD CONSTRAINT reports_storage_path_check
    CHECK (storage_path = 'organizations/' || organization_id || '/reports/' || id || '/' || file_name),
  -- Each status carries exactly what it should.
  ADD CONSTRAINT reports_status_fields_check CHECK (
    (status = 'running' AND byte_size IS NULL AND generated_at IS NULL AND error IS NULL)
    OR (status = 'ready' AND byte_size > 0 AND generated_at IS NOT NULL AND error IS NULL)
    OR (status = 'failed' AND byte_size IS NULL AND generated_at IS NULL AND error IS NOT NULL)),
  ADD CONSTRAINT reports_error_check CHECK (error IS NULL OR length(error) BETWEEN 1 AND 500);

-- A finished report is evidence of what was shown: nothing may edit it,
-- tooling included. The ONLY changes ever allowed:
--   * running → ready | failed, touching nothing but the status, the size,
--     the time it finished and the error (the two RPCs below);
--   * a cleared pointer when what it points at goes (the FK actions above).
-- DELETE only when the whole organisation goes (its cascade).
CREATE OR REPLACE FUNCTION app.report_is_immutable()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_finish constant text[] := ARRAY['status', 'byte_size', 'generated_at', 'error'];
  v_pointers constant text[] := ARRAY['assessment_id', 'exposure_snapshot_id', 'generated_by'];
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF EXISTS (SELECT 1 FROM public.organizations o WHERE o.id = OLD.organization_id) THEN
      RAISE EXCEPTION 'A report cannot be deleted — it is a record of what was shown on the day. Generate a new version instead.'
        USING ERRCODE = 'TS409';
    END IF;
    RETURN OLD;
  END IF;

  IF OLD.status = 'running' AND NEW.status IN ('ready', 'failed')
     AND (to_jsonb(NEW) - v_finish) = (to_jsonb(OLD) - v_finish) THEN
    RETURN NEW;
  END IF;
  IF NEW.status = OLD.status
     AND (to_jsonb(NEW) - v_pointers) = (to_jsonb(OLD) - v_pointers)
     AND (NEW.assessment_id IS NULL OR NEW.assessment_id = OLD.assessment_id)
     AND (NEW.exposure_snapshot_id IS NULL OR NEW.exposure_snapshot_id = OLD.exposure_snapshot_id)
     AND (NEW.generated_by IS NULL OR NEW.generated_by = OLD.generated_by) THEN
    RETURN NEW;
  END IF;
  RAISE EXCEPTION 'A report cannot be changed — generate a new version instead.' USING ERRCODE = 'TS409';
END;
$$;

REVOKE ALL ON FUNCTION app.report_is_immutable() FROM PUBLIC;

CREATE TRIGGER reports_immutable
  BEFORE UPDATE OR DELETE ON public.reports
  FOR EACH ROW EXECUTE FUNCTION app.report_is_immutable();

-- Grants + RLS (D-019): SELECT only. Every role holds report.read; an owner
-- may also see their OWN pack (decision 9). No INSERT, UPDATE or DELETE
-- grant of any kind — the functions below are the one door.
REVOKE ALL ON public.reports FROM anon, authenticated;
GRANT SELECT ON public.reports TO authenticated;

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY reports_select_member ON public.reports
  FOR SELECT TO authenticated
  USING (
    organization_id IN (SELECT app.current_user_organization_ids())
    AND (
      app.has_permission(organization_id, 'report.read')
      OR (kind = 'owner_action_pack' AND subject_user_id = app.current_user_id())
    )
  );


-- ===========================================================================
-- (3) Storage — private bucket, tenancy in the path (as D-042)
-- ===========================================================================
-- organizations/{organization_id}/reports/{report_id}/{file_name}
--
--   SELECT (sign a download URL): member + a READY report row for exactly
--          this path + report.download (or it is the caller's own pack).
--   INSERT (upload the rendered file): member + a RUNNING report row for
--          exactly this path that the caller began.
--   No UPDATE, no DELETE: a stored report is immutable and retained.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'reports', 'reports', false, 20971520,
  ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
)
ON CONFLICT (id) DO UPDATE
  SET public = false,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

-- The organisation an object path belongs to, or null if the path is not in
-- the reports layout at all (never a cast error inside a policy).
CREATE OR REPLACE FUNCTION app.report_object_organization_id(p_name text)
RETURNS uuid
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = ''
AS $$
  SELECT CASE
    WHEN p_name ~ '^organizations/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/reports/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[^/]+$'
    THEN split_part(p_name, '/', 2)::uuid
  END;
$$;

-- May the caller download this object? Read through SECURITY DEFINER so the
-- answer does not depend on the reports table's own RLS inside a policy.
CREATE OR REPLACE FUNCTION app.report_object_downloadable(p_name text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.reports r
    WHERE r.storage_path = p_name
      AND r.organization_id = app.report_object_organization_id(p_name)
      AND r.organization_id IN (SELECT app.current_user_organization_ids())
      AND r.status = 'ready'
      AND (
        app.has_permission(r.organization_id, 'report.download')
        OR (r.kind = 'owner_action_pack' AND r.subject_user_id = app.current_user_id())
      )
  );
$$;

-- May the caller store this object? Only the person who began a still-running
-- report, at exactly that report's path.
CREATE OR REPLACE FUNCTION app.report_object_uploadable(p_name text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.reports r
    WHERE r.storage_path = p_name
      AND r.organization_id = app.report_object_organization_id(p_name)
      AND r.organization_id IN (SELECT app.current_user_organization_ids())
      AND r.status = 'running'
      AND r.generated_by = app.current_user_id()
  );
$$;

-- The stored object's size in bytes, or null when nothing is stored there.
CREATE OR REPLACE FUNCTION app.report_object_size(p_path text)
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT (o.metadata ->> 'size')::bigint
  FROM storage.objects o
  WHERE o.bucket_id = 'reports' AND o.name = p_path;
$$;

REVOKE ALL ON FUNCTION app.report_object_organization_id(text), app.report_object_downloadable(text),
  app.report_object_uploadable(text), app.report_object_size(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app.report_object_organization_id(text), app.report_object_downloadable(text),
  app.report_object_uploadable(text) TO authenticated;

CREATE POLICY reports_objects_select_reader ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'reports' AND app.report_object_downloadable(name));

CREATE POLICY reports_objects_insert_generator ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'reports' AND app.report_object_uploadable(name));


-- ===========================================================================
-- (4) begin_report — the row, its version, its name, and its exposure basis
-- ===========================================================================
-- The caller names WHAT (kind, format, and the owner for an owner's pack) and
-- nothing else. The version, the file name, the path, the date and — for an
-- exposure report — the exposure snapshot are all decided here. An exposure
-- report always records a FRESH snapshot first, through the snapshot's own
-- door (`record_exposure_snapshot`, which also needs `score.calculate`), so a
-- report can never be dressed in an older, kinder picture.

CREATE OR REPLACE FUNCTION public.begin_report(
  p_organization_id uuid,
  p_kind text,
  p_format text,
  p_subject_user_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_actor uuid := app.current_user_id();
  v_kind record;
  v_snapshot_id uuid;
  v_assessment_id uuid;
  v_as_of date := (now() AT TIME ZONE 'Asia/Kolkata')::date;
  v_version integer;
  v_id uuid := gen_random_uuid();
  v_file text;
  v_path text;
BEGIN
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'Sign in to continue.' USING ERRCODE = 'TS401';
  END IF;
  IF p_organization_id IS NULL OR p_organization_id NOT IN (SELECT app.current_user_organization_ids()) THEN
    RAISE EXCEPTION 'You do not have permission to generate this report.' USING ERRCODE = 'TS403';
  END IF;

  SELECT * INTO v_kind FROM app.report_kinds() k WHERE k.kind = p_kind AND k.format = p_format;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Unknown report kind or format.' USING ERRCODE = 'TS422';
  END IF;

  IF v_kind.per_owner THEN
    IF p_subject_user_id IS NULL OR NOT EXISTS (
      SELECT 1 FROM public.organization_users ou
      WHERE ou.organization_id = p_organization_id AND ou.user_id = p_subject_user_id AND ou.status = 'active'
    ) THEN
      RAISE EXCEPTION 'An owner''s pack needs an active member of this organisation as its owner.' USING ERRCODE = 'TS422';
    END IF;
    -- Anyone's pack with report.generate; your OWN with gap.read (decision 9).
    IF NOT (app.has_permission(p_organization_id, 'report.generate')
            OR (p_subject_user_id = v_actor AND app.has_permission(p_organization_id, 'gap.read'))) THEN
      RAISE EXCEPTION 'You do not have permission to generate this report.' USING ERRCODE = 'TS403';
    END IF;
  ELSE
    IF p_subject_user_id IS NOT NULL THEN
      RAISE EXCEPTION 'Only an owner''s pack names a person.' USING ERRCODE = 'TS422';
    END IF;
    IF NOT app.has_permission(p_organization_id, 'report.generate') THEN
      RAISE EXCEPTION 'You do not have permission to generate this report.' USING ERRCODE = 'TS403';
    END IF;
  END IF;

  IF v_kind.records_exposure THEN
    v_snapshot_id := public.record_exposure_snapshot(p_organization_id);
    SELECT s.assessment_id, s.as_of INTO v_assessment_id, v_as_of
    FROM public.exposure_snapshots s
    WHERE s.id = v_snapshot_id AND s.organization_id = p_organization_id;
  END IF;

  -- One version at a time per organisation, kind and subject; the unique
  -- index is the backstop.
  PERFORM pg_advisory_xact_lock(hashtextextended(
    'report:' || p_organization_id || ':' || p_kind || ':' || coalesce(p_subject_user_id::text, '-'), 0));
  SELECT coalesce(max(r.version), 0) + 1 INTO v_version
  FROM public.reports r
  WHERE r.organization_id = p_organization_id
    AND r.kind = p_kind
    AND r.subject_user_id IS NOT DISTINCT FROM p_subject_user_id;

  v_file := app.report_file_name(p_kind, v_version, v_as_of);
  v_path := 'organizations/' || p_organization_id || '/reports/' || v_id || '/' || v_file;

  INSERT INTO public.reports (
    id, organization_id, kind, format, version, subject_user_id, assessment_id, exposure_snapshot_id,
    as_of, status, storage_path, file_name, generated_by
  ) VALUES (
    v_id, p_organization_id, p_kind, p_format, v_version, p_subject_user_id, v_assessment_id, v_snapshot_id,
    v_as_of, 'running', v_path, v_file, v_actor
  );

  INSERT INTO public.audit_logs (organization_id, user_id, event_type, entity_type, entity_id, description, metadata)
  VALUES (
    p_organization_id, v_actor, 'report.requested', 'reports', v_id,
    'Started generating a report',
    jsonb_build_object('kind', p_kind, 'format', p_format, 'version', v_version,
                       'subjectUserId', p_subject_user_id, 'exposureSnapshotId', v_snapshot_id));

  RETURN jsonb_build_object(
    'id', v_id,
    'kind', p_kind,
    'format', p_format,
    'version', v_version,
    'asOf', to_char(v_as_of, 'YYYY-MM-DD'),
    'fileName', v_file,
    'storagePath', v_path,
    'assessmentId', v_assessment_id,
    'exposureSnapshotId', v_snapshot_id);
END;
$$;


-- ===========================================================================
-- (5) complete_report / fail_report — only the person who began it
-- ===========================================================================

CREATE OR REPLACE FUNCTION app.report_for_finish(p_organization_id uuid, p_report_id uuid)
RETURNS public.reports
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_actor uuid := app.current_user_id();
  v_row public.reports;
BEGIN
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'Sign in to continue.' USING ERRCODE = 'TS401';
  END IF;
  SELECT * INTO v_row FROM public.reports r
  WHERE r.id = p_report_id AND r.organization_id = p_organization_id
    AND r.organization_id IN (SELECT app.current_user_organization_ids())
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Report not found.' USING ERRCODE = 'TS404';
  END IF;
  IF v_row.generated_by IS DISTINCT FROM v_actor THEN
    RAISE EXCEPTION 'Only the person who started this report can finish it.' USING ERRCODE = 'TS403';
  END IF;
  IF v_row.status <> 'running' THEN
    RAISE EXCEPTION 'This report is already finished.' USING ERRCODE = 'TS409';
  END IF;
  RETURN v_row;
END;
$$;

REVOKE ALL ON FUNCTION app.report_for_finish(uuid, uuid) FROM PUBLIC;

-- Ready, once the file is actually in the bucket. Its size is READ from the
-- stored object — the caller sends no number.
CREATE OR REPLACE FUNCTION public.complete_report(p_organization_id uuid, p_report_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_row public.reports := app.report_for_finish(p_organization_id, p_report_id);
  v_size bigint := app.report_object_size(v_row.storage_path);
BEGIN
  IF v_size IS NULL OR v_size <= 0 THEN
    RAISE EXCEPTION 'The report file has not been stored.' USING ERRCODE = 'TS422';
  END IF;

  UPDATE public.reports
  SET status = 'ready', byte_size = v_size, generated_at = now()
  WHERE id = v_row.id;

  INSERT INTO public.audit_logs (organization_id, user_id, event_type, entity_type, entity_id, description, metadata)
  VALUES (
    v_row.organization_id, app.current_user_id(), 'report.generated', 'reports', v_row.id,
    'Generated a report',
    jsonb_build_object('kind', v_row.kind, 'format', v_row.format, 'version', v_row.version,
                       'fileName', v_row.file_name, 'byteSize', v_size,
                       'subjectUserId', v_row.subject_user_id, 'exposureSnapshotId', v_row.exposure_snapshot_id));
END;
$$;

CREATE OR REPLACE FUNCTION public.fail_report(p_organization_id uuid, p_report_id uuid, p_error text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_row public.reports := app.report_for_finish(p_organization_id, p_report_id);
  v_error text := left(coalesce(nullif(btrim(p_error), ''), 'Generation failed.'), 500);
BEGIN
  UPDATE public.reports SET status = 'failed', error = v_error WHERE id = v_row.id;

  INSERT INTO public.audit_logs (organization_id, user_id, event_type, entity_type, entity_id, description, metadata)
  VALUES (
    v_row.organization_id, app.current_user_id(), 'report.generation_failed', 'reports', v_row.id,
    'A report failed to generate',
    jsonb_build_object('kind', v_row.kind, 'format', v_row.format, 'version', v_row.version));
END;
$$;

REVOKE ALL ON FUNCTION public.begin_report(uuid, text, text, uuid), public.complete_report(uuid, uuid),
  public.fail_report(uuid, uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.begin_report(uuid, text, text, uuid), public.complete_report(uuid, uuid),
  public.fail_report(uuid, uuid, text) TO authenticated;
