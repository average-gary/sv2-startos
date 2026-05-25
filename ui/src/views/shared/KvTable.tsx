type Value = string | number | boolean | null | undefined | Value[] | { [k: string]: Value }

function renderValue(v: Value): React.ReactNode {
  if (v === null || v === undefined)
    return <span className="text-muted-2 italic">null</span>
  if (typeof v === 'boolean')
    return <span className="text-info uppercase tracking-wider text-xs font-bold">{String(v)}</span>
  if (typeof v === 'number')
    return <span className="text-warning tabular-nums">{v}</span>
  if (typeof v === 'string') {
    if (v === '') return <span className="text-muted-2 italic">(empty)</span>
    if (v === '***REDACTED***')
      return <span className="text-muted-2 tracking-widest">▪▪▪▪▪▪</span>
    return <span className="text-text">{v}</span>
  }
  if (Array.isArray(v)) {
    if (v.length === 0) return <span className="text-muted-2">[]</span>
    return (
      <ul className="ml-4 list-disc text-text marker:text-muted-2">
        {v.map((item, i) => (
          <li key={i}>{renderValue(item)}</li>
        ))}
      </ul>
    )
  }
  return (
    <div className="mt-1">
      <KvTable data={v} nested />
    </div>
  )
}

export function KvTable({
  data,
  nested = false,
}: {
  data: Record<string, Value>
  nested?: boolean
}) {
  const entries = Object.entries(data)
  if (entries.length === 0)
    return <span className="text-muted-2 italic">(empty)</span>
  return (
    <div
      className={`${
        nested ? 'bg-surface-3/40' : 'bg-surface-2'
      } border border-border rounded-md overflow-hidden`}
    >
      <table className="w-full text-sm">
        <tbody>
          {entries.map(([k, v]) => (
            <tr key={k} className="border-b border-border/40 last:border-0">
              <td className="px-4 py-2.5 text-muted font-mono align-top w-1/3 text-[0.8125rem]">
                {k}
              </td>
              <td className="px-4 py-2.5 font-mono break-all text-[0.8125rem]">
                {renderValue(v)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
