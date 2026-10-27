# P2 — M19: Re-Consent Campaign
## Bulk campaigns to re-obtain consent after privacy policy changes

**Session:** P2 — M19  
**Phase:** P2 — Commercialization  
**Priority:** HIGH — legally required when privacy notice changes under DPDP Act  
**Estimated time:** 1 session (~2.5 hours)  
**Branch:** `feature/p2-m19-reconsent-campaign`  
**Tag after completion:** `v2.9.0`  
**Prerequisites:** M2 (Consent Management), M3 (Privacy Notice) + M15 (WhatsApp, optional)

---

## READ FIRST
Read: `implementation/MASTER_CONTEXT.md` + `implementation/progress.md`

---

## What to Build

When an organization updates its privacy policy or changes the purpose/scope of data processing, DPDP Act requires them to re-obtain consent from affected data principals. M19 enables bulk re-consent campaigns via email (and optionally WhatsApp).

---

## Database Schema

```sql
CREATE TABLE reconsent_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  consent_config_id UUID NOT NULL REFERENCES consent_configs(id),
  name TEXT NOT NULL,                       -- e.g. "Privacy Policy Update June 2026"
  reason TEXT NOT NULL,                     -- Why re-consent is needed
  channels TEXT[] NOT NULL DEFAULT '{email}', -- 'email' | 'whatsapp' | 'sms'
  status TEXT NOT NULL DEFAULT 'draft',     -- 'draft' | 'scheduled' | 'sending' | 'complete' | 'paused'
  send_at TIMESTAMPTZ,                      -- Null = send immediately
  total_targets INTEGER NOT NULL DEFAULT 0, -- Count of data principals to contact
  total_sent INTEGER NOT NULL DEFAULT 0,
  total_delivered INTEGER NOT NULL DEFAULT 0,
  total_opened INTEGER NOT NULL DEFAULT 0,
  total_responded INTEGER NOT NULL DEFAULT 0,
  total_consented INTEGER NOT NULL DEFAULT 0,
  total_declined INTEGER NOT NULL DEFAULT 0,
  total_withdrawn INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE reconsent_campaign_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES reconsent_campaigns(id) ON DELETE CASCADE,
  consent_record_id UUID REFERENCES consent_records(id),  -- Null if new principal
  email TEXT,
  phone TEXT,
  name TEXT,
  status TEXT NOT NULL DEFAULT 'pending',   -- 'pending' | 'sent' | 'opened' | 'consented' | 'declined' | 'bounced'
  sent_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,
  response TEXT,                            -- 'consented' | 'declined'
  token TEXT NOT NULL UNIQUE,               -- HMAC token for the re-consent link
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE reconsent_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE reconsent_campaign_recipients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_members_manage_campaigns" ON reconsent_campaigns
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  );
```

---

## API Routes

### POST `/api/consent/reconsent-campaign/create`
**Auth:** Admin or DPO  
**Body:** `{ consent_config_id, name, reason, channels, send_at? }`  
**Flow:**
1. Load all existing consent_records for this consent_config (where status = 'active')
2. Create campaign + create one recipient per consent record
3. Generate HMAC token per recipient: `createHmac('sha256', HMAC_SECRET).update(`${campaignId}:${recipientId}:${email}`).digest('hex')`
4. Return: `{ campaign_id, total_targets }`

### POST `/api/consent/reconsent-campaign/[id]/send`
**Auth:** Admin or DPO  
**Flow:**
1. Update campaign status: 'sending'
2. For each pending recipient:
   - Send email: subject = "[Org Name] — We need your consent for [reason]"
   - Include re-consent link: `${APP_URL}/reconsent/${token}`
   - Update recipient: status='sent', sent_at=now
3. Update total_sent count
4. Mark campaign status: 'complete' (or 'paused' if any failures)

### GET `/api/consent/reconsent/[token]` (PUBLIC — no auth)
**Returns:** Campaign info + recipient info (name, org, reason for re-consent, current consent status)

### POST `/api/consent/reconsent/[token]` (PUBLIC — no auth)  
**Body:** `{ response: 'consented' | 'declined' }`  
**Flow:**
1. Validate token (HMAC verify)
2. Update consent_record: status = 'active' or 'withdrawn'
3. Update campaign_recipient: status = response, responded_at = now
4. Update campaign totals (total_consented++ or total_declined++)
5. Return: success + confirmation message

### GET `/api/consent/reconsent-campaign/[id]/stats`
**Auth:** Org member  
**Returns:** Full campaign statistics

### GET `/api/consent/reconsent-campaigns`
**Auth:** Org member  
**Returns:** List of all campaigns for the org

---

## Public Re-Consent Page: `/reconsent/[token]`

```
[Org Logo]
─────────────────────────────────────────────────────────────────
Acme Corp needs your consent

We've updated our Privacy Policy and need your renewed consent:

Why we're asking: "We've added new data processing activities for 
personalized marketing. Your previous consent was for basic service 
delivery only."

What we'll do with your data:
✓ Provide our services to you
✓ Send you personalized offers and promotions
✗ Share with third parties (we never do this)

                       [Give Consent]    [Decline]

You can update your preference at any time.
Powered by TrustStack™
```

After response → thank you message + summary of what was recorded.

---

## UI: Campaign Dashboard `/dashboard/consent/campaigns`

```
Re-Consent Campaigns                          [+ New Campaign]
─────────────────────────────────────────────────────────────────

Privacy Policy Update June 2026     COMPLETE     Jun 26, 2026
Sent: 1,247   Consented: 892 (71.5%)   Declined: 203   Pending: 152
[View Details]

Cookie Policy Update                DRAFT
0 sent. Targets: 3,451 data principals
[Edit]  [Send Now]
```

### Campaign Detail View

```
Campaign: Privacy Policy Update June 2026
Status: Complete    Sent: Jun 26, 2026

───────────────────────────────────────────
Response Rate: 84.7%   (pending 15.3%)

Consented:  ████████████░░░░ 71.5% (892)
Declined:   ████░░░░░░░░░░░░ 16.3% (203)
Pending:    ████░░░░░░░░░░░░ 12.2% (152)
Bounced:    █░░░░░░░░░░░░░░░  0.5% (6)

[Export CSV]  [Send Reminder to Pending]
```

---

## Reminder Email (for non-responders)

After 7 days, allow sending a reminder to recipients who haven't responded:

```
Subject: Reminder: [Org Name] still needs your consent

Hi [Name],

We sent you a consent request 7 days ago but haven't heard back.

[Give Consent Now]  [Decline]

This link is unique to you and expires in 7 days.
```

---

## Testing

1. Create campaign for consent_config with 3 existing consented users
2. Campaign shows 3 targets
3. Send campaign → 3 emails sent (check Resend)
4. Open the re-consent link for recipient 1 → consent page loads (name, org, reason)
5. Click [Give Consent] → consent_record updated → campaign total_consented = 1
6. Click [Decline] for recipient 2 → consent_record.status = 'withdrawn' → total_declined = 1
7. Stats page shows 1 consented, 1 declined, 1 pending
8. Send reminder to pending → 1 email sent
9. Invalid token → 404
10. `npm run type-check` → 0 errors; `npm audit` → 0 vulnerabilities

---

## After Completion

1. Update `progress.md` — M19 Re-Consent Campaign ✅ Complete
2. Update `MASTER_CONTEXT.md` — add M19 section
3. Update `tracker-data.json` — M19 status → "built"
4. Apply SQL: reconsent_campaigns + reconsent_campaign_recipients tables
5. Git commit + push + PR + merge + tag `v2.9.0`
