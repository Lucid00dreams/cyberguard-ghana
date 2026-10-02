/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "var(--color-ink)",
        guard: "#1B2A6B",
        guardLight: "#2E3F8F",
        signal: "#E8A63D",
        alert: "#E4572E",
        paper: "var(--color-paper)",
        mist: "var(--color-mist)",
        line: "var(--color-line)",
      },
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        body: ["'Inter'", "sans-serif"],
        mono: ["'IBM Plex Mono'", "monospace"],
      },
      keyframes: {
        scan: {
          "0%": { transform: "translateY(0%)" },
          "100%": { transform: "translateY(2000%)" },
        },
      },
      animation: {
        scan: "scan 2.4s linear infinite",
      },
    },
  },
  plugins: [],
};
