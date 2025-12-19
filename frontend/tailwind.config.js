/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        charcoal: "#1A1A1A",
        gold: {
          DEFAULT: "#D4AF37",
          light: "#E5C55D",
          dark: "#B5922B",
        },
        "dark-ember": "#1f1c2c",
        "dark-purple": "#2d2840",
        "light-purple": "#928dab",
        purple: {
          DEFAULT: "#928dab",
          light: "#a89fc4",
          dark: "#6b668c",
        },
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
        "gold-glow": "0 0 15px rgba(212, 175, 55, 0.3)",
        "purple-glow": "0 0 15px rgba(146, 141, 171, 0.3)",
      },
    },
  },
  plugins: [],
};
