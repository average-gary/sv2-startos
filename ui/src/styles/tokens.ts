/**
 * Pioneer Hash brand tokens — Field Station system.
 *
 * Aesthetic: instrument panel from a high-altitude scientific outpost.
 * Cream on deep iron-slate, signal amber accents, vintage-radar moss.
 * NOT bitcoin orange. NOT crypto-bro neon.
 *
 * See BRAND.md for usage rules.
 */
export const tokens = {
  colors: {
    // Core surfaces — deep, cool, just-warm-enough to feel built rather than digital
    surface: '#101418',        // ink — deepest, page background
    'surface-2': '#181D22',    // iron — raised cards, header
    'surface-3': '#222830',    // slate — table rows on hover, popovers
    'surface-4': '#2D343D',    // graphite — input fills, code blocks

    border: '#2A323C',         // hairline rule
    'border-strong': '#3D4754',// emphasized divider

    // Foreground — warm cream, not pure white
    text: '#E8E2D5',           // bone — primary text
    'text-strong': '#F4EFE3',  // chalk — display headings, KPI numbers
    muted: '#8C9099',          // lichen — secondary text
    'muted-2': '#5C6168',      // gravel — tertiary, captions

    // Signal — single load-bearing accent. Amber like a beacon, not orange.
    primary: '#D9923B',        // beacon — primary CTAs, active state
    'primary-dark': '#A66A1F', // weathered beacon — hover/pressed
    'primary-faint': '#3A2C18',// beacon shadow — subtle backgrounds

    // Status — chosen to feel mechanical, not retail-app cheerful
    success: '#7FA776',        // moss — vintage radar green
    warning: '#D9A441',        // sodium — caution lamp
    error: '#C8553D',          // rust — flag, not panic-red
    info: '#6E94B0',           // overcast — informational chrome
  },
  fonts: {
    // Fraunces: variable serif with optical sizing — display, big numbers, brand wordmark
    display: '"Fraunces", "Times New Roman", Georgia, serif',
    // JetBrains Mono: everything else. Body, UI, data. Monospace as voice.
    sans: '"JetBrains Mono", "SF Mono", Menlo, ui-monospace, monospace',
    mono: '"JetBrains Mono", "SF Mono", Menlo, ui-monospace, monospace',
  },
  radii: {
    none: '0',
    sm: '2px',     // hairline corners — instruments, not consumer apps
    md: '3px',
    lg: '4px',
    xl: '6px',
    pill: '9999px',
  },
  // Type ramp — modular scale ~1.250 (major third)
  type: {
    'display-2xl': { size: '3.75rem', leading: '1.05', tracking: '-0.025em' },
    'display-xl':  { size: '2.75rem', leading: '1.05', tracking: '-0.02em' },
    'display-lg':  { size: '2rem',    leading: '1.1',  tracking: '-0.015em' },
    h1:            { size: '1.5rem',  leading: '1.2',  tracking: '-0.01em' },
    h2:            { size: '1.125rem',leading: '1.3',  tracking: '0' },
    body:          { size: '0.875rem',leading: '1.5',  tracking: '0' },
    small:         { size: '0.75rem', leading: '1.4',  tracking: '0.02em' },
    caption:       { size: '0.6875rem',leading: '1.3', tracking: '0.08em' },
  },
  // Elevation — single subtle shadow, never glows. Field instruments don't glow.
  shadow: {
    sm: '0 1px 0 rgba(0,0,0,0.4)',
    md: '0 1px 0 rgba(0,0,0,0.4), 0 4px 12px rgba(0,0,0,0.25)',
  },
  // Brand metadata
  brand: {
    name: 'PIONEER HASH',
    tagline: 'Self-sovereign mining infrastructure',
    motto: 'AD ULTRA HASH', // mission-patch latin
  },
} as const
