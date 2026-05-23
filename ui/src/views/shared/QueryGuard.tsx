import type { UseQueryResult } from '@tanstack/react-query'

export function QueryGuard<T>({
  query,
  children,
  loading = 'Loading…',
}: {
  query: UseQueryResult<T>
  children: (data: T) => React.ReactNode
  loading?: string
}) {
  if (query.isLoading) {
    return <div className="text-muted text-sm py-2">{loading}</div>
  }
  if (query.isError) {
    return (
      <div className="bg-error/10 border border-error/30 text-error rounded-lg px-3 py-2 text-sm">
        {(query.error as Error).message}
      </div>
    )
  }
  if (query.data == null) {
    return <div className="text-muted text-sm py-2">No data.</div>
  }
  return <>{children(query.data)}</>
}
