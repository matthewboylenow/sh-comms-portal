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
        // Saint Helen Branding - Enhanced with WCAG AA compliance
        'sh-primary': '#1B2B5A',      // Primary blue (darker for better contrast)
        'sh-primary-light': '#2D3E6F', // Lighter primary (still AA compliant)
        'sh-primary-dark': '#14214A', // Darker primary
        'sh-secondary': '#1F1A17',    // Dark Brown (darker for better contrast)
        'sh-secondary-light': '#3A2F2B', // Lighter brown (better contrast)
        'sh-light-white': '#f8f9fa',  // Brighter white for better contrast
        'sh-sage': '#7A956B',         // Darker sage for better contrast on light backgrounds
        'sh-sage-light': '#8FA582',  // Adjusted sage light
        'sh-sage-dark': '#67855A',   // Darker sage for AA compliance
        // Modern UI Colors
        'gray-850': '#1f2937',
        'gray-925': '#111827',
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'soft-lg': '0 8px 30px -5px rgba(0, 0, 0, 0.08), 0 25px 60px -15px rgba(0, 0, 0, 0.06)',
        'inner-soft': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.04)',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '1.75rem',
      },
      backdropBlur: {
        'xs': '2px',
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