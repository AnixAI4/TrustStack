# Slice 10 · Stage 3a — walk-through: public intake

**Branch** `slice/10-workflow-modules` · **draft PR #28** · **migration**
`20261013000000_public_intake` (additive; **local only** — it goes to hosted
when you approve Stage 3a) · **calls** D-086 · **manual test**
`docs/testing/SLICE_10_stage3a_manual_test.md` · **no model change** (exposure
stays 1.2.0).

## What you are approving

1. **The public forms**: where a Data Principal makes a request or raises a
   grievance online (Rule 14(1)–(3)), and the contact every page names (Rule 9).
2. **The codes**: a six-digit code emailed to the person, which proves they
   control the address — nothing more.
3. **The abuse limits**: how many submissions and codes, from whom, how often.
4. **One change to the brief** (D-086.1): the public routes call the database
   with the server's key, not the anon key. Why is in §4.

## 1. Opening the public pages (Organisation page → "Public pages")

An Organisation Admin (or the consultant) sets two things:

| Setting | Rule |
|---|---|
| **Public address** | `/p/<address>` — 3–63 lower-case letters, digits and hyphens; unique across TrustStack. Empty = **closed**. |
| **The Rule 9 contact** | Name and email (required), phone (optional), "This is our Data Protection Officer" (s.8(9), Rule 9: a DPO only "if applicable"). |

- **No address without a contact** — the database refuses it (a CHECK), and so does the form.
- **Only `organization.update`** may open, move or close the pages: a DPDP
  Programme Owner edits the scope but not this (the guard trigger, as for the
  SDF notification).
- **Closing keeps the contact** and everything already received. The address
  answers "not found" at once.
- Audited as an organisation change: the **column names**, never the contact's details.
- **Seed**: Mumbai University has its contact, **no address** — the seed also
  reaches hosted, and a submission there would be a permanent record on a
  demo tenant. You open pages on the demo clinic in the manual test.

## 2. What a Data Principal sees (signed out)

| Page | What |
|---|---|
| `/p/<address>` | The organisation's name, two ways in — **Make a request** · **Raise a grievance** — and the contact. |
| `/p/<address>/rights` | The six rights (access, correction, completion, updating, erasure, nomination), each in plain words with its section; name, email, phone, who they are (themselves, a nominee, a parent or guardian), how the organisation knows them; the request. A nomination names its nominee. |
| `/p/<address>/grievance` | The same, plus "Is this about an earlier request? Its reference". |

Every page ends with *"Questions about your personal data: <contact>"* and
"answers within ninety days of receipt (Rule 14(3))". Pages are not indexed by
search engines.

**An unknown address, a malformed one, a closed tenant and a deleted tenant
all give the same not-found page** — byte for byte in the API (D-084, settled
by you). Nobody can find out which organisations use TrustStack.

## 3. The code, and when the ninety days start

1. **Send** → the submission is **held apart** (`intake_submissions`), not in
   the register. The page says "We sent a six-digit code to as******@…" — the
   address masked.
2. The email: *"Your confirmation code for <organisation>: 042137"* — ten
   minutes, works once, "nothing is recorded unless the code is entered", and
   the contact.
3. **Enter the code** → the database creates the request in the register:
   channel **Web form**, the code (`DPR-…` / `GRV-…`) and respond-by date
   derived exactly as for a staff entry. **Received = the day it was
   SUBMITTED** in India (D-084, settled by you) — a code entered after midnight
   does not move the clock.
4. The page and a second email give the **reference**, the **received** date
   and the **answer-by** date, with Rule 14(3) and *"the organisation may ask
   you to confirm your identity"*.

**The code is not the Rule 14 identity check** (D-083.6 stands): on the staff
side the request still cannot be fulfilled until someone records how the
person was identified.

