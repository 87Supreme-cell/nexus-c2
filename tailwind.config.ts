import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        c2: {
          bg: "#06090e",
          card: "rgba(13, 19, 31, 0.75)",
          cardBorder: "rgba(0, 240, 255, 0.18)",
          cyan: "#00f0ff",
          cyanDim: "rgba(0, 240, 255, 0.12)",
          green: "#00ff9d",
          amber: "#ffb000",
          red: "#ff3b5c",
          purple: "#9d4edd",
          surface: "#0b121e",
          surfaceHover: "#121d30",
          textMuted: "#7a889b",
          border: "#1a2638",
        },
      },
      fontFamily: {
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "Liberation Mono",
          "Courier New",
          "monospace",
        ],
      },
      boxShadow: {
        "cyan-glow": "0 0 20px -3px rgba(0, 240, 255, 0.25)",
        "green-glow": "0 0 20px -3px rgba(0, 255, 157, 0.25)",
        "amber-glow": "0 0 20px -3px rgba(255, 176, 0, 0.25)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "scanline": "scanline 8s linear infinite",
      },
      keyframes: {
        scanline: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(1000%)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
