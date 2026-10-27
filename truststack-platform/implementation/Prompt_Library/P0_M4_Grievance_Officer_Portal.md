# SESSION PROMPT — P0 M4: Grievance Officer Portal
## TrustStack™ Platform — Phase 0, Module 4

---

## STEP 1 — READ THESE FILES FIRST

```
implementation/MASTER_CONTEXT.md
implementation/progress.md
```

Read both completely before writing any code. M4 is built before M3 because the Privacy Notice Builder (M3) pulls the Grievance Officer's name and email into the generated notice.

---

## STEP 2 — PREREQUISITES

**M1 and M1b must be complete before starting this session.**

Verify:
- [ ] User can log in and reach `/dashboard`
- [ ] `organizations` and `organization_members` tables exist in Supabase
- [ ] `src/lib/supabase/client.ts`, `server.ts`, and `admin.ts` exist
- [ ] Dashboard sidebar exists at `src/components/dashboard/Sidebar.tsx`
- [ ] `src/lib/constants.ts` exports `SIDEBAR_MODULES` — the grievance entry currently has `available: false`
- [ ] `RESEND_API_KEY` is set in `.env.local` (needed for email notifications — get key from resend.com)

**Critical path note:** Dashboard pages in this project live at `src/app/dashboard/` — a plain folder, NOT a route group. Do NOT use `src/app/(dashboard)/`. Route groups don't add URL segments — using one would put pages at `/grievance/` instead of `/dashboard/grievance/`, bypassing the auth middleware which only protects `/dashboard/*`.

---

## STEP 3 — SUPABASE SQL (run in Supabase SQL Editor)

```sql
CREATE TABLE grievance_officers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  designation TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  appointed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE grievance_complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  reference_number TEXT UNIQUE NOT NULL,
  complainant_name TEXT NOT NULL,
  complainant_email TEXT,
  complainant_phone TEXT,
  complaint_type TEXT NOT NULL,
  description TEXT NOT NULL,
  attachment_url TEXT,
  language TEXT NOT NULL DEFAULT 'en',
  status TEXT NOT NULL DEFAULT 'new',
  assigned_to UUID REFERENCES auth.users(id),
  resolution_notes TEXT,
  resolved_at TIMESTAMPTZ,
  escalated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE grievance_officers ENABLE ROW LEVEL SECURITY;
ALTER TABLE grievance_complaints ENABLE ROW LEVEL SECURITY;

-- Internal read/write for org members
CREATE POLICY "org members can manage grievance_officers" ON grievance_officers FOR ALL
  USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));

CREATE POLICY "org members can read complaints" ON grievance_complaints FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));

CREATE POLICY "org members can update complaints" ON grievance_complaints FOR UPDATE
  USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));

-- Public insert (no auth required — widget submits complaints)
CREATE POLICY "public can submit complaints" ON grievance_complaints FOR INSERT
  WITH CHECK (true);
```

---

## STEP 4 — FILES TO CREATE

### Dashboard Pages

**`src/app/dashboard/grievance/page.tsx`**  
Grievance Officer management page. Shows:
- Current active Grievance Officer card (name, designation, email, phone, appointed date)
- "Edit Grievance Officer" button
- "View Public Page" link → opens `/public/grievance/[org-slug]` in new tab
- Stats: Total complaints, Open complaints, Resolved this month, Avg resolution time
- Recent complaints table (last 5, with link to full list)

**`src/app/dashboard/grievance/complaints/page.tsx`**  
Full complaints management page. Shows:
- Filter bar: All / New / Under Review / Resolved / Escalated
- Search by reference number or complainant name
- Complaints table with columns: Reference # / Date / Complainant / Type / Status / Assigned To / Actions
- Click complaint → slide-over detail panel OR navigate to complaint detail

**`src/app/dashboard/grievance/complaints/[id]/page.tsx`**  
Individual complaint detail:
- Full complaint info (complainant, description, attachment if any)
- Status timeline (New → Under Review → Resolved)
- Status update form: change status, add resolution notes, assign to team member
- Internal notes section (not visible to complainant)
- SLA indicator: how many days since complaint was submitted

### Public Pages (no auth)

**`src/app/public/grievance/[slug]/page.tsx`**  
Public grievance submission form. Shown on the client's public grievance page.
- Displays organization name and Grievance Officer contact info
- Complaint submission form:
  - Complainant name (required)
  - Email or phone (one required)
  - Complaint type (dropdown): Consent / Data Access / Correction / Erasure / Breach / Other
  - Language selector (English + 3 Indian languages at launch: Hindi, Tamil, Telugu)
  - Description (textarea, required, min 50 chars)
  - File upload (optional, max 5MB, accept PDF/JPG/PNG)
  - Submit button
- After submit: shows reference number + "We will respond within 30 days"
- Must work WITHOUT authentication

### API Routes

**`src/app/api/grievance/officer/route.ts`**  
- `GET`: returns active grievance officer for the authenticated org
- `POST`: creates or updates grievance officer record
- `PUT`: updates existing officer
- Auth required

**`src/app/api/grievance/submit/route.ts`**  
- `POST`: Public endpoint — NO AUTH REQUIRED
- Body: `{ org_slug, complainant_name, complainant_email?, complainant_phone?, complaint_type, description, language }`
- Generates reference number: `GRV-{YYYY}-{sequential 3-digit number}`
- Inserts into grievance_complaints
- Sends email notification to Grievance Officer (via Resend)
- Returns: `{ reference_number, message }`

