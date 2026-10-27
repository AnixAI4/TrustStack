# MASTER PROMPT - Make the DPDP Practitioner certificate *actually* good

> Paste this whole file to a coding agent working in this repo. It is self‑contained:
> it embeds the exact current code you will change, the three hard requirements, a
> concrete "premium credential" design spec, the integration steps, the anti‑goals,
> and a verification checklist. Do not open other reference files to start - everything
> you need to change is quoted below.

---

## 0) Mission & definition of done

The certificate a learner earns for passing the **DPDP Practitioner exam** currently
looks like a generic template - a tinted rectangle with a frame, a wordmark and a seal.
It reads as "made in an afternoon", not as a credential an employer would trust. The
marketing already promises *"India's first DPDP certificate that employers can verify - with a LinkedIn badge, a unique certificate number, and 2‑year validity"*
(`src/content/easy/solutions.ts`). **The certificate must live up to that sentence.**

Three product changes ride along with the redesign:

1. **Remove the download.** No "Download certificate (PDF)" button anywhere. The
   credential is a beautiful, verifiable **on‑screen** artifact - not a file the user
   saves. Remove the sample‑download path too.
2. **Collect the holder's identity ("full name and all").** On a pass, the learner
   enters their **full legal name** plus a short set of credential details, and the
   certificate renders with those details baked in.
3. **Gate everything behind an actual pass.** The identity form and the real
   certificate appear **only when the learner has passed the exam**. Before a pass, no
   editable name field, no downloadable/generatable certificate, no way to mint a
   credential you did not earn.

**DONE only when:**

- Passing the exam reveals an identity form → the learner fills it → a **premium**,
  print‑clean certificate renders on screen with their details and a **verifiable
  certificate ID + QR/verify link**.
- There is **no download button** and **no PDF generation** wired to any button in the
  certificate UI (intro preview *or* result screen).
- Before a pass, the intro page shows a **locked, non‑editable preview** (teaser) - you
  cannot type a name or produce a certificate.
- `npx tsc --noEmit` exits **0**, and the exam/result flow still works end‑to‑end
  (intro → exam → result → certificate on pass; review‑only on fail).

**Anti‑goal:** a flat tinted card with a border and a clip‑art seal. If it still looks
like a coupon or a template, it is wrong. No download button may survive anywhere.

---

## 1) Current state - the exact files & code you will change

### 1a) `src/components/sections/CertificateStudio.tsx` (REPLACE this component's behaviour)

Today this single component does **three things that must change**: it renders an
**editable name input**, it renders a **Download (PDF) button**, and it is used in a
`sample` mode that lets *anyone* download a certificate before passing. Current code:

```tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, Award, Loader2 } from "lucide-react";
import { downloadCertificatePdf, makeCertId } from "@/lib/pdf";
import { certificateSealSvg } from "@/lib/seal";
import { cn } from "@/lib/cn";

export function CertificateStudio({
  score, presetCertId, sample = false, defaultName = "", className,
}: {
  score?: number; presetCertId?: string; sample?: boolean; defaultName?: string; className?: string;
}) {
  const [name, setName] = useState(defaultName);
  const [busy, setBusy] = useState(false);
  const [certId, setCertId] = useState<string>(presetCertId ?? "");
  useEffect(() => { if (!presetCertId) setCertId(makeCertId()); }, [presetCertId]);
  // ...issueDate, hasScore...
  const handleDownload = async () => {
    /* calls downloadCertificatePdf(...) */
  };
  return (
    /* card → live preview → <input id="cert-name"> → <button onClick={handleDownload}>Download certificate (PDF)</button> */
  );
}
```

### 1b) `src/components/sections/DpdpExam.tsx` (the two call sites)

```tsx
// line ~370 - INTRO page, "Preview the credential": lets anyone download a sample
<CertificateStudio sample />

// line ~430 - RESULT page, inside `{passed && ( ... )}`: the earned certificate
<CertificateStudio score={pct} presetCertId={certId} />
```

