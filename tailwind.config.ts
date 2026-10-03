import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eefbf4",
          100: "#d6f5e3",
          200: "#b0eacc",
          300: "#7cd9ae",
          400: "#46c08b",
          500: "#22a571",
          600: "#15855b",
          700: "#126a4b",
          800: "#11543d",
          900: "#0e4533",
          950: "#07271d",
        },
        surface: {
          DEFAULT: "#0b1220",
          card: "#111a2e",
          raised: "#182338",
          border: "#223052",
        },
      },
      fontFamily: {
        sans: ["system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
