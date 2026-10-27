"use client";

import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { Shield, Bot, Database, Lock, BarChart3, Users, ArrowRight, CheckCircle, X } from "lucide-react";

const differentiators = [
  { icon: Shield,   title: "DPDP Compliance Depth",         desc: "Not just awareness — we implement. Every obligation under DPDP Act 2023 and Rules 2025, operationalised across your organization.",      color: "#003366", stat: "100%",    statL: "Rules 2025 coverage" },
  { icon: Bot,      title: "AI + GenAI Governance",         desc: "The only DPDP firm that treats AI governance as a core pillar. Prompt leakage, RAG compliance, machine unlearning, AI Privacy Shield™.", color: "#7C3AED", stat: "AI-first", statL: "approach to DPDP" },
  { icon: Database, title: "Data Governance Integration",   desc: "DPDP compliance without data governance is incomplete. We unify your privacy, data, and AI programs into one coherent framework.",       color: "#0891B2", stat: "3-in-1",   statL: "Privacy + Data + AI" },
  { icon: Lock,     title: "Cybersecurity Alignment",       desc: "Security safeguards are mandatory under Rule 6. We align DPDP requirements with your existing cybersecurity infrastructure.",            color: "#DC2626", stat: "72-hr",    statL: "breach readiness" },
  { icon: BarChart3,"title": "Platform + Human Hybrid",    desc: "TrustStack Platform™ gives 24/7 dashboard visibility. DPDP TrustOps™ gives expert humans. Most firms offer one — we offer both.",       color: "#059669", stat: "12",      statL: "platform modules" },
  { icon: Users,    title: "Industry-Specific Playbooks",   desc: "BFSI, Healthcare, EdTech, SaaS — each has different DPDP obligations. Our pre-built playbooks cut implementation time by up to 60%.",  color: "#D97706", stat: "6",      statL: "industry playbooks" },
];

const comparison = [
  { feature: "DPDP Readiness Assessment",      anix: true, big4: true,      boutique: "partial", onetrust: false },
  { feature: "AI / GenAI Governance",          anix: true, big4: false,     boutique: false,     onetrust: "partial" },
  { feature: "Machine Unlearning Advisory",    anix: true, big4: false,     boutique: false,     onetrust: false },
  { feature: "Managed DPO Service",            anix: true, big4: "partial", boutique: true,      onetrust: false },
  { feature: "SaaS Compliance Platform",       anix: true, big4: false,     boutique: false,     onetrust: true },
  { feature: "India-specific DPDP Platform",   anix: true, big4: false,     boutique: false,     onetrust: false },
  { feature: "CDPP Certification Program",     anix: true, big4: false,     boutique: false,     onetrust: false },
  { feature: "Hindi + Regional Language",      anix: true, big4: false,     boutique: false,     onetrust: false },
  { feature: "Affordable SME Pricing",         anix: true, big4: false,     boutique: "partial", onetrust: false },
];

function Cell({ v }: { v: boolean | string }) {
  if (v === true)      return <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-success-light"><CheckCircle className="w-3.5 h-3.5 text-success-DEFAULT" /></span>;
  if (v === false)     return <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-surface-secondary"><X className="w-3 h-3 text-text-muted" /></span>;
  return                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-warning-light"><span className="text-warning-DEFAULT text-xs font-bold">~</span></span>;
}

export default function WhyAnixAI() {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.05 });

  return (
    <section ref={ref} id="about" className="section-gray py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} className="text-center mb-14">
          <p className="section-label mb-3 flex items-center justify-center gap-2"><Shield className="w-3.5 h-3.5" /> Why Choose Anix AI</p>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-text-primary mt-2 mb-4">
            The Only Firm at the{" "}
            <span className="text-gradient-brand">Intersection</span>
          </h2>
          <p className="text-text-secondary text-lg max-w-2xl mx-auto">
            <strong className="text-text-primary">DPDP + AI Governance + Data Governance + Cybersecurity.</strong>{" "}
            Every other firm does one or two. We integrate all four — because DPDP compliance in the AI era requires exactly that.
          </p>
        </motion.div>

        {/* Differentiators */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-14">
          {differentiators.map((d, i) => (
            <motion.div key={d.title} initial={{ opacity: 0, y: 16 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.06 * i }}
              className="card-hover p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${d.color}12`, color: d.color }}>
                  <d.icon className="w-5 h-5" />
                </div>
                <div className="text-right">
                  <div className="font-bold text-base font-display" style={{ color: d.color }}>{d.stat}</div>
                  <div className="text-[10px] text-text-muted">{d.statL}</div>
                </div>
              </div>
              <h3 className="font-semibold text-text-primary text-sm mb-1.5">{d.title}</h3>
              <p className="text-xs text-text-secondary leading-relaxed">{d.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Comparison table */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.3 }} className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <div>
              <h3 className="font-display font-bold text-lg text-text-primary">How We Compare</h3>
              <p className="text-xs text-text-muted mt-0.5">Anix AI vs Big 4 Consultants vs Boutique Firms vs OneTrust</p>
            </div>
            <span className="badge-navy hidden sm:flex">India&apos;s Most Complete Stack</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-secondary">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-text-muted">Feature</th>
                  {[{ l: "Anix AI", h: true }, { l: "Big 4", h: false }, { l: "Boutiques", h: false }, { l: "OneTrust", h: false }].map((c) => (
                    <th key={c.l} className={`text-center px-4 py-3 text-xs font-semibold ${c.h ? "text-brand-navy bg-brand-blue-pale" : "text-text-muted"}`}>
                      {c.l}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparison.map((r, i) => (
                  <tr key={r.feature} className={`border-b border-border/60 ${i % 2 === 0 ? "bg-white" : "bg-surface-secondary/40"}`}>
                    <td className="px-5 py-3 text-xs text-text-secondary">{r.feature}</td>
                    {[r.anix, r.big4, r.boutique, r.onetrust].map((v, j) => (
                      <td key={j} className={`text-center px-4 py-3 ${j === 0 ? "bg-brand-blue-pale/60" : ""}`}>
                        <Cell v={v} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 border-t border-border bg-brand-blue-pale/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-brand-navy">The only platform that covers all of the above.</p>
              <p className="text-xs text-text-muted">India-built · DPDP + AI + Data Governance + Cybersecurity</p>
            </div>
            <a href="#contact" className="btn-primary text-sm">Get Started <ArrowRight className="w-4 h-4" /></a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
