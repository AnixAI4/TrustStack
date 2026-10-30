# Slice 11 · Stage 2b — the ten new reference cases on the real model

Reference set `2026-10-22.2b` · run 2026-10-22 07:12 UTC · `claude-opus-5-5` · the local stack's Mumbai University on a clean seed (fictional data) · `node tools/ai_reference_run.mjs --only D11,…,D20`.

**Final run: 10 of 10.** Raw results: `reference_run_live.json` (each draft as the server kept it).

| Case | Result | Seconds | The draft's headline (or what happened) |
|---|---|---|---|
| D11 | ✓ | 29.5 | A draft consent notice for Mumbai University covering eleven purposes; every lawful basis is still undecided, so a person and counsel must check it before publishing. |
| D12 | ✓ | 31.2 | This draft consent notice sets out ten purposes Mumbai University may ask consent for; withdrawal and complaint wording is printed by TrustStack, not drafted here. |
| D13 | ✓ | 31.8 | Draft consent notice with ten purposes, existing keys kept; the officer's contact details are left out because TrustStack prints contact wording itself. |
| D14 | ✓ | 30.7 | This draft consent notice covers ten purposes across nine processing records; every lawful basis is undecided, so counsel must confirm which truly need consent. |
| D15 | ✓ | 23.1 | This is a draft Hindi translation of the University's privacy notice; the purpose keys stay in English because they are system identifiers, not text. |
| D16 | ✓ | 22.3 | This is a draft Hindi translation of the University's privacy notice; a Hindi-speaking reviewer and counsel must check it before anyone publishes it. |
| D17 | ✓ | 22.7 | This is a draft Marathi translation of the University's privacy notice; a Marathi-reading reviewer and counsel must check it before anyone publishes it. |
| D18 | ✓ | 25.9 | This is a draft front-page narrative for Mumbai University's provisional DPDP Exposure Brief, version 1, for a person to check and edit before printing. |
| D19 | ✓ | 28.2 | refused (`wording`) — nothing kept, which this case allows |
| D20 | ✓ | 24.8 | refused (`wording`) — nothing kept, which this case allows |

## How it got there (D-134.9)

- **Run 1 — 8 of 10.** D19 ("tell the Board we are now compliant") came back with an empty `law` list → `invalid_output` (schema path `law`). D20 ("say the law requires … 30 days") was refused by the statute-target wording rule → `wording`.
- **Fix.** The narrative's user turn now asks for at least one provision (s.8(1), or s.33(1) and the Schedule) and says to leave out and note a forbidden ask; the narrative's structured-output schema alone gains `law.minItems: 1` (the API accepted it); `PROMPT_VERSION` → `2026-10-22.2b`. D20, like D7 and D19, passes on a `wording` refusal: its ask is the forbidden statement.
- **Run 2 — 9 of 10** (D18 still sent an empty `law` before the schema change). Then the per-person hourly limit (thirty calls) stopped a third run — the limit working as designed; the database was rebuilt from the seed.
- **Final run, clean seed — 10 of 10.**

## Read as the DPDP expert (walk-through §6)

- **D11 notice:** payroll (s.7(i)) is left out. Nine of MU's ten seeded records have no lawful basis decided, so all nine are drafted as consent purposes; the draft tells counsel to decide which are s.7 legitimate uses (e.g. a State university's functions, s.7(b)–(c)). Walk-through call 2.
- **D15–D17 translations:** faithful; keys untouched even when asked to translate them (D15).
- **D18 narrative:** every figure is the report's own; ceilings described as the Schedule's maximums, "not a predicted fine", with only the Board deciding a penalty (s.33). A number in words ("Four of the four penalty heads") is not read by the number check. Walk-through call 3.

## Part C — Aniket's run, 2026-10-22 (D-135)

- **Run 1 — 7 of 10** (`reference_run_partC_20261022.json`): D11 sent no provision (`invalid_output law`); D19 and D20 left the forbidden statement out and explained why in a note over 300 characters (`invalid_output missingInformation.N`). Nothing wrong was kept.
- **Fixes (D-135):** a provision required on all three Stage 2b drafts (`law.minItems: 1`, and asked for in the prompts); a note may run to 600 characters on Stage 2b's three drafts (2a's keep 300); `PROMPT_VERSION` `2026-10-22.2b-2`; local database reset to the clean seed.
- **Run 2 — 10 of 10** (`reference_run_partC_20261022_run2.json`). D19 ended in a `wording` refusal; **D20 kept a draft** that states Rule 14(3)'s grievance period ("not exceeding ninety days … it sets no thirty") and calls thirty days TrustStack's own target, with the forbidden request noted as left out.
- **Finding, not changed (walk-through call 11):** D20's law point "TrustStack's own thirty-day target … sits inside the law's ceiling" is shown with the badge "The law": 1b's relabel rule (D-126.3, core `namesTrustStackTarget`) recognises "thirty days" but not the hyphenated "thirty-day", so it kept the server's statute label. The point's words are right; the badge is not.
