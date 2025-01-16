/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // enable class-based dark mode
  theme: {
    extend: {
      colors: {
        // Saint Helen Branding
        'sh-primary': '#20336B',      // Primary
        'sh-secondary': '#2E2623',    // Dark Brown
        'sh-light-white': '#f2f2f2',  // Light White
        'sh-sage': '#ACBD9E',         // Light Green
        // Add any optional accent colors if desired
      },
    },
  },
  plugins: [],
};
