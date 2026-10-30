-- Slice 8, second migration — the black box, enforced by the DATABASE (D-070, D-071).
--
-- The Supabase URL and anon key ship in the browser by design, so a signed-in
-- user can call PostgREST directly with their own JWT. Until now that let any
-- client read the WHOLE question bank (all 20 packs, the drafts, the trigger
-- rules) and the provenance of its own snapshot (which pack, which trigger),
-- whatever our API chose to show. No tenant's data crossed to another — the
-- bank is reference content — but "a black box to the client" (D-040) was a
-- promise kept only by the API. From here it is kept by the database:
--
--   1. The bank (`question_packs`, `questions`, `question_versions`) is
--      readable only by someone holding `question.read_bank` (D-068) in an
--      active membership. `dpdp_domains` stays readable: clients see weights.
--   2. Generation still works for every role that may generate: it reads the
--      bank through ONE SECURITY DEFINER function that checks
--      `assessment.write` in that organisation and returns only APPROVED,
--      generatable packs — never a draft or the reference pool, whatever pack
--      codes the caller names.
--   3. Provenance — `assessment_questions.pack_code` / `.included_reason`,
--      `assessments.pack_codes`, `industries.overlay_pack_code` — is withdrawn
--      from `authenticated` by COLUMN privilege. Anix staff read it through a
--      SECURITY DEFINER function that checks `question.read_bank` in that
--      organisation.
--
-- Writes are untouched: the snapshot is still written only by
-- `set_assessment_questions` (SECURITY DEFINER), and the assessment's
-- `pack_codes` still by the writer's UPDATE (column UPDATE is unchanged).

-- ---------------------------------------------------------------------------
-- (1) Who may read the whole bank
-- ---------------------------------------------------------------------------

-- True when the caller holds this permission in ANY active membership. Only
-- for reference data that belongs to no tenant; tenant rows keep
-- `app.has_permission(organization_id, …)`.
CREATE OR REPLACE FUNCTION app.current_user_has_permission_anywhere(p_permission_code text)
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
      AND ou.status = 'active'
      AND p.code = p_permission_code
  );
$$;

