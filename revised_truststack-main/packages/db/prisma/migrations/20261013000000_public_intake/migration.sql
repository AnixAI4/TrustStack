-- Slice 10, Stage 3a — public intake: the organisation's public address, its
-- published Rule 9 contact, rate limits in the database, emailed one-time
-- codes, and the public rights and grievance forms (SLICE_10 §7a; D-084).
-- No model change: exposure stays 1.2.0 (3b carries 1.3.0).
--
-- DPDP anchoring (the Act and the Gazette text, G.S.R. 846(E)):
--   * Rule 14(1)–(2): the fiduciary publishes on its website or app the means
--     by which a Data Principal makes a request, and the identifiers needed.
--   * Rule 14(3) / s.13(2): ninety days "from the date of its receipt" — an
--     online request is received the day it is SUBMITTED, in India, not the
--     day its email code is entered (Aniket, 2026-10-13, D-084).
--   * s.8(9), Rule 9: the business contact information of the DPO, or of a
--     person able to answer on the fiduciary's behalf, is published and named
--     in every response.
--
-- What is enforced HERE, not only in the application:
--   * An organisation with no `public_slug` has no public surface. An unknown
--     slug and a tenant without one answer the SAME "not found" (D-084), and
--     a slug needs the Rule 9 contact: intake is closed until it is set.
--   * The public writer is FOUR functions, SECURITY DEFINER, executable by
--     `service_role` ONLY — never `anon`. The anon key is public by design:
--     a function `anon` may execute can be called straight from PostgREST,
--     past the route, with a code the caller chose and a client key the
--     caller made up — no email proof and no per-address limit. Only the
--     server, which emails the code and hashes the client address, may call
--     them. `anon` holds nothing in this migration (CI fails on any anon
--     table grant).
--   * The limits are rows, not memory (Vercel functions share none):
--     `intake_attempts` keyed by organisation, form, a keyed hash of the
--     client address (the route's HMAC — never the address) and a hash of
--     the email address. A code proves control of the email address, NOT
--     identity under Rule 14: the Stage 2 identity check still gates
--     fulfilment (D-083.6).
--   * An unconfirmed submission is held apart in `intake_submissions` and
--     never enters the register. Only its code's HASH is stored; ten minutes,
--     single use, five wrong entries per submission. It expires after
--     24 hours (Slice 13's job purges it).
--   * On confirmation the register row is created by the database — code,
--     respond-by and status derived as for a staff entry — with
--     `channel = 'web_form'`, no `created_by`, and ONE audit row naming the
--     public intake. Personal data never reaches the audit log.
--
-- Additive: five nullable/defaulted columns, two new tables nobody may read,
-- four new functions, one replaced guard. Nothing a live user holds is revoked.
--
-- Layout: (1) organizations: the public address and the Rule 9 contact;
-- (2) intake tables; (3) limits and helpers; (4) the four functions;
-- (5) grants + RLS; (6) apply-time assertions.


-- ===========================================================================
-- (1) organizations — the public address and the Rule 9 contact
-- ===========================================================================

ALTER TABLE public.organizations
  ADD COLUMN public_slug text,
  ADD COLUMN public_contact_name text,
  ADD COLUMN public_contact_email text,
  ADD COLUMN public_contact_phone text,
  ADD COLUMN public_contact_is_dpo boolean NOT NULL DEFAULT false;

-- One address, one organisation. Lower-case only, so it is unique as typed.
CREATE UNIQUE INDEX organizations_public_slug_key ON public.organizations (public_slug);

ALTER TABLE public.organizations
  -- 3–63 characters: lower-case letters, digits and inner hyphens (core PUBLIC_SLUG_PATTERN).
  ADD CONSTRAINT organizations_public_slug_format
    CHECK (public_slug IS NULL OR public_slug ~ '^[a-z0-9](?:[a-z0-9-]{1,61}[a-z0-9])$'),
  ADD CONSTRAINT organizations_public_contact_lengths CHECK (
    (public_contact_name IS NULL OR (btrim(public_contact_name) <> '' AND char_length(public_contact_name) <= 200))
    AND (public_contact_email IS NULL OR char_length(public_contact_email) <= 320)
    AND (public_contact_phone IS NULL OR (btrim(public_contact_phone) <> '' AND char_length(public_contact_phone) <= 40))),
  ADD CONSTRAINT organizations_public_contact_email_shape
    CHECK (public_contact_email IS NULL OR public_contact_email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  -- Rule 9: no public page without the contact it must name. Name and email
  -- together, or neither; the phone is optional.
  ADD CONSTRAINT organizations_public_contact_whole
    CHECK ((public_contact_name IS NULL) = (public_contact_email IS NULL)),
  ADD CONSTRAINT organizations_public_slug_needs_contact
    CHECK (public_slug IS NULL OR public_contact_name IS NOT NULL);

GRANT UPDATE (public_slug, public_contact_name, public_contact_email, public_contact_phone, public_contact_is_dpo)
  ON public.organizations TO authenticated;

-- The guard, from its Slice 9 body, with the public columns: `organization.update`
-- only, like the profile — a DPDP Programme Owner may edit the scope but may
-- not open, move or close the organisation's public pages.
CREATE OR REPLACE FUNCTION app.guard_organization_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF app.current_user_id() IS NULL THEN
    RETURN NEW; -- tooling
  END IF;
  IF (NEW.name, NEW.legal_name, NEW.website, NEW.headquarters_city, NEW.employee_count)
       IS DISTINCT FROM (OLD.name, OLD.legal_name, OLD.website, OLD.headquarters_city, OLD.employee_count)
     AND NOT app.has_permission(OLD.id, 'organization.update') THEN
    RAISE EXCEPTION 'You do not have permission to edit the organisation profile.' USING ERRCODE = 'TS403';
  END IF;
  IF (NEW.industry_code, NEW.data_principal_count_estimate)
       IS DISTINCT FROM (OLD.industry_code, OLD.data_principal_count_estimate)
     AND NOT app.has_permission(OLD.id, 'scope.write') THEN
    RAISE EXCEPTION 'You do not have permission to edit the scope.' USING ERRCODE = 'TS403';
  END IF;
  -- Slice 9: the SDF notification (D-028, SLICE_09 §4.4).
  IF (NEW.sdf_notified_on, NEW.sdf_notification_ref)
       IS DISTINCT FROM (OLD.sdf_notified_on, OLD.sdf_notification_ref)
     AND NOT app.has_permission(OLD.id, 'organization.update') THEN
    RAISE EXCEPTION 'You do not have permission to record a Significant Data Fiduciary notification.' USING ERRCODE = 'TS403';
  END IF;
  -- Slice 10 Stage 3a: the public address and the Rule 9 contact.
  IF (NEW.public_slug, NEW.public_contact_name, NEW.public_contact_email, NEW.public_contact_phone, NEW.public_contact_is_dpo)
       IS DISTINCT FROM (OLD.public_slug, OLD.public_contact_name, OLD.public_contact_email, OLD.public_contact_phone, OLD.public_contact_is_dpo)
     AND NOT app.has_permission(OLD.id, 'organization.update') THEN
    RAISE EXCEPTION 'You do not have permission to change the organisation''s public pages.' USING ERRCODE = 'TS403';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION app.guard_organization_update() FROM PUBLIC;

-- Audited by the existing `organizations_audit` trigger: the changed column
-- NAMES, never the contact's name, email or phone.


-- ===========================================================================
-- (2) Intake tables — no user, and not `anon`, may read or write either
-- ===========================================================================

-- CreateTable — a submission waiting for its email code. NOT the register.
CREATE TABLE "intake_submissions" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "kind" TEXT NOT NULL,
    "requester_name" TEXT NOT NULL,
    "requester_email" TEXT NOT NULL,
    "requester_phone" TEXT,
    "requester_capacity" TEXT NOT NULL DEFAULT 'self',
    "principal_identifier" TEXT,
    "summary" TEXT NOT NULL,
    "related_request_code" TEXT,
    "nominee_name" TEXT,
    "nominee_contact" TEXT,
    "nominee_relationship" TEXT,
    "submitted_on" DATE NOT NULL,
    "code_hash" TEXT NOT NULL,
    "code_expires_at" TIMESTAMPTZ(6) NOT NULL,
    "codes_sent" INTEGER NOT NULL DEFAULT 1,
    "wrong_codes" INTEGER NOT NULL DEFAULT 0,
    "confirmed_at" TIMESTAMPTZ(6),
    "rights_request_id" UUID,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "intake_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "intake_submissions_organization_id_idx" ON "intake_submissions"("organization_id");

-- CreateIndex — the purge (Slice 13) reads by expiry.
CREATE INDEX "intake_submissions_expires_at_idx" ON "intake_submissions"("expires_at");

-- AddForeignKey
ALTER TABLE "intake_submissions" ADD CONSTRAINT "intake_submissions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey — composite: a submission becomes a request of its own organisation only.
ALTER TABLE "intake_submissions" ADD CONSTRAINT "intake_submissions_organization_id_rights_request_id_fkey" FOREIGN KEY ("organization_id", "rights_request_id") REFERENCES "rights_requests"("organization_id", "id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- CreateTable — one row per counted event: a submission or a code sent.
CREATE TABLE "intake_attempts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "surface" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "client_hash" TEXT NOT NULL,
    "email_hash" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "intake_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex — the two windows the limits read.
CREATE INDEX "intake_attempts_client_idx" ON "intake_attempts"("organization_id", "surface", "client_hash", "created_at");
CREATE INDEX "intake_attempts_email_idx" ON "intake_attempts"("email_hash", "event", "created_at");

-- AddForeignKey
ALTER TABLE "intake_attempts" ADD CONSTRAINT "intake_attempts_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE public.intake_submissions
  -- What the register would accept (the rights_requests CHECKs), with the
  -- email REQUIRED: it is where the code goes.
  ADD CONSTRAINT intake_submissions_kind_check CHECK (kind = ANY (app.rights_kinds())),
  ADD CONSTRAINT intake_submissions_capacity_check CHECK (requester_capacity IN ('self', 'nominee', 'guardian')),
  ADD CONSTRAINT intake_submissions_text_lengths CHECK (
    btrim(requester_name) <> '' AND char_length(requester_name) <= 200
    AND btrim(summary) <> '' AND char_length(summary) <= 4000
    AND char_length(requester_email) <= 320 AND char_length(requester_phone) <= 40
    AND char_length(principal_identifier) <= 200
    AND char_length(nominee_name) <= 200 AND char_length(nominee_contact) <= 500 AND char_length(nominee_relationship) <= 200
    AND char_length(related_request_code) <= 40),
  ADD CONSTRAINT intake_submissions_email_shape CHECK (requester_email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  ADD CONSTRAINT intake_submissions_nominee CHECK (
    CASE WHEN kind = 'nomination'
         THEN nominee_name IS NOT NULL AND btrim(nominee_name) <> ''
         ELSE nominee_name IS NULL AND nominee_contact IS NULL AND nominee_relationship IS NULL END),
  -- Only a grievance names an earlier request.
  ADD CONSTRAINT intake_submissions_related_is_grievance CHECK (related_request_code IS NULL OR kind = 'grievance'),
  ADD CONSTRAINT intake_submissions_code_hash_shape CHECK (code_hash ~ '^[0-9a-f]{64}$'),
  ADD CONSTRAINT intake_submissions_counts CHECK (codes_sent >= 1 AND wrong_codes >= 0),
  -- Confirmed exactly when it became a request.
  ADD CONSTRAINT intake_submissions_confirmed_whole CHECK ((confirmed_at IS NULL) = (rights_request_id IS NULL));

ALTER TABLE public.intake_attempts
  ADD CONSTRAINT intake_attempts_surface_check CHECK (surface IN ('rights', 'grievance')),
  ADD CONSTRAINT intake_attempts_event_check CHECK (event IN ('submission', 'code_sent')),
  ADD CONSTRAINT intake_attempts_hash_shape CHECK (client_hash ~ '^[0-9a-f]{64}$' AND email_hash ~ '^[0-9a-f]{64}$');


-- ===========================================================================
-- (3) Limits and helpers (mirror packages/core/src/intake.ts INTAKE_LIMITS)
-- ===========================================================================

CREATE OR REPLACE FUNCTION app.intake_limits()
RETURNS TABLE (
  submissions_per_hour integer,
  codes_per_hour integer,
  codes_per_day integer,
  wrong_codes integer,
  code_minutes integer,
  submission_hours integer
)
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = ''
AS $$
  -- 5 submissions an hour per client address, per organisation and form ·
  -- 3 codes an hour and 10 a day per email address · 5 wrong entries per
  -- submission · a code lives 10 minutes · a submission 24 hours.
  SELECT 5, 3, 10, 5, 10, 24;
$$;

-- The email address, normalised and hashed: the limit counts an address
-- without the attempts table holding it.
CREATE OR REPLACE FUNCTION app.intake_email_hash(p_email text)
RETURNS text
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = ''
AS $$
  SELECT encode(extensions.digest(lower(btrim(p_email)), 'sha256'), 'hex');
$$;

-- The organisation behind a public address — or nothing. One answer for an
-- unknown slug, a tenant without public pages and a deleted tenant.
CREATE OR REPLACE FUNCTION app.intake_organization(p_slug text)
RETURNS public.organizations
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT o.*
  FROM public.organizations o
  WHERE p_slug IS NOT NULL
    AND o.public_slug = p_slug
    AND o.deleted_at IS NULL
    AND o.public_contact_name IS NOT NULL;
$$;

-- What a public page shows, and every email names (Rule 9).
CREATE OR REPLACE FUNCTION app.intake_profile_json(p_org public.organizations)
RETURNS jsonb
LANGUAGE sql
STABLE
SET search_path = ''
AS $$
  SELECT jsonb_build_object(
    'name', p_org.name,
    'legalName', p_org.legal_name,
    'slug', p_org.public_slug,
    'contact', jsonb_build_object(
      'name', p_org.public_contact_name,
      'email', p_org.public_contact_email,
      'phone', p_org.public_contact_phone,
      'isDpo', p_org.public_contact_is_dpo));
$$;

REVOKE ALL ON FUNCTION app.intake_limits(), app.intake_email_hash(text), app.intake_organization(text),
  app.intake_profile_json(public.organizations) FROM PUBLIC;


-- ===========================================================================
-- (4) The public writer — four functions, `service_role` only
-- ===========================================================================

-- (a) The public page's header: the organisation and its Rule 9 contact, or null.
CREATE OR REPLACE FUNCTION public.intake_profile(p_slug text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_org public.organizations;
BEGIN
  v_org := app.intake_organization(p_slug);
  IF v_org.id IS NULL THEN
    RETURN NULL;
  END IF;
  RETURN app.intake_profile_json(v_org);
END;
$$;

-- (b) A submission: checked, counted against the limits, and held with its
-- code's hash until the person enters the code. Never a register row.
CREATE OR REPLACE FUNCTION public.intake_begin(
  p_slug text,
  p_surface text,
  p_submission_id uuid,
  p_client_hash text,
  p_code_hash text,
  p_kind text,
  p_requester_name text,
  p_requester_email text,
  p_requester_phone text,
  p_requester_capacity text,
  p_principal_identifier text,
  p_summary text,
  p_related_request_code text,
  p_nominee_name text,
  p_nominee_contact text,
  p_nominee_relationship text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_org public.organizations;
  v_l record;
  v_email text := lower(btrim(p_requester_email));
  v_email_hash text;
  v_today date := (now() AT TIME ZONE 'Asia/Kolkata')::date;
  v_code_expires timestamptz;
BEGIN
  v_org := app.intake_organization(p_slug);
  IF v_org.id IS NULL THEN
    RETURN jsonb_build_object('status', 'not_found');
  END IF;
  IF p_surface NOT IN ('rights', 'grievance') THEN
    RAISE EXCEPTION 'Unknown form.' USING ERRCODE = 'TS422';
  END IF;
  -- The rights form takes the six rights (s.11, s.12, s.14); the grievance form takes a grievance (s.13).
  IF (p_surface = 'grievance') <> (p_kind = 'grievance') OR NOT (p_kind = ANY (app.rights_kinds())) THEN
    RAISE EXCEPTION 'That kind of request does not belong on this form.' USING ERRCODE = 'TS422';
  END IF;
  IF p_client_hash IS NULL OR p_client_hash !~ '^[0-9a-f]{64}$' THEN
    RAISE EXCEPTION 'Missing client key.' USING ERRCODE = 'TS422';
  END IF;
  IF v_email IS NULL OR v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' THEN
    RAISE EXCEPTION 'Enter a valid email address.' USING ERRCODE = 'TS422';
  END IF;
  v_email_hash := app.intake_email_hash(v_email);
  SELECT * INTO v_l FROM app.intake_limits();

  -- Serialise the two counters this submission reads, so parallel requests
  -- cannot all pass the same count.
  PERFORM pg_advisory_xact_lock(hashtextextended('intake_client:' || v_org.id::text || ':' || p_surface || ':' || p_client_hash, 0));
  PERFORM pg_advisory_xact_lock(hashtextextended('intake_email:' || v_email_hash, 0));

  IF (SELECT count(*) FROM public.intake_attempts a
      WHERE a.organization_id = v_org.id AND a.surface = p_surface AND a.client_hash = p_client_hash
        AND a.event = 'submission' AND a.created_at > now() - interval '1 hour') >= v_l.submissions_per_hour THEN
    RETURN jsonb_build_object('status', 'rate_limited', 'limit', 'client');
  END IF;
  IF (SELECT count(*) FROM public.intake_attempts a
      WHERE a.email_hash = v_email_hash AND a.event = 'code_sent' AND a.created_at > now() - interval '1 hour') >= v_l.codes_per_hour
     OR (SELECT count(*) FROM public.intake_attempts a
         WHERE a.email_hash = v_email_hash AND a.event = 'code_sent' AND a.created_at > now() - interval '1 day') >= v_l.codes_per_day THEN
    RETURN jsonb_build_object('status', 'rate_limited', 'limit', 'email');
  END IF;

  v_code_expires := now() + make_interval(mins => v_l.code_minutes);
  INSERT INTO public.intake_submissions (
    id, organization_id, kind, requester_name, requester_email, requester_phone, requester_capacity,
    principal_identifier, summary, related_request_code, nominee_name, nominee_contact, nominee_relationship,
    submitted_on, code_hash, code_expires_at, expires_at)
  VALUES (
    p_submission_id, v_org.id, p_kind, btrim(p_requester_name), v_email, NULLIF(btrim(p_requester_phone), ''),
    COALESCE(p_requester_capacity, 'self'), NULLIF(btrim(p_principal_identifier), ''), btrim(p_summary),
    NULLIF(upper(btrim(p_related_request_code)), ''), NULLIF(btrim(p_nominee_name), ''),
    NULLIF(btrim(p_nominee_contact), ''), NULLIF(btrim(p_nominee_relationship), ''),
    v_today, p_code_hash, v_code_expires, now() + make_interval(hours => v_l.submission_hours));

  INSERT INTO public.intake_attempts (organization_id, surface, event, client_hash, email_hash)
  VALUES (v_org.id, p_surface, 'submission', p_client_hash, v_email_hash),
         (v_org.id, p_surface, 'code_sent', p_client_hash, v_email_hash);

  RETURN jsonb_build_object(
    'status', 'pending',
    'submissionId', p_submission_id,
    'submittedOn', v_today,
    'codeExpiresAt', v_code_expires,
    'organization', app.intake_profile_json(v_org));
END;
$$;

-- (c) A new code for a waiting submission (the old one stops working). The
-- email limits apply; the wrong-entry count does not reset.
CREATE OR REPLACE FUNCTION public.intake_resend(
  p_slug text,
  p_submission_id uuid,
  p_client_hash text,
  p_code_hash text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_org public.organizations;
  v_s public.intake_submissions;
  v_l record;
  v_email_hash text;
  v_code_expires timestamptz;
BEGIN
  v_org := app.intake_organization(p_slug);
  IF v_org.id IS NULL THEN
    RETURN jsonb_build_object('status', 'not_found');
  END IF;
  IF p_client_hash IS NULL OR p_client_hash !~ '^[0-9a-f]{64}$' THEN
    RAISE EXCEPTION 'Missing client key.' USING ERRCODE = 'TS422';
  END IF;
  SELECT * INTO v_s FROM public.intake_submissions s
  WHERE s.id = p_submission_id AND s.organization_id = v_org.id
  FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('status', 'not_found');
  END IF;
  IF v_s.confirmed_at IS NOT NULL THEN
    RETURN jsonb_build_object('status', 'already_confirmed');
  END IF;
  SELECT * INTO v_l FROM app.intake_limits();
  IF v_s.expires_at <= now() THEN
    RETURN jsonb_build_object('status', 'expired');
  END IF;
  IF v_s.wrong_codes >= v_l.wrong_codes THEN
    RETURN jsonb_build_object('status', 'locked');
  END IF;

  v_email_hash := app.intake_email_hash(v_s.requester_email);
  PERFORM pg_advisory_xact_lock(hashtextextended('intake_email:' || v_email_hash, 0));
  IF (SELECT count(*) FROM public.intake_attempts a
      WHERE a.email_hash = v_email_hash AND a.event = 'code_sent' AND a.created_at > now() - interval '1 hour') >= v_l.codes_per_hour
     OR (SELECT count(*) FROM public.intake_attempts a
         WHERE a.email_hash = v_email_hash AND a.event = 'code_sent' AND a.created_at > now() - interval '1 day') >= v_l.codes_per_day THEN
    RETURN jsonb_build_object('status', 'rate_limited', 'limit', 'email');
  END IF;

  v_code_expires := now() + make_interval(mins => v_l.code_minutes);
  UPDATE public.intake_submissions
  SET code_hash = p_code_hash, code_expires_at = v_code_expires, codes_sent = codes_sent + 1
  WHERE id = v_s.id;
  INSERT INTO public.intake_attempts (organization_id, surface, event, client_hash, email_hash)
  VALUES (v_org.id, CASE WHEN v_s.kind = 'grievance' THEN 'grievance' ELSE 'rights' END, 'code_sent', p_client_hash, v_email_hash);

  RETURN jsonb_build_object(
    'status', 'sent',
    'email', v_s.requester_email,
    'name', v_s.requester_name,
    'kind', v_s.kind,
    'codeExpiresAt', v_code_expires,
    'organization', app.intake_profile_json(v_org));
END;
$$;

-- (d) The code entered: the submission becomes a request in the register,
-- received the day it was SUBMITTED (D-084). A wrong code is counted and
-- answered, not raised, so the count survives.
CREATE OR REPLACE FUNCTION public.intake_confirm(
  p_slug text,
  p_submission_id uuid,
  p_code_hash text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_org public.organizations;
  v_s public.intake_submissions;
  v_l record;
  v_related uuid;
  v_summary text;
  v_request public.rights_requests;
BEGIN
  v_org := app.intake_organization(p_slug);
  IF v_org.id IS NULL THEN
    RETURN jsonb_build_object('status', 'not_found');
  END IF;
  SELECT * INTO v_s FROM public.intake_submissions s
  WHERE s.id = p_submission_id AND s.organization_id = v_org.id
  FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('status', 'not_found');
  END IF;
  -- Single use: a code that has made a request never makes another.
  IF v_s.confirmed_at IS NOT NULL THEN
    RETURN jsonb_build_object('status', 'already_confirmed');
  END IF;
  SELECT * INTO v_l FROM app.intake_limits();
  IF v_s.expires_at <= now() THEN
    RETURN jsonb_build_object('status', 'expired');
  END IF;
  IF v_s.wrong_codes >= v_l.wrong_codes THEN
    RETURN jsonb_build_object('status', 'locked');
  END IF;
  IF v_s.code_expires_at <= now() THEN
    RETURN jsonb_build_object('status', 'code_expired');
  END IF;
  IF p_code_hash IS NULL OR p_code_hash <> v_s.code_hash THEN
    UPDATE public.intake_submissions SET wrong_codes = wrong_codes + 1 WHERE id = v_s.id;
    IF v_s.wrong_codes + 1 >= v_l.wrong_codes THEN
      RETURN jsonb_build_object('status', 'locked');
    END IF;
    RETURN jsonb_build_object('status', 'wrong_code', 'attemptsLeft', v_l.wrong_codes - v_s.wrong_codes - 1);
  END IF;

  -- A grievance may name an earlier request. It is linked only when that
  -- request is this organisation's AND was made from the same email address;
  -- otherwise the code is kept in the summary for staff. The answer is the
  -- same either way: nobody learns from this form whether a code exists.
  v_summary := v_s.summary;
  IF v_s.related_request_code IS NOT NULL THEN
    SELECT r.id INTO v_related
    FROM public.rights_requests r
    WHERE r.organization_id = v_org.id
      AND r.request_code = v_s.related_request_code
      AND r.kind <> 'grievance'
      AND lower(r.requester_email) = v_s.requester_email;
    IF v_related IS NULL THEN
      v_summary := left('Earlier request named on the form (not matched): ' || v_s.related_request_code || E'\n\n' || v_summary, 4000);
    END IF;
  END IF;

  -- The register's own trigger derives the code, the respond-by date and the
  -- status, exactly as for a staff entry. No user: created_by stays null.
  INSERT INTO public.rights_requests (
    organization_id, kind, received_on, channel, requester_name, requester_email, requester_phone,
    requester_capacity, principal_identifier, summary, related_request_id, nominee_name, nominee_contact,
    nominee_relationship)
  VALUES (
    v_org.id, v_s.kind, v_s.submitted_on, 'web_form', v_s.requester_name, v_s.requester_email, v_s.requester_phone,
    v_s.requester_capacity, v_s.principal_identifier, v_summary, v_related, v_s.nominee_name, v_s.nominee_contact,
    v_s.nominee_relationship)
  RETURNING * INTO v_request;

  UPDATE public.intake_submissions SET confirmed_at = now(), rights_request_id = v_request.id WHERE id = v_s.id;

  -- The register's audit trigger records users only; the public intake is
  -- recorded here, once, with the same fields and no personal data.
  INSERT INTO public.audit_logs (organization_id, user_id, event_type, entity_type, entity_id, description, metadata)
  VALUES (
    v_org.id, NULL, 'intake.rights_requests.insert', 'rights_requests', v_request.id,
    'Received through the public form',
    jsonb_strip_nulls(jsonb_build_object(
      'requestCode', v_request.request_code,
      'rightsKind', v_request.kind,
      'rightsStatus', v_request.status,
      'channel', v_request.channel,
      'receivedOn', v_request.received_on,
      'respondBy', v_request.respond_by,
      'relatedRequestId', v_request.related_request_id)));

  RETURN jsonb_build_object(
    'status', 'confirmed',
    'requestCode', v_request.request_code,
    'kind', v_request.kind,
    'receivedOn', v_request.received_on,
    'respondBy', v_request.respond_by,
    'email', v_request.requester_email,
    'name', v_request.requester_name,
    'organization', app.intake_profile_json(v_org));
END;
$$;


-- ===========================================================================
-- (5) Grants + RLS (D-019) — `anon` and `authenticated` get nothing
-- ===========================================================================

REVOKE ALL ON public.intake_submissions, public.intake_attempts FROM anon, authenticated, service_role;

ALTER TABLE public.intake_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intake_attempts ENABLE ROW LEVEL SECURITY;

-- Every public table carries a policy (CI). These say what the grants
-- already say: no user reads a pending submission or an attempt — not even a
-- member of the organisation. Only the four functions above touch them.
CREATE POLICY intake_submissions_no_user ON public.intake_submissions FOR SELECT TO authenticated USING (false);
CREATE POLICY intake_attempts_no_user ON public.intake_attempts FOR SELECT TO authenticated USING (false);

REVOKE ALL ON FUNCTION public.intake_profile(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.intake_begin(text, text, uuid, text, text, text, text, text, text, text, text, text, text, text, text, text)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.intake_resend(text, uuid, text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.intake_confirm(text, uuid, text) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.intake_profile(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.intake_begin(text, text, uuid, text, text, text, text, text, text, text, text, text, text, text, text, text)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.intake_resend(text, uuid, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.intake_confirm(text, uuid, text) TO service_role;


-- ===========================================================================
-- (6) Apply-time assertions
-- ===========================================================================

DO $$
DECLARE
  v_fn text;
BEGIN
  ASSERT app.exposure_model_version() = '1.2.0', 'Stage 3a changes no model rule';
  ASSERT (SELECT row(l.*)::text FROM app.intake_limits() l) = '(5,3,10,5,10,24)', 'the limits as approved';
  ASSERT 'mumbai-university' ~ '^[a-z0-9](?:[a-z0-9-]{1,61}[a-z0-9])$', 'a slug';
  ASSERT NOT ('-mu' ~ '^[a-z0-9](?:[a-z0-9-]{1,61}[a-z0-9])$') AND NOT ('MU' ~ '^[a-z0-9](?:[a-z0-9-]{1,61}[a-z0-9])$'),
    'not a slug';
  FOREACH v_fn IN ARRAY ARRAY[
    'public.intake_profile(text)',
    'public.intake_begin(text, text, uuid, text, text, text, text, text, text, text, text, text, text, text, text, text)',
    'public.intake_resend(text, uuid, text, text)',
    'public.intake_confirm(text, uuid, text)'] LOOP
    ASSERT NOT has_function_privilege('anon', v_fn, 'EXECUTE'), v_fn || ': anon may not execute it';
    ASSERT NOT has_function_privilege('authenticated', v_fn, 'EXECUTE'), v_fn || ': no signed-in user may execute it';
    ASSERT has_function_privilege('service_role', v_fn, 'EXECUTE'), v_fn || ': the server may';
  END LOOP;
  ASSERT NOT has_table_privilege('anon', 'public.intake_submissions', 'SELECT'), 'nobody reads a pending submission';
  ASSERT NOT has_table_privilege('authenticated', 'public.intake_attempts', 'SELECT'), 'nobody reads the attempts';
  -- No organisation has public pages until someone with organization.update opens them.
  ASSERT NOT EXISTS (SELECT 1 FROM public.organizations WHERE public_slug IS NOT NULL), 'no public pages yet';
END;
$$;
