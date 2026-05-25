import React from 'react'

interface State {
  error: Error | null
}

/**
 * Field-Station-styled crash handler. Wraps each route so a render
 * error in one dashboard doesn't blank the whole shell.
 */
export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Visible in StartOS logs viewer for ops triage.
    console.error('[Pioneer Hash UI] render fault:', error, info.componentStack)
  }

  reset = () => this.setState({ error: null })

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="border border-error/40 bg-error/5 rounded-md px-5 py-6 max-w-2xl">
        <div className="text-[0.6875rem] uppercase tracking-[0.2em] text-error font-mono font-bold mb-2">
          ⚠ Field Station fault
        </div>
        <div className="font-display italic text-xl text-text-strong mb-3">
          The instrument panel failed to render
        </div>
        <pre className="font-mono text-[0.8125rem] text-text/90 whitespace-pre-wrap break-all bg-surface-2 border border-border rounded-sm px-3 py-2 mb-4">
          {this.state.error.message}
        </pre>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={this.reset}
            className="font-mono text-[0.6875rem] uppercase tracking-[0.15em] font-bold border border-primary text-primary hover:bg-primary hover:text-surface px-3 py-1.5 rounded-sm transition-colors"
          >
            Retry
          </button>
          <span className="text-[0.6875rem] uppercase tracking-[0.15em] text-muted-2 font-mono">
            ↳ Check StartOS logs for the full stack
          </span>
        </div>
      </div>
    )
  }
}
