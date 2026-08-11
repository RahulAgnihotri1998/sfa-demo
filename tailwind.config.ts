import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#f0f4ff",
          100: "#dce6ff",
          200: "#baccff",
          400: "#6190ff",
          500: "#4070f4",
          600: "#2952e3",
          700: "#1f3fc4",
          900: "#0d1a6b",
        },
        surface: "#f0f2f8",
        "surface-dark": "#0f1117",
        risk: "#ef4444",
        warn: "#f59e0b",
        ok: "#10b981",
        accent: "#7c3aed",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(135deg, #2952e3 0%, #7c3aed 100%)",
        "card-glow": "linear-gradient(135deg, rgba(41,82,227,0.08) 0%, rgba(124,58,237,0.06) 100%)",
      },
      boxShadow: {
        "card": "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
        "card-hover": "0 8px 25px rgba(41,82,227,0.12), 0 2px 8px rgba(0,0,0,0.06)",
        "brand": "0 4px 20px rgba(41,82,227,0.3)",
        "glow": "0 0 0 3px rgba(41,82,227,0.15)",
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-up": "slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        "pulse-slow": "pulse 3s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
