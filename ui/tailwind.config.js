import { tokens } from './src/styles/tokens.js'

// Split a CSS font stack into a Tailwind-compatible array of family names.
// Quoted families with spaces stay quoted as one element.
function fontStack(stack) {
  const out = []
  let i = 0
  while (i < stack.length) {
    if (stack[i] === '"') {
      const end = stack.indexOf('"', i + 1)
      out.push(stack.slice(i, end + 1))
      i = end + 1
      while (i < stack.length && (stack[i] === ',' || stack[i] === ' ')) i++
    } else {
      const next = stack.indexOf(',', i)
      const chunk = (next === -1 ? stack.slice(i) : stack.slice(i, next)).trim()
      if (chunk) out.push(chunk)
      i = next === -1 ? stack.length : next + 1
    }
  }
  return out
}

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: tokens.colors,
      fontFamily: {
        // The body voice is monospace — mining is mechanical, the UI is too.
        sans: fontStack(tokens.fonts.sans),
        mono: fontStack(tokens.fonts.mono),
        display: fontStack(tokens.fonts.display),
      },
      borderRadius: tokens.radii,
      letterSpacing: {
        widest: '0.2em',
        ultra: '0.32em',
      },
      boxShadow: {
        instrument: '0 1px 0 rgba(0,0,0,0.4), 0 4px 12px rgba(0,0,0,0.25)',
      },
    },
  },
  plugins: [],
}
