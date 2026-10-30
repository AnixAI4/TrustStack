# Slice 10.5 · Batch B5 — walk-through: the public surfaces

Built 2026-10-17 on `slice/10-5-b5-public` — **PR #31**, stacked on PR #30 (B0),
so it targets `slice/10-5-simplicity` (D-104.9). Opened by your message "Do this
task here: Slice 10.5 Batch B5 — public surfaces", after you approved the Stage A
fix list with the recommendations (D-104). Built as `docs/UX_REVIEW.md` §4
"Stage A", fixes **F5.1–F5.6**. Claude's calls the fix list did not make:
**D-105** (and §4 below).

**Nothing about the data, the law or who may do what changed**: no API, no
permission, no model, no migration, no seed. Every `data-testid` is kept. Only
what **Data Principals and vendors** see changes. The manual test is
`docs/testing/SLICE_10_5_batch5_manual_test.md` (eight steps, about 20 minutes).
Its gate is your **"Batch B5 approved"** on your laptop.

## What you are approving

1. **The consent widget says who is asking** and lets a visitor refuse as
   easily as accept (F5.1).
2. **One name per organisation** on every public page and the vendor link — the
   legal name once, in brackets, in the footer (F5.2).
3. **A way back** from each form and the notice, and a **Send button that says a
   code comes next** (F5.3).
4. **One plain not-found page** for every dead public link or address, in place
   of Next's bare "404" — still telling nothing apart (F5.4).
5. **The vendor's questionnaire in the vendor's own voice**, with the code button
   as the obvious first step and a live "x of 44 questions answered" (F5.5).
6. **A grievance receipt that says what comes next** — the Board, after the
   grievance route (F5.6).
7. **The seven calls in D-105** (summarised in §4).

---

## 1. Data Principals — the public pages and the widget

| | Before | After |
|---|---|---|
| The widget's first sentence | "We ask for your consent to use your personal data…" — never says who "we" is | "**Mumbai University** asks for your consent to use your personal data for the purposes below. Nothing is ticked: choose what you agree to." |
| Accept / Reject | **Accept all** filled navy; **Reject all** outlined — refusing looks secondary | **Accept all** and **Reject all** look exactly the same (both filled); **Save my choices** outlined |
| Focus when it opens | On **Accept all** (Enter accepts everything) | On the dialog itself — nothing is pre-selected |
| The organisation's name | "MUMBAI UNIVERSITY" at the top, "**University of Mumbai** answers every request…" at the bottom — two names, no link between them | Display name throughout; the footer reads "**Mumbai University (University of Mumbai)** answers every request…" — the legal name once, tied to the name people know |
| Getting back | Only the small organisation name at the top was a link | "**← Back to Mumbai University's privacy page**" on the request, grievance and notice pages (not on the home page itself) |
| The form's button | "Send" | "**Send — we'll email you a code**" |
| A dead link or address | Next's bare "**404 — This page could not be found.**" | One plain page with the navy shield: "**This page is not available.** The link may have expired or already been used, or the address may not be right. If someone sent you this link, ask them for a new one…" — status still 404 |
| The grievance receipt email | Reference, dates, Rule 14(3), identity note | The same, ending with: "If you are not satisfied with how we respond to a grievance, you may complain to the Data Protection Board of India, after first using our grievance redressal (section 13(3) of the Act)." A request's receipt does not carry it |

## 2. Vendors — the questionnaire link

