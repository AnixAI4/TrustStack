import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";
import { defaultLocale, isLocale, LOCALE_COOKIE, type Locale } from "./locales";
import enMessages from "../../messages/en.json";

type Messages = Record<string, unknown>;

// Deep-merge locale messages over the English base so any key not yet translated
// in a locale gracefully falls back to English (never a raw key path).
function deepMerge(base: Messages, override: Messages): Messages {
  const out: Messages = { ...base };
  for (const [key, value] of Object.entries(override)) {
    const baseVal = out[key];
    if (
      value && typeof value === "object" && !Array.isArray(value) &&
      baseVal && typeof baseVal === "object" && !Array.isArray(baseVal)
    ) {
      out[key] = deepMerge(baseVal as Messages, value as Messages);
    } else if (value !== undefined && value !== null && value !== "") {
      out[key] = value;
    }
  }
  return out;
}

// No URL-based i18n routing: the active locale is read from a cookie that the
// language switcher sets. English is always the base; the active locale's
// messages are merged on top, so missing/empty translations fall back to English.
export default getRequestConfig(async () => {
  const store = await cookies();
  const cookieValue = store.get(LOCALE_COOKIE)?.value;
  const locale: Locale =
    cookieValue && isLocale(cookieValue) ? cookieValue : defaultLocale;

  const base = enMessages as Messages;
  let messages: Messages = base;
  if (locale !== defaultLocale) {
    try {
      const localeMessages = (await import(`../../messages/${locale}.json`))
        .default as Messages;
      messages = deepMerge(base, localeMessages);
    } catch {
      messages = base;
    }
  }

  return { locale, messages };
});
