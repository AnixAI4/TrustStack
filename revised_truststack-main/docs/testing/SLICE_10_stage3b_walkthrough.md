# Slice 10 · Stage 3b — walk-through: the notice, the consent widget, the consent register

**Branch** `slice/10-workflow-modules` · **draft PR #28** · **migration**
`20261014000000_notice_consent` (additive; **local only** — it goes to hosted
when you approve Stage 3b) · **calls** D-088 · **manual test**
`docs/testing/SLICE_10_stage3b_manual_test.md` · **exposure model 1.3.0**.

## What you are approving

1. **The notice page** — the privacy notice a Data Principal reads (s.5, Rule 3),
   versioned, written by staff, published by a lead or a lawyer.
2. **The widget** — the consent banner on the organisation's own website (s.6):
   nothing ticked, withdrawal as easy as giving.
3. **The consent register** — every choice, append-only, and how a parent or
   guardian was verified (s.9(1), Rules 10–11).
4. **The 1.3.0 row** on head 3 — and **one addition** to it (§5, D-088.9).

## 1. The notice (Notice & consent → "Write a new version")

| What the form asks | Why |
|---|---|
| Language | English or any of the Eighth Schedule's twenty-two. One version per language; one draft at a time per language. |
| Title, introduction | "Understandable independently" (Rule 3(a)). |
| **Purposes** — for each: a key, a title, **what it provides or enables**, **the personal data it needs, one per line** | Rule 3(b)(ii) and (b)(i). The notice's itemised personal data is the list across all purposes, each named once. |
| Other means to withdraw, to exercise rights, to complain | Rule 3(c) — optional additions. |

**What every published notice says regardless** (Rule 3(c)), so it can never be left out:
- *"You may withdraw your consent at any time, as easily as you gave it: open "Privacy choices" on our website and choose "Withdraw consent". Withdrawal does not affect processing done before it."*
- Links to the public **request** and **grievance** forms (Stage 3a), and the Rule 9 contact.
- *"If you are not satisfied with how we respond to a grievance, you may complain to the Data Protection Board of India, after first using our grievance redressal (section 13(3) of the Act)."*

**Publishing**: only when every purpose has a title, what it enables, and at
least one data item (the form lists what is missing; the database refuses an
incomplete one too). Then the version **never changes and is never deleted** —
a correction is a new version ("Start a new version from this one"). The
public page shows the **latest published version** in the language asked for
(else English); older versions stay readable by staff.

**Who**: drafting needs `consent.write` (the eight roles that write registers);
**publishing needs `consent.publish`** — Super Admin, Consultant, Organisation
Admin, DPDP Programme Owner, **Legal User**. A Department Owner can draft, not
publish (D-088.1).

**Public page**: `/p/<address>/notice` (and a "Read our privacy notice" card on
`/p/<address>` once one is published). Same not-found page as every other
public page when there is no address or no published notice.

## 2. The widget (Notice & consent → "Consent widget")

A **widget version** cites one published notice and picks which of its purposes
to ask consent for; it offers English always, plus the languages you tick, and
has a position and a colour. Publishing it makes it **live**; it then never
changes (consents cite it). A new version asks every visitor again.

