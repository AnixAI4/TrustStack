# P2 — M13: PAYG Credits Engine
## Credit wallet, usage metering, auto-upgrade prompt

**Session:** P2 — M13  
**Phase:** P2 — Commercialization  
**Priority:** Enables 1-person companies to use TrustStack™ without a subscription  
**Estimated time:** 1 session (~2.5 hours)  
**Branch:** `feature/p2-m13-payg-credits`  
**Tag after completion:** `v2.3.0`  
**Prerequisites:** M12 Billing Engine complete (uses same gateway abstraction + feature-gate.ts)

---

## READ FIRST
Read: `implementation/MASTER_CONTEXT.md` + `implementation/progress.md` + `implementation/Implementation_Planner/08_Subscription_Engine_Design.md` §1 (PAYG tables schema)

---

## What to Build

Pay-As-You-Go credit wallet for organizations that:
- Don't want a subscription
- Want to try individual features first
- Are on Micro plan and need occasional extras

**User experience:** Buy credits (₹5,000 credit pack → ₹5,000 of credit). Each feature use deducts from wallet. When balance is low, prompt to top up or subscribe.

---

## Database Schema (from `08_Subscription_Engine_Design.md` §1)

**Add to `db/billing.sql`** (or create `db/payg.sql`):

- `payg_credit_wallets` — one wallet per org
- `payg_feature_prices` — configurable per-feature prices (not hardcoded)
- `credit_transactions` — debit/credit ledger

See full SQL in `08_Subscription_Engine_Design.md`. Apply in Supabase.

