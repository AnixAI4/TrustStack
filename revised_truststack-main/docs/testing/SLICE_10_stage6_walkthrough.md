# Slice 10 · Stage 6 — walk-through: the three stakeholder reports, every link type in the evidence index

Built 2026-10-16 on `slice/10-workflow-modules` (PR #28), migration
`20261018000000_slice10_reports` (**local only** until you approve). **Your
change during the manual test (D-098): exposure model 1.6.0** — a recorded,
non-dismissed breach makes head 2 assessed (§6). Opened by your message: "Start
Slice 10 Stage 6 … I keep §7d's four Stage 6 calls as recommended" (D-097).

This is the last stage of Slice 10. Its gate is **the PR**: CI green, and the
merge is yours. The manual test is
`docs/testing/SLICE_10_stage6_manual_test.md` (about 20 minutes).

## What you are approving

1. **Three report kinds** (§7d call 1, as recommended) — PDFs on the Slice 9
   report store, each recording a fresh exposure snapshot first:
   **Security and Breach Report** (CISO), **Legal Position Report** (counsel and
   the DPO), **Processor Exposure Report** (procurement).
2. **Two link types** (call 2) — a document on a **breach** itself
   (`breach_incident`: the Board's intimations, the notice to the people
   affected) and on a **request** itself (`rights_request`: the response sent).
3. **The evidence index reads every link type** (call 3) — vendor, retention
   schedule, AI system, breach, request — named as each register names it.
4. **The full test pass, the Sync Step (SLICE_11 promoted), PR #28 ready for
   review** (call 4).
5. **The seven calls in §5** that the brief did not make.
6. **Model 1.6.0 — your change (§6).**

---

## 1. The three reports — *Reports* in the nav

Each is offered under "Reports (PDF)" beside the Slice 9 four, to anyone with
`report.generate` who can also record an exposure snapshot (`score.calculate`
and every register the exposure view reads). Each prints:

- **Where you stand** — the stored status and position of the heads that
  reader answers for, plus two counts that matter to them; the s.37 notice
  whenever any head is at stake; the basis and anything out of date.
- **Its penalty heads in detail** — every reason and position factor, from the
  stored snapshot (never recomputed).
- **Its registers**, as their own readers count them (D-069) — never a figure
  the report worked out.
- **Both caveats verbatim**, the "not modelled" heads and the ceilings note.

| Report | Heads | Registers |
|---|---|---|
| **Security and Breach Report** | 2 (breach notification), 1 (security safeguards) | the breach register — counts, then every incident: when the organisation became aware, the Board "without delay" (Rule 7(2)(a)) and the detailed report's clock (7(2)(b)), any extension, the people told (7(1)), documents attached; the security areas of the assessment (the domains the model reads for s.8(5)); breach remediation still owed |
| **Legal Position Report** | 3 (children and lawful guardians), 7 (any other provision) | rights and grievance (s.11–14, Rule 14) — 30 days is labelled TrustStack's target, 90 the Rules'; the published notices and the live widget version (s.5, s.6, Rule 3); children (s.9, Rules 10–12); retention and erasure (s.8(7), Rule 8) — an erasure counts only when complete and not recorded in error; the Third-Schedule class only if recorded; **the AI register as an enabling note, never a status**; rights and retention remediation still owed |
| **Processor Exposure Report** | 1, 7 | the processor register's counts; every vendor — role, contract (s.8(2)), cross-border, assessment (risk score and tier, review-by, awaiting review, with the vendor), documents; **contracts to fix**, saying what each needs (s.8(2), s.8(7)(b), Rule 6(1)(f)); assessments to complete or renew |

Nothing personal leaves a register: a request is named by its code and kind,
never by the person; a vendor link's respondent is never read.

## 2. Documents on a breach and a request

The breach page and the request page gain the **Documents** panel the retention
schedule and the AI system already have (Stage 5): upload, attach, download,
detach. The artefact itself is never deleted (D-042) — detaching removes only
the link.

| | Attach | Detach |
|---|---|---|
| **Breach** (`breach.write`) | any time — except a breach **dismissed** as not a personal data breach | only while **open or contained**; a **closed** breach keeps what its closure stands on, a dismissed one is a record |
| **Request** (`rights.write`) | any time — except a request **void** (entered in error); the response sent may be attached after it is recorded | only while **open**; responded, withdrawn or void keep their documents |

These are each register's own rule ("reopen it to change it"), enforced by the
database trigger and shown in words. Reopening a breach or a request is
already possible.

## 3. The evidence index — and what it changes in the evidence pack

The Evidence Index (and so the Regulator-Ready Evidence Pack) now lists every
link type. "Penalty heads" for a register's own row is **read from the model's
own rows**: the heads whose *status* that register can set — a breach → head 2;
a request or a retention schedule → head 7; a vendor → heads 1 and 7; an AI
system → none (its one row is only a reason).

**Note:** the evidence pack's "Evidence by penalty head" counts now include
those documents (§5, call 7).

## 4. Gates (local stack, rebuilt from scratch as CI does)

With model 1.6.0 (§6): core **1,229** (+28) · web unit **519** (+5) · RLS
**541** (+11) · all **23** CI SQL gates (a new Stage 6 gate; the model-version
and breach-row gates updated for 1.6.0) · typecheck, `check:secrets`,
`db:types --check` clean · e2e **410/410** locally (one worker). **CI green on
`879cefb`**: 410 e2e — 409 at the first attempt, and one consent UI test
(publishing a notice, untouched by Stage 6) passed on its automatic retry, a
timing flake recorded in STATE's open loops. The Vercel preview built. New: an e2e API spec
on two disposable tenants (`…a024`, `…a025`) asserting on the files
themselves; two sweep probes; UI steps on the breach page and the reports page.

## 5. Calls to confirm (D-097) — with the DPDP consultant's view

| # | Call | Consultant's view |
|---|---|---|
| 1 | **Attach/detach rules** in §2 | **Confirm.** Rule 7(2)(b)(vi) asks for "a report regarding the intimations given to affected Data Principals"; a closed breach's documents are what shows it was done, so they must not be removable without reopening. A response under Rule 14 is likewise the record that the request was answered. |
| 2 | **A register document's heads** come from the model's rows that can set a status (§3) | **Confirm.** Keeps statute and TrustStack defaults apart (pitfall 1): the AI register's 12-month review is a TrustStack default and only a reason, so it evidences no head. |
| 3 | **Names and slugs**: "Security and Breach Report" (`Security_and_Breach_Report`), "Legal Position Report", "Processor Exposure Report" | Wording only. |
| 4 | **The AI register in the Legal report** is a count table plus, when an AI system tracks children with no Fourth-Schedule exemption, a warning citing s.9(3)–(5), Rule 12 and the Fourth Schedule, "for counsel to confirm" — never a status | **Confirm** (as §7d asked). s.9(3) is an absolute bar unless an exemption applies; the register cannot know enough to call it a breach of s.9(3), so counsel decides. |
| 5 | **What is printed of a breach**: its code and its title (staff-written) | **Confirm, with care**: titles are the register's own name for the incident and already travel to the actions view, so personal data should stay out of them — otherwise it spreads to every list and report, each a place the s.8(5) safeguards must then cover. The Act has no general minimisation rule; this is good practice. **Done in this stage:** the breach form now says under the title "describe what happened, never name the people affected". |
| 6 | **Counts come from the readers the overview and the registers use** (D-069) — `readAiRegister` was extracted so the AI page and the report share one count | Engineering; no legal effect. |
| 7 | **The evidence pack's per-head counts now include register documents** — an approved Slice 9 report's numbers can rise | **Confirm.** A breach's Board report is evidence on head 2 under s.33(2)(e) ("action taken … to mitigate") whether attached to the breach or to its action; leaving it out undercounts. |

No seed change: MU and BML stay as Stage 5 left them, so the manual test
attaches and generates on your laptop only.

## 6. Your change — exposure model 1.6.0 (D-098)

You asked, after Step 5: "any recorded, non-dismissed breach counts as assessed
for head 2". Built as a fourth kind of model row, **`assessed`**: when it
holds, the head is no longer "Not yet assessed", and it says why; it sets no
status of its own.

| Breach register, with no breach question answered | 1.5.0 | **1.6.0** |
|---|---|---|
| No breach, or only dismissed ones | Not yet assessed | Not yet assessed |
| A breach closed, Board and people told | Not yet assessed | **Partially mitigated** — "1 personal data breach is recorded in the breach register (s.8(6), Rule 7), so this head is assessed from it." |
| A breach open, people not yet told | Not yet assessed | **Partially mitigated** (+ "affected Data Principals are not recorded as intimated (Rule 7(1))") |
| The detailed report to the Board overdue | Exposed | Exposed (unchanged) |

Mitigated still needs every breach area of the assessment answered well — the
register alone never makes head 2 Mitigated. **On Mumbai University**, head 2
moves from Not yet assessed to Partially mitigated (BRH-2026-001). The count of
heads at stake and the ceilings at stake do not change. Core and SQL agree; the
1.6.0 functions sit in Stage 6's migration (still local), and 1.5.0 stays as
applied.

**Consultant's view: confirm.** s.8(6) and Rule 7 concern what was done once a
breach happened, so a recorded breach is real evidence on head 2 even with no
assessment answer; "Not yet assessed" understated it. Counsel should still
review the mapping with the rest of the model.

## Then

Reply **"Stage 6 approved"** (or "approved with changes: …"). Then: the
migration to hosted (additive — the live site is unaffected), CI green, and
**you merge PR #28**; Slice 10 is then live. Slice 11 (AI assistant) starts in
a new session from `docs/slices/SLICE_11_ai_assistant.md`, which needs your
"SLICE_11 approved" first.
