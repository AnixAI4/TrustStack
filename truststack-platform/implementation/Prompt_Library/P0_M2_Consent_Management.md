# SESSION PROMPT — P0 M2: Consent Management
## TrustStack™ Platform — Phase 0, Module 2

> ✅ **STATUS: COMPLETE (Session 3) + enhanced.** This prompt is the original recipe. What actually shipped goes beyond it — see `progress.md` → "Session 3" and MASTER_CONTEXT → M2 for the authoritative list. Deltas vs. this prompt:
> - Widget supports **19 languages + RTL** (not just EN/HI/TA/TE) and auto-detects API base from `script.src`.
> - All 3 public routes use the **admin client + CORS + OPTIONS** (widget has no session and runs cross-origin).
> - Added a **withdraw / floating preference-center** flow and the `/api/consent/withdraw` route.
> - **Consent-rate** metric = % accepting ≥1 *non-required* purpose (not "any purpose").
> - Added **immutable config version snapshots**: table `consent_config_versions` (SQL in `db/consent_config_versions.sql`), `/api/consent/versions`, `VersionHistory.tsx`, `versions/page.tsx`; AuditTable shows a Version column. Run that SQL in addition to the 3 core tables below.

---

## STEP 1 — READ THESE FILES FIRST

```
implementation/MASTER_CONTEXT.md
implementation/progress.md
```

Read both completely before writing any code.

---

## STEP 2 — PREREQUISITES

**M1 and M4 must be complete before starting this session.**

Verify:
- [ ] User can log in and reach `/dashboard`
- [ ] `src/lib/supabase/client.ts`, `server.ts`, and `admin.ts` exist
- [ ] Dashboard sidebar exists at `src/components/dashboard/Sidebar.tsx`
- [ ] `src/lib/constants.ts` exports `SIDEBAR_MODULES` — the consent entry currently has `available: false`
- [ ] `src/app/dashboard/grievance/` exists (M4 complete)
- [ ] `src/types/dpdp.ts` has `GrievanceOfficer`, `GrievanceComplaint` types (added in M4)

**Critical path note:** Dashboard pages live at `src/app/dashboard/` — a plain folder, NOT a route group.
Do NOT use `src/app/(dashboard)/`. Route groups don't add URL segments — using one would put pages
at `/consent/` instead of `/dashboard/consent/`, bypassing the auth middleware which only protects `/dashboard/*`.

---

## STEP 3 — SUPABASE SQL (run in Supabase SQL Editor)

```sql
CREATE TABLE consent_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  widget_version TEXT NOT NULL DEFAULT '1',
  purposes JSONB NOT NULL DEFAULT '[]',
  languages TEXT[] NOT NULL DEFAULT '{en}',
  position TEXT NOT NULL DEFAULT 'bottom-bar',
  primary_color TEXT NOT NULL DEFAULT '003366',
  show_reject_all BOOLEAN NOT NULL DEFAULT TRUE,
  require_age_confirmation BOOLEAN NOT NULL DEFAULT FALSE,
  whatsapp_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  whatsapp_template_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE consent_purposes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  purpose_key TEXT NOT NULL,
  name_en TEXT NOT NULL,
  name_hi TEXT,
  name_ta TEXT,
  name_te TEXT,
  description_en TEXT NOT NULL,
  required BOOLEAN NOT NULL DEFAULT FALSE,
  dpdp_basis TEXT DEFAULT 'consent_s6',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, purpose_key)
);

CREATE TABLE consent_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  config_version TEXT NOT NULL,
  data_principal_hash TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'web',
  purposes_accepted TEXT[] NOT NULL DEFAULT '{}',
  purposes_rejected TEXT[] NOT NULL DEFAULT '{}',
  language TEXT NOT NULL DEFAULT 'en',
  user_agent TEXT,
  ip_hash TEXT,
  withdrawn BOOLEAN NOT NULL DEFAULT FALSE,
  withdrawn_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE consent_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_purposes ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org members manage consent_configs" ON consent_configs FOR ALL
  USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));

CREATE POLICY "org members manage consent_purposes" ON consent_purposes FOR ALL
  USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));

CREATE POLICY "org members read consent_records" ON consent_records FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));

-- Public write: widget records consent without user auth
CREATE POLICY "public can insert consent_records" ON consent_records FOR INSERT
  WITH CHECK (true);
```

