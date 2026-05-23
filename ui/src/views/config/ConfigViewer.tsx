import { useConfig } from '~/api/hooks'
import { KvTable } from '~/views/shared/KvTable'
import { SectionHeader } from '~/views/shared/SectionHeader'
import { QueryGuard } from '~/views/shared/QueryGuard'

export function ConfigViewer() {
  const config = useConfig()
  return (
    <div className="flex flex-col gap-4">
      <SectionHeader
        title="Configuration"
        subtitle="Read-only. To change settings, use the Configure action in StartOS."
      />
      <QueryGuard query={config}>
        {(c) => (
          <div className="flex flex-col gap-3">
            <p className="text-xs text-muted">
              Loaded {c.loaded_at}. Redacted: {c.redacted_keys.join(', ') || 'none'}.
            </p>
            <KvTable data={c.raw as Record<string, never>} />
          </div>
        )}
      </QueryGuard>
    </div>
  )
}
