import { Component, type ReactNode } from 'react'

// App-level error boundary so a render error shows a message instead of a blank
// white screen (and is recoverable with a reload).
export class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state: { error: Error | null } = { error: null }

  static getDerivedStateFromError(error: Error): { error: Error } {
    return { error }
  }

  render(): ReactNode {
    if (this.state.error) {
      return (
        <div className="container py-5 text-center">
          <h4 className="mb-2">Something went wrong</h4>
          <p className="text-muted">{this.state.error.message}</p>
          <button className="btn btn-primary btn-sm" onClick={() => window.location.assign('/')}>
            Reload
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
