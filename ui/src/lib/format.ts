const HASH_UNITS = ['H/s', 'KH/s', 'MH/s', 'GH/s', 'TH/s', 'PH/s', 'EH/s']

export function formatHashrate(h: number | null | undefined): string {
  if (h == null || !Number.isFinite(h)) return '—'
  if (h === 0) return '0 H/s'
  const i = Math.min(Math.floor(Math.log10(h) / 3), HASH_UNITS.length - 1)
  return `${(h / 10 ** (i * 3)).toFixed(2)} ${HASH_UNITS[i]}`
}

export function formatNumber(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return '—'
  return new Intl.NumberFormat('en-US').format(n)
}

export function formatRelativeTime(secondsAgo: number | null | undefined): string {
  if (secondsAgo == null || !Number.isFinite(secondsAgo)) return '—'
  if (secondsAgo < 60) return `${Math.round(secondsAgo)}s ago`
  if (secondsAgo < 3_600) return `${Math.round(secondsAgo / 60)}m ago`
  if (secondsAgo < 86_400) return `${Math.round(secondsAgo / 3_600)}h ago`
  return `${Math.round(secondsAgo / 86_400)}d ago`
}

export function formatUptime(seconds: number | null | undefined): string {
  if (seconds == null || !Number.isFinite(seconds)) return '—'
  const d = Math.floor(seconds / 86_400)
  const h = Math.floor((seconds % 86_400) / 3_600)
  const m = Math.floor((seconds % 3_600) / 60)
  if (d > 0) return `${d}d ${h}h`
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

export function formatPercent(n: number | null | undefined, digits = 1): string {
  if (n == null || !Number.isFinite(n)) return '—'
  return `${(n * 100).toFixed(digits)}%`
}