**`src/app/api/grievance/complaints/route.ts`**  
- `GET`: returns paginated complaints for the authenticated org
- Query params: `status`, `page`, `limit`, `search`
- Auth required

**`src/app/api/grievance/complaints/[id]/route.ts`**  
- `GET`: returns single complaint detail
- `PATCH`: updates status, resolution_notes, assigned_to
- Auth required

### Components

**`src/components/modules/grievance/GrievanceOfficerCard.tsx`**  
Displays current Grievance Officer with edit button. Shows "Not Appointed" state with CTA if no officer set.

**`src/components/modules/grievance/GrievanceOfficerForm.tsx`**  
Form to set/edit Grievance Officer details. Fields: name, designation, email, phone.

**`src/components/modules/grievance/ComplaintsTable.tsx`**  
Sortable, filterable complaints table. Status chips: New (red) / Under Review (amber) / Resolved (green) / Escalated (purple).

**`src/components/modules/grievance/ComplaintStatusBadge.tsx`**  
Colored status chip component.

**`src/components/modules/grievance/ComplaintDetail.tsx`**  
Detail view for a single complaint with status update form.

**`src/components/modules/grievance/PublicComplaintForm.tsx`**  
The public-facing complaint submission form (used on `/public/grievance/[slug]`).

---

## STEP 5 — ACTIVATE SIDEBAR + ADD CONSTANTS

### Enable grievance nav link

In `src/lib/constants.ts`, change the grievance entry in `SIDEBAR_MODULES`:

```typescript
// Change available: false → available: true
{ key: 'grievance', label: 'Grievance Officer', href: '/dashboard/grievance', icon: 'MessageCircle', available: true },
```

### Add COMPLAINT_TYPES to `src/lib/constants.ts`

```typescript
export const COMPLAINT_TYPES = [
  { value: 'consent',     label: 'Consent Issue',            dpdp_section: 'Section 6' },
  { value: 'access',      label: 'Data Access Request',      dpdp_section: 'Section 11' },
  { value: 'correction',  label: 'Data Correction',          dpdp_section: 'Section 12(a)' },
  { value: 'erasure',     label: 'Data Erasure / Deletion',  dpdp_section: 'Section 12(c)' },
  { value: 'breach',      label: 'Data Breach Concern',      dpdp_section: 'Section 8(6)' },
  { value: 'other',       label: 'Other DPDP Concern',       dpdp_section: 'General' },
] as const
```

---

## STEP 6 — REFERENCE NUMBER GENERATION

```typescript
async function generateReferenceNumber(organizationId: string): Promise<string> {
  const year = new Date().getFullYear()
  // Get count of complaints for this org this year
  const { count } = await supabase
    .from('grievance_complaints')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .gte('created_at', `${year}-01-01`)
  
  const sequence = String((count || 0) + 1).padStart(3, '0')
  return `GRV-${year}-${sequence}`
}
```

---

## STEP 7 — EMAIL NOTIFICATION (Resend)

When a new complaint is submitted via the public form, send an email to the Grievance Officer:

```typescript
import { Resend } from 'resend'
const resend = new Resend(process.env.RESEND_API_KEY)

await resend.emails.send({
  from: 'TrustStack™ <noreply@truststack.in>',
  to: grievanceOfficer.email,
  subject: `New Grievance Complaint — ${referenceNumber}`,
  html: `
    <p>A new complaint has been submitted.</p>
    <p><strong>Reference:</strong> ${referenceNumber}</p>
    <p><strong>Type:</strong> ${complaintType}</p>
    <p><strong>From:</strong> ${complainantName}</p>
    <p><strong>Description:</strong> ${description}</p>
    <p>Login to TrustStack to review and respond: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard/grievance/complaints</p>
  `
})
```

---

## STEP 8 — UX FLOW

```
Dashboard → Grievance → 
  [No officer set]: Show appointment form prominently (compliance blocker)
  [Officer set]: Show officer card + complaints stats + recent complaints

"View Public Page" → Opens /public/grievance/[org-slug] in new tab
  → Any member of the public can submit a complaint here
  → Form submits without login
  → Reference number shown on success

Dashboard → Grievance → Complaints →
  → Filter / search complaints
  → Click complaint → detail view
  → Update status → sends notification (future: email to complainant)
```

**Empty states:**
- No Grievance Officer: Red banner "⚠ Grievance Officer not appointed — this is required under DPDP Section 14. Appoint now →"
- No complaints: Green card "✓ No complaints received. Keep up the good compliance work."

---

## STEP 9 — ACCEPTANCE CRITERIA

- [ ] `npm run type-check` passes
- [ ] Admin can appoint Grievance Officer via dashboard form
- [ ] Officer details saved to `grievance_officers` table
- [ ] Public form at `/public/grievance/[org-slug]` loads without authentication
- [ ] Complaint submits successfully and appears in dashboard
- [ ] Reference number generated (format: GRV-2026-001)
- [ ] Email sent to Grievance Officer on new complaint (check Resend dashboard)
- [ ] Status can be updated from dashboard (New → Under Review → Resolved)
- [ ] Complaints from one org NOT visible to another org (RLS check)
- [ ] "View Public Page" link works correctly with correct slug

---

## STEP 10 — UPDATE PROGRESS.MD WHEN DONE

Mark M4 ✅ Complete, list all files created, add decisions to the log.
