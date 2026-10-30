-- Slice 10, Stage 2 — the rights and grievance register, its actions, and
-- exposure model 1.2.0 (SLICE_10 §2, §4.3, §6; D-079.6; D-080).
--
-- DPDP anchoring (the Act and the Gazette text, G.S.R. 846(E)):
--   * s.11 access · s.12 correction, completion, updating, erasure · s.13
--     grievance redressal · s.14 nomination, each "in such manner as may be
--     prescribed": Rule 14(1)–(2) the published means and identifiers, Rule
--     14(4) nominating one or more individuals, Rule 14(5) "identifier".
--   * Rule 14(3): respond "within a reasonable period not exceeding ninety
--     days" under the published grievance redressal system; s.13(2) counts it
--     "from the date of its receipt". The other rights run through the same
--     system, so the same ceiling is applied to every request.
--   * Rule 9: every response names a contact (published with the public
--     surfaces in Stage 3).
--
-- Stage 2 is STAFF-ENTERED only (SLICE_10 decision 3, D-080.3): the public
-- forms, the slug and the emailed one-time codes come together in Stage 3.
-- Nothing here grants anything to `anon`.
--
-- What is enforced HERE, not only in the application:
--   * The request code and the respond-by date are DERIVED: receipt + 90 days
--     is a CHECKed row invariant, and no user holds a grant on either, nor on
--     `received_on` after the row exists — the clock cannot be moved.
--   * Who verified the person's identity and who recorded the response, and
--     when, are stamped, never sent. A recorded identity check may be
--     corrected, never removed. Nothing is dated in the future.
--   * Fulfilling a request needs the person identified first (Rule 14(1)(b),
--     (2), (5)); partly fulfilling or declining needs the reason. CHECKs, so
--     tooling obeys them too.
--   * Nothing is deleted: there is no DELETE grant. A request entered in
--     error is VOID, with the reason; one the person withdrew is WITHDRAWN.
--   * Its remediation joins the ONE action table (D-067): `gap_actions`
--     gains a fourth parent, and the closing rule (D-056) is unchanged.
--
-- The exposure model moves to 1.2.0 in this same migration — the two head-7
-- rows — mirrored in packages/core/src/exposure.ts and held together by
-- tests/unit/exposure-mirror.test.ts (data) and
-- tests/rls/exposure-mirror.test.ts (logic, on generated inputs).
--
-- Additive: two permissions, one new table, one new column, one new RPC,
-- functions replaced in place. Nothing a live user holds is revoked. The
-- one-parent CHECK on gap_actions is dropped and re-added WIDER (four
-- parents, still exactly one), which every existing row satisfies.
--
-- Layout: (1) permissions; (2) DDL; (3) vocabularies and row invariants;
-- (4) the request trigger; (5) actions — the fourth parent; (6) audit;
-- (7) grants + RLS; (8) exposure model 1.2.0; (9) apply-time assertions.


-- ===========================================================================
-- (1) Permissions — a matrix change is core + a migration in one PR (D-020)
-- ===========================================================================

INSERT INTO public.permissions (code, description) VALUES
  ('rights.read', 'Read the rights and grievance register: Data Principals'' requests and grievances, their response clock and their actions.'),
  ('rights.write', 'Record a Data Principal''s request or grievance, the identity check, the response and its actions.');

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM (VALUES ('super_admin'), ('consultant'), ('organization_admin'), ('executive_sponsor'), ('dpdp_owner'), ('department_owner'), ('legal_user'), ('it_security_user'), ('procurement_user'), ('auditor_reviewer')) AS g(role_code)
JOIN public.roles r ON r.code = g.role_code
JOIN public.permissions p ON p.code = 'rights.read';

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM (VALUES ('super_admin'), ('consultant'), ('organization_admin'), ('dpdp_owner'), ('department_owner'), ('legal_user'), ('it_security_user'), ('procurement_user')) AS g(role_code)
JOIN public.roles r ON r.code = g.role_code
JOIN public.permissions p ON p.code = 'rights.write';


-- ===========================================================================
-- (2) DDL
-- ===========================================================================

