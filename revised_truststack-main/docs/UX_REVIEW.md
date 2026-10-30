# UX review — the simplicity register

**Why this file exists.** Aniket, 2026-10-16: *"simplify the DPDP complexity
for the organization. People should love our platform for its flexibility,
simplicity, ease to use, excellent customer experience."* Every screen,
document and message TrustStack shows must be **legally exact and simple
enough for a non-lawyer**. This register tracks every surface built so far
against one rubric, the fixes made and the ones still owed — so the platform
is brought up to that bar **without breaking anything**, and stays there.

**Rules (CLAUDE.md "Simplicity gate"):**
1. Every slice gate adds its new surfaces here and reviews them before asking
   for approval; the walk-through says in one line how they scored.
2. Course corrections to already-built surfaces go through the **simplicity
   pass** (§3) — small, reviewed batches, never folded silently into an
   unrelated stage.
3. Legal meaning never changes in a copy edit: statute vs TrustStack default,
   citations and caveats (D-011) stay exact. A change that alters a rule is a
   DECISIONS entry, not a UX fix.

---

## 1. The rubric — the non-lawyer test

Score each surface **✅ pass · 🟡 partial · ❌ fail** on each check (R1–R11).

| # | Check | Pass means |
|---|---|---|
| R1 | **One-line purpose** | The top of the screen says in plain words what it is for and who it is for |
| R2 | **Next step is obvious** | One clear primary action; empty states say what to do first |
| R3 | **Plain words** | Short sentences; a legal term is glossed on first use; no internal codes or jargon |
| R4 | **Exact law** | Every legal claim cites its section, rule or Schedule; statute and TrustStack defaults are told apart |
| R5 | **About their organisation** | Uses the client's own records and numbers, not generic text |
| R6 | **Few clicks** | The common task takes the fewest steps; sensible defaults are pre-filled |
| R7 | **Errors help** | A refusal says why in words and what to do instead |
| R8 | **Shows progress** | Status, counts and deadlines are visible at a glance; nothing important is hidden |
| R9 | **Consistent** | The same words, colours and layout mean the same thing everywhere |
| R10 | **Accessible and responsive** | Readable on a laptop and a phone; keyboard usable; contrast adequate; languages where offered |
| R11 | **Fits the screen** | Long lists are paged (25 a page, searchable, sortable); long pages use tabs or sections; the menu and who-is-signed-in-as-which-role stay visible; messages are clear (toast or notice), never missed |

---

## 2. The register — every surface built (Slices 0–10)

Status: 🔲 not reviewed · 🔍 reviewed, fixes listed · 🛠 fixing · ✅ meets the bar.
Score: R1 → R11 left to right, one mark each (✅ pass · 🟡 partial · ❌ fail), as
walked in the Stage A audit (2026-10-17, inside the B0 shell). Fix IDs (F…)
and questions (Q…) are in §4's Stage A entry.

