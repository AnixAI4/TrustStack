# P3 — M20: Sector Packs
## Industry-specific DPDP compliance templates for 6 verticals

**Session:** P3 — M20  
**Phase:** P3 — Scale  
**Priority:** HIGH — sector-specific templates lock in verticals; highest ACV customer retention driver  
**Estimated time:** 1 session (~3 hours)  
**Branch:** `feature/p3-m20-sector-packs`  
**Tag after completion:** `v3.1.0`  
**Prerequisites:** All P2 complete (v2.10.0 tagged); M6 ROPA + M1 Compass live

---

## READ FIRST
Read: `implementation/MASTER_CONTEXT.md` + `implementation/progress.md` + `implementation/Implementation_Planner/04_Phase_P3_Scale.md`

---

## What to Build

Six sector-specific compliance packs, each containing pre-built templates for the most common DPDP compliance tasks in that industry. Organizations select a sector pack during onboarding (or from settings) and instantly get pre-filled ROPA entries, industry-specific assessment questions, and sector-appropriate consent templates.

**Sectors:** Healthcare | Financial Services | ITES/SaaS | E-commerce/Retail | Education | Manufacturing

---

## Database Schema

```sql
CREATE TABLE sector_packs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sector_key TEXT UNIQUE NOT NULL,          -- 'healthcare' | 'finance' | 'ites' | 'ecommerce' | 'education' | 'manufacturing'
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  primary_regulator TEXT,                   -- 'SEBI' | 'IRDAI' | 'RBI' | 'NABH' | 'AICTE' | null
  version TEXT NOT NULL DEFAULT '1.0',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE sector_pack_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pack_id UUID NOT NULL REFERENCES sector_packs(id) ON DELETE CASCADE,
  template_type TEXT NOT NULL,              -- 'ropa_entry' | 'assessment_questions' | 'consent_template' | 'vendor_checklist'
  title TEXT NOT NULL,
  content JSONB NOT NULL,                  -- Template-specific content
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Track which pack an org has applied:
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS sector_pack_key TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS sector_pack_applied_at TIMESTAMPTZ;

-- No new RLS needed — sector_packs and templates are read-only (no per-org data)
```

---

## Pre-Built Content (V1)

