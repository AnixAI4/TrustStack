-- Slice 1 — tenancy, identity and RBAC.
--
-- DPDP Rules 2025: Rule 6(b) access control over resources holding personal
-- data (roles + permission-checked writes) and Rule 6(c) visibility through
-- logs (every invite, acceptance and role change writes audit_logs).
--
-- Layout: (1) Prisma-generated DDL, reordered so role_id can be backfilled
-- before it becomes NOT NULL; (2) reference data — the ten roles and the
-- permission matrix, generated from packages/core/src/rbac.ts (a unit test
-- fails if they differ, D-020); (3) hand-written helpers, write RPCs, grants
-- and RLS, which Prisma cannot express.

-- ===========================================================================
-- (1) DDL
-- ===========================================================================

-- CreateTable
CREATE TABLE "roles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "is_platform_role" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "role_id" UUID NOT NULL,
    "permission_id" UUID NOT NULL,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("role_id","permission_id")
);

-- CreateTable
CREATE TABLE "organization_invites" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "email" extensions.CITEXT NOT NULL,
    "role_id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "invited_by" UUID NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL DEFAULT (now() + '7 days'::interval),
    "accepted_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organization_invites_pkey" PRIMARY KEY ("id"),
    -- A hex SHA-256 digest, never a raw token (pitfall 5).
    CONSTRAINT "organization_invites_token_hash_is_sha256" CHECK ("token_hash" ~ '^[0-9a-f]{64}$')
);

-- AlterTable — nullable first; backfilled and tightened in (2).
ALTER TABLE "organization_users" ADD COLUMN     "department_id" UUID,
ADD COLUMN     "invited_at" TIMESTAMPTZ(6),
ADD COLUMN     "invited_by" UUID,
ADD COLUMN     "joined_at" TIMESTAMPTZ(6),
ADD COLUMN     "role_id" UUID;

-- CreateIndex
CREATE UNIQUE INDEX "roles_code_key" ON "roles"("code");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_code_key" ON "permissions"("code");

-- CreateIndex
CREATE INDEX "role_permissions_permission_id_idx" ON "role_permissions"("permission_id");

-- CreateIndex
CREATE UNIQUE INDEX "organization_invites_token_hash_key" ON "organization_invites"("token_hash");

-- CreateIndex
CREATE INDEX "organization_invites_organization_id_idx" ON "organization_invites"("organization_id");

-- One open invitation per email per organisation. Per-org, never global (pitfall 4).
CREATE UNIQUE INDEX "organization_invites_open_org_email_key"
  ON "organization_invites"("organization_id", "email") WHERE "accepted_at" IS NULL;

-- CreateIndex
CREATE INDEX "organization_users_role_id_idx" ON "organization_users"("role_id");

