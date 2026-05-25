type Tone = 'success' | 'warning' | 'error' | 'info' | 'muted'

const toneClass: Record<Tone, string> = {
  success: 'text-success',
  warning: 'text-warning',
  error: 'text-error',
  info: 'text-info',
  muted: 'text-muted',
}

const dotClass: Record<Tone, string> = {
  success: 'bg-success',
  warning: 'bg-warning',
  error: 'bg-error',
  info: 'bg-info',
  muted: 'bg-muted-2',
}

/**
 * StatusPill — instrument indicator. Square corners, signal lamp + label.
 * No filled chips. The lamp does the work.
 */
export function StatusPill({
  children,
  tone = 'muted',
}: {
  children: React.ReactNode
  tone?: Tone
}) {
  return (
    <span
      className={`inline-flex items-center gap-2 border border-border-strong px-2.5 py-1 rounded-sm text-[0.6875rem] font-mono font-bold uppercase tracking-[0.15em] ${toneClass[tone]}`}
    >
      <span className="relative inline-flex">
        <span className={`block w-1.5 h-1.5 rounded-full ${dotClass[tone]}`} />
        {tone === 'success' && (
          <span
            className={`absolute inset-0 rounded-full ${dotClass[tone]} animate-ping opacity-60`}
          />
        )}
      </span>
      {children}
    </span>
  )
}
