"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { CookieConsent } from "./CookieConsent";
import { ScrollProgress } from "./ScrollProgress";
import { RouteLoader } from "./RouteLoader";
import { ReadingModeProvider } from "./ReadingMode";
import { SiteSettingsMenu } from "./SiteSettingsMenu";
import { LexBotLauncher } from "./LexBotLauncher";
import { rememberPlatformReturnPath } from "@/lib/platform-return";

const BackToTop = dynamic(() => import("./BackToTop").then((m) => m.BackToTop), {
  ssr: false,
});
// Renders the site chrome (header, footer, widgets) around every page - except
// distraction-free surfaces: exam, welcome gate, and auth flow.
export function SiteFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Remember the last normal TrustStack page so /trustdeck can send users back.
  useEffect(() => {
    rememberPlatformReturnPath(pathname);
  }, [pathname]);

  const bare =
    pathname?.startsWith("/certification/exam") ||
    pathname === "/welcome" ||
    pathname?.startsWith("/auth") ||
    pathname === "/subscribe";

  // The authenticated platform owns its compact product chrome. Public portals
  // retain the main TrustStack site header.
  const isPlatform =
    pathname === "/trustdeck" || pathname?.startsWith("/trustdeck/");
  const isPlatformPublic = pathname?.startsWith("/trustdeck/public");
  const hideFooter = isPlatform || isPlatformPublic;
  // Authenticated platform app (not public portals): hide decorative chrome that
  // leaves empty dead space under short pages.
  const isPlatformApp = isPlatform && !isPlatformPublic;

  if (bare) {
    return (
      <ReadingModeProvider>
        {children}
        <div className="fixed bottom-4 end-4 z-[60]">
          <SiteSettingsMenu up />
        </div>
      </ReadingModeProvider>
    );
  }

  return (
    <ReadingModeProvider>
      <a
        href="#main-content"
        className="skip-link"
      >
        Skip to main content
      </a>
      {!isPlatformApp && (
        <div className="chakra-clip" aria-hidden>
          <div className="chakra-clip__wheel" />
        </div>
      )}
      <RouteLoader />
      {!isPlatformApp && <ScrollProgress />}
      {!isPlatformApp && <Header />}
      <main
        id="main-content"
        className={isPlatformApp ? "overflow-x-clip" : "site-main-offset overflow-x-clip"}
      >
        {children}
      </main>
      {!hideFooter && <Footer />}
      <CookieConsent />
      {!isPlatform && <BackToTop />}
      {!isPlatform && <LexBotLauncher />}
    </ReadingModeProvider>
  );
}
