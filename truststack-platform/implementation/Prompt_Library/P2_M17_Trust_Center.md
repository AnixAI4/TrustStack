# P2 — M17: Trust Center (Public Compliance Page)
## Per-organization public page showing DPDP compliance status

**Session:** P2 — M17  
**Phase:** P2 — Commercialization  
**Priority:** HIGH — only DPDP platform with a public trust page; key differentiator  
**Estimated time:** 1 session (~2.5 hours)  
**Branch:** `feature/p2-m17-trust-center`  
**Tag after completion:** `v2.7.0`  
**Prerequisites:** M1 (Compass Score), M2 (Consent), M3 (Privacy Notice), M4 (Grievance) all live

---

## READ FIRST
Read: `implementation/MASTER_CONTEXT.md` + `implementation/progress.md`

---

## What to Build

A public-facing compliance page for each organization. Data principals can visit this page to:
- See the organization's DPDP compliance posture
- Access their privacy notices
- Submit a DSR request
- File a grievance
- Update their consent preferences
- See if there have been any disclosed breaches

**URL:** `https://truststack.in/trust/[org-slug]`  
**No authentication required.** Uses admin Supabase client.

---

## Database Changes

```sql
-- Add trust center settings to organizations table
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS trust_center_enabled BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS trust_center_show_compass_score BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS trust_center_show_breach_disclosure BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS trust_center_custom_logo_url TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS trust_center_contact_email TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS trust_center_tagline TEXT;
```

---

## API Route

### GET `/api/trust/[slug]` (PUBLIC)
**Returns all data the Trust Center page needs.**

```typescript
// Use adminSupabase (no user session)
// 1. Fetch org by slug (organizations.slug)
//    → 404 if not found or trust_center_enabled = false
// 2. Fetch: 
//    - Current Compass Score (latest assessment result)
//    - Active privacy notices (title, slug, last_published_at)
//    - Grievance officer public contact (M4: org name, contact email, process description)
//    - Active consent configs (names only — no embed keys)
//    - Disclosed breaches (only where breach_incidents.publicly_disclosed = true)
//    - Trust Center settings from organizations table
// 3. Return: TrustCenterData object
// CORS: Add OPTIONS handler + appropriate headers
```

---

## Public Page: `/trust/[slug]/page.tsx`

```
┌─────────────────────────────────────────────────────────────┐
│  🔒  [Org Logo]  Acme Corp                                  │
│  Your Data Privacy Hub                                       │
│  "We take your privacy seriously."                           │
│                                                              │
│  DPDP Compliance Score                                       │
│  ████████░░  72 / 100   Maturity Level 3                    │
│  Last assessed: Jun 2026                                     │
│                                                              │
│  ✅ Consent Management Active                               │
│  ✅ DSR Processing Active (30-day SLA)                      │
│  ✅ Grievance Officer Designated                            │
│  ✅ Privacy Notice Published                                │
│  ✅ ROPA Maintained                                         │
└─────────────────────────────────────────────────────────────┘

Privacy Notices                                [View All →]
─────────────────────────────────────────────────────────────
• Website Privacy Policy      Updated Jun 2026   [View →]
• Cookie Policy               Updated May 2026   [View →]

Your Rights Under DPDP Act
─────────────────────────────────────────────────────────────
  [Request Your Data (DSR)]   [Update Consent]   [File Grievance]

Contact Us
─────────────────────────────────────────────────────────────
For privacy concerns: privacy@acmecorp.com
Grievance Officer: Ravi Sharma, DPO

Data Breach Disclosures     (shown only if trust_center_show_breach_disclosure=true)
─────────────────────────────────────────────────────────────
  No disclosures at this time.

────────────────────────────────────────────────────────────
Verified by TrustStack™ | India's DPDP Compliance Platform
```

---

## Page Components

```
src/app/(public)/trust/[slug]/
  page.tsx                  ← Server component, fetches /api/trust/[slug]
  not-found.tsx             ← If org not found or trust center disabled

src/components/modules/trust-center/
  TrustScoreBadge.tsx       ← Score + maturity level display
  ComplianceChecklist.tsx   ← ✅/⚠️ per module
  PrivacyNoticeList.tsx     ← Active notices
  DataPrincipalActions.tsx  ← DSR, Consent, Grievance action cards
  BreachDisclosures.tsx     ← Only shown if enabled
```

---

## Trust Center Admin Settings

Add a "Trust Center" tab in `/dashboard/settings`:

```
Trust Center Settings
─────────────────────────────────────────────────────────────
Public URL: https://truststack.in/trust/acme-corp  [Copy]

☑ Enable Trust Center (your page is public)
☑ Show Compass Score
☐ Show Breach Disclosures

Custom Tagline: _________________________
Contact Email: _________________________

[Save Settings]
```

---

## Embeddable Badge (preview of M22 Compliance Badge)

At the bottom of Trust Center settings, show the embed code:

```html
<a href="https://truststack.in/trust/acme-corp">
  <img src="https://truststack.in/badge/acme-corp.svg" alt="DPDP Compliant - TrustStack™" />
</a>
```

The badge SVG endpoint: `GET /api/badge/[slug]` — returns an SVG dynamically generated based on current Compass Score. Fast response (< 200ms), cached 1 hour.

---

## SEO

The Trust Center page should be indexable:
```typescript
// src/app/(public)/trust/[slug]/page.tsx
export async function generateMetadata({ params }) {
  const trustData = await getTrustCenterData(params.slug);
  return {
    title: `${trustData.orgName} — DPDP Privacy Hub | TrustStack™`,
    description: `${trustData.orgName} is DPDP compliant. View privacy notices, your data rights, and compliance status.`,
    openGraph: { title: ..., description: ..., type: 'website' },
  };
}
```

---

## Testing

1. Visit `/trust/acme-corp` unauthenticated → loads with org data
2. Compass Score shows correctly
3. "Request Your Data" → links to DSR public form (/public/dsr/[slug])
4. "File Grievance" → links to grievance public form (/public/grievance/[slug])
5. Privacy notice link → loads the notice
6. Disable Trust Center in settings → `/trust/acme-corp` → returns 404
7. `npm run type-check` → 0 errors
8. Check CORS headers on `/api/trust/[slug]` (needed for embeds)

---

## After Completion

1. Update `progress.md` — M17 Trust Center ✅ Complete
2. Update `MASTER_CONTEXT.md` — add M17 section
3. Update `tracker-data.json` — M17 status → "built"
4. Apply SQL: alter organizations table (new columns)
5. Git commit + push + PR + merge + tag `v2.7.0`
