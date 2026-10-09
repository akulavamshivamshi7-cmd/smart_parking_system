/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#0a0f1d',
          900: '#0f172a',
          800: '#1e293b',
          700: '#334155',
          600: '#475569',
        },
        teal: {
          DEFAULT: '#0d9488',
          dark: '#0f766e',
          light: '#14b8a6',
          50: '#f0fdfa',
          100: '#ccfbf1',
        },
        parking: {
          available: '#22c55e',
          occupied: '#ef4444',
          reserved: '#f97316',
          maintenance: '#64748b',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
