/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary:   { DEFAULT: '#2563EB', hover: '#1d4ed8', light: '#eff6ff' },
        secondary: { DEFAULT: '#10B981', hover: '#059669' },
        neutral:   { DEFAULT: '#F3F4F6', dark: '#1f2937' },
        dashly: {
          bg:       '#0f0f13',
          surface:  '#1a1a24',
          border:   '#2a2a3a',
          purple:   '#7c6af7',
          'purple-hover': '#6a58e5',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
