import { useState } from 'react'

/**
 * Inline copy-to-clipboard control. Brand-matched: uppercase mono label,
 * beacon-amber on hover/copied, square corners.
 */
export function CopyButton({
  value,
  label = 'Copy',
  className = '',
}: {
  value: string
  label?: string
  className?: string
}) {
  const [copied, setCopied] = useState(false)

  async function onClick() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Older browsers / non-secure contexts. Surface but don't crash.
      console.warn('[Pioneer Hash UI] clipboard write failed')
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={copied ? 'Copied' : `Copy ${label}`}
      className={`font-mono text-[0.6875rem] uppercase tracking-[0.15em] font-bold border rounded-sm px-2 py-1 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-primary ${
        copied
          ? 'border-success text-success'
          : 'border-border-strong text-muted hover:border-primary hover:text-primary'
      } ${className}`}
    >
      {copied ? '✓ Copied' : label}
    </button>
  )
}

/**
 * "Copyable string" row — the value sits inline with the button.
 * Used for authority pubkeys, connection URLs, etc.
 */
export function CopyableValue({
  value,
  truncate = false,
}: {
  value: string
  truncate?: boolean
}) {
  return (
    <div className="flex items-center gap-3 group">
      <code
        className={`font-mono text-[0.8125rem] text-text bg-surface-3/40 border border-border rounded-sm px-2 py-1 flex-1 ${
          truncate ? 'truncate' : 'break-all'
        }`}
      >
        {value}
      </code>
      <CopyButton value={value} />
    </div>
  )
}
