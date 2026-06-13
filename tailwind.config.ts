import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        carbon: {
          950: "#070707",
          900: "#111111",
          850: "#171717",
          800: "#202020"
        },
        brand: {
          500: "#f97316",
          600: "#ea580c",
          700: "#c2410c"
        }
      },
      boxShadow: {
        glow: "0 24px 80px rgba(249, 115, 22, 0.18)"
      }
    }
  },
  plugins: []
};

export default config;
