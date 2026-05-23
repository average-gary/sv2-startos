type Tone = 'success' | 'warning' | 'error' | 'info' | 'muted'

const toneClass: Record<Tone, string> = {
  success: 'bg-success/15 text-success border-success/30',
  warning: 'bg-warning/15 text-warning border-warning/30',
  error: 'bg-error/15 text-error border-error/30',
  info: 'bg-info/15 text-info border-info/30',
  muted: 'bg-surface-3 text-muted border-border',
}

export function StatusPill({ children, tone = 'muted' }: { children: React.ReactNode; tone?: Tone }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full border text-xs font-medium ${toneClass[tone]}`}
    >
      {children}
    </span>
  )
}
