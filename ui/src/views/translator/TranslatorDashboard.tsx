import { useGlobal, useServer, useSv1Clients } from '~/api/hooks'
import { MetricCard } from '~/views/shared/MetricCard'
import { DataTable } from '~/views/shared/DataTable'
import { SectionHeader } from '~/views/shared/SectionHeader'
import { QueryGuard } from '~/views/shared/QueryGuard'
import { LastUpdated } from '~/views/shared/LastUpdated'
import { MetricGridSkeleton, TableSkeleton } from '~/views/shared/Skeleton'
import {
  formatHashrate,
  formatNumber,
  formatPercent,
  formatUptime,
} from '~/lib/format'
import { useRecordSample, useTimeseries } from '~/lib/timeseries'
import type { Sv1ClientInfo } from '~/api/client'

export function TranslatorDashboard() {
  const global = useGlobal()
  const server = useServer()
  const sv1 = useSv1Clients(0, 50)

  useRecordSample('translator.hashrate', global.data?.sv1_clients?.total_hashrate)
  useRecordSample('translator.upstream', server.data?.total_hashrate)
  const hashrateTrend = useTimeseries('translator.hashrate')
  const upstreamTrend = useTimeseries('translator.upstream')

  // Aggregate share counts + reject reasons across all SV1 miners.
  const totals = (() => {
    if (!sv1.data) return null
    let accepted = 0
    let rejected = 0
    for (const c of sv1.data.clients) {
      accepted += c.shares_accepted
      rejected += c.shares_rejected
    }
    const submitted = accepted + rejected
    const acceptRate = submitted > 0 ? accepted / submitted : null
    return { accepted, rejected, submitted, acceptRate }
  })()

  return (
    <div className="flex flex-col gap-10">
      <section>
        <SectionHeader
          title="Overview"
          subtitle="Live translator stats"
          index="01"
          right={<LastUpdated query={global} />}
        />
        <QueryGuard query={global} skeleton={<MetricGridSkeleton count={4} />}>
          {(g) => (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <MetricCard
                label="Total hashrate"
                value={formatHashrate(g.sv1_clients?.total_hashrate)}
                trend={hashrateTrend}
                trendTone="primary"
              />
              <MetricCard
                label="SV1 miners"
                value={formatNumber(g.sv1_clients?.count ?? 0)}
              />
              <MetricCard label="Uptime" value={formatUptime(g.uptime_secs)} />
              <MetricCard
                label="Service"
                value="TProxy"
                hint="TRANSLATOR_SV2 0.2.5"
              />
            </div>
          )}
        </QueryGuard>
      </section>

      <section>
        <SectionHeader
          title="Upstream channel"
          subtitle="SV2 link to the pool"
          index="02"
          right={<LastUpdated query={server} />}
        />
        <QueryGuard query={server} skeleton={<MetricGridSkeleton count={3} />}>
          {(s) => (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <MetricCard
                label="Channels (extended)"
                value={formatNumber(s.extended_channels_count)}
              />
              <MetricCard
                label="Channels (standard)"
                value={formatNumber(s.standard_channels_count)}
              />
              <MetricCard
                label="Upstream hashrate"
                value={formatHashrate(s.total_hashrate)}
                trend={upstreamTrend}
                trendTone="success"
              />
            </div>
          )}
        </QueryGuard>
      </section>

      <section>
        <SectionHeader
          title="Share telemetry"
          subtitle="Accept / reject totals across all miners"
          index="03"
          right={<LastUpdated query={sv1} />}
        />
        <QueryGuard query={sv1} skeleton={<MetricGridSkeleton count={4} />}>
          {() =>
            totals && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <MetricCard
                  label="Submitted"
                  value={formatNumber(totals.submitted)}
                />
                <MetricCard
                  label="Accepted"
                  value={formatNumber(totals.accepted)}
                  tone="positive"
                />
                <MetricCard
                  label="Rejected"
                  value={formatNumber(totals.rejected)}
                  tone={totals.rejected > 0 ? 'warning' : 'default'}
                />
                <MetricCard
                  label="Accept rate"
                  value={formatPercent(totals.acceptRate)}
                  tone={
                    totals.acceptRate == null
                      ? 'default'
                      : totals.acceptRate > 0.99
                      ? 'positive'
                      : totals.acceptRate > 0.95
                      ? 'warning'
                      : 'negative'
                  }
                />
              </div>
            )
          }
        </QueryGuard>
      </section>

      <section>
        <SectionHeader
          title="Connected SV1 miners"
          subtitle="Workers connected to TProxy"
          index="04"
          right={<LastUpdated query={sv1} />}
        />
        <QueryGuard query={sv1} skeleton={<TableSkeleton rows={4} columns={6} />}>
          {(c) => (
            <DataTable<Sv1ClientInfo>
              rowKey={(r) => r.id}
              empty="No SV1 miners connected yet."
              rows={c.clients}
              columns={[
                { key: 'worker', header: 'Worker', render: (r) => r.worker_name },
                {
                  key: 'hashrate',
                  header: 'Hashrate',
                  render: (r) => formatHashrate(r.hashrate),
                },
                {
                  key: 'diff',
                  header: 'Difficulty',
                  render: (r) => formatNumber(r.difficulty),
                },
                {
                  key: 'accepted',
                  header: 'Accepted',
                  render: (r) => formatNumber(r.shares_accepted),
                },
                {
                  key: 'rejected',
                  header: 'Rejected',
                  render: (r) =>
                    r.shares_rejected > 0 ? (
                      <span className="text-warning">
                        {formatNumber(r.shares_rejected)}
                      </span>
                    ) : (
                      formatNumber(r.shares_rejected)
                    ),
                },
                {
                  key: 'last',
                  header: 'Last share',
                  render: (r) => (
                    <span className="text-muted">{r.last_share_at ?? '—'}</span>
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
