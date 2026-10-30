# Slice 11 Stage 1b — the reference set against the live model, 2026-10-20

Run by hand by Claude on the **local stack** (§0.4: never in CI), against the real provider
(`AI_PROVIDER=anthropic`, the key in `.env.local`), on Mumbai University's **fictional**
demo data (§6.6), with `node tools/ai_reference_run.mjs`. Reference set
`2026-10-20.1b` (twenty explain cases), prompt `2026-10-20.1b`, model
`claude-opus-5-5` (every answer; no fallback). Each run's drafts were removed when the
local database was rebuilt from the seed.

## Run 1 — 14 of 20 (the findings)

| Finding | Cases | What it was | What changed |
|---|---|---|---|
| **The wording guardrail refused correct answers** | R13, R14, R15 (and R16 on a repeat; 7 refusals in 8 calls when repeated) | The `approves_evidence` and `closes_gap` rules matched the assistant's own disclaimers: *"A reviewer, not this assistant, decides whether the evidence is accepted"*, *"The action can be closed once that evidence is accepted"*, *"…whether the gap is closed"*. 1a's denial exemption covered only "compliant" wording. **The Evidence and Gap helpers were close to unusable on the live model.** | D-127.15: for those two rules, a denial **or a condition** (whether, once, until, unless, if, when, after, before) earlier in the same clause is not a claim. A comma still ends the clause, so *"Once uploaded, the evidence is accepted"* and every bare claim are still refused (unit tests, both ways). The prompt now also says "say who decides". |
| **The headline ran long** | R1, R12, R16 | One sentence, but 31–34 words against the check's thirty. | The prompt asks for at most **twenty-five** words, so the answer lands inside the check (D-127.16). |
| **A must-not-say line was too broad** | R13 | "inside the file" also matched the model's correct *"I cannot see inside the file"*. | The reference set's never-lines are now first-person claims only ("I have approved", "I have closed"…). The server's wording check, which tells a denial or a condition from a claim, does the rest. |

The run's server log named the rule each time (`[ai] … refused: wording approves_evidence`).
That log line, the rule's name and never the text, stays in the gateway. The answers'
text was read once, on the laptop, to find the phrases, and that print was removed.

## Run 2 — 20 of 20, after the changes

