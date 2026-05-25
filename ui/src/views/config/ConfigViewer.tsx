import { useConfig } from '~/api/hooks'
import { KvTable } from '~/views/shared/KvTable'
import { SectionHeader } from '~/views/shared/SectionHeader'
import { QueryGuard } from '~/views/shared/QueryGuard'
import { LastUpdated } from '~/views/shared/LastUpdated'
import { KvSkeleton } from '~/views/shared/Skeleton'

export function ConfigViewer() {
  const config = useConfig()
  return (
    <div className="flex flex-col gap-4">
      <SectionHeader
        title="Configuration"
        subtitle="Read-only — change settings via the StartOS Configure action"
        index="01"
        right={<LastUpdated query={config} />}
      />
      <QueryGuard query={config} skeleton={<KvSkeleton rows={8} />}>
        {(c) => (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between text-[0.6875rem] uppercase tracking-[0.15em] font-mono text-muted-2">
              <span>Service: {c.service}</span>
              <span>
                Redacted:{' '}
                {c.redacted_keys.length > 0 ? c.redacted_keys.join(', ') : 'none'}
              </span>
            </div>
            <KvTable data={c.raw as Record<string, never>} />
            <div className="border-l-2 border-primary pl-3 py-1.5 text-[0.6875rem] uppercase tracking-[0.15em] font-mono text-muted">
              ↳ To modify any value, return to StartOS → Service →{' '}
              <span className="text-primary">Configure</span>
            </div>
          </div>
        )}
      </QueryGuard>
    </div>
  )
}
