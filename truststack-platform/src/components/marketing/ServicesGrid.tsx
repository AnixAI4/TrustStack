"use client";

import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { Compass, Wrench, Bot, Settings, LayoutDashboard, GraduationCap, Zap, ArrowRight, Star, Shield } from "lucide-react";

const services = [
  {
    icon: Zap,
    name: "DPDP Ignite™",
    tagline: "Executive Awareness Workshop",
    badge: "Entry Point",
    badgeType: "brand",
    description: "A focused workshop for boards, CXOs, legal, IT, HR, and AI teams. Build urgency and alignment at leadership level. Covers DPDP Act, Rules 2025, director liability, and your immediate action priorities.",
    features: [
      "What DPDP means for YOUR organization",
      "Director personal liability explained",
      "DPDP Rules 2025 key obligations",
      "Top 10 gaps most companies have",
      "AI and GenAI compliance risks",
      "90-day action priorities",
    ],
    cta: "Schedule Workshop",
    highlight: false,
  },
  {
    icon: Compass,
    name: "DPDP Compass™",
    tagline: "Readiness Assessment",
    badge: "Most Popular",
    badgeType: "navy",
    description: "India's most comprehensive 2-week DPDP readiness assessment. Understand exactly where you stand, what's at risk, and what to fix first — with a board-ready report and 90-day roadmap.",
    features: [
      "DPDP applicability review",
      "Personal data inventory snapshot",
      "Notice & consent gap review",
      "Vendor / Data Processor risk snapshot",
      "AI / GenAI privacy risk assessment",
      "DPDP Maturity Scorecard (10 dimensions)",
      "Risk heatmap — high / medium / low",
      "90-day compliance roadmap",
      "CXO leadership presentation",
    ],
    cta: "Book Assessment",
    highlight: true,
  },
  {
    icon: Wrench,
    name: "DPDP Build™",
    tagline: "Implementation Accelerator",
    badge: "Full Stack",
    badgeType: "brand",
    description: "End-to-end DPDP implementation — from data inventory to breach playbook. We implement every requirement of the DPDP Act 2023 and Rules 2025 across your organization.",
    features: [
      "Complete data inventory & purpose mapping",
      "Privacy notice redesign (22 Indian languages)",
      "Consent workflow design & implementation",
      "Data Principal rights request process",
      "Vendor DPA review and execution",
      "72-hour breach notification playbook",
      "Retention and deletion schedule",
      "Security safeguard alignment",
      "RoPA (Record of Processing Activities)",
      "Department training by role",
    ],
    cta: "Get Implementation Plan",
    highlight: false,
  },
  {
    icon: Bot,
    name: "AI Privacy Shield™",
    tagline: "GenAI & AI Governance",
    badge: "AI-Powered",
    badgeType: "gold",
    description: "Specialized DPDP governance for organizations using AI, GenAI, RAG systems, AI agents, and copilots. The only DPDP firm that treats AI governance as a core pillar, not an afterthought.",
    features: [
      "GenAI and AI chatbot privacy risk assessment",
      "Prompt data leakage identification",
      "RAG system personal data review",
      "AI vendor governance framework",
      "AI acceptable-use policy creation",
      "Machine unlearning advisory",
      "AI privacy risk register setup",
      "Algorithmic bias review",
    ],
    cta: "AI Governance Audit",
    highlight: false,
  },
  {
    icon: Settings,
    name: "DPDP TrustOps™",
    tagline: "Managed Compliance Office",
    badge: "Ongoing",
    badgeType: "success",
    description: "Your outsourced DPDP compliance team. Monthly managed service covering everything from DPO support and grievance management to vendor reviews and board reporting.",
    features: [
      "DPO / Responsible Person function",
      "Monthly privacy operations management",
      "Grievance workflow management",
      "Quarterly vendor / processor review",
      "Evidence management and documentation",
      "Board compliance dashboard",
      "Annual training refresh by role",
      "AI privacy quarterly review",
      "Regulatory notice response support",
    ],
    cta: "Start TrustOps™",
    highlight: false,
  },
  {
    icon: LayoutDashboard,
    name: "TrustStack Platform™",
    tagline: "Privacy Operations SaaS",
    badge: "SaaS Platform",
    badgeType: "brand",
    description: "12-module cloud platform for real-time DPDP compliance tracking. From data inventory to board dashboard — all in one place, always up to date.",
    features: [
      "Data Inventory module",
      "Consent Register with audit trail",
      "Rights Request Tracker",
      "Vendor Risk Register & DPA tracking",
      "Breach Tracker (72-hr countdown)",
      "AI Privacy Risk Register",
      "Evidence Vault (audit-ready storage)",
      "Board Dashboard — real-time scorecard",
      "RoPA Builder with regulator export",
      "Privacy Flow™ — data flow mapping",
      "Cookie Scanner (freemium)",
      "DPDP TrustChat™ AI advisor",
    ],
    cta: "Request Demo",
    highlight: false,
  },
  {
    icon: GraduationCap,
    name: "CDPP Certification™",
    tagline: "Certified DPDP Professional",
    badge: "India First",
    badgeType: "gold",
    description: "India's first employer-verifiable DPDP professional certification. With LinkedIn digital badge, unique certificate number, and 2-year validity — the certification that actually advances careers.",
    features: [
      "6-module DPDP curriculum",
      "Online + in-person delivery options",
      "Unique certificate number (employer-verifiable)",
      "Employer verification portal",
      "LinkedIn digital badge integration",
      "2-year validity with renewal CPE",
      "Role-specific tracks: DPO / IT / Legal / HR",
      "Hindi + English delivery",
    ],
    cta: "Enroll Now",
    highlight: false,
  },
];

