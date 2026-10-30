# Slice 9 · Stage 1 — manual test: the exposure model, by hand

About 20 minutes. Written 2026-10-05 against `slice/09-intelligence`
(`043571c`). Stage 1 has **no exposure screen yet** (the Command Centre is
Stage 2), so you read the new API in the browser while signed in. The new
screens are the guardian question in the scope wizard and the SDF form on
Organisation settings.

## Before you start (once)

1. **Docker Desktop is running**, and so is the local Supabase stack (check
   with `docker ps`). If the stack is stopped, start it from the repo root:
   `npx -y supabase@2.117.0 start -x studio,imgproxy,realtime,edge-runtime,logflare,vector,supavisor,postgres-meta,mailpit`
2. **Use the LOCAL database, not hosted.** Stage 1's migration is not on
   hosted yet. `apps/web/.env.development.local` (gitignored) points
   `pnpm dev` at the local stack. Delete it afterwards to go back to hosted.
3. From the **`revised_truststack` repo root** (not the old `truststack-platform`
   app) run `pnpm dev`, and use the address its `Local:` line prints. If
   another app holds port 3000 (e.g. a Docker container), Next moves to
   **3001**: use that port in every URL below. Its "Environments" line must
   list `.env.development.local`.
4. **The password for every user is the local one:**
   `ci-local-only-Passw0rd-not-secret`. Your hosted password will not work
   here.
5. **Reading the JSON:** Chrome shows it raw; tick **Pretty-print**. Use
   Ctrl/Cmd+F to find things.

| Who | Email |
|---|---|
| Dean (read-only) | `dean@mumbai-university.example.com` |
| Consultant | `consultant@anix-ai.example.com` |
| DPDP Programme Owner | `dpdp.owner@mumbai-university.example.com` |
| Organisation Admin | `it.admin@mumbai-university.example.com` |
| BML admin | `admin@bharat-manufacturing.example.com` |

The two URLs you will use:
- **MU exposure:** http://localhost:3000/api/v1/organizations/0b000000-0000-4000-8000-000000000001/exposure
- **BML exposure:** http://localhost:3000/api/v1/organizations/0b000000-0000-4000-8000-000000000002/exposure

Sign out between users from the app's own Sign out button, or use a private
window per user.

---

## Step 1 — MU's starting picture (as the Dean)

Sign in as the **Dean** and open the **MU exposure** URL.

**Expect:**
- `"basis": "provisional"`: MU's baseline is in progress, with 123
  questions outstanding.
- `heads` lists **H1, H2, H3, H4, H7**. `notModelled` lists **H5 and H6**,
  each with a reason.
- **H1, H2, H3 and H7: `"Not yet assessed"`**, each with "No question that
  evidences this head has been answered yet…".
- **H3** has an `applies` reason: "Applies because children's data is
  processed, and whether data of persons with disability who have a lawful
  guardian is processed is not yet known."
- **H4: `"Not applicable"`**, with "…TrustStack never infers this."
- `headline`: `ceilingsAtStakeCrore` **700**, `exposedHeads` **4**,
  `applicableHeads` **4**, `daysToDeadline` **220** on 5 Oct 2026 (one less
  each day). `ceilingsLabel` reads "Statutory ceilings, not a predicted
  fine…".
- `s37.shown` is **true**.
- `freshness.registerGapsGenerated` is **false**.

## Step 2 — Wording and the black box (same page)

Ctrl/Cmd+F for each of these:

| Search for | Expect |
|---|---|
| `G1.2` | **0 matches**: no question codes |
| `CORE_DPDP` | **0**: no pack codes |
| `trigger:` | **0** |
| `compliant` | **0** |
| `not a final legal opinion` | **1**: D-011's caveat (`caveats.readiness`) |
| `not a prediction of any decision` | **1**: the exposure caveat (`caveats.exposure`), naming "exposure model 1.0.0" |

## Step 3 — The register moves the picture (as the Consultant)

1. Sign in as the **Consultant**. Go to **Processing register →
   Register gaps and actions**, then click **Generate the register's gaps**.
2. Open the **MU exposure** URL again.

