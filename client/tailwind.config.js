/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        /* ── Rentora Brand Design System ── */
        brand: {
          linen:         '#FAF7F2',
          slate:         '#202B36',
          slateLight:    '#263743',
          slateBorder:   '#293342',
          crimson:       '#9E1B1B',
          crimsonHover:  '#801414',
          crimsonLight:  '#E8AEAE',
          teal:          '#22716E',
          tealLight:     '#5FD2CA',
          coral:         '#F27B58',
          amber:         '#F5B46E',
          amberLight:    '#FFF0CE',
          border:        '#42525B',
        },

        /* ── Semantic & Primary Color Shades ── */
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        border:     'hsl(var(--border))',
        card: {
          DEFAULT:    'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        primary: {
          DEFAULT:    '#9E1B1B',
          50:         '#fef2f2',
          100:        '#fee2e2',
          200:        '#fecaca',
          300:        '#fca5a5',
          400:        '#f87171',
          500:        '#b91c1c',
          600:        '#9E1B1B',
          700:        '#801414',
          800:        '#661010',
          900:        '#4d0b0b',
          950:        '#2d0606',
          foreground: '#FFFFFF',
        },
        sidebar: {
          DEFAULT:    'hsl(var(--sidebar))',
          foreground: 'hsl(var(--sidebar-foreground))',
        },
      },

      fontFamily: {
        display: ['"Space Grotesk"', 'Outfit', 'sans-serif'],
        sans:    ['"DM Sans"', '"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },

      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },

      boxShadow: {
        'card':   '0 4px 20px -4px rgba(25, 42, 53, 0.09), 0 1px 4px -1px rgba(25, 42, 53, 0.06)',
        'lift':   '0 14px 30px -10px rgba(25, 42, 53, 0.14)',
        'tile':   '0 10px 25px -5px rgba(25, 42, 53, 0.15), 0 8px 10px -6px rgba(25, 42, 53, 0.1)',
        'inner-soft': 'inset 0 2px 6px -2px rgba(25, 42, 53, 0.07)',
        'crimson': '0 8px 20px -6px rgba(158, 27, 27, 0.35)',
        'teal':    '0 8px 20px -6px rgba(34, 113, 110, 0.3)',
      },

      rotate: {
        '6': '6deg',
        '8': '8deg',
        '-6': '-6deg',
        '-8': '-8deg',
      },

      keyframes: {
        'fade-up': {
          '0%':   { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-left': {
          '0%':   { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'scale-in': {
          '0%':   { opacity: '0', transform: 'scale(0.92)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'shimmer': {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.6' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-6px)' },
        },
      },

      animation: {
        'fade-up':        'fade-up 0.4s ease forwards',
        'slide-in-left':  'slide-in-left 0.35s ease forwards',
        'scale-in':       'scale-in 0.3s ease forwards',
        'shimmer':        'shimmer 1.5s infinite',
        'pulse-soft':     'pulse-soft 2s ease-in-out infinite',
        'float':          'float 4s ease-in-out infinite',
      },

      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
    },
  },
  plugins: [],
}
