/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
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
        // Saint Helen Parish Design System
        'sh-navy': {
          DEFAULT: '#1F346D',
          50: '#E8EBF3',
          100: '#D1D7E7',
          200: '#A3AFCF',
          300: '#7587B7',
          400: '#475F9F',
          500: '#1F346D',
          600: '#1A2C5C',
          700: '#15244B',
          800: '#101C3A',
          900: '#0B1429',
        },
        'sh-rust': {
          DEFAULT: '#CD5334',
          50: '#FCF0EC',
          100: '#F9E1D9',
          200: '#F3C3B3',
          300: '#EDA58D',
          400: '#E78767',
          500: '#CD5334',
          600: '#B8472A',
          700: '#983B23',
          800: '#782F1C',
          900: '#582315',
        },
        'sh-cream': {
          DEFAULT: '#faf9f7',
          light: '#f5f3f0',
          dark: '#eceae6',
        },
        // Legacy compatibility
        'sh-primary': '#1F346D',
        'sh-primary-light': '#475F9F',
        'sh-primary-dark': '#15244B',
        'sh-accent': '#CD5334',
        // Modern UI grays
        'gray-850': '#1f2937',
        'gray-925': '#111827',
      },
      fontFamily: {
        'serif': ['var(--font-baskerville)', 'Georgia', 'serif'],
        'sans': ['var(--font-franklin)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'soft-lg': '0 8px 30px -5px rgba(0, 0, 0, 0.08), 0 25px 60px -15px rgba(0, 0, 0, 0.06)',
        'card': '0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 20px 40px -15px rgba(31, 52, 109, 0.15), 0 10px 20px -10px rgba(31, 52, 109, 0.1)',
        'button': '0 4px 6px -1px rgba(31, 52, 109, 0.1), 0 2px 4px -1px rgba(31, 52, 109, 0.06)',
        'button-hover': '0 10px 15px -3px rgba(31, 52, 109, 0.15), 0 4px 6px -2px rgba(31, 52, 109, 0.1)',
        'inner-soft': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.04)',
      },
      borderRadius: {
        'card': '12px',
        'card-lg': '16px',
        'button': '8px',
        'button-pill': '50px',
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '1.75rem',
      },
      transitionTimingFunction: {
        'bouncy': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      transitionDuration: {
        '250': '250ms',
        '350': '350ms',
      },
      backgroundImage: {
        'gradient-navy': 'linear-gradient(135deg, #1F346D 0%, #2D4A8C 100%)',
        'gradient-rust': 'linear-gradient(135deg, #CD5334 0%, #E07556 100%)',
        'gradient-youth': 'linear-gradient(135deg, #FF6B6B 0%, #4ECDC4 25%, #45B7D1 50%, #96E6A1 75%, #DDA0DD 100%)',
        'gradient-card-top': 'linear-gradient(90deg, #1F346D 0%, #CD5334 100%)',
      },
      typography: (theme) => ({
        DEFAULT: {
          css: {
            color: theme('colors.gray.900'),
            a: {
              color: theme('colors.sh-rust.DEFAULT'),
              '&:hover': {
                color: theme('colors.sh-rust.600'),
              },
            },
            'h1, h2, h3, h4, h5, h6': {
              fontFamily: theme('fontFamily.serif').join(', '),
              color: theme('colors.sh-navy.DEFAULT'),
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
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-up': 'slide-up 0.4s ease-out',
        'scale-in': 'scale-in 0.2s ease-out',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    function({ addBase, addComponents, theme }) {
      addBase({
        '.dark': {
          '--tw-prose-body': theme('colors.gray.300'),
          '--tw-prose-headings': theme('colors.white'),
          '--tw-prose-lead': theme('colors.gray.300'),
          '--tw-prose-links': theme('colors.sh-rust.400'),
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
      // Saint Helen component classes
      addComponents({
        '.sh-card': {
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e5e5e5',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.06)',
          transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          '&:hover': {
            transform: 'translateY(-6px)',
            boxShadow: '0 20px 40px -15px rgba(31, 52, 109, 0.15), 0 10px 20px -10px rgba(31, 52, 109, 0.1)',
            borderColor: '#d4d4d4',
          },
        },
        '.sh-card-gradient': {
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: '0',
            left: '0',
            right: '0',
            height: '4px',
            background: 'linear-gradient(90deg, #1F346D 0%, #CD5334 100%)',
          },
        },
        '.sh-btn': {
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: '500',
          borderRadius: '8px',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
          },
        },
        '.sh-btn-primary': {
          backgroundColor: '#1F346D',
          color: '#ffffff',
          '&:hover': {
            backgroundColor: '#15244B',
            boxShadow: '0 10px 15px -3px rgba(31, 52, 109, 0.15), 0 4px 6px -2px rgba(31, 52, 109, 0.1)',
          },
        },
        '.sh-btn-accent': {
          backgroundColor: '#CD5334',
          color: '#ffffff',
          '&:hover': {
            backgroundColor: '#B8472A',
            boxShadow: '0 10px 15px -3px rgba(205, 83, 52, 0.15), 0 4px 6px -2px rgba(205, 83, 52, 0.1)',
          },
        },
        '.sh-section-cream': {
          backgroundColor: '#faf9f7',
        },
        '.sh-section-cream-alt': {
          backgroundColor: '#f5f3f0',
        },
      });
    },
  ],
};
