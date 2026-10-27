import Link from "next/link";
import { Shield } from "lucide-react";

export const metadata = {
  title: "Privacy Policy | Anix AI TrustStack™",
  description: "Privacy Policy of Anix AI LLP — how we collect, process, and protect your personal data under the Digital Personal Data Protection Act 2023.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white">

      {/* Header */}
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
          <h1 className="font-display font-bold text-3xl sm:text-4xl text-white mb-2">Privacy Policy</h1>
          <p className="text-white/70 text-sm">Last updated: 15 June 2026 · Effective: 15 June 2026</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* DPDP Notice Box */}
        <div className="card-brand p-5 mb-10">
          <p className="text-xs font-bold text-brand-navy uppercase tracking-wider mb-2">DPDP Compliance Statement</p>
          <p className="text-sm text-text-secondary leading-relaxed">
            This Privacy Policy is published in compliance with the <strong className="text-text-primary">Digital Personal Data Protection Act 2023 (DPDP Act)</strong> and
            DPDP Rules 2025 notified on January 3, 2025. Anix AI LLP acts as a <strong className="text-text-primary">Data Fiduciary</strong> in
            respect of personal data collected through this website and our services.
          </p>
        </div>

        <div className="legal-prose">

          <h2>1. Who We Are</h2>
          <p>
            <strong>Anix AI LLP</strong> (hereinafter &ldquo;Anix AI&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;) is a limited liability
            partnership registered in India, operating the TrustStack™ DPDP compliance platform and advisory services.
          </p>
          <ul>
            <li><strong>Registered Office:</strong> Mumbai, Maharashtra, India</li>
            <li><strong>Email:</strong> <a href="mailto:privacy@anixai.io">privacy@anixai.io</a></li>
            <li><strong>Grievance Officer Email:</strong> <a href="mailto:grievance@anixai.io">grievance@anixai.io</a></li>
          </ul>

          <h2>2. Personal Data We Collect</h2>
          <p>We collect the following categories of personal data:</p>
          <ul>
            <li><strong>Contact Enquiry Data:</strong> Name, work email address, phone number, company name, organization size, service of interest, and any message you submit via our contact form.</li>
            <li><strong>TrustChat™ Conversation Data:</strong> Questions and messages submitted to our AI chatbot. Do not submit sensitive personal data (financial, health, Aadhaar, etc.) in the chatbot.</li>
            <li><strong>Usage Data:</strong> Browser type, IP address, pages visited, time spent — collected via strictly necessary and (with your consent) analytics cookies.</li>
            <li><strong>Platform Users:</strong> For registered TrustStack Platform™ users — name, business email, organization details, and compliance data entered into the platform.</li>
          </ul>

          <h2>3. Purpose and Legal Basis of Processing</h2>
          <p>We process your personal data for the following purposes:</p>
          <ul>
            <li><strong>Responding to Enquiries:</strong> With your explicit consent given via the contact form.</li>
            <li><strong>Providing Services:</strong> Fulfilment of a contract or pre-contractual steps at your request.</li>
            <li><strong>TrustChat™ AI Responses:</strong> To provide AI-powered DPDP guidance (legitimate interest + your voluntary interaction).</li>
            <li><strong>Website Analytics:</strong> Only with your explicit cookie consent.</li>
            <li><strong>Legal Compliance:</strong> To comply with applicable Indian laws and regulations.</li>
          </ul>
          <p>
            We do <strong>not</strong> process personal data for automated decision-making that produces legal or significant effects without human review.
          </p>

          <h2>4. Consent and Withdrawal</h2>
          <p>
            Where we rely on consent as the legal basis for processing, your consent is:
          </p>
          <ul>
            <li><strong>Freely given</strong> — not bundled with service delivery or made a condition of use</li>
            <li><strong>Specific</strong> — obtained for clearly defined purposes</li>
            <li><strong>Informed</strong> — full details provided in this Policy</li>
            <li><strong>Unambiguous</strong> — obtained via explicit checkbox (not pre-ticked)</li>
          </ul>
          <p>
            You may <strong>withdraw your consent</strong> at any time by emailing{" "}
            <a href="mailto:privacy@anixai.io">privacy@anixai.io</a>. Withdrawal does not affect the lawfulness of
            processing carried out before withdrawal. We will action withdrawal requests within 72 hours.
          </p>

          <h2>5. Your Rights as a Data Principal</h2>
          <p>Under the DPDP Act 2023, you have the following rights:</p>
          <ul>
            <li id="rights"><strong>Right to Access:</strong> Obtain a summary of your personal data we hold and how it has been processed.</li>
            <li><strong>Right to Correction:</strong> Correct any inaccurate or incomplete personal data.</li>
            <li><strong>Right to Erasure:</strong> Request deletion of your personal data where we no longer have a legitimate basis to retain it.</li>
            <li><strong>Right to Grievance Redressal:</strong> Lodge a complaint with our Grievance Officer (see Section 9 below).</li>
            <li><strong>Right to Nominate:</strong> Nominate another individual to exercise rights on your behalf in the event of your death or incapacity.</li>
          </ul>
          <p>
            To exercise any of these rights, email <a href="mailto:privacy@anixai.io">privacy@anixai.io</a> with subject line
            &ldquo;DPDP Rights Request&rdquo;. We will respond within <strong>72 hours</strong> of receipt.
          </p>

          <h2>6. Data Retention</h2>
          <ul>
            <li><strong>Contact enquiry data:</strong> Retained for 24 months from date of submission, or until the purpose is fulfilled, whichever is earlier.</li>
            <li><strong>Platform data:</strong> Retained for the duration of the service agreement + 12 months, unless a longer retention period is required by law.</li>
            <li><strong>Cookie / usage data:</strong> Up to 13 months from collection.</li>
          </ul>
          <p>
            After the retention period, personal data is securely deleted or anonymised.
          </p>

          <h2>7. Data Sharing and Processors</h2>
          <p>We do <strong>not</strong> sell your personal data. We share data only with:</p>
          <ul>
            <li><strong>Anthropic PBC</strong> (AI API provider for TrustChat™) — under a Data Processing Agreement</li>
            <li><strong>Vercel Inc.</strong> (hosting provider) — for website delivery</li>
            <li><strong>Analytics provider</strong> (if you consent to analytics cookies)</li>
            <li><strong>Legal or regulatory authorities</strong> — where required by Indian law</li>
          </ul>
          <p>All processors are bound by contractual obligations to protect your data consistent with this Policy.</p>

          <h2>8. Cross-Border Data Transfers</h2>
          <p>
            TrustChat™ uses Anthropic&apos;s API, which may process data outside India. Such transfers occur only pursuant to
            adequate data transfer safeguards as may be specified by the Central Government under the DPDP Act.
            We maintain contractual protections with Anthropic governing such processing.
          </p>

          <h2>9. Grievance Officer</h2>
          <div id="grievance" className="not-prose bg-surface-secondary border border-border rounded-xl p-5 my-4">
            <p className="text-sm font-bold text-text-primary mb-2">Designated Grievance Officer</p>
            <p className="text-sm text-text-secondary">
              <strong>Anix AI LLP</strong><br />
              Mumbai, Maharashtra, India<br />
              Email: <a href="mailto:grievance@anixai.io" className="text-brand-blue hover:underline">grievance@anixai.io</a><br />
              Response time: Within 48 hours (as required under DPDP Rule 12)
            </p>
            <p className="text-xs text-text-muted mt-3">
              If you are unsatisfied with our response, you may approach the{" "}
              <strong>Data Protection Board of India (DPBI)</strong> once constituted.
            </p>
          </div>

          <h2>10. Security Safeguards</h2>
          <p>
            We implement appropriate technical and organisational security measures in accordance with Rule 6 of the DPDP Rules 2025,
            including encryption in transit (TLS 1.3), access controls, and regular security reviews. In the event of a personal data
            breach, we will notify affected Data Principals and the DPBI within <strong>72 hours</strong> as required by Rule 7.
          </p>

          <h2>11. Children&apos;s Data</h2>
          <p>
            Our services are not directed at individuals under 18 years of age. We do not knowingly collect personal data
            from children. If you believe a child has submitted personal data to us, please contact us immediately at
            <a href="mailto:privacy@anixai.io"> privacy@anixai.io</a>.
          </p>

          <h2>12. AI-Generated Content Disclaimer</h2>
          <p>
            TrustChat™ uses an AI language model to generate responses. AI-generated content is for general informational
            purposes only and does not constitute legal advice. Do not submit sensitive personal data (Aadhaar, PAN, financial
            information, health data) to TrustChat™.
          </p>

          <h2>13. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy to reflect changes in our practices or applicable law. We will notify registered
            users via email and update the &ldquo;Last updated&rdquo; date above. Continued use of our website after such changes
            constitutes acceptance of the updated Policy.
          </p>

          <h2>14. Contact</h2>
          <p>
            For any privacy-related questions or to exercise your rights, contact us at{" "}
            <a href="mailto:privacy@anixai.io">privacy@anixai.io</a>.
          </p>
        </div>

        <div className="mt-10 pt-6 border-t border-border flex flex-wrap items-center gap-4 text-sm text-text-muted">
          <Link href="/" className="text-brand-blue hover:underline">← Back to Home</Link>
          <Link href="/terms" className="text-brand-blue hover:underline">Terms of Service</Link>
          <Link href="/cookie-policy" className="text-brand-blue hover:underline">Cookie Policy</Link>
        </div>
      </div>
    </div>
  );
}
