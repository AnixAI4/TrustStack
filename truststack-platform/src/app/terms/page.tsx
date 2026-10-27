import Link from "next/link";
import { Shield } from "lucide-react";

export const metadata = {
  title: "Terms of Service | Anix AI TrustStack™",
  description: "Terms of Service for Anix AI LLP TrustStack™ platform and advisory services.",
};

export default function TermsPage() {
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
          <h1 className="font-display font-bold text-3xl sm:text-4xl text-white mb-2">Terms of Service</h1>
          <p className="text-white/70 text-sm">Last updated: 15 June 2026 · Effective: 15 June 2026</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="legal-prose">

          <h2>1. Agreement to Terms</h2>
          <p>
            By accessing or using the TrustStack™ website (<strong>anixai.io</strong>) and services operated by
            <strong> Anix AI LLP</strong> (&ldquo;Anix AI&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;), you agree to be bound
            by these Terms of Service (&ldquo;Terms&rdquo;). If you do not agree, please do not use our services.
          </p>

          <h2>2. Description of Services</h2>
          <p>Anix AI provides:</p>
          <ul>
            <li>DPDP compliance consulting and advisory services</li>
            <li>TrustStack Platform™ — a SaaS compliance management system</li>
            <li>TrustChat™ — an AI-powered DPDP information chatbot</li>
            <li>Training, certification (CDPP), and managed compliance services</li>
          </ul>
          <p>
            All services are subject to separate engagement agreements, statements of work, or platform subscription agreements
            that supplement these Terms.
          </p>

          <h2>3. Not Legal Advice</h2>
          <p>
            <strong>Important:</strong> Content on this website and responses from TrustChat™ are for general informational
            purposes only. Nothing on this website constitutes legal advice. You should consult a qualified legal professional
            for advice specific to your situation. Anix AI is not a law firm and does not provide legal services.
          </p>

          <h2>4. AI Chatbot — TrustChat™</h2>
          <ul>
            <li>TrustChat™ is powered by an AI language model and may produce inaccurate or incomplete information.</li>
            <li>Do not submit sensitive personal data (Aadhaar, PAN, financial information, health data) to TrustChat™.</li>
            <li>AI responses do not substitute for professional DPDP compliance advice.</li>
            <li>Anix AI reserves the right to review conversations to improve service quality, subject to our Privacy Policy.</li>
          </ul>

          <h2>5. Intellectual Property</h2>
          <p>
            All content on this website — including but not limited to the Anix 7D DPDP Framework™, TrustStack™,
            TrustChat™, CDPP Certification™, and all associated branding — is the intellectual property of Anix AI LLP
            (trademarks pending). You may not reproduce, distribute, or use our content without prior written permission.
          </p>

          <h2>6. Contact Form Submissions</h2>
          <p>
            By submitting the contact form, you confirm that you have provided your explicit, informed consent for Anix AI to
            contact you regarding our services. See our <Link href="/privacy-policy">Privacy Policy</Link> for full details
            of how we process your data.
          </p>

          <h2>7. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by Indian law, Anix AI LLP shall not be liable for any indirect, incidental,
            special, consequential, or punitive damages arising from your use of this website or our services. Our total
            liability in any matter shall not exceed the amount paid by you for the specific service giving rise to the claim.
          </p>

          <h2>8. Disclaimers</h2>
          <ul>
            <li>This website is provided &ldquo;as is&rdquo; without warranties of any kind.</li>
            <li>We do not warrant that the website will be uninterrupted, error-free, or free of viruses.</li>
            <li>DPDP compliance outcomes depend on the implementation actions taken by you.</li>
          </ul>

          <h2>9. Governing Law and Jurisdiction</h2>
          <p>
            These Terms shall be governed by and construed in accordance with the laws of India. Any disputes shall be
            subject to the exclusive jurisdiction of the courts at Mumbai, Maharashtra, India.
          </p>

          <h2>10. Changes to Terms</h2>
          <p>
            We may update these Terms at any time. Continued use of the website after changes constitutes acceptance of the
            updated Terms. We will update the &ldquo;Last updated&rdquo; date above when changes are made.
          </p>

          <h2>11. Contact</h2>
          <p>
            For questions about these Terms, contact us at <a href="mailto:legal@anixai.io">legal@anixai.io</a> or write to
            Anix AI LLP, Mumbai, Maharashtra, India.
          </p>
        </div>

        <div className="mt-10 pt-6 border-t border-border flex flex-wrap items-center gap-4 text-sm text-text-muted">
          <Link href="/" className="text-brand-blue hover:underline">← Back to Home</Link>
          <Link href="/privacy-policy" className="text-brand-blue hover:underline">Privacy Policy</Link>
          <Link href="/cookie-policy" className="text-brand-blue hover:underline">Cookie Policy</Link>
        </div>
      </div>
    </div>
  );
}
