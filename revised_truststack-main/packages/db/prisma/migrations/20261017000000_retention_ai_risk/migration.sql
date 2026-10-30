-- Slice 10, Stage 5 — the retention register and the AI risk register, and
-- exposure model 1.5.0 (SLICE_10 §6, §7c; D-079.6; D-094).
--
-- DPDP anchoring (the Act and the Gazette text, G.S.R. 846(E)):
--   * s.8(7): unless a law needs it kept, erase personal data when consent is
--     withdrawn or as soon as the specified purpose is no longer served,
--     whichever is earlier; and (b) cause the Data Processor to erase it too.
--   * Rule 8(3): EVERY fiduciary keeps personal data, the associated traffic
--     data and other logs of the processing for at least one year from the
--     processing, then has them erased unless another law needs longer.
--   * Rule 8(1)–(2), Third Schedule: ONLY the three listed classes — the
--     purpose is deemed no longer served after three years without the person
--     approaching the fiduciary, and the person is told at least forty-eight
--     hours before erasure. The class is RECORDED, never inferred (pitfall 1).
--   * Rule 13(3): algorithmic due diligence binds a Significant Data
--     Fiduciary only (head 4) — the AI risk register is enabling (D-073).
--
-- What is enforced HERE, not only in the application:
--   * A schedule's END DATE is DERIVED — start + period in calendar months (the
--     deemed basis: three years from the later of the last approach and the
--     Rules' commencement), a CHECKed row invariant; no user holds a grant on
--     it, nor on the Rule 8(2) inform-by date.
--   * Rule 8(3)'s floor: no period under twelve months, for any basis (a CHECK).
--   * Rule 8(1)–(2) only with a recorded Third-Schedule class
--     (`organizations.third_schedule_class`, organization.update, none by
--     default): the deemed basis is refused otherwise, and an erasure under it
--     records the day the person was told.
--   * Erasure records are APPEND-ONLY: who recorded it and when are stamped;
--     no user may update or delete one, and the trigger refuses an update even
--     to tooling.
--   * An erasure COUNTS (clears the overdue state, closes an action) only when
--     it is complete under s.8(7)(b) — every processor that held the data was
--     told to erase it, or none held it — and has not been marked as recorded
--     in error (D-096, R2 and R4).
--   * "Recorded in error" is its own append-only record
--     (`retention_erasure_voids`): one per erasure, with a reason, by someone
--     OTHER than the person who recorded the erasure; never changed or removed.
--   * Overdue erasure is work on the ONE action table (D-067): `gap_actions`
--     gains a fifth parent. Its action closes on accepted evidence, on an
--     erasure recorded for the current cycle by someone who is not its owner,
--     or on a reviewer who is not its owner (D-056, D-095).
--   * The AI risk register is written with `ropa.write` (D-094.2) and read
--     with `ropa.read` (D-096, R5); it has no action parent (D-094.3). It
--     records s.9(3)'s question — does the system track, behaviourally monitor
--     or target advertising at children — and, when it does, the Fourth
--     Schedule exemption relied on (the processing register's vocabulary).
--
-- The exposure model moves to 1.5.0 in this same migration — the retention
-- register's two head-7 rows (overdue erasure Exposed; no end recorded a
-- reason, D-094.1) and the AI risk register's one head-4 reason — mirrored in
-- packages/core/src/exposure.ts and held together by
-- tests/unit/exposure-mirror.test.ts and tests/rls/exposure-mirror.test.ts.
--
-- Additive: two permissions, one organisation column, four new tables, one
-- new action column, new functions, two CHECKs widened (every existing row
-- satisfies them), functions replaced in place. Nothing a live user holds is
-- revoked.
--
-- Layout: (1) permissions; (2) DDL; (3) vocabularies and row invariants;
-- (4) triggers; (5) actions — the fifth parent; (6) evidence link types;
-- (7) audit and the organisation guard; (8) grants + RLS; (9) exposure model
-- 1.5.0; (10) apply-time assertions.


-- ===========================================================================
-- (1) Permissions — a matrix change is core + a migration in one PR (D-020)
-- ===========================================================================

INSERT INTO public.permissions (code, description) VALUES
  ('retention.read', 'Read the retention register: how long each processing activity''s data is kept, when it ends, and the erasures recorded.'),
  ('retention.write', 'Record a retention schedule, an erasure and the actions an overdue erasure needs.');

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM (VALUES ('super_admin'), ('consultant'), ('organization_admin'), ('executive_sponsor'), ('dpdp_owner'), ('department_owner'), ('legal_user'), ('it_security_user'), ('procurement_user'), ('auditor_reviewer')) AS g(role_code)
JOIN public.roles r ON r.code = g.role_code
JOIN public.permissions p ON p.code = 'retention.read';

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM (VALUES ('super_admin'), ('consultant'), ('organization_admin'), ('dpdp_owner'), ('department_owner'), ('legal_user'), ('it_security_user'), ('procurement_user')) AS g(role_code)
JOIN public.roles r ON r.code = g.role_code
JOIN public.permissions p ON p.code = 'retention.write';


-- ===========================================================================
-- (2) DDL
-- ===========================================================================

