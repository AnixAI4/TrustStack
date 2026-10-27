# P3 — M21: TrustStack™ Academy
## In-platform DPDP compliance training with certificates

**Session:** P3 — M21  
**Phase:** P3 — Scale  
**Priority:** MEDIUM — retention + upsell driver; makes compliance training part of platform  
**Estimated time:** 1 session (~2.5 hours)  
**Branch:** `feature/p3-m21-truststack-academy`  
**Tag after completion:** `v3.2.0`  
**Prerequisites:** M11 Team Management (per-user enrollment tracking)

---

## READ FIRST
Read: `implementation/MASTER_CONTEXT.md` + `implementation/progress.md`

---

## What to Build

In-platform DPDP compliance training courses for employees, DPOs, and board members. Short video/text-based courses with quizzes, per-user progress tracking, and AI-generated PDF certificates on completion.

---

## Database Schema

```sql
CREATE TABLE academy_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,                -- 'dpdp-basics' | 'dpo-essentials' | 'breach-response'
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  target_audience TEXT NOT NULL,            -- 'all' | 'dpo' | 'admin' | 'board'
  duration_minutes INTEGER NOT NULL,
  level TEXT NOT NULL DEFAULT 'beginner',   -- 'beginner' | 'intermediate' | 'advanced'
  content JSONB NOT NULL,                   -- Array of { type: 'video'|'text'|'quiz', ... }
  passing_score INTEGER NOT NULL DEFAULT 70, -- % correct to pass quiz
  certificate_title TEXT NOT NULL,          -- Text for the PDF certificate
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE academy_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES academy_courses(id),
  status TEXT NOT NULL DEFAULT 'in_progress', -- 'in_progress' | 'completed' | 'failed'
  progress_percent INTEGER NOT NULL DEFAULT 0,
  quiz_score INTEGER,                        -- 0–100, null if not yet taken
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  certificate_id UUID,
  UNIQUE(user_id, course_id)
);

CREATE TABLE academy_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID UNIQUE NOT NULL REFERENCES academy_enrollments(id),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  course_id UUID NOT NULL REFERENCES academy_courses(id),
  certificate_number TEXT NOT NULL UNIQUE,   -- CERT-2026-001 (per-org? global? use global here)
  issued_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,                    -- 1 year from issue
  verification_url TEXT NOT NULL,            -- Public URL to verify the certificate
  pdf_url TEXT                               -- Supabase Storage URL
);

ALTER TABLE academy_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE academy_certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_view_own_enrollments" ON academy_enrollments
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "org_admins_view_all_enrollments" ON academy_enrollments
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND role IN ('admin', 'dpo')
    )
  );
```

---

## V1 Course Catalog (seed data)

Create 5 starter courses:

| Slug | Title | Duration | Level | Audience |
|---|---|---|---|---|
| dpdp-basics | DPDP Act 2023 — Overview | 20 min | Beginner | All |
| consent-management | Consent Management in Practice | 25 min | Intermediate | All |
| dsr-handling | Handling DSR Requests | 30 min | Intermediate | Admin/DPO |
| breach-response | Data Breach Response | 25 min | Intermediate | Admin/DPO |
| board-obligations | Board Obligations under DPDP | 20 min | Beginner | Board |

Each course has 3 sections: (1) Text/video content, (2) Key takeaways, (3) 10-question quiz.

**V1 simplification:** Store course content as Markdown in the `content` JSONB. Render with a Markdown component. No video hosting needed for V1 — text-only courses.

---

## API Routes

### GET `/api/academy/courses`
**Auth:** Org member  
**Returns:** All active courses + user's enrollment status for each

### POST `/api/academy/courses/[id]/enroll`
**Auth:** Org member  
**Flow:** Create enrollment record (or return existing)

### PATCH `/api/academy/courses/[id]/progress`
**Auth:** Org member (own enrollment only)  
**Body:** `{ progress_percent: number, completed_section?: string }`

### POST `/api/academy/courses/[id]/quiz-submit`
**Auth:** Org member  
**Body:** `{ answers: Record<string, string> }` (question_id → answer_id)  
**Flow:**
1. Grade quiz against course.content quiz answers
2. Calculate score (%)
3. If score >= passing_score: mark enrollment completed, generate certificate
4. Return: `{ score, passed, certificate_id? }`

