# Slice 11 — the reference set reviewed as a DPDP expert (R1–R20, D1–D20)

> Reviewed 2026-10-22 by Claude at Aniket's request ("act as a tough DPDP expert"), for D-128.3 /
> D-136.1. Every provision a case cites or expects was checked against the Gazette text in
> `docs/legal/` (`pdftotext -layout`). **Verdict at review: not yet — three legal points to fix.**
> **✅ Fixed 2026-10-22 (D-137):** F1–F3 and P1–P5 built, R21 added; the 13 affected cases 13/13 live.
> P6 left optional; F1's register wording (`RIGHTS_CLOCK_NOTE`) is with counsel.

## Why it matters

The reference set is the assistant's exam. A case with the law wrong does worse than no case: CI
then passes the wrong answer every time. So the test is not "does the recorded answer pass the
checker" (all forty do). It is: **would a DPDP practitioner sign each case's expectations and each
recorded answer?**

## The three substantive findings (fix before merge)

### F1 — The ninety days are for grievances, not for access, correction or erasure requests
**Rule 14(3):** a Data Fiduciary publishes "a reasonable period not exceeding ninety days under its
grievance redressal system for responding to the **grievances** of Data Principals"; **s.13(2)** is
the grievance duty. **Neither the Act nor the Rules sets a period for answering a request under
s.11, s.12 or s.14.**

- **R20** answers "How many days do we have to reply to an access request?" Its headline is right
  ("ninety days for grievances"). But its title ("inside the law's ninety-day ceiling") and its
  *why it matters* ("leaves room inside the law's ninety-day ceiling") apply the grievance period to
  an access request. The case teaches the conflation.
- **D20's** recorded draft attaches TrustStack's thirty-day target to **s.13(2)**, the grievance
  provision.
- **Outside the set, same root:** the rights-letter prompt (`lib/ai/tasks/rights-response.ts`) tells
  the model "the respond-by date is the law's ninety-day ceiling (Rule 14(3))". The rights register's
  note (`core/rights.ts` `RIGHTS_CLOCK_NOTE`, Slice 10, D-083) says "The Rules set one period … requests
  to exercise the other rights run through the same system". That is **an interpretation presented as
  the Rules' text**.

