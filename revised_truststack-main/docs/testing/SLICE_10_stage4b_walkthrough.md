# Slice 10 · Stage 4b — walk-through: the vendor-facing questionnaire link

Built 2026-10-14 on `slice/10-workflow-modules` (PR #28), migration
`20261016000000_vendor_link` (**local only** until you approve). The calls are
**D-093**; your decision on the one open question is **D-092**: *the link's
sender may not review the vendor's answers.* **No model change** — exposure
stays 1.4.0; the model reads the vendor register, not who typed the answers.
**CI green on `9b22b55`**: core 1,131 · web unit 501 · RLS 502 · e2e 373/373;
the Vercel preview built.

## What you are approving

1. Staff can **email someone at the vendor a link** to answer the 4a
   questionnaire themselves.
2. The link's safeguards: an **expiring token** stored only as a hash, the
   respondent's **email confirmed by a one-time code**, a **signed
   declaration**, everything **server-only** — and **nothing the vendor submits
   counts until someone in the organisation accepts it**.
3. **Who may not review**: whoever sent the link (D-092), as well as whoever
   created, answered or submitted it (4a).
4. The sixteen calls in D-093 — the ones to look at are in §8.

## 1. Sending the link (staff: anyone with `vendor.assess`)

On a **draft** or **returned** assessment, a new panel **"Ask the vendor to
answer"**: the respondent's name and work email → **Send the link**. The
email names the organisation and the vendor, says the link works for **14
days**, that a code will be emailed when it is opened, and that submitting
means signing *"These answers are accurate and complete."*

- **The token is never shown to staff** — it is in the email only. So the
  sender cannot answer as the vendor.
- **Sending again revokes the last link.** **Revoke the link** ends it; the
  answers it saved stay.
- **While a link is open, staff cannot change the answers** — the form turns
  read-only with a note (one writer at a time). Revoke it to take over.
- The register shows **"With the vendor"** (a count, and a badge on the row).

## 2. The respondent's page — `/v/{token}`, signed out

1. **Confirm it is you** — "Email me a code" sends six digits to the address
   the link went to (never another). Ten minutes, single use; three an hour and
   ten a day per address; **five wrong codes lock the link** (staff send a new
   one). The right code sets an HttpOnly cookie for that browser only — a
   forwarded link is useless without the mailbox; a code entered in a second
   browser ends the first.
2. **The questionnaire** — the same 45 questions, pre-filled with the answers as
   they stand (e.g. a new version carries the last accepted answers). The same
   rules: every scored question answered or "not applicable" with a reason; a
   "yes" that needs a document counts as *claimed, no evidence* until one is
   cited.
3. **Their documents** — up to ten, 25 MB each, uploaded straight to the
   private evidence store, **pending review**. They see and cite **only what
   they uploaded through their link**; a document the organisation already
   holds is shown as "a document the organisation already holds" — never by
   name — and stays cited unless they change it.
4. **Sign and submit** — name (pre-filled), role, and the ticked declaration.
   The database refuses an incomplete submission. The link is then used up.

They never see a score, a flag, a reviewer, a return reason, or anything of
another organisation. **Every dead link** — unknown, expired, revoked, used,
locked — is the same "not found" page. The page is `noindex` and sends no
referrer (the token is in the address).

## 3. What the organisation sees afterwards

- *Source*: **Answered by the vendor** — "Answered by the vendor through the
  questionnaire link sent on {date}" (written by the database).
- *Submitted*: "the vendor's respondent, {time}".
- A grey box: **Declared by the vendor's respondent — "These answers are
  accurate and complete." — signed {name}, {role}, {time}. A declaration is the
  vendor's word, not evidence: the documents and the review are the check.**
- Each answer they gave: "· answered by the vendor's respondent"; each document
  they uploaded: "(from the vendor)", "uploaded … by the vendor's respondent".
- The link's history: sent to whom, by whom, open / revoked / expired / locked /
  used.

## 4. The second person (D-092)

`review_vendor_assessment` now refuses, in this order: **anyone who sent a
link for that version** (open or not; even if they answered nothing) — *"You
sent this assessment to the vendor — someone else must review their
answers."* — then 4a's rule (created, answered or submitted it). The route and
the page say the same. A **returned** vendor submission can go back to the
vendor with a **new link** (whoever sends that one may not review either), or
staff revoke and finish it themselves — it then becomes a **staff**
submission and the vendor's earlier declaration is cleared (the audit log keeps
it).