**The snippet** (shown once the organisation's public address is open):
```html
<script src="https://<truststack>/widget/consent-v1.js" data-org="<address>" async></script>
```
Optional: `data-principal="…"` (the site's own id for a signed-in person —
otherwise a random id kept in that browser), `data-principal-kind="child"` or
`"guardian_ward"` (a parent or guardian is consenting), `data-lang="hi"`.

**What a visitor sees**: "We value your privacy", each purpose with what it is
for and the personal data it needs — **nothing ticked** — and **Accept all ·
Reject all · Save my choices**, plus "Read the privacy notice". After choosing, a
**"Privacy choices"** button stays on the page; it reopens the choices with a
**Withdraw consent** button (s.6(4)).

**Changed from the old widget** (D-088.4): it ticked "required" purposes and
locked them. Consent must be a clear affirmative action (s.6(1)); processing
that needs no consent is a legitimate use (s.7), not a box. So nothing is
ticked and nothing is locked.

**Languages** (D-088.14): Hindi and Marathi show the **old widget's** phrases
(title, buttons, the withdrawal line and its confirmation); everything else —
the description, the purposes, the notice link — stays English. **Nothing new
was translated** (decision 6). The other twenty languages say "Translation
pending — shown in English". A translator should review the Hindi and Marathi
phrases before production.

**Limits** (D-088.12): 120 choices an hour from one address per organisation
(a campus shares an address), 10 an hour per person. Over → refused, nothing kept.

## 3. The consent register

| Column | |
|---|---|
| Person | **A pseudonymous key** — a keyed hash of the identifier under a secret per-organisation salt (D-088.6). The identifier is never stored; the screen shows the key's first 12 characters. |
| Choice | **Consent given** (to named purposes) · **Consent refused** · **Consent withdrawn** (all). A person's position is their **latest** choice. |
| Whose consent | The Data Principal · **A child — the consent of a parent** · **A person with disability — the consent of a lawful guardian** |
| How verified (child) | Rule 10(1)(a) details already held · 10(1)(b)(i) details given by the parent · 10(1)(b)(ii) a virtual token, e.g. DigiLocker · **Rule 12 exempt** (a Fourth Schedule class or purpose) |
| How verified (ward) | Rule 11: appointed by a court · a designated authority · a local level committee |
| Source | The consent widget · Recorded by staff (with who) |

- **Nothing is ever changed or deleted** — not by anyone. Withdrawal, or a
  verification recorded later, is a **new record**.
- **The widget never records a verification** — only a person in the
  organisation can say how a parent or guardian was verified.
- **Staff record** a paper form or an email ("Record a consent"), with an
  optional reference (a form number — not a name), and **look up a person** by
  their identifier.
- **Counts** over each person's latest choice: people, given, refused,
  withdrawn, given by a parent or guardian, **…with no verification recorded** (red).

## 4. Audit

Notices and widget versions: created, edited, published, discarded — the
version, language and status, **never the text**. A staff record: once, as the
person — the choice, how many purposes, whose consent, the basis; **never the
identifier or the reference**. **A widget choice writes no audit row**: the
record is itself the log, and the widget is not a person.

## 5. Exposure model 1.3.0 — FOR YOUR APPROVAL (then counsel's)

| Input | Head | Effect |
|---|---|---|
| **`child_consent_unverified`** — a person whose latest record is a child's or a ward's consent, **still given**, with **no verification or exemption recorded** | **H3** (s.9(1), Rules 10–11) | **Exposed** — as the critical register rule `child_consent_missing` already makes H3 Exposed |

Reason: *"1 consent given on behalf of a child or a person with disability has
no verification of the parent or lawful guardian recorded (s.9(1), Rules 10–11)."*
A refusal, a withdrawal, a recorded basis — or an adult's consent — counts nothing.

**The addition (D-088.9)**: a consent still given **for a child** means
children's data **is** processed — so it makes head 3 **apply** (and adds the
children's-data position factor), even if the scope said "no children"; one
given **by a guardian** does the same for the guardian side. Without this, an
unverified child's consent could sit under a head marked "Not applicable".

**For counsel** (D-088.7): a Rule 12 exemption counts as "recorded" — the
model treats an exempt child's consent as verified.

1.3.0 is in core and in this stage's own migration; both mirror tests pass
(400 generated inputs with consents, word for word). Stored snapshots keep the
version they were recorded under.

## 6. Gate 5 and what the tests prove

- **RLS** (`tests/rls/consent.test.ts`, 23): another tenant sees and touches
  nothing; anon holds nothing; nobody reads a salt; records are written by
  functions only and never changed; versions, publishing and completeness;
  the public functions answer for their own tenant only; the limits; the
  audit; a stored 1.3.0 snapshot Exposed, then cleared by a verification.
- **API** (`e2e/api/consent.spec.ts`, 6, disposable healthcare and general
  tenants `…a018`, `…a019`): the whole lifecycle, CORS, cross-tenant 404s, the
  live exposure view on head 3, the public notice page. **Sweep**: 14 new probes.
- **UI** (`e2e/ui/consent.spec.ts`, 3, `…a01a`): an admin writes and publishes
  the notice and the widget; **the widget runs on a separate website** — nothing
  ticked, a choice saved, then withdrawn from "Privacy choices"; the register
  shows both; a child's consent is counted as unverified.
- **CI**: a new gate — public consent functions are the server's only, no
  client writes a record or reads a salt, the guard triggers exist, the limits
  are as approved; seed counts; the model pin is 1.3.0.

Counts locally: core **1,081**, web unit **484**, RLS **463**, e2e: see STATE.

## 7. What is not in 3b (D-088.17)

An overview section for consent; an action parent; the evidence link type
(Stage 6); a consent-manager integration (s.6(7)–(9)); purging the widget's
attempt rows (Slice 13); AI drafting or translation of a notice (Slice 11).

## Then

Approve with **"Stage 3b approved"** (or "Stage 3b approved with changes: …").
The migration then goes to hosted (additive), and Stage 4a — processors, the staff-entered questionnaire and its accuracy controls — is next (4b, the vendor link, follows; D-089).
