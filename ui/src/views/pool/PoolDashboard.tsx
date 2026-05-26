import { useGlobal, useClients, useConfig } from '~/api/hooks'
import { MetricCard } from '~/views/shared/MetricCard'
import { DataTable } from '~/views/shared/DataTable'
import { SectionHeader } from '~/views/shared/SectionHeader'
import { QueryGuard } from '~/views/shared/QueryGuard'
import { LastUpdated } from '~/views/shared/LastUpdated'
import { CopyableValue } from '~/views/shared/CopyButton'
import { MetricGridSkeleton, TableSkeleton } from '~/views/shared/Skeleton'
import { formatHashrate, formatNumber, formatUptime } from '~/lib/format'
import { useRecordSample, useTimeseries } from '~/lib/timeseries'
import type { Sv2ClientMetadata } from '~/api/client'

export function PoolDashboard() {
  const global = useGlobal()
  const clients = useClients(0, 50)
  const config = useConfig()

  // Record hashrate into the live timeseries buffer (5 min ring).
  useRecordSample('pool.hashrate', global.data?.sv2_clients?.total_hashrate)
  useRecordSample('pool.miners', global.data?.sv2_clients?.count)
  const hashrateTrend = useTimeseries('pool.hashrate')
  const minersTrend = useTimeseries('pool.miners')

  const cfg = config.data?.raw as
    | {
        listen_address?: string
        authority_public_key?: string
        coinbase_reward_script?: string
        pool_signature?: string
      }
    | undefined

  return (
    <div className="flex flex-col gap-10">
      <section>
        <SectionHeader
          title="Overview"
          subtitle="Live pool stats — trend over last 5 minutes"
          index="01"
          right={<LastUpdated query={global} />}
        />
        <QueryGuard query={global} skeleton={<MetricGridSkeleton count={4} />}>
          {(g) => (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <MetricCard
                label="Pool hashrate"
                value={formatHashrate(g.sv2_clients?.total_hashrate)}
                trend={hashrateTrend}
                trendTone="primary"
              />
              <MetricCard
                label="Connected miners"
                value={formatNumber(g.sv2_clients?.count ?? 0)}
                trend={minersTrend}
                trendTone="success"
              />
              <MetricCard label="Uptime" value={formatUptime(g.uptime_secs)} />
              <MetricCard label="Service" value="Pool" hint="POOL_SV2 0.3.0" />
            </div>
          )}
        </QueryGuard>
      </section>

      <section>
        <SectionHeader
          title="Connection"
          subtitle="Share these with downstreams"
          index="02"
        />
        <QueryGuard query={config} skeleton={<MetricGridSkeleton count={2} />}>
          {() => (
            <div className="grid md:grid-cols-2 gap-3">
              <div className="bg-surface-2 border border-border rounded-md px-4 py-3.5 flex flex-col gap-2 relative overflow-hidden">
                <span
                  aria-hidden
                  className="absolute top-0 right-0 w-2 h-2 border-l border-b border-border-strong"
                />
                <span className="text-[0.6875rem] uppercase tracking-[0.15em] text-muted-2 font-mono">
                  Listen address
                </span>
                <CopyableValue value={cfg?.listen_address ?? ''} />
                <span className="text-[0.6875rem] text-muted font-mono">
                  Downstreams connect here over SV2 noise
                </span>
              </div>
              <div className="bg-surface-2 border border-border rounded-md px-4 py-3.5 flex flex-col gap-2 relative overflow-hidden">
                <span
                  aria-hidden
                  className="absolute top-0 right-0 w-2 h-2 border-l border-b border-border-strong"
                />
                <span className="text-[0.6875rem] uppercase tracking-[0.15em] text-muted-2 font-mono">
                  Authority pubkey
                </span>
                <CopyableValue value={cfg?.authority_public_key ?? ''} truncate />
                <span className="text-[0.6875rem] text-muted font-mono">
                  Public key downstreams use to authenticate this pool
                </span>
              </div>
            </div>
          )}
        </QueryGuard>
      </section>

      <section>
        <SectionHeader
          title="Connected downstreams"
          subtitle="SV2 miners and proxies"
          index="03"
          right={<LastUpdated query={clients} />}
        />
        <QueryGuard query={clients} skeleton={<TableSkeleton rows={4} columns={5} />}>
          {(c) => (
            <DataTable<Sv2ClientMetadata>
              rowKey={(r) => r.id}
              empty="No downstreams connected yet."
              rows={c.clients}
              columns={[
                {
                  key: 'id',
                  header: 'ID',
                  render: (r) => (
                    <span className="text-muted">{r.id.slice(0, 12)}…</span>
                  ),
                },
                {
                  key: 'user',
                  header: 'User',
                  render: (r) =>
                    r.user_identity ?? <span className="text-muted-2">—</span>,
                },
                {
                  key: 'hashrate',
                  header: 'Hashrate',
                  render: (r) => formatHashrate(r.hashrate),
                },
                {
                  key: 'channels',
                  header: 'Channels',
                  render: (r) => formatNumber(r.channels_count),
                },
                {
                  key: 'connected',
                  header: 'Connected',
                  render: (r) => (
                    <span className="text-muted">{r.connected_since}</span>
                  ),
                },
              ]}
            />
          )}
        </QueryGuard>
      </section>
    </div>
  )
}
