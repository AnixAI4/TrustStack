-- Slice 11, Stage 1a — the safe AI gateway: the organisation's switch and the
-- draft store (SLICE_11 §4.4, §4.8, §4.9, §4.10, §6; D-124).
--
-- DPDP anchoring (the Act and G.S.R. 846(E), checked in docs/legal/):
--   * TrustStack is each client's Data Processor (s.2(k)); a model provider
--     it sends tenant data to is a sub-processor, engaged "only under a valid
--     contract" (s.8(2)). So the assistant is OFF until a person with
--     organization.update records the client's contract (DPA) reference (A2).
--   * s.16(2) keeps stricter sector law (e.g. payment-data localisation) and
--     Rule 13(4) may bar a Significant Data Fiduciary from transferring
--     specified data out of India. So `bfsi` and `healthcare` tenants stay off
--     until counsel's sign-off for that industry is recorded here, and a
--     tenant with an SDF notification stays off until Rule 13(4)'s list is
--     known (A4). Both are enforced for tooling too.
--   * Rule 6(1)(c): access to the assistant is controlled and logged — every
--     call is a row in `ai_drafts`, audited by trigger as the person, with the
--     task, the target, the model and the tokens; never the prompt or the
--     answer, which live only in the row (tenant data, its own RLS).
--
-- What is enforced HERE, not only in the application:
--   * `organizations.ai_enabled` is false by default; on needs a contract
--     reference (a CHECK); who turned it on, and when, are stamped by the
--     database and cleared when it is turned off.
--   * Turning it on is refused for a held industry without counsel's sign-off,
--     or with an SDF notification. Moving a tenant into a held industry, or
--     recording an SDF notification, turns the assistant OFF in the same update.
--   * A draft can be stored only while the organisation's assistant is on and
--     not held — a second lock behind the gateway's own check.
--   * A draft is inserted once. No user may update or delete one in Stage 1a
--     (accepting and discarding arrive with the drafting tasks, Stage 2a).
--   * Reading a draft needs `ai.use` AND the read permission of what the task
--     explains (§4.7) — `assessment.read` for the Question Helper.
--
-- Additive: four organisation columns, two new tables, new functions, the
-- audit function replaced in place (two stamps join the "never an edit" list).
-- Nothing a live user holds is revoked. The platform kill switch (`AI_ENABLED`,
-- an environment variable) is the application's and wins over all of this.
--
-- Layout: (1) DDL; (2) vocabularies; (3) the organisation's switch;
-- (4) the draft store's triggers; (5) audit; (6) usage for the limits;
-- (7) grants + RLS; (8) apply-time assertions.


-- ===========================================================================
-- (1) DDL
-- ===========================================================================

-- AlterTable — the switch (A2): off by default; on only with the contract reference.
ALTER TABLE "organizations" ADD COLUMN "ai_enabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "organizations" ADD COLUMN "ai_contract_ref" TEXT;
ALTER TABLE "organizations" ADD COLUMN "ai_enabled_by" UUID;
ALTER TABLE "organizations" ADD COLUMN "ai_enabled_at" TIMESTAMPTZ(6);
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_ai_enabled_by_fkey" FOREIGN KEY ("ai_enabled_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_ai_contract_check"
  CHECK (NOT "ai_enabled" OR ("ai_contract_ref" IS NOT NULL AND btrim("ai_contract_ref") <> ''));
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_ai_contract_length_check"
  CHECK ("ai_contract_ref" IS NULL OR char_length("ai_contract_ref") <= 200);

