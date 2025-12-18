import React from 'react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    // Log to console and can be extended to report to an external service
    console.error('Unhandled error caught by ErrorBoundary:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="card max-w-2xl text-center">
            <h2 className="text-2xl font-bold mb-2">Something went wrong</h2>
            <p className="text-sm mb-4">An unexpected error occurred while rendering the app.</p>
            <details className="text-xs text-left p-3 bg-[var(--card-hover)] rounded-md" style={{ whiteSpace: 'pre-wrap' }}>
              {String(this.state.error && this.state.error.stack ? this.state.error.stack : this.state.error)}
            </details>
            <div className="mt-4">
              <button
                onClick={() => window.location.reload()}
                className="btn-primary"
              >
                Reload
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