The result screen already gates the certificate behind `passed` - keep that gate and
strengthen it. The **intro** call currently uses `sample` and must become a locked,
non‑interactive teaser (no input, no button).

### 1c) `src/lib/pdf.ts` - `downloadCertificatePdf()` + `makeCertId()`

`downloadCertificatePdf()` builds an A4 jsPDF and calls `doc.save(...)`. **Stop wiring
this to the certificate UI.** You may leave the function in the module (other exports
like `downloadActGuidePdf` stay), but **no certificate button may call it**. Keep and
reuse `makeCertId()` (format `CDP-XXXX-XXXX`) for the on‑screen certificate ID.

### 1d) `src/lib/seal.ts` - `certificateSealSvg()`

A vector Ashoka‑chakra seal. Keep it, but treat it as one element of a much richer
design (below), not the only flourish.

---

## 2) The three hard requirements (do all three)

### R1 - Remove the download (everywhere)

- Delete the download **button**, the `handleDownload`, the `busy` state, and the
  `Download`/`Loader2` imports from the certificate component.
- Delete the `import { downloadCertificatePdf } from "@/lib/pdf"` usage from the
  component (keep `makeCertId`).
- Remove the `sample` **download** path entirely. The intro preview must not be able to
  produce a file.
- Do **not** replace it with `window.print()`, an `<a download>`, a `.svg`/`.html`
  blob, or any other save mechanism. The credential is on‑screen only.

### R2 - Collect the holder's identity ("full name and all")

Only after a pass, show a compact **"Claim your certificate"** form. Fields:

| field | required | notes |
|---|---|---|
| **Full legal name** | yes | as it should appear on the credential; `maxLength={60}` |
| **Designation / role** | optional | e.g. "Data Protection Officer" - printed under the name |
| **Organisation** | optional | e.g. "Acme Pvt Ltd" - printed under the designation |

Behaviour:

- The certificate stays in a **"draft / unclaimed"** state (name placeholder, subtle
  "Enter your name to claim" affordance, verify actions disabled) until the learner
  types a **non‑empty full name**, then a **"Claim certificate"** action locks the
  details in and flips it to the **issued** state (name + designation + organisation +
  issue date + certificate ID all rendered).
- Keep the existing hydration‑safe pattern: generate the certificate ID on the client
  in `useEffect` (never during render) to avoid SSR mismatch.
- Do not add email/phone or any new network calls - this is a client‑only credential.

### R3 - Gate strictly behind a real pass

- The **only** place the identity form + issuable certificate may appear is the result
  screen inside the existing `{passed && ( … )}` block in `DpdpExam.tsx`. Never on the
  intro, never on `/certification`, never in `sample` mode.
- The **intro** preview becomes a **locked teaser**: the same premium artwork, but with
  a placeholder name ("Your name here"), a small lock affordance, **no input**, **no
  button**, and a caption: *"Pass the exam to unlock and claim your certificate."*
- Because the exam is one‑attempt (`LOCK_KEY = "dpdp-exam-lock"`), the earned state is
  inherently tied to the recorded pass - do not add a second way to mint one.

---

## 3) The premium credential design spec (this is what "actually good" means)

Redesign the on‑screen certificate (the live WYSIWYG block in the component) so it
reads as an **authentic, engraved, verifiable credential**. Keep the brand palette - ivory paper `#fbf8f0`, navy ink `#101f3a`, gold `#ad8a3a`, muted `#6e7480` - and the
`297 / 210` (A4‑landscape) aspect ratio. Layer in **at least six** of the following;
ship the ones marked ★ as mandatory:

- ★ **Guilloché / engine‑turned background.** A faint, spirograph‑style line pattern
  (overlapping rotated ellipses or a rosette) rendered as inline SVG behind the text at
  very low opacity - the single biggest "this is real" signal. Deterministic (no
  `Math.random`) so SSR and client match.
- ★ **Microtext border.** A hairline border whose line is actually repeated tiny text
  (e.g. `TRUSTSTACK · DPDP PRACTITIONER · VERIFIED ·`) at ~3-4px. Looks like a solid
  rule at a glance, resolves to text up close - a classic anti‑forgery cue.
