# Phase P2 — Commercialization
## Revenue-generating features: Billing, Team, Onboarding, WhatsApp, Trust Center

**Phase:** P2  
**Status:** 🔲 Not Started  
**Prerequisites:** All P1.5 fixes complete + v1.5.4 tagged  
**Version range:** v2.1.0 → v2.10.0  
**Target completion:** Milestone 2 (Public Launch, December 2026)

---

## Why P2?

P1.5 ensures the compliance engine is bug-free. P2 turns TrustStack™ into a commercial product:
- Organizations can **pay** (billing engine + PAYG credits)
- Multiple users per org can **collaborate** (team management)
- New customers can **onboard themselves** without Anix AI involvement
- Consent collection can happen on **WhatsApp** (where 500M Indians are)
- Any data principal can view an org's **Trust Center** (public compliance page)

P2 directly enables Milestone 2 (50–100 paying customers, ₹50–75L ARR).

---

## Module List

| Module | Name | Phase | Prompt File | Tag | Status |
|---|---|---|---|---|---|
| M11 | Team Management | P2 | `P2_M11_Team_Management.md` | v2.1.0 | 🔲 |
| M12 | Billing + Subscription Engine | P2 | `P2_M12_Billing_Subscription_Engine.md` | v2.2.0 | 🔲 |
| M13 | PAYG Credits Engine | P2 | `P2_M13_PAYG_Credits_Engine.md` | v2.3.0 | 🔲 |
| M14 | Onboarding Wizard | P2 | `P2_M14_Onboarding_Wizard.md` | v2.4.0 | 🔲 |
| M15 | WhatsApp Consent | P2 | `P2_M15_WhatsApp_Consent.md` | v2.5.0 | 🔲 |
| M16 | Aadhaar OTP Verification | P2 | `P2_M16_Aadhaar_OTP.md` | v2.6.0 | 🔲 |
| M17 | Trust Center (Public Page) | P2 | `P2_M17_Trust_Center.md` | v2.7.0 | 🔲 |
| M18 | Alert Center | P2 | `P2_M18_Alert_Center.md` | v2.8.0 | 🔲 |
| M19 | Re-Consent Campaign | P2 | `P2_M19_ReConsent_Campaign.md` | v2.9.0 | 🔲 |
| Tracker | Implementation Tracker Dashboard | P2 | `P2_Tracker_Dashboard.md` | v2.10.0 | 🔲 |

---

## Module Descriptions & Build Order

### M11 — Team Management (build first)
Multi-user support. Admin invites team members by email, assigns roles (admin/DPO/member/board), enforces seat limits from subscription plan.

**Why first:** M12 billing references seat limits (`m11_user_seats`). M14 onboarding wizard completes with user invite. Build order: M11 → M12 → M13 → M14.

**Key tables:** `organization_invites` (id, org_id, email, role, token, expires_at, accepted_at)  
**Routes:** POST /api/team/invite, GET /api/team/members, POST /api/team/accept/[token]  
**UI:** `/dashboard/team` — member list + invite button + role badges

### M12 — Billing + Subscription Engine (most complex)
Full subscription lifecycle: plan selection, Razorpay integration, webhook processing, trial management.

**Key tables:** `subscription_plans`, `org_subscriptions`, `payment_gateway_configs`  
**Gateway abstraction:** `PaymentGateway` interface + `RazorpayGateway` implementation + factory  
**Routes:** /api/billing/plans, /api/billing/subscription/create, /api/billing/subscription/webhook  
**UI:** `/dashboard/billing` — current plan, upgrade CTA, invoice history  
Full schema in `08_Subscription_Engine_Design.md`.

### M13 — PAYG Credits Engine
Credit wallet for organizations that don't want a subscription. Buy credits, use features, top up when low.

**Key tables:** `payg_credit_wallets`, `payg_feature_prices`, `usage_events`, `credit_transactions`  
**Routes:** /api/billing/credits/balance, /api/billing/credits/topup, /api/billing/credits/verify  
**Feature gate:** `checkFeatureAccess()` + `recordFeatureUsage()` — check before every billable action  
Full schema in `08_Subscription_Engine_Design.md`.

### M14 — Onboarding Wizard
Step-by-step guided setup for new organizations. Replaces manual configuration.

**Steps:** (1) Company profile → (2) Industry/size → (3) Run compass assessment → (4) Invite DPO → (5) First consent widget → (6) Plan selection  
**Key file:** `src/app/onboarding/page.tsx` (multi-step form)  
**Trigger:** Auto-redirect to /onboarding after first sign-up (only if org.onboarding_complete = false)

