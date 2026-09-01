import type { Config } from "tailwindcss";

const config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: ["var(--font-mono)", "monospace"],
        display: ["var(--font-display)", "'Arial Narrow'", "sans-serif"],
        dot: ["var(--font-dot)", "monospace"],
      },
      colors: {
        gold: "#d4a657",
        black: "#0a0a0a",
        "dark-gray": "#1a1a1a",
        field: "#060606",
        hole: "#000000",
        raised: "#0B0B0A",
        paper: "#E6E1D6",
        ash: "#8C8880",
        ghostmeta: "#4A4842",
        wire: "#26251F",
        ghost: "#1A1915",
        ember: "#FF4B11",
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: "100%",
          },
        },
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
} satisfies Config;

export default config;
