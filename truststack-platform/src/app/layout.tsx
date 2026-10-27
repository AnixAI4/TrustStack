import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/ui/ThemeProvider";

export const metadata: Metadata = {
  title: {
    default: "TrustStack™ — DPDP-ready. AI-ready. Trust-ready.",
    template: "%s | TrustStack™",
  },
  description:
    "India's most advanced DPDP compliance platform. Penalties up to ₹250 Crore. Directors personally liable. DPDP Rules already in force. Get DPDP-ready, AI-ready, and breach-ready with Anix AI TrustStack™.",
  keywords: [
    "DPDP compliance India", "DPDPA 2023", "data protection India",
    "DPDP Rules 2025", "DPDP consultant", "data privacy India",
    "DPO as a service", "AI governance India", "DPDP audit",
    "personal data protection", "Anix AI", "TrustStack",
  ],
  authors: [{ name: "TrustStack", url: "https://truststack.co.in/" }],
  creator: "TrustStack",
  openGraph: {
    type: "website", locale: "en_IN", url: "https://truststack.co.in/",
    siteName: " TrustStack™",
    title: " TrustStack™ — India's #1 DPDP Compliance Platform",
    description: "DPDP Rules are already in force. Penalties up to ₹250 Crore. Directors personally liable. Get compliant in 90 days with India's most advanced DPDP + AI governance platform.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: " TrustStack" }],
  },
  twitter: {
    card: "summary_large_image",
    title: " TrustStack™ — DPDP-ready. AI-ready. Trust-ready.",
    description: "India's #1 DPDP compliance platform. ₹250 Crore penalty risk. Get compliant in 90 days.",
    images: ["/og-image.png"],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#003366",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Prevent flash of wrong theme on first paint */}
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('anixai-theme');var p=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';if(t==='dark'||(t===null&&p==='dark')){document.documentElement.classList.add('dark')}}catch(e){}})();` }} />
      </head>
      <body className="antialiased min-h-screen font-sans">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