-- CreateTable — counsel's sign-off per held industry (A4). Platform reference
-- data, not tenant data: written by migration only, read by every member. Empty
-- today, so `bfsi` and `healthcare` tenants cannot turn the assistant on.
CREATE TABLE "ai_industry_signoffs" (
    "industry_code" TEXT NOT NULL,
    "counsel_ref" TEXT NOT NULL,
    "signed_on" DATE NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_industry_signoffs_pkey" PRIMARY KEY ("industry_code")
);
ALTER TABLE "ai_industry_signoffs" ADD CONSTRAINT "ai_industry_signoffs_industry_code_fkey" FOREIGN KEY ("industry_code") REFERENCES "industries"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable — one row per model call: a draft for a person, or a rejected
-- call (a refusal, an answer that failed the guardrails). Never changed in 1a.
CREATE TABLE "ai_drafts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "task" TEXT NOT NULL,
    "target_type" TEXT NOT NULL,
    "target_id" UUID,
    "target_key" TEXT,
    "status" TEXT NOT NULL,
    "rejection" TEXT,
    "input_digest" TEXT NOT NULL,
    "context" JSONB NOT NULL,
    "output" JSONB,
    "model" TEXT NOT NULL,
    "corpus_version" TEXT NOT NULL,
    "prompt_version" TEXT NOT NULL,
    "input_tokens" INTEGER NOT NULL DEFAULT 0,
    "output_tokens" INTEGER NOT NULL DEFAULT 0,
    "cache_read_tokens" INTEGER NOT NULL DEFAULT 0,
    "cache_write_tokens" INTEGER NOT NULL DEFAULT 0,
    "latency_ms" INTEGER NOT NULL DEFAULT 0,
    "injection_flagged" BOOLEAN NOT NULL DEFAULT false,
    "citation_flags" JSONB NOT NULL DEFAULT '[]',
    "requested_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_drafts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ai_drafts_organization_id_created_at_idx" ON "ai_drafts"("organization_id", "created_at");

-- CreateIndex — the per-person limit reads this.
CREATE INDEX "ai_drafts_requested_by_created_at_idx" ON "ai_drafts"("requested_by", "created_at");

-- CreateIndex — the key a later tenant table points at (D-027).
CREATE UNIQUE INDEX "ai_drafts_organization_id_id_key" ON "ai_drafts"("organization_id", "id");

