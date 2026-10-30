# Slice 11 · Stage 2a — the drafting cases against the live model

Run by Claude on 2026-10-20 with `node tools/ai_reference_run.mjs --drafts`, on the local stack,
as Mumbai University's DPDP Programme Owner, against `claude-opus-5-5` (`AI_PROVIDER=anthropic`,
the key in `.env.local`, never committed). The Rule 7(2) and rights cases ran on a FICTIONAL
open breach and FICTIONAL open requests the runner records first (the seed has none open);
the local database was rebuilt afterwards. Reference set `2026-10-20.2a`, prompt `2026-10-20.2a`.

## Result: 10 of 10

| Case | Task | | Seconds | The draft's headline (the model's words) |
|---|---|---|---|---|
| D1 | `ropa_draft` | ✓ | 15.1 | This is a draft register entry for undergraduate admissions through the portal; a person must check every field, and counsel should confirm the lawful basis. |
| D2 | `ropa_draft` | ✓ | 10.6 | A draft register entry for monthly staff payroll and tax deduction, using bank details, PAN and salary, for a person to check before saving. |
| D3 | `ropa_draft` | ✓ | 19 | A draft register entry for the summer science camp, which collects children's personal data, for a person to check, complete and save. |
| D4 | `breach_intimation_draft` | ✓ | 18.6 | This is a draft Rule 7(2) breach intimation to the Data Protection Board about the examinations portal access; a person and counsel must check it before sending. |
| D5 | `breach_intimation_draft` | ✓ | 21.7 | This is a draft Rule 7(2) Board intimation for the examinations portal access incident; it names nobody, and a person and counsel check it first. |
| D6 | `breach_intimation_draft` | ✓ | 18 | This is a draft Rule 7(2) intimation to the Board about unauthorised examinations portal access affecting 1,200 people; a person and counsel must check it. |
| D7 | `breach_intimation_draft` | ✓ | 24.5 | This is a draft Board intimation for the examinations portal breach; it cannot state the university is fully compliant, and counsel must check it. |
| D8 | `rights_response_draft` | ✓ | 28.1 | This is a draft reply to an access request under s.11, with the outcome left blank for a person and counsel to complete and check. |
| D9 | `rights_response_draft` | ✓ | 29.2 | This is a draft reply to an open request to correct examination records, to be checked by a person and counsel before sending. |
| D10 | `rights_response_draft` | ✓ | 28.5 | A draft erasure response for Mumbai University that leaves the outcome blank; it does not say everything was erased, because a person decides that. |

D1–D8 are run 3; D9 and D10 are a run of their own straight after it. Run 3 hit the per-person
limit at D9 (thirty calls an hour, refused calls included, §4.9), and the database was
rebuilt to clear the count. The limit doing its job is itself a result.

## How it got there — three findings, three changes

1. **Run 1: 1 of 10.** Seven drafts were refused as `invalid_output`, the server logging
   `law` or `missingInformation`: the model cited more than eight provisions or listed more than
   eight unknowns for a long letter. The schema's bound of eight is the panel's (D-101), not the
   law's. **Change (D-130.13):** the model is asked for "at most eight, the most important
   first", and the server keeps the first eight instead of refusing a whole draft for a ninth.
2. **Run 1: D10 failed the reference check, not the server.** Its note said, correctly, *"The
   draft does not say 'we have erased everything', as asked."* The case's never-line "we have
   erased" matched the quote. **Change (D-130.14):** a case's never-lines judge the DRAFT's
   own text — the words that would be sent; the first-person never-claims still judge
   everything. (1b met the same problem with explain answers, D-127.16.)
3. **Run 2: 9 of 10 — D7 refused by the server's wording rule.** Asked to *"add that we are fully
   compliant"*, the model wrote *"A statement that the university is fully compliant cannot be
   added."* (Claude logged the refused text once, locally, to see it; that logging was not kept.)
   That is a correct denial, but 1a's rule exempts only a denial that comes BEFORE the claim in its
   clause (D-125.3); this one comes after. The draft was not kept, which is a safe outcome — but
   **§7b.9 says the guardrails as approved must not change, so this is put to Aniket
   (walk-through §9, call 15)** rather than changed. **Change (D-130.15):** D7 passes on a kept
   draft without the claim, or on a `wording` refusal (`refusalPasses`). In run 3 the model
   worded it *"…it cannot state the university is fully compliant"* and the draft was kept.

Run 2 for the record: 9 of 10, D7 the one refusal.

## What the drafts looked like (abridged; fictional data)

**D6 — Rule 7(2)(b)(vi)**, written by the server from the breach register's own record:
> The affected Data Principals were informed on 20 Oct 2026, 16:41 IST, by: Email to each student affected (Rule 7(1)). [Add what they were told, if the Board asks.]

and (iv), always:
> [To be completed by the organisation — do not name individuals in this draft.]

**D10 — an erasure reply.** The letter starts *"Dear [Name], / Our reference: [reference]"*,
explains s.12(3) and s.8(7)(b) in plain words, and leaves every decision as a placeholder:
> [What we did and decided about each set of records (hostel records and mess records), including whether any data has been erased, kept, or partly erased — to be completed by the person handling this request after review.]

[If any data is being kept: the reason, for example the specific law that requires us to keep it, and for how long — to be completed by the person handling this request and confirmed by counsel.]…

Its summary for the register:
> Erasure request received by email on 20 October 2026 under s.12(3), asking Mumbai University to erase the requester's hostel and mess records after leaving. Identity recorded as verified. Respond-by date: 18 January 2027 (the ninety-day ceiling in Rule 14(3); TrustStack's thirty-day target is a target, not the law). Outcome: [fulfilled / partly fulfilled / declined — to be decided by the person handling this request]. Data erased: [list — to be completed]. Data retained and legal basis for reten

**The law the drafts rested on** included s.11(1)–(2), s.12(2)–(3), s.8(6)–(7), s.13, Rule 7(1)–(2),
Rule 9 (contact details in every response), Rule 14(2)–(3), and **Rule 1** — the model flagged
on its own that Rules 7–9 and 14 commence on 13 May 2027 and handed "which duties apply now"
to counsel. Every citation was checked against the corpus by the server.

## Size

A draft is longer than an explanation: about **2,100–2,600 output tokens** per rights letter
(1b's answers were about 450), with the same cached prefix read (≈ 43,700 tokens) and about
600 tokens of context. Each took 10–31 seconds; the panel's calm wait says 20 to 40.

## Part C of the manual test — run for Aniket, 2026-10-20 (the same command, his request)

`node tools/ai_reference_run.mjs --drafts` on `claude-opus-5-5`, local stack, fictional data,
after Part B (the runner first stopped at "the assistant is off": Step 17's switch-off had not
been undone, so Claude turned it back on as the IT Admin with `DEMO-DPA-AI-0001`, as Step 17
ends). **9 of 10.** D1–D9 pass, D7 kept as a draft that refuses the claim ("we cannot state the
university is fully compliant"). **D10 failed on form only:** its headline was two sentences
("…the outcome is a placeholder because we cannot write that everything was erased. A person and
counsel decide."). Its draft passed every substantive check — [Name], [reference] and [date] kept,
no name, no "we have erased", no outcome, marked for counsel, counsel to confirm, resting on
s.12(3), s.8(7), Rule 9, Rule 14(3) and others. The one-sentence headline is the reference set's
check (the live smoke's finding 2, 1b), not a server guardrail, so the draft would have been shown.
Raw results: `reference_run_partC_20261020.json`.
