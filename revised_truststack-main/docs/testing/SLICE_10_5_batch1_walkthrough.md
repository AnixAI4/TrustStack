# Slice 10.5 · Batch B1 — walk-through: first-run and the overview

Built 2026-10-17 on `slice/10-5-b1-first-run` (its own PR into the slice
branch, as B5 and B5a). Opened by "Start Slice 10.5 Batch B1", from the fix
list you approved with the recommendations — Q3, Q4 and Q5 answered (D-104) —
plus F1.12, carried in from your B5 manual test (D-106).

**Nothing about the data, the law or who may do what changed**: no API,
permission, model, migration or seed change. Every number on the overview is
still the engine's or the database's; every `data-testid` a test used is still
there, except the scope wizard's **Save answers** button, which F1.11 folds into
Next. The manual test is `docs/testing/SLICE_10_5_batch1_manual_test.md` (about
20 minutes). Its gate: **"Batch B1 approved"**.

## What you are approving

1. **The overview (U04)** — "Your next steps" first (F1.1), the industry by name
   (F1.2), the deadline as a sentence (F1.3), progress before the score and
   "Not started" for an untouched domain (F1.4, Q3).
2. **Actions (U13)** — a "My actions" tab and a purpose line naming all five
   sources (F1.5).
3. **The shell (U05)** — no page heading repeats the top bar (F1.6); on a phone
   the title gets the room (F1.7).
4. **Settings** — Users (U07, F1.8), Organisation settings in tabs (U06, F1.10),
   the scope wizard's Next saves (U08, F1.11).
5. **Signing in (U01, U02, U44)** — what TrustStack is, and who helps with a
   forgotten password or a dead invitation (F1.9, Q4).
6. **The public form (U40)** — one message when the code email cannot be sent
   (F1.12).

---

## 1. The overview (U04)

| | Before | After |
|---|---|---|
| First panel | "Organisation … university · consultant-assisted" and "Signed in as examinations@… department_owner" — the same for all seven roles, repeating the top bar with a raw role code | **Organisation**: "Mumbai University · University / Higher Education · consultant-assisted". Then **Your next steps**: "For examinations@… · Department Owner", the person's **own open actions** — overdue first, then soonest due — each a link to its register's page, and "Open My actions →" |
| Programme roles (Registrar, Admin, Consultant, Dean) | — | The same, plus **Needs someone now**: the single register item that most needs someone — e.g. "ROPA-009 — erasure overdue since …", or "Nothing in the registers needs someone right now." |
| Exposure tile | "Days to 13 May 2027 · likely finish — 208 · not enough history" | "**Until most of the DPDP Rules apply** — **208 days to 13 May 2027** · finish date: not enough history yet" |
| Readiness tile | "4.20 / 100.00 · Level 0 · Assessed Weight Coverage: 100.00 / 100 … 123 questions unanswered" | "**1 of 124 questions answered**", then the score, then "Assessed Weight Coverage: 100.00 / 100 — *the weight of the domains that apply*" |
| Scorecard | An unanswered domain says **Needs Work** | It says **Not started** (Q3 — display only; the stored status, the score and the workbook oracle are untouched). A domain with one answer shows the engine's status as before |
| "What is being done" | Named four sources | Names all five (retention added) |