REVOKE ALL ON FUNCTION app.current_user_has_permission_anywhere(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app.current_user_has_permission_anywhere(text) TO authenticated;

DROP POLICY question_packs_select_authenticated ON public.question_packs;
DROP POLICY questions_select_authenticated ON public.questions;
DROP POLICY question_versions_select_authenticated ON public.question_versions;

CREATE POLICY question_packs_select_bank ON public.question_packs
  FOR SELECT TO authenticated USING (app.current_user_has_permission_anywhere('question.read_bank'));
CREATE POLICY questions_select_bank ON public.questions
  FOR SELECT TO authenticated USING (app.current_user_has_permission_anywhere('question.read_bank'));
CREATE POLICY question_versions_select_bank ON public.question_versions
  FOR SELECT TO authenticated USING (app.current_user_has_permission_anywhere('question.read_bank'));

-- ---------------------------------------------------------------------------
-- (2) Generation reads the bank through one door
-- ---------------------------------------------------------------------------

-- The packs the caller named, and the CURRENT version of every question in
-- those of them that are approved and generatable. One jsonb value, not a set:
-- PostgREST caps a set at 1,000 rows, and a silently truncated bank would be a
-- silently incomplete assessment.
CREATE OR REPLACE FUNCTION public.bank_for_generation(p_organization_id uuid, p_pack_codes text[])
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF app.current_user_id() IS NULL THEN
    RAISE EXCEPTION 'Sign in to continue.' USING ERRCODE = 'TS401';
  END IF;
  IF NOT app.has_permission(p_organization_id, 'assessment.write') THEN
    RAISE EXCEPTION 'You do not have permission to generate assessment questions.' USING ERRCODE = 'TS403';
  END IF;

  RETURN jsonb_build_object(
    'packs', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'code', p.code, 'tier', p.tier, 'industry_code', p.industry_code, 'name', p.name,
        'version', p.version, 'status', p.status, 'source_file', p.source_file
      ) ORDER BY p.code)
      FROM public.question_packs p
      WHERE p.code = ANY (p_pack_codes)
    ), '[]'::jsonb),
    'questions', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'code', q.code, 'pack_code', q.pack_code, 'source_tag', q.source_tag,
        'version', v.version, 'question_text', v.question_text, 'domain_code', v.domain_code,
        'secondary_domain_codes', v.secondary_domain_codes, 'applicability', v.applicability,
        'type_text', v.type_text, 'trigger_text', v.trigger_text, 'trigger_condition', v.trigger_condition,
        'risk_tags', v.risk_tags, 'evidence_guidance', v.evidence_guidance, 'risk_if_weak', v.risk_if_weak,
        'suggested_owner', v.suggested_owner, 'priority', v.priority, 'criticality', v.criticality,
        'legal_control_basis', v.legal_control_basis, 'recommended_fix', v.recommended_fix,
        'truststack_module', v.truststack_module, 'na_rule', v.na_rule, 'source_ref', v.source_ref,
        'status', v.status
      ) ORDER BY q.code)
      FROM public.questions q
      JOIN public.question_packs p ON p.code = q.pack_code
      JOIN public.question_versions v ON v.question_code = q.code AND v.version = q.current_version
      WHERE q.pack_code = ANY (p_pack_codes)
        AND p.status = 'approved'
        AND p.tier <> 'reference'
    ), '[]'::jsonb)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.bank_for_generation(uuid, text[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.bank_for_generation(uuid, text[]) TO authenticated;

-- ---------------------------------------------------------------------------
-- (3) Provenance is Anix's view
-- ---------------------------------------------------------------------------

REVOKE SELECT ON public.assessment_questions FROM authenticated;
GRANT SELECT (organization_id, assessment_id, question_code, question_version, question_text, domain_code,
  domain_weight, applicability, priority, evidence_guidance, suggested_owner, sort_order, created_at)
  ON public.assessment_questions TO authenticated;

REVOKE SELECT ON public.assessments FROM authenticated;
GRANT SELECT (id, organization_id, name, assessment_type, status, industry_code, risk_tags, scope_derived_at,
  generated_at, created_by, created_at, updated_at)
  ON public.assessments TO authenticated;

REVOKE SELECT ON public.industries FROM authenticated;
GRANT SELECT (code, name) ON public.industries TO authenticated;

-- Which packs each of an organisation's assessments came from, and — for one
-- assessment — why each question is in it. Both ids filter; the caller needs
-- `question.read_bank` IN THAT ORGANISATION.
CREATE OR REPLACE FUNCTION public.assessment_provenance(p_organization_id uuid, p_assessment_id uuid DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF app.current_user_id() IS NULL THEN
    RAISE EXCEPTION 'Sign in to continue.' USING ERRCODE = 'TS401';
  END IF;
  IF NOT app.has_permission(p_organization_id, 'question.read_bank') THEN
    RAISE EXCEPTION 'You do not have permission to do that.' USING ERRCODE = 'TS403';
  END IF;

  RETURN jsonb_build_object(
    'assessments', COALESCE((
      SELECT jsonb_object_agg(a.id::text, to_jsonb(COALESCE(a.pack_codes, ARRAY[]::text[])))
      FROM public.assessments a
      WHERE a.organization_id = p_organization_id
        AND (p_assessment_id IS NULL OR a.id = p_assessment_id)
    ), '{}'::jsonb),
    'questions', CASE WHEN p_assessment_id IS NULL THEN '[]'::jsonb ELSE COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'question_code', aq.question_code, 'pack_code', aq.pack_code, 'included_reason', aq.included_reason
      ) ORDER BY aq.sort_order)
      FROM public.assessment_questions aq
      WHERE aq.organization_id = p_organization_id AND aq.assessment_id = p_assessment_id
    ), '[]'::jsonb) END
  );
END;
$$;

REVOKE ALL ON FUNCTION public.assessment_provenance(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.assessment_provenance(uuid, uuid) TO authenticated;
