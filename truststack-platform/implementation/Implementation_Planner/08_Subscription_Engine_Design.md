# TrustStack™ — Subscription Engine Technical Design
## Gateway Abstraction + Usage Metering + Configurable Plans

**Version:** 1.0 — June 2026  
**Implements:** M12 (Billing Engine) + M13 (PAYG Credits Engine)  
**Key Constraint:** Everything configurable in DB. Gateway is swappable. No hardcoded prices/limits.

---

## 1. Database Schema

### `subscription_plans` (configurable in DB — never hardcoded)
```sql
CREATE TABLE subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,                        -- 'micro' | 'starter' | 'growth' | 'business' | 'enterprise'
  display_name TEXT NOT NULL,                -- 'Micro', 'Starter', etc.
  price_inr INTEGER NOT NULL DEFAULT 0,      -- Annual price in paise (₹12,000 = 1200000)
  billing_cycle TEXT NOT NULL DEFAULT 'annual', -- 'monthly' | 'annual'
  trial_days INTEGER NOT NULL DEFAULT 0,     -- Configurable! Not hardcoded.
  is_payg_only BOOLEAN NOT NULL DEFAULT FALSE, -- true for PAYG-only accounts
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  features JSONB NOT NULL DEFAULT '{}',      -- { "m1_assessments": -1, "m2_consents_monthly": 50000, ... }
                                              -- -1 = unlimited, 0 = not included, N = limit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Feature keys in `features` JSONB:
-- m1_assessments_per_year: -1 | N
-- m2_consents_monthly: -1 | N
-- m3_notices: -1 | N
-- m4_grievance: true | false
-- m5_dsr_monthly: -1 | N
-- m6_ropa: true | false
-- m7_vendors: -1 | N
-- m8_breach: true | false
-- m9_board_pdf_monthly: -1 | N
-- m10_trustchat_monthly: -1 | N
-- m11_user_seats: -1 | N
-- m12_billing: true | false (always true for paid plans)
-- m15_whatsapp: true | false
-- m16_aadhaar: true | false
-- m17_trust_center: true | false
-- m18_alerts: true | false
-- m20_sector_packs: [] (list of included sectors)
-- m21_academy: true | false
-- m23_dpo_advisory_hours_monthly: 0 | N
-- m24_dsr_connectors: true | false
-- m25_api_calls_monthly: -1 | N
-- support_sla_hours: 48 | 24 | 8 | 4 | 2
-- multi_org: true | false
-- languages: -1 | N
```

### `org_subscriptions`
```sql
CREATE TABLE org_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES subscription_plans(id),
  status TEXT NOT NULL DEFAULT 'trialing',   -- 'trialing' | 'active' | 'past_due' | 'canceled' | 'paused'
  trial_starts_at TIMESTAMPTZ,
  trial_ends_at TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  gateway TEXT NOT NULL DEFAULT 'razorpay',  -- 'razorpay' | 'stripe' | 'ccavenue' | 'manual'
  gateway_customer_id TEXT,                  -- Razorpay customer ID
  gateway_subscription_id TEXT,             -- Razorpay subscription ID
  discount_code TEXT,
  discount_percent INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id)                    -- One active subscription per org
);
```

### `payg_credit_wallets`
```sql
CREATE TABLE payg_credit_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE UNIQUE,
  balance_paise BIGINT NOT NULL DEFAULT 0,         -- Current balance in paise
  total_purchased_paise BIGINT NOT NULL DEFAULT 0,
  total_used_paise BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `payg_feature_prices` (configurable — never hardcoded)
```sql
CREATE TABLE payg_feature_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_key TEXT UNIQUE NOT NULL,           -- 'compass_assessment' | 'consent_event' | 'dsr_request' | ...
  display_name TEXT NOT NULL,
  price_paise INTEGER NOT NULL,               -- Price per unit in paise (₹4,000 = 400000)
  unit TEXT NOT NULL DEFAULT 'per_use',       -- 'per_use' | 'per_event' | 'per_month'
  minimum_charge_paise INTEGER DEFAULT 0,     -- Minimum monthly charge (consent: ₹500 min)
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `usage_events` (metering log)
```sql
CREATE TABLE usage_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  feature_key TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price_paise INTEGER NOT NULL,
  total_paise INTEGER NOT NULL,
  billing_source TEXT NOT NULL DEFAULT 'subscription', -- 'subscription' | 'payg'
  reference_id TEXT,                          -- e.g., assessment_id, dsr_request_id
  created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Index: (organization_id, feature_key, created_at) for monthly aggregation
```