For each sector, create a minimum of:
- **3 ROPA entry templates** (most common processing activities)
- **5 industry-specific assessment questions** (on top of M1's 45 core)
- **2 consent templates** (sector-appropriate language)

### Example: Healthcare Sector Pack

**ROPA Templates:**
1. "Patient Medical Records Processing" — Purpose: Healthcare delivery, Legal basis: Vital interests + Consent, Retention: 7 years (as per NABH)
2. "Diagnostic Test Reports" — Purpose: Diagnostic services, Retention: 3 years
3. "Telemedicine Consultation Records" — Purpose: Remote healthcare delivery

**Assessment Questions:**
1. Do you process health data (diagnoses, prescriptions, test reports)?
2. Do you share patient data with third-party labs or diagnostic centers?
3. Are your medical record systems ISO 15489 compliant?
4. Do data principals have access to their complete medical history?
5. Is health data stored separately from other personal data?

**Consent Templates:**
1. "Healthcare Services Consent" — includes: medical record creation, emergency contact sharing, telemedicine recording
2. "Research and Analytics Consent" — for anonymized patient data research

---

## API Routes

### GET `/api/sector-packs` (PUBLIC — no auth needed for listing)
**Returns:** All active sector packs with metadata

### GET `/api/sector-packs/[sectorKey]` (PUBLIC)
**Returns:** Full pack content including all templates

### POST `/api/sector-packs/apply` (AUTH — admin only)
**Body:** `{ sector_key: string }`
**Flow:**
1. Check feature gate: `checkFeatureAccess(org.id, 'm20_sector_packs')`
2. Load sector pack templates
3. For each ROPA template: create a draft `ropa_entries` record for the org
4. Store sector-specific assessment questions in org's assessment config
5. Update `organizations.sector_pack_key` + `sector_pack_applied_at`
6. Return: `{ ropa_entries_created, questions_added }`

### GET `/api/sector-packs/assessment-questions/[orgId]`
**Returns:** Sector-specific questions for this org's assessment (called by M1 assessment engine)

---

## UI: Sector Pack Gallery `/dashboard/sector-packs`

```
Sector Compliance Packs
─────────────────────────────────────────────────────────────────
Select your industry pack to get pre-built DPDP compliance templates.

[⚕️ Healthcare]  [💰 Financial Services]  [💻 ITES/SaaS]
Pre-built:        Pre-built:                Pre-built:
• 3 ROPA entries  • 4 ROPA entries          • 3 ROPA entries
• 5 Qs            • 6 Qs                    • 4 Qs
• 2 consent tpls  • 3 consent tpls          • 2 consent tpls
[Apply Pack →]    [Apply Pack →]            [Apply Pack →]

[🛒 E-commerce]  [🎓 Education]  [🏭 Manufacturing]
...

─────────────────────────────────────────────────────────────────
ℹ️ Applying a pack will pre-fill your ROPA with common processing activities.
You can edit or delete them at any time.
```

After applying:
```
✅ Healthcare Pack Applied

3 ROPA entries created (review in ROPA Builder →)
5 new assessment questions added to your next Compass assessment
2 consent templates available in Consent Management

[View ROPA Entries →]  [Run Compass Assessment →]
```

---

## Sector Pack Content Database (seed SQL)

Create a seed file `db/sector_packs_seed.sql` with full content for all 6 packs:

```sql
-- Insert sector packs
INSERT INTO sector_packs (sector_key, name, description, primary_regulator, version) VALUES
('healthcare', 'Healthcare & Life Sciences', 'NABH-aligned ROPA templates and consent flows for hospitals, clinics, and diagnostic labs.', 'NABH/NHA', '1.0'),
('finance', 'Financial Services', 'RBI/SEBI/IRDAI-aligned templates for banks, NBFCs, insurance companies, and investment firms.', 'RBI/SEBI/IRDAI', '1.0'),
('ites', 'IT/Software Services', 'Templates for SaaS companies, IT service providers, and software product companies.', null, '1.0'),
('ecommerce', 'E-commerce & Retail', 'Templates for online marketplaces, D2C brands, and retail chains.', null, '1.0'),
('education', 'Education', 'AICTE-aligned templates for schools, colleges, EdTech platforms, and coaching institutes.', 'AICTE/UGC', '1.0'),
('manufacturing', 'Manufacturing', 'Templates for manufacturing companies with employee and supply chain data.', null, '1.0');

-- Insert templates for each pack (JSONB content per template)
INSERT INTO sector_pack_templates (pack_id, template_type, title, content, display_order) VALUES
((SELECT id FROM sector_packs WHERE sector_key = 'healthcare'), 'ropa_entry', 'Patient Medical Records', '{
  "purpose": "Healthcare delivery and medical record management",
  "legal_basis": "Vital interests and explicit consent",
  "data_categories": ["health_data", "identity", "contact"],
  "data_subjects": ["patients"],
  "retention_period": "7 years (NABH standard)",
  "third_party_sharing": "Laboratory services, diagnostic centers, referring doctors",
  "international_transfers": "none",
  "processing_activities": "Collection, storage, access for treatment"
}', 1),
-- ... (add all templates for all 6 sectors)
```

---

## Testing

1. `/dashboard/sector-packs` → 6 packs listed
2. Apply Healthcare pack → 3 ROPA entries created in ROPA Builder (as drafts)
3. Start new Compass Assessment → sees 5 healthcare-specific questions in addition to 45 core
4. Apply different pack → replaces existing sector data (confirm prompt: "This will update your sector-specific templates. Continue?")
5. Org on Micro plan → Apply Pack → blocked with upgrade prompt (if Micro doesn't include sector packs)
6. `npm run type-check` → 0 errors; `npm audit` → 0 vulnerabilities

---

## After Completion

1. Update `progress.md` — M20 Sector Packs ✅ Complete
2. Update `MASTER_CONTEXT.md` — add M20 section
3. Update `tracker-data.json` — M20 status → "built"
4. Apply SQL: `db/sector_packs.sql` + `db/sector_packs_seed.sql`
5. Git commit + push + PR + merge + tag `v3.1.0`
