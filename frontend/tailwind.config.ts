import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // QuillaBlocks palette
        rojo: "#E63946",
        naranja: "#F77F00",
        amarillo: "#FFD23F",
        verde: "#3FAE94",
        navy: {
          DEFAULT: "#1A2238",
          900: "#11172B",
          800: "#1A2238",
          700: "#222C48",
          600: "#2C3759",
        },
      },
      fontFamily: {
        sans: ["Poppins", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "ui-monospace", "monospace"],
      },
      fontSize: {
        // projector-friendly sizes
        "hero": ["clamp(3rem, 9vw, 8rem)", { lineHeight: "0.92", letterSpacing: "-0.04em" }],
        "amount": ["clamp(2.5rem, 7vw, 6.5rem)", { lineHeight: "1", letterSpacing: "-0.03em" }],
      },
      animation: {
        "marquee": "marquee 30s linear infinite",
        "pulse-strong": "pulse-strong 1.8s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-up": "fade-up 0.5s ease-out forwards",
        "shine": "shine 2.5s ease-in-out infinite",
        "confetti-fall": "confetti-fall 3s linear forwards",
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "pulse-strong": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.55" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shine: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "confetti-fall": {
          "0%": { transform: "translateY(-10vh) rotate(0deg)", opacity: "1" },
          "100%": { transform: "translateY(110vh) rotate(720deg)", opacity: "0" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
