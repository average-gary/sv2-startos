import { parseProm } from './promParser'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, { ...init, headers: { Accept: 'application/json', ...init?.headers } })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} from ${path}`)
  return res.json() as Promise<T>
}

async function requestText(path: string, init?: RequestInit): Promise<string> {
  const res = await fetch(path, {
    ...init,
    headers: { Accept: 'text/plain, */*;q=0.1', ...init?.headers },
  })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} from ${path}`)
  return res.text()
}

// ---- Iroh metrics projection (Prometheus → typed shape) -------------------

export interface IrohActiveConnectionsRow {
  role: string
  transport: 'iroh-direct' | 'iroh-relay'
  value: number
}

export interface IrohConnectionsTotalRow {
  role: string
  transport: string
  direction: string
  outcome: string
  value: number
}

export interface IrohFallbackTotalRow {
  role: string
  reason: string
  value: number
}

export interface IrohMetrics {
  active_connections: IrohActiveConnectionsRow[]
  connections_total: IrohConnectionsTotalRow[]
  fallback_total: IrohFallbackTotalRow[]
  /** Approximate p50 in ms derived from `sv2_iroh_handshake_duration_seconds_bucket`,
   *  or null when no histogram samples are present (e.g. iroh disabled, or no
   *  handshakes have completed yet). */
  handshake_p50_ms: number | null
  /** false when /metrics returned no `sv2_iroh_*` lines (iroh not built /
   *  not enabled). UI should render a "disabled" pill in that case. */
  present: boolean
}

const HISTOGRAM_BUCKETS_SECONDS = [
  0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1.0, 5.0, 30.0,
] as const

function estimateP50Ms(metrics: Map<string, import('./promParser').Sample[]>): number | null {
  const buckets = metrics.get('sv2_iroh_handshake_duration_seconds_bucket')
  if (!buckets || buckets.length === 0) return null

  // Aggregate cumulative counts per `le` across all label combinations.
  const cumByLe = new Map<string, number>()
  for (const s of buckets) {
    const le = s.labels.le
    if (le == null) continue
    cumByLe.set(le, (cumByLe.get(le) ?? 0) + s.value)
  }

  // Total across all roles/directions/outcomes is the `+Inf` bucket sum.
  const total = cumByLe.get('+Inf') ?? cumByLe.get('Inf')
  if (total == null || total <= 0) return null

  const half = total / 2

  // Walk buckets in ascending numeric order and find the first whose
  // cumulative count >= total/2; that bucket's `le` is an upper bound on p50.
  const sortedLes = HISTOGRAM_BUCKETS_SECONDS.map((b) => b.toString())
  for (const le of sortedLes) {
    const cum = cumByLe.get(le)
    if (cum != null && cum >= half) return Number(le) * 1000
  }
  // Fell off the top end of the explicit buckets — p50 lives in (30s, +Inf].
  return 30_000
}

function projectIroh(text: string): IrohMetrics {
  const m = parseProm(text)

  // Detect presence: any sv2_iroh_* family means iroh is built and reporting.
  let present = false
  for (const name of m.keys()) {
    if (name.startsWith('sv2_iroh_')) {
      present = true
      break
    }
  }

  const active_connections: IrohActiveConnectionsRow[] = (
    m.get('sv2_iroh_active_connections') ?? []
  ).map((s) => ({
    role: s.labels.role ?? '',
    transport: (s.labels.transport ?? 'iroh-direct') as 'iroh-direct' | 'iroh-relay',
    value: s.value,
  }))

  const connections_total: IrohConnectionsTotalRow[] = (
    m.get('sv2_iroh_connections_total') ?? []
  ).map((s) => ({
    role: s.labels.role ?? '',
    transport: s.labels.transport ?? '',
    direction: s.labels.direction ?? '',
    outcome: s.labels.outcome ?? '',
    value: s.value,
  }))

  const fallback_total: IrohFallbackTotalRow[] = (
    m.get('sv2_iroh_fallback_total') ?? []
  ).map((s) => ({
    role: s.labels.role ?? '',
    reason: s.labels.reason ?? '',
    value: s.value,
  }))

  return {
    active_connections,
    connections_total,
    fallback_total,
    handshake_p50_ms: present ? estimateP50Ms(m) : null,
    present,
  }
}

export const api = {
  global: () => request<GlobalInfo>('/api/v1/global'),
  health: () => request<HealthInfo>('/api/v1/health'),
  server: () => request<ServerSummary>('/api/v1/server'),
  serverChannels: (offset = 0, limit = 25) =>
    request<ChannelsResponse>(`/api/v1/server/channels?offset=${offset}&limit=${limit}`),
  clients: (offset = 0, limit = 25) =>
    request<ClientsResponse>(`/api/v1/clients?offset=${offset}&limit=${limit}`),
  clientById: (id: string) => request<ClientDetail>(`/api/v1/clients/${encodeURIComponent(id)}`),
  clientChannels: (id: string, offset = 0, limit = 25) =>
    request<ChannelsResponse>(
      `/api/v1/clients/${encodeURIComponent(id)}/channels?offset=${offset}&limit=${limit}`,
    ),
  sv1Clients: (offset = 0, limit = 25) =>
    request<Sv1ClientsResponse>(`/api/v1/sv1/clients?offset=${offset}&limit=${limit}`),
  sv1ClientById: (id: string) => request<Sv1ClientInfo>(`/api/v1/sv1/clients/${encodeURIComponent(id)}`),
  config: () => request<ConfigSnapshot>('/config'),
  metrics: () => requestText('/metrics'),
  iroh: async (): Promise<IrohMetrics> => projectIroh(await requestText('/metrics')),
} as const

// Hand-written shapes mirroring sv2-apps@v0.4.0 monitoring server.
// Replace with `npm run gen:api` output once the OpenAPI codegen is wired up.

export interface HealthInfo {
  status: string
  timestamp: string
}

export interface GlobalInfo {
  server: ServerSummary | null
  sv2_clients: Sv2ClientsSummary | null
  sv1_clients: Sv1ClientsSummary | null
  uptime_secs: number
}

export interface ServerSummary {
  extended_channels_count: number
  standard_channels_count: number
  total_hashrate: number
}

export interface Sv2ClientsSummary {
  count: number
  total_hashrate: number
}

export interface Sv1ClientsSummary {
  count: number
  total_hashrate: number
}

export interface ChannelInfo {
  channel_id: number
  user_identity: string | null
  hashrate: number
  shares_accepted: number
  shares_submitted: number
  shares_rejected: number
  rejection_reasons: Record<string, number>
  best_diff: number
  blocks_found: number
}

export interface ChannelsResponse {
  channels: ChannelInfo[]
  total: number
  offset: number
  limit: number
}

export interface Sv2ClientMetadata {
  id: string
  user_identity: string | null
  hashrate: number
  channels_count: number
  connected_since: string
}

export interface ClientsResponse {
  clients: Sv2ClientMetadata[]
  total: number
  offset: number
  limit: number
}

export interface ClientDetail {
  metadata: Sv2ClientMetadata
  channels_count: number
  hashrate: number
}

export interface Sv1ClientInfo {
  id: string
  worker_name: string
  hashrate: number
  difficulty: number
  shares_accepted: number
  shares_rejected: number
  extranonce: string
  version_rolling_mask: string | null
  last_share_at: string | null
}

export interface Sv1ClientsResponse {
  clients: Sv1ClientInfo[]
  total: number
  offset: number
  limit: number
}

export interface ConfigSnapshot {
  raw: Record<string, unknown>
  redacted_keys: string[]
  service: 'pool' | 'translator' | 'jdc'
  loaded_at: string
}
