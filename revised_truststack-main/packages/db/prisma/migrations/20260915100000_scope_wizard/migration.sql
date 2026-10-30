-- Slice 2 — organisation profile and scope wizard.
--
-- DPDP anchoring: D02 Inventory (DI1.3 collection points, DI1.4 system register),
-- D13 Vendor/Data Processor register, Rules 10–11 children's data, s.16 transfers.
--
-- Layout: (1) Prisma-generated DDL; (2) reference data + value migration;
-- (3) CHECK constraints and case-insensitive uniqueness; (4) new permission
-- scope.write (D-026); (5) audit trigger; (6) grants + RLS.
--
-- Every tenant table references other tenant tables through COMPOSITE
-- (organization_id, id) foreign keys, so Org A's system can never point at
-- Org B's department (Slice 2 pitfall 1). Deletes are RESTRICT: a composite
-- SET NULL would null organization_id too.

-- ===========================================================================
-- (1) DDL
-- ===========================================================================

-- AlterTable
ALTER TABLE "organizations" ADD COLUMN     "data_principal_count_estimate" INTEGER,
ADD COLUMN     "employee_count" INTEGER,
ADD COLUMN     "headquarters_city" TEXT,
ADD COLUMN     "website" TEXT;

-- CreateTable
CREATE TABLE "industries" (
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "overlay_pack_code" TEXT NOT NULL,

    CONSTRAINT "industries_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "departments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "systems" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "system_type" TEXT NOT NULL,
    "hosting_model" TEXT NOT NULL DEFAULT 'unknown',
    "data_location" TEXT NOT NULL DEFAULT 'unknown',
    "owner_department_id" UUID,
    "processes_children_data" TEXT NOT NULL DEFAULT 'unknown',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "systems_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendors" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "service" TEXT,
    "vendor_role" TEXT NOT NULL DEFAULT 'unknown',
    "contract_exists" TEXT NOT NULL DEFAULT 'unknown',
    "dpdp_clauses" TEXT NOT NULL DEFAULT 'unknown',
    "cross_border" TEXT NOT NULL DEFAULT 'unknown',
    "sub_processors_known" TEXT NOT NULL DEFAULT 'unknown',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vendors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendor_systems" (
    "organization_id" UUID NOT NULL,
    "vendor_id" UUID NOT NULL,
    "system_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vendor_systems_pkey" PRIMARY KEY ("vendor_id","system_id")
);

