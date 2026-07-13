import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        carbon: {
          950: "#071014",
          900: "#0c171c",
          850: "#112127",
          800: "#193139"
        },
        brand: {
          300: "#7dd3fc",
          400: "#38bdf8",
          500: "#14b8a6",
          600: "#0d9488",
          700: "#0f766e"
        },
        accent: {
          400: "#fbbf24",
          500: "#f59e0b"
        }
      },
      boxShadow: {
        glow: "0 24px 80px rgba(20, 184, 166, 0.18)",
        app: "0 18px 70px rgba(0, 0, 0, 0.32)"
      }
    }
  },
  plugins: []
};

export default config;
