-- Slice 3 — question bank and dynamic assessment generation.
--
-- DPDP anchoring: the 16-domain model IS the product. Every question maps to
-- one primary scoring domain and the active domain weights total exactly 100
-- (workbook `Config`, D-006) — an invariant this migration asserts and a
-- constraint trigger keeps. Snapshot immutability is what makes a finalised
-- assessment evidence of what was assessed, and when.
--
-- Layout: (1) Prisma-generated DDL; (2) reference data — 16 domains and 20
-- packs, mirroring packages/core; (3) the weights-total-100 invariant;
-- (4) CHECK vocabularies and triggers; (5) the snapshot RPC; (6) audit;
-- (7) grants + RLS.
--
-- Two tables are reference data with no user write path at all
-- (`questions`, `question_versions`): a published question code is forever and
-- a version is immutable, so a meaning change is a new row, never an UPDATE
-- (docs/QUESTION_FORMAT.md §Adding or changing).

-- ===========================================================================
-- (1) DDL
-- ===========================================================================

-- CreateTable
CREATE TABLE "dpdp_domains" (
    "code" TEXT NOT NULL,
    "domain_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "weight" DECIMAL(5,2) NOT NULL,
    "default_applicability" TEXT NOT NULL,
    "default_owner" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL,

    CONSTRAINT "dpdp_domains_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "question_packs" (
    "code" TEXT NOT NULL,
    "tier" TEXT NOT NULL,
    "industry_code" TEXT,
    "name" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "source_file" TEXT,

    CONSTRAINT "question_packs_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "questions" (
    "code" TEXT NOT NULL,
    "pack_code" TEXT NOT NULL,
    "source_tag" TEXT NOT NULL,
    "current_version" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "questions_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "question_versions" (
    "question_code" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "question_text" TEXT NOT NULL,
    "domain_code" TEXT NOT NULL,
    "secondary_domain_codes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "applicability" TEXT NOT NULL,
    "type_text" TEXT,
    "trigger_text" TEXT,
    "trigger_condition" JSONB,
    "risk_tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "evidence_guidance" TEXT,
    "risk_if_weak" TEXT,
    "suggested_owner" TEXT,
    "priority" TEXT,
    "criticality" TEXT,
    "legal_control_basis" TEXT,
    "recommended_fix" TEXT,
    "truststack_module" TEXT,
    "na_rule" TEXT NOT NULL,
    "source_ref" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "question_versions_pkey" PRIMARY KEY ("question_code","version")
);

-- CreateTable
CREATE TABLE "assessments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "assessment_type" TEXT NOT NULL DEFAULT 'baseline',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "industry_code" TEXT,
    "risk_tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "pack_codes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "scope_derived_at" TIMESTAMPTZ(6),
    "generated_at" TIMESTAMPTZ(6),
    "created_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessment_questions" (
    "organization_id" UUID NOT NULL,
    "assessment_id" UUID NOT NULL,
    "question_code" TEXT NOT NULL,
    "question_version" TEXT NOT NULL,
    "question_text" TEXT NOT NULL,
    "domain_code" TEXT NOT NULL,
    "domain_weight" DECIMAL(5,2) NOT NULL,
    "applicability" TEXT NOT NULL,
    "priority" TEXT,
    "evidence_guidance" TEXT,
    "suggested_owner" TEXT,
    "pack_code" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL,
    "included_reason" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assessment_questions_pkey" PRIMARY KEY ("assessment_id","question_code")
);

-- CreateIndex
CREATE UNIQUE INDEX "dpdp_domains_domain_id_key" ON "dpdp_domains"("domain_id");

-- CreateIndex
CREATE INDEX "questions_pack_code_idx" ON "questions"("pack_code");

-- CreateIndex
CREATE INDEX "question_versions_domain_code_idx" ON "question_versions"("domain_code");

-- CreateIndex
CREATE INDEX "assessments_organization_id_idx" ON "assessments"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "assessments_organization_id_id_key" ON "assessments"("organization_id", "id");

-- CreateIndex
CREATE INDEX "assessment_questions_organization_id_idx" ON "assessment_questions"("organization_id");

-- CreateIndex
CREATE INDEX "assessment_questions_assessment_id_sort_order_idx" ON "assessment_questions"("assessment_id", "sort_order");

