/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        void: "#05060f",
        canvas: "#080a14",
        surface: {
          DEFAULT: "rgba(186, 214, 247, 0.03)",
          raised: "rgba(186, 214, 247, 0.06)",
          panel: "rgba(10, 12, 22, 0.72)",
          solid: "#0c0e1a",
          border: "rgba(186, 215, 247, 0.12)",
          edge: "rgba(186, 215, 247, 0.06)",
        },
        ink: {
          DEFAULT: "#d1e4fa",
          bright: "#ffffff",
          muted: "#c7d3ea",
          faint: "#9da7ba",
          ghost: "#5a6478",
        },
        crimson: {
          DEFAULT: "#fc1c46",
          soft: "rgba(252, 28, 70, 0.12)",
          edge: "rgba(252, 28, 70, 0.32)",
        },
        violet: {
          DEFAULT: "#663af3",
          soft: "rgba(102, 58, 243, 0.14)",
          edge: "rgba(102, 58, 243, 0.36)",
        },
        mint: {
          DEFAULT: "#269684",
          soft: "rgba(38, 150, 132, 0.14)",
          edge: "rgba(38, 150, 132, 0.34)",
        },
        amber: {
          DEFAULT: "#e46d4c",
          soft: "rgba(228, 109, 76, 0.14)",
          edge: "rgba(228, 109, 76, 0.34)",
        },
      },
      fontFamily: {
        display: ["'Space Grotesk'", "system-ui", "sans-serif"],
        sans: ["'Inter'", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "ui-monospace", "monospace"],
      },
      fontSize: {
        eyebrow: ["0.6875rem", { lineHeight: "1.2", letterSpacing: "0.18em" }],
        "display-xl": ["clamp(3.5rem, 11vw, 9.5rem)", { lineHeight: "0.92", letterSpacing: "-0.03em" }],
        "display-lg": ["clamp(2.5rem, 6vw, 4.5rem)", { lineHeight: "0.96", letterSpacing: "-0.025em" }],
        "display-md": ["clamp(1.75rem, 3.5vw, 2.75rem)", { lineHeight: "1.02", letterSpacing: "-0.02em" }],
        stat: ["2.5rem", { lineHeight: "1.05", letterSpacing: "-0.03em" }],
      },
      borderRadius: {
        card: "20px",
        control: "12px",
        pill: "999px",
      },
      boxShadow: {
        hairline: "inset 0 0 0 1px rgba(186, 215, 247, 0.12)",
        glass:
          "inset 0 1px 1px rgba(216, 236, 248, 0.14), inset 0 24px 48px rgba(168, 216, 245, 0.05), 0 16px 32px rgba(0, 0, 0, 0.4)",
        lift:
          "inset 0 1px 1px rgba(216, 236, 248, 0.2), inset 0 24px 48px rgba(168, 216, 245, 0.07), 0 24px 48px rgba(0, 0, 0, 0.55)",
        "glow-crimson": "0 0 24px rgba(252, 28, 70, 0.28)",
        "glow-violet": "0 0 24px rgba(102, 58, 243, 0.3)",
      },
      keyframes: {
        "message-in": {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "report-in": {
          "0%": { opacity: "0", transform: "translateY(12px) scale(0.985)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        "rise-in": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-ring": {
          "0%": { opacity: "0.7", transform: "scale(0.85)" },
          "70%, 100%": { opacity: "0", transform: "scale(1.9)" },
        },
        drift: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
      animation: {
        "message-in": "message-in 0.28s cubic-bezier(0.16, 1, 0.3, 1)",
        "report-in": "report-in 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
        "rise-in": "rise-in 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
        "pulse-ring": "pulse-ring 2.4s cubic-bezier(0.16, 1, 0.3, 1) infinite",
        drift: "drift 6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