-- AlterTable — Rule 8(1)'s Third-Schedule class, entered by a person, never
-- inferred from size or sector (D-028's rule, by analogy). Null = none.
ALTER TABLE "organizations" ADD COLUMN "third_schedule_class" TEXT;

-- CreateTable
CREATE TABLE "retention_schedules" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "ropa_record_id" UUID NOT NULL,
    "basis" TEXT NOT NULL,
    "period_months" INTEGER NOT NULL DEFAULT 12,
    "law_name" TEXT,
    "starts_on" DATE,
    "ends_on" DATE,
    "inform_by" DATE,
    "notes" TEXT,
    "created_by" UUID,
    "updated_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "retention_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "retention_schedules_organization_id_idx" ON "retention_schedules"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "retention_schedules_organization_id_id_key" ON "retention_schedules"("organization_id", "id");

-- CreateIndex — one schedule per processing activity.
CREATE UNIQUE INDEX "retention_schedules_organization_id_ropa_record_id_key" ON "retention_schedules"("organization_id", "ropa_record_id");

-- AddForeignKey
ALTER TABLE "retention_schedules" ADD CONSTRAINT "retention_schedules_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey — composite, so a schedule can only be for this organisation's record.
ALTER TABLE "retention_schedules" ADD CONSTRAINT "retention_schedules_organization_id_ropa_record_id_fkey" FOREIGN KEY ("organization_id", "ropa_record_id") REFERENCES "ropa_records"("organization_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "retention_schedules" ADD CONSTRAINT "retention_schedules_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "retention_schedules" ADD CONSTRAINT "retention_schedules_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable — an erasure, recorded once and never changed (s.8(7)).
CREATE TABLE "retention_erasures" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "retention_schedule_id" UUID NOT NULL,
    "erased_on" DATE NOT NULL,
    "method" TEXT NOT NULL,
    "method_note" TEXT,
    "processors_told" TEXT NOT NULL,
    "principals_informed_on" DATE,
    "recorded_by" UUID,
    "recorded_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "retention_erasures_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "retention_erasures_organization_id_idx" ON "retention_erasures"("organization_id");

-- CreateIndex
CREATE INDEX "retention_erasures_retention_schedule_id_idx" ON "retention_erasures"("retention_schedule_id");

-- AddForeignKey
ALTER TABLE "retention_erasures" ADD CONSTRAINT "retention_erasures_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "retention_erasures" ADD CONSTRAINT "retention_erasures_organization_id_retention_schedule_id_fkey" FOREIGN KEY ("organization_id", "retention_schedule_id") REFERENCES "retention_schedules"("organization_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "retention_erasures" ADD CONSTRAINT "retention_erasures_recorded_by_fkey" FOREIGN KEY ("recorded_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex — the key a void points at.
CREATE UNIQUE INDEX "retention_erasures_organization_id_id_key" ON "retention_erasures"("organization_id", "id");

-- CreateTable — an erasure marked as recorded in error (D-096, R4): recorded
-- once, never changed; the erasure itself stays, shown struck through.
CREATE TABLE "retention_erasure_voids" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "retention_erasure_id" UUID NOT NULL,
    "reason" TEXT NOT NULL,
    "voided_by" UUID,
    "voided_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "retention_erasure_voids_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "retention_erasure_voids_organization_id_idx" ON "retention_erasure_voids"("organization_id");

-- CreateIndex — an erasure is marked in error once.
CREATE UNIQUE INDEX "retention_erasure_voids_organization_id_retention_erasure_id_key" ON "retention_erasure_voids"("organization_id", "retention_erasure_id");

-- AddForeignKey
ALTER TABLE "retention_erasure_voids" ADD CONSTRAINT "retention_erasure_voids_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey — composite, so a void can only be for this organisation's erasure.
ALTER TABLE "retention_erasure_voids" ADD CONSTRAINT "retention_erasure_voids_organization_id_retention_erasure_id_fkey" FOREIGN KEY ("organization_id", "retention_erasure_id") REFERENCES "retention_erasures"("organization_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "retention_erasure_voids" ADD CONSTRAINT "retention_erasure_voids_voided_by_fkey" FOREIGN KEY ("voided_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable — the AI risk register: one row per AI system or AI use.
CREATE TABLE "ai_systems" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "system_id" UUID,
    "usage_type" TEXT,
    "name" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "personal_data" TEXT NOT NULL,
    "child_tracking" TEXT NOT NULL DEFAULT 'unknown',
    "child_exemption" TEXT,
    "human_review" TEXT,
    "status" TEXT NOT NULL DEFAULT 'in_use',
    "last_reviewed_on" DATE,
    "review_recorded_by" UUID,
    "review_recorded_at" TIMESTAMPTZ(6),
    "created_by" UUID,
    "updated_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_systems_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ai_systems_organization_id_idx" ON "ai_systems"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "ai_systems_organization_id_id_key" ON "ai_systems"("organization_id", "id");

-- CreateIndex — a system is in the register once.
CREATE UNIQUE INDEX "ai_systems_organization_id_system_id_key" ON "ai_systems"("organization_id", "system_id");

-- AddForeignKey
ALTER TABLE "ai_systems" ADD CONSTRAINT "ai_systems_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey — composite, so a row names only this organisation's system. A
-- system removed from the scope leaves its row standing, unlinked: the review
-- history is the register's, not the system's.
ALTER TABLE "ai_systems" ADD CONSTRAINT "ai_systems_organization_id_system_id_fkey" FOREIGN KEY ("organization_id", "system_id") REFERENCES "systems"("organization_id", "id") ON DELETE SET NULL ("system_id") ON UPDATE CASCADE;
ALTER TABLE "ai_systems" ADD CONSTRAINT "ai_systems_review_recorded_by_fkey" FOREIGN KEY ("review_recorded_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ai_systems" ADD CONSTRAINT "ai_systems_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ai_systems" ADD CONSTRAINT "ai_systems_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable — an action now has exactly one of FIVE parents: an assessment
-- gap, a ROPA gap, a breach, a Data Principal's request, or a retention
-- schedule whose erasure is owed. One action table (D-060, D-067).
ALTER TABLE "gap_actions" ADD COLUMN "retention_schedule_id" UUID;

-- CreateIndex
CREATE INDEX "gap_actions_retention_schedule_id_idx" ON "gap_actions"("retention_schedule_id");

-- AddForeignKey — composite, so an action can never point at another tenant's schedule.
ALTER TABLE "gap_actions" ADD CONSTRAINT "gap_actions_organization_id_retention_schedule_id_fkey" FOREIGN KEY ("organization_id", "retention_schedule_id") REFERENCES "retention_schedules"("organization_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE public.gap_actions DROP CONSTRAINT gap_actions_one_parent;
ALTER TABLE public.gap_actions
  ADD CONSTRAINT gap_actions_one_parent CHECK (num_nonnulls(gap_id, ropa_gap_id, breach_incident_id, rights_request_id, retention_schedule_id) = 1);

-- A third way to close, for a retention schedule's action only (D-095).
ALTER TABLE public.gap_actions DROP CONSTRAINT gap_actions_closure_basis_check;
ALTER TABLE public.gap_actions
  ADD CONSTRAINT gap_actions_closure_basis_check
    CHECK (closure_basis IS NULL OR closure_basis IN ('evidence', 'reviewer_approval', 'erasure_recorded')),
  ADD CONSTRAINT gap_actions_erasure_basis_is_retention
    CHECK (closure_basis IS DISTINCT FROM 'erasure_recorded' OR retention_schedule_id IS NOT NULL);


-- ===========================================================================
-- (3) Vocabularies (mirror packages/core/src/retention.ts, ai-risk.ts) and row invariants
-- ===========================================================================

CREATE OR REPLACE FUNCTION app.retention_bases()
RETURNS text[]
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = ''
AS $$
  SELECT ARRAY['purpose_served', 'consent_withdrawn', 'fixed_period', 'legal_requirement', 'deemed_inactivity']::text[];
$$;

-- Rule 8(3): at least one year from the processing — statute, for every client.
CREATE OR REPLACE FUNCTION app.retention_min_months()
RETURNS integer
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = ''
AS $$
  SELECT 12;
$$;

-- Rule 8(1), Third Schedule: three years without the person approaching the fiduciary.
CREATE OR REPLACE FUNCTION app.retention_deemed_months()
RETURNS integer
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = ''
AS $$
  SELECT 36;
$$;

-- The Third Schedule counts from the last approach "or the commencement of the
-- Rules, whichever is latest": read as their publication — FOR COUNSEL (core
-- RETENTION_RULES_COMMENCED_ON).
CREATE OR REPLACE FUNCTION app.retention_rules_commenced_on()
RETURNS date
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = ''
AS $$
  SELECT DATE '2025-11-13';
$$;

-- Rule 8(2): forty-eight hours, kept as two calendar days before the end date.
CREATE OR REPLACE FUNCTION app.retention_notice_days()
RETURNS integer
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = ''
AS $$
  SELECT 2;
$$;

CREATE OR REPLACE FUNCTION app.erasure_methods()
RETURNS text[]
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = ''
AS $$
  SELECT ARRAY['deleted', 'anonymised', 'destroyed', 'other']::text[];
$$;

CREATE OR REPLACE FUNCTION app.third_schedule_classes()
RETURNS text[]
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = ''
AS $$
  SELECT ARRAY['ecommerce', 'online_gaming', 'social_media']::text[];
$$;

-- core AI_REGISTER_USAGE_TYPES: the scope's AI uses, never 'none'.
CREATE OR REPLACE FUNCTION app.ai_register_usage_types()
RETURNS text[]
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = ''
AS $$
  SELECT ARRAY['proctoring', 'chatbot', 'analytics', 'scoring', 'recommendation']::text[];
$$;

-- A TrustStack DEFAULT, never statute: Rule 13(3) sets no interval (core AI_REVIEW_MONTHS).
CREATE OR REPLACE FUNCTION app.ai_review_months()
RETURNS integer
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = ''
AS $$
  SELECT 12;
$$;

-- THE end date (core `retentionEndsOn`): start + period in calendar months, as
-- `date + interval` counts them (clamped to the month's end); the deemed basis
-- counts three years from the later of the start and the Rules' commencement.
CREATE OR REPLACE FUNCTION app.retention_ends_on(p_basis text, p_starts_on date, p_period_months integer)
RETURNS date
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = ''
AS $$
  SELECT CASE
    WHEN p_starts_on IS NULL THEN NULL
    WHEN p_basis = 'deemed_inactivity'
      THEN (greatest(p_starts_on, app.retention_rules_commenced_on()) + make_interval(months => app.retention_deemed_months()))::date
    ELSE (p_starts_on + make_interval(months => p_period_months))::date
  END;
$$;

REVOKE ALL ON FUNCTION app.retention_bases(), app.retention_min_months(), app.retention_deemed_months(),
  app.retention_rules_commenced_on(), app.retention_notice_days(), app.erasure_methods(), app.third_schedule_classes(),
  app.ai_register_usage_types(), app.ai_review_months(), app.retention_ends_on(text, date, integer) FROM PUBLIC;
-- The CHECKs below call these as the writing user, so they need them.
GRANT EXECUTE ON FUNCTION app.retention_bases(), app.retention_min_months(), app.retention_deemed_months(),
  app.retention_rules_commenced_on(), app.retention_notice_days(), app.erasure_methods(), app.third_schedule_classes(),
  app.ai_register_usage_types(), app.retention_ends_on(text, date, integer) TO authenticated;

ALTER TABLE public.organizations
  ADD CONSTRAINT organizations_third_schedule_class_check
    CHECK (third_schedule_class IS NULL OR third_schedule_class = ANY (app.third_schedule_classes()));

ALTER TABLE public.retention_schedules
  ADD CONSTRAINT retention_schedules_basis_check CHECK (basis = ANY (app.retention_bases())),
  -- Rule 8(3): never under a year, for any basis; a century at most.
  ADD CONSTRAINT retention_schedules_period_floor CHECK (period_months >= app.retention_min_months() AND period_months <= 1200),
  -- Rule 8(1): the Third Schedule sets the period itself.
  ADD CONSTRAINT retention_schedules_deemed_period CHECK (basis <> 'deemed_inactivity' OR period_months = app.retention_deemed_months()),
  -- A law that requires keeping the data is named; nothing else names one.
  ADD CONSTRAINT retention_schedules_law CHECK (
    (basis = 'legal_requirement') = (law_name IS NOT NULL) AND (law_name IS NULL OR btrim(law_name) <> '')),
  ADD CONSTRAINT retention_schedules_text_lengths CHECK (char_length(law_name) <= 200 AND char_length(notes) <= 2000),
  -- No retention under the Act started before it received assent (11 Aug 2023).
  ADD CONSTRAINT retention_schedules_starts_after_act CHECK (starts_on IS NULL OR starts_on >= DATE '2023-08-11'),
  -- THE end date and the Rule 8(2) inform-by date: derived, row invariants, never sent by a client.
  ADD CONSTRAINT retention_schedules_ends_on_is_derived
    CHECK (ends_on IS NOT DISTINCT FROM app.retention_ends_on(basis, starts_on, period_months)),
  ADD CONSTRAINT retention_schedules_inform_by_is_derived
    CHECK (inform_by IS NOT DISTINCT FROM CASE WHEN basis = 'deemed_inactivity' AND ends_on IS NOT NULL
                                               THEN ends_on - app.retention_notice_days() END);

ALTER TABLE public.retention_erasures
  ADD CONSTRAINT retention_erasures_method_check CHECK (method = ANY (app.erasure_methods())),
  -- "Another way" says which.
  ADD CONSTRAINT retention_erasures_method_note CHECK (
    (method <> 'other' OR (method_note IS NOT NULL AND btrim(method_note) <> '')) AND char_length(method_note) <= 500),
  -- s.8(7)(b): was each processor that held it told to erase it?
  ADD CONSTRAINT retention_erasures_processors_told_check CHECK (processors_told IN ('yes', 'no', 'not_applicable')),
  ADD CONSTRAINT retention_erasures_after_act CHECK (erased_on >= DATE '2023-08-11'),
  ADD CONSTRAINT retention_erasures_informed_before CHECK (principals_informed_on IS NULL OR principals_informed_on <= erased_on);

ALTER TABLE public.retention_erasure_voids
  -- Why it was recorded in error, in words (never the erased personal data).
  ADD CONSTRAINT retention_erasure_voids_reason CHECK (btrim(reason) <> '' AND char_length(reason) <= 500);

ALTER TABLE public.ai_systems
  ADD CONSTRAINT ai_systems_usage_type_check CHECK (usage_type IS NULL OR usage_type = ANY (app.ai_register_usage_types())),
  -- s.9(3): does it track, behaviourally monitor or target advertising at children?
  ADD CONSTRAINT ai_systems_child_tracking_check CHECK (child_tracking IN ('yes', 'no', 'unknown')),
  -- The Fourth Schedule exemption relied on (Rule 12) — only when it does, and
  -- one of the processing register's eleven.
  ADD CONSTRAINT ai_systems_child_exemption_check CHECK (
    child_exemption IS NULL OR (child_tracking = 'yes' AND child_exemption = ANY (app.ropa_child_exemptions()))),
  ADD CONSTRAINT ai_systems_status_check CHECK (status IN ('in_use', 'retired')),
  ADD CONSTRAINT ai_systems_text_lengths CHECK (
    btrim(name) <> '' AND char_length(name) <= 200
    AND btrim(purpose) <> '' AND char_length(purpose) <= 2000
    AND btrim(personal_data) <> '' AND char_length(personal_data) <= 2000
    AND char_length(human_review) <= 2000),
  ADD CONSTRAINT ai_systems_reviewed_after_act CHECK (last_reviewed_on IS NULL OR last_reviewed_on >= DATE '2023-08-11'),
  -- A review: the day and its record, together.
  ADD CONSTRAINT ai_systems_review_whole CHECK ((last_reviewed_on IS NULL) = (review_recorded_at IS NULL));

CREATE TRIGGER retention_schedules_touch_updated_at BEFORE UPDATE ON public.retention_schedules
  FOR EACH ROW EXECUTE FUNCTION app.touch_updated_at();
CREATE TRIGGER ai_systems_touch_updated_at BEFORE UPDATE ON public.ai_systems
  FOR EACH ROW EXECUTE FUNCTION app.touch_updated_at();


-- ===========================================================================
-- (4) Triggers — derivation, stamps and the rules the CHECKs cannot see
-- ===========================================================================
-- With a user's JWT every rule applies. Tooling (migrations, the seed) has no
-- JWT: it is trusted to set stamps, but the CHECKs above still hold.

CREATE OR REPLACE FUNCTION app.retention_schedule_before_write()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_actor uuid := app.current_user_id();
  -- Every date here is a date in India (D-055).
  v_today date := (now() AT TIME ZONE 'Asia/Kolkata')::date;
  v_class text;
BEGIN
  IF TG_OP = 'UPDATE' AND (NEW.organization_id, NEW.ropa_record_id) IS DISTINCT FROM (OLD.organization_id, OLD.ropa_record_id) THEN
    RAISE EXCEPTION 'A schedule keeps its organisation and its processing activity.' USING ERRCODE = 'TS422';
  END IF;

  -- Rule 8(1)–(2) only for a recorded Third-Schedule class — never inferred.
  IF NEW.basis = 'deemed_inactivity' THEN
    SELECT o.third_schedule_class INTO v_class FROM public.organizations o WHERE o.id = NEW.organization_id;
    IF v_class IS NULL THEN
      RAISE EXCEPTION 'The three-year period of Rule 8(1) applies only to an organisation in a Third-Schedule class — record the class first.'
        USING ERRCODE = 'TS422';
    END IF;
  END IF;

  IF v_actor IS NOT NULL THEN
    -- RLS already refuses anyone without retention.write; this is the second lock, with a message.
    IF NOT app.has_permission(NEW.organization_id, 'retention.write') THEN
      RAISE EXCEPTION 'You do not have permission to change the retention register.' USING ERRCODE = 'TS403';
    END IF;
    -- The clock starts on something that has happened (India's calendar).
    IF NEW.starts_on > v_today THEN
      RAISE EXCEPTION 'A date in the register cannot be in the future.' USING ERRCODE = 'TS422';
    END IF;
    IF TG_OP = 'INSERT' THEN
      NEW.created_by := v_actor;
    END IF;
    NEW.updated_by := v_actor;
  END IF;

  -- THE end date and the inform-by date (Rule 8(2)) — the database's, always.
  NEW.ends_on := app.retention_ends_on(NEW.basis, NEW.starts_on, NEW.period_months);
  NEW.inform_by := CASE WHEN NEW.basis = 'deemed_inactivity' AND NEW.ends_on IS NOT NULL
                        THEN NEW.ends_on - app.retention_notice_days() END;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION app.retention_schedule_before_write() FROM PUBLIC;

CREATE TRIGGER retention_schedules_before_write
  BEFORE INSERT OR UPDATE ON public.retention_schedules
  FOR EACH ROW EXECUTE FUNCTION app.retention_schedule_before_write();

-- An erasure is recorded once and never changed: a correction is a new record
-- (the audit log keeps both). The update guard holds for tooling too.
CREATE OR REPLACE FUNCTION app.retention_erasure_before_write()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_actor uuid := app.current_user_id();
  v_today date := (now() AT TIME ZONE 'Asia/Kolkata')::date;
  v_basis text;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    RAISE EXCEPTION 'An erasure record is never changed — record a new one.' USING ERRCODE = 'TS409';
  END IF;

  SELECT s.basis INTO v_basis
  FROM public.retention_schedules s
  WHERE s.organization_id = NEW.organization_id AND s.id = NEW.retention_schedule_id;
  -- Rule 8(2): under the deemed basis, the day the person was told is recorded;
  -- under any other basis there is no such duty, so nothing is recorded.
  IF v_basis = 'deemed_inactivity' AND NEW.principals_informed_on IS NULL THEN
    RAISE EXCEPTION 'Record the day the Data Principals were told, at least 48 hours before the erasure (Rule 8(2)).' USING ERRCODE = 'TS422';
  END IF;
  IF v_basis IS DISTINCT FROM 'deemed_inactivity' AND NEW.principals_informed_on IS NOT NULL THEN
    RAISE EXCEPTION 'The 48-hour notice of Rule 8(2) applies only under the Third-Schedule period.' USING ERRCODE = 'TS422';
  END IF;

  IF v_actor IS NOT NULL THEN
    IF NOT app.has_permission(NEW.organization_id, 'retention.write') THEN
      RAISE EXCEPTION 'You do not have permission to change the retention register.' USING ERRCODE = 'TS403';
    END IF;
    IF NEW.erased_on > v_today OR NEW.principals_informed_on > v_today THEN
      RAISE EXCEPTION 'A date in the register cannot be in the future.' USING ERRCODE = 'TS422';
    END IF;
    -- Who recorded it, and when — stamped, never sent.
    NEW.recorded_by := v_actor;
    NEW.recorded_at := now();
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION app.retention_erasure_before_write() FROM PUBLIC;

CREATE TRIGGER retention_erasures_before_write
  BEFORE INSERT OR UPDATE ON public.retention_erasures
  FOR EACH ROW EXECUTE FUNCTION app.retention_erasure_before_write();

-- "Recorded in error" (D-096, R4): recorded once, never changed, and by
-- someone other than the person who recorded the erasure — two people, as
-- every closing in the product (D-056). The update guard holds for tooling too.
CREATE OR REPLACE FUNCTION app.retention_erasure_void_before_write()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_actor uuid := app.current_user_id();
  v_recorded_by uuid;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    RAISE EXCEPTION 'A record that an erasure was made in error is never changed.' USING ERRCODE = 'TS409';
  END IF;

  IF v_actor IS NOT NULL THEN
    IF NOT app.has_permission(NEW.organization_id, 'retention.write') THEN
      RAISE EXCEPTION 'You do not have permission to change the retention register.' USING ERRCODE = 'TS403';
    END IF;
    SELECT x.recorded_by INTO v_recorded_by
    FROM public.retention_erasures x
    WHERE x.organization_id = NEW.organization_id AND x.id = NEW.retention_erasure_id;
    IF v_recorded_by = v_actor THEN
      RAISE EXCEPTION 'Someone other than the person who recorded this erasure marks it as recorded in error.' USING ERRCODE = 'TS409';
    END IF;
    -- Who marked it, and when — stamped, never sent.
    NEW.voided_by := v_actor;
    NEW.voided_at := now();
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION app.retention_erasure_void_before_write() FROM PUBLIC;

CREATE TRIGGER retention_erasure_voids_before_write
  BEFORE INSERT OR UPDATE ON public.retention_erasure_voids
  FOR EACH ROW EXECUTE FUNCTION app.retention_erasure_void_before_write();

CREATE OR REPLACE FUNCTION app.ai_system_before_write()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_actor uuid := app.current_user_id();
  v_today date := (now() AT TIME ZONE 'Asia/Kolkata')::date;
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.organization_id IS DISTINCT FROM OLD.organization_id THEN
    RAISE EXCEPTION 'A row keeps its organisation.' USING ERRCODE = 'TS422';
  END IF;

  IF v_actor IS NOT NULL THEN
    -- Written with ropa.write (D-094.2); RLS refuses anyone else, this says why.
    IF NOT app.has_permission(NEW.organization_id, 'ropa.write') THEN
      RAISE EXCEPTION 'You do not have permission to change the AI risk register.' USING ERRCODE = 'TS403';
    END IF;
    IF NEW.last_reviewed_on > v_today THEN
      RAISE EXCEPTION 'A date in the register cannot be in the future.' USING ERRCODE = 'TS422';
    END IF;
    -- A recorded review may be corrected, never removed: removing it would erase that it happened.
    IF TG_OP = 'UPDATE' AND OLD.last_reviewed_on IS NOT NULL AND NEW.last_reviewed_on IS NULL THEN
      RAISE EXCEPTION 'A recorded review cannot be removed — correct it instead.' USING ERRCODE = 'TS409';
    END IF;
    -- Who recorded the review, and when — stamped, never sent.
    IF TG_OP = 'INSERT' OR NEW.last_reviewed_on IS DISTINCT FROM OLD.last_reviewed_on THEN
      NEW.review_recorded_by := CASE WHEN NEW.last_reviewed_on IS NULL THEN NULL ELSE v_actor END;
      NEW.review_recorded_at := CASE WHEN NEW.last_reviewed_on IS NULL THEN NULL ELSE now() END;
    ELSE
      NEW.review_recorded_by := OLD.review_recorded_by;
      NEW.review_recorded_at := OLD.review_recorded_at;
    END IF;
    IF TG_OP = 'INSERT' THEN
      NEW.created_by := v_actor;
    END IF;
    NEW.updated_by := v_actor;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION app.ai_system_before_write() FROM PUBLIC;

CREATE TRIGGER ai_systems_before_write
  BEFORE INSERT OR UPDATE ON public.ai_systems
  FOR EACH ROW EXECUTE FUNCTION app.ai_system_before_write();


-- ===========================================================================
-- (5) Actions — the fifth parent
-- ===========================================================================

-- The shared action trigger, from its Stage 2 body, with TWO changes: an
-- action can be moved to no other parent of any of the five kinds; and a
-- retention schedule's action may also close on an erasure recorded for the
-- schedule's current cycle by someone who is not the action's owner — still
-- two people (D-056, D-095) — an erasure that COUNTS: complete under
-- s.8(7)(b) and not marked as recorded in error (D-096). Everything else is
-- unchanged.
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
  IF (NEW.organization_id, NEW.gap_id, NEW.ropa_gap_id, NEW.breach_incident_id, NEW.rights_request_id, NEW.retention_schedule_id)
     IS DISTINCT FROM (OLD.organization_id, OLD.gap_id, OLD.ropa_gap_id, OLD.breach_incident_id, OLD.rights_request_id, OLD.retention_schedule_id) THEN
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
      ELSIF NEW.retention_schedule_id IS NOT NULL AND EXISTS (
        -- Stage 5: the erasure, recorded for the schedule's current cycle (on
        -- or after its clock started, or any, when none has), by someone else
        -- — and one that counts: the processors told, or none held the data
        -- (s.8(7)(b)), and not marked as recorded in error (D-096).
        SELECT 1
        FROM public.retention_erasures x
        JOIN public.retention_schedules s ON s.organization_id = x.organization_id AND s.id = x.retention_schedule_id
        WHERE x.organization_id = NEW.organization_id
          AND x.retention_schedule_id = NEW.retention_schedule_id
          AND (s.starts_on IS NULL OR x.erased_on >= s.starts_on)
          AND x.recorded_by IS DISTINCT FROM NEW.owner_user_id
          AND x.processors_told <> 'no'
          AND NOT EXISTS (
            SELECT 1 FROM public.retention_erasure_voids v
            WHERE v.organization_id = x.organization_id AND v.retention_erasure_id = x.id)
      ) THEN
        NEW.closure_basis := 'erasure_recorded';
      ELSIF v_actor IS NOT NULL
            AND v_actor <> NEW.owner_user_id
            AND app.has_permission(NEW.organization_id, 'evidence.review') THEN
        NEW.closure_basis := 'reviewer_approval';
      ELSIF NEW.retention_schedule_id IS NOT NULL THEN
        RAISE EXCEPTION 'Closing needs reviewed evidence attached to this action, the erasure recorded on its schedule by someone other than its owner, or approval by a reviewer who is not its owner.'
          USING ERRCODE = 'TS409';
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

-- An overdue erasure is work for people — find the copies, erase them, tell the
-- processors — so, like a request's, it needs a way IN. This is the one door:
-- users still hold no INSERT grant on gap_actions.
CREATE OR REPLACE FUNCTION public.add_retention_action(
  p_organization_id uuid,
  p_retention_schedule_id uuid,
  p_title text,
  p_owner_user_id uuid,
  p_due_date date
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_actor uuid := app.current_user_id();
  v_title text := btrim(p_title);
  v_id uuid;
BEGIN
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'Sign in to continue.' USING ERRCODE = 'TS401';
  END IF;
  IF NOT (app.has_permission(p_organization_id, 'retention.write') AND app.has_permission(p_organization_id, 'gap.write')) THEN
    RAISE EXCEPTION 'You do not have permission to add an action to this schedule.' USING ERRCODE = 'TS403';
  END IF;
  PERFORM 1
  FROM public.retention_schedules s
  WHERE s.id = p_retention_schedule_id AND s.organization_id = p_organization_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Schedule not found.' USING ERRCODE = 'TS404';
  END IF;
  IF v_title IS NULL OR v_title = '' OR char_length(v_title) > 500 THEN
    RAISE EXCEPTION 'An action needs a title of up to 500 characters.' USING ERRCODE = 'TS422';
  END IF;
  IF p_owner_user_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.organization_users ou
    WHERE ou.organization_id = p_organization_id AND ou.user_id = p_owner_user_id AND ou.status = 'active'
  ) THEN
    RAISE EXCEPTION 'The owner must be an active member of this organisation.' USING ERRCODE = 'TS422';
  END IF;

  INSERT INTO public.gap_actions (organization_id, retention_schedule_id, title, owner_user_id, status, due_date, updated_by)
  VALUES (p_organization_id, p_retention_schedule_id, v_title, p_owner_user_id, 'open', p_due_date, v_actor)
  RETURNING id INTO v_id;

  -- ONE audit row, as the person. The title is free text: never logged.
  INSERT INTO public.audit_logs (organization_id, user_id, event_type, entity_type, entity_id, description, metadata)
  VALUES (
    p_organization_id, v_actor, 'retention.action.created', 'gap_actions', v_id, 'Added an action to a retention schedule',
    jsonb_strip_nulls(jsonb_build_object(
      'retentionScheduleId', p_retention_schedule_id,
      'ownerUserId', p_owner_user_id,
      'dueDate', to_char(p_due_date, 'YYYY-MM-DD'))));

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.add_retention_action(uuid, uuid, text, uuid, date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.add_retention_action(uuid, uuid, text, uuid, date) TO authenticated;


-- ===========================================================================
-- (6) Evidence link types — `retention_schedule` (the erasure certificate)
--     and `ai_system` (a review, an impact assessment)
-- ===========================================================================
-- Each function is its 20261015000000_processor_register body with the two new
-- branches and nothing else changed. Attaching is work on the register:
-- retention.write for a schedule, ropa.write for an AI system. Neither locks a
-- link against detaching — no approval stands on it. The evidence index learns
-- to read both types in Stage 6 with the others.

ALTER TABLE public.evidence_links DROP CONSTRAINT evidence_links_entity_type_check;
ALTER TABLE public.evidence_links
  ADD CONSTRAINT evidence_links_entity_type_check
    CHECK (linked_entity_type IN ('assessment_response', 'gap_action', 'ropa_record', 'vendor', 'retention_schedule', 'ai_system'));

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
  ELSIF NEW.linked_entity_type = 'ropa_record' THEN
    SELECT rr.status INTO v_status
    FROM public.ropa_records rr
    WHERE rr.id = NEW.linked_entity_id AND rr.organization_id = NEW.organization_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Record not found.' USING ERRCODE = 'TS404';
    END IF;
    IF v_status = 'archived' THEN
      RAISE EXCEPTION 'This record is archived — restore it before attaching evidence.' USING ERRCODE = 'TS409';
    END IF;
    -- Attaching evidence to a record is work on the register.
    IF v_actor IS NOT NULL AND NOT app.has_permission(NEW.organization_id, 'ropa.write') THEN
      RAISE EXCEPTION 'You do not have permission to change this record.' USING ERRCODE = 'TS403';
    END IF;
  ELSIF NEW.linked_entity_type = 'vendor' THEN
    PERFORM 1
    FROM public.vendors v
    WHERE v.id = NEW.linked_entity_id AND v.organization_id = NEW.organization_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Vendor not found.' USING ERRCODE = 'TS404';
    END IF;
    -- Attaching a vendor's document is work on its assessment.
    IF v_actor IS NOT NULL AND NOT app.has_permission(NEW.organization_id, 'vendor.assess') THEN
      RAISE EXCEPTION 'You do not have permission to attach a document to this vendor.' USING ERRCODE = 'TS403';
    END IF;
  ELSIF NEW.linked_entity_type = 'retention_schedule' THEN
    PERFORM 1
    FROM public.retention_schedules s
    WHERE s.id = NEW.linked_entity_id AND s.organization_id = NEW.organization_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Schedule not found.' USING ERRCODE = 'TS404';
    END IF;
    -- Attaching an erasure certificate is work on the retention register.
    IF v_actor IS NOT NULL AND NOT app.has_permission(NEW.organization_id, 'retention.write') THEN
      RAISE EXCEPTION 'You do not have permission to change the retention register.' USING ERRCODE = 'TS403';
    END IF;
  ELSIF NEW.linked_entity_type = 'ai_system' THEN
    PERFORM 1
    FROM public.ai_systems a
    WHERE a.id = NEW.linked_entity_id AND a.organization_id = NEW.organization_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'AI system not found.' USING ERRCODE = 'TS404';
    END IF;
    -- Attaching a review is work on the AI risk register (ropa.write, D-094.2).
    IF v_actor IS NOT NULL AND NOT app.has_permission(NEW.organization_id, 'ropa.write') THEN
      RAISE EXCEPTION 'You do not have permission to change the AI risk register.' USING ERRCODE = 'TS403';
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

  IF OLD.linked_entity_type = 'ropa_record' THEN
    SELECT rr.status INTO v_status
    FROM public.ropa_records rr
    WHERE rr.id = OLD.linked_entity_id AND rr.organization_id = OLD.organization_id;
    v_target_exists := FOUND;

    -- An approved record may be standing on this artefact. Reopen it first.
    IF v_target_exists AND v_evidence_exists AND v_status = 'approved' THEN
      RAISE EXCEPTION 'This record is approved — reopen it before detaching its evidence.' USING ERRCODE = 'TS409';
    END IF;
    RETURN OLD;
  END IF;

  IF OLD.linked_entity_type = 'vendor' THEN
    v_target_exists := EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = OLD.linked_entity_id AND v.organization_id = OLD.organization_id);
    -- An answer cites this document — an accepted assessment may stand on it.
    -- (The organisation's own deletion removes everything.)
    IF v_target_exists AND v_evidence_exists
       AND EXISTS (SELECT 1 FROM public.organizations o WHERE o.id = OLD.organization_id) AND EXISTS (
         SELECT 1 FROM public.vendor_assessment_answers x
         JOIN public.vendor_assessments a ON a.organization_id = x.organization_id AND a.id = x.assessment_id
         WHERE x.organization_id = OLD.organization_id AND x.evidence_id = OLD.evidence_id AND a.vendor_id = OLD.linked_entity_id) THEN
      RAISE EXCEPTION 'An assessment of this vendor cites this document — it stays attached.' USING ERRCODE = 'TS409';
    END IF;
    RETURN OLD;
  END IF;

  -- Stage 5: no approval stands on a schedule's or an AI system's documents.
  IF OLD.linked_entity_type IN ('retention_schedule', 'ai_system') THEN
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


-- ===========================================================================
-- (7) Audit — from the Stage 3b body: the new rows are audited by the same
--     trigger; free text never logged; derived and stamped columns never
--     reported as edits. And the organisation guard, with the Third-Schedule
--     class.
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
                        'published_at', 'published_by',
                        -- Slice 10 Stage 5: the end and inform-by dates are derived, the review stamped
                        'ends_on', 'inform_by', 'review_recorded_by', 'review_recorded_at')
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
    )
    -- Slice 10 Stage 5: a schedule's basis, period and dates; an erasure's
    -- day, method and the processors' answer; which erasure was marked in
    -- error; an AI row's use, status, children's answer and review day — never
    -- a note, a law's name, the reason for a void, the purpose, the personal
    -- data or the human-review step: free text. A second object: one call takes at
    -- most 100 arguments.
    || jsonb_build_object(
      'retentionScheduleId', v_row ->> 'retention_schedule_id',
      'retentionErasureId', v_row ->> 'retention_erasure_id',
      'retentionBasis', CASE WHEN TG_TABLE_NAME = 'retention_schedules' THEN v_row ->> 'basis' END,
      'periodMonths', CASE WHEN TG_TABLE_NAME = 'retention_schedules' THEN v_row -> 'period_months' END,
      'startsOn', v_row ->> 'starts_on',
      'endsOn', v_row ->> 'ends_on',
      'erasedOn', v_row ->> 'erased_on',
      'erasureMethod', CASE WHEN TG_TABLE_NAME = 'retention_erasures' THEN v_row ->> 'method' END,
      'processorsTold', v_row ->> 'processors_told',
      'principalsInformedOn', v_row ->> 'principals_informed_on',
      'aiUsageType', CASE WHEN TG_TABLE_NAME = 'ai_systems' THEN v_row ->> 'usage_type' END,
      'aiStatus', CASE WHEN TG_TABLE_NAME = 'ai_systems' THEN v_row ->> 'status' END,
      'childTracking', CASE WHEN TG_TABLE_NAME = 'ai_systems' THEN v_row ->> 'child_tracking' END,
      'childExemption', CASE WHEN TG_TABLE_NAME = 'ai_systems' THEN v_row ->> 'child_exemption' END,
      'lastReviewedOn', v_row ->> 'last_reviewed_on'
    ))
  );
  RETURN NULL;
END;
$$;

CREATE TRIGGER retention_schedules_audit
  AFTER INSERT OR UPDATE ON public.retention_schedules
  FOR EACH ROW EXECUTE FUNCTION app.audit_scope_change('retention');
CREATE TRIGGER retention_erasures_audit
  AFTER INSERT ON public.retention_erasures
  FOR EACH ROW EXECUTE FUNCTION app.audit_scope_change('retention');
CREATE TRIGGER retention_erasure_voids_audit
  AFTER INSERT ON public.retention_erasure_voids
  FOR EACH ROW EXECUTE FUNCTION app.audit_scope_change('retention');
CREATE TRIGGER ai_systems_audit
  AFTER INSERT OR UPDATE ON public.ai_systems
  FOR EACH ROW EXECUTE FUNCTION app.audit_scope_change('ai_risk');

-- The class joins the editable set; the guard, from its Stage 3a body, gives it
-- to `organization.update` only, like the SDF notification — and refuses to
-- clear it while a schedule runs on the deemed basis.
GRANT UPDATE (third_schedule_class) ON public.organizations TO authenticated;

CREATE OR REPLACE FUNCTION app.guard_organization_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Slice 10 Stage 5: a schedule on the Third-Schedule period needs the class, for tooling too.
  IF NEW.third_schedule_class IS NULL AND OLD.third_schedule_class IS NOT NULL AND EXISTS (
       SELECT 1 FROM public.retention_schedules s WHERE s.organization_id = OLD.id AND s.basis = 'deemed_inactivity') THEN
    RAISE EXCEPTION 'A retention schedule runs on the Third-Schedule period — change it before clearing the class.' USING ERRCODE = 'TS409';
  END IF;
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
  -- Slice 10 Stage 5: the Third-Schedule class (Rule 8(1)) — entered, never inferred.
  IF NEW.third_schedule_class IS DISTINCT FROM OLD.third_schedule_class
     AND NOT app.has_permission(OLD.id, 'organization.update') THEN
    RAISE EXCEPTION 'You do not have permission to record a Third-Schedule class.' USING ERRCODE = 'TS403';
  END IF;
  RETURN NEW;
END;
$$;


-- ===========================================================================
-- (8) Grants + RLS (D-019) — `anon` gets nothing
-- ===========================================================================

REVOKE ALL ON public.retention_schedules, public.retention_erasures, public.retention_erasure_voids, public.ai_systems FROM anon, authenticated;

GRANT SELECT ON public.retention_schedules, public.retention_erasures, public.retention_erasure_voids, public.ai_systems TO authenticated;
-- What a person records. Never the end date, the inform-by date or any stamp.
GRANT INSERT (organization_id, ropa_record_id, basis, period_months, law_name, starts_on, notes)
  ON public.retention_schedules TO authenticated;
GRANT UPDATE (basis, period_months, law_name, starts_on, notes) ON public.retention_schedules TO authenticated;
-- An erasure is inserted once: no UPDATE, no DELETE — ever.
GRANT INSERT (organization_id, retention_schedule_id, erased_on, method, method_note, processors_told, principals_informed_on)
  ON public.retention_erasures TO authenticated;
-- "Recorded in error" is inserted once: no UPDATE, no DELETE — ever. Never who marked it.
GRANT INSERT (organization_id, retention_erasure_id, reason) ON public.retention_erasure_voids TO authenticated;
-- The AI register. Never the review stamps.
GRANT INSERT (organization_id, system_id, usage_type, name, purpose, personal_data, child_tracking, child_exemption, human_review, status, last_reviewed_on)
  ON public.ai_systems TO authenticated;
GRANT UPDATE (system_id, usage_type, name, purpose, personal_data, child_tracking, child_exemption, human_review, status, last_reviewed_on)
  ON public.ai_systems TO authenticated;
-- No DELETE on any of the four: a schedule is changed, an erasure and its void stand, an AI system is retired.

ALTER TABLE public.retention_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retention_erasures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retention_erasure_voids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_systems ENABLE ROW LEVEL SECURITY;

CREATE POLICY retention_schedules_select_member ON public.retention_schedules
  FOR SELECT TO authenticated
  USING (
    organization_id IN (SELECT app.current_user_organization_ids())
    AND app.has_permission(organization_id, 'retention.read')
  );
CREATE POLICY retention_schedules_insert_writer ON public.retention_schedules
  FOR INSERT TO authenticated
  WITH CHECK (
    organization_id IN (SELECT app.current_user_organization_ids())
    AND app.has_permission(organization_id, 'retention.write')
  );
CREATE POLICY retention_schedules_update_writer ON public.retention_schedules
  FOR UPDATE TO authenticated
  USING (
    organization_id IN (SELECT app.current_user_organization_ids())
    AND app.has_permission(organization_id, 'retention.write')
  )
  WITH CHECK (
    organization_id IN (SELECT app.current_user_organization_ids())
    AND app.has_permission(organization_id, 'retention.write')
  );

CREATE POLICY retention_erasures_select_member ON public.retention_erasures
  FOR SELECT TO authenticated
  USING (
    organization_id IN (SELECT app.current_user_organization_ids())
    AND app.has_permission(organization_id, 'retention.read')
  );
CREATE POLICY retention_erasures_insert_writer ON public.retention_erasures
  FOR INSERT TO authenticated
  WITH CHECK (
    organization_id IN (SELECT app.current_user_organization_ids())
    AND app.has_permission(organization_id, 'retention.write')
  );

CREATE POLICY retention_erasure_voids_select_member ON public.retention_erasure_voids
  FOR SELECT TO authenticated
  USING (
    organization_id IN (SELECT app.current_user_organization_ids())
    AND app.has_permission(organization_id, 'retention.read')
  );
CREATE POLICY retention_erasure_voids_insert_writer ON public.retention_erasure_voids
  FOR INSERT TO authenticated
  WITH CHECK (
    organization_id IN (SELECT app.current_user_organization_ids())
    AND app.has_permission(organization_id, 'retention.write')
  );

-- The AI risk register is read with ropa.read — the processing register's
-- permission, a lever Rule 6's access control can pull (D-096, R5); written
-- with ropa.write (D-094.2).
CREATE POLICY ai_systems_select_member ON public.ai_systems
  FOR SELECT TO authenticated
  USING (
    organization_id IN (SELECT app.current_user_organization_ids())
    AND app.has_permission(organization_id, 'ropa.read')
  );
CREATE POLICY ai_systems_insert_writer ON public.ai_systems
  FOR INSERT TO authenticated
  WITH CHECK (
    organization_id IN (SELECT app.current_user_organization_ids())
    AND app.has_permission(organization_id, 'ropa.write')
  );
CREATE POLICY ai_systems_update_writer ON public.ai_systems
  FOR UPDATE TO authenticated
  USING (
    organization_id IN (SELECT app.current_user_organization_ids())
    AND app.has_permission(organization_id, 'ropa.write')
  )
  WITH CHECK (
    organization_id IN (SELECT app.current_user_organization_ids())
    AND app.has_permission(organization_id, 'ropa.write')
  );


-- ===========================================================================
-- (9) Exposure model 1.5.0 — mirrors packages/core/src/exposure.ts
-- ===========================================================================
-- SLICE_10 §6, §7c.4, §7c.6, as decided (D-094.1): the retention register's
-- two rows on head 7 and the AI risk register's one reason on head 4. One
-- version per stage: 1.4.0's migration stays as it was and this one replaces
-- the functions, each from its 1.4.0 body with the 1.5.0 rules and nothing else.

CREATE OR REPLACE FUNCTION app.exposure_model_version()
RETURNS text
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = ''
AS $$
  SELECT '1.5.0'::text;
$$;

-- §6.2b, with the 1.5.0 rows. `ord` is core's MODULE_INPUTS order: a fact read
-- on two heads is two rows, one per head, each with its own provision.
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
     '{n} consents given on behalf of a child or a person with disability have no verification of the parent or lawful guardian recorded (s.9(1), Rules 10–11).'),
    (6, 'vendor_contract_missing', 'H1', 's.8(5), Rule 6(1)(f)', 'not_mitigated', 'Processor register',
     'A processor with no contract, or no DPDP clauses, recorded',
     '1 processor has no contract with DPDP clauses recorded — the contract is where reasonable security safeguards are provided for (Rule 6(1)(f)).',
     '{n} processors have no contract with DPDP clauses recorded — the contract is where reasonable security safeguards are provided for (Rule 6(1)(f)).'),
    (7, 'vendor_contract_missing', 'H7', 's.8(2)', 'not_mitigated', 'Processor register',
     'A processor with no contract, or no DPDP clauses, recorded',
     '1 processor has no contract with DPDP clauses recorded — a processor is engaged only under a valid contract (s.8(2)).',
     '{n} processors have no contract with DPDP clauses recorded — a processor is engaged only under a valid contract (s.8(2)).'),
    (8, 'vendor_assessment_out_of_date', 'H1', 'Twelve months is a TrustStack default; the Act sets no interval', 'reason', 'Processor register',
     'A processor''s accepted assessment past its review-by date',
     '1 processor''s accepted assessment is past its review-by date (a TrustStack default, not a statutory period).',
     '{n} processors'' accepted assessments are past their review-by dates (a TrustStack default, not a statutory period).'),
    (9, 'vendor_assessment_out_of_date', 'H7', 'Twelve months is a TrustStack default; the Act sets no interval', 'reason', 'Processor register',
     'A processor''s accepted assessment past its review-by date',
     '1 processor''s accepted assessment is past its review-by date (a TrustStack default, not a statutory period).',
     '{n} processors'' accepted assessments are past their review-by dates (a TrustStack default, not a statutory period).'),
    (10, 'retention_overdue', 'H7', 's.8(7), Rule 8(3)', 'exposed', 'Retention register',
     'A retention schedule past its end date with no erasure recorded',
     '1 retention schedule is past its end date with no erasure recorded (s.8(7)).',
     '{n} retention schedules are past their end dates with no erasure recorded (s.8(7)).'),
    (11, 'retention_end_unrecorded', 'H7', 's.8(7)', 'reason', 'Retention register',
     'A retention schedule with no end date recorded',
     '1 retention schedule has no end date recorded, so its erasure cannot be shown to follow (s.8(7)).',
     '{n} retention schedules have no end date recorded, so their erasure cannot be shown to follow (s.8(7)).'),
    (12, 'ai_system_unreviewed', 'H4', 'Rule 13(3); twelve months is a TrustStack default', 'reason', 'AI risk register',
     'An AI system in use with no review recorded in the last twelve months',
     '1 AI system in use has no review recorded in the last twelve months (Rule 13(3) due diligence; the interval is a TrustStack default).',
     '{n} AI systems in use have no review recorded in the last twelve months (Rule 13(3) due diligence; the interval is a TrustStack default).');
$$;

REVOKE ALL ON FUNCTION app.exposure_model_version(), app.exposure_module_inputs() FROM PUBLIC;
REVOKE ALL ON FUNCTION app.ai_review_months() FROM PUBLIC;

-- The evaluator, from its 1.4.0 body with the 1.5.0 rules: the retention
-- register's two facts and the AI risk register's one join the module counts.
-- Everything else is unchanged, word for word.
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
  -- 1.4.0: the processor register.
  v_n_vendor_contract integer;
  v_n_vendor_out_of_date integer;
  -- 1.5.0: the retention register and the AI risk register.
  v_n_retention_overdue integer;
  v_n_retention_no_end integer;
  v_n_ai_unreviewed integer;
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

  -- --- The workflow modules' facts (core `moduleInputCounts`, `recentBreachCount`) — 1.1.0 to 1.5.0
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
  -- 1.4.0: the processor register (core `vendorContractGap`, `assessmentOutOfDate`):
  -- anyone not recorded as an independent fiduciary (unknown counts) with no
  -- contract or no DPDP clauses recorded; and an accepted assessment strictly
  -- past its review-by date.
  SELECT count(*) FILTER (WHERE v.value ->> 'role' <> 'independent'
                            AND (v.value ->> 'contractExists' <> 'yes' OR v.value ->> 'dpdpClauses' <> 'yes')),
         count(*) FILTER (WHERE v.value ->> 'role' <> 'independent'
                            AND jsonb_typeof(v.value -> 'assessmentReviewBy') = 'string'
                            AND v_today > (v.value ->> 'assessmentReviewBy')::date)
    INTO v_n_vendor_contract, v_n_vendor_out_of_date
  FROM jsonb_array_elements(COALESCE(p_input -> 'vendors', '[]'::jsonb)) v(value);
  -- 1.5.0: the retention register (core `retentionOverdue`, `retentionEndUnrecorded`):
  -- erased for the current cycle = an erasure on or after the clock started
  -- (any, when none has); overdue strictly after the end date.
  SELECT count(*) FILTER (WHERE jsonb_typeof(x.value -> 'endsOn') = 'string'
                            AND v_today > (x.value ->> 'endsOn')::date AND NOT x.erased),
         count(*) FILTER (WHERE jsonb_typeof(x.value -> 'endsOn') IS DISTINCT FROM 'string' AND NOT x.erased)
    INTO v_n_retention_overdue, v_n_retention_no_end
  FROM (
    SELECT r.value,
           jsonb_typeof(r.value -> 'lastErasedOn') = 'string'
             AND (jsonb_typeof(r.value -> 'startsOn') IS DISTINCT FROM 'string'
                  OR (r.value ->> 'lastErasedOn')::date >= (r.value ->> 'startsOn')::date) AS erased
    FROM jsonb_array_elements(COALESCE(p_input -> 'retention', '[]'::jsonb)) r(value)
  ) x;
  -- 1.5.0: the AI risk register (core `aiSystemUnreviewed`): in use, and no review
  -- recorded, or the last one more than twelve months ago (strictly after).
  SELECT count(*) FILTER (WHERE a.value ->> 'status' = 'in_use'
                            AND (jsonb_typeof(a.value -> 'lastReviewedOn') IS DISTINCT FROM 'string'
                                 OR v_today > ((a.value ->> 'lastReviewedOn')::date + make_interval(months => app.ai_review_months()))::date))
    INTO v_n_ai_unreviewed
  FROM jsonb_array_elements(COALESCE(p_input -> 'aiSystems', '[]'::jsonb)) a(value);
  v_counts := jsonb_build_object('breach_board_overdue', v_n_board_overdue, 'breach_principals_pending', v_n_principals_pending,
                                 'rights_ceiling_overdue', v_n_rights_ceiling, 'rights_target_overdue', v_n_rights_target,
                                 'child_consent_unverified', v_n_consent_unverified,
                                 'vendor_contract_missing', v_n_vendor_contract,
                                 'vendor_assessment_out_of_date', v_n_vendor_out_of_date,
                                 'retention_overdue', v_n_retention_overdue,
                                 'retention_end_unrecorded', v_n_retention_no_end,
                                 'ai_system_unreviewed', v_n_ai_unreviewed);
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

-- The inputs, from the 1.4.0 body, plus the retention register and the AI risk register.
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
    'consents', app.consent_model_facts(p_organization_id),
    -- 1.4.0: every vendor in the register, as `readVendorFacts` reads it — its
    -- role, the contract's tri-states, and the review-by date of its latest
    -- ACCEPTED assessment; the model decides what they mean.
    'vendors', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
               'role', v.vendor_role,
               'contractExists', v.contract_exists,
               'dpdpClauses', v.dpdp_clauses,
               'assessmentReviewBy', (
                 SELECT to_char(a.review_by, 'YYYY-MM-DD')
                 FROM public.vendor_assessments a
                 WHERE a.organization_id = v.organization_id AND a.vendor_id = v.id AND a.status = 'accepted'
                 ORDER BY a.version DESC
                 LIMIT 1)) ORDER BY lower(v.name), v.id)
      FROM public.vendors v
      WHERE v.organization_id = p_organization_id), '[]'::jsonb),
    -- 1.5.0: every schedule in the retention register, as `readRetentionFacts`
    -- reads it — its start, its derived end and its latest erasure that COUNTS:
    -- the processors told or none held it (s.8(7)(b)), not marked in error (D-096).
    'retention', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
               'startsOn', to_char(s.starts_on, 'YYYY-MM-DD'),
               'endsOn', to_char(s.ends_on, 'YYYY-MM-DD'),
               'lastErasedOn', (
                 SELECT to_char(max(x.erased_on) FILTER (
                          WHERE x.processors_told <> 'no'
                            AND NOT EXISTS (
                              SELECT 1 FROM public.retention_erasure_voids v
                              WHERE v.organization_id = x.organization_id AND v.retention_erasure_id = x.id)), 'YYYY-MM-DD')
                 FROM public.retention_erasures x
                 WHERE x.organization_id = s.organization_id AND x.retention_schedule_id = s.id)) ORDER BY s.created_at, s.id)
      FROM public.retention_schedules s
      WHERE s.organization_id = p_organization_id), '[]'::jsonb),
    -- 1.5.0: every row of the AI risk register — its status and last review.
    'aiSystems', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
               'status', a.status,
               'lastReviewedOn', to_char(a.last_reviewed_on, 'YYYY-MM-DD')) ORDER BY a.created_at, a.id)
      FROM public.ai_systems a
      WHERE a.organization_id = p_organization_id), '[]'::jsonb));

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
  -- The Rules' numbers, from SQL.
  ASSERT app.retention_min_months() = 12, 'Rule 8(3): at least one year';
  ASSERT app.retention_deemed_months() = 36, 'Rule 8(1), Third Schedule: three years';
  ASSERT app.retention_notice_days() = 2, 'Rule 8(2): forty-eight hours, as two days';
  ASSERT app.ai_review_months() = 12, 'the TrustStack review default: twelve months';
  ASSERT array_length(app.retention_bases(), 1) = 5, 'five bases';
  ASSERT app.third_schedule_classes() = ARRAY['ecommerce', 'online_gaming', 'social_media'], 'the Third Schedule''s three classes';
  -- The end date is calendar months, clamped as core's addMonths is.
  ASSERT app.retention_ends_on('fixed_period', DATE '2024-02-29', 12) = DATE '2025-02-28', 'months clamp to the month''s end';
  ASSERT app.retention_ends_on('purpose_served', DATE '2026-01-31', 13) = DATE '2027-02-28', 'thirteen months from 31 January';
  ASSERT app.retention_ends_on('deemed_inactivity', DATE '2024-05-01', 36) = DATE '2028-11-13', 'the deemed basis counts from the Rules at the earliest';
  ASSERT app.retention_ends_on('fixed_period', NULL, 24) IS NULL, 'no start, no end';
  -- Nothing a user may write is derived or stamped; nobody updates or deletes an erasure.
  FOREACH v_fn IN ARRAY ARRAY['DELETE', 'TRUNCATE'] LOOP
    ASSERT NOT has_table_privilege('authenticated', 'public.retention_schedules', v_fn), 'schedules: no ' || v_fn;
    ASSERT NOT has_table_privilege('authenticated', 'public.retention_erasures', v_fn), 'erasures: no ' || v_fn;
    ASSERT NOT has_table_privilege('authenticated', 'public.retention_erasure_voids', v_fn), 'voids: no ' || v_fn;
    ASSERT NOT has_table_privilege('authenticated', 'public.ai_systems', v_fn), 'AI systems: no ' || v_fn;
  END LOOP;
  ASSERT NOT has_table_privilege('authenticated', 'public.retention_erasures', 'UPDATE'), 'an erasure is never updated';
  ASSERT NOT has_table_privilege('authenticated', 'public.retention_erasure_voids', 'UPDATE'), 'a void is never updated';
  ASSERT NOT has_column_privilege('authenticated', 'public.retention_erasure_voids', 'voided_by', 'INSERT'), 'who marked an erasure in error is stamped';
  ASSERT NOT has_column_privilege('authenticated', 'public.retention_schedules', 'ends_on', 'INSERT')
     AND NOT has_column_privilege('authenticated', 'public.retention_schedules', 'ends_on', 'UPDATE')
     AND NOT has_column_privilege('authenticated', 'public.retention_schedules', 'inform_by', 'UPDATE'), 'the end date is the database''s';
  ASSERT NOT has_column_privilege('authenticated', 'public.retention_erasures', 'recorded_by', 'INSERT'), 'who recorded an erasure is stamped';
  ASSERT NOT has_column_privilege('authenticated', 'public.ai_systems', 'review_recorded_by', 'UPDATE'), 'who recorded a review is stamped';
  ASSERT NOT has_table_privilege('anon', 'public.retention_schedules', 'SELECT')
     AND NOT has_table_privilege('anon', 'public.retention_erasures', 'SELECT')
     AND NOT has_table_privilege('anon', 'public.retention_erasure_voids', 'SELECT')
     AND NOT has_table_privilege('anon', 'public.ai_systems', 'SELECT'), 'anon reads nothing';
  ASSERT NOT has_function_privilege('anon', 'public.add_retention_action(uuid, uuid, text, uuid, date)', 'EXECUTE'), 'anon adds no action';
  -- The model.
  ASSERT app.exposure_model_version() = '1.5.0', 'model 1.5.0';
  ASSERT (SELECT count(*) FROM app.exposure_module_inputs()) = 12, 'twelve module rows in 1.5.0';
  ASSERT (SELECT string_agg(code || ':' || head || ':' || effect, ',' ORDER BY ord) FROM app.exposure_module_inputs() WHERE ord > 9)
         = 'retention_overdue:H7:exposed,retention_end_unrecorded:H7:reason,ai_system_unreviewed:H4:reason', 'the three 1.5.0 rows';
  -- Every existing action still has exactly one parent.
  ASSERT NOT EXISTS (
    SELECT 1 FROM public.gap_actions
    WHERE num_nonnulls(gap_id, ropa_gap_id, breach_incident_id, rights_request_id, retention_schedule_id) <> 1), 'one parent';
END;
$$;
