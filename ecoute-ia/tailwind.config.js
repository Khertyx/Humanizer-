/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "media",
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f3f4fd",
          100: "#e4e6fa",
          300: "#aab0ef",
          500: "#5b6ee1",
          600: "#4655c4",
          700: "#39449c",
        },
      },
    },
  },
  plugins: [],
};