-- AddForeignKey
ALTER TABLE "question_packs" ADD CONSTRAINT "question_packs_industry_code_fkey" FOREIGN KEY ("industry_code") REFERENCES "industries"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_pack_code_fkey" FOREIGN KEY ("pack_code") REFERENCES "question_packs"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_versions" ADD CONSTRAINT "question_versions_question_code_fkey" FOREIGN KEY ("question_code") REFERENCES "questions"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_versions" ADD CONSTRAINT "question_versions_domain_code_fkey" FOREIGN KEY ("domain_code") REFERENCES "dpdp_domains"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_questions" ADD CONSTRAINT "assessment_questions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_questions" ADD CONSTRAINT "assessment_questions_organization_id_assessment_id_fkey" FOREIGN KEY ("organization_id", "assessment_id") REFERENCES "assessments"("organization_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;



-- ===========================================================================
-- (2) Reference data — generated from packages/core DPDP_DOMAINS and
--     QUESTION_PACKS. A unit test fails if this SQL and that code differ (D-020).
-- ===========================================================================
-- Weights are the workbook's `Config` values. The `Question_Bank` sheet also
-- has a weight column: it is STALE (totals 104) and is never read (D-006).

INSERT INTO public.dpdp_domains (code, domain_id, name, weight, default_applicability, default_owner, sort_order) VALUES
  ('GOV', 'D01', 'Governance, accountability and DPDP ownership', 7, 'mandatory', 'Executive Sponsor / DPDP Owner', 1),
  ('INV', 'D02', 'Personal data discovery and inventory', 8, 'mandatory', 'IT + Process Owners', 2),
  ('ROPA', 'D03', 'ROPA / Records of Processing Activities', 6, 'mandatory', 'DPDP Owner + Process Owners', 3),
  ('PURPOSE', 'D04', 'Purpose, lawful basis and data minimisation', 7, 'mandatory', 'Legal + Process Owners', 4),
  ('NOTICE', 'D05', 'Notice management', 7, 'mandatory', 'Legal + IT', 5),
  ('CONSENT', 'D06', 'Consent and consent withdrawal', 7, 'conditional', 'Legal + IT + Process Owners', 6),
  ('RIGHTS', 'D07', 'Data Principal rights', 7, 'mandatory', 'Legal + Registrar / Customer Ops', 7),
  ('GRIEVANCE', 'D08', 'Grievance redressal and contact publication', 5, 'mandatory', 'Legal + DPDP Owner', 8),
  ('RETENTION', 'D09', 'Retention, erasure and archival', 6, 'mandatory', 'Legal + Records Owners + IT', 9),
  ('ACCURACY', 'D10', 'Data accuracy and quality', 4, 'mandatory', 'Data Owners + IT', 10),
  ('SECURITY', 'D11', 'Security safeguards', 10, 'mandatory', 'IT / CISO / Security', 11),
  ('BREACH', 'D12', 'Personal data breach readiness', 8, 'mandatory', 'IT/Security + Legal', 12),
  ('VENDOR', 'D13', 'Vendor / Data Processor governance', 7, 'mandatory_where_vendors_exist', 'Procurement + Legal + IT', 13),
  ('CHILD', 'D14', 'Children''s data and guardian consent', 4, 'conditional', 'Admissions + Legal + IT', 14),
  ('CROSSBORDER', 'D15', 'Cross-border transfer and cloud/SaaS risk', 3, 'conditional', 'IT + Procurement + Legal', 15),
  ('SDF_AI', 'D16', 'SDF, DPIA, audit and AI/algorithmic risk readiness', 4, 'conditional', 'Legal + AI Governance + IT', 16);

INSERT INTO public.question_packs (code, tier, industry_code, name, version, status, source_file) VALUES
  ('CORE_DPDP_V1', 'core', NULL, 'DPDP Compass core assessment', '1.0', 'approved', 'docs/source/TrustStack_DPDP_Compass_Excel_MVP_Validated_Step12.xlsx#Question_Bank'),
  ('UNIVERSITY_HIGHER_ED_V1', 'overlay', 'university', 'University / Higher Education overlay', '1.0', 'approved', 'docs/question_packs/industry/01_University_Higher_Education_DPDP_Questions.md'),
  ('UNIVERSITY_AI_PROCTORING_V1', 'conditional', 'university', 'University AI proctoring pack', '1.0', 'approved', 'docs/question_packs/industry/01_University_Higher_Education_DPDP_Questions.md'),
  ('UNIVERSITY_CONDITIONAL_V1', 'conditional', 'university', 'University conditional pool', '1.0', 'approved', 'docs/question_packs/industry/01_University_Higher_Education_DPDP_Questions.md'),
  ('UNIVERSITY_REFERENCE_V1', 'reference', 'university', 'University reference pool', '1.0', 'approved', 'docs/question_packs/industry/01_University_Higher_Education_DPDP_Questions.md'),
  ('EDTECH_OVERLAY_V1', 'overlay', 'edtech', 'EdTech / Online Learning overlay', '1.0', 'draft', 'docs/question_packs/industry/02_EdTech_Online_Learning_DPDP_Questions.md'),
  ('BFSI_OVERLAY_V1', 'overlay', 'bfsi', 'BFSI overlay', '1.0', 'draft', 'docs/question_packs/industry/03_BFSI_DPDP_Questions.md'),
  ('HEALTHCARE_OVERLAY_V1', 'overlay', 'healthcare', 'Healthcare overlay', '1.0', 'draft', 'docs/question_packs/industry/04_Healthcare_DPDP_Questions.md'),
  ('SAAS_TECH_OVERLAY_V1', 'overlay', 'saas', 'SaaS / Technology overlay', '1.0', 'draft', 'docs/question_packs/industry/05_SaaS_Technology_DPDP_Questions.md'),
  ('MANUFACTURING_OVERLAY_V1', 'overlay', 'manufacturing', 'Manufacturing overlay', '1.0', 'draft', 'docs/question_packs/industry/06_Manufacturing_DPDP_Questions.md'),
  ('RETAIL_ECOMMERCE_OVERLAY_V1', 'overlay', 'retail_ecommerce', 'Retail / E-commerce overlay', '1.0', 'draft', 'docs/question_packs/industry/07_Retail_Ecommerce_DPDP_Questions.md'),
  ('PROFESSIONAL_SERVICES_OVERLAY_V1', 'overlay', 'professional_services', 'Professional Services overlay', '1.0', 'draft', 'docs/question_packs/industry/08_Professional_Services_DPDP_Questions.md'),
  ('PUBLIC_SECTOR_OVERLAY_V1', 'overlay', 'public_sector', 'Public Sector overlay', '1.0', 'draft', 'docs/question_packs/industry/09_Public_Sector_DPDP_Questions.md'),
  ('GENERAL_ORGANISATION_V1', 'overlay', 'general', 'General Organisation overlay', '1.0', 'draft', 'docs/question_packs/industry/10_General_Organisation_DPDP_Questions.md'),
  ('CHILDREN_DATA_V1', 'conditional', NULL, 'Children''s data pack', '1.0', 'draft', NULL),
  ('VENDOR_PROCESSOR_V1', 'conditional', NULL, 'Vendor / Data Processor pack', '1.0', 'draft', NULL),
  ('CLOUD_CROSSBORDER_V1', 'conditional', NULL, 'Cloud and cross-border pack', '1.0', 'draft', NULL),
  ('AI_RISK_V1', 'conditional', NULL, 'AI risk pack', '1.0', 'draft', NULL),
  ('MARKETING_TRACKING_V1', 'conditional', NULL, 'Marketing and tracking pack', '1.0', 'draft', NULL),
  ('SDF_READINESS_V1', 'conditional', NULL, 'SDF readiness pack (internal trigger, not a classification)', '1.0', 'draft', NULL);

-- Only CORE_DPDP_V1 and the four University packs are `approved`, because only
-- they have been through the overlap exercise D-029.1 required. The generator
-- refuses a pack that is not approved, so no client is handed a 260-question
-- assessment before its own overlap map exists
-- (docs/question_packs/OVERLAP_UNIVERSITY_CORE.md).


-- ===========================================================================
-- (3) The 100-point invariant
-- ===========================================================================
-- A CHECK cannot span rows, so this is asserted once here and then kept by a
-- deferred constraint trigger. Users hold no write grant on dpdp_domains;
-- this guards tooling and future migrations.

DO $$
DECLARE v_total numeric;
BEGIN
  SELECT COALESCE(sum(weight), 0) INTO v_total FROM public.dpdp_domains;
  IF round(v_total, 2) <> 100 THEN
    RAISE EXCEPTION 'DOMAIN_WEIGHT_TOTAL_INVALID: active domain weights total %, expected 100', v_total;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION app.assert_domain_weight_total()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE v_total numeric;
BEGIN
  SELECT COALESCE(sum(weight), 0) INTO v_total FROM public.dpdp_domains;
  IF round(v_total, 2) <> 100 THEN
    RAISE EXCEPTION 'DOMAIN_WEIGHT_TOTAL_INVALID: active domain weights total %, expected 100', v_total
      USING ERRCODE = 'TS100';
  END IF;
  RETURN NULL;
END;
$$;

REVOKE ALL ON FUNCTION app.assert_domain_weight_total() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER dpdp_domains_weight_total
  AFTER INSERT OR UPDATE OR DELETE ON public.dpdp_domains
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION app.assert_domain_weight_total();


-- ===========================================================================
-- (4) Constraints Prisma cannot express
-- ===========================================================================

ALTER TABLE public.dpdp_domains
  ADD CONSTRAINT dpdp_domains_weight_positive CHECK (weight > 0),
  ADD CONSTRAINT dpdp_domains_domain_id_format CHECK (domain_id ~ '^D[0-9]{2}$'),
  ADD CONSTRAINT dpdp_domains_default_applicability_check
    CHECK (default_applicability IN ('mandatory', 'conditional', 'mandatory_where_vendors_exist'));

ALTER TABLE public.question_packs
  ADD CONSTRAINT question_packs_tier_check CHECK (tier IN ('core', 'overlay', 'conditional', 'reference')),
  ADD CONSTRAINT question_packs_status_check CHECK (status IN ('draft', 'approved', 'retired')),
  ADD CONSTRAINT question_packs_name_not_blank CHECK (btrim(name) <> '');

ALTER TABLE public.questions
  ADD CONSTRAINT questions_source_tag_check CHECK (source_tag IN (
    'core', 'university', 'edtech', 'bfsi', 'healthcare', 'saas',
    'manufacturing', 'retail_ecommerce', 'professional_services', 'public_sector', 'general')),
  ADD CONSTRAINT questions_code_not_blank CHECK (btrim(code) <> '');

ALTER TABLE public.question_versions
  ADD CONSTRAINT question_versions_applicability_check
    CHECK (applicability IN ('mandatory', 'conditional', 'potentially_applicable')),
  -- Null priority is CORRECT for the 234 questions whose file has no Priority
  -- column; it is never invented (§13.2).
  ADD CONSTRAINT question_versions_priority_check CHECK (priority IS NULL OR priority IN ('P0','P1','P2','P3')),
  ADD CONSTRAINT question_versions_criticality_check
    CHECK (criticality IS NULL OR criticality IN ('Critical','High','Medium','Low')),
  ADD CONSTRAINT question_versions_status_check CHECK (status IN ('draft', 'approved', 'retired')),
  ADD CONSTRAINT question_versions_text_not_blank CHECK (btrim(question_text) <> ''),
  ADD CONSTRAINT question_versions_secondary_domains_are_domains
    CHECK (secondary_domain_codes <@ ARRAY['GOV','INV','ROPA','PURPOSE','NOTICE','CONSENT','RIGHTS','GRIEVANCE','RETENTION','ACCURACY','SECURITY','BREACH','VENDOR','CHILD','CROSSBORDER','SDF_AI']::text[]),
  -- A secondary domain is a cross-reference tag, never the primary (D-029.2).
  ADD CONSTRAINT question_versions_primary_not_secondary
    CHECK (NOT (domain_code = ANY (secondary_domain_codes))),
  ADD CONSTRAINT question_versions_risk_tags_check
    CHECK (risk_tags <@ ARRAY['advanced','ai_linked','children_linked','evidence_heavy','high_risk','marketing_linked','payment_linked','reassessment_trigger','vendor_linked']::text[]),
  -- Applicability in the BANK is already resolved. `conditional` means the
  -- condition is both authored and machine-evaluable; a condition we cannot
  -- evaluate is stored as `potentially_applicable` and carries no expression,
  -- so it is shown to the assessor rather than silently dropped (D-029.3).
  ADD CONSTRAINT question_versions_conditional_is_evaluable
    CHECK (applicability <> 'conditional' OR (trigger_text IS NOT NULL AND trigger_condition IS NOT NULL)),
  ADD CONSTRAINT question_versions_unevaluable_has_no_expression
    CHECK (applicability <> 'potentially_applicable' OR trigger_condition IS NULL);

ALTER TABLE public.assessments
  ADD CONSTRAINT assessments_type_check CHECK (assessment_type IN ('baseline', 'reassessment')),
  ADD CONSTRAINT assessments_status_check CHECK (status IN ('draft', 'in_progress', 'submitted', 'finalised')),
  ADD CONSTRAINT assessments_name_not_blank CHECK (btrim(name) <> ''),
  ADD CONSTRAINT assessments_risk_tags_check
    CHECK (risk_tags <@ ARRAY['ai_processing','children_data','cloud_saas_processing','cross_border_unknown','high_vendor_dependency','large_scale_processing','marketing_tracking','multi_location','public_facing_portal','sensitive_documents']::text[]);

ALTER TABLE public.assessment_questions
  ADD CONSTRAINT assessment_questions_applicability_check
    CHECK (applicability IN ('mandatory', 'conditional', 'potentially_applicable')),
  ADD CONSTRAINT assessment_questions_priority_check CHECK (priority IS NULL OR priority IN ('P0','P1','P2','P3')),
  ADD CONSTRAINT assessment_questions_weight_positive CHECK (domain_weight > 0),
  ADD CONSTRAINT assessment_questions_sort_order_positive CHECK (sort_order > 0),
  ADD CONSTRAINT assessment_questions_included_reason_check
    CHECK (included_reason IN ('core', 'overlay', 'potentially_applicable') OR included_reason LIKE 'trigger:%');

-- Per-organisation, case-insensitive assessment names (Slice 1 pitfall 4).
CREATE UNIQUE INDEX assessments_org_name_key ON public.assessments (organization_id, lower(name));

CREATE TRIGGER assessments_touch_updated_at BEFORE UPDATE ON public.assessments
  FOR EACH ROW EXECUTE FUNCTION app.touch_updated_at();


-- ===========================================================================
-- (5) The snapshot RPC (D-023)
-- ===========================================================================
-- `assessment_questions` is append-only: users hold no UPDATE or DELETE grant,
-- and no INSERT grant either. The only way rows arrive is this function, which
-- refuses unless the caller holds assessment.write on the owning organisation
-- AND the assessment is still a draft. Once an assessment moves past draft its
-- question set is frozen — nothing in the application can rewrite history.
--
-- The rows come from packages/core generateAssessmentQuestions(); this
-- function is the gate, not the generator.

-- In `public`, not `app`: PostgREST exposes only `public`, and this one IS
-- meant to be called by the application (the Slice 1 RPCs do the same).
CREATE OR REPLACE FUNCTION public.set_assessment_questions(
  p_organization_id uuid,
  p_assessment_id uuid,
  p_rows jsonb
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_actor uuid := app.current_user_id();
  v_status text;
  v_count integer;
BEGIN
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'Sign in to continue.' USING ERRCODE = 'TS401';
  END IF;
  IF NOT app.has_permission(p_organization_id, 'assessment.write') THEN
    RAISE EXCEPTION 'You do not have permission to generate assessment questions.' USING ERRCODE = 'TS403';
  END IF;

  SELECT status INTO v_status
  FROM public.assessments
  WHERE id = p_assessment_id AND organization_id = p_organization_id;

  IF v_status IS NULL THEN
    RAISE EXCEPTION 'Assessment not found.' USING ERRCODE = 'TS404';
  END IF;
  IF v_status <> 'draft' THEN
    RAISE EXCEPTION 'Only a draft assessment can be regenerated (this one is %).', v_status
      USING ERRCODE = 'TS409';
  END IF;

  DELETE FROM public.assessment_questions
  WHERE assessment_id = p_assessment_id AND organization_id = p_organization_id;

  INSERT INTO public.assessment_questions (
    organization_id, assessment_id, question_code, question_version, question_text,
    domain_code, domain_weight, applicability, priority, evidence_guidance,
    suggested_owner, pack_code, sort_order, included_reason
  )
  SELECT
    p_organization_id, p_assessment_id, r.question_code, r.question_version, r.question_text,
    r.domain_code, r.domain_weight, r.applicability, r.priority, r.evidence_guidance,
    r.suggested_owner, r.pack_code, r.sort_order, r.included_reason
  FROM jsonb_to_recordset(p_rows) AS r(
    question_code text, question_version text, question_text text, domain_code text,
    domain_weight numeric, applicability text, priority text, evidence_guidance text,
    suggested_owner text, pack_code text, sort_order integer, included_reason text
  );

  SELECT count(*) INTO v_count
  FROM public.assessment_questions
  WHERE assessment_id = p_assessment_id AND organization_id = p_organization_id;

  UPDATE public.assessments SET generated_at = now() WHERE id = p_assessment_id;

  -- One audit row for the generation, not one per question: 124 rows of
  -- "question added" would bury the event that matters.
  INSERT INTO public.audit_logs (organization_id, user_id, event_type, entity_type, entity_id, description, metadata)
  VALUES (
    p_organization_id, v_actor, 'assessment.questions.generated', 'assessments', p_assessment_id,
    'Generated the assessment question set',
    jsonb_build_object('questionCount', v_count)
  );

  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.set_assessment_questions(uuid, uuid, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_assessment_questions(uuid, uuid, jsonb) TO authenticated;


-- ===========================================================================
-- (6) Audit (D-027)
-- ===========================================================================
-- The Slice 2 audit trigger gains an optional event-type prefix so the new
-- tenant tables reuse it instead of copying it. Existing triggers pass no
-- argument and keep emitting `scope.<table>.<op>` exactly as before.

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
    WHERE n.key NOT IN ('updated_at', 'derived_at', 'generated_at') AND (v_old -> n.key) IS DISTINCT FROM n.value;
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
      'name', COALESCE(v_row ->> 'name', v_row ->> 'label'),
      'changed', v_changed,
      'systemId', v_row ->> 'system_id'
    ))
  );
  RETURN NULL;
