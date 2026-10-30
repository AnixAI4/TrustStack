# Slice 6 — manual test: gap register, actions and roadmap

A step-by-step check of Slice 6 by hand, with what to expect at each step.
Written 2026-10-02 against PR #18 (`slice/06-gaps-actions`).

## Before you start

**Where.** The live site: https://revised-truststack-web.vercel.app
(PR #18 was merged on 2026-10-02.)

**Sign-ins.** All three use the seed password — `SEED_USER_PASSWORD` in the
repo-root `.env.local`.

| Who | Email | Used for |
|---|---|---|
| Consultant | `consultant@anix-ai.example.com` | Does the work, owns the action |
| Registrar | `dpdp.owner@mumbai-university.example.com` | The second person: reviews and approves |
| Dean | `dean@mumbai-university.example.com` | Read-only check |

**Use a new throwaway assessment**, not the seeded "Mumbai University DPDP
Compass Baseline". The automated RLS tests expect that one unchanged; if it
does get touched, `pnpm db:seed` restores it.

## Part A — Set up (as Consultant)

| # | Do this | Expect |
|---|---|---|
| 1 | Sign in as the Consultant. The organisation switcher should say Mumbai University. | Dashboard loads. |
| 2 | Go to **Scope**, open the last step, type a name such as `Manual Slice 6 test` under **Generate assessment**, and click it. | A new assessment with 124 questions. |
| 3 | Open it from **Assessments**. Answer three questions in the first (Governance) group: claim **0** on the first, **5** on the second, **3** on the third. Save each. | Each shows "adjusted": 0, 1 and 1. The claims of 5 and 3 are capped at 1 because nothing is evidenced. |
| 4 | Look at the score panel at the top. | A link reading "Open the gap register and roadmap", with "not generated yet" beside it. |

## Part B — Generate and read the register

| # | Do this | Expect |
|---|---|---|
| 5 | Click that link. | The register page says no register has been generated. Open gaps: 0. |
| 6 | Click **Generate the gap register**. | Open gaps **3**: Critical **1**, High **2**. Actions closed "0 of 3". |
| 7 | Read the three cards. | Critical first. Each shows the question text, its domain, "Priority P0 · within 30 days" (Critical) or "Priority P1 · within 60 days" (High), and a recommended fix. No question codes such as `G1.1` appear anywhere. |
| 8 | Check each action's due date. | Critical: 30 days from today. High: 60 days from today. Owner: Unassigned. Status: Open. |
| 9 | Set the **Severity** filter to High, then back to All. | "Showing 2 of 3", then "Showing 3 of 3". |

## Part C — Assign, and try to close on a promise

| # | Do this | Expect |
|---|---|---|
| 10 | On the Critical gap: Owner = **Anix AI Consultant**, Status = **In Progress**, type a note, click **Save**. | Owner and status update. |
| 11 | Open the Status menu again. | Only In Progress, Open, Blocked and Closed are offered. |
| 12 | Choose **Closed** and Save. | Refused: "Closing needs reviewed evidence attached to this action, or approval by a reviewer who is not its owner." Status stays In Progress. |
| 13 | Under "Evidence that the action was done", choose any small PDF or text file and click **Attach evidence**. | The file appears as "Awaiting review", with a note that another reviewer must review it. |
| 14 | Try **Closed** and Save again. | Still refused. An unreviewed file is not enough. |
| 15 | Click the **30 / 60 / 90-day roadmap** tab. | "Next 30 days": 1 action (Critical), under the Consultant's name. "31–60 days": 2 actions (High), under Unassigned. |

## Part D — The second person (as Registrar)

| # | Do this | Expect |
|---|---|---|
| 16 | Sign out. Sign in as the Registrar. Open the same assessment's gap register. | The same three gaps. |
| 17 | On the Critical gap's file: Review = **Strong**, Evidence level = **E5**, **Save review**. | The file shows "Strong". The gap still says "scored 0 of 5" and Critical: evidence on an action does not change the answer's score. |
| 18 | Set the action's Status to **Closed** and Save. | Status "Closed". A line says it was closed by the Registrar "on reviewed evidence". Actions closed "1 of 3". |
| 19 | Look at that closed action. | No edit form and no Detach link. Only a **Reopen** button. |
| 20 | On one High gap: set Owner = **Anix AI Consultant** and Save. Then set Status = **Closed** and Save. | It closes with no file attached, "on a reviewer's approval": the Registrar is a reviewer and is not the owner. |
| 21 | Open the roadmap tab. | "Next 30 days": 0 actions. "31–60 days": 1 action. |
| 22 | Click **Reopen** on the Critical action. | Status returns to In Progress, the closure line disappears, and Detach is available again. |

## Part E — Regeneration keeps people's work

| # | Do this | Expect |
|---|---|---|
| 23 | Sign back in as the Consultant. On the assessment page, change the **first** answer from 0 to 2 and save. | Its adjusted score becomes 1. |
| 24 | Go back to the gap register. | An amber banner says answers have changed since the register was generated. |
| 25 | Click **Regenerate from the current answers**. | The banner goes. The first gap is now **High / P1**, with the same owner, note and evidence, and the same due date as before. |

## Part F — Read-only (as Dean)

| # | Do this | Expect |
|---|---|---|
| 26 | Sign in as the Dean and open the gap register. | All gaps and the roadmap are visible. |
| 27 | Look for controls. | No Generate button, no Save, no Reopen, no Attach evidence. |

## Part G — Finalise (optional, needs a terminal)

Finalising needs all 124 questions answered, and a helper script does that
through the real API. From the repo root, with `.env.local` in place:

```bash
APP_URL=https://revised-truststack-web.vercel.app node tools/answer_assessment.mjs "Manual Slice 6 test" 2
```

(For an unmerged branch, point it at a local `pnpm dev` instead: Vercel
previews sit behind Vercel's own sign-in, which a script does not have.)

| # | Do this | Expect |
|---|---|---|
| 28 | Run the commands above. | It answers every remaining question at claim 2 and prints the score: about 20 / 100, 0 critical, every answer High, 0 outstanding. |
| 29 | As the Registrar, open the assessment and click **Finalise the score**. | The score is frozen and shows "Finalised". |
| 30 | Open the gap register. | A note says the gaps are frozen with the score. No Generate button. 124 open gaps, matching the frozen score's High count. Actions you worked on earlier keep their owner, status and evidence. |
| 31 | Assign an owner to any action and save. | It works: actions stay editable after finalising. |

## If something looks wrong

- **"fetch failed" on sign-in:** the hosted Supabase project has lapsed (it is
  provisioned until 2026-11-02 — see `docs/STATE.md`).
- **A step behaves differently from "Expect":** note the step number and what
  appeared instead.

## Cleaning up

The throwaway assessment can stay; it is in Mumbai University's tenant and no
automated test reads it. Evidence files cannot be deleted by any user, by
design (D-042).