---

## STEP 4 — MIDDLEWARE UPDATE

The public consent API routes are already listed in `src/middleware.ts`:

```typescript
const PUBLIC_API_ROUTES = [
  '/api/consent/record',
  '/api/consent/config',
  '/api/grievance/submit',   // ← already added in M4
]
```

Add `/api/consent/withdraw` to this list so the withdrawal endpoint is also public:

```typescript
const PUBLIC_API_ROUTES = [
  '/api/consent/record',
  '/api/consent/config',
  '/api/consent/withdraw',
  '/api/grievance/submit',
]
```

---

## STEP 5 — FILES TO CREATE

### Dashboard Pages

**`src/app/dashboard/consent/page.tsx`**
Consent Management home. Shows:
- Module status card: "Widget Active / Not Configured"
- Embed code snippet (JavaScript snippet for client websites)
- Quick stats: Total consents this month / Consent rate % / Withdrawals
- Purpose list with enable/disable toggles
- Link to widget configuration page
- Link to audit log

**`src/app/dashboard/consent/configure/page.tsx`**
Widget configuration wizard:
- Step 1: Set purposes (add/remove/edit: name, description, required or optional, DPDP basis)
- Step 2: Choose languages (multi-select from 22 Indian languages — at minimum English + Hindi)
- Step 3: Visual customization (banner position, primary color, show/hide reject all)
- Step 4: Preview (live preview of the consent banner)
- Save → updates `consent_configs` → bumps widget_version

**`src/app/dashboard/consent/audit/page.tsx`**
Consent audit log:
- Date range filter
- Channel filter (web / whatsapp)
- Table: Hash ID / Date / Channel / Purposes Accepted / Language / Status (Active / Withdrawn)
- Export to CSV button (client-side, from fetched data)

### Public API (no auth — called by widget)

**`src/app/api/consent/config/route.ts`**
- `GET ?org=[slug]` — returns widget configuration for an org
- No authentication required
- Returns: `{ purposes, languages, position, primary_color, show_reject_all, config_version }`
- Cache with `Cache-Control: public, max-age=300` (5 minutes)

**`src/app/api/consent/record/route.ts`**
- `POST` — records a consent event. No authentication required.
- Body: `{ org_slug, data_principal_identifier, purposes_accepted, purposes_rejected, language, channel, user_agent }`
- Server hashes `data_principal_identifier` before storing (SHA-256, salted with org_id)
- Server hashes IP from request headers before storing
- Returns: `{ success: true, consent_id }`
- **This is the most important public API — must be bulletproof**

**`src/app/api/consent/withdraw/route.ts`**
- `POST` — marks all consents for a hashed identifier as withdrawn
- Body: `{ org_slug, data_principal_identifier }`
- Returns: `{ success: true, withdrawn_count }`

### Dashboard API (auth required)

**`src/app/api/consent/manage/route.ts`**
- `GET`: returns current consent config + purposes for authenticated org
- `POST`: creates/updates consent config + purposes. Auto-increments `widget_version` on save.

**`src/app/api/consent/audit/route.ts`**
- `GET`: returns paginated consent records for authenticated org
- Query params: `page`, `limit`, `channel`, `from_date`, `to_date`

**`src/app/api/consent/stats/route.ts`**
- `GET`: returns consent stats for dashboard
- Returns: `{ total_this_month, consent_rate, withdrawals_this_month, by_channel }`

### The Consent Widget (JavaScript)

**`public/consent-widget.js`**

Embeddable JavaScript widget that clients copy-paste onto their website. Requirements:
- Pure vanilla JavaScript (no framework, no dependencies)
- < 15KB minified
- Loads asynchronously (must not block page render)
- Works on any website (React, plain HTML, WordPress, etc.)