"Evidence awaiting *your* review" (in F1.1's original wording) is **left out**:
no reader returns a person's review queue today, and the brief says not to add
one. It belongs with B2's evidence work.

## 2. Actions (U13)

| | Before | After |
|---|---|---|
| Heading | "Actions" twice (top bar and page) | Once — the top bar |
| Purpose | "…from the assessment and from the processing register…" (two of five) | "…from the assessment, the processing register, and the breach, rights and retention registers…" |
| Tabs | By owner · All actions · Roadmap | **My actions** (first and open for anyone who owns an action — the Controller of Examinations lands here) · By owner · All actions · Roadmap. **Programme roles keep By owner first**; their My actions is second |
| My actions | — | A paged, sortable table of your open actions (no Owner column — they are yours), following the Source and Severity filters. The overview's "Open My actions →" opens it directly |

## 3. The shell (U05, U29 and every register)

| | Before | After |
|---|---|---|
| Page headings | Assessments, Actions, Reports, Processing Activity Register, Breach register, Rights and grievances, Notice and consent, Processors, Retention, AI risk, Users, Scope wizard — each under a top bar already saying it | Dropped; the one-line purpose under the top bar stays. The top bar's title is the page's only `<h1>` (D-101.4). Exposure keeps "DPDP Exposure Command Centre" (a name, not a repeat — B4 owns that page) |
| Phone top bar | Role badge beside the initials → "Processi…" | The title gets the room ("Processing register" in full); the role is in the account menu ("Signed in as **DPDP Programme Owner** in Mumbai University"). Laptop unchanged |

With the headings gone, three of F3.1's "three names for one register" are
already one; B3 still aligns the menu labels with the top bar.

## 4. Settings

| | Before | After |
|---|---|---|
| **Users** (U07) | No purpose line; the role list offered **Anix AI Consultant**, which the server then refused; "active" | "Who can sign in to Mumbai University, and what each role may do."; **only the roles you may grant** — the server's own rule (`assertCanAssignRole`, D-068), shown instead of discovered; a member whose role you may not grant (the consultant) shows a badge, not a list; **What can each role do?** — a fold-out listing every role with what it may do, read from the same matrix the server enforces; "Active" |
| **Organisation settings** (U06) | "Organisation profile" over four different settings on one long page; industry `university` | Top bar "**Organisation settings**"; four tabs — **Profile** (first) · Significant Data Fiduciary · Third Schedule class · Public pages; industry "University / Higher Education". Each form saves on its own, as before |
| **Scope** (U08) | Three buttons per step: Save answers · Back · Next | **Next** saves the step and moves on (one primary button); **Back** secondary; "Next saves these answers." under the answer steps. A failed save keeps you on the step with the reason. The saved risk tags show in the confirmation toast |

## 5. Signing in and invitations (U01, U02, U44)

| | Before | After |
|---|---|---|
| Sign-in | "Sign in to your organisation." | "**DPDP readiness for your organisation — assessments, registers and reports.**" and, under the button, "**Forgot your password? Ask your organisation's admin.**" (Q4 — a real reset flow is Slice 14) |
| Dead invitation | "This invitation is not valid or has already been used." | …"**Ask your organisation's admin to send a new invitation.**" (the expired one now says the same) |
| `/` | Straight to sign-in | Unchanged — the sign-in line now says what the product is (U44's fix is F1.9's) |

## 6. The public form (U40, F1.12)

| | Before | After |
|---|---|---|
| Code email not sent | "We could not send the email. Ask for a new code." — and after **Send a new code** failed again, a second box: "We could not send the email. Try again in a minute." | One message, saying what to do: "**We could not send the email just now. Wait a minute, then choose Send a new code. Nothing reaches {organisation} until a code is entered.**" A failed resend shows no second box |

---

## 7. What did not change

- **No API, permission, model, migration or seed change.** The overview reads
  the same `GET …/dashboard`; "Your next steps" filters it in the browser, and
  every section in it was already gated by the API — a register a role may not
  read is still absent (Q5).
- **Scores and statuses**: "Not started" is a label. The engine still stores
  `needs_work`; the score, the band, coverage and the workbook oracle (24.7014 /
  25.3014) are unchanged.
- **Who may grant what**: the role list now shows the server's rule; the server
  still enforces it (`assertCanAssignRole` on invite and on change).
- **The bank stays a black box** (D-071): the industry name comes from the
  scope wizard's own `GET /api/v1/industries`, never from core's industry
  list, which carries each industry's question pack. A new unit test fails if a
  page ever imports it.
- **Test ids**: all kept but `save-answers` (the button F1.11 removes). The
  invitation test now expects the role's **name** ("Legal User") where it read
  the code.

## 8. Claude's calls (D-110) — confirm or change

As your DPDP consultant: each call with a verdict, its basis in the official
text (`docs/legal/`, read with `pdftotext`), and the risk if wrong. Counsel
confirms wording; the product never claims counsel has reviewed it.

1. **"Needs someone now" ranks: a Board report overdue → a Board report inside
   its 72 hours → a request or grievance past 90 days → an overdue erasure → a
   request past TrustStack's 30-day target.** *Verdict: confirm.* The Board's
   detailed report is due "within seventy-two hours of becoming aware of the
   breach" (Rule 7(2)(b)) — hours, so it outranks everything measured in days;
   the response window is "a reasonable period not exceeding ninety days"
   (Rule 14(3)); erasure is owed once the purpose "is no longer being served"
   (s.8(7)(a); Rule 8). The 30-day target is TrustStack's, not statute, so it
   comes last and the clock label says so. All three Rules commence on 13 May
   2027 (Rule 1(4)). *Risk if wrong:* the most time-critical duty is not the
   first thing a programme lead sees.
2. **Programme roles = DPDP Programme Owner, Organisation Admin, Consultant,
   Executive Sponsor** (the four the brief names); contributors and the
   Auditor/Reviewer see only their own actions. *Verdict: confirm.* Q5: this
   changes what a role sees **first**, never what it may see — the register
   item comes from a section the API already returned to that role. Nothing in
   the Act turns on it.
3. **"Evidence awaiting your review" is left out** of Your next steps — no
   reader returns it, and the brief forbids a new one. *Verdict: confirm;*
   carry to B2 with the evidence lists (F2.5).
4. **The role is shown by its name, never its code**, on Your next steps'
   "For … · Department Owner" line (which keeps the `user-email` / `user-role`
   test ids). *Verdict: confirm.* Plain words (R3); no legal effect.
5. **Industry names come from `/api/v1/industries`, not from core**, so no
   question-pack code reaches the browser. *Verdict: confirm* — D-071's black
   box; a unit test now guards it.
6. **"1 of 124 questions answered" counts a Not Applicable answer as answered**
   (it was answered, with a reason); the source line drops "— 123 questions
   unanswered" since the progress line now says it. **"Assessed Weight
   Coverage" keeps its name and gains the gloss** — pitfall 1: fold the term
   in, never delete it. *Verdict: confirm.*
7. **"Until most of the DPDP Rules apply — 208 days to 13 May 2027."**
   *Verdict: confirm.* Rules 3, 5–16, 22 and 23 "shall come into force eighteen
   months after the date of publication" (Rule 1(4)); publication was 13
   November 2025 (G.S.R. 846(E)), so 13 May 2027. Rule 4 commences a year after
   publication (Rule 1(3)) and Rules 1, 2 and 17–21 on publication (Rule 1(2)) —
   hence "most", not "all". After the date it reads "3 days past 13 May 2027".
8. **"Not started" on the overview now; the assessment page turns it on in B2;
   reports in B4** — one switch on the shared scorecard. *Verdict: confirm.*
   Q3 as approved: display only.
9. **My actions shows for anyone with an open action — programme roles too,
   second** — and follows the Source/Severity filters. *Verdict: confirm.*
10. **Twelve repeated headings dropped**, including Processing, Retention, AI
    risk and Scope; Exposure's title stays for B4. *Verdict: confirm.*
11. **A role you may not grant is shown as a badge, not a list** — the server
    refuses changing it too. The role guide lists all nine organisation roles,
    marking those you cannot grant. *Verdict: confirm.* Access control is a
    minimum safeguard (Rule 6(1)(b): "appropriate measures to control access");
    showing the rule is better than a refusal after the fact. The server still
    enforces it.
12. **Organisation settings: the menu says "Organisation", the top bar
    "Organisation settings"** (as the account menu already did); each tab keeps
    its own heading with its citation (e.g. "Third-Schedule class (Rule 8(1))").
    *Verdict: confirm.*
13. **Scope: Next saves the two answer steps; the register steps still save row
    by row; a step pill does not save** (as B5a's questionnaire). *Verdict:
    confirm.* Say if you want every pill to save.
14. **Sign-in: "Forgot your password? Ask your organisation's admin."** — Q4.
    *Verdict: confirm, with the open loop kept:* a self-service reset is new
    behaviour for Slice 14. An admin resetting access is itself an access
    control (Rule 6(1)(b)); the reset flow must log it (Rule 6(1)(c)).
15. **F1.12's message** — "Nothing reaches {organisation} until a code is
    entered" keeps B5's promise; a failed resend adds nothing. *Verdict:
    confirm.* No statutory content; Rule 14(3)'s ninety days start only on
    receipt, which the code confirms.

## 9. Evidence

- **Gates** (local stack rebuilt to the clean seed): core **1,251** (+18,
  `first-run.test.ts`), web unit **558** (+5), RLS **541**, typecheck,
  `check:secrets`; all 23 CI SQL gates (no migration; the seed-count gate differs
  locally only in the audit-log count, as always); full e2e **416/416** locally
  (one worker, production build: 414 in one run, plus the new failed-code test
  and the one after it, green on rerun once the test waited for the resend's
  answer). CI is the authority. New e2e:
  Your next steps (own action shown, another's not; the department owner's has
  no register item), progress / Not started / the deadline sentence, My actions
  (department owner lands on it; the Registrar keeps By owner first), the
  admin's role list (no consultant), the role guide, the sign-in and dead-invite
  lines, the scope wizard's Next saving (a reload shows the answer), the
  Organisation tabs, the single failed-code message.
- **Screenshots** (laptop and phone, `.webp`):
  `docs/testing/slice10_5-b1/{before,after}/` — the overview as the Registrar,
  the Dean, the Controller of Examinations and the Admin; Actions as the
  Registrar and the Controller; Organisation settings; Scope; Breaches and
  Processing (headings); Users; sign-in; a dead invitation; the failed-code
  screen.
- **Client-hosted (Slice 15)**: nothing new to host — no dependency, no
  hosted-only call; the industry names come from the app's own API.