## 5. In the database (migration `20261016000000_vendor_link`)

| What | How it is held |
|---|---|
| The vendor source | `vendor_assessments.source` `staff`·`vendor`; `declared_name`, `declared_role`, `declared_at`; a CHECK: a submitted or accepted assessment is `vendor` **exactly when** declared, and then has no staff submitter |
| The link | `vendor_assessment_links`: token, code and session as **SHA-256 hashes**; members read who it went to through a **column grant that excludes every hash**; nobody writes it but the functions; one open per assessment |
| The respondent's steps | seven functions, **`service_role` only** (D-086.1), through the one door `lib/intake/rpc.ts`; each re-checks token, expiry, revocation, lock, the assessment's status and the session |
| Staff | `send_vendor_link`, `revoke_vendor_link` (`vendor.assess`); `save_`/`submit_vendor_assessment` refuse while a link is open; `review_vendor_assessment` refuses link senders |
| Documents | `evidence` row by the database (`uploaded_by` NULL, pending, path held by its CHECKs), `vendor_link_documents`, a signed upload, then `evidence_links` type `vendor` once stored |
| Audit | `vendor.vendor_assessment_links.sent/revoked` as the person; `vendor_link.*` (confirmed, answers saved, upload URL issued, document attached, submitted) with **`user_id` NULL**, "by the vendor's respondent", no name, email or token |

## 6. Seed (Mumbai University)

The **AI proctoring vendor**: v1 started and **sent by Legal**, answered by
"Priya Menon (SAMPLE)", one SOC 2 summary of theirs cited on A4, **awaiting
review** — risk **34 (Medium)**, A3 and D2 claimed with no document, no
consistency flags. Legal may not review it; the Registrar, the Organisation
Admin or the Consultant may.

## 7. Gate 5 and what the tests prove

- **RLS (18)** — `tests/rls/vendor-link.test.ts`: grants (service_role only,
  no hash readable, no writes, Org B reads none); send/revoke permissions and
  tenancy; one writer; the same not-found everywhere; codes, limits, lock and
  sessions; attribution and the document on file; uploads (ten, stored before
  attached); submission and its CHECK; the sender rule; audit with no personal
  data; **a token and a session open one link only**; an organisation's
  deletion.
- **API e2e (7)** and **UI e2e (2)** on disposable healthcare tenants
  (`…a01d`, `…a01e`, `…a01f`): send, the 404s, the code and cookie, upload,
  submit, the sender refused, the Admin accepts, audit, another tenant's link.
- **Sweep**: nine new probes (two staff, seven public — a guessed token is the
  same 404 with nothing of Org B).
- **CI**: seed counts; a 4b SQL gate (function grants, no hash readable, the
  limits, the seeded vendor submission, nobody who sent a link reviewed).

## 8. Calls to confirm (D-093)

1. **One writer**: staff cannot save or submit while a link is open (revoke
   first). (D-093.2)
2. **The sender rule covers every link for that version** — revoked or expired
   ones too — and a sender is refused even if they answered nothing. (D-093.1)
3. **Five wrong codes lock the link**; staff send a new one. (D-093.5)
4. **The respondent sees the answers as they stand** (including staff's and the
   last accepted version's), but only their own documents; a document on file
   is unnamed. (D-093.8)
5. **A staff finish of a returned vendor submission becomes the staff's** and
   clears the vendor's declaration. (D-093.3)
6. **Ten documents per link, pending review like any upload.** (D-093.9)

## Then

Approve with **"Stage 4b approved"** (or "Stage 4b approved with changes: …").
The migration then goes to hosted (additive), and **Stage 5** — the retention
register and the AI risk register, model **1.5.0** — is next (its brief is
SLICE_10 §7c).
