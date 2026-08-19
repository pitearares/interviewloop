/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: "#12141a",
          raised: "#181b22",
          panel: "#1c1f28",
          border: "#2a2e38",
        },
        accent: {
          DEFAULT: "#5b8def",
          muted: "#3d5a8f",
        },
        ink: {
          DEFAULT: "#e4e6eb",
          muted: "#9096a3",
          faint: "#5c6270",
        },
      },
      fontFamily: {
        mono: ["'JetBrains Mono'", "'Fira Code'", "ui-monospace", "monospace"],
        sans: ["'Inter'", "system-ui", "sans-serif"],
      },
      keyframes: {
        "message-in": {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "report-in": {
          "0%": { opacity: "0", transform: "translateY(8px) scale(0.98)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
      },
      animation: {
        "message-in": "message-in 0.25s ease-out",
        "report-in": "report-in 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [],
};
