# Translation system

TrustStack supports the 23 locales registered in `src/i18n/locales.ts` without
locale-prefixed URLs. The selected locale is stored in the `NEXT_LOCALE` cookie.

## Two translation layers

1. `messages/*.json` contains shell copy used through `next-intl`, including
   navigation, the homepage, footer and shared controls. These values are
   server-rendered and fall back to English only when a key is genuinely absent.
2. `public/i18n/site/*.json` contains hash-keyed translations for visible text
   embedded in route files, components, content modules, question banks and
   template data. `LocaleTextRuntime` loads only the selected locale and applies
   it to text nodes, metadata and accessibility attributes, including content
   inserted after hydration.

The source catalog is generated structurally with the TypeScript parser. A
source edit changes its hash, so a stale translation cannot be applied to new
wording. Dynamic template strings use numbered placeholders, which are checked
for exact preservation by the audit.

## Commands

```powershell
# Fill missing next-intl keys without replacing reviewed values
node scripts/translate-messages.mjs

# Regenerate all site-content catalogs incrementally
npm run translate:site

# Regenerate selected locales
npm run translate:site -- hi bn ks

# Re-extract source and validate every dictionary/catalog
npm run audit:i18n

# Check all 23 locales against all 140 concrete pages (3,220 requests)
npm run audit:i18n:routes

# Compile validation
npm run typecheck
```

Google Translate supplies the supported target locales. Kashmiri uses Bing's
native `ks` target because Google's public endpoint rejects that locale. Both
generators abort after repeated errors; they never save English as a successful
translation.

## Legal and file boundaries

The localized Act and Rules wording is an automated accessibility translation,
not an official legal translation. Non-English statutory pages show this notice
and link to the gazette source.

PDF, DOCX and poster downloads remain source files in their original language.
On localized template-detail pages, the translated DOM Reader opens by default;
the PDF and DOCX tabs are explicitly marked as English source files. Generated
letters copy and browser-print their translated preview. The direct jsPDF letter
download remains English because its bundled fonts do not cover all 22 target
scripts.

Machine-generated legal, educational and policy translations require human
review before they are described as legally authoritative or publication-grade.