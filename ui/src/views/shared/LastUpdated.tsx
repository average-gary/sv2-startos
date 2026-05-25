import { useEffect, useState } from 'react'
import type { UseQueryResult } from '@tanstack/react-query'
import { formatRelativeTime } from '~/lib/format'

/**
 * "Last updated 4s ago" — operators need to know how stale the snapshot is.
 * Upstream's monitoring cache can be up to monitoring_cache_refresh_secs (15s)
 * stale, so this matters.
 */
export function LastUpdated({
  query,
  className = '',
}: {
  query: UseQueryResult<unknown>
  className?: string
}) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1_000)
    return () => clearInterval(id)
  }, [])

  if (!query.dataUpdatedAt) return null
  const ageSec = Math.max(0, (now - query.dataUpdatedAt) / 1000)
  const stale = ageSec > 20 // refetch is 5s; if we're past 20 the link is hurting

  return (
    <span
      className={`font-mono text-[0.6875rem] uppercase tracking-[0.15em] flex items-center gap-1.5 ${
        stale ? 'text-warning' : 'text-muted-2'
      } ${className}`}
      aria-live="polite"
    >
      <span
        className={`inline-block w-1 h-1 rounded-full ${
          stale ? 'bg-warning' : 'bg-success'
        }`}
      />
      {query.isFetching ? 'Refreshing' : `Last sync ${formatRelativeTime(ageSec)}`}
    </span>
  )
}
