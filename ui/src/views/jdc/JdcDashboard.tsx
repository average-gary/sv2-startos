import { useGlobal, useServer, useClients, useConfig } from '~/api/hooks'
import { MetricCard } from '~/views/shared/MetricCard'
import { DataTable } from '~/views/shared/DataTable'
import { SectionHeader } from '~/views/shared/SectionHeader'
import { QueryGuard } from '~/views/shared/QueryGuard'
import { LastUpdated } from '~/views/shared/LastUpdated'
import { StatusPill } from '~/views/shared/StatusPill'
import { CopyableValue } from '~/views/shared/CopyButton'
import { MetricGridSkeleton, TableSkeleton } from '~/views/shared/Skeleton'
import { formatHashrate, formatNumber, formatUptime } from '~/lib/format'
import type { Sv2ClientMetadata } from '~/api/client'

const MODE_TONE: Record<string, 'success' | 'warning' | 'info'> = {
  FULLTEMPLATE: 'success',
  COINBASEONLY: 'info',
  SOLOMINING: 'warning',
}

const MODE_BLURB: Record<string, string> = {
  FULLTEMPLATE:
    'Declaring full block templates upstream. JDS validates each template; pool builds blocks from your declarations.',
  COINBASEONLY:
    'Declaring only the coinbase output. Pool retains template control; you retain reward addressability.',
  SOLOMINING:
    'Bypassing the upstream pool and JDS. Templates pulled directly from the local Bitcoin Core. All-or-nothing rewards.',
}

export function JdcDashboard() {
  const global = useGlobal()
  const server = useServer()
  const clients = useClients(0, 50)
  const config = useConfig()

  const cfg = config.data?.raw as
    | {
        listening_address?: string
        mode?: string
        jdc_signature?: string
        coinbase_reward_script?: string
      }
    | undefined

  const mode = (cfg?.mode ?? 'FULLTEMPLATE').toUpperCase()

  return (
    <div className="flex flex-col gap-10">
      <section>
        <SectionHeader
          title="Operating mode"
          subtitle="Set via the StartOS Configure action"
          index="01"
        />
        <QueryGuard query={config} skeleton={<MetricGridSkeleton count={1} />}>
          {() => (
            <div className="bg-surface-2 border border-border rounded-md px-5 py-4 relative overflow-hidden">
              <span
                aria-hidden
                className="absolute top-0 right-0 w-2 h-2 border-l border-b border-border-strong"
              />
              <div className="flex items-center gap-3 mb-2">
                <StatusPill tone={MODE_TONE[mode] ?? 'muted'}>{mode}</StatusPill>
                <span className="font-mono text-[0.6875rem] uppercase tracking-[0.15em] text-muted-2">
                  Signature: {cfg?.jdc_signature ?? '—'}
                </span>
              </div>
              <p className="text-text/90 text-sm">
                {MODE_BLURB[mode] ??
                  'Unknown mode. Verify configuration via StartOS.'}
              </p>
            </div>
          )}
        </QueryGuard>
      </section>

      <section>
        <SectionHeader
          title="Overview"
          subtitle="Live JDC stats"
          index="02"
          right={<LastUpdated query={global} />}
        />
        <QueryGuard query={global} skeleton={<MetricGridSkeleton count={4} />}>
          {(g) => (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <MetricCard
                label="Local hashrate"
                value={formatHashrate(g.sv2_clients?.total_hashrate)}
                hint="Pushed upstream"
              />
              <MetricCard
                label="Downstream miners"
                value={formatNumber(g.sv2_clients?.count ?? 0)}
              />
              <MetricCard label="Uptime" value={formatUptime(g.uptime_secs)} />
              <MetricCard label="Service" value="JDC" hint="JD_CLIENT_SV2 0.2.0" />
            </div>
          )}
        </QueryGuard>
      </section>

      {mode !== 'SOLOMINING' && (
        <section>
          <SectionHeader
            title="Upstream channel"
            subtitle="Pool the JDC is talking to"
            index="03"
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
                />
              </div>
            )}
          </QueryGuard>
        </section>
      )}

      <section>
        <SectionHeader
          title="Connection"
          subtitle="Where downstreams meet the JDC"
          index={mode === 'SOLOMINING' ? '03' : '04'}
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
                  Listening address
                </span>
                <CopyableValue value={cfg?.listening_address ?? ''} />
                <span className="text-[0.6875rem] text-muted font-mono">
                  Downstream translators / miners connect here
                </span>
              </div>
              <div className="bg-surface-2 border border-border rounded-md px-4 py-3.5 flex flex-col gap-2 relative overflow-hidden">
                <span
                  aria-hidden
                  className="absolute top-0 right-0 w-2 h-2 border-l border-b border-border-strong"
                />
                <span className="text-[0.6875rem] uppercase tracking-[0.15em] text-muted-2 font-mono">
                  Coinbase reward
                </span>
                <CopyableValue value={cfg?.coinbase_reward_script ?? ''} truncate />
                <span className="text-[0.6875rem] text-muted font-mono">
                  Used in {mode === 'SOLOMINING' ? 'all blocks' : 'solo-mining fallback'}
                </span>
              </div>
            </div>
          )}
        </QueryGuard>
      </section>

      <section>
        <SectionHeader
          title="Downstream miners"
          subtitle="Connected SV2 clients"
          index={mode === 'SOLOMINING' ? '04' : '05'}
          right={<LastUpdated query={clients} />}
        />
        <QueryGuard query={clients} skeleton={<TableSkeleton rows={4} columns={4} />}>
          {(c) => (
            <DataTable<Sv2ClientMetadata>
              rowKey={(r) => r.id}
              empty="No downstream miners connected yet."
              rows={c.clients}
              columns={[
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
