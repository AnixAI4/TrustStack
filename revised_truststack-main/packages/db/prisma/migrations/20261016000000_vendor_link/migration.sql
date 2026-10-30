-- Slice 10, Stage 4b — the vendor-facing questionnaire link: an emailed,
-- expiring link; the respondent's email confirmed by a one-time code; a signed
-- declaration; the vendor's own documents; nothing counting until a person in
-- the organisation accepts it (SLICE_10 §7b "Stage 4b"; D-089, D-092).
-- No model change: exposure stays 1.4.0 — the model reads the register, not
-- who typed the answers.
--
-- DPDP anchoring: none new. The questionnaire is the 4a questionnaire (s.8(2),
-- s.8(5), Rule 6(1)(f)); this stage changes who may type the answers.
--
-- What is enforced HERE, not only in the application:
--   * SAME QUESTIONNAIRE, SAME CONTROLS — a vendor's answers land in the 4a
--     rows (`source = 'vendor'`, a source, not a second table): the same
--     completeness check (`app.vendor_assessment_missing`), the same score and
--     evidence rule (`app.vendor_assessment_risk`), the same freeze, and
--     nothing counts until `review_vendor_assessment` accepts it.
--   * THE LINK'S SENDER MAY NOT REVIEW (Aniket, 2026-10-14, D-092): whoever
--     sent a link for an assessment asked for those answers, so they may not
--     accept or return it — whether or not they answered anything themselves.
--     Added to 4a's rule (nobody who created, answered or submitted it).
--   * ONE WRITER AT A TIME — while a link is open, staff may not save or
--     submit the assessment (revoke the link first); a link is open until it
--     is revoked, used, expired (14 days) or locked (five wrong codes).
--   * ONLY HASHES — the link's token, its one-time code and the respondent's
--     browser session are stored as SHA-256 hashes; no role reads even those.
--   * THE PUBLIC WRITER is seven SECURITY DEFINER functions executable by
--     `service_role` ONLY — never `anon` (D-086.1): each re-checks the token,
--     its expiry, revocation and lock, that the assessment is still a draft
--     or returned, and (after the code) the respondent's session.
--   * ATTRIBUTED — a vendor's answers carry `answered_by = NULL`; their
--     submission carries `submitted_by = NULL`, `source = 'vendor'` and the
--     respondent's declaration (name, role, when) — a CHECK holds it. Audit
--     rows for the respondent's steps have `user_id = NULL` and say "by the
--     vendor's respondent", never their name or email.
--   * THE VENDOR'S DOCUMENTS — registered by the database (`uploaded_by =
--     NULL`, pending review), uploaded by a URL the server signs, linked to
--     the vendor (`evidence_links` type `vendor`); a respondent sees and cites
--     only the documents uploaded through their own link.
--
-- Additive: two widened CHECKs, three nullable columns, two new tables, new
-- functions, three staff functions replaced in place (each gains a check,
-- nothing a live caller relies on is removed). Nothing a live user holds is
-- revoked.
--
-- Layout: (1) vendor_assessments: the vendor source and the declaration;
-- (2) the link tables; (3) limits and helpers; (4) the staff functions —
-- send, revoke, and save / submit / review replaced; (5) the public writer,
-- `service_role` only; (6) grants + RLS; (7) apply-time assertions.


-- ===========================================================================
-- (1) vendor_assessments — the vendor source and the respondent's declaration
-- ===========================================================================

ALTER TABLE "vendor_assessments" ADD COLUMN "declared_name" TEXT;
ALTER TABLE "vendor_assessments" ADD COLUMN "declared_role" TEXT;
ALTER TABLE "vendor_assessments" ADD COLUMN "declared_at" TIMESTAMPTZ(6);

ALTER TABLE public.vendor_assessments DROP CONSTRAINT vendor_assessments_source_check;
ALTER TABLE public.vendor_assessments
  -- `vendor`: a link is open for it, or its respondent submitted it.
  ADD CONSTRAINT vendor_assessments_source_check CHECK (source IN ('staff', 'vendor')),
  ADD CONSTRAINT vendor_assessments_declaration_whole CHECK (
    (declared_name IS NULL) = (declared_role IS NULL) AND (declared_name IS NULL) = (declared_at IS NULL)),
  ADD CONSTRAINT vendor_assessments_declaration_lengths CHECK (
    declared_name IS NULL OR (btrim(declared_name) <> '' AND char_length(declared_name) <= 200
                              AND btrim(declared_role) <> '' AND char_length(declared_role) <= 200)),
  -- A submitted or accepted assessment is the vendor's exactly when its
  -- respondent declared it accurate and complete — and then no staff member
  -- submitted it.
  ADD CONSTRAINT vendor_assessments_vendor_declared CHECK (
    status IN ('draft', 'returned')
    OR ((source = 'vendor') = (declared_at IS NOT NULL) AND (source <> 'vendor' OR submitted_by IS NULL)));


-- ===========================================================================
-- (2) The link tables — members read who a link went to, never its hashes
-- ===========================================================================

-- CreateTable — one link to one respondent for one assessment.
CREATE TABLE "vendor_assessment_links" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "assessment_id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "respondent_name" TEXT NOT NULL,
    "respondent_email" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "code_hash" TEXT,
    "code_expires_at" TIMESTAMPTZ(6),
    "codes_sent" INTEGER NOT NULL DEFAULT 0,
    "wrong_codes" INTEGER NOT NULL DEFAULT 0,
    "session_hash" TEXT,
    "confirmed_at" TIMESTAMPTZ(6),
    "submitted_at" TIMESTAMPTZ(6),
    "revoked_at" TIMESTAMPTZ(6),
    "revoked_by" UUID,
    "created_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vendor_assessment_links_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "vendor_assessment_links_organization_id_idx" ON "vendor_assessment_links"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "vendor_assessment_links_organization_id_id_key" ON "vendor_assessment_links"("organization_id", "id");

-- CreateIndex — the token is how a respondent is found.
CREATE UNIQUE INDEX "vendor_assessment_links_token_hash_key" ON "vendor_assessment_links"("token_hash");

-- CreateIndex
CREATE INDEX "vendor_assessment_links_assessment_id_idx" ON "vendor_assessment_links"("organization_id", "assessment_id");

-- CreateIndex — one link not yet revoked or used per assessment (sending again revokes the last).
CREATE UNIQUE INDEX "vendor_assessment_links_one_open" ON "vendor_assessment_links"("assessment_id") WHERE revoked_at IS NULL AND submitted_at IS NULL;

-- AddForeignKey
ALTER TABLE "vendor_assessment_links" ADD CONSTRAINT "vendor_assessment_links_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey — composite: a link is for an assessment of its own
-- organisation; a discarded draft takes its links with it.
ALTER TABLE "vendor_assessment_links" ADD CONSTRAINT "vendor_assessment_links_organization_id_assessment_id_fkey" FOREIGN KEY ("organization_id", "assessment_id") REFERENCES "vendor_assessments"("organization_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "vendor_assessment_links" ADD CONSTRAINT "vendor_assessment_links_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "vendor_assessment_links" ADD CONSTRAINT "vendor_assessment_links_revoked_by_fkey" FOREIGN KEY ("revoked_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable — a document uploaded through a link: what its respondent may see and cite.
CREATE TABLE "vendor_link_documents" (
    "organization_id" UUID NOT NULL,
    "link_id" UUID NOT NULL,
    "evidence_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vendor_link_documents_pkey" PRIMARY KEY ("link_id", "evidence_id")
);

-- CreateIndex
CREATE INDEX "vendor_link_documents_organization_id_idx" ON "vendor_link_documents"("organization_id");

-- CreateIndex — one document, one link.
CREATE UNIQUE INDEX "vendor_link_documents_evidence_id_key" ON "vendor_link_documents"("evidence_id");

-- AddForeignKey — composite, both sides: the link and the document are this organisation's.
ALTER TABLE "vendor_link_documents" ADD CONSTRAINT "vendor_link_documents_organization_id_link_id_fkey" FOREIGN KEY ("organization_id", "link_id") REFERENCES "vendor_assessment_links"("organization_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "vendor_link_documents" ADD CONSTRAINT "vendor_link_documents_organization_id_evidence_id_fkey" FOREIGN KEY ("organization_id", "evidence_id") REFERENCES "evidence"("organization_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE public.vendor_assessment_links
  ADD CONSTRAINT vendor_assessment_links_text_lengths CHECK (
    btrim(respondent_name) <> '' AND char_length(respondent_name) <= 200 AND char_length(respondent_email) <= 320),
  ADD CONSTRAINT vendor_assessment_links_email_shape CHECK (respondent_email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  ADD CONSTRAINT vendor_assessment_links_hash_shape CHECK (
    token_hash ~ '^[0-9a-f]{64}$'
    AND (code_hash IS NULL OR code_hash ~ '^[0-9a-f]{64}$')
    AND (session_hash IS NULL OR session_hash ~ '^[0-9a-f]{64}$')),
  ADD CONSTRAINT vendor_assessment_links_code_whole CHECK ((code_hash IS NULL) = (code_expires_at IS NULL)),
  -- A session exists exactly when the respondent has entered a right code.
  ADD CONSTRAINT vendor_assessment_links_session_whole CHECK ((session_hash IS NULL) = (confirmed_at IS NULL)),
  ADD CONSTRAINT vendor_assessment_links_counts CHECK (codes_sent >= 0 AND wrong_codes >= 0),
  -- Used by a submission, or revoked — never both.
  ADD CONSTRAINT vendor_assessment_links_ended_once CHECK (submitted_at IS NULL OR revoked_at IS NULL),
  ADD CONSTRAINT vendor_assessment_links_submitted_confirmed CHECK (submitted_at IS NULL OR confirmed_at IS NOT NULL);

-- The intake limits count the codes a link sends (3a's table, a new surface).
ALTER TABLE public.intake_attempts DROP CONSTRAINT intake_attempts_surface_check;
ALTER TABLE public.intake_attempts
  ADD CONSTRAINT intake_attempts_surface_check CHECK (surface IN ('rights', 'grievance', 'consent', 'vendor_link'));


-- ===========================================================================
-- (3) Limits and helpers (mirror packages/core/src/vendors.ts VENDOR_LINK_LIMITS)
-- ===========================================================================

CREATE OR REPLACE FUNCTION app.vendor_link_limits()
RETURNS TABLE (link_days integer, documents_per_link integer)
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = ''
AS $$
  -- A link lives 14 days; a respondent uploads at most 10 documents through it.
  -- The code's limits are the public intake's (app.intake_limits()).
  VALUES (14, 10);
$$;

-- Open: not revoked, not used, not expired, not locked by wrong codes. The
-- assessment's own status is checked by the caller.
CREATE OR REPLACE FUNCTION app.vendor_link_open(p_link public.vendor_assessment_links)
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = ''
AS $$
  SELECT p_link.id IS NOT NULL
    AND p_link.revoked_at IS NULL
    AND p_link.submitted_at IS NULL
    AND p_link.expires_at > now()
    AND p_link.wrong_codes < (SELECT l.wrong_codes FROM app.intake_limits() l);
$$;

-- The open link of an assessment, if any.
CREATE OR REPLACE FUNCTION app.vendor_assessment_open_link(p_organization_id uuid, p_assessment_id uuid)
RETURNS public.vendor_assessment_links
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT k.*
  FROM public.vendor_assessment_links k
  WHERE k.organization_id = p_organization_id AND k.assessment_id = p_assessment_id
    AND app.vendor_link_open(k)
  LIMIT 1;
$$;

-- What a link's page needs, by token — or nothing. One answer for an unknown,
-- expired, revoked, used or locked link, and for an assessment no longer open
-- to answers. Locked for the rest of the transaction.
CREATE OR REPLACE FUNCTION app.vendor_link_by_token(p_token_hash text)
RETURNS public.vendor_assessment_links
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_link public.vendor_assessment_links;
BEGIN
  IF p_token_hash IS NULL OR p_token_hash !~ '^[0-9a-f]{64}$' THEN
    RETURN NULL;
  END IF;
  SELECT * INTO v_link FROM public.vendor_assessment_links k WHERE k.token_hash = p_token_hash FOR UPDATE;
  IF NOT FOUND OR NOT app.vendor_link_open(v_link) THEN
    RETURN NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.vendor_assessments a
                 WHERE a.organization_id = v_link.organization_id AND a.id = v_link.assessment_id
                   AND a.status IN ('draft', 'returned')) THEN
    RETURN NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.organizations o WHERE o.id = v_link.organization_id AND o.deleted_at IS NULL) THEN
    RETURN NULL;
  END IF;
  RETURN v_link;
END;
$$;

-- The respondent's session holds: the code was entered in THIS browser.
CREATE OR REPLACE FUNCTION app.vendor_link_session_ok(p_link public.vendor_assessment_links, p_session_hash text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path = ''
AS $$
  SELECT p_link.session_hash IS NOT NULL AND p_session_hash IS NOT NULL AND p_link.session_hash = p_session_hash;
$$;

-- The page header: whose questionnaire, about which vendor.
CREATE OR REPLACE FUNCTION app.vendor_link_header(p_link public.vendor_assessment_links)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT jsonb_build_object(
    'organization', jsonb_build_object('name', o.name, 'legalName', o.legal_name),
    'vendor', jsonb_build_object('name', v.name, 'service', v.service),
    'version', a.version,
    'respondentName', p_link.respondent_name,
    'respondentEmail', p_link.respondent_email,
    'expiresAt', p_link.expires_at)
  FROM public.vendor_assessments a
  JOIN public.vendors v ON v.organization_id = a.organization_id AND v.id = a.vendor_id
  JOIN public.organizations o ON o.id = a.organization_id
  WHERE a.organization_id = p_link.organization_id AND a.id = p_link.assessment_id;
$$;

REVOKE ALL ON FUNCTION app.vendor_link_limits(), app.vendor_link_open(public.vendor_assessment_links),
  app.vendor_assessment_open_link(uuid, uuid), app.vendor_link_by_token(text),
  app.vendor_link_session_ok(public.vendor_assessment_links, text), app.vendor_link_header(public.vendor_assessment_links) FROM PUBLIC;


-- ===========================================================================
-- (4) The staff functions — send and revoke; save, submit and review replaced
-- ===========================================================================

-- Send the vendor a link to the assessment (vendor.assess; a draft or a
-- returned one). The server generated the token, holds it only long enough to
-- email it, and passes its hash. Sending again revokes the last link. While a
-- link is open the assessment's source is `vendor`.
CREATE OR REPLACE FUNCTION public.send_vendor_link(
  p_organization_id uuid,
  p_assessment_id uuid,
  p_respondent_name text,
  p_respondent_email text,
  p_token_hash text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_actor uuid := app.current_user_id();
  v_row public.vendor_assessments;
  v_name text := btrim(p_respondent_name);
  v_email text := lower(btrim(p_respondent_email));
  v_replaced integer;
  v_link public.vendor_assessment_links;
BEGIN
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'Sign in to continue.' USING ERRCODE = 'TS401';
  END IF;
  IF NOT app.has_permission(p_organization_id, 'vendor.assess') THEN
    RAISE EXCEPTION 'You do not have permission to assess a vendor.' USING ERRCODE = 'TS403';
  END IF;
  v_row := app.vendor_assessment_for_update(p_organization_id, p_assessment_id);
  IF v_row.status NOT IN ('draft', 'returned') THEN
    RAISE EXCEPTION 'Only a draft or a returned assessment can be sent to the vendor (this one is %).',
      CASE v_row.status WHEN 'submitted' THEN 'awaiting review' ELSE v_row.status END USING ERRCODE = 'TS409';
  END IF;
  IF v_name IS NULL OR v_name = '' OR char_length(v_name) > 200 THEN
    RAISE EXCEPTION 'Name the person at the vendor who will answer, in at most 200 characters.' USING ERRCODE = 'TS422';
  END IF;
  IF v_email IS NULL OR char_length(v_email) > 320 OR v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' THEN
    RAISE EXCEPTION 'Enter the respondent''s email address.' USING ERRCODE = 'TS422';
  END IF;
  IF p_token_hash IS NULL OR p_token_hash !~ '^[0-9a-f]{64}$' THEN
    RAISE EXCEPTION 'Missing link key.' USING ERRCODE = 'TS422';
  END IF;

  UPDATE public.vendor_assessment_links k
  SET revoked_at = now(), revoked_by = v_actor
  WHERE k.organization_id = p_organization_id AND k.assessment_id = p_assessment_id
    AND k.revoked_at IS NULL AND k.submitted_at IS NULL;
  GET DIAGNOSTICS v_replaced = ROW_COUNT;

  INSERT INTO public.vendor_assessment_links (organization_id, assessment_id, token_hash, respondent_name, respondent_email, expires_at, created_by)
  VALUES (p_organization_id, p_assessment_id, p_token_hash, v_name, v_email,
          now() + make_interval(days => (SELECT l.link_days FROM app.vendor_link_limits() l)), v_actor)
  RETURNING * INTO v_link;

  UPDATE public.vendor_assessments a SET source = 'vendor'
  WHERE a.organization_id = p_organization_id AND a.id = p_assessment_id AND a.source <> 'vendor';

  INSERT INTO public.audit_logs (organization_id, user_id, event_type, entity_type, entity_id, description, metadata)
  VALUES (p_organization_id, v_actor, 'vendor.vendor_assessment_links.sent', 'vendor_assessments', p_assessment_id,
    'Sent a processor assessment to the vendor to answer',
    jsonb_build_object('vendorId', v_row.vendor_id, 'version', v_row.version, 'linkId', v_link.id,
      'expiresAt', v_link.expires_at, 'linksReplaced', v_replaced));

  RETURN jsonb_build_object('id', v_link.id, 'expiresAt', v_link.expires_at, 'replaced', v_replaced)
    || app.vendor_link_header(v_link);
END;
$$;

-- End the open link (vendor.assess). The answers it saved stay; the assessment
-- is the staff's again.
CREATE OR REPLACE FUNCTION public.revoke_vendor_link(p_organization_id uuid, p_assessment_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_actor uuid := app.current_user_id();
  v_row public.vendor_assessments;
  v_link public.vendor_assessment_links;
BEGIN
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'Sign in to continue.' USING ERRCODE = 'TS401';
  END IF;
  IF NOT app.has_permission(p_organization_id, 'vendor.assess') THEN
    RAISE EXCEPTION 'You do not have permission to assess a vendor.' USING ERRCODE = 'TS403';
  END IF;
  v_row := app.vendor_assessment_for_update(p_organization_id, p_assessment_id);
  UPDATE public.vendor_assessment_links k
  SET revoked_at = now(), revoked_by = v_actor
  WHERE k.organization_id = p_organization_id AND k.assessment_id = p_assessment_id
    AND k.revoked_at IS NULL AND k.submitted_at IS NULL
  RETURNING * INTO v_link;
  IF v_link.id IS NULL THEN
    RAISE EXCEPTION 'No link to this assessment is open.' USING ERRCODE = 'TS404';
  END IF;
  IF v_row.status IN ('draft', 'returned') THEN
    UPDATE public.vendor_assessments a SET source = 'staff'
    WHERE a.organization_id = p_organization_id AND a.id = p_assessment_id AND a.source <> 'staff';
  END IF;

  INSERT INTO public.audit_logs (organization_id, user_id, event_type, entity_type, entity_id, description, metadata)
  VALUES (p_organization_id, v_actor, 'vendor.vendor_assessment_links.revoked', 'vendor_assessments', p_assessment_id,
    'Revoked the vendor''s link to a processor assessment',
    jsonb_build_object('vendorId', v_row.vendor_id, 'version', v_row.version, 'linkId', v_link.id));

  RETURN jsonb_build_object('id', v_link.id, 'revokedAt', v_link.revoked_at);
END;
$$;

-- save_vendor_assessment, from its 4a body with one check added: while a link
-- is open, the vendor is answering — staff revoke it first.
CREATE OR REPLACE FUNCTION public.save_vendor_assessment(p_organization_id uuid, p_assessment_id uuid, p_source_note text, p_answers jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_actor uuid := app.current_user_id();
  v_row public.vendor_assessments;
  v_note text := NULLIF(btrim(p_source_note), '');
  v_entry jsonb;
  v_code text;
  v_answer text;
  v_na boolean;
  v_reason text;
  v_evidence uuid;
  v_changed integer := 0;
  v_cleared integer := 0;
  v_n integer;
BEGIN
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'Sign in to continue.' USING ERRCODE = 'TS401';
  END IF;
  IF NOT app.has_permission(p_organization_id, 'vendor.assess') THEN
    RAISE EXCEPTION 'You do not have permission to assess a vendor.' USING ERRCODE = 'TS403';
  END IF;
  v_row := app.vendor_assessment_for_update(p_organization_id, p_assessment_id);
  IF v_row.status NOT IN ('draft', 'returned') THEN
    RAISE EXCEPTION 'This assessment is % — its answers can no longer change.', v_row.status USING ERRCODE = 'TS409';
  END IF;
  IF (app.vendor_assessment_open_link(p_organization_id, p_assessment_id)).id IS NOT NULL THEN
    RAISE EXCEPTION 'The vendor has a link open to this assessment — revoke it before changing the answers.' USING ERRCODE = 'TS409';
  END IF;
  IF jsonb_typeof(COALESCE(p_answers, '[]'::jsonb)) <> 'array' OR jsonb_array_length(COALESCE(p_answers, '[]'::jsonb)) > 45 THEN
    RAISE EXCEPTION 'Send the answers as a list, at most one per question.' USING ERRCODE = 'TS422';
  END IF;
  IF (SELECT count(*) <> count(DISTINCT e.value ->> 'code') FROM jsonb_array_elements(COALESCE(p_answers, '[]'::jsonb)) e(value)) THEN
    RAISE EXCEPTION 'Each question is answered once.' USING ERRCODE = 'TS422';
  END IF;

  FOR v_entry IN SELECT e.value FROM jsonb_array_elements(COALESCE(p_answers, '[]'::jsonb)) e(value) LOOP
    v_code := v_entry ->> 'code';
    v_answer := NULLIF(btrim(v_entry ->> 'answer'), '');
    v_na := COALESCE((v_entry ->> 'notApplicable')::boolean, false);
    v_reason := NULLIF(btrim(v_entry ->> 'naReason'), '');
    v_evidence := NULLIF(v_entry ->> 'evidenceId', '')::uuid;
    IF NOT EXISTS (SELECT 1 FROM app.vendor_questions() q WHERE q.code = v_code) THEN
      RAISE EXCEPTION '% is not a question in the questionnaire.', COALESCE(v_code, 'An entry') USING ERRCODE = 'TS422';
    END IF;

    IF v_answer IS NULL AND NOT v_na THEN
      DELETE FROM public.vendor_assessment_answers x
      WHERE x.organization_id = p_organization_id AND x.assessment_id = p_assessment_id AND x.question_code = v_code;
      GET DIAGNOSTICS v_n = ROW_COUNT;
      v_cleared := v_cleared + v_n;
      CONTINUE;
    END IF;
    IF v_na THEN
      v_answer := NULL;
      v_evidence := NULL;
    ELSE
      v_reason := NULL;
    END IF;
    IF NOT app.vendor_answer_valid(v_code, v_answer, v_na, v_reason) THEN
      RAISE EXCEPTION '%: give one of its answers, or mark it not applicable with a reason.', v_code USING ERRCODE = 'TS422';
    END IF;

    INSERT INTO public.vendor_assessment_answers AS x (organization_id, assessment_id, question_code, answer, not_applicable, na_reason, evidence_id, answered_by, answered_at)
    VALUES (p_organization_id, p_assessment_id, v_code, v_answer, v_na, v_reason, v_evidence, v_actor, now())
    ON CONFLICT (assessment_id, question_code) DO UPDATE
      SET answer = EXCLUDED.answer, not_applicable = EXCLUDED.not_applicable, na_reason = EXCLUDED.na_reason,
          evidence_id = EXCLUDED.evidence_id, answered_by = EXCLUDED.answered_by, answered_at = EXCLUDED.answered_at
      WHERE (x.answer, x.not_applicable, x.na_reason, x.evidence_id)
            IS DISTINCT FROM (EXCLUDED.answer, EXCLUDED.not_applicable, EXCLUDED.na_reason, EXCLUDED.evidence_id);
    GET DIAGNOSTICS v_n = ROW_COUNT;
    v_changed := v_changed + v_n;
  END LOOP;

  IF v_note IS DISTINCT FROM v_row.source_note THEN
    IF v_note IS NOT NULL AND char_length(v_note) > 300 THEN
      RAISE EXCEPTION 'Say where the answers came from in at most 300 characters.' USING ERRCODE = 'TS422';
    END IF;
    UPDATE public.vendor_assessments a SET source_note = v_note WHERE a.organization_id = p_organization_id AND a.id = p_assessment_id;
  END IF;

  IF v_changed + v_cleared > 0 OR v_note IS DISTINCT FROM v_row.source_note THEN
    INSERT INTO public.audit_logs (organization_id, user_id, event_type, entity_type, entity_id, description, metadata)
    VALUES (p_organization_id, v_actor, 'vendor.vendor_assessments.answers_saved', 'vendor_assessments', p_assessment_id,
      'Saved answers to a processor assessment',
      jsonb_build_object('vendorId', v_row.vendor_id, 'version', v_row.version, 'answersChanged', v_changed,
        'answersCleared', v_cleared, 'sourceNoteChanged', v_note IS DISTINCT FROM v_row.source_note));
  END IF;

  RETURN jsonb_build_object('answersChanged', v_changed, 'answersCleared', v_cleared);
END;
$$;

-- submit_vendor_assessment, from its 4a body with two changes: refused while a
-- link is open; and a staff submission is the staff's — source `staff`, and
-- the declaration of any earlier, returned vendor submission is cleared (the
-- audit log keeps that submission).
CREATE OR REPLACE FUNCTION public.submit_vendor_assessment(p_organization_id uuid, p_assessment_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_actor uuid := app.current_user_id();
  v_row public.vendor_assessments;
  v_missing text[];
  v_risk jsonb;
BEGIN
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'Sign in to continue.' USING ERRCODE = 'TS401';
  END IF;
  IF NOT app.has_permission(p_organization_id, 'vendor.assess') THEN
    RAISE EXCEPTION 'You do not have permission to assess a vendor.' USING ERRCODE = 'TS403';
  END IF;
  v_row := app.vendor_assessment_for_update(p_organization_id, p_assessment_id);
  IF v_row.status NOT IN ('draft', 'returned') THEN
    RAISE EXCEPTION 'This assessment is already %.', CASE v_row.status WHEN 'submitted' THEN 'awaiting review' ELSE v_row.status END
      USING ERRCODE = 'TS409';
  END IF;
  IF (app.vendor_assessment_open_link(p_organization_id, p_assessment_id)).id IS NOT NULL THEN
    RAISE EXCEPTION 'The vendor has a link open to this assessment — revoke it before submitting it yourself.' USING ERRCODE = 'TS409';
  END IF;
  IF v_row.source_note IS NULL THEN
    RAISE EXCEPTION 'Say where the answers came from (for example, "the vendor''s email of 3 Oct 2026") before submitting.' USING ERRCODE = 'TS422';
  END IF;
  v_missing := app.vendor_assessment_missing(p_organization_id, p_assessment_id);
  IF cardinality(v_missing) > 0 THEN
    RAISE EXCEPTION '% % not answered or marked not applicable: %.', cardinality(v_missing),
      CASE WHEN cardinality(v_missing) = 1 THEN 'question is' ELSE 'questions are' END, array_to_string(v_missing, ', ')
      USING ERRCODE = 'TS422';
  END IF;

  v_risk := app.vendor_assessment_risk(p_organization_id, p_assessment_id);
  IF v_risk ->> 'score' IS NULL THEN
    RAISE EXCEPTION 'Answer at least one scored question — an assessment cannot be "not applicable" throughout.' USING ERRCODE = 'TS422';
  END IF;
  UPDATE public.vendor_assessments a
  SET status = 'submitted', submitted_by = v_actor, submitted_at = now(), source = 'staff',
      declared_name = NULL, declared_role = NULL, declared_at = NULL,
      risk_score = (v_risk ->> 'score')::integer, risk_tier = v_risk ->> 'tier',
      unevidenced = ARRAY(SELECT jsonb_array_elements_text(v_risk -> 'unevidenced'))
  WHERE a.organization_id = p_organization_id AND a.id = p_assessment_id
  RETURNING * INTO v_row;

  INSERT INTO public.audit_logs (organization_id, user_id, event_type, entity_type, entity_id, description, metadata)
  VALUES (p_organization_id, v_actor, 'vendor.vendor_assessments.submitted', 'vendor_assessments', p_assessment_id,
    'Submitted a processor assessment for review',
    jsonb_build_object('vendorId', v_row.vendor_id, 'version', v_row.version, 'riskScore', v_row.risk_score,
      'riskTier', v_row.risk_tier, 'unevidencedCount', cardinality(v_row.unevidenced)));

  RETURN jsonb_build_object('id', v_row.id, 'status', v_row.status, 'riskScore', v_row.risk_score);
END;
$$;

-- review_vendor_assessment, from its 4a body with one check added (D-092):
-- whoever sent a link for this assessment asked for its answers, and may not
-- accept or return it either.
CREATE OR REPLACE FUNCTION public.review_vendor_assessment(
  p_organization_id uuid,
  p_assessment_id uuid,
  p_decision text,
  p_reason text,
  p_review_by date
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_actor uuid := app.current_user_id();
  v_row public.vendor_assessments;
  v_today date := (now() AT TIME ZONE 'Asia/Kolkata')::date;
  v_months record;
  v_review_by date;
  v_reason text := NULLIF(btrim(p_reason), '');
  v_risk jsonb;
BEGIN
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'Sign in to continue.' USING ERRCODE = 'TS401';
  END IF;
  IF NOT app.has_permission(p_organization_id, 'vendor.review') THEN
    RAISE EXCEPTION 'You do not have permission to review a processor assessment.' USING ERRCODE = 'TS403';
  END IF;
  v_row := app.vendor_assessment_for_update(p_organization_id, p_assessment_id);
  IF v_row.status <> 'submitted' THEN
    RAISE EXCEPTION 'Only an assessment awaiting review can be accepted or returned (this one is %).', v_row.status USING ERRCODE = 'TS409';
  END IF;
  -- The link's sender first: whoever asked the vendor is told so, whatever else they did.
  IF EXISTS (SELECT 1 FROM public.vendor_assessment_links k
             WHERE k.organization_id = p_organization_id AND k.assessment_id = p_assessment_id AND k.created_by = v_actor) THEN
    RAISE EXCEPTION 'You sent this assessment to the vendor — someone else must review their answers.' USING ERRCODE = 'TS403';
  END IF;
  IF v_actor = v_row.created_by OR v_actor = v_row.submitted_by OR EXISTS (
       SELECT 1 FROM public.vendor_assessment_answers x
       WHERE x.organization_id = p_organization_id AND x.assessment_id = p_assessment_id AND x.answered_by = v_actor) THEN
    RAISE EXCEPTION 'You entered or answered this assessment — someone else must review it.' USING ERRCODE = 'TS403';
  END IF;

  IF p_decision = 'return' THEN
    IF v_reason IS NULL OR char_length(v_reason) > 1000 THEN
      RAISE EXCEPTION 'Say why it is returned, in at most 1,000 characters.' USING ERRCODE = 'TS422';
    END IF;
    UPDATE public.vendor_assessments a
    SET status = 'returned', return_reason = v_reason, reviewed_by = v_actor, reviewed_at = now()
    WHERE a.organization_id = p_organization_id AND a.id = p_assessment_id
    RETURNING * INTO v_row;
  ELSIF p_decision = 'accept' THEN
    SELECT * INTO v_months FROM app.vendor_review_months();
    v_review_by := COALESCE(p_review_by, (v_today + make_interval(months => v_months.default_months))::date);
    IF v_review_by <= v_today OR v_review_by > (v_today + make_interval(months => v_months.max_months))::date THEN
      RAISE EXCEPTION 'The review-by date is after today and at most % months away.', v_months.max_months USING ERRCODE = 'TS422';
    END IF;
    -- Derived again: a document may have been rejected in review since it was submitted.
    v_risk := app.vendor_assessment_risk(p_organization_id, p_assessment_id);
    UPDATE public.vendor_assessments a
    SET status = 'accepted', reviewed_by = v_actor, reviewed_at = now(), review_by = v_review_by,
        risk_score = (v_risk ->> 'score')::integer, risk_tier = v_risk ->> 'tier',
        unevidenced = ARRAY(SELECT jsonb_array_elements_text(v_risk -> 'unevidenced'))
    WHERE a.organization_id = p_organization_id AND a.id = p_assessment_id
    RETURNING * INTO v_row;
  ELSE
    RAISE EXCEPTION 'Accept it or return it.' USING ERRCODE = 'TS422';
  END IF;

  INSERT INTO public.audit_logs (organization_id, user_id, event_type, entity_type, entity_id, description, metadata)
  VALUES (p_organization_id, v_actor,
    CASE WHEN p_decision = 'accept' THEN 'vendor.vendor_assessments.accepted' ELSE 'vendor.vendor_assessments.returned' END,
    'vendor_assessments', p_assessment_id,
    CASE WHEN p_decision = 'accept' THEN 'Accepted a processor assessment' ELSE 'Returned a processor assessment for changes' END,
    jsonb_strip_nulls(jsonb_build_object('vendorId', v_row.vendor_id, 'version', v_row.version, 'riskScore', v_row.risk_score,
      'riskTier', v_row.risk_tier, 'reviewBy', to_char(v_row.review_by, 'YYYY-MM-DD'), 'source', v_row.source)));

  RETURN jsonb_build_object('id', v_row.id, 'status', v_row.status, 'reviewBy', to_char(v_row.review_by, 'YYYY-MM-DD'));
END;
$$;

REVOKE ALL ON FUNCTION public.send_vendor_link(uuid, uuid, text, text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.revoke_vendor_link(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.send_vendor_link(uuid, uuid, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_vendor_link(uuid, uuid) TO authenticated;
-- save_, submit_ and review_vendor_assessment keep 4a's grants (CREATE OR REPLACE keeps them).


-- ===========================================================================
-- (5) The public writer — seven functions, `service_role` only
-- ===========================================================================

-- What the respondent's questionnaire shows them: the answers as they stand
-- (a document they did not upload is "on file", never named), their own
-- documents, and what is still to answer.
CREATE OR REPLACE FUNCTION app.vendor_link_body(p_link public.vendor_assessment_links)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT jsonb_build_object(
    'answers', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'code', x.question_code,
        'answer', x.answer,
        'notApplicable', x.not_applicable,
        'naReason', x.na_reason,
        'evidenceId', CASE WHEN d.evidence_id IS NOT NULL THEN x.evidence_id END,
        'documentOnFile', x.evidence_id IS NOT NULL AND d.evidence_id IS NULL)
        ORDER BY q.ord)
      FROM public.vendor_assessment_answers x
      JOIN app.vendor_questions() q ON q.code = x.question_code
      LEFT JOIN public.vendor_link_documents d ON d.link_id = p_link.id AND d.evidence_id = x.evidence_id
      WHERE x.organization_id = p_link.organization_id AND x.assessment_id = p_link.assessment_id), '[]'::jsonb),
    'documents', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', e.id,
        'fileName', e.file_name,
        'contentType', e.content_type,
        'byteSize', e.byte_size,
        'uploadedAt', e.uploaded_at,
        'attached', EXISTS (SELECT 1 FROM public.evidence_links l
                            WHERE l.organization_id = e.organization_id AND l.evidence_id = e.id AND l.linked_entity_type = 'vendor'))
        ORDER BY e.uploaded_at)
      FROM public.vendor_link_documents d
      JOIN public.evidence e ON e.organization_id = d.organization_id AND e.id = d.evidence_id
      WHERE d.link_id = p_link.id), '[]'::jsonb),
    'missing', to_jsonb(app.vendor_assessment_missing(p_link.organization_id, p_link.assessment_id)));
$$;

REVOKE ALL ON FUNCTION app.vendor_link_body(public.vendor_assessment_links) FROM PUBLIC;

-- (a) Open the link: its header, and — once the code was entered in this
-- browser — the questionnaire. Anything else is the same "not found".
CREATE OR REPLACE FUNCTION public.vendor_link_view(p_token_hash text, p_session_hash text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_link public.vendor_assessment_links;
BEGIN
  SELECT * INTO v_link FROM public.vendor_assessment_links k
  WHERE p_token_hash ~ '^[0-9a-f]{64}$' AND k.token_hash = p_token_hash;
  IF NOT FOUND OR NOT app.vendor_link_open(v_link)
     OR NOT EXISTS (SELECT 1 FROM public.vendor_assessments a
                    WHERE a.organization_id = v_link.organization_id AND a.id = v_link.assessment_id AND a.status IN ('draft', 'returned'))
     OR NOT EXISTS (SELECT 1 FROM public.organizations o WHERE o.id = v_link.organization_id AND o.deleted_at IS NULL) THEN
    RETURN jsonb_build_object('status', 'not_found');
  END IF;
  IF NOT app.vendor_link_session_ok(v_link, p_session_hash) THEN
    RETURN jsonb_build_object('status', 'unconfirmed') || app.vendor_link_header(v_link);
  END IF;
  RETURN jsonb_build_object('status', 'open') || app.vendor_link_header(v_link) || app.vendor_link_body(v_link);
END;
$$;

-- (b) A code to the respondent's address (the old one stops working). The
-- public intake's email limits apply: 3 an hour, 10 a day per address.
CREATE OR REPLACE FUNCTION public.vendor_link_send_code(p_token_hash text, p_client_hash text, p_code_hash text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_link public.vendor_assessment_links;
  v_l record;
  v_email_hash text;
  v_code_expires timestamptz;
BEGIN
  v_link := app.vendor_link_by_token(p_token_hash);
  IF v_link.id IS NULL THEN
    RETURN jsonb_build_object('status', 'not_found');
  END IF;
  IF p_client_hash IS NULL OR p_client_hash !~ '^[0-9a-f]{64}$' OR p_code_hash IS NULL OR p_code_hash !~ '^[0-9a-f]{64}$' THEN
    RAISE EXCEPTION 'Missing client key.' USING ERRCODE = 'TS422';
  END IF;
  SELECT * INTO v_l FROM app.intake_limits();
  v_email_hash := app.intake_email_hash(v_link.respondent_email);
  PERFORM pg_advisory_xact_lock(hashtextextended('intake_email:' || v_email_hash, 0));
  IF (SELECT count(*) FROM public.intake_attempts a
      WHERE a.email_hash = v_email_hash AND a.event = 'code_sent' AND a.created_at > now() - interval '1 hour') >= v_l.codes_per_hour
     OR (SELECT count(*) FROM public.intake_attempts a
         WHERE a.email_hash = v_email_hash AND a.event = 'code_sent' AND a.created_at > now() - interval '1 day') >= v_l.codes_per_day THEN
    RETURN jsonb_build_object('status', 'rate_limited', 'limit', 'email');
  END IF;

  v_code_expires := now() + make_interval(mins => v_l.code_minutes);
  UPDATE public.vendor_assessment_links k
  SET code_hash = p_code_hash, code_expires_at = v_code_expires, codes_sent = codes_sent + 1
  WHERE k.id = v_link.id;
  INSERT INTO public.intake_attempts (organization_id, surface, event, client_hash, email_hash)
  VALUES (v_link.organization_id, 'vendor_link', 'code_sent', p_client_hash, v_email_hash);

  RETURN jsonb_build_object('status', 'sent', 'codeExpiresAt', v_code_expires) || app.vendor_link_header(v_link);
END;
$$;

-- (c) The code entered: this browser's session is the respondent's (a code
-- entered in another browser ends the earlier session). A wrong code is
-- counted and answered, not raised, so the count survives; the fifth locks the
-- link, and the organisation must send a new one.
CREATE OR REPLACE FUNCTION public.vendor_link_confirm(p_token_hash text, p_code_hash text, p_session_hash text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_link public.vendor_assessment_links;
  v_l record;
  v_first boolean;
BEGIN
  v_link := app.vendor_link_by_token(p_token_hash);
  IF v_link.id IS NULL THEN
    RETURN jsonb_build_object('status', 'not_found');
  END IF;
  IF p_session_hash IS NULL OR p_session_hash !~ '^[0-9a-f]{64}$' THEN
    RAISE EXCEPTION 'Missing session key.' USING ERRCODE = 'TS422';
  END IF;
  SELECT * INTO v_l FROM app.intake_limits();
  IF v_link.code_hash IS NULL OR v_link.code_expires_at <= now() THEN
    RETURN jsonb_build_object('status', 'code_expired');
  END IF;
  IF p_code_hash IS NULL OR p_code_hash <> v_link.code_hash THEN
    UPDATE public.vendor_assessment_links k SET wrong_codes = wrong_codes + 1 WHERE k.id = v_link.id;
    IF v_link.wrong_codes + 1 >= v_l.wrong_codes THEN
      RETURN jsonb_build_object('status', 'locked');
    END IF;
    RETURN jsonb_build_object('status', 'wrong_code', 'attemptsLeft', v_l.wrong_codes - v_link.wrong_codes - 1);
  END IF;

  v_first := v_link.confirmed_at IS NULL;
  UPDATE public.vendor_assessment_links k
  SET session_hash = p_session_hash, confirmed_at = now(), code_hash = NULL, code_expires_at = NULL
  WHERE k.id = v_link.id
  RETURNING * INTO v_link;

  INSERT INTO public.audit_logs (organization_id, user_id, event_type, entity_type, entity_id, description, metadata)
  VALUES (v_link.organization_id, NULL, 'vendor_link.vendor_assessment_links.confirmed', 'vendor_assessments', v_link.assessment_id,
    'Confirmed the email address the link was sent to — by the vendor''s respondent',
    jsonb_build_object('linkId', v_link.id, 'firstConfirmation', v_first));

  RETURN jsonb_build_object('status', 'confirmed', 'expiresAt', v_link.expires_at);
END;
$$;

-- (d) Save answers, as staff save them, attributed to nobody in the
-- organisation (`answered_by = NULL`: the vendor's respondent). An entry with
-- no `evidenceId` key keeps the document cited now; one with a key may cite
-- only a document uploaded through this link.
CREATE OR REPLACE FUNCTION public.vendor_link_save(p_token_hash text, p_session_hash text, p_answers jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_link public.vendor_assessment_links;
  v_row public.vendor_assessments;
  v_entry jsonb;
  v_code text;
  v_answer text;
  v_na boolean;
  v_reason text;
  v_evidence uuid;
  v_changed integer := 0;
  v_cleared integer := 0;
  v_n integer;
BEGIN
  v_link := app.vendor_link_by_token(p_token_hash);
  IF v_link.id IS NULL THEN
    RETURN jsonb_build_object('status', 'not_found');
  END IF;
  IF NOT app.vendor_link_session_ok(v_link, p_session_hash) THEN
    RETURN jsonb_build_object('status', 'unconfirmed');
  END IF;
  v_row := app.vendor_assessment_for_update(v_link.organization_id, v_link.assessment_id);
  IF jsonb_typeof(COALESCE(p_answers, '[]'::jsonb)) <> 'array' OR jsonb_array_length(COALESCE(p_answers, '[]'::jsonb)) > 45 THEN
    RAISE EXCEPTION 'Send the answers as a list, at most one per question.' USING ERRCODE = 'TS422';
  END IF;
  IF (SELECT count(*) <> count(DISTINCT e.value ->> 'code') FROM jsonb_array_elements(COALESCE(p_answers, '[]'::jsonb)) e(value)) THEN
    RAISE EXCEPTION 'Each question is answered once.' USING ERRCODE = 'TS422';
  END IF;

  FOR v_entry IN SELECT e.value FROM jsonb_array_elements(COALESCE(p_answers, '[]'::jsonb)) e(value) LOOP
    v_code := v_entry ->> 'code';
    v_answer := NULLIF(btrim(v_entry ->> 'answer'), '');
    v_na := COALESCE((v_entry ->> 'notApplicable')::boolean, false);
    v_reason := NULLIF(btrim(v_entry ->> 'naReason'), '');
    IF NOT EXISTS (SELECT 1 FROM app.vendor_questions() q WHERE q.code = v_code) THEN
      RAISE EXCEPTION '% is not a question in the questionnaire.', COALESCE(v_code, 'An entry') USING ERRCODE = 'TS422';
    END IF;

    IF v_answer IS NULL AND NOT v_na THEN
      DELETE FROM public.vendor_assessment_answers x
      WHERE x.organization_id = v_link.organization_id AND x.assessment_id = v_link.assessment_id AND x.question_code = v_code;
      GET DIAGNOSTICS v_n = ROW_COUNT;
      v_cleared := v_cleared + v_n;
      CONTINUE;
    END IF;
    IF v_entry ? 'evidenceId' THEN
      v_evidence := NULLIF(v_entry ->> 'evidenceId', '')::uuid;
      IF v_evidence IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM public.vendor_link_documents d WHERE d.link_id = v_link.id AND d.evidence_id = v_evidence) THEN
        RAISE EXCEPTION '%: cite a document you uploaded here.', v_code USING ERRCODE = 'TS422';
      END IF;
    ELSE
      SELECT x.evidence_id INTO v_evidence FROM public.vendor_assessment_answers x
      WHERE x.organization_id = v_link.organization_id AND x.assessment_id = v_link.assessment_id AND x.question_code = v_code;
    END IF;
    IF v_na THEN
      v_answer := NULL;
      v_evidence := NULL;
    ELSE
      v_reason := NULL;
    END IF;
    IF NOT app.vendor_answer_valid(v_code, v_answer, v_na, v_reason) THEN
      RAISE EXCEPTION '%: give one of its answers, or mark it not applicable with a reason.', v_code USING ERRCODE = 'TS422';
    END IF;

    INSERT INTO public.vendor_assessment_answers AS x (organization_id, assessment_id, question_code, answer, not_applicable, na_reason, evidence_id, answered_by, answered_at)
    VALUES (v_link.organization_id, v_link.assessment_id, v_code, v_answer, v_na, v_reason, v_evidence, NULL, now())
    ON CONFLICT (assessment_id, question_code) DO UPDATE
      SET answer = EXCLUDED.answer, not_applicable = EXCLUDED.not_applicable, na_reason = EXCLUDED.na_reason,
          evidence_id = EXCLUDED.evidence_id, answered_by = EXCLUDED.answered_by, answered_at = EXCLUDED.answered_at
      WHERE (x.answer, x.not_applicable, x.na_reason, x.evidence_id)
            IS DISTINCT FROM (EXCLUDED.answer, EXCLUDED.not_applicable, EXCLUDED.na_reason, EXCLUDED.evidence_id);
    GET DIAGNOSTICS v_n = ROW_COUNT;
    v_changed := v_changed + v_n;
  END LOOP;

  IF v_changed + v_cleared > 0 THEN
    INSERT INTO public.audit_logs (organization_id, user_id, event_type, entity_type, entity_id, description, metadata)
    VALUES (v_link.organization_id, NULL, 'vendor_link.vendor_assessments.answers_saved', 'vendor_assessments', v_link.assessment_id,
      'Saved answers to a processor assessment — by the vendor''s respondent',
      jsonb_build_object('vendorId', v_row.vendor_id, 'version', v_row.version, 'linkId', v_link.id,
        'answersChanged', v_changed, 'answersCleared', v_cleared));
  END IF;

  RETURN jsonb_build_object('status', 'saved', 'answersChanged', v_changed, 'answersCleared', v_cleared)
    || app.vendor_link_header(v_link) || app.vendor_link_body(v_link);
END;
$$;

-- (e) Register a document the respondent is about to upload: the evidence row
-- first (uploaded by nobody in the organisation, pending review), so the
-- server can sign an upload URL for exactly its path. At most ten per link.
CREATE OR REPLACE FUNCTION public.vendor_link_add_document(
  p_token_hash text,
  p_session_hash text,
  p_evidence_id uuid,
  p_file_name text,
  p_content_type text,
  p_byte_size integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_link public.vendor_assessment_links;
  v_row public.vendor_assessments;
  v_path text;
BEGIN
  v_link := app.vendor_link_by_token(p_token_hash);
  IF v_link.id IS NULL THEN
    RETURN jsonb_build_object('status', 'not_found');
  END IF;
  IF NOT app.vendor_link_session_ok(v_link, p_session_hash) THEN
    RETURN jsonb_build_object('status', 'unconfirmed');
  END IF;
  IF (SELECT count(*) FROM public.vendor_link_documents d WHERE d.link_id = v_link.id)
     >= (SELECT l.documents_per_link FROM app.vendor_link_limits() l) THEN
    RETURN jsonb_build_object('status', 'too_many_documents');
  END IF;
  SELECT * INTO v_row FROM public.vendor_assessments a WHERE a.organization_id = v_link.organization_id AND a.id = v_link.assessment_id;

  -- The evidence table's own CHECKs hold the name, type, size and path (D-042).
  v_path := 'organizations/' || v_link.organization_id::text || '/evidence/' || p_evidence_id::text || '/' || p_file_name;
  INSERT INTO public.evidence (id, organization_id, storage_path, file_name, content_type, byte_size, uploaded_by, review_status)
  VALUES (p_evidence_id, v_link.organization_id, v_path, p_file_name, p_content_type, p_byte_size, NULL, 'pending');
  INSERT INTO public.vendor_link_documents (organization_id, link_id, evidence_id)
  VALUES (v_link.organization_id, v_link.id, p_evidence_id);

  -- Issuing the upload URL writes no row, so it is recorded here, once.
  INSERT INTO public.audit_logs (organization_id, user_id, event_type, entity_type, entity_id, description, metadata)
  VALUES (v_link.organization_id, NULL, 'vendor_link.evidence.upload_url.issued', 'evidence', p_evidence_id,
    'Issued a signed evidence upload URL — to the vendor''s respondent',
    jsonb_build_object('vendorId', v_row.vendor_id, 'linkId', v_link.id, 'fileName', p_file_name,
      'contentType', p_content_type, 'byteSize', p_byte_size));

  RETURN jsonb_build_object('status', 'registered', 'storagePath', v_path);
END;
$$;

-- (f) The upload finished: the document is attached to the vendor
-- (`evidence_links` type `vendor`), pending review. The link trigger checks the
-- file is really stored.
CREATE OR REPLACE FUNCTION public.vendor_link_attach_document(p_token_hash text, p_session_hash text, p_evidence_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_link public.vendor_assessment_links;
  v_row public.vendor_assessments;
BEGIN
  v_link := app.vendor_link_by_token(p_token_hash);
  IF v_link.id IS NULL THEN
    RETURN jsonb_build_object('status', 'not_found');
  END IF;
  IF NOT app.vendor_link_session_ok(v_link, p_session_hash) THEN
    RETURN jsonb_build_object('status', 'unconfirmed');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.vendor_link_documents d WHERE d.link_id = v_link.id AND d.evidence_id = p_evidence_id) THEN
    RETURN jsonb_build_object('status', 'not_found');
  END IF;
  SELECT * INTO v_row FROM public.vendor_assessments a WHERE a.organization_id = v_link.organization_id AND a.id = v_link.assessment_id;
  IF EXISTS (SELECT 1 FROM public.evidence_links l
             WHERE l.organization_id = v_link.organization_id AND l.evidence_id = p_evidence_id
               AND l.linked_entity_type = 'vendor' AND l.linked_entity_id = v_row.vendor_id) THEN
    RETURN jsonb_build_object('status', 'attached');
  END IF;

  INSERT INTO public.evidence_links (organization_id, evidence_id, linked_entity_type, linked_entity_id)
  VALUES (v_link.organization_id, p_evidence_id, 'vendor', v_row.vendor_id);

  INSERT INTO public.audit_logs (organization_id, user_id, event_type, entity_type, entity_id, description, metadata)
  VALUES (v_link.organization_id, NULL, 'vendor_link.evidence_links.insert', 'evidence', p_evidence_id,
    'Attached a document to a vendor — by the vendor''s respondent',
    jsonb_build_object('vendorId', v_row.vendor_id, 'linkId', v_link.id));

  RETURN jsonb_build_object('status', 'attached');
END;
$$;

-- (g) Submit for review, with the respondent's declaration (§7b 4b.3): the
-- same completeness check and score as a staff submission; stamped by the
-- database; the link is used up. Nothing counts until a person in the
-- organisation who neither created it, answered it nor sent the link accepts it.
CREATE OR REPLACE FUNCTION public.vendor_link_submit(p_token_hash text, p_session_hash text, p_declared_name text, p_declared_role text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_link public.vendor_assessment_links;
  v_row public.vendor_assessments;
  v_name text := btrim(p_declared_name);
  v_role text := btrim(p_declared_role);
  v_missing text[];
  v_risk jsonb;
BEGIN
  v_link := app.vendor_link_by_token(p_token_hash);
  IF v_link.id IS NULL THEN
    RETURN jsonb_build_object('status', 'not_found');
  END IF;
  IF NOT app.vendor_link_session_ok(v_link, p_session_hash) THEN
    RETURN jsonb_build_object('status', 'unconfirmed');
  END IF;
  v_row := app.vendor_assessment_for_update(v_link.organization_id, v_link.assessment_id);
  IF v_name IS NULL OR v_name = '' OR char_length(v_name) > 200 OR v_role IS NULL OR v_role = '' OR char_length(v_role) > 200 THEN
    RAISE EXCEPTION 'Sign the declaration with your name and your role, each in at most 200 characters.' USING ERRCODE = 'TS422';
  END IF;
  v_missing := app.vendor_assessment_missing(v_link.organization_id, v_link.assessment_id);
  IF cardinality(v_missing) > 0 THEN
    RAISE EXCEPTION '% % not answered or marked not applicable: %.', cardinality(v_missing),
      CASE WHEN cardinality(v_missing) = 1 THEN 'question is' ELSE 'questions are' END, array_to_string(v_missing, ', ')
      USING ERRCODE = 'TS422';
  END IF;
  v_risk := app.vendor_assessment_risk(v_link.organization_id, v_link.assessment_id);
  IF v_risk ->> 'score' IS NULL THEN
    RAISE EXCEPTION 'Answer at least one scored question — an assessment cannot be "not applicable" throughout.' USING ERRCODE = 'TS422';
  END IF;

  UPDATE public.vendor_assessments a
  SET status = 'submitted', source = 'vendor', submitted_by = NULL, submitted_at = now(),
      source_note = 'Answered by the vendor through the questionnaire link sent on '
                    || to_char(v_link.created_at AT TIME ZONE 'Asia/Kolkata', 'FMDD Mon YYYY'),
      declared_name = v_name, declared_role = v_role, declared_at = now(),
      risk_score = (v_risk ->> 'score')::integer, risk_tier = v_risk ->> 'tier',
      unevidenced = ARRAY(SELECT jsonb_array_elements_text(v_risk -> 'unevidenced'))
  WHERE a.organization_id = v_link.organization_id AND a.id = v_link.assessment_id
  RETURNING * INTO v_row;
  UPDATE public.vendor_assessment_links k SET submitted_at = now() WHERE k.id = v_link.id;

  INSERT INTO public.audit_logs (organization_id, user_id, event_type, entity_type, entity_id, description, metadata)
  VALUES (v_link.organization_id, NULL, 'vendor_link.vendor_assessments.submitted', 'vendor_assessments', v_row.id,
    'Submitted a processor assessment for review — by the vendor''s respondent, with a signed declaration',
    jsonb_build_object('vendorId', v_row.vendor_id, 'version', v_row.version, 'linkId', v_link.id,
      'riskScore', v_row.risk_score, 'riskTier', v_row.risk_tier, 'unevidencedCount', cardinality(v_row.unevidenced)));

  RETURN jsonb_build_object('status', 'submitted', 'submittedAt', v_row.submitted_at, 'declaredAt', v_row.declared_at)
    || app.vendor_link_header(v_link);
END;
$$;


-- ===========================================================================
-- (6) Grants + RLS (D-019)
-- ===========================================================================

REVOKE ALL ON public.vendor_assessment_links, public.vendor_link_documents FROM anon, authenticated;
-- Members see who a link went to and its state — never a hash.
GRANT SELECT (id, organization_id, assessment_id, respondent_name, respondent_email, expires_at, codes_sent, wrong_codes,
              confirmed_at, submitted_at, revoked_at, revoked_by, created_by, created_at)
  ON public.vendor_assessment_links TO authenticated;
GRANT SELECT ON public.vendor_link_documents TO authenticated;

ALTER TABLE public.vendor_assessment_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_link_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY vendor_assessment_links_select_member ON public.vendor_assessment_links
  FOR SELECT TO authenticated
  USING (organization_id IN (SELECT app.current_user_organization_ids()));
CREATE POLICY vendor_link_documents_select_member ON public.vendor_link_documents
  FOR SELECT TO authenticated
  USING (organization_id IN (SELECT app.current_user_organization_ids()));

REVOKE ALL ON FUNCTION public.vendor_link_view(text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.vendor_link_send_code(text, text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.vendor_link_confirm(text, text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.vendor_link_save(text, text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.vendor_link_add_document(text, text, uuid, text, text, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.vendor_link_attach_document(text, text, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.vendor_link_submit(text, text, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.vendor_link_view(text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.vendor_link_send_code(text, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.vendor_link_confirm(text, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.vendor_link_save(text, text, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.vendor_link_add_document(text, text, uuid, text, text, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.vendor_link_attach_document(text, text, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.vendor_link_submit(text, text, text, text) TO service_role;


-- ===========================================================================
-- (7) Apply-time assertions
-- ===========================================================================

DO $$
DECLARE
  v_fn text;
BEGIN
  ASSERT app.exposure_model_version() = '1.4.0', 'Stage 4b changes no model rule';
  ASSERT (SELECT row(l.*)::text FROM app.vendor_link_limits() l) = '(14,10)', 'the link limits as approved';
  FOREACH v_fn IN ARRAY ARRAY[
    'public.vendor_link_view(text, text)',
    'public.vendor_link_send_code(text, text, text)',
    'public.vendor_link_confirm(text, text, text)',
    'public.vendor_link_save(text, text, jsonb)',
    'public.vendor_link_add_document(text, text, uuid, text, text, integer)',
    'public.vendor_link_attach_document(text, text, uuid)',
    'public.vendor_link_submit(text, text, text, text)'] LOOP
    ASSERT NOT has_function_privilege('anon', v_fn, 'EXECUTE'), v_fn || ': anon may not execute it';
    ASSERT NOT has_function_privilege('authenticated', v_fn, 'EXECUTE'), v_fn || ': no signed-in user may execute it';
    ASSERT has_function_privilege('service_role', v_fn, 'EXECUTE'), v_fn || ': the server may';
  END LOOP;
  FOREACH v_fn IN ARRAY ARRAY['public.send_vendor_link(uuid, uuid, text, text, text)', 'public.revoke_vendor_link(uuid, uuid)'] LOOP
    ASSERT NOT has_function_privilege('anon', v_fn, 'EXECUTE'), v_fn || ': anon may not execute it';
    ASSERT has_function_privilege('authenticated', v_fn, 'EXECUTE'), v_fn || ': a signed-in user may (it checks the permission itself)';
  END LOOP;
  ASSERT has_function_privilege('authenticated', 'public.review_vendor_assessment(uuid, uuid, text, text, date)', 'EXECUTE'),
    'the replaced staff functions keep their grants';
  -- No user reads a hash; nobody writes the link tables but the functions.
  ASSERT NOT has_column_privilege('authenticated', 'public.vendor_assessment_links', 'token_hash', 'SELECT'), 'no token hash';
  ASSERT NOT has_column_privilege('authenticated', 'public.vendor_assessment_links', 'code_hash', 'SELECT'), 'no code hash';
  ASSERT NOT has_column_privilege('authenticated', 'public.vendor_assessment_links', 'session_hash', 'SELECT'), 'no session hash';
  ASSERT has_column_privilege('authenticated', 'public.vendor_assessment_links', 'respondent_email', 'SELECT'), 'who it went to';
  FOREACH v_fn IN ARRAY ARRAY['INSERT', 'UPDATE', 'DELETE'] LOOP
    ASSERT NOT has_table_privilege('authenticated', 'public.vendor_assessment_links', v_fn), 'links: no ' || v_fn;
    ASSERT NOT has_table_privilege('authenticated', 'public.vendor_link_documents', v_fn), 'link documents: no ' || v_fn;
  END LOOP;
  ASSERT NOT has_table_privilege('anon', 'public.vendor_assessment_links', 'SELECT'), 'anon reads nothing';
  -- Every assessment on record is the staff's, and declares nothing.
  ASSERT NOT EXISTS (SELECT 1 FROM public.vendor_assessments WHERE source <> 'staff' OR declared_at IS NOT NULL), 'no vendor source yet';
END;
$$;
