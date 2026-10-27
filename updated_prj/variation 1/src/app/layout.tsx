import type { Metadata } from "next";
import {
  Outfit,
  Inter,
  JetBrains_Mono,
  Tiro_Devanagari_Hindi,
} from "next/font/google";
import "./globals.css";
import "./widgets.css";
import "./india-map.css";
import { SiteFrame } from "@/components/site/SiteFrame";
import { SecurityWrapper } from "@/components/site/SecurityWrapper";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { isRTL, type Locale } from "@/i18n/locales";
import { LocaleTextRuntime } from "@/components/site/LocaleTextRuntime";
import { EasyTextRuntime } from "@/components/site/EasyTextRuntime";
import { Providers } from "@/components/providers/Providers";

const display = Outfit({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "600", "700"],
  display: "swap",
});
const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});
const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "600"],
  display: "swap",
});
const deva = Tiro_Devanagari_Hindi({
  subsets: ["devanagari", "latin"],
  variable: "--font-deva",
  weight: "400",
  display: "swap",
});

// Anti-FOUC theme bootstrap. Default is LIGHT. An explicit user toggle saved in
// localStorage (`dpdp-theme`, shared with the reused widgets) still wins.
const THEME_INIT = `(function(){try{var t=localStorage.getItem("dpdp-theme");if(t!=="light"&&t!=="dark"){t="light";}document.documentElement.setAttribute("data-theme",t);}catch(e){}})();`;

// Trim bulky saved state before React hydrates so a full storage quota does not
// break client widgets (nav menus, language picker, etc.).
const STORAGE_INIT = `(function(){try{var c=localStorage.getItem("dpdp-lexbot-chat");if(c&&c.length>48000){try{var m=JSON.parse(c);localStorage.setItem("dpdp-lexbot-chat",JSON.stringify(Array.isArray(m)?m.slice(-20):[]));}catch(e){localStorage.removeItem("dpdp-lexbot-chat");}}try{localStorage.setItem("__dpdp_q__","1");localStorage.removeItem("__dpdp_q__");}catch(e){["dpdp-lexbot-chat","dpdp-risk-v1","dpdp-quiz-best","dpdp-progress"].forEach(function(k){try{localStorage.removeItem(k);}catch(x){}});}}catch(e){}})();`;

// Anti-FOUC accessibility bootstrap. Applies saved (or default) a11y prefs
// before first paint so high contrast / larger text don't flash in. The inline
// defaults must match DEFAULTS + STORAGE_KEY in components/site/A11yToolbar.tsx.
const A11Y_INIT = `(function(){try{var d={textSize:0,lineSpacing:0,contrast:true,dyslexic:false,motion:false,underline:false,focusMode:false};var raw=localStorage.getItem("dpdp-a11y-v4");var p=raw?Object.assign({},d,JSON.parse(raw)):d;var el=document.documentElement;if(p.contrast)el.classList.add("a11y-contrast");if(p.dyslexic)el.classList.add("a11y-dyslexic");if(p.motion)el.classList.add("a11y-no-motion");if(p.underline)el.classList.add("a11y-underline");if(p.lineSpacing===1)el.classList.add("a11y-line-relaxed");if(p.lineSpacing===2)el.classList.add("a11y-line-loose");if(p.focusMode)el.classList.add("a11y-focus-mode");var sc=[1,1.12,1.25][p.textSize]||1;el.style.setProperty("--a11y-text-scale",String(sc));}catch(e){}})();`;

// Anti-FOUC reading-mode bootstrap. Applies the saved "Easy read" preference to
// <html data-reading> before first paint so plain-language content swaps don't
// flash. Default is "normal". Key is shared with components/site/ReadingMode.tsx.
const READING_INIT = `(function(){try{var m=localStorage.getItem("dpdp-reading");if(m!=="easy"&&m!=="normal"){m="normal";}document.documentElement.setAttribute("data-reading",m);}catch(e){document.documentElement.setAttribute("data-reading","normal");}})();`;

export const metadata: Metadata = {
  metadataBase: new URL("https://truststack.in"),
  title: {
    default:
      "TrustStack - DPDP Act 2023 & DPDP Rules 2025, made operational",
    template: "%s | TrustStack",
  },
  description:
    "A clear, modern home for India's Digital Personal Data Protection Act, 2023 and DPDP Rules 2025 - sections, rules, templates, case laws, learning and compliance tools.",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon", type: "image/png", sizes: "32x32" },
    ],
    apple: "/favicon.svg",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale();
  const messages = await getMessages();
  const dir = isRTL(locale as Locale) ? "rtl" : "ltr";

  return (
    <html
      lang={locale}
      dir={dir}
      data-theme="light"
      data-reading="normal"
      data-scroll-behavior="smooth"
      data-i18n-locale={locale}
      data-i18n-catalog={locale === "en" ? "native" : "loading"}
      data-env={process.env.NODE_ENV}
      suppressHydrationWarning
      className={`${display.variable} ${sans.variable} ${mono.variable} ${deva.variable}`}
    >
      <head>
        {locale !== "en" && (
          <link
            rel="preload"
            href={`/i18n/site/${locale}.json`}
            as="fetch"
            crossOrigin="anonymous"
          />
        )}
        <script dangerouslySetInnerHTML={{ __html: STORAGE_INIT }} />
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
        <script dangerouslySetInnerHTML={{ __html: A11Y_INIT }} />
        <script dangerouslySetInnerHTML={{ __html: READING_INIT }} />
      </head>
      <body>
        <SecurityWrapper />
        <Providers>
          <NextIntlClientProvider locale={locale} messages={messages}>
            <EasyTextRuntime />
            {locale !== "en" && <LocaleTextRuntime locale={locale as Locale} />}
            <SiteFrame>{children}</SiteFrame>
          </NextIntlClientProvider>
        </Providers>
      </body>
    </html>
  );
}
