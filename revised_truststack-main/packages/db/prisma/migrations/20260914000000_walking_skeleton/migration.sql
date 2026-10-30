-- Slice 0B — walking skeleton.
-- Four tables, RLS on all four, least-privilege grants, append-only audit log.
--
-- DPDP Rules 2025: Rule 6(b) access control (RLS from the first migration) and
-- Rule 6(c) visibility through logs (audit_logs from day one).
--
-- Prisma generated the DDL below the extension block; everything from
-- "Tenant-isolation helpers" onwards is hand-written and has no Prisma equivalent.

-- citext for case-insensitive email. Supabase keeps extensions in `extensions`.
CREATE SCHEMA IF NOT EXISTS "extensions";
CREATE EXTENSION IF NOT EXISTS "citext" WITH SCHEMA "extensions";

-- CreateTable
CREATE TABLE "organizations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "legal_name" TEXT,
    "organization_type" TEXT NOT NULL,
    "industry_code" TEXT,
    "parent_organization_id" UUID,
    "consultant_assisted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "organizations_type_check" CHECK ("organization_type" IN ('university', 'company', 'government', 'non_profit', 'other')),
    CONSTRAINT "organizations_not_own_parent" CHECK ("parent_organization_id" IS NULL OR "parent_organization_id" <> "id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "auth_provider_user_id" TEXT NOT NULL,
    "email" extensions.CITEXT NOT NULL,
    "full_name" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organization_users_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "organization_users_status_check" CHECK ("status" IN ('active', 'invited', 'suspended'))
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "user_id" UUID,
    "event_type" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" UUID,
    "description" TEXT NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_auth_provider_user_id_key" ON "users"("auth_provider_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "organization_users_user_id_idx" ON "organization_users"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "organization_users_organization_id_user_id_key" ON "organization_users"("organization_id", "user_id");

-- CreateIndex
CREATE INDEX "audit_logs_organization_id_created_at_idx" ON "audit_logs"("organization_id", "created_at" DESC);

-- AddForeignKey
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_parent_organization_id_fkey" FOREIGN KEY ("parent_organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_users" ADD CONSTRAINT "organization_users_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_users" ADD CONSTRAINT "organization_users_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- ===========================================================================
-- updated_at maintenance
-- ===========================================================================

CREATE SCHEMA IF NOT EXISTS "app";

CREATE OR REPLACE FUNCTION app.touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER organizations_touch_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION app.touch_updated_at();

CREATE TRIGGER users_touch_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION app.touch_updated_at();


-- ===========================================================================
-- Tenant-isolation helpers
-- ===========================================================================
-- A policy ON organization_users that queried organization_users would recurse.
-- These SECURITY DEFINER helpers read membership without re-entering RLS, and
-- every tenant policy goes through them — one definition of "my organisations".
--
-- They live in `app`, a schema PostgREST does not expose, so they cannot be
-- called as RPC endpoints. search_path is pinned empty against hijacking.

CREATE OR REPLACE FUNCTION app.current_user_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT u.id
  FROM public.users u
  WHERE u.auth_provider_user_id = (SELECT auth.jwt() ->> 'sub');
$$;

CREATE OR REPLACE FUNCTION app.current_user_organization_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT ou.organization_id
  FROM public.organization_users ou
  JOIN public.users u ON u.id = ou.user_id
  WHERE u.auth_provider_user_id = (SELECT auth.jwt() ->> 'sub')
    AND ou.status = 'active';
$$;

REVOKE ALL ON FUNCTION app.current_user_id() FROM PUBLIC;
REVOKE ALL ON FUNCTION app.current_user_organization_ids() FROM PUBLIC;
REVOKE ALL ON FUNCTION app.touch_updated_at() FROM PUBLIC;
GRANT USAGE ON SCHEMA app TO authenticated;
GRANT EXECUTE ON FUNCTION app.current_user_id() TO authenticated;
GRANT EXECUTE ON FUNCTION app.current_user_organization_ids() TO authenticated;


-- ===========================================================================
-- Grants — least privilege
-- ===========================================================================
-- Supabase's default privileges hand anon/authenticated ALL on new public
-- tables. Take that back: anon gets nothing, authenticated gets only what the
-- policies below are written for. RLS then filters rows within those grants.

REVOKE ALL ON public.organizations, public.users, public.organization_users, public.audit_logs FROM anon, authenticated;

GRANT SELECT ON public.organizations TO authenticated;
GRANT SELECT ON public.users TO authenticated;
GRANT SELECT ON public.organization_users TO authenticated;
GRANT SELECT, INSERT ON public.audit_logs TO authenticated;  -- no UPDATE/DELETE: append-only


-- ===========================================================================
-- Row Level Security — enabled AND policied in the same migration
-- ===========================================================================

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- organizations: members see their own, non-deleted organisations.
CREATE POLICY organizations_select_member
  ON public.organizations
  FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL
    AND id IN (SELECT app.current_user_organization_ids())
  );

-- users: a user sees their own profile row. Co-member visibility is Slice 1.
CREATE POLICY users_select_self
  ON public.users
  FOR SELECT
  TO authenticated
  USING (auth_provider_user_id = (SELECT auth.jwt() ->> 'sub'));

-- organization_users: membership rows of organisations the caller is active in.
CREATE POLICY organization_users_select_member
  ON public.organization_users
  FOR SELECT
  TO authenticated
  USING (organization_id IN (SELECT app.current_user_organization_ids()));

-- audit_logs: members read their organisation's log.
CREATE POLICY audit_logs_select_member
  ON public.audit_logs
  FOR SELECT
  TO authenticated
  USING (organization_id IN (SELECT app.current_user_organization_ids()));

-- audit_logs: a member may append events for their own organisation, as
-- themselves only — never forge another user's entry or another tenant's log.
CREATE POLICY audit_logs_insert_member_as_self
  ON public.audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (SELECT app.current_user_organization_ids())
    AND user_id = (SELECT app.current_user_id())
  );
