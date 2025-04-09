/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // enable class-based dark mode
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: '1rem',
        sm: '2rem',
        lg: '4rem',
        xl: '5rem',
      },
    },
    extend: {
      colors: {
        // Saint Helen Branding
        'sh-primary': '#20336B',      // Primary blue
        'sh-secondary': '#2E2623',    // Dark Brown
        'sh-light-white': '#f2f2f2',  // Light White
        'sh-sage': '#ACBD9E',         // Light Green
      },
      typography: (theme) => ({
        DEFAULT: {
          css: {
            color: theme('colors.gray.900'),
            a: {
              color: theme('colors.blue.600'),
              '&:hover': {
                color: theme('colors.blue.700'),
              },
            },
            'code::before': {
              content: '""',
            },
            'code::after': {
              content: '""',
            },
          },
        },
      }),
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    function({ addBase, theme }) {
      addBase({
        '.dark': {
          '--tw-prose-body': theme('colors.gray.300'),
          '--tw-prose-headings': theme('colors.white'),
          '--tw-prose-lead': theme('colors.gray.300'),
          '--tw-prose-links': theme('colors.blue.400'),
          '--tw-prose-bold': theme('colors.white'),
          '--tw-prose-counters': theme('colors.gray.400'),
          '--tw-prose-bullets': theme('colors.gray.400'),
          '--tw-prose-hr': theme('colors.gray.600'),
          '--tw-prose-quotes': theme('colors.gray.300'),
          '--tw-prose-quote-borders': theme('colors.gray.600'),
          '--tw-prose-captions': theme('colors.gray.400'),
          '--tw-prose-code': theme('colors.gray.300'),
          '--tw-prose-pre-code': theme('colors.gray.300'),
          '--tw-prose-pre-bg': theme('colors.gray.800'),
          '--tw-prose-th-borders': theme('colors.gray.600'),
          '--tw-prose-td-borders': theme('colors.gray.600'),
        },
      });
    },
  ],
};