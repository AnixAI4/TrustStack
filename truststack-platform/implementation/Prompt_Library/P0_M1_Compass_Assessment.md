# SESSION PROMPT — P0 M1: DPDP Compass™ Assessment
## TrustStack™ Platform — Phase 0, Module 1

---

## STEP 1 — READ THESE FILES FIRST (before writing any code)

```
implementation/MASTER_CONTEXT.md   ← Full project context, schema, tech stack, standards
implementation/progress.md         ← Current build status
```

Read both completely. Everything you need to make consistent decisions is in MASTER_CONTEXT.

---

## STEP 2 — WHAT THIS SESSION BUILDS

**M1: DPDP Compass™ Assessment** is the first and most foundational module. It also sets up ALL shared infrastructure that every other module depends on:

1. **Supabase integration** — client setup, server client, middleware
2. **Authentication** — signup, login, email verification, org creation
3. **Dashboard shell** — sidebar navigation, top bar, layout
4. **The assessment itself** — 45 questions, scoring, gap report

After this session, a new user can sign up, create their organization, complete the DPDP Compass Assessment, and see their Compass Score with a gap report.

---

## STEP 3 — PRE-FLIGHT CHECKS (most already done — verify before coding)

✅ **Already complete — DO NOT redo:**
- `@supabase/supabase-js` (2.108.2) and `@supabase/ssr` (0.12.0) are installed
- `.env.local` has all 3 Supabase keys + Anthropic key — already filled
- `src/lib/supabase/client.ts` — exists (browser client)
- `src/lib/supabase/server.ts` — exists (server client with cookie handling)
- `src/lib/supabase/admin.ts` — exists (service role admin client)
- Live connection to Supabase verified

🔲 **Still needs to be done in this session:**
```bash
# Install email library (needed for auth confirmation emails later)
npm install resend
```

**Run this SQL in Supabase Dashboard → SQL Editor FIRST before writing any UI code:**

**Supabase SQL to run in Supabase Dashboard → SQL Editor:**

```sql
-- Run this entire block in Supabase SQL Editor

-- Core tables
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  cin TEXT,
  gstin TEXT,
  registered_state TEXT,
  industry TEXT,
  employee_count_range TEXT,
  revenue_range TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'admin',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

-- M1 tables
CREATE TABLE assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'in_progress',
  compass_score INTEGER,
  maturity_level INTEGER,
  risk_tier TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE assessment_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL,
  section TEXT NOT NULL,
  answer TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE assessment_gaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL,
  gap_description TEXT NOT NULL,
  priority TEXT NOT NULL,
  dpdp_section TEXT,
  recommended_action TEXT NOT NULL,
  module_to_fix TEXT,
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_gaps ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "org members can read org" ON organizations FOR SELECT
  USING (id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));

CREATE POLICY "org members can update org" ON organizations FOR UPDATE
  USING (id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "members can read membership" ON organization_members FOR SELECT
  USING (user_id = auth.uid() OR organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "org members can read assessments" ON assessments FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));

CREATE POLICY "org members can write assessments" ON assessments FOR ALL
  USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));

CREATE POLICY "org members can read answers" ON assessment_answers FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));

CREATE POLICY "org members can write answers" ON assessment_answers FOR ALL
  USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));

CREATE POLICY "org members can read gaps" ON assessment_gaps FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));

CREATE POLICY "org members can write gaps" ON assessment_gaps FOR ALL
  USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));
```

---

## STEP 4 — FILES TO CREATE

Build in this exact order (each depends on the previous):

### 4a. Foundation

**`src/lib/supabase/client.ts`** — ✅ ALREADY EXISTS — do not recreate  
**`src/lib/supabase/server.ts`** — ✅ ALREADY EXISTS — do not recreate  
**`src/lib/supabase/admin.ts`** — ✅ ALREADY EXISTS — do not recreate  
**`src/lib/constants.ts`** — DPDP constants (copy from MASTER_CONTEXT §10)  
**`src/types/dpdp.ts`** — TypeScript types for all DPDP domain objects  
**`src/middleware.ts`** — Auth protection for `/dashboard/*` routes  

**`tailwind.config.ts`** — Add truststack brand colors (see MASTER_CONTEXT §12)

### 4b. Auth Pages

**`src/app/(auth)/layout.tsx`** — Centered card layout for auth pages  
**`src/app/(auth)/login/page.tsx`** — Email + password login form  
**`src/app/(auth)/signup/page.tsx`** — Signup → creates user + prompts org creation  
**`src/app/(auth)/create-organization/page.tsx`** — Org setup wizard (name, industry, size)  
**`src/app/api/auth/callback/route.ts`** — Supabase OAuth callback handler  

### 4c. Dashboard Shell

**`src/app/(dashboard)/layout.tsx`** — Dashboard layout with sidebar + topbar  
**`src/components/dashboard/Sidebar.tsx`** — Navigation sidebar with all module links  
**`src/components/dashboard/Topbar.tsx`** — Top bar with org name, user menu, notifications  
**`src/app/(dashboard)/page.tsx`** — Redirects to `/dashboard/overview`  

