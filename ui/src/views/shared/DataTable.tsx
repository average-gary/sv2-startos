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
      <div className="bg-surface-2 border border-border rounded-lg px-4 py-8 text-center text-muted">
        {empty}
      </div>
    )
  }
  return (
    <div className="bg-surface-2 border border-border rounded-lg overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            {columns.map((c) => (
              <th
                key={c.key}
                className={`text-left px-4 py-2 text-xs uppercase tracking-wider text-muted font-medium ${c.className ?? ''}`}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={rowKey(r)} className="border-b border-border/50 last:border-0 hover:bg-surface-3">
              {columns.map((c) => (
                <td key={c.key} className={`px-4 py-2 font-mono ${c.className ?? ''}`}>
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
