import { useGlobal, useServer, useSv1Clients } from '~/api/hooks'
import { MetricCard } from '~/views/shared/MetricCard'
import { DataTable } from '~/views/shared/DataTable'
import { SectionHeader } from '~/views/shared/SectionHeader'
import { QueryGuard } from '~/views/shared/QueryGuard'
import { formatHashrate, formatNumber, formatUptime } from '~/lib/format'
import type { Sv1ClientInfo } from '~/api/client'

export function TranslatorDashboard() {
  const global = useGlobal()
  const server = useServer()
  const sv1 = useSv1Clients(0, 50)

  return (
    <div className="flex flex-col gap-8">
      <section>
        <SectionHeader title="Overview" subtitle="Live translator stats" />
        <QueryGuard query={global}>
          {(g) => (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <MetricCard
                label="Total hashrate"
                value={formatHashrate(g.sv1_clients?.total_hashrate)}
              />
              <MetricCard label="SV1 miners" value={formatNumber(g.sv1_clients?.count ?? 0)} />
              <MetricCard label="Uptime" value={formatUptime(g.uptime_secs)} />
              <MetricCard label="Service" value="TProxy" />
            </div>
          )}
        </QueryGuard>
      </section>

      <section>
        <SectionHeader title="Upstream pool" subtitle="SV2 channel to the pool" />
        <QueryGuard query={server}>
          {(s) => (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <MetricCard label="Channels (extended)" value={formatNumber(s.extended_channels_count)} />
              <MetricCard label="Channels (standard)" value={formatNumber(s.standard_channels_count)} />
              <MetricCard label="Upstream hashrate" value={formatHashrate(s.total_hashrate)} />
            </div>
          )}
        </QueryGuard>
      </section>

      <section>
        <SectionHeader title="Connected SV1 miners" subtitle="Workers connected to TProxy" />
        <QueryGuard query={sv1}>
          {(c) => (
            <DataTable<Sv1ClientInfo>
              rowKey={(r) => r.id}
              empty="No SV1 miners connected yet."
              rows={c.clients}
              columns={[
                { key: 'worker', header: 'Worker', render: (r) => r.worker_name },
                { key: 'hashrate', header: 'Hashrate', render: (r) => formatHashrate(r.hashrate) },
                { key: 'diff', header: 'Difficulty', render: (r) => formatNumber(r.difficulty) },
                { key: 'accepted', header: 'Accepted', render: (r) => formatNumber(r.shares_accepted) },
                { key: 'rejected', header: 'Rejected', render: (r) => formatNumber(r.shares_rejected) },
                {
                  key: 'last',
                  header: 'Last share',
                  render: (r) => <span className="text-muted">{r.last_share_at ?? '—'}</span>,
                },
              ]}
            />
          )}
        </QueryGuard>
      </section>
    </div>
  )
}
