"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { Cookie, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { notifyProgressUpdate, OPEN_CONSENT_EVENT } from "@/lib/progress";
import { storageGetItem, storageSetJSON } from "@/lib/safe-storage";

type Cats = {
  essential: boolean;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
};

const CATEGORIES: { key: keyof Cats; label: string; desc: string; locked?: boolean }[] = [
  { key: "essential", label: "Essential", desc: "Required for the site to work.", locked: true },
  { key: "functional", label: "Functional", desc: "Remembers your preferences." },
  { key: "analytics", label: "Analytics", desc: "Helps us understand usage." },
  { key: "marketing", label: "Marketing", desc: "Used for relevant messaging." },
];

export function CookieConsent() {
  const [show, setShow] = useState(false);
  const [customise, setCustomise] = useState(false);
  const [cats, setCats] = useState<Cats>({
    essential: true,
    functional: false,
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    if (!storageGetItem("dpdp-consent")) setShow(true);
    const open = () => {
      setShow(true);
      setCustomise(true);
    };
    window.addEventListener(OPEN_CONSENT_EVENT, open);
    return () => window.removeEventListener(OPEN_CONSENT_EVENT, open);
  }, []);

  const save = (value: Cats) => {
    storageSetJSON("dpdp-consent", { v: "2025-06", ts: Date.now(), cats: value });
    document.documentElement.setAttribute(
      "data-consent",
      Object.entries(value)
        .filter(([, v]) => v)
        .map(([k]) => k)
        .join(" ")
    );
    window.dispatchEvent(new Event("storage"));
    notifyProgressUpdate();
    setShow(false);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={{ type: "tween", duration: 0.35, ease: [0.22, 0.61, 0.36, 1] }}
          className="fixed inset-x-2 bottom-[max(0.5rem,env(safe-area-inset-bottom))] z-[55] mx-auto max-w-xl sm:inset-x-3 sm:bottom-3 sm:max-w-2xl"
        >
          <div className="glass max-h-[min(70vh,32rem)] overflow-y-auto overscroll-contain rounded-xl p-3.5 shadow-glow sm:max-h-none sm:p-5">
            <div className="flex items-start gap-2.5 sm:gap-3">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-line bg-glass text-accent sm:h-10 sm:w-10">
                <Cookie className="h-4 w-4 sm:h-5 sm:w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-display text-sm font-semibold leading-snug text-text sm:text-base">
                    Your data, your choice
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShow(false)}
                    aria-label="Dismiss"
                    className="grid h-7 w-7 shrink-0 place-items-center rounded-pill border border-line text-text-muted hover:text-text sm:hidden"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-text-muted sm:text-sm">
                  <span className="sm:hidden">
                    We use cookies to run and improve TrustStack.{" "}
                  </span>
                  <span className="hidden sm:inline">
                    We use cookies to make TrustStack work and to improve it. Set
                    your preferences - withdrawn as easily as given, the DPDP way.{" "}
                  </span>
                  Read our{" "}
                  <Link href="/privacy" className="text-accent underline underline-offset-2">
                    Privacy Policy
                  </Link>{" "}
                  and{" "}
                  <Link href="/cookies" className="text-accent underline underline-offset-2">
                    Cookie Policy
                  </Link>
                  .
                </p>

                <AnimatePresence>
                  {customise && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-3 space-y-1.5 sm:mt-4 sm:space-y-2">
                        {CATEGORIES.map((c) => (
                          <label
                            key={c.key}
                            className="flex items-center justify-between gap-3 rounded-lg border border-line bg-bg-2/40 px-2.5 py-2 sm:p-3"
                          >
                            <span className="min-w-0">
                              <span className="block text-sm font-medium text-text">
                                {c.label}
                              </span>
                              <span className="block text-[0.7rem] leading-snug text-text-faint sm:text-xs">
                                {c.desc}
                              </span>
                            </span>
                            <input
                              type="checkbox"
                              checked={cats[c.key]}
                              disabled={c.locked}
                              onChange={(e) =>
                                setCats((p) => ({ ...p, [c.key]: e.target.checked }))
                              }
                              className="h-4 w-4 shrink-0 disabled:opacity-50"
                              style={{ accentColor: "var(--accent)" }}
                            />
                          </label>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="mt-3 grid grid-cols-2 gap-1.5 sm:mt-4 sm:flex sm:flex-wrap sm:gap-2">
                  {customise ? (
                    <button
                      type="button"
                      onClick={() => save(cats)}
                      className="btn btn-accent col-span-2 px-3 py-2 text-xs sm:col-span-1 sm:px-5 sm:py-2.5 sm:text-sm"
                    >
                      Save preferences
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setCustomise(true)}
                      className="btn btn-ghost px-3 py-2 text-xs sm:px-5 sm:py-2.5 sm:text-sm"
                    >
                      Customise
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() =>
                      save({
                        essential: true,
                        functional: false,
                        analytics: false,
                        marketing: false,
                      })
                    }
                    className={cn(
                      "btn btn-ghost px-3 py-2 text-xs sm:px-5 sm:py-2.5 sm:text-sm",
                      customise && "col-span-2 sm:col-span-1"
                    )}
                  >
                    <span className="sm:hidden">Reject extras</span>
                    <span className="hidden sm:inline">Reject non-essential</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      save({
                        essential: true,
                        functional: true,
                        analytics: true,
                        marketing: true,
                      })
                    }
                    className={cn(
                      "btn px-3 py-2 text-xs sm:px-5 sm:py-2.5 sm:text-sm",
                      customise ? "btn-ghost col-span-2 sm:col-span-1" : "btn-accent col-span-2 sm:col-span-1"
                    )}
                  >
                    Accept all
                  </button>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShow(false)}
                aria-label="Dismiss"
                className="hidden h-8 w-8 shrink-0 place-items-center rounded-pill border border-line text-text-muted hover:text-text sm:grid"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
