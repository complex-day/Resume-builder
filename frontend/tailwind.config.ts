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
        canvas: "#F8FAFC",
        surface: "#FFFFFF",
        primary: {
          DEFAULT: "#0F172A",
          muted: "#475569",
        },
        accent: {
          DEFAULT: "#059669",
          hover: "#047857",
          light: "#ECFDF5",
        },
        dark: {
          canvas: "#09090B",
          surface: "#111114",
          border: "#27272A",
          muted: "#18181B",
          text: "#F4F4F5",
          subtext: "#A1A1AA",
        },
      },
      fontFamily: {
        sans: [
          "var(--font-sans)",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        mono: [
          "var(--font-mono)",
          "monospace",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
