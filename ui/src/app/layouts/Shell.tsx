import { NavLink, Outlet } from 'react-router-dom'
import { SERVICE_LABEL, SERVICE_TAG, SERVICE } from '~/lib/service'
import { useHealth } from '~/api/hooks'
import { StatusPill } from '~/views/shared/StatusPill'

// Build station code from the service tag — feels like a base callsign.
const STATION_CODES: Record<typeof SERVICE, string> = {
  pool: 'PH-01',
  translator: 'PH-02',
  jdc: 'PH-03',
}

export function Shell() {
  const health = useHealth()
  const tone = health.isError ? 'error' : health.isLoading ? 'muted' : 'success'
  const label = health.isError ? 'OFFLINE' : health.isLoading ? 'LINKING' : 'LIVE'

  return (
    <div className="min-h-full flex flex-col relative">
      {/* Chart-paper grid overlay — fixed, subtle, never obstructs. */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)',
          backgroundSize: '32px 32px',
          color: '#E8E2D5',
        }}
      />

      {/* Beacon stripe — single line of brand color across the very top */}
      <div className="h-[2px] bg-primary relative z-10" />

      <header className="border-b border-border bg-surface-2 relative z-10">
        <div className="max-w-7xl mx-auto px-6 pt-5 pb-3 flex items-end justify-between gap-6">
          <div className="flex items-center gap-4">
            {/* Logo lockup — currentColor follows brand */}
            <img
              src="/pioneer-hash-lockup.svg"
              alt="Pioneer Hash"
              className="h-10 w-auto text-primary"
              style={{ color: 'var(--ph-primary, #D9923B)' }}
            />
          </div>

          <div className="flex items-center gap-6">
            {/* Station identification — feels like a desk plate */}
            <div className="hidden md:flex flex-col items-end leading-tight">
              <span className="text-[0.6875rem] uppercase tracking-[0.2em] text-muted-2">
                Station
              </span>
              <span className="font-mono text-sm font-bold text-text-strong">
                {STATION_CODES[SERVICE]} · {SERVICE_TAG[SERVICE]}
              </span>
            </div>
            <StatusPill tone={tone}>{label}</StatusPill>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 pb-2 flex items-baseline justify-between">
          <h1 className="font-display text-[1.375rem] italic text-text-strong tracking-tight">
            {SERVICE_LABEL[SERVICE]}
          </h1>
          <span className="hidden sm:block text-[0.6875rem] uppercase tracking-[0.2em] text-muted-2 font-mono">
            Ad Ultra Hash
          </span>
        </div>

        <nav className="max-w-7xl mx-auto px-6 flex gap-1 border-t border-border">
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
                `px-4 py-2.5 text-xs font-mono font-bold uppercase tracking-[0.15em] border-b-2 -mb-px transition-colors ${
                  isActive
                    ? 'border-primary text-text-strong'
                    : 'border-transparent text-muted hover:text-text'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 relative z-10">
        <Outlet />
      </main>

      <footer className="border-t border-border text-[0.6875rem] py-3 relative z-10 bg-surface-2/40">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center font-mono uppercase tracking-[0.15em] text-muted-2">
          <span>↳ Configure via StartOS action</span>
          <span className="flex items-center gap-2">
            <span className="inline-block w-1 h-1 rounded-full bg-primary" />
            Pioneer Hash · v0.1.0
          </span>
        </div>
      </footer>
    </div>
  )
}
