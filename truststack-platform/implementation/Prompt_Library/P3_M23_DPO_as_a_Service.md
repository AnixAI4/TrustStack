# P3 — M23: DPO-as-a-Service
## Monthly DPO advisory: dedicated session booking, async Q&A, advisory notes

**Session:** P3 — M23  
**Phase:** P3 — Scale  
**Priority:** HIGH — highest ACV add-on; captures large segment without full-time DPO  
**Estimated time:** 1 session (~2.5 hours)  
**Branch:** `feature/p3-m23-dpo-as-a-service`  
**Tag after completion:** `v3.4.0`  
**Prerequisites:** M11 Team Management + M12 Billing (DPO service is a paid add-on)

---

## READ FIRST
Read: `implementation/MASTER_CONTEXT.md` + `implementation/progress.md`

---

## What to Build

An in-platform DPO advisory service. An Anix AI DPO is assigned to the organization and provides:
- Monthly video call (booked through in-platform scheduling)
- Async Q&A thread (in-platform messaging)
- Session notes/summaries after each call
- Annual DPDP risk assessment review
- Priority breach response support

**Billing:** Add-on subscription (₹8K/month Starter, ₹15K/month Growth, ₹30K/month Enterprise). This is a separate subscription from the platform plan — handled as an addon in M12's subscription engine.

---

## Database Schema

```sql
-- DPO engagements (one per org that subscribes)
CREATE TABLE dpo_engagements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID UNIQUE NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  dpo_user_id UUID NOT NULL REFERENCES auth.users(id),  -- The Anix AI DPO assigned
  tier TEXT NOT NULL DEFAULT 'starter',                 -- 'starter' | 'growth' | 'enterprise'
  hours_per_month INTEGER NOT NULL DEFAULT 2,
  status TEXT NOT NULL DEFAULT 'active',                -- 'active' | 'paused' | 'canceled'
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  monthly_price_paise INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Advisory sessions (monthly calls)
CREATE TABLE dpo_advisory_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id UUID NOT NULL REFERENCES dpo_engagements(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id),
  scheduled_at TIMESTAMPTZ,
  duration_minutes INTEGER,
  status TEXT NOT NULL DEFAULT 'pending',               -- 'pending' | 'scheduled' | 'completed' | 'canceled'
  meeting_url TEXT,                                     -- Google Meet / Zoom URL
  agenda TEXT,
  notes TEXT,                                           -- Session summary (DPO fills this after)
  recording_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Async Q&A messages
CREATE TABLE dpo_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id UUID NOT NULL REFERENCES dpo_engagements(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id),
  sender_id UUID NOT NULL REFERENCES auth.users(id),
  sender_role TEXT NOT NULL,                            -- 'client' | 'dpo'
  content TEXT NOT NULL,
  attachments JSONB,                                    -- Array of { name, url, type }
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE dpo_engagements ENABLE ROW LEVEL SECURITY;
ALTER TABLE dpo_advisory_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE dpo_messages ENABLE ROW LEVEL SECURITY;

-- Org members can view their engagement
CREATE POLICY "org_members_view_engagement" ON dpo_engagements
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  );

-- DPO user can view all engagements they're assigned to
CREATE POLICY "dpo_view_assigned" ON dpo_engagements
  FOR ALL USING (dpo_user_id = auth.uid());

-- Similar policies for sessions and messages
```

---

## API Routes

### GET `/api/dpo/engagement`
**Auth:** Org member  
**Returns:** Current DPO engagement details + assigned DPO profile

### POST `/api/dpo/sessions/request`
**Auth:** Org admin or DPO role  
**Body:** `{ preferred_dates: string[], agenda?: string }`  
**Flow:** Create session record (status: 'pending'), notify DPO via email

### PATCH `/api/dpo/sessions/[id]/confirm`
**Auth:** DPO user (Anix AI team member)  
**Body:** `{ scheduled_at: string, meeting_url: string }`  
**Action:** Confirm session + send calendar invite to org admin

### PATCH `/api/dpo/sessions/[id]/complete`
**Auth:** DPO user  
**Body:** `{ notes: string, recording_url?: string }`  
**Action:** Mark complete, add notes, send summary email to org

### GET `/api/dpo/messages`
**Auth:** Org member  
**Returns:** Message thread for this engagement (paginated)

### POST `/api/dpo/messages`
**Auth:** Org member or DPO user  
**Body:** `{ content: string, attachments?: [] }`

### POST `/api/dpo/messages/[id]/read`
**Auth:** Recipient  
**Action:** Mark message as read

---

## UI: `/dashboard/dpo-advisory`

```
DPO-as-a-Service — Growth Plan           [₹15,000/month]
─────────────────────────────────────────────────────────────────
Your DPO: Priya Sharma
         Certified CIPM | 8 years DPDP experience
         [Send Message]  [Schedule Call]

─────────────────────────────────────────────────────────────────
Upcoming Session:
📅 July 15, 2026 — 11:00 AM IST              [Join Meeting →]
Agenda: Q2 ROPA Review + Breach Response Plan

─────────────────────────────────────────────────────────────────
Recent Sessions
Jun 15  Monthly Advisory — Q1 Review         [View Notes →]
May 15  Breach Response Workshop             [View Notes →]

─────────────────────────────────────────────────────────────────
Async Q&A
─────────────────────────────────────────────────────────────────
Priya [DPO] — Jun 25, 10:30 AM
"Regarding your question about employee monitoring — DPDP Act 
Section 7 allows processing with legitimate interest provided 
you document the basis in your ROPA. Here's what to update..."

You — Jun 24, 4:15 PM  
"We want to start monitoring employee emails for security. 
What's the DPDP compliance approach?"

[Type your question here...]                      [Send →]
```

### DPO Admin Interface (internal — only for Anix AI DPO team)

A separate admin view at `/admin/dpo-engagements` (role='dpo' AND is_anix_team=true):
- List all client engagements
- View/respond to messages
- Schedule sessions
- Add session notes

---

## DPO Onboarding Flow

When an org subscribes to DPO-as-a-Service:
1. Anix AI admin assigns a DPO user to the org (in `/admin/dpo-engagements`)
2. Welcome email sent to org admin: "Meet your DPO: Priya Sharma"
3. First session auto-scheduled within 7 business days of signup
4. Introductory session agenda: DPDP Act overview + org's current Compass Score review

---

## Testing

1. Subscribe to DPO-as-a-Service → engagement created
2. Request a session → session appears in "pending" state
3. DPO confirms session → scheduled_at set → calendar invite email sent
4. DPO marks session complete with notes → notes visible in session history
5. Org member sends message → DPO sees it in their admin view
6. DPO replies → org member sees reply with 🔔 notification (M18 Alert)
7. `npm run type-check` → 0 errors; `npm audit` → 0 vulnerabilities

---

## After Completion

1. Update `progress.md` — M23 DPO-as-a-Service ✅ Complete
2. Update `MASTER_CONTEXT.md` — add M23 section
3. Update `tracker-data.json` — M23 status → "built"
4. Apply SQL: dpo_engagements + dpo_advisory_sessions + dpo_messages tables
5. Git commit + push + PR + merge + tag `v3.4.0`