- ★ **Guardian/foil corners.** Ornamental gold corner flourishes (SVG), not plain
  diamonds.
- ★ **Real credential metadata block.** Issue date, **Certificate ID** (`CDP‑…`),
  **valid until** (issue date + 2 years, matching the "2‑year validity" promise), and a
  one‑line credential statement.
- ★ **Verify affordance.** A small **QR code** (generate client‑side; add the `qrcode`
  package, dynamically imported like jsPDF is today) encoding a verify URL
  `\`/certification/verify?id=${certId}\`` plus a printed `Verify at …` line. Wire the
  actual verify page only if trivial; otherwise the QR + printed ID is enough to look
  and behave real. **No download - the QR/link is how it "leaves" the screen.**
- ★ **Embossed seal, upgraded.** Keep `certificateSealSvg()` but sit it on a subtle
  emboss/drop‑shadow so it reads as pressed into the paper.
- **Watermark.** A large, very faint gold "DPDP" or chakra glyph centered behind the
  text.
- **Signatures.** A script‑style issuer signature (webfont or an inline SVG path) over
  the "Programme Director" rule, not just a printed word.
- **Foil wordmark.** A subtle gold gradient on `TRUSTSTACK` (CSS `background-clip: text`)
  to suggest foil stamping.
- **Typographic hierarchy.** Serif display for the name (large, italic), letter‑spaced
  small‑caps for labels, tabular figures for the score/ID. Long names must auto‑fit
  (shrink, then wrap to two lines) - preserve the existing fit logic's intent.

**Motion (tasteful, optional):** a one‑time shimmer sweep across the foil/seal on issue,
gated by `@media (prefers-reduced-motion: reduce)`. Never animate the text itself.

**Print‑clean:** the artifact must look correct if the user prints the page from the
browser (Ctrl/Cmd‑P) even though there is no download - add a small `@media print`
block so only the certificate shows, full‑bleed, colours preserved
(`-webkit-print-color-adjust: exact`). This is the "how do I keep it?" answer that
replaces the download.

---

## 4) Implementation steps (in order)

1. **Add the QR dependency.** `npm i qrcode` and `npm i -D @types/qrcode`. Import it
   **dynamically** inside a client effect (`const QR = await import("qrcode")`) so it
   stays code‑split and client‑only, exactly like jsPDF is imported today.
2. **Rewrite `CertificateStudio.tsx`** into a gated, download‑free credential:
   - Props: `score?: number` (stamped on issue), `presetCertId?: string`,
     `locked?: boolean` (intro teaser). **Remove** `sample` and `defaultName`.
   - State: `name`, `designation`, `org`, `claimed: boolean`, `certId`, QR data URL.
   - When `locked`: render the premium artwork with placeholder text, a lock badge, the
     caption, and **no** form/buttons. Return early - no inputs mount.
   - When unlocked (result screen): render the artwork in **draft** state + the
     identity form; on "Claim certificate" (requires non‑empty name) set `claimed` and
     re‑render in **issued** state with details + QR.
   - Remove all download code, `busy`, `Download`, `Loader2`, and the `downloadCertificatePdf`
     import.
3. **Build the premium artwork** as a self‑contained sub‑component (e.g.
   `<CertificateArtwork name designation org score certId issueDate validUntil qr />`)
   so both the locked teaser and the issued credential share one renderer. Put the
   guilloché/microtext/watermark SVG helpers in the same file (deterministic, no random).
4. **Update `DpdpExam.tsx` call sites:**
   - Intro (~line 370): `<CertificateStudio locked />` and reword the surrounding copy
     to "Pass the exam to unlock and claim your certificate."
   - Result (~line 430, inside `{passed && …}`): `<CertificateStudio score={pct} presetCertId={certId} />`.
   - Update the intro instructions list item that says *"You will receive a
     downloadable certificate if you pass."* → *"You will receive a verifiable
     certificate to claim when you pass."* (and the `CERT_STEPS` "Earn your certificate"
     copy in `src/content/certification.ts` that says *"Download a verifiable
     certificate…"* → *"Claim a verifiable certificate…"*).