**Seed `payg_feature_prices`** (from the same doc's §6 seed data).

---

## Files to Create

```
src/lib/billing/
  payg.ts                   ← getWalletBalance(), deductCredits(), recordPurchase()

src/app/api/billing/credits/
  balance/route.ts          ← GET — wallet balance + recent transactions
  topup/route.ts            ← POST — create Razorpay order for credit purchase
  verify/route.ts           ← POST — verify payment + credit wallet

src/components/modules/billing/
  WalletBalance.tsx         ← Balance card with top-up button
  CreditHistory.tsx         ← Debit/credit transaction list
  PaygPricingTable.tsx      ← Per-feature PAYG prices (from DB)
```

---

## Key Implementation Details

### PAYG vs Subscription in `checkFeatureAccess()`

Update `src/lib/billing/feature-gate.ts` (created in M12) to handle PAYG:

```typescript
export async function checkFeatureAccess(orgId: string, featureKey: string) {
  // 1. Get org subscription
  const subscription = await getOrgSubscription(orgId);
  
  // 2. If on active subscription: check plan feature limit
  if (subscription?.status === 'active' || subscription?.status === 'trialing') {
    const plan = await getPlanById(subscription.plan_id);
    const limit = plan.features[featureKey];
    if (limit === -1) return { allowed: true, billingSource: 'subscription' }; // unlimited
    if (limit === 0 || limit === false) {
      // Feature not in plan → check PAYG wallet
      return await checkPaygAccess(orgId, featureKey);
    }
    // Check usage against limit
    const used = await getUsageThisPeriod(orgId, featureKey);
    if (used < limit) return { allowed: true, billingSource: 'subscription', limit, used };
    // Limit exceeded → fall through to PAYG
    return await checkPaygAccess(orgId, featureKey);
  }
  
  // 3. No active subscription → check PAYG wallet
  return await checkPaygAccess(orgId, featureKey);
}

async function checkPaygAccess(orgId: string, featureKey: string) {
  const [wallet, price] = await Promise.all([
    getWalletBalance(orgId),
    getPaygPrice(featureKey),
  ]);
  const allowed = wallet.balance_paise >= price.price_paise;
  return { allowed, billingSource: 'payg' as const, walletBalance: wallet.balance_paise, requiredBalance: price.price_paise };
}
```

### Credit Purchase Flow

```typescript
// POST /api/billing/credits/topup
// Body: { amount_inr: number } // e.g. 5000 = ₹5,000
// 1. Validate amount >= minimum (₹500)
// 2. Create Razorpay order (one-time payment, not subscription)
// 3. Return { orderId, amount, currency } → client opens Razorpay checkout

// POST /api/billing/credits/verify
// Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature }
// 1. Verify signature: hmac = createHmac('sha256', RAZORPAY_KEY_SECRET).update(`${orderId}|${paymentId}`).digest('hex')
// 2. signature === hmac → payment is genuine
// 3. Update payg_credit_wallets: balance_paise += amount_paise
// 4. Insert credit_transactions: type='purchase', amount_paise=+amount, description='Credit top-up'
// 5. Return { newBalance }
```

### Auto-Deduct in `recordFeatureUsage()`

Update `src/lib/billing/feature-gate.ts`:

```typescript
export async function recordFeatureUsage(orgId: string, featureKey: string, quantity: number, referenceId?: string) {
  const access = await checkFeatureAccess(orgId, featureKey);
  
  if (access.billingSource === 'subscription') {
    // Record to usage_events (for quota tracking)
    await adminSupabase.from('usage_events').insert({
      organization_id: orgId,
      feature_key: featureKey,
      quantity,
      unit_price_paise: 0,
      total_paise: 0,
      billing_source: 'subscription',
      reference_id: referenceId,
    });
  } else if (access.billingSource === 'payg') {
    // Deduct from wallet
    const price = await getPaygPrice(featureKey);
    const totalPaise = price.price_paise * quantity;
    
    // Atomic deduct (prevent race conditions):
    const { data: wallet } = await adminSupabase.rpc('deduct_payg_credits', {
      p_org_id: orgId,
      p_amount_paise: totalPaise,
    });
    
    // Record credit_transaction
    await adminSupabase.from('credit_transactions').insert({
      organization_id: orgId,
      type: 'usage',
      amount_paise: -totalPaise,
      balance_after_paise: wallet.new_balance,
      description: `${price.display_name} × ${quantity}`,
      feature_key: featureKey,
    });
    
    // Record usage_event
    await adminSupabase.from('usage_events').insert({
      organization_id: orgId,
      feature_key: featureKey,
      quantity,
      unit_price_paise: price.price_paise,
      total_paise: totalPaise,
      billing_source: 'payg',
      reference_id: referenceId,
    });
  }
}
```

Create the Supabase RPC function for atomic deduct:
```sql
CREATE OR REPLACE FUNCTION deduct_payg_credits(p_org_id UUID, p_amount_paise BIGINT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_balance BIGINT;
BEGIN
  UPDATE payg_credit_wallets
  SET balance_paise = balance_paise - p_amount_paise,
      total_used_paise = total_used_paise + p_amount_paise,
      updated_at = NOW()
  WHERE organization_id = p_org_id AND balance_paise >= p_amount_paise
  RETURNING balance_paise INTO v_new_balance;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient credits';
  END IF;
  
  RETURN jsonb_build_object('new_balance', v_new_balance);
END;
$$;
```

---

## UI: Wallet Section in `/dashboard/billing`

Add below existing subscription section:

```
─────────────────────────────────────────────────────────────────
Pay-As-You-Go Credit Wallet
─────────────────────────────────────────────────────────────────
Balance: ₹3,450.00

[+ Add Credits]

Recent Transactions:
Jun 26  Compass Assessment × 1      − ₹4,000
Jun 25  Credit Top-up               + ₹10,000
Jun 24  DSR Request × 1             − ₹500
Jun 23  Consent Event × 1,000       − ₹1,000

─────────────────────────────────────────────────────────────────
PAYG Feature Prices:
Compass Assessment      ₹4,000 / assessment
Privacy Notice          ₹3,000 / notice (hosted 1 year)
Consent Events          ₹1 / event (min ₹500/month)
DSR Request             ₹500 / request
Vendor Assessment       ₹1,500 / vendor
Breach DPBI Notice      ₹5,000 / incident
Board Report PDF        ₹2,000 / report
TrustChat Q&A           ₹1 / question
ROPA Entry              ₹200 / entry
```

### Top-up Modal

Amounts: ₹1,000 | ₹5,000 | ₹10,000 | ₹25,000 | Custom  
Payment: Razorpay checkout (one-time order, not subscription)

---

## Auto-Upgrade Prompt (when wallet is low)

When wallet balance drops below 20% of last top-up amount, show a banner on the dashboard:

```
⚠️ Your PAYG credits are running low (₹450 remaining).
Top up now or switch to Starter plan (₹75,000/year) for 
50,000 monthly consent events and unlimited TrustChat.
[Add Credits]  [View Plans]
```

---

## Testing

1. Sign in → `/dashboard/billing` → PAYG section shows ₹0 balance
2. Click [Add Credits] → ₹1,000 → Razorpay checkout → complete payment
3. Balance updates to ₹1,000
4. Submit a Compass Assessment → feature gate checks PAYG → deducts ₹4,000
   - Wait: ₹1,000 balance < ₹4,000 required → access BLOCKED with 402
5. Top up ₹5,000 → balance ₹5,000 → try assessment again → ALLOWED → deducts ₹4,000 → balance ₹1,000
6. Credit history shows: purchase +₹5,000, usage −₹4,000
7. Verify atomic deduct (concurrent requests): two simultaneous uses can't double-deduct below 0
8. Low-balance banner appears after deduction

---

## After Completion

1. Update `progress.md` — M13 PAYG Credits Engine ✅ Complete
2. Update `MASTER_CONTEXT.md` — add M13 section
3. Update `tracker-data.json` — M13 status → "built"
4. Apply SQL: payg tables + `deduct_payg_credits` RPC + seed `payg_feature_prices`
5. Git commit + push + PR + merge + tag `v2.3.0`
