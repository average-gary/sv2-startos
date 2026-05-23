async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, { ...init, headers: { Accept: 'application/json', ...init?.headers } })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} from ${path}`)
  return res.json() as Promise<T>
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
