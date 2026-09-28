import type { Config } from "tailwindcss";
/** Design tokens live here and nowhere else. */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: { 950: "#071A33", 900: "#0F2A4A", 700: "#24476F", 500: "#4A6C94", 100: "#E4EBF3" },
        lagos: { 800: "#0B5A33", 700: "#0E6B3A", 600: "#138049", 100: "#DDF1E5", 50: "#EEF8F2" },
        gold: { 500: "#E0A526", 400: "#F0BC48", 100: "#FBF0D3" },
        mint: "#EAF6EF", paper: "#F6F9F7",
        surface: { DEFAULT: "#FFFFFF", muted: "#F5F7FA", line: "#DFE5EC" },
        ink: { DEFAULT: "#14213D", soft: "#4B5A70", faint: "#6B7A90" },
        ok: "#0E7A43", warn: "#B7791F", danger: "#C0342B", info: "#1F6FB5",
      },
      fontFamily: { sans: ["Manrope", "Inter", "system-ui", "sans-serif"], display: ["Fraunces", "Georgia", "serif"] },
      fontSize: { display: ["clamp(2.75rem, 1.6rem + 5.6vw, 6rem)", { lineHeight: "1.0", letterSpacing: "-0.03em", fontWeight: "500" }], h1: ["clamp(2rem, 1.4rem + 2.2vw, 3rem)", { lineHeight: "1.15", letterSpacing: "-0.02em", fontWeight: "800" }], h2: ["1.75rem", { lineHeight: "1.2", letterSpacing: "-0.015em", fontWeight: "700" }], h3: ["1.125rem", { lineHeight: "1.35", fontWeight: "700" }] },
      borderRadius: { sm: "4px", DEFAULT: "6px", lg: "10px", xl: "16px", "2xl": "24px" },
      boxShadow: { card: "0 1px 2px rgba(15,42,74,.06), 0 4px 14px rgba(15,42,74,.05)", float: "0 10px 30px rgba(15,42,74,.16)" },
      transitionDuration: { fast: "120ms", base: "200ms", slow: "500ms" },
      screens: { xs: "420px", sm: "640px", md: "768px", lg: "1024px", xl: "1280px", "2xl": "1440px", "3xl": "1920px" },
      keyframes: {
        sweep: { "0%": { transform: "translate3d(-60%,0,0) skewX(-18deg)" }, "100%": { transform: "translate3d(260%,0,0) skewX(-18deg)" } },
        drift: { "0%,100%": { transform: "translate3d(0,0,0)" }, "50%": { transform: "translate3d(0,-10px,0)" } },
        shimmer: { "100%": { transform: "translate3d(100%,0,0)" } },
        attn: { "0%": { transform: "scale(1)", opacity: ".6" }, "100%": { transform: "scale(1.035)", opacity: "0" } },
        pulseRing: { "0%": { boxShadow: "0 0 0 0 rgb(224 165 38 / .45)" }, "100%": { boxShadow: "0 0 0 14px rgb(224 165 38 / 0)" } },
      },
      animation: { shimmer: "shimmer 1.4s ease-in-out infinite", sweep: "sweep 9s ease-in-out infinite", drift: "drift 7s ease-in-out infinite", "pulse-ring": "pulseRing 2.2s ease-out 2", attn: "attn 2s ease-out 2" },
    },
  },
} satisfies Config;
