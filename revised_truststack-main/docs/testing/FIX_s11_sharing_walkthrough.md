# Fix · s.11(1)(b) — walk-through: who the person's data was shared with

> **✅ Approved 2026-10-28 — "Fix s.11 approved" (D-140).** All six calls stand; call 4's ROPA hint is
> an open follow-up. Kept as the record of what was approved.

Built on `fix/s11-access-sharing-list` off `main` @ `1acbc58`. Opened by Aniket's answer to Q2 of the
consolidated feature analysis (`docs/reference/CONSOLIDATED_FEATURE_ANALYSIS.md` §2.4, on
`docs/reference-hub-banking`): **"yes do it"** (28 Oct 2026). Recorded as **D-139**.

**What changed in the data, the law and who may do what.** Nothing in the data or in who may do
what. **No migration**, no new table, no new permission. One new read-only route. Every role that
reads the rights register already reads the processing register (`rights.read` ⇒ `ropa.read` in
`core/rbac.ts`). The law did not change: this closes a gap between what the public page promises
(`core/intake.ts`: "…and who it has been shared with (s.11)") and what the register helped a person
to answer.

## What you are approving

1. On every **access** request (Rights and grievances → a request → Response tab), a new step:
   **"Who the person's data was shared with"**, between "Identity" and "Response".
2. It lists, from the **processing register**:
   - every **processor linked to a record**, with the register's own label (Data Processor /
     Another Data Fiduciary / Not yet classified) and its service;
   - every record's **"Who it is shared with"** text, flagged "check who this is";
   - for each, **the records and the kinds of data** (the "description of the personal data so
     shared").
3. **Only the records s.11 reaches**: consent (s.6) and s.7(a). Records on another s.7 use or an
   exemption are left out and counted ("1 record rests on another legitimate use…"). Records with
   **no basis decided** are kept and marked.
4. A paged, searchable table (D-107), and **"Copy the list for the reply"**: plain text a person
   pastes into the reply and edits.
5. The statute under it: **s.11(1)(b)** and the **s.11(2)** exception.

## Before and after

| | Before | After |
|---|---|---|
| An access request's Response tab | Clock · Identity · Response · Lifecycle | Clock · Identity · **Who the person's data was shared with** · Response · Lifecycle |
| Where the s.11(1)(b) list came from | The handler's memory | The processing register + the processor links |
| Other request kinds | — | Unchanged (the route answers 409 for them) |
| API | — | `GET …/rights-requests/{id}/sharing` (`rights.read`; 404 for a foreign id) |

Screenshots: `docs/testing/fix-s11/{before,after}/` (laptop and phone width).

## What did not change

- No register's data; no write path; no migration; no permission.
- The AI's rights-response draft (Slice 11, D-129) is unchanged: it still writes placeholders and
  never states an outcome. The reference set is untouched.
- The clock, identity check, response and lifecycle.

## Claude's calls — confirm or change

| # | Call | Verdict | Legal basis | Risk if wrong |
|---|---|---|---|---|
| 1 | **The organisation's list, not the person's.** A request is not tied to processing records, so the panel lists everything the register shares under consent-based records; the handler keeps what concerns this person. | Confirm | s.11(1)(b) asks for the recipients of *this person's* data — only a person can match them to the requester | Low: over-inclusive, never silent; the text says "keep only what concerns this person" |
| 2 | **Only consent and s.7(a) records; undecided kept and marked.** | Confirm | s.11(1) opening: the right is against the fiduciary "to whom she has previously given consent, including consent as referred to in clause (a) of section 7" | Medium if a record's basis is wrongly entered: it disappears from the list. Mitigated: the count says how many were left out and why |
| 3 | **The register's own classification**, never inferred. "Independent" vendor → "Another Data Fiduciary"; "unknown" → "Not yet classified". | Confirm | s.2(i) Data Fiduciary, s.2(k) Data Processor; D-028's spirit (never infer a statutory class) | Low |
| 4 | **Free text is shown, not parsed.** MU's seed names internal teams ("departments, exam section"). Those are not "other Data Fiduciaries". | **Confirm with a follow-up:** a hint on the ROPA field "Who it is shared with": "other organisations only — not your own teams" (a separate small change) | s.11(1)(b) "other Data Fiduciaries and Data Processors" | Low now (flagged "check who this is"); the hint removes it at the source |
| 5 | **s.11(2) shown as a note**, not applied. TrustStack cannot know which sharing was a written law-enforcement request. | Confirm | s.11(2) | Low: a person decides; the note tells them they may leave such sharing out |
| 6 | **No AI change now.** Feeding this list into the AI rights-response draft would change the reference set (D-137). | Confirm; consider in Slice 12/13 | — | None |

## Evidence

- **Gates (local stack):** typecheck ✅ · core unit **1,411** (+8, `sharing.test.ts`) · web unit **901**
  (+1 with the paging guard; the list uses `<DataTable>`) · RLS **581** · secrets ✅ · **24/24** CI SQL
  gates · e2e: the affected specs **167/167**; the full suite — see the PR.
- **Gate 5:** the route sweep probes `GET …/sharing` (Org B's id under Org A → 404, nothing of
  Org B's; Org B's path → refused), and the rights spec's GATE 5 adds the path.
- **Client-hosted check (Slice 15):** nothing hosted-only was added (no Vercel-only feature, no
  provider key, no CDN).
- **Simplicity:** plain words; one table; one copy button; the legal note in one line.

Gate phrase: **"Fix s.11 approved"** (or "Fix s.11 approved with changes: …").
