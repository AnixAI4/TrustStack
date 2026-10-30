# Fix · s.11(1)(b) — who the person's data was shared with: manual test, step by step

**What you are testing:** an access request now shows **who the person's data was shared with**
(s.11(1)(b)), taken from the processing register, with a button to copy the list into the reply.

**Time:** about 10 minutes, all in the browser, on your laptop's database (never the live site).

**Gate phrase at the end:** **"Fix s.11 approved"** (or "Fix s.11 approved with changes: …").

---

## Before you start (Claude does this for you on request)

1. **Open Docker Desktop** and wait until it says it is running.
2. **Get the fix** in Terminal:
   ```bash
   cd ~/Downloads/Anix/AI_Projects/DPDP_revised/revised_truststack
   git fetch && git checkout fix/s11-access-sharing-list && git pull && pnpm install
   ```
3. **No database change.** Claude has rebuilt your laptop's database from the seed. **Do not run
   `pnpm db:migrate` or `pnpm db:seed` in a plain Terminal**: the project's `.env.local` points at
   the live database.
4. **Start the app:** `pnpm dev`. Open **http://localhost:3001** (Docker holds 3000).
5. **Password** for every seeded user: the one in your local seed setup (Claude can tell you).

Who plays whom:
- **The Dean** (`dean@mumbai-university.example.com` — Executive Sponsor): reads the register, writes nothing.
- **The IT & Security lead** (`ciso@mumbai-university.example.com` — Organisation Admin on Mumbai University): can edit the processing register.

---

## Steps

| # | Who | Do | Expect |
|---|---|---|---|
| 1 | Dean | Sign in. Click **Rights and grievances** in the left menu. | The register. **DPR-2026-001** (access) and **GRV-2026-001** (grievance). |
| 2 | Dean | Open **DPR-2026-001**. | The **Response** tab. Under "Identity" a new box: **"Who the person's data was shared with"**. |
| 3 | Dean | Read the box's first paragraph. | It says the reply must name every other organisation the data went to, whether a Data Processor or another Data Fiduciary, and what kinds of data (s.11(1)(b)); keep only what concerns this person. |
| 4 | Dean | Look at the table. | **LMS provider** · "Data Processor · Learning management platform" · ROPA-004 with its kinds of data. Then rows "Named in the record's text — check who this is" for ROPA-001, 002, 003, 006–010. |
| 5 | Dean | Look for **ROPA-005** (Payroll). | **Not in the table.** Under it: "1 record rests on another legitimate use (s.7) or an exemption; this right does not reach it, so it is left out." |
| 6 | Dean | Read the line about undecided records. | "9 records have no lawful basis decided yet, so they are listed until the basis is decided." |
| 7 | Dean | Type **colleges** in the table's search box. | Only rows mentioning colleges remain. Clear the search. |
| 8 | Dean | Click **Copy the list for the reply**, then paste it into any text editor. | The button says **Copied**. The pasted text is one line per recipient with its kinds of data, e.g. "- LMS provider (Data Processor, Learning management platform): …". No requester's name or email. |
| 9 | Dean | Look at the small print at the bottom of the box. | It cites **s.11(1)(b)** and the **s.11(2)** exception (sharing with an authority on a written request about offences or cyber incidents). |
| 10 | Dean | Go back to the register; open **GRV-2026-001** (the grievance). | **No** "Who the person's data was shared with" box: only access requests need it. |
| 11 | IT & Security lead | Sign out; sign in as the IT & Security lead. Open **Processing register** → **ROPA-005 Payroll** and note its lawful basis is "Employment". Do not change anything. | Read-only check: this is why Step 5 left it out. |
| 12 | IT & Security lead | Open **Rights and grievances → DPR-2026-001** again. | The same box and table as Steps 2–9. |

**When you are done:** tell Claude. Claude stops the app and rebuilds your laptop's database.
