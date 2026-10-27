# P4 — M26: AI Governance Module
## Register AI models, document training data consent, manage automated decision-making

**Session:** P4 — M26  
**Phase:** P4 — Innovation  
**Priority:** MEDIUM — future-proofing for MeitY AI Policy; high relevance for FinTech/HealthTech  
**Estimated time:** 1 session (~3 hours)  
**Branch:** `feature/p4-m26-ai-governance`  
**Tag after completion:** `v4.1.0`  
**Prerequisites:** M1 Compass Assessment + M2 Consent Management live

---

## READ FIRST
Read: `implementation/MASTER_CONTEXT.md` + `implementation/progress.md` + `implementation/Implementation_Planner/05_Phase_P4_Innovation.md`

---

## What to Build

Help organizations comply with emerging DPDP and MeitY guidance on AI: maintain a registry of AI models, document the consent basis for training data, manage data principals' right to opt out of automated decisions, and track bias audits.

---

## Database Schema

```sql
CREATE TABLE ai_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,                           -- "Credit Scoring Model v2"
  description TEXT NOT NULL,
  model_type TEXT NOT NULL,                     -- 'classification' | 'regression' | 'nlp' | 'recommendation' | 'other'
  use_case TEXT NOT NULL,                       -- "Automated loan approval decisions"
  training_data_description TEXT NOT NULL,      -- Description of training data (no raw data)
  consent_basis TEXT NOT NULL,                  -- 'consent' | 'legitimate_interest' | 'legal_obligation' | 'vital_interests'
  consent_config_id UUID REFERENCES consent_configs(id),   -- If consent_basis = 'consent'
  processes_personal_data BOOLEAN NOT NULL DEFAULT TRUE,
  makes_automated_decisions BOOLEAN NOT NULL DEFAULT FALSE,
  allows_opt_out BOOLEAN NOT NULL DEFAULT FALSE,
  opt_out_mechanism TEXT,                       -- How data principals can opt out
  last_bias_audit_at TIMESTAMPTZ,
  next_bias_audit_due TIMESTAMPTZ,
  vendor_name TEXT,                             -- If using a third-party AI model
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE ai_decision_opt_outs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  model_id UUID NOT NULL REFERENCES ai_models(id) ON DELETE CASCADE,
  data_principal_email TEXT NOT NULL,
  opted_out_at TIMESTAMPTZ DEFAULT NOW(),
  reason TEXT,
  UNIQUE(model_id, data_principal_email)
);

CREATE TABLE ai_bias_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id UUID NOT NULL REFERENCES ai_models(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id),
  audited_by TEXT NOT NULL,                     -- Name of auditor or firm
  audit_date DATE NOT NULL,
  findings TEXT NOT NULL,
  action_items TEXT,
  passed BOOLEAN NOT NULL,
  next_audit_due DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE ai_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_decision_opt_outs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_bias_audits ENABLE ROW LEVEL SECURITY;

-- Standard org-scoped RLS for all three tables
```

---

## Compass Assessment Extension

When M26 is built, add AI governance questions to the M1 Compass Assessment (as an optional module):

```typescript
// src/lib/assessment-questions.ts — add AI section:
const AI_GOVERNANCE_QUESTIONS = [
  { id: 'ai_1', text: 'Do you use AI or ML models that process personal data?', section: 'AI Governance' },
  { id: 'ai_2', text: 'Is each AI model\'s training data documented with its consent basis?' },
  { id: 'ai_3', text: 'Do data principals have a way to opt out of automated decisions?' },
  { id: 'ai_4', text: 'Have you conducted a bias audit in the last 12 months?' },
  { id: 'ai_5', text: 'Is there a process to explain automated decisions to data principals?' },
];
// These appear ONLY if org answers 'yes' to ai_1 (conditional question flow)
```

---

## API Routes

### CRUD for `/api/ai-models` (GET, POST, PATCH, DELETE)
**Auth:** Admin or DPO

### POST `/api/ai-models/[id]/opt-out` (PUBLIC)
**Body:** `{ data_principal_email: string, reason?: string }`  
**Requires:** Model.allows_opt_out = true  
**Action:** Insert opt-out record, send confirmation email to data principal

### GET `/api/ai-models/[id]/opt-outs` (AUTH — admin/DPO)
### POST `/api/ai-models/[id]/bias-audit` (AUTH — admin/DPO)
**Body:** `{ audited_by, audit_date, findings, action_items, passed, next_audit_due }`

---

## UI: `/dashboard/ai-governance`

```
AI Governance Registry                           [+ Add AI Model]
─────────────────────────────────────────────────────────────────
AI Governance Readiness Score: 65/100
2 models registered | 1 bias audit due | 0 opt-outs pending

─────────────────────────────────────────────────────────────────
Credit Scoring Model v2               Active | Makes automated decisions
Consent basis: Explicit consent       Opt-out: Enabled
Bias audit: Jun 15, 2026 ✅           Next audit due: Dec 15, 2026
Opt-outs: 3 data principals           [View Details] [Edit]

Recommendation Engine                 Active | No automated decisions
Consent basis: Legitimate interest    Opt-out: Not applicable
Bias audit: ⚠️ Not yet conducted      [Schedule Audit] [Edit]
```

### Model Detail Page

Full model information + bias audit history + opt-out list (anonymized count, not emails).

---

## Testing

1. Register a new AI model in the registry
2. Mark "makes_automated_decisions = true" + "allows_opt_out = true"
3. POST `/api/ai-models/[id]/opt-out` with test email → opt-out recorded
4. AI Governance score updates in dashboard
5. Add bias audit record → "last_bias_audit_at" updates
6. Compass Assessment → AI section appears when "uses AI" = yes
7. `npm run type-check` → 0 errors; `npm audit` → 0 vulnerabilities

---

## After Completion

1. Update `progress.md` — M26 AI Governance ✅ Complete
2. Update `MASTER_CONTEXT.md` — add M26 section
3. Update `tracker-data.json` — M26 status → "built"
4. Apply SQL: ai_models + ai_decision_opt_outs + ai_bias_audits tables
5. Git commit + push + PR + merge + tag `v4.1.0`