### `credit_transactions`
```sql
CREATE TABLE credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  type TEXT NOT NULL,                         -- 'purchase' | 'usage' | 'refund' | 'bonus' | 'adjustment'
  amount_paise BIGINT NOT NULL,               -- positive = added, negative = deducted
  balance_after_paise BIGINT NOT NULL,
  description TEXT NOT NULL,
  feature_key TEXT,                           -- null for purchases
  gateway_order_id TEXT,                      -- for purchases
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `payment_gateway_configs` (add new gateways without code changes)
```sql
CREATE TABLE payment_gateway_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,                  -- 'razorpay' | 'stripe' | 'ccavenue'
  display_name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT FALSE,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  supports_inr BOOLEAN NOT NULL DEFAULT TRUE,
  supports_usd BOOLEAN NOT NULL DEFAULT FALSE,
  supports_subscriptions BOOLEAN NOT NULL DEFAULT TRUE,
  supports_one_time BOOLEAN NOT NULL DEFAULT TRUE,
  config JSONB NOT NULL DEFAULT '{}',         -- gateway-specific config (key IDs etc — NOT secrets)
  created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Secrets (API keys) are NEVER in DB — they're in env vars: RAZORPAY_KEY_ID, STRIPE_SECRET_KEY etc.
```

---

## 2. Payment Gateway Abstraction Layer

```typescript
// src/lib/billing/gateway.interface.ts
export interface PaymentGatewayCustomer {
  gatewayCustomerId: string;
  email: string;
  name: string;
}

export interface PaymentGatewaySubscription {
  gatewaySubscriptionId: string;
  status: 'active' | 'trialing' | 'past_due' | 'canceled';
  currentPeriodEnd: Date;
}

export interface PaymentGatewayOrder {
  gatewayOrderId: string;
  amount: number;  // in paise
  currency: string;
  checkoutUrl?: string;
}

export interface PaymentGateway {
  name: string;
  
  createCustomer(email: string, name: string): Promise<PaymentGatewayCustomer>;
  
  createSubscription(
    customerId: string,
    planExternalId: string,   // gateway's plan/price ID
    trialDays: number,
    metadata: Record<string, string>
  ): Promise<PaymentGatewaySubscription>;
  
  cancelSubscription(subscriptionId: string, atPeriodEnd: boolean): Promise<void>;
  
  createOrder(amountPaise: number, description: string, metadata: Record<string, string>): Promise<PaymentGatewayOrder>;
  
  verifyWebhookSignature(payload: string, signature: string, secret: string): boolean;
  
  parseWebhookEvent(payload: string): PaymentGatewayEvent;
}

export interface PaymentGatewayEvent {
  type: 'subscription.activated' | 'subscription.charged' | 'subscription.halted' | 
        'payment.captured' | 'payment.failed' | 'subscription.cancelled';
  subscriptionId?: string;
  orderId?: string;
  metadata: Record<string, string>;
}
```

```typescript
// src/lib/billing/razorpay.gateway.ts — V1 implementation
// src/lib/billing/stripe.gateway.ts — V2 (add when needed)
// src/lib/billing/ccavenue.gateway.ts — V3 (add when needed)

// Factory — change the active gateway with 1 env var: PAYMENT_GATEWAY=razorpay
// src/lib/billing/gateway.factory.ts
export function getPaymentGateway(): PaymentGateway {
  const gatewayName = process.env.PAYMENT_GATEWAY ?? 'razorpay';
  switch (gatewayName) {
    case 'razorpay': return new RazorpayGateway();
    case 'stripe': return new StripeGateway();      // implement when needed
    case 'ccavenue': return new CCAvenuGateway();   // implement when needed
    default: throw new Error(`Unknown payment gateway: ${gatewayName}`);
  }
}
```

---

## 3. Feature Gate System

```typescript
// src/lib/billing/feature-gate.ts
// Server-side only. Call at the start of any API route to check access.

export async function checkFeatureAccess(
  orgId: string,
  featureKey: string
): Promise<{ allowed: boolean; limit?: number; used?: number; billingSource: 'subscription' | 'payg' | 'none' }> {
  // 1. Get org's current subscription
  // 2. Check if feature is included in plan (from subscription_plans.features JSONB)
  // 3. If included: check usage against limit for current period
  // 4. If not included: check PAYG wallet balance > feature price
  // 5. Return allowed/blocked + reason
}

