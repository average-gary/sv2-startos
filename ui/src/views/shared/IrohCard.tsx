import { useIrohMetrics } from '~/api/hooks'
import { MetricCard } from './MetricCard'
import { QueryGuard } from './QueryGuard'
import { MetricGridSkeleton } from './Skeleton'
import { CopyableValue } from './CopyButton'
import { StatusPill } from './StatusPill'
import { formatNumber, formatPercent } from '~/lib/format'
import type {
  IrohActiveConnectionsRow,
  IrohConnectionsTotalRow,
  IrohFallbackTotalRow,
  IrohMetrics,
} from '~/api/client'

export type IrohRole = 'pool' | 'jds' | 'jdc' | 'tproxy'

interface Props {
  role: IrohRole
  /** Optional authority pubkey (e.g. cfg.authority_public_key from /config). */
  authorityPubkey?: string
}

interface Aggregates {
  activeDirect: number
  activeRelay: number
  activeTotal: number
  established: number
  attempts: number
  fallback: number
}

function aggregate(role: IrohRole, m: IrohMetrics): Aggregates {
  const active = m.active_connections.filter(
    (r: IrohActiveConnectionsRow) => r.role === role,
  )
  const activeDirect = active
    .filter((r) => r.transport === 'iroh-direct')
    .reduce((acc, r) => acc + r.value, 0)
  const activeRelay = active
    .filter((r) => r.transport === 'iroh-relay')
    .reduce((acc, r) => acc + r.value, 0)

  const totals = m.connections_total.filter(
    (r: IrohConnectionsTotalRow) => r.role === role,
  )
  const attempts = totals.reduce((acc, r) => acc + r.value, 0)
  const established = totals
    .filter((r) => r.outcome === 'established')
    .reduce((acc, r) => acc + r.value, 0)

  const fallback = m.fallback_total
    .filter((r: IrohFallbackTotalRow) => r.role === role)
    .reduce((acc, r) => acc + r.value, 0)

  return {
    activeDirect,
    activeRelay,
    activeTotal: activeDirect + activeRelay,
    established,
    attempts,
    fallback,
  }
}

function modeLabel(agg: Aggregates): {
  label: string
  tone: 'success' | 'warning' | 'info' | 'muted'
} {
  if (agg.activeDirect > 0) {
    return { label: 'direct (hole-punched)', tone: 'success' }
  }
  if (agg.activeRelay > 0) {
    return { label: 'relayed via n0', tone: 'warning' }
  }
  return { label: 'idle (no connections)', tone: 'muted' }
}

/**
 * IrohCard — reusable iroh transport telemetry surface.
 * Renders nothing visible above the section header: callers wrap this in a
 * <section> with their own SectionHeader so dashboard indices stay coherent.
 */
export function IrohCard({ role, authorityPubkey }: Props) {
  const query = useIrohMetrics()

  return (
    <QueryGuard query={query} skeleton={<MetricGridSkeleton count={4} />}>
      {(data) => {
        if (!data.present) {
          return (
            <div className="bg-surface-2 border border-border rounded-md px-4 py-3.5 flex flex-col gap-2 relative overflow-hidden">
              <span
                aria-hidden
                className="absolute top-0 right-0 w-2 h-2 border-l border-b border-border-strong"
              />
              <div className="flex items-center gap-3">
                <StatusPill tone="muted">Iroh transport: disabled</StatusPill>
              </div>
              <span className="text-[0.6875rem] text-muted font-mono">
                Service is running over plain TCP. Enable iroh in StartOS Configure to
                expose a NAT-traversing endpoint.
              </span>
            </div>
          )
        }

        const agg = aggregate(role, data)
        const mode = modeLabel(agg)
        const successRate =
          agg.attempts > 0 ? agg.established / agg.attempts : null

        return (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <MetricCard
                label="Active connections"
                value={formatNumber(agg.activeTotal)}
                hint={`${agg.activeDirect} direct · ${agg.activeRelay} relay`}
                tone={agg.activeTotal > 0 ? 'positive' : 'default'}
              />
              <MetricCard
                label="Hole-punch success"
                value={formatPercent(successRate)}
                hint={`${formatNumber(agg.established)} of ${formatNumber(
                  agg.attempts,
                )} attempts`}
                tone={
                  successRate == null
                    ? 'default'
                    : successRate > 0.9
                    ? 'positive'
                    : successRate > 0.5
                    ? 'warning'
                    : 'negative'
                }
              />
              <MetricCard
                label="Fallback (TCP)"
                value={formatNumber(agg.fallback)}
                hint="Iroh→TCP failovers"
                tone={agg.fallback > 0 ? 'warning' : 'default'}
              />
              <MetricCard
                label="Handshake p50"
                value={
                  data.handshake_p50_ms == null
                    ? '—'
                    : `${data.handshake_p50_ms.toFixed(0)} ms`
                }
                hint="Approx. from histogram"
              />
            </div>

            <div className="bg-surface-2 border border-border rounded-md px-4 py-3.5 flex flex-col gap-2 relative overflow-hidden">
              <span
                aria-hidden
                className="absolute top-0 right-0 w-2 h-2 border-l border-b border-border-strong"
              />
              <div className="flex items-center gap-3 flex-wrap">
                <StatusPill tone={mode.tone}>{mode.label}</StatusPill>
                <span className="font-mono text-[0.6875rem] uppercase tracking-[0.15em] text-muted-2">
                  Role: {role}
                </span>
              </div>
              <span className="text-[0.6875rem] uppercase tracking-[0.15em] text-muted-2 font-mono mt-2">
                NodeId
              </span>
              <code className="font-mono text-[0.8125rem] text-muted bg-surface-3/40 border border-border rounded-sm px-2 py-1 break-all">
                NodeId: not yet exposed via API
              </code>
              <span className="text-[0.6875rem] text-muted font-mono">
                Identity endpoint pending — track via{' '}
                <span className="text-text/80">sv2_iroh_node_id_info</span>{' '}
                metric upstream.
              </span>
              {authorityPubkey && (
                <>
                  <span className="text-[0.6875rem] uppercase tracking-[0.15em] text-muted-2 font-mono mt-2">
                    Authority pubkey
                  </span>
                  <CopyableValue value={authorityPubkey} truncate />
                </>
              )}
            </div>
          </div>
        )
      }}
    </QueryGuard>
  )
}
