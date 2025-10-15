import type { Config } from 'tailwindcss'

export default {
  content: [
    './index.html',
    './src/**/*.{vue,js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#07080F',
          secondary: '#090B15'
        },
        accent: {
          DEFAULT: '#4B3F8A',
          light: '#6B5FBA',
          dim: '#2E264F'
        },
        surface: '#0D0F1C',
        ink: '#F5F4F2'
      },
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        body: ['DM Sans', 'sans-serif']
      }
    }
  },
  plugins: []
} satisfies Config