### 4d. M1 Assessment Pages

**`src/app/(dashboard)/assessment/page.tsx`** — Assessment home: start new or view history  
**`src/app/(dashboard)/assessment/[id]/page.tsx`** — Assessment questionnaire (step-by-step)  
**`src/app/(dashboard)/assessment/results/[id]/page.tsx`** — Results: Compass Score + gap report  

### 4e. M1 API Routes

**`src/app/api/assessment/start/route.ts`** — POST: creates new assessment record, returns id  
**`src/app/api/assessment/save-answer/route.ts`** — POST: saves individual answer (auto-save)  
**`src/app/api/assessment/submit/route.ts`** — POST: marks complete, computes score, generates gaps  
**`src/app/api/assessment/results/[id]/route.ts`** — GET: returns assessment + answers + gaps  

### 4f. M1 Components

**`src/components/modules/assessment/AssessmentQuestion.tsx`** — Single question card  
**`src/components/modules/assessment/AssessmentProgress.tsx`** — Progress bar + section indicator  
**`src/components/modules/assessment/CompassScoreGauge.tsx`** — Animated score dial (0–100)  
**`src/components/modules/assessment/GapReportCard.tsx`** — Single gap with priority + action  
**`src/components/modules/assessment/MaturityBadge.tsx`** — Level 1–5 maturity badge  

### 4g. Scoring Library

**`src/lib/ai/compass-scorer.ts`** — Pure TypeScript scoring function (see MASTER_CONTEXT §11)  
**`src/lib/ai/gap-generator.ts`** — Generates gap objects from 'no'/'partial' answers  

---

## STEP 5 — ASSESSMENT QUESTIONS (all 45)

**Section 1: Organization Profile** (questions Q1–Q5, informational only — no scoring)

Q1: Company legal name (text input)  
Q2: Industry sector (dropdown — use INDUSTRY_SECTORS from constants.ts)  
Q3: Annual revenue range (dropdown: <10Cr / 10-50Cr / 50-200Cr / 200-500Cr / 500Cr+)  
Q4: Estimated personal data records processed (dropdown: <1,000 / 1K-10K / 10K-100K / 100K-1M / 1M+)  
Q5: Number of employees with access to personal data (dropdown: 1-5 / 6-20 / 21-100 / 100+)  

**Section 2: Data Fiduciary Assessment** (Q6–Q13, 2 pts each = 16 pts)

Q6: Do you collect personal data directly from users/customers?  
Q7: Do you use personal data for automated decision-making that affects individuals?  
Q8: Could you be classified as a Significant Data Fiduciary (large-scale processing, sensitive data, high-risk AI)?  
Q9: Do you process personal data of children (under 18)?  
Q10: Do you transfer personal data outside India?  
Q11: Do you operate a platform where third parties offer goods/services to your users?  
Q12: Do you use AI or ML models trained on personal data of your users?  
Q13: Do you employ third-party data processors who handle personal data on your behalf?  

**Section 3: Consent Practices** (Q14–Q19, 3 pts each = 18 pts)

Q14: How do you currently obtain consent for data collection? (yes=mechanism documented/yes, partial=informal, no=no consent)  
Q15: Is your consent request specific to each individual processing purpose (not bundled)?  
Q16: Can users withdraw consent easily, at any time, without detriment?  
Q17: Do you maintain records of all consents obtained (what was consented to, when, by whom)?  
Q18: Is your consent request available in the language(s) your users understand?  
Q19: For users who may be under 18, do you obtain verifiable parental consent before processing?  

**Section 4: Privacy Notice** (Q20–Q23, 3 pts each = 12 pts)

Q20: Do you have a published Privacy Notice or Privacy Policy?  
Q21: Does your notice clearly state the purposes for which data is processed?  
Q22: Does your notice inform users of all 7 rights they have under the DPDP Act?  
Q23: Is your privacy notice available in the languages your users understand?  

**Section 5: User Rights** (Q24–Q29, 3 pts each = 18 pts)

Q24: Have you designated a Grievance Officer for DPDP compliance?  
Q25: Is the Grievance Officer's name and contact information publicly available?  
Q26: Can users submit requests to access the personal data you hold about them?  
Q27: Can users submit requests to correct inaccurate personal data?  
Q28: Can users submit requests to erase their personal data?  
Q29: Can users nominate someone to exercise their DPDP rights on their behalf (e.g., in case of death or incapacity)?  

**Section 6: Data Security** (Q30–Q35, 3 pts each = 18 pts)

Q30: Is personal data encrypted at rest (in databases and file storage)?  
Q31: Is all data transmission encrypted (HTTPS/TLS 1.2+)?  
Q32: Is access to personal data restricted to authorized personnel only (role-based access)?  
Q33: Do you maintain access logs showing who accessed personal data and when?  
Q34: When was your last security assessment, penetration test, or vulnerability scan? (yes=within 12 months, partial=1-3 years ago, no=never/unknown)  
Q35: Do you have a documented data retention policy specifying how long each type of data is kept?  

