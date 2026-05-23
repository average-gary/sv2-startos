import { tokens } from './src/styles/tokens.js'

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: tokens.colors,
      fontFamily: {
        sans: tokens.fonts.sans.split(', '),
        mono: tokens.fonts.mono.split(', '),
      },
      borderRadius: tokens.radii,
    },
  },
  plugins: [],
}
