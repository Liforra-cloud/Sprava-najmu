/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],  // ← tady chybějící čárka
  theme: {
    extend: {},
  },
  plugins: [],
};
