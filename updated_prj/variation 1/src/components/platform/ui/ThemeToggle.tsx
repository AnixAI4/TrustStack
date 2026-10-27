"use client";

import { Sun, Moon } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { motion, AnimatePresence } from "framer-motion";

export default function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      className={`relative w-9 h-9 rounded-xl border flex items-center justify-center transition-all duration-200 overflow-hidden
        ${theme === "dark"
          ? "bg-brand-blue-pale border-brand-blue/30 text-brand-blue hover:bg-brand-blue hover:text-white"
          : "bg-surface-secondary border-border text-text-muted hover:border-border-medium hover:text-brand-navy"
        } ${className}`}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={theme}
          initial={{ rotate: 90, opacity: 0, scale: 0.6 }}
          animate={{ rotate: 0, opacity: 1, scale: 1 }}
          exit={{ rotate: -90, opacity: 0, scale: 0.6 }}
          transition={{ duration: 0.18 }}
        >
          {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </motion.div>
      </AnimatePresence>
    </button>
  );
}
