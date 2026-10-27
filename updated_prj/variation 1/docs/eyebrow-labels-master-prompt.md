# Master Prompt - Kill the duplicate "eyebrow" pills and clean up the hero→section rhythm on every page

> Paste everything from **§0** onward to a coding agent working in this repo. It is
> self‑contained: it embeds the **exact current state** (with file:line and copy‑paste
> code), the **root cause** of why two identical little pills appear stacked on several
> pages, a **full audit table of every offending page**, the **exact copy** to ship as
> the fix, the **pill + spacing polish**, a **regression guardrail**, the hard rules,
> and a no‑JS verification checklist tuned to this repo.
>
> **Why we're doing this (the complaint, verbatim):** *"see these 2 labels - they look
> soo bad. also the gap and all - very unprofessional."* The screenshot was `/solutions`:
> the small uppercase pill **"THE SERVICE STACK"** appears **twice** - once in the page
> hero and again, identically, at the top of the very next section - separated only by a
> divider line and a big empty band. It reads like a copy‑paste bug. The same defect is
> live on **`/industries`, `/why-us` and `/framework`**. Fix it everywhere and make sure
> it can't come back.

---

## 0) Mission & definition of done

Make every page carry **exactly one** eyebrow/kicker pill per visual band, so the same
label text never appears twice in a row down the page; then tidy the pill styling and the
hero→first‑section spacing so the top of every page reads deliberate and polished.

**DONE only when:**

1. On `/solutions`, `/industries`, `/why-us` and `/framework`, the hero pill and the
   first section pill are **no longer the same text** (either the section pill is removed
   or replaced with a distinct sub‑label - see §3).
2. A repo‑wide audit (§2.3 procedure) shows **no page** where the `PageHero` `kicker`
   equals - or is a prefix/suffix of - the **first** `SectionHeader` `eyebrow` rendered
   under it.
3. The `.eyebrow` pill renders consistently in **both themes** (dark default +
   `[data-theme="light"]`) and at every fluid size; nothing regresses below the 12px
   label floor.
4. The hero→first‑section gap reads as intentional breathing room, not an empty void
   bracketed by two identical pills.
5. `npx tsc --noEmit` passes; **no** production `next build` is run against a live
   `next dev` (see §6). Easy‑read (`Swap`/`easyKicker`/`easyEyebrow`), a11y and i18n
   behaviour are unchanged.

**Anti‑goal:** "just delete every section eyebrow." Section eyebrows are useful *when they
add a distinct sub‑label*. The bug is **repetition within one band**, not the existence of
section eyebrows. Only touch the ones that duplicate the hero.

---

## 1) Exact current state (do not guess - this is what's on disk)

### 1.1 There are TWO components that render the same pill

Both render the shared `.eyebrow` CSS class, so they are visually identical.

**A - page hero kicker** - `src/components/sections/PageHero.tsx` (lines ~31-41):

```tsx
<div className="flex items-center gap-3">
  <span className="eyebrow">
    {easyKicker ? <Swap easy={easyKicker}>{kicker}</Swap> : kicker}
  </span>
  {kickerHindi && (
    <span className="font-deva text-sm text-text-faint" data-rm="normal">
      {kickerHindi}
    </span>
  )}
</div>
<h1 className="mt-4 max-w-3xl font-display text-4xl font-semibold ...">
```

The hero also carries `border-b border-line` and `container-x py-10 lg:py-14`.

**B - section eyebrow** - `src/components/ui/SectionHeader.tsx` (lines ~33-37):

```tsx
{eyebrow && (
  <p className="eyebrow mb-4">
    {easyEyebrow ? <Swap easy={easyEyebrow}>{eyebrow}</Swap> : eyebrow}
  </p>
)}
<h2 className="font-display text-3xl font-semibold ...">
```

Sections sit inside `.section` = `@apply py-9 sm:py-12 lg:py-16;`
(`src/app/globals.css` ~719-722).

### 1.2 The shared pill - `src/app/globals.css` (lines ~574-582)

```css
.eyebrow {
  @apply inline-flex items-center gap-2 rounded-pill font-semibold uppercase;
  font-size: var(--fs-label);            /* clamp(12px → 13px) */
  letter-spacing: var(--tracking-label); /* 0.09em */
  padding: 0.34rem 0.74rem;
  color: var(--eyebrow);
  background: var(--eyebrow-bg);
  box-shadow: inset 0 0 0 1px var(--eyebrow-bd);
}
```

