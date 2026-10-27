"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { Mail, Phone, MapPin, Send, CheckCircle, Shield, Clock, User } from "lucide-react";

const SERVICES = [
  "DPDP Ignite™ — Executive Workshop",
  "DPDP Compass™ — Readiness Assessment",
  "DPDP Build™ — Implementation",
  "AI Privacy Shield™ — AI Governance",
  "DPDP TrustOps™ — Managed Service",
  "TrustStack Platform™ — SaaS Demo",
  "CDPP Certification™",
  "Corporate Training Program",
  "Custom / Not sure yet",
];

const SIZES = ["1–50 employees", "51–250 employees", "251–1000 employees", "1001–5000 employees", "5000+ employees"];

type FormState = "idle" | "submitting" | "success";

export default function ContactSection() {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.05 });
  const [formState, setFormState] = useState<FormState>("idle");
  const [consentGiven, setConsentGiven] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", company: "", size: "", service: "", message: "" });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consentGiven) return;
    setFormState("submitting");
    await new Promise((r) => setTimeout(r, 1600));
    setFormState("success");
  };

  return (
    <section ref={ref} id="contact" className="section-white py-20 lg:py-28 border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} className="text-center mb-14">
          <p className="section-label mb-3 flex items-center justify-center gap-2"><Mail className="w-3.5 h-3.5" /> Contact Us</p>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-text-primary mt-2 mb-4">
            Start Your <span className="text-gradient-brand">DPDP Journey</span>
          </h2>
          <p className="text-text-secondary text-lg max-w-xl mx-auto">
            Tell us about your organization and we will send you a custom proposal within 24 hours.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-5 gap-8 lg:gap-12">

          {/* Left — info */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={inView ? { opacity: 1, x: 0 } : {}} className="lg:col-span-2 space-y-5">
            <div className="card p-5 space-y-4">
              <h3 className="font-display font-bold text-base text-text-primary">Get in Touch</h3>
              {[
                { icon: Mail,   label: "Email",    value: "hello@anixai.io",          href: "mailto:hello@anixai.io" },
                { icon: Phone,  label: "Phone",    value: "+91 98765 43210",           href: "tel:+919876543210" },
                { icon: MapPin, label: "Location", value: "Mumbai, Maharashtra, India", href: undefined },
              ].map(({ icon: Icon, label, value, href }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-brand-blue-pale flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-brand-navy" />
                  </div>
                  <div>
                    <p className="text-[11px] text-text-muted font-medium">{label}</p>
                    {href ? (
                      <a href={href} className="text-sm text-brand-navy hover:underline font-medium">{value}</a>
                    ) : (
                      <p className="text-sm text-text-secondary">{value}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="card p-5 space-y-3">
              <h3 className="font-semibold text-sm text-text-primary">What happens next?</h3>
              {[
                { icon: Clock,  text: "We review your request within 4 business hours" },
                { icon: User,   text: "A DPDP expert calls you to understand your needs" },
                { icon: Shield, text: "You receive a custom proposal within 24 hours" },
              ].map(({ icon: Icon, text }, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-success-light flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon className="w-3 h-3 text-success-DEFAULT" />
                  </div>
                  <p className="text-xs text-text-secondary">{text}</p>
                </div>
              ))}
            </div>

            <div className="card-brand p-5">
              <p className="text-xs font-semibold text-brand-navy mb-1">DPDP Compliance Notice</p>
              <p className="text-xs text-text-secondary leading-relaxed">
                Your personal data submitted here is processed by Anix AI LLP solely to respond to your enquiry.
                We do not sell or share your data with third parties for marketing. You may exercise your rights under
                DPDP Act 2023 by emailing{" "}
                <a href="mailto:privacy@anixai.io" className="underline text-brand-blue">privacy@anixai.io</a>.
              </p>
            </div>
          </motion.div>

          {/* Right — form */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={inView ? { opacity: 1, x: 0 } : {}} className="lg:col-span-3">
            {formState === "success" ? (
              <div className="card p-10 text-center h-full flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-success-light flex items-center justify-center mb-4">
                  <CheckCircle className="w-8 h-8 text-success-DEFAULT" />
                </div>
                <h3 className="font-display font-bold text-xl text-text-primary mb-2">Thank You!</h3>
                <p className="text-text-secondary text-sm max-w-xs mx-auto">
                  We&apos;ve received your request. Our DPDP expert will reach out within 4 business hours.
                </p>
                <button
                  onClick={() => { setFormState("idle"); setConsentGiven(false); setForm({ name: "", email: "", phone: "", company: "", size: "", service: "", message: "" }); }}
                  className="btn-secondary text-sm mt-6"
                >
                  Submit another request
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="card p-6 lg:p-8 space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1.5">Full Name *</label>
                    <input required value={form.name} onChange={set("name")} placeholder="Rahul Sharma" className="input-base" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1.5">Work Email *</label>
                    <input required type="email" value={form.email} onChange={set("email")} placeholder="rahul@company.com" className="input-base" />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1.5">Phone Number</label>
                    <input value={form.phone} onChange={set("phone")} placeholder="+91 98765 43210" className="input-base" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1.5">Company / Organization *</label>
                    <input required value={form.company} onChange={set("company")} placeholder="Acme Corp" className="input-base" />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1.5">Organization Size</label>
                    <select value={form.size} onChange={set("size")} className="input-base">
                      <option value="">Select size…</option>
                      {SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1.5">Service of Interest</label>
                    <select value={form.service} onChange={set("service")} className="input-base">
                      <option value="">Select service…</option>
                      {SERVICES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1.5">Tell us more (optional)</label>
                  <textarea value={form.message} onChange={set("message")} rows={3}
                    placeholder="Describe your current DPDP situation, urgency, or specific questions…"
                    className="input-base resize-none" />
                </div>

                {/* DPDP Consent checkbox — required under DPDP Act 2023 */}
                <div className="consent-box">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <div className="relative flex-shrink-0 mt-0.5">
                      <input
                        type="checkbox"
                        checked={consentGiven}
                        onChange={(e) => setConsentGiven(e.target.checked)}
                        className="sr-only"
                        required
                      />
                      <div
                        className={`w-[18px] h-[18px] rounded border-2 flex items-center justify-center transition-all ${
                          consentGiven ? "bg-brand-navy border-brand-navy" : "bg-white border-border-medium"
                        }`}
                      >
                        {consentGiven && <CheckCircle className="w-3 h-3 text-white" />}
                      </div>
                    </div>
                    <span className="text-xs text-text-secondary leading-relaxed">
                      <strong className="text-text-primary">I give my informed consent</strong> for Anix AI LLP to collect
                      and process my personal data (name, email, phone, company details) to respond to this enquiry and
                      provide relevant DPDP compliance information. I understand this consent is voluntary and I may withdraw
                      it at any time by emailing{" "}
                      <a href="mailto:privacy@anixai.io" className="text-brand-blue hover:underline">privacy@anixai.io</a>.
                      I have read and agree to the{" "}
                      <a href="/privacy-policy" className="text-brand-blue hover:underline" target="_blank">Privacy Policy</a>
                      {" "}and{" "}
                      <a href="/terms" className="text-brand-blue hover:underline" target="_blank">Terms of Service</a>.{" "}
                      <span className="text-danger-text font-semibold">*</span>
                    </span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={formState === "submitting" || !consentGiven}
                  className={`btn-primary w-full justify-center ${(!consentGiven || formState === "submitting") ? "opacity-60 cursor-not-allowed" : ""}`}
                >
                  {formState === "submitting" ? (
                    <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Sending…</>
                  ) : (
                    <><Send className="w-4 h-4" /> Send Request &amp; Get Custom Proposal</>
                  )}
                </button>

                <p className="text-[11px] text-text-muted text-center">
                  We respond within 4 business hours · No spam · DPDP-compliant data handling
                </p>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
