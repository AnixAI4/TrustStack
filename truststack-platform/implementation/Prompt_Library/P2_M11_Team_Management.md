# P2 — M11: Team Management
## Multi-user collaboration: invite, roles, seat limits

**Session:** P2 — M11  
**Phase:** P2 — Commercialization  
**Priority:** First P2 module — required before M12 (billing reads seat limits) and M14 (onboarding invites DPO)  
**Estimated time:** 1 session (~3 hours)  
**Branch:** `feature/p2-m11-team-management`  
**Tag after completion:** `v2.1.0`  
**Prerequisites:** All P1.5 fixes complete + v1.5.4 tagged

---

## READ FIRST
Read: `implementation/MASTER_CONTEXT.md` + `implementation/progress.md`

---

## What to Build

Multi-user support for organizations. Currently, TrustStack™ is single-user per org (only the admin who signed up). M11 adds:
- Admin can invite team members by email
- Invited users accept via email link + set password
- Roles: `admin`, `dpo`, `member`, `board`
- Seat limits enforced from subscription plan (hardcode limits for now — M12 billing will replace this)
- Admin can remove members + change roles

---

## Database Schema

**New file: `db/organization_invites.sql`**

```sql
-- Organization invites
CREATE TABLE organization_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'dpo', 'member', 'board')),
  token TEXT NOT NULL UNIQUE,           -- HMAC token for secure invite link
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  accepted_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, email)        -- one pending invite per email per org
);

ALTER TABLE organization_invites ENABLE ROW LEVEL SECURITY;

-- Admins and DPOs of the org can view invites
CREATE POLICY "org_admins_manage_invites" ON organization_invites
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('admin', 'dpo')
    )
  );

-- organization_members table (check if it already exists in MASTER_CONTEXT.md)
-- If it doesn't exist, create it:
CREATE TABLE IF NOT EXISTS organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'dpo', 'member', 'board')),
  invited_by UUID REFERENCES auth.users(id),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_members_can_view_members" ON organization_members
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM organization_members om2
      WHERE om2.user_id = auth.uid()
    )
  );

CREATE POLICY "org_admins_manage_members" ON organization_members
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM organization_members om2
      WHERE om2.user_id = auth.uid() AND om2.role = 'admin'
    )
  );
```

---

## API Routes

### POST `/api/team/invite`
**Auth:** Admin only  
**Body:** `{ email: string, role: 'admin' | 'dpo' | 'member' | 'board' }`

```typescript
// Validate: email not already a member of this org
// Validate: seat limit not exceeded (current members < plan.m11_user_seats)
// For now: hardcode seat limits: micro=1, starter=2, growth=5, business=10, enterprise=-1
// Generate HMAC token: crypto.createHmac('sha256', process.env.HMAC_SECRET!).update(`${orgId}:${email}:${Date.now()}`).digest('hex')
// Insert into organization_invites
// Send invite email via Resend with link: ${APP_URL}/invite/accept?token=${token}
// Return: { invite: { id, email, role, expires_at } }
```

### GET `/api/team/members`
**Auth:** Any org member  
**Returns:** `{ members: OrganizationMember[], pendingInvites: OrganizationInvite[] }`

### PATCH `/api/team/members/[userId]`
**Auth:** Admin only  
**Body:** `{ role: string }`  
**Returns:** Updated member

### DELETE `/api/team/members/[userId]`
**Auth:** Admin only  
**Guard:** Cannot remove yourself (the last admin)

### GET `/api/team/invite/[token]` (public — no auth)
**Returns:** Invite details (email, org name, role, expiry)  
**Uses:** Admin Supabase client (no user session exists yet)

### POST `/api/team/invite/accept` (public — no auth)
**Body:** `{ token: string, password: string, name: string }`  
**Flow:**
1. Validate token exists + not expired + not accepted
2. Create Supabase auth user with email + password
3. Insert into `organization_members` with invite's role
4. Mark invite as accepted
5. Return: `{ success: true }` → client redirects to /login

### DELETE `/api/team/invite/[id]`
**Auth:** Admin only  
**Action:** Revoke pending invite

---

## UI: `/dashboard/team`