Tokens - dark (`:root`, ~97-99) and light (`:root[data-theme="light"]`, ~169-171):

```css
/* dark (default) */
--eyebrow:    rgb(255 178 120);
--eyebrow-bg: color-mix(in srgb, var(--accent) 16%, transparent);
--eyebrow-bd: color-mix(in srgb, var(--accent) 38%, transparent);
/* light */
--eyebrow:    rgb(176 68 2);
--eyebrow-bg: color-mix(in srgb, var(--accent) 13%, transparent);
--eyebrow-bd: color-mix(in srgb, var(--accent) 34%, transparent);
```

### 1.3 The root cause

Every top‑level page is built as `PageHero` (with a `kicker`) followed by one or more
sections, and the **first** section is often *the whole point of the page* - so whoever
wrote that section reused the hero's exact label as the `SectionHeader` `eyebrow`. In
normal (non‑easy‑read) mode the `EasyIntro` between them renders nothing, so the two
identical pills land back‑to‑back, separated only by the hero's bottom padding, the
`border-b` divider, and the section's top padding. That empty, divider‑split band framed
by two identical pills is exactly the "gap … very unprofessional" the user saw.

---

## 2) The bug catalogue (audit)

### 2.1 Confirmed duplicate‑pill pages - FIX THESE

| Page | Hero `kicker` (PageHero) | Duplicated first‑section `eyebrow` | Verdict |
|---|---|---|---|
| `/solutions` | `"The service stack"` - `src/app/solutions/page.tsx:15` | `ServiceExplorer` `"The service stack"` - `src/components/sections/ServiceExplorer.tsx:38` | **exact dup** (the screenshot) |
| `/industries` | `"Industry coverage"` - `src/app/industries/page.tsx:15` | `IndustriesSection` `"Industry coverage"` - `src/components/sections/IndustriesSection.tsx:113` | **exact dup** |
| `/why-us` | `"Why Anix TrustStack"` - `src/app/why-us/page.tsx:16` | `WhyUsSection` `"Why Anix TrustStack"` - `src/components/sections/WhyUsSection.tsx:11` | **exact dup** |
| `/framework` | `"Proprietary methodology"` - `src/app/framework/page.tsx:17` | `FrameworkSection` `"Proprietary methodology · Trademark pending"` - `src/components/sections/FrameworkSection.tsx:79` | **near dup** (identical prefix) |

### 2.2 Pages that are already fine (leave them alone - reference only)

Different hero vs first‑section text, so no repetition:
`/learn` (`Learn & certify` → `Courses by role`), `/certification`
(`Professional certification` → `The curriculum`), `/rights`
(`For citizens · Your rights` → `The six rights`), `/tools` (`On-device tools` →
`DPDP Calculators · Section 33 ready-reckoner`), `/privacy` (`Legal notice` →
`TrustStack privacy notice`), plus `/act`, `/rules`, `/blog`, `/cases`, `/cookies`,
`/terms`, `/templates`, `/scanner`, `/security`, `/courses`. **Re‑verify with §2.3
before assuming any of these is safe** - do not edit copy on a page that isn't broken.

### 2.3 Re‑run the audit before AND after editing

Do not trust this table blindly - regenerate it. Every `kicker=` lives in `src/app/**/page.tsx`;
every `eyebrow=` lives in a `SectionHeader`/`PageHero` call. Enumerate both and eyeball
each page for a hero‑kicker that equals the first section eyebrow:

```powershell
# from the project root ("variation 1")
Select-String -Path "src/app/**/page.tsx" -Pattern 'kicker=' -AllMatches
Select-String -Path "src/**/*.tsx"        -Pattern 'eyebrow=' -AllMatches
```

For each page, open it, find the `PageHero kicker=...`, then find the **first**
`SectionHeader eyebrow=...` in the components it renders in order, and compare the two
strings case‑insensitively (also flag when one is a prefix of the other, as on
`/framework`). Any match = a bug to fix.

---

## 3) The fix - one pill per band

**THE RULE (memorise, enforce in review):** *A page's hero `kicker` and the `eyebrow` of
the first section rendered beneath it must never be the same text, nor a prefix/suffix of
one another.* The hero already labels the band; the section must either say something new
or say nothing.

For each offending page pick **one** option:

