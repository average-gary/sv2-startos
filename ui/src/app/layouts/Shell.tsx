import { NavLink, Outlet } from 'react-router-dom'
import { SERVICE_LABEL, SERVICE_TAG, SERVICE } from '~/lib/service'
import { useHealth } from '~/api/hooks'
import { StatusPill } from '~/views/shared/StatusPill'

export function Shell() {
  const health = useHealth()
  const tone = health.isError ? 'error' : health.isLoading ? 'muted' : 'success'
  const label = health.isError ? 'Disconnected' : health.isLoading ? 'Connecting' : 'Online'

  return (
    <div className="min-h-full flex flex-col">
      <header className="border-b border-border bg-surface-2">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-primary font-bold text-lg tracking-tight">PIONEER HASH</span>
            <span className="text-muted">/</span>
            <span className="font-medium">{SERVICE_LABEL[SERVICE]}</span>
            <span className="text-xs text-muted bg-surface-3 px-2 py-0.5 rounded font-mono">
              {SERVICE_TAG[SERVICE]}
            </span>
          </div>
          <StatusPill tone={tone}>{label}</StatusPill>
        </div>
        <nav className="max-w-7xl mx-auto px-6 flex gap-1">
          {(
            [
              ['/', 'Dashboard'],
              ['/config', 'Config'],
            ] as const
          ).map(([to, label]) => (
            <NavLink
              key={to}
              to={to}
              end
              className={({ isActive }) =>
                `px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  isActive
                    ? 'border-primary text-text'
                    : 'border-transparent text-muted hover:text-text'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-6">
        <Outlet />
      </main>
      <footer className="border-t border-border text-xs text-muted py-3">
        <div className="max-w-7xl mx-auto px-6 flex justify-between">
          <span>To change settings, use the Configure action in StartOS.</span>
          <span>v0.1.0</span>
        </div>
      </footer>
    </div>
  )
}