5. **Detach the PDF path.** Confirm no component imports `downloadCertificatePdf`. Leave
   `downloadActGuidePdf` and `makeCertId` intact. (Removing the now‑unused cert‑PDF code
   from `pdf.ts` is welcome but optional - do not break `downloadActGuidePdf`.)
6. **(Optional) verify page.** If quick, add `src/app/certification/verify/page.tsx`
   that reads `?id=` and echoes it back as "Certificate CDP‑… - issued by TrustStack".
   Otherwise leave the QR/printed ID as the verify affordance and note it.
7. **Typecheck & run.** `npx tsc --noEmit` must be 0. Then dev‑run and walk the flow.

---

## 5) Hard rules / anti‑goals

- **No download, no save, no print‑to‑PDF button.** The word "Download" must not appear
  on any certificate control. (`@media print` styling is allowed; a button is not.)
- **No certificate without a pass.** The intro/`locked` teaser must have **no input and
  no claim button**. Do not keep `sample` mode.
- **Deterministic SVG only.** Every generated pattern/particle uses index math, never
  `Math.random` - an SSR hydration mismatch is a failure.
- **Client‑only heavy imports.** `qrcode` (and any jsPDF that remains) are dynamically
  imported inside effects/handlers, never at module top level.
- **Keep the brand.** Ivory/navy/gold palette, A4‑landscape ratio, existing seal - do
  not swap in a new colour scheme or stock imagery.
- **Faithful copy.** Keep exact figures already on the page ("2‑year validity",
  `EXAM_PASS_PCT`, cert ID format `CDP‑…`). Do not invent accreditation claims.
- **Accessibility.** Decorative SVG is `aria-hidden`; the form inputs keep labels; the
  claim button is a real `<button>`; motion respects `prefers-reduced-motion`.

---

## 6) Verification checklist (prove each, don't assume)

Run the dev server and verify in the browser at `/certification/exam`:

- [ ] **Intro** shows the premium certificate as a **locked teaser** - placeholder name,
      lock affordance, caption; **no** name input and **no** button exist in the DOM
      (`document.querySelector('#cert-name')` is `null`; no "Download" text anywhere).
- [ ] **Fail path:** finish with a sub‑`EXAM_PASS_PCT` score → result shows review only,
      **no** certificate, **no** identity form.
- [ ] **Pass path:** finish ≥ `EXAM_PASS_PCT` → result reveals the **identity form**
      (full name + designation + organisation) and a **draft** certificate.
- [ ] Typing a full name + **Claim** flips the certificate to **issued**: name,
      designation, organisation, issue date, **valid‑until (+2 years)**, **certificate
      ID**, and a **scannable QR** all render.
- [ ] The QR decodes to `/certification/verify?id=<the shown CDP‑… id>`.
- [ ] Design audit: guilloché background **and** microtext border **and** ornamental
      corners **and** upgraded seal are all visibly present (not a flat bordered card).
- [ ] `grep` the repo: no component references `downloadCertificatePdf`; the string
      "Download certificate" is gone.
- [ ] `Ctrl/Cmd‑P` on the passed result shows a clean, full‑bleed certificate (print CSS).
- [ ] `npx tsc --noEmit` exits **0**.
- [ ] Reduced‑motion: with OS "reduce motion" on, no shimmer/animation plays.

---

## 7) Copy to reuse (so wording stays consistent)

- Locked teaser caption: **"Pass the exam to unlock and claim your certificate."**
- Claim card title: **"Claim your certificate"** · sub: **"Enter your name as it should
  appear on the credential."**
- Issued strapline (unchanged): **"Certified DPDP Practitioner"** ·
  **"Digital Personal Data Protection Act, 2023 & DPDP Rules 2025"**.
- Verify line: **"Verify at dpdp.in/certification · Certificate ID: CDP‑…"**
- Validity: **"Issued <date> · Valid until <date + 2 years>"**
```
