# SESSION PROMPT — P0 M1b: Industry-Specific Assessment Layers
## TrustStack™ Platform — Phase 0, Module 1b

---

## STEP 1 — READ THESE FILES FIRST (before writing any code)

```
implementation/MASTER_CONTEXT.md   ← Full project context, schema, tech stack, standards
implementation/progress.md         ← Current build status
```

Read both completely. Pay special attention to **§12 Industry-Specific Assessment Architecture** in MASTER_CONTEXT — that section defines exactly what to build and why.

---

## STEP 2 — WHAT THIS SESSION BUILDS

This session adds two layers of industry intelligence on top of the completed M1 assessment:

**Layer 1 — Industry-aware gap recommendations** (no UI change, ~2 hours)
- The 45-question core assessment already captures the org's industry (from `organizations.industry`)
- The gap report currently shows generic `recommended_action` for every org
- This layer makes gap recommendations industry-specific for Fintech, Healthtech, and EdTech
- Files to change: `gap-generator.ts` and `assessment/submit/route.ts`

**Layer 2 — Industry question module** (Section 9, new questions)
- After the 8 generic sections, orgs in Fintech / Healthtech / EdTech see a 9th section
- 8 questions per industry (FIN1–FIN8, HLT1–HLT8, EDT1–EDT8)
- Scores contribute to the overall Compass Score (scorer already handles dynamic totalMax)
- Files to change: `assessment-questions.ts`, `constants.ts`, `gap-generator.ts`, `assessment/[id]/page.tsx`, `assessment/submit/route.ts`

After this session:
- A Fintech company sees gap recommendations that reference RBI Master Direction and payment data
- A Healthtech company sees recommendations that reference DISHA and clinical consent separation
- An EdTech company sees recommendations that flag parental consent as their #1 risk
- All three industries see a 9th section with industry-specific questions in their assessment

---

## STEP 3 — PRE-FLIGHT CHECKS

✅ **Already complete — DO NOT redo:**
- M1 full assessment flow is working end-to-end
- All 5 tables exist in Supabase with correct RLS
- `src/lib/ai/gap-generator.ts` — exists with full GAP_MAP for Q1–Q45
- `src/lib/assessment-questions.ts` — exists with all 45 questions
- `src/lib/constants.ts` — exists with all DPDP constants
- `src/app/api/assessment/submit/route.ts` — exists

🔲 **No new npm packages needed for this session.**

🔲 **No new Supabase tables needed.** The `assessment_answers` table already has `question_id TEXT` and supports industry question IDs (FIN1, HLT1, EDT1 etc.). The `assessment_gaps` table similarly has no constraint on question_id format.

---

## STEP 4 — LAYER 1: INDUSTRY-AWARE GAP RECOMMENDATIONS

### 4a. Update `src/lib/ai/gap-generator.ts`

Add an `INDUSTRY_GAP_OVERRIDES` map. Structure:

```typescript
type IndustryOverride = {
  recommended_action: string
  dpdp_section?: string  // optional override
}

const INDUSTRY_GAP_OVERRIDES: Record<string, Partial<Record<string, IndustryOverride>>> = {
  fintech: {
    Q14: { recommended_action: '...' },
    Q15: { recommended_action: '...' },
    // etc.
  },
  bfsi: { /* same as fintech for most questions */ },
  healthtech: { ... },
  edtech: { ... },
}
```

Update the `generateGaps()` function signature to accept `industry: string | null`:

```typescript
export function generateGaps(
  assessmentId: string,
  organizationId: string,
  answers: { question_id: string; answer: AnswerValue }[],
  industry: string | null   // ADD THIS
): Array<...>
```

Inside the function, after resolving the base `gapDef`, check for an industry override:

```typescript
const override = industry ? INDUSTRY_GAP_OVERRIDES[industry]?.[answer.question_id] : undefined
const recommended_action = override?.recommended_action ?? gapDef.recommended_action
const dpdp_section = override?.dpdp_section ?? gapDef.dpdp_section
```

**Industry overrides to implement** (use MASTER_CONTEXT §12 as the source of truth for content):

