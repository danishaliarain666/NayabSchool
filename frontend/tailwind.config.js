/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#0c2340', dark: '#081829', light: '#1a3a5c' },
        navy: { DEFAULT: '#0c2340', dark: '#060f1a', light: '#1a3a5c' },
        gold: { DEFAULT: '#d4a017', dark: '#b8860b', light: '#e8c547' },
        secondary: '#FFFFFF',
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
