/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Custom color palette
        primary: {
          DEFAULT: "#2b2723", // Dark brown/charcoal
          light: "#f0eefc", // Light lavender
          accent: "#eb4520", // Orange/red
        },
        // Override default colors with custom palette
        slate: {
          50: "#f0eefc",
          100: "#f0eefc",
          200: "#f0eefc",
          300: "#2b2723",
          400: "#2b2723",
          500: "#2b2723",
          600: "#2b2723",
          700: "#2b2723",
          800: "#2b2723",
          900: "#2b2723",
          950: "#2b2723",
        },
        white: "#f0eefc",
        black: "#000000",
        indigo: {
          DEFAULT: "#eb4520",
          50: "#f0eefc",
          100: "#f0eefc",
          200: "#f0eefc",
          300: "#eb4520",
          400: "#eb4520",
          500: "#eb4520",
          600: "#eb4520",
          700: "#d63d1c",
          800: "#d63d1c",
          900: "#2b2723",
        },
        purple: {
          DEFAULT: "#eb4520",
          500: "#eb4520",
          600: "#eb4520",
          700: "#d63d1c",
        },
        blue: {
          DEFAULT: "#eb4520",
          500: "#eb4520",
          600: "#eb4520",
          700: "#d63d1c",
        },
        green: {
          DEFAULT: "#2b2723",
          400: "#2b2723",
          500: "#2b2723",
          600: "#2b2723",
          700: "#2b2723",
        },
        red: {
          DEFAULT: "#eb4520",
          100: "#f0eefc",
          200: "#f0eefc",
          300: "#eb4520",
          400: "#eb4520",
          500: "#eb4520",
          600: "#eb4520",
          700: "#d63d1c",
          800: "#d63d1c",
          900: "#2b2723",
        },
        yellow: {
          DEFAULT: "#eb4520",
          500: "#eb4520",
          600: "#eb4520",
        },
      },
      backgroundColor: {
        DEFAULT: "#f0eefc",
      },
      textColor: {
        DEFAULT: "#000000",
      },
      borderColor: {
        DEFAULT: "#2b2723",
      },
    },
  },
  plugins: [],
};
