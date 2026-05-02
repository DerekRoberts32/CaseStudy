/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        mono: ['"JetBrains Mono"', 'monospace'],
        sans: ['"DM Sans"', 'sans-serif'],
      },
      colors: {
        bg: '#0a0b0e',
        surface: '#13151a',
        border: '#1e2028',
        muted: '#2a2d38',
        accent: '#00d4aa',
        'accent-dim': '#00d4aa22',
        warn: '#f59e0b',
        danger: '#ef4444',
        text: {
          primary: '#e8eaf0',
          secondary: '#8b90a0',
          dim: '#4a4f60',
        },
      },
    },
  },
  plugins: [],
}