```
Team Members                                    [+ Invite Member]
─────────────────────────────────────────────────────────────────
Name              Email                Role      Joined
─────────────────────────────────────────────────────────────────
Aniket Mhala      aniket@example.com   Admin     May 2026
(you)

─────────────────────────────────────────────────────────────────
Pending Invites
─────────────────────────────────────────────────────────────────
dpo@company.com                        DPO       Expires Jul 3   [Revoke]

─────────────────────────────────────────────────────────────────
Seat Usage: 1 / 2  (Starter plan)
[Upgrade to Growth for up to 5 seats]
```

**Invite modal:**
- Email input
- Role dropdown (Admin / DPO / Member / Board)
- Description of each role (tooltip)
- [Send Invite] button

**Role permissions (sidebar visibility):**
- `admin`: everything
- `dpo`: everything except billing
- `member`: overview, assessments, grievances, DSR — no ROPA/Vendor/Breach
- `board`: board dashboard only (`/dashboard/board`)

Gate these in middleware or page-level — check `organization_members.role` for current user.

---

## Public Accept Invite Page: `/invite/accept`

```
You've been invited to join [Org Name] on TrustStack™
Role: Data Protection Officer

Please set your password to accept the invite:

Email: dpo@company.com (pre-filled, readonly)
Name: ________________
Password: ____________
Confirm Password: ____

[Accept Invitation]

Invite expires: 3 Jul 2026
```

After accepting → redirect to `/login` with success message.

---

## Invite Email Template

Subject: `You've been invited to TrustStack™ — [Org Name]`

```
Hi,

[Inviter Name] has invited you to join [Org Name] on TrustStack™ 
— India's DPDP compliance platform.

Your role: Data Protection Officer

Click to accept your invitation (expires in 7 days):
[Accept Invitation →]  https://truststack.in/invite/accept?token=xxxx

If you didn't expect this invite, you can ignore this email.

— The TrustStack™ Team
```

---

## TypeScript Types

Add to `src/types/dpdp.ts`:

```typescript
export type MemberRole = 'admin' | 'dpo' | 'member' | 'board';

export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: MemberRole;
  joined_at: string;
  profile?: {
    name: string;
    email: string;
  };
}

export interface OrganizationInvite {
  id: string;
  organization_id: string;
  email: string;
  role: MemberRole;
  invited_by: string;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
}
```

---

## Seat Limit (Hardcoded for now — M12 will replace with DB lookup)

```typescript
// src/lib/team/seat-limits.ts
const PLAN_SEAT_LIMITS: Record<string, number> = {
  micro: 1,
  starter: 2,
  growth: 5,
  business: 10,
  enterprise: -1,  // unlimited
};

export async function checkSeatLimit(orgId: string): Promise<{ allowed: boolean; current: number; limit: number }> {
  // Count current members for this org
  // Compare to PLAN_SEAT_LIMITS[org.plan] (get plan from organizations table)
  // Return allowed/blocked + counts
}
```

**Note:** When M12 billing engine is built, replace `PLAN_SEAT_LIMITS` lookup with:
```typescript
const plan = await getOrgPlan(orgId);
const limit = plan.features.m11_user_seats; // from subscription_plans.features JSONB
```

---

## Testing

1. Sign in as admin → `/dashboard/team` shows current user + no pending invites
2. Invite `dpo@test.com` with role DPO → email received (check Resend dashboard)
3. Open invite link → set name + password → accept → redirected to /login
4. Sign in as `dpo@test.com` → lands in dashboard → role = DPO
5. DPO sees ROPA, Vendor, Breach modules (correct for DPO role)
6. DPO does NOT see Team or Billing (admin-only)
7. Admin can see dpo@test.com in member list
8. Admin removes DPO → DPO loses access on next request
9. Invite second user past seat limit (Starter = 2) → error: "Seat limit reached. Upgrade to add more members."
10. Revoke pending invite → invite link no longer works (404)

---

## After Completion

1. Update `progress.md` — M11 Team Management ✅ Complete
2. Update `MASTER_CONTEXT.md` — add M11 section (tables, routes, components, decisions)
3. Update `tracker-data.json` — M11 status → "built" (or "sql_pending" if not applied)
4. Apply SQL: `db/organization_invites.sql` in Supabase
5. Git commit + push + PR + merge + tag `v2.1.0`
