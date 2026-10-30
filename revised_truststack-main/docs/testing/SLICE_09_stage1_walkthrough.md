# Slice 9 · Stage 1 — exposure model 1.0.0, walked through on two sectors

**For:** Aniket's Stage 1 approval gate (SLICE_09 §12).
**What it shows:** the live `GET /api/v1/organizations/{id}/exposure` output
for **Mumbai University** and a **healthcare clinic network**, side by side.
These are real API responses from the local stack on 2026-10-05, not mock-ups.
**Where the rules come from:** SLICE_09 §6, built as data in
`packages/core/src/exposure.ts`. The calls Claude had to make are listed in
D-073.

> Exposure figures are indicative positions within statutory ceilings in the
> Schedule to the DPDP Act 2023, derived from your own assessment, register
> and remediation data under TrustStack exposure model 1.0.0. They are not a
> prediction of any decision of the Data Protection Board, which imposes a
> penalty only after an inquiry finds a breach significant and weighs the
> factors in section 33(2). They are not legal advice.

## How the two tenants were set up

Both assessments were answered in full through the API. Evidence was
uploaded by the Anix consultant and reviewed by somebody else, as D-043
requires. Each tenant's gap register was then generated.

| | Mumbai University (seeded) | Healthcare clinic network (disposable) |
|---|---|---|
| Industry | University | Healthcare |
| Data Principals | ~4.6 lakh (large-scale trigger) | 2.5 lakh (large-scale trigger) |
| Children's data | **Yes** | **No** |
| Persons with disability with a lawful guardian | Unknown (never asked) | **Yes** |
| Sensitive documents | Yes | Yes |
| Where data goes | Unknown (LMS and proctoring vendor) | Unknown (cross-border answered "unknown") |
| Assessment | 124 questions. Most at claim 3 with E3. Security 4/E4. Breach 3/E3. Retention 2 with no evidence. Children's data 2/E2. Inventory 2 with no evidence | 98 questions. Most at claim 3 with E3. **Security 2 with no evidence.** Breach 4/E4. Consent 3 claimed, E2 |
| Processing register | The 10 seeded records, gaps generated | No records |
| SDF notification | None recorded | None recorded |

## The headline

| | Mumbai University | Healthcare |
|---|---|---|
| Statutory ceilings where exposed *(not a fine)* | **₹500 crore** (H1 + H3 + H7) | **₹300 crore** (H1 + H7) |
| Heads at stake | 3 of 4 applicable | 2 of 4 applicable |
| s.37 blocking flag | Shown | Shown |
| Days to 13 May 2027 | 220 | 220 |

## Head by head

| Head (ceiling) | Mumbai University | Healthcare |
|---|---|---|
| **H1** Security safeguards, s.8(5) (₹250 cr) | **Partially mitigated**, upper third (₹167–250 cr) | **Exposed**, upper third (₹167–250 cr) |
| **H2** Breach notice, s.8(6) (₹200 cr) | **Mitigated** | **Mitigated** |
| **H3** Children / guardian, s.9 (₹200 cr) | **Exposed**, upper third (₹133–200 cr) | **Mitigated** |
| **H4** SDF, s.10 (₹150 cr) | Not applicable (no notification recorded) | Not applicable |
| **H7** Any other provision (₹50 cr) | **Exposed**, upper third (₹33–50 cr) | **Partially mitigated**, middle third (₹17–33 cr) |
| H5 (s.15) · H6 (s.32) | Listed, not evaluated: a Data Principal's duty / no undertaking exists | Same |

### Why: Mumbai University

- **H1, partially mitigated.** Security (80%, E4) and Vendor (60%, E3) are
  both strong enough on their own. The **register** holds H1 back: "Rule 6
  minimum safeguards not confirmed" is open on all 10 records, and one
  processor has no valid contract. Root causes are shown, but they set no
  status: inventory is weak or unevidenced (a red flag), no record has an
  owner, and 9 vendors are unmapped. **Position: 4 points.** Children's data
  +2, sensitive documents +1, large scale +1, data location unknown +1, and
  evidence confidence ≥ 60% −1.