-- CreateTable
CREATE TABLE "data_principal_types" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "includes_children" TEXT NOT NULL DEFAULT 'unknown',
    "estimated_count" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "data_principal_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_scopes" (
    "organization_id" UUID NOT NULL,
    "children_data" TEXT NOT NULL DEFAULT 'unknown',
    "ai_usage_types" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "marketing_tracking" TEXT NOT NULL DEFAULT 'unknown',
    "cross_border" TEXT NOT NULL DEFAULT 'unknown',
    "multi_location" BOOLEAN NOT NULL DEFAULT false,
    "public_facing_portal" TEXT NOT NULL DEFAULT 'unknown',
    "sensitive_documents" TEXT NOT NULL DEFAULT 'unknown',
    "risk_tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "derived_at" TIMESTAMPTZ(6),
    "updated_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organization_scopes_pkey" PRIMARY KEY ("organization_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "departments_organization_id_id_key" ON "departments"("organization_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "systems_organization_id_id_key" ON "systems"("organization_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "vendors_organization_id_id_key" ON "vendors"("organization_id", "id");

-- CreateIndex
CREATE INDEX "vendor_systems_organization_id_idx" ON "vendor_systems"("organization_id");

-- CreateIndex
CREATE INDEX "vendor_systems_system_id_idx" ON "vendor_systems"("system_id");

-- CreateIndex
CREATE UNIQUE INDEX "data_principal_types_organization_id_id_key" ON "data_principal_types"("organization_id", "id");


-- AddForeignKey
ALTER TABLE "organization_users" ADD CONSTRAINT "organization_users_organization_id_department_id_fkey" FOREIGN KEY ("organization_id", "department_id") REFERENCES "departments"("organization_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "systems" ADD CONSTRAINT "systems_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "systems" ADD CONSTRAINT "systems_organization_id_owner_department_id_fkey" FOREIGN KEY ("organization_id", "owner_department_id") REFERENCES "departments"("organization_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendors" ADD CONSTRAINT "vendors_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_systems" ADD CONSTRAINT "vendor_systems_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_systems" ADD CONSTRAINT "vendor_systems_organization_id_vendor_id_fkey" FOREIGN KEY ("organization_id", "vendor_id") REFERENCES "vendors"("organization_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_systems" ADD CONSTRAINT "vendor_systems_organization_id_system_id_fkey" FOREIGN KEY ("organization_id", "system_id") REFERENCES "systems"("organization_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "data_principal_types" ADD CONSTRAINT "data_principal_types_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_scopes" ADD CONSTRAINT "organization_scopes_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_scopes" ADD CONSTRAINT "organization_scopes_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- ===========================================================================
-- (2) Reference data — industries, generated from packages/core INDUSTRIES
-- ===========================================================================

INSERT INTO public.industries (code, name, overlay_pack_code) VALUES
  ('university', 'University / Higher Education', 'UNIVERSITY_HIGHER_ED_V1'),
  ('edtech', 'EdTech / Online Learning', 'EDTECH_OVERLAY_V1'),
  ('bfsi', 'Banking, Financial Services and Insurance', 'BFSI_OVERLAY_V1'),
  ('healthcare', 'Healthcare / Hospital / Clinic / Diagnostics', 'HEALTHCARE_OVERLAY_V1'),
  ('saas', 'SaaS / Technology Platform', 'SAAS_TECH_OVERLAY_V1'),
  ('manufacturing', 'Manufacturing / Industrial', 'MANUFACTURING_OVERLAY_V1'),
  ('retail_ecommerce', 'Retail / E-commerce', 'RETAIL_ECOMMERCE_OVERLAY_V1'),
  ('professional_services', 'Consulting / Legal / Accounting / Advisory', 'PROFESSIONAL_SERVICES_OVERLAY_V1'),
  ('public_sector', 'Public Sector / Government-linked Institution', 'PUBLIC_SECTOR_OVERLAY_V1'),
  ('general', 'General Organisation', 'GENERAL_ORGANISATION_V1');

-- 0B seeded `education.higher`; the packs and core say `university`. Anything
-- else that is not a known industry becomes `general` (never "no overlay").
UPDATE public.organizations SET industry_code = 'university' WHERE industry_code = 'education.higher';
UPDATE public.organizations SET industry_code = 'general'
WHERE industry_code IS NOT NULL AND industry_code NOT IN (SELECT code FROM public.industries);

-- AddForeignKey
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_industry_code_fkey" FOREIGN KEY ("industry_code") REFERENCES "industries"("code") ON DELETE RESTRICT ON UPDATE CASCADE;


-- ===========================================================================
-- (3) Constraints Prisma cannot express
-- ===========================================================================

-- Tri-state is yes | no | unknown — never a nullable boolean (Slice 2 pitfall 2).
ALTER TABLE public.systems
  ADD CONSTRAINT systems_system_type_check CHECK (system_type IN ('erp','sis','lms','exam','hrms','payroll','crm','website','mobile_app','payment','email_sms','cctv','biometric','ai','other')),
  ADD CONSTRAINT systems_hosting_model_check CHECK (hosting_model IN ('on_premise','cloud','saas','unknown')),
  ADD CONSTRAINT systems_data_location_check CHECK (data_location IN ('india','outside_india','unknown')),
  ADD CONSTRAINT systems_processes_children_data_check CHECK (processes_children_data IN ('yes', 'no', 'unknown')),
  ADD CONSTRAINT systems_name_not_blank CHECK (btrim(name) <> '');

ALTER TABLE public.vendors
  ADD CONSTRAINT vendors_vendor_role_check CHECK (vendor_role IN ('data_processor','independent','unknown')),
  ADD CONSTRAINT vendors_contract_exists_check CHECK (contract_exists IN ('yes', 'no', 'unknown')),
  ADD CONSTRAINT vendors_dpdp_clauses_check CHECK (dpdp_clauses IN ('yes', 'no', 'unknown')),
  ADD CONSTRAINT vendors_cross_border_check CHECK (cross_border IN ('yes', 'no', 'unknown')),
  ADD CONSTRAINT vendors_sub_processors_known_check CHECK (sub_processors_known IN ('yes', 'no', 'unknown')),
  ADD CONSTRAINT vendors_name_not_blank CHECK (btrim(name) <> '');

ALTER TABLE public.data_principal_types
  ADD CONSTRAINT data_principal_types_code_check CHECK (code IN ('applicant','student','parent_guardian','faculty','employee','alumni','customer','patient','visitor','contractor','research_participant','other')),
  ADD CONSTRAINT data_principal_types_includes_children_check CHECK (includes_children IN ('yes', 'no', 'unknown')),
  ADD CONSTRAINT data_principal_types_estimated_count_check CHECK (estimated_count IS NULL OR estimated_count >= 0),
  ADD CONSTRAINT data_principal_types_label_not_blank CHECK (btrim(label) <> '');

ALTER TABLE public.departments
  ADD CONSTRAINT departments_name_not_blank CHECK (btrim(name) <> '');

ALTER TABLE public.organization_scopes
  ADD CONSTRAINT organization_scopes_children_data_check CHECK (children_data IN ('yes', 'no', 'unknown')),
  ADD CONSTRAINT organization_scopes_marketing_tracking_check CHECK (marketing_tracking IN ('yes', 'no', 'unknown')),
  ADD CONSTRAINT organization_scopes_cross_border_check CHECK (cross_border IN ('yes', 'no', 'unknown')),
  ADD CONSTRAINT organization_scopes_public_facing_portal_check CHECK (public_facing_portal IN ('yes', 'no', 'unknown')),
  ADD CONSTRAINT organization_scopes_sensitive_documents_check CHECK (sensitive_documents IN ('yes', 'no', 'unknown')),
  ADD CONSTRAINT organization_scopes_ai_usage_types_check
    CHECK (ai_usage_types <@ ARRAY['proctoring','chatbot','analytics','scoring','recommendation','none']::text[]),
  ADD CONSTRAINT organization_scopes_risk_tags_check
    CHECK (risk_tags <@ ARRAY['ai_processing','children_data','cloud_saas_processing','cross_border_unknown','high_vendor_dependency','large_scale_processing','marketing_tracking','multi_location','public_facing_portal','sensitive_documents']::text[]);

ALTER TABLE public.organizations
  ADD CONSTRAINT organizations_employee_count_check CHECK (employee_count IS NULL OR employee_count >= 0),
  ADD CONSTRAINT organizations_dp_count_check CHECK (data_principal_count_estimate IS NULL OR data_principal_count_estimate >= 0);

-- Per-organisation, case-insensitive names. Never global (Slice 1 pitfall 4).
CREATE UNIQUE INDEX departments_org_name_key ON public.departments (organization_id, lower(name));
CREATE UNIQUE INDEX systems_org_name_key ON public.systems (organization_id, lower(name));
CREATE UNIQUE INDEX vendors_org_name_key ON public.vendors (organization_id, lower(name));
CREATE UNIQUE INDEX data_principal_types_org_label_key ON public.data_principal_types (organization_id, lower(label));

CREATE TRIGGER departments_touch_updated_at BEFORE UPDATE ON public.departments FOR EACH ROW EXECUTE FUNCTION app.touch_updated_at();
CREATE TRIGGER systems_touch_updated_at BEFORE UPDATE ON public.systems FOR EACH ROW EXECUTE FUNCTION app.touch_updated_at();
CREATE TRIGGER vendors_touch_updated_at BEFORE UPDATE ON public.vendors FOR EACH ROW EXECUTE FUNCTION app.touch_updated_at();
CREATE TRIGGER data_principal_types_touch_updated_at BEFORE UPDATE ON public.data_principal_types FOR EACH ROW EXECUTE FUNCTION app.touch_updated_at();
CREATE TRIGGER organization_scopes_touch_updated_at BEFORE UPDATE ON public.organization_scopes FOR EACH ROW EXECUTE FUNCTION app.touch_updated_at();


-- ===========================================================================
-- (4) Permission scope.write (D-026) — must match packages/core ROLE_PERMISSIONS
-- ===========================================================================

INSERT INTO public.permissions (code, description) VALUES
  ('scope.write', 'Edit the scope wizard: industry, Data Principals, departments, systems, vendors and risk answers.');

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM (VALUES ('super_admin'), ('consultant'), ('organization_admin'), ('dpdp_owner')) AS g(role_code)
JOIN public.roles r ON r.code = g.role_code
JOIN public.permissions p ON p.code = 'scope.write';


-- ===========================================================================
-- (5) Audit by trigger (D-026)
-- ===========================================================================
-- Every user write to the profile, the registers and the scope answers is
-- audited in the SAME transaction as the write, so no route can forget it.
-- Writes with no JWT (seed, migrations, worker) are tooling, not user actions,
-- and are not audited here. Metadata lists the changed column names only.

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
    WHERE n.key NOT IN ('updated_at', 'derived_at') AND (v_old -> n.key) IS DISTINCT FROM n.value;
    IF v_changed = '[]'::jsonb THEN
      RETURN NULL; -- a no-op save is not an event
    END IF;
  END IF;

  INSERT INTO public.audit_logs (organization_id, user_id, event_type, entity_type, entity_id, description, metadata)
  VALUES (
    v_org, v_actor,
    'scope.' || TG_TABLE_NAME || '.' || lower(TG_OP),
    TG_TABLE_NAME, v_entity,
    initcap(lower(TG_OP)) || ' ' || replace(TG_TABLE_NAME, '_', ' '),
    jsonb_strip_nulls(jsonb_build_object(
      'name', COALESCE(v_row ->> 'name', v_row ->> 'label'),
      'changed', v_changed,
      'systemId', v_row ->> 'system_id'
    ))
  );
  RETURN NULL;
END;
$$;

REVOKE ALL ON FUNCTION app.audit_scope_change() FROM PUBLIC;

CREATE TRIGGER departments_audit AFTER INSERT OR UPDATE OR DELETE ON public.departments FOR EACH ROW EXECUTE FUNCTION app.audit_scope_change();
CREATE TRIGGER systems_audit AFTER INSERT OR UPDATE OR DELETE ON public.systems FOR EACH ROW EXECUTE FUNCTION app.audit_scope_change();
CREATE TRIGGER vendors_audit AFTER INSERT OR UPDATE OR DELETE ON public.vendors FOR EACH ROW EXECUTE FUNCTION app.audit_scope_change();
CREATE TRIGGER vendor_systems_audit AFTER INSERT OR DELETE ON public.vendor_systems FOR EACH ROW EXECUTE FUNCTION app.audit_scope_change();
CREATE TRIGGER data_principal_types_audit AFTER INSERT OR UPDATE OR DELETE ON public.data_principal_types FOR EACH ROW EXECUTE FUNCTION app.audit_scope_change();
CREATE TRIGGER organization_scopes_audit AFTER INSERT OR UPDATE ON public.organization_scopes FOR EACH ROW EXECUTE FUNCTION app.audit_scope_change();
CREATE TRIGGER organizations_audit AFTER UPDATE ON public.organizations FOR EACH ROW EXECUTE FUNCTION app.audit_scope_change();

-- Column-group guard on organizations: one RLS UPDATE policy admits holders of
-- organization.update OR scope.write, so this trigger decides WHICH columns
-- each may change. Profile = organization.update; industry and scale = scope.write.
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
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION app.guard_organization_update() FROM PUBLIC;
CREATE TRIGGER organizations_guard_update BEFORE UPDATE ON public.organizations FOR EACH ROW EXECUTE FUNCTION app.guard_organization_update();


-- ===========================================================================
-- (6) Grants + RLS (D-019, D-023: plain tenant CRUD uses RLS write policies)
-- ===========================================================================

REVOKE ALL ON public.industries, public.departments, public.systems, public.vendors,
  public.vendor_systems, public.data_principal_types, public.organization_scopes
  FROM anon, authenticated;

GRANT SELECT ON public.industries TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.departments, public.systems, public.vendors,
  public.data_principal_types TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.vendor_systems TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.organization_scopes TO authenticated;
-- organizations: only the editable columns, never id/type/parent/deleted_at.
GRANT UPDATE (name, legal_name, website, headquarters_city, employee_count, industry_code, data_principal_count_estimate)
  ON public.organizations TO authenticated;

ALTER TABLE public.industries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.systems ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_systems ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_principal_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_scopes ENABLE ROW LEVEL SECURITY;

CREATE POLICY industries_select_authenticated ON public.industries FOR SELECT TO authenticated USING (true);

CREATE POLICY organizations_update_editor
  ON public.organizations
  FOR UPDATE
  TO authenticated
  USING (
    deleted_at IS NULL
    AND (app.has_permission(id, 'organization.update') OR app.has_permission(id, 'scope.write'))
  )
  WITH CHECK (
    deleted_at IS NULL
    AND (app.has_permission(id, 'organization.update') OR app.has_permission(id, 'scope.write'))
  );

CREATE POLICY departments_select_member ON public.departments
  FOR SELECT TO authenticated
  USING (organization_id IN (SELECT app.current_user_organization_ids()));
CREATE POLICY departments_insert_scope_writer ON public.departments
  FOR INSERT TO authenticated
  WITH CHECK (app.has_permission(organization_id, 'scope.write'));
CREATE POLICY departments_update_scope_writer ON public.departments
  FOR UPDATE TO authenticated
  USING (app.has_permission(organization_id, 'scope.write'))
  WITH CHECK (app.has_permission(organization_id, 'scope.write'));
CREATE POLICY departments_delete_scope_writer ON public.departments
  FOR DELETE TO authenticated
  USING (app.has_permission(organization_id, 'scope.write'));

CREATE POLICY systems_select_member ON public.systems
  FOR SELECT TO authenticated
  USING (organization_id IN (SELECT app.current_user_organization_ids()));
CREATE POLICY systems_insert_scope_writer ON public.systems
  FOR INSERT TO authenticated
  WITH CHECK (app.has_permission(organization_id, 'scope.write'));
CREATE POLICY systems_update_scope_writer ON public.systems
  FOR UPDATE TO authenticated
  USING (app.has_permission(organization_id, 'scope.write'))
  WITH CHECK (app.has_permission(organization_id, 'scope.write'));
CREATE POLICY systems_delete_scope_writer ON public.systems
  FOR DELETE TO authenticated
  USING (app.has_permission(organization_id, 'scope.write'));

CREATE POLICY vendors_select_member ON public.vendors
  FOR SELECT TO authenticated
  USING (organization_id IN (SELECT app.current_user_organization_ids()));
CREATE POLICY vendors_insert_scope_writer ON public.vendors
  FOR INSERT TO authenticated
  WITH CHECK (app.has_permission(organization_id, 'scope.write'));
CREATE POLICY vendors_update_scope_writer ON public.vendors
  FOR UPDATE TO authenticated
  USING (app.has_permission(organization_id, 'scope.write'))
  WITH CHECK (app.has_permission(organization_id, 'scope.write'));
CREATE POLICY vendors_delete_scope_writer ON public.vendors
  FOR DELETE TO authenticated
  USING (app.has_permission(organization_id, 'scope.write'));

CREATE POLICY vendor_systems_select_member ON public.vendor_systems
  FOR SELECT TO authenticated
  USING (organization_id IN (SELECT app.current_user_organization_ids()));
CREATE POLICY vendor_systems_insert_scope_writer ON public.vendor_systems
  FOR INSERT TO authenticated
  WITH CHECK (app.has_permission(organization_id, 'scope.write'));
CREATE POLICY vendor_systems_delete_scope_writer ON public.vendor_systems
  FOR DELETE TO authenticated
  USING (app.has_permission(organization_id, 'scope.write'));

CREATE POLICY data_principal_types_select_member ON public.data_principal_types
  FOR SELECT TO authenticated
  USING (organization_id IN (SELECT app.current_user_organization_ids()));
CREATE POLICY data_principal_types_insert_scope_writer ON public.data_principal_types
  FOR INSERT TO authenticated
  WITH CHECK (app.has_permission(organization_id, 'scope.write'));
CREATE POLICY data_principal_types_update_scope_writer ON public.data_principal_types
  FOR UPDATE TO authenticated
  USING (app.has_permission(organization_id, 'scope.write'))
  WITH CHECK (app.has_permission(organization_id, 'scope.write'));
CREATE POLICY data_principal_types_delete_scope_writer ON public.data_principal_types
  FOR DELETE TO authenticated
  USING (app.has_permission(organization_id, 'scope.write'));

CREATE POLICY organization_scopes_select_member ON public.organization_scopes
  FOR SELECT TO authenticated
  USING (organization_id IN (SELECT app.current_user_organization_ids()));
CREATE POLICY organization_scopes_insert_scope_writer ON public.organization_scopes
  FOR INSERT TO authenticated
  WITH CHECK (app.has_permission(organization_id, 'scope.write'));
CREATE POLICY organization_scopes_update_scope_writer ON public.organization_scopes
  FOR UPDATE TO authenticated
  USING (app.has_permission(organization_id, 'scope.write'))
  WITH CHECK (app.has_permission(organization_id, 'scope.write'));
