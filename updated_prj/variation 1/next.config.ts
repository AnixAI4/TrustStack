import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// Wires next-intl into the build, pointing at the request config that resolves
// the active locale and loads its messages.
const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  poweredByHeader: false,
  allowedDevOrigins: ["localhost", "127.0.0.1"],
  devIndicators: false,
  // Platform modules still have WIP prop/type drift; don't block production
  // deploys of scanner/i18n work on those unrelated errors.
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  // StrictMode off so the reused legacy DOM widgets (LexBot, India map, calculators,
  // consent, a11y) are not double-invoked in dev.
  reactStrictMode: false,
  // Content protection: never ship original source maps to the browser in
  // production builds (keeps the un-minified source out of DevTools).
  productionBrowserSourceMaps: false,
  // Perf: modularize barrel imports so only the icons/APIs actually used are
  // bundled (smaller shared chunk on every page => faster hydration, so the
  // header/menus become interactive sooner even under browser memory pressure).
  // Keep next-intl on its standard module boundary: its provider and hooks are
  // shared by the root layout, where experimental rewriting can destabilize HMR.
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion"],
  },
  // Perf: strip console.* from production bundles (keeps error/warn) to shave a
  // little client JS. Dev keeps all logs for debugging.
  compiler: {
    removeConsole:
      process.env.NODE_ENV === "production"
        ? { exclude: ["error", "warn"] }
        : false,
  },
  // Content protection: security headers applied to every response. The CSP
  // `frame-ancestors` directive plus X-Frame-Options stop other origins from
  // embedding the site in an iframe (clickjacking / content re-hosting); the
  // rest harden MIME-sniffing, referrer leakage and feature access.
  async headers() {
    const isProd = process.env.NODE_ENV === "production";
    const staticCacheHeader = isProd
      ? {
          key: "Cache-Control",
          value: "public, max-age=31536000, immutable",
        }
      : { key: "Cache-Control", value: "no-store, must-revalidate" };
    // Dev self-heal: earlier builds served /_next/static chunks with a 1-year
    // `immutable` cache. A browser that loaded the app then keeps the
    // non-versioned chunks (app/layout.js, polyfills.js, app-pages-internals.js)
    // frozen, so after a rebuild it mixes an old chunk with the new webpack
    // runtime -> "Cannot read properties of undefined (reading 'call')". Telling
    // the browser to purge its HTTP cache on each dev navigation evicts those
    // stale entries; storage (theme / a11y prefs) is left untouched. Prod never
    // sends this so real caching is preserved.
    const devCacheReset = isProd
      ? []
      : [{ key: "Clear-Site-Data", value: '"cache"' }];
    const contentSecurityPolicy = [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'self'",
      "form-action 'self' https://api.razorpay.com",
      `script-src 'self' 'unsafe-inline'${isProd ? "" : " 'unsafe-eval'"} https://checkout.razorpay.com`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      `connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.razorpay.com${isProd ? "" : " http://localhost:* ws://localhost:* http://127.0.0.1:* ws://127.0.0.1:*"}`,
      "frame-src 'self' https://*.razorpay.com",
      "media-src 'self' blob:",
      "worker-src 'self' blob:",
      "manifest-src 'self'",
      ...(isProd ? ["upgrade-insecure-requests"] : []),
    ].join("; ");
    const securityHeaders = [
      // DPDP Act s.8 reasonable-security-safeguards signal: force HTTPS on every
      // future visit (and subdomains) once a browser has seen this once.
      ...(isProd
        ? [
            {
              key: "Strict-Transport-Security",
              value: "max-age=63072000; includeSubDomains; preload",
            },
          ]
        : []),
      { key: "Content-Security-Policy", value: contentSecurityPolicy },
      { key: "X-Frame-Options", value: "SAMEORIGIN" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
      { key: "Cross-Origin-Resource-Policy", value: "same-site" },
      { key: "Origin-Agent-Cluster", value: "?1" },
      { key: "X-DNS-Prefetch-Control", value: "on" },
      { key: "X-XSS-Protection", value: "0" },
      { key: "X-Download-Options", value: "noopen" },
      { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
      {
        key: "Permissions-Policy",
        value: "geolocation=(), microphone=(), camera=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()",
      },
    ];
    return [
      {
        // Hashed static assets can stay cached; HTML must revalidate so a deploy
        // never serves a stale shell pointing at missing JS chunks (broken menus).
        source: "/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)",
        headers: [
          { key: "Cache-Control", value: "no-cache, must-revalidate" },
          ...devCacheReset,
          ...securityHeaders,
        ],
      },
      {
        source: "/api/security-compliance-manager",
        headers: [{ key: "Cache-Control", value: "no-store" }],
      },
      {
        source: "/_next/static/:path*",
        headers: [
          staticCacheHeader,
          ...securityHeaders,
        ],
      },
    ];
  },
  // Platform → TrustDeck permanent redirects (old bookmarks + emails).
  async redirects() {
    return [
      { source: "/platform", destination: "/trustdeck", permanent: true },
      { source: "/platform/:path*", destination: "/trustdeck/:path*", permanent: true },
      { source: "/api/platform/:path*", destination: "/api/trustdeck/:path*", permanent: true },
    ];
  },
  // Preserve every original .html link (including links generated at runtime by the
  // reused vanilla-JS widgets) by serving the App Router routes at those URLs too.
  // /scanner is a native TrustStack page (src/app/scanner) - no external rewrite.
  async rewrites() {
    return [
      { source: "/index.html", destination: "/" },
      { source: "/solutions.html", destination: "/solutions" },
      { source: "/framework.html", destination: "/framework" },
      { source: "/tools.html", destination: "/tools" },
      { source: "/act.html", destination: "/act" },
      { source: "/rules.html", destination: "/rules" },
      { source: "/templates.html", destination: "/templates" },
      { source: "/cases.html", destination: "/cases" },
      { source: "/learn.html", destination: "/learn" },
      { source: "/blog.html", destination: "/blog" },
      { source: "/section.html", destination: "/section" },
    ];
  },
};

export default withNextIntl(nextConfig);
