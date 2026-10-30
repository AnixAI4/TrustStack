-- Slice 10, Stage 3b — the privacy notice, the consent widget, the consent
-- register, and exposure model 1.3.0 (SLICE_10 §6, §7a; D-079.6; D-084).
--
-- DPDP anchoring (the Act and the Gazette text, G.S.R. 846(E)):
--   * s.5, Rule 3: the notice is understandable on its own, in clear and plain
--     language; it itemises (b)(i) the personal data and (b)(ii) each specified
--     purpose with the goods or services provided or uses enabled; and (c)
--     gives the link and other means to withdraw consent (as easily as it was
--     given), exercise the rights, and complain to the Board.
--   * s.6: consent is specific, informed and unambiguous, by a clear
--     affirmative action — no purpose is ticked in advance, and there is no
--     "required" purpose; withdrawal is as easy as giving (s.6(4)).
--   * s.9(1), Rule 10: a parent's verifiable consent for a child, checked by
--     (1)(a) reliable details already held, (1)(b)(i) details given by the
--     individual, or (1)(b)(ii) a virtual token from an authorised entity;
--     Rule 12 and the Fourth Schedule exempt certain classes and purposes.
--     Rule 11: a lawful guardian's appointment by a court, a designated
--     authority or a local level committee.
--
-- What is enforced HERE, not only in the application:
--   * A PUBLISHED notice and a published widget version never change and are
--     never deleted: a correction is a new version. Versions are numbered by
--     the database. Publishing needs `consent.publish`.
--   * A widget version cites one published notice of its own organisation and
--     offers only purposes that notice states.
--   * A consent record is APPEND-ONLY — nobody, tooling included, updates one;
--     withdrawal is a new record. It holds a keyed hash of the identifier
--     (HMAC-SHA256 with a per-organisation salt nobody can read), never the
--     identifier. A record from the public widget never claims a verification:
--     only a person in the organisation records one.
--   * The public widget and the public notice page reach the database through
--     three SECURITY DEFINER functions that only `service_role` may execute,
--     as public intake does (D-086.1, D-087): `anon` holds nothing.
--   * The widget's limits are rows, not memory: 120 records an hour per client
--     address per organisation (a campus shares one address), 10 an hour per
--     principal.
--
-- The exposure model moves to 1.3.0 in this same migration — the head-3 row,
-- and consents given on behalf of a child or a ward bearing on whether head 3
-- applies — mirrored in packages/core/src/exposure.ts and held together by
-- tests/unit/exposure-mirror.test.ts and tests/rls/exposure-mirror.test.ts.
--
-- Additive: three permissions, four new tables, one view, new functions,
-- functions replaced in place, and `intake_attempts` WIDENED (a new surface
-- and event; every existing row still satisfies the new CHECKs). Nothing a
-- live user holds is revoked.
--
-- Layout: (1) permissions; (2) DDL; (3) vocabularies and row invariants;
-- (4) triggers; (5) the principal key and the staff functions; (6) the public
-- functions; (7) audit; (8) grants + RLS; (9) exposure model 1.3.0;
-- (10) apply-time assertions.


-- ===========================================================================
-- (1) Permissions — a matrix change is core + a migration in one PR (D-020)
-- ===========================================================================

INSERT INTO public.permissions (code, description) VALUES
  ('consent.read', 'Read the privacy notices, the consent widget''s versions and the consent register.'),
  ('consent.write', 'Draft a privacy notice or a widget version, and record a consent — including how a parent or guardian was verified.'),
  ('consent.publish', 'Publish a privacy notice or a widget version: the organisation''s public word to Data Principals.');

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM (VALUES ('super_admin'), ('consultant'), ('organization_admin'), ('executive_sponsor'), ('dpdp_owner'), ('department_owner'), ('legal_user'), ('it_security_user'), ('procurement_user'), ('auditor_reviewer')) AS g(role_code)
JOIN public.roles r ON r.code = g.role_code
JOIN public.permissions p ON p.code = 'consent.read';

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM (VALUES ('super_admin'), ('consultant'), ('organization_admin'), ('dpdp_owner'), ('department_owner'), ('legal_user'), ('it_security_user'), ('procurement_user')) AS g(role_code)
JOIN public.roles r ON r.code = g.role_code
JOIN public.permissions p ON p.code = 'consent.write';

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM (VALUES ('super_admin'), ('consultant'), ('organization_admin'), ('dpdp_owner'), ('legal_user')) AS g(role_code)
JOIN public.roles r ON r.code = g.role_code
JOIN public.permissions p ON p.code = 'consent.publish';


-- ===========================================================================
-- (2) DDL
-- ===========================================================================

-- CreateTable — one version of the privacy notice, in one language.
CREATE TABLE "privacy_notices" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'en',
    "version" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "purposes" JSONB NOT NULL DEFAULT '[]',
    "withdraw_means" TEXT,
    "rights_means" TEXT,
    "complaint_means" TEXT,
    "published_at" TIMESTAMPTZ(6),
    "published_by" UUID,
    "created_by" UUID,
    "updated_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "privacy_notices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "privacy_notices_organization_id_idx" ON "privacy_notices"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "privacy_notices_organization_id_id_key" ON "privacy_notices"("organization_id", "id");

-- CreateIndex — versions are numbered per organisation and language.
CREATE UNIQUE INDEX "privacy_notices_organization_id_language_version_key" ON "privacy_notices"("organization_id", "language", "version");

-- CreateIndex — one draft at a time per language.
CREATE UNIQUE INDEX "privacy_notices_one_draft" ON "privacy_notices"("organization_id", "language") WHERE status = 'draft';

-- AddForeignKey
ALTER TABLE "privacy_notices" ADD CONSTRAINT "privacy_notices_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "privacy_notices" ADD CONSTRAINT "privacy_notices_published_by_fkey" FOREIGN KEY ("published_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "privacy_notices" ADD CONSTRAINT "privacy_notices_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "privacy_notices" ADD CONSTRAINT "privacy_notices_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable — one version of the consent widget's configuration.
CREATE TABLE "consent_configs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "notice_id" UUID NOT NULL,
    "purposes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "languages" TEXT[] NOT NULL DEFAULT ARRAY['en', 'hi', 'mr']::TEXT[],
    "position" TEXT NOT NULL DEFAULT 'bottom_bar',
    "primary_color" TEXT NOT NULL DEFAULT '#1e3a8a',
    "published_at" TIMESTAMPTZ(6),
    "published_by" UUID,
    "created_by" UUID,
    "updated_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consent_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "consent_configs_organization_id_idx" ON "consent_configs"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "consent_configs_organization_id_id_key" ON "consent_configs"("organization_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "consent_configs_organization_id_version_key" ON "consent_configs"("organization_id", "version");

-- CreateIndex — one draft at a time.
CREATE UNIQUE INDEX "consent_configs_one_draft" ON "consent_configs"("organization_id") WHERE status = 'draft';