| ID | Surface | Slice | Who uses it | Status | Score (R1–R11) | Top issues | Fix / commit |
|---|---|---|---|---|---|---|---|
| U01 | `/login` — sign in | 0B, 1 | Everyone | ✅ | ✅✅✅✅✅✅✅✅✅✅✅ | Meets the bar after B1: "DPDP readiness for your organisation — assessments, registers and reports."; "Forgot your password? Ask your organisation's admin." (a reset flow is Slice 14, Q4) | F1.9 — Batch B1 |
| U02 | `/invites/accept` — accept an invitation | 1 | Invitees | ✅ | ✅✅✅✅✅✅✅✅✅✅✅ | Meets the bar after B1: a dead or expired invitation says "Ask your organisation's admin to send a new invitation." | F1.9 — Batch B1 |
| U03 | Invitation and one-time-code emails | 1, 3a | Invitees, Data Principals | ✅ | ✅✅✅✅✅✅✅✅✅✅✅ | B4 (approved, D-121): every email in the app's navy `#003366` (pale blue code box), not the old indigo; the invitation says in one line what accepting asks. B5's s.13(3) line stands | F5.6 — Batch B5 · F4.9 — Batch B4 |
| U04 | `/dashboard` — overview | 8, 10 | Everyone | ✅ | ✅✅✅✅✅✅✅✅✅✅✅ | Meets the bar after B1: "Your next steps" first (own actions, overdue first; the most urgent register item for programme roles); industry by name; "208 days to 13 May 2027 · finish date: …"; progress before the score; "Not started" for an untouched domain (Q3) | F1.1–F1.4 · Q3 — Batch B1 |
| U05 | Organisation switcher, nav, layout | 1 | Everyone | ✅ | ✅✅✅✅✅✅✅✅✅✅✅ | B1: no page heading repeats the top bar; on a phone the title gets the room. B3 (approved, D-117): the menu names each register as its top bar does — Processing register · Breach register · Rights and grievances · Notice and consent · Processors · Retention register · AI risk register — one line each, laptop and phone | F1.6 · F1.7 — Batch B1 · F3.1 — Batch B3 |
| U06 | `/dashboard/organization` — organisation, public pages, Third Schedule, SDF | 2, 3a, 5 | Admin | ✅ | ✅✅✅✅✅✅✅✅✅✅✅ | Meets the bar after B1: "Organisation settings", four tabs (Profile first); industry by name | F1.10 — Batch B1 |
| U07 | `/dashboard/users` — members and roles | 1 | Admin | ✅ | ✅✅✅✅✅✅✅✅✅✅✅ | Meets the bar after B1: a purpose line; only the roles the admin may grant (D-068 shown, not discovered); "What can each role do?" from the matrix; "Active" | F1.8 — Batch B1 |
| U08 | `/dashboard/scope` — scope wizard | 2 | Admin, DPO | 🛠 | ✅✅✅✅✅✅✅✅✅✅🟡 | B1: Next saves and moves on (one primary), Back secondary. Left: the Risk questions step is one screen of nine questions — not in the fix list; raise if wanted | F1.11 — Batch B1 |
| U09 | `/dashboard/questions` — question bank view | 3, 8 | Consultant | ✅ | ✅✅✅✅✅✅✅✅✅✅✅ | Meets the bar after B2: a purpose line ("for Anix consultants only; clients never see it"); "Draft" / "Approved"; "201 questions", "weight 7" | F2.7 — Batch B2 |
| U10 | `/dashboard/assessments` — list | 3–5 | DPO | ✅ | ✅✅✅✅✅✅✅✅✅✅✅ | Meets the bar after B2: "In progress"; "17 Oct 2026"; "answered 1 of 124"; one Open; paged and searchable | F2.6 · N5 — Batch B2 |
| U11 | `/dashboard/assessments/[id]` — answering, evidence, scorecard | 4, 5 | Contributors, DPO | 🛠 | ✅✅🟡✅✅✅✅✅✅✅✅ | B2 (approved, D-115): "In progress · 1 of 124 answered · 33 may not apply — confirm or answer them" and a bar; one domain at a time (pills, Next domain, Unanswered only); the claim scale in words (the spec's answer scale, D-114.1); "Reviewed: Partial (evidence level 3 of 5) — this answer counts at most 3"; Questions for my role (a department owner's default); "Not started" on the scorecard. Still 🟡 R3: each question still shows its code ("G1.2") — not in the fix list | F2.1–F2.4 · N2 · Q3 — Batch B2 |
| U12 | `/dashboard/assessments/[id]/gaps` — gap register | 6 | DPO, owners | ✅ | ✅✅✅✅✅✅✅✅✅✅✅ | Meets the bar after B2: a paged, searchable, sortable table (never searched by question code); evidence on an action pages past ten | F2.5 — Batch B2 |
| U13 | `/dashboard/actions` — the one actions view | 6, 8, 10 | Everyone | ✅ | ✅✅✅✅✅✅✅✅✅✅✅ | Meets the bar after B1: "My actions" first for an action owner (programme roles keep By owner first); the purpose line names all five sources; no repeated heading | F1.5 · F1.6 — Batch B1 |
| U14 | `/dashboard/ropa` — processing register | 7 | Register owners | ✅ | ✅✅✅✅✅✅✅✅✅✅✅ | B3 (approved, D-117): one name in menu, top bar and browser tab; "Add a processing activity" the one primary, Import · Export · Ask · Gaps under More (keyboard usable; on a phone the two fit one row) · Slice 11 2a: + "✦ Draft a record from a description" beside the primary, secondary in style; scores kept | F3.1 · F3.3 — Batch B3 |
| U15 | `/dashboard/ropa/new` and `/[ropaId]` — a record | 7 | Register owners | ✅ | ✅✅✅✅✅✅✅✅✅✅✅ | B3 (approved, D-117): five tabs (Who and what · Purpose and ground · Systems and processors · Retention and security · Evidence) with the saved points, one sticky Save; "Risk: High until the unknowns are answered"; s.7(a) in the Act's terms ("has not said they do not consent to its use", D-117), every ground words-first · Slice 11 2a: an accepted AI draft pre-fills the new form under a blue notice ("check every field… nothing is in the register until you do"); scores kept | F3.2 · F3.4 · F3.5 — Batch B3 |
| U16 | `/dashboard/ropa/gaps` — register gaps | 7 | DPO | 🛠 | ✅✅✅✅✅✅✅🟡✅✅✅ | B2 (approved, D-115): the generated gaps in a paged, searchable table with a Record column. R8 🟡 as audited | F2.5 — Batch B2 |
| U17 | `/dashboard/ropa/import` — Excel/CSV import | 7 | DPO | ✅ | ✅✅✅✅✅✅✅✅✅✅✅ | B3 (approved, D-117): a template to download (the thirty columns the importer reads); rejected rows, notes and problems in paged, searchable tables | F3.12 · N6 — Batch B3 |
| U18 | `/dashboard/ropa/lookup` — "what do we hold about…" | 7 | DPO, legal | ✅ | ✅✅✅✅✅✅✅✅✅✅✅ | B3 (approved, D-117): a purpose line (s.11(1)); "Applicant" offered once; results in a paged, searchable table; risk as a label | F3.12 · N7 — Batch B3 |
| U19 | `/dashboard/exposure` — Exposure Command Centre | 9 | Board, DPO | ✅ | ✅✅✅✅✅✅✅✅✅✅✅ | B4 (approved, D-121): **the forecast counts every open action — 4 = the Actions page's 4** (model 1.7.0, Q1); "Statutory ceilings at stake" (Q2); four tabs Where you stand · Penalty heads · What-if · History, no repeated heading; s.37 an information note; "1 action open"; head 7's unanswered areas in one line; the history paged, with each snapshot's model | Q1 · Q2 · F4.1 · F4.2 · N3 · N4 — Batch B4 |
| U20 | `/dashboard/reports` — reports centre | 9, 10 | Admin, DPO | ✅ | ✅✅✅✅✅✅✅✅✅✅✅ | B4 (approved, D-121): three tabs PDF reports · Working files · Stored; "Which report do I need?" one line per audience; generating opens Stored on the new report; every gate kept · Slice 11 2b (D-133.1): "Draft a narrative" on a finished brief, status report or pack (hidden without `report.generate` and the assistant); once accepted, "Print the narrated version" on the same row (survives a reload); a narrated row says "With narrative · figures of vN"; the green line names both versions; scores kept | F4.8 — Batch B4 |
| U21 | Exposure Brief (PDF) | 9 | Board | ✅ | ✅✅✅✅✅✅✅✅✅✅✅ | B4 (approved, D-121): "Critical and high work" counts the three High register actions (Q1); "Statutory ceilings at stake" (Q2); "about 1 action a week"; the main reason never one of eight "not answered" lines · Slice 11 2b: a narrated version opens with "Executive narrative" — who accepted it, "It reads the figures below… It does not assess or certify…" — and its header says "Figures: As recorded in version N"; the figures below are version N's, unchanged | Q1 · Q2 · F4.2 · F4.4 — Batch B4 |
| U22 | Programme Status Report (PDF) | 9 | DPO | ✅ | ✅✅✅✅✅✅✅✅✅✅✅ | B4 (approved, D-121): "From every register."; the source table's five rows total "Actions outstanding" (Q1); "No change since the snapshot of …"; no near-empty page; "Not started" in the scorecard (Q3) | Q1 · Q3 · F4.3 · F4.5 · F4.6 — Batch B4 |
| U23 | Owner Action Pack (PDF) | 9 | Action owners | ✅ | ✅✅✅✅✅✅✅✅✅✅✅ | B4 (approved, D-121): "From every register." — it lists retention and breach actions, and now says so | F4.3 — Batch B4 |
| U24 | Regulator-Ready Evidence Pack (PDF) | 9 | Auditor | 🔍 | ✅✅✅✅✅✅✅✅🟡✅✅ | B4 (approved, D-121): the "Critical and high work" tile counts every open action (Q1); "Statutory ceilings at stake"; head reasons folded. R9 🟡: head 7's "Evidenced by" cell still lists its eight areas (the evidence trail — kept, not in the fix list) | Q1 · F4.4 — Batch B4 |
| U25 | Gap & Action Tracker, ROPA Register, Evidence Index (Excel) | 9, 10 | Programme team | ✅ | ✅✅✅✅✅✅✅✅✅✅✅ | B4 (approved, D-121): the Evidence Index names "The vendor (questionnaire link)", glosses E0–E5 on the About sheet, writes India's dates as date cells; the tracker says "from every register". The tracker's own dates stay text (walk-through call 9) | F4.7 — Batch B4 |
| U26 | Security and Breach Report (PDF) | 10 | CISO | ✅ | ✅✅✅✅✅✅✅✅✅✅✅ | B4 (approved, D-121): "The penalty heads this report covers"; unanswered head 1 areas "Not started" | F4.4 · Q3 — Batch B4 |
| U27 | Legal Position Report (PDF) | 10 | Counsel, DPO | ✅ | ✅✅✅✅✅✅✅✅✅✅✅ | B4 (approved, D-121): "The penalty heads this report covers"; head 7's eight lines one "Not yet answered: …" | F4.4 — Batch B4 |
| U28 | Processor Exposure Report (PDF) | 10 | Procurement | ✅ | ✅✅✅✅✅✅✅✅✅✅✅ | B4 (approved, D-121): "Amend the contract to carry DPDP clauses, then record it"; "No accepted assessment" (B3's words, D-116.9); "The penalty heads this report covers" | F4.4 — Batch B4 |
| U29 | `/dashboard/breaches` — breach register | 10 | CISO | ✅ | ✅✅✅✅✅✅✅✅✅✅✅ | Meets the bar after B1 (the repeated heading dropped) | F1.6 — Batch B1 |
| U30 | `/dashboard/breaches/new` and `/[breachId]` — a breach, its Rule 7 timeline, documents | 10 | CISO | 🔍 | ✅✅✅✅✅✅✅✅✅✅✅ | Meets the bar (Rule 7 timeline, statute vs target told apart, opens on the Timeline tab) · Slice 11 2a: the Rule 7(2)(b) step gains the accepted intimation (Copy, Download, "attach the copy you actually sent under Documents") and "✦ Draft the Board intimation"; scores kept | — |
| U31 | `/dashboard/rights` — rights and grievance register | 10 | DPO, legal | ✅ | ✅✅✅✅✅✅✅✅✅✅✅ | B3 (approved, D-117): "Responded — Fulfilled" / "Responded — Resolved" in the list, as the record says it; one name in menu and top bar | F3.1 · F3.11 — Batch B3 |
| U32 | `/dashboard/rights/new` and `/[requestId]` — a request, response, documents | 10 | DPO, legal | 🔍 | ✅✅✅✅✅✅✅✅✅✅✅ | Meets the bar · **D-139 (fix, 28 Oct): an access request gains "Who the person's data was shared with" (s.11(1)(b)) — one paged table, one copy button, the law in one line** · Slice 11 2a: "✦ Draft a response"; accepting fills "What was done" and leaves the outcome unchosen ("Choose the outcome yourself"); scores kept | — |
| U33 | `/dashboard/consent` — notices, widget, consent register | 10 | DPO | ✅ | ✅✅✅✅✅✅✅✅✅✅✅ | B3 (approved, D-117): Notice · Widget · Consent records tabs, the counts above; purposes by their titles in every staff view; no model version in the copy; twenty pending languages in one line · Slice 11 2b (D-133.3): "Draft a notice from the processing register" beside "Write a new version" (hidden without `consent.write` and the assistant); scores kept | F3.6 — Batch B3 |
| U34 | `/dashboard/consent/notices/new` and `/[noticeId]` — a notice | 10 | DPO, legal | ✅ | ✅✅✅✅✅✅✅✅✅✅✅ | B3 (approved, D-117): a blank notice shows no problems until a purpose field is left or Save is pressed; a saved draft shows them as it opens · Slice 11 2b (D-133.2): a published notice offers "Translate into Hindi" · "Translate into Marathi"; a new notice may open pre-filled from an accepted draft or translation under a blue notice ("A legal draft: check every purpose with counsel… Nothing is saved until you save."); scores kept | F3.7 — Batch B3 |
| U35 | `/dashboard/processors` — processor register | 10 | Procurement | ✅ | ✅✅✅✅✅✅✅✅✅✅✅ | B3 (approved, D-117): "No accepted assessment" (not "Never assessed") | F3.8 — Batch B3 |
| U36 | `/dashboard/processors/[vendorId]` (+ `/assessments/[id]`) — a vendor, its questionnaire, review | 10 | Procurement, reviewers | ✅ | ✅✅✅✅✅✅✅✅✅✅✅ | B3 (approved, D-117): "Progress — 43 answered, 1 not applicable, of 44"; unevidenced claims named by question, the code in brackets. B5a: 44 questions in sections | F3.8 — Batch B3 · N1 — Batch B5a |
| U37 | `/dashboard/retention` and `/[scheduleId]` — retention register, erasures | 10 | DPO, IT | ✅ | ✅✅✅✅✅✅✅✅✅✅✅ | B3 (approved, D-117): "10 years", "1 year" (stored months unchanged; the form says the years beside the box); one name in menu and top bar | F3.1 · F3.9 — Batch B3 |
| U38 | `/dashboard/ai-risk` and `/[aiSystemId]` — AI risk register | 10 | DPO, IT | ✅ | ✅✅✅✅✅✅✅✅✅✅✅ | B3 (approved, D-117): "Educational institution (A3)", the Schedule's words on hover and in the picker; one name in menu and top bar | F3.1 · F3.10 — Batch B3 |
| U39 | `/p/[slug]` — public contact page | 3a | Data Principals | ✅ | ✅✅✅✅✅✅✅✅✅✅✅ | Meets the bar after B5: one name (display name; legal name once in the footer); dead addresses get the plain not-found page | F5.2 · F5.4 — Batch B5 |
| U40 | `/p/[slug]/rights` and `/grievance` — public forms | 3a | Data Principals | ✅ | ✅✅✅✅✅✅✅✅✅✅✅ | Meets the bar after B5: "← Back to … privacy page"; "Send — we'll email you a code"; one name | F5.2 · F5.3 — Batch B5 · F1.12 (one failed-code message) — Batch B1 |
| U41 | `/p/[slug]/notice` — published privacy notice | 3b | Data Principals | ✅ | ✅✅✅✅✅✅✅✅✅✅✅ | Meets the bar after B5: one name; a back link; a missing notice is the plain not-found page | F5.2 · F5.3 · F5.4 — Batch B5 |
| U42 | The consent widget (on the client's own site) | 3b | Data Principals | ✅ | ✅✅✅✅✅✅✅✅✅✅✅ | Meets the bar after B5: names the organisation asking; Accept all and Reject all of equal weight; nothing focused or ticked for the visitor | F5.1 — Batch B5 |
| U43 | `/v/[token]` — vendor questionnaire link | 4b | Vendors | ✅ | ✅✅✅✅✅✅✅✅✅✅✅ | After B5: "Email me a code" primary; questions in the vendor's voice; "x of 44 questions answered" in the sticky Save bar; a dead link is the plain not-found page. Re-opened for R11 (D-107) and met in B5a: one section at a time, "answered x of n" per section, Next saves, Review and send (D-109) | F5.4 · F5.5 — Batch B5 · N1 — Batch B5a |
| U44 | `/` — landing and redirects | 0B | Everyone | ✅ | ✅✅✅✅✅✅✅✅✅✅✅ | Meets the bar after B1: the sign-in page it leads to says what the product is | F1.9 — Batch B1 |
| U45 | The TrustStack Assistant side panel — Explain on a question, an answer's evidence, a gap, an assessment action, a domain's score | 11 (1b) | Everyone with `ai.use` | ✅ | ✅✅✅✅✅✅✅✅🟡✅✅ | Stage 1b (D-127): one shape for every answer (§4.13) — the answer in one sentence, "Why it matters here", one next step that goes somewhere real, the law folded and marked "The law" / "TrustStack default, not the law", Tell me more, the review note and caveat, Yes / No with a comment; a calm wait (no streaming: the answer is checked whole first); refusals as titled notices; Esc closes; full width on a phone. 🟡 R9: "Why this score?" on all sixteen scorecard rows is busy | Stage 1b — `components/ai/assistant-panel.tsx` |
| U46 | `/dashboard/organization#ai` — Organisation settings › AI assistant | 11 (1b) | Admin (change), everyone (read) | ✅ | ✅✅✅✅✅✅✅✅✅✅✅ | Stage 1b (D-127): what the assistant does and never sends, with s.8(2), in two short paragraphs; "On since …, turned on by …, under contract …"; the contract reference required to turn it on; Held off / platform notices in 1a's words; read-only line for those who cannot change it | Stage 1b — `app/dashboard/organization/ai-form.tsx` |
| U47 | The TrustStack Assistant drafting panel — a processing record, the Rule 7(2) intimation, a rights response | 11 (2a) | Register writers | ✅ | ✅✅✅✅✅✅✅✅✅✅✅ | Stage 2a (D-129, D-130): one headline sentence; "Edit anything below. Nothing is saved to the register until you save it there yourself."; the register's own field names; the intimation in the Rule's order as two tabs, (a) Without delay / (b) Within 72 hours, (iv) and (vi) hinted as TrustStack's, not the assistant's; the counsel notice on a legal draft; the law folded and labelled; "What the assistant did not know — you add it"; Use this draft / Accept this draft and Discard; a toast that says what happens next; refusals as titled notices; full width on a phone · Stage 2b (D-134): a notice (purposes editable as in the editor; the fixed withdrawal and Board texts shown in a grey box "Always printed by TrustStack on the notice — not drafted"), a translation (keys read-only, "Kept from the notice — not translated"), a narrative (Headline · Paragraphs · Points to act on, "every number must be one the report itself prints"); "Use this draft" / "Use this translation" / "Accept this narrative"; a toast that says what happens next | Stage 2a — `components/ai/draft-panel.tsx` |
| U48 | Start a Pulse (overview card, Solo or team, inline scope) | 12.3 (planned) | DPO, owner, CA | 🔲 | target ✅×11 (paper, Step 6) | S4 inline scope | — |
| U49 | Answering a Pulse (solo) | 12.3 (planned) | Anyone | 🔲 | target ✅×11 | S1 one set of answer words; S5 no codes; S10 phone | — |
| U50 | Pulse result (actions first, declared score) | 12.3 (planned) | DPO, owner | 🔲 | target ✅×11 | S6 two glossed words; S7 three layers, "held at 50 until…" | — |
| U51 | Repeat Pulse: confirm domains, what changed | 12.3 (planned) | DPO | 🔲 | target ✅×11 | S8 confirm all unchanged in one tap | — |
| U52 | Team Pulse: coordinator | 12.3 (planned) | DPO | 🔲 | target: R6 🟡 → S9 | S9 pre-filled owners, Send all, Settle | — |
| U53 | Team Pulse: my part | 12.3 (planned) | Department owner | 🔲 | target ✅×11 | S10 phone-first | — |
| U54 | Workshop mode | 12.3 (planned) | Professional | 🔲 | target: R10 🟡 → S11 | S11 large type, keyboard 0–5/U | — |
| U55 | Prove this domain; domain states | 12.3 (planned) | DPO, owners, reviewer | 🔲 | target ✅×11 | S6 | — |
| U56 | Board page in the Exposure Brief | 12.3 (planned) | Board | 🔲 | target ✅×11 | guardrail 3.9.1 "declared position" | — |
| U57 | Professional's client table | PK2 (planned) | Professional | 🔲 | target: R11 🟡 → DataTable | paging, search, sort | — |
| U58 | Pulse PDF, white-label | PK2 (planned) | Client, professional | 🔲 | target ✅×11 | wording locked | — |
| U59 | AI helpers on Pulse | 12.3 (planned) | Anyone with AI on | 🔲 | target: R9 🟡 → S12 | S12 one ✦ per question, none on scores | — |

---

## 3. How the course correction runs — without breaking anything

0. **The app shell first (Stage B0, Aniket's request, D-100):** the old app's
   look, a fixed left menu, a fixed top bar with who is signed in and as
   which role, one notification system, pagination and tabs. Spec:
   `docs/slices/SLICE_10_5_simplicity_pass.md` §1.
1. **Audit (one session, read-only).** Walk every surface above on the local
   stack as its real user (MU's seeded people), with screenshots; score
   R1–R10; list issues; rank by impact (what users touch most, and Data
   Principals first, since they are the public). Output: this register
   filled in, plus a prioritised fix list for Aniket's approval.
2. **Fix in small batches by journey**, each its own PR with a before/after
   screenshot set and a manual test:
   (a) first-run and the overview — "what do I do first?";
   (b) assessment, evidence and gaps;
   (c) the registers (ROPA, breach, rights, consent, processors, retention, AI);
   (d) reports and exports;
   (e) the public surfaces (Data Principals and vendors).
3. **Safety net on every batch:** the full gates (core, unit, RLS, every CI SQL
   gate, e2e) stay green; `data-testid`s and API shapes never change; any test
   that asserts on wording changes only with the reviewed new wording; legal
   text checked against the Act and Rules; no migration unless a fix needs
   one (then it is a DECISIONS entry).
4. **Measure:** time-to-first-answer for a new user, clicks per common task,
   and — once Slice 11 lands — the Assistant's thumbs up/down per screen.

## 4. Reviews done

### 2026-10-16 · Stage B0 — the app shell (D-100, D-101) · shell items R2, R6, R8, R9, R10, R11 · ✅ approved 2026-10-17 (D-102)

Not a surface audit (that is Stage A) — the frame every surface now sits in.
What changed for every dashboard page, and which checks it moves:

| Check | Before B0 | After B0 |
|---|---|---|
| R2 Next step | Primary buttons and links in a generic indigo; on long pages the next step was often below the fold | One brand primary (navy); long detail pages open on the tab that needs action (Timeline, Response, Erasure, Contract, Questions) |
| R6 Few clicks | The menu was a wrapping row of 16 links at the top of the page — scrolled away on every long page | A fixed left menu, grouped Programme / Registers / Settings, always one click away; collapsible; a drawer on a phone |
| R8 Shows progress | Long lists rendered every row; counts only in the summary tiles | "Showing 1–25 of N" under every growing list; tab badges show counts and "Overdue" / "Gap" |
| R9 Consistent | Messages in six ad-hoc styles; three list styles (cards, tables, plain lists) | One `<Notice>` (icon, coloured edge) for every message; one `<DataTable>` for every growing list; one set of colour tokens |
| R10 Accessible and responsive | Narrow `max-w-4xl` column; no skip link; no keyboard tabs | Full width to a comfortable maximum; "Skip to content"; tabs with arrow keys; `role="alert"`/`"status"` on messages; a phone drawer; tables scroll sideways on a phone |
| R11 Fits the screen | No paging, no search, one endless page per breach / request / schedule / vendor / assessment; who-am-I only on the overview | 25 a page with search and sort on 11 lists; tabs on 5 detail pages and Actions; the signed-in person, **their role** and the organisation in the top bar on every page; success toasts for saves |

Surfaces touched (the audit still scores each): U01, U02, U04–U07, U09–U15,
U19, U20, U29–U40, U43. Before/after screenshots of every page at laptop and
phone width: `docs/testing/slice10_5-b0/`. Walk-through:
`docs/testing/SLICE_10_5_b0_walkthrough.md`; manual test:
`docs/testing/SLICE_10_5_b0_manual_test.md`.

**Left for Stage A** (seen while building, not fixed — no rule or copy
change in B0): the overview's "Signed in as … `legal_user`" panel now
repeats the top bar with a raw role code; several pages repeat the top
bar's title as their own heading; the gap register and per-item evidence
lists are not paged; the scope wizard and the ROPA record are long single
pages (not in B0's tab list).

### 2026-10-17 · Stage A — the audit of all 44 surfaces · ✅ fix list approved with the recommendations, Q1–Q5 answered (D-104)

**How it was walked.** The local stack rebuilt clean (reset → migrate →
seed; gates green first: core 1,229 · web unit 549 · RLS 541), a production
build on `:3100`, MU's public pages opened on the LOCAL database only. Every
dashboard page as the DPDP Programme Owner at laptop (1366×800) and phone
(390×844) width; the overview and the pages each role lives on as the Admin,
the Consultant, the Dean, Legal, the CISO and the Controller of Examinations
(a department owner); the four public pages as a Data Principal; the consent
widget on a stand-in website; a live vendor link end to end (Legal sends it,
the vendor confirms the code and opens the questionnaire); four of the five emails
rendered from their templates (the vendor's code email shares the intake code's layout); and all ten reports generated for MU on the
local database, which was rebuilt afterwards. B0's before/after shots
(`docs/testing/slice10_5-b0/after/`) are the laptop and phone view of the 37
pages as they stand (no code has changed since). The surfaces B0 did not reach
are in `docs/testing/slice10_5-a/`: the role overviews, the widget, the vendor
link, the emails, the public notice, the dead-link page, and the ten reports
(`reports/`). Browser console: no errors except the expected 404 on a dead
vendor link.

**Overall.** Nothing is legally wrong on the page, and the Slice 10 registers
are close to the bar — the breach and rights records (U30, U32) already meet
it: statute and TrustStack targets are told apart everywhere they were
checked. What falls short is (1) **one inconsistency that reaches the Board**
— the exposure forecast reads only assessment and processing-register actions
(Q1); (2) **first-run**: the overview is the same for all seven roles and
never says what *you* should do next; (3) **plain words**: raw codes
(`in_progress`, `university`, `E3`, `C4`, `A3`, `alumni_updates`) and model
jargon on the pages people use most; (4) **two long pages** B0 left (the ROPA
record, the consent page); (5) **the public surfaces**, which name the
organisation two ways, and a widget that never says who is asking.

#### Ranked by impact (Data Principals and first-run first, then most-used)

| Rank | What | Surfaces | Fix |
|---|---|---|---|
| 1 | The Board brief says "Critical and high work: nothing outstanding" while three High actions are open (breach, rights, retention actions are not in the forecast) | U19, U21, U22, U24 | **Q1** |
| 2 | The consent widget never names the organisation, and "Accept all" outweighs "Reject all" | U42 | F5.1 |
| 3 | The overview is identical for every role — no "your next steps" | U04 | F1.1 |
| 4 | An action owner has no "My actions"; the page's purpose line names two of five sources | U13 | F1.5 |
| 5 | The assessment speaks in codes: `in_progress`, "answered as asked", bare 0–5, `E3` caps | U10, U11 | F2.1–F2.3 |
| 6 | The organisation is "Mumbai University" and "University of Mumbai" on the same public page | U39–U41, U43 | F5.2 |
| 7 | The s.37 blocking note is a red error box on Exposure for an organisation with no penalty | U19 | F4.1 |
| 8 | A dead vendor or invite link is Next's bare "404" | U43, U02 | F5.4 |
| 9 | The consent page is one long page with raw purpose keys and a stale model version | U33 | F3.6 |
| 10 | The ROPA record is one long page of thirteen areas | U15 | F3.2 |
| 11 | Users offers a role the server refuses | U07 | F1.8 |
| 12 | "Ceilings where you are exposed" adds heads not yet assessed | U04, U19, U21 | **Q2** |

#### Questions for Aniket — rule or model calls, not UX fixes (§3 rule 3)

- **Q1 · The forecast counts two of five action sources.** `readExposureInput`
  passes only the assessment's and the processing register's actions to the
  model, so the forecast, "the actions that retire the most exposure", the
  Programme Status source table and the "Critical and high work" tile ignore
  breach, rights and retention actions (MU: 4 open, the forecast says 1, the
  brief says "Nothing outstanding"). The Actions page, the Gap & Action Tracker
  and the Owner Action Pack count all five. *Recommended:* count every open
  action in the forecast and the work tiles (a model change — a new model
  version and its snapshot pin, a DECISIONS entry), keeping penalty-head
  leverage as it is. *Alternative:* keep the model and relabel every tile
  "assessment and processing-register work only".
- **Q2 · "Statutory ceilings where you are exposed" — ₹700 crore** sums the
  ceilings of every head at stake, including heads 1 and 3, which are *not yet
  assessed*. The tile's own note says so ("Exposed, partially mitigated or not
  yet assessed"), but the title says "exposed". *Recommended:* relabel "Statutory
  ceilings at stake" everywhere (copy only, the figure unchanged); a Board reader
  then does not read ₹700 crore as found exposure.
- **Q3 · An unanswered domain says "Needs Work".** The engine gives a domain
  with nothing answered the status `needs_work` (below 61%), matching the
  workbook oracle. *Recommended:* show "Not started" where a domain has no
  answered question, in the app and the reports, leaving the stored status and
  the oracle untouched (a display rule — confirm it).
- **Q4 · No password reset.** The sign-in page has no "forgot password" and no
  route to one. *Recommended now:* a line "Forgot your password? Ask your
  organisation's admin" (F1.9). A real reset flow (Supabase recovery email) is
  new behaviour for Slice 11 or 14 — your call.
- **Q5 · Role-tailored overview (F1.1)** changes what each role sees first, not
  what it may see or do: every panel still sits behind its `<Can>` and the
  backend. Confirm that is a UX fix, not a rule change.

#### The fix list, by batch (each batch its own session and PR; nothing starts before approval)

Effort S ≤ ½ day · M ≈ 1 day · L 2+ days. Risk: **copy** (words only) ·
**layout** (arrangement, no behaviour) · **behaviour** (what a control does,
client-side only). No API, permission, model or migration change in any fix
below; every `data-testid` kept; tests that assert old wording change with the
approved new wording only.

**B1 — first-run and the overview** (U01, U02, U04–U08, U13, U44)

| ID | Fix | Effort | Risk |
|---|---|---|---|
| F1.1 | Replace the overview's "Signed in as" panel (the top bar shows it) with **"Your next steps"**: your open actions (overdue first), evidence awaiting *your* review, and for the programme roles the one most urgent register item (overdue erasure, Board report due) — each a link. Built from the readers the page already calls, filtered to the signed-in user | M | layout |
| F1.2 | Organisation line: "University / Higher Education · consultant-assisted" (labels, not codes) | S | copy |
| F1.3 | Exposure tile: "208 days to 13 May 2027 · finish date: not enough history yet" | S | copy |
| F1.4 | Readiness tile leads with progress ("1 of 124 questions answered"), then the score; "coverage" glossed as "the weight of the domains that apply" | S | copy |
| F1.5 | Actions: a **"My actions"** tab first for anyone who owns one (programme roles keep "By owner" first); the purpose line names all five sources | M | layout |
| F1.6 | Drop page headings that repeat the top bar's title; keep the one-line purpose | S | layout |
| F1.7 | Phone top bar: the page title gets the room; the role badge moves into the account menu | S | layout |
| F1.8 | Users: a purpose line; only the roles the admin may assign are offered (the server rule, D-068, shown, not discovered); "What can each role do?" fold-out read from `can()`; "Active" | M | layout |
| F1.9 | Sign-in: one line on what TrustStack is, and "Forgot your password? Ask your organisation's admin"; a dead invite says who can send a new one | S | copy |
| F1.10 | Organisation page: heading "Organisation settings"; industry as its label; the four settings as tabs or anchored sections | S | layout |
| F1.11 | Scope wizard: "Next" saves and moves on (one primary), "Back" secondary; "Save answers" folded in | M | behaviour |

**B2 — assessment, evidence and gaps** (U09–U12, U16)

| ID | Fix | Effort | Risk |
|---|---|---|---|
| F2.1 | Assessment header: "In progress · 1 of 124 answered · 33 may not apply — confirm or answer them"; a progress bar; each domain card shows "answered x of y" | S | copy |
| F2.2 | Maturity picker shows the engine's own level names (Level 0 Not Started … Level 5 Continuous Assurance) with a one-line meaning each | M | copy |
| F2.3 | Evidence in words: "Reviewed: Partial (evidence level 3 of 5) — this answer counts at most 3"; the `E3` code kept in a tooltip | S | copy |
| F2.4 | A "Questions for my role" filter (the question's owner role matched to the user's role) — the default for a department owner | M | layout |
| F2.5 | Gap register and register gaps through `<DataTable>` (25 a page); evidence lists on an item paged past ten | M | layout |
| F2.6 | Assessments list: status label, "17 Oct 2026", "answered x of y", one "Open" | S | copy |
| F2.7 | Question bank: a purpose line; "Draft"/"Approved"; "201 questions" | S | copy |

**B3 — the registers** (U14, U15, U17, U18, U29–U38)

| ID | Fix | Effort | Risk |
|---|---|---|---|
| F3.1 | One name per register in menu, top bar and heading: Processing register · Breach register · Rights and grievances · Notice and consent · Processors · Retention register · AI risk register | S | copy |
| F3.2 | ROPA record (new and existing) in tabs — Who and what · Purpose and ground · Systems and processors · Retention and security · Evidence — each tab showing its completeness points; Save stays one button | L | layout |
| F3.3 | ROPA list: "Add a processing activity" the one primary; Import, Export, Ask, Gaps under "More" | S | layout |
| F3.4 | A blank record says "Risk: High until the unknowns are answered" | S | copy |
| F3.5 | s.7(a) option: "A specified purpose the person voluntarily gave the data for, and has not objected to (s.7(a))" — legal wording, counsel to check. **Built as "…and has not said they do not consent to its use (s.7(a))" — changed at the gate, D-117** | S | copy |
| F3.6 | Consent page in tabs — Notice · Widget · Consent records; purpose titles instead of keys in staff views; drop "(exposure model 1.3.0)"; the twenty pending languages folded into one line | M | layout |
| F3.7 | Notice editor: validation messages on Save or on leaving a field, not on a blank form | S | behaviour |
| F3.8 | Processors: "No accepted assessment" instead of "Never assessed"; questionnaire summary "43 answered, 1 not applicable, of 44"; unevidenced claims named by question, code in brackets | S | copy |
| F3.9 | Retention periods in years where whole ("10 years", "18 months") | S | copy |
| F3.10 | AI register: the exemption by its short label, the code in brackets | S | copy |
| F3.11 | Rights list: "Responded — Fulfilled" / "Responded — Resolved", matching the filter and the record | S | copy |
| F3.12 | Import: a template to download; Look-up: a purpose line, people types folded by case and plural | S | layout |

**B4 — reports, exports and exposure** (U19–U28, U03 staff emails)

| ID | Fix | Effort | Risk |
|---|---|---|---|
| F4.1 | The s.37 note as a neutral legal note under the tiles, not a red error | S | layout |
| F4.2 | "1 action open" / "N actions open" (plural) everywhere the model's text counts | S | copy |
| F4.3 | Stale source lines ("from the assessment and the processing register") → "from every register" in the Programme Status and Owner Action Pack | S | copy |
| F4.4 | "Penalty heads 2 and 1" → "The penalty heads this report covers"; head 7's "not answered yet" lines folded into one ("Not yet answered: …"); the processor fix says "Amend the contract to carry DPDP clauses, then record it" | S | copy |
| F4.5 | Programme Status: keep short tables with the next section (no near-empty page); "No change since the snapshot of …" instead of "from ₹700 crore to ₹700 crore" | S | layout |
| F4.6 | Unanswered domains "Not started" in the scorecards (follows Q3) | S | copy |
| F4.7 | Evidence Index: "The vendor (questionnaire link)" as uploader; `E0–E5` glossed on the About sheet; dates as date cells | S | copy |
| F4.8 | Reports centre: a "Which report do I need?" line per audience; three tabs — PDF reports · Working files · Stored | M | layout |
| F4.9 | Emails in the app's navy, not the old indigo; the invite says in one line what the person will be asked to do | S | copy |

**B5 — the public surfaces** (U39–U43, U03 Data Principal emails) — *recommended to run first, with B1*

| ID | Fix | Effort | Risk |
|---|---|---|---|
| F5.1 | Widget: "Mumbai University asks for your consent…" (the Data Fiduciary named, as the notice it cites does — s.5, Rule 3); "Accept all" and "Reject all" given equal weight (consent must be free, s.6(1)) | S | copy |
| F5.2 | One name per organisation on public pages: the display name, with the legal name once in the footer ("Mumbai University — University of Mumbai") | S | copy |
| F5.3 | Public forms: "← Back to [organisation]'s privacy page"; the button "Send — we'll email you a code" | S | copy |
| F5.4 | One branded not-found page for every dead public target (vendor link, invite, closed `/p/…`): "This link has expired, has been used, or does not exist. Ask whoever sent it for a new one." — still the single 404 of D-086.1 | S | layout |
| F5.5 | Vendor link: "Email me a code" the primary button; the questions in the vendor's voice ("Does your company…") on this page only (the staff view keeps its wording); "x of 44 answered" and a sticky Save | M | copy |
| F5.6 | Grievance receipt email: "If you are not satisfied with the response, you may complain to the Data Protection Board of India after using this grievance route (section 13(3))" — the notice's own wording; counsel to check | S | copy |

**Approved 2026-10-17 (D-104)** — every fix as written; Q1 count every
action source (model 1.7.0, in B4); Q2 "Statutory ceilings at stake" (B4);
Q3 "Not started" as a display rule (B1, B2, B4); Q4 the sign-in line now, a
reset flow before launch (Slice 14); Q5 a UX fix. **Order: B5, B1, B2, B3, B4.**

**Effort in all:** B1 ≈ 4 days · B2 ≈ 3 · B3 ≈ 4 · B4 ≈ 2 · B5 ≈ 2 — five
sessions, one batch each, plus Q1 if approved (its own small model change,
best folded into B4 since it touches the reports).

**Additions approved 2026-10-17 (D-107) — the paging and tabs sweep.** Aniket,
testing B5, found the processor questionnaire one long page. A sweep of every
page for lists and long pages the fix list did not cover found these:

| # | Fix | Surface | Batch | Effort | Risk |
|---|---|---|---|---|---|
| N1 | Processor questionnaire — the vendor's link page **and** the staff page: one tab per section (A–G) plus a final **Review and send** (vendor) / **Review** (staff) tab; "x of n answered" on each tab; Back / Next; the sticky Save stays | U43, U36 | **B5a (first)** | M | layout |
| N2 | Assessment questions: one domain at a time — "answered x of y" per domain, Previous / Next domain, an "Unanswered only" filter | U11 | B2 | M | layout |
| N3 | Exposure Command Centre in tabs — Where you stand · Penalty heads · What-if · History | U19 | B4 | M | layout |
| N4 | Exposure history through `<DataTable>` | U19 | B4 | S | layout |
| N5 | Assessments list through `<DataTable>` (it grows with every re-assessment, Slice 12) | U10 | B2 | S | layout |
| N6 | ROPA import: the preview and the rejected rows through `<DataTable>` | U17 | B3 | S | layout |
| N7 | ROPA look-up results through `<DataTable>` | U18 | B3 | S | layout |
| Guard | A unit test fails when a page renders a list of records without `<DataTable>`, unless the list is allowlisted with its reason (small fixed lists, a top-N summary) | all | **B5a** | S | none |

**Order now: B5a, B1, B2, B3, B4.** Already in the fix list and not repeated
here: F1.5 (My actions tab), F1.10 (Organisation tabs), F1.11 (scope steps),
F2.5 (gap registers, evidence lists), F3.2 (ROPA record tabs), F3.6 (consent
tabs), F4.8 (reports tabs).

### 2026-10-17 · Batch B5 — the public surfaces (F5.1–F5.6) · ✅ approved and merged 2026-10-17 (D-105, D-106)

What Data Principals and vendors see, made plain without changing a rule:
the consent widget names the organisation asking and gives refusal the same
weight as acceptance; one name per organisation on every public page; a way
back from each form and a Send button that says a code comes next; one plain
not-found page for every dead public target (still a single 404, D-086.1); the
vendor's questionnaire in the vendor's own voice with a live answered count;
the s.13(3) line on a grievance receipt. U39–U43 move to ✅; U03 is half done
(its colour is B4's F4.9). Walk-through: `docs/testing/SLICE_10_5_batch5_walkthrough.md`;
manual test: `docs/testing/SLICE_10_5_batch5_manual_test.md`; screenshots:
`docs/testing/slice10_5-b5/{before,after}/`.

One finding from Aniket's manual test, carried into B1 as **F1.12**: the failed-code
screen of the public form says "we could not send the email" twice, in two
wordings — one message, saying what to do (D-106).

### 2026-10-17 · Batch B5a — the processor questionnaire in sections (N1) and the paging guard (D-107, D-108) · ✅ approved and merged 2026-10-17 (D-109)

Added by Aniket while testing B5. **U43** (the vendor's link) and **U36** (the
staff questionnaire): one section at a time — pills A–G with "answered x of n"
(green when complete), Next saves and moves on, Back, and a last **Review and
send** (vendor: per-section summary, uncited claims, the declaration, **Sign and
submit**) / **Review** (staff). The pills wrap on a phone. R11 moves from 🟡 to ✅
on both once approved. **The paging guard** (`tests/unit/paging-guard.test.ts`)
now holds every batch: a list rendered row by row outside `<DataTable>` needs an
allowance with its reason, and an "owed" allowance must be lowered by the batch
that pages it. Screenshots: `docs/testing/slice10_5-b5a/`. Walk-through and
manual test: `docs/testing/SLICE_10_5_batch5a_{walkthrough,manual_test}.md`.

### 2026-10-17 · Batch B1 — first-run and the overview (F1.1–F1.12, Q3–Q5) · ✅ approved and merged 2026-10-17 (D-110, D-112)

What a person sees first, made plain without changing a rule. The overview opens
on **Your next steps** — the person's own open actions, overdue first, and for the
programme roles the one register item that most needs someone (Rule 7(2)(b)'s 72
hours first) — then the organisation's industry by name, the deadline as a
sentence ("208 days to 13 May 2027 · finish date: …"), progress before the score
and "Not started" for an untouched domain (Q3, display only). Actions gains **My
actions** and a five-source purpose line; twelve repeated headings are gone and a
phone gives the title the room; Users offers only the roles the admin may grant,
with a "What can each role do?" guide from the same matrix; Organisation settings
in four tabs; the scope wizard's Next saves; sign-in says what TrustStack is and
who helps with a forgotten password (Q4); the public form's failed-code screen
says it once (F1.12). U01, U02, U04, U06, U07, U13, U29 and U44 move to ✅; U05
waits for F3.1 (B3); U08 keeps R11 🟡 (a long step, not in the fix list).
Walk-through: `docs/testing/SLICE_10_5_batch1_walkthrough.md`; manual test:
`docs/testing/SLICE_10_5_batch1_manual_test.md`; screenshots:
`docs/testing/slice10_5-b1/{before,after}/`.

### 2026-10-18 · Batch B2 — assessment, evidence and gaps (F2.1–F2.7, N2, N5, Q3) · ✅ approved and merged 2026-10-18 (D-114, D-115)

The assessment, made plain without changing a rule. Its header leads with
progress ("In progress · 1 of 124 answered · 33 may not apply — confirm or answer
them", and a bar); the questions come **one domain at a time** — sixteen pills
with "answered x of y", Next domain, **Unanswered only**, the chosen domain in the
link; the 0–5 picker names each level from the spec's **answer** scale (not the
score bands — D-114.1, put to Aniket); evidence reads "Reviewed: Partial
(evidence level 3 of 5) — this answer counts at most 3" with `E3` in a tooltip; a
department owner opens on **Questions for my role** (matched on the bank's
suggested owner — a guide, not a lock); the scorecard says "Not started". The
list, the gap register and the register's gaps are paged, searchable tables
(the gap search never matches a question code); every item's evidence pages past
ten; the question bank says what it is for and puts a unit on every count. An
answered question's picker now opens on its saved level (a defect from before).
U09, U10, U12 meet the bar (approved, D-115); U11 keeps R3 🟡 (question codes shown,
not in the fix list); U16 keeps R8 🟡 as audited. Walk-through:
`docs/testing/SLICE_10_5_batch2_walkthrough.md`; manual test:
`docs/testing/SLICE_10_5_batch2_manual_test.md`; screenshots:
`docs/testing/slice10_5-b2/{before,after}/`.

### 2026-10-18 · Batch B3 — the registers (F3.1–F3.12, N6, N7) · ✅ approved and merged 2026-10-18 (D-116, D-117)

The registers, made plain without changing a rule. The menu names each register
as its top bar does. A processing record is five tabs — Who and what · Purpose and
ground · Systems and processors · Retention and security · Evidence — each badge
the points the register saved, every tab kept loaded, one sticky Save for all; a
blank record says "Risk: High until the unknowns are answered"; the s.7(a) ground
reads "A specified purpose the person voluntarily gave the data for, and has not
said they do not consent to its use (s.7(a))" (the closer wording, chosen at the
gate — D-117; listed for counsel), and every ground reads words first, the section
in brackets. The register has one primary action and a keyboard-usable
More. Consent is Notice · Widget · Consent records, purposes by their titles, no
stale model version, twenty pending languages in one line; a blank notice is not
told off. Processors say "No accepted assessment" and name each unevidenced claim
by its question; retention says "10 years"; the AI register names the Fourth
Schedule exemption ("Educational institution (A3)"); the rights list says
"Responded — Fulfilled". The import offers a template and pages its rejected rows;
the look-up says what it is for, offers "Applicant" once and pages its results.
U05, U14, U15, U17, U18, U31, U33–U38 meet the bar (approved, D-117). Walk-through:
`docs/testing/SLICE_10_5_batch3_walkthrough.md`; manual test:
`docs/testing/SLICE_10_5_batch3_manual_test.md`; screenshots:
`docs/testing/slice10_5-b3/{before,after}/`.

### 2026-10-19 · Batch B4 — reports, exposure and emails (Q1 model 1.7.0, Q2, F4.1–F4.9, N3, N4, Q3) · ✅ approved and merged 2026-10-19 (D-119–D-121) — Slice 10.5 closed

The last batch of Slice 10.5. **One rule changes, on purpose (Q1, D-104.1):** the
forecast counts every open action. The breach, rights and retention actions,
which hang on no gap row, now count in the forecast, "Critical and high work" and
the Programme Status source table. So Exposure says what Actions says (4 = 4 on
MU). That is exposure model **1.7.0**, with one migration replacing three SQL
functions. No head's status, position, ceiling or leverage moves. Everything
else is wording, layout and paging. "Statutory ceilings at stake" everywhere
(Q2). Exposure is four tabs (Where you stand · Penalty heads · What-if ·
History), with no repeated heading, the s.37 note as information, "1 action
open", head 7's unanswered areas in one line, and the history paged with each
snapshot's model. The reports say "From every register.", "The penalty heads
this report covers", "Amend the contract to carry DPDP clauses, then record it",
"No accepted assessment", "No change since the snapshot of …" and "Not started",
with no near-empty page. The Evidence Index names the vendor, glosses E0–E5 and
writes real dates. The reports centre is PDF reports · Working files · Stored,
each led by "Which report do I need?". The emails are in the app's navy, and
the invitation says what accepting asks. U03, U19–U23 and U25–U28 meet the bar
(approved, D-121); U24 keeps R9 🟡 (head 7's evidence-trail cell, kept). Walk-through:
`docs/testing/SLICE_10_5_batch4_walkthrough.md`; manual test:
`docs/testing/SLICE_10_5_batch4_manual_test.md`; screenshots and report pages:
`docs/testing/slice10_5-b4/{before,after}/`.

### 2026-10-19 · Slice 11 Stage 1a — the safe AI gateway (no screen) · ✅ approved 2026-10-19 (D-125, D-126)

**No new surface to score.** Stage 1a is API-only: `POST …/ai/question_helper` and
`GET …/ai`. Its wording is ready for the panel and follows the non-lawyer bar: the
answer's one shape (§4.13 — one sentence, why it matters, one next step, the law folded
away, "Tell me more"); every off-state, limit and rejection message in plain words
(core `ai-tasks.ts`: `AI_OFF_MESSAGE`, `AI_LIMIT_MESSAGE`, `AI_REJECTION_MESSAGE`); and the
review note and D-011's caveat on every answer. **The panel is scored here at Stage 1b**
(a new U-row), with the reference set's results. Walk-through:
`docs/testing/SLICE_11_stage1a_walkthrough.md`; manual test:
`docs/testing/SLICE_11_stage1a_manual_test.md`.

### 2026-10-20 · Slice 11 Stage 1b — explain in the app (U45, U46) · ✅ approved 2026-10-20 (D-127, D-128)

**Two new surfaces, scored.** **U45, the assistant panel**, meets the bar on ten checks.
R9 is 🟡: "Why this score?" on every scored scorecard row is sixteen small buttons, kept
because the question is asked of the row in front of the person (walk-through §9 call 10).
**U46, the AI assistant tab** in Organisation settings, meets all eleven. U06 gains a
fifth tab; U11, U12 and U13 gain an Explain button each and keep their scores (U11's R3 🟡
for the question code is unchanged and not this stage's). The answer's wording is checked
by the reference set (20 cases, `packages/core/src/ai-reference-set.ts`): one-sentence
headline, statute told apart from TrustStack's targets, a real next step, never
"compliant". Walk-through: `docs/testing/SLICE_11_stage1b_walkthrough.md`; manual test:
`docs/testing/SLICE_11_stage1b_manual_test.md`; screenshots:
`docs/testing/slice11-1b/{before,after}/`.

### 2026-10-20 · Slice 11 Stage 2a — drafts for the registers (U47; U14, U15, U30, U32) · ✅ approved 2026-10-21 (D-130, D-131)

**One new surface, scored: U47, the drafting panel**, meets all eleven checks. R11 met by
putting the intimation's eleven sections in two tabs, the Rule's own (a) and (b), after
Claude's own scoring found one long scroll. Four surfaces gain a button and keep their scores:
U14 (the register), U15 (the pre-filled form, under a notice), U30 (the Rule 7(2)(b) step, with
the accepted text to copy and the attach line), U32 (the Response step; the outcome is left for
a person). Wording checked by the reference set's ten drafting cases (live 10 of 10): a
one-sentence headline, statute told apart, placeholders kept, never an outcome, never
"compliant". Walk-through: `docs/testing/SLICE_11_stage2a_walkthrough.md`; manual test:
`docs/testing/SLICE_11_stage2a_manual_test.md`; screenshots:
`docs/testing/slice11-2a/{before,after}/`.

### 2026-10-22 · Slice 11 Stage 2b — a notice, its translation, a report's narrative (U47; U20, U21, U33, U34) · ✅ approved 2026-10-22 (D-133–D-136)

**No new surface; U47 grows three drafting modes** and keeps all eleven checks: one headline
sentence, the counsel line on every 2b draft (all three are legal drafts), the notice's purposes in
the notice editor's own words, a translation's keys locked and said so, the narrative's number rule
said before it is enforced, and what TrustStack prints itself shown, not drafted (R3, R7). Four
surfaces gain a button and keep their scores: U33 and U34 (notice and translation, the editor
pre-filled under a notice), U20 (draft, then print — two deliberate clicks, never automatic), U21
(the narrated Exposure Brief says what the narrative is and whose figures it reads). Phone width
checked for every panel and page (`after/*--phone.webp`); no console error. Wording checked by the
reference set's ten new cases (live 10 of 10). Walk-through:
`docs/testing/SLICE_11_stage2b_walkthrough.md`; manual test:
`docs/testing/SLICE_11_stage2b_manual_test.md`; screenshots: `docs/testing/slice11-2b/{before,after}/`.

### 2026-10-28 · Fix s.11(1)(b) — who the data was shared with (U32) · ✅ approved and merged 2026-10-28 (D-139, D-140)

**No new page; U32 gains one step** on an access request and keeps all eleven checks: a headline that
says what the reply must contain and that a person keeps only what concerns this requester; one
`<DataTable>` (search, paging) of recipients with the register's own label and the kinds of data; a
plain count of records left out (another s.7 use) or listed until decided; one "Copy the list for the
reply" button; the s.11(1)(b) and s.11(2) note in one line. Free-text recipients are flagged "check who
this is" (MU's seed names internal teams — a ROPA field hint is proposed). Walk-through:
`docs/testing/FIX_s11_sharing_walkthrough.md`; manual test: `docs/testing/FIX_s11_sharing_manual_test.md`;
screenshots: `docs/testing/fix-s11/{before,after}/`.
