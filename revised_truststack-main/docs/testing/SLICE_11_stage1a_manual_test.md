# Slice 11 · Stage 1a — the safe AI gateway: manual test, step by step

> ## ⭐ The simple way — one command (about 3 minutes)
>
> 1. Make sure the app is running. (Claude starts it for you: the Terminal tab
>    "TrustStack app (AI on the fake)".)
> 2. In the other Terminal tab, type this and press Enter:
>    ```bash
>    node tools/ai_manual_test.mjs
>    ```
> 3. It runs Steps 1–10 below **for you**. For each step it says in plain words
>    what it checks, shows what TrustStack answered, and marks each check
>    **✓** or **✗**. Read it, then **press Enter** for the next step.
> 4. At the end it prints **RESULT**. If every check is ✓, tell Claude
>    **"Stage 1a approved"**. If anything shows ✗, copy the red lines into the chat.
>
> Claude ran it first on 2026-10-19: **29 of 29 checks passed**. Everything below is the
> same test done by hand, one command at a time, for when you want to look closer.

About **20 minutes**. Twelve steps. Each one says **what to do** and **what you
should see**. Tick it off, or note what was different.

You test on your **laptop's own copy** of TrustStack (the local stack). Stage 1a
has **no screen yet**: the AI assistant answers through the API only, so you ask
it from Terminal with one command, `node tools/ai_ask.mjs`, which signs in as a
seeded person and prints the answer in plain words. The panel in the app comes
in Stage 1b. The walk-through is `docs/testing/SLICE_11_stage1a_walkthrough.md`.

