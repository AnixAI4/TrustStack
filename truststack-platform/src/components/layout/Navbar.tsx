"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Menu, X, ChevronDown, Phone, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import ThemeToggle from "@/components/ui/ThemeToggle";

const navItems = [
  {
    label: "Services",
    href: "#services",
    children: [
      { label: "DPDP Compass™ — Assessment",    href: "#services", badge: "Start Here" },
      { label: "DPDP Ignite™ — Workshop",        href: "#services" },
      { label: "DPDP Build™ — Implementation",   href: "#services" },
      { label: "AI Privacy Shield™",             href: "#services", badge: "AI-Powered" },
      { label: "DPDP TrustOps™ — Managed",       href: "#services", badge: "Ongoing" },
      { label: "TrustStack Platform™",           href: "#services", badge: "SaaS" },
    ],
  },
  {
    label: "Industries",
    href: "#industries",
    children: [
      { label: "BFSI — Banks, NBFCs, Fintechs",      href: "#industries" },
      { label: "Healthcare & HealthTech",             href: "#industries" },
      { label: "Education & EdTech",                  href: "#industries" },
      { label: "SaaS, IT & GCCs",                    href: "#industries" },
      { label: "E-Commerce & Retail",                 href: "#industries" },
      { label: "Government & PSUs",                   href: "#industries" },
    ],
  },
  { label: "Our Framework",  href: "#framework" },
  { label: "Why Anix AI",    href: "#about" },
  { label: "TrustChat™ AI", href: "#trustchat", highlight: true },
];

export default function Navbar() {
  const [scrolled, setScrolled]           = useState(false);
  const [mobileOpen, setMobileOpen]       = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 16);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <>
      {/* Urgency ribbon */}
      <div className="bg-brand-navy text-white text-center py-1.5 text-xs font-medium tracking-wide">
        ⚡ DPDP Rules 2025 are already in force — Penalties up to ₹250 Crore — Directors personally liable
      </div>

      <motion.header
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className={cn(
          "sticky top-0 z-50 transition-all duration-300 nav-glass",
          scrolled ? "shadow-nav border-b border-border" : "border-b border-border/60"
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* Logo */}
            <a href="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg,#003366,#2563EB)" }}>
                <Shield className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="font-display font-bold text-sm text-brand-navy leading-none">Anix AI</div>
                <div className="text-[9px] text-brand-blue font-bold tracking-widest uppercase leading-none mt-0.5">TrustStack™</div>
              </div>
            </a>

            {/* Desktop nav */}
            <nav className="hidden lg:flex items-center gap-0.5">
              {navItems.map((item) => (
                <div
                  key={item.label}
                  className="relative"
                  onMouseEnter={() => item.children && setActiveDropdown(item.label)}
                  onMouseLeave={() => setActiveDropdown(null)}
                >
                  <a
                    href={item.href}
                    className={cn(
                      "flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      item.highlight
                        ? "bg-brand-blue-pale text-brand-blue border border-brand-blue/30 hover:bg-brand-blue hover:text-white"
                        : "text-text-secondary hover:text-brand-navy hover:bg-surface-secondary"
                    )}
                  >
                    {item.label}
                    {item.children && (
                      <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", activeDropdown === item.label && "rotate-180")} />
                    )}
                  </a>

                  <AnimatePresence>
                    {item.children && activeDropdown === item.label && (
                      <motion.div
                        initial={{ opacity: 0, y: 6, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 6, scale: 0.97 }}
                        transition={{ duration: 0.12 }}
                        className="absolute top-full left-0 mt-1 w-72 bg-white border border-border rounded-2xl shadow-card-hover p-1.5 z-50"
                      >
                        {item.children.map((child) => (
                          <a
                            key={child.label}
                            href={child.href}
                            className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm text-text-secondary hover:text-brand-navy hover:bg-surface-secondary transition-colors group"
                          >
                            <span>{child.label}</span>
                            {"badge" in child && child.badge && (
                              <span className="badge-brand text-[9px] px-1.5">{child.badge}</span>
                            )}
                          </a>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </nav>

            {/* CTAs */}
            <div className="hidden lg:flex items-center gap-2">
              <a href="tel:+91" className="flex items-center gap-1.5 text-sm text-text-muted hover:text-brand-navy transition-colors px-2">
                <Phone className="w-3.5 h-3.5" />
                <span>Call Us</span>
              </a>
              <ThemeToggle />
              <a href="/login" className="text-sm font-medium text-text-secondary hover:text-brand-navy border border-border px-3 py-2 rounded-lg hover:bg-surface-secondary transition-colors">
                Login
              </a>
              <a href="/signup" className="btn-primary text-xs py-2 px-4">
                Sign Up Free <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Mobile controls */}
            <div className="lg:hidden flex items-center gap-2">
              <ThemeToggle />
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="p-2 rounded-lg text-text-muted hover:text-brand-navy hover:bg-surface-secondary transition-colors"
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 lg:hidden"
          >
            <div className="absolute inset-0 bg-black/30" onClick={() => setMobileOpen(false)} />
            <motion.div
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="absolute right-0 top-0 bottom-0 w-80 border-l border-border overflow-y-auto p-6" style={{ background: "var(--c-bg)" }}
            >
              <div className="flex items-center justify-between mb-6">
                <span className="font-display font-bold text-brand-navy">Menu</span>
                <button onClick={() => setMobileOpen(false)}><X className="w-5 h-5 text-text-muted" /></button>
              </div>
              <div className="mb-5 p-3 rounded-xl bg-danger-light border border-danger-border">
                <p className="text-xs text-danger-text font-medium">⚡ DPDP Rules in force. ₹250 Crore max penalty. Clock is running.</p>
              </div>
              <nav className="space-y-1">
                {navItems.map((item) => (
                  <a key={item.label} href={item.href} onClick={() => setMobileOpen(false)}
                    className={cn("block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                      item.highlight ? "bg-brand-blue-pale text-brand-blue" : "text-text-secondary hover:text-brand-navy hover:bg-surface-secondary"
                    )}>
                    {item.label}
                  </a>
                ))}
              </nav>
              <div className="mt-6 space-y-2">
                <a href="/login" className="block w-full text-center px-4 py-2.5 border border-border rounded-lg text-sm font-medium text-text-secondary hover:bg-surface-secondary transition-colors">
                  Login
                </a>
                <a href="/signup" className="btn-primary w-full justify-center text-sm">Sign Up Free <ArrowRight className="w-4 h-4" /></a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
