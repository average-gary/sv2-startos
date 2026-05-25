// Mirror of tokens.ts for tailwind.config.js (which is plain JS).
// Keep in sync with tokens.ts.
export const tokens = {
  colors: {
    surface: '#101418',
    'surface-2': '#181D22',
    'surface-3': '#222830',
    'surface-4': '#2D343D',

    border: '#2A323C',
    'border-strong': '#3D4754',

    text: '#E8E2D5',
    'text-strong': '#F4EFE3',
    muted: '#8C9099',
    'muted-2': '#5C6168',

    primary: '#D9923B',
    'primary-dark': '#A66A1F',
    'primary-faint': '#3A2C18',

    success: '#7FA776',
    warning: '#D9A441',
    error: '#C8553D',
    info: '#6E94B0',
  },
  fonts: {
    display: '"Fraunces", "Times New Roman", Georgia, serif',
    sans: '"JetBrains Mono", "SF Mono", Menlo, ui-monospace, monospace',
    mono: '"JetBrains Mono", "SF Mono", Menlo, ui-monospace, monospace',
  },
  radii: {
    none: '0',
    sm: '2px',
    md: '3px',
    lg: '4px',
    xl: '6px',
    pill: '9999px',
  },
}
