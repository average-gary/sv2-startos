import { useGlobal, useServer, useConfig } from '~/api/hooks'
import { MetricCard } from '~/views/shared/MetricCard'
import { SectionHeader } from '~/views/shared/SectionHeader'
import { QueryGuard } from '~/views/shared/QueryGuard'
import { StatusPill } from '~/views/shared/StatusPill'
import { formatHashrate, formatNumber, formatUptime } from '~/lib/format'

const MODE_TONE: Record<string, 'success' | 'warning' | 'info'> = {
  FULLTEMPLATE: 'success',
  COINBASEONLY: 'info',
  SOLOMINING: 'warning',
}

export function JdcDashboard() {
  const global = useGlobal()
  const server = useServer()
  const config = useConfig()

  const mode = (config.data?.raw.mode as string | undefined)?.toUpperCase() ?? 'FULLTEMPLATE'

  return (
    <div className="flex flex-col gap-8">
      <section>
        <SectionHeader
          title="Mode"
          subtitle="JDC operating mode (set via StartOS Configure action)"
        />
        <div className="bg-surface-2 border border-border rounded-lg px-4 py-3 flex items-center gap-3">
          <StatusPill tone={MODE_TONE[mode] ?? 'muted'}>{mode}</StatusPill>
          <span className="text-sm text-muted">
            {mode === 'FULLTEMPLATE' && 'Declaring full templates to upstream JDS.'}
            {mode === 'COINBASEONLY' && 'Declaring coinbase only.'}
            {mode === 'SOLOMINING' && 'Bypassing pool/JDS — solo mining direct to Bitcoin Core.'}
          </span>
        </div>
      </section>

      <section>
        <SectionHeader title="Overview" subtitle="Live JDC stats" />
        <QueryGuard query={global}>
          {(g) => (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <MetricCard
                label="Local hashrate"
                value={formatHashrate(g.sv2_clients?.total_hashrate)}
              />
              <MetricCard label="Connected miners" value={formatNumber(g.sv2_clients?.count ?? 0)} />
              <MetricCard label="Uptime" value={formatUptime(g.uptime_secs)} />
              <MetricCard label="Service" value="JDC" />
            </div>
          )}
        </QueryGuard>
      </section>

      <section>
        <SectionHeader title="Upstream pool" subtitle="Pool the JDC is currently connected to" />
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
    </div>
  )
}