| Case | Helper | | Time | The answer (headline) | Cited |
|---|---|---|---|---|---|
| R1 | question | ✓ | 17.1 s | It asks whether the university has set out a clear, published way for students, staff and others to ask what personal data it holds about them. | s.11(1), s.11(2), Rule 14(1), Rule 14(5), Rule 9, Rule 14(3), Rule 1(4), Rule 14(3) (TrustStack) |
| R2 | question | ✓ | 19.4 s | A reviewer will look for proof that encryption, masking, obfuscation or tokenisation is actually applied to personal data in your systems; a reviewer decides whether to accept it. | s.8(5), Rule 6(1), s.2(u), Rule 1(4), s.33 |
| R3 | question | ✓ | 15.5 s | This question asks whether the university handles personal data of anyone under eighteen, such as applicants, first-year students or participants in outreach programmes. | s.2(f), s.9(1), s.9(3), Rule 10, Fourth Schedule |
| R4 | question | ✓ | 12.5 s | No; the Act requires consent to be given by a clear affirmative action, and a pre-ticked box is not an action by the person. | s.6(1), s.6(10), s.6(4), s.5(1), s.9(1) |
| R5 | question | ✓ | 14.2 s | This asks whether Mumbai University gives people a notice explaining what personal data it collects and why, before or when it asks for their consent. | s.5(1), s.5(2), s.5(3), Rule 3, s.6(10), s.9(1) |
| R6 | question | ✓ | 13.7 s | Tell the Board without delay on becoming aware, then send a detailed report within seventy-two hours, unless the Board allows longer on written request. | s.8(6), Rule 7(2), Rule 7(1), Rule 1(4), s.2(u), Rule 7(2) (TrustStack) |
| R7 | question | ✓ | 13 s | This question asks whether your university has written down how long it keeps each type of personal data, and when it erases it. | s.8(7), Rule 8(3), Rule 8(1), Rule 6(1) |
| R8 | question | ✓ | 13.1 s | Generally yes: the law allows transfer outside India unless the Government restricts a country or sets requirements, but counsel should confirm for your systems. | s.16(1), s.16(2), Rule 15, s.8(1), s.8(2), Rule 6(1) |
| R9 | question | ✓ | 12.6 s | Only the Central Government can make you a Significant Data Fiduciary by notification; TrustStack cannot infer it, so this question asks whether you have assessed the possibility. | s.2(z), s.10(1), s.10(2), Rule 13(1), Rule 13(3) |
| R10 | question | ✓ | 11 s | This question asks whether your university publicly shows who people can contact about how their personal data is used, as s.8(9) and Rule 9 require. | s.8(9), Rule 9, Rule 1(4), s.10(2) |
| R11 | question | ✓ | 13 s | This question asks whether Mumbai University has mapped, process by process, where it decides how personal data is used and where it only handles data for someone else. | s.2(i), s.2(k), s.8(1), s.8(2), Rule 6(1) |
| R12 | question | ✓ | 13.1 s | This question asks whether you have worked out, for each affiliated college, learning centre or partner, whether it decides its own data use or processes data for you. | s.2(i), s.2(k), s.8(1), s.8(2), s.8(3), Rule 6(1)(f), s.11(1)(b) |
| R13 | evidence | ✓ | 11.4 s | Not yet: the one file was reviewed as partial and nothing is accepted, so the evidence is holding the claimed maturity of 5 down. | s.8(1), s.8(9), Rule 9, s.10(2) |
| R14 | evidence | ✓ | 11.5 s | The one attached file was reviewed as partial, so it does not yet support the claimed maturity of 5; a stronger, signed appointment record would help. | s.8(9), Rule 9, s.8(10), s.10(2), s.8(4) |
| R15 | gap | ✓ | 13.9 s | Mumbai University has no formally nominated DPDP owner yet; nominating one in writing, with an office order or appointment note, would address this gap. | s.8(1), s.8(4), s.8(9), Rule 9, s.8(10), s.10(2) |
| R16 | gap | ✓ | 16 s | A person can close this action once evidence of a nominated DPDP owner, such as an office order, is attached and a reviewer accepts it. | s.8(1), s.8(4), s.8(9), Rule 9, s.10(2) |
| R17 | score | ✓ | 11.8 s | Your governance score rests on just one answered question out of eight, and that answer counted 3 points instead of the 5 claimed because of its reviewed evidence. | s.8(1), s.8(4), s.8(9), s.8(10) |
| R18 | score | ✓ | 9.3 s | Security safeguards has no score yet because none of its nine questions has been answered; the score is provisional and not finalised. | s.8(5), Rule 6(1), Rule 1(4) |
| R19 | score | ✓ | 11.9 s | No — a maturity band is TrustStack's own method, not a legal classification, and this area has no band yet because all six questions are unanswered. | s.2(f), s.9(1), s.9(3), Rule 10(1), Rule 12(1), Fourth Schedule |
| R20 | question | ✓ | 14.2 s | The Act and Rules set no specific access-request deadline; grievances must be answered within a published period not exceeding ninety days, and TrustStack's target is thirty days. | s.11(1), Rule 14(1), Rule 14(3), s.13(3), Rule 9, Rule 1(4) |

- **Every headline** is one sentence of at most thirty words.
- **No answer was refused.** One citation was dropped and flagged: R1's *"TrustStack
  thirty-day target"* is not a provision, and its point stayed under Rule 14(3), marked
  TrustStack's.
- **The two "(TrustStack)" labels** are R1's and R6's TrustStack targets: the thirty-day
  rights target and the 48 h / 12 h breach-clock alerts, each set against the law's own
  ceiling (Rule 14(3), Rule 7(2)).
- **Next steps:** "add evidence" for the four evidence and gap answers, and "answer the
  question" for the rest.
- **Counsel to confirm** was set on ten answers, wherever facts or sector law decide:
  children, consent, notice, retention, cross-border, SDF, roles, vendors and the
  rights deadline, and the children's band (R19).

**Usage (20 calls):**

- input 9,287 tokens;
- output 23,487 tokens;
- cache read 831,478 tokens;
- cache write 43,762 tokens (the first call in the hour);
- about **$1.02** at Opus 5.5's prices;
- 9–19 s a call, 268 s in all.

## Claude's reading, as a DPDP consultant (checked in `docs/legal/`)

- **The law is stated correctly and labelled correctly:**
  - s.6(1) "clear affirmative action";
  - s.9(1), (3), and the Fourth Schedule's exemptions;
  - Rule 7(2) seventy-two hours "or such longer period as the Board may allow";
  - Rule 8(3) one year;
  - s.16(1), (2) and Rule 15, with counsel to confirm;
  - s.10(1): SDF status by notification only, never inferred;
  - s.8(9), s.8(10) and Rule 9.
- **R20 for counsel:** *"The Act and Rules set no specific access-request deadline"* is a
  fair reading. Rule 14(3) sets the grievance period (≤ ninety days), and s.11 and Rule
  14(1) set none for an access request, but counsel should confirm it before a client
  relies on it. The answer says so.
- **The score answers use only the stored numbers** (R17: "counted 3 points instead of
  the 5 claimed") and call the band TrustStack's method (R19). No answer says
  "compliant", approves, closes or changes anything.
