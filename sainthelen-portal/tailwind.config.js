/** @type {import('tailwindcss').Config} */

// Every colour below points at a CSS variable in app/globals.css, which holds
// the light and dark values. Use these utilities (bg-surface, text-ink-2,
// border-line, bg-navy …) rather than Tailwind's grey/blue palettes.
const token = (name) => `var(--${name})`;

module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    container: {
      center: true,
      padding: { DEFAULT: '1rem', sm: '1.5rem', lg: '2rem' },
    },
    extend: {
      colors: {
        canvas: token('canvas'),
        surface: { DEFAULT: token('surface'), 2: token('surface-2') },
        line: { DEFAULT: token('line'), 2: token('line-2') },
        ink: { DEFAULT: token('ink'), 2: token('ink-2'), 3: token('ink-3') },
        navy: { DEFAULT: token('navy'), hover: token('navy-hover'), soft: token('navy-soft') },
        'on-navy': token('on-navy'),
        rust: token('rust'),
        focus: token('focus'),
        // Status: -d dot, -bg tinted background, -t text
        status: {
          'review-d': token('s-review-d'), 'review-bg': token('s-review-bg'), 'review-t': token('s-review-t'),
          'approval-d': token('s-approval-d'), 'approval-bg': token('s-approval-bg'), 'approval-t': token('s-approval-t'),
          'approved-d': token('s-approved-d'), 'approved-bg': token('s-approved-bg'), 'approved-t': token('s-approved-t'),
          'scheduled-d': token('s-scheduled-d'), 'scheduled-bg': token('s-scheduled-bg'), 'scheduled-t': token('s-scheduled-t'),
          'done-d': token('s-done-d'), 'done-bg': token('s-done-bg'), 'done-t': token('s-done-t'),
        },
        // Request types
        type: {
          ann: token('t-ann'), web: token('t-web'), text: token('t-text'),
          av: token('t-av'), design: token('t-design'), photo: token('t-photo'),
        },

        // Legacy brand scales, kept until every page is on the tokens above
        'sh-navy': {
          50: '#E8EBF3', 100: '#D1D7E7', 200: '#A3AFCF', 300: '#7587B7', 400: '#475F9F',
          500: '#1F346D', 600: '#1A2C5C', 700: '#15244B', 800: '#101C3A', 900: '#0B1429', DEFAULT: '#1F346D',
        },
        'sh-rust': {
          50: '#FCF0EC', 100: '#F9E1D9', 200: '#F3C3B3', 300: '#EDA58D', 400: '#E78767',
          500: '#CD5334', 600: '#B8472A', 700: '#983B23', 800: '#782F1C', 900: '#582315', DEFAULT: '#CD5334',
        },
        'sh-cream': { DEFAULT: '#faf9f7', light: '#f5f3f0', dark: '#eceae6' },
        'sh-primary': '#1F346D',
        'sh-primary-light': '#475F9F',
        'sh-primary-dark': '#15244B',
        'sh-accent': '#CD5334',

        // shadcn-style aliases used by components/ui
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: { DEFAULT: 'hsl(var(--card))', foreground: 'hsl(var(--card-foreground))' },
        popover: { DEFAULT: 'hsl(var(--popover))', foreground: 'hsl(var(--popover-foreground))' },
        primary: { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' },
        secondary: { DEFAULT: 'hsl(var(--secondary))', foreground: 'hsl(var(--secondary-foreground))' },
        muted: { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
        accent: { DEFAULT: 'hsl(var(--accent))', foreground: 'hsl(var(--accent-foreground))' },
        destructive: { DEFAULT: 'hsl(var(--destructive))', foreground: 'hsl(var(--destructive-foreground))' },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
      },
      fontFamily: {
        sans: ['var(--font-sans)'],
        serif: ['var(--font-serif)'],
      },
      fontSize: {
        // name: [size, line-height]
        xs: ['12px', '16px'],
        sm: ['13px', '18px'],
        base: ['14px', '20px'],
        md: ['15px', '22px'],
        lg: ['17px', '24px'],
        xl: ['20px', '26px'],
        '2xl': ['24px', '30px'],
      },
      borderRadius: {
        sm: '4px',
        DEFAULT: '6px',
        md: '6px',
        lg: '8px',
        xl: '12px',
      },
      boxShadow: {
        card: 'var(--shadow-card)',
        pop: 'var(--shadow-pop)',
      },
      spacing: {
        4.5: '18px',
      },
      typography: (theme) => ({
        DEFAULT: {
          css: {
            color: 'var(--ink)',
            a: { color: 'var(--navy)' },
            'h1, h2, h3, h4': { color: 'var(--ink)', fontFamily: 'var(--font-sans)' },
            'code::before': { content: '""' },
            'code::after': { content: '""' },
          },
        },
      }),
      keyframes: {
        'fade-in': { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
      },
      animation: {
        'fade-in': 'fade-in 150ms ease-out',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('tailwindcss-animate'),
  ],
};
