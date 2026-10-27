"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cookie, X, CheckCircle, Settings } from "lucide-react";
import Link from "next/link";

const STORAGE_KEY = "anixai_cookie_consent";

type ConsentState = { analytics: boolean; marketing: boolean; decided: boolean };

const DEFAULT: ConsentState = { analytics: false, marketing: false, decided: false };

export default function CookieConsent() {
  const [show, setShow] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [consent, setConsent] = useState<ConsentState>(DEFAULT);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as ConsentState;
        if (parsed.decided) return;
      }
    } catch { /* ignore */ }
    const timer = setTimeout(() => setShow(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  const save = (state: ConsentState) => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, decided: true })); } catch { /* ignore */ }
    setShow(false);
  };

  const acceptAll  = () => save({ analytics: true,  marketing: true,  decided: true });
  const rejectAll  = () => save({ analytics: false, marketing: false, decided: true });
  const saveCustom = () => save({ ...consent, decided: true });

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-[420px] z-[100]"
        >
          <div className="cookie-banner">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <Cookie className="w-4 h-4 text-brand-navy flex-shrink-0" />
                <span className="font-semibold text-sm text-text-primary">Cookie Preferences</span>
              </div>
              <button onClick={rejectAll} className="text-text-muted hover:text-text-primary transition-colors flex-shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-text-secondary leading-relaxed mb-3">
              We use cookies to ensure this website functions correctly (strictly necessary) and,
              with your consent, to analyze usage and improve our services. Under the DPDP Act 2023,
              we only use non-essential cookies with your explicit consent.
              <Link href="/cookie-policy" className="text-brand-blue hover:underline ml-1">Learn more</Link>
            </p>

            {showDetails && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="mb-3 space-y-2">
                {[
                  { key: "necessary", label: "Strictly Necessary", desc: "Required for the website to function. Cannot be disabled.", locked: true, value: true },
                  { key: "analytics", label: "Analytics",          desc: "Help us understand how visitors interact with our website.",  locked: false, value: consent.analytics },
                  { key: "marketing", label: "Marketing",          desc: "Used to deliver relevant ads and track campaign performance.", locked: false, value: consent.marketing },
                ].map((cat) => (
                  <div key={cat.key} className="flex items-start justify-between gap-3 p-2.5 rounded-lg bg-surface-secondary border border-border">
                    <div>
                      <p className="text-xs font-semibold text-text-primary">{cat.label}</p>
                      <p className="text-[10px] text-text-muted leading-relaxed">{cat.desc}</p>
                    </div>
                    <button
                      disabled={cat.locked}
                      onClick={() => !cat.locked && setConsent((p) => ({ ...p, [cat.key]: !p[cat.key as keyof ConsentState] }))}
                      className={`flex-shrink-0 w-9 h-5 rounded-full transition-colors relative ${
                        cat.value ? "bg-brand-navy" : "bg-border-medium"
                      } ${cat.locked ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
                    >
                      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${cat.value ? "left-4" : "left-0.5"}`} />
                    </button>
                  </div>
                ))}
                <button onClick={saveCustom} className="btn-secondary text-xs w-full justify-center">
                  <CheckCircle className="w-3.5 h-3.5" /> Save My Preferences
                </button>
              </motion.div>
            )}

            <div className="flex gap-2">
              <button onClick={acceptAll} className="btn-primary text-xs flex-1 justify-center">
                Accept All
              </button>
              <button onClick={rejectAll} className="btn-secondary text-xs flex-1 justify-center">
                Reject Non-Essential
              </button>
              <button onClick={() => setShowDetails(!showDetails)} className="btn-secondary text-xs px-2.5 justify-center" title="Customise">
                <Settings className="w-3.5 h-3.5" />
              </button>
            </div>

            <p className="text-[10px] text-text-muted text-center mt-2">
              DPDP Act 2023 compliant · You can change preferences anytime via our{" "}
              <Link href="/cookie-policy" className="underline hover:text-brand-blue">Cookie Policy</Link>
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
