import type { Sample } from '~/lib/timeseries'
import { Sparkline } from './Sparkline'

interface Props {
  label: string
  value: string
  hint?: string
  tone?: 'default' | 'positive' | 'warning' | 'negative'
  /** Optional sparkline samples — renders a small inline trend chart */
  trend?: Sample[]
  /** Tone for the trend chart (defaults to primary) */
  trendTone?: 'primary' | 'success' | 'warning' | 'error' | 'muted'
}

const toneClass: Record<NonNullable<Props['tone']>, string> = {
  default: 'text-text-strong',
  positive: 'text-success',
  warning: 'text-warning',
  negative: 'text-error',
}

/**
 * MetricCard — instrument-panel readout.
 * Label sits above a hairline rule; value uses Fraunces for KPI presence.
 * Optional `trend` shows the last 5 minutes as a sparkline overlapping the value.
 */
export function MetricCard({ label, value, hint, tone = 'default', trend, trendTone = 'primary' }: Props) {
  return (
    <div className="bg-surface-2 border border-border rounded-md px-4 py-3.5 flex flex-col gap-1.5 relative overflow-hidden">
      {/* Corner tick — subtle reference mark, like a chart corner */}
      <span
        aria-hidden
        className="absolute top-0 right-0 w-2 h-2 border-l border-b border-border-strong"
      />
      <div className="flex items-center justify-between gap-2">
        <span className="text-[0.6875rem] uppercase tracking-[0.15em] text-muted-2 font-mono">
          {label}
        </span>
        {trend && trend.length >= 2 && (
          <Sparkline samples={trend} width={72} height={22} tone={trendTone} />
        )}
      </div>
      <span
        className={`font-display text-[1.875rem] leading-none font-medium tabular-nums tracking-tight ${toneClass[tone]}`}
      >
        {value}
      </span>
      {hint && (
        <span className="text-[0.6875rem] text-muted font-mono uppercase tracking-[0.1em]">
          {hint}
        </span>
      )}
    </div>
  )
}
