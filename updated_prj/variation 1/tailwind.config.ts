import type { Config } from "tailwindcss";

/**
 * Variation 1 - a from-scratch, high-tech design system (no legacy CSS).
 * Tokens are defined as CSS variables in globals.css and exposed to Tailwind
 * here. Dark is the default theme; light is an explicit [data-theme="light"]
 * override (toggle persists to localStorage key `dpdp-theme`, shared with the
 * reused vanilla-JS widgets).
 */
const config: Config = {
  darkMode: ["selector", '[data-theme="dark"]'],
  content: [
    "./src/components/**/*.{ts,tsx}",
    "./src/app/**/*.{ts,tsx}",
    "./src/content/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "rgb(var(--bg-rgb) / <alpha-value>)",
        "bg-2": "rgb(var(--bg-2-rgb) / <alpha-value>)",
        surface: "rgb(var(--surface-rgb) / <alpha-value>)",
        "surface-2": "rgb(var(--surface-2-rgb) / <alpha-value>)",
        glass: "var(--glass)",
        line: "var(--line)",
        "line-soft": "var(--line-soft)",
        text: "rgb(var(--text-rgb) / <alpha-value>)",
        "text-muted": "rgb(var(--text-muted-rgb) / <alpha-value>)",
        "text-faint": "rgb(var(--text-faint-rgb) / <alpha-value>)",
        accent: {
          DEFAULT: "rgb(var(--accent-rgb) / <alpha-value>)",
          soft: "rgb(var(--accent-soft-rgb) / <alpha-value>)",
          strong: "rgb(var(--accent-strong-rgb) / <alpha-value>)",
        },
        amber: "rgb(var(--amber-rgb) / <alpha-value>)",
        brand: {
          DEFAULT: "rgb(var(--brand-rgb) / <alpha-value>)",
          soft: "rgb(var(--brand-soft-rgb) / <alpha-value>)",
        },
        green: {
          DEFAULT: "rgb(var(--green-rgb) / <alpha-value>)",
          soft: "rgb(var(--green-soft-rgb) / <alpha-value>)",
        },
        blue: {
          DEFAULT: "rgb(var(--blue-rgb) / <alpha-value>)",
          soft: "rgb(var(--blue-soft-rgb) / <alpha-value>)",
        },
        red: {
          DEFAULT: "rgb(var(--red-rgb) / <alpha-value>)",
          soft: "rgb(var(--red-soft-rgb) / <alpha-value>)",
        },
        gold: "rgb(var(--gold-rgb) / <alpha-value>)",
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
        serif: ["Georgia", "Cambria", "Times New Roman", "serif"],
        deva: ["var(--font-deva)", "serif"],
      },
      // Fluid type-scale tokens live as --fs-* in globals.css. Only the
      // non-colliding `label` step is surfaced to Tailwind so every built-in
      // text-* size keeps working; `text-label` is the >=12px micro-label floor.
      fontSize: {
        label: "var(--fs-label)",
      },
      // Headings previously used tight (negative) tracking which made the wide
      // display face read "narrow/cramped". Neutralise it so letters breathe.
      letterSpacing: {
        tighter: "0em",
        tight: "0em",
      },
      borderRadius: {
        sm: "8px",
        DEFAULT: "14px",
        lg: "20px",
        xl: "28px",
        pill: "999px",
      },
      maxWidth: {
        container: "1200px",
        prose: "72ch",
      },
      boxShadow: {
        glow: "0 0 0 1px var(--line), 0 18px 60px -20px var(--glow)",
        card: "0 1px 0 var(--inset-hi) inset, 0 16px 40px -24px rgba(0,0,0,.6)",
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        float: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "spin-slow": {
          to: { transform: "rotate(360deg)" },
        },
        "pulse-ring": {
          "0%": { transform: "scale(.8)", opacity: "0.7" },
          "100%": { transform: "scale(2.2)", opacity: "0" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        marquee: "marquee 38s linear infinite",
        float: "float 7s ease-in-out infinite",
        "spin-slow": "spin-slow 26s linear infinite",
        "pulse-ring": "pulse-ring 2.6s ease-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
