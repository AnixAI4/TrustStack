"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { Search, BookOpen, Layers, ShieldCheck, Rocket, BarChart3, RefreshCw, ChevronRight } from "lucide-react";

const steps = [
  { number: 1, title: "Discover",     subtitle: "Find all personal data",              icon: Search,     color: "#2563EB", activities: ["Personal data inventory across systems","Vendor and processor identification","AI/GenAI data touchpoints","Shadow IT and cloud data stores","Employee and customer data categories"] },
  { number: 2, title: "Define",       subtitle: "Map purpose and accountability",      icon: BookOpen,   color: "#7C3AED", activities: ["Purpose of processing documentation","Legal basis determination","Consent and legitimate interest mapping","Data retention schedule definition","RoPA (Record of Processing Activities) creation"] },
  { number: 3, title: "Design",       subtitle: "Build compliant workflows",           icon: Layers,     color: "#0891B2", activities: ["Privacy notice redesign (22 Indian languages)","Consent capture and withdrawal workflows","Data Principal rights processes","Grievance redressal mechanism","Data Processing Agreements with vendors"] },
  { number: 4, title: "Defend",       subtitle: "Security & breach readiness",         icon: ShieldCheck,color: "#DC2626", activities: ["Security safeguard gap assessment","Access control and data minimization","Encryption and masking implementation","72-hour breach notification plan","Incident response playbook"] },
  { number: 5, title: "Deploy",       subtitle: "Implement across the organization",   icon: Rocket,     color: "#D97706", activities: ["Department-specific SOP rollout","Privacy notice and consent deployment","TrustStack Platform™ configuration","Employee training by role (DPO/HR/IT/Legal)","Vendor DPA execution and tracking"] },
  { number: 6, title: "Demonstrate",  subtitle: "Build evidence and board dashboards", icon: BarChart3,  color: "#059669", activities: ["Evidence vault for compliance activities","DPDP Maturity Scorecard (10 dimensions)","Board-ready compliance dashboard","Risk heatmap for leadership","Regulator-ready documentation package"] },
  { number: 7, title: "Drive",        subtitle: "Continuous compliance operations",    icon: RefreshCw,  color: "#003366", activities: ["Monthly DPDP TrustOps™ managed service","DPO / Responsible Person support","Quarterly rights and grievance review","AI / GenAI privacy quarterly assessment","Annual DPDP audit and board report"] },
];

export default function Framework7D() {
  const [active, setActive] = useState(0);
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });
  const s = steps[active];

  return (
    <section ref={ref} id="framework" className="section-gray py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}}
          className="text-center mb-14"
        >
          <p className="section-label mb-3 flex items-center justify-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5" /> Proprietary Methodology
          </p>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-text-primary mt-2 mb-4">
            Anix 7D DPDP Framework™
          </h2>
          <p className="text-text-secondary text-lg max-w-2xl mx-auto">
            India&apos;s first end-to-end DPDP compliance methodology — from data discovery to continuous
            compliance operations.{" "}
            <span className="font-medium text-brand-blue">Trademark pending.</span>
          </p>
        </motion.div>

        {/* Step pills */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {steps.map((step, i) => (
            <motion.button
              key={step.title}
              initial={{ opacity: 0, y: 12 }} animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.05 * i }}
              onClick={() => setActive(i)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-all duration-200 ${
                active === i
                  ? "text-white border-transparent shadow-brand"
                  : "bg-white border-border text-text-secondary hover:border-border-medium"
              }`}
              style={active === i ? { background: step.color, borderColor: step.color } : {}}
            >
              <span
                className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                style={active === i ? { background: "rgba(255,255,255,0.25)", color: "white" } : { background: `${step.color}20`, color: step.color }}
              >
                {step.number}
              </span>
              {step.title}
            </motion.button>
          ))}
        </div>

        {/* Detail panel */}
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.25 }}
            className="grid lg:grid-cols-2 gap-6"
          >
            {/* Left */}
            <div className="card p-7" style={{ borderColor: `${s.color}30` }}>
              <div className="flex items-center gap-4 mb-5">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: s.color }}>
                  <s.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest mb-0.5" style={{ color: s.color }}>
                    Step {s.number} of 7
                  </p>
                  <h3 className="font-display text-xl font-bold text-text-primary">{s.title}</h3>
                  <p className="text-sm" style={{ color: s.color }}>{s.subtitle}</p>
                </div>
              </div>
              <p className="text-text-secondary text-sm leading-relaxed mb-6">
                Each stage of the Anix 7D Framework™ builds on the last — creating a complete,
                evidence-based DPDP compliance program tailored to your organization.
              </p>
              <a href="#contact" className="btn-primary text-sm" style={{ background: `linear-gradient(135deg, ${s.color}, ${s.color}cc)`, boxShadow: `0 4px 14px ${s.color}30` }}>
                Start {s.title} Stage <ChevronRight className="w-4 h-4" />
              </a>
            </div>

            {/* Right — activities */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">Key Activities</h4>
              {s.activities.map((a, i) => (
                <motion.div
                  key={a}
                  initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.06 * i }}
                  className="flex items-start gap-3 p-3.5 rounded-xl bg-white border border-border hover:border-border-medium transition-colors"
                >
                  <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-white mt-0.5" style={{ background: s.color }}>
                    {i + 1}
                  </div>
                  <span className="text-sm text-text-secondary">{a}</span>
                </motion.div>
              ))}
              {active < steps.length - 1 && (
                <button
                  onClick={() => setActive(active + 1)}
                  className="w-full mt-1 py-2.5 px-4 rounded-xl border border-dashed border-border text-sm text-text-muted hover:text-brand-blue hover:border-brand-blue/40 transition-all flex items-center justify-center gap-2"
                >
                  Next: {steps[active + 1].title} <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