const badgeClass: Record<string, string> = {
  brand:   "badge-brand",
  navy:    "badge-navy",
  gold:    "badge-gold",
  success: "badge-success",
};

export default function ServicesGrid() {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.05 });

  return (
    <section ref={ref} id="services" className="section-gray py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}}
          className="text-center mb-14"
        >
          <p className="section-label mb-3 flex items-center justify-center gap-2">
            <Shield className="w-3.5 h-3.5" /> Complete DPDP Service Stack
          </p>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-text-primary mt-2 mb-4">
            From Assessment to{" "}
            <span className="text-gradient-brand">Continuous Compliance</span>
          </h2>
          <p className="text-text-secondary text-lg max-w-2xl mx-auto">
            India&apos;s only integrated platform covering assessment, implementation, managed operations,
            AI governance, and professional certification.
          </p>
        </motion.div>

        {/* Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {services.map((s, i) => (
            <motion.div
              key={s.name}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.07 * i }}
              className={`card-hover flex flex-col ${s.highlight ? "ring-2 ring-brand-blue/30 shadow-brand" : ""}`}
            >
              <div className="p-6 flex flex-col h-full">
                {/* Badge row */}
                <div className="flex items-center justify-between mb-4">
                  <span className={`${badgeClass[s.badgeType] || "badge-brand"}`}>{s.badge}</span>
                  {s.highlight && <Star className="w-4 h-4 text-accent-gold fill-accent-gold" />}
                </div>

                {/* Icon + title */}
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg,#003366,#2563EB)" }}>
                    <s.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-brand-navy text-base leading-tight">{s.name}</h3>
                    <p className="text-xs text-brand-blue font-medium">{s.tagline}</p>
                  </div>
                </div>

                {/* Description */}
                <p className="text-sm text-text-secondary leading-relaxed mb-4 flex-1">{s.description}</p>

                {/* Features */}
                <ul className="space-y-1.5 mb-5">
                  {s.features.slice(0, 5).map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs text-text-secondary">
                      <div className="w-1 h-1 rounded-full bg-brand-blue mt-1.5 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                  {s.features.length > 5 && (
                    <li className="text-xs text-text-muted pl-3">+ {s.features.length - 5} more included</li>
                  )}
                </ul>

                {/* CTA — no price */}
                <div className="pt-4 border-t border-border mt-auto">
                  <a
                    href="#contact"
                    className={`w-full justify-center text-sm ${s.highlight ? "btn-primary" : "btn-secondary"}`}
                    style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}
                  >
                    {s.cta}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                  <p className="text-[11px] text-text-muted text-center mt-2">
                    Custom quote based on your organization size
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom note */}
        <motion.p
          initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ delay: 0.6 }}
          className="text-center text-sm text-text-muted mt-10"
        >
          All engagements are tailored to your industry, organization size, and current readiness level.{" "}
          <a href="#contact" className="text-brand-blue hover:underline font-medium">Request a custom proposal →</a>
        </motion.p>
      </div>
    </section>
  );
}