| Code rule | Value |
|---|---|
| Length | 6 digits, random (`crypto.randomInt`) |
| Stored | only `sha256(submission id : code)` — never the code, in no log, in no response |
| Life | 10 minutes; **Send a new code** retires the old one |
| Wrong entries | 5 per **submission** (a new code does not forgive them) → "Too many wrong codes. Please start again." |
| Single use | entering it again → "already confirmed"; one code makes one request |
| Unconfirmed submission | expires after 24 hours (Slice 13's job will purge it) |

**A grievance naming an earlier request** is linked to it only if that request
is this organisation's **and was made from the same email address**; otherwise
staff see "Earlier request named on the form (not matched): DPR-…" in the
grievance. The person gets the same answer either way, so the form cannot be
used to test whether a reference exists.

## 4. The abuse limits — in the database

Vercel's servers share no memory, so every count is a row (`intake_attempts`):

| Limit | Value | Keyed by |
|---|---|---|
| Submissions | **5 an hour** | the client address, per organisation, per form |
| Codes sent | **3 an hour, 10 a day** | the email address — across forms and organisations, so nobody can flood an inbox |
| Wrong codes | **5** | the submission |

Over a limit: **429** "Too many attempts. Please wait an hour and try again."
A refused submission is not counted. No captcha (not needed at these limits;
revisit if abuse is seen — §7a.8).

**The address is never stored**: the server keeps a keyed hash (HMAC with its
existing cookie secret and a purpose prefix — no new secret to set up). The
email is stored as a hash in the attempts table.

**D-086.1 — why the server's key, not the anon key.** The brief (§7a.3) said
the public routes would call the database functions with the **anon** key.
The anon key is public by design — it is in every browser. A function `anon`
may run can be called straight from the internet, past our server, **with a
code the caller chose and a client address the caller made up**: no email
proof and no address limit. So the four intake functions can be run by the
**server alone** (`service_role`); `anon` holds nothing at all. The server
uses that key for those four functions and nothing else, and a test fails if
any public route touches a table. The risk the brief guarded against — the
service key bypassing row security — does not arise: each function does one
thing, inside the database.

## 5. On the staff side

- The register lists a public request with a **Web form** chip; its page says
  *Arrived by: Web form* and *Recorded by: The public form, email address
  confirmed — <time>*.
- Everything else is Stage 2: the clock, the identity check before fulfilment,
  the response, the lifecycle, actions.
- **Audit**: one row, `intake.rights_requests.insert`, no user, with the code,
  kind, status, channel and dates — never the person's name, email or words.

## 6. Gate 5 for public surfaces (all automated)

- An address answers for its own organisation only. A submission made on one
  address cannot be confirmed or re-sent through another, even with the right
  code; no answer names another tenant (API e2e with two open tenants; RLS).
- No `anon` grant on any table; no client role may run an intake function; no
  role at all may read a pending submission or an attempt (RLS + CI).
- No enumeration: the same 404 everywhere (API, RLS, sweep probes for BML's
  name and id).
- Replayed and expired codes refused; the lock; the limits; sizes (CHECK + Zod).
- The route gate: only `health` and `public/…` routes are public, and the
  public ones may import only `lib/intake/rpc` — never `.from(…)`.

## 7. Not in 3a

The notice page and the consent widget (**3b**, model 1.3.0) · SMS or WhatsApp
codes (out of scope) · a captcha · purging expired submissions and attempts
(**Slice 13**'s job runner) · emails on a timer.

## 8. Old app replaced (for Slice 13)

`src/app/public/{[slug], dsr/[slug], grievance/[slug]}` (pages),
`src/app/api/dsr/{submit, otp/verify, otp/resend}`, `src/lib/dsr/otp.ts`,
`src/app/api/grievance/{submit, officer}` (the officer is now the Rule 9
contact). Still to come: the notice and consent files (3b); `dsr/draft` (AI,
Slice 11).

## Gates (local stack)

core **1,036** (+11) · web unit **474** (+22) · RLS **440** (+20) · typecheck,
`check:secrets`, `db:types --check` clean · e2e — see STATE's tracker (the new
specs: API `intake.spec.ts` 9, UI `intake.spec.ts` 4, 4 sweep probes).
