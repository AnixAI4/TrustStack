# P2 — M15: WhatsApp Consent
## Collect, record, and withdraw consent via WhatsApp Business API

**Session:** P2 — M15  
**Phase:** P2 — Commercialization  
**Priority:** HIGH — 500M+ Indians on WhatsApp; competitors have no WhatsApp consent solution  
**Estimated time:** 1 session (~3 hours)  
**Branch:** `feature/p2-m15-whatsapp-consent`  
**Tag after completion:** `v2.5.0`  
**Prerequisites:** M2 Consent Management + M12 Billing Engine (feature gate check)

---

## READ FIRST
Read: `implementation/MASTER_CONTEXT.md` + `implementation/progress.md`

---

## What to Build

Allow organizations to collect DPDP-compliant consent from data principals via WhatsApp, instead of (or in addition to) the web widget. When a data principal messages the org's WhatsApp Business number, they receive a structured consent request and can reply to consent or decline.

---

## Architecture

```
Data Principal → WhatsApp → Twilio WhatsApp Business API → 
POST /api/whatsapp/webhook → TrustStack™ → 
Insert consent_records (same table as web widget)
```

**Integration:** Twilio WhatsApp Business API (V1). The `ConsentChannel` on the consent record distinguishes 'web' vs 'whatsapp'.

---

## Database Changes

```sql
-- Add channel column to consent_records (if not already present)
ALTER TABLE consent_records ADD COLUMN IF NOT EXISTS channel TEXT NOT NULL DEFAULT 'web' 
  CHECK (channel IN ('web', 'whatsapp', 'aadhaar_otp', 'email'));

-- WhatsApp consent sessions (map phone number to consent config)
CREATE TABLE whatsapp_consent_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  consent_config_id UUID NOT NULL REFERENCES consent_configs(id),
  whatsapp_phone TEXT NOT NULL,             -- Data principal's WhatsApp number (e164)
  wa_message_id TEXT,                       -- Twilio message SID for tracking
  state TEXT NOT NULL DEFAULT 'awaiting',   -- 'awaiting' | 'consented' | 'declined' | 'withdrawn'
  language TEXT NOT NULL DEFAULT 'en',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE whatsapp_consent_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_members_view_wa_sessions" ON whatsapp_consent_sessions
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  );

-- WhatsApp config per consent_config
ALTER TABLE consent_configs ADD COLUMN IF NOT EXISTS whatsapp_enabled BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE consent_configs ADD COLUMN IF NOT EXISTS whatsapp_from_number TEXT; -- Twilio number e.g. +14155238886
ALTER TABLE consent_configs ADD COLUMN IF NOT EXISTS whatsapp_message_template TEXT; -- Custom message or null = default
```

---

## API Routes

### POST `/api/whatsapp/webhook` (PUBLIC — HMAC verified from Twilio)
**Twilio sends this when a data principal messages the WhatsApp Business number.**

```typescript
// 1. Verify Twilio signature:
//    import { validateRequest } from 'twilio';
//    validateRequest(TWILIO_AUTH_TOKEN, signature, url, params)
//    → return 403 if invalid

// 2. Parse incoming message:
//    const { From, Body, MessageSid } = body; // From = 'whatsapp:+919876543210'
//    const phoneNumber = From.replace('whatsapp:', '');

// 3. Check if this is a consent response:
//    'YES' / 'हाँ' / '1' → CONSENT
//    'NO' / 'नहीं' / '2' → DECLINE
//    'STOP' / 'WITHDRAW' → WITHDRAW existing consent

// 4. Find the pending whatsapp_consent_session for this phone
// 5. Update state accordingly
// 6. Insert/update consent_records (channel: 'whatsapp')
// 7. Reply via Twilio REST API:
//    Consent: "✅ Thank you. Your consent has been recorded. Reference: CNS-2026-001"
//    Decline: "We've recorded your preference. You can update this anytime."
//    Withdraw: "✅ Your consent has been withdrawn. Reference: ..."

// Must return 200 immediately (Twilio retries on non-200)
```

### POST `/api/whatsapp/send-consent-request`
**Admin triggers: send a consent request WhatsApp message to a phone number**

