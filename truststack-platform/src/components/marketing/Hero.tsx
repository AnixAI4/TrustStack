"use client";

import { motion } from "framer-motion";
import { ArrowRight, Shield, AlertTriangle, CheckCircle, Zap, ChevronRight } from "lucide-react";

const stats = [
  { value: "₹250 Cr",  label: "Max Penalty",          color: "danger" },
  { value: "72 Hrs",   label: "Breach Notification",   color: "warning" },
  { value: "Jan 2025", label: "Rules In Force Since",  color: "brand" },
  { value: "2027",     label: "Enforcement Deadline",  color: "navy" },
];

const trustBadges = [
  "DPDP Rules 2025 In Force",
  "Directors Personally Liable",
  "AI Governance Included",
  "DPDP-Compliant Platform",
];

const steps = ["Discover", "Define", "Design", "Defend", "Deploy", "Demonstrate", "Drive"];

const container = {
  hidden: { opacity: 0 },
  show:   { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const item = {
  hidden: { opacity: 0, y: 18 },
  show:   { opacity: 1, y: 0, transition: { ease: "easeOut", duration: 0.45 } },
};

export default function Hero() {
  return (
    <section className="relative bg-white overflow-hidden">
      {/* Subtle grid */}
      <div className="absolute inset-0 grid-bg opacity-40 pointer-events-none" />
      {/* Blue glow top */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-64 bg-brand-blue-pale rounded-full blur-3xl opacity-60 pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 lg:pt-20 lg:pb-28">
        <div className="grid lg:grid-cols-2 gap-14 lg:gap-20 items-center">

          {/* ── Left ── */}
          <motion.div variants={container} initial="hidden" animate="show" className="space-y-7">

            {/* Label row */}
            <motion.div variants={item} className="flex flex-wrap items-center gap-2">
              <span className="badge-danger">
                <AlertTriangle className="w-3 h-3" /> DPDP Rules Already In Force
              </span>
              <span className="badge-navy">
                <Shield className="w-3 h-3" /> India&apos;s #1 DPDP Platform
              </span>
            </motion.div>

            {/* Headline */}
            <motion.div variants={item}>
              <h1 className="font-display text-4xl sm:text-5xl lg:text-[3.5rem] xl:text-[4rem] font-bold text-text-primary leading-[1.06] tracking-tight">
                Is Your Organization{" "}
                <span className="text-gradient-danger">Legally Exposed</span>{" "}
                Under India&apos;s DPDP Act?
              </h1>
            </motion.div>

            {/* Sub */}
            <motion.div variants={item}>
              <p className="text-lg text-text-secondary leading-relaxed">
                Penalties up to{" "}
                <strong className="text-danger-DEFAULT font-bold">₹250 Crore</strong>{" "}
                per violation. Directors{" "}
                <strong className="text-danger-DEFAULT font-semibold">personally liable</strong>.
                DPDP Rules 2025 are already in force.
                The clock is running.
              </p>
            </motion.div>

            {/* Key message box */}
            <motion.div variants={item} className="p-4 rounded-2xl bg-brand-blue-pale border border-brand-blue/20">
              <div className="flex gap-3">
                <Zap className="w-4 h-4 text-brand-blue flex-shrink-0 mt-0.5" />
                <p className="text-sm text-text-secondary leading-relaxed">
                  <strong className="text-brand-navy">AI increases data value.</strong>{" "}
                  <strong className="text-brand-navy">DPDP increases data accountability.</strong>{" "}
                  Anix AI TrustStack™ helps your organization manage both — securely and sustainably.
                </p>
              </div>
            </motion.div>

            {/* CTAs */}
            <motion.div variants={item} className="flex flex-wrap gap-3">
              <a href="#risk-check" className="btn-danger">
                <AlertTriangle className="w-4 h-4" />
                Free DPDP Risk Check
                <ArrowRight className="w-4 h-4" />
              </a>
              <a href="#contact" className="btn-primary">
                Book DPDP Compass™
                <ArrowRight className="w-4 h-4" />
              </a>
              <a href="#trustchat" className="btn-secondary">
                <Zap className="w-4 h-4 text-brand-blue" />
                Ask TrustChat™ AI
              </a>
            </motion.div>

            {/* Trust badges */}
            <motion.div variants={item} className="flex flex-wrap gap-2 pt-1">
              {trustBadges.map((b) => (
                <span key={b} className="flex items-center gap-1.5 text-xs text-text-muted bg-surface-secondary border border-border px-3 py-1.5 rounded-full">
                  <CheckCircle className="w-3 h-3 text-success-DEFAULT" />
                  {b}
                </span>
              ))}
            </motion.div>
          </motion.div>

          {/* ── Right — Visual ── */}
          <motion.div
            initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25, duration: 0.6 }}
            className="space-y-4"
          >
            {/* Main card — 7D Framework preview */}
            <div className="card p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#003366,#2563EB)" }}>
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-brand-navy">Anix 7D DPDP Framework™</h3>
                  <p className="text-xs text-text-muted">India&apos;s first end-to-end compliance methodology</p>
                </div>
                <span className="ml-auto badge-brand">Trademark Pending</span>
              </div>

              {/* 7D steps */}
              <div className="flex flex-col gap-1.5">
                {steps.map((step, i) => (
                  <div key={step} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-surface-secondary transition-colors group cursor-default">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                      style={{ background: `hsl(${215 + i * 8}, 70%, ${38 + i * 4}%)` }}
                    >
                      D
                    </div>
                    <span className="text-sm font-medium text-text-primary">{step}</span>
                    <ChevronRight className="w-4 h-4 text-text-muted ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                ))}
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 gap-3">
              {stats.map((s) => (
                <div
                  key={s.label}
                  className={`rounded-2xl p-4 border ${
                    s.color === "danger"  ? "bg-danger-light  border-danger-border"  :
                    s.color === "warning" ? "bg-warning-light border-warning-border" :
                    s.color === "navy"    ? "bg-brand-navy text-white border-brand-navy" :
                    "bg-brand-blue-pale border-brand-blue/20"
                  }`}
                >
                  <div className={`text-xl font-bold font-display ${
                    s.color === "danger"  ? "text-danger-text"  :
                    s.color === "warning" ? "text-warning-text" :
                    s.color === "navy"    ? "text-white"        :
                    "text-brand-blue"
                  }`}>
                    {s.value}
                  </div>
                  <div className={`text-xs mt-0.5 ${
                    s.color === "navy" ? "text-white/70" : "text-text-muted"
                  }`}>
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