**Section 7: Breach Preparedness** (Q36–Q40, 3 pts each = 15 pts)

Q36: Do you have a documented personal data breach incident response procedure?  
Q37: Does your breach procedure include notifying the Data Protection Board of India (DPBI) within 72 hours of becoming aware of a breach?  
Q38: Have you experienced any personal data breaches in the last 24 months? (yes=breach but handled, partial=minor incident, no=no breach — score this: no breach=full pts, handled breach=half, unhandled=0)  
Q39: Do you maintain a breach register documenting all incidents and their resolution?  
Q40: Have you tested your breach response procedure within the last 12 months?  

**Section 8: Vendor Management** (Q41–Q45, 3 pts each = 15 pts)

Q41: Do you share personal data with any third-party vendors, SaaS tools, or processors?  
Q42: Do you have Data Processing Agreements (DPAs) with all vendors who handle personal data?  
Q43: Do you assess a vendor's DPDP/data protection posture before onboarding them?  
Q44: Do your vendor contracts require them to notify you of breaches within 6 hours?  
Q45: Do you maintain an up-to-date list of all vendors who process personal data on your behalf?  

---

## STEP 6 — GAP GENERATION RULES

For every question answered 'no' or 'partial', generate a gap record. Use this mapping:

```typescript
const GAP_MAP: Record<string, {
  gap_description: string
  priority: 'p0' | 'p1' | 'p2' | 'p3'
  dpdp_section: string
  recommended_action: string
  module_to_fix: string
}> = {
  Q14: {
    gap_description: 'No documented consent mechanism',
    priority: 'p0',
    dpdp_section: 'Section 6',
    recommended_action: 'Deploy TrustStack Consent Widget with DPDP-compliant consent flow',
    module_to_fix: 'M2: Consent Management'
  },
  Q20: {
    gap_description: 'No Privacy Notice published',
    priority: 'p0',
    dpdp_section: 'Section 5',
    recommended_action: 'Use TrustStack Privacy Notice Builder to generate and publish your notice',
    module_to_fix: 'M3: Privacy Notice'
  },
  Q24: {
    gap_description: 'No Grievance Officer appointed',
    priority: 'p0',
    dpdp_section: 'Section 14',
    recommended_action: 'Appoint a Grievance Officer in TrustStack and publish their contact',
    module_to_fix: 'M4: Grievance Officer Portal'
  },
  // ... (generate sensible gap descriptions for all 45 questions)
}
```

---

## STEP 7 — UX FLOW

```
/login  →  /signup  →  /create-organization  →  /dashboard/overview

/dashboard/overview
  → Shows current Compass Score (0 if no assessment yet)
  → "Start Your DPDP Compass Assessment" CTA if no assessment

/dashboard/assessment
  → List of past assessments with scores
  → "Start New Assessment" button

/dashboard/assessment/[id]
  → Step-by-step: show one section at a time
  → Progress bar (Section 1 of 8)
  → Auto-save each answer on change (debounced POST to /api/assessment/save-answer)
  → "Continue" button to next section
  → "Submit Assessment" button on last section

/dashboard/assessment/results/[id]
  → Compass Score gauge (animated on load)
  → Maturity level badge
  → Risk tier chip
  → Gap report: sorted by priority (P0 first)
  → Each gap: description + DPDP section + recommended action + which module fixes it
  → "Download PDF Report" button (Phase 1 feature — show as coming soon for now)
  → CTA cards for each unfixed gap linking to the relevant module
```

---

## STEP 8 — ACCEPTANCE CRITERIA

Before marking this session complete, verify all of these:

- [ ] `npm run dev` starts without errors
- [ ] `npm run type-check` passes (no TypeScript errors)
- [ ] New user can sign up at `/signup`
- [ ] After signup, user is prompted to create organization
- [ ] After org creation, user lands on `/dashboard/overview`
- [ ] Dashboard sidebar shows all module links (most marked "Coming Soon")
- [ ] User can start a new assessment at `/dashboard/assessment`
- [ ] All 45 questions render correctly across 8 sections
- [ ] Answers auto-save (check Supabase table after answering)
- [ ] Submitting the assessment computes a score and redirects to results
- [ ] Results page shows Compass Score, maturity level, and gap report
- [ ] Gap report is sorted P0 → P1 → P2 → P3
- [ ] RLS works: user cannot see another organization's assessments (test by creating two accounts)

---

## STEP 9 — UPDATE PROGRESS.MD WHEN DONE

At the end of this session, update `implementation/progress.md`:
1. Mark M1 as ✅ Complete
2. Mark infrastructure items as complete
3. List all files created
4. Add any key decisions or notes
5. Update the "Session 1 Notes" section
