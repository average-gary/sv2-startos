import { useGlobal, useClients } from '~/api/hooks'
import { MetricCard } from '~/views/shared/MetricCard'
import { DataTable } from '~/views/shared/DataTable'
import { SectionHeader } from '~/views/shared/SectionHeader'
import { QueryGuard } from '~/views/shared/QueryGuard'
import { formatHashrate, formatNumber, formatUptime } from '~/lib/format'
import type { Sv2ClientMetadata } from '~/api/client'

export function PoolDashboard() {
  const global = useGlobal()
  const clients = useClients(0, 50)

  return (
    <div className="flex flex-col gap-8">
      <section>
        <SectionHeader title="Overview" subtitle="Live pool stats" />
        <QueryGuard query={global}>
          {(g) => (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <MetricCard
                label="Pool hashrate"
                value={formatHashrate(g.sv2_clients?.total_hashrate)}
              />
              <MetricCard label="Connected miners" value={formatNumber(g.sv2_clients?.count ?? 0)} />
              <MetricCard label="Uptime" value={formatUptime(g.uptime_secs)} />
              <MetricCard label="Service" value="Pool" />
            </div>
          )}
        </QueryGuard>
      </section>

      <section>
        <SectionHeader title="Connected downstreams" subtitle="SV2 miners and proxies" />
        <QueryGuard query={clients}>
          {(c) => (
            <DataTable<Sv2ClientMetadata>
              rowKey={(r) => r.id}
              empty="No downstreams connected yet."
              rows={c.clients}
              columns={[
                { key: 'id', header: 'ID', render: (r) => <span className="text-muted">{r.id.slice(0, 12)}…</span> },
                { key: 'user', header: 'User', render: (r) => r.user_identity ?? <span className="text-muted">—</span> },
                { key: 'hashrate', header: 'Hashrate', render: (r) => formatHashrate(r.hashrate) },
                { key: 'channels', header: 'Channels', render: (r) => formatNumber(r.channels_count) },
                {
                  key: 'connected',
                  header: 'Connected',
                  render: (r) => <span className="text-muted">{r.connected_since}</span>,
                },
              ]}
            />
          )}
        </QueryGuard>
      </section>
    </div>
  )
}