- **Option A - drop the redundant pill (simplest, lowest risk).** Remove the `eyebrow`
  (and its `easyEyebrow`) prop from the first section so `SectionHeader` renders just the
  title + lede. Use this when the section title already makes the topic obvious.
- **Option B - distinct sub‑label (keeps scan‑ability).** Replace the section `eyebrow`
  with a *different, forward‑moving* sub‑label that advances the narrative rather than
  restating the hero. Provided copy below.

**Ship these exact edits (Option B copy chosen to fit each section's title):**

| Page | Edit | Before → After |
|---|---|---|
| `/solutions` | `src/components/sections/ServiceExplorer.tsx:38-39` | `eyebrow="The service stack"` → `eyebrow="Find your service"`; `easyEyebrow="Our services"` → `easyEyebrow="Pick a service"` |
| `/industries` | `src/components/sections/IndustriesSection.tsx:113` | `eyebrow="Industry coverage"` → `eyebrow="By sector"` (no easyEyebrow present) |
| `/why-us` | `src/components/sections/WhyUsSection.tsx:11` | `eyebrow="Why Anix TrustStack"` → `eyebrow="What sets us apart"` |
| `/framework` | `src/components/sections/FrameworkSection.tsx:79` | `eyebrow="Proprietary methodology · Trademark pending"` → `eyebrow="The seven disciplines"` |

Notes:
- These four section components are **shared only by their own page** (grep to confirm
  before editing - e.g. `WhyUsSection` is imported only by `src/app/why-us/page.tsx`), so
  changing the eyebrow won't leak onto another route.
- `IndustriesSection` is a client component with a `--c` sector theme; only the string
  changes, nothing else. `ServiceExplorer` has both `eyebrow` and `easyEyebrow` - update
  **both** so easy‑read stays de‑duplicated too (hero `easyKicker="How we help"` vs new
  `easyEyebrow="Pick a service"`).
- If you prefer Option A on any of these, delete the `eyebrow`/`easyEyebrow` prop lines
  entirely; `SectionHeader` already guards `{eyebrow && ...}`.
- **Do not** rename the hero `kicker`s - they're the page‑level topic labels and are also
  referenced by SEO/nav expectations; fix the *section* side.

---

## 4) Polish - pill styling & hero→section spacing (do after §3)

The pills only looked "bad" because they were doubled; once de‑duplicated, apply this
light polish so a lone pill sitting above a heading looks intentional. Keep it subtle - this is a tidy‑up, not a redesign, and must hold in both themes.

### 4.1 Pill (`.eyebrow`, globals.css ~574-582) - optional refinement

- Keep `rounded-pill`, the tinted bg and the inset ring. Tighten the box a touch and make
  the label sit optically centred:

```css
.eyebrow {
  @apply inline-flex items-center gap-2 rounded-pill font-semibold uppercase;
  font-size: var(--fs-label);
  letter-spacing: var(--tracking-label);
  padding: 0.3rem 0.7rem;      /* was 0.34rem 0.74rem - a hair tighter */
  line-height: 1;              /* stop the pill growing taller than its text */
  color: var(--eyebrow);
  background: var(--eyebrow-bg);
  box-shadow: inset 0 0 0 1px var(--eyebrow-bd);
}
```

Only change padding/line‑height. **Do not** touch `--fs-label`, `--tracking-label`, or the
`--eyebrow*` tokens - those are owned by the typography/theme systems (see
`docs/typography-scale-master-prompt.md`) and dropping the size would breach the 12px
floor.

### 4.2 Hero→first‑section rhythm

The big empty band is **hero `py-10 lg:py-14` + `border-b` + section `py-9 sm:py-12
lg:py-16`**. That's intentional breathing room; it read as "a gap" only because two
identical pills bracketed it. After §3 it should already look right. If a page still feels
loose, the *only* sanctioned tweak is to trim the **first** section's top padding when it
directly follows the hero - e.g. add a `className="pt-0 sm:pt-2"` (or a small `-mt-*`) on
that one section instance - never by shrinking the global `.section` token (that would
re‑compress every section site‑wide; see the typography master prompt's warning).

Do **not** remove the hero's `border-b border-line`; it's the page's structural divider
and is used consistently across all heroes.

---

## 5) Guardrail - stop it coming back

Add a tiny dev‑only assertion so a future duplicate is caught in the console instead of in
a screenshot. In `PageHero.tsx`, after props are destructured:

```tsx
if (process.env.NODE_ENV !== "production") {
  // Surfaced only in dev; helps catch the "two identical pills" regression.
  // (No runtime cost in prod - the whole block is stripped.)
}
```

…and document THE RULE (§3) at the top of both `PageHero.tsx` and `SectionHeader.tsx` as a
short comment: *"The first section's `eyebrow` under a hero must differ from that hero's
`kicker` - see docs/eyebrow-labels-master-prompt.md."* A comment + the §2.3 audit is
enough; you don't need a custom lint rule. If the team wants automation later, a simple
test can import each `page.tsx`'s source and assert the first `eyebrow=` string ≠ the
`kicker=` string.

---

## 6) Hard rules

1. **Only edit the four offending section components** named in §2.1 (and only their
   `eyebrow`/`easyEyebrow` strings). Do not mass‑edit eyebrows across the site.
2. **Never shrink** `--fs-label`, `--tracking-label`, `.section` padding, or the
   `--eyebrow*` tokens - those belong to the typography/theme systems and have their own
   master prompt. Sub‑12px labels are forbidden.
3. **Preserve easy‑read + i18n + a11y:** if a section has an `easyEyebrow`, keep it in
   sync with the new `eyebrow` (both must be de‑duplicated); don't remove `Swap`/`Easy`
   wrappers; don't touch `messages/*.json`.
4. **Do not rename hero `kicker`s.** Fix the section side.
5. **Never run `next build` while `next dev` is live** on this project - it corrupts the
   shared `.next` (webpack chunk errors, unstyled fallback). Validate with
   `npx tsc --noEmit` instead; if you must build, stop dev first.
6. Keep changes reversible and minimal - string swaps + one small CSS tweak. No new
   components, no refactors.

---

## 7) Verification checklist

Server‑rendered HTML is the ground truth in this repo (the VS Code integrated browser tab
is usually occluded and reverts to `app/loading.tsx`, so live‑DOM probes lie - see
`/memories/repo/truststack-dpdp.md`). Verify with **no‑JS** `Invoke-WebRequest`:

```powershell
# Each offending route should contain its NEW section label and the hero kicker,
# and must NOT contain the old duplicated label twice.
$dir = "c:\Users\amitdamle\Downloads\updated_prj09\updated_prj\variation 1"
foreach ($r in "solutions","industries","why-us","framework") {
  $h = (Invoke-WebRequest "http://localhost:3000/$r" -UseBasicParsing).Content
  # count case-insensitive occurrences of the OLD shared label:
  # solutions -> "The service stack", industries -> "Industry coverage",
  # why-us -> "Why Anix TrustStack", framework -> "Proprietary methodology"
  "$r : verify old label now appears ONCE (hero only)"
}
```

1. ✅ On each of the four routes, the old shared label text appears **once** (hero pill
   only); the first section shows the NEW distinct label (or no pill, if Option A).
   Remember SSR splits `{interpolation}` with `<!-- -->`, so match plain string labels,
   not interpolated ones.
2. ✅ Toggle `document.documentElement.setAttribute('data-theme','light')` and screenshot
   `/solutions` - the lone hero pill still reads correctly (uses the light `--eyebrow*`
   tokens); repeat for dark (remove the attribute / set `'dark'`).
3. ✅ Easy‑read on: turn on the "Easy read" toggle and confirm the hero `easyKicker` and
   the section `easyEyebrow` are also different (not the same pill twice).
4. ✅ No horizontal overflow and the divider/spacing at the top of each page reads
   deliberate at 390px / 768px / 1440px.
5. ✅ `npx tsc --noEmit` passes.
6. ✅ Re‑run the §2.3 audit - zero hero‑kicker == first‑section‑eyebrow matches remain.

---

## 8) TL;DR

Four pages print the same little uppercase pill twice - hero `kicker` **and** the first
section `eyebrow` - which is the "2 labels look bad / gap is unprofessional" complaint.
Fix = make the first section's label **different** from the hero's on `/solutions`,
`/industries`, `/why-us`, `/framework` (swap the four `eyebrow` strings per §3, keeping
`easyEyebrow` in sync), give the pill a hair of padding/line‑height polish (§4.1), leave
the hero divider + spacing intact (§4.2), and add THE RULE as a guardrail (§5). Verify with
no‑JS `Invoke-WebRequest`, both themes, easy‑read, and `tsc --noEmit`.
