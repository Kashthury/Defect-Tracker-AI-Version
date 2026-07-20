/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#0B1220',
          900: '#111A2C',
          800: '#1A2338',
          700: '#26314A',
          600: '#3A4763',
          500: '#586582',
          400: '#8B96AC',
          300: '#B9C1D1',
          200: '#DCE1EA',
          100: '#EEF1F6',
          50: '#F6F8FB',
        },
        brand: {
          50: '#EEF7FC',
          100: '#DCEFFA',
          200: '#B9DFF1',
          700: '#0D3B66',
          600: '#12507F',
          500: '#1768A6',
          400: '#2E8FC9',
          300: '#6FB6DE',
        },
        signal: {
          critical: '#C13B3B',
          high: '#D97A3F',
          medium: '#C99A2E',
          low: '#3E8E64',
          info: '#3E6FBF',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        panel: '0 1px 2px rgba(11,18,32,0.06), 0 1px 0 rgba(11,18,32,0.04)',
        floating: '0 12px 32px rgba(11,18,32,0.16)',
      },
      borderRadius: {
        sm: '4px',
        md: '6px',
        lg: '8px',
      },
    },
  },
  plugins: [],
}