export async function recordFeatureUsage(
  orgId: string,
  featureKey: string,
  quantity: number,
  referenceId?: string
): Promise<void> {
  // Deduct from subscription quota OR deduct from PAYG wallet
  // Write to usage_events + credit_transactions (for PAYG)
}
```

---

## 4. API Routes (M12 + M13)

```
/api/billing/plans                    GET  — list all active plans (public)
/api/billing/subscription             GET  — org's current subscription
/api/billing/subscription/create      POST — create subscription (Razorpay)
/api/billing/subscription/upgrade     POST — upgrade/downgrade plan
/api/billing/subscription/cancel      POST — cancel at period end
/api/billing/subscription/webhook     POST — Razorpay webhook handler (UNAUTH — gateway-signed)
/api/billing/credits/balance          GET  — PAYG wallet balance + transactions
/api/billing/credits/topup            POST — create Razorpay order for credit purchase
/api/billing/credits/verify           POST — verify payment + credit wallet
/api/billing/usage                    GET  — usage breakdown by feature (current month)
/api/billing/invoices                 GET  — invoice list (future)
```

---

## 5. Environment Variables (add to .env.local)

```bash
# Payment Gateway (default: razorpay)
PAYMENT_GATEWAY=razorpay

# Razorpay
RAZORPAY_KEY_ID=rzp_live_...         # Public key (safe to expose in webhook verification)
RAZORPAY_KEY_SECRET=...               # Secret — NEVER expose
RAZORPAY_WEBHOOK_SECRET=...           # Webhook signing secret

# Future: Stripe (when international customers arrive)
# STRIPE_SECRET_KEY=sk_live_...
# STRIPE_WEBHOOK_SECRET=whsec_...

# Future: CCAvenue (if needed)
# CCAVENUE_MERCHANT_ID=...
# CCAVENUE_ACCESS_CODE=...
# CCAVENUE_WORKING_KEY=...
```

---

## 6. Seed Data (run after applying schema)

```sql
-- Default subscription plans
INSERT INTO subscription_plans (name, display_name, price_inr, trial_days, features) VALUES
('micro', 'Micro', 1200000, 0, '{
  "m1_assessments_per_year": 1,
  "m4_grievance": true,
  "m10_trustchat_monthly": 50,
  "m9_board_pdf_monthly": 0,
  "m11_user_seats": 1,
  "support_sla_hours": 48
}'),
('starter', 'Starter', 7500000, 14, '{
  "m1_assessments_per_year": 2,
  "m2_consents_monthly": 50000,
  "m3_notices": 1,
  "m4_grievance": true,
  "m5_dsr_monthly": 10,
  "m9_board_pdf_monthly": 2,
  "m10_trustchat_monthly": 200,
  "m11_user_seats": 2,
  "languages": 3,
  "support_sla_hours": 24
}'),
('growth', 'Growth', 20000000, 14, '{
  "m1_assessments_per_year": -1,
  "m2_consents_monthly": 500000,
  "m3_notices": -1,
  "m4_grievance": true,
  "m5_dsr_monthly": -1,
  "m6_ropa": true,
  "m7_vendors": 25,
  "m8_breach": true,
  "m9_board_pdf_monthly": -1,
  "m10_trustchat_monthly": -1,
  "m11_user_seats": 5,
  "languages": 4,
  "support_sla_hours": 8
}');

-- Default PAYG feature prices
INSERT INTO payg_feature_prices (feature_key, display_name, price_paise, unit, minimum_charge_paise) VALUES
('compass_assessment', 'DPDP Compass Assessment', 400000, 'per_use', 0),
('privacy_notice', 'Privacy Notice (hosted 1yr)', 300000, 'per_use', 0),
('consent_event', 'Consent Event', 1000, 'per_event', 50000),
('dsr_request', 'DSR Request Processing', 50000, 'per_use', 0),
('vendor_assessment', 'Vendor Assessment + DPA', 150000, 'per_use', 0),
('breach_incident', 'Breach DPBI Notification', 500000, 'per_use', 0),
('board_report_pdf', 'Board Report PDF', 200000, 'per_use', 0),
('grievance_portal', 'Grievance Officer Portal', 100000, 'per_month', 0),
('trustchat_question', 'TrustChat Q&A', 1000, 'per_use', 0),
('ropa_entry', 'ROPA Entry', 20000, 'per_use', 0);

-- Seed payment gateway configs
INSERT INTO payment_gateway_configs (name, display_name, is_active, is_default, supports_inr, supports_usd) VALUES
('razorpay', 'Razorpay', true, true, true, false),
('stripe', 'Stripe', false, false, true, true),
('ccavenue', 'CCAvenue', false, false, true, false);
```

---

## 7. Session Prompt Files for M12 + M13

- `Prompt_Library/P2_M12_Billing_Subscription_Engine.md` — Implements billing engine with Razorpay + gateway abstraction layer
- `Prompt_Library/P2_M13_PAYG_Credits_Engine.md` — Implements PAYG credit wallet + usage metering + auto-suggest upgrade

**Build Order:** M11 (team management, needs user seats) → M12 (subscription engine) → M13 (PAYG credits) → M14 (onboarding wizard that knows subscription tier)
