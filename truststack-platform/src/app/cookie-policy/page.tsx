import Link from "next/link";
import { Shield } from "lucide-react";

export const metadata = {
  title: "Cookie Policy | Anix AI TrustStack™",
  description: "Cookie Policy for the Anix AI TrustStack™ website — what cookies we use and how to manage them under DPDP Act 2023.",
};

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-white">

      <div className="bg-brand-navy text-white py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-4">
            <Link href="/" className="flex items-center gap-2 text-white/80 hover:text-white transition-colors">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <span className="font-display font-bold text-sm">TrustStack™ by Anix AI</span>
            </Link>
          </div>
          <h1 className="font-display font-bold text-3xl sm:text-4xl text-white mb-2">Cookie Policy</h1>
          <p className="text-white/70 text-sm">Last updated: 15 June 2026 · Effective: 15 June 2026</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        <div className="card-brand p-5 mb-10">
          <p className="text-xs font-bold text-brand-navy uppercase tracking-wider mb-2">DPDP Compliance — Cookie Consent</p>
          <p className="text-sm text-text-secondary leading-relaxed">
            Under the <strong className="text-text-primary">Digital Personal Data Protection Act 2023</strong>, we are required to obtain your
            explicit, free, specific, informed, and unambiguous consent before placing non-essential cookies on your device.
            We only place analytics and marketing cookies after you click &ldquo;Accept&rdquo; on our cookie banner.
          </p>
        </div>

        <div className="legal-prose">

          <h2>1. What Are Cookies?</h2>
          <p>
            Cookies are small text files placed on your device when you visit a website. They help websites remember your
            preferences, improve performance, and (with consent) collect usage analytics. Cookies may be session-based
            (deleted when you close your browser) or persistent (stored for a set period).
          </p>

          <h2>2. Cookies We Use</h2>

          <h3>2.1 Strictly Necessary Cookies</h3>
          <p>
            These cookies are essential for the website to function. They cannot be disabled and do not require your consent
            under the DPDP Act 2023 as they serve no purpose other than enabling core functionality.
          </p>

          <div className="not-prose overflow-x-auto my-4">
            <table className="w-full text-xs border border-border rounded-xl overflow-hidden">
              <thead className="bg-surface-secondary">
                <tr>
                  {["Cookie Name", "Purpose", "Duration", "Provider"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 font-semibold text-text-muted">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ["anixai_cookie_consent", "Stores your cookie consent choices", "12 months", "Anix AI (first-party)"],
                  ["__session", "Maintains authenticated platform sessions", "Session", "Anix AI (first-party)"],
                ].map((row, i) => (
                  <tr key={i} className={`border-t border-border ${i % 2 === 0 ? "bg-white" : "bg-surface-secondary/40"}`}>
                    {row.map((cell, j) => (
                      <td key={j} className="px-4 py-3 text-text-secondary font-mono text-[11px]">{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h3>2.2 Analytics Cookies (Consent Required)</h3>
          <p>
            These cookies help us understand how visitors interact with our website. We only activate these cookies
            after you provide explicit consent via the cookie banner.
          </p>

          <div className="not-prose overflow-x-auto my-4">
            <table className="w-full text-xs border border-border rounded-xl overflow-hidden">
              <thead className="bg-surface-secondary">
                <tr>
                  {["Cookie Name", "Purpose", "Duration", "Provider"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 font-semibold text-text-muted">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ["_ga", "Distinguishes unique website visitors", "2 years", "Google Analytics"],
                  ["_ga_*", "Maintains session state for Google Analytics", "2 years", "Google Analytics"],
                ].map((row, i) => (
                  <tr key={i} className={`border-t border-border ${i % 2 === 0 ? "bg-white" : "bg-surface-secondary/40"}`}>
                    {row.map((cell, j) => (
                      <td key={j} className="px-4 py-3 text-text-secondary font-mono text-[11px]">{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h3>2.3 Marketing Cookies (Consent Required)</h3>
          <p>
            Marketing cookies track visitors across websites to display relevant advertisements. We only use these after
            your explicit consent, and only where specifically necessary for campaign tracking.
          </p>

          <h2>3. How to Manage Your Consent</h2>
          <ul>
            <li><strong>Cookie Banner:</strong> When you first visit our website, a cookie consent banner allows you to Accept All, Reject Non-Essential, or customise your preferences.</li>
            <li><strong>Change Preferences:</strong> You may change your cookie preferences at any time by clearing your browser&apos;s local storage and revisiting our website — the banner will reappear.</li>
            <li><strong>Browser Settings:</strong> You can also manage cookies through your browser settings (Chrome, Firefox, Safari, Edge all support cookie management). Note: disabling all cookies may break website functionality.</li>
          </ul>

          <h2>4. Your Rights Under DPDP Act 2023</h2>
          <p>
            Cookies that collect personal data (such as analytics cookies that track your IP address or behaviour) are
            subject to the DPDP Act 2023. You have the right to:
          </p>
          <ul>
            <li>Withdraw consent to analytics and marketing cookies at any time</li>
            <li>Request access to or erasure of data collected via cookies</li>
            <li>Lodge a grievance with our Grievance Officer</li>
          </ul>
          <p>
            Contact: <a href="mailto:privacy@anixai.io">privacy@anixai.io</a> ·
            Grievance Officer: <a href="mailto:grievance@anixai.io">grievance@anixai.io</a>
          </p>

          <h2>5. Third-Party Cookies</h2>
          <p>
            Analytics cookies (Google Analytics) are set by Google LLC, a third-party service. When analytics consent is
            given, data may be transferred to Google servers. We have configured Google Analytics with IP anonymisation
            where possible.
          </p>

          <h2>6. Cross-Border Data Transfer via Cookies</h2>
          <p>
            Analytics cookies may transfer data outside India (to Google servers in the US). Such transfers occur only
            with your consent and are subject to adequate safeguards. Strictly necessary first-party cookies do not
            involve cross-border transfers.
          </p>

          <h2>7. Updates to This Policy</h2>
          <p>
            We may update this Cookie Policy as we change our cookie usage or as the law requires. When we make material
            changes, we will update the &ldquo;Last updated&rdquo; date and re-display the cookie consent banner to collect
            fresh consent where needed.
          </p>

          <h2>8. Contact</h2>
          <p>
            For cookie-related enquiries, email <a href="mailto:privacy@anixai.io">privacy@anixai.io</a>.
          </p>
        </div>

        <div className="mt-10 pt-6 border-t border-border flex flex-wrap items-center gap-4 text-sm text-text-muted">
          <Link href="/" className="text-brand-blue hover:underline">← Back to Home</Link>
          <Link href="/privacy-policy" className="text-brand-blue hover:underline">Privacy Policy</Link>
          <Link href="/terms" className="text-brand-blue hover:underline">Terms of Service</Link>
        </div>
      </div>
    </div>
  );
}
