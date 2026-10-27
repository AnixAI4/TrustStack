import { Shield, Linkedin, Twitter, Youtube, Mail, Phone } from "lucide-react";
import Link from "next/link";

const SERVICES = [
  { label: "DPDP Ignite™ Workshop",           href: "#services" },
  { label: "DPDP Compass™ Assessment",         href: "#services" },
  { label: "DPDP Build™ Implementation",       href: "#services" },
  { label: "AI Privacy Shield™",               href: "#services" },
  { label: "DPDP TrustOps™ Managed Service",  href: "#services" },
  { label: "TrustStack Platform™",             href: "#services" },
  { label: "CDPP Certification™",              href: "#services" },
];

const LEGAL = [
  { label: "Privacy Policy",    href: "/privacy-policy" },
  { label: "Terms of Service",  href: "/terms" },
  { label: "Cookie Policy",     href: "/cookie-policy" },
  { label: "Grievance Officer", href: "/privacy-policy#grievance" },
  { label: "Data Principal Rights", href: "/privacy-policy#rights" },
];

const COMPANY = [
  { label: "About Anix AI",      href: "#about" },
  { label: "7D Framework™",      href: "#framework" },
  { label: "Industries",         href: "#industries" },
  { label: "Contact Us",         href: "#contact" },
  { label: "DPDP Risk Check",    href: "#risk-check" },
];

const SOCIAL = [
  { icon: Linkedin, label: "LinkedIn", href: "#" },
  { icon: Twitter,  label: "Twitter",  href: "#" },
  { icon: Youtube,  label: "YouTube",  href: "#" },
];

export default function Footer() {
  return (
    <footer className="bg-brand-navy-dark text-white">

      {/* Main grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-10">

          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#2563EB,#1D4ED8)" }}>
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-display font-bold text-base text-white">TrustStack™</span>
                <span className="block text-[10px] text-white/50 -mt-0.5">by Anix AI LLP</span>
              </div>
            </div>
            <p className="text-sm text-white/60 leading-relaxed mb-5 max-w-xs">
              India&apos;s most comprehensive DPDP compliance platform — combining expert consulting, AI governance,
              and SaaS operations in one stack.
            </p>
            <div className="flex items-center gap-2 mb-2">
              <Mail className="w-3.5 h-3.5 text-white/40 flex-shrink-0" />
              <a href="mailto:hello@anixai.io" className="text-xs text-white/60 hover:text-white transition-colors">hello@anixai.io</a>
            </div>
            <div className="flex items-center gap-2 mb-5">
              <Phone className="w-3.5 h-3.5 text-white/40 flex-shrink-0" />
              <a href="tel:+919876543210" className="text-xs text-white/60 hover:text-white transition-colors">+91 98765 43210</a>
            </div>
            <div className="flex items-center gap-2">
              {SOCIAL.map(({ icon: Icon, label, href }) => (
                <a key={label} href={href} aria-label={label}
                  className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                  <Icon className="w-3.5 h-3.5 text-white/70" />
                </a>
              ))}
            </div>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white/40 mb-4">Services</h4>
            <ul className="space-y-2.5">
              {SERVICES.map(({ label, href }) => (
                <li key={label}>
                  <a href={href} className="text-xs text-white/60 hover:text-white transition-colors">{label}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white/40 mb-4">Company</h4>
            <ul className="space-y-2.5">
              {COMPANY.map(({ label, href }) => (
                <li key={label}>
                  <a href={href} className="text-xs text-white/60 hover:text-white transition-colors">{label}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white/40 mb-4">Legal &amp; Privacy</h4>
            <ul className="space-y-2.5">
              {LEGAL.map(({ label, href }) => (
                <li key={label}>
                  <Link href={href} className="text-xs text-white/60 hover:text-white transition-colors">{label}</Link>
                </li>
              ))}
            </ul>
            <div className="mt-5 p-3 rounded-lg bg-white/5 border border-white/10">
              <p className="text-[10px] text-white/50 leading-relaxed">
                <strong className="text-white/70">Grievance Officer</strong><br />
                Anix AI LLP · Mumbai, Maharashtra<br />
                <a href="mailto:grievance@anixai.io" className="hover:text-white/80 underline">grievance@anixai.io</a><br />
                Response within 48 hours (DPDP Rule 12)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* DPDP Compliance Strip */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="bg-white/5 rounded-xl px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-6">
            <Shield className="w-4 h-4 text-brand-blue flex-shrink-0" />
            <p className="text-[11px] text-white/50 leading-relaxed">
              <strong className="text-white/70">DPDP Compliance Notice:</strong>{" "}
              This website is operated by Anix AI LLP and is itself designed to be compliant with the Digital Personal Data
              Protection Act 2023 and DPDP Rules 2025. We collect personal data only with your explicit consent and for
              specified purposes. You may exercise your rights (access, correction, erasure, grievance) at any time.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[11px] text-white/40">
            © {new Date().getFullYear()} Anix AI LLP. All rights reserved.
            TrustStack™ and Anix 7D Framework™ are trademarks pending.
          </p>
          <div className="flex items-center gap-4">
            <Link href="/privacy-policy" className="text-[11px] text-white/40 hover:text-white/70 transition-colors">Privacy</Link>
            <Link href="/terms"          className="text-[11px] text-white/40 hover:text-white/70 transition-colors">Terms</Link>
            <Link href="/cookie-policy"  className="text-[11px] text-white/40 hover:text-white/70 transition-colors">Cookies</Link>
            <span className="text-[11px] text-white/30 hidden sm:inline">Made in India 🇮🇳</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
