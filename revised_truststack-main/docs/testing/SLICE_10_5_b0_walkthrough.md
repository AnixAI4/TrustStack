# Slice 10.5 · Stage B0 — walk-through: the app shell

Built 2026-10-16/17 on `slice/10-5-simplicity` (draft PR — see STATE). Opened by
your message "Start Slice 10.5 Stage B0" — approved by your own request of
2026-10-16 (D-100), built as `docs/slices/SLICE_10_5_simplicity_pass.md` §1.
Claude's calls the brief did not make: **D-101** (and §4 below).

**Nothing about the data, the law or who may do what changed**: no API, no
permission, no model, no migration, no seed. Every `data-testid` and every
`<Can>` gate is kept. The manual test is
`docs/testing/SLICE_10_5_b0_manual_test.md` (about 20 minutes). Its gate is your
**"Stage B0 approved"** on your laptop.

## What you are approving

1. **The old app's look** — navy `#003366` / blue `#2563EB`, the slate greys, the
   soft `#F4F8FC` page, white cards with a soft shadow, Inter and Plus Jakarta
   Sans — on every page, through design tokens.
2. **A fixed frame** — a navy left menu (grouped, icons, collapsible, a drawer on
   a phone) and a white top bar with the page title and **who is signed in, as
   which role, in which organisation**, with the account menu and Sign out.
   Only the content scrolls.
3. **One way to show messages** — an inline `<Notice>` for everything that must
   stay on the page, and a toast for a success that was easy to miss.
4. **Less scrolling** — paged, searchable, sortable tables on eleven lists; tabs
   on five long detail pages and on Actions.
5. **The public pages** take the same look, without the menu.
6. **The ten calls in D-101** (summarised in §4).

---

## 1. The frame

| | Before | After |
|---|---|---|
| Menu | A wrapping row of 16 text links above each page; gone once you scroll | **Fixed navy menu** on the left: Overview · **Programme** (Assessments, Actions, Exposure, Reports) · **Registers** (Processing, Breaches, Rights & grievances, Notice & consent, Processors, Retention, AI risk) · **Settings** (Organisation, Scope, Users, Question bank). The page you are on is highlighted. **Collapse menu** shrinks it to icons (remembered in the browser). On a phone: ☰ opens it as a drawer |
| Who am I | Only on the overview ("Signed in as … `legal_user`") | **Every page, top right**: initials, name, a **role badge** ("Legal User"), the organisation. On a phone the badge stays beside the initials |
| Organisation switcher | In the header, for people in two organisations | Same switcher (same test id), in the top bar; on a phone, inside the account menu |
| Sign out | A button in the header | In the **account menu** (click your name), with your email, "Signed in as **role** in **organisation**" and **Organisation settings** |
| Page title | Each page's own heading only | The top bar names the page and its group ("REGISTERS / Breach register") |
| Width | A narrow column (`max-w-4xl`, ~900 px) | Full width up to a comfortable ~1,280 px |

The role is read from the same permissions the menu uses (`roleName` for the
active organisation) — the badge cannot disagree with what the person can do.

## 2. Messages

- **`<Notice>`** — 119 messages in 47 files: red with ✕ (a refusal or failure),
  amber with ⚠ (a warning — e.g. the AI register's children warning, "Erasure
  overdue", a stale gap register), green with ✓ (saved), blue with ⓘ (a note).
  Each keeps its test id and **its exact words**; the s.37 notice on Exposure is
  one of them. Errors stay beside the form that caused them.
- **Toasts** (top right, under the bar; close after 4 s; ✕ to close) — only for
  successes that were easy to miss: profile / SDF / Third Schedule saved, scope
  answers saved, an assessment generated, a processing activity created or
  saved, a contract saved, a notice draft saved or published, a consent
  recorded, an invitation resent, a report ready, a breach or request recorded.
  The on-page message is still there; a toast never replaces it.

## 3. Lists and long pages

**Tables, 25 a page** (page numbers, "Showing 1–25 of N", 25/50/100, sort by
column, a search box, a header that stays on screen while you scroll):
Processing, Breaches, Rights & grievances, Processors, Retention, AI risk,
Reports, Users, the consent register's latest choices and look-ups, a question
pack's questions (the core pack has 124+), and a new **All actions** table on
Actions. The reader's own rows and order — no number is recalculated (D-069);
the summary tiles above each list are unchanged. Paging appears only past 25
rows (Mumbai University's registers are shorter, so you will mostly see the
search and the sort).

**Tabs**, the one that needs action first; your place is kept in the address
(`#documents`), so reload or share it:

| Page | Tabs |
|---|---|
| A breach | **Timeline** (Rule 7 steps + status) · Documents · Actions · Details |
| A request or grievance | **Response** (clock, identity, response, status) · Documents · Actions · Details |
| A retention schedule | **Erasure** (badge "Overdue" when it is) · Documents · Actions · Schedule (writers only) |
| A processor | **Contract** (badge "Gap" when no DPDP-clause contract is recorded) · Assessments · Documents |
| An assessment | **Questions** · Score |
| Actions | **By owner** · All actions · 30 / 60 / 90-day roadmap |

## 4. Claude's calls (D-101) — confirm or change

1. **Tokens, not per-file edits**: the `indigo` colour every screen already used
   is redefined as the brand, so all ~45 screens changed look without editing
   each one. New components use named tokens.
2. **Fonts as npm packages** (self-hosted) — not Google's font service, which a
   client-hosted install (Slice 15) may not reach.
3. **One menu list** (`lib/client/nav.ts`), pinned by a test to the old gates.
   One new link: **Overview** (everyone always had it).
4. **The top bar's title is the page's `<h1>`**; Reports' own heading became a
   sub-heading.
5. **Phone**: the role badge stays visible; name and switcher move into the
   account menu.
6. **Collapsed menu remembered per browser.**
7. **Toasts for successes only**; errors stay on the page.
8. **Paging is client-side** over what each register already loads; it switches
   on past 25 rows. Not paged: per-item evidence lists and the gap register
   (Stage A judges them).
9. **The six tab layouts** in §3 — and the assessment opens on **Questions**, not
   Score (most people on that page are answering; the overview already shows
   the score). Say if you want Score first.
10. **Public pages** keep their own light layout; the consent widget on a
    client's site is unchanged.

## 5. Evidence

- **Screenshots**, before and after, every page at laptop (1366 × 800) and
  phone (390 × 844) width — 37 pages × 2 widths × before/after:
  `docs/testing/slice10_5-b0/before/` and `…/after/` (file names start with the
  surface id from `docs/UX_REVIEW.md`, e.g. `U30-breach--laptop.webp`). Both
  passes recorded **0 browser console errors**.
- **Gates** — see STATE for the final counts: core, web unit (+29: the shell's
  gates and test ids, page titles, initials, paging), RLS, typecheck,
  `check:secrets` and the build-output service-role scan, and the full e2e run
  (selectors updated, none deleted — D-101).
- **Client-hosted (Slice 15)**: B0 adds no hosted-only dependency — no font CDN,
  no runtime call outside the app; the three new packages are bundled.
