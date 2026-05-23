interface Props {
  label: string
  value: string
  hint?: string
  tone?: 'default' | 'positive' | 'warning' | 'negative'
}

const toneClass: Record<NonNullable<Props['tone']>, string> = {
  default: 'text-text',
  positive: 'text-success',
  warning: 'text-warning',
  negative: 'text-error',
}

export function MetricCard({ label, value, hint, tone = 'default' }: Props) {
  return (
    <div className="bg-surface-2 border border-border rounded-lg px-4 py-3 flex flex-col gap-1">
      <span className="text-xs uppercase tracking-wider text-muted">{label}</span>
      <span className={`text-2xl font-mono font-semibold ${toneClass[tone]}`}>{value}</span>
      {hint && <span className="text-xs text-muted">{hint}</span>}
    </div>
  )
}
