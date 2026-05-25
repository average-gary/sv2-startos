import type { UseQueryResult } from '@tanstack/react-query'

export function QueryGuard<T>({
  query,
  children,
  loading = 'ACQUIRING SIGNAL',
  skeleton,
}: {
  query: UseQueryResult<T>
  children: (data: T) => React.ReactNode
  loading?: string
  skeleton?: React.ReactNode
}) {
  if (query.isLoading) {
    if (skeleton) return <>{skeleton}</>
    return (
      <div className="flex items-center gap-2 py-3 text-muted-2">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
        <span className="font-mono text-[0.6875rem] uppercase tracking-[0.2em]">
          {loading}
        </span>
      </div>
    )
  }
  if (query.isError) {
    return (
      <div className="border border-error/40 bg-error/5 rounded-md px-4 py-3 text-sm font-mono">
        <div className="text-[0.6875rem] uppercase tracking-[0.2em] text-error mb-1 font-bold">
          ⚠ Telemetry error
        </div>
        <div className="text-text/90 break-all">{(query.error as Error).message}</div>
      </div>
    )
  }
  if (query.data == null) {
    return (
      <div className="text-muted-2 text-[0.6875rem] uppercase tracking-[0.2em] font-mono py-3">
        No data
      </div>
    )
  }
  return <>{children(query.data)}</>
}