*Fix:* say what the law says. "The Rules set no period for answering an access, correction or erasure
request. The ninety-day maximum is for grievances (s.13(2), Rule 14(3)), and an unanswered request
can become one. TrustStack applies the same ninety days to requests as an outer limit, and aims for
thirty; both are TrustStack's." R20 gains `mustSayAnyOf: ["grievance"]` and a `mustNotSay` for "the
law's ninety-day ceiling for access requests". D20's target point loses the s.13(2) citation. The
prompt's sentence is corrected. Keeping 90 days as the register's outer limit is a defensible,
conservative choice. Only the label changes. **Counsel to confirm** (already open: "R20's
no-access-request-deadline reading").

### F2 — Access, correction and erasure rights exist only for consent-based processing
**s.11(1)** and **s.12(1)** give the rights against a Data Fiduciary "to whom she has previously
given consent, including consent as referred to in clause (a) of section 7". So there is **no s.11/s.12
right** where processing rests on another legitimate use: s.7(b)–(i), e.g. a State university's
functions, or **employment (s.7(i)) for staff payroll**. Grievance (s.13) and nomination (s.14) are
not so limited.

- **D8, D9, D10's** recorded letters state the right unconditionally: "Section 11 … gives you this
  right", "Section 12 … gives you the right to correction", "Section 12(3) … sets this right". A
  letter to a staff member asking for erasure of payroll data would assert a right the Act does not
  give.
- **R1** (the access question) and **R20** never mention the limit.
- The rights-letter prompt does not mention it either.

*Fix:* the letter must not decide whether the right applies (as with the outcome, D-129.2). The
prompt gains "the right applies where the data is processed on consent, including s.7(a). If the
basis is not known, write `[Whether this right applies to this data — to be confirmed]` and hand it
to counsel". D8–D10 expect that placeholder or `counselToConfirm`. R1's *more detail* names the
limit. A new explain case, **R21**: "A staff member asks for their payroll data — does s.11 apply?"
Expected answer: it depends on the basis; s.7(i) processing carries no s.11 right; counsel to
confirm.

### F3 — Every rights response must carry the Rule 9 contact
**Rule 9:** a Data Fiduciary must "mention **in every response to a communication for the exercise
of the rights** of a Data Principal" the business contact of the DPO, if any, or a person who can
answer questions. **D8–D10's** template letter has none. Neither does the prompt, so a live draft is
missing a mandatory element (D8 passed 10/10 live without it).

*Fix:* the letter carries `[Contact for questions about your personal data — Rule 9]` (or the
organisation's published contact, filled in by the server like Rule 7(2)(b)(vi)). The server refuses
a letter without it, as it refuses one without `[Name]`. D8–D10 gain
`draftMustContain: ["Rule 9"]`-style checks.

## The precision findings (fix with the above; no legal error, but the set should model exactness)

| # | Case | What is loose | Fix |
|---|---|---|---|
| P1 | R5 | Title and answer frame the notice as "before or at the time of collection". s.5(1) ties it to a **request for consent** ("accompanied or preceded by"). s.7 processing needs none, which is exactly D-133.3. Its law point "must come with or after a notice" is right but reads backwards. | Reframe to the consent request; `mustSayAnyOf: ["consent"]`; quote "accompanied or preceded by". |
| P2 | R4, D12 | "with the **same** ease". s.6(4) says the ease is "**comparable** to" the ease of giving. | "comparable". |
| P3 | R13 | `citeAnyOf` includes s.10(2). A DPO is an **SDF** duty (s.10(2)(a)), so an answer telling a non-SDF university "the Act requires a DPO" would pass. | `mustNotSay: ["must appoint a data protection officer", "the act requires a data protection officer"]`; drop s.10(2) from `citeAnyOf`. |
| P4 | R18 | "the Act's **highest penalty**". The Schedule sets **ceilings** ("may extend to"); item 1 is up to ₹250 crore. | "the highest penalty ceiling in the Schedule (up to ₹250 crore)". |
| P5 | R6, R20, D20 | A TrustStack target carries a statute citation (Rule 7(2), Rule 14(3), s.13(2)) with the `truststack_default` label. The label is right, but the citation suggests the provision is its source. | Keep the label; point text says "TrustStack's own … — not in Rule X". |
| P6 | R8 | Right on s.16(1), s.16(2) and Rule 15, but silent on **Rule 13(4)** (an SDF may be barred from transferring specified data) and on commencement (13 May 2027). Counsel is flagged, so not wrong. | Add one sentence; optional. |

## Cases that pass as they are (31)

R2 (Rule 6(1)(a)–(c) right), R3 (s.2(f), s.9(1), s.9(3), Rule 10(1), the Fourth Schedule's
educational-institution exemption handed to counsel), R6's 72-hour law (Rule 7(2)(a) "without delay",
(b) seventy-two hours or longer on written request), R7 (s.8(7) and Rule 8(3)'s one-year floor; Rule
6(1)(e) is a second one-year rule worth adding some day), R9 (s.10(1), Rule 13(1) "once in every period
of twelve months"), R10 (s.8(9), s.8(10), Rule 9), R11 (s.2(i), s.2(k), s.8(1)), R12 (s.8(2)),
R14–R17, R19 (bands are TrustStack's), D1–D7 (D2's s.7(i) for payroll is right; D4–D7 follow Rule
7(2)(a)–(b) in order, (iv) never names a person), D11 (payroll excluded under s.7(i)), D13 (Rule 9),
D14 (Rule 3(a)–(b)), D15–D17 (s.5(3), keys kept), D18 (s.33(1) "after an inquiry", ceilings not
predictions), D19.

R1's eight provisions are all correct, including s.11(2)'s exception and Rule 1(4)'s 13 May 2027. It
needs only F2's sentence.

## What I recommend

1. **Fix F1–F3 and P1–P5 now, before PR #41 merges.** F2 and F3 are in a legal draft the product
   already ships behind the switch (2a's rights letter). The changes are prompt wording, two server
   checks (the Rule 9 contact; the "does the right apply" placeholder), and case expectations. The
   reference version goes to `2026-10-22.2b-3`; then a live re-run of D8–D10, R1, R20 and the new R21.
   About an hour.
2. **Put F1's register wording to counsel** with the open R20 question. The ninety-day outer limit
   stays; only "the Rules set one period" changes.
3. Then the set is fit to be signed off (D-128.3), and the merge can go ahead.