Key questions to override per industry:
- **All 3 industries:** Q14 (consent), Q15 (granular consent), Q16 (withdrawal), Q17 (records), Q19 (child consent), Q20 (notice), Q24 (grievance officer), Q36 (breach procedure), Q37 (DPBI notification)
- **Fintech/BFSI only:** Q10 (cross-border), Q12 (AI/ML), Q13 (processors), Q35 (retention), Q42 (DPAs), Q44 (vendor breach notification)
- **Healthtech only:** Q9 (children's data), Q32 (RBAC), Q34 (security assessment)
- **EdTech only:** Q9 (children's data — highest priority), Q19 (parental consent — make P0 always)

### 4b. Update `src/app/api/assessment/submit/route.ts`

Fetch the org's industry before calling `generateGaps()`:

```typescript
// After verifying membership, fetch org to get industry
const { data: org } = await supabase
  .from('organizations')
  .select('industry')
  .eq('id', membership.organization_id)
  .single()

// Pass industry to generateGaps
const gaps = generateGaps(assessment_id, membership.organization_id, answers, org?.industry ?? null)
```

---

## STEP 5 — LAYER 2: INDUSTRY QUESTION MODULE

### 5a. Add industry questions to `src/lib/assessment-questions.ts`

Add three new arrays after the existing 45 questions:

```typescript
export const FINTECH_QUESTIONS: AssessmentQuestion[] = [
  { id: 'FIN1', section: 'industry_fintech', text: '...', type: 'yes_no_partial', pointValue: 3, scorable: true },
  // FIN1–FIN8
]

export const HEALTHTECH_QUESTIONS: AssessmentQuestion[] = [
  { id: 'HLT1', section: 'industry_healthtech', text: '...', type: 'yes_no_partial', pointValue: 3, scorable: true },
  // HLT1–HLT8
]

export const EDTECH_QUESTIONS: AssessmentQuestion[] = [
  { id: 'EDT1', section: 'industry_edtech', text: '...', type: 'yes_no_partial', pointValue: 3, scorable: true },
  // EDT1–EDT8
]

export function getIndustryQuestions(industry: string | null): AssessmentQuestion[] {
  if (!industry) return []
  if (industry === 'fintech' || industry === 'bfsi') return FINTECH_QUESTIONS
  if (industry === 'healthtech') return HEALTHTECH_QUESTIONS
  if (industry === 'edtech') return EDTECH_QUESTIONS
  return []
}
```

Use the exact question text from MASTER_CONTEXT §12, Layer 2 section.

### 5b. Update `src/lib/constants.ts`

Add the industry section labels:

```typescript
export const INDUSTRY_SECTION_LABELS: Record<string, string> = {
  industry_fintech:    'Fintech & BFSI Obligations',
  industry_healthtech: 'Healthtech Obligations',
  industry_edtech:     'EdTech Obligations',
}
```

Add to `ASSESSMENT_SECTION_LABELS`:
```typescript
industry_fintech:    'Fintech & BFSI Obligations',
industry_healthtech: 'Healthtech Obligations',
industry_edtech:     'EdTech Obligations',
```

### 5c. Update `src/lib/ai/gap-generator.ts`

Add gap definitions for all industry question IDs (FIN1–FIN8, HLT1–HLT8, EDT1–EDT8) in the `GAP_MAP`. Follow the same structure as Q1–Q45 entries. Priority should be P0 or P1 for most — these are industry-specific high-risk items.

### 5d. Update `src/app/dashboard/assessment/[id]/page.tsx`

The assessment page is a client component. It needs to:
1. Fetch the org's industry when loading the assessment (add to the results fetch or a separate org fetch)
2. Conditionally append the industry section to `ASSESSMENT_SECTION_ORDER` at runtime

```typescript
// After loading answers, determine industry sections
const [industryQuestions, setIndustryQuestions] = useState<AssessmentQuestion[]>([])
const [effectiveSections, setEffectiveSections] = useState([...ASSESSMENT_SECTION_ORDER])

// On mount, fetch org industry
useEffect(() => {
  // Fetch org industry from a simple API or from the assessment metadata
  // Then: const qs = getIndustryQuestions(industry)
  // If qs.length > 0: setIndustryQuestions(qs), setEffectiveSections([...ASSESSMENT_SECTION_ORDER, qs[0].section])
}, [])
```

Use `effectiveSections` instead of `ASSESSMENT_SECTION_ORDER` throughout the component.

**Alternative (simpler):** Add an endpoint `GET /api/assessment/[id]/context` that returns `{ industry }` — call it on mount. Or pass industry via a query param when navigating to `[id]`.

### 5e. Add `/api/organizations/me/route.ts`

Simple GET endpoint that returns the current user's org (including industry) — used by the client-side assessment page:

```typescript
// GET /api/organizations/me
// Returns: { id, name, industry, ... }
```

### 5f. Update `src/app/api/assessment/submit/route.ts`

The scorer already handles dynamic `totalMax` — no scorer changes needed. Just ensure:
- Industry question answers are already stored (auto-save handles this)
- `generateGaps()` receives industry (already done in Layer 1)

---

## STEP 6 — ACCEPTANCE CRITERIA

Before marking this session complete:

**Layer 1:**
- [ ] A Fintech org completing the assessment sees fintech-specific recommended actions in their gap report
- [ ] A Healthtech org sees healthtech-specific recommendations (DISHA reference, clinical consent)
- [ ] An EdTech org's Q19 (parental consent) gap shows as P0 with EdTech-specific language
- [ ] Other industries (ecommerce, logistics, etc.) still see the generic recommendations — no regression

**Layer 2:**
- [ ] A Fintech org's assessment shows Section 9 "Fintech & BFSI Obligations" after the 8 core sections
- [ ] A Healthtech org sees Section 9 "Healthtech Obligations"
- [ ] An EdTech org sees Section 9 "EdTech Obligations"
- [ ] An ecommerce or logistics org sees no Section 9 — assessment ends at Section 8
- [ ] Industry questions auto-save correctly
- [ ] Industry question answers appear in the gap report if answered 'no' or 'partial'
- [ ] Compass Score correctly includes industry question points in the total
- [ ] `npm run type-check` passes

---

## STEP 7 — UPDATE PROGRESS.MD WHEN DONE

At the end of this session:
1. Mark M1b as ✅ Complete
2. List all files modified
3. Add any key decisions (especially if you deviated from this prompt)
4. Update Session 1b notes section
