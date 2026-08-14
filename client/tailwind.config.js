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
        // Sleek modern color palette
        primary: {
          50: '#f5f8ff',
          100: '#ebf1fe',
          200: '#dde7fe',
          300: '#c4d5fd',
          400: '#a2bcfa',
          500: '#7395f7',
          600: '#466bf2',
          700: '#274de8',
          800: '#1b3bcf',
          900: '#122aa7',
          950: '#0b1666',
        },
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
