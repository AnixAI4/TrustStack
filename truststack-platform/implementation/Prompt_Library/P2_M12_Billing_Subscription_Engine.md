# P2 — M12: Billing + Subscription Engine
## Razorpay integration, plan selection, trial management, feature gates

**Session:** P2 — M12  
**Phase:** P2 — Commercialization  
**Priority:** Revenue enablement — cannot charge customers without this  
**Estimated time:** 2 sessions (~5–6 hours total — most complex P2 module)  
**Branch:** `feature/p2-m12-billing-engine`  
**Tag after completion:** `v2.2.0`  
**Prerequisites:** M11 Team Management complete (seat limits reference plan)

---

## READ FIRST
Read: `implementation/MASTER_CONTEXT.md` + `implementation/progress.md` + `implementation/Implementation_Planner/08_Subscription_Engine_Design.md` (full DB schema + gateway abstraction is defined there)

---

## What to Build

Full subscription lifecycle:
1. Plan listing (public pricing page)
2. Organization selects a plan → Razorpay checkout
3. Razorpay webhook updates subscription status
4. Trial management (days from DB, never hardcoded)
5. Feature gate: every billable action in M1–M10 now checks subscription before proceeding
6. Billing dashboard: current plan, usage, upgrade/cancel

---

## Database (from `08_Subscription_Engine_Design.md`)

**New file: `db/billing.sql`**

Apply ALL schemas from `08_Subscription_Engine_Design.md` §1:
- `subscription_plans` + seed data (6 tiers)
- `org_subscriptions`
- `payment_gateway_configs` + seed data
- `usage_events`

(PAYG tables `payg_credit_wallets`, `payg_feature_prices`, `credit_transactions` go in M13)

---

## Files to Create

### Gateway Abstraction (from `08_Subscription_Engine_Design.md` §2)

```
src/lib/billing/
  gateway.interface.ts       ← PaymentGateway interface + types
  razorpay.gateway.ts        ← Razorpay implementation
  gateway.factory.ts         ← getPaymentGateway() factory function
  feature-gate.ts            ← checkFeatureAccess() + recordFeatureUsage()
  subscription.ts            ← getOrgSubscription(), getOrgPlan(), isTrialing()
```

**`razorpay.gateway.ts`** — implement all methods of `PaymentGateway` interface using `razorpay` npm package.

Install:
```bash
npm install razorpay
npm install --save-dev @types/razorpay
```

### API Routes

```
src/app/api/billing/
  plans/route.ts             ← GET — list all active plans (PUBLIC, no auth)
  subscription/
    route.ts                 ← GET — org's current subscription + plan details
    create/route.ts          ← POST — create Razorpay subscription
    upgrade/route.ts         ← POST — upgrade/downgrade plan
    cancel/route.ts          ← POST — cancel at period end
    webhook/route.ts         ← POST — Razorpay webhook (UNAUTH but HMAC-verified)
  usage/route.ts             ← GET — current month usage by feature
```

### UI Pages

```
src/app/dashboard/billing/
  page.tsx                   ← Current plan, usage, upgrade CTA, invoice history
  upgrade/page.tsx           ← Plan comparison table + Razorpay checkout

src/app/(public)/pricing/
  page.tsx                   ← Public pricing page (no auth required)

src/components/modules/billing/
  PlanCard.tsx               ← Plan features + price + CTA
  UsageBar.tsx               ← Feature usage progress bar (used/limit)
  BillingOverview.tsx        ← Current plan summary + days remaining in trial
  PlanComparisonTable.tsx    ← Full feature comparison across all plans
```

---

## Key Implementation Details

### Trial Period (from DB — NEVER hardcoded)

```typescript
// src/lib/billing/subscription.ts
export async function startTrialForOrg(orgId: string, planName: string): Promise<void> {
  // Get plan from DB (including trial_days)
  const { data: plan } = await adminSupabase
    .from('subscription_plans')
    .select('id, trial_days')
    .eq('name', planName)
    .single();

  const trialDays = plan.trial_days; // From DB — not hardcoded
  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + trialDays);

  await adminSupabase.from('org_subscriptions').insert({
    organization_id: orgId,
    plan_id: plan.id,
    status: trialDays > 0 ? 'trialing' : 'active',
    trial_starts_at: trialDays > 0 ? new Date().toISOString() : null,
    trial_ends_at: trialDays > 0 ? trialEndsAt.toISOString() : null,
    gateway: 'razorpay',
  });
}
```

### Razorpay Subscription Flow

```typescript
// POST /api/billing/subscription/create
// 1. Get org's current plan request
// 2. Create Razorpay customer (if not exists)
// 3. Create Razorpay subscription with plan_id
// 4. Return { orderId, checkoutUrl } — client opens Razorpay checkout
// 5. Client completes payment → Razorpay sends webhook

// POST /api/billing/subscription/webhook (UNAUTH)
// 1. Verify HMAC: razorpay.webhooks.verify(body, sig, secret) → throws if invalid
// 2. Parse event type
// 3. Handle:
//    'subscription.activated' → status: 'active', period dates
//    'subscription.charged' → update period dates, record payment
//    'subscription.halted' → status: 'past_due', send email
//    'subscription.cancelled' → status: 'canceled'
// 4. Return 200 (must respond fast — Razorpay retries on non-200)
```

