/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class', // enable dark theme switch
  theme: {
    extend: {
      colors: {
        primary: 'hsl(210, 85%, 45%)',
        accent:  'hsl(340, 80%, 55%)',
        surface: 'hsl(210, 30%, 12%)',
      },
    },
  },
  plugins: [],
};
