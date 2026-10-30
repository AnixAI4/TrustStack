# Slice 8 — manual test: the dashboards

A step-by-step check of revised Slice 8 by hand (D-068, D-069), with what to
expect at each step. Written 2026-10-04 against branch `slice/08-dashboards`.
About 20 minutes.

## Before you start

**Where.** The live site once the PR is merged:
https://revised-truststack-web.vercel.app — or the branch run locally
against the hosted database (`pnpm dev`; Vercel previews sit behind Vercel
Authentication).

**Sign-ins.** All use the seed password — `SEED_USER_PASSWORD` in the
repo-root `.env.local`.

| Who | Email | Used for |
|---|---|---|
| Dean | `dean@mumbai-university.example.com` | The executive: reads everything, changes nothing |
| Consultant | `consultant@anix-ai.example.com` | Anix staff: the whole bank; assigns an action |
| BML admin | `admin@bharat-manufacturing.example.com` | The empty organisation |

## 1. The overview, as the Dean

1. Sign in as the Dean. You land on **Overview**.
2. **DPDP Compass Readiness Score.** One row per assessment shown: a
   **Finalised** row (frozen, dated: "this number cannot change") if MU has
   a finalised assessment, and an **In progress** row (live, provisional,
   "N questions unanswered") for one started after it. Never one blended
   number. Beside each: **Red flags** (what caps the score) and **Open gaps**
   (work to do) — separate tiles.
3. **What is being done:** Open actions, Overdue (red when above zero), With
   no owner, Closed; the line below splits them between the assessment and the
   processing register.
4. **The scorecard:** sixteen rows, Scoped Out and all-Not-Applicable
   domains labelled as such — never a zero.
5. **How complete the processing register is:** the band chips and ten
   tiles. The text says completeness is separate from the readiness score and
   never moves it. **Review overdue reads 10** on seeded data (the review
   dates were 2026-10-03) — correct.
6. Nowhere on the page: the word "compliant", a question code (`G1.2`) or a
   pack code (`CORE_DPDP_V1`).
7. No button that saves, generates, approves, reopens, attaches or imports.

## 2. Every action, by owner — as the Dean

1. **Actions** in the nav. Tiles at the top, severity chips, then **By
   owner**: Unassigned first (amber), then people by how much they hold.
   Each item is labelled **Assessment** (indigo) or **Processing register**
   (teal), with its domain or its record code and rule.
2. Switch **Source** to "Processing register": the assessment items leave.
3. The **30 / 60 / 90-day roadmap** below shows the same actions by due date.
4. Click an item: it opens that register's own page, where the action is
   edited — the actions page itself only reads.

## 3. One action from each parent, overdue — as the Consultant

1. Open an assessment's gap register; on any action set yourself as owner and
   a due date in the past. Save.
2. Open **Processing register → Register gaps and actions**; if gaps have not
   been generated, generate them. Do the same to one ROPA action.
3. Open **Actions**: both sit under your name, both say "Overdue — <date>",
   one labelled Assessment and one Processing register; both appear in the
   roadmap's **Overdue** column. The overview's Overdue tile counts both.
4. Put the two due dates back afterwards (or re-seed).

## 4. The black-box bank (enforced by the database, D-071)

1. As the **Consultant**: **Question bank** shows all 20 packs with codes,
   tiers and draft status; questions show their codes and "When:" triggers.
   On an assessment, each question shows its pack and why it is included.
2. As the **Dean**: no **Question bank** in the nav. Going to
   `/dashboard/questions` says the questions are on your assessments. On the
   assessment page: no pack codes, no "Triggered by…" reasons.
3. As **MU's Organisation Admin**, on **Scope → step 7**: risk tags with
   reasons, but no "Question packs" list.
4. As MU's **Organisation Admin**, try **Users → invite** with the role
   Anix AI Consultant: refused — the consultant role holds a permission the
   admin does not (D-068).
5. *(Optional, technical)* With the browser's developer tools as the Dean,
   the database's own API returns no rows from `question_packs` and
   "permission denied" for `assessment_questions.pack_code` — the automated
   version is `e2e/api/black-box.spec.ts`.

## 5. The assessment page, collapsed

1. Open MU's baseline. Only the first domain (Governance) is open; the rest
   are headers with weight, question count and answered count.
2. Click a header: it opens. **Open every domain** / **Close every domain**.
3. As the Dean, no pack codes and no inclusion reasons (only "Potentially
   Applicable" notes). As the Consultant, the codes and trigger expressions
   are still shown.

## 6. The empty organisation

Sign in as the BML admin: **No assessment yet** in place of the score, **No
processing activities recorded yet** in the register tile, the actions tiles
at zero. No error anywhere.
