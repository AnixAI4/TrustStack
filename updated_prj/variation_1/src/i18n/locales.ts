// Central locale registry for the 23-language, India-first i18n system.
//
// English is listed first (it's the default / fallback and most visitors'
// starting language); every Indian language after it is still a first-class
// citizen, not an afterthought.

export const locales = [
  "en", // English - Latin (default / fallback)
  "hi", // Hindi - Devanagari
  "bn", // Bengali - Bengali
  "te", // Telugu - Telugu
  "mr", // Marathi - Devanagari
  "ta", // Tamil - Tamil
  "ur", // Urdu - Nastaliq (RTL)
  "gu", // Gujarati - Gujarati
  "kn", // Kannada - Kannada
  "or", // Odia - Odia
  "ml", // Malayalam - Malayalam
  "pa", // Punjabi - Gurmukhi
  "as", // Assamese - Bengali
  "mai", // Maithili - Devanagari
  "sa", // Sanskrit - Devanagari
  "kok", // Konkani - Devanagari
  "sd", // Sindhi - Perso-Arabic
  "ne", // Nepali - Devanagari
  "si", // Sinhala - Sinhala
  "mni", // Manipuri (Meitei) - Meitei Mayek
  "doi", // Dogri - Devanagari
  "sat", // Santali - Ol Chiki
  "ks", // Kashmiri - Nastaliq (RTL)
] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

/** Cookie that persists the visitor's chosen locale (no URL prefixing). */
export const LOCALE_COOKIE = "NEXT_LOCALE";

/**
 * Each language's name written in its own native script - never romanized.
 * This is what the language switcher renders so speakers recognise their tongue.
 */
export const localeNames: Record<Locale, string> = {
  hi: "हिन्दी",
  bn: "বাংলা",
  te: "తెలుగు",
  mr: "मराठी",
  ta: "தமிழ்",
  ur: "اردو",
  gu: "ગુજરાતી",
  kn: "ಕನ್ನಡ",
  or: "ଓଡ଼ିଆ",
  ml: "മലയാളം",
  pa: "ਪੰਜਾਬੀ",
  as: "অসমীয়া",
  mai: "मैथिली",
  sa: "संस्कृतम्",
  kok: "कोंकणी",
  sd: "سنڌي",
  ne: "नेपाली",
  si: "සිංහල",
  mni: "ꯃꯤꯇꯩꯂꯣꯟ",
  doi: "डोगरी",
  sat: "ᱥᱟᱱᱛᱟᱲᱤ",
  ks: "کٲشُر",
  en: "English",
};

/** English names - handy for aria-labels, tooltips and developer-facing logs. */
export const localeEnglishNames: Record<Locale, string> = {
  hi: "Hindi",
  bn: "Bengali",
  te: "Telugu",
  mr: "Marathi",
  ta: "Tamil",
  ur: "Urdu",
  gu: "Gujarati",
  kn: "Kannada",
  or: "Odia",
  ml: "Malayalam",
  pa: "Punjabi",
  as: "Assamese",
  mai: "Maithili",
  sa: "Sanskrit",
  kok: "Konkani",
  sd: "Sindhi",
  ne: "Nepali",
  si: "Sinhala",
  mni: "Manipuri",
  doi: "Dogri",
  sat: "Santali",
  ks: "Kashmiri",
  en: "English",
};

/** Locales that render right-to-left (Nastaliq script). */
export const rtlLocales = ["ur", "sd", "ks"] as const;

export type RtlLocale = (typeof rtlLocales)[number];

/** True when the given locale must render right-to-left. */
export function isRTL(locale: Locale): boolean {
  return (rtlLocales as readonly string[]).includes(locale);
}

/** Type guard: is the given string one of our supported locales? */
export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

/** Text direction for a locale - convenient for `dir={...}` props. */
export function getDir(locale: Locale): "rtl" | "ltr" {
  return isRTL(locale) ? "rtl" : "ltr";
}