-- CreateTable
CREATE TABLE "rights_requests" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "request_code" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "received_on" DATE NOT NULL,
    "respond_by" DATE NOT NULL,
    "channel" TEXT NOT NULL,
    "requester_name" TEXT NOT NULL,
    "requester_email" TEXT,
    "requester_phone" TEXT,
    "requester_capacity" TEXT NOT NULL DEFAULT 'self',
    "principal_identifier" TEXT,
    "summary" TEXT NOT NULL,
    "related_request_id" UUID,
    "nominee_name" TEXT,
    "nominee_contact" TEXT,
    "nominee_relationship" TEXT,
    "owner_user_id" UUID,
    "identity_verified_on" DATE,
    "identity_method" TEXT,
    "identity_recorded_by" UUID,
    "identity_recorded_at" TIMESTAMPTZ(6),
    "outcome" TEXT,
    "responded_on" DATE,
    "response_summary" TEXT,
    "response_recorded_by" UUID,
    "response_recorded_at" TIMESTAMPTZ(6),
    "closure_reason" TEXT,
    "closed_at" TIMESTAMPTZ(6),
    "closed_by" UUID,
    "created_by" UUID,
    "updated_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rights_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "rights_requests_organization_id_idx" ON "rights_requests"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "rights_requests_organization_id_id_key" ON "rights_requests"("organization_id", "id");

-- CreateIndex — the code is per organisation (DPR-2026-001 and GRV-2026-001 restart for each tenant).
CREATE UNIQUE INDEX "rights_requests_organization_id_request_code_key" ON "rights_requests"("organization_id", "request_code");

-- CreateIndex
CREATE INDEX "rights_requests_organization_id_status_received_on_idx" ON "rights_requests"("organization_id", "status", "received_on");

