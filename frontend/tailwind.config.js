/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        fitverse: {
          purple: "#A875D5",
          "purple-hover": "#945ec1",
          lavender: "#F2E8FA",
          "lavender-light": "#F7F1FC",
          "lavender-dark": "#DBC7ED",
          green: "#A8D89B",
          "green-success": "#22C55E",
          "mint": "#EAF6E8",
          peach: "#FCE8DF",
          bg: "#FCFAFD",
          card: "#FFFFFF",
          dark: "#302044",
          muted: "#766D80",
          "muted-light": "#B4AEBD",
          error: "#EF4444",
          "error-light": "#FEE2E2",
          "error-border": "#FCA5A5"
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(168, 117, 213, 0.08), 0 2px 6px -1px rgba(0, 0, 0, 0.02)',
        'soft-hover': '0 10px 25px -4px rgba(168, 117, 213, 0.16), 0 4px 10px -2px rgba(0, 0, 0, 0.04)',
        'card': '0 2px 12px rgba(140, 115, 175, 0.06)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      }
    },
  },
  plugins: [],
}