**Part A (Steps 1–10)** uses the **recorded fake**: the same fixed answers CI
uses, at no cost. **Part B (Steps 11–12)** is optional and uses the **real model**
with your key from `.env.local`: about $0.38 for the first question in an hour
(it stores the law in the provider's cache) and about $0.04 for each one after.

---

## Before you start (Claude does this for you on request)

1. **Open Docker Desktop** and wait until it says it is running.
2. Open Terminal and go to the project:
   ```bash
   cd ~/Downloads/Anix/AI_Projects/DPDP_revised/revised_truststack
   ```
3. Get Stage 1a (one new package, `@anthropic-ai/sdk`):
   ```bash
   git fetch && git checkout slice/11-ai-assistant && git pull && pnpm install
   ```
   Stage 1a has **one migration** (`20261020000000_ai_gateway`). Claude has already
   applied it to your laptop's database and rebuilt that database from the seed.
   **Do not run `pnpm db:migrate` or `pnpm db:seed` in a plain Terminal**: the
   project's `.env.local` points at the **live** database. Nothing in this stage
   goes to the live site until the slice's PR at the end of Stage 2b.
4. Start the app **with the assistant switched on, on the fake** (stop any running
   copy with Ctrl + C first):
   ```bash
   AI_ENABLED=true AI_PROVIDER=fake pnpm dev
   ```
   Wait for the `Local:` line, usually **http://localhost:3001**. If it prints
   another port, add `--base http://localhost:PORT` to every command below.
5. Open a **second** Terminal tab in the same folder for the commands below.

**Who is who** (password for everyone: `ci-local-only-Passw0rd-not-secret`; the
tool uses it for you):

| Who | Email | Role |
|---|---|---|
| Registrar | `dpdp.owner@mumbai-university.example.com` | DPDP Programme Owner — the tool's default |
| IT Admin | `it.admin@mumbai-university.example.com` | Organisation Admin — may turn the assistant on and off |
| BML Owner | `dpdp.owner@bharat-manufacturing.example.com` | Bharat Manufacturing's DPDP Owner |

Everything you create here is on your laptop's copy only; Claude rebuilds it afterwards.

---

## Part A — the gateway, on the recorded fake

### Step 1 — is the assistant on for Mumbai University?

**Do:**
```bash
node tools/ai_ask.mjs --status
```
**Expect:** `"available": true`, `"offReason": null`, `"platformEnabled": true`, and
under `organisation`: `"enabled": true`, `"contractRef": "DEMO-DPA-AI-0001 (fictional,
demo tenant)"` and an `enabledAt` time. (The seed turns it on for the demo under a
fictional contract reference — A2.)

### Step 2 — ask the Question Helper

**Do:**
```bash
node tools/ai_ask.mjs
```
(The Registrar asks about question **G1.2** of MU's baseline: "Is there a formally
nominated DPDP owner or nodal officer?")

**Expect:** `HTTP 200`, then the answer in its one shape:
- **ANSWER** — one sentence; **WHY IT MATTERS**; **NEXT STEP** `Answer this question
  [answer_question]`;
- **THE LAW** — `s.8(5) (the law)` and `Rule 6(1) (the law)`, each with a plain point;
- **TELL ME MORE** — the longer explanation;
- the two notes at the end: *"Suggested by the AI assistant — a person must review it
  before relying on it."* and the **D-011 caveat** (*"…not a final legal opinion,
  statutory certification or guarantee of compliance…"*);
- the last line: `requiresHumanReview=true legalReviewRequired=false
  injectionFlagged=false citationsDropped=0 · model fake-recorded-1a · draft <id>`.

The fake always gives the same security answer, whatever the question. Part B
asks the real model.

### Step 3 — Bharat Manufacturing's assistant is off

**Do:**
```bash
node tools/ai_ask.mjs --org bml --as dpdp.owner@bharat-manufacturing.example.com
```
**Expect:** `HTTP 403` and `✗ AI_DISABLED: The AI assistant is off for this
organisation. An administrator can turn it on once your contract with TrustStack
names the AI provider.` Then `organisation`. Nothing was sent anywhere and nothing
was stored.

### Step 4 — one organisation cannot use another's assistant

**Do:** the BML Owner aims at Mumbai University:
```bash
node tools/ai_ask.mjs --as dpdp.owner@bharat-manufacturing.example.com
```
**Expect:** `HTTP 403` and `✗ TENANT_ACCESS_DENIED: …`. Nothing about MU in the reply.

### Step 5 — an answer that says "compliant" is never kept

**Do:** the marker makes the fake give a hostile answer:
```bash
node tools/ai_ask.mjs --ask "[fake:certifies]"
```
**Expect:** `HTTP 422` and `✗ AI_ANSWER_REJECTED: The AI assistant's answer said
something TrustStack never says (such as calling an organisation compliant), so it was
not kept.` Below it: `draftId: …` and `rejection: wording`.

### Step 6 — a TrustStack target dressed up as the law is refused

**Do:**
```bash
node tools/ai_ask.mjs --ask "[fake:statute_target]"
```
**Expect:** `HTTP 422`, `rejection: wording`. (The fake claimed "the Act requires you
to answer every rights request within 30 days". 30 days is TrustStack's target; the
Rules give a ceiling of ninety days for grievances, Rule 14(3).)

### Step 7 — citations are checked against the Act and the Rules

**Do:** first an answer whose citations are all invented, then one with one good and
one invented:
```bash
node tools/ai_ask.mjs --ask "[fake:bad_citation]"
node tools/ai_ask.mjs --ask "[fake:partial_citation]"
```
**Expect:** the first: `HTTP 422`, `rejection: citation` (*"…did not point to the Act
or the Rules…"*). The second: `HTTP 200`; **THE LAW** shows only `s.8(5)`, and the last
line says `citationsDropped=1` (the invented "Rule 42(9)" was removed and flagged).

### Step 8 — a refusal is a clear message, never half an answer

**Do:**
```bash
node tools/ai_ask.mjs --ask "[fake:refusal]"
```
**Expect:** `HTTP 422`, `✗ AI_ANSWER_REJECTED: The AI assistant declined to answer
this. Nothing was changed.`, `rejection: refusal`.

### Step 9 — the trail: every call audited, as the person, without the text

**Do:** read the audit as the IT Admin:
```bash
node tools/ai_ask.mjs --as it.admin@mumbai-university.example.com --audit --limit 12
```
**Expect:** newest first, one line per call from Steps 2 and 5–8: `ai.requested`
(Steps 2 and 7's second call) and `ai.refused` (with `refused: wording`, `citation`,
`refusal`), each `question_helper · question G1.2 · fake-recorded-1a`. **No answer
text and no question text** appears in any of them. Steps 3 and 4 left nothing:
they never reached the assistant.

### Step 10 — only an administrator turns it off, and off is immediate

**Do:**
```bash
node tools/ai_ask.mjs --switch off
node tools/ai_ask.mjs --as it.admin@mumbai-university.example.com --switch off --ref "DEMO-DPA-AI-0001 (fictional, demo tenant)"
node tools/ai_ask.mjs
node tools/ai_ask.mjs --as it.admin@mumbai-university.example.com --switch on
node tools/ai_ask.mjs --as it.admin@mumbai-university.example.com --switch on --ref "DEMO-DPA-AI-0001 (fictional, demo tenant)"
```
**Expect, line by line:**
1. The Registrar: `HTTP 403`, `✗ FORBIDDEN` (no `organization.update`).
2. The IT Admin: `HTTP 200`, `"enabled": false`, `"enabledAt": null`; the reference stays.
3. Asking now: `HTTP 403`, `AI_DISABLED` — at once.
4. On **without** a reference: `HTTP 400`, `VALIDATION_ERROR`, then `ai.contractRef: Record the contract (DPA) reference that
   names the AI provider before turning the assistant on.`
5. On with the reference: `HTTP 200`, `"enabled": true`, a new `enabledAt`.

Run `--audit` again (as the IT Admin): `ai.disabled` and `ai.enabled`, each with
`contract DEMO-DPA-AI-0001…`.

---

## Part B — optional: the real model (about $0.45 for both questions)

Uses the `ANTHROPIC_API_KEY` already in your `.env.local`. Mumbai University's data is
fictional; the legal text is public. §6: development and the demo use fictional data only.

### Step 11 — restart on the real model

**Do:** in the first Terminal tab, stop the app (Ctrl + C) and start it on Claude:
```bash
AI_ENABLED=true AI_PROVIDER=anthropic pnpm dev
```
**Expect:** the same `Local:` line.

### Step 12 — two real questions, judged as a DPDP expert

**Do:**
```bash
node tools/ai_ask.mjs --question S1.1 --ask "We are a university. What would a reviewer accept as evidence here?"
node tools/ai_ask.mjs --question R1.1
```
**Expect** (about 15–25 seconds each; Claude's own run of these two is in
`docs/testing/slice11-1a/live_smoke_2026-10-19.md`): `HTTP 200`, `model claude-opus-5-5` on the last
line, and answers you would sign off as a consultant:
- plain words; a legal term glossed the first time ("Data Fiduciary — your organisation…");
- about **Mumbai University** (a university), not generic text;
- **THE LAW** cites real provisions (for S1.1, likely `s.8(5)` and `Rule 6(1)`; for
  R1.1, likely `s.11`–`s.14` and `Rule 14`), each marked "the law" or "TrustStack default";
- never "compliant" or "certified"; TrustStack's 30-day target never called the law;
- `citationsDropped=0` ideally (a dropped citation is not a failure: the check worked).

If an answer reads wrong to you, note it: it becomes a case in the reference set
(§4.13, built in Stage 1b).

**When you are done:** tell Claude. Claude stops the app and rebuilds your laptop's
database from the seed.