**Expect:**
- **H1 → `"Partially mitigated"`**, upper third (`₹167–250 crore`). Its
  reasons are "Processor without a valid contract (1 open gap)" and "Rule 6
  minimum safeguards not confirmed (10 open gaps)". **Root causes:** "No
  owner (10)" and "Vendor not mapped (9)".
- **H3 → `"Exposed"`**, `₹133–200 crore`. Its reasons are "No verifiable
  parental consent (8 open gaps)" and "Children may be tracked or targeted
  (8 open gaps)".
- **H7 → `"Partially mitigated"`**, with purpose, retention, consent and
  contract register gaps as reasons.
- **H2 stays `"Not yet assessed"`.** No register rule evidences breach
  notice; only the assessment can.
- **What to check:** "No owner", "Vendor not mapped" and "Review overdue"
  appear only as **Root cause** lines. They never set a status, because they
  are enabling controls, not DPDP duties.

## Step 4 — The new scope question (as the DPDP Programme Owner)

1. Sign in as the **DPDP Programme Owner** and open **Scope**.
2. Under the children's question, a new one: **"Does the organisation
   process personal data of persons with disability who have a lawful
   guardian?"**, currently **Unknown**.
3. Set it to **No** and **Save answers**. The save succeeds.
4. Open the **MU exposure** URL.

**Expect:** H3 still applies, and its reason now reads only "Applies because
children's data is processed." Set the answer back to **Unknown** and save,
so MU stays as seeded.

## Step 5 — The Programme Owner cannot declare an SDF (same user)

Open **Organisation** and scroll to **Significant Data Fiduciary
notification**.

**Expect:**
- The text reads "Only if the Central Government has notified you as a
  Significant Data Fiduciary. TrustStack never infers this."
- The status reads "None recorded. The additional obligations of section 10
  are not assessed."
- **There are no date or reference fields.** Instead: "Only an Organisation
  Admin or consultant can record a notification."

## Step 6 — The Admin records one (as the Organisation Admin)

1. Sign in as the **Organisation Admin** and open **Organisation**.
2. Under **Significant Data Fiduciary notification**, enter the date
   **2099-01-01** and the reference **G.S.R. 999(E)**, then click **Record
   notification**.
   **Expect:** a red error (the request is refused, because a future date is
   not allowed). Nothing is saved.
3. Change the date to **2026-09-01** and record again.
   **Expect:** "Notification recorded.", and the status line shows the date
   and the reference.
4. Open the **MU exposure** URL.

**Expect:**
- **H4 now applies**: `"Partially mitigated"`, upper third (`₹100–150
  crore`).
- H4's reasons: "Applies because a Significant Data Fiduciary notification
  dated 2026-09-01 is recorded."; "Processing register: AI processing not
  reviewed (2 open gaps)."; and "SDF, DPIA, audit and AI/algorithmic risk
  readiness has not been answered yet."
- `applicableHeads` is now **5**, and `ceilingsAtStakeCrore` **850**.

## Step 7 — Remove it (same user)

Click **Remove notification**.

**Expect:** "Notification removed." On the exposure URL, H4 is back to
**Not applicable** and `ceilingsAtStakeCrore` is **700**.

## Step 8 — BML, the empty organisation (as the BML admin)

Sign in as the **BML admin** and open the **BML exposure** URL.

**Expect:**
- `"basis": "none"` and `"assessment": null`.
- **H1, H2, H7: Not yet assessed. H3: Not applicable** (BML said no to
  children's and guardian data). **H4: Not applicable.**
- `ceilingsAtStakeCrore` **500**. No error.
- Search for `Mumbai`: **0 matches**.

## Step 9 — Tenant isolation (still as the BML admin)

Open the **MU exposure** URL.

**Expect:** an error, not data: `"code": "TENANT_ACCESS_DENIED"` (HTTP 403).

---

## When you are done

- Stop `pnpm dev` (Ctrl+C).
- Delete `apps/web/.env.development.local` before running `pnpm dev` against
  hosted again.
- Steps 3–7 changed local data only. `pnpm db:seed` (with the local env)
  restores MU's scope answers. The register gaps stay until they are
  regenerated, which is harmless.

**If anything does not match, note the step number and what you saw.**
That is the feedback for the Stage 1 gate, alongside
`docs/testing/SLICE_09_stage1_walkthrough.md`.
