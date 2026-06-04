// Minimal Prometheus exposition-format parser. Pure, no dependencies.
//
// Handles:
//   - blank lines and `# HELP ...` / `# TYPE ...` comments → skipped
//   - `metric_name{label="value",...} <number>` → labelled sample
//   - `metric_name <number>` → label-less sample
//   - histogram suffix metric names (`_bucket`, `_sum`, `_count`) are exposed
//     verbatim as their own metric names; quantile derivation is the caller's job
//   - escaped chars in label values (\\, \", \n)
//
// Trailing per-line timestamps (Prom 0.0.4 spec) are tolerated by ignoring
// anything after the value token.

export interface Sample {
  labels: Record<string, string>
  value: number
}

const LABEL_RE = /([a-zA-Z_][a-zA-Z0-9_]*)="((?:[^"\\]|\\.)*)"/g

function unescapeLabelValue(raw: string): string {
  let out = ''
  for (let i = 0; i < raw.length; i++) {
    const c = raw[i]
    if (c === '\\' && i + 1 < raw.length) {
      const next = raw[i + 1]
      if (next === '\\') out += '\\'
      else if (next === '"') out += '"'
      else if (next === 'n') out += '\n'
      else out += next
      i++
    } else {
      out += c
    }
  }
  return out
}

function parseValue(token: string): number {
  // Prometheus permits +Inf, -Inf, NaN as values.
  if (token === '+Inf' || token === 'Inf') return Number.POSITIVE_INFINITY
  if (token === '-Inf') return Number.NEGATIVE_INFINITY
  if (token === 'NaN') return Number.NaN
  return Number(token)
}

export function parseProm(text: string): Map<string, Sample[]> {
  const out = new Map<string, Sample[]>()
  if (!text) return out

  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue

    // Identify metric name and label block (if any).
    const braceStart = line.indexOf('{')
    let name: string
    let labels: Record<string, string> = {}
    let rest: string

    if (braceStart >= 0) {
      const braceEnd = line.indexOf('}', braceStart)
      if (braceEnd < 0) continue // malformed
      name = line.slice(0, braceStart).trim()
      const labelBlock = line.slice(braceStart + 1, braceEnd)
      rest = line.slice(braceEnd + 1).trim()
      LABEL_RE.lastIndex = 0
      let m: RegExpExecArray | null
      while ((m = LABEL_RE.exec(labelBlock)) !== null) {
        labels[m[1]] = unescapeLabelValue(m[2])
      }
    } else {
      // No labels: split on first whitespace.
      const ws = line.search(/\s/)
      if (ws < 0) continue
      name = line.slice(0, ws).trim()
      rest = line.slice(ws).trim()
    }

    if (!name) continue
    const valueToken = rest.split(/\s+/, 1)[0]
    if (valueToken == null || valueToken === '') continue
    const value = parseValue(valueToken)

    const bucket = out.get(name)
    const sample: Sample = { labels, value }
    if (bucket) bucket.push(sample)
    else out.set(name, [sample])
  }

  return out
}
