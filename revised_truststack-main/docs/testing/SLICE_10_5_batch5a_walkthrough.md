# Slice 10.5 · Batch B5a — walk-through: the processor questionnaire in sections, and the paging guard

Built 2026-10-17 on `slice/10-5-b5a-questionnaire` (its own PR into the slice
branch, as B5). Opened by your finding in the B5 manual test — "We need
pagination with tabs for … Processor questionnaire — Payment gateway provider"
— and your approval: "add N1–N7 and the paging guard test to the fix list as
proposed. Do the questionnaire first, as a small batch before B1" (D-107).

**Nothing about the data, the law or who may do what changed**: no API,
permission, model, migration or seed change; the questions, their wording,
scoring and the database's checks are as before. The manual test is
`docs/testing/SLICE_10_5_batch5a_manual_test.md` (about 15 minutes). Its gate:
**"Batch B5a approved"**.

## What you are approving

1. **N1 — the questionnaire in sections**, on the vendor's link page (U43) and
   the staff page (U36).
2. **The paging guard** — a unit test that keeps every future list honest.
3. **The paging and tabs sweep** recorded in the fix list (N2–N7, D-107) for
   the later batches.

---

## 1. The questionnaire (N1)

| | Before | After |
|---|---|---|
| Layout | 44 questions in seven sections, all on one page — about nine screens on a laptop, far more on a phone | A row of **pills**, one per section — **A · Company**, **B · Data handling**, **C · Security**, **D · Sub-processors**, **E · Residency**, **F · Incidents**, **G · DPDP duties** — plus a last **Review and send** (vendor) / **Review** (staff). One section shows at a time |
| Progress | "x of 44 answered" in the bottom bar only | The same bar, **and** each pill says "answered x of n" — **green** when the section is complete |
| Moving on | Scroll | **Next: [section]** under each section **saves, then moves on** (a failed save keeps you there and shows why); **Back**; or click any pill |
| Submitting (vendor) | Declaration and **Sign and submit** at the very bottom | In **Review and send**: one line per section ("4 of 5 answered · still to answer: A2"), an amber line naming any claim with no document cited, then the declaration and **Sign and submit** |
| Review (staff) | — | **Review**: per section answered, still to answer, and "claimed, no evidence" by question |
| Phone | One very long page | The pills **wrap** — every section stays visible; nothing scrolls sideways |
| Reload / link | Back to the top | The chosen section is in the address (`#security`), so a reload or a shared link lands on it |

Built on the B0 `<Tabs>` (every panel stays mounted, so nothing typed is lost
when you switch sections) with a new **steps** style (wrapping pills) and a
small `<SteppedTabs>` that adds Back / Next. The section names come from the
question bank (`VENDOR_SECTION_LABEL`); the pills use a short form of them.

Screenshots (laptop and phone): `docs/testing/slice10_5-b5a/before/` and
`…/after/` — the vendor's page (top, section C, review) and the staff page
(top, review). Both passes: **0 browser console errors**.

## 2. The paging guard

`apps/web/tests/unit/paging-guard.test.ts` counts, per file, every list a page
renders row by row (`.map(… => <li>/<tr>)`) outside `<DataTable>`, and checks it
against an allowance **with its reason** — a fixed set (sixteen domains, seven
sections), a short list by rule (ten documents a link), a summary that links to
its paged register — or the batch that **owes** its paging ("owed: N6 (B3)").

- **A new list that can grow cannot ship unpaged**: its count rises and the
  build fails until it goes through `<DataTable>` or is allowlisted with a reason.
  (Proven: a throwaway page with one unpaged list failed it.)
- **A fix must cross itself off**: moving a list to `<DataTable>` lowers the
  count, and the test fails until the allowance is lowered — so the "owed"
  lines stay a true to-do list for B1–B4.
- Cards built from `<div>`s are not counted (the gap register, for one) — the
  fix list carries those (F2.5).

## 3. Claude's calls — confirm or change

1. **Next saves** (on both pages), as F1.11 will do for the scope wizard; the
   pills switch without saving, like the old scroll. Say if you want every
   switch to save.
2. **Your documents stay above the pills** on the vendor page, so a document
   can be uploaded and cited from any section.
3. **Sign and submit moved into Review and send** — the declaration is read
   just before signing. **Save** stays in the bottom bar on every section.
4. **The staff page keeps Submit, Save and Discard in its bottom bar** (as
   before); its Review tab is a summary, not a second Submit.
5. **The guard counts per file**, not per list: simpler and stable; the reason
   text says which lists in the file are allowed.

## 4. Evidence

- **Gates** (local stack rebuilt to the clean seed): core **1,233**, web unit
  **553** (+3, the guard), RLS **541**, typecheck, `check:secrets`; full e2e
  **408/410** locally (one worker, production build) — the one failure and the
  test after it are the laptop's Auth port-exhaustion flake (open loop since
  Slice 9) and pass alone; CI is the authority. `ui/vendor-link` now walks the
  sections, presses **Next** (and checks "Saved."), and reads the review.
- **Client-hosted (Slice 15)**: nothing new to host — no dependency added.
