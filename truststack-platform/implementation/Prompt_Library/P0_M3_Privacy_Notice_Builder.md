# SESSION PROMPT — P0 M3: Privacy Notice Builder
## TrustStack™ Platform — Phase 0, Module 3

---

## STEP 1 — READ THESE FILES FIRST

```
implementation/MASTER_CONTEXT.md
implementation/progress.md
```

**M4 (Grievance Officer Portal) must be complete before this session.** The Privacy Notice Builder pulls the Grievance Officer's name and contact into the generated notice.

---

## STEP 2 — PREREQUISITES

Verify:
- [ ] M1 complete (auth + dashboard shell)
- [ ] M4 complete (`grievance_officers` table exists, officer can be appointed)
- [ ] `organizations` table has `industry`, `name` columns
- [ ] M2 Consent Management complete (`consent_config_versions` exists — reference pattern for notice versioning)

---

## ⚠️ IMPLEMENTATION NOTES — read before building (synced after Sessions 2 & 3)

**1. Dashboard is a PLAIN folder, not a route group.** Use `src/app/dashboard/privacy-notice/...` — NOT `src/app/(dashboard)/...`. A `(dashboard)` route group does not add a `/dashboard` URL segment, so pages would land at `/privacy-notice` and bypass the auth middleware that protects `/dashboard/*`. (This exact bug was caught in M2.)

**2. Dev server runs on port 3011.** Docker occupies port 3000, so always start with `npm run dev -- --port 3011`. `NEXT_PUBLIC_APP_URL` is already `http://localhost:3011`.

**3. Public routes need explicit handling.** The public notice API (`GET /api/privacy-notice/[slug]`) must be added to `PUBLIC_API_ROUTES` in `src/middleware.ts`. The public page `/public/[slug]` is already non-protected (same as `/public/grievance/[slug]`). Any public route that reads data with no user session must use the **admin client** (`src/lib/supabase/admin.ts`, service role — bypasses RLS) OR rely on the "public can read published" RLS policy. Add `Access-Control-Allow-Origin` + an `OPTIONS` handler if the route will be hit cross-origin.

**4. Version-snapshot pattern — working reference exists.** `privacy_notice_versions` is an immutable per-version snapshot, exactly like `consent_config_versions` built in M2 (Session 3). Mirror it: write a new snapshot row on each publish, never mutate old ones, and surface a Version History view. Reference files: `src/components/modules/consent/VersionHistory.tsx`, `src/app/api/consent/versions/route.ts`, `src/app/api/consent/manage/route.ts` (snapshot-on-save), and `db/consent_config_versions.sql`.

**5. SQL migrations live in `db/` and run manually in the Supabase SQL Editor.** Save this module's SQL as `db/privacy_notices.sql` for the record, then paste it into Supabase. Provide it in-chat for copy-paste. Note: Supabase flags any `DROP` as "destructive" — `DROP POLICY IF EXISTS` before `CREATE POLICY` is safe and makes the script idempotent.

**6. AI model:** use the project's current model id from MASTER_CONTEXT (`claude-sonnet-4-6`) via the existing `@anthropic-ai/sdk` setup used by `src/app/api/chat/route.ts`.

---

## STEP 3 — SUPABASE SQL

```sql
CREATE TABLE privacy_notices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  current_version_id UUID,
  slug TEXT UNIQUE NOT NULL,
  published BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE privacy_notice_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notice_id UUID REFERENCES privacy_notices(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL DEFAULT 1,
  content_en TEXT NOT NULL,
  content_hi TEXT,
  content_ta TEXT,
  content_te TEXT,
  content_mr TEXT,
  grievance_officer_name TEXT NOT NULL,
  grievance_officer_email TEXT NOT NULL,
  grievance_officer_phone TEXT,
  change_summary TEXT,
  published_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE privacy_notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE privacy_notice_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org members manage privacy_notices" ON privacy_notices FOR ALL
  USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));

CREATE POLICY "org members manage notice_versions" ON privacy_notice_versions FOR ALL
  USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));

-- Public read for published notices
CREATE POLICY "public can read published notices" ON privacy_notices FOR SELECT
  USING (published = TRUE);

CREATE POLICY "public can read published versions" ON privacy_notice_versions FOR SELECT
  USING (notice_id IN (SELECT id FROM privacy_notices WHERE published = TRUE));
```

---

## STEP 4 — FILES TO CREATE

### Dashboard Pages

**`src/app/dashboard/privacy-notice/page.tsx`**  
Privacy Notice home:
- Current published notice status (Published / Draft / Not Created)
- "View Public Notice" link → `/public/[org-slug]`
- Version history: table of past versions with date + summary
- "Create New Version" button
- "Edit Current Draft" button (if unpublished draft exists)
- Compliance check: warns if notice is older than 12 months