END;
$$;

CREATE TRIGGER assessments_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.assessments
  FOR EACH ROW EXECUTE FUNCTION app.audit_scope_change('assessment');


-- ===========================================================================
-- (7) Grants + RLS (D-019)
-- ===========================================================================

REVOKE ALL ON public.dpdp_domains, public.question_packs, public.questions,
  public.question_versions, public.assessments, public.assessment_questions
  FROM anon, authenticated;

-- The bank is reference data: readable by every member, writable by nobody.
-- Admin question editing (admin.question.update, super_admin only) is a later
-- slice and will need its own grants and an immutability rule for versions.
GRANT SELECT ON public.dpdp_domains, public.question_packs, public.questions,
  public.question_versions TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.assessments TO authenticated;
-- SELECT only: the snapshot is append-only and arrives through the RPC above.
GRANT SELECT ON public.assessment_questions TO authenticated;

ALTER TABLE public.dpdp_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY dpdp_domains_select_authenticated ON public.dpdp_domains
  FOR SELECT TO authenticated USING (true);
CREATE POLICY question_packs_select_authenticated ON public.question_packs
  FOR SELECT TO authenticated USING (true);
CREATE POLICY questions_select_authenticated ON public.questions
  FOR SELECT TO authenticated USING (true);
CREATE POLICY question_versions_select_authenticated ON public.question_versions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY assessments_select_member ON public.assessments
  FOR SELECT TO authenticated
  USING (
    organization_id IN (SELECT app.current_user_organization_ids())
    AND app.has_permission(organization_id, 'assessment.read')
  );
CREATE POLICY assessments_insert_writer ON public.assessments
  FOR INSERT TO authenticated
  WITH CHECK (app.has_permission(organization_id, 'assessment.write'));
CREATE POLICY assessments_update_writer ON public.assessments
  FOR UPDATE TO authenticated
  USING (app.has_permission(organization_id, 'assessment.write'))
  WITH CHECK (app.has_permission(organization_id, 'assessment.write'));
-- A finalised assessment is immutable evidence; only a draft may be deleted.
CREATE POLICY assessments_delete_draft ON public.assessments
  FOR DELETE TO authenticated
  USING (app.has_permission(organization_id, 'assessment.write') AND status = 'draft');

CREATE POLICY assessment_questions_select_member ON public.assessment_questions
  FOR SELECT TO authenticated
  USING (
    organization_id IN (SELECT app.current_user_organization_ids())
    AND app.has_permission(organization_id, 'assessment.read')
  );