-- AddForeignKey
ALTER TABLE "consent_configs" ADD CONSTRAINT "consent_configs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey — composite: a widget version cites a notice of its own organisation only.
ALTER TABLE "consent_configs" ADD CONSTRAINT "consent_configs_organization_id_notice_id_fkey" FOREIGN KEY ("organization_id", "notice_id") REFERENCES "privacy_notices"("organization_id", "id") ON DELETE NO ACTION ON UPDATE CASCADE;
ALTER TABLE "consent_configs" ADD CONSTRAINT "consent_configs_published_by_fkey" FOREIGN KEY ("published_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "consent_configs" ADD CONSTRAINT "consent_configs_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "consent_configs" ADD CONSTRAINT "consent_configs_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable — the consent register: one row per choice a Data Principal made. Append-only.
CREATE TABLE "consent_records" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "config_id" UUID NOT NULL,
    "principal_key" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "purposes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "principal_kind" TEXT NOT NULL DEFAULT 'self',
    "verification_method" TEXT,
    "language" TEXT NOT NULL DEFAULT 'en',
    "source" TEXT NOT NULL,
    "reference" TEXT,
    "recorded_by" UUID,
    "recorded_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consent_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex — a principal's history, newest first; and the register by time.
CREATE INDEX "consent_records_principal_idx" ON "consent_records"("organization_id", "principal_key", "recorded_at" DESC);
CREATE INDEX "consent_records_organization_id_recorded_at_idx" ON "consent_records"("organization_id", "recorded_at" DESC);

-- AddForeignKey
ALTER TABLE "consent_records" ADD CONSTRAINT "consent_records_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey — composite: a record cites a widget version of its own organisation only.
ALTER TABLE "consent_records" ADD CONSTRAINT "consent_records_organization_id_config_id_fkey" FOREIGN KEY ("organization_id", "config_id") REFERENCES "consent_configs"("organization_id", "id") ON DELETE NO ACTION ON UPDATE CASCADE;
ALTER TABLE "consent_records" ADD CONSTRAINT "consent_records_recorded_by_fkey" FOREIGN KEY ("recorded_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable — each organisation's salt for the principal key. Nobody reads it.
CREATE TABLE "consent_salts" (
    "organization_id" UUID NOT NULL,
    "salt" BYTEA NOT NULL DEFAULT extensions.gen_random_bytes(32),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consent_salts_pkey" PRIMARY KEY ("organization_id")
);

-- AddForeignKey
ALTER TABLE "consent_salts" ADD CONSTRAINT "consent_salts_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable — the public widget's limit counts in the same table as public
-- intake's: a new surface and event, and no email address behind them.
ALTER TABLE public.intake_attempts ALTER COLUMN email_hash DROP NOT NULL;
ALTER TABLE public.intake_attempts
  DROP CONSTRAINT intake_attempts_surface_check,
  DROP CONSTRAINT intake_attempts_event_check,
  DROP CONSTRAINT intake_attempts_hash_shape;
ALTER TABLE public.intake_attempts
  ADD CONSTRAINT intake_attempts_surface_check CHECK (surface IN ('rights', 'grievance', 'consent')),
  ADD CONSTRAINT intake_attempts_event_check CHECK (event IN ('submission', 'code_sent', 'consent_record')),
  -- A consent record is counted on the consent surface only, and carries no email address.
  ADD CONSTRAINT intake_attempts_consent_pairs CHECK ((surface = 'consent') = (event = 'consent_record')),
  ADD CONSTRAINT intake_attempts_hash_shape CHECK (
    client_hash ~ '^[0-9a-f]{64}$'
    AND (event = 'consent_record') = (email_hash IS NULL)
    AND (email_hash IS NULL OR email_hash ~ '^[0-9a-f]{64}$'));


-- ===========================================================================
-- (3) Vocabularies (mirror packages/core/src/consent.ts) and row invariants
-- ===========================================================================

-- English and the Eighth Schedule's twenty-two (core CONSENT_LANGUAGES).
CREATE OR REPLACE FUNCTION app.consent_languages()
RETURNS text[]
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = ''
AS $$
  SELECT ARRAY['en', 'hi', 'mr', 'as', 'bn', 'brx', 'doi', 'gu', 'kn', 'ks', 'kok', 'mai',
               'ml', 'mni', 'ne', 'or', 'pa', 'sa', 'sat', 'sd', 'ta', 'te', 'ur']::text[];
$$;

CREATE OR REPLACE FUNCTION app.consent_actions()
RETURNS text[]
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = ''
AS $$
  SELECT ARRAY['given', 'refused', 'withdrawn']::text[];
$$;

CREATE OR REPLACE FUNCTION app.consent_principal_kinds()
RETURNS text[]
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = ''
AS $$
  SELECT ARRAY['self', 'child', 'guardian_ward']::text[];
$$;

-- core VERIFICATION_METHODS_FOR: Rule 10(1) and the Rule 12 exemption for a
-- child; Rule 11's three appointing bodies for a ward; nothing for oneself.
CREATE OR REPLACE FUNCTION app.consent_verification_fits(p_kind text, p_method text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = ''
AS $$
  SELECT p_method IS NULL
      OR (p_kind = 'child' AND p_method IN ('rule_10_1_a', 'rule_10_1_b_i', 'rule_10_1_b_ii', 'rule_12_exempt'))
      OR (p_kind = 'guardian_ward' AND p_method IN ('rule_11_court', 'rule_11_designated_authority', 'rule_11_local_committee'));
$$;

-- Purpose keys: core PURPOSE_KEY_PATTERN, at most twenty, each once.
CREATE OR REPLACE FUNCTION app.consent_purpose_keys_valid(p_keys text[])
RETURNS boolean
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = ''
AS $$
  SELECT cardinality(p_keys) <= 20
     AND NOT EXISTS (SELECT 1 FROM unnest(p_keys) k WHERE k IS NULL OR k !~ '^[a-z][a-z0-9_]{1,39}$')
     AND (SELECT count(DISTINCT k) FROM unnest(p_keys) k) = cardinality(p_keys);
$$;

-- A notice's purposes, as a DRAFT may hold them: the shape and the limits
-- (core NOTICE_LIMITS); text may still be blank.
CREATE OR REPLACE FUNCTION app.notice_purposes_shape(p jsonb)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
PARALLEL SAFE
SET search_path = ''
AS $$
DECLARE
  v_item jsonb;
  v_data jsonb;
  v_keys text[] := ARRAY[]::text[];
BEGIN
  IF jsonb_typeof(p) IS DISTINCT FROM 'array' OR jsonb_array_length(p) > 20 THEN
    RETURN false;
  END IF;
  FOR v_item IN SELECT value FROM jsonb_array_elements(p) LOOP
    IF jsonb_typeof(v_item) <> 'object'
       OR (SELECT count(*) FROM jsonb_object_keys(v_item) k WHERE k NOT IN ('key', 'title', 'uses', 'dataItems')) > 0
       OR jsonb_typeof(v_item -> 'key') IS DISTINCT FROM 'string'
       OR jsonb_typeof(v_item -> 'title') IS DISTINCT FROM 'string'
       OR jsonb_typeof(v_item -> 'uses') IS DISTINCT FROM 'string'
       OR jsonb_typeof(v_item -> 'dataItems') IS DISTINCT FROM 'array'
       OR char_length(v_item ->> 'title') > 200
       OR char_length(v_item ->> 'uses') > 2000
       OR jsonb_array_length(v_item -> 'dataItems') > 30 THEN
      RETURN false;
    END IF;
    FOR v_data IN SELECT value FROM jsonb_array_elements(v_item -> 'dataItems') LOOP
      IF jsonb_typeof(v_data) <> 'string' OR char_length(v_data #>> '{}') > 200 THEN
        RETURN false;
      END IF;
    END LOOP;
    v_keys := v_keys || (v_item ->> 'key');
  END LOOP;
  RETURN app.consent_purpose_keys_valid(v_keys);
END;
$$;

-- …and as a PUBLISHED notice must hold them (core `noticePurposeProblems`):
-- at least one purpose, each titled, saying what it provides or enables, and
-- itemising its personal data (Rule 3(b)).
CREATE OR REPLACE FUNCTION app.notice_purposes_complete(p jsonb)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = ''
AS $$
  SELECT app.notice_purposes_shape(p)
     AND jsonb_array_length(p) >= 1
     AND NOT EXISTS (
       SELECT 1 FROM jsonb_array_elements(p) i
       WHERE btrim(i ->> 'title') = '' OR btrim(i ->> 'uses') = '' OR jsonb_array_length(i -> 'dataItems') = 0
          OR EXISTS (SELECT 1 FROM jsonb_array_elements_text(i -> 'dataItems') d WHERE btrim(d) = ''));
$$;

-- The public widget's limits (mirror core CONSENT_LIMITS).
CREATE OR REPLACE FUNCTION app.consent_limits()
RETURNS TABLE (records_per_client_hour integer, records_per_principal_hour integer)
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = ''
AS $$
  SELECT 120, 10;
$$;

REVOKE ALL ON FUNCTION app.consent_languages(), app.consent_actions(), app.consent_principal_kinds(),
  app.consent_verification_fits(text, text), app.consent_purpose_keys_valid(text[]), app.notice_purposes_shape(jsonb),
  app.notice_purposes_complete(jsonb), app.consent_limits() FROM PUBLIC;
-- The CHECKs below run as the writing user, so they need these.
GRANT EXECUTE ON FUNCTION app.consent_languages(), app.consent_actions(), app.consent_principal_kinds(),
  app.consent_verification_fits(text, text), app.consent_purpose_keys_valid(text[]), app.notice_purposes_shape(jsonb),
  app.notice_purposes_complete(jsonb) TO authenticated;

ALTER TABLE public.privacy_notices
  ADD CONSTRAINT privacy_notices_language_check CHECK (language = ANY (app.consent_languages())),
  ADD CONSTRAINT privacy_notices_status_check CHECK (status IN ('draft', 'published')),
  ADD CONSTRAINT privacy_notices_version_check CHECK (version >= 1),
  ADD CONSTRAINT privacy_notices_text_lengths CHECK (
    btrim(title) <> '' AND char_length(title) <= 200
    AND char_length(summary) <= 4000
    AND char_length(withdraw_means) <= 2000 AND char_length(rights_means) <= 2000 AND char_length(complaint_means) <= 2000),
  ADD CONSTRAINT privacy_notices_purposes_shape CHECK (app.notice_purposes_shape(purposes)),
  -- Rule 3(b): a published notice itemises the data and states each purpose and what it enables.
  ADD CONSTRAINT privacy_notices_published_complete CHECK (status = 'draft' OR app.notice_purposes_complete(purposes)),
  ADD CONSTRAINT privacy_notices_published_stamp CHECK ((status = 'published') = (published_at IS NOT NULL));

ALTER TABLE public.consent_configs
  ADD CONSTRAINT consent_configs_status_check CHECK (status IN ('draft', 'published')),
  ADD CONSTRAINT consent_configs_version_check CHECK (version >= 1),
  ADD CONSTRAINT consent_configs_position_check CHECK (position IN ('bottom_bar', 'centre_modal', 'corner')),
  ADD CONSTRAINT consent_configs_color_check CHECK (primary_color ~ '^#[0-9a-f]{6}$'),
  -- English is always offered: every untranslated language falls back to it.
  ADD CONSTRAINT consent_configs_languages_check CHECK (
    languages <@ app.consent_languages() AND 'en' = ANY (languages) AND cardinality(languages) <= 23),
  ADD CONSTRAINT consent_configs_purposes_check CHECK (
    app.consent_purpose_keys_valid(purposes) AND (status = 'draft' OR cardinality(purposes) >= 1)),
  ADD CONSTRAINT consent_configs_published_stamp CHECK ((status = 'published') = (published_at IS NOT NULL));

ALTER TABLE public.consent_records
  ADD CONSTRAINT consent_records_action_check CHECK (action = ANY (app.consent_actions())),
  ADD CONSTRAINT consent_records_kind_check CHECK (principal_kind = ANY (app.consent_principal_kinds())),
  ADD CONSTRAINT consent_records_language_check CHECK (language = ANY (app.consent_languages())),
  ADD CONSTRAINT consent_records_source_check CHECK (source IN ('widget', 'staff')),
  ADD CONSTRAINT consent_records_key_shape CHECK (principal_key ~ '^[0-9a-f]{64}$'),
  ADD CONSTRAINT consent_records_purposes_check CHECK (app.consent_purpose_keys_valid(purposes)),
  -- Given names its purposes; a refusal or a withdrawal names none.
  ADD CONSTRAINT consent_records_given_has_purposes CHECK ((action = 'given') = (cardinality(purposes) > 0)),
  ADD CONSTRAINT consent_records_verification_fits CHECK (app.consent_verification_fits(principal_kind, verification_method)),
  -- The public widget never claims a verification, and no person recorded it.
  ADD CONSTRAINT consent_records_widget_unverified CHECK (source = 'staff' OR (verification_method IS NULL AND recorded_by IS NULL AND reference IS NULL)),
  ADD CONSTRAINT consent_records_reference_length CHECK (reference IS NULL OR (btrim(reference) <> '' AND char_length(reference) <= 200));

CREATE TRIGGER privacy_notices_touch_updated_at BEFORE UPDATE ON public.privacy_notices
  FOR EACH ROW EXECUTE FUNCTION app.touch_updated_at();
CREATE TRIGGER consent_configs_touch_updated_at BEFORE UPDATE ON public.consent_configs
  FOR EACH ROW EXECUTE FUNCTION app.touch_updated_at();


-- ===========================================================================
-- (4) Triggers — versions, publishing, immutability
-- ===========================================================================
-- With a user's JWT every rule applies. Tooling (migrations, the seed) has no
-- JWT: it may set a version and stamps, but a published row never changes for
-- anyone, and a consent record is never updated by anyone.

CREATE OR REPLACE FUNCTION app.privacy_notice_before_write()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_actor uuid := app.current_user_id();
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.status = 'published' AND v_actor IS NOT NULL THEN
      RAISE EXCEPTION 'A published notice is never deleted — it stays readable as an earlier version.' USING ERRCODE = 'TS409';
    END IF;
    IF v_actor IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.consent_configs c WHERE c.organization_id = OLD.organization_id AND c.notice_id = OLD.id) THEN
      RAISE EXCEPTION 'A widget version cites this draft — change that first.' USING ERRCODE = 'TS409';
    END IF;
    RETURN OLD;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    -- A published version never changes — for anyone. A no-op save is no change.
    IF OLD.status = 'published' THEN
      IF (NEW.organization_id, NEW.language, NEW.version, NEW.status, NEW.title, NEW.summary, NEW.purposes, NEW.withdraw_means,
          NEW.rights_means, NEW.complaint_means, NEW.published_at, NEW.published_by)
         IS DISTINCT FROM
         (OLD.organization_id, OLD.language, OLD.version, OLD.status, OLD.title, OLD.summary, OLD.purposes, OLD.withdraw_means,
          OLD.rights_means, OLD.complaint_means, OLD.published_at, OLD.published_by) THEN
        RAISE EXCEPTION 'A published notice never changes — write a new version.' USING ERRCODE = 'TS409';
      END IF;
      RETURN NEW;
    END IF;
    IF (NEW.organization_id, NEW.language, NEW.version) IS DISTINCT FROM (OLD.organization_id, OLD.language, OLD.version) THEN
      RAISE EXCEPTION 'A notice keeps its organisation, language and version — start a new draft in the other language.' USING ERRCODE = 'TS422';
    END IF;
  END IF;

  IF v_actor IS NOT NULL THEN
    -- RLS already refuses anyone without consent.write; the second lock, with a message.
    IF NOT app.has_permission(NEW.organization_id, 'consent.write') THEN
      RAISE EXCEPTION 'You do not have permission to change the privacy notice.' USING ERRCODE = 'TS403';
    END IF;
    IF TG_OP = 'INSERT' AND NEW.status <> 'draft' THEN
      RAISE EXCEPTION 'A notice is written as a draft, then published.' USING ERRCODE = 'TS422';
    END IF;
    IF NEW.status = 'published' AND NOT app.has_permission(NEW.organization_id, 'consent.publish') THEN
      RAISE EXCEPTION 'You do not have permission to publish the privacy notice.' USING ERRCODE = 'TS403';
    END IF;
    IF TG_OP = 'INSERT' THEN
      NEW.created_by := v_actor;
    END IF;
    NEW.updated_by := v_actor;
  END IF;

  IF TG_OP = 'INSERT' AND NEW.version IS NULL THEN
    PERFORM pg_advisory_xact_lock(hashtextextended('privacy_notice_version:' || NEW.organization_id::text || ':' || NEW.language, 0));
    SELECT COALESCE(max(n.version), 0) + 1 INTO NEW.version
    FROM public.privacy_notices n
    WHERE n.organization_id = NEW.organization_id AND n.language = NEW.language;
  END IF;

  -- Publishing is stamped by the database: when, and by whom.
  IF NEW.status = 'published' AND (TG_OP = 'INSERT' OR OLD.status = 'draft') THEN
    IF v_actor IS NOT NULL OR NEW.published_at IS NULL THEN
      NEW.published_at := now();
      NEW.published_by := v_actor;
    END IF;
  ELSIF NEW.status = 'draft' THEN
    NEW.published_at := NULL;
    NEW.published_by := NULL;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER privacy_notices_before_write
  BEFORE INSERT OR UPDATE OR DELETE ON public.privacy_notices
  FOR EACH ROW EXECUTE FUNCTION app.privacy_notice_before_write();

CREATE OR REPLACE FUNCTION app.consent_config_before_write()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_actor uuid := app.current_user_id();
  v_notice public.privacy_notices;
  v_offered text[];
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.status = 'published' AND v_actor IS NOT NULL THEN
      RAISE EXCEPTION 'A published widget version is never deleted — consents were given against it.' USING ERRCODE = 'TS409';
    END IF;
    RETURN OLD;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF OLD.status = 'published' THEN
      IF (NEW.organization_id, NEW.version, NEW.status, NEW.notice_id, NEW.purposes, NEW.languages, NEW.position,
          NEW.primary_color, NEW.published_at, NEW.published_by)
         IS DISTINCT FROM
         (OLD.organization_id, OLD.version, OLD.status, OLD.notice_id, OLD.purposes, OLD.languages, OLD.position,
          OLD.primary_color, OLD.published_at, OLD.published_by) THEN
        RAISE EXCEPTION 'A published widget version never changes — make a new version.' USING ERRCODE = 'TS409';
      END IF;
      RETURN NEW;
    END IF;
    IF (NEW.organization_id, NEW.version) IS DISTINCT FROM (OLD.organization_id, OLD.version) THEN
      RAISE EXCEPTION 'A widget version keeps its organisation and number.' USING ERRCODE = 'TS422';
    END IF;
  END IF;

  IF v_actor IS NOT NULL THEN
    IF NOT app.has_permission(NEW.organization_id, 'consent.write') THEN
      RAISE EXCEPTION 'You do not have permission to change the consent widget.' USING ERRCODE = 'TS403';
    END IF;
    IF TG_OP = 'INSERT' AND NEW.status <> 'draft' THEN
      RAISE EXCEPTION 'A widget version is made as a draft, then published.' USING ERRCODE = 'TS422';
    END IF;
    IF NEW.status = 'published' AND NOT app.has_permission(NEW.organization_id, 'consent.publish') THEN
      RAISE EXCEPTION 'You do not have permission to publish the consent widget.' USING ERRCODE = 'TS403';
    END IF;
    IF TG_OP = 'INSERT' THEN
      NEW.created_by := v_actor;
    END IF;
    NEW.updated_by := v_actor;
  END IF;

  -- The notice it cites is this organisation's (the composite FK says so too),
  -- and it offers only purposes that notice states, in the notice's language too.
  SELECT * INTO v_notice FROM public.privacy_notices n WHERE n.organization_id = NEW.organization_id AND n.id = NEW.notice_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'The notice was not found.' USING ERRCODE = 'TS422';
  END IF;
  SELECT COALESCE(array_agg(i ->> 'key'), ARRAY[]::text[]) INTO v_offered FROM jsonb_array_elements(v_notice.purposes) i;
  IF NOT (NEW.purposes <@ v_offered) THEN
    RAISE EXCEPTION 'A widget version offers only purposes its notice states.' USING ERRCODE = 'TS422';
  END IF;
  IF NOT (v_notice.language = ANY (NEW.languages)) THEN
    RAISE EXCEPTION 'A widget version offers the language its notice is written in.' USING ERRCODE = 'TS422';
  END IF;
  IF NEW.status = 'published' AND v_notice.status <> 'published' THEN
    RAISE EXCEPTION 'Publish the notice first: a widget version cites a published notice.' USING ERRCODE = 'TS409';
  END IF;

  IF TG_OP = 'INSERT' AND NEW.version IS NULL THEN
    PERFORM pg_advisory_xact_lock(hashtextextended('consent_config_version:' || NEW.organization_id::text, 0));
    SELECT COALESCE(max(c.version), 0) + 1 INTO NEW.version
    FROM public.consent_configs c
    WHERE c.organization_id = NEW.organization_id;
  END IF;

  IF NEW.status = 'published' AND (TG_OP = 'INSERT' OR OLD.status = 'draft') THEN
    IF v_actor IS NOT NULL OR NEW.published_at IS NULL THEN
      NEW.published_at := now();
      NEW.published_by := v_actor;
    END IF;
  ELSIF NEW.status = 'draft' THEN
    NEW.published_at := NULL;
    NEW.published_by := NULL;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER consent_configs_before_write
  BEFORE INSERT OR UPDATE OR DELETE ON public.consent_configs
  FOR EACH ROW EXECUTE FUNCTION app.consent_config_before_write();

-- A consent record is append-only: nobody updates one, ever; nobody but
-- tooling (an organisation's deletion) removes one. And it cites a PUBLISHED
-- widget version, offering only that version's purposes.
CREATE OR REPLACE FUNCTION app.consent_record_guard()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_config public.consent_configs;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    RAISE EXCEPTION 'A consent record never changes — record a new choice instead.' USING ERRCODE = 'TS409';
  END IF;
  IF TG_OP = 'DELETE' THEN
    IF app.current_user_id() IS NOT NULL THEN
      RAISE EXCEPTION 'A consent record is never deleted.' USING ERRCODE = 'TS409';
    END IF;
    RETURN OLD;
  END IF;
  SELECT * INTO v_config FROM public.consent_configs c WHERE c.organization_id = NEW.organization_id AND c.id = NEW.config_id;
  IF NOT FOUND OR v_config.status <> 'published' THEN
    RAISE EXCEPTION 'A consent is recorded against a published widget version.' USING ERRCODE = 'TS422';
  END IF;
  IF NOT (NEW.purposes <@ v_config.purposes) THEN
    RAISE EXCEPTION 'A consent names only purposes its widget version offers.' USING ERRCODE = 'TS422';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER consent_records_guard
  BEFORE INSERT OR UPDATE OR DELETE ON public.consent_records
  FOR EACH ROW EXECUTE FUNCTION app.consent_record_guard();

REVOKE ALL ON FUNCTION app.privacy_notice_before_write(), app.consent_config_before_write(), app.consent_record_guard() FROM PUBLIC;


-- ===========================================================================
-- (5) The principal key, the latest position, and the staff functions
-- ===========================================================================

-- The pseudonymous key: HMAC-SHA256 of the identifier (trimmed, lower-case)
-- under the organisation's own salt, made on first use. The same person has
-- the same key in one organisation and an unrelated key in another; without
-- the salt, nobody can test a guess. Callable only inside the functions below.
CREATE OR REPLACE FUNCTION app.consent_principal_key(p_organization_id uuid, p_identifier text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_salt bytea;
  v_identifier text := lower(btrim(p_identifier));
BEGIN
  IF v_identifier IS NULL OR v_identifier = '' OR char_length(v_identifier) > 320 THEN
    RAISE EXCEPTION 'An identifier for the person is needed, up to 320 characters.' USING ERRCODE = 'TS422';
  END IF;
  INSERT INTO public.consent_salts (organization_id) VALUES (p_organization_id) ON CONFLICT (organization_id) DO NOTHING;
  SELECT s.salt INTO v_salt FROM public.consent_salts s WHERE s.organization_id = p_organization_id;
  RETURN encode(extensions.hmac(convert_to(v_identifier, 'UTF8'), v_salt, 'sha256'), 'hex');
END;
$$;

REVOKE ALL ON FUNCTION app.consent_principal_key(uuid, text) FROM PUBLIC;

-- Every principal's LATEST record — their position now (core: the facts
-- `countConsents` and the model read). Runs as the caller: row security applies.
CREATE VIEW public.consent_principals WITH (security_invoker = true) AS
SELECT DISTINCT ON (r.organization_id, r.principal_key)
  r.organization_id, r.principal_key, r.id AS record_id, r.config_id, r.action, r.purposes, r.principal_kind,
  r.verification_method, r.source, r.recorded_at
FROM public.consent_records r
ORDER BY r.organization_id, r.principal_key, r.recorded_at DESC, r.id DESC;

-- The model's consent facts (1.3.0): the latest record of every principal
-- whose latest record is on behalf of a child or a ward. As the caller.
CREATE OR REPLACE FUNCTION app.consent_model_facts(p_organization_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SET search_path = ''
AS $$
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
           'principalKind', p.principal_kind,
           'action', p.action,
           'verificationMethod', p.verification_method) ORDER BY p.recorded_at, p.record_id), '[]'::jsonb)
  FROM public.consent_principals p
  WHERE p.organization_id = p_organization_id AND p.principal_kind <> 'self';
$$;

REVOKE ALL ON FUNCTION app.consent_model_facts(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app.consent_model_facts(uuid) TO authenticated;

-- The register's readers (as the caller — RLS applies; nothing without consent.read).
-- One JSON value, so no row limit truncates a count.
CREATE OR REPLACE FUNCTION public.consent_register_facts(p_organization_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SET search_path = ''
AS $$
  SELECT jsonb_build_object(
    -- core `countConsents`, over every principal's latest record.
    'counts', (
      SELECT jsonb_build_object(
        'principals', count(*),
        'given', count(*) FILTER (WHERE p.action = 'given'),
        'refused', count(*) FILTER (WHERE p.action = 'refused'),
        'withdrawn', count(*) FILTER (WHERE p.action = 'withdrawn'),
        'onBehalf', count(*) FILTER (WHERE p.action = 'given' AND p.principal_kind <> 'self'),
        'unverified', count(*) FILTER (WHERE p.action = 'given' AND p.principal_kind <> 'self' AND p.verification_method IS NULL))
      FROM public.consent_principals p
      WHERE p.organization_id = p_organization_id),
    'modelFacts', app.consent_model_facts(p_organization_id));
$$;

REVOKE ALL ON FUNCTION public.consent_register_facts(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.consent_register_facts(uuid) TO authenticated;

-- Staff record a choice (a paper form, a counter, an email) — or how a parent
-- or guardian was verified, as a NEW record restating the choice. ONE audit
-- row, as the person, with no identifier and no reference.
CREATE OR REPLACE FUNCTION public.record_consent(
  p_organization_id uuid,
  p_config_id uuid,
  p_identifier text,
  p_action text,
  p_purposes text[],
  p_principal_kind text,
  p_verification_method text,
  p_language text,
  p_reference text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_actor uuid := app.current_user_id();
  v_config public.consent_configs;
  v_record public.consent_records;
BEGIN
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'Sign in to continue.' USING ERRCODE = 'TS401';
  END IF;
  IF NOT app.has_permission(p_organization_id, 'consent.write') THEN
    RAISE EXCEPTION 'You do not have permission to record a consent.' USING ERRCODE = 'TS403';
  END IF;
  SELECT * INTO v_config FROM public.consent_configs c WHERE c.organization_id = p_organization_id AND c.id = p_config_id;
  IF NOT FOUND OR v_config.status <> 'published' THEN
    RAISE EXCEPTION 'Widget version not found — a consent is recorded against a published version.' USING ERRCODE = 'TS404';
  END IF;
  IF NOT (COALESCE(p_purposes, ARRAY[]::text[]) <@ v_config.purposes) THEN
    RAISE EXCEPTION 'Name only purposes this widget version offers.' USING ERRCODE = 'TS422';
  END IF;
  IF NOT app.consent_verification_fits(COALESCE(p_principal_kind, 'self'), p_verification_method) THEN
    RAISE EXCEPTION 'That basis does not fit this kind of consent.' USING ERRCODE = 'TS422';
  END IF;

  INSERT INTO public.consent_records (organization_id, config_id, principal_key, action, purposes, principal_kind,
    verification_method, language, source, reference, recorded_by)
  VALUES (p_organization_id, p_config_id, app.consent_principal_key(p_organization_id, p_identifier), p_action,
    COALESCE(p_purposes, ARRAY[]::text[]), COALESCE(p_principal_kind, 'self'), p_verification_method,
    COALESCE(p_language, 'en'), 'staff', NULLIF(btrim(p_reference), ''), v_actor)
  RETURNING * INTO v_record;

  INSERT INTO public.audit_logs (organization_id, user_id, event_type, entity_type, entity_id, description, metadata)
  VALUES (
    p_organization_id, v_actor, 'consent.consent_records.insert', 'consent_records', v_record.id, 'Recorded a consent',
    jsonb_strip_nulls(jsonb_build_object(
      'configVersion', v_config.version,
      'consentAction', v_record.action,
      'purposeCount', cardinality(v_record.purposes),
      'principalKind', v_record.principal_kind,
      'verificationMethod', v_record.verification_method)));

  RETURN jsonb_build_object('id', v_record.id, 'recordedAt', v_record.recorded_at, 'action', v_record.action);
END;
$$;

REVOKE ALL ON FUNCTION public.record_consent(uuid, uuid, text, text, text[], text, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_consent(uuid, uuid, text, text, text[], text, text, text, text) TO authenticated;

-- One person's history, newest first — found by the identifier the
-- organisation holds, which is hashed here and never stored.
CREATE OR REPLACE FUNCTION public.consent_history(p_organization_id uuid, p_identifier text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_key text;
BEGIN
  IF app.current_user_id() IS NULL THEN
    RAISE EXCEPTION 'Sign in to continue.' USING ERRCODE = 'TS401';
  END IF;
  IF NOT app.has_permission(p_organization_id, 'consent.read') THEN
    RAISE EXCEPTION 'You do not have permission to read the consent register.' USING ERRCODE = 'TS403';
  END IF;
  v_key := app.consent_principal_key(p_organization_id, p_identifier);
  RETURN jsonb_build_object(
    'principalKey', v_key,
    'records', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
               'id', r.id, 'configId', r.config_id, 'configVersion', c.version, 'action', r.action, 'purposes', to_jsonb(r.purposes),
               'principalKind', r.principal_kind, 'verificationMethod', r.verification_method, 'language', r.language,
               'source', r.source, 'reference', r.reference, 'recordedBy', r.recorded_by, 'recordedAt', r.recorded_at)
             ORDER BY r.recorded_at DESC, r.id DESC)
      FROM public.consent_records r
      JOIN public.consent_configs c ON c.organization_id = r.organization_id AND c.id = r.config_id
      WHERE r.organization_id = p_organization_id AND r.principal_key = v_key), '[]'::jsonb));
END;
$$;

REVOKE ALL ON FUNCTION public.consent_history(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.consent_history(uuid, text) TO authenticated;


-- ===========================================================================
-- (6) The public functions — `service_role` only (D-086.1)
-- ===========================================================================

-- A published notice as the public page shows it.
CREATE OR REPLACE FUNCTION app.notice_public_json(p_notice public.privacy_notices)
RETURNS jsonb
LANGUAGE sql
STABLE
SET search_path = ''
AS $$
  SELECT jsonb_build_object(
    'language', p_notice.language,
    'version', p_notice.version,
    'title', p_notice.title,
    'summary', p_notice.summary,
    'purposes', p_notice.purposes,
    'withdrawMeans', p_notice.withdraw_means,
    'rightsMeans', p_notice.rights_means,
    'complaintMeans', p_notice.complaint_means,
    'publishedAt', app.iso_instant(p_notice.published_at));
$$;

REVOKE ALL ON FUNCTION app.notice_public_json(public.privacy_notices) FROM PUBLIC;

-- (a) The latest published notice in a language (else English, else the
-- newest in any language), with the languages it is published in — or null:
-- the same "not found" as every other public page (D-084).
CREATE OR REPLACE FUNCTION public.consent_notice(p_slug text, p_language text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_org public.organizations;
  v_notice public.privacy_notices;
BEGIN
  v_org := app.intake_organization(p_slug);
  IF v_org.id IS NULL THEN
    RETURN NULL;
  END IF;
  SELECT * INTO v_notice
  FROM public.privacy_notices n
  WHERE n.organization_id = v_org.id AND n.status = 'published'
  ORDER BY (n.language = p_language) DESC, (n.language = 'en') DESC, n.published_at DESC, n.version DESC
  LIMIT 1;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;
  -- The latest version in that language, not merely the first found.
  SELECT * INTO v_notice
  FROM public.privacy_notices n
  WHERE n.organization_id = v_org.id AND n.status = 'published' AND n.language = v_notice.language
  ORDER BY n.version DESC
  LIMIT 1;
  RETURN jsonb_build_object(
    'organization', app.intake_profile_json(v_org),
    'notice', app.notice_public_json(v_notice),
    'languages', (SELECT jsonb_agg(DISTINCT n.language) FROM public.privacy_notices n
                  WHERE n.organization_id = v_org.id AND n.status = 'published'));
END;
$$;

-- (b) The live widget version: the newest published, with its purposes in the
-- words of the notice it cites — or null.
CREATE OR REPLACE FUNCTION public.consent_widget(p_slug text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_org public.organizations;
  v_config public.consent_configs;
  v_notice public.privacy_notices;
BEGIN
  v_org := app.intake_organization(p_slug);
  IF v_org.id IS NULL THEN
    RETURN NULL;
  END IF;
  SELECT * INTO v_config FROM public.consent_configs c
  WHERE c.organization_id = v_org.id AND c.status = 'published'
  ORDER BY c.version DESC
  LIMIT 1;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;
  SELECT * INTO v_notice FROM public.privacy_notices n WHERE n.organization_id = v_org.id AND n.id = v_config.notice_id;
  RETURN jsonb_build_object(
    'organization', app.intake_profile_json(v_org),
    'config', jsonb_build_object(
      'id', v_config.id,
      'version', v_config.version,
      'languages', to_jsonb(v_config.languages),
      'position', v_config.position,
      'primaryColor', v_config.primary_color,
      'notice', jsonb_build_object('language', v_notice.language, 'version', v_notice.version),
      'purposes', COALESCE((
        SELECT jsonb_agg(i ORDER BY array_position(v_config.purposes, i ->> 'key'))
        FROM jsonb_array_elements(v_notice.purposes) i
        WHERE (i ->> 'key') = ANY (v_config.purposes)), '[]'::jsonb)));
END;
$$;

-- (c) A choice made in the widget. Counted against the limits; never a
-- verification; no audit row — the record is itself the log, and the widget
-- is not a person in the organisation.
CREATE OR REPLACE FUNCTION public.consent_record_public(
  p_slug text,
  p_client_hash text,
  p_config_id uuid,
  p_identifier text,
  p_action text,
  p_purposes text[],
  p_principal_kind text,
  p_language text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_org public.organizations;
  v_config public.consent_configs;
  v_l record;
  v_key text;
  v_record public.consent_records;
BEGIN
  v_org := app.intake_organization(p_slug);
  IF v_org.id IS NULL THEN
    RETURN jsonb_build_object('status', 'not_found');
  END IF;
  IF p_client_hash IS NULL OR p_client_hash !~ '^[0-9a-f]{64}$' THEN
    RAISE EXCEPTION 'Missing client key.' USING ERRCODE = 'TS422';
  END IF;
  SELECT * INTO v_config FROM public.consent_configs c
  WHERE c.organization_id = v_org.id AND c.id = p_config_id AND c.status = 'published';
  IF NOT FOUND THEN
    RETURN jsonb_build_object('status', 'not_found');
  END IF;
  IF NOT (COALESCE(p_purposes, ARRAY[]::text[]) <@ v_config.purposes) THEN
    RAISE EXCEPTION 'Name only purposes this widget offers.' USING ERRCODE = 'TS422';
  END IF;
  IF NOT (COALESCE(p_language, 'en') = ANY (v_config.languages)) THEN
    RAISE EXCEPTION 'That language is not offered.' USING ERRCODE = 'TS422';
  END IF;
  v_key := app.consent_principal_key(v_org.id, p_identifier);
  SELECT * INTO v_l FROM app.consent_limits();

  PERFORM pg_advisory_xact_lock(hashtextextended('consent_client:' || v_org.id::text || ':' || p_client_hash, 0));
  PERFORM pg_advisory_xact_lock(hashtextextended('consent_principal:' || v_org.id::text || ':' || v_key, 0));
  IF (SELECT count(*) FROM public.intake_attempts a
      WHERE a.organization_id = v_org.id AND a.surface = 'consent' AND a.client_hash = p_client_hash
        AND a.event = 'consent_record' AND a.created_at > now() - interval '1 hour') >= v_l.records_per_client_hour THEN
    RETURN jsonb_build_object('status', 'rate_limited', 'limit', 'client');
  END IF;
  IF (SELECT count(*) FROM public.consent_records r
      WHERE r.organization_id = v_org.id AND r.principal_key = v_key
        AND r.recorded_at > now() - interval '1 hour') >= v_l.records_per_principal_hour THEN
    RETURN jsonb_build_object('status', 'rate_limited', 'limit', 'principal');
  END IF;

  INSERT INTO public.consent_records (organization_id, config_id, principal_key, action, purposes, principal_kind, language, source)
  VALUES (v_org.id, v_config.id, v_key, p_action, COALESCE(p_purposes, ARRAY[]::text[]), COALESCE(p_principal_kind, 'self'),
          COALESCE(p_language, 'en'), 'widget')
  RETURNING * INTO v_record;
  INSERT INTO public.intake_attempts (organization_id, surface, event, client_hash, email_hash)
  VALUES (v_org.id, 'consent', 'consent_record', p_client_hash, NULL);

  RETURN jsonb_build_object(
    'status', 'recorded',
    'action', v_record.action,
    'purposes', to_jsonb(v_record.purposes),
    'recordedAt', app.iso_instant(v_record.recorded_at));
END;
$$;

REVOKE ALL ON FUNCTION public.consent_notice(text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.consent_widget(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.consent_record_public(text, text, uuid, text, text, text[], text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consent_notice(text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.consent_widget(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.consent_record_public(text, text, uuid, text, text, text[], text, text) TO service_role;


-- ===========================================================================
-- (7) Audit — from the Stage 2 body: notices and widget versions are audited by
--     the same trigger (their number, language and status, never their text);
--     consent records by `record_consent`, once, with no identifier
-- ===========================================================================

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
  -- Slice 7: an import is audited once, by its RPC, with the counts.
  IF TG_TABLE_NAME = 'ropa_records' AND current_setting('app.ropa_bulk_import', true) = 'on' THEN
    RETURN NULL;
  END IF;

  IF TG_TABLE_NAME = 'organizations' THEN
    v_org := (v_row ->> 'id')::uuid;
    v_entity := v_org;
  ELSE
    v_org := (v_row ->> 'organization_id')::uuid;
    v_entity := COALESCE(v_row ->> 'id', v_row ->> 'ropa_record_id', v_row ->> 'vendor_id', v_row ->> 'organization_id')::uuid;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    SELECT COALESCE(jsonb_agg(n.key ORDER BY n.key), '[]'::jsonb) INTO v_changed
    FROM jsonb_each(v_new) n
    WHERE n.key NOT IN ('updated_at', 'derived_at', 'generated_at', 'updated_by',
                        -- Slice 7: derived by the database, never an edit
                        'completeness_score', 'completeness_band', 'completeness_missing', 'risk_factors',
                        'risk_points', 'risk_rating_derived', 'risk_rating', 'system_link_count',
                        'vendor_link_count', 'evidence_count',
                        -- D-065: counted from the vendor register, never an edit
                        'vendor_contract_gaps',
                        -- Slice 10: the breach clock and who-recorded-what are stamped, never edits
                        'board_report_due_at', 'board_extension_recorded_by', 'board_extension_recorded_at',
                        'board_initial_recorded_by', 'board_initial_recorded_at', 'board_report_recorded_by',
                        'board_report_recorded_at', 'principals_recorded_by', 'principals_recorded_at',
                        'closed_by',
                        -- Slice 10 Stage 2: the respond-by date and who-recorded-what are stamped, never edits
                        'respond_by', 'identity_recorded_by', 'identity_recorded_at', 'response_recorded_by',
                        'response_recorded_at',
                        -- Slice 10 Stage 3b: who published, and when, are stamped, never edits
                        'published_at', 'published_by')
      -- …and a notice's or a widget version's number is the database's.
      AND NOT (TG_TABLE_NAME IN ('privacy_notices', 'consent_configs') AND n.key = 'version')
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
      -- A processing activity's name is free text: never logged (Slice 7).
      'name', CASE WHEN TG_TABLE_NAME <> 'ropa_records' THEN COALESCE(v_row ->> 'name', v_row ->> 'label') END,
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
      'closureBasis', v_row ->> 'closure_basis',
      -- Slice 7
      'ropaGapId', v_row ->> 'ropa_gap_id',
      'ropaRecordId', v_row ->> 'ropa_record_id',
      'vendorId', CASE WHEN TG_TABLE_NAME = 'ropa_vendors' THEN v_row ->> 'vendor_id' END,
      'recordCode', v_row ->> 'record_code',
      'recordStatus', CASE WHEN TG_TABLE_NAME = 'ropa_records' THEN v_row ->> 'status' END,
      'version', CASE WHEN TG_TABLE_NAME = 'ropa_records' THEN v_row -> 'version' END,
      'completenessScore', (v_row -> 'completeness_score'),
      'riskRating', v_row ->> 'risk_rating',
      -- D-065
      'lawfulBasis', v_row ->> 'lawful_basis',
      -- Slice 10: the incident's code, status and clock — its title and
      -- narrative are free text and never logged; nor is the Board's reference.
      'breachIncidentId', v_row ->> 'breach_incident_id',
      'incidentCode', v_row ->> 'incident_code',
      'breachStatus', CASE WHEN TG_TABLE_NAME = 'breach_incidents' THEN v_row ->> 'status' END,
      'severity', CASE WHEN TG_TABLE_NAME = 'breach_incidents' THEN v_row ->> 'severity' END,
      'boardReportDueAt', v_row ->> 'board_report_due_at',
      -- Slice 10 Stage 2: the request's code, kind, status, outcome and dates —
      -- never the person's name, email, phone or identifier, the summary, the
      -- response, the nominee or a closing reason: personal data and free text.
      'rightsRequestId', v_row ->> 'rights_request_id',
      'requestCode', v_row ->> 'request_code',
      'rightsKind', CASE WHEN TG_TABLE_NAME = 'rights_requests' THEN v_row ->> 'kind' END,
      'rightsStatus', CASE WHEN TG_TABLE_NAME = 'rights_requests' THEN v_row ->> 'status' END,
      'outcome', CASE WHEN TG_TABLE_NAME = 'rights_requests' THEN v_row ->> 'outcome' END,
      'receivedOn', v_row ->> 'received_on',
      'respondBy', v_row ->> 'respond_by',
      'respondedOn', v_row ->> 'responded_on',
      -- Slice 10 Stage 3b: a notice's or a widget version's number, language and
      -- status — never its text (the notice is the organisation's words, kept
      -- in the row itself).
      'consentVersion', CASE WHEN TG_TABLE_NAME IN ('privacy_notices', 'consent_configs') THEN v_row -> 'version' END,
      'consentStatus', CASE WHEN TG_TABLE_NAME IN ('privacy_notices', 'consent_configs') THEN v_row ->> 'status' END,
      'language', CASE WHEN TG_TABLE_NAME = 'privacy_notices' THEN v_row ->> 'language' END,
      'noticeId', CASE WHEN TG_TABLE_NAME = 'consent_configs' THEN v_row ->> 'notice_id' END
    ))
  );
  RETURN NULL;
END;
$$;

CREATE TRIGGER privacy_notices_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.privacy_notices
  FOR EACH ROW EXECUTE FUNCTION app.audit_scope_change('consent');

CREATE TRIGGER consent_configs_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.consent_configs
  FOR EACH ROW EXECUTE FUNCTION app.audit_scope_change('consent');


-- ===========================================================================
-- (8) Grants + RLS (D-019) — `anon` gets nothing
-- ===========================================================================

REVOKE ALL ON public.privacy_notices, public.consent_configs, public.consent_records, public.consent_salts
  FROM anon, authenticated;
REVOKE ALL ON public.consent_salts FROM service_role;
REVOKE ALL ON public.consent_principals FROM anon, authenticated;

GRANT SELECT ON public.privacy_notices TO authenticated;
-- What a person writes. Never the version, the status on insert, or a stamp.
GRANT INSERT (organization_id, language, title, summary, purposes, withdraw_means, rights_means, complaint_means)
  ON public.privacy_notices TO authenticated;
-- A draft's text, and publishing it (status). A published row refuses every change (the trigger).
GRANT UPDATE (title, summary, purposes, withdraw_means, rights_means, complaint_means, status)
  ON public.privacy_notices TO authenticated;
-- A DRAFT may be discarded (the policy and the trigger); a published notice never.
GRANT DELETE ON public.privacy_notices TO authenticated;

GRANT SELECT ON public.consent_configs TO authenticated;
GRANT INSERT (organization_id, notice_id, purposes, languages, position, primary_color) ON public.consent_configs TO authenticated;
GRANT UPDATE (notice_id, purposes, languages, position, primary_color, status) ON public.consent_configs TO authenticated;
GRANT DELETE ON public.consent_configs TO authenticated;

-- Read only: a record is written by `record_consent` (staff) or the public
-- widget's function, never by a table grant, and never changed.
GRANT SELECT ON public.consent_records TO authenticated;
GRANT SELECT ON public.consent_principals TO authenticated;

ALTER TABLE public.privacy_notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consent_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consent_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consent_salts ENABLE ROW LEVEL SECURITY;

CREATE POLICY privacy_notices_select_member ON public.privacy_notices
  FOR SELECT TO authenticated
  USING (organization_id IN (SELECT app.current_user_organization_ids()) AND app.has_permission(organization_id, 'consent.read'));
CREATE POLICY privacy_notices_insert_writer ON public.privacy_notices
  FOR INSERT TO authenticated
  WITH CHECK (organization_id IN (SELECT app.current_user_organization_ids()) AND app.has_permission(organization_id, 'consent.write'));
CREATE POLICY privacy_notices_update_writer ON public.privacy_notices
  FOR UPDATE TO authenticated
  USING (organization_id IN (SELECT app.current_user_organization_ids()) AND app.has_permission(organization_id, 'consent.write'))
  WITH CHECK (organization_id IN (SELECT app.current_user_organization_ids()) AND app.has_permission(organization_id, 'consent.write'));
CREATE POLICY privacy_notices_delete_draft ON public.privacy_notices
  FOR DELETE TO authenticated
  USING (organization_id IN (SELECT app.current_user_organization_ids()) AND app.has_permission(organization_id, 'consent.write')
         AND status = 'draft');

CREATE POLICY consent_configs_select_member ON public.consent_configs
  FOR SELECT TO authenticated
  USING (organization_id IN (SELECT app.current_user_organization_ids()) AND app.has_permission(organization_id, 'consent.read'));
CREATE POLICY consent_configs_insert_writer ON public.consent_configs
  FOR INSERT TO authenticated
  WITH CHECK (organization_id IN (SELECT app.current_user_organization_ids()) AND app.has_permission(organization_id, 'consent.write'));
CREATE POLICY consent_configs_update_writer ON public.consent_configs
  FOR UPDATE TO authenticated
  USING (organization_id IN (SELECT app.current_user_organization_ids()) AND app.has_permission(organization_id, 'consent.write'))
  WITH CHECK (organization_id IN (SELECT app.current_user_organization_ids()) AND app.has_permission(organization_id, 'consent.write'));
CREATE POLICY consent_configs_delete_draft ON public.consent_configs
  FOR DELETE TO authenticated
  USING (organization_id IN (SELECT app.current_user_organization_ids()) AND app.has_permission(organization_id, 'consent.write')
         AND status = 'draft');

CREATE POLICY consent_records_select_member ON public.consent_records
  FOR SELECT TO authenticated
  USING (organization_id IN (SELECT app.current_user_organization_ids()) AND app.has_permission(organization_id, 'consent.read'));

-- Every public table carries a policy (CI). Nobody reads a salt — not even a
-- member of the organisation; only `app.consent_principal_key` does.
CREATE POLICY consent_salts_no_user ON public.consent_salts FOR SELECT TO authenticated USING (false);


-- ===========================================================================
-- (9) Exposure model 1.3.0 — mirrors packages/core/src/exposure.ts
-- ===========================================================================
-- SLICE_10 §6, §7a.5: the consent register's row on head 3. One version per
-- stage: 1.2.0's migration stays as it was and this one replaces the
-- functions, each from its 1.2.0 body with the 1.3.0 rules and nothing else.

CREATE OR REPLACE FUNCTION app.exposure_model_version()
RETURNS text
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = ''
AS $$
  SELECT '1.3.0'::text;
$$;

-- §6.2b, with the 1.3.0 row. `ord` is core's MODULE_INPUT_CODES order.
CREATE OR REPLACE FUNCTION app.exposure_module_inputs()
RETURNS TABLE (ord integer, code text, head text, provision text, effect text, register text, label text,
               reason_one text, reason_many text)
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = ''
AS $$
  VALUES
    (1, 'breach_board_overdue', 'H2', 's.8(6), Rule 7(2)(b)', 'exposed', 'Breach register',
     'Detailed report to the Board past its due time (72 hours, or the time the Board allowed) and not recorded as made',
     '1 personal data breach: the detailed report to the Board is past its due time and not recorded as made (Rule 7(2)(b)).',
     '{n} personal data breaches: the detailed report to the Board is past its due time and not recorded as made (Rule 7(2)(b)).'),
    (2, 'breach_principals_pending', 'H2', 's.8(6), Rule 7(1)', 'not_mitigated', 'Breach register',
     'Affected Data Principals not yet recorded as intimated',
     '1 personal data breach: affected Data Principals are not recorded as intimated (Rule 7(1)).',
     '{n} personal data breaches: affected Data Principals are not recorded as intimated (Rule 7(1)).'),
    (3, 'rights_ceiling_overdue', 'H7', 's.11–14, Rule 14(3)', 'exposed', 'Rights and grievance register',
     'A rights request or grievance open past the ninety days the Rules allow for a response',
     '1 rights request or grievance has been open for more than ninety days since it was received (Rule 14(3)).',
     '{n} rights requests or grievances have been open for more than ninety days since they were received (Rule 14(3)).'),
    (4, 'rights_target_overdue', 'H7', 'Rule 14(3) sets ninety days; thirty is a TrustStack target', 'reason', 'Rights and grievance register',
     'Open past TrustStack''s 30-day response target, still inside the ninety days',
     '1 rights request or grievance is open past TrustStack''s 30-day response target (a target, not a statutory period).',
     '{n} rights requests or grievances are open past TrustStack''s 30-day response target (a target, not a statutory period).'),
    (5, 'child_consent_unverified', 'H3', 's.9(1), Rules 10–11', 'exposed', 'Consent register',
     'A child''s or a lawful guardian''s consent, still given, with no verification of the parent or guardian recorded',
     '1 consent given on behalf of a child or a person with disability has no verification of the parent or lawful guardian recorded (s.9(1), Rules 10–11).',
     '{n} consents given on behalf of a child or a person with disability have no verification of the parent or lawful guardian recorded (s.9(1), Rules 10–11).');
$$;

REVOKE ALL ON FUNCTION app.exposure_model_version(), app.exposure_module_inputs() FROM PUBLIC;

-- The evaluator, from its 1.2.0 body with the 1.3.0 rules: the consent fact
-- joins the module counts, and consents given on behalf of a child or a ward
-- join the facts that decide whether head 3 applies (and the children's-data
-- position factor). Everything else is unchanged, word for word.
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
  v_guardian text;
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
  -- 1.1.0: the breach register.
  v_now timestamptz := (p_input ->> 'now')::timestamptz;
  v_today date := (p_input ->> 'today')::date;
  v_n_board_overdue integer;
  v_n_principals_pending integer;
  v_n_recent integer;
  v_counts jsonb;
  v_module_exposes boolean;
  v_module_bars boolean;
  -- 1.2.0: the rights and grievance register.
  v_n_rights_ceiling integer;
  v_n_rights_target integer;
  -- 1.3.0: the consent register.
  v_n_consent_unverified integer;
  v_consent_child boolean;
  v_consent_ward boolean;
BEGIN
  SELECT * INTO v_meta FROM app.exposure_heads() h WHERE h.code = p_head;
  SELECT * INTO v_t FROM app.exposure_thresholds();
  v_ceiling_crore := v_meta.ceiling_rupees / 10000000; -- every modelled ceiling is whole crore

  -- 1.3.0 (core `childrenAndGuardianFacts`): a consent still given on behalf of
  -- a child means children's data IS processed; one given by a lawful guardian,
  -- that a ward's data is.
  SELECT COALESCE(bool_or(c.value ->> 'action' = 'given' AND c.value ->> 'principalKind' = 'child'), false),
         COALESCE(bool_or(c.value ->> 'action' = 'given' AND c.value ->> 'principalKind' = 'guardian_ward'), false)
    INTO v_consent_child, v_consent_ward
  FROM jsonb_array_elements(COALESCE(p_input -> 'consents', '[]'::jsonb)) c(value);
  SELECT app.exposure_strongest(
           ARRAY[p_input #>> '{scope,childrenData}']
           || COALESCE((SELECT array_agg(x) FROM jsonb_array_elements_text(p_input #> '{register,childrenData}') x), ARRAY[]::text[])
           || CASE WHEN v_consent_child THEN ARRAY['yes'] ELSE ARRAY[]::text[] END)
    INTO v_children;
  SELECT app.exposure_strongest(
           ARRAY[p_input #>> '{scope,guardianData}']
           || CASE WHEN v_consent_ward THEN ARRAY['yes'] ELSE ARRAY[]::text[] END)
    INTO v_guardian;

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

  -- --- The workflow modules' facts (core `moduleInputCounts`, `recentBreachCount`) — 1.1.0, 1.2.0, 1.3.0
  -- A breach dismissed as not a personal data breach never counts. "Overdue"
  -- is strictly after the due instant: exactly 72 hours is still in time.
  -- The repetition window is 24 calendar months ending today, both ends
  -- included, the awareness dated in India.
  SELECT count(*) FILTER (WHERE jsonb_typeof(b.value -> 'boardReportAt') IS DISTINCT FROM 'string'
                            AND v_now > (b.value ->> 'boardReportDueAt')::timestamptz),
         count(*) FILTER (WHERE jsonb_typeof(b.value -> 'principalsIntimatedAt') IS DISTINCT FROM 'string'),
         count(*) FILTER (WHERE ((b.value ->> 'awareAt')::timestamptz AT TIME ZONE 'Asia/Kolkata')::date
                                  BETWEEN (v_today - make_interval(months => app.exposure_repetition_window_months()))::date AND v_today)
    INTO v_n_board_overdue, v_n_principals_pending, v_n_recent
  FROM jsonb_array_elements(COALESCE(p_input -> 'breaches', '[]'::jsonb)) b(value)
  WHERE b.value ->> 'status' <> 'dismissed';
  -- 1.2.0: the rights register (core `rightsCeilingOverdue`, `rightsPastTarget`).
  -- Only an OPEN request counts. Day 90 since receipt is still in time:
  -- overdue is strictly after; past TrustStack's target strictly after day
  -- 30 and never also overdue. A date minus a date is whole days.
  SELECT count(*) FILTER (WHERE v_today - (r.value ->> 'receivedOn')::date > app.rights_ceiling_days()),
         count(*) FILTER (WHERE v_today - (r.value ->> 'receivedOn')::date > app.rights_target_days()
                            AND v_today - (r.value ->> 'receivedOn')::date <= app.rights_ceiling_days())
    INTO v_n_rights_ceiling, v_n_rights_target
  FROM jsonb_array_elements(COALESCE(p_input -> 'rights', '[]'::jsonb)) r(value)
  WHERE r.value ->> 'status' = 'open';
  -- 1.3.0: the consent register (core `childConsentUnverified`): still given,
  -- on behalf of a child or a ward, with no verification or exemption recorded.
  SELECT count(*) FILTER (WHERE c.value ->> 'action' = 'given' AND c.value ->> 'principalKind' <> 'self'
                            AND jsonb_typeof(c.value -> 'verificationMethod') IS DISTINCT FROM 'string')
    INTO v_n_consent_unverified
  FROM jsonb_array_elements(COALESCE(p_input -> 'consents', '[]'::jsonb)) c(value);
  v_counts := jsonb_build_object('breach_board_overdue', v_n_board_overdue, 'breach_principals_pending', v_n_principals_pending,
                                 'rights_ceiling_overdue', v_n_rights_ceiling, 'rights_target_overdue', v_n_rights_target,
                                 'child_consent_unverified', v_n_consent_unverified);
  SELECT COALESCE(bool_or(m.effect = 'exposed' AND (v_counts ->> m.code)::integer > 0), false),
         COALESCE(bool_or(m.effect = 'not_mitigated' AND (v_counts ->> m.code)::integer > 0), false)
    INTO v_module_exposes, v_module_bars
  FROM app.exposure_module_inputs() m
  WHERE m.head = p_head;

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

  IF v_unanswered AND v_n_register_direct = 0 AND NOT v_module_exposes THEN
    v_status := 'not_yet_assessed';
    v_reasons := v_reasons || jsonb_build_array(jsonb_build_object('kind', 'status', 'text',
      CASE WHEN NOT v_has_assessment
           THEN 'No assessment has been started, and no register gap is open for this head.'
           ELSE 'No question that evidences this head has been answered yet, and no register gap is open for it.' END));
  ELSIF v_n_red_direct > 0 OR v_n_critical > 0 OR v_n_below > 0 OR v_module_exposes THEN
    v_status := 'exposed';
  ELSIF v_n_answered > 0 AND v_n_answered = v_n_evidencing AND v_all_mitigated AND v_n_serious = 0 AND NOT v_module_bars THEN
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
    -- 1.1.0: the module facts that hold, in the model's order.
    FOR v_row IN
      SELECT m.reason_one, m.reason_many, (v_counts ->> m.code)::integer AS n
      FROM app.exposure_module_inputs() m
      WHERE m.head = p_head AND (v_counts ->> m.code)::integer > 0
      ORDER BY m.ord
    LOOP
      v_reasons := v_reasons || jsonb_build_array(jsonb_build_object('kind', 'status', 'text',
        CASE WHEN v_row.n = 1 THEN v_row.reason_one ELSE replace(v_row.reason_many, '{n}', v_row.n::text) END));
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

    -- 1.1.0 — (c) repetition: breaches in the window, on the one head that reads it.
    IF v_n_recent > 0 AND p_head = (SELECT only_head FROM app.exposure_position_factors() WHERE code = 'repetition') THEN
      v_factors := v_factors || jsonb_build_array(jsonb_build_object('code', 'repetition', 'clause', '(c)',
        'points', CASE WHEN v_n_recent = 1 THEN (SELECT points FROM app.exposure_position_factors() WHERE code = 'repetition')
                       ELSE (SELECT repeated_points FROM app.exposure_position_factors() WHERE code = 'repetition') END,
        'text', app.exposure_plural(v_n_recent, 'personal data breach', 'personal data breaches')
                || ' recorded in the last ' || app.exposure_repetition_window_months()::text || ' months.'));
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

-- The inputs, from the 1.2.0 body, plus the consent register.
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
    -- 1.1.0: a breach clock is hours — the instant the snapshot is taken.
    'now', app.iso_instant(now()),
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
      (SELECT to_char(o.sdf_notified_on, 'YYYY-MM-DD') FROM public.organizations o WHERE o.id = p_organization_id)),
    -- 1.1.0: every incident in the breach register, as `readBreachFacts` reads
    -- it — raw facts; the model decides what they mean.
    'breaches', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
               'status', b.status,
               'awareAt', app.iso_instant(b.aware_at),
               'boardReportDueAt', app.iso_instant(b.board_report_due_at),
               'boardReportAt', app.iso_instant(b.board_report_at),
               'principalsIntimatedAt', app.iso_instant(b.principals_intimated_at)) ORDER BY b.aware_at, b.id)
      FROM public.breach_incidents b
      WHERE b.organization_id = p_organization_id), '[]'::jsonb),
    -- 1.2.0: every request and grievance in the rights register, as
    -- `readRightsFacts` reads it — raw facts; the model decides what they mean.
    'rights', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
               'kind', r.kind,
               'status', r.status,
               'receivedOn', to_char(r.received_on, 'YYYY-MM-DD')) ORDER BY r.received_on, r.id)
      FROM public.rights_requests r
      WHERE r.organization_id = p_organization_id), '[]'::jsonb),
    -- 1.3.0: each principal's latest consent record, where it is on behalf of a
    -- child or a ward — what `consent_register_facts` returns to the TS reader.
    'consents', app.consent_model_facts(p_organization_id));

  RETURN jsonb_build_object('input', v_input, 'assessmentId', v_chosen, 'scoreSnapshotId', v_snapshot);
END;
$$;

REVOKE ALL ON FUNCTION app.exposure_evaluate_head(jsonb, text), app.exposure_input(uuid, date) FROM PUBLIC;


-- ===========================================================================
-- (10) Apply-time assertions
-- ===========================================================================

DO $$
DECLARE
  v_fn text;
BEGIN
  ASSERT array_length(app.consent_languages(), 1) = 23, 'English and the Eighth Schedule''s twenty-two';
  ASSERT app.consent_actions() = ARRAY['given', 'refused', 'withdrawn'], 'three actions';
  ASSERT (SELECT row(l.*)::text FROM app.consent_limits() l) = '(120,10)', 'the widget''s limits';
  ASSERT app.consent_verification_fits('child', 'rule_10_1_b_ii') AND app.consent_verification_fits('guardian_ward', 'rule_11_court'),
    'Rule 10 for a child, Rule 11 for a ward';
  ASSERT NOT app.consent_verification_fits('self', 'rule_10_1_a') AND NOT app.consent_verification_fits('child', 'rule_11_court'),
    'no basis for oneself; no crossing over';
  ASSERT app.notice_purposes_complete('[{"key": "admissions", "title": "Admissions", "uses": "Your application", "dataItems": ["Name"]}]'::jsonb),
    'a complete purpose';
  ASSERT NOT app.notice_purposes_complete('[{"key": "admissions", "title": "Admissions", "uses": "", "dataItems": ["Name"]}]'::jsonb),
    'a purpose says what it enables';
  ASSERT NOT app.notice_purposes_shape('[{"key": "Admissions", "title": "", "uses": "", "dataItems": []}]'::jsonb), 'a key is lower-case';
  ASSERT app.notice_purposes_shape('[]'::jsonb), 'a draft may be empty';
  -- The public functions are the server's, as public intake's are (D-086.1).
  FOREACH v_fn IN ARRAY ARRAY[
    'public.consent_notice(text, text)',
    'public.consent_widget(text)',
    'public.consent_record_public(text, text, uuid, text, text, text[], text, text)'] LOOP
    ASSERT NOT has_function_privilege('anon', v_fn, 'EXECUTE'), v_fn || ': anon may not execute it';
    ASSERT NOT has_function_privilege('authenticated', v_fn, 'EXECUTE'), v_fn || ': no signed-in user may execute it';
    ASSERT has_function_privilege('service_role', v_fn, 'EXECUTE'), v_fn || ': the server may';
  END LOOP;
  ASSERT NOT has_function_privilege('anon', 'public.record_consent(uuid, uuid, text, text, text[], text, text, text, text)', 'EXECUTE'),
    'anon records nothing';
  ASSERT NOT has_table_privilege('authenticated', 'public.consent_salts', 'SELECT'), 'nobody reads a salt';
  ASSERT NOT has_table_privilege('authenticated', 'public.consent_records', 'INSERT')
     AND NOT has_table_privilege('authenticated', 'public.consent_records', 'UPDATE')
     AND NOT has_table_privilege('authenticated', 'public.consent_records', 'DELETE'), 'records are written by functions only';
  -- The model.
  ASSERT app.exposure_model_version() = '1.3.0', 'model 1.3.0';
  ASSERT (SELECT count(*) FROM app.exposure_module_inputs()) = 5, 'five module rows in 1.3.0';
  ASSERT (SELECT string_agg(code || ':' || head || ':' || effect, ',' ORDER BY ord) FROM app.exposure_module_inputs() WHERE head = 'H3')
         = 'child_consent_unverified:H3:exposed', 'the head-3 row';
  -- Every existing limit count is still on its own surface.
  ASSERT NOT EXISTS (SELECT 1 FROM public.intake_attempts WHERE surface = 'consent'), 'no consent attempts yet';
END;
$$;
