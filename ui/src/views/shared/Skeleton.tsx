/**
 * Field Station skeletons. Hairline rectangles that shimmer at radar
 * cadence — instrument warming up, not iOS app loading.
 */

function Bar({ className = '' }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`inline-block bg-surface-3 rounded-sm animate-pulse ${className}`}
    />
  )
}

export function MetricCardSkeleton() {
  return (
    <div className="bg-surface-2 border border-border rounded-md px-4 py-3.5 flex flex-col gap-2 relative overflow-hidden">
      <span
        aria-hidden
        className="absolute top-0 right-0 w-2 h-2 border-l border-b border-border-strong"
      />
      <Bar className="h-2.5 w-20" />
      <Bar className="h-7 w-32" />
      <Bar className="h-2.5 w-16" />
    </div>
  )
}

export function MetricGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <MetricCardSkeleton key={i} />
      ))}
    </div>
  )
}

export function TableSkeleton({
  rows = 4,
  columns = 5,
}: {
  rows?: number
  columns?: number
}) {
  return (
    <div className="bg-surface-2 border border-border rounded-md overflow-hidden">
      <div className="border-b border-border-strong bg-surface-3/40 px-4 py-2.5 flex gap-6">
        {Array.from({ length: columns }).map((_, i) => (
          <Bar key={i} className="h-2 w-16" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className={`border-b border-border/40 last:border-0 px-4 py-3 flex gap-6 ${
            i % 2 === 1 ? 'bg-surface-2/40' : ''
          }`}
        >
          {Array.from({ length: columns }).map((_, j) => (
            <Bar
              key={j}
              className={`h-3 ${j === 0 ? 'w-24' : j === columns - 1 ? 'w-16' : 'w-20'}`}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

export function KvSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="bg-surface-2 border border-border rounded-md overflow-hidden">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="border-b border-border/40 last:border-0 px-4 py-2.5 flex gap-6"
        >
          <Bar className="h-3 w-32" />
          <Bar className="h-3 flex-1 max-w-md" />
        </div>
      ))}
    </div>
  )
}
