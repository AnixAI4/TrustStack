import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // anixai.io aligned palette — light professional B2B
        brand: {
          navy:    "#003366",  // primary — anixai.io exact brand color
          "navy-dark": "#001a33",
          "navy-light": "#004080",
          blue:    "#2563EB",  // CTA / interactive
          "blue-light": "#3B82F6",
          "blue-pale": "#EFF6FF",
        },
        surface: {
          DEFAULT:   "#FFFFFF",
          secondary: "#F4F7F9",
          tertiary:  "#F1F5F9",
          card:      "#FFFFFF",
          overlay:   "rgba(0,0,0,0.04)",
        },
        border: {
          DEFAULT: "#E2E8F0",
          light:   "#F1F5F9",
          medium:  "#CBD5E1",
          brand:   "#BFDBFE",
        },
        text: {
          primary:   "#0F172A",
          secondary: "#475569",
          muted:     "#94A3B8",
          inverse:   "#FFFFFF",
          brand:     "#003366",
          blue:      "#2563EB",
        },
        danger: {
          DEFAULT: "#DC2626",
          light:   "#FEF2F2",
          border:  "#FECACA",
          text:    "#B91C1C",
        },
        warning: {
          DEFAULT: "#D97706",
          light:   "#FFFBEB",
          border:  "#FDE68A",
          text:    "#92400E",
        },
        success: {
          DEFAULT: "#059669",
          light:   "#ECFDF5",
          border:  "#A7F3D0",
          text:    "#065F46",
        },
        accent: {
          gold:       "#D97706",
          "gold-light": "#FFFBEB",
        },
        // TrustStack brand palette
        truststack: {
          navy:  '#003366',
          navy2: '#1A5276',
          blue:  '#2874A6',
          ice:   '#D6E4F0',
          teal:  '#0E6655',
        },
      },
      fontFamily: {
        sans:    ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["'Plus Jakarta Sans'", "Inter", "sans-serif"],
        mono:    ["'JetBrains Mono'", "monospace"],
      },
      fontSize: {
        "display-xl": ["4.5rem",  { lineHeight: "1.05", letterSpacing: "-0.03em" }],
        "display-lg": ["3.75rem", { lineHeight: "1.08", letterSpacing: "-0.025em" }],
        "display-md": ["3rem",    { lineHeight: "1.1",  letterSpacing: "-0.02em" }],
        "display-sm": ["2.25rem", { lineHeight: "1.15", letterSpacing: "-0.015em" }],
      },
      backgroundImage: {
        "gradient-hero":  "linear-gradient(135deg, #003366 0%, #004080 50%, #2563EB 100%)",
        "gradient-brand": "linear-gradient(135deg, #003366 0%, #1D4ED8 100%)",
        "gradient-light": "linear-gradient(180deg, #FFFFFF 0%, #F4F7F9 100%)",
        "gradient-radial-blue": "radial-gradient(ellipse at top, #EFF6FF 0%, #FFFFFF 70%)",
        "gradient-cta":   "linear-gradient(135deg, #003366, #2563EB)",
        "grid-light":     "linear-gradient(#E2E8F0 1px, transparent 1px), linear-gradient(90deg, #E2E8F0 1px, transparent 1px)",
      },
      boxShadow: {
        card:        "0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04)",
        "card-hover":"0 4px 16px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.06)",
        nav:         "0 1px 3px rgba(0,0,0,0.08)",
        brand:       "0 4px 20px rgba(37,99,235,0.25)",
        "brand-lg":  "0 8px 30px rgba(37,99,235,0.30)",
        danger:      "0 4px 15px rgba(220,38,38,0.20)",
        soft:        "0 2px 8px rgba(0,0,0,0.06)",
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
      },
      animation: {
        "fade-up":   "fadeUp 0.5s ease-out forwards",
        "fade-in":   "fadeIn 0.4s ease-out forwards",
        "slide-in":  "slideIn 0.4s ease-out forwards",
        "float":     "float 6s ease-in-out infinite",
        "shimmer":   "shimmer 2s linear infinite",
        "pulse-dot": "pulseDot 2s ease-in-out infinite",
        "bounce-gentle": "bounceGentle 2s ease-in-out infinite",
      },
      keyframes: {
        fadeUp:   { "0%": { opacity: "0", transform: "translateY(20px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        fadeIn:   { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        slideIn:  { "0%": { opacity: "0", transform: "translateX(-16px)" }, "100%": { opacity: "1", transform: "translateX(0)" } },
        float:    { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-10px)" } },
        shimmer:  { "0%": { transform: "translateX(-100%)" }, "100%": { transform: "translateX(100%)" } },
        pulseDot: { "0%,100%": { opacity: "1", transform: "scale(1)" }, "50%": { opacity: "0.5", transform: "scale(0.8)" } },
        bounceGentle: { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-5px)" } },
      },
      screens: { xs: "475px", "3xl": "1920px" },
    },
  },
  plugins: [],
};

export default config;
