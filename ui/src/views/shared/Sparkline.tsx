import type { Sample } from '~/lib/timeseries'

interface Props {
  samples: Sample[]
  width?: number
  height?: number
  /** Tone class for the path. Defaults to primary. */
  tone?: 'primary' | 'success' | 'warning' | 'error' | 'muted'
  /** When true, draws a hairline baseline at the min value */
  baseline?: boolean
  /** Show endpoint dot — feels like a live readout */
  endpoint?: boolean
}

const STROKE: Record<NonNullable<Props['tone']>, string> = {
  primary: 'stroke-primary',
  success: 'stroke-success',
  warning: 'stroke-warning',
  error: 'stroke-error',
  muted: 'stroke-muted-2',
}

const FILL: Record<NonNullable<Props['tone']>, string> = {
  primary: 'fill-primary',
  success: 'fill-success',
  warning: 'fill-warning',
  error: 'fill-error',
  muted: 'fill-muted-2',
}

const AREA: Record<NonNullable<Props['tone']>, string> = {
  primary: 'fill-primary/10',
  success: 'fill-success/10',
  warning: 'fill-warning/10',
  error: 'fill-error/10',
  muted: 'fill-muted-2/10',
}

/**
 * Field Station sparkline. Hand-rolled SVG, no chart library.
 * Renders nothing (placeholder dashes) when fewer than 2 samples exist.
 */
export function Sparkline({
  samples,
  width = 96,
  height = 28,
  tone = 'primary',
  baseline = false,
  endpoint = true,
}: Props) {
  if (samples.length < 2) {
    return (
      <span
        aria-hidden
        className="inline-flex items-center gap-0.5 text-muted-2 text-[0.5rem] tracking-widest font-mono"
        style={{ width, height }}
      >
        ─ ─ ─ ─ ─ ─
      </span>
    )
  }

  const xs = samples.map((s) => s.t)
  const ys = samples.map((s) => s.v)
  const tMin = xs[0]
  const tMax = xs[xs.length - 1]
  const tSpan = tMax - tMin || 1
  const yMin = Math.min(...ys)
  const yMax = Math.max(...ys)
  const ySpan = yMax - yMin || 1

  // 2px padding so the stroke doesn't get clipped at edges
  const pad = 2
  const w = width - pad * 2
  const h = height - pad * 2

  const px = (i: number) => pad + ((xs[i] - tMin) / tSpan) * w
  // Invert y because SVG origin is top-left
  const py = (i: number) => pad + (1 - (ys[i] - yMin) / ySpan) * h

  let d = `M ${px(0)} ${py(0)}`
  for (let i = 1; i < samples.length; i++) {
    d += ` L ${px(i)} ${py(i)}`
  }

  // Area fill (closes path back to baseline)
  const lastX = px(samples.length - 1)
  const firstX = px(0)
  const baseY = pad + h
  const area = `${d} L ${lastX} ${baseY} L ${firstX} ${baseY} Z`

  const lastIdx = samples.length - 1
  const ex = px(lastIdx)
  const ey = py(lastIdx)

  return (
    <svg
      role="img"
      aria-label="Trend"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="block"
    >
      {baseline && (
        <line
          x1={pad}
          x2={width - pad}
          y1={baseY}
          y2={baseY}
          className="stroke-border-strong"
          strokeWidth={0.5}
          strokeDasharray="2 3"
        />
      )}
      <path d={area} className={AREA[tone]} />
      <path
        d={d}
        className={STROKE[tone]}
        fill="none"
        strokeWidth={1.25}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {endpoint && (
        <>
          <circle cx={ex} cy={ey} r={3.5} className={FILL[tone]} opacity={0.18} />
          <circle cx={ex} cy={ey} r={1.5} className={FILL[tone]} />
        </>
      )}
    </svg>
  )
}