-- AddForeignKey
ALTER TABLE "organization_users" ADD CONSTRAINT "organization_users_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_users" ADD CONSTRAINT "organization_users_invited_by_fkey" FOREIGN KEY ("invited_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_invites" ADD CONSTRAINT "organization_invites_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_invites" ADD CONSTRAINT "organization_invites_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_invites" ADD CONSTRAINT "organization_invites_invited_by_fkey" FOREIGN KEY ("invited_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- ===========================================================================
-- (2) Reference data — must exist in every environment, so it ships in the
-- migration, not the seed (D-020). Changing the matrix = a new migration.
-- ===========================================================================

INSERT INTO public.roles (code, name, description, is_platform_role) VALUES
  ('super_admin', 'Super Admin', 'Platform operator. Full access within organisations they are a member of.', true),
  ('consultant', 'Anix AI Consultant', 'Runs assessments for the client organisations they are assigned to.', false),
  ('organization_admin', 'Organisation Admin', 'Manages the organisation''s users, roles and profile.', false),
  ('executive_sponsor', 'Executive Sponsor', 'Board-level sponsor. Reads scores, gaps and reports.', false),
  ('dpdp_owner', 'DPDP Programme Owner', 'Owns the DPDP programme: assessments, evidence review and reports.', false),
  ('department_owner', 'Department Owner', 'Answers and evidences the questions assigned to their department.', false),
  ('legal_user', 'Legal User', 'Answers and evidences legal, notice and contract questions.', false),
  ('it_security_user', 'IT/Security User', 'Answers and evidences security and breach-readiness questions.', false),
  ('procurement_user', 'Procurement User', 'Answers and evidences vendor and processor questions.', false),
  ('auditor_reviewer', 'Auditor/Reviewer', 'Independent reviewer. Read-only access plus the audit log.', false);

INSERT INTO public.permissions (code, description) VALUES
  ('organization.read', 'View the organisation profile.'),
  ('organization.update', 'Edit the organisation profile.'),
  ('organization.users.read', 'List the organisation''s users and pending invitations.'),
  ('organization.users.invite', 'Invite a user into the organisation with a role.'),
  ('organization.users.update', 'Change a member''s role or suspend them.'),
  ('question.read', 'Read the question bank.'),
  ('admin.question.update', 'Edit question-bank templates (platform).'),
  ('assessment.read', 'View assessments.'),
  ('assessment.write', 'Create and manage assessments.'),
  ('assessment.finalise', 'Finalise an assessment and freeze its score snapshot.'),
  ('response.read', 'View assessment responses.'),
  ('response.write', 'Answer assessment questions.'),
  ('evidence.read', 'View evidence.'),
  ('evidence.write', 'Upload and link evidence.'),
  ('evidence.review', 'Accept or reject evidence and set its evidence level.'),
  ('ropa.read', 'View Records of Processing Activities.'),
  ('ropa.write', 'Create and edit Records of Processing Activities.'),
  ('score.read', 'View scores.'),
  ('score.calculate', 'Run the scoring engine.'),
  ('gap.read', 'View gaps and remediation actions.'),
  ('gap.write', 'Manage gaps and remediation actions.'),
  ('report.read', 'View reports.'),
  ('report.generate', 'Generate reports.'),
  ('report.download', 'Download reports.'),
  ('ai.use', 'Use the AI assistant within the organisation''s own data.'),
  ('audit.read', 'Read the organisation''s full audit log.'),
  ('audit.read_summary', 'Read audit-log summaries.'),
  ('audit.read_own', 'Read audit entries for one''s own actions.');

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM (VALUES
  ('super_admin', 'organization.read'),
  ('super_admin', 'organization.update'),
  ('super_admin', 'organization.users.read'),
  ('super_admin', 'organization.users.invite'),
  ('super_admin', 'organization.users.update'),
  ('super_admin', 'question.read'),
  ('super_admin', 'admin.question.update'),
  ('super_admin', 'assessment.read'),
  ('super_admin', 'assessment.write'),
  ('super_admin', 'assessment.finalise'),
  ('super_admin', 'response.read'),
  ('super_admin', 'response.write'),
  ('super_admin', 'evidence.read'),
  ('super_admin', 'evidence.write'),
  ('super_admin', 'evidence.review'),
  ('super_admin', 'ropa.read'),
  ('super_admin', 'ropa.write'),
  ('super_admin', 'score.read'),
  ('super_admin', 'score.calculate'),
  ('super_admin', 'gap.read'),
  ('super_admin', 'gap.write'),
  ('super_admin', 'report.read'),
  ('super_admin', 'report.generate'),
  ('super_admin', 'report.download'),
  ('super_admin', 'ai.use'),
  ('super_admin', 'audit.read'),
  ('super_admin', 'audit.read_summary'),
  ('super_admin', 'audit.read_own'),
  ('consultant', 'organization.read'),
  ('consultant', 'question.read'),
  ('consultant', 'assessment.read'),
  ('consultant', 'response.read'),
  ('consultant', 'evidence.read'),
  ('consultant', 'ropa.read'),
  ('consultant', 'score.read'),
  ('consultant', 'gap.read'),
  ('consultant', 'report.read'),
  ('consultant', 'organization.users.read'),
  ('consultant', 'assessment.write'),
  ('consultant', 'assessment.finalise'),
  ('consultant', 'response.write'),
  ('consultant', 'evidence.write'),
  ('consultant', 'evidence.review'),
  ('consultant', 'ropa.write'),
  ('consultant', 'score.calculate'),
  ('consultant', 'gap.write'),
  ('consultant', 'report.generate'),
  ('consultant', 'report.download'),
  ('consultant', 'ai.use'),
  ('consultant', 'audit.read'),
  ('consultant', 'audit.read_summary'),
  ('consultant', 'audit.read_own'),
  ('consultant', 'organization.update'),
  ('consultant', 'organization.users.invite'),
  ('organization_admin', 'organization.read'),
  ('organization_admin', 'organization.update'),
  ('organization_admin', 'organization.users.read'),
  ('organization_admin', 'organization.users.invite'),
  ('organization_admin', 'organization.users.update'),
  ('organization_admin', 'question.read'),
  ('organization_admin', 'assessment.read'),
  ('organization_admin', 'assessment.write'),
  ('organization_admin', 'assessment.finalise'),
  ('organization_admin', 'response.read'),
  ('organization_admin', 'response.write'),
  ('organization_admin', 'evidence.read'),
  ('organization_admin', 'evidence.write'),
  ('organization_admin', 'evidence.review'),
  ('organization_admin', 'ropa.read'),
  ('organization_admin', 'ropa.write'),
  ('organization_admin', 'score.read'),
  ('organization_admin', 'score.calculate'),
  ('organization_admin', 'gap.read'),
  ('organization_admin', 'gap.write'),
  ('organization_admin', 'report.read'),
  ('organization_admin', 'report.generate'),
  ('organization_admin', 'report.download'),
  ('organization_admin', 'ai.use'),
  ('organization_admin', 'audit.read'),
  ('organization_admin', 'audit.read_summary'),
  ('organization_admin', 'audit.read_own'),
  ('executive_sponsor', 'organization.read'),
  ('executive_sponsor', 'question.read'),
  ('executive_sponsor', 'assessment.read'),
  ('executive_sponsor', 'response.read'),
  ('executive_sponsor', 'evidence.read'),
  ('executive_sponsor', 'ropa.read'),
  ('executive_sponsor', 'score.read'),
  ('executive_sponsor', 'gap.read'),
  ('executive_sponsor', 'report.read'),
  ('executive_sponsor', 'report.download'),
  ('executive_sponsor', 'ai.use'),
  ('executive_sponsor', 'audit.read_summary'),
  ('dpdp_owner', 'organization.read'),
  ('dpdp_owner', 'question.read'),
  ('dpdp_owner', 'assessment.read'),
  ('dpdp_owner', 'response.read'),
  ('dpdp_owner', 'evidence.read'),
  ('dpdp_owner', 'ropa.read'),
  ('dpdp_owner', 'score.read'),
  ('dpdp_owner', 'gap.read'),
  ('dpdp_owner', 'report.read'),
  ('dpdp_owner', 'organization.users.read'),
  ('dpdp_owner', 'assessment.write'),
  ('dpdp_owner', 'assessment.finalise'),
  ('dpdp_owner', 'response.write'),
  ('dpdp_owner', 'evidence.write'),
  ('dpdp_owner', 'evidence.review'),
  ('dpdp_owner', 'ropa.write'),
  ('dpdp_owner', 'score.calculate'),
  ('dpdp_owner', 'gap.write'),
  ('dpdp_owner', 'report.generate'),
  ('dpdp_owner', 'report.download'),
  ('dpdp_owner', 'ai.use'),
  ('dpdp_owner', 'audit.read'),
  ('dpdp_owner', 'audit.read_summary'),
  ('dpdp_owner', 'audit.read_own'),
  ('department_owner', 'organization.read'),
  ('department_owner', 'question.read'),
  ('department_owner', 'assessment.read'),
  ('department_owner', 'response.read'),
  ('department_owner', 'evidence.read'),
  ('department_owner', 'ropa.read'),
  ('department_owner', 'score.read'),
  ('department_owner', 'gap.read'),
  ('department_owner', 'report.read'),
  ('department_owner', 'response.write'),
  ('department_owner', 'evidence.write'),
  ('department_owner', 'ropa.write'),
  ('department_owner', 'gap.write'),
  ('department_owner', 'ai.use'),
  ('department_owner', 'audit.read_own'),
  ('legal_user', 'organization.read'),
  ('legal_user', 'question.read'),
  ('legal_user', 'assessment.read'),
  ('legal_user', 'response.read'),
  ('legal_user', 'evidence.read'),
  ('legal_user', 'ropa.read'),
  ('legal_user', 'score.read'),
  ('legal_user', 'gap.read'),
  ('legal_user', 'report.read'),
  ('legal_user', 'response.write'),
  ('legal_user', 'evidence.write'),
  ('legal_user', 'ropa.write'),
  ('legal_user', 'gap.write'),
  ('legal_user', 'ai.use'),
  ('legal_user', 'audit.read_own'),
  ('it_security_user', 'organization.read'),
  ('it_security_user', 'question.read'),
  ('it_security_user', 'assessment.read'),
  ('it_security_user', 'response.read'),
  ('it_security_user', 'evidence.read'),
  ('it_security_user', 'ropa.read'),
  ('it_security_user', 'score.read'),
  ('it_security_user', 'gap.read'),
  ('it_security_user', 'report.read'),
  ('it_security_user', 'response.write'),
  ('it_security_user', 'evidence.write'),
  ('it_security_user', 'ropa.write'),
  ('it_security_user', 'gap.write'),
  ('it_security_user', 'ai.use'),
  ('it_security_user', 'audit.read_own'),
  ('procurement_user', 'organization.read'),
  ('procurement_user', 'question.read'),
  ('procurement_user', 'assessment.read'),
  ('procurement_user', 'response.read'),
  ('procurement_user', 'evidence.read'),
  ('procurement_user', 'ropa.read'),
  ('procurement_user', 'score.read'),
  ('procurement_user', 'gap.read'),
  ('procurement_user', 'report.read'),
  ('procurement_user', 'response.write'),
  ('procurement_user', 'evidence.write'),
  ('procurement_user', 'ropa.write'),
  ('procurement_user', 'gap.write'),
  ('procurement_user', 'ai.use'),
  ('procurement_user', 'audit.read_own'),
  ('auditor_reviewer', 'organization.read'),
  ('auditor_reviewer', 'question.read'),
  ('auditor_reviewer', 'assessment.read'),
  ('auditor_reviewer', 'response.read'),
  ('auditor_reviewer', 'evidence.read'),
  ('auditor_reviewer', 'ropa.read'),
  ('auditor_reviewer', 'score.read'),
  ('auditor_reviewer', 'gap.read'),
  ('auditor_reviewer', 'report.read'),
  ('auditor_reviewer', 'report.download'),
  ('auditor_reviewer', 'ai.use'),
  ('auditor_reviewer', 'audit.read')
) AS matrix(role_code, permission_code)
JOIN public.roles r ON r.code = matrix.role_code
JOIN public.permissions p ON p.code = matrix.permission_code;

-- Existing Slice 0B members administered their organisation; keep that.
UPDATE public.organization_users
SET role_id = (SELECT id FROM public.roles WHERE code = 'organization_admin'),
    joined_at = COALESCE(joined_at, created_at)
WHERE role_id IS NULL;

ALTER TABLE public.organization_users ALTER COLUMN role_id SET NOT NULL;


-- ===========================================================================
-- (3a) Permission helper
-- ===========================================================================
-- Same pattern as the 0B helpers (D-019): SECURITY DEFINER so policies can use
-- it without recursion, schema `app` so PostgREST cannot expose it as RPC.

CREATE OR REPLACE FUNCTION app.has_permission(p_organization_id uuid, p_permission_code text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_users ou
    JOIN public.users u ON u.id = ou.user_id
    JOIN public.role_permissions rp ON rp.role_id = ou.role_id
    JOIN public.permissions p ON p.id = rp.permission_id
    WHERE u.auth_provider_user_id = (SELECT auth.jwt() ->> 'sub')
      AND ou.organization_id = p_organization_id
      AND ou.status = 'active'
      AND p.code = p_permission_code
  );
$$;

REVOKE ALL ON FUNCTION app.has_permission(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app.has_permission(uuid, text) TO authenticated;

-- True when the caller, in this organisation, holds every permission of the role.
CREATE OR REPLACE FUNCTION app.can_grant_role(p_organization_id uuid, p_role_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT NOT r.is_platform_role
     AND NOT EXISTS (
       SELECT 1
       FROM public.role_permissions rp
       JOIN public.permissions p ON p.id = rp.permission_id
       WHERE rp.role_id = r.id
         AND NOT app.has_permission(p_organization_id, p.code)
     )
  FROM public.roles r
  WHERE r.id = p_role_id;
$$;

REVOKE ALL ON FUNCTION app.can_grant_role(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app.can_grant_role(uuid, uuid) TO authenticated;


-- ===========================================================================
-- (3b) Write RPCs
-- ===========================================================================
-- No INSERT/UPDATE grants on membership or invite tables. Every write goes
-- through one of these SECURITY DEFINER functions, which re-check permission
-- in the database (the API checks first — two locks, D-003) and write their
-- own audit row in the same transaction, so no write is ever unaudited.
--
-- The invitee is not yet a member when accepting: plain RLS could neither show
-- them the invite nor let them insert the membership (pitfall 3).
--
-- search_path is empty, so citext's operators (schema `extensions`) are not
-- visible here: a bare `=` would silently fall back to case-SENSITIVE text
-- comparison. Emails are compared with lower(...::text) instead.
--
-- Errors use custom SQLSTATEs the API maps to its envelope:
--   TS401 unauthenticated · TS403 forbidden · TS404 not found / invite invalid
--   TS409 conflict · TS410 invite expired · TS422 validation / last admin

CREATE OR REPLACE FUNCTION public.create_organization_invite(
  p_organization_id uuid,
  p_email text,
  p_role_code text,
  p_token_hash text
)
RETURNS TABLE (invite_id uuid, expires_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_actor uuid := app.current_user_id();
  v_role public.roles;
  v_invite public.organization_invites;
BEGIN
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'Sign in to continue.' USING ERRCODE = 'TS401';
  END IF;
  IF NOT app.has_permission(p_organization_id, 'organization.users.invite') THEN
    RAISE EXCEPTION 'You do not have permission to invite users.' USING ERRCODE = 'TS403';
  END IF;

  SELECT * INTO v_role FROM public.roles WHERE code = p_role_code;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Unknown role.' USING ERRCODE = 'TS422';
  END IF;
  IF NOT app.can_grant_role(p_organization_id, v_role.id) THEN
    RAISE EXCEPTION 'You cannot grant this role.' USING ERRCODE = 'TS403';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.organization_users ou
    JOIN public.users u ON u.id = ou.user_id
    WHERE ou.organization_id = p_organization_id
      AND lower(u.email::text) = lower(p_email)
  ) THEN
    RAISE EXCEPTION 'That person is already a member of this organisation.' USING ERRCODE = 'TS409';
  END IF;

  BEGIN
    INSERT INTO public.organization_invites (organization_id, email, role_id, token_hash, invited_by)
    VALUES (p_organization_id, p_email::extensions.citext, v_role.id, p_token_hash, v_actor)
    RETURNING * INTO v_invite;
  EXCEPTION WHEN unique_violation THEN
    RAISE EXCEPTION 'An invitation for that email is already pending.' USING ERRCODE = 'TS409';
  END;

  INSERT INTO public.audit_logs (organization_id, user_id, event_type, entity_type, entity_id, description, metadata)
  VALUES (
    p_organization_id, v_actor, 'organization.user.invited', 'organization_invite', v_invite.id,
    'Invited a user to the organisation',
    jsonb_build_object('email', v_invite.email::text, 'role', v_role.code, 'expiresAt', v_invite.expires_at)
  );

  RETURN QUERY SELECT v_invite.id, v_invite.expires_at;
END;
$$;

CREATE OR REPLACE FUNCTION public.accept_organization_invite(p_token_hash text)
RETURNS TABLE (organization_id uuid, role_code text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_sub text := auth.jwt() ->> 'sub';
  v_email text := auth.jwt() ->> 'email';
  v_invite public.organization_invites;
  v_role_code text;
  v_user uuid;
BEGIN
  IF v_sub IS NULL THEN
    RAISE EXCEPTION 'Sign in to continue.' USING ERRCODE = 'TS401';
  END IF;

  SELECT * INTO v_invite FROM public.organization_invites i WHERE i.token_hash = p_token_hash FOR UPDATE;
  IF NOT FOUND OR v_invite.accepted_at IS NOT NULL THEN
    RAISE EXCEPTION 'This invitation is not valid or has already been used.' USING ERRCODE = 'TS404';
  END IF;
  IF v_invite.expires_at <= now() THEN
    RAISE EXCEPTION 'This invitation has expired. Ask for a new one.' USING ERRCODE = 'TS410';
  END IF;
  IF v_email IS NULL OR lower(v_email) <> lower(v_invite.email::text) THEN
    RAISE EXCEPTION 'This invitation was sent to a different email address.' USING ERRCODE = 'TS403';
  END IF;

  SELECT u.id INTO v_user FROM public.users u WHERE u.auth_provider_user_id = v_sub;
  IF v_user IS NULL THEN
    BEGIN
      INSERT INTO public.users (auth_provider_user_id, email, full_name)
      VALUES (v_sub, v_invite.email, NULLIF(auth.jwt() -> 'user_metadata' ->> 'full_name', ''))
      RETURNING id INTO v_user;
    EXCEPTION WHEN unique_violation THEN
      RAISE EXCEPTION 'That email already belongs to another account.' USING ERRCODE = 'TS409';
    END;
  END IF;

  BEGIN
    INSERT INTO public.organization_users (organization_id, user_id, role_id, status, invited_by, invited_at, joined_at)
    VALUES (v_invite.organization_id, v_user, v_invite.role_id, 'active', v_invite.invited_by, v_invite.created_at, now());
  EXCEPTION WHEN unique_violation THEN
    RAISE EXCEPTION 'You are already a member of this organisation.' USING ERRCODE = 'TS409';
  END;

  UPDATE public.organization_invites SET accepted_at = now() WHERE id = v_invite.id;

  SELECT r.code INTO v_role_code FROM public.roles r WHERE r.id = v_invite.role_id;

  -- Written after the membership exists and inside the same transaction (pitfall 3).
  INSERT INTO public.audit_logs (organization_id, user_id, event_type, entity_type, entity_id, description, metadata)
  VALUES (
    v_invite.organization_id, v_user, 'organization.invite.accepted', 'organization_invite', v_invite.id,
    'Accepted an invitation and joined the organisation',
    jsonb_build_object('role', v_role_code, 'invitedBy', v_invite.invited_by)
  );

  RETURN QUERY SELECT v_invite.organization_id, v_role_code;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_organization_member(
  p_organization_id uuid,
  p_user_id uuid,
  p_role_code text DEFAULT NULL,
  p_status text DEFAULT NULL
)
RETURNS TABLE (role_code text, status text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_actor uuid := app.current_user_id();
  v_admin_role uuid := (SELECT r.id FROM public.roles r WHERE r.code = 'organization_admin');
  v_target public.organization_users;
  v_from_role text;
  v_new_role public.roles;
  v_admins integer;
BEGIN
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'Sign in to continue.' USING ERRCODE = 'TS401';
  END IF;
  IF NOT app.has_permission(p_organization_id, 'organization.users.update') THEN
    RAISE EXCEPTION 'You do not have permission to change members.' USING ERRCODE = 'TS403';
  END IF;
  IF p_role_code IS NULL AND p_status IS NULL THEN
    RAISE EXCEPTION 'Nothing to change.' USING ERRCODE = 'TS422';
  END IF;
  IF p_status IS NOT NULL AND p_status NOT IN ('active', 'suspended') THEN
    RAISE EXCEPTION 'Status must be active or suspended.' USING ERRCODE = 'TS422';
  END IF;

  -- Lock this organisation's admin rows first so two admins cannot demote each
  -- other concurrently and leave nobody in charge.
  PERFORM 1 FROM public.organization_users ou
  WHERE ou.organization_id = p_organization_id AND ou.role_id = v_admin_role
  FOR UPDATE;

  SELECT * INTO v_target FROM public.organization_users ou
  WHERE ou.organization_id = p_organization_id AND ou.user_id = p_user_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Member not found.' USING ERRCODE = 'TS404';
  END IF;
  SELECT r.code INTO v_from_role FROM public.roles r WHERE r.id = v_target.role_id;

  -- Cannot touch someone who holds permissions you lack (e.g. a super_admin).
  IF NOT app.can_grant_role(p_organization_id, v_target.role_id) THEN
    RAISE EXCEPTION 'You cannot change a member whose role outranks yours.' USING ERRCODE = 'TS403';
  END IF;

  IF p_role_code IS NOT NULL THEN
    SELECT * INTO v_new_role FROM public.roles r WHERE r.code = p_role_code;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Unknown role.' USING ERRCODE = 'TS422';
    END IF;
    IF NOT app.can_grant_role(p_organization_id, v_new_role.id) THEN
      RAISE EXCEPTION 'You cannot grant this role.' USING ERRCODE = 'TS403';
    END IF;
  END IF;

  IF v_target.role_id = v_admin_role AND v_target.status = 'active'
     AND ((p_role_code IS NOT NULL AND p_role_code <> 'organization_admin')
          OR (p_status IS NOT NULL AND p_status <> 'active')) THEN
    SELECT count(*) INTO v_admins FROM public.organization_users ou
    WHERE ou.organization_id = p_organization_id AND ou.role_id = v_admin_role AND ou.status = 'active';
    IF v_admins <= 1 THEN
      RAISE EXCEPTION 'An organisation must keep at least one active Organisation Admin.' USING ERRCODE = 'TS422', HINT = 'LAST_ORGANIZATION_ADMIN';
    END IF;
  END IF;

  UPDATE public.organization_users ou
  SET role_id = COALESCE(v_new_role.id, ou.role_id),
      status = COALESCE(p_status, ou.status)
  WHERE ou.id = v_target.id;

  IF p_role_code IS NOT NULL AND p_role_code <> v_from_role THEN
    INSERT INTO public.audit_logs (organization_id, user_id, event_type, entity_type, entity_id, description, metadata)
    VALUES (
      p_organization_id, v_actor, 'organization.user.role_changed', 'user', p_user_id,
      'Changed a member''s role', jsonb_build_object('from', v_from_role, 'to', p_role_code)
    );
  END IF;
  IF p_status IS NOT NULL AND p_status <> v_target.status THEN
    INSERT INTO public.audit_logs (organization_id, user_id, event_type, entity_type, entity_id, description, metadata)
    VALUES (
      p_organization_id, v_actor, 'organization.user.status_changed', 'user', p_user_id,
      'Changed a member''s status', jsonb_build_object('from', v_target.status, 'to', p_status)
    );
  END IF;

  RETURN QUERY SELECT COALESCE(p_role_code, v_from_role), COALESCE(p_status, v_target.status);
END;
$$;

-- Supabase grants EXECUTE on new public functions to anon; take it back.
REVOKE ALL ON FUNCTION public.create_organization_invite(uuid, text, text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.accept_organization_invite(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.update_organization_member(uuid, uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_organization_invite(uuid, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_organization_invite(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_organization_member(uuid, uuid, text, text) TO authenticated;


-- ===========================================================================
-- (3c) Grants — least privilege (D-019)
-- ===========================================================================

REVOKE ALL ON public.roles, public.permissions, public.role_permissions, public.organization_invites
  FROM anon, authenticated;

GRANT SELECT ON public.roles, public.permissions, public.role_permissions TO authenticated;
-- Column grant: token_hash is never readable through the API, even by admins.
GRANT SELECT (id, organization_id, email, role_id, invited_by, expires_at, accepted_at, created_at)
  ON public.organization_invites TO authenticated;


-- ===========================================================================
-- (3d) Row Level Security
-- ===========================================================================

ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_invites ENABLE ROW LEVEL SECURITY;

-- Global reference data: no organization_id, identical for every tenant.
CREATE POLICY roles_select_authenticated
  ON public.roles FOR SELECT TO authenticated USING (true);
CREATE POLICY permissions_select_authenticated
  ON public.permissions FOR SELECT TO authenticated USING (true);
CREATE POLICY role_permissions_select_authenticated
  ON public.role_permissions FOR SELECT TO authenticated USING (true);

-- Invites: only members who may invite see their organisation's invitations.
CREATE POLICY organization_invites_select_inviter
  ON public.organization_invites
  FOR SELECT
  TO authenticated
  USING (app.has_permission(organization_id, 'organization.users.invite'));

-- users: co-members are visible (names/emails on the Users list). A policy on
-- users may query organization_users freely — only a policy ON
-- organization_users querying itself would recurse (pitfall 1).
CREATE POLICY users_select_co_member
  ON public.users
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT ou.user_id
      FROM public.organization_users ou
      WHERE ou.organization_id IN (SELECT app.current_user_organization_ids())
    )
  );


-- ===========================================================================
-- (3e) Close Prisma's bookkeeping table
-- ===========================================================================
-- `prisma migrate deploy` creates public._prisma_migrations itself, so the 0B
-- migration never revoked it: Supabase's default grants left anon and
-- authenticated with full read/write, and PostgREST exposed it to anyone
-- holding the public anon key. Found in Slice 1; CI now fails any public table
-- that anon can touch.
REVOKE ALL ON public._prisma_migrations FROM anon, authenticated;
ALTER TABLE public._prisma_migrations ENABLE ROW LEVEL SECURITY;  -- no policy: deny-all for API roles