-- AddForeignKey
ALTER TABLE "rights_requests" ADD CONSTRAINT "rights_requests_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey — composite, so a grievance can only be about a request of the same organisation.
ALTER TABLE "rights_requests" ADD CONSTRAINT "rights_requests_organization_id_related_request_id_fkey" FOREIGN KEY ("organization_id", "related_request_id") REFERENCES "rights_requests"("organization_id", "id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey — the people who recorded each fact. A user who leaves keeps
-- the fact; the name goes (the audit log keeps who it was).
ALTER TABLE "rights_requests" ADD CONSTRAINT "rights_requests_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "rights_requests" ADD CONSTRAINT "rights_requests_identity_recorded_by_fkey" FOREIGN KEY ("identity_recorded_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "rights_requests" ADD CONSTRAINT "rights_requests_response_recorded_by_fkey" FOREIGN KEY ("response_recorded_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "rights_requests" ADD CONSTRAINT "rights_requests_closed_by_fkey" FOREIGN KEY ("closed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "rights_requests" ADD CONSTRAINT "rights_requests_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "rights_requests" ADD CONSTRAINT "rights_requests_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable — an action now has exactly one of FOUR parents: an assessment
-- gap, a ROPA gap, a breach or a Data Principal's request. One action table
-- means one workflow, one closing rule, one roadmap (D-060, D-067).
ALTER TABLE "gap_actions" ADD COLUMN "rights_request_id" UUID;

-- CreateIndex
CREATE INDEX "gap_actions_rights_request_id_idx" ON "gap_actions"("rights_request_id");

-- AddForeignKey — composite, so an action can never point at another tenant's request.
ALTER TABLE "gap_actions" ADD CONSTRAINT "gap_actions_organization_id_rights_request_id_fkey" FOREIGN KEY ("organization_id", "rights_request_id") REFERENCES "rights_requests"("organization_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE public.gap_actions DROP CONSTRAINT gap_actions_one_parent;
ALTER TABLE public.gap_actions
  ADD CONSTRAINT gap_actions_one_parent CHECK (num_nonnulls(gap_id, ropa_gap_id, breach_incident_id, rights_request_id) = 1);


-- ===========================================================================
-- (3) Vocabularies (mirror packages/core/src/rights.ts) and row invariants
-- ===========================================================================

CREATE OR REPLACE FUNCTION app.rights_kinds()
RETURNS text[]
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = ''
AS $$
  SELECT ARRAY['access', 'correction', 'completion', 'updating', 'erasure', 'nomination', 'grievance']::text[];
$$;

CREATE OR REPLACE FUNCTION app.rights_statuses()
RETURNS text[]
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = ''
AS $$
  SELECT ARRAY['open', 'responded', 'withdrawn', 'void']::text[];
$$;

CREATE OR REPLACE FUNCTION app.rights_outcomes()
RETURNS text[]
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = ''
AS $$
  SELECT ARRAY['fulfilled', 'partly_fulfilled', 'declined']::text[];
$$;

CREATE OR REPLACE FUNCTION app.rights_channels()
RETURNS text[]
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = ''
AS $$
  SELECT ARRAY['email', 'web_form', 'phone', 'letter', 'in_person', 'other']::text[];
$$;

-- Rule 14(3): ninety days. Statute — never a TrustStack target.
CREATE OR REPLACE FUNCTION app.rights_ceiling_days()
RETURNS integer
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = ''
AS $$
  SELECT 90;
$$;

-- TrustStack's response target (core RIGHTS_TARGET_DAYS) — a TARGET, not statute (pitfall 1).
CREATE OR REPLACE FUNCTION app.rights_target_days()
RETURNS integer
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = ''
AS $$
  SELECT 30;
$$;

-- core: RIGHTS_TRANSITIONS.
CREATE OR REPLACE FUNCTION app.rights_transition_allowed(p_from text, p_to text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = ''
AS $$
  SELECT (p_from, p_to) IN (
    ('open', 'responded'), ('open', 'withdrawn'), ('open', 'void'),
    ('responded', 'open'),
    ('withdrawn', 'open'),
    ('void', 'open'));
$$;

REVOKE ALL ON FUNCTION app.rights_kinds(), app.rights_statuses(), app.rights_outcomes(), app.rights_channels(),
  app.rights_ceiling_days(), app.rights_target_days(), app.rights_transition_allowed(text, text) FROM PUBLIC;
-- The CHECKs below call the vocabularies and the ceiling as the writing user, so they need them.
GRANT EXECUTE ON FUNCTION app.rights_kinds(), app.rights_statuses(), app.rights_outcomes(), app.rights_channels(),
  app.rights_ceiling_days() TO authenticated;

ALTER TABLE public.rights_requests
  ADD CONSTRAINT rights_requests_kind_check CHECK (kind = ANY (app.rights_kinds())),
  ADD CONSTRAINT rights_requests_status_check CHECK (status = ANY (app.rights_statuses())),
  ADD CONSTRAINT rights_requests_channel_check CHECK (channel = ANY (app.rights_channels())),
  ADD CONSTRAINT rights_requests_capacity_check CHECK (requester_capacity IN ('self', 'nominee', 'guardian')),
  ADD CONSTRAINT rights_requests_outcome_check CHECK (outcome IS NULL OR outcome = ANY (app.rights_outcomes())),
  -- Two families, two codes: GRV for a grievance (s.13), DPR for every other right.
  ADD CONSTRAINT rights_requests_code_format CHECK (
    request_code ~ '^(DPR|GRV)-[0-9]{4}-[0-9]{3,}$' AND (kind = 'grievance') = (request_code LIKE 'GRV-%')),
  ADD CONSTRAINT rights_requests_text_lengths CHECK (
    btrim(requester_name) <> '' AND char_length(requester_name) <= 200
    AND btrim(summary) <> '' AND char_length(summary) <= 4000
    AND char_length(requester_email) <= 320 AND char_length(requester_phone) <= 40
    AND char_length(principal_identifier) <= 200
    AND char_length(nominee_name) <= 200 AND char_length(nominee_contact) <= 500 AND char_length(nominee_relationship) <= 200
    AND char_length(identity_method) <= 500 AND char_length(response_summary) <= 4000 AND char_length(closure_reason) <= 2000),
  ADD CONSTRAINT rights_requests_email_shape CHECK (requester_email IS NULL OR requester_email ~ '^[^@[:space:]]+@[^@[:space:]]+$'),
  -- No request under the Act was received before it received assent (11 Aug 2023).
  ADD CONSTRAINT rights_requests_received_after_act CHECK (received_on >= DATE '2023-08-11'),
  -- THE clock (Rule 14(3)): derived, a row invariant, never sent by a client.
  ADD CONSTRAINT rights_requests_respond_by_is_derived CHECK (respond_by = received_on + app.rights_ceiling_days()),
  -- A nomination names its nominee (Rule 14(4)); nothing else carries one.
  ADD CONSTRAINT rights_requests_nominee CHECK (
    CASE WHEN kind = 'nomination'
         THEN nominee_name IS NOT NULL AND btrim(nominee_name) <> ''
         ELSE nominee_name IS NULL AND nominee_contact IS NULL AND nominee_relationship IS NULL END),
  ADD CONSTRAINT rights_requests_related_not_self CHECK (related_request_id IS NULL OR related_request_id <> id),
  -- The identity check: when, how, and when it was recorded — together, never one alone.
  ADD CONSTRAINT rights_requests_identity_whole CHECK (
    (identity_verified_on IS NULL) = (identity_method IS NULL)
    AND (identity_verified_on IS NULL) = (identity_recorded_at IS NULL)
    AND (identity_method IS NULL OR btrim(identity_method) <> '')),
  -- The response: outcome, the day and its record, exactly when responded.
  ADD CONSTRAINT rights_requests_response_whole CHECK (
    (status = 'responded') = (outcome IS NOT NULL)
    AND (status = 'responded') = (responded_on IS NOT NULL)
    AND (status = 'responded') = (response_recorded_at IS NOT NULL)
    AND (status = 'responded' OR response_summary IS NULL)),
  -- Anything short of fulfilled says why.
  ADD CONSTRAINT rights_requests_response_reason CHECK (
    outcome IS NULL OR outcome = 'fulfilled' OR (response_summary IS NOT NULL AND btrim(response_summary) <> '')),
  -- Fulfilling a request discloses or changes someone's data: identify them first (Rule 14(1)(b), (2), (5)).
  ADD CONSTRAINT rights_requests_fulfilled_is_identified CHECK (
    status <> 'responded' OR kind = 'grievance' OR outcome = 'declined' OR identity_verified_on IS NOT NULL),
  -- Nothing is dated before the request arrived.
  ADD CONSTRAINT rights_requests_dates_after_receipt CHECK (
    (identity_verified_on IS NULL OR identity_verified_on >= received_on)
    AND (responded_on IS NULL OR responded_on >= received_on)),
  ADD CONSTRAINT rights_requests_closure_reason CHECK (
    (status IN ('withdrawn', 'void')) = (closure_reason IS NOT NULL)
    AND (closure_reason IS NULL OR btrim(closure_reason) <> '')),
  ADD CONSTRAINT rights_requests_closed_stamp CHECK ((status <> 'open') = (closed_at IS NOT NULL));

CREATE TRIGGER rights_requests_touch_updated_at BEFORE UPDATE ON public.rights_requests
  FOR EACH ROW EXECUTE FUNCTION app.touch_updated_at();


-- ===========================================================================
-- (4) The request trigger — derivation, stamps and the lifecycle
-- ===========================================================================
-- With a user's JWT every rule applies. Tooling (migrations, the seed) has no
-- JWT: it is trusted to set codes and stamps, but the CHECKs above still hold.

CREATE OR REPLACE FUNCTION app.rights_request_before_write()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_actor uuid := app.current_user_id();
  -- Every date here is a date in India (D-055).
  v_today date := (now() AT TIME ZONE 'Asia/Kolkata')::date;
  v_prefix text;
  v_year text;
  v_next integer;
  v_content_changed boolean;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF (NEW.organization_id, NEW.request_code) IS DISTINCT FROM (OLD.organization_id, OLD.request_code) THEN
      RAISE EXCEPTION 'A request keeps its organisation and its code.' USING ERRCODE = 'TS422';
    END IF;
    -- The code names the family: a request may change kind within it, never across.
    IF (NEW.kind = 'grievance') <> (OLD.kind = 'grievance') THEN
      RAISE EXCEPTION 'A grievance cannot become a request to exercise a right, or the other way round — record it anew and void this one.'
        USING ERRCODE = 'TS422';
    END IF;
  END IF;

  IF v_actor IS NOT NULL THEN
    -- RLS already refuses anyone without rights.write; this is the second
    -- lock, with a message.
    IF NOT app.has_permission(NEW.organization_id, 'rights.write') THEN
      RAISE EXCEPTION 'You do not have permission to change the rights and grievance register.' USING ERRCODE = 'TS403';
    END IF;
    -- No fact may be dated in the future (India's calendar).
    IF NEW.received_on > v_today OR NEW.identity_verified_on > v_today OR NEW.responded_on > v_today THEN
      RAISE EXCEPTION 'A date in the register cannot be in the future.' USING ERRCODE = 'TS422';
    END IF;
    -- The owner is a person in this organisation.
    IF NEW.owner_user_id IS NOT NULL
       AND (TG_OP = 'INSERT' OR NEW.owner_user_id IS DISTINCT FROM OLD.owner_user_id)
       AND NOT EXISTS (
         SELECT 1 FROM public.organization_users ou
         WHERE ou.organization_id = NEW.organization_id AND ou.user_id = NEW.owner_user_id AND ou.status = 'active') THEN
      RAISE EXCEPTION 'The owner must be an active member of this organisation.' USING ERRCODE = 'TS422';
    END IF;
  END IF;

  IF TG_OP = 'INSERT' THEN
    -- The code is the database's: DPR-/GRV-<year received>-NNN, per organisation and family.
    IF NEW.request_code IS NULL THEN
      v_prefix := CASE WHEN NEW.kind = 'grievance' THEN 'GRV' ELSE 'DPR' END;
      PERFORM pg_advisory_xact_lock(hashtextextended('rights_request_code:' || NEW.organization_id::text || ':' || v_prefix, 0));
      v_year := to_char(NEW.received_on, 'YYYY');
      SELECT COALESCE(max(substring(r.request_code FROM '^[A-Z]{3}-[0-9]{4}-([0-9]+)$')::integer), 0) + 1 INTO v_next
      FROM public.rights_requests r
      WHERE r.organization_id = NEW.organization_id AND r.request_code LIKE v_prefix || '-' || v_year || '-%';
      NEW.request_code := v_prefix || '-' || v_year || '-' || lpad(v_next::text, greatest(3, length(v_next::text)), '0');
    END IF;
    IF v_actor IS NOT NULL THEN
      NEW.created_by := v_actor;
      NEW.updated_by := v_actor;
      -- A new request is open, with nothing recorded yet: the identity check
      -- and the response are recorded afterwards, each a stamped fact.
      NEW.status := 'open';
    END IF;
  ELSE
    v_content_changed := (NEW.kind, NEW.channel, NEW.requester_name, NEW.requester_email, NEW.requester_phone,
                          NEW.requester_capacity, NEW.principal_identifier, NEW.summary, NEW.related_request_id,
                          NEW.nominee_name, NEW.nominee_contact, NEW.nominee_relationship, NEW.owner_user_id,
                          NEW.identity_verified_on, NEW.identity_method, NEW.outcome, NEW.responded_on,
                          NEW.response_summary, NEW.closure_reason)
                         IS DISTINCT FROM
                         (OLD.kind, OLD.channel, OLD.requester_name, OLD.requester_email, OLD.requester_phone,
                          OLD.requester_capacity, OLD.principal_identifier, OLD.summary, OLD.related_request_id,
                          OLD.nominee_name, OLD.nominee_contact, OLD.nominee_relationship, OLD.owner_user_id,
                          OLD.identity_verified_on, OLD.identity_method, OLD.outcome, OLD.responded_on,
                          OLD.response_summary, OLD.closure_reason);

    IF v_actor IS NOT NULL THEN
      -- A responded, withdrawn or void request is a record: reopen it to change it.
      IF OLD.status <> 'open' AND NEW.status = OLD.status AND v_content_changed THEN
        RAISE EXCEPTION 'This request is % — reopen it to change it.', replace(OLD.status, '_', ' ') USING ERRCODE = 'TS409';
      END IF;
      -- A recorded identity check may be corrected, never removed: removing it
      -- would erase that it happened. The audit log keeps every correction.
      IF OLD.identity_verified_on IS NOT NULL AND NEW.identity_verified_on IS NULL THEN
        RAISE EXCEPTION 'A recorded identity check cannot be removed — correct it instead.' USING ERRCODE = 'TS409';
      END IF;
      IF NEW.status IS DISTINCT FROM OLD.status AND NOT app.rights_transition_allowed(OLD.status, NEW.status) THEN
        RAISE EXCEPTION 'A request that is % cannot move to %.', OLD.status, NEW.status USING ERRCODE = 'TS409';
      END IF;
      IF NEW.status = 'responded' AND OLD.status <> 'responded' THEN
        IF NEW.outcome IS NULL OR NEW.responded_on IS NULL THEN
          RAISE EXCEPTION 'Record the outcome and the day of the response.' USING ERRCODE = 'TS422';
        END IF;
        IF NEW.kind <> 'grievance' AND NEW.outcome <> 'declined' AND NEW.identity_verified_on IS NULL THEN
          RAISE EXCEPTION 'Record how the person''s identity was verified before fulfilling the request.' USING ERRCODE = 'TS409';
        END IF;
        -- Stamped with the response, not with the request's identity.
        NEW.response_recorded_at := now();
        NEW.response_recorded_by := v_actor;
      END IF;

      -- Who recorded the identity check, and when — stamped, never sent.
      IF (NEW.identity_verified_on, NEW.identity_method) IS DISTINCT FROM (OLD.identity_verified_on, OLD.identity_method) THEN
        NEW.identity_recorded_by := v_actor;
        NEW.identity_recorded_at := now();
      END IF;
      NEW.updated_by := v_actor;
    END IF;

    -- The lifecycle's own stamps, for users and tooling alike.
    IF NEW.status <> 'open' AND OLD.status = 'open' THEN
      NEW.closed_at := COALESCE(CASE WHEN v_actor IS NULL THEN NEW.closed_at END, now());
      NEW.closed_by := COALESCE(v_actor, NEW.closed_by);
    ELSIF NEW.status = 'open' AND OLD.status <> 'open' THEN
      -- Reopened. The audit log keeps the response and the closure; the row stops claiming them.
      NEW.closed_at := NULL;
      NEW.closed_by := NULL;
      NEW.outcome := NULL;
      NEW.responded_on := NULL;
      NEW.response_summary := NULL;
      NEW.response_recorded_at := NULL;
      NEW.response_recorded_by := NULL;
    END IF;
  END IF;

  -- A reason belongs to a withdrawn or void request only.
  IF NEW.status NOT IN ('withdrawn', 'void') THEN
    NEW.closure_reason := NULL;
  END IF;
  -- THE clock: receipt + ninety days (Rule 14(3)).
  NEW.respond_by := NEW.received_on + app.rights_ceiling_days();
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION app.rights_request_before_write() FROM PUBLIC;

CREATE TRIGGER rights_requests_before_write
  BEFORE INSERT OR UPDATE ON public.rights_requests
  FOR EACH ROW EXECUTE FUNCTION app.rights_request_before_write();


-- ===========================================================================
-- (5) Actions — the fourth parent
-- ===========================================================================

-- The shared action trigger, from its Stage 1 body, with ONE change: an
-- action can be moved to no other parent of any of the four kinds. The
-- closing rule (D-056) is untouched, so a request's action obeys it.
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
  IF (NEW.organization_id, NEW.gap_id, NEW.ropa_gap_id, NEW.breach_incident_id, NEW.rights_request_id)
     IS DISTINCT FROM (OLD.organization_id, OLD.gap_id, OLD.ropa_gap_id, OLD.breach_incident_id, OLD.rights_request_id) THEN
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

-- A request's remediation is written by people — what an upheld grievance or
-- an erasure across systems shows must change — so, like a breach's, it needs
-- a way IN. This is the one door: users still hold no INSERT grant on gap_actions.
CREATE OR REPLACE FUNCTION public.add_rights_action(
  p_organization_id uuid,
  p_rights_request_id uuid,
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
  v_status text;
  v_title text := btrim(p_title);
  v_id uuid;
BEGIN
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'Sign in to continue.' USING ERRCODE = 'TS401';
  END IF;
  IF NOT (app.has_permission(p_organization_id, 'rights.write') AND app.has_permission(p_organization_id, 'gap.write')) THEN
    RAISE EXCEPTION 'You do not have permission to add an action to this request.' USING ERRCODE = 'TS403';
  END IF;
  SELECT r.status INTO v_status
  FROM public.rights_requests r
  WHERE r.id = p_rights_request_id AND r.organization_id = p_organization_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Request not found.' USING ERRCODE = 'TS404';
  END IF;
  IF v_status = 'void' THEN
    RAISE EXCEPTION 'This request was entered in error — reopen it to add an action.' USING ERRCODE = 'TS409';
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

  INSERT INTO public.gap_actions (organization_id, rights_request_id, title, owner_user_id, status, due_date, updated_by)
  VALUES (p_organization_id, p_rights_request_id, v_title, p_owner_user_id, 'open', p_due_date, v_actor)
  RETURNING id INTO v_id;

  -- ONE audit row, as the person. The title is free text: never logged.
  INSERT INTO public.audit_logs (organization_id, user_id, event_type, entity_type, entity_id, description, metadata)
  VALUES (
    p_organization_id, v_actor, 'rights.action.created', 'gap_actions', v_id, 'Added an action to a rights request',
    jsonb_strip_nulls(jsonb_build_object(
      'rightsRequestId', p_rights_request_id,
      'ownerUserId', p_owner_user_id,
      'dueDate', to_char(p_due_date, 'YYYY-MM-DD'))));

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.add_rights_action(uuid, uuid, text, uuid, date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.add_rights_action(uuid, uuid, text, uuid, date) TO authenticated;


-- ===========================================================================
-- (6) Audit — from the Stage 1 body (D-065, D-081): request rows are audited
--     by the same trigger; personal data and free text never logged; derived
--     and stamped columns never reported as edits
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
                        'response_recorded_at')
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
      'respondedOn', v_row ->> 'responded_on'
    ))
  );
  RETURN NULL;
END;
$$;

CREATE TRIGGER rights_requests_audit
  AFTER INSERT OR UPDATE ON public.rights_requests
  FOR EACH ROW EXECUTE FUNCTION app.audit_scope_change('rights');


-- ===========================================================================
-- (7) Grants + RLS (D-019) — `anon` gets nothing (public intake is Stage 3)
-- ===========================================================================

REVOKE ALL ON public.rights_requests FROM anon, authenticated;

GRANT SELECT ON public.rights_requests TO authenticated;
-- What a person records. Never the code, the respond-by date, the status on
-- insert, or any *_recorded_* / closed_* / created_* stamp.
GRANT INSERT (organization_id, kind, received_on, channel, requester_name, requester_email, requester_phone,
  requester_capacity, principal_identifier, summary, related_request_id, nominee_name, nominee_contact,
  nominee_relationship, owner_user_id) ON public.rights_requests TO authenticated;
-- After it exists: the request, the identity check, the response and the
-- lifecycle — but not WHEN it was received, which starts the clock.
GRANT UPDATE (kind, channel, requester_name, requester_email, requester_phone, requester_capacity, principal_identifier,
  summary, related_request_id, nominee_name, nominee_contact, nominee_relationship, owner_user_id,
  identity_verified_on, identity_method, status, outcome, responded_on, response_summary, closure_reason)
  ON public.rights_requests TO authenticated;
-- No DELETE: a request is never deleted; it is withdrawn or void, with the reason.

ALTER TABLE public.rights_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY rights_requests_select_member ON public.rights_requests
  FOR SELECT TO authenticated
  USING (
    organization_id IN (SELECT app.current_user_organization_ids())
    AND app.has_permission(organization_id, 'rights.read')
  );

CREATE POLICY rights_requests_insert_writer ON public.rights_requests
  FOR INSERT TO authenticated
  WITH CHECK (
    organization_id IN (SELECT app.current_user_organization_ids())
    AND app.has_permission(organization_id, 'rights.write')
  );

CREATE POLICY rights_requests_update_writer ON public.rights_requests
  FOR UPDATE TO authenticated
  USING (
    organization_id IN (SELECT app.current_user_organization_ids())
    AND app.has_permission(organization_id, 'rights.write')
  )
  WITH CHECK (
    organization_id IN (SELECT app.current_user_organization_ids())
    AND app.has_permission(organization_id, 'rights.write')
  );


-- ===========================================================================
-- (8) Exposure model 1.2.0 — mirrors packages/core/src/exposure.ts
-- ===========================================================================
-- SLICE_10 §6, as approved (D-079.6, D-080): the rights rows on head 7. One
-- version per stage: an applied rule never changes under the same version
-- (D-074), so 1.1.0's migration stays as it was and this one replaces the
-- functions. A stored snapshot keeps the version it was recorded under.

CREATE OR REPLACE FUNCTION app.exposure_model_version()
RETURNS text
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = ''
AS $$
  SELECT '1.2.0'::text;
$$;

-- §6.2b: facts the Slice 10 registers record that bear on a head DIRECTLY.
-- `exposed`: when it holds, the head is Exposed. `not_mitigated`: when it
-- holds, the head cannot be Mitigated (a cap, not a status). `reason`
-- (1.2.0): when it holds, the head says so and nothing more — a TrustStack
-- target, never statute. `ord` is core's MODULE_INPUT_CODES order.
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
     '{n} rights requests or grievances are open past TrustStack''s 30-day response target (a target, not a statutory period).');
$$;

REVOKE ALL ON FUNCTION app.exposure_model_version(), app.exposure_module_inputs() FROM PUBLIC;

-- The evaluator, from its 1.1.0 body with the 1.2.0 rules: the rights facts
-- join the module counts; a `reason` row adds its reason and sets nothing.
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
  v_guardian text := p_input #>> '{scope,guardianData}';
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
BEGIN
  SELECT * INTO v_meta FROM app.exposure_heads() h WHERE h.code = p_head;
  SELECT * INTO v_t FROM app.exposure_thresholds();
  v_ceiling_crore := v_meta.ceiling_rupees / 10000000; -- every modelled ceiling is whole crore

  SELECT app.exposure_strongest(
           ARRAY[p_input #>> '{scope,childrenData}']
           || COALESCE((SELECT array_agg(x) FROM jsonb_array_elements_text(p_input #> '{register,childrenData}') x), ARRAY[]::text[]))
    INTO v_children;

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

  -- --- The workflow modules' facts (core `moduleInputCounts`, `recentBreachCount`) — 1.1.0, 1.2.0
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
  v_counts := jsonb_build_object('breach_board_overdue', v_n_board_overdue, 'breach_principals_pending', v_n_principals_pending,
                                 'rights_ceiling_overdue', v_n_rights_ceiling, 'rights_target_overdue', v_n_rights_target);
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

-- The inputs, from the 1.1.0 body, plus the rights register.
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
      WHERE r.organization_id = p_organization_id), '[]'::jsonb));

  RETURN jsonb_build_object('input', v_input, 'assessmentId', v_chosen, 'scoreSnapshotId', v_snapshot);
END;
$$;

REVOKE ALL ON FUNCTION app.exposure_evaluate_head(jsonb, text), app.exposure_input(uuid, date) FROM PUBLIC;


-- ===========================================================================
-- (9) Apply-time assertions
-- ===========================================================================

DO $$
BEGIN
  ASSERT app.rights_ceiling_days() = 90, 'Rule 14(3): ninety days';
  ASSERT app.rights_target_days() = 30, 'the TrustStack target: thirty days';
  ASSERT array_length(app.rights_kinds(), 1) = 7, 'seven kinds (s.11–14)';
  ASSERT NOT ('restrict' = ANY (app.rights_kinds())), 'no right the Act does not grant';
  ASSERT app.rights_statuses() = ARRAY['open', 'responded', 'withdrawn', 'void'], 'four statuses';
  ASSERT app.rights_transition_allowed('open', 'responded') AND app.rights_transition_allowed('void', 'open'), 'transitions';
  ASSERT NOT app.rights_transition_allowed('responded', 'void') AND NOT app.rights_transition_allowed('withdrawn', 'responded'),
    'every closed state reopens to open only';
  ASSERT DATE '2026-10-01' + app.rights_ceiling_days() = DATE '2026-12-30', 'the clock is calendar days';
  -- The model.
  ASSERT app.exposure_model_version() = '1.2.0', 'model 1.2.0';
  ASSERT (SELECT count(*) FROM app.exposure_module_inputs()) = 4, 'four module rows in 1.2.0';
  ASSERT (SELECT string_agg(code || ':' || head || ':' || effect, ',' ORDER BY ord) FROM app.exposure_module_inputs() WHERE head = 'H7')
         = 'rights_ceiling_overdue:H7:exposed,rights_target_overdue:H7:reason', 'the two head-7 rows';
  -- Every existing action still has exactly one parent.
  ASSERT NOT EXISTS (
    SELECT 1 FROM public.gap_actions WHERE num_nonnulls(gap_id, ropa_gap_id, breach_incident_id, rights_request_id) <> 1), 'one parent';
END;
$$;
