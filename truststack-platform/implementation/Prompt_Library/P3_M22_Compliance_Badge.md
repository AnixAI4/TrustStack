# P3 — M22: Compliance Badge
## Embeddable badge for org website and LinkedIn showing TrustStack™ compliance status

**Session:** P3 — M22  
**Phase:** P3 — Scale  
**Priority:** MEDIUM — free marketing/advocacy tool; converts customers into brand ambassadors  
**Estimated time:** 1 session (~1.5 hours — lightweight)  
**Branch:** `feature/p3-m22-compliance-badge`  
**Tag after completion:** `v3.3.0`  
**Prerequisites:** M1 Compass Assessment + M17 Trust Center live

---

## READ FIRST
Read: `implementation/MASTER_CONTEXT.md` + `implementation/progress.md`

---

## What to Build

A dynamic embeddable badge that organizations can display on their website and LinkedIn, showing their DPDP compliance status. The badge is an SVG served from a fast endpoint that updates based on the org's current Compass Score.

---

## Database Schema

```sql
CREATE TABLE compliance_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID UNIQUE NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  badge_type TEXT NOT NULL DEFAULT 'dpdp_compliant', -- 'dpdp_compliant' | 'data_privacy_certified' | 'breach_ready'
  issued_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '1 year'),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
  revoked_at TIMESTAMPTZ,
  revoke_reason TEXT
);

ALTER TABLE compliance_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_members_view_badge" ON compliance_badges
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  );
```

---

## Badge Types and Thresholds

| Badge | Requirement | Icon |
|---|---|---|
| `dpdp_compliant` | Compass Score ≥ 70 | 🔒 Shield with checkmark |
| `data_privacy_certified` | Compass Score ≥ 85 + M21 Academy completed | 🏆 Gold shield |
| `breach_ready` | M8 Breach Response active + incident plan documented | 🛡️ Silver shield |

---

## API Routes

### GET `/api/badge/[slug].svg` (PUBLIC — no auth, fast response)
**Returns:** SVG image (Content-Type: image/svg+xml)  
**Caching:** `Cache-Control: public, max-age=3600` (1 hour)

```typescript
// src/app/api/badge/[slug]/route.ts
export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const org = await adminSupabase.from('organizations').select('id, name, current_compass_score').eq('slug', params.slug).single();
  
  if (!org.data || org.data.current_compass_score < 70) {
    return new NextResponse(errorBadgeSvg, { headers: { 'Content-Type': 'image/svg+xml' } });
  }
  
  const badgeType = org.data.current_compass_score >= 85 ? 'certified' : 'compliant';
  const svg = generateBadgeSvg({ orgName: org.data.name, score: org.data.current_compass_score, type: badgeType });
  
  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
```

### GET `/api/badge/[slug]/verify` (PUBLIC)
**Returns:** JSON with full badge verification details  
**Used by:** Third parties who scan the QR code on the badge

### POST `/api/badge/issue` (AUTH — admin only)
**Flow:**
1. Check Compass Score >= 70
2. Create/update compliance_badges record
3. Return badge data + embed code

### GET `/api/badge/my-badge` (AUTH — org member)
**Returns:** Org's current badge status + embed code

---

## SVG Badge Design

Generate dynamic SVG:

```typescript
function generateBadgeSvg({ orgName, score, type }: BadgeParams): string {
  const color = type === 'certified' ? '#FFD700' : '#1E40AF'; // Gold or Blue
  const label = type === 'certified' ? 'Data Privacy Certified' : 'DPDP Compliant';
  
  return `<svg width="200" height="60" xmlns="http://www.w3.org/2000/svg">
    <rect width="200" height="60" rx="8" fill="${color}" opacity="0.1" stroke="${color}" stroke-width="2"/>
    <text x="30" y="22" font-family="sans-serif" font-size="12" font-weight="bold" fill="${color}">TrustStack™</text>
    <text x="30" y="40" font-family="sans-serif" font-size="11" fill="#374151">${label}</text>
    <text x="30" y="54" font-family="sans-serif" font-size="9" fill="#6B7280">Score: ${score}/100</text>
    <!-- Shield SVG icon at x=10 -->
  </svg>`;
}
```

---

## UI: Badge Center `/dashboard/badges`

```
Compliance Badge
─────────────────────────────────────────────────────────────────
Your Current Badge:

[🔒 TrustStack™              ]
[  DPDP Compliant            ]
[  Score: 72/100             ]

Status: Active   Expires: Jun 26, 2027

─────────────────────────────────────────────────────────────────
Add to Your Website:

<a href="https://truststack.in/trust/acme-corp">
  <img src="https://truststack.in/api/badge/acme-corp.svg" 
       alt="DPDP Compliant — TrustStack™" />
</a>

[Copy Code]

─────────────────────────────────────────────────────────────────
Share on LinkedIn:

[Share on LinkedIn →]   → Opens LinkedIn with pre-filled text:
"Proud to announce Acme Corp is DPDP compliant, verified by 
TrustStack™ India's DPDP compliance platform. Score: 72/100."

─────────────────────────────────────────────────────────────────
Upgrade Your Badge:
Score 85+ to unlock 🏆 Data Privacy Certified badge
Current: 72/100   Need 13 more points   [Improve Score →]
```

---

## Badge Auto-Revocation

Cron job (daily, part of M18 alert cron or separate):
- If org's Compass Score drops below 70 → mark badge `is_revoked = true`, send email
- Badge SVG endpoint returns "expired" badge design when revoked
- Org receives alert via M18 Alert Center

---

## Testing

1. `/api/badge/acme-corp.svg` → returns SVG (HTTP 200, Content-Type: image/svg+xml)
2. Paste SVG URL in browser → badge renders correctly
3. Score < 70 → badge shows "Compliance verification pending"
4. Score ≥ 85 → badge shows "Data Privacy Certified" (gold)
5. `/dashboard/badges` → embed code displayed + LinkedIn share button
6. Verify URL → public page shows badge details
7. Badge cacheable for 1 hour (check Cache-Control header)
8. `npm run type-check` → 0 errors; `npm audit` → 0 vulnerabilities

---

## After Completion

1. Update `progress.md` — M22 Compliance Badge ✅ Complete
2. Update `MASTER_CONTEXT.md` — add M22 section
3. Update `tracker-data.json` — M22 status → "built"
4. Apply SQL: compliance_badges table
5. Git commit + push + PR + merge + tag `v3.3.0`
