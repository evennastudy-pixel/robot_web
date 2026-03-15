/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f1fe',
          100: '#e0e3fd',
          200: '#c1c6fb',
          300: '#a3aaf9',
          400: '#848df7',
          500: '#5157E8',
          600: '#4146ba',
          700: '#31348b',
          800: '#20235d',
          900: '#10112e',
        },
        secondary: {
          50: '#eef5ff',
          100: '#dceaff',
          200: '#b9d6ff',
          300: '#95c1ff',
          400: '#72adff',
          500: '#2563EB',
          600: '#1e4fbc',
          700: '#163b8d',
          800: '#0f275e',
          900: '#07142f',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      boxShadow: {
        'soft': '0 4px 6px rgba(0, 0, 0, 0.05)',
        'hover': '0 12px 20px rgba(0, 0, 0, 0.1)',
      },
    },
  },
  plugins: [],
} 