### GET `/api/academy/certificates/[certificateNumber]` (PUBLIC)
**Returns:** Certificate verification data (name, course, org, issue date)

### GET `/api/academy/certificates/[id]/pdf`
**Auth:** Certificate owner + org admins  
**Returns:** PDF download (generated via AI or static template)

---

## UI: `/dashboard/academy`

```
TrustStack™ Academy
─────────────────────────────────────────────────────────────────
Your Learning Progress:  2 courses completed  |  3 certificates earned

Course Catalog
─────────────────────────────────────────────────────────────────
[✅ Completed]  DPDP Act 2023 — Overview           Beginner  20 min
               Completed Jun 20, 2026               [View Certificate]

[→ Continue]   Consent Management in Practice       Inter.    25 min
               Progress: 60%                        [Continue]

[+ Enroll]     Handling DSR Requests               Inter.    30 min
               New                                  [Start Course]

[+ Enroll]     Data Breach Response                Inter.    25 min
               Recommended for your role            [Start Course]
```

### Course View

```
DPDP Act 2023 — Overview
Progress: ████████░░ 80%           [Section 1 of 3]

──────────────── Section 2: Your Obligations ─────────────────

[Text content rendered as markdown]

The DPDP Act 2023 places three primary obligations on organizations:

1. **Purpose Limitation** — Data can only be used for the stated purpose.
   If you want to use it for something else, you need fresh consent.

2. **Data Minimization** — Collect only what you need. If you don't 
   need a user's DOB, don't ask for it.

3. **Storage Limitation** — Define a retention period. Delete data
   when it's no longer needed.

─────────────────────────────────────────────────────────────────
[← Previous]                                [Next Section →]
```

### Quiz

```
Final Quiz — 10 Questions                    [Submit Quiz]

Q1. What is the maximum fine under DPDP Act for a single instance?
  ○ ₹50 crore
  ○ ₹100 crore  ← correct
  ○ ₹250 crore
  ○ No maximum stated
```

### Certificate (after passing)

Generated PDF with:
- TrustStack™ Academy letterhead
- "This is to certify that [Name] at [Org] has completed..."
- Course name, score, date
- Certificate number (CERT-2026-001)
- QR code linking to verification URL
- "Valid until: Jun 26, 2027"

---

## Certificate Generation (Claude AI)

Use Claude to generate a professional HTML certificate that is then rendered to PDF:

```typescript
// src/lib/academy/certificate-generator.ts
export async function generateCertificatePDF(enrollment: Enrollment, user: User, course: Course): Promise<string> {
  // 1. Generate certificate HTML with Claude:
  const html = await generateCertificateHTML({ userName: user.name, orgName: org.name, courseName: course.title, score: enrollment.quiz_score, issueDate: new Date() });
  
  // 2. Convert to PDF (use Puppeteer on Vercel or a PDF API)
  // V1 simplification: Use a pre-built HTML template (no Claude needed — save tokens)
  
  // 3. Upload to Supabase Storage: /certificates/{orgId}/{certificateId}.pdf
  // 4. Return public URL
}
```

**V1 simplification:** Use a static HTML template with variable substitution. Save Claude API calls.

---

## Testing

1. `/dashboard/academy` → 5 courses listed
2. Enroll in "DPDP Act 2023 Overview" → progress = 0%
3. Read Section 1 → progress updates to 33%
4. Complete all sections → progress = 100%
5. Take quiz → submit → score shown
6. Passing score (70%) → certificate generated → download PDF
7. Failing score → "You scored 60%. Try again." → can retake quiz
8. Certificate verification URL → public page shows certificate details
9. Org admin view → sees all team member enrollments + completion rates

---

## After Completion

1. Update `progress.md` — M21 Academy ✅ Complete
2. Update `MASTER_CONTEXT.md` — add M21 section
3. Update `tracker-data.json` — M21 status → "built"
4. Apply SQL: academy tables + seed courses
5. Git commit + push + PR + merge + tag `v3.2.0`
