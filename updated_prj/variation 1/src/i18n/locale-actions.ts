"use server";

import { cookies } from "next/headers";
import {
  LOCALE_COOKIE,
  defaultLocale,
  isLocale,
  type Locale,
} from "./locales";

/**
 * Persists the chosen locale in a cookie. Server components read this cookie
 * (via the next-intl request config) to pick the active language. The caller
 * should `router.refresh()` afterwards so the UI re-renders in the new language
 * without a full page reload.
 */
export async function setLocale(locale: Locale) {
  const value = isLocale(locale) ? locale : defaultLocale;
  const store = await cookies();
  store.set(LOCALE_COOKIE, value, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // one year
    sameSite: "lax",
  });
}
