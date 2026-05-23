type Value = string | number | boolean | null | undefined | Value[] | { [k: string]: Value }

function renderValue(v: Value): React.ReactNode {
  if (v === null || v === undefined) return <span className="text-muted">null</span>
  if (typeof v === 'boolean') return <span className="text-info">{String(v)}</span>
  if (typeof v === 'number') return <span className="text-warning">{v}</span>
  if (typeof v === 'string') {
    if (v === '') return <span className="text-muted italic">(empty)</span>
    return <span>{v}</span>
  }
  if (Array.isArray(v)) {
    if (v.length === 0) return <span className="text-muted">[]</span>
    return (
      <ul className="ml-4 list-disc">
        {v.map((item, i) => (
          <li key={i}>{renderValue(item)}</li>
        ))}
      </ul>
    )
  }
  return <KvTable data={v} />
}

export function KvTable({ data }: { data: Record<string, Value> }) {
  const entries = Object.entries(data)
  if (entries.length === 0) return <span className="text-muted italic">(empty)</span>
  return (
    <div className="bg-surface-2 border border-border rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <tbody>
          {entries.map(([k, v]) => (
            <tr key={k} className="border-b border-border/50 last:border-0">
              <td className="px-4 py-2 text-muted font-mono align-top w-1/3">{k}</td>
              <td className="px-4 py-2 font-mono break-all">{renderValue(v)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
