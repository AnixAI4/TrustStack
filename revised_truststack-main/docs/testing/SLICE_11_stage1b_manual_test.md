# Slice 11 · Stage 1b — explain in the app: manual test, step by step

> **✅ Approved 2026-10-20 — "Stage 1b approved", every call including call 12 (D-128).**
> Kept as the record of what was approved; the next stage is 2a (SLICE_11 §7b).

What you are testing: the **TrustStack Assistant** in the side panel. It has four
"Explain" buttons: a **question**, the **evidence** on an answer, a **gap or an
action**, and **why a domain scores what it does**. You also test **thumbs up /
down** on an answer and the **AI assistant tab** in Organisation settings, where
the assistant is turned on (with the contract reference) and off.

About 25 minutes. **Part A (Steps 1–8)** is one command that checks the API for
you. **Part B (Steps 9–18)** is in the browser. Both use the **recorded fake**:
fixed answers, no cost, never the real model. **Part C (Step 19)** is optional and
uses the **real model** with your key from `.env.local`, about $1 for all
twenty reference cases.

Your gate phrase at the end: **"Stage 1b approved"** (or "Stage 1b approved with
changes: …").

---

## Before you start (Claude does this for you on request)

1. **Open Docker Desktop** and wait until it says it is running.
2. Open Terminal and go to the project:
   ```bash
   cd ~/Downloads/Anix/AI_Projects/DPDP_revised/revised_truststack
   ```
3. Get Stage 1b (no new package):
   ```bash
   git fetch && git checkout slice/11-ai-assistant && git pull && pnpm install
   ```
   Stage 1b has **one migration** (`20261021000000_ai_explain_helpers`). Claude has
   already applied it to your laptop's database and rebuilt that database from the
   seed. **Do not run `pnpm db:migrate` or `pnpm db:seed` in a plain Terminal**: the
   project's `.env.local` points at the **live** database. Nothing in this stage
   goes to the live site until the slice's PR at the end of Stage 2b.
4. Start the app **with the assistant switched on, on the fake** (stop any running
   copy with Ctrl + C first):
   ```bash
   AI_ENABLED=true AI_PROVIDER=fake pnpm dev
   ```
   Wait for the `Local:` line, usually **http://localhost:3001**.
5. Open a **second** Terminal tab in the same folder for Part A.

**Who is who** (password for everyone: `ci-local-only-Passw0rd-not-secret`):

| Who | Email | Role |
|---|---|---|
| Registrar | `dpdp.owner@mumbai-university.example.com` | DPDP Programme Owner |
| IT Admin | `it.admin@mumbai-university.example.com` | Organisation Admin — may turn the assistant on and off |
| Dean | `dean@mumbai-university.example.com` | Executive Sponsor — sees the switch, cannot change it |
| BML Owner | `dpdp.owner@bharat-manufacturing.example.com` | Bharat Manufacturing's DPDP Owner (assistant off) |

Everything you create here is on your laptop's copy only; Claude rebuilds it afterwards.

---

## Part A — the helpers through the API, one command (Steps 1–8)

**Do:**
```bash
node tools/ai_manual_test_1b.mjs
```
Press Enter after each step. (Add `--no-pause` to run straight through.)

**Expect:** every line ✓, and at the end **"All green — 21 of 21 checks passed."** The steps:

| Step | What it checks |
|---|---|
| 1 | The **Evidence Helper** explains G1.2's evidence. It is told the file's verdict ("reviewed: partial") and *that* the evidence held the claim of 5 down. It is not told the evidence level, the score, the reviewer, their note or the question code. An unanswered question gets a 409: there is no evidence to explain. |
| 2 | The **Gap Helper** explains MU's one gap. No owner's name, id or email is sent. |
| 3 | The **Action Helper** explains the gap's action from its id alone, and the draft records which action. |
| 4 | The **Score Helper** explains Governance from the stored numbers: one answer held down, by 2 points (claimed 5, counts as 3). No weight, cap or red-flag rule is sent. |
| 5 | An answer saying "the score has been changed" is **refused** (422, wording). |
| 6 | **Thumbs up** with a comment: the IT Admin cannot rate the Registrar's answer (403). The Registrar can, once (a second rating is 409). The audit log says `ai.feedback` · up · with a comment, and never the comment's words. |
| 7 | **Bharat Manufacturing** stays off: a clear 403. |
| 8 | The **reference set**: all twenty cases pass the server's checks, including R1 (the live smoke's s.8(10) mislabel, corrected by the new server rule). |

---

## Part B — the panel, in the browser (Steps 9–18)

Open **http://localhost:3001** and sign in as the **Registrar**.