| | Before | After |
|---|---|---|
| First step | "Email me a code" as a plain outlined button | **Filled navy** primary button; after a code is sent, "Send a new code" is the plain one |
| The questions | Written for staff: "Is **the vendor** ISO/IEC 27001 certified?", "Do **they** process data only on **your** documented instructions?" — read by the vendor about itself | In the vendor's voice: "Is **your company** ISO/IEC 27001 certified?", "Do **you** process **Mumbai University's** data only on its documented instructions?"; section B "What personal data you process for Mumbai University, and how." **Staff pages keep their wording** |
| Progress | Only a list of missing codes after a save | "**x of 44 questions answered**" in the Save bar that stays on screen, updated as answers are picked |
| The declaration | "Your role at Payment gateway provider" (the organisation's own label for the vendor) | "Your role at your company" |
| The footer | "University of Mumbai asks its processors…" | "Mumbai University (University of Mumbai) asks its processors…" |
| A dead link | Next's bare 404 | The same plain not-found page as §1 |

## 3. What did not change

- **The law on each page**: every citation, Rule 14(3)'s ninety days, Rule 9's
  contact, the notice's Rule 3 sections, the widget's "nothing is ticked" and
  "withdraw at any time" — word for word.
- **What is recorded**: the widget records the same choices; the forms the same
  requests; the vendor link the same answers (scoring, options, weights and
  documents still come from the staff question bank).
- **Security**: the not-found page names no organisation and gives no reason —
  an unknown, malformed or closed address, a missing notice and a dead vendor
  link are indistinguishable (D-084, D-086.1). Test ids, API shapes and the
  public API's 404 bodies are unchanged.

## 4. Claude's calls (D-105) — confirm or change

As your DPDP consultant: each call with a verdict, its basis in the official
text (`docs/legal/`), and what goes wrong if it is wrong. Counsel confirms the
wording; the product never claims counsel has reviewed it.

1. **The widget names the organisation in its first sentence; the title "We
   value your privacy" stays** (it is translated into Hindi and Marathi).
   *Verdict: confirm.* A consent request must be "accompanied or preceded by a
   notice given by the Data Fiduciary" (s.5(1)); a request that never says
   which Data Fiduciary is asking leaves the person unable to tell whose notice
   applies. The widget links to that notice as before. *Risk if wrong:* a
   consent that cannot be tied to a named fiduciary is weak evidence of informed
   consent (s.6(1) "informed").
2. **Accept all and Reject all get the same style; nothing is focused for the
   visitor.** *Verdict: confirm.* Consent must be "free, specific, informed,
   unconditional and unambiguous with a clear affirmative action" (s.6(1)), and
   withdrawing must be as easy as giving (s.6(4); Rule 3(c)(i), "the ease of
   doing so being comparable"). A refuse button styled as secondary, and Enter
   accepting everything, nudge towards consent. *Risk if wrong:* a challenge
   that consent was not freely given.
3. **One not-found page per public address (`/p/…`, `/v/…`), not one for the
   whole app.** *Verdict: confirm.* It keeps D-086.1's single 404 for public
   targets; the dashboard's own 404s are left to B1. Nothing in the Act turns on
   this; it is a privacy-by-design choice — the page says what to do, never why.
4. **The vendor's voice is a separate text per question, used only on the
   vendor link.** *Verdict: confirm.* The vendor is the Data Processor; it is
   engaged "only under a valid contract" (s.8(2)), and the questions test that
   contract and its safeguards (Rule 6(1)(f)). Asking the processor about itself
   in the second person removes a real chance of a wrong answer ("do *they* …?").
   Scoring is unchanged. *Risk if wrong:* none to the law; a mis-read question
   is the risk this removes.
5. **One-name rule: display name everywhere, the legal name once in brackets
   where it differs.** *Verdict: confirm.* The Act names no format, but Rule 9
   requires the contact to be published and named in every response, and Rule 3
   asks for a notice "understandable independently" — two unexplained names for
   one Data Fiduciary undercut both. Where there is no legal name, only the
   display name shows.
6. **The grievance receipt reuses the notice's own Board line.** *Verdict:
   confirm.* "The Data Principal shall exhaust the opportunity of redressing her
   grievance under this section before approaching the Board" (s.13(3)); every
   published notice already says so for Rule 3(c)(iii). Using the same constant
   means the email and the notice cannot drift. Only a **grievance** receipt
   carries it — a rights request is not yet a grievance. *Counsel to confirm the
   wording "after first using our grievance redressal".*
7. **The answered count is the 44 scored questions** (A1, the legal name, is
   optional) answered or marked not applicable — the same set the database
   checks before it accepts a submission. *Verdict: confirm.* A TrustStack
   convenience, not a statutory measure.

## 5. Evidence

- **Screenshots**, before and after, at laptop (1366 × 800) and phone (390 × 844)
  width: the public home page, request and grievance forms, the notice, a dead
  public address, a dead vendor link, the widget on a stand-in website, the
  vendor link's first page and its questionnaire (top and end), and the
  grievance receipt email — `docs/testing/slice10_5-b5/before/` and `…/after/`
  (file names start with the surface id from `docs/UX_REVIEW.md`, e.g.
  `U42-widget--phone.webp`). Mumbai University's public pages were opened on the
  **local** database only for the shots, then closed by a rebuild.
- **Tests that pin it** — core unit **+4** (every question and section has a
  vendor text; none says "they", "their", "the vendor" or "our"; the
  organisation is filled in and the staff wording unchanged; `fiduciaryName`);
  web unit **+1** and one extended (a grievance receipt carries the s.13(3) line,
  a request's does not); e2e extended, none deleted: `ui/consent` (the widget
  names the tenant, Accept and Reject share the style, Accept is not focused),
  `ui/intake` (back link, one-name footer, the new Send label, and the same
  not-found page for an unknown, a malformed and a closed address, a missing
  notice and a dead vendor link — all 404), `ui/vendor-link` ("Email me a code",
  the vendor's voice, "0 of 44" → "44 of 44", the not-found page after
  submission).
- **Gates (local stack)** — core **1,233**, web unit **550**, RLS **541**, all 23
  CI SQL gates, typecheck, `check:secrets`, `db:types --check`; e2e **409/410**
  with one worker (the one failure differs run to run, in specs this batch does
  not touch, each green alone — the Auth port-exhaustion open loop in STATE);
  every public-surface spec **174/174**. CI on PR #31 is the authority.
- **Client-hosted (Slice 15)**: B5 adds no hosted-only dependency — the widget
  and the pages call only the app's own API; no font CDN, no new package.
- **Register**: U39–U43 move to ✅ in `docs/UX_REVIEW.md` §2; U03 is half done
  (its old indigo colour is B4's F4.9).
