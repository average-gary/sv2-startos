interface Column<T> {
  key: string
  header: string
  render: (row: T) => React.ReactNode
  className?: string
}

interface Props<T> {
  columns: Column<T>[]
  rows: T[]
  rowKey: (row: T) => string
  empty?: string
}

export function DataTable<T>({ columns, rows, rowKey, empty = 'No data yet.' }: Props<T>) {
  if (rows.length === 0) {
    return (
      <div className="bg-surface-2 border border-border rounded-md px-4 py-10 text-center">
        <span className="text-[0.6875rem] uppercase tracking-[0.2em] text-muted-2 font-mono">
          {empty}
        </span>
      </div>
    )
  }
  return (
    <div className="bg-surface-2 border border-border rounded-md overflow-x-auto">
      <table className="w-full text-sm tabular">
        <thead>
          <tr className="border-b border-border-strong bg-surface-3/40">
            {columns.map((c) => (
              <th
                key={c.key}
                className={`text-left px-4 py-2.5 text-[0.6875rem] uppercase tracking-[0.15em] text-muted-2 font-mono font-bold ${c.className ?? ''}`}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, idx) => (
            <tr
              key={rowKey(r)}
              className={`border-b border-border/40 last:border-0 hover:bg-surface-3/60 transition-colors ${
                idx % 2 === 1 ? 'bg-surface-2/40' : ''
              }`}
            >
              {columns.map((c) => (
                <td key={c.key} className={`px-4 py-2.5 font-mono text-text ${c.className ?? ''}`}>
                  {c.render(r)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
