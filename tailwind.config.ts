import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        carbon: {
          950: "#0b0b0a",
          925: "#11110f",
          900: "#171512",
          850: "#1d1a16",
          800: "#25211d",
          700: "#312d29"
        },
        brand: {
          50: "#fff7f1",
          100: "#ffe8d6",
          200: "#ffc98f",
          300: "#ffad5d",
          400: "#ff8f31",
          500: "#ff7a1a",
          600: "#ef5f00",
          700: "#c94d00",
          800: "#8b3700"
        },
        accent: {
          300: "#f9d6a2",
          400: "#f1ba5b",
          500: "#d9891c",
          600: "#b86f14"
        }
      },
      boxShadow: {
        glow: "0 18px 42px rgba(255, 122, 26, 0.18)",
        app: "0 20px 48px rgba(0, 0, 0, 0.32)",
        panel: "0 18px 38px rgba(0, 0, 0, 0.26)",
        soft: "0 10px 24px rgba(15, 15, 15, 0.2)"
      }
    }
  },
  plugins: []
};

export default config;