### Feature Gate (backfill M1–M10)

After implementing `checkFeatureAccess()` and `recordFeatureUsage()` in `src/lib/billing/feature-gate.ts`, add gate calls to these existing routes:

| Route | Feature Key | Record Usage? |
|---|---|---|
| `/api/assessment/submit` | `m1_assessments_per_year` | Yes, after submit |
| `/api/consent/record` | `m2_consents_monthly` | Yes, per event |
| `/api/notice/publish` | `m3_notices` | Yes, per notice |
| `/api/grievance/submit` | `m4_grievance` | Check access only |
| `/api/dsr/submit` | `m5_dsr_monthly` | Yes, per request |
| `/api/ropa/entries` (POST) | `m6_ropa` | Check access only |
| `/api/vendors` (POST) | `m7_vendors` | Yes, per vendor |
| `/api/breach/log` | `m8_breach` | Check access only |
| `/api/board/generate` | `m9_board_pdf_monthly` | Yes, per generation |
| `/api/chat` | `m10_trustchat_monthly` | Yes, per message |

**Pattern:**
```typescript
// Before the main logic in each route:
const { org } = await requireOrgMember(req); // existing auth
const access = await checkFeatureAccess(org.id, 'm5_dsr_monthly');
if (!access.allowed) {
  return NextResponse.json({
    error: 'Monthly DSR limit reached',
    limit: access.limit,
    used: access.used,
    upgradeUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing/upgrade`,
  }, { status: 402 });
}
// ... rest of route logic
await recordFeatureUsage(org.id, 'dsr_request', 1, dsr.id);
```

---

## Billing Dashboard UI

### `/dashboard/billing`

```
TrustStack™ Billing                                    [Upgrade Plan]
─────────────────────────────────────────────────────────────────

Current Plan: Starter                    ₹75,000/year
Status: Active                           Renews: Jan 15, 2027

─────────────────────────────────────────────────────────────────
Feature Usage (This Month)
─────────────────────────────────────────────────────────────────
Compass Assessments     ████░░ 1 / 2 per year
Consent Events          ██░░░░ 12,450 / 50,000/month
DSR Requests            ░░░░░░ 0 / 10/month
Board Report PDFs       ██░░░░ 1 / 2/month
TrustChat Messages      █████░ 187 / 200/month

─────────────────────────────────────────────────────────────────
[Cancel Subscription]                    [Download Invoice]
```

### `/dashboard/billing/upgrade` — Plan Comparison

Full table comparing: Micro | Starter | Growth | Business | Enterprise  
Feature rows: all 15 feature keys from `subscription_plans.features`  
Prices from DB (not hardcoded)  
[Subscribe Now] or [Start Trial] CTA per plan, launches Razorpay checkout

---

## New Environment Variables

```bash
PAYMENT_GATEWAY=razorpay
RAZORPAY_KEY_ID=rzp_live_...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...
```

Add to `.env.local` AND Vercel.

---

## Seed Data (from `08_Subscription_Engine_Design.md` §6)

Run the full INSERT statements for `subscription_plans` and `payment_gateway_configs` after applying `db/billing.sql` in Supabase.

---

## Auto-Onboard Existing Orgs

After M12 deploys, any existing orgs (created before billing was built) won't have a subscription record. Handle with a backfill:

```typescript
// src/lib/billing/subscription.ts
export async function ensureOrgHasSubscription(orgId: string): Promise<void> {
  const { data } = await adminSupabase
    .from('org_subscriptions')
    .select('id')
    .eq('organization_id', orgId)
    .single();
  
  if (!data) {
    // Give existing orgs a free Starter trial (14 days) to migrate
    await startTrialForOrg(orgId, 'starter');
  }
}
```

Call this in the main dashboard layout server component.

---

## Testing

1. Visit `/pricing` unauthenticated → plan cards load from DB
2. Sign in → `/dashboard/billing` → shows current plan (auto-created trial)
3. Click Upgrade → plan comparison table → select Growth
4. Razorpay checkout opens → complete test payment (use Razorpay test credentials)
5. Webhook fires → subscription status updates to 'active'
6. `/dashboard/billing` → shows Growth plan, new limits
7. Submit 11 DSR requests (Starter limit is 10) → 11th returns 402 with upgradeUrl
8. Cancel subscription → status shows 'cancels at period end'
9. `npm run type-check` → 0 errors; `npm audit` → 0 vulnerabilities

---

## After Completion

1. Update `progress.md` — M12 Billing Engine ✅ Complete
2. Update `MASTER_CONTEXT.md` — add M12 section + new env vars + new tables
3. Update `tracker-data.json` — M12 status → "built"
4. Apply SQL: `db/billing.sql` in Supabase + run seed INSERT statements
5. Backfill existing orgs with trial subscriptions
6. Git commit + push + PR + merge + tag `v2.2.0`