### Step 9 — Explain a question
**Do:** Assessments → *Mumbai University DPDP Compass Baseline*. On **G1.2** ("Is
there a formally nominated DPDP owner…?"), click **✦ Explain** beside "Suggested owner".
**Expect:** a panel slides in from the right: *TrustStack Assistant · Explain this
question*, with the question under it. For a moment it says *"Reading the Act, the
Rules and your organisation's own records…"*. Then you see:
- one sentence in bold (the answer);
- **Why it matters here**;
- one navy button (**Answer this question**);
- **The law behind this (2 provisions)**, folded;
- **Tell me more**, folded;
- *"Suggested by the AI assistant — a person must review it before relying on it."*
  and the legal caveat;
- **Was this helpful? Yes / No**.

(On the fake, the Question Helper always gives its one security answer, whatever the
question. The real model answers the question asked; see Part C.)

### Step 10 — The law, folded away, and told apart
**Do:** click **The law behind this**.
**Expect:** **s.8(5)** and **Rule 6(1)**, each marked **The law** in blue, with a plain
point under each. A TrustStack default (none here) would be marked *"TrustStack
default, not the law"* in amber.

### Step 11 — Thumbs up, once
**Do:** click **Yes**, type `Clear and short.` and click **Send feedback**.
**Expect:** a green toast *"Thanks for the feedback"*, and the panel says *"You rated
this answer helpful. Thank you."* The Yes/No buttons are gone.

### Step 12 — The next step goes somewhere real
**Do:** click **Answer this question**.
**Expect:** the panel closes and G1.2's **"How far along is this?"** box is in front of
you, selected. **Do not change the answer.**

### Step 13 — Is this evidence enough?
**Do:** in G1.2's **Evidence** section (under the answer), click **✦ Is this evidence
enough?**
**Expect:** *"The reviewed evidence supports part of what was claimed, so the answer
counts for less than the level chosen until stronger evidence is reviewed."* The next
step is **Add stronger evidence**. Press **Esc**: the panel closes.

### Step 14 — Why this score?
**Do:** click the **Score** tab. In the Scorecard, click **✦ Why this score?** beside
*Governance, accountability and DPDP ownership*.
**Expect:** *"Most governance questions are still unanswered, and the one answer given
counts for less than claimed because its reviewed evidence supports less."* The
next step is **Answer the remaining questions**. Click it: the panel closes and the
**Questions** tab opens on Governance.

### Step 15 — Explain a gap, and an action
**Do:** go to the gap register (**1 gap, 0 critical — open the gap register and
roadmap** on the Score tab). Click **✦ Explain this gap**. Close the panel. Then go to
**Actions** → **All actions** and click **✦ Explain this action** under *"Nominate DPDP
owner and publish internal responsibility note."*
**Expect:** both answer in the same shape. The second panel is titled **Explain this
action**, and its next step leads to the gap register. The breach, rights and
retention actions have **no** Explain button: only an action on an assessment gap can
be explained yet.

### Step 16 — A refused answer is explained, not shown
**Do:** open any Explain panel. In **Ask something more specific**, type
`[fake:certifies]` and click **Ask**.
**Expect:** an amber notice: **That answer was not kept**, *"…said something TrustStack
never says (such as calling an organisation compliant), so it was not kept."*
(`[fake:…]` is a test marker that makes the fake misbehave; real people never type it.)

### Step 17 — The switch, read-only for the Dean
**Do:** sign out, sign in as the **Dean**, go to **Organisation** → **AI assistant**.
**Expect:** two short paragraphs on what the assistant does and what it never sends,
then *"On since 19 October 2026, under contract DEMO-DPA-AI-0001 (fictional, demo
tenant)."* (or the day you rebuilt), and *"Only an Organisation Admin or consultant can
turn the assistant on or off."* No buttons.

### Step 18 — Off, and on again, as the IT Admin
**Do:** sign in as the **IT Admin** → **Organisation** → **AI assistant**. Click **Turn
the assistant off**.
**Expect:** a green notice and toast: *"The AI assistant is off. Nothing more is sent to
the AI provider."* The status says *"Off. The last contract reference recorded was
DEMO-DPA-AI-0001 (fictional, demo tenant)."* Now open the assessment: **no Explain
button anywhere**.
**Do:** back to **AI assistant**. Clear the reference box: **Turn the assistant on** is
greyed out. Type `DEMO-DPA-AI-0001` and click it.
**Expect:** *"The AI assistant is on."*, and the status now says *"…turned on by MU
Organisation Admin, under contract DEMO-DPA-AI-0001."* The Explain buttons are back.

---

## Part C — optional: the reference set against the real model (Step 19)

### Step 19 — twenty real questions, checked
**Do:** stop the app (Ctrl + C) and start it on the real model:
```bash
AI_ENABLED=true AI_PROVIDER=anthropic pnpm dev
```
then, in the second tab:
```bash
node tools/ai_reference_run.mjs
```
**Expect:** twenty lines, each ✓ or ✗ with the model's one-sentence answer and the
seconds it took (10–20 s each, about 5 minutes in all). Claude's run passed **20 of
20**. A ✗ names exactly what failed,
for example *"the answer is not one sentence"* or *"says 'transfer outside india is
prohibited'"*. Claude's own run is in `docs/testing/slice11-1b/reference_run_live.md`.
Compare yours with it. The real model may word things differently each time.

---

## When you are done

Tell Claude **"done"** (or what went wrong, with the step number). Claude stops the
app and rebuilds your laptop's database from the seed. Then give the gate phrase.