- **H2, mitigated.** Breach readiness scored 60% with 60% confidence. Six
  low gaps remain open, and they are listed as work still to do.
- **H3, exposed.** Applies because children's data is processed (and guardian
  data is not yet known). The children's red flag fires (2/E2). The register
  has 8 records with no verifiable parental consent and 8 where children may
  be tracked; both are critical. **Position: 6 points.** H3 reads children's
  data at +3, plus sensitive documents +1, large scale +1, and Exposed +1.
- **H7, exposed.** Retention scored 20%, below the 40% line. Rights sits at
  40%. The register has 9 records with purpose or ground undecided and 8 with
  retention undecided. **Position: 5 points.**

### Why: healthcare

- **H1, exposed.** The security red flag fires: claimed 2 with no evidence,
  so it scores 20%, with 8 high gaps. **Position: 4 points.** Sensitive
  documents +1, large scale +1, location unknown +1, Exposed +1. Children's
  data does not add here, because there is none.
- **H3, mitigated, and this is the second-sector point.** H3 applies **only
  because of the new guardian question** (s.9(1)). Children's data is "no".
  It is evidenced by the Children's data and guardian consent domain, which
  scored 60% with E3.
- **H7, partially mitigated.** Consent scored 40% with 40% confidence (3
  claimed, E2). **Position: 2 points.** Sensitive documents +1 and large
  scale +1 place it in the middle third.
- **Nothing University-specific** appears in the healthcare output. The e2e
  suite asserts that on a third tenant: no "student", "admission",
  "examination", "campus" or "university".

## What to approve at this gate

1. **The output itself**: statuses, positions and reasons for the two
   tenants above.
2. **The calls in D-073**, especially:
   - the new scope question on **persons with disability who have a lawful
     guardian** (default "unknown");
   - an **unsaved scope is read as unknown everywhere**;
   - **"sensitive documents: unknown" adds a point**;
   - a gap whose actions are all closed **no longer counts**;
   - **Mitigated needs at least one answered direct domain**;
   - the **enabling-control "root cause" mapping**.
3. **Counsel still signs off model 1.0.0 before launch.** That means the head
   mapping, the 40/60/60 thresholds, the position points and the caveat. It
   is listed in STATE as a launch blocker. Your approval here is the product
   decision; counsel's is the legal one.

## Things this walk-through surfaced

- **No question in the bank asks about guardian consent for persons with
  disability.** For the healthcare tenant, H3 applies only through the
  guardian answer, but the CHILD domain's questions are about children. The
  head is therefore evidenced by questions that do not quite ask about it. This
  is content work, a candidate for `CORE_DPDP_V2` (`QUESTION_FORMAT.md`).
  Until it is done, H3 for a guardian-only organisation is only as good as
  that proxy.
- **The per-domain coarseness of §6.2 is visible.** MU's six low Breach gaps
  count towards H2, although some are detection questions that are really
  Rule 6(1)(c), which is H1. The fix is the per-question provision tag
  (`legal_control_basis`, empty today), which is already a launch blocker.
- **The reasons lists are long:** MU's H7 has 16 lines. Stage 2's Command
  Centre should group them (direct evidence first, root causes collapsed).
  The API order already supports that.
- **"Provisional" means not finalised, not "unanswered".** MU's walk-through
  assessment is fully answered but not finalised, so its basis is
  `provisional` with 0 outstanding. The Command Centre should say both.

## How to reproduce

The script that set this up is not committed; it is a throwaway run against
the local stack. To see the same model on your own data, call
`GET /api/v1/organizations/{id}/exposure` as any member of the organisation.
`e2e/api/exposure.spec.ts` builds the second-sector cases from scratch.