```typescript
// Body: { consent_config_id: string, phone_number: string, language?: string }
// Auth: org member with admin or dpo role
// 1. Check feature gate: checkFeatureAccess(org.id, 'm15_whatsapp')
// 2. Create whatsapp_consent_sessions record (state: 'awaiting')
// 3. Send WhatsApp message via Twilio:
//    const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
//    await client.messages.create({
//      from: `whatsapp:${config.whatsapp_from_number}`,
//      to: `whatsapp:${phone_number}`,
//      body: buildConsentMessage(consentConfig, language),
//    });
// 4. Return: { session_id, message_sid }
```

### POST `/api/whatsapp/bulk-send`
**Send consent requests to a list of phone numbers (CSV upload or paste)**

```typescript
// Body: { consent_config_id: string, phone_numbers: string[], language?: string }
// Rate: max 100 per request (Twilio rate limits)
// Queues each message (sequential, not parallel — avoid Twilio rate limits)
```

### GET `/api/whatsapp/sessions`
**List all WhatsApp consent sessions for the org**

---

## Consent Message Template

**English (default):**
```
*[Org Name]* is requesting your consent to:
📋 *Purpose:* Marketing communications
🔒 *Your data:* Name, email, phone
📅 *Duration:* 1 year

Reply:
*YES* to give consent
*NO* to decline
*STOP* to withdraw an existing consent

Your response will be recorded and you can update it at any time.

[Powered by TrustStack™ — India's DPDP Compliance Platform]
```

**Hindi:**
```
*[संस्था का नाम]* आपकी सहमति मांग रहा है:
📋 *उद्देश्य:* मार्केटिंग संचार
🔒 *आपका डेटा:* नाम, ईमेल, फ़ोन
📅 *अवधि:* 1 वर्ष

जवाब दें:
*हाँ* - सहमति देने के लिए
*नहीं* - अस्वीकार करने के लिए
*STOP* - मौजूदा सहमति वापस लेने के लिए
```

---

## UI: WhatsApp Section in Consent Dashboard

**Add tab to `/dashboard/consent/[configId]`:** "WhatsApp"

```
WhatsApp Consent                          [Send Consent Request]
─────────────────────────────────────────────────────────────────
Configuration
From Number: +14155238886               [Change]
Language: English                        [Change]
Custom Message: Using default            [Edit]

─────────────────────────────────────────────────────────────────
WhatsApp Consent Stats (Last 30 days)
Requests Sent: 247
Consented: 189 (76.5%)
Declined: 31 (12.6%)
Awaiting: 27 (10.9%)

─────────────────────────────────────────────────────────────────
Recent Sessions
+91 98765 43210   Consented   Jun 26, 2026   CNS-2026-001
+91 98765 43211   Declined    Jun 26, 2026   —
+91 87654 32109   Awaiting    Jun 25, 2026   —
```

**Bulk Send Button:** Opens modal → paste phone numbers (one per line) or upload CSV → [Send All]

---

## New Environment Variables

```bash
TWILIO_ACCOUNT_SID=ACxxx...
TWILIO_AUTH_TOKEN=...
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
```

**Setting up Twilio WhatsApp:**
1. Sign up at twilio.com → Console → Messaging → WhatsApp Sandbox (for testing)
2. WhatsApp Business (for production): apply through Twilio or Meta directly
3. Configure webhook URL in Twilio: `https://truststack.in/api/whatsapp/webhook`

---

## Install

```bash
npm install twilio
```

---

## Testing

1. Configure consent widget (M2) → enable WhatsApp, set Twilio sandbox number
2. POST `/api/whatsapp/send-consent-request` with test phone → WhatsApp message received
3. Reply "YES" from phone → webhook fires → consent recorded in consent_records (channel='whatsapp')
4. `/dashboard/consent` → WhatsApp tab → session shows "Consented"
5. Reply "STOP" → consent withdrawn → state = 'withdrawn'
6. Bulk send 5 numbers → all receive message
7. Invalid Twilio signature → webhook returns 403 (security check)
8. `npm run type-check` → 0 errors; `npm audit` → 0 vulnerabilities

---

## After Completion

1. Update `progress.md` — M15 WhatsApp Consent ✅ Complete
2. Update `MASTER_CONTEXT.md` — add M15 section
3. Update `tracker-data.json` — M15 status → "built"
4. Apply SQL: new columns on consent_configs + consent_records + whatsapp_consent_sessions table
5. Add TWILIO env vars to `.env.local` + Vercel
6. Git commit + push + PR + merge + tag `v2.5.0`