### M15 — WhatsApp Consent
Collect and record consent via WhatsApp Business API. Data principals can consent, withdraw, and receive receipts directly on WhatsApp.

**Integration:** Twilio WhatsApp Business API (or official WhatsApp Cloud API)  
**Key tables:** `whatsapp_consent_sessions` (maps WhatsApp number to consent_config)  
**Webhook:** POST /api/whatsapp/webhook (WhatsApp → TrustStack™)  
**UI:** Dashboard shows WhatsApp consent stats alongside web widget stats  
**Compliance:** WhatsApp consents stored in same `consent_records` table — unified record

### M16 — Aadhaar OTP Verification
Verify data principal identity via Aadhaar OTP before processing DSR, high-risk consent withdrawal, or breach communication.

**Integration:** UIDAI's eKYC API (or a licensed TSP like DigitSign, Perfios)  
**When used:** Optional layer on DSR submission + re-consent campaigns  
**Key tables:** `aadhaar_verifications` (reference, masked_aadhaar, verified_at, request_id)  
**Not blocking:** Feature-flagged; falls back to email OTP if Aadhaar API unavailable

### M17 — Trust Center (Public Page)
Per-organization public page showing their DPDP compliance status.

**URL:** `https://truststack.in/trust/{org-slug}` OR embedded on org's own website  
**Shows:** Compass Score badge, active privacy notices, grievance contact, DSR request link, consent preferences, breach disclosure (if any)  
**Key tables:** No new tables — reads from existing tables (consent_configs, privacy_notices, grievance public contact, assessment results)  
**Routes:** GET /api/trust/[slug] (public, no auth), GET /trust/[slug]/page.tsx  
**Competitive advantage:** Only DPDP platform with a per-org public trust page (DataGrail has this for GDPR, no India equivalent exists)

### M18 — Alert Center
Centralized notification hub for compliance alerts: DSR overdue, breach approaching 72hr, vendor assessment expiring, consent expiring, regulatory updates.

**Key tables:** `compliance_alerts` (org_id, type, severity, entity_id, resolved_at)  
**Alert types:** dsr_overdue, breach_72hr_approaching, vendor_assessment_due, consent_expiry, subscription_expiring, dpdp_update  
**Channels:** In-app notification bell + email  
**UI:** `/dashboard/alerts` — sortable/filterable alert list with severity badges

### M19 — Re-Consent Campaign
Bulk campaigns to re-obtain consent when privacy policy changes. Notifies data principals via email/SMS/WhatsApp, tracks re-consent rate.

**When used:** Privacy notice updated → org must re-obtain consent from affected data principals  
**Key tables:** `reconsent_campaigns` (org_id, consent_config_id, sent_at, total_sent, total_responded, total_consented, total_withdrawn)  
**Routes:** POST /api/consent/reconsent-campaign/create, GET /api/consent/reconsent-campaign/[id]/stats  
**UI:** Campaign dashboard with response rate metrics

### Tracker Dashboard (P2_Tracker_Dashboard.md)
Internal admin dashboard at `/dashboard/admin/tracker` showing all 35 modules + rollout status + session log.

Spec in `09_Tracker_Dashboard_Spec.md`. Build after M11-M19 (it reads tracker-data.json).

---

## P2 Dependencies Map

```
M11 (Team) → M12 (Billing) → M13 (PAYG) → M14 (Onboarding)
                    ↓
M15 (WhatsApp) — independent
M16 (Aadhaar) — independent
M17 (Trust Center) — reads M1+M2+M3+M4 data
M18 (Alerts) — reads all modules for alert triggers
M19 (Re-Consent) — requires M2 (Consent Management)
Tracker Dashboard — requires all tracker-data.json updates from M11-M19
```

---

## P2 Feature Gate Integration

Every billable action in M1–M10 must be wrapped with `checkFeatureAccess()` AFTER M12/M13 are built:

```typescript
// Example in M5 DSR submit:
const access = await checkFeatureAccess(org.id, 'm5_dsr_monthly');
if (!access.allowed) {
  return NextResponse.json({ error: 'DSR limit reached', upgradeUrl: '/dashboard/billing' }, { status: 402 });
}
// ... process DSR
await recordFeatureUsage(org.id, 'dsr_request', 1, dsrRequest.id);
```

This backfill of M1–M10 with feature gates should be done in the M12 session (or a dedicated FIX session after M12).

---

## P2 Tech Additions (new dependencies)

- `razorpay` npm package — for Razorpay Gateway V1
- `twilio` npm package — for WhatsApp Business API (M15)
- `@types/razorpay` — types

No new database beyond what's specified in `08_Subscription_Engine_Design.md` and individual module tables above.
