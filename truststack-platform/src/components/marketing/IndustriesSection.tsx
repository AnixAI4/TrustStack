"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { Building2, Heart, BookOpen, Code2, ShoppingBag, Landmark, ArrowRight } from "lucide-react";

const industries = [
  { id: "bfsi",       icon: Building2,  name: "BFSI",        full: "Banks, NBFCs, Fintechs, Insurance & Wealth",        color: "#003366", risk: "HIGHEST",   dataTypes: ["KYC data","Financial transactions","Credit scores","Account details","Investment portfolios"], risks: ["RBI and SEBI sector-specific mandates alongside DPDP","Consent for data sharing with credit bureaus","Third-party vendor data processing at scale","GenAI models trained on customer financial data"], services: ["DPDP Compass™ Enterprise","AI Privacy Shield™","DPDP TrustOps™","CDPP for DPOs"] },
  { id: "healthcare", icon: Heart,       name: "Healthcare",  full: "Hospitals, Clinics, Diagnostics & HealthTech",       color: "#DC2626", risk: "CRITICAL",  dataTypes: ["Patient records","Diagnostic reports","Prescription history","Genomic data","Mental health data"], risks: ["Health data is the most sensitive category under DPDP","Children's patient data requires stricter consent verification","Insurance claim data sharing obligations","AI diagnostic tools using patient personal data"], services: ["DPDP Compass™ Enterprise","DPDP Build™","AI Privacy Shield™","DPDP TrustOps™"] },
  { id: "edtech",     icon: BookOpen,    name: "Education",   full: "Schools, Universities, EdTech & Coaching Institutes", color: "#7C3AED", risk: "HIGH",      dataTypes: ["Student records","Parent data","Academic performance","Attendance","Online learning behavior"], risks: ["Majority of students are minors — stricter consent required","Verifiable parental consent mandatory under Rule 10","EdTech platforms processing behavioral data at scale","International student data transfer obligations"], services: ["DPDP Compass™ Standard","DPDP Build™","Corporate Training","CDPP Program"] },
  { id: "saas",       icon: Code2,       name: "SaaS & IT",   full: "SaaS Companies, GCCs, IT Services & AI Startups",    color: "#0891B2", risk: "HIGH",      dataTypes: ["User accounts","Usage analytics","Employee data (GCCs)","Customer data","AI training data"], risks: ["Data Processor obligations for GCC and SaaS companies","AI/GenAI systems trained on Indian user personal data","Cross-border data transfers (India ↔ US/EU)","Contractual DPDP obligations from enterprise clients"], services: ["AI Privacy Shield™","DPDP Compass™","DPDP TrustOps™","TrustStack Platform™"] },
  { id: "ecommerce",  icon: ShoppingBag, name: "E-Commerce",  full: "E-Commerce, Retail, Logistics & D2C Brands",         color: "#D97706", risk: "HIGH",      dataTypes: ["Customer profiles","Purchase history","Delivery addresses","Payment data","Behavioral data"], risks: ["Cookie consent and behavioral tracking under DPDP","WhatsApp marketing data for 500M+ Indian users","Loyalty program and CRM data governance","Delivery partner data sharing obligations"], services: ["DPDP Compass™","WhatsApp Compliance Kit","Cookie Scanner","DPDP Build™"] },
  { id: "government", icon: Landmark,    name: "Government",  full: "Government Departments, PSUs & Smart Cities",        color: "#059669", risk: "STRATEGIC", dataTypes: ["Citizen data","Aadhaar-linked data","Service delivery records","Tax data","Benefits data"], risks: ["Central government departments are Data Fiduciaries","Citizen consent for digital service delivery","Smart city IoT data collection and processing","GeM portal and procurement data governance"], services: ["DPDP Compass™ Government","DPDP Build™ for PSUs","CERT-In aligned audit","Training programs"] },
];

export default function IndustriesSection() {
  const [active, setActive] = useState(industries[0]);
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  return (
    <section ref={ref} id="industries" className="section-white py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}}
          className="text-center mb-14"
        >
          <p className="section-label mb-3 flex items-center justify-center gap-2">
            <Building2 className="w-3.5 h-3.5" /> Industry Coverage
          </p>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-text-primary mt-2 mb-4">
            Built for Every Industry{" "}
            <span className="text-gradient-brand">That Handles Personal Data</span>
          </h2>
          <p className="text-text-secondary text-lg max-w-2xl mx-auto">
            Our industry-specific playbooks mean faster implementation, less risk, and better outcomes.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-5">
          {/* Selector */}
          <div className="space-y-2">
            {industries.map((ind) => (
              <motion.button
                key={ind.id}
                initial={{ opacity: 0, x: -12 }} animate={inView ? { opacity: 1, x: 0 } : {}}
                onClick={() => setActive(ind)}
                className={`w-full flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all duration-200 ${
                  active.id === ind.id ? "shadow-soft" : "bg-white border-border hover:border-border-medium"
                }`}
                style={active.id === ind.id ? { background: `${ind.color}08`, borderColor: `${ind.color}40` } : {}}
              >
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: active.id === ind.id ? ind.color : `${ind.color}15`, color: active.id === ind.id ? "white" : ind.color }}>
                  <ind.icon className="w-4.5 h-4.5" style={{ width: "18px", height: "18px" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-text-primary truncate">{ind.name}</div>
                  <div className="text-xs text-text-muted truncate">{ind.full}</div>
                </div>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
                  style={{ background: `${ind.color}15`, color: ind.color }}>
                  {ind.risk}
                </span>
              </motion.button>
            ))}
          </div>

          {/* Detail */}
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              <motion.div
                key={active.id}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2 }}
                className="card p-6 h-full" style={{ borderColor: `${active.color}30` }}
              >
                <div className="flex items-start justify-between gap-4 mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: active.color }}>
                      <active.icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-xl text-text-primary">{active.name}</h3>
                      <p className="text-sm text-text-secondary">{active.full}</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0"
                    style={{ background: `${active.color}12`, color: active.color }}>
                    {active.risk} RISK
                  </span>
                </div>

                {/* Data types */}
                <div className="mb-5">
                  <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2.5">Personal Data Processed</h4>
                  <div className="flex flex-wrap gap-2">
                    {active.dataTypes.map((d) => (
                      <span key={d} className="text-xs px-2.5 py-1 rounded-full border font-medium"
                        style={{ borderColor: `${active.color}30`, color: active.color, background: `${active.color}08` }}>
                        {d}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Risks */}
                <div className="mb-5">
                  <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2.5">Key DPDP Risk Areas</h4>
                  <div className="space-y-2">
                    {active.risks.map((r) => (
                      <div key={r} className="flex items-start gap-2 text-sm text-text-secondary">
                        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5" style={{ background: active.color }} />
                        {r}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Services */}
                <div className="mb-5">
                  <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2.5">Recommended Services</h4>
                  <div className="flex flex-wrap gap-2">
                    {active.services.map((s) => (
                      <span key={s} className="badge-brand">{s}</span>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-border">
                  <a href="#contact" className="btn-primary text-sm"
                    style={{ background: `linear-gradient(135deg, ${active.color}, ${active.color}bb)` }}>
                    Get {active.name} Assessment <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