-- AddForeignKey
ALTER TABLE "ai_drafts" ADD CONSTRAINT "ai_drafts_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ai_drafts" ADD CONSTRAINT "ai_drafts_requested_by_fkey" FOREIGN KEY ("requested_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- ===========================================================================
-- (2) Vocabularies — mirrored in packages/core/src/ai-tasks.ts
-- ===========================================================================

-- The tasks the gateway runs. Stage 1a: the Question Helper only, through the
-- API. Each later stage replaces this function with its tasks added.
CREATE OR REPLACE FUNCTION app.ai_tasks()
RETURNS text[]
LANGUAGE sql
IMMUTABLE
SET search_path = ''
AS $$ SELECT ARRAY['question_helper'] $$;

-- The permission a task's draft is read with, beside `ai.use` (§4.7).
CREATE OR REPLACE FUNCTION app.ai_task_read_permission(p_task text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = ''
AS $$
  SELECT CASE p_task
    WHEN 'question_helper' THEN 'assessment.read'
  END
$$;

-- s.16(2): industries whose sector rules may be stricter — held until counsel signs off (A4).
CREATE OR REPLACE FUNCTION app.ai_held_industries()
RETURNS text[]
LANGUAGE sql
IMMUTABLE
SET search_path = ''
AS $$ SELECT ARRAY['bfsi', 'healthcare'] $$;

-- Why an organisation may not turn the assistant on: 'sdf' (Rule 13(4)),
-- 'sector' (s.16(2), no sign-off), or null. From the values given, so the
-- guard can judge the NEW row.
CREATE OR REPLACE FUNCTION app.ai_hold_reason(p_industry_code text, p_sdf_notified_on date)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT CASE
    WHEN p_sdf_notified_on IS NOT NULL THEN 'sdf'
    WHEN p_industry_code = ANY (app.ai_held_industries())
         AND NOT EXISTS (SELECT 1 FROM public.ai_industry_signoffs s WHERE s.industry_code = p_industry_code) THEN 'sector'
  END
$$;

ALTER TABLE "ai_drafts" ADD CONSTRAINT "ai_drafts_task_check" CHECK ("task" = ANY (app.ai_tasks()));
ALTER TABLE "ai_drafts" ADD CONSTRAINT "ai_drafts_target_type_check" CHECK ("target_type" IN ('assessment_question'));
-- Stage 1a stores a draft or a rejected call; accepting and discarding come in 2a.
ALTER TABLE "ai_drafts" ADD CONSTRAINT "ai_drafts_status_check" CHECK ("status" IN ('draft', 'rejected'));
ALTER TABLE "ai_drafts" ADD CONSTRAINT "ai_drafts_rejection_check"
  CHECK ("rejection" IS NULL OR "rejection" IN ('refusal', 'truncated', 'invalid_output', 'wording', 'citation', 'other_tenant'));
-- A draft carries an answer and no rejection; a rejected call the reverse — never a half-answer (§4.3).
ALTER TABLE "ai_drafts" ADD CONSTRAINT "ai_drafts_outcome_check"
  CHECK (("status" = 'draft' AND "output" IS NOT NULL AND "rejection" IS NULL)
      OR ("status" = 'rejected' AND "output" IS NULL AND "rejection" IS NOT NULL));
ALTER TABLE "ai_drafts" ADD CONSTRAINT "ai_drafts_digest_check" CHECK ("input_digest" ~ '^[0-9a-f]{64}$');
ALTER TABLE "ai_drafts" ADD CONSTRAINT "ai_drafts_tokens_check"
  CHECK ("input_tokens" >= 0 AND "output_tokens" >= 0 AND "cache_read_tokens" >= 0 AND "cache_write_tokens" >= 0 AND "latency_ms" >= 0);
ALTER TABLE "ai_drafts" ADD CONSTRAINT "ai_drafts_citation_flags_check" CHECK (jsonb_typeof("citation_flags") = 'array');


-- ===========================================================================
-- (3) The organisation's switch (A2, A4)
-- ===========================================================================

CREATE OR REPLACE FUNCTION app.guard_organization_ai()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_actor uuid := app.current_user_id();
  v_hold text := app.ai_hold_reason(NEW.industry_code, NEW.sdf_notified_on);
BEGIN
  IF (NEW.ai_enabled, NEW.ai_contract_ref) IS DISTINCT FROM (OLD.ai_enabled, OLD.ai_contract_ref)
     AND v_actor IS NOT NULL
     AND NOT app.has_permission(OLD.id, 'organization.update') THEN
    RAISE EXCEPTION 'You do not have permission to turn the AI assistant on or off.' USING ERRCODE = 'TS403';
  END IF;

  IF NEW.ai_enabled AND v_hold IS NOT NULL THEN
    IF NOT OLD.ai_enabled THEN
      -- Turning it on, for tooling too.
      RAISE EXCEPTION '%', CASE v_hold
        WHEN 'sdf' THEN 'The AI assistant stays off for a Significant Data Fiduciary until the data it may not transfer out of India (Rule 13(4)) is known.'
        ELSE 'The AI assistant stays off for this industry until counsel''s sign-off on its sector rules (s.16(2)) is recorded.'
      END USING ERRCODE = 'TS409';
    END IF;
    -- Already on, and the industry or the SDF notification just changed: off, in the same update.
    NEW.ai_enabled := false;
  END IF;

  IF NEW.ai_enabled AND NOT OLD.ai_enabled THEN
    NEW.ai_enabled_by := v_actor;
    NEW.ai_enabled_at := now();
  ELSIF NOT NEW.ai_enabled THEN
    NEW.ai_enabled_by := NULL;
    NEW.ai_enabled_at := NULL;
  ELSE
    NEW.ai_enabled_by := OLD.ai_enabled_by;
    NEW.ai_enabled_at := OLD.ai_enabled_at;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER organizations_guard_ai BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION app.guard_organization_ai();

-- An organisation created with the assistant on is held to the same rules.
CREATE OR REPLACE FUNCTION app.guard_organization_ai_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.ai_enabled AND app.ai_hold_reason(NEW.industry_code, NEW.sdf_notified_on) IS NOT NULL THEN
    RAISE EXCEPTION 'The AI assistant cannot start on for this organisation (s.16(2), Rule 13(4)).' USING ERRCODE = 'TS409';
  END IF;
  IF NEW.ai_enabled THEN
    NEW.ai_enabled_by := app.current_user_id();
    NEW.ai_enabled_at := now();
  ELSE
    NEW.ai_enabled_by := NULL;
    NEW.ai_enabled_at := NULL;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER organizations_guard_ai_insert BEFORE INSERT ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION app.guard_organization_ai_insert();


-- ===========================================================================
-- (4) The draft store
-- ===========================================================================

-- Stamped by the database: who asked and when. And the second lock: no draft
-- unless the organisation's assistant is on and not held.
CREATE OR REPLACE FUNCTION app.guard_ai_draft_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_org public.organizations%ROWTYPE;
BEGIN
  SELECT * INTO v_org FROM public.organizations o WHERE o.id = NEW.organization_id;
  IF NOT FOUND OR NOT v_org.ai_enabled OR app.ai_hold_reason(v_org.industry_code, v_org.sdf_notified_on) IS NOT NULL THEN
    RAISE EXCEPTION 'The AI assistant is off for this organisation.' USING ERRCODE = 'TS403';
  END IF;
  NEW.requested_by := app.current_user_id();
  NEW.created_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER ai_drafts_guard_insert BEFORE INSERT ON public.ai_drafts
  FOR EACH ROW EXECUTE FUNCTION app.guard_ai_draft_insert();

-- Never changed in Stage 1a, by anyone — tooling included.
CREATE OR REPLACE FUNCTION app.refuse_ai_draft_change()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  RAISE EXCEPTION 'An AI draft is recorded once and never changed.' USING ERRCODE = 'TS409';
END;
$$;

CREATE TRIGGER ai_drafts_refuse_update BEFORE UPDATE ON public.ai_drafts
  FOR EACH ROW EXECUTE FUNCTION app.refuse_ai_draft_change();


-- ===========================================================================
-- (5) Audit — as the person, never the text (§4.10)
-- ===========================================================================

-- A call: `ai.requested` (a draft) or `ai.refused` (a refusal, or an answer the
-- guardrails rejected), and `ai.injection_flagged` beside it when the context
-- carried an instruction-like text. Task, target, model, tokens — never the
-- context, the answer or a citation's text.
CREATE OR REPLACE FUNCTION app.audit_ai_draft()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_meta jsonb := jsonb_strip_nulls(jsonb_build_object(
    'task', NEW.task,
    'targetType', NEW.target_type,
    'targetId', NEW.target_id,
    'targetKey', NEW.target_key,
    'status', NEW.status,
    'rejection', NEW.rejection,
    'model', NEW.model,
    'corpusVersion', NEW.corpus_version,
    'promptVersion', NEW.prompt_version,
    'inputTokens', NEW.input_tokens,
    'outputTokens', NEW.output_tokens,
    'cacheReadTokens', NEW.cache_read_tokens,
    'cacheWriteTokens', NEW.cache_write_tokens,
    'latencyMs', NEW.latency_ms,
    'citationsFlagged', jsonb_array_length(NEW.citation_flags)
  ));
BEGIN
  IF NEW.requested_by IS NULL THEN
    RETURN NULL; -- tooling
  END IF;
  INSERT INTO public.audit_logs (organization_id, user_id, event_type, entity_type, entity_id, description, metadata)
  VALUES (
    NEW.organization_id, NEW.requested_by,
    CASE NEW.status WHEN 'draft' THEN 'ai.requested' ELSE 'ai.refused' END,
    'ai_draft', NEW.id,
    CASE NEW.status WHEN 'draft' THEN 'AI assistant answered' ELSE 'AI assistant answer refused' END,
    v_meta
  );
  IF NEW.injection_flagged THEN
    INSERT INTO public.audit_logs (organization_id, user_id, event_type, entity_type, entity_id, description, metadata)
    VALUES (NEW.organization_id, NEW.requested_by, 'ai.injection_flagged', 'ai_draft', NEW.id,
            'Instruction-like text in the AI context was treated as data', v_meta);
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER ai_drafts_audit AFTER INSERT ON public.ai_drafts
  FOR EACH ROW EXECUTE FUNCTION app.audit_ai_draft();

-- Turning the assistant on or off, and changing the contract reference: its own
-- event, with the reference (a contract number, not personal data — A2).
CREATE OR REPLACE FUNCTION app.audit_organization_ai()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_actor uuid := app.current_user_id();
BEGIN
  IF v_actor IS NULL OR (NEW.ai_enabled, NEW.ai_contract_ref) IS NOT DISTINCT FROM (OLD.ai_enabled, OLD.ai_contract_ref) THEN
    RETURN NULL;
  END IF;
  INSERT INTO public.audit_logs (organization_id, user_id, event_type, entity_type, entity_id, description, metadata)
  VALUES (
    NEW.id, v_actor,
    CASE
      WHEN NEW.ai_enabled AND NOT OLD.ai_enabled THEN 'ai.enabled'
      WHEN OLD.ai_enabled AND NOT NEW.ai_enabled THEN 'ai.disabled'
      ELSE 'ai.contract_changed'
    END,
    'organization', NEW.id,
    CASE
      WHEN NEW.ai_enabled AND NOT OLD.ai_enabled THEN 'AI assistant turned on'
      WHEN OLD.ai_enabled AND NOT NEW.ai_enabled THEN 'AI assistant turned off'
      ELSE 'AI assistant contract reference changed'
    END,
    jsonb_strip_nulls(jsonb_build_object('aiEnabled', NEW.ai_enabled, 'contractRef', NEW.ai_contract_ref,
                                         'previousContractRef', OLD.ai_contract_ref))
  );
  RETURN NULL;
END;
$$;

CREATE TRIGGER organizations_audit_ai AFTER UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION app.audit_organization_ai();

-- The scope audit, from its 20261017000000_retention_ai_risk body with the two
-- AI stamps added to the "never an edit" list and nothing else changed.
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
                        'ends_on', 'inform_by', 'review_recorded_by', 'review_recorded_at',
                        -- Slice 11 Stage 1a: who turned the AI assistant on, and when, are stamped, never edits
                        'ai_enabled_by', 'ai_enabled_at')
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


-- ===========================================================================
-- (6) Usage, for the limits (§4.9) — counted over every call, whatever task
--     permission the caller holds, so a limit cannot be dodged by RLS
-- ===========================================================================

CREATE OR REPLACE FUNCTION public.ai_usage(p_organization_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_actor uuid := app.current_user_id();
  v_month_start timestamptz := date_trunc('month', now() AT TIME ZONE 'Asia/Kolkata') AT TIME ZONE 'Asia/Kolkata';
BEGIN
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'Sign in to continue.' USING ERRCODE = 'TS401';
  END IF;
  IF NOT app.has_permission(p_organization_id, 'ai.use') THEN
    RAISE EXCEPTION 'You do not have access to this organisation''s AI assistant.' USING ERRCODE = 'TS403';
  END IF;
  RETURN jsonb_build_object(
    'personCallsLastHour', (SELECT count(*) FROM public.ai_drafts d
                             WHERE d.organization_id = p_organization_id AND d.requested_by = v_actor
                               AND d.created_at > now() - interval '1 hour'),
    'organizationCallsLastHour', (SELECT count(*) FROM public.ai_drafts d
                                   WHERE d.organization_id = p_organization_id AND d.created_at > now() - interval '1 hour'),
    'organizationTokensThisMonth', (SELECT COALESCE(sum(d.input_tokens + d.output_tokens + d.cache_read_tokens + d.cache_write_tokens), 0)
                                     FROM public.ai_drafts d
                                     WHERE d.organization_id = p_organization_id AND d.created_at >= v_month_start)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.ai_usage(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ai_usage(uuid) TO authenticated;


-- ===========================================================================
-- (7) Grants + RLS (D-019) — `anon` gets nothing
-- ===========================================================================

-- The switch and the contract reference — never the stamps.
GRANT UPDATE (ai_enabled, ai_contract_ref) ON public.organizations TO authenticated;

REVOKE ALL ON public.ai_industry_signoffs, public.ai_drafts FROM anon, authenticated;

-- Reference data: every signed-in person may read which industries counsel signed off.
GRANT SELECT ON public.ai_industry_signoffs TO authenticated;
ALTER TABLE public.ai_industry_signoffs ENABLE ROW LEVEL SECURITY;
CREATE POLICY ai_industry_signoffs_select_signed_in ON public.ai_industry_signoffs
  FOR SELECT TO authenticated
  USING (true);

GRANT SELECT ON public.ai_drafts TO authenticated;
-- What the gateway records, as the person. Never who asked or when (stamped).
GRANT INSERT (organization_id, task, target_type, target_id, target_key, status, rejection, input_digest, context, output,
              model, corpus_version, prompt_version, input_tokens, output_tokens, cache_read_tokens, cache_write_tokens,
              latency_ms, injection_flagged, citation_flags)
  ON public.ai_drafts TO authenticated;
-- No UPDATE, no DELETE in Stage 1a.

ALTER TABLE public.ai_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY ai_drafts_select_member ON public.ai_drafts
  FOR SELECT TO authenticated
  USING (
    organization_id IN (SELECT app.current_user_organization_ids())
    AND app.has_permission(organization_id, 'ai.use')
    AND app.has_permission(organization_id, app.ai_task_read_permission(task))
  );
CREATE POLICY ai_drafts_insert_member ON public.ai_drafts
  FOR INSERT TO authenticated
  WITH CHECK (
    organization_id IN (SELECT app.current_user_organization_ids())
    AND app.has_permission(organization_id, 'ai.use')
    AND app.has_permission(organization_id, app.ai_task_read_permission(task))
  );


-- ===========================================================================
-- (8) Apply-time assertions
-- ===========================================================================

DO $$
DECLARE
  v_priv text;
BEGIN
  ASSERT app.ai_tasks() = ARRAY['question_helper'], 'Stage 1a: the Question Helper only';
  ASSERT app.ai_task_read_permission('question_helper') = 'assessment.read', 'the Question Helper reads with assessment.read';
  ASSERT app.ai_held_industries() = ARRAY['bfsi', 'healthcare'], 'A4: bfsi and healthcare held';
  ASSERT EXISTS (SELECT 1 FROM public.industries WHERE code = 'bfsi')
     AND EXISTS (SELECT 1 FROM public.industries WHERE code = 'healthcare'), 'the held codes are real industry codes';
  ASSERT app.ai_hold_reason('bfsi', NULL) = 'sector', 'bfsi held without a sign-off';
  ASSERT app.ai_hold_reason('university', DATE '2026-01-01') = 'sdf', 'an SDF is held';
  ASSERT app.ai_hold_reason('university', NULL) IS NULL, 'a university is not held';
  ASSERT NOT EXISTS (SELECT 1 FROM public.organizations WHERE ai_enabled), 'off for everyone on apply';
  -- Nobody writes a stamp; nobody changes or removes a draft; anon reads nothing.
  ASSERT NOT has_column_privilege('authenticated', 'public.organizations', 'ai_enabled_by', 'UPDATE')
     AND NOT has_column_privilege('authenticated', 'public.organizations', 'ai_enabled_at', 'UPDATE'), 'the switch''s stamps are the database''s';
  FOREACH v_priv IN ARRAY ARRAY['UPDATE', 'DELETE', 'TRUNCATE'] LOOP
    ASSERT NOT has_table_privilege('authenticated', 'public.ai_drafts', v_priv), 'drafts: no ' || v_priv;
    ASSERT NOT has_table_privilege('authenticated', 'public.ai_industry_signoffs', v_priv), 'sign-offs: no ' || v_priv;
  END LOOP;
  ASSERT NOT has_table_privilege('authenticated', 'public.ai_industry_signoffs', 'INSERT'), 'sign-offs are written by migration';
  ASSERT NOT has_column_privilege('authenticated', 'public.ai_drafts', 'requested_by', 'INSERT'), 'who asked is stamped';
  ASSERT NOT has_table_privilege('anon', 'public.ai_drafts', 'SELECT')
     AND NOT has_table_privilege('anon', 'public.ai_industry_signoffs', 'SELECT'), 'anon reads nothing';
  ASSERT NOT has_function_privilege('anon', 'public.ai_usage(uuid)', 'EXECUTE'), 'anon reads no usage';
END;
$$;
