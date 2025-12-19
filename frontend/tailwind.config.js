/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'dark-ember': '#1f1c2c',
        'dark-purple': '#2d2840',
        'light-purple': '#928dab',
      },
    },
  },
  plugins: [],
}