**`src/app/dashboard/privacy-notice/builder/page.tsx`**  
Step-by-step notice builder (wizard):

```
Step 1: Company Details
  - Legal name (auto-filled from org profile)
  - Registered address
  - CIN (auto-filled from org profile)
  - Data Fiduciary contact email

Step 2: Data You Collect
  - Multi-select from standard Indian data categories:
    [ ] Name and contact details
    [ ] Email address
    [ ] Phone number
    [ ] Physical address
    [ ] Date of birth
    [ ] Government ID (Aadhaar, PAN, Voter ID, Passport)
    [ ] Financial data (bank account, UPI, card)
    [ ] Transaction / purchase history
    [ ] Location data (real-time or historical)
    [ ] Device and usage data (IP, browser, cookies)
    [ ] Health and medical data
    [ ] Biometric data
    [ ] Children's personal data
    [ ] Professional information
    [ ] Social media profiles
    [ ] Other (specify text field)

Step 3: Processing Purposes
  - For each data category selected above, assign processing purposes
  - Each purpose: name + DPDP legal basis (consent_s6 / section 7 grounds)
  - Suggest purposes based on org industry (use constants for this)

Step 4: Data Sharing
  - Which categories of third parties do you share data with?
    [ ] Cloud/hosting providers
    [ ] Payment processors
    [ ] Analytics providers
    [ ] Marketing/advertising tools
    [ ] Customer support tools
    [ ] HR/payroll providers
    [ ] Other vendors
  - Cross-border transfers? (Yes/No → if yes, which countries)

Step 5: Data Retention
  - Per-category retention period:
    e.g. Customer data: 3 years after last transaction
    e.g. Website logs: 90 days

Step 6: Grievance Officer
  - Auto-fill from M4: Grievance Officer name, designation, email, phone
  - If no Grievance Officer set → redirect to M4 with warning

Step 7: Language Selection
  - Always generate English (required)
  - Select additional Indian languages (Hindi, Tamil, Telugu, Marathi — at MVP launch)
  - AI translation via Claude API for selected languages

Step 8: Preview & Publish
  - Show generated notice in English (preview)
  - "Publish Notice" button → sets published=true, sets published_at
  - "Save as Draft" button
```

### Public Pages (no auth)

**`src/app/public/[slug]/page.tsx`**  
Public privacy notice page. Anyone can view this.
- Shows organization name + logo (if uploaded)
- Shows current published privacy notice
- Language toggle (if multiple languages available)
- "Contact Grievance Officer" link
- "Last updated: [date]" footer
- Canonical URL for linking from client's website footer
- No auth required

### API Routes

**`src/app/api/privacy-notice/generate/route.ts`**  
- `POST` (auth required)
- Body: `{ data_categories, purposes, sharing, retention, languages[] }`
- Calls Claude API to generate a DPDP-compliant privacy notice in English
- Returns: `{ content_en: string }`
- The generated notice must include:
  - All 7 DPDP rights explained in plain language
  - Grievance Officer contact
  - How to withdraw consent
  - How to submit access/erasure requests
  - Breach notification process
  - Data retention summary
  - DPDP Act 2023 reference

**`src/app/api/privacy-notice/translate/route.ts`**  
- `POST` (auth required)
- Body: `{ content_en: string, target_language: string }`
- Calls Claude API to translate the English notice
- Returns: `{ translated_content: string }`

**`src/app/api/privacy-notice/publish/route.ts`**  
- `POST` (auth required)
- Body: `{ version_id: string }`
- Sets `published_at` on the version
- Updates `privacy_notices.current_version_id`
- Sets `privacy_notices.published = true`
- If this is not the first version, records `change_summary`

**`src/app/api/privacy-notice/[slug]/route.ts`**  
- `GET` — Public, no auth
- Returns the current published notice for an org slug
- Returns: `{ notice, current_version, organization_name }`

### Components

**`src/components/modules/privacy-notice/NoticeBuilder.tsx`**  
Multi-step wizard shell with step indicator.

**`src/components/modules/privacy-notice/DataCategorySelector.tsx`**  
Checkbox grid for selecting data categories. Groups them: Identity / Contact / Financial / Sensitive / Technical.

**`src/components/modules/privacy-notice/PurposeMapper.tsx`**  
For each selected data category, a row with purpose text + DPDP basis selector.

**`src/components/modules/privacy-notice/NoticePreview.tsx`**  
Renders the generated notice as formatted HTML. Language toggle if translations available.

**`src/components/modules/privacy-notice/LanguageSelector.tsx`**  
Multi-select for languages with native language names displayed.

**`src/components/modules/privacy-notice/VersionHistory.tsx`**  
Table of past notice versions with dates and change summaries.

---

## STEP 5 — CLAUDE PROMPT FOR NOTICE GENERATION

Use this exact system prompt when calling Claude API to generate the notice:

```typescript
const NOTICE_GENERATION_PROMPT = `You are a DPDP (Digital Personal Data Protection Act 2023, India) compliance expert. 
Generate a comprehensive, legally compliant Privacy Notice for an Indian company.

The notice MUST include:
1. Identity and contact details of the Data Fiduciary
2. Categories of personal data collected (from the provided list)
3. Purposes of processing for each data category
4. Legal basis for each processing purpose (Section 6 consent or Section 7 legitimate uses)
5. Categories of recipients (third parties the data is shared with)
6. Cross-border transfer details (if applicable)
7. Data retention periods
8. All 7 rights of Data Principals under DPDP:
   - Right to Access Information (Section 11)
   - Right to Correction (Section 12(a))
   - Right to Completeness (Section 12(b))
   - Right to Erasure (Section 12(c))
   - Right to Restrict Processing (Section 13)
   - Right to Grievance Redressal (Section 14)
   - Right to Nominate (Section 15)
9. How to exercise each right (contact the Grievance Officer)
10. Grievance Officer name, designation, email, and phone
11. How to withdraw consent
12. Breach notification commitment
13. Reference to DPDP Act 2023

Write in clear, simple language (avoid legal jargon). The notice should be readable by a person with 10th-grade education.
Use proper headings and numbered sections.
Output in Markdown format.`
```

---

## STEP 6 — INDUSTRY-SPECIFIC PURPOSE SUGGESTIONS

When Step 3 loads, pre-suggest purposes based on org industry:

```typescript
const INDUSTRY_PURPOSES: Record<string, Array<{data_category: string, purpose: string, basis: string}>> = {
  fintech: [
    { data_category: 'government_id', purpose: 'KYC verification as required by RBI', basis: 's7_legal' },
    { data_category: 'financial_data', purpose: 'Processing payments and transactions', basis: 'consent_s6' },
    { data_category: 'name_contact', purpose: 'Account creation and customer support', basis: 'consent_s6' },
  ],
  edtech: [
    { data_category: 'name_contact', purpose: 'Student enrollment and course access', basis: 'consent_s6' },
    { data_category: 'children_data', purpose: 'Providing educational services to minors', basis: 'consent_s6' },  // parental consent required
    { data_category: 'device_usage', purpose: 'Improving learning experience via analytics', basis: 'consent_s6' },
  ],
  ecommerce: [
    { data_category: 'name_contact', purpose: 'Order fulfillment and delivery', basis: 'consent_s6' },
    { data_category: 'financial_data', purpose: 'Payment processing', basis: 'consent_s6' },
    { data_category: 'location_data', purpose: 'Delivery address verification', basis: 'consent_s6' },
    { data_category: 'transaction_history', purpose: 'Personalized product recommendations', basis: 'consent_s6' },
  ],
  // ... add other industries
}
```

---

## STEP 7 — COMPLIANCE VALIDATION BEFORE PUBLISH

Before allowing publish, run these checks:

```typescript
function validateNotice(version: PrivacyNoticeVersion): string[] {
  const errors: string[] = []
  
  if (!version.grievance_officer_name) errors.push('Grievance Officer not set')
  if (!version.grievance_officer_email) errors.push('Grievance Officer email required')
  if (!version.content_en?.includes('Section 11')) errors.push('Notice missing rights section')
  if (!version.content_en?.includes('withdraw')) errors.push('Notice missing withdrawal instructions')
  if (!version.content_en?.includes('72')) errors.push('Notice should mention breach notification timeline')
  
  return errors
}
```

Show errors as a checklist before enabling the Publish button.

---

## STEP 8 — PUBLIC NOTICE PAGE DESIGN

The `/public/[slug]` page should look professional — this is what regulators and customers see:
- Organization name at the top
- Last updated date
- Clean typography (readable, good line height)
- Language switcher if multiple languages available
- Sticky table of contents for long notices
- "Download as PDF" button (use browser print-to-PDF or a simple approach)
- Contact Grievance Officer button (opens mailto: link)
- Footer: "Privacy Notice generated by TrustStack™"

---

## STEP 9 — ACCEPTANCE CRITERIA

- [ ] `npm run type-check` passes
- [ ] Builder wizard completes all 8 steps
- [ ] Claude API generates a valid DPDP notice from the form data
- [ ] Notice is saved to `privacy_notice_versions` table
- [ ] Publishing sets `published=true` and `published_at` timestamp
- [ ] Public page at `/public/[org-slug]` shows notice without authentication
- [ ] Grievance Officer details appear in the generated notice
- [ ] Language translation works (at least English → Hindi)
- [ ] Compliance validation prevents publish if Grievance Officer not set
- [ ] Version history shows previous versions
- [ ] RLS: org members can only see their own notices

---

## STEP 10 — UPDATE PROGRESS.MD WHEN DONE