```javascript
// Usage on client's website:
// <script src="https://app.truststack.in/consent-widget.js"
//         data-org="org-slug"
//         data-lang="auto"
//         async></script>

(function() {
  // 1. Get org slug from script tag data attribute
  // 2. Fetch config from /api/consent/config?org=[slug]
  // 3. Detect browser language → find matching supported language
  // 4. Render consent banner in the detected/configured language
  // 5. On user action, POST to /api/consent/record
  // 6. Set localStorage to remember consent choice
  // 7. On subsequent visits, check localStorage → don't show banner again if already consented

  // Banner must have:
  // - Company name + "We use cookies and process your data as follows:"
  // - List of purposes with toggles (required purposes disabled/always-on)
  // - "Accept All" button
  // - "Reject All" button (if show_reject_all=true)
  // - "Manage Preferences" button → expands to show per-purpose toggles
  // - Must NOT use dark patterns: Accept All and Reject All must have equal visual weight

  const TRUSTSTACK_API = window.location.hostname === 'localhost'
    ? 'http://localhost:3011'
    : 'https://app.truststack.in'

  // ... implementation
})()
```

Write a fully functional, production-ready consent widget.

### Components

**`src/components/modules/consent/PurposeEditor.tsx`**
Add/edit/remove consent purposes. Each purpose: key, name (EN + HI + TA + TE), description, required toggle, DPDP basis.

**`src/components/modules/consent/WidgetPreview.tsx`**
Live preview of the consent banner using the current configuration.

**`src/components/modules/consent/EmbedCodeSnippet.tsx`**
Shows the JavaScript snippet to copy with a copy button. Substitutes actual org slug.

**`src/components/modules/consent/ConsentStatsCard.tsx`**
Stats cards: total consents this month, consent rate %, withdrawals.

**`src/components/modules/consent/AuditTable.tsx`**
Paginated audit log table with CSV export.

---

## STEP 6 — ACTIVATE SIDEBAR

In `src/lib/constants.ts`, change the consent entry in `SIDEBAR_MODULES`:

```typescript
// Change available: false → available: true
{ key: 'consent', label: 'Consent Management', href: '/dashboard/consent', icon: 'CheckSquare', available: true },
```

---

## STEP 7 — IDENTIFIER HASHING

Never store raw email/phone in consent_records. Always hash server-side:

```typescript
import { createHash } from 'crypto'

function hashIdentifier(identifier: string, orgId: string): string {
  // Include org ID in hash to prevent cross-org correlation
  return createHash('sha256').update(`${orgId}:${identifier}`).digest('hex')
}

function hashIP(ip: string): string {
  return createHash('sha256').update(ip).digest('hex')
}
```

---

## STEP 8 — MULTILINGUAL CONSENT TEXT

The widget renders consent text in the user's language. For MVP:

```typescript
const CONSENT_TRANSLATIONS = {
  en: {
    banner_title: 'We value your privacy',
    banner_desc: 'We use cookies and process your personal data in accordance with the Digital Personal Data Protection Act 2023.',
    accept_all: 'Accept All',
    reject_all: 'Reject All',
    manage: 'Manage Preferences',
    save: 'Save My Choices',
    required_label: 'Required',
    withdraw_notice: 'You can withdraw consent at any time.',
  },
  hi: {
    banner_title: 'हम आपकी गोपनीयता को महत्व देते हैं',
    banner_desc: 'हम डिजिटल व्यक्तिगत डेटा संरक्षण अधिनियम 2023 के अनुसार कुकीज़ और आपका व्यक्तिगत डेटा उपयोग करते हैं।',
    accept_all: 'सभी स्वीकार करें',
    reject_all: 'सभी अस्वीकार करें',
    manage: 'प्राथमिकताएं प्रबंधित करें',
    save: 'मेरी पसंद सहेजें',
    required_label: 'आवश्यक',
    withdraw_notice: 'आप किसी भी समय सहमति वापस ले सकते हैं।',
  },
  ta: {
    banner_title: 'உங்கள் தனியுரிமையை மதிக்கிறோம்',
    banner_desc: 'டிஜிட்டல் தனிப்பட்ட தரவு பாதுகாப்பு சட்டம் 2023 இன்படி குக்கீகள் மற்றும் தரவை பயன்படுத்துகிறோம்.',
    accept_all: 'அனைத்தையும் ஏற்றுக்கொள்',
    reject_all: 'அனைத்தையும் நிராகரி',
    manage: 'விருப்பங்களை நிர்வகி',
    save: 'என் தேர்வுகளை சேமி',
    required_label: 'தேவையான',
    withdraw_notice: 'நீங்கள் எந்த நேரத்திலும் ஒப்புதலை திரும்பப் பெறலாம்.',
  },
  te: {
    banner_title: 'మీ గోప్యతను గౌరవిస్తాము',
    banner_desc: 'డిజిటల్ వ్యక్తిగత డేటా రక్షణ చట్టం 2023 ప్రకారం కుకీలు మరియు డేటాను ఉపయోగిస్తాము.',
    accept_all: 'అన్నీ అంగీకరించు',
    reject_all: 'అన్నీ తిరస్కరించు',
    manage: 'ప్రాధాన్యతలు నిర్వహించు',
    save: 'నా ఎంపికలు సేవ్ చేయి',
    required_label: 'అవసరం',
    withdraw_notice: 'మీరు ఎప్పుడైనా సమ్మతిని ఉపసంహరించవచ్చు.',
  },
}
```

---

## STEP 9 — DEFAULT PURPOSES (pre-populate for new orgs)

When a new org sets up consent management for the first time, pre-create these purposes:

```typescript
const DEFAULT_PURPOSES = [
  { purpose_key: 'essential',  name_en: 'Essential Cookies',  description_en: 'Required for the website to function. Cannot be disabled.', required: true,  dpdp_basis: 's7_legal' },
  { purpose_key: 'analytics',  name_en: 'Analytics',          description_en: 'Help us understand how visitors interact with our website.', required: false, dpdp_basis: 'consent_s6' },
  { purpose_key: 'marketing',  name_en: 'Marketing',          description_en: 'Used to deliver personalized advertisements and measure their effectiveness.', required: false, dpdp_basis: 'consent_s6' },
  { purpose_key: 'functional', name_en: 'Functional',         description_en: 'Enable enhanced functionality such as live chat, video, and saved preferences.', required: false, dpdp_basis: 'consent_s6' },
]
```

---

## STEP 10 — EMBED CODE TO SHOW IN DASHBOARD

```html
<!-- TrustStack™ Consent Widget — copy and paste before </body> -->
<script
  src="https://app.truststack.in/consent-widget.js"
  data-org="YOUR-ORG-SLUG"
  data-lang="auto"
  async>
</script>
```

Show this in `EmbedCodeSnippet.tsx` with the actual org slug substituted in, plus a "Copy" button.

---

## STEP 11 — ACCEPTANCE CRITERIA

- [ ] `npm run type-check` passes
- [ ] Admin can configure consent purposes via dashboard
- [ ] Widget configuration saves to Supabase
- [ ] Embed code snippet shows correct org slug
- [ ] `consent-widget.js` loads and displays a consent banner on a plain HTML test page
- [ ] Accepting consent records a row in `consent_records` table
- [ ] Rejecting records a row with empty `purposes_accepted`
- [ ] Hashed identifier and IP are stored (not raw values)
- [ ] Audit log in dashboard shows all consent records
- [ ] Consent rate stat is computed correctly
- [ ] Widget does not show banner again on second visit (checks localStorage)
- [ ] Banner renders in Hindi when `data-lang="hi"` is set
- [ ] RLS: one org cannot read another org's consent records

---

## STEP 12 — UPDATE PROGRESS.MD WHEN DONE

Mark M2 ✅ Complete, list all files created, add decisions to the log.
