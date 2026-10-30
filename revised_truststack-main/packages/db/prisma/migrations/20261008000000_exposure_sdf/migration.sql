-- Slice 9, Stage 1 — the facts the exposure model 1.0.0 reads that the
-- database did not hold yet (SLICE_09 §4.4, §6.2). Additive: two nullable
-- columns, one defaulted column, one widened column grant, one replaced
-- guard. Nothing is revoked, so it may go to hosted before merge — but only
-- once Stage 1 is approved (SLICE_09 §12).
--
-- (1) Significant Data Fiduciary notification — ENTERED, NEVER INFERRED.
--     SDF status is for the Central Government to notify (s.10(1)); the
--     platform never infers it (D-028). Head 4 of the Schedule (s.10, up to
--     ₹150 crore) applies only once a person with `organization.update` has
--     recorded the date and the reference of that notification. The scope's
--     internal triggers ("large-scale", "enhanced review") can never set it:
--     no RPC, trigger or default writes these columns.
--
-- (2) Persons with disability who have a lawful guardian (s.9(1)). Head 3 is
--     "additional obligations in relation to children under section 9", and
--     s.9(1) puts the verifiable-consent duty on the data of a person with
--     disability who has a lawful guardian as well as on a child's. The scope
--     gains that question. Absent = `unknown`, like `children_data` and
--     `uses_data_processors`: an organisation that has said nothing has not
--     said "no" (D-026, D-037).

-- ===========================================================================
-- (1) organizations: the SDF notification
-- ===========================================================================

ALTER TABLE public.organizations
  ADD COLUMN sdf_notified_on date,
  ADD COLUMN sdf_notification_ref text;

ALTER TABLE public.organizations
  -- Both or neither: a date with no reference is a claim nobody can check,
  -- and a reference with no date cannot start a clock.
  ADD CONSTRAINT organizations_sdf_both_or_neither
    CHECK ((sdf_notified_on IS NULL) = (sdf_notification_ref IS NULL)),
  ADD CONSTRAINT organizations_sdf_ref_check
    CHECK (sdf_notification_ref IS NULL
           OR (sdf_notification_ref = btrim(sdf_notification_ref)
               AND length(sdf_notification_ref) BETWEEN 1 AND 200)),
  -- The Act came into force in 2023: no notification can predate it.
  ADD CONSTRAINT organizations_sdf_date_check
    CHECK (sdf_notified_on IS NULL OR sdf_notified_on >= DATE '2023-08-11');

-- The two new columns join the editable set. Column grants are additive: the
-- Slice 2 grant on the profile and scope columns stands.
GRANT UPDATE (sdf_notified_on, sdf_notification_ref) ON public.organizations TO authenticated;

-- One RLS UPDATE policy admits `organization.update` OR `scope.write`; this
-- guard decides which column group each may change (D-026). The SDF pair is
-- `organization.update` only: a DPDP Programme Owner may edit the scope but
-- may not declare the organisation a Significant Data Fiduciary.
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
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION app.guard_organization_update() FROM PUBLIC;

-- Audited by the existing `organizations_audit` trigger
-- (`app.audit_scope_change`): `scope.organizations.update`, the actor from the
-- JWT, and the changed column NAMES — never the reference's text.

-- ===========================================================================
-- (2) organization_scopes: persons with disability who have a lawful guardian
-- ===========================================================================

ALTER TABLE public.organization_scopes
  ADD COLUMN guardian_data text NOT NULL DEFAULT 'unknown';

ALTER TABLE public.organization_scopes
  ADD CONSTRAINT organization_scopes_guardian_data_check CHECK (guardian_data IN ('yes', 'no', 'unknown'));

-- `organization_scopes` carries table-level SELECT, INSERT and UPDATE for
-- `authenticated` (Slice 2), gated by its `scope.write` policies: the new
-- column needs no grant of its own, and is audited by `organization_scopes_audit`.
