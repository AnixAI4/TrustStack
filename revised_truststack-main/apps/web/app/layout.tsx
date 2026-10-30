import type { Metadata } from "next";
// Self-hosted fonts (no font CDN at runtime — a client-hosted install works offline).
import "@fontsource-variable/inter/wght.css";
import "@fontsource-variable/plus-jakarta-sans/wght.css";
import "./globals.css";

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_APP_NAME ?? "TrustStack DPDP Compass",
  description: "DPDP readiness assessment for Indian organisations.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN">
      <body className="min-h-screen bg-surface-page font-sans text-ink antialiased">{children}</body>
    </html>
  );
}
