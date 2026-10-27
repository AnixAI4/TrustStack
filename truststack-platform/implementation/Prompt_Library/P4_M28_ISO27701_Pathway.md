# P4 — M28: ISO 27701 Pathway
## Guided certification pathway for Privacy Information Management System

**Session:** P4 — M28  
**Phase:** P4 — Innovation  
**Priority:** MEDIUM — enterprise-grade certification; ₹50K+ ACV add-on  
**Estimated time:** 1 session (~2.5 hours)  
**Branch:** `feature/p4-m28-iso27701-pathway`  
**Tag after completion:** `v4.3.0`  
**Prerequisites:** M1 (Compass), M6 (ROPA), M7 (Vendor) live — evidence is pulled from these

---

## READ FIRST
Read: `implementation/MASTER_CONTEXT.md` + `implementation/progress.md`

---

## What to Build

A structured ISO 27701 (PIMS) gap assessment tool + evidence collector. Organizations map their TrustStack™ compliance data to ISO 27701 controls and generate an audit-ready evidence pack for their ISO certification auditor.

**Note:** TrustStack™ doesn't issue ISO certifications — only accredited certification bodies do. TrustStack™ helps organizations PREPARE for the audit.

---

## Database Schema

```sql
-- ISO 27701 controls (global — not per org)
CREATE TABLE iso27701_controls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  control_id TEXT UNIQUE NOT NULL,          -- '6.2.1' | '7.2.4' | '8.4.1'
  section TEXT NOT NULL,                    -- 'Privacy policies' | 'Data retention'
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  mapped_modules TEXT[] DEFAULT '{}',       -- ['m1', 'm2', 'm6'] — which TrustStack modules cover this
  iso_reference TEXT NOT NULL,              -- Official ISO 27001 clause reference
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- Per-org control assessment
CREATE TABLE iso27701_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  control_id UUID NOT NULL REFERENCES iso27701_controls(id),
  status TEXT NOT NULL DEFAULT 'not_assessed', -- 'not_assessed' | 'not_applicable' | 'partial' | 'implemented'
  evidence_links TEXT[] DEFAULT '{}',           -- URLs or descriptions of evidence
  notes TEXT,
  assessed_by UUID REFERENCES auth.users(id),
  assessed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, control_id)
);

ALTER TABLE iso27701_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_members_manage_iso_assessments" ON iso27701_assessments
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  );
```

---

## V1 Control Set (seed data)

ISO 27701 has 76 controls across 9 sections. For V1, implement the 30 most critical:

**Section 5 (PIMS-specific requirements):**
- 5.2: Information security policies for privacy
- 5.3: Roles and responsibilities
- 5.6: Privacy by design

**Section 6 (Privacy controls for PII controllers):**
- 6.2: Conditions for collection and processing
- 6.3: Obligations to PII principals
- 6.4: Privacy notice
- 6.5: Choice and consent
- 6.6: Access, correction, deletion rights

**Section 7 (Privacy controls for PII processors):**
- 7.2: Conditions for collection and processing
- 7.3: Privacy notice to PII principals
- 7.5: Sub-processor agreements (vendor management)

Seed all 76 controls from the ISO standard text. Store in `iso27701_controls` (read-only, updated by Anix AI admin).

---

## Auto-Evidence Mapping

For controls mapped to TrustStack™ modules, auto-populate evidence:

```typescript
// src/lib/iso27701/evidence-mapper.ts
export async function autoPopulateEvidence(orgId: string): Promise<void> {
  // For control 6.4 (Privacy notice): evidence = published privacy notices
  const notices = await getPublishedNotices(orgId);
  if (notices.length > 0) {
    await updateControlStatus(orgId, '6.4', 'implemented', 
      notices.map(n => `Privacy notice "${n.title}" published ${n.published_at}`));
  }
  
  // For control 6.5 (Consent management): evidence = consent configs + records
  const consentCount = await getConsentRecordCount(orgId);
  if (consentCount > 0) {
    await updateControlStatus(orgId, '6.5', 'implemented',
      [`${consentCount} consent records managed in TrustStack™ Consent Management`]);
  }
  
  // For control 6.3 (DSR rights): evidence = DSR requests processed
  // For control 7.5 (Sub-processors): evidence = vendor DPAs in M7
  // ... etc. for all mapped controls
}
```

Run this auto-mapping when the org accesses the ISO 27701 pathway for the first time.

---

## UI: `/dashboard/iso27701`

```
ISO 27701 Certification Pathway
─────────────────────────────────────────────────────────────────
Readiness Score: 47 / 76 controls assessed
Implemented: 32 (42%)   Partial: 8 (11%)   Not yet: 36 (47%)

[Download Evidence Pack (PDF)]    [Schedule Audit Consultation]

─────────────────────────────────────────────────────────────────
Section 6: PII Controller Requirements
────────────────────────────────────────────────────────────────
6.2.1  Identify and document the purpose   ✅ Implemented
       Evidence: ROPA with 12 active entries
       [View Evidence]

6.3.2  Obligation to provide mechanism     ✅ Implemented  
       for DSR requests
       Evidence: 47 DSR requests processed in TrustStack™

6.4.1  Provide privacy information         ✅ Implemented
       to PII principals
       Evidence: "Website Privacy Policy" published Jun 2026

6.5.1  Consent for use of PII              ⚠️ Partial
       Evidence: Consent collected via web widget, but WhatsApp 
       consent not yet documented in ROPA
       [Update Assessment]   [Add Notes]

6.6.3  Deletion of PII                     🔲 Not yet assessed
       Evidence: No evidence yet
       [Mark Status ▼]   [Add Evidence]

─────────────────────────────────────────────────────────────────
Section 7: PII Processor Requirements
...
```

### Evidence Pack PDF

Generated by Claude AI — summarizes all "Implemented" controls with their evidence. Formatted as an ISO 27701 evidence dossier for the auditor.

---

## Testing

1. `/dashboard/iso27701` → 76 controls listed
2. Auto-mapping runs → controls with TrustStack™ evidence auto-populated
3. Manually mark a control as "Not Applicable" + add notes → saved
4. Readiness score updates as controls are assessed
5. Download Evidence Pack PDF → shows all implemented controls with evidence
6. `npm run type-check` → 0 errors; `npm audit` → 0 vulnerabilities

---

## After Completion

1. Update `progress.md` — M28 ISO 27701 ✅ Complete
2. Update `MASTER_CONTEXT.md` — add M28 section
3. Update `tracker-data.json` — M28 status → "built"
4. Apply SQL: iso27701_controls + iso27701_assessments tables + seed data
5. Git commit + push + PR + merge + tag `v4.3.0`
