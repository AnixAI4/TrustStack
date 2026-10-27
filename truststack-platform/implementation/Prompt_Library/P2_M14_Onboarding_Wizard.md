# P2 — M14: Onboarding Wizard
## Self-service setup: 6-step guided onboarding after signup

**Session:** P2 — M14  
**Phase:** P2 — Commercialization  
**Priority:** Removes dependency on Anix AI team for every new customer  
**Estimated time:** 1 session (~2.5 hours)  
**Branch:** `feature/p2-m14-onboarding-wizard`  
**Tag after completion:** `v2.4.0`  
**Prerequisites:** M11 Team Management + M12 Billing Engine complete

---

## READ FIRST
Read: `implementation/MASTER_CONTEXT.md` + `implementation/progress.md`

---

## What to Build

When a new organization signs up, they land in the dashboard with no context about what to do first. M14 adds a 6-step wizard that guides them from signup to first compliance action — without any Anix AI involvement.

**Trigger:** After first login, if `organizations.onboarding_complete = false` → redirect to `/onboarding`

---

## Database Changes

Add column to `organizations` table:

```sql
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS onboarding_complete BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS onboarding_step_completed INTEGER NOT NULL DEFAULT 0;
```

(No new table — onboarding state lives on the org record.)

---

## 6-Step Wizard

### Step 1: Company Profile
Collect info not gathered at signup:
- Company legal name (required)
- Company website (optional)
- Industry (dropdown: Healthcare / Financial Services / ITES / E-commerce / Education / Manufacturing / Other)
- Employee count (1 / 2–10 / 11–50 / 51–200 / 201–500 / 500+)
- Has a DPO? (Yes / No / Outsourced)
- DPDP compliance starting point (Just starting / Partially compliant / Need an audit)

**Saves to:** `organizations` table (new columns: `industry`, `employee_count`, `has_dpo`, `compliance_starting_point`)

### Step 2: Run DPDP Compass™ Assessment
"Let's start with a 45-question assessment to understand your current compliance posture."

- [Start Assessment] button → opens assessment in same page (embedded, not navigation)
- Mini version: same M1 questions but in wizard UI (no sidebar)
- After completion: shows score + top 3 gaps inline
- [Continue to next step] enabled after score loads

### Step 3: Invite Your DPO (or note you don't have one)
"Every DPDP-compliant organization needs a Data Protection Officer."

**If has_dpo = Yes or Outsourced:**
- Email input for DPO
- [Send DPO Invite] → calls existing M11 invite API with role='dpo'
- Shows: "Invite sent to dpo@company.com. They'll receive an email to join."

**If has_dpo = No:**
- "You can still proceed. We recommend designating someone as your DPO."
- Option: "Learn about our DPO-as-a-Service" → link (opens in new tab, no redirect)
- [Skip for now] → continues

### Step 4: Set Up Your First Consent Widget
"Start collecting DPDP-compliant consent from your website visitors."

- Short form: Consent purpose (Marketing / Analytics / Functional / All)
- Language (English / Hindi / Tamil / Telugu / ...)
- Retention period (6 months / 1 year / 2 years / Until withdrawn)
- [Create Consent Config] → calls M2 API
- Shows embed code snippet
- [I'll embed this later] → continue

### Step 5: Choose Your Plan
"TrustStack™ works best with a plan. Start a trial or explore Pay-As-You-Go."

- Show plan cards (from DB via M12 `/api/billing/plans`)
- Highlight recommended plan based on employee_count:
  - 1 person → Micro
  - 2–10 → Starter
  - 11–50 → Growth
  - 51–500 → Business
  - 500+ → Enterprise
- [Start Free Trial] (for plans with trial_days > 0)
- [Continue with PAYG] → no plan selected, PAYG only
- [I'll decide later] → continues with whatever auto-trial was created in M12

### Step 6: You're Ready!
Completion screen:
- Compass Score badge (from Step 2)
- Quick links to: Run first DSR | Configure Privacy Notice | Invite team members
- [Go to Dashboard] → sets `organizations.onboarding_complete = true` → redirect to `/dashboard/overview`

---

## Wizard Route Structure

```
src/app/onboarding/
  page.tsx              ← Step router (state machine)
  layout.tsx            ← Simple layout: logo + progress bar, no sidebar
  steps/
    Step1_Profile.tsx
    Step2_Assessment.tsx
    Step3_InviteDPO.tsx
    Step4_ConsentWidget.tsx
    Step5_PlanSelection.tsx
    Step6_Complete.tsx
```

---

## Progress Persistence

Don't lose progress if user closes the tab mid-wizard. Save each step to DB:

```typescript
// After completing each step:
await supabase
  .from('organizations')
  .update({ onboarding_step_completed: stepNumber })
  .eq('id', org.id);
```

When returning to `/onboarding`, resume from `onboarding_step_completed + 1`.

---

## Middleware: Auto-Redirect to Onboarding

In `src/middleware.ts`, add after auth check:

```typescript
// After confirmed authenticated user:
if (!org.onboarding_complete && pathname !== '/onboarding' && !pathname.startsWith('/api')) {
  return NextResponse.redirect(new URL('/onboarding', request.url));
}
```

Exception: If user is accepting a team invite (`/invite/accept`), skip the redirect.

---

## Skip Onboarding (for power users)

Small "Skip setup" link at the bottom of the wizard layout — sets `onboarding_complete = true` immediately and redirects to dashboard. Never block a user from their data.

---

## Testing

1. Create new org via signup → immediately redirected to `/onboarding`
2. Complete Step 1 (company profile) → close tab → reopen → wizard resumes at Step 2
3. Step 2: complete assessment → score appears inline → [Continue] enabled
4. Step 3: send DPO invite → email sent (check Resend) → [Continue]
5. Step 4: create consent config → embed code appears → [I'll embed this later]
6. Step 5: select Starter plan → trial started → [Continue]
7. Step 6: completion screen → [Go to Dashboard] → lands in dashboard, no more /onboarding redirect
8. Skip: click "Skip setup" on step 2 → immediately lands in dashboard
9. Existing admin (onboarding_complete=true) → NOT redirected to /onboarding

---

## After Completion

1. Update `progress.md` — M14 Onboarding Wizard ✅ Complete
2. Update `MASTER_CONTEXT.md` — add M14 section (new columns on organizations, new routes)
3. Update `tracker-data.json` — M14 status → "built"
4. Run SQL: `ALTER TABLE organizations ADD COLUMN ...`
5. Git commit + push + PR + merge + tag `v2.4.0`
