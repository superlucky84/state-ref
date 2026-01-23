/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#4f46e5',
          secondary: '#6366f1',
          dark: '#1e1b4b',
        },
      },
    },
  },
  plugins: [],
};
